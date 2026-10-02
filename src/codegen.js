/**
 * Turns the current design into copy-paste-ready code for plain HTML/JS
 * projects:
 *   - a JavaScript module for projects with a bundler (`npm install motion`)
 *   - a <script type="module"> block that loads motion from a CDN, to drop
 *     into any HTML page with no build step
 *   - a complete standalone HTML file for trying it out
 *   - the CSS that makes the exported element look like the preview
 */
import { Raw, buildKeyframes, buildFromValues, buildFollow, buildPlan, buildTimes, buildTransition, effectiveTrigger, isMulti, needs3d, scrollOffset, staggerCode, targetSelector, autoCloseSeconds } from "./compile.js";
import { elementMarkup } from "./preview.js";
import { getComponent, isComponent, componentCss } from "./components.js";

export const MOTION_VERSION = "13";
export const CDN_URL = `https://cdn.jsdelivr.net/npm/motion@${MOTION_VERSION}/+esm`;

/* --- Serialization ----------------------------------------------------- */

const IDENT = /^[A-Za-z_$][\w$]*$/;

/** Serialize a JS value as readable source code. */
export function js(value, indent = 0) {
  const pad = "  ".repeat(indent);
  const padIn = "  ".repeat(indent + 1);
  if (value instanceof Raw) return value.code;
  if (value === Infinity) return "Infinity";
  if (typeof value === "number") return String(round(value));
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean" || value === null || value === undefined) return String(value);
  if (Array.isArray(value)) return `[${value.map((v) => js(v, indent + 1)).join(", ")}]`;
  const keys = Object.keys(value);
  if (!keys.length) return "{}";
  const lines = keys.map((k) => `${padIn}${IDENT.test(k) ? k : JSON.stringify(k)}: ${js(value[k], indent + 1)},`);
  return `{\n${lines.join("\n")}\n${pad}}`;
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

/* --- Shared bits -------------------------------------------------------- */

function wrapperSelector(state) {
  const t = state.element.type;
  if (t === "list") return ".motion-list";
  if (t === "grid") return ".motion-grid";
  return ".motion-target";
}

function needsSplit(state) {
  return state.element.type === "text" && state.element.split && state.element.split !== "none";
}

const SPLIT_HELPER = `/**
 * Splits a heading into <span class="motion-item"> per word or character so
 * each piece can be animated separately. Spaces are left as plain text, and
 * in "chars" mode the letters of a word are grouped so words never break.
 * With mask = true each piece is clipped, so it can slide up from behind a line.
 */
function splitText(element, mode = "words", mask = false) {
  const text = element.textContent;
  element.textContent = "";
  element.setAttribute("aria-label", text);
  const item = (content) => {
    const span = document.createElement("span");
    span.className = "motion-item";
    span.textContent = content;
    return span;
  };
  for (const part of text.split(/(\\s+)/)) {
    if (part.trim() === "") {
      element.append(part);
    } else if (mode === "chars") {
      const word = document.createElement("span");
      word.className = mask ? "motion-word motion-mask" : "motion-word";
      for (const ch of part) word.append(item(ch));
      element.append(word);
    } else if (mask) {
      const clip = document.createElement("span");
      clip.className = "motion-mask";
      clip.append(item(part));
      element.append(clip);
    } else {
      element.append(item(part));
    }
  }
}`;

/* --- Follow pointer -------------------------------------------------------- */

/**
 * The element (or a component's parts) follows the pointer with a spring.
 * Works for a single element or a component with several parts.
 */
function generatePointerVanilla(state, importFrom) {
  const follow = buildFollow(state);
  const spring = buildTransition(state, { mode: "code" });
  const scene = state.pointer?.area === "scene";
  const perspective = Number(state.pointer?.perspective) || 900;
  const is3d = needs3d(state);

  const config = {};
  for (const f of follow) {
    const props = {};
    for (const [prop, p] of Object.entries(f.props)) props[prop] = new Raw(`{ ${p.axis}: ${js(p.range)} }`);
    config[f.selector ?? ":scope"] = props;
  }

  const body = [];
  body.push(`const root = document.querySelector(".motion-target");`, "");
  if (is3d) {
    body.push(
      "// 3D: perspective gives depth; preserve-3d lets child layers float above the surface.",
      `const perspective = ${perspective};`,
      `root.style.transformStyle = "preserve-3d";`,
      "",
    );
  }
  body.push(
    "// How the element catches up with the pointer. Lower stiffness = floatier.",
    `const spring = ${js(spring)};`,
    "",
    "// What the pointer controls. Each property follows one axis between two values:",
    "//   x      pointer position, left to right",
    "//   y      pointer position, top to bottom",
    "//   enter  outside the element to over the element",
    `const follow = ${js(config)};`,
    "",
    "// Turn every range into a function: pointer value in, CSS value out.",
    "const mappers = Object.entries(follow).map(([selector, props]) => ({",
    "  selector,",
    "  props: Object.entries(props).map(([prop, config]) => {",
    "    const [axis, range] = Object.entries(config)[0];",
    "    return { prop, axis, map: interpolate(axis === \"enter\" ? [0, 1] : [-1, 1], range) };",
    "  }),",
    "}));",
    "",
    "const targets = (selector) => (selector === \":scope\" ? [root] : root.querySelectorAll(selector));",
    "",
    "function update(pointer, transition = spring) {",
    "  for (const { selector, props } of mappers) {",
    "    const values = {};",
    "    for (const { prop, axis, map } of props) values[prop] = map(pointer[axis]);",
    is3d ? `    if (selector === ":scope") values.transformPerspective = perspective;` : "",
    "    animate(targets(selector), values, transition);",
    "  }",
    "}",
    "",
    "const rest = { x: 0, y: 0, enter: 0 };",
    "const clamp = (value) => Math.max(-1, Math.min(1, value));",
    "",
    "update(rest, { duration: 0 }); // start at rest",
    "",
  );
  const listeners = [];
  if (scene) {
    listeners.push(
      "// Track the pointer anywhere on the page.",
      "let frame;",
      `document.addEventListener("pointermove", (event) => {`,
      `  if (event.pointerType === "touch") return;`,
      "  cancelAnimationFrame(frame);",
      "  frame = requestAnimationFrame(() => {",
      "    update({",
      "      x: clamp((event.clientX / innerWidth) * 2 - 1),",
      "      y: clamp((event.clientY / innerHeight) * 2 - 1),",
      "      enter: 1,",
      "    });",
      "  });",
      "});",
      `document.documentElement.addEventListener("pointerleave", () => update(rest));`,
    );
  } else {
    listeners.push(
      "// Measure against the element's untransformed size, so tilting never makes",
      "// its edge flicker in and out from under the pointer.",
      "let inside = false;",
      "let frame;",
      `document.addEventListener("pointermove", (event) => {`,
      `  if (event.pointerType === "touch") return;`,
      "  cancelAnimationFrame(frame);",
      "  frame = requestAnimationFrame(() => {",
      "    const box = root.getBoundingClientRect(); // its centre stays put while it tilts",
      "    const x = (event.clientX - box.left - box.width / 2) / (root.offsetWidth / 2);",
      "    const y = (event.clientY - box.top - box.height / 2) / (root.offsetHeight / 2);",
      "    const over = Math.abs(x) <= 1 && Math.abs(y) <= 1;",
      "    if (over) update({ x: clamp(x), y: clamp(y), enter: 1 });",
      "    else if (inside) update(rest);",
      "    inside = over;",
      "  });",
      "});",
      `document.documentElement.addEventListener("pointerleave", () => {`,
      "  inside = false;",
      "  update(rest);",
      "});",
    );
  }
  // Respect people who ask their system for less motion.
  body.push(
    "// Skip the effect for people who ask their system for less motion.",
    `if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {`,
    ...listeners.map((l) => (l ? `  ${l}` : l)),
    "}",
  );
  return [`import { animate, interpolate } from ${importFrom};`, "", ...body].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

/* --- Components ------------------------------------------------------------ */

/**
 * Components animate several parts at once and switch between "closed" and
 * "open". The generated code exposes a setOpen(bool) function and wires the
 * chosen trigger to it.
 */
function generateComponentVanilla(state, importFrom) {
  const comp = getComponent(state.element.type);
  const trigger = effectiveTrigger(state);
  if (trigger === "pointer") return generatePointerVanilla(state, importFrom);
  const plan = buildPlan(state);
  const transition = buildTransition(state, { mode: "code", multi: false });
  const imports = new Set(["animate"]);

  const open = {};
  const closed = {};
  const overrides = {}; // per-part extras: stagger delay, keyframe timing
  for (const e of plan) {
    const key = e.selector ?? ":scope";
    open[key] = e.open;
    closed[key] = e.from;
    const extra = {};
    if (e.multi && state.stagger.enabled) {
      extra.delay = new Raw(staggerCode(state));
      imports.add("stagger");
    }
    for (const [prop, times] of Object.entries(buildTimes(state, e.part))) extra[prop] = { inherit: true, times };
    if (Object.keys(extra).length) overrides[key] = extra;
  }
  const hasOverrides = Object.keys(overrides).length > 0;
  const autoClose = trigger === "toggle" ? autoCloseSeconds(state) : 0;
  // querySelectorAll(":scope") finds nothing, so the root part needs its own lookup.
  const hasScope = ":scope" in closed;
  const find = hasScope ? "targets(selector)" : "root.querySelectorAll(selector)";

  const body = [];
  body.push(`const root = document.querySelector(".motion-target");`, "");
  if (hasScope) body.push(`const targets = (selector) => (selector === ":scope" ? [root] : root.querySelectorAll(selector));`, "");
  body.push(`const transition = ${js(transition)};`, "");
  body.push(
    "// What each part looks like when open and when closed.",
    "// Selectors are relative to the root (\":scope\" is the root itself).",
    `const open = ${js(open)};`,
    "",
    `const closed = ${js(closed)};`,
    "",
  );
  if (hasOverrides) {
    body.push("// Extra options for some parts: stagger between items, keyframe timing.", `const overrides = ${js(overrides)};`, "");
  }
  body.push("let isOpen = false;");
  if (autoClose) body.push("let closeTimer;");
  body.push(
    "",
    "function setOpen(next) {",
    "  isOpen = next;",
    `  root.classList.toggle("is-open", isOpen);`,
    "  // Keep screen readers informed.",
    `  for (const el of [root, ...root.querySelectorAll("[aria-expanded], [aria-checked]")]) {`,
    `    for (const attr of ["aria-expanded", "aria-checked"]) if (el.hasAttribute(attr)) el.setAttribute(attr, String(isOpen));`,
    "  }",
    "  const values = isOpen ? open : closed;",
    "  for (const selector in values) {",
    hasOverrides
      ? `    animate(${find}, values[selector], { ...transition, ...overrides[selector] });`
      : `    animate(${find}, values[selector], transition);`,
    "  }",
  );
  if (autoClose) {
    body.push("  // Close again automatically.", "  clearTimeout(closeTimer);", `  if (isOpen) closeTimer = setTimeout(() => setOpen(false), ${autoClose * 1000});`);
  }
  body.push(
    "}",
    "",
    "// Start closed, without animating.",
    `for (const selector in closed) animate(${find}, closed[selector], { duration: 0 });`,
    "",
  );

  switch (trigger) {
    case "toggle": {
      const clickers = comp.clicks.length ? comp.clicks.join(", ") : null;
      if (clickers) {
        body.push(`for (const el of root.querySelectorAll(${js(clickers)})) {`, "  el.addEventListener(\"click\", () => setOpen(!isOpen));", "}");
      } else {
        body.push(`root.addEventListener("click", () => setOpen(!isOpen));`);
      }
      break;
    }
    case "hover":
      imports.add("hover");
      body.push("// Open on hover, close when the pointer leaves.", "hover(root, () => {", "  setOpen(true);", state.hover.revert ? "  return () => setOpen(false);" : "", "});");
      break;
    case "press":
      imports.add("press");
      body.push("// Open while pressed, close on release.", "press(root, () => {", "  setOpen(true);", "  return () => setOpen(false);", "});");
      break;
    case "inView":
      imports.add("inView");
      body.push("// Open when it scrolls into view.", "inView(root, () => {", "  setOpen(true);", state.inView.once ? "" : "  return () => setOpen(false);", `}, ${js({ amount: Number(state.inView.amount) })});`);
      break;
    case "load":
    default:
      body.push("// Open as soon as this script runs.", "setOpen(true);");
  }

  return [`import { ${[...imports].join(", ")} } from ${importFrom};`, "", ...body].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

/* --- Vanilla JS --------------------------------------------------------- */

export function generateVanilla(state, { importFrom = '"motion"' } = {}) {
  if (isComponent(state.element.type)) return generateComponentVanilla(state, importFrom);
  if (effectiveTrigger(state) === "pointer") return generatePointerVanilla(state, importFrom);
  const multi = isMulti(state);
  const keyframes = buildKeyframes(state);
  const from = buildFromValues(state);
  const transition = buildTransition(state, { mode: "code" });
  const selector = targetSelector(state);
  const wrapper = wrapperSelector(state);
  const imports = new Set(["animate"]);
  if (state.stagger.enabled && multi && state.trigger !== "scroll") imports.add("stagger");

  const lines = [];
  const body = [];

  if (needsSplit(state)) {
    body.push(SPLIT_HELPER, "", `splitText(document.querySelector(".motion-target"), ${js(state.element.split)}${state.element.mask ? ", true" : ""});`, "");
  }

  body.push(`const keyframes = ${js(keyframes)};`, "");
  body.push(`const transition = ${js(transition)};`, "");

  const target = multi ? `element.querySelectorAll(${js(".motion-item")})` : "element";

  switch (state.trigger) {
    case "toggle": {
      const autoClose = autoCloseSeconds(state);
      body.push("// Click to play, click again to reverse.", "let isOpen = false;");
      if (autoClose) body.push("let closeTimer;");
      body.push(
        "",
        "function setOpen(next) {",
        "  isOpen = next;",
        `  animate(${js(selector)}, isOpen ? keyframes : ${js(from, 1)}, transition);`,
      );
      if (autoClose) body.push("  clearTimeout(closeTimer);", `  if (isOpen) closeTimer = setTimeout(() => setOpen(false), ${autoClose * 1000});`);
      body.push("}", "", `document.querySelector(${js(wrapper)}).addEventListener("click", () => setOpen(!isOpen));`);
      break;
    }
    case "hover": {
      imports.add("hover");
      body.push(
        "// Play on hover, revert when the pointer leaves.",
        `hover(${js(selector)}, (element) => {`,
        `  animate(element, keyframes, transition);`,
      );
      if (state.hover.revert) body.push(`  return () => animate(element, ${js(from, 1)}, transition);`);
      body.push("});");
      break;
    }
    case "press": {
      imports.add("press");
      body.push(
        "// Play while pressed, revert on release.",
        `press(${js(selector)}, (element) => {`,
        `  animate(element, keyframes, transition);`,
        `  return () => animate(element, ${js(from, 1)}, transition);`,
        "});",
      );
      break;
    }
    case "inView": {
      imports.add("inView");
      const opts = { amount: Number(state.inView.amount) };
      body.push(
        "// Start from the first keyframe so nothing flashes before the animation.",
        `animate(${js(selector)}, ${js(from)}, { duration: 0 });`,
        "",
        "// Play when the element scrolls into view.",
        `inView(${js(wrapper)}, (element) => {`,
        `  animate(${target}, keyframes, transition);`,
      );
      if (!state.inView.once) {
        body.push("", "  // Revert when it leaves, so it replays next time.", `  return () => animate(${target}, ${js(from, 1)}, transition);`);
      }
      body.push(`}, ${js(opts)});`);
      break;
    }
    case "scroll": {
      imports.add("scroll");
      body.push(
        "// The animation is scrubbed by scroll position instead of time.",
        `const animation = animate(${js(selector)}, keyframes, transition);`,
        "",
        "scroll(animation, {",
        `  target: document.querySelector(${js(wrapper)}),`,
        `  offset: ${js(scrollOffset(state))},`,
        "});",
      );
      break;
    }
    case "load":
    default:
      body.push("// Plays as soon as this script runs.", `animate(${js(selector)}, keyframes, transition);`);
  }

  lines.push(`import { ${[...imports].join(", ")} } from ${importFrom};`, "", ...body);
  return lines.join("\n");
}

/* --- CSS ---------------------------------------------------------------- */

export function generateCss(state) {
  const el = state.element;
  // "Auto" text colour: inherit the page's colour for headings, white on accent backgrounds.
  const textColor = el.textColor === "auto" ? (el.type === "text" ? "inherit" : "#ffffff") : el.textColor;
  const has3d = state.tracks.some((t) => t.prop === "rotateX" || t.prop === "rotateY");
  const css = [];
  if (isComponent(el.type)) {
    css.push(componentCss(el.type, el));
    if (has3d) css.push(`.motion-scene {\n  perspective: 900px;\n}`);
    return css.join("\n\n");
  }
  css.push(`/* A parent with perspective makes 3D rotations look right. */
.motion-scene {
  perspective: 900px;
}`);
  if (has3d) {
    css.push(`.motion-target, .motion-item {
  transform-style: preserve-3d;
}`);
  }
  if (needsSplit(state)) {
    css.push(`/* Each word / letter animates on its own; words never break apart. */
.motion-item,
.motion-word {
  display: inline-block;
  white-space: pre;
}`);
    if (el.mask) {
      css.push(`/* The clip: pieces slide up from behind this invisible line. */
.motion-mask {
  display: inline-block;
  overflow: hidden;
  vertical-align: top;
  padding: 0.1em 0.04em 0.18em;
  margin: -0.1em -0.04em -0.18em;
}`);
    }
  }
  switch (el.type) {
    case "box":
    case "circle":
      css.push(`.demo-shape {
  width: ${el.size}px;
  height: ${el.size}px;
  background: ${el.color};
  border-radius: ${el.type === "circle" ? "50%" : `${el.radius}px`};
}`);
      break;
    case "text":
      css.push(`.demo-text {
  font: 700 clamp(28px, 5vw, 56px) / 1.15 system-ui, sans-serif;
  color: ${textColor};
  margin: 0;
}`);
      break;
    case "button":
      css.push(`.demo-button {
  font: 600 16px system-ui, sans-serif;
  color: ${textColor};
  background: ${el.color};
  border: 0;
  border-radius: ${el.radius}px;
  padding: 14px 28px;
  cursor: pointer;
}`);
      break;
    case "card":
      css.push(`.demo-card {
  width: 260px;
  background: #1c1c22;
  color: #fff;
  border-radius: ${el.radius}px;
  overflow: hidden;
  font-family: system-ui, sans-serif;
}
.demo-card-media {
  height: 140px;
  background: linear-gradient(135deg, ${el.color}, #ec4899);
}
.demo-card-body {
  padding: 16px;
  display: grid;
  gap: 6px;
}
.demo-card-body span {
  font-size: 13px;
  opacity: 0.7;
}`);
      break;
    case "list":
      css.push(`.motion-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
  width: 260px;
  font-family: system-ui, sans-serif;
}
.demo-item {
  background: ${el.color};
  color: ${textColor};
  padding: 14px 18px;
  border-radius: ${el.radius}px;
  font-weight: 600;
}`);
      break;
    case "grid":
      css.push(`.motion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 260px;
}
.demo-tile {
  aspect-ratio: 1;
  background: ${el.color};
  color: ${textColor};
  border-radius: ${el.radius}px;
  display: grid;
  place-items: center;
  font: 600 16px system-ui, sans-serif;
}`);
      break;
    default:
      break;
  }
  return css.join("\n\n");
}

/* --- Script tag (drop into any page) --------------------------------------- */

export function generateScriptTag(state) {
  const script = generateVanilla(state, { importFrom: js(CDN_URL) });
  return `<!-- 1. Put your element on the page -->
${generateHtmlMarkup(state)}

<!-- 2. Add this just before </body>. No install or build step needed. -->
<script type="module">
${indent(script, 2)}
</script>`;
}

/* --- HTML (standalone, CDN) --------------------------------------------- */

export function generateHtmlMarkup(state) {
  return `<div class="motion-scene">\n${indent(elementMarkup(state.element, { forExport: true }), 2)}\n</div>`;
}

export function generateHtml(state) {
  const scrolly = state.trigger === "inView" || state.trigger === "scroll";
  const script = generateVanilla(state, { importFrom: js(CDN_URL) });
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escape(state.name || "Motion animation")}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0f0f14;
      color: #fff;
      font-family: system-ui, sans-serif;
    }
${scrolly ? "    .spacer { height: 100vh; display: grid; place-items: center; opacity: 0.5; }\n" : ""}
${indent(generateCss(state), 4)}
  </style>
</head>
<body>
${scrolly ? '  <div class="spacer">Scroll down ↓</div>\n' : ""}${indent(generateHtmlMarkup(state), 2)}
${scrolly ? '  <div class="spacer">Keep scrolling</div>\n' : ""}
  <script type="module">
${indent(script, 4)}
  </script>
</body>
</html>`;
}

function indent(str, n) {
  const pad = " ".repeat(n);
  return str
    .split("\n")
    .map((l) => (l.trim() ? pad + l : l))
    .join("\n");
}

function escape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* --- All together --------------------------------------------------------- */

export function generateAll(state) {
  return {
    vanilla: generateVanilla(state),
    script: generateScriptTag(state),
    html: generateHtml(state),
    markup: generateHtmlMarkup(state),
    css: generateCss(state),
    install: "npm install motion",
    cdn: CDN_URL,
  };
}
