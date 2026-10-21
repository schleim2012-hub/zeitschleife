// VRG – robustes Greifen, Werfen und Fortbewegen für WebXR (Rewind V3, Quest-Browser)
// Warum eigenes Modul (Audit 21.10., Petes Quest-Test „nichts ging so richtig“):
//  * Posen kommen direkt aus dem XRFrame (gripSpace zum Greifen, targetRaySpace zum Zielen), Händigkeit aus inputSource.handedness –
//    keine Controller-Indizes, keine Abhängigkeit davon, ob A-Frame-Entities oder three-Controller-Gruppen im Rig hängen.
//  * Knöpfe: Gamepad-Polling UND Session-Events (select/squeeze) → Trigger ODER Grip greift; Hand-Tracking: Pinch = greifen.
//  * Gehaltene Objekte folgen der Controller-Pose 1:1 (kein Feder-Nachlauf), auch innerhalb der Physik-Substeps interpoliert.
//  * Wurf-Geschwindigkeit = Trendlinie (lin. Regression) über die letzten 50–100 ms der OBJEKT-Position im Referenzraum
//    (enthält den Handgelenk-Schnipp automatisch), ein Sample zurück (Trigger-Latenz), × throwScale; Rig-Drehung/-Bewegung herausgerechnet.
//  * Fern-Greifen: Laser auf Objekt + Trigger/Grip → Objekt fliegt in die Hand. Nah-Greifen: Radius ~14 cm ab Objekt-Oberfläche.
//  * Auto-Respawn auf die Ablage, Haptik, Fortbewegung (L-Stick gehen, R-Stick links/rechts Snap-Drehen um den Kopf, R-Stick vor = Teleport-Bogen).
(function(){
const qs=k=>{ try{ return new URLSearchParams(location.search).get(k); }catch(e){ return null; } };
function create(o){
 const T=THREE, sc=o.scene, R=sc.renderer, rig=o.rig, cam=o.cam, VRP=window.VRP, C=window.CANNON;
 const cfg=Object.assign({grabRadius:0.14, distMax:7, throwScale:1.25, throwMax:16, windows:[0.05,0.075,0.1], stepBack:1,
   moveSpeed:1.8, snapDeg:30, teleport:true, smooth:true, physH:1/240, handRadius:0.045, handMinSpeed:1.1,
   respawnAfter:4, respawnMax:12, floorY:0, canStand:null, onTrigger:null, onRespawn:null, world:null, handMaterial:null}, o);
 const tsq=parseFloat(qs('throw')); if(tsq>0.5&&tsq<3) cfg.throwScale=tsq;
 const S=sc.object3D, items=[], hands={}, ONE=new T.Vector3(1,1,1);
 const tM=new T.Matrix4(), tM2=new T.Matrix4(), rigQ=new T.Quaternion(), rigPrev=new T.Vector3(), rigVel=new T.Vector3();
 let acc=0, simFn=null, simT=0, snapArm=true, tpAim=null, lastNow=0, boundSes=null;
 // --- sichtbare Hand-Stellvertreter (prozedural, keine CDN-Modelle nötig) + Laser + Highlight
 function mkHand(side){ const g=new T.Group(); g.visible=false; g.name='vrg-hand-'+side;
  const bm=new T.MeshStandardMaterial({color:0x2a2c34,roughness:0.5,metalness:0.3});
  const body=new T.Mesh(new T.CapsuleGeometry(0.021,0.075,4,10),bm); body.rotation.x=Math.PI/2; body.position.z=0.02; g.add(body);
  const ring=new T.Mesh(new T.TorusGeometry(0.032,0.006,8,24),new T.MeshBasicMaterial({color:side==='left'?0x7ec8ff:0xffb070})); ring.position.z=-0.03; g.add(ring);
  S.add(g);
  const laser=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]),new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.35,depthWrite:false}));
  laser.visible=false; laser.frustumCulled=false; S.add(laser);
  const hl=new T.Mesh(new T.SphereGeometry(1,16,12),new T.MeshBasicMaterial({color:side==='left'?0x7ec8ff:0xffd27a,transparent:true,opacity:0.22,depthWrite:false,blending:T.AdditiveBlending}));
  hl.visible=false; S.add(hl);
  let body2=null; if(cfg.world&&C){ body2=new C.Body({mass:0,type:C.Body.KINEMATIC,material:cfg.handMaterial||undefined,allowSleep:false}); body2.addShape(new C.Sphere(cfg.handRadius)); body2.position.set(0,-10,0); body2.collisionResponse=false; cfg.world.addBody(body2); }
  return {side,g,ring,laser,hl,body:body2,live:false,lp:new T.Vector3(),lq:new T.Quaternion(),rlp:new T.Vector3(),rlq:new T.Quaternion(),
   gp:new T.Vector3(),gq:new T.Quaternion(),rp:new T.Vector3(),rq:new T.Quaternion(),prevGp:new T.Vector3(),vel:new T.Vector3(),speed:0,
   tr:new VRP.Tracker(),otr:new VRP.Tracker(),held:null,pull:null,hover:null,near:null,trigRaw:false,gripRaw:false,pTrig:false,pGrip:false,
   ev:{trig:false,grip:false},axes:[0,0],pinch:false,noHitUntil:0,armT:true,armG:true,soft:false,softT:0,prevHand:new T.Vector3(0,-10,0)}; }
 hands.left=mkHand('left'); hands.right=mkHand('right'); const HL=[hands.left,hands.right];
 // Teleport-Bogen
 const ARCN=40, arc=new T.Line(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(ARCN*3),3)),new T.LineBasicMaterial({color:0x7ec8ff,transparent:true,opacity:0.8}));
 arc.visible=false; arc.frustumCulled=false; S.add(arc);
 const tpRing=new T.Mesh(new T.RingGeometry(0.2,0.28,32),new T.MeshBasicMaterial({color:0x7ec8ff,transparent:true,opacity:0.8,side:T.DoubleSide,depthWrite:false})); tpRing.rotation.x=-Math.PI/2; tpRing.visible=false; S.add(tpRing);
 function haptic(h,i,ms){ if(VRP&&VRP.haptic) VRP.haptic(R,h.side,i,ms); }
 // --- Objekte
 // it: {mesh, body?, radius, home:{p,q}?, sticky?, alignRay?, holdOffset?{p,q}, onGrab, onRelease, onTrigger, canGrab(h)?, oob(p)?, noRespawn?}
 function addItem(it){ it.heldBy=null; it.pulling=null; it.idleT=0; it.thrown=false; it.tgtP=new T.Vector3(); it.tgtQ=new T.Quaternion(); it.prevP=new T.Vector3(); it.prevQ=new T.Quaternion(); it.off={p:new T.Vector3(),q:new T.Quaternion()};
  if(!it.home){ it.home={p:it.mesh.position.clone(),q:it.mesh.quaternion.clone()}; } items.push(it); return it; }
 function pos(it){ return it.body?new T.Vector3(it.body.position.x,it.body.position.y,it.body.position.z):it.mesh.getWorldPosition(new T.Vector3()); }
 function quat(it){ return it.body?new T.Quaternion(it.body.quaternion.x,it.body.quaternion.y,it.body.quaternion.z,it.body.quaternion.w):it.mesh.getWorldQuaternion(new T.Quaternion()); }
 function setPose(it,p,q){ if(it.body){ it.body.position.set(p.x,p.y,p.z); if(q) it.body.quaternion.set(q.x,q.y,q.z,q.w); } it.mesh.position.copy(p); if(q) it.mesh.quaternion.copy(q); }
 // Halte-Ziel in Welt: Griff-Pose (oder Zielstrahl-Pose bei alignRay) × Offset
 function holdTarget(h,it,outP,outQ){ const bp=it.alignRay?h.rp:h.gp, bq=it.alignRay?h.rq:h.gq; outP.copy(it.off.p).applyQuaternion(bq).add(bp); outQ.copy(bq).multiply(it.off.q); }
 function holdTargetLocal(h,it,outP){ const bp=it.alignRay?h.rlp:h.lp, bq=it.alignRay?h.rlq:h.lq; return outP.copy(it.off.p).applyQuaternion(bq).add(bp); }
 function attach(h,it,how){ const other=it.heldBy; if(other&&other!==h){ other.held=null; }
  if(h.held&&h.held!==it) dropSoft(h);
  it.heldBy=h; h.held=it; it.pulling=null; h.pull=null; it.thrown=false; it.idleT=0;
  const bp=it.alignRay?h.rp:h.gp, bq=it.alignRay?h.rq:h.gq, iq=bq.clone().invert();
  if(it.holdOffset){ it.off.p.copy(it.holdOffset.p); it.off.q.copy(it.holdOffset.q); }
  else if(how==='pull'){ it.off.p.set(0,-0.01,-(it.radius+0.03)); it.off.q.copy(iq).multiply(quat(it)); }
  else { const p=pos(it); it.off.p.copy(p.sub(bp)).applyQuaternion(iq); const mx=it.radius+0.035; if(it.off.p.length()>mx) it.off.p.setLength(mx); it.off.q.copy(iq).multiply(quat(it)); }
  if(it.body){ it.body.type=C.Body.KINEMATIC; it.body.velocity.set(0,0,0); it.body.angularVelocity.set(0,0,0); it.body.wakeUp&&it.body.wakeUp(); }
  holdTarget(h,it,it.tgtP,it.tgtQ); it.prevP.copy(it.tgtP); it.prevQ.copy(it.tgtQ); setPose(it,it.tgtP,it.tgtQ);
  h.otr.clear(); h.armT=!h.trigRaw; h.armG=!h.gripRaw; h.soft=false;
  haptic(h,0.45,35); if(it.onGrab) it.onGrab(h,it,how); }
 function dropSoft(h){ const it=h.held; if(!it) return; release(h,{gentle:true}); }
 function release(h,opt={}){ const it=h.held; if(!it) return null; h.held=null; it.heldBy=null; h.soft=false;
  holdTarget(h,it,it.tgtP,it.tgtQ);
  // Geschwindigkeit des OBJEKT-Punktes (Referenzraum) → Welt
  let est=h.otr.s.length>=4?h.otr.estimate(null,{windows:cfg.windows,stepBack:cfg.stepBack,tangential:0,max:40}):h.tr.estimate(null,{windows:cfg.windows,stepBack:cfg.stepBack,tangential:0,max:40});
  const west=h.tr.estimate(null,{window:0.08,_one:1,stepBack:cfg.stepBack,tangential:0,max:40});
  const v=est.v.clone().applyQuaternion(rigQ), w=west.w.clone().applyQuaternion(rigQ); if(rigVel.length()<4) v.add(rigVel);
  const raw=v.length(); let scale=opt.gentle?0:(raw<0.35?1:cfg.throwScale); v.multiplyScalar(scale); if(v.length()>cfg.throwMax) v.setLength(cfg.throwMax);
  if(it.body){ it.body.type=C.Body.DYNAMIC; it.body.updateMassProperties&&it.body.updateMassProperties(); it.body.position.set(it.tgtP.x,it.tgtP.y,it.tgtP.z); it.body.velocity.set(v.x,v.y,v.z); it.body.angularVelocity.set(w.x*0.5,w.y*0.5,w.z*0.5); it.body.wakeUp&&it.body.wakeUp(); }
  it.thrown=true; it.idleT=0; it.thrownBy=h; it.lastThrow={v:v.toArray().map(x=>+x.toFixed(2)),raw:+raw.toFixed(2),n:h.otr.s.length};
  h.noHitUntil=performance.now()+250; haptic(h,0.12,12); if(it.onRelease) it.onRelease(h,it,v); return v; }
 function respawn(it){ if(it.heldBy) release(it.heldBy,{gentle:true}); it.pulling=null; HL.forEach(h=>{ if(h.pull&&h.pull.it===it) h.pull=null; });
  setPose(it,it.home.p,it.home.q); if(it.body){ it.body.type=C.Body.DYNAMIC; it.body.velocity.set(0,0,0); it.body.angularVelocity.set(0,0,0); it.body.sleep&&it.body.sleep(); }
  it.thrown=false; it.idleT=0; if(cfg.onRespawn) cfg.onRespawn(it); if(it.onRespawn) it.onRespawn(it); }
 // --- Posen einlesen
 function bindSession(ses){ if(boundSes===ses) return; boundSes=ses; const on=(type,k,val)=>ses.addEventListener(type,e=>{ const h=hands[e.inputSource&&e.inputSource.handedness]; if(h) h.ev[k]=val; });
  on('selectstart','trig',true); on('selectend','trig',false); on('squeezestart','grip',true); on('squeezeend','grip',false); }
 const setXR=(tf,p,q)=>{ p.set(tf.position.x,tf.position.y,tf.position.z); q.set(tf.orientation.x,tf.orientation.y,tf.orientation.z,tf.orientation.w); };
 function sample(now){ HL.forEach(h=>h.seen=false); const pres=R.xr.isPresenting;
  if(simFn){ const s=simFn(simT)||{}; for(const k of ['left','right']){ const d=s[k], h=hands[k]; if(!d) continue; h.lp.copy(d.p); h.lq.copy(d.q||new T.Quaternion()); h.rlp.copy(d.rp||d.p); h.rlq.copy(d.rq||d.q||new T.Quaternion()); h.trigRaw=!!d.trig; h.gripRaw=!!d.grip; h.axes=d.axes||[0,0]; h.seen=true; } }
  else if(pres){ const ses=R.xr.getSession&&R.xr.getSession(), fr=R.xr.getFrame&&R.xr.getFrame(), ref=R.xr.getReferenceSpace&&R.xr.getReferenceSpace();
   if(ses) bindSession(ses);
   if(ses&&fr&&ref){ for(const src of ses.inputSources){ const h=hands[src.handedness]; if(!h) continue;
     let gpz=null, rpz=null; try{ gpz=src.gripSpace?fr.getPose(src.gripSpace,ref):null; rpz=fr.getPose(src.targetRaySpace,ref); }catch(e){}
     if(!gpz) gpz=rpz; if(!gpz) continue; setXR(gpz.transform,h.lp,h.lq); if(rpz) setXR(rpz.transform,h.rlp,h.rlq); else { h.rlp.copy(h.lp); h.rlq.copy(h.lq); }
     const gp=src.gamepad; let tr=h.ev.trig, gr=h.ev.grip;
     if(gp&&gp.buttons){ const b0=gp.buttons[0], b1=gp.buttons[1]; if(b0) tr=tr||b0.pressed||b0.value>0.55; if(b1) gr=gr||b1.pressed||b1.value>0.55; }
     if(src.hand&&fr.getJointPose){ try{ const a=fr.getJointPose(src.hand.get('thumb-tip'),ref), b=fr.getJointPose(src.hand.get('index-finger-tip'),ref);
       if(a&&b){ const dx=a.transform.position.x-b.transform.position.x, dy=a.transform.position.y-b.transform.position.y, dz=a.transform.position.z-b.transform.position.z, d=Math.sqrt(dx*dx+dy*dy+dz*dz); h.pinch=h.pinch?d<0.035:d<0.018; gr=gr||h.pinch; } }catch(e){} }
     h.trigRaw=!!tr; h.gripRaw=!!gr;
     if(gp&&gp.axes&&gp.axes.length){ const n=gp.axes.length; h.axes=[n>=4?gp.axes[2]:gp.axes[0], n>=4?gp.axes[3]:gp.axes[1]]; } else h.axes=[0,0];
     h.seen=true; } } }
  rig.updateMatrixWorld(true); rig.getWorldQuaternion(rigQ);
  for(const h of HL){ h.live=h.seen; if(!h.seen) continue;
   tM.compose(h.lp,h.lq,ONE); tM2.multiplyMatrices(rig.matrixWorld,tM); tM2.decompose(h.gp,h.gq,new T.Vector3());
   tM.compose(h.rlp,h.rlq,ONE); tM2.multiplyMatrices(rig.matrixWorld,tM); tM2.decompose(h.rp,h.rq,new T.Vector3());
   h.tr.push(h.lp,h.lq,now/1000);
   if(h.held){ const op=holdTargetLocal(h,h.held,new T.Vector3()); h.otr.push(op,h.lq,now/1000); } } }
 // --- Strahl-Ziel (Fern-Greifen)
 function rayPick(h){ const dir=new T.Vector3(0,0,-1).applyQuaternion(h.rq); let best=null,bs=1e9;
  for(const it of items){ if(it.heldBy||it.pulling||it.disabled||(it.canGrab&&!it.canGrab(h))) continue; const to=pos(it).sub(h.rp), along=to.dot(dir);
   if(along<0.05||along>cfg.distMax) continue; const perp=to.addScaledVector(dir,-along).length(), allow=it.radius+0.05+along*0.035; if(perp>allow) continue;
   const s=perp/allow+along*0.03; if(s<bs){ bs=s; best={it,along}; } } return best; }
 function nearPick(h){ let best=null,bd=cfg.grabRadius; for(const it of items){ if(it.pulling||it.disabled||(it.canGrab&&!it.canGrab(h))) continue; if(it.heldBy===h) continue;
   const d=pos(it).distanceTo(h.gp)-it.radius; if(d<bd){ bd=d; best=it; } } return best; }
 function tryGrab(h,how){ const n=nearPick(h); if(n){ attach(h,n,how); return true; }
  const r=rayPick(h); if(r){ const it=r.it; it.pulling=h; h.pull={it,t0:simFn?simT:performance.now()/1000,from:pos(it),fromQ:quat(it),dur:Math.max(0.18,Math.min(0.45,r.along*0.08))};
   if(it.body){ it.body.type=C.Body.KINEMATIC; it.body.velocity.set(0,0,0); it.body.angularVelocity.set(0,0,0); it.body.wakeUp&&it.body.wakeUp(); }
   haptic(h,0.25,20); return true; } return false; }
 // --- Fortbewegung
 function headPos(){ const p=new T.Vector3(); cam.getWorldPosition(p); return p; }
 function loco(dt){ const L=hands.left, Rh=hands.right; if(!(R.xr.isPresenting||simFn)) return;
  if(cfg.smooth&&L.live){ const [ax,ay]=L.axes; const m=Math.hypot(ax,ay); if(m>0.18){ const q=cam.getWorldQuaternion(new T.Quaternion()); const f=new T.Vector3(0,0,-1).applyQuaternion(q); f.y=0; f.normalize(); const r=new T.Vector3(1,0,0).applyQuaternion(q); r.y=0; r.normalize();
    const k=Math.min(1,(m-0.18)/0.7)*cfg.moveSpeed*dt/m; const mv=f.multiplyScalar(-ay*k).addScaledVector(r,ax*k); const hp=headPos(), np=hp.clone().add(mv);
    if(!cfg.canStand||cfg.canStand(np)) rig.position.add(mv); else { const nx=hp.clone(); nx.x+=mv.x; const nz=hp.clone(); nz.z+=mv.z; if(cfg.canStand(nx)) rig.position.x+=mv.x; else if(cfg.canStand(nz)) rig.position.z+=mv.z; } } }
  if(Rh.live){ const [ax,ay]=Rh.axes;
   if(Math.abs(ax)>0.7&&Math.abs(ay)<0.6&&snapArm&&!tpAim){ const hp=headPos(); rig.rotation.y-=Math.sign(ax)*cfg.snapDeg*Math.PI/180; rig.updateMatrixWorld(true); const nh=headPos(); rig.position.x+=hp.x-nh.x; rig.position.z+=hp.z-nh.z; snapArm=false; }
   if(Math.hypot(ax,ay)<0.35) snapArm=true;
   if(cfg.teleport&&!Rh.held){ if(ay<-0.7&&Math.abs(ax)<0.6){ tpAim=calcArc(Rh); } else if(tpAim&&Math.hypot(ax,ay)<0.35){ if(tpAim.ok){ const hp=headPos(); rig.position.x+=tpAim.p.x-hp.x; rig.position.z+=tpAim.p.z-hp.z; haptic(Rh,0.2,15); if(cfg.onTeleport) cfg.onTeleport(tpAim.p); } tpAim=null; } }
   else tpAim=null; }
  arc.visible=!!tpAim; tpRing.visible=!!(tpAim&&tpAim.ok); }
 function calcArc(h){ const dir=new T.Vector3(0,0,-1).applyQuaternion(h.rq), p=h.rp.clone(), v=dir.multiplyScalar(7.5), a=arc.geometry.attributes.position; let hit=null, i=0, dt=0.035;
  for(;i<ARCN;i++){ a.setXYZ(i,p.x,p.y,p.z); if(hit){ continue; } const np=p.clone().addScaledVector(v,dt); v.y-=9.81*dt; if(np.y<=cfg.floorY){ const t=(p.y-cfg.floorY)/Math.max(1e-4,p.y-np.y); hit=p.clone().lerp(np,t); hit.y=cfg.floorY; p.copy(hit); } else p.copy(np); }
  a.needsUpdate=true; arc.geometry.computeBoundingSphere(); if(!hit) return {ok:false};
  const ok=!cfg.canStand||cfg.canStand(hit); arc.material.color.set(ok?0x7ec8ff:0xff5040); tpRing.position.set(hit.x,cfg.floorY+0.02,hit.z); return {ok,p:hit}; }
 // --- pro Frame (vor der Physik)
 function update(dt,nowMs){ const now=nowMs!=null?nowMs:performance.now(); lastNow=now; sample(now);
  const rp=new T.Vector3(); rig.getWorldPosition(rp); if(dt>0){ const d=rp.clone().sub(rigPrev); rigVel.copy(d.length()>0.3?d.set(0,0,0):d.divideScalar(dt)); } rigPrev.copy(rp);
  const tnow=simFn?simT:now/1000;
  for(const h of HL){
   if(h.live){ h.vel.copy(h.gp).sub(h.prevGp).divideScalar(Math.max(dt,1e-3)); h.speed=h.speed*0.6+h.vel.length()*0.4; h.prevGp.copy(h.gp); }
   const trig=h.live&&h.trigRaw, grip=h.live&&h.gripRaw; const tDown=trig&&!h.pTrig, gDown=grip&&!h.pGrip; h.pTrig=trig; h.pGrip=grip;
   if(!trig) h.armT=true; if(!grip) h.armG=true;
   if(h.held){ const it=h.held;
    if(it.sticky){ if(tDown&&h.armT&&it.onTrigger) it.onTrigger(h,it); if(gDown&&h.armG){ release(h,{gentle:true}); }
      if(trig) h.armT=false; if(grip) h.armG=false; }
    else if(h.soft){ if(trig||grip){ h.soft=false; } else if(tnow-h.softT>6) release(h,{gentle:true}); }
    else if(!trig&&!grip) release(h);
   } else if(h.pull){ const P=h.pull, it=P.it; let k=(tnow-P.t0)/P.dur; if(k>=1){ attach(h,it,'pull'); if(!trig&&!grip){ h.soft=true; h.softT=tnow; } }
    else { const e=k*k*(3-2*k); const tp=new T.Vector3(), tq=new T.Quaternion(); const save=it.off.p.clone(); it.off.p.set(0,-0.01,-(it.radius+0.03)); holdTarget(h,it,tp,tq); it.off.p.copy(save);
     const p=P.from.clone().lerp(tp,e); p.y+=Math.sin(Math.PI*k)*Math.min(0.35,P.from.distanceTo(tp)*0.12); it.tgtP.copy(p); it.tgtQ.copy(P.fromQ); } }
   else if(h.live&&(tDown||gDown)){ if(!tryGrab(h,tDown?'trigger':'grip')&&tDown&&cfg.onTrigger) cfg.onTrigger(h); }
   // Hover / Highlight / Laser
   h.near=null; h.hover=null; if(h.live&&!h.held&&!h.pull){ h.near=nearPick(h); if(!h.near){ const r=rayPick(h); if(r) h.hover=r; } }
   const tgt=h.near||(h.hover&&h.hover.it); if(tgt!==h._lastT){ if(tgt&&h.near) haptic(h,0.08,8); h._lastT=tgt; }
   h.hl.visible=!!tgt; if(tgt){ h.hl.position.copy(pos(tgt)); h.hl.scale.setScalar(tgt.radius*1.35+0.01); }
   h.g.visible=h.live&&!h.held; if(h.live){ h.g.position.copy(h.gp); h.g.quaternion.copy(h.gq); h.ring.material.color.set(h.near?0xffffff:(h.side==='left'?0x7ec8ff:0xffb070)); }
   const showL=h.live&&!h.held&&!(tpAim&&h===hands.right); h.laser.visible=showL; if(showL){ h.laser.position.copy(h.rp); h.laser.quaternion.copy(h.rq); const len=h.hover?h.hover.along:(cfg.laserLen||0.6); h.laser.scale.set(1,1,len); h.laser.material.opacity=h.hover?0.85:0.25; h.laser.material.color.set(h.hover?0xffe6a8:0xffffff); }
  }
  for(const h of HL) if(h.held){ const it=h.held; it.prevP.copy(it.tgtP); it.prevQ.copy(it.tgtQ); holdTarget(h,it,it.tgtP,it.tgtQ); }
  for(const it of items) if(!it.body&&(it.heldBy||it.pulling)) setPose(it,it.tgtP,it.tgtQ);
  loco(dt);
 }
 // --- Physik: feste Schritte, gehaltene Objekte & Hände werden zwischen letzter und aktueller Pose interpoliert (kinematisch, exakt)
 function step(dt,fn){ const h0=cfg.physH; acc=Math.min(acc+Math.min(dt,0.1),h0*14); const n=Math.floor(acc/h0+1e-6); acc-=n*h0;
  const kin=[]; for(const it of items){ if(!it.body) continue; if(it.heldBy||it.pulling){ if(it.pulling&&!it.heldBy){ it.prevP.copy(pos(it)); it.prevQ.copy(quat(it)); } kin.push(it); } }
  const hb=HL.filter(h=>h.body);
  for(const h of hb){ const live=h.live&&!h.held&&!h.pull; h._to=live?h.gp.clone():new T.Vector3(0,-10,0); h._from=h.body.position.y<-5||!live?h._to.clone():new T.Vector3(h.body.position.x,h.body.position.y,h.body.position.z); if(h._from.distanceTo(h._to)>0.28) h._from.copy(h._to);
   h.body.collisionResponse=live&&h.speed>cfg.handMinSpeed&&performance.now()>h.noHitUntil; }
  const tp=new T.Vector3(), tq=new T.Quaternion();
  for(let k=0;k<n;k++){ const a=(k+1)/n;
   for(const it of kin){ tp.copy(it.prevP).lerp(it.tgtP,a); tq.copy(it.prevQ).slerp(it.tgtQ,a); const b=it.body; b.velocity.set((tp.x-b.position.x)/h0,(tp.y-b.position.y)/h0,(tp.z-b.position.z)/h0); b.angularVelocity.set(0,0,0); b.quaternion.set(tq.x,tq.y,tq.z,tq.w); }
   for(const h of hb){ tp.copy(h._from).lerp(h._to,a); const b=h.body; b.velocity.set((tp.x-b.position.x)/h0,(tp.y-b.position.y)/h0,(tp.z-b.position.z)/h0); }
   fn(h0); }
  for(const it of kin){ setPose(it,it.tgtP,it.tgtQ); if(it.body){ it.body.velocity.set(0,0,0); } it.prevP.copy(it.tgtP); it.prevQ.copy(it.tgtQ); }
  for(const h of hb){ h.body.position.set(h._to.x,h._to.y,h._to.z); }
  // Respawn
  for(const it of items){ if(it.heldBy||it.pulling||it.noRespawn) continue; const p=pos(it);
   if(p.y<cfg.floorY-1||(it.oob&&it.oob(p))){ respawn(it); continue; }
   if(it.thrown){ it.idleT+=dt; const sp=it.body?Math.hypot(it.body.velocity.x,it.body.velocity.y,it.body.velocity.z):0;
    if((it.idleT>(it.respawnAfter||cfg.respawnAfter)&&sp<0.08)||it.idleT>cfg.respawnMax) respawn(it); } }
  return n; }
 // Mesh-Sync für nicht gehaltene Körper macht die Seite selbst; gehaltene setzt step()
 function handOfBody(b){ return HL.find(h=>h.body===b)||null; }
 function simulate(fn){ simFn=fn; simT=0; }
 function simAdvance(dt){ simT+=dt; }
 return {cfg,hands,items,addItem,update,step,release,attach,respawn,tryGrab,handOfBody,simulate,simAdvance,get simT(){return simT;},pos,
   get tpAim(){ return tpAim; }};
}
window.VRG={create};
})();
