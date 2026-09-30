/**
 * Live preview. Renders the chosen element into the stage and wires up the
 * real motion.dev functions so the preview behaves exactly like the export.
 */
import { animate, hover, press, inView, scroll, stagger } from "motion";
import { buildKeyframes, buildFromValues, buildTransition, scrollOffset, isMulti } from "./compile.js";

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
    return [...raw]
      .map((ch) => (ch.trim() === "" ? " " : `<span class="motion-item">${escapeHtml(ch)}</span>`))
      .join("");
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

/** CSS custom properties that drive the demo element's look. */
export function elementCss(el) {
  return `--demo-color:${el.color};--demo-text:${el.textColor};--demo-radius:${el.radius}px;--demo-size:${el.size}px;`;
}

/** Add class="motion-item" to every top-level element of an HTML string. */
function addItemClass(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  for (const child of tpl.content.children) child.classList.add("motion-item");
  return tpl.innerHTML;
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, Number(n) || a));
}

function targets(stage, state) {
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

  const scrolly = state.trigger === "inView" || state.trigger === "scroll";
  stage.classList.toggle("scrolly", scrolly);

  const inner = `<div class="stage-inner" style="${elementCss(state.element)}">${elementMarkup(state.element)}</div>`;
  stage.innerHTML = scrolly
    ? `<div class="scroll-filler top"><span>Scroll down ↓</span></div>${inner}<div class="scroll-filler bottom"><span>Keep scrolling</span></div>`
    : inner;
  stage.scrollTop = 0;

  const els = targets(stage, state);
  if (!els.length) return () => {};

  const keyframes = buildKeyframes(state);
  const from = buildFromValues(state);
  const hasTracks = Object.keys(keyframes).length > 0;
  const options = () => buildTransition(state, { mode: "js", staggerFn: stagger });

  const play = () => {
    if (!hasTracks) return;
    for (const a of activeAnimations) a.stop?.();
    activeAnimations = [animate(els, keyframes, options())];
  };

  const revert = () => {
    for (const a of activeAnimations) a.stop?.();
    activeAnimations = [animate(els, from, revertOptions(state))];
  };

  switch (state.trigger) {
    case "hover": {
      setStatus("Hover the element to preview");
      setInitial(els, from);
      for (const el of els) {
        cleanup.push(
          hover(el, () => {
            play();
            return () => state.hover.revert && revert();
          }),
        );
      }
      return play;
    }
    case "press": {
      setStatus("Press and hold the element to preview");
      setInitial(els, from);
      for (const el of els) {
        cleanup.push(
          press(el, () => {
            play();
            return () => revert();
          }),
        );
      }
      return play;
    }
    case "inView": {
      setStatus("Scroll the preview to bring the element into view");
      setInitial(els, from);
      const target = isMulti(state) ? stage.querySelector(".stage-inner").firstElementChild : els[0];
      cleanup.push(
        inView(
          target,
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
      const target = isMulti(state) ? stage.querySelector(".stage-inner").firstElementChild : els[0];
      const anim = animate(els, keyframes, options());
      activeAnimations = [anim];
      cleanup.push(scroll(anim, { container: stage, target, offset: scrollOffset(state) }));
      return () => stage.scrollTo({ top: 0, behavior: "smooth" });
    }
    case "load":
    default: {
      setStatus(hasTracks ? "Playing on load" : "Add a property to animate");
      play();
      return play;
    }
  }
}

function setInitial(els, from) {
  if (!Object.keys(from).length) return;
  const a = animate(els, from, { duration: 0 });
  a.complete?.();
}

/** Revert animations (hover leave / press release) use a quick, calm tween. */
function revertOptions(state) {
  const t = state.transition;
  if (t.type === "spring") {
    return t.springMode === "visual"
      ? { type: "spring", visualDuration: Number(t.visualDuration), bounce: Number(t.bounce) }
      : { type: "spring", stiffness: Number(t.stiffness), damping: Number(t.damping), mass: Number(t.mass) || 1 };
  }
  return { duration: Number(t.duration) || 0.3, ease: t.ease === "custom" ? t.bezier : t.ease };
}
