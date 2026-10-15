/**
 * One place for everything search engines and social networks read.
 *
 *  - SITE holds the defaults shared by every page.
 *  - ROUTES holds what differs per page (a page can override any default).
 *  - headTags() turns a route into the <head> markup, used by the build (see
 *    vite.config.js) so the served HTML is complete before any JavaScript runs.
 *  - The app calls routeValues()/jsonLd() to keep the head in step when the
 *    mode is switched without a page load.
 */

export const SITE = {
  url: "https://motion.farhan.app",
  name: "Motion Studio",
  lang: "en-GB",
  locale: "en_GB",
  author: "Farhan",
  authorUrl: "https://farhan.app",
  robots: "index, follow, max-image-preview:large",
  themeDark: "#0e0e13",
  themeLight: "#f4f4f8",
  image: {
    path: "/og.png",
    type: "image/png",
    width: 1200,
    height: 630,
    alt: "Motion Studio: a visual animation builder for motion.dev",
  },
};

export const ROUTES = {
  quick: {
    path: "/",
    title: "Motion Studio – Visual animation builder for motion.dev",
    description: "Design motion.dev animations visually, preview them live and export copy-paste JavaScript for any HTML page. Free, no sign-up.",
    ogDescription: "Design motion.dev animations visually and export ready-to-paste JavaScript. Presets, UI components, live preview, no build step required.",
    appName: "Motion Studio",
    appDescription: "Visually design motion.dev animations, preview them live and export copy-paste JavaScript for any HTML page.",
  },
  timeline: {
    path: "/v2",
    title: "Motion Studio – Timeline (v2): choreograph elements on one timeline",
    description: "Choreograph several elements on one visual timeline. Drag blocks to set timing, scrub the playhead, then export a single motion.dev sequence.",
    ogDescription: "Choreograph a hero, cards and a nav bar on one timeline and export a single motion.dev sequence as plain JavaScript.",
    appName: "Motion Studio Timeline",
    appDescription: "Choreograph several elements on one visual timeline and export a single motion.dev sequence as copy-paste JavaScript.",
  },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A route's values with the shared defaults filled in. */
export function routeValues(mode) {
  const r = ROUTES[mode];
  return {
    ...r,
    url: SITE.url + r.path,
    image: SITE.url + SITE.image.path,
    imageAlt: SITE.image.alt,
  };
}

/** Schema.org description of the page. Only states what is true of the page. */
export function jsonLd(mode) {
  const v = routeValues(mode);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: v.appName,
    url: v.url,
    description: v.appDescription,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: SITE.lang,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
    author: { "@type": "Person", name: SITE.author, url: SITE.authorUrl },
  };
}

/** The SEO and social tags for a page, as <head> markup. */
export function headTags(mode) {
  const v = routeValues(mode);
  const meta = (attr, key, value) => `    <meta ${attr}="${key}" content="${esc(value)}" />`;
  return [
    `    <title>${esc(v.title)}</title>`,
    meta("name", "description", v.description),
    meta("name", "author", SITE.author),
    meta("name", "application-name", SITE.name),
    meta("name", "robots", SITE.robots),
    `    <meta name="theme-color" content="${SITE.themeDark}" media="(prefers-color-scheme: dark)" />`,
    `    <meta name="theme-color" content="${SITE.themeLight}" media="(prefers-color-scheme: light)" />`,
    `    <link rel="canonical" href="${v.url}" />`,
    meta("property", "og:type", "website"),
    meta("property", "og:site_name", SITE.name),
    meta("property", "og:locale", SITE.locale),
    meta("property", "og:title", v.title),
    meta("property", "og:description", v.ogDescription),
    meta("property", "og:url", v.url),
    meta("property", "og:image", v.image),
    meta("property", "og:image:type", SITE.image.type),
    meta("property", "og:image:width", SITE.image.width),
    meta("property", "og:image:height", SITE.image.height),
    meta("property", "og:image:alt", v.imageAlt),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", v.title),
    meta("name", "twitter:description", v.ogDescription),
    meta("name", "twitter:image", v.image),
    meta("name", "twitter:image:alt", v.imageAlt),
    `    <script type="application/ld+json">${JSON.stringify(jsonLd(mode))}</script>`,
  ].join("\n");
}

/** Tags the app keeps in step with the route: [selector, attribute (null = text), value key]. */
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

/** The sitemap, generated from the same routes. */
export function sitemapXml(lastmod) {
  const urls = Object.keys(ROUTES)
    .map((mode) => `  <url>\n    <loc>${routeValues(mode).url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
