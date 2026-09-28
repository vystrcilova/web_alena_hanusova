#!/bin/sh
# Z renderů Blenderu a fotek vyrobí WebP assety pro web.
#
#   sh blender/export.sh <složka_s_rendery>
#
# Předtím:
#   Blender -b --python blender/scene.py -- arena <složka>
#   Blender -b --python blender/scene.py -- ball  <složka>
#   Blender -b --python blender/scene.py -- hoop  <složka>
# Potřebuje ImageMagick (magick), cwebp a swiftc (Xcode Command Line Tools).
set -eu

SRC=${1:?"chybí složka s rendery"}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
IMG="$ROOT/assets/img"
TMP=$(mktemp -d)
mkdir -p "$IMG/hriste"

# --- Aréna (pozadí hero) -----------------------------------------------------
cwebp -quiet -q 72 -resize 1200 1500 "$SRC/arena.png" -o "$IMG/hriste/arena.webp"
cwebp -quiet -q 70 -resize 640 800 "$SRC/arena.png" -o "$IMG/hriste/arena-640.webp"

# --- Výřezy postavy z fotek (macOS Vision) ------------------------------------
swiftc -O "$ROOT/blender/cutout.swift" -o "$TMP/cutout"
"$TMP/cutout" "$IMG/hero.jpg" "$TMP/hero-cut.png" "$TMP/hero-mask.png"
# Vision tu přibral kus pozadí u černého návleku — ruční oprava hrany
python3 "$ROOT/blender/oprava-masky.py" "$IMG/hero.jpg" "$TMP/hero-mask.png" "$TMP/hero-mask-ok.png"
magick "$IMG/hero.jpg" "$TMP/hero-mask-ok.png" -alpha off -compose CopyOpacity -composite "$TMP/hero-cut.png"
"$TMP/cutout" "$IMG/about.jpg" "$TMP/about-cut.png"
cwebp -quiet -q 82 -alpha_q 90 "$TMP/hero-cut.png" -o "$IMG/hriste/alena-dribling.webp"
cwebp -quiet -q 80 -alpha_q 90 -resize 600 750 "$TMP/hero-cut.png" -o "$IMG/hriste/alena-dribling-600.webp"
cwebp -quiet -q 82 -alpha_q 90 "$TMP/about-cut.png" -o "$IMG/hriste/alena-portret.webp"
cwebp -quiet -q 80 -alpha_q 90 -resize 520 693 "$TMP/about-cut.png" -o "$IMG/hriste/alena-portret-520.webp"

# --- Míč: 24 snímků -> sprite 6 × 4 po 200 px ---------------------------------
magick montage "$SRC"/ball-*.png -background none -tile 6x4 -geometry 200x200+0+0 "$TMP/ball.png"
cwebp -quiet -q 78 -alpha_q 85 "$TMP/ball.png" -o "$IMG/hriste/mic.webp"

# --- Koš: čtyři vrstvy se společným ořezem, aby na sebe přesně seděly ---------
BOX=$(magick "$SRC"/hoop-full.png -alpha extract -threshold 30% -format "%@" info:)
for layer in 0-board 1-net-back 2-net-front 3-rim-front; do
  magick "$SRC/hoop-$layer.png" -crop "$BOX" +repage -resize 80% "$TMP/hoop-$layer.png"
  cwebp -quiet -q 84 -alpha_q 90 -exact "$TMP/hoop-$layer.png" -o "$IMG/hriste/kos-$layer.webp"
done
magick identify -format "koš po ořezu: %wx%h\n" "$TMP/hoop-0-board.png"

rm -rf "$TMP"
ls -la "$IMG/hriste"
