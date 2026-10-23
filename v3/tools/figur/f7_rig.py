"""o20: Skelett + Skin-Gewichte (harmonisch, „bone heat light") für die Liege-Figur. Schreibt _BJ/_BW (je 4 Einflüsse) in kundin_lie_h11.glb
und das Skelett (Gelenke, Eltern, Radien, Grenzen) nach kundin_rig_h11.json.  Aufruf: python3 f7_rig.py [repo]"""
import sys,os,json,numpy as np,glbio
from scipy.sparse import coo_matrix,csr_matrix
from scipy.sparse.linalg import spsolve
from collections import deque
repo=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(__file__),'../../..'); R=lambda p:os.path.join(repo,p)
J,B=glbio.load(R('v3/assets/oase/kundin_lie_h10.glb')); pr=J['meshes'][0]['primitives'][0]; P=glbio.acc(J,B,pr['attributes']['POSITION']).astype(np.float64)
I=glbio.acc(J,B,pr['indices']).ravel().reshape(-1,3); n=len(P)
# --- verschweißen (UV-Nähte duplizieren Vertices)
key=np.round(P/2e-5).astype(np.int64); _,wi,inv=np.unique(key,axis=0,return_index=True,return_inverse=True); inv=inv.ravel(); m=len(wi); Q=P[wi]
E_=np.vstack([I[:,[0,1]],I[:,[1,2]],I[:,[2,0]]]); E_=inv[E_]; E_=E_[E_[:,0]!=E_[:,1]]; E_=np.unique(np.sort(E_,1),axis=0)
A=coo_matrix((np.ones(2*len(E_)),(np.r_[E_[:,0],E_[:,1]],np.r_[E_[:,1],E_[:,0]])),shape=(m,m)).tocsr(); A.data[:]=1
nbr=[A.indices[A.indptr[i]:A.indptr[i+1]] for i in range(m)]
def bfs(seed,ok):
  s=np.zeros(m,bool); q=deque([seed]); s[seed]=True
  while q:
    v=q.popleft()
    for u in nbr[v]:
      if not s[u] and ok[u]: s[u]=True; q.append(u)
  return s
# --- Skelett (Liegepose, lokal, m). Seite s=+1 → z>0 („R")
BN=[];
def bone(name,a,b,parent,r,kind,lim): BN.append(dict(name=name,a=list(map(float,a)),b=list(map(float,b)),parent=parent,r=r,kind=kind,lim=lim))
bone('pelvis',(0.05,0.12,0),(-0.08,0.12,0),-1,0.14,'root',[0,0])
bone('spine',(-0.08,0.12,0),(-0.30,0.14,0),0,0.13,'ball',[0.35,0.25])
bone('chest',(-0.30,0.14,0),(-0.64,0.13,0),1,0.15,'ball',[0.30,0.20])
bone('neck',(-0.64,0.13,0),(-0.735,0.15,0),2,0.06,'ball',[0.50,0.35])
bone('head',(-0.735,0.15,0),(-0.95,0.16,0),3,0.11,'ball',[0.70,0.40])
bone('jaw',(-0.822,0.172,0),(-0.752,0.24,0),4,0.05,'hinge',[0.0,0.44])
for s,sn in ((1,'R'),(-1,'L')):
  k=len(BN)
  bone('uarm'+sn,(-0.60,0.13,0.17*s),(-0.34,0.095,0.215*s),2,0.045,'ball',[1.6,0.9])
  bone('farm'+sn,(-0.34,0.095,0.215*s),(-0.12,0.075,0.24*s),k,0.035,'hinge',[0.0,2.3])
  bone('hand'+sn,(-0.12,0.075,0.24*s),(0.05,0.04,0.225*s),k+1,0.04,'ball',[0.9,0.5])
for s,sn in ((1,'R'),(-1,'L')):
  k=len(BN)
  bone('thigh'+sn,(0.03,0.12,0.09*s),(0.40,0.10,0.13*s),0,0.08,'ball',[1.4,0.6])
  bone('shin'+sn,(0.40,0.10,0.13*s),(0.74,0.12,0.155*s),k,0.055,'hinge',[0.0,2.2])
  bone('foot'+sn,(0.74,0.12,0.155*s),(0.80,0.26,0.19*s),k+1,0.05,'ball',[0.6,0.35])
nb=len(BN); ix={b['name']:i for i,b in enumerate(BN)}
def segd(X,b):
  a=np.array(b['a']); c=np.array(b['b']); d=c-a; t=np.clip(((X-a)@d)/(d@d),0,1); return np.linalg.norm(X-(a+t[:,None]*d),axis=1),((X-a)@d)/(d@d)
# --- Glied-Mengen über Zusammenhang (Arm hängt nur an der Schulter, Bein nur an der Hüfte)
sets={}
for s,sn in ((1,'R'),(-1,'L')):
  hand=np.argmin(np.linalg.norm(Q-np.array([0.04,0.04,0.225*s]),axis=1)); sets['arm'+sn]=bfs(hand,(Q[:,0]>-0.54)&(Q[:,2]*s>0.10))
  foot=np.argmin(np.linalg.norm(Q-np.array([0.79,0.2,0.18*s]),axis=1)); sets['leg'+sn]=bfs(foot,(Q[:,0]>0.10)&(Q[:,2]*s>0.0))
