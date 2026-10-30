/* Giß-Moe Extras: Essen mit Effekten, Frag-Moe (Magic-8-Ball mit Mikro), Hütchenspiel. Alles offline, eigene Umsetzung. */
(function(){
const norm=t=>t.toLowerCase().replace(/[^a-zäöüß]/g,'');
const stripSpoken=t=>t.replace(/\*[^*]*\*/g,' ').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu,'').replace(/\s+/g,' ').trim();
let K, THREE, VM=null, BUF={}, RAWB={}, base='';
const GF={};
/* ---------- Stimme: vorgerenderte Clips ---------- */
async function loadVoice(){ try{ VM=await fetch(base+'voice/voice.json').then(r=>r.json()); }catch(e){ VM=null; return; }
 const files=new Set(Object.values(VM.words)); VM.answers.forEach(a=>a.parts.forEach(p=>p.a&&files.add(p.a))); Object.values(VM.sfx||{}).forEach(L=>L.forEach(f=>files.add(f)));
 await Promise.all([...files].map(f=>fetch(base+'voice/'+f).then(r=>r.ok?r.arrayBuffer():null).then(b=>{ if(b) RAWB[f]=b; }).catch(()=>{}))); decodeAll(); }
let decoding=false;
function decodeAll(){ const c=K.V.ctx; if(!c||decoding) return; decoding=true;
 Object.keys(RAWB).forEach(f=>{ const b=RAWB[f]; delete RAWB[f]; c.decodeAudioData(b).then(ab=>{ BUF[f]={ab,mouth:envMouth(ab)}; }).catch(()=>{}); }); decoding=false; }
function envMouth(ab){ const d=ab.getChannelData(0), sr=ab.sampleRate, w=Math.round(sr*0.04), m=[]; let on=-1;
 for(let i=0;i<d.length;i+=w){ let s=0; for(let j=i;j<Math.min(d.length,i+w);j+=4) s+=d[j]*d[j]; const rms=Math.sqrt(s/(w/4)); const t=i/sr;
  if(rms>0.035&&on<0) on=t; else if(rms<=0.035&&on>=0){ if(t-on>0.05) m.push([on,t]); on=-1; } }
 if(on>=0) m.push([on,d.length/sr]); return m; }
function play(f){ const b=BUF[f], c=K.V.ctx; if(!b||!c) return null; const s=c.createBufferSource(); s.buffer=b.ab; s.connect(K.V.out); s.start(c.currentTime+0.02); return {dur:b.ab.duration+0.02,mouth:b.mouth.map(x=>[x[0]+0.02,x[1]+0.02])}; }
GF.clip=function(text){ if(!VM) return null; decodeAll(); let f=VM.words[norm(text)];
 if(!f&&K.M.name){ const n=K.M.name; f=VM.words[norm(text.split(n).join(''))]; }
 return f?play(f):null; };
GF.hasClip=text=>!!(VM&&(VM.words[norm(text)]||(K.M.name&&VM.words[norm(text.split(K.M.name).join(''))])));
function speak(text){ // Notfall: Gerätestimme, ohne Emojis und *Aktionen*
 const t=stripSpoken(text); if(!t||!window.speechSynthesis) return {dur:1.2,mouth:[[0,1]]};
 try{ const u=new SpeechSynthesisUtterance(t); u.lang='de-DE'; u.pitch=1.25; u.rate=1.08; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
 const d=0.35+t.length*0.065, m=[]; for(let x=0;x<d;x+=0.22) m.push([x,x+0.15]); return {dur:d,mouth:m}; }
/* ---------- kleine Helfer ---------- */
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function scr(local,space){ const v=new THREE.Vector3().fromArray(local); (space||K.G.head).localToWorld(v); v.project(K.cam); return [(v.x*.5+.5)*innerWidth,(-v.y*.5+.5)*innerHeight]; }
function pf(ch,pos,o){ o=o||{}; const n=o.n||1; for(let i=0;i<n;i++) setTimeout(()=>{ const p=typeof pos==='function'?pos():pos; const e=document.createElement('div'); e.className='pf'; e.textContent=ch;
  e.style.left=(p[0]+(Math.random()-.5)*(o.jx||20))+'px'; e.style.top=(p[1]+(Math.random()-.5)*(o.jy||20))+'px';
  e.style.setProperty('--dx',((o.dx||0)+(Math.random()-.5)*(o.sx||60))+'px'); e.style.setProperty('--dy',((o.dy==null?-120:o.dy)+(Math.random()-.5)*(o.sy||40))+'px');
  e.style.setProperty('--s0',o.s0||0.6); e.style.setProperty('--s1',o.s1||1.3); e.style.setProperty('--d',(o.d||1.6)+'s'); e.style.fontSize=(o.fs||30)+'px'; document.body.appendChild(e); setTimeout(()=>e.remove(),(o.d||1.6)*1000+100); },i*(o.gap||120)); }
const beakP=()=>scr([K.G.LM.beak[0],K.G.LM.beak[1],K.G.LM.beak[2]+0.05]);
const earP=s=>()=>scr(s<0?K.G.LM.earL:K.G.LM.earR);
/* Fell-Farbe weich überblenden */
const FX={tint:null,glow:null,hue:0,rainbow:0};
function baseTint(){ return K.M.vamp?[0.86,0.9,1.02]:[1,1,1]; }
GF.tick=function(dt,t){ springTick(dt); if((t*4|0)!==(GF._lt|0)){ GF._lt=t*4; chocoUpd(); if(K.M.tummy&&Date.now()-K.M.tummy>2*3600000){ K.M.tummy=0; K.save(); } } if(K.V.ctx&&Object.keys(RAWB).length) decodeAll(); const U=K.G.U, k=1-Math.exp(-dt*3); const tt=FX.tint||baseTint(), gg=FX.glow||[0,0,0];
 U.uTint.value.r+=(tt[0]-U.uTint.value.r)*k; U.uTint.value.g+=(tt[1]-U.uTint.value.g)*k; U.uTint.value.b+=(tt[2]-U.uTint.value.b)*k;
 const pulse=FX.glow?0.75+0.25*Math.sin(t*9):1; U.uGlow.value.setRGB(U.uGlow.value.r+(gg[0]*pulse-U.uGlow.value.r)*k,U.uGlow.value.g+(gg[1]*pulse-U.uGlow.value.g)*k,U.uGlow.value.b+(gg[2]*pulse-U.uGlow.value.b)*k);
 if(FX.rainbow>performance.now()){ U.uHue.value=(t*2.2)%(Math.PI*2)+0.001; } else U.uHue.value=0;
 if(cape) { cape.visible=capeS>0.01; capeS+=((K.M.vamp?1:0)-capeS)*k*1.5; cape.scale.setScalar(Math.max(0.001,capeS)); cape.rotation.x=Math.sin(t*1.7)*0.04+(K.A.hop>0.3?0.1:0); }
 fangs.forEach(f=>f.visible=!!K.M.vamp); if(st().game) cupTick(dt,t);
 if(K.M.vamp&&st().mode!=='sleep'&&!st().game&&t>nextBat){ nextBat=t+14+Math.random()*12; pf('🦇',()=>scr([0,0.95,0]),{n:2,dx:0,sx:260,dy:-200,s0:.5,s1:1.2,d:2.4}); } };
let nextBat=0; const st=()=>K.st;
/* ---------- Zubehör-Meshes ---------- */
let cape=null, capeS=0, fangs=[], stache=null, icicles=null, crest=null;
function buildBits(){ const G=K.G;
 // Umhang (Vampir)
 const cg=new THREE.PlaneGeometry(1,1,24,12), p=cg.attributes.position;
 for(let i=0;i<p.count;i++){ const u=p.getX(i)+0.5, v=p.getY(i)+0.5; const a=(u-0.5)*3.3; const r=0.40*(0.78+0.34*(1-v))+0.02*Math.sin(u*30)*(1-v); const y=0.02+v*0.56; p.setXYZ(i,Math.sin(a)*r,y,-Math.cos(a)*r*0.92+0.04); }
 cg.computeVertexNormals(); cape=new THREE.Group();
 cape.add(new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:0x1a1222,roughness:0.55,metalness:0.1,side:THREE.FrontSide})));
 cape.add(new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:0xa3122a,roughness:0.4,side:THREE.BackSide})));
 const col=new THREE.Mesh(new THREE.CylinderGeometry(0.40,0.27,0.30,28,1,true,Math.PI*0.55,Math.PI*0.9),new THREE.MeshStandardMaterial({color:0xa3122a,roughness:0.4,side:THREE.DoubleSide})); col.position.set(0,0.64,-0.06); cape.add(col);
 cape.visible=false; G.root.add(cape);
 const fm=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:0.2,clearcoat:1});
 fangs=[-1,1].map(s=>{ const f=new THREE.Mesh(new THREE.ConeGeometry(0.009,0.034,10),fm); f.rotation.x=Math.PI; f.position.set(s*0.02,-0.02,0.036); f.visible=false; G.beak.add(f); return f; });
 stache=new THREE.Group(); const sm=new THREE.MeshStandardMaterial({color:0xfffcf5,roughness:0.35});
 [-1,1].forEach(s=>{ const b=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),sm); b.scale.set(0.03,0.012,0.014); b.position.set(s*0.024,0.026,0.04); b.rotation.z=s*-0.25; stache.add(b); }); stache.visible=false; G.beak.add(stache);
 icicles=new THREE.Group(); const im=new THREE.MeshPhysicalMaterial({color:0xcfeaff,roughness:0.05,transmission:0.4,transparent:true,opacity:0.85,clearcoat:1});
 for(let i=0;i<7;i++){ const x=-0.2+i*0.0667; const c=new THREE.Mesh(new THREE.ConeGeometry(0.012,0.05+Math.random()*0.04,8),im); c.rotation.x=Math.PI; const zz=0.27-Math.abs(x)*0.5; c.position.set(x,0.585-Math.abs(x)*0.25,zz); icicles.add(c); } icicles.visible=false; G.head.add(icicles);
 crest=new THREE.Group(); const gm=new THREE.MeshStandardMaterial({color:0x4fae3a,roughness:0.6});
 for(let i=0;i<5;i++){ const c=new THREE.Mesh(new THREE.ConeGeometry(0.03-i*0.003,0.09-i*0.01,10),gm); const z=0.16-i*0.07; c.position.set(0,0.95+Math.cos(i*0.5)*0.0-i*0.01,z); c.rotation.x=-0.3-i*0.15; crest.add(c); } crest.visible=false; G.head.add(crest);
}
/* ---------- Essen ---------- */
const FOOD=[
 {id:'keks',e:'🍪',n:'Keks',h:'lecker'},
 {id:'kaffee',e:'☕',n:'Kaffee',h:'hibbelig'},
 {id:'chili',e:'🌶️',n:'Chili',h:'Feuer!'},
 {id:'tomate',e:'🍅',n:'Tomatensaft',h:'Vampir …'},
 {id:'knobi',e:'🧄',n:'Knoblauch',h:'hilft gegen Vampire'},
 {id:'eis',e:'🍦',n:'Eis',h:'brrr'},
 {id:'zitrone',e:'🍋',n:'Zitrone',h:'sauer'},
 {id:'karotte',e:'🥕',n:'Karotte',h:'Häschen'},
 {id:'kuchen',e:'🍰',n:'Kuchen',h:'Zuckerschock'},
 {id:'milch',e:'🥛',n:'Milch',h:'Milchbart'},
 {id:'blitzo',e:'⚡',n:'Blitzo',h:'hat Elektrolyte'},
 {id:'banane',e:'🍌',n:'Banane',h:'Affentanz'},
 {id:'popcorn',e:'🍿',n:'Popcorn',h:'Plopp!'},
 {id:'brokkoli',e:'🥦',n:'Brokkoli',h:'stark'},
 {id:'gummi',e:'🐻',n:'Gummibärchen',h:'Regenbogen'},
 {id:'orange',e:'🍊',n:'Orange',h:'Vitamin-C-Bombe'},
 {id:'bohnen',e:'🫘',n:'Bohnen',h:'pupsig …'},
 {id:'schoko',e:'🍫',n:'Schokolade',h:'Schoko-Schnute'},
 {id:'tee',e:'🍵',n:'Pfefferminztee',h:'gut für den Bauch'}];
