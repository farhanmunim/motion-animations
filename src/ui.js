/**
 * All of the editor UI: the library sidebar, the Design inspector, and the
 * Code views. Plain DOM, no framework, so it stays tiny and hackable.
 */
import { animate } from "motion";
import { PROPS, PROP_GROUPS, EASINGS, TRIGGERS, ELEMENT_TYPES, TEXT_SPLITS, propLabel } from "./props.js";
import { PRESETS } from "./presets.js";
import { staggerApplies, buildKeyframes, buildPlan, effectiveTrigger } from "./compile.js";
import { generateAll } from "./codegen.js";
import { COMPONENTS, isComponent, partLabel } from "./components.js";
import { merge, clone, DEFAULT_STATE } from "./state.js";

/* --- Tiny DOM helper ------------------------------------------------------ */

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "value") el.value = v;
    else if (k === "checked") el.checked = !!v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/* --- Form controls -------------------------------------------------------- */

function fmt(n, step) {
  const d = step && step < 1 ? Math.min(3, String(step).split(".")[1]?.length || 0) : 0;
  return Number(n).toFixed(d);
}

/** Slider + numeric input pair. */
export function numberField({ label, value, min, max, step = 1, unit = "", hint, onInput }) {
  const range = h("input", { type: "range", min, max, step, value });
  const num = h("input", { type: "number", min, max, step, value: fmt(value, step), class: "num" });
  range.addEventListener("input", () => {
    num.value = fmt(range.value, step);
    onInput(Number(range.value));
  });
  num.addEventListener("input", () => {
    if (num.value === "" || Number.isNaN(Number(num.value))) return;
    range.value = num.value;
    onInput(Number(num.value));
  });
  return h(
    "label",
    { class: "field", title: hint || "" },
    h("span", { class: "field-label" }, label, unit ? h("em", {}, unit) : null),
    h("span", { class: "field-controls" }, range, num),
  );
}

export function selectField({ label, value, options, hint, onChange }) {
  const sel = h("select", { onChange: (e) => onChange(e.target.value) });
  const groups = [...new Set(options.map((o) => o.group).filter(Boolean))];
  const opt = (o) => h("option", { value: o.value, selected: o.value === value }, o.label);
  if (groups.length) {
    for (const g of groups) sel.append(h("optgroup", { label: g }, options.filter((o) => o.group === g).map(opt)));
    for (const o of options.filter((o) => !o.group)) sel.append(opt(o));
  } else {
    for (const o of options) sel.append(opt(o));
  }
  return h("label", { class: "field", title: hint || "" }, h("span", { class: "field-label" }, label), h("span", { class: "field-controls" }, sel));
}

export function textField({ label, value, placeholder, onInput, multiline = false }) {
  const input = multiline
    ? h("textarea", { rows: 4, placeholder: placeholder || "" })
    : h("input", { type: "text", placeholder: placeholder || "" });
  input.value = value ?? "";
  input.addEventListener("input", () => onInput(input.value));
  return h("label", { class: "field stacked" }, h("span", { class: "field-label" }, label), input);
}

export function colorField({ label, value, onInput }) {
  const color = h("input", { type: "color", value });
  const hex = h("input", { type: "text", class: "hex", value, maxlength: 7 });
  color.addEventListener("input", () => {
    hex.value = color.value;
    onInput(color.value);
  });
  hex.addEventListener("input", () => {
    if (/^#[0-9a-f]{6}$/i.test(hex.value)) {
      color.value = hex.value;
      onInput(hex.value);
    }
  });
  return h("label", { class: "field" }, h("span", { class: "field-label" }, label), h("span", { class: "field-controls color" }, color, hex));
}

export function toggleField({ label, value, hint, onChange }) {
  const input = h("input", { type: "checkbox", checked: value, onChange: (e) => onChange(e.target.checked) });
  return h("label", { class: "toggle", title: hint || "" }, input, h("span", {}, label));
}

