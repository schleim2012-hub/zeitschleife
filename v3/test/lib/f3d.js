/* FORUM 3D – spielbarer Automat in der Spielhalle 1984 (Rewind V3). Komplett eigener Code + eigene Grafik
   (nur das Genre "Raycaster-Labyrinth-Shooter"; keine fremden Karten, Figuren, Namen, Grafiken oder Töne).
   Zentrale des "Weltwirtschaftsforums für Glück und Verzicht": Anzugträger mit Datenbrille halten Vorträge (kosten GLÜCK),
   man wirft Bananen, sie rutschen aus. Pickups: Bananen, Soylent-Riegel, Perri-Air. Ziel: Aufzug "AUSGANG" je Etage.
   window.Forum3D(canvas) -> {update(dt), draw(), setAxes(fwd,turn,strafe), fire(), coin(), state()}
   window.mountForum3D(sceneEl, cab) baut den Automaten in die Spielhalle ein */
(function(){
const VW=160, VH=104;                       // interne Raycast-Auflösung (chunky 1984-Look), hochskaliert ×2
const MAP0=[
"1111111111111111",
"1P..2......3...1",
"1...2..E...3.B.1",
"1.S.2......3...1",
"12.222..E..333.1",
"1..............1",
"1.333.3333..p..1",
"1.3.......3..E.1",
"1.3..B..V.3....1",
"1.3...p...3..A.1",
"1.33333.333..2.1",
"1..E...........1",
"222.222222.22221",
"1B..2....E.....1",
"1.p.2...S...E..4",
"1111111111111111"];
const HS_KEY='rewind_f3d_hs_v1';
function loadHS(){ try{ const h=JSON.parse(localStorage.getItem(HS_KEY)); if(Array.isArray(h)&&h.length) return h; }catch(e){} return [['MKR',9870],['ZSL',6400],['PET',2600],['ROY',55]]; }
const QUOTES=['SIE WERDEN NICHTS BESITZEN.','UND SIE WERDEN GLÜCKLICH SEIN.','VERZICHT IST DAS NEUE HABEN.','IHR GLÜCKSKONTO IST ÜBERZOGEN.','HABEN SIE DAS FORMULAR 7B?','BITTE LÄCHELN. ES WIRD GEMESSEN.','EIGENTUM IST SO 1984.','WIR HABEN DAS FÜR SIE ENTSCHIEDEN.'];
// Karten-Varianten: Etage 2 = gespiegelt, Etage 3 = gedreht (Rand bleibt dicht, Ausgang wandert mit)
function variant(n){ let m=MAP0.map(r=>r.split(''));
 if(n%3===1) m=m.map(r=>r.slice().reverse());
 if(n%3===2) m=m[0].map((_,x)=>m.map(r=>r[x]));
 return m; }
const RGBA=(r,g,b,a)=>((a==null?255:a)<<24|b<<16|g<<8|r)>>>0;

// ---------- prozedurale Texturen (64×64 Wände, 64×64 Sprites) ----------
function mk(w,h,fn){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); fn(g,w,h); const d=g.getImageData(0,0,w,h).data; const u=new Uint32Array(w*h); for(let i=0;i<w*h;i++) u[i]=RGBA(d[i*4],d[i*4+1],d[i*4+2],d[i*4+3]); return {w,h,u}; }
let seed=7; const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
function noise(g,w,h,a){ for(let i=0;i<w*h/3;i++){ g.fillStyle=rnd()<0.5?`rgba(0,0,0,${a})`:`rgba(255,255,255,${a*0.6})`; g.fillRect(rnd()*w|0,rnd()*h|0,1,1); } }
const TX={};
function buildTex(){
 TX[1]=mk(64,64,(g,w,h)=>{ g.fillStyle='#3a2414'; g.fillRect(0,0,w,h); for(let x=0;x<w;x+=16){ g.fillStyle='#4a2e18'; g.fillRect(x+1,0,14,h); g.fillStyle='#1e1208'; g.fillRect(x,0,1,h); } for(let y=0;y<h;y+=3){ g.fillStyle='rgba(0,0,0,0.12)'; g.fillRect(0,y,w,1); } g.fillStyle='#8a6a28'; g.fillRect(0,40,w,2); g.fillStyle='#120a04'; g.fillRect(0,58,w,6); noise(g,w,h,0.15); });
 TX[2]=mk(64,64,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,w,h); gr.addColorStop(0,'#1c2a34'); gr.addColorStop(1,'#0c141c'); g.fillStyle=gr; g.fillRect(0,0,w,h); g.strokeStyle='rgba(160,210,230,0.18)'; g.lineWidth=3; for(let i=-2;i<4;i++){ g.beginPath(); g.moveTo(i*22,64); g.lineTo(i*22+40,0); g.stroke(); } g.fillStyle='#5a646c'; g.fillRect(0,0,w,3); g.fillRect(0,61,w,3); g.fillRect(0,0,3,h); g.fillRect(31,0,2,h); g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(4,30,24,2); g.font='bold 7px monospace'; g.fillStyle='rgba(120,220,200,0.5)'; g.fillText('WFGV',38,34); });
 const poster=(t1,t2,bg,fg)=>mk(64,64,(g,w,h)=>{ g.fillStyle='#4a4a46'; g.fillRect(0,0,w,h); noise(g,w,h,0.25); for(let y=0;y<h;y+=16){ g.fillStyle='rgba(0,0,0,0.25)'; g.fillRect(0,y,w,1); } g.fillStyle='#1a1a18'; g.fillRect(10,8,44,40); g.fillStyle=bg; g.fillRect(12,10,40,36); g.fillStyle=fg; g.font='bold 9px monospace'; g.textAlign='center'; g.fillText(t1,32,24); g.font='bold 6px monospace'; g.fillText(t2,32,36); g.fillStyle='#202020'; g.fillRect(0,56,w,8); });
 TX[3]=poster('GLÜCK','IST PFLICHT','#d8c890','#802018');
 TX[5]=poster('VERZICHT','= FREIHEIT','#9ab8c0','#102838');
 TX[6]=poster('BESITZ?','SO 1984','#c07a8a','#201018');
 TX[7]=poster(':-)','LÄCHELPFLICHT','#e0d050','#202020');
 TX[4]=mk(64,64,(g,w,h)=>{ g.fillStyle='#2a2c30'; g.fillRect(0,0,w,h); const gr=g.createLinearGradient(8,0,56,0); gr.addColorStop(0,'#6a7078'); gr.addColorStop(0.5,'#b8c0c8'); gr.addColorStop(1,'#5a6068'); g.fillStyle=gr; g.fillRect(8,14,48,50); g.fillStyle='#1a1a1a'; g.fillRect(31,14,2,50); g.fillStyle='#062a10'; g.fillRect(12,2,40,10); g.fillStyle='#40ff70'; g.font='bold 8px monospace'; g.textAlign='center'; g.fillText('AUSGANG',32,10); g.fillStyle='#ffd040'; g.beginPath(); g.arc(58,38,2,0,7); g.fill(); });
 // Sprites
 const suit=(pose,gold)=>mk(64,64,(g)=>{ g.save();
  if(pose==='down'){ g.translate(32,58); g.rotate(-Math.PI/2); g.translate(-32,-40); }
  if(pose==='slip'){ g.translate(32,60); g.rotate(-0.6); g.translate(-32,-60); }
  const lg=pose==='w1'?3:pose==='w2'?-3:0;
  g.fillStyle='#16161c'; g.fillRect(24+lg,44,7,18); g.fillRect(33-lg,44,7,18); g.fillStyle='#050505'; g.fillRect(22+lg,60,10,4); g.fillRect(32-lg,60,10,4);
  g.fillStyle=gold?'#2a2a38':'#3a3e48'; g.fillRect(20,20,24,26); g.fillRect(16,22,6,20); g.fillRect(42,22,6,20);
  if(pose==='talk'){ g.fillRect(42,10,6,14); g.fillStyle='#e0b090'; g.fillRect(42,6,6,5); }
  g.fillStyle='#e8e8ec'; g.beginPath(); g.moveTo(28,20); g.lineTo(36,20); g.lineTo(32,30); g.fill(); g.fillStyle=gold?'#e0b020':'#a01820'; g.fillRect(31,22,2,16);
  g.fillStyle='#e0b090'; g.fillRect(25,6,14,14); g.fillStyle='#5a4030'; g.fillRect(25,4,14,4);
  g.fillStyle='#101418'; g.fillRect(23,10,18,5); g.fillStyle='#40fff0'; g.fillRect(25,11,6,3); g.fillRect(33,11,6,3);
  if(pose==='talk'){ g.fillStyle='#401010'; g.fillRect(30,17,4,2); }
  if(pose==='down'||pose==='slip'){ g.restore(); g.fillStyle='#f0d030'; g.beginPath(); g.ellipse(12,61,7,2,0.2,0,7); g.fill(); g.fillStyle='#806010'; g.fillRect(5,60,2,2); return; }
  g.restore(); });
 TX.s_w1=suit('w1'); TX.s_w2=suit('w2'); TX.s_talk=suit('talk'); TX.s_slip=suit('slip'); TX.s_down=suit('down');
 TX.v_w1=suit('w1',1); TX.v_w2=suit('w2',1); TX.v_talk=suit('talk',1); TX.v_slip=suit('slip',1); TX.v_down=suit('down',1);
 TX.ban=mk(64,64,g=>{ g.fillStyle='#f0d030'; g.beginPath(); g.arc(32,24,14,0.3,2.8); g.arc(32,18,12,2.6,0.5,true); g.fill(); g.fillStyle='#604010'; g.fillRect(44,26,3,3); });
 TX.bunch=mk(64,64,g=>{ for(let i=0;i<4;i++){ g.save(); g.translate(32,56); g.rotate(-0.5+i*0.33); g.fillStyle=i%2?'#e8c828':'#f8dc40'; g.beginPath(); g.ellipse(0,-12,3.5,11,0,0,7); g.fill(); g.restore(); } g.fillStyle='#5a4010'; g.fillRect(30,52,4,6); });
 TX.soy=mk(64,64,g=>{ g.fillStyle='#103a18'; g.fillRect(18,46,28,14); g.fillStyle='#40d060'; g.fillRect(19,47,26,12); g.fillStyle='#08200c'; g.font='bold 6px monospace'; g.textAlign='center'; g.fillText('SOYLENT',32,55); });
 TX.air=mk(64,64,g=>{ g.fillStyle='#1a4aa0'; g.fillRect(25,34,14,26); g.fillStyle='#c0d8ff'; g.fillRect(25,34,14,4); g.fillStyle='#fff'; g.font='bold 5px monospace'; g.textAlign='center'; g.fillText('PERRI',32,46); g.fillText('AIR',32,52); g.fillStyle='#808890'; g.fillRect(29,30,6,4); });
 TX.plant=mk(64,64,g=>{ g.fillStyle='#5a3a24'; g.fillRect(24,48,16,14); g.fillStyle='#1e5a2a'; for(let i=0;i<9;i++){ g.save(); g.translate(32,48); g.rotate(-1.2+i*0.3); g.beginPath(); g.ellipse(0,-14,3,12,0,0,7); g.fill(); g.restore(); } g.fillStyle='#d0d0c0'; g.fillRect(38,40,10,8); g.fillStyle='#202020'; g.font='4px monospace'; g.fillText('CO2',39,46); });
}

