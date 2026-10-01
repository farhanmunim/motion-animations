/**
 * Timeline mode store. Separate from Quick mode so the two never interfere.
 */
import { merge, clone } from "../state.js";

export const DEFAULT_T = {
  name: "Hero reveal",
  presetId: "t-hero",
  scene: { type: "hero", accent: "#7c3aed", customHtml: '<h2 class="title">Your heading</h2>\n<p class="copy">Some supporting copy goes here.</p>\n<button class="cta">Call to action</button>' },
  trigger: "load", // load | toggle | inView | scroll
  inView: { amount: 0.4, once: true },
  scroll: { offsetStart: "start end", offsetEnd: "end start" },
  toggle: { autoClose: 0 },
  repeat: { infinite: false, count: 0, type: "loop", delay: 0 },
  zoom: 140, // pixels per second on the timeline
  actions: [],
  selected: null, // action id
};

let nextId = 1;
export function uid() {
  return `a${Date.now().toString(36)}${(nextId++).toString(36)}`;
}

/** Create an action with sensible defaults. */
export function makeAction(partial) {
  return { id: uid(), el: "heading", prop: "opacity", from: 0, to: 1, at: 0, duration: 0.8, ease: "smooth", stagger: 0.06, ...partial };
}

const STORAGE_KEY = "motion-studio:timeline";

function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decode(str) {
  try {
    const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  } catch {
    return null;
  }
}

export function createTimelineStore(initialPreset) {
  let state = null;
  const hash = location.hash.replace(/^#/, "");
  if (hash.startsWith("t=")) {
    const s = decode(hash.slice(2));
    if (s) state = merge(clone(DEFAULT_T), s);
  }
  if (!state) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = merge(clone(DEFAULT_T), JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }
  if (!state) state = merge(clone(DEFAULT_T), initialPreset || {});

  const listeners = new Set();
  const history = [];
  const emit = (meta) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    for (const fn of listeners) fn(state, meta);
  };

  return {
    get: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    patch(patch, meta = {}) {
      history.push(state);
      if (history.length > 60) history.shift();
      state = merge(state, patch);
      emit(meta);
    },
    replace(next, meta = {}) {
      history.push(state);
      state = merge(clone(DEFAULT_T), next);
      emit(meta);
    },
    /** Update one action by id. */
    updateAction(id, patch, meta = {}) {
      const actions = state.actions.map((a) => (a.id === id ? { ...a, ...patch } : a));
      this.patch({ actions }, meta);
    },
    addAction(action, meta = {}) {
      this.patch({ actions: [...state.actions, action], selected: action.id }, meta);
    },
    removeAction(id, meta = {}) {
      this.patch({ actions: state.actions.filter((a) => a.id !== id), selected: state.selected === id ? null : state.selected }, meta);
    },
    undo() {
      const prev = history.pop();
      if (prev) {
        state = prev;
        emit({ reason: "undo", rerender: true });
      }
    },
    shareUrl() {
      const { selected, ...rest } = state;
      const url = new URL(location.href);
      url.hash = "t=" + encode(rest);
      return url.toString();
    },
  };
}
