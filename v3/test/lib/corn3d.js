/* Maisfeld bei Nacht mit UFO – echtes 3D. Boden y=0. Mais instanziert, entlang z periodisch (P=3,5 m) → Möbius-Schleife nahtlos.
   window.buildCorn(sceneEl,C) → {ufo, P, update} */
(function(){
const P=3.5; let sd=7; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
window.buildCorn=function(sc,C){ const T=THREE, S=sc.object3D, TL=new T.TextureLoader(), G=new T.Group(); S.add(G); const B='../assets/tex/corn/';
 const ld=(f,srgb,rep)=>{ const t=TL.load(B+f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; if(rep) t.repeat.set(rep,rep); t.anisotropy=4; return t; };
 // ---------- Boden mit Furchen ----------
 const gg=new T.PlaneGeometry(63,63,252,30); gg.rotateX(-Math.PI/2); { const p=gg.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i); const ax=Math.abs(x); let y=0; if(ax>1.35) y=0.06*Math.pow(Math.cos((ax-1.6)/0.75*Math.PI),2)-0.03; else y=-0.01+0.012*Math.sin(x*7); p.setY(i,y); } gg.computeVertexNormals(); }
 const soil=new T.MeshStandardMaterial({map:ld('soil_c.jpg',1,18),normalMap:ld('soil_n.jpg',0,18),roughness:0.98}); const ground=new T.Mesh(gg,soil); ground.position.z=-6; G.add(ground);
 // ---------- Maispflanze (eine Geometrie) ----------
 const parts=[]; const leafG=(len,wid,ang,yaw,y0)=>{ const g=new T.PlaneGeometry(wid,len,1,5); g.translate(0,len/2,0); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const v=p.getY(i)/len; const bend=v*v*0.55*len; p.setZ(i,bend); p.setY(i,p.getY(i)*(1-0.35*v*v)); }
  g.rotateX(-ang); g.rotateY(yaw); g.translate(0,y0,0); return g; };
 const stalk=new T.CylinderGeometry(0.009,0.016,1,5,3,true); stalk.translate(0,0.5,0); { const uv=stalk.attributes.uv; for(let i=0;i<uv.count;i++){ uv.setXY(i,0.45+uv.getX(i)*0.1,0.05+uv.getY(i)*0.3); } }
 const mkPlant=h=>{ const gs=[]; const s=stalk.clone(); s.scale(1,h,1); gs.push(s); const n=5; for(let k=0;k<n;k++){ gs.push(leafG(0.55+rnd()*0.35,0.075,0.5+rnd()*0.5,k*2.4+rnd()*0.6,0.3+k*(h-0.7)/n)); }
  const tas=leafG(0.25,0.03,0.15,rnd()*3,h-0.05); gs.push(tas); if(rnd()<0.6){ const cob=new T.SphereGeometry(1,6,4); cob.scale(0.025,0.11,0.025); cob.rotateZ(0.35); cob.translate(0.03,h*0.52,0); const uv=cob.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,0.5,0.45+uv.getY(i)*0.2); gs.push(cob); }
  return merge(gs); };
 function merge(gs){ let n=0,ix=0; gs.forEach(g=>{ g=g.index?g:g; n+=g.attributes.position.count; ix+=g.index?g.index.count:g.attributes.position.count; }); const pos=new Float32Array(n*3), nor=new Float32Array(n*3), uv=new Float32Array(n*2), ind=new Uint32Array(ix); let o=0, oi=0;
  gs.forEach(g=>{ if(!g.attributes.normal) g.computeVertexNormals(); pos.set(g.attributes.position.array,o*3); nor.set(g.attributes.normal.array,o*3); uv.set(g.attributes.uv.array,o*2); const I=g.index?g.index.array:[...Array(g.attributes.position.count).keys()]; for(let k=0;k<I.length;k++) ind[oi+k]=I[k]+o; oi+=I.length; o+=g.attributes.position.count; });
  const r=new T.BufferGeometry(); r.setAttribute('position',new T.BufferAttribute(pos,3)); r.setAttribute('normal',new T.BufferAttribute(nor,3)); r.setAttribute('uv',new T.BufferAttribute(uv,2)); r.setIndex(new T.BufferAttribute(ind,1)); return r; }
 const plantG=[mkPlant(2.3),mkPlant(2.05)];
 const leafM=new T.MeshStandardMaterial({map:ld('leaf.png',1),alphaTest:0.5,side:T.DoubleSide,roughness:0.85,metalness:0});
 // Reihen parallel zum Weg, Muster pro Periode P wiederholt
 const rows=[]; for(let k=0;k<8;k++){ rows.push(1.65+k*0.75); rows.push(-1.65-k*0.75); }
 const per=rows.map(()=>{ const a=[]; for(let z=0;z<P-0.01;z+=0.29) a.push({z:z+(rnd()-0.5)*0.12, dx:(rnd()-0.5)*0.12, ry:rnd()*6.28, s:0.85+rnd()*0.3, tx:(rnd()-0.5)*0.08, tz:(rnd()-0.5)*0.08, v:rnd(), g:rnd()<0.5?0:1}); return a; });
 const Z0=-6*P, Z1=4*P; const inst=[[],[]];
 rows.forEach((x,ri)=>{ for(let pz=Z0; pz<Z1; pz+=P) per[ri].forEach(q=>{ const z=pz+q.z; const d=Math.hypot(x,z); if(d>13.5) return; inst[q.g].push([x+q.dx,z,q]); }); });
 const m4=new T.Matrix4(), qt=new T.Quaternion(), sc3=new T.Vector3(), ps=new T.Vector3(), eu=new T.Euler();
 inst.forEach((L,gi)=>{ const im=new T.InstancedMesh(plantG[gi],leafM,L.length); L.forEach(([x,z,q],i)=>{ eu.set(q.tx,q.ry,q.tz); qt.setFromEuler(eu); sc3.setScalar(q.s); ps.set(x,0,z); m4.compose(ps,qt,sc3); im.setMatrixAt(i,m4); const c=new T.Color().setHSL(0.17+q.v*0.07,0.35+q.v*0.2,0.32+q.v*0.12); im.setColorAt(i,c); }); im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; G.add(im); });
 // ---------- Ferne Schicht: Mais-Silhouetten-Ring + Himmel ----------
 const cv=(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t; };
 const skyT=cv(1024,512,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#010205'); g.addColorStop(0.42,'#060a16'); g.addColorStop(0.5,'#0e1424'); g.addColorStop(0.56,'#05070c'); g.addColorStop(1,'#020203'); x.fillStyle=g; x.fillRect(0,0,w,h); for(let i=0;i<500;i++){ x.fillStyle='rgba(220,230,255,'+(Math.random()**3*0.9)+')'; const s=Math.random()<0.05?2:1; x.fillRect(Math.random()*w,Math.random()*h*0.45,s,s); } });
 const sky=new T.Mesh(new T.SphereGeometry(80,32,16),new T.MeshBasicMaterial({map:skyT,side:T.BackSide,fog:false,depthWrite:false})); sky.renderOrder=-2; G.add(sky);
 const ringT=cv(2048,256,(x,w,h)=>{ x.clearRect(0,0,w,h); x.fillStyle='#030405'; x.fillRect(0,h*0.55,w,h); for(let i=0;i<900;i++){ const px=Math.random()*w, ph=h*(0.25+Math.random()*0.35); x.strokeStyle='#030405'; x.lineWidth=1+Math.random()*2; x.beginPath(); x.moveTo(px,h); x.lineTo(px+(Math.random()-0.5)*6,ph); x.stroke(); x.beginPath(); x.moveTo(px,ph+10); x.quadraticCurveTo(px+12*(Math.random()-0.5)*2,ph,px+18*(Math.random()-0.5)*2,ph+14); x.stroke(); } });
 ringT.wrapS=T.RepeatWrapping; ringT.repeat.x=3; const ring=new T.Mesh(new T.CylinderGeometry(22,22,5,64,1,true),new T.MeshBasicMaterial({map:ringT,transparent:true,side:T.BackSide,fog:false,color:0x9098a8})); ring.position.y=2.0; G.add(ring);
 // ---------- Licht: kaum Mond, das UFO ist die Lichtquelle ----------
 S.add(new T.HemisphereLight(0x1a2236,0x050403,0.9)); const moon=new T.DirectionalLight(0x6a80b0,0.55); moon.position.set(-8,10,6); S.add(moon);
 // ---------- UFO ----------
 const ufo=new T.Group(); ufo.position.set(1.2,6.2,-8.5); ufo.scale.setScalar(1.35); G.add(ufo);
 // Umgebung für Metall/Irisieren: kleine generierte Equirect-Map (bunte Flecken auf Dunkel)
 const envC=cv(256,128,(x,w,h)=>{ x.fillStyle='#05060a'; x.fillRect(0,0,w,h); [['#ff3050',40,90],['#30d0ff',130,40],['#ffb040',200,80],['#9050ff',90,30],['#40ff90',230,50]].forEach(([c,px,py])=>{ const g=x.createRadialGradient(px,py,0,px,py,40); g.addColorStop(0,c); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,w,h); }); });
 envC.mapping=T.EquirectangularReflectionMapping; const pm=new T.PMREMGenerator(sc.renderer); const env=pm.fromEquirectangular(envC).texture; pm.dispose();
 const prof=[[0,-0.32],[0.6,-0.3],[1.4,-0.2],[2.25,-0.06],[2.6,0],[2.3,0.07],[1.5,0.2],[0.95,0.32],[0,0.36]].map(([r,y])=>new T.Vector2(r,y));
 const hullM=new T.MeshPhysicalMaterial({color:0x9aa0aa,metalness:1,roughness:0.28,envMap:env,envMapIntensity:1.6,iridescence:1,iridescenceIOR:1.7,iridescenceThicknessRange:[150,800]});
 ufo.add(new T.Mesh(new T.LatheGeometry(prof,64),hullM));
 const domeM=new T.MeshPhysicalMaterial({color:0x203040,metalness:0.2,roughness:0.05,envMap:env,envMapIntensity:2,emissive:0x0a3040,emissiveIntensity:1,transparent:true,opacity:0.85});
 const dome=new T.Mesh(new T.SphereGeometry(0.9,32,16,0,Math.PI*2,0,Math.PI/2),domeM); dome.position.y=0.3; ufo.add(dome);
 // irisierender Rand: Regenbogenband (emissiv), läuft langsam um
 const rainT=cv(512,8,(x,w)=>{ for(let i=0;i<w;i++){ x.fillStyle='hsl('+(i/w*360)+',100%,60%)'; x.fillRect(i,0,1,8); } }); rainT.wrapS=T.RepeatWrapping; rainT.repeat.x=3;
 const rim=new T.Mesh(new T.TorusGeometry(2.58,0.06,10,128),new T.MeshBasicMaterial({map:rainT,color:0xc8c8c8,toneMapped:false,fog:false})); rim.rotation.x=Math.PI/2; ufo.add(rim);
 // rote Lichter unten, Lauflicht
 const reds=[]; for(let i=0;i<14;i++){ const a=i/14*Math.PI*2; const m=new T.Mesh(new T.SphereGeometry(0.07,10,8),new T.MeshBasicMaterial({color:0xff2020,toneMapped:false,fog:false})); m.position.set(Math.cos(a)*1.85,-0.2,Math.sin(a)*1.85); ufo.add(m); reds.push(m); }
 const gc=cv(128,128,x=>{ const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.2,'rgba(255,255,255,0.35)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 const halo=(c,s,o)=>{ const sp=new T.Sprite(new T.SpriteMaterial({map:gc,color:c,transparent:true,opacity:o,depthWrite:false,blending:T.AdditiveBlending,fog:false})); sp.scale.set(s,s,1); return sp; };
 reds.forEach(m=>{ const h=halo(0xff3030,0.6,0.8); m.add(h); m.userData.h=h; });
 const under=halo(0xff4060,8,0.3); under.position.y=-0.5; ufo.add(under);
 // schwacher Lichtkegel nach unten (Welt, additiv) + Staub darin
 const coneC=cv(64,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(170,230,255,0.55)'); g.addColorStop(1,'rgba(170,230,255,0)'); x.fillStyle=g; x.fillRect(0,0,w,h); });
 const cone=new T.Mesh(new T.CylinderGeometry(0.6,2.4,7.2,32,1,true),new T.MeshBasicMaterial({map:coneC,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,fog:false,opacity:0.35})); cone.position.y=-3.9; ufo.add(cone);
 const redL=new T.PointLight(0xff3048,14,30,1.5); redL.position.y=-1; ufo.add(redL);
 const beamL=new T.PointLight(0x80d8ff,6,12,1.8); beamL.position.set(0,-5.2,0); ufo.add(beamL);
 // ---------- Ton: UFO-Brummen räumlich (startet mit erster Nutzergeste) ----------
 let ac=null, pan=null; const startSnd=()=>{ if(ac) return; try{ ac=window.__zsaAC||(window.__zsaAC=new (window.AudioContext||window.webkitAudioContext)()); ac.resume(); const out=ac.createGain(); out.gain.value=0; pan=ac.createPanner(); pan.panningModel='HRTF'; pan.refDistance=6; pan.rolloffFactor=0.8; out.connect(pan); pan.connect(ac.destination);
   [[52,'sine',0.5],[104.5,'sine',0.2],[157,'triangle',0.08]].forEach(([f,ty,g])=>{ const o=ac.createOscillator(); o.type=ty; o.frequency.value=f; const gg=ac.createGain(); gg.gain.value=g; o.connect(gg); gg.connect(out); o.start(); });
   const lfo=ac.createOscillator(); lfo.frequency.value=0.35; const lg=ac.createGain(); lg.gain.value=0.15; lfo.connect(lg); lg.connect(out.gain); lfo.start(); out.gain.setTargetAtTime(0.35,ac.currentTime,2); }catch(e){} };
 ['click','touchstart','keydown'].forEach(ev=>window.addEventListener(ev,startSnd,{once:true})); sc.addEventListener('enter-vr',startSnd); [0,1].forEach(i=>sc.renderer.xr.getController(i).addEventListener('selectstart',startSnd));
 const v=new T.Vector3(), q=new T.Quaternion(), f=new T.Vector3(), u=new T.Vector3(); const base=ufo.position.clone();
 const update=(t)=>{ const k=t*0.001; ufo.position.y=base.y+Math.sin(k*0.7)*0.18; ufo.rotation.y=k*0.12; ufo.rotation.z=Math.sin(k*0.5)*0.03; rainT.offset.x=-k*0.08;
  reds.forEach((m,i)=>{ const on=((Math.floor(k*6)-i)%14+14)%14<3; m.material.color.setHex(on?0xff2a2a:0x400808); m.userData.h.material.opacity=on?0.85:0.1; }); cone.material.opacity=0.28+0.06*Math.sin(k*2.3);
  if(pan&&ac){ ufo.getWorldPosition(v); pan.positionX.value=v.x; pan.positionY.value=v.y; pan.positionZ.value=v.z; const c=sc.renderer.xr.isPresenting?sc.renderer.xr.getCamera():sc.camera; c.getWorldPosition(v); c.getWorldQuaternion(q); f.set(0,0,-1).applyQuaternion(q); u.set(0,1,0).applyQuaternion(q); const L=ac.listener; if(L.positionX){ L.positionX.value=v.x; L.positionY.value=v.y; L.positionZ.value=v.z; L.forwardX.value=f.x; L.forwardY.value=f.y; L.forwardZ.value=f.z; L.upX.value=u.x; L.upY.value=u.y; L.upZ.value=u.z; } } };
 AFRAME.registerComponent('corn-tick',{tick(t){ update(t); }}); sc.setAttribute('corn-tick','');
 const shift=dz=>{ base.z+=dz; ufo.position.z=base.z; };
 return {ufo,P,update,shift};
};
})();
