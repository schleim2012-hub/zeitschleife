# Sonnen-Oase o8 – Hybrid-Kundin: MakeHuman/MPFB-Basisfigur (CC0) + Rig (game_engine) + Hautfarbe/Gesicht nach Petes Referenz.
# Aufruf: blender -b -P gen_kundin_hybrid.py -- <out_dir> [pose]   (pose: lie | up | anim)
# Braucht MPFB 2.0.18 (Blender-Extension) + makehuman_system_assets_cc0 + faceunits01 (alles CC0, siehe v3/CREDITS.md).
import bpy, sys, os, math, json
from mathutils import Vector, Matrix, Quaternion
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
OUT=argv[0] if argv else '/workspace/hyb/out'; POSE=argv[1] if len(argv)>1 else 'lie'
KIDS=len(argv)>2 and argv[2]=='kids'
SKIN=os.environ.get('FIG_SKIN'); NRM=os.environ.get('FIG_NRM'); HAIR=os.environ.get('FIG_HAIR','long01'); TAG=os.environ.get('FIG_TAG','h8')   # o9: Foto-Haut (fertig farbangepasst), Poren-Normalmap, Frisur, Material-/Dateikennung   # jugendfrei: Badeanzug (Körper darunter entfernt) + Bademantel-Decke, Datei *_k8.glb
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.locationservice import LocationService
D=LocationService.get_user_data()
for o in list(bpy.data.objects): bpy.data.objects.remove(o,do_unlink=True)

info=HumanService._create_default_human_info_dict()
info['phenotype'].update({'gender':0.0,'age':0.5,'muscle':0.45,'weight':0.42,'proportions':0.85,'height':0.60,'cupsize':0.88,'firmness':0.66,
  'race':{'caucasian':0.9,'asian':0.05,'african':0.05}})
info['rig']='game_engine'
info['eyes']='high-poly/high-poly.mhclo'; info['eyebrows']='eyebrow010/eyebrow010.mhclo'; info['eyelashes']='eyelashes02/eyelashes02.mhclo'
info['hair']=HAIR+'/'+HAIR+'.mhclo'
info['skin_mhmat']=os.path.join(D,'skins','young_caucasian_female','young_caucasian_female.mhmat'); info['skin_material_type']='GAMEENGINE'
info['eyes_material_type']='GAMEENGINE'
st=HumanService.get_default_deserialization_settings(); st['subdiv_levels']=0
body=HumanService.deserialize_from_dict(info,st)
# Gesicht: Augen zu, entspanntes Lächeln (ARKit-Faceunits, CC0)
FU=os.path.join(D,'targets','faceunits')
EB=1.0 if POSE=='lie' else 0.3
for t,w in [('eyeBlinkLeft',EB),('eyeBlinkRight',EB),('mouthSmileLeft',0.55),('mouthSmileRight',0.55),('cheekSquintLeft',0.35),('cheekSquintRight',0.35),('browInnerUp',0.15)]:
  p=os.path.join(FU,t+'.target')
  if os.path.exists(p): TargetService.load_target(body,p,weight=w)
rig=[o for o in bpy.data.objects if o.type=='ARMATURE'][0]
print('RIGMW',[list(r) for r in rig.matrix_world], [o.parent.name if o.parent else None for o in bpy.data.objects])
print('OBJS',[(o.name,o.type,len(o.data.vertices) if o.type=='MESH' else '') for o in bpy.data.objects])
bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active=rig; bpy.ops.object.mode_set(mode='POSE')
def aim(name,d):
  pb=rig.pose.bones[name]; bpy.context.view_layer.update()
  cur=(pb.tail-pb.head).normalized(); dl=(rig.matrix_world.inverted().to_3x3()@Vector(d)).normalized(); q=cur.rotation_difference(dl)
  h=pb.head.copy(); pb.matrix=Matrix.Translation(h)@q.to_matrix().to_4x4()@Matrix.Translation(-h)@pb.matrix; bpy.context.view_layer.update()
def rot(name,axis,deg):
  pb=rig.pose.bones[name]; pb.rotation_mode='XYZ'; r=list(pb.rotation_euler); r['XYZ'.index(axis)]+=math.radians(deg); pb.rotation_euler=r; bpy.context.view_layer.update()
