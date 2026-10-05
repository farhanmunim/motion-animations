/**
 * All of the editor UI: the library sidebar, the Design inspector, and the
 * Code views. Plain DOM, no framework, so it stays tiny and hackable.
 */
import { animate } from "motion";
import { PROPS, PROP_GROUPS, EASINGS, EASING_CURVES, TRIGGERS, ELEMENT_TYPES, TEXT_SPLITS, propLabel, resolveEase, themeTextHex } from "./props.js";
import { PRESETS } from "./presets.js";
import { staggerApplies, buildKeyframes, buildPlan, effectiveTrigger, trackTimes, evenTimes, hasCustomTimes, isMulti, defaultAxis, needs3d, SCRAMBLE_TRIGGERS } from "./compile.js";
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
  const range = h("input", { type: "range", min, max, step, value, "aria-label": `${label} slider` });
  const num = h("input", { type: "number", min, max, step, value: fmt(value, step), class: "num", "aria-label": label });
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

export function colorField({ label, value, onInput, allowAuto = false, autoHint = "Follows the theme: dark text on light, light text on dark." }) {
  const isAuto = value === "auto";
  const shown = isAuto ? themeTextHex() : value;
  const color = h("input", { type: "color", value: shown, "aria-label": `${label} picker`, disabled: isAuto });
  const hex = h("input", { type: "text", class: "hex", value: isAuto ? "auto" : value, maxlength: 7, "aria-label": `${label} hex value`, disabled: isAuto });
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
  const controls = h("span", { class: "field-controls color" }, color, hex);
  if (allowAuto) {
    controls.append(
      h(
        "label",
        { class: "toggle small auto-toggle", title: autoHint },
        h("input", {
          type: "checkbox",
          checked: isAuto,
          onChange: (e) => {
            const auto = e.target.checked;
            color.disabled = auto;
            hex.disabled = auto;
            if (auto) {
              hex.value = "auto";
              onInput("auto");
            } else {
              const v = themeTextHex();
              color.value = v;
              hex.value = v;
              onInput(v);
            }
          },
        }),
        h("span", {}, "Auto"),
      ),
    );
  }
  return h("label", { class: "field" }, h("span", { class: "field-label" }, label), controls);
}

export function toggleField({ label, value, hint, onChange }) {
  const input = h("input", { type: "checkbox", checked: value, onChange: (e) => onChange(e.target.checked) });
  return h("label", { class: "toggle", title: hint || "" }, input, h("span", {}, label));
}

