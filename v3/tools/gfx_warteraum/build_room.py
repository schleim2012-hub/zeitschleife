# Warteraum (Jenseits-Bürgeramt) – komplette Szene in Blender 4.2 headless bauen, Licht backen (Cycles), GLB + Lightmap exportieren.
# blender -b -P build_room.py -- [--nobake] [--lm 2048] [--spp 128]
import bpy, bmesh, sys, os, math, random, json
from mathutils import Vector, Matrix
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from wr_lib import *
import wr_lib
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
NOBAKE='--nobake' in argv; LM=int(argv[argv.index('--lm')+1]) if '--lm' in argv else 2048; SPP=int(argv[argv.index('--spp')+1]) if '--spp' in argv else 128
HERE=os.path.dirname(os.path.abspath(__file__)); AS=os.path.abspath(os.path.join(HERE,'../../assets/warteraum')); SRC=AS+'/src'
ATL=json.load(open(SRC+'/atlas.json'))['signs']
random.seed(11)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.device='CPU'
# ------------------------------------------------------------------ Materialien
def img(n,non_color=False):
    i=bpy.data.images.load(SRC+'/'+n,check_existing=True)
    if non_color: i.colorspace_settings.name='Non-Color'
    return i
def M(name,tex=None,nrm=None,rough=0.6,metal=0.0,alpha=None,emit=None,nrm_str=1.0):
    m=bpy.data.materials.new(name); m.use_nodes=True; N=m.node_tree.nodes; L=m.node_tree.links; b=N['Principled BSDF']
    b.inputs['Roughness'].default_value=rough; b.inputs['Metallic'].default_value=metal
    vc=N.new('ShaderNodeVertexColor'); vc.layer_name='Col'
    if tex:
        t=N.new('ShaderNodeTexImage'); t.image=img(tex); mx=N.new('ShaderNodeMix'); mx.data_type='RGBA'; mx.blend_type='MULTIPLY'; mx.inputs['Factor'].default_value=1.0
        L.new(t.outputs['Color'],mx.inputs[6]); L.new(vc.outputs['Color'],mx.inputs[7]); L.new(mx.outputs[2],b.inputs['Base Color'])
    else: L.new(vc.outputs['Color'],b.inputs['Base Color'])
    if nrm:
        t2=N.new('ShaderNodeTexImage'); t2.image=img(nrm,True); nm=N.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value=nrm_str; L.new(t2.outputs['Color'],nm.inputs['Color']); L.new(nm.outputs['Normal'],b.inputs['Normal'])
    if alpha is not None: b.inputs['Alpha'].default_value=alpha; m.blend_method='BLEND'
    if emit: b.inputs['Emission Color'].default_value=hexc(emit[0]); b.inputs['Emission Strength'].default_value=emit[1]
    return m
MT=dict(
 floor=M('wr_floor','floor_col.png','floor_nrm.png',0.55,nrm_str=0.6), wall=M('wr_wall','wall_col.png','wall_nrm.png',0.7,0.15), ceil=M('wr_ceil','ceil_col.png',None,0.95),
 corr=M('wr_corr','metal_col.png',None,0.5,0.45), crack=M('wr_crackle','crackle_col.png','crackle_nrm.png',0.35), wood=M('wr_wood','wood_col.png',None,0.55),
 fabric=M('wr_fabric','fabric_col.png',None,0.92), vinyl=M('wr_vinyl','fig_col.png',None,0.42), metal=M('wr_metal',None,None,0.38,0.75), shade=M('wr_shade','shade_col.png',None,0.9),
 paint=M('wr_paint','paintings.png',None,0.45), signs=M('wr_signs','signs.png',None,0.5), paper=M('wr_paper','paper.png',None,0.85),
 glass=M('wr_glass',None,None,0.08,0.0,alpha=0.15), redglass=M('wr_redglass',None,None,0.25), fig=M('wr_fig','fig_col.png',None,0.62),
 emit=M('wr_emit',None,None,1.0,emit=(0x9cff7a,6.0)), flip=M('wr_flip',None,None,0.6), noexit=M('wr_noexit','signs.png',None,0.5),
 pinup=M('wr_pinup','pinups.png',None,0.38),
 sofa=M('wr_sofa','fabric_col.png',None,0.85))   # v7b: Stoff-Textur (Webmuster + Flecken) statt glattem Kunstleder   # v7: Sofa mit eigenem Material – Licht als Vertexfarbe gebacken (Hunyuan-UV-Inseln machten Flecken in der Lightmap)   # v4: Pin-ups (gen_beetle.py) – eigene, austauschbare Textur
AX={}
MOVERS=[]  # bewegliche Teile (eigene Objekte, Ursprung = Gelenk)
# ------------------------------------------------------------------ Raumhülle (Caligari: schräge Wände, Boden flach y=0)
V=Vector
SW,SE,NE,NW=V((-3,-2.5,0)),V((3,-2.5,0)),V((2.85,2.5,0)),V((-2.85,2.5,0))
SWt,SEt,NEt,NWt=V((-3.0,-2.5,2.75)),V((2.88,-2.5,2.75)),V((2.73,2.68,2.6)),V((-2.85,2.68,2.6))
WALLS={'N':(NW,NE,NWt,NEt),'E':(NE,SE,NEt,SEt),'S':(SE,SW,SEt,SWt),'W':(SW,NW,SWt,NWt)}
def bil(W,s,t):
    p00,p10,p01,p11=W; return (p00.lerp(p10,s)).lerp(p01.lerp(p11,s),t)
def wlen(W): return (W[1]-W[0]).length
def wH(W,s): return (bil(W,s,1)-bil(W,s,0)).length
def wnorm(W,s,t):
    e=1e-3; ds=bil(W,min(1,s+e),t)-bil(W,max(0,s-e),t); dt=bil(W,s,min(1,t+e))-bil(W,s,max(0,t-e)); n=ds.cross(dt); n.normalize(); return n
def WP(W,a,b,c=0.0):
    L=wlen(W); s=a/L; t=b/wH(W,min(1,max(0,s))); return bil(W,s,t)+wnorm(W,min(1,max(0,s)),min(1,max(0,t)))*c
def onwall(o,W):
    for v in o.data.vertices: v.co=WP(W,v.co.x,v.co.z,v.co.y)
    o.data.update(); return o
def wall_mesh(key,holes,mat,uvs=1.6):
    W=WALLS[key]; L=wlen(W); H=max(wH(W,0),wH(W,1))
    A=sorted(set([0,L]+[h[0] for h in holes]+[h[1] for h in holes]+[i*0.5 for i in range(1,int(L/0.5)+1) if i*0.5<L]))
    B=sorted(set([0,H]+[h[2] for h in holes]+[h[3] for h in holes]+[0.12,0.35,0.9,1.8,H-0.3]))
    verts=[];faces=[];idx={}
    def vi(a,b):
        k=(round(a,4),round(b,4))
        if k not in idx:
            s=a/L; t=min(1,b/H) if b<H-1e-6 else 1.0
            idx[k]=len(verts); verts.append(bil(W,s,t))
        return idx[k]
    for i in range(len(A)-1):
        for j in range(len(B)-1):
            a0,a1,b0,b1=A[i],A[i+1],B[j],B[j+1]; ca,cb=(a0+a1)/2,(b0+b1)/2
            if any(h[0]<=ca<=h[1] and h[2]<=cb<=h[3] for h in holes): continue
            faces.append((vi(a0,b0),vi(a1,b0),vi(a1,b1),vi(a0,b1)))
    o=mesh_obj('wall_'+key,verts,faces,mat)
    inv={v:k for k,v in idx.items()}; ul=o.data.uv_layers.new(name='UVMap')
    for li,l in enumerate(o.data.loops): a,b=inv[l.vertex_index]; ul.data[li].uv=(a/uvs,b/uvs)
    return o
def grid_quad(name,P00,P10,P01,P11,nu,nv,mat,uvfn):
    verts=[];faces=[]
    for j in range(nv+1):
        for i in range(nu+1): verts.append((P00.lerp(P10,i/nu)).lerp(P01.lerp(P11,i/nu),j/nv))
    for j in range(nv):
        for i in range(nu): a=j*(nu+1)+i; faces.append((a,a+1,a+nu+2,a+nu+1))
    o=mesh_obj(name,verts,faces,mat); ul=o.data.uv_layers.new(name='UVMap')
    for li,l in enumerate(o.data.loops): ul.data[li].uv=uvfn(o.data.vertices[l.vertex_index].co)
    return o
# Boden: Schachbrett diagonal, Fliesen werden zur Schalterwand hin kleiner und leicht verdreht (gegen die Perspektive)
TILE=0.62
def floor_uv(p):
    k=1.0+0.11*(p.y+2.5)/5.0; a=math.radians(41+3*(p.y/2.5))
    u=(p.x*math.cos(a)+p.y*math.sin(a))*k; v=(-p.x*math.sin(a)+p.y*math.cos(a))*k
    return (u/(4*TILE)+0.13,v/(4*TILE)+0.07)
def vnoise(x,y,s=1.3,seed=0):  # weiche Wertrauschen-Funktion für Schmutzwolken
    import math as m
    return 0.5+0.25*m.sin(x*s*2.1+seed)*m.cos(y*s*1.7-seed*0.7)+0.25*m.sin((x*0.8-y*1.3)*s*3.1+seed*2.3)
fl=grid_quad('floor',SW,SE,NW,NE,30,25,MT['floor'],floor_uv)
def floor_grime(v):
    dw=min(v.x+3.0-0.03*(v.y+2.5),2.95-0.03*(v.y+2.5)-v.x,v.y+2.5,2.5-v.y)   # Abstand zur nächsten Wand (grob)
    k=1.0-0.38*max(0,1-dw/0.55)**1.5                                       # Dreck an den Wänden
    k*=0.72+0.4*vnoise(v.x,v.y,1.1,1)                                       # Wolkige Abnutzung
    t=math.exp(-((v.x-0.3)**2)/0.5)*0.12; k*=1-t                             # Laufweg Tür->Schalter
    return tuple(c*k for c in (1.0,0.96,0.86))+(1,)
set_vc(fl,floor_grime)
ce=grid_quad('ceiling',SWt,SEt,NWt,NEt,12,10,MT['ceil'],lambda p:(p.x/2.0,p.y/2.0)); 
for p in ce.data.polygons: p.flip()
# Wände mit Öffnungen: Schalterfenster (N), NO-EXIT-Tür (S)
WIN=(3.25,4.75,1.05,1.95); DOOR=(1.70,2.80,0.0,2.32)
def wall_grime(v):
    z=v.z; k=1.0-0.45*max(0,1-z/0.35)-0.25*max(0,(z-2.3)/0.4)   # Fußleisten-Schmutz unten, Ruß oben
    k*=0.82+0.3*vnoise(v.x+v.y,z,0.9,3)
    return hexc(0xffffff) if k>=1 else tuple(c*k for c in hexc(0xf2f0e6)[:3])+(1,)
for k,h in [('N',[WIN]),('E',[]),('S',[DOOR]),('W',[])]: set_vc(wall_mesh(k,h,MT['wall']),wall_grime)
def wbox(W,a0,a1,b0,b1,c0,c1,mat,name='wb',bev=0.0):
    o=box(name,((a0+a1)/2,(c0+c1)/2,(b0+b1)/2),(a1-a0,c1-c0,b1-b0),mat,bev=bev); return o
# Fußleisten
for k in 'NEWS':
    W=WALLS[k]; L=wlen(W); segs=[(0,L)] if k!='S' else [(0,DOOR[0]-0.06),(DOOR[1]+0.06,L)]
    for a0,a1 in segs: o=wbox(W,a0,a1,0,0.11,0,0.018,MT['wood']); box_uv(o,2); vc_const(o,0x2a2a22); onwall(o,W)
# ------------------------------------------------------------------ Schalter (N-Wand): Wellblech, Fenster, Craquelé-Theke, Info-Ständer, Fallblatt
WN=WALLS['N']
def corrugated(a0,a1,b0,b1,hole,per=0.076,amp=0.017):
    A=[a0+i*per/8 for i in range(int((a1-a0)/(per/8))+1)]; Bs=sorted(set([b0,b1,hole[2],hole[3]]+[b0+i*0.65 for i in range(1,5) if b0+i*0.65<b1]))
    verts=[];faces=[];idx={}
    def vi(i,b):
        k=(i,round(b,4))
        if k not in idx: a=A[i]; idx[k]=len(verts); verts.append((a,0.025+amp*math.sin(2*math.pi*(a-a0)/per),b))
        return idx[k]
    for i in range(len(A)-1):
        for j in range(len(Bs)-1):
            ca=(A[i]+A[i+1])/2; cb=(Bs[j]+Bs[j+1])/2
            if hole[0]<=ca<=hole[1] and hole[2]<=cb<=hole[3]: continue
            faces.append((vi(i,Bs[j]),vi(i+1,Bs[j]),vi(i+1,Bs[j+1]),vi(i,Bs[j+1])))
    o=mesh_obj('corr',[tuple(v) for v in verts],faces,MT['corr'])
    ul=o.data.uv_layers.new(name='UVMap')
    for li,l in enumerate(o.data.loops): v=o.data.vertices[l.vertex_index].co; ul.data[li].uv=(v.x/1.3,v.z/1.3)
    for p in o.data.polygons: p.flip()
    return o
co=corrugated(2.75,5.35,0.0,2.58,WIN); smooth(co); vc_const(co,0xffffff); onwall(co,WN)
# Fensterrahmen + Mittelsteg + 2 Schiebescheiben
fr=[]
for (a0,a1,b0,b1) in [(WIN[0]-0.05,WIN[1]+0.05,WIN[3],WIN[3]+0.06),(WIN[0]-0.05,WIN[0],WIN[2],WIN[3]),(WIN[1],WIN[1]+0.05,WIN[2],WIN[3]),(4.43,4.47,WIN[2],WIN[3])]:   # v7: Mittelsteg nach rechts (stand vor dem Gesicht der Schönheitskönigin)
    fr.append(wbox(WN,a0,a1,b0,b1,-0.02,0.09,MT['metal']))
