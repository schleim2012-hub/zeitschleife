# Sonnen-Oase: PROVISORISCHE Kundin (Platzhalter bis Petes Referenz -> Hunyuan). SDF -> Marching Cubes -> GLB.
# Lokale Achsen: x = Körperlänge (Kopf -x, Füße +x), y = hoch (Liegenoberfläche y=0), z = quer (Spieler steht auf +z).
# Knoten: body (COLOR_0.a=1 -> ölbare Haut), hair, towel (Adult), robe/strap (jugendfrei), top/chest (Pose "up").
import numpy as np, trimesh, fast_simplification, sys
from skimage.measure import marching_cubes
OUT=sys.argv[1] if len(sys.argv)>1 else '../../assets/oase/'
def nrm(v): v=np.asarray(v,float); return v/np.linalg.norm(v)
def smin(a,b,k): h=np.clip(0.5+0.5*(b-a)/k,0,1); return b*(1-h)+a*h-k*h*(1-h)
def smax(a,b,k): return -smin(-a,-b,k)
def ell(p,c,r,R=np.eye(3)):
  q=(p-c)@R; r=np.asarray(r,float); k0=np.linalg.norm(q/r,axis=1); k1=np.linalg.norm(q/(r*r),axis=1)+1e-9; return k0*(k0-1)/k1
def cap(p,a,b,r1,r2=None):
  r2=r1 if r2 is None else r2; a=np.asarray(a,float); b=np.asarray(b,float); pa=p-a; ba=b-a; h=np.clip((pa@ba)/(ba@ba),0,1); return np.linalg.norm(pa-h[:,None]*ba,axis=1)-(r1+(r2-r1)*h)
def rotz(t): c,s=np.cos(t),np.sin(t); return np.array([[c,-s,0],[s,c,0],[0,0,1]])
def roty(t): c,s=np.cos(t),np.sin(t); return np.array([[c,0,s],[0,1,0],[-s,0,c]])
PIV=np.array([-0.04,0.10,0.0])
class Pose:
  def __init__(s,up):
    s.up=up; th=np.radians(-27) if up else 0.0; s.R=rotz(th); s.Rh=rotz(th*0.5)
    U=lambda p,R=None:(PIV+((np.asarray(p,float)-PIV)@(R if R is not None else s.R).T)) if up else np.asarray(p,float)
    s.U=U
    s.C=U([-0.42,0.112,0]); s.W=U([-0.22,0.098,0],s.Rh); s.N=U([-0.645,0.098,0]); s.Hc=U([-0.775,0.112,-0.005])
    s.S=[U([-0.535,0.088,sz*0.185]) for sz in (1,-1)]
    if up:
      s.E=[np.array([s.S[i][0]+0.03,0.035,[1,-1][i]*0.205]) for i in range(2)]; s.Wr=[np.array([s.E[i][0]-0.21,0.03,[1,-1][i]*0.13]) for i in range(2)]
      s.f=nrm([-1.0,-0.25,0.0]); s.cr=nrm([-0.3,1.0,0.0]); s.Hc=s.Hc+np.array([0.0,0.03,0.0])   # Kopf gehoben, Blick nach vorn (vom Spieler weg)
    else:
      s.E=[np.array([-0.29,0.062,sz*0.232]) for sz in (1,-1)]; s.Wr=[np.array([-0.06,0.045,sz*0.24]) for sz in (1,-1)]
      s.f=nrm([-0.15,-1.0,0.0]); s.cr=nrm([-1.0,0.15,0.0]); s.Hc=np.array([-0.79,0.07,0.0])   # Gesicht im Kopfloch der Liege
    s.cr=nrm(s.cr-s.f*(s.cr@s.f)); s.sd=np.cross(s.f,s.cr); s.HR=np.stack([s.f,s.cr,s.sd],1)  # Spalten = lokale Achsen