/* ---------- 3.1: neue Leckereien (Brause, Wackelpudding, Sauer-Gurke, Gum-Gum-Frucht) ---------- */
const ICON={
 wackel(x){ x.save(); x.fillStyle='rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(80,132,62,14,0,0,7); x.fill(); x.fillStyle='#f4f4f8'; x.beginPath(); x.ellipse(80,126,64,15,0,0,7); x.fill();
  x.beginPath(); x.moveTo(30,124); x.bezierCurveTo(26,60,44,30,80,30); x.bezierCurveTo(116,30,134,60,130,124); x.closePath(); x.clip(); const cs=['#ff4d6d','#ff9f1c','#ffe14d','#4fd36a','#3fa7ff','#9b5cff']; cs.forEach((c,i)=>{ x.fillStyle=c; x.fillRect(0,30+i*16,160,17); });
  const g=x.createLinearGradient(30,0,130,0); g.addColorStop(0,'rgba(255,255,255,.0)'); g.addColorStop(0.25,'rgba(255,255,255,.45)'); g.addColorStop(0.4,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,160,160); x.restore();
  x.fillStyle='#fff'; x.beginPath(); x.ellipse(80,30,12,8,0,0,7); x.fill(); x.fillStyle='#e8243c'; x.beginPath(); x.arc(80,22,9,0,7); x.fill(); },
 gumgum(x){ x.save(); x.fillStyle='rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(80,140,46,10,0,0,7); x.fill();
  const g=x.createRadialGradient(64,62,8,80,86,58); g.addColorStop(0,'#c58cff'); g.addColorStop(1,'#5a1f9e'); x.fillStyle=g; x.beginPath(); x.ellipse(80,88,54,50,0,0,7); x.fill(); x.clip();
  x.strokeStyle='rgba(235,210,255,.85)'; x.lineWidth=4; x.lineCap='round'; [[58,70],[100,72],[80,108],[50,108],[112,110]].forEach(([cx,cy])=>{ x.beginPath(); for(let a=0;a<12;a+=0.2){ const r=a*1.6; const px=cx+Math.cos(a)*r, py=cy+Math.sin(a)*r; a?x.lineTo(px,py):x.moveTo(px,py); } x.stroke(); }); x.restore();
  x.strokeStyle='#3fa83a'; x.lineWidth=6; x.lineCap='round'; x.beginPath(); x.moveTo(80,42); x.bezierCurveTo(78,26,96,24,92,14); x.stroke(); x.beginPath(); x.moveTo(84,30); x.bezierCurveTo(98,32,104,20,96,14); x.stroke();
  x.fillStyle='rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(60,62,12,7,-0.6,0,7); x.fill(); }};
const iconURL=id=>{ const c=document.createElement('canvas'); c.width=c.height=160; ICON[id](c.getContext('2d')); return c.toDataURL(); };
FOOD.push({id:'brause',e:'🥤',n:'Blubber-Brause',h:'Hicks!'},{id:'wackel',e:'🍮',n:'Wackelpudding',h:'Regenbogen-Wabbel',draw:1},{id:'gurke',e:'🥒',n:'Sauer-Gurke',h:'super sauer'},{id:'gumgum',e:'🟣',n:'Gum-Gum-Frucht',h:'gummi-wummi',draw:1});
/* Feder-Physik für den ganzen Giß-Moe (Wabbeln, Gummi-Dehnen) */
const SP={x:0,y:0,l:0,vx:0,vy:0,vl:0,hold:null,was:false};
function springTick(dt){ const g=K.G.group; const act=SP.hold||Math.abs(SP.x)+Math.abs(SP.y)+Math.abs(SP.l)+Math.abs(SP.vx)+Math.abs(SP.vy)+Math.abs(SP.vl)>2e-3;
 if(!act){ if(SP.was){ SP.x=SP.y=SP.l=SP.vx=SP.vy=SP.vl=0; g.scale.set(1,1,1); g.rotation.z=0; SP.was=false; } return; } SP.was=true;
 const h=Math.min(0.04,dt||0.016)/4; for(let i=0;i<4;i++){ if(SP.hold){ const q=0.18; SP.x+=(SP.hold.x-SP.x)*q; SP.y+=(SP.hold.y-SP.y)*q; SP.l+=(SP.hold.l-SP.l)*q; SP.vx=SP.vy=SP.vl=0; }
  else { const k=190,c=4.2; SP.vx+=(-k*SP.x-c*SP.vx)*h; SP.vy+=(-k*SP.y-c*SP.vy)*h; SP.vl+=(-k*SP.l-c*SP.vl)*h; SP.x+=SP.vx*h; SP.y+=SP.vy*h; SP.l+=SP.vl*h; } }
 const cl=v=>Math.max(0.45,Math.min(2.2,v)); g.scale.set(cl(1+SP.x-0.35*SP.y),cl(1+SP.y-0.4*SP.x),cl(1+0.6*SP.x-0.35*SP.y)); g.rotation.z=Math.max(-0.6,Math.min(0.6,SP.l)); }
GF._sp=SP;
function boingS(f0,f1,d){ const V=K.V, c=V.ctx; if(!c) return; const o=c.createOscillator(), g=c.createGain(), t=c.currentTime; o.type='sine'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+d); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.35,t+0.015); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(g).connect(V.out); o.start(t); o.stop(t+d+0.02); }
function burp(){ const V=K.V, c=V.ctx; if(!c) return; const t=c.currentTime+0.02, d=0.55; const o=c.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(85,t+d);
 const lfo=c.createOscillator(); lfo.frequency.value=38; const lg=c.createGain(); lg.gain.value=18; lfo.connect(lg).connect(o.frequency); const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=650; lp.Q.value=6;
 const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.6,t+0.03); g.gain.setValueAtTime(0.5,t+d*0.6); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(lp).connect(g).connect(V.out); [o,lfo].forEach(x=>{ x.start(t); x.stop(t+d+0.05); }); }
/* echte 3D-Seifenblasen aus dem Mund */
let bubM=null;
function bubbles(n,big){ if(!bubM) bubM=new THREE.MeshPhysicalMaterial({color:0xdff6ff,roughness:0.05,transparent:true,opacity:0.42,iridescence:1,iridescenceIOR:1.3,clearcoat:1,depthWrite:false});
 const B=K.G.LM.beak; for(let i=0;i<n;i++) setTimeout(()=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),bubM); const r=(big?0.03:0.018)+Math.random()*(big?0.035:0.02); m.scale.setScalar(0.001); m.position.set(B[0]+(Math.random()-.5)*0.03,B[1]-0.01,B[2]+0.05); K.G.head.add(m);
  const vx=(Math.random()-.5)*0.25, vz=0.12+Math.random()*0.15, vy=0.18+Math.random()*0.2, t0=performance.now(), life=1500+Math.random()*1200;
  const step=()=>{ const a=(performance.now()-t0)/1000; if(a*1000>life){ K.G.head.remove(m); m.geometry.dispose(); try{ K.V.pop(); }catch(e){} return; } m.position.x+=vx*0.016+Math.sin(a*6+i)*0.0015; m.position.y+=vy*0.016; m.position.z+=vz*0.016; m.scale.setScalar(r*Math.min(1,a*5)*(1+0.06*Math.sin(a*14))); requestAnimationFrame(step); }; step(); },i*(big?45:90)); }
