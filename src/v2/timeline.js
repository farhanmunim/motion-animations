/**
 * The single timeline editor: one row per element and property, actions as
 * draggable blocks, a scrubbable playhead, and zoom.
 */
import { h } from "../ui.js";
import { PROPS, PROP_GROUPS, propLabel } from "../props.js";
import { buildRows, totalDuration } from "./compile.js";
import { makeAction } from "./state.js";

const SNAP = 0.05;
const snap = (t) => Math.max(0, Math.round(t / SNAP) * SNAP);
const fmt = (t) => `${(Math.round(t * 100) / 100).toFixed(2)}s`;
const LEFT_W = 190;

const ICON_PLAY = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>`;
const ICON_PAUSE = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>`;
const ICON_REPLAY = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>`;

/** A sensible default target value for a new action on a property. */
function defaultTo(prop) {
  const d = PROPS[prop];
  if (!d) return 0;
  if (d.kind === "color") return "#ec4899";
  return { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0, rotateX: 0, rotateY: 0, skewX: 0, skewY: 0, opacity: 1, borderRadius: 24, blur: 0, shadow: 0, width: 160, height: 160, letterSpacing: 0 }[prop] ?? d.def;
}
function defaultFrom(prop) {
  const d = PROPS[prop];
  if (!d) return 0;
  if (d.kind === "color") return d.def;
  return { x: -24, y: 24, scale: 0.9, scaleX: 0.9, scaleY: 0.9, rotate: -8, rotateX: -45, rotateY: -45, skewX: 10, skewY: 10, opacity: 0, borderRadius: 0, blur: 8, shadow: 0, width: 120, height: 120, letterSpacing: -2 }[prop] ?? d.def;
}

export function createTimeline(container, store, { onSeek }) {
  let player = null;
  let elements = [];
  let playhead, ruler, lanesEl, timeEl, playBtn, body, left, right;
  let lastTime = 0;

  container.classList.add("tl");
  const render = () => {
    const state = store.get();
    const zoom = state.zoom || 140;
    const total = Math.max(totalDuration(state) + 0.6, 2);
    const width = Math.ceil(total * zoom) + 40;
    container.innerHTML = "";

    // --- header ---
    playBtn = h("button", { class: "btn tiny icon-btn", type: "button", "aria-label": "Play / pause", onClick: () => (player?.playing() ? player.pause() : player?.play()) }, h("span", { html: ICON_PLAY }));
    timeEl = h("span", { class: "tl-time" }, `${fmt(0)} / ${fmt(totalDuration(state))}`);
    const addSel = h("select", { class: "tl-add", "aria-label": "Add an action" }, h("option", { value: "" }, "+ Add action…"));
    for (const el of elements) {
      const og = h("optgroup", { label: el.label });
      for (const group of PROP_GROUPS) for (const [key, def] of Object.entries(PROPS)) if (def.group === group) og.append(h("option", { value: `${el.id}|${key}` }, def.label));
      addSel.append(og);
    }
    addSel.addEventListener("change", () => {
      if (!addSel.value) return;
      const [el, prop] = addSel.value.split("|");
      addAction(el, prop);
      addSel.value = "";
    });
    const zoomIn = h("input", { type: "range", min: 60, max: 400, step: 10, value: zoom, class: "tl-zoom", "aria-label": "Timeline zoom", onInput: (e) => store.patch({ zoom: Number(e.target.value) }, { rerender: false, timelineOnly: true }) });
    container.append(
      h(
        "div",
        { class: "tl-head" },
        h("div", { class: "tl-transport" }, playBtn, h("button", { class: "btn tiny icon-btn", type: "button", "aria-label": "Replay", onClick: () => player?.replay() }, h("span", { html: ICON_REPLAY })), timeEl),
        h("div", { class: "tl-tools" }, addSel, h("label", { class: "tl-zoom-wrap" }, h("span", {}, "Zoom"), zoomIn)),
      ),
    );

    // --- body ---
    left = h("div", { class: "tl-left" }, h("div", { class: "tl-corner" }, "Element · property"));
    right = h("div", { class: "tl-right" });
    body = h("div", { class: "tl-body" }, left, right);
    container.append(body);

    ruler = h("div", { class: "tl-ruler", style: `width:${width}px` });
    for (let t = 0; t <= total + 0.001; t += 0.5) {
      ruler.append(h("span", { class: `tl-tick ${Number.isInteger(t) ? "major" : ""}`, style: `left:${t * zoom}px` }, Number.isInteger(t) ? `${t}s` : ""));
    }
    ruler.addEventListener("pointerdown", (e) => {
      const seekTo = (ev) => {
        const rect = ruler.getBoundingClientRect();
        const t = Math.max(0, (ev.clientX - rect.left) / zoom);
        player?.seek(t);
        onSeek?.(t);
        setPlayhead(t);
      };
      seekTo(e);
      ruler.setPointerCapture(e.pointerId);
      const move = (ev) => seekTo(ev);
      const up = () => {
        ruler.removeEventListener("pointermove", move);
        ruler.removeEventListener("pointerup", up);
      };
      ruler.addEventListener("pointermove", move);
      ruler.addEventListener("pointerup", up);
    });
    lanesEl = h("div", { class: "tl-lanes", style: `width:${width}px` });
    playhead = h("div", { class: "tl-playhead", style: `left:0px` });
    right.append(ruler, lanesEl, playhead);

    const rows = buildRows(state, elements);
    if (!rows.some((r) => r.props.length)) {
      left.append(h("p", { class: "hint tl-empty" }, "No actions yet. Use “Add action”, or click an element in the preview and add a property."));
    }
    for (const row of rows) {
      const selectedEl = state.actions.find((a) => a.id === state.selected)?.el;
      const head = h(
        "div",
        { class: `tl-el ${row.el.id === selectedEl ? "active" : ""}` },
        h("span", { class: "tl-el-name" }, row.el.label),
        h("button", { class: "btn tiny icon-btn tl-el-add", type: "button", title: `Add an action to ${row.el.label}`, "aria-label": `Add action to ${row.el.label}`, onClick: (e) => quickAdd(e.currentTarget, row.el.id) }, "+"),
      );
      left.append(head);
      lanesEl.append(h("div", { class: "tl-lane tl-lane-el" }));
      for (const p of row.props) {
        left.append(h("div", { class: "tl-row" }, h("span", { class: "tl-row-name" }, propLabel(p.prop))));
        const lane = h("div", { class: "tl-lane", "data-el": row.el.id, "data-prop": p.prop });
        lane.addEventListener("dblclick", (e) => {
          if (e.target !== lane) return;
          const t = snap((e.clientX - lane.getBoundingClientRect().left) / zoom);
          const prev = [...p.actions].reverse().find((a) => a.at <= t);
          store.addAction(makeAction({ el: row.el.id, prop: p.prop, from: prev ? prev.to : defaultFrom(p.prop), to: prev ? defaultFrom(p.prop) : defaultTo(p.prop), at: t, duration: 0.5 }), { rerender: true });
        });
        for (const a of p.actions) lane.append(block(a, zoom, state.selected === a.id));
        lanesEl.append(lane);
      }
    }
    setPlayhead(lastTime);
    // Keep the two columns scrolled together.
    right.addEventListener("scroll", () => (left.scrollTop = right.scrollTop));
  };

  function block(a, zoom, selected) {
    const el = h(
      "div",
      { class: `tl-block ${selected ? "selected" : ""} ${a.ease === "spring" ? "spring" : ""}`, style: `left:${a.at * zoom}px;width:${Math.max(8, a.duration * zoom)}px`, title: `${propLabel(a.prop)}: ${a.from} → ${a.to}\nStarts ${fmt(a.at)}, lasts ${fmt(a.duration)}`, tabindex: 0, role: "button", "aria-label": `${propLabel(a.prop)} ${a.from} to ${a.to}, starts at ${fmt(a.at)}` },
      h("span", { class: "tl-block-label" }, `${a.from} → ${a.to}`),
      h("span", { class: "tl-handle", "aria-hidden": "true" }),
    );
    el.addEventListener("keydown", (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        store.removeAction(a.id, { rerender: true });
      }
    });
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      el.focus();
      const resizing = e.target.classList.contains("tl-handle");
      const startX = e.clientX;
      const startAt = a.at;
      const startDur = a.duration;
      let at = startAt;
      let dur = startDur;
      let moved = false;
      el.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const dx = (ev.clientX - startX) / zoom;
        if (Math.abs(ev.clientX - startX) > 2) moved = true;
        if (resizing) {
          dur = Math.max(SNAP, snap(startDur + dx));
          el.style.width = `${Math.max(8, dur * zoom)}px`;
        } else {
          at = snap(startAt + dx);
          el.style.left = `${at * zoom}px`;
        }
        el.title = `Starts ${fmt(at)}, lasts ${fmt(dur)}`;
      };
      const up = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        if (moved) store.updateAction(a.id, { at, duration: dur }, { rerender: true });
        store.patch({ selected: a.id }, { rerender: true });
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
    });
    return el;
  }

  /** "+" on an element row: a small property picker. */
  function quickAdd(button, elId) {
    const existing = button.parentElement.querySelector("select");
    if (existing) return existing.remove();
    const sel = h("select", { class: "tl-quick", "aria-label": "Property to add" }, h("option", { value: "" }, "Property…"));
    for (const group of PROP_GROUPS) {
      const og = h("optgroup", { label: group });
      for (const [key, def] of Object.entries(PROPS)) if (def.group === group) og.append(h("option", { value: key }, def.label));
      sel.append(og);
    }
    sel.addEventListener("change", () => {
      if (sel.value) addAction(elId, sel.value);
      sel.remove();
    });
    sel.addEventListener("blur", () => setTimeout(() => sel.remove(), 150));
    button.parentElement.append(sel);
    sel.focus();
  }

  function addAction(elId, prop) {
    const state = store.get();
    const onEl = state.actions.filter((a) => a.el === elId);
    // Default: start when this element's last action starts (parallel), or after the previous element.
    let at = 0;
    if (onEl.length) at = Math.max(...onEl.map((a) => a.at));
    else if (state.actions.length) {
      const idx = elements.findIndex((e) => e.id === elId);
      const prevEls = elements.slice(0, idx).map((e) => e.id);
      const prevActions = state.actions.filter((a) => prevEls.includes(a.el));
      at = prevActions.length ? snap(Math.max(...prevActions.map((a) => a.at)) + 0.15) : 0;
    }
    store.addAction(makeAction({ el: elId, prop, from: defaultFrom(prop), to: defaultTo(prop), at, duration: 0.6 }), { rerender: true });
  }

  function setPlayhead(t) {
    lastTime = t;
    const zoom = store.get().zoom || 140;
    if (playhead) playhead.style.left = `${t * zoom}px`;
    if (timeEl) timeEl.textContent = `${fmt(t)} / ${fmt(totalDuration(store.get()))}`;
  }

  return {
    render(els) {
      elements = els;
      render();
    },
    setPlayer(p) {
      player = p;
    },
    tick(t, playing) {
      setPlayhead(t);
      if (playBtn) playBtn.firstElementChild.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    },
  };
}
