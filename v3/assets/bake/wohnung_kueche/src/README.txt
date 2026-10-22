Lightmap (uv1, zweiter UV-Kanal). lm.exr/ao.exr: linear HDR aus Blender-Cycles (gleiche Ausrichtung wie lm.jpg). lm.png/ao.png = lm.jpg/ao.jpg verlustfrei.
lm.png ist sRGB-kodiert und auf lmScale=0.8104427456855774 normiert; Laufzeit: lightMapIntensity = lmIntensity(2.5461) × lmGain. AO = 0,3 + 0,7·AO.
UV1 je Mesh in uv1.bin (Float32, Offsets/Vertexzahlen in uv1.json).
