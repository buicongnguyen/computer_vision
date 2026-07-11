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
    assert len(required) == 11
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


def test_quiz_bank_has_72_unique_well_formed_questions() -> None:
    questions = load_quiz_questions()
    assert len(questions) == QUIZ_EXPECTED_COUNT == 72
    assert len({question["id"] for question in questions}) == 72
    assert all(len(question["choices"]) == 4 for question in questions)
    _assert_clean(validate_quiz_questions(questions))


def test_coding_bank_has_30_unique_well_formed_tasks() -> None:
    tasks = load_coding_tasks()
    assert len(tasks) == CODING_EXPECTED_COUNT == 30
    assert len({task["id"] for task in tasks}) == 30
    _assert_clean(validate_coding_tasks(tasks))
