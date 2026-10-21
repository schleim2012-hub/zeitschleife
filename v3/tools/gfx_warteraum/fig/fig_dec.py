# Blender: Hunyuan-GLB importieren, auf ~N Tris dezimieren, als OBJ-artige npy (Tri-Positionen) + .blend speichern
# blender -b -P fig_dec.py -- in.glb out_prefix [ntris]
import bpy, sys, numpy as np
a=sys.argv[sys.argv.index('--')+1:]
src,outp=a[0],a[1]; N=int(a[2]) if len(a)>2 else 9000
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
o=[x for x in bpy.data.objects if x.type=='MESH'][0]
bpy.context.view_layer.objects.active=o; o.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
# lose Teile/Doppelpunkte bereinigen
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=1e-5); bpy.ops.mesh.quads_convert_to_tris()
bpy.ops.object.mode_set(mode='OBJECT')
f=len(o.data.polygons)
m=o.modifiers.new('d','DECIMATE'); m.ratio=min(1.0,N/f); m.use_collapse_triangulate=True
bpy.ops.object.modifier_apply(modifier='d')
me=o.data
for mat in list(me.materials): pass
me.materials.clear()
v=np.array([x.co[:] for x in me.vertices],dtype=np.float32)
t=np.array([p.vertices[:] for p in me.polygons if len(p.vertices)==3],dtype=np.int32)
np.save(outp+'_v.npy',v); np.save(outp+'_t.npy',t)
o.name='fig'
bpy.ops.wm.save_as_mainfile(filepath=outp+'.blend')
print('DEC',src,f,'->',len(me.polygons),v.min(0),v.max(0))
