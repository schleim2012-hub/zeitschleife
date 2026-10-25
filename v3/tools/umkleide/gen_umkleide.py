# Umkleide C&Ä u1 – Petes KI-Figur (grüner Bob), stehend. Basis wie gen_kundin_hybrid.py (MakeHuman/MPFB CC0).
# Aufruf: blender -b -P gen_umkleide.py -- <out_dir> lie|stand   (lie = nur .blend für die Gesichts-Projektion der figur-Pipeline; stand = GLB-Export)
# Env: FIG_SKIN, FIG_NRM, FIG_HAIR (bob01), FIG_TAG (u1)
import bpy, sys, os, math, json
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
argv=sys.argv[sys.argv.index('--')+1:]; OUT=argv[0]; POSE=argv[1] if len(argv)>1 else 'stand'
SKIN=os.environ.get('FIG_SKIN'); NRM=os.environ.get('FIG_NRM'); HAIR=os.environ.get('FIG_HAIR','bob01'); TAG=os.environ.get('FIG_TAG','u1')
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.locationservice import LocationService
D=LocationService.get_user_data(); SD=LocationService.get_mpfb_data('targets') if hasattr(LocationService,'get_mpfb_data') else None
for o in list(bpy.data.objects): bpy.data.objects.remove(o,do_unlink=True)
info=HumanService._create_default_human_info_dict()
info['phenotype'].update({'gender':0.0,'age':0.50,'muscle':0.38,'weight':0.36,'proportions':0.92,'height':0.47,'cupsize':0.74,'firmness':0.72,   # u2: zierlich-schlank wie Petes Front/Seite/Rücken-Refs
  'race':{'caucasian':0.95,'asian':0.03,'african':0.02}})
info['rig']='game_engine'
info['eyes']='high-poly/high-poly.mhclo'; info['eyebrows']='eyebrow010/eyebrow010.mhclo'; info['eyelashes']='eyelashes02/eyelashes02.mhclo'
info['hair']=HAIR+'/'+HAIR+'.mhclo'
info['skin_mhmat']=os.path.join(D,'skins','young_caucasian_female','young_caucasian_female.mhmat'); info['skin_material_type']='GAMEENGINE'; info['eyes_material_type']='GAMEENGINE'
st=HumanService.get_default_deserialization_settings(); st['subdiv_levels']=0
body=HumanService.deserialize_from_dict(info,st)
# Gesicht: erwachsener (Kiefer/Wangenknochen definierter, weniger Babyspeck), entspannt, Augen offen
SYS=os.path.expanduser('~/.config/blender/4.2/extensions/user_default/mpfb/data/targets')
# u3: KEINE eigenen Reife-Boosts mehr (wirkten männlich) – nur weiche weibliche Züge, Ref-Gesicht wirkt selbst erwachsen
for t,w in [('mouth/mouth-upperlip-volume-incr',0.35),('mouth/mouth-lowerlip-volume-incr',0.30),('eyes/l-eye-scale-incr',0.15),('eyes/r-eye-scale-incr',0.15),
            ('chin/chin-width-decr',0.20),('chin/chin-prominent-decr',0.20),('chin/chin-bones-decr',0.15),
            ('torso/measure-waist-circ-decr',0.55),('torso/measure-shoulder-dist-decr',0.30),('hip/hip-scale-horiz-incr',0.20),
            ('buttocks/buttocks-volume-incr',0.30),('stomach/stomach-pregnant-decr',0.35),('torso/measure-hips-circ-incr',0.15)]:
  p=os.path.join(SYS,t+'.target.gz')
  if os.path.exists(p): TargetService.load_target(body,p,weight=w); print('TGT',t,w)
  else: print('MISSING',p)
try: HumanService.refit(body); print('REFIT ok')   # Haar/Augen/Brauen an den veränderten Kopf anpassen (u1/u2: Kopfhaut stach durchs Haar)
except Exception as e: print('REFIT fail',e)
FU=os.path.join(D,'targets','faceunits')
for t,w in [('mouthSmileLeft',0.12),('mouthSmileRight',0.12),('browInnerUp',0.05)]:
  p=os.path.join(FU,t+'.target')
  if os.path.exists(p): TargetService.load_target(body,p,weight=w)
