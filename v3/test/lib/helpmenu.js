/* helpmenu.js – Menü (☰) · Optionen · Steuerung für Rewind. Eigenständig, ändert keine Szene.
   Desktop/Handy: kleines ☰ oben rechts → Menü → Optionen → Steuerung. Beim allerersten Start zeigt es die Steuerung einmal automatisch.
   VR: beim ersten Betreten von VR ein fest in der Welt stehendes Tafel-Panel (nicht am Kopf), Trigger/Laser darauf schließt es,
   linken Stick drücken holt es wieder (erscheint vor dir in der Welt). */
(function(){
if(window.ZSHelp) return;
const LS={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
const UA=navigator.userAgent||'', isQuest=/OculusBrowser|Quest|Pico/i.test(UA);
const isPhone=()=>!!window.ZSTouch&&ZSTouch.active;
const dev=()=>isQuest?'vr':isPhone()?'phone':'pc';
const css=`
#zsh-btn{position:fixed;top:calc(10px + env(safe-area-inset-top));right:calc(10px + env(safe-area-inset-right));z-index:60;width:44px;height:44px;border-radius:12px;border:1px solid rgba(200,180,140,.35);background:rgba(22,19,16,.72);color:#e8dcc4;font:600 22px/42px sans-serif;text-align:center;cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(4px)}
body.zs-touch #zsh-btn{width:54px;height:54px;font-size:26px;line-height:52px}
#zsh{position:fixed;inset:0;z-index:70;display:none;align-items:center;justify-content:center;background:rgba(8,7,6,.62);backdrop-filter:blur(3px);font-family:"DejaVu Sans",system-ui,sans-serif;color:#e8dcc4;-webkit-user-select:none;user-select:none;touch-action:pan-y}
#zsh.on{display:flex}
#zsh .p{width:min(760px,calc(100vw - 32px - env(safe-area-inset-left) - env(safe-area-inset-right)));max-height:calc(100vh - 28px);overflow:auto;background:linear-gradient(#1c1915,#14120f);border:1px solid #5a4a32;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.6);padding:18px 22px 20px;box-sizing:border-box;-webkit-overflow-scrolling:touch}
#zsh h2{margin:0 0 12px;font:700 22px/1.1 "DejaVu Sans Condensed",sans-serif;letter-spacing:4px;color:#d8c8a8;display:flex;align-items:center;gap:10px}
#zsh h2 .x{margin-left:auto;font-size:22px;letter-spacing:0;cursor:pointer;padding:2px 10px;border-radius:8px;border:1px solid #4a3e2c}
#zsh .m{display:flex;flex-direction:column;gap:10px}
#zsh .m button,#zsh .tabs button{font:600 17px sans-serif;color:#e8dcc4;background:#26211b;border:1px solid #4e412e;border-radius:12px;padding:14px 16px;text-align:left;cursor:pointer}
#zsh .m button:active,#zsh .tabs button:active{background:#332b22}
#zsh .m button small{display:block;font-weight:400;opacity:.6;font-size:13px;margin-top:3px}
#zsh .tabs{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
#zsh .tabs button{padding:9px 14px;font-size:15px}
#zsh .tabs button.sel{background:#4a3c28;border-color:#8a7250}
#zsh .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}
#zsh .c{display:flex;gap:10px;align-items:center;background:#201c17;border:1px solid #3a3124;border-radius:12px;padding:9px 11px}
#zsh .c svg{flex:0 0 40px;width:40px;height:40px}
#zsh .c b{display:block;font-size:15px;color:#f0e4cc}
#zsh .c span{font-size:13px;opacity:.75;line-height:1.3}
@media (max-height:520px){#zsh .p{padding:12px 16px 14px}#zsh h2{font-size:18px;margin-bottom:8px}#zsh .g{grid-template-columns:repeat(3,1fr);gap:6px}#zsh .c{padding:6px 8px;gap:8px}#zsh .c svg{flex-basis:30px;width:30px;height:30px}#zsh .c b{font-size:13px}#zsh .c span{font-size:11.5px}#zsh .tabs{margin-bottom:8px}#zsh .tabs button{padding:6px 10px;font-size:13px}#zsh .m button{padding:10px 14px;font-size:15px}}
#zsh .note{font-size:12px;opacity:.55;margin-top:10px}
#zsh .row{display:flex;align-items:center;justify-content:space-between;gap:12px}
#zsh .tg{width:54px;height:30px;border-radius:15px;background:#3a3124;position:relative;flex:0 0 54px;border:1px solid #5a4a32}
#zsh .tg.on{background:#7a6240}#zsh .tg i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:11px;background:#e8dcc4;transition:left .15s}#zsh .tg.on i{left:27px}
`;
// kleine Piktogramme (Linien, warm-beige, kein Leuchten)
const S=(p)=>`<svg viewBox="0 0 40 40" fill="none" stroke="#d8c8a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I={
 tap:S('<path d="M18 30v-13a2.5 2.5 0 015 0v8l5 1.5a3 3 0 012 3.4L29 36H19l-4-5a2.4 2.4 0 013.4-3.3L19 29"/><circle cx="20.5" cy="9" r="5" stroke-dasharray="2 3"/>'),
 walk:S('<ellipse cx="20" cy="31" rx="11" ry="4"/><path d="M20 31V8M14 14l6-6 6 6"/>'),
 swipe:S('<path d="M6 14h28M10 10l-4 4 4 4M30 10l4 4-4 4"/><path d="M17 36v-11a2.2 2.2 0 014.4 0v6l4 1.2a2.6 2.6 0 011.7 3L27 38"/>'),
 obj:S('<rect x="9" y="12" width="22" height="16" rx="2"/><path d="M9 17h22"/><circle cx="31" cy="30" r="6"/><path d="M35 34l3 3"/>'),
 door:S('<path d="M10 36V5h18v31M6 36h28"/><circle cx="24" cy="21" r="1.4" fill="#d8c8a8"/>'),
 dbl:S('<path d="M28 12a10 10 0 10 2 10"/><path d="M28 5v7h-7"/><text x="13" y="25" font-size="9" fill="#d8c8a8" stroke="none" font-family="sans-serif">180°</text>'),
 btnB:S('<circle cx="20" cy="20" r="14"/><text x="14.5" y="26" font-size="16" fill="#d8c8a8" stroke="none" font-family="sans-serif" font-weight="700">B</text>'),
 bag:S('<path d="M9 15h22l-2 21H11z"/><path d="M15 15v-3a5 5 0 0110 0v3"/>'),
 menu:S('<path d="M10 13h20M10 20h20M10 27h20"/>'),
 stickL:S('<circle cx="20" cy="22" r="13"/><circle cx="20" cy="22" r="5"/><path d="M20 4v4M20 36v-1M7 22H3M37 22h-4"/><text x="3" y="10" font-size="8" fill="#d8c8a8" stroke="none" font-family="sans-serif">L</text>'),
 stickR:S('<circle cx="20" cy="22" r="13"/><path d="M13 22h14M24 18l4 4-4 4M16 18l-4 4 4 4"/><text x="31" y="10" font-size="8" fill="#d8c8a8" stroke="none" font-family="sans-serif">R</text>'),
 trig:S('<path d="M12 8h14a6 6 0 016 6v6l-6 4H14z"/><path d="M18 24v8a4 4 0 008 0"/>'),
 grip:S('<path d="M13 10h12l4 8-4 16H15l-4-16z"/><path d="M15 18h10"/>'),
 laser:S('<path d="M6 34L30 10"/><circle cx="31" cy="9" r="3"/><path d="M4 30l6 6"/>'),
 arc:S('<path d="M6 30C10 10 26 6 33 28"/><ellipse cx="33" cy="31" rx="5" ry="2"/>'),
 abxy:S('<circle cx="14" cy="14" r="6"/><circle cx="26" cy="26" r="6"/><text x="11" y="18" font-size="9" fill="#d8c8a8" stroke="none" font-family="sans-serif">Y</text><text x="23" y="30" font-size="9" fill="#d8c8a8" stroke="none" font-family="sans-serif">B</text>'),
 phone:S('<rect x="13" y="5" width="14" height="30" rx="3"/><path d="M18 30h4"/><path d="M32 14l4 3-4 3"/>'),
 mouse:S('<rect x="12" y="5" width="16" height="30" rx="8"/><path d="M20 5v10"/>'),
 keys:S('<rect x="15" y="7" width="10" height="10" rx="2"/><rect x="4" y="21" width="10" height="10" rx="2"/><rect x="15" y="21" width="10" height="10" rx="2"/><rect x="26" y="21" width="10" height="10" rx="2"/><text x="17" y="15" font-size="7" fill="#d8c8a8" stroke="none">W</text>'),
 esc:S('<rect x="5" y="11" width="30" height="18" rx="3"/><text x="10" y="24" font-size="10" fill="#d8c8a8" stroke="none" font-family="sans-serif">Esc</text>'),
 cine:S('<path d="M5 12q15-6 30 0v16q-15-6-30 0z"/><path d="M17 16l7 4-7 4z"/>')
};
const C=(ic,t,d)=>`<div class="c">${I[ic]}<div><b>${t}</b><span>${d}</span></div></div>`;
const PAGES={
 phone:['📱 Handy',[
  C('swipe','Umsehen','Mit einem Finger über den Bildschirm wischen'),
  C('walk','Gehen','Auf den Boden tippen – du gehst dort hin'),
  C('obj','Gegenstände','Antippen = hingehen und benutzen, nehmen oder ansehen'),
  C('door','Türen','Tür antippen – du gehst hin und hindurch'),
  C('dbl','Umdrehen','Doppelt auf den Boden tippen = 180°'),
  C('btnB','B · Zurück','Gegenstand zurücklegen, Ansicht oder Spiel verlassen'),
  C('bag','Inventar','Was du dabei hast'),
  C('menu','Menü','Optionen, Steuerung, Testseite'),
  C('cine','Automaten','Antippen = Spiel im Kino-Modus · Steuerkreuz + A, B = zurück')],
  'Handy quer halten. Beim ersten Tippen geht das Spiel in den Vollbildmodus.'],
 vr:['🥽 VR (Quest)',[
  C('stickL','Linker Stick','Gehen'),
  C('stickR','Rechter Stick','Links/rechts = 30° drehen · nach vorn = Teleport-Bogen'),
  C('grip','Grip','Gegenstand greifen und halten'),
  C('trig','Trigger','Benutzen · mit dem Laser auch aus der Ferne greifen'),
  C('laser','Laser','Auf Türen, Automaten und Dinge zeigen + Trigger'),
  C('abxy','A / X · B / Y','A/X = Aktion · B/Y = zurück, Spiel verlassen'),
  C('phone','Handy','Aus dem Inventar wählen = in der Hand · B legt es zurück'),
  C('bag','Inventar','Gesammelte Dinge'),
  C('stickL','Hilfe','Linken Stick drücken = diese Tafel')],
  'Der Boden ist echt (Höhe 0). Wenn dir schwindelig wird: Teleport statt Gehen.'],
 pc:['🖥️ PC',[
  C('keys','W A S D','Gehen'),
  C('mouse','Maus ziehen','Umsehen'),
  C('tap','Klick','Benutzen, nehmen, ansehen · Tür anklicken'),
  C('esc','Esc','Zurück · Ansicht oder Spiel verlassen'),
  C('cine','Automaten','Pfeiltasten + Leertaste, Esc = zurück')],
  'Mit VR-Brille: Knopf „VR“ unten rechts.']
};
let root,view='menu',tab=null;
function el(){ if(root) return root; const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
 const b=document.createElement('div'); b.id='zsh-btn'; b.textContent='☰'; b.title='Menü'; b.addEventListener('click',e=>{ e.stopPropagation(); open('menu'); }); document.body.appendChild(b);
 root=document.createElement('div'); root.id='zsh'; root.addEventListener('click',e=>{ if(e.target===root) close(); }); document.body.appendChild(root);
 ['touchstart','touchmove','touchend','mousedown','mouseup','click','pointerdown'].forEach(t=>root.addEventListener(t,e=>e.stopPropagation()));
 return root; }
function startUrl(){ const p=location.pathname, i=p.indexOf('/v3/'); return location.origin+(i>=0?p.slice(0,i):'')+'/start.html'; }
function render(){ const r=el(); let h='';
 if(view==='menu'){ h=`<div class="p"><h2>REWIND <span class="x" data-a="close">✕</span></h2><div class="m">
  <button data-a="close">▶ Weiter spielen</button>
  <button data-a="opt">⚙️ Optionen<small>Steuerung, Einstellungen</small></button>
  <button data-a="reload">↻ Raum neu laden</button>
  <button data-a="start">⌂ Zur Testseite</button></div></div>`; }
 else if(view==='opt'){ const inv=LS.get('zs_touch_invert')==='1', q=LS.get('zs_touch_lowq')==='1';
  h=`<div class="p"><h2>OPTIONEN <span class="x" data-a="close">✕</span></h2><div class="m">
  <button data-a="help">🎮 Steuerung<small>So wird gespielt – Handy, VR und PC</small></button>
  ${isPhone()?`<button data-a="inv"><div class="row"><span>↔ Blick umkehren<small>Wischen bewegt die Welt statt den Blick</small></span><div class="tg ${inv?'on':''}"><i></i></div></div></button>
  <button data-a="lowq"><div class="row"><span>🔋 Spar-Grafik<small>Weniger Auflösung, flüssiger auf älteren Handys</small></span><div class="tg ${q?'on':''}"><i></i></div></div></button>`:''}
  <button data-a="fs">⛶ Vollbild an/aus</button>
  <button data-a="menu">← Zurück</button></div></div>`; }
 else { const t=tab||dev(); const P=PAGES[t];
  h=`<div class="p"><h2>STEUERUNG <span class="x" data-a="close">✕</span></h2><div class="tabs">${['phone','vr','pc'].map(k=>`<button data-t="${k}" class="${k===t?'sel':''}">${PAGES[k][0]}${k===dev()?' · dieses Gerät':''}</button>`).join('')}</div>
  <div class="g">${P[1].join('')}</div><div class="note">${P[2]}</div><div class="m" style="margin-top:12px"><button data-a="close" style="text-align:center">Verstanden – los geht's</button></div></div>`; }
 r.innerHTML=h;
 r.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); const a=b.dataset.a;
  if(a==='close') close(); else if(a==='opt') {view='opt';render();} else if(a==='menu'){view='menu';render();} else if(a==='help'){view='help';tab=null;render();}
  else if(a==='reload') location.reload(); else if(a==='start') location.href=startUrl();
  else if(a==='inv'){ LS.set('zs_touch_invert',LS.get('zs_touch_invert')==='1'?'0':'1'); render(); }
  else if(a==='lowq'){ LS.set('zs_touch_lowq',LS.get('zs_touch_lowq')==='1'?'0':'1'); if(window.ZSTouch) ZSTouch.applyQuality(); render(); }
  else if(a==='fs'){ const d=document; if(d.fullscreenElement) d.exitFullscreen&&d.exitFullscreen(); else { const de=d.documentElement; (de.requestFullscreen||de.webkitRequestFullscreen||function(){}).call(de); } } }));
 r.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); tab=b.dataset.t; render(); })); }
