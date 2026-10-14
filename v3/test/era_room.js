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
// room ambience (CC0 BigSoundBank mixes), starts on first gesture
if(C.amb){ const A=new Audio(C.amb); A.loop=true; A.volume=C.ambVol||0.35; const go=()=>{ A.play().catch(()=>{}); }; ['click','keydown','touchstart'].forEach(e=>window.addEventListener(e,go,{once:true})); document.querySelector('a-scene').addEventListener('enter-vr',go); window.eraAmb=A; }
// Poly Haven PBR (CC0): wood_table_001 / painted_metal_shutter, 512px
window.eraPBR=function(kind,rep,tint){ const n=kind==='wood'?'wood_table_001':'painted_metal_shutter', L=new THREE.TextureLoader(), P='../assets/tex/ph/'+n+'_';
 const m=new THREE.MeshStandardMaterial({color:tint||0x9a948c,roughness:1,metalness:kind==='wood'?0:0.55});
 const ld=(k,f)=>L.load(P+k+'.jpg',t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep||1,rep||1);if(k==='diff')t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;f(t);m.needsUpdate=true;});
 ld('diff',t=>m.map=t); ld('rough',t=>m.roughnessMap=t); ld('nor_gl',t=>{m.normalMap=t;m.normalScale.set(0.8,0.8);}); return m; };
