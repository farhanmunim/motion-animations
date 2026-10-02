// Per-route metadata. Shared by the app (keeps the head in sync when the mode
// switches) and the build (bakes the same values into /v2/index.html so crawlers
// that don't run JavaScript see the right title, description and canonical).
export const SITE = "https://motion.farhan.app";

export const ROUTES = {
  quick: {
    path: "/",
    title: "Motion Studio – Visual animation builder for motion.dev",
    description: "Design motion.dev animations visually, preview them live and export copy-paste JavaScript for any HTML page. Free, no sign-up.",
    ogDescription: "Design motion.dev animations visually and export ready-to-paste JavaScript. Presets, UI components, live preview, no build step required.",
  },
  timeline: {
    path: "/v2",
    title: "Motion Studio – Timeline (v2): choreograph elements on one timeline",
    description: "Choreograph several elements on one visual timeline. Drag blocks to set timing, scrub the playhead, then export a single motion.dev sequence.",
    ogDescription: "Choreograph a hero, cards and a nav bar on one timeline and export a single motion.dev sequence as plain JavaScript.",
  },
};

/** Apply a route's metadata to a document head (or an HTML string, at build time). */
export const META_TARGETS = [
  ["title", null, "title"],
  ['meta[name="description"]', "content", "description"],
  ['link[rel="canonical"]', "href", "url"],
  ['meta[property="og:url"]', "content", "url"],
  ['meta[property="og:title"]', "content", "title"],
  ['meta[property="og:description"]', "content", "ogDescription"],
  ['meta[name="twitter:title"]', "content", "title"],
  ['meta[name="twitter:description"]', "content", "ogDescription"],
];

export function routeValues(mode) {
  const r = ROUTES[mode];
  return { ...r, url: SITE + r.path };
}
