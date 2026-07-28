(function () {
  "use strict";

  var STORAGE_KEY = "computer-vision-study-progress-v1";
  var MILESTONES = [
    { id: "theory", label: "Theory foundations", href: "theory.html" },
    { id: "perception", label: "Perception systems", href: "perception.html" },
    { id: "calibration", label: "Sensor calibration", href: "calibration.html" },
    { id: "bev", label: "BEV conversion", href: "bev.html" },
    { id: "modern-cv", label: "Modern computer vision", href: "modern-cv.html" },
    { id: "autonomy", label: "Autonomous driving systems", href: "autonomous-driving.html" },
    { id: "practice", label: "MCQ practice", href: "practice.html" },
    { id: "coding", label: "Coding drills", href: "coding.html" },
    { id: "projects", label: "Applied projects", href: "projects.html" }
  ];
  var BOOKMARK_STORAGE_KEY = "computer-vision-bookmarks-v1";
  var QUIZ_QUESTION_COUNT = 80;
  var CODING_TASK_COUNT = 36;
  var BOOK_CHAPTERS = [
    {
      title: "Start here",
      pages: [
        { label: "Study hub", href: "index.html", number: "00" }
      ]
    },
    {
      title: "Part I · Foundations",
      pages: [
        { label: "Theory foundations", href: "theory.html", number: "01" },
        { label: "Perception systems", href: "perception.html", number: "02" },
        { label: "Calibration", href: "calibration.html", number: "03" },
        { label: "Bird's-eye view", href: "bev.html", number: "04" }
      ]
    },
    {
      title: "Part II · Models & systems",
      pages: [
        { label: "Modern computer vision", href: "modern-cv.html", number: "05" },
        { label: "YOLO evolution", href: "yolo-evolution.html", number: "06" },
        { label: "Current 3D topics", href: "current-topics.html", number: "07" },
        { label: "Autonomous driving", href: "autonomous-driving.html", number: "08" },
        { label: "Autonomy reasoning", href: "autonomy-reasoning.html", number: "09" }
      ]
    },
    {
      title: "Part III · Practice & evidence",
      pages: [
        { label: "MCQ practice", href: "practice.html", number: "10" },
        { label: "Coding practice", href: "coding.html", number: "11" },
        { label: "Applied projects", href: "projects.html", number: "12" },
        { label: "Sources & attribution", href: "sources.html", number: "13" }
      ]
    }
  ];
  var BOOK_PAGES = BOOK_CHAPTERS.reduce(function (pages, chapter) {
    return pages.concat(chapter.pages);
  }, []);

  function integer(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
  }

  function normalize(raw) {
    var source = raw && typeof raw === "object" ? raw : {};
    var allowed = MILESTONES.map(function (item) { return item.id; });
    var storedQuizTotal = integer(source.quiz && source.quiz.total, 0);
    var quizTotal = storedQuizTotal
      ? Math.max(storedQuizTotal, QUIZ_QUESTION_COUNT)
      : 0;
    var codingTotal = Math.max(
      integer(source.coding && source.coding.total, 0),
      CODING_TASK_COUNT
    );
    var completed = Array.isArray(source.completed)
      ? source.completed.filter(function (id, index, values) {
          return allowed.indexOf(id) !== -1 && values.indexOf(id) === index;
        })
      : [];

    return {
      version: 1,
      completed: completed,
      quiz: {
        correct: Math.min(
          integer(source.quiz && source.quiz.correct, 0),
          quizTotal
        ),
        total: quizTotal
      },
      coding: {
        solved: Math.min(
          integer(source.coding && source.coding.solved, 0),
          codingTotal
        ),
        total: codingTotal
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
      ? "Core learning path complete. Revisit it as methods and assumptions change."
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
        nextLink.textContent = "Review applied projects →";
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
    state.coding = {
      solved: integer(solved, 0),
      total: integer(total, CODING_TASK_COUNT)
    };
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

  function currentPageName() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function readBookmarks() {
    try {
      var stored = JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY) || "[]");
      return Array.isArray(stored)
        ? stored.filter(function (href, index, values) {
            return BOOK_PAGES.some(function (page) { return page.href === href; })
              && values.indexOf(href) === index;
          })
        : [];
    } catch (error) {
      return [];
    }
  }

  function writeBookmarks(bookmarks) {
    try {
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      /* Bookmarks remain available in the current view when storage is blocked. */
    }
  }

  function createReaderLink(page, current, bookmarked, onBookmark) {
    var row = document.createElement("div");
    var link = document.createElement("a");
    var number = document.createElement("span");
    var label = document.createElement("span");
    var bookmark = document.createElement("button");

    row.className = "reader-nav-row";
    row.setAttribute("data-reader-row", "");
    row.setAttribute("data-page-href", page.href);

    link.href = page.href;
    link.className = "reader-nav-link";
    if (page.href === current) {
      link.setAttribute("aria-current", "page");
    }

    number.className = "reader-nav-number";
    number.textContent = page.number;
    number.setAttribute("aria-hidden", "true");
    label.className = "reader-nav-label";
    label.textContent = page.label;
    link.appendChild(number);
    link.appendChild(label);

    bookmark.className = "reader-bookmark";
    bookmark.type = "button";
    bookmark.textContent = bookmarked ? "★" : "☆";
    bookmark.setAttribute(
      "aria-label",
      (bookmarked ? "Remove bookmark for " : "Bookmark ") + page.label
    );
    bookmark.setAttribute("aria-pressed", String(bookmarked));
    bookmark.addEventListener("click", function () {
      onBookmark(page.href);
    });

    row.appendChild(link);
    row.appendChild(bookmark);
    return row;
  }

  function initializeReaderNavigation(current) {
    var header = document.querySelector(".site-header");
    var actions = document.querySelector(".header-actions");
    var main = document.querySelector("main#main-content");
    if (!header || !actions || !main) {
      return;
    }

    var sidebar = document.createElement("aside");
    var overlay = document.createElement("button");
    var toggle = document.createElement("button");
    var close = document.createElement("button");
    var search = document.createElement("input");
    var nav = document.createElement("nav");
    var savedSection = document.createElement("section");
    var savedList = document.createElement("div");
    var savedEmpty = document.createElement("p");
    var bookmarks = readBookmarks();

    sidebar.className = "reader-sidebar";
    sidebar.id = "reader-sidebar";
    sidebar.setAttribute("aria-label", "Course chapters and bookmarks");

    var sidebarHeader = document.createElement("div");
    sidebarHeader.className = "reader-sidebar-header";
    sidebarHeader.innerHTML =
      '<div><span class="reader-kicker">Course book</span>' +
      '<strong>Contents</strong></div>';

    close.className = "reader-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close chapter navigation");
    close.textContent = "×";
    sidebarHeader.appendChild(close);
    sidebar.appendChild(sidebarHeader);

    var searchLabel = document.createElement("label");
    searchLabel.className = "reader-search";
    searchLabel.innerHTML = '<span class="sr-only">Filter chapters</span>';
    search.type = "search";
    search.placeholder = "Filter chapters…";
    search.setAttribute("aria-label", "Filter chapters");
    searchLabel.appendChild(search);
    sidebar.appendChild(searchLabel);

    savedSection.className = "reader-saved";
    savedSection.setAttribute("aria-labelledby", "reader-saved-title");
    savedSection.innerHTML =
      '<div class="reader-group-title" id="reader-saved-title">' +
      '<span>Bookmarks</span><span aria-hidden="true">★</span></div>';
    savedList.className = "reader-saved-list";
    savedEmpty.className = "reader-saved-empty";
    savedSection.appendChild(savedList);
    savedSection.appendChild(savedEmpty);
    sidebar.appendChild(savedSection);

    nav.className = "reader-chapters";
    nav.setAttribute("aria-label", "Book chapters");
    sidebar.appendChild(nav);

    function toggleBookmark(href) {
      var restoreFocus = document.activeElement
        && document.activeElement.classList.contains("reader-bookmark");
      var index = bookmarks.indexOf(href);
      if (index === -1) {
        bookmarks.push(href);
      } else {
        bookmarks.splice(index, 1);
      }
      writeBookmarks(bookmarks);
      renderNavigation();
      if (restoreFocus) {
        window.requestAnimationFrame(function () {
          var row = Array.from(nav.querySelectorAll("[data-reader-row]")).find(
            function (candidate) {
              return candidate.getAttribute("data-page-href") === href;
            }
          );
          var button = row && row.querySelector(".reader-bookmark");
          if (button && button.offsetParent !== null) {
            button.focus();
          } else {
            search.focus();
          }
        });
      }
    }

    function renderSavedPages() {
      savedList.replaceChildren();
      savedEmpty.hidden = bookmarks.length > 0;
      savedEmpty.textContent = "Save a chapter with ☆ for quick access.";

      bookmarks.forEach(function (href) {
        var page = BOOK_PAGES.find(function (candidate) {
          return candidate.href === href;
        });
        if (page) {
          savedList.appendChild(
            createReaderLink(page, current, true, toggleBookmark)
          );
        }
      });
    }

    function renderNavigation() {
      nav.replaceChildren();
      BOOK_CHAPTERS.forEach(function (chapter) {
        var group = document.createElement("section");
        var title = document.createElement("div");
        group.className = "reader-nav-group";
        title.className = "reader-group-title";
        title.textContent = chapter.title;
        group.appendChild(title);

        chapter.pages.forEach(function (page) {
          group.appendChild(
            createReaderLink(
              page,
              current,
              bookmarks.indexOf(page.href) !== -1,
              toggleBookmark
            )
          );
        });
        nav.appendChild(group);
      });
      renderSavedPages();
      filterNavigation(search.value);
    }

    function filterNavigation(query) {
      var normalized = (query || "").trim().toLowerCase();
      nav.querySelectorAll(".reader-nav-group").forEach(function (group) {
        var visible = 0;
        group.querySelectorAll("[data-reader-row]").forEach(function (row) {
          var match = !normalized
            || row.textContent.toLowerCase().indexOf(normalized) !== -1;
          row.hidden = !match;
          if (match) {
            visible += 1;
          }
        });
        group.hidden = visible === 0;
      });
    }

    toggle.className = "reader-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-controls", sidebar.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open chapter navigation");
    toggle.innerHTML =
      '<span class="reader-toggle-icon" aria-hidden="true">☰</span>' +
      '<span class="reader-toggle-label">Chapters</span>';
    actions.insertBefore(toggle, actions.firstChild);

    overlay.className = "reader-overlay";
    overlay.type = "button";
    overlay.setAttribute("aria-label", "Close chapter navigation");
    document.body.insertBefore(overlay, header.nextSibling);
    document.body.insertBefore(sidebar, overlay.nextSibling);

    function openSidebar() {
      document.body.classList.add("reader-menu-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close chapter navigation");
      sidebar.setAttribute("data-open", "true");
      sidebar.removeAttribute("aria-hidden");
      sidebar.inert = false;
      close.focus();
    }

    function closeSidebar(returnFocus) {
      document.body.classList.remove("reader-menu-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open chapter navigation");
      sidebar.removeAttribute("data-open");
      if (window.innerWidth <= 1180) {
        sidebar.setAttribute("aria-hidden", "true");
        sidebar.inert = true;
      } else {
        sidebar.removeAttribute("aria-hidden");
        sidebar.inert = false;
      }
      if (returnFocus) {
        toggle.focus();
      }
    }

    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") {
        closeSidebar(false);
      } else {
        openSidebar();
      }
    });
    close.addEventListener("click", function () { closeSidebar(true); });
    overlay.addEventListener("click", function () { closeSidebar(true); });
    sidebar.addEventListener("click", function (event) {
      if (event.target.closest("a") && window.innerWidth <= 1180) {
        closeSidebar(true);
      }
    });
    search.addEventListener("input", function () {
      filterNavigation(search.value);
    });
    document.addEventListener("keydown", function (event) {
      var menuOpen = document.body.classList.contains("reader-menu-open");
      if (event.key === "Escape" && menuOpen) {
        closeSidebar(true);
        return;
      }
      if (event.key !== "Tab" || !menuOpen) {
        return;
      }

      var focusable = Array.from(sidebar.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled])'
      )).filter(function (element) {
        return element.offsetParent !== null;
      });
      if (!focusable.length) {
        return;
      }

      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (!sidebar.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1180
          || !document.body.classList.contains("reader-menu-open")) {
        closeSidebar(false);
      }
    });

    renderNavigation();
    closeSidebar(false);
    document.body.classList.add("reader-ready");
  }

  function initializePageContents() {
    var main = document.querySelector("main#main-content");
    if (!main) {
      return;
    }

    var headings = Array.from(main.querySelectorAll("h2[id]")).filter(function (heading) {
      return heading.id !== "question-text"
        && !heading.closest(".filter-panel, .quiz-card, .task-card, .page-pagination");
    });
    if (headings.length < 2) {
      return;
    }

    var contents = document.createElement("details");
    var summary = document.createElement("summary");
    var list = document.createElement("ol");
    contents.className = "reader-page-toc";
    contents.open = window.innerWidth > 760;
    summary.innerHTML =
      '<span><span class="reader-kicker">On this page</span>' +
      '<strong>Chapter outline</strong></span>' +
      '<span class="reader-toc-count">' + headings.length + " sections</span>";
    contents.appendChild(summary);
    contents.appendChild(list);

    headings.forEach(function (heading) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = "#" + heading.id;
      link.textContent = heading.textContent.trim();
      link.setAttribute("data-section-link", heading.id);
      item.appendChild(link);
      list.appendChild(item);
    });

    var firstSection = main.querySelector(":scope > .section, :scope > section[id]");
    if (firstSection) {
      main.insertBefore(contents, firstSection);
    } else {
      main.appendChild(contents);
    }

    if ("IntersectionObserver" in window) {
      var visible = {};
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            visible[entry.target.id] = entry.boundingClientRect.top;
          } else {
            delete visible[entry.target.id];
          }
        });
        var active = Object.keys(visible).sort(function (left, right) {
          return visible[left] - visible[right];
        })[0];
        if (active) {
          list.querySelectorAll("a").forEach(function (link) {
            if (link.getAttribute("data-section-link") === active) {
              link.setAttribute("aria-current", "location");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        }
      }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });
      headings.forEach(function (heading) { observer.observe(heading); });
    }
  }

  function initializeBookPagination(current) {
    var currentIndex = BOOK_PAGES.findIndex(function (page) {
      return page.href === current;
    });
    if (currentIndex <= 0) {
      return;
    }

    var main = document.querySelector("main#main-content");
    if (!main) {
      return;
    }
    var pagination = main.querySelector(".page-pagination");
    if (!pagination) {
      pagination = document.createElement("nav");
      pagination.className = "page-pagination";
      main.appendChild(pagination);
    }
    pagination.setAttribute("aria-label", "Previous and next chapters");
    pagination.replaceChildren();

    [
      { direction: "Previous", page: BOOK_PAGES[currentIndex - 1] },
      { direction: "Next", page: BOOK_PAGES[currentIndex + 1] }
    ].forEach(function (item) {
      if (!item.page) {
        return;
      }
      var link = document.createElement("a");
      var direction = document.createElement("span");
      var label = document.createElement("strong");
      link.href = item.page.href;
      direction.textContent = item.direction;
      label.textContent = item.page.label;
      link.appendChild(direction);
      link.appendChild(label);
      pagination.appendChild(link);
    });
  }

  function initializeReadingProgress() {
    var progress = document.createElement("div");
    progress.className = "reader-progress";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", "Reading progress");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "100");
    progress.setAttribute("aria-valuenow", "0");
    document.body.appendChild(progress);

    var ticking = false;
    function update() {
      var distance = document.documentElement.scrollHeight - window.innerHeight;
      var percentage = distance > 0
        ? Math.min(100, Math.max(0, Math.round((window.scrollY / distance) * 100)))
        : 100;
      progress.style.setProperty("--reader-progress", percentage / 100);
      progress.setAttribute("aria-valuenow", String(percentage));
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function initializeBookReader() {
    var current = currentPageName();
    if (!BOOK_PAGES.some(function (page) { return page.href === current; })) {
      return;
    }
    initializeReaderNavigation(current);
    initializePageContents();
    initializeBookPagination(current);
    initializeReadingProgress();
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
  initializeBookReader();

  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) {
      renderProgress(readProgress());
    }
  });
})();
