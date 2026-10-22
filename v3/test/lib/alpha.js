// Rewind V3 – Alpha-Ablauf. EINE Liste steuert die Reihenfolge: einfach Einträge umstellen.
// Jeder Raum bekommt eine Tür in der Welt (kein Leucht-Hotspot): anfassen, hindurchgehen oder mit Laser/Klick öffnen → nächster Raum.
// Zustand: localStorage 'zs_alpha_v1' {step} + URL ?alpha=1&step=n (URL hat Vorrang).
(function(){
// Untersuchen + versteckte Schlüssel (lib/zsx.js) – synchron mitladen
{ const me=document.currentScript&&document.currentScript.src; if(me&&!window.ZSMARA&&document.readyState==='loading') document.write('<script src="'+me.replace(/alpha\.js.*$/,'mara.js?v=1022z5')+'"><\/script>'); }
{ const me=document.currentScript&&document.currentScript.src; if(me&&!window.ZSX&&document.readyState==='loading') document.write('<script src="'+me.replace(/alpha\.js.*$/,'zsx.js?v=m1525')+'"><\/script><script src="'+me.replace(/alpha\.js.*$/,'nokio.js?v=1022z3')+'"><\/script>'); }
// Keine automatischen Steuerungs-Tafeln (Pete, 22.10.): die festen #hud-Kästen der Räume ausblenden; Hilfe nur über ☰ › Steuerung
{ const st=document.createElement('style'); st.textContent='#hud{display:none!important}'; (document.head||document.documentElement).appendChild(st); }
const STEPS=[ // Reihenfolge verbindlich laut zeitschleife_verzweigung.md 0.2 (Story-Bot)
 {id:'intro',      page:'alpha.html', title:'Intro'},
 {id:'backrooms',  page:'alpha.html', title:'Backrooms'},
 {id:'era1984',    page:'test/era1984.html',       title:'Kinderzimmer 1984',  door:{x:1.5, z:1.94, face:[1.5,0]}, key:{x:-1.3,z:-0.9}},
 {id:'wohnung',    page:'test/era_wohnung.html',   title:'Wohnung',            door:{x:42.42, z:1.55, face:[40,1.55], attach:'office', wood:true}}, // direkt nach dem Kinderzimmer; Ausgang im Büro (Ostwand), Tür hängt an OFF.group -> nur im Büro sichtbar
 {id:'era1984mall',page:'test/era1984mall.html',   title:'Mall 1984',          door:{x:1.9, z:2.3, face:[0,0]}, key:{x:-2.25,z:-0.55,y:0.52, hide:{type:'drawer', x:-2.55, z:0.45, ry:90, plate:'FUNDSACHEN', inNote:'Fundsache, Bank am Brunnen. Abgeholt: nie.'}}, keyNote:'Abgeschlossen. Was hier verloren geht, landet bei den Fundsachen. – M.'},
 {id:'arcade',     page:'test/era_arcade.html',    title:'Spielhalle 1984',    door:{x:1.9, z:2.3, face:[0,0]}, key:{x:1.25,z:-0.95}},
 {id:'pool',       page:'test/era_pool.html',      title:'Hallenbad',          door:{x:1.9, z:2.88, face:[1.9,0]}, key:{x:-1.6,z:0.8, hide:{type:'locker', x:-2.75, z:0.75, ry:90, num:37, inNote:'Fach 37. Seit Jahren nicht abgeholt.'}}, keyNote:'Abgeschlossen. Fach 37. Frag nicht, woher ich das weiß. – M.'},
 {id:'cornfield',  page:'test/era_cornfield.html', title:'Maisfeld',           door:{x:0.9, z:2.25, face:[0.9,0]}, key:{x:0.6,z:-1.15}},
 {id:'era1989',    page:'test/era1989.html',       title:'Ostberlin 1989',     door:{x:3.22, z:1.6, face:[0,1.6]}, key:{x:-2.2,z:0.6, hide:{type:'tin', x:-1.95, y:0.345, z:-1.05, ry:-20, cap:'Etwas klappert heraus.'}}, keyNote:'Abgeschlossen. Hier versteckt man Wichtiges im Kaffee. – M.'},
 {id:'era2041',    page:'test/era2041.html',       title:'Stadt 2041',         door:{x:3.22, z:2.0, face:[0,2.0]}, key:{x:2.2,z:-1.0}},
 {id:'apartment',  page:'test/era_apartment.html', title:'Apartment 2041',     door:{x:1.9, z:2.6, face:[1.9,0]}, key:{x:-1.3,z:-1.3, hide:{type:'drawer', dark:true, x:-1.0, z:-1.55, ry:0, inNote:'Ersatzschlüssel. Nicht für dich. – Hausverwaltung'}}, keyNote:'Abgeschlossen. Ersatzschlüssel? Schublade. Wie immer. – M.'},
 {id:'basket',     page:'test/basket.html',        title:'Hinterhof',          door:{x:-2.6,z:4.6, face:[0,2.2]}, key:{x:1.5,z:3.6}},
 {id:'kirmes',     page:'test/kirmes.html',        title:'Kirmes',             door:{x:-3.4,z:2.6, face:[0,0.4]}, key:{x:-1.2,z:1.6}},
 {id:'sim',        page:'test/sim.html',           title:'Simulator',          door:{x:14.3,z:4.9, face:[12,3.4]}, key:{x:11.0,z:4.4}},
 {id:'end',        page:'alpha.html', title:'Ende'} ];
// Abstecher (kein eigener Schritt): Tür in Raum 'from' -> Seite -> Tür zurück an dieselbe Stelle. Rückweg-Zone/Spawn in Weltkoordinaten der Zielseite.
const SIDES={ warteraum:{page:'test/era_warteraum.html', from:'backrooms', title:'Warteraum',
  exit:{x:0.75, z:2.5, w:1.0, n:[0,-1], h:2.2}, // NO-EXIT-Tür (Collider [0.17,1.33,2.45,2.55] in assets/warteraum/scene.json)
  spawn:{x:0.75, z:1.75, yaw:0} } };          // Ankunft vor der NO-EXIT-Tür, Blick in den Raum (-z)
const KEY='zs_alpha_v1', P=new URLSearchParams(location.search), inTest=/\/test\//.test(location.pathname), ROOT=inTest?'../':'';
const ls=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } };
const save=st=>{ if(st&&st.step!=null&&!st.id&&typeof STEPS!=='undefined'&&STEPS[st.step]) st=Object.assign({},st,{id:STEPS[st.step].id}); try{ localStorage.setItem(KEY,JSON.stringify(Object.assign(ls(),st,{t:Date.now()}))); }catch(e){} };
const on=P.get('alpha')==='1'||/alpha\.html$/.test(location.pathname);
// Spielstand: ab jetzt mit Raum-id (Reihenfolge darf sich ändern). Alte Stände nur mit Index -> über die damalige Liste auf die id abbilden.
const OLD_V1=['intro','backrooms','era1984','era1984mall','arcade','pool','cornfield','era1989','era2041','apartment','basket','kirmes','sim','end'], OLD_V2=OLD_V1.slice(0,8).concat(['wohnung'],OLD_V1.slice(8)); // V2 = 21.10. 15:50–17:45
const idxOf=id=>STEPS.findIndex(s=>s.id===id);
const savedStep=()=>{ const o=ls(); if(o.id&&idxOf(o.id)>=0) return idxOf(o.id); const n=o.step|0; const old=(o.t||0)>=1792590000000?OLD_V2:OLD_V1; const k=idxOf(old[n]); return k>=0?k:n; };
let step=P.has('step')?+P.get('step'):savedStep(); step=Math.max(0,Math.min(STEPS.length-1,step|0));
const url=i=>{ const s=STEPS[i]; return ROOT+s.page+'?alpha=1&step='+i+(s.page==='alpha.html'?'#'+s.id:''); };
function fadeOut(cb){
 // Weicher VHS-Rückspul (~0,5 s): nur Rauschen + Tracking am Rand, kein RGB-Split, kein Vollbild-Strobo (Quest-tauglich).
 let f=document.getElementById('zsaFade'); if(!f){ f=document.createElement('div'); f.id='zsaFade'; f.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:99'; document.body.appendChild(f); }
 let cv=document.getElementById('zsaVhs'); if(!cv){ cv=document.createElement('canvas'); cv.id='zsaVhs'; cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100;opacity:0'; document.body.appendChild(cv); }
 const W=Math.min(640,innerWidth|0)||640, H=Math.min(360,innerHeight|0)||360; cv.width=W; cv.height=H; const x=cv.getContext('2d');
 try{ const ac=(window.__zsaAC)||(window.__zsaAC=new (window.AudioContext||window.webkitAudioContext)()); if(ac){ try{ac.resume();}catch(e){} const t=ac.currentTime, o=ac.createOscillator(), g=ac.createGain(), fl=ac.createBiquadFilter(); o.type='sawtooth'; o.frequency.setValueAtTime(320,t); o.frequency.exponentialRampToValueAtTime(1400,t+0.45); fl.type='bandpass'; fl.frequency.value=1100; fl.Q.value=0.8; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.045,t+0.04); g.gain.linearRampToValueAtTime(0,t+0.5); o.connect(fl); fl.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+0.52); } }catch(e){}
 const t0=performance.now(), DUR=520;
 const frame=now=>{ const u=Math.min(1,(now-t0)/DUR), a=Math.sin(Math.PI*u); f.style.opacity=String(0.55*u+0.35*u*u); cv.style.opacity=String(0.55+0.35*a);
  x.fillStyle='#050308'; x.globalAlpha=0.55+0.35*u; x.fillRect(0,0,W,H);
  x.globalAlpha=0.07*a; x.fillStyle='#ccc'; for(let i=0;i<110;i++) x.fillRect(Math.random()*W,Math.random()*H,1.5,1);
  for(let i=0;i<2;i++){ const y=H-(((u*2.2+i*0.4)%1)*H); x.globalAlpha=0.1*a; x.fillStyle='#fff'; x.fillRect(0,y,W,1); x.globalAlpha=0.05*a; x.fillRect(0,y,W,3+2*i); }
  x.globalAlpha=0.04*a; x.fillStyle='#000'; for(let y=0;y<H;y+=5) x.fillRect(0,y,W,1);
  if(u<1&&!fin) requestAnimationFrame(frame); else finish(); };
 let fin=false; const finish=()=>{ if(fin) return; fin=true; f.style.opacity='1'; cv.style.opacity='0'; cb&&cb(); };
 setTimeout(finish,DUR+350); // falls rAF stockt (schwere Szene, Hintergrund-Tab): trotzdem weiter
 requestAnimationFrame(frame); }
