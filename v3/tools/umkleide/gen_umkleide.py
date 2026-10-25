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
info['phenotype'].update({'gender':0.0,'age':0.52,'muscle':0.42,'weight':0.40,'proportions':0.85,'height':0.55,'cupsize':0.62,'firmness':0.6,
  'race':{'caucasian':0.95,'asian':0.03,'african':0.02}})
info['rig']='game_engine'
info['eyes']='high-poly/high-poly.mhclo'; info['eyebrows']='eyebrow010/eyebrow010.mhclo'; info['eyelashes']='eyelashes02/eyelashes02.mhclo'
info['hair']=HAIR+'/'+HAIR+'.mhclo'
info['skin_mhmat']=os.path.join(D,'skins','young_caucasian_female','young_caucasian_female.mhmat'); info['skin_material_type']='GAMEENGINE'; info['eyes_material_type']='GAMEENGINE'
st=HumanService.get_default_deserialization_settings(); st['subdiv_levels']=0
body=HumanService.deserialize_from_dict(info,st)
# Gesicht: erwachsener (Kiefer/Wangenknochen definierter, weniger Babyspeck), entspannt, Augen offen
SYS=os.path.expanduser('~/.config/blender/4.2/extensions/user_default/mpfb/data/targets')
for t,w in [('head/head-age-incr',0.45),('cheek/l-cheek-bones-incr',0.55),('cheek/r-cheek-bones-incr',0.55),('chin/chin-bones-incr',0.45),
            ('chin/chin-prominent-incr',0.25),('head/head-fat-decr',0.35),('head/head-oval',0.3),('chin/chin-width-incr',0.15)]:
  p=os.path.join(SYS,t+'.target.gz')
  if os.path.exists(p): TargetService.load_target(body,p,weight=w); print('TGT',t,w)
  else: print('MISSING',p)
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
  t=np.clip(L/Lm*0.5,0,1.5)[...,None]; a[...,:3]=np.clip(np.array([0.10,0.55,0.28])*t+np.array([0.05,0.12,0.06])*np.clip(t-0.7,0,1),0,1)
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
DEC=[bake(o,'deco_'+k.replace('-','')) for k in ('eyebrow','eyelash','high-poly') for o in objs.values() if k in o.name]
HEADP=rig.matrix_world@rig.pose.bones['head'].head
# Pony aus den Augen: Strähnen vor dem Gesicht unterhalb der Brauen nach oben/außen schieben (Bob bis Kinn/Schulter bleibt)
EYEZ=HEADP.z+0.075
for v in Hh.data.vertices:
  c=v.co
  if c.y<HEADP.y-0.06 and c.z<EYEZ+0.03 and abs(c.x-HEADP.x)<0.055:
    k=min(1,(EYEZ+0.03-c.z)/0.04); c.z+=0.035*k; c.y+=0.01*k
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
put_color(B,ao_of(B)); ha=ao_of(Hh); put_color(Hh,0.6+0.4*ha)
json.dump({'head':list(HEADP),'height':max(v.co.z for v in B.data.vertices)},open(os.path.join(OUT,'figur_'+TAG+'_info.json'),'w'))
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects: o.select_set(True)
fn=os.path.join(OUT,'figur_stand_'+TAG+'.glb')
bpy.ops.export_scene.gltf(filepath=fn,export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_attributes=True,
  export_vertex_color='ACTIVE',export_skins=False,export_morph=False,export_animations=False,export_materials='EXPORT',export_image_format='AUTO')
print('EXPORTED',os.path.getsize(fn)//1024,'KB')
