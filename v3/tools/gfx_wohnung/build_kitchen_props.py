# Blender headless: Küchen-Props (Einbauküche späte 80er, „Eiche rustikal“): Küchenzeile (Unter-/Oberschränke, Arbeitsplatte, Edelstahlspüle, Herd,
# Mikrowellen-Umbau, Messerleiste), Kühlschrank, Eckbankgruppe, Kram (Etiketten = Parodien, Text per PIL aus gen_kitchen_tex.py). Farbe+AO gebacken, 1 Material/Draw pro GLB.
# blender -b --factory-startup -P build_kitchen_props.py -- OUTDIR [TEX=2048] [which=zeile,kuehl,ecke,kram]
# Alle Modelle in Weltkoordinaten (Ursprung 0, im Spiel ohne Versatz in kitchenG). Achsen: Blender (x,y,z) = Welt (x,−z,y). Maße hängen an lib/mmk.js (Interaktionen).
import bpy, bmesh, sys, os, math, random
argv=sys.argv[sys.argv.index('--')+1:]; TEX=int(argv[1]) if len(argv)>1 else 2048
WHICH=(argv[2] if len(argv)>2 else 'zeile,kuehl,ecke,kram').split(',')
random.seed(1989)
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
from props_lib import *
import props_lib
OUT=argv[0]; props_lib.set_out(OUT)
V3=os.path.abspath(os.path.join(HERE,'../..')); LBL=V3+'/assets/apartment/kitchen/src/lbl/'; WOODT=V3+'/assets/tex/mm/wood_c.jpg'
# ---------- Welt-Helfer ----------
def W(x0,x1,y0,y1,z0,z1,m,bev=0.0,seg=2,rot=None): return box((x0+x1)/2,-(z0+z1)/2,(y0+y1)/2,x1-x0,z1-z0,y1-y0,m,bev=bev,seg=seg,rot=rot)
def Wc(x,y,z,r,h,m,axis='y',v=16,bev=0.0):  # Zylinder: Mitte (x,y,z) Welt, axis Welt-Achse
    return cyl(x,-z,y,r,h,m,axis={'y':'Z','x':'X','z':'Y'}[axis],v=v,bev=bev)
def Wl(x,y,z,prof,m,seg=16): return lathe(x,-z,y,prof,m,seg=seg)
def Wcable(pts,r,m): return curve_cable([(p[0],-p[2],p[1]) for p in pts],r,m)
def oak(): return imgmat('eiche',WOODT,tint=0xc08850,scale=1.6,rough=0.55,dirt=0x5a3818,rot90=True)
def oakh(): return imgmat('eicheh',WOODT,tint=0xc08850,scale=1.6,rough=0.55,dirt=0x5a3818)
def oakd(): return imgmat('eiched',WOODT,tint=0x7a4c2a,scale=1.6,rough=0.6)
# ---------- Etiketten: Flächen mit eigener UV-Ebene 'LBL' (wird nach dem Backen entfernt) ----------
LM={}
def labmat(path):
    if path in LM: return LM[path]
    m=bpy.data.materials.new('lbl_'+os.path.basename(path)); m.use_nodes=True; nt=m.node_tree; N=nt.nodes; b=N['Principled BSDF']; b.inputs['Roughness'].default_value=0.5
    uv=N.new('ShaderNodeUVMap'); uv.uv_map='LBL'; t=N.new('ShaderNodeTexImage'); t.image=bpy.data.images.load(path,check_existing=True); t.extension='CLIP'
    nt.links.new(uv.outputs[0],t.inputs[0]); nt.links.new(t.outputs[0],b.inputs['Base Color']); LM[path]=m; return m
AX={'-z':((-1,0,0),(0,1,0)),'+z':((1,0,0),(0,1,0)),'-x':((0,0,1),(0,1,0)),'+x':((0,0,-1),(0,1,0)),'+y':((-1,0,0),(0,0,1)),'-y':((1,0,0),(0,0,1))}
def w2(v): return (v[0],v[2],-v[1])   # Blender → Welt
def ensure_uv(o):
    me=o.data
    if 'UVMap' not in me.uv_layers: me.uv_layers.new(name='UVMap')
    if 'LBL' not in me.uv_layers: me.uv_layers.new(name='LBL')
    me.uv_layers.active=me.uv_layers['UVMap']; me.uv_layers['UVMap'].active_render=True
def label_faces(o,base,spec):
    # spec: {face:(pfad,(u_achse,v_achse) oder None, [u0,u1,v0,v1])}
    ensure_uv(o); me=o.data; uvl=me.uv_layers['LBL']
    for f,(path,ax,rect) in spec.items():
        m=labmat(LBL+path); 
        if m.name not in [s.name for s in me.materials]: me.materials.append(m)
        mi=[s.name for s in me.materials].index(m.name); ua,va=ax or AX[f]
        nidx={'-z':(2,-1),'+z':(2,1),'-x':(0,-1),'+x':(0,1),'+y':(1,1),'-y':(1,-1)}[f]
        polys=[p for p in me.polygons if (w2(p.normal)[nidx[0]]*nidx[1])>0.9]
        if not polys: continue
        P=[w2(me.vertices[vi].co) for p in polys for vi in p.vertices]
        us=[sum(a*b for a,b in zip(q,ua)) for q in P]; vs=[sum(a*b for a,b in zip(q,va)) for q in P]; u0,u1,v0,v1=min(us),max(us),min(vs),max(vs)
        r=rect or [0,1,0,1]
        for p in polys:
            p.material_index=mi
            for li in p.loop_indices:
                q=w2(me.vertices[me.loops[li].vertex_index].co); uu=(sum(a*b for a,b in zip(q,ua))-u0)/max(1e-6,u1-u0); vv=(sum(a*b for a,b in zip(q,va))-v0)/max(1e-6,v1-v0)
                uvl.data[li].uv=(r[0]+uu*(r[1]-r[0]),r[2]+vv*(r[3]-r[2]))
    return o
