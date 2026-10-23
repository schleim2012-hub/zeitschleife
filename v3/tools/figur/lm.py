import os, sys, json, numpy as np, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
det=vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=os.environ.get('FIG_LM_MODEL','face_landmarker.task')),num_faces=1))
out={}
for f in sys.argv[1:]:
  im=mp.Image.create_from_file(f); r=det.detect(im)
  if not r.face_landmarks: print(f,'NO FACE'); continue
  L=[(p.x*im.width,p.y*im.height,p.z*im.width) for p in r.face_landmarks[0]]; out[f]=L; print(f,len(L),'eyeL',L[33][:2],'eyeR',L[263][:2],'nose',L[1][:2],'chin',L[152][:2])
json.dump(out,open(os.environ.get('FIG_LM_OUT','lm.json'),'w'))
