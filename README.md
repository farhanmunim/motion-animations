# Motion Studio

A lightweight web app for visually designing [motion.dev](https://motion.dev) animations and exporting them as ready-to-paste JavaScript for plain HTML/JS projects. No coding required to design; the export is plain, readable code you can drop into any page.

**What it does**

- **Library of ready-made animations.** Filter by category: UI components, entrances, text effects, lists and grids, pointer, hover and press interactions, scroll effects, and loops. Hover a card for a mini preview, then copy its code directly or edit it in the studio.
- **Working UI components.** Hamburger button, dropdown menu, modal dialog, side drawer, toast, accordion, toggle switch, tooltip, floating action menu, 3D tilt card, spotlight card, mouse parallax scene, flip card, image card with caption, link with arrow and underline, and a fill-on-hover button. Each is real markup whose parts (bars, panel, items...) animate separately and open or close on click. The export is a complete, accessible component you can paste in as is.
- **Animate anything.** A box, circle, heading, button, card, a list of items, a grid of tiles, or your own HTML. Headings can be split into words or letters so each piece animates on its own.
- **Follow pointer.** Cards that tilt in 3D toward wherever the pointer is, continuously, not just four corners. Each property follows the pointer's horizontal position, vertical position, or whether it is over the element, mapped between two values and smoothed with a spring. Use it for tilt, spotlight glow, parallax and magnetic buttons. The area can be the element or the whole stage. Exports ignore touch and skip the effect for visitors who prefer reduced motion. The preview plays a short demo sweep first.
- **Masked text reveals.** Turn on *Mask each piece* to make words or letters rise out of a clipped line, as on award-winning sites.
- **Every motion.dev knob, simplified.** From/to keyframes (plus in-between steps), timed easing or physics springs, delay, repeat, stagger, and triggers: on load, on click (toggle), on hover, on press, follow pointer, when scrolled into view, or linked to scroll position.
- **Live preview** that uses the real motion.dev library, so what you see is exactly what you export.
- **Export** as a drop-in `<script type="module">` (loads motion from a CDN, no install), a JS module for bundler projects, a complete HTML page, and the matching CSS.
- **Share links.** The whole design is encoded in the URL. Work is also saved locally so a refresh never loses it.
- **Timeline mode (v2).** Switch to *Timeline* in the top bar to choreograph several elements on one timeline: a hero section, a card grid, a nav bar, or your own HTML. Every element and property gets a row; actions are blocks you drag to change when they start and resize to change how long they take. Scrub the playhead, click an element in the preview to select it, and export the whole sequence as one motion.dev `animate()` call. Triggers: on load, on click (plays backwards on the second click), when scrolled into view, or scrubbed by scroll.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To produce the deployable static files:

```bash
npm run build   # outputs to dist/
```

## Deploy to Cloudflare (free)

**Cloudflare Pages (recommended, zero config)**

1. Push this repository to GitHub.
2. In the Cloudflare dashboard go to **Workers & Pages → Create → Pages → Connect to Git** and pick the repo.
3. Use these build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Save and deploy. Every push to the branch you selected redeploys automatically.

**Cloudflare Workers with static assets (alternative)**

A `wrangler.jsonc` is included, so you can also deploy from your machine:

```bash
npm run build
npx wrangler deploy
```

## Using the exported code

Pick a tab in the **Code** panel (or the **Export code** button):

| Tab | When to use it |
| --- | --- |
| **Script tag** | You have an HTML page and want the animation with no build step. Paste the element markup where it belongs and the `<script type="module">` block before `</body>`. |
| **JS module** | Your project uses a bundler (Vite, webpack, Parcel...). Run `npm install motion` and import the file. |
| **Full page** | A self-contained demo file. Save it as `.html` and open it in a browser. |
| **CSS** | Optional styles that make the element look like the preview. Skip it if you are animating your own element. |

The exported code targets elements by class: `.motion-target` for a single element, or `.motion-item` for each element in a group (list items, grid tiles, words, letters). Add those classes to your own HTML and the same code works on your content.

## Project layout

```
index.html         Page shell
src/main.js        Wires everything together
src/state.js       Store, defaults, URL/localStorage persistence
src/props.js       Registry of animatable properties, easings, triggers
src/presets.js     The animation library
src/components.js  UI components: markup, animatable parts, styles
src/compile.js     Turns editor state into motion.dev keyframes/options
src/preview.js     Live preview (uses motion.dev directly)
src/codegen.js     Generates the exported code
src/ui.js          Library sidebar, Design inspector, Code views
src/styles.css     Styling and theming
src/v2/            Timeline mode: scenes, store, sequence compiler,
                   preview, timeline editor, inspector, export
```

Adding a preset is a matter of appending an entry to `src/presets.js`. Adding an animatable property means adding one entry to `PROPS` in `src/props.js`. Adding a component means one entry in `src/components.js` (markup, parts, CSS), one option in `ELEMENT_TYPES`, and a preset that gives it a default animation.

## Tech

Vanilla JavaScript, [Vite](https://vite.dev) for dev/build, and [motion](https://www.npmjs.com/package/motion) as the only runtime dependency. The production bundle is under 40 kB gzipped.