rig=[o for o in bpy.data.objects if o.type=='ARMATURE'][0]
bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active=rig; bpy.ops.object.mode_set(mode='POSE')
def aim(name,d):
  pb=rig.pose.bones[name]; bpy.context.view_layer.update()
  cur=(pb.tail-pb.head).normalized(); dl=(rig.matrix_world.inverted().to_3x3()@Vector(d)).normalized(); q=cur.rotation_difference(dl)
  h=pb.head.copy(); pb.matrix=Matrix.Translation(h)@q.to_matrix().to_4x4()@Matrix.Translation(-h)@pb.matrix; bpy.context.view_layer.update()
def rot(name,axis,deg):
  pb=rig.pose.bones[name]; pb.rotation_mode='XYZ'; r=list(pb.rotation_euler); r['XYZ'.index(axis)]+=math.radians(deg); pb.rotation_euler=r; bpy.context.view_layer.update()
# Stand (Blender: Gesicht -Y, Kopf +Z): lockere A-Pose wie die Referenz, Ellbogen leicht gebeugt, Gewicht minimal links
aim('upperarm_l',( 0.30, 0.04,-1)); aim('lowerarm_l',( 0.16,-0.06,-1)); aim('hand_l',( 0.08,-0.02,-1))
aim('upperarm_r',(-0.30, 0.04,-1)); aim('lowerarm_r',(-0.16,-0.06,-1)); aim('hand_r',(-0.08,-0.02,-1))
aim('thigh_l',( 0.07,0.0,-1)); aim('thigh_r',(-0.05,0.0,-1)); aim('calf_l',(0.05,0.01,-1)); aim('calf_r',(-0.03,0.01,-1))
for s in 'lr':
  for f in ['index','middle','ring','pinky']:
    for i in '123': rot(f'{f}_0{i}_{s}','X',8)
bpy.ops.object.mode_set(mode='OBJECT')
R=Matrix(((0,0,-1),(1,0,0),(0,-1,0))) if POSE=='lie' else Matrix.Identity(3)   # lie: Ausrichtung, die f1..f5 erwarten (Gesicht +Z)
rig.matrix_world=R.to_4x4()@rig.matrix_world; bpy.context.view_layer.update()
dg=bpy.context.evaluated_depsgraph_get(); be=body.evaluated_get(dg); me=be.to_mesh(); vs=[be.matrix_world@v.co for v in me.vertices]; be.to_mesh_clear()
if POSE=='lie': rig.location+=Vector((-0.95-min(v.x for v in vs),0,-min(v.z for v in vs)-0.004))
else:
  pw=rig.matrix_world@rig.pose.bones['pelvis'].head; rig.location+=Vector((-pw.x,-pw.y,-min(v.z for v in vs)))
bpy.context.view_layer.update()
os.makedirs(OUT,exist_ok=True)
if POSE=='lie':
  bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'kundin_lie.blend')); print('SAVED lie'); sys.exit(0)
def tex_hair(img,fn,size):   # Luminanz -> Petrol-/Smaragdgrün (Struktur bleibt)
  im=img.copy(); im.scale(size,size); a=np.array(im.pixels[:],dtype=np.float32).reshape(size,size,4)
  L=a[...,:3]@np.array([0.3,0.55,0.15]); m=a[...,3]>0.5; Lm=float(np.median(L[m])) if m.any() else 0.3
  t=np.clip(L/Lm*0.5,0,1.5)[...,None]; a[...,:3]=np.clip(np.array([0.40,0.80,0.16])*(0.35+t*0.9)+np.array([0.10,0.12,0.04])*np.clip(t-0.7,0,1),0,1)   # u3: helles Limettengrün wie Ref
  im.pixels[:]=a.ravel(); im.filepath_raw=fn; im.file_format='PNG'; im.save(); return im
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
DEC=[bake(o,'deco_'+k.replace('-','')) for k in ('eyelash','high-poly')   # u3: Deko-Brauen weg (Brauen kommen weicher aus der Haut-Textur)
       for o in objs.values() if k in o.name]
HEADP=rig.matrix_world@rig.pose.bones['head'].head
# Pony aus den Augen: Strähnen vor dem Gesicht unterhalb der Brauen nach oben/außen schieben (Bob bis Kinn/Schulter bleibt)
EYEZ=HEADP.z+0.075
for v in Hh.data.vertices:
  c=v.co
  TOPZ=EYEZ+0.025
  if False:   # Seitenscheitel-Strähne über dem Auge -> über die Brauen hochfalten
    c.z=TOPZ+(c.z-TOPZ)*0.12; c.y-=0.006
