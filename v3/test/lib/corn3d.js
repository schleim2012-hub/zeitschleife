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
 const mkPlant=(h,det)=>{ const gs=[]; const s=new T.CylinderGeometry(0.009,0.016,1,5,det?3:1,true); s.translate(0,0.5,0); { const uv=s.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,0.45+uv.getX(i)*0.1,0.05+uv.getY(i)*0.3); } s.scale(1,h,1); gs.push(s);
  const n=det?7:3; for(let k=0;k<n;k++){ const g=det?leafG(0.5+rnd()*0.45,0.07+rnd()*0.03,0.35+rnd()*0.7,k*2.4+rnd()*0.8,0.25+k*(h-0.6)/n):leafG2(0.7,0.08,0.6,k*2.1,0.4+k*(h-0.8)/n); gs.push(g); }
  for(let k=0;k<(det?4:1);k++) gs.push(det?leafG(0.22+rnd()*0.1,0.02,0.1+rnd()*0.5,rnd()*6.3,h-0.06):leafG2(0.25,0.03,0.2,0,h-0.05));
  if(det&&rnd()<0.6){ const cob=new T.SphereGeometry(1,5,3); cob.scale(0.026,0.12,0.026); cob.rotateZ(0.35); cob.translate(0.03,h*0.52,0); const uv=cob.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,0.5,0.45+uv.getY(i)*0.2); gs.push(cob); }
  return merge(gs); };
 const leafG2=(len,wid,ang,yaw,y0)=>{ const g=new T.PlaneGeometry(wid,len,1,1); g.translate(0,len/2,0); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const v=p.getY(i)/len; p.setZ(i,v*v*0.5*len); } g.rotateX(-ang); g.rotateY(yaw); g.translate(0,y0,0); return g; };
 function merge(gs){ let n=0,ix=0; gs.forEach(g=>{ g=g.index?g:g; n+=g.attributes.position.count; ix+=g.index?g.index.count:g.attributes.position.count; }); const pos=new Float32Array(n*3), nor=new Float32Array(n*3), uv=new Float32Array(n*2), ind=new Uint32Array(ix); let o=0, oi=0;
  gs.forEach(g=>{ if(!g.attributes.normal) g.computeVertexNormals(); pos.set(g.attributes.position.array,o*3); nor.set(g.attributes.normal.array,o*3); uv.set(g.attributes.uv.array,o*2); const I=g.index?g.index.array:[...Array(g.attributes.position.count).keys()]; for(let k=0;k<I.length;k++) ind[oi+k]=I[k]+o; oi+=I.length; o+=g.attributes.position.count; });
  const r=new T.BufferGeometry(); r.setAttribute('position',new T.BufferAttribute(pos,3)); r.setAttribute('normal',new T.BufferAttribute(nor,3)); r.setAttribute('uv',new T.BufferAttribute(uv,2)); r.setIndex(new T.BufferAttribute(ind,1)); return r; }
 const plantG=[mkPlant(2.4,1),mkPlant(2.05,1),mkPlant(1.7,1),mkPlant(2.3,0),mkPlant(1.95,0)];
 const leafM=new T.MeshStandardMaterial({map:ld('leaf.png',1),alphaTest:0.5,side:T.DoubleSide,roughness:0.85,metalness:0});
 // Reihen parallel zum Weg, Muster pro Periode P wiederholt
 const rows=[]; [1.55,1.95,2.4].forEach(x=>{ rows.push({x,near:1}); rows.push({x:-x,near:1}); }); for(let k=0;k<7;k++){ rows.push({x:2.95+k*0.75}); rows.push({x:-2.95-k*0.75}); }
 const per=rows.map(r=>{ const a=[], step=r.near?0.19:0.3; for(let z=0;z<P-0.01;z+=step) a.push({z:z+(rnd()-0.5)*step*0.6, dx:(rnd()-0.5)*0.16, ry:rnd()*6.28, s:0.8+rnd()*0.4, tx:(rnd()-0.5)*0.12, tz:(rnd()-0.5)*0.12, v:rnd(), g:Math.floor(rnd()*3)}); return a; });
 const Z0=-6*P, Z1=4*P; const inst=[[],[],[],[],[]];
 rows.forEach((r,ri)=>{ for(let pz=Z0; pz<Z1; pz+=P) per[ri].forEach(q=>{ const z=pz+q.z, x=r.x+q.dx; const d=Math.hypot(x,z-0.3); if(d>14) return; const det=r.near&&d<7.5; inst[det?q.g:3+(q.g%2)].push([x,z,q]); }); });
 const m4=new T.Matrix4(), qt=new T.Quaternion(), sc3=new T.Vector3(), ps=new T.Vector3(), eu=new T.Euler();
 inst.forEach((L,gi)=>{ if(!L.length) return; const im=new T.InstancedMesh(plantG[gi],leafM,L.length); L.forEach(([x,z,q],i)=>{ eu.set(q.tx,q.ry,q.tz); qt.setFromEuler(eu); sc3.setScalar(q.s); ps.set(x,0,z); m4.compose(ps,qt,sc3); im.setMatrixAt(i,m4); const dry=q.v>0.85; const c=new T.Color().setHSL(dry?0.13:0.27+q.v*0.12,dry?0.35:0.4+q.v*0.25,dry?0.42:0.34+q.v*0.16); im.setColorAt(i,c); }); im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; G.add(im); });
 // Pfad-Ende: Mais wächst in den Weg und schließt ihn im Nebel (wandert beim Möbius-Sprung mit → nie erreichbar, kein Popping)
 const endG=new T.Group(); G.add(endG); { const L=[[],[]]; for(let z=-7.5; z>-16; z-=0.17) for(let x=-1.5; x<1.5; x+=0.2){ const t=Math.min(1,Math.max(0,(-z-7.5)/3.5)); const bend=Math.max(0,-z-8)*0.12; if(rnd()>t*t*0.9+0.05) continue; if(Math.abs(x+bend*0.5)<0.25*(1-t)) continue; L[rnd()<0.5?0:1].push([x+(rnd()-0.5)*0.15,z+(rnd()-0.5)*0.1]); }
  L.forEach((A,gi)=>{ const im=new T.InstancedMesh(plantG[3+gi],leafM,A.length); A.forEach(([x,z],i)=>{ eu.set((rnd()-0.5)*0.12,rnd()*6.28,(rnd()-0.5)*0.12); qt.setFromEuler(eu); sc3.setScalar(0.8+rnd()*0.45); ps.set(x,0,z); m4.compose(ps,qt,sc3); im.setMatrixAt(i,m4); const v=rnd(); im.setColorAt(i,new T.Color().setHSL(0.27+v*0.12,0.45+v*0.2,0.32+v*0.14)); }); im.frustumCulled=false; endG.add(im); }); }
 // ---------- Ferne Schicht: Mais-Silhouetten-Ring + Himmel ----------
 const cv=(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t; };
 const skyT=cv(1024,512,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#010205'); g.addColorStop(0.42,'#060a16'); g.addColorStop(0.5,'#0e1424'); g.addColorStop(0.56,'#05070c'); g.addColorStop(1,'#020203'); x.fillStyle=g; x.fillRect(0,0,w,h); for(let i=0;i<500;i++){ x.fillStyle='rgba(220,230,255,'+(Math.random()**3*0.9)+')'; const s=Math.random()<0.05?2:1; x.fillRect(Math.random()*w,Math.random()*h*0.45,s,s); } });
 const sky=new T.Mesh(new T.SphereGeometry(80,32,16),new T.MeshBasicMaterial({map:skyT,side:T.BackSide,fog:false,depthWrite:false})); sky.renderOrder=-2; G.add(sky);
 const ringT=cv(2048,256,(x,w,h)=>{ x.clearRect(0,0,w,h); x.fillStyle='#030405'; x.fillRect(0,h*0.55,w,h); for(let i=0;i<900;i++){ const px=Math.random()*w, ph=h*(0.25+Math.random()*0.35); x.strokeStyle='#030405'; x.lineWidth=1+Math.random()*2; x.beginPath(); x.moveTo(px,h); x.lineTo(px+(Math.random()-0.5)*6,ph); x.stroke(); x.beginPath(); x.moveTo(px,ph+10); x.quadraticCurveTo(px+12*(Math.random()-0.5)*2,ph,px+18*(Math.random()-0.5)*2,ph+14); x.stroke(); } });
 ringT.wrapS=T.RepeatWrapping; ringT.repeat.x=3; const ring=new T.Mesh(new T.CylinderGeometry(15.5,15.5,5,64,1,true),new T.MeshBasicMaterial({map:ringT,transparent:true,side:T.BackSide,fog:true,color:0x9098a8})); ring.position.y=2.0; G.add(ring);
 // ---------- Licht: kaum Mond, das UFO ist die Lichtquelle ----------
 S.add(new T.HemisphereLight(0x2a5a60,0x030403,0.7)); const moon=new T.DirectionalLight(0x8ff0d0,1.5); moon.position.set(2,12,-6); S.add(moon); const fill=new T.DirectionalLight(0x406080,0.35); fill.position.set(-4,3,8); S.add(fill);
 // ---------- UFO: flache Chromscheibe, weit weg & hoch, Irisieren nur als Spiegelung, schwache rote Lichter, Dunst davor ----------
 const ufo=new T.Group(); ufo.position.set(-1.6,5.6,-26); ufo.scale.setScalar(2.7); ufo.rotation.x=0.13; G.add(ufo);
 const envC=cv(512,256,(x,w,h)=>{ x.fillStyle='#020306'; x.fillRect(0,0,w,h); // Spiegelwelt: dunkel, Regenbogen-Streifen knapp über/unter dem Horizont, kühles Grün unten (Mais)
  for(let i=0;i<w;i++){ const hue=(i/w*720)%360; x.fillStyle='hsla('+hue+',90%,55%,0.85)'; x.fillRect(i,h*0.44,1,h*0.035); x.fillStyle='hsla('+((hue+120)%360)+',90%,50%,0.5)'; x.fillRect(i,h*0.53,1,h*0.025); }
  const g=x.createLinearGradient(0,h*0.56,0,h); g.addColorStop(0,'rgba(60,70,80,0.5)'); g.addColorStop(1,'rgba(10,12,16,0.4)'); x.fillStyle=g; x.fillRect(0,h*0.56,w,h*0.44); const s2=x.createLinearGradient(0,h*0.2,0,h*0.44); s2.addColorStop(0,'rgba(0,0,0,0)'); s2.addColorStop(1,'rgba(150,160,180,0.45)'); x.fillStyle=s2; x.fillRect(0,h*0.2,w,h*0.24);
  const t=x.createLinearGradient(0,0,0,h*0.4); t.addColorStop(0,'rgba(200,220,255,0.5)'); t.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=t; x.fillRect(w*0.3,0,w*0.15,h*0.4); });
 envC.mapping=T.EquirectangularReflectionMapping; const pm=new T.PMREMGenerator(sc.renderer); const env=pm.fromEquirectangular(envC).texture; pm.dispose();
 const prof=[[0,-0.22],[0.9,-0.2],[1.8,-0.12],[2.5,-0.03],[2.75,0.0],[2.5,0.035],[1.7,0.12],[1.0,0.2],[0.75,0.24],[0,0.26]].map(([r,y])=>new T.Vector2(r,y));
 const hullM=new T.MeshPhysicalMaterial({color:0xb0b4bc,metalness:1,roughness:0.16,envMap:env,envMapIntensity:2.2,iridescence:0.45,iridescenceIOR:1.5,iridescenceThicknessRange:[250,650],fog:false});
 ufo.add(new T.Mesh(new T.LatheGeometry(prof,96),hullM));
 const dome=new T.Mesh(new T.SphereGeometry(0.62,40,16,0,Math.PI*2,0,Math.PI/2),new T.MeshPhysicalMaterial({color:0x8a98a8,metalness:1,roughness:0.12,envMap:env,envMapIntensity:1.6,fog:false})); dome.scale.y=0.55; dome.position.y=0.24; ufo.add(dome);
 // Unterseite: dunkles Band mit eingelassenen roten Lichtern
 const band=new T.Mesh(new T.CylinderGeometry(1.75,1.55,0.09,64,1,true),new T.MeshStandardMaterial({color:0x111216,metalness:0.8,roughness:0.4,envMap:env,fog:false})); band.position.y=-0.17; ufo.add(band);
 const reds=[]; for(let i=0;i<16;i++){ const a=i/16*Math.PI*2; const m=new T.Mesh(new T.SphereGeometry(0.045,8,6),new T.MeshBasicMaterial({color:0xa01810,toneMapped:false,fog:false})); m.position.set(Math.cos(a)*1.66,-0.17,Math.sin(a)*1.66); ufo.add(m); reds.push(m); }
 const gc=cv(128,128,x=>{ const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.25,'rgba(255,255,255,0.3)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 const halo=(c,s,o)=>{ const sp=new T.Sprite(new T.SpriteMaterial({map:gc,color:c,transparent:true,opacity:o,depthWrite:false,blending:T.AdditiveBlending,fog:false})); sp.scale.set(s,s,1); return sp; };
 reds.forEach(m=>{ const h=halo(0xff2a20,0.28,0.45); m.add(h); m.userData.h=h; });
 // Dunstschein unter/um das UFO (weich, kein Kegel) + Dunstschichten zwischen UFO und Spieler
 const glowU=halo(0x4fa8a0,8,0.07); glowU.position.set(0,-0.8,0); ufo.add(glowU);
 [[-1.4,4.6,-16,20,0.06],[-0.8,3.4,-11,24,0.05]].forEach(([x,y,z,s,o])=>{ const hz=new T.Sprite(new T.SpriteMaterial({map:gc,color:0x22403e,transparent:true,opacity:o,depthWrite:false,fog:false})); hz.position.set(x,y,z); hz.scale.set(s,s*0.45,1); G.add(hz); });
 const redL=new T.PointLight(0xff3020,1.2,30,1.2); redL.position.y=-0.8; ufo.add(redL);
 // ---------- Ton: UFO-Brummen räumlich (startet mit erster Nutzergeste) ----------
 let ac=null, pan=null; const startSnd=()=>{ if(ac) return; try{ ac=window.__zsaAC||(window.__zsaAC=new (window.AudioContext||window.webkitAudioContext)()); ac.resume(); const out=ac.createGain(); out.gain.value=0; pan=ac.createPanner(); pan.panningModel='HRTF'; pan.refDistance=6; pan.rolloffFactor=0.8; out.connect(pan); pan.connect(ac.destination);
   [[52,'sine',0.5],[104.5,'sine',0.2],[157,'triangle',0.08]].forEach(([f,ty,g])=>{ const o=ac.createOscillator(); o.type=ty; o.frequency.value=f; const gg=ac.createGain(); gg.gain.value=g; o.connect(gg); gg.connect(out); o.start(); });
   const lfo=ac.createOscillator(); lfo.frequency.value=0.35; const lg=ac.createGain(); lg.gain.value=0.15; lfo.connect(lg); lg.connect(out.gain); lfo.start(); out.gain.setTargetAtTime(0.35,ac.currentTime,2); }catch(e){} };
 ['click','touchstart','keydown'].forEach(ev=>window.addEventListener(ev,startSnd,{once:true})); sc.addEventListener('enter-vr',startSnd); [0,1].forEach(i=>sc.renderer.xr.getController(i).addEventListener('selectstart',startSnd));
 const v=new T.Vector3(), q=new T.Quaternion(), f=new T.Vector3(), u=new T.Vector3(); const base=ufo.position.clone();
 const update=(t)=>{ const k=t*0.001; ufo.position.y=base.y+Math.sin(k*0.5)*0.2; ufo.rotation.y=k*0.08; ufo.rotation.z=Math.sin(k*0.4)*0.015;
  reds.forEach((m,i)=>{ const on=((Math.floor(k*3)-i)%16+16)%16<5; m.material.color.setHex(on?0xc02010:0x300806); m.userData.h.material.opacity=on?0.5:0.05; });
  if(pan&&ac){ ufo.getWorldPosition(v); pan.positionX.value=v.x; pan.positionY.value=v.y; pan.positionZ.value=v.z; const c=sc.camera; c.getWorldPosition(v); c.getWorldQuaternion(q); f.set(0,0,-1).applyQuaternion(q); u.set(0,1,0).applyQuaternion(q); const L=ac.listener; if(L.positionX){ L.positionX.value=v.x; L.positionY.value=v.y; L.positionZ.value=v.z; L.forwardX.value=f.x; L.forwardY.value=f.y; L.forwardZ.value=f.z; L.upX.value=u.x; L.upY.value=u.y; L.upZ.value=u.z; } } };
 AFRAME.registerComponent('corn-tick',{tick(t){ update(t); }}); sc.setAttribute('corn-tick','');
 const shift=dz=>{ base.z+=dz; ufo.position.z=base.z; endG.position.z+=dz; };
 return {ufo,P,update,shift};
};
})();
