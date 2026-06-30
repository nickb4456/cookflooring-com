# Cook Flooring & Tile

Marketing site for **Cook Flooring & Tile** — a father-and-son crew installing
and refinishing hardwood floors, bathroom/shower tile, LVP, and decks across
Rhode Island. Static homepage plus crawlable service landing pages, with two
scroll-driven Three.js scenes on the homepage (a deck being built, and hardwood
planks landing). No backend.

Slogan: _Built by hand, across Rhode Island._ Cranston, RI.

## Why this folder exists

The site began as one 2,935-line `index.html` at
`~/Downloads/courtyard-scroll-hero/index.html` — CSS, markup, two Three.js
module scenes, and the UI scripts all inline. This is the same site, **split by
concern** so each piece is editable in isolation. The split is byte-faithful:
every block was extracted verbatim (no reformatting), so behavior is identical.

## File map (the index)

```
86-cook-flooring/
├── index.html              Markup + SEO. Two things stay inline on purpose:
│                           the JSON-LD @graph (business + WebSite + FAQ — read
│                           by crawlers at parse time) and the Three.js
│                           <script type="importmap"> (must precede the modules).
├── services/               Crawlable SEO landing pages for hardwood install,
│                           refinishing, bathroom tile, LVP, and decks.
├── css/
│   └── styles.css          All styling (1,147 lines, was the single <style>).
├── js/
│   ├── header-scroll.js    Solidifies the sticky header past the hero fold.
│   ├── hero-deck-scene.js  [module] Three.js scene on #heroCanvas — the deck
│   │                       assembles plank by plank as you scroll the hero.
│   ├── floor-scene.js      [module] Three.js scene on #floorCanvas — polished
│   │                       hardwood with RoomEnvironment reflections.
│   ├── scene-fallback.js   If a 3D module fails (offline/blocked CDN), show a
│   │                       message instead of hanging on the loader.
│   ├── reveal-animations.js Staggered IntersectionObserver entrance for the
│   │                       "real work" sections.
│   └── quote-form.js        Quote form → Formspree if configured, always shows
│                           a thank-you. No other backend.
├── assets/                 Real job photos + logo.svg (no stock imagery).
├── robots.txt · sitemap.xml · llms.txt
├── README.md · PROJECT_BRIEF.md · CHANGELOG.md
```

## Sections (in scroll order)

`hero` → `floor` → `work` → `services` → `bathrooms` → `area` → `about` →
`why` → `faq` → `quote`.

## How the pieces connect

- **Three.js loads via importmap, not bundling.** The inline
  `<script type="importmap">` maps `three` → jsdelivr `three@0.160.0`. Both
  module files (`hero-deck-scene.js`, `floor-scene.js`) `import * as THREE from
"three"` and the browser resolves it. `floor-scene.js` also pulls
  `RoomEnvironment` directly from a full jsdelivr URL.
- **The 3D textures are procedural** (CanvasTexture / generated geometry), so
  the scenes need no image assets — `assets/` is only the photo galleries.
- **No server.** The quote form emails leads to **nickbilodeau1150@gmail.com**
  (it opens the visitor's mail app prefilled, via the form's `data-owner-email`).
  If you later paste a Formspree endpoint into the form `action=`, it POSTs there
  instead. Phone everywhere is **(401) 602-0958**. Everything else is static.

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

**Must be served over http(s), not opened as `file://`.** External ES modules +
importmap are blocked under the `file://` origin. Any static host works
(the production target is `cookflooring.com`).

## Editing common things

| Want to change…         | Edit…                                                      |
| ----------------------- | ---------------------------------------------------------- |
| Phone / email / address | JSON-LD `@graph`, footer, callbar, form `data-owner-email` |
| Service-area towns      | `areaServed` in the JSON-LD + the `area` section           |
| Colors / fonts          | top of `css/styles.css` (CSS variables)                    |
| Hero deck animation     | `js/hero-deck-scene.js` (`WOOD`, `DECK_W/D` config)        |
| Hardwood floor look     | `js/floor-scene.js` (`FLOOR_W/D`, `PLANK_W` config)        |
| Three.js version        | the `importmap` in `index.html`                            |
| Quote-form destination  | form `data-owner-email` (mailto) or Formspree `action=`    |
