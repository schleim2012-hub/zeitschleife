/* Kirmes – echtes 3D in Schichten statt Fotowänden. nah: nasses Pflaster mit Bulb-Spiegelungen, Kabel, Becher, Popcorn · mittel: geschlossene Buden mit Rollläden,
   Wohnwagen mit Fensterschein · fern: Riesenrad (dreht langsam, Bulbs instanziert), Karussell-Dach, AUTOSCOOTER-Neon, Dunst.
   kirmesEnv(sceneEl) baut die Welt; kirmesOptimize(groups,bulbs,glows) backt statische Buden-Deko pro Material, instanziert Bulbs, ersetzt Glow-Sprites durch 1 Points-Wolke. */
(function(){
let sd=1979; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
const T=()=>THREE;
const mergeG=gs=>{ const T3=THREE; gs=gs.map(g=>{ g=g.index?g.toNonIndexed():g; if(!g.attributes.uv) g.setAttribute('uv',new T3.BufferAttribute(new Float32Array(g.attributes.position.count*2),2)); if(!g.attributes.normal) g.computeVertexNormals(); return g; }); let n=0; gs.forEach(g=>n+=g.attributes.position.count); const r=new T3.BufferGeometry(); ['position','normal','uv','color'].forEach(k=>{ if(!gs.every(g=>g.attributes[k])) return; const sz=gs[0].attributes[k].itemSize,a=new Float32Array(n*sz); let o=0; gs.forEach(g=>{ a.set(g.attributes[k].array,o); o+=g.attributes[k].array.length; }); r.setAttribute(k,new T3.BufferAttribute(a,sz)); }); return r; };
window.kirmesEnv=function(sc){ const T=THREE, S=sc.object3D, TL=new T.TextureLoader(), G=new T.Group(); S.add(G);
 const ld=(f,srgb,rx)=>{ const t=TL.load(f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; if(rx) t.repeat.set(rx,rx); return t; };
 const cv=(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t; };
 const halo=cv(128,128,x=>{ const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.3,'rgba(255,255,255,0.3)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 const env=(()=>{ const t=cv(512,256,(x,w,h)=>{ x.fillStyle='#060406'; x.fillRect(0,0,w,h); for(let i=0;i<60;i++){ x.fillStyle=['#ffd27a','#ff7fb8','#8ff0ff','#ffb35a'][i%4]; x.fillRect(Math.random()*w,60+Math.random()*50,4,4); } x.fillStyle='#ff9a3c'; x.fillRect(200,90,120,16); const g=x.createLinearGradient(0,128,0,256); g.addColorStop(0,'#1a1010'); g.addColorStop(1,'#030203'); x.fillStyle=g; x.fillRect(0,128,w,128); }); t.mapping=T.EquirectangularReflectionMapping; const pm=new T.PMREMGenerator(sc.renderer); const e=pm.fromEquirectangular(t).texture; pm.dispose(); return e; })();
 // ---- Boden: nasses Kopfsteinpflaster ----
 const fm=new T.MeshStandardMaterial({map:ld('../assets/tex/s89/cob_c.jpg',1,18),normalMap:ld('../assets/tex/s89/cob_n.jpg',0,18),roughnessMap:ld('../assets/tex/s89/cob_r.jpg',0,18),roughness:1,metalness:0.1,envMap:env,envMapIntensity:1.0,color:0xb0a8a0});
 const fl=new T.Mesh(new T.CircleGeometry(24,48),fm); fl.rotation.x=-Math.PI/2; G.add(fl);
 // ---- Riesenrad fern (dreht), Bulbs instanziert ----
 const W=new T.Group(); W.position.set(-5.5,8.6,-19); G.add(W); const steel=new T.MeshStandardMaterial({color:0x1a1a20,roughness:0.5,metalness:0.7}); const wg=new T.Group();
 [0,1].forEach(s=>{ const r=new T.Mesh(new T.TorusGeometry(7,0.08,6,64)); r.position.z=s?0.6:-0.6; wg.add(r); for(let i=0;i<16;i++){ const a=i/16*6.28; const sp=new T.Mesh(new T.CylinderGeometry(0.04,0.04,7,4)); sp.position.set(Math.cos(a)*3.5,Math.sin(a)*3.5,s?0.6:-0.6); sp.rotation.z=a-Math.PI/2; wg.add(sp); } });
 const wm=mergeFlat(wg,steel); W.add(wm);
 const gond=new T.Group(); for(let i=0;i<16;i++){ const a=i/16*6.28; const g=new T.Mesh(new T.BoxGeometry(0.9,0.8,1.0)); g.position.set(Math.cos(a)*7,Math.sin(a)*7-0.7,0); gond.add(g); } const gm=mergeFlat(gond,new T.MeshStandardMaterial({color:0x2a1418,roughness:0.6})); W.add(gm);
 const BN=96, bulbG=new T.SphereGeometry(0.09,6,4), bulbI=new T.InstancedMesh(bulbG,new T.MeshBasicMaterial({toneMapped:false}),BN); const M4=new T.Matrix4(); const bc=[0xffd27a,0xff7fb8,0x8ff0ff,0xffb35a];
 for(let i=0;i<BN;i++){ const k=i%48, a=k/48*6.28, z=i<48?0.65:-0.65; M4.makeTranslation(Math.cos(a)*7.1,Math.sin(a)*7.1,z); bulbI.setMatrixAt(i,M4); bulbI.setColorAt(i,new T.Color(bc[k%4]).multiplyScalar(1.6)); } W.add(bulbI);
 const hub=new T.Sprite(new T.SpriteMaterial({map:halo,color:0xff9a50,transparent:true,opacity:0.5,blending:T.AdditiveBlending,depthWrite:false})); hub.scale.set(3,3,1); W.add(hub);
 const wglow=new T.Mesh(new T.RingGeometry(6.4,7.8,48),new T.MeshBasicMaterial({map:halo,color:0x6a3a20,transparent:true,opacity:0.35,blending:T.AdditiveBlending,depthWrite:false})); W.add(wglow);
 // Stützen
 { const st=new T.Group(); [-1,1].forEach(s=>[-1,1].forEach(q=>{ const L=Math.hypot(4.5,8.6); const b=new T.Mesh(new T.CylinderGeometry(0.1,0.14,L,6)); b.position.set(-5.5+s*2.25,4.3,-19+q*0.9); b.rotation.z=-s*Math.atan2(4.5,8.6); st.add(b); })); G.add(mergeFlat(st,steel)); }
 // ---- Karussell mittel-rechts: Kegeldach mit Bulb-Kranz + Pferde-Silhouetten ----
 const K=new T.Group(); K.position.set(7.5,0,-11); G.add(K);
 { const kg=new T.Group(); const roof=new T.Mesh(new T.ConeGeometry(4.2,1.8,24,1,true)); roof.position.y=4.6; kg.add(roof); const fr=new T.Mesh(new T.CylinderGeometry(4.2,4.2,0.5,24,1,true)); fr.position.y=3.45; kg.add(fr); const pole=new T.Mesh(new T.CylinderGeometry(0.25,0.25,4,10)); pole.position.y=2; kg.add(pole); const base=new T.Mesh(new T.CylinderGeometry(4.0,4.1,0.35,24)); base.position.y=0.17; kg.add(base);
   for(let i=0;i<12;i++){ const a=i/12*6.28; const p=new T.Mesh(new T.CylinderGeometry(0.03,0.03,3.1,5)); p.position.set(Math.cos(a)*3.2,1.9,Math.sin(a)*3.2); kg.add(p); const h=new T.Mesh(new T.BoxGeometry(0.25,0.45,0.9)); h.position.set(Math.cos(a)*3.2,1.1+0.2*Math.sin(i),Math.sin(a)*3.2); h.rotation.y=-a; kg.add(h); }
   const stripes=cv(256,64,(x,w,h)=>{ for(let i=0;i<16;i++){ x.fillStyle=i%2?'#e8dcc0':'#a82028'; x.fillRect(i*16,0,16,h); } }); stripes.wrapS=T.RepeatWrapping; stripes.repeat.set(3,1);
   K.add(mergeFlat(kg,new T.MeshStandardMaterial({map:stripes,roughness:0.7,color:0x8a8080})));
   const KB=40, kbI=new T.InstancedMesh(new T.SphereGeometry(0.06,6,4),new T.MeshBasicMaterial({toneMapped:false}),KB); for(let i=0;i<KB;i++){ const a=i/KB*6.28; M4.makeTranslation(Math.cos(a)*4.25,3.25,Math.sin(a)*4.25); kbI.setMatrixAt(i,M4); kbI.setColorAt(i,new T.Color(bc[i%4]).multiplyScalar(1.5)); } K.add(kbI); K.userData.b=kbI;
   const kh=new T.Sprite(new T.SpriteMaterial({map:halo,color:0xff9a50,transparent:true,opacity:0.25,blending:T.AdditiveBlending,depthWrite:false})); kh.position.y=3.3; kh.scale.set(11,4,1); K.add(kh); }
 // ---- AUTOSCOOTER-Neon links mittel ----
 { const t=cv(1024,160,(x,w,h)=>{ x.fillStyle='#000'; x.fillRect(0,0,w,h); x.font='bold 120px Arial'; x.textAlign='center'; x.textBaseline='middle'; x.lineJoin='round'; [[30,10,'#30d8ff'],[10,6,'#30d8ff'],[0,2.5,'#ffffffd0']].forEach(([b,l,c])=>{ x.shadowColor='#30d8ff'; x.shadowBlur=b; x.strokeStyle=c; x.lineWidth=l; x.strokeText('AUTOSCOOTER',w/2,h/2); }); });
   const m=new T.Mesh(new T.PlaneGeometry(5,0.8),new T.MeshBasicMaterial({map:t,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false})); m.position.set(-9.5,4.2,-8); m.rotation.y=0.7; G.add(m);
   const hs=new T.Sprite(new T.SpriteMaterial({map:halo,color:0x30a8ff,transparent:true,opacity:0.3,blending:T.AdditiveBlending,depthWrite:false})); hs.position.set(-9.4,4.2,-7.8); hs.scale.set(7,3,1); G.add(hs);
   const hall=new T.Mesh(new T.BoxGeometry(10,3.8,6),new T.MeshStandardMaterial({color:0x14141a,roughness:0.8})); hall.position.set(-12,1.9,-10.5); hall.rotation.y=0.7; G.add(hall); }
 // ---- Geschlossene Buden rund um den Platz (Rollladen), Wohnwagen mit Fensterschein ----
 const shut=new T.MeshStandardMaterial({map:ld('../assets/tex/s41/shutter_c.jpg',1),color:0x6a6058,roughness:0.6,metalness:0.4}); const wood=new T.MeshStandardMaterial({color:0x2a1c14,roughness:0.9}); const sg=new T.Group(), wg2=new T.Group();
 const closed=(x,z,ry,col)=>{ const g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry; const b=new T.Mesh(new T.BoxGeometry(2.6,2.7,1.8)); b.position.y=1.35; wg2.add(Object.assign(b,{})); const s=new T.Mesh(new T.PlaneGeometry(2.3,1.6)); s.position.set(0,1.6,0.91); g.add(s); const r=new T.Mesh(new T.BoxGeometry(2.8,0.12,2.0)); r.position.y=2.76; g.add(r); g.updateMatrixWorld(true); b.applyMatrix4(g.matrixWorld); s.applyMatrix4(g.matrixWorld); r.applyMatrix4(g.matrixWorld); sg.add(s); wg2.add(r); };
 [[-6.2,1.5,1.2],[-6.8,4.8,1.6],[-4.0,7.4,2.6],[0.5,8.2,3.14],[4.2,7.3,-2.6],[6.6,4.6,-1.7],[-7.2,-2.4,0.9],[7.4,-3.6,-1.0]].forEach(([x,z,r])=>closed(x,z,r));
 G.add(mergeFlat(sg,shut)); G.add(mergeFlat(wg2,wood));
 const cara=new T.Group(); const cwin=[]; [[-9.5,-1.0,1.3],[9.8,1.2,-1.5],[-2.5,-11.5,0.2]].forEach(([x,z,r])=>{ const g=new T.Group(); g.position.set(x,0,z); g.rotation.y=r; const b=new T.Mesh(new T.BoxGeometry(4.5,2.2,2.1)); b.position.y=1.45; g.add(b); [-1.4,1.4].forEach(wx=>{ const w=new T.Mesh(new T.CylinderGeometry(0.33,0.33,0.2,12)); w.rotation.x=Math.PI/2; w.position.set(wx*0.6,0.33,1.06); g.add(w); }); g.updateMatrixWorld(true); g.children.forEach(c=>{ c.applyMatrix4(g.matrixWorld); }); [...g.children].forEach(c=>cara.add(c)); const wp=new T.Mesh(new T.PlaneGeometry(0.9,0.5)); wp.position.set(0.8,1.7,1.06); g.add(wp); g.updateMatrixWorld(true); wp.applyMatrix4(g.matrixWorld); cwin.push(wp); });
 G.add(mergeFlat(cara,new T.MeshStandardMaterial({color:0x6a6460,roughness:0.5,metalness:0.2,envMap:env,envMapIntensity:0.4})));
 const curT=cv(64,64,(x)=>{ const g=x.createLinearGradient(0,0,0,64); g.addColorStop(0,'#ffc070'); g.addColorStop(1,'#a05020'); x.fillStyle=g; x.fillRect(0,0,64,64); x.fillStyle='rgba(60,20,0,0.5)'; for(let i=0;i<64;i+=5) x.fillRect(i,0,2,64); });
 const cw=new T.Group(); cwin.forEach(w=>cw.add(w)); G.add(mergeFlat(cw,new T.MeshBasicMaterial({map:curT,color:0x9a7050})));
 // ---- Grime: Kabel am Boden, Becher, Popcorn, Pfützen ----
 { const cab=new T.Group(); [[[-4.5,-1.0],[-3.5,0.5],[-1,1.2],[2.5,0.6],[4.2,0.3]],[[-2.5,-1.6],[-3.2,2.0],[-5.5,3.8]]].forEach(pts=>{ const c=new T.CatmullRomCurve3(pts.map(([x,z])=>new T.Vector3(x,0.015,z))); cab.add(new T.Mesh(new T.TubeGeometry(c,60,0.015,4))); }); G.add(mergeFlat(cab,new T.MeshStandardMaterial({color:0x080808,roughness:0.4})));
   const cg=[]; for(let i=0;i<14;i++){ const g=new T.CylinderGeometry(0.035,0.025,0.09,8,1,true); if(rnd()<0.7){ g.rotateZ(Math.PI/2); g.rotateY(rnd()*6); g.translate((rnd()-0.5)*8,0.035,-1+rnd()*5.5); } else g.translate((rnd()-0.5)*8,0.045,-1+rnd()*5.5); cg.push(g); }
   for(let i=0;i<90;i++){ const g=new T.IcosahedronGeometry(0.012,0); g.translate(-2+(rnd()-0.5)*3,0.01,0.5+(rnd()-0.5)*3); cg.push(g); } G.add(new T.Mesh(mergeG(cg),new T.MeshStandardMaterial({color:0xe8dcc0,roughness:0.7,side:T.DoubleSide})));
   const pa=cv(256,256,(x)=>{ const g=x.createRadialGradient(128,128,10,128,128,128); g.addColorStop(0,'#fff'); g.addColorStop(0.6,'#aaa'); g.addColorStop(1,'#000'); x.fillStyle=g; x.fillRect(0,0,256,256); });
   const pq=[[-1.2,-0.6,2.2,1.3],[1.8,0.8,1.6,1.0],[0.2,2.6,2.6,1.4],[-3.5,1.0,1.4,0.9]].map(([x,z,w,d])=>{ const g=new T.PlaneGeometry(w,d); g.rotateX(-Math.PI/2); g.translate(x,0.004,z); return g; });
   G.add(new T.Mesh(mergeG(pq),new T.MeshStandardMaterial({color:0x020203,roughness:0.02,metalness:0.85,transparent:true,alphaMap:pa,depthWrite:false,envMap:env,envMapIntensity:1.4}))); }
 // Dunst
 [[0,1.5,-6,14,0.08,0x5a3a40],[0,3,-14,26,0.12,0x3a2430],[-5.5,8,-17,16,0.06,0x6a3a20],[0,1,5,14,0.05,0x2a2030]].forEach(([x,y,z,s,o,c])=>{ const h=new T.Sprite(new T.SpriteMaterial({map:halo,color:c,transparent:true,opacity:o,depthWrite:false,blending:T.AdditiveBlending})); h.position.set(x,y,z); h.scale.set(s,s*0.5,1); G.add(h); });
 S.add(new T.HemisphereLight(0x2a2028,0x080406,0.35));
 const update=(t)=>{ const s=t*0.001; W.rotation.z=-s*0.04; const kb=K.userData.b; if(kb){ const ph=Math.floor(s*6)%4; for(let i=0;i<kb.count;i++){ kb.setColorAt(i,new T.Color(bc[(i+ph)%4]).multiplyScalar((i+ph)%3===0?0.4:1.5)); } kb.instanceColor.needsUpdate=true; } };
 return {update,env};
};
function mergeFlat(grp,mat){ const T3=THREE; grp.updateMatrixWorld(true); const gs=[]; grp.traverse(o=>{ if(o.isMesh){ let g=o.geometry.clone(); g.applyMatrix4(o.matrixWorld); ['color','uv1'].forEach(k=>g.attributes[k]&&g.deleteAttribute(k)); gs.push(g); } }); const m=new T3.Mesh(mergeG(gs),mat); m.matrixAutoUpdate=false; return m; }
// ---- Optimierung: statische Buden-Deko pro Material backen, Bulbs instanzieren, Glows → Points ----
window.kirmesMergeChildren=function(groups){ const T=THREE; const sig=m=>[m.type,m.color&&m.color.getHex(),m.map&&m.map.uuid,m.normalMap&&m.normalMap.uuid,m.transparent,m.side,m.toneMapped,m.alphaTest].join('|'); let saved=0;
 groups.forEach(g=>{ const b=new Map(); const rm=[]; g.children.forEach(o=>{ if(!o.isMesh||o.isInstancedMesh||!o.material||Array.isArray(o.material)||o.material.visible===false||!o.visible) return; o.updateMatrix(); const k=sig(o.material); if(!b.has(k)) b.set(k,{m:o.material,gs:[],ud:o.userData}); const geo=o.geometry.clone(); geo.applyMatrix4(o.matrix); ['uv1','color'].forEach(a=>geo.attributes[a]&&geo.deleteAttribute(a)); b.get(k).gs.push(geo); rm.push(o); });
  b.forEach(({m,gs,ud})=>{ if(gs.length<2) return; }); rm.forEach(o=>{ const k=sig(o.material); if(b.get(k).gs.length>1){ g.remove(o); } });
  b.forEach(({m,gs,ud})=>{ if(gs.length<2) return; const mm=new T.Mesh(mergeG(gs),m); mm.userData=Object.assign({},ud); g.add(mm); saved+=gs.length-1; }); }); return saved; };
window.kirmesOptimize=function(S,groups,bulbs,glows){ const T=THREE; const sig=m=>[m.type,m.color&&m.color.getHex(),m.map&&m.map.uuid,m.normalMap&&m.normalMap.uuid,m.transparent,m.side,m.toneMapped,m.visible].join('|');
 groups.forEach(g=>{ g.updateMatrixWorld(true); const inv=g.matrixWorld.clone().invert(); const buckets=new Map(); const rm=[];
  g.traverse(o=>{ if(!o.isMesh||o.isInstancedMesh||!o.material||Array.isArray(o.material)||!o.material.visible) return; const m=o.material; const k=sig(m); if(!buckets.has(k)) buckets.set(k,{m,gs:[]}); const geo=o.geometry.clone(); geo.applyMatrix4(inv.clone().multiply(o.matrixWorld)); ['uv1','color'].forEach(a=>geo.attributes[a]&&geo.deleteAttribute(a)); buckets.get(k).gs.push(geo); rm.push(o); });
  rm.forEach(o=>o.parent.remove(o)); buckets.forEach(({m,gs})=>{ const mm=new T.Mesh(mergeG(gs),m); mm.userData.stall=g; g.add(mm); }); });
 // Lichterketten-Bulbs → 1 InstancedMesh (Farbe wird pro Frame aus den Original-Materialfarben gelesen)
 const N=bulbs.length; const inst=new T.InstancedMesh(new T.SphereGeometry(0.03,8,6),new T.MeshBasicMaterial({toneMapped:false}),N); const M4=new T.Matrix4();
 bulbs.forEach((b,i)=>{ b.updateMatrixWorld(true); inst.setMatrixAt(i,b.matrixWorld); inst.setColorAt(i,b.material.color); b.visible=false; }); S.add(inst);
 // Glows → Points
 const gp=new Float32Array(glows.length*3), gc=new Float32Array(glows.length*3); glows.forEach((g,i)=>{ const p=new T.Vector3(); g.getWorldPosition(p); gp.set([p.x,p.y,p.z],i*3); const c=g.material.color; gc.set([c.r*0.7,c.g*0.7,c.b*0.7],i*3); g.visible=false; });
 const pg=new T.BufferGeometry(); pg.setAttribute('position',new T.BufferAttribute(gp,3)); pg.setAttribute('color',new T.BufferAttribute(gc,3));
 const pts=new T.Points(pg,new T.PointsMaterial({map:glows[0]&&glows[0].material.map,size:0.42,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,sizeAttenuation:true})); S.add(pts);
 return {sync(){ bulbs.forEach((b,i)=>inst.setColorAt(i,b.material.color)); inst.instanceColor.needsUpdate=true; }};
};
})();
