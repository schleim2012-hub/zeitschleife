/* Giß-Moe Kleiderschrank (selbst gebaute 3D-Teile) + Wimmelbild "Finde Giß-Moe". */
(function(){
let K, THREE; const W={};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const std=(c,o)=>new THREE.MeshPhysicalMaterial(Object.assign({color:c,roughness:0.45,clearcoat:0.4},o||{}));
/* ---------- Teile ---------- */
function tex(draw,w,h){ const c=document.createElement('canvas'); c.width=w||256; c.height=h||64; draw(c.getContext('2d'),c.width,c.height); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=THREE.RepeatWrapping; return t; }
const ITEMS={
 hat:[
  {id:'zylinder',e:'🎩',n:'Zylinder',make(){ const g=new THREE.Group(), m=std(0x232026,{roughness:0.35}), band=std(0xb3263a);
    const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.016,40),m); const top=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.125,0.2,40),m); top.position.y=0.105; const b=new THREE.Mesh(new THREE.CylinderGeometry(0.127,0.127,0.04,40),band); b.position.y=0.03; g.add(brim,top,b); return g; }},
  {id:'krone',e:'👑',n:'Krone',make(){ const g=new THREE.Group(), gold=std(0xf2c14e,{metalness:0.85,roughness:0.25}); const ring=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.14,0.07,32,1,true),gold); ring.material.side=THREE.DoubleSide; g.add(ring);
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2, s=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.08,12),gold); s.position.set(Math.sin(a)*0.13,0.07,Math.cos(a)*0.13); g.add(s);
     const j=new THREE.Mesh(new THREE.SphereGeometry(0.016,12,8),std([0xe23b5a,0x3b8be2,0x4bc46b][i%3],{roughness:0.1,clearcoat:1})); j.position.set(Math.sin(a)*0.141,0,Math.cos(a)*0.141); g.add(j); } return g; }},
  {id:'party',e:'🥳',n:'Partyhut',make(){ const g=new THREE.Group(); const t=tex((x,w,h)=>{ const cs=['#ff6b8a','#ffd166','#5ec8ff','#7ddc6f']; for(let i=0;i<8;i++){ x.fillStyle=cs[i%4]; x.fillRect(i*w/8,0,w/8+1,h); } x.fillStyle='#fff'; for(let i=0;i<14;i++){ x.beginPath(); x.arc(Math.random()*w,Math.random()*h,4,0,7); x.fill(); } });
    const c=new THREE.Mesh(new THREE.ConeGeometry(0.11,0.28,40,1,true),std(0xffffff,{map:t,side:THREE.DoubleSide})); c.position.y=0.14; const p=new THREE.Mesh(new THREE.SphereGeometry(0.035,16,12),std(0xffe16b,{roughness:0.9,clearcoat:0})); p.position.y=0.29; g.add(c,p); g.rotation.z=-0.15; return g; }},
  {id:'muetze',e:'🧶',n:'Bommelmütze',make(){ const g=new THREE.Group(); const t=tex((x,w,h)=>{ x.fillStyle='#3f8fd8'; x.fillRect(0,0,w,h); x.fillStyle='#fff'; x.fillRect(0,h*0.15,w,h*0.12); x.fillRect(0,h*0.55,w,h*0.12); },64,64);
    const d=new THREE.Mesh(new THREE.SphereGeometry(0.16,32,16,0,Math.PI*2,0,Math.PI/2),std(0xffffff,{map:t,roughness:0.9,clearcoat:0})); d.scale.y=0.9; const r=new THREE.Mesh(new THREE.TorusGeometry(0.155,0.03,12,40),std(0xffffff,{roughness:0.95,clearcoat:0})); r.rotation.x=Math.PI/2;
    const p=new THREE.Mesh(new THREE.SphereGeometry(0.055,16,12),std(0xffffff,{roughness:1,clearcoat:0})); p.position.y=0.16; g.add(d,r,p); return g; }},
  {id:'zauber',e:'🧙',n:'Zauberhut',make(){ const g=new THREE.Group(), m=std(0x4b3aa8,{roughness:0.6}); const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.014,40),m); const c=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.34,40),m); c.position.y=0.17; c.rotation.x=-0.12;
    g.add(brim,c); const star=std(0xffd84a,{metalness:0.6,roughness:0.3,emissive:0x664400}); for(let i=0;i<5;i++){ const s=new THREE.Mesh(new THREE.OctahedronGeometry(0.018),star); const a=i*1.3; s.position.set(Math.sin(a)*0.085*(1-i*0.15),0.05+i*0.055,Math.cos(a)*0.085*(1-i*0.15)+0.01); g.add(s); } return g; }},
  {id:'schleife',e:'🎀',n:'Haarschleife',make(){ const g=new THREE.Group(), m=std(0xff6fa8,{roughness:0.35,clearcoat:1}); [-1,1].forEach(s=>{ const l=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.11,4),m); l.rotation.z=s*Math.PI/2; l.position.x=s*0.055; l.scale.z=0.45; g.add(l); }); const k=new THREE.Mesh(new THREE.SphereGeometry(0.025,12,8),m); g.add(k); g.position.set(0.12,0.02,0.02); g.rotation.z=-0.4; return g; }}],
 glasses:[
  {id:'sonne',e:'🕶️',n:'Sonnenbrille',make(){ return specs(0x111111,0x1a1a22,0.85,'round'); }},
  {id:'herz',e:'😍',n:'Herzbrille',make(){ return specs(0xff4f86,0xff7aa6,0.55,'heart'); }},
  {id:'nerd',e:'🤓',n:'Runde Brille',make(){ return specs(0xb0802a,0xdff1ff,0.12,'ring'); }}],
 neck:[
  {id:'fliege',e:'🎗️',n:'Fliege',make(){ const g=new THREE.Group(), m=std(0xd2283c,{roughness:0.3,clearcoat:1}); [-1,1].forEach(s=>{ const l=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.09,4),m); l.rotation.z=s*Math.PI/2; l.position.x=s*0.045; l.scale.z=0.4; g.add(l); }); g.add(new THREE.Mesh(new THREE.SphereGeometry(0.02,12,8),m)); return g; }},
  {id:'schal',e:'🧣',n:'Schal',make(){ const g=new THREE.Group(); const t=tex((x,w,h)=>{ for(let i=0;i<12;i++){ x.fillStyle=i%2?'#f6f1e7':'#e2473b'; x.fillRect(i*w/12,0,w/12+1,h); } });
    const r=new THREE.Mesh(new THREE.TorusGeometry(0.29,0.05,14,48),std(0xffffff,{map:t,roughness:0.95,clearcoat:0})); r.rotation.x=Math.PI/2+0.25; r.scale.set(1,1.05,1); const e=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.16,0.03),std(0xffffff,{map:t,roughness:0.95,clearcoat:0})); e.position.set(0.11,-0.1,0.29); e.rotation.z=0.15; g.add(r,e); g.position.z=-0.06; return g; }},
  {id:'glocke',e:'🔔',n:'Glöckchen',make(){ const g=new THREE.Group(); const r=new THREE.Mesh(new THREE.TorusGeometry(0.2,0.016,10,48),std(0x3fa86a,{roughness:0.5})); r.rotation.x=Math.PI/2+0.25; r.position.z=-0.07;
    const b=new THREE.Mesh(new THREE.SphereGeometry(0.035,16,12),std(0xf2c14e,{metalness:0.9,roughness:0.2})); b.position.set(0,-0.04,0.04); g.add(r,b); return g; }}]};
