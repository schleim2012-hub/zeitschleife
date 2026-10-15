// Rewind V3 – generische Ära-Testräume (X-Files-Foto-Welt). Konfig über window.ERA vor dem Laden.
(function(){
const C=window.ERA, T=THREE, S=document.querySelector('a-scene');
const sub=document.getElementById('sub');
let subBusy=false;
let VOX={}; fetch('../assets/vo/erax.json').then(r=>r.json()).then(j=>VOX=j).catch(()=>{});
function say(who,text,file,ms){ if(!file&&VOX[text]) file='../assets/vo/'+VOX[text]; sub.textContent=(who?who+': ':'')+text; sub.style.display='block'; subBusy=true;
 const done=()=>{ subBusy=false; setTimeout(()=>{ if(!subBusy) sub.style.display='none'; },500); };
 if(file){ const a=new Audio(file); a.volume=0.9; a.onended=a.onerror=done; a.play().catch(()=>setTimeout(done,ms||3500)); } else setTimeout(done,ms||3500); }
window.eraSay=say;
if(!window.VRP){ const sc=document.createElement('script'); sc.src='lib/vrphys.js?v=3'; document.head.appendChild(sc); }
// room ambience (CC0 BigSoundBank mixes), starts on first gesture
if(C.amb) window.eraAmbStart(C.amb,C.ambVol);
// Poly Haven PBR (CC0): wood_table_001 / painted_metal_shutter, 512px
window.eraPBR=function(kind,rep,tint){ const n=kind==='wood'?'wood_table_001':'painted_metal_shutter', L=new THREE.TextureLoader(), P='../assets/tex/ph/'+n+'_';
 const m=new THREE.MeshStandardMaterial({color:tint||0x9a948c,roughness:1,metalness:kind==='wood'?0:0.55});
 const ld=(k,f)=>L.load(P+k+'.jpg',t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep||1,rep||1);if(k==='diff')t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;f(t);m.needsUpdate=true;});
 ld('diff',t=>m.map=t); ld('rough',t=>m.roughnessMap=t); ld('nor_gl',t=>{m.normalMap=t;m.normalScale.set(0.8,0.8);}); return m; };
