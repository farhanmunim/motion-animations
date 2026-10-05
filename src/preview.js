/**
 * Live preview. Renders the chosen element into the stage and wires up the
 * real motion.dev functions so the preview behaves exactly like the export.
 */
import { animate, hover, press, inView, scroll, stagger, interpolate, motionValue, springValue, styleEffect, transformValue } from "motion";
import { buildPlan, buildTransition, scrollOffset, isMulti, effectiveTrigger, autoCloseSeconds, buildFollow, needs3d, scrambleChars, scrambleRank, stepCount } from "./compile.js";
import { resolveEase } from "./props.js";
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
export function splitMarkup(text, mode, mask = false) {
  const raw = String(text || "Hello");
  if (mode === "chars") {
    // Letters are grouped per word so lines never break in the middle of a word.
    return raw
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => `<span class="motion-word${mask ? " motion-mask" : ""}">${[...w].map((ch) => `<span class="motion-item">${escapeHtml(ch)}</span>`).join("")}</span>`)
      .join(" ");
  }
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (mask ? `<span class="motion-mask"><span class="motion-item">${escapeHtml(w)}</span></span>` : `<span class="motion-item">${escapeHtml(w)}</span>`))
    .join(" ");
}

/** HTML for the element being animated. Shared with the exporter. */
export function elementMarkup(el, { forExport = false } = {}) {
  const text = escapeHtml(el.text || "Hello");
  if (isComponent(el.type)) return getComponent(el.type).markup;
  switch (el.type) {
    case "circle":
      return `<div class="motion-target demo-shape demo-circle"></div>`;
    case "scramble":
      return `<h1 class="motion-target demo-text" aria-label="${text}">${text}</h1>`;
    case "text":
      if (el.split && el.split !== "none") {
        return `<h1 class="motion-target demo-text demo-split" aria-label="${text}">${splitMarkup(el.text, el.split, el.mask)}</h1>`;
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
  const text = el.textColor === "auto" ? (el.type === "text" || el.type === "scramble" ? "var(--text-1)" : "#ffffff") : el.textColor;
  return `--demo-color:${el.color};--demo-text:${text};--demo-radius:${el.radius}px;--demo-size:${el.size}px;`;
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
  // A scrollable area has to be reachable with the keyboard, and needs a name.
  if (scrolly) {
    stage.tabIndex = 0;
    stage.setAttribute("role", "region");
    stage.setAttribute("aria-label", "Scrollable preview");
  } else {
    stage.tabIndex = -1;
    stage.removeAttribute("role");
    stage.removeAttribute("aria-label");
  }
  // Pointer-following elements bring their own perspective, like the export does.
  stage.classList.toggle("flat", trigger === "pointer");

  const style = component ? `<style>${componentCss(el.type, el)}</style>` : "";
  const inner = `<div class="stage-inner" style="${elementCss(el)}">${style}${elementMarkup(el)}</div>`;
  stage.innerHTML = scrolly
    ? `<div class="scroll-filler top"><span>The element is below. Scroll down to reveal it</span><i>↓</i></div>${inner}<div class="scroll-filler bottom"><span>Keep scrolling, then scroll back up to replay</span></div>`
    : inner;
  stage.scrollTop = 0;

  // The root: the component / element, or the list / grid wrapper.
  const root = stage.querySelector(".motion-target") || stage.querySelector(".stage-inner")?.lastElementChild;
  if (!root) return () => {};

  if (el.type === "scramble") return renderScramble(stage, root, state, setStatus);

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
    case "step": {
      const count = stepCount(state);
      setStatus(component ? "Click the component to move to the next state" : "Click the element to move to the next state");
      let index = 0;
      // Elements that jump straight to their own state (tabs, dots), and the ones that just go next.
      const jumpers = component?.jumps?.length ? component.jumps.flatMap((s) => Array.from(root.querySelectorAll(s))) : [];
      const goTo = (next) => {
        index = ((next % count) + count) % count;
        root.dataset.step = String(index);
        jumpers.forEach((el, i) => {
          if (!el.hasAttribute("aria-selected")) return;
          el.setAttribute("aria-selected", String(i === index));
          el.tabIndex = i === index ? 0 : -1; // only the selected tab is in the tab order
        });
        for (const a of activeAnimations) a.stop?.();
        activeAnimations = plan.map((e) => animate(e.els, e.states[index], options(e.multi, e.part)));
      };
      for (const e of plan) animate(e.els, e.states[0], { duration: 0 }).complete?.();
      root.dataset.step = "0";
      const nexters = component?.clicks?.length ? component.clicks.flatMap((s) => Array.from(root.querySelectorAll(s))) : jumpers.length ? [] : [viewTarget];
      const on2 = (el, type, handler) => {
        el.addEventListener(type, handler);
        cleanup.push(() => el.removeEventListener(type, handler));
      };
      const on = (el, handler) => on2(el, "click", handler);
      for (const el of nexters) on(el, (event) => (event.preventDefault(), goTo(index + 1)));
      jumpers.forEach((el, i) => on(el, (event) => (event.preventDefault(), goTo(i))));
      if (jumpers.some((el) => el.hasAttribute("aria-selected"))) {
        // Arrow keys move between tabs.
        on2(root, "keydown", (event) => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          event.preventDefault();
          goTo(index + (event.key === "ArrowRight" ? 1 : -1));
          jumpers[index].focus();
        });
      }
      const every = Number(state.step?.every) || 0;
      if (every > 0) {
        const timer = setInterval(() => goTo(index + 1), every * 1000);
        cleanup.push(() => clearInterval(timer));
      }
      return () => goTo(index + 1);
    }
    case "pointer": {
      const follow = buildFollow(state)
        .map((f) => ({ ...f, els: f.selector === null ? [root] : Array.from(root.querySelectorAll(f.selector)) }))
        .filter((f) => f.els.length);
      if (!follow.length) {
        setStatus("Add a property to animate");
        return () => {};
      }
      setStatus("Move your pointer over the element. A short demo plays first");
      const spring = options(false);
      const perspective = Number(state.pointer?.perspective) || 900;
      const is3d = needs3d(state);
      const scene = state.pointer?.area === "scene";
      const radius = Number(state.pointer?.radius) || 120;
      const hold = !!state.pointer?.hold;
      const drag = !!state.pointer?.drag;
      // Magnified items stick out past the element's box, so count a margin around it as "over".
      const hitPad = follow.some((f) => Object.values(f.props).some((p) => p.axis === "near")) ? radius / 2 : 0;
      const rest = { x: 0, y: 0, enter: 0, px: -Infinity, cursorX: 0, cursorY: 0 };
      // "cursorX / cursorY": the pointer's distance from the middle in px, times a strength.
      const mapFor = (axis, range) =>
        axis === "cursorX" || axis === "cursorY" ? (value) => value * Number(range[1]) : interpolate(axis === "x" || axis === "y" ? [-1, 1] : [0, 1], range);
      // "near": how close the pointer is to an item's own centre, 1 on top of it, 0 at `radius` px away.
      const nearOf = (target, px) => {
        const box = target.getBoundingClientRect();
        return Math.max(0, 1 - Math.abs(px - (box.left + box.width / 2)) / radius);
      };

      // 1. The pointer's numbers. A spring chases each one, so everything glides instead of jumping.
      //    (Restarting an animation on every mouse move lets fast movement make springs run away.)
      const sources = { x: motionValue(0), y: motionValue(0), enter: motionValue(0), cursorX: motionValue(0), cursorY: motionValue(0) };
      const smooth = Object.fromEntries(Object.entries(sources).map(([axis, value]) => [axis, springValue(value, spring)]));
      const closeness = []; // near: one spring per item

      // 2. Connect every property of every element to the spring it follows.
      const stops = [];
      for (const f of follow) {
        for (const el of f.els) {
          const styles = {};
          for (const [prop, p] of Object.entries(f.props)) {
            const map = mapFor(p.axis, p.range);
            let source = smooth[p.axis];
            if (p.axis === "near") {
              let item = closeness.find((entry) => entry.el === el);
              if (!item) {
                const value = motionValue(0);
                closeness.push((item = { el, value, smooth: springValue(value, spring) }));
              }
              source = item.smooth;
            }
            styles[prop] = transformValue(() => map(source.get()));
          }
          if (is3d && f.selector === null) styles.transformPerspective = motionValue(perspective);
          stops.push(styleEffect(el, styles));
        }
      }
      cleanup.push(() => {
        for (const stop of stops) stop();
        for (const value of [...Object.values(smooth), ...closeness.map((c) => c.smooth)]) value.destroy?.();
      });

      const update = (pointer) => {
        // Read every position first, then write: mixing the two forces a re-layout each time.
        const levels = closeness.map((item) => nearOf(item.el, pointer.px));
        for (const axis in sources) sources[axis].set(pointer[axis] ?? 0);
        closeness.forEach((item, i) => item.value.set(levels[i]));
      };
      if (is3d) root.style.transformStyle = "preserve-3d";
      update(rest);

      // A short scripted sweep so the effect is visible before you touch anything.
      let demoFrame = 0;
      const stopDemo = () => {
        cancelAnimationFrame(demoFrame);
        demoFrame = 0;
      };
      const runDemo = () => {
        stopDemo();
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / 2400);
          const angle = p * Math.PI * 2 - Math.PI / 2;
          const reach = 0.85 * Math.sin(Math.PI * p);
          const x = Math.cos(angle) * reach;
          const box = (scene ? stage : root).getBoundingClientRect();
          const width = scene ? box.width : root.offsetWidth;
          const height = scene ? box.height : root.offsetHeight;
          const y = Math.sin(angle) * reach;
          update({ x, y, enter: 1, px: box.left + ((x + 1) / 2) * width, cursorX: (x * width) / 2, cursorY: (y * height) / 2 });
          if (p < 1) demoFrame = requestAnimationFrame(tick);
          else update(rest);
        };
        demoFrame = requestAnimationFrame(tick);
      };

      // Hit-testing uses the element's untransformed box, so tilting never makes
      // the edge flicker in and out from under the pointer.
      const clamp = (v) => Math.max(-1, Math.min(1, v));
      let inside = false;
      let frame = 0;
      const onMove = (event) => {
        if (event.pointerType === "touch") return;
        stopDemo();
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          let x;
          let y;
          let cursorX;
          let cursorY;
          if (scene) {
            const r = stage.getBoundingClientRect();
            x = ((event.clientX - r.left) / r.width) * 2 - 1;
            y = ((event.clientY - r.top) / r.height) * 2 - 1;
            cursorX = event.clientX - (r.left + r.width / 2);
            cursorY = event.clientY - (r.top + r.height / 2);
          } else {
            const box = root.getBoundingClientRect();
            x = (event.clientX - box.left - box.width / 2) / (root.offsetWidth / 2);
            y = (event.clientY - box.top - box.height / 2) / (root.offsetHeight / 2 + hitPad);
            cursorX = event.clientX - (box.left + box.width / 2);
            cursorY = event.clientY - (box.top + box.height / 2);
          }
          const over = Math.abs(x) <= 1 && Math.abs(y) <= 1;
          if (over) update({ x: clamp(x), y: clamp(y), enter: 1, px: event.clientX, cursorX, cursorY });
          else if (inside && !hold) update(rest);
          inside = over;
        });
      };
      const onLeave = () => {
        stopDemo();
        inside = false;
        if (!hold) update(rest);
      };
      if (drag) {
        // Direct manipulation: grab the element, pull it around, let go and it springs back.
        setStatus("Drag the element. It springs back when you let go");
        root.style.touchAction = "none";
        root.style.cursor = "grab";
        root.style.userSelect = "none";
        let start = null;
        const onDown = (event) => {
          stopDemo();
          start = { x: event.clientX, y: event.clientY };
          root.setPointerCapture?.(event.pointerId);
          root.style.cursor = "grabbing";
          update({ ...rest, enter: 1, px: event.clientX });
        };
        const onDrag = (event) => {
          if (!start) return;
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            const cursorX = event.clientX - start.x;
            const cursorY = event.clientY - start.y;
            update({ x: clamp(cursorX / (root.offsetWidth / 2)), y: clamp(cursorY / (root.offsetHeight / 2)), enter: 1, px: event.clientX, cursorX, cursorY });
          });
        };
        const onUp = () => {
          if (!start) return;
          start = null;
          cancelAnimationFrame(frame);
          root.style.cursor = "grab";
          if (!hold) update(rest);
        };
        root.addEventListener("pointerdown", onDown);
        root.addEventListener("pointermove", onDrag);
        root.addEventListener("pointerup", onUp);
        root.addEventListener("pointercancel", onUp);
        const dragTimer = setTimeout(runDemo, 350);
        cleanup.push(() => {
          root.removeEventListener("pointerdown", onDown);
          root.removeEventListener("pointermove", onDrag);
          root.removeEventListener("pointerup", onUp);
          root.removeEventListener("pointercancel", onUp);
          cancelAnimationFrame(frame);
          stopDemo();
          clearTimeout(dragTimer);
        });
        return runDemo;
      }
      document.addEventListener("pointermove", onMove);
      document.documentElement.addEventListener("pointerleave", onLeave);
      const startTimer = setTimeout(runDemo, 350);
      cleanup.push(() => {
        document.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        cancelAnimationFrame(frame);
        stopDemo();
        clearTimeout(startTimer);
      });
      return runDemo;
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