// ---------- Zwischenszenen (Grok-Clips) – EINE Tabelle. Schlüssel = id des ZIEL-Raums (siehe STEPS); läuft beim Weg nach vorn (Tür → nächster Raum).
// Neuer Clip: clips/zw/zw_<name>.mp4 (1280×720) + zw_<name>_m.mp4 (960×540, Handy) ablegen und hier eine Zeile eintragen. Fertig.
// ?nocut=1 schaltet alle Zwischenszenen ab (Tests). In VR: gebogene Leinwand fest in der Welt, Boden y=0. Am Handy/PC: Vollbild-Ebene.
const CUTS={
 // vor einem Raum (Schlüssel = Raum-id), läuft beim Weg nach vorn
 era1984:    {f:'zw_era1984'},     // VHS-Kassette rein → Kinderzimmer 1984 (Grok V1b)
 era1984mall:{f:'zw_mall'},        // geschlossene Mall 1984 nachts, ausgedachte Ladennamen (W1b)
 pool:       {f:'zw_pool'},        // leeres Hallenbad mit Schwimmring (V3a)
 cornfield:  {f:'zw_cornfield'},   // Maisfeld in der Dämmerung, Vogelscheuche (V4b)
 era1989:    {f:'zw_era1989'},     // Ostberlin 1989 nachts, Kerzen, Mauer (W3b)
 era2041:    {f:'zw_era2041'},     // regennasse Stadt 2041 (V5b)
 apartment:  {f:'zw_apartment'},   // Wohnung 2041, Haushaltsroboter (W5b)
 basket:     {f:'zw_basket'},      // Hinterhof im Regen, Katze (W6b)
 kirmes:     {f:'zw_kirmes'},      // verlassene Kirmes (V6a)
 sim:        {f:'zw_sim'},         // Simulator-Kapsel mit Countdown (V8b)
 end:        {f:'zw_end'},         // Zeitstrudel → Kinderzimmer im Morgengrauen (W7a)
 // besondere Momente
 rewind:     {f:'zw_rewind'},      // Zurückspulen: Ende-Tür → Schleife beginnt von vorn (W8a)
 warteraum_entry:null,             // Abstecher Warteraum (kleine Backrooms-Tür) – Platz frei, Ersatz-Clip kommt (W4 abgelehnt)
 haengematte:{f:'zw_haengematte'}, // Hängematten-Falle „einschlafen“ (W2a) – Falle gibt es noch nicht: ZSA.playCut(ZSA.CUTS.haengematte)
};
const CUT_V='1022b';
function playCut(c){ return new Promise(done=>{ const sc=document.querySelector('a-scene'), R=sc&&sc.renderer, xr=!!(R&&R.xr&&R.xr.isPresenting);
 const mob=!xr&&(!!(window.ZSTouch&&ZSTouch.active)||Math.max(screen.width,screen.height)<1000);
 const v=document.createElement('video'); v.src=ROOT+'clips/zw/'+c.f+(mob?'_m':'')+'.mp4?v='+CUT_V; v.playsInline=true; v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline',''); v.preload='auto'; v.crossOrigin='anonymous'; v.disablePictureInPicture=true;
 window.__zsCutV=v; const t0=performance.now(); let fin=false, ov=null, hint=null, G=null, mats=[], vt=null, tick=null; const offs=[];
 const on=(el,ev,fn,o)=>{ el.addEventListener(ev,fn,o); offs.push(()=>el.removeEventListener(ev,fn,o)); };
 const finish=how=>{ if(fin) return true; fin=true; window.__zsCutHow=(typeof how==='string'?how:'skip')+'@'+v.currentTime.toFixed(2); window.__zsCutSkip=null; offs.forEach(f=>f()); const ts=performance.now(), a0=v.muted?0:v.volume;
  const fo=()=>{ const k=Math.min(1,(performance.now()-ts)/380); try{ v.volume=a0*(1-k); }catch(e){} if(ov) ov.querySelector('video').style.opacity=String(1-k); if(G&&mats[2]) mats[2].opacity=1-k; if(k<1) requestAnimationFrame(fo); else { try{ v.pause(); }catch(e){} if(tick) tick.dead=true; if(G){ G.parent&&G.parent.remove(G); G=null; } done(); } }; fo(); return true; };
 window.__zsCutSkip=finish;
 const skip=()=>{ if(performance.now()-t0>600) finish(); };
 const start=()=>{ const p=v.play(); if(p&&p.catch) p.catch(()=>{ v.muted=true; if(hint) hint.style.display=''; v.play().catch(()=>finish('noplay')); }); };
 if(!xr){ // Handy/PC: ganze Fläche, dunkler Rand (nicht schwarz), Überspringen-Knopf
  ov=document.createElement('div'); ov.id='zsCut'; ov.style.cssText='position:fixed;inset:0;z-index:200;background:#0b0907;opacity:0;transition:opacity .45s ease;touch-action:none;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none';
  const ar=innerWidth/Math.max(1,innerHeight); v.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:'+(ar>1.55&&ar<2.35?'cover':'contain')+';background:#0b0907;transition:none';
  const vig=document.createElement('div'); vig.style.cssText='position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 60%,rgba(8,6,4,.55) 100%)';
  const sk=document.createElement('div'); sk.id='zsCutSkip'; sk.innerHTML='Überspringen &#9656;&#9656;'+(mob?'':' <small style="opacity:.6;margin-left:.5em">B / Esc</small>');
  sk.style.cssText='position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));font:600 14px/1 ZSRaj,"DejaVu Sans Condensed",sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#d8c9a6;background:rgba(14,11,8,.55);border:1px solid rgba(216,201,166,.28);padding:11px 16px;border-radius:3px;opacity:.85';
  hint=document.createElement('div'); hint.textContent='🔇 Antippen für Ton'; hint.style.cssText='display:none;position:absolute;left:16px;top:14px;font:600 13px/1 ZSRaj,sans-serif;letter-spacing:.15em;color:#d8c9a6;background:rgba(14,11,8,.55);padding:8px 12px;border-radius:3px';
  ov.append(v,vig,sk,hint); document.body.appendChild(ov); requestAnimationFrame(()=>{ ov.style.opacity='1'; });
  let wasMuted=false; on(ov,'pointerdown',e=>{ wasMuted=v.muted; e.stopPropagation(); });
  on(sk,'pointerup',e=>{ e.stopPropagation(); finish(); });
  let lastUp=0; const up=e=>{ e.stopPropagation(); const n=performance.now(); if(n-lastUp<350) return; lastUp=n; if(wasMuted){ wasMuted=false; v.muted=false; hint.style.display='none'; return; } skip(); };
  on(ov,'pointerup',up); on(ov,'touchend',e=>{ if(e.target===sk||sk.contains(e.target)){ e.stopPropagation(); finish(); return; } up(e); },{passive:true}); on(ov,'touchstart',e=>{ wasMuted=v.muted; e.stopPropagation(); },{passive:true});
  // Raum dahinter nicht mehr rendern (Handy: Video läuft flüssig, Akku); danach wird ohnehin die nächste Seite geladen
  setTimeout(()=>{ if(!fin&&sc&&sc.renderer&&!(sc.renderer.xr&&sc.renderer.xr.isPresenting)){ try{ sc.renderer.setAnimationLoop(null); }catch(e){} } },550);
  on(ov,'click',e=>e.stopPropagation());
  on(window,'keydown',e=>{ if(/^(b|B|Escape|Enter| |Backspace)$/.test(e.key)){ e.preventDefault(); e.stopPropagation(); finish(); } },true);
 } else { // VR: Kuppel + gebogene Leinwand, einmal in Blickrichtung in die Welt gesetzt (nicht am Kopf), Boden y=0
  const T=THREE, S=sc.object3D, cam=sc.camera, hp=new T.Vector3(), q=new T.Quaternion(); cam.getWorldPosition(hp); cam.getWorldQuaternion(q); const f=new T.Vector3(0,0,-1).applyQuaternion(q); f.y=0; if(f.lengthSq()<1e-4) f.set(0,0,-1); f.normalize();
  G=new T.Group(); G.position.set(hp.x,0,hp.z); G.rotation.y=Math.atan2(-f.x,-f.z);
  const mk=(geo,mat,ro)=>{ mat.transparent=true; mat.opacity=0; mat.depthTest=false; mat.depthWrite=false; mat.fog=false; mat.toneMapped=false; const m=new T.Mesh(geo,mat); m.renderOrder=ro; m.frustumCulled=false; G.add(m); mats.push(mat); return m; };
  const dome=mk(new T.SphereGeometry(9,32,16),new T.MeshBasicMaterial({color:0x0b0907,side:T.BackSide}),990); dome.position.y=1.6;
  const fl=mk(new T.CircleGeometry(9,48),new T.MeshBasicMaterial({color:0x17120c}),991); fl.rotation.x=-Math.PI/2; fl.position.y=0.002;
  vt=new T.VideoTexture(v); vt.colorSpace=T.SRGBColorSpace;
  const SR=4.0, TOT=70*Math.PI/180, SH=SR*TOT*9/16; const scr=mk(new T.CylinderGeometry(SR,SR,SH,96,1,true,Math.PI-TOT/2,TOT),new T.MeshBasicMaterial({map:vt,side:T.DoubleSide}),992); scr.scale.x=-1; scr.position.y=1.6;
  S.add(G); const tf=performance.now(); tick=()=>{ if(tick.dead) return; const k=Math.min(1,(performance.now()-tf)/600); mats[0].opacity=mats[1].opacity=k; if(!fin) mats[2].opacity=k; if(!v.paused&&v.readyState>=2) vt.needsUpdate=true; };
  (window.__zsaSteps=window.__zsaSteps||[]).push(tick); if(window.AFRAME&&!AFRAME.components['zsa-tick']) AFRAME.registerComponent('zsa-tick',{tick(){ (window.__zsaSteps||[]).forEach(fn=>fn()); }}); sc.setAttribute('zsa-tick','');
  [0,1].forEach(i=>on(R.xr.getController(i),'selectstart',skip));
  ['bbuttondown','abuttondown','ybuttondown','xbuttondown'].forEach(ev=>on(sc,ev,skip));
 }
 on(v,'ended',()=>finish('ended')); on(v,'error',()=>setTimeout(()=>finish('error'),400));
 // Sicherheitsnetze: hängt das Video (kein Fortschritt) → weiter; nie länger als Clip + 4 s
 setTimeout(()=>{ if(!fin&&v.currentTime<0.2) finish('stall'); },9000); setTimeout(()=>finish('cap'),((isFinite(v.duration)&&v.duration)||15.5)*1000+5500);
 on(v,'loadedmetadata',()=>{ setTimeout(()=>finish('cap'),v.duration*1000+4500); });
 start(); }); }
