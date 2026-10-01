/**
 * Timeline-mode inspector and library.
 */
import { h, numberField, selectField, colorField, textField, toggleField, segmented, section } from "../ui.js";
import { PROPS, PROP_GROUPS, EASINGS, propLabel } from "../props.js";
import { SCENES, sceneElements, isMultiElement, elementLabel } from "./scenes.js";
import { TIMELINE_PRESETS } from "./presets.js";
import { DEFAULT_T, makeAction } from "./state.js";
import { merge, clone } from "../state.js";

const TRIGGERS = [
  { value: "load", label: "On load", hint: "Plays as soon as the page loads." },
  { value: "toggle", label: "On click", hint: "Click the scene to play, click again to play backwards." },
  { value: "inView", label: "When scrolled into view", hint: "Plays once the scene enters the viewport." },
  { value: "scroll", label: "Linked to scroll", hint: "The whole timeline is scrubbed by scroll position." },
];

export function isTimelineDirty(state) {
  const preset = TIMELINE_PRESETS.find((p) => p.id === state.presetId);
  if (!preset) return false;
  const expected = merge(clone(DEFAULT_T), { ...preset.state, name: preset.name, presetId: preset.id });
  const pick = (s) => JSON.stringify([s.scene.type, s.scene.accent, s.trigger, s.actions.map(({ id, ...a }) => a), s.repeat]);
  return pick(expected) !== pick(state);
}

export function renderTimelineLibrary(container, store, { onToast }) {
  container.innerHTML = "";
  const state = store.get();
  const dirty = isTimelineDirty(state);
  container.append(h("p", { class: "hint tl-lib-hint" }, "Sequences: several elements on one timeline. Pick one, then drag the blocks."));
  const list = h("div", { class: "library-group" });
  for (const p of TIMELINE_PRESETS) {
    const active = p.id === state.presetId;
    const card = h(
      "div",
      { class: `preset-card ${active ? "active" : ""}` },
      h("div", { class: "thumb", html: `<span class="th-list">${"<i></i>".repeat(3)}</span>` }),
      h(
        "div",
        { class: "preset-meta" },
        h("button", { type: "button", class: "preset-name", "aria-label": `Edit ${p.name}`, onClick: (e) => { e.stopPropagation(); load(p); } }, p.name),
        active && dirty ? h("span", { class: "badge" }, "edited") : null,
      ),
    );
    card.addEventListener("click", () => load(p));
    list.append(card);
  }
  const load = (p) => {
    store.replace({ ...clone(p.state), name: p.name, presetId: p.id }, { rerender: true });
    onToast?.(`Editing “${p.name}”`);
  };
  container.append(list);
}

export function renderTimelineDesign(container, store, { onToast }) {
  const state = store.get();
  const set = (patch, rerender = false) => store.patch(patch, { rerender });
  container.innerHTML = "";

  // header
  const preset = TIMELINE_PRESETS.find((p) => p.id === state.presetId);
  const dirty = isTimelineDirty(state);
  container.append(
    h(
      "div",
      { class: "design-head" },
      h("input", { type: "text", class: "design-name", value: state.name, "aria-label": "Animation name", onInput: (e) => set({ name: e.target.value }) }),
      preset
        ? h("p", { class: "hint origin" }, dirty ? `Edited copy of “${preset.name}”. ` : `Unchanged from “${preset.name}”. `, dirty ? h("button", { type: "button", class: "link", onClick: () => store.replace({ ...clone(preset.state), name: preset.name, presetId: preset.id }, { rerender: true }) }, "Revert to preset") : null)
        : h("p", { class: "hint origin" }, "Pick a sequence on the left, or build one from scratch."),
    ),
  );

  // selected action
  const selected = state.actions.find((a) => a.id === state.selected);
  if (selected) container.append(renderActionSection(selected, state, store, set));
  else container.append(section("Selected action", "Click a block on the timeline to edit it here. Double-click an empty row to add one.", h("p", { class: "hint" }, "Tip: drag a block to change when it starts, drag its right edge to change how long it takes.")));

  // scene
  const sceneKids = [
    selectField({
      label: "Scene",
      value: state.scene.type,
      options: Object.entries(SCENES).map(([value, s]) => ({ value, label: s.label })),
      onChange: (v) => {
        const patch = { scene: { type: v } };
        // Actions pointing at elements that no longer exist are dropped.
        const ids = sceneElements({ ...state.scene, type: v }).map((e) => e.id);
        patch.actions = state.actions.filter((a) => ids.includes(a.el));
        patch.selected = null;
        set(patch, true);
      },
    }),
    colorField({ label: "Accent", value: state.scene.accent, onInput: (v) => set({ scene: { accent: v } }) }),
  ];
  if (state.scene.type === "custom") {
    sceneKids.push(
      textField({ label: "Your HTML (each top-level element becomes a target)", value: state.scene.customHtml, multiline: true, onInput: (v) => set({ scene: { customHtml: v } }) }),
      h("button", { type: "button", class: "btn tiny", onClick: () => set({ selected: null }, true) }, "Refresh elements"),
    );
  }
  container.append(section("Scene", "The elements you are choreographing. Click one in the preview to select it.", ...sceneKids));

  // trigger
  const trig = TRIGGERS.find((t) => t.value === state.trigger);
  const trigKids = [segmented({ label: "Trigger", value: state.trigger, options: TRIGGERS, onChange: (v) => set({ trigger: v }, true) }), h("p", { class: "hint" }, trig?.hint || "")];
  if (state.trigger === "toggle") trigKids.push(numberField({ label: "Close after", value: state.toggle.autoClose, min: 0, max: 15, step: 0.5, unit: "s", hint: "Play backwards automatically after this many seconds (0 = never).", onInput: (v) => set({ toggle: { autoClose: v } }) }));
  if (state.trigger === "inView") {
    trigKids.push(
      numberField({ label: "Visible amount", value: state.inView.amount, min: 0, max: 1, step: 0.05, onInput: (v) => set({ inView: { amount: v } }) }),
      toggleField({ label: "Play only once", value: state.inView.once, onChange: (v) => set({ inView: { once: v } }) }),
    );
  }
  if (state.trigger === "scroll") {
    const edges = [
      { value: "start end", label: "Scene top meets viewport bottom" },
      { value: "start center", label: "Scene top meets viewport center" },
      { value: "start start", label: "Scene top meets viewport top" },
      { value: "center center", label: "Scene center meets viewport center" },
      { value: "end end", label: "Scene bottom meets viewport bottom" },
      { value: "end start", label: "Scene bottom meets viewport top" },
    ];
    trigKids.push(
      selectField({ label: "Starts when", value: state.scroll.offsetStart, options: edges, onChange: (v) => set({ scroll: { offsetStart: v } }, true) }),
      selectField({ label: "Ends when", value: state.scroll.offsetEnd, options: edges, onChange: (v) => set({ scroll: { offsetEnd: v } }, true) }),
    );
  }
  container.append(section("Trigger", "When should the timeline play?", ...trigKids));

  // repeat
  if (state.trigger !== "scroll") {
    const r = state.repeat;
    const repKids = [toggleField({ label: "Repeat forever", value: r.infinite, onChange: (v) => set({ repeat: { infinite: v } }, true) })];
    if (!r.infinite) repKids.push(numberField({ label: "Repeat count", value: r.count, min: 0, max: 20, step: 1, onInput: (v) => set({ repeat: { count: v } }) }));
    if (r.infinite || r.count > 0) {
      repKids.push(
        selectField({ label: "Repeat style", value: r.type, options: [{ value: "loop", label: "Loop" }, { value: "reverse", label: "Reverse" }, { value: "mirror", label: "Mirror" }], onChange: (v) => set({ repeat: { type: v } }) }),
        numberField({ label: "Pause between", value: r.delay, min: 0, max: 5, step: 0.05, unit: "s", onInput: (v) => set({ repeat: { delay: v } }) }),
      );
    }
    container.append(section("Repeat", null, ...repKids));
  }
}

