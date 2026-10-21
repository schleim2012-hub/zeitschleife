// Rewind V3 – zsx.js v1: Untersuchen (Resident-Evil-Stil) + versteckte Schlüssel (Schublade, Wertfach, Blechdose).
// Untersuchen: Gegenstand schwebt ~45 cm vor dir in Augenhöhe – beim Start in der WELT platziert, nicht am Kopf (VR-Komfort).
// Umgebung dunkelt leicht ab (weltfeste Kugel, kein Licht). Drehen: Stick / Hand (Grip) / Maus ziehen. Zurück: B/Y, Trigger, Grip loslassen, Klick, Esc.
// Geheimnis: secret={axis:[x,y,z]} (diese lokale Seite muss zu dir zeigen) oder {down:true} (umdrehen); text/cap; onReveal(obj).
(function(){
if(window.ZSX) return;
const T=THREE, V=(x,y,z)=>new T.Vector3(x||0,y||0,z||0), Q=()=>new T.Quaternion(), UP=V(0,1,0);
const BASE=(document.currentScript&&document.currentScript.src||'').replace(/zsx\.js.*$/,'');
const Z=window.ZSX={active:false,endT:0,hold:false,cur:null,stick:{},revealed:[],
 busy(){ return Z.active||performance.now()-Z.endT<350||Z.hold; }};
const scn=()=>document.querySelector('a-scene');
function head(p,q){ const s=scn(), R=s.renderer, cam=s.camera; cam.getWorldPosition(p); if(q) cam.getWorldQuaternion(q); return p; }
// ---------- leise Klänge (WebAudio, kein Asset)
const AC=()=>{ try{ return window.__zsaAC||(window.__zsaAC=new (window.AudioContext||window.webkitAudioContext)()); }catch(e){ return null; } };
function noise(dur,type,f,q,vol,env,delay){ const ac=AC(); if(!ac) return; try{ac.resume();}catch(e){} const n=Math.max(1,Math.floor(ac.sampleRate*dur)), b=ac.createBuffer(1,n,ac.sampleRate), d=b.getChannelData(0);
 let l=0; for(let i=0;i<n;i++){ const k=i/n, w=Math.random()*2-1; l=(l+0.1*w)/1.1; d[i]=(type==='brown'?l*3:w)*vol*(env?env(k,i):Math.sin(Math.PI*k)); }
 const s=ac.createBufferSource(); s.buffer=b; const fl=ac.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=f; fl.Q.value=q; s.connect(fl); fl.connect(ac.destination); s.start(ac.currentTime+(delay||0)); }
function ping(f,dur,vol,delay){ const ac=AC(); if(!ac) return; const t=ac.currentTime+(delay||0), o=ac.createOscillator(), g=ac.createGain(); o.frequency.value=f; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+dur+0.02); }
const SX=Z.snd={
 lift:()=>noise(0.18,'w',1800,0.9,0.05,k=>Math.sin(Math.PI*k)),
 paper:()=>{ noise(0.28,'w',2600,0.7,0.07,(k,i)=>(0.4+0.6*Math.abs(Math.sin(i*0.0021)))*Math.sin(Math.PI*k)); },
 rattle:()=>{ [0,0.07,0.15,0.21].forEach((d,i)=>{ ping(2900+i*370,0.07,0.012,d); noise(0.03,'w',4200,3,0.05,k=>1-k,d); }); },
 clink:()=>{ ping(3100,0.25,0.03); ping(4420,0.18,0.018,0.01); noise(0.04,'w',5200,3,0.12,k=>1-k); setTimeout(()=>{ ping(3300,0.12,0.012); noise(0.03,'w',5000,3,0.05,k=>1-k); },140); },
 slide:dur=>{ noise(dur||0.7,'brown',420,0.8,0.5,(k,i)=>(0.55+0.45*Math.sin(i*0.0009+Math.sin(i*0.00023)*5))*(k<0.1?k/0.1:1-Math.pow(k,3))); noise(0.09,'brown',160,1.2,0.9,k=>1-k,(dur||0.7)-0.05); },
 metal:()=>{ const ac=AC(); if(ac){ const t=ac.currentTime, o=ac.createOscillator(), g=ac.createGain(); o.type='triangle'; o.frequency.setValueAtTime(820,t); o.frequency.linearRampToValueAtTime(1250,t+0.35); o.frequency.linearRampToValueAtTime(980,t+0.55); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.012,t+0.06); g.gain.linearRampToValueAtTime(0,t+0.55); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+0.6); }
  noise(0.05,'w',3400,2,0.35,k=>1-k); noise(0.12,'w',1300,2,0.12,k=>1-k,0.5); } };
