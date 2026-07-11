"""Validate the dependency-free GitHub Pages study site.

Only the Python standard library is used. JavaScript data is evaluated in a
time-limited Node vm context that exposes no filesystem, process, or network
objects to the project script.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable, Sequence
from urllib.parse import unquote, urlsplit


REPO_ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = REPO_ROOT / "docs"

EXPECTED_NAV_LINKS = (
    "theory.html",
    "perception.html",
    "calibration.html",
    "bev.html",
    "modern-cv.html",
    "practice.html",
    "coding.html",
    "projects.html",
    "sources.html",
)
REQUIRED_PAGE_NAMES = EXPECTED_NAV_LINKS

QUIZ_DATA_FILE = "quiz-data.js"
QUIZ_GLOBAL = "CV_QUIZ_QUESTIONS"
QUIZ_EXPECTED_COUNT = 72
QUIZ_REQUIRED_FIELDS = frozenset(
    {"id", "topic", "difficulty", "question", "choices", "answer", "explanation"}
)

CODING_DATA_FILE = "coding-data.js"
CODING_GLOBAL = "CV_CODING_TASKS"
CODING_EXPECTED_COUNT = 30
CODING_REQUIRED_FIELDS = frozenset(
    {
        "id",
        "title",
        "track",
        "difficulty",
        "minutes",
        "language",
        "prompt",
        "contract",
        "tests",
        "hints",
        "evidence",
    }
)

EXTERNAL_SCHEMES = frozenset({"http", "https", "mailto", "tel"})
SITE_PREFIX = "/computer_vision"
MACHINE_ROOT_RE = re.compile(
    r"^/(?:Users|home|tmp|var|private|mnt|Volumes)(?:/|$)", re.IGNORECASE
)
WINDOWS_ABSOLUTE_RE = re.compile(r"^[A-Za-z]:[\\/]")

NODE_ARRAY_EXTRACTOR = r"""
const fs = require("fs");
const vm = require("vm");
const file = process.argv[1];
const globalName = process.argv[2];
const source = fs.readFileSync(file, "utf8");
const sandbox = Object.create(null);
sandbox.window = Object.create(null);
vm.createContext(sandbox);
new vm.Script(source, { filename: file }).runInContext(
  sandbox,
  { timeout: 1500 }
);
const value = sandbox.window[globalName];
if (!Array.isArray(value)) {
  process.stderr.write(globalName + " is not an array");
  process.exit(3);
}
process.stdout.write(JSON.stringify(value));
"""


@dataclass(frozen=True, order=True)
class ValidationIssue:
    """One actionable validation failure."""

    path: Path
    message: str
    line: int = 0
    code: str = "site"

    def format(self, root: Path = REPO_ROOT) -> str:
        try:
            display = self.path.resolve().relative_to(root.resolve())
        except ValueError:
            display = self.path
        location = f"{display}:{self.line}" if self.line else str(display)
        return f"{location}: [{self.code}] {self.message}"


@dataclass(frozen=True)
class URLReference:
    tag: str
    attribute: str
    value: str
    line: int


@dataclass
class HTMLPageFacts:
    path: Path
    ids: dict[str, list[int]] = field(
        default_factory=lambda: defaultdict(list)
    )
    references: list[URLReference] = field(default_factory=list)
    nav_links: list[tuple[str, int]] = field(default_factory=list)
    meta_names: dict[str, str] = field(default_factory=dict)
    has_charset_meta: bool = False
    title_parts: list[str] = field(default_factory=list)
    main_count: int = 0
    h1_count: int = 0
    skip_links: list[tuple[str, int]] = field(default_factory=list)

    @property
    def title(self) -> str:
        return " ".join(" ".join(self.title_parts).split())


class _SiteHTMLParser(HTMLParser):
    def __init__(self, path: Path) -> None:
        super().__init__(convert_charrefs=True)
        self.facts = HTMLPageFacts(path=path)
        self._in_title = False
        self._primary_nav_depth = 0

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        tag = tag.lower()
        attributes = {name.lower(): value for name, value in attrs}
        line, _ = self.getpos()

        element_id = attributes.get("id")
        if element_id:
            self.facts.ids[element_id].append(line)

        if tag == "title":
            self._in_title = True
        elif tag == "meta":
            if attributes.get("charset"):
                self.facts.has_charset_meta = True
            name = (attributes.get("name") or "").strip().lower()
            if name:
                self.facts.meta_names[name] = (
                    attributes.get("content") or ""
                ).strip()
        elif tag == "main":
            self.facts.main_count += 1
        elif tag == "h1":
            self.facts.h1_count += 1

        if tag == "nav" and "data-primary-nav" in attributes:
            self._primary_nav_depth += 1

        classes = set((attributes.get("class") or "").split())
        if tag == "a" and "skip-link" in classes:
            self.facts.skip_links.append((attributes.get("href") or "", line))

        for attribute in ("href", "src"):
            value = attributes.get(attribute)
            if value is None:
                continue
            reference = URLReference(tag, attribute, value.strip(), line)
            self.facts.references.append(reference)
            if tag == "a" and attribute == "href" and self._primary_nav_depth:
                self.facts.nav_links.append((value.strip(), line))

    def handle_startendtag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self._in_title = False
        elif tag == "nav" and self._primary_nav_depth:
            self._primary_nav_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.facts.title_parts.append(data)


def parse_html_page(path: Path) -> HTMLPageFacts:
    """Parse one HTML file into reusable validation facts."""

    parser = _SiteHTMLParser(path)
    try:
        parser.feed(path.read_text(encoding="utf-8"))
        parser.close()
    except (OSError, UnicodeError) as error:
        raise ValueError(f"could not parse {path}: {error}") from error
    return parser.facts


def collect_html_pages(docs_dir: Path = DOCS_DIR) -> dict[Path, HTMLPageFacts]:
    """Parse every top-level HTML page in docs."""

    return {
        path.resolve(): parse_html_page(path)
        for path in sorted(docs_dir.glob("*.html"))
    }


def validate_required_pages(
    docs_dir: Path = DOCS_DIR,
    required_pages: Sequence[str] = REQUIRED_PAGE_NAMES,
) -> list[ValidationIssue]:
    """Check that the nine curriculum routes promised by the homepage exist."""

    return [
        ValidationIssue(
            docs_dir / page_name,
            f"required curriculum page is missing: {page_name}",
            code="required-page",
        )
        for page_name in required_pages
        if not (docs_dir / page_name).is_file()
    ]


def _nav_page_name(url: str) -> str | None:
    split = urlsplit(url)
    if split.scheme.lower() in EXTERNAL_SCHEMES or split.netloc:
        return None
    path = unquote(split.path).replace("\\", "/").rstrip("/")
    if path == SITE_PREFIX:
        return "index.html"
    if path.startswith(SITE_PREFIX + "/"):
        path = path[len(SITE_PREFIX) + 1 :]
    return Path(path).name if path else "index.html"


def _validate_page_structure(facts: HTMLPageFacts) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    for element_id, lines in facts.ids.items():
        if len(lines) > 1:
            issues.append(
                ValidationIssue(
                    facts.path,
                    f'duplicate id "{element_id}" appears on lines '
                    + ", ".join(str(line) for line in lines),
                    line=lines[1],
                    code="duplicate-id",
                )
            )

    if not facts.has_charset_meta:
        issues.append(
            ValidationIssue(
                facts.path,
                'missing <meta charset="utf-8">',
                code="required-meta",
            )
        )
    for name in ("viewport", "description"):
        if not facts.meta_names.get(name):
            issues.append(
                ValidationIssue(
                    facts.path,
                    f'missing non-empty <meta name="{name}">',
                    code="required-meta",
                )
            )
    if not facts.title:
        issues.append(
            ValidationIssue(
                facts.path, "missing non-empty <title>", code="required-title"
            )
        )
    if facts.main_count != 1:
        issues.append(
            ValidationIssue(
                facts.path,
                f"expected exactly one <main>, found {facts.main_count}",
                code="required-main",
            )
        )
    if facts.h1_count != 1:
        issues.append(
            ValidationIssue(
                facts.path,
                f"expected exactly one <h1>, found {facts.h1_count}",
                code="required-h1",
            )
        )
    if not any(href == "#main-content" for href, _ in facts.skip_links):
        issues.append(
            ValidationIssue(
                facts.path,
                'missing .skip-link with href="#main-content"',
                code="required-skip-link",
            )
        )
    if "main-content" not in facts.ids:
        issues.append(
            ValidationIssue(
                facts.path,
                'the skip-link target id="main-content" is missing',
                code="required-skip-target",
            )
        )

    names = [
        name
        for href, _ in facts.nav_links
        if (name := _nav_page_name(href)) is not None
    ]
    counts = Counter(names)
    for expected in EXPECTED_NAV_LINKS:
        if counts[expected] == 0:
            issues.append(
                ValidationIssue(
                    facts.path,
                    f"primary navigation is missing {expected}",
                    code="expected-nav",
                )
            )
        elif counts[expected] > 1:
            issues.append(
                ValidationIssue(
                    facts.path,
                    f"primary navigation links to {expected} "
                    f"{counts[expected]} times",
                    code="expected-nav",
                )
            )
    return issues


def _unsafe_reference_reason(value: str) -> str | None:
    decoded = unquote(value).strip()
    if decoded.lower().startswith("file:"):
        return "file URLs expose a machine-local path"
    if WINDOWS_ABSOLUTE_RE.match(decoded):
        return "Windows absolute paths are not portable"
    if decoded.startswith("\\\\"):
        return "UNC paths are not safe web targets"
    if "\\" in decoded:
        return "web paths must use forward slashes"
    if MACHINE_ROOT_RE.match(urlsplit(decoded).path):
        return "machine-root filesystem paths are not portable"
    return None


def _resolve_local_target(
    source_page: Path,
    reference: URLReference,
    docs_dir: Path,
    repo_root: Path,
) -> tuple[Path | None, str, ValidationIssue | None]:
    value = reference.value
    reason = _unsafe_reference_reason(value)
    if reason:
        issue = ValidationIssue(
            source_page,
            f'{reason}: {reference.attribute}="{value}"',
            line=reference.line,
            code="unsafe-path",
        )
        return None, "", issue

    split = urlsplit(value)
    scheme = split.scheme.lower()
    if scheme in EXTERNAL_SCHEMES or split.netloc:
        return None, "", None
    if scheme:
        issue = ValidationIssue(
            source_page,
            f'unsupported URL scheme in {reference.attribute}="{value}"',
            line=reference.line,
            code="unsafe-url",
        )
        return None, "", issue

    raw_path = unquote(split.path).replace("\\", "/")
    fragment = unquote(split.fragment)
    if raw_path.startswith("/"):
        if raw_path in {SITE_PREFIX, SITE_PREFIX + "/"}:
            target = docs_dir / "index.html"
        elif raw_path.startswith(SITE_PREFIX + "/"):
            target = docs_dir / raw_path[len(SITE_PREFIX) + 1 :]
        else:
            target = docs_dir / raw_path.lstrip("/")
    elif raw_path:
        target = source_page.parent / raw_path
    else:
        target = source_page

    if target.is_dir() or (raw_path.endswith("/") and not target.suffix):
        target = target / "index.html"
    resolved = target.resolve()
    try:
        resolved.relative_to(repo_root.resolve())
    except ValueError:
        issue = ValidationIssue(
            source_page,
            f'local target escapes the repository: {reference.attribute}="{value}"',
            line=reference.line,
            code="unsafe-path",
        )
        return None, fragment, issue
    return resolved, fragment, None


def _validate_local_references(
    pages: dict[Path, HTMLPageFacts],
    docs_dir: Path,
    repo_root: Path,
) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    for page_path, facts in pages.items():
        for reference in facts.references:
            if not reference.value:
                issues.append(
                    ValidationIssue(
                        page_path,
                        f"empty {reference.attribute} on <{reference.tag}>",
                        line=reference.line,
                        code="missing-target",
                    )
                )
                continue
            target, fragment, unsafe = _resolve_local_target(
                page_path, reference, docs_dir, repo_root
            )
            if unsafe:
                issues.append(unsafe)
                continue
            if target is None:
                continue
            if not target.is_file():
                issues.append(
                    ValidationIssue(
                        page_path,
                        f'{reference.attribute}="{reference.value}" points to '
                        f"missing local target {target.name}",
                        line=reference.line,
                        code="missing-target",
                    )
                )
                continue
            if not fragment or target.suffix.lower() not in {".html", ".htm"}:
                continue

            target_facts = pages.get(target.resolve())
            if target_facts is None:
                try:
                    target_facts = parse_html_page(target)
                except ValueError as error:
                    issues.append(
                        ValidationIssue(
                            page_path,
                            str(error),
                            line=reference.line,
                            code="missing-fragment",
                        )
                    )
                    continue
            if fragment not in target_facts.ids:
                issues.append(
                    ValidationIssue(
                        page_path,
                        f'{reference.attribute}="{reference.value}" points to '
                        f'missing fragment id="{fragment}"',
                        line=reference.line,
                        code="missing-fragment",
                    )
                )
    return issues


def validate_html_pages(
    docs_dir: Path = DOCS_DIR,
    repo_root: Path = REPO_ROOT,
) -> list[ValidationIssue]:
    """Validate structure, navigation, IDs, and local links for all HTML."""

    if not docs_dir.is_dir():
        return [
            ValidationIssue(
                docs_dir, "docs directory does not exist", code="missing-docs"
            )
        ]
    try:
        pages = collect_html_pages(docs_dir)
    except ValueError as error:
        return [ValidationIssue(docs_dir, str(error), code="html-parse")]
    if not pages:
        return [
            ValidationIssue(
                docs_dir, "no HTML pages found in docs", code="missing-html"
            )
        ]

    issues: list[ValidationIssue] = []
    for facts in pages.values():
        issues.extend(_validate_page_structure(facts))
    issues.extend(_validate_local_references(pages, docs_dir, repo_root))
    return sorted(issues)


def find_node() -> str | None:
    """Return the Node executable when available."""

    return shutil.which("node")


def validate_javascript_syntax(
    docs_dir: Path = DOCS_DIR,
    node_executable: str | None = None,
) -> list[ValidationIssue]:
    """Run Node syntax checks for every docs JavaScript file when available."""

    node = node_executable or find_node()
    if not node:
        return []
    issues: list[ValidationIssue] = []
    for path in sorted(docs_dir.glob("*.js")):
        try:
            result = subprocess.run(
                [node, "--check", str(path)],
                cwd=docs_dir.parent,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=15,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired) as error:
            issues.append(
                ValidationIssue(
                    path,
                    f"could not complete Node syntax check: {error}",
                    code="javascript-syntax",
                )
            )
            continue
        if result.returncode:
            output = (result.stderr or result.stdout).strip()
            detail = f": {output}" if output else ""
            issues.append(
                ValidationIssue(
                    path,
                    "Node syntax check failed" + detail,
                    code="javascript-syntax",
                )
            )
    return issues


def load_javascript_array(
    path: Path,
    global_name: str,
    node_executable: str | None = None,
) -> list[object]:
    """Load one JS global array in a restricted, time-limited Node context."""

    node = node_executable or find_node()
    if not node:
        raise RuntimeError(
            "Node.js is required to validate JavaScript data arrays"
        )
    if not path.is_file():
        raise RuntimeError(f"JavaScript data file is missing: {path}")
    try:
        result = subprocess.run(
            [node, "-e", NODE_ARRAY_EXTRACTOR, str(path.resolve()), global_name],
            cwd=path.parent,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=10,
            check=False,
            env={**os.environ, "NODE_NO_WARNINGS": "1"},
        )
    except (OSError, subprocess.TimeoutExpired) as error:
        raise RuntimeError(f"could not evaluate {path.name}: {error}") from error
    if result.returncode:
        detail = (result.stderr or result.stdout).strip()
        suffix = f": {detail}" if detail else ""
        raise RuntimeError(
            f"could not load {global_name} from {path.name}" + suffix
        )
    try:
        value = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise RuntimeError(
            f"{path.name} did not produce valid JSON: {error}"
        ) from error
    if not isinstance(value, list):
        raise RuntimeError(f"{global_name} in {path.name} is not an array")
    return value


def load_quiz_questions(
    docs_dir: Path = DOCS_DIR,
    node_executable: str | None = None,
) -> list[object]:
    return load_javascript_array(
        docs_dir / QUIZ_DATA_FILE, QUIZ_GLOBAL, node_executable
    )


def load_coding_tasks(
    docs_dir: Path = DOCS_DIR,
    node_executable: str | None = None,
) -> list[object]:
    return load_javascript_array(
        docs_dir / CODING_DATA_FILE, CODING_GLOBAL, node_executable
    )


def _missing_fields(item: dict[str, object], required: frozenset[str]) -> list[str]:
    return sorted(required.difference(item))


def _nonempty_string(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_quiz_questions(
    questions: Sequence[object],
    source: Path = DOCS_DIR / QUIZ_DATA_FILE,
) -> list[ValidationIssue]:
    """Validate the 72-question MCQ contract."""

    issues: list[ValidationIssue] = []
    if len(questions) != QUIZ_EXPECTED_COUNT:
        issues.append(
            ValidationIssue(
                source,
                f"expected {QUIZ_EXPECTED_COUNT} quiz questions, "
                f"found {len(questions)}",
                code="quiz-count",
            )
        )
    ids: list[str] = []
    for index, raw in enumerate(questions):
        label = f"quiz item {index + 1}"
        if not isinstance(raw, dict):
            issues.append(
                ValidationIssue(
                    source, f"{label} is not an object", code="quiz-schema"
                )
            )
            continue
        missing = _missing_fields(raw, QUIZ_REQUIRED_FIELDS)
        if missing:
            issues.append(
                ValidationIssue(
                    source,
                    f"{label} is missing fields: {', '.join(missing)}",
                    code="quiz-schema",
                )
            )
        question_id = raw.get("id")
        if _nonempty_string(question_id):
            ids.append(str(question_id))
            label = f'quiz item "{question_id}"'
        else:
            issues.append(
                ValidationIssue(
                    source, f"{label} has an invalid id", code="quiz-schema"
                )
            )
        for field_name in ("topic", "difficulty", "question", "explanation"):
            if not _nonempty_string(raw.get(field_name)):
                issues.append(
                    ValidationIssue(
                        source,
                        f"{label} has an invalid {field_name}",
                        code="quiz-schema",
                    )
                )
        choices = raw.get("choices")
        if (
            not isinstance(choices, list)
            or len(choices) != 4
            or not all(_nonempty_string(choice) for choice in choices)
        ):
            issues.append(
                ValidationIssue(
                    source,
                    f"{label} must have exactly four non-empty choices",
                    code="quiz-choices",
                )
            )
        answer = raw.get("answer")
        if type(answer) is not int or not 0 <= answer < 4:
            issues.append(
                ValidationIssue(
                    source,
                    f"{label} answer must be an integer from 0 through 3",
                    code="quiz-answer",
                )
            )
    for duplicate_id, count in Counter(ids).items():
        if count > 1:
            issues.append(
                ValidationIssue(
                    source,
                    f'quiz id "{duplicate_id}" appears {count} times',
                    code="quiz-id",
                )
            )
    return sorted(issues)


def validate_coding_tasks(
    tasks: Sequence[object],
    source: Path = DOCS_DIR / CODING_DATA_FILE,
) -> list[ValidationIssue]:
    """Validate the 30-exercise coding contract."""

    issues: list[ValidationIssue] = []
    if len(tasks) != CODING_EXPECTED_COUNT:
        issues.append(
            ValidationIssue(
                source,
                f"expected {CODING_EXPECTED_COUNT} coding tasks, found {len(tasks)}",
                code="coding-count",
            )
        )
    ids: list[str] = []
    for index, raw in enumerate(tasks):
        label = f"coding item {index + 1}"
        if not isinstance(raw, dict):
            issues.append(
                ValidationIssue(
                    source, f"{label} is not an object", code="coding-schema"
                )
            )
            continue
        missing = _missing_fields(raw, CODING_REQUIRED_FIELDS)
        if missing:
            issues.append(
                ValidationIssue(
                    source,
                    f"{label} is missing fields: {', '.join(missing)}",
                    code="coding-schema",
                )
            )
        task_id = raw.get("id")
        if _nonempty_string(task_id):
            ids.append(str(task_id))
            label = f'coding item "{task_id}"'
        else:
            issues.append(
                ValidationIssue(
                    source, f"{label} has an invalid id", code="coding-schema"
                )
            )
        for field_name in (
            "title",
            "track",
            "difficulty",
            "language",
            "prompt",
            "evidence",
        ):
            if not _nonempty_string(raw.get(field_name)):
                issues.append(
                    ValidationIssue(
                        source,
                        f"{label} has an invalid {field_name}",
                        code="coding-schema",
                    )
                )
        minutes = raw.get("minutes")
        if type(minutes) is not int or minutes <= 0:
            issues.append(
                ValidationIssue(
                    source,
                    f"{label} minutes must be a positive integer",
                    code="coding-schema",
                )
            )
        for field_name in ("contract", "tests", "hints"):
            values = raw.get(field_name)
            if (
                not isinstance(values, list)
                or not values
                or not all(_nonempty_string(value) for value in values)
            ):
                issues.append(
                    ValidationIssue(
                        source,
                        f"{label} {field_name} must be a non-empty string array",
                        code="coding-schema",
                    )
                )
    for duplicate_id, count in Counter(ids).items():
        if count > 1:
            issues.append(
                ValidationIssue(
                    source,
                    f'coding id "{duplicate_id}" appears {count} times',
                    code="coding-id",
                )
            )
    return sorted(issues)


def validate_data_files(
    docs_dir: Path = DOCS_DIR,
    node_executable: str | None = None,
) -> list[ValidationIssue]:
    """Load and validate both JavaScript data banks."""

    issues: list[ValidationIssue] = []
    quiz_path = docs_dir / QUIZ_DATA_FILE
    coding_path = docs_dir / CODING_DATA_FILE
    try:
        questions = load_quiz_questions(docs_dir, node_executable)
    except RuntimeError as error:
        issues.append(
            ValidationIssue(quiz_path, str(error), code="quiz-load")
        )
    else:
        issues.extend(validate_quiz_questions(questions, quiz_path))
    try:
        tasks = load_coding_tasks(docs_dir, node_executable)
    except RuntimeError as error:
        issues.append(
            ValidationIssue(coding_path, str(error), code="coding-load")
        )
    else:
        issues.extend(validate_coding_tasks(tasks, coding_path))
    return sorted(issues)


def validate_site(repo_root: Path = REPO_ROOT) -> list[ValidationIssue]:
    """Run every site validation pass and return all issues."""

    root = repo_root.resolve()
    docs_dir = root / "docs"
    issues: list[ValidationIssue] = []
    issues.extend(validate_required_pages(docs_dir))
    issues.extend(validate_html_pages(docs_dir, root))
    issues.extend(validate_javascript_syntax(docs_dir))
    issues.extend(validate_data_files(docs_dir))
    return sorted(issues)


def format_issues(
    issues: Iterable[ValidationIssue], root: Path = REPO_ROOT
) -> str:
    return "\n".join(issue.format(root) for issue in issues)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Validate the static computer-vision study site."
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=REPO_ROOT,
        help="Repository root containing docs (default: inferred).",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    issues = validate_site(args.repo_root)
    if issues:
        print(
            f"Site validation failed with {len(issues)} issue(s):",
            file=sys.stderr,
        )
        print(format_issues(issues, args.repo_root), file=sys.stderr)
        return 1
    docs_dir = args.repo_root / "docs"
    html_count = len(list(docs_dir.glob("*.html")))
    js_count = len(list(docs_dir.glob("*.js")))
    print(
        f"Validated {html_count} HTML pages, {js_count} JavaScript files, "
        f"{QUIZ_EXPECTED_COUNT} quiz questions, and "
        f"{CODING_EXPECTED_COUNT} coding tasks."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
