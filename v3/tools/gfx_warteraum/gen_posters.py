# Verblichene Amts-Plakate (Parodie, frei erfunden) in freie Zellen des Schilder-Atlas malen (signs.png) + atlas.json ergänzen.
# python3 gen_posters.py   (idempotent: malt die Zellen jedes Mal neu)
import json, os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
SRC=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../assets/warteraum/src')
F='/usr/share/fonts/truetype/sand-box/google/'
def font(n,s):
    for p in [F+n,n]:
        if os.path.exists(p): return ImageFont.truetype(p,s)
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',s)
BC='Barlow Condensed/BarlowCondensed-Bold.ttf'; BCX='Barlow Condensed/BarlowCondensed-ExtraBold.ttf'; SER='/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
A=Image.open(SRC+'/signs.png').convert('RGB'); AJ=json.load(open(SRC+'/atlas.json'))
rng=np.random.default_rng(38); random.seed(38)
def ctext(d,x,y,w,txt,f,fill):
    bb=d.textbbox((0,0),txt,font=f); d.text((x+(w-(bb[2]-bb[0]))/2-bb[0],y-bb[1]),txt,font=f,fill=fill)
def age(im,fade=0.35,seed=0):
    """vergilbt, ausgeblichen, Knickfalten, Wasserfleck, Klebeband-Ecken"""
    w,h=im.size; a=np.asarray(im).astype(float)/255
    yel=np.array([0.80,0.74,0.58]); a=a*(1-fade)+yel*fade*0.9          # Sonnenbleiche
    r=np.random.default_rng(seed); n=r.normal(size=(h//6+1,w//6+1)); n=np.asarray(Image.fromarray(((n-n.min())/(n.max()-n.min())*255).astype(np.uint8)).resize((w,h),Image.BICUBIC)).astype(float)/255
    a*=0.86+0.14*n[...,None]                                              # fleckig
    yy,xx=np.mgrid[0:h,0:w]
    for k in range(2):                                                    # Wasserrand
        cx,cy,rr=r.uniform(0.2,0.8)*w,r.uniform(0.5,0.95)*h,r.uniform(0.12,0.3)*min(w,h)
        dd=np.sqrt((xx-cx)**2+(yy-cy)**2); ring=np.exp(-((dd-rr)/(rr*0.06))**2)*0.18+(dd<rr)*0.05
        a*=1-ring[...,None]*np.array([0.2,0.45,0.9])
    for fx in [0.5]:                                                      # Knickfalte
        f=np.exp(-((xx-w*fx)/1.5)**2)*0.10; a*=1-f[...,None]
    f=np.exp(-((yy-h*0.5)/1.5)**2)*0.08; a*=1-f[...,None]
    e=np.minimum(np.minimum(xx,w-1-xx),np.minimum(yy,h-1-yy)); a*=(0.78+0.22*np.clip(e/14,0,1))[...,None]   # dunkle Ränder
    out=Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8)); d=ImageDraw.Draw(out,'RGBA')
    for (tx,ty) in [(0,0),(w,0),(0,h),(w,h)]:                             # Klebeband
        if r.random()<0.8:
            cw,ch=max(16,w//7),max(8,h//24); px=tx-cw//2; py=ty-ch//2
            d.polygon([(px,py+ch*0.2),(px+cw,py-ch*0.1),(px+cw,py+ch),(px,py+ch*1.2)],fill=(214,206,170,120))
    return out.filter(ImageFilter.GaussianBlur(0.5))
def cell(name,x,y,w,h,im): A.paste(im.resize((w,h),Image.LANCZOS),(x,y)); AJ['signs'][name]=[x,y,w,h]
# 1) Hochformat: LÄCHELN SIE! (Totenkopf-Smiley)
w,h=480,680; im=Image.new('RGB',(w,h),(196,186,150)); d=ImageDraw.Draw(im)
d.rectangle([14,14,w-15,h-15],outline=(110,30,26),width=6)
ctext(d,0,40,w,'LÄCHELN SIE!',font(BCX,78),(120,28,22))
cx,cy=w//2,300; d.ellipse([cx-120,cy-130,cx+120,cy+100],fill=(228,220,192),outline=(40,34,28),width=6)
d.rectangle([cx-70,cy+70,cx+70,cy+140],fill=(228,220,192),outline=(40,34,28),width=6)
for sx in (-1,1): d.ellipse([cx+sx*55-34,cy-50,cx+sx*55+34,cy+18],fill=(40,34,28))
d.polygon([(cx,cy+20),(cx-16,cy+56),(cx+16,cy+56)],fill=(40,34,28))
for i in range(5): d.line([cx-56+i*28,cy+82,cx-56+i*28,cy+138],fill=(40,34,28),width=4)
d.arc([cx-150,cy-150,cx+150,cy+120],200,340,fill=(40,34,28),width=0)
ctext(d,0,500,w,'Sie haben es',font(BC,56),(40,34,28)); ctext(d,0,560,w,'hinter sich.',font(BCX,62),(40,34,28))
ctext(d,0,634,w,'Ihr Jenseits-Bürgeramt',font(BC,26),(90,80,64))
cell('p_laecheln',1802,712,244,346,age(im,0.38,1))
# 2) Hochformat: Wartenummern-Info
w,h=480,680; im=Image.new('RGB',(w,h),(58,74,70)); d=ImageDraw.Draw(im)
ctext(d,0,36,w,'GEDULD',font(BCX,110),(214,206,170)); ctext(d,0,150,w,'ist eine Tugend.',font(BC,52),(200,192,160))
ctext(d,0,212,w,'Ewigkeit auch.',font(BC,52),(200,192,160))
d.rectangle([60,300,w-60,520],fill=(214,206,170)); ctext(d,60,318,w-120,'IHRE NUMMER',font(BCX,48),(40,34,28))
ctext(d,60,374,w-120,'0004 813',font(BCX,108),(120,28,22))
ctext(d,0,560,w,'Mittlere Wartezeit:',font(BC,40),(200,192,160)); ctext(d,0,606,w,'ca. 125 Jahre',font(BCX,48),(226,214,170))
cell('p_geduld',1802,1080,244,346,age(im,0.30,2))
# 3) Querformat: Passierschein A38 (rosa) – Vorbote für das Rätsel
w,h=1000,600; im=Image.new('RGB',(w,h),(206,198,170)); d=ImageDraw.Draw(im)
d.rectangle([12,12,w-13,h-13],outline=(40,34,28),width=5)
ctext(d,0,36,w,'HABEN SIE AN ALLES GEDACHT?',font(BCX,78),(40,34,28))
items=[('Totenschein (Original)',(226,222,206)),('Formular 666-B, dreifach',(226,222,206)),('Passierschein A38',(226,150,176))]
for i,(t,c) in enumerate(items):
    y=170+i*120; d.rectangle([90,y,150,y+60],outline=(40,34,28),width=5); d.rectangle([180,y-6,300,y+66],fill=c,outline=(60,50,40),width=2)
    d.text((330,y-4),t,font=font(BC,62),fill=(40,34,28))
d.line([100,y+10,120,y+50],fill=(120,28,22),width=8); d.line([120,y+50,160,y-20],fill=(120,28,22),width=8)
ctext(d,0,532,w,'Ohne rosa Passierschein keine Bearbeitung.',font(BC,40),(120,28,22))
cell('p_a38',602,1204,596,352,age(im,0.33,3))
# 4) Banner: Bitte nicht klopfen
w,h=1100,340; im=Image.new('RGB',(w,h),(120,30,26)); d=ImageDraw.Draw(im)
d.rectangle([16,16,w-17,h-17],outline=(214,196,150),width=6)
ctext(d,0,40,w,'BITTE NICHT KLOPFEN',font(BCX,130),(226,212,172)); ctext(d,0,206,w,'Wir rufen Sie auf. Irgendwann.',font(BC,72),(214,196,150))
cell('p_klopfen',1314,466,732,228,age(im,0.25,4))
A.save(SRC+'/signs.png'); json.dump(AJ,open(SRC+'/atlas.json','w'),indent=1); print('ok posters',[k for k in AJ['signs'] if k.startswith('p_')])