function renderActionSection(a, state, store, set) {
  const def = PROPS[a.prop] || { kind: "number", min: -100, max: 100, step: 1 };
  const upd = (patch, rerender = false) => store.updateAction(a.id, patch, { rerender });
  const elements = sceneElements(state.scene);
  const kids = [];
  kids.push(
    selectField({ label: "Element", value: a.el, options: elements.map((e) => ({ value: e.id, label: e.label })), onChange: (v) => upd({ el: v }, true) }),
    selectField({
      label: "Property",
      value: a.prop,
      options: Object.entries(PROPS).map(([value, d]) => ({ value, label: d.label, group: d.group })),
      onChange: (v) => {
        const d = PROPS[v];
        upd({ prop: v, from: d.kind === "color" ? d.def : d.def, to: d.kind === "color" ? "#ec4899" : d.def }, true);
      },
    }),
  );
  if (def.kind === "color") {
    kids.push(colorField({ label: "From", value: a.from, onInput: (v) => upd({ from: v }) }), colorField({ label: "To", value: a.to, onInput: (v) => upd({ to: v }) }));
  } else {
    kids.push(
      numberField({ label: "From", value: a.from, min: def.min, max: def.max, step: def.step, unit: def.unit, onInput: (v) => upd({ from: v }) }),
      numberField({ label: "To", value: a.to, min: def.min, max: def.max, step: def.step, unit: def.unit, onInput: (v) => upd({ to: v }) }),
    );
  }
  kids.push(
    numberField({ label: "Starts at", value: a.at, min: 0, max: 10, step: 0.05, unit: "s", onInput: (v) => upd({ at: v }, false) }),
    numberField({ label: "Duration", value: a.duration, min: 0.05, max: 5, step: 0.05, unit: "s", onInput: (v) => upd({ duration: v }, false) }),
    selectField({
      label: "Easing",
      value: a.ease,
      options: [{ value: "spring", label: "Spring (bouncy)" }, ...EASINGS.filter((e) => e.value !== "custom")],
      onChange: (v) => upd({ ease: v }, true),
    }),
  );
  if (a.ease === "spring") kids.push(numberField({ label: "Bounce", value: a.bounce ?? 0.3, min: 0, max: 1, step: 0.05, onInput: (v) => upd({ bounce: v }) }));
  if (isMultiElement(state.scene, a.el)) kids.push(numberField({ label: "Stagger", value: a.stagger, min: 0, max: 0.5, step: 0.01, unit: "s", hint: "Gap between each repeated element.", onInput: (v) => upd({ stagger: v }) }));
  kids.push(
    h(
      "div",
      { class: "tl-action-buttons" },
      h("button", { type: "button", class: "btn tiny", onClick: () => store.addAction({ ...makeAction({}), ...a, id: undefined, at: Math.round((a.at + a.duration) * 100) / 100 }, { rerender: true }) }, "Duplicate after"),
      h("button", { type: "button", class: "btn tiny ghost danger", onClick: () => store.removeAction(a.id, { rerender: true }) }, "Delete"),
    ),
  );
  return section(`${elementLabel(state.scene, a.el)} · ${propLabel(a.prop)}`, "The selected block.", ...kids);
}
