#!/usr/bin/env python3
# Figuren-Werkzeug (Prototyp: Sonnen-Oase-Kundin o9). Basismodell-Config + Referenzfoto + Posen -> GLBs.
# Aufruf: python3 figur.py <config.json> <arbeitsordner> [schritt...]   Schritte: base face skin glb  (Standard: alle)
# Braucht: Blender 4.2 + MPFB-Extension, venv mit mediapipe/opencv/scipy (FIG_PY), face_landmarker.task (FIG_LM_MODEL). Siehe README.md.
import json, os, subprocess, sys
HERE=os.path.dirname(os.path.abspath(__file__))
cfg=json.load(open(sys.argv[1])); W=os.path.abspath(sys.argv[2]); os.makedirs(W,exist_ok=True)
steps=sys.argv[3:] or ['base','face','skin','glb']
BL=os.environ.get('FIG_BLENDER',cfg.get('blender','blender')); PY=os.environ.get('FIG_PY',cfg.get('python','python3'))
GEN=os.path.join(HERE,'..',cfg.get('generator','oase/gen_kundin_hybrid.py'))
env=dict(os.environ,FIG_HAIR=cfg['hair'],FIG_TAG=cfg['tag'],FIG_PY=PY,FIG_LM_MODEL=os.environ.get('FIG_LM_MODEL',cfg.get('lm_model','face_landmarker.task')),
         FIG_BASE_SKIN=os.path.expanduser(cfg['base_skin']))
def run(*a,**k): print('>>',' '.join(map(str,a)),flush=True); subprocess.run(list(map(str,a)),check=True,cwd=W,env={**env,**k})
blend=os.path.join(W,'base','kundin_lie.blend')
if 'base' in steps:   # 1) Basisfigur in Liegepose (ohne Foto-Haut), liefert die .blend für die Projektion
  os.makedirs(os.path.join(W,'base'),exist_ok=True); run(BL,'-b','-P',GEN,'--',os.path.join(W,'base'),'lie')
if 'face' in steps:   # 2) Landmarken: Modell-Render + Referenz-Ausschnitt -> PnP-Kamera
  from PIL import Image
  r=cfg['ref']; im=Image.open(os.path.expanduser(r['image'])).convert('RGB'); x0,y0,x1,y1=r['crop']; sc=800/(x1-x0)
  im.crop((x0,y0,x1,y1)).resize((800,800)).save(os.path.join(W,'ref_crop.png'))
  json.dump({'crop':[x0,y0,x1,y1],'scale':sc,'size':list(im.size)},open(os.path.join(W,'job.json'),'w'))
  run(BL,'-b',blend,'-P',os.path.join(HERE,'f1_render.py'),'--',os.path.join(W,'m'))
  run(PY,os.path.join(HERE,'lm.py'),'m.png',FIG_LM_OUT='lm_model.json'); run(PY,os.path.join(HERE,'lm.py'),'ref_crop.png',FIG_LM_OUT='lm_ref.json')
  run(BL,'-b',blend,'-P',os.path.join(HERE,'f2_lm3d.py'),'--','m.json','lm_model.json','pts3d.json')
  run(PY,os.path.join(HERE,'f3_pnp.py'))
if 'skin' in steps:   # 3) Foto auf die Haut-UV backen (eigene + gespiegelte Hälfte), Hautton angleichen, Poren-Normalmap
  run(BL,'-b',blend,'-P',os.path.join(HERE,'f4_bake.py'),'--',os.path.expanduser(cfg['ref']['image']),os.path.join(W,'fb'),cfg.get('tex',2048))
  s=cfg.get('skin',{}); run(PY,os.path.join(HERE,'comp.py'),'fb','skin.png',s.get('chroma',0.55),s.get('pores',0.15))
  run(PY,'-c',"import cv2; cv2.imwrite('skin_n.jpg',cv2.imread('skin_n.png'),[cv2.IMWRITE_JPEG_QUALITY,85])")
if 'glb' in steps:    # 4) alle Posen/Varianten exportieren
  os.makedirs(os.path.join(W,'out'),exist_ok=True)
  for p in cfg['poses']:
    for v in cfg.get('variants',['adult']):
      run(BL,'-b','-P',GEN,'--',os.path.join(W,'out'),p,*(['kids'] if v=='kids' else []),FIG_SKIN=os.path.join(W,'skin.png'),FIG_NRM=os.path.join(W,'skin_n.jpg'))
print('FERTIG ->',os.path.join(W,'out'))