/** A row of mutually exclusive buttons. */
export function segmented({ value, options, onChange, hints = {} }) {
  const wrap = h("div", { class: "segmented", role: "radiogroup" });
  for (const o of options) {
    const btn = h(
      "button",
      {
        type: "button",
        class: `seg ${o.value === value ? "active" : ""}`,
        role: "radio",
        "aria-checked": o.value === value ? "true" : "false",
        title: hints[o.value] || o.hint || "",
        onClick: () => {
          if (o.value === value) return;
          onChange(o.value);
        },
      },
      o.label,
    );
    wrap.append(btn);
  }
  return wrap;
}

export function section(title, subtitle, ...children) {
  return h(
    "section",
    { class: "inspector-section" },
    h("div", { class: "section-head" }, h("h3", {}, title), subtitle ? h("p", { class: "hint" }, subtitle) : null),
    ...children,
  );
}

/* --- Library sidebar -------------------------------------------------- */

const CATEGORIES = [
  { id: "entrance", label: "Entrance", tag: "entrance" },
  { id: "text", label: "Text", tag: "text" },
  { id: "multiple", label: "Multiple elements", tag: "multiple" },
  { id: "interaction", label: "Hover & press", tag: "interaction" },
  { id: "scroll", label: "Scroll", tag: "scroll" },
  { id: "loop", label: "Loops & attention", tag: "loop", extra: "attention" },
  { id: "component", label: "UI components", tag: "component" },
];

/** Thumbnail values are scaled down so the mini preview fits the card. */
function thumbKeyframes(preset) {
  const st = merge(clone(DEFAULT_STATE), preset.state);
  const kf = isComponent(st.element.type) ? buildPlan(st)[0]?.keyframes || {} : buildKeyframes(st);
  const out = {};
  for (const [k, vals] of Object.entries(kf)) {
    if (k === "x" || k === "y") out[k] = vals.map((v) => v * 0.25);
    else if (k === "width" || k === "height" || k === "borderRadius") continue;
    else if (k === "letterSpacing") continue;
    else out[k] = vals;
  }
  return out;
}

function thumbTransition(preset) {
  const t = merge(clone(DEFAULT_STATE), preset.state).transition;
  const base = t.type === "spring"
    ? t.springMode === "visual"
      ? { type: "spring", visualDuration: t.visualDuration, bounce: t.bounce }
      : { type: "spring", stiffness: t.stiffness, damping: t.damping, mass: t.mass }
    : { duration: Math.min(t.duration, 1.2), ease: t.ease === "custom" ? t.bezier : t.ease };
  if (t.infinite) Object.assign(base, { repeat: 3, repeatType: t.repeatType });
  return base;
}

function thumbMarkup(preset) {
  const el = merge(clone(DEFAULT_STATE), preset.state).element;
  if (isComponent(el.type)) {
    const kind = COMPONENTS[el.type].thumb;
    if (kind === "list") return `<span class="th-list">${"<i></i>".repeat(3)}</span>`;
    if (kind === "grid") return `<span class="th-grid">${"<i></i>".repeat(9)}</span>`;
    if (kind === "button") return `<span class="th-button"><i>${COMPONENTS[el.type].emoji}</i></span>`;
    return `<span class="th-card"><i></i></span>`;
  }
  if (el.type === "text") {
    const word = (el.text || "Aa").split(" ")[0].slice(0, 6);
    if (el.split === "chars") return `<span class="th-text">${[...word].map((c) => `<i>${c}</i>`).join("")}</span>`;
    if (el.split === "words") return `<span class="th-text"><i>Ab</i> <i>cd</i></span>`;
    return `<span class="th-text"><i>${word}</i></span>`;
  }
  if (el.type === "list") return `<span class="th-list">${"<i></i>".repeat(3)}</span>`;
  if (el.type === "grid") return `<span class="th-grid">${"<i></i>".repeat(9)}</span>`;
  if (el.type === "card") return `<span class="th-card"><i></i></span>`;
  if (el.type === "button") return `<span class="th-button"><i>Go</i></span>`;
  return `<span class="th-box"><i></i></span>`;
}

