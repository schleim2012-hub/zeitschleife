# Portierung: Lightmap/AO zusätzlich verlustfrei ablegen (für Unity o. ä.)
#  python3 lm_export.py <bake-out> <assets/bake/raum>  →  <dst>/src/lm.exr, ao.exr (linear, HDR, direkt aus Blender) + lm.png/ao.png (8 bit, wie lm.jpg kodiert)
import numpy as np, sys, os, shutil, json
from PIL import Image, ImageFilter
SRC,DST=sys.argv[1],sys.argv[2]; S=os.path.join(DST,'src'); os.makedirs(S,exist_ok=True)
import subprocess
BL='/workspace/blender/blender-4.2.3-linux-x64/blender'; HERE=os.path.dirname(os.path.abspath(__file__))
for k in ('lm','ao'):  # Half-Float-EXR (ZIP) aus den Roh-Bakes
    subprocess.run([BL,'-b','--factory-startup','-P',os.path.join(HERE,'npy2exr.py'),'--',os.path.join(SRC,k+'.npy'),os.path.join(S,k+'.exr')],check=True,capture_output=True)
man=json.load(open(os.path.join(DST,'uv1.json'))); sc=man['lmScale']
lm=np.flipud(np.load(SRC+'/lm.npy'))[...,:3]; ao=np.flipud(np.load(SRC+'/ao.npy'))[...,0]
x=np.clip(lm/sc,0,1); enc=np.where(x<=0.0031308,x*12.92,1.055*np.power(x,1/2.4)-0.055)
Image.fromarray((enc*255+0.5).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)).save(os.path.join(S,'lm.png'))
Image.fromarray(((0.3+0.7*np.clip(ao,0,1))*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)).save(os.path.join(S,'ao.png'))
open(os.path.join(S,'README.txt'),'w').write('Lightmap (uv1, zweiter UV-Kanal). lm.exr/ao.exr: linear HDR aus Blender-Cycles (gleiche Ausrichtung wie lm.jpg). lm.png/ao.png = lm.jpg/ao.jpg verlustfrei.\nlm.png ist sRGB-kodiert und auf lmScale=%s normiert; Laufzeit: lightMapIntensity = lmIntensity(%s) × lmGain. AO = 0,3 + 0,7·AO.\nUV1 je Mesh in uv1.bin (Float32, Offsets/Vertexzahlen in uv1.json).\n'%(sc,man['lmIntensity']))
print('ok',os.listdir(S))
