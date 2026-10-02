import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite";
import { routeValues } from "./src/seo.js";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Emit /v2 (v2.html): the same app shell with the Timeline route's own head. */
function timelineRoute() {
  return {
    name: "timeline-route",
    apply: "build",
    closeBundle() {
      const v = routeValues("timeline");
      const html = readFileSync("dist/index.html", "utf8")
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(v.title)}</title>`)
        .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(v.description)}$2`)
        .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${v.url}$2`)
        .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${v.url}$2`)
        .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(v.title)}$2`)
        .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${esc(v.ogDescription)}$2`)
        .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(v.title)}$2`)
        .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(v.ogDescription)}$2`);
      // v2.html is served at /v2 by Cloudflare Pages (clean URLs) without a trailing-slash redirect.
      writeFileSync("dist/v2.html", html);
    },
  };
}

export default defineConfig({
  plugins: [timelineRoute()],
  build: {
    target: "es2020",
    sourcemap: false,
  },
});
