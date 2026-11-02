/**
 * Library thumbnails. Every component gets a small drawn icon that says what it
 * is (a dock looks like a dock), instead of an anonymous blob. Icons use the
 * current text colour, so they work in both themes.
 */

const SVG = (inner) =>
  `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const FILL = `fill="currentColor" stroke="none"`;

const ICONS = {
  menu: `<path d="M4 7h16M4 12h16M4 17h16"/>`,
  list: `<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".9" ${FILL}/><circle cx="4.5" cy="12" r=".9" ${FILL}/><circle cx="4.5" cy="18" r=".9" ${FILL}/>`,
  grid: `<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>`,
  card: `<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M4 13h16"/>`,
  dropdown: `<rect x="3" y="3.5" width="18" height="6" rx="2"/><path d="M6 14h12M6 18h8"/>`,
  modal: `<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9.5h18"/>`,
  drawer: `<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M14 4v16"/>`,
  accordion: `<path d="M5 5h14M5 19h14"/><path d="m8 10 4 4 4-4"/>`,
  toggle: `<rect x="2.5" y="7" width="19" height="10" rx="5"/><circle cx="16.5" cy="12" r="2.8" ${FILL}/>`,
  tooltip: `<path d="M5 4.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-5l-2 3.5-2-3.5H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"/>`,
  toast: `<rect x="3" y="14" width="18" height="6" rx="3"/><path d="M7 17h6"/><path d="M12 4v6M9 7l3-3 3 3"/>`,
  fab: `<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>`,
  tilt: `<path d="M5 8.5 18 5v11L5 19.5z"/><path d="M5 13 18 10"/>`,
  spotlight: `<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>`,
  layers: `<path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/>`,
  flip: `<path d="M4 10a8 8 0 0 1 14-3.5l2 1.5"/><path d="M20 3.5V8h-4.5"/><path d="M20 14a8 8 0 0 1-14 3.5L4 16"/><path d="M4 20.5V16h4.5"/>`,
  image: `<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.7"/><path d="m21 16-5-5-8 8"/>`,
  link: `<path d="M4 12h13M12 6l6 6-6 6"/><path d="M4 20h9" opacity=".5"/>`,
  fill: `<rect x="3" y="7" width="18" height="10" rx="3.5"/><path d="M6.5 7H12v10H6.5a3.5 3.5 0 0 1-3.5-3.5v-3A3.5 3.5 0 0 1 6.5 7z" ${FILL}/>`,
  dock: `<rect x="2.5" y="14" width="19" height="6.5" rx="3"/><rect x="5.5" y="9" width="4" height="4" rx="1.2"/><rect x="10" y="6.5" width="4" height="6.5" rx="1.2"/><rect x="14.5" y="9" width="4" height="4" rx="1.2"/>`,
  compare: `<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M12 5v14"/><path d="m9 10-2.2 2L9 14M15 10l2.2 2L15 14"/>`,
  popover: `<rect x="3" y="3" width="18" height="12" rx="3.5"/><rect x="7.5" y="18" width="9" height="3.5" rx="1.75"/>`,
  toolbar: `<rect x="2" y="8" width="20" height="8" rx="4"/><circle cx="7" cy="12" r="1" ${FILL}/><circle cx="12" cy="12" r="1" ${FILL}/><circle cx="17" cy="12" r="1" ${FILL}/>`,
  marquee: `<path d="M3 8h18M3 16h18"/><path d="m17.5 5 3 3-3 3M6.5 13l-3 3 3 3"/>`,
  trail: `<rect x="4" y="4" width="16" height="16" rx="4.5" stroke-dasharray="3.2 3"/>`,
  glow: `<path d="M12 3.5 14 9l5.5 2-5.5 2-2 5.5L10 13l-5.5-2L10 9z"/>`,
  counter: `<text x="12" y="16.3" text-anchor="middle" font-size="11" font-weight="800" font-family="system-ui, sans-serif" ${FILL}>123</text>`,
  type: `<text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="800" font-family="system-ui, sans-serif" ${FILL}>Aa</text>`,
  shimmer: `<text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="800" font-family="system-ui, sans-serif" ${FILL} opacity=".55">Aa</text><path d="M18.5 3.5v3M17 5h3" />`,
  repeat: `<path d="M17 3.5 20.5 7 17 10.5"/><path d="M3.5 12V11a4 4 0 0 1 4-4h13"/><path d="M7 20.5 3.5 17 7 13.5"/><path d="M20.5 12v1a4 4 0 0 1-4 4h-13"/>`,
  roll: `<path d="M8 4v16M4.5 7.5 8 4l3.5 3.5M16 20V4M12.5 16.5 16 20l3.5-3.5"/>`,
  spin: `<path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 3.5v5h-5"/>`,
  shuffle: `<path d="M16 3.5h4.5V8M3.5 20.5 20.5 3.5M20.5 16v4.5H16M14.5 14.5l6 6M3.5 3.5l5.5 5.5"/>`,
  copy: `<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>`,
  hold: `<circle cx="12" cy="12" r="8.5" opacity=".35"/><path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5"/><circle cx="12" cy="12" r="2" ${FILL}/>`,
  stack: `<rect x="6" y="8" width="12" height="12" rx="2.5"/><path d="M8.5 4.5h7M10.5 2h3"/>`,
  radial: `<circle cx="12" cy="18" r="3"/><circle cx="4.5" cy="10" r="1.7"/><circle cx="12" cy="5" r="1.7"/><circle cx="19.5" cy="10" r="1.7"/>`,
  command: `<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/>`,
  ripples: `<circle cx="12" cy="12" r="2" ${FILL}/><circle cx="12" cy="12" r="5.8"/><circle cx="12" cy="12" r="9.5" opacity=".5"/>`,
  draw: `<path d="M3 17c3.5-9 6 4 9-1.5s5.5-6.5 9-9"/>`,
  cursor: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.8" ${FILL}/>`,
  blinds: `<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16M15 4v16" /><path d="M3 12h18" opacity="0"/>`,
  iris: `<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="12" cy="12" r="4.2"/>`,
  morph: `<rect x="3.5" y="4" width="8" height="8" rx="2"/><circle cx="16.5" cy="16.5" r="4"/><path d="M11.5 8h3a2 2 0 0 1 2 2v2"/>`,
  swap: `<path d="M6.5 7.5h12l-3-3.5M17.5 16.5h-12l3 3.5"/>`,
  tabs: `<rect x="3" y="6" width="18" height="12" rx="3.5"/><rect x="5" y="8" width="6.5" height="8" rx="2" ${FILL}/>`,
  carousel: `<rect x="6" y="4.5" width="12" height="10" rx="2.5"/><path d="M3 7.5v4M21 7.5v4"/><circle cx="9" cy="19" r="1" ${FILL}/><circle cx="12" cy="19" r="1" ${FILL}/><circle cx="15" cy="19" r="1" ${FILL}/>`,
  scroll: `<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 7.5v3"/>`,
  pointer: `<path d="m5 4 6.5 16 2.4-6.6L20.5 11z"/>`,
  magnet: `<path d="M6 14V4h4v10a2 2 0 0 0 4 0V4h4v10a6 6 0 0 1-12 0z"/><path d="M6 8h4M14 8h4"/>`,
  press: `<circle cx="12" cy="12" r="3" ${FILL}/><circle cx="12" cy="12" r="7.5"/>`,
};

