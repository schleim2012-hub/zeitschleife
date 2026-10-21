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
