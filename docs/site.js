(function () {
  "use strict";

  var STORAGE_KEY = "computer-vision-study-progress-v1";
  var MILESTONES = [
    { id: "theory", label: "Theory foundations", href: "theory.html" },
    { id: "perception", label: "Perception systems", href: "perception.html" },
    { id: "calibration", label: "Sensor calibration", href: "calibration.html" },
    { id: "bev", label: "BEV conversion", href: "bev.html" },
    { id: "modern-cv", label: "Modern computer vision", href: "modern-cv.html" },
    { id: "practice", label: "MCQ practice", href: "practice.html" },
    { id: "coding", label: "Coding drills", href: "coding.html" },
    { id: "projects", label: "Portfolio projects", href: "projects.html" }
  ];

  function integer(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
  }

  function normalize(raw) {
    var source = raw && typeof raw === "object" ? raw : {};
    var allowed = MILESTONES.map(function (item) { return item.id; });
    var completed = Array.isArray(source.completed)
      ? source.completed.filter(function (id, index, values) {
          return allowed.indexOf(id) !== -1 && values.indexOf(id) === index;
        })
      : [];

    return {
      version: 1,
      completed: completed,
      quiz: {
        correct: integer(source.quiz && source.quiz.correct, 0),
        total: integer(source.quiz && source.quiz.total, 0)
      },
      coding: {
        solved: integer(source.coding && source.coding.solved, 0),
        total: integer(source.coding && source.coding.total, 30)
      },
      lastActivity: typeof source.lastActivity === "string" ? source.lastActivity : null
    };
  }

  function readProgress() {
    try {
      return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch (error) {
      return normalize({});
    }
  }

  function writeProgress(progress) {
    var next = normalize(progress);
    next.lastActivity = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      /* Progress remains usable for this page even when storage is blocked. */
    }
    renderProgress(next);
    window.dispatchEvent(new CustomEvent("cvstudyprogresschange", { detail: next }));
    return next;
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (element) {
      element.textContent = value;
    });
  }

  function nextMilestone(progress) {
    return MILESTONES.find(function (item) {
      return progress.completed.indexOf(item.id) === -1;
    }) || null;
  }

  function renderProgress(progress) {
    var state = normalize(progress || readProgress());
    var count = state.completed.length;
    var percentage = Math.round((count / MILESTONES.length) * 100);
    var orbit = document.querySelector("[data-progress-orbit]");
    var next = nextMilestone(state);

    setText("[data-progress-percent]", percentage + "%");
    setText("[data-progress-count]", count + " / " + MILESTONES.length);
    setText("[data-quiz-score]", state.quiz.total ? state.quiz.correct + " / " + state.quiz.total : "Not started");
    setText("[data-coding-score]", state.coding.solved + " / " + state.coding.total);
    setText("[data-progress-message]", count === MILESTONES.length
      ? "Core learning path complete. Keep the evidence current."
      : "Complete " + (MILESTONES.length - count) + " more checkpoint" + (MILESTONES.length - count === 1 ? "" : "s") + " to close the core path.");

    if (orbit) {
      orbit.style.setProperty("--progress-angle", percentage * 3.6 + "deg");
      orbit.setAttribute("aria-valuenow", String(percentage));
      orbit.setAttribute("aria-valuetext", count + " of " + MILESTONES.length + " checkpoints complete");
    }

    document.querySelectorAll("[data-milestone]").forEach(function (input) {
      input.checked = state.completed.indexOf(input.getAttribute("data-milestone")) !== -1;
    });

    var nextLink = document.querySelector("[data-next-step]");
    if (nextLink) {
      if (next) {
        nextLink.textContent = next.label + " →";
        nextLink.setAttribute("href", next.href);
      } else {
        nextLink.textContent = "Review portfolio evidence →";
        nextLink.setAttribute("href", "projects.html");
      }
    }
  }

  function markComplete(id, complete) {
    var state = readProgress();
    var known = MILESTONES.some(function (item) { return item.id === id; });
    if (!known) {
      return state;
    }

    var completed = state.completed.filter(function (item) { return item !== id; });
    if (complete !== false) {
      completed.push(id);
    }
    state.completed = completed;
    return writeProgress(state);
  }

  function setQuizScore(correct, total) {
    var state = readProgress();
    state.quiz = { correct: integer(correct, 0), total: integer(total, 0) };
    return writeProgress(state);
  }

  function setCodingSolved(solved, total) {
    var state = readProgress();
    state.coding = { solved: integer(solved, 0), total: integer(total, 30) };
    return writeProgress(state);
  }

  function resetProgress() {
    var empty = normalize({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      /* The empty state is still rendered below. */
    }
    renderProgress(empty);
    window.dispatchEvent(new CustomEvent("cvstudyprogresschange", { detail: empty }));
    return empty;
  }

  function initializeNavigation() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-primary-nav]");
    if (!toggle || !nav) {
      return;
    }

    function closeNavigation() {
      toggle.setAttribute("aria-expanded", "false");
      nav.removeAttribute("data-open");
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      if (open) {
        nav.removeAttribute("data-open");
      } else {
        nav.setAttribute("data-open", "true");
      }
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        closeNavigation();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeNavigation();
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080) {
        closeNavigation();
      }
    });
  }

  function setCurrentNavigation() {
    var current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav-link]").forEach(function (link) {
      var href = (link.getAttribute("href") || "").split("#")[0];
      if (href === current) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function initializeProgress() {
    renderProgress(readProgress());

    document.querySelectorAll("[data-milestone]").forEach(function (input) {
      input.addEventListener("change", function () {
        markComplete(input.getAttribute("data-milestone"), input.checked);
      });
    });

    var reset = document.querySelector("[data-reset-progress]");
    if (reset) {
      reset.addEventListener("click", function () {
        if (window.confirm("Reset all computer-vision study progress on this device?")) {
          resetProgress();
        }
      });
    }
  }

  window.CVStudyProgress = {
    read: readProgress,
    markComplete: markComplete,
    setQuizScore: setQuizScore,
    setCodingSolved: setCodingSolved,
    reset: resetProgress,
    milestones: MILESTONES.slice()
  };

  initializeNavigation();
  setCurrentNavigation();
  initializeProgress();

  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) {
      renderProgress(readProgress());
    }
  });
})();
