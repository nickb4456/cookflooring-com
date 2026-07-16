# Cook Flooring customer trust audit

Date: 2026-07-13

## Scope

Combined UX, credibility, and accessibility review of the public home page, service navigation, FAQ, estimate path, owner contact details, project photography, and responsive presentation. The customer goal was to decide whether Cook Flooring looks like an experienced, organized contractor and request an estimate without uncertainty.

## Verdict

The core journey is healthy after revision. The first impression now leads with workmanship, a written scope, the real brand lockup, and clean project crops instead of bargain language or advertising artwork. The clearest credibility defect was the hardwood service hero, which displayed a sideways jobsite photo with tools and cords. It now uses an upright, floor-focused project image. No testimonials, review counts, or credential numbers were invented.

## Steps

1. First impression and identity: Healthy after revision. The real brand lockup, location, specialty, phone number, and estimate action are immediately visible.
2. Workmanship proof: Healthy with a source-photo limitation. Real project photography remains honest, and the lead crops now emphasize completed flooring and transitions instead of tools or ad artwork.
3. Service decision page: Healthy after revision. The hardwood service hero is upright, relevant, and consistent with the home page.
4. Credentials and process: Healthy. The page says "registered and insured," explains the owner-operated workflow, and describes a written, itemized scope without unverifiable urgency claims.
5. Estimate conversion path: Healthy. Primary actions reach the estimate form, required fields prevent empty submission, and the form posts to the configured Formspree endpoint.
6. Phone and tablet presentation: Healthy. The 390 px and 820 px layouts have no horizontal overflow, and fixed contact actions remain available.
7. Runtime and routes: Healthy. The home page and all five service routes return HTTP 200, both Three.js canvases initialize, and the local Cook Flooring page has no blocking console errors.

## Changes made

- Replaced negative references to salesmen, deposits, and "a guy with a truck" with positive accountability language.
- Replaced "licensed and insured" with "registered and insured" in visible copy, structured data, and `llms.txt`.
- Changed the hero promise to "Direct, itemized pricing from the crew."
- Clarified that Nick only uses submitted information to discuss the visitor's project.
- Changed the footer email label to "Email Nick directly."
- Adjusted the phone hero crop to keep jobsite equipment at the edge and emphasize the floor.
- Replaced the ad-style hero artwork and homemade plank mark with the real logo and floor-focused project crops.
- Reframed bargain and speed claims around careful preparation, clean transitions, a walkthrough, and a written scope.
- Replaced the gimmicky about heading and pseudo-review labels with direct crew accountability and professional standards.
- Corrected the hardwood service hero's sideways, tool-heavy image.
- Removed unsupported one-hour and 24-hour response promises from visible copy, structured data, and `llms.txt`.

## Evidence

- `01-desktop-hero-accepted.png`: live desktop hero before revision.
- `02-desktop-services-accepted.png`: live service section.
- `03-desktop-faq-accepted.png`: live FAQ before terminology revision.
- `04-desktop-quote-accepted.png`: live desktop quote path before revision.
- `07-phone-hero-accepted.png`: live phone hero before revision.
- `09-after-desktop-hero-valid.png`: accepted local desktop hero after revision.
- `10-after-desktop-quote-valid.png`: accepted local desktop quote path after revision.
- `11-after-phone-hero-valid.png`: accepted local phone hero after revision.
- `12-after-phone-quote-valid.png`: accepted local phone quote path after revision.
- `14-live-final-desktop-hero.png`: accepted production desktop hero after deployment.
- `15-live-final-desktop-quote.png`: accepted production desktop quote path after deployment.
- `16-live-final-phone-hero.png`: accepted production phone hero after deployment.
- `17-live-final-phone-quote.png`: accepted production phone quote path after deployment.
- `18-rookie-audit-desktop-hero.png`: second-pass live desktop first impression before revision.
- `19-rookie-audit-work-proof.png`: second-pass live project proof before revision.
- `20-rookie-audit-about-proof.png`: second-pass live about and standards presentation before revision.
- `21-rookie-audit-service-page.png`: second-pass live hardwood service hero before revision.
- `22-professional-pass-desktop-hero.png`: accepted local desktop first impression after revision.
- `23-professional-hardwood-service.png`: accepted local hardwood service page after revision.
- `24-professional-phone-hero.png`: accepted local phone first impression after revision.
- `25-professional-phone-estimate.png`: accepted local phone estimate path after revision.
- `26-professional-tablet-hero.png`: accepted local tablet first impression after revision.
- `27-live-professional-desktop.png`: accepted production desktop first impression after deployment.
- `28-live-professional-hardwood.png`: accepted production hardwood service page after deployment.
- `29-live-professional-phone.png`: accepted production phone first impression after deployment.
- `30-live-professional-estimate.png`: production phone form-validation state after deployment.

Browser checks observed 1440 px desktop, 820 px tablet, and 390 px phone layouts with no horizontal overflow. Both 3D canvases initialized at 1440 by 1000 pixels after their sections entered view. The local and production Cook Flooring URLs produced no console errors. The primary estimate action reached `#quote`, and empty submission focused the required name field without sending.

## Previous deployment

- Commit: `5005949 Strengthen customer trust messaging`
- Branch: `main`
- Push target: `origin/main`
- Live URL: https://cookflooring.com/
- Live marker: `css/styles.css?v=20260713g`
- Live verification: desktop and phone quote routes passed, both 3D canvases initialized after their sections entered view, empty form submission stayed local, and the browser console remained clean.

## Professionalism-pass deployment

- Commit: `949f7d2 Polish professional first impression`
- Branch: `main`
- Push target: `origin/main`
- Live URL: https://cookflooring.com/
- Live marker: `css/styles.css?v=20260713h`
- Live verification: the home page and all five service routes returned HTTP 200; desktop, tablet, and phone layouts had no horizontal overflow; the main estimate action reached `#quote`; required fields blocked empty submission; both 3D canvases initialized after entering view; and the production console had no errors.

## Evidence limits

No real lead was submitted, so this pass did not create a customer message or conversion. Screenshots support visible layout and copy findings, but they do not establish full WCAG compliance. The in-app browser produced invalid composited screenshots after repeated viewport changes; those captures were rejected and replaced with fresh-tab captures listed above.

## Provenance

- Live source: https://cookflooring.com/
- Local verification source: http://127.0.0.1:8123/
- Capture surface: Codex in-app browser
- Viewports: 1440 x 1000, 820 x 1180, and 390 x 844
- Screenshot folder: `.reports/2026-07-13-customer-trust-audit/`
- State contractor terminology source: https://crb.ri.gov/general-contractor-registration