# u3: Pony-Strähne vor den Augen entfernen (statt hart umfalten) – Fransen enden über den Brauen
import bmesh
bm=bmesh.new(); bm.from_mesh(Hh.data); TOPZ=EYEZ-0.028   # u3: Fransen bis knapp über die Brauen, Augen frei
kill=[f for f in bm.faces if all(v.co.y<HEADP.y-0.04 and v.co.z<TOPZ and abs(v.co.x-HEADP.x)<0.068 for v in f.verts) or
      (sum(v.co.y<HEADP.y-0.04 and v.co.z<TOPZ-0.01 and abs(v.co.x-HEADP.x)<0.06 for v in f.verts)>=2)]
bmesh.ops.delete(bm,geom=kill,context='FACES'); bm.to_mesh(Hh.data); bm.free(); print('FRINGECUT',len(kill))
# u3: grüne Iris wie Referenz
try:
  ei=first_img([o for o in objs.values() if 'high-poly' in o.name][0]); px=np.array(ei.pixels[:]).reshape(-1,4); mx=px[:,:3].max(1); mn=px[:,:3].min(1)
  m=(mx-mn)>0.10; L=px[m,:3].mean(1,keepdims=True); px[m,:3]=np.clip(L*np.array([0.55,1.35,0.6])*1.25,0,1); ei.pixels[:]=px.ravel(); ei.pack(); print('IRIS green',int(m.sum()))
except Exception as e: print('IRIS fail',e)
# Haar sicher außerhalb der Kopfhaut (Rest-Durchstoßen nach dem Refit): Vertex hinter/nahe der Haut -> 7 mm nach außen
bvB=BVHTree.FromObject(B,bpy.context.evaluated_depsgraph_get()); npush=0
HC=sum((v.co for v in Hh.data.vertices),Vector())/len(Hh.data.vertices); HC.z-=0.03
for v in Hh.data.vertices:
  loc,nrm,_,_=bvB.find_nearest(v.co)
  if loc is None: continue
  if nrm.dot(loc-HC)<0: nrm=-nrm          # Normale nach außen (vom Kopfmittelpunkt weg) orientieren
  if (v.co-loc).dot(nrm)<0.006: v.co=loc+nrm*0.007; npush+=1
print('HAIRPUSH',npush,len(Hh.data.vertices))
skin=bpy.data.images.load(SKIN); skin.scale(2048,2048); skin.filepath_raw=os.path.join(OUT,'skin_'+TAG+'.jpg'); skin.file_format='JPEG'; skin.save()
hairI=tex_hair(first_img(HO),os.path.join(OUT,'hair_'+TAG+'.png'),1024)
B.data.materials.clear(); sm_=simple_mat('skin_'+TAG,skin,rough=0.55); B.data.materials.append(sm_)
if NRM:
  ni=bpy.data.images.load(NRM); ni.colorspace_settings.name='Non-Color'; nt_=sm_.node_tree; tn=nt_.nodes.new('ShaderNodeTexImage'); tn.image=ni
  nm_=nt_.nodes.new('ShaderNodeNormalMap'); nt_.links.new(tn.outputs['Color'],nm_.inputs['Color']); nt_.links.new(nm_.outputs['Normal'],nt_.nodes['Principled BSDF'].inputs['Normal'])
Hh.data.materials.clear(); Hh.data.materials.append(simple_mat('hair_'+TAG,hairI,alpha=True,rough=0.5))
dg=bpy.context.evaluated_depsgraph_get(); bvh=[BVHTree.FromObject(o,dg) for o in (B,Hh)]
import random; random.seed(3); dirs=[]
while len(dirs)<16:
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
    out[i]=1-0.7*hit/max(tot,1)
  return out
def put_color(o,ao):
  me=o.data; ca=me.color_attributes.new('Col','FLOAT_COLOR','POINT'); C=np.stack([ao,ao,ao,1+0*ao],1).astype(np.float32); ca.data.foreach_set('color',C.ravel()); me.color_attributes.active_color=ca
put_color(B,ao_of(B)); ha=ao_of(Hh); put_color(Hh,0.82+0.18*ha)
json.dump({'head':list(HEADP),'height':max(v.co.z for v in B.data.vertices)},open(os.path.join(OUT,'figur_'+TAG+'_info.json'),'w'))
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects: o.select_set(True)
fn=os.path.join(OUT,'figur_stand_'+TAG+'.glb')
bpy.ops.export_scene.gltf(filepath=fn,export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_attributes=True,
  export_vertex_color='ACTIVE',export_skins=False,export_morph=False,export_animations=False,export_materials='EXPORT',export_image_format='AUTO')
print('EXPORTED',os.path.getsize(fn)//1024,'KB')
