// Rewind V3 – nokio.js v1: „Nokio 3310“ (Parodie, kein echtes Logo/Ton). SMS aus anderen Zeiten, datengetrieben pro Raum.
// Hängt an der LINKEN Hand (VR) bzw. am Gürtel im Rig (Desktop) – nie am Kopf. Neue SMS: Vibration + leiser eigener Klingelton.
// Lesen: Hand heben (Handy nah am Gesicht) oder untersuchen (Laser/Klick/Grip, ZSX). Blättern: A/X (VR), Pfeiltasten/Enter (Desktop), H = Handy.
// Easter Egg: nach der letzten Nachricht → Menü → „Schlängel 2079“ (Stick/Pfeile).
(function(){
if(window.NOKIO) return;
const T=THREE, V=(x,y,z)=>new T.Vector3(x||0,y||0,z||0);
const SMS={ // pro Raum (ZSA-Step-id): at: 'enter' (+delay s) | 'key' (Schlüssel gefunden)
 era1984:[{at:'enter',d:16,from:'MARA',ts:'31.12.1999 23:59',text:'Hab dir mein altes Handy dagelassen. Der Akku hält ewig. Im Gegensatz zu uns.'}],
 era1984mall:[{at:'enter',d:24,from:'MARA',ts:'14.06.1996 21:40',text:'Kleiner Tipp: Was hier verloren geht, landet bei den Fundsachen. Ich hab da 1996 meine Jacke wiedergefunden.'},
  {at:'key',d:2,from:'+49 0000 2079',ts:'09.11.2079 04:44',text:'Schöner Schlüssel. Wir hatten ihn vermisst.'}],
 pool:[{at:'enter',d:20,from:'+49 0000 2079',ts:'09.11.2079 04:44',text:'Nicht nach 22 Uhr schwimmen. Die Fliesen zählen mit. – Die Aufsicht'},
  {at:'key',d:3,from:'MARA',ts:'??.??.19??',text:'Fach 37. Komisch. So alt bin ich. In jeder Zeitlinie.'}],
 era1989:[{at:'enter',d:22,from:'UNBEKANNT',ts:'10.11.1989 00:01',text:'Die Mauer ist offen. Die Kaffeedose auch. Schütteln hilft.'}],
 era2041:[{at:'enter',d:18,from:'MARA',ts:'03.03.2041 07:15',text:'Keine Netzabdeckung? Doch. Nur nicht in deiner Zeit.'}],
 apartment:[{at:'enter',d:14,from:'Hausverwaltung',ts:'01.01.2041 00:00',text:'Ihre Miete für 1984 ist überfällig. Ersatzschlüssel nur gegen Vorlage dieser SMS.'}],
 kirmes:[{at:'enter',d:20,from:'MARA',ts:'17.08.1991 19:30',text:'Zuckerwatte-Stand. Da hab ich dich zum ersten Mal verloren.'}],
 sim:[{at:'enter',d:12,from:'TESTBAND',ts:'--.--.2079 --:--',text:'Teilnehmerin 7: Begleitperson liest Nachrichten. Weiter beobachten.'}] };
const N=window.NOKIO={SMS,inbox:[],unread:0,idx:0,page:0,mode:'idle',ready:false};
const EXO={size:0.21,dist:0.34,face:[0,0,1],up:[0,1,0]};
// ---------- LCD: 96×64 Pixel, harte Schwelle (keine Kantenglättung), Pixelgitter, grüne Hintergrundbeleuchtung
const LW=96, LH=64, SC=4; const lc=document.createElement('canvas'); lc.width=LW; lc.height=LH; const lx=lc.getContext('2d',{willReadFrequently:true});
const out=document.createElement('canvas'); out.width=LW*SC; out.height=LH*SC; const ox=out.getContext('2d'); N.canvas=out; const tex=new T.CanvasTexture(out); tex.colorSpace=T.SRGBColorSpace; tex.anisotropy=4;
let back=0.25; // Beleuchtung 0..1
const FONT='bold 8px "DejaVu Sans Mono","Courier New",monospace', FONTB='bold 9px "DejaVu Sans Mono","Courier New",monospace';
function txt(s,x,y,f){ lx.font=f||FONT; lx.fillText(s,x,y); }
function wrapL(s,max){ lx.font=FONT; const out=[]; let line=''; s.split(' ').forEach(w=>{ const t=line?line+' '+w:w; if(lx.measureText(t).width>max&&line){ out.push(line); line=w; } else line=t; }); out.push(line); return out; }
function present(){ const img=lx.getImageData(0,0,LW,LH).data; const on=[0.55+0.35*back,0.72+0.25*back,0.38+0.2*back];
 const bg=`rgb(${on.map(v=>Math.round(v*170)).join(',')})`; ox.fillStyle=bg; ox.fillRect(0,0,out.width,out.height);
 const g=ox.createRadialGradient(out.width/2,out.height/2,20,out.width/2,out.height/2,out.width*0.7); g.addColorStop(0,'rgba(255,255,220,'+(0.12*back)+')'); g.addColorStop(1,'rgba(0,20,0,0.25)'); ox.fillStyle=g; ox.fillRect(0,0,out.width,out.height);
 for(let y=0;y<LH;y++) for(let x=0;x<LW;x++){ const a=img[(y*LW+x)*4+3]; ox.fillStyle=a>100?'rgba(16,28,12,0.92)':'rgba(40,70,25,0.07)'; ox.fillRect(x*SC,y*SC,SC-1,SC-1); }
 tex.needsUpdate=true; }
function clr(){ lx.clearRect(0,0,LW,LH); lx.fillStyle='#000'; lx.textBaseline='top'; }
function bars(){ for(let i=0;i<4;i++) lx.fillRect(1,12-i*3,1+i,2); for(let i=0;i<4;i++) lx.fillRect(LW-2-i,12-i*3,1+i,2); }
function envelope(x,y){ lx.strokeStyle='#000'; lx.lineWidth=1; lx.strokeRect(x+0.5,y+0.5,14,9); lx.beginPath(); lx.moveTo(x+0.5,y+0.5); lx.lineTo(x+7.5,y+5.5); lx.lineTo(x+14.5,y+0.5); lx.stroke(); }
function drawIdle(){ clr(); bars(); lx.textAlign='center'; txt('NOKIO',LW/2,1,FONTB); const d=new Date(); const yr=['1984','1989','1996','2041','2079','????'][Math.floor(performance.now()/1700)%6];
 txt(String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'),LW/2,18,FONTB); txt(yr,LW/2,29);
 if(N.unread){ envelope(LW/2-7,40); txt(N.unread+' neue SMS',LW/2,52); } else txt('Menü',LW/2,54); lx.textAlign='left'; present(); }
function drawMsg(){ const m=N.inbox[N.idx]; if(!m) return drawIdle(); clr(); envelope(1,0); txt(m.from.slice(0,13),19,1,FONTB); lx.fillRect(0,11,LW,1);
 txt(m.ts,2,13); lx.fillRect(0,22,LW,1); const L=wrapL(m.text,LW-4), per=3, pages=Math.max(1,Math.ceil(L.length/per)); N.pages=pages; N.page=Math.min(N.page,pages-1);
 L.slice(N.page*per,N.page*per+per).forEach((l,i)=>txt(l,2,24+i*9)); lx.fillRect(0,LH-11,LW,1);
 txt((N.idx+1)+'/'+N.inbox.length,2,LH-9); lx.textAlign='right'; txt(N.page<pages-1?'mehr ▼':(N.idx<N.inbox.length-1?'Weiter':'Menü'),LW-2,LH-9); lx.textAlign='left'; present(); }
function drawMenu(){ clr(); lx.textAlign='center'; txt('Menü',LW/2,1,FONTB); lx.textAlign='left'; lx.fillRect(0,11,LW,1); ['Mitteilungen','Schlängel 2079'].forEach((s,i)=>{ txt((i===N.sel?'> ':'  ')+s,2,17+i*12); if(i===N.sel) lx.fillRect(12,26+i*12,LW-16,1); });
 lx.textAlign='center'; txt('Wählen',LW/2,LH-9); lx.textAlign='left'; present(); }
// ---------- Schlängel 2079 (Snake-Parodie, 23×12 Felder à 4 px)
const G={}; const GW=23, GH=12;
function gStart(){ Object.assign(G,{s:[[8,6],[7,6],[6,6]],d:[1,0],nd:[1,0],f:[15,6],t:0,dead:false,pts:0}); N.mode='snake'; }
function gFood(){ do{ G.f=[Math.floor(Math.random()*GW),Math.floor(Math.random()*GH)]; }while(G.s.some(p=>p[0]===G.f[0]&&p[1]===G.f[1])); }
function gTurn(dx,dy){ if(N.mode!=='snake') return; if(dx&&G.d[0]===0) G.nd=[dx,0]; if(dy&&G.d[1]===0) G.nd=[0,dy]; if(G.dead) gStart(); }
function gStep(){ G.d=G.nd; const h=[G.s[0][0]+G.d[0],G.s[0][1]+G.d[1]]; if(h[0]<0||h[1]<0||h[0]>=GW||h[1]>=GH||G.s.some(p=>p[0]===h[0]&&p[1]===h[1])){ G.dead=true; beep(220,0.25); return; }
 G.s.unshift(h); if(h[0]===G.f[0]&&h[1]===G.f[1]){ G.pts+=7; gFood(); beep(1400,0.05); } else G.s.pop(); }
function drawSnake(){ clr(); txt('Pkt '+G.pts,2,0); lx.textAlign='right'; txt('2079',LW-2,0); lx.textAlign='left'; lx.strokeStyle='#000'; lx.strokeRect(1.5,10.5,GW*4+1,GH*4+1);
 G.s.forEach(p=>lx.fillRect(2+p[0]*4,11+p[1]*4,3,3)); lx.fillRect(2+G.f[0]*4+1,11+G.f[1]*4,1,3); lx.fillRect(2+G.f[0]*4,11+G.f[1]*4+1,3,1);
 if(G.dead){ lx.clearRect(8,22,80,22); lx.strokeRect(8.5,22.5,79,21); lx.textAlign='center'; txt('Zeit abgelaufen',LW/2,25); txt('nochmal: Stick',LW/2,34); lx.textAlign='left'; }
 present(); }
function redraw(){ if(N.mode==='read') drawMsg(); else if(N.mode==='menu') drawMenu(); else if(N.mode==='snake') drawSnake(); else drawIdle(); }
// ---------- Klang: eigener, leiser 2000er-Klingelton (Rechteck-Welle, kein Original)
const AC=()=>{ try{ return window.__zsaAC||(window.__zsaAC=new (window.AudioContext||window.webkitAudioContext)()); }catch(e){ return null; } };
function beep(f,dur,vol,at){ const ac=AC(); if(!ac) return; try{ac.resume();}catch(e){} const t=ac.currentTime+(at||0), o=ac.createOscillator(), g=ac.createGain(), lp=ac.createBiquadFilter(); o.type='square'; o.frequency.value=f; lp.type='lowpass'; lp.frequency.value=2600;
 g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol||0.018,t+0.008); g.gain.setValueAtTime(vol||0.018,t+dur*0.8); g.gain.linearRampToValueAtTime(0,t+dur); o.connect(lp); lp.connect(g); g.connect(N.pan||ac.destination); o.start(t); o.stop(t+dur+0.02); }
function ring(){ const mel=[[1319,.11],[1568,.11],[1760,.22],[0,.08],[1568,.11],[1319,.11],[1175,.22],[0,.3]]; for(let r=0;r<2;r++){ let t=r*1.4; mel.forEach(([f,d])=>{ if(f) beep(f,d*0.92,0.016,t); t+=d; }); } }
function buzz(){ const s=document.querySelector('a-scene'); if(window.VRP&&s){ [0,280,560,1400,1680].forEach(ms=>setTimeout(()=>VRP.haptic(s.renderer,'left',0.55,160),ms)); }
 // Brummen auch hörbar (sehr leise, tief)
 const ac=AC(); if(!ac) return; [0,0.28,0.56].forEach(at=>{ const t=ac.currentTime+at, o=ac.createOscillator(), g=ac.createGain(); o.type='sawtooth'; o.frequency.value=58; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.012,t+0.02); g.gain.linearRampToValueAtTime(0,t+0.17); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+0.2); }); }