function specs(frame,lens,op,shape){ const g=new THREE.Group(), fm=std(frame,{roughness:0.3,clearcoat:1}), lm=new THREE.MeshPhysicalMaterial({color:lens,transparent:true,opacity:op,roughness:0.05,clearcoat:1});
 const E=K.G.LM.eyeL, dx=Math.abs(E[0])*1.06;
 [-1,1].forEach(s=>{ let lensG;
  if(shape==='heart'){ const h=new THREE.Shape(); h.moveTo(0,-0.05); h.bezierCurveTo(-0.09,0.0,-0.05,0.07,0,0.03); h.bezierCurveTo(0.05,0.07,0.09,0.0,0,-0.05); lensG=new THREE.ShapeGeometry(h,16); }
  else lensG=new THREE.CircleGeometry(0.068,32);
  const l=new THREE.Mesh(lensG,lm); l.position.set(s*dx,0,0.004); g.add(l);
  if(shape!=='heart'){ const f=new THREE.Mesh(new THREE.TorusGeometry(0.07,shape==='ring'?0.007:0.011,10,40),fm); f.position.set(s*dx,0,0.006); g.add(f); }
  else { const f=new THREE.Mesh(new THREE.ShapeGeometry((()=>{ const h=new THREE.Shape(); h.moveTo(0,-0.058); h.bezierCurveTo(-0.104,0.0,-0.058,0.082,0,0.036); h.bezierCurveTo(0.058,0.082,0.104,0.0,0,-0.058); return h; })(),16),fm); f.position.set(s*dx,0,0.001); g.add(f); }
  const arm=new THREE.Mesh(new THREE.BoxGeometry(0.01,0.01,0.16),fm); arm.position.set(s*(dx+0.07),0.01,-0.08); g.add(arm); });
 const br=new THREE.Mesh(new THREE.TorusGeometry(0.03,0.007,8,16,Math.PI),fm); br.position.set(0,0.005,0.008); g.add(br); return g; }