def lbox(x0,x1,y0,y1,z0,z1,base,spec,bev=0.0): o=W(x0,x1,y0,y1,z0,z1,base,bev=bev); return label_faces(o,base,spec)
def lcyl(x,y,z,r,h,base,path,rot=0.0,v=24,band=(0.0,1.0)):
    o=Wc(x,y,z,r,h,base,v=v); ensure_uv(o); me=o.data; uvl=me.uv_layers['LBL']; m=labmat(LBL+path); me.materials.append(m); mi=len(me.materials)-1
    for p in me.polygons:
        n=w2(p.normal)
        if abs(n[1])>0.5: continue
        c=w2(p.center); hgt=(c[1]-(y-h/2))/h
        if not (band[0]<=hgt<=band[1]): continue
        p.material_index=mi; angs=[]
        for li in p.loop_indices:
            q=w2(me.vertices[me.loops[li].vertex_index].co); a=(math.atan2(q[0]-x,-(q[2]-z))+rot)/(2*math.pi)%1.0; angs.append((li,a,q))
        if max(a for _,a,_ in angs)-min(a for _,a,_ in angs)>0.5: angs=[(li,a+1 if a<0.5 else a,q) for li,a,q in angs]
        for li,a,q in angs: uvl.data[li].uv=(1-a,((q[1]-(y-h/2))/h-band[0])/(band[1]-band[0]))
    return o
def done(name,tex,**kw):
    for o in OBJS: ensure_uv(o)
    ob=finish(name,tex,**kw)
    if 'LBL' in ob.data.uv_layers: ob.data.uv_layers.remove(ob.data.uv_layers['LBL'])
    export(name,[ob]); return ob
def panel_door(x0,x1,y0,y1,zf,m,mi,arch=True):
    # Rahmen-Füllungstür „Eiche rustikal“: Türblatt, Rahmen (aufgesetzt), Füllung mit Bogen oben (als Treppe angenähert), Fase
    W(x0,x1,y0,y1,zf-0.019,zf,m,bev=0.004)
    b=0.055; W(x0,x1,y1-b,y1,zf-0.03,zf-0.019,m,bev=0.006); W(x0,x1,y0,y0+b,zf-0.03,zf-0.019,m,bev=0.006)
    W(x0,x0+b,y0+b,y1-b,zf-0.03,zf-0.019,m,bev=0.006); W(x1-b,x1,y0+b,y1-b,zf-0.03,zf-0.019,m,bev=0.006)
    ix0,ix1,iy0,iy1=x0+b+0.018,x1-b-0.018,y0+b+0.018,y1-b-0.018
    if y1-y0>0.3: W(ix0,ix1,iy0,iy1-(0.035 if arch else 0),zf-0.026,zf-0.019,mi,bev=0.008)
    if arch and y1-y0>0.3:
        n=6
        for k in range(n):  # Bogen: Stufen oberhalb der Füllung
            t0=k/n; t1=(k+1)/n; xa=ix0+(ix1-ix0)*t0; xb=ix0+(ix1-ix0)*t1; tm=(t0+t1)/2; hh=0.035*math.sin(math.pi*tm)
            W(xa,xb,iy1-0.035,iy1-0.035+hh+0.002,zf-0.026,zf-0.019,mi)
def bow(x,y,z,vert,m,L=0.11):
    # Bügelgriff Altmessing
    if vert: W(x-0.007,x+0.007,y-L/2,y+L/2,z-0.032,z-0.022,m,bev=0.004); [W(x-0.006,x+0.006,y+s*L/2-0.006,y+s*L/2+0.006,z-0.024,z,m) for s in (-1,1)]
    else: W(x-L/2,x+L/2,y-0.007,y+0.007,z-0.032,z-0.022,m,bev=0.004); [W(x+s*L/2-0.006,x+s*L/2+0.006,y-0.006,y+0.006,z-0.024,z,m) for s in (-1,1)]
