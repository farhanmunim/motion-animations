import { createStore, clone, DEFAULT_STATE } from "./state.js";
import { renderPreview } from "./preview.js";
import { renderLibrary, renderDesign, renderCode, copy, isDirty } from "./ui.js";
import { generateVanilla } from "./codegen.js";
import { merge } from "./state.js";
import { mountTimeline } from "./v2/index.js";

const $ = (sel) => document.querySelector(sel);

const store = createStore();
const stage = $("#stage");
const stageStatus = $("#stage-status");
const designPanel = $("#tab-design");
const codePanel = $("#tab-code");
const libraryPanel = $("#preset-list");
const toastEl = $("#toast");

let replay = () => {};
let toastTimer;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function setStatus(msg) {
  stageStatus.textContent = msg;
}

/* --- Theme ------------------------------------------------------------- */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("motion-studio:theme", theme);
  } catch {
    /* ignore */
  }
}
{
  let saved = null;
  try {
    saved = localStorage.getItem("motion-studio:theme");
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
$("#btn-theme").addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

/* --- Rendering ---------------------------------------------------------- */

let previewTimer;
function schedulePreview(immediate = false) {
  clearTimeout(previewTimer);
  const run = () => {
    replay = renderPreview(stage, store.get(), setStatus);
  };
  if (immediate) run();
  else previewTimer = setTimeout(run, 120);
}

function drawLibrary() {
  renderLibrary(libraryPanel, {
    activeId: store.get().presetId,
    dirty: isDirty(store.get()),
    onEdit: (preset) => {
      store.replace({ ...preset.state, name: preset.name, presetId: preset.id }, { rerender: true });
      showView("stage");
      toast(`Editing “${preset.name}”`);
    },
    onCopy: (preset) => {
      const state = merge(clone(DEFAULT_STATE), preset.state);
      copy(generateVanilla(state), toast, `Copied “${preset.name}” as a JS module`);
    },
  });
}

function drawAll(meta = {}) {
  if (meta.rerender !== false) {
    renderDesign(designPanel, store);
  }
  renderCode(codePanel, store.get(), { onToast: toast });
  if (!$("#export-modal").classList.contains("hidden")) {
    renderCode($("#export-body"), store.get(), { onToast: toast, full: true });
  }
}

let lastDirty = null;
store.subscribe((state, meta) => {
  // `rerender: false` means a slider moved: keep the inputs, refresh the rest.
  const structural = meta.rerender !== false;
  drawAll(meta);
  const dirty = isDirty(state);
  if (structural || dirty !== lastDirty) {
    drawLibrary();
    // Keep the inspector's "edited / revert" line in sync without a full re-render.
    if (!structural) renderDesign(designPanel, store, { headerOnly: true });
  }
  lastDirty = dirty;
  if (structural || $("#auto-replay").checked) schedulePreview(structural);
});

drawLibrary();
drawAll({ rerender: true });
schedulePreview(true);

/* --- Top bar actions ----------------------------------------------------- */

// Demo links use href="#": keep them from navigating (and dropping the share hash).
for (const id of ["#stage", "#t-stage"]) {
  $(id)?.addEventListener("click", (e) => {
    if (e.target.closest('a[href="#"]')) e.preventDefault();
  });
}

/* --- Modes: Quick (v1) and Timeline (v2) ---------------------------------- */

let timelineCtl = null;
const quickCtl = {
  replay: () => replay(),
  reset: () => {
    store.replace({ tracks: [], name: "Untitled animation", presetId: null }, { rerender: true });
    toast("Blank canvas. Add a property to start.");
  },
  shareUrl: () => store.shareUrl(),
  renderExport: (container) => renderCode(container, store.get(), { onToast: toast, full: true }),
  undo: () => store.undo(),
};
const active = () => (document.body.dataset.mode === "timeline" ? timelineCtl : quickCtl);

function setMode(mode) {
  document.body.dataset.mode = mode;
  for (const b of document.querySelectorAll(".mode-switch .mode")) {
    const on = b.dataset.mode === mode;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  }
  if (mode === "timeline" && !timelineCtl) {
    timelineCtl = mountTimeline({
      library: $("#t-library"),
      stage: $("#t-stage"),
      timelineEl: $("#t-timeline"),
      design: $("#t-design"),
      code: $("#t-code"),
      exportBody: $("#export-body"),
      setStatus,
      toast,
    });
  } else if (mode === "timeline") {
    timelineCtl.refresh();
  } else {
    schedulePreview(true);
  }
  selectTab(document.querySelector(".tabs .tab.active")?.dataset.tab || "design");
  // Timeline mode lives at /v2; Quick mode at /.
  const path = mode === "timeline" ? "/v2" : "/";
  if (location.pathname.replace(/\/$/, "") !== path.replace(/\/$/, "")) history.replaceState(null, "", path);
  document.title = mode === "timeline" ? "Motion Studio – Timeline (v2): choreograph elements on one timeline" : "Motion Studio – Visual animation builder for motion.dev";
  try {
    localStorage.setItem("motion-studio:mode", mode);
  } catch {
    /* ignore */
  }
}
for (const b of document.querySelectorAll(".mode-switch .mode")) b.addEventListener("click", () => setMode(b.dataset.mode));

$("#btn-replay").addEventListener("click", () => active().replay());

$("#btn-reset").addEventListener("click", () => active().reset());

$("#btn-share").addEventListener("click", () => {
  const url = active().shareUrl();
  history.replaceState(null, "", url);
  copy(url, toast, "Share link copied");
});

/** Minimal accessible dialog: focus moves in on open and back out on close. */
function dialog(backdrop, openBtn, closeBtn, onOpen) {
  let returnTo = null;
  const open = () => {
    onOpen?.();
    returnTo = document.activeElement;
    backdrop.classList.remove("hidden");
    closeBtn.focus();
  };
  const close = () => {
    if (backdrop.classList.contains("hidden")) return;
    backdrop.classList.add("hidden");
    returnTo?.focus?.();
  };
  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => e.target === backdrop && close());
  return { open, close };
}
const exportModal = $("#export-modal");
const exportDialog = dialog(exportModal, $("#btn-export"), $("#btn-close-export"), () => active().renderExport($("#export-body")));
const shortcutsDialog = dialog($("#shortcuts-modal"), $("#btn-shortcuts"), $("#btn-close-shortcuts"));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    exportDialog.close();
    shortcutsDialog.close();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === "z" && !isTyping(e)) {
    e.preventDefault();
    active().undo();
  }
  if (e.key === " " && !isTyping(e) && !e.target.closest("button, [role=button]")) {
    e.preventDefault();
    active().replay();
  }
});

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
}

