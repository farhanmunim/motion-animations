/**
 * Turns the editor state into the raw pieces motion.dev needs. Both the live
 * preview and the code exporter use these so what you see is what you export.
 */
import { motionKey, toMotionValue, resolveEase } from "./props.js";
import { getComponent, isComponent } from "./components.js";

/** Tracks that belong to a part (undefined part = the element itself). */
function tracksFor(state, part) {
  return state.tracks.filter((t) => (t.part || null) === (part || null));
}

/** `{ opacity: [0, 1], y: [40, 0], filter: ["blur(16px)", "blur(0px)"] }` */
export function buildKeyframes(state, part) {
  const kf = {};
  for (const t of tracksFor(state, part)) {
    if (!t.values || t.values.length < 2) continue;
    kf[motionKey(t.prop)] = t.values.map((v) => toMotionValue(t.prop, v));
  }
  return kf;
}

/** Values at the first keyframe, used to reset / revert / "closed". */
export function buildFromValues(state, part) {
  const out = {};
  for (const t of tracksFor(state, part)) {
    if (!t.values?.length) continue;
    out[motionKey(t.prop)] = toMotionValue(t.prop, t.values[0]);
  }
  return out;
}

/** Values at the last keyframe ("open"). Multi-step tracks keep the array. */
export function buildOpenValues(state, part) {
  const out = {};
  for (const t of tracksFor(state, part)) {
    if (!t.values?.length) continue;
    const vals = t.values.map((v) => toMotionValue(t.prop, v));
    out[motionKey(t.prop)] = vals.length > 2 ? vals : vals[vals.length - 1];
  }
  return out;
}

/** Evenly spaced keyframe positions: [0, 0.5, 1] for three keyframes. */
export function evenTimes(n) {
  if (n < 2) return [0];
  return Array.from({ length: n }, (_, i) => Math.round((i / (n - 1)) * 1000) / 1000);
}

/** Keyframe positions for a track (fractions of the duration), always valid. */
export function trackTimes(track) {
  const n = track.values?.length || 0;
  if (!track.times || track.times.length !== n) return evenTimes(n);
  return track.times;
}

/** True when a track's keyframes are not evenly spaced. */
export function hasCustomTimes(track) {
  const even = evenTimes(track.values?.length || 0);
  return trackTimes(track).some((t, i) => Math.abs(t - even[i]) > 0.0005);
}

/** `{ opacity: [0, 0.1, 0.85, 1] }` for tracks with custom keyframe positions. */
export function buildTimes(state, part) {
  const out = {};
  if (effectiveTrigger(state) === "step") return out; // each step goes to a single value
  if (state.transition.type === "spring" && effectiveTrigger(state) !== "scroll") return out;
  for (const t of tracksFor(state, part)) {
    if (t.values?.length > 2 && hasCustomTimes(t)) out[motionKey(t.prop)] = trackTimes(t);
  }
  return out;
}

/* --- Text scramble --------------------------------------------------------- */

export const SCRAMBLE_TRIGGERS = ["load", "hover", "toggle", "inView"];
export const SCRAMBLE_SETS = {
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  symbols: "!<>-_\\/[]{}=+*^?#%&",
  binary: "01",
};
export const scrambleChars = (state) => SCRAMBLE_SETS[state.scramble?.chars] || SCRAMBLE_SETS.letters;

/** The position at which each letter settles: 0 settles first. */
export function scrambleRank(count, order) {
  const indexes = Array.from({ length: count }, (_, i) => i);
  if (order === "center") indexes.sort((a, b) => Math.abs(a - (count - 1) / 2) - Math.abs(b - (count - 1) / 2) || a - b);
  if (order === "random") indexes.sort(() => Math.random() - 0.5);
  const rank = [];
  indexes.forEach((letter, position) => (rank[letter] = position));
  return rank;
}

/** One frame of the effect: letters settle left to right, the rest keep shuffling. */
export function scrambleFrame(text, progress, chars) {
  const settled = Math.floor(progress * text.length);
  return [...text].map((c, i) => (i < settled || c === " " ? c : chars[Math.floor(Math.random() * chars.length)])).join("");
}

