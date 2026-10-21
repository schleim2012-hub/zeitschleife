/* Rewind – Resident-Evil-Türüberblendung (wiederverwendbar, aktuell nur in der Wohnung).
   aptDoorTrans(sceneEl,{swap(), done(), getHead()}) : Abblende → im Dunkeln steht eine einzelne Tür ~1,5 m vor dem Spieler
   (weltfest, nicht kopffest), Klinke klickt, Tür schwingt knarzend auf, Schritte, Abblende → swap() (Raumwechsel) → Aufblende.
   Kamera wird nie künstlich bewegt; man kann sich umsehen, das Umfeld ist schwarz. Trigger/Klick/Leertaste = abbrechen.
   Alle Klänge werden zur Laufzeit synthetisiert (WebAudio, eigene Erzeugung). */
(function(){
const T=()=>THREE;
let ac=null; const AC=()=>{ try{ if(!ac) ac=window.__zsaAC||(window.__zsaAC=new (window.AudioContext||window.webkitAudioContext)()); ac.resume&&ac.resume(); }catch(e){} return ac; };
function noise(dur,shape){ const a=AC(); const n=Math.max(1,Math.floor(a.sampleRate*dur)), b=a.createBuffer(1,n,a.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*shape(i/n,i/a.sampleRate); return b; }
function play(buf,{f=1000,q=1,type='bandpass',vol=0.3,at=0}={}){ const a=AC(); if(!a) return; const s=a.createBufferSource(); s.buffer=buf; const fl=a.createBiquadFilter(); fl.type=type; fl.frequency.value=f; fl.Q.value=q; const g=a.createGain(); g.gain.value=vol; s.connect(fl); fl.connect(g); g.connect(OUT()); s.start(a.currentTime+at); return s; }
let out=null; const OUT=()=>{ const a=AC(); if(!out){ out=a.createGain(); out.gain.value=1; const c=a.createDynamicsCompressor(); out.connect(c); c.connect(a.destination); } return out; };
const SND={
 latch(at=0){ // Klinke runter + Schnapper
  play(noise(0.05,k=>Math.pow(1-k,3)),{f:2600,q:2.5,vol:0.55,at}); play(noise(0.04,k=>Math.pow(1-k,4)),{f:1500,q:4,vol:0.5,at:at+0.11}); play(noise(0.09,k=>Math.pow(1-k,2)*0.7),{f:420,q:1.2,vol:0.45,at:at+0.12}); },
 creak(at=0,dur=1.9){ // Holz-Knarzen: Sägezahn mit schwankender Tonhöhe durch zwei Bandpässe, Reibungs-Ruckeln
  const a=AC(); if(!a) return; const t=a.currentTime+at; const o=a.createOscillator(); o.type='sawtooth'; const f1=a.createBiquadFilter(), f2=a.createBiquadFilter(); f1.type=f2.type='bandpass'; f1.frequency.value=820; f1.Q.value=6; f2.frequency.value=1900; f2.Q.value=9;
  const g=a.createGain(); g.gain.setValueAtTime(0,t); const steps=60; for(let i=0;i<=steps;i++){ const k=i/steps, tt=t+k*dur; const stick=0.35+0.65*Math.abs(Math.sin(k*23+Math.sin(k*7)*3)); g.gain.linearRampToValueAtTime(0.11*Math.sin(Math.PI*Math.min(1,k*1.15))*stick,tt); o.frequency.linearRampToValueAtTime(70+55*Math.sin(k*5.3)+40*k+18*Math.sin(k*41),tt); }
  g.gain.linearRampToValueAtTime(0,t+dur+0.05); const mix=a.createGain(); mix.gain.value=1; o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(OUT()); o.start(t); o.stop(t+dur+0.1);
  play(noise(dur,(k,s)=>0.25*Math.sin(Math.PI*k)*(0.6+0.4*Math.sin(s*90))),{f:300,q:0.7,type:'lowpass',vol:0.25,at}); },
 step(at=0,v=0.5){ play(noise(0.16,k=>Math.pow(1-k,5)),{f:180,q:0.9,type:'lowpass',vol:v,at}); play(noise(0.07,k=>Math.pow(1-k,6)*0.6),{f:1300,q:1.4,vol:v*0.35,at:at+0.02}); },
 thud(at=0){ play(noise(0.3,k=>Math.pow(1-k,4)),{f:120,q:0.8,type:'lowpass',vol:0.6,at}); },
 room(at=0){ play(noise(1.6,k=>0.12*Math.sin(Math.PI*k)),{f:240,q:0.5,type:'lowpass',vol:0.35,at}); } };
window.aptSND=SND;
// Ticker über A-Frame (läuft auch in VR, wo window.rAF ruht)
if(window.AFRAME&&!AFRAME.systems['apt-ticker']) AFRAME.registerSystem('apt-ticker',{tick(){ const L=window.__aptTicks; if(!L||!L.length) return; for(let i=L.length-1;i>=0;i--){ let r; try{ r=L[i](); }catch(e){ console.error(e); r=false; } if(r===false) L.splice(i,1); } }});
let busy=false;
window.aptDoorTrans=function(sc,o){ if(busy) return false; busy=true; o=o||{}; const TH=T(), S=sc.object3D, R=sc.renderer;
 const cam=()=>R.xr.isPresenting?R.xr.getCamera():sc.camera; const head=new TH.Vector3(), q=new TH.Quaternion(); cam().getWorldPosition(head); cam().getWorldQuaternion(q);
 const fwd=new TH.Vector3(0,0,-1).applyQuaternion(q); fwd.y=0; if(fwd.lengthSq()<1e-4) fwd.set(0,0,-1); fwd.normalize();
 // Schwarze Kugel um den Kopf (weltfest), deckt alles ab
 const blackM=new TH.MeshBasicMaterial({color:0x000000,side:TH.BackSide,transparent:true,opacity:0,depthTest:false,depthWrite:false,fog:false});
 const ball=new TH.Mesh(new TH.SphereGeometry(0.45,24,16),blackM); ball.name='aptTrans'; ball.renderOrder=9990; ball.position.copy(head); ball.frustumCulled=false; S.add(ball);
 // Tür (unbeleuchtete Materialien mit gemalter Schattierung: kein zusätzliches Licht, kein Shader-Neubau)
 const D=new TH.Group(); D.name='aptTrans'; D.visible=false; const base=new TH.Vector3().copy(head).addScaledVector(fwd,1.55); base.y=0; D.position.copy(base); D.rotation.y=Math.atan2(fwd.x,fwd.z)+Math.PI; S.add(D);
 const cv=(w,h,fn)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; fn(c.getContext('2d'),w,h); const t=new TH.CanvasTexture(c); t.colorSpace=TH.SRGBColorSpace; return t; };
 const leafT=cv(256,512,(x,w,h)=>{ const g=x.createLinearGradient(0,0,w,0); g.addColorStop(0,'#3a2a1c'); g.addColorStop(0.5,'#4a3624'); g.addColorStop(1,'#2e2116'); x.fillStyle=g; x.fillRect(0,0,w,h);
  for(let i=0;i<140;i++){ x.strokeStyle='rgba(20,12,6,'+(0.08+Math.random()*0.15)+')'; x.lineWidth=0.6+Math.random()*1.4; x.beginPath(); const xx=Math.random()*w; x.moveTo(xx,0); x.bezierCurveTo(xx+Math.random()*8-4,h*0.3,xx+Math.random()*8-4,h*0.7,xx+Math.random()*6-3,h); x.stroke(); }
  const pan=(a,b,c,d)=>{ x.strokeStyle='rgba(0,0,0,0.55)'; x.lineWidth=5; x.strokeRect(a,b,c,d); x.strokeStyle='rgba(140,105,70,0.25)'; x.lineWidth=2; x.strokeRect(a+4,b+4,c-8,d-8); }; pan(36,40,184,190); pan(36,270,184,200);
  const v=x.createRadialGradient(w*0.5,h*0.45,40,w*0.5,h*0.5,h*0.62); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.7)'); x.fillStyle=v; x.fillRect(0,0,w,h); });
 const frameT=cv(64,256,(x,w,h)=>{ x.fillStyle='#21170f'; x.fillRect(0,0,w,h); for(let i=0;i<40;i++){ x.fillStyle='rgba(0,0,0,'+Math.random()*0.3+')'; x.fillRect(Math.random()*w,0,1,h); } });
 const mats=[]; const M=(p)=>{ const m=new TH.MeshBasicMaterial(Object.assign({fog:false,transparent:true,opacity:1},p)); m.userData.c=m.color.clone(); mats.push(m); return m; };
 const W=0.9, H=2.05, mLeaf=M({map:leafT}), mFr=M({map:frameT}), mBr=M({color:0x8a6a3a});
 const add=(g,m,x,y,z,p)=>{ const me=new TH.Mesh(g,m); me.position.set(x,y,z); (p||D).add(me); return me; };
 add(new TH.BoxGeometry(0.08,H+0.08,0.14),mFr,-W/2-0.04,(H+0.08)/2,0); add(new TH.BoxGeometry(0.08,H+0.08,0.14),mFr,W/2+0.04,(H+0.08)/2,0); add(new TH.BoxGeometry(W+0.16,0.08,0.14),mFr,0,H+0.04,0);
 const hinge=new TH.Group(); hinge.position.set(-W/2,0,0); D.add(hinge); const leaf=add(new TH.BoxGeometry(W,H,0.045),mLeaf,W/2,H/2,0,hinge);
 const knob=new TH.Group(); knob.position.set(W-0.08,1.0,0.04); hinge.add(knob); add(new TH.BoxGeometry(0.03,0.16,0.012),mBr,0,-0.02,0,knob); const lever=add(new TH.BoxGeometry(0.12,0.022,0.022),mBr,-0.05,0,0.03,knob);
 // dahinter: die offene Türöffnung ist tiefschwarz (opake Fläche im Rahmen, deckt alles dahinter ab – früher warmer Schimmer = „beiges Bild“)
 const mHole=new TH.MeshBasicMaterial({color:0x000000,fog:false,toneMapped:false}); const hole=add(new TH.PlaneGeometry(W+0.02,H+0.01),mHole,0,(H+0.01)/2,-0.035); hole.renderOrder=-1;
 const floorT=cv(128,128,(x,w,h)=>{ const g=x.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2); g.addColorStop(0,'rgba(60,44,28,0.9)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,w,h); });
 const fl=add(new TH.PlaneGeometry(2.4,2.4),M({map:floorT,depthWrite:false}),0,0.002,0.5); fl.rotation.x=-Math.PI/2;
 const setB=k=>mats.forEach(m=>{ m.color.copy(m.userData.c).multiplyScalar(k); });
 const ease=k=>k<0?0:k>1?1:k*k*(3-2*k);
 const t0=performance.now(); let phase=0, swapped=false, t1=0; const DOOR_T=2.9;
 const doSwap=()=>{ if(swapped) return; swapped=true; D.visible=false; try{ o.swap&&o.swap(); }catch(e){ console.error(e); } };
 const abort=()=>{ if(phase<3){ AC(); if(phase<1){ /* noch nicht schwarz: direkt weiter */ } phase=3; t1=performance.now(); doSwap(); } };
 const ctrls=[0,1].map(i=>R.xr.getController(i)); const onSel=()=>abort(); const onKey=e=>{ if(e.code==='Space'||e.code==='Escape') abort(); };
 setTimeout(()=>{ ctrls.forEach(c=>c.addEventListener('selectstart',onSel)); sc.canvas&&sc.canvas.addEventListener('click',onSel); window.addEventListener('keydown',onKey); },350);
 const cleanup=()=>{ ctrls.forEach(c=>c.removeEventListener('selectstart',onSel)); sc.canvas&&sc.canvas.removeEventListener('click',onSel); window.removeEventListener('keydown',onKey);
  S.remove(ball); S.remove(D); D.traverse(m=>{ if(m.geometry) m.geometry.dispose(); }); mats.forEach(m=>{ m.map&&m.map.dispose(); m.dispose(); }); mHole.dispose(); blackM.dispose(); busy=false; o.done&&o.done(); };
 SND.step(0.05,0.35);
 const frame=()=>{ const now=performance.now(), t=(now-t0)/1000; cam().getWorldPosition(head); ball.position.copy(head);
  if(phase===0){ blackM.opacity=ease(t/0.45); if(t>=0.45){ phase=1; blackM.opacity=1; o.hide&&o.hide(); D.visible=true; setB(0); const E=window.aptSFX&&window.aptHasSFX&&aptHasSFX('door_creak'); if(E){ aptSFX('door_latch',0.7,false,0.3); aptSFX('door_creak',0.65,false,0.6); aptSFX('steps',0.6,false,1.25); } else { SND.latch(0.35); SND.creak(0.62,1.85); SND.step(1.05,0.42); SND.step(1.6,0.45); SND.step(2.15,0.48); } } }
  else if(phase===1){ const k=t-0.45; ball.visible=false; // Umfeld = schwarzer Hintergrund
   setB(0.15+0.85*ease(k/0.5)*(k<2.45?1:1-ease((k-2.45)/0.45)));
   lever.rotation.z=k>0.35&&k<0.75?-0.45*Math.sin(Math.PI*(k-0.35)/0.4):0; hinge.rotation.y=-1.35*ease((k-0.6)/1.9);
   if(k>=DOOR_T){ phase=2; ball.visible=true; blackM.opacity=1; doSwap(); t1=now; } }
  else if(phase===2||phase===3){ ball.visible=true; const k=(now-t1)/1000; if(phase===3&&k<0.05){ D.visible=false; } if(k<0.25){ blackM.opacity=1; } else { blackM.opacity=1-ease((k-0.25)/0.55); }
   if(k>=0.8){ cleanup(); return false; } }
  return true; };
 (window.__aptTicks||(window.__aptTicks=[])).push(frame);
 return true; };
})();