/** Which icon a component type uses. */
const BY_COMPONENT = {
  hamburger: "menu", dropdown: "dropdown", modal: "modal", drawer: "drawer", accordion: "accordion", switch: "toggle",
  tooltip: "tooltip", toast: "toast", fab: "fab", tiltcard: "tilt", spotlight: "spotlight", parallax: "layers", flipcard: "flip",
  imagecard: "image", linkarrow: "link", fillbtn: "fill", dock: "dock", compare: "compare", popover: "popover", toolbar: "toolbar",
  marquee: "marquee", bordertrail: "trail", glow: "glow", counter: "counter", shimmer: "shimmer", textloop: "repeat", roll: "roll",
  spintext: "spin", copybtn: "copy", holdbtn: "hold", cardstack: "stack", radial: "radial", palette: "command", ripples: "ripples",
  pathdraw: "draw", cursorring: "cursor", blinds: "blinds", iris: "iris", filltext: "type", swapbtn: "swap", smoothtabs: "tabs",
  carousel: "carousel", morph: "morph",
};

/** Plain elements that read better as an icon than as an animated blob. */
const BY_PRESET = {
  "pointer-tilt": "tilt", "magnetic-button": "magnet", "press-squish": "press", "scroll-image-reveal": "image",
  "scroll-zoom-hero": "image", "bobble-hover": "pointer", "drag-card": "pointer",
};

export function thumbIcon(preset, element) {
  const key = BY_COMPONENT[element.type] || BY_PRESET[preset.id];
  return key ? SVG(ICONS[key]) : null;
}