const SLOTS={hat:{n:'Hüte',parent:'head',pos:()=>[0.0,0.985,0.1],rot:[-0.22,0,0],sc:1.35},glasses:{n:'Brillen',parent:'head',pos:()=>{ const E=K.G.LM.eyeL; return [0.0034,E[1]+0.012,E[2]+0.12]; },rot:[0,0,0],sc:1.5},neck:{n:'Hals',parent:'root',pos:()=>[0.0034,0.5,0.09],rot:[0,0,0]}};
const cur={hat:null,glasses:null,neck:null};
function wear(slot,id,silent){ const S=SLOTS[slot]; if(cur[slot]){ cur[slot].parent.remove(cur[slot]); cur[slot]=null; }
 K.M.wear=K.M.wear||{}; K.M.wear[slot]=id||null; K.save(); if(!id) return;
 const it=ITEMS[slot].find(x=>x.id===id); if(!it) return; const inner=it.make(); const g=new THREE.Group(); g.add(inner); g.position.fromArray(S.pos()); g.rotation.set(...S.rot);
 if(slot==='neck'&&id==='fliege') inner.position.set(0,0.0,0.25); else if(slot==='neck') inner.position.y=-0.02;
 (S.parent==='head'?K.G.head:K.G.root).add(g); cur[slot]=g; const SC=S.sc||1; g.scale.setScalar(silent?SC:0.01); if(!silent){ let k=0; const pop=()=>{ k=Math.min(1,k+0.08); const e=1+Math.sin(k*Math.PI)*0.25*(1-k); g.scale.setScalar(Math.max(0.01,k*e)*SC); if(k<1) requestAnimationFrame(pop); }; pop(); } }
W.wearing=()=>Object.assign({},K.M.wear||{});
W.setVisible=v=>Object.values(cur).forEach(g=>g&&(g.visible=v));
/* Kleiderschrank-Panel */
let pan;
function buildPanel(){ pan=document.createElement('div'); pan.id='wardrobe'; pan.className='panel';
 let h='<div class="ph"><b>👗 Kleiderschrank</b><button class="x" aria-label="Schließen">✕</button></div>';
 for(const s in ITEMS){ h+='<div class="wsl">'+SLOTS[s].n+'</div><div class="wrow" data-s="'+s+'"><button class="wi" data-id=""><i>🚫</i><span>ohne</span></button>'+ITEMS[s].map(it=>'<button class="wi" data-id="'+it.id+'"><i>'+it.e+'</i><span>'+it.n+'</span></button>').join('')+'</div>'; }
 pan.innerHTML=h; document.body.appendChild(pan); pan.addEventListener('pointerdown',e=>e.stopPropagation());
 pan.querySelector('.x').addEventListener('pointerup',e=>{ e.stopPropagation(); pan.classList.remove('show'); });
 pan.querySelectorAll('.wi').forEach(b=>b.addEventListener('pointerup',e=>{ e.stopPropagation(); K.V.unlock(); const s=b.parentNode.dataset.s, id=b.dataset.id; wear(s,id); mark(); react(id); })); mark(); }
