# Warteraum (Jenseits) – prozedurale Texturen + Schrift-Atlanten (PIL/numpy, kein KI-Text).
# Ausgabe: v3/assets/warteraum/src/*.png (Originale) ; Atlas-Zellen in atlas.json (für build_room.py)
import numpy as np, json, os, math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
OUT=os.path.join(os.path.dirname(__file__),'../../assets/warteraum/src'); os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(7); random.seed(7)
F='/usr/share/fonts/truetype/sand-box/google/'
def font(n,s):
    for p in [F+n, n]:
        if os.path.exists(p): return ImageFont.truetype(p,s)
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',s)
BC='Barlow Condensed/BarlowCondensed-Bold.ttf'; BCX='Barlow Condensed/BarlowCondensed-ExtraBold.ttf'; SER='/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'; MONO='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
def fnoise(n,beta=2.0,seed=None):  # kachelbare 1/f^beta-Noise, 0..1
    r=np.random.default_rng(seed) if seed is not None else rng
    f=np.fft.fftfreq(n); fx,fy=np.meshgrid(f,f); k=np.sqrt(fx**2+fy**2); k[0,0]=1
    s=(r.normal(size=(n,n))+1j*r.normal(size=(n,n)))/k**(beta/2); s[0,0]=0
    a=np.real(np.fft.ifft2(s)); a=(a-a.min())/(a.max()-a.min()); return a
