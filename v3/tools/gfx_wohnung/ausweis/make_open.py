# Offen-Variante aus der fertigen (quantisierten) GLB ableiten, damit 'cover' den Scharnier-Pivot behält:
# cover.rotation = 180° um +Z, Animation entfernt.  python3 make_open.py IN.glb OUT.glb  (danach gltf-transform prune)
import json, struct, sys
b = open(sys.argv[1], 'rb').read(); l = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + l]); rest = b[20 + l:]
for n in j['nodes']:
    if n.get('name') == 'cover': n['rotation'] = [0.0, 0.0, 1.0, 0.0]
j.pop('animations', None)
js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + len(rest)) + struct.pack('<II', len(js), 0x4E4F534A) + js + rest
open(sys.argv[2], 'wb').write(out)
