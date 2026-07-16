# Innovation Notes


## 2026-07-11 — Grounded Grill Load

- Viewport-gated advertising reel loading — Update video-autoplay.js so prepare() does not force preload="auto" and video.load() for every tagged video; start the below-fold advertising reel only when its observer says it is near view. [evidence: js/video-autoplay.js :: if (video.preload !== "auto") video.preload = "auto"]
- Accessible work-gallery photo lightbox — Add keyboard-operable click-to-expand behavior for images in the existing gallery__grid, with focus return, Escape close, descriptive alt text, and a full-size responsive source. [evidence: index.html :: <div class="gallery__grid">] [BUILT]
- Generic secure lead-endpoint support — Replace the Formspree-only configured regex with safe HTTPS endpoint validation so a future serverless form action uses the existing fetch, success card, and error handling rather than falling back to mailto. [evidence: js/quote-form.js :: const configured = /^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(action);] [BUILT]
- Paid-click lead attribution fields — Extend the existing hidden source and UTM capture with gclid, utm_medium, utm_term, and utm_content fields so Formspree leads retain the paid-click context needed to reconcile recent Ads conversions. [evidence: index.html :: <input id="qUtmCampaign" name="utm_campaign" type="hidden" />] [BUILT]
