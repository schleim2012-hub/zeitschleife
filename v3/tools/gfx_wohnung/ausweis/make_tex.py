# Parodie-FBI-Ausweis (Rewind, Akte-X-Büro): Atlas-Texturen per PIL, alle Schrift per Font (keine KI-Schrift).
# python3 make_tex.py PHOTO_DIR OUTDIR   -> OUTDIR/<id>_color.png, <id>_normal.png, <id>_orm.png (1024), <id>_card_2k.png
# Atlas (UV, Ursprung oben links, 1024): A Innenseite Basis (Karte) 0,0-576,745 | B Innenseite Klappe (Marke) 576,0-1024,580
#                                        C Außenleder 576,580-1024,1024 | D Kanten 0,745-576,1024
import sys, os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageEnhance
PH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'photos')
OUT = sys.argv[2] if len(sys.argv) > 2 else 'out'; os.makedirs(OUT, exist_ok=True)
S = 2; N = 1024 * S
G = '/usr/share/fonts/truetype/sand-box/google/'
def F(path, size, var=None):
    f = ImageFont.truetype(path, int(size * S))
    if var:
        try: f.set_variation_by_name(var)
        except Exception: pass
    return f
FRANK = G + 'Libre Franklin/LibreFranklin-VariableFont_wght.ttf'
NARROW = G + 'Archivo Narrow/ArchivoNarrow-VariableFont_wght.ttf'
BASK = G + 'Libre Baskerville/LibreBaskerville-VariableFont_wght.ttf'
CINZ = G + 'Cinzel/Cinzel-VariableFont_wght.ttf'
OSW = G + 'Oswald/Oswald-VariableFont_wght.ttf'
COUR = G + 'Courier Prime/CourierPrime-Bold.ttf'
REG = {'A': (0, 0, 576, 745), 'B': (576, 0, 1024, 580), 'C': (576, 580, 1024, 1024), 'D': (0, 745, 576, 1024)}
def R(k): return tuple(v * S for v in REG[k])

AGENTS = {
    'halli': dict(photo='halli_02.png', crop=(40, 40, 496, 620), name='HALLI GALLI', no='X-1013-HG-0815', sex='F',
                  hair='ROT', eyes='GEHEIM', hgt="5'7\"", sig=11, dob='02/23/1964', issued='03/10/1993'),
    'molder': dict(photo='molder_02.png', crop=(70, 60, 500, 610), name='FIX MOLDER', no='X-1013-FM-4711', sex='M',
                   hair='BRAUN', eyes='GEHEIM', hgt="6'0\"", sig=23, dob='10/13/1961', issued='03/10/1993'),
}

def noise(w, h, blur, seed):
    rs = np.random.RandomState(seed); a = (rs.rand(h, w) * 255).astype(np.uint8)
    im = Image.fromarray(a).filter(ImageFilter.GaussianBlur(blur)) if blur else Image.fromarray(a)
    x = np.asarray(im).astype(np.float32); x = (x - x.mean()) / (x.std() + 1e-6); return x

def leather(w, h, seed, base=(38, 26, 19), worn=0.0):
    g = 0.55 * noise(w, h, 1.2, seed) + 0.35 * noise(w, h, 3, seed + 1) + 0.6 * noise(w, h, 18, seed + 2)
    cells = noise(w, h, 2.2, seed + 3); grain = np.clip(np.abs(cells) < 0.18, 0, 1).astype(np.float32)  # Narbung (feine Rillen)
    hgt = 0.5 + 0.035 * g - 0.09 * grain
    col = np.array(base, np.float32)[None, None, :] * (1 + 0.12 * g[..., None] - 0.25 * grain[..., None])
    return col, hgt

def edge_wear(w, h, seed, amount):  # hellere abgegriffene Ränder
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy)) / (14 * S)
    n = noise(w, h, 6, seed); m = np.clip(1 - d + 0.35 * n, 0, 1) ** 2 * amount
    return m