Z1=2.5; ZF=1.9; CT=(0.88,0.92)
# ===================== 1) Küchenzeile =====================
if 'zeile' in WHICH:
    reset(); MATS.clear(); OBJS.clear(); O=oak(); OH=oakh(); OD=oakd(); MS=mat('messing',0x7a5e30,var=0.2,scale=200,rough=0.35); SO=mat('sockel',0x231a12,var=0.1)
    KO=mat('korpus',0x5e3c24,var=0.1); RS=mat('resopal',0xcbbd9e,var=0.07,scale=260,dirt=0x8c7b58,rough=0.45); ST=mat('stahl',0xa6a6a2,var=0.12,scale=180,dirt=0x6a6452,rough=0.3)
    STD=mat('stahld',0x6e6e6a,var=0.15,scale=120,rough=0.35); CR=mat('chrom',0xc0c0bc,var=0.08,rough=0.2); EN=mat('herd',0xe0d8c6,var=0.06,scale=80,dirt=0xa89a78,rough=0.35)
    BG=mat('braunglas',0x2a1a10,var=0.08,rough=0.1); BK=mat('schwarz',0x141312,var=0.06); PL=mat('platte',0x1e1d1c,var=0.1,scale=150,rough=0.5)
    cabs=[(-7.6,-7.0,1),(-8.855,-8.36,1),(-9.35,-8.855,1),(-10.15,-9.35,2),(-10.65,-10.15,1)]
    for x0,x1,n in cabs:
        W(x0,x1,0.1,CT[0],ZF,Z1-0.01,KO); W(x0+0.005,x1-0.005,0,0.1,ZF+0.06,Z1-0.01,SO)
        w=(x1-x0)/n
        for i in range(n):
            a,b=x0+i*w+0.003,x0+(i+1)*w-0.003
            W(a,b,0.715,0.865,ZF-0.019,ZF,OH,bev=0.004); W(a+0.03,b-0.03,0.735,0.845,ZF-0.024,ZF-0.019,OH,bev=0.006); bow((a+b)/2,0.79,ZF-0.019,False,MS)
            panel_door(a,b,0.105,0.705,ZF,O,OH); bow(b-0.04 if (n==1 or i==0) and x0>-10.6 else a+0.04,0.6,ZF-0.03,True,MS)
    # Arbeitsplatte (Resopal beige meliert, Holzumleimer), Spülen-Ausschnitt
    BX=(-10.06,-9.52,2.02,2.36)
    for a,b in [(-10.67,BX[0]),(BX[1],-8.36),(-7.6,-7.0)]: W(a,b,CT[0],CT[1],1.885,Z1,RS)
    W(BX[0],BX[1],CT[0],CT[1],1.885,BX[2],RS); W(BX[0],BX[1],CT[0],CT[1],BX[3],Z1,RS)
    for a,b in [(-10.67,-8.36),(-7.6,-7.0)]: W(a,b,CT[0]-0.002,CT[1]+0.001,1.872,1.886,OH,bev=0.004)
    W(-10.67,-7.0,CT[1],CT[1]+0.03,Z1-0.012,Z1,mat('leiste',0x8a7a58,var=0.1))   # Wandabschlussleiste
    # Edelstahl-Einbauspüle mit Abtropffläche (−10.12 … −9.05)
    SX=(-10.12,-9.05,1.96,2.43); t=CT[1]
    W(SX[0],BX[0],t,t+0.008,SX[2],SX[3],ST,bev=0.003); W(BX[1],SX[1],t,t+0.008,SX[2],SX[3],ST,bev=0.003); W(BX[0],BX[1],t,t+0.008,SX[2],BX[2],ST); W(BX[0],BX[1],t,t+0.008,BX[3],SX[3],ST)
    for k in range(7): W(-9.47,-9.1,t+0.008,t+0.011,1.99+k*0.06,2.01+k*0.06,ST)   # Rillen Abtropffläche
    y0=0.74
    W(BX[0],BX[1],y0-0.006,y0,BX[2],BX[3],STD); W(BX[0],BX[1],y0,t,BX[2]-0.006,BX[2],ST); W(BX[0],BX[1],y0,t,BX[3],BX[3]+0.006,ST); W(BX[0]-0.006,BX[0],y0,t,BX[2],BX[3],ST); W(BX[1],BX[1]+0.006,y0,t,BX[2],BX[3],ST)
    Wc((BX[0]+BX[1])/2,y0+0.002,(BX[2]+BX[3])/2,0.03,0.004,BK,v=16); Wc((BX[0]+BX[1])/2,y0+0.004,(BX[2]+BX[3])/2,0.022,0.004,CR,v=16)
    # Zweigriff-Armatur (Chrom), Schwenkauslauf
    fx,fz=(BX[0]+BX[1])/2,2.405; Wc(fx,t+0.02,fz,0.028,0.024,CR,v=16); Wc(fx,t+0.09,fz,0.012,0.13,CR,v=12)
    Wcable([(fx,t+0.15,fz),(fx,t+0.2,fz-0.03),(fx,t+0.2,fz-0.12),(fx,t+0.14,fz-0.17)],0.009,CR)
    for d in (-0.1,0.1):
        Wc(fx+d,t+0.025,fz,0.02,0.03,CR,v=12); 
        for k in range(4): a=k*math.pi/2+0.4; W(fx+d+math.cos(a)*0.02-0.005,fx+d+math.cos(a)*0.02+0.005,t+0.04,t+0.05,fz+math.sin(a)*0.02-0.018,fz+math.sin(a)*0.02+0.018,CR) if k%2==0 else W(fx+d+math.cos(a)*0.02-0.018,fx+d+math.cos(a)*0.02+0.018,t+0.04,t+0.05,fz+math.sin(a)*0.02-0.005,fz+math.sin(a)*0.02+0.005,CR)
        Wc(fx+d,t+0.052,fz,0.008,0.012,mat('rotblau',0xb02a20 if d<0 else 0x2a40a0,var=0.05),v=8)
    # Herd (cremeweiß, Braunglas-Backofentür, Chromgriff, 4 Kochplatten) x −8.36 … −7.6
    x0,x1=-8.36,-7.6; W(x0,x1,0.02,0.9,1.88,Z1-0.02,EN,bev=0.006); W(x0+0.01,x1-0.01,0,0.02,1.92,Z1-0.04,BK)
    W(x0+0.01,x1-0.01,0.79,0.885,1.858,1.88,BK,bev=0.004)                     # Bedienblende
    for k,d in enumerate([-0.27,-0.18,-0.09,0.09,0.18,0.27]):
        if abs(d)<0.1 and k in (2,3): continue
        Wc((x0+x1)/2+d,0.838,1.845,0.018,0.026,mat('knopf',0xd8d0c0,var=0.05,rough=0.3),axis='z',v=16); W((x0+x1)/2+d-0.002,(x0+x1)/2+d+0.002,0.826,0.85,1.83,1.832,BK)
    W((x0+x1)/2-0.05,(x0+x1)/2+0.05,0.83,0.848,1.856,1.858,mat('uhrglas',0x2a3a2a,var=0.05,rough=0.1)); Wc((x0+x1)/2+0.065,0.838,1.856,0.006,0.004,mat('lampe_or',0x8a3a10),axis='z',v=8)
    W(x0+0.012,x1-0.012,0.2,0.775,1.862,1.88,EN,bev=0.006); W(x0+0.08,x1-0.08,0.3,0.66,1.858,1.862,BG,bev=0.003)   # Backofentür + Sichtfenster
    Wc((x0+x1)/2,0.73,1.815,0.011,x1-x0-0.14,CR,axis='x',v=12); [Wc(x,0.73,1.84,0.008,0.045,CR,axis='z',v=8) for x in (x0+0.08,x1-0.08)]
    W(x0+0.012,x1-0.012,0.035,0.185,1.862,1.88,EN,bev=0.006); W((x0+x1)/2-0.08,(x0+x1)/2+0.08,0.12,0.14,1.852,1.862,BK,bev=0.003)   # Schublade
    W(x0,x1,0.9,0.915,1.88,Z1-0.02,EN,bev=0.004)
    for cx,cz,r in [(x0+0.19,2.06,0.085),(x1-0.19,2.06,0.075),(x0+0.19,2.32,0.075),(x1-0.19,2.32,0.09)]:
        Wc(cx,0.918,cz,r+0.012,0.008,CR,v=28); Wc(cx,0.922,cz,r,0.008,PL,v=28); Wc(cx,0.927,cz,0.015,0.002,mat('rotp',0x8a1a10),v=10)
    # Oberschränke (Tiefe 0,35) + Mikrowellen-Umbau, Kranz
    UZ=2.15
    def upper(x0,x1,y0,y1,n):
        W(x0,x1,y0,y1,UZ+0.02,Z1,KO); w=(x1-x0)/n
        for i in range(n):
            a,b=x0+i*w+0.003,x0+(i+1)*w-0.003; panel_door(a,b,y0+0.005,y1-0.005,UZ+0.02,O,OH); bow(b-0.04 if i==0 and n==1 else (b-0.04 if i==0 else a+0.04),y0+0.08,UZ+0.009,True,MS)
    upper(-7.6,-7.0,1.45,2.35,1); upper(-8.4,-7.6,1.95,2.35,2); upper(-9.06,-8.4,1.97,2.35,1)
    # Mikrowellen-Umbau: Blende um die Öffnung (x −8.36…−7.64, y 1.49…1.91), Front z 2.13
    W(-8.4,-7.6,1.45,1.95,2.15,Z1,KO)
    for a in [(-8.4,-8.36,1.45,1.95),(-7.64,-7.6,1.45,1.95),(-8.36,-7.64,1.45,1.49),(-8.36,-7.64,1.91,1.95)]: W(a[0],a[1],a[2],a[3],2.13,2.15,OH)
    MWB=mat('mwfront',0x2a2620,var=0.08,scale=120,rough=0.35); W(-8.36,-7.64,1.49,1.91,2.131,2.15,MWB); W(-8.33,-7.9,1.55,1.85,2.1305,2.131,mat('mwrahmen',0x1a1816))
    Wc(-7.835,1.7,2.105,0.008,0.3,CR,v=10); [Wc(-7.835,1.7+d,2.118,0.006,0.025,CR,axis='z',v=8) for d in (-0.12,0.12)]
    W(-9.06,-7.0,2.35,2.42,UZ,Z1,OH,bev=0.006); W(-9.06,-7.0,2.42,2.6,UZ+0.03,Z1,KO)                 # Kranzleiste + Blende bis Decke
    # Gewürzbord links vom Fenster
    for y in (1.42,1.66): W(-10.66,-10.41,y,y+0.018,2.36,Z1,OH,bev=0.003)
    W(-10.67,-10.655,1.38,1.86,2.36,Z1,OH); W(-10.415,-10.4,1.38,1.86,2.36,Z1,OH)
    # Messerleiste + 3 Messer
    W(-9.1,-8.46,1.498,1.542,2.478,Z1-0.008,BK,bev=0.004)
    for x,L,w in [(-8.53,0.24,0.04),(-8.62,0.2,0.032),(-8.71,0.17,0.028)]:
        W(x-w/2,x+w/2,1.52-L,1.512,2.466,2.469,mat('klinge',0xd0d0cc,var=0.06,rough=0.2)); W(x-0.012,x+0.012,1.512,1.632,2.458,2.478,BK,bev=0.004)
    done('kue_zeile',TEX,rough=0.55,ao_k=0.85,ao_dist=0.12)
