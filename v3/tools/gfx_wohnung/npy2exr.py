# blender -b --factory-startup -P npy2exr.py -- in.npy out.exr   (Half-Float, ZIP – kompakt fürs Repo)
import bpy, sys, numpy as np
a=sys.argv[sys.argv.index('--')+1:]; d=np.load(a[0]).astype(np.float32); h,w=d.shape[:2]
if d.shape[2]==3: d=np.concatenate([d,np.ones((h,w,1),np.float32)],2)
im=bpy.data.images.new('x',w,h,alpha=True,float_buffer=True); im.pixels.foreach_set(d.ravel())
s=bpy.context.scene.render.image_settings; s.file_format='OPEN_EXR'; s.color_depth='16'; s.exr_codec='ZIP'; s.color_mode='RGB'
im.save_render(a[1]); print('saved',a[1])
