/* touchctl.js – Handy-Steuerung für Rewind (ohne VR), wie ein Point-&-Click-Adventure.
   Aktiv ohne XR auf Touch-Geräten (oder mit ?touch=1, aus mit ?touch=0). Ändert keine Szene, hängt sich von außen ein:
   wischen = umsehen · Boden antippen = hingehen · Gegenstand/Tür antippen = hingehen + benutzen (gleicher Klick-Weg wie die Maus am PC)
   doppelt auf den Boden = 180° · Knöpfe: B (zurück), Inventar, Menü (helpmenu.js) · Automaten-Kino: Steuerkreuz + A/B.
   ?joy=1 = zusätzlich virtueller Stick links (Rückfall). */
(function(){
if(window.ZSTouch) return;
const Q=location.search, UA=navigator.userAgent||'';
const force=/[?&]touch=1/.test(Q), off=/[?&]touch=0/.test(Q);
const touchDev=(('ontouchstart' in window)||navigator.maxTouchPoints>0)&&window.matchMedia&&matchMedia('(pointer:coarse)').matches;
const Z=window.ZSTouch={active:false};
// Ton aus, wenn die Seite/App in den Hintergrund geht (alle AudioContexts + Videos/Audios merken und anhalten)
(function(){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC||AC.__zsWrapped) return; const all=window.__zsACs=[];
 const W=function(...a){ const c=new AC(...a); all.push(c); return c; }; W.prototype=AC.prototype; W.__zsWrapped=true; try{ Object.setPrototypeOf(W,AC); }catch(e){}
 window.AudioContext=W; if(window.webkitAudioContext) window.webkitAudioContext=W; let paused=[], media=[];
 document.addEventListener('visibilitychange',()=>{ if(document.hidden){ paused=all.filter(c=>c.state==='running'); paused.forEach(c=>c.suspend().catch(()=>{})); media=[...document.querySelectorAll('video,audio')].filter(m=>!m.paused); media.forEach(m=>m.pause()); }
  else { paused.forEach(c=>c.resume().catch(()=>{})); media.forEach(m=>m.play().catch(()=>{})); paused=[]; media=[]; } }); })();
if(off||!(force||(touchDev&&!/OculusBrowser|Quest|Pico/i.test(UA)))) return;
Z.active=true;
// ---------- Video/Ton auf dem Handy: blockiertes play() (keine Geste) → stumm weiterlaufen lassen, beim nächsten Tipp Ton an ----------
(function(){ const MP=HTMLMediaElement.prototype, op=MP.play; if(op.__zs) return; const mutedByUs=new Set(), vids=window.__zsVids=new Set();
 MP.play=function(){ const el=this; vids.add(el); if(!el.__zsErr){ el.__zsErr=1; el.addEventListener('error',()=>{ const e=el.error; console.warn('[ZSTouch] Medienfehler',el.currentSrc||el.src,e&&e.code,e&&e.message); }); }
  let pr; try{ pr=op.call(el); }catch(err){ return Promise.reject(err); }
  return pr&&pr.catch?pr.catch(err=>{ if(err&&err.name==='NotAllowedError'&&!el.muted){ el.muted=true; mutedByUs.add(el); return op.call(el); } throw err; }):pr; };
 MP.play.__zs=1;
 const unlock=()=>{ mutedByUs.forEach(el=>{ el.muted=false; }); mutedByUs.clear(); (window.__zsACs||[]).forEach(c=>{ if(c.state==='suspended'&&!document.hidden) c.resume().catch(()=>{}); }); };
 ['touchend','click','keydown'].forEach(t=>window.addEventListener(t,unlock,{capture:true,passive:true})); })();
const LS={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}}};
// Viewport: kein Zoom, bis in die Ränder (Notch/Safe-Area per CSS)
let vp=document.querySelector('meta[name=viewport]'); if(!vp){ vp=document.createElement('meta'); vp.name='viewport'; document.head.appendChild(vp); }
vp.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
const css=`html,body{overscroll-behavior:none;touch-action:none;overflow:hidden;position:fixed;inset:0;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
a-scene canvas{touch-action:none}
body.zs-touch #hud{display:none!important}
body.zs-touch .a-enter-vr,body.zs-touch .a-enter-ar{display:none!important}
#tc-drop{display:none;right:calc(18px + env(safe-area-inset-right));bottom:calc(112px + env(safe-area-inset-bottom))}#tc-ui.hold #tc-drop{display:block}
#tc-nk{position:fixed;z-index:49;left:calc(14px + env(safe-area-inset-left));top:12vh;height:58vh;aspect-ratio:3/2;display:none;pointer-events:none;background:#9aa57a;border:6px solid #1c1d1f;border-radius:14px;box-shadow:0 0 0 2px #3a3c40;image-rendering:pixelated;image-rendering:crisp-edges}
#tc-ui{position:fixed;inset:0;z-index:50;pointer-events:none;font-family:"DejaVu Sans",system-ui,sans-serif}
#tc-ui .bt{position:absolute;pointer-events:auto;width:62px;height:62px;border-radius:50%;border:1px solid rgba(200,180,140,.38);background:rgba(22,19,16,.62);color:#eadfc8;font:700 22px/60px sans-serif;text-align:center;backdrop-filter:blur(3px);-webkit-tap-highlight-color:transparent}
#tc-ui .bt:active,#tc-ui .bt.dn{background:rgba(70,58,40,.8)}
#tc-ui .bt small{position:absolute;left:0;right:0;top:64px;font:600 11px sans-serif;opacity:.6;line-height:1}
#tc-b{right:calc(18px + env(safe-area-inset-right));bottom:calc(22px + env(safe-area-inset-bottom))}
#tc-inv{right:calc(92px + env(safe-area-inset-right));bottom:calc(22px + env(safe-area-inset-bottom))}
#tc-pad{display:none}#tc-ui.cine #tc-pad{display:block}#tc-ui.cine #tc-inv{display:none}
#tc-pad .bt{width:66px;height:66px;line-height:64px;font-size:24px}
#tc-u{left:calc(92px + env(safe-area-inset-left));bottom:calc(128px + env(safe-area-inset-bottom))}
#tc-d{left:calc(92px + env(safe-area-inset-left));bottom:calc(18px + env(safe-area-inset-bottom))}
#tc-l{left:calc(22px + env(safe-area-inset-left));bottom:calc(73px + env(safe-area-inset-bottom))}
#tc-r{left:calc(162px + env(safe-area-inset-left));bottom:calc(73px + env(safe-area-inset-bottom))}
#tc-a{right:calc(96px + env(safe-area-inset-right));bottom:calc(64px + env(safe-area-inset-bottom));width:78px!important;height:78px!important;line-height:76px!important}
#tc-ui.cine #tc-b{bottom:calc(150px + env(safe-area-inset-bottom))}
#tc-joy{position:absolute;pointer-events:auto;left:calc(24px + env(safe-area-inset-left));bottom:calc(24px + env(safe-area-inset-bottom));width:130px;height:130px;border-radius:50%;border:1px solid rgba(200,180,140,.3);background:rgba(22,19,16,.35);display:none}
#tc-joy i{position:absolute;left:41px;top:41px;width:48px;height:48px;border-radius:50%;background:rgba(220,200,160,.35)}
#tc-ui.joy #tc-joy{display:block}#tc-ui.cine #tc-joy{display:none}
#tc-inv-p{position:fixed;z-index:65;right:calc(16px + env(safe-area-inset-right));bottom:calc(100px + env(safe-area-inset-bottom));min-width:240px;max-width:60vw;background:linear-gradient(#1c1915,#14120f);border:1px solid #5a4a32;border-radius:14px;padding:12px 16px;color:#e8dcc4;font:15px/1.4 sans-serif;display:none;pointer-events:auto}
#tc-inv-p b{letter-spacing:3px;color:#d8c8a8}#tc-inv-p .it{display:flex;gap:10px;align-items:center;padding:8px 0;border-top:1px solid #2e271e}
#tc-rot{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;flex-direction:column;background:#141210;color:#d8c8a8;font:600 18px sans-serif;text-align:center;gap:14px}
#tc-rot div{font-size:54px}
@media (orientation:portrait){ #tc-rot{display:flex} }
#tc-toast{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top));transform:translateX(-50%);z-index:66;background:rgba(22,19,16,.8);color:#eadfc8;border:1px solid #4e412e;border-radius:10px;padding:7px 14px;font:600 14px sans-serif;opacity:0;transition:opacity .25s;pointer-events:none}`;
function domReady(f){ document.readyState==='loading'?document.addEventListener('DOMContentLoaded',f):f(); }
let ui, sc, canvas, cam, camEl, rig, inXR=false, invert=false;
function toast(t,ms){ const e=document.getElementById('tc-toast'); if(!e) return; e.textContent=t; e.style.opacity=1; clearTimeout(e._t); e._t=setTimeout(()=>e.style.opacity=0,ms||1600); }
function key(type,code){ const k={ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight',Space:' ',Escape:'Escape',Enter:'Enter'}[code]||code;
 const ev=new KeyboardEvent(type,{code,key:k,bubbles:true,cancelable:true}); (document.activeElement||document.body).dispatchEvent(ev); }
const cinema=()=>window.ArcadeCinema&&ArcadeCinema.phase&&ArcadeCinema.phase()!=='off';
const cineOn=()=>window.ArcadeCinema&&ArcadeCinema.phase&&ArcadeCinema.phase()==='on';
const examining=()=>window.ZSX&&(ZSX.active||(ZSX.busy&&ZSX.busy()));
function mouse(type,x,y,target){ const ev=new MouseEvent(type,{clientX:x,clientY:y,screenX:x,screenY:y,button:0,buttons:type==='mouseup'||type==='click'?0:1,bubbles:true,cancelable:true,view:window}); ev.__tc=1; (target||canvas).dispatchEvent(ev); }
// A-Frame-Cursor (rayOrigin:mouse) prüft Treffer sonst erst im nächsten Frame → sofort prüfen
function syncCursor(){ try{ document.querySelectorAll('[cursor]').forEach(e=>{ const c=e.components&&e.components.cursor, r=e.components&&e.components.raycaster; if(c&&c.data.rayOrigin==='mouse'&&r){ r.refreshObjects&&r.dirty&&r.refreshObjects(); r.checkIntersections(); } }); }catch(err){} }
function clickAt(x,y){ mouse('mousemove',x,y); syncCursor(); mouse('mousedown',x,y); mouse('mouseup',x,y); mouse('click',x,y); tvHit(x,y); }
// Röhren-TV (tv.js) prüft das getroffene Mesh; unsichtbare Modellteile davor schlucken den Cursor-Klick → Knopf/Schirm direkt auslösen
function tvHit(x,y){ try{ const h=pick(x,y); const tv=h&&h.ce&&h.ce.components&&h.ce.components['crt-tv']; if(!tv||!tv.hit) return; if(performance.now()-(tv.lastHit||0)<350) return;
 const k=new (T().Vector3)(); const kn=tv.knobHit||tv.knob; if(kn){ kn.getWorldPosition(k); if(tv.on&&k.distanceTo(h.point)<0.09){ tv.hit(kn); return; } } tv.hit(tv.screen); }catch(e){} }

function buildUI(){
 const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st); document.body.classList.add('zs-touch');
 ui=document.createElement('div'); ui.id='tc-ui'; ui.innerHTML=`<div class="bt" id="tc-b">B<small>zurück</small></div><div class="bt" id="tc-inv">🎒<small>Inventar</small></div><div class="bt" id="tc-drop">✋<small>Ablegen</small></div>
 <div id="tc-pad"><div class="bt" id="tc-u">▲</div><div class="bt" id="tc-d">▼</div><div class="bt" id="tc-l">◀</div><div class="bt" id="tc-r">▶</div><div class="bt" id="tc-a">A</div></div><div id="tc-joy"><i></i></div>`;
 document.body.appendChild(ui); if(/[?&]joy=1/.test(Q)) ui.classList.add('joy');
 const r=document.createElement('div'); r.id='tc-rot'; r.innerHTML='<div>↻</div>Bitte das Handy quer halten'; document.body.appendChild(r);
 const t=document.createElement('div'); t.id='tc-toast'; document.body.appendChild(t);
 const ip=document.createElement('div'); ip.id='tc-inv-p'; document.body.appendChild(ip);
 const stop=e=>{ e.stopPropagation(); };
 [ui,ip].forEach(n=>['touchstart','touchend','touchmove','mousedown','mouseup','click'].forEach(tp=>n.addEventListener(tp,stop)));
 const press=(id,dn,up)=>{ const b=document.getElementById(id); b.addEventListener('touchstart',e=>{ e.preventDefault(); e.stopPropagation(); b.classList.add('dn'); fs(); dn&&dn(); },{passive:false});
  const u=e=>{ e.preventDefault(); e.stopPropagation(); b.classList.remove('dn'); up&&up(); }; b.addEventListener('touchend',u,{passive:false}); b.addEventListener('touchcancel',u,{passive:false});
  b.addEventListener('click',e=>{ e.stopPropagation(); if(!('ontouchstart' in window)){ dn&&dn(); up&&up(); } }); };
 press('tc-b',back);
 press('tc-inv',toggleInv); press('tc-drop',back);
 const nk=document.createElement('canvas'); nk.id='tc-nk'; nk.width=384; nk.height=256; document.body.appendChild(nk);
 [['tc-u','ArrowUp'],['tc-d','ArrowDown'],['tc-l','ArrowLeft'],['tc-r','ArrowRight']].forEach(([id,c])=>press(id,()=>key('keydown',c),()=>key('keyup',c)));
 press('tc-a',()=>{ key('keydown','Space'); },()=>key('keyup','Space'));
 setupJoy();
 // kleine Alpha-Anzeige (unten rechts) nach oben links, damit sie nicht unter den Knöpfen liegt
 const mvA=()=>{ document.querySelectorAll('body > div').forEach(d=>{ if(/^ALPHA ·/.test(d.textContent||'')&&!d.id){ d.style.right='auto'; d.style.bottom='auto'; d.style.left='calc(12px + env(safe-area-inset-left))'; d.style.top='calc(12px + env(safe-area-inset-top))'; d.style.opacity='.7'; } }); }; mvA(); setTimeout(mvA,1500);
}
function back(){
 if(window.__zsCutSkip){ __zsCutSkip(); return; }   // Zwischenszene läuft → überspringen
 if(document.getElementById('tc-inv-p').style.display==='block'){ toggleInv(); return; }
 if(window.ZSHelp&&ZSHelp.isOpen()){ ZSHelp.close(); return; }
 if(cinema()){ if(ArcadeCinema.close) ArcadeCinema.close(); return; }
 if(heldNow()){ ZSHeld.drop(); return; }   // gehaltenen Gegenstand ablegen
 if(window.ZSTouch.onBack&&ZSTouch.onBack()) return;   // Haken für Szenen/alpha.js (z.B. Handy zurück ins Inventar)
 walk=null; key('keydown','Escape'); key('keyup','Escape');
}
const heldNow=()=>!!(window.ZSHeld&&ZSHeld.active&&ZSHeld.active());
function phoneOut(){ return !!(window.ZSINV&&ZSINV.where&&(ZSINV.where()==='hand'||(window.ZSX&&ZSX.active&&ZSX.cur&&ZSX.cur.obj===(document.getElementById('nokio')||{}).object3D))); }
function toggleInv(){ const p=document.getElementById('tc-inv-p'); if(p.style.display==='block'){ p.style.display='none'; return; }
 if(window.ZSINV&&ZSINV.list&&ZSINV.list().length===1&&ZSINV.take){ if(phoneOut()) ZSINV.putAway(); else { walk=null; ZSINV.take(); } return; }
 let h='<b>INVENTAR</b>';
 const inv=window.ZSINV&&ZSINV.list&&ZSINV.list();
 if(inv&&inv.length){ inv.forEach(it=>{ h+=`<div class="it" data-id="${it.id||''}"><span style="font-size:22px">${it.icon||'▪'}</span><span>${it.name||it.id}</span></div>`; }); }
 else if(window.ZSINV&&ZSINV.toggle){ p.style.display='none'; ZSINV.toggle(); return; }
 else { const Sx=window.ZSA; if(Sx&&Sx.STEPS){ const n=Sx.step, tot=Sx.STEPS.length; h+=`<div class="it"><span style="font-size:22px">🗝️</span><span>Fortschritt: Raum ${Math.min(n+1,tot)} von ${tot}<br><small style="opacity:.6">${(Sx.cur()&&Sx.cur().title)||''}</small></span></div>`; }
  h+='<div class="it" style="opacity:.6"><span style="font-size:22px">📱</span><span>Handy & Gegenstände folgen mit dem nächsten Update</span></div>'; }
 p.innerHTML=h; p.style.display='block';
 p.querySelectorAll('.it[data-id]').forEach(e=>e.addEventListener('click',()=>{ if(window.ZSINV&&ZSINV.select) ZSINV.select(e.dataset.id); p.style.display='none'; })); }