window.Forum3D=function(cv){
 if(!TX[1]) buildTex();
 const out=cv.getContext('2d'); const vc=document.createElement('canvas'); vc.width=VW; vc.height=VH; const vx=vc.getContext('2d'); const img=vx.createImageData(VW,VH); const buf=new Uint32Array(img.data.buffer); const zb=new Float32Array(VW);
 let AC=null, master=null;
 const beep=(f,d,type,vol,slide)=>{ if(!AC) return; const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(); o.type=type||'square'; o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(slide,t+d); g.gain.setValueAtTime(vol||0.05,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(g); g.connect(master); o.start(t); o.stop(t+d+0.02); };
 let M, W, H, mode='attract', score=0, gl=100, bans=8, level=0, msg='', msgT=0, quote='', quoteT=0, hurtT=0, throwT=0, bob=0, tAll=0, hs=loadHS(), newHS=false, demoA=0;
 const P={x:1.5,y:1.5,a:0}; const ax={f:0,t:0,s:0}; let ents=[], shots=[], exitPos=null;
 const solid=(x,y)=>{ const r=M[y|0]&&M[y|0][x|0]; return r==null||(r!=='.'&&!isNaN(+r)); };
 const tile=(x,y)=>{ const r=M[y]&&M[y][x]; return r==null?'1':r; };
 function load(n){ M=variant(n); H=M.length; W=M[0].length; ents=[]; shots=[];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const c=M[y][x];
   if(c==='P'){ P.x=x+0.5; P.y=y+0.5; M[y][x]='.'; }
   else if(c==='E'||c==='V'){ ents.push({k:'suit',v:c==='V',x:x+0.5,y:y+0.5,hp:c==='V'?2:1,st:'idle',t:0,cd:0,ph:Math.random()*6}); M[y][x]='.'; }
   else if('BSAp'.includes(c)){ ents.push({k:{B:'bunch',S:'soy',A:'air',p:'plant'}[c],x:x+0.5,y:y+0.5}); M[y][x]='.'; }
   else if(c==='4') exitPos=[x,y]; }
  // Blickrichtung: in den offensten Gang
  let best=0,bl=-1; for(let a=0;a<4;a++){ const dx=Math.cos(a*Math.PI/2),dy=Math.sin(a*Math.PI/2); let l=0; while(l<12&&!solid(P.x+dx*(l+0.5),P.y+dy*(l+0.5))) l++; if(l>bl){ bl=l; best=a; } } P.a=best*Math.PI/2;
  // Etage 2+: ein Bürokrat mehr pro Etage auf freiem Feld weit weg vom Start
  for(let k=0;k<Math.min(n,4);k++){ for(let tries=0;tries<200;tries++){ const x=1+Math.random()*(W-2)|0, y=1+Math.random()*(H-2)|0; if(M[y][x]==='.'&&Math.hypot(x-P.x,y-P.y)>6){ ents.push({k:'suit',v:k%2===1,x:x+0.5,y:y+0.5,hp:k%2?2:1,st:'idle',t:0,cd:0,ph:Math.random()*6}); break; } } } }
 function startGame(){ score=0; gl=100; bans=8; level=0; newHS=false; load(0); mode='ready'; msgT=2; msg='ETAGE 1'; beep(392,0.12); setTimeout(()=>beep(523,0.12),140); setTimeout(()=>beep(659,0.25),280); }
 const los=(x0,y0,x1,y1)=>{ const d=Math.hypot(x1-x0,y1-y0), n=Math.ceil(d/0.2); for(let i=1;i<n;i++){ const t=i/n; if(solid(x0+(x1-x0)*t,y0+(y1-y0)*t)) return false; } return true; };
 function move(o,dx,dy,r){ if(!solid(o.x+dx+Math.sign(dx)*r,o.y-r*0.7)&&!solid(o.x+dx+Math.sign(dx)*r,o.y+r*0.7)) o.x+=dx; if(!solid(o.x-r*0.7,o.y+dy+Math.sign(dy)*r)&&!solid(o.x+r*0.7,o.y+dy+Math.sign(dy)*r)) o.y+=dy; }
 function fire(){ if(mode!=='play'||throwT>0) return; if(bans<=0){ msg='KEINE BANANEN!'; msgT=1; beep(140,0.15,'square',0.04); return; } bans--; throwT=0.35; shots.push({x:P.x+Math.cos(P.a)*0.3,y:P.y+Math.sin(P.a)*0.3,dx:Math.cos(P.a)*7,dy:Math.sin(P.a)*7,t:0}); beep(900,0.12,'triangle',0.05,300); }
 function update(dt){ dt=Math.min(dt,0.05); tAll+=dt; if(msgT>0) msgT-=dt; if(quoteT>0) quoteT-=dt; if(hurtT>0) hurtT-=dt; if(throwT>0) throwT-=dt;
  if(mode==='attract'){ demoA+=dt*0.25; return; }
  if(mode==='ready'){ if(msgT<=0) mode='play'; return; }
  if(mode==='over'){ if(msgT<=0) mode='attract'; return; }
  if(mode==='clear'){ if(msgT<=0){ level++; load(level); mode='ready'; msgT=1.6; msg='ETAGE '+(level+1); } return; }
  // Spieler
  P.a+=ax.t*2.2*dt; const sp=2.6*dt, ca=Math.cos(P.a), sa=Math.sin(P.a);
  const mx=(ca*ax.f-sa*ax.s)*sp, my=(sa*ax.f+ca*ax.s)*sp; if(mx||my){ move(P,mx,my,0.22); bob+=dt*9*Math.min(1,Math.hypot(ax.f,ax.s)); }
  // Ausgang
  if(exitPos&&Math.hypot(P.x-(exitPos[0]+0.5),P.y-(exitPos[1]+0.5))<1.05){ const b=Math.round(gl*5)+bans*20; score+=500+b; mode='clear'; msgT=2.4; msg='ETAGE GESCHAFFT +'+(500+b); beep(523,0.15); setTimeout(()=>beep(784,0.15),160); setTimeout(()=>beep(1046,0.3),320); return; }
  // Bananen im Flug
  shots=shots.filter(s=>{ s.t+=dt; s.x+=s.dx*dt; s.y+=s.dy*dt; if(solid(s.x,s.y)||s.t>2){ beep(220,0.06,'square',0.03); return false; }
   for(const e of ents){ if(e.k!=='suit'||e.st==='down'||e.st==='slip') continue; if(Math.hypot(e.x-s.x,e.y-s.y)<0.38){ e.hp--; if(e.hp<=0){ e.st='slip'; e.t=0.9; score+=e.v?250:100; beep(700,0.5,'sawtooth',0.04,120); } else { e.t=0.3; e.cd=1; beep(400,0.08,'square',0.04); quote='AUTSCH. DAS GEHT AN DEN VORSTAND.'; quoteT=1.6; } return false; } } return true; });
  // Entities
  ents.forEach(e=>{
   if(e.k!=='suit'){ if(e.k!=='plant'&&!e.got&&Math.hypot(e.x-P.x,e.y-P.y)<0.5){ e.got=1;
     if(e.k==='bunch'){ bans+=6; msg='+6 BANANEN'; } if(e.k==='soy'){ gl=Math.min(100,gl+20); msg='SOYLENT-RIEGEL +20 GLÜCK'; } if(e.k==='air'){ gl=Math.min(100,gl+35); msg='PERRI-AIR +35 GLÜCK'; } msgT=1.4; beep(1200,0.08); setTimeout(()=>beep(1600,0.1),80); } return; }
   if(e.st==='slip'){ e.t-=dt; if(e.t<=0) e.st='down'; return; } if(e.st==='down') return;
   const d=Math.hypot(P.x-e.x,P.y-e.y); e.cd-=dt;
   if(e.st==='idle'&&d<9&&los(e.x,e.y,P.x,P.y)){ e.st='chase'; if(Math.random()<0.6){ quote='MOMENT, HABEN SIE EINEN TERMIN?'; quoteT=1.4; } }
   if(e.st==='chase'||e.st==='talk'){ if(d>1.0){ e.st='chase'; const v=(e.v?0.9:1.15+level*0.12)*dt; move(e,(P.x-e.x)/d*v,(P.y-e.y)/d*v,0.25); e.ph+=dt*6; }
    else { e.st='talk'; if(e.cd<=0){ e.cd=1.3; const dmg=(e.v?12:7)+level*2; gl-=dmg; hurtT=0.35; quote=QUOTES[Math.random()*QUOTES.length|0]; quoteT=1.8; beep(110,0.35,'sawtooth',0.05,80);
     if(gl<=0){ gl=0; mode='over'; msgT=5; msg='SIE BESITZEN NICHTS.'; checkHS(); beep(300,1.4,'sawtooth',0.05,40); } } } } });
  // einander nicht stapeln
  for(let i=0;i<ents.length;i++) for(let j=i+1;j<ents.length;j++){ const a=ents[i],b=ents[j]; if(a.k!=='suit'||b.k!=='suit'||a.st==='down'||b.st==='down') continue; const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy); if(d>0&&d<0.5){ const p=(0.5-d)/2; move(a,-dx/d*p,-dy/d*p,0.25); move(b,dx/d*p,dy/d*p,0.25); } }
 }
 function checkHS(){ hs.push(['DU',score]); hs.sort((a,b)=>b[1]-a[1]); hs=hs.slice(0,5); newHS=hs.some(h=>h[0]==='DU'&&h[1]===score); try{ localStorage.setItem(HS_KEY,JSON.stringify(hs)); }catch(e){} }
 // ---------- Raycaster ----------
 const shade=(c,f)=>((255<<24)|((((c&255)*f)|0)<<16)|((((c>>8)&255)*f|0)<<8)|(((c>>16)&255)*f|0))>>>0; // c=0xRRGGBB -> ImageData (ABGR)
 const FOG=0.11;
 function render(px,py,pa){ const dirX=Math.cos(pa),dirY=Math.sin(pa),plX=-dirY*0.66,plY=dirX*0.66, hz=VH/2+(mode==='play'?Math.sin(bob)*1.2:0);
  // Boden (dunkler Teppich mit Muster) + Decke (Rasterdecke mit Leuchtfeldern)
  for(let y=0;y<VH;y++){ const fl=y>hz; const p=Math.abs(y-hz)+0.5; const rd=(VH/2)/p; const f=Math.max(0,Math.min(1,1/(1+rd*rd*FOG))); const lx0=dirX-plX, ly0=dirY-plY, stepX=rd*(2*plX)/VW, stepY=rd*(2*plY)/VW; let fx=px+rd*lx0, fy=py+rd*ly0; const row=y*VW;
   for(let x=0;x<VW;x++){ const cx=fx-Math.floor(fx), cy=fy-Math.floor(fy); let c;
    if(fl){ const chk=((Math.floor(fx*2)+Math.floor(fy*2))&1); c=chk?0x3a1414:0x2c0e10; if(cx<0.03||cy<0.03) c=0x1a0808; }
    else { const panel=((Math.floor(fx)+Math.floor(fy))%3===0)&&cx>0.2&&cx<0.8&&cy>0.2&&cy<0.8; c=panel?0xd8e8e0:((cx<0.04||cy<0.04)?0x30302c:0x4a4a44); }
    buf[row+x]=shade(c,f*(fl?1:0.85)); fx+=stepX; fy+=stepY; } }
  // Wände
  for(let x=0;x<VW;x++){ const cam=2*x/VW-1, rx=dirX+plX*cam, ry=dirY+plY*cam; let mx=px|0,my=py|0; const ddx=Math.abs(1/rx),ddy=Math.abs(1/ry); let sx,sy,sdx,sdy;
   if(rx<0){ sx=-1; sdx=(px-mx)*ddx; } else { sx=1; sdx=(mx+1-px)*ddx; } if(ry<0){ sy=-1; sdy=(py-my)*ddy; } else { sy=1; sdy=(my+1-py)*ddy; }
   let side=0,hit='1',n=0; while(n++<64){ if(sdx<sdy){ sdx+=ddx; mx+=sx; side=0; } else { sdy+=ddy; my+=sy; side=1; } const t=tile(mx,my); if(t!=='.'&&!isNaN(+t)){ hit=t; break; } }
   const pd=side===0?(sdx-ddx):(sdy-ddy); zb[x]=pd; const lh=VH/pd|0; let y0=(hz-lh/2)|0, y1=(hz+lh/2)|0;
   let wx=side===0?py+pd*ry:px+pd*rx; wx-=Math.floor(wx); let tid=+hit; if(tid===3) tid=[3,5,6,7][(mx*7+my*13)%4]; const T=TX[tid]||TX[1]; let tx=wx*T.w|0; if((side===0&&rx<0)||(side===1&&ry>0)) tx=T.w-tx-1; // y-unten-Karte: Schrift nicht spiegeln
   const f=Math.max(0,Math.min(1,1/(1+pd*pd*FOG)))*(side?0.72:1)*(hit==='4'?1.25:1);
   const ya=Math.max(0,y0), yb=Math.min(VH-1,y1); for(let y=ya;y<=yb;y++){ const ty=((y-y0)/(y1-y0+1)*T.h)|0; const c=T.u[ty*T.w+tx]; buf[y*VW+x]=shade(((c&255)<<16)|(c&0xff00)|((c>>16)&255),Math.min(1,f)); } }
  // Sprites (fern -> nah), Tiefenpuffer pro Spalte
  const list=[]; ents.forEach(e=>{ if(e.got) return; let tex;
   if(e.k==='suit'){ const p=e.v?'v_':'s_'; tex=TX[p+(e.st==='down'?'down':e.st==='slip'?'slip':e.st==='talk'?'talk':(e.st==='chase'?((e.ph|0)%2?'w1':'w2'):'w1'))]; }
   else tex=TX[e.k]; list.push({x:e.x,y:e.y,tex,sc:e.k==='suit'?(e.v?1.08:1):(e.k==='plant'?0.9:0.7)}); });
  shots.forEach(s=>list.push({x:s.x,y:s.y,tex:TX.ban,sc:0.35,spin:s.t*14,lift:0.05}));
  list.forEach(s=>s.d=(s.x-px)**2+(s.y-py)**2); list.sort((a,b)=>b.d-a.d);
  const inv=1/(plX*dirY-dirX*plY);
  list.forEach(s=>{ const rx=s.x-px, ry=s.y-py, tX=inv*(dirY*rx-dirX*ry), tY=inv*(-plY*rx+plX*ry); if(tY<=0.1) return; const scx=(VW/2)*(1+tX/tY)|0; const full=VH/tY; const h=full*s.sc|0, w=h;
   const yb=(hz+full/2-(s.lift||0)*full)|0, ya=yb-h; const xa=scx-w/2|0, xe=xa+w; const f=Math.max(0,Math.min(1,1/(1+tY*tY*FOG))); const T=s.tex;
   for(let x=Math.max(0,xa);x<Math.min(VW,xe);x++){ if(tY>=zb[x]) continue; let tx=((x-xa)/w*T.w)|0; if(s.spin&&((s.spin|0)%2)) tx=T.w-1-tx;
    for(let y=Math.max(0,ya);y<Math.min(VH,yb);y++){ const ty=((y-ya)/h*T.h)|0; const c=T.u[ty*T.w+tx]; if((c>>>24)<128) continue; buf[y*VW+x]=shade(((c&255)<<16)|(c&0xff00)|((c>>16)&255),f); } } });
  vx.putImageData(img,0,0); out.imageSmoothingEnabled=false; out.drawImage(vc,0,0,VW,VH,0,0,320,208); }
 // ---------- HUD / Overlays ----------
 function txt(s,cx,y,col,size,al){ out.font='bold '+(size||12)+'px monospace'; out.textAlign=al||'center'; out.fillStyle=col; out.fillText(s,cx,y); }
 function hand(){ const by=Math.abs(Math.sin(bob))*4, k=throwT>0?throwT/0.35:0; const x0=196+Math.cos(bob)*3, y0=176+by+k*30;
  out.fillStyle='#e0b090'; out.fillRect(x0+10,y0+8,36,40); out.fillStyle='#3a3e48'; out.fillRect(x0+6,y0+30,46,30);
  if(bans>0&&k<0.6){ out.fillStyle='#f0d030'; out.beginPath(); out.ellipse(x0+20,y0-2,7,22,-0.5,0,7); out.fill(); out.fillStyle='#806010'; out.fillRect(x0+30,y0-22,4,6); } }
 function hud(){ out.fillStyle='#0a0a10'; out.fillRect(0,208,320,48); out.fillStyle='#2a2a38'; out.fillRect(0,208,320,2);
  const gc=gl>50?'#60ff80':gl>25?'#ffd040':'#ff4060'; txt('GLÜCK',36,224,'#8890a0',9); txt(Math.max(0,Math.round(gl))+'%',36,242,gc,16);
  txt('BANANEN',112,224,'#8890a0',9); txt(String(bans),112,242,'#f0d030',16);
  txt('PUNKTE',196,224,'#8890a0',9); txt(String(score),196,242,'#40c0ff',16);
  txt('ETAGE',276,224,'#8890a0',9); txt(String(level+1),276,242,'#c070ff',16);
  }
 function overlays(){ if(hurtT>0){ out.fillStyle=`rgba(255,0,40,${hurtT*0.7})`; out.fillRect(0,0,320,208); }
  if(quoteT>0){ out.font='bold 10px monospace'; const w=Math.min(300,out.measureText(quote).width+16); out.fillStyle='rgba(255,255,255,0.9)'; out.fillRect(160-w/2,8,w,18); out.fillStyle='#101018'; out.textAlign='center'; out.fillText(quote,160,21); }
  if(msgT>0||mode==='over'){ out.fillStyle='rgba(0,0,0,0.6)'; out.fillRect(30,88,260,30); txt(msg,160,108,mode==='over'?'#ff4060':'#ffd040',13); if(mode==='over'){ txt('UND SIND GLÜCKLICH.',160,134,'#c8b8e0',11); if(newHS) txt('NEUER REKORD!',160,152,'#60ff80',11); } } }
 function attract(){ if(!M) load(0); render(7.5,5.5,demoA); out.fillStyle='rgba(0,0,0,0.55)'; out.fillRect(0,0,320,256);
  out.save(); out.shadowColor='#40e0ff'; out.shadowBlur=14; txt('FORUM 3D',160,52,'#a0f0ff',34); out.restore();
  txt('ZENTRALE DES WELTWIRTSCHAFTSFORUMS',160,74,'#c8b8e0',9); txt('FÜR GLÜCK UND VERZICHT',160,86,'#c8b8e0',9);
  txt('MUNITION: BANANEN.  ZIEL: DER AUFZUG.',160,104,'#f0d030',9);
  txt('HIGHSCORES',160,128,'#ff40a0',11); hs.slice(0,5).forEach((h,i)=>txt((i+1)+'. '+h[0].padEnd(3,' ')+'  '+String(h[1]).padStart(5,' '),160,144+i*14,['#ffd040','#60ff80','#40c0ff','#c0d0ff','#ff6030'][i],11));
  if((tAll*2|0)%2) txt('MÜNZE EINWERFEN',160,230,'#ffffff',13); txt('© 1984 SCHLEIFE ELECTRONICS',160,250,'#504060',8); }
 function post(){ out.globalAlpha=0.26; out.fillStyle='#000'; for(let y=0;y<256;y+=3) out.fillRect(0,y,320,1); out.globalAlpha=1;
  if(Math.random()<0.012){ const y=Math.random()*200; out.drawImage(cv,0,y,320,5,(Math.random()-0.5)*5,y,320,5); }
  const v=out.createRadialGradient(160,128,90,160,128,210); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.75)'); out.fillStyle=v; out.fillRect(0,0,320,256); }
 function draw(){ out.fillStyle='#000'; out.fillRect(0,0,320,256); if(mode==='attract'){ attract(); post(); return; } render(P.x,P.y,P.a); hand(); hud(); overlays(); post(); }
 return { update, draw, fire, state:()=>mode, score:()=>score, _dbg:()=>({P,ents,shots,gl,bans,level,M,exitPos}),
  setAxes(f,t,s){ ax.f=f||0; ax.t=t||0; ax.s=s||0; },
  coin(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); master=AC.createGain(); master.gain.value=0.7; master.connect(AC.destination); }catch(e){} } if(AC&&AC.state==='suspended') AC.resume();
   if(mode==='attract'||mode==='over'){ beep(1400,0.05); setTimeout(()=>beep(1800,0.08),70); startGame(); return true; } return false; } };
};

