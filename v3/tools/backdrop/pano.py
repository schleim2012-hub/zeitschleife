# Rewind backdrops: blender -b -P pano.py -- SCENE W SAMPLES OUTDIR LAYER(far|mid)
import bpy, math, random, sys, os, time
A=sys.argv[sys.argv.index('--')+1:]; SCN,W,SPP,OUT,LAYER=A[0],int(A[1]),int(A[2]),A[3],A[4]
os.makedirs(OUT,exist_ok=True); t0=time.time(); random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True); sc=bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=SPP; sc.cycles.use_denoising=True
try: sc.cycles.denoiser='OPENIMAGEDENOISE'
except: pass
sc.cycles.max_bounces=3; sc.cycles.diffuse_bounces=2; sc.cycles.glossy_bounces=1; sc.cycles.transmission_bounces=1; sc.cycles.volume_bounces=0
sc.cycles.use_adaptive_sampling=True; sc.cycles.adaptive_threshold=0.03
sc.render.threads_mode='FIXED'; sc.render.threads=8
sc.render.resolution_x=W; sc.render.resolution_y=W//2; sc.render.resolution_percentage=100
sc.view_settings.view_transform='AgX'; sc.view_settings.exposure=0.0
vl=sc.view_layers[0]; vl.use_pass_mist=True
MID=bpy.data.collections.new('MID'); sc.collection.children.link(MID)
FAR=bpy.data.collections.new('FAR'); sc.collection.children.link(FAR)

def N(nt,t,**kw):
    n=nt.nodes.new(t)
    for k,v in kw.items(): setattr(n,k,v)
    return n
def mathn(nt,op,a,b=None,clamp=False):
    n=nt.nodes.new('ShaderNodeMath'); n.operation=op; n.use_clamp=clamp
    for i,x in enumerate([a,b]):
        if x is None: continue
        if isinstance(x,(int,float)): n.inputs[i].default_value=x
        else: nt.links.new(x,n.inputs[i])
    return n.outputs[0]
def principled(name,col,rough=0.8,metal=0.0,emit=None,es=0.0):
    m=bpy.data.materials.new(name); m.use_nodes=True; p=m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value=(*col,1); p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metal
    if emit: p.inputs['Emission Color'].default_value=(*emit,1); p.inputs['Emission Strength'].default_value=es
    return m
