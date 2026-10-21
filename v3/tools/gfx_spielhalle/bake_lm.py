"""Spielhalle 1984 – Lightmap (Bildschirm-/Marquee-/Neon-Schein) + AO/Abnutzung, CPU-Bake mit numpy.
Eingabe: arc_dump.json (Automaten-Aufstellung aus arc3d.js, deterministisch, Seed 8484). Ausgabe: lm.jpg (sRGB, RGB-Irradianz),
ao.jpg (R = AO, G = Abnutzung/Dreck-Maske), lm.json (Skalierung). Layout muss zu lib/gfx_spielhalle.js (REG) passen."""
import json, sys, numpy as np
from PIL import Image, ImageFilter
D=json.load(open(sys.argv[1])); OUT=sys.argv[2]; A=1024
XW,YC,Z0,Z1=4.4,3.2,4.4,-16.0
REG={'floor':(0,0,320,742),'ceil':(330,0,160,371),'wl':(500,0,112,714),'wr':(620,0,112,714),'wb':(330,380,308,112),'wf':(330,500,308,112)}
def surf(k,s,t):
    if k=='floor': return np.stack([-XW+s*2*XW,0*s+0.0,Z1+t*(Z0-Z1)],-1),(0,1,0)
    if k=='ceil':  return np.stack([-XW+s*2*XW,0*s+YC,Z1+t*(Z0-Z1)],-1),(0,-1,0)
    if k=='wl':    return np.stack([0*s-XW,s*YC,Z1+t*(Z0-Z1)],-1),(1,0,0)
    if k=='wr':    return np.stack([0*s+XW,s*YC,Z1+t*(Z0-Z1)],-1),(-1,0,0)
    if k=='wb':    return np.stack([-XW+s*2*XW,t*YC,0*s+Z0],-1),(0,0,-1)
    if k=='wf':    return np.stack([-XW+s*2*XW,t*YC,0*s+Z1],-1),(0,0,1)
def hexc(h): h=int(h); return np.array([(h>>16)&255,(h>>8)&255,h&255])/255.0
def lin(c): return c**2.2
scrCol=[0x40c0ff,0xff40a0,0xffd040,0x60ff80,0xc0d0ff,0xff6030,0xa060ff,0x404050]
titles=[0x40c0ff,0xff6030,0xff40a0,0xffd040,0xc0d0ff,0x60ff80,0xff4040,0xa060ff,0x40ffd0,0xffd040,0x40c0ff,0x80ff40,0xff40a0,0xffffff,0xff8030,0xc0d0ff]
dead={5,17,31}
def rotY(v,a): c,s=np.cos(a),np.sin(a); return np.array([c*v[0]+s*v[2],v[1],-s*v[0]+c*v[2]])
def rotX(v,a): c,s=np.cos(a),np.sin(a); return np.array([v[0],c*v[1]-s*v[2],s*v[1]+c*v[2]])
E_=[]   # (pos, normal, rgb*power*area, owner box idx or -1, half-extent along local x for sampling)
boxes=[] # oriented boxes: center(x,z), ry, half (hx,hz), y0,y1
def cabbox(x,z,ry): boxes.append((x,z,ry,0.34,0.44,0.0,1.84,0.035)); return len(boxes)-1
for i,c in enumerate(D['cabs']):
    bi=cabbox(c['x'],c['z'],c['ry']); o=np.array([c['x'],0,c['z']])
    k=0 if i in dead else 1
    if k:
        n=rotY(rotX(np.array([0,0,1.0]),-0.27),c['ry']); p=o+rotY(np.array([0,1.323,0.19]),c['ry'])
        E_.append((p,n,lin(hexc(scrCol[c['tile']]))*0.2*1.0,bi,0.2,c['ry']))
    n=rotY(rotX(np.array([0,0,1.0]),0.15),c['ry']); p=o+rotY(np.array([0,1.71,0.226]),c['ry'])
    E_.append((p,n,lin(hexc(titles[i%16]))*0.144*(0.12 if i in dead else 0.55),bi,0.24,c['ry']))
# spielbare Automaten (zf.js / f3d.js) – Bildschirm hell, eigener Farbton
for (x,z,ry,col) in [(1.55,-1.35,-0.55,0xffb040),(-1.55,-1.35,0.55,0x40d0ff)]:
    bi=cabbox(x,z,ry); o=np.array([x,0,z]); n=rotY(rotX(np.array([0,0,1.0]),-0.27),ry); p=o+rotY(np.array([0,1.323,0.19]),ry)
    E_.append((p,n,lin(hexc(col))*0.2*1.6,bi,0.2,ry)); p=o+rotY(np.array([0,1.71,0.226]),ry); E_.append((p,rotY(np.array([0,-0.15,0.99]),ry),lin(hexc(col))*0.144*0.8,bi,0.24,ry))
