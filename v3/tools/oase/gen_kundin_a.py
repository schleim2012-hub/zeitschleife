# Sonnen-Oase Ab-18-Figur (Rückenlage + Aufsetzen). SDF -> Marching Cubes, Gesicht/Haar-Front aus Petes TensorHub-Referenz (r1, gespiegelt) als Relief+Textur,
# Körperhaut prozedural (keine Rohfotos im Repo, nur fertige Textur im GLB). Achsen wie gen_kundin.py: x Länge (Kopf -x), y hoch (Liegefläche 0), z quer (Spieler +z).
import numpy as np, trimesh, fast_simplification, sys, json, struct, io
from skimage.measure import marching_cubes
from scipy.ndimage import gaussian_filter, map_coordinates
from PIL import Image, ImageFilter
OUT=sys.argv[1] if len(sys.argv)>1 else './'
B='/workspace/oase_b/b/'
X0,X1,Z0,Z1=-0.98,1.0,-0.37,0.37; TW,TH=4096,1536
def nrm(v): v=np.asarray(v,float); return v/np.linalg.norm(v)
def smin(a,b,k): h=np.clip(0.5+0.5*(b-a)/k,0,1); return b*(1-h)+a*h-k*h*(1-h)
def smax(a,b,k): return -smin(-a,-b,k)
def ell(p,c,r,R=None):
  q=p-np.asarray(c,float)
  if R is not None: q=q@R
  r=np.asarray(r,float); k0=np.linalg.norm(q/r,axis=1); k1=np.linalg.norm(q/(r*r),axis=1)+1e-9; return k0*(k0-1)/k1
def cap(p,a,b,r1,r2=None):
  r2=r1 if r2 is None else r2; a=np.asarray(a,float); b=np.asarray(b,float); pa=p-a; ba=b-a; h=np.clip((pa@ba)/(ba@ba),0,1); return np.linalg.norm(pa-h[:,None]*ba,axis=1)-(r1+(r2-r1)*h)
def rotx(t): c,s=np.cos(t),np.sin(t); return np.array([[1,0,0],[0,c,-s],[0,s,c]])
def rotz(t): c,s=np.cos(t),np.sin(t); return np.array([[c,-s,0],[s,c,0],[0,0,1]])
def roty(t): c,s=np.cos(t),np.sin(t); return np.array([[c,0,s],[0,1,0],[-s,0,c]])
def sst(e0,e1,x): t=np.clip((x-e0)/(e1-e0),0,1); return t*t*(3-2*t)
# ---------------- Gesicht: Referenz-Kopfausschnitt (r1, 190..450 x 270..530, x4 hochskaliert), gespiegelt -> Blick zum Spieler (+z)
HC=np.asarray(Image.open(B+'headcrop_x4_closed.png').convert('RGB')).astype(np.float32)/255   # 1040x1040
DEP=np.load(B+'dep_r1_Depth-Anything-V2-Large-hf.npy')[270:530,190:450].astype(np.float32)
NOSE=(326.7-190,390-270)        # Nasenspitze im Ausschnitt (px, orig)
SX,SZ=0.00135,0.00105            # m/px: Bildhöhe -> Welt x, Bildbreite -> Welt z
FX,FZ=-0.79,0.03
def crop_uv(x,z):   # Welt (Ruhelage) -> Ausschnitt-Pixel (orig 260er Raster); gespiegelt: Bild rechts -> +z ... gespiegelt => Bild rechts -> -z? siehe Kommentar
  j=NOSE[1]+(x-FX)/SX; i=NOSE[0]+(z-FZ)/SZ; return i,j
dhp=DEP-gaussian_filter(DEP,9); dhp=gaussian_filter(dhp,1.0); dhp=dhp/np.percentile(np.abs(dhp),99.5)
def face_w(x,z): return np.clip(1-np.sqrt(((x-(-0.795))/0.098)**2+((z-0.008)/0.074)**2),0,1)**0.6
def relief(x,z):
  i,j=crop_uv(x,z); r=map_coordinates(dhp,[j,i],order=1,mode='nearest'); return 0.011*np.clip(r,-1.2,1.2)*np.clip(face_w(x,z)*3,0,1)
