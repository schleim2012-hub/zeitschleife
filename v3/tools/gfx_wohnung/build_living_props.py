# Blender headless: Wohnzimmer-Props (Eiche-rustikal-Schrankwand, Cord-Sofa + Sessel, 29"-Röhren-TV auf TV-Schrank mit Videorekorder, Couchtisch, Stehlampe)
# blender -b --factory-startup -P build_living_props.py -- OUTDIR [TEX=2048] [which=wall,polster,tv,table,lamp]
# Look-Referenz Schrankwand: Grok C7 (Captain Chaos). Eigene Modelle, prozedurale Materialien, Farbe+AO gebacken, 1 Material = 1 Draw pro GLB.
# Achsen: Blender Front −Y, Z hoch (glTF: Front +Z). Ursprung jeweils Mitte Unterkante (Schrankwand: Mitte Vorderkante unten).
import bpy, bmesh, sys, os, math, random
argv=sys.argv[sys.argv.index('--')+1:]; TEX=int(argv[1]) if len(argv)>1 else 2048
WHICH=(argv[2] if len(argv)>2 else 'wall,polster,tv,table,lamp').split(',')
random.seed(1989)
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
from props_lib import *
from mathutils import Matrix
OUT=argv[0]; import props_lib; props_lib.set_out(OUT)
TEXD=os.environ.get('LIV_TEX',OUT)  # granny.png
def cord(name,col,col2,scale=40.0,rough=0.95):
    # Cord-Stoff: feine Rippen längs Z/Y (Wave entlang X), etwas Glanzverlust/Abrieb über Noise
    if name in MATS: return MATS[name]
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; N=nt.nodes; L=nt.links; b=N['Principled BSDF']; b.inputs['Roughness'].default_value=rough
    tc=N.new('ShaderNodeTexCoord'); wv=N.new('ShaderNodeTexWave'); wv.wave_type='BANDS'; wv.bands_direction='X'; wv.inputs['Scale'].default_value=scale; wv.inputs['Distortion'].default_value=0.4; L.new(tc.outputs['Object'],wv.inputs[0])
    cr=N.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position=0.2; cr.color_ramp.elements[1].position=0.8; cr.color_ramp.elements[0].color=hexc(col2)+(1,); cr.color_ramp.elements[1].color=hexc(col)+(1,); L.new(wv.outputs['Fac'],cr.inputs[0])
    nz=N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=4; nz.inputs['Detail'].default_value=4; L.new(tc.outputs['Object'],nz.inputs['Vector'])
    r2=N.new('ShaderNodeValToRGB'); r2.color_ramp.elements[0].position=0.45; r2.color_ramp.elements[1].position=0.75; L.new(nz.outputs['Fac'],r2.inputs[0])
    mth=N.new('ShaderNodeMath'); mth.operation='MULTIPLY'; mth.inputs[1].default_value=0.35; L.new(r2.outputs[0],mth.inputs[0])
    mx=N.new('ShaderNodeMix'); mx.data_type='RGBA'; L.new(mth.outputs[0],mx.inputs['Factor']); L.new(cr.outputs[0],mx.inputs[6]); mx.inputs[7].default_value=hexc(0xa08060)+(1,)
    L.new(mx.outputs[2],b.inputs['Base Color']); MATS[name]=m; return m
def panel_door(cx,cy,cz,w,h,WD,WD2,arch=False):
    # Eiche-rustikal-Front: Rahmen + erhabene Füllung mit breiter Fase (cy = Vorderfläche Korpus)
    box(cx,cy-0.01,cz,w-0.004,0.02,h-0.004,WD,bev=0.004)
    box(cx,cy-0.024,cz-0.01*arch,w-0.12,0.014,h-0.13,WD2,bev=0.022,seg=3)
    if arch: cyl(cx,cy-0.022,cz+(h-0.13)/2-0.02,(w-0.12)/2,0.012,WD2,axis='Y',v=20,bev=0.01)
