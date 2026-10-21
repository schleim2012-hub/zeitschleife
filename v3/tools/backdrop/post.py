import numpy as np, sys, os
from PIL import Image
SRC='/workspace/backdrop_1021/final'; DST='/workspace/zeitschleife/v3/sky/backdrop'; os.makedirs(DST,exist_ok=True)
rng=np.random.default_rng(1989)
def grain(a,amt):
    h,w=a.shape[:2]; n=rng.normal(0,1,(h,w)).astype(np.float32)
    # körnig, nicht pixelig: leicht weichzeichnen über 2x2
    n=(n+np.roll(n,1,0)+np.roll(n,1,1)+np.roll(np.roll(n,1,0),1,1))/2.0
    l=a[...,:3].astype(np.float32)/255.0; lum=l.mean(-1,keepdims=True)
    k=amt*(0.5+0.8*np.sqrt(np.clip(lum,0,1)))  # in Mitteltönen stärker, Schwarz bleibt Schwarz
    l=np.clip(l+n[...,None]*k,0,1); out=a.copy(); out[...,:3]=(l*255+0.5).astype(np.uint8); return out
for s in sys.argv[1:]:
    far=np.array(Image.open(f'{SRC}/{s}_far_4096.png').convert('RGB')); far=grain(far,0.012)
    im=Image.fromarray(far); im.save(f'{DST}/{s}_far_4k.jpg',quality=88,optimize=True,progressive=True)
    im.resize((2048,1024),Image.LANCZOS).save(f'{DST}/{s}_far_2k.jpg',quality=86,optimize=True,progressive=True)
    mp=f'{SRC}/{s}_mid_4096.png'
    if os.path.exists(mp):
        mid=np.array(Image.open(mp).convert('RGBA')); mid=grain(mid,0.010)
        m=Image.fromarray(mid)
        m.resize((2048,1024),Image.LANCZOS).save(f'{DST}/{s}_mid_2k.png',optimize=True)
        m.save(f'{DST}/{s}_mid_4k.webp',quality=86,method=6)
    print(s,'ok')