# ===================== 2) Kühlschrank (alt, vergilbt), Topf, Magnete/Zettel kommen aus mmk + Flyer hier =====================
if 'kuehl' in WHICH:
    reset(); MATS.clear(); OBJS.clear(); FW=mat('kuehl',0xd8d0b8,var=0.06,scale=60,dirt=0xa8986e,rough=0.35); BK=mat('schwarz',0x161512); CR=mat('chrom',0xb8b6ae,var=0.1,rough=0.25)
    X0,X1,ZF0=-11.45,-10.7,1.78
    W(X0,X1,0.04,1.75,ZF0+0.005,2.48,FW,bev=0.03,seg=3); W(X0+0.02,X1-0.02,0,0.06,ZF0+0.03,2.4,BK)
    W(X0+0.04,X1-0.04,0.065,0.13,ZF0-0.005,ZF0+0.01,mat('gitter',0x22201c))
    for y0,y1 in [(0.14,1.185),(1.215,1.745)]: W(X0+0.005,X1-0.005,y0,y1,ZF0-0.04,ZF0+0.005,FW,bev=0.022,seg=3)
    W(X0+0.02,X1-0.02,1.185,1.215,ZF0-0.03,ZF0,BK)
    for a,b in [(0.62,0.95),(1.3,1.6)]:
        Wc(X1-0.06,(a+b)/2,ZF0-0.085,0.012,b-a,CR,v=12); [Wc(X1-0.06,y,ZF0-0.06,0.008,0.05,CR,axis='z',v=8) for y in (a+0.02,b-0.02)]
    lbox(-11.26,-11.12,1.67,1.7,ZF0-0.045,ZF0-0.04,CR,{'-z':('frost.png',None,None)})                            # Typenschild
    # Topf oben (wie mmk), Deckel, Griffe
    px,pz,py=-11.05,2.12,1.75; Wl(px,py,pz,[(0.0,0.0),(0.15,0.0),(0.155,0.17),(0.15,0.17)],mat('topf',0x9a9a94,var=0.1,rough=0.3),seg=24)
    Wl(px,py+0.17,pz,[(0.162,0.0),(0.12,0.03),(0.03,0.045),(0.0,0.045)],mat('topf',0x9a9a94),seg=24); Wc(px,py+0.225,pz,0.02,0.03,BK,v=10)
    for s in (-1,1): W(px+s*0.155-0.012,px+s*0.155+0.012,py+0.13,py+0.15,pz-0.04,pz+0.04,BK)
    # Flyer + Postkarte + Magnete an der Tür (Zettel/Magnet „Hamster“ bleiben aus mmk)
    z=ZF0-0.0405
    lbox(-11.38,-11.18,1.48,1.62,z-0.001,z,FW,{'-z':('postkarte.png',None,None)}); Wc(-11.28,1.6,z-0.006,0.012,0.01,mat('mag_g',0x2a8a3a,rough=0.3),axis='z',v=12)
    lbox(-11.36,-11.15,0.82,1.115,z-0.001,z,FW,{'-z':('flyer_pizza.png',None,None)}); Wc(-11.255,1.09,z-0.006,0.012,0.01,mat('mag_y',0xd8b020,rough=0.3),axis='z',v=12)
    lbox(-11.1,-10.89,0.6,0.895,z-0.001,z,FW,{'-z':('flyer_video.png',None,None)}); Wc(-10.995,0.87,z-0.006,0.012,0.01,mat('mag_b',0x2a40a0,rough=0.3),axis='z',v=12)
    done('kue_kuehl',1024,rough=0.4,ao_k=0.85,ao_dist=0.1)
