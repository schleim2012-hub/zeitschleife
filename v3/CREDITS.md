# Zeitschleife V3 – Credits

## Video
- Zeitwirbel: "Time Vortex Collection REMASTERED", Clip 3, von **Delta FX** (https://www.youtube.com/@deltafx43). Getönt und gekürzt (5 s, 1280x720).

## 3D-Modelle
- "Metal Trash Can", **Poly Haven** (https://polyhaven.com/a/metal_trash_can), CC0. Optimiert mit gltf-transform (webp 512, quantize).
- Items von **Poly Haven**, CC0, optimiert mit gltf-transform (webp 256–512, quantize, simplify):
  - Hammer: "Cross Pein Hammer" (https://polyhaven.com/a/cross_pein_hammer)
  - Leere Akte: "Binder Notebook" (https://polyhaven.com/a/binder_notebook)
- Blender-PBR-Modelle (eigene Arbeit, Blender 4.2, Cycles-CPU-Bake: AO, Normal, Rauheit, Farbe): Zauberwürfel, „Spielbub“-Konsole, Polarbild, 1-Mark-Münze, Brausepulver, Springmaus-Block, Tamagockel-Ei, Bleistift, Banane. Umgebungsreflexion per PMREM aus dem eigenen Backrooms-Panorama, weiche Kontaktschatten.
- Eigene Modelle, per three.js-Geometrie und selbst gezeichneten Canvas-Texturen (eigene Arbeit, keine Fremdscans): Banane, Trabbel-Radkappe, Polarbild (Foto aus eigenem Grok-Still M3), 100-D-Mark-Fantasieschein („Bank der Zeitschleife“, kein echter Schein), 1-Mark-Münze, Paketschnur, Kaugummi-Angel, Tamagockel-Ei, „Spielbub“-Konsole, Zauberwürfel, Bleistift, Kaugummi, Brausepulver, Springmaus-Notizblock. Slinky ebenfalls prozedural.
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

## Zeit-Fresser (Spielhalle-Automat)
- Eigener Code und eigene Grafik (Rewind V3, 2026). Nur die Genre-Mechanik "Labyrinth fressen" ist angelehnt, kein fremdes Layout, keine fremden Figuren, Namen oder Töne.

- FORUM 3D (Spielhalle 1984): eigener Raycaster-Code und eigene prozedurale Grafik/Töne, nur das Genre als Vorbild. Keine fremden Assets.

## Versteckte Küche in den Backrooms (V3 Alpha, Maniac-Mansion-Easter-Egg)
- Beton-Boden: ambientCG "Concrete034" (CC0), https://ambientcg.com/view?id=Concrete034
- Schrankholz: ambientCG "Wood049" (CC0), https://ambientcg.com/view?id=Wood049
- Wandputz: ambientCG "PaintedPlaster017" (CC0, schon im Projekt), blau getönt + Schmutz per Canvas
- Handschrift auf dem Kühlschrank-Zettel: Font "Kalam" (Indian Type Foundry, SIL Open Font License 1.1, fonts/Kalam-OFL.txt)
- Küche, Geräte, Kettensäge, Zettel: eigene three.js-Geometrie und Canvas-Texturen nach Petes Referenzbild. Alle Geräusche (Mikrowelle, Hamster-Fiepen, Popcorn, Ding, Kettensäge) live per WebAudio synthetisiert.

- Spielhalle 1984 Wandpaneel: ambientCG WoodSiding008 (CC0), bearbeitet (assets/tex/arc2/wall_*.jpg)
- Wohnung (v3/test/era_wohnung.html): Geräusche in assets/sfx/apt/ (Türknarzen, Klinke, Schritte, Röhren-TV, PC-Start, Kassettendeck, Telefon) und Stimmen in assets/vo/apt/ (Mara, Werbesprecher) mit ElevenLabs erzeugt (Sound Effects / TTS, Projekt-Account). Melodie des Kassettenrekorders, Telefonklingeln und Ersatz-Türgeräusche werden im Browser synthetisiert (eigene Erzeugung). Poster „ICH WILL ES GLAUBEN“, Pinnwand, Akten, Zeitschriften, Kassetten, Werbespot: eigene Canvas-Grafik, Parodie-Namen. Texturen: ambientCG (CC0), Möbel: Poly Haven (CC0).

## Wohnung – Akte-X-Büro (Grafik)
- 90er-PC (CRT, Mini-Tower, Tastatur, Maus), Aktenschrank-Reihe und kassettierte Holztür: eigene Modelle, Blender-Skript `v3/tools/gfx_wohnung/build_office_props.py` (prozedurale Materialien, eigene Erzeugung, keine Fremdlizenz).
- Lightmap/AO: eigene Blender-Cycles-Bake (`v3/tools/bake`). Schreibtisch, Stuhl, Lampe weiter von Poly Haven (CC0), siehe oben.

## Sonnen-Oase – Kundin (Hybrid-Figur o8)
- Basismodell, Rig (game_engine), Augen, Augenbrauen, Wimpern, Haar long01, Haut young_caucasian_female, Gesichts-Expressions (faceunits01): MakeHuman / MPFB System-Assets, Lizenz **CC0** (https://static.makehumancommunity.org/assets/license.html).
- Werkzeug: MPFB 2 (MakeHuman Plugin for Blender), GPL-3.0 – nur als Generator benutzt, kein Code im Spiel. Blender 4.2 (GPL).
- Generator: `v3/tools/oase/gen_kundin_hybrid.py`. Pose, Handtuch, AO, Öl-Maske und Hautton-Anpassung selbst erstellt.

## Figuren (Testseite Sonnen-Oase)

- Sonnen-Oase-Kundin: MakeHuman/MPFB-Basismesh, Haut, Haar `ponytail01`, Augen, Brauen – CC0 (makehuman_system_assets).
- Hautdetail, Brustwarzen-/Rötungs-/Kontakt-Shader, Öl-Barometer: eigene prozedurale Arbeit (keine Fremdtexturen).

## Physik (Testseite Sonnen-Oase)

- Rapier 3D (`@dimforge/rapier3d-compat` 0.21.0, Dimforge / Sébastien Crozet), Lizenz **Apache-2.0** (https://github.com/dimforge/rapier) – selbst gehostet als `v3/test/lib/rapier3d-compat-0.21.0.mjs` (WASM inline), Lizenztext `v3/test/lib/rapier3d-compat-LICENSE.txt`. Unverändert.
- Ragdoll-Aufbau (Kapseln für Arme/Unterschenkel an Schulter/Knie, Tonus-Motor, Feder-Griff) und die Feder-Regionen für Brust/Bauch/Oberschenkel: eigene Arbeit.

## Giß-Moe (v3/giss-moe.html, Kinder-Haustier)
- 3D-Figur, Fell, Kleidung, Frisuren, Spiele (Hütchen, Such Moe, Maulwurf, Giß-UNO): eigener three.js/Canvas-Code, keine fremden Assets. UNO als bekannte Spielidee nachgebaut, ohne Original-Logo oder -Grafik.
- Stimme (test/lib/giss/voice/): ElevenLabs TTS, Stimme „Lumi“ (zndmYEEoWWxRYyEL2ZZY), eleven_multilingual_v2, Tempo 1,12, eigene Texte; nachbearbeitet (Stille, loudnorm). Erzeuger: gissapk/voice_gen/gen_v3.py (außerhalb des Repos).
- Geräusche live per WebAudio. Schrift Kalam (SIL OFL 1.1).
- Halloween-Kostüme und Augen (Iris-Shader, Blinzeln): eigener three.js-Code. „Lottergeist“ nur stilistisch inspiriert, kein Markenname.
