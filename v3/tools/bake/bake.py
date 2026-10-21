# Blender headless: Lightmap + AO für statische Raumgeometrie. Aufruf:
# blender -b -P bake.py -- scene.json outdir RES SAMPLES
import bpy, json, sys, os, struct, mathutils, time
argv=sys.argv[sys.argv.index('--')+1:]; SRC,OUT=argv[0],argv[1]; RES=int(argv[2]) if len(argv)>2 else 1024; SPP=int(argv[3]) if len(argv)>3 else 256
os.makedirs(OUT,exist_ok=True); D=json.load(open(SRC)); t0=time.time()
bpy.ops.wm.read_factory_settings(use_empty=True); sc=bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=SPP; sc.cycles.use_denoising=False
sc.cycles.max_bounces=4; sc.cycles.diffuse_bounces=3; sc.cycles.glossy_bounces=0; sc.cycles.transmission_bounces=0; sc.cycles.transparent_max_bounces=0
sc.render.threads_mode='FIXED'; sc.render.threads=8
w=bpy.data.worlds.new('W'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=tuple(D.get('world',[0.004,0.004,0.008]))+(1,); w.light_settings.distance=1.2
def mat_diffuse(name,col):
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear(); o=nt.nodes.new('ShaderNodeOutputMaterial'); d=nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs[0].default_value=(*col,1); nt.links.new(d.outputs[0],o.inputs[0]); return m
def mat_emit(name,col,s):
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear(); o=nt.nodes.new('ShaderNodeOutputMaterial'); e=nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value=(*col,1); e.inputs[1].default_value=s; nt.links.new(e.outputs[0],o.inputs[0]); return m
def mk(name,P,N=None,weld=True):
    n=len(P)//3; verts=[]; idx={}; faces=[]
    for t in range(n//3):
        f=[]
        for k in range(3):
            i=t*3+k; p=(P[i*3],P[i*3+1],P[i*3+2]); key=(round(p[0],3),round(p[1],3),round(p[2],3)) if weld else i
            if key not in idx: idx[key]=len(verts); verts.append(p)
            f.append(idx[key])
        if len(set(f))<3:  # entartetes Dreieck: eigene Vertices, damit die Reihenfolge 1:1 bleibt
            f=[]
            for k in range(3):
                i=t*3+k; f.append(len(verts)); verts.append((P[i*3],P[i*3+1],P[i*3+2]))
        faces.append(f)
    me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces)
    assert len(me.polygons)==n//3, (name,len(me.polygons),n//3)
    if N:
        me.shade_smooth(); me.normals_split_custom_set([mathutils.Vector((N[i*3],N[i*3+1],N[i*3+2])) for i in range(n)])
    ob=bpy.data.objects.new(name,me); sc.collection.objects.link(ob); return ob
recv=[]
for name,d in D['recv'].items():
    ob=mk(name,d['P'],d['N']); ob.data.materials.append(mat_diffuse('M_'+name,d['alb'])); recv.append(ob)
for name,d in D['occ'].items():
    ob=mk(name,d['P'],None,weld=False); ob.data.materials.append(mat_diffuse('M_'+name,(0.02,0.02,0.025)))
for e in D['emit']:
    ob=mk('E_'+e['name'],e['P'],None,weld=False); ob.data.materials.append(mat_emit('ME_'+e['name'],e['col'],e['str']))
# Oberlicht: schwacher Nachthimmel
if D.get('sky',True):
  sky=mk('E_sky',[-3.2,9.4,12, 3.2,9.4,12, 3.2,9.4,-32, -3.2,9.4,12, 3.2,9.4,-32, -3.2,9.4,-32]); sky.data.materials.append(mat_emit('ME_sky',(0.25,0.35,0.8),0.25))
for pnt in D['points']:
    kind='SPOT' if pnt.get('spot') else 'POINT'; L=bpy.data.lights.new(pnt['name'],kind); L.energy=pnt['w']; L.color=pnt['col'][:3]; L.shadow_soft_size=pnt.get('soft',0.12)
    o=bpy.data.objects.new(pnt['name'],L); o.location=pnt['pos']; sc.collection.objects.link(o)
    if kind=='SPOT':
        sp=pnt['spot']; L.spot_size=min(3.1,2*sp['angle']); L.spot_blend=max(0.0,min(1.0,sp.get('pen',0.3)))
        d=mathutils.Vector(sp['tgt'])-mathutils.Vector(pnt['pos']); o.rotation_euler=d.to_track_quat('-Z','Y').to_euler()
# Lightmap-UVs: ein gemeinsamer Atlas über alle Empfänger
for ob in recv:
    uv=ob.data.uv_layers.new(name='LM'); ob.data.uv_layers.active=uv
bpy.ops.object.select_all(action='DESELECT')
for ob in recv: ob.select_set(True)
bpy.context.view_layer.objects.active=recv[0]
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=0.006,area_weight=0.0,correct_aspect=True,scale_to_bounds=False)
bpy.ops.uv.pack_islands(rotate=True,margin=0.006)
bpy.ops.object.mode_set(mode='OBJECT'); print('uv done',time.time()-t0,flush=True)
def bake(kind,res,fn):
    img=bpy.data.images.new(kind,res,res,float_buffer=True); img.colorspace_settings.name='Linear Rec.709' if 'Linear Rec.709' in [c.name for c in bpy.types.ColorManagedInputColorspaceSettings.bl_rna.properties['name'].enum_items] else 'Non-Color'
    for ob in recv:
        nt=ob.active_material.node_tree; n=nt.nodes.get('BAKE') or nt.nodes.new('ShaderNodeTexImage'); n.name='BAKE'; n.image=img; nt.nodes.active=n
    if kind=='AO': sc.cycles.samples=min(SPP,64); bpy.ops.object.bake(type='AO',margin=6,use_clear=True)
    else: sc.cycles.samples=SPP; bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'},margin=6,use_clear=True)
    img.filepath_raw=os.path.join(OUT,fn); img.file_format='OPEN_EXR'; img.save(); import numpy as np; a=np.empty(res*res*4,dtype=np.float32); img.pixels.foreach_get(a); np.save(os.path.join(OUT,fn.replace('.exr','.npy')),a.reshape(res,res,4)); print(kind,'baked',time.time()-t0,flush=True)
bake('LM',RES,'lm.exr'); bake('AO',RES//2,'ao.exr')
# UV1 in exakt der Vertex-Reihenfolge von three.js zurückschreiben
man={'meshes':{},'res':RES}; buf=bytearray(); off=0
for ob in recv:
    me=ob.data; uv=me.uv_layers['LM'].data; arr=[]
    for poly in me.polygons:
        for li in poly.loop_indices: arr+= [uv[li].uv[0],uv[li].uv[1]]
    buf+=struct.pack('<%df'%len(arr),*arr); man['meshes'][ob.name]={'offset':off,'count':len(arr)//2}
    if 'c' in D['recv'].get(ob.name,{}): man['meshes'][ob.name]['c']=D['recv'][ob.name]['c']; off+=len(arr)*4
open(os.path.join(OUT,'uv1.bin'),'wb').write(buf); json.dump(man,open(os.path.join(OUT,'uv1.json'),'w'))
print('done',time.time()-t0)
