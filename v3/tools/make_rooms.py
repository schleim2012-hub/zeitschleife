# V3: erzeugt 360°-Equirect-Panoramen (4096x2048). Backrooms prozedural (Box-Raycast mit gemalten Wandtexturen),
# 1989 aus den V2-Stills (Vorderseite perspektivisch korrekt, Rest gespiegelt/weichgezeichnet als Umgebung).
# Konvention: lon=0 -> -z (vorne), lon=+90 -> +x (rechts); Auge im Ursprung, Boden y=-1.6.
import numpy as np, json, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont
Wd,Hd=4096,2048; PX=200  # Pixel pro Meter auf Wandtexturen
FONT='/workspace/zeitschleife-vr/v3/fonts/Rajdhani-Bold.ttf'
u=(np.arange(Wd)+.5)/Wd; v=(np.arange(Hd)+.5)/Hd
LON,LAT=np.meshgrid((u-.5)*2*np.pi,(.5-v)*np.pi)
DX=np.cos(LAT)*np.sin(LON); DY=np.sin(LAT); DZ=-np.cos(LAT)*np.cos(LON)
rng=np.random.default_rng(3)
def f(s): return ImageFont.truetype(FONT,s)
def wallpaper(w,h):
  W,H=int(w*PX),int(h*PX); a=np.zeros((H,W,3)); a[:]=(196,178,104)
  xs=np.arange(W)/PX; a+=((np.sin(xs*2*np.pi/0.12)>0.6)*9)[None,:,None]  # feine Streifen
  a+=rng.normal(0,4,(H,W,1)); im=Image.fromarray(np.clip(a,0,255).astype(np.uint8)); d=ImageDraw.Draw(im)
  for _ in range(int(w*h*0.6)):  # Flecken
    x,y=rng.uniform(0,W),rng.uniform(H*0.3,H); r=rng.uniform(10,60); d.ellipse([x-r,y-r*1.5,x+r,y+r*1.5],fill=(170,150,85))
  im=im.filter(ImageFilter.GaussianBlur(1.2)); d=ImageDraw.Draw(im); d.rectangle([0,H-int(.12*PX),W,H],fill=(120,98,58)); return im
def carpet(w,h):
  W,H=int(w*PX/2),int(h*PX/2); a=np.zeros((H,W,3)); a[:]=(138,118,70); a+=rng.normal(0,10,(H,W,1)); im=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
  d=ImageDraw.Draw(im)
  for _ in range(int(w*h*0.4)): x,y=rng.uniform(0,W),rng.uniform(0,H); r=rng.uniform(8,40); d.ellipse([x-r,y-r,x+r,y+r*.7],fill=(112,94,55))
  return im.filter(ImageFilter.GaussianBlur(1.5))
def ceiling(w,h,lamps,x0,z0):
  W,H=int(w*PX/2),int(h*PX/2); im=Image.new('RGB',(W,H),(205,196,160)); d=ImageDraw.Draw(im); s=0.6*PX/2
  for i in range(int(W/s)+1): d.line([i*s,0,i*s,H],fill=(150,140,110),width=2)
  for j in range(int(H/s)+1): d.line([0,j*s,W,j*s],fill=(150,140,110),width=2)
  for lx,lz in lamps:
    cx,cy=(lx-x0)*PX/2,(lz-z0)*PX/2; d.rectangle([cx-s,cy-s/2,cx+s,cy+s/2],fill=(255,252,225))
  return im