# ---------------- Pose
PIV=np.array([0.0,0.075,0.0]); TH_UP=np.radians(-30)
def bendw(x): return sst(0.02,-0.20,x)
HP=np.array([-0.655,0.092,0.0]); HAX,HAZ=0.55,-0.42     # Kopf in Pose 'up': zum Spieler (+z) gedreht, Kinn Richtung Brust
def hw(x): return sst(-0.61,-0.71,x)
def headrot(r,w,inv=False):
  d=r-HP; ax=HAX*w*(-1 if inv else 1); az=HAZ*w*(-1 if inv else 1)
  def rx(d,t): c,s=np.cos(t),np.sin(t); return np.stack([d[:,0],c*d[:,1]-s*d[:,2],s*d[:,1]+c*d[:,2]],1)
  def rz(d,t): c,s=np.cos(t),np.sin(t); return np.stack([c*d[:,0]-s*d[:,1],s*d[:,0]+c*d[:,1],d[:,2]],1)
  d=rz(rx(d,ax),az) if not inv else rx(rz(d,az),ax); return HP+d
def unbend(p):
  q=unbend0(p); r=q.copy()
  for _ in range(3): r=headrot(q,hw(r[:,0]),inv=True)
  return r
def unbend0(p):  # Pose 'up' -> Ruhelage (Fixpunkt-Iteration)
  r=p.copy()
  for _ in range(4):
    a=-TH_UP*bendw(r[:,0]); c,s=np.cos(a),np.sin(a); d=p-PIV
    r=np.stack([PIV[0]+c*d[:,0]-s*d[:,1],PIV[1]+s*d[:,0]+c*d[:,1],p[:,2]],1)
  return r
def bend(r):
  a=TH_UP*bendw(r[:,0]); c,s=np.cos(a),np.sin(a); d=r-PIV
  return np.stack([PIV[0]+c*d[:,0]-s*d[:,1],PIV[1]+s*d[:,0]+c*d[:,1],r[:,2]],1)
