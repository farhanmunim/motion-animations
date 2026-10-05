/**
 * More components, inspired by the animated UI kits on sites like
 * motion-primitives.com. Same shape as the entries in components.js.
 * Everything here is plain HTML + CSS + motion.dev: no framework needed.
 */

const TOGGLE_TRIGGERS = ["toggle", "hover", "press", "load", "inView"];
const LOOP_TRIGGERS = ["load", "inView", "hover", "toggle"];
const POINTER_TRIGGERS = ["pointer", "hover", "toggle", "press", "load", "inView"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** Each letter gets two stacked copies; hovering rolls the first up and the second in. */
function rollMarkup(text) {
  return [...text]
    .map((ch) =>
      ch === " "
        ? `<span class="roll-sp" aria-hidden="true"></span>`
        : `<span class="roll-ch" aria-hidden="true"><span class="roll-a">${esc(ch)}</span><span class="roll-b">${esc(ch)}</span></span>`,
    )
    .join("");
}

/** Letters placed around a circle with CSS custom properties. */
function spinMarkup(text) {
  return [...text].map((ch, i) => `<span class="spin-ch" style="--i:${i}" aria-hidden="true">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("");
}
const SPIN_TEXT = "MOTION STUDIO • ANIMATE ANYTHING • ";

const ICONS = {
  home: `<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>`,
  search: `<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>`,
  music: `<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>`,
  settings: `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  bold: `<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>`,
  link: `<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>`,
  image: `<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>`,
  more: `<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>`,
};
export const icon = (name, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const dockItem = (label, name, c1, c2) =>
  `  <a class="dk-item" href="#" aria-label="${label}" style="--c1:${c1};--c2:${c2}">${icon(name, 24)}</a>`;

export const EXTRA_COMPONENTS = {
  dock: {
    label: "Dock (magnify)",
    emoji: "🧲",
    thumb: "list",
    markup: `<div class="motion-target dock" role="group" aria-label="App dock">
${dockItem("Home", "home", "#6366f1", "#8b5cf6")}
${dockItem("Search", "search", "#0ea5e9", "#22d3ee")}
${dockItem("Mail", "mail", "#ec4899", "#f43f5e")}
${dockItem("Music", "music", "#f59e0b", "#f97316")}
${dockItem("Settings", "settings", "#10b981", "#22c55e")}
</div>`,
    parts: [
      { key: "item", label: "Dock icons", selector: ".dk-item", multi: true },
      { key: "root", label: "Dock", selector: null },
    ],
    clicks: [],
    triggers: ["pointer", "hover", "load", "inView"],
    css: `.dock {
  display: inline-flex;
  align-items: flex-end;
  gap: 14px;
  padding: 10px 14px;
  border-radius: calc({{radius}}px + 6px);
  background: rgba(28, 28, 34, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.5);
}
.dk-item {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: calc({{radius}}px - 2px);
  background: linear-gradient(145deg, var(--c1), var(--c2));
  color: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  /* Icons grow upwards from the dock, like on a Mac. */
  transform-origin: 50% 100%;
}`,
  },

  compare: {
    label: "Image comparison",
    emoji: "↔️",
    thumb: "card",
    markup: `<div class="motion-target cmp" role="img" aria-label="Before and after comparison">
  <div class="cmp-layer cmp-before"><span class="cmp-tag">Before</span></div>
  <div class="cmp-layer cmp-after"><span class="cmp-tag">After</span></div>
  <div class="cmp-handle" aria-hidden="true"></div>
</div>`,
    parts: [
      { key: "after", label: "After image", selector: ".cmp-after" },
      { key: "handle", label: "Divider", selector: ".cmp-handle" },
      { key: "root", label: "Frame", selector: null },
    ],
    clicks: [],
    triggers: POINTER_TRIGGERS,
    css: `.cmp {
  position: relative;
  width: 340px;
  height: 210px;
  border-radius: {{radius}}px;
  overflow: hidden;
  font-family: system-ui, sans-serif;
  color: #fff;
  cursor: ew-resize;
  user-select: none;
}
.cmp-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 14px;
}
.cmp-layer::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 40%;
  width: 96px;
  height: 96px;
  margin: -48px 0 0 -48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
}
/* Swap these two backgrounds for your own images. */
.cmp-before {
  justify-content: flex-end;
  background: linear-gradient(135deg, #52525b, #27272a);
}
.cmp-after {
  background: linear-gradient(135deg, {{color}}, #ec4899 62%, #f59e0b);
  clip-path: inset(0 50% 0 0);
}
.cmp-tag {
  position: relative;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.cmp-handle {
  position: absolute;
  inset: 0;
  transform: translateX(-50%);
  border-right: 2px solid #fff;
  pointer-events: none;
}
.cmp-handle::after {
  content: "↔";
  position: absolute;
  right: -15px;
  top: 50%;
  width: 28px;
  height: 28px;
  margin-top: -14px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff;
  color: #18181b;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}`,
  },

  popover: {
    label: "Morphing popover",
    emoji: "💬",
    thumb: "button",
    markup: `<div class="motion-target mpop">
  <div class="mp-surface">
    <button class="mp-btn" type="button" aria-expanded="false" aria-haspopup="dialog">
      ${icon("mail", 16)} Feedback
    </button>
    <form class="mp-form" aria-label="Send feedback" onsubmit="return false">
      <textarea aria-label="Your feedback" placeholder="What can we improve?"></textarea>
      <div class="mp-actions">
        <button class="mp-cancel" type="button">Cancel</button>
        <button class="mp-send" type="button">Send</button>
      </div>
    </form>
  </div>
</div>`,
    parts: [
      { key: "surface", label: "Surface", selector: ".mp-surface" },
      { key: "btn", label: "Button label", selector: ".mp-btn" },
      { key: "form", label: "Form", selector: ".mp-form" },
      { key: "root", label: "Holder", selector: null },
    ],
    clicks: [".mp-btn", ".mp-cancel", ".mp-send"],
    triggers: TOGGLE_TRIGGERS,
    css: `.mpop {
  position: relative;
  width: 300px;
  height: 190px;
  font-family: system-ui, sans-serif;
}
.mp-surface {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 140px;
  height: 46px;
  border-radius: 23px;
  overflow: hidden;
  background: #1c1c22;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 24px 50px -12px rgba(0, 0, 0, 0.5);
}
.mp-btn {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  background: none;
  color: inherit;
  font: 600 14px system-ui, sans-serif;
  cursor: pointer;
}
.mpop.is-open .mp-btn {
  pointer-events: none;
}
.mp-form {
  position: absolute;
  left: 0;
  top: 0;
  width: 300px;
  height: 190px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  margin: 0;
  opacity: 0;
  /* Hidden (and out of the tab order) until open. */
  visibility: hidden;
  transition: visibility 0s linear 0.35s;
}
.mpop.is-open .mp-form {
  visibility: visible;
  transition-delay: 0s;
}
.mp-form textarea {
  flex: 1;
  resize: none;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font: inherit;
  font-size: 13px;
}
.mp-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.mp-cancel,
.mp-send {
  padding: 7px 14px;
  border: 0;
  border-radius: 8px;
  font: 600 13px system-ui, sans-serif;
  cursor: pointer;
}
.mp-cancel {
  background: none;
  color: rgba(255, 255, 255, 0.75);
}
.mp-send {
  background: {{color}};
  color: {{text}};
}`,
  },

  toolbar: {
    label: "Expandable toolbar",
    emoji: "🧰",
    thumb: "button",
    markup: `<div class="motion-target tb" role="toolbar" aria-label="Formatting">
  <button class="tb-toggle" type="button" aria-label="Show tools" aria-expanded="false">${icon("plus")}</button>
  <button class="tb-tool" type="button" aria-label="Bold">${icon("bold", 18)}</button>
  <button class="tb-tool" type="button" aria-label="Link">${icon("link", 18)}</button>
  <button class="tb-tool" type="button" aria-label="Image">${icon("image", 18)}</button>
  <button class="tb-tool" type="button" aria-label="More">${icon("more", 18)}</button>
</div>`,
    parts: [
      { key: "tool", label: "Tools", selector: ".tb-tool", multi: true },
      { key: "toggle", label: "Toggle button", selector: ".tb-toggle" },
      { key: "root", label: "Toolbar", selector: null },
    ],
    clicks: [".tb-toggle"],
    triggers: TOGGLE_TRIGGERS,
    css: `.tb {
  display: flex;
  align-items: center;
  gap: 2px;
  box-sizing: border-box;
  width: 48px;
  height: 48px;
  padding: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: #1c1c22;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 18px 40px -10px rgba(0, 0, 0, 0.5);
}
.tb-toggle,
.tb-tool {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.tb-toggle {
  background: {{color}};
  color: {{text}};
}
.tb-tool {
  background: none;
  color: #fff;
  opacity: 0;
  /* Hidden (and out of the tab order) until open. */
  visibility: hidden;
  transition: visibility 0s linear 0.35s;
}
.tb.is-open .tb-tool {
  visibility: visible;
  transition-delay: 0s;
}
.tb-tool:hover {
  background: rgba(255, 255, 255, 0.12);
}`,
  },

  marquee: {
    label: "Infinite slider",
    emoji: "♾️",
    thumb: "list",
    markup: `<div class="motion-target marquee" role="group" aria-label="Skills">
  <div class="mq-track">
    <ul class="mq-set">
      <li class="mq-item"><i></i>Design</li>
      <li class="mq-item"><i></i>Motion</li>
      <li class="mq-item"><i></i>Prototype</li>
      <li class="mq-item"><i></i>Develop</li>
      <li class="mq-item"><i></i>Launch</li>
    </ul>
    <ul class="mq-set" aria-hidden="true">
      <li class="mq-item"><i></i>Design</li>
      <li class="mq-item"><i></i>Motion</li>
      <li class="mq-item"><i></i>Prototype</li>
      <li class="mq-item"><i></i>Develop</li>
      <li class="mq-item"><i></i>Launch</li>
    </ul>
  </div>
</div>`,
    parts: [
      { key: "track", label: "Track", selector: ".mq-track" },
      { key: "root", label: "Frame", selector: null },
    ],
    clicks: [],
    triggers: LOOP_TRIGGERS,
    css: `.marquee {
  width: 420px;
  max-width: 100%;
  overflow: hidden;
  font-family: system-ui, sans-serif;
  /* Soft edges. */
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
}
.mq-track {
  display: flex;
  width: max-content;
}
/* Two identical sets: sliding by -50% lands exactly on the start again. */
.mq-set {
  display: flex;
  flex: none;
  gap: 12px;
  margin: 0;
  padding: 0 6px;
  list-style: none;
}
.mq-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  background: #1c1c22;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
.mq-item i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: {{color}};
}`,
  },

  bordertrail: {
    label: "Border trail",
    emoji: "✨",
    thumb: "card",
    markup: `<div class="motion-target bt-card">
  <span class="bt-trail" aria-hidden="true"><i class="bt-spin"></i></span>
  <strong>Border trail</strong>
  <span class="bt-text">A light travels around the edge of the card.</span>
</div>`,
    parts: [
      { key: "spin", label: "Light", selector: ".bt-spin" },
      { key: "root", label: "Card", selector: null },
    ],
    clicks: [],
    triggers: LOOP_TRIGGERS,
    css: `.bt-card {
  position: relative;
  box-sizing: border-box;
  width: 280px;
  padding: 22px;
  border-radius: {{radius}}px;
  background: #16161b;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-family: system-ui, sans-serif;
}
.bt-card strong {
  display: block;
  margin-bottom: 4px;
  font-size: 17px;
}
.bt-text {
  font-size: 13px;
  opacity: 0.7;
}
/* A transparent border, masked so only the ring itself shows the light. */
.bt-trail {
  position: absolute;
  inset: -1px;
  border: 2px solid transparent;
  border-radius: inherit;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
  -webkit-mask-clip: padding-box, border-box;
  -webkit-mask-composite: xor;
  mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
  mask-clip: padding-box, border-box;
  mask-composite: exclude;
}
/* A bright streak on a spinning colour wheel: only the ring shows it. */
.bt-spin {
  position: absolute;
  inset: -100%;
  background: conic-gradient(from 0deg, transparent 0deg 190deg, {{color}} 290deg, #fff 352deg, transparent 360deg);
}`,
  },

  glow: {
    label: "Glow card",
    emoji: "🌈",
    thumb: "card",
    markup: `<div class="motion-target glow-card">
  <div class="gl-ring gl-halo" aria-hidden="true"><i class="gl-spin"></i></div>
  <div class="gl-ring" aria-hidden="true"><i class="gl-spin"></i></div>
  <div class="gl-body">
    <strong>Glow</strong>
    <span>A colour wheel spins behind the card.</span>
  </div>
</div>`,
    parts: [
      { key: "spin", label: "Colour wheel", selector: ".gl-spin", multi: true },
      { key: "root", label: "Card", selector: null },
    ],
    clicks: [],
    triggers: LOOP_TRIGGERS,
    css: `.glow-card {
  position: relative;
  width: 270px;
  border-radius: {{radius}}px;
  font-family: system-ui, sans-serif;
}
.gl-ring {
  position: absolute;
  inset: -2px;
  border-radius: calc({{radius}}px + 2px);
  overflow: hidden;
  pointer-events: none;
}
/* The same ring again, blurred: that is the glow. */
.gl-halo {
  inset: -6px;
  border-radius: calc({{radius}}px + 6px);
  filter: blur(10px);
  opacity: 0.7;
}
.gl-spin {
  position: absolute;
  inset: -100%;
  background: conic-gradient({{color}}, #ec4899, #f59e0b, #22d3ee, {{color}});
}
.gl-body {
  position: relative;
  display: grid;
  gap: 4px;
  padding: 22px;
  border-radius: {{radius}}px;
  background: #16161b;
  color: #fff;
}
.gl-body span {
  font-size: 13px;
  opacity: 0.7;
}`,
  },

  counter: {
    label: "Animated number",
    emoji: "🔢",
    thumb: "card",
    markup: `<div class="motion-target counter" role="group" aria-label="2480 happy customers">
  <div class="cn-row" aria-hidden="true"><span class="cn-value"></span><span class="cn-suffix">+</span></div>
  <span class="cn-label" aria-hidden="true">Happy customers</span>
</div>`,
    parts: [
      { key: "value", label: "Number", selector: ".cn-value" },
      { key: "root", label: "Card", selector: null },
    ],
    clicks: [],
    triggers: LOOP_TRIGGERS,
    css: `.counter {
  display: grid;
  gap: 8px;
  padding: 24px 32px;
  border-radius: {{radius}}px;
  background: #16161b;
  color: #fff;
  font-family: system-ui, sans-serif;
}
/* The number is a CSS counter fed by the animated --n variable. */
.cn-value {
  display: inline-block;
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  counter-reset: n calc(var(--n, 0));
}
.cn-value::after {
  content: counter(n);
}
.cn-suffix {
  font-size: 32px;
  font-weight: 700;
  color: {{color}};
}
.cn-label {
  font-size: 13px;
  opacity: 0.65;
}`,
  },

  shimmer: {
    label: "Shimmer text",
    emoji: "🪩",
    thumb: "card",
    markup: `<p class="motion-target shimmer-text">Generating your report</p>`,
    parts: [{ key: "root", label: "Text", selector: null }],
    clicks: [],
    triggers: LOOP_TRIGGERS,
    css: `.shimmer-text {
  margin: 0;
  font: 700 40px / 1.15 system-ui, sans-serif;
  letter-spacing: -0.02em;
  /* A bright band sweeps across grey text. */
  background: linear-gradient(100deg, #8b8b95 38%, {{color}} 50%, #8b8b95 62%);
  background-size: 250% 100%;
  background-position-x: 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}`,
  },

  textloop: {
    label: "Text loop (rotating words)",
    emoji: "🔁",
    thumb: "card",
    markup: `<p class="motion-target tloop">
  <span>Build</span>
  <span class="tl-words">
    <span class="tl-word">faster</span>
    <span class="tl-word">smarter</span>
    <span class="tl-word">bolder</span>
    <span class="tl-word">beautiful</span>
  </span>
</p>`,
    parts: [{ key: "word", label: "Words", selector: ".tl-word", multi: true }],
    clicks: [],
    triggers: LOOP_TRIGGERS,
    css: `.tloop {
  display: flex;
  gap: 0.3em;
  margin: 0;
  font: 700 36px / 1.2 system-ui, sans-serif;
  letter-spacing: -0.02em;
}
/* Words stack in one grid cell; the box clips whichever one is sliding. */
.tl-words {
  display: inline-grid;
  height: 1.2em;
  overflow: hidden;
  text-align: left;
  color: {{color}};
}
.tl-word {
  grid-area: 1 / 1;
  opacity: 0;
}`,
  },

  roll: {
    label: "Text roll (on hover)",
    emoji: "🎰",
    thumb: "card",
    markup: `<a class="motion-target roll" href="#" aria-label="Explore the work">${rollMarkup("Explore the work")}</a>`,
    parts: [
      { key: "a", label: "Top letters", selector: ".roll-a", multi: true },
      { key: "b", label: "Incoming letters", selector: ".roll-b", multi: true },
    ],
    clicks: [],
    triggers: ["hover", "press", "load", "inView", "toggle"],
    css: `.roll {
  display: inline-flex;
  font: 700 34px / 1.15 system-ui, sans-serif;
  letter-spacing: -0.01em;
  text-decoration: none;
  color: inherit;
}
/* Each letter is clipped; a copy waits just below it. */
.roll-ch {
  position: relative;
  display: inline-block;
  overflow: hidden;
  vertical-align: top;
}
.roll-a {
  display: block;
}
.roll-b {
  position: absolute;
  left: 0;
  top: 0;
  display: block;
  color: {{color}};
}
.roll-sp {
  display: inline-block;
  width: 0.3em;
}`,
  },

  spintext: {
    label: "Spinning text",
    emoji: "🌀",
    thumb: "card",
    markup: `<div class="motion-target spin-text" role="img" aria-label="Motion Studio, animate anything" style="--n:${[...SPIN_TEXT].length}">${spinMarkup(SPIN_TEXT)}</div>`,
    parts: [{ key: "root", label: "Ring", selector: null }],
    clicks: [],
    triggers: LOOP_TRIGGERS,
    css: `.spin-text {
  position: relative;
  width: 160px;
  height: 160px;
  font: 700 13px / 1 system-ui, sans-serif;
}
/* Every letter sits on a spoke and is rotated into place around the centre. */
.spin-ch {
  position: absolute;
  left: 50%;
  top: 0;
  height: 80px;
  transform-origin: 50% 100%;
  transform: translateX(-50%) rotate(calc(var(--i) * 360deg / var(--n)));
}
.spin-text::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: {{color}};
}`,
  },
};