def stitches(dr, hd, box, inset, col=(92, 74, 52)):
    x0, y0, x1, y1 = box; i = inset; L = 7 * S; gap = 5 * S
    for (ax, ay, bx, by) in [(x0+i, y0+i, x1-i, y0+i), (x1-i, y0+i, x1-i, y1-i), (x1-i, y1-i, x0+i, y1-i), (x0+i, y1-i, x0+i, y0+i)]:
        ln = math.hypot(bx-ax, by-ay); ux, uy = (bx-ax)/ln, (by-ay)/ln; t = 0
        while t + L < ln:
            p = (ax+ux*t, ay+uy*t, ax+ux*(t+L), ay+uy*(t+L)); dr.line(p, fill=col, width=int(1.6*S)); hd.line(p, fill=150, width=int(2.2*S)); t += L + gap
        # Stichkanal (Rille)
    return

def text_c(dr, xy, s, font, fill, anchor='ms', spacing=0):
    if spacing == 0:
        dr.text(xy, s, font=font, fill=fill, anchor=anchor); return
    ws = [dr.textlength(c, font=font) for c in s]; tot = sum(ws) + spacing * (len(s) - 1)
    x = xy[0] - tot / 2 if anchor[0] == 'm' else xy[0]
    for c, w in zip(s, ws):
        dr.text((x, xy[1]), c, font=font, fill=fill, anchor='l' + anchor[1]); x += w + spacing

def fit_font(dr, s, path, size, maxw, var=None):
    while size > 4:
        f = F(path, size, var)
        if dr.textlength(s, font=f) <= maxw: return f
        size -= 0.5
    return F(path, 4, var)

def circle_text(img, cx, cy, r, s, font, fill, start=-90, span=None, bottom=False):
    # Buchstaben einzeln entlang eines Kreises; oben im Uhrzeigersinn, unten (bottom=True) gegen den Uhrzeigersinn und aufrecht
    dr = ImageDraw.Draw(img); ws = [dr.textlength(c, font=font) for c in s]; tot = sum(ws)
    ang_tot = abs(span) if span else tot / r * 180 / math.pi
    sg = -1 if bottom else 1; a = start - sg * ang_tot / 2
    for c, w in zip(s, ws):
        da = sg * w / tot * ang_tot; mid = a + da / 2
        if c != ' ':
            sz = int(font.size * 1.6); t = Image.new('L', (sz, sz), 0); ImageDraw.Draw(t).text((sz/2, sz/2), c, font=font, fill=255, anchor='mm')
            t = t.rotate(-(mid - 90) if bottom else -(mid + 90), resample=Image.BICUBIC)
            x = cx + r * math.cos(math.radians(mid)) - sz / 2; y = cy + r * math.sin(math.radians(mid)) - sz / 2
            img.paste(Image.new(img.mode, (sz, sz), fill), (int(x), int(y)), t)
        a += da

def star(cx, cy, r, ri=None, n=5, rot=-90):
    ri = ri or r * 0.42; pts = []
    for i in range(n * 2):
        rr = r if i % 2 == 0 else ri; a = math.radians(rot + i * 180 / n); pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts

