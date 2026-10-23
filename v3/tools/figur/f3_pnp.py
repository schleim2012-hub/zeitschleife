import json, numpy as np, cv2, sys
J=json.load(open('job.json'))
P3=json.load(open('pts3d.json')); L=list(json.load(open('lm_ref.json')).values())[0]
# Gesichtsinneres stabil, Mund (offen im Foto) und Augenlider weglassen
MOUTH=set([0,11,12,13,14,15,16,17,37,38,39,40,41,42,61,62,72,73,74,76,77,78,80,81,82,84,85,86,87,88,89,90,91,95,146,178,179,180,181,183,184,185,191,267,268,269,270,271,272,291,292,302,303,304,306,307,308,310,311,312,314,315,316,317,318,319,320,321,324,325,375,402,403,404,405,407,408,409,415])
idx=[i for i,p in enumerate(P3) if p is not None and i<468 and i not in MOUTH]
X=np.array([P3[i] for i in idx],np.float64); x=np.array([L[i][:2] for i in idx],np.float64)
best=None
for f in [800,1200,1600,2000,2600,3400]:
  K=np.array([[f,0,400],[0,f,400],[0,0,1.]])
  ok,rv,tv=cv2.solvePnP(X,x,K,None,flags=cv2.SOLVEPNP_ITERATIVE)
  pr,_=cv2.projectPoints(X,rv,tv,K,None); e=np.sqrt(((pr[:,0]-x)**2).sum(1)).mean(); print(f,round(e,2))
  if best is None or e<best[0]: best=(e,f,rv,tv)
e,f,rv,tv=best; R,_=cv2.Rodrigues(rv)
json.dump({'f':f,'R':R.tolist(),'t':tv.ravel().tolist(),'err':e,'crop':J['crop'],'scale':J['scale'],'size':J['size']},open('refcam.json','w')); print('BEST',f,e)