// ---------- Handschrift-Font (OFL Kalam) für Zettel – vorladen, damit nie ein Fallback-Gekritzel entsteht
let fontP=null; Z.font=()=>fontP||(fontP=(window.FontFace?new FontFace('ZsxHand','url('+BASE+'../../fonts/Kalam-Regular.ttf)').load().then(f=>{ document.fonts.add(f); return 'ZsxHand'; }).catch(()=>'cursive'):Promise.resolve('cursive')));
const CLEAN='"Helvetica Neue",Roboto,"Segoe UI",Arial,sans-serif';
function wrap(x,text,maxW){ const out=[]; text.split('\n').forEach(par=>{ let line=''; par.split(' ').forEach(w=>{ const t=line?line+' '+w:w; if(x.measureText(t).width>maxW&&line){ out.push(line); line=w; } else line=t; }); out.push(line); }); return out; }
// Zettel/Beleg als Mesh (Canvas), z.B. auf die Rückseite eines Buchs
Z.noteMesh=function(text,w,h,opt){ opt=opt||{}; const c=document.createElement('canvas'); c.width=512; c.height=Math.round(512*h/w); const x=c.getContext('2d'), H=c.height;
 const tx=new T.CanvasTexture(c); tx.colorSpace=T.SRGBColorSpace; tx.anisotropy=4;
 const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tx,roughness:0.95,metalness:0}));
 const draw=fam=>{ const g=x.createLinearGradient(0,0,512,H); g.addColorStop(0,opt.paper||'#d8ceb2'); g.addColorStop(1,opt.paper2||'#b9ab88'); x.fillStyle=g; x.fillRect(0,0,512,H);
  for(let i=0;i<16;i++){ const rx=Math.random()*512, ry=Math.random()*H, r=20+Math.random()*90; const s=x.createRadialGradient(rx,ry,0,rx,ry,r); s.addColorStop(0,'rgba(110,85,45,0.15)'); s.addColorStop(1,'rgba(110,85,45,0)'); x.fillStyle=s; x.fillRect(0,0,512,H); }
  let y=40; if(opt.head){ x.fillStyle='#3b3328'; x.font='600 25px "Courier New",monospace'; wrap(x,opt.head,470).forEach(l=>{ x.fillText(l,22,y); y+=30; }); x.fillStyle='rgba(60,50,30,0.5)'; x.fillRect(20,y-14,472,1.5); y+=26;
   if(opt.stamp){ x.save(); x.translate(330,y+20); x.rotate(-0.12); x.strokeStyle='rgba(120,40,60,0.6)'; x.lineWidth=3; x.strokeRect(-110,-28,220,52); x.fillStyle='rgba(120,40,60,0.62)'; x.font='700 24px "Courier New",monospace'; x.textAlign='center'; x.fillText(opt.stamp,0,6); x.restore(); y+=70; } }
  x.fillStyle='rgba(60,50,30,0.22)'; for(let ly=y+8;ly<H-10;ly+=38) x.fillRect(16,ly,480,1);
  let fs=opt.fs||34; x.font=fs+'px '+fam; let lines=wrap(x,text,470); while(y+lines.length*(fs*1.15)>H-8&&fs>18){ fs-=2; x.font=fs+'px '+fam; lines=wrap(x,text,470); }
  x.fillStyle='#262036'; lines.forEach(l=>{ x.fillText(l,24,y+fs*0.4); y+=fs*1.15; });
  if(opt.tape){ x.fillStyle='rgba(235,230,200,0.5)'; x.save(); x.translate(256,4); x.rotate(-0.05); x.fillRect(-55,-8,110,24); x.restore(); }
  tx.needsUpdate=true; };
 draw('cursive'); Z.font().then(draw); return m; };
// ---------- dezente Untertitel-Zeile in der Welt (unter dem Gegenstand)
function caption(text,pos,look){ const c=document.createElement('canvas'); c.width=1024; c.height=150; const x=c.getContext('2d'); let fs=34; x.font='500 '+fs+'px '+CLEAN;
 let lines=wrap(x,text,940); while(lines.length>2&&fs>22){ fs-=2; x.font='500 '+fs+'px '+CLEAN; lines=wrap(x,text,940); } lines=lines.slice(0,2);
 const w=Math.min(1010,Math.max(...lines.map(l=>x.measureText(l).width))+56), h=lines.length*fs*1.3+26; x.fillStyle='rgba(6,5,4,0.55)'; x.beginPath(); (x.roundRect?x.roundRect(512-w/2,75-h/2,w,h,14):x.rect(512-w/2,75-h/2,w,h)); x.fill();
 x.fillStyle='#d2c4a2'; x.textAlign='center'; x.textBaseline='middle'; lines.forEach((l,i)=>x.fillText(l,512,75+(i-(lines.length-1)/2)*fs*1.3));
 const tx=new T.CanvasTexture(c); tx.colorSpace=T.SRGBColorSpace; const m=new T.Mesh(new T.PlaneGeometry(0.44,0.0645),new T.MeshBasicMaterial({map:tx,transparent:true,opacity:0,depthWrite:false,toneMapped:false,fog:false}));
 m.position.copy(pos); m.lookAt(look.x,pos.y,look.z); m.renderOrder=20; scn().object3D.add(m); const t0=performance.now();
 const f=()=>{ if(!m.parent) return; const k=(performance.now()-t0)/1000; m.material.opacity=k<0.6?0.9*k/0.6:(k<6?0.9:Math.max(0,0.9*(1-(k-6)/1.2))); if(k<7.2) requestAnimationFrame(f); else { m.parent.remove(m); } }; f(); return m; }