export function renderLibrary(container, { onEdit, onCopy, activeId }) {
  container.innerHTML = "";
  const search = h("input", { type: "search", class: "search", placeholder: "Search library…", "aria-label": "Search presets" });
  const list = h("div", { class: "library-groups" });
  container.append(search, list);

  const draw = (q = "") => {
    list.innerHTML = "";
    const query = q.trim().toLowerCase();
    for (const cat of CATEGORIES) {
      const items = PRESETS.filter(
        (p) => (p.tags.includes(cat.tag) || (cat.extra && p.tags.includes(cat.extra))) && (!query || p.name.toLowerCase().includes(query) || p.tags.join(" ").includes(query)),
      );
      if (!items.length) continue;
      const group = h("div", { class: "library-group" }, h("h4", {}, cat.label));
      for (const p of items) group.append(presetCard(p, { onEdit, onCopy, active: p.id === activeId }));
      list.append(group);
    }
    if (!list.children.length) list.append(h("p", { class: "hint pad" }, "Nothing matches. Try another word."));
  };
  search.addEventListener("input", () => draw(search.value));
  draw();
}

function presetCard(preset, { onEdit, onCopy, active }) {
  const thumb = h("div", { class: "thumb", html: thumbMarkup(preset) });
  const card = h(
    "div",
    { class: `preset-card ${active ? "active" : ""}`, tabindex: 0, role: "button", "aria-label": `Edit ${preset.name}` },
    thumb,
    h("div", { class: "preset-meta" }, h("span", { class: "preset-name" }, preset.emoji, " ", preset.name)),
    h(
      "div",
      { class: "preset-actions" },
      h("button", { class: "btn tiny", type: "button", title: "Copy the JavaScript for this preset", onClick: (e) => { e.stopPropagation(); onCopy(preset); } }, "Copy"),
      h("button", { class: "btn tiny primary", type: "button", onClick: (e) => { e.stopPropagation(); onEdit(preset); } }, "Edit"),
    ),
  );
  card.addEventListener("click", () => onEdit(preset));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEdit(preset);
    }
  });

  let playing = null;
  const play = () => {
    const targets = thumb.querySelectorAll("i");
    if (!targets.length) return;
    playing?.stop?.();
    const kf = thumbKeyframes(preset);
    const tr = thumbTransition(preset);
    const st = merge(clone(DEFAULT_STATE), preset.state);
    if (st.stagger?.enabled && targets.length > 1) {
      tr.delay = (i) => i * Math.min(st.stagger.each, 0.08);
    }
    playing = animate(targets, kf, tr);
  };
  card.addEventListener("pointerenter", play);
  card.addEventListener("focus", play);
  return card;
}

/* --- Design inspector ---------------------------------------------------- */

export function renderDesign(container, store) {
  const state = store.get();
  const set = (patch, rerender = false) => store.patch(patch, { rerender });
  container.innerHTML = "";

  container.append(renderElementSection(state, set));
  container.append(renderTriggerSection(state, set));
  container.append(renderTracksSection(state, set, store));
  container.append(renderTimingSection(state, set));
}

