# Gemeinsame Blender-Helfer für die Wohnungs-Props (Büro, Wohnzimmer …). Import: sys.path.insert(0, Skriptordner); from props_lib import *
# finish() backt Farbe (DIFFUSE/COLOR) + AO in eine Atlas-Textur und speichert für die Portierung (Unity):
#   OUT/src/<name>_col.png, _ao.png, _tex.png (Originalauflösung, verlustfrei) und OUT/blend/<name>.blend (Texturen eingepackt).
import bpy, bmesh, sys, os, math, random
import numpy as np
OUT='.'
def set_out(p):
    global OUT; OUT=p; os.environ['PROPS_OUT']=p; os.makedirs(os.path.join(OUT,'src'),exist_ok=True); os.makedirs(os.path.join(OUT,'blend'),exist_ok=True)
def srgb2lin(c): return tuple((v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4) for v in c)
def hexc(h): return srgb2lin(((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255) if False else srgb2lin((((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255))
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=24; sc.render.bake.margin=6
    w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[1].default_value=1.0
MATS={}
def mat(name,col,var=0.10,scale=60.0,dirt=None,rough=0.6,wood=False,metal=0.0):
    if name in MATS: return MATS[name]
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; N=nt.nodes; L=nt.links; bsdf=N['Principled BSDF']
    bsdf.inputs['Roughness'].default_value=rough; bsdf.inputs['Metallic'].default_value=0.0
    c1=hexc(col)+(1,); c2=tuple(max(0,v*(1-var*2.2)) for v in hexc(col))+(1,)
    tc=N.new('ShaderNodeTexCoord'); 
    if wood:
        mp=N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(1.6,0.6,0.15); L.new(tc.outputs['Object'],mp.inputs[0])  # Maserung längs (Z), feine Jahresringe
        wv=N.new('ShaderNodeTexWave'); wv.wave_type='BANDS'; wv.bands_direction='X'; wv.inputs['Scale'].default_value=1.0; wv.inputs['Distortion'].default_value=3.0; wv.inputs['Detail'].default_value=6; wv.inputs['Detail Scale'].default_value=2.5; L.new(mp.outputs[0],wv.inputs[0])
        src=wv.outputs['Fac']
    else:
        nz=N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=scale; nz.inputs['Detail'].default_value=6; L.new(tc.outputs['Object'],nz.inputs['Vector']); src=nz.outputs['Fac']
    cr=N.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position=0.3; cr.color_ramp.elements[1].position=0.75; cr.color_ramp.elements[0].color=c2; cr.color_ramp.elements[1].color=c1; L.new(src,cr.inputs[0])
    out=cr.outputs[0]
    if dirt:  # grobe Flecken (Vergilbung/Schmutz)
        n2=N.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value=6; n2.inputs['Detail'].default_value=3; L.new(tc.outputs['Object'],n2.inputs['Vector'])
        r2=N.new('ShaderNodeValToRGB'); r2.color_ramp.elements[0].position=0.5; r2.color_ramp.elements[1].position=0.72; L.new(n2.outputs['Fac'],r2.inputs[0])
        mx=N.new('ShaderNodeMix'); mx.data_type='RGBA'; L.new(r2.outputs[0],mx.inputs['Factor']); mx.inputs['Factor'].default_value=0; L.new(out,mx.inputs[6]); mx.inputs[7].default_value=hexc(dirt)+(1,)
        # Faktor skaliert
        mth=N.new('ShaderNodeMath'); mth.operation='MULTIPLY'; mth.inputs[1].default_value=0.55; L.new(r2.outputs[0],mth.inputs[0]); L.new(mth.outputs[0],mx.inputs['Factor'])
        out=mx.outputs[2]
    L.new(out,bsdf.inputs['Base Color']); m['metal']=metal; m['rough']=rough; MATS[name]=m; return m
OBJS=[]
def add(o,m): 
    o.data.materials.clear(); o.data.materials.append(m); OBJS.append(o); return o
def box(cx,cy,cz,sx,sy,sz,m,bev=0.0,seg=2,rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(cx,cy,cz)); o=bpy.context.object; o.scale=(sx,sy,sz)
    if rot: o.rotation_euler=rot
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    if bev>0:
        md=o.modifiers.new('b','BEVEL'); md.width=min(bev,min(sx,sy,sz)*0.45); md.segments=seg; md.limit_method='ANGLE'
        bpy.ops.object.modifier_apply(modifier='b')
    return add(o,m)
def cyl(cx,cy,cz,r,d,m,axis='Z',v=16,bev=0.0):
    rot={'Z':(0,0,0),'X':(0,math.pi/2,0),'Y':(math.pi/2,0,0)}[axis]
    bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=d,location=(cx,cy,cz),rotation=rot); o=bpy.context.object
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    if bev>0:
        md=o.modifiers.new('b','BEVEL'); md.width=bev; md.segments=2; md.limit_method='ANGLE'; bpy.ops.object.modifier_apply(modifier='b')
    return add(o,m)
def taper(cx,cy,cz,sx,sz,depth,kx,kz,m,bev=0.01,dz=0.0):
    # Quader, Front bei y=cy (−Y), Rückseite bei y=cy+depth um kx/kz verkleinert und um dz verschoben
    bpy.ops.mesh.primitive_cube_add(size=1); o=bpy.context.object; bm=bmesh.new(); bm.from_mesh(o.data)
    for v in bm.verts:
        back=v.co.y>0; x=v.co.x*sx*(kx if back else 1); z=v.co.z*sz*(kz if back else 1)+(dz if back else 0); y=(depth if back else 0)
        v.co=(cx+x,cy+y,cz+z)
    bm.to_mesh(o.data); bm.free()
    if bev>0:
        md=o.modifiers.new('b','BEVEL'); md.width=bev; md.segments=2; md.limit_method='ANGLE'; bpy.ops.object.modifier_apply(modifier='b')
    return add(o,m)
def curve_cable(pts,r,m):
    cu=bpy.data.curves.new('c','CURVE'); cu.dimensions='3D'; sp=cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts)-1)
    for p,q in zip(sp.bezier_points,pts): p.co=q; p.handle_left_type=p.handle_right_type='AUTO'
    cu.bevel_depth=r; cu.bevel_resolution=1; cu.resolution_u=6; o=bpy.data.objects.new('cable',cu); bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active=o; o.select_set(True); bpy.ops.object.convert(target='MESH'); o=bpy.context.object; return add(o,m)
def _out(): return os.environ.get('PROPS_OUT',OUT)
def finish(name,tex,metal=0.0,rough=0.6,ao_k=0.7,ao_dist=0.08,keep_sep=None):
    bpy.ops.object.select_all(action='DESELECT')
    for o in OBJS: o.select_set(True)
    bpy.context.view_layer.objects.active=OBJS[0]; bpy.ops.object.join(); ob=bpy.context.object; ob.name=name
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.remove_doubles(threshold=0.0002)
    bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=0.004,area_weight=0.0,scale_to_bounds=True); bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.shade_auto_smooth(angle=math.radians(35)) if hasattr(bpy.ops.object,'shade_auto_smooth') else None
    imgs={}
    for k in ('col','ao'):
        im=bpy.data.images.new(name+'_'+k,tex,tex,alpha=False); im.colorspace_settings.name='sRGB' if k=='col' else 'Non-Color'; imgs[k]=im
    def set_target(im):
        for ms in ob.material_slots:
            nt=ms.material.node_tree; n=nt.nodes.get('BAKE') or nt.nodes.new('ShaderNodeTexImage'); n.name='BAKE'; n.image=im; nt.nodes.active=n
    sc=bpy.context.scene; bpy.context.view_layer.objects.active=ob; ob.select_set(True)
    set_target(imgs['col']); sc.cycles.samples=4; bpy.ops.object.bake(type='DIFFUSE',pass_filter={'COLOR'},use_clear=True,margin=6)
    sc.world.light_settings.distance=ao_dist; sc.cycles.samples=48; set_target(imgs['ao']); bpy.ops.object.bake(type='AO',use_clear=True,margin=6)
    c=np.array(imgs['col'].pixels[:]).reshape(tex,tex,4); a=np.array(imgs['ao'].pixels[:]).reshape(tex,tex,4)[...,0:1]
    # col liegt als lineare Float-Daten vor (Blender-intern), AO 0..1 → Multiplikation, dann zurück
    k=(1-ao_k)+ao_k*a; c[...,0:3]=np.clip(c[...,0:3]*k,0,1)
    fin=bpy.data.images.new(name+'_tex',tex,tex,alpha=False); fin.colorspace_settings.name='sRGB'; fin.pixels=c.ravel().tolist()
    S=os.path.join(_out(),'src')
    for k,im in imgs.items(): im.filepath_raw=os.path.join(S,name+'_'+k+'.png'); im.file_format='PNG'; im.save()
    fin.filepath_raw=os.path.join(S,name+'_tex.png'); fin.file_format='PNG'; fin.save()
    fin2=bpy.data.images.load(os.path.join(S,name+'_tex.png')); fin2.name=name+'_tex'
    m=bpy.data.materials.new(name+'_m'); m.use_nodes=True; nt=m.node_tree; b=nt.nodes['Principled BSDF']; t=nt.nodes.new('ShaderNodeTexImage'); t.image=fin2; nt.links.new(t.outputs[0],b.inputs['Base Color'])
    b.inputs['Roughness'].default_value=rough; b.inputs['Metallic'].default_value=metal
    ob.data.materials.clear(); ob.data.materials.append(m)
    tris=sum(len(p.vertices)-2 for p in ob.data.polygons); print('ASSET',name,'tris',tris,'verts',len(ob.data.vertices))
    return ob
