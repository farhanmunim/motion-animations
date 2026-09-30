/**
 * Turns the editor state into the raw pieces motion.dev needs. Both the live
 * preview and the code exporter use these so what you see is what you export.
 */
import { motionKey, toMotionValue } from "./props.js";

/** `{ opacity: [0, 1], y: [40, 0], filter: ["blur(16px)", "blur(0px)"] }` */
export function buildKeyframes(state) {
  const kf = {};
  for (const t of state.tracks) {
    if (!t.values || t.values.length < 2) continue;
    kf[motionKey(t.prop)] = t.values.map((v) => toMotionValue(t.prop, v));
  }
  return kf;
}

/** Values at the first keyframe, used to reset / revert. */
export function buildFromValues(state) {
  const out = {};
  for (const t of state.tracks) {
    if (!t.values?.length) continue;
    out[motionKey(t.prop)] = toMotionValue(t.prop, t.values[0]);
  }
  return out;
}

/** Values at the last keyframe. */
export function buildToValues(state) {
  const out = {};
  for (const t of state.tracks) {
    if (!t.values?.length) continue;
    out[motionKey(t.prop)] = toMotionValue(t.prop, t.values[t.values.length - 1]);
  }
  return out;
}

/** True when every track is a simple from → to pair. */
export function isSimpleFromTo(state) {
  return state.tracks.every((t) => t.values.length === 2);
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
 */
export function buildTransition(state, { mode = "js", staggerFn = null } = {}) {
  const t = state.transition;
  const opts = {};

  if (state.trigger === "scroll") {
    // Scroll-linked animations are scrubbed, so only easing matters.
    opts.ease = t.ease === "custom" ? t.bezier : t.ease;
    return opts;
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
    opts.ease = t.ease === "custom" ? t.bezier : t.ease;
  }

  const delay = num(t.delay);
  if (state.stagger.enabled && isMulti(state)) {
    if (mode === "js" && staggerFn) {
      opts.delay = staggerFn(num(state.stagger.each), {
        startDelay: delay,
        from: state.stagger.from,
      });
    } else {
      const extra = [];
      if (delay) extra.push(`startDelay: ${delay}`);
      if (state.stagger.from !== "first") extra.push(`from: "${state.stagger.from}"`);
      opts.delay = new Raw(`stagger(${num(state.stagger.each)}${extra.length ? `, { ${extra.join(", ")} }` : ""})`);
    }
  } else if (delay) {
    opts.delay = delay;
  }

  if (t.infinite || num(t.repeat) > 0) {
    opts.repeat = t.infinite ? Infinity : num(t.repeat);
    if (t.repeatType !== "loop") opts.repeatType = t.repeatType;
    if (num(t.repeatDelay) > 0) opts.repeatDelay = num(t.repeatDelay);
  }

  return opts;
}

/** True when the animation targets several elements (list items, words, letters...). */
export function isMulti(state) {
  const el = state.element;
  if (el.type === "list" || el.type === "grid") return true;
  if (el.type === "text" && el.split && el.split !== "none") return true;
  if (el.type === "custom" && el.animateChildren) return true;
  return false;
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