function renderElementSection(state, set) {
  const el = state.element;
  const kids = [];

  kids.push(
    selectField({
      label: "What to animate",
      value: el.type,
      options: ELEMENT_TYPES,
      onChange: (v) => {
        // Tracks are tied to parts of a specific component, so they do not carry over.
        const switchingKind = isComponent(v) || isComponent(el.type);
        const patch = { element: { type: v } };
        if (switchingKind) patch.tracks = [];
        if (isComponent(v) && !COMPONENTS[v].triggers.includes(state.trigger)) patch.trigger = COMPONENTS[v].triggers[0];
        set(patch, true);
      },
    }),
  );

  if (isComponent(el.type)) {
    kids.push(
      h("p", { class: "hint" }, "A working component with real markup. Each part (bars, panel, items...) can be animated on its own in the Animate section below."),
      colorField({ label: "Accent color", value: el.color, onInput: (v) => set({ element: { color: v } }) }),
      colorField({ label: "Text on accent", value: el.textColor, onInput: (v) => set({ element: { textColor: v } }) }),
      numberField({ label: "Corner radius", value: el.radius, min: 0, max: 40, unit: "px", onInput: (v) => set({ element: { radius: v } }) }),
    );
    return section("Component", "Pick a UI component. Copy the code and it works as-is on your page.", ...kids);
  }

  if (el.type === "text" || el.type === "button" || el.type === "card") {
    kids.push(textField({ label: "Text", value: el.text, onInput: (v) => set({ element: { text: v } }) }));
  }
  if (el.type === "text") {
    kids.push(
      selectField({
        label: "Split into",
        value: el.split,
        options: TEXT_SPLITS,
        hint: "Animate the whole heading, or every word / letter separately (great with stagger).",
        onChange: (v) => set({ element: { split: v }, stagger: { enabled: v !== "none" ? true : state.stagger.enabled } }, true),
      }),
    );
  }
  if (el.type === "list" || el.type === "grid") {
    kids.push(numberField({ label: "Items", value: el.count, min: 1, max: 12, step: 1, onInput: (v) => set({ element: { count: v } }) }));
  }
  if (el.type === "custom") {
    kids.push(
      textField({
        label: "Your HTML",
        value: el.customHtml,
        multiline: true,
        placeholder: "<div>…</div>",
        onInput: (v) => set({ element: { customHtml: v } }),
      }),
      toggleField({
        label: "Animate each child separately",
        value: el.animateChildren,
        hint: "Every top-level element inside your HTML becomes its own target (enables stagger).",
        onChange: (v) => set({ element: { animateChildren: v } }, true),
      }),
    );
  }
  if (el.type !== "custom" && el.type !== "text") {
    kids.push(colorField({ label: "Color", value: el.color, onInput: (v) => set({ element: { color: v } }) }));
  }
  if (el.type === "text" || el.type === "button" || el.type === "list" || el.type === "grid") {
    kids.push(colorField({ label: "Text color", value: el.textColor, onInput: (v) => set({ element: { textColor: v } }) }));
  }
  if (el.type === "box" || el.type === "circle") {
    kids.push(numberField({ label: "Size", value: el.size, min: 20, max: 320, unit: "px", onInput: (v) => set({ element: { size: v } }) }));
  }
  if (el.type === "box" || el.type === "button" || el.type === "card" || el.type === "list" || el.type === "grid") {
    kids.push(numberField({ label: "Corner radius", value: el.radius, min: 0, max: 80, unit: "px", onInput: (v) => set({ element: { radius: v } }) }));
  }

  return section("Element", "Pick something to animate. Swap in your own HTML when you are ready.", ...kids);
}

function renderTriggerSection(state, set) {
  const kids = [];
  const comp = isComponent(state.element.type) ? COMPONENTS[state.element.type] : null;
  const options = comp ? TRIGGERS.filter((t) => comp.triggers.includes(t.value)) : TRIGGERS;
  const trigger = effectiveTrigger(state);
  kids.push(
    segmented({
      value: trigger,
      options,
      onChange: (v) => set({ trigger: v }, true),
    }),
  );
  const current = TRIGGERS.find((t) => t.value === trigger);
  kids.push(h("p", { class: "hint" }, current?.hint || ""));

  if (trigger === "hover") {
    kids.push(toggleField({ label: "Revert when the pointer leaves", value: state.hover.revert, onChange: (v) => set({ hover: { revert: v } }) }));
  }
  if (trigger === "inView") {
    kids.push(
      numberField({
        label: "Visible amount",
        value: state.inView.amount,
        min: 0,
        max: 1,
        step: 0.05,
        hint: "How much of the element must be visible before it plays.",
        onInput: (v) => set({ inView: { amount: v } }),
      }),
      toggleField({ label: "Play only once", value: state.inView.once, onChange: (v) => set({ inView: { once: v } }) }),
    );
  }
  if (trigger === "scroll") {
    const edges = [
      { value: "start end", label: "Element top meets viewport bottom" },
      { value: "start center", label: "Element top meets viewport center" },
      { value: "start start", label: "Element top meets viewport top" },
      { value: "center center", label: "Element center meets viewport center" },
      { value: "end end", label: "Element bottom meets viewport bottom" },
      { value: "end center", label: "Element bottom meets viewport center" },
      { value: "end start", label: "Element bottom meets viewport top" },
    ];
    kids.push(
      selectField({ label: "Starts when", value: state.scroll.offsetStart, options: edges, onChange: (v) => set({ scroll: { offsetStart: v } }) }),
      selectField({ label: "Ends when", value: state.scroll.offsetEnd, options: edges, onChange: (v) => set({ scroll: { offsetEnd: v } }) }),
    );
  }
  return section("Trigger", "When should it play?", ...kids);
}