/* Gum-Gum: Kneten mit dem Finger */
let gum=null;
function gumKnead(sec){ return new Promise(res=>{ const k=K; const hint=document.createElement('div'); hint.className='gumh'; document.body.appendChild(hint); let ptr=null, lastSay=0; const t0=performance.now();
 const onEar=(x,y)=>{ for(const s of [-1,1]){ const p=earP(s)(); if(Math.hypot(x-p[0],y-p[1])<75) return s; } return 0; };
 const down=e=>{ if(e.target.tagName!=='CANVAS') return; e.stopImmediatePropagation(); e.preventDefault(); ptr={id:e.pointerId,x:e.clientX,y:e.clientY,ear:onEar(e.clientX,e.clientY),mv:false}; SP.hold={x:0.16,y:-0.26,l:0}; k.A.lid=0.6; k.A.blush=1; boingS(260,180,0.12); };
 const move=e=>{ if(!ptr||e.pointerId!==ptr.id) return; e.stopImmediatePropagation(); const dx=e.clientX-ptr.x, dy=e.clientY-ptr.y; if(Math.hypot(dx,dy)>10) ptr.mv=true; if(!ptr.mv) return; const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  if(ptr.ear){ k.A.earUp=cl(-dy/70,-1,1.8); k.A.earFwd=cl(dx*ptr.ear/90,-1,1); k.A.earWig=0.4; SP.hold={x:cl(Math.abs(dx)/500,0,0.25),y:cl(-dy/400,-0.2,0.35),l:cl(-dx/700,-0.3,0.3)}; }
  else SP.hold={x:cl(Math.abs(dx)/240-Math.max(0,-dy)/900,-0.3,0.85),y:cl(-dy/200,-0.45,1.0),l:cl(-dx/520,-0.55,0.55)}; };
 const up=e=>{ if(!ptr||e.pointerId!==ptr.id) return; e.stopImmediatePropagation(); const H=SP.hold; SP.hold=null; ptr=null; k.A.earUp=0.6; k.A.earFwd=0; k.A.earWig=1.2; setTimeout(()=>{ k.A.earWig=0; },500); k.A.lid=0.3;
  if(H){ SP.vx-=H.x*6; SP.vy-=H.y*6; } boingS(220,760,0.28); const now=performance.now(); if(now-lastSay>2600){ lastSay=now; if(Math.random()<0.5) k.say(['Boing! Das kitzelt!','Hihi!','Uiii! Quietsch!','Nochmal!'][(Math.random()*4)|0]); else k.mouthPlay(GF.sfx('giggle')||k.V.giggle(4)); } };
 addEventListener('pointerdown',down,true); addEventListener('pointermove',move,true); addEventListener('pointerup',up,true); addEventListener('pointercancel',up,true);
 const iv=setInterval(()=>{ const rem=Math.ceil(sec-(performance.now()-t0)/1000); hint.innerHTML='🟣 <b>Knete mich!</b> Zieh an mir oder drück mich · '+Math.max(0,rem)+' s'; if(rem<=0||gum!==iv){ fin(); } },200); gum=iv;
 function fin(){ clearInterval(iv); if(gum===iv) gum=null; removeEventListener('pointerdown',down,true); removeEventListener('pointermove',move,true); removeEventListener('pointerup',up,true); removeEventListener('pointercancel',up,true); SP.hold=null; hint.remove(); res(); } }); }
async function newFood(id,t){ const k=K, A=k.A, V=k.V, al=()=>k.alive(t);
 if(id==='brause'){ A.low=0.5; A.lid=0.35; FX.tint=[0.95,1.02,1.12]; await sayW('Lecker!',{},200); if(!al()) return;
  for(let i=0;i<4;i++){ A.sq=0.12; A.lid=0.9; await wait(110); A.sq=0; A.hop=1.2; A.pup=1.4; k.bubble('Hicks!',0.5); V.pop(); bubbles(3); SP.vy+=1.6; await wait(380); A.hop=0; A.lid=0.2; await wait(380+Math.random()*250); if(!al()) return; }
  A.sq=-0.06; A.earUp=0.9; await wait(250); A.jaw=1; A.hx=-0.1; try{ k.mouthPlay(V.burp()); }catch(e){ burp(); } bubbles(14,true); SP.vx+=2.5; k.bubble('BUUUÄRPS! 🫧',1.2); pf('🫧',beakP,{n:6,gap:80,dy:-150,sx:200,s0:.5,s1:1.8,d:2}); await wait(700); A.jaw=0; A.hx=0; A.sq=0; if(!al()) return;
  A.blush=1.2; A.lid=0.5; await sayW('Hoppla!',{},150); if(!al()) return; k.mouthPlay(GF.sfx('giggle')||V.giggle(4)); await wait(900); return true; }
 if(id==='wackel'){ FX.rainbow=performance.now()+7500; FX.glow=[0.08,0.06,0.1]; A.low=0.6; A.lid=0.4; A.blush=0.8; await sayW('Uiii! Quietsch!',{},100); if(!al()) return;
  for(let i=0;i<18;i++){ const s=i%2?1:-1; SP.vx+=s*1.9; SP.vy-=s*1.5; SP.vl+=s*0.6; A.earWig=1.5; if(i%3===0) pf(['🌈','✨','💖'][i%3?1:0],()=>scr([0,1.0,0.1]),{n:1,sx:240,dy:-90}); if(i%4===0) boingS(300+i*20,200,0.12); await wait(170); if(!al()) return; }
  A.earWig=0; A.lid=0.6; A.hz=0.12; await sayW('Mir ist schwindelig …',{},300); A.hz=0; if(!al()) return; return true; }
 if(id==='gurke'){ const bk=k.G.beak; A.lid=0.85; A.brow=1; A.low=0.7; A.hx=-0.12; A.earUp=0.9; A.sq=0.1; A.trem=1.4; bk.scale.set(0.62,0.75,1.25);
  for(let i=0;i<6;i++){ FX.tint=i%2?[1,1,1]:[0.62,1.32,0.55]; k.G.U.uTint.value.setRGB(...FX.tint); await wait(160); } FX.tint=[0.82,1.15,0.75]; pf('💦',()=>scr([0,0.75,0.25]),{n:6,sx:200,dy:-60}); pf('🥒',()=>scr([0,1.05,0.1]),{n:1,dy:-80,s1:1.8});
  await sayW('Sauer! Sauer!',{},200); if(!al()){ bk.scale.set(1,1,1); return; } A.trem=2; SP.vx+=1.2; await sayW('Brrrrrr!',{},200); bk.scale.set(1,1,1); A.trem=0; A.sq=0; A.brow=0; A.lid=0.4; if(!al()) return; await sayW('Puh …',{},300); return true; }
 if(id==='gumgum'){ FX.tint=[1.06,0.9,1.16]; A.lid=-0.05; A.pup=1.4; A.earUp=0.9; pf('🟣',()=>scr([0,1.0,0.1]),{n:1,dy:-80,s1:2}); boingS(200,900,0.35); SP.vy+=7; await wait(450); if(!al()) return;
  await sayW('Boing! Das kitzelt!',{},100); SP.vx+=5; SP.vl+=2; boingS(700,180,0.3); await wait(500); if(!al()) return;
  A.low=0.6; A.lid=0.3; await gumKnead(13); if(!al()) return; SP.vy+=3; boingS(300,900,0.3); await sayW('Hihi! Das war lustig! Nochmal?',{},300); return true; }
 return false; }