Z.caption=caption;
// ---------- Untersuchen
function brighten(obj,on,st){ if(on){ obj.traverse(o=>{ if(!o.isMesh) return; const one=mt=>{ if(!mt||!mt.isMeshStandardMaterial) return mt; const c=mt.clone(); if(mt.map&&!mt.emissiveMap){ c.emissiveMap=mt.map; c.emissive=new T.Color(0x2c2924); } else c.emissive=(mt.emissive?mt.emissive.clone():new T.Color(0)).add(new T.Color(mt.color||0x808080).multiplyScalar(0.16)); return c; };
  st.mats.push([o,o.material]); o.material=Array.isArray(o.material)?o.material.map(one):one(o.material); }); }
 else st.mats.forEach(([o,m])=>{ const cur=o.material; o.material=m; (Array.isArray(cur)?cur:[cur]).forEach(c=>{ if(c!==m&&c&&c.dispose&&!(Array.isArray(m)&&m.includes(c))) c.dispose(); }); }); }
const basis=(z,y)=>{ const zz=z.clone().normalize(), xx=V().crossVectors(y,zz).normalize(), yy=V().crossVectors(zz,xx); return Q().setFromRotationMatrix(new T.Matrix4().makeBasis(xx,yy,zz)); };
let dimM=null;
Z.examine=function(obj,o){ o=o||{}; if(Z.active||!obj||!obj.parent) return false; const s=scn(), S=s.object3D; hook();
 const st={obj,o,par:obj.parent,pos:obj.position.clone(),quat:obj.quaternion.clone(),scl:obj.scale.clone(),t0:performance.now(),mode:o.mode||'laser',src:o.src||null,qr:Q(),mats:[],secT:0,ending:0,cap:null};
 obj.updateMatrixWorld(true); const box=new T.Box3().setFromObject(obj), c=box.getCenter(V()), r=Math.max(0.008,box.getSize(V()).length()/2);
 const piv=new T.Group(); piv.position.copy(c); S.add(piv); piv.updateMatrixWorld(true); piv.attach(obj); st.piv=piv; st.from=c.clone();
 st.f=Math.max(1,Math.min(3.2,(o.size||0.085)/r));
 const hp=V(), hq=Q(); head(hp,hq); const fw=V(0,0,-1).applyQuaternion(hq); fw.y=0; if(fw.lengthSq()<1e-4) fw.set(0,0,-1); fw.normalize();
 const to=hp.clone().addScaledVector(fw,o.dist||0.45); to.y=hp.y-0.07; st.to=to; st.fw=fw; st.right=V().crossVectors(fw,UP).normalize(); st.head=hp.clone();
 st.q1=Q(); if(o.face){ const toH=hp.clone().sub(to).normalize(); const Qa=basis(toH,UP), Qb=basis(V(...o.face),V(...(o.up||[0,1,0]))); const Qt=Qa.multiply(Qb.invert()); const W0=Q(); obj.getWorldQuaternion(W0); st.q1.copy(Qt).multiply(W0.invert()); }
 else { const yaw=Math.atan2(-fw.x,-fw.z); st.q1.setFromAxisAngle(st.right,0.35); }
 if(!dimM) dimM=new T.Mesh(new T.SphereGeometry(1.25,24,14),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0,side:T.BackSide,depthWrite:false,fog:false})); dimM.position.copy(hp); dimM.renderOrder=10; S.add(dimM);
 brighten(obj,true,st);
 if(st.mode==='grip'&&st.src){ st.hq=Q(); st.src.object3D.getWorldQuaternion(st.hq); }
 const camEl=s.camera&&s.camera.el; st.ctl=[]; if(camEl&&!s.renderer.xr.isPresenting) ['look-controls','wasd-controls'].forEach(k=>{ if(camEl.components[k]){ st.ctl.push(k); camEl.setAttribute(k,'enabled',false); } });
 Z.active=true; Z.cur=st; SX.lift(); if(o.onStart) o.onStart(st); return true; };
function end(){ const st=Z.cur; if(!st||st.ending) return; st.ending=performance.now(); st.e0={p:st.piv.position.clone(),q:st.piv.quaternion.clone(),s:st.piv.scale.x}; SX.lift(); if(st.cap&&st.cap.parent) st.cap.parent.remove(st.cap); }
Z.end=end;
function finish(st){ const obj=st.obj; brighten(obj,false,st); st.piv.remove(obj); st.par.add(obj); obj.position.copy(st.pos); obj.quaternion.copy(st.quat); obj.scale.copy(st.scl); obj.updateMatrixWorld(true);
 st.piv.parent&&st.piv.parent.remove(st.piv); if(dimM&&dimM.parent) dimM.parent.remove(dimM);
 const camEl=scn().camera&&scn().camera.el; st.ctl.forEach(k=>camEl.setAttribute(k,'enabled',true));
 Z.active=false; Z.cur=null; Z.endT=performance.now(); if(st.o.onEnd) st.o.onEnd(st); }