/** Text scramble: letters shuffle, then settle left to right into the real text. */
function renderScramble(stage, root, state, setStatus) {
  const trigger = effectiveTrigger(state);
  const finalText = state.element.text || "Hello";
  const chars = scrambleChars(state);
  const letters = finalText.replace(/\s+/g, ""); // the cells hold letters only, never spaces
  const t = state.transition;
  let animation;
  // Built once: swapping elements under a resting pointer would fire a fresh hover event.
  const { cells, pools } = lockLetters(root, finalText, chars);
  const run = () => {
    animation?.stop();
    const rank = scrambleRank(cells.length, state.scramble?.order);
    animation = animate(0, 1, {
      duration: Math.max(0.05, Number(t.duration) || 1),
      delay: Number(t.delay) || 0,
      ease: resolveEase(t),
      onUpdate: (progress) => {
        const settled = Math.floor(progress * cells.length);
        cells.forEach((cell, i) => (cell.textContent = rank[i] < settled ? letters[i] : pools[i][Math.floor(Math.random() * pools[i].length)]));
      },
    });
    activeAnimations = [animation];
  };
  cleanup.push(() => animation?.stop());
  switch (trigger) {
    case "hover":
      setStatus("Hover the text to scramble it");
      cleanup.push(hover(root, run));
      break;
    case "toggle":
      setStatus("Click the text to scramble it again");
      root.addEventListener("click", run);
      cleanup.push(() => root.removeEventListener("click", run));
      break;
    case "inView":
      setStatus("Scroll the preview to bring the text into view");
      cleanup.push(inView(root, () => run(), { root: stage, amount: state.inView.amount }));
      break;
    default:
      setStatus("Playing on load");
      run();
  }
  return run;
}

