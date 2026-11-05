/* v16 Warteraum: Wartenummer-Quest (Gerüst) + Notizen/Inventar.
   Nummer am Automaten neben der Theke ziehen → Inventar. Mit Nummer redet Garfield; Nummer als Blättchen-Ersatz geben (wird verbraucht)
   → Stoffbeutel aus dem Fatsuit: gebrauchtes Benzinfeuerzeug + zerknitterter Zettel. Zweiter Zettel liegt auf dem Couchtisch.
   Zustand: localStorage zs_wr_inv (JSON). Hommage an die 70er/80er (Projekt Möbius), keine Namen/Begriffe aus fremden Romanen. */
(()=>{ 'use strict';
const KEY='zs_wr_inv', Q=location.search;
const ld=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } };
const sv=st=>{ try{ localStorage.setItem(KEY,JSON.stringify(st)); }catch(e){} };
if(/[?&]invreset=1/.test(Q)) sv({});
const ITEMS={ nummer:{t:n=>'Wartenummer '+n,d:'Ein grüner Abreißzettel aus dem Automaten. Dünnes Papier.'},
  beutel:{t:()=>'Stoffbeutel (aus dem Fatsuit)',d:'Kleiner, speckiger Stoffbeutel, riecht nach Lasagne und Gras.'},
  zippo:{t:()=>'Benzinfeuerzeug, gebraucht',d:'Verkratztes Sturmfeuerzeug, Gravur fast weg: „…77“. Klappt satt. Könnte noch nützlich werden.'},
  n1:{t:()=>'Zettel: Hausmitteilung 77/4',note:1}, n2:{t:()=>'Zettel: Brief, handschriftlich',note:1} };
// Notizen – Hommage an 70er/80er Regierungs-Paranoia, eigene Welt (Projekt Möbius). Nichts verrät, wer das Kind ist.
const NOTES={
 n1:{kind:'typed',head:['BUNDESAMT FÜR ████████ · Abt. IV/7','VERTRAULICH – NUR FÜR DEN DIENSTGEBRAUCH','Hausmitteilung Nr. 77/4 · 14.10.1977'],
  body:['Betr.: Projekt MÖBIUS – Versuchsreihe „Schleife“','',
   '1. Gruppe B (Studenten, freiwillig, 200 DM Aufwands-','   entschädigung) erhielt Präparat M-12 i.v. unter',
   '   ärztlicher Aufsicht. Protokolle siehe Anlage ███.','',
   '2. Bei Proband 9 und Probandin ██ anhaltende Folgen:','   Zeitverlust, Déjà-vu-Serien, Nasenbluten.','',
   '3. Beide Probanden sind inzwischen verheiratet.','   Schwangerschaft bestätigt. ████████████████','   ██████████████████ (Abt. Leitung).','',
   '4. Das Kind ist ab Geburt unauffällig zu beobachten.','   Die Familie ist NICHT zu informieren.','',
   '   gez. Dr. ██████          Verteiler: ███, ███, Akte']},
 n2:{kind:'hand',head:['Donnerstag, spät'],
  body:['Liebling,','ich kann nicht schlafen. Seit dem Krankenhaus steht','wieder der graue Wagen gegenüber, zwei Männer, die','nie aussteigen.',
   'Die Kleine hat heute die Küchenuhr angehalten.','Nur angeschaut hat sie sie. Danach hat sie geweint','und gesagt, die Zeit „tut ihr weh“.',
   'Wir erzählen das niemandem. Nicht dem Kinderarzt,','nicht deiner Mutter. Wenn die rausfinden, was sie kann,','holen sie sie zurück in dieses Institut.',
   'Ich hab das Geld aus der Keksdose genommen.','Freitag fahren wir.','                     – H.']} };
const LINES={
 g0:'Ey… Alter… nich so laut. Zieh dir erst mal ’ne Nummer, Mann. Hier läuft alles nach Nummer. Sogar das Totsein.',
 g1:'Na, Kumpel. Du hast ’ne Nummer? Respekt. Setz dich, oder… steh halt. Alles easy.',
 wer:'Garfield, Mann. Also… nich echt. Halloween-Party, Kostüm, voll gute Laune. Und dann das Lasagne-Buffet. Drei Bleche, Alter. Drei. Überdosis Lasagne. Hätt ich nie gedacht, dass es so endet.',
 bong:'Die Bong is leer, Mann. Ich hab noch was richtig Gutes im Kostüm versteckt, im Bauchpolster. Aber keine Blättchen. Keine Blättchen im Jenseits. Kannste dir das vorstellen?',
 geben:'Ey… Papier. Dünnes, ehrliches Papier. Du bist ein Engel, Mann. Warte… hier, aus’m Bauchpolster. Das Feuerzeug brauch ich nich, ich hab ja die Bong. Und der Zettel… keine Ahnung, der war schon drin, als ich das Kostüm im Second-Hand gekauft hab.',
 danach:'Läuft, Mann. Läuft. Wenn du wieder Papier hast… du weißt, wo ich wohn.',
 tschuess:'Bis später, Mann. Ich lauf nich weg.',
 keinen:'Kein Papier, kein Spaß, Mann.' };
