#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/media/advertising"
TMP="$ROOT/scratchpad/ad-video-build"
FONT="/System/Library/Fonts/Supplemental/Arial Bold.ttf"

mkdir -p "$OUT" "$TMP"
rm -rf "$TMP/vertical" "$TMP/landscape"
mkdir -p "$TMP/vertical" "$TMP/landscape"

SOURCES=(
  "$ROOT/assets/incoming/2026-07-10-batch-02/6-Photo-6.jpg"
  "$ROOT/assets/incoming/2026-07-10-batch-02/2-Photo-2.jpg"
  "$ROOT/assets/incoming/2026-07-10-batch-01/1-Photo-1.jpg"
  "$ROOT/assets/incoming/2026-07-10-batch-01/2-Photo-2.jpg"
  "$ROOT/assets/dad-hammer-poster.jpg"
  "$ROOT/assets/living-room-after-real.jpg"
  "$ROOT/assets/incoming/2026-07-10-batch-01/5-Photo-5.jpg"
  "$ROOT/assets/incoming/2026-07-10-batch-02/6-Photo-6.jpg"
)

HEADLINES=(
  "FLOORS AND DECKS"
  "HARDWOOD, BOARD BY BOARD."
  "STRONG FRAMING FIRST."
  "COMPOSITE BOARDS SET CLEAN."
  "SAME CREW FROM QUOTE TO BUILD."
  "CLEAN FLOORS. CLEAN TRANSITIONS."
  "BUILT FOR RHODE ISLAND WEATHER."
  "FREE IN-HOME ESTIMATE"
)

SUBLINES=(
  "BUILT RIGHT."
  "REAL RHODE ISLAND INSTALLS."
  "REPAIRS, REBUILDS, AND NEW DECKS."
  "BUILT FOR REAL BACKYARDS."
  "OWNER-OPERATED. LICENSED. INSURED."
  "HARDWOOD, LVP, AND REFINISHING."
  "FRAMING, BOARDS, STAIRS, AND RAILINGS."
  "(401) 602-0958  •  COOKFLOORING.COM"
)

build_format() {
  local name="$1"
  local width="$2"
  local height="$3"
  local headline_size="$4"
  local support_size="$5"
  local brand_size="$6"
  local bottom_box="$7"
  local headline_y="$8"
  local support_y="$9"
  local dir="$TMP/$name"
  local concat_file="$dir/concat.txt"

  : > "$concat_file"
  for i in "${!SOURCES[@]}"; do
    local segment
    local overlay
    segment=$(printf "%s/%02d.mp4" "$dir" "$i")
    overlay=$(printf "%s/%02d-overlay.png" "$dir" "$i")
    magick -size "${width}x${height}" xc:none \
      -fill 'rgba(0,0,0,0.60)' -draw "rectangle 0,${bottom_box} ${width},${height}" \
      -font "$FONT" -fill 'rgba(255,255,255,0.86)' -pointsize "$brand_size" \
      -gravity north -annotate +0+70 'COOK FLOORING & TILE  |  RHODE ISLAND' \
      -fill white -pointsize "$headline_size" -annotate +0+"$headline_y" "${HEADLINES[$i]}" \
      -fill '#D98A70' -pointsize "$support_size" -annotate +0+"$support_y" "${SUBLINES[$i]}" \
      "$overlay"
    ffmpeg -hide_banner -loglevel error -y \
      -loop 1 -framerate 30 -i "${SOURCES[$i]}" -loop 1 -framerate 30 -i "$overlay" -t 3 \
      -filter_complex "[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},zoompan=z='min(zoom+0.00045,1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${width}x${height}:fps=30[base];[base][1:v]overlay=0:0,fade=t=in:st=0:d=0.18,fade=t=out:st=2.82:d=0.18,format=yuv420p,setsar=1" \
      -an -c:v libx264 -preset medium -crf 18 -r 30 -g 60 -movflags +faststart "$segment"
    printf "file '%s'\n" "$segment" >> "$concat_file"
  done

  ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$concat_file" \
    -c copy -movflags +faststart "$OUT/cook-flooring-ad-${name}.mp4"
}

build_format vertical 1080 1920 52 32 24 1320 1450 1570
build_format landscape 1920 1080 68 30 22 700 780 875

ffmpeg -hide_banner -loglevel error -y \
  -ss 0.35 -i "$OUT/cook-flooring-ad-landscape.mp4" -frames:v 1 -q:v 2 \
  "$OUT/cook-flooring-ad-poster.jpg"

ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration,size \
  -of default=nw=1 "$OUT/cook-flooring-ad-vertical.mp4"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration,size \
  -of default=nw=1 "$OUT/cook-flooring-ad-landscape.mp4"