o=join(fr,'win_frame'); vc_const(o,0x4a504a); onwall(o,WN)
g1=wbox(WN,WIN[0],4.49,WIN[2],WIN[3],0.035,0.04,MT['glass']); g2=wbox(WN,4.41,WIN[1],WIN[2],WIN[3],0.06,0.065,MT['glass']); o=join([g1,g2],'win_glass'); vc_const(o,0xb8c8c0); onwall(o,WN)
# Theke: Front Craquelé, Platte darüber
t=wbox(WN,3.0,5.05,0.0,1.0,0.02,0.52,MT['crack']); box_uv(t,1.0); vc_const(t,0xffffff); onwall(t,WN)
t=wbox(WN,2.95,5.1,1.0,1.05,-0.22,0.58,MT['crack'],bev=0.008); box_uv(t,1.0); vc_const(t,0xd0d0d0); onwall(t,WN)
t=wbox(WN,3.0,5.05,0.0,0.08,0.5,0.53,MT['wood']); vc_const(t,0x111410); box_uv(t); onwall(t,WN)
# INFORMATION-Ständer (graues Metall) + Platte
st=[wbox(WN,3.33,3.36,1.05,1.16,0.30,0.32,MT['metal']),wbox(WN,3.72,3.75,1.05,1.16,0.30,0.32,MT['metal']),wbox(WN,3.28,3.80,1.05,1.06,0.24,0.38,MT['metal'])]
o=join(st,'info_stand'); vc_const(o,0x6a6e6a); onwall(o,WN)
pl=box('info_plate',(3.54,0.335,1.205),(0.5,0.012,0.1),MT['signs'],rot=(math.radians(-18),0,0)); cell_uv(pl,ATL['info'],axis='y'); vc_const(pl,0xffffff); onwall(pl,WN)
# Klingel
b=lathe('bell',[(0.045,0),(0.045,0.008),(0.04,0.02),(0.03,0.035),(0.012,0.045),(0.0,0.048)],MT['metal'],seg=16,c=(4.5,0.33,1.05)); vc_const(b,0xb08a40); onwall(b,WN)
# Fallblatt-Anzeige über dem Fenster (Gehäuse + Front für Canvas)
fb=wbox(WN,3.55,4.45,2.03,2.33,0.02,0.16,MT['metal'],bev=0.01); vc_const(fb,0x2a2c28); onwall(fb,WN)
ff=mesh_obj('flip_face',[(3.58,0.162,2.06),(4.42,0.162,2.06),(4.42,0.162,2.30),(3.58,0.162,2.30)],[(0,1,2,3)],MT['flip'],uv=lambda i,c:[(0,0),(1,0),(1,1),(0,1)][i]); vc_const(ff,0xffffff); onwall(ff,WN)
for p in ff.data.polygons: p.flip()
# Schilder an der N-Wand
def sign(W,cellname,a0,a1,b0,b1,c=0.004,th=0.012,atlas=2048,mat=None,back=0x303028):
    s=wbox(W,a0,a1,b0,b1,c,c+th,mat or MT['signs']); cell_uv(s,ATL[cellname] if isinstance(cellname,str) else cellname,atlas=atlas,axis='y'); vc_const(s,0xffffff); onwall(s,W); return s
sign(WN,'amt',0.30,2.30,2.05,2.425); sign(WN,'nummer',1.95,2.65,1.45,1.80); sign(WN,'zeiten',4.83,5.23,1.30,1.633,c=0.05)
# ------------------------------------------------------------------ Hinterbüro (hinter dem Fenster, grünes Neon)
OX0,OX1,OY0,OY1,OZ=-0.15,2.45,2.55,3.95,2.45
def quad(name,pts,mat,uvs=1.0,h=None):
    o=mesh_obj(name,pts,[(0,1,2,3)],mat); ul=o.data.uv_layers.new(name='UVMap')
    for li,l in enumerate(o.data.loops):
        p=o.data.vertices[l.vertex_index].co; ul.data[li].uv=((p.x+p.y)/uvs,p.z/uvs) if h is None else h(p)
    return o
ow=[quad('off_back',[(OX0,OY1,0),(OX1,OY1,0),(OX1,OY1,OZ),(OX0,OY1,OZ)],MT['wall']),
    quad('off_l',[(OX0,OY0,0),(OX0,OY1,0),(OX0,OY1,OZ),(OX0,OY0,OZ)],MT['wall']),
    quad('off_r',[(OX1,OY1,0),(OX1,OY0,0),(OX1,OY0,OZ),(OX1,OY1,OZ)],MT['wall'])]
