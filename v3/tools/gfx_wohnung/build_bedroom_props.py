# Blender headless: Schlafzimmer-Props (Jugendzimmer späte 80er): Kiefer-Jugendbett mit Regal-Kopfteil, Schreibtisch mit Schubladen-Container,
# TV-Rollwagen (Metall, Glasboden-Optik) mit Videorekorder, Kommode mit Radiorekorder + Kassetten. Farbe+AO gebacken, 1 Material = 1 Draw pro GLB.
# blender -b --factory-startup -P build_bedroom_props.py -- OUTDIR [TEX=1024] [which=bett,tisch,wagen,kommode]
# Achsen: Blender x = Welt x, Blender y = −Welt z (Bett/Tisch ohne Drehung); Wagen im Rahmen von bedExtra; Kommode Front −Y (im Spiel +π/2 → Front +x).
import bpy, sys, os, math, random
argv=sys.argv[sys.argv.index('--')+1:]; TEX=int(argv[1]) if len(argv)>1 else 1024
WHICH=(argv[2] if len(argv)>2 else 'bett,tisch,wagen,kommode,schrank,kram').split(',')
random.seed(1988)
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
from props_lib import *
OUT=argv[0]; import props_lib; props_lib.set_out(OUT)
def pine(): return mat('pine',0xb88a52,var=0.3,dirt=0x6a4a28,rough=0.5,wood=True)
def pine2(): return mat('pine2',0x9a6e3e,var=0.3,dirt=0x5a3a1e,rough=0.5,wood=True)
BOOKC=[0x7a2a22,0x2a4466,0x34543a,0x9a8a64,0x66587a,0xc8a030,0x1e1e24,0xa04030]
# ===== 1) Bett 0.93×2.0, Ursprung Mitte unten (Welt -1.615, 0, -0.96); Kopfteil bei y=+1.0 =====
if 'bett' in WHICH:
    reset(); MATS.clear(); OBJS.clear(); P=pine(); P2=pine2(); MT=mat('matr',0xd8cfbc,var=0.12,scale=40,dirt=0xb0a080,rough=0.95); SL=mat('slat',0x8a6038,var=0.2,wood=True)
    W,L=0.93,2.0
    for s in (-1,1): box(s*(W/2-0.02),0,0.2,0.04,L-0.06,0.2,P,bev=0.008)            # Seitenholme
    box(0,-L/2+0.03,0.25,W,0.05,0.5,P,bev=0.01)                                       # Fußteil
    box(0,-L/2+0.03,0.5,W+0.02,0.06,0.03,P2,bev=0.01)
    for s in (-1,1): box(s*(W/2+0.005),-L/2+0.03,0.25,0.05,0.07,0.52,P2,bev=0.01)    # Pfosten Fuß
    for i in range(14): box(0,-L/2+0.12+i*0.135,0.28,W-0.1,0.07,0.015,SL)            # Lattenrost
    subbox(0,0.0,0.37,W-0.06,L-0.1,0.17,MT,lvl=1)                                       # Matratze (Top ≈0,46)
    # Kopfteil mit Regal (Tiefe 0,22): Rückwand, Boden, Seiten, Wecker, Bücher, Kassetten
    H0=0.88; box(0,L/2-0.02,H0/2,W+0.04,0.04,H0,P,bev=0.01)
    for s in (-1,1): box(s*(W/2+0.01),L/2-0.12,H0/2+0.02,0.05,0.24,H0+0.04,P2,bev=0.012)
    box(0,L/2-0.12,0.62,W,0.22,0.025,P,bev=0.006); box(0,L/2-0.12,H0+0.015,W+0.08,0.26,0.03,P2,bev=0.01)
    for i in range(5): box(0,L/2-0.2,0.5+i*0.02,W-0.06,0.012,0.01,P2)                # Lamellen-Front unten (80er)
    x=-W/2+0.06
    for i in range(9): t=random.uniform(0.02,0.04); box(x,L/2-0.12,0.632+0.1,t,0.15,random.uniform(0.15,0.2),mat('bk%d'%(i%8),BOOKC[i%8],var=0.12)); x+=t+0.004
    box(0.2,L/2-0.13,0.632+0.05,0.12,0.06,0.1,mat('wecker',0xc83020,var=0.1,rough=0.3),bev=0.015); cyl(0.2,L/2-0.161,0.632+0.055,0.035,0.004,mat('ziff',0xe8e0c8,var=0.05),axis='Y',v=20)
    for i in range(4): box(0.36,L/2-0.12,0.632+0.008+i*0.016,0.11,0.07,0.015,mat('mc',[0x222222,0xc8c0b0,0x3355aa,0xaa3333][i],var=0.1))
    ob=finish('sz_bett',TEX,rough=0.6,ao_k=0.85,ao_dist=0.12); export('sz_bett',[ob])
