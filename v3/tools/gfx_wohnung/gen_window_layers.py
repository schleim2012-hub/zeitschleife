# Fensterblick Schlafzimmer in Parallax-Ebenen zerlegen (Foto C2 Hinterhof + Depth Anything V2 Tiefenkarte):
#  Ebene A (Hof/Fassaden): Vordergrund-Objekte entfernt (Inpainting tief + Klon-Detail), Tiefe aufgefüllt, Bild oben/unten per Klonen + planarer Tiefe erweitert
#  Ebene B (nah): Fahrräder, Mülltonnen, Wäscheleine als RGBA-Ausschnitt mit eigener Tiefe
# python3 gen_window_layers.py  → sky/backdrop/sz_hof_*.{jpg,png,json}; Prüfbilder nach /workspace/rewind_gfx/wohnung/fenster
import numpy as np, cv2, json, math, os
from PIL import Image
V3=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..')); OUT=V3+'/sky/backdrop/'; DBG='/workspace/rewind_gfx/wohnung/fenster/'
img=np.asarray(Image.open(V3+'/assets/apartment/bedroom/src/sz_hinterhof_orig.jpg').convert('RGB')).astype(np.float32)
H,W=img.shape[:2]
dep=np.asarray(Image.open(V3+'/sky/backdrop/sz_hinterhof_depth.png').convert('L')).astype(np.float32)/255
D=cv2.resize(dep,(W,H),interpolation=cv2.INTER_CUBIC)
# --- Maske Vordergrund: Tiefe deutlich näher als die geöffnete (Objekt-freie) Tiefe ---
d5=cv2.resize(dep,(512,round(512*H/W)))
PADB=60; dp=cv2.copyMakeBorder(d5,0,PADB,0,0,cv2.BORDER_REPLICATE); bg=cv2.morphologyEx(dp,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(71,71)))[:d5.shape[0]]
bg=cv2.GaussianBlur(bg,(0,0),6)
res=d5-bg; h5,w5=d5.shape; yy,xx=np.mgrid[0:h5,0:w5]
m=(res>0.05)&(xx>w5*0.2)&(xx<w5*0.93)&(yy>h5*0.12)
m=cv2.morphologyEx(m.astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
n,lab,st,_=cv2.connectedComponentsWithStats(m); keep=np.zeros_like(m)
for i in range(1,n):
    if st[i,cv2.CC_STAT_AREA]>60: keep[lab==i]=1
# senkrechte Objekte (Tonnen) nach unten bis zum Boden nachwachsen lassen: gleiche Tiefe wie darüber und noch vor dem Hintergrund
allow=np.zeros_like(keep)
n2,lab2,st2,_=cv2.connectedComponentsWithStats(keep)
for i in range(1,n2):
    bx,by,bw_,bh_=st2[i,0],st2[i,1],st2[i,2],st2[i,3]
    if by+bh_<h5*0.7 and by>h5*0.35: allow[by:min(h5,by+bh_+int(h5*0.25)),bx:bx+bw_]=1   # nur Objekte, die mitten im Hof stehen (Tonnen an der Wand)
for _ in range(int(h5*0.3)):
    up_=np.zeros_like(keep); up_[1:]=keep[:-1]; dprev=np.zeros_like(d5); dprev[1:]=d5[:-1]
    cand=(up_>0)&(keep==0)&(np.abs(d5-dprev)<0.012)&(res>0.012)&(allow>0)
    if not cand.any(): break
    keep[cand]=1
keep=cv2.morphologyEx(keep,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
M=cv2.resize(keep.astype(np.float32),(W,H),interpolation=cv2.INTER_LINEAR)
Mh=(cv2.dilate((M>0.3).astype(np.uint8),np.ones((15,15),np.uint8))>0)
low_part=Mh.copy(); low_part[:int(H*0.6)]=False
for k in range(1,70,6): Mh[k:]|=low_part[:-k]                                   # Fuß der Tonnen/Räder bis zum Boden mitnehmen
Mh[:int(H*0.6)]|=False   # Loch für die Hintergrundebene (großzügig)
Image.fromarray((Mh*255).astype(np.uint8)).save(DBG+'mask.png')
# --- Ebene A: Loch füllen: tiefe Frequenzen per Inpainting, Struktur per Klon aus der Nachbarschaft ---
u8=np.clip(img,0,255).astype(np.uint8); low=cv2.inpaint(cv2.resize(u8,(W//4,H//4)),cv2.resize(Mh.astype(np.uint8),(W//4,H//4),interpolation=cv2.INTER_NEAREST),5,cv2.INPAINT_TELEA)
low=cv2.resize(low,(W,H),interpolation=cv2.INTER_CUBIC).astype(np.float32); low=cv2.GaussianBlur(low,(0,0),5)
fill=np.zeros_like(img); got=np.zeros((H,W),bool)
for dx,dy in [(-330,0),(330,0),(-560,0),(560,0),(0,90),(-200,60),(200,60),(-800,0),(800,0)]:
    sh=np.roll(np.roll(img,dy,0),dx,1); shm=np.roll(np.roll(Mh,dy,0),dx,1)
    ok=(~shm)&(~got)&Mh
    if dx>0: ok[:, :dx]=False
    elif dx<0: ok[:, dx:]=False
    hf=sh-cv2.GaussianBlur(sh,(0,0),5); fill[ok]=hf[ok]; got|=ok
A=img.copy(); fm=cv2.GaussianBlur(Mh.astype(np.float32),(0,0),3)[...,None]
A=A*(1-fm)+(low+fill)*fm
DA=cv2.inpaint((D*255).astype(np.uint8),Mh.astype(np.uint8),9,cv2.INPAINT_TELEA).astype(np.float32)/255
DA=cv2.GaussianBlur(DA,(0,0),2)*(Mh)+D*(~Mh)
# --- Ebene B: Objekte RGBA (Bounding-Box), weiche Kante ---
al=cv2.GaussianBlur(np.clip(M*1.6,0,1),(0,0),1.6); ys,xs=np.where(al>0.02); x0,x1,y0,y1=max(0,xs.min()-8),min(W,xs.max()+8),max(0,ys.min()-8),min(H,ys.max()+8)
B=np.dstack([img,al[...,None]*255])[y0:y1,x0:x1]; CR=(x0,x1,y0,y1)   # Ausschnitt merken (y0 wird unten wiederverwendet)
# --- Erweiterung oben/unten: Klon der Fassaden-/Pflaster-Bänder, Tiefe planar (oben: senkrechte Wand, unten: Boden) ---
HF=88*math.pi/180; tx=math.tan(HF/2); asp=W/H; ty=tx/asp; PITCH=-0.5; NEAR,FAR=6.0,28.0; b=1/FAR; a=1/NEAR-b
K=int(H*0.55)                                   # Zeilen je Seite
def rays(rows,Htot):
    # Weltrichtung je (row,col) für die erweiterte Leinwand (Mitte bleibt die Bildmitte)
    v=(rows+0.5)/Htot; u=(np.arange(W)+0.5)/W
    X=(u[None,:]-0.5)*2*tx; Y=(0.5-v[:,None])*2*ty*(Htot/H); Z=-np.ones_like(X*Y)
    L=np.sqrt(X**2+Y**2+Z**2); X,Y,Z=X/L,Y/L,Z/L; c,s=math.cos(PITCH),math.sin(PITCH)
    return X, Y*c-Z*s, Y*s+Z*c
Ht=H+2*K
def r_of(n): return 1/(a*n+b)
def n_of(r): return np.clip((1/r-b)/a,0,1)
# obere Kante: horizontale Distanz je Spalte aus Zeile 6 (Wand senkrecht)
Xt,Yt,Zt=rays(np.array([K+6.0]),Ht); rt=r_of(DA[6]); hor=rt*np.sqrt(Xt[0]**2+Zt[0]**2)
Xu,Yu,Zu=rays(np.arange(K).astype(float),Ht); DU=n_of(hor[None,:]/np.sqrt(Xu**2+Zu**2))
# untere Kante: Bodenhöhe je Spalte aus Zeile H-6
Xb,Yb,Zb=rays(np.array([K+H-6.0]),Ht); rb=r_of(DA[H-6]); yfl=rb*Yb[0]
Xl,Yl,Zl=rays(np.arange(K+H,Ht).astype(float),Ht); DL=n_of(np.maximum(yfl[None,:]/np.minimum(Yl,-1e-3),0.5))
def clone_band(src,top,k,period):
    # Band der Höhe period periodisch wiederholen, Nahtstellen weich
    out=np.zeros((k,)+src.shape[1:],np.float32)
    band=src[:period] if top else src[-period:]
    for i in range(k):
        j=(period-1-(i%period)) if top else (i%period)
        out[(k-1-i) if top else i]=band[j]
    return out
PER=int(H*0.245)
Al=img[:PER+24].astype(np.float32).copy()

_lum=img[:PER+24].mean(2); _lm=np.zeros(_lum.shape,np.uint8); xa,xb=int(W*0.5),int(W*0.68)
_reg=_lum[:,xa:xb]; _lm[:,xa:xb]=(_reg>np.percentile(_reg,99.3)).astype(np.uint8)
_lm=cv2.dilate(_lm,np.ones((45,45),np.uint8)); _lm[:,:xa]=0; _lm[:,xb:]=0
Al=cv2.inpaint(np.clip(Al,0,255).astype(np.uint8),_lm,21,cv2.INPAINT_TELEA).astype(np.float32)
for _ in range(2):
    Lb=cv2.GaussianBlur(Al.mean(2),(0,0),18); med=np.median(Lb,1,keepdims=True); Al*=np.clip(med/np.maximum(Lb,1e-3),0.2,1.0)[...,None]   # Lichtflecken aus dem Etagen-Klon
band=Al[:PER+24]; ov=24; up=np.zeros((K+PER+24,W,3),np.float32); wsum=np.zeros((K+PER+24,1,1),np.float32); y=K+PER+24
w=np.ones((PER+24,1,1),np.float32); w[:ov,0,0]=np.linspace(0,1,ov); w[-ov:,0,0]=np.linspace(1,0,ov)
while y>0:
    y0=y-(PER+24); a0=max(0,y0); up[a0:y]+=(band*w)[a0-y0:]; wsum[a0:y]+=w[a0-y0:]; y=y0+ov
up=(up/np.maximum(wsum,1e-3))[:K]
bh=int(H*0.16); pt=A[int(H*0.78):int(H*0.78)+bh,int(W*0.70):int(W*0.90)]; tiles=[]; j=0
while sum(t.shape[1] for t in tiles)<W: tiles.append(pt[:,::-1] if j%2 else pt); j+=1
band=np.concatenate(tiles,1)[:,:W]; reps=[]; i=0
while sum(r.shape[0] for r in reps)<K: reps.append(band[::-1] if i%2==0 else band); i+=1
dn=cv2.GaussianBlur(np.concatenate(reps,0)[:K].copy(),(0,0),7)
# Wiederholung kaschieren: leicht abdunkeln/variieren mit Abstand
gu=np.linspace(0.6,0.98,K)[:,None,None]; up*=gu; dn*=np.linspace(0.9,0.3,K)[:,None,None]
EXT=np.concatenate([up,A,dn],0); DEXT=np.concatenate([DU,DA,DL],0)
# Nahtstellen glätten
for yS,R in ((K,36),(K+H,60)):
    sl=slice(yS-R,yS+R); blk=EXT[sl].copy(); vb=cv2.GaussianBlur(blk,(1,0),sigmaX=0.1,sigmaY=R/2.5)
    w=(1-np.abs(np.arange(2*R)-R)/R)[:,None,None]; EXT[sl]=blk*(1-w)+vb*w
    # Helligkeitssprung ausgleichen: Mittelwert beider Seiten angleichen
    a_=EXT[yS-R:yS].mean(); b_=EXT[yS:yS+R].mean(); g=np.linspace(1,a_/max(b_,1e-3),1)[0]
    ramp=np.ones((EXT.shape[0],1,1),np.float32); ramp[yS:yS+3*R,0,0]=np.linspace(g,1,3*R); EXT*=ramp
# Look: Schatten anheben (nicht schwarz), aber dunkler als der Raum; leicht kühl
def look(x): x=np.clip(x/255,0,1)**0.7*0.86+np.array([0.012,0.016,0.026]); return np.clip(x*255,0,255).astype(np.uint8)
E8=look(EXT); B8=np.dstack([look(B[...,:3]),B[...,3:].astype(np.uint8)])
# Größen: Basis max 2048 hoch
sc=min(1.0,2048/Ht,2048/W); EW,EH=int(W*sc)//4*4,int(Ht*sc)//4*4
Image.fromarray(E8).resize((EW,EH),Image.LANCZOS).save(OUT+'sz_hof_base.jpg',quality=88)
Image.fromarray((np.clip(DEXT,0,1)*255).astype(np.uint8)).resize((512,round(512*Ht/W)),Image.BILINEAR).save(OUT+'sz_hof_base_depth.png')
x0,x1,y0,y1=CR
bw,bh=x1-x0,y1-y0; s2=min(1.0,1024/max(bw,bh)); Image.fromarray(B8,'RGBA').resize((int(bw*s2),int(bh*s2)),Image.LANCZOS).save(OUT+'sz_hof_obj.png',optimize=True)
Dob=cv2.dilate(D[y0:y1,x0:x1].astype(np.float32),np.ones((13,13),np.uint8))   # Objekt-Tiefe über die Silhouette ziehen (keine gestreckten Kanten)
Image.fromarray((np.clip(Dob,0,1)*255).astype(np.uint8)).resize((max(8,int(bw/4)),max(8,int(bh/4))),Image.BILINEAR).save(OUT+'sz_hof_obj_depth.png')
_L=img.mean(2).copy(); _L[int(H*0.4):]=0; ly,lx=np.unravel_index(np.argmax(cv2.GaussianBlur(_L,(0,0),3)),_L.shape)
meta={'lamp_uv':[float(lx/W),float(1-(K+ly)/Ht)],'hfov':88,'pitch':PITCH,'near':NEAR,'far':FAR,'aspect_full':W/Ht,'ty_full':ty*Ht/H,'tx':tx,
      'obj_rect_uv':[x0/W,x1/W,1-(K+y1)/Ht,1-(K+y0)/Ht],'note':'uv: u links→rechts, v unten→oben, auf der erweiterten Leinwand'}
json.dump(meta,open(OUT+'sz_hof_layers.json','w'),indent=1)
Image.fromarray(E8).resize((EW//2,EH//2)).save(DBG+'base_prev.jpg'); Image.fromarray(look(A)).save(DBG+'A_prev.jpg')
Image.fromarray(np.clip(A,0,255).astype(np.uint8)).save(V3+'/assets/apartment/bedroom/src/sz_c2_clean.png')   # für gen_window_courtyard.py (ungegradet, Objekte entfernt)
print('ok',EW,EH,meta)
