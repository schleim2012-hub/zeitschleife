#!/bin/bash
# Komplett-Build: Texturen -> Blender -> gltf-transform -> Renders. Aufruf: ./build_all.sh [PHOTODIR] [WORK]
set -e; H=$(cd "$(dirname "$0")" && pwd); PH=${1:-$H/photos}; WK=${2:-/workspace/rewind_gfx/wohnung/ausweis}
B=${BLENDER:-/workspace/blender/blender-4.2.3-linux-x64/blender}; ASSET=$H/../../../assets/apartment/office
python3 $H/make_tex.py $PH $WK/tex
$B -b --factory-startup -P $H/build_ausweis.py -- $WK/tex $WK/build | grep TRIS
for n in halli molder; do for v in ""; do
  gltf-transform weld $WK/build/fbi_id_${n}${v}_raw.glb /tmp/fbi_a.glb >/dev/null
  gltf-transform quantize /tmp/fbi_a.glb /tmp/fbi_b.glb >/dev/null
  gltf-transform webp /tmp/fbi_b.glb $WK/build/fbi_id_${n}${v}.glb --quality 90 >/dev/null
done; done
for n in halli molder; do python3 $H/make_open.py $WK/build/fbi_id_${n}.glb /tmp/fbi_o.glb && gltf-transform prune /tmp/fbi_o.glb $WK/build/fbi_id_${n}_open.glb >/dev/null; done
rm -f $WK/build/*.blend1
[ "$NORENDER" = 1 ] || $B -b --factory-startup -P $H/render_sheet.py -- $WK/build $H/../../../assets/tex/ph $WK/renders | grep Saved
python3 $H/make_sheet.py $WK/renders $WK/ausweis_sheet.jpg
# ins Repo: cp $WK/build/fbi_id_{halli,molder}{,_open}.glb $ASSET/ ; cp $WK/tex/*_{color,normal,orm}.png $H/tex/ ; cp $WK/build/*.blend $H/blend/