function goStep(i){ i=Math.max(0,Math.min(STEPS.length-1,i)); save({step:i}); const c=i===step+1?CUTS[STEPS[i].id]:(i===0&&STEPS[step].id==='end'?CUTS.rewind:null);
 if(c&&!P.has('nocut')&&!window.__zsCutOn){ window.__zsCutOn=true; playCut(c).then(()=>fadeOut(()=>{ location.href=url(i); })); return; }
 fadeOut(()=>{ location.href=url(i); }); }
const side=P.get('side'), SD=SIDES[side]||null;
function goSide(id){ const d=SIDES[id]; if(!d) return; save({step,side:id}); const go=()=>fadeOut(()=>{ location.href=ROOT+d.page+'?alpha=1&step='+step+'&side='+id; }); const c=CUTS[id+'_entry'];
 if(c&&!P.has('nocut')&&!window.__zsCutOn){ window.__zsCutOn=true; playCut(c).then(go); } else go(); }
function backFromSide(){ save({step,side:null}); fadeOut(()=>{ location.href=url(step).replace('#','&from='+side+'#'); }); }
window.ZSA={on,STEPS,SIDES,side,goSide,backFromSide,get step(){return step;},cur:()=>STEPS[step],goStep,next:()=>goStep(step+1),reset:()=>{ save({step:0}); try{ localStorage.removeItem('zs_alpha_nokio'); }catch(e){} /* neue Schleife: Handy liegt wieder im Kinderzimmer */ },url,CUTS,playCut};
if(!on) return;
save({step});
// Quest: nach Seitenwechsel ggf. direkt wieder in VR (WebXR-Navigation)
if(navigator.xr&&navigator.xr.addEventListener) navigator.xr.addEventListener('sessiongranted',()=>{ const sc=document.querySelector('a-scene'); if(sc){ const go=()=>sc.enterVR(); sc.hasLoaded?go():sc.addEventListener('loaded',go); } });
// kleine Desktop-Anzeige (nur DOM, in VR unsichtbar)
document.addEventListener('DOMContentLoaded',()=>{ const d=document.createElement('div'); d.id='zsaHud'; d.style.cssText='position:fixed;right:12px;bottom:12px;z-index:30;font:600 12px sans-serif;color:#c9b89a;background:rgba(0,0,0,.45);padding:5px 9px;border-radius:6px;letter-spacing:.5px';
 d.textContent='ALPHA · '+step+'/'+(STEPS.length-1)+' · '+(SD?SD.title+' (Abstecher)':STEPS[step].title); document.body.appendChild(d); });