def body(p,P):
  R=P.R if P.up else np.eye(3); Rh=P.Rh if P.up else np.eye(3)
  d=ell(p,P.C,[0.17,0.098,0.188],R)
  d=smin(d,ell(p,P.U([-0.50,0.11,0]),[0.09,0.085,0.205],R),0.05)           # Schulterpartie
  for sz in (1,-1): d=smin(d,ell(p,P.U([-0.45,0.19,sz*0.075]),[0.075,0.03,0.06],R),0.04)   # Schulterblätter
  d=smin(d,ell(p,P.W,[0.15,0.082,0.135],Rh),0.06)
  d=smin(d,ell(p,[-0.03,0.105,0],[0.13,0.1,0.172]),0.06)                   # Becken
  for sz in (1,-1): d=smin(d,ell(p,[0.045,0.145,sz*0.072],[0.115,0.07,0.088]),0.04)  # Po
  d=smax(d,-cap(p,P.U([-0.56,0.205,0]),P.U([-0.12,0.178,0],Rh),0.011),0.02)  # Wirbelsäulenrinne
  d=smin(d,cap(p,P.C+np.array([-0.15,0,0])@ (R.T if P.up else np.eye(3)) ,P.N,0.052,0.046),0.04)
  d=smin(d,cap(p,P.N,P.Hc-P.f*0.01-P.cr*0.04,0.046),0.03)
  # Kopf (lokal: f = Gesicht vorn, cr = Scheitel, sd = seitlich)
  H=P.Hc; d=smin(d,ell(p,H,[0.088,0.108,0.074],P.HR),0.02)
  d=smin(d,ell(p,H+P.f*0.035-P.cr*0.06,[0.06,0.05,0.058],P.HR),0.025)   # Kiefer/Kinn
  d=smin(d,ell(p,H+P.f*0.088-P.cr*0.005,[0.018,0.03,0.012],P.HR),0.012)  # Nase
  for i,sz in enumerate((1,-1)):
    S,E,Wr=P.S[i],P.E[i],P.Wr[i]
    d=smin(d,cap(p,S,E,0.047,0.04),0.035); d=smin(d,cap(p,E,Wr,0.036,0.026),0.02)
    hd=nrm(Wr-E); d=smin(d,ell(p,Wr+hd*0.06+np.array([0,-0.012,0]),[0.06,0.018,0.036],np.stack([hd,[0,1,0],np.cross(hd,[0,1,0])],1)),0.015)
    hp=np.array([0.07,0.095,sz*0.085]); kn=np.array([0.47,0.066,sz*0.074]); an=np.array([0.855,0.058,sz*0.066]); to=np.array([0.935,0.022,sz*0.068])
    d=smin(d,cap(p,hp,kn,0.08,0.052),0.04); d=smin(d,cap(p,kn,an,0.05,0.032),0.025)
    d=smin(d,ell(p,[0.58,0.095,sz*0.072],[0.11,0.045,0.048]),0.03)       # Wade
    d=smin(d,cap(p,an,to,0.033,0.022),0.02)
  return smax(d,-(p[:,1]+0.002),0.012)    # liegt auf: flache Unterseite
def hair(p,P):
  H=P.Hc; q=(p-H)@P.HR   # q: [f, cr, sd]
  d=ell(q,np.array([-0.035,0.03,0.0]),[0.13,0.15,0.135])
  d=smin(d,ell(q,np.array([-0.06,-0.08,0.0]),[0.10,0.12,0.14]),0.05)
  if not P.up: d=smin(d,ell(p,[-0.61,0.135,0.01],[0.11,0.05,0.15]),0.05)   # Locken auf den Schultern
  else: d=smin(d,ell(p,P.U([-0.62,0.15,0.0]),[0.09,0.06,0.13],P.R),0.05)
  w=np.sin(p[:,0]*23+np.sin(p[:,2]*31)*1.7)*np.sin(p[:,2]*29+np.sin(p[:,1]*37)*1.9)*np.sin(p[:,1]*27+np.sin(p[:,0]*33)*1.5)
  n=w+0.45*np.sin(p[:,0]*97+np.sin(p[:,2]*71)*2.3)*np.sin(p[:,2]*89+np.sin(p[:,1]*83)*2.1)
  d=d+n*0.008
  face=np.maximum.reduce([-(q[:,0]-0.03),np.abs(q[:,1]+0.035)-0.065,np.abs(q[:,2])-0.05])    # Gesicht frei
  return smax(d,-face,0.015)
