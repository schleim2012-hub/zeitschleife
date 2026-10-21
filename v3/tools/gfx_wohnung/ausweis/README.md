# FBI-Parodie-Ausweise (Akte-X-Büro)
Assets: `assets/apartment/office/fbi_id_halli.glb`, `fbi_id_molder.glb` (geschlossen, Clip `open`), `*_open.glb` (liegt offen, ohne Animation).
- Nodes: `fbi_id_<name>` > `base` (Unterteil + Lederrücken) und `cover` (Klappe). Pivot von `cover` = Scharnier bei (x=-0,0425, y=0,0042) lokal.
  Aufklappen: `cover.rotation.z` 0 → `Math.PI` (Achse lokal +Z, Klappe schwingt nach oben und liegt dann flach links). Clip `open` = 0,8 s.
- Maße geschlossen 8,5 × 11 × 0,84 cm (x × z × y), Unterseite y=0, Mitte xz = 0; offen 17 × 11 cm (x −0,128…+0,0425).
- 1 Material (Atlas 1024: Farbe, Normal, ORM; Marke leicht metallisch), 254 Dreiecke, 2 Draw Calls (base + cover, wegen beweglicher Klappe).
- Kartenseite = Oberseite `base`; goldene Marke = Innenseite `cover`; Karte oben = −z (glTF).
Build: `./build_all.sh` (Texturen `make_tex.py` → Blender `build_ausweis.py` → weld/quantize/webp → `make_open.py` → Renders `render_sheet.py`/`make_sheet.py`).
Fotos: `photos/` (Fluxinator). Schrift nur per Font (Archivo Narrow, Libre Franklin, Oswald, Courier Prime, Cinzel; OFL). Siegel/Marke frei erfunden, nicht das echte FBI-Siegel.