function renderTracksSection(state, set, store) {
  const kids = [];
  const comp = isComponent(state.element.type) ? COMPONENTS[state.element.type] : null;
  const used = new Set(state.tracks.map((t) => `${t.part || ""}|${t.prop}`));

  state.tracks.forEach((track, index) => kids.push(trackCard(track, index, state, set, store)));

  if (!state.tracks.length) kids.push(h("p", { class: "hint pad" }, "No properties yet. Add one below to get moving."));

  const addSel = h("select", { class: "add-prop" }, h("option", { value: "" }, "+ Add a property…"));
  const addOptions = (part) => {
    for (const group of PROP_GROUPS) {
      const og = h("optgroup", { label: part ? `${part.label} · ${group}` : group });
      for (const [key, def] of Object.entries(PROPS)) {
        if (def.group !== group || used.has(`${part?.key || ""}|${key}`)) continue;
        og.append(h("option", { value: `${part?.key || ""}|${key}` }, def.label));
      }
      if (og.children.length) addSel.append(og);
    }
  };
  if (comp) comp.parts.forEach(addOptions);
  else addOptions(null);

  addSel.addEventListener("change", () => {
    if (!addSel.value) return;
    const [part, key] = addSel.value.split("|");
    const def = PROPS[key];
    const from = def.kind === "color" ? (key === "backgroundColor" ? state.element.color : def.def) : def.def;
    const to = def.kind === "color" ? "#ec4899" : defaultTo(key, state);
    const track = { prop: key, values: [from, to] };
    if (part) track.part = part;
    store.patch({ tracks: [...state.tracks, track] }, { rerender: true });
  });
  kids.push(addSel);

  const subtitle = comp
    ? "First value = closed, last value = open. Pick a part of the component, then a property."
    : "Each property goes from its first value to its last. Add keyframes for in-between steps.";
  return section("Animate", subtitle, ...kids);
}

/** A sensible "to" value when a property is added. */
function defaultTo(key, state) {
  const el = state.element;
  switch (key) {
    case "x":
      return 120;
    case "y":
      return -80;
    case "scale":
    case "scaleX":
    case "scaleY":
      return 1.3;
    case "rotate":
      return 180;
    case "rotateX":
    case "rotateY":
      return 45;
    case "skewX":
    case "skewY":
      return 15;
    case "opacity":
      return 0.3;
    case "borderRadius":
      return 60;
    case "blur":
      return 8;
    case "shadow":
      return 40;
    case "width":
    case "height":
      return Math.round((el.size || 120) * 1.5);
    case "letterSpacing":
      return 6;
    default:
      return PROPS[key].def;
  }
}

