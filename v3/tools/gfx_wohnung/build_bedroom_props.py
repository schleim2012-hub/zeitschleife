# Blender headless: Schlafzimmer-Props (Jugendzimmer späte 80er): Kiefer-Jugendbett mit Regal-Kopfteil, Schreibtisch mit Schubladen-Container,
# TV-Rollwagen (Metall, Glasboden-Optik) mit Videorekorder, Kommode mit Radiorekorder + Kassetten. Farbe+AO gebacken, 1 Material = 1 Draw pro GLB.
# blender -b --factory-startup -P build_bedroom_props.py -- OUTDIR [TEX=1024] [which=bett,tisch,wagen,kommode]
# Achsen: Blender x = Welt x, Blender y = −Welt z (Bett/Tisch ohne Drehung); Wagen im Rahmen von bedExtra; Kommode Front −Y (im Spiel +π/2 → Front +x).
import bpy, sys, os, math, random
argv=sys.argv[sys.argv.index('--')+1:]; TEX=int(argv[1]) if len(argv)>1 else 1024
WHICH=(argv[2] if len(argv)>2 else 'bett,tisch,wagen,kommode').split(',')
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