def knob(cx,cy,cz,BR): cyl(cx,cy-0.012,cz,0.014,0.024,BR,axis='Y',v=12,bev=0.004)
# ================= 1) Schrankwand 2,40 × 0,47 × 2,48 (Westwand) =================
if 'wall' in WHICH:
    reset(); MATS.clear(); OBJS.clear()
    WD=mat('oak',0x8a5e38,var=0.28,dirt=0x3a2414,rough=0.55,wood=True); WD2=mat('oak2',0x74492a,var=0.3,dirt=0x2e1c10,rough=0.55,wood=True)
    BK=mat('back',0x4e3220,var=0.2,wood=True); BR=mat('brass',0xb08a3c,var=0.2,scale=120,dirt=0x5a4420,rough=0.3)
    GLS=mat('glass',0xaab4b8,var=0.15,scale=200,rough=0.1); GLD=mat('glassd',0x6a7a7c,var=0.1,rough=0.1)
    LACE=mat('lace',0xe8e0cc,var=0.35,scale=400,dirt=0xc8b890)
    BOOK=[mat('b%d'%i,c,var=0.12,scale=80,dirt=0x2a2018) for i,c in enumerate([0x7a2a22,0x2a4466,0x34543a,0x9a8a64,0x4a3424,0x66587a,0xb0a080,0x8a5a2a,0x1e1e24,0xa04030])]
    LP=[mat('lp%d'%i,c,var=0.2,scale=60) for i,c in enumerate([0x2a1a3a,0xc8a030,0x205a5a,0x8a1a1a,0xd8d0c0,0x1a1a1a])]
    W=2.4; D=0.47; DU=0.36; H=2.48; X0,X1=-W/2,W/2
    S=[(0.4,1.2),(-0.4,0.4),(-1.2,-0.4)]  # Sektionen (x-Bereich): Bücher | Nische (Ghettoblaster) | Vitrine
    # Unterteil
    box(0,D/2+0.03,0.03,W-0.06,D-0.06,0.06,BK)                         # Sockel (zurückgesetzt)
    box(0,D/2,0.06+0.66/2,W,D,0.66,WD2)                                 # Korpus
    box(0,D/2-0.01,0.735,W+0.02,D+0.02,0.03,WD,bev=0.008)              # Abdeckplatte (Top 0,75)
    for (a,b) in S:
        if a>-0.39 and a<0.39:  # Mitte: 2 Schubladen + Klappe
            for k,zc in enumerate((0.62,0.5)): box((a+b)/2,-0.01,zc,b-a-0.012,0.02,0.11,WD,bev=0.004); box((a+b)/2,-0.022,zc,b-a-0.12,0.008,0.06,WD2,bev=0.004); knob((a+b)/2-0.12,-0.01,zc,BR); knob((a+b)/2+0.12,-0.01,zc,BR)
            panel_door((a+b)/2,0,0.255,b-a-0.012,0.37,WD,WD2); knob((a+b)/2,-0.03,0.4,BR)
        else:
            for s in (0,1):
                w=(b-a)/2; cx=a+w*(s+0.5); panel_door(cx,0,0.39,w-0.006,0.64,WD,WD2,arch=True); knob(cx+(w/2-0.05)*(1 if s==0 else -1),-0.03,0.42,BR)
    # Oberteil (Tiefe DU, Front bei y=D-DU)
    F=D-DU
    box(0,D-0.01,1.62,W,0.02,1.74,BK)                                    # Rückwand
    for x in (X0+0.0125,-0.4,0.4,X1-0.0125): box(x,F+DU/2,1.62,0.025 if abs(x)>1 else 0.03,DU,1.74,WD,bev=0.003)   # Seiten/Trennwände
    box(0,F+DU/2,2.44,W+0.04,DU+0.04,0.08,WD,bev=0.015,seg=3)             # Kranz oben
    box(0,F+DU/2-0.02,2.39,W+0.02,DU+0.02,0.025,WD2,bev=0.006)            # Kranz-Profil
    for (a,b) in S:
        cx=(a+b)/2; w=b-a-0.03
        for z in (1.15,1.55,1.95): box(cx,F+DU/2,z+0.0125,w,DU-0.02,0.025,(GLD if (a<-0.39 and z<1.9) else WD))   # Böden (Vitrine: Glas)
        # oben geschlossene Türen 1,975–2,375
        for s in (0,1): ww=w/2; panel_door(a+0.015+ww*(s+0.5),F,2.175,ww-0.004,0.39,WD,WD2); knob(a+0.015+ww*(s+0.5)+(ww/2-0.04)*(1 if s==0 else -1),F-0.03,2.05,BR)
    # --- Sektion 1: Bücher (1,175 / 1,575), Schallplatten (0,78) ---
    a,b=S[0]
    for zb in (1.175,1.575):
        x=a+0.03
        while x<b-0.05:
            t=random.uniform(0.022,0.05); h=random.uniform(0.19,0.33 if zb<1.5 else 0.3); dep=random.uniform(0.15,0.22); tilt=0.0
            if random.random()<0.05 and x>a+0.1: tilt=random.uniform(0.15,0.3)
            box(x+t/2,F+0.02+dep/2,zb+h/2*math.cos(tilt),t,dep,h,random.choice(BOOK),bev=0.002,rot=(0,tilt,0)); x+=t+0.003
            if random.random()<0.06: x+=random.uniform(0.06,0.14)
    x=a+0.04
    for i in range(26):  # LPs stehend
        t=0.006; box(x,F+0.17,0.78+0.155,t,0.31,0.31,random.choice(LP)); x+=t+random.uniform(0.003,0.012)
    box(b-0.16,F+0.12,0.78+0.06,0.22,0.2,0.12,BOOK[4],bev=0.01)             # Kiste/Fotoalbum liegend
    box(b-0.16,F+0.12,0.78+0.135,0.2,0.18,0.03,BOOK[0],bev=0.004)
    # --- Sektion 2: Nische: Häkeldeckchen unter dem Ghettoblaster, oben Nippes ---
    a,b=S[1]
    for zb,wd in ((1.175,0.62),(1.575,0.4)):
        cyl(0,F+0.17,zb+0.002,1.0,0.003,LACE,v=28); bpy.context.object.scale=(wd/2,0.15,1); bpy.ops.object.transform_apply(scale=True)
        for i in range(7): box(-wd*0.35+i*wd*0.7/6,F+0.006,zb-0.03,0.05,0.003,0.06,LACE,rot=(0,0,0))   # überhängende Zacken
    lathe(-0.22,F+0.16,1.575,[(0.0,0),(0.05,0.0),(0.06,0.04),(0.04,0.12),(0.025,0.17),(0.035,0.2),(0.0,0.2)],mat('vase',0x2a5a6a,var=0.3,scale=30,rough=0.2),seg=16)  # Vase
    lathe(0.18,F+0.18,1.575,[(0.0,0),(0.04,0),(0.04,0.015),(0.02,0.03),(0.022,0.08),(0.03,0.1),(0.015,0.13),(0.0,0.14)],mat('porz',0xe0d8c8,var=0.1,rough=0.25),seg=12)  # Porzellanfigur
    box(0.02,F+0.2,1.575+0.09,0.16,0.08,0.18,WD2,bev=0.01); cyl(0.02,F+0.159,1.575+0.11,0.055,0.004,mat('dial',0xd8d0b0,var=0.05),axis='Y',v=24)  # Tischuhr
    box(-0.2,F+0.2,1.975+0.0,0.0,0.0,0.0,WD) if False else None
    # Sektion 2 oben (1,95–1,975 offen?) nein: geschlossen. Unten in der Nische 0,78: Fernsehzeitschriften-Stapel + Telefonbuch
    for i in range(5): box(0.0+random.uniform(-0.01,0.01),F+0.16,0.78+0.006+i*0.012,0.24,0.3,0.011,random.choice(BOOK[:4]+[LACE]))
    box(-0.25,F+0.16,0.78+0.03,0.15,0.22,0.06,mat('tbuch',0xd8c040,var=0.1))
    # --- Sektion 3: Vitrine: Gläser, Karaffe, Sammeltassen; Glastüren (Scheiben im Spiel), Holzrahmen hier ---
    a,b=S[2]
    for zb in (0.78,1.175,1.575):
        n=7 if zb>1 else 5
        for i in range(n):
            x=a+0.07+i*(b-a-0.14)/(n-1); y=F+0.1+(i%2)*0.12
            kind=(i+int(zb*10))%3
            if kind==0: lathe(x,y,zb,[(0,0),(0.032,0),(0.032,0.004),(0.004,0.01),(0.004,0.1),(0.035,0.13),(0.04,0.18),(0.038,0.2),(0.0,0.17)],GLS,seg=12)      # Weinglas
            elif kind==1: lathe(x,y,zb,[(0,0),(0.03,0),(0.034,0.09),(0.032,0.095),(0.0,0.01)],GLS,seg=12)    # Becher
            else: lathe(x,y,zb,[(0,0),(0.035,0),(0.042,0.03),(0.045,0.05),(0.043,0.055),(0,0.02)],mat('tasse',0xe8e0d0,var=0.1,rough=0.2),seg=14); box(x,y-0.06,zb+0.003,0.11,0.11,0.004,mat('tasse',0xe8e0d0))  # Sammeltasse+Untertasse
    lathe((a+b)/2,F+0.2,1.175,[(0,0),(0.06,0),(0.075,0.08),(0.06,0.15),(0.02,0.2),(0.02,0.24),(0.03,0.26),(0,0.27)],GLD,seg=16)   # Karaffe
    for s in (0,1):   # Vitrinentür-Rahmen (Scheibe separat)
        ww=(b-a-0.03)/2; cx=a+0.015+ww*(s+0.5); z0,z1=0.78,1.95; zc=(z0+z1)/2; hh=z1-z0
        box(cx-ww/2+0.025,F-0.012,zc,0.05,0.022,hh,WD,bev=0.004); box(cx+ww/2-0.025,F-0.012,zc,0.05,0.022,hh,WD,bev=0.004)
        box(cx,F-0.012,z0+0.03,ww,0.022,0.06,WD,bev=0.004); box(cx,F-0.012,z1-0.03,ww,0.022,0.06,WD,bev=0.004)
        for k in (1,2): box(cx,F-0.008,z0+hh*k/3,ww-0.1,0.012,0.018,WD2)   # Sprossen
        knob(cx+(ww/2-0.05)*(1 if s==0 else -1),F-0.03,1.3,BR)
    ob=finish('wz_schrankwand',TEX,rough=0.6,ao_k=0.85,ao_dist=0.12); export('wz_schrankwand',[ob])