const ease=k=>k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
const tmpQ=Q(), tmpV=V(), hp2=V();
function tick(dt){ const st=Z.cur; if(!st) return; const now=performance.now(), p=st.piv;
 if(st.ending){ const k=ease(Math.min(1,(now-st.ending)/280)); p.position.lerpVectors(st.e0.p,st.from,k); p.quaternion.slerpQuaternions(st.e0.q,tmpQ.identity(),k); p.scale.setScalar(st.e0.s+(1-st.e0.s)*k); if(dimM) dimM.material.opacity=0.42*(1-k); if(k>=1) finish(st); return; }
 const k=ease(Math.min(1,(now-st.t0)/320)); if(dimM) dimM.material.opacity=0.42*k;
 // Drehen: Sticks (beide Hände), Hand-Rotation im Grip-Modus
 let ax=0, ay=0; Object.values(Z.stick).forEach(v=>{ if(Math.abs(v[0])>0.15) ax+=v[0]; if(Math.abs(v[1])>0.15) ay+=v[1]; });
 if(Z.noRotate){ ax=0; ay=0; }
 if(ax) st.qr.premultiply(tmpQ.setFromAxisAngle(UP,ax*2.4*dt)); if(ay) st.qr.premultiply(tmpQ.setFromAxisAngle(st.right,ay*2.4*dt));
 if(st.mode==='grip'&&st.src){ const qn=Q(); st.src.object3D.getWorldQuaternion(qn); st.qr.premultiply(qn.clone().multiply(st.hq.clone().invert())); st.hq.copy(qn); }
 if(st.drag){ st.qr.premultiply(tmpQ.setFromAxisAngle(UP,st.drag[0]*0.011)); st.qr.premultiply(tmpQ.setFromAxisAngle(st.right,st.drag[1]*0.011)); st.drag=null; }
 p.position.lerpVectors(st.from,st.to,k); p.quaternion.slerpQuaternions(tmpQ.identity(),st.q1,k).premultiply(st.qr); p.scale.setScalar(1+(st.f-1)*k);
 // Geheimnis: die richtige Seite zeigt zu dir (oder umgedreht)
 const sec=st.o.secret; if(sec&&!sec.done&&k>=1){ const wq=Q(); st.obj.getWorldQuaternion(wq); let ok=false;
  if(sec.down){ ok=V(0,1,0).applyQuaternion(wq).dot(UP)<-0.55; }
  else { head(hp2); const toH=hp2.sub(p.position).normalize(); ok=V(...sec.axis).applyQuaternion(wq).normalize().dot(toH)>0.78; }
  st.secT=ok?st.secT+dt:0; if(st.secT>0.35){ sec.done=true; Z.revealed.push(sec.id||sec.cap||'x'); (sec.sound||SX.paper)(); if(sec.cap) st.cap=caption(sec.cap,st.to.clone().add(V(0,-0.15,0)),st.head); if(sec.onReveal) sec.onReveal(st.obj,st); } } }
// ---------- Eingaben (einmalig)
let hooked=false;
function hook(){ if(hooked) return; hooked=true; const s=scn();
 const ctl=()=>document.querySelectorAll('[laser-controls],[oculus-touch-controls],[hand-controls]'); const seen=new Set();
 const hk=()=>ctl().forEach(el=>{ if(seen.has(el)) return; seen.add(el); const id=el.id||('c'+seen.size);
  el.addEventListener('thumbstickmoved',e=>{ Z.stick[id]=[e.detail.x,e.detail.y]; });
  ['bbuttondown','ybuttondown'].forEach(ev=>el.addEventListener(ev,()=>{ if(Z.active) end(); }));
  el.addEventListener('triggerdown',()=>{ const st=Z.cur; if(st&&!st.ending&&performance.now()-st.t0>250){ Z.hold=true; end(); } });
  el.addEventListener('triggerup',()=>{ if(Z.hold) setTimeout(()=>{ Z.hold=false; },90); });
  el.addEventListener('gripup',()=>{ const st=Z.cur; if(st&&!st.ending&&st.mode==='grip'&&st.src===el) end(); }); });
 hk(); [800,3000].forEach(ms=>setTimeout(hk,ms));
 const cv=s.canvas; let down=null, moved=0;
 cv.addEventListener('mousedown',e=>{ if(!Z.active) return; down=[e.clientX,e.clientY]; moved=0; },true);
 window.addEventListener('mousemove',e=>{ if(!down||!Z.cur) return; const dx=e.clientX-down[0], dy=e.clientY-down[1]; moved+=Math.abs(dx)+Math.abs(dy); down=[e.clientX,e.clientY]; const d=Z.cur.drag||[0,0]; Z.cur.drag=[d[0]+dx,d[1]+dy]; });
 window.addEventListener('mouseup',()=>{ if(!down) return; down=null; const st=Z.cur; if(st&&!st.ending&&moved<6&&performance.now()-st.t0>250) end(); },true);
 window.addEventListener('keydown',e=>{ if(Z.active&&(e.key==='Escape'||e.key===' '||e.key==='e')) end(); });
 let last=performance.now(); AFRAME.registerComponent('zsx-tick',{tick(){ const n=performance.now(), dt=Math.min(0.05,(n-last)/1000); last=n; tick(dt); (Z.ticks||[]).forEach(f=>f(dt)); }}); s.setAttribute('zsx-tick',''); }
Z.onTick=f=>{ (Z.ticks=Z.ticks||[]).push(f); const s=scn(); if(s&&s.hasLoaded) hook(); else if(s) s.addEventListener('loaded',hook); };
// Klickbar machen: Laser/Klick = Untersuchen, Grip in Reichweite = mit der Hand drehen
Z.makeExaminable=function(el,opt){ opt=opt||{}; el.classList.add('clickable');
 el.addEventListener('click',e=>{ if(Z.busy()) return; e.stopPropagation&&e.stopPropagation(); const src=e.detail&&e.detail.cursorEl; const vr=src&&src.hasAttribute&&src.hasAttribute('laser-controls');
  if(Z.examine(el.object3D,Object.assign({},opt,{mode:vr?'laser':'mouse',src:vr?src:null}))&&opt.onPick) opt.onPick(); });
 const seen=new Set(); const hg=()=>document.querySelectorAll('[laser-controls]').forEach(h=>{ if(seen.has(h)) return; seen.add(h); h.addEventListener('gripdown',()=>{ if(Z.busy()) return; const a=V(), b=V(); h.object3D.getWorldPosition(a); el.object3D.getWorldPosition(b); if(a.distanceTo(b)<(opt.grip||0.25)&&Z.examine(el.object3D,Object.assign({},opt,{mode:'grip',src:h}))&&opt.onPick) opt.onPick(); }); });
 hg(); setTimeout(hg,2000); };
