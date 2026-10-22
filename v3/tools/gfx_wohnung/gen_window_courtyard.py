# Schlafzimmer-Fensterblick als echter kleiner Hinterhof (Ebenen-Geometrie statt Tiefenbild):
#   Rückgebäude (Remise): EG aus Grok-C2 (sz_c2_clean, per Kamera-Modell auf die Fassadenebene projiziert) + OG/Dach/Antennen aus Perchance B_01 (Real-ESRGAN x4)
#   Himmel: aus B_01 (Dach herausgerechnet, nach oben verlängert) auf ferner Wand + Decke
#   Hofboden: C2 per Kamera auf die Bodenebene entzerrt + gebackene Nass-Spiegelung der Fassade (Fensterlicht)
#   Seitenflügel links/rechts: Fensterachsen aus Perchance C (je Feld ein anderes Foto/gespiegelt), dunkel
#   Tonnen: Perchance A_03/A_06 (BiRefNet freigestellt) als stehende Karten
# Alle Ebenen bekommen denselben Grade (Korn kommt im Shader, Bildschirm-Raum). Ausgabe: assets/apartment/bedroom/hof/ (Atlas 2048², Himmel 1024²) + hof.json
# python3 gen_window_courtyard.py   (Quellen: /workspace/rewind_gfx/wohnung/perchance_hof|perchance_up|fenster2, src/sz_c2_clean.png)
import numpy as np, cv2, json, os, math
from PIL import Image
V3=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..')); OUT=V3+'/assets/apartment/bedroom/hof/'; os.makedirs(OUT,exist_ok=True)
RW='/workspace/rewind_gfx/wohnung/'; HS=os.path.dirname(os.path.abspath(__file__))+'/hof_src/'; PH=HS; PU=HS; CUT=HS; DBG=RW+'fenster2/'; os.makedirs(DBG,exist_ok=True)   # hof_src: Perchance-Originale, B_01 x4 (Real-ESRGAN), BiRefNet-Ausschnitte
rng=np.random.default_rng(1989)
ld=lambda p: np.asarray(Image.open(p).convert('RGB')).astype(np.float32)/255
# ---------- Welt (Zimmer-Koordinaten, Boden Zimmer y=0, Fensterglas z=-2.12, Fenstermitte x=0.45) ----------
Y0=-3.6; ZW=-2.25; ZB=-11.5; XL=-4.2; XR=6.8; YB1=-0.75; YTOP=YB1+11.0; YSIDE=13.0; EGS=0.8   # B_01 unten bei YB1, C2-EG vertikal auf 80 % (Hoflampe ~-0.8)
# C2-Kamera (so lag das alte Tiefenbild): Augpunkt, Neigung, Öffnungswinkel
O=np.array([0.45,1.6,-2.6]); PITCH=-0.5; TX=math.tan(math.radians(44))
C2=ld(V3+'/assets/apartment/bedroom/src/sz_c2_clean.png'); CH,CW=C2.shape[:2]; TY=TX*CH/CW
def proj(P):  # Weltpunkte (...,3) -> Pixel (x,y) in C2, gültig-Maske
    d=P-O; a=-PITCH; c,s=math.cos(a),math.sin(a)
    y=d[...,1]*c-d[...,2]*s; z=d[...,1]*s+d[...,2]*c; x=d[...,0]
    u=0.5+(x/-z)/(2*TX); v=0.5+(y/-z)/(2*TY); ok=(z<-0.1)&(u>=0)&(u<=1)&(v>=0)&(v<=1)
    return np.dstack([u*(CW-1),(1-v)*(CH-1)]).astype(np.float32), ok
