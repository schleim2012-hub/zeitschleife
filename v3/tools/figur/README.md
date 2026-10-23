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

## Realismus-Rezept (Stand o15, Sonnen-Oase-Kundin) – für Mara, Warteraum-Figuren usw.

Was am Quest sichtbar geholfen hat (Pete: 25 % → 50 %):

1. **Dichteres Netz**: `subdiv()` in `v3/test/lib/oase3d.js` (Phong-Unterteilung, Kanten-Dedupe) auf Liege- *und* Sitzpose gleich anwenden → Topologie bleibt gepaart (Pose-Morph möglich).
2. **Foto-Haut + Detailnormal**: Basis-Map/Normalmap 2048, `normalScale 0.18`; prozedurale 512²-Detailtextur (`skinDetail()`: Poren, Feinfalten in RG, Rauheit in B) in drei Skalen (×48, ×290, ×6.1) → bei 15 cm keine „Orangenhaut“, keine Plastikfläche.
3. **Rauheit statt Glanz**: Roughness 0.62 × Detail-B (zwei Skalen) = Glanzbrechung; Sheen 0.45 / 0.8 als „Pfirsichflaum“-Streurand; warmer SSS-Rand vor `opaque_fragment`.
4. **Farbunruhe**: `vn3`-Rauschen leicht ins Rot; Gelenke/Falten über Vertex-AO (`vColor.r`) minimal röter; Regionen-Rötung (Knie, Ellbogen, Hände, Füße) als Attribut `_nip.w` aus der Liege-Pose, per Index auf die Sitzpose kopiert.
5. **Brustwarzen**: Mitte aus der Textur suchen (dunkelster Fleck ≤3,5 cm um den Scheitel), lokaler Rahmen pro Pose (`_nip.xyz`); Geometrie-Wölbung im Vertexshader (Warze σ 5,5 mm, Hof σ 16 mm), Montgomery-Drüsen als Bump (`bumpN`/`nipH`), Farbe weich auslaufend mit Rauschkante. Hohe Frequenzen (sin·3000) vermeiden – flimmern.
6. **Kontakt**: AO wo `vOP.y < 4,5 cm` + weichgezeichnete Schatten-Decal (Canvas-Blur) aus der Auflagefläche, je Pose eigene.
7. **Ölfilm**: Clearcoat 0.6 × Ölmaske, Clearcoat-Rauheit mit Detail-Breakup (Schlieren statt Lack).
8. **Haare**: Karten mit `alphaToCoverage` + alphaTest 0.36, Sheen 0.55 (weichere Strähnenkanten in VR-MSAA).
9. **Leben, ganz leicht**: Atmung 1,1 rad/s (Brust 3 mm, Bauch 2 mm mit Phasenversatz), Feder-Wackeln bei Berührung (max. 6 mm), alle 7–13 s eine winzige Gewichtsverlagerung.
10. **VR-Regeln**: Kamera `near:0.01`; Kopf darf nie die Welt verschieben (Kollision nur bei Stick-Bewegung); Eingaben nur von Händen (Controller näher als 12 cm am Kopf ignorieren); Animationen nie über `window.requestAnimationFrame` (steht in der immersiven Sitzung still) – immer über den A-Frame-Tick (`raf()`/`snapTick()`).
11. **Prüfen**: Nahaufnahmen 15 / 40 cm (Brust, Gesicht, Hände) mit `closeshot.py` vorher/nachher; Endlauf mit `xrend.py`.

## Ragdoll + Leben (o16/o17, Sonnen-Oase) – wiederverwendbar für Mara & Co.