const sprCache={};
function foodSprite(e){ if(!sprCache[e]){ const c=document.createElement('canvas'); c.width=c.height=160; const x=c.getContext('2d'); x.font='120px system-ui,"Noto Color Emoji",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.shadowColor='rgba(0,0,0,.35)'; x.shadowBlur=10; x.shadowOffsetY=5; if(ICON[e]) ICON[e](x); else x.fillText(e,80,86);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; sprCache[e]=t; } const s=new THREE.Sprite(new THREE.SpriteMaterial({map:sprCache[e],depthTest:true})); s.scale.setScalar(0.17); return s; }
async function flyIn(e,t){ const s=foodSprite(e); K.stage.add(s); const B=new THREE.Vector3().fromArray(K.G.LM.beak); B.z+=0.08; K.G.head.localToWorld(B); K.stage.worldToLocal(B); const S0=new THREE.Vector3(0.55,0.15,1.1);
 for(let i=0;i<=20;i++){ const k=i/20; s.position.lerpVectors(S0,B,k); s.position.y+=Math.sin(k*Math.PI)*0.18; s.material.rotation=k*2; await wait(22); }
 for(let i=0;i<3;i++){ K.A.jaw=1; await wait(110); K.A.jaw=0.1; s.scale.setScalar(0.17*(1-0.3*(i+1))); K.V.chomp(1); await wait(150); }
 K.stage.remove(s); s.material.dispose(); return K.alive(t); }
const say=(t,o)=>K.say(t,o);
async function sayW(t,o,extra){ await wait(say(t,o)*1000+(extra==null?250:extra)); }
const isMidnight=()=>K.st.midnight||new Date().getHours()<5;
GF.eat=async function(id){ const k=K; k.interact(); if(k.st.mode==='sleep') await k.wake(); closeTray();
 if(k.M.tummy&&id!=='tee'){ return GF.tummyRefuse(); }
 cakeCount(id);
 if(id==='keks'&&!isMidnight()) return k.feed();
 const f=FOOD.find(x=>x.id===id); const t=k.begin(); k.mark('food-'+id); k.rest(); k.A.lid=0.08; k.A.pup=1.25; k.A.earUp=0.4;
 if(!(await flyIn(f.draw?f.id:f.e,t))) return; k.M.hunger=Math.max(0,k.M.hunger-2); k.ui(); k.save();
 if(isMidnight()) return gremlin(t);
 const A=k.A, V=k.V, al=()=>k.alive(t);
 const end=()=>{ FX.tint=null; FX.glow=null; k.rest(); k.xp(1); k.learnedSay(); };
 if(f.n&&/^(brause|wackel|gurke|gumgum)$/.test(id)){ const ok=await newFood(id,t); if(ok) return end(); FX.tint=null; FX.glow=null; return; }
 switch(id){
 case 'kaffee': { A.lid=-0.05; A.pup=1.45; A.earUp=0.85; A.trem=1; A.low=0.4; pf('☕',()=>scr([0,1,0.1]),{n:2});
  await sayW('Kaffee! Ich bin sooo wach!',{rate:0.6}); if(!al()) return;
  for(let i=0;i<10;i++){ if(!al()) return; A.hop=i%2?1.5:0.3; A.hz=(i%2?1:-1)*0.15; if(i%3===0) k.st.spinV=13; V.say('ba-da-bi-di',{rate:0.45,pitch:1.25}); pf('⚡',()=>scr([0,0.8,0.2]),{n:1,sx:200}); await wait(330); }
  await sayW('Schneller! Schneller! Schneller!'); A.trem=0.5; await wait(600); if(!al()) return; return end(); }
 case 'chili': { A.lid=0.5; A.brow=0.6; await wait(400); FX.tint=[1.35,0.62,0.52]; A.blush=1; A.trem=0.7; A.earUp=0.9; if(!al()) return;
  await sayW('Huuuh, heiß! Feuer!',{},100); if(!al()) return;
  A.jaw=1; A.hx=-0.12; V.noise&&V.noise(V.t(),1.6,'bandpass',600,0.5,0.6);
  pf('🔥',beakP,{n:14,gap:70,dx:0,sx:140,dy:170,sy:60,s0:.4,s1:2.6,d:1.1,fs:34});
  pf('💨',earP(-1),{n:5,gap:200,dx:-40,dy:-130,s0:.5,s1:1.6}); pf('💨',earP(1),{n:5,gap:200,dx:40,dy:-130,s0:.5,s1:1.6});
  await wait(1300); A.jaw=0; A.hx=0; if(!al()) return; await sayW('Scharf! Scharf!',{rate:0.8}); if(!al()) return;
  pf('💨',earP(-1),{n:3,gap:250,dx:-30}); pf('💨',earP(1),{n:3,gap:250,dx:30}); await wait(900); if(!al()) return; return end(); }
 case 'tomate': { A.lid=0.4; A.low=0.4; await sayW('Tomatensaft! Schlürf!'); if(!al()) return;
  A.trem=1; A.lid=0.9; pf('✨',()=>scr([0,0.6,0.2]),{n:8,sx:220,dy:-60}); V.chime(); await wait(700);
  k.M.vamp=1; k.save(); A.trem=0; A.lid=0.35; A.brow=1; A.low=0; A.jaw=0.35; A.earUp=0.6; A.earFwd=-0.3;
  pf('🦇',()=>scr([0,0.9,0.1]),{n:5,gap:160,sx:320,dy:-220,s0:.5,s1:1.3,d:2.2}); await wait(500); if(!al()) return;
  A.jaw=0; await sayW('Ich will dein... Keks saugen! Muahaha!',{},400); if(!al()) return;
  A.brow=0; A.low=0.6; mark2(); await sayW('Ich bin ein Vampir! Bläh!'); k.toast('🧛 Giß-Moe ist jetzt ein Vampir!<br>Was hilft wohl dagegen? 🧄'); if(!al()) return; return end(); }
 case 'knobi': if(k.M.vamp){ A.trem=1.2; A.lid=0.9; A.brow=1; A.earUp=-0.5; A.hx=0.2; await sayW('Bäh! Knoblauch!',{},200); if(!al()) return;
   pf('💥',()=>scr([0,0.35,-0.2],k.G.root),{n:1,s0:.6,s1:3,d:.9,dy:0,sx:0,fs:60}); pf('✨',()=>scr([0,0.3,0],k.G.root),{n:10,gap:50,sx:300,dy:-80}); k.M.vamp=0; k.save(); V.pop(); V.chime(); A.trem=0; A.hx=0; A.brow=0; await wait(900); if(!al()) return;
   A.lid=0.6; A.low=0.6; await sayW('Puh, wieder normal.'); if(!al()) return; return end(); }
  else { A.lid=0.45; A.brow=0.4; FX.tint=[0.92,1.05,0.85]; pf('🟢',beakP,{n:6,gap:120,dy:-60,sx:120,s0:.4,s1:2.4,d:2,fs:22}); pf('🪰',()=>scr([0,0.8,0.2]),{n:4,gap:300,sx:220,dy:-40,d:2.6,fs:24});
   await sayW('Uff, mein Atem stinkt!'); if(!al()) return; A.hx=0.15; pf('💨',beakP,{n:4,dy:60}); await wait(1400); if(!al()) return; return end(); }
 case 'eis': { FX.tint=[0.72,0.86,1.25]; A.trem=1; A.lid=0.4; A.earUp=-0.4; icicles.visible=true; pf('❄️',()=>scr([0,1,0.1]),{n:10,gap:150,sx:260,dy:-100});
  await sayW('Brrr, ist das kalt!',{},300); if(!al()){ icicles.visible=false; return; } A.trem=0; A.lid=0.1; A.pup=0.8; A.earUp=-0.1; await wait(500);
  await sayW('Ich bin eingefroren!',{},700); A.trem=1.2; await wait(1600); icicles.visible=false; if(!al()) return; return end(); }
 case 'zitrone': { A.lid=0.8; A.low=0.7; A.brow=1; A.hx=-0.12; A.sq=0.08; A.earUp=0.7; A.trem=0.6; FX.tint=[1.1,1.05,0.75]; pf('💦',()=>scr([0,0.75,0.25]),{n:4,sx:160,dy:-50});
  await sayW('Sauer! Sauer!',{rate:0.8},600); if(!al()) return; A.sq=0; A.trem=0; await wait(600); return end(); }
 case 'karotte': { A.earUp=1.25; A.earFwd=0.2; A.low=0.6; A.lid=0.4; await sayW('Lecker Möhre!'); if(!al()) return;
  for(let i=0;i<6;i++){ A.hop=i%2?0:1.6; A.sq=i%2?0.08:0; await wait(300); if(!al()) return; } await sayW('Ich bin ein Häschen!'); if(!al()) return; return end(); }
 case 'orange': { FX.glow=[0.34,0.17,0.0]; A.glow=1; A.lid=-0.04; A.pup=1.35; A.earUp=0.9; A.blush=0.6; k.V.chime(); pf('✨',()=>scr([0,0.7,0.2]),{n:14,gap:70,sx:320,dy:-120}); pf('🍊',()=>scr([0,1,0.1]),{n:2,gap:300,dy:-90});
  await sayW('Vitamin-C-Bombe! Ich funkel wie ein Glitzerstern!',{},100); if(!al()) return; k.M.hunger=Math.max(0,k.M.hunger-1); k.M.sick=0; k.ui(); k.save();
  for(let i=0;i<4;i++){ A.hop=i%2?1.4:0.3; A.earWig=1.4; if(i===1) k.st.spinV=9; await wait(330); if(!al()) return; } A.hop=0; A.earWig=0;
  pf('💪',()=>scr([-0.42,0.4,0.15],k.G.root),{n:2,gap:250,dy:-30,sx:20,fs:38}); pf('💪',()=>scr([0.42,0.4,0.15],k.G.root),{n:2,gap:250,dy:-30,sx:20,fs:38}); A.brow=0.5; A.sq=-0.06;
  await sayW('Ich bin superstark und kerngesund!',{},500); A.sq=0; A.brow=0; if(!al()) return; return end(); }
 case 'bohnen': { A.low=0.5; A.lid=0.35; await sayW('Mmh, Bohnen!',{},700); if(!al()) return; A.lid=-0.05; A.pup=1.45; A.earUp=0.9; A.sq=0.06; await wait(500); if(!al()) return;
  fart(1); A.hop=0.8; A.trem=0.6; pf('💨',()=>scr([0,0.12,-0.12],k.G.root),{n:7,gap:55,sx:240,dy:-50,s0:0.6,s1:2.6,d:1.8}); cloud(); await wait(420); A.hop=0; A.trem=0; A.sq=0; if(!al()) return;
  A.blush=1.2; A.lid=0.55; A.low=0.7; A.hz=0.1; k.mouthPlay(GF.sfx('giggle')||k.V.giggle(5)); await wait(900); if(!al()) return; await sayW(['Hihi! Tschuldigung! Das waren die Bohnen!','Hihi! Das war ein Bohnen-Trompeten-Konzert!','Pffft! Hihi! Mein Po hat Hallo gesagt!'][(Math.random()*3)|0],{},400); if(!al()) return;
  if(Math.random()<0.6){ A.lookX=0.6; A.lookY=-0.2; await wait(400); fart(0.55); pf('💨',()=>scr([0,0.12,-0.12],k.G.root),{n:3,gap:60,sx:120,dy:-40,s1:1.8}); await wait(300); A.lookX=0; A.lookY=0; await sayW('Ups! Noch einer! Zugabe! Hihi!',{},300); if(!al()) return; k.mouthPlay(GF.sfx('giggle')||k.V.giggle(4)); await wait(900); }
  A.hz=0; return end(); }
 case 'schoko': { A.low=0.65; A.lid=0.45; A.blush=0.8; await sayW('Schokolade! Mmmmh!',{},200); if(!al()) return; for(let i=0;i<3;i++){ A.jaw=0.8; await wait(140); A.jaw=0.1; k.V.chomp(1); await wait(160); }
  k.M.choco={t:Date.now(),a:1}; k.save(); chocoUpd(true); A.lookY=-0.4; A.pup=1.3; await wait(500); if(!al()) return; k.mouthPlay(GF.sfx('giggle')||k.V.giggle(3)); A.lookY=0; await sayW('Ups! Schoko-Schnute! Jetzt hab ich einen Schoko-Bart! Hihi!',{},300); if(!al()) return;
  k.toast('🍫 Giß-Moe ist ganz schokoladig!<br>Tipp auf 🧽 zum Abwischen'); return end(); }
 case 'tee': { if(k.M.tummy){ A.belly=0.6; A.lid=0.6; A.low=0.4; pf('🌿',()=>scr([0,0.95,0.15]),{n:5,gap:180,sx:180,dy:-100}); await sayW('Pfefferminztee … schlürf …',{},500); if(!al()) return;
   k.M.tummy=0; k.M.cakeRow=null; k.save(); A.belly=0; A.lid=0.15; A.pup=1.3; A.earUp=0.7; A.blush=0.8; k.V.chime(); pf('✨',()=>scr([0,0.35,0.3],k.G.root),{n:8,gap:60,sx:200}); await sayW('Ahhh! Viel besser! Danke!',{},400); if(!al()) return;
   A.hop=1; await wait(300); A.hop=0; k.xp(2); return end(); }
  A.low=0.5; A.lid=0.5; pf('🌿',()=>scr([0,0.95,0.15]),{n:3,gap:200,sx:160,dy:-100}); await sayW('Mmh, Pfefferminztee! Schön frisch!',{},300); if(!al()) return; return end(); }
 case 'kuchen': { if(k.M.cakeRow&&k.M.cakeRow.n>=3) return bellyache(t);
  if(k.M.cakeRow&&k.M.cakeRow.n===2){ A.lid=0.3; A.low=0.6; A.blush=0.9; await sayW('Noch ein Stück Kuchen! Mmmh!',{},250); if(!al()) return; A.belly=0.4; await sayW('Uff … mein Bauch ist ganz voll.',{},300); A.belly=0; if(!al()) return; return end(); }
  A.lid=-0.02; A.pup=1.4; A.earWig=2; A.blush=1; await sayW('Zuckerschock! Wiiii!',{},50); if(!al()) return;
  for(let i=0;i<9;i++){ A.hop=i%2?1.5:0.4; if(i%3===0) k.st.spinV=11; if(i%2) K.V.giggle(3); pf('🍭',()=>scr([0,0.9,0.1]),{n:1,sx:240}); await wait(300); if(!al()) return; }
  A.hop=0; A.earWig=0; A.lid=0.7; A.earUp=-0.6; A.hx=0.18; await sayW('So müde...',{pitch:0.85,rate:1.4},200); if(!al()) return; A.lid=1; A.sleepB=1; K.V.snore(); pf('z',()=>scr([0.1,1,0.1]),{n:3,gap:500}); await wait(3300); if(!al()) return; A.lid=0.2; A.sleepB=0; A.hx=0; return end(); }
 case 'milch': { stache.visible=true; A.low=0.6; A.lid=0.5; await sayW('Mmh, Milch …',{},300); if(!al()){ return; } A.lookY=-0.4; A.blush=0.8; await sayW('Ich hab einen Milchbart!',{},400); A.lookY=0; k.mouthPlay(V.giggle(5));
  setTimeout(()=>{ stache.visible=false; },9000); await wait(900); if(!al()) return; return end(); }
 case 'blitzo': { FX.glow=[0.25,0.32,0.05]; A.glow=1; A.lid=-0.05; A.pup=1.3; A.earUp=0.9; await sayW('Hat Elektrolyte!',{},100); if(!al()) return;
  for(let i=0;i<8;i++){ A.hop=i%2?1.4:0.2; if(i===3) k.st.spinV=14; pf('⚡',()=>scr([0,0.6,0.2]),{n:2,sx:300,dy:-90}); await wait(300); if(!al()) return; }
  await sayW('Ich glühe!',{},200); await sayW('Wuuusch!',{},600); if(!al()) return; A.glow=0; return end(); }
 case 'banane': { A.low=0.6; A.lid=0.4; A.earWig=1.2; const d=say('Uh uh ah ah! Bananen-Tanz!'); const r=V.sing(1.7,false); 
  for(let i=0;i<14;i++){ A.bodyY=(i%2?1:-1)*0.5; A.hz=(i%2?-1:1)*0.18; A.hop=i%4<2?1:0.2; if(i%3===0) pf('🍌',()=>scr([0,0.9,0.1]),{n:1,sx:240}); await wait(260); if(!al()) return; }
  A.bodyY=0; return end(); }
 case 'popcorn': { for(let i=0;i<5;i++){ A.sq=0.08; await wait(120); A.sq=0; A.hop=1.3; A.lid=0.9; K.V.pop(); K.bubble('Hicks!',0.4); pf('🍿',beakP,{n:2,dy:-140,sx:160,s0:.5,s1:1.1}); await wait(420); A.hop=0; A.lid=0.2; await wait(450+Math.random()*300); if(!al()) return; }
  await sayW('Popcorn! Plopp!'); if(!al()) return; return end(); }
 case 'brokkoli': { A.earUp=0.9; A.brow=0.7; A.low=0.3; A.sq=-0.07; A.paw=0; pf('💪',()=>scr([-0.42,0.4,0.15],k.G.root),{n:3,gap:300,dy:-30,sx:20,s0:.8,s1:1.6,fs:40}); pf('💪',()=>scr([0.42,0.4,0.15],k.G.root),{n:3,gap:300,dy:-30,sx:20,s0:.8,s1:1.6,fs:40});
  for(let i=0;i<3;i++){ A.sq=-0.09; A.hz=0.06; await wait(400); A.sq=0.03; A.hz=-0.06; await wait(300); if(!al()) return; } A.sq=-0.05; await sayW('Stark wie ein Bär!',{pitch:0.8},500); if(!al()) return; return end(); }
 case 'gummi': { FX.rainbow=performance.now()+9000; A.low=0.7; A.lid=0.5; A.blush=0.8; A.earWig=1; pf('🌈',()=>scr([0,1.05,0.1]),{n:1,dy:-60,s0:.7,s1:2,d:2.4,fs:44});
  await sayW('Gummibärchen-Regenbogen!',{},400); if(!al()) return; for(let i=0;i<4;i++){ A.hop=i%2?1:0.2; await wait(350); } await sayW('Regenbogen!',{},1200); if(!al()) return; return end(); }
 case 'keks': return end();
 } };
function mark2(){}
/* ---------- v3: Kuchen-Zähler, Bauchweh, Pupse, Schoko-Schnute ---------- */
function cakeCount(id){ const M=K.M, now=Date.now(); if(id==='kuchen'){ const c=M.cakeRow; M.cakeRow=(c&&now-c.ts<30*60000)?{n:c.n+1,ts:now}:{n:1,ts:now}; } else if(id!=='tee') M.cakeRow=null; K.save(); }
async function bellyache(t){ const k=K, A=k.A, al=()=>k.alive(t); A.low=0.4; A.lid=0.3; await sayW('Noch mehr Kuchen …',{},200); if(!al()) return;
 A.lid=0.6; A.earUp=-0.7; A.brow=-0.4; A.belly=1; A.hx=0.12; A.pup=1.2; k.M.tummy=Date.now(); k.M.cakeRow=null; k.save(); FX.tint=[0.9,1.02,0.86];
 const r=GF.sfx('whine')||k.V.whine(); k.mouthPlay(r); await wait(r.dur*1000+200); if(!al()) return;
 await sayW('Uff! Mein Bauch macht Blubb! Drei Kuchen waren zu viel!',{},300); if(!al()) return;
 k.toast('🤢 Giß-Moe hat Bauchweh!<br>Gib ihm einen Pfefferminztee 🍵'); await sayW('Ich brauch einen Pfefferminztee!',{},400); FX.tint=null; if(al()) k.rest(); }
GF.tummyRefuse=async function(){ const k=K; if(!k.M.tummy) return false; const t=k.begin(); k.rest(); const A=k.A; A.belly=1; A.lid=0.6; A.earUp=-0.6; A.hx=-0.1; A.brow=-0.3;
 const r=GF.sfx('whine')||k.V.whine(); k.mouthPlay(r); await wait(r.dur*1000+150); if(!k.alive(t)) return true; await sayW(['Aua, mein Bauch! Ich brauch Pfefferminztee!','Nein danke! Mein Bauch ist ein grummelnder Bär! Pfefferminztee bitte!'][(Math.random()*2)|0],{},300);
 if(k.alive(t)) k.rest(); return true; };
GF.idleHook=function(r){ const k=K, M=k.M; if(M.tummy&&r<0.55){ const t=k.begin(); k.rest(); const A=k.A; A.belly=1; A.lid=0.55; A.earUp=-0.5; A.hx=0.1; const w=GF.sfx('whine')||k.V.whine(); k.mouthPlay(w);
   setTimeout(()=>{ if(k.alive(t)) k.say(['Aua … Bauchweh …','Pfefferminztee wär jetzt gut …','Mein Bauch grummelt wie ein Donnerwetter …'][(Math.random()*3)|0]); },w.dur*1000+100); setTimeout(()=>{ if(k.alive(t)) k.rest(); },w.dur*1000+3000); return true; }
 if(M.choco&&chocoA()>0.3&&r<0.22){ const t=k.begin(); const A=k.A; A.lookY=-0.35; A.blush=0.7; for(let i=0;i<3;i++) setTimeout(()=>{ A.jaw=0.7; setTimeout(()=>A.jaw=0.1,120); },i*300); setTimeout(()=>{ if(k.alive(t)){ k.say('Ich hab noch Schoko im Gesicht! Schleck, schleck! Hihi!'); } },1000); setTimeout(()=>{ if(k.alive(t)) k.rest(); },3600); return true; }
 return false; };
/* Pups-Geräusch (Synth, kindgerecht albern) */
function fart(s){ const V=K.V, c=V.ctx; if(!c) return; const t=c.currentTime+0.02, d=0.55+0.5*s;
 const o=c.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(95+Math.random()*20,t); o.frequency.exponentialRampToValueAtTime(58,t+d);
 const lfo=c.createOscillator(); lfo.frequency.setValueAtTime(22,t); lfo.frequency.linearRampToValueAtTime(14,t+d); const lg=c.createGain(); lg.gain.value=26; lfo.connect(lg).connect(o.frequency);
 const am=c.createOscillator(); am.frequency.value=31; const ag=c.createGain(); ag.gain.value=0.35; am.connect(ag);
 const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(700,t); lp.frequency.exponentialRampToValueAtTime(260,t+d); lp.Q.value=4;
 const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.55*s+0.2,t+0.04); g.gain.setValueAtTime(0.5*s+0.2,t+d*0.7); g.gain.exponentialRampToValueAtTime(0.0001,t+d); ag.connect(g.gain);
 o.connect(lp).connect(g).connect(V.out); [o,lfo,am].forEach(x=>{ x.start(t); x.stop(t+d+0.05); });
 V.noise&&V.noise(t+d*0.6,d*0.5,'bandpass',420,0.12*s,1.5); }
/* kleine Pups-Wolke in 3D (hellgrün, weich) */
function cloud(){ const g=new THREE.Group(); const m=new THREE.MeshStandardMaterial({color:0xcfe9a6,roughness:1,transparent:true,opacity:0.8,depthWrite:false});
 for(let i=0;i<7;i++){ const b=new THREE.Mesh(new THREE.SphereGeometry(0.05+Math.random()*0.04,14,10),m); b.position.set((Math.random()-.5)*0.18,Math.random()*0.08,(Math.random()-.5)*0.08); g.add(b); }
 g.position.set(0,0.12,-0.3); K.G.root.add(g); const t0=performance.now();
 (function an(){ const k=(performance.now()-t0)/2400; if(k>=1){ K.G.root.remove(g); g.children.forEach(c=>c.geometry.dispose()); m.dispose(); return; }
  g.position.y=0.12+k*0.35; g.position.z=-0.3-k*0.2; g.scale.setScalar(0.7+k*1.2); m.opacity=0.8*(1-k); requestAnimationFrame(an); })(); }
/* Schoko-Schnute */
let choco=null; const CHOCO_FADE=20*60000;
function chocoA(){ const c=K.M.choco; if(!c) return 0; return Math.max(0,c.a*(1-(Date.now()-c.t)/CHOCO_FADE)); }
function buildChoco(){ choco={visible:false}; }
function chocoUpd(force){ if(!choco) buildChoco(); const a=chocoA(); if(K.M.choco&&a<=0.02){ K.M.choco=null; K.save(); }
 choco.visible=a>0.02; if(K.G.U.uChoco) K.G.U.uChoco.value=Math.min(1,a*1.3); chips(); }
let chipEl=null;
function chips(){ if(!chipEl){ chipEl=document.createElement('div'); chipEl.id='chips'; document.body.appendChild(chipEl);
  const st=document.createElement('style'); st.textContent='#chips{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:calc(170px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:8px;z-index:11}#chips button{border:0;border-radius:22px;padding:10px 16px;font:800 17px system-ui;color:#4a2c14;background:linear-gradient(180deg,#fff6e4,#f1d6a8);box-shadow:0 6px 18px rgba(0,0,0,.35),inset 0 -3px 0 rgba(120,70,20,.25);animation:chipIn .4s}#chips button.on{outline:3px solid #ffb84d}@keyframes chipIn{from{transform:scale(.6);opacity:0}}@media (max-aspect-ratio:1/1){#chips{bottom:calc(158px + env(safe-area-inset-bottom))}}'; document.head.appendChild(st); }
 const want=[]; if(choco&&choco.visible) want.push(['wipe','🧽 Abwischen']); if(K.M.tummy) want.push(['tea','🍵 Tee geben']);
 const key=want.map(w=>w[0]).join(); if(chipEl.dataset.k===key) return; chipEl.dataset.k=key; chipEl.innerHTML='';
 want.forEach(([id,tx])=>{ const b=document.createElement('button'); b.textContent=tx; b.addEventListener('pointerdown',e=>e.stopPropagation()); b.addEventListener('pointerup',e=>{ e.stopPropagation(); K.V.unlock&&K.V.unlock(); if(id==='wipe') GF.wipe(); else GF.eat('tee'); }); chipEl.appendChild(b); }); }
GF.wipe=function(){ if(!K.M.choco) return; K.V.unlock&&K.V.unlock(); if(window.GissHair){ GissHair.setTool('sponge'); K.toast('🧽 Wisch Giß-Moe übers Gesicht!'); } else { K.M.choco=null; chocoUpd(); } };
function onWipe(d){ const c=K.M.choco; if(!c) return; const a=chocoA(); const na=Math.max(0,a-d/1800); c.a=na/Math.max(0.05,1-(Date.now()-c.t)/CHOCO_FADE); K.A.lid=0.7; K.A.low=0.5; K.A.blush=0.7;
 if(Math.random()<0.05) K.mouthPlay(GF.sfx('giggle')||K.V.giggle(2)); chocoUpd();
 if(na<=0.03){ K.M.choco=null; K.save(); chocoUpd(); if(window.GissHair) GissHair.setTool(null); K.V.chime(); K.fx('✨','',4); K.xp(1); K.say('Sauber! Danke schön!'); setTimeout(()=>K.rest(),1800); } }
/* vorgerenderte Geräusch-Clips (Kichern etc.) statt Synth */
GF.sfx=function(kind){ const L=VM&&VM.sfx&&VM.sfx[kind]; if(!L||!L.length) return null; const f=L[(Math.random()*L.length)|0]; return BUF[f]?play(f):null; };
let gremlin=async function(t){ const k=K, A=k.A, al=()=>k.alive(t); k.mark('gremlin');
 A.trem=1; pf('✨',()=>scr([0,0.6,0.2]),{n:10,gap:40,sx:280,dy:-60}); k.V.chime(); await wait(600); if(!al()) return;
 FX.tint=[0.62,1.05,0.5]; crest.visible=true; A.trem=0; A.brow=1; A.earUp=0.95; A.earFwd=-0.5; A.lid=0.45; A.pup=0.7; A.low=0.5;
 await sayW('Hehehe! Mitternachtssnack!',{},200); if(!al()){ crest.visible=false; FX.tint=null; return; }
 for(let i=0;i<8;i++){ A.hop=i%2?1.3:0.2; A.hz=(i%2?1:-1)*0.16; if(i===2||i===6) k.st.spinV=10; if(i%2) k.mouthPlay(k.V.giggle(4)); if(i===4){ k.bubble('Pfffrt! 😜',0.9); k.V.noise(k.V.t(),0.5,'bandpass',300,0.5,2); } pf(['😜','👾','🍪'][i%3],()=>scr([0,0.9,0.1]),{n:1,sx:260}); await wait(380); if(!al()){ crest.visible=false; FX.tint=null; return; } }
 A.hop=0; A.trem=1; pf('💨',()=>scr([0,0.4,0.1],k.G.root),{n:6,gap:60,sx:200,dy:-40,s1:2.4}); k.V.pop(); await wait(500); crest.visible=false; FX.tint=null; A.trem=0; k.rest(); A.lid=0.3; A.lookX=0.5;
 await wait(500); A.lookX=-0.5; await wait(500); A.lookX=0; await sayW('Huch? Was war denn los?'); k.rest(); k.xp(2); }
/* Essens-Tablett */
let tray;
function buildTray(){ tray=document.createElement('div'); tray.id='tray'; tray.className='panel';
 tray.innerHTML='<div class="ph"><b>Was soll Giß-Moe essen?</b><button class="x" aria-label="Schließen">✕</button></div><div class="grid"></div>';
 const g=tray.querySelector('.grid'); FOOD.forEach(f=>{ const b=document.createElement('button'); b.className='fd'; b.innerHTML='<i>'+(f.draw?'<img src="'+iconURL(f.id)+'" style="width:46px;height:46px;display:block">':f.e)+'</i><span>'+f.n+'</span><small>'+f.h+'</small>'; b.addEventListener('pointerup',e=>{ e.preventDefault(); e.stopPropagation(); K.V.unlock(); GF.eat(f.id); }); g.appendChild(b); });
 tray.querySelector('.x').addEventListener('pointerup',e=>{ e.stopPropagation(); closeTray(); }); tray.addEventListener('pointerdown',e=>e.stopPropagation()); document.body.appendChild(tray); }
function closeTray(){ tray.classList.remove('show'); }
GF.openTray=()=>{ closeTalk(); tray.classList.add('show'); };
/* ---------- Frag Moe (Magic 8 Ball) ---------- */
let talk, micStream=null, micDenied=false, asking=false;
function buildTalk(){ talk=document.createElement('div'); talk.id='talk'; talk.className='panel';
 talk.innerHTML='<div class="ph"><b>🎱 Frag Giß-Moe!</b><button class="x" aria-label="Schließen">✕</button></div>'+
 '<p class="hint">Stell eine Ja-oder-Nein-Frage – laut, getippt oder einfach denken.</p>'+
 '<div class="row"><button id="tMic" class="big">🎤<span>Laut fragen</span></button><button id="tTap" class="big">🤫<span>Leise denken</span></button></div>'+
 '<div class="row"><input id="tIn" maxlength="120" placeholder="… oder hier tippen" autocomplete="off"><button id="tGo">Fragen</button></div><div id="tLvl"><div></div></div>';
 document.body.appendChild(talk); talk.addEventListener('pointerdown',e=>e.stopPropagation());
 const $=id=>document.getElementById(id);
 talk.querySelector('.x').addEventListener('pointerup',e=>{ e.stopPropagation(); closeTalk(); });
 $('tMic').addEventListener('pointerup',e=>{ e.preventDefault(); K.V.unlock(); askMic(); });
 $('tTap').addEventListener('pointerup',e=>{ e.preventDefault(); K.V.unlock(); askSilent(); });
 const go=()=>{ K.V.unlock(); const v=$('tIn').value; $('tIn').value=''; $('tIn').blur(); askText(v); };
 $('tGo').addEventListener('pointerup',e=>{ e.preventDefault(); go(); }); $('tIn').addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter') go(); }); }
function closeTalk(){ if(talk) talk.classList.remove('show'); stopMic(); }
let lastAskT=0;
GF.openTalk=async()=>{ closeTray(); talk.classList.add('show'); const k=K; if(k.st.mode==='sleep') await k.wake(); if(asking||k.st.busy) return; const t=k.begin(); k.rest(); k.A.earUp=0.5; k.A.low=0.4;
 /* 3.1: Aufforderung nicht bei jedem Öffnen wiederholen (Cooldown 90 s) */ const now=Date.now(); if(now-lastAskT<90000){ k.bubble('Frag mich was! 🎱',2); return; } lastAskT=now; await partsPlay(ans('ask'),t); };
GF.askCooldown=()=>Date.now()-lastAskT<90000; GF.markAsk=()=>{ lastAskT=Date.now(); };
const ans=id=>VM&&VM.answers.find(a=>a.id===id)||FALLBACK.find(a=>a.id===id);
const FALLBACK=[{id:'ask',t:'Frag mich was! Eine Ja-oder-Nein-Frage! 🎱',parts:[]},{id:'nudge',t:'🐾 *stupst dich an* Hey! Du hast gar nichts gefragt! Probier es nochmal!',parts:[]},{id:'listen',t:'Ich höre zu... 👂',parts:[]},{id:'says',t:'🎱 Dein Haustier sagt:',parts:[]},
 {id:'bye1',t:'*gähnt laut* Okay... ich gehe in meine Höhle...',parts:[]},{id:'bye2',t:'*schnarcht leise und rollt sich zusammen* 💤🐾',parts:[]},{id:'bye3',t:'Bis zum nächsten Mal! Dah!',parts:[]}];
async function partsPlay(a,t,prefix){ const k=K, A=k.A; if(!a) return; const txt=(prefix||'')+a.t; let shown=false; const show=d=>{ k.bubble(txt,Math.max(d,2.2)+1.2); shown=true; };
 const hasClip=a.parts.some(p=>p.a&&BUF[p.a]);
 if(!a.parts.length||!hasClip){ const r=speak(a.t); show(r.dur); k.mouthPlay(r); await wait(r.dur*1000+300); fxOnly(a); return; }
 let total=0; a.parts.forEach(p=>{ total+=p.a&&BUF[p.a]?BUF[p.a].ab.duration+0.1:0.9; }); show(total);
 for(const p of a.parts){ if(!k.alive(t)) return; if(p.a){ const r=play(p.a); if(r){ k.mouthPlay(r); await wait(r.dur*1000+80); } } else await sfx(p.fx); } }
function fxOnly(a){ a.parts.forEach(p=>p.fx&&sfx(p.fx)); }
async function sfx(n){ const k=K, A=k.A, V=k.V;
 if(n==='earwig'){ A.earWig=2; await wait(700); A.earWig=0; }
 else if(n==='chomp'){ V.chomp(3); A.jaw=0.6; await wait(700); A.jaw=0; }
 else if(n==='yawn'){ const r=V.yawn(); k.mouthPlay(r); A.lid=0.6; await wait(r.dur*1000); A.lid=0.2; }
 else if(n==='whine'){ const r=V.whine(); k.mouthPlay(r); A.earUp=-0.5; await wait(r.dur*1000); A.earUp=0; }
 else if(n==='hide'){ A.paw=1; A.lid=1; await wait(1300); A.paw=0; A.lid=0.2; }
 else if(n==='pout'){ A.brow=1; A.hy=0.4; k.mouthPlay(V.say('pfff',{pitch:0.8})); await wait(700); A.brow=0; A.hy=0; }
 else if(n==='beep'){ for(let i=0;i<3;i++){ beep(1600,0.12); A.glow=1; await wait(160); A.glow=0; await wait(90); } }
 else if(n==='poke'){ A.hop=0.8; A.hz=0.15; V.pop(); await wait(400); A.hop=0; A.hz=0; }
 else if(n==='snore'){ A.lid=1; V.snore(); pf('💤',()=>scr([0.1,1,0.1]),{n:2,gap:600}); await wait(2600); } }
function beep(f,d){ const c=K.V.ctx; if(!c) return; const o=c.createOscillator(), g=c.createGain(); o.type='square'; o.frequency.value=f; g.gain.setValueAtTime(0.0001,c.currentTime); g.gain.exponentialRampToValueAtTime(0.12,c.currentTime+0.01); g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+d); o.connect(g).connect(K.V.out); o.start(); o.stop(c.currentTime+d+0.02); }
function rattle(d){ const V=K.V; if(!V.ctx) return; let t=V.t()+0.02; for(let i=0;i<d/0.06;i++){ V.noise(t,0.04,'bandpass',900+Math.random()*1400,0.18,4); t+=0.06; } }
function stopMic(){ if(micStream){ micStream.getTracks().forEach(x=>x.stop()); micStream=null; } const l=document.getElementById('tLvl'); if(l) l.classList.remove('on'); }
function listenPose(on){ const A=K.A; if(on){ A.earUp=0.9; A.earFwd=0.45; A.earWig=0.7; A.lid=0.0; A.pup=1.3; A.hz=0.12; A.low=0.2; } else { A.earWig=0; A.hz=0; } }
let askMic=async function(){ if(asking) return; const k=K; if(k.st.mode==='sleep') await k.wake();
 if(micDenied||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ k.toast('🎤 Kein Mikro – ich höre dich trotzdem! 😉'); return askSilent(); }
 asking=true; const t=k.begin(); k.rest(); listenPose(true);
 try{ micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}}); }
 catch(e){ asking=false; micDenied=true; listenPose(false); k.toast('🎤 Das Mikro ist aus. Kein Problem –<br>du kannst tippen oder leise denken!'); k.save(); return askSilent(); }
 if(!k.alive(t)){ stopMic(); asking=false; return; }
 await partsPlay(ans('listen'),t); listenPose(true);
 const c=k.V.ctx, src=c.createMediaStreamSource(micStream), an=c.createAnalyser(); an.fftSize=1024; src.connect(an); const buf=new Float32Array(an.fftSize); const lvl=document.getElementById('tLvl'); lvl.classList.add('on');
 let floor=0.004, t0=performance.now(), spoke=0, loud=0, lastLoud=0, res='none';
 await new Promise(done=>{ const step=()=>{ if(!k.alive(t)||!micStream){ res='cancel'; return done(); } an.getFloatTimeDomainData(buf); let s=0; for(let i=0;i<buf.length;i++) s+=buf[i]*buf[i]; const rms=Math.sqrt(s/buf.length), now=performance.now();
   if(now-t0<350) floor=Math.max(floor,rms); const th=Math.max(0.018,floor*2.6); lvl.firstChild.style.width=Math.min(100,rms/th*45)+'%';
   if(rms>th){ loud+=16; lastLoud=now; if(loud>180&&!spoke){ spoke=now; k.A.earWig=1.6; } } else loud=Math.max(0,loud-8);
   if(spoke&&now-lastLoud>1100){ res='q'; return done(); } if(!spoke&&now-t0>6500){ res='none'; return done(); } if(now-t0>12000){ res=spoke?'q':'none'; return done(); }
   requestAnimationFrame(step); }; step(); });
 stopMic(); src.disconnect(); listenPose(false); asking=false; if(res==='cancel') return;
 if(res==='none'&&Date.now()-lastNudge>45000){ lastNudge=Date.now(); return nudge(t); } return answer(t); }
