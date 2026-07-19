# Changelog

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