RB=rotx(np.radians(14)); RBm=rotx(np.radians(-14))
RB=rotx(np.radians(22)); RBm=rotx(np.radians(-22))
BR=[(-0.447,0.160,0.104,RB),(-0.447,0.160,-0.104,RBm)]
def torso(p):  # Ruhelage, ohne Arme
  d=ell(p,[-0.47,0.100,0],[0.15,0.094,0.152])                       # Brustkorb
  d=smin(d,ell(p,[-0.575,0.090,0],[0.07,0.075,0.185]),0.05)          # Schultergürtel
  for sz in (1,-1): d=smin(d,ell(p,[-0.575,0.082,sz*0.178],[0.055,0.052,0.05]),0.03)
  d=smin(d,ell(p,[-0.27,0.082,0],[0.13,0.074,0.122]),0.07)           # Taille
  d=smin(d,ell(p,[-0.13,0.083,0],[0.10,0.072,0.142]),0.06)           # Unterbauch
  d=smin(d,ell(p,[-0.02,0.088,0],[0.125,0.082,0.172]),0.06)          # Becken
  for sz in (1,-1): d=smin(d,ell(p,[0.0,0.060,sz*0.085],[0.13,0.06,0.10]),0.04)  # Gesäß (liegt platt auf)
  for (x,y,z,R) in BR:                                               # Brüste (Rückenlage: flacher, leicht seitlich)
    d=smin(d,ell(p,[x,y,z],[0.078,0.036,0.084],R),0.06)
    d=smin(d,ell(p,[x+0.002,y+0.033,z*1.07],[0.012,0.0045,0.012]),0.008)   # Warzenhof
    d=smin(d,ell(p,[x+0.002,y+0.0385,z*1.07],[0.0042,0.0042,0.0042]),0.003)   # Brustwarze
  for sz in (1,-1): d=smin(d,cap(p,[-0.60,0.150,sz*0.012],[-0.592,0.145,sz*0.15],0.0075),0.012)  # Schlüsselbeine
  d=smax(d,-ell(p,[-0.19,0.157,0],[0.008,0.006,0.006]),0.006)        # Nabel
  d=smax(d,-cap(p,[-0.55,0.196,0],[-0.38,0.192,0],0.004),0.012)      # Brustbein-Rinne
  # Hals + Kopf
  d=smin(d,cap(p,[-0.62,0.088,0],[-0.705,0.098,0.004],0.051,0.047),0.035)
  hd=smin(ell(p,[-0.842,0.100,0.0],[0.094,0.090,0.081]),ell(p,[-0.752,0.112,0.003],[0.058,0.066,0.058]),0.03)
  hd=smin(hd,ell(p,[-0.822,0.135,0.003],[0.05,0.06,0.07]),0.03)     # Stirn/Wangen-Basis
  rel=relief(p[:,0],p[:,2])*sst(0.10,0.16,p[:,1]); hd=hd-rel
  d=smin(d,hd,0.025)
  # Beine
  for sz in (1,-1):
    hp=np.array([0.05,0.085,sz*0.088]); kn=np.array([0.48,0.064,sz*0.075]); an=np.array([0.875,0.045,sz*0.07])
    d=smin(d,cap(p,hp,kn,0.084,0.052),0.045)
    d=smin(d,ell(p,[0.25,0.07,sz*0.09],[0.16,0.068,0.075]),0.04)       # Oberschenkel-Volumen
    d=smin(d,ell(p,kn+[0.005,0.012,0],[0.04,0.035,0.045]),0.02)         # Knie
    d=smin(d,cap(p,kn,an,0.05,0.031),0.025)
    d=smin(d,ell(p,[0.62,0.050,sz*0.074],[0.12,0.046,0.047]),0.03)      # Wade (liegt auf)
    d=smin(d,ell(p,an+[0.022,-0.006,0],[0.035,0.03,0.03]),0.015)       # Ferse
    tz=sz*0.095; d=smin(d,cap(p,an+[0.01,0.01,0],[0.925,0.19,tz],0.029,0.022),0.02)   # Fuß (zeigt nach oben, leicht auswärts)
    d=smin(d,ell(p,[0.917,0.175,tz*0.96],[0.016,0.03,0.035]),0.012)
  return d
def hand(p,W,hd,up_n,sz,curl=0.25):
  # Handfläche + 4 Finger + Daumen (statt Fäustling). hd: Richtung Finger, up_n: Handrücken-Normale
  hd=nrm(hd); n=nrm(up_n-hd*(up_n@hd)); sv=np.cross(n,hd)*sz
  d=ell(p,W+hd*0.042,[0.044,0.013,0.036],np.stack([hd,n,np.cross(hd,n)],1))
  for k,(o,L) in enumerate([(-0.026,0.062),(-0.009,0.072),(0.009,0.068),(0.025,0.055)]):
    b=W+hd*0.078+sv*o; dirf=nrm(hd+sv*o*1.6-n*curl); t=b+dirf*L
    d=smin(d,cap(p,b,t,0.0088,0.0072),0.006)
  tb=W+hd*0.02-sv*0.03; tt=tb+nrm(hd*0.7-sv*0.55-n*0.2)*0.055
  d=smin(d,cap(p,tb,tt,0.011,0.0085),0.01)
  return d
def arms(p,up):
  d=np.full(len(p),9.0)
  for sz in (1,-1):
    if not up:
      S=np.array([-0.575,0.088,sz*0.19])
      if sz<0:   # spielerferner Arm: Hand hinter dem Kopf (wie Referenz r1)
        E=np.array([-0.82,0.075,-0.265]); W=np.array([-0.93,0.055,-0.085]); hd=nrm([-0.2,-0.1,1]); un=np.array([-1.0,0.3,0])
      else:
        E=np.array([-0.31,0.055,0.228]); W=np.array([-0.075,0.038,0.232]); hd=nrm([1,-0.12,0.05]); un=np.array([0,1.0,0.25])
    else:      # auf die Ellbogen gestützt: Oberarm schräg nach unten-hinten, Unterarm flach auf der Liege
      S=bend(np.array([[-0.575,0.088,sz*0.19]]))[0]; E=np.array([S[0]-0.035,0.05,sz*0.225]); W=np.array([E[0]+0.24,0.032,sz*0.21]); hd=nrm([1,-0.05,-0.08*sz]); un=np.array([0,1.0,0.15*sz])
    d=smin(d,cap(p,S,E,0.047,0.036),0.03); d=smin(d,cap(p,E,W,0.035,0.024),0.02)
    d=smin(d,hand(p,W-hd*0.01,hd,un,sz),0.008)
  return d
