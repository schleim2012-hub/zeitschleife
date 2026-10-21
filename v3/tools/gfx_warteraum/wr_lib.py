# Helfer für build_room.py (Blender 4.2, headless)
import bpy, bmesh, math, random
from mathutils import Vector, Matrix
def srgb2lin(v): return v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4
def hexc(h,a=1.0): return (srgb2lin(((h>>16)&255)/255),srgb2lin(((h>>8)&255)/255),srgb2lin((h&255)/255),a)
OBJS=[]
def link(o):
    bpy.context.scene.collection.objects.link(o); return o
def mesh_obj(name,verts,faces,mat=None,vc=None,uv=None):
    me=bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts],[],faces); me.validate(); me.update()
    o=bpy.data.objects.new(name,me); link(o)
    if mat: o.data.materials.append(mat)
    if uv is not None:
        ul=me.uv_layers.new(name='UVMap')
        for li,l in enumerate(me.loops): ul.data[li].uv=uv(l.vertex_index, me.vertices[l.vertex_index].co)
    OBJS.append(o); return o
def from_bm(name,bm,mat=None):
    me=bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o=bpy.data.objects.new(name,me); link(o)
    if mat: o.data.materials.append(mat)
    OBJS.append(o); return o
def prim(kind,mat=None,name='p',**kw):
    bm=bmesh.new()
    if kind=='cube': bmesh.ops.create_cube(bm,size=1.0)
    elif kind=='cyl': bmesh.ops.create_cone(bm,cap_ends=kw.get('caps',True),segments=kw.get('seg',16),radius1=kw.get('r1',0.5),radius2=kw.get('r2',0.5),depth=kw.get('d',1.0))
    elif kind=='sphere': bmesh.ops.create_uvsphere(bm,u_segments=kw.get('u',16),v_segments=kw.get('v',10),radius=kw.get('r',0.5))
    elif kind=='ico': bmesh.ops.create_icosphere(bm,subdivisions=kw.get('sub',2),radius=kw.get('r',0.5))
    bmesh.ops.uv_from_box = None
    return from_bm(name,bm,mat)
def xf(o,loc=(0,0,0),rot=(0,0,0),scl=(1,1,1)):
    M=Matrix.Translation(loc)@ (Matrix.Rotation(rot[2],4,'Z')@Matrix.Rotation(rot[1],4,'Y')@Matrix.Rotation(rot[0],4,'X')) @ Matrix.Diagonal((*scl,1))
    o.data.transform(M); o.data.update(); return o
def box(name,c,s,mat,rot=(0,0,0),bev=0.0,seg=1):
    o=prim('cube',mat,name); xf(o,c,rot,s)
    if bev>0: bevel(o,bev,seg)
    return o
def bevel(o,w,seg=1):
    md=o.modifiers.new('bv','BEVEL'); md.width=w; md.segments=seg; md.limit_method='ANGLE'; md.angle_limit=math.radians(50)
    apply_mods(o)
def apply_mods(o):
    dg=bpy.context.evaluated_depsgraph_get(); ev=o.evaluated_get(dg); me=bpy.data.meshes.new_from_object(ev)
    o.modifiers.clear(); old=o.data; o.data=me; bpy.data.meshes.remove(old)
def cyl(name,c,r,d,mat,seg=16,rot=(0,0,0),r2=None,caps=True):
    o=prim('cyl',mat,name,r1=r,r2=(r if r2 is None else r2),d=d,seg=seg,caps=caps); xf(o,c,rot); return o
def sphere(name,c,r,mat,scl=(1,1,1),u=16,v=10,rot=(0,0,0)):
    o=prim('sphere',mat,name,r=1.0,u=u,v=v); xf(o,c,rot,(r*scl[0],r*scl[1],r*scl[2])); return o
