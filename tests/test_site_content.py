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

CHECKPOINTS = (
    ("theory", "theory.html"),
    ("perception", "perception.html"),
    ("calibration", "calibration.html"),
    ("bev", "bev.html"),
    ("modern-cv", "modern-cv.html"),
    ("yolo-evolution", "yolo-evolution.html"),
    ("autonomous-driving", "autonomous-driving.html"),
    ("autonomy-reasoning", "autonomy-reasoning.html"),
    ("practice", "practice.html"),
    ("coding", "coding.html"),
    ("projects", "projects.html"),
)
READER_ORDER = (
    "index.html",
    "theory.html",
    "perception.html",
    "calibration.html",
    "bev.html",
    "modern-cv.html",
    "yolo-evolution.html",
    "current-topics.html",
    "autonomous-driving.html",
    "autonomy-reasoning.html",
    "practice.html",
    "coding.html",
    "projects.html",
    "sources.html",
)


def _assert_clean(issues: list[object]) -> None:
    assert not issues, "\n" + format_issues(issues)


def test_all_required_course_pages_exist() -> None:
    _assert_clean(validate_required_pages())
    required = {DOCS_DIR / name for name in REQUIRED_PAGE_NAMES}
    assert len(required) == 13
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


def test_book_reader_uses_one_complete_ordered_course_model() -> None:
    script = (DOCS_DIR / "site.js").read_text(encoding="utf-8")
    styles = (DOCS_DIR / "styles.css").read_text(encoding="utf-8")

    assert "var COURSE_CHAPTERS" in script
    assert "var BOOK_CHAPTERS" in script
    assert "var BOOK_PAGES" in script
    assert "var MILESTONES" in script

    for behavior in (
        "initializeReaderNavigation",
        "initializePageContents",
        "initializeBookPagination",
        "initializeReadingProgress",
        "BOOKMARK_STORAGE_KEY",
    ):
        assert behavior in script

    for selector in (
        ".reader-sidebar",
        ".reader-page-toc",
        ".reader-bookmark",
        ".reader-progress",
        "@media (max-width: 1180px)",
        "@media (prefers-reduced-motion: reduce)",
    ):
        assert selector in styles


def test_checkpoint_controls_match_the_canonical_mastery_path() -> None:
    expected_ids = tuple(checkpoint_id for checkpoint_id, _ in CHECKPOINTS)
    expected_set = set(expected_ids)
    index = (DOCS_DIR / "index.html").read_text(encoding="utf-8")
    index_ids = tuple(re.findall(r'data-milestone="([^"]+)"', index))
    assert index_ids == expected_ids
    assert "0 / 11" in index
    assert "Complete 11 more checkpoints" in index
    assert "0 / 9" not in index
    assert "Complete 9 more checkpoints" not in index

    all_controls: dict[str, list[str]] = {}
    for page in DOCS_DIR.glob("*.html"):
        all_controls[page.name] = re.findall(
            r'data-milestone="([^"]+)"',
            page.read_text(encoding="utf-8"),
        )

    found_ids = {
        checkpoint_id
        for page_ids in all_controls.values()
        for checkpoint_id in page_ids
    }
    assert found_ids == expected_set
    assert "autonomy" not in found_ids
    assert all_controls["current-topics.html"] == []
    assert all_controls["sources.html"] == []

    manual_routes = dict(CHECKPOINTS)
    manual_routes.pop("practice")
    manual_routes.pop("coding")
    for checkpoint_id, page_name in manual_routes.items():
        assert all_controls[page_name] == [checkpoint_id]

    automatic_controls = {
        checkpoint_id: re.search(
            rf'<input\b[^>]*data-milestone="{checkpoint_id}"[^>]*>',
            index,
        )
        for checkpoint_id in ("practice", "coding")
    }
    assert all(
        match and "disabled" in match.group(0)
        for match in automatic_controls.values()
    )


def test_study_hub_cards_follow_reader_order_and_label_non_checkpoints() -> None:
    index = (DOCS_DIR / "index.html").read_text(encoding="utf-8")
    curriculum = index.split(
        '<section class="section" aria-labelledby="curriculum-title">',
        maxsplit=1,
    )[1].split("</section>", maxsplit=1)[0]
    card_routes = tuple(
        re.findall(r'<a class="topic-card" href="([^"]+\.html)">', curriculum)
    )

    assert card_routes == READER_ORDER[1:]
    assert tuple(re.findall(r'<span class="card-index">(\d+)</span>', curriculum)) == tuple(
        f"{number:02d}" for number in range(1, 14)
    )
    assert "<h3>Current 3D topics</h3>" in curriculum
    assert '<span class="tag">optional</span>' in curriculum
    assert "<h3>Sources and attribution</h3>" in curriculum
    assert '<span class="tag">reference</span>' in curriculum
    assert "13 chapters" in index
    assert "six system studies" in index.lower()


