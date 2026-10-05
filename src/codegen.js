/**
 * Turns the current design into copy-paste-ready code for plain HTML/JS
 * projects:
 *   - a JavaScript module for projects with a bundler (`npm install motion`)
 *   - a <script type="module"> block that loads motion from a CDN, to drop
 *     into any HTML page with no build step
 *   - a complete standalone HTML file for trying it out
 *   - the CSS that makes the exported element look like the preview
 */
import { stepCount, scrambleChars, Raw, buildKeyframes, buildFromValues, buildFollow, buildPlan, buildTimes, buildTransition, effectiveTrigger, isMulti, needs3d, scrollOffset, staggerCode, targetSelector, autoCloseSeconds } from "./compile.js";
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

  const hasNear = follow.some((f) => Object.values(f.props).some((p) => p.axis === "near"));
  const hasCursor = follow.some((f) => Object.values(f.props).some((p) => String(p.axis).startsWith("cursor")));
  const radius = Number(state.pointer?.radius) || 120;
  const hold = !!state.pointer?.hold;
  const drag = !!state.pointer?.drag;

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
    drag
      ? `const spring = matchMedia("(prefers-reduced-motion: reduce)").matches ? { duration: 0 } : ${js(spring)};`
      : `const spring = ${js(spring)};`,
    "",
    "// What the pointer controls. Each property follows one axis between two values:",
    "//   x      pointer position, left to right",
    "//   y      pointer position, top to bottom",
    "//   enter  outside the element to over the element",
    ...(hasNear ? ["//   near   far from the pointer to right under it, measured per item"] : []),
    ...(hasCursor ? ["//   cursorX / cursorY  the pointer's distance from the middle in px, times a strength"] : []),
    `const follow = ${js(config)};`,
    "",
    "// Turn every range into a function: pointer value in, CSS value out.",
    "const mappers = Object.entries(follow).map(([selector, props]) => ({",
    "  selector,",
    "  props: Object.entries(props).map(([prop, config]) => {",
    "    const [axis, range] = Object.entries(config)[0];",
    hasCursor
      ? "    const map = axis.startsWith(\"cursor\") ? (value) => value * range[1] : interpolate(axis === \"x\" || axis === \"y\" ? [-1, 1] : [0, 1], range);"
      : "",
    hasCursor ? "    return { prop, axis, map };" : "    return { prop, axis, map: interpolate(axis === \"x\" || axis === \"y\" ? [-1, 1] : [0, 1], range) };",
    "  }),",
    "}));",
    "",
    "const targets = (selector) => (selector === \":scope\" ? [root] : root.querySelectorAll(selector));",
    "",
    ...(hasNear
      ? [
          `const radius = ${radius}; // how close (px) the pointer has to be to an item's centre`,
          "",
          "// 1 right on top of an item, 0 at `radius` px away or further.",
          "function near(item, x) {",
          "  const box = item.getBoundingClientRect();",
          "  return Math.max(0, 1 - Math.abs(x - (box.left + box.width / 2)) / radius);",
          "}",
          "",
          "function update(pointer, transition = spring) {",
          "  // Read every position first, then write: mixing the two forces the browser to re-layout again and again.",
          "  const items = mappers.map(({ selector, props }) => (props.some((prop) => prop.axis === \"near\") ? [...targets(selector)] : []));",
          "  const levels = items.map((list) => list.map((item) => near(item, pointer.px)));",
          "",
          "  mappers.forEach(({ selector, props }, i) => {",
          "    const values = {};",
          "    for (const { prop, axis, map } of props) if (axis !== \"near\") values[prop] = map(pointer[axis]);",
          is3d ? `    if (selector === ":scope") values.transformPerspective = perspective;` : "",
          "    if (Object.keys(values).length) animate(targets(selector), values, transition);",
          "",
          "    // Items that react to proximity each get their own value.",
          "    const nearProps = props.filter((prop) => prop.axis === \"near\");",
          "    items[i].forEach((item, n) => {",
          "      animate(item, Object.fromEntries(nearProps.map(({ prop, map }) => [prop, map(levels[i][n])])), transition);",
          "    });",
          "  });",
          "}",
        ]
      : [
          "function update(pointer, transition = spring) {",
          "  for (const { selector, props } of mappers) {",
          "    const values = {};",
          "    for (const { prop, axis, map } of props) values[prop] = map(pointer[axis]);",
          is3d ? `    if (selector === ":scope") values.transformPerspective = perspective;` : "",
          "    animate(targets(selector), values, transition);",
          "  }",
          "}",
        ]),
    "",
    hasNear
      ? "const rest = { x: 0, y: 0, enter: 0, px: -Infinity }; // px: pointer position in the viewport"
      : hasCursor
      ? "const rest = { x: 0, y: 0, enter: 0, cursorX: 0, cursorY: 0 };"
      : "const rest = { x: 0, y: 0, enter: 0 };",
    "const clamp = (value) => Math.max(-1, Math.min(1, value));",
    "",
    "update(rest, { duration: 0 }); // start at rest",
    "",
  );
  const listeners = [];
  if (drag) {
    listeners.push(
      "// Direct manipulation: grab the element, pull it around, let go and it springs back.",
      `root.style.touchAction = "none"; // let touch drag it instead of scrolling the page`,
      `root.style.cursor = "grab";`,
      "let start = null;",
      "",
      `root.addEventListener("pointerdown", (event) => {`,
      "  start = { x: event.clientX, y: event.clientY };",
      "  root.setPointerCapture(event.pointerId);",
      `  root.style.cursor = "grabbing";`,
      "  update({ ...rest, enter: 1 });",
      "});",
      "",
      `root.addEventListener("pointermove", (event) => {`,
      "  if (!start) return;",
      "  const cursorX = event.clientX - start.x;",
      "  const cursorY = event.clientY - start.y;",
      `  update({ x: clamp(cursorX / (root.offsetWidth / 2)), y: clamp(cursorY / (root.offsetHeight / 2)), enter: 1${hasCursor ? ", cursorX, cursorY" : ""}${hasNear ? ", px: event.clientX" : ""} });`,
      "});",
      "",
      "function release() {",
      "  if (!start) return;",
      "  start = null;",
      `  root.style.cursor = "grab";`,
      hold ? "" : "  update(rest);",
      "}",
      `root.addEventListener("pointerup", release);`,
      `root.addEventListener("pointercancel", release);`,
    );
  } else if (scene) {
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
      ...(hasNear ? ["      px: event.clientX,"] : []),
      ...(hasCursor ? ["      cursorX: event.clientX - innerWidth / 2,", "      cursorY: event.clientY - innerHeight / 2,"] : []),
      "    });",
      "  });",
      "});",
      hold ? "" : `document.documentElement.addEventListener("pointerleave", () => update(rest));`,
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
      hasNear
        ? "    // Magnified items stick out past the element's box, so count a margin around it as over."
        : "",
      hasNear
        ? "    const y = (event.clientY - box.top - box.height / 2) / (root.offsetHeight / 2 + radius / 2);"
        : "    const y = (event.clientY - box.top - box.height / 2) / (root.offsetHeight / 2);",
      "    const over = Math.abs(x) <= 1 && Math.abs(y) <= 1;",
      hasCursor
        ? "    const cursorX = event.clientX - box.left - box.width / 2;"
        : "",
      hasCursor ? "    const cursorY = event.clientY - box.top - box.height / 2;" : "",
      hasCursor
        ? "    if (over) update({ x: clamp(x), y: clamp(y), enter: 1, cursorX, cursorY });"
        : hasNear
        ? "    if (over) update({ x: clamp(x), y: clamp(y), enter: 1, px: event.clientX });"
        : "    if (over) update({ x: clamp(x), y: clamp(y), enter: 1 });",
      hold ? "    // (it stays where it is when the pointer leaves)" : "    else if (inside) update(rest);",
      "    inside = over;",
      "  });",
      "});",
      `document.documentElement.addEventListener("pointerleave", () => {`,
      "  inside = false;",
      hold ? "" : "  update(rest);",
      "});",
    );
  }
  // Respect people who ask their system for less motion (dragging is the visitor's own movement, so it stays).
  if (drag) {
    body.push(...listeners);
  } else {
    body.push(
      "// Skip the effect for people who ask their system for less motion.",
      `if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {`,
      ...listeners.filter(Boolean).map((l) => `  ${l}`),
      "}",
    );
  }
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
  if (trigger === "step") return generateStepVanilla(state, importFrom);
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
  // A loop that never stops is only worth running while it is on screen.
  const loops = transition.repeat === Infinity && trigger === "load";
  // Everything else jumps straight to its end state for people who ask for less motion.
  const reduce = !loops && trigger !== "scroll";
  // querySelectorAll(":scope") finds nothing, so the root part needs its own lookup.
  const hasScope = ":scope" in closed;
  const find = hasScope ? "targets(selector)" : "root.querySelectorAll(selector)";

  const body = [];
  body.push(`const root = document.querySelector(".motion-target");`, "");
  if (hasScope) body.push(`const targets = (selector) => (selector === ":scope" ? [root] : root.querySelectorAll(selector));`, "");
  if (reduce) {
    body.push(
      `// Honour "reduce motion": jump straight to the end state instead of animating.`,
      `const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;`,
      `const transition = reduceMotion ? { duration: 0 } : ${js(transition)};`,
      "",
    );
  } else {
    body.push(`const transition = ${js(transition)};`, "");
  }
  body.push(
    "// What each part looks like when open and when closed.",
    "// Selectors are relative to the root (\":scope\" is the root itself).",
    `const open = ${js(open)};`,
    "",
    `const closed = ${js(closed)};`,
    "",
  );
  if (hasOverrides) {
    body.push("// Extra options for some parts: stagger between items, keyframe timing.", `const overrides = ${reduce ? "reduceMotion ? {} : " : ""}${js(overrides)};`, "");
  }
  body.push("let isOpen = false;");
  if (loops) body.push("const running = []; // the loop's animations, so they can be stopped when it leaves the screen");
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
      ? `    ${loops ? "running.push(" : ""}animate(${find}, values[selector], { ...transition, ...overrides[selector] })${loops ? ")" : ""};`
      : `    ${loops ? "running.push(" : ""}animate(${find}, values[selector], transition)${loops ? ")" : ""};`,
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
      if (loops) {
        imports.add("inView");
        body.push(
          "// A loop that never stops: skip it for people who ask for less motion, and run it only while it is on screen.",
          `if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {`,
          "  inView(root, () => {",
          "    setOpen(true);",
          "    return () => running.splice(0).forEach((animation) => animation.stop());",
          "  });",
          "}",
        );
      } else {
        body.push("// Open as soon as this script runs.", "setOpen(true);");
      }
  }

  return [`import { ${[...imports].join(", ")} } from ${importFrom};`, "", ...body].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

