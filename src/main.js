import { createStore, clone, DEFAULT_STATE } from "./state.js";
import { renderPreview } from "./preview.js";
import { renderLibrary, renderDesign, renderCode, copy } from "./ui.js";
import { generateVanilla } from "./codegen.js";
import { merge } from "./state.js";

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
try {
  const saved = localStorage.getItem("motion-studio:theme");
  if (saved) applyTheme(saved);
} catch {
  /* ignore */
}
$("#btn-theme").addEventListener("click", () => {
  const current = document.documentElement.dataset.theme || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
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

store.subscribe((state, meta) => {
  // `rerender: false` means a slider moved: keep the inputs, refresh the rest.
  const structural = meta.rerender !== false;
  drawAll(meta);
  if (structural) drawLibrary();
  if (structural || $("#auto-replay").checked) schedulePreview(structural);
});

drawLibrary();
drawAll({ rerender: true });
schedulePreview(true);

/* --- Top bar actions ----------------------------------------------------- */

$("#btn-replay").addEventListener("click", () => replay());

$("#btn-reset").addEventListener("click", () => {
  store.replace({ tracks: [], name: "Untitled animation", presetId: null }, { rerender: true });
  toast("Blank canvas. Add a property to start.");
});

$("#btn-share").addEventListener("click", () => {
  const url = store.shareUrl();
  history.replaceState(null, "", url);
  copy(url, toast, "Share link copied");
});

const exportModal = $("#export-modal");
$("#btn-export").addEventListener("click", () => {
  renderCode($("#export-body"), store.get(), { onToast: toast, full: true });
  exportModal.classList.remove("hidden");
});
$("#btn-close-export").addEventListener("click", () => exportModal.classList.add("hidden"));
exportModal.addEventListener("click", (e) => {
  if (e.target === exportModal) exportModal.classList.add("hidden");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") exportModal.classList.add("hidden");
  if ((e.metaKey || e.ctrlKey) && e.key === "z" && !isTyping(e)) {
    e.preventDefault();
    store.undo();
  }
  if (e.key === " " && !isTyping(e) && !e.target.closest("button, [role=button]")) {
    e.preventDefault();
    replay();
  }
});

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
}

/* --- Inspector tabs -------------------------------------------------------- */

for (const tab of document.querySelectorAll(".tabs .tab")) {
  tab.addEventListener("click", () => {
    for (const t of document.querySelectorAll(".tabs .tab")) t.classList.toggle("active", t === tab);
    designPanel.classList.toggle("hidden", tab.dataset.tab !== "design");
    codePanel.classList.toggle("hidden", tab.dataset.tab !== "code");
  });
}

/* --- Mobile navigation ------------------------------------------------------ */

function showView(view) {
  document.body.dataset.view = view;
  for (const b of document.querySelectorAll(".mobile-nav button")) b.classList.toggle("active", b.dataset.view === view);
  if (view === "design" || view === "code") {
    for (const t of document.querySelectorAll(".tabs .tab")) t.classList.toggle("active", t.dataset.tab === view);
    designPanel.classList.toggle("hidden", view !== "design");
    codePanel.classList.toggle("hidden", view !== "code");
  }
}
for (const b of document.querySelectorAll(".mobile-nav button")) {
  b.addEventListener("click", () => showView(b.dataset.view));
}
document.body.dataset.view = "stage";

// Re-run the preview when the stage is resized (e.g. rotating a phone).
new ResizeObserver(() => {
  if (store.get().trigger === "scroll") schedulePreview();
}).observe(stage);