for o in ow: vc_const(o,0x8aa890)
o=quad('off_floor',[(OX0,OY0,0),(OX0,OY1,0),(OX1,OY1,0),(OX1,OY0,0)],MT['ceil'],h=lambda p:(p.x/1.5,p.y/1.5)); vc_const(o,0x504838)
o=quad('off_ceil',[(OX0,OY0,OZ),(OX1,OY0,OZ),(OX1,OY1,OZ),(OX0,OY1,OZ)],MT['ceil'],h=lambda p:(p.x/1.5,p.y/1.5)); vc_const(o,0x9a9a88)
# Regale mit Ordnern + Kartons
shel=[]; files=[]; boxes=[]
for x0,x1 in [(OX0+0.05,1.0),(1.25,2.0)]:
    for z in [0.05,0.5,0.95,1.4,1.85,2.3]: shel.append(box('sh',((x0+x1)/2,OY1-0.17,z),(x1-x0,0.32,0.025),MT['wood']))
    for xs in (x0,x1): shel.append(box('sh',(xs,OY1-0.17,1.2),(0.025,0.32,2.35),MT['wood']))
    for z in [0.07,0.52,0.97,1.42,1.87]:
        x=x0+0.03
        while x<x1-0.12:
            w=random.uniform(0.25,0.5); 
            if random.random()<0.7:
                f=box('fi',(x+w/2,OY1-0.16,z+0.17),(w,0.28,0.32),MT['paper']); cell_uv(f,[(10 if random.random()<0.5 else 11)%4*256,(10//4)*256,256,256],atlas=1024,axis='-y'); files.append(f)
            else:
                f=box('bx',(x+w/2,OY1-0.17,z+0.15),(w,0.3,0.28),MT['paper']); cell_uv(f,[(12+random.randint(0,1))%4*256,3*256,256,256],atlas=1024,axis='-y'); boxes.append(f)
            x+=w+0.02
o=join(shel,'off_shelves'); box_uv(o,2); vc_const(o,0x5a4a34)
for i in range(7):  # Kartonstapel am Boden
    x=random.uniform(0.1,2.2); y=random.uniform(3.0,3.5); s=random.uniform(0.35,0.5)
    f=box('bx',(x,y,s*0.35+ (0 if i<5 else 0.4)),(s,s*0.8,s*0.7),MT['paper'],rot=(0,0,random.uniform(-0.3,0.3))); cell_uv(f,[(12+i%2)%4*256,3*256,256,256],atlas=1024,axis='y'); boxes.append(f)
o=join(files+boxes,'off_files'); vc_const(o,0xe0d8c0)
# Schreibtisch, Schreibmaschine, Lampe
dk=[box('d',(1.2,3.05,0.74),(1.3,0.6,0.04),MT['wood']),box('d',(0.62,3.05,0.37),(0.06,0.55,0.72),MT['wood']),box('d',(1.78,3.05,0.37),(0.06,0.55,0.72),MT['wood'])]
o=join(dk,'off_desk'); box_uv(o,2); vc_const(o,0x4a3a28)
tw=[box('tw',(0.75,3.1,0.82),(0.4,0.3,0.12),MT['metal'],bev=0.02),box('tw',(0.75,3.2,0.92),(0.42,0.08,0.06),MT['metal'],bev=0.02)]
o=join(tw,'typewriter'); vc_const(o,0x1c1e1c)
# Jalousie-Fenster in der rechten Bürowand: grünes Gegenlicht
em=quad('off_glow',[(OX1-0.01,OY1-0.25,0.9),(OX1-0.01,OY0+0.25,0.9),(OX1-0.01,OY0+0.25,2.15),(OX1-0.01,OY1-0.25,2.15)],MT['emit']); vc_const(em,0xffffff)
sl=[box('sl',(OX1-0.05,(OY0+OY1)/2,0.92+i*0.06),(0.02,OY1-OY0-0.5,0.04),MT['metal'],rot=(math.radians(25),0,0)) for i in range(21)]
o=join(sl,'blind'); vc_const(o,0x9aa49a)
tube=cyl('tube',(1.1,3.3,OZ-0.08),0.018,1.2,MT['emit'],seg=8,rot=(0,math.pi/2,0)); vc_const(tube,0xffffff)
# ------------------------------------------------------------------ NO-EXIT-Tür (S-Wand): schiefer Rahmen, grüner Schacht mit schrägen Latten
WS=WALLS['S']
# Öffnung (x,z) Weltkoordinaten: Wand bei y=-2.5, Innen +y. a=3-x
def xz_poly(name,pts,y0,y1,mat):
    n=len(pts); verts=[(x,y0,z) for x,z in pts]+[(x,y1,z) for x,z in pts]
    faces=[tuple(range(n)),tuple(range(2*n-1,n-1,-1))]+[(i,n+i,n+(i+1)%n,(i+1)%n) for i in range(n)]
    o=mesh_obj(name,verts,faces,mat); 
    bm=bmesh.new(); bm.from_mesh(o.data); bmesh.ops.recalc_face_normals(bm,faces=bm.faces); bm.to_mesh(o.data); bm.free(); return o
xa,xb=3-DOOR[1],3-DOOR[0]  # -0.8 .. 0.3 ... (Loch)
# innere Öffnung (schief): unten 0.78 breit, oben schmaler und versetzt
iL0,iR0,iL1,iR1=xa+0.16,xb-0.14,xa+0.24,xb-0.20; zt0,zt1=2.08,2.18
jamb=[xz_poly('j1',[(xa-0.06,0),(iL0,0),(iL1,zt0),(xa-0.06,zt0)],-2.58,-2.42,MT['wood']),
      xz_poly('j2',[(iR0,0),(xb+0.06,0),(xb+0.06,zt1),(iR1,zt1)],-2.58,-2.42,MT['wood']),
      xz_poly('j3',[(xa-0.06,zt0),(iL1,zt0),(iR1,zt1),(xb+0.06,zt1),(xb+0.06,DOOR[3]+0.06),(xa-0.06,DOOR[3]+0.06)],-2.58,-2.42,MT['wood'])]
o=join(jamb,'door_frame'); box_uv(o,2); vc_const(o,0x3e5444)
# Schacht
SY=-3.55
sh=[quad('sh_l',[(xa,-2.5,0),(xa,SY,0),(xa,SY,2.5),(xa,-2.5,2.5)],MT['wall']),quad('sh_r',[(xb,SY,0),(xb,-2.5,0),(xb,-2.5,2.5),(xb,SY,2.5)],MT['wall']),
    quad('sh_c',[(xa,-2.5,2.5),(xa,SY,2.5),(xb,SY,2.5),(xb,-2.5,2.5)],MT['wall'])]
for o in sh: vc_const(o,0x6a9a70)
o=grid_quad('sh_floor',V((xa,SY,0)),V((xb,SY,0)),V((xa,-2.5,0)),V((xb,-2.5,0)),3,4,MT['floor'],floor_uv)
em=quad('sh_glow',[(xa,SY+0.01,0),(xb,SY+0.01,0),(xb,SY+0.01,2.5),(xa,SY+0.01,2.5)],MT['emit']); vc_const(em,0xffffff)
for p in em.data.polygons: p.flip()
lat=[]
RL=random.Random(23)
for i,x in enumerate([xa+0.12,xa+0.34,xa+0.58,xb-0.36,xb-0.13]):   # v4: dünne, leicht krumme Stangen (Pete 06)
    c=cyl('pf',(x,-2.62-0.12*(i%2),1.25),0.022,2.5,MT['wood'],seg=6,rot=(RL.uniform(-0.03,0.03),RL.uniform(-0.03,0.03),0)); lat.append(c)
for i in range(11):   # kurze, schräge Sprossen in der Tiefe, unregelmäßig
    z=0.22+i*0.2+RL.uniform(-0.04,0.04); y=-2.95-0.45*(i%3)/2; L=RL.uniform(0.35,0.75); xc=RL.uniform(xa+L/2,xb-L/2)
    lat.append(box('lt',(xc,y,z),(L,0.035,0.04),MT['wood'],rot=(0,math.radians(RL.uniform(-14,14)),0)))
o=join(lat,'slats'); box_uv(o,2); vc_const(o,0x2c4a30)
s=box('noexit',((xa+xb)/2,-2.4,2.31),(0.5,0.02,0.156),MT['noexit']); cell_uv(s,ATL['noexit'],axis='-y'); vc_const(s,0xffffff)
# ------------------------------------------------------------------ Wandschmuck: Gemälde, Plakate, Sternleuchten, Uhr
def painting(W,cell,a0,a1,b0,b1,frame=0x2a1c10):
    fw=0.06; fr=[wbox(W,a0-fw,a1+fw,b1,b1+fw,0.0,0.05,MT['wood']),wbox(W,a0-fw,a1+fw,b0-fw,b0,0.0,0.05,MT['wood']),wbox(W,a0-fw,a0,b0,b1,0.0,0.05,MT['wood']),wbox(W,a1,a1+fw,b0,b1,0.0,0.05,MT['wood'])]
    o=join(fr,'frame'); box_uv(o,3); vc_const(o,frame); onwall(o,W)
    asp=(a1-a0)/(b1-b0); cw,chh=(512,512/asp) if asp>=1 else (512*asp,512); X0=(cell%2)*512+(512-cw)/2; Y0=(cell//2)*512+(512-chh)/2
    c=wbox(W,a0,a1,b0,b1,0.0,0.02,MT['paint']); cell_uv(c,[X0,Y0,cw,chh],atlas=1024,axis='y'); vc_const(c,0xffffff); onwall(c,W)
WW,WE=WALLS['W'],WALLS['E']
painting(WN,1,0.25,1.30,1.02,1.72); painting(WW,0,0.65,1.55,1.30,1.95); painting(WW,2,2.60,3.30,1.30,1.95,0x3a2a16); painting(WE,1,2.05,3.55,1.22,1.90); painting(WS,3,3.90,4.95,1.15,1.82,0x302214)
sign(WW,'formular',4.56,4.94,1.12,1.659,c=0.002,th=0.003,mat=MT['signs']); sign(WE,'handbuch',0.55,0.95,1.10,1.667,c=0.002,th=0.003); sign(WE,'seelen',4.0,4.9,1.85,2.05); sign(WE,'spuk',4.15,4.75,1.42,1.62,c=0.002,th=0.003)
# Verblichene Amts-Plakate (gen_posters.py, Zellen im Schilder-Atlas)
sign(WS,'p_a38',5.32,5.88,1.22,1.55,c=0.002,th=0.003); sign(WE,'p_laecheln',1.70,1.97,1.15,1.533,c=0.002,th=0.003)
sign(WE,'p_geduld',4.22,4.49,0.98,1.363,c=0.002,th=0.003); sign(WW,'p_klopfen',2.58,3.32,2.08,2.311,c=0.002,th=0.003)
# v4: zwei freche 80er-Pin-ups (eigenes Material wr_pinup, Atlas pinups.png 1024², Zellen 512x683 = 3:4)
PIN=json.load(open(SRC+'/atlas.json'))['pinups']
sign(WW,PIN['gruft'],4.02,4.46,1.26,1.847,c=0.002,th=0.003,atlas=1024,mat=MT['pinup'])
sign(WS,PIN['revue'],0.60,1.04,1.30,1.887,c=0.002,th=0.003,atlas=1024,mat=MT['pinup'])
def star(W,a,b,name):
    parts=[]; hub=sphere('hub',(a,0.09,b),0.07,MT['metal'],u=12,v=8); parts.append(hub); RS=random.Random(hash(name)%997)
    for i in range(18):
        ang=i/18*2*math.pi+0.1; L=RS.uniform(0.30,0.46) if i%2 else RS.uniform(0.14,0.22)
        c=cyl('sp',(0,0,0),0.022,L,MT['metal'],seg=6,r2=0.0); xf(c,(0,0,L/2)); xf(c,(0,0,0),(0,ang,0)); 
        for v in c.data.vertices: v.co=V((v.co.x+a,0.09+ (0.03 if i%3==0 else 0.0)*v.co.z/L,v.co.z+b))
        parts.append(c)
    disc=cyl('dc',(a,0.075,b),0.11,0.02,MT['metal'],seg=16,rot=(math.pi/2,0,0)); parts.append(disc)
    br=cyl('br',(a,0.04,b),0.012,0.08,MT['metal'],seg=6,rot=(math.pi/2,0,0)); parts.append(br)
    o=join(parts,name); vc_const(o,0x5a4a2a); onwall(o,W); return o
star(WN,1.75,1.62,'star_n'); star(WW,2.10,1.74,'star_w'); star(WS,3.2,1.9,'star_s')
# Uhr (S-Wand, Ziffern linksherum), Zeiger beweglich
CX,CY,CZ=-2.35,-2.5+0.06,2.08
o=cyl('clock_body',(CX,CY-0.02,CZ),0.19,0.05,MT['wood'],seg=32,rot=(math.pi/2,0,0)); vc_const(o,0x1a1410); box_uv(o,3)
o=cyl('clock_face',(CX,CY+0.006,CZ),0.17,0.004,MT['signs'],seg=32,rot=(math.pi/2,0,0)); cell_uv(o,ATL['uhr'],axis='-y'); vc_const(o,0xffffff)
for nm,L,w,ang in [('clk_h',0.09,0.012,1.1),('clk_m',0.14,0.008,-0.6),('clk_s',0.15,0.003,2.0)]:
    h=box(nm,(0,0,L/2-0.02),(w,0.004,L),MT['metal']); vc_const(h,0x0c0c0c if nm!='clk_s' else 0x7a1a12)
    h.location=(CX,CY+0.015+(0.003 if nm=='clk_s' else 0),CZ); MOVERS.append(h); AX[nm]=(V((0,1,0)),'clock')
# ------------------------------------------------------------------ Möbel
def legs(pts,h,r=0.018,mat=None,splay=0.0,col=0x2a1e14):
    out=[]
    for (x,y) in pts:
        c=cyl('lg',(0,0,0),r,h,mat or MT['wood'],seg=8,r2=r*0.6); xf(c,(0,0,-h/2)); 
        if splay: xf(c,(0,0,0),(splay*(1 if y>0 else -1)*0,0,0))
        xf(c,(x,y,h)); out.append(c)
    return out
def place(o,x,y,yaw,z=0.0):
    xf(o,(x,y,z),(0,0,yaw)); return o
def club_chair(x,y,yaw,col=0x5e6460):  # Leder-Clubsessel mit schräger Lehne (grau)
    p=[box('s',(0,0.02,0.33),(0.66,0.62,0.16),MT['vinyl'],bev=0.03,seg=2),box('a',(-0.3,0,0.42),(0.12,0.7,0.36),MT['vinyl'],bev=0.04,seg=2),box('a',(0.3,0,0.42),(0.12,0.7,0.36),MT['vinyl'],bev=0.04,seg=2),
       box('b',(0,-0.33,0.66),(0.6,0.14,0.62),MT['vinyl'],rot=(math.radians(-16),0,0),bev=0.04,seg=2),box('base',(0,0,0.15),(0.64,0.66,0.18),MT['vinyl'],bev=0.02)]
    o=join(p,'club'); vc_const(o,col); box_uv(o,1.5); smooth(o); return place(o,x,y,yaw)
def shell_chair(x,y,yaw,col=0x7a5a24):
    pr=[(0.0,0.0),(0.22,0.0),(0.25,0.02),(0.26,0.06)]
    seat=box('st',(0,0.02,0.44),(0.5,0.5,0.04),MT['vinyl'],bev=0.018,seg=2); back=box('bk',(0,-0.24,0.74),(0.5,0.06,0.42),MT['vinyl'],rot=(math.radians(-12),0,0),bev=0.02,seg=2)
    for v in back.data.vertices: v.co.y+=0.06*(v.co.x/0.25)**2
    lg=[]
    for sx,sy in [(-1,-1),(1,-1),(1,1),(-1,1)]:
        c=cyl('lg',(0,0,0),0.016,0.46,MT['wood'],seg=8,r2=0.01); xf(c,(0,0,-0.23)); xf(c,(0,0,0),(sy*0.18,-sx*0.18,0)); xf(c,(sx*0.2,sy*0.2,0.43)); lg.append(c)
    o=join([seat,back],'shell'); vc_const(o,col); box_uv(o,1.5); smooth(o)
    l=join(lg,'shell_legs'); vc_const(l,0x3a2412); box_uv(l,2)
    place(o,x,y,yaw); place(l,x,y,yaw); return o
def kitchen_chair(x,y,yaw):
    p=[box('s',(0,0,0.45),(0.44,0.42,0.035),MT['wood'],bev=0.008)]+legs([(-0.19,-0.18),(0.19,-0.18),(0.19,0.18),(-0.19,0.18)],0.44,0.017)
    for sx in (-0.19,0.19): p.append(cyl('bp',(sx,-0.19,0.7),0.017,0.52,MT['wood'],seg=8,rot=(math.radians(-6),0,0)))
    for z in (0.62,0.76,0.9): p.append(box('sl',(0,-0.2-0.025*(z-0.45),z),(0.38,0.02,0.05),MT['wood']))
    o=join(p,'kchair'); vc_const(o,0x4a3420); box_uv(o,2); return place(o,x,y,yaw)
def chrome_chair(x,y,yaw,col=0x5a2a20):
    p=[box('s',(0,0.02,0.44),(0.48,0.46,0.08),MT['vinyl'],bev=0.03,seg=2),box('b',(0,-0.24,0.72),(0.46,0.07,0.36),MT['vinyl'],rot=(math.radians(-10),0,0),bev=0.03,seg=2)]
    o=join(p,'cchair'); vc_const(o,col); box_uv(o,1.5); smooth(o)
    t=[]
    for sx in (-0.23,0.23):
        t.append(cyl('t',(sx,0,0.02),0.012,0.5,MT['metal'],seg=8,rot=(math.pi/2,0,0))); t.append(cyl('t',(sx,0.24,0.22),0.012,0.42,MT['metal'],seg=8)); t.append(cyl('t',(sx,-0.25,0.48),0.012,0.9,MT['metal'],seg=8,rot=(math.radians(-8),0,0)))
    m=join(t,'ctubes'); vc_const(m,0x9a9c98); place(o,x,y,yaw); place(m,x,y,yaw); return o
def wing_chair(x,y,yaw,col=0x5a1c1a):
    p=[box('s',(0,0.03,0.36),(0.7,0.66,0.2),MT['fabric'],bev=0.04,seg=2),box('b',(0,-0.33,0.8),(0.72,0.16,0.8),MT['fabric'],rot=(math.radians(-8),0,0),bev=0.05,seg=2),
       box('w',(-0.34,-0.22,0.9),(0.1,0.34,0.5),MT['fabric'],bev=0.04,seg=2),box('w',(0.34,-0.22,0.9),(0.1,0.34,0.5),MT['fabric'],bev=0.04,seg=2),
       box('a',(-0.34,0.02,0.52),(0.12,0.62,0.24),MT['fabric'],bev=0.05,seg=2),box('a',(0.34,0.02,0.52),(0.12,0.62,0.24),MT['fabric'],bev=0.05,seg=2)]
    o=join(p,'wing'); vc_const(o,col); box_uv(o,2.5); smooth(o)
    l=join(legs([(-0.3,-0.28),(0.3,-0.28),(0.3,0.3),(-0.3,0.3)],0.26,0.02),'wlegs'); vc_const(l,0x1e140c)
    place(o,x,y,yaw); place(l,x,y,yaw); return o
def sofa(x,y,yaw,col=0x7a7262):
    p=[box('base',(0,0,0.26),(2.0,0.86,0.24),MT['fabric'],bev=0.04,seg=2)]
    for i in range(3):
        c=box('c',(-0.62+i*0.62,0.05,0.44),(0.61,0.7,0.14),MT['fabric'],bev=0.05,seg=3)
        for v in c.data.vertices:
            dx=(v.co.x-(-0.62+i*0.62))/0.3; v.co.z-=0.03*max(0,1-dx*dx)*(v.co.z>0.44)
        p.append(c); p.append(box('bc',(-0.62+i*0.62,-0.33,0.72),(0.6,0.2,0.46),MT['fabric'],rot=(math.radians(-12),0,0),bev=0.06,seg=3))
    for sx in (-1.02,1.02): p.append(cyl('arm',(sx,0,0.55),0.12,0.86,MT['fabric'],seg=16,rot=(math.pi/2,0,0))); p.append(box('ab',(sx,0,0.36),(0.22,0.86,0.36),MT['fabric'],bev=0.04))
    p.append(box('bk',(0,-0.4,0.62),(2.2,0.1,0.6),MT['fabric'],bev=0.04,seg=2))
    o=join(p,'sofa'); vc_const(o,col); box_uv(o,2.0); smooth(o)
    l=join(legs([(-0.95,-0.35),(0.95,-0.35),(0.95,0.35),(-0.95,0.35)],0.14,0.022),'slegs'); vc_const(l,0x1e140c)
    place(o,x,y,yaw); place(l,x,y,yaw); return o
def kidney_table(x,y,yaw):
    def kid(s):
        pts=[]
        for i in range(48):
            t=i/48*2*math.pi; px=0.62*math.cos(t); py=0.34*math.sin(t)
            py-=0.13*math.exp(-((t-math.pi/2)/0.55)**2); px*=1+0.08*math.cos(t)
            pts.append((px*s,py*s))
        return pts
    top=extrude_poly('top',kid(1.0),0.42,0.45,MT['wood']); sh=extrude_poly('shelf',kid(0.78),0.2,0.22,MT['wood'])
    lg=[]
    for (lx,ly) in [(-0.45,-0.12),(0.48,-0.1),(0.02,0.2)]:
        c=cyl('lg',(0,0,0),0.02,0.46,MT['wood'],seg=8,r2=0.008); xf(c,(0,0,-0.23)); xf(c,(0,0,0),(ly*0.5,-lx*0.3,0)); xf(c,(lx,ly,0.43)); lg.append(c)
    o=join([top,sh],'ktable'); vc_const(o,0x5a3a22); box_uv(o,1.5)
    l=join(lg,'ktlegs'); vc_const(l,0x14100c)
    place(o,x,y,yaw); place(l,x,y,yaw); return o
def floor_lamp(x,y,name,base=0x2e5a3a):
    b=lathe('lb',[(0.0,0.0),(0.12,0.0),(0.13,0.03),(0.16,0.15),(0.15,0.28),(0.09,0.38),(0.04,0.44),(0.03,0.47),(0.0,0.48)],MT['vinyl'],seg=20,c=(x,y,0)); vc_const(b,base); smooth(b)
    pole=cyl('lp',(x,y,0.95),0.012,1.0,MT['metal'],seg=8); vc_const(pole,0x9a7a3a)
    sh=lathe(name,[(0.29,1.36),(0.285,1.5),(0.26,1.64),(0.25,1.76)],MT['shade'],seg=28,c=(x,y,0))
    md=sh.modifiers.new('so','SOLIDIFY'); md.thickness=0.006; apply_mods(sh); vc_const(sh,0xffffff)
    ul=sh.data.uv_layers.new(name='UVMap')
    for li,l in enumerate(sh.data.loops):
        p=sh.data.vertices[l.vertex_index].co; ul.data[li].uv=(math.atan2(p.y-y,p.x-x)/math.pi*1.5,p.z*1.5)
    return (x,y,1.52)
def side_table(x,y,yaw):
    p=[box('t',(0,0,0.58),(0.46,0.4,0.03),MT['wood'],bev=0.006),box('s',(0,0,0.25),(0.4,0.34,0.02),MT['wood'])]+legs([(-0.2,-0.17),(0.2,-0.17),(0.2,0.17),(-0.2,0.17)],0.57,0.016)
    o=join(p,'stable'); vc_const(o,0x4a3020); box_uv(o,2); return place(o,x,y,yaw)
def radio(x,y,yaw,z):
    case=box('rc',(0,0,0.14),(0.44,0.2,0.26),MT['wood'],bev=0.035,seg=3)
    for v in case.data.vertices:
        if v.co.z>0.2: v.co.x*=0.92
    o=join([case],'radio'); vc_const(o,0x5a2e14); box_uv(o,3); smooth(o)
    g=box('grill',(-0.07,0.101,0.15),(0.24,0.004,0.17),MT['fabric']); vc_const(g,0xb0a070); box_uv(g,12)
    d=box('dial',(0.13,0.102,0.17),(0.13,0.004,0.05),MT['signs']); cell_uv(d,ATL['radio'],axis='y'); vc_const(d,0xffffff)
    k=[cyl('k',(0.09+i*0.08,0.11,0.07),0.02,0.025,MT['vinyl'],seg=12,rot=(math.pi/2,0,0)) for i in range(2)]; kk=join(k,'knobs'); vc_const(kk,0xd8ccb0)
    for oo in (o,g,d,kk): place(oo,x,y,yaw,z)
    return o
def dispenser(P):
    x,y=P.x,P.y
    p=[cyl('b',(x,y,0.01),0.16,0.02,MT['metal'],seg=16),cyl('p',(x,y,0.55),0.016,1.08,MT['metal'],seg=8)]
    m=join(p,'disp_pole'); vc_const(m,0x5a5a56)
    d=cyl('drum',(x,y,1.12),0.085,0.16,MT['vinyl'],seg=20,rot=(0,math.pi/2,0)); vc_const(d,0x8a1a14); smooth(d)
    tk=box('ticket',(x,y-0.09,1.07),(0.06,0.002,0.07),MT['paper'],rot=(math.radians(20),0,0)); cell_uv(tk,[512,512,256,256],atlas=1024,axis='y'); vc_const(tk,0xffffff)
    lb=box('lab',(x,y-0.004,1.29),(0.2,0.008,0.06),MT['signs']); cell_uv(lb,ATL['ziehen'],axis='y'); vc_const(lb,0xffffff)
    lbp=cyl('lp',(x,y,1.23),0.006,0.12,MT['metal'],seg=6); vc_const(lbp,0x5a5a56)
# Figuren aus Hunyuan3D-Meshes (fig/figs.blend, siehe fig/README) bringen ihren Stuhl mit -> dort keinen eigenen Stuhl bauen
FIGBLEND=HERE+'/fig/figs.blend'; HY=os.path.exists(FIGBLEND) and '--procfig' not in argv
HYCH={'k','c','club','h'} if HY else set()
# ------------------------------------------------------------------ v4: Möbel aus Hunyuan3D-2mv (props/*_npy, eigene Konzeptbilder, beste von 3–4 Seeds)
# Form von Hunyuan, Material lokal: Dreiecke nach Höhe/Lage in Regionen geteilt (Schirm/Fuß/Stange, Polster/Beine, Platte/Ablage/Beine)
import numpy as _np
PROPD=HERE+'/props'; PROPBOX=[]
def hy_mesh(name,H):
    v=_np.load(PROPD+'/%s_v.npy'%name).astype(float); t=_np.load(PROPD+'/%s_t.npy'%name)
    v[:,0]*=-1; v[:,1]*=-1                                   # Hunyuan-Front -Y -> Szenen-Front +Y
    v[:,2]-=v[:,2].min(); v*=H/v[:,2].max(); c=(v.min(0)+v.max(0))/2; v[:,0]-=c[0]; v[:,1]-=c[1]
    return v,t
def hy_prop(name,v,t,regions,x,y,yaw,z=0.0):
    cen=v[t].mean(1); used=_np.zeros(len(t),bool); out={}
    for key,mat,col,uvs,fn in regions:
        m=(~used)&fn(cen); used|=m
        if not m.any(): continue
        tt=t[m]; idx=_np.unique(tt); rm=-_np.ones(len(v),int); rm[idx]=_np.arange(len(idx))
        o=mesh_obj('hyp_%s_%s'%(name,key),[tuple(map(float,q)) for q in v[idx]],[tuple(map(int,f)) for f in rm[tt]],mat)
        box_uv(o,uvs); vc_const(o,col) if isinstance(col,int) else set_vc(o,col); smooth(o); place(o,x,y,yaw,z); out[key]=o
    PROPBOX.append(list(out.values())); return out
LAMPV=hy_mesh('lamp',1.78)
def hy_lamp(x,y,name,base=0x3e6a48):
    v,t=LAMPV; H=1.78
    hy_prop(name,v,t,[('shade',MT['shade'],0xffffff,1.5,lambda c:c[:,2]>0.69*H),('base',MT['crack'],base,2.2,lambda c:c[:,2]<0.345*H),('pole',MT['metal'],0x9a7a3a,2.0,lambda c:c[:,2]>-1)],x,y,0.3)
    for o in bpy.data.objects:
        if o.name=='hyp_%s_shade'%name:
            o.name=name; ul=o.data.uv_layers['UVMap']
            for li,l in enumerate(o.data.loops):
                p_=o.data.vertices[l.vertex_index].co; ul.data[li].uv=(math.atan2(p_.y-y,p_.x-x)/math.pi*1.5,p_.z*1.5)
    return (x,y,0.84*H)
def sofa_shade(o):
    """v7b: Sofa nicht flach – Fugen/Falten (konkave Stellen) dunkler, Sitz-/Lehnenkanten abgewetzt heller, unten dunkler, leichte Fleckigkeit."""
    bm=bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table(); bm.normal_update()
    cav=[0.0]*len(bm.verts)
    for vv in bm.verts:
        ls=[e.other_vert(vv).co-vv.co for e in vv.link_edges]
        if ls: cav[vv.index]=sum(l.dot(vv.normal)/max(l.length,1e-4) for l in ls)/len(ls)   # >0 = Mulde/Fuge, <0 = Kante
    for _ in range(2):
        cav=[0.5*cav[vv.index]+0.5*sum(cav[e.other_vert(vv).index] for e in vv.link_edges)/max(1,len(vv.link_edges)) for vv in bm.verts]
    bm.free(); zs=[v.co.z for v in o.data.vertices]; z0,z1=min(zs),max(zs); base=hexc(0xa89482)
    def fn(v):
        i=fn.idx[(round(v.x,5),round(v.y,5),round(v.z,5))]; cv=cav[i]; h=(v.z-z0)/max(z1-z0,1e-3)
        k=1.0-0.55*max(0.0,min(1.0,cv*3.0))+0.12*max(0.0,min(1.0,-cv*3.0))   # Fugen dunkel, Kanten heller
        k*=0.78+0.22*min(1.0,h*1.6)                                          # zum Boden hin dunkler
        k*=0.94+0.06*math.sin(v.x*7.3+1.1)*math.sin(v.y*5.1+0.4)            # leicht fleckig
        return (base[0]*k,base[1]*k,base[2]*k)
    fn.idx={(round(v.co.x,5),round(v.co.y,5),round(v.co.z,5)):v.index for v in o.data.vertices}
    set_vc(o,fn)
def hy_sofa(x,y,yaw):
    v,t=hy_mesh('sofa',0.86)
    o=hy_prop('sofa',v,t,[('legs',MT['wood'],0x1e140c,2.0,lambda c:c[:,2]<0.11),('body',MT['sofa'],0xa89482,2.6,lambda c:c[:,2]>-1)],x,y,yaw)   # v7: wärmeres Beige wie Pete 06; v7b: etwas taupe, feineres Gewebe
    sofa_shade(o['body'])
    m=(_np.abs(v[:,0])<0.55)&(v[:,1]>0.0)&(v[:,1]<0.3)&(v[:,2]<0.65); seat=float(v[m,2].max())
    zb=(v[:,2]>seat+0.10)&(v[:,2]<seat+0.30)&(_np.abs(v[:,0])<0.6)&(v[:,1]<0.1); back=float(v[zb,1].max())
    print('Sofa Sitz',round(seat,3),'Lehne vorn',round(back,3)); return seat,back
def hy_table(x,y,yaw):
    v,t=hy_mesh('table',0.50); H=0.5
    hy_prop('table',v,t,[('top',MT['vinyl'],0x9c8c70,1.2,lambda c:c[:,2]>0.84*H),('shelf',MT['vinyl'],0x8c7c62,1.2,lambda c:(c[:,2]>0.395*H)&(c[:,2]<0.51*H)),
        ('legs',MT['metal'],0x141210,3.0,lambda c:c[:,2]>-1)],x,y,yaw)
    return float(v[:,2].max()),float(v[(v[:,2]>0.39*H)&(v[:,2]<0.52*H),2].max())
WINGV=hy_mesh('wing',1.12)
def hy_wing(x,y,yaw,col=0x4a1814):
    v,t=WINGV; hy_prop('wing%d'%len(PROPBOX),v,t,[('legs',MT['wood'],0x1e140c,2.0,lambda c:c[:,2]<0.16),('body',MT['vinyl'],col,1.4,lambda c:c[:,2]>-1)],x,y,yaw)
# Westseite: Stuhlreihe (Wand leicht schräg → Reihe folgt ihr)
def wpos(a,c): p=WP(WW,a,0,c); return p.x,p.y
wyaw=-math.pi/2+math.atan2(0.15,5.0)
CH={}
for nm,a,fn in [('k',0.80,kitchen_chair),('c',1.50,chrome_chair),('club',2.30,club_chair),('e',3.05,shell_chair),('h',4.15,shell_chair)]:
    x,y=wpos(a,0.36); CH[nm]=(x,y)
    if nm in HYCH: continue
    if nm=='e' and HY: x,y=wpos(a,0.43); CH[nm]=(x,y); hy_wing(x,y,wyaw); continue
    fn(x,y,wyaw) if fn!=shell_chair else fn(x,y,wyaw,0x7a5a24 if nm=='e' else 0x3a4a3a)
LAMPS=[]
x,y=wpos(3.6,0.36); LAMPS.append(hy_lamp(x,y,'shade_w') if HY else floor_lamp(x,y,'shade_w'))
# Ostseite: Sofa, Lampe
def epos(a,c): p=WP(WE,a,0,c); return p.x,p.y
eyaw=math.pi/2+math.atan2(0.15,5.0)
x,y=epos(2.8,0.47); SOFA=(x,y)
if HY: SOFA_SEAT,SOFA_BACK=hy_sofa(x,y,eyaw)
else: sofa(x,y,eyaw)
x,y=epos(1.28,0.36); LAMPS.append(hy_lamp(x,y,'shade_e',0x5a6a3a) if HY else floor_lamp(x,y,'shade_e',0x6a5a2a))
def ashtray_stand(x,y):
    RA=random.Random(9)
    p=[cyl('ab',(x,y,0.012),0.14,0.024,MT['metal'],seg=20),cyl('ap',(x,y,0.33),0.014,0.62,MT['metal'],seg=10)]
    b=lathe('abowl',[(0.0,0.62),(0.11,0.62),(0.135,0.64),(0.14,0.66),(0.12,0.665),(0.10,0.645),(0.0,0.645)],MT['metal'],seg=24,c=(x,y,0)); p.append(b)
    m=join(p,'ashtray'); vc_const(m,0x7a7c76); smooth(m)
    ash=cyl('ash',(x,y,0.648),0.098,0.004,MT['metal'],seg=20); vc_const(ash,0x3a3834)
    bt=[]
    for i in range(6):
        a=RA.uniform(0,6.28); r=RA.uniform(0.02,0.08); c=cyl('butt',(0,0,0),0.0045,RA.uniform(0.022,0.034),MT['paper'],seg=6,rot=(math.pi/2,0,0)); xf(c,(x+r*math.cos(a),y+r*math.sin(a),0.654),(0,0,RA.uniform(0,6.28))); bt.append(c)
    o=join(bt,'butts'); vc_const(o,0xd8ccb0); box_uv(o,8)
x,y=epos(0.62,0.3); ashtray_stand(x,y)   # v4: Südende ist jetzt der Zauberkasten mit den Beinen
# Süd: Taucher im Ohrensessel, Lampe, Beistelltisch mit Radio
DIVER=(-1.25,-1.86) if HY else (-1.05,-2.05)
if not HY: wing_chair(-1.05,-2.05,-0.45)
LAMPS.append(hy_lamp(1.6,-2.12,'shade_s') if HY else floor_lamp(1.55,-2.18,'shade_s'))
side_table(2.45,-2.2,0.1); RADIO=(2.45,-2.2,0.6); radio(2.45,-2.2,math.pi+0.1+math.pi,0.6)
TZ=hy_table(-1.6,0.05,math.pi/2+0.12) if HY else (kidney_table(-1.6,0.05,math.pi/2+0.12),(0.45,0.22))[1]
dispenser(WP(WN,2.4,0,0.32))
# Tischdeko: Illustrierte
mg=[]
for i,(dx,dy,r,z) in enumerate([(-0.1,-0.25,0.3,TZ[0]+0.002),(0.12,0.1,-0.4,TZ[0]+0.002),(0.05,0.2,0.1,TZ[0]+0.008),(-0.05,-0.1,1.2,TZ[1]+0.002),(0.1,0.15,0.7,TZ[1]+0.002)]):
    m=box('mag',(0,0,0),(0.21,0.28,0.006),MT['paper']); cell_uv(m,[(i%4)*256,(i//4)*256,256,256],atlas=1024,axis='z'); xf(m,(0,0,0.003),(0,0,r)); 
    c=Vector((dx,dy,z)); R=Matrix.Rotation(math.pi/2+0.12,3,'Z'); c=R@c; xf(m,(-1.6+c.x,0.05+c.y,c.z)); mg.append(m)
# Papier auf dem Boden (leicht zerknüllt)
for i in range(34):
    x=random.uniform(-2.5,2.4) if i>=16 else random.uniform(-2.3,1.8); y=random.uniform(-2.2,2.2) if i>=16 else random.uniform(-1.9,1.9)
    if abs(x-SOFA[0])<0.6 and abs(y-SOFA[1])<1.1: continue
    q=grid_quad('pap',V((-0.105,-0.148,0)),V((0.105,-0.148,0)),V((-0.105,0.148,0)),V((0.105,0.148,0)),3,4,MT['paper'],lambda p:(0,0))
    cl=[6,7,8,9,14,0,1][i%7]; cell_uv(q,[(cl%4)*256,(cl//4)*256,256,256],atlas=1024,axis='z')
    for v in q.data.vertices: v.co.z=0.002+abs(random.gauss(0,0.006))*(1 if i%3==0 else 0.3)
    xf(q,(x,y,0),(0,0,random.uniform(0,6.28))); mg.append(q)
o=join(mg,'papers'); vc_const(o,0xffffff)
# Rote Pendelleuchten-Traube
PX,PY=-0.35,-0.85; czz=2.75-(PY+2.5)*0.03
pp=[cyl('can',(PX,PY,czz-0.02),0.08,0.04,MT['metal'],seg=16)]; red=[]; REDL=[]
RPd=random.Random(31)
for i in range(9):
    a=i/8*2*math.pi; r=0.0 if i==0 else (0.24 if i%2 else 0.36); x=PX+r*math.cos(a); y=PY+r*math.sin(a); z=czz-0.36-RPd.uniform(0,0.34)   # Unterkante >= 1.83 m (Kopf geht drunter durch)
    pp.append(cyl('cord',(x,y,(czz+z)/2+0.1),0.004,czz-z-0.2,MT['metal'],seg=4))
    g=lathe('rg',[(0.095,-0.2),(0.092,-0.08),(0.085,0.08),(0.05,0.13),(0.014,0.14)],MT['redglass'],seg=16,c=(x,y,z)); md=g.modifiers.new('so','SOLIDIFY'); md.thickness=0.004; apply_mods(g); smooth(g); red.append(g); REDL.append((x,y,z-0.04))
o=join(pp,'pend_metal'); vc_const(o,0x2a2420); o=join(red,'pend_glass'); vc_const(o,0x5a2a22)
# Toter Leuchtstoff-Kasten an der Decke + vertrocknete Topfpflanze (NO-Ecke)
fz=2.75-(0.5+2.5)*0.03
pt=lathe('pot',[(0.0,0),(0.12,0),(0.17,0.3),(0.18,0.32),(0.0,0.32)],MT['vinyl'],seg=16,c=(2.4,2.15,0)); vc_const(pt,0x6a3a22)
lv=[]; PTIPS=[]
for i in range(9):
    c=cyl('st',(0,0,0),0.006,random.uniform(0.5,1.0),MT['wood'],seg=4,r2=0.002); L=c.data.vertices[0].co.z
    rx_,ry_=random.uniform(-0.5,0.5),random.uniform(-0.5,0.5)
    xf(c,(0,0,0.4),(rx_,ry_,0)); xf(c,(2.4,2.15,0.3)); lv.append(c)
    PTIPS.append((Matrix.Translation((2.4,2.15,0.7))@Matrix.Rotation(ry_,4,'Y')@Matrix.Rotation(rx_,4,'X'),L))
o=join(lv,'plant'); vc_const(o,0x4a3a1c)
# v3: welke Blätter (hängen an den Stängeln, ein paar liegen am Boden) – eigener Zufall, damit der Rest der Szene gleich bleibt
RP=random.Random(5); lf=[]
for Mt,L_ in PTIPS:
    for k in range(2):
        t=RP.uniform(0.55,1.0)*L_/2; base=Mt@V((0,0,t))
        l=sphere('leaf',(0,0,0),1.0,MT['wood'],scl=(0.012,0.004,0.055),u=8,v=6); xf(l,(0,0,-0.05)); xf(l,(0,0,0),(RP.uniform(0.25,0.7)*(1 if k else -1),RP.uniform(-0.3,0.3),RP.uniform(0,6.28))); xf(l,tuple(base)); lf.append(l)
for i in range(6):
    a=RP.uniform(0,6.28); r=RP.uniform(0.2,0.42); l=sphere('leaf',(0,0,0),1.0,MT['wood'],scl=(0.014,0.05,0.003),u=8,v=6); xf(l,(2.4+r*math.cos(a),2.15+r*math.sin(a),0.004),(RP.uniform(-0.15,0.15),0,RP.uniform(0,6.28))); lf.append(l)
o=join(lf,'leaves'); vc_const(o,0x5e4626); smooth(o)
# ------------------------------------------------------------------ Figuren (Hybrid: statischer Körper + bewegliche Teile)
SEG_COLS=['torso','torso','torso','torso','arm','fore','hand','torso','arm','fore','hand','thigh','thigh','shin','foot','thigh','thigh','shin','foot']
def skel(over=None):
    J={'pel':(0,0,0.5),'spi':(0,-0.03,0.66),'che':(0,-0.04,0.84),'nec':(0,-0.02,1.0),
       'shL':(-0.19,-0.03,0.93),'elL':(-0.23,0.05,0.71),'wrL':(-0.17,0.28,0.64),'haL':(-0.14,0.37,0.62),
       'shR':(0.19,-0.03,0.93),'elR':(0.23,0.05,0.71),'wrR':(0.17,0.28,0.64),'haR':(0.14,0.37,0.62),
       'hiL':(-0.1,0.04,0.48),'knL':(-0.12,0.46,0.5),'anL':(-0.13,0.5,0.09),'toL':(-0.13,0.64,0.04),
       'hiR':(0.1,0.04,0.48),'knR':(0.12,0.46,0.5),'anR':(0.13,0.5,0.09),'toR':(0.13,0.64,0.04)}
    if over: J.update(over)
    return J
RAD={'pel':0.16,'spi':0.14,'che':0.16,'nec':0.055,'shL':0.065,'elL':0.048,'wrL':0.038,'haL':0.045,'shR':0.065,'elR':0.048,'wrR':0.038,'haR':0.045,
     'hiL':0.085,'knL':0.065,'anL':0.045,'toL':0.045,'hiR':0.085,'knR':0.065,'anR':0.045,'toR':0.045}
BONES=[('pel','spi'),('spi','che'),('che','nec'),('che','shL'),('shL','elL'),('elL','wrL'),('wrL','haL'),('che','shR'),('shR','elR'),('elR','wrR'),('wrR','haR'),
       ('pel','hiL'),('hiL','knL'),('knL','anL'),('anL','toL'),('pel','hiR'),('hiR','knR'),('knR','anR'),('anR','toR')]
def segdist(p,a,b):
    ab=b-a; t=max(0,min(1,(p-a).dot(ab)/max(1e-9,ab.dot(ab)))); return (p-(a+ab*t)).length
def skin_part(name,J,bones,radk,cols,rscale=None):
    names=sorted(set([b[0] for b in bones]+[b[1] for b in bones]),key=lambda n:list(J).index(n))
    vi={n:i for i,n in enumerate(names)}
    me=bpy.data.meshes.new(name); me.from_pydata([J[n] for n in names],[(vi[a],vi[b]) for a,b in bones],[]); o=bpy.data.objects.new(name,me); link(o)
    md=o.modifiers.new('sk','SKIN'); 
    for n,i in vi.items():
        r=RAD.get(n,0.05)*radk.get(n,1.0); rx,ry=(r,r) if not rscale or n not in rscale else (r*rscale[n][0],r*rscale[n][1])
        me.skin_vertices[0].data[i].radius=(rx,ry)
    me.skin_vertices[0].data[0].use_root=True
    o.modifiers.new('ss','SUBSURF').levels=1
    apply_mods(o); o.data.materials.append(MT['fig']); smooth(o)
    segs=[(V(J[a]),V(J[b]),BONES.index((a,b)) if (a,b) in BONES else 0) for a,b in bones]
    def colf(v):
        best=min(segs,key=lambda s:segdist(v,s[0],s[1])); k=SEG_COLS[best[2]]; return hexc(cols.get(k,cols['torso']))
    set_vc(o,colf); wr_lib.OBJS.append(o); return o
def make_head(name,pivot,spec):
    s=spec; o=sphere(name,(0,0,0),1.0,MT['fig'],u=28,v=18)
    for v in o.data.vertices:
        x,y,z=v.co.x,v.co.y,v.co.z; fr=max(0,y)
        y+=0.28*math.exp(-((x/0.13)**2+((z+0.08)/0.2)**2))*fr*s.get('nose',1)
        y-=0.13*math.exp(-(((abs(x)-0.36)/0.15)**2+((z-0.12)/0.11)**2))*fr
        y+=0.07*math.exp(-((z-0.3)/0.08)**2)*fr*(abs(x)<0.6)
        if z<-0.3: x*=1-0.25*(-z-0.3); y*=1-0.1*(-z-0.3)
        y-=0.05*math.exp(-((x/0.25)**2+((z+0.45)/0.06)**2))*fr
        v.co=V((x*s.get('w',0.085),y*s.get('d',0.1),z*s.get('h',0.115)))
    smooth(o)
    sk=hexc(s['skin']); dark=hexc(s.get('socket',0x3a2a22)); lip=hexc(s.get('lip',0x6a3a30))
    def hc(v):
        x,y,z=v.x/s.get('w',0.085),v.y/s.get('d',0.1),v.z/s.get('h',0.115)
        if y>0.3 and abs(abs(x)-0.36)<0.17 and abs(z-0.12)<0.12: return tuple(a*0.55+b*0.45 for a,b in zip(sk,dark))
        if y>0.5 and abs(x)<0.3 and abs(z+0.45)<0.06: return lip
        return sk
    set_vc(o,hc)
    parts=[o]
    for sx in (-1,1):  # Augen
        e=sphere('eye',(sx*0.36*s.get('w',0.085),0.83*s.get('d',0.1),0.12*s.get('h',0.115)),0.018*s.get('es',1),MT['fig'],u=10,v=6)
        set_vc(e,lambda v,sx=sx:hexc(0x101010) if v.y>0.83*s.get('d',0.1)+0.012*s.get('es',1) else hexc(s.get('eyew',0xc8c0a8))); parts.append(e)
        ear=sphere('ear',(sx*0.98*s.get('w',0.085),0.0,0.05*s.get('h',0.115)),0.025,MT['fig'],scl=(0.4,0.8,1.2),u=8,v=6); vc_const(ear,s['skin']); parts.append(ear)
    for f in s.get('extras',[]): parts+= [p for p in f() if p]
    h=join(parts,name); h.location=pivot; return h
def figure(name,x,y,yaw,spec):
    J=skel(spec.get('pose')); cols=spec['cols']; radk=spec.get('rad',{}); mv=spec.get('move',[])
    ex=set()
    if 'armR' in mv: ex|={('elR','wrR'),('wrR','haR')}
    if 'footR' in mv: ex|={('anR','toR')}
    if spec.get('nolegs'): ex|={b for b in BONES if b[0] in ('pel','hiL','hiR','knL','knR','anL','anR') and b[1] not in ('spi',)}
    bodyp=skin_part(name+'_body',J,[b for b in BONES if b not in ex],radk,cols)
    parts=[bodyp]+[p for f in spec.get('acc',[]) for p in f(J)]
    B=join(parts,name+'_body')
    R=Matrix.Rotation(yaw,4,'Z'); T=Matrix.Translation((x,y,0))
    B.data.transform(T@R)
    movers=[]
    if 'armR' in mv:
        piv=V(J['elR']); a=skin_part(name+'_arm',J,[('elR','wrR'),('wrR','haR')],radk,cols)
        extra=[p for f in spec.get('hand_acc',[]) for p in f(J)]
        a=join([a]+extra,name+'_arm'); a.data.transform(Matrix.Translation(-piv)); a.location=piv; movers.append(a)
    if 'footR' in mv:
        piv=V(J['anR']); a=skin_part(name+'_foot',J,[('anR','toR')],radk,cols)
        extra=[p for f in spec.get('foot_acc',[]) for p in f(J)]
        a=join([a]+extra,name+'_foot'); a.data.transform(Matrix.Translation(-piv)); a.location=piv; movers.append(a)
    if 'page' in mv:
        piv=V(spec['page_piv']); pg=box(name+'_page',(0.06,0,0),(0.115,0.16,0.003),MT['fig']); xf(pg,(0,0,0),(math.radians(-35),0,0)); vc_const(pg,0xd8ccb0); pg.location=piv; movers.append(pg); AX[name+'_page']=(Matrix.Rotation(yaw,3,'Z')@V((0,0.819,-0.574)),'page')
    hp=V(J['nec'])+V((0,0.01,0.05)); hd=make_head(name+'_head',(0,0,0),spec['head']); hd.data.transform(Matrix.Translation(V(spec['head'].get('off',(0,0,0.075))))); hd.location=hp; movers.append(hd)
    for m in movers:
        if m.name not in AX: AX[m.name]=((Matrix.Rotation(yaw,3,'Z')@V((1,0,0))) if not m.name.endswith('_head') else V((0,0,1)),m.name.split('_')[-1])
        p=(T@R)@m.location; m.data.transform(Matrix.Rotation(yaw,4,'Z')); m.location=p; MOVERS.append(m)
    return B
def acc_box(c,s,col,rot=(0,0,0),mat=None,bev=0.0):
    def f(J=None):
        o=box('acc',c,s,mat or MT['fig'],rot=rot,bev=bev); vc_const(o,col); return [o]
    return f
def acc_sphere(c,r,col,scl=(1,1,1)):
    def f(J=None):
        o=sphere('acc',c,r,MT['fig'],scl=scl,u=14,v=9); vc_const(o,col); smooth(o); return [o]
    return f
def acc_cyl(c,r,d,col,rot=(0,0,0),r2=None,seg=12):
    def f(J=None):
        o=cyl('acc',c,r,d,MT['fig'],seg=seg,rot=rot,r2=r2); vc_const(o,col); smooth(o); return [o]
    return f
def hair_cap(col,scl=(1.08,1.1,1.05),off=(0,-0.01,0.02),noise=0.0):
    def f():
        o=sphere('hair',(0,0,0),1.0,MT['fig'],u=20,v=12)
        for v in o.data.vertices:
            k=1+noise*random.uniform(-1,1)
            if v.co.y>0.2 and v.co.z<0.35: v.co.z=0.35+(v.co.z-0.35)*0.2
            v.co=V((v.co.x*0.085*scl[0]*k+off[0],v.co.y*0.1*scl[1]*k+off[1],v.co.z*0.115*scl[2]*k+off[2]))
        vc_const(o,col); smooth(o); return [o]
    return f
FIG={}
def hy_figures():
    """Hunyuan-Figuren aus figs.blend anhängen, platzieren, Bewegungsteile registrieren."""
    with bpy.data.libraries.load(FIGBLEND) as (src,dst): dst.objects=list(src.objects)
    objs={o.name:o for o in dst.objects}
    for o in objs.values(): link(o)
    mats={}
    def mat(n):
        if n not in mats:
            mats[n]=M('wr_fig_'+n,'fig_%s.png'%n,None,0.78)
            im=bpy.data.images.get('fig_%s.png'%n)
            if im and im.size[0]>576: im.scale(576,768)   # v2: Figurentextur für das GLB verkleinern (Quelle bleibt 768x1024)
        return mats[n]
    def put(n,x,y,yaw,z=0.0,only=None,fwd=0.0):
        R=Matrix.Rotation(yaw,4,'Z'); T=Matrix.Translation((x,y,z))@R@Matrix.Translation((0,fwd,0))
        for o in [o for o in objs.values() if o.get('fig')==n and (only is None or o.name in only)]:
            o.data.materials.clear(); o.data.materials.append(mat(n))
            if 'piv' in o:
                p=T@V(o['piv']); o.data.transform(R); o.location=p
                AX[o.name]=((Matrix.Rotation(yaw,3,'Z')@V(o['axis'])).normalized(),o['kind']); MOVERS.append(o)
            else: o.data.transform(T)
            wr_lib.OBJS.append(o)
    # v7: Mesh-Fixes. Assistentin: flache Dezimier-Facetten am Dekolleté glätten (Laplace, weich auslaufend);
    # Oma: Kopf einmal unterteilen (1,3k -> ~8k Tris), damit das Gesicht rund statt facettiert ist.
    def smooth_region(o,ctr,rad,it=12,fac=0.55):
        vg=o.vertex_groups.new(name='sm')
        for v in o.data.vertices:
            d=((v.co.x-ctr[0])/rad[0])**2+((v.co.z-ctr[2])/rad[2])**2
            if d<1 and v.co.y>ctr[1]: vg.add([v.index],float((1-d)**0.7),'REPLACE')
        md=o.modifiers.new('sm','SMOOTH'); md.factor=fac; md.iterations=it; md.vertex_group='sm'; apply_mods(o); o.vertex_groups.clear()
    # v7: Verdeckungs-Abdunklung aus fig_proc ist pro Fläche (0.6/1.0) → harte Dreiecks-Flecken (Oma-Gesicht, Dekolleté, Gesicht der Königin).
    # Hier je Vertex mitteln (2x mit den Nachbarn glätten), dann ist die Abdunklung weich.
    import numpy as _np2
    for o in objs.values():
        me=o.data
        if o.type!='MESH' or 'Col' not in me.color_attributes: continue
        ca=me.color_attributes['Col']; nl=len(me.loops); nv=len(me.vertices)
        c=_np2.zeros(nl*4,_np2.float32); ca.data.foreach_get('color',c); c=c.reshape(nl,4); vi=_np2.zeros(nl,_np2.int32); me.loops.foreach_get('vertex_index',vi)
        acc=_np2.zeros((nv,3),_np2.float32); cnt=_np2.zeros(nv,_np2.float32); _np2.add.at(acc,vi,c[:,:3]); _np2.add.at(cnt,vi,1); pv=acc/_np2.maximum(cnt,1)[:,None]
        e=_np2.zeros(len(me.edges)*2,_np2.int32); me.edges.foreach_get('vertices',e); e=e.reshape(-1,2)
        for _ in range(2):
            a2=pv.copy(); n2=_np2.ones(nv,_np2.float32); _np2.add.at(a2,e[:,0],pv[e[:,1]]); _np2.add.at(a2,e[:,1],pv[e[:,0]]); _np2.add.at(n2,e[:,0],1); _np2.add.at(n2,e[:,1],1); pv=a2/n2[:,None]
        c[:,:3]=pv[vi]; ca.data.foreach_set('color',c.ravel())
    hp=objs['assi_head']['piv'] if 'piv' in objs['assi_head'] else (0.024,-0.205,1.019)
    smooth_region(objs['assi_body'],(hp[0],hp[1]-0.02,hp[2]-0.09),(0.16,0,0.12))
    oh=objs['oma_head']; md=oh.modifiers.new('ss','SUBSURF'); md.levels=1; md.render_levels=1; md.uv_smooth='PRESERVE_BOUNDARIES'; apply_mods(oh); smooth(oh)
    # v7b: Kopf-"Kragen" aus fig_proc (3 Ringe, 4 mm eingerückt) sind bei den dezimierten Hunyuan-Köpfen fast ganze Kopf-Kopien
    # (Königin 1838 Flächen, Assistentin 2878) und stehen wegen uneinheitlicher Normalen teils VOR dem Kopf → Doppelgesicht der Königin
    # beim Kopfdrehen, Sprenkel im Oma-Gesicht (nach der Unterteilung liegt der Kopf tiefer), Kanten am Dekolleté der Assistentin.
    # Kragen-Inseln (≥90 % der Flächen < 8 mm an der Kopfhaut) bis auf einen schmalen, innen liegenden Halsring entfernen.
    from mathutils.bvhtree import BVHTree
    for n in ['oma','gruen','brand','jaeger','taucher','assi','frl','decke']:
        h=objs.get(n+'_head'); b=objs.get(n+'_body')
        if not h or not b or 'piv' not in h: continue
        P=V(h['piv']); bvh=BVHTree.FromPolygons([v.co+P for v in h.data.vertices],[tuple(p.vertices) for p in h.data.polygons])
        bm=bmesh.new(); bm.from_mesh(b.data); bm.faces.ensure_lookup_table(); seen=set(); kill=[]
        for f0 in bm.faces:
            if f0.index in seen: continue
            st=[f0]; comp=[]; seen.add(f0.index)
            while st:
                g=st.pop(); comp.append(g)
                for e in g.edges:
                    for g2 in e.link_faces:
                        if g2.index not in seen: seen.add(g2.index); st.append(g2)
            R=[(f,bvh.find_nearest(f.calc_center_median(),0.008)) for f in comp]
            if sum(r[0] is not None for f,r in R)<0.9*len(R): continue
            for f,r in R:
                c=f.calc_center_median()
                if not (r[0] is not None and c.z<P.z+0.02 and (c-r[0]).dot(r[1])<-0.001): kill.append(f)
        bmesh.ops.delete(bm,geom=kill,context='FACES'); bm.to_mesh(b.data); bm.free(); print('Kragen entfernt',n,len(kill))
    # v7b: Hals der Assistentin – vorn am Hals treffen die Frontprojektions-UVs Kinnschatten/Haarsträhnen/Paillettenkante
    # (dunkles "X" am Dekolleté). Ecken dort, die kein Hautpixel treffen, auf das nächste Hautpixel (≤ 48 px) im Konzeptbild ziehen.
    def neck_uv(n,box):
        import numpy as _n3
        b=objs[n+'_body']; P=V(objs[n+'_head']['piv']); im=bpy.data.images.load(SRC+'/fig_%s.png'%n,check_existing=True); w_,h_=im.size
        px=_n3.array(im.pixels[:],_n3.float32).reshape(h_,w_,4)[...,:3]
        skin=(px.min(2)>0.62)&((px[...,0]-px[...,2])<0.10)&((px[...,0]-px[...,1])<0.10)
        uv=b.data.uv_layers['UVMap'].data; fixed=0
        for p_ in b.data.polygons:
            c=p_.center-P
            if not (abs(c.x)<box[0] and box[1]<c.z<box[2] and c.y>box[3] and p_.normal.y>0.1): continue
            for li in p_.loop_indices:
                u,v_=uv[li].uv; X=int(round(u*(w_-1))); Y=int(round(v_*(h_-1)))
                if 0<=X<w_ and 0<=Y<h_ and skin[Y,X]: continue
                y0,y1,x0,x1=max(0,Y-48),min(h_,Y+49),max(0,X-48),min(w_,X+49); ys,xs=_n3.nonzero(skin[y0:y1,x0:x1])
                if not len(ys): continue
                k=int(_n3.argmin((ys+y0-Y)**2+(xs+x0-X)**2)); uv[li].uv=((xs[k]+x0)/(w_-1),(ys[k]+y0)/(h_-1)); fixed+=1
        print('Hals-UV',n,fixed)
    neck_uv('assi',(0.06,-0.075,0.035,0.03))
    def depth(n): return max(abs(v.co.y) for v in objs[n+'_body'].data.vertices)
    for n,key in [('oma','k'),('gruen','c'),('brand','club'),('jaeger','h')]:
        a_={'k':0.80,'c':1.50,'club':2.30,'h':4.15}[key]; x,y=wpos(a_,depth(n)+0.05); CH[key]=(x,y); put(n,x,y,wyaw)
    put('taucher',DIVER[0],DIVER[1],-0.45)
    # Zersägte Assistentin (v4, Showgirl): Oberkörper sitzt mit dem Schnitt AUF dem Sofapolster, Rücken an der Lehne (nicht mehr auf der Vorderkante);
    # Unterleib sitzt neben dem Sofa auf dem schwarzen Zauberkasten (gehört zum Hunyuan-Modell), Beine übereinandergeschlagen.
    sx,sy=SOFA
    def sofapos(off): p=V((sx,sy,0))+V((math.cos(eyaw),math.sin(eyaw),0))*off; return p.x,p.y
    B_=objs['assi_body']; zc=min(v.co.z for v in B_.data.vertices)
    back=min(v.co.y for v in B_.data.vertices if zc+0.05<v.co.z<zc+0.32)   # unterer Rücken (Haare hängen höher und weiter hinten)
    fwd=SOFA_BACK-back+0.015
    x,y=sofapos(0.42); put('assi',x,y,eyaw,z=SOFA_SEAT-zc-0.012,only={'assi_body','assi_head'},fwd=fwd)
    x,y=sofapos(-1.40); put('assi',x,y,eyaw+0.25,z=0.0,only={'assi_legs'},fwd=0.12)
    print('Assi: Schnitt',round(zc,3),'Rücken',round(back,3),'fwd',round(fwd,3))
    # Schnittflächen wie aus dem Zauberkasten: Messingrand + dunkelroter Samt, Form = konvexe Hülle des Querschnitts (keine runde "Platte")
    def hull2(pts):
        pts=sorted(set((round(p[0],4),round(p[1],4)) for p in pts))
        if len(pts)<3: return pts
        def cr(o,a,b): return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
        lo=[];up=[]
        for p_ in pts:
            while len(lo)>=2 and cr(lo[-2],lo[-1],p_)<=0: lo.pop()
            lo.append(p_)
        for p_ in reversed(pts):
            while len(up)>=2 and cr(up[-2],up[-1],p_)<=0: up.pop()
            up.append(p_)
        return lo[:-1]+up[:-1]
    def cap(name,o,top):
        ws=[o.matrix_world@v.co for v in o.data.vertices]
        zs=[w.z for w in ws]; ze=max(zs) if top else min(zs)
        near=[w for w in ws if abs(w.z-ze)<0.035]
        H=hull2([(w.x,w.y) for w in near]); cx=sum(h[0] for h in H)/len(H); cy=sum(h[1] for h in H)/len(H)
        out=[]
        for k,(sc_,dz,th,col) in enumerate([(0.97,0.0,0.014,0xa8823c),(0.88,0.009,0.006,0x4a1016)]):
            P=[(cx+(h[0]-cx)*sc_,cy+(h[1]-cy)*sc_) for h in H]; z0=ze-0.012+dz if top else ze-0.004+dz
            n=len(P); verts=[(px,py,z0) for px,py in P]+[(px,py,z0+th) for px,py in P]
            faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)]
            c=mesh_obj(name+str(k),verts,faces,MT['fig']); vc_const(c,col); out.append(c)
        return out
    cap('cap_legs',objs['assi_legs'],True); cap('cap_body',objs['assi_body'],False)
    # Fräulein hinter dem Schalter (auf hohem Hocker)
    cp=WP(WN,4.0,0,-0.40); put('frl',cp.x,cp.y,math.pi,z=0.11)   # v4: Barhocker; v7: 11 cm höher + näher ans Glas (Oberkörper füllt das Fenster wie Pete 02, Füße hinter der Theke)
    # v4: Mann in der blauen Steppdecke steht neben der NO-EXIT-Tür (Pete 06)
    put('decke',-0.42,-2.08,0.22)
    return cp
if HY:
    cp=hy_figures()
    arm=bpy.data.objects['brand_arm']; top=max((arm.matrix_world@v.co for v in arm.data.vertices),key=lambda w:w.z); SMOKE=tuple(top+V((0,0,0.02)))
else:
    FIG={}
    # 1 Alte Frau mit Buch (Küchenstuhl) – Seite blättert
    x,y=CH['k']
    FIG['oma']=figure('oma',x,y,wyaw,{'cols':{'torso':0xcfcab8,'arm':0xcfcab8,'fore':0xb89a88,'hand':0xb89a88,'thigh':0xcfcab8,'shin':0x8a7466,'foot':0x5a6a8a},
     'rad':{'pel':1.15,'hiL':1.2,'hiR':1.2,'knL':1.25,'knR':1.25},'move':['page'],'page_piv':(0.0,0.42,0.74),
     'pose':{'wrL':(-0.1,0.33,0.7),'haL':(-0.06,0.42,0.72),'wrR':(0.1,0.33,0.7),'haR':(0.06,0.42,0.72)},
     'acc':[acc_box((0,0.43,0.735),(0.24,0.17,0.025),0x5a2420,rot=(math.radians(-35),0,0))],
     'head':{'skin':0xb89a88,'socket':0x5a4038,'lip':0x7a4a44,'extras':[hair_cap(0xd8d4c8,noise=0.05),acc_sphere((0,-0.09,0.08),0.045,0xd8d4c8)]}})
    # 2 Grüngesichtiger Bürokrat (Chromstuhl) – Kopf dreht, Unterarm mit Papieren
    x,y=CH['c']
    FIG['gruen']=figure('gruen',x,y,wyaw,{'cols':{'torso':0x4a4c4e,'arm':0x4a4c4e,'fore':0x2a2c2e,'hand':0x6a9a4a,'thigh':0x3a3c3e,'shin':0x3a3c3e,'foot':0x141210},
     'move':['armR'],'hand_acc':[acc_box((0.15,0.42,0.66),(0.22,0.3,0.03),0xd8d0b8,rot=(math.radians(-10),0,0.3))],
     'acc':[acc_box((0,0.02,0.97),(0.08,0.05,0.12),0xc8c4b8),acc_box((0,0.05,0.9),(0.03,0.02,0.18),0x6a1a14)],
     'head':{'skin':0x5e8a3e,'socket':0x2a3a1a,'lip':0x3a4a2a,'extras':[hair_cap(0x1a1a14,(1.06,1.08,0.9),(0,-0.01,0.03))]}})
    # 3 Verbrannter Mann (Clubsessel) – Zigarette, Rauch (JS)
    x,y=CH['club']
    FIG['brand']=figure('brand',x,y,wyaw,{'cols':{'torso':0x1a1612,'arm':0x221c16,'fore':0x16120e,'hand':0x2a2018,'thigh':0x1c1814,'shin':0x1c1814,'foot':0x0c0a08},
     'pose':{'pel':(0,0.02,0.46),'spi':(0,-0.06,0.62),'che':(0,-0.1,0.8),'nec':(0,-0.09,0.96),'shL':(-0.2,-0.1,0.88),'shR':(0.2,-0.1,0.88),'elR':(0.26,0.0,0.7),'wrR':(0.24,0.12,0.82),'haR':(0.22,0.16,0.88),'elL':(-0.3,0.0,0.62),'wrL':(-0.3,0.2,0.6),'haL':(-0.3,0.28,0.6)},
     'move':['armR'],'hand_acc':[acc_cyl((0.22,0.2,0.9),0.004,0.08,0xd8d0c0,rot=(math.radians(70),0,0))],
     'head':{'skin':0x241c16,'socket':0x080604,'lip':0x3a1a10,'eyew':0xe0d8c0,'es':1.2,'extras':[]}})
    # 4 Schrumpfkopf-Jäger (Schalensessel nahe Schalter) – Fuß wippt, Kopf winzig
    x,y=CH['h']
    FIG['jaeger']=figure('jaeger',x,y,wyaw,{'cols':{'torso':0x8a7a52,'arm':0x8a7a52,'fore':0x8a7a52,'hand':0x6a4a30,'thigh':0x7a6a46,'shin':0x5a4a30,'foot':0x2a1c10},
     'pose':{'knR':(0.16,0.44,0.52),'anR':(0.2,0.52,0.1),'toR':(0.21,0.66,0.05)},'move':['footR'],
     'acc':[acc_cyl((0.32,0.18,0.55),0.012,1.1,0x2a1a10,rot=(math.radians(10),math.radians(-12),0)),acc_box((0,-0.03,0.66),(0.34,0.24,0.06),0x5a4a2a)],
     'head':{'skin':0x3a2618,'w':0.04,'d':0.045,'h':0.05,'off':(0,0,0.035),'socket':0x140c08,'lip':0x0c0806,'nose':0.6,'es':0.4,
       'extras':[lambda:[o for o in [lathe('helm',[(0.0,0.06),(0.13,0.045),(0.12,0.055),(0.07,0.075),(0.05,0.12),(0.0,0.14)],MT['fig'],seg=20)] if vc_const(o,0xc8b890) or True],
                 hair_cap(0x0c0a08,(0.55,0.55,0.8),(0,-0.008,-0.014),0.12)]}})
    # 5 Taucher (Ohrensessel, Neopren, Gummihai) – Kopf + Flosse
    x,y=DIVER; dy=-0.45
    def shark(J):
        o=sphere('shark',(0,0,0),1.0,MT['fig'],u=18,v=10)
        for v in o.data.vertices: v.co=V((v.co.x*0.06,v.co.y*0.3,v.co.z*0.07))
        f=cyl('fin',(0,0.02,0.09),0.04,0.09,MT['fig'],seg=4,r2=0.0); t=cyl('tail',(0,-0.32,0.0),0.06,0.06,MT['fig'],seg=4,r2=0.0,rot=(math.pi/2,0,0))
        s=join([o,f,t],'shark'); vc_const(s,0x6a7a80); xf(s,(-0.16,0.6,0.32),(0,math.radians(30),math.radians(-20))); return [s]
    FIG['taucher']=figure('taucher',x,y,dy,{'cols':{'torso':0x101418,'arm':0x101418,'fore':0x101418,'hand':0x141a20,'thigh':0x101418,'shin':0x101418,'foot':0x1a3a5a},
     'pose':{'anR':(0.14,0.62,0.12),'toR':(0.16,0.8,0.05)},'move':['footR'],'foot_acc':[acc_box((0.16,0.82,0.04),(0.16,0.32,0.015),0x1a3a6a,rot=(math.radians(-10),0,0))],
     'acc':[acc_cyl((0,-0.2,0.8),0.08,0.55,0x9a9a90),acc_box((-0.13,0.8,0.04),(0.16,0.32,0.015),0x1a3a6a),shark,acc_box((0,0.08,0.88),(0.34,0.02,0.04),0x2a6a9a)],
     'head':{'skin':0xa88a74,'socket':0x4a3428,'extras':[hair_cap(0x101418,(1.12,1.12,1.08),(0,-0.01,0.0)),acc_box((0,0.095,0.025),(0.15,0.03,0.07),0x8aa0a8,bev=0.01),acc_cyl((0.07,0.02,0.07),0.009,0.2,0xd0a020)]}})
    # 6 Zersägte Assistentin (Sofa): Oberkörper Nordende, Beine Südende – voll bekleidet
    sx,sy=SOFA; dirv=V((math.cos(eyaw+math.pi/2),math.sin(eyaw+math.pi/2),0))
    def sofapos(off): p=V((sx,sy,0))+V((math.cos(eyaw),math.sin(eyaw),0))*off; return p.x,p.y
    x,y=sofapos(-0.55)
    FIG['ass_top']=figure('assi',x,y,eyaw,{'cols':{'torso':0x8a1420,'arm':0xc8a890,'fore':0xc8a890,'hand':0xc8a890,'thigh':0x8a1420,'shin':0x8a1420,'foot':0x8a1420},
     'pose':{'pel':(0,-0.05,0.55),'hiL':(-0.1,-0.02,0.55),'hiR':(0.1,-0.02,0.55),'knL':(-0.1,0.02,0.53),'knR':(0.1,0.02,0.53),'anL':(-0.1,0.03,0.52),'anR':(0.1,0.03,0.52),'toL':(-0.1,0.04,0.52),'toR':(0.1,0.04,0.52),
       'elR':(0.24,0.06,0.74),'wrR':(0.14,0.26,0.82),'haR':(0.08,0.32,0.86),'wrL':(-0.12,0.27,0.8),'haL':(-0.06,0.33,0.84)},
     'nolegs':True,'move':['armR'],
     'hand_acc':[acc_box((0.06,0.36,0.88),(0.2,0.012,0.26),0xc89a3a,rot=(math.radians(-20),0,0.25))],
     'acc':[acc_box((0,0.0,0.46),(0.3,0.24,0.04),0xd8c080)],
     'head':{'skin':0xc8a890,'socket':0x4a2a28,'lip':0x9a1a1a,'extras':[hair_cap(0x0c0a0a,(1.25,1.2,1.15),(0,-0.015,0.02),0.12),acc_sphere((0,-0.04,0.12),0.07,0x0c0a0a,(1.3,1.0,0.8))]}})
    x,y=sofapos(0.45)
    legs_J=skel({'pel':(0,0.05,0.46),'hiL':(-0.09,0.08,0.46),'hiR':(0.09,0.08,0.46),'knL':(-0.06,0.48,0.5),'knR':(0.12,0.5,0.52),'anL':(-0.02,0.54,0.1),'anR':(0.22,0.6,0.08),'toL':(-0.02,0.66,0.03),'toR':(0.24,0.72,0.02)})
    lb=skin_part('assi_legs',legs_J,[('pel','hiL'),('hiL','knL'),('knL','anL'),('anL','toL'),('pel','hiR'),('hiR','knR'),('knR','anR')],{'pel':0.85},{'torso':0x8a1420,'thigh':0x6a6060,'shin':0x6a6060,'foot':0x0c0a0a})
    cut=cyl('cut',(0,0.05,0.58),0.13,0.03,MT['fig'],seg=16); vc_const(cut,0xd8c080)
    LB=join([lb,cut],'assi_legs'); LB.data.transform(Matrix.Translation((x,y,0))@Matrix.Rotation(eyaw,4,'Z'))
    piv=V(legs_J['anR']); ft=skin_part('assi_foot',legs_J,[('anR','toR')],{},{'torso':0x0c0a0a,'thigh':0x0c0a0a,'shin':0x0c0a0a,'foot':0x0c0a0a})
    ft.data.transform(Matrix.Translation(-piv)); ft.data.transform(Matrix.Rotation(eyaw,4,'Z')); ft.location=(Matrix.Translation((x,y,0))@Matrix.Rotation(eyaw,4,'Z'))@piv; ft.name='assi_foot'; MOVERS.append(ft); AX['assi_foot']=(Matrix.Rotation(eyaw,3,'Z')@V((1,0,0)),'foot')
    # 7 Fräulein Jenseits (hinter dem Schalter, stempelt)
    cp=WP(WN,4.0,0,-0.42)
    FIG['frl']=figure('frl',cp.x,cp.y,math.pi,{'cols':{'torso':0x5a1a2a,'arm':0x6a9a6a,'fore':0x6a9a6a,'hand':0x6a9a6a,'thigh':0x3a2a2a,'shin':0x6a9a6a,'foot':0x1a1010},
     'pose':{k:(v[0],v[1]+0.0,v[2]+0.3) for k,v in skel().items()}|{'che':(0,0.02,1.14),'nec':(0,0.06,1.3),'shL':(-0.18,0.02,1.23),'shR':(0.18,0.02,1.23),'elR':(0.24,0.18,1.08),'wrR':(0.18,0.4,1.08),'haR':(0.14,0.48,1.1),'elL':(-0.24,0.16,1.04),'wrL':(-0.16,0.42,1.07),'haL':(-0.12,0.5,1.07)},
     'move':['armR'],'hand_acc':[acc_cyl((0.14,0.5,1.06),0.022,0.08,0x3a2a1a)],
     'acc':[acc_box((0,0.05,1.08),(0.38,0.02,0.07),0xd8d0b0,rot=(0,math.radians(35),0))],
     'head':{'skin':0x6a9a6a,'socket':0x2a3a2a,'lip':0x8a1a1a,'extras':[hair_cap(0xb02a1a,(1.2,1.2,1.1),(0,-0.01,0.03),0.05),acc_sphere((0,-0.02,0.2),0.1,0xb02a1a,(1.0,1.0,1.4))]}})
    SMOKE=None
# ------------------------------------------------------------------ Alle Objekte: fehlende Vertexfarbe = weiß, UV0 sicherstellen
ALL=[o for o in bpy.data.objects if o.type=='MESH']
for o in ALL:
    if 'Col' not in o.data.color_attributes: vc_const(o,0xffffff)
    if not o.data.uv_layers: box_uv(o,1.0)
    if o.data.uv_layers[0].name!='UVMap': o.data.uv_layers[0].name='UVMap'
print('Objekte',len(ALL),'Tris',sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in ALL))
json.dump({'lamps':LAMPS,'red':REDL,'radio':RADIO,'chairs':CH,'sofa':SOFA,'diver':DIVER},open(HERE+'/layout.json','w'),indent=1)
COLL=[]
for o in [o for o in bpy.data.objects if o.type=='MESH']:
    if o.name.startswith(('floor','wall','ceil','pap','papers','sh_','win','off','shelf','tube','fixture','diffusor','pend','can','cord','hyp_')) or 'head' in o.name or 'collar' in o.name: continue
    ws=[o.matrix_world@v.co for v in o.data.vertices]
    if not ws: continue
    z0=min(w.z for w in ws); z1=max(w.z for w in ws)
    if z0>0.25 or z1<0.3: continue
    x0=min(w.x for w in ws); x1=max(w.x for w in ws); y0=min(w.y for w in ws); y1=max(w.y for w in ws)
    if x1-x0>2.8 or y1-y0>2.8 or (x1-x0)*(y1-y0)<0.01: continue
    COLL.append([round(x0+0.03,3),round(x1-0.03,3),round(-y1+0.03,3),round(-y0-0.03,3),o.name])
for parts in PROPBOX:   # v4: Hunyuan-Möbel als Ganzes (Lampe inkl. Schirm, Tisch inkl. Platte), 3 cm eingerückt wie oben
    ws=[o.matrix_world@v.co for o in parts for v in o.data.vertices]
    x0=min(w.x for w in ws); x1=max(w.x for w in ws); y0=min(w.y for w in ws); y1=max(w.y for w in ws)
    COLL.append([round(x0+0.03,3),round(x1-0.03,3),round(-y1+0.03,3),round(-y0-0.03,3),parts[0].name])
print('Kollision',len(COLL),[c[4] for c in COLL])
# ================================================================== Licht (nur für den Bake; Echtzeit-Lichter macht gfx_warteraum.js)
def plight(name,loc,col,W,r=0.05,kind='POINT',size=(1,1),rot=(0,0,0)):
    d=bpy.data.lights.new(name,kind); d.color=col; d.energy=W
    if kind=='POINT': d.shadow_soft_size=r
    if kind=='AREA': d.shape='RECTANGLE'; d.size=size[0]; d.size_y=size[1]
    o=bpy.data.objects.new(name,d); o.location=loc; o.rotation_euler=rot; link(o); return o
WARM=(1.0,0.54,0.24); GREEN=(0.42,1.0,0.36)
for i,(x,y,z) in enumerate(LAMPS): plight('lamp%d'%i,(x,y,z),WARM,125,0.06)   # v4: ohne Neonröhren tragen die Lampen den Raum
SCON=[(WN,1.75,1.62),(WW,2.10,1.74),(WS,3.2,1.9)]
for i,(W,a,b) in enumerate(SCON): plight('scon%d'%i,WP(W,a,b,0.035),(1.0,0.55,0.25),32,0.02)   # v4: großer Stern = echte Lichtinsel (Pete 03/05)
for i,p in enumerate(REDL): plight('red%d'%i,p,(1.0,0.36,0.2),3.2,0.03)
plight('shaft',((xa+xb)/2,SY+0.12,1.3),GREEN,260,kind='AREA',size=(xb-xa-0.05,2.4),rot=(-math.pi/2,0,0))
plight('office',(1.1,3.25,OZ-0.12),(0.72,1.0,0.68),55,kind='AREA',size=(1.8,0.9))   # v7: weniger Grün über der Schönheitskönigin
plight('counter',tuple(WP(WN,4.0,1.62,0.75)),(1.0,0.72,0.5),14,0.08)   # v7: warmes Licht von vorn auf ihr Gesicht (Pete 02)
plight('fill',(0,0,2.55),(0.74,0.64,0.52),46,kind='AREA',size=(5.0,4.0))   # v4: warm statt kalt; v7: fast 3x (Film gleichmäßiger, Wände/Gesichter lesbar)
plight('noexit_l',((xa+xb)/2,-2.25,2.12),(0.55,1.0,0.5),3.0,0.03)
plight('radio',(RADIO[0]+0.13,RADIO[1]+0.25,RADIO[2]+0.17),(1.0,0.7,0.35),0.6,0.01)
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(0.05,0.046,0.04,1); w.node_tree.nodes['Background'].inputs[1].default_value=0.30   # v7: wärmer, heller
# Rauch-/Sound-Ankerpunkte
def fpt(x,y,yaw,p): return tuple(Matrix.Translation((x,y,0))@Matrix.Rotation(yaw,4,'Z')@V(p))
ANCH={'smoke':SMOKE or fpt(*CH['club'],wyaw,(0.22,0.25,0.95)),'radio':(RADIO[0],RADIO[1],RADIO[2]+0.15),'office':(1.1,3.2,1.3),'clock':(CX,CY,CZ),'flip':tuple(WP(WN,4.0,2.18,0.2)),'tube':(0.7,0.5,2.6),
      'oma':fpt(*CH['k'],wyaw,(0,0.3,0.8)),'gruen':fpt(*CH['c'],wyaw,(0,0.2,1.0)),'brand':fpt(*CH['club'],wyaw,(0,0.1,1.0)),'jaeger':fpt(*CH['h'],wyaw,(0,0.1,1.0)),'taucher':(DIVER[0],DIVER[1],1.0),'assi':(SOFA[0],SOFA[1],0.9),'frl':tuple(cp)}
# ================================================================== Lightmap-UVs (UV1 'lm'), gemeinsamer Atlas
NOLM={'win_glass','off_glow','sh_glow','tube','flip_face'}
def is_vl(o): return o.type=='MESH' and o.material_slots and o.material_slots[0].material and (o.material_slots[0].material.name.startswith('wr_fig_') or o.material_slots[0].material.name=='wr_sofa')
VLOBJ=[o for o in bpy.data.objects if is_vl(o)]   # v7: Hunyuan-Figuren + Sofa: Licht als Vertexfarbe (Lightmap-Inseln auf dezimierten Meshes = Flecken/Facetten)
BAKE=[o for o in bpy.data.objects if o.type=='MESH' and o.name not in NOLM and o not in VLOBJ]
for o in BAKE:
    if 'lm' not in o.data.uv_layers: o.data.uv_layers.new(name='lm')
    o.data.uv_layers.active=o.data.uv_layers['lm']; o.data.uv_layers['UVMap'].active_render=True
for o in bpy.context.selected_objects: o.select_set(False)
for o in BAKE: o.select_set(True)
bpy.context.view_layer.objects.active=BAKE[0]
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(55),island_margin=0.0,area_weight=0.0,correct_aspect=True,scale_to_bounds=False)
bpy.ops.uv.average_islands_scale()
bpy.ops.uv.pack_islands(rotate=True,margin_method='FRACTION',margin=0.0035,shape_method='AABB')
bpy.ops.object.mode_set(mode='OBJECT')
print('UV fertig')
# ================================================================== Bake
lmimg=bpy.data.images.new('wr_lm',LM,LM,float_buffer=True)
for m in set(s.material for o in BAKE for s in o.material_slots if s.material):
    n=m.node_tree.nodes.new('ShaderNodeTexImage'); n.image=lmimg; n.name='LMBAKE'; m.node_tree.nodes.active=n
    uvn=m.node_tree.nodes.new('ShaderNodeUVMap'); uvn.uv_map='lm'; m.node_tree.links.new(uvn.outputs[0],n.inputs[0])
sc.cycles.samples=SPP; sc.cycles.max_bounces=4; sc.cycles.diffuse_bounces=3; sc.cycles.glossy_bounces=1; sc.cycles.transmission_bounces=2; sc.cycles.transparent_max_bounces=4
sc.render.bake.margin=8; sc.render.bake.use_pass_direct=True; sc.render.bake.use_pass_indirect=True; sc.render.bake.use_pass_color=False
os.makedirs(SRC,exist_ok=True)
if not NOBAKE:
    import time; t0=time.time()
    bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'},margin=8,use_clear=True)
    print('Bake s',round(time.time()-t0))
    lmimg.filepath_raw=SRC+'/lm_raw.exr'; lmimg.file_format='OPEN_EXR'; lmimg.save()
    # Entrauschen (OIDN über den Compositor)
    sc.use_nodes=True; tr=sc.node_tree
    for n in list(tr.nodes): tr.nodes.remove(n)
    ni=tr.nodes.new('CompositorNodeImage'); ni.image=lmimg; dn=tr.nodes.new('CompositorNodeDenoise'); dn.prefilter='NONE'; cpn=tr.nodes.new('CompositorNodeComposite')
    tr.links.new(ni.outputs[0],dn.inputs[0]); tr.links.new(dn.outputs[0],cpn.inputs[0])
    sc.render.resolution_x=LM; sc.render.resolution_y=LM; sc.render.resolution_percentage=100; sc.render.engine='BLENDER_WORKBENCH'
    sc.render.image_settings.file_format='OPEN_EXR'; sc.render.image_settings.color_depth='16'; sc.render.filepath=SRC+'/lm.exr'
    for o in bpy.data.objects: o.hide_render=True
    bpy.ops.render.render(write_still=True); sc.use_nodes=False; sc.render.engine='CYCLES'
    for o in bpy.data.objects: o.hide_render=False
VLSCALE=1.0; VLMATS=sorted({o.material_slots[0].material.name for o in VLOBJ})
if not NOBAKE and VLOBJ:   # v7: Vertex-Licht backen (Cycles, Ziel Vertexfarbe), glätten, mit der Tönung in 'Col' multiplizieren
    import numpy as np, time; t0=time.time()
    for o in VLOBJ:
        ca=o.data.color_attributes.new('VL','FLOAT_COLOR','POINT'); o.data.color_attributes.active_color=ca
    for o in bpy.context.selected_objects: o.select_set(False)
    for o in VLOBJ: o.select_set(True)
    bpy.context.view_layer.objects.active=VLOBJ[0]; sc.cycles.samples=max(SPP*6,512)
    bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'},target='VERTEX_COLORS',use_clear=True)
    sc.cycles.samples=SPP; print('VL-Bake s',round(time.time()-t0))
    allv=[]; VLD={}
    for o in VLOBJ:
        me=o.data; n=len(me.vertices); a=np.zeros(n*4,np.float32); me.color_attributes['VL'].data.foreach_get('color',a); a=a.reshape(n,4)[:,:3]
        e=np.zeros(len(me.edges)*2,np.int32); me.edges.foreach_get('vertices',e); e=e.reshape(-1,2)
        for _ in range(2):   # Rauschen glätten (Nachbarschaftsmittel)
            acc=a.copy(); cnt=np.ones(n,np.float32); np.add.at(acc,e[:,0],a[e[:,1]]); np.add.at(acc,e[:,1],a[e[:,0]]); np.add.at(cnt,e[:,0],1); np.add.at(cnt,e[:,1],1); a=0.5*a+0.5*acc/cnt[:,None]
        VLD[o.name]=a; allv.append(a.max(1))
    VLSCALE=float(np.percentile(np.concatenate(allv),99.5))
    for o in VLOBJ:
        me=o.data; a=np.maximum(VLD[o.name]/VLSCALE,0.03); col=me.color_attributes['Col']; nl=len(me.loops)
        c=np.zeros(nl*4,np.float32); col.data.foreach_get('color',c); c=c.reshape(nl,4); vi=np.zeros(nl,np.int32); me.loops.foreach_get('vertex_index',vi)
        c[:,:3]=np.clip(c[:,:3]*a[vi],0,1); col.data.foreach_set('color',c.ravel())
        me.color_attributes.remove(me.color_attributes['VL']); me.color_attributes.active_color=me.color_attributes['Col']
        try: me.color_attributes.render_color_index=me.color_attributes.active_color_index
        except Exception: pass
    print('VL scale',round(VLSCALE,4),len(VLOBJ),'Objekte')
for m in bpy.data.materials:
    for n in [n for n in m.node_tree.nodes if n.name=='LMBAKE' or n.bl_idname=='ShaderNodeUVMap']: m.node_tree.nodes.remove(n)
# ================================================================== Export: statisch je Material zusammengefasst, bewegliche Teile einzeln
mv_names={m.name for m in MOVERS}
def to3(v): return [round(v[0],4),round(v[2],4),round(-v[1],4)]
MOV={m.name:{'pivot':to3(m.location),'axis':to3(AX[m.name][0]),'kind':AX[m.name][1]} for m in MOVERS}
groups={}
for o in [o for o in bpy.data.objects if o.type=='MESH' and o.name not in mv_names]:
    mt=o.material_slots[0].material.name if o.material_slots else 'none'; groups.setdefault(mt,[]).append(o)
for mt,objs in groups.items(): join(objs,'S_'+mt)
for o in bpy.data.objects:
    if o.type=='MESH':
        o.data.uv_layers.active=o.data.uv_layers['UVMap']
tris={o.name:sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.data.objects if o.type=='MESH'}
print('Export-Objekte',len(tris),'Tris gesamt',sum(tris.values()))
bpy.ops.export_scene.gltf(filepath=AS+'/warteraum.glb',export_format='GLB',export_texcoords=True,export_normals=True,export_vertex_color='ACTIVE',export_image_format='WEBP',export_image_quality=88,
    export_materials='EXPORT',export_yup=True,export_apply=False,export_lights=False,export_cameras=False,use_selection=False,export_tangents=False)
json.dump({'movers':MOV,'anchors':{k:to3(v) for k,v in ANCH.items()},'lamps':[to3(l) for l in LAMPS],'red':[to3(p) for p in REDL],'sconces':[to3(WP(W,a,b,0.035)) for W,a,b in SCON],
   'window':to3(WP(WN,4.0,1.5,0.3)),'vlScale':VLSCALE,'vl':VLMATS,'shaft':to3(((xa+xb)/2,-2.6,1.2)),'tris':tris,'lm':LM,'colliders':[c[:4] for c in COLL]},open(AS+'/scene.json','w'),indent=1)
bpy.ops.wm.save_as_mainfile(filepath=HERE+'/warteraum.blend',compress=True,relative_remap=True)
bpy.ops.file.make_paths_relative(); bpy.ops.wm.save_mainfile(compress=True)
print('FERTIG')
