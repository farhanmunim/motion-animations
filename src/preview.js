/**
 * Live preview. Renders the chosen element into the stage and wires up the
 * real motion.dev functions so the preview behaves exactly like the export.
 */
import { animate, hover, press, inView, scroll, stagger } from "motion";
import { buildPlan, buildTransition, scrollOffset, isMulti, effectiveTrigger, autoCloseSeconds } from "./compile.js";
import { getComponent, isComponent, componentCss } from "./components.js";

let cleanup = [];
let activeAnimations = [];

function stopAll() {
  for (const a of activeAnimations) {
    try {
      a.stop?.();
    } catch {
      /* ignore */
    }
  }
  activeAnimations = [];
  for (const fn of cleanup) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
  cleanup = [];
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Split a string into word or character spans. Spaces stay as plain text so
 * they are not animated and the layout does not shift.
 */
export function splitMarkup(text, mode) {
  const raw = String(text || "Hello");
  if (mode === "chars") {
    // Letters are grouped per word so lines never break in the middle of a word.
    return raw
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => `<span class="motion-word">${[...w].map((ch) => `<span class="motion-item">${escapeHtml(ch)}</span>`).join("")}</span>`)
      .join(" ");
  }
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `<span class="motion-item">${escapeHtml(w)}</span>`)
    .join(" ");
}

/** HTML for the element being animated. Shared with the exporter. */
export function elementMarkup(el, { forExport = false } = {}) {
  const text = escapeHtml(el.text || "Hello");
  if (isComponent(el.type)) return getComponent(el.type).markup;
  switch (el.type) {
    case "circle":
      return `<div class="motion-target demo-shape demo-circle"></div>`;
    case "text":
      if (el.split && el.split !== "none") {
        return `<h1 class="motion-target demo-text demo-split" aria-label="${text}">${splitMarkup(el.text, el.split)}</h1>`;
      }
      return `<h1 class="motion-target demo-text">${text}</h1>`;
    case "button":
      return `<button class="motion-target demo-button">${text}</button>`;
    case "card":
      return `<div class="motion-target demo-card">
  <div class="demo-card-media"></div>
  <div class="demo-card-body">
    <strong>${text}</strong>
    <span>Cards, tiles, thumbnails: anything that lifts, tilts or reveals.</span>
  </div>
</div>`;
    case "list": {
      const items = Array.from({ length: clamp(el.count, 1, 12) }, (_, i) => `  <li class="motion-item demo-item">Item ${i + 1}</li>`);
      return `<ul class="motion-list">\n${items.join("\n")}\n</ul>`;
    }
    case "grid": {
      const tiles = Array.from({ length: clamp(el.count, 1, 12) }, (_, i) => `  <div class="motion-item demo-tile">${i + 1}</div>`);
      return `<div class="motion-grid">\n${tiles.join("\n")}\n</div>`;
    }
    case "custom":
      if (el.animateChildren) {
        return forExport
          ? `<!-- Each direct child of this wrapper is animated. Give them the "motion-item" class. -->\n<div class="motion-target">${addItemClass(el.customHtml)}</div>`
          : `<div class="motion-target demo-custom">${addItemClass(el.customHtml)}</div>`;
      }
      return forExport
        ? `<!-- Give your own element the "motion-target" class -->\n<div class="motion-target">${el.customHtml}</div>`
        : `<div class="motion-target demo-custom">${el.customHtml}</div>`;
    case "box":
    default:
      return `<div class="motion-target demo-shape"></div>`;
  }
}

/** Add class="motion-item" to every top-level element of an HTML string. */
function addItemClass(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  for (const child of tpl.content.children) child.classList.add("motion-item");
  return tpl.innerHTML;
}

/** CSS custom properties that drive the demo element's look. */
export function elementCss(el) {
  return `--demo-color:${el.color};--demo-text:${el.textColor};--demo-radius:${el.radius}px;--demo-size:${el.size}px;`;
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, Number(n) || a));
}

/** Resolve the DOM elements for one plan entry. */
function resolveEntry(stage, root, state, entry) {
  if (isComponent(state.element.type)) {
    if (entry.selector === null) return [root];
    return Array.from(root.querySelectorAll(entry.selector));
  }
  return isMulti(state)
    ? Array.from(stage.querySelectorAll(".motion-item"))
    : Array.from(stage.querySelectorAll(".motion-target"));
}

/**
 * Render the stage for the current state and start the animation.
 * Returns a function that replays the animation (for the "Replay" button).
 */