# ===================== 3) Eckbankgruppe (Eiche rustikal, Polster), Tisch mit Wachstuch, Stuhl, Zeitung/Tasse/Aschenbecher =====================
if 'ecke' in WHICH:
    reset(); MATS.clear(); OBJS.clear(); O=oak(); OH=oakh(); OD=oakd(); PO=imgmat('polster',LBL+'polster.png',scale=2.5,rough=0.9); WT=imgmat('wachs',V3+'/assets/apartment/kitchen/src/kue_wachstuch.png',scale=2.2,rough=0.4)
    X0,Z0=-11.5,-0.92; D=0.46; SH=0.44
    # Bank West (z −0.92…0.40) und Süd (x −11.5…−10.62)
    for (a0,a1,b0,b1) in [(X0,X0+D,Z0,0.40),(X0+D,-10.62,Z0,Z0+D)]:
        W(a0,a1,0.0,SH-0.06,b0,b1,OD); W(a0,a1,SH-0.06,SH-0.03,b0,b1,OH,bev=0.005)
    W(X0+D-0.02,X0+D,0.04,SH-0.07,Z0+D,0.38,O,bev=0.004); W(X0+D,-10.64,0.04,SH-0.07,Z0+D-0.02,Z0+D,O,bev=0.004)   # Frontblenden
    W(X0+0.02,X0+D,0,SH,0.38,0.40,OH,bev=0.005); W(-10.64,-10.62,0,SH,Z0+0.02,Z0+D,OH,bev=0.005)                     # Wangen
    for (a0,a1,b0,b1) in [(X0+0.06,X0+D-0.02,Z0+0.06,0.37),(X0+D-0.02,-10.65,Z0+0.06,Z0+D-0.02)]: subbox((a0+a1)/2,-(b0+b1)/2,SH+0.025,a1-a0,b1-b0,0.06,PO,lvl=1)
    # Rückenlehnen mit Polster, Abschlussbrett
    W(X0,X0+0.05,SH,0.98,Z0,0.40,O,bev=0.005); W(X0,-10.62,SH,0.98,Z0,Z0+0.05,O,bev=0.005)
    W(X0,X0+0.09,0.96,0.99,Z0,0.40,OH,bev=0.006); W(X0,-10.62,0.96,0.99,Z0,Z0+0.09,OH,bev=0.006)
    subbox(X0+0.085,-(Z0+0.12+0.37)/2,0.72,0.07,0.37-(Z0+0.12)+0.0,0.38,PO,lvl=1,rot=(0,-0.12,0)); subbox(-(10.65+11.38)/2,-(Z0+0.085),0.72,11.38-10.65,0.07,0.38,PO,lvl=1,rot=(0.12,0,0))
    # Tisch 0,7 × 1,0, gedrechselte Beine, Zarge, Wachstuch mit Überhang
    TX0,TX1,TZ0,TZ1,TY=-11.2,-10.5,-0.62,0.38,0.74
    for x in (TX0+0.06,TX1-0.06):
        for z in (TZ0+0.06,TZ1-0.06): Wl(x,0,z,[(0.028,0),(0.03,0.08),(0.022,0.14),(0.034,0.2),(0.022,0.28),(0.022,0.5),(0.034,0.56),(0.03,0.64),(0.03,TY-0.04),(0,TY-0.04)],OD,seg=12)
    W(TX0+0.04,TX1-0.04,TY-0.12,TY-0.035,TZ0+0.04,TZ1-0.04,O); W(TX0,TX1,TY-0.035,TY,TZ0,TZ1,OH,bev=0.006)
    W(TX0-0.12,TX1+0.12,TY,TY+0.003,TZ0-0.12,TZ1+0.12,WT)
    for (a0,a1,b0,b1) in [(TX0-0.12,TX1+0.12,TZ0-0.122,TZ0-0.119),(TX0-0.12,TX1+0.12,TZ1+0.119,TZ1+0.122)]: W(a0,a1,TY-0.11,TY+0.003,b0,b1,WT)
    for (a0,a1) in [(TX0-0.122,TX0-0.119),(TX1+0.119,TX1+0.122)]: W(a0,a1,TY-0.11,TY+0.003,TZ0-0.12,TZ1+0.12,WT)
    # Stuhl am Nordende (Blick nach Süden)
    cx,cz=-10.86,0.68; SW_=0.42
    for dx in (-0.18,0.18):
        for dz in (-0.18,0.18): W(cx+dx-0.018,cx+dx+0.018,0,SH-0.02 if dz<0 else 0.95,cz+dz-0.018,cz+dz+0.018,OD,bev=0.004)
    W(cx-SW_/2,cx+SW_/2,SH-0.03,SH,cz-SW_/2,cz+SW_/2,OH,bev=0.006); subbox(cx,-cz,SH+0.02,SW_-0.04,SW_-0.04,0.04,PO,lvl=1)
    for y in (0.62,0.78,0.9): W(cx-0.18,cx+0.18,y,y+0.05,cz+0.17,cz+0.2,O,bev=0.006)
    for dz in (-0.18,0.18): W(cx-0.17,cx+0.17,0.14,0.17,cz+dz-0.012,cz+dz+0.012,OD)
    # Auf dem Tisch: Zeitung, Tasse, Aschenbecher mit Kippen, Zuckerdose, Flakes, Milch
    ty=TY+0.003
    lbox(-11.06,-10.72,ty,ty+0.004,-0.38,0.08,mat('papier',0xd8d4c4),{'+y':('zeitung.png',((0,0,-1),(-1,0,0)),None)})   # liest man von der Bank (Westen) aus
    BR=mat('steingut',0x8a4a26,var=0.1,rough=0.3); WH=mat('porz',0xe6e2d8,var=0.05,rough=0.25)
    Wl(-10.64,ty,0.12,[(0,0),(0.035,0),(0.04,0.09),(0.037,0.09),(0.032,0.006),(0,0.006)],BR,seg=18); Wcable([(-10.6,ty+0.07,0.12),(-10.585,ty+0.05,0.12),(-10.6,ty+0.025,0.12)],0.006,BR)
    Wl(-10.9,ty,-0.5,[(0,0),(0.06,0),(0.065,0.03),(0.05,0.03),(0.045,0.01),(0,0.01)],mat('glas_ab',0x6a7a6a,var=0.1,rough=0.1),seg=20)
    for k in range(3): a=k*2.1; Wc(-10.9+math.cos(a)*0.025,ty+0.02,-0.5+math.sin(a)*0.025,0.005,0.03,mat('kippe',0xd8b070),axis='x' if k%2 else 'z',v=6)
    Wl(-10.66,ty,-0.3,[(0,0),(0.04,0),(0.05,0.06),(0.04,0.08),(0.015,0.085),(0.01,0.095),(0,0.095)],WH,seg=18)
    lbox(-10.86,-10.67,ty,ty+0.28,0.18,0.25,mat('pappe',0xd8a838),{'-z':('flakes_f.png',None,None),'+z':('flakes_f.png',None,None),'-x':('flakes_s.png',None,None),'+x':('flakes_s.png',None,None)})
    o=W(-11.12,-11.05,ty,ty+0.19,0.2,0.27,mat('mpk',0xf0f0ea)); label_faces(o,None,{'+x':('milch.png',None,None),'-z':('milch.png',None,None),'+z':('milch.png',None,None)})
    Wl(-11.085,ty+0.19,0.235,[(0.05,0),(0.0,0.03)],mat('mpk',0xf0f0ea),seg=4)
    done('kue_ecke',TEX,rough=0.6,ao_k=0.85,ao_dist=0.14)
