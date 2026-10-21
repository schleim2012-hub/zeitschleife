# Lightmap-Nachbearbeitung (Blender headless): lm.exr (entrauscht, linear) → lm.png (8 bit sRGB, /scale) + Skala in scene.json
# blender -b -P lm_post.py
import bpy, numpy as np, os, json
HERE=os.path.dirname(os.path.abspath(__file__)); AS=os.path.abspath(os.path.join(HERE,'../../assets/warteraum')); SRC=AS+'/src'
im=bpy.data.images.load(SRC+'/lm.exr'); w,h=im.size; a=np.array(im.pixels[:],dtype=np.float32).reshape(h,w,4)[...,:3]
a=np.nan_to_num(np.maximum(a,0))
lum=a.mean(axis=2); nz=lum[lum>1e-5]; scale=float(np.percentile(nz,99.7)) if nz.size else 1.0
s=np.clip(a/scale,0,1); s=np.where(s<=0.0031308,s*12.92,1.055*np.power(s,1/2.4)-0.055)
out=bpy.data.images.new('lm8',w,h,alpha=False); px=np.concatenate([s,np.ones((h,w,1),np.float32)],axis=2).ravel()
out.pixels.foreach_set(px); out.filepath_raw=SRC+'/lm.png'; out.file_format='PNG'; out.save()
j=json.load(open(AS+'/scene.json')); j['lmScale']=scale; json.dump(j,open(AS+'/scene.json','w'),indent=1)
print('lmScale',scale,'mean',float(lum.mean()))
