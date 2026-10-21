# Erzeugt granny.png (Häkeldecke; für build_living_props.py via LIV_TEX) + rug.png (Perserteppich) – eigene prozedurale Motive. python3 gen_living_tex.py OUTDIR
import sys, os, random, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
O=sys.argv[1] if len(sys.argv)>1 else '.'; random.seed(87)
G=Image.new('RGB',(512,512),(30,20,12)); d=ImageDraw.Draw(G)
cols=[(200,100,30),(140,90,30),(106,106,42),(216,176,96),(150,40,30),(70,90,60),(190,150,60)]
for i in range(8):
  for j in range(8):
    X,Y=i*64,j*64; cs=random.sample(cols,3); d.rectangle([X+2,Y+2,X+61,Y+61],fill=(26,18,10))
    for a,c in ((4,cs[0]),(12,cs[1]),(20,cs[2])):
      d.rectangle([X+a,Y+a,X+63-a,Y+63-a],fill=c)
      for t in range(4,60-2*a,6): d.point([(X+a+t,Y+a+1),(X+a+1,Y+a+t)],fill=(20,14,8))
    d.rectangle([X+27,Y+27,X+36,Y+36],fill=(30,20,12))
G.filter(ImageFilter.GaussianBlur(0.6)).save(os.path.join(O,'granny.png'))
W,H=1024,720; R=Image.new('RGB',(W,H),(92,30,22)); d=ImageDraw.Draw(R)
def frame(m,w,c): d.rectangle([m,m,W-1-m,H-1-m],outline=c,width=w)
frame(0,26,(40,14,10)); frame(30,6,(184,138,74)); frame(42,34,(44,58,82)); frame(80,5,(184,138,74))
def rh(x,y): d.polygon([(x,y-12),(x+12,y),(x,y+12),(x-12,y)],fill=(200,160,96)); d.polygon([(x,y-5),(x+5,y),(x,y+5),(x-5,y)],fill=(120,30,24))
for x in range(60,W-50,40): rh(x,59); rh(x,H-60)
for y in range(100,H-90,40): rh(59,y); rh(W-60,y)
for i in range(9):
  for j in range(6):
    cx=140+i*93; cy=140+j*90
    d.polygon([(cx,cy-34),(cx+40,cy),(cx,cy+34),(cx-40,cy)],outline=(30,14,10),fill=(130,40,30) if (i+j)%2 else (110,32,24))
    d.polygon([(cx,cy-18),(cx+22,cy),(cx,cy+18),(cx-22,cy)],fill=(44,58,82) if (i+j)%2 else (196,150,80)); d.rectangle([cx-4,cy-4,cx+4,cy+4],fill=(20,12,8))
cx,cy=W//2,H//2
for r,c in [(150,(40,14,10)),(140,(196,150,80)),(124,(110,32,24)),(90,(44,58,82)),(60,(196,150,80)),(30,(120,30,24))]:
  d.polygon([(cx+r*1.5*math.cos(a*math.pi/8)*(1 if a%2==0 else 0.8),cy+r*math.sin(a*math.pi/8)*(1 if a%2==0 else 0.8)) for a in range(16)],fill=c)
a=np.asarray(R.filter(ImageFilter.GaussianBlur(0.8))).astype(float); a+=np.random.normal(0,9,a.shape)
yy,xx=np.mgrid[0:H,0:W]; a*=1-0.22*np.exp(-(((xx-W*0.45)/(W*0.3))**2+((yy-H*0.65)/(H*0.25))**2))[...,None]
a*=1-0.25*np.exp(-(((xx-W*0.7)/40)**2+((yy-H*0.3)/30)**2))[...,None]
Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(os.path.join(O,'rug.png')); print('ok')
