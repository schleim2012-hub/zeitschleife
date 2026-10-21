# Blender headless: Büro-Props (90er-PC: CRT + Mini-Tower + Tastatur + Maus, Aktenschrank-Reihe, Holztür + Zarge)
# blender -b --factory-startup -P build_office_props.py -- OUTDIR [TEX=1024] [which=pc,cab,door]
# Eigene Modelle (prozedurale Materialien, Farbe+AO gebacken in eine ≤1K-JPG-Textur, 1 Material = 1 Draw Call pro GLB)
import bpy, bmesh, sys, os, math, random
import numpy as np
argv=sys.argv[sys.argv.index('--')+1:]; OUT=argv[0]; TEX=int(argv[1]) if len(argv)>1 else 1024
WHICH=(argv[2] if len(argv)>2 else 'pc,cab,door').split(',')
random.seed(1996)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from props_lib import *
OUT=argv[0]; import props_lib; props_lib.set_out(OUT)
# ============ 1) 90er-PC (Blender: Front −Y, Z hoch; glTF: Front +Z) ============
# Monitor-Ursprung: Mitte Unterkante Standfuß. Bildschirmöffnung 0,30×0,225 m, Mitte (0, −FY, SY)  → im Spiel pcScr
if 'pc' in WHICH:
    reset(); MATS.clear(); OBJS.clear()
    BEI=mat('beige',0xc9bf9f,var=0.06,scale=90,dirt=0xa89668,rough=0.55); BEI2=mat('beige2',0xbdb293,var=0.07,scale=90,dirt=0x9a8a60)
    DK=mat('dark',0x242320,var=0.15,scale=120,rough=0.7); GL=mat('glass',0x0d100e,var=0.05,rough=0.2); KEY=mat('key',0xd4cbb0,var=0.05,scale=200,dirt=0xa08f62)
    GREY=mat('grey',0x8d8676,var=0.08); CAB=mat('cable',0x1d1c1a,var=0.1)
    # --- Monitor ---
    BW,BH,BD=0.38,0.355,0.045; SY=0.035+BH/2+0.008; FY=0.15  # Front bei y=-FY
    sw,sh=0.30,0.225
    # Rahmen um die Bildöffnung (4 Teile), abgerundet
    box(0,-FY+BD/2,SY+(sh/2+(BH-sh)/4)+0.0, BW,BD,(BH-sh)/2, BEI,bev=0.012,seg=3)
    box(0,-FY+BD/2,SY-(sh/2+(BH-sh)/4)-0.0, BW,BD,(BH-sh)/2, BEI,bev=0.012,seg=3)
    box(-(sw/2+(BW-sw)/4),-FY+BD/2,SY, (BW-sw)/2,BD,sh+0.002, BEI,bev=0.012,seg=3)
    box( (sw/2+(BW-sw)/4),-FY+BD/2,SY, (BW-sw)/2,BD,sh+0.002, BEI,bev=0.012,seg=3)
    # innere Fase (dunkler Ring) + Röhre dahinter
    for (dx,dz,sx,sz) in [(0,sh/2+0.004,sw+0.016,0.008),(0,-sh/2-0.004,sw+0.016,0.008),(-sw/2-0.004,0,0.008,sh),(sw/2+0.004,0,0.008,sh)]:
        box(dx,-FY+0.006,SY+dz,sx,0.012,sz,BEI2,bev=0.002)
    box(0,-FY+0.03,SY,sw+0.01,0.01,sh+0.01,GL)
    # Gehäuse hinten (verjüngt) + Rücken-Kasten
    taper(0,-FY+BD,SY,BW-0.01,BH-0.012,0.22,0.84,0.86,BEI,bev=0.01,dz=0.01)
    taper(0,-FY+BD+0.22,SY+0.01,(BW-0.01)*0.84,(BH-0.012)*0.86,0.12,0.62,0.6,BEI2,bev=0.012,dz=0.0)
    for i in range(11):  # Lüftungsschlitze oben
        box(-0.13+i*0.026,-FY+BD+0.17,SY+(BH-0.012)*0.86/2*0.98+0.012,0.012,0.11,0.006,DK)
    # Bedienleiste unten
    box(0,-FY-0.002,SY-BH/2+0.018,0.30,0.006,0.014,BEI2,bev=0.002)
    for i in range(4): box(0.06+i*0.022,-FY-0.006,SY-BH/2+0.018,0.014,0.006,0.008,GREY,bev=0.001)
    box(-0.13,-FY-0.006,SY-BH/2+0.018,0.02,0.008,0.01,GREY,bev=0.002)  # Netzschalter
    box(-0.15,-FY-0.004,SY+BH/2-0.02,0.04,0.003,0.012,DK)  # Typenschild (ohne Marke)
    # Fuß (dreh-/neigbar)
    cyl(0,0.02,0.012,0.11,0.024,BEI2,v=28,bev=0.006); taper(0,-0.06,0.05,0.16,0.03,0.16,0.8,1.0,BEI2,bev=0.006)
    # --- Mini-Tower links vom Monitor (Nutzersicht; Nutzer schaut auf die −Y-Front, links = −X)
    TX,TW,TD,TH=-0.36,0.19,0.42,0.40; ty=-0.18
    box(TX,ty+TD/2,TH/2,TW,TD,TH,BEI,bev=0.008,seg=3)
    box(TX,ty-0.006,TH/2,TW-0.01,0.014,TH-0.006,BEI2,bev=0.005)   # Frontblende
    # 5,25"-Schächte (CD-ROM + Blende)
    box(TX,ty-0.014,TH-0.06,0.150,0.006,0.042,mat('cd',0x2b2a27,var=0.1),bev=0.002)
    box(TX,ty-0.018,TH-0.068,0.120,0.004,0.004,DK); box(TX+0.058,ty-0.019,TH-0.05,0.012,0.006,0.006,GREY,bev=0.001); box(TX-0.06,ty-0.017,TH-0.045,0.004,0.003,0.004,mat('led_or',0x6a4a10))
    box(TX,ty-0.014,TH-0.11,0.150,0.004,0.042,BEI,bev=0.002)
    # 3,5"-Diskette
    box(TX,ty-0.014,TH-0.16,0.104,0.005,0.026,BEI,bev=0.002); box(TX-0.01,ty-0.018,TH-0.157,0.075,0.004,0.004,DK); box(TX+0.036,ty-0.018,TH-0.166,0.01,0.004,0.006,GREY,bev=0.001)
    # Schalter, Reset, Schloss, LEDs (LED-Position fürs Spiel: Front, x=TX+0.05, z=TH-0.215)
    box(TX-0.045,ty-0.016,TH-0.215,0.03,0.008,0.03,BEI2,bev=0.004); box(TX+0.012,ty-0.016,TH-0.215,0.012,0.006,0.012,GREY,bev=0.002)
    cyl(TX+0.05,ty-0.014,TH-0.24,0.009,0.006,GREY,axis='Y',v=14); box(TX+0.05,ty-0.0185,TH-0.215,0.006,0.002,0.004,DK)
    for i in range(9): box(TX,ty-0.016,0.035+i*0.012,0.14,0.004,0.005,DK)   # Lüftungsgitter unten
    box(TX+TW/2+0.0005,ty+TD/2,TH/2,0.002,TD-0.03,TH-0.03,BEI2)            # Seitendeckel-Fuge
    # --- Tastatur (vor dem Monitor) ---
    KY=-0.36; box(0.0,KY,0.014,0.46,0.17,0.022,BEI,bev=0.006,rot=(math.radians(-5),0,0))
    rows=[(15,0.0275),(15,0.0275),(14,0.0275),(13,0.0275),(12,0.0275)]
    for r,(n,w) in enumerate(rows):
        y=KY-0.055+r*0.03; z=0.03+r*0.0027
        for i in range(n):
            x=-0.205+i*w+(r*0.006)
            if x>0.2: break
            box(x,y,z,w-0.004,0.024,0.012,KEY if (i not in (0,n-1)) else mat('key2',0xa9a08a,var=0.05),bev=0.0015,seg=1)
    box(-0.03,KY-0.085,0.027,0.15,0.024,0.012,KEY,bev=0.0015,seg=1)  # Leertaste
    # --- Maus + Kabel ---
    taper(0.31,-0.34,0.012,0.06,0.024,0.1,0.85,0.7,BEI,bev=0.01,dz=0.0); box(0.31,-0.337,0.025,0.002,0.03,0.004,DK)
    curve_cable([(0.31,-0.24,0.008),(0.3,-0.05,0.005),(0.05,0.26,0.01),(TX+0.02,0.2,0.08)],0.0028,CAB)
    curve_cable([(0.0,0.21,0.12),(-0.05,0.3,0.05),(-0.2,0.3,0.01),(TX+0.06,0.24,0.1)],0.004,CAB)
    curve_cable([(-0.02,KY+0.09,0.02),(-0.08,-0.12,0.005),(-0.2,0.05,0.004),(TX+0.05,0.21,0.06)],0.0028,CAB)
    ob=finish('office_pc',TEX,rough=0.55,ao_k=0.75,ao_dist=0.06); export('office_pc',[ob])
    print('PCINFO screen_center',(0,SY,-FY+0.03),'led',(TX+0.05,TH-0.215,ty-0.0185))

