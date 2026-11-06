/* ZSR Räume – "Realität entsteht" für alle Alpha-Räume (nicht nur der Warteraum).
   Wird von test/lib/alpha.js mitgeladen (nach fx/zs_reality.js). Nutzt DIESELBE v30-Sprache (zs_reality.js) –
   kein eigener Look. Hier nur: Wurzel, Ränge (autoRank), Skip (Spieler/UI/Overlays), Boden Frame 1 (floorAny),
   keine Restlöcher an Tür/Schlüssel (avoid), Licht wächst mit Snap-Anteil (Farb-Skalierung, gibt bei Fremd-Animation nach),
   spät hinzugefügte Objekte (Tür/Schlüssel/Untertitel) sofort in die Zeitlinie.
   Auto-Start: beim Laden jedes Raums. Ausnahmen: alpha.html (ruft ZSRooms.run beim Aufwachen selbst),
   Warteraum (eigener v30-Aufruf in gfx_warteraum.js). In-Raum-Wechsel (Wohnung aptDoorTrans): nach dem Swap neu.
   Debug: ?noreal=1 aus · ?zsrauto=0 kein Auto-Start · window.ZSRooms.run() von Hand. */
(function(){
const Q=location.search; if(/[?&]noreal=1/.test(Q)) return;
const P=location.pathname;
const MANUAL=/alpha\.html$/.test(P)||/\/v3\/?$/.test(P)||/era_warteraum/.test(P)||/[?&]zsrauto=0/.test(Q);
const SKIPNAME=/aptTrans|fade|black|overlay|\bhud\b|subtitle|untertitel|cinemaScreen|vignette|laser|cursor|raycast|teleport|helpmenu|zsHelp|zsaHud/i;
let lastRun=0, L=null;
function scn(){ return document.querySelector('a-scene'); }
function rigObj(){ const r=document.getElementById('rig'); return r&&r.object3D; }
function skipFn(o){ const rig=rigObj();
 for(let p=o;p;p=p.parent){ if(p===rig) return true; if(p.userData&&p.userData.zsrSkip) return true; if(p.name&&SKIPNAME.test(p.name)) return true; }
 if(o.renderOrder>=5) return true;
 const ms=Array.isArray(o.material)?o.material:[o.material];
 for(const m of ms){ if(!m) continue; if(m.depthTest===false) return true; if(m.transparent&&m.depthWrite===false&&m.blending===THREE.AdditiveBlending) return true;
  if(m.transparent&&m.depthWrite===false&&m.map&&(m.map.isCanvasTexture||m.map.isVideoTexture)&&o.geometry&&o.geometry.type==='PlaneGeometry') return true; }
 return false; }
function alphaAvoid(){ const out=[]; try{ const s=window.ZSA&&ZSA.cur&&ZSA.cur(); if(s&&s.door) out.push([s.door.x,1.0,s.door.z,1.3]); if(s&&s.key) out.push([s.key.x,s.key.y||0.5,s.key.z,0.7]); if(s&&s.key&&s.key.hide) out.push([s.key.hide.x,s.key.hide.y||0.5,s.key.hide.z,0.8]); }catch(e){} return out; }
/* Licht wächst mit: Lichtfarbe × k (Hemi/Ambient/Sonne folgen allen Snaps, Punkt-/Spotlichter den Möbel/Figuren-Snaps).
   Setzt die Seite selbst eine Farbe (Flackern), wird das die neue Basis – keine Kämpfe mit Raum-Animationen. */
/* Additive Glows/Halos (vom Shader übersprungen) folgen dem Licht – sonst hängen fertige Lichtpunkte im Void */
function glowsInit(S){ const arr=[], seen=new Set(); S.traverse(o=>{ if(!o.isMesh&&!o.isSprite) return; for(let p=o;p;p=p.parent) if(p===rigObj()) return; const ms=Array.isArray(o.material)?o.material:[o.material];
 for(const m of ms){ if(!m||seen.has(m)||m.blending!==THREE.AdditiveBlending||!m.transparent) continue; seen.add(m); arr.push({m,b:m.opacity,last:m.opacity}); } }); return arr; }
let GL=null;
function lightsInit(S){ const arr=[]; S.traverse(o=>{ if(!o.isLight) return; for(let p=o;p;p=p.parent) if(p===rigObj()) return;
 arr.push({l:o,b:o.color.clone(),g:o.groundColor?o.groundColor.clone():null,last:o.color.clone(),lastG:o.groundColor?o.groundColor.clone():null,amb:!!(o.isHemisphereLight||o.isAmbientLight||o.isDirectionalLight)}); }); return arr; }
function lightsTick(){ if(!L||!window.ZSR) return; watchTick(); const st=ZSR.state; const end=!st.active||st.tAbs>=st.tEnd;
 const F=st.frac||{a:0,w:0}, kA=end?1:Math.max(0.20,Math.pow(F.a,1.15)), kW=end?1:Math.max(0.10,Math.pow(F.w,1.10));
 for(const e of L){ const l=e.l; if(!l.color.equals(e.last)) e.b.copy(l.color); if(e.g&&l.groundColor&&!l.groundColor.equals(e.lastG)) e.g.copy(l.groundColor);
  const k=e.amb?kA:kW; l.color.copy(e.b).multiplyScalar(k); e.last.copy(l.color); if(e.g){ l.groundColor.copy(e.g).multiplyScalar(k); e.lastG.copy(l.groundColor); } }
 if(GL){ for(const e of GL){ if(Math.abs(e.m.opacity-e.last)>1e-4) e.b=e.m.opacity; e.m.opacity=e.b*(end?1:Math.max(0.04,kW)); e.last=e.m.opacity; } }
 if(end){ for(const e of L){ e.l.color.copy(e.b); if(e.g) e.l.groundColor.copy(e.g); } L=null; if(GL){ for(const e of GL) e.m.opacity=e.b; GL=null; } } }
let ticking=false;
function ensureTick(sc){ if(ticking) return; ticking=true;
 if(window.AFRAME&&!AFRAME.components['zsr-rooms']) AFRAME.registerComponent('zsr-rooms',{tick(){ try{ lightsTick(); }catch(e){} }});
 sc.setAttribute('zsr-rooms','');
 /* Spät hinzugefügte Objekte (Tür +300 ms, Schlüssel, Raum-Extras) sofort in die laufende Zeitlinie */
 sc.object3D.addEventListener&&sc.object3D.addEventListener('childadded',ev=>{ const c=ev.child; if(!c||!window.ZSR||!ZSR.state.active) return; if(skipFn(c)) return;
  try{ ZSR.autoRank(c,{skip:skipFn}); ZSR.adopt(c); }catch(e){} }); }
/* run(opts): Raum aus Datenblöcken zusammensetzen. opts.root (Standard: ganze Szene), opts.avoid, opts.duration */
/* Räume, die nach 'loaded' asynchron weiterbauen (Wohnung, GLBs): solange die Zeitlinie noch im Void/Boden ist (<0,9 s),
   bzw. in den ersten ~30 gerenderten Frames bei deutlich mehr Meshes neu ansetzen – damit auch die Volumenblöcke auf der echten Geometrie sitzen. Danach nur adopt. */
let W=null;
function meshCount(root){ let n=0; root.traverse(o=>{ if(o.isMesh&&!skipFn(o)) n++; }); return n; }
function watchTick(){ if(!W||!window.ZSR) return; const st=ZSR.state; W.f++; if(W.f>30&&W.f%6) return; if(!st.active||(st.tAbs>0.9&&W.f>30)||W.n>=3||W.f>240){ W=null; return; } /* Frames statt Uhr: schwere Bauer blockieren den Thread, die Uhr läuft dabei weiter */
 const c=meshCount(W.root); if(c>=W.c+12||c>W.c*1.25){ W.n++; const o=Object.assign({},W.o,{force:true,_w:W}); run(o); } }
function run(o={}){ const sc=scn(); if(!sc||!sc.object3D||!window.ZSR) return null; const T=THREE; const now=performance.now(); if(!o.force&&now-lastRun<300) return null; lastRun=now;
 const root=o.root||sc.object3D; ensureTick(sc);
 const info=ZSR.autoRank(root,{skip:skipFn});
 const avoid=(o.avoid||[]).concat(alphaAvoid(),info.avoid);
 const org=new T.Vector3(); if(sc.camera) sc.camera.getWorldPosition(org);
 if(L){ for(const e of L){ e.l.color.copy(e.b); if(e.g) e.l.groundColor.copy(e.g); } } if(GL){ for(const e of GL) e.m.opacity=e.b; }
 L=lightsInit(sc.object3D); GL=glowsInit(sc.object3D);
 const ctl=ZSR.assemble(root,{duration:o.duration||4.0,cell:o.cell||0.17,radial:0.55,blocks:o.blocks||1600,origin:org,skip:skipFn,floorAny:o.floorAny!==false,avoid});
 lightsTick();
 const w0=o._w; W={root,o:Object.assign({},o,{_w:null,force:false}),c:meshCount(root),n:w0?w0.n:0,f:0,t:w0?w0.t:now};
 window.__zsrRooms={info,avoid:avoid.length,t:now,reruns:W.n}; return ctl; }
window.ZSRooms={run,skip:skipFn};
/* Wohnung & Co.: Raumwechsel per aptDoorTrans → nach dem Swap setzt sich der neue Raum zusammen */
function wrapDoorTrans(){ const f=window.aptDoorTrans; if(!f||f.__zsr) return; const w=function(sc,o){ o=o||{}; const sw=o.swap; o.swap=function(){ const r=sw&&sw.apply(this,arguments); setTimeout(()=>run(),0); return r; }; return f.call(this,sc,o); }; w.__zsr=1; window.aptDoorTrans=w; }
document.addEventListener('DOMContentLoaded',()=>{ wrapDoorTrans(); if(MANUAL) return; const sc=scn(); if(!sc) return;
 const go=()=>{ wrapDoorTrans(); /* nach den 'loaded'-Bauern der Seite (gleicher Event, später registriert) – vor dem ersten sichtbaren Bild */ run(); };
 sc.hasLoaded?go():sc.addEventListener('loaded',go); });
})();