**Ist-Stand (Hybrid, ohne Skelett):** Die Kundin-GLBs (`kundin_lie_h9`/`kundin_up_h9`) sind *nicht geriggt* (0 Skins). Deshalb:
1. `regPrep` gibt jedem Vertex ein Attribut `_reg=(Region-ID, Gewicht)`: 1/2 Brust, 3 Bauch, 4/5 Innenschenkel (weich), 6/7 Arme, 8/9 Unterschenkel (Glieder). Gewichte weich (smoothstep) → wirken wie Skinning-Gewichte.
2. Weiche Regionen: gedämpfte Feder je Region auf der CPU (10 Vektoren), Versatz `uOff[i]` im Vertex-Shader. Keine Vertex-Physik auf der CPU.
3. Glieder: Rapier (`lib/rapier3d-compat-0.21.0.mjs`, selbst gehostet) – je Glied eine Kapsel, Achse aus der echten Gliedlage (Mittel der Punkte nahe Gelenk/Ende), Kugelgelenk am kinematischen Rumpf, Liege = Quader-Kollider bei y=0 (Figur-Ursprung = Liegefläche). Tonus = schwacher PD-Drehimpuls zur Ruhepose (ω≈5,5/s), weiche Grenze (steif ab 35° Arm / 26° Bein). Griff = `JointData.spring(0, m·420, m·26)` zu einem kinematischen Hand-Körper → Gewicht + Nachziehen; Loslassen = fällt schlaff. Die Kapsel-Drehung (relativ zur Startpose) dreht die Region im Shader um den Gelenkpunkt (`uRot`/`uPiv`), Normalen mit.
4. Sit-up: Ragdoll friert ein, `uRot` blendet in 0,15 s auf Identität, Körper werden zurückgesetzt.
5. Kosten: Rapier-Schritt 0,05–0,1 ms (6× CPU-Drossel: ~0,3 ms) bei 4 Kapseln.

**Soll (echtes Rig, noch NICHT umgesetzt – nächster Schritt):**
1. Figur in Blender 4.2 + MPFB 2 neu erzeugen (gleiche Makros/Haut wie h9) **mit Rig „game_engine“**, Gewichte von MPFB; Unterteilung (Subdivision) *vor* dem Export anwenden, Gewichte werden mit interpoliert.
2. Liegen und Aufsitzen = zwei **Posen/Aktionen desselben** SkinnedMesh (Export: eine GLB, `export_animations`, zwei Clips `lie`, `up`) – der Sit-up wird ein Pose-Blend statt Mesh-Tausch. Pose `lie` als Ruhepose exportieren, damit Bind-Pose ≈ Liegen.
3. Rapier je Knochen: Kopf, Hals (Gelenkgrenzen ~70° Gieren, 40° Nicken), Oberarm, Unterarm, Hand, Oberschenkel, Schienbein, Fuß. Ellbogen/Knie = `revolute` mit Grenzen, Schulter/Hüfte = `spherical` + Twist-Grenze per PD. Rumpf + Becken kinematisch auf der Liege. Kollisions-Kapseln getrennt vom sichtbaren Mesh, Kollisionsgruppen: Glieder ↔ Liege + Glieder untereinander, nicht ↔ Rumpf.
4. Sync: jeden Frame Rapier-Körper → Knochen-Quaternion (Weltrotation × inverse Bind-Rotation), danach `skeleton.update()`. Schwache Halte-Motoren (aktiver Ragdoll) zur aktuellen Animationspose, Feder-Griff wie oben.
5. Kopf nie von der Spieler-Kopfposition bewegen (12 cm Ausschluss bleibt), nur Hände.

**Leben (o17, positionsbasiert im Vertex-Shader, nur Pose „lie“):** Augäpfel wandern unter den geschlossenen Lidern (Sakkaden 0,6–3,2 s), Lidflattern alle 2–6 s (manchmal doppelt), Schlucken alle 25–55 s (Kehlkopf), winzige Fingerbewegungen, Atmen. Landmarken der h9-Kundin (lie, lokal, m): Augen (−0.838, 0.234, ±0.032), Nasenspitze (−0.815, 0.272, 0), Lippen (−0.778, 0.262, 0), Kehle (−0.70, 0.18, 0), Ohr (−0.831, 0.143, ±0.088). Andere Figuren: Landmarken neu messen (Profil-Skript: max y je x-Scheibe bei |z|<6 mm).
**Haut:** Rauheit je Region (Nase/Lippen/Stirn glänzender), Durchscheinen (Streurand) an Lippen, Ohren, Fingern stärker, Poren-Detail mit zweiter gedrehter Abtastung gemischt (keine Kachelung).
**Handtuch:** Vertex-Heber `uTw[4]` (2 Controller, 2 Hand-Enden der Arm-Kapseln) – Handtuch wölbt sich über Hand/Glied.
**Haptik (Quest):** Höhenkarte (2 cm Raster) von Haut + Handtuch → Erstkontakt-Puls (Haut weich 14 ms, Handtuch kurz 8 ms), Streichen proportional zum Handtempo (Handtuch = feines schnelles Rattern), kräftiger Tick (0,6/28 ms) wenn ein gegriffenes Glied an den Anschlag kommt.