function open(v){ view=v||'menu'; tab=null; render(); el().classList.add('on'); if(v==='help') LS.set('zs_help_seen_v1','1'); }
function close(){ if(root) root.classList.remove('on'); LS.set('zs_help_seen_v1','1'); }
function isOpen(){ return !!root&&root.classList.contains('on'); }

// ---------- VR: Tafel fest in der Welt ----------
let vrPanel=null;
function vrCanvas(){ const W=1024,H=640,cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
 x.fillStyle='#1a1713'; x.fillRect(0,0,W,H); x.strokeStyle='#6a5a40'; x.lineWidth=6; x.strokeRect(8,8,W-16,H-16);
 x.fillStyle='#d8c8a8'; x.font='700 46px sans-serif'; x.fillText('STEUERUNG · VR',44,82);
 const rows=[['L-Stick','gehen'],['R-Stick ◀ ▶','30° drehen'],['R-Stick ▲','Teleport-Bogen'],['Grip','greifen & halten'],['Trigger + Laser','benutzen, Tür, Automat'],['A / X','Aktion'],['B / Y','zurück · Handy weglegen'],['L-Stick drücken','diese Tafel']];
 x.font='600 34px sans-serif'; rows.forEach(([a,b],i)=>{ const y=150+i*58; x.fillStyle='#f0e4cc'; x.fillText(a,60,y); x.fillStyle='#b8a888'; x.fillText(b,440,y); });
 x.fillStyle='#8a7a60'; x.font='26px sans-serif'; x.fillText('Trigger auf die Tafel = schließen',60,H-36); return cv; }