// ---------- Vollbild + Querformat beim ersten Tippen (bei jedem Raum neu, Browser verlangt eine Geste) ----------
let fsTried=0;
function fs(){ if(/RewindTestApp/.test(UA)) return; if(fsTried>2||document.fullscreenElement||window.matchMedia('(display-mode: fullscreen)').matches) return; fsTried++; const de=document.documentElement; try{ const p=(de.requestFullscreen||de.webkitRequestFullscreen).call(de,{navigationUI:'hide'}); p&&p.then&&p.then(()=>{ screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{}); }).catch(()=>{}); }catch(e){} }

// ---------- Blick ----------
// volle Bildschirmbreite (CSS-px) = 180° × Empfindlichkeit (Optionen › Blick-Empfindlichkeit, Standard 1.3)
const SENS=()=>{ const v=parseFloat(LS.get('zs_touch_sens')); return isFinite(v)&&v>0.2?v:1.0; };
const LOOK=()=>Math.PI*SENS()/Math.max(320,Math.min(window.innerWidth||document.documentElement.clientWidth,1600));
function look(dx,dy){ const s=LOOK()*(invert?-1:1); const lc=camEl&&camEl.components['look-controls'];
 if(lc&&lc.yawObject){ if(lc.data&&lc.data.enabled===false) return; lc.yawObject.rotation.y-=dx*s; lc.pitchObject.rotation.x=Math.max(-1.25,Math.min(1.25,lc.pitchObject.rotation.x-dy*s)); }
 else if(cam){ cam.rotation.order='YXZ'; cam.rotation.y-=dx*s; cam.rotation.x=Math.max(-1.25,Math.min(1.25,cam.rotation.x-dy*s)); } }