/* --- Vanilla JS --------------------------------------------------------- */

/** Text scramble: letters shuffle, then settle left to right into the real text. */
function generateScrambleVanilla(state, importFrom) {
  const trigger = effectiveTrigger(state);
  const order = state.scramble?.order || "start";
  const transition = buildTransition({ ...state, transition: { ...state.transition, type: "tween", infinite: false, repeat: 0 } }, { mode: "code", multi: false });
  const imports = new Set(["animate"]);
  const body = [
    `const element = document.querySelector(".motion-target");`,
    "const finalText = element.textContent;",
    `const finalChars = [...finalText.replace(/\\s+/g, "")]; // the letters to reveal, without spaces`,
    `const characters = ${js(scrambleChars(state))};`,
    `const transition = ${js(transition)};`,
    "",
    "// Only shuffle through characters narrow enough for a letter's cell, so neighbours never overlap.",
    `const measure = document.createElement("canvas").getContext("2d");`,
    "const style = getComputedStyle(element);",
    "measure.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;",
    "const sizes = Object.fromEntries([...characters].map((char) => [char, measure.measureText(char).width]));",
    "",
    "function fit(width) {",
    "  const ok = [...characters].filter((char) => sizes[char] <= width * 1.08);",
    "  return ok.length ? ok : [[...characters].sort((a, b) => sizes[a] - sizes[b])[0]];",
    "}",
    "",
    "// Give every letter a cell as wide as the real letter, so shuffling never makes the text jump sideways.",
    "const pools = [];",
    "function lockLetters() {",
    "  element.textContent = finalText;",
    "  const range = document.createRange();",
    "  let index = 0;",
    "  const widths = [...finalText].map((char) => {",
    "    range.setStart(element.firstChild, index);",
    "    range.setEnd(element.firstChild, index + char.length);",
    "    index += char.length;",
    "    return range.getBoundingClientRect().width;",
    "  });",
    "",
    `  element.textContent = "";`,
    "  const cells = [];",
    "  let n = 0;",
    "  for (const part of finalText.split(/(\\s+)/)) {",
    "    if (/^\\s+$/.test(part)) {",
    "      element.append(part);",
    "      n += [...part].length;",
    "      continue;",
    "    }",
    `    const word = document.createElement("span");`,
    `    word.style.whiteSpace = "nowrap"; // a word never breaks apart while it shuffles`,
    "    for (const char of part) {",
    `      const cell = document.createElement("span");`,
    "      cell.style.cssText = `display:inline-block;width:${widths[n]}px;text-align:center`;",
    "      cell.textContent = char;",
    "      word.append(cell);",
    "      cells.push(cell);",
    "      pools.push(fit(widths[n++]));",
    "    }",
    "    element.append(word);",
    "  }",
    "  return cells;",
    "}",
    "",
    "const cells = lockLetters(); // built once, so nothing is swapped out from under the pointer",
    "",
    ...(order === "start"
      ? []
      : [
          `// The order the letters settle in: ${order === "center" ? "from the middle outwards" : "at random"}.`,
          "function settleOrder(count) {",
          "  const indexes = Array.from({ length: count }, (_, i) => i);",
          order === "center"
            ? "  indexes.sort((a, b) => Math.abs(a - (count - 1) / 2) - Math.abs(b - (count - 1) / 2) || a - b);"
            : "  indexes.sort(() => Math.random() - 0.5);",
          "  const rank = [];",
          "  indexes.forEach((letter, position) => (rank[letter] = position));",
          "  return rank;",
          "}",
          "",
        ]),
    `// Letters settle ${order === "start" ? "left to right" : "one by one"}; the ones still waiting keep shuffling.`,
    "function scramble() {",
    ...(order === "start" ? [] : ["  const rank = settleOrder(cells.length);"]),
    "  animate(0, 1, {",
    "    ...transition,",
    "    onUpdate(progress) {",
    "      const settled = Math.floor(progress * cells.length);",
    "      cells.forEach((cell, i) => {",
    `        cell.textContent = ${order === "start" ? "i" : "rank[i]"} < settled ? finalChars[i] : pools[i][Math.floor(Math.random() * pools[i].length)];`,
    "      });",
    "    },",
    "  });",
    "}",
    "",
  ];
  const run = [];
  switch (trigger) {
    case "hover":
      imports.add("hover");
      run.push("// Scramble whenever the pointer enters.", "hover(element, () => scramble());");
      break;
    case "toggle":
      run.push("// Scramble on every click.", `element.addEventListener("click", scramble);`);
      break;
    case "inView":
      imports.add("inView");
      run.push("// Scramble when it scrolls into view.", `inView(element, () => scramble(), ${js({ amount: Number(state.inView.amount) })});`);
      break;
    default:
      run.push("// Scramble as soon as this script runs.", "scramble();");
  }
  body.push("// Skip the effect for people who ask their system for less motion.", `if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {`, ...run.map((l) => `  ${l}`), "}");
  return [`import { ${[...imports].join(", ")} } from ${importFrom};`, "", ...body].join("\n");
}

