/* ZEIT-FRESSER – spielbarer Automat in der Spielhalle 1984 (Rewind V3). Komplett eigener Code + eigene Grafik (nur die
   Labyrinth-Fress-Mechanik als Genre; kein fremdes Layout, keine fremden Figuren/Namen/Töne).
   Man ist eine fressende Taschenuhr, frisst Sekunden, weicht Glitch-Geistern aus; Rückspul-Kassette = Geister fliehen.
   window.ZeitFresser(canvas) -> {update(dt), setDir(d), coin(), state(), draw()}  ·  window.mountZeitFresser(sceneEl, cab) baut den Automaten ein */
(function(){
const MAZE=[
"#####################",
"#.........#.........#",
"#o##.###..#..###.##o#",
"#...................#",
"#.##.#.#######.#.##.#",
"#....#....#....#....#",
"####.#.#.....#.#.####",
"####.#.###-###.#.####",
"T....#.#GGGGG#.#....T",
"####.#.#######.#.####",
"#.........#.........#",
"#.##.###..#..###.##.#",
"#o.#.............#.o#",
"##.#.#....#....#.#.##",
"#....#....#....#....#",
"#.######.....######.#",
"#...................#",
"#####################"];
const W=21,H=18,TS=13,OX=Math.floor((320-W*TS)/2),OY=20;
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]]; // hoch rechts runter links
const wall=(x,y)=>{ if(y===8&&(x<0||x>=W)) return false; if(x<0||x>=W||y<0||y>=H) return true; const c=MAZE[y][x]; return c==='#'||c==='-'||c==='G'; };
const wrap=x=>(x+W)%W;
const HS_KEY='rewind_zf_hs_v1';
function loadHS(){ try{ const h=JSON.parse(localStorage.getItem(HS_KEY)); if(Array.isArray(h)&&h.length) return h; }catch(e){} return [['ZSL',720],['MKR',599],['PET',260],['ROY',55]]; }
const fmt=s=>{ s=Math.max(0,Math.floor(s)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };

window.ZeitFresser=function(cv){
 const x=cv.getContext('2d'); let AC=null, master=null;
 const beep=(f,d,type,vol,slide)=>{ if(!AC) return; const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(); o.type=type||'square'; o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(slide,t+d); g.gain.setValueAtTime(vol||0.05,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(g); g.connect(master); o.start(t); o.stop(t+d+0.02); };
 let mode='attract', dots, nDots, score=0, lives=3, level=1, fright=0, chain=0, tAll=0, msgT=0, msg='', hs=loadHS(), deathT=0, chompA=0, wantDir=-1, newHS=false;
 const P={x:10,y:16,dir:3,prog:0,stop:true};
 const GH=[{c:'#ff3a6a'},{c:'#40e0ff'},{c:'#c070ff'}];
 function resetDots(){ dots=MAZE.map(r=>r.split('').map(c=>c==='.'?1:c==='o'?2:0)); nDots=0; dots.forEach(r=>r.forEach(v=>{ if(v) nDots++; })); }
 function placeActors(){ Object.assign(P,{x:10,y:16,dir:3,prog:0,stop:true}); wantDir=-1; GH.forEach((g,i)=>Object.assign(g,{x:9+i,y:8,dir:0,prog:0,inHouse:true,rel:1.2+i*3.2,dead:0})); fright=0; }
 function startGame(){ score=0; lives=3; level=1; newHS=false; resetDots(); placeActors(); mode='ready'; msgT=2.2; msg='BEREIT?'; beep(523,0.12); setTimeout(()=>beep(659,0.12),140); setTimeout(()=>beep(784,0.2),280); }
 const spd=()=>4.6+level*0.35;
 function stepActor(a,speed,dt,choose){
  if(a.stop){ choose(a); if(a.stop) return; }
  a.prog+=speed*dt;
  while(a.prog>=1){ a.prog-=1; a.x=wrap(a.x+DIRS[a.dir][0]); a.y+=DIRS[a.dir][1]; choose(a); if(a.stop){ a.prog=0; break; } }
 }
 const open=(a,d)=>!wall(wrap(a.x+DIRS[d][0]),a.y+DIRS[d][1]);
 function choosePlayer(a){ if(wantDir>=0&&open(a,wantDir)){ a.dir=wantDir; a.stop=false; } else if(open(a,a.dir)) a.stop=false; else a.stop=true; }
 function chooseGhost(g,i){ const back=(g.dir+2)%4; let opts=[0,1,2,3].filter(d=>d!==back&&open(g,d)); if(!opts.length) opts=[back];
  if(fright>0&&!g.dead){ g.dir=opts[Math.floor(Math.random()*opts.length)]; g.stop=false; return; }
  let tx=P.x,ty=P.y; if(i===1){ tx=P.x+DIRS[P.dir][0]*4; ty=P.y+DIRS[P.dir][1]*4; } if(i===2&&Math.random()<0.45){ g.dir=opts[Math.floor(Math.random()*opts.length)]; g.stop=false; return; }
  let best=opts[0],bd=1e9; opts.forEach(d=>{ const nx=g.x+DIRS[d][0],ny=g.y+DIRS[d][1],dd=(nx-tx)**2+(ny-ty)**2; if(dd<bd){ bd=dd; best=d; } }); g.dir=best; g.stop=false; }
 function die(){ mode='dying'; deathT=1.6; beep(700,1.1,'sawtooth',0.05,90); }
 function update(dt){ dt=Math.min(dt,0.05); tAll+=dt; if(msgT>0) msgT-=dt;
  if(mode==='ready'){ if(msgT<=0) mode='play'; return; }
  if(mode==='dying'){ deathT-=dt; if(deathT<=0){ lives--; if(lives<=0){ mode='over'; msgT=4; msg='ZEIT ABGELAUFEN'; checkHS(); } else { placeActors(); mode='ready'; msgT=1.4; msg='NOCHMAL'; } } return; }
  if(mode==='over'){ if(msgT<=0) mode='attract'; return; }
  if(mode==='clear'){ if(msgT<=0){ level++; resetDots(); placeActors(); mode='ready'; msgT=1.6; msg='RUNDE '+level; } return; }
  if(mode!=='play') return;
  if(fright>0){ fright-=dt; if(fright<=0) chain=0; }
  stepActor(P,spd(),dt,choosePlayer); if(!P.stop) chompA+=dt*14;
  const d=dots[P.y]&&dots[P.y][P.x]; if(d){ dots[P.y][P.x]=0; nDots--; if(d===1){ score+=1; beep((nDots%2)?440:330,0.035,'square',0.025); } else { score+=10; fright=Math.max(2.5,7-level*0.6); chain=0; GH.forEach(g=>{ if(!g.inHouse&&!g.dead){ g.dir=(g.dir+2)%4; } }); beep(180,0.5,'triangle',0.06,90); } if(nDots<=0){ mode='clear'; msgT=2; msg='ALLE SEKUNDEN!'; beep(880,0.3,'square',0.05,1320); } }
  GH.forEach((g,i)=>{ if(g.dead){ g.dead-=dt; if(g.dead<=0){ g.dead=0; g.inHouse=true; g.rel=1; g.x=9+i; g.y=8; } return; }
   if(g.inHouse){ g.rel-=dt; if(g.rel<=0){ g.inHouse=false; g.x=10; g.y=6; g.dir=Math.random()<0.5?1:3; g.prog=0; g.stop=false; } return; }
   stepActor(g,(fright>0?0.55:0.88)*spd()*(1+i*0.03),dt,a=>chooseGhost(a,i));
   const px=P.x+DIRS[P.dir][0]*(P.stop?0:P.prog), py=P.y+DIRS[P.dir][1]*(P.stop?0:P.prog), gx=g.x+DIRS[g.dir][0]*g.prog, gy=g.y+DIRS[g.dir][1]*g.prog;
   if(Math.abs(px-gx)+Math.abs(py-gy)<0.7){ if(fright>0){ chain++; score+=15*chain; g.dead=3; msg='+'+fmt(15*chain); msgT=0.8; beep(1200,0.25,'square',0.05,300); } else die(); } });
 }
 function checkHS(){ hs.push(['DU',score]); hs.sort((a,b)=>b[1]-a[1]); hs=hs.slice(0,5); newHS=hs.some(h=>h[0]==='DU'&&h[1]===score); try{ localStorage.setItem(HS_KEY,JSON.stringify(hs)); }catch(e){} }
 // ---------- Zeichnen ----------
 function txt(s,cx,y,col,size,al){ x.font='bold '+(size||12)+'px monospace'; x.textAlign=al||'center'; x.fillStyle=col; x.fillText(s,cx,y); }
 function drawMaze(){ x.strokeStyle='#1f8f86'; x.lineWidth=2; x.shadowColor='#40ffd0'; x.shadowBlur=4;
  for(let y=0;y<H;y++) for(let i=0;i<W;i++){ const c=MAZE[y][i]; if(c!=='#') continue; const px=OX+i*TS,py=OY+y*TS;
   [[0,-1,px,py,px+TS,py],[1,0,px+TS,py,px+TS,py+TS],[0,1,px,py+TS,px+TS,py+TS],[-1,0,px,py,px,py+TS]].forEach(([dx,dy,a,b,c2,d2])=>{ const nx=i+dx,ny=y+dy; const nb=(nx<0||nx>=W||ny<0||ny>=H)?'#':MAZE[ny][nx]; if(nb!=='#'){ x.beginPath(); x.moveTo(a,b); x.lineTo(c2,d2); x.stroke(); } }); }
  x.shadowBlur=0; x.fillStyle='#b05a8a'; x.fillRect(OX+10*TS+1,OY+7*TS+5,TS-2,3); }
 function drawDots(){ for(let y=0;y<H;y++) for(let i=0;i<W;i++){ const v=dots[y][i]; if(!v) continue; const cx=OX+i*TS+TS/2, cy=OY+y*TS+TS/2;
  if(v===1){ x.fillStyle='#ffe2b0'; x.fillRect(cx-1,cy-1,2,2); }
  else if((tAll*3|0)%2){ x.fillStyle='#202020'; x.fillRect(cx-5,cy-3.5,10,7); x.strokeStyle='#ffd040'; x.lineWidth=1; x.strokeRect(cx-5,cy-3.5,10,7); x.fillStyle='#ffd040'; x.fillRect(cx-3,cy-1,2,2); x.fillRect(cx+1,cy-1,2,2); } } }
 function drawClock(px,py,dir,mouth,dyingK){ const r=TS*0.55; const a0=[ -Math.PI/2,0,Math.PI/2,Math.PI][dir]; const m=dyingK!=null?Math.PI*dyingK:Math.abs(Math.sin(chompA))*0.8;
  x.fillStyle='#e8c060'; x.beginPath(); x.moveTo(px,py); x.arc(px,py,r,a0+m*0.5,a0+Math.PI*2-m*0.5); x.closePath(); x.fill();
  x.strokeStyle='#7a5a20'; x.lineWidth=1; x.stroke(); x.fillStyle='#fff6dc'; x.beginPath(); x.arc(px,py,r*0.62,a0+m*0.5+0.3,a0+Math.PI*2-m*0.5-0.3); x.lineTo(px,py); x.fill();
  if(dyingK==null){ x.strokeStyle='#2a1a08'; x.beginPath(); x.moveTo(px,py); const h=tAll*2; x.lineTo(px+Math.cos(h)*r*0.5,py+Math.sin(h)*r*0.5); x.stroke(); x.fillStyle='#e8c060'; x.fillRect(px-1.5,py-r-3,3,3); } }
 function drawGhost(g,i){ const gx=OX+(g.x+DIRS[g.dir][0]*g.prog)*TS+TS/2, gy=OY+(g.y+DIRS[g.dir][1]*g.prog)*TS+TS/2, r=TS*0.55;
  if(g.dead){ if((tAll*12|0)%2){ x.fillStyle='rgba(200,220,255,0.25)'; for(let k=0;k<8;k++) x.fillRect(OX+(9+i)*TS+Math.random()*TS,OY+8*TS+Math.random()*TS,2,1); } return; }
  const fr=fright>0, blink=fr&&fright<1.6&&(tAll*8|0)%2; const shift=Math.random()<0.08?(Math.random()-0.5)*4:0;
  const body=(col,dx)=>{ x.fillStyle=col; x.beginPath(); x.arc(gx+dx,gy-1,r,Math.PI,0); for(let k=0;k<=4;k++){ x.lineTo(gx+dx+r-k*r/2,gy+r-((k+(tAll*10|0))%2?3:0)); } x.closePath(); x.fill(); };
  if(fr){ body(blink?'#d8d8e8':'#1a2a8a',0); x.fillStyle='rgba(255,255,255,0.15)'; for(let s=-r;s<r;s+=3) x.fillRect(gx-r,gy+s,2*r,1); x.fillStyle=blink?'#a02020':'#ffd0a0'; x.fillRect(gx-4,gy-3,2,2); x.fillRect(gx+2,gy-3,2,2); return; }
  x.globalCompositeOperation='lighter'; body('rgba(255,0,0,0.55)',-1.2+shift); body('rgba(0,255,255,0.45)',1.2-shift); x.globalCompositeOperation='source-over'; body(GH[i].c+'cc',0);
  for(let k=0;k<6;k++){ x.fillStyle=Math.random()<0.5?'#ffffff40':'#00000060'; x.fillRect(gx-r+Math.random()*2*r,gy-r+Math.random()*2*r,3,1); }
  const ex=DIRS[g.dir][0]*1.5, ey=DIRS[g.dir][1]*1.5; x.fillStyle='#fff'; x.fillRect(gx-5,gy-4,4,4); x.fillRect(gx+1,gy-4,4,4); x.fillStyle='#101030'; x.fillRect(gx-4+ex,gy-3+ey,2,2); x.fillRect(gx+2+ex,gy-3+ey,2,2); }
 function drawHUD(){ txt('ZEIT '+fmt(score),OX,14,'#ffd040',12,'left'); txt('BESTE '+fmt(hs[0][1]),OX+W*TS,14,'#40ffd0',12,'right'); for(let i=0;i<lives-1;i++){ const px=OX+6+i*14, py=OY+H*TS+10; x.fillStyle='#e8c060'; x.beginPath(); x.arc(px,py,5,0.4,Math.PI*2-0.4); x.lineTo(px,py); x.fill(); } txt('R'+level,OX+W*TS,OY+H*TS+14,'#806080',10,'right'); }
 function drawAttract(){ x.fillStyle='#04060a'; x.fillRect(0,0,320,256);
  const t=tAll; x.save(); x.translate(160,56); x.shadowColor='#ffb040'; x.shadowBlur=14; txt('ZEIT-FRESSER',0,0,'#ffc050',30); x.shadowBlur=0; x.restore();
  txt('FRISS DIE SEKUNDEN. MEIDE DEN GLITCH.',160,80,'#c8b8e0',10);
  const px=40+((t*60)%260); for(let i=0;i<14;i++){ const dx=40+i*18; if(dx>px+6){ x.fillStyle='#ffe2b0'; x.fillRect(dx,104,2,2); } } chompA=t*12; drawClock(px,105,1);
  GH.forEach((g,i)=>{ const gg={x:0,y:0,dir:1,prog:0}; const sx=px-40-i*22; if(sx>10){ x.save(); x.translate(sx-OX-TS/2,105-OY-TS/2); drawGhost(Object.assign(gg,{dead:0}),i); x.restore(); } });
  txt('HIGHSCORES',160,138,'#ff40a0',12); hs.slice(0,5).forEach((h,i)=>{ txt((i+1)+'. '+h[0].padEnd(3,' ')+'  '+fmt(h[1]),160,156+i*15,['#ffd040','#60ff80','#40c0ff','#c0d0ff','#ff6030'][i],12); });
  if((t*2|0)%2) txt('MÜNZE EINWERFEN',160,242,'#ffffff',13); txt('© 1984 SCHLEIFE ELECTRONICS',160,254,'#504060',8); }
 function draw(){ if(mode==='attract'){ drawAttract(); post(); return; }
  x.fillStyle='#04060a'; x.fillRect(0,0,320,256); drawMaze(); drawDots();
  const px=OX+(P.x+DIRS[P.dir][0]*(P.stop?0:P.prog))*TS+TS/2, py=OY+(P.y+DIRS[P.dir][1]*(P.stop?0:P.prog))*TS+TS/2;
  if(mode==='dying') drawClock(px,py,P.dir,0,1-deathT/1.6); else { GH.forEach(drawGhost); drawClock(px,py,P.dir,0); }
  drawHUD(); if(msgT>0||mode==='over'){ x.fillStyle='rgba(0,0,0,0.55)'; x.fillRect(60,OY+9*TS-12,200,22); txt(msg,160,OY+9*TS+4,mode==='over'?'#ff4060':'#ffd040',14); if(mode==='over'&&newHS) txt('NEUER REKORD!',160,OY+9*TS+22,'#60ff80',11); }
  post(); }
 function post(){ x.globalAlpha=0.28; x.fillStyle='#000'; for(let y=0;y<256;y+=3) x.fillRect(0,y,320,1); x.globalAlpha=1;
  if(Math.random()<0.015){ const y=Math.random()*256; x.drawImage(cv,0,y,320,6,(Math.random()-0.5)*6,y,320,6); }
  const v=x.createRadialGradient(160,128,90,160,128,210); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.75)'); x.fillStyle=v; x.fillRect(0,0,320,256); }
 resetDots(); placeActors();
 return { update, draw, state:()=>mode, score:()=>score,
  setDir(d){ if(d<0||d>3) return; if(mode==='play'||mode==='ready'){ if(P.stop===false&&d===(P.dir+2)%4&&P.prog>0){ P.x=wrap(P.x+DIRS[P.dir][0]); P.y+=DIRS[P.dir][1]; P.dir=d; P.prog=1-P.prog; } wantDir=d; } },
  coin(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); master=AC.createGain(); master.gain.value=0.7; master.connect(AC.destination); }catch(e){} } if(AC&&AC.state==='suspended') AC.resume();
   if(mode==='attract'||mode==='over'){ beep(1400,0.05); setTimeout(()=>beep(1800,0.08),70); startGame(); return true; } return false; },
  audio:()=>AC };
};

