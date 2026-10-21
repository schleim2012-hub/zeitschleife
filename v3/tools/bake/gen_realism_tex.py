# Erzeugt CC0-eigene Realismus-Texturen (prozedural): grunge.jpg (kachelbar, Makro-Variation),
# decals_mul.jpg (Multiply-Atlas 4x4: Weiß = keine Wirkung), posters.png (Plakatreste, Alpha-Test)
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
rng=np.random.default_rng(1984); OUT='/workspace/zeitschleife-vr/v3/assets/tex/realism/'
def fnoise(n,beta,seed):  # periodisches 1/f^beta Rauschen (kachelbar), 0..1
    r=np.random.default_rng(seed); w=r.standard_normal((n,n)); F=np.fft.fft2(w); fx=np.fft.fftfreq(n)[:,None]; fy=np.fft.fftfreq(n)[None,:]; f=np.sqrt(fx**2+fy**2); f[0,0]=1
    a=np.real(np.fft.ifft2(F/f**beta)); a=(a-a.min())/(a.max()-a.min()); return a
N=512
g=np.stack([fnoise(N,1.6,1),fnoise(N,1.1,2),fnoise(N,2.0,3)],-1)
g=np.clip((g-0.5)*1.6+0.5,0,1); Image.fromarray((g*255).astype(np.uint8)).save(OUT+'grunge.jpg',quality=88)
# --- Multiply-Atlas ---
C=256; A=np.ones((4*C,4*C,3),np.float32)
yy,xx=np.mgrid[0:C,0:C]/C; cx=xx-0.5; cy=yy-0.5; rr=np.sqrt(cx**2+cy**2)
def put(i,img): r,c=divmod(i,4); A[r*C:(r+1)*C,c*C:(c+1)*C]=np.clip(img,0,1)
def tint(m,col): return 1-m[...,None]*(1-np.array(col)[None,None,:])
n1=fnoise(C,1.4,11); n2=fnoise(C,1.0,12); edge=np.clip(1-rr*2.05,0,1)
# 0 Wasserfleck (getrockneter Rand)
m=np.clip((n1*0.5+0.75)-rr*1.9,0,1); ring=np.exp(-((rr*(1+0.25*(n2-0.5))-0.36)/0.03)**2)*edge; put(0,tint(np.clip(m*0.5+ring*0.7,0,1),(0.45,0.42,0.36)))
# 1 Dreckfleck
m=np.clip((n1-0.45)*2.2,0,1)*edge**0.6; put(1,tint(np.clip(m*1.0,0,1),(0.3,0.27,0.24)))
# 2 Bodenriss  3 Wandriss
def crack(seed,thick):
    im=Image.new('L',(C,C),0); d=ImageDraw.Draw(im); r=np.random.default_rng(seed)
    for b in range(3):
        x,y=C*0.5,C*0.5; a=r.uniform(0,6.28)
        for s in range(40):
            a+=r.normal(0,0.35); nx,ny=x+np.cos(a)*6,y+np.sin(a)*6; d.line([x,y,nx,ny],fill=255,width=max(1,int(thick*(1-s/40)*3))); x,y=nx,ny
            if not(8<x<C-8 and 8<y<C-8): break
    m=np.asarray(im.filter(ImageFilter.GaussianBlur(0.8)))/255.; halo=np.asarray(im.filter(ImageFilter.GaussianBlur(6)))/255.
    return np.clip(m*0.85+halo*0.5,0,1)
put(2,tint(crack(5,1.3),(0.15,0.13,0.12))); put(3,tint(crack(9,1.0),(0.2,0.18,0.17)))
# 4 aufsteigende Feuchte (horizontal kachelbar, unten dunkel)
nh=fnoise(C,1.3,21); hgt=0.55+0.3*nh[0:1,:]; m=np.clip((1-yy[::-1]-(1-hgt))*3,0,1); m=np.flipud(m)
m=np.clip((hgt - (1-yy))*3.0,0,1); m=m*0.7+np.clip(0.25-(1-yy),0,1)*1.6; put(4,tint(np.clip(m,0,1)*0.8,(0.32,0.3,0.26)))
# 5 Laufspuren von oben (Tropfen-Schlieren)
m=np.zeros((C,C)); r=np.random.default_rng(31)
for k in range(26):
    x=int(r.uniform(10,C-10)); L=r.uniform(0.3,0.95)*C; w=r.uniform(1,3.5)
    for y in range(int(L)): m[y,max(0,int(x-w)):int(x+w)]+=0.35*(1-y/L)**0.7
