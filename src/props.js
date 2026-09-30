/**
 * Registry of animatable properties.
 *
 * Each entry describes how a property is edited in the UI and how it is
 * converted into a motion.dev keyframe value.
 *
 *  - key:     the name used inside Motion Studio
 *  - motion:  the key motion.dev expects (defaults to `key`)
 *  - kind:    "number" | "color"
 *  - unit:    display unit for the UI
 *  - def:     the value that means "no change" (the element's resting state)
 *  - format:  converts a raw value into the keyframe value motion.dev receives
 */
export const PROPS = {
  x: { label: "Move X", group: "Transform", kind: "number", unit: "px", min: -400, max: 400, step: 1, def: 0 },
  y: { label: "Move Y", group: "Transform", kind: "number", unit: "px", min: -400, max: 400, step: 1, def: 0 },
  scale: { label: "Scale", group: "Transform", kind: "number", unit: "×", min: 0, max: 3, step: 0.01, def: 1 },
  scaleX: { label: "Scale X", group: "Transform", kind: "number", unit: "×", min: 0, max: 3, step: 0.01, def: 1 },
  scaleY: { label: "Scale Y", group: "Transform", kind: "number", unit: "×", min: 0, max: 3, step: 0.01, def: 1 },
  rotate: { label: "Rotate", group: "Transform", kind: "number", unit: "°", min: -360, max: 360, step: 1, def: 0 },
  rotateX: { label: "Rotate X (3D)", group: "Transform", kind: "number", unit: "°", min: -180, max: 180, step: 1, def: 0 },
  rotateY: { label: "Rotate Y (3D)", group: "Transform", kind: "number", unit: "°", min: -180, max: 180, step: 1, def: 0 },
  skewX: { label: "Skew X", group: "Transform", kind: "number", unit: "°", min: -60, max: 60, step: 1, def: 0 },
  skewY: { label: "Skew Y", group: "Transform", kind: "number", unit: "°", min: -60, max: 60, step: 1, def: 0 },

  opacity: { label: "Opacity", group: "Appearance", kind: "number", unit: "", min: 0, max: 1, step: 0.01, def: 1 },
  backgroundColor: { label: "Background", group: "Appearance", kind: "color", def: "#7c3aed" },
  color: { label: "Text color", group: "Appearance", kind: "color", def: "#ffffff" },
  borderRadius: {
    label: "Corner radius",
    group: "Appearance",
    kind: "number",
    unit: "px",
    min: 0,
    max: 200,
    step: 1,
    def: 16,
    format: (v) => `${v}px`,
  },
  blur: {
    label: "Blur",
    group: "Appearance",
    motion: "filter",
    kind: "number",
    unit: "px",
    min: 0,
    max: 40,
    step: 0.5,
    def: 0,
    format: (v) => `blur(${v}px)`,
  },
  shadow: {
    label: "Shadow",
    group: "Appearance",
    motion: "boxShadow",
    kind: "number",
    unit: "",
    min: 0,
    max: 80,
    step: 1,
    def: 0,
    format: (v) => (v <= 0 ? "0px 0px 0px rgba(0,0,0,0)" : `0px ${Math.round(v / 2)}px ${v}px rgba(0,0,0,0.35)`),
  },

  width: { label: "Width", group: "Size", kind: "number", unit: "px", min: 10, max: 600, step: 1, def: 120, format: (v) => `${v}px` },
  height: { label: "Height", group: "Size", kind: "number", unit: "px", min: 10, max: 600, step: 1, def: 120, format: (v) => `${v}px` },
  letterSpacing: {
    label: "Letter spacing",
    group: "Size",
    kind: "number",
    unit: "px",
    min: -5,
    max: 30,
    step: 0.5,
    def: 0,
    format: (v) => `${v}px`,
  },
};

export const PROP_GROUPS = ["Transform", "Appearance", "Size"];

/** Convert a raw UI value into the value motion.dev should animate to. */
export function toMotionValue(key, raw) {
  const def = PROPS[key];
  if (!def) return raw;
  if (def.kind === "color") return raw;
  const n = Number(raw);
  return def.format ? def.format(n) : n;
}

/** The motion.dev property name for a Motion Studio property key. */
export function motionKey(key) {
  return PROPS[key]?.motion ?? key;
}

/** Pretty label for a property key. */
export function propLabel(key) {
  return PROPS[key]?.label ?? key;
}

export const EASINGS = [
  { value: "easeOut", label: "Ease out (natural)" },
  { value: "easeInOut", label: "Ease in-out (smooth)" },
  { value: "easeIn", label: "Ease in (accelerate)" },
  { value: "linear", label: "Linear" },
  { value: "circOut", label: "Circ out" },
  { value: "circInOut", label: "Circ in-out" },
  { value: "backOut", label: "Back out (overshoot)" },
  { value: "backInOut", label: "Back in-out" },
  { value: "anticipate", label: "Anticipate (wind up)" },
  { value: "custom", label: "Custom cubic-bezier" },
];

export const TRIGGERS = [
  { value: "load", label: "On load", hint: "Plays as soon as the element appears on the page." },
  { value: "hover", label: "On hover", hint: "Plays when the pointer enters. Reverts when it leaves." },
  { value: "press", label: "On press", hint: "Plays while the element is pressed. Reverts on release." },
  { value: "inView", label: "When scrolled into view", hint: "Plays once the element enters the viewport." },
  { value: "scroll", label: "Linked to scroll", hint: "Scrubs with the scroll position. No timing needed." },
];

export const ELEMENT_TYPES = [
  { value: "box", label: "Box" },
  { value: "circle", label: "Circle" },
  { value: "text", label: "Heading" },
  { value: "button", label: "Button" },
  { value: "card", label: "Card" },
  { value: "list", label: "List (many items)" },
  { value: "grid", label: "Grid of tiles" },
  { value: "custom", label: "Custom HTML" },
];

export const TEXT_SPLITS = [
  { value: "none", label: "Whole heading" },
  { value: "words", label: "Each word" },
  { value: "chars", label: "Each character" },
];
