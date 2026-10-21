# Wohnung – Grafik (zuerst: Akte-X-Büro)
Laufzeit: `test/lib/gfx_wohnung_buero.js` (hängt sich an `aptBuildOffice` + `aptDoorTrans`, ändert apt_*.js nicht). Abschalten: `?nogfx=1`, nur Lightmap aus: `?nobake=1`, Lightmap-Stärke testen: `?lmg=1.5`.
1. Props (eigene Blender-Modelle, Farbe+AO in eine Textur gebacken, je 1 Material/Draw):
   `blender -b --factory-startup -P build_office_props.py -- OUT 1024 [pc,cab,door]` → `office_pc.glb`, `office_cabinets.glb`, `office_door_leaf.glb`, `office_door_frame.glb` nach `assets/apartment/office/`.
   PC-Maße hängen am Spielcode: Bildschirmöffnung 0,30×0,225 m, Mitte (0, 0,2205, 0,12) glTF; LED (−0,31, 0,185, 0,2).
2. Lightmap (Pipeline tools/bake, Server auf dem Klon):
   `python3 ../bake/dump2.py 'http://127.0.0.1:PORT/v3/test/era_wohnung.html?nobake=1' scene.json "$(cat buero_bake_cfg.json)"`
   `blender -b --factory-startup -P ../bake/bake.py -- scene.json out 1024 384` (≈35 s) · `python3 ../bake/post.py out ../../assets/bake/wohnung_buero`
   Empfänger nur Raumhülle (apt_fl/ce/pa/wd/mt); die zufällig verteilten Akten/Ordner (apt_at/apt_pl) ändern sich pro Laden und bekommen keine Lightmap.
   Ändert sich Geometrie in apt_office.js → neu dumpen + backen (sonst greift die Vertexzahl-Prüfung, Raum bleibt ohne Lightmap).
3. Prüfen: `node shoot_buero.js URL OUTDIR` (POS=door,mid,desk; Draw Calls je Blick) · `node interact_buero.js URL OUTDIR` (PC-Klick/Kaninchen, Akten, Tür, Überblendung).

## Portierung (Unity o. ä.)
- `.blend`-Quellen je Prop: `tools/gfx_wohnung/blend/<name>.blend` (Texturen eingepackt, Material = Principled mit Basisfarb-Textur).
- Texturen in Originalauflösung, verlustfrei: `assets/apartment/<raum>/src/<name>_col.png` (Farbe), `_ao.png` (AO), `_tex.png` (Farbe×AO = im GLB als JPG).
- Lightmaps: `assets/bake/<raum>/lm.jpg|ao.jpg` (Laufzeit) + `src/lm.exr|ao.exr` (Half-Float, linear) + `src/lm.png|ao.png`; UV1 in `uv1.bin`/`uv1.json`. Erzeugen: `python3 lm_export.py <bake-out> ../../assets/bake/<raum>`.
- Helfer für alle Props: `props_lib.py` (Blender).

## Wohnzimmer
Laufzeit: `test/lib/gfx_wohnung_wohnzimmer.js` (hängt sich an `aptBuildLiving`, ändert apt_living.js nicht; lädt lib/depthbg.js bei Bedarf selbst).
1. Props: `blender -b --factory-startup -P build_living_props.py -- OUT 2048 [wall,polster,tv,table,lamp]` (LIV_TEX=Ordner mit granny.png) → `assets/apartment/living/wz_*.glb`, Quellen `src/`, `.blend` in `blend/`.
   Schrankwand-Look nach Grok-Ref C7 (Captain Chaos). Sofa + Sessel = 1 Mesh. TV-Ursprung Welt (21.65,0,2.12), Bildöffnung passt zum Spiel-Bildschirm (scr).
2. Fensterblick: Grok C1_d, Letterbox weg + Mitte (400..1720 × 104..912) zugeschnitten, `tools/backdrop/depth_bake.py` → `sky/backdrop/wz_westberlin89(.jpg|_depth.png)`. C2 (Hinterhof) reserviert fürs Schlafzimmer.
3. Lightmap: `dump2.py '…/era_wohnung.html?nobake=1&zsbroom=liv' scene.json "$(cat wohnzimmer_bake_cfg.json)"` → bake.py → post.py → `assets/bake/wohnung_wohnzimmer` + `lm_export.py`.
   (`zsbroom=liv` registriert das Wohnzimmer für den Dump, sonst gewinnt das Büro.)
4. Prüfen: `ROOM=living node shoot_room.js URL OUT` (Draw Calls), `VIEWS='[[name,[pos],[ziel]],…]' node closeup_room.js URL OUT`.