m=np.asarray(Image.fromarray((np.clip(m,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6)))/255.
top=np.clip(0.25-yy,0,1)*2; put(5,tint(np.clip(m*0.8+top,0,1),(0.3,0.28,0.25)))
# 6 Kaugummi/Kratzer-Cluster
im=Image.new('L',(C,C),0); d=ImageDraw.Draw(im)
for k in range(18): x,y=r.uniform(30,C-30,2); s=r.uniform(3,7); d.ellipse([x-s,y-s*0.8,x+s,y+s*0.8],fill=int(r.uniform(140,230)))
for k in range(14): x,y=r.uniform(20,C-20,2); a=r.uniform(0,6.28); L=r.uniform(15,60); d.line([x,y,x+np.cos(a)*L,y+np.sin(a)*L],fill=90,width=1)
m=np.asarray(im.filter(ImageFilter.GaussianBlur(0.7)))/255.; put(6,tint(m*0.8*edge**0.3,(0.22,0.2,0.22)))
# 7 Eckschatten/Schmutzsaum (Verlauf zu einer Kante, unten)
m=np.clip(yy**2.2,0,1)*(0.75+0.35*n1); put(7,tint(np.clip(m*1.2,0,1)*0.92,(0.25,0.23,0.22)))
# 8 Schuhabrieb-Spur (länglich, kachelbar in v)
m=np.exp(-((cx)/0.22)**2)*(0.4+0.6*fnoise(C,0.9,41)); put(8,tint(m*0.45,(0.35,0.33,0.3)))
# 9 Rostring (Eimerabdruck)
ring=np.exp(-((rr-0.33)/0.035)**2)*(0.6+0.5*n2)+np.exp(-((rr-0.36)/0.06)**2)*0.3; put(9,tint(np.clip(ring,0,1)*0.8,(0.42,0.25,0.12)))
# 10 Schimmel/Stockflecken
m=np.clip((fnoise(C,1.2,51)-0.55)*4,0,1)*edge**0.5; m2=np.clip((fnoise(C,0.6,52)-0.6)*5,0,1)*m; put(10,tint(np.clip(m*0.5+m2*0.6,0,1),(0.2,0.24,0.18)))
# 11 Brandfleck (Zigarette)
m=np.clip(1-rr*5,0,1)**1.5+np.clip(1-rr*3,0,1)*0.3*n1; put(11,tint(np.clip(m,0,1),(0.08,0.07,0.06)))
Image.fromarray((A*255).astype(np.uint8)).save(OUT+'decals_mul.jpg',quality=90)
# --- Plakatreste (RGBA, Alpha-Test) 2x2 à 256 ---
P=Image.new('RGBA',(512,512),(0,0,0,0)); fonts=['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']
try: F1=ImageFont.truetype(fonts[0],44); F2=ImageFont.truetype(fonts[0],22)
except Exception: F1=F2=ImageFont.load_default()
specs=[((40,30,70),(255,80,170),'DISCO','SA 22 UHR'),((15,40,60),(80,220,255),'VIDEO','NEU: 2 FILME'),((60,50,20),(255,200,60),'ROLLSCHUH','BAHN · 5 DM'),((50,15,20),(255,90,60),'KONZERT','AUSVERKAUFT')]
for i,(bg,fg,t1,t2) in enumerate(specs):
    c=Image.new('RGBA',(256,256),bg+(255,)); d=ImageDraw.Draw(c)
    for k in range(6): d.rectangle([10,10+k*40,246,14+k*40],fill=tuple(int(v*1.3) for v in bg)+(255,))
    d.text((128,90),t1,font=F1,fill=fg+(255,),anchor='mm'); d.text((128,150),t2,font=F2,fill=(230,225,215,255),anchor='mm')
    a=np.array(c).astype(np.float32); nn=fnoise(256,1.5,60+i); fade=0.55+0.45*nn; a[...,:3]=a[...,:3]*fade[...,None]*0.75+np.array([60,55,50])*(1-fade[...,None])*0.6
    # gerissene Ränder: Maske aus Rauschen, größere Fehlstücke
    yy2,xx2=np.mgrid[0:256,0:256]/256.; tear=fnoise(256,2.4,70+i); ed=1-np.maximum(abs(xx2-0.5),abs(yy2-0.5))*2; keep=(tear*0.5+ed*0.9+0.08*fnoise(256,0.8,75+i))>0.42
    if i%2: keep&=(yy2<0.55+0.25*fnoise(256,1.4,80+i))
    else: keep&=(xx2>0.12+0.2*fnoise(256,1.4,90+i))
    a[...,3]=keep*255
    P.paste(Image.fromarray(a.clip(0,255).astype(np.uint8)),((i%2)*256,(i//2)*256))
P.save(OUT+'posters.png',optimize=True)
print('ok')