// =====================================================================================
// Versteckte Schlüssel: ZSX.hide(sceneEl, keyCfg, holder, enable) – keyCfg.hide = {type:'drawer'|'locker'|'tin', x, z, ry, ...}
// =====================================================================================
const TL=()=>window.__zsaTL||(window.__zsaTL=new T.TextureLoader()); const ROOT=BASE+'../../';
function pbr(name,col,rep,o){ o=o||{}; const m=new T.MeshStandardMaterial({color:col,roughness:o.r==null?0.7:o.r,metalness:o.m||0}); const b=ROOT+'assets/tex/ph/'+name+'_';
 const L=(k,f)=>TL().load(b+k+'.jpg',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep[0],rep[1]); f(t); m.needsUpdate=true; });
 L('diff',t=>{ t.colorSpace=T.SRGBColorSpace; m.map=t; }); L('rough',t=>m.roughnessMap=t); L('nor_gl',t=>{ m.normalMap=t; m.normalScale.set(0.7,0.7); }); return m; }
const blobTex=()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,2,32,32,31); g.addColorStop(0,'rgba(0,0,0,0.78)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); return new T.CanvasTexture(c); };
function blob(g,w,d){ const m=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:blobTex(),transparent:true,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=0.003; g.add(m); }
function plate(text,w,h,col,bg){ const c=document.createElement('canvas'); c.width=256; c.height=Math.round(256*h/w); const x=c.getContext('2d'); x.fillStyle=bg||'#2a2216'; x.fillRect(0,0,256,c.height);
 x.fillStyle=col||'#b49a66'; let fs=Math.round(c.height*0.62); x.font='600 '+fs+'px '+CLEAN; while(x.measureText(text).width>232&&fs>8){ fs--; x.font='600 '+fs+'px '+CLEAN; } x.textAlign='center'; x.textBaseline='middle'; x.fillText(text,128,c.height/2+1);
 const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t; }
// Klick-Fläche als A-Frame-Entity (laser-controls / cursor), weltfest an ein Mesh gekoppelt
function hitEnt(sceneEl,w,h,d,anchor,onClick){ const e=document.createElement('a-entity'); e.classList.add('clickable'); sceneEl.appendChild(e);
 const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
 const sync=()=>{ anchor.updateWorldMatrix(true,false); anchor.matrixWorld.decompose(e.object3D.position,e.object3D.quaternion,V()); };
 const init=()=>{ e.setObject3D('mesh',m); sync(); setTimeout(sync,500); setTimeout(sync,2500); e.addEventListener('click',ev=>{ if(Z.busy()) return; onClick(ev); }); }; e.hasLoaded?init():e.addEventListener('loaded',init); e.sync=sync; return e; }
// Grip-and-pull über A-Frame-Controller
function gripHook(fn){ const seen=new Set(); const h=()=>document.querySelectorAll('[laser-controls]').forEach(el=>{ if(seen.has(el)) return; seen.add(el); el.addEventListener('gripdown',()=>fn(el,true)); el.addEventListener('gripup',()=>fn(el,false)); }); h(); setTimeout(h,1500); setTimeout(h,4000); }
// ---------- Schubladen-Schrank (Holz-PBR, Messinggriff), Schlüssel liegt in der Schublade
function drawer(sceneEl,h,holder,enable){ const S=sceneEl.object3D, g=new T.Group(); g.position.set(h.x,h.y||0,h.z); g.rotation.y=(h.ry||0)*Math.PI/180; S.add(g);
 const dark=!!h.dark, W=h.w||0.58, H=h.h||0.68, D=h.d||0.42, th=0.018;
 const wood=pbr('wood_table_001',dark?0x3a3330:0x8a7560,[1,1]), woodIn=pbr('wood_table_001',dark?0x241f1c:0x4f4236,[1,1]), plinth=new T.MeshStandardMaterial({color:0x0e0c0a,roughness:0.9});
 const brass=new T.MeshStandardMaterial({color:dark?0x8a8c8e:0x8a6a38,roughness:dark?0.3:0.42,metalness:0.9});
 const bx=(w,hh,d,m,x,y,z,p)=>{ const o=new T.Mesh(new T.BoxGeometry(w,hh,d),m); o.position.set(x,y,z); (p||g).add(o); return o; };
 bx(W-0.05,0.06,D-0.05,plinth,0,0.03,-0.005); // Sockel
 bx(th,H-0.06,D,wood,-W/2+th/2,0.06+(H-0.06)/2,0); bx(th,H-0.06,D,wood,W/2-th/2,0.06+(H-0.06)/2,0); bx(W,H-0.06,0.012,woodIn,0,0.06+(H-0.06)/2,-D/2+0.006);
 bx(W-2*th,th,D,wood,0,0.06+th/2,0); bx(W+0.03,0.026,D+0.028,wood,0,H+0.013,0.006); bx(W-2*th,0.016,D-0.014,woodIn,0,H-0.205,0);
 const dh=0.17; const lowH=H-0.06-dh-0.03; // zwei Türchen unten (zu)
 [-1,1].forEach(sd=>{ bx(W/2-th-0.006,lowH,0.018,wood,sd*(W/4-0.003),0.06+th+lowH/2+0.004,D/2-0.009); const kn=new T.Mesh(new T.SphereGeometry(0.011,12,8),brass); kn.position.set(sd*0.035,0.06+th+lowH*0.72,D/2+0.008); g.add(kn); });
 bx(0.004,lowH,0.016,new T.MeshBasicMaterial({color:0x050403}),0,0.06+th+lowH/2+0.004,D/2-0.01);
 // Schublade
 const dg=new T.Group(); dg.position.set(0,H-0.112,0); g.add(dg); const iw=W-2*th-0.012;
 bx(W-2*th-0.004,dh,0.02,wood,0,0,D/2-0.01,dg); bx(0.012,0.11,D-0.05,woodIn,-iw/2+0.006,-0.02,-0.012,dg); bx(0.012,0.11,D-0.05,woodIn,iw/2-0.006,-0.02,-0.012,dg);
 bx(iw,0.008,D-0.05,woodIn,0,-0.072,-0.012,dg); bx(iw,0.11,0.012,woodIn,0,-0.02,-D/2+0.03,dg);
 const ph=new T.Group(); ph.position.set(0,0.0,D/2+0.001); dg.add(ph); // Griff
 const bar=new T.Mesh(new T.CylinderGeometry(0.006,0.006,0.13,12),brass); bar.rotation.z=Math.PI/2; bar.position.z=0.026; ph.add(bar);
 [-1,1].forEach(sd=>{ const p=new T.Mesh(new T.CylinderGeometry(0.0055,0.0065,0.026,10),brass); p.rotation.x=Math.PI/2; p.position.set(sd*0.055,0,0.013); ph.add(p); });
 if(h.plate){ const pm=new T.Mesh(new T.PlaneGeometry(0.1,0.024),new T.MeshStandardMaterial({map:plate(h.plate,0.1,0.024,dark?'#9aa0a4':'#c0a26a',dark?'#16181a':'#2a2014'),roughness:0.45,metalness:0.6})); pm.position.set(0,0.052,D/2+0.0012); dg.add(pm); }
 // Fundstücke in der Schublade (Füllung, kein Leerraum): Zettel, Stift, ggf. Kram
 const slot=new T.Group(); slot.position.set(0.04,-0.068,0.02); dg.add(slot);
 const n1=Z.noteMesh(h.inNote||'Abgegeben: 1 Schlüssel, Messing. Keiner hat ihn vermisst.',0.11,0.075,{fs:30}); n1.rotation.set(-Math.PI/2,0,0.25); n1.position.set(-0.13,-0.067,0.0); dg.add(n1);
 const pen=new T.Mesh(new T.CylinderGeometry(0.004,0.004,0.13,8),new T.MeshStandardMaterial({color:0x1a2a4a,roughness:0.4})); pen.rotation.set(Math.PI/2,0,1.2); pen.position.set(0.15,-0.064,-0.06); dg.add(pen);
 slot.add(holder); holder.position.set(0,0.004,0); blob(g,W*1.5,D*1.6);
 const MAX=h.out||0.27; let open=0, anim=null, pull=null, revealed=false;
 const set=v=>{ open=Math.max(0,Math.min(MAX,v)); dg.position.z=open; if(!revealed&&open>MAX*0.55){ revealed=true; enable(); } };
 const openAll=()=>{ if(anim||open>=MAX-0.002) return; const a=open, t0=performance.now(), dur=650*(1-a/MAX)+150; SX.slide(dur/1000); anim=()=>{ const k=Math.min(1,(performance.now()-t0)/dur); set(a+(MAX-a)*(1-Math.pow(1-k,3))); if(k>=1){ anim=null; hit.classList.remove('clickable'); } }; };
 const hit=hitEnt(sceneEl,W-0.03,dh+0.02,0.08,ph,()=>openAll());
 gripHook((el,down)=>{ const a=V(); el.object3D.getWorldPosition(a); const hp=V(); ph.getWorldPosition(hp);
  if(down){ if(a.distanceTo(hp)<0.2&&!anim){ const ax=V(0,0,1).applyQuaternion(g.getWorldQuaternion(Q())); pull={el,a0:a.clone(),o0:open,ax,snd:false}; } } else if(pull&&pull.el===el){ pull=null; if(open>0.1) openAll(); } });
 Z.onTick(()=>{ if(anim) anim(); if(pull){ const a=V(); pull.el.object3D.getWorldPosition(a); const v=pull.o0+a.sub(pull.a0).dot(pull.ax); if(!pull.snd&&v-open>0.01){ pull.snd=true; SX.slide(0.6); } set(v); } });
 return {g,handle:ph,open:openAll,get open01(){ return open/MAX; }}; }
// ---------- Wertfächer (Hallenbad): 2×2 Metallfächer, Fach 37 lässt sich öffnen
function locker(sceneEl,h,holder,enable){ const S=sceneEl.object3D, g=new T.Group(); g.position.set(h.x,0,h.z); g.rotation.y=(h.ry||0)*Math.PI/180; S.add(g);
 const met=pbr('painted_metal_shutter',h.col||0xd2e6dc,[0.6,0.6],{r:0.55,m:0.3}), metD=pbr('painted_metal_shutter',0x8a9a92,[0.6,0.6],{r:0.6,m:0.3}), inner=new T.MeshStandardMaterial({color:0x101412,roughness:0.9,metalness:0.2});
 const steel=new T.MeshStandardMaterial({color:0x9a9fa0,roughness:0.32,metalness:0.95}), blk=new T.MeshBasicMaterial({color:0x040505});
 const bx=(w,hh,d,m,x,y,z,p)=>{ const o=new T.Mesh(new T.BoxGeometry(w,hh,d),m); o.position.set(x,y,z); (p||g).add(o); return o; };
 const CW=0.3, CH=0.32, D=0.4, base=0.62, nums=h.nums||[35,36,37,38], target=h.num||37;
 // Gestell + Korpus
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>bx(0.03,base,0.03,metD,sx*(CW-0.02),base/2,sz*(D/2-0.02)));
 bx(2*CW+0.02,0.02,D,metD,0,base+0.01,0); bx(2*CW+0.02,0.02,D,metD,0,base+2*CH+0.03,0); bx(0.012,2*CH+0.02,D,metD,-CW-0.004,base+CH+0.02,0); bx(0.012,2*CH+0.02,D,metD,CW+0.004,base+CH+0.02,0);
 bx(2*CW,0.012,D,metD,0,base+CH+0.02,0); bx(0.01,2*CH,D,metD,0,base+CH+0.02,0); bx(2*CW,2*CH,0.01,inner,0,base+CH+0.02,-D/2+0.005);
 let door=null, slot=null; const handle=new T.Group();
 nums.forEach((n,i)=>{ const col=i%2, row=1-Math.floor(i/2), cx=(col-0.5)*CW, cy=base+0.02+CH/2+row*(CH+0.008);
  const hinge=new T.Group(); hinge.position.set(cx-CW/2+0.008,cy,D/2); g.add(hinge);
  const lf=bx(CW-0.016,CH-0.012,0.012,met,(CW-0.016)/2,0,0.006,hinge);
  for(let v=0;v<4;v++) bx(0.11,0.005,0.002,blk,(CW-0.016)/2,0.1-v*0.016,0.0131,hinge);
  const np=new T.Mesh(new T.CircleGeometry(0.022,20),new T.MeshStandardMaterial({map:plate(String(n),0.044,0.044,'#1b1d1e','#d9d4c6'),roughness:0.35,metalness:0.1})); np.position.set((CW-0.016)/2,-0.035,0.0125); hinge.add(np);
  const lk=new T.Mesh(new T.CylinderGeometry(0.013,0.013,0.012,16),steel); lk.rotation.x=Math.PI/2; lk.position.set(CW-0.05,-0.01,0.017); hinge.add(lk); bx(0.003,0.012,0.002,blk,CW-0.05,-0.01,0.0235,hinge);
  if(n===target){ door=hinge; handle.position.set(CW-0.05,-0.01,0.02); hinge.add(handle); slot=new T.Group(); slot.position.set(cx,cy-CH/2+0.008,0.0); g.add(slot);
   const tw=Z.noteMesh(h.inNote||'Fach 37. Wieder nicht abgeholt.',0.09,0.06,{fs:28}); tw.rotation.set(-Math.PI/2,0,-0.3); tw.position.set(-0.07,0.002,-0.06); slot.add(tw);
   const bc=new T.Mesh(new T.CylinderGeometry(0.015,0.015,0.003,18),new T.MeshStandardMaterial({color:0x6b5a3a,roughness:0.5,metalness:0.8})); bc.position.set(0.07,0.002,-0.04); slot.add(bc); } });
 slot.add(holder); holder.position.set(0,0.004,0.03); blob(g,0.9,0.7);
 let ang=0, anim=null, revealed=false; const MAX=1.85;
 const openIt=()=>{ if(anim||ang>=MAX) return; const t0=performance.now(); SX.metal(); anim=()=>{ const k=Math.min(1,(performance.now()-t0)/700); ang=MAX*(1-Math.pow(1-k,3)); door.rotation.y=-ang; if(!revealed&&ang>0.9){ revealed=true; enable(); } if(k>=1){ anim=null; hit.classList.remove('clickable'); } }; };
 const dc=new T.Object3D(); dc.position.set((CW-0.016)/2,0,0.01); door.add(dc); const hit=hitEnt(sceneEl,CW-0.02,CH-0.02,0.06,dc,()=>openIt());
 let pull=null; gripHook((el,down)=>{ const a=V(); el.object3D.getWorldPosition(a); const hp=V(); handle.getWorldPosition(hp); if(down){ if(a.distanceTo(hp)<0.2) pull={el,a0:a.clone()}; } else if(pull&&pull.el===el){ pull=null; } });
 Z.onTick(()=>{ if(anim) anim(); if(pull){ const a=V(); pull.el.object3D.getWorldPosition(a); if(a.distanceTo(pull.a0)>0.04){ pull=null; openIt(); } } });
 return {g,handle,open:openIt,get open01(){ return ang/MAX; }}; }