function mark(){ const w=K.M.wear||{}; pan.querySelectorAll('.wrow').forEach(r=>r.querySelectorAll('.wi').forEach(b=>b.classList.toggle('on',(w[r.dataset.s]||'')===b.dataset.id))); }
let reactT=0;
async function react(id){ const k=K, A=k.A; if(k.st.mode==='sleep') await k.wake(); const t=k.begin(); k.rest(); k.mark('wear'); A.low=0.6; A.lid=0.35; A.blush=0.8; A.earWig=1.2; A.hop=0.5; k.st.spinV=id?6:0;
 if(id){ k.fx('✨','',3); } const line=!id?'Puh …':(Date.now()-reactT<5000?(Math.random()<.5?'Schick!':'Hihi!'):'Wie sehe ich aus?'); reactT=Date.now();
 await wait(500); await wait(k.say(line)*1000+300); if(k.alive(t)) k.rest(); }
W.open=()=>{ document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show')); mark(); pan.classList.add('show'); };
/* ---------- Wimmelbild ---------- */
let wm=null, moeSpr=null, emo={};
function emoji(ch,px){ const k=ch+px; if(!emo[k]){ const c=document.createElement('canvas'); c.width=c.height=Math.ceil(px*1.25); const x=c.getContext('2d'); x.font=px+'px system-ui,"Noto Color Emoji",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(ch,c.width/2,c.height/2+px*0.06); emo[k]=c; } return emo[k]; }
function snapMoe(){ const k=K, stage=k.stage, R=k.R; const vis=[]; stage.children.forEach(c=>{ vis.push([c,c.visible]); if(c!==k.G.group) c.visible=false; }); W.setVisible(false);
 const sp=k.st.spin; k.G.group.rotation.y=0; const bg=k.S.background; k.S.background=null; const cc=R.getClearAlpha(); R.setClearAlpha(0); R.render(k.S,k.cam);
 const pts=[[0,1.0,0],[0,0,0],[-0.5,0.55,0],[0.5,0.55,0]].map(p=>{ const v=new THREE.Vector3(...p); k.G.root.localToWorld(v); v.project(k.cam); return v; }); const cv=R.domElement, w=cv.width, h=cv.height;
 let x0=Math.min(...pts.map(v=>v.x)), x1=Math.max(...pts.map(v=>v.x)), y0=Math.min(...pts.map(v=>v.y)), y1=Math.max(...pts.map(v=>v.y));
 const sx=(x0*.5+.5)*w-20, sy=(-y1*.5+.5)*h-20, sw=(x1-x0)*.5*w+40, sh=(y1-y0)*.5*h+40; const S=document.createElement('canvas'); const sc=Math.min(1,320/sw); S.width=Math.round(sw*sc); S.height=Math.round(sh*sc);
 S.getContext('2d').drawImage(cv,sx,sy,sw,sh,0,0,S.width,S.height); R.setClearAlpha(cc); k.S.background=bg; vis.forEach(([c,v])=>c.visible=v); W.setVisible(true); k.G.group.rotation.y=sp; return S; }
function variant(src,f){ const c=document.createElement('canvas'); c.width=src.width; c.height=src.height; const x=c.getContext('2d'); x.filter=f.filter||'none'; if(f.flip){ x.translate(c.width,0); x.scale(-1,1); } x.drawImage(src,0,0); x.filter='none';
 if(f.acc){ const e=emoji(f.acc,c.width*0.32); const p=f.accPos||[0.5,0.12]; x.drawImage(e,c.width*p[0]-e.width/2,c.height*p[1]-e.height/2); } return c; }
const DECO=['🌳','🌷','🍄','🪨','🎈','🧸','🌻','🐞','🦋','🌼','🏠','⛲','🍎','🪁','🐌','🌲','🎪','🚂','🐤','🧺','🍓','🌈','🎠','🐸','🦔'];
const FRONT=['🌿','🌱','🌾','🍀','🌸'];
function buildWm(level){ const n=Math.min(70,8+level*6), Wd=1400+level*90, Ht=Math.round(Wd*1.35); const rnd=Math.random; const items=[]; const size=120;
 const diff=Math.max(14,120-level*14); // Farbunterschied der Doppelgänger (Grad)
 const looks=[]; for(let i=0;i<6;i++){ const sgn=i%2?1:-1; const hue=sgn*(diff+rnd()*diff*0.6); const f={filter:'hue-rotate('+Math.round(hue)+'deg) saturate('+(0.9+rnd()*0.5).toFixed(2)+')'};
  if(level>=3&&i>=3){ f.filter='hue-rotate('+Math.round(sgn*Math.max(8,diff*0.4))+'deg) brightness('+(0.92+rnd()*0.16).toFixed(2)+')'; f.acc=['🎀','🕶️','🎩','🌸','⭐','🧢'][i]; f.accPos=f.acc==='🕶️'?[0.5,0.42]:[0.5,0.1]; }
  looks.push(variant(moeSpr,f)); }
 const place=(w,h)=>{ for(let tries=0;tries<60;tries++){ const x=80+rnd()*(Wd-160), y=Ht*0.24+rnd()*(Ht*0.72); if(!items.some(o=>o.moe!=null&&Math.hypot(o.x-x,o.y-y)<size*0.8)) return [x,y]; } return [80+rnd()*(Wd-160),Ht*0.24+rnd()*Ht*0.72]; };
 const [mx,my]=place(); items.push({img:moeSpr,x:mx,y:my,s:size*(0.85+rnd()*0.3),moe:true});
 for(let i=0;i<n;i++){ const [x,y]=place(); items.push({img:looks[i%looks.length],x,y,s:size*(0.75+rnd()*0.4)*(0.75+0.35*y/Ht),moe:false,flip:rnd()<.5}); }
 const deco=[]; for(let i=0;i<Math.round(n*1.6);i++){ const ch=DECO[(rnd()*DECO.length)|0]; const x=rnd()*Wd, y=Ht*0.2+rnd()*Ht*0.8; deco.push({img:emoji(ch,96),x,y,s:60+rnd()*70}); }
 const front=[]; for(let i=0;i<Math.round(n*0.8);i++){ const x=rnd()*Wd, y=Ht*0.25+rnd()*Ht*0.75; if(Math.hypot(x-mx,y-my)<size*0.7) continue; front.push({img:emoji(FRONT[(rnd()*FRONT.length)|0],96),x,y,s:70+rnd()*60}); }
 const all=deco.concat(items).sort((a,b)=>a.y-b.y);
 // Hintergrund einmal vorzeichnen (in halber Auflösung genügt – weich)
 const bg=document.createElement('canvas'); bg.width=Math.round(Wd/2); bg.height=Math.round(Ht/2); const x=bg.getContext('2d'); x.scale(0.5,0.5);
 let g=x.createLinearGradient(0,0,0,Ht*0.25); g.addColorStop(0,'#8fd3ff'); g.addColorStop(1,'#d9f3ff'); x.fillStyle=g; x.fillRect(0,0,Wd,Ht*0.25);
 x.fillStyle='rgba(255,255,255,.9)'; for(let i=0;i<6;i++){ const cx=rnd()*Wd, cy=40+rnd()*Ht*0.12; for(let j=0;j<5;j++){ x.beginPath(); x.arc(cx+j*38-76,cy+Math.sin(j)*12,40+rnd()*18,0,7); x.fill(); } }
 x.fillStyle='#8cc96b'; x.beginPath(); x.moveTo(0,Ht*0.25); for(let i=0;i<=20;i++) x.lineTo(i*Wd/20,Ht*0.22+Math.sin(i*1.3)*30); x.lineTo(Wd,Ht); x.lineTo(0,Ht); x.fill();
 g=x.createLinearGradient(0,Ht*0.22,0,Ht); g.addColorStop(0,'#9fd77a'); g.addColorStop(1,'#5aa548'); x.fillStyle=g; x.fillRect(0,Ht*0.26,Wd,Ht);
 for(let i=0;i<900;i++){ x.fillStyle=rnd()<.5?'rgba(40,110,40,.22)':'rgba(220,255,180,.25)'; const yy=Ht*0.26+rnd()*Ht*0.74, xx=rnd()*Wd; x.fillRect(xx,yy,3,8+rnd()*10); }
 x.strokeStyle='#e8d3a2'; x.lineWidth=90; x.lineCap='round'; x.beginPath(); x.moveTo(Wd*0.5,Ht*0.27); x.bezierCurveTo(Wd*0.1,Ht*0.45,Wd*0.9,Ht*0.7,Wd*0.4,Ht); x.stroke();
 x.strokeStyle='rgba(180,150,100,.35)'; x.lineWidth=6; x.setLineDash([2,26]); x.stroke(); x.setLineDash([]);
 return {Wd,Ht,all,front,items,moe:items[0],bg,level,found:false,t0:performance.now()};
}
function draw(){ if(!wm) return; wm.dirty=false; const c=wm.cv, x=c.getContext('2d'), d=wm.dpr; x.setTransform(1,0,0,1,0,0); x.fillStyle='#5aa548'; x.fillRect(0,0,c.width,c.height);
 x.setTransform(wm.s*d,0,0,wm.s*d,wm.ox*d,wm.oy*d); x.imageSmoothingQuality='high'; x.drawImage(wm.sc.bg,0,0,wm.sc.Wd,wm.sc.Ht);
 const dr=o=>{ const w=o.s, h=o.s*o.img.height/o.img.width; if(o.flip){ x.save(); x.translate(o.x,0); x.scale(-1,1); x.drawImage(o.img,-w/2,o.y-h,w,h); x.restore(); } else x.drawImage(o.img,o.x-w/2,o.y-h,w,h); };
 x.fillStyle='rgba(30,60,20,.18)'; wm.sc.items.forEach(o=>{ x.beginPath(); x.ellipse(o.x,o.y-4,o.s*0.32,o.s*0.07,0,0,7); x.fill(); });
 wm.sc.all.forEach(dr); wm.sc.front.forEach(dr);
 if(wm.ring){ const m=wm.sc.moe, r=wm.ring; x.lineWidth=8/wm.s; x.strokeStyle=r.c; x.beginPath(); x.arc(r.x,r.y,r.r,0,7); x.stroke(); } }
function req(){ if(wm&&!wm.dirty){ wm.dirty=true; requestAnimationFrame(draw); } }
function clamp(){ const vw=innerWidth, vh=innerHeight, s=wm.s, W_=wm.sc.Wd*s, H_=wm.sc.Ht*s; wm.ox=W_<vw?(vw-W_)/2:Math.min(0,Math.max(vw-W_,wm.ox)); wm.oy=H_<vh?(vh-H_)/2:Math.min(0,Math.max(vh-H_,wm.oy)); }
function zoomAt(f,cx,cy){ const s0=wm.s, s1=Math.max(wm.minS,Math.min(3.2,s0*f)); wm.ox=cx-(cx-wm.ox)*s1/s0; wm.oy=cy-(cy-wm.oy)*s1/s0; wm.s=s1; clamp(); req(); }
let wui;
function buildWui(){ wui=document.createElement('div'); wui.id='wimmel'; wui.innerHTML='<canvas id="wmC"></canvas><div class="wtop"><div class="wcard"><canvas id="wmT"></canvas><span>Finde<br>Giß-Moe!</span></div><div class="wst"><span id="wmL">Level 1</span><span id="wmB"></span></div></div>'+
 '<div class="wbtn"><button id="wmIn">＋</button><button id="wmOut">－</button><button id="wmHint">💡</button><button id="wmX">✕</button></div><div id="wmMsg"></div><div id="wmDone"><div><h2 id="wmDT">Gefunden! 🎉</h2><p id="wmDP"></p><button id="wmNext">Nächstes Level ▶</button><button id="wmEnd">Fertig</button></div></div>';
 document.body.appendChild(wui); wui.addEventListener('pointerdown',e=>e.stopPropagation());
 const $=id=>document.getElementById(id); const cv=$('wmC');
 const P=new Map(); let pinch=null, tap=null;
 cv.addEventListener('pointerdown',e=>{ e.preventDefault(); K.V.unlock(); cv.setPointerCapture(e.pointerId); P.set(e.pointerId,[e.clientX,e.clientY]); if(P.size===1) tap={x:e.clientX,y:e.clientY,t:performance.now(),m:0}; else { tap=null; const [a,b]=[...P.values()]; pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])}; } });
 cv.addEventListener('pointermove',e=>{ if(!P.has(e.pointerId)||!wm) return; const [px,py]=P.get(e.pointerId); P.set(e.pointerId,[e.clientX,e.clientY]);
  if(P.size>=2&&pinch){ const [a,b]=[...P.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]); zoomAt(d/pinch.d,(a[0]+b[0])/2,(a[1]+b[1])/2); pinch.d=d; return; }
  wm.ox+=e.clientX-px; wm.oy+=e.clientY-py; if(tap) tap.m+=Math.hypot(e.clientX-px,e.clientY-py); clamp(); req(); });
 const up=e=>{ P.delete(e.pointerId); if(P.size<2) pinch=null; if(tap&&e.type==='pointerup'&&tap.m<12&&performance.now()-tap.t<600){ const now=performance.now(); if(wm.lastTap&&now-wm.lastTap<300&&Math.hypot(e.clientX-wm.ltx,e.clientY-wm.lty)<30){ zoomAt(1.8,e.clientX,e.clientY); wm.lastTap=0; } else { wm.lastTap=now; wm.ltx=e.clientX; wm.lty=e.clientY; pick(e.clientX,e.clientY); } } tap=null; };
 cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
 cv.addEventListener('wheel',e=>{ e.preventDefault(); zoomAt(Math.exp(-e.deltaY*0.0015),e.clientX,e.clientY); },{passive:false});
 const B=(id,f)=>$(id).addEventListener('pointerup',e=>{ e.stopPropagation(); K.V.unlock(); f(); });
 B('wmIn',()=>zoomAt(1.5,innerWidth/2,innerHeight/2)); B('wmOut',()=>zoomAt(1/1.5,innerWidth/2,innerHeight/2)); B('wmHint',hint); B('wmX',W.closeWimmel); B('wmEnd',W.closeWimmel); B('wmNext',()=>startLevel(wm.sc.level+1)); }
