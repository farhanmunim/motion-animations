/**
 * Sequence presets for Timeline mode. Each is a scene plus a list of
 * actions on the timeline (what, from, to, when, how long).
 */
let n = 0;
const a = (el, prop, from, to, at, duration, extra = {}) => ({ id: `p${++n}`, el, prop, from, to, at, duration, ease: "smooth", stagger: 0.06, ...extra });

export const TIMELINE_PRESETS = [
  {
    id: "t-hero",
    name: "Hero reveal",
    tags: ["hero"],
    state: {
      scene: { type: "hero" },
      trigger: "load",
      actions: [
        a("eyebrow", "opacity", 0, 1, 0, 0.5),
        a("eyebrow", "y", 12, 0, 0, 0.5),
        a("heading", "opacity", 0, 1, 0.1, 0.8),
        a("heading", "y", 28, 0, 0.1, 0.8),
        a("heading", "blur", 8, 0, 0.1, 0.8),
        a("text", "opacity", 0, 1, 0.3, 0.7),
        a("text", "y", 20, 0, 0.3, 0.7),
        a("button", "opacity", 0, 1, 0.5, 0.5),
        a("button", "scale", 0.9, 1, 0.5, 0.5, { ease: "spring", bounce: 0.35 }),
        a("button2", "opacity", 0, 1, 0.6, 0.5),
        a("button2", "scale", 0.9, 1, 0.6, 0.5, { ease: "spring", bounce: 0.35 }),
        a("visual", "opacity", 0, 1, 0.7, 0.9),
        a("visual", "y", 40, 0, 0.7, 0.9),
        a("visual", "scale", 0.96, 1, 0.7, 0.9),
      ],
    },
  },
  {
    id: "t-hero-hold",
    name: "Hero: in, hold, out",
    tags: ["hero"],
    state: {
      scene: { type: "hero" },
      trigger: "load",
      actions: [
        a("heading", "opacity", 0, 1, 0, 0.7),
        a("heading", "y", 28, 0, 0, 0.7),
        a("text", "opacity", 0, 1, 0.25, 0.6),
        a("text", "y", 20, 0, 0.25, 0.6),
        a("heading", "opacity", 1, 0, 2.6, 0.5),
        a("heading", "y", 0, -16, 2.6, 0.5),
        a("text", "opacity", 1, 0, 2.7, 0.5),
        a("text", "y", 0, -12, 2.7, 0.5),
      ],
    },
  },
  {
    id: "t-cards",
    name: "Cards cascade",
    tags: ["cards"],
    state: {
      scene: { type: "cards" },
      trigger: "inView",
      actions: [
        a("heading", "opacity", 0, 1, 0, 0.6),
        a("heading", "y", 16, 0, 0, 0.6),
        a("card", "opacity", 0, 1, 0.2, 0.6, { stagger: 0.1 }),
        a("card", "y", 32, 0, 0.2, 0.6, { stagger: 0.1 }),
        a("card", "scale", 0.95, 1, 0.2, 0.6, { stagger: 0.1 }),
      ],
    },
  },
  {
    id: "t-nav",
    name: "Nav slide in",
    tags: ["nav"],
    state: {
      scene: { type: "nav" },
      trigger: "load",
      actions: [
        a("logo", "opacity", 0, 1, 0, 0.5),
        a("logo", "x", -16, 0, 0, 0.5),
        a("link", "opacity", 0, 1, 0.15, 0.4, { stagger: 0.07 }),
        a("link", "y", -10, 0, 0.15, 0.4, { stagger: 0.07 }),
        a("cta", "opacity", 0, 1, 0.5, 0.4),
        a("cta", "scale", 0.85, 1, 0.5, 0.5, { ease: "spring", bounce: 0.4 }),
      ],
    },
  },
  {
    id: "t-hero-toggle",
    name: "Hero: toggle on click",
    tags: ["hero"],
    state: {
      scene: { type: "hero" },
      trigger: "toggle",
      actions: [
        a("heading", "opacity", 0, 1, 0, 0.6),
        a("heading", "x", -24, 0, 0, 0.6),
        a("text", "opacity", 0, 1, 0.15, 0.6),
        a("text", "x", -24, 0, 0.15, 0.6),
        a("button", "opacity", 0, 1, 0.3, 0.4),
        a("button2", "opacity", 0, 1, 0.38, 0.4),
        a("visual", "opacity", 0, 1, 0.45, 0.7),
        a("visual", "scale", 0.9, 1, 0.45, 0.7, { ease: "spring", bounce: 0.3 }),
      ],
    },
  },
  {
    id: "t-scroll",
    name: "Hero scrubbed by scroll",
    tags: ["hero", "scroll"],
    state: {
      scene: { type: "hero" },
      trigger: "scroll",
      actions: [
        a("visual", "scale", 0.8, 1.05, 0, 1, { ease: "linear" }),
        a("visual", "rotate", -4, 0, 0, 1, { ease: "linear" }),
        a("heading", "letterSpacing", -2, 2, 0, 1, { ease: "linear" }),
        a("text", "opacity", 0.2, 1, 0.2, 0.8, { ease: "linear" }),
      ],
    },
  },
];

export function findTimelinePreset(id) {
  return TIMELINE_PRESETS.find((p) => p.id === id);
}