function trackCard(track, index, state, set, store) {
  const def = PROPS[track.prop] || { label: track.prop, kind: "number", min: -100, max: 100, step: 1 };
  const updateValues = (values, rerender = false) => {
    const tracks = state.tracks.map((t, i) => (i === index ? { ...t, values } : t));
    store.patch({ tracks }, { rerender });
  };

  const head = h(
    "div",
    { class: "track-head" },
    h("strong", {}, track.part ? [h("span", { class: "part-label" }, partLabel(state.element.type, track.part), " · "), propLabel(track.prop)] : propLabel(track.prop)),
    h("span", { class: "spacer" }),
    h(
      "button",
      {
        class: "btn tiny ghost",
        type: "button",
        title: "Add a keyframe",
        onClick: () => {
          const last = track.values[track.values.length - 1];
          const first = track.values[0];
          updateValues([...track.values, def.kind === "color" ? first : last], true);
        },
      },
      "+ keyframe",
    ),
    h(
      "button",
      {
        class: "btn tiny ghost danger",
        type: "button",
        title: "Remove this property",
        "aria-label": "Remove property",
        onClick: () => store.patch({ tracks: state.tracks.filter((_, i) => i !== index) }, { rerender: true }),
      },
      "✕",
    ),
  );

  const rows = h("div", { class: "keyframes" });
  track.values.forEach((value, vi) => {
    const label = vi === 0 ? "From" : vi === track.values.length - 1 ? "To" : `Step ${vi}`;
    let control;
    if (def.kind === "color") {
      control = colorField({
        label,
        value: value,
        onInput: (v) => {
          const values = [...track.values];
          values[vi] = v;
          updateValues(values);
        },
      });
    } else {
      control = numberField({
        label,
        value,
        min: def.min,
        max: def.max,
        step: def.step,
        unit: def.unit,
        onInput: (v) => {
          const values = [...track.values];
          values[vi] = v;
          updateValues(values);
        },
      });
    }
    const row = h("div", { class: "keyframe-row" }, control);
    if (track.values.length > 2) {
      row.append(
        h(
          "button",
          {
            class: "btn tiny ghost",
            type: "button",
            title: "Remove this keyframe",
            "aria-label": "Remove keyframe",
            onClick: () => updateValues(track.values.filter((_, i) => i !== vi), true),
          },
          "–",
        ),
      );
    }
    rows.append(row);
  });

  return h("div", { class: "track" }, head, rows);
}

