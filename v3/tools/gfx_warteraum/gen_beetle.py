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
# v7: Schönheitskönigin wie Pete 02 – kräftig teal-grüne Haut, leuchtend korallenrotes Haar, Schärpe „MISS JENSEITS“ (auf dem 864x1152-Konzeptbild)
def frl_look(im):
    import cv2, math
    a=np.asarray(im.convert('RGB')).astype(np.uint8); Hh,Ww=a.shape[:2]
    hsv=cv2.cvtColor(a,cv2.COLOR_RGB2HSV).astype(float); H=hsv[...,0]*2; S=hsv[...,1]/255; V=hsv[...,2]/255
    yy=np.mgrid[0:Hh,0:Ww][0]/Hh; f=a.astype(np.float32)/255; r,g=f[...,0],f[...,1]
    skin=(np.clip((g-r)*14,0,1)*np.clip((S-0.035)*14,0,1)*np.clip((V-0.12)*6,0,1)).astype(np.float32)
    hair=(((H>330)|(H<20))&(S>0.15)&(S<0.62)&(V>0.5)&(yy<0.2)).astype(np.float32)
    skin=cv2.GaussianBlur(skin,(0,0),1.0); hair=cv2.GaussianBlur(cv2.morphologyEx(hair,cv2.MORPH_OPEN,np.ones((3,3),np.uint8)),(0,0),1.5)
    h2=np.where(hair>0.01,4,H); s2=np.where(hair>0.01,np.clip(S*1.6+0.3,0,0.85),S); v2=np.where(hair>0.01,np.clip(V*1.02,0,1),V)
    out=cv2.cvtColor(np.stack([h2/2,s2*255,v2*255],-1).clip(0,255).astype(np.uint8),cv2.COLOR_HSV2RGB).astype(float)
    hm=hair[...,None]; res=a*(1-hm)+out*hm
    L=(0.3*res[...,0]+0.59*res[...,1]+0.11*res[...,2])[...,None]; tg=np.array([0.20,0.66,0.52]); tl=0.3*tg[0]+0.59*tg[1]+0.11*tg[2]
    teal=np.clip(L/tl*tg*0.86,0,255); sm=skin[...,None]; res=res*(1-sm)+teal*sm
    im=Image.fromarray(res.clip(0,255).astype(np.uint8)).convert('RGBA')
    p0,p1=(358,316),(508,524); Ln=math.hypot(p1[0]-p0[0],p1[1]-p0[1]); ang=math.degrees(math.atan2(p1[1]-p0[1],p1[0]-p0[0]))
    fnt=F('Playfair Display SC/PlayfairDisplaySC-Bold.ttf',25); W_=int(Ln); T=Image.new('RGBA',(W_,44),(0,0,0,0)); d=ImageDraw.Draw(T); txt='MISS JENSEITS'; bb=d.textbbox((0,0),txt,font=fnt)
    d.text(((W_-(bb[2]-bb[0]))/2-bb[0],(44-(bb[3]-bb[1]))/2-bb[1]),txt,font=fnt,fill=(120,26,36,235))
    R=T.rotate(-ang,expand=True,resample=Image.BICUBIC); cx,cy=(p0[0]+p1[0])/2,(p0[1]+p1[1])/2
    im.alpha_composite(R,(int(cx-R.width/2),int(cy-R.height/2))); return im.convert('RGB')
# 3) Figuren-Texturen (Konzeptbilder 864x1152 -> 768x1024)
for n in ['oma','gruen','brand','jaeger','taucher','assi','frl','decke']:
    im=Image.open(HERE+'/fig/in/%s.jpg'%n).convert('RGB')
    if n=='frl': im=frl_look(im)
    im=im.resize((768,1024),Image.LANCZOS)
    if n=='assi':   # Totenblässe: Hauttöne (r>g>b, wenig gesättigt) Richtung bläuliches Porzellan ziehen, Paillettenrot bleibt
        a=np.asarray(im).astype(float)/255; r,g,b_=a[...,0],a[...,1],a[...,2]
        m=np.clip((g/(r+1e-3)-0.55)*5,0,1)*np.clip((r-b_)*8,0,1)*np.clip((r-0.35)*4,0,1)*(r>=g)
        m=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(float)/255
        L=a.mean(2,keepdims=True); pale=np.clip(L*np.array([0.93,0.97,1.04])+0.06,0,1)
        a=a*(1-0.75*m[...,None])+pale*0.75*m[...,None]; im=Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8))
    im.save(SRC+'/fig_%s.png'%n)
print('beetle ok')