def blur(a,r):
    im=Image.fromarray((np.clip(a,0,1)*65535).astype(np.uint16).astype(np.int32),'I'); 
    return np.asarray(Image.fromarray((a*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(float)/255
def save(a,name,mode='RGB'):
    a=np.clip(a,0,1); Image.fromarray((a*255+0.5).astype(np.uint8),mode).save(os.path.join(OUT,name)); print('ok',name)
def normal_from_h(h,strength):
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))*strength; gy=(np.roll(h,-1,0)-np.roll(h,1,0))*strength
    n=np.dstack([-gx,gy,np.ones_like(h)]); n/=np.linalg.norm(n,axis=2,keepdims=True); return n*0.5+0.5
lerp=lambda a,b,t: a+(b-a)*t
def col(h): return np.array([((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255])

# ---------- Stuckwand: Pockennarben-Putz, Graphit + Silber-Trockenpinsel + getönter Lack ----------
N=1024
base=fnoise(N,2.2,1); fine=fnoise(N,1.0,2)
pits=np.zeros((N,N))
for i in range(1700):  # Sand-Pocken (v4: weniger, ruhiger – Film-Stuck statt Sprenkel)
    x,y=rng.integers(0,N,2); r=rng.uniform(1.5,6)**1.0
    yy,xx=np.ogrid[-12:13,-12:13]; d=np.sqrt(xx**2+yy**2); p=np.clip(1-d/r,0,1)**1.5*rng.uniform(0.5,1)
    ys=(np.arange(y-12,y+13))%N; xs=(np.arange(x-12,x+13))%N; pits[np.ix_(ys,xs)]=np.maximum(pits[np.ix_(ys,xs)],p)
# v4: Stuck-Ornament wie Petes Screenshots (große, flache Muschel-/Fächerbögen im Putz, kaum sichtbar)
yy_,xx_=np.mgrid[0:N,0:N]/N
orn=np.zeros((N,N))
for cx_,cy_ in [(0.25,0.3),(0.75,0.3),(0.25,0.8),(0.75,0.8),(0.5,0.55),(0.0,0.55),(1.0,0.55)]:
    for ox in (-1,0,1):
        dd=np.sqrt((xx_-cx_-ox)**2+((yy_-cy_)*1.15)**2); orn+=np.clip(np.cos(dd*math.pi*22),0,1)**6*np.clip(1-dd/0.26,0,1)
orn=blur(orn,2.0)
h=base*0.55+fine*0.12-pits*0.45+orn*0.10
h=(h-h.min())/(h.max()-h.min())
hb=blur(h,1.2)
# Farbe: Graphit-Teal in Senken, Silber-Trockenpinsel auf Graten, Lack-Tönung
teal_dark=col(0x141f24); teal=col(0x2f4448); silver=col(0x98a2a2)   # v4: blaustichiges Flaschengrün wie im Film
ridge=np.clip((hb-0.55)*3.2,0,1)**1.4*(0.5+0.5*fnoise(N,1.6,3))
blotch=fnoise(N,2.6,4)
c=lerp(teal_dark[None,None,:],teal[None,None,:],np.clip(hb*1.3,0,1)[...,None])
c=lerp(c,silver[None,None,:],(ridge*0.55)[...,None])
c*=(0.75+0.4*blotch)[...,None]
c=lerp(c,c*col(0xa8bcc4)[None,None,:],0.15)  # v4: kühler, leicht bläulicher Lack
c=lerp(c,c*col(0x6a6450)[None,None,:],(np.clip((fnoise(N,2.8,21)-0.5)*2.2,0,1)*0.5)[...,None])  # Nikotin-/Schmutzwolken
c*=(1-0.35*pits)[...,None]
save(c,'wall_col.png'); save(normal_from_h(hb,9.0),'wall_nrm.png')
# Rauheit/Metall in einen Kanal: (glTF metallicRoughness: G=rough, B=metal)
mr=np.dstack([np.zeros((N,N)),0.85-ridge*0.45,ridge*0.6]); save(mr,'wall_mr.png')

# ---------- Boden: Schachbrett grün/weiß (4x4 Fliesen), abgetreten, Fugen ----------
N=2048; T=N//4
y,x=np.mgrid[0:N,0:N]; tile=((x//T)+(y//T))%2
wear=fnoise(N,2.4,5); spots=fnoise(N,1.4,6); scratch=np.zeros((N,N))
img=Image.new('L',(N,N),0); d=ImageDraw.Draw(img)
for i in range(900):
    x0,y0=rng.uniform(0,N,2); a=rng.uniform(0,6.28); L=rng.uniform(10,120)
    d.line([x0,y0,x0+math.cos(a)*L,y0+math.sin(a)*L],fill=int(rng.uniform(40,140)),width=1)
scratch=np.asarray(img).astype(float)/255
white=col(0xa59c78); green=col(0x1d3a2a)   # vergilbtes Weiß, dunkles Grün (wenig Kontrast wie im Film)
c=np.where(tile[...,None]==0,white,green)
per=np.zeros((N,N)); tilt=np.zeros((N,N))
for tx in range(4):
    for ty in range(4):
        per[ty*T:(ty+1)*T,tx*T:(tx+1)*T]=rng.uniform(-0.08,0.08)
        a=rng.uniform(0,6.28); k=rng.uniform(0.0,0.6)   # leicht schief verlegte Fliesen
        yy,xx=np.mgrid[0:T,0:T]/T-0.5; tilt[ty*T:(ty+1)*T,tx*T:(tx+1)*T]=k*(np.cos(a)*xx+np.sin(a)*yy)
c=c*(1+per[...,None])
grime=np.clip((wear-0.40)*1.8,0,1)
c=lerp(c,c*col(0x5a5236),grime[...,None]*0.7)
c*=(0.78+0.3*spots)[...,None]
c=lerp(c,col(0x2a281c)[None,None,:],scratch[...,None]*0.35)
# Absatz-Schrammen (kurze dunkle Bögen)
img=Image.new('L',(N,N),0); d=ImageDraw.Draw(img)
for i in range(420):
    x0,y0=rng.uniform(0,N,2); r_=rng.uniform(8,40); a0=rng.uniform(0,360)
    d.arc([x0-r_,y0-r_*0.4,x0+r_,y0+r_*0.4],a0,a0+rng.uniform(30,120),fill=int(rng.uniform(60,170)),width=int(rng.uniform(2,5)))
scuff=blur(np.asarray(img).astype(float)/255,1.0)
c=lerp(c,col(0x141210)[None,None,:],scuff[...,None]*0.45)
# Flecken (alte Pfützen/Kaffee)
st=np.clip((fnoise(N,3.0,22)-0.62)*4,0,1); c=lerp(c,c*col(0x7a6a40),st[...,None]*0.5)
gx=np.minimum(x%T,T-1-x%T); gy=np.minimum(y%T,T-1-y%T); g=np.minimum(gx,gy)
grout=np.clip(1-g/6.0,0,1)
c=lerp(c,col(0x17140e)[None,None,:],grout[...,None]*0.9)
# Schmutz in den Kanten, ausgefranst
edge=np.clip(1-g/(40.0*(0.6+0.8*wear)),0,1)**1.6
c*=(1-0.4*edge)[...,None]
c=lerp(c,c.mean(2,keepdims=True)*col(0x9a9070),0.25)   # leicht entsättigt / vergilbt
save(c,'floor_col.png')
hf=1-grout*0.8-scratch*0.1-scuff*0.15+wear*0.05+tilt*0.35; save(normal_from_h(blur(hf[::2,::2],0.8),6.0),'floor_nrm.png')
rough=np.dstack([np.zeros((N//2,N//2)),(0.45+0.45*grime[::2,::2]+0.3*grout[::2,::2]).clip(0,1),np.zeros((N//2,N//2))]); save(rough,'floor_mr.png')

# ---------- Decke: Akustikputz, vergilbt, Wasserflecken ----------
N=512; a=fnoise(N,1.2,8); b=fnoise(N,2.8,9)
c=lerp(col(0x7a6c56)[None,None,:],col(0xa8987a)[None,None,:],a[...,None])   # v4: warmes Beige wie im Film*(0.7+0.4*b)[...,None]
st=np.clip((fnoise(N,3.0,10)-0.62)*4,0,1); c=lerp(c,col(0x4a3c22)[None,None,:],st[...,None]*0.5)
save(c,'ceil_col.png')

# ---------- Wellblech (Farbe; Wellen = Geometrie): graugrün lackiert, Rostläufer ----------
N=512; y,x=np.mgrid[0:N,0:N]
streak=blur(np.repeat(rng.random((1,N)),N,0)*0.6+fnoise(N,2.0,11)*0.4,1)
rust=np.clip((fnoise(N,2.4,12)-0.6)*3,0,1)*np.clip(y/N*1.5,0,1)
c=lerp(col(0x8e8c7c)[None,None,:],col(0xbab6a2)[None,None,:],streak[...,None])   # v4: helles, beige-silbernes Wellblech (Pete 01)
c=lerp(c,col(0x5a3a1c)[None,None,:],rust[...,None]*0.7)*(0.85+0.2*fnoise(N,1.0,13))[...,None]
save(c,'metal_col.png')

# ---------- Craquelé-Theke (Krokolack, dunkelgrün-schwarz) ----------
N=1024; pts=rng.uniform(0,N,(1400,2))
from PIL import Image as I2
# Voronoi-Kanten (kachelbar via 3x3 Kopien) – grob über Abstandsdifferenz
yy,xx=np.mgrid[0:N:2,0:N:2]
P=np.concatenate([pts+np.array([dx,dy])*N for dx in (-1,0,1) for dy in (-1,0,1)])
d1=np.full(xx.shape,1e9); d2=np.full(xx.shape,1e9)
for p in P:
    if abs(p[0]-N/2)>N*0.6 or abs(p[1]-N/2)>N*0.6: continue
    d=(xx-p[0])**2+(yy-p[1])**2; m=d<d1; d2=np.where(m,d1,np.minimum(d2,d)); d1=np.where(m,d,d1)
e=np.sqrt(d2)-np.sqrt(d1); crack=np.clip(1-e/3.0,0,1)
crack=np.asarray(Image.fromarray((crack*255).astype(np.uint8)).resize((N,N),Image.BILINEAR)).astype(float)/255
cell=fnoise(N,2.0,14)
c=lerp(col(0x1d2a22)[None,None,:],col(0x3c4c3a)[None,None,:],cell[...,None])
c=lerp(c,col(0x7d8a70)[None,None,:],np.clip((cell-0.7)*2,0,1)[...,None]*0.6)
c=lerp(c,col(0x050605)[None,None,:],crack[...,None]*0.9)
save(c,'crackle_col.png'); save(normal_from_h(blur(1-crack*0.9+cell*0.2,1.0),8),'crackle_nrm.png')

# ---------- Holz (dunkler Nussbaum, für VC-Tönung hell gehalten) ----------
N=512; y,x=np.mgrid[0:N,0:N]
w=fnoise(N,2.0,15); ring=np.sin((x/N*28+w*6)*math.pi)*0.5+0.5
c=lerp(col(0x4a2c18)[None,None,:],col(0x7a4f2c)[None,None,:],(ring*0.6+fnoise(N,1.0,16)*0.4)[...,None])
save(c,'wood_col.png')

# ---------- Stoff (Webstruktur, neutral → VC tönt) ----------
N=512; y,x=np.mgrid[0:N,0:N]
weave=(np.sin(x*math.pi/2.0)*np.sin(y*math.pi/2.0))*0.5+0.5
c=(0.62+0.12*weave+0.22*fnoise(N,1.8,17)-0.15*np.clip((fnoise(N,2.6,18)-0.6)*3,0,1))
save(np.dstack([c,c,c]),'fabric_col.png')
# Lampenschirm Leinen (vergilbt, Flecken)
c=lerp(col(0xc9b48c)[None,None,:],col(0xe6d6ae)[None,None,:],(0.5*weave+0.5*fnoise(N,1.5,19))[...,None])
c=lerp(c,col(0x8a6a3a)[None,None,:],np.clip((fnoise(N,2.8,20)-0.62)*3,0,1)[...,None]*0.18)   # v4: kaum Flecken (leuchtet jetzt gleichmäßig)
save(c,'shade_col.png')
# Figuren-Haut/Stoff-Detail (neutral; VC trägt die Farbe)
N=512; c=0.78+0.14*fnoise(N,1.0,21)+0.1*fnoise(N,2.4,22); c-=0.18*np.clip((fnoise(N,0.6,23)-0.75)*4,0,1)
save(np.dstack([c,c,c]),'fig_col.png')

# ---------- Gemälde-Atlas (2x2 à 512): dunkle, nachgedunkelte Ölbilder ----------
N=512
def painting(kind,seed):
    r=np.random.default_rng(seed); y,x=np.mgrid[0:N,0:N]/N
    if kind=='land':
        sky=lerp(col(0x8a9478),col(0x3a4a48),y[...,None]*1.6)
        hz=0.55+0.06*np.sin(x*9+1)+0.04*fnoise(N,2,seed)[0][None,:]
        c=np.where((y>hz)[...,None],lerp(col(0x3a4a26),col(0x1a2210),((y-hz)*2)[...,None]),sky)
        # Baum
        tr=((x-0.7)**2/0.012+(y-0.42)**2/0.03)<1; c[tr]=col(0x1c2614)
    elif kind=='city':
        c=lerp(col(0x5a5a48),col(0x2a2a24),y[...,None])
        for i in range(14):
            bx=r.uniform(0,1); bw=r.uniform(0.04,0.12); bh=r.uniform(0.25,0.6)
            m=(abs(x-bx)<bw/2)&(y>1-bh); c[m]=col(0x1e1c18)*r.uniform(0.8,1.3)
            for k in range(20):
                wx=bx+r.uniform(-bw/2.5,bw/2.5); wy=1-r.uniform(0.05,bh-0.04); m2=(abs(x-wx)<0.006)&(abs(y-wy)<0.008); c[m2]=col(0x9a8a4a)
    elif kind=='plant':
        c=lerp(col(0x4a4434),col(0x2a2620),fnoise(N,2,seed)[...,None])
        pot=(abs(x-0.5)<0.13-0.05*(y-0.7))&(y>0.68)&(y<0.92); c[pot]=col(0x5a3a22)
        for i in range(18):
            a=r.uniform(-2.4,-0.7); L=r.uniform(0.2,0.4); t=np.linspace(0,1,80)
            for tt in t:
                px=0.5+math.cos(a)*L*tt; py=0.68+math.sin(a)*L*tt+0.15*tt*tt
                m=((x-px)**2+(y-py)**2)<(0.012*(1-tt)+0.004)**2; c[m]=col(0x2e4a22)*(0.8+0.4*tt)
    else:  # see/schiff
        sky=lerp(col(0x7a8478),col(0x4a5450),y[...,None]*2)
        c=np.where((y>0.6)[...,None],lerp(col(0x2a3a3a),col(0x141c1c),((y-0.6)*2.5)[...,None]),sky)
        hull=(abs(x-0.45)<0.16-0.6*np.maximum(0,y-0.56))&(y>0.53)&(y<0.6); c[hull]=col(0x1a1410)
        mast=(abs(x-0.45)<0.004)&(y>0.25)&(y<0.55); c[mast]=col(0x1a1410)
        sail=(x>0.455)&(x<0.455+0.12*(y-0.28)/0.25)&(y>0.28)&(y<0.52); c[sail]=col(0x8a8268)
    c=np.array(c,dtype=float)
    # Pinselstriche + Firnis + Craquelé + Vignette
    st=blur(r.random((N,N)),2.2); c*=(0.85+0.3*st)[...,None]
    c=lerp(c,c*col(0xa08a50),0.3)*1.0
    vg=1-0.4*((x-0.5)**2+(y-0.5)**2)*2.2; c*=vg[...,None]
    cr=fnoise(N,0.4,seed+1); c*=(1-0.18*(cr>0.78))[...,None]
    return c
A=np.zeros((1024,1024,3))
for i,(k,s) in enumerate([('land',31),('city',32),('plant',33),('sea',34)]):
    A[(i//2)*512:(i//2+1)*512,(i%2)*512:(i%2+1)*512]=painting(k,s)
save(A,'paintings.png')

# ---------- Schilder-Atlas 2048 (alle Texte per Code) ----------
S=Image.new('RGB',(2048,2048),(20,20,18)); d=ImageDraw.Draw(S); CELLS={}
def cell(name,x,y,w,h): CELLS[name]=[x,y,w,h]
def enamel(x,y,w,h,bg,rim,chips=40):
    d.rectangle([x,y,x+w-1,y+h-1],fill=rim); d.rounded_rectangle([x+8,y+8,x+w-9,y+h-9],radius=14,fill=bg)
    for i in range(chips):
        cx=x+random.choice([random.uniform(0,40),random.uniform(w-40,w)]) if random.random()<0.7 else x+random.uniform(0,w)
        cy=y+random.uniform(0,h); r=random.uniform(2,9); d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=(40,30,22))
    for i in range(6):  # Schraublöcher
        pass
    for sx,sy in [(x+26,y+h//2),(x+w-26,y+h//2)]: d.ellipse([sx-8,sy-8,sx+8,sy+8],fill=(70,66,58)); d.ellipse([sx-3,sy-3,sx+3,sy+3],fill=(20,20,20))
def ctext(x,y,w,h,txt,f,fill,dy=0):
    bb=d.textbbox((0,0),txt,font=f); tw=bb[2]-bb[0]; th=bb[3]-bb[1]; d.text((x+(w-tw)/2-bb[0],y+(h-th)/2-bb[1]+dy),txt,font=f,fill=fill)
# 1 Kopf-Schild
cell('amt',0,0,1600,300); enamel(0,0,1600,300,(24,52,40),(150,140,110),60)
ctext(0,20,1600,170,'JENSEITS-BÜRGERAMT',font(BCX,150),(214,206,170)); ctext(0,175,1600,100,'Abt. Frisch Verstorbene',font(BC,78),(190,182,150))
# 2 Nummer ziehen
cell('nummer',0,300,800,400); enamel(0,300,800,400,(214,206,180),(120,30,24),30)
ctext(0,330,800,120,'Bitte Nummer ziehen',font(BCX,92),(140,26,20)); ctext(0,450,800,80,'Wartezeit ca. 125 Jahre',font(BC,64),(40,36,30))
d.polygon([(360,560),(440,560),(440,540),(490,590),(440,640),(440,620),(360,620)],fill=(140,26,20))
# 3 INFORMATION (Metallplatte, geprägte Lettern)
cell('info',800,300,800,160); d.rectangle([800,300,1599,459],fill=(92,96,92)); d.rectangle([806,306,1593,453],outline=(140,146,140),width=4)
ctext(800,300,800,160,'INFORMATION',font(BCX,118),(40,42,40),2); ctext(800,300,800,160,'INFORMATION',font(BCX,118),(150,156,150),-2)
# 4 NO EXIT
cell('noexit',800,460,512,160); d.rectangle([800,460,1311,619],fill=(16,18,16)); d.rectangle([808,468,1303,611],outline=(200,206,180),width=5)
ctext(800,460,512,160,'NO EXIT',font(BCX,120),(226,232,206))
# 5 Formular 666-B Aushang
cell('formular',0,700,600,850); d.rectangle([0,700,599,1549],fill=(196,186,150))
ctext(0,720,600,90,'FORMULAR 666-B',font(BCX,84),(30,28,24)); ctext(0,805,600,60,'in dreifacher Ausfertigung',font(BC,48),(30,28,24))
for i in range(14):
    yy=900+i*42; d.line([40,yy,560,yy],fill=(110,100,80),width=2); d.text((44,yy-30),['Name (zu Lebzeiten)','Todesdatum','Todesursache','Spukwunsch','Unterschrift','Unterschrift (Durchschlag)','Unterschrift (2. Durchschlag)','Aktenzeichen','Bearbeiter','Wartenummer','Datum','','',''][i],font=font(BC,26),fill=(60,54,44))
d.ellipse([380,1350,560,1530],outline=(120,30,30),width=8); ctext(380,1350,180,180,'ABGELEHNT',font(BCX,34),(120,30,30))
# 6 Sprechzeiten
cell('zeiten',600,700,600,500); d.rectangle([600,700,1199,1199],fill=(30,32,30)); d.rectangle([610,710,1189,1189],outline=(170,170,150),width=3)
ctext(600,720,600,90,'SPRECHZEITEN',font(BCX,80),(214,210,190))
for i,t in enumerate(['Mo – Fr   9:00 – 9:05 Uhr','Mittwoch   geschlossen','Sa / So   ewig geschlossen','Feiertage   nach Ableben']): d.text((650,840+i*80),t,font=font(BC,52),fill=(196,192,170))
# 7 Handbuch-Plakat
cell('handbuch',1200,700,600,850); d.rectangle([1200,700,1799,1549],fill=(176,160,118))
ctext(1200,730,600,80,'NEU! JETZT ALS',font(BCX,64),(40,30,22)); ctext(1200,800,600,80,'TASCHENBUCH',font(BCX,88),(120,26,20))
d.polygon([(1330,930),(1630,900),(1660,1330),(1360,1370)],fill=(40,44,34)); d.polygon([(1360,1370),(1660,1330),(1672,1350),(1372,1392)],fill=(200,196,170))
ctext(1330,1010,320,80,'HANDBUCH',font(SER,46),(200,190,140)); ctext(1330,1070,320,60,'für kürzlich',font(SER,34),(200,190,140)); ctext(1330,1110,320,60,'Verstorbene',font(SER,40),(200,190,140))
ctext(1200,1420,600,60,'Erhältlich an Schalter 0',font(BC,46),(40,30,22)); ctext(1200,1475,600,50,'(Nummer ziehen)',font(BC,36),(60,50,40))
# 8 Radio-Skala
cell('radio',1600,0,448,160); d.rectangle([1600,0,2047,159],fill=(196,170,110))
for i in range(30): xx=1630+i*13; d.line([xx,40,xx,40+(18 if i%5==0 else 9)],fill=(60,40,20),width=2)
for i,t in enumerate(['UKW','88','92','96','100','104']): d.text((1622+i*70,70),t,font=font(BC,30),fill=(60,40,20))
d.line([1780,20,1780,140],fill=(150,30,20),width=4); d.text((1622,118),'MW  LW  KW  UKW',font=font(BC,26),fill=(80,50,24))
# 9 Nummernautomat-Etikett
cell('ziehen',1600,160,400,120); d.rectangle([1600,160,1999,279],fill=(150,28,22)); ctext(1600,160,400,120,'NUMMER',font(BCX,88),(230,220,200))
# 10 Wegweiser Verlorene Seelen
cell('seelen',0,1560,900,200); enamel(0,1560,900,200,(40,36,30),(120,110,90),40)
ctext(0,1575,760,100,'Verlorene Seelen',font(BCX,86),(206,198,160)); d.polygon([(720,1605),(790,1605),(790,1585),(850,1625),(790,1665),(790,1645),(720,1645)],fill=(206,198,160)); ctext(0,1670,900,70,'Fundbüro · 3. Untergeschoss',font(BC,54),(170,164,136))
# 11 Uhr-Zifferblatt
cell('uhr',1500,1560,400,400); d.ellipse([1500,1560,1899,1959],fill=(30,28,24)); d.ellipse([1512,1572,1887,1947],fill=(206,198,170))
for i in range(60):
    a=i/60*2*math.pi; r1=180; r2=170 if i%5 else 150; cx,cy=1700,1760
    d.line([cx+math.sin(a)*r1,cy-math.cos(a)*r1,cx+math.sin(a)*r2,cy-math.cos(a)*r2],fill=(30,28,24),width=6 if i%5==0 else 2)
for i in range(1,13):
    a=i/12*2*math.pi; ctext(1700+math.sin(a)*120-30,1760-math.cos(a)*120-30,60,60,str(13-i),font(BC,44),(30,28,24))  # Ziffern linksherum (Jenseits)
ctext(1600,1830,200,40,'AMTSZEIT',font(BC,26),(90,80,60))
# 12 Spuk-Genehmigung
cell('spuk',900,1560,600,200); d.rectangle([900,1560,1499,1759],fill=(184,176,146)); d.rectangle([906,1566,1493,1753],outline=(60,56,46),width=3)
ctext(900,1580,600,80,'Anträge auf Spuk-Genehmigung',font(BC,50),(30,28,24)); ctext(900,1660,600,80,'nur an Schalter 0',font(BCX,64),(120,26,20))
# 13 Akten-/Karton-Etiketten kommen in den Papier-Atlas
# Patina über alles: Schmutz + leichte Unschärfe
A=np.asarray(S).astype(float)/255; g=fnoise(2048,2.2,40); A*=(0.78+0.3*g)[...,None]; A=lerp(A,A*col(0xb0a070),0.25)
save(A,'signs.png'); json.dump({'signs':CELLS,'size':2048},open(os.path.join(OUT,'atlas.json'),'w'),indent=1)

# ---------- Papier-Atlas 1024 (4x4 à 256): Illustrierte, Zeitung, Formulare, Akten, Karton ----------
P=Image.new('RGB',(1024,1024),(200,190,160)); d=ImageDraw.Draw(P)
mags=[('JENSEITS','HEUTE',(130,40,30)),('DER','GEIST',(40,60,90)),('LEICHE','& LEBEN',(160,120,40)),('SPUK','REVUE',(60,90,50)),('FRIEDHOF','PRIVAT',(110,40,80)),('GRUFT','JOURNAL',(50,50,50))]
for i,(a,b,cc) in enumerate(mags):
    x,y=(i%4)*256,(i//4)*256; d.rectangle([x,y,x+255,y+255],fill=(210,200,176)); d.rectangle([x,y,x+255,y+64],fill=cc)
    d.text((x+12,y+6),a,font=font(BCX,46),fill=(240,232,210)); d.text((x+12,y+70),b,font=font(BCX,40),fill=cc)
    d.ellipse([x+60,y+120,x+196,y+250],fill=(int(cc[0]*0.6+60),int(cc[1]*0.6+50),int(cc[2]*0.6+40))); d.ellipse([x+98,y+140,x+158,y+200],fill=(214,190,160))
for i in (6,7):  # Zeitung
    x,y=(i%4)*256,(i//4)*256; d.rectangle([x,y,x+255,y+255],fill=(196,190,170)); d.text((x+10,y+6),'Der Totenbote',font=font(SER,30),fill=(20,20,20)); d.line([x+8,y+44,x+248,y+44],fill=(20,20,20),width=2)
    d.text((x+10,y+50),'Wartezeiten steigen' if i==6 else 'Amt: Alles normal',font=font(BCX,30),fill=(20,20,20))
    for k in range(16): d.line([x+10+(k%2)*124,y+100+(k//2)*18,x+118+(k%2)*124,y+100+(k//2)*18],fill=(90,90,86),width=5)
for i in (8,9):  # Formular-Blätter
    x,y=(i%4)*256,(i//4)*256; d.rectangle([x,y,x+255,y+255],fill=(222,216,196) if i==8 else (214,220,200)); d.text((x+10,y+8),'Formular 666-B',font=font(BCX,30),fill=(40,40,40))
    for k in range(10): d.line([x+10,y+60+k*18,x+246,y+60+k*18],fill=(140,140,130),width=1)
    d.ellipse([x+160,y+170,x+240,y+250],outline=(130,40,40),width=5)
for i in (10,11):  # Aktendeckel-Rücken (Ordnerreihe)
    x,y=(i%4)*256,(i//4)*256
    for k in range(8):
        cc=[(150,120,70),(120,100,60),(90,80,60),(140,60,40)][(k+i)%4]; d.rectangle([x+k*32,y,x+k*32+30,y+255],fill=cc); d.rectangle([x+k*32+6,y+40,x+k*32+24,y+110],fill=(210,200,170)); d.text((x+k*32+8,y+44),str(600+k*11+i),font=font(BC,14),fill=(30,30,30))
for i in (12,13):  # Karton
    x,y=(i%4)*256,(i//4)*256; d.rectangle([x,y,x+255,y+255],fill=(150,116,70)); d.line([x,y+128,x+255,y+128],fill=(190,170,120),width=26)
    d.text((x+20,y+30),'AKTEN %s'%('1801–1850' if i==12 else 'UNERLEDIGT'),font=font(BCX,30),fill=(40,30,20))
for i in (14,15):  # Buchseite / Buchdeckel
    x,y=(i%4)*256,(i//4)*256
    if i==14:
        d.rectangle([x,y,x+255,y+255],fill=(218,208,180))
        for k in range(18): d.line([x+16,y+16+k*13,x+240-random.randint(0,40),y+16+k*13],fill=(80,76,66),width=3)
    else:
        d.rectangle([x,y,x+255,y+255],fill=(70,30,26)); d.text((x+20,y+90),'Sterben',font=font(SER,40),fill=(190,160,90)); d.text((x+20,y+140),'für Anfänger',font=font(SER,28),fill=(190,160,90))
A=np.asarray(P).astype(float)/255; A*=(0.8+0.25*fnoise(1024,2.0,41))[...,None]; save(A,'paper.png')
print('fertig')
