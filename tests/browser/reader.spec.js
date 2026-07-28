const { test, expect } = require("@playwright/test");
const {
  startStaticServer,
  stopStaticServer
} = require("./serve");

const PROGRESS_KEY = "computer-vision-study-progress-v1";
const BOOKMARK_KEY = "computer-vision-bookmarks-v1";
const PRACTICE_KEY = "cv-academy-progress-v1";
const EXPECTED_MILESTONES = [
  "theory",
  "perception",
  "calibration",
  "bev",
  "modern-cv",
  "yolo-evolution",
  "autonomous-driving",
  "autonomy-reasoning",
  "practice",
  "coding",
  "projects"
];
const ALL_CHAPTERS = [
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
  "sources.html"
];
let staticServer;

test.beforeAll(async () => {
  staticServer = await startStaticServer();
});

test.afterAll(async () => {
  await stopStaticServer(staticServer);
});

function monitorFirstPartyFailures(page) {
  const failures = [];
  const origin = "http://127.0.0.1:8942";

  page.on("pageerror", (error) => {
    failures.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      failures.push(`console: ${message.text()}`);
    }
  });
  page.on("response", (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400) {
      failures.push(`${response.status()} ${response.url()}`);
    }
  });

  return failures;
}

test("migrates legacy progress and exposes the canonical checkpoint contract", async ({
  page
}) => {
  const failures = monitorFirstPartyFailures(page);
  const legacy = {
    version: 1,
    completed: ["theory", "autonomy", "autonomy", "unknown"],
    quiz: { correct: 17, total: 80 },
    coding: { solved: 4, total: 36 },
    lastActivity: "2026-07-01T12:34:56.000Z"
  };
  await page.addInitScript(
    ({ key, value }) => {
      if (!sessionStorage.getItem("legacy-progress-seeded")) {
        localStorage.setItem(key, JSON.stringify(value));
        sessionStorage.setItem("legacy-progress-seeded", "true");
      }
    },
    { key: PROGRESS_KEY, value: legacy }
  );

  await page.goto("/docs/index.html");

  const publicState = await page.evaluate(() => ({
    progress: window.CVStudyProgress.read(),
    milestones: window.CVStudyProgress.milestones,
    chapters: window.CVStudyProgress.chapters
  }));
  const persisted = await page.evaluate((key) => {
    return JSON.parse(localStorage.getItem(key));
  }, PROGRESS_KEY);

  expect(publicState.milestones.map((item) => item.id)).toEqual(
    EXPECTED_MILESTONES
  );
  expect(publicState.chapters.map((item) => item.href)).toEqual(ALL_CHAPTERS);
  expect(
    publicState.chapters
      .filter((item) => item.checkpoint)
      .map((item) => item.id)
  ).toEqual(EXPECTED_MILESTONES);
  expect(
    publicState.chapters.find((item) => item.id === "current-topics").status
  ).toBe("Optional");
  expect(
    publicState.chapters.find((item) => item.id === "sources").status
  ).toBe("Reference");
  expect(publicState.progress).toEqual({
    version: 2,
    completed: ["theory", "autonomous-driving"],
    quiz: { correct: 17, total: 80 },
    coding: { solved: 4, total: 36 },
    lastActivity: legacy.lastActivity
  });
  expect(persisted).toEqual(publicState.progress);

  await page.reload();
  expect(await page.evaluate(() => window.CVStudyProgress.read())).toEqual(
    publicState.progress
  );
  await expect(page.locator("[data-progress-count]").first()).toHaveText("2 / 11");
  expect(failures).toEqual([]);
});

test("reset removes summary plus authoritative quiz and coding progress", async ({
  page
}) => {
  const failures = monitorFirstPartyFailures(page);
  await page.goto("/docs/index.html");
  await page.evaluate(
    ({ progressKey, practiceKey }) => {
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 2,
          completed: ["practice", "coding"],
          quiz: { correct: 64, total: 80 },
          coding: { solved: 36, total: 36 },
          lastActivity: "2026-07-01T12:34:56.000Z"
        })
      );
      localStorage.setItem(
        practiceKey,
        JSON.stringify({
          version: 1,
          quiz: { seeded: { attempts: 1, correct: 1, lastCorrect: true } },
          coding: { seeded: { complete: true } },
          pages: {},
          lastUpdated: "2026-07-01T12:34:56.000Z"
        })
      );
    },
    { progressKey: PROGRESS_KEY, practiceKey: PRACTICE_KEY }
  );
  await page.reload();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("[data-reset-progress]").click();
  await expect(page.locator("[data-progress-count]").first()).toHaveText("0 / 11");
  expect(
    await page.evaluate(
      ({ progressKey, practiceKey }) => ({
        progress: localStorage.getItem(progressKey),
        practice: localStorage.getItem(practiceKey)
      }),
      { progressKey: PROGRESS_KEY, practiceKey: PRACTICE_KEY }
    )
  ).toEqual({ progress: null, practice: null });

  await page.goto("/docs/practice.html");
  await page.goto("/docs/coding.html");
  expect(
    await page.evaluate(() => window.CVStudyProgress.read().completed)
  ).toEqual([]);
  expect(failures).toEqual([]);
});