// ---------- Tür in der Welt (Holz-PBR, Zarge, abgegriffene Messingklinke, Lichtspalt unten), optional abgeschlossen bis der Schlüssel gefunden ist
const AC=()=>{ try{ return window.__zsaAC||(window.__zsaAC=new (window.AudioContext||window.webkitAudioContext)()); }catch(e){ return null; } };
const noiseSnd=(dur,f,q,vol,shape)=>{ const ac=AC(); if(!ac) return; const n=Math.floor(ac.sampleRate*dur), b=ac.createBuffer(1,n,ac.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++){ const k=i/n; d[i]=(Math.random()*2-1)*vol*(shape?shape(k,i):Math.sin(Math.PI*k)); } const s=ac.createBufferSource(); s.buffer=b; const fl=ac.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=f; fl.Q.value=q; s.connect(fl); fl.connect(ac.destination); s.start(); };
const tone=(f,dur,vol)=>{ const ac=AC(); if(!ac) return; const o=ac.createOscillator(), g=ac.createGain(); o.frequency.value=f; o.type='sine'; g.gain.setValueAtTime(vol,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+dur); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime+dur); };
const SND={ creak:()=>noiseSnd(0.7,650,4,0.28,(k,i)=>Math.sin(Math.PI*k)*(0.55+0.45*Math.sin(i*0.004+Math.sin(i*0.0009)*6))),
 rattle:()=>noiseSnd(0.35,1800,2,0.3,(k,i)=>(Math.sin(i*0.02)>0.6?1:0.15)*(1-k)), click:()=>{ noiseSnd(0.06,3200,3,0.6,k=>1-k); setTimeout(()=>noiseSnd(0.05,2400,3,0.5,k=>1-k),90); },
 chime:()=>{ tone(1318,0.9,0.07); setTimeout(()=>tone(1760,0.8,0.05),70); noiseSnd(0.12,5200,6,0.25,k=>1-k); } };
window.zsaSND=SND;
const TL=()=>window.__zsaTL||(window.__zsaTL=new THREE.TextureLoader());
function woodMat(color,rep){ const T=THREE, m=new T.MeshStandardMaterial({color,roughness:0.7,metalness:0}); const b=ROOT+'assets/tex/ph/wood_table_001_';
 const L=(k,f)=>TL().load(b+k+'.jpg',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep[0],rep[1]); f(t); m.needsUpdate=true; });
 L('diff',t=>{ t.colorSpace=T.SRGBColorSpace; m.map=t; }); L('rough',t=>m.roughnessMap=t); L('nor_gl',t=>{ m.normalMap=t; m.normalScale.set(0.8,0.8); }); return m; }
// verwitterter Zettel (Handschrift, Klebestreifen) – statt HUD-Text
// abgenutzter Lack (Lackputz-Textur + Schmutz/Abrieb in Canvas gemalt): Blatt, Füllungen, Zarge
function paintMat(tint,rep,grime){ const T=THREE, m=new T.MeshStandardMaterial({color:0xffffff,roughness:0.88,metalness:0}); const b=ROOT+'assets/tex/kirmes/Painted/PaintedPlaster017_1K-JPG_';
 TL().load(b+'Color.jpg',t=>{ const img=t.image, c=document.createElement('canvas'); c.width=512; c.height=1024; const x=c.getContext('2d'); x.drawImage(img,0,0,512,1024);
  x.globalCompositeOperation='multiply'; x.fillStyle=tint; x.fillRect(0,0,512,1024); x.globalCompositeOperation='source-over';
  // Nikotin-Vergilbung (oben stärker), fleckig
  { const ny=x.createLinearGradient(0,0,0,1024); ny.addColorStop(0,'rgba(120,88,30,0.32)'); ny.addColorStop(1,'rgba(90,70,30,0.12)'); x.fillStyle=ny; x.fillRect(0,0,512,1024);
   for(let i=0;i<22;i++){ const rx=Math.random()*512, ry=Math.random()*1024, r=30+Math.random()*120; const s=x.createRadialGradient(rx,ry,0,rx,ry,r); s.addColorStop(0,'rgba(80,58,24,'+(0.08+Math.random()*0.12)+')'); s.addColorStop(1,'rgba(80,58,24,0)'); x.fillStyle=s; x.fillRect(rx-r,ry-r,2*r,2*r); } }
  if(grime){ let gr=x.createLinearGradient(0,1024,0,640); gr.addColorStop(0,'rgba(36,26,14,0.75)'); gr.addColorStop(1,'rgba(36,26,14,0)'); x.fillStyle=gr; x.fillRect(0,640,512,384); // Fußtritte unten
   for(let i=0;i<9;i++){ const rx=60+Math.random()*390, ry=900+Math.random()*110; const s=x.createRadialGradient(rx,ry,0,rx,ry,30+Math.random()*30); s.addColorStop(0,'rgba(25,18,10,0.45)'); s.addColorStop(1,'rgba(25,18,10,0)'); x.fillStyle=s; x.fillRect(rx-60,ry-60,120,120); }
   for(let k=0;k<3;k++){ const h=x.createRadialGradient(455,525,4,455,525,70+k*45); h.addColorStop(0,'rgba(28,20,10,0.55)'); h.addColorStop(1,'rgba(28,20,10,0)'); x.fillStyle=h; x.fillRect(300,330,212,400); } // Griffspur
   for(let i=0;i<40;i++){ x.fillStyle='rgba(22,16,9,'+(0.1+Math.random()*0.2)+')'; x.beginPath(); x.ellipse(400+Math.random()*100,440+Math.random()*180,2+Math.random()*7,1+Math.random()*4,Math.random()*3,0,7); x.fill(); } // Fingerabdrücke
   for(let i=0;i<500;i++){ x.fillStyle='rgba(30,22,12,'+(Math.random()*0.25)+')'; const r=Math.random()*2.5; x.fillRect(Math.random()*512,Math.random()*1024,r,r); }
   for(let i=0;i<55;i++){ const sx=Math.random()*512, sy=Math.random()*1024, dk=Math.random()<0.6; x.strokeStyle=dk?'rgba(40,30,18,0.45)':'rgba(200,185,150,0.22)'; x.lineWidth=0.6+Math.random()*1.2; x.beginPath(); x.moveTo(sx,sy); x.lineTo(sx+Math.random()*70-35,sy+Math.random()*24-12); x.stroke(); } // Kratzer
   for(let i=0;i<4;i++){ x.strokeStyle='rgba(30,22,14,0.3)'; x.lineWidth=1; const sx=Math.random()*512; x.beginPath(); x.moveTo(sx,200+Math.random()*300); x.lineTo(sx+Math.random()*6-3,500+Math.random()*400); x.stroke(); } // Laufspuren
  }
  // abgeplatzte Kanten: dunkler Untergrund durchscheinend
  for(let i=0;i<(grime?26:12);i++){ const left=Math.random()<0.5, ex=left?Math.random()*14:512-Math.random()*14, ey=Math.random()*1024, ey2=Math.random()<0.25?(Math.random()<0.5?Math.random()*14:1010+Math.random()*14):null;
   const cx=ey2==null?ex:Math.random()*512, cy=ey2==null?ey:ey2; x.fillStyle='rgba(58,44,30,0.9)'; x.beginPath(); const n=7, R=3+Math.random()*9; for(let j=0;j<n;j++){ const an=j/n*6.283, rr=R*(0.5+Math.random()*0.6); x.lineTo(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr*1.4); } x.closePath(); x.fill();
   x.strokeStyle='rgba(225,210,170,0.25)'; x.lineWidth=0.8; x.stroke(); }
  const e=x.createLinearGradient(0,0,512,0); e.addColorStop(0,'rgba(0,0,0,0.25)'); e.addColorStop(0.06,'rgba(0,0,0,0)'); e.addColorStop(0.94,'rgba(0,0,0,0)'); e.addColorStop(1,'rgba(0,0,0,0.25)'); x.fillStyle=e; x.fillRect(0,0,512,1024);
  const ct=new T.CanvasTexture(c); ct.colorSpace=T.SRGBColorSpace; ct.wrapS=ct.wrapT=T.RepeatWrapping; ct.repeat.set(rep[0],rep[1]); m.map=ct; m.needsUpdate=true; });
 TL().load(b+'Roughness.jpg',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep[0],rep[1]); m.roughnessMap=t; m.needsUpdate=true; });
 TL().load(b+'NormalGL.jpg',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep[0],rep[1]); m.normalMap=t; m.normalScale.set(0.5,0.5); m.needsUpdate=true; }); return m; }