// ---------- Gerät (prozedural: Gehäuse mit Rundungen, LCD, Tastenfeld)
function rr(w,h,r){ const s=new T.Shape(); s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2); s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r); s.lineTo(w/2,h/2-r); s.quadraticCurveTo(w/2,h/2,w/2-r,h/2); s.lineTo(-w/2+r,h/2); s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r); s.lineTo(-w/2,-h/2+r); s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2); return s; }
function build(){ const g=new T.Group(); const W=0.048, H=0.113, D=0.02;
 const shell=new T.MeshStandardMaterial({color:0x26303c,roughness:0.42,metalness:0.25}), face=new T.MeshStandardMaterial({color:0x9aa3aa,roughness:0.38,metalness:0.55}), key=new T.MeshStandardMaterial({color:0x1b1f24,roughness:0.6}), glass=new T.MeshStandardMaterial({color:0x0a0d0b,roughness:0.15,metalness:0.2});
 const body=new T.Mesh(new T.ExtrudeGeometry(rr(W,H,0.016),{depth:D-0.006,bevelEnabled:true,bevelThickness:0.003,bevelSize:0.003,bevelSegments:3,curveSegments:8}),shell); body.position.z=-D/2+0.003; g.add(body);
 const fp=new T.Mesh(new T.ExtrudeGeometry(rr(W-0.006,0.05,0.012),{depth:0.001,bevelEnabled:true,bevelThickness:0.001,bevelSize:0.001,bevelSegments:1,curveSegments:8}),face); fp.position.set(0,0.026,D/2); g.add(fp);
 const bez=new T.Mesh(new T.PlaneGeometry(0.036,0.029),glass); bez.position.set(0,0.029,D/2+0.0022); g.add(bez);
 const lcd=new T.Mesh(new T.PlaneGeometry(0.032,0.0213),new T.MeshBasicMaterial({map:tex,toneMapped:false})); lcd.position.set(0,0.029,D/2+0.0025); g.add(lcd); N.lcd=lcd;
 { const c=document.createElement('canvas'); c.width=128; c.height=24; const x=c.getContext('2d'); x.fillStyle='#c9ccd0'; x.font='700 18px "Helvetica Neue",Arial,sans-serif'; x.textAlign='center'; x.fillText('NOKIO',64,19);
  const t2=new T.CanvasTexture(c); t2.colorSpace=T.SRGBColorSpace; const lg=new T.Mesh(new T.PlaneGeometry(0.016,0.003),new T.MeshBasicMaterial({map:t2,transparent:true,depthWrite:false})); lg.position.set(0,0.0465,D/2+0.0022); g.add(lg); }
 const nav=new T.Mesh(new T.CylinderGeometry(0.0085,0.0085,0.003,20),face); nav.rotation.x=Math.PI/2; nav.scale.set(1.4,1,0.55); nav.position.set(0,-0.002,D/2+0.001); g.add(nav);
 const kg=new T.CylinderGeometry(0.0043,0.0043,0.0025,14); for(let r=0;r<4;r++) for(let c=0;c<3;c++){ const k=new T.Mesh(kg,key); k.rotation.x=Math.PI/2; k.scale.set(1.25,1,0.85); k.position.set((c-1)*0.0115,-0.016-r*0.0085,D/2+0.0005); g.add(k); }
 const ant=new T.Mesh(new T.BoxGeometry(0.03,0.004,0.004),shell); ant.position.set(0,H/2-0.004,-0.004); g.add(ant);
 return g; }