function msg(t,ms){ const m=document.getElementById('wmMsg'); m.innerHTML=t; m.classList.add('show'); clearTimeout(msg.t); msg.t=setTimeout(()=>m.classList.remove('show'),ms||1600); }
function clip(t){ const r=window.GissFun&&GissFun.clip(t); if(!r&&window.speechSynthesis){ /* still ok – silent */ } }
function pick(cx,cy){ if(!wm||wm.sc.found) return; const wx=(cx-wm.ox)/wm.s, wy=(cy-wm.oy)/wm.s; const tol=Math.max(1,26/wm.s);
 let best=null; wm.sc.items.forEach(o=>{ const h=o.s*o.img.height/o.img.width; const dx=Math.abs(wx-o.x), dy=wy-(o.y-h/2); if(dx<o.s*0.42+tol&&Math.abs(dy)<h*0.5+tol){ if(!best||o.y>best.y) best=o; } });
 if(best&&best.moe) return found(); if(best){ K.V.pop(); msg(['Das bin ich nicht! 😄','Nö, das ist mein Cousin! 🙃','Fast! Schau genau hin 👀','Hihi, falscher Moe!'][(Math.random()*4)|0]); wm.miss++; best.wig=1; } else { wm.miss++; } }
function found(){ const sc=wm.sc, m=sc.moe; sc.found=true; const h=m.s*m.img.height/m.img.width; wm.ring={x:m.x,y:m.y-h/2,r:m.s*0.65,c:'#ffd84a'}; req();
 K.V.chime(); clip('Gefunden!'); const secs=Math.round((performance.now()-sc.t0)/1000); const stars=wm.miss===0&&!wm.hinted?3:wm.miss<3?2:1; K.M.wimmelLv=Math.max(K.M.wimmelLv||0,sc.level); K.save(); K.xp(2);
 for(let i=0;i<24;i++){ const e=document.createElement('div'); e.className='pf'; e.textContent=['🎉','⭐','✨','💛'][i%4]; e.style.left=innerWidth/2+'px'; e.style.top=innerHeight*0.45+'px'; e.style.setProperty('--dx',(Math.random()-.5)*innerWidth+'px'); e.style.setProperty('--dy',(Math.random()-.7)*innerHeight*0.7+'px'); e.style.setProperty('--s0',.5); e.style.setProperty('--s1',1.4); e.style.setProperty('--d','1.8s'); e.style.fontSize='34px'; e.style.zIndex=40; document.body.appendChild(e); setTimeout(()=>e.remove(),1900); }
 setTimeout(()=>{ document.getElementById('wmDT').textContent=['Gefunden! 🎉','Juhu, da bin ich! 🥳','Super Adlerauge! 🦅'][(Math.random()*3)|0]; document.getElementById('wmDP').innerHTML='⭐'.repeat(stars)+'<span style="opacity:.25">'+'⭐'.repeat(3-stars)+'</span><br>in '+secs+' Sekunden · Level '+sc.level; document.getElementById('wmDone').classList.add('show'); clip('Hier bin ich!'); },1100); }
