/**
 * Library categories, shared by the app and by the build step that pre-renders
 * the library into the HTML for search engines.
 */
export const CATEGORIES = [
  { id: "component", label: "UI components", short: "Components", tag: "component" },
  { id: "entrance", label: "Entrances", short: "Entrances", tag: "entrance" },
  { id: "text", label: "Text", short: "Text", tag: "text" },
  { id: "multiple", label: "Lists & grids", short: "Lists", tag: "multiple" },
  { id: "interaction", label: "Pointer, hover & press", short: "Pointer", tag: "interaction" },
  { id: "effect", label: "Effects", short: "Effects", tag: "effect" },
  { id: "scroll", label: "Scroll", short: "Scroll", tag: "scroll" },
  { id: "loop", label: "Loops & attention", short: "Loops", tag: "loop", extra: "attention" },
];

/** Stable per-preset category: the first category that has one of its tags. */
export function primaryCategory(preset) {
  return CATEGORIES.find((c) => preset.tags.includes(c.tag) || (c.extra && preset.tags.includes(c.extra)))?.id || "entrance";
}