function renderTimingSection(state, set) {
  const t = state.transition;
  const kids = [];

  if (effectiveTrigger(state) === "scroll") {
    kids.push(h("p", { class: "hint" }, "Scroll-linked animations follow your scroll position, so duration and delay do not apply."));
    kids.push(easingFields(state, set));
    return section("Timing", null, ...kids);
  }

  kids.push(
    segmented({
      value: t.type,
      options: [
        { value: "tween", label: "Timed", hint: "A fixed duration with an easing curve." },
        { value: "spring", label: "Spring", hint: "Physics based. Bouncy, natural, no fixed duration." },
      ],
      onChange: (v) => set({ transition: { type: v } }, true),
    }),
  );

  if (t.type === "tween") {
    kids.push(numberField({ label: "Duration", value: t.duration, min: 0.05, max: 5, step: 0.05, unit: "s", onInput: (v) => set({ transition: { duration: v } }) }));
    kids.push(easingFields(state, set));
  } else {
    kids.push(
      segmented({
        value: t.springMode,
        options: [
          { value: "visual", label: "Simple", hint: "Pick how long it should feel and how bouncy." },
          { value: "physics", label: "Physics", hint: "Tune stiffness, damping and mass directly." },
        ],
        onChange: (v) => set({ transition: { springMode: v } }, true),
      }),
    );
    if (t.springMode === "visual") {
      kids.push(
        numberField({ label: "Feels like", value: t.visualDuration, min: 0.1, max: 3, step: 0.05, unit: "s", hint: "Roughly how long the movement takes.", onInput: (v) => set({ transition: { visualDuration: v } }) }),
        numberField({ label: "Bounce", value: t.bounce, min: 0, max: 1, step: 0.01, onInput: (v) => set({ transition: { bounce: v } }) }),
      );
    } else {
      kids.push(
        numberField({ label: "Stiffness", value: t.stiffness, min: 1, max: 1000, step: 1, hint: "Higher = snappier.", onInput: (v) => set({ transition: { stiffness: v } }) }),
        numberField({ label: "Damping", value: t.damping, min: 0, max: 100, step: 1, hint: "Lower = more wobble.", onInput: (v) => set({ transition: { damping: v } }) }),
        numberField({ label: "Mass", value: t.mass, min: 0.1, max: 10, step: 0.1, hint: "Heavier = slower to move and settle.", onInput: (v) => set({ transition: { mass: v } }) }),
      );
    }
  }

  kids.push(numberField({ label: "Delay", value: t.delay, min: 0, max: 5, step: 0.05, unit: "s", onInput: (v) => set({ transition: { delay: v } }) }));

  // Stagger (only meaningful when several elements are animated)
  if (staggerApplies(state)) {
    const stg = state.stagger;
    kids.push(
      h("div", { class: "subhead" }, "Stagger"),
      toggleField({ label: "Stagger each element", value: stg.enabled, hint: "Offset each element's start so they play one after another.", onChange: (v) => set({ stagger: { enabled: v } }, true) }),
    );
    if (stg.enabled) {
      kids.push(
        numberField({ label: "Gap between each", value: stg.each, min: 0, max: 1, step: 0.01, unit: "s", onInput: (v) => set({ stagger: { each: v } }) }),
        selectField({
          label: "Start from",
          value: stg.from,
          options: [
            { value: "first", label: "First element" },
            { value: "center", label: "Center" },
            { value: "last", label: "Last element" },
          ],
          onChange: (v) => set({ stagger: { from: v } }),
        }),
      );
    }
  }

  // Repeat
  kids.push(
    h("div", { class: "subhead" }, "Repeat"),
    toggleField({ label: "Repeat forever", value: t.infinite, onChange: (v) => set({ transition: { infinite: v } }, true) }),
  );
  if (!t.infinite) {
    kids.push(numberField({ label: "Repeat count", value: t.repeat, min: 0, max: 20, step: 1, onInput: (v) => set({ transition: { repeat: v } }, false) }));
  }
  if (t.infinite || t.repeat > 0) {
    kids.push(
      selectField({
        label: "Repeat style",
        value: t.repeatType,
        options: [
          { value: "loop", label: "Loop (jump back to start)" },
          { value: "reverse", label: "Reverse (play backwards)" },
          { value: "mirror", label: "Mirror (swap from and to)" },
        ],
        onChange: (v) => set({ transition: { repeatType: v } }),
      }),
      numberField({ label: "Pause between", value: t.repeatDelay, min: 0, max: 5, step: 0.05, unit: "s", onInput: (v) => set({ transition: { repeatDelay: v } }) }),
    );
  }

  return section("Timing", "How fast, how bouncy, how often.", ...kids);
}

function easingFields(state, set) {
  const t = state.transition;
  const wrap = h("div", {});
  wrap.append(
    selectField({
      label: "Easing",
      value: t.ease,
      options: EASINGS,
      onChange: (v) => set({ transition: { ease: v } }, true),
    }),
  );
  if (t.ease === "custom") {
    const bez = [...t.bezier];
    const inputs = bez.map((v, i) =>
      h("input", {
        type: "number",
        step: 0.01,
        min: i % 2 === 0 ? 0 : -2,
        max: i % 2 === 0 ? 1 : 3,
        value: v,
        "aria-label": ["x1", "y1", "x2", "y2"][i],
        onInput: (e) => {
          bez[i] = Number(e.target.value);
          set({ transition: { bezier: [...bez] } });
          curve.replaceWith((curve = bezierPreview(bez)));
        },
      }),
    );
    let curve = bezierPreview(bez);
    wrap.append(h("div", { class: "field" }, h("span", { class: "field-label" }, "cubic-bezier"), h("span", { class: "field-controls bezier" }, ...inputs)), curve);
  }
  return wrap;
}