def body(p,up):
  r=unbend(p) if up else p
  d=torso(r)
  d=smin(d,arms(p,up),0.02)
  return smax(d,-(p[:,1]+0.002),0.012)
def hair(p,up):
  r=unbend(p) if up else p
  x,y,z=r[:,0],r[:,1],r[:,2]
  d=ell(r,[-0.852,0.098,0.0],[0.112,0.106,0.098])                     # Haarkappe um den Schädel (voller)
  for sz in (1,-1): d=smin(d,ell(r,[-0.80,0.085,sz*0.085],[0.085,0.06,0.03]),0.03)   # weiche Seitenpartien neben dem Gesicht
  if not up:
    d=smin(d,ell(r,[-0.95,0.05,0.0],[0.13,0.058,0.18]),0.06)            # aufgefächert über die Liege (fülliger)
    for sz in (1,-1): d=smin(d,ell(r,[-0.70,0.035,sz*0.115],[0.12,0.032,0.06]),0.04)   # Strähnen neben Hals/Schultern
  else:
    d=smin(d,ell(r,[-0.90,0.075,0.0],[0.095,0.085,0.11]),0.04)          # Hinterkopf-Volumen
    for sz in (1,-1): d=smin(d,ell(r,[-0.70,0.13,sz*0.10],[0.10,0.05,0.04]),0.04)   # Strähnen fallen auf die Schultern
  w=np.sin(x*23+np.sin(z*31)*1.7)*np.sin(z*29+np.sin(y*37)*1.9)*np.sin(y*27+np.sin(x*33)*1.5)
  d=d+0.0022*(w+0.35*np.sin(z*90+np.sin(x*30)*2.0))
  d=smax(d,(face_w(x,z)-0.30)*0.10*sst(0.06,0.10,y),0.01)           # Gesicht frei
  d=smax(d,-(torso(r)-0.0015),0.004)
  return smax(d,-(p[:,1]+0.002),0.01)

# ---------------- 80er-Sonnenbrille (o7): verdeckt die Augen-Partie des Fotogesichts, gibt dem Profil Tiefe
LENS=[(-0.808,-0.016),(-0.806,0.046)]
def surf_y(x,z):
  ys=np.arange(0.30,0.05,-0.0005); P=np.stack([np.full_like(ys,x),ys,np.full_like(ys,z)],1); d=torso(P); k=np.argmax(d<0); return ys[k] if d[k]<0 else 0.0
def snorm(c,e=0.002):
  g=np.array([(torso(np.array([c+dv]))-torso(np.array([c-dv])))[0] for dv in np.eye(3)*e]); return nrm(g)
_GL=None
def gl_frames():
  global _GL
  if _GL is None:
    _GL=[]
    for (lx,lz) in LENS:
      c=np.array([lx,surf_y(lx,lz),lz]); n=snorm(c); n=nrm(n+np.array([0,0.6,0]))      # etwas zum Gesichts-"Oben" geneigt, liegt nicht in der Wange
      t1=nrm(np.array([1.0,0,0])-n*n[0]); t2=np.cross(t1,n); _GL.append((c+n*0.011,np.stack([t1,n,t2],1)))
  return _GL