# ===== 2) Schreibtisch 0.6×1.3, Top 0.745–0.775, Ursprung Mitte unten (Welt 1.78, 0, -0.25); Container bei Welt z 0.0..0.4 → y −0.25..−0.65 =====
if 'tisch' in WHICH:
    reset(); MATS.clear(); OBJS.clear(); P=pine(); P2=pine2(); BR=mat('griff',0x3a2a1a,var=0.1,rough=0.4)
    box(0,0,0.76,0.62,1.32,0.03,P,bev=0.008)
    box(0.0,-0.45,0.375,0.58,0.4,0.72,P2,bev=0.006)                                    # Container
    for k,(zc,hh) in enumerate([(0.62,0.16),(0.44,0.18),(0.2,0.28)]):
        box(-0.292,-0.45,zc,0.012,0.38,hh-0.012,P,bev=0.004); box(-0.302,-0.45,zc+hh/2-0.04,0.012,0.12,0.02,BR,bev=0.004)
    for sy in (0.6,):
        for sx in (-0.26,0.26): box(sx,sy,0.37,0.04,0.04,0.74,P2,bev=0.006)
    box(0,0.6,0.66,0.52,0.03,0.08,P2)                                                     # Zarge Beinseite
    box(0.28,0.0,0.66,0.03,1.2,0.08,P2)                                                   # Rückblende (Wandseite +x)
    # Schreibunterlage + Stifteköcher + Zettel
    box(-0.02,0.1,0.777,0.42,0.55,0.004,mat('unterl',0x2a4a3a,var=0.1,rough=0.7))
    lathe(0.18,0.35,0.775,[(0,0),(0.03,0),(0.03,0.1),(0,0.1)],mat('koecher',0xc83a2a,var=0.1,rough=0.4),seg=12)
    for i in range(4): cyl(0.18+random.uniform(-0.015,0.015),0.35+random.uniform(-0.015,0.015),0.9,0.004,0.13,mat('stift%d'%i,[0x2244aa,0xaa2222,0x222222,0x22aa44][i]),v=6)
    box(-0.1,-0.2,0.778,0.15,0.2,0.002,mat('zettel',0xe8e2c8,var=0.05),rot=(0,0,0.3))
    ob=finish('sz_tisch',TEX,rough=0.55,ao_k=0.85,ao_dist=0.1); export('sz_tisch',[ob])