function turn180(){ const lc=camEl&&camEl.components['look-controls']; if(lc&&lc.yawObject) lc.yawObject.rotation.y+=Math.PI; else if(cam) cam.rotation.y+=Math.PI; toast('↻ 180°',700); }

// ---------- Tippen: Raycast wie die Maus ----------
const T=()=>window.THREE;
let rc=null; const mrk={m:null,t:0};
function visibleChain(o){ for(let p=o;p;p=p.parent){ if(p.visible===false) return false; } return true; }
function clickableOf(o){ for(let p=o;p;p=p.parent){ if(p.el&&p.el.classList&&p.el.classList.contains('clickable')) return p.el; } return null; }
function ownRig(o){ for(let p=o;p;p=p.parent){ if(p===rig||p===mrk.m) return true; } return false; }
function ndc(x,y){ const r=canvas.getBoundingClientRect(); return {x:(x-r.left)/r.width*2-1,y:-(y-r.top)/r.height*2+1}; }
function pick(x,y){ const TH=T(); rc=rc||new TH.Raycaster(); rc.setFromCamera(ndc(x,y),sc.camera); rc.far=40;
 const hits=rc.intersectObject(sc.object3D,true); let best=null;
 for(const h of hits){ const o=h.object; if(!o.isMesh||h.distance<0.12) continue; if(ownRig(o)||!visibleChain(o)) continue;
  const ce=clickableOf(o); const mv=Array.isArray(o.material)?o.material.some(m=>m&&m.visible!==false):(o.material&&o.material.visible!==false);
  if(!mv&&!ce) continue; if(o.material&&!Array.isArray(o.material)&&o.material.transparent&&o.material.opacity<0.05&&!ce) continue;
  if(o.geometry&&o.geometry.boundingSphere&&o.geometry.boundingSphere.radius*Math.max(o.scale.x,1)>60&&!ce) continue; // Himmel/Panorama-Kugel
  best=h; best.ce=ce; break; }
 // gibt es ein .clickable auf dem Strahl knapp hinter einer unsichtbaren Fläche? (A-Frame-Cursor nimmt das erste .clickable)
 if(best&&!best.ce){ for(const h of hits){ if(h.distance>best.distance+0.05) break; const ce=clickableOf(h.object); if(ce&&visibleChain(h.object)){ best.ce=ce; break; } } }
 if(!best){ const pl=new TH.Plane(new TH.Vector3(0,1,0),0), p=new TH.Vector3(); if(rc.ray.intersectPlane(pl,p)&&p.distanceTo(rc.ray.origin)<14) return {point:p,floor:true}; return null; }
 let floor=false; if(best.face){ const n=best.face.normal.clone().transformDirection(best.object.matrixWorld); floor=(n.y>0.65&&best.point.y<0.5)||best.point.y<0.12; } else floor=best.point.y<0.12;
 return {point:best.point.clone(),floor:floor&&!best.ce,ce:best.ce,dist:best.distance}; }