let lastNudge=0;
let askSilent=async function(){ const k=K; if(k.st.mode==='sleep') await k.wake(); const t=k.begin(); k.rest(); listenPose(true); k.bubble('Denk ganz fest an deine Frage … 🤔',2); await wait(2300); listenPose(false); if(k.alive(t)) await answer(t); }
const BYE=/\b(schlafen|schlaf|exit|beenden|bye)\b/i;
let askText=async function(v){ const k=K; if(k.st.mode==='sleep') await k.wake(); const t=k.begin(); k.rest(); v=(v||'').trim();
 if(!v) return nudge(t); if(BYE.test(v)) return bye(t); listenPose(true); await wait(900); listenPose(false); if(k.alive(t)) await answer(t); }
async function nudge(t){ K.rest(); await partsPlay(ans('nudge'),t); K.rest(); }
async function bye(t){ const k=K, A=k.A; closeTalk(); await partsPlay(ans('bye1'),t); if(!k.alive(t)) return; A.lid=0.8; A.earUp=-0.5; await wait(300);
 A.lid=1; A.hx=0.22; A.hz=0.08; A.sleepB=1; k.bubble(ans('bye2').t,2.4); await sfx('snore'); if(!k.alive(t)) return; await partsPlay(ans('bye3'),t);
 k.st.mode='sleep'; k.mark('sleep'); A.lid=1; A.hx=0.22; A.hz=0.08; A.earUp=-0.6; A.sleepB=1; }
