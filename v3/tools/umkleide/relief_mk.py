# u4: Foto-Tiefenrelief aus Petes Referenz (nicht im Repo): Freistellen (GrabCut) + Depth Anything v2 small (onnx) -> relief_*.webp + *_depth.png (121x181)
import onnxruntime as ort, numpy as np, cv2
im=cv2.resize(cv2.imread('../ref/relief_front_bikini.jpg'),(1024,1536),interpolation=cv2.INTER_AREA); H,W=im.shape[:2]
x=cv2.resize(im[:,:,::-1],(518,770),interpolation=cv2.INTER_CUBIC).astype(np.float32)/255
x=((x-[0.485,0.456,0.406])/[0.229,0.224,0.225]).transpose(2,0,1)[None].astype(np.float32)
s=ort.InferenceSession('/workspace/oase_b/3d/da2s.onnx',providers=['CPUExecutionProvider'])
d=cv2.resize(s.run(None,{s.get_inputs()[0].name:x})[0].squeeze(),(W,H),interpolation=cv2.INTER_CUBIC)
# Maske: GrabCut, init aus Farbabstand zum (lokal geglätteten) Hintergrund
lab=cv2.cvtColor(im,cv2.COLOR_BGR2LAB).astype(np.float32)
bg=cv2.GaussianBlur(cv2.medianBlur(im,31),(0,0),25); bgl=cv2.cvtColor(bg,cv2.COLOR_BGR2LAB).astype(np.float32)
diff=np.linalg.norm(lab-bgl,axis=2)
gc=np.full((H,W),cv2.GC_PR_BGD,np.uint8); gc[diff>28]=cv2.GC_PR_FGD; gc[diff>55]=cv2.GC_FGD
gc[:, :150]=0; gc[:, -135:]=0; gc[:9]=0; gc[1524:]=0
chro=np.hypot(lab[...,1]-128,lab[...,2]-128); R=np.zeros((H,W),bool); R[780:1440,440:620]=True; gc[R&(chro<7)&(lab[...,0]>115)]=cv2.GC_BGD
F=np.zeros((H,W),bool); F[1330:,:]=True; gc[F&(chro<11)&(lab[...,0]>170)]=cv2.GC_BGD   # weißer Boden um die Füße   # graue, unbunte Flächen (Beinlücke) sicher Hintergrund
dn=(d-np.percentile(d,5))/(np.percentile(d,99.5)-np.percentile(d,5))
bm,fm=np.zeros((1,65)),np.zeros((1,65))
cv2.grabCut(im,gc,None,bm,fm,5,cv2.GC_INIT_WITH_MASK)
m=((gc==1)|(gc==3)).astype(np.uint8)
n,l,st,_=cv2.connectedComponentsWithStats(m); k=1+np.argmax(st[1:,4]); m=(l==k).astype(np.uint8)
m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8)); mf=m[1330:].copy(); mf=cv2.morphologyEx(mf,cv2.MORPH_OPEN,np.ones((5,5),np.uint8)); m[1330:]=mf
# Löcher füllen (zwischen Beinen bleibt offen, weil mit Rand verbunden)
n2,l2,st2,_=cv2.connectedComponentsWithStats(1-m)
for i in range(1,n2):
  if st2[i,4]<1500: m[l2==i]=1   # nur kleine Löcher füllen (Beinlücke bleibt offen)
a=cv2.GaussianBlur(cv2.erode(m,np.ones((3,3),np.uint8)).astype(np.float32),(0,0),1.0)
# Grau-Halo entfernen: Randfarbe vom Inneren ausbluten
inner=cv2.erode(m,np.ones((7,7),np.uint8)); col=im.copy()
for _ in range(6):
  bl=cv2.blur(col*inner[...,None].astype(np.float32),(5,5)); w=cv2.blur(inner.astype(np.float32),(5,5))
  fill=(bl/np.maximum(w,1e-3)[...,None]).astype(np.uint8); edge=(inner==0)&(w>0.01); col[edge]=fill[edge]; inner=(inner|edge).astype(np.uint8)
cv2.imwrite('fig.png',np.dstack([col,(a*255).astype(np.uint8)]))
# Tiefe: relativ zum Maskenrand, weich, + Distanz-Wölbung, Rand auf 0
dt=cv2.distanceTransform(m,cv2.DIST_L2,5); bulge=np.sqrt(np.clip(dt/40,0,1))
edge_d=np.median(dn[(dt>0)&(dt<4)]); rel=np.clip((dn-edge_d)/max(1e-3,np.percentile(dn[m>0],98)-edge_d),0,1)
z=(0.55*rel+0.45*bulge)*np.clip(dt/12,0,1); z=cv2.GaussianBlur(z.astype(np.float32),(0,0),4)*m
z=z/max(z.max(),1e-3)
# auf Gitter 121x181 (Rand ausdehnen, damit Vertices knapp außerhalb nicht auf 0 springen)
zd=cv2.dilate(z,np.ones((9,9),np.uint8)); zz=np.where(m>0,z,zd*0.6)
cv2.imwrite('depth.png',(cv2.resize(zz,(121,181),interpolation=cv2.INTER_AREA)*255).astype(np.uint8))
ys,xs=np.where(m>0); print('bbox',xs.min(),xs.max(),ys.min(),ys.max(),'cover',m.mean())
v=im.copy(); v[m==0]=(255,0,255); cv2.imwrite('/tmp/u4_mask.jpg',cv2.resize(v,(342,512))); cv2.imwrite('/tmp/u4_depth.jpg',cv2.resize((z*255).astype(np.uint8),(342,512)))
