import re

from tools.validate_site import (
    CODING_EXPECTED_COUNT,
    DOCS_DIR,
    EXPECTED_NAV_LINKS,
    QUIZ_EXPECTED_COUNT,
    REPO_ROOT,
    REQUIRED_PAGE_NAMES,
    format_issues,
    load_coding_tasks,
    load_quiz_questions,
    validate_coding_tasks,
    validate_html_pages,
    validate_javascript_syntax,
    validate_quiz_questions,
    validate_required_pages,
)


def _assert_clean(issues: list[object]) -> None:
    assert not issues, "\n" + format_issues(issues)


def test_all_required_course_pages_exist() -> None:
    _assert_clean(validate_required_pages())
    required = {DOCS_DIR / name for name in REQUIRED_PAGE_NAMES}
    assert len(required) == 12
    assert all(path.is_file() for path in required)
    assert set(EXPECTED_NAV_LINKS).issubset(REQUIRED_PAGE_NAMES)


def test_public_course_copy_is_subject_first() -> None:
    banned_phrases = (
        "senior engineer",
        "senior-level",
        "portfolio",
        "role overlays",
        "google-oriented",
        "42dot-oriented",
    )
    combined = "\n".join(
        path.read_text(encoding="utf-8").lower()
        for path in (
            *DOCS_DIR.glob("*.html"),
            DOCS_DIR / "quiz-data.js",
            DOCS_DIR / "coding-data.js",
        )
    )
    banned_phrases += ("senior",)
    assert not [phrase for phrase in banned_phrases if phrase in combined]


def test_public_entry_guides_are_subject_first() -> None:
    banned_phrases = (
        "target role",
        "targeted resume",
        "portfolio project",
        "google-style",
        "42dot",
        "application sprint",
        "interview practice",
    )
    combined = "\n".join(
        (REPO_ROOT / name).read_text(encoding="utf-8").lower()
        for name in ("README.md", "START_HERE.md", "ROADMAP.md")
    )
    assert not [phrase for phrase in banned_phrases if phrase in combined]


def test_every_html_page_has_valid_structure_and_local_targets() -> None:
    pages = sorted(DOCS_DIR.glob("*.html"))
    assert {path.name for path in pages}.issuperset(REQUIRED_PAGE_NAMES)
    _assert_clean(validate_html_pages())


def test_all_javascript_files_parse() -> None:
    assert list(DOCS_DIR.glob("*.js"))
    _assert_clean(validate_javascript_syntax())


def test_autonomous_driving_learning_flow_is_integrated() -> None:
    page = DOCS_DIR / "autonomous-driving.html"
    source = page.read_text(encoding="utf-8")
    required_ids = {
        "scope",
        "master-flow",
        "sensor-frontends",
        "geometry-registration",
        "spatial-representations",
        "localization-slam",
        "prediction-planning",
        "architecture-choices",
        "evaluation",
        "study-sequence",
        "practice",
        "sources",
    }
    missing_ids = {
        element_id
        for element_id in required_ids
        if f'id="{element_id}"' not in source
    }
    assert not missing_ids

    for page_name in ("index.html", "bev.html", "modern-cv.html"):
        referring_source = (DOCS_DIR / page_name).read_text(encoding="utf-8")
        assert 'href="autonomous-driving.html' in referring_source


def test_autonomous_driving_diagrams_are_accessible_and_responsive() -> None:
    source = (DOCS_DIR / "autonomous-driving.html").read_text(encoding="utf-8")
    styles = (DOCS_DIR / "styles.css").read_text(encoding="utf-8")
    expected_diagrams = {
        "closed-loop",
        "sensor-alignment",
        "geometry-transform",
        "representation-choice",
        "slam-factor-graph",
        "planning-feedback",
    }
    diagram_blocks = list(
        re.finditer(
            r'<figure\b[^>]*data-diagram="([^"]+)"[^>]*>(.*?)</figure>',
            source,
            flags=re.DOTALL,
        )
    )
    assert {match.group(1) for match in diagram_blocks} == expected_diagrams
    assert len(diagram_blocks) == 6

    all_ids = re.findall(r'\bid="([^"]+)"', source)
    assert len(all_ids) == len(set(all_ids))
    known_ids = set(all_ids)

    for match in diagram_blocks:
        diagram_name, block = match.groups()
        viewport = re.search(
            r'<div\b([^>]*)class="[^"]*system-diagram__viewport[^"]*"([^>]*)>',
            block,
        )
        assert viewport, diagram_name
        viewport_markup = " ".join(viewport.groups())
        assert 'tabindex="0"' in viewport_markup
        assert 'role="region"' in viewport_markup
        assert re.search(r'aria-label="[^"]+"', viewport_markup)

        svg_match = re.search(r'<svg\b([^>]*)>', block)
        assert svg_match, diagram_name
        svg_markup = svg_match.group(1)
        assert "data-diagram-svg" in svg_markup
        assert 'role="img"' in svg_markup
        assert 'focusable="false"' in svg_markup
        assert re.search(r'viewBox="(?:-?\d+(?:\.\d+)?\s+){3}-?\d+(?:\.\d+)?"', svg_markup)

        labelled = re.search(r'aria-labelledby="([^"]+)"', svg_markup)
        described = re.search(r'aria-describedby="([^"]+)"', svg_markup)
        assert labelled and described, diagram_name
        referenced_ids = labelled.group(1).split() + described.group(1).split()
        assert set(referenced_ids).issubset(known_ids)
        title_id = labelled.group(1)
        assert re.search(
            rf'<title\s+id="{re.escape(title_id)}">\s*[^<]+\s*</title>', block
        )
        assert any(token.endswith("-desc") for token in described.group(1).split())
        assert any(token.endswith("-caption") for token in described.group(1).split())
        assert re.search(r'<desc\s+id="[^"]+">\s*[^<]+\s*</desc>', block)
        assert re.search(r'<figcaption\s+id="[^"]+">.*?[^<\s].*?</figcaption>', block, re.DOTALL)
        assert re.search(r'<ol\s+class="diagram-mobile-flow"\s+aria-label="[^"]+">', block)
        assert not re.search(r'(?:fill|stroke)="#[0-9a-fA-F]{3,8}"', block)

    for required_rule in (
        ".system-diagram__viewport",
        ".system-diagram__canvas",
        ".diagram-mobile-flow",
        ".diagram-edge--feedback",
        "@media (max-width: 620px)",
        "@media (forced-colors: active)",
    ):
        assert required_rule in styles


def test_quiz_bank_has_80_unique_well_formed_questions() -> None:
    questions = load_quiz_questions()
    assert len(questions) == QUIZ_EXPECTED_COUNT == 80
    assert len({question["id"] for question in questions}) == 80
    autonomy_questions = [
        question
        for question in questions
        if question["topic"] == "Autonomous Driving"
    ]
    assert len(autonomy_questions) == 8
    assert all(len(question["choices"]) == 4 for question in questions)
    _assert_clean(validate_quiz_questions(questions))


def test_coding_bank_has_36_unique_well_formed_tasks() -> None:
    tasks = load_coding_tasks()
    assert len(tasks) == CODING_EXPECTED_COUNT == 36
    assert len({task["id"] for task in tasks}) == 36
    autonomy_tasks = [
        task for task in tasks if task["track"] == "Autonomous Driving"
    ]
    assert len(autonomy_tasks) == 6
    _assert_clean(validate_coding_tasks(tasks))