let lastAns='', lastCat='';
async function answer(t){ const k=K, A=k.A, V=k.V, al=()=>k.alive(t); k.mark('8ball'); k.rest();
 k.bubble('*rattert* *fiept* *schüttelt sein ganzes Fell*',1.8); A.trem=1.3; A.earWig=2.5; A.lid=0.6; rattle(1.4); setTimeout(()=>al()&&V.whine(),700);
 for(let i=0;i<6;i++){ A.hz=(i%2?1:-1)*0.2; A.bodyY=(i%2?1:-1)*0.25; await wait(220); if(!al()) return; }
 A.trem=0; A.earWig=0; A.hz=0; A.bodyY=0; A.lid=-0.05; A.pup=1.35; await wait(250);
 k.bubble('✨ *Augen leuchten auf* ✨',1.4); A.glow=1; V.chime(); pf('✨',()=>scr([0,0.72,0.3]),{n:6,gap:90,sx:160,dy:-70}); await wait(1500); if(!al()) return;
 /* 3.1: "Frag nochmal"-Antworten (neu) selten und nie zweimal hintereinander – sonst Endlosschleife */ const neuOk=lastCat!=='neu'&&Math.random()<0.15; const pool=VM?VM.answers.filter(a=>a.cat!=='sys'&&a.id!==lastAns&&(a.cat!=='neu'||neuOk)):[]; const a=pool.length?pool[(Math.random()*pool.length)|0]:{t:'Dah! Auf jeden Fall! *wackelt mit den Ohren* 👽✨',parts:[{fx:'earwig'}],cat:'pos'}; lastAns=a.id; lastCat=a.cat||'';
 const sc=ans('says'); const sp=sc&&sc.parts[0]&&sc.parts[0].a&&play(sc.parts[0].a); k.bubble('🎱 Giß-Moe sagt: …',1.2); if(sp){ k.mouthPlay(sp); await wait(sp.dur*1000+120); } else await wait(700); if(!al()) return;
 A.glow=0; if(a.cat==='pos'){ A.low=0.6; A.lid=0.35; A.earUp=0.5; A.hop=0.5; } else if(a.cat==='neg'){ A.brow=0.6; A.earUp=-0.4; A.lid=0.35; } else { A.lookX=0.4; A.lookY=0.3; A.lid=0.4; }
 await partsPlay(a,t,'🎱 Giß-Moe sagt: '); if(!al()) return; await wait(600); k.rest(); k.xp(1); }
