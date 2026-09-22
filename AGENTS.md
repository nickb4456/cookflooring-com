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
- `css/styles.css` — base styling (older layers).
- `css/stain-board.css` — the current design (2026-09-22), loaded last on
  every page and scoped to `body.sb`. Style changes go here first. It is
  not minified, so `build-css` does not touch it; bump its `?v=` on every
  page when you edit it.
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

## Deploy (the only path to live)

Live = GitHub Pages from `main` of `nickb4456/cookflooring-com`, behind
Cloudflare, at https://cookflooring.com. A push to `main` IS a deploy (~40 s).
The repo is PUBLIC. One script owns the whole path:

```
_tools/deploy.py check         # offline gates on what HEAD would ship. Changes nothing.
_tools/deploy.py build-css     # rebuild css/styles.min.css from css/styles.css
_tools/deploy.py ship          # check -> fast-forward push -> wait for Pages -> prove live
_tools/deploy.py verify-live   # compare live files to HEAD (--all = every text file)
_tools/selftest.sh             # proves the gates still catch bad commits (run after editing deploy.py)
```

Steps, in order:

1. Work on `main` (or a `codex/<topic>` branch, then `git merge --ff-only` it
   into `main`). Commit only the files you changed, by name. Never `git add -A`:
   the tree holds Nick's uncommitted notes, campaign files, and raw photos.
2. If you touched `css/styles.css`: run `build-css`, then bump the `?v=` on the
   stylesheet link in EVERY page that links it (home, 5 service pages,
   service-area, guides). Same for any `js/*.js` you changed: bump its `?v=`
   on every page that loads it.
3. Visual change? Serve with `/usr/bin/python3 -m http.server 8000` (node is
   blocked by this Mac's firewall) and look at desktop 1440 and mobile 390
   before shipping. `codex exec` has no browser; do this in the Codex app.
4. `_tools/deploy.py check` until it prints `CLEAR`.
5. `_tools/deploy.py ship`. It needs network (git push, curl). In a sandboxed
   Codex session, request approval for that one command.
6. Report the last line of `ship` word for word. Only `SHIPPED and proven
   live: <sha>` means deployed. `HOLD` means say "not deployed" or "pushed,
   not proven", with the FAIL lines. The receipt lands in `.reports/deploys/`.

Laws:

- Never force-push, never `git reset` or `git stash` here, never edit `CNAME`.
- Never commit under `.reports/`, `scratchpad/`, `tmp/`. They are internal and
  this repo is public. `check` fails if any are tracked.
- `check` reads the COMMIT, not the disk. A photo that exists locally but was
  never committed fails the `links` gate, because it would 404 live.
- Live HTML never equals the commit byte for byte: Cloudflare rewrites
  `mailto:` links and injects `email-decode.min.js`. `verify-live` undoes that
  before comparing. Do not "fix" that diff in the HTML.
- GitHub reports the Pages HTTPS cert as `bad_authz`. That is expected:
  Cloudflare serves the edge certificate. Leave `https_enforced` alone.
- Rollback = `git revert <sha>` on `main`, then `_tools/deploy.py ship`.
- `_tools/` starts with an underscore so GitHub Pages does not publish it.

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
