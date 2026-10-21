# Figuren-Konfiguration: Pixelkoordinaten im 864x1152-Konzeptbild (fig/in/<n>.jpg)
# box=[x0,x1,y0,y1] px, piv=(px,py), depth = max. Tiefe (m) hinter der vordersten Fläche in der Box
FIGS={
 'oma':    {'H':1.28,'head':{'box':[330,520,60,272],'piv':(430,276),'depth':0.30},
            'page':{'box':[325,545,495,590],'spine':435}},
 'brand':  {'H':1.30,'head':{'box':[352,492,78,268],'piv':(432,272),'depth':0.28},
            'arm':{'box':[165,385,268,500],'piv':(214,484),'depth':0.17,'axis':(-1,0,0)}},
 'jaeger': {'H':1.22,'head':{'box':[268,582,58,336],'piv':(430,340),'depth':0.34},
            'foot':{'box':[250,385,880,1062],'piv':(318,1050),'depth':0.40,'axis':(1,0,0),'heel':True}},
 'taucher':{'H':1.38,'inset':0.05,'fixred':True,'head':{'box':[348,545,38,278],'piv':(445,284),'depth':0.30},
            'foot':{'box':[505,722,895,1102],'piv':(551,905),'depth':0.55,'axis':(1,0,0)}},
 'gruen':  {'H':1.32,'head':{'box':[358,497,88,268],'piv':(427,272),'depth':0.28}},
 'assi':   {'H':1.30,'head':{'box':[312,548,58,312],'piv':(433,315),'depth':0.32},'saw':598},
 'frl':    {'H':1.36,'head':{'box':[298,562,52,372],'piv':(430,376),'depth':0.36},
            'arm':{'box':[188,348,298,590],'piv':(270,568),'depth':0.22,'axis':(1,0,0)}},
}
