import os, sys, numpy as np, cv2
S=os.environ['FIG_BASE_SKIN']
P=sys.argv[1]; OUT=sys.argv[2]; K=float(sys.argv[3]) if len(sys.argv)>3 else 0.8
rd=lambda f: cv2.imread(f,cv2.IMREAD_UNCHANGED).astype(np.float32)/255
base=rd(S)[...,:3]; R=base.shape[0]
g=lambda f: cv2.resize(rd(f),(R,R))
Ac,Am,Bc,Bm=[g(P+'_'+n+'.png') for n in ('Acol','Amask','Bcol','Bmask')]
Am=Am[...,:1] if Am.ndim==3 else Am[...,None]; Bm=Bm[...,:1] if Bm.ndim==3 else Bm[...,None]
Ac=Ac[...,:3]; Bc=Bc[...,:3]
W=Am+Bm; face=(Ac+Bc)/np.maximum(W,1e-4); al=np.clip(W,0,1)
al=cv2.GaussianBlur(al,(0,0),3)[...,None]*(W>0.02)
lab=lambda x: cv2.cvtColor(x,cv2.COLOR_BGR2LAB); bgr=lambda x: cv2.cvtColor(x,cv2.COLOR_LAB2BGR)
Lb,Lf=lab(base),lab(face); sel=al[...,0]>0.7
mb,sb=Lb[sel].mean(0),Lb[sel].std(0); mf,sf=Lf[sel].mean(0),Lf[sel].std(0)
print('base',mb,sb,'face',mf,sf)
# Körperhaut Richtung Foto-Hautton (K), Kontrast der Basis erhalten
tgt=(mb+(mf-mb)*np.array([0.3,K,K])).astype(np.float32); Lb2=Lb-mb+tgt
# Foto leicht entsättigen/aufhellen Richtung Ziel (Orangestich der KI-Bilder dämpfen)
Lf2=Lf.copy(); dc=((Lf[...,1]-mf[1])/sf[1])**2+((Lf[...,2]-mf[2])/sf[2])**2; w=np.exp(-dc/8)[...,None]; Lf2[...,1:]=Lf[...,1:]+(tgt[1:]-mf[1:])*w; Lf2[...,0]=Lf[...,0]-mf[0]+tgt[0]
o=bgr(Lb2)*(1-al)+bgr(Lf2)*al
cv2.imwrite(OUT,(np.clip(o,0,1)*255).astype(np.uint8)); print('OK')
# Poren-/Hautstruktur-Normalmap (prozedural, UV-Raum ~1 mm/px)
rng=np.random.default_rng(7); n=rng.standard_normal((R,R)).astype(np.float32)
Lum=cv2.cvtColor(np.clip(o,0,1).astype(np.float32),cv2.COLOR_BGR2GRAY)
h=0.55*cv2.GaussianBlur(n,(0,0),0.9)+0.45*cv2.GaussianBlur(n,(0,0),2.2)*1.6-2.0*(Lum-cv2.GaussianBlur(Lum,(0,0),6))
h=cv2.GaussianBlur(h,(0,0),0.6); S=float(sys.argv[4]) if len(sys.argv)>4 else 1.2
gx=cv2.Sobel(h,cv2.CV_32F,1,0,ksize=3)*S; gy=cv2.Sobel(h,cv2.CV_32F,0,1,ksize=3)*S
N=np.stack([-gx,gy,np.ones_like(h)],-1); N/=np.linalg.norm(N,axis=-1,keepdims=True)
nm=((N*0.5+0.5)*255).astype(np.uint8)[...,::-1]   # RGB->BGR für imwrite
cv2.imwrite(OUT.replace('.png','_n.png'),nm); print('NRM')