def corridor(im,cx,w,hgt,eye,depth=1.0,dark=False):
  # gemalter Flur in eine Wandtextur: Öffnung (cx,w,hgt in m), Fluchtpunkt auf Augenhöhe
  d=ImageDraw.Draw(im); H=im.height; X0,X1=(cx-w/2)*PX,(cx+w/2)*PX; Yt=H-hgt*PX; Yb=H; vx,vy=cx*PX,H-eye*PX
  for k in range(40,0,-1):
    t=k/40; s=t**1.6
    l=vx+(X0-vx)*s; r=vx+(X1-vx)*s; tp=vy+(Yt-vy)*s; bt=vy+(Yb-vy)*s
    b=int(30+150*s) if not dark else int(10+60*s)
    d.polygon([(l,tp),(r,tp),(r,bt),(l,bt)],fill=(b,int(b*.9),int(b*.5)))
    # Lampenstreifen an der Decke
    if k%6==0: d.rectangle([vx-(vx-l)*.25,tp+2,vx+(r-vx)*.25,tp+4+6*s],fill=(255,250,215))
  d.rectangle([X0-4,Yt-4,X1+4,Yt],fill=(110,92,55))
def door(im,cx,label,col,sign,glow=None):
  d=ImageDraw.Draw(im); H=im.height; w,h=1.0*PX,2.1*PX; X0=cx*PX-w/2; Y0=H-h
  if glow: 
    g=Image.new('RGBA',im.size,(0,0,0,0)); gd=ImageDraw.Draw(g); gd.rectangle([X0-60,Y0-60,X0+w+60,H],fill=glow+(110,)); g=g.filter(ImageFilter.GaussianBlur(40)); im.paste(g,(0,0),g); d=ImageDraw.Draw(im)
  d.rectangle([X0-14,Y0-14,X0+w+14,H],fill=(70,52,34)); d.rectangle([X0,Y0,X0+w,H],fill=col)
  for i in range(2): d.rectangle([X0+20,Y0+30+i*(h/2-10),X0+w-20,Y0+h/2-10+i*(h/2-10)],outline=tuple(int(c*.7) for c in col),width=4)
  d.ellipse([X0+w-38,Y0+h*.52,X0+w-18,Y0+h*.52+20],fill=(200,180,120))
  d.rectangle([X0+w/2-90,Y0+40,X0+w/2+90,Y0+110],fill=sign); d.text((X0+w/2,Y0+76),label,font=f(64),fill=(20,15,10),anchor='mm')
def automat(im,cx):
  d=ImageDraw.Draw(im); H=im.height; w,h=0.95*PX,1.85*PX; X0=cx*PX-w/2; Y0=H-h
  d.rectangle([X0,Y0,X0+w,H],fill=(150,30,32)); d.rectangle([X0+14,Y0+14,X0+w-14,Y0+h*.55],fill=(60,20,20))
  d.text((X0+w/2,Y0+70),'BACKROOMS',font=f(30),fill=(250,230,200),anchor='mm'); d.text((X0+w/2,Y0+110),'COLA',font=f(54),fill=(250,230,200),anchor='mm')
  d.rectangle([X0+w-50,Y0+h*.62,X0+w-24,Y0+h*.62+60],fill=(30,30,30)); d.rectangle([X0+30,Y0+h*.82,X0+w-30,Y0+h*.92],fill=(25,10,10))
  d.text((X0+w-37,Y0+h*.6),'25¢',font=f(22),fill=(255,220,120),anchor='mm')
def riss(im,cx,cy):
  d=ImageDraw.Draw(im); H=im.height; X,Y=cx*PX,H-cy*PX
  pts=[(X+rng.uniform(-14,14),Y-130+k*26) for k in range(11)]
  for k in range(len(pts)-1):
    x0,y0=pts[k]; x1,y1=pts[k+1]; d.polygon([(x0-10,y0),(x1-10,y1),(x1+10,y1),(x0+10,y0)],fill=(150,40,70))
    d.ellipse([x0-7,y0-7,x0+7,y0+7],fill=(230,90,130))
  d.line(pts,fill=(60,20,30),width=3)
def plate(im,cx,cy):
  d=ImageDraw.Draw(im); H=im.height; X,Y=cx*PX,H-cy*PX
  d.rounded_rectangle([X-75,Y-20,X+75,Y+20],6,fill=(235,235,225),outline=(40,40,40),width=3); d.text((X,Y),'Z-EIT 88',font=f(30),fill=(20,20,30),anchor='mm')