# Neon-Schilder (additive Textur ~ 25 % gefüllt)
E_.append((np.array([0,2.62,Z1+0.06]),np.array([0,0,1.0]),lin(hexc(0xff40b0))*3.6*0.25,-1,1.6,0))
E_.append((np.array([-2.6,2.25,Z0-0.05]),np.array([0,0,-1.0]),lin(hexc(0x40ffe0))*0.57*0.3,-1,0.6,np.pi))
# Getränkeautomat (beleuchtete Front) + Kasse/Wechsler + Getränkeautomat als Blocker
vry=70*np.pi/180; vo=np.array([-2.35,0,-0.4])
E_.append((vo+rotY(np.array([0,1.2,0.42]),vry),rotY(np.array([0,0,1.0]),vry),np.array([1,0.95,0.88])*0.5*0.35,-1,0.25,vry))
boxes.append((-2.35,-0.4,vry,0.45,0.4,0,1.9,0.0)); boxes.append((-2.6,3.3,0,0.85,0.35,0,1.1,0.0)); boxes.append((-3.95,3.6,0,0.3,0.23,0,1.6,0.0))
B=np.array([[b[0],b[1],b[2],b[3],b[4],b[5],b[6]] for b in boxes])
def occluded(P,e,own):
    """P (N,3) Empfänger, e (3,) Emitter-Punkt -> Sichtbarkeit (N,) 0/1 über Slab-Test in Box-Lokalkoordinaten (xz gedreht, y achsparallel)."""
    vis=np.ones(len(P),np.float32); d=e[None,:]-P
    near=np.where(np.hypot(B[:,0]-e[0],B[:,1]-e[2])<7.5)[0]
    for j in near:
        if j==own: continue
        x,z,ry,hx,hz,y0,y1=B[j]; c,s=np.cos(-ry),np.sin(-ry)
        ox=P[:,0]-x; oz=P[:,2]-z; lx=c*ox+s*oz; lz=-s*ox+c*oz; dx=c*d[:,0]+s*d[:,2]; dz=-s*d[:,0]+c*d[:,2]
        t0=np.zeros(len(P)); t1=np.ones(len(P))*0.999
        for (o_,dd,lo,hi) in [(lx,dx,-hx,hx),(P[:,1],d[:,1],y0,y1),(lz,dz,-hz,hz)]:
            with np.errstate(divide='ignore',invalid='ignore'):
                a=(lo-o_)/dd; b=(hi-o_)/dd
            mn=np.where(np.abs(dd)<1e-9,np.where((o_>=lo)&(o_<=hi),-1e9,1e9),np.minimum(a,b)); mx=np.where(np.abs(dd)<1e-9,np.where((o_>=lo)&(o_<=hi),1e9,-1e9),np.maximum(a,b))
            t0=np.maximum(t0,mn); t1=np.minimum(t1,mx)
        hit=(t1>t0)&(t1>0.002)
        vis[hit]=0
    return vis
LM=np.zeros((A,A,3),np.float32); AO=np.ones((A,A),np.float32); WR=np.zeros((A,A),np.float32); MASK=np.zeros((A,A),bool)
def fp_dist(P):  # 2D-Abstand zu allen Box-Grundrissen (min)
    dm=np.full(len(P),9.0)
    for x,z,ry,hx,hz,y0,y1 in B:
        c,s=np.cos(-ry),np.sin(-ry); ox=P[:,0]-x; oz=P[:,2]-z; lx=np.abs(c*ox+s*oz)-hx; lz=np.abs(-s*ox+c*oz)-hz
        dd=np.hypot(np.maximum(lx,0),np.maximum(lz,0))+np.minimum(np.maximum(lx,lz),0); dm=np.minimum(dm,dd)
    return dm