# Blender: steht, Gesicht -Y, Kopf +Z. Arme seitlich am Körper, Ellbogen leicht gebeugt, Hände flach
if POSE in ('lie','anim'):
  aim('upperarm_l',( 0.22, 0.14,-1)); aim('lowerarm_l',( 0.10, 0.10,-1)); aim('hand_l',( 0.02, 0.10,-1))
  aim('upperarm_r',(-0.22, 0.14,-1)); aim('lowerarm_r',(-0.10, 0.10,-1)); aim('hand_r',(-0.02, 0.10,-1))
  aim('thigh_l',( 0.06,0.0,-1)); aim('thigh_r',(-0.06,0.0,-1)); aim('calf_l',(0.03,0.02,-1)); aim('calf_r',(-0.03,0.02,-1))
  aim('foot_l',( 0.30,-0.75,-0.55)); aim('foot_r',(-0.30,-0.75,-0.55))   # liegt: Zehen nach oben-außen, entspannt
  for s in 'lr':
    for f in ['index','middle','ring','pinky']:
      for i in '123': rot(f'{f}_0{i}_{s}','X',6)
if POSE=='up':   # aufgesetzt, Oberkörper leicht zurückgelehnt, auf die Hände gestützt (hinter der Hüfte), Beine liegen
  for b,d in [('spine_01',(0,1.05,1)),('spine_02',(0,0.95,1)),('spine_03',(0,0.80,1)),('neck_01',(0,0.30,1)),('head',(0,0.05,1))]: aim(b,d)
  aim('thigh_l',( 0.07,-1,0.02)); aim('thigh_r',(-0.07,-1,0.02)); aim('calf_l',(0.02,-1,0.0)); aim('calf_r',(-0.02,-1,0.0))
  aim('foot_l',(0.25,-0.35,1)); aim('foot_r',(-0.25,-0.35,1))
  aim('upperarm_l',( 0.28, 0.62,-0.73)); aim('lowerarm_l',( 0.18, 0.30,-0.94)); aim('hand_l',( 0.10,-0.95,-0.2))
  aim('upperarm_r',(-0.28, 0.62,-0.73)); aim('lowerarm_r',(-0.18, 0.30,-0.94)); aim('hand_r',(-0.10,-0.95,-0.2))
bpy.ops.object.mode_set(mode='OBJECT')
# hinlegen: Kopf -> -X, Gesicht -> +Z (Blender), Rücken auf z=0
R=Matrix(((0,0,-1),(1,0,0),(0,-1,0))) if POSE!='up' else Matrix(((0,-1,0),(1,0,0),(0,0,1)))
rig.matrix_world=R.to_4x4()@rig.matrix_world
bpy.context.view_layer.update()
dg=bpy.context.evaluated_depsgraph_get(); be=body.evaluated_get(dg); me=be.to_mesh()
vs=[be.matrix_world@v.co for v in me.vertices]; xmin=min(v.x for v in vs); zmin=min(v.z for v in vs); be.to_mesh_clear()
if POSE=='up':
  pw=rig.matrix_world@rig.pose.bones['pelvis'].head; rig.location+=Vector((-0.1415-pw.x,0,-zmin-0.004))
else: rig.location+=Vector((-0.95-xmin,0,-zmin-0.004))
bpy.context.view_layer.update()
print('BOUNDS', xmin, zmin)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'kundin_'+POSE+('_k'+TAG[1:] if KIDS else '')+'.blend'))
# ---------------- Export (glTF, statisch gebacken): body / hair / deco_* / towel + COLOR_0 (AO, a=ölbar) + _SOFT
import numpy as np
from mathutils.bvhtree import BVHTree
def bone_w(n): return rig.matrix_world@rig.pose.bones[n].head
NECK=bone_w('neck_01'); PEL=bone_w('pelvis'); SP2=bone_w('spine_02'); KN=[bone_w('calf_l'),bone_w('calf_r')]
print('BONES neck',tuple(NECK),'pelvis',tuple(PEL),'spine02',tuple(SP2))
def tex_proc(img,fn,kind,size):
  im=img.copy(); im.scale(size,size); a=np.array(im.pixels[:],dtype=np.float32).reshape(size,size,4)
  if kind=='skin':   # gebräunt, warm (Referenz: goldbraun im Lampenlicht)
    c=a[...,:3]; L=c.mean(-1,keepdims=True); c=np.clip(L+(c-L)*1.25,0,1)
    a[...,:3]=np.clip(c**1.12*np.array([0.96,0.80,0.66]),0,1)
  elif kind=='hair': # blond: Luminanz -> Goldverlauf
    L=a[...,:3]@np.array([0.3,0.55,0.15]); m=a[...,3]>0.5; Lm=float(np.median(L[m])) if m.any() else 0.3
    t=np.clip(L/Lm*0.55,0,1.4)[...,None]; col=np.array([1.0,0.80,0.50]); a[...,:3]=np.clip(col*t+0.10*np.clip(t-0.6,0,1),0,1)   # Struktur bleibt, nur umgefärbt
  im.pixels[:]=a.ravel(); im.filepath_raw=fn; im.file_format='JPEG' if fn.endswith('.jpg') else 'PNG'; im.save(); return im