// ---------- Einbau in die Spielhalle ----------
window.mountForum3D=function(sc,cab,hideExtra){ const T=THREE, S=sc.object3D;
 const cv=document.createElement('canvas'); cv.width=320; cv.height=256; const game=Forum3D(cv); game.draw();
 const tex=new T.CanvasTexture(cv); tex.colorSpace=T.SRGBColorSpace; tex.minFilter=T.LinearFilter; tex.generateMipmaps=false;
 const Mc=new T.Matrix4().compose(new T.Vector3(cab.x,0,cab.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),cab.ry),new T.Vector3(1,1,1));
 const place=(o,lp,rx,off)=>{ const m=new T.Matrix4().makeRotationX(rx); m.setPosition(lp[0],lp[1],lp[2]); const n=new T.Vector3(0,0,1).applyAxisAngle(new T.Vector3(1,0,0),rx).multiplyScalar(off); m.premultiply(new T.Matrix4().makeTranslation(n.x,n.y,n.z)); m.premultiply(Mc); m.decompose(o.position,o.quaternion,o.scale); };
 const el=document.createElement('a-entity'); el.classList.add('clickable'); el.setAttribute('geometry','primitive:plane;width:0.5;height:0.4'); el.setAttribute('material','shader:flat;side:front;fog:false'); sc.appendChild(el);
 el.addEventListener('loaded',()=>{ const m=el.getObject3D('mesh'); m.material=new T.MeshBasicMaterial({map:tex,toneMapped:false,fog:false}); place(el.object3D,[0,1.323,0.19],-0.27,0.004); });
 const mc=document.createElement('canvas'); mc.width=512; mc.height=204; { const g=mc.getContext('2d'); const gr=g.createLinearGradient(0,0,0,204); gr.addColorStop(0,'#04202a'); gr.addColorStop(0.5,'#000'); gr.addColorStop(1,'#04202a'); g.fillStyle=gr; g.fillRect(0,0,512,204); g.strokeStyle='#40e0ff'; g.lineWidth=5; g.strokeRect(10,10,492,184);
  g.font='bold 74px Arial Black, Arial'; g.textAlign='center'; g.textBaseline='middle'; g.shadowColor='#40e0ff'; g.shadowBlur=22; g.fillStyle='#a0f0ff'; g.fillText('FORUM 3D',256,88); g.shadowBlur=0; g.lineWidth=2.5; g.strokeStyle='#fff'; g.strokeText('FORUM 3D',256,88);
  g.font='bold 19px Arial'; g.fillStyle='#f0d030'; g.fillText('GLÜCK · VERZICHT · BANANEN',256,150); g.font='bold 14px Arial'; g.fillStyle='#60a0b0'; g.fillText('SCHLEIFE ELECTRONICS 1984',256,176); }
 const mt=new T.CanvasTexture(mc); mt.colorSpace=T.SRGBColorSpace; const mar=new T.Mesh(new T.PlaneGeometry(0.6,0.24),new T.MeshBasicMaterial({map:mt,toneMapped:false,color:0xd8d8d8})); place(mar,[0,1.71,0.226],0.15,0.004); S.add(mar); (window.__arcCabHide=window.__arcCabHide||[]).push(el,mar,...(hideExtra||[]));
 // ---------- Steuerung: Automat anklicken -> Kino-Modus (ArcadeCinema in arc3d.js) ----------
 let playing=false; const rig=document.getElementById('rig'), cam=document.getElementById('cam'); let rot0=0, idle=0; const keys={};
 const sub=document.getElementById('sub'); const hint=s=>{ if(!sub) return; sub.textContent=s; sub.style.display='block'; clearTimeout(hint.t); hint.t=setTimeout(()=>sub.style.display='none',3600); };
 const vr=()=>sc.is('vr-mode');
 const hb=document.createElement('a-entity'); hb.classList.add('clickable'); hb.setAttribute('geometry','primitive:box;width:0.74;height:1.84;depth:0.9'); hb.setAttribute('material','visible:false');
 hb.setAttribute('position',(cab.x+Math.sin(cab.ry)*0.04)+' 0.92 '+(cab.z+Math.cos(cab.ry)*0.04)); hb.setAttribute('rotation','0 '+(cab.ry*180/Math.PI)+' 0'); sc.appendChild(hb);
 function onScreen(){ if(playing||!window.ArcadeCinema||ArcadeCinema.busy()) return; const cw=new T.Vector3(); cam.object3D.getWorldPosition(cw);
  if(Math.hypot(cw.x-cab.x,cw.z-cab.z)>2.6){ hint('Geh näher an den Automaten.'); return; } enter(); }
 const act=()=>{ idle=0; if(game.state()==='play') game.fire(); else game.coin(); };
 const keyAxes=()=>game.setAxes((keys.f?1:0)-(keys.b?1:0),(keys.r?1:0)-(keys.l?1:0),(keys.sr?1:0)-(keys.sl?1:0));
 function enter(){ const rm=rig.components['room-move'];
  const ok=ArcadeCinema.open(sc,{ id:'f3d', tex, lines:256,
   caption:vr()?'FORUM 3D  ·  linker Stick = gehen / drehen  ·  rechter Stick = drehen  ·  A / Trigger = Banane  ·  B / Y = zurück':'FORUM 3D  ·  Pfeile / WASD  ·  Leertaste / Klick = Banane  ·  Esc = zurück',
   act, input:(L,R)=>{ idle=0; game.setAxes(-L[1], L[0]*0.8+R[0]*0.8, 0); },
   onOpen:()=>{ game.coin(); }, onClose:()=>{ playing=false; game.setAxes(0,0,0); for(const k in keys) keys[k]=0; if(rm){ rm.ax=[0,0]; rm.play(); } if(cam.components['wasd-controls']) cam.setAttribute('wasd-controls','enabled',true); } });
  if(!ok) return; playing=true; idle=0; if(rm){ rm.ax=[0,0]; rm.pause(); } if(cam.components['wasd-controls']) cam.setAttribute('wasd-controls','enabled',false); rot0=rig.object3D.rotation.y;
  hint(vr()?'Kino-Modus · FORUM 3D · B/Y = zurück':'Kino-Modus · FORUM 3D · Pfeiltasten/WASD · Leertaste = Banane · Esc = zurück'); }
 function leave(){ if(window.ArcadeCinema) ArcadeCinema.close('f3d'); }
 el.addEventListener('click',onScreen); hb.addEventListener('click',onScreen);
 const KM={ArrowUp:'f',KeyW:'f',ArrowDown:'b',KeyS:'b',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',KeyQ:'sl',KeyE:'sr'};
 window.addEventListener('keydown',e=>{ if(!playing||ArcadeCinema.phase()!=='on') return; if(e.code==='Space'||e.code==='Enter'){ act(); e.preventDefault(); return; } if(e.code in KM){ keys[KM[e.code]]=1; keyAxes(); idle=0; e.preventDefault(); } },true);
 window.addEventListener('keyup',e=>{ if(e.code in KM){ keys[KM[e.code]]=0; if(playing) keyAxes(); } },true);
 let acc=0; const camW=new T.Vector3();
 AFRAME.registerComponent('f3d-tick',{tick(t,dt){ const d=Math.min(dt||16,50)/1000; game.update(d); if(playing){ rig.object3D.rotation.y=rot0; idle+=d; if(idle>45&&game.state()==='attract') leave(); }
  // Quest sparen: im Spiel 30 fps, Attract nur 10 fps und nur wenn man in der Nähe ist
  acc+=d; const cw=cam.object3D.getWorldPosition(camW), near=Math.hypot(camW.x-cab.x,camW.z-cab.z)<6;
  if(acc>=(playing?1/30:1/10)&&(playing||near)){ acc=0; game.draw(); tex.needsUpdate=true; } }}); sc.setAttribute('f3d-tick','');
 window.__F3D=game; window.__F3Dm={enter,leave,hb,playing:()=>playing}; return game;
};
})();