rng=np.random.default_rng(3)
for k,(x0,y0,w,h) in REG.items():
    s=(np.arange(w)+0.5)/w; t=(np.arange(h)+0.5)/h; S,T=np.meshgrid(s,t)
    P,n=surf(k,S.ravel(),T.ravel()); n=np.array(n,float); E=np.zeros((len(P),3))
    for (p,ne,pw,own,hw,ry) in E_:
        side=rotY(np.array([1.0,0,0]),ry)
        for off in ([-0.5,0.5] if hw>0.3 else [0.0]):
            e=p+side*off*hw*1.2+ne*0.03
            d=e[None,:]-P; r2=(d**2).sum(1); r=np.sqrt(r2); L=d/r[:,None]
            cr=np.clip(L@n,0,1); ce=np.clip(-(L@ne),0,1)
            m=(cr>0)&(ce>0)&(r<9)
            if not m.any(): continue
            v=np.zeros(len(P)); v[m]=occluded(P[m],e,own)
            A_=1.0/len([0] if hw<=0.3 else [0,0])
            E+=(pw*A_)[None,:]*(cr*ce*v/(np.pi*r2+0.35))[:,None]
    # AO + Abnutzung
    if k in('floor',):
        dw=np.minimum.reduce([P[:,0]+XW,XW-P[:,0],P[:,2]-Z1,Z0-P[:,2]]); db=fp_dist(P)
        ao=(1-0.55*np.exp(-dw/0.18))*(1-0.75*np.exp(-np.maximum(db,0)/0.12))
        ao=np.where(db<0,0.25,ao)
        # Laufwege: vor jedem Automaten (Spielerposition) + Hauptgang Mitte + Weg zur Kasse
        wear=np.zeros(len(P))
        for c in D['cabs']+[{'x':1.55,'z':-1.35,'ry':-0.55},{'x':-1.55,'z':-1.35,'ry':0.55}]:
            f=np.array([c['x'],0,c['z']])+rotY(np.array([0,0,0.75]),c['ry']); wear=np.maximum(wear,np.exp(-((P[:,0]-f[0])**2+(P[:,2]-f[2])**2)/0.09))
        wear=np.maximum(wear,0.7*np.exp(-(P[:,0]/1.0)**2)*(P[:,2]>-4.5)*(P[:,2]<3.5))
        wear=np.maximum(wear,0.8*np.exp(-((P[:,0]+2.6)**2/0.5+(P[:,2]-2.6)**2/0.15)))
    elif k=='ceil':
        dw=np.minimum.reduce([P[:,0]+XW,XW-P[:,0],P[:,2]-Z1,Z0-P[:,2]]); ao=1-0.5*np.exp(-dw/0.25); wear=np.zeros(len(P))
    else:
        db=fp_dist(P) if k in('wl','wr','wb','wf') else 9
        hor=np.minimum.reduce([P[:,0]+XW,XW-P[:,0],P[:,2]-Z1,Z0-P[:,2]]) if False else None
        cor=np.minimum(P[:,1],YC-P[:,1]); side=np.minimum.reduce([np.abs(P[:,0]+XW)+np.abs(P[:,2]-Z1),np.abs(P[:,0]-XW)+np.abs(P[:,2]-Z1),np.abs(P[:,0]+XW)+np.abs(Z0-P[:,2]),np.abs(P[:,0]-XW)+np.abs(Z0-P[:,2])])
        sidec=np.minimum(np.abs(np.abs(P[:,0])-XW)+np.minimum(np.abs(P[:,2]-Z1),np.abs(Z0-P[:,2])),9) if k in('wb','wf') else np.minimum(np.abs(P[:,2]-Z1),np.abs(Z0-P[:,2]))
        hb=np.clip((P[:,1]-1.84)/0.5,0,1)  # oberhalb der Automaten weniger Verdeckung
        ao=(1-0.5*np.exp(-cor/0.22))*(1-0.4*np.exp(-sidec/0.25))*(1-0.7*np.exp(-np.maximum(db,0)/0.15)*(1-hb))
        # Schmutz: Rauchschatten oberhalb der Automaten, Dreck unten
        wear=np.clip(0.6*np.exp(-np.maximum(db,0)/0.3)*(1-hb)+0.5*np.exp(-P[:,1]/0.25),0,1)
    LM[y0:y0+h,x0:x0+w]=E.reshape(h,w,3); AO[y0:y0+h,x0:x0+w]=ao.reshape(h,w); WR[y0:y0+h,x0:x0+w]=wear.reshape(h,w); MASK[y0:y0+h,x0:x0+w]=True
    print(k,'max',E.max(axis=0).round(4),'mean',E.mean(axis=0).round(4),flush=True)
# Dilatation (gegen Bilinear-Ränder): 6 Schritte Max-Ausbreitung in leere Pixel
def dilate(a,mask,steps=6):
    a=a.copy(); m=mask.copy()
    for _ in range(steps):
        for dy,dx in ((0,1),(0,-1),(1,0),(-1,0)):
            sh=np.roll(np.roll(a,dy,0),dx,1); smk=np.roll(np.roll(m,dy,0),dx,1); fill=(~m)&smk; a[fill]=sh[fill]; m=m|fill
    return a
sc=np.percentile(LM[MASK].max(1),99.7)
lm=np.clip(LM/sc,0,1)**(1/2.2)
lm=dilate(lm,MASK); ao=dilate(np.clip(0.3+0.7*AO,0,1),MASK); wr=dilate(np.clip(WR,0,1),MASK)
img=Image.fromarray(np.uint8(lm*255)).filter(ImageFilter.MedianFilter(3))
img.save(OUT+'/lm.jpg',quality=92,subsampling=0)
Image.fromarray(np.uint8(np.stack([ao,wr,np.zeros_like(ao)],-1)*255)).filter(ImageFilter.GaussianBlur(1.2)).save(OUT+'/ao.jpg',quality=92,subsampling=0)
json.dump({'scale':float(sc),'cabs':len(D['cabs']),'reg':REG,'atlas':A},open(OUT+'/lm.json','w'))
print('scale',sc)