def first_img(o):
  ns=[n for n in o.active_material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image]
  for n in ns:
    if 'diffuse' in n.name.lower(): return n.image
  return ns[0].image
def simple_mat(name,img,alpha=False,rough=0.6):
  m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; b=nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value=rough
  t=nt.nodes.new('ShaderNodeTexImage'); t.image=img; nt.links.new(t.outputs['Color'],b.inputs['Base Color'])
  if alpha: nt.links.new(t.outputs['Alpha'],b.inputs['Alpha']); m.blend_method='CLIP'
  return m
dg=bpy.context.evaluated_depsgraph_get(); col=bpy.data.collections.new('EXPORT'); bpy.context.scene.collection.children.link(col)
def bake(o,name):
  e=o.evaluated_get(dg); me=bpy.data.meshes.new_from_object(e,preserve_all_data_layers=True,depsgraph=dg); me.transform(o.matrix_world)
  n=bpy.data.objects.new(name,me); col.objects.link(n); return n
objs={o.name:o for o in bpy.data.objects if o.type=='MESH'}
HO=[o for o in objs.values() if HAIR in o.name][0]
B=bake(body,'body'); Hh=bake(HO,'hair')
SUIT=None
if KIDS:   # Badeanzug aus den Rumpf-Gewichten (pelvis/spine) – Haut darunter wird gelöscht, die Datei enthält nichts Nacktes
  import bmesh as _bm, numpy as _np
  for g in body.vertex_groups: B.vertex_groups.new(name=g.name)
  gi={g.name:g.index for g in B.vertex_groups}; T_=[gi[n] for n in ('pelvis','spine_01','spine_02','spine_03','nipple','nippleTip','genitals') if n in gi]
  Sw=_np.array([sum(e.weight for e in v.groups if e.group in T_) for v in B.data.vertices])
  N_=[gi[k] for k in ('neck_01','head') if k in gi]; C_=[gi[k] for k in ('clavicle_l','clavicle_r','upperarm_l','upperarm_r') if k in gi]
  Sw=Sw-_np.array([sum(2.0*e.weight for e in v.groups if e.group in N_)+sum(0.9*e.weight for e in v.groups if e.group in C_) for v in B.data.vertices])   # Ausschnitt: Hals/Schultern frei (Tanksuit)
  bm=_bm.new(); bm.from_mesh(B.data); bm.verts.ensure_lookup_table()
  _bm.ops.delete(bm,geom=[f for f in bm.faces if not any(Sw[v.index]>0.45 for v in f.verts)],context='FACES')
  for v in bm.verts: v.co+=v.normal*0.005
  sm=bpy.data.meshes.new('top'); bm.to_mesh(sm); bm.free(); SUIT=bpy.data.objects.new('top',sm); col.objects.link(SUIT)
  bm=_bm.new(); bm.from_mesh(B.data); bm.verts.ensure_lookup_table()
  _bm.ops.delete(bm,geom=[f for f in bm.faces if all(Sw[v.index]>0.62 for v in f.verts)],context='FACES')
  _bm.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS'); bm.to_mesh(B.data); bm.free(); B.vertex_groups.clear()
  SUIT.data.materials.append(bpy.data.materials.new('suit_k8'))
DEC=[bake(o,'deco_'+k.replace('-','')) for k in ('eyebrow','eyelash','high-poly') for o in objs.values() if k in o.name and not (k=='eyelash' and EB>0.5)]   # Wimpern-Proxy folgt dem Lidschluss nicht -> bei geschlossenen Augen weglassen
if SKIN:
  skin=bpy.data.images.load(SKIN); skin.scale(2048,2048); skin.filepath_raw=os.path.join(OUT,'skin_'+TAG+'.jpg'); skin.file_format='JPEG'; skin.save()
