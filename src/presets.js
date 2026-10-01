/**
 * Preset library. Each preset is a partial state that gets merged on top of
 * the default state (see state.js). Keep these small and readable, they are
 * the "starting points" a user picks from.
 */

const tween = (duration, ease = "easeOut", extra = {}) => ({ type: "tween", duration, ease, ...extra });
const spring = (stiffness, damping, extra = {}) => ({ type: "spring", springMode: "physics", stiffness, damping, ...extra });

export const PRESETS = [
  {
    id: "fade-in",
    name: "Fade in",
    emoji: "🌅",
    tags: ["entrance"],
    state: {
      trigger: "load",
      tracks: [{ prop: "opacity", values: [0, 1] }],
      transition: tween(1, "smooth"),
    },
  },
  {
    id: "fade-up",
    name: "Fade up",
    emoji: "⬆️",
    tags: ["entrance"],
    state: {
      trigger: "load",
      tracks: [
        { prop: "opacity", values: [0, 1] },
        { prop: "y", values: [32, 0] },
        { prop: "blur", values: [6, 0] },
      ],
      transition: tween(0.9, "smooth"),
    },
  },
  {
    id: "slide-left",
    name: "Slide in from left",
    emoji: "➡️",
    tags: ["entrance"],
    state: {
      trigger: "load",
      tracks: [
        { prop: "x", values: [-160, 0] },
        { prop: "opacity", values: [0, 1] },
      ],
      transition: tween(0.8, "smooth"),
    },
  },
  {
    id: "pop",
    name: "Pop (spring)",
    emoji: "🫧",
    tags: ["entrance"],
    state: {
      trigger: "load",
      tracks: [
        { prop: "scale", values: [0.4, 1] },
        { prop: "opacity", values: [0, 1] },
      ],
      transition: { type: "spring", springMode: "visual", visualDuration: 0.5, bounce: 0.35 },
    },
  },
  {
    id: "bounce-in",
    name: "Bounce in",
    emoji: "🏀",
    tags: ["entrance"],
    state: {
      trigger: "load",
      tracks: [
        { prop: "y", values: [-220, 0] },
        { prop: "opacity", values: [0, 1] },
      ],
      transition: { type: "spring", springMode: "visual", visualDuration: 0.6, bounce: 0.55 },
    },
  },
  {
    id: "blur-in",
    name: "Blur in",
    emoji: "🌫️",
    tags: ["entrance"],
    state: {
      trigger: "load",
      tracks: [
        { prop: "blur", values: [16, 0] },
        { prop: "opacity", values: [0, 1] },
        { prop: "scale", values: [1.08, 1] },
      ],
      transition: tween(1.1, "smooth"),
    },
  },
  {
    id: "flip-in",
    name: "3D flip in",
    emoji: "🔄",
    tags: ["entrance"],
    state: {
      trigger: "load",
      tracks: [
        { prop: "rotateY", values: [-90, 0] },
        { prop: "opacity", values: [0, 1] },
      ],
      transition: tween(0.9, "expoOut"),
    },
  },
  {
    id: "spin-in",
    name: "Spin in",
    emoji: "🌀",
    tags: ["entrance"],
    state: {
      trigger: "load",
      tracks: [
        { prop: "rotate", values: [-180, 0] },
        { prop: "scale", values: [0, 1] },
      ],
      transition: spring(180, 16),
    },
  },
  {
    id: "in-hold-out",
    name: "In, hold, out",
    emoji: "⏱️",
    tags: ["attention"],
    state: {
      trigger: "load",
      element: { type: "card" },
      tracks: [
        { prop: "opacity", values: [0, 1, 1, 0], times: [0, 0.12, 0.85, 1] },
        { prop: "y", values: [30, 0, 0, -20], times: [0, 0.12, 0.85, 1] },
      ],
      transition: tween(3.5, "easeInOut"),
    },
  },
  {
    id: "pulse",
    name: "Pulse (loop)",
    emoji: "💓",
    tags: ["loop"],
    state: {
      trigger: "load",
      tracks: [{ prop: "scale", values: [1, 1.12, 1] }],
      transition: tween(1.2, "easeInOut", { infinite: true, repeatType: "loop" }),
    },
  },
  {
    id: "float",
    name: "Float (loop)",
    emoji: "🎈",
    tags: ["loop"],
    state: {
      trigger: "load",
      tracks: [{ prop: "y", values: [0, -18] }],
      transition: tween(1.6, "easeInOut", { infinite: true, repeatType: "reverse" }),
    },
  },
  {
    id: "shake",
    name: "Shake",
    emoji: "🫨",
    tags: ["attention"],
    state: {
      trigger: "load",
      tracks: [{ prop: "x", values: [0, -14, 14, -10, 10, -6, 6, 0] }],
      transition: tween(0.6, "easeInOut"),
    },
  },
  {
    id: "wobble",
    name: "Wobble",
    emoji: "🪀",
    tags: ["attention"],
    state: {
      trigger: "load",
      tracks: [
        { prop: "rotate", values: [0, -8, 8, -6, 6, -3, 3, 0] },
        { prop: "scale", values: [1, 1.05, 1] },
      ],
      transition: tween(0.9, "easeInOut"),
    },
  },
  {
    id: "color-shift",
    name: "Color shift (loop)",
    emoji: "🎨",
    tags: ["loop"],
    state: {
      trigger: "load",
      tracks: [
        { prop: "backgroundColor", values: ["#7c3aed", "#ec4899", "#f59e0b", "#7c3aed"] },
        { prop: "borderRadius", values: [16, 60, 16, 16] },
      ],
      transition: tween(4, "linear", { infinite: true, repeatType: "loop" }),
    },
  },
  {
    id: "hover-lift",
    name: "Hover lift",
    emoji: "🖱️",
    tags: ["interaction"],
    state: {
      trigger: "hover",
      element: { type: "card" },
      tracks: [
        { prop: "y", values: [0, -8] },
        { prop: "scale", values: [1, 1.02] },
        { prop: "shadow", values: [0, 36] },
      ],
      transition: { type: "spring", springMode: "visual", visualDuration: 0.35, bounce: 0.2 },
    },
  },
  {
    id: "hover-tilt",
    name: "Hover tilt",
    emoji: "🃏",
    tags: ["interaction"],
    state: {
      trigger: "hover",
      element: { type: "card" },
      tracks: [
        { prop: "rotateX", values: [0, 10] },
        { prop: "rotateY", values: [0, -10] },
        { prop: "scale", values: [1, 1.04] },
      ],
      transition: tween(0.45, "smooth"),
    },
  },
  {
    id: "press-squish",
    name: "Press squish",
    emoji: "👇",
    tags: ["interaction"],
    state: {
      trigger: "press",
      element: { type: "button" },
      tracks: [{ prop: "scale", values: [1, 0.94] }],
      transition: { type: "spring", springMode: "visual", visualDuration: 0.25, bounce: 0.3 },
    },
  },
  {
    id: "reveal-scroll",
    name: "Reveal on scroll",
    emoji: "📜",
    tags: ["scroll"],
    state: {
      trigger: "inView",
      element: { type: "card" },
      tracks: [
        { prop: "opacity", values: [0, 1] },
        { prop: "y", values: [48, 0] },
        { prop: "blur", values: [8, 0] },
      ],
      transition: tween(1, "smooth"),
      inView: { amount: 0.4, once: false },
    },
  },
  {
    id: "stagger-list",
    name: "Stagger list",
    emoji: "📋",
    tags: ["entrance"],
    state: {
      trigger: "load",
      element: { type: "list", count: 5 },
      tracks: [
        { prop: "opacity", values: [0, 1] },
        { prop: "y", values: [24, 0] },
        { prop: "blur", values: [4, 0] },
      ],
      transition: tween(0.7, "smooth"),
      stagger: { enabled: true, each: 0.07, from: "first" },
    },
  },
  {
    id: "stagger-pop",
    name: "Stagger pop from center",
    emoji: "✨",
    tags: ["entrance"],
    state: {
      trigger: "load",
      element: { type: "list", count: 6 },
      tracks: [
        { prop: "scale", values: [0.7, 1] },
        { prop: "opacity", values: [0, 1] },
      ],
      transition: { type: "spring", springMode: "visual", visualDuration: 0.5, bounce: 0.3 },
      stagger: { enabled: true, each: 0.06, from: "center" },
    },
  },
  {
    id: "words-rise",
    name: "Words rise",
    emoji: "🔤",
    tags: ["text"],
    state: {
      trigger: "load",
      element: { type: "text", text: "Design motion, ship code.", split: "words" },
      tracks: [
        { prop: "opacity", values: [0, 1] },
        { prop: "y", values: [24, 0] },
        { prop: "blur", values: [6, 0] },
      ],
      transition: tween(0.8, "smooth"),
      stagger: { enabled: true, each: 0.08, from: "first" },
    },
  },
  {
    id: "letters-drop",
    name: "Letters drop in",
    emoji: "🅰️",
    tags: ["text"],
    state: {
      trigger: "load",
      element: { type: "text", text: "Hello there", split: "chars" },
      tracks: [
        { prop: "y", values: [-60, 0] },
        { prop: "opacity", values: [0, 1] },
        { prop: "rotate", values: [-12, 0] },
      ],
      transition: spring(260, 16),
      stagger: { enabled: true, each: 0.04, from: "first" },
    },
  },
  {
    id: "letters-scale",
    name: "Letters from center",
    emoji: "🔠",
    tags: ["text"],
    state: {
      trigger: "load",
      element: { type: "text", text: "MOTION", split: "chars" },
      tracks: [
        { prop: "scale", values: [0, 1] },
        { prop: "opacity", values: [0, 1] },
        { prop: "letterSpacing", values: [12, 0] },
      ],
      transition: tween(0.7, "backOut"),
      stagger: { enabled: true, each: 0.06, from: "center" },
    },
  },
  {
    id: "typewriter",
    name: "Typewriter reveal",
    emoji: "⌨️",
    tags: ["text"],
    state: {
      trigger: "load",
      element: { type: "text", text: "Typing this out, one letter at a time.", split: "chars" },
      tracks: [{ prop: "opacity", values: [0, 1] }],
      transition: tween(0.01, "linear"),
      stagger: { enabled: true, each: 0.045, from: "first" },
    },
  },
  {
    id: "words-blur-scroll",
    name: "Words blur in on scroll",
    emoji: "🌁",
    tags: ["text", "scroll"],
    state: {
      trigger: "inView",
      element: { type: "text", text: "Scroll to reveal every word.", split: "words" },
      tracks: [
        { prop: "opacity", values: [0, 1] },
        { prop: "blur", values: [10, 0] },
        { prop: "scale", values: [0.9, 1] },
      ],
      transition: tween(0.9, "smooth"),
      stagger: { enabled: true, each: 0.1, from: "first" },
      inView: { amount: 0.5, once: false },
    },
  },
  {
    id: "letters-flip",
    name: "Letters flip in",
    emoji: "🎴",
    tags: ["text"],
    state: {
      trigger: "load",
      element: { type: "text", text: "Flip it", split: "chars" },
      tracks: [
        { prop: "rotateX", values: [-90, 0] },
        { prop: "opacity", values: [0, 1] },
        { prop: "y", values: [20, 0] },
      ],
      transition: tween(0.7, "backOut"),
      stagger: { enabled: true, each: 0.06, from: "first" },
    },
  },
  {
    id: "letters-slam",
    name: "Letters slam in",
    emoji: "💥",
    tags: ["text"],
    state: {
      trigger: "load",
      element: { type: "text", text: "IMPACT", split: "chars" },
      tracks: [
        { prop: "scale", values: [3, 1] },
        { prop: "opacity", values: [0, 1] },
        { prop: "blur", values: [12, 0] },
      ],
      transition: tween(0.55, "expoOut"),
      stagger: { enabled: true, each: 0.07, from: "first" },
    },
  },
  {
    id: "words-skew",
    name: "Words skew slide",
    emoji: "🪂",
    tags: ["text"],
    state: {
      trigger: "load",
      element: { type: "text", text: "Fast, fluid, effortless.", split: "words" },
      tracks: [
        { prop: "x", values: [-60, 0] },
        { prop: "skewX", values: [25, 0] },
        { prop: "opacity", values: [0, 1] },
      ],
      transition: tween(0.8, "smooth"),
      stagger: { enabled: true, each: 0.1, from: "first" },
    },
  },
  {
    id: "words-from-right",
    name: "Words from the right",
    emoji: "⬅️",
    tags: ["text"],
    state: {
      trigger: "load",
      element: { type: "text", text: "Read this backwards", split: "words" },
      tracks: [
        { prop: "x", values: [40, 0] },
        { prop: "opacity", values: [0, 1] },
        { prop: "rotateY", values: [60, 0] },
      ],
      transition: spring(220, 22),
      stagger: { enabled: true, each: 0.1, from: "last" },
    },
  },
  {
    id: "cinematic-title",
    name: "Cinematic title",
    emoji: "🎬",
    tags: ["text"],
    state: {
      trigger: "load",
      element: { type: "text", text: "THE STUDIO", split: "none" },
      tracks: [
        { prop: "letterSpacing", values: [-6, 6] },
        { prop: "opacity", values: [0, 1] },
        { prop: "blur", values: [10, 0] },
        { prop: "scale", values: [1.15, 1] },
      ],
      transition: tween(1.8, "expoOut"),
    },
  },
  {
    id: "letters-wave",
    name: "Wave (loop)",
    emoji: "🌊",
    tags: ["text", "loop"],
    state: {
      trigger: "load",
      element: { type: "text", text: "wavy text", split: "chars" },
      tracks: [{ prop: "y", values: [0, -14, 0] }],
      transition: tween(0.7, "easeInOut", { infinite: true, repeatType: "loop", repeatDelay: 0.6 }),
      stagger: { enabled: true, each: 0.05, from: "first" },
    },
  },
  {
    id: "letters-rainbow",
    name: "Rainbow letters (loop)",
    emoji: "🌈",
    tags: ["text", "loop"],
    state: {
      trigger: "load",
      element: { type: "text", text: "Colorful", split: "chars" },
      tracks: [
        { prop: "color", values: ["#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#8b5cf6"] },
        { prop: "scale", values: [1, 1.15, 1, 1, 1] },
      ],
      transition: tween(2.4, "linear", { infinite: true, repeatType: "loop" }),
      stagger: { enabled: true, each: 0.12, from: "first" },
    },
  },
  {
    id: "letters-jump-hover",
    name: "Hover: letters jump",
    emoji: "🐇",
    tags: ["text", "interaction"],
    state: {
      trigger: "hover",
      element: { type: "text", text: "Hover me", split: "chars" },
      tracks: [
        { prop: "y", values: [0, -14] },
        { prop: "scale", values: [1, 1.25] },
        { prop: "color", values: ["auto", "#ec4899"] },
      ],
      transition: spring(400, 14),
    },
  },
  {
    id: "heading-spread-hover",
    name: "Hover: spread heading",
    emoji: "↔️",
    tags: ["text", "interaction"],
    state: {
      trigger: "hover",
      element: { type: "text", text: "Spread out", split: "none" },
      tracks: [
        { prop: "letterSpacing", values: [0, 4] },
        { prop: "scale", values: [1, 1.04] },
      ],
      transition: tween(0.4, "easeOut"),
    },
  },
  {
    id: "grid-cascade",
    name: "Grid cascade",
    emoji: "🧱",
    tags: ["multiple"],
    state: {
      trigger: "load",
      element: { type: "grid", count: 9 },
      tracks: [
        { prop: "opacity", values: [0, 1] },
        { prop: "scale", values: [0.85, 1] },
        { prop: "y", values: [24, 0] },
      ],
      transition: tween(0.8, "smooth"),
      stagger: { enabled: true, each: 0.05, from: "first" },
    },
  },
  {
    id: "grid-ripple",
    name: "Grid ripple from center",
    emoji: "🌊",
    tags: ["multiple", "loop"],
    state: {
      trigger: "load",
      element: { type: "grid", count: 9 },
      tracks: [
        { prop: "scale", values: [1, 0.75, 1] },
        { prop: "backgroundColor", values: ["#7c3aed", "#ec4899", "#7c3aed"] },
      ],
      transition: tween(1.4, "easeInOut", { infinite: true, repeatType: "loop", repeatDelay: 0.4 }),
      stagger: { enabled: true, each: 0.08, from: "center" },
    },
  },
  {
    id: "list-flip-in",
    name: "List 3D flip in",
    emoji: "🗂️",
    tags: ["multiple"],
    state: {
      trigger: "load",
      element: { type: "list", count: 5 },
      tracks: [
        { prop: "rotateX", values: [-90, 0] },
        { prop: "opacity", values: [0, 1] },
        { prop: "y", values: [20, 0] },
      ],
      transition: tween(0.7, "backOut"),
      stagger: { enabled: true, each: 0.1, from: "first" },
    },
  },
  {
    id: "scroll-spin",
    name: "Scroll-linked spin",
    emoji: "🎚️",
    tags: ["scroll"],
    state: {
      trigger: "scroll",
      tracks: [
        { prop: "rotate", values: [0, 360] },
        { prop: "borderRadius", values: [16, 60] },
      ],
      transition: tween(1, "linear"),
      scroll: { offsetStart: "start end", offsetEnd: "end start" },
    },
  },
  {
    id: "scroll-grow",
    name: "Scroll-linked grow",
    emoji: "📈",
    tags: ["scroll"],
    state: {
      trigger: "scroll",
      element: { type: "text" },
      tracks: [
        { prop: "scale", values: [0.6, 1.3] },
        { prop: "opacity", values: [0.2, 1] },
        { prop: "letterSpacing", values: [-2, 6] },
      ],
      transition: tween(1, "linear"),
      scroll: { offsetStart: "start end", offsetEnd: "center center" },
    },
  },

  /* --- UI components ------------------------------------------------------ */
  {
    id: "c-hamburger",
    name: "Hamburger → X",
    emoji: "🍔",
    tags: ["component"],
    state: {
      trigger: "toggle",
      element: { type: "hamburger" },
      tracks: [
        { part: "bar-top", prop: "y", values: [0, 8] },
        { part: "bar-top", prop: "rotate", values: [0, 45] },
        { part: "bar-mid", prop: "opacity", values: [1, 0] },
        { part: "bar-mid", prop: "scaleX", values: [1, 0.2] },
        { part: "bar-bot", prop: "y", values: [0, -8] },
        { part: "bar-bot", prop: "rotate", values: [0, -45] },
      ],
      transition: spring(420, 26),
    },
  },
  {
    id: "c-dropdown",
    name: "Dropdown menu",
    emoji: "📂",
    tags: ["component"],
    state: {
      trigger: "toggle",
      element: { type: "dropdown" },
      tracks: [
        { part: "panel", prop: "opacity", values: [0, 1] },
        { part: "panel", prop: "y", values: [-8, 0] },
        { part: "panel", prop: "scale", values: [0.96, 1] },
        { part: "item", prop: "opacity", values: [0, 1] },
        { part: "item", prop: "x", values: [-8, 0] },
        { part: "chevron", prop: "rotate", values: [0, 180] },
      ],
      transition: tween(0.3, "smooth"),
      stagger: { enabled: true, each: 0.03, from: "first" },
    },
  },
  {
    id: "c-modal",
    name: "Modal dialog",
    emoji: "🪟",
    tags: ["component"],
    state: {
      trigger: "toggle",
      element: { type: "modal" },
      tracks: [
        { part: "backdrop", prop: "opacity", values: [0, 1] },
        { part: "dialog", prop: "opacity", values: [0, 1] },
        { part: "dialog", prop: "scale", values: [0.94, 1] },
        { part: "dialog", prop: "y", values: [12, 0] },
      ],
      transition: { type: "spring", springMode: "visual", visualDuration: 0.4, bounce: 0.15 },
    },
  },
  {
    id: "c-drawer",
    name: "Side drawer",
    emoji: "🚪",
    tags: ["component"],
    state: {
      trigger: "toggle",
      element: { type: "drawer" },
      tracks: [
        { part: "backdrop", prop: "opacity", values: [0, 1] },
        { part: "panel", prop: "x", values: [-280, 0] },
        { part: "link", prop: "opacity", values: [0, 1] },
        { part: "link", prop: "x", values: [-24, 0] },
      ],
      transition: tween(0.5, "smooth"),
      stagger: { enabled: true, each: 0.05, from: "first" },
    },
  },
  {
    id: "c-toast",
    name: "Toast notification",
    emoji: "🔔",
    tags: ["component"],
    state: {
      trigger: "toggle",
      element: { type: "toast" },
      tracks: [
        { part: "card", prop: "opacity", values: [0, 1] },
        { part: "card", prop: "y", values: [20, 0] },
        { part: "card", prop: "scale", values: [0.96, 1] },
      ],
      transition: { type: "spring", springMode: "visual", visualDuration: 0.45, bounce: 0.3 },
      toggle: { autoClose: 3 },
    },
  },
  {
    id: "c-accordion",
    name: "Accordion",
    emoji: "🪗",
    tags: ["component"],
    state: {
      trigger: "toggle",
      element: { type: "accordion" },
      tracks: [
        { part: "body", prop: "height", values: [0, 92] },
        { part: "body", prop: "opacity", values: [0, 1] },
        { part: "chevron", prop: "rotate", values: [0, 180] },
      ],
      transition: tween(0.45, "smooth"),
    },
  },
  {
    id: "c-switch",
    name: "Toggle switch",
    emoji: "🎚️",
    tags: ["component"],
    state: {
      trigger: "toggle",
      element: { type: "switch" },
      tracks: [
        { part: "knob", prop: "x", values: [0, 24] },
        { part: "root", prop: "backgroundColor", values: ["#3f3f50", "#7c3aed"] },
      ],
      transition: spring(500, 32),
    },
  },
  {
    id: "c-tooltip",
    name: "Tooltip",
    emoji: "💬",
    tags: ["component", "interaction"],
    state: {
      trigger: "hover",
      element: { type: "tooltip" },
      tracks: [
        { part: "tip", prop: "opacity", values: [0, 1] },
        { part: "tip", prop: "y", values: [6, 0] },
        { part: "tip", prop: "scale", values: [0.96, 1] },
      ],
      transition: tween(0.25, "smooth"),
    },
  },
  {
    id: "c-fab",
    name: "Floating action menu",
    emoji: "➕",
    tags: ["component"],
    state: {
      trigger: "toggle",
      element: { type: "fab" },
      tracks: [
        { part: "fab", prop: "rotate", values: [0, 45] },
        { part: "action", prop: "opacity", values: [0, 1] },
        { part: "action", prop: "y", values: [16, 0] },
        { part: "action", prop: "scale", values: [0.6, 1] },
      ],
      transition: { type: "spring", springMode: "visual", visualDuration: 0.4, bounce: 0.3 },
      stagger: { enabled: true, each: 0.05, from: "last" },
    },
  },
];

export function findPreset(id) {
  return PRESETS.find((p) => p.id === id);
}
