# Blender headless: aufklappbares Leder-Etui (Bifold) für die Parodie-FBI-Ausweise.
# blender -b --factory-startup -P build_ausweis.py -- TEXDIR OUTDIR [halli,molder]
# Nodes: <root> 'fbi_id_<name>' > 'base' (Unterteil + Rücken) und 'cover' (Klappe, Pivot = Scharnier).
# glTF-Achsen: Breite X 0,085 m, Tiefe Z 0,11 m, Dicke Y; liegt mit Unterseite auf y=0, Mitte (0,*,0) = Mitte des geschlossenen Etuis.
# Scharnier: Achse glTF +Z durch (x=-0,0425, y=T); Klappe öffnet mit cover.rotation.z = 0 → +π (180°, liegt dann flach links).
import bpy, bmesh, sys, os, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; TEX, OUT = argv[0], argv[1]; WHICH = (argv[2] if len(argv) > 2 else 'halli,molder').split(',')
os.makedirs(OUT, exist_ok=True)
W, D, T = 0.085, 0.11, 0.0042        # Breite, Tiefe (Höhe 11 cm), Dicke je Hälfte
HX = -W / 2                          # Scharnier-x
PX = 1024.0
REG = {'A': (0, 0, 576, 745), 'B': (576, 0, 1024, 580), 'C': (576, 580, 1024, 1024), 'D': (0, 745, 576, 1024)}
def uvr(k):
    x0, y0, x1, y1 = REG[k]; return x0/PX, 1 - y1/PX, x1/PX, 1 - y0/PX   # u0, v0(unten), u1, v1(oben)

def slab(name, x0, x1, flip_inner):
    # Blender: X Breite, Y Tiefe (Blender +Y = glTF -Z = "oben" auf der Karte), Z hoch. Lokal z in [0,T].
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector(((v.co.x + 0.5) * (x1 - x0) + x0, v.co.y * D, (v.co.z + 0.5) * T))
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.0011, segments=2, profile=0.6, affect='EDGES', clamp_overlap=True)
    uv = bm.loops.layers.uv.new('UVMap')
    zmid = T / 2
    for f in bm.faces:
        n = f.normal
        for l in f.loops:
            p = l.vert.co
            if abs(n.z) >= 0.55:
                top = (n.z > 0)
                inner = (not top) if flip_inner else top          # Innenseite: base oben, cover unten
                k = ('B' if flip_inner else 'A') if inner else 'C'
                u0, v0, u1, v1 = uvr(k)
                s = (p.x - x0) / (x1 - x0); t = (p.y + D/2) / D
                if k == 'B' or (k == 'C' and not top): s = 1 - s   # aufgeklappt bzw. von unten seitenrichtig
                s = min(max(s, 0), 1); t = min(max(t, 0), 1)
                l[uv].uv = (u0 + s * (u1 - u0), v0 + t * (v1 - v0))
            else:
                u0, v0, u1, v1 = uvr('D')
                a = (p.y + D/2) / D if abs(n.x) > abs(n.y) else (p.x - x0) / (x1 - x0)
                l[uv].uv = (u0 + 0.05 + a * 0.9 * (u1 - u0), v0 + 0.2 * (v1 - v0) + (p.z / T) * 0.25 * (v1 - v0))
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    return me

def spine(name):
    # Lederrücken (Faltkante) um die Scharnierachse
    me = bpy.data.meshes.new(name); bm = bmesh.new(); r = T * 0.98; seg = 10
    ring0, ring1 = [], []
    for i in range(seg + 1):
        a = math.pi / 2 + math.pi * i / seg      # Halbkreis nach links (-x)
        x, z = HX + 0.0012 + r * math.cos(a), T + r * math.sin(a)
        ring0.append(bm.verts.new((x, -D/2 + 0.0008, z))); ring1.append(bm.verts.new((x, D/2 - 0.0008, z)))
    for i in range(seg): bm.faces.new((ring0[i], ring0[i+1], ring1[i+1], ring1[i]))
    bm.faces.new(list(reversed(ring0))); bm.faces.new(ring1)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv = bm.loops.layers.uv.new('UVMap'); u0, v0, u1, v1 = uvr('D')
    for f in bm.faces:
        for l in f.loops:
            p = l.vert.co; l[uv].uv = (u0 + 0.05 + (p.y + D/2) / D * 0.9 * (u1 - u0), v0 + 0.55 * (v1 - v0) + (p.z / (2*T)) * 0.3 * (v1 - v0))
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    return me