// desktop grain
(()=>{const c=document.getElementById('ffgrain'),x=c.getContext('2d');c.width=320;c.height=180;const d=x.createImageData(320,180);(function f(){for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}x.putImageData(d,0,0);setTimeout(()=>requestAnimationFrame(f),60);})();})();
S.addEventListener('loaded',()=>{
 const G=S.object3D, TL=new T.TextureLoader();
 const tex=(u,cb)=>TL.load(u,t=>{t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;cb&&cb(t);});
 const std=o=>new T.MeshStandardMaterial(o);
 // curved photo backdrop
 const B=C.backdrop, PX=B.px, R=B.r, H=512*PX, ang=768*PX/R;
 const bm=new T.MeshBasicMaterial({color:0xffffff,fog:false,toneMapped:false,side:T.DoubleSide});
 tex(B.url,t=>{bm.map=t;bm.needsUpdate=true;});
 const bd=new T.Mesh(new T.CylinderGeometry(R,R,H,64,1,true,Math.PI-ang/2,ang),bm); bd.scale.x=-1;
 bd.position.set(0,1.6+(256-B.horizonRow)*PX,R-B.front); G.add(bd);
 if(B.fadeBottom){ const fc=document.createElement('canvas'); fc.width=4; fc.height=256; const fx=fc.getContext('2d'); const fg=fx.createLinearGradient(0,256,0,0); fg.addColorStop(0,'#000'); fg.addColorStop(B.fadeBottom,'#fff'); fg.addColorStop(1-(B.fadeTop||0),'#fff'); fg.addColorStop(1,B.fadeTop?'#000':'#fff'); fx.fillStyle=fg; fx.fillRect(0,0,4,256);
  bm.alphaMap=new T.CanvasTexture(fc); bm.transparent=true; bm.depthWrite=false; bm.needsUpdate=true; }
 // animated water shimmer over photo region
 let shim=null;
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
 const W=C.room; if(!W.noWalls){ box(0.1,W.h,W.d,wallM,-W.w/2,W.h/2,W.cz); box(0.1,W.h,W.d,wallM,W.w/2,W.h/2,W.cz); box(W.w,W.h,0.1,wallM,0,W.h/2,W.cz+W.d/2); }
 if(W.ceiling) box(W.w,0.1,W.d+4,wallM,0,W.h,W.cz-1);
 const flD=C.floorFront!=null?(W.cz+W.d/2-C.floorFront):W.d+6; const fl=new T.Mesh(new T.PlaneGeometry(W.w,flD),floorM); fl.rotation.x=-Math.PI/2; fl.position.set(0,0,W.cz+W.d/2-flD/2); G.add(fl);
 if(C.floorFade){ const ac=document.createElement('canvas'); ac.width=ac.height=256; const ax=ac.getContext('2d'); const [cx,cy,r0,r1]=C.floorFade; const g=ax.createRadialGradient(cx*256,cy*256,r0*256,cx*256,cy*256,r1*256); g.addColorStop(0,'#fff'); g.addColorStop(1,'#000'); ax.fillStyle=g; ax.fillRect(0,0,256,256);
  floorM.alphaMap=new T.CanvasTexture(ac); floorM.transparent=true; floorM.depthWrite=false; floorM.needsUpdate=true; fl.renderOrder=2; }
 // glows
 const gc=document.createElement('canvas');gc.width=gc.height=128;const gx=gc.getContext('2d');const gr=gx.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,0.9)');gr.addColorStop(0.3,'rgba(255,255,255,0.25)');gr.addColorStop(1,'rgba(255,255,255,0)');gx.fillStyle=gr;gx.fillRect(0,0,128,128);
 const gt=new T.CanvasTexture(gc); const glows=[];
 (C.glows||[]).forEach(([x,y,z,s,col,op])=>{const sp=new T.Sprite(new T.SpriteMaterial({map:gt,color:col,transparent:true,opacity:op,depthWrite:false,blending:T.AdditiveBlending,fog:false}));sp.position.set(x,y,z);sp.scale.set(s,s*0.7,1);G.add(sp);glows.push([sp,op]);});
 (C.lights||[]).forEach(([col,int,dist,x,y,z])=>{const L=new T.PointLight(col,int,dist,2);L.position.set(x,y,z);G.add(L);});
 (C.props||[]).forEach(([glb,x,y,z,sc,ry])=>{ const e=document.createElement('a-entity'); e.setAttribute('gltf-model',glb); e.setAttribute('position',x+' '+y+' '+z); e.setAttribute('scale',sc+' '+sc+' '+sc); e.setAttribute('rotation','0 '+ry+' 0'); S.appendChild(e); });
 (C.boxes||[]).forEach(([w,h,d,col,x,y,z,pbr])=>box(w,h,d,pbr?window.eraPBR(pbr,1,col):std({color:col,roughness:0.85}),x,y,z));
 (C.pools||[]).forEach(([x,y,z,i,dist])=>{ const L=new T.PointLight(0xffc285,i||0.6,dist||1.3,2); L.position.set(x,y,z); G.add(L); });
 // grabbables (GLB)
 const items=[]; let held=null, grabs=0;
 (C.items||[]).forEach(([glb,x,y,z,sc,ry,line])=>{ const el=document.createElement('a-entity'); el.classList.add('clickable'); el.setAttribute('gltf-model',glb); el.setAttribute('scale',`${sc} ${sc} ${sc}`); el.setAttribute('position',`${x} ${y} ${z}`); el.setAttribute('rotation',`0 ${ry} 0`); S.appendChild(el);
  const it={el,y0:y,vy:0,line}; items.push(it); el.addEventListener('click',e=>{ grab(it,e.detail&&e.detail.cursorEl); }); });
 function grab(it,src){ if(held===it){ drop(); return; } if(held) drop(); const cam=document.getElementById('cam').object3D;
  const par=(src&&(src.id==='hl'||src.id==='hr'))?src.object3D:cam; par.attach(it.el.object3D);
  if(par===cam) it.el.object3D.position.set(0.12,-0.18,-0.45); else it.el.object3D.position.set(0,0,-0.1);
  held=it; grabs++; if(it.line&&!it.said){ it.said=1; say(it.line[0],it.line[1],it.line[2]); } }
 function drop(){ if(!held) return; G.attach(held.el.object3D); held.falling=true; held=null; }
 S.addEventListener('click',e=>{ if(held&&e.target===S) drop(); });
 ['hl','hr'].forEach(id=>document.getElementById(id).addEventListener('triggerdown',()=>{ const rc=document.getElementById(id).components.raycaster; if(held&&(!rc||!rc.intersectedEls.length)) drop(); }));
 const surf=C.surfaces||[];
 // ambient people (silhouettes) + overheard dialogue
 const people=[]; const ppl=C.people;
 if(ppl){ ppl.who.forEach((w,i)=>{ const g=new T.Group(); const pm=new T.MeshBasicMaterial({transparent:true,alphaTest:0.3,depthWrite:true,fog:false,side:T.DoubleSide});
   const hgt=ppl.height||1.78; const pl=new T.Mesh(new T.PlaneGeometry(1,1),pm); pl.position.y=hgt/2-0.06; g.add(pl);
   tex(ppl.img[i],t=>{ pm.map=t; pm.needsUpdate=true; const ar=t.image.width/t.image.height; pl.scale.set(hgt*ar,hgt,1); });
   g.position.set(ppl.pos[0]+i*0.75,0,ppl.pos[2]-i*0.15); G.add(g); people.push(g); }); }
 let listenT=0, convI=-1, convNext=0, convDone=false;
 // VR grain
 const nc=document.createElement('canvas');nc.width=nc.height=128;const nx=nc.getContext('2d');const nd=nx.createImageData(128,128);const nt=new T.CanvasTexture(nc);
 const nm=new T.Mesh(new T.PlaneGeometry(0.5,0.5),new T.MeshBasicMaterial({map:nt,transparent:true,opacity:0.06,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,fog:false}));nm.position.set(0,0,-0.12);nm.renderOrder=999;document.getElementById('cam').object3D.add(nm);
 setInterval(()=>{for(let i=0;i<nd.data.length;i+=4){const v=Math.random()*255;nd.data[i]=nd.data[i+1]=nd.data[i+2]=v;nd.data[i+3]=255;}nx.putImageData(nd,0,0);nt.needsUpdate=true;},70);
 const lastP=new T.Vector3(); let still=0;
 AFRAME.registerComponent('era-tick',{tick(t,dt){ const d=Math.min(dt,50)/1000;
  items.forEach(it=>{ if(!it.falling) return; const o=it.el.object3D; it.vy-=9.8*d; o.position.y+=it.vy*d; let fy=0; surf.forEach(([x,z,w,dd,h])=>{ if(Math.abs(o.position.x-x)<w/2&&Math.abs(o.position.z-z)<dd/2) fy=Math.max(fy,h); }); if(o.position.y<fy){ o.position.y=fy; it.vy=0; it.falling=false; } });
  glows.forEach(([sp,op],i)=>{ sp.material.opacity=op*(0.85+0.15*Math.sin(t*0.0011+i*1.7)); });
  if(ppl){ people.forEach((g,i)=>{ const cam0=document.getElementById('cam').object3D, cp=new T.Vector3(); cam0.getWorldPosition(cp); g.rotation.y=Math.atan2(cp.x-g.position.x,cp.z-g.position.z); g.children[0].rotation.z=Math.sin(t*0.0011+i*2.1)*0.025; g.children[0].position.x=Math.sin(t*0.0007+i)*0.01; });
   const cam=document.getElementById('cam').object3D, p=new T.Vector3(); cam.getWorldPosition(p);
   still = p.distanceTo(lastP)<0.004 ? still+d : 0; lastP.copy(p);
   const mid=people[0].position.clone().lerp(people[1].position,0.5); const dist=Math.hypot(p.x-mid.x,p.z-mid.z);
   if(!convDone && dist<ppl.radius && (still>ppl.stillSec || convI>=0)){ if(t>convNext && !subBusy){ convI++; if(convI>=ppl.lines.length){ convDone=true; if(ppl.after) setTimeout(()=>say('',ppl.after),800); } else { const [w,txt,f]=ppl.lines[convI]; say(w,txt,f,Math.max(2600,txt.length*70)); convNext=t+Math.max(2900,txt.length*70+400); } } }
   if(dist>ppl.radius+1.5 && convI>=0 && !convDone){ convI=-1; } } }}); S.setAttribute('era-tick','');
 if(C.enter) setTimeout(()=>say(C.enter[0],C.enter[1],C.enter[2]),2500);
 if(C.mara) setTimeout(()=>say(C.mara[0],C.mara[1],C.mara[2]),C.mara[3]||15000);
 if(C.water){ let started=false; const start=()=>{ if(started) return; started=true; const ac=new (window.AudioContext||window.webkitAudioContext)(); const n=ac.sampleRate*3, buf=ac.createBuffer(1,n,ac.sampleRate), d=buf.getChannelData(0); let l=0; for(let i=0;i<n;i++){ const w=Math.random()*2-1; l=(l+0.04*w)/1.04; d[i]=w*0.35+l*3; }
   const src=ac.createBufferSource(); src.buffer=buf; src.loop=true; const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1400; bp.Q.value=0.6; const hs=ac.createBiquadFilter(); hs.type='lowpass'; hs.frequency.value=5200;
   const g=ac.createGain(); g.gain.value=C.water.vol||0.5; const lfo=ac.createOscillator(), lg=ac.createGain(); lfo.frequency.value=0.23; lg.gain.value=(C.water.vol||0.5)*0.25; lfo.connect(lg); lg.connect(g.gain); lfo.start();
   if(C.water.url){ bp.type='allpass'; lg.gain.value=0; g.gain.value=0; fetch(C.water.url).then(r=>r.arrayBuffer()).then(ab=>ac.decodeAudioData(ab)).then(rb=>{ src.stop(); const s2=ac.createBufferSource(); s2.buffer=rb; s2.loop=true; s2.loopStart=0.06; s2.loopEnd=rb.duration-0.06; s2.connect(hs); g.gain.setTargetAtTime(C.water.gain||2.5,ac.currentTime,1.2); s2.start(0,0.06); }).catch(()=>{ g.gain.value=C.water.vol||0.5; }); }
   const pn=ac.createPanner(); pn.panningModel='HRTF'; pn.distanceModel='inverse'; pn.refDistance=1.5; pn.rolloffFactor=1; const [px,py,pz]=C.water.pos; pn.positionX.value=px; pn.positionY.value=py; pn.positionZ.value=pz;
   src.connect(bp); bp.connect(hs); hs.connect(g); g.connect(pn); pn.connect(ac.destination); src.start();
   const L=ac.listener, cam=document.getElementById('cam').object3D, v=new T.Vector3(), f=new T.Vector3(), q=new T.Quaternion();
   setInterval(()=>{ cam.getWorldPosition(v); cam.getWorldQuaternion(q); f.set(0,0,-1).applyQuaternion(q); if(L.positionX){ L.positionX.value=v.x; L.positionY.value=v.y; L.positionZ.value=v.z; L.forwardX.value=f.x; L.forwardY.value=f.y; L.forwardZ.value=f.z; L.upX.value=0; L.upY.value=1; L.upZ.value=0; } else { L.setPosition(v.x,v.y,v.z); L.setOrientation(f.x,f.y,f.z,0,1,0); } },50); window.eraWater=ac; };
  ['click','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,start,{once:false})); S.addEventListener('enter-vr',start); ['hl','hr'].forEach(id=>document.getElementById(id).addEventListener('triggerdown',start)); }
 (C.ph||[]).forEach(([n,x,y,z,ry,sc])=>{ const e=document.createElement('a-entity'); e.setAttribute('gltf-model','../assets/props/ph/'+n+'/'+n+'.gltf'); e.setAttribute('position',x+' '+y+' '+z); e.setAttribute('rotation','0 '+ry+' 0'); e.setAttribute('scale',sc+' '+sc+' '+sc); S.appendChild(e); });
 let shimT=0; if(shim) setInterval(()=>{ shimT+=80; shim(shimT); },80);
});
AFRAME.registerComponent('room-move',{init(){ this.ax=[0,0]; this.snap=0; setTimeout(()=>{ document.getElementById('hl').addEventListener('thumbstickmoved',e=>{this.ax=[e.detail.x,e.detail.y];}); document.getElementById('hr').addEventListener('thumbstickmoved',e=>{ const x=e.detail.x; if(Math.abs(x)>0.7&&!this.snap){ this.snap=1; this.el.object3D.rotation.y-=Math.sign(x)*Math.PI/6; } if(Math.abs(x)<0.3) this.snap=0; }); },0); },
 tick(t,dt){ const o=this.el.object3D, d=Math.min(dt,50)/1000; const [x,y]=this.ax; if(Math.abs(x)>0.15||Math.abs(y)>0.15){ const cam=document.getElementById('cam').object3D; const q=new THREE.Quaternion(); cam.getWorldQuaternion(q); const f=new THREE.Vector3(x,0,y).applyQuaternion(q); f.y=0; o.position.addScaledVector(f,1.4*d); }
  const B=window.ERA.bounds, c=document.getElementById('cam').object3D.position; const wx=o.position.x+c.x, wz=o.position.z+c.z; o.position.x+=Math.max(B[0],Math.min(B[1],wx))-wx; o.position.z+=Math.max(B[2],Math.min(B[3],wz))-wz; }});
})();