function showVR(){ const sc=document.querySelector('a-scene'); if(!sc||!sc.camera||!window.THREE) return; const T=THREE;
 if(!vrPanel){ const tex=new T.CanvasTexture(vrCanvas()); tex.colorSpace=T.SRGBColorSpace; const m=new T.Mesh(new T.PlaneGeometry(0.9,0.5625),new T.MeshBasicMaterial({map:tex,fog:false,transparent:true,opacity:0.96}));
  const e=document.createElement('a-entity'); e.classList.add('clickable'); e.id='zshVR'; sc.appendChild(e); const init=()=>{ e.setObject3D('mesh',m); }; e.hasLoaded?init():e.addEventListener('loaded',init);
  e.addEventListener('click',ev=>{ ev.stopPropagation&&ev.stopPropagation(); hideVR(); }); vrPanel={e,m}; }
 // sc.camera (Kamera im Rig, trägt Snap-Drehung) statt xr.getCamera()
 // einmal vor den Kopf in die Welt stellen (bleibt dann stehen, folgt dem Kopf nicht)
 const c=sc.camera, p=new T.Vector3(), q=new T.Quaternion(); c.getWorldPosition(p); c.getWorldQuaternion(q);
 const f=new T.Vector3(0,0,-1).applyQuaternion(q); f.y=0; if(f.lengthSq()<1e-4) f.set(0,0,-1); f.normalize();
 const o=vrPanel.e.object3D; o.position.set(p.x+f.x*1.3,Math.max(1.0,p.y-0.15),p.z+f.z*1.3); o.rotation.set(-0.08,Math.atan2(-f.x,-f.z),0); o.visible=true; vrPanel.e.classList.add('clickable'); vrPanel.t=performance.now(); vrPanel.p0=p.clone(); }
