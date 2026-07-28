"""Validate local Markdown links and required repository entry points."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r"(?<!!)\[[^]]+\]\(([^)]+)\)")
REQUIRED = (
    "README.md",
    "START_HERE.md",
    "ROADMAP.md",
    "SKILL_MATRIX.md",
    "curriculum/00_diagnostic.md",
    "interview/README.md",
    "projects/PORTFOLIO_RUBRIC.md",
)


def local_target(raw: str) -> str | None:
    target = raw.strip().split(maxsplit=1)[0].strip("<>")
    if target.startswith(("http://", "https://", "mailto:", "#")):
        return None
    return target.split("#", maxsplit=1)[0]


def main() -> int:
    failures: list[str] = []
    for relative in REQUIRED:
        if not (ROOT / relative).is_file():
            failures.append(f"missing required file: {relative}")

    markdown_files = sorted(ROOT.rglob("*.md"))
    for source in markdown_files:
        if source.stat().st_size == 0:
            failures.append(f"empty Markdown file: {source.relative_to(ROOT)}")
            continue
        text = source.read_text(encoding="utf-8")
        for raw in LINK.findall(text):
            target = local_target(raw)
            if not target:
                continue
            path = (source.parent / target).resolve()
            if not path.exists():
                failures.append(
                    f"broken link in {source.relative_to(ROOT)}: {target}"
                )

    print(f"Checked {len(markdown_files)} Markdown files.")
    if failures:
        print("Validation failures:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print("All required files and local Markdown links are valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