for k,v in sets.items(): print(k,v.sum())
assert not (sets['legR']&sets['legL']).any() and not (sets['armR']&sets['armL']).any()
allowed=np.ones((m,nb),bool)
for s in 'RL':
  for nm in ('uarm','farm','hand'): allowed[:,ix[nm+s]]=sets['arm'+s]|(Q[:,0]<-0.50)&(Q[:,2]*(1 if s=='R' else -1)>0.10)
  for nm in ('thigh','shin','foot'): allowed[:,ix[nm+s]]=sets['leg'+s]|(Q[:,0]<0.16)&(Q[:,0]>-0.10)&(Q[:,2]*(1 if s=='R' else -1)>0.0)
  allowed[sets['arm'+s]&(Q[:,0]>-0.50)]=False; allowed[np.ix_(np.where(sets['arm'+s]&(Q[:,0]>-0.50))[0],[ix[nm+s] for nm in ('uarm','farm','hand')])]=True
  allowed[sets['leg'+s]&(Q[:,0]>0.16)]=False; allowed[np.ix_(np.where(sets['leg'+s]&(Q[:,0]>0.16))[0],[ix[nm+s] for nm in ('thigh','shin','foot')])]=True
allowed[:,ix['jaw']]=False
D=np.zeros((m,nb)); T=np.zeros((m,nb))
for i,b in enumerate(BN): D[:,i],T[:,i]=segd(Q,b); D[:,i]/=b['r']
D[~allowed]=1e9
best=D.argmin(1); bd=D[np.arange(m),best]; bt=T[np.arange(m),best]
anc=(bd<1.2)&(bt>0.12)&(bt<0.88)
anc|=(bd<1.2)&(best==ix['head'])&(bt>0.12)
for nm in ('hand','foot'):
  for s in 'RL': anc|=(best==ix[nm+s])&(bt>0.2)
anc|=(best==ix['pelvis'])&(bt<0.88)
print('anchors',anc.sum(),'of',m)
# --- harmonisch lösen (uniformer Laplace) für alle Knochen gleichzeitig
L=csr_matrix((np.ones(0),(np.zeros(0,int),np.zeros(0,int))),shape=(m,m)); deg=np.asarray(A.sum(1)).ravel()
from scipy.sparse import diags
Lp=diags(deg)-A; fr=~anc; Wt=np.zeros((m,nb)); Wt[anc,best[anc]]=1
Lff=Lp[fr][:,fr].tocsc(); Lfa=Lp[fr][:,anc]
from scipy.sparse.linalg import splu
lu=splu(Lff)
for i in range(nb):
  rhs=-(Lfa@Wt[anc,i]); Wt[fr,i]=lu.solve(rhs)
Wt=np.clip(Wt,0,None)*allowed; Wt/=np.maximum(Wt.sum(1,keepdims=True),1e-9)
# --- Kiefer: harmonisch zwischen Oberlippe/Kopf (0) und Unterlippe/Kinn (1) im Kopf
hd=ix['head']; jw=ix['jaw']; x,y,z=Q[:,0],Q[:,1],Q[:,2]; az=np.abs(z)
reg=(x>-0.835)&(x<-0.69)&(y>0.12)&(az<0.075)
one=reg&(((x>-0.7745)&(x<-0.755)&(y>0.245)&(az<0.03))|((x>-0.76)&(x<-0.735)&(y>0.19)&(az<0.035)))
zero=(~reg)|((x<-0.7768)&(y>0.259))|((x<-0.79))|(y>0.275)|((x>-0.71))
zero&=~one
fr=reg&~one&~zero; print('jaw one/free',one.sum(),fr.sum())
j=np.zeros(m); j[one]=1; c=one|zero
lu=splu(Lp[fr][:,fr].tocsc()); j[fr]=lu.solve(-(Lp[fr][:,c]@j[c])); j=np.clip(j,0,1)
hw=Wt[:,hd]+Wt[:,ix['neck']]*0  # Kiefer nimmt Anteil vom Kopf (und Hals unter dem Kinn)
take=j*(Wt[:,hd]+Wt[:,ix['neck']]*(x<-0.72)); Wt[:,jw]=take; Wt[:,hd]-=np.minimum(Wt[:,hd],take); rest=take-np.minimum(Wt[:,hd]+take,take)
Wt/=np.maximum(Wt.sum(1,keepdims=True),1e-9)
# --- 4 stärkste
o=np.argsort(-Wt,1)[:,:4]; w4=np.take_along_axis(Wt,o,1); w4[w4<0.01]=0; w4/=w4.sum(1,keepdims=True)
BJ=o[inv].astype(np.float32); BW=w4[inv].astype(np.float32)
np.save('/tmp/rigW.npy',Wt[inv]); np.save('/tmp/rigJ.npy',j[inv])
def add(J,B,arr,name):
  while len(B)%4: B+=b'\0'
  off=len(B); B+=arr.astype('<f4').tobytes(); J['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':arr.nbytes})
  J['accessors'].append({'bufferView':len(J['bufferViews'])-1,'componentType':5126,'count':len(arr),'type':'VEC4'}); J['meshes'][0]['primitives'][0]['attributes'][name]=len(J['accessors'])-1; J['buffers'][0]['byteLength']=len(B)
add(J,B,BJ,'_BJ'); add(J,B,BW,'_BW'); glbio.save(R('v3/assets/oase/kundin_lie_h11.glb'),J,B)
json.dump({'bones':BN},open(R('v3/assets/oase/kundin_rig_h11.json'),'w'),indent=0)
print('ok',nb,'Knochen', os.path.getsize(R('v3/assets/oase/kundin_lie_h11.glb'))//1024,'KB')