function head(){ const p=new (T().Vector3)(); sc.camera.getWorldPosition(p); return p; }
function marker(p){ const TH=T(); if(!mrk.m){ mrk.m=new TH.Mesh(new TH.RingGeometry(0.13,0.155,40),new TH.MeshBasicMaterial({color:0xd8c8a8,transparent:true,opacity:0,depthWrite:false,fog:false})); mrk.m.rotation.x=-Math.PI/2; mrk.m.renderOrder=5; sc.object3D.add(mrk.m); }
 mrk.m.position.set(p.x,p.y+0.012,p.z); mrk.t=performance.now(); mrk.m.visible=true; }
function markTick(){ if(!mrk.m||!mrk.m.visible) return; const k=(performance.now()-mrk.t)/650; if(k>=1){ mrk.m.visible=false; return; } mrk.m.material.opacity=0.32*(1-k); const s=0.8+0.35*k; mrk.m.scale.set(s,s,s); }
function screenOf(p){ const v=p.clone().project(sc.camera); if(v.z>1||Math.abs(v.x)>1.05||Math.abs(v.y)>1.05) return null; const r=canvas.getBoundingClientRect(); return [r.left+(v.x+1)/2*r.width, r.top+(1-v.y)/2*r.height]; }

// ---------- Hingehen (gleiten, die Kollision macht jede Szene selbst in ihrem tick) ----------
let walk=null;
function walkTo(p,stop,done){ walk={p:p.clone(),stop:stop||0.05,done,t0:performance.now(),chk:performance.now(),last:1e9,v:0}; }
function walkTick(dt){ if(!walk) return; if(inXR||cinema()||examining()){ walk=null; return; }
 const h=head(), dx=walk.p.x-h.x, dz=walk.p.z-h.z, d=Math.hypot(dx,dz), now=performance.now();
 const fin=ok=>{ const w=walk; walk=null; if(w.done) w.done(ok); };
 if(d<=walk.stop+0.03) return fin(true);
 walk.n=(walk.n||0)+1; if(walk.n%8===0){ if(walk.last<1e8&&walk.last-d<0.3*(walk.exp||0)) return fin(d<2.2); walk.last=d; walk.exp=0; } if(walk.last>1e8) walk.last=d;   // hängt fest (Wand/Möbel) → hier stehen bleiben
 if(now-walk.t0>15000) return fin(false);
 walk.v=Math.min(1.9,walk.v+dt*4.5); const rem=d-walk.stop; const sp=Math.min(walk.v,Math.max(0.5,rem*2.6)); const st=Math.min(rem,sp*dt);
 walk.exp=(walk.exp||0)+st; const o=rig.position; o.x+=dx/d*st; o.z+=dz/d*st; if(window.__br&&__br.collide&&__br.group&&__br.group.visible) __br.collide(o); }

