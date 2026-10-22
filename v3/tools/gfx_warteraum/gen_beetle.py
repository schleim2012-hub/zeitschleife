# Beetle-Umbau (v4): Gemälde-Atlas aus generierten Ölbildern, Pin-up-Atlas (eigenes, austauschbares Bild),
# Figuren-Texturen aus fig/in/*.jpg.  Reihenfolge: gen_tex.py -> gen_posters.py -> gen_beetle.py
# Pin-ups: pinups.png = Standard (bekleidet, frech). window.ZS_ADULT (nirgends gesetzt) lässt gfx_warteraum.js
# stattdessen assets/warteraum/pinups_adult.jpg laden, falls es existiert – diese Variante wird hier NICHT gebaut.
import os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE=os.path.dirname(os.path.abspath(__file__)); SRC=HERE+'/../../assets/warteraum/src'; B=HERE+'/beetle_src'
G='/usr/share/fonts/truetype/sand-box/google/'
def F(p,s): return ImageFont.truetype(G+p,s)
# 1) Gemälde 2x2 à 512 (Zellen: 0 Land, 1 Stadt, 2 Pflanze, 3 See) – nachgedunkelt, Firnis
P=Image.new('RGB',(1024,1024))
for i,n in enumerate(['land','city','plant','sea']):
    im=Image.open(B+'/paint_%s.jpg'%n).convert('RGB').resize((512,512),Image.LANCZOS)
    a=np.asarray(im).astype(float)/255; a=np.power(a,0.8)*1.08*np.array([1.0,0.97,0.88])   # aufgehellt: sonst schwarze Rahmen im dunklen Raum
    P.paste(Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8)),((i%2)*512,(i//2)*512))
P.save(SRC+'/paintings.png')
# 2) Pin-ups: Atlas 1024x1024, zwei Zellen à 512x683 (3:4) oben; Text per Code
def cap(d,box,txt,f,fill,shadow=(0,0,0)):
    x,y,w,h=box; bb=d.textbbox((0,0),txt,font=f); tw=bb[2]-bb[0]; th=bb[3]-bb[1]
    X=x+(w-tw)/2-bb[0]; Y=y+(h-th)/2-bb[1]
    for dx,dy in [(3,3),(2,2)]: d.text((X+dx,Y+dy),txt,font=f,fill=shadow)
    d.text((X,Y),txt,font=f,fill=fill)
def pinup(src,lines,seed):
    im=Image.open(src).convert('RGB').resize((864,1152),Image.LANCZOS); d=ImageDraw.Draw(im)
    for (box,txt,font,fill) in lines: cap(d,box,txt,font,fill)
    # leicht vergilbt + Glanzrand (Kalenderdruck), keine Weißspitzen
    a=np.asarray(im).astype(float)/255; a=a*0.9*np.array([1.0,0.96,0.88])+0.02
    r=np.random.default_rng(seed); yy,xx=np.mgrid[0:1152,0:864]; e=np.minimum(np.minimum(xx,863-xx),np.minimum(yy,1151-yy))
    a*=(0.8+0.2*np.clip(e/30,0,1))[...,None]
    return Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8)).resize((512,683),Image.LANCZOS)
A=Image.new('RGB',(1024,1024),(18,16,14))
A.paste(pinup(B+'/pinup_gruft.jpg',[
    ((0,20,864,90),'GRÜSSE AUS DER GRUFT',F('Bungee/Bungee-Regular.ttf',66),(250,214,120)),
    ((0,105,864,70),'Sommer-Kalender 1988',F('Yellowtail/Yellowtail-Regular.ttf',58),(255,150,170)),
    ((0,880,864,110),'„Bei mir liegt man gern',F('Pacifico/Pacifico-Regular.ttf',62),(245,236,215)),
    ((0,985,864,110),'ein bisschen länger.“',F('Pacifico/Pacifico-Regular.ttf',62),(245,236,215)),
],1),(0,0))
A.paste(pinup(B+'/pinup_revue.jpg',[
    ((0,22,864,100),'FRÄULEIN STEMPEL',F('Righteous/Righteous-Regular.ttf',76),(150,240,200)),
    ((0,920,864,90),'„Ich stemple alles ab –',F('Lobster/Lobster-Regular.ttf',66),(250,230,205)),
    ((0,1010,864,90),'auch Ihren Antrag auf mehr.“',F('Lobster/Lobster-Regular.ttf',58),(250,230,205)),
    ((0,1090,864,50),'Schalter 0 · Sprechzeit ab Mitternacht',F('Barlow Condensed/BarlowCondensed-Bold.ttf',38),(170,200,185)),
],2),(512,0))
A.save(SRC+'/pinups.png')
J=json.load(open(SRC+'/atlas.json')); J['pinups']={'gruft':[0,0,512,683],'revue':[512,0,512,683],'size':1024}
json.dump(J,open(SRC+'/atlas.json','w'),indent=1)
# 3) Figuren-Texturen (Konzeptbilder 864x1152 -> 768x1024)
for n in ['oma','gruen','brand','jaeger','taucher','assi','frl','decke']:
    im=Image.open(HERE+'/fig/in/%s.jpg'%n).convert('RGB').resize((768,1024),Image.LANCZOS)
    if n=='assi':   # Totenblässe: Hauttöne (r>g>b, wenig gesättigt) Richtung bläuliches Porzellan ziehen, Paillettenrot bleibt
        a=np.asarray(im).astype(float)/255; r,g,b_=a[...,0],a[...,1],a[...,2]
        m=np.clip((g/(r+1e-3)-0.55)*5,0,1)*np.clip((r-b_)*8,0,1)*np.clip((r-0.35)*4,0,1)*(r>=g)
        m=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(float)/255
        L=a.mean(2,keepdims=True); pale=np.clip(L*np.array([0.93,0.97,1.04])+0.06,0,1)
        a=a*(1-0.75*m[...,None])+pale*0.75*m[...,None]; im=Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8))
    im.save(SRC+'/fig_%s.png'%n)
print('beetle ok')
