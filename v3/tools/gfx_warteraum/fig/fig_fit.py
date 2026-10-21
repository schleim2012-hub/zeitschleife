# Passt die Frontprojektion (Mesh x,z -> Bildpixel) an das Konzeptbild an:
# Start aus grob gemessener Kopf-/Fussposition, Feinjustage per Chamfer-Abstand Silhouette<->Canny-Kanten.
# python3 fig_fit.py <in.jpg> <dec_prefix> top bottom xcenter
import sys, json, numpy as np, cv2
img, pre = sys.argv[1], sys.argv[2]; top,bot,xc=map(float,sys.argv[3:6])
I=cv2.imread(img); H,W=I.shape[:2]
g=cv2.GaussianBlur(cv2.cvtColor(I,cv2.COLOR_BGR2GRAY),(5,5),0)
E=cv2.Canny(g,30,90)
DT=np.minimum(cv2.distanceTransform(255-E,cv2.DIST_L2,3),25)
v=np.load(pre+'_v.npy'); t=np.load(pre+'_t.npy')
xmn,xmx=v[:,0].min(),v[:,0].max(); zmn,zmx=v[:,2].min(),v[:,2].max()
def sil(s,ox,oy,sx=None):
    S=np.zeros((H,W),np.uint8); sx=s if sx is None else sx
    P=np.stack([ox+sx*v[:,0], oy-s*v[:,2]],1)
    cv2.fillPoly(S,list(np.round(P[t]).astype(np.int32)),1)
    return S
def cost(p):
    S=sil(*p); c,_=cv2.findContours(S,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    pts=np.concatenate(c)[:,0]; pts=pts[(pts[:,0]>0)&(pts[:,0]<W-1)&(pts[:,1]>0)&(pts[:,1]<H-1)]
    return DT[pts[:,1],pts[:,0]].mean()
s0=(bot-top)/(zmx-zmn); p0=(s0, xc-s0*(xmn+xmx)/2, top+s0*zmx)
p0=p0+(s0,)
if len(sys.argv)>7:
    l,r=float(sys.argv[6]),float(sys.argv[7]); sxm=(r-l)/(xmx-xmn); p0=(s0,(l+r)/2-sxm*(xmn+xmx)/2,top+s0*zmx,sxm)
best=(cost(p0),p0); c0=best[0]
step=[0.02*s0,8,8,0.02*s0]
for it in range(0 if len(sys.argv)>6 else 60):
    imp=False
    for i in range(4):
        for sg in (-1,1):
            p=list(best[1]); p[i]+=sg*step[i]; q=cost(p)
            if q<best[0]: best=(q,tuple(p)); imp=True
    if not imp:
        step=[x*0.5 for x in step]
        if step[1]<0.5: break
s,ox,oy,sx=best[1]
json.dump({'s':float(s),'sx':float(sx),'ox':float(ox),'oy':float(oy),'W':W,'H':H,'cost':float(best[0])},open(pre+'_fit.json','w'))
ov=I.copy(); S=sil(s,ox,oy,sx)
cnt,_=cv2.findContours(S,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE); cv2.drawContours(ov,cnt,-1,(0,255,255),2)
cv2.imwrite(pre+'_fit.jpg',cv2.resize(ov,(W//3,H//3)))
print(pre,'chamfer %.2f -> %.2f'%(c0,best[0]), 'shift', round(ox-p0[1]),round(oy-p0[2]),'scale %.3f sx %.3f'%(s/s0,sx/s0))