def eye_triangle(dr, cx, cy, s, fill, bg, w):
    tri = [(cx, cy - s * 0.62), (cx + s * 0.6, cy + s * 0.42), (cx - s * 0.6, cy + s * 0.42)]
    dr.polygon(tri, outline=fill, width=w)
    ew, eh = s * 0.42, s * 0.2; ey = cy + s * 0.08
    dr.chord((cx - ew, ey - eh, cx + ew, ey + eh * 1.1), 180, 360, fill=fill); dr.chord((cx - ew, ey - eh * 1.1, cx + ew, ey + eh), 0, 180, fill=fill)
    dr.ellipse((cx - ew*0.82, ey - eh*0.75, cx + ew*0.82, ey + eh*0.75), fill=bg)
    dr.ellipse((cx - s*0.11, ey - s*0.11, cx + s*0.11, ey + s*0.11), fill=fill)
    dr.ellipse((cx - s*0.04, ey - s*0.07, cx + s*0.01, ey - s*0.02), fill=bg)
    for k in range(9):  # Strahlen
        a = math.radians(-90 + (k - 4) * 16); r0, r1 = s * 0.78, s * (0.98 if k % 2 == 0 else 0.9)
        dr.line((cx + r0*math.cos(a), cy - s*0.15 + r0*math.sin(a), cx + r1*math.cos(a), cy - s*0.15 + r1*math.sin(a)), fill=fill, width=max(1, w//2))

def seal(size, ink=(24, 40, 82), paper=(0, 0, 0, 0)):
    # Fantasie-Siegel: Sternkranz, Umschrift, Auge im Dreieck (bewusst NICHT das echte FBI-Siegel)
    im = Image.new('RGBA', (size, size), paper); dr = ImageDraw.Draw(im); c = size / 2; r = size / 2 - 2
    dr.ellipse((c-r, c-r, c+r, c+r), fill=ink); dr.ellipse((c-r*0.93, c-r*0.93, c+r*0.93, c+r*0.93), fill=(232, 222, 190))
    dr.ellipse((c-r*0.9, c-r*0.9, c+r*0.9, c+r*0.9), fill=ink); dr.ellipse((c-r*0.62, c-r*0.62, c+r*0.62, c+r*0.62), fill=(214, 178, 82))
    dr.ellipse((c-r*0.58, c-r*0.58, c+r*0.58, c+r*0.58), fill=(232, 222, 190))
    f = ImageFont.truetype(CINZ, int(size * 0.085)); f.set_variation_by_name('Bold')
    circle_text(im, c, c, r * 0.76, 'FEDERAL BUREAU OF INVESTIGATION', f, (240, 230, 200), start=-90, span=250)
    f2 = ImageFont.truetype(CINZ, int(size * 0.07)); f2.set_variation_by_name('Bold')
    circle_text(im, c, c, r * 0.76, 'ABTEILUNG X', f2, (240, 230, 200), start=90, span=70, bottom=True)
    for a in (-150 + 360, 150 - 360, 160, 20):
        pass
    for a in (160, 20):
        dr.polygon(star(c + r*0.76*math.cos(math.radians(a)), c + r*0.76*math.sin(math.radians(a)), size*0.03), fill=(240, 230, 200))
    for k in range(13):  # Sternkranz innen
        a = math.radians(-90 + k * 360 / 13); dr.polygon(star(c + r*0.5*math.cos(a), c + r*0.5*math.sin(a), size*0.022), fill=ink)
    eye_triangle(dr, c, c + size*0.03, size*0.3, ink, (232, 222, 190), max(2, size // 70))
    return im

def scribble(w, h, seed, ink=(18, 24, 70)):
    # Unterschrift-Krakel: Schleifenkurve (Zykloide) mit wechselnder Größe, zwei Züge + Unterstrich
    rs = random.Random(seed); im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); dr = ImageDraw.Draw(im)
    def stroke(xa, xb, base, amp):
        pts = []; t = 0.0; ph = rs.uniform(0, 6); x = xa
        while x < xb:
            r = amp * (0.55 + 0.45 * math.sin(t * 0.37 + ph)) * rs.uniform(0.85, 1.15)
            x = xa + t * 2.2 * S + 0.8 * r * math.cos(t * 0.9)
            y = base - r * math.sin(t * 0.9) - (r * 0.9 if rs.random() < 0.04 else 0)
            pts.append((x, y)); t += 0.12
        dr.line(pts, fill=ink, width=int(1.4 * S), joint='curve')
    stroke(w * 0.05, w * 0.40, h * 0.62, h * 0.32)
    stroke(w * 0.46, w * 0.90, h * 0.60, h * 0.26)
    dr.line([(w*0.08 + i*w*0.008, h*0.86 - math.sin(i*0.12)*h*0.04) for i in range(100)], fill=ink, width=int(1.2 * S))
    return im

def guilloche(w, h, col):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); dr = ImageDraw.Draw(im)
    for k in range(0, h + 40 * S, 7 * S):
        pts = [(x, k + 6 * S * math.sin(x / (21.0 * S)) + 4 * S * math.sin(x / (7.3 * S) + k)) for x in range(0, w, 3)]
        dr.line(pts, fill=col, width=1)
    return im

def card(agent, W, H):
    a = AGENTS[agent]; cream = (238, 233, 214)
    im = Image.new('RGBA', (W, H), cream + (255,)); dr = ImageDraw.Draw(im)
    im.alpha_composite(guilloche(W, H, (150, 170, 200, 70)))
    # Mikrotext-Rand
    fm = F(FRANK, 5.2, 'Medium'); mt = 'FBI · ABTEILUNG X · DIE WAHRHEIT IST IRGENDWO DA DRAUSSEN · '
    bw = 9 * S; dr.rectangle((0, 0, W, bw), fill=(214, 206, 180)); dr.rectangle((0, H-bw, W, H), fill=(214, 206, 180))
    dr.rectangle((0, 0, bw, H), fill=(214, 206, 180)); dr.rectangle((W-bw, 0, W, H), fill=(214, 206, 180))
    line = mt * 12
    dr.text((bw, bw/2), line, font=fm, fill=(60, 70, 110), anchor='lm'); dr.text((bw, H-bw/2), line, font=fm, fill=(60, 70, 110), anchor='lm')
    for side in (0, 1):
        t = Image.new('RGBA', (H, bw), (0, 0, 0, 0)); ImageDraw.Draw(t).text((bw, bw/2), line, font=fm, fill=(60, 70, 110), anchor='lm')
        t = t.rotate(90 if side == 0 else -90, expand=True); im.alpha_composite(t, (0 if side == 0 else W - bw, 0))
    dr.rectangle((bw, bw, W-bw, H-bw), outline=(40, 52, 96), width=int(1.2*S))
    # Kopfband
    top = bw + 4*S; band = 62*S
    dr.rectangle((bw+3*S, top, W-bw-3*S, top+band), fill=(26, 38, 78))
    f1 = fit_font(dr, 'FEDERAL BUREAU OF INVESTIGATION', NARROW, 31, W - 2*bw - 22*S, 'Bold')
    dr.text((W/2, top + 30*S), 'FEDERAL BUREAU OF INVESTIGATION', font=f1, fill=(244, 236, 210), anchor='ms')
    f2 = F(FRANK, 10.5, 'SemiBold'); text_c(dr, (W/2, top + 51*S), 'UNITED STATES DEPARTMENT OF JUSTICE', f2, (214, 184, 96), spacing=1.4*S)
    # Foto
    y0 = top + band + 14*S; px0 = bw + 14*S; pw = 250*S; ph = int(pw * 1.27)
    p = Image.open(os.path.join(PH, a['photo'])).convert('RGB').crop(a['crop']).resize((pw, ph), Image.LANCZOS)
    p = ImageEnhance.Color(p).enhance(0.82); p = ImageEnhance.Contrast(p).enhance(0.93)
    p = Image.blend(p, Image.new('RGB', p.size, (236, 214, 170)), 0.10)  # 90er-Fotopapier, leicht vergilbt
    dr.rectangle((px0 - 3*S, y0 - 3*S, px0 + pw + 3*S, y0 + ph + 3*S), fill=(250, 248, 240), outline=(120, 120, 120), width=S)
    im.paste(p, (px0, y0))
    # Prägestempel-Ecke über dem Foto (Siegel-Ausschnitt, halbtransparent)
    sm = seal(110*S).copy(); al = sm.split()[3].point(lambda v: int(v * 0.33)); sm.putalpha(al)
    im.alpha_composite(sm, (px0 + pw - 70*S, y0 + ph - 72*S))
    # rechte Spalte: Siegel + Daten
    cx0 = px0 + pw + 14*S; cw = W - bw - 12*S - cx0
    ss = int(min(cw, 118*S)); im.alpha_composite(seal(ss), (int(cx0 + (cw - ss)/2), y0))
    fl = F(FRANK, 8.5, 'SemiBold'); fv = F(COUR, 13.5)
    yy = y0 + ss + 16*S
    for lab, val in [('AUSWEIS-NR. / ID NO.', a['no']), ('AUSGESTELLT / ISSUED', a['issued']), ('GÜLTIG BIS / EXPIRES', '12/31/1998'),
                     ('GEB. / DOB', a['dob']), ('GRÖSSE / HGT', a['hgt']), ('HAAR / HAIR', a['hair']), ('AUGEN / EYES', a['eyes'])]:
        dr.text((cx0 + 2*S, yy), lab, font=fl, fill=(40, 52, 96), anchor='ls'); yy += 13*S
        ff = fit_font(dr, val, COUR, 13.5, cw - 4*S)
        dr.text((cx0 + 2*S, yy), val, font=ff, fill=(20, 20, 24), anchor='ls'); yy += 17*S
    # Name
    yN = y0 + ph + 46*S
    fs = F(OSW, 23, 'SemiBold'); text_c(dr, (W/2, yN), 'SPEZIAL AGENT', fs, (26, 38, 78), spacing=5*S)
    fn = fit_font(dr, a['name'], OSW, 74, W - 2*bw - 30*S, 'Bold')
    dr.text((W/2, yN + 76*S), a['name'], font=fn, fill=(16, 16, 20), anchor='ms')
    # Unterschrift
    yS = yN + 100*S; sw = int(W * 0.56); sh = 52*S
    im.alpha_composite(scribble(sw, sh, a['sig']), (int(W/2 - sw/2), yS))
    dr.line((W*0.22, yS + sh - 3*S, W*0.78, yS + sh - 3*S), fill=(60, 60, 70), width=S)
    dr.text((W/2, yS + sh + 10*S), 'UNTERSCHRIFT DES INHABERS / SIGNATURE OF BEARER', font=F(FRANK, 6.8, 'Medium'), fill=(60, 66, 90), anchor='ms')
    fq = F(FRANK, 7.2, 'SemiBold'); yq = H - bw - 26*S
    dr.line((bw + 20*S, yq - 14*S, W - bw - 20*S, yq - 14*S), fill=(40, 52, 96), width=S)
    dr.text((W/2, yq), 'EIGENTUM DER US-REGIERUNG · NICHT ÜBERTRAGBAR', font=fq, fill=(40, 52, 96), anchor='ms')
    dr.text((W/2, yq + 11*S), 'GOVERNMENT PROPERTY · NOT TRANSFERABLE · FORM FD-1013 (REV. 4-93)', font=F(FRANK, 6.2, 'Medium'), fill=(60, 66, 90), anchor='ms')
    return im

def age(im, seed, amt=1.0, scratches=14):
    # Vergilbung, Abrieb, Kratzer, Laminatglanz
    rs = random.Random(seed); W, H = im.size
    arr = np.asarray(im.convert('RGB')).astype(np.float32)
    n = noise(W, H, 20, seed); n2 = noise(W, H, 1, seed + 5)
    yel = np.array([1.0, 0.96, 0.85], np.float32)
    arr = arr * (1 - 0.08*amt + 0.0) * (yel ** (0.6*amt))[None, None, :] * (1 + 0.035*amt*n[..., None] + 0.02*amt*n2[..., None])
    out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGBA'); dr = ImageDraw.Draw(out, 'RGBA')
    for _ in range(scratches):
        x, y = rs.uniform(0, W), rs.uniform(0, H); l = rs.uniform(6, 40)*S; a = rs.uniform(0, math.pi)
        dr.line((x, y, x + l*math.cos(a), y + l*math.sin(a)), fill=(255, 255, 255, rs.randint(10, 26)), width=1)
    # Laminat-Glanzband diagonal
    gl = Image.new('L', (W, H), 0); gd = ImageDraw.Draw(gl)
    gd.polygon([(W*0.15, 0), (W*0.42, 0), (W*0.05, H), (-W*0.22, H)], fill=26); gl = gl.filter(ImageFilter.GaussianBlur(30*S))
    out = Image.composite(Image.new('RGBA', (W, H), (255, 252, 240, 255)), out, gl)
    return out

def build(agent, seed):
    col = np.zeros((N, N, 3), np.float32); hgt = np.full((N, N), 0.5, np.float32); rough = np.full((N, N), 0.62, np.float32); metal = np.zeros((N, N), np.float32)
    # --- Leder: A (innen), B (innen), C (außen), D (Kanten)
    for k, base, sd in [('A', (44, 26, 15), 1), ('B', (44, 26, 15), 2), ('C', (27, 16, 9), 3), ('D', (20, 12, 7), 4)]:
        x0, y0, x1, y1 = R(k); w, h = x1-x0, y1-y0
        c, hh = leather(w, h, seed*10 + sd, base)
        wear = edge_wear(w, h, seed*10 + sd + 50, 0.9 if k == 'C' else 0.5)
        c = c * (1 - wear[..., None]) + (c * 1.45 + np.array([10, 6, 3], np.float32)) * wear[..., None]
        col[y0:y1, x0:x1] = c; hgt[y0:y1, x0:x1] = hh; rough[y0:y1, x0:x1] = 0.58 - 0.12*wear
    img = Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).convert('RGBA'); dr = ImageDraw.Draw(img)
    himg = Image.fromarray((np.clip(hgt, 0, 1)*255).astype(np.uint8)); hd = ImageDraw.Draw(himg)
    for k in 'ABC': stitches(dr, hd, R(k), 9*S)
    # Außen: blindgeprägtes Siegel (dunkel) mittig
    x0, y0, x1, y1 = R('C'); s = 210*S; st = Image.new('L', (s, s), 0); sd = ImageDraw.Draw(st); c = s/2
    sd.ellipse((4*S, 4*S, s-4*S, s-4*S), outline=255, width=5*S); sd.ellipse((22*S, 22*S, s-22*S, s-22*S), outline=255, width=2*S)
    fst = ImageFont.truetype(CINZ, int(15*S)); fst.set_variation_by_name('Bold')
    circle_text(st, c, c, s/2 - 14*S, 'FEDERAL BUREAU OF INVESTIGATION', fst, 255, start=-90, span=250)
    eye_triangle(sd, c, c + 8*S, s*0.34, 255, 0, 4*S)
    st = st.filter(ImageFilter.GaussianBlur(1.2*S)); cxy = (int((x0+x1)/2 - s/2), int((y0+y1)/2 - s/2))
    img.paste(Image.new('RGBA', (s, s), (12, 7, 4, 255)), cxy, st.point(lambda v: int(v*0.55)))
    hcrop = himg.crop((cxy[0], cxy[1], cxy[0]+s, cxy[1]+s)); himg.paste(ImageChops.subtract(hcrop, st.point(lambda v: int(v*0.35))), cxy)  # blindgeprägt (vertieft)
    # --- A: Ausweiskarte im Laminat (randlos im Fenster des Etuis)
    x0, y0, x1, y1 = R('A'); m = 26*S; W, H = (x1-x0) - 2*m, (y1-y0) - 2*m
    cd = age(card(agent, W, H), seed + 7)
    img.alpha_composite(Image.new('RGBA', (W + 8*S, H + 8*S), (20, 13, 9, 255)), (x0 + m - 4*S, y0 + m - 4*S))  # Fensterkante
    img.alpha_composite(cd, (x0 + m, y0 + m)); cd.save(os.path.join(OUT, agent + '_card_2k.png'))
    himg.paste(Image.new('L', (W, H), 175), (x0 + m, y0 + m)); hd.rectangle((x0+m-4*S, y0+m-4*S, x0+m+W+4*S, y0+m+H+4*S), outline=205, width=4*S)
    rough[y0+m:y0+m+H, x0+m:x0+m+W] = 0.22
    # --- B: goldene Marke
    badge(img, himg, rough, metal, R('B'), seed)
    # --- Normal-Map
    hf = np.asarray(himg.filter(ImageFilter.GaussianBlur(0.8*S))).astype(np.float32) / 255.0
    gx = np.zeros_like(hf); gy = np.zeros_like(hf); gx[:, 1:-1] = hf[:, 2:] - hf[:, :-2]; gy[1:-1, :] = hf[2:, :] - hf[:-2, :]
    st = 5.0; nx, ny, nz = -gx*st, gy*st, np.ones_like(hf)  # glTF: +Y grün = oben (OpenGL-Konvention)
    l = np.sqrt(nx*nx + ny*ny + nz*nz); nm = np.stack([nx/l, ny/l, nz/l], -1)*0.5 + 0.5
    nimg = Image.fromarray((nm*255).astype(np.uint8)).resize((1024, 1024), Image.LANCZOS)
    orm = np.stack([np.ones_like(rough), np.clip(rough, 0, 1), np.clip(metal, 0, 1)], -1)
    oimg = Image.fromarray((orm*255).astype(np.uint8)).resize((1024, 1024), Image.LANCZOS)
    cimg = img.convert('RGB').resize((1024, 1024), Image.LANCZOS)
    cimg.save(os.path.join(OUT, agent + '_color.png')); nimg.save(os.path.join(OUT, agent + '_normal.png')); oimg.save(os.path.join(OUT, agent + '_orm.png'))
    img.convert('RGB').save(os.path.join(OUT, agent + '_color_2k.png'))

def badge(img, himg, rough, metal, box, seed):
    x0, y0, x1, y1 = box; w, h = x1-x0, y1-y0; cx = w/2
    H = Image.new('L', (w, h), 0); hd = ImageDraw.Draw(H)  # Relief-Höhe der Marke (0 = keine Marke)
    E = Image.new('L', (w, h), 0); ed = ImageDraw.Draw(E)  # Emaille-Maske (blau)
    K = Image.new('L', (w, h), 0); kd = ImageDraw.Draw(K)  # dunkle Vertiefungen (Schrift)
    top, bot, hw = h*0.2, h*0.92, w*0.36
    def outline(sc=1.0, dy=0):
        pts = []
        for i in range(0, 41):
            v = i/40; y = top + (bot-top)*v
            ww = hw*sc*(1.0 + 0.06*math.sin(math.pi*min(v/0.55, 1))) if v < 0.55 else hw*sc*1.06*(1 - ((v-0.55)/0.45)**1.6)
            pts.append((cx + ww, y + dy*(1-v)))
        pts += [(2*cx - x, y) for (x, y) in reversed(pts)]
        # Zinnen oben
        return pts
    hd.polygon(outline(), fill=150); hd.line(outline() + [outline()[0]], fill=230, width=9*S)
    hd.line(outline(0.86, 14*S) + [outline(0.86, 14*S)[0]], fill=200, width=3*S)
    # abstrakter Adler oben (Flügel-Chevrons + Kopf)
    wy = top - 4*S
    for side in (-1, 1):
        for k in range(5):
            o = k*16*S; hd.polygon([(cx + side*18*S, wy - 6*S + k*7*S), (cx + side*(70*S + o), wy - 64*S + k*20*S - k*k*2*S), (cx + side*(78*S + o), wy - 52*S + k*20*S - k*k*2*S), (cx + side*26*S, wy + 8*S + k*7*S)], fill=215 - k*10)
    hd.ellipse((cx - 16*S, wy - 46*S, cx + 16*S, wy - 14*S), fill=235); hd.polygon([(cx + 14*S, wy - 34*S), (cx + 30*S, wy - 28*S), (cx + 12*S, wy - 24*S)], fill=235)
    hd.polygon([(cx - 22*S, wy - 2*S), (cx + 22*S, wy - 2*S), (cx, wy + 30*S)], fill=220)
    # Rundsiegel mit Umschrift
    cy = top + (bot-top)*0.40; r = hw*0.80
    hd.ellipse((cx-r, cy-r, cx+r, cy+r), fill=235); hd.ellipse((cx-r*0.96, cy-r*0.96, cx+r*0.96, cy+r*0.96), fill=175)
    hd.ellipse((cx-r*0.66, cy-r*0.66, cx+r*0.66, cy+r*0.66), fill=235); hd.ellipse((cx-r*0.61, cy-r*0.61, cx+r*0.61, cy+r*0.61), fill=165)
    ft = ImageFont.truetype(CINZ, int(15*S)); ft.set_variation_by_name('Black')
    circle_text(K, cx, cy, r*0.81, 'FEDERAL BUREAU OF INVESTIGATION', ft, 255, start=-90, span=262)
    ft2 = ImageFont.truetype(CINZ, int(13*S)); ft2.set_variation_by_name('Black')
    circle_text(K, cx, cy, r*0.81, 'ABT. X', ft2, 255, start=90, span=40, bottom=True)
    ed.ellipse((cx-r*0.61, cy-r*0.61, cx+r*0.61, cy+r*0.61), fill=255)
    tmp = Image.new('L', (w, h), 0); eye_triangle(ImageDraw.Draw(tmp), cx, cy + 6*S, r*0.78, 255, 0, 4*S)
    E.paste(0, (0, 0), tmp); H.paste(225, (0, 0), tmp)
    # Spruchband
    by = top + (bot-top)*0.70; bw2 = hw*0.98; bh = 26*S
    hd.polygon([(cx-bw2, by-bh/2), (cx+bw2, by-bh/2), (cx+bw2-10*S, by), (cx+bw2, by+bh/2), (cx-bw2, by+bh/2), (cx-bw2+10*S, by)], fill=225)
    fb = fit_font(kd, 'SPEZIAL AGENT', CINZ, 17, bw2*2 - 30*S, 'Black'); kd.text((cx, by + 1*S), 'SPEZIAL AGENT', font=fb, fill=255, anchor='mm')
    for side in (-1, 1): hd.polygon(star(cx + side*hw*0.42, top + (bot-top)*0.86, 9*S), fill=235)
    # Hängelasche/Leder-Aufnahme oben
    Hm = np.asarray(H).astype(np.float32)/255; Km = np.asarray(K.filter(ImageFilter.GaussianBlur(0.4*S))).astype(np.float32)/255; Em = np.asarray(E).astype(np.float32)/255
    mask = (Hm > 0.01).astype(np.float32); hgt = np.where(mask > 0, 0.55 + 0.45*Hm - 0.18*Km, 0)
    # Beleuchtung einbacken (dezent, Licht von oben links)
    hb = Image.fromarray((hgt*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2*S)); hf = np.asarray(hb).astype(np.float32)/255
    gx = np.zeros_like(hf); gy = np.zeros_like(hf); gx[:, 1:-1] = hf[:, 2:] - hf[:, :-2]; gy[1:-1, :] = hf[2:, :] - hf[:-2, :]
    nx, ny, nz = -gx*9, -gy*9, np.ones_like(hf); l = np.sqrt(nx*nx+ny*ny+nz*nz); nx, ny, nz = nx/l, ny/l, nz/l
    L = np.array([-0.45, -0.55, 0.7]); L = L/np.linalg.norm(L); d = np.clip(nx*L[0]+ny*L[1]+nz*L[2], 0, 1)
    spec = np.clip(nz*0.0 + d, 0, 1)**18
    n = noise(w, h, 1, seed + 99); n2 = noise(w, h, 12, seed + 98)
    gold = np.array([206, 160, 72], np.float32); dark = np.array([96, 66, 26], np.float32); enam = np.array([30, 44, 92], np.float32)
    shade = (0.55 + 0.6*d)[..., None]
    c = gold[None, None]*shade*(1 + 0.035*n[..., None] + 0.025*n2[..., None]) + 120*spec[..., None]
    c = c*(1 - Km[..., None]) + dark[None, None]*Km[..., None]*(0.8 + 0.3*d[..., None])
    ens = Em*(1 - (Hm > 0.86).astype(np.float32)); c = c*(1 - ens[..., None]) + enam[None, None]*(0.8 + 0.4*d[..., None])*ens[..., None]
    # Patina in Vertiefungen
    cav = np.clip(0.88 - Hm, 0, 1)*mask; c = c*(1 - 0.35*cav[..., None])
    a = np.clip(mask, 0, 1)
    # Schlagschatten auf Leder
    sh = Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5*S)); sh = np.asarray(sh).astype(np.float32)/255
    sh = np.roll(np.roll(sh, 4*S, 0), 3*S, 1)
    base = np.asarray(img.crop(box).convert('RGB')).astype(np.float32)*(1 - 0.55*sh[..., None])
    out = base*(1 - a[..., None]) + c*a[..., None]
    img.paste(Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).convert('RGBA'), (x0, y0))
    hcur = np.asarray(himg.crop(box)).astype(np.float32)/255; hn = np.where(mask > 0, 0.6 + 0.4*hgt, hcur)
    himg.paste(Image.fromarray((np.clip(hn, 0, 1)*255).astype(np.uint8)), (x0, y0))
    rough[y0:y1, x0:x1] = np.where(mask > 0, 0.38 + 0.25*ens + 0.1*np.clip(n2, -1, 1), rough[y0:y1, x0:x1])
    metal[y0:y1, x0:x1] = np.where(mask > 0, 0.55*(1 - ens), 0)

if __name__ == '__main__':
    which = sys.argv[3].split(',') if len(sys.argv) > 3 else list(AGENTS)
    for i, k in enumerate(which): build(k, 1993 + i*7); print('ok', k)
