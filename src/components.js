/**
 * Interactive UI components. Unlike a single element, a component has several
 * named parts (bars, a panel, menu items...) that animate together and usually
 * toggle between "closed" and "open" when clicked.
 *
 *  - markup:  the HTML. The root carries class "motion-target".
 *  - parts:   the animatable pieces. `selector` is relative to the root
 *             (null means the root itself). `multi` parts are lists that
 *             can be staggered.
 *  - clicks:  selectors (relative to root) that toggle open/closed. Empty
 *             means the root itself.
 *  - css:     styles, with {{color}} {{text}} {{radius}} placeholders.
 *  - triggers: which triggers make sense for this component.
 */

const TOGGLE_TRIGGERS = ["toggle", "hover", "press", "load", "inView"];

export const COMPONENTS = {
  hamburger: {
    label: "Hamburger menu button",
    emoji: "🍔",
    thumb: "list",
    markup: `<button class="motion-target hamburger" aria-label="Open menu" aria-expanded="false">
  <span class="bar bar-top"></span>
  <span class="bar bar-mid"></span>
  <span class="bar bar-bot"></span>
</button>`,
    parts: [
      { key: "bar-top", label: "Top bar", selector: ".bar-top" },
      { key: "bar-mid", label: "Middle bar", selector: ".bar-mid" },
      { key: "bar-bot", label: "Bottom bar", selector: ".bar-bot" },
      { key: "root", label: "Button", selector: null },
    ],
    clicks: [],
    triggers: TOGGLE_TRIGGERS,
    css: `.hamburger {
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: {{radius}}px;
  background: {{color}};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 0;
}
.hamburger .bar {
  display: block;
  width: 24px;
  height: 3px;
  border-radius: 2px;
  background: {{text}};
}`,
  },

  dropdown: {
    label: "Dropdown menu",
    emoji: "📂",
    thumb: "card",
    markup: `<div class="motion-target dropdown">
  <button class="dropdown-trigger" aria-expanded="false">
    Options <span class="chevron"><svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>
  </button>
  <ul class="dropdown-panel" role="menu">
    <li class="dropdown-item" role="menuitem">Profile</li>
    <li class="dropdown-item" role="menuitem">Settings</li>
    <li class="dropdown-item" role="menuitem">Billing</li>
    <li class="dropdown-item" role="menuitem">Sign out</li>
  </ul>
</div>`,
    parts: [
      { key: "panel", label: "Panel", selector: ".dropdown-panel" },
      { key: "item", label: "Menu items", selector: ".dropdown-item", multi: true },
      { key: "chevron", label: "Chevron", selector: ".chevron" },
      { key: "trigger", label: "Button", selector: ".dropdown-trigger" },
    ],
    clicks: [".dropdown-trigger"],
    triggers: TOGGLE_TRIGGERS,
    css: `.dropdown {
  position: relative;
  display: inline-block;
  font-family: system-ui, sans-serif;
}
.dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border: 0;
  border-radius: {{radius}}px;
  background: {{color}};
  color: {{text}};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.dropdown .chevron {
  display: inline-flex;
}
.dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: #1c1c22;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: {{radius}}px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 24px 60px -12px rgba(0, 0, 0, 0.55);
  transform-origin: top left;
  pointer-events: none;
}
.dropdown.is-open .dropdown-panel {
  pointer-events: auto;
}
.dropdown-item {
  padding: 10px 12px;
  border-radius: calc({{radius}}px - 4px);
  cursor: pointer;
}
.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
}`,
  },

  modal: {
    label: "Modal dialog",
    emoji: "🪟",
    thumb: "card",
    markup: `<div class="motion-target modal-demo">
  <button class="modal-open" aria-expanded="false">Open dialog</button>
  <div class="modal-backdrop"></div>
  <div class="modal-dialog" role="dialog" aria-modal="true">
    <h3>Delete project?</h3>
    <p>This can't be undone. All files in the project will be removed.</p>
    <div class="modal-actions">
      <button class="modal-close">Cancel</button>
      <button class="modal-close primary">Delete</button>
    </div>
  </div>
</div>`,
    parts: [
      { key: "dialog", label: "Dialog", selector: ".modal-dialog" },
      { key: "backdrop", label: "Backdrop", selector: ".modal-backdrop" },
    ],
    clicks: [".modal-open", ".modal-backdrop", ".modal-close"],
    triggers: TOGGLE_TRIGGERS,
    css: `.modal-demo {
  font-family: system-ui, sans-serif;
}
.modal-open, .modal-close {
  padding: 12px 18px;
  border: 0;
  border-radius: {{radius}}px;
  background: rgba(127, 127, 140, 0.25);
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.modal-open, .modal-close.primary {
  background: {{color}};
  color: {{text}};
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(8, 8, 12, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}
.modal-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  width: min(360px, calc(100% - 32px));
  padding: 24px;
  background: #1c1c22;
  color: #fff;
  border-radius: {{radius}}px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 40px 90px -20px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: none;
}
.modal-demo.is-open .modal-backdrop,
.modal-demo.is-open .modal-dialog {
  pointer-events: auto;
}
.modal-dialog h3 { margin: 0 0 8px; font-size: 18px; }
.modal-dialog p { margin: 0 0 20px; opacity: 0.7; font-size: 14px; line-height: 1.5; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }`,
  },

  drawer: {
    label: "Side drawer",
    emoji: "🚪",
    thumb: "list",
    markup: `<div class="motion-target drawer-demo">
  <button class="drawer-open" aria-expanded="false">Open menu</button>
  <div class="drawer-backdrop"></div>
  <nav class="drawer-panel">
    <button class="drawer-close" aria-label="Close menu"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <a class="drawer-link" href="#">Home</a>
    <a class="drawer-link" href="#">Projects</a>
    <a class="drawer-link" href="#">Team</a>
    <a class="drawer-link" href="#">Settings</a>
  </nav>
</div>`,
    parts: [
      { key: "panel", label: "Drawer", selector: ".drawer-panel" },
      { key: "link", label: "Links", selector: ".drawer-link", multi: true },
      { key: "backdrop", label: "Backdrop", selector: ".drawer-backdrop" },
    ],
    clicks: [".drawer-open", ".drawer-backdrop", ".drawer-close"],
    triggers: TOGGLE_TRIGGERS,
    css: `.drawer-demo {
  font-family: system-ui, sans-serif;
}
.drawer-open {
  padding: 12px 18px;
  border: 0;
  border-radius: {{radius}}px;
  background: {{color}};
  color: {{text}};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
.drawer-panel {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  padding: 64px 20px 20px;
  background: #1c1c22;
  color: #fff;
  box-shadow: 20px 0 60px rgba(0, 0, 0, 0.4);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: none;
}
.drawer-demo.is-open .drawer-backdrop,
.drawer-demo.is-open .drawer-panel {
  pointer-events: auto;
}
.drawer-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.drawer-link {
  padding: 12px 14px;
  border-radius: {{radius}}px;
  color: inherit;
  text-decoration: none;
  font-weight: 500;
}
.drawer-link:hover {
  background: rgba(255, 255, 255, 0.08);
}`,
  },

  toast: {
    label: "Toast notification",
    emoji: "🔔",
    thumb: "card",
    markup: `<div class="motion-target toast-demo">
  <button class="toast-trigger" aria-expanded="false">Show notification</button>
  <div class="toast-card" role="status">
    <span class="toast-icon"><svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg></span>
    <div>
      <strong>Saved</strong>
      <span>Your changes are live.</span>
    </div>
  </div>
</div>`,
    parts: [{ key: "card", label: "Toast", selector: ".toast-card" }],
    clicks: [".toast-trigger"],
    triggers: TOGGLE_TRIGGERS,
    css: `.toast-demo {
  font-family: system-ui, sans-serif;
}
.toast-trigger {
  padding: 12px 18px;
  border: 0;
  border-radius: {{radius}}px;
  background: {{color}};
  color: {{text}};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.toast-card {
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: #1c1c22;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: {{radius}}px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 24px 60px -12px rgba(0, 0, 0, 0.55);
  pointer-events: none;
}
.toast-demo.is-open .toast-card {
  pointer-events: auto;
}
.toast-card div { display: grid; gap: 2px; font-size: 14px; }
.toast-card div span { opacity: 0.7; font-size: 13px; }
.toast-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: {{color}};
  color: {{text}};
  font-weight: 700;
}`,
  },

  accordion: {
    label: "Accordion",
    emoji: "🪗",
    thumb: "list",
    markup: `<div class="motion-target accordion">
  <button class="accordion-header" aria-expanded="false">
    What is Motion Studio?
    <span class="chevron"><svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>
  </button>
  <div class="accordion-body">
    <p>A visual editor for motion.dev animations. Design it, preview it, then copy the code into your own project.</p>
  </div>
</div>`,
    parts: [
      { key: "body", label: "Body", selector: ".accordion-body" },
      { key: "chevron", label: "Chevron", selector: ".chevron" },
      { key: "header", label: "Header", selector: ".accordion-header" },
    ],
    clicks: [".accordion-header"],
    triggers: TOGGLE_TRIGGERS,
    css: `.accordion {
  width: 320px;
  background: #1c1c22;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: {{radius}}px;
  overflow: hidden;
  font-family: system-ui, sans-serif;
}
.accordion-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border: 0;
  background: {{color}};
  color: {{text}};
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.accordion .chevron { display: inline-flex; }
.accordion-body {
  overflow: hidden;
}
.accordion-body p {
  margin: 0;
  padding: 16px 18px;
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.8;
}`,
  },

  switch: {
    label: "Toggle switch",
    emoji: "🎚️",
    thumb: "button",
    markup: `<button class="motion-target switch" role="switch" aria-checked="false" aria-label="Enable">
  <span class="switch-knob"></span>
</button>`,
    parts: [
      { key: "knob", label: "Knob", selector: ".switch-knob" },
      { key: "root", label: "Track", selector: null },
    ],
    clicks: [],
    triggers: TOGGLE_TRIGGERS,
    css: `.switch {
  width: 56px;
  height: 32px;
  padding: 4px;
  border: 0;
  border-radius: 999px;
  background: #3f3f50;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.switch-knob {
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}`,
  },

  tooltip: {
    label: "Tooltip",
    emoji: "💬",
    thumb: "button",
    markup: `<div class="motion-target tooltip-demo">
  <button class="tooltip-trigger" aria-describedby="tip">Hover me</button>
  <div class="tooltip" role="tooltip" id="tip">Helpful hint goes here</div>
</div>`,
    parts: [{ key: "tip", label: "Tooltip", selector: ".tooltip" }],
    clicks: [],
    triggers: ["hover", "toggle", "press", "load", "inView"],
    css: `.tooltip-demo {
  position: relative;
  display: inline-block;
  font-family: system-ui, sans-serif;
}
.tooltip-trigger {
  padding: 12px 18px;
  border: 0;
  border-radius: {{radius}}px;
  background: {{color}};
  color: {{text}};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  translate: -50% 0;
  transform-origin: bottom center;
  white-space: nowrap;
  padding: 8px 12px;
  background: #1c1c22;
  color: #fff;
  font-size: 13px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 12px 30px -6px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}`,
  },

  fab: {
    label: "Floating action menu",
    emoji: "➕",
    thumb: "grid",
    markup: `<div class="motion-target fab-menu">
  <div class="fab-actions">
    <button class="fab-action" aria-label="Edit"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
    <button class="fab-action" aria-label="Favorite"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/></svg></button>
    <button class="fab-action" aria-label="Share"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></button>
  </div>
  <button class="fab" aria-label="Actions" aria-expanded="false"><svg class="icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
</div>`,
    parts: [
      { key: "action", label: "Actions", selector: ".fab-action", multi: true },
      { key: "fab", label: "Main button", selector: ".fab" },
    ],
    clicks: [".fab"],
    triggers: TOGGLE_TRIGGERS,
    css: `.fab-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.fab-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.fab-menu.is-open .fab-actions {
  pointer-events: auto;
}
.fab, .fab-action {
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
}
.fab .icon, .fab-action .icon {
  display: block;
}
.fab {
  width: 56px;
  height: 56px;
  background: {{color}};
  color: {{text}};
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
.fab-action {
  width: 44px;
  height: 44px;
  background: #1c1c22;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}`,
  },
};

export function isComponent(type) {
  return Object.prototype.hasOwnProperty.call(COMPONENTS, type);
}

export function getComponent(type) {
  return COMPONENTS[type] || null;
}

/** CSS for a component with the element's colours filled in. */
export function componentCss(type, el) {
  const c = COMPONENTS[type];
  if (!c) return "";
  return c.css
    .replace(/\{\{color\}\}/g, el.color)
    .replace(/\{\{text\}\}/g, el.textColor)
    .replace(/\{\{radius\}\}/g, String(Number(el.radius) || 0));
}

/** Selector for a part, relative to the root. null = the root itself. */
export function partSelector(type, partKey) {
  const c = COMPONENTS[type];
  const part = c?.parts.find((p) => p.key === partKey);
  return part ? part.selector : null;
}

export function partLabel(type, partKey) {
  const c = COMPONENTS[type];
  return c?.parts.find((p) => p.key === partKey)?.label ?? partKey;
}