def emitmat(name,col,s):
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    o=nt.nodes.new('ShaderNodeOutputMaterial'); e=nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value=(*col,1); e.inputs[1].default_value=s; nt.links.new(e.outputs[0],o.inputs[0]); return m
def noise_rough(m,lo,hi,scale=0.4):
    nt=m.node_tree; p=nt.nodes['Principled BSDF']; tc=N(nt,'ShaderNodeTexCoord'); nz=N(nt,'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=scale; nz.inputs['Detail'].default_value=6
    nt.links.new(tc.outputs['Object'],nz.inputs['Vector']); mr=N(nt,'ShaderNodeMapRange'); mr.inputs[3].default_value=lo; mr.inputs[4].default_value=hi; mr.inputs[1].default_value=0.35; mr.inputs[2].default_value=0.65
    nt.links.new(nz.outputs['Fac'],mr.inputs[0]); nt.links.new(mr.outputs[0],p.inputs['Roughness'])
    # Farb-Variation (Grunge)
    mx=N(nt,'ShaderNodeMix'); mx.data_type='RGBA'; mx.blend_type='MULTIPLY'; mx.inputs[0].default_value=0.35
    nz2=N(nt,'ShaderNodeTexNoise'); nz2.inputs['Scale'].default_value=scale*3; nz2.inputs['Detail'].default_value=8; nt.links.new(tc.outputs['Object'],nz2.inputs['Vector'])
    mx.inputs[6].default_value=p.inputs['Base Color'].default_value; nt.links.new(nz2.outputs['Fac'],mx.inputs[7]); nt.links.new(mx.outputs[2],p.inputs['Base Color'])
    return m

def facade(name,base,lit_frac,pal,sx=2.4,sz=2.8,es=6.0,wx=(0.2,0.8),wz=(0.3,0.78),panel=True):
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; p=nt.nodes['Principled BSDF']
    tc=N(nt,'ShaderNodeTexCoord'); sp=N(nt,'ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'],sp.inputs[0])
    oi=N(nt,'ShaderNodeObjectInfo'); geo=N(nt,'ShaderNodeNewGeometry'); sn=N(nt,'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Normal'],sn.inputs[0])
    wall=mathn(nt,'SUBTRACT',1.0,mathn(nt,'ABSOLUTE',sn.outputs[2]))  # 1 an Wänden, 0 auf Dach
    wall=mathn(nt,'GREATER_THAN',wall,0.5)
    u=mathn(nt,'ADD',sp.outputs[0],sp.outputs[1]); v=sp.outputs[2]
    cu=mathn(nt,'DIVIDE',u,sx); cv=mathn(nt,'DIVIDE',v,sz)
    fu=mathn(nt,'FRACT',cu); fv=mathn(nt,'FRACT',cv)
    mk=mathn(nt,'MULTIPLY',mathn(nt,'GREATER_THAN',fu,wx[0]),mathn(nt,'LESS_THAN',fu,wx[1]))
    mk=mathn(nt,'MULTIPLY',mk,mathn(nt,'MULTIPLY',mathn(nt,'GREATER_THAN',fv,wz[0]),mathn(nt,'LESS_THAN',fv,wz[1])))
    mk=mathn(nt,'MULTIPLY',mk,wall)
    # Erdgeschoss (unterste Reihe) unbeleuchtet/geschlossen
    mk=mathn(nt,'MULTIPLY',mk,mathn(nt,'GREATER_THAN',v,sz*0.9))
    cxyz=N(nt,'ShaderNodeCombineXYZ'); nt.links.new(mathn(nt,'FLOOR',cu),cxyz.inputs[0]); nt.links.new(mathn(nt,'FLOOR',cv),cxyz.inputs[1]); nt.links.new(mathn(nt,'MULTIPLY',oi.outputs['Random'],97.0),cxyz.inputs[2])
    wn=N(nt,'ShaderNodeTexWhiteNoise'); wn.noise_dimensions='3D'; nt.links.new(cxyz.outputs[0],wn.inputs['Vector'])
    lit=mathn(nt,'MULTIPLY',mathn(nt,'GREATER_THAN',wn.outputs['Value'],1.0-lit_frac),mk)
    # Farbe pro Fenster
    cxyz2=N(nt,'ShaderNodeVectorMath'); cxyz2.operation='ADD'; nt.links.new(cxyz.outputs[0],cxyz2.inputs[0]); cxyz2.inputs[1].default_value=(13.1,7.7,3.3)
    wn2=N(nt,'ShaderNodeTexWhiteNoise'); wn2.noise_dimensions='3D'; nt.links.new(cxyz2.outputs[0],wn2.inputs['Vector'])
    cr=N(nt,'ShaderNodeValToRGB'); cr.color_ramp.interpolation='CONSTANT'; el=cr.color_ramp.elements
    for i,(pos,c) in enumerate(pal):
        if i<2: el[i].position=pos; el[i].color=(*c,1)
        else: e=el.new(pos); e.color=(*c,1)
    nt.links.new(wn2.outputs['Value'],cr.inputs[0])
    # Intensität: Vorhang-Variation innerhalb des Fensters (vertikaler Verlauf)
    inten=mathn(nt,'MULTIPLY',lit,mathn(nt,'ADD',0.35,mathn(nt,'MULTIPLY',wn2.outputs['Value'],1.0)))
    # Innenraum-Anmutung: Deckenlicht-Verlauf (oben heller) + bei ~45% Jalousie-/Gardinenstreifen
    fvn=mathn(nt,'DIVIDE',mathn(nt,'SUBTRACT',fv,wz[0]),wz[1]-wz[0])
    inten=mathn(nt,'MULTIPLY',inten,mathn(nt,'ADD',0.35,mathn(nt,'MULTIPLY',fvn,0.9)))
    stripe=mathn(nt,'LESS_THAN',mathn(nt,'FRACT',mathn(nt,'MULTIPLY',fvn,9.0)),0.55)
    hasbl=mathn(nt,'GREATER_THAN',mathn(nt,'FRACT',mathn(nt,'MULTIPLY',wn2.outputs['Value'],7.31)),0.55)
    inten=mathn(nt,'MULTIPLY',inten,mathn(nt,'SUBTRACT',1.0,mathn(nt,'MULTIPLY',hasbl,mathn(nt,'MULTIPLY',stripe,0.6))))
    # Fensterkreuz (senkrechte Sprosse in der Mitte)
    fun=mathn(nt,'DIVIDE',mathn(nt,'SUBTRACT',fu,wx[0]),wx[1]-wx[0])
    inten=mathn(nt,'MULTIPLY',inten,mathn(nt,'GREATER_THAN',mathn(nt,'ABSOLUTE',mathn(nt,'SUBTRACT',fun,0.5)),0.035))
    p.inputs['Emission Strength'].default_value=es
    em=N(nt,'ShaderNodeMix'); em.data_type='RGBA'; em.blend_type='MULTIPLY'; em.inputs[0].default_value=1.0
    nt.links.new(cr.outputs[0],em.inputs[6]); gi=N(nt,'ShaderNodeCombineColor'); nt.links.new(inten,gi.inputs[0]); nt.links.new(inten,gi.inputs[1]); nt.links.new(inten,gi.inputs[2]); nt.links.new(gi.outputs[0],em.inputs[7])
    nt.links.new(em.outputs[2],p.inputs['Emission Color'])
    # Basis: Beton mit Fugen + Schmutz; Fenster dunkel glänzend
    nz=N(nt,'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=0.35; nz.inputs['Detail'].default_value=8; nt.links.new(tc.outputs['Object'],nz.inputs['Vector'])
    dirt=N(nt,'ShaderNodeMapRange'); dirt.inputs[1].default_value=0.3; dirt.inputs[2].default_value=0.7; dirt.inputs[3].default_value=0.55; dirt.inputs[4].default_value=1.15; nt.links.new(nz.outputs['Fac'],dirt.inputs[0])
    # Regenstreifen: vertikal gestreckter Noise
    mp=N(nt,'ShaderNodeMapping'); mp.inputs['Scale'].default_value=(3.0,3.0,0.08); nt.links.new(tc.outputs['Object'],mp.inputs['Vector'])
    nz3=N(nt,'ShaderNodeTexNoise'); nz3.inputs['Scale'].default_value=1.2; nt.links.new(mp.outputs[0],nz3.inputs['Vector'])
    streak=N(nt,'ShaderNodeMapRange'); streak.inputs[1].default_value=0.4; streak.inputs[2].default_value=0.65; streak.inputs[3].default_value=1.0; streak.inputs[4].default_value=0.6; nt.links.new(nz3.outputs['Fac'],streak.inputs[0])
    fac=mathn(nt,'MULTIPLY',dirt.outputs[0],streak.outputs[0])
    if panel:  # Plattenfugen
        pu=mathn(nt,'FRACT',mathn(nt,'DIVIDE',u,sx*2)); pv=mathn(nt,'FRACT',cv)
        seam=mathn(nt,'MAXIMUM',mathn(nt,'LESS_THAN',pu,0.012),mathn(nt,'LESS_THAN',pv,0.02))
        fac=mathn(nt,'MULTIPLY',fac,mathn(nt,'SUBTRACT',1.0,mathn(nt,'MULTIPLY',seam,0.5)))
    bc=N(nt,'ShaderNodeCombineColor')
    for i in range(3): nt.links.new(mathn(nt,'MULTIPLY',fac,base[i]),bc.inputs[i])
    glass=N(nt,'ShaderNodeMix'); glass.data_type='RGBA'; nt.links.new(mk,glass.inputs[0]); nt.links.new(bc.outputs[0],glass.inputs[6]); glass.inputs[7].default_value=(0.012,0.013,0.016,1)
    nt.links.new(glass.outputs[2],p.inputs['Base Color'])
    rg=N(nt,'ShaderNodeMix'); rg.data_type='FLOAT'; nt.links.new(mk,rg.inputs[0]); rg.inputs[2].default_value=0.85; rg.inputs[3].default_value=0.08; nt.links.new(rg.outputs[0],p.inputs['Roughness'])
    return m

def box(name,c,s,mat,coll=FAR,rz=0.0,bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=c,rotation=(0,0,rz)); o=bpy.context.object; o.name=name; o.scale=s
    bpy.ops.object.transform_apply(location=True,rotation=False,scale=True)
    if bevel>0:
        b=o.modifiers.new('b','BEVEL'); b.width=bevel; b.segments=3
    o.data.materials.append(mat)
    for cl in o.users_collection: cl.objects.unlink(o)
    coll.objects.link(o); return o
def cyl(name,c,r,h,mat,coll=FAR,v=16,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=h,location=c,rotation=rot); o=bpy.context.object; o.name=name; o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    for cl in o.users_collection: cl.objects.unlink(o)
    coll.objects.link(o); return o
def sph(name,c,r,mat,coll=FAR,seg=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=seg//2,radius=r,location=c); o=bpy.context.object; o.name=name; o.data.materials.append(mat); bpy.ops.object.shade_smooth()
    for cl in o.users_collection: cl.objects.unlink(o)
    coll.objects.link(o); return o
def plight(name,loc,W_,col,r=0.2,coll=FAR,kind='POINT',rot=None,spot=None):
    L=bpy.data.lights.new(name,kind); L.energy=W_; L.color=col; L.shadow_soft_size=r
    if spot: L.spot_size=spot; L.spot_blend=0.6
    o=bpy.data.objects.new(name,L); o.location=loc
    if rot: o.rotation_euler=rot
    coll.objects.link(o); return o

def world_sky(hor,zen,glow_h=0.08,clouds=0.0,band=None):
    w=bpy.data.worlds.new('W'); sc.world=w; w.use_nodes=True; nt=w.node_tree; bg=nt.nodes['Background']
    tc=N(nt,'ShaderNodeTexCoord'); sp=N(nt,'ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Generated'],sp.inputs[0])
    z=mathn(nt,'MAXIMUM',sp.outputs[2],0.0)
    g=mathn(nt,'POWER',mathn(nt,'DIVIDE',z,glow_h+1e-4),0.5)
    g=mathn(nt,'MINIMUM',g,1.0)
    mx=N(nt,'ShaderNodeMix'); mx.data_type='RGBA'; nt.links.new(g,mx.inputs[0]); mx.inputs[6].default_value=(*hor,1); mx.inputs[7].default_value=(*zen,1)
    col=mx.outputs[2]
    if band:  # (Farbe, Höhe, Breite, Azimut-Gewicht)
        bc,bh,bw=band
        d=mathn(nt,'ABSOLUTE',mathn(nt,'SUBTRACT',z,bh)); bf=mathn(nt,'SUBTRACT',1.0,mathn(nt,'DIVIDE',d,bw),); bf=mathn(nt,'MAXIMUM',bf,0.0)
        # stärker Richtung +Y (Sonne)
        az=mathn(nt,'MAXIMUM',mathn(nt,'ADD',mathn(nt,'MULTIPLY',sp.outputs[1],0.6),0.4),0.0)
        bf=mathn(nt,'MULTIPLY',mathn(nt,'POWER',bf,2.0),az)
        m2=N(nt,'ShaderNodeMix'); m2.data_type='RGBA'; m2.blend_type='ADD'; nt.links.new(bf,m2.inputs[0]); nt.links.new(col,m2.inputs[6]); m2.inputs[7].default_value=(*bc,1); col=m2.outputs[2]
    if clouds>0:
        mp=N(nt,'ShaderNodeMapping'); mp.inputs['Scale'].default_value=(1.0,1.0,4.0); nt.links.new(tc.outputs['Generated'],mp.inputs['Vector'])
        nz=N(nt,'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=2.5; nz.inputs['Detail'].default_value=10; nz.inputs['Roughness'].default_value=0.6; nt.links.new(mp.outputs[0],nz.inputs['Vector'])
        cr=N(nt,'ShaderNodeMapRange'); cr.inputs[1].default_value=0.45; cr.inputs[2].default_value=0.75; cr.inputs[3].default_value=1.0-clouds; cr.inputs[4].default_value=1.0+clouds*0.6; nt.links.new(nz.outputs['Fac'],cr.inputs[0])
        m3=N(nt,'ShaderNodeMix'); m3.data_type='RGBA'; m3.blend_type='MULTIPLY'; m3.inputs[0].default_value=1.0; nt.links.new(col,m3.inputs[6]); g3=N(nt,'ShaderNodeCombineColor')
        for i in range(3): nt.links.new(cr.outputs[0],g3.inputs[i])
        nt.links.new(g3.outputs[0],m3.inputs[7]); col=m3.outputs[2]
    nt.links.new(col,bg.inputs[0]); bg.inputs[1].default_value=1.0
    return w

def ground(mat,size=6000):
    bpy.ops.mesh.primitive_plane_add(size=size,location=(0,0,0)); o=bpy.context.object; o.data.materials.append(mat)
    for cl in o.users_collection: cl.objects.unlink(o)
    FAR.objects.link(o); return o

CAMH=6.0; FOG=(0.02,0.02,0.03); FOGAMT=0.8; MIST=(5,600,'QUADRATIC'); GLARE=(1.0,8)
# ---------------------------------------------------------------- Szenen
if SCN=='berlin89':
    CAMH=7.0; FOG=(0.06,0.042,0.032); FOGAMT=0.85; MIST=(8,900,'QUADRATIC')
    world_sky((0.075,0.048,0.030),(0.006,0.0065,0.010),glow_h=0.22,clouds=0.55)
    asph=noise_rough(principled('asphalt',(0.04,0.04,0.042),0.5),0.22,0.75,0.9); ground(asph)
    walk=noise_rough(principled('pflaster',(0.07,0.068,0.064),0.7),0.3,0.85,0.6)
    box('gehweg_n',(0,6.5,0.08),(600,5,0.16),walk); box('gehweg_s',(0,27.5,0.08),(600,5,0.16),walk)
    grass=noise_rough(principled('rasen',(0.02,0.03,0.015),0.9),0.8,1.0,0.3)
    box('rasen',(0,40,0.03),(600,15,0.06),grass)
    pal_ddr=[(0.0,(1.0,0.62,0.28)),(0.45,(1.0,0.75,0.42)),(0.7,(0.95,0.85,0.6)),(0.88,(0.45,0.6,1.0))]  # Glühbirne + TV-Blau
    fac_ddr=lambda n,f: facade(n,(0.30,0.29,0.27),f,pal_ddr,sx=2.4,sz=2.8,es=5.0)
    # Gegenüberliegender Block (WBS 70, 11 Geschosse) links vorne
    nb=box('platte_gegenueber',(-55,52,16.5),(90,12,33),fac_ddr('fac0',0.10))
    for i in range(10):  # Balkonbänder (Loggien-Kanten) – Detail
        box(f'balk{i}',(-55,45.7,2.8*(i+1)+0.1),(90,0.6,0.18),principled('balk',(0.22,0.21,0.2),0.9))
    box('dach0',(-70,52,33.8),(6,5,1.6),principled('dachaufbau',(0.12,0.12,0.12),0.9))
    # Weitere Plattenbauten im Ring
    for k in range(70):
        a=random.uniform(0,2*math.pi); d=random.uniform(110,700)
        x,y=d*math.sin(a),d*math.cos(a)
        if abs(math.atan2(x,y)-0.55)<0.35 and d<300: continue   # Blickschneise zur Mauer frei
        if -110<x<10 and 20<y<80: continue
        h=2.8*random.choice([5,6,11,11,16,18]); L=random.uniform(40,140)
        o=box(f'pb{k}',(x,y,h/2),(L,12,h),fac_ddr(f'f{k}',random.uniform(0.04,0.12)),rz=random.choice([0,math.pi/2])+random.uniform(-0.15,0.15)+a)
        box(f'pbd{k}',(x+random.uniform(-L/3,L/3)*0,y,h+0.8),(5,4,1.6),principled('d',(0.1,0.1,0.1),0.9),rz=a)
    # Die Mauer: diagonal rechts vorne, Grenzstreifen mit Flutlicht
    concrete=noise_rough(principled('mauer',(0.38,0.37,0.35),0.85),0.7,0.95,1.5)
    sand=noise_rough(principled('sand',(0.28,0.25,0.2),0.95),0.85,1.0,2.0)
    ang=0.55; ux,uy=math.cos(ang),-math.sin(ang)  # Richtung der Mauerlinie
    for side,off,hgt in [('vorder',62,3.6),('hinter',100,3.2)]:
        cx,cy=off*math.sin(ang),off*math.cos(ang)
        for s in range(-90,91):
            t=s*1.2; px,py=cx+ux*t,cy+uy*t
            box(f'm{side}{s}',(px,py,hgt/2),(1.18,0.25,hgt),concrete,rz=-ang)
            if side=='vorder': cyl(f'rohr{s}',(px,py,hgt+0.25),0.32,1.2,concrete,rot=(0,math.pi/2,-ang),v=10)
    for s in range(-6,7):
        t=s*18; cx,cy=81*math.sin(ang)+ux*t,81*math.cos(ang)+uy*t
        box(f'strip{s}',(cx,cy,0.02),(18,40,0.04),sand,rz=-ang)
    pole=principled('mast',(0.12,0.12,0.13),0.6,0.5)
    flood=emitmat('flut',(0.85,0.92,1.0),40)
    for s in range(-6,7):
        t=s*30; px,py=88*math.sin(ang)+ux*t,88*math.cos(ang)+uy*t
        cyl(f'fp{s}',(px,py,6),0.18,12,pole,v=8)
        box(f'fh{s}',(px,py,12.2),(1.2,0.5,0.5),flood,rz=-ang)
        plight(f'fl{s}',(px,py,11.5),9000,(0.82,0.9,1.0),r=0.4,kind='SPOT',spot=math.radians(130))
    # Wachturm BT-11
    tx,ty=85*math.sin(ang)+ux*-40,85*math.cos(ang)+uy*-40
    cyl('turm',(tx,ty,5.5),1.1,11,concrete,v=4)
    box('kanzel',(tx,ty,12.3),(3.2,3.2,2.4),principled('kanz',(0.3,0.3,0.29),0.85),rz=math.pi/4)
    box('kanzelfenster',(tx,ty,12.5),(3.25,3.25,0.9),emitmat('kf',(1.0,0.8,0.5),3),rz=math.pi/4)
    sl=plight('suchscheinwerfer',(tx,ty,14.2),20000,(0.9,0.95,1.0),r=0.1,kind='SPOT',rot=(math.radians(70),0,math.radians(200)),spot=math.radians(6))
    box('sw',(tx,ty,14.0),(0.6,0.6,0.5),emitmat('swe',(1,1,1),60))
    # Fernsehturm in der Ferne
    tvx,tvy=-900,1400
    cyl('tv_schaft',(tvx,tvy,125),6,250,concrete,v=24)
    sph('tv_kugel',(tvx,tvy,212),16,fac_ddr('tvk',0.0),seg=32)
    ring=emitmat('tvring',(1.0,0.85,0.6),6)
    cyl('tv_ring',(tvx,tvy,208),16.3,2.2,ring,v=48)
    cyl('tv_ant',(tvx,tvy,300),1.2,120,principled('ant',(0.5,0.1,0.1),0.6),v=8)
    red=emitmat('rot',(1.0,0.05,0.02),80)
    for zz in (250,280,320,358): sph(f'tvr{zz}',(tvx,tvy,zz),1.5,red,seg=8)
    # Straßenlaternen (Mittel-Ebene) – Natriumdampf
    na=emitmat('natrium',(1.0,0.5,0.14),14)
    for row,yy,arm in [('n',9.6,1),('s',25.4,-1)]:
        for i in range(-5,6):
            x=i*24+(12 if row=='s' else 0)
            cyl(f'lp{row}{i}',(x,yy,4.5),0.09,9,pole,coll=MID,v=8)
            box(f'la{row}{i}',(x,yy+arm*0.8,9.0),(0.12,1.6,0.1),pole,coll=MID)
            box(f'lk{row}{i}',(x,yy+arm*1.6,8.95),(0.35,0.7,0.18),principled('kopf',(0.08,0.08,0.08),0.5),coll=MID)
            box(f'lg{row}{i}',(x,yy+arm*1.6,8.85),(0.3,0.62,0.04),na,coll=MID)
            plight(f'L{row}{i}',(x,yy+arm*1.6,8.6),650,(1.0,0.58,0.22),r=0.25,coll=MID)
    # Trabis + Wartburg am Straßenrand (Mittel-Ebene)
    carc=[(0.25,0.27,0.2),(0.42,0.38,0.3),(0.12,0.16,0.22),(0.35,0.12,0.08)]
    glass=principled('glas',(0.01,0.01,0.012),0.08)
    for i,(x,yy) in enumerate([]):  # Autos entfernt (Kistenlook)
        c=principled(f'lack{i}',carc[i%4],0.35)
        box(f'car{i}',(x,yy,0.55),(3.55,1.5,0.6),c,coll=MID,bevel=0.12)
        box(f'cab{i}',(x-0.2,yy,1.1),(1.9,1.38,0.55),glass,coll=MID,bevel=0.08)
        box(f'cabr{i}',(x-0.2,yy,1.38),(1.8,1.3,0.06),c,coll=MID,bevel=0.03)
        for dx in (-1.15,1.15):
            for dy in (-0.68,0.68): cyl(f'w{i}{dx}{dy}',(x+dx,yy+dy,0.29),0.29,0.16,principled('reifen',(0.02,0.02,0.02),0.7),coll=MID,v=12,rot=(math.pi/2,0,0))
    GLARE=(1.2,8)
elif SCN=='city2041':
    CAMH=48.0; FOG=(0.07,0.045,0.035); FOGAMT=0.92; MIST=(20,2200,'QUADRATIC')
    world_sky((0.085,0.05,0.036),(0.005,0.006,0.011),glow_h=0.25,clouds=0.6)
    gm=noise_rough(principled('boden',(0.03,0.03,0.032),0.4),0.1,0.6,0.05); nt=gm.node_tree; p=nt.nodes['Principled BSDF']
    tc=N(nt,'ShaderNodeTexCoord'); sp=N(nt,'ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'],sp.inputs[0])
    lx=mathn(nt,'LESS_THAN',mathn(nt,'FRACT',mathn(nt,'DIVIDE',mathn(nt,'ADD',sp.outputs[0],40.0),85.0)),0.022); ly=mathn(nt,'LESS_THAN',mathn(nt,'FRACT',mathn(nt,'DIVIDE',mathn(nt,'ADD',sp.outputs[1],50.0),110.0)),0.018)
    lx=mathn(nt,'MULTIPLY',lx,mathn(nt,'LESS_THAN',mathn(nt,'FRACT',mathn(nt,'DIVIDE',sp.outputs[1],9.0)),0.22)); ly=mathn(nt,'MULTIPLY',ly,mathn(nt,'LESS_THAN',mathn(nt,'FRACT',mathn(nt,'DIVIDE',sp.outputs[0],9.0)),0.22))
    ln=mathn(nt,'MINIMUM',mathn(nt,'ADD',lx,ly),1.0)
    ln=mathn(nt,'MULTIPLY',ln,mathn(nt,'GREATER_THAN',mathn(nt,'ADD',mathn(nt,'ABSOLUTE',sp.outputs[0]),mathn(nt,'ABSOLUTE',sp.outputs[1])),160.0))
    nz=N(nt,'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=0.004; nt.links.new(tc.outputs['Object'],nz.inputs['Vector'])
    ln=mathn(nt,'MULTIPLY',ln,mathn(nt,'POWER',nz.outputs['Fac'],2.0))
    p.inputs['Emission Color'].default_value=(1.0,0.45,0.12,1); nt.links.new(mathn(nt,'MULTIPLY',ln,9.0),p.inputs['Emission Strength'])
    ground(gm)
    pal=[(0.0,(0.75,0.9,1.0)),(0.5,(0.55,0.85,0.9)),(0.75,(1.0,0.7,0.45)),(0.9,(1.0,0.25,0.6))]
    neon=[(1.0,0.1,0.55),(0.1,0.85,1.0),(1.0,0.45,0.05),(0.6,0.2,1.0)]
    redb=emitmat('beacon',(1.0,0.03,0.02),120)
    # Hochhausfeld
    for k in range(420):
        a=random.uniform(0,2*math.pi); d=random.uniform(120,2600)**1.0
        x,y=d*math.sin(a),d*math.cos(a)
        h=random.uniform(30,110)+(random.random()**3)*320*(1.0 if d<1500 else 0.6)
        fw,fd=random.uniform(18,45),random.uniform(18,45)
        f=facade(f'f{k}',(0.10,0.105,0.115),random.uniform(0.02,0.07),pal,sx=random.choice([1.8,2.2,3.0]),sz=random.choice([3.4,3.8]),es=3.0,wx=(0.12,0.88),wz=(0.2,0.85),panel=False)
        o=box(f'h{k}',(x,y,h/2),(fw,fd,h),f,rz=random.uniform(0,math.pi))
        if h>140:
            box(f'top{k}',(x,y,h+6),(fw*0.5,fd*0.5,12),f,rz=o.rotation_euler.z)
            sph(f'b{k}',(x,y,h+13),1.0,redb,seg=8)
        if random.random()<0.12 and d<1800:
            nc=random.choice(neon); nm=emitmat(f'n{k}',nc,random.uniform(15,40))
            hh=random.uniform(12,40); z0=random.uniform(h*0.3,max(h*0.3+1,h-hh))
            r=o.rotation_euler.z; ox,oy=math.cos(r)*fw/2,math.sin(r)*fw/2
            box(f'ns{k}',(x+ox*1.02,y+oy*1.02,z0+hh/2),(0.6,3.0,hh),nm,rz=r)
        if random.random()<0.06 and d<1500:
            nm=emitmat(f'bb{k}',random.choice(neon),8)
            box(f'bb{k}',(x,y,h+5),(fw*0.8,0.5,8),nm,rz=random.uniform(0,math.pi))
    # Nahes Gegenüber-Hochhaus mit Neon (Mittel-Ebene), vorne rechts
    nf=facade('near',(0.09,0.095,0.1),0.09,pal,sx=1.6,sz=3.4,es=2.2,wx=(0.1,0.9),wz=(0.15,0.88),panel=False)
    box('near1',(30,62,40),(26,26,80),nf,coll=MID,rz=0.15)
    box('near_n1',(17.5,58,52),(0.5,2.4,22),emitmat('nn1',(1.0,0.12,0.5),30),coll=MID,rz=0.15)
    box('near_n2',(17.6,58.5,37),(0.4,1.2,6),emitmat('nn2',(0.1,0.9,1.0),25),coll=MID,rz=0.15)
    box('near_rail',(30,62,80.6),(26.4,26.4,1.2),principled('rail',(0.05,0.05,0.05),0.5,0.8),coll=MID,rz=0.15)
    box('near2',(-55,70,30),(30,22,60),nf,coll=MID,rz=-0.2)
    # Hochstraße mit Verkehr (Lichtpunkte) im Mittelgrund
    road=principled('trasse',(0.06,0.06,0.065),0.6)
    for i in range(-30,31):
        x=i*12; box(f'hw{i}',(x,140,22),(12.2,14,1.2),road)
        if i%3==0: box(f'hp{i}',(x,140,11),(1.6,1.6,22),road)
    tail=emitmat('tail',(1.0,0.05,0.02),25); head=emitmat('head',(1.0,0.9,0.75),35)
    for i in range(70):
        x=random.uniform(-360,360); lane=random.choice([-1,1])
        box(f'car{i}',(x,140+lane*3.5,22.9),(0.4,1.6,0.15),tail if lane>0 else head)
    GLARE=(1.0,9)
elif SCN=='maisfeld':
    CAMH=1.7; FOG=(0.10,0.075,0.08); FOGAMT=0.55; MIST=(30,1600,'QUADRATIC')
    world_sky((0.13,0.075,0.08),(0.010,0.015,0.04),glow_h=0.3,clouds=0.45,band=((1.1,0.32,0.07),0.0,0.16))
    soil=noise_rough(principled('erde',(0.05,0.035,0.025),0.95),0.85,1.0,0.5); ground(soil)
    # Weg (heller, Spurrillen)
    box('weg',(0,0,0.01),(3.0,6000,0.02),noise_rough(principled('weg',(0.12,0.1,0.08),0.95),0.85,1.0,1.0),coll=FAR,rz=0)
    # Maisstaude
    me=bpy.data.meshes.new('stalk'); vs=[];fs=[]
    def quad(p0,p1,w,tw):
        b=len(vs); vs.extend([(p0[0]-w,p0[1],p0[2]),(p0[0]+w,p0[1],p0[2]),(p1[0]+tw,p1[1],p1[2]),(p1[0]-tw,p1[1],p1[2])]); fs.append((b,b+1,b+2,b+3))
    quad((0,0,0),(0,0,2.3),0.02,0.008)
    for j in range(7):
        z=0.5+j*0.25; a=j*2.4; L=0.75; dx,dy=math.cos(a)*L,math.sin(a)*L
        b=len(vs); vs.extend([(0,0,z),(0,0,z+0.06),(dx,dy,z+0.25),(dx*1.3,dy*1.3,z-0.05)]); fs.append((b,b+1,b+2,b+3))
    b=len(vs); vs.extend([(-0.12,0,2.3),(0.12,0,2.3),(0,0,2.6)]); fs.append((b,b+1,b+2))
    me.from_pydata(vs,[],fs); st=bpy.data.objects.new('stalk',me); bpy.context.scene.collection.objects.link(st)
    cm=principled('mais',(0.11,0.09,0.035),0.75); cm.node_tree.nodes['Principled BSDF'].inputs['Subsurface Weight'].default_value=0.0
    st.data.materials.append(cm); st.hide_render=True
    def field(name,cx,cy,sx,sy,count,coll):
        for v in range(3):
            pts=[(cx+random.uniform(-sx/2,sx/2),cy+random.uniform(-sy/2,sy/2),0.0) for _ in range(count//3)]
            pm=bpy.data.meshes.new(name+str(v)); pm.from_pydata(pts,[],[]); po=bpy.data.objects.new(name+str(v),pm); coll.objects.link(po)
            inst=st.copy(); inst.data=st.data; inst.rotation_euler=(random.uniform(-0.06,0.06),random.uniform(-0.06,0.06),v*2.1); inst.scale=(1,1,0.9+0.1*v); coll.objects.link(inst)
            inst.parent=po; po.instance_type='VERTS'; inst.hide_render=False
    field('mais_links',-105,-350,190,700,110000,FAR); field('mais_rechts',105,-350,190,700,110000,FAR); field('mais_hinten',0,-380,20,640,6000,FAR)
    # Stoppelfeld vorne, Baumreihe am Horizont, Hof mit Licht, Strommasten, Kirchturm
    tree=principled('baum',(0.012,0.016,0.01),0.95); wood=principled('holz',(0.05,0.04,0.03),0.9)
    TEXC=bpy.data.textures.new('wolke','CLOUDS'); TEXC.noise_scale=1.6; TEXC.noise_depth=3
    for i in range(260):
        x=random.uniform(-1500,1500)
        if -720<x<-430: continue
        y=random.uniform(260,330)+0.00006*x*x
        r=random.uniform(3.5,8); base_z=r*0.9+random.uniform(1,3)
        for j in range(random.randint(4,7)):
            rr=r*random.uniform(0.45,0.75); o=sph(f't{i}_{j}',(x+random.uniform(-r,r)*0.7,y+random.uniform(-r,r)*0.5,base_z+random.uniform(-r*0.4,r*0.6)),rr,tree,seg=12)
            o.scale=(1,1,random.uniform(0.8,1.15)); d=o.modifiers.new('d','DISPLACE'); d.texture=TEXC; d.strength=rr*0.45
        if random.random()<0.6: cyl(f'ts{i}',(x,y,base_z*0.5),r*0.07,base_z,wood,v=6)
    hof=principled('hof',(0.15,0.13,0.11),0.9)
    box('hof',(120,190,4),(20,10,8),hof,rz=0.3); box('scheune',(145,198,5),(24,12,10),hof,rz=0.3)
    box('hofdach',(120,190,8.6),(21,11,1.2),principled('dachz',(0.1,0.04,0.03),0.9),rz=0.3)
    box('hoffenster',(116.5,184.8,3),(1.2,0.1,1.0),emitmat('hf',(1.0,0.6,0.3),25),rz=0.3)
    plight('hoflampe',(130,182,5),300,(1.0,0.6,0.3),r=0.1)
    box('hoflampe_m',(130,182.4,5),(0.25,0.2,0.25),emitmat('hl',(1.0,0.7,0.4),60))
    wood=principled('holz',(0.05,0.04,0.03),0.9)
    for i in range(-8,9):
        x=i*55; cyl(f'mast{i}',(x+40,70,5),0.14,10,wood,v=8); box(f'tr{i}',(x+40,70,9.6),(0.1,2.2,0.12),wood)
    # Leitungen
    for dy in (-0.9,0.9):
        bpy.ops.curve.primitive_bezier_curve_add(); cu=bpy.context.object
        sp=cu.data.splines[0]; sp.bezier_points.add(15)
        for j,bp in enumerate(sp.bezier_points):
            x=-440+40+j*55; bp.co=(x,70+dy,9.7); bp.handle_left=(x-18,70+dy,8.9); bp.handle_right=(x+18,70+dy,8.9)
        cu.data.bevel_depth=0.015; cu.data.materials.append(principled('kabel',(0.01,0.01,0.01),0.6))
    # Vogelscheuche im Stoppelfeld, einzelner Baum, Zaunpfähle am Feldende
    cyl('vs_pfahl',(10,26,1.2),0.05,2.4,wood,v=6); cyl('vs_arm',(10,26,1.75),0.035,1.5,wood,v=6,rot=(0,math.pi/2,0.2))
    box('vs_mantel',(10,26,1.45),(0.55,0.3,0.75),principled('mantel',(0.04,0.035,0.03),0.95),rz=0.2)
    sph('vs_kopf',(10,26,2.05),0.17,principled('sack',(0.09,0.075,0.05),0.95),seg=10)
    bpy.ops.mesh.primitive_cone_add(vertices=10,radius1=0.32,radius2=0.12,depth=0.28,location=(10,26,2.27)); hat=bpy.context.object; hat.data.materials.append(principled('hut',(0.02,0.02,0.02),0.9))
    for j in range(9):
        a=j*0.7; sph(f'baum1_{j}',(-70+math.cos(a)*3,120+math.sin(a)*3,7+(j%3)*1.8),3.6,tree,seg=10)
    cyl('baum1_stamm',(-70,120,3.5),0.45,7,wood,v=8)
    for i,x in enumerate([-9,-6.5,-4,-2.2,2.2,4,6.5,9,11.5]):
        cyl(f'zaun{i}',(x,9.0,0.55),0.05,1.1+0.1*(i%2),wood,coll=MID,v=6,rot=(random.uniform(-0.12,0.12),random.uniform(-0.12,0.12),0))
    for side in (-1,1):
        bpy.ops.curve.primitive_bezier_curve_add(); cu=bpy.context.object; sp=cu.data.splines[0]; sp.bezier_points.add(1)
        a0,a1=(2.2*side,9.0,0.85),(11.5*side if side>0 else -9,9.0,0.8)
        for bp,pp in zip(sp.bezier_points,[a0,a1]): bp.co=pp; bp.handle_left=(pp[0]-0.5,pp[1],pp[2]-0.15); bp.handle_right=(pp[0]+0.5,pp[1],pp[2]-0.15)
        cu.data.bevel_depth=0.006; cu.data.materials.append(principled('draht',(0.03,0.03,0.03),0.5,0.6))
        for cl in cu.users_collection: cl.objects.unlink(cu)
        MID.objects.link(cu)
    box('schild_pfahl',(-3.2,9.6,0.9),(0.08,0.08,1.8),wood,coll=MID)
    box('schild',(-3.2,9.55,1.65),(0.7,0.04,0.45),principled('blech',(0.12,0.1,0.06),0.5,0.4),coll=MID,rz=0.05)
    church=principled('kirche',(0.12,0.11,0.1),0.9)
    box('kirchschiff',(-620,1100,8),(14,30,16),church); box('kirchturm',(-620,1080,20),(7,7,40),church)
    bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=5,depth=14,location=(-620,1080,47)); c=bpy.context.object; c.data.materials.append(church)
    for i in range(40):
        x=random.uniform(-800,-400); y=random.uniform(1050,1200)
        box(f'dh{i}',(x,y,3),(8,10,6),church,rz=random.uniform(0,3))
        if random.random()<0.35: box(f'dl{i}',(x,y-5.1,2.5),(1,0.1,0.8),emitmat(f'dle{i}',(1.0,0.65,0.35),40),rz=0)
    sph('kirchlicht',(-620,1076.4,30),0.6,emitmat('kl',(1.0,0.75,0.45),40))
    GLARE=(1.5,8)

# Kamera
cd=bpy.data.cameras.new('cam'); cd.type='PANO'; cd.panorama_type='EQUIRECTANGULAR'; cd.clip_start=0.3; cd.clip_end=8000
cam=bpy.data.objects.new('cam',cd); cam.location=(0,0,CAMH); cam.rotation_euler=(math.pi/2,0,0); sc.collection.objects.link(cam); sc.camera=cam
w=sc.world; w.mist_settings.start=MIST[0]; w.mist_settings.depth=MIST[1]; w.mist_settings.falloff=MIST[2]
# Ebenen
mids=set(o.name for o in MID.all_objects)
if LAYER=='far':
    for o in MID.all_objects:
        if o.type in ('MESH','CURVE'): o.visible_camera=False
else:
    for o in sc.objects:
        if o.name not in mids and o.type in ('MESH','CURVE'): o.visible_camera=False
# Compositor: Nebel (Mist) nur auf Geometrie, Himmel aus Environment-Pass, + Glow
sc.render.film_transparent=True; vl.use_pass_environment=True
sc.use_nodes=True; nt=sc.node_tree; nt.nodes.clear()
rl=nt.nodes.new('CompositorNodeRLayers'); out=nt.nodes.new('CompositorNodeComposite')
mm=nt.nodes.new('CompositorNodeMath'); mm.operation='MULTIPLY'; mm.inputs[1].default_value=FOGAMT; nt.links.new(rl.outputs['Mist'],mm.inputs[0])
m2=nt.nodes.new('CompositorNodeMath'); m2.operation='MULTIPLY'; nt.links.new(mm.outputs[0],m2.inputs[0]); nt.links.new(rl.outputs['Alpha'],m2.inputs[1])
fa=nt.nodes.new('CompositorNodeMixRGB'); fa.blend_type='MULTIPLY'; fa.inputs[0].default_value=1.0; fa.inputs[1].default_value=(*FOG,1); nt.links.new(rl.outputs['Alpha'],fa.inputs[2])
mix=nt.nodes.new('CompositorNodeMixRGB'); nt.links.new(m2.outputs[0],mix.inputs[0]); nt.links.new(rl.outputs['Image'],mix.inputs[1]); nt.links.new(fa.outputs[0],mix.inputs[2])
img=mix.outputs[0]
if LAYER=='far':
    ao=nt.nodes.new('CompositorNodeAlphaOver'); nt.links.new(rl.outputs['Env'],ao.inputs[1]); nt.links.new(img,ao.inputs[2]); img=ao.outputs[0]
gl=nt.nodes.new('CompositorNodeGlare'); gl.glare_type='FOG_GLOW'; gl.quality='HIGH'; gl.threshold=GLARE[0]; gl.size=GLARE[1]; gl.mix=0.0
nt.links.new(img,gl.inputs[0]); img=gl.outputs[0]
if LAYER=='mid':
    bw=nt.nodes.new('CompositorNodeRGBToBW'); nt.links.new(img,bw.inputs[0])
    k=nt.nodes.new('CompositorNodeMath'); k.operation='MULTIPLY'; k.use_clamp=True; k.inputs[1].default_value=3.0; nt.links.new(bw.outputs[0],k.inputs[0])
    mx=nt.nodes.new('CompositorNodeMath'); mx.operation='MAXIMUM'; nt.links.new(rl.outputs['Alpha'],mx.inputs[0]); nt.links.new(k.outputs[0],mx.inputs[1])
    sa=nt.nodes.new('CompositorNodeSetAlpha'); sa.mode='REPLACE_ALPHA'; nt.links.new(img,sa.inputs[0]); nt.links.new(mx.outputs[0],sa.inputs[1]); img=sa.outputs[0]
nt.links.new(img,out.inputs['Image'])
sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA' if LAYER=='mid' else 'RGB'; sc.render.image_settings.color_depth='8'
fn=os.path.join(OUT,f'{SCN}_{LAYER}_{W}.png'); sc.render.filepath=fn
print('build done',round(time.time()-t0,1),'objs',len(sc.objects),flush=True)
bpy.ops.render.render(write_still=True)
print('RENDERED',fn,round(time.time()-t0,1),flush=True)