# ===================== 4) Kram: Spüle, Herd, Arbeitsplatte, Bord, Fensterbank, Boden, Glühbirnen-Fassung =====================
if 'kram' in WHICH:
    reset(); MATS.clear(); OBJS.clear(); WH=mat('porz',0xe8e4da,var=0.05,rough=0.25); CR=mat('chrom',0xbcbcb6,var=0.1,rough=0.25); BK=mat('schwarz',0x151412)
    OH=oakh(); t=CT[1]
    # Spüle: Teller, Topf, Tasse, Besteck; Abtropfgitter mit Tellern; Spüli, Schwamm
    for k in range(3): Wl(-9.9+k*0.012,0.745+k*0.014,2.17,[(0,0),(0.08,0),(0.11,0.018),(0.105,0.02),(0.075,0.004),(0,0.004)],WH,seg=24)
    Wl(-9.66,0.745,2.24,[(0,0),(0.09,0),(0.095,0.1),(0.088,0.1),(0.083,0.006),(0,0.006)],mat('topf',0x8a8a84,var=0.1,rough=0.3),seg=22); Wc(-9.66,0.83,2.36,0.008,0.17,BK,axis='z',v=8)
    Wl(-9.85,0.79,2.3,[(0,0),(0.035,0),(0.042,0.08),(0.038,0.08),(0.031,0.005),(0,0.005)],mat('tasse_r',0xa83a28,var=0.05,rough=0.3),seg=16)
    for k in range(3): W(-9.79+k*0.02,-9.6+k*0.02,0.78+k*0.003,0.786+k*0.003,2.1-k*0.03,2.115-k*0.03,CR,rot=(0,0,0))
    for k in range(6): W(-9.45,-9.12,t+0.012+k*0.0,t+0.06,2.0+k*0.07,2.004+k*0.07,mat('gitter',0xd0d0cc,var=0.05))
    for k in range(4): Wl(-9.29,t+0.13,2.06+k*0.07,[(0,0),(0.08,0),(0.11,0.018),(0.105,0.02),(0.075,0.004),(0,0.004)],WH,seg=20) if False else None
    for k in range(4):
        o=Wc(-9.29,t+0.125,2.06+k*0.075,0.105,0.012,WH,axis='z',v=24)
    Wl(-9.2,t+0.012,2.38,[(0,0.0),(0.035,0),(0.042,0.08),(0.0,0.08)],mat('tasse_b',0x2a4a7a,var=0.05,rough=0.3),seg=14)
    lcyl(-10.0,t+0.11,2.44,0.03,0.2,mat('spuelfl',0x3aa050,rough=0.3),'spueli.png',band=(0.15,0.8)); Wc(-10.0,t+0.225,2.44,0.012,0.03,mat('kappe',0xe8e0d0),v=10)
    W(-10.1,-10.02,t+0.008,t+0.035,2.3,2.36,mat('schwamm',0xc8b830,var=0.25,scale=300)); W(-10.1,-10.02,t+0.035,t+0.042,2.3,2.36,mat('schwammg',0x2a6a30,var=0.2,scale=300))
    # Brotkasten (Eiche, Rollo-Front mit „Brot“) links neben der Spüle
    o=lbox(-10.6,-10.2,t,t+0.2,2.17,2.46,OH,{'-z':('brot.png',None,[0.0,1.0,0.0,1.0])},bev=0.012)
    for k in range(5): W(-10.595,-10.205,t+0.03+k*0.03,t+0.032+k*0.03,2.168,2.17,mat('rillen',0x5a3a1e))
    # Kaffeemaschine (Braun/Creme, 80er) rechts neben der Spüle
    KB=mat('kmasch',0x4a2e1c,var=0.08,rough=0.35); KC=mat('kcreme',0xd8cdb4,var=0.05,rough=0.35)
    W(-8.74,-8.5,t,t+0.03,2.18,2.44,KB,bev=0.008); W(-8.74,-8.5,t+0.03,t+0.33,2.34,2.44,KB,bev=0.01); W(-8.74,-8.5,t+0.25,t+0.33,2.16,2.34,KC,bev=0.01)
    Wl(-8.62,t+0.03,2.25,[(0,0),(0.07,0),(0.075,0.12),(0.065,0.14),(0.04,0.15),(0,0.15)],mat('kanne',0x3a2418,var=0.05,rough=0.08),seg=20); Wc(-8.62,t+0.17,2.25,0.04,0.02,BK,v=12)
    Wcable([(-8.55,t+0.14,2.22),(-8.5,t+0.12,2.21),(-8.55,t+0.05,2.22)],0.008,BK)
    # Ecke rechts (unter dem hohen Oberschrank): Kaffeepack, Dosen, Würze, Schneidbrett
    lbox(-7.5,-7.41,t,t+0.15,2.32,2.38,mat('kaffee',0x7a1a18),{'-z':('kaffee_f.png',None,None),'+x':('kaffee_s.png',None,None),'-x':('kaffee_s.png',None,None)})
    lcyl(-7.3,t+0.055,2.3,0.037,0.11,CR,'dose_eintopf.png',rot=0.25,band=(0.08,0.92)); lcyl(-7.2,t+0.055,2.4,0.037,0.11,CR,'dose_eintopf.png',rot=0.6,band=(0.08,0.92))
    lcyl(-7.16,t+0.165,2.4,0.037,0.11,CR,'dose_milch.png',rot=0.1,band=(0.08,0.92))
    Wl(-7.38,t,2.16,[(0,0),(0.03,0),(0.032,0.12),(0.016,0.16),(0.012,0.2),(0,0.2)],mat('wflasche',0x3a1a0c,var=0.05,rough=0.1),seg=14); lcyl(-7.38,t+0.06,2.16,0.0325,0.08,mat('wflasche',0x3a1a0c),'wuerze.png',band=(0.0,1.0))
    W(-7.08,-7.03,t,t+0.4,2.18,2.46,OH,bev=0.006,rot=None)
    # Herd: Flötenkessel (rot emailliert) hinten links, Pfanne vorne rechts, Geschirrtuch am Griff
    Wl(-8.17,0.93,2.32,[(0,0),(0.09,0),(0.1,0.05),(0.085,0.13),(0.03,0.16),(0.02,0.17),(0,0.17)],mat('kessel',0xa82a1c,var=0.06,rough=0.25),seg=22)
    Wcable([(-8.25,1.06,2.32),(-8.17,1.16,2.32),(-8.09,1.06,2.32)],0.008,BK); Wcable([(-8.12,1.0,2.28),(-8.09,1.04,2.22),(-8.075,1.07,2.2)],0.01,mat('kessel',0xa82a1c))
    Wl(-7.79,0.93,2.06,[(0,0),(0.11,0),(0.125,0.045),(0.118,0.045),(0.105,0.006),(0,0.006)],mat('pfanne',0x262422,var=0.1,rough=0.4),seg=24); Wc(-7.79,0.965,1.86,0.012,0.2,BK,axis='z',v=8)
    TW=imgmat('tuch',LBL+'polster.png',tint=0xffd0c0,scale=6,rough=0.9)
    W(-8.16,-7.92,0.58,0.745,1.793,1.797,TW,bev=0.001); W(-8.16,-7.92,0.725,0.745,1.797,1.83,TW)
    # Gewürzbord: 4 Dosen + Tüte
    for k in range(4): lcyl(-10.62+k*0.062,(1.438 if k<2 else 1.678)+0.05 if False else (1.438+0.045 if k%2==0 else 1.678+0.045),2.43,0.026,0.09,mat('gdose',0xc8c0b0,rough=0.3),'gewuerz%d.png'%k,band=(0.15,0.85))
    lcyl(-10.5,1.438+0.045,2.43,0.026,0.09,mat('gdose',0xc8c0b0),'gewuerz1.png',band=(0.15,0.85)); lcyl(-10.47,1.678+0.045,2.42,0.026,0.09,mat('gdose',0xc8c0b0),'gewuerz3.png',band=(0.15,0.85))
    # Fensterbank: Topfpflanze (Grünlilie) + Marmeladenglas mit Kugelschreibern
    Wl(-10.15,1.25,2.53,[(0,0),(0.05,0),(0.065,0.11),(0.07,0.12),(0,0.12)],mat('terrak',0xa05a34,var=0.1,rough=0.8),seg=16)
    LF=mat('blatt',0x4a6a2a,var=0.25,scale=80)
    for k in range(14):
        a=k*2.39; L=random.uniform(0.14,0.24); Wcable([(-10.15,1.37,2.53),(-10.15+math.cos(a)*L*0.5,1.37+L*0.5,2.53+math.sin(a)*L*0.35),(-10.15+math.cos(a)*L,1.37+L*0.25,2.53+math.sin(a)*L*0.6)],0.006,LF)
    Wl(-9.4,1.25,2.53,[(0,0),(0.035,0),(0.036,0.1),(0.032,0.11),(0,0.11)],mat('glas',0x8a9a8a,var=0.05,rough=0.1),seg=14)
    for k in range(3): Wc(-9.4+(k-1)*0.012,1.36,2.53,0.004,0.14,mat('kuli%d'%k,[0x2a40a0,0xa02a20,0x222222][k]),v=6)
    # Boden: Sprudelkiste mit Flaschen (NW-Ecke), Treteimer (Ostwand)
    KX=(-11.47,-11.1,1.3,1.68)
    lbox(KX[0],KX[1],0,0.27,KX[2],KX[3],mat('kiste',0x2a6aa8,rough=0.5),{'+x':('kiste.png',None,None),'-z':('kiste.png',None,None)},bev=0.01)
    GL=mat('flasche',0x3a5a3a,var=0.08,rough=0.1)
    for i in range(3):
        for j in range(4): x=KX[0]+0.06+i*0.125; z=KX[2]+0.05+j*0.093; Wl(x,0.2,z,[(0.03,0),(0.03,0.04),(0.014,0.09),(0.013,0.13),(0,0.13)],GL,seg=10) if (i*4+j)%5!=3 else None
    Wl(-7.2,0,1.62,[(0,0),(0.13,0),(0.14,0.4),(0.145,0.41),(0.14,0.43),(0,0.44)],mat('eimer',0xc8c4b8,var=0.08,rough=0.35),seg=24); W(-7.26,-7.14,0,0.025,1.45,1.5,BK)
    # Glühbirnen-Fassung + Kabel (Birne selbst = mmk)
    Wc(-9.35,2.45,0.55,0.004,0.3,BK,v=6); Wl(-9.35,2.335,0.55,[(0.0,0),(0.02,0),(0.022,0.06),(0.012,0.07),(0,0.07)],mat('fassung',0x2a2620,rough=0.4),seg=12); Wc(-9.35,2.595,0.55,0.035,0.01,mat('baldachin',0xd8d0c0),v=14)
    # Wandbord über der Eckbank mit Radio (GRUNDLOS) + Wanduhr Südwand
    W(-11.5,-11.2,1.3,1.32,-0.92,-0.58,OH,bev=0.003); W(-11.5,-11.48,1.2,1.3,-0.92,-0.58,OH)
    lbox(-11.46,-11.24,1.32,1.47,-0.88,-0.6,mat('radio',0x2a2622,rough=0.4),{'+x':('radio.png',None,None)},bev=0.006)
    Wc(-11.35,1.52,-0.65,0.004,0.12,CR,axis='y',v=6)
    Wc(-10.0,2.28,-0.905,0.13,0.03,mat('uhr',0xd8cfa8,var=0.05,rough=0.4),axis='z',v=32) if False else None
    done('kue_kram',TEX,rough=0.5,ao_k=0.85,ao_dist=0.08)

