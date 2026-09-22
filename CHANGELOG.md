# Changelog

## 2026-09-22 (night) — Estimate section alignment

- The estimate section (#quote) now uses the same 1320px centered content
  column as every other section. It ran edge to edge on wide screens, with the
  form card pinned to the right edge (1920: 538/72 px vs 300/300 elsewhere).
- The form card is capped at half the width, so at 1024px the headline column
  is no longer crushed to 300px. `home-v3.css?v=3`.

## 2026-09-22 (evening) — Homepage v3: black, white, and gold

- New standalone homepage: `index.html` body rebuilt from scratch, styled by
  `css/home-v3.css`, driven by `js/home-v3.js`. The homepage no longer loads
  `styles.min.css` or `stain-board.css`.
- Sections: full-bleed photo hero ("Rhode Island flooring, laid by hand."),
  gold town ticker, services as a large numbered index with a cursor-follow
  photo preview, bathroom before/after drag slider, pinned sideways work
  gallery (12 photos), crew section with the hammer video, 4-step process,
  decks mosaic, town list, FAQ, estimate form, giant wordmark footer, and a
  full-screen menu.
- Kept verbatim: head meta, JSON-LD, FAQ text, form fields/ids/hidden
  attribution inputs, Formspree action, tracking scripts, phone/email hooks.
- Removed from the homepage: both Three.js scenes (deck and floor), the ad
  reel video, the lightbox gallery, and the stage/"room by room" blocks. The
  JS files are still in `js/` if they come back.
- New brand mark: gold running-bond planks on an ink tile (`favicon.svg`,
  `assets/logo.svg`, `assets/logo-light.svg`).
- Inner pages keep their layout but load `css/showroom.css` after
  `stain-board.css`: white rooms, ink type, gold actions. Brown stain tones are
  gone site-wide.
- New images: `assets/v3/amber-hardwood-crew-{900,1600}.webp` (web-sized from
  `wide-hardwood-progress.jpg`).
- Effects (`js/home-vfx.js`, all off under reduced motion): dust drifting in
  the hero window light (canvas, paused off screen), a light sweep across the
  finish, cursor light, "plank wipe" photo reveals (six strips slide off in a
  running bond), magnetic gold buttons, gallery skew with scroll speed, and a
  faint film grain.
- Glows (`css/home-v3.css` glow block + `js/home-glow.js`): gold button halo,
  bloom and light sweep; glinting section rules; gold shimmer on hovered
  service names; pointer-following gold light in the dark sections; pulsing
  halo on the before/after handle; process numbers light up gold; light
  running around the estimate card edge; footer "Cook." lit by a drifting
  gold spotlight.

## 2026-09-22 — Stain-board redesign (whole site)

- New visual system in `css/stain-board.css`, loaded after `styles.min.css`
  (and after `city-pages.css`) on all 22 site pages, scoped to `body.sb`.
  Each section is a band in a real floor-stain tone (Natural, Golden oak,
  Special walnut, Jacobean, plus the logo's tile blue for bathrooms) with a
  faint procedural wood grain. Rollback = drop the link and the `sb` class.
- Type: Archivo variable (self-hosted `assets/fonts/archivo-var-latin.woff2`,
  OFL), expanded heavy cuts for headlines. Replaces Hepta Slab and the mono
  caps labels (`--font-mono` now points at Archivo inside `body.sb`).
- Action color: tile blue `#2b5f6e` (light tile `#9fcad3` on dark bands).
- Homepage masthead rebuilt as `.sb-hero`: full-width headline, three
  staggered photo boards, and a stain-swatch rail that doubles as section nav
  (Work, Decks, Bathrooms, About, Estimate). The four duplicated trust
  blocks (desktop list, mobile list, proof-point row, preview photo grid)
  became one list; the "What to expect" line moved into the lead.
- Service pages and the guide switched from the dark theme to the light
  header (`logo-light.svg`); theme-color is `#e6d2ae` everywhere.
- Phone: "Hardwood up close" gallery was 86 px slivers (also on the old live
  site); now two even rows.
- Unchanged: all copy, JSON-LD, forms, tracking, both Three.js scenes,
  lightbox, sitemap.

## 2026-09-21 — Deploy workflow for agents

- Added `_tools/deploy.py` (`check`, `build-css`, `ship`, `verify-live`) and
  `_tools/selftest.sh`. `ship` gates the commit, fast-forward pushes `main`,
  waits for the Pages build, then proves each changed file on cookflooring.com
  is byte-equal to the commit (Cloudflare email rewriting undone first).
- `AGENTS.md` gained a Deploy section; Codex skill `cook-flooring-deploy` points
  at it.
- Untracked `scratchpad/` (it was being served live) and `.reports/`. Both were
  committed before the ignore rule. Local copies kept.

## 2026-07-19 — Desktop board-row hero

- Replaced the desktop (≥921px) home masthead card — rounded, bordered, shadowed
  container with the photo boxed in its right pane — with a full-bleed board-row:
  the dark copy panel plus three edge-to-edge photo boards separated by hairline
  seams, sequenced as one job's arc (install in progress → transition detail →
  finished floor). Added the third figure (`masthead__finish`,
  white-oak-finished) hidden at all other widths.
- Captions became bottom-left mono labels on gradient scrims; boards settle in
  with a staggered load animation (disabled under `prefers-reduced-motion`);
  photo crops tuned floor-forward.
- Removed the home-page-only forced-solid header override so the home desktop
  gets the sitewide transparent-to-solid header behavior.
- Mobile and tablet verified pixel-identical to before (Playwright screenshot
  diff at 390 and 800 wide: empty bounding box).
- A mobile-only job-arc swipe strip was trialed under the hero and reverted
  same-day: the available progress/finished photos read as different floors
  (stain tones don't match across shots), so the strip undermined its own
  "one job" framing. Mobile ships unchanged.

## 2026-06-28 — Live polish pass

- Replaced remaining bathroom placeholder tiles with real job photos.
- Removed generic structured-data social links that were not connected to real
  Cook Flooring profiles.
- Changed the trust cards from star-styled blocks to proof-point labels.
- Wired the quote form to Formspree endpoint `mvzrqler`, with email-draft
  fallback still available if the endpoint is removed later.
- Added `CNAME` for `cookflooring.com`.

## 2026-06-28 — Real contact details

- Phone set to **(401) 602-0958** everywhere (JSON-LD, footer, callbar, llms.txt).
- Added owner email **nickbilodeau1150@gmail.com** to the JSON-LD, a footer
  `mailto:` link, and the quote form's `data-owner-email`.
- `quote-form.js` now emails the lead to that Gmail (mailto, prefilled) when no
  Formspree endpoint is configured; still POSTs to Formspree if one is added.

## 2026-06-28 — Initial split from monolith

- Forked from `~/Downloads/courtyard-scroll-hero/index.html` (single 2,935-line
  file) into a structured `web-apps/` project.
- Extracted the `<style>` block to `css/styles.css` (1,147 lines).
- Split the inline scripts into one file per concern:
  - `js/header-scroll.js`
  - `js/hero-deck-scene.js` (Three.js module, #heroCanvas)
  - `js/floor-scene.js` (Three.js module, #floorCanvas)
  - `js/scene-fallback.js`
  - `js/reveal-animations.js`
  - `js/quote-form.js`
- Kept inline (required there): the JSON-LD `@graph` (SEO) and the Three.js
  `<script type="importmap">` (must precede the module scripts).
- Copied `assets/`, `robots.txt`, `sitemap.xml`, `llms.txt`.
- Added `README.md` (file map / code index), `PROJECT_BRIEF.md`.
- **Byte-faithful:** every block extracted verbatim (no reformatting/dedent, to
  protect template literals in the 3D code). `index.html` 2,935 → 800 lines.
- Verified headless (Chromium + WebGL): both 3D canvases initialize, hero loader
  clears, all 10 sections present, scroll reveals fire, quote form mounts, zero
  console/page errors.
- Note: now requires http(s) serving (external ES modules) — was inline before.

## 2026-07-16

### Accessible work-gallery photo lightbox
Added keyboard-operable lightbox for all six `.gallery__grid` figures. Each figure gains
`tabindex="0"` and `role="button"`; Enter/Space/click opens a full-screen overlay;
Escape and backdrop-click close it; focus returns to the originating figure on close.
Loads the 960 w srcset image in a responsive, reduced-motion-aware dialog.

### Generic secure lead-endpoint support
Replaced the Formspree-only regex in `quote-form.js` with a `URL`-constructor HTTPS check
so any well-formed HTTPS endpoint (Netlify, Cloudflare Workers, Lambda, etc.) routes
through the existing fetch path instead of falling back to mailto.

### Paid-click lead attribution fields
Added hidden fields `utm_medium`, `utm_term`, `utm_content`, and `gclid` to the quote form
in `index.html`, populated from URL params at page load. Enables Google Ads offline
conversion import and full campaign attribution in Formspree lead records.