function hint(){ if(!wm||wm.sc.found) return; wm.hinted=true; const m=wm.sc.moe; const h=m.s*m.img.height/m.img.width; const r=Math.max(260,wm.sc.Wd*0.22); const ox=(Math.random()-.5)*r*0.8, oy=(Math.random()-.5)*r*0.8; wm.ring={x:m.x+ox,y:m.y-h/2+oy,r:r,c:'rgba(255,230,90,.9)'};
 wm.s=Math.max(wm.minS,Math.min(3.2,innerWidth/(r*2.4))); wm.ox=innerWidth/2-(m.x+ox)*wm.s; wm.oy=innerHeight/2-(m.y-h/2+oy)*wm.s; clamp(); req(); msg('Irgendwo im gelben Kreis! 💡',2200); setTimeout(()=>{ if(wm&&!wm.sc.found){ wm.ring=null; req(); } },4000); }
function startLevel(lv){ document.getElementById('wmDone').classList.remove('show'); if(!moeSpr) moeSpr=snapMoe(); const sc=buildWm(lv); const cv=document.getElementById('wmC'); const dpr=Math.min(2,devicePixelRatio||1);
 cv.width=Math.round(innerWidth*dpr); cv.height=Math.round(innerHeight*dpr); wm={sc,cv,dpr,s:1,ox:0,oy:0,miss:0,hinted:false,ring:null,dirty:false}; wm.minS=Math.min(innerWidth/sc.Wd,innerHeight/sc.Ht); wm.s=Math.max(wm.minS,innerHeight/sc.Ht*1.1); wm.ox=(innerWidth-sc.Wd*wm.s)/2; wm.oy=(innerHeight-sc.Ht*wm.s)/2; clamp();
 const T=document.getElementById('wmT'); T.width=moeSpr.width; T.height=moeSpr.height; T.getContext('2d').drawImage(moeSpr,0,0); document.getElementById('wmL').textContent='Level '+lv; document.getElementById('wmB').textContent=K.M.wimmelLv?'🏆 '+K.M.wimmelLv:'';
 req(); msg(lv===1?'Wisch zum Schauen, zieh mit zwei Fingern zum Zoomen! 🔍':'Level '+lv+' – noch mehr Doppelgänger! 👀',2600); }
W.openWimmel=async()=>{ const k=K; document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show')); if(k.st.mode==='sleep') await k.wake(); k.begin(); k.rest(); k.A.lid=0.05; k.A.low=0.3; await wait(300);
 moeSpr=snapMoe(); k.st.wimmel=true; wui.classList.add('show'); startLevel(Math.max(1,K.M.wimmelLv?Math.min(K.M.wimmelLv,9):1)); clip('Such mich!'); };
W.closeWimmel=()=>{ K.st.wimmel=false; wui.classList.remove('show'); wm=null; K.interact(); K.rest(); };
addEventListener('resize',()=>{ if(!wm) return; const dpr=wm.dpr; wm.cv.width=Math.round(innerWidth*dpr); wm.cv.height=Math.round(innerHeight*dpr); wm.minS=Math.min(innerWidth/wm.sc.Wd,innerHeight/wm.sc.Ht); clamp(); req(); });
W.init=function(k){ K=k; THREE=k.THREE; buildPanel(); buildWui(); const w=K.M.wear||{}; for(const s in w) if(w[s]) wear(s,w[s],true); };
W._={wear,get wm(){return wm;},found,pick};
window.GissWear=W;
})();