/** True when the animation targets several elements (list items, words, letters...). */
export function isMulti(state) {
  const el = state.element;
  if (el.type === "list" || el.type === "grid") return true;
  if (el.type === "text" && el.split && el.split !== "none") return true;
  if (el.type === "custom" && el.animateChildren) return true;
  return false;
}

/**
 * The animation plan: one entry per animated thing.
 *  - a plain element: a single entry
 *  - a component: one entry per part that has tracks
 */
export function buildPlan(state) {
  if (isComponent(state.element.type)) {
    const comp = getComponent(state.element.type);
    return comp.parts
      .filter((p) => tracksFor(state, p.key).length)
      .map((p) => ({
        part: p.key,
        label: p.label,
        selector: p.selector,
        multi: !!p.multi,
        keyframes: buildKeyframes(state, p.key),
        from: buildFromValues(state, p.key),
        open: buildOpenValues(state, p.key),
        states: buildStates(state, p.key),
      }));
  }
  return [
    {
      part: null,
      label: null,
      selector: null,
      multi: isMulti(state),
      keyframes: buildKeyframes(state),
      from: buildFromValues(state),
      open: buildOpenValues(state),
      states: buildStates(state, null),
    },
  ];
}

/* --- Steps ------------------------------------------------------------------ */

/** How many states a stepped animation has: the longest list of keyframes. */
export function stepCount(state) {
  return Math.max(2, ...state.tracks.map((t) => t.values?.length || 0));
}

/** One object per step: the value of every property of a part at that keyframe. */
function buildStates(state, part) {
  return Array.from({ length: stepCount(state) }, (_, i) => {
    const o = {};
    for (const t of tracksFor(state, part)) {
      if (!t.values?.length) continue;
      o[motionKey(t.prop)] = toMotionValue(t.prop, t.values[Math.min(i, t.values.length - 1)]);
    }
    return o;
  });
}

/** True when a stagger setting would have any effect. */
export function staggerApplies(state) {
  return buildPlan(state).some((e) => e.multi);
}

/** Components cannot be scroll-linked; everything else passes through. */
export function effectiveTrigger(state) {
  if (isComponent(state.element.type)) {
    const allowed = getComponent(state.element.type).triggers;
    return allowed.includes(state.trigger) ? state.trigger : allowed[0];
  }
  if (state.element.type === "scramble") return SCRAMBLE_TRIGGERS.includes(state.trigger) ? state.trigger : "load";
  // Following the pointer needs one target; groups of items fall back to hover.
  if (state.trigger === "pointer" && isMulti(state)) return "hover";
  return state.trigger;
}

/* --- Follow pointer ------------------------------------------------------ */

/**
 * Which pointer axis drives a property when none was chosen:
 *   x      pointer position, left (-1) to right (+1)
 *   y      pointer position, top (-1) to bottom (+1)
 *   enter  0 while the pointer is outside, 1 while it is over the element
 */
export function defaultAxis(prop) {
  if (["x", "xPercent", "rotateY", "skewX"].includes(prop)) return "x";
  if (["y", "yPercent", "rotateX", "skewY"].includes(prop)) return "y";
  if (prop === "clipRight") return "x";
  return "enter";
}

/**
 * Per part: `{ prop: { axis, range: [atMin, atMax] } }`. The first and last
 * value of each track are used; anything in between is ignored.
 */
export function buildFollow(state) {
  const entries = isComponent(state.element.type)
    ? getComponent(state.element.type).parts.map((p) => ({ part: p.key, selector: p.selector }))
    : [{ part: null, selector: null }];
  return entries
    .map((e) => {
      const props = {};
      for (const t of tracksFor(state, e.part)) {
        if (!t.values || t.values.length < 2) continue;
        props[motionKey(t.prop)] = {
          axis: t.axis || defaultAxis(t.prop),
          range: [toMotionValue(t.prop, t.values[0]), toMotionValue(t.prop, t.values[t.values.length - 1])],
        };
      }
      return { ...e, props };
    })
    .filter((e) => Object.keys(e.props).length);
}

