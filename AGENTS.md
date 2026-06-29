# Cook Flooring & Tile — agent context

Static marketing site for **Cook Flooring & Tile**, a father-and-son Rhode
Island flooring/tile/deck business (Cranston, RI). Production target:
cookflooring.com. No backend, no build step.

This is the de-monolithed version of a single 2,935-line HTML file. Same design,
split by concern, byte-faithful.

## Layout

- `index.html` — markup. Two things are inline on purpose and must stay inline:
  the JSON-LD `@graph` (SEO: business + WebSite + FAQ) and the Three.js
  `<script type="importmap">` (must be parsed before the module scripts).
- `css/styles.css` — all styling.
- `js/`
  - `header-scroll.js` — sticky-header solidify on scroll.
  - `hero-deck-scene.js` — [ES module] Three.js scene on `#heroCanvas`; the deck
    assembles plank by plank as you scroll the hero. Config consts at top
    (`WOOD`, `DECK_W`, `DECK_D`, `DECK_TOP`).
  - `floor-scene.js` — [ES module] Three.js scene on `#floorCanvas`; polished
    hardwood with RoomEnvironment reflections. Config: `FLOOR_W/D`, `PLANK_W`.
  - `scene-fallback.js` — shows a message if a 3D module fails (offline/blocked CDN).
  - `reveal-animations.js` — IntersectionObserver staggered section reveals.
  - `quote-form.js` — emails leads to the owner Gmail via `mailto` (prefilled),
    or POSTs to Formspree if an endpoint is wired into the form `action=`.
- `assets/` — real job photos + `logo.svg`. 3D textures are procedural, not files.

## Run / verify

```
python3 -m http.server 8000   # then http://localhost:8000
```

**Must be served over http(s) — not opened as `file://`.** External ES modules +
the importmap are blocked under the `file://` origin. To verify the 3D scenes,
serve and load in a real browser (or headless Chromium with WebGL); check both
canvases init and the console is clean.

## Conventions / gotchas

- Three.js comes from the inline importmap (`three@0.160.0` via jsdelivr) — no
  bundler. Change the version there.
- Contact details live in several places — keep them in sync: phone
  **(401) 602-0958** and email **nickbilodeau1150@gmail.com** appear in the
  JSON-LD, the footer, the callbar, and the form's `data-owner-email`.
- The street address + lat/long in the JSON-LD are the original sample
  (Cranston 02920) — confirm before relying on them.
- Edits to the 3D modules: avoid reformatting/dedenting whole files — they
  contain template literals and procedural-texture strings.

## Sections (scroll order)

hero · floor · work · services · bathrooms · area · about · why · faq · quote.