# ================= 2) Polster: 3-Sitzer-Cordsofa (Ursprung) + Sessel (relativ zur Sofa-Position, Weltdrehung 0,709) =================
def sofa_part(ox,oy,rz,W,D,BRN,BRN2,OAK,GR,blanket=False):
    objs0=len(OBJS); A=0.2
    box(0,0,0.05,W-0.1,D-0.1,0.1,OAK,bev=0.01)                                      # Holzsockel
    subbox(0,0.02,0.21,W-2*A+0.04,D-0.06,0.24,BRN2,lvl=2)                            # Sitzunterbau
    for s in (-1,1):
        subbox(s*(W/2-A/2),0,0.37,A,D,0.54,BRN,lvl=2)                                # Armlehnen
        box(s*(W/2-A/2),-0.01,0.655,A+0.03,D+0.02,0.035,OAK,bev=0.012,seg=3)          # Eiche-Auflage
    subbox(0,D/2-0.08,0.5,W-2*A+0.04,0.16,0.8,BRN2,lvl=2)                            # Rückenrahmen
    n=3 if W>1.5 else 1; cw=(W-2*A)/n
    for i in range(n):
        x=-W/2+A+cw*(i+0.5)
        subbox(x,-0.06,0.435,cw-0.01,D-0.2,0.22,BRN,lvl=2)                           # Sitzkissen (Top ≈0,54)
        subbox(x,D/2-0.2,0.72,cw-0.02,0.2,0.5,BRN,lvl=2,rot=(-0.16,0,0))             # Rückenkissen
        for k in range(3): box(x,-D/2+0.09,0.36+k*0.0,0.0,0,0,BRN) if False else None
    if blanket:   # Häkeldecke über Lehne + Kissen (rechts)
        bx=W/2-A-0.55
        box(bx,D/2-0.12,0.99,1.05,0.3,0.012,GR,rot=(0.25,0.04,0.0))
        box(bx,D/2-0.32,0.76,1.05,0.012,0.42,GR,rot=(-0.16,0.0,0.03))
        box(bx+0.02,-0.05,0.552,1.0,0.5,0.012,GR,rot=(0.04,0,0.05))
    for o in OBJS[objs0:]:
        o.matrix_world=Matrix.Translation((ox,oy,0))@Matrix.Rotation(rz,4,'Z')@o.matrix_world; bpy.context.view_layer.objects.active=o
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
if 'polster' in WHICH:
    reset(); MATS.clear(); OBJS.clear()
    BRN=cord('cord',0x8a5630,0x5e3a1e,scale=45); BRN2=cord('cord2',0x7a4a28,0x52321a,scale=45); OAK=mat('oak',0x8a5e38,var=0.28,dirt=0x3a2414,rough=0.55,wood=True)
    GR=imgmat('granny',os.path.join(TEXD,'granny.png'),scale=1.6,rough=1.0)
    sofa_part(0,0,0,2.7,0.88,BRN,BRN2,OAK,GR,blanket=True)
    # Sessel: Welt (19.35, 0.95), Sofa-Ursprung (21.85, −1.94) → Blender (−2.5, −(0.95+1.94)), Drehung um Z = Welt-Y 0,709
    sofa_part(-2.5,-2.89,0.709,0.9,0.86,BRN,BRN2,OAK,GR)
    ob=finish('wz_polster',TEX,rough=0.95,ao_k=0.85,ao_dist=0.15); export('wz_polster',[ob])