/** A row of mutually exclusive buttons. */
export function segmented({ value, options, onChange, hints = {}, label }) {
  const wrap = h("div", { class: "segmented", role: "radiogroup", "aria-label": label });
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
  { id: "component", label: "UI components", short: "Components", tag: "component" },
  { id: "entrance", label: "Entrances", short: "Entrances", tag: "entrance" },
  { id: "text", label: "Text", short: "Text", tag: "text" },
  { id: "multiple", label: "Lists & grids", short: "Lists", tag: "multiple" },
  { id: "interaction", label: "Pointer, hover & press", short: "Pointer", tag: "interaction" },
  { id: "effect", label: "Effects", short: "Effects", tag: "effect" },
  { id: "scroll", label: "Scroll", short: "Scroll", tag: "scroll" },
  { id: "loop", label: "Loops & attention", short: "Loops", tag: "loop", extra: "attention" },
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
    : { duration: Math.min(t.duration, 1.2), ease: resolveEase(t) };
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
  if (el.type === "scramble") return `<span class="th-text"><i>A</i><i>#</i><i>b</i><i>%</i></span>`;
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

const ICON_COPY = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`;
const ICON_EDIT = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;

/** Stable per-preset category: the first tag that has a category. */
function primaryCategory(preset) {
  return CATEGORIES.find((c) => preset.tags.includes(c.tag) || (c.extra && preset.tags.includes(c.extra)))?.id || "entrance";
}

let libraryFilter = "all";
let collapsed = new Set();
try {
  collapsed = new Set(JSON.parse(localStorage.getItem("motion-studio:collapsed") || "[]"));
  libraryFilter = localStorage.getItem("motion-studio:filter") || "all";
} catch {
  /* ignore */
}
function remember() {
  try {
    localStorage.setItem("motion-studio:collapsed", JSON.stringify([...collapsed]));
    localStorage.setItem("motion-studio:filter", libraryFilter);
  } catch {
    /* ignore */
  }
}

export function renderLibrary(container, { onEdit, onCopy, activeId, dirty = false }) {
  container.innerHTML = "";
  const search = h("input", { type: "search", class: "search", placeholder: "Search…", "aria-label": "Search presets" });
  const chips = h("div", { class: "chips", role: "group", "aria-label": "Filter by category" });
  const list = h("div", { class: "library-groups" });
  container.append(search, chips, list);

  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, PRESETS.filter((p) => primaryCategory(p) === c.id).length]));
  const drawChips = () => {
    chips.innerHTML = "";
    for (const c of [{ id: "all", label: "All" }, ...CATEGORIES]) {
      chips.append(
        h(
          "button",
          {
            type: "button",
            class: `chip ${libraryFilter === c.id ? "active" : ""}`,
            "aria-pressed": libraryFilter === c.id ? "true" : "false",
            onClick: () => {
              libraryFilter = c.id;
              remember();
              drawChips();
              draw(search.value);
            },
          },
          c.short || c.label,
          c.id !== "all" ? h("span", { class: "chip-count" }, counts[c.id]) : null,
        ),
      );
    }
  };

  const draw = (q = "") => {
    list.innerHTML = "";
    const query = q.trim().toLowerCase();
    const matches = (p) => !query || p.name.toLowerCase().includes(query) || p.tags.join(" ").includes(query);
    for (const cat of CATEGORIES) {
      if (libraryFilter !== "all" && libraryFilter !== cat.id) continue;
      const items = PRESETS.filter((p) => primaryCategory(p) === cat.id && matches(p));
      if (!items.length) continue;
      const isCollapsed = libraryFilter === "all" && !query && collapsed.has(cat.id);
      const head = h(
        "button",
        {
          type: "button",
          class: `group-head ${isCollapsed ? "collapsed" : ""}`,
          "aria-expanded": isCollapsed ? "false" : "true",
          onClick: () => {
            if (collapsed.has(cat.id)) collapsed.delete(cat.id);
            else collapsed.add(cat.id);
            remember();
            draw(search.value);
          },
        },
        h("span", { class: "group-chev", "aria-hidden": "true" }, "▾"),
        h("span", {}, cat.label),
        h("span", { class: "group-count" }, items.length),
      );
      const group = h("section", { class: "library-group" }, h("h3", { class: "group-title" }, head));
      if (!isCollapsed) {
        const ul = h("ul", { class: "group-items", "aria-label": cat.label });
        for (const p of items) ul.append(h("li", {}, presetCard(p, { onEdit, onCopy, active: p.id === activeId, dirty })));
        group.append(ul);
      }
      list.append(group);
    }
    if (!list.children.length) list.append(h("p", { class: "hint pad" }, "Nothing matches. Try another word."));
  };
  search.addEventListener("input", () => draw(search.value));
  drawChips();
  draw();
}

function presetCard(preset, { onEdit, onCopy, active, dirty }) {
  const thumb = h("div", { class: "thumb", html: thumbMarkup(preset) });
  const card = h(
    "div",
    { class: `preset-card ${active ? "active" : ""}` },
    thumb,
    h(
      "div",
      { class: "preset-meta" },
      h("button", { type: "button", class: "preset-name", "aria-label": `Edit ${preset.name}`, onClick: (e) => { e.stopPropagation(); onEdit(preset); } }, preset.name),
      active && dirty ? h("span", { class: "badge" }, "edited") : null,
    ),
    h(
      "div",
      { class: "preset-actions" },
      h(
        "button",
        { class: "btn tiny icon-btn", type: "button", title: "Copy code", "aria-label": `Copy code for ${preset.name}`, onClick: (e) => { e.stopPropagation(); onCopy(preset); } },
        h("span", { html: ICON_COPY }),
      ),
      active
        ? null
        : h(
            "button",
            { class: "btn tiny icon-btn primary", type: "button", title: "Edit", "aria-hidden": "true", tabindex: "-1", onClick: (e) => { e.stopPropagation(); onEdit(preset); } },
            h("span", { html: ICON_EDIT }),
          ),
    ),
  );
  // The whole row is a mouse target; keyboard users get the name and icon buttons.
  card.addEventListener("click", () => onEdit(preset));

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
  card.addEventListener("focusin", play);
  return card;
}

/* --- Design inspector ---------------------------------------------------- */

/** True when the current design no longer matches the preset it came from. */
export function isDirty(state) {
  if (!state.presetId) return false;
  const preset = PRESETS.find((p) => p.id === state.presetId);
  if (!preset) return false;
  const expected = merge(clone(DEFAULT_STATE), { ...preset.state, name: preset.name, presetId: preset.id });
  const pick = (s) => JSON.stringify([s.element, s.trigger, s.tracks, s.transition, s.stagger, s.inView, s.scroll, s.hover, s.toggle, s.pointer]);
  return pick(expected) !== pick(state);
}

export function renderDesign(container, store, { headerOnly = false } = {}) {
  const state = store.get();
  const set = (patch, rerender = false) => store.patch(patch, { rerender });
  if (headerOnly) {
    const old = container.querySelector(".design-head");
    if (old) old.replaceWith(renderHeader(state, set, store));
    return;
  }
  container.innerHTML = "";

  container.append(renderHeader(state, set, store));
  container.append(renderElementSection(state, set));
  container.append(renderTriggerSection(state, set));
  container.append(state.element.type === "scramble" ? renderScrambleSection(state, set) : renderTracksSection(state, set, store));
  container.append(renderTimingSection(state, set));
}

function renderHeader(state, set, store) {
  const preset = state.presetId ? PRESETS.find((p) => p.id === state.presetId) : null;
  const dirty = isDirty(state);
  const name = h("input", { type: "text", class: "design-name", value: state.name, "aria-label": "Animation name", onInput: (e) => set({ name: e.target.value }) });
  const origin = preset
    ? h(
        "p",
        { class: "hint origin" },
        dirty ? `Edited copy of “${preset.name}”. ` : `Unchanged from “${preset.name}”. `,
        dirty
          ? h("button", { type: "button", class: "link", onClick: () => store.replace({ ...preset.state, name: preset.name, presetId: preset.id }, { rerender: true }) }, "Revert to preset")
          : null,
      )
    : h("p", { class: "hint origin" }, "Start from a preset on the left, or build from scratch here.");
  return h("div", { class: "design-head" }, name, origin);
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
        const patch = { element: { type: v } };
        if (isComponent(v)) {
          // Components come with a working default animation for their parts.
          const def = PRESETS.find((p) => p.state.element?.type === v);
          if (def) Object.assign(patch, clone(def.state), { element: { ...def.state.element, color: el.color, textColor: el.textColor, radius: el.radius } });
          if (!COMPONENTS[v].triggers.includes(patch.trigger || state.trigger)) patch.trigger = COMPONENTS[v].triggers[0];
        } else if (v === "scramble") {
          // The scramble effect plays on its own; it has no properties to animate.
          patch.tracks = [];
          if (!SCRAMBLE_TRIGGERS.includes(state.trigger)) patch.trigger = "load";
          if (!el.text || el.text === "Hello") patch.element = { type: v, text: "Motion Studio" };
        } else if (isComponent(el.type) || el.type === "scramble") {
          // Part-based tracks make no sense on a plain element: start with a simple fade up.
          patch.tracks = clone(DEFAULT_STATE.tracks);
        }
        set(patch, true);
      },
    }),
  );

  if (isComponent(el.type)) {
    kids.push(
      h("p", { class: "hint" }, "A working component with real markup. Each part (bars, panel, items...) can be animated on its own in the Animate section below."),
      colorField({ label: "Accent color", value: el.color, onInput: (v) => set({ element: { color: v } }) }),
      colorField({ label: "Text on accent", value: el.textColor, allowAuto: true, autoHint: "Auto means white text on the accent colour.", onInput: (v) => set({ element: { textColor: v } }) }),
      numberField({ label: "Corner radius", value: el.radius, min: 0, max: 40, unit: "px", onInput: (v) => set({ element: { radius: v } }) }),
    );
    return section("Component", "Pick a UI component. Copy the code and it works as-is on your page.", ...kids);
  }

  if (el.type === "text" || el.type === "button" || el.type === "card" || el.type === "scramble") {
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
    if (el.split !== "none") {
      kids.push(
        toggleField({
          label: "Mask each piece",
          value: !!el.mask,
          hint: "Clip every word or letter so it slides up from behind an invisible line. Pair it with Slide Y (%).",
          onChange: (v) => set({ element: { mask: v } }, true),
        }),
      );
    }
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
  if (el.type !== "custom" && el.type !== "text" && el.type !== "scramble") {
    kids.push(colorField({ label: "Color", value: el.color, onInput: (v) => set({ element: { color: v } }) }));
  }
  if (el.type === "text" || el.type === "scramble" || el.type === "button" || el.type === "list" || el.type === "grid") {
    kids.push(colorField({ label: "Text color", value: el.textColor, allowAuto: true, onInput: (v) => set({ element: { textColor: v } }) }));
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
  const scramble = state.element.type === "scramble";
  const options = comp
    ? TRIGGERS.filter((t) => comp.triggers.includes(t.value))
    : scramble
    ? TRIGGERS.filter((t) => SCRAMBLE_TRIGGERS.includes(t.value))
    : TRIGGERS.filter((t) => t.value !== "pointer" || !isMulti(state));
  const trigger = effectiveTrigger(state);
  kids.push(
    segmented({
      label: "Trigger",
      value: trigger,
      options,
      onChange: (v) => set({ trigger: v }, true),
    }),
  );
  const current = TRIGGERS.find((t) => t.value === trigger);
  kids.push(h("p", { class: "hint" }, current?.hint || ""));

  if (trigger === "toggle") {
    kids.push(
      numberField({
        label: "Close after",
        value: state.toggle?.autoClose ?? 0,
        min: 0,
        max: 15,
        step: 0.5,
        unit: "s",
        hint: "Play the reverse automatically after this many seconds. 0 keeps it open until the next click.",
        onInput: (v) => set({ toggle: { autoClose: v } }),
      }),
      h("p", { class: "hint" }, "Great for toasts and notices: open on click, close on their own."),
    );
  }
  if (trigger === "pointer") {
    kids.push(
      selectField({
        label: "Track pointer over",
        value: state.pointer?.area || "element",
        options: [
          { value: "element", label: "The element" },
          { value: "scene", label: "The whole page" },
        ],
        hint: "The element: tilt and glow while you hover it. The whole page: parallax that reacts to the pointer anywhere.",
        onChange: (v) => set({ pointer: { area: v } }),
      }),
    );
    if (state.tracks.some((t) => t.axis === "near")) {
      kids.push(
        numberField({
          label: "Reach",
          value: state.pointer?.radius ?? 120,
          min: 30,
          max: 400,
          step: 5,
          unit: "px",
          hint: "How close the pointer has to be to an item before it reacts. Larger = a wider, smoother wave.",
          onInput: (v) => set({ pointer: { radius: v } }),
        }),
      );
    }
    if (needs3d(state)) {
      kids.push(
        numberField({
          label: "Perspective",
          value: state.pointer?.perspective ?? 900,
          min: 300,
          max: 2400,
          step: 50,
          unit: "px",
          hint: "Lower = stronger 3D depth, higher = flatter.",
          onInput: (v) => set({ pointer: { perspective: v } }),
        }),
      );
    }
  }
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

function renderScrambleSection(state, set) {
  return section(
    "Scramble",
    "Letters shuffle, then settle into your text one by one. The duration below sets how long that takes.",
    selectField({
      label: "Shuffle with",
      value: state.scramble?.chars || "letters",
      options: [
        { value: "letters", label: "Letters" },
        { value: "symbols", label: "Symbols" },
        { value: "binary", label: "Binary (0 and 1)" },
      ],
      onChange: (v) => set({ scramble: { chars: v } }),
    }),
  );
}

function renderTracksSection(state, set, store) {
  const kids = [];
  const comp = isComponent(state.element.type) ? COMPONENTS[state.element.type] : null;
  const used = new Set(state.tracks.map((t) => `${t.part || ""}|${t.prop}`));

  state.tracks.forEach((track, index) => kids.push(trackCard(track, index, state, set, store)));

  if (!state.tracks.length) kids.push(h("p", { class: "hint pad" }, "No properties yet. Add one below to get moving."));

  const addSel = h("select", { class: "add-prop", "aria-label": "Add a property to animate" }, h("option", { value: "" }, "+ Add a property…"));
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
    const from = def.kind === "color" ? (key === "backgroundColor" ? state.element.color : key === "color" ? "auto" : def.def) : def.def;
    const to = def.kind === "color" ? "#ec4899" : defaultTo(key, state);
    const track = { prop: key, values: [from, to] };
    if (effectiveTrigger(state) === "pointer") {
      track.axis = defaultAxis(key);
      track.values = pointerRange(key, def, from, to);
    }
    if (part) track.part = part;
    store.patch({ tracks: [...state.tracks, track] }, { rerender: true });
  });
  kids.push(addSel);

  const subtitle = effectiveTrigger(state) === "pointer"
    ? "Each property follows the pointer between two values. Choose what drives it: the pointer's X, its Y, or whether it is over the element."
    : comp
    ? "First value = closed, last value = open. Pick a part of the component, then a property."
    : "Each property goes from its first value to its last. Add keyframes for in-between steps.";
  if (effectiveTrigger(state) !== "pointer") kids.push(h("p", { class: "hint" }, "Want a property to change, hold, then change again? Add keyframes to that property and set when each one happens."));
  return section("Animate", subtitle, ...kids);
}

const POINTER_AXES = [
  { value: "x", label: "Pointer X (left to right)" },
  { value: "y", label: "Pointer Y (top to bottom)" },
  { value: "enter", label: "Pointer over the element" },
  { value: "near", label: "Pointer closeness (per item, along X)" },
];
const POINTER_LABELS = {
  x: ["At the left edge", "At the right edge"],
  y: ["At the top edge", "At the bottom edge"],
  enter: ["Pointer outside", "Pointer over it"],
  near: ["Pointer far away", "Pointer right on it"],
};
const POINTER_RANGES = {
  rotateX: [10, -10],
  rotateY: [-10, 10],
  x: [-12, 12],
  y: [-12, 12],
  z: [0, 40],
  scale: [1, 1.05],
  scaleX: [1, 1.05],
  scaleY: [1, 1.05],
  rotate: [-6, 6],
  skewX: [-6, 6],
  skewY: [-6, 6],
  opacity: [0, 1],
  blur: [0, 6],
  shadow: [0, 40],
  clipRight: [100, 0],
};

/** Start values for a property that follows the pointer. */
function pointerRange(key, def, from, to) {
  return POINTER_RANGES[key] || (def.kind === "color" ? [from, to] : [def.def, to]);
}

/** A sensible "to" value when a property is added. */
function defaultTo(key, state) {
  const el = state.element;
  switch (key) {
    case "x":
      return 120;
    case "y":
      return -80;
    case "z":
      return 40;
    case "xPercent":
    case "yPercent":
      return 100;
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
  const times = trackTimes(track);
  const pointerMode = effectiveTrigger(state) === "pointer";
  const axis = track.axis || defaultAxis(track.prop);
  const timed = !pointerMode && (state.transition.type === "tween" || effectiveTrigger(state) === "scroll");
  const updateTrack = (patch, rerender = false) => {
    const tracks = state.tracks.map((t, i) => (i === index ? { ...t, ...patch } : t));
    store.patch({ tracks }, { rerender });
  };
  const updateValues = (values, rerender = false) => updateTrack({ values }, rerender);

  const head = h(
    "div",
    { class: "track-head" },
    h("strong", {}, track.part ? [h("span", { class: "part-label" }, partLabel(state.element.type, track.part), " · "), propLabel(track.prop)] : propLabel(track.prop)),
    h("span", { class: "spacer" }),
    pointerMode ? null : h(
      "button",
      {
        class: "btn tiny ghost",
        type: "button",
        title: "Add a keyframe",
        onClick: () => {
          // Duplicate the last value: a "hold", ready to be changed.
          const last = track.values[track.values.length - 1];
          const n = track.values.length;
          const nextTimes = hasCustomTimes(track) ? [...times.map((t) => Math.round(t * ((n - 1) / n) * 1000) / 1000), 1] : undefined;
          updateTrack({ values: [...track.values, last], times: nextTimes }, true);
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
  const n = track.values.length;
  // Following the pointer uses two values only: the ends of the range.
  const visible = pointerMode ? [0, n - 1] : track.values.map((_, i) => i);

  // Timeline strip: where each keyframe sits within the duration.
  let strip = null;
  if (n > 2 && !pointerMode) {
    strip = h("div", { class: `timeline ${timed ? "" : "muted"}`, title: timed ? "Keyframe positions within the duration" : "Springs play keyframes evenly. Switch Timing to Timed for precise positions." });
    times.forEach((t, vi) => strip.append(h("span", { class: "tl-dot", style: `left:${t * 100}%` }, h("i", {}, `${Math.round(t * 100)}%`))));
  }

  visible.forEach((vi) => {
    const value = track.values[vi];
    const label = pointerMode ? POINTER_LABELS[axis][vi === 0 ? 0 : 1] : vi === 0 ? "From" : vi === n - 1 ? "To" : `Step ${vi}`;
    let control;
    if (def.kind === "color") {
      control = colorField({
        label,
        value: value,
        allowAuto: track.prop === "color",
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
    if (n > 2 && timed) {
      const isEdge = vi === 0 || vi === n - 1;
      const at = h("input", {
        type: "number",
        class: "at",
        min: 0,
        max: 100,
        step: 1,
        value: Math.round(times[vi] * 100),
        disabled: isEdge,
        title: isEdge ? "First and last keyframes are fixed at 0% and 100%" : "When this keyframe is reached, as a % of the duration",
        "aria-label": "Keyframe position (%)",
        onInput: (e) => {
          if (isEdge) return;
          const lo = times[vi - 1] * 100 + 1;
          const hi = times[vi + 1] * 100 - 1;
          const v = Math.min(hi, Math.max(lo, Number(e.target.value)));
          if (!Number.isFinite(v)) return;
          const next = [...times];
          next[vi] = Math.round(v * 10) / 1000;
          updateTrack({ times: next });
          if (strip) strip.children[vi].style.left = `${next[vi] * 100}%`;
          strip?.children[vi].querySelector("i") && (strip.children[vi].querySelector("i").textContent = `${Math.round(next[vi] * 100)}%`);
        },
      });
      row.append(h("label", { class: "at-wrap" }, at, h("span", {}, "%")));
    }
    if (n > 2 && !pointerMode) {
      row.append(
        h(
          "button",
          {
            class: "btn tiny ghost",
            type: "button",
            title: "Remove this keyframe",
            "aria-label": "Remove keyframe",
            onClick: () => {
              const values = track.values.filter((_, i) => i !== vi);
              let nextTimes;
              if (hasCustomTimes(track)) {
                const kept = times.filter((_, i) => i !== vi);
                const lo = kept[0];
                const hi = kept[kept.length - 1];
                nextTimes = kept.map((t) => Math.round(((t - lo) / (hi - lo || 1)) * 1000) / 1000);
              }
              updateTrack({ values, times: nextTimes }, true);
            },
          },
          "–",
        ),
      );
    }
    rows.append(row);
  });

  const card = h("div", { class: "track" }, head);
  if (pointerMode) {
    card.append(
      selectField({
        label: "Follows",
        value: axis,
        options: POINTER_AXES,
        hint: "What drives this property: the pointer's horizontal or vertical position, or simply whether it is over the element.",
        onChange: (v) => updateTrack({ axis: v }, true),
      }),
    );
  }
  if (strip) card.append(strip);
  card.append(rows);
  if (n > 2 && !pointerMode) card.append(h("p", { class: "hint tiny" }, timed ? "Each keyframe's % is when it is reached within the duration. Repeat a value to hold it." : "Springs play keyframes evenly. Switch Timing to Timed to position them."));
  return card;
}

/** Spring mode switch and its fields (shared by Timing and Smoothing). */
function springFields(t, set) {
  const kids = [
    segmented({
      label: "Spring mode",
      value: t.springMode,
      options: [
        { value: "visual", label: "Simple", hint: "Pick how long it should feel and how bouncy." },
        { value: "physics", label: "Physics", hint: "Tune stiffness, damping and mass directly." },
      ],
      onChange: (v) => set({ transition: { springMode: v } }, true),
    }),
  ];
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
  return kids;
}

function renderTimingSection(state, set) {
  const t = state.transition;
  const kids = [];

  if (effectiveTrigger(state) === "pointer") {
    kids.push(h("p", { class: "hint" }, "The element chases the pointer with a spring. Lower stiffness feels floatier; lower damping adds wobble."), ...springFields(t, set));
    return section("Smoothing", null, ...kids);
  }

  if (state.element.type === "scramble") {
    kids.push(
      numberField({ label: "Duration", value: t.duration, min: 0.2, max: 5, step: 0.05, unit: "s", onInput: (v) => set({ transition: { duration: v, type: "tween" } }) }),
      easingFields(state, set),
      numberField({ label: "Delay", value: t.delay, min: 0, max: 5, step: 0.05, unit: "s", onInput: (v) => set({ transition: { delay: v } }) }),
    );
    return section("Timing", null, ...kids);
  }

  if (effectiveTrigger(state) === "scroll") {
    kids.push(h("p", { class: "hint" }, "Scroll-linked animations follow your scroll position, so duration and delay do not apply."));
    kids.push(easingFields(state, set));
    return section("Timing", null, ...kids);
  }

  kids.push(
    segmented({
      label: "Timing type",
      value: t.type,
      options: [
        { value: "tween", label: "Timed", hint: "A fixed duration with an easing curve." },
        { value: "spring", label: "Spring", hint: "Physics based. Bouncy, natural, no fixed duration." },
      ],
      onChange: (v) => set({ transition: { type: v } }, true),
    }),
  );

  if (t.type === "tween") {
    kids.push(numberField({ label: "Duration", value: t.duration, min: 0.05, max: 40, step: 0.05, unit: "s", onInput: (v) => set({ transition: { duration: v } }) }));
    kids.push(easingFields(state, set));
  } else {
    kids.push(
      segmented({
        label: "Spring mode",
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
  if (EASING_CURVES[t.ease]) {
    wrap.append(bezierPreview(EASING_CURVES[t.ease]));
  }
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

export function renderCode(container, state, { onToast, full = false, code: prebuilt = null }) {
  const code = prebuilt || generateAll(state);
  container.innerHTML = "";

  const tabs = h("div", { class: "code-tabs", role: "group", "aria-label": "Code format" });
  const tabHint = h("p", { class: "hint" });
  const pre = h("pre", { class: "code", tabindex: 0, "aria-label": "Generated code" });
  const codeEl = h("code", {});
  pre.append(codeEl);

  const setTab = (id) => {
    activeCodeTab = id;
    for (const b of tabs.children) {
      b.classList.toggle("active", b.dataset.id === id);
      b.setAttribute("aria-pressed", b.dataset.id === id ? "true" : "false");
    }
    const t = CODE_TABS.find((x) => x.id === id);
    codeEl.textContent = code[id];
    tabHint.textContent = t.hint;
    pre.dataset.lang = t.lang;
  };
  for (const t of CODE_TABS) {
    tabs.append(h("button", { class: "code-tab", type: "button", "data-id": t.id, "aria-pressed": "false", onClick: () => setTab(t.id) }, t.label));
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
      h("pre", { class: "code small", tabindex: 0, "aria-label": "Component HTML" }, h("code", {}, code.markup)),
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