## o19: Torso-/Gesichts-Atlas (`f6_torso.py`, Config `torso_o19.json`)
- Zusätzliche Textur nur für Brust, Warzenhöfe, Bauch, Hals und Gesicht: 2048×1024 webp (`kundin_t10.webp`, ≈ 2,7 px/mm statt 0,8 px/mm in der MakeHuman-UV), Draufsicht-UV der Liegepose als Vertex-Attribut `_TUV` (u, v, Gewicht) in `kundin_{lie,up}_h10.glb`. Die Sitzpose bekommt dieselben Werte pro Vertex, der Atlas wandert also mit.
- Shader (`oase3d.js`, `skin.tz`): mischt den Atlas nach `map_fragment` mit Gewicht `_tuv.z` ein und blendet dort den gemalten Warzenhof aus. Ohne `fig.torsoAdult` bleibt alles wie o18.
- Inhalt: Basis = alte Hauttextur (nahtlos), + feine Fotodetails (`body_photo`, PnP über 6 Punkte, Öl-Glanz per Inpaint entfernt, nur Hochpass σ 3 px) + Foto-Warzenhof (`areola`, in der Tangentialebene um die Warzen-Mitte, rund auf der Haut).
- Neues Referenzfoto: `python3 f6_torso.py grid foto.jpg` → Punkte (Warzen, Nabel, Halsgrube, Schultern) ablesen, in die Config eintragen, `python3 f6_torso.py torso_o19.json` (≈ 6 s). Ändert sich nur das Foto, muss nur die webp neu.

### o19b: r3-Foto (ohne Öl) + Mikrodetail
- body_photo/areola jetzt aus r3_2 (stehend frontal, gleichmäßiges Licht); sigma 10, `edge` unterdrückt Kontur-/Schattenlinien.
- `micro`: synthetische Poren, Korn, Farbfleckigkeit auf dem Torso; im Warzenhof Falten, Montgomery-Knötchen, Farbvariation, Warzen-Textur. Geometrie/Größe/Lage unverändert. webp q95 (~260 KB).

## o20 Rig – WIP (Stand 23.10. 19:50, NICHT live)
- Fertig: `f7_rig.py` → `kundin_lie_h11.glb` (_BJ/_BW, 18 Knochen inkl. Kiefer) + `kundin_rig_h11.json`; `oase3d.js`: subdiv mischt Skin-Gewichte, GPU-Skinning (rigPatch, uBQ/uBT), Rapier-Rig (rigInit/rigStep/rigGrab/rigPush/rigHand/rigFrame-Reset 20 s/rigRest), Becken fixed, Mundhöhle/Zähne/Zunge, Handtuch-Lift; html lädt h11 + rigAdult.
- Problem: Rig explodiert beim Einsinken (Ruhepose-Überschneidungen: viele Kontaktpaare nicht-verbundener Körper, v. a. Rumpf-Boxen (chest/spine) vs. Arme/Beine/Kopf).
- Nächster Schritt: Rumpf-Boxen schmaler (hz/hy aus Median wie Kapseln) bzw. Kontakte zwischen in Ruhe überlappenden Paaren per Kollisionsgruppen/Hooks aus; dann `/workspace/oase_b/vr/o20.py t2` (Test: Kontaktliste muss leer sein außer Liege), Kiefer/Kopf/Arm/Beine-Shots prüfen, dann `?v=1023o20` veröffentlichen.
