# Küchen-Fensterblick (Nordwand, Blick +z): echter kleiner Hof aus Foto-Ebenen, gleiche Tageszeit/Höhe/Grade wie das Schlafzimmer, aber andere Fotos:
#   Rückgebäude + Himmel: Perchance B_04 (Real-ESRGAN x4), Himmel herausgerechnet; Bäume aus B_04 zusätzlich freigestellt als Mittelebene (Parallaxe, wiegt leicht)
#   Seitenflügel: Perchance C_07/C_11 (Fensterachsen, gespiegelt/variiert, dunkel); Gartenmauer: Putz aus C_07/C_11 (Sockelbereich); Hofboden: dunkel, kaum sichtbar
# Lokale Koordinaten: Fenstermitte x=0, Glas z=0, Blick −z, Zimmerboden y=0 (Hof y=−3,6 wie Schlafzimmer). Welt (Küche): x=−xl−9,75, z=−zl+2,605 (macht gfx_wohnung_kueche.js).
# python3 gen_window_courtyard_kueche.py → assets/apartment/kitchen/hof/ (Atlas 2048², Himmel 1024²) + hof.json
import numpy as np, cv2, json, os, math
from PIL import Image
V3=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..')); OUT=V3+'/assets/apartment/kitchen/hof/'; os.makedirs(OUT,exist_ok=True)
HS=os.path.dirname(os.path.abspath(__file__))+'/hof_src/'; DBG='/workspace/rewind_gfx/wohnung/kue/hof/'; os.makedirs(DBG,exist_ok=True)
rng=np.random.default_rng(1990)
ld=lambda p: np.asarray(Image.open(p).convert('RGB')).astype(np.float32)/255
def lab(x): return cv2.cvtColor(np.clip(x,0,1).astype(np.float32),cv2.COLOR_RGB2LAB)
def rgb(l): return np.clip(cv2.cvtColor(l.astype(np.float32),cv2.COLOR_LAB2RGB),0,1)
def match(src,ref,ms=None,k=1.0):
    a,b=lab(src),lab(ref); sa=a[ms] if ms is not None else a.reshape(-1,3); sb=b.reshape(-1,3)
    s0=np.clip(sb.std(0)[0]/(sa.std(0)[0]+1e-4),0.6,1.4); o=a.copy(); o[...,0]=(a[...,0]-sa.mean(0)[0])*s0+sb.mean(0)[0]; o[...,1:]=a[...,1:]*0.8+(sb.mean(0)[1:]-sa.mean(0)[1:]*0.8)
    return rgb(a*(1-k)+o*k)
# Referenz-Grade = Schlafzimmer-Rückgebäude (B_01-Wand), damit beide Fenster dieselbe Stunde zeigen
REF=ld(HS+'B_01_x4.jpg'); REF=cv2.resize(REF,(1024,1024),interpolation=cv2.INTER_AREA)[700:900,80:700]
# ---------- Welt ----------
Y0=-3.6; ZW=-0.3; ZB=-14.0; ZM=-10.0; XL=-5.0; XR=5.0; BW=12.8; BX0=-6.4; SILL=-0.4; YBOT=-3.0; YSIDE=6.6; WALLH=2.2; ZT=-7.0
PPM=100.0
# ---------- 1) Rückgebäude B_04 ----------
B=ld(HS+'B_04_x4.jpg'); N=int(BW*PPM); B=cv2.resize(B,(N,N),interpolation=cv2.INTER_AREA)
YTOP=SILL+(926/1024*N)/PPM
L=B.mean(2); Lsm=cv2.GaussianBlur(L,(0,0),2); g=cv2.Laplacian(cv2.GaussianBlur(L,(0,0),1.2),cv2.CV_32F); tex=cv2.GaussianBlur(np.abs(g),(0,0),5)
skyref=np.median(Lsm[:80],0); roof=np.zeros((N,N),np.uint8)
for x in range(N):
    col=Lsm[:,x]; t=np.where((col<skyref[x]*0.8)|(tex[:,x]>0.018))[0]; t=t[t>30]; r=t[0] if len(t) else N; roof[r:,x]=1