test("YOLO and autonomy checkpoints persist independently", async ({ page }) => {
  const failures = monitorFirstPartyFailures(page);

  await page.goto("/docs/yolo-evolution.html");
  const yolo = page.locator('[data-milestone="yolo-evolution"]');
  await yolo.check();
  await page.reload();
  await expect(yolo).toBeChecked();

  await page.goto("/docs/autonomous-driving.html");
  const driving = page.locator('[data-milestone="autonomous-driving"]');
  await expect(driving).not.toBeChecked();
  await driving.check();

  await page.goto("/docs/autonomy-reasoning.html");
  const reasoning = page.locator('[data-milestone="autonomy-reasoning"]');
  await expect(reasoning).not.toBeChecked();
  await reasoning.check();

  await page.goto("/docs/autonomous-driving.html");
  await expect(driving).toBeChecked();
  const completed = await page.evaluate(() => {
    return window.CVStudyProgress.read().completed;
  });
  expect(completed).toEqual([
    "yolo-evolution",
    "autonomous-driving",
    "autonomy-reasoning"
  ]);
  expect(failures).toEqual([]);
});

test("study hub presents 11 checkpoints and automatic practice gates", async ({
  page
}) => {
  const failures = monitorFirstPartyFailures(page);
  await page.goto("/docs/index.html");

  await expect(page.locator("[data-progress-count]").first()).toHaveText("0 / 11");
  const checkpointIds = await page
    .locator(".milestone-grid [data-milestone]")
    .evaluateAll((inputs) => inputs.map((input) => input.dataset.milestone));
  expect(checkpointIds).toEqual(EXPECTED_MILESTONES);
  await expect(page.locator('[data-milestone="practice"]')).toBeDisabled();
  await expect(page.locator('[data-milestone="coding"]')).toBeDisabled();
  expect(failures).toEqual([]);
});

test("mobile drawer is modal, traps focus, restores focus, and cleans up on resize", async ({
  page
}) => {
  const failures = monitorFirstPartyFailures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/sources.html");

  const toggle = page.locator(".reader-toggle");
  const sidebar = page.locator(".reader-sidebar");
  const close = page.locator(".reader-close");
  const main = page.locator("main#main-content");
  const header = page.locator(".site-header");

  await expect(sidebar).toHaveAttribute("aria-hidden", "true");
  await expect(sidebar).toHaveJSProperty("inert", true);
  await toggle.click();
  await expect(sidebar).toHaveAttribute("role", "dialog");
  await expect(sidebar).toHaveAttribute("aria-modal", "true");
  await expect(main).toHaveJSProperty("inert", true);
  await expect(header).toHaveJSProperty("inert", true);
  await expect(close).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(sidebar.locator(":focus")).toHaveCount(1);
  await page.locator(".reader-overlay").click({ position: { x: 380, y: 420 } });
  await expect(toggle).toBeFocused();
  await expect(main).toHaveJSProperty("inert", false);

  await toggle.click();
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(main).toHaveJSProperty("inert", false);
  await expect(header).toHaveJSProperty("inert", false);
  await expect(sidebar).not.toHaveAttribute("aria-modal", "true");

  await toggle.click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator("body")).not.toHaveClass(/reader-menu-open/);
  await expect(sidebar).not.toHaveAttribute("aria-hidden", "true");
  await expect(sidebar).not.toHaveAttribute("role", "dialog");
  await expect(sidebar).toHaveJSProperty("inert", false);
  await expect(main).toHaveJSProperty("inert", false);
  await expect(header).toHaveJSProperty("inert", false);
  await expect(
    sidebar.locator(".reader-chapters [aria-current='page']")
  ).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(toggle).toBeFocused();
  await expect(sidebar).toHaveAttribute("aria-hidden", "true");
  await expect(sidebar).toHaveJSProperty("inert", true);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(
    sidebar.locator(".reader-chapters [aria-current='page']")
  ).toBeFocused();
  expect(failures).toEqual([]);
});

test("active chapter stays visible with bookmarks without scrolling the document", async ({
  page
}) => {
  const failures = monitorFirstPartyFailures(page);
  await page.setViewportSize({ width: 1280, height: 620 });
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: BOOKMARK_KEY, value: ALL_CHAPTERS }
  );
  await page.goto("/docs/sources.html");

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const sidebar = document.querySelector(".reader-sidebar");
        const active = document.querySelector(
          ".reader-chapters [aria-current='page']"
        );
        if (!sidebar || !active) return false;
        const sidebarRect = sidebar.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();
        return (
          activeRect.top >= sidebarRect.top &&
          activeRect.bottom <= sidebarRect.bottom
        );
      });
    })
    .toBe(true);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  const activeBookmark = page.locator(
    ".reader-chapters [data-page-href='sources.html'] .reader-bookmark"
  );
  await activeBookmark.click();
  await expect(
    page.locator(
      ".reader-chapters [data-page-href='sources.html'] .reader-bookmark"
    )
  ).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(failures).toEqual([]);
});

test("theme and cross-page reader navigation persist", async ({ page }) => {
  const failures = monitorFirstPartyFailures(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/docs/theory.html");

  await page.locator("[data-theme-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page
    .locator(".reader-chapters a[href='perception.html']")
    .click();
  await expect(page).toHaveURL(/\/docs\/perception\.html$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(
    page.locator(".reader-chapters a[aria-current='page']")
  ).toHaveAttribute("href", "perception.html");
  expect(failures).toEqual([]);
});

test("non-book pages use only the legacy navigation controller", async ({ page }) => {
  const failures = monitorFirstPartyFailures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/browser/fixtures/legacy-navigation.html");

  const toggle = page.locator("[data-nav-toggle]");
  const nav = page.locator("[data-primary-nav]");
  await expect(page.locator(".reader-toggle")).toHaveCount(0);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(nav).toHaveAttribute("data-open", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(nav).not.toHaveAttribute("data-open", "true");
  await expect(toggle).toBeFocused();
  expect(failures).toEqual([]);
});
