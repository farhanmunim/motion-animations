/**
 * Export for Timeline mode: a motion.dev sequence.
 */
import { js, CDN_URL } from "../codegen.js";
import { buildSequence, buildInitial, buildSequenceOptions } from "./compile.js";
import { sceneMarkup, sceneCss } from "./scenes.js";

function indent(str, n) {
  const pad = " ".repeat(n);
  return str
    .split("\n")
    .map((l) => (l.trim() ? pad + l : l))
    .join("\n");
}

export function generateTimelineVanilla(state, { importFrom = '"motion"' } = {}) {
  const steps = buildSequence(state, { mode: "code" });
  const initial = buildInitial(state);
  const options = buildSequenceOptions(state);
  const imports = new Set(["animate"]);
  if (steps.some((s) => s.options.delay)) imports.add("stagger");

  const body = [];
  body.push(`const scene = document.querySelector(".motion-scene");`, "");
  body.push("// Start every element at its first keyframe so nothing flashes before the sequence.", `const initial = ${js(initial)};`, "for (const selector in initial) animate(scene.querySelectorAll(selector), initial[selector], { duration: 0 });", "");
  body.push("// The timeline: each step is [target, values, { at: seconds, duration, ease }].");
  body.push("const sequence = [");
  for (const s of steps) {
    body.push(`  [scene.querySelectorAll(${js(s.selector)}), ${js(s.keyframes, 1)}, ${js(s.options, 1)}],`);
  }
  body.push("];", "");
  const optCode = Object.keys(options).length ? `, ${js(options)}` : "";

  switch (state.trigger) {
    case "toggle": {
      const autoClose = Number(state.toggle?.autoClose) || 0;
      body.push(
        `const animation = animate(sequence${optCode});`,
        "animation.pause();",
        "",
        "// Click to play forward, click again to play backwards.",
        "let isOpen = false;",
        autoClose ? "let closeTimer;" : "",
        "function setOpen(next) {",
        "  isOpen = next;",
        "  animation.speed = isOpen ? 1 : -1;",
        "  animation.play();",
        autoClose ? `  clearTimeout(closeTimer);\n  if (isOpen) closeTimer = setTimeout(() => setOpen(false), ${autoClose * 1000});` : "",
        "}",
        `scene.addEventListener("click", () => setOpen(!isOpen));`,
      );
      break;
    }
    case "inView": {
      imports.add("inView");
      body.push(
        `const animation = animate(sequence${optCode});`,
        "animation.pause();",
        "",
        "// Play when the scene scrolls into view.",
        "inView(scene, () => {",
        "  animation.speed = 1;",
        "  animation.play();",
        state.inView.once ? "" : "  return () => {\n    animation.speed = -1;\n    animation.play();\n  };",
        `}, ${js({ amount: Number(state.inView.amount) })});`,
      );
      break;
    }
    case "scroll": {
      imports.add("scroll");
      body.push(
        "// The whole timeline is scrubbed by scroll position.",
        `scroll(animate(sequence), {`,
        "  target: scene,",
        `  offset: ${js([state.scroll.offsetStart, state.scroll.offsetEnd])},`,
        "});",
      );
      break;
    }
    case "load":
    default:
      body.push("// Plays as soon as this script runs.", `animate(sequence${optCode});`);
  }
  return [`import { ${[...imports].join(", ")} } from ${importFrom};`, "", ...body].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

export function generateTimelineMarkup(state) {
  const markup = state.scene.type === "custom" ? sceneMarkup(state.scene) : sceneMarkup(state.scene);
  return `<!-- Your elements. Keep the data-el names: that is how the timeline finds them. -->\n<div class="motion-scene">\n${indent(markup, 2)}\n</div>`;
}

export function generateTimelineCss(state) {
  return sceneCss(state.scene);
}

export function generateTimelineScriptTag(state) {
  return `<!-- 1. Put your elements on the page -->\n${generateTimelineMarkup(state)}\n\n<!-- 2. Add this just before </body>. No install or build step needed. -->\n<script type="module">\n${indent(generateTimelineVanilla(state, { importFrom: js(CDN_URL) }), 2)}\n</script>`;
}

export function generateTimelineHtml(state) {
  const scrolly = state.trigger === "inView" || state.trigger === "scroll";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${(state.name || "Timeline animation").replace(/[<>&]/g, "")}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      box-sizing: border-box;
      background: #0f0f14;
      color: #fff;
      font-family: system-ui, sans-serif;
    }
${scrolly ? "    .spacer { height: 100vh; display: grid; place-items: center; opacity: 0.5; }\n" : ""}
${indent(generateTimelineCss(state), 4)}
  </style>
</head>
<body>
${scrolly ? '  <div class="spacer">Scroll down ↓</div>\n' : ""}${indent(generateTimelineMarkup(state), 2)}
${scrolly ? '  <div class="spacer">Keep scrolling</div>\n' : ""}
  <script type="module">
${indent(generateTimelineVanilla(state, { importFrom: js(CDN_URL) }), 4)}
  </script>
</body>
</html>`;
}

export function generateTimelineAll(state) {
  return {
    vanilla: generateTimelineVanilla(state),
    script: generateTimelineScriptTag(state),
    html: generateTimelineHtml(state),
    markup: generateTimelineMarkup(state),
    css: generateTimelineCss(state),
    install: "npm install motion",
    cdn: CDN_URL,
  };
}
