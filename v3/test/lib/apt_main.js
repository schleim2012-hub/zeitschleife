/* Rewind Wohnung – Zusammenbau: Schlafzimmer (Kinderzimmer 1984, k84.js) ↔ Küche (Maniac-Mansion-Küche, mmk.js) ↔ Wohnzimmer ↔ Büro.
   Alle Räume liegen in einer Szene; Türen benutzen die RE-Überblendung (apt_doortrans.js). Pro Raum sind nur dessen Objekte + Lichter sichtbar.
   Test-API: window.__apt {go(room), room, rabbit, ...} */
(function(){
const ROOT='../';
// --- Hilfen, die sonst nur im Alpha-Modus von alpha.js kommen (mmk.js braucht sie) ---
if(!window.zsaCtrlPos) window.zsaCtrlPos=function(sceneEl,c,out){ const S=sceneEl.object3D; if(!c.parent||c.parent===S){ const camEl=sceneEl.camera&&sceneEl.camera.el; const rig=camEl&&camEl.object3D.parent; out.copy(c.position); if(rig&&rig!==S) rig.localToWorld(out); } else c.getWorldPosition(out); return out; };
if(!window.zsaRay) window.zsaRay=function(sceneEl,c){ const T=THREE, S=sceneEl.object3D, o=new T.Vector3(), q=new T.Quaternion(); zsaCtrlPos(sceneEl,c,o); if(!c.parent||c.parent===S){ q.copy(c.quaternion); const camEl=sceneEl.camera&&sceneEl.camera.el; const rig=camEl&&camEl.object3D.parent; if(rig&&rig!==S){ const rq=new T.Quaternion(); rig.getWorldQuaternion(rq); q.premultiply(rq); } } else c.getWorldQuaternion(q); return new T.Raycaster(o,new T.Vector3(0,0,-1).applyQuaternion(q),0,14); };
if(!window.zsaMouseRay) window.zsaMouseRay=function(sceneEl,e){ const T=THREE, r=sceneEl.canvas.getBoundingClientRect(), rc=new T.Raycaster(); rc.setFromCamera({x:(e.clientX-r.left)/r.width*2-1,y:-(e.clientY-r.top)/r.height*2+1},sceneEl.camera); return rc; };
if(!window.zsaSND) window.zsaSND={creak:()=>aptSFX&&aptSFX('door_creak',0.5),click:()=>aptSFX&&aptSFX('door_latch',0.5),rattle:()=>{},chime:()=>{}};
const A=window.__apt={room:null,rabbit:(()=>{ try{ return localStorage.getItem('zs_apt_rabbit')==='1'; }catch(e){ return false; } })(),busy:false};
AFRAME.registerComponent('apt-world',{init(){ const sc=this.el; sc.hasLoaded?setup(sc):sc.addEventListener('loaded',()=>setup(sc)); },tick(t,dt){ if(A.tick) A.tick(t,dt); }});
function setup(sc){ const T=THREE, S=sc.object3D, R=sc.renderer, K=aptKit(ROOT); aptLoadSFX(ROOT);
 const rig=document.getElementById('rig').object3D, camEl=document.getElementById('cam');
 const head=new T.Vector3(), hq=new T.Quaternion(); const getHead=()=>{ /* sc.camera = Kopf im Rig (inkl. Snap-Drehung); xr.getCamera() trägt beim Tick die Rig-Drehung nicht -> Stick lief nach Snap in Weltachsen */ const c=sc.camera; c.updateWorldMatrix(true,false); c.getWorldPosition(head); c.getWorldQuaternion(hq); return head; };
 const before=new Set(S.children);
 // ---------- Schlafzimmer ----------
 const B84=build84(sc); const TVYAW=2.75; /* TV in der Ecke am Bettende (vorn links), Front schräg zum Kopfende des Betts */ const bedExtra=new T.Group(); bedExtra.name='bedExtra'; S.add(bedExtra);
 // großer Röhrenfernseher (≈ 72 cm Diagonale) auf einem Rollwagen statt auf dem Nachttisch
 { const b=new K.Batch(), M=0x2a2a2c; const x0=-0.5,x1=0.5,z0=-0.28,z1=0.28; bedExtra.position.set(-1.62,0,1.52); bedExtra.rotation.y=TVYAW; [0.12,0.52].forEach(y=>b.box('m',x0,x1,y,y+0.025,z0,z1,0x3a3a3c)); [[x0,z0],[x1-0.03,z0],[x0,z1-0.03],[x1-0.03,z1-0.03]].forEach(([x,z])=>{ b.box('m',x,x+0.03,0.06,0.545,z,z+0.03,M); b.cyl('r',0.03,0.03,0.025,x+0.015,0.03,z+0.015,0x111111,[Math.PI/2,0,0],12); });
  for(let i=0;i<3;i++) b.box('v',x0+0.08+i*0.012,x0+0.27+i*0.012,0.145+i*0.026,0.17+i*0.026,z0+0.12,z0+0.225,[0x1a1a1a,0x2a1a10,0x101820][i]); b.box('v',-0.2,0.2,0.145,0.235,-0.22,0.1,0x1c1c1e);
  b.build(bedExtra,{m:K.std({color:0xffffff,roughness:0.4,metalness:0.6}),r:K.std({color:0xffffff,roughness:0.8}),v:K.std({color:0xffffff,roughness:0.45})}); }
 const tvEl=document.createElement('a-entity'); tvEl.id='tv84'; tvEl.classList.add('clickable'); tvEl.setAttribute('position','-1.62 0.545 1.52'); tvEl.setAttribute('rotation','0 '+(TVYAW*180/Math.PI)+' 0');
 tvEl.setAttribute('crt-tv','model:../assets/props/television_02.glb; base:../tv/; channels:ch01.mp4,ch02.mp4,ch03.mp4,ch04.mp4,ch05.mp4,ch06.mp4; scale:1.8'); sc.appendChild(tvEl);
 const bedDoorG=new T.Group(); S.add(bedDoorG); bedDoorG.name='bedDoorG'; const bedDoor=wallDoor(bedDoorG,1.5,1.995,[0,-1],0.98,2.12,true);
 // ---------- Küche ----------
 const KG=new T.Group(); KG.name='kitchenG'; S.add(KG); const L1=new T.PointLight(0xffb35c,0,3.4,2), L2=new T.PointLight(0xffcf90,0,3.6,2); L1.position.set(-9,2,0.5); L2.position.set(-9,2.3,0.8); KG.add(L1); KG.add(L2);
 const kHemi=new T.HemisphereLight(0x2a2838,0x0a0806,0.5); KG.add(kHemi);
 const kBefore=new Set(S.children); const KIT=buildMMKitchen(sc,{G:KG,ROOT,L1,L2,hemi:kHemi,hemiBase:0.6}); const kExtra=S.children.filter(o=>!kBefore.has(o));
 const kitDoor=wallDoor(KG,-7.02,0.35,[-1,0],0.85,2.02,false);
 // ---------- Wohnzimmer, Büro ----------
 const LIV=aptBuildLiving(sc,K), OFF=aptBuildOffice(sc,K);
 const livKitDoor=wallDoor(LIV.group,18.0,0.8,[1,0],0.9,2.05,true), livOffDoor=wallDoor(LIV.group,19.0,-2.4,[0,1],0.9,2.05,true), offDoor=wallDoor(OFF.group,38.8,2.2,[0,-1],0.9,2.05,true);
 // ---------- Räume ----------
 const ROOMS={
  bedroom:{name:'Schlafzimmer',objs:null,bounds:[-2.1,2.1,-2.0,2.0],solid:[[-2.1,-1.15,-2.0,0.04],[-1.0,-0.5,-2.0,-1.5],[1.48,2.1,-0.9,0.4],[1.3,2.1,-2.0,-1.6],[-2.1,-1.15,1.05,2.0]],collide:null,doors:[{d:bedDoor,to:'kitchen',via:'s'}]},
  kitchen:{name:'Küche',objs:[KG,...kExtra],bounds:[-11.5,-7.0,-0.92,2.5],collide:p=>{ const r=0.25; p.x=Math.max(-11.5+r,Math.min(-7.0-r,p.x)); p.z=Math.max(-0.92+r*0.4,Math.min(2.5-r,p.z)); KIT.rects.forEach(([a0,a1,b0,b1])=>{ if(p.x>a0-r&&p.x<a1+r&&p.z>b0-r) p.z=b0-r; }); },doors:[{d:kitDoor,to:'living',via:'w'}],tick:(now)=>{ KIT.tick(now,[{on:1},{on:1}],1); if(window.__mmk&&__mmk.doorOpen&&!A.busy&&A.room==='kitchen') useDoor('bedroom','k'); }},
  living:{name:'Wohnzimmer',objs:[LIV.group],bounds:[18,23.5,-2.4,2.4],collide:LIV.collide,doors:[{d:livKitDoor,to:'kitchen',via:'e'},{d:livOffDoor,to:'office',via:'n'}],interact:LIV.interact,grabs:LIV.grabs,surf:LIV.surf,tick:(n,dt)=>LIV.tick(n,dt)},
  office:{name:'Büro',objs:[OFF.group],bounds:[38,42.5,-2.0,2.2],collide:OFF.collide,doors:[{d:offDoor,to:'living',via:'o'}],interact:OFF.interact,files:OFF.files,tick:n=>OFF.tick(n)} };
 // Ankunftspunkte: [x,z,Blickrichtung-yaw]
 const SPAWN={bedroom:{k:[1.4,1.15,0],def:[0.3,1.0,0]},kitchen:{s:[-10.0,-0.05,Math.PI],e:[-7.75,0.35,Math.PI/2],def:[-9.2,0.3,Math.PI]},living:{w:[18.8,0.8,-Math.PI/2],o:[19.0,-1.6,Math.PI],def:[19.2,0.2,-Math.PI/2]},office:{n:[38.8,1.45,0],def:[38.8,1.45,0]}};
 const allObjs=()=>{ Object.values(ROOMS).forEach(r=>r.objs&&r.objs.forEach(o=>o.visible=false)); };
 const classifyBed=()=>{ const known=new Set([rig,KG,LIV.group,OFF.group,...kExtra]); ROOMS.bedroom.objs=S.children.filter(o=>!known.has(o)&&!(o.el&&(o.el.id==='rig'))&&o.name!=='aptTrans'&&!(o.userData&&o.userData.aptUI)); };
 const show=id=>{ if(!ROOMS.bedroom.objs||id==='bedroom') classifyBed(); Object.entries(ROOMS).forEach(([k,r])=>r.objs.forEach(o=>o.visible=(k===id))); A.room=id; if(id!=='kitchen'&&window.__mmk) __mmk.doorOpen=false;
  try{ const tv=tvEl.components['crt-tv']; if(tv&&id!=='bedroom'&&tv.on&&tv.video) tv.video.pause(); }catch(e){} uiClose(); };
 const placeAt=(x,z,yaw)=>{ rig.rotation.set(0,yaw,0); rig.updateMatrixWorld(true); const c=camEl.object3D.position, off=new T.Vector3(c.x,0,c.z).applyAxisAngle(new T.Vector3(0,1,0),yaw); rig.position.set(x-off.x,0,z-off.z); if(!R.xr.isPresenting){ const lc=camEl.components['look-controls']; if(lc){ lc.yawObject.rotation.y=0; lc.pitchObject.rotation.x=0; } camEl.object3D.rotation.set(0,0,0); } };
 const go=(id,via)=>{ show(id); const s=(SPAWN[id][via])||SPAWN[id].def; const pp={x:s[0],z:s[1]}; hardClamp(ROOMS[id],pp); placeAt(pp.x,pp.z,s[2]); A.arrivedAt=performance.now(); A.doorArmed=false; if(id==='living'&&A.rabbit&&!A.rang){ A.rang=true; setTimeout(ring,2500); } };
 function useDoor(to,via){ if(A.busy) return; A.busy=true; drop(); aptDoorTrans(sc,{hide:()=>allObjs(),swap:()=>go(to,via),done:()=>{ A.busy=false; if(window.__mmk) __mmk.doorOpen=false; }}); }
 A.go=go; A.useDoor=useDoor; A.ROOMS=ROOMS; A.LIV=LIV; A.OFF=OFF; A.KIT=KIT; A.placeAt=placeAt;
 // ---------- Tür-Mesh (Blatt, Klinke) ----------
 function wallDoor(G,x,z,n,w,h,inOpening){ const g=new T.Group(); g.position.set(x+n[0]*0.03,0,z+n[1]*0.03); g.rotation.y=Math.atan2(n[0],n[1]); G.add(g);
  const m=K.std({map:K.tex('assets/tex/ph/wood_table_001_diff.jpg',1,[0.6,1.4]),color:0x7a5a3c,roughness:0.75}); const leaf=new T.Mesh(K.roundBox(w-0.04,h-0.02,0.04,0.006,2),m); leaf.position.set(0,h/2,0); g.add(leaf);
  const pm=K.std({color:0x5a4028,roughness:0.8}); [[0,1.45,0.5,0.7],[0,0.55,0.5,0.75]].forEach(([px,py,pw,ph])=>{ const p=new T.Mesh(new T.BoxGeometry(w*0.62,ph,0.01),pm); p.position.set(px,py,0.022); g.add(p); });
  const br=K.std({color:0x8a6a32,roughness:0.35,metalness:0.8}); const kn=new T.Mesh(new T.BoxGeometry(0.13,0.022,0.024),br); kn.position.set(w/2-0.13,1.02,0.05); g.add(kn); const ro=new T.Mesh(new T.BoxGeometry(0.04,0.2,0.01),br); ro.position.set(w/2-0.09,0.98,0.027); g.add(ro);
  if(!inOpening){ const fr=K.std({color:0x3a2818,roughness:0.7}); [[-w/2-0.035,h/2,0.07,h+0.05],[w/2+0.035,h/2,0.07,h+0.05]].forEach(([px,py,pw,ph])=>{ const f=new T.Mesh(new T.BoxGeometry(pw,ph,0.05),fr); f.position.set(px,py,0.0); g.add(f); }); const t=new T.Mesh(new T.BoxGeometry(w+0.14,0.07,0.05),fr); t.position.set(0,h+0.035,0); g.add(t); }
  g.userData={x:x+n[0]*0.03,z:z+n[1]*0.03,n,w,knob:kn}; return {g,leaf,kn}; }
 // ---------- Untertitel / Mara-Stimme (weltfest, wie zsaSay) ----------
 let subM=null, curVO=null;
 const say=(who,text,vo)=>{ if(curVO){ try{ curVO.pause(); }catch(e){} } if(vo){ curVO=new Audio(ROOT+'assets/vo/apt/'+vo+'.mp3'); curVO.volume=0.95; curVO.play().catch(()=>{}); }
  if(subM){ S.remove(subM); subM=null; } const c=document.createElement('canvas'); c.width=1024; c.height=80; const x=c.getContext('2d'); const t=who+': '+text; let fs=30; x.font='500 '+fs+'px sans-serif'; while(x.measureText(t).width>980&&fs>18){ fs-=2; x.font='500 '+fs+'px sans-serif'; } const w=Math.min(1010,x.measureText(t).width+40);
  x.fillStyle='rgba(0,0,0,0.5)'; x.fillRect(512-w/2,8,w,62); x.fillStyle='#d9c79e'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(t,512,40); const tx=new T.CanvasTexture(c); tx.colorSpace=T.SRGBColorSpace;
  const m=new T.Mesh(new T.PlaneGeometry(1.0,0.078),new T.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,toneMapped:false,fog:false})); m.userData.aptUI=1; getHead(); const f=new T.Vector3(0,0,-1).applyQuaternion(hq); f.y=0; f.normalize();
  m.position.copy(head).addScaledVector(f,1.6); m.position.y=head.y-0.32; m.lookAt(head.x,m.position.y,head.z); m.renderOrder=5; S.add(m); subM=m; A.lastSay=text; const mine=m;
  setTimeout(()=>{ const t0=performance.now(); const fd=()=>{ const k=Math.min(1,(performance.now()-t0)/700); mine.material.opacity=1-k; if(k<1) requestAnimationFrame(fd); else if(subM===mine){ S.remove(mine); subM=null; } }; fd(); },Math.max(3500,text.length*75)); };
 A.say=say;
 // ---------- Weltfeste Tafeln (Mara-Dialog, Akte lesen) ----------
 let ui=null; // {mesh, kind, onHit(uv)}
 function uiClose(){ if(ui){ S.remove(ui.mesh); ui.mesh.geometry.dispose(); ui.mesh.material.map.dispose(); ui.mesh.material.dispose(); ui=null; } }
 function uiOpen(kind,w,h,cw,ch,draw,onHit,dist,drop){ uiClose(); const c=document.createElement('canvas'); c.width=cw; c.height=ch; const x=c.getContext('2d'); draw(x,cw,ch); const tx=new T.CanvasTexture(c); tx.colorSpace=T.SRGBColorSpace; tx.anisotropy=8;
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tx,transparent:true,toneMapped:false,fog:false})); m.userData.aptUI=1; getHead(); const f=new T.Vector3(0,0,-1).applyQuaternion(hq); f.y=0; f.normalize();
  m.position.copy(head).addScaledVector(f,dist||0.75); m.position.y=head.y-(drop||0.2); m.lookAt(head); m.renderOrder=6; S.add(m); ui={mesh:m,kind,onHit,canvas:c,ctx:x,tex:tx,redraw:fn=>{ fn(x,cw,ch); tx.needsUpdate=true; },anchor:head.clone()}; return ui; }
 // Akte lesen: Papier mit Schreibmaschinenschrift, Trigger/Klick = weiterblättern
 function openFile(f){ let page=0; aptSFX('door_latch',0.15); const draw=(x,w,h)=>{ x.fillStyle='#e9e1cb'; x.fillRect(0,0,w,h); const g=x.createRadialGradient(w/2,h/2,h*0.2,w/2,h/2,h*0.75); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(90,60,20,0.35)'); x.fillStyle=g; x.fillRect(0,0,w,h);
   for(let i=0;i<9;i++){ x.fillStyle='rgba(120,90,40,'+(0.03+Math.random()*0.05)+')'; x.beginPath(); x.arc(Math.random()*w,Math.random()*h,20+Math.random()*60,0,7); x.fill(); }
   x.fillStyle='#1d1b18'; x.font='25px "DejaVu Sans Mono","Courier New",monospace'; x.textBaseline='top'; const lines=f.pages[page]; K.wrap(x,lines,56,64,w-112,34);
   x.font='italic 19px "DejaVu Sans Mono",monospace'; x.fillStyle='#5a4a3a'; x.fillText('Seite '+(page+1)+'/'+f.pages.length+' · Trigger/Klick: '+(page<f.pages.length-1?'weiterblättern':'schließen'),56,h-56);
   if(page===0){ x.save(); x.translate(w-170,90); x.rotate(-0.18); x.strokeStyle='rgba(160,20,20,0.8)'; x.lineWidth=4; x.strokeRect(-90,-28,180,56); x.fillStyle='rgba(160,20,20,0.8)'; x.font='800 30px sans-serif'; x.fillText('GEHEIM',-62,-16); x.restore(); } };
  const u=uiOpen('file',0.46,0.6,768,1000,draw,()=>{ page++; if(page>=f.pages.length){ uiClose(); return; } aptSFX('door_latch',0.12); u.redraw(draw); },0.62,0.28); A.openFile=f.id; }
 // Telefon: Hörer ab, Rauschen, Mara antwortet. Fragen als Karte neben dem Telefon (weltfest)
 let line=null; window.aptPhone=function(PH){ if(ui&&ui.kind==='phone') return; LIV.setPhone(1); aptSFX('phone_lift',0.7); line=aptSFX('phone_line',0.12,true); setTimeout(()=>say('Mara',APT_MARA.hello[1],APT_MARA.hello[0]),900); A.phoneOpen=true; setTimeout(menu,1200); };
 const hang=()=>{ LIV.setPhone(0); if(line){ line.stop(); line=null; } aptSFX('phone_lift',0.4); A.phoneOpen=false; uiClose(); };
 function menu(){ const opts=APT_MARA.opts.filter(o=>!o.cond||(o.cond==='rabbit'&&A.rabbit)); A.menu=opts.map(o=>o.label); const RH=66;
  const draw=(x,w,h)=>{ x.clearRect(0,0,w,h); x.fillStyle='rgba(12,10,8,0.82)'; x.fillRect(0,0,w,h); x.strokeStyle='rgba(200,180,140,0.35)'; x.lineWidth=2; x.strokeRect(4,4,w-8,h-8); x.fillStyle='#b8a888'; x.font='italic 22px sans-serif'; x.fillText('Am Telefon: Mara',24,38);
   x.font='500 27px sans-serif'; opts.forEach((o,i)=>{ x.fillStyle=o.id==='tattoo'?'#e8d8b0':'#d9c79e'; x.fillText('›  '+o.label,30,96+i*RH); }); };
  const h=0.14+opts.length*0.066; uiOpen('phone',0.62,h*0.95,800,Math.round(110+opts.length*RH),draw,uv=>{ const py=(1-uv.y)*(110+opts.length*RH); const i=Math.floor((py-66)/RH); const o=opts[i]; if(!o) return;
   say('Mara',o.say,o.vo); A.asked=(A.asked||[]).concat(o.id); if(o.end){ setTimeout(hang,2200); uiClose(); } },0.9,0.35); }
 A.menuPick=i=>{ if(ui&&ui.kind==='phone') ui.onHit({y:1-(66+i*66+33)/ui.canvas.height}); };
 // Telefon klingelt einmal, wenn die PC-Nachricht gesehen wurde (Mara weiß es)
 function ring(){ const ac=window.__zsaAC; if(!ac) return; for(let r=0;r<2;r++){ const t=ac.currentTime+r*1.6; const o=ac.createOscillator(), o2=ac.createOscillator(), g=ac.createGain(), am=ac.createOscillator(), ag=ac.createGain(); o.frequency.value=1250; o2.frequency.value=1580; am.frequency.value=22; ag.gain.value=0.5; am.connect(ag); ag.connect(g.gain); g.gain.setValueAtTime(0.0,t); g.gain.linearRampToValueAtTime(0.05,t+0.02); g.gain.setValueAtTime(0.05,t+0.9); g.gain.linearRampToValueAtTime(0,t+1.0);
   const p=new (window.PannerNode||ac.createPanner.bind(ac))(ac); try{ p.positionX.value=20.1; p.positionY.value=0.7; p.positionZ.value=-2.0; }catch(e){} o.connect(g); o2.connect(g); g.connect(p); p.connect(ac.destination); [o,o2,am].forEach(n=>{ n.start(t); n.stop(t+1.05); }); } }
 // ---------- Greifen / Laser / Klick ----------
 let held=null; const hp=new T.Vector3(), hqq=new T.Quaternion(), offP=new T.Vector3(), offQ=new T.Quaternion(), tmp=new T.Vector3(), tq=new T.Quaternion();
 const ctrlPose=(c,p,q)=>{ zsaCtrlPos(sc,c,p); if(!c.parent||c.parent===S){ q.copy(c.quaternion); if(rig!==S){ rig.getWorldQuaternion(tq); q.premultiply(tq); } } else c.getWorldQuaternion(q); };
 const room=()=>ROOMS[A.room]||{};
 function grabIt(gb,src){ drop(); if(src==='mouse'){ held={gb,mouse:true}; } else { ctrlPose(src,hp,hqq); const iq=hqq.clone().invert(); gb.obj.getWorldPosition(tmp); offP.copy(tmp).sub(hp).applyQuaternion(iq); if(offP.length()>0.15) offP.set(0,-0.02,-0.08); offQ.copy(iq).multiply(gb.obj.quaternion); held={gb,c:src}; } gb.vy=0; gb.falling=false; A.held=gb.name; }
 function drop(){ if(!held) return; held.gb.falling=true; held.gb.vy=0; const o=held.gb.obj; o.rotation.set(0,o.rotation.y,0); held=null; A.held=null; }
 const targets=()=>{ const r=room(), L=[]; (r.doors||[]).forEach(d=>{ L.push({hit:d.d.leaf,fn:()=>useDoor(d.to,d.via)}); L.push({hit:d.d.kn,fn:()=>useDoor(d.to,d.via)}); }); (r.interact||[]).forEach(i=>L.push(i)); (r.files||[]).forEach(f=>L.push({hit:f.hit,fn:()=>openFile(f.file)})); (r.grabs||[]).forEach(g=>L.push({hit:g.obj,grab:g,recursive:true})); return L; };
 function pick(rc,src){ if(A.busy) return false; if(ui){ const h=rc.intersectObject(ui.mesh,false); if(h.length){ ui.onHit(h[0].uv); return true; } }
  let best=null; targets().forEach(t=>{ const h=rc.intersectObject(t.hit,!!t.recursive); if(h.length&&h[0].distance<4.5&&(!best||h[0].distance<best.d)) best={d:h[0].distance,t}; }); if(!best){ if(held){ drop(); return true; } if(ui&&ui.kind==='file'){ uiClose(); return true; } return false; }
  if(best.t.grab){ if(held&&held.gb===best.t.grab) drop(); else grabIt(best.t.grab,src); } else best.t.fn(src); return true; }
 A.pick=pick;
 [0,1].forEach(i=>{ const c=R.xr.getController(i); c.addEventListener('selectstart',()=>{ if(A.busy) return; if(held&&held.c===c){ drop(); return; } const rc=zsaRay(sc,c); if(!pick(rc,c)){} });
  c.addEventListener('squeezestart',()=>{ if(A.busy) return; ctrlPose(c,hp,hqq); let best=null; (room().grabs||[]).forEach(g=>{ g.obj.getWorldPosition(tmp); const d=tmp.distanceTo(hp); if(d<0.28&&(!best||d<best.d)) best={d,g}; }); if(best){ grabIt(best.g,c); return; }
   // Grip an Tür / Gerät: anfassen genügt
   targets().forEach(t=>{ if(t.grab||best) return; const bb=new T.Box3().setFromObject(t.hit).expandByScalar(0.12); if(bb.containsPoint(hp)){ best=1; t.fn('grip',c); } }); });
  c.addEventListener('squeezeend',()=>{ if(held&&held.c===c) drop(); }); });
 sc.canvas.addEventListener('click',e=>{ if(R.xr.isPresenting||A.busy) return; if(held&&held.mouse){ drop(); return; } pick(zsaMouseRay(sc,e),'mouse'); });
 // ---------- Laufen (linker Stick), Drehen (rechter Stick, 30°), Kollision am Kopf ----------
 let ax=[0,0], snap=0; setTimeout(()=>{ const L=document.getElementById('hl'), Rr=document.getElementById('hr'); L&&L.addEventListener('thumbstickmoved',e=>{ ax=[e.detail.x,e.detail.y]; }); Rr&&Rr.addEventListener('thumbstickmoved',e=>{ const x=e.detail.x; if(A.busy) return; if(Math.abs(x)>0.7&&!snap){ snap=1; const hpp=getHead().clone(); rig.rotation.y-=Math.sign(x)*Math.PI/6; rig.updateMatrixWorld(true); const hn=getHead(); rig.position.x+=hpp.x-hn.x; rig.position.z+=hpp.z-hn.z; } if(Math.abs(x)<0.3) snap=0; }); },0);
 // harte Raumgrenze (AABB) + Zusatz-Hindernisse; läuft NACH dem Möbel-Ausschieben, damit nichts durch die Wand drückt. Durch Türen nur per Überblendung.
 const hardClamp=(r,p)=>{ const R0=0.22; (r.solid||[]).forEach(([a0,a1,b0,b1])=>{ if(p.x>a0-R0&&p.x<a1+R0&&p.z>b0-R0&&p.z<b1+R0){ const c=[[p.x-(a0-R0),'x',a0-R0],[(a1+R0)-p.x,'x',a1+R0],[p.z-(b0-R0),'z',b0-R0],[(b1+R0)-p.z,'z',b1+R0]].filter(e=>{ const v=e[2]; const b=r.bounds; return !b||(e[1]==='x'?(v>b[0]+R0-1e-3&&v<b[1]-R0+1e-3):(v>b[2]+R0-1e-3&&v<b[3]-R0+1e-3)); }).sort((u,v)=>u[0]-v[0])[0]; if(c) p[c[1]]=c[2]; } });
  const b=r.bounds; if(b){ const m=0.2; p.x=Math.max(b[0]+m,Math.min(b[1]-m,p.x)); p.z=Math.max(b[2]+m,Math.min(b[3]-m,p.z)); } };
 A.hardClamp=hardClamp;
 let last=0; A.tick=(t,dt)=>{ const now=performance.now(), d=Math.min(dt||16,50)/1000; if(!A.room) return; const r=room();
  if(!A.busy&&(Math.abs(ax[0])>0.15||Math.abs(ax[1])>0.15)){ getHead(); const f=new T.Vector3(ax[0],0,ax[1]).applyQuaternion(hq); f.y=0; rig.position.addScaledVector(f,1.4*d); }
  rig.updateMatrixWorld(true); getHead(); const p={x:head.x,z:head.z}; for(let it=0;it<2;it++){ r.collide&&r.collide(p); hardClamp(r,p); } rig.position.x+=p.x-head.x; rig.position.z+=p.z-head.z;
  // Tür durch Hingehen (nur wenn man darauf zuläuft)
  // scharf erst, wenn man nach der Ankunft einmal >0,85 m von allen Türen weg war (sonst: Umdrehen/Zurücklehnen in VR = sofort zurück in den alten Raum)
  //  Auslösezone etwas breiter als das Türblatt (±w/2+0,2 m, 0,5 m tief): Sessel/Kartons neben den Türen schieben einen sonst knapp an der Zone vorbei
  { let near=false;
   (r.doors||[]).forEach(dd=>{ const u=dd.d.g.userData; const dx=head.x-u.x, dz=head.z-u.z; const dist=dx*u.n[0]+dz*u.n[1], lat=Math.abs(dx*u.n[1]-dz*u.n[0]); if(dist<0.85&&dist>-0.3&&lat<u.w/2+0.35) near=true;
    if(!A.busy&&A.doorArmed&&now-(A.arrivedAt||0)>800&&dist<0.5&&dist>-0.25&&lat<u.w/2+0.2) useDoor(dd.to,dd.via); });
   if(!near) A.doorArmed=true; }
  r.tick&&r.tick(now,d);
  // gehaltener Gegenstand
  if(held){ const o=held.gb.obj; if(held.mouse){ const c=sc.camera; c.getWorldPosition(tmp); c.getWorldQuaternion(tq); o.position.copy(new T.Vector3(0.12,-0.16,-0.45).applyQuaternion(tq).add(tmp)); o.quaternion.copy(tq).multiply(new T.Quaternion().setFromEuler(new T.Euler(0.5,0,0))); }
   else { ctrlPose(held.c,hp,hqq); o.quaternion.copy(hqq).multiply(offQ); o.position.copy(offP).applyQuaternion(hqq).add(hp); } held.gb.obj.parent.worldToLocal&&0; }
  (r.grabs||[]).forEach(g=>{ if(!g.falling) return; const o=g.obj; g.vy-=9.8*d; o.position.y+=g.vy*d; let fy=0; (r.surf||[]).forEach(([x,z,w,dd,h])=>{ if(Math.abs(o.position.x-x)<w/2&&Math.abs(o.position.z-z)<dd/2&&o.position.y>=h-0.05) fy=Math.max(fy,h); }); if(o.position.y<=fy){ o.position.y=fy; g.vy=0; g.falling=false; aptSFX('steps',0.0); } });
  // Tafeln schließen, wenn man weggeht
  if(ui&&getHead().distanceTo(ui.anchor)>1.6){ if(ui.kind==='phone') hang(); else uiClose(); }
  if(A.debugHUD) A.debugHUD(); };
 // Start: Schlafzimmer (oder ?room=…)
 // Im Spiel ist das Schlafzimmer = Kinderzimmer 1984 (eigene Szene davor) -> man kommt durch dessen Tür direkt in die Küche (wie aus dem Schlafzimmer)
 setTimeout(()=>{ const U=new URLSearchParams(location.search); let q=U.get('room'); if(!ROOMS[q]&&window.ZSA&&ZSA.on&&ZSA.cur().id==='wohnung') q='kitchen'; go(ROOMS[q]?q:'bedroom',U.get('via')||(q==='kitchen'?'s':undefined)); A.ready=true; },60);
}
})();
