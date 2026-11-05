/* v22 Warteraum: Wartenummer-Quest ohne Auswahlmenü (Pete 05.11.).
   Spender → Wartenummer 42 NUR ins Inventar. Kostüm-Mann (Nr. 13) erzählt zuerst seine Geschichte und labert weiter – keine Optionsliste.
   Spieler öffnet selbst die Taschen (Taste i / B/Y), nimmt die Nummer in die Hand und wendet sie auf ihn an (klassisch Gegenstand auf Figur).
   → Nummer verbraucht, Halloween-Feuerzeug (has.feuerzeug, kein Anker) im Inventar. Sprache: ElevenLabs (assets/warteraum/audio/g_*.mp3, e_*.mp3).
   Keine Lösungs-Hinweise im Dialog. Im Dialog nie den Comic-Namen nennen. */
(()=>{ 'use strict';
const Q=location.search;
const ld=()=>ZSN.loop();
const sv=L=>ZSN.saveLoop(L);
if(/[?&]invreset=1/.test(Q)) localStorage.removeItem('zs_loop');
const ITEMS={ wartenummer:{t:'Wartenummer 42',d:'Nummer zweiundvierzig.',a:'e_nummer',c:'#b8d8a0'},
  feuerzeug:{t:'Halloween-Feuerzeug',d:'Die Flamme zittert nicht. Als hätte jemand alle Zeit der Welt.',a:'e_feuer',c:'#e89a3a'} };
const LINES={
 g_erst:'Hey… du blinkst. Ich nicht mehr. Halloween, Freizeitheim, eine Wanne Lasagne. Ich dachte, ich schaff das.',
 g_versteck:'Im Kostüm ist noch was zum Rauchen. Extra Pfote, kommt keiner drauf. Nur… keine Blättchen. Gar keins. Typisch.',
 g_laber:'Die Lasagne war das Problem nicht. Das Tempo war das Problem. Oder die zweite Wanne. Egal.',
 g_geben:'Warte. Das ist… dünn. Liniert. Bruder.',
 g_tausch:'Hier. Mein Feuerzeug. Geht nie aus. Ich bin tot, ich brauch kein Licht mehr.',
 g_danach:'Alles easy. Die Nummer dreizehn wartet weiter. Ich auch.' };
const ERZ={ rauch:'Die Nummer ist jetzt Rauch. Die Behörde würde weinen, wenn sie könnte.' };
const reg=()=>{ const C=window.__wr&&window.__wr.comp; if(!C||!C.nf||!C.nf.find(f=>f.F.n==='garfield')){ setTimeout(reg,400); return; } init(C); };
function init(C){ const T=THREE, sc=C.el, st={tear:0,hand:null,busy:0,src:null};
 const BASE=(window.WR_BASE||'../assets/warteraum/');
 // Tafel (Dialog/Taschen) – reine Anzeige, keine Optionsliste
 const cv=document.createElement('canvas'); cv.width=1024; cv.height=640; const cx=cv.getContext('2d'), tx=new T.CanvasTexture(cv); tx.colorSpace=T.SRGBColorSpace; tx.anisotropy=4;
 const pm=new T.Mesh(new T.PlaneGeometry(0.64,0.4),new T.MeshBasicMaterial({map:tx,transparent:true,depthTest:false,toneMapped:false,fog:false})); pm.renderOrder=999; pm.visible=false; pm.position.set(0,-50,0); sc.object3D.add(pm);
 const pe=document.createElement('a-entity'); pe.setAttribute('class','clickable'); sc.appendChild(pe); pe.setObject3D('mesh',pm);
 const P={mode:'',title:'',sub:'',toast:'',slots:[]};
 const camDir=()=>new T.Vector3(0,0,-1).applyQuaternion(C.el.camera.getWorldQuaternion(new T.Quaternion()));
 const place=tgt=>{ const h=C.head(), dir=tgt.clone().sub(h); dir.y=0; const L=dir.length(); dir.normalize(); const dd=Math.min(0.62,Math.max(0.35,L-0.25));
  pm.position.set(h.x+dir.x*dd,h.y-0.14,h.z+dir.z*dd); pm.lookAt(h.x,h.y-0.05,h.z); pm.visible=true; };
 const close=()=>{ pm.visible=false; pm.position.set(0,-50,0); P.mode=''; };
 const wrap=(t,x,y,w,lh)=>{ let line=''; for(const wd of t.split(' ')){ const tt=line?line+' '+wd:wd; if(cx.measureText(tt).width>w){ cx.fillText(line,x,y); y+=lh; line=wd; } else line=tt; } cx.fillText(line,x,y); return y; };
 const draw=()=>{ const W=1024,H=640; cx.clearRect(0,0,W,H);
  cx.fillStyle='rgba(16,14,11,0.88)'; cx.fillRect(0,0,W,H); cx.strokeStyle='#8a7a52'; cx.lineWidth=4; cx.strokeRect(6,6,W-12,H-12);
  cx.fillStyle='#b9a77a'; cx.font='600 30px Georgia,serif'; cx.fillText(P.title,36,52);
  let y=112; if(P.sub){ cx.fillStyle='#ece3cb'; cx.font='italic 36px Georgia,serif'; y=wrap(P.sub,36,y,W-80,46)+30; }
  if(P.mode==='inv'){ P.slots=[]; const L=ld(), its=Object.keys(ITEMS).filter(k=>L.has[k]);
   if(!its.length){ cx.fillStyle='#ece3cb'; cx.font='italic 34px Georgia,serif'; cx.fillText('Leer. Nicht mal Kleingeld.',36,170); }
   its.forEach((k,i)=>{ const x=36+i*250, yy=100, w=220, h=300, sel=st.hand===k; P.slots.push([x,yy,w,h,k]);
    cx.fillStyle=sel?'rgba(255,220,140,0.22)':'rgba(255,240,200,0.07)'; cx.fillRect(x,yy,w,h); cx.strokeStyle=sel?'#ffd27a':'#6a5e44'; cx.lineWidth=sel?6:3; cx.strokeRect(x,yy,w,h);
    if(k==='wartenummer'){ cx.fillStyle='#b8d8a0'; cx.fillRect(x+50,yy+30,120,150); cx.fillStyle='#2a3a22'; cx.textAlign='center'; cx.font='bold 16px Georgia,serif'; cx.fillText('BÜRGERAMT',x+110,yy+56); cx.font='bold 64px "Courier New",monospace'; cx.fillText('42',x+110,yy+132); cx.textAlign='left'; }
    else { cx.fillStyle='#3a2a18'; cx.fillRect(x+80,yy+70,60,110); cx.fillStyle='#e89a3a'; cx.fillRect(x+84,yy+74,52,102); cx.fillStyle='#222'; cx.fillRect(x+92,yy+48,36,22); const g=cx.createRadialGradient(x+110,yy+30,2,x+110,yy+30,26); g.addColorStop(0,'rgba(255,240,180,1)'); g.addColorStop(1,'rgba(255,140,40,0)'); cx.fillStyle=g; cx.fillRect(x+80,yy,60,56); cx.fillStyle='#111'; cx.beginPath(); cx.arc(x+102,yy+120,7,0,7); cx.arc(x+120,yy+120,7,0,7); cx.fill(); }
    cx.fillStyle=sel?'#ffd27a':'#d8cfb8'; cx.font='600 24px Georgia,serif'; wrap(ITEMS[k].t,x+14,yy+225,w-24,28); });
   if(P.toast){ cx.fillStyle='#e8c070'; cx.font='italic 30px Georgia,serif'; wrap(P.toast,36,470,W-80,38); } }
  else if(P.toast){ cx.fillStyle='#e8c070'; cx.font='600 30px Georgia,serif'; wrap(P.toast,36,Math.max(y,470),W-80,38); }
  tx.needsUpdate=true; };
 // Sprache (ElevenLabs-Dateien), räumlich aus der Figur
 const bufs={}; const G=C.nf.find(f=>f.F.n==='garfield'), gp=new T.Vector3(); G.el.object3D.getWorldPosition(gp);
 const voice=(n,pos,cb)=>{ try{ if(st.src){ st.src.onended=null; st.src.stop(); } }catch(e){} st.src=null; const ac=C.ac; if(!ac){ if(cb) setTimeout(cb,(LINES[n]||'').length*65+600); return; }
  if(ac.state==='suspended') ac.resume();
  (bufs[n]||(bufs[n]=fetch(BASE+'audio/'+n+'.mp3?v=22').then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer(); }).then(b=>new Promise((res,rej)=>ac.decodeAudioData(b,res,rej))))).then(b=>{ const s=ac.createBufferSource(); s.buffer=b; const g=ac.createGain(); g.gain.value=1.15; s.connect(g); g.connect(pos?C.pan(pos,1.2,1):ac.destination); s.onended=()=>{ if(st.src===s) st.src=null; if(cb) cb(); }; s.start(); st.src=s; window.__wrq&&(window.__wrq.last=n); })
   .catch(()=>{ if(cb) setTimeout(cb,(LINES[n]||'').length*65+600); }); };
 const GPOS=[gp.x,1.0,gp.z];
 // Taschen
 const openInv=msg=>{ P.mode='inv'; P.title='TASCHEN'+(st.hand?' · in der Hand: '+ITEMS[st.hand].t:''); P.sub=''; P.toast=msg||''; place(C.head().clone().add(camDir())); draw(); };
 const pickSlot=k=>{ const L=ld(); if(!L.has[k]) return; if(st.hand===k){ st.hand=null; openInv(''); return; } st.hand=k; openInv(ITEMS[k].d); voice(ITEMS[k].a,null); hud(); setTimeout(()=>{ if(P.mode==='inv'&&st.hand===k) close(); },1600); };
 // Hand-Anzeige (kleiner Zettel/Feuerzeug unten im Blickfeld)
 const hc=document.createElement('canvas'); hc.width=256; hc.height=64; const hx=hc.getContext('2d'), htx=new T.CanvasTexture(hc); htx.colorSpace=T.SRGBColorSpace;
 const hm=new T.Mesh(new T.PlaneGeometry(0.16,0.04),new T.MeshBasicMaterial({map:htx,transparent:true,depthTest:false,toneMapped:false,fog:false})); hm.renderOrder=1000; hm.visible=false; C.el.camera.add(hm); hm.position.set(0,-0.13,-0.4);
 const hud=()=>{ hx.clearRect(0,0,256,64); if(st.hand){ hx.fillStyle='rgba(16,14,11,0.75)'; hx.fillRect(0,0,256,64); hx.fillStyle=ITEMS[st.hand].c; hx.fillRect(8,10,30,44); hx.fillStyle='#ece3cb'; hx.font='600 22px Georgia,serif'; hx.fillText(ITEMS[st.hand].t,48,40); } hm.visible=!!st.hand; htx.needsUpdate=true; };
 // Gespräch: erst die Sterbegeschichte, dann seine Geschichte weiter (kein Tipp, keine Optionen)
 const showLine=(k,toast)=>{ P.mode='gar'; P.title='NR. 13 · Überdosis Lasagne'; P.sub=LINES[k]; P.toast=toast||''; place(gp.clone().setY(1)); draw(); };
 const talk=(force)=>{ if(st.busy) return; const L=ld(), f=L.flag; if(!force&&st.hand){ return apply(st.hand); }
  let k; if(f.garfield_getauscht) k='g_danach'; else if(!f.gar_erst){ f.gar_erst=1; k='g_erst'; } else if(!f.gar_versteck){ f.gar_versteck=1; k='g_versteck'; } else { f.gar_n=(f.gar_n||0)+1; k=f.gar_n%2?'g_laber':'g_versteck'; }
  sv(L); showLine(k); voice(k,GPOS); };
 const apply=k=>{ const L=ld(); if(L.flag.garfield_getauscht||k!=='wartenummer'||!L.has.wartenummer){ st.hand=null; hud(); return talk(true); }
  if(!L.flag.gar_erst){ return talk(true); /* Hand behalten – erst die Geschichte */ }
  st.busy=1; st.hand=null; hud(); showLine('g_geben'); voice('g_geben',GPOS,()=>{ const L2=ld(); delete L2.has.wartenummer; L2.trash=(L2.trash||[]).filter(x=>x!=='wartenummer'); L2.has.feuerzeug=1; L2.flag.garfield_getauscht=1; sv(L2);
   C.play&&C.play('page',GPOS,0.5); showLine('g_tausch','Erhalten: Halloween-Feuerzeug'); voice('g_tausch',GPOS,()=>{ P.toast=ERZ.rauch; draw(); voice('e_rauch',null,()=>{ st.busy=0; }); }); }); };
 const pickPanel=uv=>{ if(P.mode!=='inv'){ close(); return; } const x=uv.x*1024, y=(1-uv.y)*640; const s=P.slots.find(([sx,sy,w,h])=>x>=sx&&x<=sx+w&&y>=sy&&y<=sy+h); if(s) pickSlot(s[4]); else close(); };
 // Nummernautomat: Abriss-Zettel + Klick → nur ins Inventar
 const DP=new T.Vector3(num('dpx',-0.45),num('dpy',1.07),num('dpz',-2.13));
 const tcv=document.createElement('canvas'); tcv.width=128; tcv.height=160; const tc=tcv.getContext('2d'); const ttx=new T.CanvasTexture(tcv); ttx.colorSpace=T.SRGBColorSpace;
 const drawTk=n=>{ tc.fillStyle='#b8d8a0'; tc.fillRect(0,0,128,160); tc.fillStyle='#2a3a22'; tc.font='bold 18px Georgia,serif'; tc.textAlign='center'; tc.fillText('BÜRGERAMT',64,28); tc.font='bold 72px "Courier New",monospace'; tc.fillText(String(n),64,104); tc.font='14px Georgia,serif'; tc.fillText('Bitte warten',64,140); for(let x=0;x<128;x+=8){ tc.clearRect(x,0,4,3); } ttx.needsUpdate=true; };
 const tk=new T.Mesh(new T.PlaneGeometry(0.06,0.075),new T.MeshLambertMaterial({map:ttx,side:T.DoubleSide,emissive:0xffffff,emissiveMap:ttx,emissiveIntensity:0.25})); tk.position.copy(DP).add(new T.Vector3(0,-0.035,num('dtz',0.065))); tk.rotation.x=-0.35; sc.object3D.add(tk);
 const showTk=()=>{ tk.visible=!ld().flag.wartenummer_gezogen; }; drawTk(42);
 const pull=()=>{ const L=ld(); if(L.has.wartenummer) return openInv('Nur eine Nummer gleichzeitig.'); if(L.flag.wartenummer_gezogen) return openInv('Der Automat ist leer.');
  L.has.wartenummer=1; L.flag.wartenummer_gezogen=1; sv(L); C.play&&C.play('page',DP.toArray(),0.6); st.tear=1; openInv('Wartenummer 42 eingesteckt.'); setTimeout(()=>{ if(P.mode==='inv'&&!st.hand) close(); },2200); };
 const mkHit=(p,r,fn)=>{ const e=document.createElement('a-entity'); e.setAttribute('class','clickable'); e.setAttribute('geometry','primitive:sphere; radius:'+r); e.setAttribute('material','visible:false'); e.setAttribute('position',`${p.x} ${p.y} ${p.z}`); sc.appendChild(e); e.addEventListener('click',()=>{ if(C.el.renderer.xr.isPresenting) fn(); }); return e; };
 const hD=mkHit(DP,0.13,pull), hG=mkHit(gp.clone().setY(0.85),0.38,talk);
 pe.addEventListener('click',e=>{ if(!C.el.renderer.xr.isPresenting) return; const it=e.detail&&e.detail.intersection; if(it&&it.uv) pickPanel(it.uv); });
 // Maus/Handy
 const canvas=sc.canvas; let dn=null; canvas.addEventListener('mousedown',e=>{ dn=[e.clientX,e.clientY]; });
 const clickAt=(nx,ny)=>{ const ry=new T.Raycaster(); ry.setFromCamera(new T.Vector2(nx,ny),C.el.camera);
  const objs=[...(pm.visible?[pm]:[]),hD.getObject3D('mesh'),hG.getObject3D('mesh')].filter(Boolean); const x=ry.intersectObjects(objs,false)[0]; if(!x||x.distance>8){ if(pm.visible&&P.mode==='inv') close(); return; }
  if(x.object===pm) pickPanel(x.uv); else if(x.object===hD.getObject3D('mesh')) pull(); else if(x.object===hG.getObject3D('mesh')) talk(); };
 canvas.addEventListener('click',e=>{ if(C.el.renderer.xr.isPresenting) return; if(dn&&Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>8) return; const r=canvas.getBoundingClientRect(); setTimeout(()=>clickAt((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),0); });
 const toggleInv=()=>{ if(pm.visible&&P.mode==='inv') close(); else openInv(); };
 window.addEventListener('keydown',e=>{ if(e.key==='i'||e.key==='I') toggleInv(); if(e.key==='Escape'){ close(); if(st.hand){ st.hand=null; hud(); } } });
 ['hl','hr'].forEach(id=>{ const h=document.getElementById(id); if(!h) return; ['bbuttondown','ybuttondown'].forEach(ev=>h.addEventListener(ev,toggleInv)); });
 const tick=()=>{ if(pm.visible){ const h=C.head(); if(h.distanceTo(pm.position)>1.6) close(); } if(st.tear){ st.tear+=1; const k=Math.min(1,st.tear/14); tk.position.y=DP.y-0.035-0.05*k; tk.material.opacity=1-k; tk.material.transparent=true; if(k>=1){ st.tear=0; tk.position.y=DP.y-0.035; tk.material.opacity=1; showTk(); } } requestAnimationFrame(tick); }; tick();
 showTk(); window.__wrq={openInv,talk,pull,close,toggle:toggleInv,ld,P,st,pickSlot,clickAt,apply};
}
function num(k,d){ const m=new RegExp('[?&]'+k+'=(-?[0-9.]+)').exec(Q); return m?parseFloat(m[1]):d; }
reg();
})();