def export(name,objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(_out(),name+'.glb'),export_format='GLB',use_selection=True,export_image_format='JPEG',export_jpeg_quality=86,export_apply=True,export_yup=True,export_materials='EXPORT')
    bpy.ops.file.pack_all(); bpy.ops.wm.save_as_mainfile(filepath=os.path.join(_out(),'blend',name+'.blend'),compress=True,copy=True)
    print('EXPORT',name)

def subbox(cx,cy,cz,sx,sy,sz,m,lvl=2,rot=None,crease=0.0):
    # weiches Polster: Box mit Subdivision (Catmull-Clark), Kanten bleiben über leichte Bevel-Vorstufe formstabil
    bpy.ops.mesh.primitive_cube_add(size=1,location=(cx,cy,cz)); o=bpy.context.object; o.scale=(sx,sy,sz)
    if rot: o.rotation_euler=rot
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    md=o.modifiers.new('b','BEVEL'); md.width=min(sx,sy,sz)*0.18; md.segments=1; bpy.ops.object.modifier_apply(modifier='b')
    md=o.modifiers.new('s','SUBSURF'); md.levels=lvl; md.render_levels=lvl; bpy.ops.object.modifier_apply(modifier='s')
    return add(o,m)
def lathe(cx,cy,cz,prof,m,seg=16):
    # Drehkörper aus Profil [(r,z),...] (Vasen, Gläser, Figuren, Lampenfuß)
    bm=bmesh.new(); rings=[]
    for (r,z) in prof:
        ring=[bm.verts.new((cx+r*math.cos(a*2*math.pi/seg),cy+r*math.sin(a*2*math.pi/seg),cz+z)) for a in range(seg)]; rings.append(ring)
    for a in range(len(rings)-1):
        for i in range(seg): bm.faces.new((rings[a][i],rings[a][(i+1)%seg],rings[a+1][(i+1)%seg],rings[a+1][i]))
    me=bpy.data.meshes.new('lathe'); bm.to_mesh(me); bm.free(); o=bpy.data.objects.new('lathe',me); bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active=o; o.select_set(True); return add(o,m)
