import numpy as np
from PIL import Image, ImageDraw, ImageFilter
W,H=4096,2048
rng=np.random.default_rng(1)
def grain(im,a=14):
    arr=np.asarray(im).astype(np.int16)+rng.normal(0,a,(H,W,1)).astype(np.int16)
    return Image.fromarray(np.clip(arr,0,255).astype(np.uint8))
# Backrooms
im=Image.new('RGB',(W,H),(196,176,92)); d=ImageDraw.Draw(im)
d.rectangle([0,0,W,H*0.36],fill=(214,206,170))
for x in range(0,W,256):
    for y in range(0,int(H*.36),180): d.rectangle([x+20,y+20,x+236,y+150],fill=(250,248,225) if (x+y)%3 else (230,226,190))
d.rectangle([0,H*0.64,W,H],fill=(150,128,62))
for x in range(0,W,40): d.line([x,H*.36,x,H*.64],fill=(180,160,80),width=3)
for k in range(8):
    cx=k*W//8+200; d.rectangle([cx,H*.38,cx+170,H*.62],fill=(90,74,40)); d.rectangle([cx+15,H*.40,cx+155,H*.62],fill=(30,24,14))
d.rectangle([2950,900,3150,1140],fill=(210,90,140)); 
for i in range(40):
    a=2960+int(rng.integers(0,170));b=910+int(rng.integers(0,210)); d.ellipse([a,b,a+18,b+18],fill=(255,220,240))
im=grain(im.filter(ImageFilter.GaussianBlur(2)),16); im.save('img/backrooms.jpg',quality=85)
# Pool 1984
y=np.linspace(0,1,H)[:,None]; top=np.array([20,5,45]); hor=np.array([255,60,170])
sky=(top+(hor-top)*np.clip(y/0.5,0,1)**2)[:,None,:].repeat(W,1)
im=Image.fromarray(sky.astype(np.uint8)); d=ImageDraw.Draw(im)
d.ellipse([1800,500,2300,1000],fill=(255,140,60))
for i in range(0,500,30): d.rectangle([1800,700+i//2,2300,700+i//2+8],fill=(255,60,170))
d.rectangle([0,1024,W,H],fill=(40,10,60))
d.rectangle([600,1150,3500,1700],fill=(0,210,220))
for i in range(1150,1700,24): d.line([600,i,3500,i+10],fill=(120,255,250),width=2)
for px in [300,1300,3000,3800]:
    d.line([px,1024,px+40,500],fill=(10,0,20),width=30)
    for a in range(-3,4): d.line([px+40,500,px+40+a*90,560+abs(a)*25],fill=(10,0,20),width=22)
for x in range(0,W,128): d.line([x,1024,W/2+(x-W/2)*3,H],fill=(255,0,200),width=2)
im=grain(im,10); im.save('img/pool1984.jpg',quality=85)
# Festival 1972
top=np.array([60,50,110]); hor=np.array([255,150,70])
sky=(top+(hor-top)*np.clip(y/0.5,0,1)**1.5)[:,None,:].repeat(W,1)
im=Image.fromarray(sky.astype(np.uint8)); d=ImageDraw.Draw(im)
d.polygon([(0,1050)]+[(x,1000-80*np.sin(x/500)) for x in range(0,W+1,64)]+[(W,1050)],fill=(60,40,50))
d.rectangle([0,1024,W,H],fill=(70,80,30))
d.ellipse([1850,1150,2250,1350],fill=(255,180,40)); d.polygon([(1900,1250),(2050,850),(2200,1250)],fill=(255,110,20))
for i in range(14):
    x=rng.integers(0,W); c=tuple(int(v) for v in rng.integers(80,255,3))
    d.ellipse([x-25,880,x+25,930],fill=(40,25,25)); d.rectangle([x-30,930,x+30,1080],fill=c)
d.rounded_rectangle([3000,860,3500,1080],40,fill=(110,190,170)); d.rectangle([3000,970,3500,1000],fill=(240,230,200))
im=grain(im.filter(ImageFilter.GaussianBlur(1.5)),14); im.save('img/festival1972.jpg',quality=85)
