/**
 * Scenes for Timeline mode. A scene is a small layout with several named
 * elements. Each element carries data-el="<id>" so the timeline can target
 * it; elements that repeat (cards, links) share an id and are "multi".
 */

export const SCENES = {
  hero: {
    label: "Hero section",
    elements: [
      { id: "eyebrow", label: "Eyebrow" },
      { id: "heading", label: "Heading" },
      { id: "text", label: "Paragraph" },
      { id: "button", label: "Primary button" },
      { id: "button2", label: "Secondary button" },
      { id: "visual", label: "Visual" },
    ],
    markup: `<section class="sc-hero">
  <span class="sc-eyebrow" data-el="eyebrow">New · Timeline mode</span>
  <h1 class="sc-heading" data-el="heading">Design motion visually</h1>
  <p class="sc-text" data-el="text">Sequence every element on one timeline, then export plain JavaScript.</p>
  <div class="sc-actions">
    <button class="sc-btn primary" data-el="button">Get started</button>
    <button class="sc-btn" data-el="button2">See presets</button>
  </div>
  <div class="sc-visual" data-el="visual"></div>
</section>`,
    css: `.sc-hero {
  width: min(560px, 100%);
  display: grid;
  gap: 16px;
  justify-items: start;
  font-family: system-ui, sans-serif;
}
.sc-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: {{accent}};
}
.sc-heading {
  margin: 0;
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-weight: 800;
}
.sc-text {
  margin: 0;
  font-size: 17px;
  line-height: 1.5;
  opacity: 0.75;
  max-width: 44ch;
}
.sc-actions {
  display: flex;
  gap: 10px;
}
.sc-btn {
  font: 600 14px system-ui, sans-serif;
  padding: 12px 20px;
  border-radius: 10px;
  border: 1px solid rgba(127, 127, 140, 0.35);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.sc-btn.primary {
  background: {{accent}};
  border-color: {{accent}};
  color: #fff;
}
.sc-visual {
  width: 100%;
  height: 160px;
  border-radius: 16px;
  background: linear-gradient(135deg, {{accent}}, #ec4899);
  margin-top: 8px;
}`,
  },

  cards: {
    label: "Card grid",
    elements: [
      { id: "heading", label: "Heading" },
      { id: "card", label: "Cards", multi: true },
    ],
    markup: `<section class="sc-cards">
  <h2 class="sc-cards-heading" data-el="heading">Everything you need</h2>
  <div class="sc-grid">
    <article class="sc-card" data-el="card"><span class="sc-card-icon"></span><strong>Fast</strong><span>Tuned springs and easings by default.</span></article>
    <article class="sc-card" data-el="card"><span class="sc-card-icon"></span><strong>Simple</strong><span>One timeline, every element.</span></article>
    <article class="sc-card" data-el="card"><span class="sc-card-icon"></span><strong>Portable</strong><span>Exports to plain JavaScript.</span></article>
  </div>
</section>`,
    css: `.sc-cards {
  width: min(640px, 100%);
  display: grid;
  gap: 20px;
  font-family: system-ui, sans-serif;
}
.sc-cards-heading {
  margin: 0;
  font-size: 28px;
  letter-spacing: -0.02em;
  font-weight: 700;
}
.sc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.sc-card {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 14px;
  background: #1c1c22;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
}
.sc-card span:last-child {
  opacity: 0.7;
}
.sc-card-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: {{accent}};
}
@media (max-width: 520px) {
  .sc-grid { grid-template-columns: 1fr; }
}`,
  },

  nav: {
    label: "Navigation bar",
    elements: [
      { id: "logo", label: "Logo" },
      { id: "link", label: "Links", multi: true },
      { id: "cta", label: "Call to action" },
    ],
    markup: `<nav class="sc-nav">
  <span class="sc-logo" data-el="logo"><i></i> Studio</span>
  <div class="sc-links">
    <a href="#" data-el="link">Product</a>
    <a href="#" data-el="link">Pricing</a>
    <a href="#" data-el="link">Docs</a>
    <a href="#" data-el="link">Blog</a>
  </div>
  <button class="sc-btn primary sc-cta" data-el="cta">Sign up</button>
</nav>`,
    css: `.sc-nav {
  width: min(680px, 100%);
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(127, 127, 140, 0.3);
  font-family: system-ui, sans-serif;
}
.sc-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}
.sc-logo i {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: {{accent}};
}
.sc-links {
  display: flex;
  gap: 18px;
  flex: 1;
  justify-content: center;
}
.sc-links a {
  color: inherit;
  text-decoration: none;
  font-size: 14px;
  opacity: 0.8;
}
.sc-btn {
  font: 600 14px system-ui, sans-serif;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid {{accent}};
  background: {{accent}};
  color: #fff;
  cursor: pointer;
}`,
  },

  custom: {
    label: "Your own HTML",
    elements: [],
    markup: "",
    css: "",
  },
};

export function sceneLabel(type) {
  return SCENES[type]?.label || type;
}

/**
 * Elements of a scene. For custom HTML, every top-level element becomes
 * a target; repeated tags with the same class become one "multi" target.
 */
export function sceneElements(scene) {
  if (scene.type !== "custom") return SCENES[scene.type].elements;
  const tpl = document.createElement("template");
  tpl.innerHTML = scene.customHtml || "";
  const groups = new Map();
  for (const child of tpl.content.children) {
    const key = child.className ? `${child.tagName.toLowerCase()}.${child.className.split(/\s+/)[0]}` : child.tagName.toLowerCase();
    const id = key.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    if (!groups.has(id)) {
      const text = (child.textContent || "").trim().slice(0, 18);
      groups.set(id, { id, label: `${child.tagName.toLowerCase()}${text ? ` “${text}”` : ""}`, count: 0 });
    }
    groups.get(id).count++;
  }
  return [...groups.values()].map((g) => ({ id: g.id, label: g.count > 1 ? `${g.label} ×${g.count}` : g.label, multi: g.count > 1 }));
}

/** Markup with data-el attributes (custom HTML gets them injected). */
export function sceneMarkup(scene) {
  if (scene.type !== "custom") return SCENES[scene.type].markup;
  const tpl = document.createElement("template");
  tpl.innerHTML = scene.customHtml || "";
  for (const child of tpl.content.children) {
    const key = child.className ? `${child.tagName.toLowerCase()}.${child.className.split(/\s+/)[0]}` : child.tagName.toLowerCase();
    child.setAttribute("data-el", key.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, ""));
  }
  return `<div class="sc-custom">\n${tpl.innerHTML}\n</div>`;
}

export function sceneCss(scene) {
  const css = scene.type === "custom" ? ".sc-custom { display: grid; gap: 12px; justify-items: start; }" : SCENES[scene.type].css;
  return css.replace(/\{\{accent\}\}/g, scene.accent || "#7c3aed");
}

export function isMultiElement(scene, elId) {
  return !!sceneElements(scene).find((e) => e.id === elId)?.multi;
}

export function elementLabel(scene, elId) {
  return sceneElements(scene).find((e) => e.id === elId)?.label || elId;
}

/** Selector for an element in exported code. */
export function elementSelector(elId) {
  return `[data-el="${elId}"]`;
}