def test_reader_runtime_has_accessible_single_controller_guards() -> None:
    script = (DOCS_DIR / "site.js").read_text(encoding="utf-8")

    for behavior in (
        "MOBILE_READER_QUERY",
        "setBackgroundIsolation",
        'sidebar.setAttribute("aria-modal", "true")',
        'sidebar.setAttribute("role", "dialog")',
        "ensureCurrentPageVisible",
        "initializeBookReader",
        "initializeNavigation",
    ):
        assert behavior in script


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


def test_autonomy_reasoning_learning_flow_is_integrated() -> None:
    source = (DOCS_DIR / "autonomy-reasoning.html").read_text(encoding="utf-8")
    required_ids = {
        "problem-framing",
        "thinking-loop",
        "data-contract-flow",
        "code-traces",
        "sequence",
        "state-machine",
        "logic-decisions",
        "fault-localization",
        "answer-structure",
        "practice",
        "sources",
    }
    missing_ids = {
        element_id
        for element_id in required_ids
        if f'id="{element_id}"' not in source
    }
    assert not missing_ids

    for page_name in (
        "index.html",
        "autonomous-driving.html",
        "coding.html",
        "sources.html",
    ):
        referring_source = (DOCS_DIR / page_name).read_text(encoding="utf-8")
        assert 'href="autonomy-reasoning.html' in referring_source


DIAGRAM_MANIFEST = {
    "autonomous-driving.html": {
        "closed-loop": "flow",
        "sensor-alignment": "flow",
        "geometry-transform": "geometry",
        "representation-choice": "decision",
        "slam-factor-graph": "graph",
        "planning-feedback": "flow",
    },
    "autonomy-reasoning.html": {
        "evidence-thinking": "flow",
        "async-data-flow": "flow",
        "typed-code-pipeline": "data-flow",
        "runtime-sequence": "sequence",
        "health-fallback-state": "state",
        "crosswalk-behavior-state": "state",
        "question-decision-tree": "decision",
        "overlay-debug-tree": "decision",
    },
    "bev.html": {
        "bev-lift-splat": "data-flow",
        "bev-representation-decision": "decision",
    },
    "calibration.html": {
        "calibration-projection": "data-flow",
        "online-calibration-state": "state",
    },
    "coding.html": {"coding-feedback": "feedback"},
    "current-topics.html": {"lingbot-streaming": "feedback"},
    "modern-cv.html": {
        "detr-set-prediction": "training-inference",
        "world-model-closed-loop": "feedback",
    },
    "perception.html": {"tracking-lifecycle": "state"},
    "practice.html": {"mcq-reasoning": "decision"},
    "yolo-evolution.html": {"yolo-selection": "decision"},
}