/* ---------- Hütchenspiel (3D, auf der Decke) ---------- */
let cups=[], cupG=null, game=null;
function buildCups(){ cupG=new THREE.Group(); cupG.visible=false; K.stage.add(cupG);
 const pts=[]; for(let i=0;i<=12;i++){ const v=i/12; pts.push(new THREE.Vector2(0.17-0.055*v+(v>0.92?0.01:0),v*0.40)); } pts.push(new THREE.Vector2(0.115,0.405),new THREE.Vector2(0.0,0.41));
 const c=document.createElement('canvas'); c.width=256; c.height=128; const x=c.getContext('2d'); const g=x.createLinearGradient(0,0,0,128); g.addColorStop(0,'#c8202f'); g.addColorStop(1,'#8d1020'); x.fillStyle=g; x.fillRect(0,0,256,128);
 x.fillStyle='#f2c25a'; x.fillRect(0,14,256,9); x.fillRect(0,104,256,7); x.font='bold 26px system-ui'; x.fillStyle='#ffd77a'; for(let i=0;i<4;i++) x.fillText('★',i*64+20,72);
 const tx=new THREE.CanvasTexture(c); tx.colorSpace=THREE.SRGBColorSpace; tx.wrapS=THREE.RepeatWrapping;
 const geo=new THREE.LatheGeometry(pts,40); const uv=geo.attributes.uv; for(let i=0;i<uv.count;i++) uv.setY(i,1-uv.getY(i));
 const mat=new THREE.MeshPhysicalMaterial({map:tx,roughness:0.35,clearcoat:0.8,clearcoatRoughness:0.2,side:THREE.DoubleSide});
 for(let i=0;i<3;i++){ const m=new THREE.Mesh(geo,mat); m.name='cup'+i; m.userData.i=i; cupG.add(m); cups.push(m); } }