// desktop grain
(()=>{const c=document.getElementById('ffgrain'); if(!c) return; const x=c.getContext('2d');c.width=320;c.height=180;const d=x.createImageData(320,180);(function f(){for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}x.putImageData(d,0,0);setTimeout(()=>requestAnimationFrame(f),60);})();})();
S.addEventListener('loaded',()=>{
 const G=S.object3D, TL=new T.TextureLoader();
 if(C.start){ const r=document.getElementById('rig'); if(r) r.object3D.position.set(C.start[0],0,C.start[1]); } // Startpunkt pro Raum
 const tex=(u,cb)=>TL.load(u,t=>{t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;cb&&cb(t);});
 const std=o=>new T.MeshStandardMaterial(o);
 let shim=null; if(C.world3d&&window[C.world3d]){ window.__W3=window[C.world3d](S,C); } else {
 // curved photo backdrop
 const B=C.backdrop, PX=B.px, R=B.r, H=512*PX, ang=768*PX/R;
 const bm=new T.MeshBasicMaterial({color:0xffffff,fog:false,toneMapped:false,side:T.DoubleSide});
 tex(B.url,t=>{bm.map=t;bm.needsUpdate=true;});
 const bd=new T.Mesh(new T.CylinderGeometry(R,R,H,64,1,true,Math.PI-ang/2,ang),bm); bd.scale.x=-1;
 bd.position.set(0,1.6+(256-B.horizonRow)*PX,R-B.front); G.add(bd);
 if(B.fadeBottom){ const fc=document.createElement('canvas'); fc.width=4; fc.height=256; const fx=fc.getContext('2d'); const fg=fx.createLinearGradient(0,256,0,0); fg.addColorStop(0,'#000'); fg.addColorStop(B.fadeBottom,'#fff'); fg.addColorStop(1-(B.fadeTop||0),'#fff'); fg.addColorStop(1,B.fadeTop?'#000':'#fff'); fx.fillStyle=fg; fx.fillRect(0,0,4,256);
  bm.alphaMap=new T.CanvasTexture(fc); bm.transparent=true; bm.depthWrite=false; bm.needsUpdate=true; }
 // animated water shimmer over photo region
 if(C.shimmer){ const [sx,sy,sz,sw,sh,scol,sop]=C.shimmer; const sc=document.createElement('canvas'); sc.width=sc.height=128; const sxc=sc.getContext('2d'); const st=new T.CanvasTexture(sc);
  const sm=new T.Mesh(new T.PlaneGeometry(sw,sh),new T.MeshBasicMaterial({map:st,color:scol,transparent:true,opacity:sop,depthWrite:false,blending:T.AdditiveBlending,fog:false,toneMapped:false})); sm.position.set(sx,sy,sz); sm.renderOrder=1; G.add(sm);
  const id=sxc.createImageData(128,128);
  shim=t=>{ const k=t*0.0012; for(let y=0;y<128;y++){ const ny=(y-64)/64; for(let x=0;x<128;x++){ const nx=(x-64)/64, e=1-(nx*nx+ny*ny); let v=0; if(e>0){ const w=Math.sin(x*0.31+k*2.1+Math.sin(y*0.17+k)*2.0)+Math.sin(y*0.43-k*1.7+Math.sin(x*0.13-k*0.8)*2.4); v=Math.pow(Math.max(0,w*0.5),3)*255*Math.min(1,e*2.5); } const i=(y*128+x)*4; id.data[i]=id.data[i+1]=id.data[i+2]=v; id.data[i+3]=255; } } sxc.putImageData(id,0,0); st.needsUpdate=true; };
  shim(0); }
 // shell
 const wallM=std({color:C.wall,roughness:0.95,emissive:C.wallEm||0x000000}), floorM=std({color:C.floor,roughness:C.floorRough||0.6,metalness:0.1});
 if(C.floorTex) tex(C.floorTex,t=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(C.floorRep||5,C.floorRep||5);floorM.map=t;floorM.needsUpdate=true;});
 if(C.wallTex) tex(C.wallTex,t=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,2);wallM.map=t;wallM.needsUpdate=true;});
 const box=(w,h,d,m,x,y,z)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);G.add(o);return o;};
 const W=C.room;
 if(W.plainWalls){ box(0.1,W.h,W.d,wallM,-W.w/2,W.h/2,W.cz); box(0.1,W.h,W.d,wallM,W.w/2,W.h/2,W.cz); box(W.w,W.h,0.1,wallM,0,W.h/2,W.cz+W.d/2); }
 else if(!W.noWalls){ // Raum rundum geschlossen – als Foto statt glatter Kastenwände: zwei an den Nahtstellen gespiegelte, abgedunkelte Kopien des Hintergrundfotos
  // schließen die restlichen Grad hinter dem Spieler (nahtlos an beiden Kanten), in der Mitte hinten weich ins Dunkel überblendet
  const CL=C.closure||{}; const back=2*Math.PI-ang, half=back/2, part=CL.part||Math.min(0.42,half/ang); // nur die äußeren ~40 % spiegeln (keine doppelten Hauptmotive), unscharf & dunkel
  const ac=document.createElement('canvas'); ac.width=256; ac.height=128; const ax=ac.getContext('2d'); const hg=ax.createLinearGradient(0,0,256,0); hg.addColorStop(0,'#fff'); hg.addColorStop(0.7,'#fff'); hg.addColorStop(1,'#000'); ax.fillStyle=hg; ax.fillRect(0,0,256,128);
  if(B.fadeBottom){ ax.globalCompositeOperation='multiply'; const vg=ax.createLinearGradient(0,128,0,0); vg.addColorStop(0,'#000'); vg.addColorStop(B.fadeBottom,'#fff'); vg.addColorStop(1-(B.fadeTop||0),'#fff'); vg.addColorStop(1,B.fadeTop?'#000':'#fff'); ax.fillStyle=vg; ax.fillRect(0,0,256,128); }
  const am=new T.CanvasTexture(ac);
  [0,1].forEach(k=>{ const m=new T.MeshBasicMaterial({color:0x8c8c8c,fog:false,toneMapped:false,side:T.DoubleSide,transparent:true,depthWrite:false,alphaMap:am});
   tex(B.url,t=>{ const img=t.image, cv=document.createElement('canvas'); cv.width=512; cv.height=Math.round(512*img.height/img.width); const cx=cv.getContext('2d'); cx.filter='blur('+(CL.blur==null?5:CL.blur)+'px) brightness('+(CL.tone||0.8)+')'; cx.drawImage(img,0,0,cv.width,cv.height); const tt=new T.CanvasTexture(cv); tt.colorSpace=T.SRGBColorSpace; m.map=tt; m.needsUpdate=true; });
   const g=new T.CylinderGeometry(R,R,H,64,1,true,k?Math.PI-ang/2-half:Math.PI+ang/2,half); const uv=g.attributes.uv;
   // u neu: an der Fotokante gespiegelt (k=0 rechte Kante → nach innen, k=1 linke Kante); Alpha-u läuft 0 (Kante) → 1 (Mitte hinten)
   const a2=new Float32Array(uv.count*2);
   for(let i=0;i<uv.count;i++){ const u=uv.getX(i), v=uv.getY(i); const e=k?(1-u):u; uv.setX(i,k?(e*part):(1-e*part)); a2[i*2]=e; a2[i*2+1]=v; }
   g.setAttribute('uv1',new T.BufferAttribute(a2,2)); m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <alphamap_fragment>','diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;'); };
   am.channel=1; const mesh=new T.Mesh(g,m); mesh.scale.x=-1; mesh.position.copy(bd.position); mesh.renderOrder=-1; G.add(mesh); }); }
 if(W.ceiling) box(W.w,0.1,W.d+4,wallM,0,W.h,W.cz-1);
 const flD=C.floorFront!=null?(W.cz+W.d/2-C.floorFront):W.d+6; const fl=new T.Mesh(new T.PlaneGeometry(W.w,flD),floorM); fl.rotation.x=-Math.PI/2; fl.position.set(0,0,W.cz+W.d/2-flD/2); G.add(fl);
 if(C.floorFade){ const ac=document.createElement('canvas'); ac.width=ac.height=256; const ax=ac.getContext('2d'); const [cx,cy,r0,r1]=C.floorFade; const g=ax.createRadialGradient(cx*256,cy*256,r0*256,cx*256,cy*256,r1*256); g.addColorStop(0,'#fff'); g.addColorStop(1,'#000'); ax.fillStyle=g; ax.fillRect(0,0,256,256);
  floorM.alphaMap=new T.CanvasTexture(ac); floorM.transparent=true; floorM.depthWrite=false; floorM.needsUpdate=true; fl.renderOrder=2; }
 }
 // glows
 const gc=document.createElement('canvas');gc.width=gc.height=128;const gx=gc.getContext('2d');const gr=gx.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,0.9)');gr.addColorStop(0.3,'rgba(255,255,255,0.25)');gr.addColorStop(1,'rgba(255,255,255,0)');gx.fillStyle=gr;gx.fillRect(0,0,128,128);
 const gt=new T.CanvasTexture(gc); const glows=[];
 (C.glows||[]).forEach(([x,y,z,s,col,op])=>{const sp=new T.Sprite(new T.SpriteMaterial({map:gt,color:col,transparent:true,opacity:op,depthWrite:false,blending:T.AdditiveBlending,fog:false}));sp.position.set(x,y,z);sp.scale.set(s,s*0.7,1);G.add(sp);glows.push([sp,op]);});
 (C.lights||[]).forEach(([col,int,dist,x,y,z])=>{const L=new T.PointLight(col,int,dist,2);L.position.set(x,y,z);G.add(L);});
 let blobM=null; const blob=(x,y,z,r)=>{ if(y>0.05) return; if(!blobM){ const c=document.createElement('canvas'); c.width=c.height=64; const g2=c.getContext('2d'); const g=g2.createRadialGradient(32,32,2,32,32,31); g.addColorStop(0,'rgba(0,0,0,0.7)'); g.addColorStop(1,'rgba(0,0,0,0)'); g2.fillStyle=g; g2.fillRect(0,0,64,64); blobM=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}); }
  const e=document.createElement('a-entity'); e.setAttribute('position',x+' '+(y+0.004)+' '+z); S.appendChild(e); const m=new THREE.Mesh(new THREE.PlaneGeometry(r,r),blobM); m.rotation.x=-Math.PI/2; e.object3D.add(m); };
 (C.props||[]).forEach(([glb,x,y,z,sc,ry])=>{ blob(x,y,z,0.9*sc); const e=document.createElement('a-entity'); e.setAttribute('gltf-model',glb); e.setAttribute('position',x+' '+y+' '+z); e.setAttribute('scale',sc+' '+sc+' '+sc); e.setAttribute('rotation','0 '+ry+' 0'); S.appendChild(e); });
 (C.boxes||[]).forEach(([w,h,d,col,x,y,z,pbr])=>box(w,h,d,pbr?window.eraPBR(pbr,1,col):std({color:col,roughness:0.85}),x,y,z));
 (C.pools||[]).forEach(([x,y,z,i,dist,col,flick])=>{ const L=new T.PointLight(col||0xffc285,i||0.6,dist||1.3,2); L.position.set(x,y,z); G.add(L); if(flick){ const b=i||0.6; setInterval(()=>{ L.intensity=b*(0.6+Math.random()*0.5); },90); } });
 // grabbables (GLB)
 const items=[]; let held=null, grabs=0;
 (C.items||[]).forEach(([glb,x,y,z,sc,ry,line])=>{ const el=document.createElement('a-entity'); el.classList.add('clickable'); el.setAttribute('gltf-model',glb); el.setAttribute('scale',`${sc} ${sc} ${sc}`); el.setAttribute('position',`${x} ${y} ${z}`); el.setAttribute('rotation',`0 ${ry} 0`); S.appendChild(el);
  const it={el,y0:y,vy:0,line}; items.push(it); el.addEventListener('click',e=>{ grab(it,e.detail&&e.detail.cursorEl); }); });
 // Greifen/Werfen: VR = Gewichts-Lag + Wurf-Schätzer (lib/vrphys.js), Desktop = an Kamera
 const HND={hl:{id:'hl',hand:'left'},hr:{id:'hr',hand:'right'}}; let heldBy=null; const hq=new T.Quaternion(), hp=new T.Vector3();
 const HAP=(h,i,ms)=>{ if(window.VRP) VRP.haptic(S.renderer,h,i,ms); };
 function grab(it,src){ if(held===it){ drop(); return; } if(held) drop(); const cam=document.getElementById('cam').object3D;
  const vr=src&&HND[src.id]&&S.is('vr-mode'); it.falling=false; it.v=null;
  if(vr){ G.attach(it.el.object3D); heldBy=HND[src.id]; it.lagP=it.el.object3D.position.clone(); it.lagV=new T.Vector3(); it.mass=it.mass||0.5; HAP(heldBy.hand,0.35,30); }
  else { heldBy=null; cam.attach(it.el.object3D); it.el.object3D.position.set(0.12,-0.18,-0.45); }
  held=it; grabs++; if(it.line&&!it.said){ it.said=1; say(it.line[0],it.line[1],it.line[2]); } }
 function drop(){ if(!held) return; const it=held, o=it.el.object3D; G.attach(o); it.falling=true; it.vy=0; it.v=new T.Vector3(); it.w=new T.Vector3();
  if(heldBy&&window.VRP&&heldBy.tr){ const e=document.getElementById(heldBy.id).object3D; e.getWorldPosition(hp); const est=heldBy.tr.estimate(o.position.clone().sub(hp),{stepBack:1,tangential:0.6,scale:1.0,max:9}); it.v.copy(est.v); it.w.copy(est.w).multiplyScalar(0.4); }
  held=null; heldBy=null; }
 // Squeeze-Griff in Reichweite (natürlicher als Laser), Loslassen = Wurf
 ['hl','hr'].forEach(id=>{ const el=document.getElementById(id);
  el.addEventListener('gripdown',()=>{ if(held) return; const p=new T.Vector3(); el.object3D.getWorldPosition(p); let best=null,bd=0.3; items.forEach(it=>{ const q=new T.Vector3(); it.el.object3D.getWorldPosition(q); const d=q.distanceTo(p); if(d<bd){bd=d;best=it;} }); if(best) grab(best,el); });
  el.addEventListener('gripup',()=>{ if(held&&heldBy&&heldBy.id===id) drop(); }); });
 S.addEventListener('click',e=>{ if(held&&e.target===S) drop(); });
 ['hl','hr'].forEach(id=>document.getElementById(id).addEventListener('triggerdown',()=>{ const rc=document.getElementById(id).components.raycaster; if(held&&(!rc||!rc.intersectedEls.length)) drop(); }));
 window.__era={items,grab,drop,HND,get held(){return held;}};
 const surf=C.surfaces||[];
 // ambient people (silhouettes) + overheard dialogue
 const people=[]; const ppl=C.people;
 if(ppl){ ppl.who.forEach((w,i)=>{ const g=new T.Group(); const pm=new T.MeshBasicMaterial({transparent:true,alphaTest:0.3,depthWrite:true,fog:false,side:T.DoubleSide});
   if(window.__W3&&__W3.person){ g.add(__W3.person(i)); } else { const hgt=ppl.height||1.78; const pl=new T.Mesh(new T.PlaneGeometry(1,1),pm); pl.position.y=hgt/2-0.06; g.add(pl);
   tex(ppl.img[i],t=>{ pm.map=t; pm.needsUpdate=true; const ar=t.image.width/t.image.height; pl.scale.set(hgt*ar,hgt,1); }); }
   g.position.set(ppl.pos[0]+i*0.75,0,ppl.pos[2]-i*0.15); G.add(g); people.push(g); }); }
 let listenT=0, convI=-1, convNext=0, convDone=false;
 // (VR-Kopf-Rauschen entfernt – nichts head-locked; stattdessen weltfester Staub)
 if(window.worldDust) worldDust(S,{count:60,rMin:1.0,rMax:3.8,color:C.dustColor||0xffe2b8,opacity:0.4}); else { const sc=document.createElement('script'); sc.src='lib/dust.js?v=1'; sc.onload=()=>worldDust(S,{count:60,rMin:1.0,rMax:3.8,color:C.dustColor||0xffe2b8,opacity:0.4}); document.head.appendChild(sc); }
 const lastP=new T.Vector3(); let still=0;
 AFRAME.registerComponent('era-tick',{tick(t,dt){ const d=Math.min(dt,50)/1000;
  if(window.VRP){ const now=t/1000; Object.values(HND).forEach(h=>{ const o=document.getElementById(h.id).object3D; if(!h.tr) h.tr=new VRP.Tracker(); o.getWorldPosition(hp); o.getWorldQuaternion(hq); h.tr.push(hp.clone(),hq.clone(),now); }); }
  if(held&&heldBy&&window.VRP){ const o=document.getElementById(heldBy.id).object3D, it=held, io=it.el.object3D; o.getWorldPosition(hp); o.getWorldQuaternion(hq); const tgt=new T.Vector3(0,0,-0.1).applyQuaternion(hq).add(hp);
   VRP.lagFollow(it.lagP,it.lagV,tgt,it.mass,d); io.position.copy(it.lagP); io.quaternion.slerp(hq,Math.min(1,d*14)); }
  const B=C.bounds;
  items.forEach(it=>{ if(!it.falling) return; const o=it.el.object3D; if(!it.v) it.v=new T.Vector3(0,it.vy||0,0);
   const n=4, h=d/n; for(let k=0;k<n;k++){ it.v.y-=9.8*h; it.v.multiplyScalar(1-0.02*h); o.position.addScaledVector(it.v,h);
    if(it.w&&it.w.lengthSq()>1e-4){ const wl=it.w.length(); o.rotateOnWorldAxis(it.w.clone().divideScalar(wl),wl*h); it.w.multiplyScalar(1-1.5*h); }
    if(B){ const zmin=(C.floorFront!=null?C.floorFront+0.2:B[2]-0.3); if(o.position.x<B[0]-0.3||o.position.x>B[1]+0.3){ o.position.x=Math.max(B[0]-0.3,Math.min(B[1]+0.3,o.position.x)); it.v.x*=-0.3; } if(o.position.z<zmin||o.position.z>B[3]+0.3){ o.position.z=Math.max(zmin,Math.min(B[3]+0.3,o.position.z)); it.v.z*=-0.3; } }
    let fy=0; surf.forEach(([x,z,w,dd,hh])=>{ if(Math.abs(o.position.x-x)<w/2&&Math.abs(o.position.z-z)<dd/2&&o.position.y>hh-0.12) fy=Math.max(fy,hh); });
    if(o.position.y<fy){ o.position.y=fy; const imp=-it.v.y; if(imp>0.6){ it.v.y=imp*0.28; it.v.x*=0.6; it.v.z*=0.6; if(it.w) it.w.multiplyScalar(0.5); if(window.eraThud) eraThud(imp); } else { it.v.y=0; it.v.x*=Math.max(0,1-9*h); it.v.z*=Math.max(0,1-9*h); if(it.w) it.w.multiplyScalar(Math.max(0,1-12*h)); if(Math.hypot(it.v.x,it.v.z)<0.05){ it.v.set(0,0,0); it.vy=0; it.falling=false; } } } } });
  glows.forEach(([sp,op],i)=>{ sp.material.opacity=op*(0.85+0.15*Math.sin(t*0.0011+i*1.7)); });
  if(ppl){ people.forEach((g,i)=>{ const cam0=document.getElementById('cam').object3D, cp=new T.Vector3(); cam0.getWorldPosition(cp); g.rotation.y=Math.atan2(cp.x-g.position.x,cp.z-g.position.z); g.children[0].rotation.z=Math.sin(t*0.0011+i*2.1)*0.025; g.children[0].position.x=Math.sin(t*0.0007+i)*0.01; });
   const cam=document.getElementById('cam').object3D, p=new T.Vector3(); cam.getWorldPosition(p);
   still = p.distanceTo(lastP)<0.004 ? still+d : 0; lastP.copy(p);
   const mid=people[0].position.clone().lerp(people[1].position,0.5); const dist=Math.hypot(p.x-mid.x,p.z-mid.z);
   if(!convDone && dist<ppl.radius && (still>ppl.stillSec || convI>=0)){ if(t>convNext && !subBusy){ convI++; if(convI>=ppl.lines.length){ convDone=true; if(ppl.after) setTimeout(()=>say('',ppl.after),800); } else { const [w,txt,f]=ppl.lines[convI]; say(w,txt,f,Math.max(2600,txt.length*70)); convNext=t+Math.max(2900,txt.length*70+400); } } }
   if(dist>ppl.radius+1.5 && convI>=0 && !convDone){ convI=-1; } } }}); S.setAttribute('era-tick','');
 if(C.enter) setTimeout(()=>say(C.enter[0],C.enter[1],C.enter[2]),2500);
 if(C.mara) setTimeout(()=>say(C.mara[0],C.mara[1],C.mara[2]),C.mara[3]||15000);
 if(C.water&&C.water.pos){ let started=false; const start=()=>{ if(started) return; started=true; const ac=new (window.AudioContext||window.webkitAudioContext)(); const n=ac.sampleRate*3, buf=ac.createBuffer(1,n,ac.sampleRate), d=buf.getChannelData(0); let l=0; for(let i=0;i<n;i++){ const w=Math.random()*2-1; l=(l+0.04*w)/1.04; d[i]=w*0.35+l*3; }
   const src=ac.createBufferSource(); src.buffer=buf; src.loop=true; const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1400; bp.Q.value=0.6; const hs=ac.createBiquadFilter(); hs.type='lowpass'; hs.frequency.value=5200;
   const g=ac.createGain(); g.gain.value=C.water.vol||0.5; const lfo=ac.createOscillator(), lg=ac.createGain(); lfo.frequency.value=0.23; lg.gain.value=(C.water.vol||0.5)*0.25; lfo.connect(lg); lg.connect(g.gain); lfo.start();
   if(C.water.url){ bp.type='allpass'; lg.gain.value=0; g.gain.value=0; fetch(C.water.url).then(r=>r.arrayBuffer()).then(ab=>ac.decodeAudioData(ab)).then(rb=>{ src.stop(); const s2=ac.createBufferSource(); s2.buffer=rb; s2.loop=true; s2.loopStart=0.06; s2.loopEnd=rb.duration-0.06; s2.connect(hs); g.gain.setTargetAtTime(C.water.gain||2.5,ac.currentTime,1.2); s2.start(0,0.06); }).catch(()=>{ g.gain.value=C.water.vol||0.5; }); }
   const pn=ac.createPanner(); pn.panningModel='HRTF'; pn.distanceModel='inverse'; pn.refDistance=1.5; pn.rolloffFactor=1; const [px,py,pz]=C.water.pos; pn.positionX.value=px; pn.positionY.value=py; pn.positionZ.value=pz;
   src.connect(bp); bp.connect(hs); hs.connect(g); g.connect(pn); pn.connect(ac.destination); src.start();
   const L=ac.listener, cam=document.getElementById('cam').object3D, v=new T.Vector3(), f=new T.Vector3(), q=new T.Quaternion();
   setInterval(()=>{ cam.getWorldPosition(v); cam.getWorldQuaternion(q); f.set(0,0,-1).applyQuaternion(q); if(L.positionX){ L.positionX.value=v.x; L.positionY.value=v.y; L.positionZ.value=v.z; L.forwardX.value=f.x; L.forwardY.value=f.y; L.forwardZ.value=f.z; L.upX.value=0; L.upY.value=1; L.upZ.value=0; } else { L.setPosition(v.x,v.y,v.z); L.setOrientation(f.x,f.y,f.z,0,1,0); } },50); window.eraWater=ac; };
  ['click','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,start,{once:false})); S.addEventListener('enter-vr',start); ['hl','hr'].forEach(id=>document.getElementById(id).addEventListener('triggerdown',start)); }
 (C.ph||[]).forEach(([n,x,y,z,ry,sc])=>{ blob(x,y,z,1.1*sc); const e=document.createElement('a-entity'); e.setAttribute('gltf-model','../assets/props/ph/'+n+'/'+n+'.gltf'); e.setAttribute('position',x+' '+y+' '+z); e.setAttribute('rotation','0 '+ry+' 0'); e.setAttribute('scale',sc+' '+sc+' '+sc); S.appendChild(e); });
 let shimT=0; if(shim) setInterval(()=>{ shimT+=80; shim(shimT); },80);
});
AFRAME.registerComponent('room-move',{init(){ this.ax=[0,0]; this.snap=0; setTimeout(()=>{ document.getElementById('hl').addEventListener('thumbstickmoved',e=>{this.ax=[e.detail.x,e.detail.y];}); document.getElementById('hr').addEventListener('thumbstickmoved',e=>{ const x=e.detail.x; if(Math.abs(x)>0.7&&!this.snap){ this.snap=1; this.el.object3D.rotation.y-=Math.sign(x)*Math.PI/6; } if(Math.abs(x)<0.3) this.snap=0; }); },0); },
 tick(t,dt){ const o=this.el.object3D, d=Math.min(dt,50)/1000; const [x,y]=this.ax; if(Math.abs(x)>0.15||Math.abs(y)>0.15){ const cam=document.getElementById('cam').object3D; const q=new THREE.Quaternion(); cam.getWorldQuaternion(q); const f=new THREE.Vector3(x,0,y).applyQuaternion(q); f.y=0; o.position.addScaledVector(f,1.4*d); }
  const B=window.ERA.bounds, c=document.getElementById('cam').object3D.position; const wx=o.position.x+c.x, wz=o.position.z+c.z; o.position.x+=Math.max(B[0],Math.min(B[1],wx))-wx; o.position.z+=Math.max(B[2],Math.min(B[3],wz))-wz; if(window.__W3&&__W3.collide){ const r=__W3.collide(o.position.x+c.x,o.position.z+c.z); if(r){ o.position.x+=r[0]; o.position.z+=r[1]; } } }});
})();
