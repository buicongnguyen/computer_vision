(function () {
  "use strict";

  var STORAGE_KEY = "site-color-theme";
  var root = document.documentElement;

  function readTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
    } catch (error) {
      return "dark";
    }
  }

  function updateControls(theme) {
    var light = theme === "light";
    var controls = document.querySelectorAll("[data-theme-toggle]");

    controls.forEach(function (control) {
      var icon = control.querySelector(".theme-icon");
      var label = control.querySelector(".theme-label");

      control.setAttribute("aria-label", "Switch to " + (light ? "dark" : "light") + " mode");
      control.setAttribute("aria-pressed", String(light));
      if (icon) {
        icon.textContent = light ? "☀" : "◐";
      }
      if (label) {
        label.textContent = light ? "Light" : "Dark";
      }
    });
  }

  function updateThemeColor(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "light" ? "#f4f8fb" : "#071019");
    }
  }

  function applyTheme(theme, persist) {
    var nextTheme = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", nextTheme);
    root.style.colorScheme = nextTheme;

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch (error) {
        /* Local preferences are optional when storage is unavailable. */
      }
    }

    updateControls(nextTheme);
    updateThemeColor(nextTheme);
  }

  function initialize() {
    updateControls(root.getAttribute("data-theme") || readTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach(function (control) {
      control.addEventListener("click", function () {
        applyTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light", true);
      });
    });
  }

  applyTheme(readTheme(), false);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) {
      applyTheme(event.newValue === "light" ? "light" : "dark", false);
    }
  });
})();