let lastTap={t:0,x:0,y:0};
function tap(x,y){
 if(window.__introV&&!window.__introDone){ clickAt(x,y); return; }   // Intro-Film: nicht laufen
 if(cineOn()){ key('keydown','Space'); setTimeout(()=>key('keyup','Space'),60); return; }
 if(examining()){ clickAt(x,y); return; }
 if(heldNow()){ const h=pick(x,y); if(h&&h.ce){ clickAt(x,y); return; } ZSHeld.drop(); return; }   // gehalten: Tipp ins Leere = ablegen
 const now=performance.now(), dbl=now-lastTap.t<320&&Math.hypot(x-lastTap.x,y-lastTap.y)<50; lastTap={t:now,x,y};
 const hit=pick(x,y);
 if(dbl&&(!hit||hit.floor)){ walk=null; turn180(); lastTap.t=0; return; }
 if(!hit){ clickAt(x,y); return; }
 const h=head(), d=Math.hypot(hit.point.x-h.x,hit.point.z-h.z);
 if(hit.floor){ marker(hit.point); clickAt(x,y); walkTo(hit.point,0.05); return; }   // Klick trotzdem senden: legt z.B. gehaltene Dinge ab wie am PC
 // Gegenstand / Tür / Wand: hingehen, dann den gleichen Klick wie mit der Maus
 const reach=hit.ce?1.15:0.45;
 if(d<=reach+0.35){ clickAt(x,y); return; }
 const p=hit.point.clone();
 if(!hit.ce){ clickAt(x,y); walkTo(p,reach); return; }   // Tür/Wand: Klick sofort (wie Maus am PC), dann hingehen
 walkTo(p,reach,()=>{ const s=screenOf(p); if(s) clickAt(s[0],s[1]); else clickAt(x,y); });
}