window.zsaNote=function(text,w,h){ const T=THREE, c=document.createElement('canvas'); c.width=512; c.height=Math.round(512*(h||0.15)/(w||0.21)); const x=c.getContext('2d'), H=c.height;
 const g=x.createLinearGradient(0,0,512,H); g.addColorStop(0,'#d9cfb4'); g.addColorStop(1,'#bfb18f'); x.fillStyle=g; x.fillRect(0,0,512,H);
 for(let i=0;i<14;i++){ const rx=Math.random()*512, ry=Math.random()*H, r=20+Math.random()*80; const s=x.createRadialGradient(rx,ry,0,rx,ry,r); s.addColorStop(0,'rgba(120,95,50,0.16)'); s.addColorStop(1,'rgba(120,95,50,0)'); x.fillStyle=s; x.fillRect(0,0,512,H); }
 x.fillStyle='rgba(60,50,30,0.25)'; for(let y=46;y<H;y+=40) x.fillRect(16,y,480,1.2);
 x.fillStyle='#2a2440'; x.font='italic 32px "Segoe Print","Bradley Hand","Comic Sans MS",cursive'; const words=text.split(' '); let line='', y=58; for(const wd of words){ if(x.measureText(line+wd).width>460){ x.fillText(line,26,y); line=''; y+=40; } line+=wd+' '; } x.fillText(line,26,y);
 x.fillStyle='rgba(235,230,200,0.55)'; x.save(); x.translate(256,6); x.rotate(-0.04); x.fillRect(-60,-8,120,26); x.restore();
 const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; const m=new T.Mesh(new T.PlaneGeometry(w||0.21,h||0.15),new T.MeshStandardMaterial({map:t,roughness:0.95,side:T.DoubleSide})); m.rotation.z=(Math.random()-0.5)*0.08; return m; };
