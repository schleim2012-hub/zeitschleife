# Blender: Gesicht der o8-Figur frontal rendern (für Landmarken), Kameradaten speichern
import bpy, json, sys, os
from mathutils import Vector, Matrix
sc=bpy.context.scene; rig=[o for o in bpy.data.objects if o.type=='ARMATURE'][0]
H=rig.matrix_world@rig.pose.bones['head'].head; T=rig.matrix_world@rig.pose.bones['head'].tail
for o in bpy.data.objects:
  if o.type=='MESH' and (os.environ.get('FIG_HAIR','long01') in o.name or 'eyelash' in o.name): o.hide_render=True   # Haare + Wimpern verdecken sonst die Landmarken
c=(H+T)/2+Vector((0.01,0,0.0)); cam=bpy.data.objects.new('C',bpy.data.cameras.new('C')); sc.collection.objects.link(cam)
cam.data.lens=85; cam.data.sensor_width=36
cam.location=c+Vector((0,0,0.80)); cam.rotation_euler=Matrix(((0,-1,0),(-1,0,0),(0,0,-1))).transposed().to_euler()   # Blick -Z, Bildoben = -X (Scheitel)
# Kamera-Matrix direkt setzen: Achsen x_cam=+Y? -> Bild rechts = Figur-links (+Y) vom Betrachter aus gespiegelt prüfen wir per Render
R=Matrix(((0,-1,0),(-1,0,0),(0,0,-1)))  # Spalten: cam-x, cam-y, cam-z in Welt
M=Matrix(((0,-1,0,0),(1,0,0,0),(0,0,1,0),(0,0,0,1)))
cam.matrix_world=Matrix.Translation(cam.location)@Matrix(((0,-1,0,0),(1,0,0,0),(0,0,1,0),(0,0,0,1)))
sc.camera=cam; sc.render.engine='BLENDER_EEVEE_NEXT'; sc.render.resolution_x=sc.render.resolution_y=800; sc.render.film_transparent=False
w=bpy.data.worlds.new('W'); w.use_nodes=True; w.node_tree.nodes['Background'].inputs[1].default_value=1.0; w.node_tree.nodes['Background'].inputs[0].default_value=(0.8,0.8,0.8,1); sc.world=w
L=bpy.data.objects.new('L',bpy.data.lights.new('L','SUN')); L.data.energy=2.5; sc.collection.objects.link(L); L.matrix_world=cam.matrix_world
sc.render.filepath=sys.argv[-1]+'.png'; bpy.ops.render.render(write_still=True)
mw=cam.matrix_world; json.dump({'mw':[list(r) for r in mw],'lens':cam.data.lens,'sw':cam.data.sensor_width,'res':800,'H':list(H)},open(sys.argv[-1]+'.json','w'))
