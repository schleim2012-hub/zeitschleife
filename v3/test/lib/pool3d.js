/* Hallenbad / Level 37 bei Nacht – echtes 3D. Deck y=0, Becken 1,5 m tief.
   Schichten: nah = Deck, Becken, Wasser, Requisiten (3D) · mittel = Halle mit Hochfenstern · fern = Bogen in die "Poolrooms" (Foto, abgedunkelt) + Dunst.
   Licht nur praktisch: zwei Hallenleuchten (eine flackert), zwei Unterwasserscheinwerfer. Rest schwarz. window.buildPool(sceneEl,C) */
(function(){
let sd=37; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
window.buildPool=function(sc,C){ const T=THREE, S=sc.object3D, TL=new T.TextureLoader(), G=new T.Group(); S.add(G); const B='../assets/tex/pool/';
 const ld=(f,srgb)=>{ const t=TL.load(B+f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; return t; };
 const X=6, ZB=3, ZF=-11, H=4.2, PX=3.6, P0=-1.0, P1=-10, D=1.5, WY=-0.16;
 // ---- Geometrie-Sammler pro Material: Weltraum-UVs (1 Kachelbild = 1 m), Vertex-AO ----
 const bins={}; const add=(mat,g,ao,us)=>{ us=us||1; g=g.index?g.toNonIndexed():g; g.computeVertexNormals(); const p=g.attributes.position, n=g.attributes.normal, uv=new Float32Array(p.count*2), col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i), nx=Math.abs(n.getX(i)), ny=Math.abs(n.getY(i)); let u,v; if(ny>0.6){u=x;v=z;} else if(nx>0.6){u=z;v=y;} else {u=x;v=y;} uv[i*2]=u*us; uv[i*2+1]=v*us; const a=ao?ao(x,y,z):1; col[i*3]=col[i*3+1]=col[i*3+2]=a; }
  g.setAttribute('uv',new T.BufferAttribute(uv,2)); g.setAttribute('color',new T.BufferAttribute(col,3)); (bins[mat]=bins[mat]||[]).push(g); };
 const quad=(w,h,sx,sy)=>new T.PlaneGeometry(w,h,sx||1,sy||1);
 const fl=(x0,x1,z0,z1,y,up)=>{ const g=quad(x1-x0,z1-z0,Math.ceil((x1-x0)*2),Math.ceil(Math.abs(z1-z0)*2)); g.rotateX(up?-Math.PI/2:Math.PI/2); g.translate((x0+x1)/2,y,(z0+z1)/2); return g; };
 const wz=(x0,x1,y0,y1,z,face)=>{ const g=quad(x1-x0,y1-y0,Math.ceil((x1-x0)*2),Math.ceil((y1-y0)*3)); if(face<0) g.rotateY(Math.PI); g.translate((x0+x1)/2,(y0+y1)/2,z); return g; };
 const wx=(z0,z1,y0,y1,x,face)=>{ const g=quad(z1-z0,y1-y0,Math.ceil(Math.abs(z1-z0)*2),Math.ceil((y1-y0)*3)); g.rotateY(face>0?Math.PI/2:-Math.PI/2); g.translate(x,(y0+y1)/2,(z0+z1)/2); return g; };
 const sm=(a,b,x)=>{ x=Math.min(1,Math.max(0,(x-a)/(b-a))); return x*x*(3-2*x); };
 const aoDeck=(x,y,z)=>{ let a=1; a*=0.55+0.45*sm(0,0.9,X-Math.abs(x)); a*=0.55+0.45*sm(0,0.9,ZB-z); a*=0.55+0.45*sm(0,0.9,z-ZF); return a; };
 const aoWall=(x,y,z)=>{ let a=0.55+0.45*sm(0,0.7,y); a*=0.6+0.4*sm(0,0.7,H-y); a*=0.7+0.3*Math.min(sm(0,0.8,X-Math.abs(x)),sm(0,0.8,ZB-z),sm(0,0.8,z-ZF)); return a; };
 const aoBasin=(x,y,z)=>{ let a=0.6+0.4*sm(-D,-D+0.6,y); a*=0.65+0.35*Math.min(sm(0,0.6,PX-Math.abs(x)),sm(0,0.6,P0-z),sm(0,0.6,z-P1)); return a; };
 // Deck (um das Becken herum)
 add('floor',fl(-X,X,P0,ZB,0,1),aoDeck); add('floor',fl(-X,-PX,ZF,P0,0,1),aoDeck); add('floor',fl(PX,X,ZF,P0,0,1),aoDeck); add('floor',fl(-PX,PX,ZF,P1,0,1),aoDeck);
 // Hallenwände: Fliesen bis 2,4 m, darüber Putz
 const WT=2.4; [[wz,-X,X,ZB,-1],[wz,-X,X,ZF,1]].forEach(([f,a,b,z,s])=>{ if(z===ZF){ add('wall',wz(-X,-2,0,WT,z,s),aoWall); add('wall',wz(2,X,0,WT,z,s),aoWall); add('plaster',wz(-X,-2,WT,H,z,s),aoWall); add('plaster',wz(2,X,WT,H,z,s),aoWall); add('plaster',wz(-2,2,3.1,H,z,s),aoWall); } else { add('wall',wz(a,b,0,WT,z,s),aoWall); add('plaster',wz(a,b,WT,H,z,s),aoWall); } });
 [[-X,1],[X,-1]].forEach(([x,s])=>{ add('wall',wx(ZF,ZB,0,WT,x,s),aoWall); add('plaster',wx(ZF,ZB,WT,H,x,s),aoWall); });
 add('ceil',fl(-X,X,ZF,ZB,H,0));
 // Becken
 add('basin',fl(-PX,PX,P1,P0,-D,1),aoBasin); add('basin',wz(-PX,PX,-D,0,P0,-1),aoBasin); add('basin',wz(-PX,PX,-D,0,P1,1),aoBasin); add('basin',wx(P1,P0,-D,0,-PX,1),aoBasin); add('basin',wx(P1,P0,-D,0,PX,-1),aoBasin);
 // Beckenrand (Kopfsteine) + Rinne mit Rost
 const cop=(x0,x1,z0,z1)=>{ const g=new T.BoxGeometry(x1-x0,0.05,z1-z0); g.translate((x0+x1)/2,0.0,(z0+z1)/2); add('coping',g,null,2); };
 cop(-PX-0.3,PX+0.3,P0,P0+0.3); cop(-PX-0.3,PX+0.3,P1-0.3,P1); cop(-PX-0.3,-PX,P1,P0); cop(PX,PX+0.3,P1,P0);
 // Bahnenlinien am Beckenboden
 [-2.7,-0.9,0.9,2.7].forEach(x=>{ const g=quad(0.22,P0-P1-1.6); g.rotateX(-Math.PI/2); g.translate(x,-D+0.005,(P0+P1)/2); add('lane',g); const t=quad(0.9,0.22); t.rotateX(-Math.PI/2); t.translate(x,-D+0.006,P0-0.8); add('lane',t); const t2=t.clone(); t2.translate(0,0,P1-P0+1.6); add('lane',t2); });
 // Deckenträger
 for(let z=ZB-1.5; z>ZF; z-=2.2){ const g=new T.BoxGeometry(2*X,0.35,0.18); g.translate(0,H-0.18,z); add('beam',g); }
 const MAT={
  floor:new T.MeshStandardMaterial({map:ld('floor_c.jpg',1),normalMap:ld('floor_n.jpg'),roughness:0.22,metalness:0,vertexColors:true,envMapIntensity:0.9}),
  wall:new T.MeshStandardMaterial({map:ld('wall_c.jpg',1),normalMap:ld('wall_n.jpg'),roughness:0.18,vertexColors:true,envMapIntensity:0.7}),
  plaster:new T.MeshStandardMaterial({color:0x2c3533,roughness:0.95,vertexColors:true}),
  ceil:new T.MeshStandardMaterial({color:0x0c100f,roughness:1}),
  beam:new T.MeshStandardMaterial({color:0x151a19,roughness:0.9}),
  basin:new T.MeshStandardMaterial({map:ld('basin_c.jpg',1),normalMap:ld('basin_n.jpg'),roughness:0.3,vertexColors:true}),
  coping:new T.MeshStandardMaterial({map:ld('wall_c.jpg',1),color:0xd8d8cc,roughness:0.35,envMapIntensity:0.6}),
  lane:new T.MeshStandardMaterial({color:0x0b1a2c,roughness:0.4})};
 // Umgebungs-Spiegelung (für nasses Deck, Wasser, Chrom): dunkle Halle mit zwei hellen Leuchten und blaugrünem Schein von unten
 const ecv=document.createElement('canvas'); ecv.width=512; ecv.height=256; { const x=ecv.getContext('2d'); x.fillStyle='#030606'; x.fillRect(0,0,512,256); const g=x.createLinearGradient(0,128,0,256); g.addColorStop(0,'#08201f'); g.addColorStop(1,'#0e3a3a'); x.fillStyle=g; x.fillRect(0,128,512,128);
  [[110,50],[300,46]].forEach(([u,v])=>{ x.fillStyle='rgba(220,255,245,0.95)'; x.fillRect(u-28,v-4,56,8); const r=x.createRadialGradient(u,v,0,u,v,40); r.addColorStop(0,'rgba(150,230,220,0.35)'); r.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=r; x.fillRect(u-40,v-40,80,80); });
  x.fillStyle='rgba(40,60,90,0.6)'; for(let i=0;i<10;i++) x.fillRect(i*51+8,84,30,16); }
 const et=new T.CanvasTexture(ecv); et.mapping=T.EquirectangularReflectionMapping; et.colorSpace=T.SRGBColorSpace; const pm=new T.PMREMGenerator(sc.renderer); const env=pm.fromEquirectangular(et).texture; pm.dispose();
 Object.values(MAT).forEach(m=>{ m.envMap=env; });
 const mergeArr=gs=>{ let n=0; gs.forEach(g=>n+=g.attributes.position.count); const r=new T.BufferGeometry(); ['position','normal','uv','color'].forEach(k=>{ const sz=gs[0].attributes[k].itemSize, a=new Float32Array(n*sz); let o=0; gs.forEach(g=>{ a.set(g.attributes[k].array,o); o+=g.attributes[k].array.length; }); r.setAttribute(k,new T.BufferAttribute(a,sz)); }); return r; };
 Object.entries(bins).forEach(([k,gs])=>{ const m=new T.Mesh(mergeArr(gs),MAT[k]); m.matrixAutoUpdate=false; G.add(m); });
 // ---- Wasser: transparente Fläche, animierte Normalen, spiegelt env ----
 const wn=ld('water_n.jpg'); wn.repeat.set(3,4); const wn2=ld('water_n.jpg'); wn2.repeat.set(1.3,1.7);
 const water=new T.Mesh(new T.PlaneGeometry(2*PX,P0-P1),new T.MeshStandardMaterial({color:0x0b5a5c,roughness:0.04,metalness:0.15,transparent:true,opacity:0.72,normalMap:wn,normalScale:new T.Vector2(0.35,0.35),envMap:env,envMapIntensity:1.6,depthWrite:false}));
 water.rotation.x=-Math.PI/2; water.position.set(0,WY,(P0+P1)/2); water.renderOrder=2; G.add(water);
 // Kaustik am Beckenboden (additiv, wandert)
 const ca=ld('caustic.jpg'); ca.repeat.set(2.4,3); const caM=new T.MeshBasicMaterial({map:ca,color:0x3fb0b0,transparent:true,opacity:0.32,blending:T.AdditiveBlending,depthWrite:false});
 const cau=new T.Mesh(new T.PlaneGeometry(2*PX-0.1,P0-P1-0.1),caM); cau.rotation.x=-Math.PI/2; cau.position.set(0,-D+0.01,(P0+P1)/2); G.add(cau);
 const ca2=ld('caustic.jpg'); ca2.repeat.set(1.7,2.1); const cau2=new T.Mesh(cau.geometry,new T.MeshBasicMaterial({map:ca2,color:0x2a8a90,transparent:true,opacity:0.22,blending:T.AdditiveBlending,depthWrite:false})); cau2.rotation.x=-Math.PI/2; cau2.position.set(0,-D+0.012,(P0+P1)/2); G.add(cau2);
 // Unterwasserscheinwerfer (in der Beckenwand) + Licht
 const uwM=new T.MeshBasicMaterial({color:0x9ff8f0,toneMapped:false}); const uwOff=new T.MeshStandardMaterial({color:0x202828,roughness:0.3,metalness:0.6});
 [[-PX+0.01,-0.7,-3,1,1],[PX-0.01,-0.7,-3.2,-1,0],[-PX+0.01,-0.7,-7.5,1,0],[PX-0.01,-0.7,-7.2,-1,1]].forEach(([x,y,z,s,on])=>{ const d=new T.Mesh(new T.CircleGeometry(0.13,20),on?uwM:uwOff); d.position.set(x,y,z); d.rotation.y=s*Math.PI/2; G.add(d); const r=new T.Mesh(new T.TorusGeometry(0.14,0.018,6,24),uwOff); r.position.copy(d.position); r.rotation.y=d.rotation.y; G.add(r); });
 const u1=new T.PointLight(0x30e8e0,5,8,1.6); u1.position.set(-2.6,-0.8,-3); G.add(u1); const u2=new T.PointLight(0x30d0e8,4,8,1.6); u2.position.set(2.6,-0.8,-7.2); G.add(u2);
 // Hallenleuchten: Gehäuse + Röhren; zwei an, eine flackert, Rest tot
 const hous=new T.MeshStandardMaterial({color:0x1c2220,roughness:0.6,metalness:0.4}); const tOn=new T.MeshBasicMaterial({color:0xd8fff4,toneMapped:false}); const tOff=new T.MeshStandardMaterial({color:0x2a302e,roughness:0.4}); const tFl=new T.MeshBasicMaterial({color:0xd8fff4,toneMapped:false});
 const lamps=[[-2.2,-3,'on'],[2.2,-3,'off'],[-2.2,-7.4,'off'],[2.2,-7.4,'fl'],[0,1.2,'on'],[-4.6,1.2,'off'],[4.6,1.2,'off']];
 lamps.forEach(([x,z,s])=>{ const h=new T.Mesh(new T.BoxGeometry(1.3,0.09,0.3),hous); h.position.set(x,3.55,z); G.add(h); const tb=new T.Mesh(new T.CylinderGeometry(0.018,0.018,1.18,8),s==='on'?tOn:s==='fl'?tFl:tOff); tb.rotation.z=Math.PI/2; tb.position.set(x,3.495,z); G.add(tb);
  [-0.5,0.5].forEach(o=>{ const w=new T.Mesh(new T.CylinderGeometry(0.004,0.004,H-3.6,4),hous); w.position.set(x+o,(H+3.6)/2,z); G.add(w); }); });
 const L1=new T.PointLight(0xc8f0e8,7,13,1.5); L1.position.set(-2.2,3.3,-3); G.add(L1); const L2=new T.PointLight(0xd8e8d8,3.2,7,1.6); L2.position.set(0,3.3,1.2); G.add(L2); const LF=new T.PointLight(0xc8f0e8,0,11,1.5); LF.position.set(2.2,3.3,-7.4); G.add(LF);
 S.add(new T.HemisphereLight(0x10302e,0x020303,0.35));
 // Hochfenster in den Seitenwänden: Nachthimmel, Sprossen
 const win=new T.MeshBasicMaterial({color:0x0a1626}); const mull=new T.MeshStandardMaterial({color:0x111514,roughness:0.7});
 for(let z=ZB-2; z>ZF+0.5; z-=2.2) [-1,1].forEach(s=>{ const w=new T.Mesh(new T.PlaneGeometry(1.6,0.9),win); w.position.set(s*(X-0.01),3.35,z); w.rotation.y=-s*Math.PI/2; G.add(w); [-0.4,0,0.4].forEach(o=>{ const m=new T.Mesh(new T.BoxGeometry(0.04,0.95,0.04),mull); m.position.set(s*(X-0.02),3.35,z+o); G.add(m); }); });
 // Ferne Schicht: Bogen in der Stirnwand → abgedunkeltes Pool-Foto (Level 37), Dunst
 const far=new T.MeshBasicMaterial({color:0x5a7470,fog:false}); TL.load('../assets/pool/backdrop.jpg',t=>{ t.colorSpace=T.SRGBColorSpace; far.map=t; far.needsUpdate=true; });
 const fp=new T.Mesh(new T.PlaneGeometry(9,4.8),far); fp.position.set(0,1.4,ZF-5); G.add(fp);
 const tun=new T.MeshStandardMaterial({map:ld('wall_c.jpg',1),roughness:0.25,color:0x8a9a96,envMap:env}); [[-2,1],[2,-1]].forEach(([x,s])=>{ const g=new T.PlaneGeometry(5,3.1); const m=new T.Mesh(g,tun); m.rotation.y=s*Math.PI/2; m.position.set(x,1.55,ZF-2.5); G.add(m); }); const tf=new T.Mesh(new T.PlaneGeometry(4,5),MAT.floor); tf.rotation.x=-Math.PI/2; tf.position.set(0,0,ZF-2.5); G.add(tf); const tc=new T.Mesh(new T.PlaneGeometry(4,5),MAT.ceil); tc.rotation.x=Math.PI/2; tc.position.set(0,3.1,ZF-2.5); G.add(tc);
 // Dampf über dem Wasser (weiche Sprites, langsam)
 const sc2=document.createElement('canvas'); sc2.width=sc2.height=128; { const x=sc2.getContext('2d'); const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,0.8)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); } const stT=new T.CanvasTexture(sc2);
 const steam=[]; for(let i=0;i<9;i++){ const sp=new T.Sprite(new T.SpriteMaterial({map:stT,color:0x7fb8b0,transparent:true,opacity:0.05+rnd()*0.04,depthWrite:false})); sp.position.set((rnd()-0.5)*6,0.2+rnd()*1.2,-2-rnd()*7.5); const s=2.5+rnd()*2.5; sp.scale.set(s,s*0.5,1); sp.userData={x:sp.position.x,ph:rnd()*6}; G.add(sp); steam.push(sp); }
 // ---- Requisiten ----
 const chrome=new T.MeshStandardMaterial({color:0xc8cccc,metalness:1,roughness:0.18,envMap:env,envMapIntensity:1.2});
 const ladder=(x,z)=>{ [-0.25,0.25].forEach(o=>{ const c=new T.CatmullRomCurve3([new T.Vector3(x+o,-1.1,z-0.12),new T.Vector3(x+o,0.0,z-0.12),new T.Vector3(x+o,0.75,z-0.05),new T.Vector3(x+o,0.9,z+0.18),new T.Vector3(x+o,0.55,z+0.42),new T.Vector3(x+o,0.0,z+0.45)]); G.add(new T.Mesh(new T.TubeGeometry(c,40,0.021,8),chrome)); });
  [-0.3,-0.6,-0.9].forEach(y=>{ const st=new T.Mesh(new T.BoxGeometry(0.5,0.03,0.09),chrome); st.position.set(x,y,z-0.17); G.add(st); }); };
 ladder(-PX+0.6,P0); ladder(PX-0.6,P0);
 // Leinen mit Schwimmern (instanziert)
 const fG=new T.CylinderGeometry(0.05,0.05,0.11,10); fG.rotateX(Math.PI/2); const fM=new T.MeshStandardMaterial({roughness:0.5}); const nF=Math.floor((P0-P1-0.4)/0.12);
 const ropes=[-1.8,0,1.8]; const fl2=new T.InstancedMesh(fG,fM,nF*ropes.length); const m4=new T.Matrix4(); let k=0; ropes.forEach(x=>{ for(let i=0;i<nF;i++){ m4.makeTranslation(x,WY+0.015,P0-0.2-i*0.12); fl2.setMatrixAt(k,m4); fl2.setColorAt(k,new T.Color(((i>>2)&1)?0x8a1a14:0xb8b4a8)); k++; } }); G.add(fl2);
 // Startblöcke am nahen Rand (Nummern)
 const blkM=new T.MeshStandardMaterial({color:0x8a8e86,roughness:0.55}); const topM=new T.MeshStandardMaterial({color:0x26403c,roughness:0.9});
 [-2.7,-0.9,0.9,2.7].forEach((x,i)=>{ const b=new T.Mesh(new T.BoxGeometry(0.5,0.62,0.5),blkM); b.position.set(x,0.31,P0+0.3); G.add(b); const tp=new T.Mesh(new T.BoxGeometry(0.52,0.05,0.56),topM); tp.position.set(x,0.64,P0+0.28); tp.rotation.x=0.1; G.add(tp);
  const nc=document.createElement('canvas'); nc.width=nc.height=64; const x2=nc.getContext('2d'); x2.fillStyle='#d8d4c8'; x2.fillRect(0,0,64,64); x2.fillStyle='#1a1a1a'; x2.font='bold 44px Arial'; x2.textAlign='center'; x2.fillText(String(i+1),32,48); const n=new T.Mesh(new T.PlaneGeometry(0.2,0.2),new T.MeshStandardMaterial({map:new T.CanvasTexture(nc),roughness:0.6})); n.position.set(x,0.45,P0+0.551); G.add(n); });
 // Rettungsring an der Wand, Uhr über dem Bogen (steht still), Bank, Schild
 const rb=new T.Group(); for(let i=0;i<8;i++){ const t=new T.Mesh(new T.TorusGeometry(0.3,0.065,10,10,Math.PI/4),new T.MeshStandardMaterial({color:i%2?0xd8d0c0:0x9a1c14,roughness:0.6})); t.rotation.z=i*Math.PI/4; rb.add(t); } rb.position.set(-X+0.08,1.5,-0.2); rb.rotation.y=Math.PI/2; G.add(rb);
 const ck=document.createElement('canvas'); ck.width=ck.height=256; { const x=ck.getContext('2d'); x.fillStyle='#d8d6cc'; x.beginPath(); x.arc(128,128,124,0,7); x.fill(); x.strokeStyle='#202020'; x.lineWidth=8; x.stroke(); x.fillStyle='#202020'; for(let i=0;i<60;i++){ const a=i/60*Math.PI*2, l=i%5?6:18; x.save(); x.translate(128,128); x.rotate(a); x.fillRect(-1.5-(i%5?0:1.5),-118,i%5?3:6,l); x.restore(); }
  const hand=(a,l,w)=>{ x.save(); x.translate(128,128); x.rotate(a); x.fillRect(-w/2,-l,w,l+14); x.restore(); }; hand((11+59/60)/12*Math.PI*2,62,9); hand(59/60*Math.PI*2,100,6); x.fillStyle='#7a1010'; hand(0.6,104,2); }
 const clk=new T.Mesh(new T.CircleGeometry(0.42,40),new T.MeshStandardMaterial({map:new T.CanvasTexture(ck),roughness:0.5})); clk.position.set(0,3.6,ZF+0.02); G.add(clk);
 const bench=new T.Group(); const wd=new T.MeshStandardMaterial({color:0x4a3a2a,roughness:0.75}); [0,0.12,0.24].forEach(o=>{ const s=new T.Mesh(new T.BoxGeometry(2.2,0.04,0.1),wd); s.position.set(0,0.45,o); bench.add(s); }); [-0.95,0.95].forEach(o=>{ const l=new T.Mesh(new T.BoxGeometry(0.05,0.45,0.32),chrome); l.position.set(o,0.225,0.12); bench.add(l); }); bench.position.set(-3.4,0,ZB-0.5); G.add(bench);
 const sg=document.createElement('canvas'); sg.width=512; sg.height=256; { const x=sg.getContext('2d'); x.fillStyle='#c8ccc0'; x.fillRect(0,0,512,256); x.fillStyle='#14306a'; x.font='bold 46px Arial'; x.textAlign='center'; x.fillText('BADEORDNUNG',256,70); x.font='28px Arial'; x.fillStyle='#202020'; ['Nicht vom Rand springen','Nicht rennen','Badeschluss 22:00 Uhr'].forEach((t,i)=>x.fillText(t,256,125+i*42)); x.fillStyle='rgba(60,50,20,0.25)'; for(let i=0;i<40;i++) x.fillRect(Math.random()*512,Math.random()*256,Math.random()*30,2); }
 const sgn=new T.Mesh(new T.PlaneGeometry(0.9,0.45),new T.MeshStandardMaterial({map:new T.CanvasTexture(sg),roughness:0.5})); sgn.position.set(X-0.02,1.7,-2.2); sgn.rotation.y=-Math.PI/2; G.add(sgn);
 // Pfützen (nass, glatter) auf dem Deck
 const pc=document.createElement('canvas'); pc.width=pc.height=128; { const x=pc.getContext('2d'); const g=x.createRadialGradient(64,64,10,64,64,64); g.addColorStop(0,'#fff'); g.addColorStop(0.6,'#999'); g.addColorStop(1,'#000'); x.fillStyle=g; x.fillRect(0,0,128,128); }
 const pud=new T.MeshStandardMaterial({color:0x0c1818,roughness:0.03,metalness:0.1,transparent:true,opacity:0.22,alphaMap:new T.CanvasTexture(pc),envMap:env,envMapIntensity:2,depthWrite:false});
 [[-1.2,0.3,0.9],[1.6,1.4,0.6],[-3.9,-3,0.8],[0.4,-0.5,0.5]].forEach(([x,z,s])=>{ const p=new T.Mesh(new T.CircleGeometry(s,24),pud); p.rotation.x=-Math.PI/2; p.scale.set(1,0.6+rnd()*0.5,1); p.position.set(x,0.004,z); G.add(p); });
 // ---- Ton: Tropfen (räumlich, zufällig) ----
 let ac=null; const drip=()=>{ if(!ac) return; const t=ac.currentTime, o=ac.createOscillator(), g=ac.createGain(), pn=ac.createPanner(); pn.panningModel='HRTF'; pn.refDistance=1.5; pn.positionX.value=(rnd()-0.5)*10; pn.positionY.value=0; pn.positionZ.value=-1-rnd()*9; o.frequency.setValueAtTime(1400+rnd()*900,t); o.frequency.exponentialRampToValueAtTime(380,t+0.08); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.18,t+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t+0.14); o.connect(g).connect(pn).connect(ac.destination); o.start(t); o.stop(t+0.16); setTimeout(drip,1200+rnd()*3800); };
 const startA=()=>{ if(ac) return; ac=new (window.AudioContext||window.webkitAudioContext)(); setTimeout(drip,800); }; ['click','keydown','touchstart'].forEach(e=>window.addEventListener(e,startA,{once:true})); sc.addEventListener('enter-vr',startA);
 // ---- Animation ----
 let flk=1; const update=(t)=>{ const s=t*0.001; wn.offset.set(s*0.012,s*0.02); wn2.offset.set(-s*0.008,s*0.011); ca.offset.set(s*0.02,s*0.013); ca2.offset.set(-s*0.015,s*0.018);
  if(Math.random()<0.04) flk=Math.random()<0.55?0:1; LF.intensity=flk*4.5; tFl.color.setHex(flk?0xd8fff4:0x303634);
  steam.forEach(sp=>{ sp.position.x=sp.userData.x+Math.sin(s*0.07+sp.userData.ph)*0.6; sp.position.y+=0.0006; if(sp.position.y>1.6) sp.position.y=0.15; }); };
 AFRAME.registerComponent('pool-tick',{tick(t){ update(t); }}); sc.setAttribute('pool-tick','');
 const collide=(p)=>{ /* Deck vor dem Becken; Startblöcke */ };
 return {water,update};
};
})();