// ---------- Montage + Logik
function setup(){ const sc=document.querySelector('a-scene'); if(!sc||N.ready) return; N.ready=true; const step=window.ZSA&&ZSA.on?ZSA.cur().id:null;
 const el=document.createElement('a-entity'); el.id='nokio'; sc.appendChild(el); N.el=el; const dev=build();
 const mount=()=>{ el.setObject3D('mesh',dev); const hl=[...document.querySelectorAll('[laser-controls]')].find(e=>/left/.test(JSON.stringify(e.getAttribute('laser-controls'))));
  const rig=document.getElementById('rig')||(sc.camera&&sc.camera.el&&sc.camera.el.object3D.parent&&sc.camera.el.object3D.parent.el);
  const toBelt=()=>{ if(!rig) return; rig.object3D.add(el.object3D); el.object3D.position.set(-0.24,0.98,-0.16); el.object3D.rotation.set(-1.05,0.35,0); N.where='belt'; };
  const toHand=()=>{ if(!hl) return; hl.object3D.add(el.object3D); el.object3D.position.set(0.0,0.035,0.06); el.object3D.rotation.set(-1.25,0,0); N.where='hand'; };
  sc.is('vr-mode')&&hl?toHand():toBelt(); sc.addEventListener('enter-vr',()=>{ if(!(window.ZSX&&ZSX.cur&&ZSX.cur.obj===el.object3D)) toHand(); }); sc.addEventListener('exit-vr',()=>{ if(!(window.ZSX&&ZSX.cur&&ZSX.cur.obj===el.object3D)) toBelt(); });
  if(window.ZSX) ZSX.makeExaminable(el,Object.assign({onPick:()=>open()},EXO)); };
 el.hasLoaded?mount():el.addEventListener('loaded',mount);
 // Nachrichten planen
 const list=(step&&SMS[step])||[]; list.filter(m=>m.at==='enter').forEach(m=>setTimeout(()=>receive(m),(m.d||10)*1000));
 N.onKey=()=>list.filter(m=>m.at==='key').forEach(m=>setTimeout(()=>receive(m),(m.d||2)*1000));
 // Tasten: A/X = weiter/wählen (nur wenn das Handy angeschaut wird), Pfeile/Enter auf dem Desktop, H = Handy nehmen
 const nextBtn=()=>{ if(!N.looking) return; press(); };
 const hk=()=>document.querySelectorAll('[laser-controls]').forEach(c=>{ if(c.__nk) return; c.__nk=1; ['abuttondown','xbuttondown'].forEach(ev=>c.addEventListener(ev,nextBtn)); c.addEventListener('thumbstickmoved',e=>{ if(N.mode==='snake'&&N.looking){ const {x,y}=e.detail; if(Math.abs(x)>0.6) gTurn(Math.sign(x),0); else if(Math.abs(y)>0.6) gTurn(0,Math.sign(y)); } }); }); hk(); setTimeout(hk,2000);
 window.addEventListener('keydown',e=>{ const k=e.key; if(k==='h'||k==='H'){ if(window.ZSX&&ZSX.cur&&ZSX.cur.obj===el.object3D) ZSX.end(); else if(window.ZSX&&!ZSX.busy()&&ZSX.examine(el.object3D,Object.assign({mode:'mouse'},EXO))) open(); return; }
  if(!N.looking) return; if(N.mode==='snake'){ const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k]; if(m){ gTurn(...m); e.preventDefault(); } return; }
  if(k==='ArrowDown'||k==='ArrowRight'||k==='Enter'){ press(); e.preventDefault(); } else if(k==='ArrowUp'||k==='ArrowLeft'){ back1(); e.preventDefault(); } });
 const hp=V(), pp=V(); let last=performance.now(), acc=0, idleT=0;
 const tick=()=>{ const now=performance.now(), dt=Math.min(0.1,(now-last)/1000); last=now; const R=sc.renderer, cam=R.xr.isPresenting?R.xr.getCamera():sc.camera;
  const ex=!!(window.ZSX&&ZSX.cur&&ZSX.cur.obj===el.object3D); let near=false; if(cam&&el.object3D.parent){ cam.getWorldPosition(hp); el.object3D.getWorldPosition(pp); near=R.xr.isPresenting&&hp.distanceTo(pp)<0.36; }
  const look=ex||near; if(look&&!N.looking) open(); if(!look&&N.looking){ N.looking=false; if(N.mode==='snake') N.mode='menu'; }
  if(window.ZSX) ZSX.noRotate=ex&&N.mode==='snake';
  const tgt=look?1:(N.unread?0.55+0.45*Math.max(0,Math.sin(now*0.006)):0.12); back+=(tgt-back)*Math.min(1,dt*6);
  if(N.mode==='snake'&&N.looking){ acc+=dt; if(acc>0.16){ acc=0; if(!G.dead) gStep(); } }
  idleT+=dt; if(idleT>0.12){ idleT=0; redraw(); } };
 setInterval(tick,50); redraw(); }
