# v8: Nachbearbeitung warteraum.glb (nach build_room.py ausführen): Farbnaht Körper↔Kopf an der Schnittkante angleichen
# (Ausschnitt der Assistentin: Körper-Haut gelblich-hell über grünlichem Hals → zackiges V; Kragen der Oma). Die gebackenen
# Vertexfarben (Tönung × Licht) beider Seiten werden im Band um die Kopf-Unterkante zur gemeinsamen Mischfarbe der
# nächstliegenden Nachbarn gezogen (weicher Übergang über 'fade' m). Puffer-Layout bleibt gleich, kein Neu-Bake. NICHT idempotent:
# nur einmal auf ein frisch gebautes GLB anwenden (Marker im GLB-Extras verhindert Doppelanwendung).
# python3 fix_seam.py [glb]
import json,struct,sys,os,numpy as np
HERE=os.path.dirname(os.path.abspath(__file__)); GLB=sys.argv[1] if len(sys.argv)>1 else os.path.join(HERE,'../../assets/warteraum/warteraum.glb')
FIGS={'assi_body':('assi_head',0.09,0.05),'oma_body':('oma_head',0.08,0.05)}   # Kopf, fade unter/über Kopf-Unterkante
b=bytearray(open(GLB,'rb').read()); L=struct.unpack('<I',b[12:16])[0]; j=json.loads(b[20:20+L]); BO=20+L+8
if j.get('asset',{}).get('extras',{}).get('wr_seam'): print('schon angewendet'); sys.exit(0)
def view(i):
    a=j['accessors'][i]; bv=j['bufferViews'][a['bufferView']]; n={'VEC3':3,'VEC2':2}[a['type']]; assert a['componentType']==5126
    off=BO+bv.get('byteOffset',0)+a.get('byteOffset',0); return np.frombuffer(b,dtype=np.float32,count=a['count']*n,offset=off).reshape(-1,n).copy(), off
mesh={me.get('name','').split('.')[0]:me for me in j['meshes']}; node={n.get('name'):n for n in j['nodes']}
for bn,(hn,fd,fu) in FIGS.items():
    bp=mesh[bn]['primitives'][0]; hnod=node[hn]; hp=j['meshes'][hnod['mesh']]['primitives'][0]
    BP,_=view(bp['attributes']['POSITION']); BC,bco=view(bp['attributes']['COLOR_0'])
    HP,_=view(hp['attributes']['POSITION']); HC,hco=view(hp['attributes']['COLOR_0']); HW=HP+np.array(hnod.get('translation',[0,0,0]))
    y0=HW[:,1].min()
    def near(Q,R,RC,k=6):   # mittlere Farbe der k nächsten Nachbarn in R
        d=((Q[:,None,:]-R[None,:,:])**2).sum(-1); idx=np.argsort(d,axis=1)[:,:k]; return RC[idx].mean(1), np.sqrt(np.take_along_axis(d,idx[:,:1],1))[:,0]
    sb=(BP[:,1]>y0-fd)&(BP[:,1]<y0+fu); sh=(HW[:,1]<y0+fu)
    hc_at_b,db=near(BP[sb],HW[sh],HC[sh]); bc_at_h,dh=near(HW[sh],BP[sb],BC[sb])
    wb=np.clip(1-(y0-BP[sb,1])/fd,0,1)*(db<0.05); wh=np.clip(1-(HW[sh,1]-y0)/fu,0,1)*(dh<0.05)
    BC[sb]=BC[sb]*(1-0.5*wb[:,None])+0.5*wb[:,None]*hc_at_b   # beide Seiten treffen sich in der Mitte
    HC[sh]=HC[sh]*(1-0.5*wh[:,None])+0.5*wh[:,None]*bc_at_h
    b[bco:bco+BC.nbytes]=BC.astype(np.float32).tobytes(); b[hco:hco+HC.nbytes]=HC.astype(np.float32).tobytes()
    print(bn,'Körper-Vertices',int(sb.sum()),'Kopf-Vertices',int(sh.sum()),'Unterkante',round(float(y0),3))
# Marker: JSON-Chunk mit gleicher Länge neu schreiben (Padding mit Leerzeichen)
j.setdefault('asset',{}).setdefault('extras',{})['wr_seam']=1; js=json.dumps(j,separators=(',',':')).encode()
pad=(4-len(js)%4)%4; js+=b' '*pad; out=bytearray(b[:12])+struct.pack('<I',len(js))+b'JSON'+js+b[20+L:]; out[8:12]=struct.pack('<I',len(out))
open(GLB,'wb').write(out); print('ok')
