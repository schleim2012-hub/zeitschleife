# Figuren-Werkzeug (`v3/tools/figur/`)

Baut realistische Spielfiguren aus einer **CC0-Basisfigur (MakeHuman/MPFB)** und **einem Referenzfoto** (Gesicht und Hautton).
Prototyp ist die Kundin der Sonnen-Oase (o9). Ergebnis: statische GLBs pro Pose, z. B. `kundin_lie_h9.glb` / `kundin_up_h9.glb`
und die jugendfreien Varianten `*_k9.glb` (Badeanzug, Körper darunter entfernt).

```
python3 figur.py kundin_oase.json /pfad/arbeitsordner            # alle Schritte
python3 figur.py kundin_oase.json /pfad/arbeitsordner skin glb   # nur einzelne Schritte
```

## Schritte
1. **base**: Der Generator (`../oase/gen_kundin_hybrid.py`, Blender + MPFB) baut die Figur in Liegepose und speichert `base/kundin_lie.blend`.
   Phänotyp, Posen, Handtuch und Ölmaske stehen im Generator. Für eine neue Figur kopierst du den Generator und passt `info['phenotype']` und die Posen an.
2. **face**:
   - Das Modellgesicht wird frontal gerendert (`f1_render.py`).
   - mediapipe-FaceLandmarker (`lm.py`) läuft auf dem Render und auf dem Ausschnitt des Referenzfotos (`ref.crop`, wird auf 800 px skaliert).
   - Die Modell-Landmarken werden per Raycast in 3D übertragen (`f2_lm3d.py`).
   - `solvePnP` liefert die Fotokamera (`f3_pnp.py`). Ein guter Fehler liegt unter ca. 8 px (Prototyp: 6,0 px bei f=800).
3. **skin**: `f4_bake.py` und `f5_uv.py` projizieren das Foto auf jeden Vertex:
   - Grundlage ist die PnP-Projektion mit einer TPS-Restkorrektur an den Landmarken.
   - Gewichtet wird nach Sichtbarkeit (Normale zur Kamera plus Verdeckungsstrahl).
   - Die Maske ist das Gesichtsoval, das Mundinnere bleibt ausgespart (offener Mund im Foto, das Modell behält seine Lippen).
   - Die schlechter sichtbare Gesichtshälfte wird aus der gespiegelten guten Hälfte gefüllt, mit 2,4 cm Übergang an der Mittellinie.
   - Der Cycles-EMIT-Bake schreibt in die MakeHuman-UV.
   - `comp.py` passt danach die ganze Körperhaut im Lab-Raum an den Foto-Hautton an: Helligkeit zu 30 %, Farbe zu `skin.chroma`.
     Der Orange-Stich der Fotos wird gedämpft, nur hautfarbene Pixel werden verschoben (Augen und Brauen bleiben).
   - Außerdem entsteht eine prozedurale Poren-Normalmap (`skin.pores`).
4. **glb**: Der Generator läuft pro Pose und Variante mit `FIG_SKIN`, `FIG_NRM`, `FIG_HAIR` und `FIG_TAG`.
   Das Material heißt `skin_<tag>`, `oase3d.js` erkennt `skin_h9` (Foto-Haut: Farbe weiß, Sheen statt Klarlack-Plastik, normalScale 0.18).

## Voraussetzungen
- Blender 4.2 LTS mit der MPFB-2-Extension und den MakeHuman-System-Assets (CC0).
- Eine Python-venv mit `mediapipe` (Tasks-API), `opencv-python`, `scipy` und `pillow` (Pfad in `python`).
  Es geht nicht ohne venv, weil das System-pip unter PEP 668 gesperrt ist.
- Das mediapipe-Modell `face_landmarker.task` (Apache-2.0, von Google herunterladen, nicht im Repo).

## Quellen / Lizenzen
- MakeHuman-Basismesh, Haut-Texturen, Haare (`ponytail01`), Augen, Brauen: **CC0** (makehuman_system_assets).
- MPFB-Extension: GPL (nur Werkzeug, wird nicht ausgeliefert). Blender: GPL (Werkzeug).
- mediapipe Face Landmarker: Apache-2.0 (Werkzeug).
- **Referenzfotos werden NIE committet.** Sie liegen nur lokal, der Pfad steht in der Config. Das gebackene Gesicht steckt in der Hauttextur des GLB.

## Einstellungen, die funktioniert haben
- Ausschnitt: Das Foto im Ganzen findet oft kein Gesicht, deshalb einen quadratischen Ausschnitt nehmen (Gesicht etwa 60 % der Breite), der auf 800 px skaliert wird.
- PnP über alle 468 Landmarken außer dem Mund. Brennweiten von 800 bis 3400 werden durchprobiert, die beste wird genommen.
- TPS-Glättung 2.0, Masken-Rand 40 px weich, Bake mit 2048², Margin 8, 4 Samples.
- `chroma` 0.55 und Helligkeit 0.3: Mit vollem Angleichen (1.0) wird die Figur zu dunkel und orange, weil das Fotolicht eingebacken ist.
- Die Poren-Normalmap mit Stärke 0.15 wird als JPEG q85 gespeichert (PNG-Rauschen ≈ 7 MB, JPEG ≈ 1 MB). Im Spiel ist normalScale 0.18 richtig, bei 0.6 sieht die Haut wie Reptilhaut aus.
- Haare: `ponytail01` liegt in Rückenlage natürlich.
  - Haar-Vertices unter z = 1,2 cm werden auf die Liege gedrückt und leicht verbreitert.
  - `long01` wirkt wie ein Helm, `bob01`/`bob02` haben einen Pony über den Augen.

## Stolperfallen
- `BVHTree.FromObject` arbeitet in Objekt-Koordinaten, die Strahlen müssen mit `matrix_world.inverted()` umgerechnet werden.
- Der Körper `Human` hat Armature- und Mask-Modifier, dadurch weicht die Topologie der ausgewerteten Version ab. Immer mit der ausgewerteten Kopie (`new_from_object`) arbeiten.
- Die Kamera für den Render muss explizit als `matrix_world` gesetzt werden, sonst steht das Bild auf dem Kopf.
- Das Gesicht wird in der Liegepose mit geschlossenen Augen gebacken. In der Aufsitz-Pose (Augen halb offen) liegt die Lid-Textur leicht daneben.
- Die Kinder-/Jugendfrei-Variante entfernt die Geometrie unter dem Badeanzug. Die Hauttextur ist dieselbe Datei.
- `build_data.py` und `tools/build3.py` gehören nicht zu diesem Werkzeug und dürfen nicht laufen.
