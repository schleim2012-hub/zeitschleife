"""o19: Torso-/Gesichts-Atlas. Schreibt _TUV (u,v,Gewicht; Draufsicht der Liegepose) in Liege- und Sitz-GLB
und backt das Atlasbild: Basis = alte Hauttextur (identisch), + feine Fotodetails (body_photo) + Foto-Warzenhof (areola).
Aufruf:  python3 f6_torso.py torso_o19.json [repo]      (Atlas + GLBs)   |   ... grid <bild>  (Gitterbild zum Punkte-Ablesen)"""
import sys,json,os,io,numpy as np,cv2,glbio
from scipy.ndimage import gaussian_filter,map_coordinates
from scipy.interpolate import RBFInterpolator
ss=lambda a,b,t: (lambda q:q*q*(3-2*q))(np.clip((t-a)/(b-a),0,1))
def body(J,B):
  pr=J['meshes'][0]['primitives'][0]; a=pr['attributes']; g=lambda i: glbio.acc(J,B,i)
  return pr,g(a['POSITION']),g(a['NORMAL']),g(a['TEXCOORD_0']),g(pr['indices']).reshape(-1,3)
def samp(img,x,y,order=1): return np.stack([map_coordinates(img[:,:,i],[y,x],order=order,mode='nearest') for i in range(img.shape[2])],-1)
def tuv(P,N,box):
  X0,X1,Z0,Z1=box; u=(P[:,0]-X0)/(X1-X0); v=(P[:,2]-Z0)/(Z1-Z0)
  w=ss(0.30,0.55,N[:,1])*ss(0.05,0.09,P[:,1])*ss(X0+0.01,X0+0.04,P[:,0])*(1-ss(X1-0.04,X1-0.01,P[:,0]))*(1-ss(0.15,0.17,np.abs(P[:,2])))
  return np.stack([u,v,w],1).astype(np.float32)
def add_attr(J,B,arr):
  while len(B)%4: B+=b'\0'
  off=len(B); B+=arr.tobytes(); J['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':arr.nbytes})
  J['accessors'].append({'bufferView':len(J['bufferViews'])-1,'componentType':5126,'count':len(arr),'type':'VEC3'})
  J['meshes'][0]['primitives'][0]['attributes']['_TUV']=len(J['accessors'])-1; J['buffers'][0]['byteLength']=len(B)
def nip_centres(P,UV,tex):
  L=cv2.cvtColor(tex,cv2.COLOR_BGR2GRAY).astype(np.float32); lum=map_coordinates(L,[UV[:,1]*L.shape[0],UV[:,0]*L.shape[1]],order=1); out={}
  for nm,sg in (('nipR',1),('nipL',-1)):
    m=(P[:,0]>-0.75)&(P[:,0]<-0.25)&(P[:,2]*sg>0.03)&(P[:,2]*sg<0.2); ai=np.where(m)[0][P[m,1].argmax()]
    c=np.where(np.linalg.norm(P-P[ai],axis=1)<0.035)[0]; c=c[np.argsort(lum[c])][:max(3,int(len(c)*0.12))]; out[nm]=P[c].mean(0)
  return out
