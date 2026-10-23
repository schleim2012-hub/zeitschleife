# venv: Vertex -> Referenzbild-Koordinaten (PnP + TPS-Restkorrektur an den Landmarken) + Maske
import json, numpy as np, cv2, sys
from scipy.interpolate import RBFInterpolator
d=np.load(sys.argv[1]); V=d['V']; vis=d['vis']; cfg=json.load(open('refcam.json'))
P3=json.load(open('pts3d.json')); L=np.array(list(json.load(open('lm_ref.json')).values())[0])[:,:2]
f=cfg['f']; K=np.array([[f,0,400],[0,f,400],[0,0,1.]]); rv,_=cv2.Rodrigues(np.array(cfg['R'])); tv=np.array(cfg['t'])
def proj(X): return cv2.projectPoints(np.asarray(X,np.float64),rv,tv,K,None)[0][:,0]
idx=[i for i,p in enumerate(P3) if p is not None and i<468]; X=np.array([P3[i] for i in idx])
res=L[idx]-proj(X); tps=RBFInterpolator(proj(X),res,kernel='thin_plate_spline',smoothing=2.0)
p=proj(V); p=p+tps(p)*np.clip(1-0,0,1)
cx,cy,sc=cfg['crop'][0],cfg['crop'][1],cfg['scale']; full=np.stack([cx+p[:,0]/sc,cy+p[:,1]/sc],1)
W,H=cfg['size']; uv=np.stack([full[:,0]/W,1-full[:,1]/H],1)
# Maske: im Gesichtsoval (Landmarken), weich zum Rand; Mundinneres (Zähne im Foto) raus
OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
INNER=[78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95]
def sdist(poly,pts):
  c=np.array(poly,np.float32).reshape(-1,1,2); return np.array([cv2.pointPolygonTest(c,(float(a),float(b)),True) for a,b in pts])
ov=sdist(L[OVAL],p); mo=sdist(L[INNER],p)
reg=np.clip((ov-4)/40,0,1)*np.clip((-mo-2)/10,0,1)
from scipy.spatial import cKDTree
sel=reg>0.5; y0=0.0; Vc=V.copy(); Vc[:,1]-=y0
Vm=Vc*np.array([1,-1,1]); dd,j=cKDTree(Vc).query(Vm); ok=dd<0.004
side=np.sign(np.sum((vis*sel)[Vc[:,1]>0])-np.sum((vis*sel)[Vc[:,1]<0]))   # +1: +Y-Seite besser sichtbar
sb=-Vc[:,1]*side; t=np.clip(0.5+sb/0.024,0,1)   # 0 = gute Seite, 1 = schlechte Seite (8 mm Übergang um Mittellinie)
mA=reg*vis**2*(1-t); mB=np.where(ok,reg[j]*vis[j]**2,0)*t
print('side',side,'y0',y0)
np.savez(sys.argv[2],uvA=uv.astype(np.float32),mA=mA.astype(np.float32),uvB=uv[j].astype(np.float32),mB=mB.astype(np.float32)); print('MASK>0.5',int((mA>0.5).sum()),int((mB>0.5).sum()))
