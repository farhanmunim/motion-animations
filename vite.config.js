import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite";
import { headTags, sitemapXml } from "./src/seo.js";
import { CATEGORIES, primaryCategory } from "./src/categories.js";
import { PRESETS } from "./src/presets.js";
import { TIMELINE_PRESETS } from "./src/v2/presets.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* --- Content that exists before any JavaScript runs ----------------------------------
 * The app draws its library and inspector in the browser. These are the same words,
 * written into the HTML at build time, so search engines, link previews and visitors on
 * slow connections get real content. The app replaces them as soon as it starts. */

const libraryHtml = () =>
  `<div class="static-library">${CATEGORIES.map((cat) => {
    const items = PRESETS.filter((p) => primaryCategory(p) === cat.id);
    return `<section><h3>${esc(cat.label)}</h3><ul>${items.map((p) => `<li>${esc(p.name)}</li>`).join("")}</ul></section>`;
  }).join("")}</div>`;

const timelineLibraryHtml = () =>
  `<div class="static-library"><section><h3>Sequences</h3><ul>${TIMELINE_PRESETS.map((p) => `<li>${esc(p.name)}</li>`).join("")}</ul></section></div>`;

const quickIntroHtml = () =>
  `<div class="static-intro"><h3>How it works</h3>` +
  `<p>Motion Studio is a free visual builder for <a href="https://motion.dev/docs">motion.dev</a> animations. ` +
  `Choose from ${PRESETS.length} ready-made animations and UI components, adjust them in the inspector, watch them play live, ` +
  `then copy plain JavaScript that works in any HTML page. There is no framework, sign-up or build step.</p>` +
  `<ol><li>Pick an animation from the library.</li><li>Tune its timing, easing and trigger.</li><li>Copy the code, or download a complete page.</li></ol>` +
  `<p>The library covers entrances, text effects, pointer and hover interactions, scroll effects, loops, and components such as dropdowns, modals, tabs and carousels.</p></div>`;

const timelineIntroHtml = () =>
  `<div class="static-intro"><h3>How it works</h3>` +
  `<p>Timeline mode lets you choreograph several elements on one timeline. Every element and property gets a row; ` +
  `each animation is a block you drag to change when it starts and resize to change how long it takes. ` +
  `Scrub the playhead to check the result, then export the whole sequence as one motion.dev <code>animate()</code> call.</p></div>`;

const fill = (html, key, content) => html.replace(new RegExp(`<!--s:${key}-->[\\s\\S]*?<!--/s:${key}-->`), `<!--s:${key}-->${content}<!--/s:${key}-->`);
const setHead = (html, mode) => html.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n${headTags(mode)}\n    <!--seo:end-->`);

/** Everything that depends on the route, applied to the app shell. */
function forRoute(html, mode) {
  const timeline = mode === "timeline";
  let out = setHead(html, mode);
  out = fill(out, "ql", timeline ? "" : libraryHtml());
  out = fill(out, "qi", timeline ? "" : quickIntroHtml());
  out = fill(out, "tl", timeline ? timelineLibraryHtml() : "");
  out = fill(out, "ti", timeline ? timelineIntroHtml() : "");
  if (timeline) {
    // First paint already shows the right mode: no flash, no layout shift.
    out = out.replace('<body data-mode="quick">', '<body data-mode="timeline">');
    out = out.replace('class="mode active" data-mode="quick" aria-pressed="true"', 'class="mode" data-mode="quick" aria-pressed="false"');
    out = out.replace('class="mode" data-mode="timeline" aria-pressed="false"', 'class="mode active" data-mode="timeline" aria-pressed="true"');
  }
  return out;
}

function seo() {
  return {
    name: "seo",
    // The home page (and the dev server) get their head and content here.
    transformIndexHtml: { order: "pre", handler: (html) => forRoute(html, "quick") },
    // The Timeline route is its own file, so /v2 is a real page with its own metadata.
    // Cloudflare Pages serves v2.html at /v2 without a trailing-slash redirect.
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml(new Date().toISOString().slice(0, 10)) });
    },
    closeBundle() {
      writeFileSync("dist/v2.html", forRoute(readFileSync("dist/index.html", "utf8"), "timeline"));
    },
  };
}

export default defineConfig({
  plugins: [seo()],
  build: {
    target: "es2020",
    sourcemap: false,
  },
});
