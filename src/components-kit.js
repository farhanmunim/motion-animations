/**
 * A third batch of components, inspired by the premium examples at
 * motion.dev/examples: icon swaps with a drawn checkmark, hold-to-confirm,
 * card stacks, radial menus, command palettes, page-transition curtains,
 * cursor followers and more. Plain HTML + CSS + motion.dev.
 */
import { icon } from "./components-more.js";

const TOGGLE_TRIGGERS = ["toggle", "hover", "press", "load", "inView"];
const LOOP_TRIGGERS = ["load", "inView", "hover", "toggle"];

const radialItem = (angle, name, label) =>
  `    <div class="rm-spoke" style="--a:${angle}deg"><button class="rm-item" type="button" aria-label="${label}"><span class="rm-icon">${icon(name, 18)}</span></button></div>`;

export const KIT_COMPONENTS = {
  copybtn: {
    label: "Copy button (icon swap)",
    emoji: "📋",
    thumb: "button",
    markup: `<button class="motion-target copybtn" type="button" aria-label="Copy to clipboard" aria-expanded="false">
  <span class="cp-bg" aria-hidden="true"></span>
  <svg class="cp-copy" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
  <svg class="cp-check" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="cp-tick" pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"/></svg>
</button>`,
    parts: [
      { key: "bg", label: "Fill", selector: ".cp-bg" },
      { key: "copy", label: "Copy icon", selector: ".cp-copy" },
      { key: "check", label: "Check icon", selector: ".cp-check" },
      { key: "tick", label: "Checkmark line", selector: ".cp-tick" },
      { key: "root", label: "Button", selector: null },
    ],
    clicks: [],
    triggers: TOGGLE_TRIGGERS,
    css: `.copybtn {
  position: relative;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: {{radius}}px;
  background: #24242c;
  color: #fff;
  cursor: pointer;
}
/* The accent colour grows from the middle when copied. */
.cp-bg {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: {{color}};
  opacity: 0;
}
.cp-copy,
.cp-check {
  position: absolute;
}
.cp-check {
  opacity: 0;
}
.copybtn.is-open {
  color: {{text}};
}`,
  },

  holdbtn: {
    label: "Hold to confirm",
    emoji: "👆",
    thumb: "button",
    markup: `<button class="motion-target holdbtn" type="button">
  <span class="hb-fill" aria-hidden="true"></span>
  <span class="hb-label">Hold to delete</span>
</button>`,
    parts: [
      { key: "fill", label: "Progress fill", selector: ".hb-fill" },
      { key: "root", label: "Button", selector: null },
    ],
    clicks: [],
    triggers: ["press", "hover", "toggle", "load", "inView"],
    css: `.holdbtn {
  position: relative;
  overflow: hidden;
  padding: 15px 26px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: {{radius}}px;
  background: #24242c;
  color: #fff;
  font: 600 15px system-ui, sans-serif;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
.hb-fill {
  position: absolute;
  inset: 0;
  background: {{color}};
  transform-origin: 0 50%;
  transform: scaleX(0);
}
.hb-label {
  position: relative;
}`,
  },

  cardstack: {
    label: "Card stack (fans out)",
    emoji: "🃏",
    thumb: "card",
    markup: `<div class="motion-target stack" role="group" aria-label="Card stack">
  <article class="st-card st-c3"><span class="st-tag">03</span><strong>Review</strong></article>
  <article class="st-card st-c2"><span class="st-tag">02</span><strong>Build</strong></article>
  <article class="st-card st-c1"><span class="st-tag">01</span><strong>Design</strong></article>
</div>`,
    parts: [
      { key: "c1", label: "Front card", selector: ".st-c1" },
      { key: "c2", label: "Middle card", selector: ".st-c2" },
      { key: "c3", label: "Back card", selector: ".st-c3" },
    ],
    clicks: [],
    triggers: TOGGLE_TRIGGERS,
    css: `.stack {
  position: relative;
  width: 200px;
  height: 130px;
  font-family: system-ui, sans-serif;
}
.st-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  border-radius: {{radius}}px;
  color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 18px 40px -12px rgba(0, 0, 0, 0.5);
}
.st-card strong {
  font-size: 20px;
  letter-spacing: -0.02em;
}
.st-tag {
  align-self: flex-start;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 11px;
  font-weight: 600;
}
.st-c1 {
  background: linear-gradient(135deg, {{color}}, #ec4899);
}
.st-c2 {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}
.st-c3 {
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
}`,
  },

  radial: {
    label: "Radial menu",
    emoji: "🎡",
    thumb: "button",
    markup: `<div class="motion-target radial">
  <button class="rm-toggle" type="button" aria-label="Open menu" aria-expanded="false">${icon("plus", 22)}</button>
${radialItem(-150, "home", "Home")}
${radialItem(-120, "search", "Search")}
${radialItem(-90, "mail", "Mail")}
${radialItem(-60, "music", "Music")}
${radialItem(-30, "settings", "Settings")}
</div>`,
    parts: [
      { key: "item", label: "Menu items", selector: ".rm-item", multi: true },
      { key: "toggle", label: "Toggle button", selector: ".rm-toggle" },
    ],
    clicks: [".rm-toggle"],
    triggers: TOGGLE_TRIGGERS,
    css: `.radial {
  position: relative;
  width: 56px;
  height: 56px;
  margin-top: 90px;
  font-family: system-ui, sans-serif;
}
.rm-toggle {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: {{color}};
  color: {{text}};
  box-shadow: 0 10px 28px -6px rgba(0, 0, 0, 0.45);
  cursor: pointer;
}
/* Each item rides its own spoke: the spoke is rotated, the item slides along it. */
.rm-spoke {
  position: absolute;
  left: 28px;
  top: 28px;
  width: 0;
  height: 0;
  transform: rotate(var(--a));
}
.rm-item {
  position: absolute;
  left: -22px;
  top: -22px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  background: #24242c;
  color: #fff;
  cursor: pointer;
  /* Hidden (and out of the tab order) until open. */
  visibility: hidden;
  transition: visibility 0s linear 0.35s;
}
.radial.is-open .rm-item {
  visibility: visible;
  transition-delay: 0s;
}
/* Keep the icons upright whatever the spoke's angle. */
.rm-icon {
  display: grid;
  transform: rotate(calc(var(--a) * -1));
}`,
  },

  palette: {
    label: "Command palette",
    emoji: "⌘",
    thumb: "card",
    markup: `<div class="motion-target palette">
  <button class="pl-open" type="button" aria-expanded="false" aria-haspopup="dialog">Open palette <kbd>⌘K</kbd></button>
  <div class="pl-backdrop"></div>
  <div class="pl-panel" role="dialog" aria-modal="true" aria-label="Command palette">
    <input class="pl-input" type="text" placeholder="Type a command…" aria-label="Search commands" />
    <ul class="pl-list">
      <li class="pl-item">${icon("plus", 16)} New project</li>
      <li class="pl-item">${icon("search", 16)} Search files</li>
      <li class="pl-item">${icon("mail", 16)} Invite a teammate</li>
      <li class="pl-item">${icon("settings", 16)} Open settings</li>
    </ul>
  </div>
</div>`,
    parts: [
      { key: "backdrop", label: "Backdrop", selector: ".pl-backdrop" },
      { key: "panel", label: "Panel", selector: ".pl-panel" },
      { key: "item", label: "Results", selector: ".pl-item", multi: true },
    ],
    clicks: [".pl-open", ".pl-backdrop", ".pl-item"],
    triggers: TOGGLE_TRIGGERS,
    css: `.palette {
  font-family: system-ui, sans-serif;
}
.pl-open {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border: 0;
  border-radius: {{radius}}px;
  background: {{color}};
  color: {{text}};
  font: 600 15px system-ui, sans-serif;
  cursor: pointer;
}
.pl-open kbd {
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.28);
  color: inherit;
  font: 600 12px system-ui, sans-serif;
}
.pl-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(8, 8, 12, 0.55);
  pointer-events: none;
}
.pl-panel {
  position: fixed;
  top: 18%;
  left: 50%;
  translate: -50% 0;
  width: min(400px, calc(100% - 32px));
  overflow: hidden;
  border-radius: {{radius}}px;
  background: #24242c;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 40px 90px -20px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}
.palette.is-open .pl-backdrop,
.palette.is-open .pl-panel {
  pointer-events: auto;
}
.pl-input {
  box-sizing: border-box;
  width: 100%;
  padding: 16px 18px;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  background: none;
  color: inherit;
  font: inherit;
  font-size: 15px;
}
.pl-list {
  margin: 0;
  padding: 6px;
  list-style: none;
}
.pl-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: calc({{radius}}px - 4px);
  font-size: 14px;
  cursor: pointer;
}
.pl-item:hover {
  background: rgba(255, 255, 255, 0.08);
}`,
  },

  ripples: {
    label: "Ripple loader",
    emoji: "🌊",
    thumb: "card",
    markup: `<div class="motion-target ripples" role="status" aria-label="Loading">
  <span class="rp-ring"></span>
  <span class="rp-ring"></span>
  <span class="rp-ring"></span>
  <span class="rp-core"></span>
</div>`,
    parts: [
      { key: "ring", label: "Rings", selector: ".rp-ring", multi: true },
      { key: "root", label: "Loader", selector: null },
    ],
    clicks: [],
    triggers: LOOP_TRIGGERS,
    css: `.ripples {
  position: relative;
  width: 120px;
  height: 120px;
}
.rp-ring,
.rp-core {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
}
.rp-ring {
  width: 120px;
  height: 120px;
  margin: -60px 0 0 -60px;
  border: 2px solid {{color}};
  opacity: 0;
}
.rp-core {
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  background: {{color}};
}`,
  },

  pathdraw: {
    label: "Path drawing",
    emoji: "✍️",
    thumb: "card",
    markup: `<svg class="motion-target pathdraw" viewBox="0 0 220 90" width="220" height="90" role="img" aria-label="A line drawing itself">
  <path class="pd-track" d="M10 62 C 40 8, 70 8, 100 45 S 160 82, 210 28" />
  <path class="pd-line" pathLength="1" d="M10 62 C 40 8, 70 8, 100 45 S 160 82, 210 28" />
</svg>`,
    parts: [
      { key: "line", label: "Line", selector: ".pd-line" },
      { key: "root", label: "Drawing", selector: null },
    ],
    clicks: [],
    triggers: LOOP_TRIGGERS,
    css: `.pathdraw {
  overflow: visible;
}
.pd-track,
.pd-line {
  fill: none;
  stroke-width: 5;
  stroke-linecap: round;
}
.pd-track {
  stroke: rgba(127, 127, 140, 0.25);
}
.pd-line {
  stroke: {{color}};
}`,
  },

  cursorring: {
    label: "Cursor follower",
    emoji: "⭕",
    thumb: "button",
    markup: `<div class="motion-target cursor-ring" aria-hidden="true"><i class="cr-dot"></i></div>`,
    parts: [{ key: "root", label: "Ring", selector: null }],
    clicks: [],
    triggers: ["pointer", "load"],
    css: `/* Place this inside a full-screen container. It starts in the middle and follows the pointer. */
.cursor-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 44px;
  height: 44px;
  margin: -22px 0 0 -22px;
  border: 2px solid {{color}};
  border-radius: 50%;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.cr-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: {{color}};
}`,
  },

  blinds: {
    label: "Page transition: blinds",
    emoji: "🪟",
    thumb: "card",
    markup: `<div class="motion-target blinds" role="button" tabindex="0" aria-label="Play page transition">
  <div class="bl-page"><strong>Page one</strong><span>Click to wipe to the next page.</span></div>
  <div class="bl-strips" aria-hidden="true"><i class="bl-strip"></i><i class="bl-strip"></i><i class="bl-strip"></i><i class="bl-strip"></i><i class="bl-strip"></i><i class="bl-strip"></i></div>
</div>`,
    parts: [{ key: "strip", label: "Blinds", selector: ".bl-strip", multi: true }],
    clicks: [],
    triggers: TOGGLE_TRIGGERS,
    css: `.blinds {
  position: relative;
  width: 340px;
  height: 200px;
  overflow: hidden;
  border-radius: {{radius}}px;
  background: #202027;
  color: #fff;
  font-family: system-ui, sans-serif;
  cursor: pointer;
}
.bl-page {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 6px;
  text-align: center;
}
.bl-page strong {
  font-size: 26px;
  letter-spacing: -0.02em;
}
.bl-page span {
  font-size: 13px;
  opacity: 0.65;
}
.bl-strips {
  position: absolute;
  inset: 0;
  display: flex;
}
.bl-strip {
  flex: 1;
  background: {{color}};
  transform-origin: 50% 0;
  transform: scaleY(0);
}`,
  },

  iris: {
    label: "Page transition: iris",
    emoji: "👁️",
    thumb: "card",
    markup: `<div class="motion-target iris" role="button" tabindex="0" aria-label="Play page transition">
  <div class="ir-page"><strong>Page one</strong><span>Click to open the iris.</span></div>
  <div class="ir-cover" aria-hidden="true"><strong>Page two</strong></div>
</div>`,
    parts: [{ key: "cover", label: "Cover", selector: ".ir-cover" }],
    clicks: [],
    triggers: TOGGLE_TRIGGERS,
    css: `.iris {
  position: relative;
  width: 340px;
  height: 200px;
  overflow: hidden;
  border-radius: {{radius}}px;
  background: #202027;
  color: #fff;
  font-family: system-ui, sans-serif;
  cursor: pointer;
}
.ir-page,
.ir-cover {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 6px;
  text-align: center;
}
.ir-page strong,
.ir-cover strong {
  font-size: 26px;
  letter-spacing: -0.02em;
}
.ir-page span {
  font-size: 13px;
  opacity: 0.65;
}
.ir-cover {
  background: linear-gradient(135deg, {{color}}, #ec4899);
  clip-path: circle(0% at 50% 50%);
}`,
  },

  filltext: {
    label: "Fill text",
    emoji: "🖍️",
    thumb: "card",
    markup: `<p class="motion-target fill-text">Loading experience</p>`,
    parts: [{ key: "root", label: "Text", selector: null }],
    clicks: [],
    triggers: LOOP_TRIGGERS,
    css: `.fill-text {
  margin: 0;
  font: 800 44px / 1.1 system-ui, sans-serif;
  letter-spacing: -0.03em;
  /* Half grey, half accent: sliding the gradient fills the letters. */
  background: linear-gradient(90deg, {{color}} 50%, #6b6b76 50%);
  background-size: 200% 100%;
  background-position-x: 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}`,
  },

  morph: {
    label: "Shape morph (UI states)",
    emoji: "🫠",
    thumb: "button",
    markup: `<button class="motion-target morph" type="button" aria-label="A shape that morphs through states. Click to change state.">
  <span class="ms-l ms-l1" aria-hidden="true">Get started</span>
  <span class="ms-l ms-l2" aria-hidden="true"><i class="ms-spin"></i></span>
  <span class="ms-l ms-l3" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg><i class="ms-bar"><b></b></i></span>
  <span class="ms-l ms-l4" aria-hidden="true">${icon("check", 18)} Done</span>
</button>`,
    parts: [
      { key: "root", label: "Shape", selector: null },
      { key: "l1", label: "Button text", selector: ".ms-l1" },
      { key: "l2", label: "Loader", selector: ".ms-l2" },
      { key: "l3", label: "Player", selector: ".ms-l3" },
      { key: "l4", label: "Done message", selector: ".ms-l4" },
    ],
    clicks: [],
    triggers: ["step"],
    css: `.morph {
  position: relative;
  overflow: hidden;
  width: 168px;
  height: 52px;
  padding: 0;
  border: 0;
  border-radius: 26px;
  background: {{color}};
  color: #fff;
  font: 600 15px system-ui, sans-serif;
  cursor: pointer;
}
/* All four contents sit on top of each other; the animation blurs one into the next. */
.ms-l {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  white-space: nowrap;
  opacity: 0;
}
.ms-l1 {
  opacity: 1;
}
.ms-spin {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2.5px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  animation: ms-turn 0.8s linear infinite;
}
@keyframes ms-turn {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ms-spin {
    animation: none;
  }
}
.ms-bar {
  position: relative;
  width: 110px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.22);
}
.ms-bar b {
  position: absolute;
  inset: 0 auto 0 0;
  width: 42%;
  border-radius: 2px;
  background: #fff;
}`,
  },

  smoothtabs: {
    label: "Smooth tabs",
    emoji: "🗂️",
    thumb: "list",
    markup: `<div class="motion-target sx-tabs" role="tablist" aria-label="Sections">
  <span class="sx-ind" aria-hidden="true"></span>
  <button class="sx-tab sx-t1" type="button" role="tab" aria-selected="true">Overview</button>
  <button class="sx-tab sx-t2" type="button" role="tab" aria-selected="false" tabindex="-1">Activity</button>
  <button class="sx-tab sx-t3" type="button" role="tab" aria-selected="false" tabindex="-1">Settings</button>
</div>`,
    parts: [
      { key: "ind", label: "Indicator", selector: ".sx-ind" },
      { key: "t1", label: "Tab 1 label", selector: ".sx-t1" },
      { key: "t2", label: "Tab 2 label", selector: ".sx-t2" },
      { key: "t3", label: "Tab 3 label", selector: ".sx-t3" },
    ],
    clicks: [],
    jumps: [".sx-tab"],
    triggers: ["step"],
    css: `.sx-tabs {
  position: relative;
  display: inline-flex;
  padding: 4px;
  border-radius: calc({{radius}}px + 4px);
  background: #24242c;
  border: 1px solid rgba(255, 255, 255, 0.16);
  font-family: system-ui, sans-serif;
}
/* One pill that slides under the active tab. */
.sx-ind {
  position: absolute;
  left: 4px;
  top: 4px;
  bottom: 4px;
  width: 96px;
  border-radius: {{radius}}px;
  background: {{color}};
}
.sx-tab {
  position: relative;
  width: 96px;
  padding: 9px 0;
  border: 0;
  background: none;
  color: #fff;
  font: 600 14px system-ui, sans-serif;
  cursor: pointer;
  opacity: 0.65;
}
.sx-t1 {
  opacity: 1;
}`,
  },

  carousel: {
    label: "Carousel",
    emoji: "🎠",
    thumb: "card",
    markup: `<div class="motion-target sx-carousel" role="group" aria-roledescription="carousel" aria-label="Featured">
  <div class="cs-viewport">
    <div class="cs-track">
      <div class="cs-slide cs-s1" role="group" aria-roledescription="slide" aria-label="1 of 3"><span>01</span><strong>Design</strong></div>
      <div class="cs-slide cs-s2" role="group" aria-roledescription="slide" aria-label="2 of 3"><span>02</span><strong>Build</strong></div>
      <div class="cs-slide cs-s3" role="group" aria-roledescription="slide" aria-label="3 of 3"><span>03</span><strong>Launch</strong></div>
    </div>
  </div>
  <div class="cs-controls">
    <button class="cs-dot" type="button" aria-label="Go to slide 1"><i class="cs-pip cs-p1"></i></button>
    <button class="cs-dot" type="button" aria-label="Go to slide 2"><i class="cs-pip cs-p2"></i></button>
    <button class="cs-dot" type="button" aria-label="Go to slide 3"><i class="cs-pip cs-p3"></i></button>
    <button class="cs-next" type="button" aria-label="Next slide">${icon("arrow", 16)}</button>
  </div>
</div>`,
    parts: [
      { key: "track", label: "Slides", selector: ".cs-track" },
      { key: "p1", label: "Dot 1", selector: ".cs-p1" },
      { key: "p2", label: "Dot 2", selector: ".cs-p2" },
      { key: "p3", label: "Dot 3", selector: ".cs-p3" },
    ],
    clicks: [".cs-next"],
    jumps: [".cs-dot"],
    triggers: ["step"],
    css: `.sx-carousel {
  width: 280px;
  font-family: system-ui, sans-serif;
}
.cs-viewport {
  overflow: hidden;
  border-radius: {{radius}}px;
}
/* Three slides side by side; the track slides in thirds. */
.cs-track {
  display: flex;
  width: 300%;
}
.cs-slide {
  box-sizing: border-box;
  flex: 0 0 33.3333%;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px;
  color: #fff;
}
.cs-slide span {
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 11px;
  font-weight: 600;
}
.cs-slide strong {
  font-size: 26px;
  letter-spacing: -0.02em;
}
.cs-s1 {
  background: linear-gradient(135deg, {{color}}, #ec4899);
}
.cs-s2 {
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
}
.cs-s3 {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}
.cs-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 10px;
}
.cs-dot {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}
.cs-pip {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: currentColor;
  opacity: 0.4;
}
.cs-next {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-left: auto;
  padding: 0;
  border: 1px solid rgba(127, 127, 140, 0.4);
  border-radius: 50%;
  background: none;
  color: inherit;
  cursor: pointer;
}`,
  },

  swapbtn: {
    label: "Blur swap button",
    emoji: "🔀",
    thumb: "button",
    markup: `<button class="motion-target swapbtn" type="button" role="switch" aria-checked="false" aria-label="Subscribe">
  <span class="sw-bg" aria-hidden="true"></span>
  <span class="sw-a" aria-hidden="true">Subscribe</span>
  <span class="sw-b" aria-hidden="true">${icon("check", 16)} Subscribed</span>
</button>`,
    parts: [
      { key: "bg", label: "Fill", selector: ".sw-bg" },
      { key: "a", label: "Text before", selector: ".sw-a" },
      { key: "b", label: "Text after", selector: ".sw-b" },
    ],
    clicks: [],
    triggers: TOGGLE_TRIGGERS,
    css: `.swapbtn {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 156px;
  padding: 13px 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: {{radius}}px;
  background: #24242c;
  color: #fff;
  font: 600 15px system-ui, sans-serif;
  cursor: pointer;
}
.sw-bg {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: {{color}};
  opacity: 0;
}
/* Both labels share one cell; the animation swaps them through a blur. */
.sw-a,
.sw-b {
  grid-area: 1 / 1;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sw-b {
  opacity: 0;
}
.swapbtn.is-open {
  color: {{text}};
}`,
  },
};