export function renderPreview(stage, state, setStatus) {
  stopAll();

  const el = state.element;
  const component = isComponent(el.type) ? getComponent(el.type) : null;
  const trigger = effectiveTrigger(state);
  const scrolly = trigger === "inView" || trigger === "scroll";
  stage.classList.toggle("scrolly", scrolly);

  const style = component ? `<style>${componentCss(el.type, el)}</style>` : "";
  const inner = `<div class="stage-inner" style="${elementCss(el)}">${style}${elementMarkup(el)}</div>`;
  stage.innerHTML = scrolly
    ? `<div class="scroll-filler top"><span>Scroll down ↓</span></div>${inner}<div class="scroll-filler bottom"><span>Keep scrolling</span></div>`
    : inner;
  stage.scrollTop = 0;

  // The root: the component / element, or the list / grid wrapper.
  const root = stage.querySelector(".motion-target") || stage.querySelector(".stage-inner")?.lastElementChild;
  if (!root) return () => {};

  const plan = buildPlan(state)
    .map((entry) => ({ ...entry, els: resolveEntry(stage, root, state, entry) }))
    .filter((entry) => entry.els.length && Object.keys(entry.keyframes).length);
  const hasTracks = plan.length > 0;
  const options = (multi, part = null) => buildTransition(state, { mode: "js", staggerFn: stagger, multi, part });

  let isOpen = false;
  let closeTimer;
  cleanup.push(() => clearTimeout(closeTimer));
  const setOpen = (open) => {
    isOpen = open;
    clearTimeout(closeTimer);
    if (open && trigger === "toggle" && autoCloseSeconds(state)) {
      closeTimer = setTimeout(() => setOpen(false), autoCloseSeconds(state) * 1000);
    }
    root.classList.toggle("is-open", open);
    for (const el of [root, ...root.querySelectorAll("[aria-expanded], [aria-checked]")]) {
      for (const attr of ["aria-expanded", "aria-checked"]) if (el.hasAttribute(attr)) el.setAttribute(attr, String(open));
    }
    for (const a of activeAnimations) a.stop?.();
    activeAnimations = plan.map((e) => animate(e.els, open ? e.keyframes : e.from, options(e.multi, e.part)));
  };
  const play = () => setOpen(true);
  const revert = () => setOpen(false);
  const setInitial = () => {
    for (const e of plan) {
      if (!Object.keys(e.from).length) continue;
      const a = animate(e.els, e.from, { duration: 0 });
      a.complete?.();
    }
  };

  // The whole component (or the wrapper for lists / grids) for viewport checks.
  const viewTarget = isMulti(state) ? stage.querySelector(".stage-inner").lastElementChild : root;

  switch (trigger) {
    case "toggle": {
      setStatus(component ? "Click the component to open and close it" : "Click the element to play, click again to reverse");
      setInitial();
      const clickers = component?.clicks?.length ? component.clicks.flatMap((s) => Array.from(root.querySelectorAll(s))) : [viewTarget];
      for (const c of clickers) {
        const handler = (e) => {
          e.preventDefault();
          setOpen(!isOpen);
        };
        c.addEventListener("click", handler);
        cleanup.push(() => c.removeEventListener("click", handler));
      }
      return () => setOpen(!isOpen);
    }
    case "hover": {
      setStatus("Hover the element to preview");
      setInitial();
      const targets = component ? [root] : plan.flatMap((e) => e.els);
      for (const t of targets) {
        cleanup.push(
          hover(t, () => {
            if (component) play();
            else activeAnimations.push(...plan.map((e) => animate(t, e.keyframes, options(false, e.part))));
            return () => {
              if (!state.hover.revert) return;
              if (component) revert();
              else activeAnimations.push(...plan.map((e) => animate(t, e.from, options(false, e.part))));
            };
          }),
        );
      }
      return play;
    }
    case "press": {
      setStatus("Press and hold the element to preview");
      setInitial();
      const targets = component ? [root] : plan.flatMap((e) => e.els);
      for (const t of targets) {
        cleanup.push(
          press(t, () => {
            if (component) play();
            else activeAnimations.push(...plan.map((e) => animate(t, e.keyframes, options(false, e.part))));
            return () => {
              if (component) revert();
              else activeAnimations.push(...plan.map((e) => animate(t, e.from, options(false, e.part))));
            };
          }),
        );
      }
      return play;
    }
    case "inView": {
      setStatus("Scroll the preview to bring the element into view");
      setInitial();
      cleanup.push(
        inView(
          viewTarget,
          () => {
            play();
            if (state.inView.once) return;
            return () => revert();
          },
          { root: stage, amount: state.inView.amount },
        ),
      );
      return () => {
        stage.scrollTo({ top: 0 });
        revert();
      };
    }
    case "scroll": {
      setStatus("Scroll the preview: the animation follows your scroll position");
      if (!hasTracks) return () => {};
      for (const e of plan) {
        const anim = animate(e.els, e.keyframes, options(e.multi, e.part));
        activeAnimations.push(anim);
        cleanup.push(scroll(anim, { container: stage, target: viewTarget, offset: scrollOffset(state) }));
      }
      return () => stage.scrollTo({ top: 0, behavior: "smooth" });
    }
    case "load":
    default: {
      setStatus(hasTracks ? "Playing on load" : "Add a property to animate");
      if (hasTracks) play();
      return play;
    }
  }
}