def imgmat(name,path,tint=0xffffff,scale=1.0,rough=0.6,var=0.0,dirt=None,rot90=False):
    # Material mit kachelbarer Bildtextur (Box-Projektion über Objektkoordinaten), getönt; wird in den Atlas gebacken
    if name in MATS: return MATS[name]
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; N=nt.nodes; L=nt.links; b=N['Principled BSDF']; b.inputs['Roughness'].default_value=rough
    tc=N.new('ShaderNodeTexCoord'); mp=N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(scale,scale,scale)
    if rot90: mp.inputs['Rotation'].default_value=(0,math.pi/2,0)
    L.new(tc.outputs['Object'],mp.inputs[0]); t=N.new('ShaderNodeTexImage'); t.image=bpy.data.images.load(path,check_existing=True); t.projection='BOX'; t.projection_blend=0.25; L.new(mp.outputs[0],t.inputs[0])
    mx=N.new('ShaderNodeMix'); mx.data_type='RGBA'; mx.blend_type='MULTIPLY'; mx.inputs['Factor'].default_value=1.0; L.new(t.outputs[0],mx.inputs[6]); mx.inputs[7].default_value=hexc(tint)+(1,)
    out=mx.outputs[2]
    if dirt:
        n2=N.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value=5; L.new(tc.outputs['Object'],n2.inputs['Vector']); r2=N.new('ShaderNodeValToRGB'); r2.color_ramp.elements[0].position=0.5; r2.color_ramp.elements[1].position=0.75; L.new(n2.outputs['Fac'],r2.inputs[0])
        mth=N.new('ShaderNodeMath'); mth.operation='MULTIPLY'; mth.inputs[1].default_value=0.5; L.new(r2.outputs[0],mth.inputs[0])
        m2=N.new('ShaderNodeMix'); m2.data_type='RGBA'; L.new(mth.outputs[0],m2.inputs['Factor']); L.new(out,m2.inputs[6]); m2.inputs[7].default_value=hexc(dirt)+(1,); out=m2.outputs[2]
    L.new(out,b.inputs['Base Color']); MATS[name]=m; return m