function bezierPreview([x1, y1, x2, y2]) {
  const s = 80;
  const px = (v) => v * s;
  const py = (v) => s - v * s;
  return h("div", {
    class: "bezier-preview",
    html: `<svg viewBox="-10 -30 100 140" width="120" height="140" aria-hidden="true">
      <rect x="0" y="0" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-opacity=".15"/>
      <line x1="0" y1="${s}" x2="${px(x1)}" y2="${py(y1)}" stroke="currentColor" stroke-opacity=".4"/>
      <line x1="${s}" y1="0" x2="${px(x2)}" y2="${py(y2)}" stroke="currentColor" stroke-opacity=".4"/>
      <path d="M0 ${s} C ${px(x1)} ${py(y1)}, ${px(x2)} ${py(y2)}, ${s} 0" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
      <circle cx="${px(x1)}" cy="${py(y1)}" r="3" fill="var(--accent)"/>
      <circle cx="${px(x2)}" cy="${py(y2)}" r="3" fill="var(--accent)"/>
    </svg>`,
  });
}

/* --- Code views ----------------------------------------------------------- */

const CODE_TABS = [
  { id: "script", label: "Script tag", lang: "html", file: "animation-snippet.html", hint: "Paste into any HTML page. Loads motion from a CDN, no install needed." },
  { id: "vanilla", label: "JS module", lang: "js", file: "animation.js", hint: "For projects with a bundler (Vite, etc). Run `npm install motion` first." },
  { id: "html", label: "Full page", lang: "html", file: "animation.html", hint: "A complete HTML file you can save and open in a browser." },
  { id: "css", label: "CSS", lang: "css", file: "animation.css", hint: "Styles that make the element look like the preview. Optional." },
];

let activeCodeTab = "script";

export function renderCode(container, state, { onToast, full = false }) {
  const code = generateAll(state);
  container.innerHTML = "";

  const tabs = h("div", { class: "code-tabs", role: "tablist" });
  const tabHint = h("p", { class: "hint" });
  const pre = h("pre", { class: "code" });
  const codeEl = h("code", {});
  pre.append(codeEl);

  const setTab = (id) => {
    activeCodeTab = id;
    for (const b of tabs.children) b.classList.toggle("active", b.dataset.id === id);
    const t = CODE_TABS.find((x) => x.id === id);
    codeEl.textContent = code[id];
    tabHint.textContent = t.hint;
    pre.dataset.lang = t.lang;
  };
  for (const t of CODE_TABS) {
    tabs.append(h("button", { class: "code-tab", type: "button", "data-id": t.id, role: "tab", onClick: () => setTab(t.id) }, t.label));
  }

  const copyBtn = h(
    "button",
    { class: "btn primary", type: "button", onClick: () => copy(code[activeCodeTab], onToast, "Code copied") },
    "Copy",
  );
  const downloadBtn = h(
    "button",
    { class: "btn", type: "button", onClick: () => download(CODE_TABS.find((x) => x.id === activeCodeTab).file, code[activeCodeTab]) },
    "Download",
  );

  const actions = h("div", { class: "code-actions" }, copyBtn, downloadBtn);

  const install = h(
    "div",
    { class: "install" },
    h("div", { class: "install-row" }, h("span", { class: "install-label" }, "Install"), h("code", {}, code.install), h("button", { class: "btn tiny", type: "button", onClick: () => copy(code.install, onToast, "Copied") }, "Copy")),
    h("div", { class: "install-row" }, h("span", { class: "install-label" }, "Or CDN"), h("code", { class: "wrap" }, code.cdn), h("button", { class: "btn tiny", type: "button", onClick: () => copy(code.cdn, onToast, "Copied") }, "Copy")),
    h("p", { class: "hint" }, "Only the JS module tab needs the npm package. The Script tag and Full page tabs load motion from the CDN."),
  );

  container.append(tabs, tabHint, actions, pre);
  if (full) {
    container.append(
      h("div", { class: "subhead" }, "Element markup"),
      h("p", { class: "hint" }, "Paste this where the element should live, or add the class names to your own HTML."),
      h("pre", { class: "code small" }, h("code", {}, code.markup)),
      h("div", { class: "subhead" }, "Dependencies"),
      install,
    );
  } else {
    container.append(install);
  }
  setTab(activeCodeTab);
}

export async function copy(text, onToast, msg = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    onToast?.(msg);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    onToast?.(msg);
  }
}

function download(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
