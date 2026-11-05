/* v16 Warteraum: Wartenummer-Quest (offizielles Design, warteraum_quest_garfield.md).
   Spender → has.wartenummer (Nr. 42, einmal pro Schleife) → Mann im orangen Katzenkostüm (Nr. 13) nimmt sie als Blättchen (geraucht, weg)
   → has.feuerzeug (Halloween-Feuerzeug, kein Anker). Wärmt später Notiz 6 an der Büro-Pinnwand 2041 (lib/zs_notes.js).
   Schleifen-Zustand über ZSN.loop() (has/flag/trash), Wissen über MEM.know. Im Dialog nie den Comic-Namen nennen. */
(()=>{ 'use strict';
const Q=location.search;
const ld=()=>{ const L=ZSN.loop(); return L; };
const sv=L=>ZSN.saveLoop(L);
if(/[?&]invreset=1/.test(Q)) localStorage.removeItem('zs_loop');
const ITEMS={ wartenummer:{t:'Wartenummer 42',d:'Nummer zweiundvierzig. Dünnes Papier. Eigentlich zum Warten.'},
  feuerzeug:{t:'Halloween-Feuerzeug',d:'Die Flamme zittert nicht. Als hätte jemand alle Zeit der Welt.'} };
const LINES={
 g_erst:'Hey… du blinkst. Ich nicht mehr. Halloween, Freizeitheim, eine Wanne Lasagne. Ich dachte, ich schaff das.',
 g_versteck:'Im Kostüm ist noch was zum Rauchen. Extra Pfote, kommt keiner drauf. Nur: keine Blättchen. Mein Schild da? Zu steif. Zu amtlich.',
 g_hint:'Wenn du ’nen dünnen Amtszettel hast… ich wär dein Freund. Für tot-immer.',
 g_geben:'Warte. Das ist dünn. Das ist liniert. Bruder… das ist ein Blättchen mit Nummer drauf.',
 g_tausch:'Hier. Mein Feuerzeug. Geht nie aus. Ich bin tot, ich brauch kein Licht mehr. Wärm damit mal alte Zettel. Steht manchmal mehr drauf, als man denkt.',
 g_danach:'Alles easy. Die Nummer dreizehn wartet weiter. Ich auch.' };
const ERZ={ rauch:'Die Nummer ist jetzt Rauch. Die Behörde würde weinen, wenn sie könnte.' };
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
  cx.fillStyle='rgba(16,14,11,0.88)'; cx.fillRect(0,0,W,H); cx.strokeStyle='#8a7a52'; cx.lineWidth=4; cx.strokeRect(6,6,W-12,H-12);
  cx.fillStyle='#b9a77a'; cx.font='600 30px Georgia,serif'; cx.fillText(P.title,36,52);
  let y=110; if(P.sub){ cx.fillStyle='#ece3cb'; cx.font='italic 34px Georgia,serif'; y=wrap(P.sub,36,y,W-80,42)+30; }
  if(P.toast){ cx.fillStyle='#e8c070'; cx.font='600 30px Georgia,serif'; y=wrap(P.toast,36,y,W-80,38)+20; }
  const top=Math.max(y,360), n=Math.max(4,P.opts.length), rh=Math.min(80,(H-30-top)/n); P.top=top; P.rh=rh;
  P.opts.forEach((o,i)=>{ const yy=top+i*rh; cx.fillStyle='rgba(255,240,200,0.07)'; cx.fillRect(30,yy+5,W-60,rh-10); cx.fillStyle='#d8cfb8'; cx.font='600 30px Georgia,serif'; cx.fillText((i+1)+'  '+o[1],52,yy+rh/2+11); });
  tx.needsUpdate=true; };
 const inv=()=>ld();
 const invOpts=()=>{ const L=inv(), o=[]; if(L.has.wartenummer) o.push(['i_wartenummer',ITEMS.wartenummer.t],['w_wartenummer','Wartenummer wegwerfen']); if(L.has.feuerzeug) o.push(['i_feuerzeug',ITEMS.feuerzeug.t]);
  if(L.trash.includes('wartenummer')) o.push(['m_wartenummer','Mülleimer: Wartenummer zurückholen']); o.push(['zu','Schließen']); return o; };
 const openInv=(msg)=>{ P.mode='inv'; P.title='TASCHEN · Inventar'; const o=invOpts(); P.sub=o.length>1?'':'Leer. Nicht mal Kleingeld.'; P.toast=msg||''; P.opts=o; place(C.head().clone().add(new T.Vector3(0,0,-1).applyQuaternion(C.el.camera.getWorldQuaternion(new T.Quaternion())))); draw(); };
 const garOpts=()=>{ const L=inv(), f=L.flag; if(f.garfield_getauscht) return [['g_danach','Na, alles klar?'],['inv','Taschen ansehen'],['tschuess','Bis später.']];
  if(!f.gar_erst) return [['g_erst','Hey. Alles okay bei dir?'],['tschuess','Bis später.']];
  const o=[['g_versteck','Was ist mit dem Rauchen?']]; if(f.gar_versteck) o.push(L.has.wartenummer?['g_geben','Hier, meine Wartenummer. Dünnes Papier.']:['g_hint','Ich hab nichts dabei.']); o.push(['inv','Taschen ansehen'],['tschuess','Bis später.']); return o; };
 const G=C.nf.find(f=>f.F.n==='garfield'), gp=new T.Vector3(); G.el.object3D.getWorldPosition(gp);
 const GB={}; const say=(k,extra)=>{ P.sub=LINES[k]||''; P.toast=extra||''; draw(); };
 const openGar=()=>{ const L=inv(); P.mode='gar'; P.title='NR. 13 · Überdosis Lasagne'; place(gp.clone().setY(1));
  if(L.flag.garfield_getauscht) { P.opts=garOpts(); say('g_danach'); } else if(!L.flag.gar_erst){ L.flag.gar_erst=1; sv(L); P.opts=garOpts(); say('g_erst'); } else { P.opts=garOpts(); say(L.has.wartenummer?'g_versteck':'g_hint'); } };
 const choose=i=>{ const o=P.opts[i]; if(!o) return; const k=o[0];
  if(P.mode==='gar'){ if(k==='tschuess'){ P.sub='…'; close(); return; } if(k==='inv') return openInv();
   const L=inv(); if(k==='g_versteck'){ L.flag.gar_versteck=1; sv(L); }
   if(k==='g_geben'&&L.has.wartenummer){ say('g_geben'); P.opts=[]; draw(); setTimeout(()=>{ const L2=inv(); delete L2.has.wartenummer; L2.trash=L2.trash.filter(x=>x!=='wartenummer'); L2.has.feuerzeug=1; L2.flag.garfield_getauscht=1; sv(L2);
     P.opts=garOpts(); say('g_tausch','Erhalten: Halloween-Feuerzeug. — '+ERZ.rauch); C.play&&C.play('page',[gp.x,1,gp.z],0.5); },3200); return; }
   P.opts=garOpts(); say(k); return; }
  if(P.mode==='inv'){ if(k==='zu') return close(); const L=inv(), it=k.slice(2);
   if(k[0]==='w'){ delete L.has[it]; if(!L.trash.includes(it)) L.trash.push(it); sv(L); return openInv('Weggeworfen. Liegt im Mülleimer.'); }
   if(k[0]==='m'){ L.trash=L.trash.filter(x=>x!==it); L.has[it]=1; sv(L); return openInv('Zurückgeholt.'); }
   P.sub=''; P.toast=ITEMS[it].t+': '+ITEMS[it].d; draw(); } };
 const pick=uv=>{ const y=(1-uv.y)*768; if(y<P.top) return; const i=Math.floor((y-P.top)/P.rh); if(i>=0&&i<P.opts.length) choose(i); };
 // Nummernautomat (steht gebacken neben der Theke): Abriss-Zettel als 3-D-Teil + Klick
 const DP=new T.Vector3(num('dpx',-0.45),num('dpy',1.07),num('dpz',-2.13));
 const tcv=document.createElement('canvas'); tcv.width=128; tcv.height=160; const tc=tcv.getContext('2d'); const ttx=new T.CanvasTexture(tcv); ttx.colorSpace=T.SRGBColorSpace;
 const drawTk=n=>{ tc.fillStyle='#b8d8a0'; tc.fillRect(0,0,128,160); tc.fillStyle='#2a3a22'; tc.font='bold 18px Georgia,serif'; tc.textAlign='center'; tc.fillText('BÜRGERAMT',64,28); tc.font='bold 72px "Courier New",monospace'; tc.fillText(String(n),64,104); tc.font='14px Georgia,serif'; tc.fillText('Bitte warten',64,140); for(let x=0;x<128;x+=8){ tc.clearRect(x,0,4,3); } ttx.needsUpdate=true; };
 const tk=new T.Mesh(new T.PlaneGeometry(0.06,0.075),new T.MeshLambertMaterial({map:ttx,side:T.DoubleSide,emissive:0xffffff,emissiveMap:ttx,emissiveIntensity:0.25})); tk.position.copy(DP).add(new T.Vector3(0,-0.035,0.065)); tk.rotation.x=-0.35; sc.object3D.add(tk);
 const nextN=42; const showTk=()=>{ tk.visible=!inv().flag.wartenummer_gezogen; }; drawTk(nextN);
 const pull=()=>{ const L=inv(); if(L.has.wartenummer||L.trash.includes('wartenummer')) return openInv('Nur eine Nummer gleichzeitig.'); if(L.flag.wartenummer_gezogen) return openInv('Der Automat ist leer. Nächste Schleife vielleicht.');
  L.has.wartenummer=1; L.flag.wartenummer_gezogen=1; sv(L); C.play&&C.play('page',DP.toArray(),0.6); Q16.tear=1; openInv('Gezogen: Wartenummer 42. '+ITEMS.wartenummer.d); };
 const mkHit=(p,r,fn)=>{ const e=document.createElement('a-entity'); e.setAttribute('class','clickable'); e.setAttribute('geometry','primitive:sphere; radius:'+r); e.setAttribute('material','visible:false'); e.setAttribute('position',`${p.x} ${p.y} ${p.z}`); sc.appendChild(e); e.addEventListener('click',()=>{ if(C.el.renderer.xr.isPresenting) fn(); }); return e; };
 const hD=mkHit(DP,0.13,pull), hG=mkHit(gp.clone().setY(0.85),0.38,openGar);
 pe.addEventListener('click',e=>{ if(!C.el.renderer.xr.isPresenting) return; const it=e.detail&&e.detail.intersection; if(it&&it.uv) pick(it.uv); });
 // Maus/Handy
 const canvas=sc.canvas; let dn=null; canvas.addEventListener('mousedown',e=>{ dn=[e.clientX,e.clientY]; });
 canvas.addEventListener('click',e=>{ if(C.el.renderer.xr.isPresenting) return; if(dn&&Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>8) return; const r=canvas.getBoundingClientRect();
  const nd=new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1), ry=new T.Raycaster(); ry.setFromCamera(nd,C.el.camera);
  const objs=[...(pm.visible?[pm]:[]),hD.getObject3D('mesh'),hG.getObject3D('mesh')].filter(Boolean); const x=ry.intersectObjects(objs,false)[0]; if(!x||x.distance>4) return;
  setTimeout(()=>{ if(x.object===pm) pick(x.uv); else if(x.object===hD.getObject3D('mesh')) pull(); else if(x.object===hG.getObject3D('mesh')) openGar(); },0); });
 window.addEventListener('keydown',e=>{ if(e.key==='i'||e.key==='I'){ if(pm.visible&&P.mode==='inv') close(); else openInv(); } const k=+e.key; if(k>=1&&k<=6&&pm.visible) choose(k-1); });
 ['hl','hr'].forEach(id=>{ const h=document.getElementById(id); if(!h) return; ['bbuttondown','ybuttondown'].forEach(ev=>h.addEventListener(ev,()=>{ if(pm.visible&&P.mode==='inv') close(); else openInv(); })); });
 // Panel schließt, wenn man weggeht
 const tick=()=>{ if(pm.visible){ const h=C.head(); if(h.distanceTo(pm.position)>1.6) close(); } if(Q16.tear){ Q16.tear+=1; const k=Math.min(1,Q16.tear/14); tk.position.y=DP.y-0.035-0.05*k; tk.material.opacity=1-k; tk.material.transparent=true; if(k>=1){ Q16.tear=0; tk.position.y=DP.y-0.035; tk.material.opacity=1; showTk(); } } requestAnimationFrame(tick); }; tick();
 showTk(); window.__wrq={openInv,openGar,pull,close,ld,P,choose};
}
function num(k,d){ const m=new RegExp('[?&]'+k+'=(-?[0-9.]+)').exec(Q); return m?parseFloat(m[1]):d; }
reg();
})();
