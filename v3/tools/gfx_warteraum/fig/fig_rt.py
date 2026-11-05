import sys, numpy as np, trimesh, fast_simplification as fs
from PIL import Image
n,H,neck,top,bot=sys.argv[1],float(sys.argv[2]),float(sys.argv[3]),float(sys.argv[4]),float(sys.argv[5])   # name, height m, neck y px
F='/workspace/zeitschleife/v3/tools/gfx_warteraum/fig/'
b=np.load(F+'dec/'+n+'_v.npy'); T=np.load(F+'dec/'+n+'_t.npy'); V=np.stack([b[:,0],b[:,2],-b[:,1]],1)
im=Image.open(F+'in/'+n+'.jpg').convert('RGB'); W,Hh=im.size; a=np.asarray(im).astype(int)
bg=a[5:40,5:40].reshape(-1,3).mean(0); mask=np.abs(a-bg).sum(2)>40

# mesh: y up; front = +z or -z: pick the side whose extreme matches - assume +z front (glTF)
vx,vy,vz=V[:,0],V[:,1],V[:,2]
sy=(bot-top)/(vy.max()-vy.min()); sx=sy
px=W/2+(vx-(vx.max()+vx.min())/2)*sx; py=top+(vy.max()-vy)*sy
uv=np.stack([px/W,1-py/Hh],1)
m2=trimesh.Trimesh(V,T,process=False); nrm=m2.vertex_normals
k=H/(vy.max()-vy.min())
sh=np.clip(0.55+0.45*nrm[:,2],0.35,1.0)   # facing away (back) darker
col=(np.stack([sh,sh,sh,np.ones_like(sh)],1)*255).astype(np.uint8)
# world: metres, floor 0, centre x/z 0, front +z
cx,cz=(vx.max()+vx.min())/2,(vz.max()+vz.min())/2
P=np.stack([(vx-cx)*k,(vy-vy.min())*k,(vz-cz)*k],1)
neckY=(vy.max()-(neck-top)/sy - vy.min())*k
cm=V[T].mean(1); hx0,hx1,hy=[float(x) for x in sys.argv[6:9]]; hm=(cm[:,1]>hy)&(cm[:,2]>float(sys.argv[9]))&(cm[:,0]>hx0)&(cm[:,0]<hx1); neckY=(hy-vy.min())*k
tex=im.resize((768,1024))
def part(sel,name,piv):
    f=T[sel]; u=np.unique(f); idx=-np.ones(len(V),int); idx[u]=np.arange(len(u))
    mm=trimesh.Trimesh(P[u]-piv,idx[f],process=False)
    mm.visual=trimesh.visual.TextureVisuals(uv=uv[u],material=trimesh.visual.material.PBRMaterial(baseColorTexture=tex,roughnessFactor=1,metallicFactor=0,name='fig_'+n))
    mm.metadata['name']=name; return mm,col[u]
hp=P[np.unique(T[hm])]; piv=np.array([hp[:,0].mean(),neckY,hp[:,2].mean()])
body,cb=part(~hm,n+'_body',np.zeros(3)); head,ch=part(hm,n+'_head',piv)
sc=trimesh.Scene(); sc.add_geometry(body,node_name=n+'_body',geom_name=n+'_body')
sc.add_geometry(head,node_name=n+'_head',geom_name=n+'_head',transform=trimesh.transformations.translation_matrix(piv))
open('/workspace/wr9/nf/'+n+'.glb','wb').write(sc.export(file_type='glb'))
np.save('/workspace/wr9/nf/'+n+'_shade.npy',np.concatenate([cb,ch]))
print(n,'H',H,'faces',len(T),'head',int(hm.sum()),'piv',piv.round(3),'size',(P.max(0)-P.min(0)).round(2))
