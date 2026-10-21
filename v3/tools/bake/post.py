# Blender-Bake (npy, linear, Zeilen unten->oben) -> lm.jpg (sRGB-kodiert, normiert) + ao.jpg + uv1.json mit lmIntensity
import numpy as np, json, sys, shutil, os
from PIL import Image, ImageFilter
SRC,DST=sys.argv[1],sys.argv[2]; os.makedirs(DST,exist_ok=True)
lm=np.flipud(np.load(SRC+'/lm.npy'))[...,:3]; ao=np.flipud(np.load(SRC+'/ao.npy'))[...,0]
# leichtes Entrauschen: Median 3x3 (Inseln haben 6px Rand)
lm8=lambda a: a
sc=float(np.percentile(lm,99.7)); x=np.clip(lm/sc,0,1)
enc=np.where(x<=0.0031308,x*12.92,1.055*np.power(x,1/2.4)-0.055)
im=Image.fromarray((enc*255+0.5).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)); im.save(DST+'/lm.jpg',quality=92)
ao=0.3+0.7*np.clip(ao,0,1)   # AO nie ganz schwarz
Image.fromarray((ao*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)).save(DST+'/ao.jpg',quality=90)
man=json.load(open(SRC+'/uv1.json')); man['lmScale']=sc; man['lmIntensity']=round(sc*np.pi,4); json.dump(man,open(DST+'/uv1.json','w'))
shutil.copy(SRC+'/uv1.bin',DST+'/uv1.bin'); print('scale',sc,'intensity',man['lmIntensity'])
