# Cook Flooring advertising video and conversion-site plan

Date: 2026-07-10
Status: Implemented and verified

## Goal

Turn the 17 supplied job photos, plus the strongest existing production photos, into a polished Cook Flooring & Tile advertising video and a faster, more credible website lead path for Rhode Island flooring and deck prospects.

## Audit findings

- The site already has a working Formspree endpoint and Google Ads conversion events. The build should retain those working integrations.
- The current first screen is a long scroll-driven 3D floor scene with no in-scene call or estimate action. Real project proof and the quote path appear much later.
- The existing quote form is visually strong but asks for five required fields and two additional detail fields before submission.
- Mobile has no horizontal overflow, but several controls miss a 44-pixel target and the first-screen CTA is limited to the header and sticky call bar.
- The second photo batch contains seven JPEGs. Five are new; Photo 6 duplicates batch 01 Photo 8 exactly, and Photo 7 duplicates batch 01 Photo 10 exactly.
- Best new website candidates: second-batch Photos 1 and 2 for a wide hardwood-room installation story, Photo 3 for a clean oak detail crop, and Photo 6 / first-batch Photo 8 for the cleanest finished-floor image.
- Best deck candidates: first-batch Photos 1 through 5 as an honest framing-to-composite sequence. Existing `finished-deck-view.jpg` remains the strongest completed-deck reveal.

## Build scope

### 1. Preserve and normalize the intake

- Save all seven second-batch originals under `assets/incoming/2026-07-10-batch-02/` with a checksum manifest and duplicate notes.
- Keep original attachments untouched.
- Produce named, color-corrected WebP derivatives for actual runtime use. Limit editing to crop, exposure, color, and sharpening. Do not generate or remove job-site details.
- Generate responsive 480, 800, and 1200-pixel variants where they materially reduce page weight.

### 2. Produce the advertising video

- Create a 24-second, 1080 by 1920 H.264 vertical social-ad master designed to work with sound off.
- Create a 1920 by 1080 landscape derivative for the website and general advertising use.
- Storyboard:
  1. Finished floor and deck hook: `Floors and decks built right.`
  2. Real process proof: framing, joists, composite boards, hardwood installation.
  3. Finished reveals: clean oak, finished room, completed deck.
  4. Trust: `Father-and-son Rhode Island crew.`
  5. Offer and CTA: `Free in-home estimate` plus `(401) 602-0958` and `cookflooring.com`.
- Use restrained pan and zoom movement, fast clean cuts, high-contrast safe-zone typography, and no unsupported review, pricing, or schedule claims.
- Save the reusable FFmpeg build script, storyboard, source map, and final probe output beside the video for provenance.

### 3. Improve the website design

- Add a real-photo conversion masthead before the long 3D sequence, using completed flooring and deck proof rather than render-first storytelling.
- Give the masthead one direct promise, dual estimate/call actions, and compact trust signals: real Rhode Island work, owner-operated, licensed and insured, written quote within 24 hours.
- Keep both Three.js scenes, but reposition them as optional craft storytelling after the primary conversion message instead of making them the entry gate.
- Add a concise new-project showcase using the clean hardwood images and the full deck sequence, with honest `during` and `finished` labels.
- Add the landscape advertising video as a muted, caption-complete proof reel with a poster fallback and reduced-motion behavior.
- Tighten typography, spacing, image crops, and button sizes across desktop, tablet, and mobile without replacing the established dark, warm material palette.

### 4. Improve the lead funnel

- Add Flooring, Deck, and Tile project-choice CTAs that preselect the matching quote-form option.
- Reduce required fields to name, phone, project, and town. Make email optional and consolidate rough size/details into one optional project-details field.
- Add a visible call alternative beside the submit action and keep the sticky mobile Call / Free estimate bar.
- Capture page source and UTM values in hidden fields for Formspree without exposing visitor data elsewhere.
- Retain the current Formspree fallback behavior and Google Ads conversion label, while adding project-choice, video-play, and estimate-entry analytics events.
- Correct anchor positioning so header and mobile sticky bars do not obscure the quote destination.

## Verification gate

- Check original and saved photo hashes, duplicate annotations, derivative dimensions, and video source mapping.
- Probe both final videos for duration, codec, pixel size, frame rate, and playback errors.
- Serve the site over HTTP and verify desktop 1280 by 720, tablet 768 by 1024, and phone 390 by 844.
- Capture before and after screenshots in `scratchpad/`.
- Confirm both canvases initialize, all images and video load, the video plays, no horizontal overflow occurs, key tap targets meet 44 pixels, anchors land correctly, and the console has no new errors.
- Exercise project preselection, required-field validation, Formspree request construction in a local non-transmitting harness, mail fallback construction, and analytics callbacks without sending a real lead.

## Implementation result

- Preserved all seven second-batch originals with SHA-256 values and duplicate notes.
- Produced five responsive photo families for the white-oak and composite-deck stories.
- Produced both 24-second H.264 advertising cuts and a reusable FFmpeg/ImageMagick build script.
- Added the real-photo masthead, new white-oak gallery, deck sequence, and embedded landscape proof reel.
- Reduced the form to four required fields, added project preselection and attribution capture, and corrected cold `/#quote` landing.
- Browser checks passed at desktop, tablet, and phone widths with no horizontal overflow or broken loaded images. Both Three.js canvases initialized at 1280 by 720, the embedded reel loaded and played, and the console was clean.
- The local non-transmitting harness passed project preselection, UTM/source capture, stubbed Formspree POST construction, success state, and lead tracking.