# ===== 3) TV-Rollwagen im bedExtra-Rahmen: x −0.5..0.5, (lokal z −0.28..0.28 → y), Böden 0.12/0.52, TV steht auf 0.545 =====
if 'wagen' in WHICH:
    reset(); MATS.clear(); OBJS.clear(); CH=mat('chrom',0x9a9a9e,var=0.15,scale=150,dirt=0x5a5040,rough=0.25); BL=mat('blackgl',0x18181a,var=0.1,rough=0.15); RB=mat('rad',0x111111,var=0.05)
    VC=mat('vcr',0x232325,var=0.1,scale=150,rough=0.4); SIL=mat('silver',0x8a8a8c,var=0.1); DSP=mat('disp',0x2a7a5a,var=0.2)
    for y in (0.12,0.52): box(0,0,y+0.012,1.0,0.56,0.024,BL,bev=0.004); box(0,0,y+0.026,1.0,0.56,0.004,CH) if False else None
    for sx in (-0.485,0.485):
        for sy in (-0.265,0.265):
            cyl(sx,sy,0.3,0.012,0.5,CH,v=12); cyl(sx,sy,0.03,0.028,0.024,RB,axis='X',v=14); box(sx,sy,0.052,0.03,0.02,0.02,CH)
    for sy in (-0.265,0.265):
        for z in (0.12,0.52): cyl(0,sy,z+0.01,0.008,0.97,CH,axis='X',v=8)
    # Videorekorder auf dem unteren Boden (alter Batch: x −0.2..0.2, z −0.22..0.1)
    box(0,0.06,0.19,0.42,0.33,0.09,VC,bev=0.005); box(0,0.06-0.166,0.2,0.41,0.004,0.06,mat('front',0x111113,var=0.05))
    box(-0.08,-0.11,0.205,0.17,0.004,0.025,mat('slot',0x080808)); box(0.12,-0.11,0.215,0.08,0.004,0.02,DSP)
    for i in range(5): box(-0.15+i*0.03,-0.11,0.175,0.02,0.006,0.01,SIL,bev=0.002)
    for i in range(3): box(-0.36+i*0.012,0.08,0.145+i*0.026,0.19,0.105,0.025,mat('vhs%d'%i,[0x1a1a1a,0x2a1a10,0x101820][i]))
    ob=finish('sz_wagen',512,rough=0.35,metal=0.3,ao_k=0.8,ao_dist=0.08); export('sz_wagen',[ob])
# ===== 4) Kommode 0.8 breit × 0.45 tief × 0.85 hoch, Front −Y, Ursprung Mitte Vorderkante unten; Radiorekorder + Kassetten oben =====
if 'kommode' in WHICH:
    reset(); MATS.clear(); OBJS.clear(); WH=mat('lack',0xd8d2c4,var=0.08,scale=60,dirt=0xa89878,rough=0.35); P=pine(); BR=mat('griffk',0xb08a3c,var=0.2,rough=0.3)
    D=0.45; box(0,D/2,0.06,0.76,D-0.04,0.12,mat('sockel',0x2a2420,var=0.1))
    box(0,D/2,0.12+0.7/2,0.8,D,0.7,WH,bev=0.008); box(0,D/2-0.005,0.835,0.84,D+0.02,0.03,P,bev=0.008)
    for k in range(4):
        zc=0.12+0.7-0.09-k*0.172; box(0,-0.008,zc,0.77,0.016,0.16,WH,bev=0.006); box(0,-0.02,zc+0.04,0.24,0.012,0.022,BR,bev=0.008)
    # Radiorekorder (Stereo, 2 Lautsprecher, Kassettenfach, Antenne)
    GB=mat('gb',0x2a2a2e,var=0.1,scale=120,rough=0.45); GR=mat('grill',0x111111,var=0.05); SV=mat('gbs',0xb8b8bc,var=0.1,rough=0.3)
    box(-0.1,0.2,0.85+0.11,0.5,0.13,0.22,GB,bev=0.02)
    for sx in (-0.27,0.07): cyl(-0.1+sx+0.1,0.2-0.067,0.85+0.1,0.07,0.012,GR,axis='Y',v=24); cyl(-0.1+sx+0.1,0.2-0.07,0.85+0.1,0.075,0.004,SV,axis='Y',v=24)
    box(-0.1,0.2-0.068,0.85+0.1,0.13,0.008,0.09,mat('deck',0x1a1a1c,var=0.05)); box(-0.1,0.2-0.07,0.85+0.1,0.07,0.004,0.035,mat('fenster',0x4a4a50,var=0.1,rough=0.1))
    for i in range(6): box(-0.21+i*0.044,0.2,0.85+0.226,0.03,0.04,0.012,SV,bev=0.003)
    box(-0.1,0.2,0.85+0.26,0.46,0.016,0.016,SV,bev=0.006)                            # Griff
    bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=0.003,depth=0.45,location=(0.1,0.24,0.85+0.42),rotation=(0.25,0.35,0)); add(bpy.context.object,SV)
    for i in range(5): box(0.27,0.2,0.85+0.008+i*0.017,0.11,0.07,0.016,mat('mk%d'%i,[0x222222,0xc8c0b0,0x3355aa,0xaa3333,0xd8a020][i],var=0.1))
    box(0.27,0.1,0.85+0.1,0.07,0.012,0.11,mat('foto',0xc8b898,var=0.2),rot=(0.2,0,0.1))   # Bilderrahmen
    ob=finish('sz_kommode',TEX,rough=0.45,ao_k=0.85,ao_dist=0.1); export('sz_kommode',[ob])
