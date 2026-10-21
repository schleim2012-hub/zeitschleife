"""Spielhalle 1984 – Wand-/Decken-Texturen (Rewind). Quelle Holz: ambientCG WoodSiding008 (CC0), Rest prozedural.
Wand-Atlas: u = 1,20 m Breite (kachelt horizontal), v = 0..3,20 m Höhe (kachelt NICHT):
  0-0,10 Gummi-Sockel schwarz | 0,10-2,30 Holzpaneel (vertikal, Nuten) | 2,30-2,38 Abschlussleiste | 2,38-3,20 Rauputz dunkel (Nikotin)
Decke: 2,40 x 2,40 m = 4x4 Mineralfaserplatten 60 cm mit T-Schienen, Flecken, eine dunkle (fehlende) Platte."""
import numpy as np, sys
from PIL import Image, ImageFilter
SRC=sys.argv[1]; OUT=sys.argv[2]
rng=np.random.default_rng(1984)
def blur(a,r): return np.asarray(Image.fromarray(np.uint8(np.clip(a,0,1)*255)).filter(ImageFilter.GaussianBlur(r)),np.float32)/255
def noise(h,w,s,seed):
    r=np.random.default_rng(seed); a=r.random((h//s+2,w//s+2)).astype(np.float32)
    return np.asarray(Image.fromarray(np.uint8(a*255)).resize((w+2*s,h+2*s),Image.BICUBIC),np.float32)[s:s+h,s:s+w]/255
def fbm(h,w,seed,oct=((64,.5),(16,.3),(4,.2))): return sum(noise(h,w,s,seed+i)*k for i,(s,k) in enumerate(oct))
W=H=1024; MH=3.2
y=(1-(np.arange(H)+0.5)/H)*MH          # Meter Höhe je Zeile (Zeile 0 = oben)
Y=np.repeat(y[:,None],W,1); X=np.repeat(((np.arange(W)+0.5)/W*1.2)[None,:],H,0)
wood=np.asarray(Image.open(SRC+'/WoodSiding008/WoodSiding008_1K-JPG_Color.jpg').convert('RGB').rotate(90),np.float32)/255
wn=np.asarray(Image.open(SRC+'/WoodSiding008/WoodSiding008_1K-JPG_NormalGL.jpg').convert('RGB').rotate(90),np.float32)/255
# Normal-Map nach Rotation korrigieren (x<-y)
wn2=wn.copy(); wn2[...,0]=1-wn[...,1]; wn2[...,1]=wn[...,0]
# Holz auf 2,2 m Höhe strecken (Holzbild 1024 hoch -> zweimal untereinander mit Versatz, damit Maserung lang wirkt)
woodS=np.asarray(Image.fromarray(np.uint8(wood*255)).resize((W,H)),np.float32)/255
wood_col=woodS**1.15*np.array([1.08,0.92,0.78])   # wärmer, rötlicher Furnier-Ton
# Nuten: 80er-Paneel, unregelmäßig (Brettbreiten 10-20 cm)
gro=[0.0,0.16,0.27,0.43,0.55,0.70,0.83,0.98,1.2]
g=np.ones((H,W),np.float32); gn=np.zeros((H,W),np.float32)
for gx in gro:
    d=(X-gx); g*=1-0.75*np.exp(-(d/0.0035)**2); gn+=np.sign(d)*np.exp(-(d/0.005)**2)*0.5
col=np.zeros((H,W,3),np.float32); nrm=np.zeros((H,W,3),np.float32)+[0.5,0.5,1]
pan=(Y>=0.10)&(Y<2.30)
dirt=fbm(H,W,7)
col[pan]=(wood_col*g[...,None])[pan]
nrm[pan]=wn2[pan]; nrm[...,0]=np.where(pan,np.clip(nrm[...,0]+gn*0.6,0,1),nrm[...,0])
# Schuhabrieb + Dreck unten am Paneel, nach oben Nikotin-Abdunkelung
foot=np.clip(1-(Y-0.10)/0.45,0,1)*pan
col*= (1-0.45*foot*(0.5+dirt))[...,None]
# Sockel: schwarzer Gummi, leicht glänzende Kante
base=Y<0.10; col[base]=(0.035+0.03*dirt[base])[:,None]*np.array([1,1,1.05]); col[(Y>0.088)&(Y<0.10)]*=1.8
nrm[(Y>0.088)&(Y<0.10)]=[0.5,0.85,0.7]
# Abschlussleiste (Kiefer dunkel gebeizt, mit Profil)
cap=(Y>=2.30)&(Y<2.38); t=(Y-2.30)/0.08
col[cap]=(np.array([0.32,0.19,0.10])*(0.75+0.35*np.sin(t*np.pi))[...,None]*(0.85+0.3*woodS[...,0:1]))[cap]
nrm[cap]=np.stack([np.full_like(t,0.5),0.5+0.35*np.cos(t*np.pi),np.full_like(t,0.85)],-1)[cap]
# Rauputz oben: dunkles Bordeaux-Braun, nikotin- und rauchdunkel zur Decke hin
pl=Y>=2.38; spk=noise(H,W,2,11)*0.6+noise(H,W,6,12)*0.4
pc=np.array([0.20,0.10,0.09])*(0.75+0.5*spk)[...,None]*(1-0.35*np.clip((Y-2.38)/0.8,0,1))[...,None]*(0.8+0.4*dirt[...,None])
col[pl]=pc[pl]
pn=np.stack([0.5+(noise(H,W,2,13)-0.5)*0.5,0.5+(noise(H,W,2,14)-0.5)*0.5,np.ones((H,W))],-1); nrm[pl]=pn[pl]
# Laufnasen/Wasserflecken vom Dach (vertikal, selten)
for i in range(3):
    cx=rng.uniform(0.1,1.1); L=rng.uniform(0.3,1.2)
    m=np.exp(-((X-cx)/0.02)**2)*np.clip(1-(3.2-Y)/L,0,1)*(Y>2.38)
    col*= (1-0.35*m)[...,None]
Image.fromarray(np.uint8(np.clip(col,0,1)**(1/1)*255)).save(OUT+'/wall_c.jpg',quality=90)
Image.fromarray(np.uint8(np.clip(nrm,0,1)*255)).resize((512,512),Image.LANCZOS).save(OUT+'/wall_n.jpg',quality=90)
# Roughness: Holz lackiert 0.45-0.6, Putz 0.95, Gummi 0.7
r=np.where(pan,0.5+0.15*dirt+0.25*foot,np.where(pl,0.95,np.where(cap,0.5,0.7)))
Image.fromarray(np.uint8(np.clip(r,0,1)*255)).resize((512,512)).save(OUT+'/wall_r.jpg',quality=90)

# ---- Decke: 4x4 Platten à 60 cm, 1024 px = 2,4 m ----
C=1024; tile=256; u=np.arange(C)%tile; v=np.arange(C)[:,None]%tile
fis=noise(C,C,1,21)*0.45+noise(C,C,3,22)*0.2+noise(C,C,24,23)*0.35
holes=(noise(C,C,1,24)>0.78).astype(np.float32)*0.25   # Lochung/Wurmlöcher
base=0.60+0.14*fis-holes*0.6
ceil=np.stack([base*1.0,base*0.96,base*0.86],-1)   # nikotingelb vergilbt
tx=np.arange(C)//tile; ty=(np.arange(C)//tile)[:,None]
tv=rng.uniform(0.82,1.04,(4,4)); tyel=rng.uniform(0.0,0.10,(4,4))
ceil*=tv[ty,tx][...,None]; ceil[...,2]*=(1-tyel[ty,tx])
# Wasserflecken (Ränder) auf 3 Platten
for (a,b) in [(1,2),(3,0),(2,3)]:
    cx,cy=a*tile+rng.uniform(60,190),b*tile+rng.uniform(60,190); R=rng.uniform(40,90)
    yy,xx=np.mgrid[0:C,0:C]; d=np.sqrt((xx-cx)**2+(yy-cy)**2)/R*(0.8+0.4*noise(C,C,16,30+a))
    ring=np.exp(-((d-1)/0.12)**2)*0.22+np.clip(1-d,0,1)*0.12
    inside=(xx//tile==a)&(yy//tile==b); k=(ring*inside)[...,None]; ceil*=1-k*np.array([0.9,1.0,1.25])
# Fehlende Platte (dunkles Loch mit Kabel-Andeutung) bei (0,1)
yy,xx=np.mgrid[0:C,0:C]; miss=(xx//tile==0)&(yy//tile==1)
ceil[miss]=0.03+0.03*fis[miss][:,None]
# T-Schienen 15 mm (~6 px), schmutzig weiß mit Schattenkante
gx=np.minimum(u,tile-u); gy=np.minimum(v,tile-v); grid=(np.minimum(gx[None,:],np.broadcast_to(gy,(C,C)))<3)
ceil[grid]=np.array([0.55,0.53,0.48])*(0.8+0.3*fis[grid])[:,None]
sh=(np.broadcast_to(gy,(C,C))>=3)&(np.broadcast_to(gy,(C,C))<7)|(gx[None,:]>=3)&(gx[None,:]<7)
ceil[sh&~grid&~miss]*=0.8
Image.fromarray(np.uint8(np.clip(ceil,0,1)*255)).save(OUT+'/ceil_c.jpg',quality=90)
cn=np.stack([0.5+(noise(C,C,1,25)-0.5)*0.35,0.5+(noise(C,C,1,26)-0.5)*0.35,np.ones((C,C))],-1)
cn[grid]=[0.5,0.5,1]; cn[(np.broadcast_to(gy,(C,C))>=3)&(np.broadcast_to(gy,(C,C))<5)]=[0.5,0.25,0.9]
Image.fromarray(np.uint8(np.clip(cn,0,1)*255)).resize((512,512)).save(OUT+'/ceil_n.jpg',quality=90)
print('ok')
