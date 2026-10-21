# Tiefenkarte für depthbg.js: python depth_bake.py bild.jpg ausgabe_name zielordner
# (braucht transformers+torch, z.B. /workspace/.venv-depth/bin/python). Erzeugt <name>.jpg (2048 breit) + <name>_depth.png (512 breit, 1=nah)
import numpy as np, sys
from PIL import Image
from transformers import pipeline
src,name,D=sys.argv[1],sys.argv[2],sys.argv[3]
pipe=pipeline('depth-estimation',model='depth-anything/Depth-Anything-V2-Small-hf',device='cpu')
im=Image.open(src).convert('RGB'); W,H=im.size
d=pipe(im)['predicted_depth'].squeeze().numpy().astype(np.float32)
d=np.array(Image.fromarray(d).resize((512,round(512*H/W)),Image.BILINEAR))
lo,hi=np.percentile(d,1),np.percentile(d,99.5); n=np.clip((d-lo)/(hi-lo),0,1)
Image.fromarray((n*255).astype(np.uint8)).save(f'{D}/{name}_depth.png')
im.resize((2048,round(2048*H/W)),Image.LANCZOS).save(f'{D}/{name}.jpg',quality=86,optimize=True,progressive=True); print('ok',name)