roof=cv2.morphologyEx(roof,cv2.MORPH_OPEN,np.ones((1,9),np.uint8)); roof=cv2.morphologyEx(roof,cv2.MORPH_CLOSE,np.ones((7,3),np.uint8))
sky_bg=cv2.inpaint((np.clip(B,0,1)*255).astype(np.uint8),cv2.dilate(roof,np.ones((31,31),np.uint8)),15,cv2.INPAINT_TELEA).astype(np.float32)/255
ant=np.clip((sky_bg.mean(2)-L-0.03)*14,0,1); ant[roof>0]=1; aB=cv2.GaussianBlur(np.maximum(ant,roof.astype(np.float32)),(0,0),0.8)
# unten verlängern bis YBOT (unterstes Band gestreckt; liegt hinter Mauer/Fensterbank)
ext=int(round((YTOP-BW-YBOT)*PPM)); band=B[N-40:N]; bandA=aB[N-40:N]
Bx=np.concatenate([B,cv2.resize(band,(N,ext),interpolation=cv2.INTER_LINEAR)],0); aBx=np.concatenate([aB,np.ones((ext,N),np.float32)],0)
Bx[N:]*=np.linspace(1.0,0.55,ext)[:,None,None]
fac=match(Bx,REF,aBx>0.5,0.55)
# Bäume (dunkles Grün, strukturiert) für die Mittelebene freistellen
hsv=cv2.cvtColor((np.clip(Bx,0,1)*255).astype(np.uint8),cv2.COLOR_RGB2HSV).astype(np.float32)
Hh,Ss,Vv=hsv[...,0],hsv[...,1],hsv[...,2]; xx=np.arange(N)[None,:]/N; yy=np.arange(Bx.shape[0])[:,None]/N
nz=(cv2.resize(rng.random((20,20)).astype(np.float32),(N,Bx.shape[0]),interpolation=cv2.INTER_CUBIC)-0.5)*2.4+(cv2.resize(rng.random((90,90)).astype(np.float32),(N,Bx.shape[0]),interpolation=cv2.INTER_CUBIC)-0.5)*1.2
ramp=np.clip(np.maximum((0.335-xx)/0.03,(xx-0.70)/0.03)+nz,0,1)                       # ausgefranster Übergang statt gerader Kante
strict=((Ss>92)&(Hh>58)&(Hh<102)&(Vv<145)&(yy>0.215)&(aBx>0.5)).astype(np.float32)
tree=cv2.morphologyEx(strict,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8)); tree=cv2.morphologyEx(tree,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
tree=tree*(ramp>0.5)
tree[N:]=0
nlab,lb,st,_=cv2.connectedComponentsWithStats((tree>0.5).astype(np.uint8)); keep=np.zeros_like(tree)
TREES=[]
for i in range(1,nlab):
    x,y,w,h,a=st[i]
    if a>N*N*0.03: keep[lb==i]=1; TREES.append((x,y,w,h))
tree=cv2.GaussianBlur(keep,(0,0),1.2)
Image.fromarray((tree*255).astype(np.uint8)).save(DBG+'tree_mask.png'); print('trees',TREES)
# ---------- 2) Himmel ----------
S=cv2.resize(sky_bg,(1024,1024),interpolation=cv2.INTER_AREA); top=S[:300]
sky=np.concatenate([cv2.flip(top,0)[:260]*np.linspace(0.55,0.95,260)[:,None,None],S[:764]],0); sky=cv2.GaussianBlur(sky,(0,0),3)
sky=match(sky,cv2.resize(ld(HS+'B_01_x4.jpg'),(1024,1024))[:200],None,0.6)
# ---------- 3) Seitenflügel aus C_07/C_11 ----------
C7=ld(HS+'C_07.jpg'); C11=ld(HS+'C_11.jpg')
BAYS=[C7[40:520,40:330],C7[40:520,300:600],C11[30:560,430:768],C11[30:560,60:420],C7[60:540,560:768]]
SP=40.0; FLO=3.4; NB=5; DZ=(ZW-ZB)
def wall(seq,flipset):
    W=int(DZ*SP); H=int((YSIDE-Y0)*SP); out=np.zeros((H,W,3),np.float32); bw=W/NB
    for fi in range(3):
        y1=H-int(fi*FLO*SP); y0=max(0,H-int((fi+1)*FLO*SP))
        for bi in range(NB):
            k=seq[(fi*NB+bi)%len(seq)]; im=BAYS[k]
            if (fi*NB+bi) in flipset: im=im[:,::-1]
            x0=int(bi*bw); x1=int((bi+1)*bw); t=cv2.resize(im,(x1-x0,y1-y0),interpolation=cv2.INTER_AREA)
            t=t*(0.8+0.35*rng.random()); out[y0:y1,x0:x1]=t
    out=cv2.GaussianBlur(out,(3,3),0); yy=np.arange(H)[:,None,None]/H; out*=np.clip(0.55+0.9*(1-yy)*0+yy*0.0+0.45,0,1)
    out[:int(0.25*SP)]*=0.35   # Traufe
    hb=(1-yy)*(YSIDE-Y0); out*=(0.55+0.45*np.clip(hb/1.2,0,1)**0.6)
    return out
left=wall([0,2,1,3,4,2,0,3,1,2,4,0,1,3,2],{1,4,6,9,12}); right=wall([3,1,4,0,2,1,3,0,2,4,1,3,0,2,1],{0,3,7,8,11,14})
left=match(left,REF,None,0.8)*0.5; right=match(right,REF,None,0.8)*0.58
def grime(w):
    n=cv2.resize(rng.random((max(2,w.shape[0]//18),max(2,w.shape[1]//18))).astype(np.float32),(w.shape[1],w.shape[0]),interpolation=cv2.INTER_CUBIC); return w*(0.8+0.3*n[...,None])
left=grime(left); right=grime(right)
# warme Fenster in den Seitenflügeln (einige Achsen beleuchtet, wie im Schlafzimmer-Hof)
# ---------- 4) Gartenmauer (Putz aus den Sockelzonen) + Hofboden ----------
MW_=int((XR-XL)*50); MH=int(WALLH*50); segs=[C7[560:740,0:768],C11[600:768,0:420],C7[560:740,0:768][:,::-1],C11[600:768,0:420][:,::-1]]
mw=np.concatenate([cv2.resize(s,(MW_//4+1,MH),interpolation=cv2.INTER_AREA) for s in segs],1)[:, :MW_]
mw[:6]*=0.5; mw=match(mw,REF,None,0.8)*0.62
FW_,FH_=200,int(DZ*20); fl=cv2.resize(C7[700:768,0:768],(FW_,FH_),interpolation=cv2.INTER_AREA)*0.35
# ---------- Grade (wie Schlafzimmer) ----------
def grade(x,e=1.0):
    x=np.clip(x*e,0,1)**0.9; l=x.mean(2,keepdims=True); x=x+(np.array([0.010,0.018,0.030])*(1-l)**2); return np.clip(x,0,1)
fac=grade(fac,1.05); sky=grade(sky,0.92); left=grade(left); right=grade(right); mw=grade(mw); fl=grade(fl)
# ---------- Atlas 2048² ----------
A=np.zeros((2048,2048,4),np.float32); R={}
def put(name,img,x,y,a=None):
    h,w=img.shape[:2]; pad=np.pad(img,((6,6),(6,6),(0,0)),mode='edge'); y0_,x0_=max(0,y-6),max(0,x-6)
    A[y0_:y+h+6,x0_:x+w+6,:3]=pad[y0_-(y-6):,x0_-(x-6):][:min(2048,y+h+6)-y0_,:min(2048,x+w+6)-x0_]
    if a is None: A[y0_:y+h+6,x0_:x+w+6,3]=1
    A[y:y+h,x:x+w,:3]=img; A[y:y+h,x:x+w,3]=1 if a is None else a; R[name]=[x/2048,y/2048,w/2048,h/2048]
# Farbe unter transparenten Pixeln auffüllen (kein dunkler Saum)
def fillrgb(img,a):
    rgb8=(np.clip(img,0,1)*255).astype(np.uint8); hole=(a<0.6).astype(np.uint8); return np.where(hole[...,None]>0,cv2.inpaint(rgb8,hole,5,cv2.INPAINT_TELEA).astype(np.float32)/255,img)
fac=fillrgb(fac,aBx); put('back',fac,0,0,aBx)
put('left',left,1296,0); put('right',right,1296,left.shape[0]+16); y=left.shape[0]+right.shape[0]+32
put('wall',mw,1296,y); put('floor',fl,1296+mw.shape[1]+16 if 1296+mw.shape[1]+16+FW_<=2048 else 1296,y+mw.shape[0]+16)
# Bäume: Ausschnitte aus fac mit Baum-Maske
TR=[]
oy=fac.shape[0]+16; ox=0
for i,(x,y_,w,h) in enumerate(TREES):
    s=min(1.0,(2048-oy-8)/h, 640/w); crop=fac[y_:y_+h,x:x+w]; ma=tree[y_:y_+h,x:x+w]
    c2=cv2.resize(crop,(int(w*s),int(h*s)),interpolation=cv2.INTER_AREA); m2=cv2.resize(ma,(int(w*s),int(h*s)),interpolation=cv2.INTER_AREA)
    c2=fillrgb(c2,m2)*0.92
    if ox+c2.shape[1]>1290: break
    put('tree%d'%i,c2,ox,oy,m2); TR.append(['tree%d'%i,BX0+x/PPM,BX0+(x+w)/PPM,YTOP-(y_+h)/PPM,YTOP-y_/PPM]); ox+=c2.shape[1]+16
At=(np.clip(A,0,1)*255).astype(np.uint8)
Image.fromarray(At,'RGBA').save(OUT+'kue_hof_atlas.png',optimize=True)
Image.fromarray((np.clip(sky,0,1)*255).astype(np.uint8)).save(OUT+'kue_hof_himmel.jpg',quality=90)
meta={'Y0':Y0,'ZW':ZW,'ZB':ZB,'ZM':ZM,'ZT':ZT,'XL':XL,'XR':XR,'BX0':BX0,'BW':BW,'YTOP':YTOP,'YBOT':YBOT,'YSIDE':YSIDE,'WALLH':WALLH,'rects':R,'trees':TR,'eye':[0,1.6,1.15]}
json.dump(meta,open(OUT+'hof.json','w'),indent=1)
Image.fromarray(At[...,:3]).resize((1024,1024)).save(DBG+'atlas_prev.jpg',quality=88); print('ok',R)
