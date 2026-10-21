# Warteraum-Figuren (Hybrid: statischer Körper + bewegliche Teile)

Pipeline (eigene Entwürfe, keine Schauspieler-Abbilder):
1. Konzeptbild je Figur (Frontansicht, sitzend, grauer Hintergrund) → `assets/warteraum/src/fig_<name>.png` (768×1024, Original 864×1152).
2. `hy.py <name> [seed]` – Hunyuan3D-2mv (HF-Space `tencent/Hunyuan3D-2mv`, nur Frontbild, 30 Steps, Octree 256) → Roh-GLB (~300–480k Faces).
3. `blender -b -P fig_dec.py -- out/<name>.glb dec/<name> 9000` – auf 9000 Tris dezimieren (+ npy für den Fit).
4. `python3 fig_fit.py in/<name>.jpg dec/<name> top bottom xc [left right]` – Frontprojektion Mesh→Bild
   (Start aus gemessenen Bildkanten, Feinjustage per Chamfer-Abstand Silhouette↔Canny-Kanten). Ergebnisse: `fit/*.json`.
5. `blender -b -P fig_proc.py -- <decdir> figs.blend` – UV = Frontprojektion, verdeckte/abgewandte Flächen per Vertexfarbe abgedunkelt,
   Kopf/Unterarm/Fuß per Pixelbox (`fig_cfg.py`) als eigene Objekte mit Gelenk-Pivot abgetrennt, Assistentin in der Taille zersägt,
   Oma bekommt ein eigenes Blatt-Quad. Meter-Maßstab, Front +Y, Boden z=0.
6. `build_room.py` hängt `figs.blend` an (eigene Stühle entfallen, die Figuren bringen ihren Stuhl mit), backt sie mit in die Lightmap.

Bewegung (gfx_warteraum.js, `scene.json` → movers): head (Hochachse), arm (Stempel/Zigarette), foot (Wippen/Flosse), page (Blättern).