// ---------- Touch-Gesten auf der 3D-Fläche ----------
const F={};   // aktive Finger auf dem Canvas
// Spielfläche = alles außer unseren Knöpfen/Menüs und Bedienelementen (auch Overlays/HUD über dem Canvas)
function onCanvas(e){ const t=e.target; if(!t||!t.closest) return false; if(t===canvas) return true; if(t.closest('#tc-ui .bt,#tc-joy,#tc-inv-p,#zsh,#zsh-btn,#start,#tc-rot,button,a,input,select,textarea,[onclick]')) return false; return !!document.querySelector('a-scene'); }
function tstart(e){ if(inXR||!canvas) return; if(!onCanvas(e)) return; e.preventDefault(); e.stopImmediatePropagation(); fs();
 for(const t of e.changedTouches){ F[t.identifier]={x0:t.clientX,y0:t.clientY,x:t.clientX,y:t.clientY,t0:e.timeStamp,moved:false,zsx:examining()}; if(F[t.identifier].zsx){ mouse('mousemove',t.clientX,t.clientY); mouse('mousedown',t.clientX,t.clientY); } } }
function tmove(e){ if(inXR) return; let mine=false; for(const t of e.changedTouches){ const f=F[t.identifier]; if(!f) continue; mine=true; const dx=t.clientX-f.x, dy=t.clientY-f.y; f.x=t.clientX; f.y=t.clientY;
  if(!f.moved&&Math.hypot(f.x-f.x0,f.y-f.y0)>9) f.moved=true;
  if(f.zsx){ mouse('mousemove',t.clientX,t.clientY); continue; }
  if(f.moved&&!cinema()&&Object.keys(F).length===1) look(dx,dy); }
 if(mine){ e.preventDefault(); e.stopImmediatePropagation(); } }