// ---------- Blechdose (Bohnenkaffee): untersuchen, umdrehen → Schlüssel fällt heraus
function tin(sceneEl,h,holder,enable){ const S=sceneEl.object3D;
 const c=document.createElement('canvas'); c.width=512; c.height=192; const x=c.getContext('2d');
 const draw=fam=>{ const g=x.createLinearGradient(0,0,0,192); g.addColorStop(0,'#5a1810'); g.addColorStop(1,'#3a0e09'); x.fillStyle=g; x.fillRect(0,0,512,192);
  x.fillStyle='#b8933e'; x.fillRect(0,14,512,6); x.fillRect(0,172,512,6); x.fillStyle='#d9c48a'; x.font='700 50px Georgia,"Times New Roman",serif'; x.textAlign='center'; x.fillText('Bohnenkaffee',128,96); x.fillText('Bohnenkaffee',384,96);
  x.font='500 21px '+CLEAN; x.fillStyle='#c9b47a'; x.fillText('gemahlen · 250 g',128,136); x.fillText('VEB Kaffeerösterei',384,136);
  for(let i=0;i<260;i++){ x.fillStyle='rgba(20,10,5,'+(Math.random()*0.35)+')'; const r=Math.random()*3; x.fillRect(Math.random()*512,Math.random()*192,r,r); }
  for(let i=0;i<30;i++){ x.strokeStyle='rgba(200,190,170,'+(0.1+Math.random()*0.2)+')'; x.lineWidth=0.7; const sx=Math.random()*512, sy=Math.random()*192; x.beginPath(); x.moveTo(sx,sy); x.lineTo(sx+Math.random()*40-20,sy+Math.random()*6-3); x.stroke(); } };
 draw(); const lt=new T.CanvasTexture(c); lt.colorSpace=T.SRGBColorSpace;
 const label=new T.MeshStandardMaterial({map:lt,roughness:0.45,metalness:0.55}), tinM=new T.MeshStandardMaterial({color:0xa8a49a,roughness:0.35,metalness:0.9});
 const R=0.052, Hh=0.115, grp=new T.Group();
 const body=new T.Mesh(new T.CylinderGeometry(R,R,Hh,28,1,true),label); body.position.y=Hh/2; grp.add(body);
 const bot=new T.Mesh(new T.CircleGeometry(R,28),tinM); bot.rotation.x=Math.PI/2; bot.position.y=0.001; grp.add(bot);
 const lid=new T.Mesh(new T.CylinderGeometry(R+0.003,R+0.003,0.016,28),tinM); lid.position.y=Hh+0.004; grp.add(lid);
 const rim=new T.Mesh(new T.TorusGeometry(R+0.001,0.002,6,28),tinM); rim.rotation.x=Math.PI/2; rim.position.y=0.004; grp.add(rim);
 // Boden-Prägung (zweites, kleines Geheimnis ist nicht nötig – der Schlüssel klappert)
 const el=document.createElement('a-entity'); sceneEl.appendChild(el);
 const init=()=>{ el.setObject3D('mesh',grp); el.object3D.position.set(h.x,h.y||0,h.z); el.object3D.rotation.y=(h.ry||0)*Math.PI/180;
  const bl=new T.Mesh(new T.PlaneGeometry(0.16,0.16),new T.MeshBasicMaterial({map:blobTex(),transparent:true,depthWrite:false})); bl.rotation.x=-Math.PI/2; bl.position.set(h.x,(h.y||0)+0.003,h.z); S.add(bl); };
 el.hasLoaded?init():el.addEventListener('loaded',init);
 holder.visible=false; S.add(holder);
 const fall=(st)=>{ // Schlüssel fällt aus der Dose (Schwerkraft) auf die Fläche darunter, Klirren
  const p0=V(); st.obj.getWorldPosition(p0); holder.position.copy(p0); holder.visible=true; let vy=0, y=p0.y, done=false;
  const rc=new T.Raycaster(V(p0.x,p0.y,p0.z),V(0,-1,0),0,3); const objs=[]; S.traverse(o=>{ if(o.isMesh&&o.visible&&!(o.material&&(o.material.visible===false||o.material.transparent||o.material.side===T.BackSide))){ let p=o, mine=false; while(p){ if(p===holder||p===st.piv) { mine=true; break; } p=p.parent; } if(!mine) objs.push(o); } });
  const hit=rc.intersectObjects(objs,false).find(x=>x.face&&Math.abs(x.face.normal.y)>0.3); const fy=(hit?hit.point.y:0)+0.006;
  Z.onTick(dt=>{ if(done) return; vy-=9.8*dt; y+=vy*dt; if(y<=fy){ y=fy; done=true; SX.clink(); setTimeout(enable,200); } holder.position.y=y; }); };
 const sec={down:true,id:'tin',cap:h.cap||'Etwas klappert heraus.',sound:SX.clink,onReveal:(o,st)=>fall(st)};
 Z.makeExaminable(el,{size:0.11,face:[0,0,1],onStart:()=>{ if(!sec.done) setTimeout(SX.rattle,120); },secret:sec});
 return {el,handle:grp,sec}; }
Z.hide=function(sceneEl,cfg,holder,enable){ const h=cfg.hide; if(!h) return null;
 const r=h.type==='drawer'?drawer(sceneEl,h,holder,enable):h.type==='locker'?locker(sceneEl,h,holder,enable):h.type==='tin'?tin(sceneEl,h,holder,enable):null; return (window.__zsxHide=r);
 };
})();
