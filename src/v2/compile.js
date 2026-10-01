/**
 * Turns Timeline-mode state into a motion.dev animation sequence.
 *
 *   animate([
 *     ['[data-el="heading"]', { opacity: [0, 1], y: [24, 0] }, { at: 0, duration: 0.8, ease: [...] }],
 *     ['[data-el="text"]',    { opacity: [0, 1] },            { at: 0.3, duration: 0.6 }],
 *   ])
 *
 * Both the preview and the exporter use this.
 */
import { motionKey, toMotionValue, resolveEase } from "../props.js";
import { Raw } from "../compile.js";
import { elementSelector, isMultiElement } from "./scenes.js";

const round = (n) => Math.round(n * 1000) / 1000;

/** Options object for one action's transition. */
function actionOptions(action, state, { mode, staggerFn }) {
  const opts = { at: round(Number(action.at) || 0) };
  if (action.ease === "spring") {
    opts.type = "spring";
    opts.visualDuration = round(Number(action.duration) || 0.5);
    opts.bounce = round(Number(action.bounce ?? 0.3));
  } else {
    opts.duration = round(Number(action.duration) || 0.5);
    opts.ease = resolveEase({ ease: action.ease, bezier: action.bezier || [0.22, 1, 0.36, 1] });
  }
  if (isMultiElement(state.scene, action.el) && Number(action.stagger) > 0) {
    const each = round(Number(action.stagger));
    opts.delay = mode === "js" && staggerFn ? staggerFn(each) : new Raw(`stagger(${each})`);
  }
  return opts;
}

function sameOptions(a, b) {
  const strip = (o) => JSON.stringify(o, (k, v) => (v instanceof Raw ? v.code : typeof v === "function" ? "fn" : v));
  return strip(a) === strip(b);
}

/**
 * Build the sequence. Actions on the same element with identical timing
 * are merged into one step so the exported code stays short.
 */
export function buildSequence(state, { mode = "js", staggerFn = null } = {}) {
  const actions = [...state.actions].sort((a, b) => (a.at - b.at) || a.el.localeCompare(b.el));
  const steps = [];
  for (const action of actions) {
    const key = motionKey(action.prop);
    const values = [toMotionValue(action.prop, action.from), toMotionValue(action.prop, action.to)];
    const options = actionOptions(action, state, { mode, staggerFn });
    const selector = elementSelector(action.el);
    const last = steps[steps.length - 1];
    if (last && last.selector === selector && sameOptions(last.options, options) && !(key in last.keyframes)) {
      last.keyframes[key] = values;
    } else {
      steps.push({ selector, keyframes: { [key]: values }, options });
    }
  }
  return steps;
}

/** Values each element should start from (its earliest action per property). */
export function buildInitial(state) {
  const initial = {};
  const seen = new Set();
  for (const action of [...state.actions].sort((a, b) => a.at - b.at)) {
    const k = `${action.el}|${action.prop}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const sel = elementSelector(action.el);
    (initial[sel] ||= {})[motionKey(action.prop)] = toMotionValue(action.prop, action.from);
  }
  return initial;
}

/** Sequence-level options (repeat). */
export function buildSequenceOptions(state) {
  const r = state.repeat || {};
  const opts = {};
  if (r.infinite || Number(r.count) > 0) {
    opts.repeat = r.infinite ? Infinity : Number(r.count);
    if (r.type && r.type !== "loop") opts.repeatType = r.type;
    if (Number(r.delay) > 0) opts.repeatDelay = Number(r.delay);
  }
  return opts;
}

/** Total length in seconds. */
export function totalDuration(state) {
  let end = 0;
  for (const a of state.actions) {
    const stag = isMultiElement(state.scene, a.el) ? Number(a.stagger) * 4 : 0;
    end = Math.max(end, (Number(a.at) || 0) + (Number(a.duration) || 0) + stag);
  }
  return round(end);
}

/** Rows for the timeline: one per (element, property), in scene order. */
export function buildRows(state, elements) {
  const rows = [];
  for (const el of elements) {
    const props = [];
    for (const a of state.actions) {
      if (a.el === el.id && !props.includes(a.prop)) props.push(a.prop);
    }
    rows.push({ el, props: props.map((prop) => ({ prop, actions: state.actions.filter((a) => a.el === el.id && a.prop === prop).sort((a, b) => a.at - b.at) })) });
  }
  return rows;
}