def _assert_diagrams_are_accessible_and_responsive(
    page_name: str,
    expected_diagrams: dict[str, str],
) -> None:
    source = (DOCS_DIR / page_name).read_text(encoding="utf-8")
    styles = (DOCS_DIR / "styles.css").read_text(encoding="utf-8")
    diagram_blocks = list(
        re.finditer(
            (
                r'<figure\b(?P<before>[^>]*)data-diagram="(?P<name>[^"]+)"'
                r'(?P<after>[^>]*)>(?P<body>.*?)</figure>'
            ),
            source,
            flags=re.DOTALL,
        )
    )
    assert {match.group("name") for match in diagram_blocks} == set(expected_diagrams)
    assert len(diagram_blocks) == len(expected_diagrams)

    all_ids = re.findall(r'\bid="([^"]+)"', source)
    assert len(all_ids) == len(set(all_ids))
    known_ids = set(all_ids)

    for match in diagram_blocks:
        diagram_name = match.group("name")
        figure_markup = match.group("before") + match.group("after")
        block = match.group("body")
        kind = re.search(r'data-diagram-kind="([^"]+)"', figure_markup)
        assert kind, diagram_name
        assert kind.group(1) == expected_diagrams[diagram_name]
        assert 'data-print-view="summary"' in figure_markup

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
        view_box = re.search(
            r'viewBox="(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+'
            r'(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)"',
            svg_markup,
        )
        assert view_box, diagram_name
        assert float(view_box.group(3)) > 0
        assert float(view_box.group(4)) > 0

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
        assert re.search(
            r'<figcaption\s+id="[^"]+">.*?<strong>[^<]+</strong>.*?</figcaption>',
            block,
            re.DOTALL,
        )

        mobile = re.search(
            (
                r'<(?:ol|ul)\b(?P<before>[^>]*)class="(?P<classes>[^"]*'
                r'\bdiagram-mobile-flow\b[^"]*)"(?P<after>[^>]*)>'
            ),
            block,
        )
        assert mobile, diagram_name
        mobile_markup = mobile.group("before") + mobile.group("after")
        mobile_classes = set(mobile.group("classes").split())
        assert re.search(r'aria-label="[^"]+"', mobile_markup)
        assert mobile_classes.intersection(
            {"diagram-mobile-flow--graph", "diagram-mobile-flow--sequence"}
        )
        if expected_diagrams[diagram_name] == "sequence":
            assert "diagram-mobile-flow--sequence" in mobile_classes
        if expected_diagrams[diagram_name] in {
            "decision",
            "feedback",
            "graph",
            "state",
            "training-inference",
        }:
            assert "diagram-mobile-flow--graph" in mobile_classes
        if "diagram-mobile-flow--graph" in mobile_classes:
            mobile_list = re.search(
                r'<(?:ol|ul)\b[^>]*\bdiagram-mobile-flow--graph\b[^>]*>'
                r"(?P<body>.*?)</(?:ol|ul)>",
                block,
                flags=re.DOTALL,
            )
            assert mobile_list, diagram_name
            assert (
                'data-relation="' in mobile_list.group("body")
                or "diagram-mobile-transition" in mobile_list.group("body")
            ), f"{diagram_name} loses branch relations in its mobile summary"

        svg_block = re.search(r"<svg\b.*?</svg>", block, flags=re.DOTALL)
        assert svg_block, diagram_name
        marker_ids = set(
            re.findall(r'<marker\b[^>]*id="([^"]+)"', svg_block.group(0))
        )
        marker_references = set(
            re.findall(r'url\(#([^)]+)\)', svg_block.group(0))
        )
        assert marker_references.issubset(marker_ids), (
            diagram_name,
            marker_references.difference(marker_ids),
        )
        assert not re.search(r'(?:fill|stroke)="#[0-9a-fA-F]{3,8}"', block)
        assert not re.search(r'<(?:svg|path|rect|circle|polygon|text)\b[^>]*style=', block)

    for required_rule in (
        ".system-diagram__viewport",
        ".system-diagram__canvas",
        ".diagram-mobile-flow",
        ".diagram-mobile-flow--graph",
        ".diagram-mobile-flow--sequence",
        ".diagram-edge--feedback",
        '[data-overflow="true"]',
        "@media (max-width: 620px)",
        "@media (forced-colors: active)",
        "@media print",
    ):
        assert required_rule in styles


def test_all_diagrams_match_the_accessible_responsive_manifest() -> None:
    pages_with_diagrams = {
        path.name
        for path in DOCS_DIR.glob("*.html")
        if 'data-diagram="' in path.read_text(encoding="utf-8")
    }
    assert pages_with_diagrams == set(DIAGRAM_MANIFEST)
    assert sum(len(diagrams) for diagrams in DIAGRAM_MANIFEST.values()) == 25
    for page_name, expected_diagrams in DIAGRAM_MANIFEST.items():
        _assert_diagrams_are_accessible_and_responsive(
            page_name,
            expected_diagrams,
        )


def test_diagram_pages_stay_inside_static_rendering_budgets() -> None:
    for page_name in DIAGRAM_MANIFEST:
        source = (DOCS_DIR / page_name).read_text(encoding="utf-8")
        assert len(source.encode("utf-8")) < 180_000, page_name
        assert len(re.findall(r"<[A-Za-z][^>]*>", source)) < 1_900, page_name
        assert (
            len(
                re.findall(
                    r"<(?:path|rect|circle|ellipse|line|polyline|polygon|text)\b",
                    source,
                )
            )
            < 850
        ), page_name


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