if 'wand' in WHICH:
    # Südwand rechts der Tür: Wandtelefon mit Wählscheibe (farngrün, 80er Post-Stil, ohne Marke), Spiralkabel, Anschlussdose; Telefonliste am Nagel mit Bleistift an Schnur
    reset(); MATS.clear(); OBJS.clear(); GR=mat('fgruen',0x56744e,var=0.05,rough=0.35); GD=mat('fgruend',0x3e5638,var=0.05,rough=0.4); WH=mat('dose',0xd8d2c2,var=0.05,rough=0.4)
    zW=-0.92
    W(-9.27,-9.09,1.36,1.58,zW,zW+0.085,GR,bev=0.018)
    lbox(-9.235,-9.125,1.405,1.515,zW+0.085,zW+0.091,GR,{'+z':('waehl.png',None,None)})
    W(-9.26,-9.10,1.575,1.595,zW+0.02,zW+0.075,GD,bev=0.006)                       # Gabel
    W(-9.29,-9.07,1.598,1.622,zW+0.035,zW+0.065,GR,bev=0.01)                        # Hörer: Griff
    W(-9.315,-9.245,1.592,1.65,zW+0.02,zW+0.08,GR,bev=0.014); W(-9.115,-9.045,1.592,1.65,zW+0.02,zW+0.08,GR,bev=0.014)   # Hör-/Sprechkapsel
    # Spiralkabel: Helix entlang eines Durchhangs vom Hörer links unten zur Gehäuseunterseite
    A=(-9.30,1.595,zW+0.05); Bm=(-9.33,1.10,zW+0.06); B=(-9.25,1.365,zW+0.05)
    def bz(t):
        return tuple((1-t)**2*A[i]+2*(1-t)*t*Bm[i]+t*t*B[i] for i in range(3))
    pts=[]; n=170
    for k in range(n+1):
        t=k/n; p=bz(t); q=bz(min(1,t+0.002)); a=k*0.9
        pts.append((p[0]+0.008*math.cos(a),p[1],p[2]+0.008*math.sin(a)))
    Wcable(pts,0.0022,GD)
    Wcable([(-9.12,1.365,zW+0.01),(-9.115,0.9,zW+0.006),(-9.12,0.4,zW+0.006),(-9.12,0.37,zW+0.012)],0.0025,mat('kabel',0x2a2a28))
    W(-9.16,-9.08,0.30,0.38,zW,zW+0.022,WH,bev=0.005)
    lbox(-8.93,-8.75,1.30,1.54,zW+0.001,zW+0.003,mat('papier',0xe8e2cc),{'+z':('telliste.png',None,None)})
    Wc(-8.84,1.531,zW+0.006,0.0025,0.012,mat('nagel',0x8a8a84,rough=0.3),axis='z',v=6)
    Wcable([(-8.84,1.53,zW+0.007),(-8.755,1.38,zW+0.008),(-8.735,1.24,zW+0.01)],0.0008,mat('schnur',0xc8c0a8))
    Wc(-8.735,1.17,zW+0.012,0.0038,0.15,mat('bleistift',0xd8b030,rough=0.5),axis='y',v=6)
    done('kue_wand',1024,rough=0.45,ao_k=0.85,ao_dist=0.05)
