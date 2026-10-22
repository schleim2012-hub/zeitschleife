# Figuren-Konfiguration v4 (Beetle-Rebuild 22.10.): Pixelkoordinaten im 864x1152-Konzeptbild (fig/in/<n>.jpg)
# box=[x0,x1,y0,y1] px, piv=(px,py), depth = max. Tiefe (m) hinter der vordersten Fläche in der Box
# Konzeptbilder: eigene Entwürfe (KI), keine Schauspieler; Hunyuan3D-2mv Seeds siehe README (Seed-Auswahl aus 4–6 Läufen je Figur).
FIGS={
 'oma':    {'H':1.30,'head':{'box':[332,546,79,309],'piv':(439,315),'depth':0.30},
            'page':{'box':[279,551,411,540],'spine':405}},
 'gruen':  {'H':1.32,'head':{'box':[354,484,88,281],'piv':(419,287),'depth':0.28}},
 'brand':  {'H':1.33,'head':{'box':[349,484,68,253],'piv':(416,259),'depth':0.28},
            'arm':{'box':[180,371,203,495],'piv':(231,484),'depth':0.20,'axis':(-1,0,0)}},
 'jaeger': {'H':1.28,'head':{'box':[281,576,81,338],'piv':(430,343),'depth':0.34},
            'foot':{'box':[231,371,878,1041],'piv':(298,1029),'depth':0.40,'axis':(1,0,0),'heel':True}},
 'taucher':{'H':1.40,'inset':0.05,'head':{'box':[358,504,77,284],'piv':(428,290),'depth':0.30},
            'foot':{'box':[467,658,838,1069],'piv':(518,855),'depth':0.50,'axis':(1,0,0)}},
 'assi':   {'H':1.40,'head':{'box':[321,557,39,321],'piv':(419,326),'depth':0.32},'saw':501},
 'frl':    {'H':1.78,'head':{'box':[371,546,22,264],'piv':(450,270),'depth':0.36},
            'arm':{'box':[169,338,270,461],'piv':(321,444),'depth':0.45,'axis':(1,0,0)}},
 'decke':  {'H':1.78,'head':{'box':[354,501,45,225],'piv':(428,231),'depth':0.30}},
}