function tend(e){ if(inXR) return; let mine=false; for(const t of e.changedTouches){ const f=F[t.identifier]; if(!f) continue; mine=true; delete F[t.identifier];
  if(f.zsx){ mouse('mouseup',t.clientX,t.clientY,window); if(!f.moved) mouse('click',t.clientX,t.clientY); continue; }
  if(e.type==='touchend'&&!f.moved&&e.timeStamp-f.t0<900) tap(t.clientX,t.clientY); }
 if(mine){ e.preventDefault(); e.stopImmediatePropagation(); } }
// Seite selbst: kein Pinch, kein Pull-to-Refresh, kein Doppeltipp-Zoom
['gesturestart','gesturechange'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{ if(e.touches.length>1||!e.target.closest||!e.target.closest('#zsh .p')) e.preventDefault(); },{passive:false});

// ---------- ?joy=1: virtueller Stick (Rückfall) ----------
let joy=[0,0];
function setupJoy(){ const j=document.getElementById('tc-joy'), k=j.querySelector('i'); let id=null, c=[0,0];
 j.addEventListener('touchstart',e=>{ e.preventDefault(); e.stopPropagation(); const t=e.changedTouches[0]; id=t.identifier; const r=j.getBoundingClientRect(); c=[r.left+r.width/2,r.top+r.height/2]; mv(t); },{passive:false});
 const mv=t=>{ let dx=(t.clientX-c[0])/55, dy=(t.clientY-c[1])/55; const m=Math.hypot(dx,dy); if(m>1){ dx/=m; dy/=m; } joy=[dx,dy]; k.style.transform=`translate(${dx*40}px,${dy*40}px)`; };
 j.addEventListener('touchmove',e=>{ e.preventDefault(); e.stopPropagation(); for(const t of e.changedTouches) if(t.identifier===id) mv(t); },{passive:false});
 const up=e=>{ e.preventDefault(); e.stopPropagation(); joy=[0,0]; k.style.transform=''; }; j.addEventListener('touchend',up,{passive:false}); j.addEventListener('touchcancel',up,{passive:false}); }
function joyTick(dt){ if(!joy[0]&&!joy[1]) return; if(Math.hypot(joy[0],joy[1])<0.15||cinema()) return; walk=null; const TH=T(); const q=new TH.Quaternion(); sc.camera.getWorldQuaternion(q);
 const f=new TH.Vector3(joy[0],0,joy[1]).applyQuaternion(q); f.y=0; if(f.lengthSq()<1e-6) return; f.normalize().multiplyScalar(Math.hypot(joy[0],joy[1])*1.5*dt); rig.position.add(f); if(window.__br&&__br.collide&&__br.group&&__br.group.visible) __br.collide(rig.position); }

// ---------- Leistung: Pixelratio deckeln ----------
function hidePhone(){ const n=document.getElementById('nokio'); if(!n||!n.object3D||!window.ZSINV||!ZSINV.where) return; if(ZSINV.where()==='none'){ n.object3D.visible=false; return; } const show=!(ZSINV.where()==='inv'&&!(ZSINV.isOpen&&ZSINV.isOpen())&&!phoneOut()); if(n.object3D.visible!==show) n.object3D.visible=show; }
// Ablegen-Knopf, große Nokio-Anzeige (Handy-Schirm scharf in 2D), Kino-Leinwand auf dem Handy groß (nur ohne VR)
let nkOn=false, cineFov=null;
function uiTick(){ ui.classList.toggle('hold',heldNow()||examining());
 const nk=document.getElementById('tc-nk'), N=window.NOKIO, on=!!(nk&&N&&N.canvas&&phoneOut());
 if(on){ const x=nk.getContext('2d'); x.imageSmoothingEnabled=false; x.drawImage(N.canvas,0,0,nk.width,nk.height); } if(on!==nkOn){ nkOn=on; if(nk) nk.style.display=on?'block':'none'; }
 const c=sc&&sc.camera; if(!c) return; const cin=cinema();
 if(cin&&cineFov==null){ let H=1.7, Rr=2.5, A=1.2; sc.object3D.traverse(o=>{ const g=o.geometry&&o.geometry.parameters; if(o.isMesh&&g&&g.openEnded&&g.radiusTop>2&&g.thetaLength&&o.parent&&o.parent.name==='arcCinema'&&g.radiusTop===2.5){ H=g.height; Rr=g.radiusTop; A=g.thetaLength; } });
  const asp=innerWidth/Math.max(1,innerHeight), tw=Math.tan(A/2)/0.88/asp, th=(H/2)/(Rr*Math.cos(A/2));   /* gekrümmt: Ecken liegen näher -> dort zählt die Höhe; Bild wird nie beschnitten */ cineFov=c.fov; c.fov=2*Math.atan(Math.max(tw,th))*180/Math.PI; c.updateProjectionMatrix(); }
 else if(!cin&&cineFov!=null){ c.fov=cineFov; cineFov=null; c.updateProjectionMatrix(); } }
