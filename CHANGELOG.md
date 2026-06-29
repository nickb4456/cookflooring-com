# Changelog

## 2026-06-28 — Live polish pass

- Replaced remaining bathroom placeholder tiles with real job photos.
- Removed generic structured-data social links that were not connected to real
  Cook Flooring profiles.
- Changed the trust cards from star-styled blocks to proof-point labels.
- Disabled the fake Formspree action so the quote form reliably falls back to
  the owner email draft until a real endpoint is added.
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