def render(box,faces,lamps,out):
  x0,x1,y0,y1,z0,z1=box  # Augen-relativ
  with np.errstate(divide='ignore',invalid='ignore'):
    tx=np.where(DX>0,x1/DX,x0/DX); ty=np.where(DY>0,y1/DY,y0/DY); tz=np.where(DZ>0,z1/DZ,z0/DZ)
  T=np.minimum(np.minimum(np.where(tx>0,tx,1e9),np.where(ty>0,ty,1e9)),np.where(tz>0,tz,1e9))
  PXw,PYw,PZw=DX*T,DY*T,DZ*T; img=np.zeros((Hd,Wd,3))
  def samp(name,uu,vv,m):
    a=np.asarray(faces[name],dtype=np.float32); h,w=a.shape[:2]
    iu=np.clip((uu*(w-1)).astype(int),0,w-1); iv=np.clip((vv*(h-1)).astype(int),0,h-1); img[m]=a[iv[m],iu[m]]
  e=1e-4
  m=np.abs(PZw-z0)<e; samp('front',(PXw-x0)/(x1-x0),(y1-PYw)/(y1-y0),m)
  m=np.abs(PZw-z1)<e; samp('back',(x1-PXw)/(x1-x0),(y1-PYw)/(y1-y0),m)
  m=np.abs(PXw-x0)<e; samp('left',(z1-PZw)/(z1-z0),(y1-PYw)/(y1-y0),m)
  m=np.abs(PXw-x1)<e; samp('right',(PZw-z0)/(z1-z0),(y1-PYw)/(y1-y0),m)
  m=np.abs(PYw-y0)<e; samp('floor',(PXw-x0)/(x1-x0),(PZw-z0)/(z1-z0),m)
  m=np.abs(PYw-y1)<e; samp('ceil',(PXw-x0)/(x1-x0),(PZw-z0)/(z1-z0),m)
  L=np.zeros_like(T)
  for lx,lz in lamps:
    dd=(PXw-lx)**2+(PYw-y1)**2+(PZw-lz)**2; L+=1.6/(1+dd*0.35)
  shade=np.clip(0.42+L,0,1.25)*np.exp(-T/22)
  img*=shade[...,None]; img+=rng.normal(0,2.5,img.shape)
  Image.fromarray(np.clip(img,0,255).astype(np.uint8)).save(out,quality=86)