window.zsaDoor=function(sceneEl,cfg,onOpen){ const T=THREE, S=sceneEl.object3D; const g=new T.Group(); g.position.set(cfg.x,0,cfg.z);
 const f=cfg.face||[0,0]; g.rotation.y=Math.atan2(f[0]-cfg.x,f[1]-cfg.z); S.add(g);
 const wood=cfg.wood?woodMat(0x9a8b78,[1,2]):paintMat('#9a8850',[1,1],true), woodP=cfg.wood?woodMat(0x7e705f,[1,1]):paintMat('#887645',[1,1],true), frameM=cfg.wood?woodMat(0x5a4c3e,[0.3,2]):paintMat('#6a5c3c',[0.2,1],false);
 const brass=new T.MeshStandardMaterial({color:0x6e5532,roughness:0.62,metalness:0.8}), dark=new T.MeshStandardMaterial({color:0x080706,roughness:1});
 const add=(m,x,y,z,p)=>{ m.position.set(x,y,z); m.castShadow=m.receiveShadow=true; (p||g).add(m); return m; };
 const bx=(w,h,d,m,x,y,z,p)=>add(new T.Mesh(new T.BoxGeometry(w,h,d),m),x,y,z,p);
 // Zarge + Bekleidung (Architrave)
 bx(0.05,2.1,0.14,frameM,-0.475,1.05,0); bx(0.05,2.1,0.14,frameM,0.475,1.05,0); bx(1.0,0.05,0.14,frameM,0,2.125,0);
 bx(0.075,2.2,0.022,frameM,-0.5375,1.1,0.08); bx(0.075,2.2,0.022,frameM,0.5375,1.1,0.08); bx(1.15,0.08,0.022,frameM,0,2.19,0.08); bx(1.17,0.02,0.035,frameM,0,2.24,0.085);
 bx(0.07,2.2,0.022,frameM,-0.5375,1.1,-0.08); bx(0.07,2.2,0.022,frameM,0.5375,1.1,-0.08); bx(1.15,0.08,0.022,frameM,0,2.19,-0.08);
 bx(0.96,0.012,0.16,frameM,0,0.006,0); // Schwelle
 // Dahinter: Dunkel mit warmem Restlicht (nur durch Spalt/geöffnete Tür sichtbar)
 const inner=new T.Mesh(new T.BoxGeometry(0.9,2.1,0.7),new T.MeshBasicMaterial({color:0x0b0806,side:T.BackSide})); inner.position.set(0,1.05,-0.42); g.add(inner);
 const glowP=new T.Mesh(new T.PlaneGeometry(0.88,2.08),new T.MeshBasicMaterial({color:0x6a4420,transparent:true,opacity:0.3,toneMapped:false,fog:false})); glowP.position.set(0,1.05,-0.75); g.add(glowP);
 // Türblatt an Scharnier
 const hinge=new T.Group(); hinge.position.set(-0.445,0,0.0); g.add(hinge);
 const leaf=bx(0.885,2.075,0.042,wood,0.4425,1.045,0,hinge);
 const rr=(w,h,r)=>{ const s=new T.Shape(); s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2); s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r); s.lineTo(w/2,h/2-r); s.quadraticCurveTo(w/2,h/2,w/2-r,h/2); s.lineTo(-w/2+r,h/2); s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r); s.lineTo(-w/2,-h/2+r); s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2); return s; };
 [[1.52,0.74],[0.6,0.66]].forEach(([y,h])=>[1,-1].forEach(sd=>{ const pg=new T.ExtrudeGeometry(rr(0.6,h,0.02),{depth:0.006,bevelEnabled:true,bevelThickness:0.008,bevelSize:0.022,bevelSegments:2,curveSegments:4}); const pm=new T.Mesh(pg,woodP); pm.position.set(0.4425,y,sd*0.021); if(sd<0) pm.rotation.y=Math.PI; pm.castShadow=true; hinge.add(pm); }));
 // Klinke: Rosette, Hebel, Schlüsselschild (vorne + hinten)
 const knobW=new T.Vector3(); const handleG=new T.Group(); handleG.position.set(0.8,1.0,0); hinge.add(handleG);
 [1,-1].forEach(sd=>{ const ro=add(new T.Mesh(new T.CylinderGeometry(0.027,0.03,0.012,24),brass),0,0,sd*0.027,handleG); ro.rotation.x=Math.PI/2;
  const neck=add(new T.Mesh(new T.CylinderGeometry(0.009,0.009,0.05,12),brass),0,0,sd*0.05,handleG); neck.rotation.x=Math.PI/2;
  const lev=add(new T.Mesh(new T.CylinderGeometry(0.0095,0.011,0.12,12),brass),-0.055,0,sd*0.072,handleG); lev.rotation.z=Math.PI/2;
  const end=add(new T.Mesh(new T.SphereGeometry(0.012,12,8),brass),-0.115,0,sd*0.072,handleG);
  const es=bx(0.03,0.075,0.006,brass,0,-0.075,sd*0.024,handleG); const kh=bx(0.007,0.02,0.002,dark,0,-0.08,sd*0.0275,handleG); });
 const knob=handleG;
 // Lichtspalt unter der Tür + Lichtfächer auf dem Boden
 const gapM=new T.MeshBasicMaterial({color:0xffb060,toneMapped:false,transparent:true,opacity:0.55,fog:false}); const gap=new T.Mesh(new T.PlaneGeometry(0.86,0.01),gapM); gap.position.set(0,0.017,0.03); g.add(gap);
 const sc2=document.createElement('canvas'); sc2.width=128; sc2.height=64; const sx=sc2.getContext('2d'); const sg=sx.createRadialGradient(64,0,2,64,0,80); sg.addColorStop(0,'rgba(255,180,96,0.6)'); sg.addColorStop(1,'rgba(255,180,96,0)'); sx.fillStyle=sg; sx.fillRect(0,0,128,64);
 const spillM=new T.MeshBasicMaterial({map:new T.CanvasTexture(sc2),transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0.45,fog:false}); const spill=new T.Mesh(new T.PlaneGeometry(1.1,0.55),spillM); spill.rotation.x=-Math.PI/2; spill.position.set(0,0.008,0.33); g.add(spill);
 { const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); const gr=x.createRadialGradient(64,64,4,64,64,62); gr.addColorStop(0,'rgba(0,0,0,0.75)'); gr.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=gr; x.fillRect(0,0,128,128);
  const sh=new T.Mesh(new T.PlaneGeometry(1.9,1.0),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false})); sh.rotation.x=-Math.PI/2; sh.position.y=0.004; g.add(sh); }
 // kleine Türlampe (echte Lichtquelle, kein Hotspot)
 const hous=add(new T.Mesh(new T.CylinderGeometry(0.06,0.09,0.07,18,1,true),new T.MeshStandardMaterial({color:0x1c1a16,metalness:0.7,roughness:0.45,side:T.DoubleSide})),0,2.42,0.16);
 bx(0.025,0.025,0.12,frameM,0,2.46,0.1); const bulb=add(new T.Mesh(new T.SphereGeometry(0.024,10,8),new T.MeshBasicMaterial({color:0xc89a60,toneMapped:false})),0,2.4,0.16);
 const DL=new T.PointLight(0xffc88a,cfg.light==null?0.38:cfg.light,3.4,2); DL.position.set(0,2.3,0.35); g.add(DL);
 const L=new T.PointLight(0xffb070,0.0,2.2,2); L.position.set(0.2,1.3,0.4); g.add(L);
 if(cfg.note){ const n=zsaNote(cfg.note,0.2,0.14); n.position.set(0.44,1.5,0.05); hinge.add(n); }
 let locked=!!cfg.locked, opened=false, t0=0, lastRattle=0, shake=0;
 const setAjar=()=>{ hinge.rotation.y=locked?0:-0.14; gapM.opacity=locked?0.45:0.7; };
 setAjar();
 const unlock=()=>{ if(!locked) return; locked=false; SND.click(); setTimeout(setAjar,150); };
 const open=()=>{ if(opened) return; if(locked){ const n=performance.now(); if(n-lastRattle>1200){ lastRattle=n; shake=n; SND.rattle(); } return; } opened=true; t0=performance.now(); SND.creak(); setTimeout(()=>onOpen&&onOpen(),650); };
 const head=new T.Vector3(), hp=new T.Vector3(), loc=new T.Vector3();
 const R=sceneEl.renderer;
 const hits=[leaf,inner,glowP];
 [0,1].forEach(i=>{ const c=R.xr.getController(i); c.addEventListener('selectstart',()=>{ if(zsaRay(sceneEl,c).intersectObjects(hits,true).length) open(); }); });
 sceneEl.canvas&&sceneEl.canvas.addEventListener('click',e=>{ if(R.xr.isPresenting||(window.ZSX&&ZSX.busy())) return; if(zsaMouseRay(sceneEl,e).intersectObjects(hits,true).length) open(); });
 let inside=false;
 const step=()=>{ const now=performance.now();
  if(opened){ const k=Math.min(1,(now-t0)/600); hinge.rotation.y=-0.14-1.15*k*k*(3-2*k); L.intensity=1.4*k; glowP.material.opacity=0.3+0.5*k; return; }
  if(shake&&now-shake<350){ hinge.rotation.y=(locked?0:-0.14)+Math.sin((now-shake)*0.09)*0.012*(1-(now-shake)/350); }
  else if(!locked) hinge.rotation.y=-0.14+0.012*Math.sin(now*0.0011);
  const cam=sceneEl.camera; if(!cam) return; cam.getWorldPosition(head);
  knob.getWorldPosition(knobW); loc.copy(head); g.worldToLocal(loc); const inDoor=Math.abs(loc.x)<0.45&&loc.z<(cfg.reach||0.25)&&loc.z>-0.5; if(inDoor&&!inside){ inside=true; return open(); } if(!inDoor) inside=false;
  if(!R.xr.isPresenting) return; for(let i=0;i<2;i++){ zsaCtrlPos(sceneEl,R.xr.getController(i),hp); if(hp.distanceTo(knobW)<0.17) return open(); } };
 (window.__zsaSteps=window.__zsaSteps||[]).push(step);
 if(window.AFRAME&&!AFRAME.components['zsa-tick']) AFRAME.registerComponent('zsa-tick',{tick(){ (window.__zsaSteps||[]).forEach(f=>f()); }});
 sceneEl.setAttribute('zsa-tick',''); g.userData.open=open; g.userData.unlock=unlock; g.userData.isLocked=()=>locked; return g; };