const SLOT=i=>(i-1)*(innerWidth<innerHeight?0.42:0.56);
function cupTick(dt,t){ if(!game) return; game.cl.forEach((c,i)=>{ const m=cups[i]; m.position.set(c.x,c.y,c.z); }); if(game.moe){ const g=K.G.group; g.position.set(game.moe.x,0,game.moe.z); g.scale.setScalar(0.34); } }
async function tween(ms,f){ const t0=performance.now(); return new Promise(r=>{ const s=()=>{ const k=Math.min(1,(performance.now()-t0)/ms); f(k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2); if(k<1) requestAnimationFrame(s); else r(); }; s(); }); }
let hud;
function buildHud(){ hud=document.createElement('div'); hud.id='cupHud'; hud.innerHTML='<div class="hs"><span id="cLv">Level 1</span><span id="cSc">⭐ 0</span><span id="cSt">🔥 0</span></div><div id="cMsg"></div><div class="row"><button id="cNext">Weiter ▶</button><button id="cEnd">Fertig</button></div>';
 document.body.appendChild(hud); hud.addEventListener('pointerdown',e=>e.stopPropagation());
 document.getElementById('cNext').addEventListener('pointerup',e=>{ e.stopPropagation(); K.V.unlock(); round(); });
 document.getElementById('cEnd').addEventListener('pointerup',e=>{ e.stopPropagation(); GF.endCups(); }); }
function hudSet(msg,btns){ const g=game; document.getElementById('cLv').textContent='Level '+g.level; document.getElementById('cSc').textContent='⭐ '+g.score; document.getElementById('cSt').textContent='🔥 '+g.streak+(K.M.cupBest?'  ·  Rekord '+K.M.cupBest:''); document.getElementById('cMsg').innerHTML=msg||''; hud.querySelector('.row').style.visibility=btns?'visible':'hidden'; }
GF.startCups=async function(){ const k=K; closeTray(); closeTalk(); if(k.st.mode==='sleep') await k.wake(); k.begin(); k.rest(); k.st.game='cups'; k.interact();
 document.body.classList.add('gaming'); cupG.visible=true; k.shadow.visible=false; k.st.spin=0; k.st.spinV=0;
 game={level:1,score:0,streak:0,cl:[0,1,2].map(i=>({x:SLOT(i),y:0.55,z:0.22})),moe:{x:0,z:0.22},under:1,state:'intro',slot:[0,1,2]};
 hud.classList.add('show'); hudSet('Pass gut auf, wo ich mich verstecke!',false); round(); };
GF.endCups=function(){ const k=K; if(!game) return; game=null; k.st.game=false; cupG.visible=false; hud.classList.remove('show'); document.body.classList.remove('gaming'); const g=k.G.group; g.position.set(0,0,0); g.scale.setScalar(1); g.visible=true; k.shadow.visible=true; k.rest(); k.save(); k.interact(); };
async function round(){ const g=game; if(!g||g.state==='shuffle'||g.state==='drop') return; const k=K, A=k.A; g.state='drop'; hudSet('Pass gut auf! 👀',false);
 // Startaufstellung: Moe unter einem zufälligen Becher
 g.slot=[0,1,2]; g.cl.forEach((c,i)=>{ c.x=SLOT(i); c.z=0.22; }); g.under=(Math.random()*3)|0; g.moe={x:SLOT(g.under),z:0.22}; k.G.group.visible=true;
 await tween(350,e=>g.cl.forEach(c=>c.y=0.55+(0.75-0.55)*(1-e)*0)); k.rest(); A.lid=0.2; A.low=0.6; A.earWig=1; A.hop=0.6; await wait(say('Such mich!')*1000+100); A.hop=0; if(!game) return;
 await tween(450,e=>g.cl.forEach(c=>c.y=0.55*(1-e))); k.V.pop(); k.G.group.visible=false; if(!game) return;
 g.state='shuffle'; const n=3+g.level*2, ms=Math.max(170,620-g.level*55);
 for(let s=0;s<n;s++){ if(!game) return; const a=(Math.random()*3)|0; let b=(a+1+((Math.random()*2)|0))%3; const ca=g.cl[a], cb=g.cl[b], xa=ca.x, xb=cb.x, dir=Math.random()<.5?1:-1;
  k.V.noise&&k.V.noise(k.V.t(),ms/1000,'bandpass',500,0.06,1);
  await tween(ms,e=>{ ca.x=xa+(xb-xa)*e; cb.x=xb+(xa-xb)*e; const z=Math.sin(e*Math.PI)*0.2*dir; ca.z=0.22+z; cb.z=0.22-z; }); }
 if(!game) return; g.state='pick'; hudSet('Unter welchem Becher bin ich? Tipp ihn an! 👆',false); }
GF.pointer=function(e){ const g=game; if(!g) return true; if(g.state!=='pick') return true; const k=K; const nd=new THREE.Vector2(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1); const rc=new THREE.Raycaster(); rc.setFromCamera(nd,k.cam);
 const h=rc.intersectObjects(cups,false)[0]; if(!h) return true; reveal(h.object.userData.i); return true; };
async function reveal(i){ const g=game, k=K, A=k.A; g.state='reveal'; const ok=i===g.under; const c=g.cl[i]; g.moe={x:c.x,z:c.z};
 if(ok){ k.G.group.visible=true; } await tween(380,e=>c.y=0.5*e); if(!game) return;
 if(ok){ g.score+=g.level; g.streak++; g.level++; if(g.streak>(k.M.cupBest||0)) k.M.cupBest=g.streak; k.save(); k.V.chime(); k.rest(); A.lid=0.5; A.low=0.7; A.blush=1; A.earWig=1.5; A.hop=1.2; pf('⭐',()=>scr([0,0.5,0.1],k.G.root),{n:6,gap:80,sx:200,dy:-120});
  hudSet(['Juhu! Gefunden! 🎉','Super aufgepasst! ⭐','Du bist ein Adlerauge! 🦅','Wahnsinn! 🌟'][(Math.random()*4)|0]+(g.streak>=3?'<br>'+g.streak+' richtig hintereinander!':''),true); await wait(say(Math.random()<.5?'Gefunden!':'Juhu!')*1000+300); A.hop=0; k.xp(1); }
 else { g.streak=0; k.V.pop(); hudSet('Leer! 🙈 Ich war hier …',false); await wait(700); const cc=g.cl[g.under]; g.moe={x:cc.x,z:cc.z}; k.G.group.visible=true; await tween(380,e=>cc.y=0.5*e); if(!game) return;
  k.rest(); A.low=0.6; A.lid=0.4; A.earWig=1; A.hz=0.15; await wait(say('Hier bin ich!')*1000+200); A.hz=0; hudSet('Fast! Nochmal? 💪',true); }
 g.state='done'; }
/* ---------- Init ---------- */
GF.init=function(k){ K=k; THREE=k.THREE; base=k.base; buildBits(); buildChoco(); chocoUpd(); if(window.GissHair) GissHair.onWipe=onWipe; buildTray(); buildTalk(); buildCups(); buildHud(); loadVoice(); };
const busyW=f=>async(...a)=>{ K.st.busy=(K.st.busy||0)+1; try{ return await f(...a); } finally{ K.st.busy--; } };
GF.eat=busyW(GF.eat); gremlin=busyW(gremlin); askMic=busyW(askMic); askSilent=busyW(askSilent); askText=busyW(askText);
GF.ask8=v=>askText(v); GF.askMicVAD=()=>askMic();
GF.unlock=decodeAll; GF.gremlin=gremlin; GF._={FX,BUF,get VM(){return VM;},answer,askText,askMic,FOOD,get game(){return game;},reveal};
window.GissFun=GF;
})();