def hit(x,y,z,w,h): return {'pos':[round(x,3),round(y,3),round(z,3)],'size':[w,h]}
meta={}
EYE=1.6; CH=2.7
# ---------- B1 Aufwachen: x -3.5..3.5, z -5..3.5
X0,X1,Z0,Z1=-3.5,3.5,-5,3.5; lamps=[(-1.6,-3),(1.6,-3),(-1.6,0.5),(1.6,0.5),(0,-1.2)]
fr=wallpaper(X1-X0,CH); corridor(fr,3.5,2.0,2.3,EYE)
bk=wallpaper(X1-X0,CH); automat(bk,7-(-1.9+3.5))  # back: u von x1 nach x0
le=wallpaper(Z1-Z0,CH); riss(le,Z1-(-1.2),1.6)     # left: u von z1 nach z0
ri=wallpaper(Z1-Z0,CH); plate(ri,(-2.6)-Z0,1.85)    # right: u von z0 nach z1
faces=dict(front=fr,back=bk,left=le,right=ri,floor=carpet(X1-X0,Z1-Z0),ceil=ceiling(X1-X0,Z1-Z0,lamps,X0,Z0))
render((X0,X1,-EYE,CH-EYE,Z0,Z1),faces,lamps,'sky/B1.jpg')
meta['B1']={'flur':hit(0,-0.45,-4.95,2.0,2.3),'automat':hit(-1.9,-0.67,3.45,1.0,1.9),'riss':hit(-3.45,0,-1.2,0.9,1.6),'kennzeichen':hit(3.45,0.25,-2.6,0.9,0.5)}
# ---------- B2 Kreuzung: x -3..3, z -4.5..3
X0,X1,Z0,Z1=-3,3,-4.5,3; lamps=[(-1.5,-2.5),(1.5,-2.5),(-1.5,1),(1.5,1)]
fr=wallpaper(6,CH); door(fr,3,'1989',(120,110,95),(240,220,90))
le=wallpaper(7.5,CH); door(le,Z1-(-1.0),'1984',(110,60,110),(255,120,210),glow=(255,60,190))
ri=wallpaper(7.5,CH); door(ri,(-1.0)-Z0,'2041',(60,80,70),(120,255,150),glow=(40,255,120))
bk=wallpaper(6,CH); corridor(bk,3,2.0,2.3,EYE)
faces=dict(front=fr,back=bk,left=le,right=ri,floor=carpet(6,7.5),ceil=ceiling(6,7.5,lamps,X0,Z0))
render((X0,X1,-EYE,CH-EYE,Z0,Z1),faces,lamps,'sky/B2.jpg')
meta['B2']={'t1989':hit(0,-0.55,-4.45,1.2,2.2),'t1984':hit(-2.95,-0.55,-1.0,1.2,2.2),'t2041':hit(2.95,-0.55,-1.0,1.2,2.2),'zurueck':hit(0,-0.45,2.95,2.0,2.3)}
# ---------- 1989 aus Stills
HF=np.radians(100)/2; VF=np.arctan(np.tan(HF)*9/16); D=5.0
def from_still(src,out,night=(10,12,26)):
  im=Image.open(src).convert('RGB').resize((1920,1080)); A=np.asarray(im,dtype=np.float32)
  B=np.asarray(im.filter(ImageFilter.GaussianBlur(30)),dtype=np.float32)*0.45
  lon=LON; lat=LAT
  # Umgebung: lon-gespiegelt, an +-180 stetig (u=0.5)
  al=np.abs(lon); uf=0.5+lon/(2*HF)
  ue=np.where(al<=HF,uf,np.where(lon>0,1-(al-HF)/(np.pi-HF)*0.5,(al-HF)/(np.pi-HF)*0.5))
  ve=0.5-lat/(2*VF); vc=np.clip(ve,0,1)
  E=B[(np.clip(vc,0,1)*1079).astype(int),(np.clip(ue,0,1)*1919).astype(int)]
  # oben/unten in Nachthimmel bzw. dunklen Boden auslaufen
  top=np.clip((0.12-ve)/0.45,0,1)[...,None]; bot=np.clip((ve-0.88)/0.45,0,1)[...,None]
  E=E*(1-top)+np.array(night)*top; E=E*(1-bot)+np.array([18,16,16])*bot
  st=(rng.random(LON.shape)<0.0009)&(lat>VF*1.2); E[st]=np.maximum(E[st],rng.uniform(120,220,(st.sum(),1)))
  # Front perspektivisch
  with np.errstate(divide='ignore',invalid='ignore'):
    px=DX/(-DZ); py=DY/(-DZ)
  fu=0.5+px/(2*np.tan(HF)); fv=0.5-py/(2*np.tan(VF)); inF=(DZ<0)&(fu>=0)&(fu<=1)&(fv>=0)&(fv<=1)
  Fr=A[(np.clip(fv,0,1)*1079).astype(int),(np.clip(fu,0,1)*1919).astype(int)]
  edge=np.minimum(np.minimum(fu,1-fu)*16/9,np.minimum(fv,1-fv)); wgt=np.clip(edge/0.06,0,1)*inF
  O=E*(1-wgt[...,None])+Fr*wgt[...,None]
  Image.fromarray(np.clip(O,0,255).astype(np.uint8)).save(out,quality=86)
for k in ['M1','M2','M3']: from_still(f'stills/{k}.jpg',f'sky/{k}.jpg')
meta['_plate']={'hfovDeg':100,'dist':D,'w':round(2*D*np.tan(HF),3),'h':round(2*D*np.tan(VF),3)}
json.dump(meta,open('data/rooms_meta.json','w'),indent=1); print(json.dumps(meta['_plate']))