def lathe(name,prof,mat,seg=24,c=(0,0,0),caps=(False,False)):
    # prof: [(r,z)] von unten nach oben
    verts=[]; faces=[]; n=len(prof)
    for i in range(seg):
        a=i/seg*2*math.pi
        for r,z in prof: verts.append((c[0]+r*math.cos(a),c[1]+r*math.sin(a),c[2]+z))
    for i in range(seg):
        j=(i+1)%seg
        for k in range(n-1): faces.append((i*n+k,j*n+k,j*n+k+1,i*n+k+1))
    if caps[0]: verts.append((c[0],c[1],c[2]+prof[0][1])); ci=len(verts)-1; [faces.append((j*n,i*n,ci)) for i in range(seg) for j in [(i+1)%seg]]
    if caps[1]: verts.append((c[0],c[1],c[2]+prof[-1][1])); ci=len(verts)-1; [faces.append((i*n+n-1,j*n+n-1,ci)) for i in range(seg) for j in [(i+1)%seg]]
    return mesh_obj(name,verts,faces,mat)
def extrude_poly(name,pts,z0,z1,mat):
    n=len(pts); verts=[(x,y,z0) for x,y in pts]+[(x,y,z1) for x,y in pts]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)]
    return mesh_obj(name,verts,faces,mat)
def set_vc(o,fn):
    me=o.data
    if 'Col' not in me.color_attributes: me.color_attributes.new('Col','BYTE_COLOR','CORNER')
    ca=me.color_attributes['Col']
    for li,l in enumerate(me.loops):
        v=me.vertices[l.vertex_index].co; c=fn(v)
        ca.data[li].color=(c[0],c[1],c[2],1.0)
    me.color_attributes.active_color=ca
def vc_const(o,h): c=hexc(h); set_vc(o,lambda v:c); return o
def box_uv(o,scale=1.0):
    me=o.data
    if not me.uv_layers: me.uv_layers.new(name='UVMap')
    ul=me.uv_layers['UVMap']
    for p in me.polygons:
        n=p.normal; ax=max(range(3),key=lambda i:abs(n[i]))
        for li in p.loop_indices:
            v=me.vertices[me.loops[li].vertex_index].co
            if ax==0: u,w=v.y,v.z
            elif ax==1: u,w=v.x,v.z
            else: u,w=v.x,v.y
            ul.data[li].uv=(u*scale,w*scale)
def cell_uv(o,cell,atlas=2048,axis='y',flip=False):
    # planare Projektion auf Atlas-Zelle (x,y,w,h in Pixeln), Bounding-Box der Projektion → Zelle
    me=o.data
    if not me.uv_layers: me.uv_layers.new(name='UVMap')
    ul=me.uv_layers['UVMap']; X,Y,W,H=cell
    vs=[v.co for v in me.vertices]
    if axis=='y': pj=lambda v:(v.x,v.z)
    elif axis=='-y': pj=lambda v:(-v.x,v.z)
    elif axis=='x': pj=lambda v:(-v.y,v.z)
    elif axis=='-x': pj=lambda v:(v.y,v.z)
    else: pj=lambda v:(v.x,v.y)
    P=[pj(v) for v in vs]; u0=min(p[0] for p in P); u1=max(p[0] for p in P); w0=min(p[1] for p in P); w1=max(p[1] for p in P)
    for li,l in enumerate(me.loops):
        u,w=P[l.vertex_index]; s=(u-u0)/max(1e-6,u1-u0); t=(w-w0)/max(1e-6,w1-w0)
        if flip: s=1-s
        ul.data[li].uv=((X+s*W)/atlas,1-(Y+(1-t)*H)/atlas)
def join(objs,name):
    objs=[o for o in objs if o]
    if len(objs)==1: objs[0].name=name; return objs[0]
    ctx={'selected_editable_objects':objs,'active_object':objs[0]}
    with bpy.context.temp_override(active_object=objs[0],selected_editable_objects=objs,selected_objects=objs):
        bpy.ops.object.join()
    o=objs[0]; o.name=name
    for x in objs[1:]:
        if x in OBJS: OBJS.remove(x)
    return o
def displace(o,fn):
    for v in o.data.vertices: v.co=fn(v.co)
    o.data.update()
def smooth(o,on=True):
    for p in o.data.polygons: p.use_smooth=on