/**
 * Steps: every keyframe is a state, and each click moves to the next one.
 * Works for components (tabs, carousels, shapes that morph) and plain elements.
 */
function generateStepVanilla(state, importFrom) {
  const comp = isComponent(state.element.type) ? getComponent(state.element.type) : null;
  const plan = buildPlan(state);
  const count = stepCount(state);
  const imports = new Set(["animate"]);
  const transition = buildTransition(state, { mode: "code", multi: comp ? false : isMulti(state) });
  const select = (e) => (comp ? e.selector ?? ":scope" : e.multi ? ".motion-item" : ":scope");

  const states = Array.from({ length: count }, (_, i) => Object.fromEntries(plan.map((e) => [select(e), e.states[i]])));
  const overrides = {};
  if (comp && state.stagger.enabled) {
    for (const e of plan) {
      if (!e.multi) continue;
      overrides[select(e)] = { delay: new Raw(staggerCode(state)) };
      imports.add("stagger");
    }
  }
  if (transition.delay instanceof Raw) imports.add("stagger");
  const hasOverrides = Object.keys(overrides).length > 0;
  const every = Number(state.step?.every) || 0;
  const nexters = comp?.clicks?.length ? comp.clicks : [];
  const jumpers = comp?.jumps?.length ? comp.jumps : [];
  const rootSelector = comp ? ".motion-target" : wrapperSelector(state);

  const body = [];
  if (needsSplit(state)) {
    body.push(SPLIT_HELPER, "", `splitText(document.querySelector(".motion-target"), ${js(state.element.split)}${state.element.mask ? ", true" : ""});`, "");
  }
  body.push(
    `const root = document.querySelector(${js(rootSelector)});`,
    `const targets = (selector) => (selector === ":scope" ? [root] : root.querySelectorAll(selector));`,
    "",
    `// Honour "reduce motion": jump straight to each state instead of animating.`,
    `const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;`,
    `const transition = reduceMotion ? { duration: 0 } : ${js(transition)};`,
    "",
  );
  if (hasOverrides) body.push("// Extra options for some parts: stagger between items.", `const overrides = reduceMotion ? {} : ${js(overrides)};`, "");
  body.push(
    "// Every step is one state: what each part looks like at that keyframe.",
    "// Selectors are relative to the root (\":scope\" is the root itself).",
    `const states = ${js(states)};`,
    "",
  );
  if (jumpers.length) body.push(`const jumpers = [...root.querySelectorAll(${js(jumpers.join(", "))})]; // each one jumps to its own state`, "");
  body.push(
    "let index = 0;",
    "",
    "function goTo(next) {",
    "  index = (next + states.length) % states.length;",
    "  root.dataset.step = index; // handy for your own CSS",
  );
  if (jumpers.length) {
    body.push(
      "  // Keep screen readers informed which one is selected.",
      "  jumpers.forEach((el, i) => {",
      `    if (!el.hasAttribute("aria-selected")) return;`,
      `    el.setAttribute("aria-selected", String(i === index));`,
      "    el.tabIndex = i === index ? 0 : -1; // only the selected tab is in the tab order",
      "  });",
    );
  }
  body.push(
    "  for (const selector in states[index]) {",
    hasOverrides ? "    animate(targets(selector), states[index][selector], { ...transition, ...overrides[selector] });" : "    animate(targets(selector), states[index][selector], transition);",
    "  }",
    "}",
    "",
    "// Start on the first state, without animating.",
    "for (const selector in states[0]) animate(targets(selector), states[0][selector], { duration: 0 });",
    "root.dataset.step = 0;",
    "",
  );
  if (nexters.length) body.push(`for (const el of root.querySelectorAll(${js(nexters.join(", "))})) el.addEventListener("click", () => goTo(index + 1));`);
  else if (!jumpers.length) body.push(`root.addEventListener("click", () => goTo(index + 1));`);
  if (jumpers.length) body.push(`jumpers.forEach((el, i) => el.addEventListener("click", () => goTo(i)));`);
  if (jumpers.length && comp.markup.includes("aria-selected")) {
    body.push(
      "",
      "// Arrow keys move between tabs.",
      `root.addEventListener("keydown", (event) => {`,
      `  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;`,
      "  event.preventDefault();",
      `  goTo(index + (event.key === "ArrowRight" ? 1 : -1));`,
      "  jumpers[index].focus();",
      "});",
    );
  }
  if (every > 0) body.push("", "// Move on by itself too, unless the visitor prefers less motion.", `if (!reduceMotion) setInterval(() => goTo(index + 1), ${every * 1000});`);
  return [`import { ${[...imports].join(", ")} } from ${importFrom};`, "", ...body].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

export function generateVanilla(state, { importFrom = '"motion"' } = {}) {
  if (isComponent(state.element.type)) return generateComponentVanilla(state, importFrom);
  if (state.element.type === "scramble") return generateScrambleVanilla(state, importFrom);
  if (effectiveTrigger(state) === "step") return generateStepVanilla(state, importFrom);
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
  const loops = transition.repeat === Infinity && state.trigger === "load";
  if (!loops && state.trigger !== "scroll") {
    // Everything else jumps straight to its end state for people who ask for less motion.
    body.push(
      `// Honour "reduce motion": jump straight to the end state instead of animating.`,
      `const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;`,
      `const transition = reduceMotion ? { duration: 0 } : ${js(transition)};`,
      "",
    );
  } else {
    body.push(`const transition = ${js(transition)};`, "");
  }

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
      if (loops) {
        imports.add("inView");
        body.push(
          "// A loop that never stops: skip it for people who ask for less motion, and run it only while it is on screen.",
          `if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {`,
          `  inView(${js(wrapper)}, (element) => {`,
          `    const animation = animate(${target}, keyframes, transition);`,
          "    return () => animation.stop();",
          "  });",
          "}",
        );
      } else {
        body.push("// Plays as soon as this script runs.", `animate(${js(selector)}, keyframes, transition);`);
      }
  }

  lines.push(`import { ${[...imports].join(", ")} } from ${importFrom};`, "", ...body);
  return lines.join("\n");
}

/* --- CSS ---------------------------------------------------------------- */

export function generateCss(state) {
  const el = state.element;
  // "Auto" text colour: inherit the page's colour for headings, white on accent backgrounds.
  const textColor = el.textColor === "auto" ? (el.type === "text" || el.type === "scramble" ? "inherit" : "#ffffff") : el.textColor;
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
    case "scramble":
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