def main(cfg,repo):
  C=json.load(open(cfg)); R=lambda p: p if p.startswith('/') else os.path.join(repo,p)
  J,B=glbio.load(R(C['glb']['lie'][0])); pr,P,N,UV,I=body(J,B)
  ti=J['materials'][pr['material']]['pbrMetallicRoughness']['baseColorTexture']['index']; bv=J['bufferViews'][J['images'][J['textures'][ti]['source']]['bufferView']]
  tex=cv2.imdecode(np.frombuffer(bytes(B[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']]),np.uint8),1)
  Nn=N/np.maximum(np.linalg.norm(N,axis=1,keepdims=True),1e-6); TU=tuv(P,Nn,C['box'])
  # --- GLBs mit _TUV (Sitzpose: gleiche Vertex-Reihenfolge, Werte aus der Liegepose)
  for k in ('lie','up'):
    j,b=glbio.load(R(C['glb'][k][0])); _,P2,_,UV2,_=body(j,b); assert len(P2)==len(P) and np.abs(UV2-UV).max()<1e-6
    add_attr(j,b,TU); glbio.save(R(C['glb'][k][1]),j,b)
  # --- Atlas rastern (Draufsicht, oberste Fläche)
  W,H=C['size']; X0,X1,Z0,Z1=C['box']; q=np.stack([TU[:,0]*W,TU[:,1]*H],1)
  Y=np.full((H,W),-1e9,np.float32); A_uv=np.zeros((H,W,2),np.float32); A_P=np.zeros((H,W,3),np.float32); A_w=np.zeros((H,W),np.float32)
  for t in I:
    if TU[t,2].max()<=0: continue
    a,b_,c=q[t]; x0,y0=np.floor(q[t].min(0)).astype(int); x1,y1=np.ceil(q[t].max(0)).astype(int); x0=max(x0,0);y0=max(y0,0);x1=min(x1,W-1);y1=min(y1,H-1)
    if x1<x0 or y1<y0: continue
    gx,gy=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5); den=(b_[1]-c[1])*(a[0]-c[0])+(c[0]-b_[0])*(a[1]-c[1])
    if abs(den)<1e-9: continue
    l1=((b_[1]-c[1])*(gx-c[0])+(c[0]-b_[0])*(gy-c[1]))/den; l2=((c[1]-a[1])*(gx-c[0])+(a[0]-c[0])*(gy-c[1]))/den; l3=1-l1-l2
    m=(l1>=-1e-3)&(l2>=-1e-3)&(l3>=-1e-3); L=np.stack([l1,l2,l3],-1); yv=L@P[t][:,1]; sub=Y[y0:y1+1,x0:x1+1]; m&=yv>sub
    if not m.any(): continue
    sub[m]=yv[m]; A_uv[y0:y1+1,x0:x1+1][m]=(L@UV[t])[m]; A_P[y0:y1+1,x0:x1+1][m]=(L@P[t])[m]; A_w[y0:y1+1,x0:x1+1][m]=(L@TU[t,2])[m]
  got=Y>-1e8
  base=samp(tex.astype(np.float32),A_uv[...,0]*tex.shape[1]-.5,A_uv[...,1]*tex.shape[0]-.5).astype(np.float32)
  lab=cv2.cvtColor(np.clip(base,0,255).astype(np.uint8),cv2.COLOR_BGR2LAB).astype(np.float32)
  # --- feine Fotodetails (Poren, Sommersprossen) aus body_photo
  bp=C.get('body_photo'); ctr=nip_centres(P,UV,tex)
  if bp:
    ph=cv2.imread(bp['image']); Hh,Wh=ph.shape[:2]
    P3={'nipR':ctr['nipR'],'nipL':ctr['nipL'],'navel':P[np.linalg.norm(UV-np.array([293,335])/768,axis=1).argmin()],'jug':[-0.67,0.177,0],'shR':[-0.63,0.16,0.185],'shL':[-0.63,0.16,-0.185]}
    ks=list(bp['pts']); X3=np.array([P3[k] for k in ks],float); x2=np.array([bp['pts'][k] for k in ks],float); best=None
    for f in range(600,4000,50):
      K=np.array([[f,0,Wh/2],[0,f,Hh/2],[0,0,1.]]); ok,rv,tv=cv2.solvePnP(X3,x2,K,None,flags=cv2.SOLVEPNP_SQPNP); pp,_=cv2.projectPoints(X3,rv,tv,K,None); e=np.linalg.norm(pp[:,0]-x2,axis=1).mean()
      if best is None or e<best[0]: best=(e,rv,tv,K,pp[:,0])
    e,rv,tv,K,pp=best; print('PnP-Fehler %.1f px'%e); tps=RBFInterpolator(pp,x2-pp,kernel='thin_plate_spline',smoothing=2.0)
    Rm,_=cv2.Rodrigues(rv); Cc=-Rm.T@tv.ravel()
    plab=cv2.cvtColor(ph,cv2.COLOR_BGR2LAB).astype(np.float32); Lm=cv2.medianBlur(plab[:,:,0].astype(np.uint8),41).astype(np.float32)
    hi=cv2.dilate(((plab[:,:,0]-Lm)>7).astype(np.uint8),np.ones((5,5),np.uint8)); de=cv2.inpaint(ph,hi*255,6,cv2.INPAINT_TELEA)   # Öl-Glanz raus (trocken)
    plab=cv2.cvtColor(de,cv2.COLOR_BGR2LAB).astype(np.float32); det=plab-np.stack([gaussian_filter(plab[:,:,i],bp['sigma']) for i in range(3)],2)
    det[...,0]=np.clip(det[...,0],*bp['clipL']); det[...,1:]=np.clip(det[...,1:],*bp['clipAB'])
    if bp.get('edge'):   # Schatten-/Konturlinien (Brust-Unterkante usw.) unterdrücken: wo der Mittel-Gradient stark ist, kein Detail
      gL=gaussian_filter(plab[...,0],4.0); gm=np.hypot(*np.gradient(gL)); ew=1-ss(bp['edge'][0],bp['edge'][1],gaussian_filter(gm,3.0)); det*=ew[...,None]
    ix=np.where(got); X=A_P[ix]; p_,_=cv2.projectPoints(X.astype(float),rv,tv,K,None); p_=p_[:,0]; p_=p_+tps(p_)
    # Sichtbarkeit grob: Normale aus Atlas-Nachbarn
    gy_,gx_=np.gradient(A_P,axis=(0,1)); nrm=np.cross(gx_,gy_); nrm/=np.maximum(np.linalg.norm(nrm,axis=2,keepdims=True),1e-9); nrm*=np.sign(nrm[...,1:2]+1e-9)
    v=Cc-X; v/=np.linalg.norm(v,axis=1,keepdims=True); cs=(v*nrm[ix]).sum(1); rx=bp['region_x']
    w=np.clip((cs-0.3)/0.3,0,1)*ss(rx[0],rx[1],X[:,0])*(1-ss(rx[2],rx[3],X[:,0]))*(p_[:,0]>2)*(p_[:,0]<Wh-3)*(p_[:,1]>2)*(p_[:,1]<Hh-3)
    D=np.zeros(lab.shape,np.float32); D[ix]=samp(det,p_[:,0],p_[:,1])*w[:,None]; lab+=D
  # --- Foto-Warzenhof in Tangentialebene um die Warzen-Mitte (rund auf der Haut, keine Draufsicht-Dehnung)
  ar=C.get('areola')
  if ar:
    ph=cv2.imread(ar['image']); cx,cy=ar['center']; r0=ar['radius_px']; S=int(r0*2.4); pc=ph[cy-S:cy+S,cx-S:cx+S].copy()
    pl=cv2.cvtColor(pc,cv2.COLOR_BGR2LAB).astype(np.float32); Lm=cv2.medianBlur(pl[:,:,0].astype(np.uint8),21).astype(np.float32)
    hi=cv2.dilate(((pl[:,:,0]-Lm)>6).astype(np.uint8),np.ones((3,3),np.uint8)); pc=cv2.inpaint(pc,hi*255,4,cv2.INPAINT_TELEA); pl=cv2.cvtColor(pc,cv2.COLOR_BGR2LAB).astype(np.float32)
    yy,xx=np.mgrid[-S:S,-S:S]; rr=np.hypot(xx,yy); ring=(rr>r0*1.45)&(rr<r0*2.1); ref=np.median(pl[ring],0); pdet=pl-ref
    for nm,mir in (('nipL',False),('nipR',True)):
      c0=ctr[nm]; d3=A_P-c0; sel=got&(np.linalg.norm(d3,axis=2)<ar['radius_m']*2.2)
      nb=np.linalg.norm(P-c0,axis=1)<0.02; nn=Nn[nb].mean(0); nn/=np.linalg.norm(nn); e1=np.array([1.,0,0])-nn*nn[0]; e1/=np.linalg.norm(e1); e2=np.cross(nn,e1)
      a1=(d3[sel]@e1)/ar['radius_m']*r0; a2=(d3[sel]@e2)/ar['radius_m']*r0
      if mir: a2=-a2
      sx,sy=S-a2,S-a1   # Bild-x ~ Körper-z, Bild-y ~ Körper-x (Kopf oben)
      r=np.hypot(a1,a2)/r0; f_=1-ss(1.25,1.6,r)
      cur=lab[sel]; ringc=np.median(cur[(r>1.5)&(r<1.9)],0) if ((r>1.5)&(r<1.9)).any() else cur.mean(0)
      clean=cur*(1-(1-ss(0.95,1.4,r))[:,None])+ringc*(1-ss(0.95,1.4,r))[:,None]   # alter gemalter Warzenpunkt weg
      lab[sel]=clean+samp(pdet,sx,sy)*(f_*ar['gain'])[:,None]
  # --- Mikrodetail (o19b): Poren + Farbvariation auf Torso/Brust, Warzenhof mit Montgomery-Knötchen, Falten, Warzen-Textur.
  #     Synthetisch im Atlas (Fotos haben am Torso nur ~1.5 px/mm), Geometrie/Größe/Lage der Warzenhöfe bleiben unverändert.
  mc=C.get('micro')
  if mc:
    rng=np.random.default_rng(mc.get('seed',7)); H_,W_=lab.shape[:2]; wA=np.clip(A_w,0,1)*got
    def band(s1,s2): n=rng.standard_normal((H_,W_)).astype(np.float32); x=gaussian_filter(n,s1)-gaussian_filter(n,s2); return x/(x.std()+1e-6)
    pores=np.zeros((H_,W_),np.float32); k=int(H_*W_*mc['pore_density']); pores[rng.integers(0,H_,k),rng.integers(0,W_,k)]=1; pores=gaussian_filter(pores,0.75)*(2*np.pi*0.75**2)
    lab[...,0]+=wA*(-mc['pore_L']*pores+mc['grain_L']*band(0.6,2.0))
    mot=band(6,30); lab[...,0]+=wA*mc['mottle_L']*mot; lab[...,1]+=wA*mc['mottle_a']*band(5,25); lab[...,2]+=wA*mc['mottle_b']*band(8,40)
    rm=ar['radius_m'] if ar else 0.02; fine=band(0.5,1.6); fine2=band(1.5,4); mid=band(1.1,3.2)
    for nm in ('nipL','nipR'):
      c0=ctr[nm]; d3=A_P-c0; sel=got&(np.linalg.norm(d3,axis=2)<rm*1.5)
      nb=np.linalg.norm(P-c0,axis=1)<0.02; nn=Nn[nb].mean(0); nn/=np.linalg.norm(nn); e1=np.array([1.,0,0])-nn*nn[0]; e1/=np.linalg.norm(e1); e2=np.cross(nn,e1)
      u=d3[sel]@e1; v=d3[sel]@e2; r=np.hypot(u,v)/rm; th=np.arctan2(v,u); mm=np.hypot(u,v)*1000
      inA=(1-ss(0.92,1.12,r)); nip=(1-ss(0.24,0.34,r))
      # Falten: konzentrisch+radial moduliertes Rauschen (in Polarkoordinaten, mm-Skala)
      def pn(f1,f2,ph): return np.sin(mm*f1+np.sin(th*f2+ph)*1.7)*np.sin(th*(f2+3)+mm*0.4+ph)
      wr=0.45*pn(2.6,9,rng.uniform(0,6))+0.25*pn(4.1,17,rng.uniform(0,6))+0.8*mid[sel]+0.25*fine[sel]
      dL=inA*(mc['areola_wrinkle_L']*wr*(1-nip)+mc['nip_wrinkle_L']*nip*(0.6*fine[sel]+0.4*np.sin(th*11+fine2[sel]*2.5+mm*1.5)))
      # Montgomery-Knötchen: 8–14 kleine Erhebungen am äußeren Hof (r 0.6–0.95), heller Kopf + dunkler Saum
      nb_=rng.integers(10,17); 
      for _ in range(nb_):
        rr_=rng.uniform(0.62,0.9)*rm*1000; tt=rng.uniform(-np.pi,np.pi); sz=rng.uniform(1.0,1.6)
        bu=np.cos(tt)*rr_; bv=np.sin(tt)*rr_; dd=np.hypot(u*1000-bu,v*1000-bv)/sz
        dL+=mc['bump_L']*(np.exp(-dd**2*1.2)-0.55*np.exp(-(dd-1.3)**2*3.0)); 
      # natürliche Farbvariation im Hof (fleckig, Rand weicher/heller)
      cv=np.sin(th*3+rng.uniform(0,6))*0.5+np.sin(mm*0.9+th*2)*0.5
      cur=lab[sel]; cur[:,0]+=dL; cur[:,1]+=inA*mc['areola_col_a']*cv; cur[:,2]+=inA*mc['areola_col_b']*cv*0.6; lab[sel]=cur
  # --- Hautton leicht Richtung Foto (überall gleich → keine Naht; Shader nutzt dieselbe Verschiebung nicht)
  sh=C.get('tan_shift_ab',[0,0]); lab[...,1]+=sh[0]; lab[...,2]+=sh[1]
  out=cv2.cvtColor(np.clip(lab,0,255).astype(np.uint8),cv2.COLOR_LAB2BGR)
  # Rand nach außen auffüllen (Mip-Bluten verhindern)
  msk=(~got).astype(np.uint8)*255; out=cv2.inpaint(out,msk,3,cv2.INPAINT_TELEA) if msk.any() else out
  cv2.imwrite('/tmp/atlas_dbg.png',out); cv2.imwrite(R(C['atlas']),out,[cv2.IMWRITE_WEBP_QUALITY,C.get('quality',88)])
  np.save('/tmp/atlas_w.npy',A_w); print('Atlas',R(C['atlas']),os.path.getsize(R(C['atlas']))//1024,'KB')
  # Hinweis: die Haupt-Hauttextur der h10-GLBs ist die h9-Textur (unverändert); tan_shift dort nicht angewandt.
def grid(img):
  im=cv2.imread(img)
  for x in range(0,im.shape[1],50): cv2.line(im,(x,0),(x,im.shape[0]),(0,255,0) if x%100 else (255,0,255),1); cv2.putText(im,str(x),(x+2,12),0,0.35,(0,255,0))
  for y in range(0,im.shape[0],50): cv2.line(im,(0,y),(im.shape[1],y),(0,255,0) if y%100 else (255,0,255),1); cv2.putText(im,str(y),(2,y+12),0,0.35,(0,255,0))
  cv2.imwrite('/tmp/grid.jpg',im); print('/tmp/grid.jpg')
if __name__=='__main__':
  if sys.argv[1]=='grid': grid(sys.argv[2])
  else: main(sys.argv[1],sys.argv[2] if len(sys.argv)>2 else '/workspace/zs_hyb')
