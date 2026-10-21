# Blender headless: Prüf-Renders der fertigen GLBs -> Sheet
# blender -b --factory-startup -P render_sheet.py -- GLBDIR WOODTEX_DIR OUTDIR
import bpy, sys, os, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; GLB, WT, OUT = argv; os.makedirs(OUT, exist_ok=True)
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.cycles.samples = 64; sc.cycles.use_denoising = True; sc.render.resolution_x, sc.render.resolution_y = 960, 720
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; return sc
def imp(name, loc, rz=0.0):
    bpy.ops.import_scene.gltf(filepath=os.path.join(GLB, name)); root = [o for o in bpy.context.selected_objects if o.parent is None][0]
    root.location = loc; root.rotation_euler = (0, 0, rz); return root
def wood(sc, dark=0.35):
    bpy.ops.mesh.primitive_plane_add(size=1.2); p = bpy.context.object; m = bpy.data.materials.new('wood'); m.use_nodes = True
    N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (3.0, 3.0, 1); L.new(tc.outputs['UV'], mp.inputs[0])
    d = N.new('ShaderNodeTexImage'); d.image = bpy.data.images.load(os.path.join(WT, 'wood_table_001_diff.jpg')); L.new(mp.outputs[0], d.inputs[0])
    mu = N.new('ShaderNodeMix'); mu.data_type = 'RGBA'; mu.blend_type = 'MULTIPLY'; mu.inputs['Factor'].default_value = 1; L.new(d.outputs[0], mu.inputs[6]); mu.inputs[7].default_value = (dark, dark*0.8, dark*0.65, 1)
    L.new(mu.outputs[2], b.inputs['Base Color'])
    r = N.new('ShaderNodeTexImage'); r.image = bpy.data.images.load(os.path.join(WT, 'wood_table_001_rough.jpg')); r.image.colorspace_settings.name = 'Non-Color'; L.new(mp.outputs[0], r.inputs[0]); rm = N.new('ShaderNodeMapRange'); rm.inputs[3].default_value = 0.45; rm.inputs[4].default_value = 0.85; L.new(r.outputs[0], rm.inputs[0]); L.new(rm.outputs[0], b.inputs['Roughness'])
    n = N.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(os.path.join(WT, 'wood_table_001_nor_gl.jpg')); n.image.colorspace_settings.name = 'Non-Color'; L.new(mp.outputs[0], n.inputs[0])
    nm = N.new('ShaderNodeNormalMap'); L.new(n.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], b.inputs['Normal'])
    p.data.materials.append(m); return p
def cam(sc, loc, look, lens=50):
    c = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(c); c.location = loc; c.data.lens = lens
    d = Vector(look) - Vector(loc); c.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); sc.camera = c
def light(kind, loc, look, energy, color=(1, 1, 1), size=0.3, spot=None):
    l = bpy.data.lights.new('l', kind); l.energy = energy; l.color = color
    if kind == 'AREA': l.size = size
    if kind == 'SPOT': l.spot_size = spot or 1.0; l.spot_blend = 0.6; l.shadow_soft_size = 0.03
    o = bpy.data.objects.new('l', l); bpy.context.scene.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
def render(sc, name):
    sc.render.filepath = os.path.join(OUT, name); bpy.ops.render.render(write_still=True)
# Blender-Koordinaten: X Breite, Y Tiefe (Kartenoberkante = +Y), Z hoch
# 1+2: offen, Nahaufnahme von oben (lesbar), neutrales Licht
for who in ('halli', 'molder'):
    sc = reset(); sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.02, 0.02, 0.02, 1); sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.6
    wood(sc, 0.3); imp('fbi_id_%s_open.glb' % who, (0.0425, 0, 0))
    light('AREA', (-0.25, -0.3, 0.55), (0, 0, 0), 11, (1, 0.95, 0.88), 0.5); light('AREA', (0.3, 0.2, 0.4), (0, 0, 0), 3, (0.85, 0.9, 1), 0.4)
    cam(sc, (0.0, -0.045, 0.30), (0.0, 0.0, 0.0), 50); render(sc, 'r_open_%s.png' % who)
    cam(sc, (0.0425, -0.012, 0.185), (0.0425, 0.0, 0.0), 50); render(sc, 'r_card_%s.png' % who)
# 3: geschlossen, beide, schräg
sc = reset(); sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.02, 0.02, 0.02, 1); sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.6
wood(sc, 0.3); imp('fbi_id_halli.glb', (-0.055, 0, 0), 0.12); imp('fbi_id_molder.glb', (0.055, 0.0, 0), -0.1)
light('AREA', (-0.25, -0.3, 0.45), (0, 0, 0), 14, (1, 0.95, 0.88), 0.5); light('AREA', (0.3, 0.3, 0.3), (0, 0, 0), 5, (0.85, 0.9, 1), 0.3)
cam(sc, (0.0, -0.24, 0.2), (0, 0.0, 0.0), 50); render(sc, 'r_closed.png')
# 4: Schreibtisch dunkles Holz, Lampenlicht (warm, Spot), offen + zu
sc = reset(); sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.01, 0.012, 0.015, 1); sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.25
wood(sc, 0.38); imp('fbi_id_halli_open.glb', (-0.02, 0.03, 0), 0.25); imp('fbi_id_molder.glb', (0.11, -0.06, 0.0), -0.5)
light('SPOT', (-0.25, 0.15, 0.42), (0.0, 0.0, 0), 9, (1.0, 0.72, 0.42), spot=1.1)
cam(sc, (0.06, -0.36, 0.30), (0.02, 0.0, 0.0), 42); render(sc, 'r_desk.png')
