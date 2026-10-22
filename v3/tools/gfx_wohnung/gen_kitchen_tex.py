# Küchen-Texturen (PIL/numpy, Text per Code – keine KI-Schrift): Fliesenspiegel (15er, beige/braun mit Dekor), Bodenfliesen, Raufaser,
# Wachstuch, Eckbank-Stoff, Wandkalender Okt. 1989, Etiketten (alles Parodien, keine echten Marken) für build_kitchen_props.py.
# python3 gen_kitchen_tex.py [teil,…]  → assets/apartment/kitchen/*.jpg (+ src/, src/lbl/*.png)
import numpy as np, math, random, calendar, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
V3=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..')); OUT=V3+'/assets/apartment/kitchen/'; LB=OUT+'src/lbl/'; os.makedirs(LB,exist_ok=True)
GF='/usr/share/fonts/truetype/sand-box/google/'
FN={'slab':GF+'Alfa Slab One/AlfaSlabOne-Regular.ttf','bree':GF+'Bree Serif/BreeSerif-Regular.ttf','lob':GF+'Lobster/Lobster-Regular.ttf','anton':GF+'Anton/Anton-Regular.ttf',
    'blk':GF+'Archivo Black/ArchivoBlack-Regular.ttf','titan':GF+'Titan One/TitanOne-Regular.ttf','frak':GF+'UnifrakturMaguntia/UnifrakturMaguntia-Regular.ttf','ser':GF+'PT Serif/PTSerif-Bold.ttf',
    'serr':GF+'PT Serif/PTSerif-Regular.ttf','cond':GF+'Barlow Condensed/BarlowCondensed-Bold.ttf','condr':GF+'Barlow Condensed/BarlowCondensed-Medium.ttf','kal':V3+'/fonts/Kalam-Regular.ttf',
    'kalb':GF+'Kalam/Kalam-Bold.ttf','dj':'/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','pac':GF+'Pacifico/Pacifico-Regular.ttf','righ':GF+'Righteous/Righteous-Regular.ttf'}
