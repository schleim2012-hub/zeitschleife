# Spielhalle 1984 – Raumhülle + gebackenes Licht
- `gen_tex.py <ambientCG-Ordner> ../../assets/tex/arc2` – Wand-Atlas (WoodSiding008, CC0, ambientCG) + prozedurale Rasterdecke
- `node dump_arc.js http://127.0.0.1:PORT/v3/test/era_arcade.html?nogfx=1 arc_dump.json` – Automaten-Aufstellung aus arc3d.js
- `python3 bake_lm.py arc_dump.json ../../assets/arc2bake` – Lightmap (Bildschirm/Marquee/Neon, Schatten der Automaten) + AO/Abnutzung, ~95 s CPU
- Laufzeit: `test/lib/gfx_spielhalle.js` (eine Script-Zeile in era_arcade.html). Ändert sich die Aufstellung in arc3d.js, neu dumpen + backen.
