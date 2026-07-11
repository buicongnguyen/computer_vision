(() => {
  "use strict";

  const tasks = Array.isArray(window.CV_CODING_TASKS) ? window.CV_CODING_TASKS : [];
  const storageKey = "cv-academy-progress-v1";
  const elements = {
    track: document.querySelector("#coding-track-filter"),
    difficulty: document.querySelector("#coding-difficulty-filter"),
    search: document.querySelector("#coding-search"),
    list: document.querySelector("#coding-list"),
    count: document.querySelector("#coding-count"),
    progress: document.querySelector("#coding-progress"),
    clearFilters: document.querySelector("#clear-coding-filters")
  };

  if (!elements.list || tasks.length === 0) return;

  let progress = loadProgress();

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
      // Fall back to in-memory progress.
    }
    return { version: 1, quiz: {}, coding: {}, pages: {}, lastUpdated: null };
  }

  function saveProgress() {
    progress.lastUpdated = new Date().toISOString();
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // The page remains usable without persistence.
    }
    document.dispatchEvent(new CustomEvent("cv-progress-changed"));
    syncSharedProgress();
  }

  function syncSharedProgress() {
    if (!window.CVStudyProgress) return;
    const completed = tasks.filter(
      (task) => progress.coding[task.id]?.complete
    ).length;
    window.CVStudyProgress.setCodingSolved(completed, tasks.length);
    window.CVStudyProgress.markComplete("coding", completed === tasks.length);
  }

  function populateFilters() {
    [...new Set(tasks.map((task) => task.track))].forEach((track) => {
      const option = document.createElement("option");
      option.value = track;
      option.textContent = track;
      elements.track.append(option);
    });
  }

  function filteredTasks() {
    const track = elements.track.value;
    const difficulty = elements.difficulty.value;
    const query = elements.search.value.trim().toLowerCase();
    return tasks.filter((task) => {
      if (track !== "all" && task.track !== track) return false;
      if (difficulty !== "all" && task.difficulty !== difficulty) return false;
      if (!query) return true;
      const haystack = [
        task.title,
        task.track,
        task.language,
        task.prompt,
        ...task.contract,
        ...task.tests
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }

  function makeList(title, items, ordered = false) {
    const section = document.createElement("details");
    section.className = "task-details";
    const summary = document.createElement("summary");
    summary.textContent = title + " (" + String(items.length) + ")";
    const list = document.createElement(ordered ? "ol" : "ul");
    items.forEach((item) => {
      const row = document.createElement("li");
      row.textContent = item;
      list.append(row);
    });
    section.append(summary, list);
    return section;
  }

  function renderTask(task) {
    const article = document.createElement("article");
    article.className = "task-card";
    article.dataset.taskId = task.id;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    [task.track, task.difficulty, task.language, String(task.minutes) + " min"].forEach(
      (value) => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = value;
        meta.append(tag);
      }
    );

    const title = document.createElement("h2");
    title.textContent = task.title;
    const prompt = document.createElement("p");
    prompt.className = "task-prompt";
    prompt.textContent = task.prompt;

    const details = document.createElement("div");
    details.className = "task-detail-grid";
    details.append(
      makeList("Contract", task.contract),
      makeList("Visible tests", task.tests),
      makeList("Hints", task.hints)
    );

    const evidence = document.createElement("p");
    evidence.className = "evidence-callout";
    const evidenceLabel = document.createElement("strong");
    evidenceLabel.textContent = "Study output: ";
    evidence.append(evidenceLabel, document.createTextNode(task.evidence));

    const completion = document.createElement("label");
    completion.className = "completion-control";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(progress.coding[task.id]?.complete);
    checkbox.addEventListener("change", () => {
      progress.coding[task.id] = {
        complete: checkbox.checked,
        updated: new Date().toISOString()
      };
      saveProgress();
      renderProgress();
    });
    const completionText = document.createElement("span");
    completionText.textContent = "Implementation, tests, and study output complete";
    completion.append(checkbox, completionText);

    article.append(meta, title, prompt, details, evidence, completion);
    return article;
  }

  function render() {
    const visible = filteredTasks();
    elements.list.replaceChildren(...visible.map(renderTask));
    elements.count.textContent =
      String(visible.length) + " of " + String(tasks.length) + " exercises";
    if (visible.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No coding exercises match these filters.";
      elements.list.append(empty);
    }
    renderProgress();
  }

  function renderProgress() {
    const completed = tasks.filter((task) => progress.coding[task.id]?.complete).length;
    const percentage = Math.round((100 * completed) / tasks.length);
    elements.progress.textContent =
      String(completed) + " / " + String(tasks.length) + " complete (" +
      String(percentage) + "%)";
  }

  function clearFilters() {
    elements.track.value = "all";
    elements.difficulty.value = "all";
    elements.search.value = "";
    render();
  }

  populateFilters();
  [elements.track, elements.difficulty].forEach((control) => {
    control.addEventListener("change", render);
  });
  elements.search.addEventListener("input", render);
  elements.clearFilters.addEventListener("click", clearFilters);
  render();
  syncSharedProgress();
})();