/**
 * Give every letter a cell as wide as the real letter, so shuffling never makes
 * the text jump sideways. Returns the cells in reading order (spaces excluded)
 * and, for each, the characters it may shuffle through.
 */
function lockLetters(root, text, chars) {
  root.textContent = text;
  const node = root.firstChild;
  const range = document.createRange();
  let index = 0;
  const widths = [...text].map((char) => {
    range.setStart(node, index);
    range.setEnd(node, index + char.length);
    index += char.length;
    return range.getBoundingClientRect().width;
  });
  // Shuffle only through characters narrow enough for their cell, so neighbours never overlap.
  const measure = document.createElement("canvas").getContext("2d");
  const style = getComputedStyle(root);
  measure.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const sizes = Object.fromEntries([...chars].map((char) => [char, measure.measureText(char).width]));
  const fit = (width) => {
    const ok = [...chars].filter((char) => sizes[char] <= width * 1.08);
    return ok.length ? ok : [[...chars].sort((a, b) => sizes[a] - sizes[b])[0]];
  };

  root.textContent = "";
  const cells = [];
  const pools = [];
  let n = 0;
  for (const part of text.split(/(\s+)/)) {
    if (/^\s+$/.test(part)) {
      root.append(part);
      n += [...part].length;
      continue;
    }
    const word = document.createElement("span");
    word.style.whiteSpace = "nowrap"; // a word never breaks apart while it shuffles
    for (const char of part) {
      const cell = document.createElement("span");
      cell.style.cssText = `display:inline-block;width:${widths[n]}px;text-align:center`;
      cell.textContent = char;
      word.append(cell);
      cells.push(cell);
      pools.push(fit(widths[n++]));
    }
    root.append(word);
  }
  return { cells, pools };
}
