/* Zeitschleife – Notizen + Schleifen-Inventar für die Test-Szenen (v16).
   Wissen bleibt über Schleifen: localStorage zs3_mem → MEM.know (gleicher Speicher wie engine.js), z. B. know.notiz_1 … notiz_6, notiz_6_geheim.
   Pro Schleife: localStorage zs_loop {loop,has,flag,trash}; wird geleert, sobald MEM.loops weiterzählt.
   Projekt-Möbius-Eltern-Notizen (Hommage 70er/80er). Eltern privat Irene/Ralf, in Akten M-1/M-2; Tochter nur „unsere Kleine“ / Teilnehmerin 7. */
(()=>{ 'use strict';
const mem=()=>{ try{ return JSON.parse(localStorage.zs3_mem||'null')||{loops:1,seen:{}}; }catch(e){ return {loops:1,seen:{}}; } };
const know=k=>{ const m=mem(); return !!(m.know&&m.know[k]); };
const learn=k=>{ const m=mem(); m.know=m.know||{}; if(m.know[k]) return false; m.know[k]=1; localStorage.zs3_mem=JSON.stringify(m); return true; };
const loop=()=>{ const L=mem().loops||1; let s; try{ s=JSON.parse(localStorage.zs_loop||'null'); }catch(e){} if(!s||s.loop!==L) s={loop:L,has:{},flag:{},trash:[]}; s.trash=s.trash||[]; return s; };
const saveLoop=s=>{ localStorage.zs_loop=JSON.stringify(s); };
// ---- Texte (Fundorte siehe zeitschleife_konzept.md) ----
const NOTES={
 notiz_1:{kind:'hand',title:'Tagebuchseite, 1972',head:['Kirmes, 9. August 1972'],body:[
  'Ralf hat uns für diese Wahrnehmungsstudie angemeldet.','Zwei Wochen, 300 Mark. Für 300 Mark kann man','schon mal ein paar Tropfen nehmen, sagt er.','',
  'Die Tropfen heißen „Präparat Linde“. Sie schmecken','nach nichts. Der Arzt lächelt zu viel.','',
  'Nach der zweiten Nacht sehe ich Orte, die es nicht','geben kann. Einen gelben Gang ohne Türen.','Er riecht nach nassem Teppich. Ich war schon mal dort.','                                        – Irene']},
 notiz_2:{kind:'typed',title:'Protokoll 12.03.1984',head:['PROJEKT MÖBIUS · VERSUCHSPROTOKOLL','Sitzung 41 · 12.03.1984 · maschinell'],body:[
  'Probandin M-1: berichtet von hypnagogen Bildern.','Wiederkehrend: Gang, Neonlicht, „ein Kind älter als','möglich“. Puls erhöht, Orientierung erhalten.','',
  'Proband M-2: folgt Anweisungen ohne Nachfragen.','Keine Bilder. Schlaf unauffällig.','',
  'Weitere Gaben gemäß Plan ████. Abbruch durch die','Probanden angefragt – abgelehnt (Ltg. ██████).','',
  'Randvermerk: Sonderblätter wie üblich in Wärmetinte.']},
 notiz_3:{kind:'hand',title:'Zettel, 1984',head:['Irene –'],body:[
  'wir hören auf. Egal was die sagen.','Der graue Wagen steht wieder auf dem Parkplatz,','dritter Tag. Zwei Männer, die nie aussteigen.','',
  'Mir hat keiner gesagt, dass unsere Kleine in','der Akte landet. Ich hab sie gesehen, ihr Name','auf einem Reiter, wie ein Versuchstier.','',
  'Pack die Taschen. Heute Nacht.','                                        – Ralf']},
 notiz_4:{kind:'typed',title:'Zusatz zur Akte M-1/M-2',head:['PROJEKT MÖBIUS · ZUSATZ ZUR AKTE M-1/M-2','Az. ███/89 · VS – NUR FÜR DEN DIENSTGEBRAUCH'],body:[
  'Nachwuchs: weiblich. Erfasst als Teilnehmerin 7.','',
  'Anordnung: beobachten, nicht herauslösen.','Kontakt nur über Dritte. Keine Gaben.','',
  'Aufenthaltsort zeitweise unklar. Observation','meldet Lücken von Minuten bis Stunden, in denen','TN 7 „nicht auffindbar, obwohl anwesend“ war.','',
  'gez. ██████']},
 notiz_5:{kind:'typed',title:'Durchschlag, Akte geschlossen',head:['DURCHSCHLAG · PROJEKT MÖBIUS','Vorgang M-1/M-2 · geschlossen 11/1987'],body:[
  'M-1: Status unbekannt.','M-2: Status unbekannt.','',
  'Nachkommen (TN 7) unter der gemeldeten Anschrift','nicht angetroffen. Wohnung geräumt, Küchenuhr','stehen geblieben (vermerkt ohne Bewertung).','',
  'Vorgang ruhend. Wiederaufnahme nur auf Weisung.']},
 notiz_6:{kind:'typed',title:'Möbius-Akte (fast geschwärzt)',head:['PROJEKT MÖBIUS · SONDERBLATT','Vorgang M-1 · ███████████'],secret:true,
  hidden:['████████████████████████████████','██████████████████ ████████████','████████ ████████████████████','',  '██████████████████████████'],
  body:['M-1 darf der Tochter die Bilder nicht beschreiben.','Geteilte Vorstellung erzeugt Persistenz.','Das Kind wiederholt Orte, bis sie bleiben.','','Weitere Gaben an M-1 einstellen.']}
};
// ---- Leser: Papier-Tafel vor der Kamera (Desktop/Handy/VR) ----
let R=null;
function reader(){ if(R) return R; const T=THREE, sc=document.querySelector('a-scene'); const cv=document.createElement('canvas'); cv.width=1024; cv.height=768; const cx=cv.getContext('2d');
 const tx=new T.CanvasTexture(cv); tx.colorSpace=T.SRGBColorSpace; tx.anisotropy=4;
 const m=new T.Mesh(new T.PlaneGeometry(0.64,0.48),new T.MeshBasicMaterial({map:tx,transparent:true,depthTest:false,toneMapped:false,fog:false})); m.renderOrder=1000; m.visible=false; sc.object3D.add(m);
 const el=document.createElement('a-entity'); el.setAttribute('class','clickable'); sc.appendChild(el); el.setObject3D('mesh',m);
 R={cv,cx,tx,m,el,id:null,act:null,rev:0}; el.addEventListener('click',e=>{ const it=e.detail&&e.detail.intersection; R.tap(it&&it.uv); });
 R.tap=uv=>{ if(R.act&&uv&&(1-uv.y)*768>768-130&&(1-uv.y)*768<768-70){ R.act(); return; } close(); };
 const tick=()=>{ if(R.m.visible&&R.rev>0&&R.rev<1){ R.rev=Math.min(1,R.rev+0.02); draw(); } requestAnimationFrame(tick); }; tick();
 return R; }
function paper(cx,W,H,kind){ cx.fillStyle=kind==='typed'?'#e2dac2':'#efe6cf'; cx.fillRect(40,20,W-80,H-40); let s=7; const rnd=()=>((s=s*16807%2147483647)/2147483647);
 for(let i=0;i<2600;i++){ const v=rnd()*40|0; cx.fillStyle=`rgba(${110+v},${90+v},${60+v},0.05)`; cx.fillRect(40+rnd()*(W-80),20+rnd()*(H-40),2,2); }
 cx.strokeStyle='rgba(90,70,40,0.16)'; cx.lineWidth=2; for(let i=0;i<5;i++){ cx.beginPath(); cx.moveTo(40,120+i*140+rnd()*20); cx.lineTo(W-40,100+i*150+rnd()*30); cx.stroke(); } }
function typedLine(cx,l,x,y,a){ l.split(/(█+)/).forEach(pt=>{ if(!pt) return; const w=cx.measureText(pt).width; if(/█/.test(pt)){ cx.fillStyle='rgba(12,11,10,'+a+')'; cx.fillRect(x,y-20,w,25); } else { cx.fillStyle='rgba(29,26,22,'+(0.85*a)+')'; cx.fillText(pt,x,y); } x+=w; }); }
function draw(){ const {cx,tx}=R, W=1024, H=768, N=NOTES[R.id]; cx.clearRect(0,0,W,H); paper(cx,W,H,N.kind);
 if(N.kind==='typed'){ cx.font='bold 26px "Courier New",Courier,monospace'; let y=72; N.head.forEach(l=>{ typedLine(cx,l,70,y,1); y+=32; }); cx.fillStyle='#1d1a16'; cx.fillRect(70,y-14,W-140,2); y+=28; cx.font='24px "Courier New",Courier,monospace';
  if(N.secret){ const open=know('notiz_6_geheim')?1:R.rev; N.hidden.forEach(l=>{ typedLine(cx,l,70,y,1-open); y+=30; }); y-=30*N.hidden.length;
   if(open>0){ cx.save(); cx.globalAlpha=open; cx.fillStyle='rgba(120,60,20,0.18)'; cx.beginPath(); cx.ellipse(W/2,y+60,380*open,120*open,0,0,7); cx.fill(); N.body.forEach(l=>{ cx.fillStyle='#4a2410'; cx.fillText(l,70,y); y+=30; }); cx.restore(); }
   cx.save(); cx.translate(760,560); cx.rotate(-0.12); cx.strokeStyle='rgba(160,30,30,0.75)'; cx.lineWidth=4; cx.strokeRect(-190,-34,380,68); cx.fillStyle='rgba(160,30,30,0.75)'; cx.font='bold 22px "Courier New",monospace'; cx.textAlign='center'; cx.fillText('BEI WÄRMEEINWIRKUNG',0,-6); cx.fillText('LESBAR',0,22); cx.restore(); }
  else N.body.forEach(l=>{ typedLine(cx,l,70,y,1); y+=29; });
  cx.save(); cx.translate(820,110); cx.rotate(-0.2); cx.strokeStyle='rgba(170,30,30,0.6)'; cx.lineWidth=5; cx.strokeRect(-120,-32,240,64); cx.fillStyle='rgba(170,30,30,0.6)'; cx.font='bold 32px "Courier New",monospace'; cx.textAlign='center'; cx.fillText('GEHEIM',0,11); cx.restore(); }
 else { cx.fillStyle='#22305e'; cx.font='italic 30px "Segoe Script","Bradley Hand","URW Chancery L","Comic Sans MS",cursive'; let y=82; N.head.forEach(l=>{ cx.fillText(l,90,y); y+=44; }); y+=4;
  N.body.forEach((l,i)=>{ cx.save(); cx.translate(84+3*Math.sin(i*1.7),y); cx.rotate(-0.01+0.006*Math.sin(i)); cx.fillText(l,0,0); cx.restore(); y+=l?40:22; }); }
 R.act=null; if(N.secret&&!know('notiz_6_geheim')&&R.rev===0&&loop().has.feuerzeug){ R.act=()=>{ R.rev=0.01; R.act=null; learn('notiz_6_geheim'); toast('Gemerkt: geheimer Absatz der Möbius-Akte'); };
  cx.fillStyle='rgba(120,50,10,0.9)'; cx.fillRect(60,H-130,W-120,58); cx.fillStyle='#ffd9a0'; cx.font='600 28px Georgia,serif'; cx.fillText('🔥  Halloween-Feuerzeug unter das Blatt halten',84,H-91); }
 else if(N.secret&&!know('notiz_6_geheim')&&R.rev===0){ cx.fillStyle='rgba(30,22,14,0.75)'; cx.font='italic 24px Georgia,serif'; cx.fillText('Unter der Schwärzung steht noch etwas. Man bräuchte Wärme.',70,H-96); }
 cx.fillStyle='rgba(16,14,11,0.86)'; cx.fillRect(40,H-66,W-80,46); cx.fillStyle='#d8cfb8'; cx.font='600 26px Georgia,serif'; cx.fillText(N.title+'  ·  Klick / Trigger: weglegen',60,H-34); tx.needsUpdate=true; }
function head(){ const c=document.querySelector('a-scene').camera, v=new THREE.Vector3(); c.getWorldPosition(v); return v; }
function open(id){ reader(); R.id=id; R.rev=0; const c=document.querySelector('a-scene').camera, h=head(), f=new THREE.Vector3(0,0,-1).applyQuaternion(c.getWorldQuaternion(new THREE.Quaternion())); f.y=0; f.normalize();
 R.m.position.set(h.x+f.x*0.55,h.y-0.08,h.z+f.z*0.55); R.m.lookAt(h.x,h.y-0.05,h.z); R.m.visible=true; draw(); if(learn(id)) toast('Notiz gefunden: '+NOTES[id].title); }
function close(){ if(R){ R.m.visible=false; R.m.position.set(0,-50,0); R.id=null; } }
function toast(t){ const d=document.createElement('div'); d.textContent=t; d.style.cssText='position:fixed;left:50%;top:12%;transform:translateX(-50%);background:rgba(20,16,12,.88);color:#f0e2c0;font:600 17px Georgia,serif;padding:10px 18px;border-radius:10px;z-index:99;pointer-events:none'; document.body.appendChild(d); setTimeout(()=>d.remove(),3800); }
// ---- Zettel in eine Szene legen: ZSN.place('notiz_3',[x,y,z],{rot:[rx,ry,rz],w,h}) ----
const hits=[];
function place(id,p,o){ o=o||{}; const T=THREE, sc=document.querySelector('a-scene'); const go=()=>{ const w=o.w||0.15, h=o.h||0.2, N=NOTES[id];
  const cv=document.createElement('canvas'); cv.width=128; cv.height=160; const c=cv.getContext('2d'); c.fillStyle=N.kind==='typed'?'#ddd3b8':'#e8ddc0'; c.fillRect(0,0,128,160);
  c.strokeStyle=N.kind==='typed'?'#333':'#2a3566'; c.lineWidth=2; for(let i=0;i<11;i++){ c.beginPath(); c.moveTo(14,22+i*12); for(let x=14;x<114;x+=6) c.lineTo(x,22+i*12+(N.kind==='typed'?0:1.6*Math.sin(x*0.4+i))); c.stroke(); }
  if(N.secret){ c.fillStyle='#111'; for(let i=2;i<11;i++) c.fillRect(14,17+i*12,100,9); c.strokeStyle='#a22'; c.strokeRect(30,128,70,20); }
  const tx=new T.CanvasTexture(cv); tx.colorSpace=T.SRGBColorSpace; const g=new T.PlaneGeometry(w,h,5,5); const pa=g.attributes.position; for(let i=0;i<pa.count;i++) pa.setZ(i,(o.flat?0.001:0.005)*Math.sin(pa.getX(i)*60)*Math.cos(pa.getY(i)*45)); g.computeVertexNormals();
  const m=new T.Mesh(g,new T.MeshLambertMaterial({map:tx,side:T.DoubleSide,emissive:0xffffff,emissiveMap:tx,emissiveIntensity:o.glow||(o.flat?0.16:0.3)}));
  const el=document.createElement('a-entity'); el.setAttribute('class','clickable'); el.object3D.position.set(...p); if(o.rot) el.object3D.rotation.set(...o.rot); sc.appendChild(el); el.setObject3D('mesh',m);
  el.addEventListener('click',()=>{ if(sc.renderer.xr.isPresenting) open(id); }); hits.push({m,id,el,keep:o.keep});
  if(o.keep){ const kt=()=>{ el.object3D.visible=!!o.keep(); requestAnimationFrame(kt); }; kt(); } };
 if(sc.hasLoaded) go(); else sc.addEventListener('loaded',go); }
// Maus/Handy-Klick
let dn=null; addEventListener('mousedown',e=>{ dn=[e.clientX,e.clientY]; },true);
addEventListener('click',e=>{ const sc=document.querySelector('a-scene'); if(!sc||!sc.canvas||e.target!==sc.canvas||sc.renderer.xr.isPresenting) return; if(dn&&Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>8) return;
 const r=sc.canvas.getBoundingClientRect(), nd=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1), ry=new THREE.Raycaster(); ry.setFromCamera(nd,sc.camera);
 if(R&&R.m.visible){ const x=ry.intersectObject(R.m,false)[0]; R.tap(x&&x.uv); return; }
 const x=ry.intersectObjects(hits.filter(h=>h.el.object3D.visible).map(h=>h.m),false)[0]; if(x&&x.distance<4){ open(hits.find(h=>h.m===x.object).id); } },true);
addEventListener('keydown',e=>{ if(R&&R.m.visible&&(e.key==='Escape'||e.key===' ')) close(); });
window.ZSN={NOTES,open,close,place,know,learn,loop,saveLoop,toast,get R(){return R;}};
})();