def material(name, tex):
    m = bpy.data.materials.new(name); m.use_nodes = True; m.use_backface_culling = True; nt = m.node_tree; N = nt.nodes; L = nt.links; b = N['Principled BSDF']
    ic = N.new('ShaderNodeTexImage'); ic.image = bpy.data.images.load(os.path.join(tex, name + '_color.png')); L.new(ic.outputs[0], b.inputs['Base Color'])
    io = N.new('ShaderNodeTexImage'); io.image = bpy.data.images.load(os.path.join(tex, name + '_orm.png')); io.image.colorspace_settings.name = 'Non-Color'
    sp = N.new('ShaderNodeSeparateColor'); L.new(io.outputs[0], sp.inputs[0]); L.new(sp.outputs[1], b.inputs['Roughness']); L.new(sp.outputs[2], b.inputs['Metallic'])
    inn = N.new('ShaderNodeTexImage'); inn.image = bpy.data.images.load(os.path.join(tex, name + '_normal.png')); inn.image.colorspace_settings.name = 'Non-Color'
    nm = N.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 1.0; L.new(inn.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], b.inputs['Normal'])
    return m

def build(name):
    bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene; sc.render.fps = 30
    m = material(name, TEX)
    root = bpy.data.objects.new('fbi_id_' + name, None); sc.collection.objects.link(root)
    g = 0.0012   # Lederrücken-Versatz
    bme = slab('base_mesh', HX + g, W/2, False); bme.materials.append(m)
    sp = spine('spine'); sp.materials.append(m)
    # Rücken in base einmischen (1 Mesh je Node)
    bm = bmesh.new(); bm.from_mesh(bme); bm.from_mesh(sp); bm.to_mesh(bme); bm.free()
    base = bpy.data.objects.new('base', bme); sc.collection.objects.link(base); base.parent = root
    # Klappe: Geometrie relativ zum Scharnier (Pivot), liegt geschlossen auf der Basis (z in [T,2T])
    cme = slab('cover_mesh', g, W - 0.0006, True); cme.materials.append(m)
    cover = bpy.data.objects.new('cover', cme); sc.collection.objects.link(cover); cover.parent = root
    cover.location = (HX, 0, T)
    cover.rotation_mode = 'XYZ'
    # Animation 'open': Blender-Rotation um -Y (= glTF +Z) 0 → 180°
    cover.animation_data_create(); act = bpy.data.actions.new('open'); cover.animation_data.action = act
    for f, a in [(1, 0), (10, 70), (19, 150), (24, 180)]:
        cover.rotation_euler = (0, -math.radians(a), 0); cover.keyframe_insert('rotation_euler', frame=f)
    sc.frame_start, sc.frame_end = 1, 24
    tris = sum(len(p.vertices) - 2 for o in (base, cover) for p in o.data.polygons)
    print('TRIS', name, tris)
    bf = os.path.join(OUT, 'fbi_id_' + name + '.blend'); bpy.ops.wm.save_as_mainfile(filepath=bf)
    bpy.ops.file.make_paths_relative(); bpy.ops.wm.save_as_mainfile(filepath=bf)   # Texturen relativ (../tex/)
    def export(path, anim):
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_animations=anim, export_animation_mode='ACTIONS', export_yup=True,
                                  export_apply=False, export_texcoords=True, export_normals=True, export_tangents=False, use_selection=False, export_force_sampling=True)
    sc.frame_set(1); export(os.path.join(OUT, 'fbi_id_' + name + '_raw.glb'), True)
    cover.animation_data.action = None; cover.rotation_euler = (0, -math.pi, 0)
    export(os.path.join(OUT, 'fbi_id_' + name + '_open_raw.glb'), False)

for n in WHICH: build(n)