def shell(p,P,off,x0,x1,noise=0.0):
  d=body(p,P)-off
  if noise: d=d+noise*np.sin(p[:,0]*23+np.sin(p[:,2]*9)*2)*np.sin(p[:,2]*14)
  d=smax(d,np.maximum(x0-p[:,0],p[:,0]-x1),0.01); return smax(d,-(p[:,1]-0.004),0.01)
def mesh(f,lo,hi,h,target):
  xs=[np.arange(lo[i],hi[i]+h,h) for i in range(3)]; G=np.stack(np.meshgrid(*xs,indexing='ij'),-1).reshape(-1,3)
  v=f(G).reshape(len(xs[0]),len(xs[1]),len(xs[2]))
  if v.min()>0: return None
  V,F,_,_=marching_cubes(v,0.0,spacing=(h,h,h)); V=V+np.array(lo)
  if len(F)>target: V,F=fast_simplification.simplify(V.astype(np.float32),F.astype(np.int32),1-target/len(F))
  m=trimesh.Trimesh(V,F,process=True); trimesh.smoothing.filter_taubin(m,lamb=0.5,nu=-0.53,iterations=6); return m
from scipy.ndimage import gaussian_filter
def drape(P,x0,x1,off,fold,rgb):
  # Tuch/Bademantel als Höhenfeld über der Figur: Körperoberkante + Abstand, weich geglättet (Tuch spannt über Senken), Falten, Seiten hängen über die Liegenkante
  h=0.0135; xs=np.arange(x0,x1+1e-6,h); zs=np.arange(-0.40,0.4001,h); ys=np.arange(0,0.56,0.004)
  X,Z,Y=np.meshgrid(xs,zs,ys,indexing='ij'); d=body(np.stack([X.ravel(),Y.ravel(),Z.ravel()],1),P).reshape(X.shape)
  ins=d<0; top=np.where(ins.any(2),ys[np.clip(ins.shape[2]-1-np.argmax(ins[:,:,::-1],2),0,None)],0.0)
  hb=np.maximum(top+off,0.006); hs=gaussian_filter(hb,2.6); H=np.maximum(hs,hb*0.92+off*0.1)
  XX,ZZ=np.meshgrid(xs,zs,indexing='ij')
  H=H+fold*np.sin(XX*27+np.sin(ZZ*9)*2.2)*np.clip(np.abs(ZZ)/0.25,0,1)+fold*0.6*np.sin(ZZ*40+XX*6)
  E=0.335; az=np.abs(ZZ); edge=np.interp(0,[0],[0]); Y2=H.copy(); Z2=ZZ.copy()
  side=az>E; Hedge=np.zeros_like(H)
  for i in range(len(xs)):
    for sgn in (1,-1):
      j=np.argmin(np.abs(zs-sgn*E)); m=(np.sign(zs)==sgn)&(np.abs(zs)>E); Hedge[i,m]=H[i,j]
  Y2[side]=Hedge[side]-(az[side]-E)*2.6; Z2[side]=np.sign(ZZ[side])*(E+0.012+(az[side]-E)*0.12)
  V=np.stack([XX.ravel(),Y2.ravel(),Z2.ravel()],1); nx,nz=XX.shape; F=[]
  for i in range(nx-1):
    for j in range(nz-1):
      a=i*nz+j; b=a+nz; F+= [[a,a+1,b],[b,a+1,b+1]]
  m=trimesh.Trimesh(V,np.array(F),process=False)
  if (m.face_normals[:,1].mean()<0): m.invert()
  cr=np.clip(1-5.0*np.maximum(0,gaussian_filter(H,2.0)-H).ravel(),0.86,1)
  sh=np.where(side.ravel(),0.72,1.0)
  c=np.ones((len(V),4)); c[:,:3]=np.asarray(rgb)[None,:]*(cr*sh)[:,None]; c[:,3]=0; m.visual.vertex_colors=(c*255).astype(np.uint8); return m
