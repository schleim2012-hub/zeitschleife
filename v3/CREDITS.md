# Zeitschleife V3 – Credits

## Video
- Zeitwirbel: "Time Vortex Collection REMASTERED", Clip 3, von **Delta FX** (https://www.youtube.com/@deltafx43). Getönt und gekürzt (5 s, 1280x720).

## 3D-Modelle
- "Metal Trash Can", **Poly Haven** (https://polyhaven.com/a/metal_trash_can), CC0. Optimiert mit gltf-transform (webp 512, quantize).
- Alle übrigen Props: prozedural im Engine-Code (eigene Arbeit).

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
