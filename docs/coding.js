(() => {
  "use strict";

  const tasks = Array.isArray(window.CV_CODING_TASKS) ? window.CV_CODING_TASKS : [];
  const solutionEntries = Array.isArray(window.CV_CODING_SOLUTIONS)
    ? window.CV_CODING_SOLUTIONS
    : [];
  const solutions = new Map(
    solutionEntries.map((solution) => [solution.id, solution])
  );
  const selectedLanguages = new Map();
  let initialHashHandled = false;
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
        task.id,
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

  function setSelectedLanguage(taskId, language, tabs, panels, moveFocus) {
    selectedLanguages.set(taskId, language);
    tabs.forEach((tab) => {
      const selected = tab.dataset.language === language;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) tab.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.language !== language;
    });
  }

  function makeSolution(task) {
    const solution = solutions.get(task.id);
    if (!solution) return null;

    const disclosure = document.createElement("details");
    disclosure.className = "task-solution";

    const summary = document.createElement("summary");
    summary.textContent = "View commented reference answer (Python + C++)";

    const intro = document.createElement("p");
    intro.className = "solution-intro";
    intro.textContent =
      "Attempt the contract and visible tests first. Then compare invariants, " +
      "failure handling, and trade-offs—not only syntax.";

    const tabList = document.createElement("div");
    tabList.className = "solution-tablist";
    tabList.setAttribute("role", "tablist");
    tabList.setAttribute("aria-label", task.title + " answer language");

    const panelWrap = document.createElement("div");
    panelWrap.className = "solution-panels";
    const tabs = [];
    const panels = [];
    const languages = [
      { key: "python", label: "Python" },
      { key: "cpp", label: "C++" }
    ];

    languages.forEach(({ key, label }) => {
      const answer = solution[key];
      const tabId = task.id + "-" + key + "-tab";
      const panelId = task.id + "-" + key + "-panel";

      const tab = document.createElement("button");
      tab.className = "solution-tab";
      tab.type = "button";
      tab.id = tabId;
      tab.dataset.language = key;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panelId);
      tab.textContent = label;
      tabs.push(tab);
      tabList.append(tab);

      const panel = document.createElement("section");
      panel.className = "solution-panel";
      panel.id = panelId;
      panel.dataset.language = key;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);

      const heading = document.createElement("h3");
      heading.className = "solution-language-heading";
      heading.textContent = label + " reference core";

      const codeRegion = document.createElement("pre");
      codeRegion.className = "solution-code";
      codeRegion.tabIndex = 0;
      codeRegion.setAttribute(
        "aria-label",
        task.title + " " + label + " commented reference code"
      );
      const code = document.createElement("code");
      code.textContent = answer.code;
      codeRegion.append(code);

      const walkthroughHeading = document.createElement("h4");
      walkthroughHeading.textContent = "Reasoning walkthrough";
      const walkthrough = document.createElement("ol");
      walkthrough.className = "solution-walkthrough";
      answer.walkthrough.forEach((step) => {
        const item = document.createElement("li");
        item.textContent = step;
        walkthrough.append(item);
      });

      panel.append(heading, codeRegion, walkthroughHeading, walkthrough);
      panels.push(panel);
      panelWrap.append(panel);
    });

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        setSelectedLanguage(task.id, tab.dataset.language, tabs, panels, false);
      });
      tab.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        else return;

        event.preventDefault();
        setSelectedLanguage(
          task.id,
          tabs[nextIndex].dataset.language,
          tabs,
          panels,
          true
        );
      });
    });

    const selected = selectedLanguages.get(task.id) || "python";
    setSelectedLanguage(task.id, selected, tabs, panels, false);
    disclosure.append(summary, intro, tabList, panelWrap);
    return disclosure;
  }

  function renderTask(task) {
    const article = document.createElement("article");
    article.className = "task-card";
    article.id = task.id;
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
    const solution = makeSolution(task);

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

    article.append(meta, title, prompt, details);
    if (solution) article.append(solution);
    article.append(evidence, completion);
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
    if (!initialHashHandled && window.location.hash) {
      let targetId = window.location.hash.slice(1);
      try {
        targetId = decodeURIComponent(targetId);
      } catch {
        // A malformed external fragment must not prevent the exercise list,
        // filters, solutions, or progress controls from rendering.
      }
      const target = document.getElementById(targetId);
      if (target?.classList.contains("task-card")) {
        requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
      }
      initialHashHandled = true;
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

  function refreshCompletionControls() {
    elements.list.querySelectorAll("[data-task-id]").forEach((article) => {
      const taskId = article.dataset.taskId;
      const checkbox = article.querySelector(
        '.completion-control input[type="checkbox"]'
      );
      if (checkbox) {
        checkbox.checked = Boolean(progress.coding[taskId]?.complete);
      }
    });
    renderProgress();
  }

  function clearFilters() {
    elements.track.value = "all";
    elements.difficulty.value = "all";
    elements.search.value = "";
    render();
  }

  populateFilters();
  const initialSearch = new URLSearchParams(window.location.search).get("search");
  if (initialSearch) elements.search.value = initialSearch;
  [elements.track, elements.difficulty].forEach((control) => {
    control.addEventListener("change", render);
  });
  elements.search.addEventListener("input", render);
  elements.clearFilters.addEventListener("click", clearFilters);
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey) {
      progress = loadProgress();
      // Progress does not affect filtering or answer content. Updating controls
      // in place preserves the focused tab, open disclosure, and code scroll.
      refreshCompletionControls();
    }
  });
  render();
  syncSharedProgress();
})();
