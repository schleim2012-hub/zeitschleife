/* Giß-Moe v3: Spiele-Menü, Maulwurf (Moe hauen – mit Quietsche-Hammer) und Giß-UNO. */
(function(){
let K; const G={}; const wait=ms=>new Promise(r=>setTimeout(r,ms)); const pick=a=>a[(Math.random()*a.length)|0];
const $=(s,r)=>(r||document).querySelector(s);
let speakUntil=0;
function say(t,force){ const now=performance.now(); if(!force&&now<speakUntil) return 0; const d=K.say(t)||1.2; speakUntil=now+d*1000+150; return d; }
async function sayW(t){ const d=say(t,true); await wait(d*1000+200); }
function hi(){ return K.M.hi=K.M.hi||{mole:0,unoW:0,unoL:0}; }
function boing(f0,f1,d){ const V=K.V, c=V.ctx; if(!c) return; const o=c.createOscillator(), g=c.createGain(), t=c.currentTime; o.type='sine'; o.frequency.setValueAtTime(f0||300,t); o.frequency.exponentialRampToValueAtTime(f1||900,t+(d||0.18)*0.5); o.frequency.exponentialRampToValueAtTime((f0||300)*0.8,t+(d||0.18));
 g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.22,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+(d||0.18)); o.connect(g).connect(V.out); o.start(t); o.stop(t+(d||0.18)+0.03); }
function squeak(){ boing(900,1700,0.12); setTimeout(()=>boing(1300,700,0.1),90); }
function enterGame(name){ const k=K; document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show')); k.begin(); k.rest(); k.st.game=name; document.body.classList.add('gaming'); k.interact(); }
function leaveGame(){ const k=K; k.st.game=false; document.body.classList.remove('gaming'); k.rest(); k.save(); k.interact(); }
/* ---------- CSS ---------- */
const CSS=`
#gmenu .gt{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:4px}
#gmenu .gb{min-height:118px;border:0;border-radius:24px;color:#fff;font:800 19px system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-shadow:0 6px 16px rgba(0,0,0,.25),inset 0 -5px 0 rgba(0,0,0,.18);text-shadow:0 2px 3px rgba(0,0,0,.25)}
#gmenu .gb i{font-style:normal;font-size:46px}#gmenu .gb small{font:600 12px system-ui;opacity:.9}
.gov{position:fixed;inset:0;z-index:20;display:none;touch-action:manipulation;user-select:none;-webkit-user-select:none;font-family:system-ui}
.gov.show{display:block}.gov .gx{position:absolute;top:max(12px,env(safe-area-inset-top));right:12px;width:52px;height:52px;border-radius:50%;border:0;background:rgba(255,255,255,.85);font:800 22px system-ui;color:#4a2c14;z-index:5;box-shadow:0 3px 10px rgba(0,0,0,.3)}
#mole{background:radial-gradient(120% 60% at 50% 0%,#bfe9ff 0,#8fd3ff 38%,#7cc96a 39%,#5fae4e 70%,#4d9a40 100%)}
#mole .mh{position:absolute;top:max(14px,env(safe-area-inset-top));left:14px;right:76px;display:flex;gap:10px;align-items:center}
#mole .sc{background:#fff;border-radius:22px;padding:8px 16px;font:800 22px system-ui;color:#4a2c14;box-shadow:0 3px 10px rgba(0,0,0,.2)}
#mole .tb{flex:1;height:16px;border-radius:8px;background:rgba(255,255,255,.6);overflow:hidden}#mole .tb div{height:100%;width:100%;background:linear-gradient(90deg,#ffd166,#ff8a5c);transition:width .25s linear}
#mole .fld{position:absolute;left:50%;top:56%;transform:translate(-50%,-50%);width:min(94vw,560px);display:grid;grid-template-columns:repeat(3,1fr);gap:4vmin 3vmin}
#mole .hole{position:relative;aspect-ratio:1/1.05}
#mole .hole .bk{position:absolute;left:6%;right:6%;bottom:8%;height:26%;border-radius:50%;background:radial-gradient(60% 60% at 50% 45%,#2a1708 0,#3d230e 60%,#5b3a1b 100%);box-shadow:inset 0 6px 10px rgba(0,0,0,.6)}
#mole .hole .win{position:absolute;left:0;right:0;top:-30%;bottom:21%;overflow:hidden}
#mole .hole .sp{position:absolute;left:8%;right:8%;bottom:0;height:100%;transform:translateY(105%);transition:transform .16s cubic-bezier(.2,1.4,.5,1);display:flex;align-items:flex-end;justify-content:center;pointer-events:none}
#mole .hole.up .sp{transform:translateY(8%)}#mole .hole.hit .sp{transform:translateY(30%) scaleY(.7);transition:transform .1s}
#mole .sp img{width:100%;height:auto;max-height:100%;object-fit:contain;filter:drop-shadow(0 4px 4px rgba(0,0,0,.3))}#mole .sp b{font-size:min(22vw,120px);line-height:1;filter:drop-shadow(0 4px 4px rgba(0,0,0,.3))}
#mole .sp.gold img{filter:sepia(1) saturate(4) hue-rotate(-12deg) brightness(1.2) drop-shadow(0 0 10px #ffe066)}#mole .sp .cr{position:absolute;top:2%;left:50%;transform:translateX(-50%);font-size:min(10vw,52px)}
#mole .hole .lip{position:absolute;left:0;right:0;bottom:0;height:16%;border-radius:0 0 50% 50%/0 0 100% 100%;background:linear-gradient(180deg,#7a5126,#5b3a1b);box-shadow:0 6px 8px rgba(0,0,0,.25)}
#mole .fl{position:absolute;font:900 30px system-ui;color:#fff;text-shadow:0 2px 0 #c0392b,0 0 8px rgba(0,0,0,.4);pointer-events:none;animation:flu .9s ease-out forwards}#mole .fl.neg{text-shadow:0 2px 0 #555}
@keyframes flu{from{transform:translate(-50%,0) scale(.6);opacity:1}to{transform:translate(-50%,-80px) scale(1.2);opacity:0}}
#mole .ham{position:fixed;font-size:64px;pointer-events:none;transform:translate(-30%,-70%) rotate(-30deg);transition:transform .08s;z-index:4;display:none}#mole .ham.sw{transform:translate(-30%,-60%) rotate(25deg)}
.gend{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.35);z-index:6}.gend.show{display:flex}
.gend .cd{background:linear-gradient(180deg,#fff6e4,#f1dbb5);border-radius:28px;padding:22px 26px;text-align:center;color:#4a2c14;box-shadow:0 10px 30px rgba(0,0,0,.4);min-width:250px}
.gend h2{margin:4px 0 6px;font:800 30px system-ui}.gend p{margin:4px 0 14px;font:600 18px system-ui}.gend button{border:0;border-radius:20px;padding:14px 22px;margin:4px;font:800 18px system-ui;color:#fff;background:linear-gradient(180deg,#7ddc6f,#3fae49);box-shadow:0 4px 10px rgba(0,0,0,.2)}.gend button.n{background:linear-gradient(180deg,#b9a38a,#8d7356)}
.gintro{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);font:900 min(14vw,72px) system-ui;color:#fff;text-shadow:0 4px 0 #e2533a,0 0 20px rgba(0,0,0,.35);z-index:5;pointer-events:none}
#uno{top:auto;height:57vh;border-radius:30px 30px 0 0;background:radial-gradient(120% 90% at 50% 0%,#2e9e6a 0,#1f7a50 60%,#155c3b 100%);box-shadow:0 -10px 40px rgba(0,0,0,.45)}
#uno .gx{top:10px}body.unoing #c{transform:translateY(-15vh) scale(.78);transform-origin:50% 30%;transition:transform .4s}#c{transition:transform .4s}#uno .um{position:absolute;top:14px;left:16px;right:76px;display:flex;align-items:center;gap:8px;color:#fff;font:700 15px system-ui}
#uno .mh{display:flex;height:46px;align-items:center}#uno .mh .cb{width:24px;height:36px;margin-right:-12px;border-radius:5px}#uno .mn{margin-left:14px;white-space:nowrap}
#uno .mid{position:absolute;top:62px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:26px}
#uno .st{position:absolute;top:calc(62px + 104px);font-size:16px!important;left:12px;right:12px;text-align:center;color:#fff;font:800 18px system-ui;text-shadow:0 2px 4px rgba(0,0,0,.4);min-height:24px}
#uno .hand{position:absolute;left:0;right:0;bottom:max(10px,env(safe-area-inset-bottom));height:calc(57vh - 225px);min-height:118px;display:flex;flex-wrap:wrap;align-content:flex-end;justify-content:center;gap:6px 0;padding:0 104px 0 14px;overflow-y:auto}
#uno .hand .card{margin:0 -8px;transition:transform .15s}#uno .hand .card.ok{transform:translateY(-14px);box-shadow:0 0 0 3px #fff,0 8px 16px rgba(0,0,0,.4)}#uno .hand .card.no{filter:brightness(.72)}
.card{position:relative;width:62px;height:92px;border-radius:12px;background:#fff;box-shadow:0 4px 10px rgba(0,0,0,.35);flex:0 0 auto;padding:5px;box-sizing:border-box}
.card .in{position:absolute;inset:5px;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.card .ov{position:absolute;width:86%;height:62%;background:#fff;border-radius:50%;transform:rotate(-28deg)}
.card .v{position:relative;font:900 32px system-ui;-webkit-text-stroke:1.5px #222;text-shadow:2px 2px 0 rgba(0,0,0,.35)}.card .c1,.card .c2{position:absolute;font:900 14px system-ui;color:#fff;text-shadow:1px 1px 0 rgba(0,0,0,.5)}.card .c1{top:3px;left:6px}.card .c2{bottom:3px;right:6px;transform:rotate(180deg)}
.card.r .in{background:#e53935}.card.y .in{background:#fbc02d}.card.g .in{background:#43a047}.card.b .in{background:#1e88e5}.card.w .in{background:conic-gradient(#e53935 0 25%,#fbc02d 0 50%,#43a047 0 75%,#1e88e5 0)}
.card.w .ov{background:#222}.card.w .v{color:#fff;-webkit-text-stroke:0}
.card.back .in{background:radial-gradient(circle at 50% 50%,#c46a2c 0,#7a3d16 100%)}.card.back .ov{background:#ffcf6b}.card.back .v{font-size:17px;color:#7a3d16;-webkit-text-stroke:0;text-shadow:none;text-align:center;line-height:1}
.card.sm{width:24px;height:36px;padding:2px;border-radius:6px}.card.sm .in{inset:2px;border-radius:4px}.card.sm .ov,.card.sm .v{display:none}
#uno .pile{position:relative;width:62px;height:92px}#uno .pile .card{position:absolute;left:0;top:0}#uno .disc .card.new{animation:cin .28s ease-out}@keyframes cin{from{transform:translateY(80px) scale(.7) rotate(-12deg);opacity:.3}}
#uno .ring{width:34px;height:34px;border-radius:50%;border:4px solid #fff;box-shadow:0 0 12px rgba(255,255,255,.8)}
#uno .deck.can .card:last-child{box-shadow:0 0 0 3px #fff,0 0 18px #fff}
#unoB{position:absolute;right:12px;bottom:max(16px,env(safe-area-inset-bottom));width:84px;height:84px;border-radius:50%;border:4px solid #fff;background:radial-gradient(circle at 40% 35%,#ff6b5c,#c62828);color:#fff;font:900 22px system-ui;box-shadow:0 6px 16px rgba(0,0,0,.4);z-index:3}
#unoB.hot{animation:unoP .6s infinite}@keyframes unoP{50%{transform:scale(1.12)}}
#uno .pass{position:absolute;left:50%;transform:translateX(-50%);top:calc(62px + 132px);border:0;border-radius:18px;padding:8px 16px;font:800 15px system-ui;background:#fff;color:#1f7a50;display:none;z-index:3}
#uno .cpk{position:absolute;inset:0;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;z-index:6;border-radius:30px 30px 0 0}#uno .cpk.show{display:flex}
#uno .cpk div{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#fff;padding:18px;border-radius:24px}#uno .cpk p{grid-column:1/3;margin:0;text-align:center;font:800 18px system-ui;color:#333}
#uno .cpk button{width:110px;height:80px;border-radius:18px;border:0;box-shadow:inset 0 -5px 0 rgba(0,0,0,.2)}
.shake{animation:shk .3s}@keyframes shk{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
`;
/* ---------- Menü ---------- */
let menu;
function buildMenu(){ menu=document.createElement('div'); menu.id='gmenu'; menu.className='panel';
 const T=[['cups','🎩','Hütchen','Wo ist Moe?','#ff8a5c,#e2533a'],['such','🔍','Such Moe','Wimmelbild','#9a83f0,#6c52d6'],['mole','🔨','Maulwurf','Moe kitzeln!','#7ddc6f,#3fae49'],['uno','🃏','Giß-UNO','Kartenspiel','#5ec8ff,#1e88e5']];
 menu.innerHTML='<div class="ph"><b>🎲 Spiele</b><button class="x" aria-label="Schließen">✕</button></div><div class="gt">'+T.map(t=>'<button class="gb" data-g="'+t[0]+'" style="background:linear-gradient(180deg,'+t[4]+')"><i>'+t[1]+'</i>'+t[2]+'<small>'+t[3]+'</small></button>').join('')+'</div>';
 document.body.appendChild(menu); menu.addEventListener('pointerdown',e=>e.stopPropagation());
 $('.x',menu).addEventListener('pointerup',e=>{ e.stopPropagation(); menu.classList.remove('show'); });
 menu.querySelectorAll('.gb').forEach(b=>b.addEventListener('pointerup',e=>{ e.stopPropagation(); K.V.unlock(); menu.classList.remove('show'); const g=b.dataset.g;
  if(g==='cups') GissFun.startCups(); else if(g==='such') GissWear.openWimmel(); else if(g==='mole') G.startMole(); else G.startUno(); })); }
G.openMenu=async()=>{ if(K.st.game) return; document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show')); menu.classList.add('show'); if(K.st.mode==='sleep') await K.wake(); say('Au ja! Was wollen wir spielen?'); };
/* ---------- Maulwurf ---------- */
const ML={start:['Fang mich doch, wenn du kannst! Hihi!'],hit:['Hihi! Erwischt!','Boing! Das kitzelt!','Hey! Meine Frisur!','Ui! Du bist aber schnell!','Hihi! Nochmal!','Uiii! Quietsch!'],
 decoy:['Hihi! Das war doch nicht ich!','Falscher Kopf! Hihi!','Das war ein Frosch, du Schlingel!'],gold:['Goldener Moe! Drei Punkte!'],miss:['Daneben! Ätschibätsch!'],
 end:['Puh! Du bist superschnell!','Hihi! Das war lustig! Nochmal?'],rec:['Neuer Rekord! Wahnsinn!']};
let mole=null, mov, moeImg='';
function buildMole(){ mov=document.createElement('div'); mov.id='mole'; mov.className='gov';
 mov.innerHTML='<div class="mh"><div class="sc">⭐ <span id="mS">0</span></div><div class="tb"><div id="mT"></div></div></div><button class="gx" aria-label="Beenden">✕</button><div class="fld">'+Array.from({length:9},(_,i)=>'<div class="hole" data-i="'+i+'"><div class="bk"></div><div class="win"><div class="sp"></div></div><div class="lip"></div></div>').join('')+'</div><div class="ham">🔨</div><div class="gend"><div class="cd"><h2></h2><p></p><button class="a">Nochmal!</button><button class="n">Fertig</button></div></div>';
 document.body.appendChild(mov); ['pointerdown','pointerup','click'].forEach(ev=>mov.addEventListener(ev,e=>e.stopPropagation()));
 $('.gx',mov).addEventListener('pointerup',()=>G.endMole(true)); $('.gend .a',mov).addEventListener('pointerup',()=>{ $('.gend',mov).classList.remove('show'); G.startMole(); }); $('.gend .n',mov).addEventListener('pointerup',()=>G.endMole(true));
 mov.querySelectorAll('.hole').forEach(h=>h.addEventListener('pointerdown',e=>{ e.preventDefault(); whack(+h.dataset.i,e); }));
 mov.addEventListener('pointermove',e=>{ const h=$('.ham',mov); h.style.left=e.clientX+'px'; h.style.top=e.clientY+'px'; }); }
G.startMole=async function(){ const k=K; if(k.st.mode==='sleep') await k.wake(); enterGame('mole');
 if(!moeImg||Date.now()-(G._snapT||0)>60000){ k.rest(); k.A.low=0.6; k.A.lid=0.3; k.A.earUp=0.4; await wait(150); try{ moeImg=GissWear.snap().toDataURL(); G._snapT=Date.now(); }catch(e){ moeImg=''; } k.rest(); }
 mov.classList.add('show'); $('.gend',mov).classList.remove('show'); mov.querySelectorAll('.hole').forEach(h=>{ h.className='hole'; $('.sp',h).innerHTML=''; });
 mole={score:0,t0:0,dur:40000,holes:Array(9).fill(null),run:true,hits:0}; $('#mS').textContent='0'; $('#mT').style.width='100%';
 const intro=document.createElement('div'); intro.className='gintro'; mov.appendChild(intro);
 await sayW(ML.start[0]); for(const s of ['3','2','1','Los!']){ if(!mole||!mole.run) { intro.remove(); return; } intro.textContent=s; boing(500,s==='Los!'?1200:700,0.15); await wait(650); } intro.remove();
 mole.t0=performance.now(); loopMole(); };
function spriteHTML(kind){ if(kind==='moe') return moeImg?'<img src="'+moeImg+'" alt="">':'<b>🐹</b>'; if(kind==='gold') return (moeImg?'<img src="'+moeImg+'" alt="">':'<b>🐹</b>')+'<span class="cr">👑</span>'; return '<b>'+kind+'</b>'; }
async function loopMole(){ const m=mole; while(m===mole&&m.run){ const el=performance.now()-m.t0, f=Math.min(1,el/m.dur); $('#mT').style.width=(100-f*100)+'%';
  if(el>=m.dur){ return finishMole(); }
  const free=[...Array(9).keys()].filter(i=>!m.holes[i]); const maxUp=f<0.4?1:2;
  if(free.length&&m.holes.filter(x=>x).length<maxUp){ const i=pick(free); const r=Math.random(); const kind=r<0.08?'gold':r<0.36?pick(['🐸','🐥','🐰','🦔']):'moe'; popUp(i,kind,1150-500*f); }
  await wait(420+Math.random()*(520-260*f)); } }
function popUp(i,kind,stay){ const m=mole, h=mov.querySelectorAll('.hole')[i], sp=$('.sp',h); sp.className='sp'+(kind==='gold'?' gold':''); sp.innerHTML=spriteHTML(kind); const o={kind,hit:false}; m.holes[i]=o; h.classList.remove('hit');
 requestAnimationFrame(()=>h.classList.add('up')); if(kind==='moe'||kind==='gold') boing(220,420,0.12);
 o.tm=setTimeout(()=>{ h.classList.remove('up'); setTimeout(()=>{ if(m.holes[i]===o) m.holes[i]=null; },180); },stay); }
function floatTxt(x,y,t,neg){ const d=document.createElement('div'); d.className='fl'+(neg?' neg':''); d.textContent=t; d.style.left=x+'px'; d.style.top=y+'px'; mov.appendChild(d); setTimeout(()=>d.remove(),900); }
function whack(i,e){ const m=mole; if(!m||!m.run||!m.t0) return; const ham=$('.ham',mov); ham.style.display='block'; ham.style.left=e.clientX+'px'; ham.style.top=e.clientY+'px'; ham.classList.add('sw'); setTimeout(()=>ham.classList.remove('sw'),110);
 const o=m.holes[i], h=mov.querySelectorAll('.hole')[i]; if(!o||o.hit||!h.classList.contains('up')){ boing(160,120,0.08); return; }
 o.hit=true; clearTimeout(o.tm); h.classList.add('hit'); setTimeout(()=>{ h.classList.remove('up','hit'); setTimeout(()=>{ if(m.holes[i]===o) m.holes[i]=null; },180); },260);
 if(o.kind==='moe'||o.kind==='gold'){ const p=o.kind==='gold'?3:1; m.score+=p; m.hits++; squeak(); floatTxt(e.clientX,e.clientY-30,'+'+p); if(window.GissFun&&GissFun.sfx&&Math.random()<0.35) GissFun.sfx('giggle');
   if(o.kind==='gold') say(ML.gold[0],true); else if(m.hits%3===1) say(pick(ML.hit)); }
 else { m.score=Math.max(0,m.score-1); boing(400,200,0.2); floatTxt(e.clientX,e.clientY-30,'−1',true); say(pick(ML.decoy)); }
 $('#mS').textContent=m.score; }
async function finishMole(){ const m=mole; m.run=false; mov.querySelectorAll('.hole').forEach(h=>h.classList.remove('up')); const H=hi(); const rec=m.score>H.mole; if(rec) H.mole=m.score; K.save(); K.xp(Math.min(6,2+((m.score/6)|0)));
 const g=$('.gend',mov); $('h2',g).textContent='⭐ '+m.score+' Punkte!'; $('p',g).textContent=rec&&m.score>0?'🏆 Neuer Rekord!':'Rekord: '+H.mole; g.classList.add('show'); K.V.chime();
 await sayW(rec&&m.score>0?ML.rec[0]:pick(ML.end)); }
G.endMole=function(){ if(mole){ mole.run=false; mole.holes.forEach(o=>o&&clearTimeout(o.tm)); } mole=null; mov.classList.remove('show'); leaveGame(); };
/* ---------- Giß-UNO ---------- */
const COL=['r','y','g','b'], CN={r:'Rot',y:'Gelb',g:'Grün',b:'Blau'};
const UL={start:['Giß-UNO! Ich mische! Du fängst an!'],uno:['UNO!'],d2:['Plus zwei für dich! Hihi!'],d4:['Plus vier! Hihihi! Tut mir gar nicht leid!'],skip:['Aussetzen! Ich bin nochmal dran!'],rev:['Richtungswechsel! Ich nochmal!'],
 wish:{r:'Ich wünsche mir Rot!',y:'Ich wünsche mir Gelb!',g:'Ich wünsche mir Grün!',b:'Ich wünsche mir Blau!'},draw:['Hmm … ich muss ziehen.','Menno! Ziehen!'],
 got2:['Oh nein! Zwei Karten! Na warte!'],got4:['Vier Karten?! Du bist ja frech! Hihi!'],gotSkip:['Menno! Ich muss aussetzen!'],forgot:['UNO vergessen! Zwei Karten ziehen! Hihi!'],caught:['Oh nein! Erwischt! Ich hab UNO vergessen!'],
 notyet:['Noch nicht! UNO ruft man bei der vorletzten Karte!'],win:['Du hast gewonnen! Super gespielt!'],lose:['Ich hab gewonnen! Hihi! Nochmal?'],think:['Hmm … mal überlegen …'],yourturn:['Du bist dran!'],nice:['Gute Karte!','Oh, clever!']};
let uno=null, uov;
function mkDeck(){ const d=[]; let id=0; COL.forEach(c=>{ d.push({c,v:'0',id:id++}); for(let n=1;n<=9;n++) for(let k=0;k<2;k++) d.push({c,v:String(n),id:id++}); ['skip','rev','d2'].forEach(v=>{ for(let k=0;k<2;k++) d.push({c,v,id:id++}); }); });
 for(let k=0;k<4;k++){ d.push({c:'w',v:'wild',id:id++}); d.push({c:'w',v:'d4',id:id++}); } return shuffle(d); }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }
const SYM={skip:'⊘',rev:'⇄',d2:'+2',wild:'★',d4:'+4'};
function cardHTML(c,cls){ if(!c) return ''; if(c==='back') return '<div class="card back '+(cls||'')+'"><div class="in"><div class="ov"></div><div class="v">GISS<br>UNO</div></div></div>'; const s=SYM[c.v]||c.v; const sm=c.v.length>1&&!SYM[c.v]?'':'';
 return '<div class="card '+c.c+' '+(cls||'')+'" data-id="'+c.id+'"><div class="in"><div class="ov"></div><div class="v" style="color:'+({r:'#e53935',y:'#fbc02d',g:'#43a047',b:'#1e88e5',w:'#fff'}[c.c])+'">'+s+'</div><div class="c1">'+s+'</div><div class="c2">'+s+'</div></div></div>'+sm; }
function buildUno(){ uov=document.createElement('div'); uov.id='uno'; uov.className='gov';
 uov.innerHTML='<button class="gx" aria-label="Beenden">✕</button><div class="um">🐾 Giß-Moe: <span class="mh"></span> <b class="mn"></b></div>'+
 '<div class="mid"><div class="pile deck"></div><div class="pile disc"></div><div class="ring"></div></div><div class="st"></div><button class="pass">Behalten ➜</button><div class="hand"></div><button id="unoB">UNO!</button>'+
 '<div class="cpk"><div><p>Welche Farbe?</p>'+COL.map(c=>'<button data-c="'+c+'" style="background:'+({r:'#e53935',y:'#fbc02d',g:'#43a047',b:'#1e88e5'}[c])+'"></button>').join('')+'</div></div>'+
 '<div class="gend"><div class="cd"><h2></h2><p></p><button class="a">Nochmal!</button><button class="n">Fertig</button></div></div>';
 document.body.appendChild(uov); ['pointerdown','pointerup','click'].forEach(ev=>uov.addEventListener(ev,e=>e.stopPropagation()));
 $('.gx',uov).addEventListener('pointerup',()=>G.endUno()); $('.gend .a',uov).addEventListener('pointerup',()=>{ $('.gend',uov).classList.remove('show'); G.startUno(); }); $('.gend .n',uov).addEventListener('pointerup',()=>G.endUno());
 $('.deck',uov).addEventListener('pointerup',e=>{ e.preventDefault(); pDraw(); }); $('.pass',uov).addEventListener('pointerup',e=>{ e.preventDefault(); pPass(); });
 $('#unoB').addEventListener('pointerup',e=>{ e.preventDefault(); pressUno(); });
 $('.hand',uov).addEventListener('pointerup',e=>{ const c=e.target.closest('.card'); if(c) pPlay(+c.dataset.id,c); });
 uov.querySelectorAll('.cpk button').forEach(b=>b.addEventListener('pointerup',e=>{ e.preventDefault(); const f=uno&&uno.colorCb; if(f){ uno.colorCb=null; $('.cpk',uov).classList.remove('show'); f(b.dataset.c); } })); }
const top=()=>uno.disc[uno.disc.length-1];
const canPlay=c=>c.c==='w'||c.c===uno.col||c.v===top().v;
function draw(who,n){ const out=[]; for(let i=0;i<n;i++){ if(!uno.deck.length){ const t=uno.disc.pop(); uno.deck=shuffle(uno.disc.map(c=>c.c==='w'?c:c)); uno.disc=[t]; if(!uno.deck.length) break; } const c=uno.deck.pop(); uno[who].push(c); out.push(c); } return out; }
function render(newDisc){ const u=uno; if(!u) return; const mh=$('.mh',uov); mh.innerHTML=u.m.slice(0,14).map(()=>'<div class="card back sm cb"><div class="in"></div></div>').join(''); $('.mn',uov).textContent=u.m.length+(u.m.length===1?' Karte':' Karten');
 $('.deck',uov).innerHTML=cardHTML('back')+cardHTML('back','')+cardHTML('back',''); [...$('.deck',uov).children].forEach((c,i)=>{ c.style.left=i*2+'px'; c.style.top=-i*2+'px'; });
 $('.deck',uov).classList.toggle('can',u.turn==='p'&&!u.drew&&!u.lock);
 const d=u.disc.slice(-3); $('.disc',uov).innerHTML=d.map((c,i)=>cardHTML(c,i===d.length-1&&newDisc?'new':'')).join(''); [...$('.disc',uov).children].forEach((c,i)=>{ c.style.transform=(i<d.length-1?'rotate('+((c.dataset.id*37)%30-15)+'deg)':''); });
 $('.ring',uov).style.background={r:'#e53935',y:'#fbc02d',g:'#43a047',b:'#1e88e5'}[u.col];
 const my=u.turn==='p'&&!u.lock; const hand=u.p.slice().sort((a,b)=>(a.c+a.v).localeCompare(b.c+b.v));
 $('.hand',uov).innerHTML=hand.map(c=>cardHTML(c,my?(u.drew?(c===u.drewCard&&canPlay(c)?'ok':'no'):(canPlay(c)?'ok':'no')):'')).join('');
 $('.pass',uov).style.display=my&&u.drew&&u.drewCard&&canPlay(u.drewCard)?'block':'none';
 $('#unoB').classList.toggle('hot',(u.p.length<=2&&u.turn==='p'&&!u.unoP)||!!u.catchM); }
function status(t){ $('.st',uov).textContent=t||''; }
G.startUno=async function(){ const k=K; if(k.st.mode==='sleep') await k.wake(); enterGame('uno'); document.body.classList.add('unoing'); uov.classList.add('show'); $('.gend',uov).classList.remove('show');
 uno={deck:mkDeck(),disc:[],p:[],m:[],turn:'x',lock:true,col:'r',drew:false,unoP:false,catchM:null};
 for(let i=0;i<7;i++){ draw('p',1); draw('m',1); } let c; while(true){ c=uno.deck.pop(); if(/^\d$/.test(c.v)) break; uno.deck.unshift(c); } uno.disc.push(c); uno.col=c.c;
 render(true); status('Giß-UNO! 🃏'); moePose('happy'); await sayW(UL.start[0]); if(!uno) return; pTurn(); };
function pTurn(){ const u=uno; if(!u) return; u.turn='p'; u.lock=false; u.drew=false; u.drewCard=null; status('Du bist dran! Lege eine passende Karte – oder zieh eine.'); render(); }
function moePose(m){ const k=K, A=k.A; k.rest(); if(m==='happy'){ A.low=0.6; A.lid=0.35; A.earUp=0.5; A.hop=0.5; setTimeout(()=>A.hop=0,600); } else if(m==='sad'){ A.brow=0.6; A.earUp=-0.4; A.lid=0.35; } else if(m==='think'){ A.lookX=0.3; A.lookY=-0.35; A.lid=0.3; A.earWig=0.6; } else if(m==='cheeky'){ A.low=0.5; A.lid=0.4; A.earWig=1.2; A.blush=0.6; } }
async function pPlay(id,el){ const u=uno; if(!u||u.turn!=='p'||u.lock) return; const c=u.p.find(x=>x.id===id); if(!c) return;
 if(u.drew&&c!==u.drewCard){ el&&el.classList.add('shake'); status('Du hast gezogen – du kannst nur die neue Karte legen.'); return; }
 if(!canPlay(c)){ el&&el.classList.add('shake'); boing(200,150,0.12); status('Die passt nicht. Gleiche Farbe, gleiche Zahl oder ein Farbwechsel!'); return; }
 u.lock=true; let col=c.c; if(c.c==='w'){ col=await new Promise(res=>{ uno.colorCb=res; $('.cpk',uov).classList.add('show'); }); if(!uno) return; }
 await playCard('p',c,col); }
async function playCard(who,c,col){ const u=uno; u[who].splice(u[who].indexOf(c),1); u.disc.push(c); u.col=col; K.V.pop(); render(true);
 const other=who==='p'?'m':'p';
 if(u[who].length===0){ return finishUno(who); }
 /* UNO-Regel */
 if(who==='p'){ if(u.p.length===1){ if(!u.unoP){ status('Eine Karte übrig … 👀'); render(); await wait(2600); if(!uno) return; if(!u.unoP){ moePose('cheeky'); await sayW(UL.forgot[0]); draw('p',2); render(); } } }
  else u.unoP=false; }
 else { if(u.m.length===1){ if(Math.random()<0.82){ moePose('happy'); await sayW(UL.uno[0]); } else { u.catchM=true; render(); status('Hat Giß-Moe was vergessen? 🤭'); await wait(2800); if(!uno) return; u.catchM=false; render(); } } }
 if(!uno) return;
 let again=false;
 if(c.v==='skip'||c.v==='rev'){ again=true; if(who==='m'){ moePose('cheeky'); await sayW(c.v==='skip'?UL.skip[0]:UL.rev[0]); } else { moePose('sad'); await sayW(UL.gotSkip[0]); } }
 else if(c.v==='d2'||c.v==='d4'){ const n=c.v==='d2'?2:4; again=true; draw(other,n); render();
  if(who==='m'){ moePose('cheeky'); await sayW(c.v==='d2'?UL.d2[0]:UL.d4[0]); if(c.c==='w') await sayW(UL.wish[col]); }
  else { moePose('sad'); await sayW(c.v==='d2'?UL.got2[0]:UL.got4[0]); } }
 else if(c.c==='w'&&who==='m'){ moePose('happy'); await sayW(UL.wish[col]); }
 else if(who==='p'&&Math.random()<0.18){ say(pick(UL.nice)); }
 if(!uno) return;
 const next=again?who:other; if(next==='p') pTurn(); else moeTurn(); }
function pDraw(){ const u=uno; if(!u||u.turn!=='p'||u.lock||u.drew) return; const [c]=draw('p',1); u.drew=true; u.drewCard=c; u.unoP=false; K.V.pop();
 if(c&&canPlay(c)){ status('Die neue Karte passt! Legen – oder behalten.'); render(); }
 else { status('Passt nicht. Giß-Moe ist dran.'); u.lock=true; render(); setTimeout(()=>uno&&moeTurn(),900); } }
function pPass(){ const u=uno; if(!u||u.turn!=='p'||!u.drew) return; u.lock=true; render(); moeTurn(); }
async function pressUno(){ const u=uno; if(!u) return; K.V.unlock();
 if(u.catchM){ u.catchM=false; draw('m',2); render(); moePose('sad'); await sayW(UL.caught[0]); return; }
 if(u.p.length<=2&&!u.unoP&&(u.turn==='p'||u.p.length===1)){ u.unoP=true; boing(600,1400,0.2); status('UNO! 🎉'); render(); return; }
 status('Noch nicht! UNO ruft man bei der vorletzten Karte.'); say(UL.notyet[0]); }
async function moeTurn(){ const u=uno; if(!u) return; u.turn='m'; u.lock=true; render(); status('Giß-Moe überlegt …'); moePose('think'); if(Math.random()<0.3) say(UL.think[0]); await wait(1300+Math.random()*700); if(!uno) return;
 let pl=u.m.filter(canPlay); let c=chooseMoe(pl);
 if(!c){ const [d]=draw('m',1); render(); say(pick(UL.draw)); moePose('sad'); await wait(1100); if(!uno) return; if(d&&canPlay(d)) c=d; else { pTurn(); return; } }
 let col=c.c; if(c.c==='w'){ const cnt={r:0,y:0,g:0,b:0}; u.m.forEach(x=>x!==c&&x.c!=='w'&&cnt[x.c]++); col=COL.reduce((a,b)=>cnt[b]>cnt[a]?b:a,COL[(Math.random()*4)|0]); }
 status(''); await playCard('m',c,col); }
function chooseMoe(pl){ if(!pl.length) return null; const u=uno; const nw=pl.filter(c=>c.c!=='w');
 if(u.p.length<=2){ const a=nw.find(c=>c.v==='d2')||nw.find(c=>c.v==='skip'||c.v==='rev')||pl.find(c=>c.v==='d4'); if(a) return a; }
 if(nw.length){ if(Math.random()<0.25) return pick(nw); const same=nw.filter(c=>c.c===u.col); const pool=same.length?same:nw; return pool.sort((a,b)=>(+b.v||5)-(+a.v||5))[0]; }
 return pl.find(c=>c.v==='wild')||pl[0]; }
async function finishUno(who){ const u=uno; u.lock=true; u.turn='x'; render(); const H=hi(); if(who==='p'){ H.unoW++; K.xp(5); } else H.unoL++; K.save();
 const g=$('.gend',uov); $('h2',g).textContent=who==='p'?'🏆 Du hast gewonnen!':'🐾 Giß-Moe gewinnt!'; $('p',g).textContent='Du: '+H.unoW+' Siege · Moe: '+H.unoL+' Siege'; g.classList.add('show');
 if(who==='p'){ K.V.chime(); K.V.clap&&K.V.clap(); moePose('happy'); await sayW(UL.win[0]); } else { moePose('cheeky'); await sayW(UL.lose[0]); } }
G.endUno=function(){ uno=null; document.body.classList.remove('unoing'); uov.classList.remove('show'); $('.cpk',uov).classList.remove('show'); leaveGame(); };
G._uno=()=>uno; G._mole=()=>mole;
G.lines=()=>{ const L=['Au ja! Was wollen wir spielen?']; [ML,UL].forEach(o=>Object.values(o).forEach(v=>Array.isArray(v)?L.push(...v):L.push(...Object.values(v)))); return L; };
G.tick=function(){};
G.init=function(k){ K=k; const st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st); buildMenu(); buildMole(); buildUno(); };
window.GissGames=G;
})();