/* --- Inspector tabs -------------------------------------------------------- */

function selectTab(name) {
  for (const t of document.querySelectorAll(".tabs .tab")) {
    const on = t.dataset.tab === name;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
    t.tabIndex = on ? 0 : -1;
  }
  designPanel.classList.toggle("hidden", name !== "design");
  codePanel.classList.toggle("hidden", name !== "code");
  $("#t-design").classList.toggle("hidden", name !== "design");
  $("#t-code").classList.toggle("hidden", name !== "code");
}
for (const tab of document.querySelectorAll(".tabs .tab")) {
  tab.addEventListener("click", () => selectTab(tab.dataset.tab));
  tab.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = tab.dataset.tab === "design" ? "code" : "design";
    selectTab(next);
    document.querySelector(`.tabs .tab[data-tab="${next}"]`).focus();
  });
}

/* --- Mobile navigation ------------------------------------------------------ */

function showView(view) {
  document.body.dataset.view = view;
  for (const b of document.querySelectorAll(".mobile-nav button")) {
    const on = b.dataset.view === view;
    b.classList.toggle("active", on);
    if (on) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  }
  if (view === "design" || view === "code") selectTab(view);
}
for (const b of document.querySelectorAll(".mobile-nav button")) {
  b.addEventListener("click", () => showView(b.dataset.view));
}
document.body.dataset.view = "stage";

{
  // /v2 (or a #t= share link) opens Timeline mode; / opens Quick mode.
  const atV2 = /^\/v2\/?$/.test(location.pathname) || location.hash.startsWith("#t=");
  if (atV2) setMode("timeline");
  else document.body.dataset.mode = "quick";
}

// Re-run the preview when the stage is resized (e.g. rotating a phone).
new ResizeObserver(() => {
  if (store.get().trigger === "scroll") schedulePreview();
}).observe(stage);