function hideVR(){ if(!vrPanel) return; vrPanel.e.object3D.visible=false; vrPanel.e.classList.remove('clickable'); LS.set('zs_help_vr_seen','1'); }

function boot(){ el(); const sc=document.querySelector('a-scene');
 const auto=()=>{ if(!LS.get('zs_help_seen_v1')&&!(sc&&sc.is&&sc.is('vr-mode'))) setTimeout(()=>{ if(!LS.get('zs_help_seen_v1')) open('help'); },isPhone()?600:900); };
 if(sc){ sc.addEventListener('enter-vr',()=>{ const b=document.getElementById('zsh-btn'); if(b) b.style.display='none'; close(); if(!LS.get('zs_help_vr_seen')) setTimeout(showVR,1200); });
  sc.addEventListener('exit-vr',()=>{ const b=document.getElementById('zsh-btn'); if(b) b.style.display=''; if(vrPanel) vrPanel.e.object3D.visible=false; });
  const hook=()=>{ ['hl','hr'].forEach(id=>{ const h=document.getElementById(id); if(h&&id==='hl') h.addEventListener('thumbstickdown',()=>{ if(!sc.is('vr-mode')) return; if(vrPanel&&vrPanel.e.object3D.visible) hideVR(); else showVR(); }); }); };
  sc.hasLoaded?hook():sc.addEventListener('loaded',hook);
  // Tafel verschwindet von selbst, wenn man 2,5 m weggeht
  setInterval(()=>{ if(!vrPanel||!vrPanel.e.object3D.visible||!sc.camera) return; const c=sc.camera; const p=new THREE.Vector3(); c.getWorldPosition(p); if(p.distanceTo(vrPanel.p0)>2.5) hideVR(); },500); }
 auto(); }
window.ZSHelp={open,close,isOpen,showVR,hideVR,view:()=>view};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();