let baseSetPR=null;
Z.applyQuality=function(){ if(!sc||!sc.renderer) return; const R=sc.renderer; const low=LS.get('zs_touch_lowq')==='1'; const cap=low?1.0:1.5;
 if(!baseSetPR){ baseSetPR=R.setPixelRatio.bind(R); R.setPixelRatio=p=>baseSetPR(inXR?p:Math.min(p,Z.cap||cap)); }
 Z.cap=cap; baseSetPR(Math.min(window.devicePixelRatio||1,cap)); if(sc.resize) sc.resize(); };

function attach(){ sc=document.querySelector('a-scene'); if(!sc) return; const go=()=>{ canvas=sc.canvas; camEl=sc.camera&&sc.camera.el; cam=camEl&&camEl.object3D; rig=(document.getElementById('rig')||{}).object3D||(cam&&cam.parent);
  invert=LS.get('zs_touch_invert')==='1'; Z.applyQuality();
  // A-Frame look-controls bekommt keine Touch-Gesten mehr (wir drehen selbst), Maus bleibt
  if(camEl&&camEl.components['look-controls']) { camEl.setAttribute('look-controls','touchEnabled',false); camEl.setAttribute('look-controls','magicWindowTrackingEnabled',false); const lc=camEl.components['look-controls']; if(lc&&lc.magicWindowObject) lc.magicWindowObject.quaternion.identity(); }
  let last=performance.now(); const loop=()=>{ const n=performance.now(), dt=Math.min(0.1,(n-last)/1000); last=n; if(!inXR&&rig){ hidePhone(); uiTick(); walkTick(dt); joyTick(dt); markTick(); ui.classList.toggle('cine',!!cinema()); } requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  sc.addEventListener('enter-vr',()=>{ inXR=true; if(cineFov!=null&&sc.camera){ sc.camera.fov=cineFov; cineFov=null; sc.camera.updateProjectionMatrix(); } { const nk=document.getElementById('tc-nk'); if(nk) nk.style.display='none'; nkOn=false; } ui.style.display='none'; walk=null; const n=document.getElementById('nokio'); if(n&&n.object3D) n.object3D.visible=true; });
  sc.addEventListener('exit-vr',()=>{ inXR=false; ui.style.display=''; Z.applyQuality(); }); };
 if(sc.hasLoaded) go(); else sc.addEventListener('loaded',go);
 addEventListener('storage',()=>{ invert=LS.get('zs_touch_invert')==='1'; });
 setInterval(()=>{ invert=LS.get('zs_touch_invert')==='1'; },1000); }
window.addEventListener('touchstart',tstart,{capture:true,passive:false});
window.addEventListener('touchend',()=>fs(),{capture:true,passive:true});
window.addEventListener('touchmove',tmove,{capture:true,passive:false});
window.addEventListener('touchend',tend,{capture:true,passive:false});
window.addEventListener('touchcancel',tend,{capture:true,passive:false});
// Android-Zurück-Taste (App): 'handled' = im Spiel erledigt, 'menu' = Menü geöffnet, 'exit' = Menü war offen → App in den Hintergrund
Z.androidBack=function(){ try{ const ip=document.getElementById('tc-inv-p');
 if(window.__zsCutSkip){ __zsCutSkip(); return 'handled'; }
 if(window.ZSHelp&&ZSHelp.isOpen()){ if(ZSHelp.view&&ZSHelp.view()!=='menu'){ ZSHelp.open('menu'); return 'handled'; } return 'exit'; }
 if((ip&&ip.style.display==='block')||cinema()||examining()||heldNow()){ back(); return 'handled'; }
 if(Z.onBack&&Z.onBack()) return 'handled';
 if(window.ZSHelp){ ZSHelp.open('menu'); return 'menu'; } return 'exit'; }catch(e){ return 'exit'; } };
Z.tap=tap; Z.dbg=()=>({walk:walk&&{p:walk.p,stop:walk.stop,n:walk.n,last:walk.last,exp:walk.exp},rig:rig&&rig.position.toArray(),cine:!!cinema(),ex:!!examining(),xr:inXR}); Z.look=look; Z.pick=pick; Z.walkTo=(x,z)=>walkTo(new (T().Vector3)(x,0,z),0.05);
domReady(()=>{ buildUI(); attach(); });
})();