# ================= 3) TV-Schrank + 29"-Röhren-TV + Videorekorder (Ursprung Welt (21.65,0,2.12), im Spiel um π gedreht) =================
if 'tv' in WHICH:
    reset(); MATS.clear(); OBJS.clear()
    OAK=mat('oak',0x8a5e38,var=0.28,dirt=0x3a2414,rough=0.55,wood=True); OAK2=mat('oak2',0x74492a,var=0.3,dirt=0x2e1c10,wood=True); BR=mat('brass',0xb08a3c,var=0.2,scale=120,rough=0.3)
    DEC=mat('tvdecor',0x4a3424,var=0.3,dirt=0x241810,rough=0.45,wood=True); BLK=mat('tvblk',0x1c1b1a,var=0.12,scale=150,rough=0.4); SIL=mat('silver',0x8a8a8c,var=0.1,scale=150,rough=0.35)
    GLS=mat('tube',0x0a0c0c,var=0.04,rough=0.1); VCR=mat('vcr',0x232325,var=0.1,scale=150,rough=0.4); DSP=mat('disp',0x2a6a5a,var=0.2,scale=40)
    # Schrank: x −0.7..0.7, y −0.2..0.26, z 0..0.5; links (−x) Tür, rechts offenes Fach mit Rekorder
    box(0,0.03,0.025,1.34,0.4,0.05,OAK2); box(0,0.03,0.05+0.42/2,1.4,0.46,0.42,OAK2); box(0,0.03,0.485,1.42,0.48,0.03,OAK,bev=0.008)
    panel_door(-0.35,-0.2,0.265,0.68,0.40,OAK,OAK2); knob(-0.06,-0.23,0.3,BR)
    box(0.35,-0.195,0.265,0.66,0.012,0.4,mat('fach',0x2a1a10,var=0.2))            # Fach-Innen (dunkel)
    box(0.35,-0.05,0.28,0.66,0.3,0.015,OAK)                                       # Fachboden
    box(0.01,-0.1,0.265,0.02,0.2,0.42,OAK)
    # Rekorder (Welt-x 21.0..21.43 → lokal +0.22..+0.65, y 0.3..0.39)
    box(0.435,-0.0,0.345,0.43,0.33,0.09,VCR,bev=0.005); box(0.435,-0.166,0.355,0.42,0.004,0.06,BLK)
    box(0.37,-0.17,0.36,0.17,0.004,0.025,mat('slot',0x0a0a0a,var=0.05)); box(0.56,-0.17,0.37,0.08,0.004,0.02,DSP)
    for i in range(6): box(0.28+i*0.03,-0.17,0.328,0.02,0.006,0.01,SIL,bev=0.002)
    for i in range(4): box(0.15+i*0.1,-0.06,0.07+0.05,0.025,0.19,0.105,mat('vhs',0x141414,var=0.1),bev=0.002)    # VHS im Fach unten
    # --- Fernseher: Gehäuse 0.80×0.64×0.52, Unterkante 0.5; Bildöffnung 0.58×0.44, Mitte (0.04, −0.30, 0.83) ---
    Y0=0.5; FY=-0.29; sx,sz,sw,sh=0.04,0.83,0.58,0.44
    box(0,FY+0.26,Y0+0.32,0.8,0.52,0.64,DEC,bev=0.03,seg=3)
    taper(0,FY+0.52,Y0+0.33,0.66,0.52,0.2,0.62,0.6,BLK,bev=0.02)                     # Röhrenbauch hinten
    # Front-Blende (4 Teile) um die Öffnung
    fl,fr,ft,fb=-0.4,0.4,Y0+0.64,Y0
    box((fl+(sx-sw/2))/2,FY-0.004,sz,(sx-sw/2)-fl,0.012,ft-fb-0.02,BLK,bev=0.004)
    box(((sx+sw/2)+fr)/2,FY-0.004,sz,fr-(sx+sw/2),0.012,ft-fb-0.02,BLK,bev=0.004)
    box(sx,FY-0.004,(ft+sz+sh/2)/2,sw,0.012,ft-(sz+sh/2),BLK,bev=0.004); box(sx,FY-0.004,(fb+sz-sh/2)/2,sw,0.012,(sz-sh/2)-fb,BLK,bev=0.004)
    for (dx,dz,ww,hh) in [(0,sh/2+0.008,sw+0.03,0.016),(0,-sh/2-0.008,sw+0.03,0.016),(-sw/2-0.008,0,0.016,sh),(sw/2+0.008,0,0.016,sh)]: box(sx+dx,FY-0.008,sz+dz,ww,0.008,hh,SIL,bev=0.003)   # Zierring
    box(sx,FY+0.02,sz,sw+0.01,0.01,sh+0.01,GLS)                                       # Röhre (hinter dem Spiel-Bildschirm)
    # Bedienfeld links (lokal −x): Lautsprechergitter + Tasten
    for i in range(12): box(-0.33,FY-0.012,Y0+0.5-i*0.022,0.1,0.004,0.008,mat('grill',0x0c0c0c,var=0.05))
    for i in range(6): box(-0.36+(i%2)*0.05,FY-0.012,Y0+0.18-(i//2)*0.035,0.035,0.008,0.02,SIL,bev=0.002)
    box(-0.33,FY-0.012,Y0+0.06,0.06,0.01,0.025,SIL,bev=0.003); box(-0.25,FY-0.01,Y0+0.06,0.012,0.006,0.012,mat('led',0x5a1010,var=0.05))
    box(sx,FY-0.011,Y0+0.035,0.12,0.003,0.012,SIL)                                    # Typenschild (ohne Marke)
    # Zimmerantenne obenauf
    cyl(0.15,FY+0.3,Y0+0.66,0.05,0.04,BLK,v=16,bev=0.01)
    for s in (-1,1):
        bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=0.003,depth=0.5,location=(0.15+s*0.1,FY+0.3,Y0+0.88),rotation=(0,s*0.45,0)); add(bpy.context.object,SIL)
    ob=finish('wz_tv',1024,rough=0.5,ao_k=0.8,ao_dist=0.1); export('wz_tv',[ob])
# ================= 4) Couchtisch 1.2×0.76, Top 0.42, Rauchglas-Einlage =================
if 'table' in WHICH:
    reset(); MATS.clear(); OBJS.clear()
    OAK=mat('oak',0x8a5e38,var=0.28,dirt=0x3a2414,rough=0.55,wood=True); OAK2=mat('oak2',0x74492a,var=0.3,dirt=0x2e1c10,wood=True); SG=mat('smoke',0x2a2620,var=0.08,scale=20,rough=0.08)
    W,D=1.2,0.76
    for (x0,x1,y0,y1) in [(-W/2,W/2,-D/2,-D/2+0.1),(-W/2,W/2,D/2-0.1,D/2),(-W/2,-W/2+0.1,-D/2,D/2),(W/2-0.1,W/2,-D/2,D/2)]: box((x0+x1)/2,(y0+y1)/2,0.4,x1-x0,y1-y0,0.04,OAK,bev=0.01,seg=3)
    box(0,0,0.405,W-0.2,D-0.2,0.02,SG)                                               # Rauchglas (bündig)
    box(0,0,0.36,W-0.06,D-0.06,0.04,OAK2)                                            # Zarge
    for sx in (-1,1):
        for sy in (-1,1): lathe(sx*(W/2-0.06),sy*(D/2-0.06),0.0,[(0.0,0),(0.03,0),(0.025,0.04),(0.035,0.08),(0.022,0.16),(0.03,0.24),(0.035,0.3),(0.03,0.34),(0.0,0.34)],OAK2,seg=12)
    box(0,0,0.13,W-0.12,D-0.12,0.02,OAK)                                             # Ablage unten
    for i in range(3): box(-0.25+i*0.05,0.02,0.145+i*0.008,0.21,0.28,0.007,mat('mag%d'%i,[0xb02a20,0x2a5aa0,0xe0d8c0][i],var=0.2),rot=(0,0,0.2*i-0.2))
    ob=finish('wz_table',1024,rough=0.45,ao_k=0.8,ao_dist=0.1); export('wz_table',[ob])
# ================= 5) Stehlampe: Fuß + Rohr + Schirmhalter (Schirm bleibt Spielobjekt) =================
if 'lamp' in WHICH:
    reset(); MATS.clear(); OBJS.clear()
    BR=mat('brass',0xb89040,var=0.25,scale=90,dirt=0x5a4420,rough=0.3); DK=mat('dk',0x2a2418,var=0.1)
    lathe(0,0,0,[(0,0),(0.15,0),(0.15,0.012),(0.12,0.03),(0.04,0.045),(0.025,0.06),(0,0.06)],BR,seg=24)
    cyl(0,0,0.75,0.012,1.4,BR,v=10); lathe(0,0,0.5,[(0,0),(0.022,0.0),(0.026,0.03),(0.022,0.06),(0,0.06)],BR,seg=12)
    lathe(0,0,1.42,[(0,0),(0.03,0),(0.03,0.05),(0.016,0.07),(0,0.07)],BR,seg=12)
    cyl(0,0,1.5,0.018,0.1,mat('fass',0xd8d0b8,var=0.05),v=10)
    for a in range(3):
        an=a*2*math.pi/3; bpy.ops.mesh.primitive_cylinder_add(vertices=5,radius=0.004,depth=0.17,location=(math.cos(an)*0.08,math.sin(an)*0.08,1.48),rotation=(0,math.pi/2,an)); add(bpy.context.object,BR)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.17,minor_radius=0.004,location=(0,0,1.45)); add(bpy.context.object,BR)
    curve_cable([(0.01,0.0,0.05),(0.12,0.05,0.01),(0.4,0.15,0.006)],0.004,DK)
    ob=finish('wz_lamp',512,rough=0.35,metal=0.4,ao_k=0.6,ao_dist=0.05); export('wz_lamp',[ob])
