# Responsive image provenance

The responsive WebP files in this directory are delivery variants of the original job photos in `assets/`.

The service-page hardwood hero variants added on 2026-08-23 were generated from `assets/finished-amber-oak-upright.webp` with:

`cwebp -quiet -q 78 -resize 480 0 INPUT -o assets/responsive/finished-amber-oak-upright-480.webp`

`cwebp -quiet -q 78 -resize 800 0 INPUT -o assets/responsive/finished-amber-oak-upright-800.webp`

The homepage LCP variants were generated from `assets/featured/white-oak-room-progress-960.webp` with:

`cwebp -quiet -q 62 -resize 480 0 INPUT -o assets/responsive/home-hero-white-oak-480.webp`

`cwebp -quiet -q 58 -resize 800 0 INPUT -o assets/responsive/home-hero-white-oak-800.webp`
