from tools.validate_site import (
    CODING_EXPECTED_COUNT,
    DOCS_DIR,
    EXPECTED_NAV_LINKS,
    QUIZ_EXPECTED_COUNT,
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


def test_all_nine_required_course_pages_exist() -> None:
    _assert_clean(validate_required_pages())
    required = {DOCS_DIR / name for name in REQUIRED_PAGE_NAMES}
    assert len(required) == 9
    assert all(path.is_file() for path in required)
    assert tuple(REQUIRED_PAGE_NAMES) == tuple(EXPECTED_NAV_LINKS)


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