def remap(img,pix): return cv2.remap(img,pix[...,0],pix[...,1],cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
def lab(x): return cv2.cvtColor(np.clip(x,0,1).astype(np.float32),cv2.COLOR_RGB2LAB)
def rgb(l): return np.clip(cv2.cvtColor(l.astype(np.float32),cv2.COLOR_LAB2RGB),0,1)
def match(src,ref,ms=None,mr=None,k=1.0):  # Farbtransfer (Lab mean/std)
    a,b=lab(src),lab(ref); sa=a[ms] if ms is not None else a.reshape(-1,3); sb=b[mr] if mr is not None else b.reshape(-1,3)
    sc=np.array([1.0,0.0,0.0]); sc[0]=np.clip(sb.std(0)[0]/(sa.std(0)[0]+1e-4),0.6,1.4)
    o=a.copy(); o[...,0]=(a[...,0]-sa.mean(0)[0])*sc[0]+sb.mean(0)[0]; o[...,1:]=a[...,1:]*0.8+(sb.mean(0)[1:]-sa.mean(0)[1:]*0.8)   # L: mean/std, Farbe: Mittelwert schieben, Sättigung leicht runter
    return rgb(a*(1-k)+o*k)
# ---------- 1) Rückfassade 11 x 14.6 m, 1024 x 1360 ----------
FW,FH=1024,1360; ppm=FW/(XR-XL)
xs=XL+(np.arange(FW)+0.5)/ppm; ys=YTOP-(np.arange(FH)+0.5)/ppm; X,Y=np.meshgrid(xs,ys)
pix,ok=proj(np.dstack([X,Y0+(Y-Y0)/EGS,np.full_like(X,ZB)])); eg=remap(C2,pix)
B1=ld(PU+'B_01_x4.jpg'); B1=cv2.resize(B1,(FW,FW),interpolation=cv2.INTER_AREA)   # 11 m breit, unten bei y=0
FH=int(round((YTOP-Y0)*ppm)); ys=YTOP-(np.arange(FH)+0.5)/ppm; X,Y=np.meshgrid(xs,ys)
pix,ok=proj(np.dstack([X,Y0+(Y-Y0)/EGS,np.full_like(X,ZB)])); eg=remap(C2,pix)
up=np.zeros((FH,FW,3),np.float32); yB=int(round((YTOP-YB1)*ppm)); up[yB-FW:yB]=B1
# Himmel-Maske in B_01: hell + glatt oben; Antennen/Kamine bleiben (dunkler als der Himmel)
L=B1.mean(2); sk=cv2.GaussianBlur(cv2.resize(cv2.resize(L,(64,64),interpolation=cv2.INTER_AREA),(FW,FW),interpolation=cv2.INTER_CUBIC),(0,0),8)
g=cv2.Laplacian(cv2.GaussianBlur(L,(0,0),1.2),cv2.CV_32F); tex=cv2.GaussianBlur(np.abs(g),(0,0),6)
roof=np.zeros((FW,FW),np.uint8)
# Dachkante pro Spalte: von oben die erste Zeile, ab der es deutlich dunkler/strukturierter als der Himmel wird
Lsm=cv2.GaussianBlur(L,(0,0),2); skyref=np.median(L[:60],0)
for x in range(FW):
    col=Lsm[:,x]; t=np.where((col<skyref[x]*0.72)|(tex[:,x]>0.02))[0]; t=t[t>20]; r=t[0] if len(t) else FW
    roof[r:,x]=1
roof=cv2.morphologyEx(roof,cv2.MORPH_OPEN,np.ones((1,9),np.uint8))
# dünne Antennen: lokal dunkler als der geglättete Himmel
sky_bg=cv2.inpaint((np.clip(B1,0,1)*255).astype(np.uint8),cv2.dilate(roof,np.ones((25,25),np.uint8)),15,cv2.INPAINT_TELEA).astype(np.float32)/255
ant=np.clip((sky_bg.mean(2)-L-0.03)*14,0,1); ant[roof>0]=1
aB=cv2.GaussianBlur(np.maximum(ant,roof.astype(np.float32)),(0,0),0.8)
alpha=np.zeros((FH,FW),np.float32); alpha[yB-FW:yB]=aB; alpha[yB:]=1
# Übergang B_01 -> C2-Erdgeschoss: B_01 unten (dunkle Wand/Busch) blendet in C2 über der Hoflampe; C2 farblich an B_01-Wand angeglichen
wallB=B1[700:900,80:700]; egm=match(eg,wallB,k=0.85)
t=np.clip((Y-(YB1+0.05))/0.4,0,1)[...,None]; t=t*t*(3-2*t)
fac=up*t+egm*(1-t)
fac*=(0.6+0.4*np.clip((Y-Y0)/1.0,0,1)**0.6)[...,None]
Image.fromarray((np.clip(fac,0,1)*255).astype(np.uint8)).save(DBG+'fac_raw.jpg',quality=90)
# ---------- 2) Himmel 1024²: B_01-Himmel ohne Dach, nach oben dunkler verlängert ----------
S=cv2.resize(sky_bg,(1024,1024),interpolation=cv2.INTER_AREA)
top=S[:300]; ext=np.concatenate([cv2.flip(top,0)[:260]*np.linspace(0.55,0.95,260)[:,None,None],S[:764]],0)
sky=cv2.GaussianBlur(ext,(0,0),3)
# ---------- 3) Hofboden 11 x 9.25 m, 1024 x 862: C2 entzerrt; vorne (unter dem eigenen Haus) im Schatten verlängert ----------
GW=1024; GH=int(GW*(ZW-ZB)/(XR-XL)); gx=XL+(np.arange(GW)+0.5)/ppm; gz=ZB+(np.arange(GH)+0.5)/ppm   # Zeile 0 = hinten (Fassade)
GX,GZ=np.meshgrid(gx,gz); pixg,okg=proj(np.dstack([GX,np.full_like(GX,Y0),GZ])); fl=remap(C2,pixg)
# Bereich ohne C2-Abdeckung (nah am eigenen Haus): gespiegelte Fortsetzung, abgedunkelt
lastrow=int(np.where(okg.mean(1)>0.98)[0].max())-4; pat=fl[lastrow-120:lastrow,30:330]; pat=np.minimum(pat,np.median(pat,(0,1))*1.35)   # Glanzpunkte nicht mitkacheln
rows=[]; i=0
while sum(r.shape[0] for r in rows)<GH-lastrow: rows.append(np.tile(np.concatenate([pat,pat[:,::-1]],1),(1,3,1))[:,(i*173)%300:][:, :GW]); i+=1
nearp=np.concatenate([r[:, :GW] if r.shape[1]>=GW else np.pad(r,((0,0),(0,GW-r.shape[1]),(0,0)),mode='reflect') for r in rows],0)[:GH-lastrow]
fb=np.linspace(0,1,40)[:,None,None]; seam=fl[lastrow:lastrow+40]*(1-fb)+nearp[:40]*fb
fl[lastrow:]=nearp; fl[lastrow:lastrow+40]=seam
sh=np.clip((GZ-(-5.0))/2.6,0,1)[...,None]; fl*=1-0.55*sh
flm=match(fl,wallB,k=0.5)
# Nass-Spiegelung: Fassade (gespiegelt am Boden) aus Sicht Fensterplatz, vertikal verwischt, nur wo Pfützen/Nässe
E=np.array([0.45,1.6,-1.5]); Em=E.copy(); Em[1]=2*Y0-E[1]
P=np.dstack([GX,np.full_like(GX,Y0),GZ]); dirv=P-Em; tt=(ZB-Em[2])/dirv[...,2]; H=Em+dirv*tt[...,None]
fu=((H[...,0]-XL)*ppm).astype(np.float32); fv=((YTOP-H[...,1])*ppm).astype(np.float32)
facb=cv2.GaussianBlur(fac,(0,0),sigmaX=3,sigmaY=14)
refl=cv2.remap(facb,fu,fv,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=0)
ra=cv2.remap(alpha,fu,fv,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=0)[...,None]
hv=np.clip((H[...,1]-(YB1+0.6))/0.6,0,1)[...,None]; refl=(refl*ra+cv2.resize(sky,(GW,GH)).mean((0,1))*(1-ra))*hv
wet=np.clip((cv2.GaussianBlur(rng.random((GH//8,GW//8)).astype(np.float32),(0,0),2)*1.0),0,1); wet=cv2.resize(wet,(GW,GH),interpolation=cv2.INTER_CUBIC)
wet=np.clip((wet-0.42)*3.5,0,1)*0.55+0.25
cosang=np.abs(dirv[...,1])/np.linalg.norm(dirv,axis=2); fres=(0.04+0.96*(1-cosang)**5)[...,None]
floor=flm+refl*wet[...,None]*fres*1.6
# Kontaktschatten: Boden an den Wänden (AO) + unter den Tonnen
dW=np.minimum.reduce([GX-XL,XR-GX,GZ-ZB]); floor*=(0.55+0.45*np.clip(dW/0.9,0,1)**0.7)[...,None]
for n_,ox_,oz_ in [('A03_bins',3.7,-10.95),('A06_binR',-3.4,-10.85),('A06_bin',6.05,-10.1)]:
    r2=((GX-ox_)/0.75)**2+((GZ-oz_)/0.5)**2; floor*=(1-0.6*np.exp(-r2*2.2))[...,None]
# ---------- 4) Seitenflügel: Felder 3.08 x 3.4 m aus Perchance C ----------
BAY=(ZW-ZB)/3; FLO=3.4
def bay(name,box=None,flip=False,k=1.0):
    im=ld(PH+name+'.jpg')
    if box: im=im[box[1]:box[3],box[0]:box[2]]
    if flip: im=im[:,::-1]
    im=match(im,ld(PH+'C_10.jpg')[200:600,60:300],None,None,0.9)
    return im*k
def wall(spec,W=496):  # spec: Liste Etagen (unten->oben) mit 3 Feldern
    ppmw=W/(ZW-ZB); Hh=int((YSIDE-Y0)*ppmw); out=np.zeros((Hh,W,3),np.float32); bw=W//3
    for fi,row in enumerate(spec):
        y1=Hh-int(fi*FLO*ppmw); y0=max(0,Hh-int((fi+1)*FLO*ppmw))
        for bi,b in enumerate(row):
            out[y0:y1,bi*bw:(bi+1)*bw if bi<2 else W]=cv2.resize(b,((bi+1)*bw-bi*bw if bi<2 else W-bi*bw,y1-y0),interpolation=cv2.INTER_AREA)
    # Fugen weich, oben Traufe dunkel
    out=cv2.GaussianBlur(out,(3,3),0); yy=np.arange(Hh)[:,None,None]/Hh; out*=np.clip(0.55+yy*0.9,0,1)
    hb=(1-yy)*(YSIDE-Y0); out*=0.6+0.4*np.clip(hb/1.0,0,1)**0.6
    return out
GF=[(0,0,768,768)]; cropU=(60,0,708,720)
left=wall([[bay('C_05',(0,60,768,768)),bay('C_12',(380,40,768,700)),bay('C_05',(0,60,768,768),True)],
           [bay('C_01',cropU),bay('C_10',cropU,False,0.9),bay('C_08',cropU,True)],
           [bay('C_08',cropU),bay('C_02',cropU,True,0.85),bay('C_01',cropU,True)],
           [bay('C_10',cropU,True),bay('C_06',cropU),bay('C_02',cropU)],
           [bay('C_04',cropU),bay('C_09',cropU,True),bay('C_03',cropU)]])
right=wall([[bay('C_12',(0,40,560,700)),bay('C_05',(0,60,768,768)),bay('C_12',(0,40,560,700),True)],
            [bay('C_02',cropU,True),bay('C_09',cropU),bay('C_06',cropU,True)],
            [bay('C_03',cropU,True),bay('C_01',cropU),bay('C_04',cropU,True)],
            [bay('C_09',cropU,True),bay('C_08',cropU),bay('C_10',cropU)],
            [bay('C_06',cropU,True),bay('C_03',cropU),bay('C_02',cropU,True)]])
left=match(left,wallB,k=0.8); right=match(right,wallB,k=0.8)
# Seitenwände liegen im Schatten des Hofs, rechte bekommt etwas Lampenlicht vom Rückgebäude
left*=0.5; right*=0.56
def grime(w):
    n=cv2.resize(rng.random((w.shape[0]//24,w.shape[1]//24)).astype(np.float32),(w.shape[1],w.shape[0]),interpolation=cv2.INTER_CUBIC)
    return w*(0.8+0.3*n[...,None])
left=grime(left); right=grime(right)
# ---------- 5) Tonnen ----------
objs=[]
for n,h in [('A03_bins',1.15),('A06_binR',1.05),('A06_bin',1.0)]:
    im=np.asarray(Image.open(CUT+n+'.png').convert('RGBA')).astype(np.float32)/255
    ys_,xs_=np.where(im[...,3]>0.1); im=im[ys_.min():ys_.max()+1,xs_.min():xs_.max()+1]
    im[...,:3]=match(im[...,:3],wallB,im[...,3]>0.5,None,0.5)*0.7; objs.append((n,im,h))
# ---------- Grade (für alle gleich): etwas heller als bisher, Schatten kühl, Fensterlicht warm bleibt ----------
def grade(x,e=1.0):
    x=np.clip(x*e,0,1)**0.9
    l=x.mean(2,keepdims=True); x=x+(np.array([0.010,0.018,0.030])*(1-l)**2)   # kühle Tiefen (blaue Stunde), nicht schwarz
    return np.clip(x,0,1)
fac=grade(fac,1.08); sky=grade(sky,0.92); floor=grade(floor,1.0); left=grade(left); right=grade(right)
objs=[(n,np.dstack([grade(im[...,:3],0.95),im[...,3:]]),h) for n,im,h in objs]
# ---------- Atlas 2048² ----------
A=np.zeros((2048,2048,4),np.float32); R={}
def put(name,img,x,y,a=None):
    h,w=img.shape[:2]; pad=np.pad(img,((6,6),(6,6),(0,0)),mode='edge'); y0_,x0_=max(0,y-6),max(0,x-6); A[y0_:y+h+6,x0_:x+w+6,:3]=pad[y0_-(y-6):,x0_-(x-6):][:min(2048,y+h+6)-y0_,:min(2048,x+w+6)-x0_]
    if a is None: A[y0_:y+h+6,x0_:x+w+6,3]=1
    A[y:y+h,x:x+w,:3]=img; A[y:y+h,x:x+w,3]=1 if a is None else a; R[name]=[x/2048,y/2048,w/2048,h/2048]   # u0,v0(oben),w,h
put('back',fac,0,0,alpha); put('floor',floor,1024,0)
put('left',left,1024,GH+16); put("right",right,1536,GH+16)
ox=8
for n,im,h in objs:
    s=min(1.0,300/im.shape[0]); im2=cv2.resize(im,(int(im.shape[1]*s),int(im.shape[0]*s)),interpolation=cv2.INTER_AREA)
    rgb8=(np.clip(im2[...,:3],0,1)*255).astype(np.uint8); hole=(im2[...,3]<0.6).astype(np.uint8)
    im2[...,:3]=cv2.inpaint(rgb8,hole,5,cv2.INPAINT_TELEA).astype(np.float32)/255*(1-0.0)   # Farbe unter transparenten Pixeln auffüllen (kein dunkler Saum)
    im2[...,:3]=np.where(hole[...,None]>0,im2[...,:3],np.clip(im2[...,:3],0,1))
    put(n,im2[...,:3],ox,FH+24,im2[...,3]); R[n].append(h); R[n].append(im2.shape[1]/im2.shape[0]); ox+=im2.shape[1]+16
At=(np.clip(A,0,1)*255).astype(np.uint8)
Image.fromarray(At,'RGBA').save(OUT+'sz_hof_atlas.png',optimize=True)
Image.fromarray((np.clip(sky,0,1)*255).astype(np.uint8)).save(OUT+'sz_hof_himmel.jpg',quality=90)
meta={'YB1':YB1,'Y0':Y0,'ZW':ZW,'ZB':ZB,'XL':XL,'XR':XR,'YTOP':YTOP,'YSIDE':YSIDE,'rects':R,'lamp':[2.05,Y0+(-0.15-Y0)*EGS,ZB+0.05],
      'objs':[['A03_bins',3.7,-10.95],['A06_binR',-3.4,-10.85],['A06_bin',6.05,-10.1]]}
json.dump(meta,open(OUT+'hof.json','w'),indent=1)
Image.fromarray(At[...,:3]).resize((1024,1024)).save(DBG+'atlas_prev.jpg',quality=88); print('ok',R)
