/**
 * A tiny store: holds the current animation design, notifies subscribers,
 * and persists to the URL hash (so designs are shareable) and localStorage
 * (so a refresh does not lose work).
 */

export const DEFAULT_STATE = {
  name: "Untitled animation",
  presetId: null,
  element: {
    type: "box",
    text: "Hello",
    color: "#7c3aed",
    textColor: "#ffffff",
    radius: 16,
    size: 120,
    count: 4,
    split: "none", // for text: "none" | "words" | "chars"
    animateChildren: false, // for custom HTML: animate each direct child
    customHtml: '<div style="padding:16px 24px;background:#111;color:#fff;border-radius:12px;font-weight:600">Custom</div>',
  },
  trigger: "load",
  tracks: [
    { prop: "opacity", values: [0, 1] },
    { prop: "y", values: [32, 0] },
    { prop: "blur", values: [6, 0] },
  ],
  transition: {
    type: "tween", // "tween" | "spring"
    duration: 0.9,
    delay: 0,
    ease: "smooth",
    bezier: [0.22, 1, 0.36, 1],
    springMode: "physics", // "physics" | "visual"
    stiffness: 200,
    damping: 20,
    mass: 1,
    visualDuration: 0.5,
    bounce: 0.3,
    repeat: 0,
    infinite: false,
    repeatType: "loop",
    repeatDelay: 0,
  },
  stagger: { enabled: false, each: 0.06, from: "first" },
  inView: { amount: 0.5, once: true },
  scroll: { offsetStart: "start end", offsetEnd: "end start" },
  hover: { revert: true },
  toggle: { autoClose: 0 }, // seconds; click-opened animations close again after this
};

const STORAGE_KEY = "motion-studio:design";

function isObj(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

/** Deep merge `patch` into `base`, returning a new object. Arrays replace. */
export function merge(base, patch) {
  if (!isObj(patch)) return patch === undefined ? base : patch;
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    out[k] = isObj(base?.[k]) && isObj(patch[k]) ? merge(base[k], patch[k]) : patch[k];
  }
  return out;
}

export function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

/* --- URL / storage encoding ------------------------------------------- */

function encode(state) {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(str) {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function loadInitial() {
  const hash = location.hash.replace(/^#/, "");
  if (hash.startsWith("d=")) {
    const s = decode(hash.slice(2));
    if (s) return merge(clone(DEFAULT_STATE), s);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return merge(clone(DEFAULT_STATE), JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return clone(DEFAULT_STATE);
}

/* --- Store -------------------------------------------------------------- */

export function createStore() {
  let state = loadInitial();
  const listeners = new Set();
  let history = [];

  function emit(meta) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    for (const fn of listeners) fn(state, meta);
  }

  return {
    get: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** Merge a partial patch into the state. */
    patch(patch, meta = {}) {
      history.push(state);
      if (history.length > 50) history.shift();
      state = merge(state, patch);
      emit(meta);
    },
    /** Replace state wholesale (used by presets and reset). */
    replace(next, meta = {}) {
      history.push(state);
      state = merge(clone(DEFAULT_STATE), next);
      emit(meta);
    },
    undo() {
      const prev = history.pop();
      if (prev) {
        state = prev;
        emit({ reason: "undo" });
      }
    },
    shareUrl() {
      const url = new URL(location.href);
      url.pathname = "/";
      url.hash = "d=" + encode(state);
      return url.toString();
    },
  };
}
