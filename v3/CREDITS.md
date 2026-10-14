# Zeitschleife V3 – Credits

## Video
- Zeitwirbel: "Time Vortex Collection REMASTERED", Clip 3, von **Delta FX** (https://www.youtube.com/@deltafx43). Getönt und gekürzt (5 s, 1280x720).

## 3D-Modelle
- "Metal Trash Can", **Poly Haven** (https://polyhaven.com/a/metal_trash_can), CC0. Optimiert mit gltf-transform (webp 512, quantize).
- Items von **Poly Haven**, CC0, optimiert mit gltf-transform (webp 256–512, quantize, simplify):
  - Hammer: "Cross Pein Hammer" (https://polyhaven.com/a/cross_pein_hammer)
  - Leere Akte: "Binder Notebook" (https://polyhaven.com/a/binder_notebook)
- Blender-PBR-Modelle (eigene Arbeit, Blender 4.2, Cycles-CPU-Bake: AO, Normal, Rauheit, Farbe): Zauberwürfel, „Game Dude“-Konsole, Polaroid, 1-Mark-Münze, Brausepulver, Springmaus-Block, Tamagotchi-Ei, Bleistift, Banane. Umgebungsreflexion per PMREM aus dem eigenen Backrooms-Panorama, weiche Kontaktschatten.
- Eigene Modelle, per three.js-Geometrie und selbst gezeichneten Canvas-Texturen (eigene Arbeit, keine Fremdscans): Banane, Trabi-Radkappe, Polaroid (Foto aus eigenem Grok-Still M3), 100-D-Mark-Fantasieschein („Bank der Zeitschleife“, kein echter Schein), 1-Mark-Münze, Paketschnur, Kaugummi-Angel, Tamagotchi-Ei, „Game Dude“-Konsole, Zauberwürfel, Bleistift, Kaugummi, Brausepulver, Springmaus-Notizblock. Slinky ebenfalls prozedural.
- Panorama-Test (v3/test): Grok Imagine (grok.com), nachbearbeitet mit OpenCV.

- Möbel/Props von **Poly Haven** (CC0), optimiert mit gltf-transform: Television 02 (Benny Weimer, TV-Gehäuse), Metal Office Desk, Desk Lamp Arm 01, Vintage Telephone Wall Clock, Plastic Monobloc Chair 01, Plastic Crate 01, Wooden Crate 01, Old Military Crate, Painted Wooden Chair 01 (https://polyhaven.com/models).
- TV-Videos: eigene Musikvideos von Pete (Kanäle 1–13). Testbild „ZS 1984“: eigenes Design.

## Audio
- Stimmen: ElevenLabs (eleven_multilingual_v2), eigene Texte.
- Uhrenradio-Oldie, Neon-Brummen, Item-Piepen: live per WebAudio synthetisiert (eigene Komposition).
- Sound-Effekte in `sfx/` (eigene Erzeugung, prozedural mit `tools/make_sfx.py`, jsfxr-Stil, keine Fremd-Samples):
  pickup, drop, throw, trash_hit, bounce, banana, inv_open, inv_close, ui_hover, ui_click, slinky_boing, slinky_hop,
  clock_click, radio_static, step_carpet0-2, step_street0-2, coin, paper, error, bonus, penalty, glitch, whoosh, zip.
- Raumklang-Loops: amb_backrooms (Neon-Brummen und Flackern), amb_1989 (Menschenmenge und Jubel), ebenfalls prozedural.
- Positionsklang: WebAudio-PannerNode (HRTF) an Items, Mülleimer, Slinky, Radio.
- Freesound: noch nicht genutzt. Wenn später Samples dazukommen, nur CC0, mit Link hier eintragen.
- Musik: aus V2 übernommen.

## Software
- A-Frame 1.7.1 / three.js (MIT), gltf-transform (MIT).

## Hybrid-Raum (V3j)
- Teppich-Detailtextur: ambientCG "Carpet012" (CC0), https://ambientcg.com/view?id=Carpet012
- Tiefenschätzung für die Raum-Proxy-Geometrie: Depth Anything V2 Small (Apache-2.0), offline auf dem Build-Rechner, nicht im Spiel

## Getränkeautomat (V3l)
- Eigenes Modell, in Blender 4.2 modelliert und gebacken (Cycles: Farbe/AO/Rauheit/Normal, Kantenabrieb, Kratzer, Schmutz, Staub). Etiketten und Schilder markenfrei, eigene Gestaltung. Kein fremdes Asset.
- Brummen prozedural (WebAudio), keine Sounddatei.

## TV-Sender „Live-Film“ (V3l)
- "Night of the Living Dead" (1968, George A. Romero), gemeinfrei (Public Domain in den USA, weil 1968 der Copyright-Hinweis fehlte). Neu kodiert auf 480×360 H.264 mit ca. 230 kbps und Mono-AAC, in 8 Segmente zu 12 Minuten geteilt.

## 2041-Requisit Grünriegel (V3l)
- Eigenes Blender-Modell (3 Varianten, halb aufgerissene Folie, markenfreies Etikett). Eine Anspielung, kein Original-Logo.

## Kirmes / Basketball (Tests)
- Texturen ambientCG (CC0): Bricks076A, Asphalt025B, WoodFloor051, PaintedPlaster017, Fabric045 – https://ambientcg.com
- Sounds prozedural (WebAudio), keine Fremdaufnahmen.
