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
      transition: tween(0.8, "easeOut"),
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
        { prop: "y", values: [40, 0] },
      ],
      transition: tween(0.7, "easeOut"),
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
      transition: tween(0.6, "custom", { bezier: [0.22, 1, 0.36, 1] }),
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
      transition: spring(320, 18),
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
        { prop: "scale", values: [1.1, 1] },
      ],
      transition: tween(0.9, "easeOut"),
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
      transition: tween(0.8, "backOut"),
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
        { prop: "y", values: [0, -10] },
        { prop: "scale", values: [1, 1.03] },
        { prop: "shadow", values: [0, 40] },
      ],
      transition: spring(300, 22),
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
        { prop: "rotateX", values: [0, 12] },
        { prop: "rotateY", values: [0, -12] },
        { prop: "scale", values: [1, 1.04] },
      ],
      transition: tween(0.35, "easeOut"),
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
      tracks: [{ prop: "scale", values: [1, 0.92] }],
      transition: spring(500, 30),
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
        { prop: "y", values: [60, 0] },
        { prop: "blur", values: [8, 0] },
      ],
      transition: tween(0.8, "easeOut"),
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
        { prop: "x", values: [-40, 0] },
      ],
      transition: tween(0.5, "easeOut"),
      stagger: { enabled: true, each: 0.09, from: "first" },
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
        { prop: "scale", values: [0.6, 1] },
        { prop: "opacity", values: [0, 1] },
      ],
      transition: spring(260, 18),
      stagger: { enabled: true, each: 0.07, from: "center" },
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
      transition: tween(0.6, "custom", { bezier: [0.22, 1, 0.36, 1] }),
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
      transition: tween(0.7, "easeOut"),
      stagger: { enabled: true, each: 0.1, from: "first" },
      inView: { amount: 0.5, once: false },
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
        { prop: "scale", values: [0.7, 1] },
        { prop: "y", values: [30, 0] },
      ],
      transition: spring(220, 20),
      stagger: { enabled: true, each: 0.06, from: "first" },
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
];

export function findPreset(id) {
  return PRESETS.find((p) => p.id === id);
}