else: skin=tex_proc(first_img(body),os.path.join(OUT,'skin_'+TAG+'.jpg'),'skin',1024)
hairI=tex_proc(first_img(HO),os.path.join(OUT,'hair_'+TAG+'.png'),'hair',1024)
B.data.materials.clear(); sm_=simple_mat('skin_'+TAG,skin,rough=0.55); B.data.materials.append(sm_)
if NRM:
  ni=bpy.data.images.load(NRM); ni.colorspace_settings.name='Non-Color'; nt_=sm_.node_tree; tn=nt_.nodes.new('ShaderNodeTexImage'); tn.image=ni
  nm_=nt_.nodes.new('ShaderNodeNormalMap'); nt_.links.new(tn.outputs['Color'],nm_.inputs['Color']); nt_.links.new(nm_.outputs['Normal'],nt_.nodes['Principled BSDF'].inputs['Normal'])
Hh.data.materials.clear(); Hh.data.materials.append(simple_mat('hair_'+TAG,hairI,alpha=True,rough=0.5))
if POSE!='up':   # liegt: Haar fällt auf Kopfteil/Handtuch statt hindurch (flach auf die Unterlage gedrückt, leicht ausgebreitet)
  for v in Hh.data.vertices:
    if v.co.z<0.012: d=0.012-v.co.z; v.co.z=0.003+0.009*math.exp(-d/0.012); v.co.y*=1+min(d,0.05)*1.2
dg=bpy.context.evaluated_depsgraph_get()
# Handtuch: Raster über der Hüfte, von oben auf den Körper projiziert (+1,2 cm), Ränder hängen zur Liege
bvb=BVHTree.FromObject(B,dg)
hx=PEL.x+(0.07 if POSE=='lie' else 0.25)+(0.10 if KIDS else 0); nx,ny=36,64; TL,TWD=(0.50 if KIDS else 0.34),0.62; vs=[]
for i in range(nx):
  for j in range(ny):
    x=hx-TL/2+TL*i/(nx-1); y=-TWD/2+TWD*j/(ny-1); h=bvb.ray_cast(Vector((x,y,0.32 if POSE=='up' else 0.6)),Vector((0,0,-1)))
    vs.append((x,y,min(h[0].z,0.26 if POSE=='up' else 0.4) if h[0] else -1.0))
V=np.array(vs).reshape(nx,ny,3); HIT=V[...,2]>-0.5; Z0=np.where(HIT,V[...,2]+0.012,0.0)
# Fall zur Liege: von der Körperkontur mit begrenzter Steigung abwärts (kein senkrechter Kasten), Unterkante >= 3 mm
dy=TWD/(ny-1); Z=Z0.copy()
for it in range(80):
  nb=np.maximum.reduce([np.roll(Z,1,1),np.roll(Z,-1,1),np.roll(Z,1,0),np.roll(Z,-1,0)])-dy*1.25
  Z=np.maximum(Z0,np.maximum(nb,0.003))
for it in range(24):   # weich, nur nach oben (bleibt über der Haut)
  S=Z.copy(); S[1:-1,1:-1]=0.25*(Z[2:,1:-1]+Z[:-2,1:-1]+Z[1:-1,2:]+Z[1:-1,:-2]); Z=np.maximum(Z0,np.where(HIT,np.maximum(Z,S),S))
V[...,2]=Z
fs=[(i*ny+j,(i+1)*ny+j,(i+1)*ny+j+1,i*ny+j+1) for i in range(nx-1) for j in range(ny-1)]
tm=bpy.data.meshes.new('towel'); tm.from_pydata([tuple(v) for v in V.reshape(-1,3)],[],fs); tm.update()
TW=bpy.data.objects.new('robe' if KIDS else 'towel',tm); col.objects.link(TW)
# UV nach Bogenlänge (Streifen nicht gedehnt)
AL=np.zeros((nx,ny)); AL[:,1:]=np.cumsum(np.sqrt(dy**2+np.diff(Z,axis=1)**2),axis=1); AL/=AL[:,-1:].max()
uvl=tm.uv_layers.new(name='UVMap')
for poly in tm.polygons:
  for li in poly.loop_indices: k=tm.loops[li].vertex_index; i,j=divmod(k,ny); uvl.data[li].uv=(0.5*i/(nx-1),AL[i,j])
