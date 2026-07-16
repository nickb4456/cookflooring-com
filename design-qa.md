**Comparison target**

- Source visual truth: `assets/featured/white-oak-vaulted-progress-960.webp`, a real in-progress hardwood installation.
- Design research used: `150-expressive-typography-can-be-the-image.png`, `176-9-film-still-editorial-teaser.png`, `023-build-safe-reading-zones-into-the-image.png`, and `026-text-on-image-needs-active-protection.png` from the Research Ideas card library.
- Implementation screenshot: browser-rendered local `http://localhost:8000/`, captured at 390 × 844 and 635 × 844 on 2026-07-13.
- State: first masthead screen with the sticky mobile call bar visible.

**Findings**

- [Resolved P1] The previous mobile treatment hid the site’s strongest proof, a real hardwood job, behind a mostly dark hero.
  Location: `.masthead` mobile background.
  Evidence: the 390px and 635px final captures show the room, installed planks, and work-in-progress tools as the dominant visual.
  Fix: use the portrait live-job photo as a full-bleed mobile-only background.

- [Resolved P1] The mobile-specific rules did not cover wider phone viewports such as the supplied 635px screenshot.
  Location: mobile masthead media query.
  Evidence: the previous `max-width: 600px` rule could not affect that screenshot.
  Fix: extend the isolated mobile treatment through `max-width: 767px`; desktop remains untouched.

- [Resolved P2] Hero copy and actions competed with the image and with the fixed mobile contact bar.
  Location: `.masthead__copy`, `.masthead__actions`, and `.callbar`.
  Evidence: the final captures retain one quote CTA in the hero while the persistent bar owns the call action.
  Fix: a directional scrim protects the headline and body copy, and the duplicate in-hero call action is hidden only on the mobile breakpoint.

**Fidelity surfaces**

- Fonts and typography: retained the existing Fraunces display headline and brand typography. The headline remains a high-impact three-line stack.
- Spacing and layout rhythm: 390px and 635px views fit within the viewport without horizontal overflow or hidden primary actions.
- Colors and visual tokens: retained the charcoal, oak, and cream visual system; the darker scrim is functional text protection, not a new palette.
- Image quality and asset fidelity: used the existing high-resolution live-job asset, not a generated image or campaign graphic.
- Copy and content: retained existing headline, service explanation, quote CTA, pricing promise, and proof points.

**Implementation checklist**

- Verified the hero quote link uniquely resolves and navigates to `#quote`.
- Verified `scrollWidth === clientWidth` at 390px and 635px.
- Verified no browser console errors after the final render.

**Follow-up polish**

- [P3] Add a small photo provenance label only if the business wants to identify the town or job type publicly.

final result: passed

---

## Desktop hero density revision, 2026-07-14

**Comparison target**

- Source visual truth: `/tmp/cook-flooring-hero-concept.png`.
- Implementation screenshot: `scratchpad/design-qa/hero-compact-desktop.png`.
- Full comparison input: `scratchpad/design-qa/hero-source-vs-compact.png`.
- Viewport and state: 1440 × 1000, homepage at the top after fonts and the project photo loaded.
- Focused region: the complete desktop hero card; the full comparison is also the focused comparison.

**Findings**

- [Resolved P2] The desktop card was 802px tall, leaving too much unused space below the conversion content. Its responsive height is now capped at 650px and measures 600px at the proof viewport.
- [Resolved P2] The real project photo previously forced the card to its intrinsic image proportions. The figure and grid tracks can now shrink, preserving the image crop without distortion.
- [Verified] The mobile masthead receives no layout changes. A direct before-and-after comparison retains the original headline, background crop, estimate card, proof points, and contact bar.

**Fidelity surfaces**

- Typography: headline size, line breaks, weights, and brand type remain unchanged.
- Spacing and layout: the hero now measures 769px overall instead of 971px, bringing the next section into view and removing 202px of unnecessary desktop height.
- Colors and tokens: no palette, surface, border, or button tokens changed.
- Image quality: the white-oak project image loaded at natural resolution, remains undistorted, and uses a denser landscape crop.
- Copy and content: all desktop and mobile copy, actions, and proof points remain unchanged.

**Implementation checklist**

- Desktop 1440 × 1000: hero 769px, card 600px, image loaded, horizontal overflow 0.
- Phone 390 × 844: original mobile presentation retained, horizontal overflow 0.
- Mobile comparison: `scratchpad/design-qa/mobile-before-after-compact.png`.

**Comparison history**

1. The first integrated hero matched the selected design but measured 802px tall inside a 971px masthead.
2. The revised card measures 600px inside a 769px masthead and visually matches the source composition more closely.

final result: passed

---

## Desktop hero integration, 2026-07-14

**Comparison target**

- Source visual truth: `/tmp/cook-flooring-hero-concept.png`.
- Implementation screenshot: `scratchpad/design-qa/hero-after-desktop.png`.
- Full comparison input: `scratchpad/design-qa/hero-source-vs-implementation.png`.
- Viewport and state: 1440 × 1000, homepage at the top of the page after fonts and the project photo loaded.
- Focused region: the complete above-the-fold desktop hero is the selected design region, so the full comparison is also the focused comparison.

**Findings**

- [Resolved P1] The old desktop masthead consumed the full viewport and left the content feeling loosely assembled. The implementation now uses one bounded two-column composition with a compact 112px header-to-card offset.
- [Resolved P1] The mobile proof list briefly inherited the new desktop proof points because a later mobile selector had equal specificity. Compound breakpoint selectors now preserve the original mobile proof content.
- [Resolved P2] The previous desktop media stack competed with the value proposition. The secondary detail image, project chips, and scroll prompt are hidden at desktop size, leaving one dominant real project photo.

**Fidelity surfaces**

- Typography: the selected headline and hierarchy are preserved, while the site’s existing Fraunces and mono brand typography replace the visualization’s generic preview fonts.
- Spacing and layout: the compact navigation, split hero card, aligned copy, image caption, and proof divider follow the selected desktop composition. The desktop and mobile captures have zero horizontal overflow.
- Colors and tokens: the implementation retains the established charcoal, cream, copper, line, and muted-text tokens.
- Image quality: the existing `assets/featured/white-oak-room-progress-960.webp` project photo is loaded at natural resolution and uses a deliberate crop without rotation or scaling distortion.
- Copy and content: desktop uses “Crafted floors. Clear process.”, the direct estimate and phone actions, and the three selected proof points. Mobile retains its prior headline, longer service copy, price promise, and proof content.

**Implementation checklist**

- Desktop 1440 × 1000: selected two-column composition rendered, project photo loaded, and horizontal overflow measured at 0.
- Tablet 820 × 1180: existing stacked presentation retained, project photo loaded, and horizontal overflow measured at 0.
- Phone 390 × 844: existing full-photo hero retained, mobile-only copy shown, and horizontal overflow measured at 0.
- Estimate CTA: unique locator count was 1; activation changed the URL to `#quote` and placed the quote section 76px below the viewport top.
- Runtime: both canvas elements initialized and the hero project image completed successfully in the browser proof run.

**Comparison history**

1. Initial implementation matched the selected desktop structure, but the mobile desktop-proof list reappeared at 767px and below.
2. Increased selector specificity, recaptured mobile, and confirmed only the original mobile proof list is visible.

final result: passed