# ============ 2) Aktenschrank-Reihe: 4 Schränke à 0,475 m, Front −Y, Breite entlang X (−0,95..0,95), Tiefe 0,48, Höhe 1,32 ============
if 'cab' in WHICH:
    reset(); MATS.clear(); OBJS.clear()
    P=mat('olive',0x6c7260,var=0.12,scale=35,dirt=0x4a4636,rough=0.5); P2=mat('olive2',0x5f6555,var=0.12,scale=35,dirt=0x3e3a2c,rough=0.55)
    CHR=mat('chrome',0xa9a89c,var=0.18,scale=150,dirt=0x6a5a3a,rough=0.3); DK=mat('dk',0x1a1a18,var=0.1); CARD=mat('card',0xe0d6b4,var=0.08,scale=80,dirt=0xb8a070)
    FOLD=[mat('f1',0xc7a86a,var=0.1),mat('f2',0x7d8a5c,var=0.1),mat('f3',0xb07040,var=0.1)]
    W,D,H=0.46,0.48,1.32
    for c in range(4):
        cx=-0.95+c*0.475+W/2
        box(cx,D/2,H/2+0.02,W,D,H-0.04,P,bev=0.006)                 # Korpus
        box(cx,D/2-0.005,H-0.004,W+0.004,D+0.004,0.012,P2,bev=0.004)  # Deckel-Kante
        box(cx,0.02,0.025,W-0.04,0.02,0.05,DK)                         # Sockel zurückgesetzt
        for j in range(4):
            y0=0.06+j*0.315; hh=0.295; zc=y0+hh/2; opened=(c==2 and j==1); oy=-0.30 if opened else 0.0
            box(cx,-0.008+oy,zc,W-0.022,0.018,hh,P,bev=0.007,seg=2)   # Schubladenfront
            box(cx,-0.018+oy,zc,W-0.06,0.002,hh-0.04,P2)               # eingeprägtes Feld
            # Griff (Bügel) + Griffmulde
            box(cx,-0.021+oy,zc+0.05,0.15,0.004,0.035,DK)
            box(cx,-0.036+oy,zc+0.05,0.13,0.012,0.012,CHR,bev=0.004); box(cx-0.062,-0.028+oy,zc+0.05,0.008,0.016,0.012,CHR); box(cx+0.062,-0.028+oy,zc+0.05,0.008,0.016,0.012,CHR)
            # Etikettrahmen + Karte
            box(cx,-0.02+oy,zc+0.1,0.085,0.004,0.042,CHR,bev=0.001); box(cx,-0.023+oy,zc+0.1,0.07,0.002,0.03,CARD)
            if opened:  # Schubladenkasten + Hängeregister
                for sx in (-1,1): box(cx+sx*(W/2-0.03),oy+0.15,zc-0.02,0.01,0.3,hh-0.06,P2)
                box(cx,oy+0.15,y0+0.03,W-0.06,0.3,0.008,P2); box(cx,oy+0.3,zc-0.02,W-0.06,0.01,hh-0.06,P2)
                for k in range(9):
                    fm=FOLD[k%3]; yy=oy+0.03+k*0.03; tilt=random.uniform(-0.12,0.12)
                    box(cx+random.uniform(-0.01,0.01),yy,zc+0.01,W-0.09,0.004,0.24,fm,rot=(tilt,0,0))
                    box(cx-0.12+(k%4)*0.08,yy,zc+0.145,0.05,0.004,0.018,CARD,rot=(tilt,0,0))
        cyl(cx+0.17,-0.019,H-0.045,0.009,0.01,CHR,axis='Y',v=12)  # Schloss
    ob=finish('office_cabinets',TEX,metal=0.25,rough=0.55,ao_k=0.8,ao_dist=0.1); export('office_cabinets',[ob])

