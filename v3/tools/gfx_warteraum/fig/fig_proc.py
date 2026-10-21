# Blender: dezimierte Hunyuan-Figur -> Frontprojektions-UV, Verdeckung abdunkeln, bewegliche Teile abtrennen,
# in Meter skalieren (Front +Y, Boden z=0). Ergebnis: figs.blend mit Objekten <n>_body/<n>_head/<n>_arm/... (Origin = Pivot).
# blender -b -P fig_proc.py -- <decdir> <outblend>
import bpy, bmesh, sys, os, json, math, numpy as np, faulthandler; faulthandler.enable()
from mathutils import Vector as V, Matrix
sys.path.insert(0,os.path.dirname(__file__)); from fig_cfg import FIGS
a=sys.argv[sys.argv.index('--')+1:]; DEC,OUT=a[0],a[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene
def load(n):
    with bpy.data.libraries.load(DEC+'/'+n+'.blend') as (src,dst): dst.objects=['fig']
    o=dst.objects[0]; o.name=n+'_body'; o.data.name=n+'_body'; sc.collection.objects.link(o); return o
def sep(o,faces,name):
    """Faces (Indexliste) aus o in neues Objekt name verschieben."""
    bm=bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table()
    sel=set(faces)
    bm2=bm.copy(); bm2.faces.ensure_lookup_table()
    bmesh.ops.delete(bm2,geom=[f for f in bm2.faces if f.index not in sel],context='FACES')
    bmesh.ops.delete(bm,geom=[bm.faces[i] for i in sel],context='FACES')
    me=bpy.data.meshes.new(name); bm2.to_mesh(me); bm.to_mesh(o.data); bm.free(); bm2.free()
    ob=bpy.data.objects.new(name,me); sc.collection.objects.link(ob); return ob
info={}
for n,cf in FIGS.items():
    fit=json.load(open(DEC+'/'+n+'_fit.json')); s,ox,oy,W,H=fit['s'],fit['ox'],fit['oy'],fit['W'],fit['H']; sx=fit.get('sx',s)
    print('L',n,flush=True); o=load(n); me=o.data
    v=np.array([x.co[:] for x in me.vertices]); zmn,zmx=v[:,2].min(),v[:,2].max(); k=cf['H']/(zmx-zmn)
    px=ox+sx*v[:,0]; py=oy-s*v[:,2]
    # UV (Frontprojektion) + Verdeckung per Z-Buffer (kleinstes y = vorn)
    print('UV',flush=True); uv=me.uv_layers.new(name='UVMap')
    R=4; zb=np.full((H//R+1,W//R+1),1e9)
    tri=np.array([p.vertices[:] for p in me.polygons]); cen=v[tri].mean(1)
    # Rasterisieren grob: Dreiecks-Pixelbox mit Zentrumstiefe (reicht für Abdunkeln)
    P=np.stack([px,py],1)/R
    for fi,t in enumerate(tri):
        q=P[t]; x0,y0=np.floor(q.min(0)).astype(int); x1,y1=np.ceil(q.max(0)).astype(int)
        x0=max(x0,0);y0=max(y0,0);x1=min(x1,W//R);y1=min(y1,H//R)
        zz=v[t,1].min(); sl=zb[y0:y1+1,x0:x1+1]; np.minimum(sl,zz,out=sl)
    nrm=np.array([p.normal[:] for p in me.polygons])
    cpx=((ox+sx*cen[:,0])/R).astype(int).clip(0,W//R); cpy=((oy-s*cen[:,2])/R).astype(int).clip(0,H//R)
    vis=cen[:,1] <= zb[cpy,cpx]+0.035/k
    shade=np.where(vis,1.0,0.55)*np.where(nrm[:,1]>0.35,0.6,1.0)   # verdeckt / nach hinten gewandt -> dunkler
    me.color_attributes.new('Col','BYTE_COLOR','CORNER'); col=me.color_attributes['Col']; uv=me.uv_layers['UVMap']
    for p in me.polygons:
        for li in p.loop_indices:
            vi=me.loops[li].vertex_index; uv.data[li].uv=(px[vi]/W,1-py[vi]/H)
            c=shade[p.index]; col.data[li].color=(c,c,c,1)
    # Pixel -> Mesh
    def p2m(x,y): return ((x-ox)/sx,(oy-y)/s)
    def inbox(b,depth):
        x0,z1=p2m(b[0],b[2]); x1,z0=p2m(b[1],b[3])
        m=(cen[:,0]>=x0)&(cen[:,0]<=x1)&(cen[:,2]>=z0)&(cen[:,2]<=z1)
        if not m.any(): return np.zeros(0,int),0
        yf=cen[m,1].min(); m&=cen[:,1]<=yf+depth/k
        return np.where(m)[0],yf
    parts=[]
    for key in ('head','arm','foot'):
        if key not in cf: continue
        c=cf[key]; fs,yf=inbox(c['box'],c['depth'])
        mx,mz=p2m(*c['piv']); sel=v[np.unique(tri[fs])]
        my=sel[:,1].max() if c.get('heel') else sel[:,1].mean()
        if c.get('heel'): mz=max(mz,sel[:,2].min())
        parts.append((key,fs,(mx,my,mz),c.get('axis',(0,0,1))))
    # disjunkt machen (Kopf hat Vorrang)
    used=set(); clean=[]
    for key,fs,pv,ax in parts:
        fs=[f for f in fs if f not in used]; used|=set(fs); clean.append((key,fs,pv,ax))
    # Abtrennen: Indizes verschieben sich -> über Face-Attribut markieren
    lab=me.attributes.new('part','INT','FACE')
    for i,(key,fs,pv,ax) in enumerate(clean):
        for f in fs: lab.data[f].value=i+1
    if 'saw' in cf:
        zc=p2m(0,cf['saw'])[1]
        for p in me.polygons:
            if lab.data[p.index].value==0 and p.center.z<zc: lab.data[p.index].value=9
    print('SPLIT',[(c[0],len(c[1])) for c in clean],flush=True); objs={}
    def split(val,name):
        idx=[p.index for p in o.data.polygons if o.data.attributes['part'].data[p.index].value==val]
        return sep(o,idx,name) if idx else None
    for i,(key,fs,pv,ax) in enumerate(clean):
        ob=split(i+1,n+'_'+key); 
        if ob: objs[key]=(ob,pv,ax)
    legs=split(9,n+'_legs') if 'saw' in cf else None
    # Weltrahmen: 180° um Z (Front -> +Y), skalieren, Boden auf 0, Mitte x/y auf 0 (bezogen auf den ganzen Körper)
    allv=v
    cx,cy=(allv[:,0].min()+allv[:,0].max())/2,(allv[:,1].min()+allv[:,1].max())/2
    M=Matrix.Scale(k,4)@Matrix.Rotation(math.pi,4,'Z')@Matrix.Translation((-cx,-cy,-zmn))
    for ob in [o]+([legs] if legs else []):
        ob.data.transform(M)
    out={'k':k,'parts':{}}
    for key,(ob,pv,ax) in objs.items():
        pw=M@V(pv); ob.data.transform(Matrix.Translation(-pw)@M); ob.location=(0,0,0)
        axw=V(ax) if key!='head' else V((0,0,1))   # Achsen in cfg schon im Endrahmen (Front +Y)
        ob['piv']=list(pw); ob['axis']=list(axw); ob['kind']=key
        out['parts'][key]={'piv':list(pw),'axis':list(axw)}
    # Oma: neue Buchseite (Quad) über dem rechten Buchblatt
    if 'page' in cf:
        c=cf['page']; fs,yf=inbox(c['box'],0.12)
        pts=np.array([(M@V(cen[f])) [:] for f in fs])
        ctr=pts.mean(0); U,S_,Vt=np.linalg.svd(pts-ctr); nv=V(Vt[2]); 
        if nv.y<0: nv=-nv                      # Normale grob Richtung Betrachter/Gesicht
        spx,_=p2m(c['spine'],0); spine=M@V((spx,0,0)); 
        d=V((-1,0,0)); d=(d-nv*d.dot(nv)).normalized()   # Blatt läuft im Bild nach rechts = lokal -X
        kax=d.cross(nv).normalized()
        w=(c['box'][1]-c['spine'])/sx*k*0.95; h=(c['box'][3]-c['box'][2])/s*k*0.8
        sp=V((spine.x,ctr[1],ctr[2]))+nv*0.012
        vs=[V((0,0,0))-kax*h/2, V((0,0,0))+kax*h/2, d*w+kax*h/2, d*w-kax*h/2]
        pm=bpy.data.meshes.new(n+'_page'); pm.from_pydata([x[:] for x in vs],[],[(0,1,2,3),(3,2,1,0)]); pm.update()
        pu=pm.uv_layers.new(name='UVMap')
        for li,l in enumerate(pm.loops): pu.data[li].uv=[(0,0),(0,1),(1,1),(1,0)][l.vertex_index]
        pm.color_attributes.new('Col','BYTE_COLOR','CORNER'); pc=pm.color_attributes['Col']; pu=pm.uv_layers['UVMap']
        for li in range(len(pm.loops)): pc.data[li].color=(1,1,1,1)
        po=bpy.data.objects.new(n+'_page',pm); sc.collection.objects.link(po)
        po['piv']=list(sp); po['axis']=list(-kax); po['kind']='page'; out['parts']['page']={'piv':list(sp),'axis':list(-kax)}
    for ob in [x for x in sc.collection.objects if x.name.startswith(n+'_')]:
        if 'part' in ob.data.attributes: ob.data.attributes.remove(ob.data.attributes['part'])
        for p in ob.data.polygons: p.use_smooth=True
        ob['fig']=n
    tris={x.name:len(x.data.polygons) for x in sc.collection.objects if x.name.startswith(n+'_')}
    out['tris']=tris; info[n]=out; print('FIG',n,tris)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
json.dump(info,open(os.path.splitext(OUT)[0]+'.json','w'),indent=1)
print('OK')