def glasses_sdf(p):
  d=np.full(len(p),9.0); F=gl_frames()
  for (c,R) in F:
    q=(p-c)@R
    e=np.sqrt((q[:,0]/0.024)**2+(np.maximum(np.abs(q[:,2])-0.004,0)/0.026)**2)-1
    lens=np.sqrt((np.maximum(e,0)*0.024)**2+np.maximum(np.abs(q[:,1])-0.0022,0)**2)-0.0008
    rim=np.maximum(np.abs(e)*0.025-0.0024,np.abs(q[:,1])-0.0040)
    d=np.minimum(d,np.minimum(lens,rim))
  (ca,Ra),(cb,Rb)=F; d=smin(d,cap(p,ca+Ra[:,0]*(-0.012)+Ra[:,2]*0.028,cb+Rb[:,0]*(-0.012)-Rb[:,2]*0.028,0.0030),0.004)   # Steg
  for (c,R),sg in ((F[0],-1),(F[1],1)):
    e0=c+R[:,2]*sg*0.031+R[:,0]*(-0.008); e1=e0-R[:,1]*0.05+R[:,2]*sg*0.012+np.array([-0.02,0,0]); d=smin(d,cap(p,e0,e1,0.0026),0.004)   # Bügel ins Haar
  return d
def glasses(up):
  m=mesh(glasses_sdf,[-0.87,0.08,-0.10],[-0.74,0.26,0.14],0.0011,80000)
  ok=np.all((m.vertices>[-0.88,0.07,-0.11])&(m.vertices<[-0.73,0.27,0.15]),1); m.update_faces(ok[m.faces].all(1)); m.remove_unreferenced_vertices()
  if up: m=trimesh.Trimesh(bend(headrot(m.vertices,hw(m.vertices[:,0]))),m.faces,process=False)
  return m
def evalg(f,lo,hi,h):
  xs=[np.arange(lo[i],hi[i]+h,h) for i in range(3)]; n=[len(a) for a in xs]
  G=np.stack(np.meshgrid(*xs,indexing='ij'),-1).reshape(-1,3); v=np.empty(len(G),np.float32)
  for k in range(0,len(G),600000): v[k:k+600000]=f(G[k:k+600000])
  return v.reshape(n),xs
def mesh(f,lo,hi,h,target):
  v,xs=evalg(f,lo,hi,h)
  if v.min()>0: return None
  V,F,_,_=marching_cubes(v,0.0,spacing=(h,h,h)); V=V+np.array(lo)
  if len(F)>target: V,F=fast_simplification.simplify(V.astype(np.float32),F.astype(np.int32),1-target/len(F))
  m=trimesh.Trimesh(V,F,process=True); trimesh.smoothing.filter_taubin(m,lamb=0.5,nu=-0.53,iterations=4)
  if m.volume<0: m.invert()
  return m
def ao(m,f):
  p=m.vertices; n=m.vertex_normals; a=np.zeros(len(p))
  for i,s in enumerate([0.008,0.02,0.045,0.09]): a+=(s-np.minimum(f(p+n*s),s))/s*(0.5**i)
  return np.clip(1-0.5*a,0.3,1)
# ---------------- Weiches Handtuch (Höhenfeld) + Brust-Handtuch
def topmap(f,x0,x1,z0,z1,h,ymax):
  xs=np.arange(x0,x1+1e-6,h); zs=np.arange(z0,z1+1e-6,h); ys=np.arange(0,ymax,0.003)
  X,Z,Y=np.meshgrid(xs,zs,ys,indexing='ij'); d=f(np.stack([X.ravel(),Y.ravel(),Z.ravel()],1)).reshape(X.shape)
  ins=d<0; top=np.where(ins.any(2),ys[np.clip(ins.shape[2]-1-np.argmax(ins[:,:,::-1],2),0,None)],0.0); return xs,zs,top
def grid_mesh(XX,YY,ZZ):
  nx,nz=XX.shape; V=np.stack([XX.ravel(),YY.ravel(),ZZ.ravel()],1); i,j=np.meshgrid(np.arange(nx-1),np.arange(nz-1),indexing='ij'); a=(i*nz+j).ravel(); b=a+nz
  F=np.concatenate([np.stack([a,a+1,b],1),np.stack([b,a+1,b+1],1)]); m=trimesh.Trimesh(V,F,process=False)
  if m.face_normals[:,1].mean()<0: m.invert()
  return m
