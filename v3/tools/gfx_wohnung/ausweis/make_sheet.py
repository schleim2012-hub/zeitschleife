# Renders -> Sheet (3x2) mit Beschriftung.  python3 make_sheet.py RENDERDIR OUT.jpg
import sys, os
from PIL import Image, ImageDraw, ImageFont
D, O = sys.argv[1], sys.argv[2]
T = [('r_open_halli.png', 'offen · Halli Galli'), ('r_open_molder.png', 'offen · Fix Molder'), ('r_closed.png', 'geschlossen (Leder, blindgeprägt)'),
     ('r_card_halli.png', 'Nahaufnahme Karte'), ('r_card_molder.png', 'Nahaufnahme Karte'), ('r_desk.png', 'dunkles Holz, Lampenlicht')]
f = ImageFont.truetype('/usr/share/fonts/truetype/sand-box/google/Libre Franklin/LibreFranklin-VariableFont_wght.ttf', 26)
S = Image.new('RGB', (2880, 1440 + 50), (14, 14, 16)); d = ImageDraw.Draw(S)
for i, (fn, lab) in enumerate(T):
    im = Image.open(os.path.join(D, fn)).convert('RGB'); x, y = (i % 3) * 960, 50 + (i // 3) * 720; S.paste(im, (x, y))
    d.rectangle((x, y, x + 12 + d.textlength(lab, font=f) + 12, y + 40), fill=(0, 0, 0)); d.text((x + 12, y + 7), lab, font=f, fill=(235, 230, 215))
d.text((14, 10), 'Rewind · Akte-X-Büro · FBI-Ausweise (fbi_id_halli.glb / fbi_id_molder.glb) · Blender-Cycles-Prüfrender der fertigen GLBs', font=f, fill=(200, 200, 200))
S.save(O, quality=90); print(O)
