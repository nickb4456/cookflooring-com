# Project Brief — 86-cook-flooring

Static marketing site for **Cook Flooring & Tile** (father-and-son flooring,
tile, and deck crew, Cranston RI). Two scroll-driven Three.js scenes. No
backend. Production target: cookflooring.com.

De-monolithed rewrite of `~/Downloads/courtyard-scroll-hero/index.html` (one
2,935-line file). Same content/design, split by concern, byte-faithful.

## Structure

- `index.html` — markup + inline JSON-LD `@graph` (business/WebSite/FAQ) +
  inline Three.js importmap.
- `css/styles.css` — all styles.
- `js/` — `header-scroll`, `hero-deck-scene` (module, #heroCanvas),
  `floor-scene` (module, #floorCanvas), `scene-fallback`, `reveal-animations`,
  `quote-form`.
- `assets/` — real job photos + `logo.svg`.

## Gotchas

- **Serve over http, never file://** — external ES modules + importmap won't run
  on the file:// origin.
- **importmap stays inline and before the module scripts** (`three@0.160.0` via
  jsdelivr). Module files resolve `import ... from "three"` through it.
- 3D scene textures/geometry are procedural — no texture assets to ship.
- Quote form: if a Formspree endpoint is wired into the form `action=` it POSTs
  there; otherwise it opens the visitor's email app prefilled to the owner
  address in `data-owner-email` (nickbilodeau1150@gmail.com). Always confirms.
- Contact: phone **(401) 602-0958**, email **nickbilodeau1150@gmail.com** (set
  in the JSON-LD, footer, callbar, and the form's `data-owner-email`).

## Sections

hero · floor · work · services · bathrooms · area · about · why · faq · quote.

## Next ideas (unbuilt)

- Optionally wire a Formspree (or serverless) endpoint so leads arrive without
  the visitor's mail client opening (current default is mailto → owner Gmail).
- Lighthouse / perf pass (defer Three.js work off the main thread, lazy-init the
  floor scene only when scrolled near).
- Photo lightbox for the work gallery.
- Per-town landing pages for local SEO.