def towel(fb):
  # kleines Handtuch, nur leicht über dem Schritt: Rechteck auf der Körperoberfläche, sanft gespannt, Ränder fallen weich ab
  x0,x1,z0,z1=-0.08,0.205,-0.168,0.168; xs,zs,top=topmap(fb,x0,x1,z0,z1,0.004,0.3)
  XX,ZZ=np.meshgrid(xs,zs,indexing='ij'); H=np.maximum(top+0.011,0.004); Hs=gaussian_filter(H,4.0); H=np.maximum(Hs,top+0.011)
  H+=0.0035*np.sin(XX*26+ZZ*14+np.sin(ZZ*9)*2)**2+0.002*np.sin(ZZ*38-XX*11)+0.0012*np.sin(XX*70+ZZ*30)
  ex=np.minimum(XX-x0,x1-XX); ez=np.minimum(ZZ-z0,z1-ZZ); e=np.minimum(ex,ez)
  H=H-np.clip(0.02-e,0,None)*0.9                       # Saum hängt etwas
  H=np.maximum(gaussian_filter(np.maximum(H,top+0.009),0.8),top+0.009)
  return grid_mesh(XX,H,ZZ)
# ---------------- Texturen
rng=np.random.default_rng(7)
def fbm(h,w,sig,amps):
  o=np.zeros((h,w),np.float32)
  for s,a in zip(sig,amps): n=gaussian_filter(rng.standard_normal((h//4+1,w//4+1)).astype(np.float32),s/4); n=np.asarray(Image.fromarray(n).resize((w,h),Image.BICUBIC)); o+=a*n/(n.std()+1e-6)
  return o
def skin_tex():
  u=(np.arange(TW)+0.5)/TW; v=(np.arange(TH)+0.5)/TH; X=X0+u[None,:]*(X1-X0); Z=Z0+v[:,None]*(Z1-Z0); X=np.broadcast_to(X,(TH,TW)); Z=np.broadcast_to(Z,(TH,TW))
  base=np.array([0.80,0.585,0.47],np.float32)        # sRGB, sonnengebräunt
  n=fbm(TH,TW,[120,30,6],[0.035,0.025,0.012]); n2=fbm(TH,TW,[60],[1])
  T=np.ones((TH,TW,3),np.float32)*base
  T*= (1+n)[...,None]; T[...,0]*=1+0.02*n2; T[...,2]*=1-0.03*n2
  pores=rng.standard_normal((TH,TW)).astype(np.float32); pores=gaussian_filter(pores,0.7); T*=(1-0.03*np.clip(pores,0,3))[...,None]
  def blob(cx,cz,rx,rz,col,k,soft=1.0):
    d=np.sqrt(((X-cx)/rx)**2+((Z-cz)/rz)**2); w=np.clip(1-d,0,1)**soft*k; T[:]=T*(1-w[...,None])+np.asarray(col,np.float32)*w[...,None]
  for sz in (1,-1):
    bx,bz=-0.445,0.104*sz*1.07
    blob(bx,bz,0.024,0.024,[0.60,0.36,0.30],0.85,0.6)              # Warzenhof
    blob(bx,bz,0.007,0.007,[0.52,0.29,0.25],0.9,0.5)               # Brustwarze
    blob(-0.45,0.094*sz,0.08,0.085,[0.84,0.63,0.52],0.35,1.5)      # etwas hellere Brusthaut
    blob(0.48,0.075*sz,0.035,0.04,[0.78,0.52,0.44],0.35,1.5)       # Knie
    blob(-0.31,0.228*sz,0.03,0.03,[0.76,0.50,0.42],0.3,1.5)        # Ellbogen
    blob(0.92,0.095*sz,0.03,0.04,[0.80,0.55,0.48],0.35,1.2)        # Zehen
  blob(-0.19,0.0,0.006,0.006,[0.45,0.28,0.22],0.6,0.8)              # Nabel
  # Gesicht aus der Referenz (gespiegelt), Teil-Entlichtung, Farbabgleich, weicher Rand
  i,j=crop_uv(X,Z); w=face_w(X,Z); w=np.clip(w*2.4-0.30,0,1); sel=w>0   # Fotogesicht nur vorn, seitlich Haut
  hc=np.stack([gaussian_filter(HC[...,c],5) for c in range(3)],-1); L=hc.mean(2); Lb=gaussian_filter(L,45); hc=hc/np.clip(Lb,0.05,None)[...,None]**0.55
  core=(face_w(X,Z)>0.55); fc=np.stack([map_coordinates(hc[...,c],[j[core]*4,i[core]*4],order=1,mode='nearest') for c in range(3)],1)
  gain=(T[core].mean(0)/fc.mean(0))
  F=np.stack([map_coordinates(hc[...,c],[j[sel]*4,i[sel]*4],order=1,mode='nearest') for c in range(3)],1)*gain
  Lf=F.mean(1,keepdims=True); sk=T[sel]/np.clip(T[sel].mean(1,keepdims=True),1e-3,None); blue=np.clip((F[:,2]-F[:,0])*6+0.3,0,1)[:,None]
  F=F*(1-blue)+Lf*sk*blue; F=F*0.75+Lf*sk*0.25
  F=np.clip(F,0,1.1); w=w*0.85; T[sel]=T[sel]*(1-w[sel,None])+F*w[sel,None]
  return np.clip(T,0,1)
def tex_img(T): return Image.fromarray((T*255).astype(np.uint8))
# ---------------- GLB
def glb(fn,nodes,img_bytes):
  bin=bytearray(); bvs=[]; acc=[]; meshes=[]; gnodes=[]
  def add(arr,comp,typ,target=None,norm=False,mm=False):
    a=np.ascontiguousarray(arr); off=len(bin); bin.extend(a.tobytes()); 
    while len(bin)%4: bin.append(0)
    bvs.append({'buffer':0,'byteOffset':off,'byteLength':a.nbytes,**({'target':target} if target else {})})
    d={'bufferView':len(bvs)-1,'componentType':comp,'count':len(a),'type':typ}
    if norm: d['normalized']=True
    if mm: d['min']=a.min(0).tolist(); d['max']=a.max(0).tolist()
    acc.append(d); return len(acc)-1
  mats=[]; images=[]; texs=[]
  if img_bytes:
    off=len(bin); bin.extend(img_bytes); 
    while len(bin)%4: bin.append(0)
    bvs.append({'buffer':0,'byteOffset':off,'byteLength':len(img_bytes)}); images.append({'bufferView':len(bvs)-1,'mimeType':'image/jpeg'}); texs.append({'source':0,'sampler':0})
  for name,(m,attrs,textured) in nodes.items():
    V=m.vertices.astype(np.float32); N=m.vertex_normals.astype(np.float32); F=m.faces.astype(np.uint32).ravel()
    at={'POSITION':add(V,5126,'VEC3',34962,mm=True),'NORMAL':add(N,5126,'VEC3',34962)}
    for k,(a,typ) in attrs.items():
      at[k]=add(a,5121,typ,34962,norm=True) if a.dtype==np.uint8 else add(a.astype(np.float32),5126,typ,34962)
    mat={'name':name,'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':0.6}}
    if textured: mat['pbrMetallicRoughness']['baseColorTexture']={'index':0}
    mats.append(mat)
    meshes.append({'name':name,'primitives':[{'attributes':at,'indices':add(F,5125,'SCALAR',34963),'material':len(mats)-1}]}); gnodes.append({'name':name,'mesh':len(meshes)-1})
  js={'asset':{'version':'2.0','generator':'zs gen_kundin_a'},'scene':0,'scenes':[{'nodes':list(range(len(gnodes)))}],'nodes':gnodes,'meshes':meshes,'materials':mats,'accessors':acc,'bufferViews':bvs,'buffers':[{'byteLength':len(bin)}]}
  if img_bytes: js.update(images=images,textures=texs,samplers=[{'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071}])
  J=json.dumps(js,separators=(',',':')).encode(); 
  while len(J)%4: J+=b' '
  out=struct.pack('<III',0x46546C67,2,12+8+len(J)+8+len(bin))+struct.pack('<II',len(J),0x4E4F534A)+J+struct.pack('<II',len(bin),0x004E4942)+bytes(bin)
  open(fn,'wb').write(out); print(fn,len(out)//1024,'KB')
# ---------------- Bauen
def vattr(m,rest,fall,kind):
  v=rest; x,y,z=v[:,0],v[:,1],v[:,2]; a=ao(m,fall)
  oil=np.clip((x+0.66)/0.05,0,1)                                   # Kopf/Hals nicht ölen
  if kind!='body': oil[:]=0
  br=np.zeros(len(v))
  for (bx,by,bz,R) in BR: br=np.maximum(br,np.clip(1-np.linalg.norm((v-[bx,by-0.02,bz])/[0.085,0.08,0.09],axis=1),0,1)**0.7)
  soft=0.35+0.35*np.exp(-((x+0.17)/0.13)**2)*sst(0.10,0.15,y)        # Bauch
  soft=np.maximum(soft,0.55*(x>0.06)*(x<0.42)*sst(0.04,0.11,y))      # Oberschenkel
  soft=np.maximum(soft,br); soft*=np.clip((x+0.64)/0.08,0,1)
  a=a*(1-0.18*np.clip((-0.66-x)/0.06,0,1))
  C=np.stack([a,a,a,oil],1); C=(np.clip(C,0,1)*255+0.5).astype(np.uint8)
  S=np.stack([soft,br],1).astype(np.float32)
  uv=np.stack([(x-X0)/(X1-X0),(z-Z0)/(Z1-Z0)],1).astype(np.float32)
  return {'COLOR_0':(C,'VEC4'),'_SOFT':(S,'VEC2'),'TEXCOORD_0':(uv,'VEC2')}
def build(up,img):
  lo=[-0.99,-0.01,-0.37]; hi=[1.0,0.92 if up else 0.27,0.37]; h=0.0042*float(__import__('os').environ.get('HS','1'))
  fb=lambda q:body(q,up); fh=lambda q:hair(q,up); fall=lambda q:np.minimum(fb(q),fh(q))
  Bm=mesh(fb,lo,hi,h,90000); rest=unbend(Bm.vertices) if up else Bm.vertices
  Hm=mesh(fh,[-0.80,0.12,-0.26] if up else [-1.0,-0.01,-0.24],[-0.02,0.95,0.26] if up else [-0.55,0.24,0.24],0.0035,22000)
  nodes={'body':(Bm,vattr(Bm,rest,fall,'body'),True)}
  ha=ao(Hm,fall); ha=0.55+0.45*ha; hc=np.stack([np.minimum(1,ha*1.0),np.minimum(1,ha*0.9),ha*0.66,0*ha],1); nodes['hair']=(Hm,{'COLOR_0':((hc*255).astype(np.uint8),'VEC4')},False)
  Gm=glasses(up); nodes['glasses']=(Gm,{},False)
  Tw=towel(lambda q:torso(q)) ; 
  if up: Tw=trimesh.Trimesh(bend(Tw.vertices),Tw.faces,process=False)
  ta=np.clip(ao(Tw,fb)*0.35+0.65,0,1); nodes['towel']=(Tw,{'COLOR_0':((np.stack([ta,ta,ta,0*ta],1)*255).astype(np.uint8),'VEC4')},False)
  if False:
    def chest(q):
      d=fb(q)-0.012; L=unbend(q); box=np.maximum.reduce([-0.545-L[:,0],L[:,0]+0.335,L[:,1]-0.27,0.125-L[:,1]]); return smax(d,box,0.012)
    ct=mesh(chest,lo,hi,h,6000); ca=ao(ct,fb); nodes['chest']=(ct,{'COLOR_0':((np.stack([ca,ca,ca,0*ca],1)*255).astype(np.uint8),'VEC4')},False)
  b=io.BytesIO(); img.save(b,'JPEG',quality=87); fn=OUT+('kundin_up_a.glb' if up else 'kundin_lie_a.glb'); glb(fn,nodes,b.getvalue())
  print({k:len(v[0].faces) for k,v in nodes.items()})
if __name__=='__main__':
  import time; t=time.time(); img=tex_img(skin_tex()); img.save('/workspace/oase_b/gen/skin_preview.jpg',quality=80); print('tex',time.time()-t)
  for up in ([False,True] if len(sys.argv)<3 else [sys.argv[2]=='up']): build(up,img); print(time.time()-t)