# ===== 5) Kleiderschrank Kiefer, 2-türig, 1,0 × 0,58 × 1,95; Ursprung Mitte Grundfläche; Front +Y (= Welt −z, zum Raum); Koffer + Schuhkarton oben =====
if 'schrank' in WHICH:
    reset(); MATS.clear(); OBJS.clear(); P=mat('pineS',0xb48a56,var=0.13,dirt=0x6a4a28,rough=0.5,wood=True); P2=mat('pineS2',0x9a7044,var=0.13,dirt=0x5a3a1e,rough=0.5,wood=True); BR=mat('messing',0xa88a48,var=0.2,rough=0.3); DK=mat('fuge',0x1a120a,var=0.05)
    W,D,H=1.0,0.58,1.95; y0=-D/2
    box(0,0,0.05,W-0.04,D-0.04,0.1,mat('sockel',0x3a2a1a,var=0.1))                     # Sockel
    for s in (-1,1): box(s*(W/2-0.0125),0,H/2,0.025,D,H-0.02,P,bev=0.004)             # Seiten
    box(0,y0+0.012,H/2,W-0.04,0.012,H-0.1,P2)                                             # Rückwand
    box(0,0,H-0.02,W+0.05,D+0.04,0.04,P2,bev=0.012); box(0,0.0,H-0.055,W+0.02,D+0.015,0.03,P,bev=0.01)  # Kranz
    box(0,D/2-0.012,H/2+0.05,0.01,0.004,H-0.24,DK)                                          # Fuge zwischen den Türen
    for s in (-1,1):
        cx=s*(W/4); dw=W/2-0.03; dh=H-0.2; cz=0.1+dh/2+0.02
        box(cx,D/2-0.012,cz,dw,0.022,dh,P,bev=0.004)                                         # Türblatt
        for (zz,hh) in ((cz+dh*0.22,dh*0.42),(cz-dh*0.26,dh*0.36)):                         # Kassetten (Rahmen + Füllung)
            box(cx,D/2+0.001,zz+hh/2-0.02,dw-0.1,0.008,0.03,P2,bev=0.003); box(cx,D/2+0.001,zz-hh/2+0.02,dw-0.1,0.008,0.03,P2,bev=0.003)
            box(cx-(dw/2-0.065),D/2+0.001,zz,0.03,0.008,hh-0.04,P2,bev=0.003); box(cx+(dw/2-0.065),D/2+0.001,zz,0.03,0.008,hh-0.04,P2,bev=0.003)
        cyl(s*0.04,D/2+0.012,1.05,0.013,0.03,BR,axis='Y',v=14,bev=0.004)                    # Knauf
    box(0.075,D/2+0.0,1.12,0.006,0.004,0.016,DK)                                            # Schlüsselloch
    # Koffer + Schuhkarton
    box(-0.12,0.02,H+0.11,0.62,0.4,0.18,mat('koffer',0x5a3a28,var=0.15,scale=80,rough=0.55),bev=0.03)
    for xx in (-0.3,0.06): box(xx,0.02,H+0.11,0.03,0.405,0.185,mat('riemen',0x2a1a10,var=0.1),bev=0.006)
    box(-0.12,0.222,H+0.21,0.14,0.02,0.02,mat('kgriff',0x1a1008,var=0.1),bev=0.006)
    box(0.33,-0.05,H+0.07,0.3,0.19,0.11,mat('karton',0xa88a60,var=0.15,scale=40,rough=0.85),bev=0.004); box(0.33,-0.05,H+0.128,0.31,0.2,0.012,mat('deckel',0xc8b088,var=0.12),bev=0.003)
    ob=finish('sz_schrank',1024,rough=0.55,ao_k=0.85,ao_dist=0.12); export('sz_schrank',[ob])