function open(){ N.looking=true; if(N.unread){ N.mode='read'; N.idx=N.inbox.length-N.unread; N.page=0; N.unread=0; } else if(N.mode==='idle') N.mode=N.inbox.length?'read':'menu'; N.sel=N.sel||0; redraw(); }
function press(){ beep(1860,0.03,0.01); if(N.mode==='read'){ if(N.page<N.pages-1) N.page++; else if(N.idx<N.inbox.length-1){ N.idx++; N.page=0; } else { N.mode='menu'; N.sel=0; } }
 else if(N.mode==='menu'){ if(N.sel===0&&N.inbox.length){ N.mode='read'; N.idx=0; N.page=0; } else if(N.sel===0){ N.sel=1; } else gStart(); }
 else if(N.mode==='snake'){ if(G.dead) gStart(); } else N.mode=N.inbox.length?'read':'menu'; redraw(); }
function back1(){ if(N.mode==='read'){ if(N.page>0) N.page--; else if(N.idx>0){ N.idx--; N.page=0; } } else if(N.mode==='menu'){ N.sel=(N.sel+1)%2; } redraw(); }
function receive(m){ N.inbox.push(m); N.unread++; buzz(); setTimeout(ring,250); if(N.looking){ N.mode='read'; N.idx=N.inbox.length-1; N.page=0; N.unread=Math.max(0,N.unread-1); } redraw(); }
N.receive=receive; N.press=press; N.back=back1; N.open=open; N.snake={start:gStart,turn:gTurn,state:G};
document.addEventListener('DOMContentLoaded',()=>{ const sc=document.querySelector('a-scene'); if(!sc) return; const go=()=>setTimeout(setup,400); sc.hasLoaded?go():sc.addEventListener('loaded',go); });
})();
