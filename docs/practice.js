(() => {
  "use strict";

  const questions = Array.isArray(window.CV_QUIZ_QUESTIONS)
    ? window.CV_QUIZ_QUESTIONS
    : [];
  const storageKey = "cv-academy-progress-v1";
  const elements = {
    topic: document.querySelector("#topic-filter"),
    difficulty: document.querySelector("#difficulty-filter"),
    mode: document.querySelector("#mode-filter"),
    counter: document.querySelector("#question-counter"),
    topicBadge: document.querySelector("#question-topic"),
    difficultyBadge: document.querySelector("#question-difficulty"),
    question: document.querySelector("#question-text"),
    choices: document.querySelector("#answer-choices"),
    form: document.querySelector("#answer-form"),
    submit: document.querySelector("#submit-answer"),
    next: document.querySelector("#next-question"),
    feedback: document.querySelector("#answer-feedback"),
    score: document.querySelector("#session-score"),
    mastery: document.querySelector("#mastery-grid"),
    shuffle: document.querySelector("#shuffle-questions"),
    resetSession: document.querySelector("#reset-session"),
    exportProgress: document.querySelector("#export-progress"),
    clearProgress: document.querySelector("#clear-progress")
  };

  if (!elements.form || questions.length === 0) return;

  let progress = loadProgress();
  let queue = [];
  let index = 0;
  let current = null;
  let answeredCurrent = false;
  let sessionAnswered = 0;
  let sessionCorrect = 0;

  function blankProgress() {
    return { version: 1, quiz: {}, coding: {}, pages: {}, lastUpdated: null };
  }

  function loadProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey));
      if (parsed && parsed.version === 1) {
        parsed.quiz ||= {};
        parsed.coding ||= {};
        parsed.pages ||= {};
        return parsed;
      }
    } catch {
      // Corrupt or unavailable local storage should not block practice.
    }
    return blankProgress();
  }

  function saveProgress() {
    progress.lastUpdated = new Date().toISOString();
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // Practice still works for the current session when storage is unavailable.
    }
    document.dispatchEvent(new CustomEvent("cv-progress-changed"));
    syncSharedProgress();
  }

  function syncSharedProgress() {
    if (!window.CVStudyProgress) return;
    const passed = questions.filter(
      (question) => progress.quiz[question.id]?.lastCorrect
    ).length;
    const attempted = questions.filter(
      (question) => Boolean(progress.quiz[question.id])
    ).length;
    window.CVStudyProgress.setQuizScore(passed, questions.length);
    window.CVStudyProgress.markComplete(
      "practice",
      attempted === questions.length && passed / questions.length >= 0.8
    );
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function selectedQuestions() {
    const topic = elements.topic.value;
    const difficulty = elements.difficulty.value;
    const mode = elements.mode.value;
    return questions.filter((question) => {
      if (topic !== "all" && question.topic !== topic) return false;
      if (difficulty !== "all" && question.difficulty !== difficulty) return false;
      const record = progress.quiz[question.id];
      if (mode === "unseen" && record) return false;
      if (mode === "missed" && (!record || record.lastCorrect)) return false;
      return true;
    });
  }

  function rebuildQueue(randomize = false) {
    const selected = selectedQuestions();
    queue = randomize ? shuffle(selected) : selected;
    index = 0;
    renderQuestion();
    renderMastery();
  }

  function renderQuestion() {
    answeredCurrent = false;
    current = queue[index] || null;
    elements.feedback.hidden = true;
    elements.feedback.className = "feedback";
    elements.choices.replaceChildren();

    if (!current) {
      elements.counter.textContent = "0 / 0";
      elements.topicBadge.textContent = "Complete";
      elements.difficultyBadge.textContent = "No question";
      elements.question.textContent =
        "No questions match these filters. Try All questions or another topic.";
      elements.submit.disabled = true;
      elements.next.disabled = true;
      return;
    }

    elements.counter.textContent = String(index + 1) + " / " + String(queue.length);
    elements.topicBadge.textContent = current.topic;
    elements.difficultyBadge.textContent = current.difficulty;
    elements.question.textContent = current.question;

    current.choices.forEach((choice, choiceIndex) => {
      const label = document.createElement("label");
      label.className = "choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = String(choiceIndex);
      const marker = document.createElement("span");
      marker.className = "choice-marker";
      marker.textContent = String.fromCharCode(65 + choiceIndex);
      const text = document.createElement("span");
      text.textContent = choice;
      label.append(input, marker, text);
      elements.choices.append(label);
    });

    elements.submit.disabled = false;
    elements.next.disabled = true;
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (!current || answeredCurrent) return;
    const checked = elements.form.querySelector('input[name="answer"]:checked');
    if (!checked) {
      elements.feedback.hidden = false;
      elements.feedback.className = "feedback warning";
      elements.feedback.textContent = "Choose an answer before checking.";
      return;
    }

    answeredCurrent = true;
    const selected = Number(checked.value);
    const correct = selected === current.answer;
    sessionAnswered += 1;
    if (correct) sessionCorrect += 1;

    const record = progress.quiz[current.id] || {
      attempts: 0,
      correct: 0,
      lastCorrect: false
    };
    record.attempts += 1;
    if (correct) record.correct += 1;
    record.lastCorrect = correct;
    record.lastAnswered = new Date().toISOString();
    progress.quiz[current.id] = record;
    saveProgress();

    const labels = [...elements.choices.querySelectorAll(".choice")];
    labels.forEach((label, choiceIndex) => {
      const input = label.querySelector("input");
      input.disabled = true;
      if (choiceIndex === current.answer) label.classList.add("correct");
      else if (choiceIndex === selected) label.classList.add("incorrect");
    });

    elements.feedback.hidden = false;
    elements.feedback.className = correct ? "feedback success" : "feedback error";
    const verdict = document.createElement("strong");
    verdict.textContent = correct ? "Correct. " : "Not yet. ";
    elements.feedback.replaceChildren(verdict, document.createTextNode(current.explanation));
    elements.submit.disabled = true;
    elements.next.disabled = false;
    renderScore();
    renderMastery();
  }

  function nextQuestion() {
    if (queue.length === 0) return;
    index = (index + 1) % queue.length;
    renderQuestion();
  }

  function renderScore() {
    const percentage = sessionAnswered
      ? Math.round((100 * sessionCorrect) / sessionAnswered)
      : 0;
    elements.score.textContent =
      String(sessionCorrect) + " / " + String(sessionAnswered) + " (" + String(percentage) + "%)";
  }

  function renderMastery() {
    if (!elements.mastery) return;
    const topics = [...new Set(questions.map((question) => question.topic))];
    elements.mastery.replaceChildren();
    topics.forEach((topic) => {
      const topicQuestions = questions.filter((question) => question.topic === topic);
      const passed = topicQuestions.filter(
        (question) => progress.quiz[question.id]?.lastCorrect
      ).length;
      const card = document.createElement("article");
      card.className = "mastery-card";
      const title = document.createElement("strong");
      title.textContent = topic;
      const value = document.createElement("span");
      value.textContent = String(passed) + " / " + String(topicQuestions.length);
      const meter = document.createElement("progress");
      meter.max = topicQuestions.length;
      meter.value = passed;
      meter.setAttribute("aria-label", topic + " mastery");
      card.append(title, value, meter);
      elements.mastery.append(card);
    });
  }

  function populateFilters() {
    const topics = [...new Set(questions.map((question) => question.topic))];
    topics.forEach((topic) => {
      const option = document.createElement("option");
      option.value = topic;
      option.textContent = topic;
      elements.topic.append(option);
    });
  }

  function resetSession() {
    sessionAnswered = 0;
    sessionCorrect = 0;
    renderScore();
    rebuildQueue(false);
  }

  function exportProgress() {
    const payload = JSON.stringify(progress, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "computer-vision-academy-progress.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function clearProgress() {
    const approved = window.confirm(
      "Clear saved quiz and coding progress from this browser?"
    );
    if (!approved) return;
    progress = blankProgress();
    saveProgress();
    resetSession();
  }

  populateFilters();
  [elements.topic, elements.difficulty, elements.mode].forEach((control) => {
    control.addEventListener("change", () => rebuildQueue(false));
  });
  elements.form.addEventListener("submit", submitAnswer);
  elements.next.addEventListener("click", nextQuestion);
  elements.shuffle.addEventListener("click", () => rebuildQueue(true));
  elements.resetSession.addEventListener("click", resetSession);
  elements.exportProgress.addEventListener("click", exportProgress);
  elements.clearProgress.addEventListener("click", clearProgress);
  renderScore();
  rebuildQueue(false);
  syncSharedProgress();
})();