const reg=()=>{ const C=window.__wr&&window.__wr.comp; if(!C||!C.panel||!C.nf||!C.nf.find(f=>f.F.n==='garfield')){ setTimeout(reg,400); return; } init(C); };
function init(C){ const T=THREE, sc=C.el, Q16={};
 // eigene Tafel (wie Schalter-Tafel)
 const cv=document.createElement('canvas'); cv.width=1024; cv.height=768; const cx=cv.getContext('2d'), tx=new T.CanvasTexture(cv); tx.colorSpace=T.SRGBColorSpace; tx.anisotropy=4;
 const pm=new T.Mesh(new T.PlaneGeometry(0.64,0.48),new T.MeshBasicMaterial({map:tx,transparent:true,depthTest:false,toneMapped:false,fog:false})); pm.renderOrder=999; pm.visible=false; pm.position.set(0,-50,0); sc.object3D.add(pm);
 const pe=document.createElement('a-entity'); pe.setAttribute('class','clickable'); sc.appendChild(pe); pe.setObject3D('mesh',pm);
 const P={mode:'',opts:[],sub:'',title:'',note:null,toast:''};
 const place=(tgt)=>{ const h=C.head(), dir=tgt.clone().sub(h); dir.y=0; const L=dir.length(); dir.normalize(); const dd=Math.min(0.62,Math.max(0.35,L-0.25));
  pm.position.set(h.x+dir.x*dd,h.y-0.14,h.z+dir.z*dd); pm.lookAt(h.x,h.y-0.05,h.z); pm.visible=true; };
 const close=()=>{ pm.visible=false; pm.position.set(0,-50,0); P.mode=''; };
 const wrap=(t,x,y,w,lh)=>{ let line=''; for(const wd of t.split(' ')){ const tt=line?line+' '+wd:wd; if(cx.measureText(tt).width>w){ cx.fillText(line,x,y); y+=lh; line=wd; } else line=tt; } cx.fillText(line,x,y); return y; };
 const draw=()=>{ const W=1024,H=768; cx.clearRect(0,0,W,H);
  if(P.mode==='note'){ const N=NOTES[P.note];
   cx.fillStyle=N.kind==='typed'?'#e4dcc3':'#efe6cf'; cx.fillRect(40,20,W-80,H-40); // Papier
   for(let i=0;i<2600;i++){ const v=Math.random()*40|0; cx.fillStyle=`rgba(${110+v},${90+v},${60+v},0.05)`; cx.fillRect(40+Math.random()*(W-80),20+Math.random()*(H-40),2,2); }
   cx.strokeStyle='rgba(90,70,40,0.18)'; cx.lineWidth=2; for(let i=0;i<5;i++){ cx.beginPath(); cx.moveTo(40,120+i*140+Math.random()*20); cx.lineTo(W-40,100+i*150+Math.random()*30); cx.stroke(); } // Knitterfalten
   if(N.kind==='typed'){ cx.fillStyle='#1d1a16'; cx.font='bold 26px "Courier New",Courier,monospace'; let y=70; N.head.forEach(l=>{ cx.fillText(l,70,y); y+=32; });
    cx.fillRect(70,y-14,W-140,2); y+=26; cx.font='24px "Courier New",Courier,monospace';
    N.body.forEach(l=>{ const parts=l.split(/(█+)/); let x=70; parts.forEach(pt=>{ if(/█/.test(pt)){ const w=cx.measureText(pt).width; cx.fillStyle='#0c0b0a'; cx.fillRect(x,y-20,w,25); x+=w; } else { cx.fillStyle='rgba(29,26,22,'+(0.82+Math.random()*0.18)+')'; cx.fillText(pt,x,y); x+=cx.measureText(pt).width; } }); y+=29; });
    cx.save(); cx.translate(800,150); cx.rotate(-0.2); cx.strokeStyle='rgba(170,30,30,0.7)'; cx.lineWidth=5; cx.strokeRect(-130,-36,260,72); cx.fillStyle='rgba(170,30,30,0.7)'; cx.font='bold 34px "Courier New",monospace'; cx.textAlign='center'; cx.fillText('GEHEIM',0,12); cx.restore(); }
   else { cx.fillStyle='#22305e'; cx.font='italic 31px "Segoe Script","Bradley Hand","URW Chancery L","Comic Sans MS",cursive'; let y=80; N.head.forEach(l=>{ cx.fillText(l,W-330,y); y+=40; }); y+=10;
    N.body.forEach((l,i)=>{ cx.save(); cx.translate(80,y); cx.rotate(-0.008+0.004*Math.sin(i)); cx.fillText(l,0,0); cx.restore(); y+=40; }); }
   cx.fillStyle='rgba(16,14,11,0.86)'; cx.fillRect(40,H-70,W-80,50); cx.fillStyle='#d8cfb8'; cx.font='600 28px Georgia,serif'; cx.fillText('Klick / Trigger: weglegen',60,H-36); tx.needsUpdate=true; return; }
  cx.fillStyle='rgba(16,14,11,0.88)'; cx.fillRect(0,0,W,H); cx.strokeStyle='#8a7a52'; cx.lineWidth=4; cx.strokeRect(6,6,W-12,H-12);
  cx.fillStyle='#b9a77a'; cx.font='600 30px Georgia,serif'; cx.fillText(P.title,36,52);
  let y=110; if(P.sub){ cx.fillStyle='#ece3cb'; cx.font='italic 34px Georgia,serif'; y=wrap(P.sub,36,y,W-80,42)+30; }
  if(P.toast){ cx.fillStyle='#e8c070'; cx.font='600 30px Georgia,serif'; y=wrap(P.toast,36,y,W-80,38)+20; }
  const top=Math.max(y,360), n=Math.max(4,P.opts.length), rh=Math.min(80,(H-30-top)/n); P.top=top; P.rh=rh;
  P.opts.forEach((o,i)=>{ const yy=top+i*rh; cx.fillStyle='rgba(255,240,200,0.07)'; cx.fillRect(30,yy+5,W-60,rh-10); cx.fillStyle='#d8cfb8'; cx.font='600 30px Georgia,serif'; cx.fillText((i+1)+'  '+o[1],52,yy+rh/2+11); });
  tx.needsUpdate=true; };
 const inv=()=>ld();
 const invOpts=()=>{ const st=inv(), o=[]; if(st.nummer) o.push(['i_nummer',ITEMS.nummer.t(st.nummer)]); ['beutel','zippo','n1','n2'].forEach(k=>{ if(st[k]) o.push(['i_'+k,ITEMS[k].t()]); }); o.push(['zu','Schließen']); return o; };
 const openInv=(msg)=>{ P.mode='inv'; P.title='TASCHEN · Inventar'; const o=invOpts(); P.sub=o.length>1?'':'Leer. Nicht mal Kleingeld.'; P.toast=msg||''; P.opts=o; place(C.head().clone().add(new T.Vector3(0,0,-1).applyQuaternion(C.el.camera.getWorldQuaternion(new T.Quaternion())))); draw(); };
 const openNote=k=>{ P.mode='note'; P.note=k; draw(); };
 const garOpts=()=>{ const st=inv(); if(!st.nummer&&!st.gar) return [['tschuess','Okay, okay.']]; const o=[['wer','Wer bist du denn?'],['bong','Was ist mit der Bong?']];
  if(!st.gar&&st.nummer) o.push(['geben','Hier, nimm meine Wartenummer als Blättchen.']); o.push(['inv','Taschen ansehen'],['tschuess','Bis später.']); return o; };
 const G=C.nf.find(f=>f.F.n==='garfield'), gp=new T.Vector3(); G.el.object3D.getWorldPosition(gp);
 const GB={}; const say=(k,extra)=>{ P.sub=LINES[k]||''; P.toast=extra||''; draw(); speak(k); };
 const speak=k=>{ /* Platzhalter: TTS-Zeilen garfield_<k>.mp3 können später in assets/warteraum/audio/ (fehlen = still) */ if(!C.ac||!C.pan) return; const n='gar_'+k; (GB[n]||(GB[n]=fetch('../assets/warteraum/audio/'+n+'.mp3?v=16').then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer(); }).then(b=>new Promise((res,rej)=>C.ac.decodeAudioData(b,res,rej))))).then(b=>{ const s=C.ac.createBufferSource(); s.buffer=b; s.connect(C.pan([gp.x,1.0,gp.z],1.2,1)); s.start(); }).catch(()=>{}); };
 const openGar=()=>{ const st=inv(); P.mode='gar'; P.title='GARFIELD · Nr. 13 · Überdosis Lasagne'; P.opts=garOpts(); place(gp.clone().setY(1)); say(st.gar?'danach':st.nummer?'g1':'g0'); };
 const choose=i=>{ const o=P.opts[i]; if(!o) return; const k=o[0];
  if(P.mode==='gar'){ if(k==='tschuess'){ say('tschuess'); setTimeout(()=>{ if(P.mode==='gar') close(); },2200); return; } if(k==='inv') return openInv();
   if(k==='geben'){ const st=inv(); delete st.nummer; st.gar=1; /* PLATZHALTER-Geschenk (v16-Gerüst): Inhalt/Verwendung später festlegen */ st.beutel=1; st.zippo=1; st.n1=1; sv(st); P.opts=garOpts(); say('geben','Erhalten: Stoffbeutel – darin ein gebrauchtes Benzinfeuerzeug und ein zerknitterter Zettel.'); C.play&&C.play('page',[gp.x,1,gp.z],0.5); return; }
   P.opts=garOpts(); say(k); return; }
  if(P.mode==='inv'){ if(k==='zu') return close(); const it=k.slice(2), st=inv(); if(ITEMS[it].note) return openNote(it); P.sub=''; P.toast=ITEMS[it].t(st.nummer)+': '+ITEMS[it].d; draw(); } };
 const pick=uv=>{ if(P.mode==='note'){ P.mode='inv'; return openInv(); } const y=(1-uv.y)*768; if(y<P.top) return; const i=Math.floor((y-P.top)/P.rh); if(i>=0&&i<P.opts.length) choose(i); };
 // Nummernautomat (steht gebacken neben der Theke): Abriss-Zettel als 3-D-Teil + Klick
 const DP=new T.Vector3(num('dpx',-0.45),num('dpy',1.07),num('dpz',-2.13));
 const tcv=document.createElement('canvas'); tcv.width=128; tcv.height=160; const tc=tcv.getContext('2d'); const ttx=new T.CanvasTexture(tcv); ttx.colorSpace=T.SRGBColorSpace;
 const drawTk=n=>{ tc.fillStyle='#b8d8a0'; tc.fillRect(0,0,128,160); tc.fillStyle='#2a3a22'; tc.font='bold 18px Georgia,serif'; tc.textAlign='center'; tc.fillText('BÜRGERAMT',64,28); tc.font='bold 72px "Courier New",monospace'; tc.fillText(String(n),64,104); tc.font='14px Georgia,serif'; tc.fillText('Bitte warten',64,140); for(let x=0;x<128;x+=8){ tc.clearRect(x,0,4,3); } ttx.needsUpdate=true; };
 const tk=new T.Mesh(new T.PlaneGeometry(0.06,0.075),new T.MeshLambertMaterial({map:ttx,side:T.DoubleSide,emissive:0xffffff,emissiveMap:ttx,emissiveIntensity:0.25})); tk.position.copy(DP).add(new T.Vector3(0,-0.035,0.065)); tk.rotation.x=-0.35; sc.object3D.add(tk);
 const st0=inv(); let nextN=st0.next||(40+((Date.now()/1000|0)%50)); drawTk(nextN);
 const pull=()=>{ const st=inv(); if(st.nummer){ return openInv('Du hast schon eine Nummer ('+st.nummer+'). Mehr gibt der Automat nicht her.'); }
  st.nummer=nextN; nextN+=1+(Math.random()*3|0); st.next=nextN; sv(st); C.play&&C.play('page',DP.toArray(),0.6); Q16.tear=1; openInv('Gezogen: Wartenummer '+st.nummer+'. Angezeigt wird gerade die '+((C.flip&&C.flip.n)||4)+'.'); };
 const mkHit=(p,r,fn)=>{ const e=document.createElement('a-entity'); e.setAttribute('class','clickable'); e.setAttribute('geometry','primitive:sphere; radius:'+r); e.setAttribute('material','visible:false'); e.setAttribute('position',`${p.x} ${p.y} ${p.z}`); sc.appendChild(e); e.addEventListener('click',()=>{ if(C.el.renderer.xr.isPresenting) fn(); }); return e; };
 const hD=mkHit(DP,0.13,pull), hG=mkHit(gp.clone().setY(0.85),0.38,openGar);
 // Zettel 2 auf dem Couchtisch (zerknittert, vergilbt)
 const ncv=document.createElement('canvas'); ncv.width=128; ncv.height=128; const nc=ncv.getContext('2d'); nc.fillStyle='#d9cfae'; nc.fillRect(0,0,128,128); nc.strokeStyle='#2a3566'; nc.lineWidth=2; for(let i=0;i<9;i++){ nc.beginPath(); nc.moveTo(14,20+i*11); for(let x=14;x<112;x+=6) nc.lineTo(x,20+i*11+2*Math.sin(x*0.4+i)); nc.stroke(); }
 const ntx=new T.CanvasTexture(ncv); ntx.colorSpace=T.SRGBColorSpace; const ng=new T.PlaneGeometry(0.13,0.16,6,6); const pa=ng.attributes.position; for(let i=0;i<pa.count;i++) pa.setZ(i,0.006*Math.sin(pa.getX(i)*70)*Math.cos(pa.getY(i)*55));
 ng.computeVertexNormals(); const nm=new T.Mesh(ng,new T.MeshLambertMaterial({map:ntx,side:T.DoubleSide,emissive:0xffffff,emissiveMap:ntx,emissiveIntensity:0.18})); const NP=new T.Vector3(-1.6+(C.tableDX||0.62)+0.18,0.512,0.28); nm.position.copy(NP); nm.rotation.set(-Math.PI/2,0,0.5); sc.object3D.add(nm);
 const takeNote=()=>{ const st=inv(); if(!st.n2){ st.n2=1; sv(st); } nm.visible=false; hN.setAttribute('position','0 -50 0'); P.mode='inv'; place(NP); openNote('n2'); };
 const hN=mkHit(NP,0.12,takeNote); if(inv().n2){ nm.visible=false; hN.setAttribute('position','0 -50 0'); }
 pe.addEventListener('click',e=>{ if(!C.el.renderer.xr.isPresenting) return; const it=e.detail&&e.detail.intersection; if(it&&it.uv) pick(it.uv); });
 // Maus/Handy
 const canvas=sc.canvas; let dn=null; canvas.addEventListener('mousedown',e=>{ dn=[e.clientX,e.clientY]; });
 canvas.addEventListener('click',e=>{ if(C.el.renderer.xr.isPresenting) return; if(dn&&Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>8) return; const r=canvas.getBoundingClientRect();
  const nd=new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1), ry=new T.Raycaster(); ry.setFromCamera(nd,C.el.camera);
  const objs=[...(pm.visible?[pm]:[]),hD.getObject3D('mesh'),hG.getObject3D('mesh'),...(nm.visible?[hN.getObject3D('mesh')]:[])].filter(Boolean); const x=ry.intersectObjects(objs,false)[0]; if(!x||x.distance>4) return;
  setTimeout(()=>{ if(x.object===pm) pick(x.uv); else if(x.object===hD.getObject3D('mesh')) pull(); else if(x.object===hG.getObject3D('mesh')) openGar(); else takeNote(); },0); });
 window.addEventListener('keydown',e=>{ if(e.key==='i'||e.key==='I'){ if(pm.visible&&P.mode==='inv') close(); else openInv(); } const k=+e.key; if(k>=1&&k<=6&&pm.visible&&P.mode!=='note') choose(k-1); else if(pm.visible&&P.mode==='note'&&(e.key===' '||e.key==='Escape')) openInv(); });
 ['hl','hr'].forEach(id=>{ const h=document.getElementById(id); if(!h) return; ['bbuttondown','ybuttondown'].forEach(ev=>h.addEventListener(ev,()=>{ if(pm.visible&&P.mode==='inv') close(); else openInv(); })); });
 // Panel schließt, wenn man weggeht
 const tick=()=>{ if(pm.visible){ const h=C.head(); if(h.distanceTo(pm.position)>1.6) close(); } if(Q16.tear){ Q16.tear+=1; const k=Math.min(1,Q16.tear/14); tk.position.y=DP.y-0.035-0.05*k; tk.material.opacity=1-k; tk.material.transparent=true; if(k>=1){ Q16.tear=0; tk.position.y=DP.y-0.035; tk.material.opacity=1; drawTk(nextN); } } requestAnimationFrame(tick); }; tick();
 window.__wrq={openInv,openGar,openNote,pull,takeNote,close,ld,P};
}
function num(k,d){ const m=new RegExp('[?&]'+k+'=(-?[0-9.]+)').exec(Q); return m?parseFloat(m[1]):d; }
reg();
})();