// Controller-Pose robust: XR-Controller hängen je nach Seite an der Szene oder am Rig
window.zsaCtrlPos=function(sceneEl,c,out){ const S=sceneEl.object3D; if(!c.parent||c.parent===S){ const camEl=sceneEl.camera&&sceneEl.camera.el; const rig=camEl&&camEl.object3D.parent; out.copy(c.position); if(rig&&rig!==S) rig.localToWorld(out); } else c.getWorldPosition(out); return out; };
window.zsaRay=function(sceneEl,c){ const T=THREE, S=sceneEl.object3D, o=new T.Vector3(), q=new T.Quaternion(); zsaCtrlPos(sceneEl,c,o); if(!c.parent||c.parent===S){ q.copy(c.quaternion); const camEl=sceneEl.camera&&sceneEl.camera.el; const rig=camEl&&camEl.object3D.parent; if(rig&&rig!==S){ const rq=new T.Quaternion(); rig.getWorldQuaternion(rq); q.premultiply(rq); } } else c.getWorldQuaternion(q); return new T.Raycaster(o,new T.Vector3(0,0,-1).applyQuaternion(q),0,14); };
window.zsaMouseRay=function(sceneEl,e){ const T=THREE, r=sceneEl.canvas.getBoundingClientRect(), rc=new T.Raycaster(); rc.setFromCamera({x:(e.clientX-r.left)/r.width*2-1,y:-(e.clientY-r.top)/r.height*2+1},sceneEl.camera); return rc; };
// ---------- Schlüssel: liegt auf der nächsten Fläche unter (x,z); aufheben per Hand, Laser, Klick oder einfach hingehen → Tür schließt auf
window.zsaKey=function(sceneEl,cfg,onFound){ const T=THREE, S=sceneEl.object3D; const brass=new T.MeshStandardMaterial({color:0x9c7a40,roughness:0.4,metalness:0.9});
 const k=new T.Group(); const ring=new T.Mesh(new T.TorusGeometry(0.016,0.0045,10,24),brass); ring.position.x=-0.03; k.add(ring);
 const shaft=new T.Mesh(new T.CylinderGeometry(0.0035,0.0035,0.06,8),brass); shaft.rotation.z=Math.PI/2; shaft.position.x=0.012; k.add(shaft);
 [[0.03,-0.007],[0.038,-0.009]].forEach(([x,y])=>{ const b=new T.Mesh(new T.BoxGeometry(0.006,0.012,0.004),brass); b.position.set(x,y,0); k.add(b); });
 k.rotation.x=-Math.PI/2; k.rotation.z=Math.random()*6; k.scale.setScalar(1.6); const holder=new T.Group(); holder.add(k); S.add(holder);
 // auf Fläche legen (Raycast nach unten, ignoriert Fotowände/Unsichtbares)
 const place=()=>{ if(cfg.y!=null){ holder.position.set(cfg.x,cfg.y,cfg.z); return; }
  const rc=new T.Raycaster(new T.Vector3(cfg.x,2.2,cfg.z),new T.Vector3(0,-1,0),0,4); const objs=[]; const mine=o=>{ while(o){ if(o===holder) return true; o=o.parent; } return false; }; S.traverse(o=>{ if(o.isMesh&&o.visible&&!mine(o)&&!(o.material&&(o.material.visible===false||o.material.transparent||o.material.side===T.BackSide))) objs.push(o); });
  const h=rc.intersectObjects(objs,false).find(x=>x.face&&Math.abs(x.face.normal.y)>0.3); holder.position.set(cfg.x,h?h.point.y+0.006:0.006,cfg.z); };
 let enabled=!cfg.hide, enT=0; const hidden=cfg.hide&&window.ZSX&&ZSX.hide; if(!hidden){ enabled=true; place(); setTimeout(place,1500); setTimeout(place,5000); }
 // kleiner Lichtfleck + gelegentliches Glitzern (in der Welt, kein Hotspot)
 const gl=document.createElement('canvas'); gl.width=gl.height=64; const gx=gl.getContext('2d'); const gg=gx.createRadialGradient(32,32,0,32,32,32); gg.addColorStop(0,'rgba(255,240,200,1)'); gg.addColorStop(0.25,'rgba(255,220,150,0.35)'); gg.addColorStop(1,'rgba(255,200,120,0)'); gx.fillStyle=gg; gx.fillRect(0,0,64,64);
 const spr=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(gl),transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0})); spr.scale.set(0.035,0.035,1); spr.position.y=0.015; holder.add(spr);
 const kl=new T.PointLight(0xffd8a0,0.14,0.7,2); kl.position.y=0.3; holder.add(kl);
 const hitS=new T.Mesh(new T.SphereGeometry(0.22,10,8),new T.MeshBasicMaterial({visible:false})); holder.add(hitS);
 if(hidden) kl.intensity=0;
 let found=false; const R=sceneEl.renderer, head=new T.Vector3(), hp=new T.Vector3(), kp=new T.Vector3();
 const take=()=>{ if(found||!enabled) return; found=true; SND.chime(); holder.visible=false; try{ kE.parentNode&&kE.parentNode.removeChild(kE); }catch(e){} onFound&&onFound(); };
 [0,1].forEach(i=>{ const c=R.xr.getController(i); c.addEventListener('selectstart',()=>{ if(found) return; const rc=zsaRay(sceneEl,c); if(rc.intersectObject(hitS,false).length) return take(); holder.getWorldPosition(kp); const d=kp.clone().sub(rc.ray.origin); if(d.length()<7&&rc.ray.direction.angleTo(d)<0.12) take(); }); c.addEventListener('squeezestart',()=>{ if(found) return; zsaCtrlPos(sceneEl,c,hp); holder.getWorldPosition(kp); if(hp.distanceTo(kp)<0.45) take(); }); });
 // A-Frame-Pfad (wie die greifbaren Raum-Gegenstände): unsichtbare .clickable-Kugel → laser-controls/cursor-Klick; Grip über die A-Frame-Controller-Entities
 const kE=document.createElement('a-entity'); if(!hidden) kE.classList.add('clickable'); kE.id='zsaKeyHit'; sceneEl.appendChild(kE);
 const hitA=new T.Mesh(new T.SphereGeometry(0.22,10,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
 const syncA=()=>{ holder.getWorldPosition(kp); kE.object3D.position.copy(kp); };
 const initA=()=>{ kE.setObject3D('mesh',hitA); syncA(); kE.addEventListener('click',take); }; kE.hasLoaded?initA():kE.addEventListener('loaded',initA);
 [1600,5200].forEach(ms=>setTimeout(syncA,ms));
 const enable=()=>{ if(enabled) return; enabled=true; enT=performance.now(); kl.intensity=0.14; holder.visible=true; syncA(); kE.classList.add('clickable'); };
 if(hidden) ZSX.hide(sceneEl,cfg,holder,enable);
 const gripEls=new Set(); const hookG=()=>document.querySelectorAll('[laser-controls],[hand-controls],[oculus-touch-controls]').forEach(el=>{ if(gripEls.has(el)) return; gripEls.add(el); el.addEventListener('gripdown',()=>{ if(found) return; el.object3D.getWorldPosition(hp); holder.getWorldPosition(kp); if(hp.distanceTo(kp)<0.45) take(); }); }); hookG(); [1000,4000].forEach(ms=>setTimeout(hookG,ms));
 sceneEl.canvas&&sceneEl.canvas.addEventListener('click',e=>{ if(R.xr.isPresenting||found||!enabled||(window.ZSX&&ZSX.busy())) return; if(zsaMouseRay(sceneEl,e).intersectObject(hitS,false).length) take(); });
 (window.__zsaSteps=window.__zsaSteps||[]).push(()=>{ if(found||!enabled) return; const now=performance.now(); if(hidden) syncA(); const ph=(now%4200)/4200; spr.material.opacity=ph<0.12?Math.sin(ph/0.12*Math.PI)*0.55:0; spr.material.rotation=now*0.002;
  const cam=sceneEl.camera; if(!cam) return; cam.getWorldPosition(head); holder.getWorldPosition(kp); if(Math.hypot(head.x-kp.x,head.z-kp.z)<(hidden?0.6:0.75)&&now-enT>1400) return take();
  if(R.xr.isPresenting) for(let i=0;i<2;i++){ zsaCtrlPos(sceneEl,R.xr.getController(i),hp); if(hp.distanceTo(kp)<0.32) return take(); } });
 holder.userData.take=take; holder.userData.enabled=()=>enabled; return holder; };
// Sprachzeilen (ElevenLabs, Kap. 6 Verzweigungskonzept). VO_AT: wann sie in der Alpha laufen (enter = nach Betreten + delay s, key = Schlüssel gefunden)
const VO={
 v_2041_baum_e:['Erzähler','Kein Tor. Ein Baum. Irgendwer hat 1972 was richtig gemacht.'],
 v_kirmes_m:['Mara','„Hier war ich schon mal … als Kind?“'],
 v_finale_m:['Mara','„Moment … das hab ich doch …“'],
 v_licht_e:['Erzähler','Licht an, Licht aus. Dasselbe Zimmer. Nur eins davon erinnert sich.'],
 v_walkman_m:['Mara','„Rückspulen kostet. Zehn Sekunden. Das Leben ist kein Mixtape.“'],
 v_2041_baum_m:['Mara','„Komisch, wie ein Baum mehr verbindet, als jede Mauer trennt.“'],
 v_2041_tor_e:['Erzähler','Mauern. Haben wir doch schon mal gehabt.'],
 v_pool_m:['Mara','„Woher kenn ich die Zahl?“'],
 v_apt_m:['Mara','„Ab hier geht’s nur noch vorwärts.“'],
 v_warn_m:['Mara','„Hör mir zu. Wenn die Uhr abläuft, vergess ich dich. Diesmal für immer.“'],
 v_jacke_m:['Mara','„Das ist meine Jacke. Warum ist das meine Jacke?“'],
 v_end_ausbruch_m:['Mara','„Geh. Einer von uns sollte aufwachen.“'],
 v_end_erinn_m:['Mara','„Ich hab das gebaut. Ich wollte nur, dass jemand mitkommt.“'],
 v_end_erinn_e:['Erzähler','Und dann, zum ersten Mal: kein Rückspulen.'],
 v_end_vergessen_m:['Mara','„Kennen wir uns? Du siehst nett aus. Bleib doch.“'],
 v_end_testband:['Testband','Teilnehmerin 7. Begleitperson integriert.'] };
const VO_AT={
 era1984:[['v_licht_e','enter',9]], era1984mall:[['v_walkman_m','enter',9]], pool:[['v_pool_m','key',0.8]],
 era2041:[['v_2041_baum_e','enter',8],['v_2041_baum_m','key',0.8]], apartment:[['v_apt_m','enter',6]],
 kirmes:[['v_kirmes_m','enter',7]], sim:[['v_finale_m','key',0.8]] };
let subM=null;
window.zsaSay=function(id,sec){ const v=VO[id]; if(!v) return; if(window.ZSMARA&&ZSMARA.route(v[0],v[1],ROOT+'assets/vo/'+id+'.mp3')!=='room') return; /* Mara nicht im Raum → Anruf/stumm (mara.js) */ const sc=document.querySelector('a-scene'); if(!sc||!sc.renderer) return; const T=THREE, S=sc.object3D;
 const a=new Audio(ROOT+'assets/vo/'+id+'.mp3'); a.volume=0.9; a.play().catch(()=>{});
 if(subM){ S.remove(subM); subM=null; } const c=document.createElement('canvas'); c.width=1024; c.height=72; const x=c.getContext('2d'); x.font='500 30px sans-serif'; const t=v[0]+': '+v[1]; let fs=30; while(x.measureText(t).width>980&&fs>18){ fs-=2; x.font='500 '+fs+'px sans-serif'; } const w=Math.min(1010,x.measureText(t).width+40);
 x.fillStyle='rgba(0,0,0,0.45)'; x.fillRect(512-w/2,6,w,60); x.fillStyle='#d9c79e'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(t,512,37);
 const tx=new T.CanvasTexture(c); tx.colorSpace=T.SRGBColorSpace; const m=new T.Mesh(new T.PlaneGeometry(1.0,0.07),new T.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,toneMapped:false,fog:false}));
 const cam=sc.camera; const hp=new T.Vector3(), q=new T.Quaternion(); cam.getWorldPosition(hp); cam.getWorldQuaternion(q); const f=new T.Vector3(0,0,-1).applyQuaternion(q); f.y=0; f.normalize();
 m.position.copy(hp).addScaledVector(f,1.8); m.position.y=hp.y-0.42; m.lookAt(hp.x,m.position.y,hp.z); m.renderOrder=5; S.add(m); subM=m;
 const hold=()=>Math.max(3.2,(isFinite(a.duration)?a.duration:4)+0.8); setTimeout(()=>{ const t0=performance.now(); const fd=()=>{ const k=Math.min(1,(performance.now()-t0)/800); m.material.opacity=1-k; if(k<1) requestAnimationFrame(fd); else if(subM===m){ S.remove(m); subM=null; } }; fd(); },(sec||hold())*1000); };