F=lambda n,s: ImageFont.truetype(FN[n],s)
rng=np.random.default_rng(1989); random.seed(1989)
def noise(h,w,sc,oc=4,seed=None):
    r=np.random.default_rng(seed) if seed is not None else rng; a=np.zeros((h,w))
    for o in range(oc):
        s=max(2,int(sc/(2**o))); n=r.random((h//s+3,w//s+3)); im=Image.fromarray((n*255).astype(np.uint8)).resize(((w//s+3)*s,(h//s+3)*s),Image.BICUBIC)
        a+=np.asarray(im,dtype=float)[:h,:w]/255/(2**o)
    a-=a.min(); return a/a.max()
def tnoise(N,sc,oc=4,seed=0):  # kachelbares Rauschen (periodisch über FFT-freie Mittelung der 4 Verschiebungen)
    a=noise(N*2,N*2,sc,oc,seed); t=a[:N,:N]; y,x=np.mgrid[0:N,0:N]/N; wx=np.sin(np.pi*x)**2; wy=np.sin(np.pi*y)**2
    b=a[:N,N//2:N//2+N] if False else np.roll(t,N//2,1); c=np.roll(t,N//2,0); d=np.roll(c,N//2,1)
    return (t*wx*wy+b*(1-wx)*wy+c*wx*(1-wy)+d*(1-wx)*(1-wy))
def save(im,name,q=88,src=True):
    if src: im.save(OUT+'src/'+name+'.png')
    im.convert('RGB').save(OUT+name+'.jpg',quality=q)
def nmap(h,k=2.0):
    gy,gx=np.gradient(h); n=np.dstack([-gx*k,-gy*k,np.ones_like(h)]); n/=np.linalg.norm(n,axis=2,keepdims=True); return Image.fromarray(((n*0.5+0.5)*255).astype(np.uint8))
# ---------- Dekor-Motiv (braune Ähre/Blüte, 80er Siebdruck) ----------
def motif(d,x0,y0,s,col):
    # 80er Dekorfliese: Siebdruck-Blüte mit 8 Blättern (Umriss) + zwei Blattranken, braun auf beige
    cx,cy=x0+s/2,y0+s/2; w=max(2,int(s*0.03))
    for k in range(8):
        a=k*math.pi/4; ox,oy=cx+math.cos(a)*s*0.2,cy+math.sin(a)*s*0.2; ca,sa=math.cos(a),math.sin(a)
        pts=[(ox+ca*s*0.12*math.cos(t)-sa*s*0.045*math.sin(t),oy+sa*s*0.12*math.cos(t)+ca*s*0.045*math.sin(t)) for t in np.linspace(0,2*math.pi,25)]
        d.polygon(pts,fill=(178,120,72) if k%2 else None,outline=col,width=w)
    d.ellipse([cx-s*0.07,cy-s*0.07,cx+s*0.07,cy+s*0.07],outline=col,width=w); d.ellipse([cx-s*0.025,cy-s*0.025,cx+s*0.025,cy+s*0.025],fill=col)
    for sg in (-1,1):
        pts=[(cx+sg*s*(0.3+0.12*t),cy+s*(0.34-0.5*t)+sg*0) for t in np.linspace(0,1,8)]
        for (px,py) in pts[1::2]: d.ellipse([px-s*0.03,py-s*0.015,px+s*0.03,py+s*0.015],outline=col,width=max(1,w-1))
    d.rectangle([x0+s*0.06,y0+s*0.06,x0+s*0.94,y0+s*0.94],outline=col,width=max(1,w-1))
# ---------- 1) Fliesenspiegel: 8×4 Fliesen à 15 cm (1,2 × 0,6 m) → 1024×512, kachelbar ----------
def fliesen():
    W,H,n=1024,512,128; base=np.zeros((H,W,3)); hgt=np.zeros((H,W))
    glaze=tnoise(1024,90,4,7)[:H]; spots=tnoise(1024,12,2,8)[:H]
    rnd=random.Random(15)
    C=Image.new('RGB',(W,H)); d=ImageDraw.Draw(C)
    for j in range(4):
        for i in range(8):
            t=rnd.uniform(-1,1); c=(int(214+8*t),int(200+7*t),int(168+6*t)); d.rectangle([i*n,j*n,i*n+n-1,j*n+n-1],fill=c)
            if (i*3+j*5)%7==2: motif(d,i*n+8,j*n+6,n-16,(118,72,40))
    a=np.asarray(C,float)
    yy,xx=np.mgrid[0:H,0:W]; fx=(xx%n)/n; fy=(yy%n)/n; e=np.minimum.reduce([fx,1-fx,fy,1-fy])*n   # Abstand zur Fuge (px)
    fu=np.clip((e-2.2)/1.2,0,1)          # 0 = Fuge
    bev=np.clip(e/7,0,1)**0.5            # Kantenrundung
    a*=(0.94+0.08*glaze[...,None])*(0.92+0.08*bev[...,None])
    grout=np.array([150,138,118])*(0.8+0.3*spots[...,None]); grout*=0.9
    a=a*fu[...,None]+grout*(1-fu[...,None])
    # Fett/Vergilbung nach unten (Arbeitsplatte) und Staub in den Fugen
    a*=(1-0.08*(yy/H))[...,None]; a[...,2]*=0.97
    save(Image.fromarray(np.clip(a,0,255).astype(np.uint8)),'kue_fliesen')
    hgt=bev*fu*0.8+glaze*0.05; nmap(cv2_blur(hgt,1.0),3.0).save(OUT+'kue_fliesen_n.jpg',quality=90)
def cv2_blur(a,s):
    import cv2; return cv2.GaussianBlur(a.astype(np.float32),(0,0),s)
# ---------- 2) Bodenfliesen 8×8 à 21,25 cm (1,7 m = UV-Kachel von mmk) → 2048², braun-beige meliert ----------
def boden():
    N=2048; n=N//8; rnd=random.Random(30)
    a=np.zeros((N,N,3)); mel=tnoise(N,60,5,11); fine=tnoise(N,6,2,12); big=tnoise(N,700,2,13)
    yy,xx=np.mgrid[0:N,0:N]; tile=(yy//n)*8+(xx//n)
    tones=np.array([[rnd.uniform(-1,1) for _ in range(64)]])[0]
    base=np.array([132,104,78],float)
    t=tones[tile]; a[:]=base; a*=(1+0.06*t)[...,None]
    a*=(0.82+0.3*mel[...,None]); a*=(0.93+0.1*fine[...,None]); a[...,0]*=1.02
    fx=(xx%n)/n; fy=(yy%n)/n; e=np.minimum.reduce([fx,1-fx,fy,1-fy])*n; fu=np.clip((e-3)/2,0,1); bev=np.clip(e/10,0,1)**0.5
    grout=np.array([70,62,54])*(0.85+0.3*fine[...,None])
    a=a*fu[...,None]+grout*(1-fu[...,None]); a*=(0.9+0.1*bev[...,None]); a*=(0.9+0.14*big[...,None])
    # Laufspuren: matter/heller (kommt in der Lightmap-Geometrie nicht vor) – nur leichte Abnutzung
    save(Image.fromarray(np.clip(a,0,255).astype(np.uint8)),'kue_boden',q=86)
    h=bev*fu+mel*0.06+fine*0.03; nmap(cv2_blur(h,1.2),2.2).save(OUT+'kue_boden_n.jpg',quality=88)
    r=np.clip(0.55+0.25*(1-fu)+0.15*(1-mel),0,1); Image.fromarray((r*255).astype(np.uint8)).save(OUT+'kue_boden_r.jpg',quality=88)
# ---------- 3) Raufaser (gestrichen) 1024² = 1,2 m (mmk-UV wuv 1.2), Graustufen → Farbe kommt vom Material ----------
def raufaser():
    N=1024; h=np.zeros((N,N)); r=np.random.default_rng(5)
    for k in range(26000):
        x,y=r.integers(0,N,2); s=r.uniform(0.8,2.8); h[y,x]+=s
    import cv2
    h=cv2.GaussianBlur(h,(0,0),1.3); h=h/h.max(); h=np.clip(h*2.2,0,1)
    h=cv2.GaussianBlur(np.tile(h,(3,3)),(0,0),0.8)[N:2*N,N:2*N]
    col=0.86+0.1*h-0.05*tnoise(N,200,3,21)
    save(Image.fromarray((np.clip(col,0,1)*255).astype(np.uint8)),'kue_raufaser',q=88)
    nmap(h,6.0).save(OUT+'kue_raufaser_n.jpg',quality=88)
# ---------- 4) Wachstuch (orange-braune Blumen auf Beige) 1024², Eckbank-Polster (Cord-Streifen) 512² ----------
def wachstuch():
    N=1024; C=Image.new('RGB',(N,N),(222,206,168)); d=ImageDraw.Draw(C); rnd=random.Random(4)
    for j in range(4):
        for i in range(4):
            cx,cy=i*256+128+(j%2)*128,j*256+128
            for dx in (-N,0,N):
                for dy in (-N,0,N):
                    x,y=cx+dx,cy+dy
                    for k in range(6):
                        a=k*math.pi/3; d.ellipse([x+math.cos(a)*38-26,y+math.sin(a)*38-26,x+math.cos(a)*38+26,y+math.sin(a)*38+26],fill=(196,96,38))
                    d.ellipse([x-22,y-22,x+22,y+22],fill=(120,62,30)); d.ellipse([x-9,y-9,x+9,y+9],fill=(230,170,70))
                    for k in range(2):
                        a=0.6+k*math.pi; d.ellipse([x+math.cos(a)*95-30,y+math.sin(a)*95-12,x+math.cos(a)*95+30,y+math.sin(a)*95+12],fill=(104,110,52))
    a=np.asarray(C,float)*(0.92+0.1*tnoise(N,40,3,31)[...,None]); save(Image.fromarray(np.clip(a,0,255).astype(np.uint8)),'kue_wachstuch',src=True)
    N=512; yy,xx=np.mgrid[0:N,0:N]; st=((xx//64)%3); pal=np.array([[120,78,44],[150,108,62],[96,62,38]],float); a=pal[st]
    a*=(0.82+0.18*(np.sin(xx/2.2)*0.5+0.5))[...,None]*(0.92+0.1*tnoise(N,10,2,32)[...,None]); Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(LB+'polster.png')
# ---------- 5) Wandkalender Okt. 1989 (Fahrschule, Einträge per Kalam) ----------
def kalender():
    W,H=512,768; C=Image.new('RGB',(W,H),(236,231,216)); d=ImageDraw.Draw(C)
    d.rectangle([0,0,W,150],fill=(28,70,128)); d.text((22,14),'Fahrschule',font=F('lob',44),fill=(250,214,60)); d.text((22,66),'BLINKER',font=F('anton',62),fill=(255,255,255))
    d.text((300,30),'seit 1972',font=F('condr',28),fill=(220,230,240)); d.text((300,70),'Ruf 23 05 89',font=F('condr',28),fill=(220,230,240)); d.text((300,104),'Kl. 1 · 3 · 4',font=F('condr',28),fill=(220,230,240))
    d.text((22,170),'OKTOBER',font=F('anton',56),fill=(160,30,30)); d.text((360,176),'1989',font=F('anton',50),fill=(40,40,40))
    hd=['Mo','Di','Mi','Do','Fr','Sa','So']; X0,Y0,CW,RH=22,260,67,78
    for i,h in enumerate(hd): d.text((X0+i*CW+6,Y0),h,font=F('cond',24),fill=(160,30,30) if i==6 else (60,60,60))
    weeks=calendar.Calendar(0).monthdayscalendar(1989,10)
    for w,wk in enumerate(weeks):
        for i,day in enumerate(wk):
            x,y=X0+i*CW,Y0+34+w*RH; d.rectangle([x,y,x+CW-4,y+RH-6],outline=(170,160,140),width=1)
            if day: d.text((x+5,y+2),str(day),font=F('cond',26),fill=(160,30,30) if i==6 else (30,30,30))
    notes={3:'Müll!',9:'Oma 70',12:'Zahnarzt',17:'Müll!',20:'Elternab.',24:'Sperrmüll',31:'Müll!'}
    for w,wk in enumerate(weeks):
        for i,day in enumerate(wk):
            x,y=X0+i*CW,Y0+34+w*RH
            if day in notes: d.text((x+4,y+34),notes[day],font=F('kal',19),fill=(30,40,120))
            if day and day<20: d.line([(x+6,y+8),(x+CW-12,y+RH-14)],fill=(40,50,130),width=3)
    d.text((22,H-40),'Sicher ankommen – mit Blinker. Auch rückwärts.',font=F('condr',22),fill=(80,80,80))
    a=np.asarray(C,float); v=noise(H,W,200,2); a*=(0.9+0.12*v[...,None]); a[...,2]*=0.94
    save(Image.fromarray(np.clip(a,0,255).astype(np.uint8)),'kue_kalender')
# ---------- 6) Etiketten (alles erfundene Parodien) ----------
def grain(im,k=0.08,seed=1):
    a=np.asarray(im.convert('RGB'),float); h,w=a.shape[:2]; a*=(1-k/2+k*noise(h,w,max(8,w//6),3,seed)[...,None]); return Image.fromarray(np.clip(a,0,255).astype(np.uint8))
def ctext(d,cx,y,t,f,fill,anchor='mt'): d.text((cx,y),t,font=f,fill=fill,anchor=anchor)
def fit(d,t,font,size,maxw):
    while size>8 and d.textlength(t,font=F(font,size))>maxw: size-=1
    return F(font,size)
def labels():
    # Cornflakes-Schachtel: Front 380×560 (19×28 cm), Seite 140×560
    im=Image.new('RGB',(380,560),(238,176,40)); d=ImageDraw.Draw(im)
    d.rectangle([0,0,380,120],fill=(196,40,32)); ctext(d,190,14,'Morgenstund',F('lob',52),(255,240,200)); ctext(d,190,82,'seit 1923',F('condr',26),(255,230,180))
    ctext(d,190,140,'KNUSPER-',F('titan',58),(120,40,20)); ctext(d,190,206,'SCHLEIFEN',F('titan',56),(120,40,20))
    d.ellipse([60,330,320,470],fill=(240,240,236)); d.ellipse([74,338,306,430],fill=(250,250,248))
    for k in range(40):
        x,y=random.uniform(100,280),random.uniform(345,420); d.ellipse([x-14,y-6,x+14,y+6],fill=(222,160,60),outline=(170,100,30))
    d.ellipse([60,330,320,400],outline=(200,200,196),width=3)
    ctext(d,190,282,'immer wieder knusprig!',F('kalb',30),(150,30,20))
    d.rectangle([0,500,380,560],fill=(196,40,32)); ctext(d,190,512,'375 g  ·  mit 8 Vitaminen',F('condr',30),(255,240,210))
    grain(im).save(LB+'flakes_f.png')
    im=Image.new('RGB',(140,560),(238,176,40)); d=ImageDraw.Draw(im); d.rectangle([0,0,140,120],fill=(196,40,32))
    for k,t in enumerate(['Nährwerte','pro 100 g','Brennwert','1550 kJ','Eiweiß 7 g','Kohlenhydr.','84 g','Fett 0,9 g']): ctext(d,70,150+k*34,t,F('condr',22),(90,30,10))
    grain(im,seed=2).save(LB+'flakes_s.png')
    # Kaffee-Vakuumpack 180×300 Front, Seite 120×300
    im=Image.new('RGB',(180,300),(122,26,24)); d=ImageDraw.Draw(im)
    d.rectangle([10,10,170,290],outline=(214,170,80),width=3); ctext(d,90,28,'Jakobs',F('lob',40),(232,196,110)); ctext(d,90,84,'KRÜMUNG',fit(d,'KRÜMUNG','anton',40,160),(240,214,140))
    d.ellipse([50,140,130,220],outline=(214,170,80),width=3); ctext(d,90,162,'J',F('frak',46),(214,170,80)); ctext(d,90,236,'gemahlen · 500 g',F('condr',20),(232,200,150)); ctext(d,90,262,'Der Verwöhnte.',F('kal',18),(232,200,150))
    grain(im,seed=3).save(LB+'kaffee_f.png'); Image.new('RGB',(120,300),(110,24,22)).save(LB+'kaffee_s.png')
    # Dose Eintopf: Banderole 470×220 (Umfang 2π·3,7 cm × 11 cm, 2:1 gestreckt)
    im=Image.new('RGB',(470,220),(232,214,160)); d=ImageDraw.Draw(im); d.rectangle([0,0,470,40],fill=(30,92,52)); d.rectangle([0,180,470,220],fill=(30,92,52))
    for off in (0,235):
        ctext(d,off+117,46,'ERASKO',F('slab',34),(170,30,26)); ctext(d,off+117,92,'Erbsen-Eintopf',F('bree',26),(40,40,30)); ctext(d,off+117,126,'„Ewig gleich“',F('kalb',28),(30,92,52))
    ctext(d,235,188,'800 g · mit Würstchen · 1,79 DM',F('condr',20),(240,230,200)); grain(im,seed=4).save(LB+'dose_eintopf.png')
    im=Image.new('RGB',(470,220),(212,226,236)); d=ImageDraw.Draw(im); d.rectangle([0,0,470,220],outline=(30,60,140),width=10)
    for off in (0,235):
        ctext(d,off+117,22,'Bärenmacke',F('lob',40),(30,60,140)); d.ellipse([off+82,82,off+152,152],fill=(160,110,60)); d.ellipse([off+90,70,off+108,90],fill=(160,110,60)); d.ellipse([off+126,70,off+144,90],fill=(160,110,60))
        ctext(d,off+117,160,'Kondensmilch 7,5 %',F('condr',22),(30,60,140))
    grain(im,seed=5).save(LB+'dose_milch.png')
    # Spülmittel-Flasche: Etikett 300×260 (Umfang ~0,25 m)
    im=Image.new('RGB',(300,260),(250,240,90)); d=ImageDraw.Draw(im); d.ellipse([20,30,280,230],fill=(40,140,70)); ctext(d,150,60,'PRALL',F('titan',62),(255,250,220)); ctext(d,150,140,'Zitrone',F('lob',34),(250,240,90)); ctext(d,150,190,'fettlöst in Sekunden',F('condr',22),(255,250,220))
    grain(im,seed=6).save(LB+'spueli.png')
    # Würze-Flasche 260×200
    im=Image.new('RGB',(260,200),(240,196,40)); d=ImageDraw.Draw(im); d.rectangle([0,60,260,140],fill=(170,30,26)); ctext(d,130,66,'MOGGI',F('slab',52),(250,210,60)); ctext(d,130,16,'Würze',F('bree',30),(120,20,16)); ctext(d,130,150,'seit 1886 · 250 ml',F('condr',22),(120,20,16))
    grain(im,seed=7).save(LB+'wuerze.png')
    # Milchtüte 140×380 je Seite
    im=Image.new('RGB',(140,380),(244,244,238)); d=ImageDraw.Draw(im); d.rectangle([0,0,140,80],fill=(40,90,170)); ctext(d,70,14,'Frische',F('lob',30),(255,255,255))
    ctext(d,70,96,'ZEITLOS',fit(d,'ZEITLOS','anton',34,128),(40,90,170)); ctext(d,70,150,'Vollmilch',F('bree',22),(40,40,40)); ctext(d,70,180,'3,5 % Fett',F('condr',22),(40,40,40))
    d.polygon([(10,260),(50,220),(90,250),(130,210),(130,380),(10,380)],fill=(80,150,70)); d.ellipse([70,280,110,310],fill=(255,255,255)); d.ellipse([30,300,70,330],fill=(240,240,240))
    ctext(d,70,345,'1 Liter',F('cond',24),(255,255,255)); grain(im,seed=8).save(LB+'milch.png')
    # Zeitung (gefaltet, obere Hälfte) 720×500 = 36×25 cm
    im=Image.new('RGB',(720,500),(226,222,208)); d=ImageDraw.Draw(im); d.rectangle([20,16,300,120],fill=(200,26,24)); ctext(d,160,24,'BLÖD',F('anton',84),(255,255,255))
    d.text((320,22),'Freitag, 20. Oktober 1989',font=F('condr',24),fill=(40,40,40)); d.text((320,52),'Nr. 244 · 60 Pf',font=F('condr',24),fill=(40,40,40))
    d.text((20,138),'UFO über Wanne-Eickel?',font=fit(d,'UFO über Wanne-Eickel?','anton',62,680),fill=(20,20,20))
    d.text((20,214),'Rentner (71): „Es war wie gestern – nur nochmal!“',font=fit(d,'Rentner (71): „Es war wie gestern – nur nochmal!“','ser',30,680),fill=(170,24,22))
    ph=(noise(200,260,30,4,9)*120+40).astype(np.uint8); im.paste(Image.fromarray(ph).convert('RGB').filter(ImageFilter.GaussianBlur(1.2)),(20,262)); d.ellipse([150,300,200,330],fill=(230,230,220))
    for c in range(2):
        for r in range(11): x=300+c*210; d.rectangle([x,268+r*20,x+190-(r%4==3)*60,276+r*20],fill=(120,118,110))
    d.text((300,236),'Seite 3: Die Uhr im Flur geht wieder rückwärts',font=F('condr',20),fill=(40,40,40)); grain(im,0.06,seed=10).save(LB+'zeitung.png')
    # Flyer Pizza + Videothek (am Kühlschrank) 300×420 je
    im=Image.new('RGB',(300,420),(250,236,200)); d=ImageDraw.Draw(im); d.rectangle([0,0,300,96],fill=(30,120,60)); ctext(d,150,8,'Pizza-Taxi',F('lob',40),(255,255,255)); ctext(d,150,58,'TONI',F('anton',30),(255,220,80))
    d.ellipse([60,110,240,290],fill=(220,150,60)); d.ellipse([72,122,228,278],fill=(200,50,30))
    for k in range(9): x,y=random.uniform(95,205),random.uniform(145,255); d.ellipse([x-12,y-12,x+12,y+12],fill=(170,40,40))
    ctext(d,150,300,'2 Pizzen nur 14,90 DM',F('cond',30),(180,30,20)); ctext(d,150,340,'Ruf an: 31 41 59',F('cond',30),(30,30,30)); ctext(d,150,380,'Wir liefern bis 23 Uhr',F('condr',22),(60,60,60))
    grain(im,0.07,seed=11).save(LB+'flyer_pizza.png')
    im=Image.new('RGB',(300,420),(24,22,40)); d=ImageDraw.Draw(im); ctext(d,150,16,'Videothek',F('righ',36),(250,200,60)); ctext(d,150,58,'ZEITSPRUNG',fit(d,'ZEITSPRUNG','anton',48,280),(240,60,120))
    d.rectangle([40,130,260,300],outline=(250,200,60),width=3); ctext(d,150,150,'NEU:',F('cond',30),(255,255,255)); ctext(d,150,192,'Zurück in die',F('bree',30),(255,255,255)); ctext(d,150,232,'Gegenwart',F('bree',36),(250,200,60))
    ctext(d,150,320,'Mo–Sa 10–22 Uhr',F('condr',28),(220,220,230)); ctext(d,150,356,'Mitgliedschaft frei!',F('condr',24),(220,220,230)); ctext(d,150,388,'FSK 18 im Nebenraum',F('condr',18),(150,150,170))
    grain(im,0.07,seed=12).save(LB+'flyer_video.png')
    # Radio-Front 480×280 (24×14 cm): Lautsprecher links, Skala rechts
    im=Image.new('RGB',(480,280),(40,36,32)); d=ImageDraw.Draw(im)
    for y in range(30,250,8):
        for x in range(24,214,8): d.ellipse([x,y,x+4,y+4],fill=(16,14,12))
    d.rectangle([230,30,460,140],fill=(214,200,160)); d.rectangle([230,30,460,140],outline=(150,140,110),width=2)
    for k,(lab,vals) in enumerate([('UKW',['88','92','96','100','104','108']),('MW',['530','700','900','1200','1600'])]):
        y=48+k*44; d.text((236,y),lab,font=F('cond',18),fill=(160,30,30))
        for i,v in enumerate(vals): d.text((280+i*(170/len(vals)),y),v,font=F('condr',16),fill=(40,40,40))
        d.line([(280,y+24),(452,y+24)],fill=(60,60,60),width=1)
    d.line([(352,34),(352,136)],fill=(200,30,20),width=3)
    ctext(d,345,160,'GRUNDLOS',F('blk',30),(210,200,170)); ctext(d,345,198,'Weltempfänger 4000',F('condr',20),(170,160,140))
    for i in range(4): d.rectangle([240+i*56,232,284+i*56,256],fill=(70,66,60),outline=(20,20,20))
    grain(im,0.05,seed=13).save(LB+'radio.png')
    # Brotkasten-Schrift 400×120
    im=Image.new('RGB',(400,120),(214,196,150)); d=ImageDraw.Draw(im); ctext(d,200,6,'Brot',F('frak',92),(92,54,30)); grain(im,0.06,seed=14).save(LB+'brot.png')
    # Sprudelkiste Seite 400×300
    im=Image.new('RGB',(400,300),(40,110,170)); d=ImageDraw.Draw(im); d.rectangle([70,90,330,210],fill=(250,250,250)); ctext(d,200,98,'Spruddel',F('lob',50),(40,110,170)); ctext(d,200,168,'QUELLE · 12 × 0,7 l',F('cond',24),(40,110,170))
    grain(im,0.05,seed=15).save(LB+'kiste.png')
    # Gewürzdosen-Etiketten 120×80 ×4
    for k,t in enumerate(['Paprika','Pfeffer','Muskat','Zimt']):
        im=Image.new('RGB',(160,90),(240,232,210)); d=ImageDraw.Draw(im); d.rectangle([4,4,156,86],outline=(120,40,30),width=3); ctext(d,80,22,t,F('bree',30),(120,40,30)); grain(im,0.05,seed=20+k).save(LB+'gewuerz%d.png'%k)
    # Postkarte am Kühlschrank 300×200 (Gruß aus Rimini – Bild + Schrift)
    im=Image.new('RGB',(300,200)); a=np.zeros((200,300,3)); yy=np.arange(200)[:,None]/200; a[...,0]=60+120*yy; a[...,1]=120+60*yy; a[...,2]=200-40*yy; a[120:]=[[[214,190,140]]]
    im=Image.fromarray(a.astype(np.uint8)); d=ImageDraw.Draw(im); d.ellipse([200,20,250,70],fill=(250,220,120)); d.text((14,130),'Gruß aus Rimini',font=F('pac',30),fill=(220,40,60)); grain(im,0.06,seed=30).save(LB+'postkarte.png')
    print('labels ok')

# ---------- 7) Fensterglas Küche: Fettfilm (gelblich), unten beschlagen (Kochdunst), Kalkränder, Tropfen; Regenrinnsale außen ----------
def glas(N=1024):
    H=W=N; y,x=np.mgrid[0:H,0:W]/N; r=np.random.default_rng(77)
    n1=noise(H,W,160,4,71); n2=noise(H,W,36,3,72); n3=noise(H,W,8,2,73)
    edge=np.minimum.reduce([x,1-x,y,1-y]); rim=np.clip(1-edge/0.06,0,1)**1.5
    fog=np.clip((y-0.55)/0.35,0,1)**1.4*(0.75+0.25*n2)                        # Beschlag unten
    a=0.09+0.07*n1+0.26*rim*(0.6+0.4*n2)+0.22*fog+0.04*(n3>0.72)
    c=np.zeros((H,W,3))+np.array([36,38,44]); grease=np.array([110,96,64]); mist=np.array([150,150,146])
    k=np.clip(0.3*n1+0.5*rim,0,1)[...,None]; c=c*(1-k)+grease*k; c=c*(1-fog[...,None])+mist*fog[...,None]
    for _ in range(220):
        px,py,rr=r.random()*W,r.random()*H,2+r.random()*6; yy,xx=np.ogrid[0:H,0:W]
        x0,x1,y0,y1=int(max(0,px-rr-2)),int(min(W,px+rr+2)),int(max(0,py-rr-2)),int(min(H,py+rr+2)); d=np.sqrt((xx[:,x0:x1]-px)**2+(yy[y0:y1]-py)**2)
        ring=np.abs(d-rr)<1.0; a[y0:y1,x0:x1][ring]=np.maximum(a[y0:y1,x0:x1][ring],0.07); c[y0:y1,x0:x1][ring]=np.array([124,118,100])
    # Tropfen im Beschlag: abgelaufene, klare Spuren (weniger Alpha)
    for _ in range(26):
        px=r.random()*W; py0=int((0.55+0.2*r.random())*H); L=int(H*(0.1+0.25*r.random())); w=1.5+2*r.random()
        for i in range(L):
            yy_=min(H-1,py0+i); xx_=px+2*math.sin(i/23.0)
            for dx in range(-4,5):
                xi=int(xx_)+dx
                if 0<=xi<W: v=max(0,1-abs(xi-xx_)/w); a[yy_,xi]*=1-0.8*v
    im=Image.fromarray(np.dstack([np.clip(c,0,255),np.clip(a*255,0,255)]).astype(np.uint8),'RGBA'); im.save(OUT+'kue_glas.png',optimize=True)
def regen(W=256,H=1024):
    r=np.random.default_rng(78); c=np.zeros((H,W,3))+np.array([98,102,110]); a=np.zeros((H,W))
    for _ in range(12):
        x0=r.random()*W; ph=r.random()*6.28; amp=2+r.random()*5; wdt=0.8+r.random()*1.2; L=int(H*(0.3+r.random()*0.5)); ys=int(r.random()*H)
        for i in range(L):
            yy=(ys+i)%H; xx=x0+amp*math.sin(ph+i/41.0)+1.5*math.sin(i/6.1); t=i/L
            for dx in range(-3,4):
                xi=int(xx)+dx
                if 0<=xi<W: v=max(0,1-abs(xi-xx)/(wdt+0.5)); a[yy,xi]=max(a[yy,xi],v*(0.2+0.3*t))
    im=Image.fromarray(np.dstack([np.clip(c,0,255),np.clip(a*255,0,255)]).astype(np.uint8),'RGBA'); im.save(OUT+'kue_regen.png',optimize=True)
# ---------- 8) Scheibengardine (Spitze/Voile, weiß, Blütenmuster) 1024×512 RGBA, kachelbar in x ----------
def gardine(W=1024,H=512):
    r=np.random.default_rng(79); a=np.zeros((H,W)); yy,xx=np.mgrid[0:H,0:W]
    a+=0.46+0.06*noise(H,W,30,2,80)                                                            # Voile-Grund
    mesh=((xx%6<1.2)|(yy%6<1.2)).astype(float)*0.18; a+=mesh
    C=Image.new('L',(W,H),0); d=ImageDraw.Draw(C)
    for j in range(2):
        for i in range(8):
            cx,cy=i*128+64+(j%2)*64,j*256+150
            for k in range(6):
                t=k*math.pi/3; d.ellipse([cx+math.cos(t)*26-16,cy+math.sin(t)*26-16,cx+math.cos(t)*26+16,cy+math.sin(t)*26+16],outline=255,width=5)
            d.ellipse([cx-10,cy-10,cx+10,cy+10],fill=255)
            d.arc([cx-60,cy-90,cx+60,cy+30],200,340,fill=230,width=4)
    for x0 in range(0,W,16): d.polygon([(x0,H-1),(x0+8,H-22),(x0+16,H-1)],outline=255)   # Bogenkante unten
    d.rectangle([0,0,W,14],fill=255)                                                         # Tunnelzug oben
    a=np.clip(a+np.asarray(C,float)/255*0.5,0,1); a[H-22:]*=np.clip((np.asarray(C,float)[H-22:]/255)*1.2+0.0,0,1)*0+np.where(np.asarray(C,float)[H-22:]>0,1,0.0)
    col=np.zeros((H,W,3))+np.array([232,228,214]); col*= (0.94+0.06*noise(H,W,60,2,81))[...,None]
    Image.fromarray(np.dstack([np.clip(col,0,255),np.clip(a*255,0,255)]).astype(np.uint8),'RGBA').save(OUT+'kue_gardine.png',optimize=True)
# ---------- 9) Küchentür: cremeweiß lackierte Kassettentür (2 Füllungen), vergilbt, Griffspuren, Schrammen unten; + Normal ----------
def tuer(W=512,H=1024):
    h=np.zeros((H,W)); col=np.zeros((H,W,3))+np.array([206,198,176])
    n=noise(H,W,90,4,91); col*=(0.95+0.07*n)[...,None]
    for (y0,y1) in [(90,450),(540,930)]:
        x0,x1=80,W-80
        for k in range(14):   # Profil: Fase nach innen
            v=0.5+0.5*math.cos(k/14*math.pi); h[y0+k:y1-k,x0+k:x1-k]+=0.08*(1 if k<7 else -0.4)
        col[y0:y0+3,x0:x1]*=0.78; col[y1-3:y1,x0:x1]*=1.05; col[y0:y1,x0:x0+3]*=0.8; col[y0:y1,x1-3:x1]*=1.04
        col[y0+14:y0+17,x0+14:x1-14]*=1.05; col[y1-17:y1-14,x0+14:x1-14]*=0.85
    yy,xx=np.mgrid[0:H,0:W]
    g=np.exp(-(((xx-W*0.86)/60)**2+((yy-H*0.5)/120)**2)); col*=(1-0.22*g)[...,None]          # Griffspuren (Klinke rechts)
    col[...,2]*=1-0.08*g
    b=np.clip((yy-H*0.88)/(H*0.12),0,1)**1.5*(0.5+0.5*noise(H,W,40,2,92)); col*=(1-0.18*b)[...,None]            # Schuhkanten unten
    for _ in range(40):
        x=random.randint(0,W-1); y=random.randint(int(H*0.82),H-1); L=random.randint(6,30); col[y:y+1,x:x+L]*=0.7
    yell=np.clip(1-yy/H,0,1)*0.06; col[...,2]*=1-yell                                         # oben stärker vergilbt (Kochdunst)
    im=Image.fromarray(np.clip(col,0,255).astype(np.uint8)); im=grain(im,0.04,93); save(im,'kue_tuer',q=90)
    nmap(cv2_blur(h,1.5)*6.0,3.0).save(OUT+'kue_tuer_n.jpg',quality=90)
# ---------- 10) Küchenuhr (Parodie „Junghaus Quarz“), Ziffernblatt 512² ----------
def uhr(N=512):
    im=Image.new('RGB',(N,N),(226,220,200)); d=ImageDraw.Draw(im); c=N/2
    d.ellipse([4,4,N-4,N-4],fill=(232,226,206),outline=(60,52,40),width=6)
    for i in range(60):
        a=i/60*2*math.pi; r0=c-22 if i%5 else c-44; r1=c-14
        d.line([(c+math.sin(a)*r0,c-math.cos(a)*r0),(c+math.sin(a)*r1,c-math.cos(a)*r1)],fill=(40,36,30),width=8 if i%5==0 else 3)
    f=F('ser',44)
    for i in range(1,13):
        a=i/12*2*math.pi; r=c-80; d.text((c+math.sin(a)*r,c-math.cos(a)*r),str(i),font=f,fill=(36,32,28),anchor='mm')
    d.text((c,c-70),'JUNGHAUS',font=F('cond',30),fill=(120,30,26),anchor='mm'); d.text((c,c+84),'QUARZ',font=F('condr',24),fill=(60,56,50),anchor='mm')
    d.text((c,c+112),'Made in W.-Germany',font=F('condr',16),fill=(90,86,78),anchor='mm')
    # Stunden-/Minutenzeiger (fest, 2:47 – Batterie leer, die Zeit steht), Sekundenzeiger separat in JS
    for (ang,L,w) in [((2+47/60)/12*360,c*0.46,14),(47/60*360,c*0.7,9)]:
        a=math.radians(ang); d.line([(c-math.sin(a)*24,c+math.cos(a)*24),(c+math.sin(a)*L,c-math.cos(a)*L)],fill=(20,18,16),width=w)
    d.ellipse([c-14,c-14,c+14,c+14],fill=(20,18,16))
    v=np.asarray(im,float); yy,xx=np.mgrid[0:N,0:N]; rr=np.hypot(xx-c,yy-c)/c; v*= (1-0.12*np.clip(rr-0.6,0,1)/0.4)[...,None]
    v[...,2]*=0.95; im=grain(Image.fromarray(np.clip(v,0,255).astype(np.uint8)),0.04,94); save(im,'kue_uhr',q=90)
# ---------- 11) Kreuzstich-Spruch im Rahmen (Parodie auf Küchensegen) 512×640 ----------
def stick(W=512,H=640):
    base=Image.new('RGB',(W,H),(222,214,190)); d=ImageDraw.Draw(base)
    for x in range(0,W,6): d.line([(x,0),(x,H)],fill=(208,200,176),width=1)
    for y in range(0,H,6): d.line([(0,y),(W,y)],fill=(208,200,176),width=1)
    # Motiv auf grobem Raster zeichnen, dann als Kreuzstiche (6px) setzen
    S=6; gw,gh=W//S,H//S; m=Image.new('RGB',(gw,gh),(0,0,0)); md=ImageDraw.Draw(m)
    md.rectangle([2,2,gw-3,gh-3],outline=(150,40,40)); md.rectangle([4,4,gw-5,gh-5],outline=(60,100,60))
    fnt=ImageFont.truetype(FN['dj'],11)
    for i,t in enumerate(['Wo man','kocht,','da lass','dich','nieder.']): md.text((gw/2,16+i*13),t,font=fnt,fill=(40,60,120),anchor='mt')
    md.text((gw/2,gh-26),'Abwasch','',font=fnt,fill=(150,40,40),anchor='mt') if False else md.text((gw/2,gh-24),'Abwasch',font=fnt,fill=(150,40,40),anchor='mt')
    md.text((gw/2,gh-13),'erst morgen.',font=ImageFont.truetype(FN['dj'],8),fill=(150,40,40),anchor='mt')
    for k in range(5): md.point([(10+k*14,gh-34),(11+k*14,gh-35),(12+k*14,gh-34)],fill=(170,120,40))
    M=np.asarray(m)
    for y in range(gh):
        for x in range(gw):
            c=tuple(int(v) for v in M[y,x])
            if sum(c)>40:
                x0,y0=x*S,y*S; cc=tuple(min(255,int(v*random.uniform(0.85,1.1))) for v in c)
                d.line([(x0+1,y0+1),(x0+S-1,y0+S-1)],fill=cc,width=2); d.line([(x0+S-1,y0+1),(x0+1,y0+S-1)],fill=cc,width=2)
    v=np.asarray(base,float); v*=(0.9+0.12*noise(H,W,80,3,95))[...,None]; v[...,2]*=0.9   # vergilbt
    im=grain(Image.fromarray(np.clip(v,0,255).astype(np.uint8)),0.04,96); save(im,'kue_stick',q=90)
# ---------- 12) Wandtelefon (Wählscheibe) + Telefonliste am Nagel (Handschrift, Parodie-Nummern) ----------
def wand_lbl():
    N=512; im=Image.new('RGB',(N,N),(88,118,80)); d=ImageDraw.Draw(im); c=N/2
    d.ellipse([20,20,N-20,N-20],fill=(70,98,64),outline=(50,70,46),width=6)
    d.ellipse([c-110,c-110,c+110,c+110],fill=(226,222,206))                                    # Nummernring
    for i in range(10):
        a=math.radians(62+i*28.5); x,y=c+math.cos(a)*165,c-math.sin(a)*165
        d.ellipse([x-38,y-38,x+38,y+38],fill=(40,44,40),outline=(140,150,130),width=4)
        d.text((x,y),str((i+1)%10),font=F('dj',34),fill=(214,212,196),anchor='mm')
    d.ellipse([c-60,c-60,c+60,c+60],fill=(236,232,218),outline=(120,120,110),width=3); d.text((c,c-14),'0521',font=F('condr',30),fill=(60,60,58),anchor='mm'); d.text((c,c+18),'47 11 08',font=F('condr',30),fill=(60,60,58),anchor='mm')
    d.arc([c-200,c-200,c+200,c+200],12,30,fill=(200,200,190),width=10)                       # Fingeranschlag
    grain(im,0.05,97).save(LB+'waehl.png')
    W,H=300,400; im=Image.new('RGB',(W,H),(236,230,206)); d=ImageDraw.Draw(im)
    for y in range(60,H,28): d.line([(0,y),(W,y)],fill=(150,170,200),width=1)
    d.line([(36,0),(36,H)],fill=(210,120,120),width=2)
    f=F('kal',26); fb=F('kalb',30); d.text((W/2,14),'Telefon',font=fb,fill=(30,40,110),anchor='mt')
    for i,(n,t) in enumerate([('Mutti','0521 / 3 88 14'),('Pizza Roma','4 71 12'),('Videothek','2 22 90'),('Dr. Kern','6 13 00'),('Taxi','1 92 22'),('Hausmeister','???')]):
        y=58+i*28*2; d.text((44,y),n,font=f,fill=(30,40,110)); d.text((W-12,y+26),t,font=f,fill=(30,40,110),anchor='ra')
    d.line([(44,58+5*56+16),(200,58+5*56+10)],fill=(30,40,110),width=2)
    d.ellipse([W/2-6,2,W/2+6,14],fill=(90,90,90))
    v=np.asarray(im,float)*(0.88+0.14*noise(H,W,60,3,98))[...,None]; v[...,2]*=0.92
    grain(Image.fromarray(np.clip(v,0,255).astype(np.uint8)),0.04,99).save(LB+'telliste.png')
which=sys.argv[1].split(',') if len(sys.argv)>1 else ['fliesen','boden','raufaser','wachstuch','kalender','labels']
for w in which: globals()[w]()