/** True when any track needs 3D (perspective, and preserve-3d for child layers). */
export function needs3d(state) {
  return state.tracks.some((t) => ["rotateX", "rotateY", "z"].includes(t.prop));
}

/** Spring options from the transition settings. */
export function springOptions(t) {
  const o = { type: "spring" };
  if (t.springMode === "visual") {
    o.visualDuration = num(t.visualDuration);
    o.bounce = num(t.bounce);
  } else {
    o.stiffness = num(t.stiffness);
    o.damping = num(t.damping);
    if (num(t.mass) !== 1) o.mass = num(t.mass);
  }
  return o;
}

/** Marker for raw JS code inside serialized objects (e.g. stagger(...)). */
export class Raw {
  constructor(code) {
    this.code = code;
  }
}

/**
 * Build the transition options object. `mode` is "js" (real values for the
 * preview) or "code" (values ready to be serialized into source code).
 * `multi` says whether the stagger applies to this target.
 */
export function buildTransition(state, { mode = "js", staggerFn = null, multi = isMulti(state), part = null } = {}) {
  const t = state.transition;
  const opts = {};

  // Following the pointer is always a spring: it smooths the chase.
  if (effectiveTrigger(state) === "pointer") return springOptions(t);

  // Per-property keyframe positions (motion reads options[propertyName]).
  const timing = buildTimes(state, part);
  // `inherit: true` keeps duration / easing from the main transition.
  const withTiming = (o) => {
    for (const [key, times] of Object.entries(timing)) o[key] = { inherit: true, times };
    return o;
  };

  if (effectiveTrigger(state) === "scroll") {
    // Scroll-linked animations are scrubbed, so only easing matters.
    opts.ease = resolveEase(t);
    return withTiming(opts);
  }

  if (t.type === "spring") {
    opts.type = "spring";
    if (t.springMode === "visual") {
      opts.visualDuration = num(t.visualDuration);
      opts.bounce = num(t.bounce);
    } else {
      opts.stiffness = num(t.stiffness);
      opts.damping = num(t.damping);
      if (num(t.mass) !== 1) opts.mass = num(t.mass);
    }
  } else {
    opts.duration = num(t.duration);
    opts.ease = resolveEase(t);
  }

  const delay = num(t.delay);
  if (state.stagger.enabled && multi) {
    if (mode === "js" && staggerFn) {
      opts.delay = staggerFn(num(state.stagger.each), {
        startDelay: delay,
        from: state.stagger.from,
      });
    } else {
      opts.delay = new Raw(staggerCode(state));
    }
  } else if (delay) {
    opts.delay = delay;
  }

  if (t.infinite || num(t.repeat) > 0) {
    opts.repeat = t.infinite ? Infinity : num(t.repeat);
    if (t.repeatType !== "loop") opts.repeatType = t.repeatType;
    if (num(t.repeatDelay) > 0) opts.repeatDelay = num(t.repeatDelay);
  }

  return withTiming(opts);
}

/** Seconds before a click-opened animation closes itself (0 = never). */
export function autoCloseSeconds(state) {
  const n = Number(state.toggle?.autoClose);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** `stagger(0.08, { startDelay: 0.2, from: "center" })` as source code. */
export function staggerCode(state) {
  const delay = num(state.transition.delay);
  const extra = [];
  if (delay) extra.push(`startDelay: ${delay}`);
  if (state.stagger.from !== "first") extra.push(`from: "${state.stagger.from}"`);
  return `stagger(${num(state.stagger.each)}${extra.length ? `, { ${extra.join(", ")} }` : ""})`;
}

/** Selector used in exported code. */
export function targetSelector(state) {
  return isMulti(state) ? ".motion-item" : ".motion-target";
}

export function scrollOffset(state) {
  return [state.scroll.offsetStart, state.scroll.offsetEnd];
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
