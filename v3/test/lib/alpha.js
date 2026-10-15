// Rewind V3 – Alpha-Ablauf. EINE Liste steuert die Reihenfolge: einfach Einträge umstellen.
// Jeder Raum bekommt eine Tür in der Welt (kein Leucht-Hotspot): anfassen, hindurchgehen oder mit Laser/Klick öffnen → nächster Raum.
// Zustand: localStorage 'zs_alpha_v1' {step} + URL ?alpha=1&step=n (URL hat Vorrang).
(function(){
const STEPS=[ // Reihenfolge laut Story-Struktur (Story-Bot, Abschnitt 5: Akt 1–3)
 {id:'intro',      page:'alpha.html', title:'Intro'},
 {id:'backrooms',  page:'alpha.html', title:'Backrooms'},
 {id:'era1984',    page:'test/era1984.html',       title:'Kinderzimmer 1984',  door:{x:1.5, z:1.95, face:[0,0]}},
 {id:'era1984mall',page:'test/era1984mall.html',   title:'Mall 1984',          door:{x:1.9, z:2.3, face:[0,0]}},
 {id:'arcade',     page:'test/era_arcade.html',    title:'Spielhalle 1984',    door:{x:1.9, z:2.3, face:[0,0]}},
 {id:'pool',       page:'test/era_pool.html',      title:'Hallenbad',          door:{x:1.9, z:2.3, face:[0,0]}},
 {id:'cornfield',  page:'test/era_cornfield.html', title:'Maisfeld',           door:{x:1.9, z:2.3, face:[0,0]}},
 {id:'kirmes',     page:'test/kirmes.html',        title:'Kirmes',             door:{x:-3.4,z:2.6, face:[0,0.4]}},
 {id:'era1989',    page:'test/era1989.html',       title:'Ostberlin 1989',     door:{x:1.9, z:2.3, face:[0,0]}},
 {id:'basket',     page:'test/basket.html',        title:'Hinterhof',          door:{x:-2.6,z:4.6, face:[0,2.2]}},
 {id:'era2041',    page:'test/era2041.html',       title:'Stadt 2041',         door:{x:1.9, z:2.3, face:[0,0]}},
 {id:'apartment',  page:'test/era_apartment.html', title:'Apartment 2041',     door:{x:1.9, z:2.3, face:[0,0]}},
 {id:'sim',        page:'test/sim.html',           title:'Simulator',          door:{x:14.3,z:4.9, face:[12,3.4]}},
 {id:'end',        page:'alpha.html', title:'Ende'} ];
const KEY='zs_alpha_v1', P=new URLSearchParams(location.search), inTest=/\/test\//.test(location.pathname), ROOT=inTest?'../':'';
const ls=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } };
const save=st=>{ try{ localStorage.setItem(KEY,JSON.stringify(Object.assign(ls(),st,{t:Date.now()}))); }catch(e){} };
const on=P.get('alpha')==='1'||/alpha\.html$/.test(location.pathname);
let step=P.has('step')?+P.get('step'):(ls().step||0); step=Math.max(0,Math.min(STEPS.length-1,step|0));
const url=i=>{ const s=STEPS[i]; return ROOT+s.page+'?alpha=1&step='+i+(s.page==='alpha.html'?'#'+s.id:''); };
function fadeOut(cb){ let f=document.getElementById('zsaFade'); if(!f){ f=document.createElement('div'); f.id='zsaFade'; f.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:99;transition:opacity .28s'; document.body.appendChild(f); }
 requestAnimationFrame(()=>{ f.style.opacity='1'; }); setTimeout(cb,300); }
function goStep(i){ i=Math.max(0,Math.min(STEPS.length-1,i)); save({step:i}); fadeOut(()=>{ location.href=url(i); }); }
window.ZSA={on,STEPS,get step(){return step;},cur:()=>STEPS[step],goStep,next:()=>goStep(step+1),reset:()=>{ save({step:0}); },url};
if(!on) return;
save({step});
// Quest: nach Seitenwechsel ggf. direkt wieder in VR (WebXR-Navigation)
if(navigator.xr&&navigator.xr.addEventListener) navigator.xr.addEventListener('sessiongranted',()=>{ const sc=document.querySelector('a-scene'); if(sc){ const go=()=>sc.enterVR(); sc.hasLoaded?go():sc.addEventListener('loaded',go); } });
// kleine Desktop-Anzeige (nur DOM, in VR unsichtbar)
document.addEventListener('DOMContentLoaded',()=>{ const d=document.createElement('div'); d.style.cssText='position:fixed;right:12px;bottom:12px;z-index:30;font:600 12px sans-serif;color:#c9b89a;background:rgba(0,0,0,.45);padding:5px 9px;border-radius:6px;letter-spacing:.5px';
 d.textContent='ALPHA · '+step+'/'+(STEPS.length-1)+' · '+STEPS[step].title+' · Tür = weiter'; document.body.appendChild(d); });
// ---------- Tür in der Welt
window.zsaDoor=function(sceneEl,cfg,onOpen){ const T=THREE, S=sceneEl.object3D; const g=new T.Group(); g.position.set(cfg.x,0,cfg.z);
 const f=cfg.face||[0,0]; g.rotation.y=Math.atan2(f[0]-cfg.x,f[1]-cfg.z); S.add(g);
 const TL=new T.TextureLoader(), base=ROOT+'assets/tex/ph/wood_table_001_';
 const wood=new T.MeshStandardMaterial({color:0x6a5a4a,roughness:0.75,metalness:0.05}); TL.load(base+'diff.jpg',t=>{ t.colorSpace=T.SRGBColorSpace; wood.map=t; wood.needsUpdate=true; }); TL.load(base+'nor_gl.jpg',t=>{ wood.normalMap=t; wood.needsUpdate=true; });
 const frameM=new T.MeshStandardMaterial({color:0x17130f,roughness:0.7,metalness:0.1}), metal=new T.MeshStandardMaterial({color:0xb09060,roughness:0.35,metalness:0.9});
 const bx=(w,h,d,m,x,y,z)=>{ const o=new T.Mesh(new T.BoxGeometry(w,h,d),m); o.position.set(x,y,z); o.castShadow=o.receiveShadow=true; g.add(o); return o; };
 bx(0.09,2.16,0.16,frameM,-0.5,1.08,0); bx(0.09,2.16,0.16,frameM,0.5,1.08,0); bx(1.09,0.09,0.16,frameM,0,2.16,0); bx(1.0,0.03,0.2,frameM,0,0.015,0);
 // dunkler Raum hinter der Tür (nur durch den Spalt sichtbar), schwaches warmes Licht
 const inner=new T.Mesh(new T.BoxGeometry(0.9,2.1,0.6),new T.MeshBasicMaterial({color:0x0a0806,side:T.BackSide})); inner.position.set(0,1.05,-0.32); g.add(inner);
 const glowP=new T.Mesh(new T.PlaneGeometry(0.88,2.08),new T.MeshBasicMaterial({color:0x5a3c1c,transparent:true,opacity:0.35,toneMapped:false,fog:false})); glowP.position.set(0,1.05,-0.6); g.add(glowP);
 const hinge=new T.Group(); hinge.position.set(-0.45,0,0.02); g.add(hinge);
 const leaf=new T.Mesh(new T.BoxGeometry(0.9,2.08,0.045),wood); leaf.position.set(0.45,1.05,0); leaf.castShadow=true; hinge.add(leaf);
 const pan=new T.MeshStandardMaterial({color:0x2a2018,roughness:0.85}); [[0.45,1.5],[0.45,0.58]].forEach(([x,y])=>{ const p=new T.Mesh(new T.BoxGeometry(0.62,y>1?0.7:0.62,0.012),pan); p.position.set(x,y,0.028); hinge.add(p); });
 const knob=new T.Mesh(new T.SphereGeometry(0.032,14,10),metal); knob.position.set(0.82,1.0,0.06); hinge.add(knob); const plate=new T.Mesh(new T.BoxGeometry(0.04,0.16,0.01),metal); plate.position.set(0.82,1.0,0.03); hinge.add(plate);
 hinge.rotation.y=-0.2; // einen Spalt offen
 { const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); const gr=x.createRadialGradient(64,64,4,64,64,62); gr.addColorStop(0,'rgba(0,0,0,0.8)'); gr.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=gr; x.fillRect(0,0,128,128);
  const sh=new T.Mesh(new T.PlaneGeometry(1.8,1.1),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false})); sh.rotation.x=-Math.PI/2; sh.position.y=0.006; g.add(sh); } // Kontaktschatten
 const L=new T.PointLight(0xffb070,0.0,2.2,2); L.position.set(0.2,1.3,0.4); g.add(L);
 // kleine Türlampe (echte Lichtquelle in der Welt, kein Hotspot): macht die Tür in dunklen Räumen sichtbar
 const hous=new T.Mesh(new T.CylinderGeometry(0.07,0.1,0.08,16,1,true),new T.MeshStandardMaterial({color:0x1a1814,metalness:0.7,roughness:0.4,side:T.DoubleSide})); hous.position.set(0,2.36,0.12); g.add(hous);
 const arm=new T.Mesh(new T.BoxGeometry(0.03,0.03,0.12),frameM); arm.position.set(0,2.4,0.06); g.add(arm);
 const bulb=new T.Mesh(new T.SphereGeometry(0.028,10,8),new T.MeshBasicMaterial({color:0xffd9a0,toneMapped:false})); bulb.position.set(0,2.33,0.12); g.add(bulb);
 const DL=new T.PointLight(0xffc88a,cfg.light==null?1.1:cfg.light,3.2,2); DL.position.set(0,2.25,0.3); g.add(DL);
 const hits=[leaf,inner,glowP]; let opened=false, t0=0;
 const open=()=>{ if(opened) return; opened=true; t0=performance.now(); try{ const ac=new (window.AudioContext||window.webkitAudioContext)(); const n=ac.sampleRate*0.6, b=ac.createBuffer(1,n,ac.sampleRate), dd=b.getChannelData(0); for(let i=0;i<n;i++){ const k=i/n; dd[i]=(Math.random()*2-1)*0.25*Math.sin(Math.PI*k)*(0.6+0.4*Math.sin(i*0.004+Math.sin(i*0.0009)*6)); } const s=ac.createBufferSource(); s.buffer=b; const fl=ac.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=700; fl.Q.value=3; s.connect(fl); fl.connect(ac.destination); s.start(); }catch(e){}
  setTimeout(()=>onOpen&&onOpen(),650); };
 const head=new T.Vector3(), hp=new T.Vector3(), knobW=new T.Vector3(), loc=new T.Vector3();
 const R=sceneEl.renderer;
 const ctrlWorld=(c,out)=>{ if(!c.parent||c.parent===S){ const camEl=sceneEl.camera&&sceneEl.camera.el; const rig=camEl&&camEl.object3D.parent; out.copy(c.position); if(rig&&rig!==S) rig.localToWorld(out); } else c.getWorldPosition(out); return out; };
 const ctrlRay=c=>{ const o=new T.Vector3(), q=new T.Quaternion(); if(!c.parent||c.parent===S){ ctrlWorld(c,o); q.copy(c.quaternion); const camEl=sceneEl.camera&&sceneEl.camera.el; const rig=camEl&&camEl.object3D.parent; if(rig&&rig!==S){ const rq=new T.Quaternion(); rig.getWorldQuaternion(rq); q.premultiply(rq); } } else { c.getWorldPosition(o); c.getWorldQuaternion(q); } return new T.Raycaster(o,new T.Vector3(0,0,-1).applyQuaternion(q),0,12); };
 [0,1].forEach(i=>{ const c=R.xr.getController(i); c.addEventListener('selectstart',()=>{ if(ctrlRay(c).intersectObjects(hits,false).length) open(); }); });
 sceneEl.canvas&&sceneEl.canvas.addEventListener('click',e=>{ if(R.xr.isPresenting) return; const r=sceneEl.canvas.getBoundingClientRect(); const rc=new T.Raycaster(); rc.setFromCamera({x:(e.clientX-r.left)/r.width*2-1,y:-(e.clientY-r.top)/r.height*2+1},sceneEl.camera); if(rc.intersectObjects(hits,false).length) open(); });
 const step=()=>{ const now=performance.now();
  if(opened){ const k=Math.min(1,(now-t0)/600); hinge.rotation.y=-0.2-1.2*k*k*(3-2*k); L.intensity=1.4*k; glowP.material.opacity=0.35+0.5*k; return; }
  hinge.rotation.y=-0.2+0.015*Math.sin(now*0.0011); // leichtes Ziehen im Luftzug
  const cam=R.xr.isPresenting?R.xr.getCamera():sceneEl.camera; if(!cam) return; cam.getWorldPosition(head);
  knob.getWorldPosition(knobW); loc.copy(head); g.worldToLocal(loc); if(Math.abs(loc.x)<0.45&&loc.z<0.25&&loc.z>-0.5) return open(); // hindurchgehen
  if(!R.xr.isPresenting) return; for(let i=0;i<2;i++){ ctrlWorld(R.xr.getController(i),hp); if(hp.distanceTo(knobW)<0.2) return open(); loc.copy(hp); g.worldToLocal(loc); if(Math.abs(loc.x)<0.45&&loc.y>0.3&&loc.y<2&&Math.abs(loc.z)<0.08) return open(); } };
 (window.__zsaSteps=window.__zsaSteps||[]).push(step);
 if(window.AFRAME&&!AFRAME.components['zsa-tick']) AFRAME.registerComponent('zsa-tick',{tick(){ (window.__zsaSteps||[]).forEach(f=>f()); }});
 sceneEl.setAttribute('zsa-tick',''); g.userData.open=open; return g; };
// Räume: Tür automatisch setzen
const s=STEPS[step];
if(s.door) document.addEventListener('DOMContentLoaded',()=>{ const sc=document.querySelector('a-scene'); if(!sc) return; const go=()=>setTimeout(()=>{ window.__zsaDoorG=zsaDoor(sc,s.door,()=>goStep(step+1)); },300); sc.hasLoaded?go():sc.addEventListener('loaded',go); });
})();
