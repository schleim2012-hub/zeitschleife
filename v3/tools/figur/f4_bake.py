# Blender: Referenzgesicht auf die Haut-UV backen (Cycles EMIT)
import bpy, json, sys, os, subprocess, numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
a=sys.argv[sys.argv.index('--')+1:]; REF=a[0]; OUTIMG=a[1]; RES=int(a[2])
body=bpy.data.objects['Human']; dg=bpy.context.evaluated_depsgraph_get()
me=bpy.data.meshes.new_from_object(body.evaluated_get(dg),preserve_all_data_layers=True,depsgraph=dg); me.transform(body.matrix_world)
B=bpy.data.objects.new('BK',me); bpy.context.scene.collection.objects.link(B)
for o in bpy.data.objects:
  if o!=B and o.type=='MESH': o.hide_render=True
cfg=json.load(open('refcam.json')); R=np.array(cfg['R']); t=np.array(cfg['t']); C=Vector((-R.T@t).tolist())
bpy.context.view_layer.update(); bvh=BVHTree.FromObject(B,bpy.context.evaluated_depsgraph_get())
V=np.array([v.co for v in me.vertices]); N=np.array([v.normal for v in me.vertices]); vis=np.zeros(len(V))
for i,v in enumerate(me.vertices):
  d=C-v.co; fac=v.normal.dot(d.normalized())
  if fac<0.05 or np.linalg.norm(V[i]-V[:,:].mean(0))<0: continue
  if fac>0.05:
    h=bvh.ray_cast(v.co+v.normal*0.002,d.normalized(),d.length)
    if h[0] is None: vis[i]=min(1,(fac-0.05)/0.25)
np.savez('/tmp/fv.npz',V=V,vis=vis); subprocess.run([os.environ.get('FIG_PY','python3'),os.path.join(os.path.dirname(os.path.abspath(__file__)),'f5_uv.py'),'/tmp/fv.npz','/tmp/fuv.npz'],check=True)
r=np.load('/tmp/fuv.npz')
mat=bpy.data.materials.new('bk'); mat.use_nodes=True; nt=mat.node_tree; nt.nodes.clear()
uvn=nt.nodes.new('ShaderNodeUVMap'); ti=nt.nodes.new('ShaderNodeTexImage'); ti.image=bpy.data.images.load(REF); ti.extension='EXTEND'
nt.links.new(uvn.outputs[0],ti.inputs[0]); em=nt.nodes.new('ShaderNodeEmission')
at=nt.nodes.new('ShaderNodeVertexColor'); mx=nt.nodes.new('ShaderNodeMixRGB'); mx.inputs[1].default_value=(0,0,0,1)
nt.links.new(at.outputs[0],mx.inputs[0]); nt.links.new(ti.outputs[0],mx.inputs[2])
out=nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs[0],out.inputs[0])
tb=nt.nodes.new('ShaderNodeTexImage'); nt.nodes.active=tb
B.data.materials.clear(); B.data.materials.append(mat)
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=4; sc.cycles.device='CPU'; sc.render.bake.margin=8
bpy.ops.object.select_all(action='DESELECT'); B.select_set(True); bpy.context.view_layer.objects.active=B
base_uv=me.uv_layers[0].name
for K in 'AB':
  pu=me.uv_layers.new(name='proj'+K)
  for poly in me.polygons:
    for li in poly.loop_indices: pu.data[li].uv=tuple(r['uv'+K][me.loops[li].vertex_index])
  ca=me.color_attributes.new('mask'+K,'FLOAT_COLOR','POINT'); ca.data.foreach_set('color',np.repeat(r['m'+K][:,None],4,1).astype(np.float32).ravel())
  me.uv_layers.active=me.uv_layers[base_uv]; uvn.uv_map='proj'+K; at.layer_name='mask'+K
  for what in ('col','mask'):
    nt.links.new((mx if what=='col' else at).outputs[0],em.inputs[0])
    img=bpy.data.images.new(K+what,RES,RES); tb.image=img; bpy.ops.object.bake(type='EMIT')
    img.filepath_raw=OUTIMG+'_'+K+what+'.png'; img.file_format='PNG'; img.save()
print('BAKED')