// ---------- Einbau in die Spielhalle ----------
window.mountZeitFresser=function(sc,cab){ const T=THREE, S=sc.object3D;
 const cv=document.createElement('canvas'); cv.width=320; cv.height=256; const game=ZeitFresser(cv); game.draw();
 const tex=new T.CanvasTexture(cv); tex.colorSpace=T.SRGBColorSpace; tex.minFilter=T.LinearFilter; tex.generateMipmaps=false;
 const Mc=new T.Matrix4().compose(new T.Vector3(cab.x,0,cab.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),cab.ry),new T.Vector3(1,1,1));
 const place=(o,lp,rx,off)=>{ const m=new T.Matrix4().makeRotationX(rx); m.setPosition(lp[0],lp[1],lp[2]); const n=new T.Vector3(0,0,1).applyAxisAngle(new T.Vector3(1,0,0),rx).multiplyScalar(off); m.premultiply(new T.Matrix4().makeTranslation(n.x,n.y,n.z)); m.premultiply(Mc); m.decompose(o.position,o.quaternion,o.scale); };
 // Bildschirm = klickbare A-Frame-Fläche (Laser/Maus), leicht gewölbt wirkt durch Vignette
 const el=document.createElement('a-entity'); el.classList.add('clickable'); el.setAttribute('geometry','primitive:plane;width:0.5;height:0.4'); el.setAttribute('material','shader:flat;side:front;fog:false'); sc.appendChild(el);
 el.addEventListener('loaded',()=>{ const m=el.getObject3D('mesh'); m.material=new T.MeshBasicMaterial({map:tex,toneMapped:false,fog:false}); place(el.object3D,[0,1.323,0.19],-0.27,0.004); });
 // eigenes Marquee
 const mc=document.createElement('canvas'); mc.width=512; mc.height=204; { const g=mc.getContext('2d'); const gr=g.createLinearGradient(0,0,0,204); gr.addColorStop(0,'#301804'); gr.addColorStop(0.5,'#000'); gr.addColorStop(1,'#301804'); g.fillStyle=gr; g.fillRect(0,0,512,204); g.strokeStyle='#ffb040'; g.lineWidth=5; g.strokeRect(10,10,492,184);
  g.font='bold 62px Arial Black, Arial'; g.textAlign='center'; g.textBaseline='middle'; g.shadowColor='#ffa030'; g.shadowBlur=22; g.fillStyle='#ffc050'; g.fillText('ZEIT-FRESSER',256,96); g.shadowBlur=0; g.lineWidth=2.5; g.strokeStyle='#fff'; g.strokeText('ZEIT-FRESSER',256,96);
  g.font='bold 20px Arial'; g.fillStyle='#e0a050'; g.fillText('SCHLEIFE ELECTRONICS 1984',256,160); }
 const mt=new T.CanvasTexture(mc); mt.colorSpace=T.SRGBColorSpace; const mar=new T.Mesh(new T.PlaneGeometry(0.6,0.24),new T.MeshBasicMaterial({map:mt,toneMapped:false,color:0xd8d8d8})); place(mar,[0,1.71,0.226],0.15,0.004); S.add(mar);
 // ---------- Steuerung ----------
 let playing=false; const rig=document.getElementById('rig'), cam=document.getElementById('cam'); let rot0=0, idle=0;
 const sub=document.getElementById('sub'); const hint=s=>{ if(!sub) return; sub.textContent=s; sub.style.display='block'; clearTimeout(hint.t); hint.t=setTimeout(()=>sub.style.display='none',3200); };
 const screenPos=new T.Vector3();
 function onScreen(){ if(!playing){ game.coin(); enter(); } else if(game.state()==='attract'||game.state()==='over'){ game.coin(); } else leave(); }
 function enter(){ playing=true; idle=0; const rm=rig.components['room-move']; if(rm){ rm.ax=[0,0]; rm.pause(); } if(cam.components['wasd-controls']) cam.setAttribute('wasd-controls','enabled',false); rot0=rig.object3D.rotation.y;
  el.object3D.getWorldPosition(screenPos); const cw=new T.Vector3(); cam.object3D.getWorldPosition(cw); const front=new T.Vector3(Math.sin(cab.ry),0,Math.cos(cab.ry)); const want=new T.Vector3(cab.x,0,cab.z).addScaledVector(front,0.85);
  if(Math.hypot(cw.x-want.x,cw.z-want.z)>1.1){ rig.object3D.position.x+=want.x-cw.x; rig.object3D.position.z+=want.z-cw.z; }
  if(window.ArcadeBigScreen){ const h=ArcadeBigScreen.show(sc,tex,'zf'); if(h&&!h.__zfBound){ h.__zfBound=1; h.addEventListener('click',onScreen); } }
  hint(sc.is('vr-mode')?'ZEIT-FRESSER · linker Stick · großer Schirm · Trigger auf Schirm = aufhören':'ZEIT-FRESSER · Pfeiltasten/WASD · Klick/Esc = aufhören'); }
 function leave(){ playing=false; if(window.ArcadeBigScreen) ArcadeBigScreen.hide('zf'); const rm=rig.components['room-move']; if(rm){ rm.ax=[0,0]; rm.play(); } if(cam.components['wasd-controls']) cam.setAttribute('wasd-controls','enabled',true); }
 el.addEventListener('click',onScreen);
 const KEY={ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3};
 window.addEventListener('keydown',e=>{ if(!playing) return; if(e.code==='Escape'){ leave(); return; } if(e.code in KEY){ game.setDir(KEY[e.code]); idle=0; e.preventDefault(); } },true);
 setTimeout(()=>{ ['hl','hr'].forEach(id=>{ const h=document.getElementById(id); if(!h) return;
  h.addEventListener('thumbstickmoved',e=>{ if(!playing||id!=='hl') return; const {x:ax,y:ay}=e.detail; if(Math.max(Math.abs(ax),Math.abs(ay))<0.55) return; idle=0; game.setDir(Math.abs(ax)>Math.abs(ay)?(ax>0?1:3):(ay>0?2:0)); });
  ['bbuttondown','ybuttondown'].forEach(ev=>h.addEventListener(ev,()=>{ if(playing) leave(); })); }); },0);
 let last=0, acc=0;
 AFRAME.registerComponent('zf-tick',{tick(t,dt){ const d=Math.min(dt||16,50)/1000; game.update(d); if(playing){ rig.object3D.rotation.y=rot0; idle+=d; if(idle>45&&game.state()==='attract') leave(); }
  acc+=d; if(acc>=1/30){ acc=0; game.draw(); tex.needsUpdate=true; } }}); sc.setAttribute('zf-tick','');
 window.__ZF=game; return game;
};
})();