def ao(m,f):
  p=m.vertices; n=m.vertex_normals; a=np.zeros(len(p))
  for i,s in enumerate([0.01,0.025,0.05,0.09]): a+=(s-np.minimum(f(p+n*s),s))/s*(0.5**i)
  return np.clip(1-0.55*a,0.25,1)
def col(m,rgb,alpha,f):
  c=np.ones((len(m.vertices),4)); c[:,:3]=np.asarray(rgb)[None,:]*ao(m,f)[:,None]; c[:,3]=alpha; return c
def build(up):
  P=Pose(up); lo=[-0.98,-0.01,-0.37]; hi=[1.0,0.58 if up else 0.36,0.37]; h=0.0065
  fb=lambda q:body(q,P); fall=lambda q:np.minimum(body(q,P),hair(q,P))
  B=mesh(fb,lo,hi,h,16000); Hm=mesh(lambda q:hair(q,P),lo,hi,0.005,7000)
  # Farben Körper: Haut, Bikinihose, Lippen, Sonnenbrille (lokal am Kopf)
  v=B.vertices; skin=np.array([0.80,0.55,0.42]); c=np.tile(skin,(len(v),1)); a=np.ones(len(v))
  q=(v-P.Hc)@P.HR; gl=q[:,0]>9; (q[:,0]>0.045)&(q[:,1]>-0.005)&(q[:,1]<0.035)&(np.abs(q[:,2])<0.07); c[gl]=[0.03,0.03,0.035]; a[gl]=0
  lip=q[:,0]>9; _=(q[:,0]>0.06)&(q[:,1]>-0.072)&(q[:,1]<-0.052)&(np.abs(q[:,2])<0.024); c[lip]=[0.55,0.08,0.1]; a[lip]=0
  a=np.clip((np.linalg.norm(v-P.Hc,axis=1)-0.13)/0.06,0,1)       # Kopf nicht ölen (weicher Übergang)
  aoB=ao(B,fall); C=np.ones((len(v),4)); C[:,:3]=c*aoB[:,None]; C[:,3]=a
  B.visual.vertex_colors=(C*255).astype(np.uint8)
  Hm.visual.vertex_colors=(col(Hm,[0.95,0.70,0.40],0,fall)*255).astype(np.uint8)
  nodes={'body':B,'hair':Hm}
  nodes['towel']=drape(P,-0.085,0.37,0.016,0.004,[0.95,0.92,0.86])
  nodes['robe']=drape(P,-0.12,0.97,0.022,0.0035,[0.98,0.80,0.86])
  if not up:
    st=mesh(lambda q:shell(q,P,0.0035,-0.425,-0.40),lo,hi,h,1500); st.visual.vertex_colors=(col(st,[0.38,0.05,0.07],0,fb)*255).astype(np.uint8); nodes['strap']=st
  else:
    # Brust bedeckt: Handtuch (Adult) bzw. Bikinioberteil (jugendfrei) – Region Brustkorb-Unterseite/Front
    def chest(q,off,ext):
      d=body(q,P)-off; L=(q-PIV)@P.R  # in Ruhelage-Koordinaten
      box=np.maximum.reduce([-0.56-L[:,0],L[:,0]+0.27,L[:,1]-0.125-ext]); return smax(d,box,0.01)
    ct=mesh(lambda q:chest(q,0.014,0.0),lo,hi,h,2500); ct.visual.vertex_colors=(col(ct,[0.86,0.82,0.74],0,fb)*255).astype(np.uint8); nodes['chest']=ct
    tp=mesh(lambda q:chest(q,0.004,-0.04),lo,hi,h,2000); tp.visual.vertex_colors=(col(tp,[0.38,0.05,0.07],0,fb)*255).astype(np.uint8); nodes['top']=tp
  for k,m in nodes.items():
    _=m.vertex_normals
  sc=trimesh.Scene()
  for k,m in nodes.items(): sc.add_geometry(m,node_name=k,geom_name=k)
  fn=OUT+('kundin_up.glb' if up else 'kundin_lie.glb'); sc.export(fn); print(fn,{k:len(m.faces) for k,m in nodes.items()})
build(False); build(True)