window.zsaVO=VO;
// Räume: Tür automatisch setzen
const s=STEPS[step];
if(s.door&&!SD) document.addEventListener('DOMContentLoaded',()=>{ const sc=document.querySelector('a-scene'); if(!sc) return; const go=()=>setTimeout(()=>{
  const kc=s.key; const cfg=Object.assign({},s.door,{locked:!!kc,note:s.door.note||(kc?(s.keyNote||'Abgeschlossen. Der Schlüssel liegt hier irgendwo. – M.'):null)});
  const d=window.__zsaDoorG=zsaDoor(sc,cfg,()=>goStep(step+1));
  if(cfg.attach&&window.__apt&&__apt.ROOMS&&__apt.ROOMS[cfg.attach]){ const R0=__apt.ROOMS[cfg.attach]; const G=(R0.objs&&R0.objs[0]); if(G&&G.attach) G.attach(d); } // Wohnung: Tür gehört zum Raum (wird mit ihm aus-/eingeblendet)
  const at=VO_AT[s.id]||[]; at.filter(e=>e[1]==='enter').forEach(e=>setTimeout(()=>zsaSay(e[0]),e[2]*1000));
  const onKey=()=>{ at.filter(e=>e[1]==='key').forEach(e=>setTimeout(()=>zsaSay(e[0]),e[2]*1000)); if(window.NOKIO&&NOKIO.onKey) NOKIO.onKey(); };
  if(kc){ window.__zsaKeyG=zsaKey(sc,kc,()=>{ d.userData.unlock(); onKey(); }); setTimeout(()=>{ if(d.userData.isLocked()){ d.userData.unlock(); } },150000); /* Sicherheitsnetz: nach 2,5 min gibt die Schleife nach */ }
 },300); sc.hasLoaded?go():sc.addEventListener('loaded',go); });
// Abstecher-Seite: Rückweg durch die vorhandene Tür (Hingehen, Laser+Trigger, Griff an der Tür, Maus/Touch-Tipp). Kein Leucht-Hotspot: unsichtbare Trefferbox.
if(SD) document.addEventListener('DOMContentLoaded',()=>{ const sc=document.querySelector('a-scene'); if(!sc) return; const go=()=>setTimeout(()=>{ const T=THREE, R=sc.renderer, E=SD.exit;
  const rigE=document.getElementById('rig'); if(rigE&&SD.spawn){ const sp=SD.spawn; rigE.object3D.rotation.set(0,sp.yaw||0,0); rigE.object3D.position.set(sp.x,0,sp.z); }
  const hb=new T.Mesh(new T.BoxGeometry(E.w,E.h,0.3),new T.MeshBasicMaterial({visible:false})); hb.position.set(E.x-E.n[0]*0.1,E.h/2,E.z-E.n[1]*0.1); hb.rotation.y=Math.atan2(E.n[0],E.n[1]); sc.object3D.add(hb); hb.updateMatrixWorld(true);
  let gone=false, armed=false; const t0=performance.now(); const leave=()=>{ if(gone) return; gone=true; try{ SND.creak(); }catch(e){} backFromSide(); };
  [0,1].forEach(i=>{ const c=R.xr.getController(i); c.addEventListener('selectstart',()=>{ if(zsaRay(sc,c).intersectObject(hb).length) leave(); }); c.addEventListener('squeezestart',()=>{ const p=zsaCtrlPos(sc,c,new T.Vector3()); if(new T.Box3().setFromObject(hb).expandByScalar(0.1).containsPoint(p)) leave(); }); });
  sc.canvas.addEventListener('click',e=>{ if(R.xr.isPresenting) return; if(zsaMouseRay(sc,e).intersectObject(hb).length) leave(); });
  const head=new T.Vector3(); (window.__zsaSteps=window.__zsaSteps||[]).push(()=>{ if(gone) return; sc.camera.getWorldPosition(head); const dx=head.x-E.x, dz=head.z-E.z, dist=dx*E.n[0]+dz*E.n[1], lat=Math.abs(dx*E.n[1]-dz*E.n[0]);
   if(dist>0.9||lat>E.w/2+0.4) armed=true; if(armed&&performance.now()-t0>1500&&dist<0.5&&lat<E.w/2+0.1) leave(); }); // erst scharf, wenn man nach Ankunft weg war (kein Sofort-Zurück)
  if(window.AFRAME&&!AFRAME.components['zsa-tick']) AFRAME.registerComponent('zsa-tick',{tick(){ (window.__zsaSteps||[]).forEach(f=>f()); }}); sc.setAttribute('zsa-tick','');
  window.__zsaSideExit={hb,leave};
 },400); sc.hasLoaded?go():sc.addEventListener('loaded',go); });
})();
