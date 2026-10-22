# Schlafzimmer-Texturen (PIL/numpy, Text per Code – keine KI-Schrift): Flickenteppich (oval, geflochten), Pinnwand, Wandkalender Okt. 1989, heller Hinterhof-Blick.
# python3 gen_bedroom_tex.py  (aus tools/gfx_wohnung) → assets/apartment/bedroom/*.jpg|png (+ src/)
import numpy as np, math, random, calendar, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
V3=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..')); OUT=V3+'/assets/apartment/bedroom/'; os.makedirs(OUT+'src',exist_ok=True)
F=lambda n,s: ImageFont.truetype(n,s)
DJ='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; DJC='/usr/share/fonts/truetype/dejavu/../liberation/LiberationSans-Bold.ttf'; DJS='/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'; KAL=V3+'/fonts/Kalam-Regular.ttf'
rng=np.random.default_rng(1989); random.seed(1989)
def noise(h,w,sc,oc=4):
    a=np.zeros((h,w))
    for o in range(oc):
        s=max(2,int(sc/(2**o))); n=rng.random((h//s+2,w//s+2)); im=Image.fromarray((n*255).astype(np.uint8)).resize((w+s*2,h+s*2),Image.BICUBIC)
        a+=np.asarray(im,dtype=float)[:h,:w]/255/(2**o)
    return a/a.max()
# ---------- 1) Flickenteppich: ovale Zöpfe, Stoffreste in gedeckten 80er-Farben, Faserrauschen, ausgefranster Rand ----------
def rug(N=1024):
    y,x=np.mgrid[0:N,0:N]; cx=cy=N/2; r=np.hypot(x-cx,y-cy)/(N/2); a=np.arctan2(y-cy,x-cx)
    pal=np.array([[118,72,52],[150,118,82],[84,92,70],[170,150,120],[96,60,62],[62,70,92],[140,98,60],[190,170,140],[70,52,40]],float)
    ring_w=0.045; k=r/ring_w; ri=np.floor(k).astype(int); fr=k-ri
    seq=np.array([random.randrange(len(pal)) for _ in range(40)]); col=pal[seq[np.clip(ri,0,39)]]
    # Zopf: schräge Stränge pro Ring
    strand=np.sin((a*(30+ri*6))+fr*math.pi*2.2+ri)*0.5+0.5
    shade=0.62+0.38*np.sin(fr*math.pi)**0.6; shade*=0.82+0.18*strand
    fib=noise(N,N,6,3); shade*=0.85+0.3*fib
    # zweiter Strang andersfarbig (Flicken)
    alt=pal[seq[np.clip(ri+7,0,39)%40]]; m=(strand>0.62)[...,None]; col=np.where(m,col*0.55+alt*0.45,col)
    dirt=noise(N,N,180,3); shade*=0.86+0.2*dirt; shade*=np.where(r<0.12,0.9,1)
    img=np.clip(col*shade[...,None],0,255)
    edge=0.985+0.012*np.sin(a*90)+0.008*(noise(N,N,8,2)-0.5)
    alpha=np.clip((edge-r)*80,0,1)*255
    im=Image.fromarray(np.dstack([img,alpha]).astype(np.uint8),'RGBA'); im.save(OUT+'src/sz_rug.png'); im.save(OUT+'sz_rug.png',optimize=True)
# ---------- 2) Pinnwand (Kork, Holzrahmen): Fotos, Konzertkarte (Parodie), Zettel, Postkarte ----------
def cork(w,h):
    n=noise(h,w,3,3); n2=noise(h,w,40,3); b=np.array([150,104,62],float); c=b*(0.72+0.38*n[...,None])*(0.9+0.15*n2[...,None])
    sp=rng.random((h,w))>0.985; c[sp]*=0.55; return Image.fromarray(np.clip(c,0,255).astype(np.uint8))
def pin(d,x,y,c):
    d.ellipse([x-9,y-9,x+9,y+9],fill=tuple(int(v*0.5) for v in c)); d.ellipse([x-8,y-10,x+7,y+5],fill=c); d.ellipse([x-5,y-8,x-1,y-4],fill=(255,255,255))
def paste_rot(base,im,x,y,ang,shadow=True):
    im=im.convert('RGBA').rotate(ang,expand=True,resample=Image.BICUBIC)
    if shadow:
        sh=Image.new('RGBA',im.size,(0,0,0,0)); sh.putalpha(im.getchannel('A').point(lambda v:int(v*0.55))); sh=sh.filter(ImageFilter.GaussianBlur(6)); base.alpha_composite(sh,(x+6,y+8))
    base.alpha_composite(im,(x,y))
def photo(src,w,h,crop=None,cap=None,pol=True,warm=1.0):
    im=Image.open(src).convert('RGB');
    if crop: im=im.crop(crop)
    im=im.resize((w,h),Image.LANCZOS); im=ImageEnhance.Color(im).enhance(0.75); im=ImageEnhance.Contrast(im).enhance(0.9)
    a=np.asarray(im,float); a[...,0]*=1.06*warm; a[...,2]*=0.86; im=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
    if not pol: return im
    m=12; P=Image.new('RGB',(w+2*m,h+m+46),(232,226,210)); P.paste(im,(m,m)); d=ImageDraw.Draw(P)
    if cap: d.text((m+4,h+m+6),cap,font=F(KAL,28),fill=(40,40,90))
    return P
def scene(kind,w,h):
    # weiche, verblasste Urlaubsfotos (prozedural, unscharf wie Pocketkamera)
    y=np.linspace(0,1,h)[:,None]*np.ones((1,w)); x=np.ones((h,1))*np.linspace(0,1,w)[None,:]; n=noise(h,w,max(4,w//40),4)
    if kind=='strand':
        sky=np.array([150,185,215])*(1-0.35*y[...,None])+np.array([40,30,10])*y[...,None]; hz=0.48+0.01*np.sin(x*9)
        sea=np.array([60,110,140])*(0.85+0.2*n[...,None]); sand=np.array([215,190,150])*(0.85+0.2*n[...,None])
        c=np.where((y<hz)[...,None],sky,np.where((y<hz+0.16+0.03*np.sin(x*14))[...,None],sea,sand))
        for i in range(3):
            cx=0.25+i*0.22; m=((x-cx)**2*9+(y-0.62)**2*1.2<0.004); c[m]=[120,70,60]
        sch=((x-0.72)**2+(y-0.72)**2*0.6<0.006); c[sch]=[200,60,50]   # Sonnenschirm
    elif kind=='harz':
        sky=np.array([170,190,205])*(1-0.25*y[...,None]); c=sky.copy()
        r1=0.45+0.08*np.sin(x*5+1)+0.04*(n-0.5); r2=0.6+0.05*np.sin(x*9)+0.05*(n-0.5)
        c=np.where((y>r1)[...,None],np.array([70,95,80])*(0.8+0.3*n[...,None]),c); c=np.where((y>r2)[...,None],np.array([40,62,40])*(0.7+0.4*n[...,None]),c)
        c=np.where((y>0.82)[...,None],np.array([110,120,70])*(0.8+0.3*n[...,None]),c)
        for i in range(14):
            tx=random.random(); ty=r2.mean()+random.random()*0.05; m=(abs(x-tx)<(0.02*(y-ty+0.1)/0.15))&(y>ty-0.1)&(y<ty+0.06); c[m]=[25,40,28]
    else:  # sonnenuntergang
        c=np.array([235,150,80])*(1-y[...,None])+np.array([120,40,60])*y[...,None]
        sun=((x-0.6)**2+(y-0.42)**2<0.006); c[sun]=[255,225,170]; c=np.where((y>0.55)[...,None],np.array([60,40,60])*(0.8+0.3*n[...,None]),c)
        for tx in ():
            m=(abs(x-tx)<0.008)&(y>0.2)&(y<0.6); c[m]=[30,20,30]
            for a in range(7):
                ang=a/7*math.pi; m2=(abs((y-0.22)-np.sin(ang)*0.0-(x-tx)*math.tan(ang-1.5)*0.3)<0.012)&(abs(x-tx)<0.09)&(y<0.3); c[m2]=[30,20,30]
    im=Image.fromarray(np.clip(c,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(1,w/220)))
    a=np.asarray(im,float); v=1-0.45*((x-0.5)**2+(y-0.5)**2)[...,None]*2; a=a*v; a=a*0.85+np.array([28,22,10]); return Image.fromarray(np.clip(a,0,255).astype(np.uint8))
def snap(kind,w,h,cap=None,pol=True):
    im=scene(kind,w,h)
    if not pol: return im
    m=12; P=Image.new('RGB',(w+2*m,h+m+46),(232,226,210)); P.paste(im,(m,m)); d=ImageDraw.Draw(P)
    if cap: d.text((m+4,h+m+6),cap,font=F(KAL,28),fill=(40,40,90))
    return P
def pinboard():
    W,H=1024,704; B=Image.new('RGBA',(W,H)); fr=36
    wood=noise(H,W,6,3); g=np.array([120,82,48],float)*(0.75+0.3*wood[...,None]); B.paste(Image.fromarray(np.clip(g,0,255).astype(np.uint8)))
    B.paste(cork(W-2*fr,H-2*fr),(fr,fr)); d=ImageDraw.Draw(B); d.rectangle([fr-2,fr-2,W-fr+1,H-fr+1],outline=(70,46,26),width=3)
    pa=snap('strand',230,170,cap='Ostsee \'88'); paste_rot(B,pa,60,60,4)
    pb=snap('harz',200,150,cap='Klassenfahrt'); paste_rot(B,pb,330,90,-6)
    # Konzertkarte (fiktive Band)
    T=Image.new('RGB',(360,150),(226,206,120)); t=ImageDraw.Draw(T); t.rectangle([0,0,359,149],outline=(120,40,30),width=4); t.rectangle([268,0,272,149],fill=(180,160,90))
    t.text((14,10),'SPUKPALAST',font=F(DJ,34),fill=(150,30,30)); t.text((14,50),'Tournee \'89 · Stadthalle',font=F(DJC,20),fill=(40,30,20)); t.text((14,78),'Sa. 14.10.89  20 Uhr',font=F(DJC,20),fill=(40,30,20)); t.text((14,108),'Stehplatz  18,– DM',font=F(DJC,20),fill=(40,30,20))
    t.text((282,20),'Nr.',font=F(DJC,18),fill=(60,40,20)); t.text((280,46),'0815',font=F(DJ,22),fill=(150,30,30)); paste_rot(B,T,580,66,7)
    # Zettel (Easter Egg)
    Z=Image.new('RGB',(300,210),(240,232,150)); z=ImageDraw.Draw(Z); [z.line([(0,40+i*30),(300,40+i*30)],fill=(170,180,200),width=2) for i in range(6)]
    z.text((14,12),'NICHT VERGESSEN:',font=F(KAL,28),fill=(30,40,110)); z.text((14,56),'Videos zurückspulen!',font=F(KAL,28),fill=(30,40,110)); z.text((14,90),'(sonst 2,– DM Strafe)',font=F(KAL,24),fill=(30,40,110)); z.text((14,140),'Mo: Mathe-Arbeit',font=F(KAL,28),fill=(150,30,40))
    paste_rot(B,Z,90,330,-3)
    # Postkarte
    pc=snap('sunset',260,170,pol=False); P2=Image.new('RGB',(276,186),(236,232,222)); P2.paste(pc,(8,8)); dd=ImageDraw.Draw(P2); dd.text((16,150),'Gruß aus Rimini',font=F(DJS,18),fill=(245,240,230))
    paste_rot(B,P2,390,300,5)
    # Stundenplan
    S=Image.new('RGB',(280,230),(244,244,236)); s=ImageDraw.Draw(S); s.text((10,6),'Stundenplan 9b',font=F(DJ,22),fill=(30,30,30))
    days=['Mo','Di','Mi','Do','Fr']; sub=[['De','Ma','En','Bio','Sp'],['Ma','Ge','Ku','De','En'],['Ph','De','Ma','Ek','Mu'],['En','Ch','De','Ma','Re'],['Sp','Sp','Bio','En','De']]
    for i,dn in enumerate(days):
        s.text((14+i*52,40),dn,font=F(DJC,18),fill=(30,30,120))
        for j in range(5): s.rectangle([10+i*52,64+j*32,58+i*52,94+j*32],outline=(150,150,160)); s.text((16+i*52,70+j*32),sub[i][j],font=F(KAL,22),fill=(30,30,30))
    paste_rot(B,S,690,300,-2)
    # Aufkleber
    K=Image.new('RGBA',(150,150),(0,0,0,0)); k=ImageDraw.Draw(K); k.ellipse([4,4,146,146],fill=(230,190,40),outline=(160,40,30),width=6); k.text((24,46),'ATOM-',font=F(DJ,26),fill=(160,40,30)); k.text((22,76),'KRAFT?',font=F(DJ,26),fill=(160,40,30)); k.text((22,108),'NEIN.',font=F(DJ,20),fill=(90,30,20))
    paste_rot(B,K,620,520,-12)
    d=ImageDraw.Draw(B)
    for (x,y,c) in [(170,70,(200,40,40)),(430,98,(40,120,200)),(760,80,(230,200,40)),(212,340,(40,160,60)),(520,306,(200,40,40)),(830,306,(40,120,200))]: pin(d,x,y,c)
    a=np.asarray(B.convert('RGB'),float); v=noise(H,W,300,2); a*=(0.85+0.2*v[...,None]); im=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
    im.save(OUT+'src/sz_pinboard.png'); im.save(OUT+'sz_pinboard.jpg',quality=88)
# ---------- 3) Wandkalender Oktober 1989 (Datum stimmt: 1.10.1989 = Sonntag) ----------
def kalender():
    W,H=512,768; C=Image.new('RGB',(W,H),(238,234,222)); d=ImageDraw.Draw(C)
    ph=snap('harz',472,300,pol=False); C.paste(ph,(20,20))
    d.text((20,334),'OKTOBER',font=F(DJ,44),fill=(150,30,30)); d.text((330,340),'1989',font=F(DJ,38),fill=(40,40,40))
    hd=['Mo','Di','Mi','Do','Fr','Sa','So']
    for i,h in enumerate(hd): d.text((28+i*66,400),h,font=F(DJC,22),fill=(150,30,30) if i==6 else (60,60,60))
    for w,wk in enumerate(calendar.Calendar(0).monthdayscalendar(1989,10)):
        for i,day in enumerate(wk):
            if day: d.text((30+i*66,436+w*48),'%2d'%day,font=F(DJC,26),fill=(150,30,30) if i==6 else (30,30,30))
    # Kringel am 14. (Konzert) und Kreuze bis zum 20.
    import itertools
    for w,wk in enumerate(calendar.Calendar(0).monthdayscalendar(1989,10)):
        for i,day in enumerate(wk):
            x,y=30+i*66,436+w*48
            if day and day<20: d.line([(x-4,y+2),(x+36,y+30)],fill=(40,60,150),width=3); d.line([(x+36,y+2),(x-4,y+30)],fill=(40,60,150),width=3)
            if day==14: d.ellipse([x-12,y-8,x+50,y+38],outline=(200,40,40),width=4)
    d.text((24,H-48),'Kreissparkasse Zeitschleife · Ihr Partner seit 1889',font=F(DJC,17),fill=(80,80,80))
    a=np.asarray(C,float); v=noise(H,W,200,2); a*=(0.88+0.14*v[...,None]); a[...,2]*=0.93; im=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
    im.save(OUT+'src/sz_kalender.png'); im.save(OUT+'sz_kalender.jpg',quality=88)
# ---------- 4) Hinterhof-Blick heller (Dämmerung statt Schwarz), Original bleibt in src ----------
def hof():
    src=OUT+'src/sz_hinterhof_orig.jpg'
    if not os.path.exists(src): Image.open(V3+'/sky/backdrop/sz_hinterhof.jpg').save(src,quality=95)
    a=np.asarray(Image.open(src).convert('RGB'),float)/255; a=a**0.66; a=a*0.94+np.array([0.02,0.025,0.04])
    Image.fromarray(np.clip(a*255,0,255).astype(np.uint8)).save(V3+'/sky/backdrop/sz_hinterhof.jpg',quality=88)
def pnoise(n,sigma):
    # nahtlos kachelbares Rauschen (Tiefpass im Frequenzraum)
    w=rng.standard_normal((n,n)); f=np.fft.fftfreq(n); fx,fy=np.meshgrid(f,f); g=np.exp(-(fx**2+fy**2)*(sigma**2)*2*math.pi**2)
    r=np.real(np.fft.ifft2(np.fft.fft2(w)*g)); r=(r-r.min())/(r.max()-r.min()); return r
def tapete(N=1024):
    # 1 Kachel = 1 m: Cremegrund, Papierfaser, Streifen (Periode 25 cm) mit kleinem Rauten-/Blütenmotiv (Periode 12,5 cm), leicht vergilbt
    y,x=np.mgrid[0:N,0:N].astype(float); base=np.array([214,200,172],float)
    fib=pnoise(N,1.2); mid=pnoise(N,14); low=pnoise(N,90)
    c=base*(0.92+0.08*fib[...,None])*(0.96+0.05*mid[...,None])*(0.95+0.06*low[...,None])
    P=256; u=(x%P)/P
    band=np.exp(-((u-0.5)/0.12)**2)                      # breiter, weicher Streifen
    thin=np.exp(-((np.minimum(abs(u-0.36),abs(u-0.64)))/0.006)**2)  # zwei feine Linien
    c=c*(1-0.1*band[...,None])+np.array([200,160,130])*0.04*band[...,None]+np.array([150,110,90])*0.0
    c=c*(1-0.28*thin[...,None])+np.array([120,80,60])*0.28*thin[...,None]
    # Motiv: kleine Rauten-Blüte in Streifenmitte
    vy=(y%128)/128; dx=abs(u-0.5)*P/18; dy=abs(vy-0.5)*128/18
    dia=np.clip(1-(dx+dy),0,1); dot=np.exp(-((dx**2+dy**2)/0.08)); petal=np.clip(1-abs(dx+dy-0.75)*6,0,1)
    mot=np.clip(petal*0.8+dot,0,1)
    col=np.array([150,92,72]); c=c*(1-0.7*mot[...,None])+col*0.7*mot[...,None]
    leaf=np.exp(-(((u-0.5)*P)**2/8 + ((((y+64)%128)/128-0.5)*128)**2/120)); c=c*(1-0.35*leaf[...,None])+np.array([110,120,80])*0.35*leaf[...,None]
    im=Image.fromarray(np.clip(c,0,255).astype(np.uint8)); im.save(OUT+'src/sz_tapete.png'); im.save(OUT+'sz_tapete.jpg',quality=90)
def hofoben(W=1024,H=512):
    # Ergänzung über dem Hof-Foto (oberer Fensterteil): obere Etagen des Hinterhauses mit ein paar warmen Fenstern, Dachkante, Schornsteine, Stadtnachthimmel
    y,x=np.mgrid[0:H,0:W].astype(float); v=1-y/H; roof=0.33+0.006*np.sin(x/W*7)
    sky=np.array([20,24,36])*(v[...,None])+np.array([52,44,46])*(1-v[...,None]); cl=pnoise(1024,40)[:H,:W]; sky=sky*(0.9+0.2*cl[...,None])
    fac=np.array([30,31,30])*(0.85+0.25*pnoise(1024,6)[:H,:W][...,None])*(0.9+0.15*pnoise(1024,60)[:H,:W][...,None])
    c=np.where((v<roof)[...,None],fac,sky)
    im=Image.fromarray(np.clip(c,0,255).astype(np.uint8)); d=ImageDraw.Draw(im)
    rt=int(H*(1-0.33)); d.rectangle([0,rt-6,W,rt+4],fill=(18,18,20)); d.rectangle([0,rt+4,W,rt+10],fill=(40,38,36))  # Dachrinne
    for cx in (140,470,800): d.rectangle([cx,rt-58,cx+34,rt-6],fill=(16,16,18)); d.rectangle([cx-4,rt-64,cx+38,rt-56],fill=(22,22,24))
    random.seed(7)
    for row in range(2):
        for col in range(8):
            x0=40+col*125; y0=rt+40+row*95; lit=(row,col) in [(0,2),(1,5),(1,1)]; tv=(row,col)==(0,6)
            g=(150,102,56) if lit else ((48,60,92) if tv else (14,16,20)); d.rectangle([x0-6,y0-6,x0+56,y0+76],fill=(40,40,38)); d.rectangle([x0,y0,x0+50,y0+70],fill=g)
            if lit: d.rectangle([x0,y0,x0+16,y0+70],fill=(104,64,36)); d.rectangle([x0+34,y0,x0+50,y0+70],fill=(104,64,36))
            d.line([(x0+25,y0),(x0+25,y0+70)],fill=(30,26,22),width=3); d.line([(x0,y0+30),(x0+50,y0+30)],fill=(30,26,22),width=3)
    im=im.filter(ImageFilter.GaussianBlur(2.2)); a=np.asarray(im,float)*(0.92+0.16*rng.random((H,W,1))); im=Image.fromarray(np.clip(a,0,255).astype(np.uint8)); im.save(OUT+'src/sz_hof_oben.png'); im.save(OUT+'sz_hof_oben.jpg',quality=88)
def vorhang(W=512,H=1024):
    # Übergardine 80er: Rost/Ocker, grobes Gewebe, feine Längsstreifen, Kreis-Bordüre unten, Saum + Kräuselband; horizontal nahtlos (repeat 2 auf 0,5 m)
    y,x=np.mgrid[0:H,0:W].astype(float); base=np.array([128,74,40],float)
    wv=(np.sin(x*math.pi/2)*np.sin(y*math.pi/2))*0.5+0.5; fib=pnoise(1024,1.5)[:H,:W]
    c=base*(0.86+0.1*wv[...,None]+0.08*fib[...,None])
    st=np.exp(-(((x%128)-64)/5)**2); c=c*(1-0.12*st[...,None])+np.array([170,120,60])*0.12*st[...,None]
    by=H*0.82; ring=np.abs(np.hypot((x%128)-64,y-by)-34)<5; c[ring]=c[ring]*0.55+np.array([190,140,70])*0.45
    band=(np.abs(y-by+52)<3)|(np.abs(y-by-52)<3); c[band]=c[band]*0.5+np.array([180,130,64])*0.5
    c[y>H*0.97]*=0.8; c[y<H*0.03]=c[y<H*0.03]*0.6+np.array([200,190,170])*0.4
    low=pnoise(1024,80)[:H,:W]; c*=(0.92+0.12*low[...,None])
    im=Image.fromarray(np.clip(c,0,255).astype(np.uint8)); im.save(OUT+'src/sz_vorhang.png'); im.save(OUT+'sz_vorhang.jpg',quality=88)
import sys
which=sys.argv[1].split(',') if len(sys.argv)>1 else ['rug','pinboard','kalender','hof','tapete']
for w in which: globals()[{'rug':'rug','pinboard':'pinboard','kalender':'kalender','hof':'hof','tapete':'tapete','hofoben':'hofoben','vorhang':'vorhang'}[w]]()
print('ok')