dg=bpy.context.evaluated_depsgraph_get()
occ=[B,Hh,TW]+([SUIT] if SUIT else []); bvh=[BVHTree.FromObject(o,dg) for o in occ]
import random; random.seed(3); dirs=[]
while len(dirs)<20:
  d=Vector((random.uniform(-1,1),random.uniform(-1,1),random.uniform(-1,1)))
  if 0.2<d.length<=1: dirs.append(d.normalized())
def ao_of(o):
  me=o.data; out=np.ones(len(me.vertices))
  for i,v in enumerate(me.vertices):
    p=v.co+v.normal*0.003; hit=0; tot=0
    for d in dirs:
      if d.dot(v.normal)<=0.05: continue
      tot+=1
      if p.z+d.z*0.25<0.0 or any(t.ray_cast(p,d,0.25)[0] for t in bvh): hit+=1
    out[i]=1-0.75*hit/max(tot,1)
  return out
def sst(e0,e1,x): t=np.clip((x-e0)/(e1-e0),0,1); return t*t*(3-2*t)
P=np.array([v.co for v in B.data.vertices]); x,y,z=P[:,0],P[:,1],P[:,2]
oil=np.clip((x-(NECK.x+0.035))/0.04,0,1)
BRc=[]
for sgn in (1,-1):
  m=(x>NECK.x+0.10)&(x<NECK.x+0.32)&(y*sgn>0.03)&(y*sgn<0.16); k=np.argmax(np.where(m,z,-9)); BRc.append(P[k]-np.array([0,0,0.035]))
br=np.zeros(len(P))
for c in BRc: br=np.maximum(br,np.clip(1-np.linalg.norm((P-c)/[0.085,0.09,0.08],axis=1),0,1)**0.7)
bel=0.35+0.35*np.exp(-((x-(SP2.x+PEL.x)/2)/0.13)**2)*sst(0.10,0.16,z)
thg=0.55*(x>PEL.x+0.05)*(x<KN[0].x-0.05)*sst(0.04,0.11,z)
soft=np.maximum(np.maximum(bel,thg),br)*np.clip((x-NECK.x-0.02)/0.08,0,1)
def put_color(o,ao,a):
  me=o.data; ca=me.color_attributes.new('Col','FLOAT_COLOR','POINT'); C=np.stack([ao,ao,ao,a],1).astype(np.float32); ca.data.foreach_set('color',C.ravel())
  me.color_attributes.active_color=ca
put_color(B,ao_of(B),oil)
sa=B.data.attributes.new('_SOFT','FLOAT2','POINT'); sa.data.foreach_set('vector',np.stack([soft,br],1).astype(np.float32).ravel())
ha=ao_of(Hh); put_color(Hh,0.6+0.4*ha,1+0*ha); ta=ao_of(TW); put_color(TW,np.clip(ta*0.35+0.65,0,1),0*ta)
if SUIT:
  sa_=ao_of(SUIT); me=SUIT.data; ca=me.color_attributes.new('Col','FLOAT_COLOR','POINT'); C=np.stack([0.10*sa_,0.55*sa_,0.62*sa_,0*sa_],1).astype(np.float32); ca.data.foreach_set('color',C.ravel()); me.color_attributes.active_color=ca   # 80er-Türkis
cx=float(np.mean([c[0] for c in BRc])); cy=float(np.max([abs(c[1]) for c in BRc]))
json.dump({'chestAdult':{'x0':round(cx-0.08,3),'x1':round(cx+0.08,3),'zIn':0.012,'zOut':round(cy+0.09,3)},'brc':[list(map(float,c)) for c in BRc],'neck':list(NECK),'pelvis':list(PEL)},open(os.path.join(OUT,'kundin_'+POSE+('_k'+TAG[1:] if KIDS else '_'+TAG)+'_info.json'),'w'),indent=1)
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'kundin_'+POSE+('_k'+TAG[1:] if KIDS else '_'+TAG)+'.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_attributes=True,
  export_vertex_color='ACTIVE',export_skins=False,export_morph=False,export_animations=False,export_materials='EXPORT',export_image_format='AUTO')
print('EXPORTED',os.path.getsize(os.path.join(OUT,'kundin_'+POSE+('_k'+TAG[1:] if KIDS else '_'+TAG)+'.glb'))//1024,'KB')