# ===== 6) Kram (Set-Dressing, Welt-Koordinaten: Blender (x, −z, y)): Turnschuhe, Rucksack, Wäschehaufen, Comic-Stapel, Papierkorb =====
def W2B(x,y,z): return (x,-z,y)
def lumpy(o,amt,seed):
    rnd=random.Random(seed)
    for v in o.data.vertices: v.co.x+=rnd.uniform(-amt,amt); v.co.y+=rnd.uniform(-amt,amt); v.co.z+=rnd.uniform(-amt,amt)*0.6
    for v in o.data.vertices: v.co.z=max(v.co.z,0.0)
if 'kram' in WHICH:
    reset(); MATS.clear(); OBJS.clear()
    WS=mat('sohle',0xb8b0a0,var=0.1,rough=0.8,dirt=0x5a5040); UP=mat('obers',0x2c3450,var=0.14,scale=200,dirt=0x1a1e2a,rough=0.85); NV=mat('navy',0xc8c4b8,var=0.12,rough=0.8); RD=mat('rot',0xa83030,var=0.1)
    def sneaker(x,z,ry):
        bx,by,bz=W2B(x,0,z); c,s=math.cos(ry),math.sin(ry)
        def P(dx,dy): return (bx+dx*c-dy*s, by+dx*s+dy*c)
        px,py=P(0,0); o=box(px,py,0.015,0.1,0.28,0.03,WS,bev=0.012,rot=(0,0,ry))
        px,py=P(0,-0.02); o=subbox(px,py,0.065,0.092,0.24,0.08,UP,lvl=2,rot=(0,0,ry))
        for v in o.data.vertices:
            ly=(v.co.x-px)*(-s)+(v.co.y-py)*c
            if ly>0.06: v.co.z=0.03+(v.co.z-0.03)*max(0.35,1-(ly-0.06)*7)
            if ly<-0.08: v.co.z=0.03+(v.co.z-0.03)*1.15
        px,py=P(0,-0.07); cyl(px,py,0.112,0.032,0.02,mat('innen',0x2a2622,var=0.1),v=14)
        px,py=P(0.047,-0.02); box(px,py,0.06,0.006,0.14,0.022,NV,rot=(0,0,ry+0.25))
        px,py=P(-0.047,-0.02); box(px,py,0.06,0.006,0.14,0.022,NV,rot=(0,0,ry-0.25))
        px,py=P(0,-0.125); box(px,py,0.06,0.07,0.012,0.04,RD,rot=(0,0,ry))
    sneaker(0.22,1.78,0.3); sneaker(0.36,1.62,1.75)
    # Rucksack an der rechten Wand (Welt x≈1,97, z≈0,75), leicht angelehnt
    bx,by,_=W2B(1.93,0,0.78); CV=mat('canvas',0x4a5a3a,var=0.12,scale=180,dirt=0x2a301e,rough=0.9); LT=mat('leder',0x3a2618,var=0.1)
    o=subbox(bx,by,0.22,0.17,0.32,0.42,CV,lvl=2,rot=(0,-0.18,0)); lumpy(o,0.006,3)
    o=subbox(bx-0.09,by,0.16,0.06,0.24,0.18,CV,lvl=2,rot=(0,-0.18,0))
    box(bx-0.12,by,0.27,0.012,0.2,0.012,LT,rot=(0,-0.18,0)); box(bx-0.035,by,0.41,0.1,0.24,0.03,LT,bev=0.01,rot=(0,-0.18,0))
    for dy in (-0.09,0.09): box(bx-0.105,by+dy,0.17,0.012,0.03,0.012,mat('schnalle',0x9a9a9a,var=0.1,rough=0.3))
    # Wäschehaufen unterm Fenster (Welt 0,85 / −1,72): Jeans, Pulli, T-Shirt, Socke
    bx,by,_=W2B(0.85,0,-1.72)
    for (dx,dy,sx,sy,sz,col,rz,sd) in [(0,0,0.42,0.3,0.06,0x3a5078,0.3,11),(0.05,0.03,0.34,0.28,0.07,0x8a2a2a,-0.4,12),(-0.06,-0.03,0.26,0.2,0.05,0xb8b4a8,0.9,13),(0.12,-0.1,0.1,0.06,0.03,0xd8d8d0,0.2,14)]:
        zz=sz/2+(0.035 if col!=0x3a5078 else 0)+(0.03 if col==0xb8b4a8 else 0)
        o=subbox(bx+dx,by+dy,zz,sx,sy,sz,mat('w%x'%col,col,var=0.15,scale=160,rough=0.95),lvl=2,rot=(0,0,rz)); lumpy(o,0.012,sd)
    # Comic-/Heftstapel neben dem Bett (Welt −0,95 / −0,55)
    bx,by,_=W2B(-1.0,0,-1.12); CC=[0xc83a2a,0x2a5aa8,0xe8c040,0x3a8a4a,0xe8e0d0,0x8a3a8a,0xd86a20]
    for i in range(7): box(bx+random.uniform(-0.015,0.015),by+random.uniform(-0.015,0.015),0.004+i*0.0085,0.17,0.25,0.007,mat('h%d'%i,CC[i],var=0.25,scale=30,rough=0.7),rot=(0,0,random.uniform(-0.25,0.25)))
    # Papierkorb (Welt 1,9 / −1,25) mit Papierknäueln
    bx,by,_=W2B(1.88,0,-1.25); PK=mat('korb',0x3a4a48,var=0.1,rough=0.5)
    lathe(bx,by,0,[(0.0,0.0),(0.1,0.0),(0.12,0.27),(0.125,0.28),(0.118,0.28),(0.098,0.012),(0.0,0.012)],PK,seg=20)
    PP=mat('papier',0xe8e4d8,var=0.1,scale=50,rough=0.95)
    for i,(dx,dy,dz) in enumerate([(0.02,0.01,0.25),(-0.04,0.03,0.24),(0.03,-0.04,0.235),(0.18,0.06,0.03)]):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=0.04,location=(bx+dx,by+dy,dz)); o=bpy.context.object; add(o,PP); lumpy(o,0.012,30+i)
        for v in o.data.vertices: v.co.z=max(v.co.z,0.0)
    # Fensterbank (Oberkante 0,9025, Welt z −1,98): Kaktus im Tontopf, Zauberwürfel-Parodie
    bx,by,bz=W2B(0.05,0.9025,-1.93); TT=mat('ton',0xa85a38,var=0.15,scale=60,rough=0.85)
    lathe(bx,by,bz,[(0,0),(0.045,0),(0.058,0.09),(0.062,0.1),(0.0,0.1)],TT,seg=18); cyl(bx,by,bz+0.095,0.052,0.01,mat('erde',0x2a1e14,var=0.2),v=16)
    KG=mat('kaktus',0x3a6a3a,var=0.2,scale=90,rough=0.7)
    o=subbox(bx,by,bz+0.16,0.07,0.07,0.13,KG,lvl=2); o2=subbox(bx+0.035,by,bz+0.18,0.035,0.035,0.06,KG,lvl=2,rot=(0,0.5,0))
    bx,by,bz=W2B(0.78,0.9025,-1.92); CB=mat('cube_k',0x151515,var=0.05)
    box(bx,by,bz+0.028,0.056,0.056,0.056,CB,bev=0.004,rot=(0,0,0.35))
    cols=[0xc82a20,0x2a6ac8,0xe8c020,0x2a9a3a,0xe86a10,0xe8e8e0]; ca,sa=math.cos(0.35),math.sin(0.35)
    for i in range(3):
        for j in range(3):
            # Oberseite + zwei Seiten, durcheinander
            ox=(i-1)*0.0185; oy=(j-1)*0.0185; box(bx+ox*ca-oy*sa,by+ox*sa+oy*ca,bz+0.0565,0.016,0.016,0.002,mat('cf%d'%((i*3+j*2)%6),cols[(i*3+j*2)%6],var=0.05,rough=0.3),rot=(0,0,0.35))
            fx=bx+(i-1)*0.0185*ca-0.0285*sa*-1; 
    for i in range(3):
        for k in range(3):
            ox=(i-1)*0.0185; px=bx+ox*ca-(-0.0285)*sa; py=by+ox*sa+(-0.0285)*ca
            box(px,py,bz+0.0095+k*0.0185,0.016,0.002,0.016,mat('cf%d'%((i+k*4+1)%6),cols[(i+k*4+1)%6],var=0.05,rough=0.3),rot=(0,0,0.35))
    # Schreibtisch (Oberkante 0,778): Kassettenspieler mit Kopfhörer, Heft
    bx,by,bz=W2B(1.72,0.778,0.12); WK=mat('walk',0x9a2a2a,var=0.08,rough=0.35); SV2=mat('wsilber',0xa8a8ac,var=0.08,rough=0.3)
    box(bx,by,bz+0.016,0.09,0.13,0.032,WK,bev=0.006,rot=(0,0,0.3)); box(bx,by,bz+0.033,0.07,0.075,0.003,mat('wfen',0x2a2a30,var=0.05,rough=0.1),rot=(0,0,0.3))
    for i in range(4): box(bx-0.05*math.cos(0.3)+ (i-1.5)*0.016*math.sin(0.3)*-1, by-0.05*math.sin(0.3)+(i-1.5)*0.016*math.cos(0.3), bz+0.03, 0.006,0.012,0.006, SV2, rot=(0,0,0.3))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.075,minor_radius=0.006,major_segments=24,minor_segments=6,location=(bx-0.1,by+0.08,bz+0.009),rotation=(0,0,0.8)); o=bpy.context.object; add(o,mat('kbuegel',0x1a1a1a,var=0.05,rough=0.4))
    for t in (-1,1): cyl(bx-0.1+t*0.075*math.cos(0.8),by+0.08+t*0.075*math.sin(0.8),bz+0.012,0.024,0.018,mat('kpolster',0xc86a20,var=0.15,scale=200,rough=0.95),v=16)
    curve_cable([(bx-0.1,by+0.005,bz+0.012),(bx-0.06,by-0.02,bz+0.003),(bx-0.02,by-0.02,bz+0.003),(bx-0.03,by+0.03,bz+0.012)],0.0018,mat('kkabel',0x111111,var=0.05))
    bx,by,bz=W2B(1.62,0.778,-0.15); box(bx,by,bz+0.004,0.16,0.22,0.007,mat('heft',0x2a5a9a,var=0.1,rough=0.7),rot=(0,0,-0.15)); box(bx+0.01,by,bz+0.0085,0.145,0.205,0.002,mat('heftp',0xe8e4d8,var=0.06),rot=(0,0,-0.15))
    # Lichtschalter + Steckdose neben der Tür (Front-Wand z=2, Tür x 1,01..1,99): Creme-Wippe, 80er
    SW=mat('schalter',0xd8d0b8,var=0.06,rough=0.4)
    bx,by,_=W2B(0.9,0,1.996); box(bx,by,1.05,0.08,0.012,0.08,SW,bev=0.004); box(bx,by-0.008,1.05,0.05,0.006,0.05,mat('wippe',0xe4dcc8,var=0.05,rough=0.35),bev=0.003)
    box(bx,by,0.3,0.075,0.012,0.075,SW,bev=0.004); cyl(bx,by-0.007,0.3,0.022,0.004,mat('dose',0xc8c0a8,var=0.05),axis='Y',v=18)
    ob=finish('sz_kram',1024,rough=0.85,ao_k=0.85,ao_dist=0.1); export('sz_kram',[ob])
