# Blender: 2D-Landmarken des Modell-Renders -> 3D-Punkte auf dem Körper (Raycast)
import bpy, json, sys
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
a=sys.argv[sys.argv.index('--')+1:]; cj=json.load(open(a[0])); lm=list(json.load(open(a[1])).values())[0]
body=bpy.data.objects['Human']; dg=bpy.context.evaluated_depsgraph_get(); bvh=BVHTree.FromObject(body,dg)
mw=Matrix(cj['mw']); o=mw.translation; R=mw.to_3x3(); k=cj['sw']/cj['lens']; N=cj['res']
IW=body.matrix_world.inverted(); BW=body.matrix_world; o=IW@o; R=IW.to_3x3()@R
P=[]
for (px,py,pz) in lm:
  d=R@Vector(((px/N-0.5)*k,-(py/N-0.5)*k,-1)); h=bvh.ray_cast(o,d.normalized(),2)
  P.append(list(BW@h[0]) if h[0] else None)
json.dump(P,open(a[2],'w')); print('HITS',sum(p is not None for p in P))
