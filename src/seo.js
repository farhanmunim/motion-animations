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
  /** Every farhan.app project carries this suffix in its title and credits Farhan in its description. */
  suffix: "farhan.app",
  author: "farhan.app",
  developer: "Farhan Munim",
  developerUrl: "https://farhan.app",
  /** The logo mark, as shown in the app's header. Used as the inline favicon. */
  iconSvg:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#18181b"/><path d="M7 24 12 8l5 10 4-7 4 13" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
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
    name: "Motion Studio",
    summary: "Design motion.dev animations visually and export copy-paste JavaScript for any HTML page",
    ogDescription: "Design motion.dev animations visually and export ready-to-paste JavaScript. Presets, UI components, live preview, no build step required.",
    appDescription: "Visually design motion.dev animations, preview them live and export copy-paste JavaScript for any HTML page.",
  },
  timeline: {
    path: "/v2",
    name: "Motion Studio Timeline",
    summary: "Choreograph several elements on one visual timeline and export a single motion.dev sequence",
    ogDescription: "Choreograph a hero, cards and a nav bar on one timeline and export a single motion.dev sequence as plain JavaScript.",
    appDescription: "Choreograph several elements on one visual timeline and export a single motion.dev sequence as copy-paste JavaScript.",
  },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A route's values with the shared defaults filled in. */
export function routeValues(mode) {
  const r = ROUTES[mode];
  return {
    ...r,
    title: `${r.name} — ${SITE.suffix}`,
    description: `${r.summary}. Built by Farhan — ${SITE.suffix}`,
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
    name: v.name,
    url: v.url,
    description: v.appDescription,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: SITE.lang,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
    author: { "@type": "Person", name: SITE.developer, url: SITE.developerUrl },
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
    `    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(SITE.iconSvg).replace(/'/g, "%27")}" />`,
    `    <link rel="icon" href="/favicon.ico" sizes="48x48" />`,
    `    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
    `    <meta name="theme-color" content="${SITE.themeDark}" media="(prefers-color-scheme: dark)" />`,
    `    <meta name="theme-color" content="${SITE.themeLight}" media="(prefers-color-scheme: light)" />`,
    `    <link rel="canonical" href="${v.url}" />`,
    meta("property", "og:type", "website"),
    meta("property", "og:site_name", v.name),
    meta("property", "og:locale", SITE.locale),
    meta("property", "og:title", v.title),
    meta("property", "og:description", v.ogDescription),
    meta("property", "og:url", v.url),
    meta("property", "og:image", v.image),
    meta("property", "og:image:type", SITE.image.type),
    meta("property", "og:image:width", SITE.image.width),
    meta("property", "og:image:height", SITE.image.height),
    meta("property", "og:image:alt", v.imageAlt),
    meta("name", "twitter:card", "summary"),
    meta("name", "twitter:title", v.title),
    meta("name", "twitter:description", v.description),
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
  ['meta[name="twitter:description"]', "content", "description"],
];

/** The sitemap, generated from the same routes. */
export function sitemapXml(lastmod) {
  const urls = Object.keys(ROUTES)
    .map((mode) => `  <url>\n    <loc>${routeValues(mode).url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