# ============ 3) Tür: Blatt 0,9×2,05×0,045 (Ursprung Mitte unten) + Zarge separat; Front −Y ============
if 'door' in WHICH:
    for part in ('leaf','frame'):
        reset(); MATS.clear(); OBJS.clear()
        WD=mat('wood',0x6a4a30,var=0.25,dirt=0x2a1a10,rough=0.6,wood=True); WD2=mat('wood2',0x583c26,var=0.25,dirt=0x22140a,rough=0.6,wood=True)
        W,H,T=0.9,2.05,0.045
        if part=='leaf':
            box(0,0,H/2,W,T-0.012,H,WD2,bev=0.003)  # Kern
            for s in (-1,1):  # beidseitig Rahmen + Füllungen
                y=s*(T/2-0.006)
                box(-W/2+0.06,y,H/2,0.12,0.012,H,WD,bev=0.003); box(W/2-0.06,y,H/2,0.12,0.012,H,WD,bev=0.003)
                for z,hh in ((0.11,0.22),(1.0,0.16),(H-0.07,0.14)): box(0,y,z,W-0.24,0.012,hh,WD,bev=0.003)
                box(0,y,0.55+0.0,0.08,0.012,0.68,WD,bev=0.003); box(0,y,1.55,0.08,0.012,0.76,WD,bev=0.003)
                for (px,pz,pw,ph) in ((-0.165,0.555,0.25,0.66),(0.165,0.555,0.25,0.66),(-0.165,1.55,0.25,0.74),(0.165,1.55,0.25,0.74)):
                    box(px,y*0.6,pz,pw,0.016,ph,WD2,bev=0.025,seg=3)   # erhabene Füllung mit breiter Fase
            ob=finish('office_door_leaf',512,rough=0.6,ao_k=0.5,ao_dist=0.03); export('office_door_leaf',[ob])
        else:
            for sx in (-1,1): box(sx*(W/2+0.045),0,(H+0.08)/2,0.09,0.15,H+0.08,WD,bev=0.012,seg=3)
            box(0,0,H+0.045,W+0.18,0.15,0.09,WD,bev=0.012,seg=3)
            ob=finish('office_door_frame',256,rough=0.6,ao_k=0.6,ao_dist=0.05); export('office_door_frame',[ob])
