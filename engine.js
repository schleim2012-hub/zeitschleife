// ZEITSCHLEIFE V2 – Virtual-Cinema-Engine. Alles wird auf ein 1600x900-Canvas gezeichnet:
// Desktop zeigt das Canvas direkt, VR zeigt es als Textur auf einer Leinwand.
(()=>{
const W=1600,H=900,cv=document.getElementById('cv'),x=cv.getContext('2d');
const F='Rajdhani, "Noto Color Emoji", sans-serif';
const DEBUG=/[?&]debug=1/.test(location.search);
let G,S,MU,img={},cur=null,mode='load',ptr={x:W/2,y:H/2,on:false},ui=[],toasts=[],trans=null,clipV=null,clipSkip=null,waitClick=null;
let msg=null,dlg=null,ending=null,wm={open:false,tab:'inv',hover:-1},idle=0,hintShown=false,last=performance.now(),voiceMap={},vrMode=false,debugInfo='';
const $=id=>document.getElementById(id);

// ---------- Helfer
function rr(X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();}
function glass(X,Y,w,h,r,acc){ x.save(); rr(X,Y,w,h,r); const g=x.createLinearGradient(X,Y,X,Y+h); g.addColorStop(0,'rgba(30,26,48,0.82)'); g.addColorStop(1,'rgba(10,8,20,0.9)'); x.fillStyle=g; x.fill();
 x.clip(); const hl=x.createRadialGradient(X+w*0.2,Y,0,X+w*0.2,Y,w*0.7); hl.addColorStop(0,'rgba(255,255,255,0.09)'); hl.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=hl; x.fillRect(X,Y,w,h); x.restore();
 rr(X+0.5,Y+0.5,w-1,h-1,r); const b=x.createLinearGradient(X,Y,X+w,Y+h); b.addColorStop(0,acc||'rgba(255,120,210,0.85)'); b.addColorStop(0.5,'rgba(255,255,255,0.15)'); b.addColorStop(1,'rgba(110,230,255,0.75)'); x.lineWidth=1.5; x.strokeStyle=b; x.stroke(); }
function wrap(t,mw){const out=[];let l='';(t||'').split(' ').forEach(w=>{const s=l?l+' '+w:w; if(l&&x.measureText(s).width>mw){out.push(l);l=w;}else l=s;}); out.push(l); return out;}
function text(t,X,Y,o={}){ x.font=`${o.w||500} ${o.s||26}px ${F}`; x.fillStyle=o.c||'#f2efff'; x.textAlign=o.a||'left'; x.textBaseline=o.b||'alphabetic'; x.letterSpacing=(o.ls||0)+'px'; x.fillText(t,X,Y); x.letterSpacing='0px'; }
function inR(p,r){return p.x>=r[0]&&p.y>=r[1]&&p.x<=r[0]+r[2]&&p.y<=r[1]+r[3];}
function button(r,label,fn,o={}){ const hv=ptr.on&&inR(ptr,r); ui.push({r,fn,cursor:'ui'});
 rr(r[0],r[1],r[2],r[3],o.rad||r[3]/2); const g=x.createLinearGradient(r[0],0,r[0]+r[2],0);
 if(hv||o.active){g.addColorStop(0,'rgba(255,90,190,0.92)');g.addColorStop(1,'rgba(120,90,255,0.92)');} else {g.addColorStop(0,'rgba(30,26,46,0.88)');g.addColorStop(1,'rgba(18,16,32,0.88)');}
 x.fillStyle=g; x.fill(); x.lineWidth=1.5; x.strokeStyle=hv?'#fff':'rgba(255,150,220,0.55)'; x.stroke();
 text(label,r[0]+r[2]/2,r[1]+r[3]/2+1,{s:o.s||22,w:700,a:'center',b:'middle',ls:o.ls??2}); return hv; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function hash(t){let h=2166136261;for(const c of (t||'').toLowerCase().replace(/[^a-zäöüß0-9]/g,'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}

// ---------- Zustand und Bedingungen
const SETDEF={music:0.7,voice:1,sfx:0.85,subs:true,speed:1,hints:true};
let SET=Object.assign({},SETDEF); try{ Object.assign(SET,JSON.parse(localStorage.zs2_settings||'{}')); }catch(e){}
function saveSet(){ localStorage.zs2_settings=JSON.stringify(SET); }
const SPEEDS=[['LANGSAM',28],['NORMAL',60],['SCHNELL',140],['SOFORT',0]];
function fresh(){ return {node:G.config.start,inv:[],flags:{},v:{affection:0,trust:0,chaos:0},anchors:[],notes:[],time:G.config.timeLimit,sel:null,visited:{hub:1}}; }
function saveGame(silent){ if(!S||ending) return; try{ localStorage.zs2_save=JSON.stringify({S:{...S,sel:null},ts:Date.now()}); if(!silent) toast('💾 Spiel gespeichert'); }catch(e){ toast('Speichern fehlgeschlagen'); } }
function hasSave(){ return !!localStorage.zs2_save; }
async function loadGame(){ let d; try{ d=JSON.parse(localStorage.zs2_save); }catch(e){} if(!d) return toast('Kein Spielstand vorhanden');
 S=Object.assign(fresh(),d.S); msg=null; dlg=null; ending=null; wm.open=false; pauseOpen=false; started=true; clipV=null;
 const im=still(S.node); await imgReady(im); mode='play'; flash=1; music(); preloadNeighbours(S.node); toast('📂 Spielstand geladen'); }
function ctx(){ return {has:new Proxy({},{get:(_,k)=>S.inv.includes(k)}),flag:new Proxy({},{get:(_,k)=>!!S.flags[k]}),anchors:S.anchors.length,...S.v}; }
function cond(c){ if(c===undefined||c===null||c==='1'||c===true) return true; try{ const k=ctx(); return !!Function(...Object.keys(k),'return ('+c+')')(...Object.values(k)); }catch(e){ console.warn('cond',c,e); return false; } }
function progress(){ idle=0; hintShown=false; }
function toast(t,ms=2600){ toasts.push({t,until:performance.now()+ms}); }

// ---------- Aktionen
async function run(list){ for(const a of list||[]){ if(mode==='ending') return; await act(a); } }
async function act(a){
 if(a.say!==undefined) return say(a.say,a.speaker);
 if(a.if!==undefined) return run(cond(a.if)?a.then:a.else);
 if(a.give){ if(!S.inv.includes(a.give)){S.inv.push(a.give); sfx('item'); toast('+ '+G.items[a.give].name);} progress(); return; }
 if(a.take){ S.inv=S.inv.filter(i=>i!==a.take); if(S.sel===a.take) S.sel=null; return; }
 if(a.set){ S.flags[a.set]=true; progress(); return; }
 if(a.add){ for(const k in a.add) S.v[k]=(S.v[k]||0)+a.add[k]; return; }
 if(a.anchor){ if(!S.anchors.includes(a.anchor)) S.anchors.push(a.anchor); toast(`⚓ Anker ${S.anchors.length}/3`,3500); progress(); return; }
 if(a.note){ S.notes.push(a.note); toast('✎ Neue Notiz im Zeit-Walkman'); return; }
 if(a.time){ S.time+=a.time; toast(`⏱ +${a.time/60} Minuten`); return; }
 if(a.clip) return playClip(a.clip);
 if(a.go) return go(a.go,a.dir||'forward');
 if(a.epoch) return epochJump(a.epoch);
 if(a.talk) return talk(a.talk);
 if(a.ending) return end(a.ending);
}
function say(t,speaker){ return new Promise(res=>{ msg={t,speaker:speaker||'narrator',res,t0:performance.now()}; mode='msg'; voice(t); }); }
function typed(m){ const cps=SPEEDS[SET.speed][1]; if(!cps) return m.t.length; return Math.min(m.t.length,Math.floor((performance.now()-m.t0)/1000*cps)); }
function closeMsg(){ const r=msg&&msg.res; msg=null; stopVoice(); mode='play'; r&&r(); }

// ---------- Dialog mit Haltungen
async function talk(id){ const d=G.dialogs[id]; let key='start';
 while(key){ const n=d[key]; const opt=await new Promise(res=>{ dlg={n,res,reply:null,t0:performance.now(),t:n.text}; mode='dlg'; voice(n.text); });
  stopVoice(); let good=true;
  if(opt.tone){ const a=S.v.affection, annoyed=a<0;
   if(opt.tone==='charm'){ good=!annoyed; S.v.affection+=good?1:0; }
   if(opt.tone==='cheeky'){ good=a>=1; S.v.affection+=good?2:-1; }
   if(opt.tone==='serious'){ good=true; S.v.trust+=1; } }
  if(opt.do) await run(opt.do); if(mode==='ending') return;
  const rep=good?opt.good:opt.bad; if(rep) await say(rep,'mara');
  key=opt.next||null; if(key==='end'&&!d.end) key=null; }
 dlg=null; mode='play'; }

// ---------- Navigation mit Bewegungsunschärfe
function still(id){ if(img[id]) return img[id]; const i=new Image(); i.src=`${G.config.stillDir}/${id}.jpg`; i.onerror=()=>{ i.onerror=null; i.src=`${G.config.placeholderDir}/${id}.jpg`; }; img[id]=i; return i; }
function imgReady(im){ return im.complete&&im.naturalWidth?Promise.resolve():new Promise(r=>{ im.addEventListener('load',r,{once:true}); im.addEventListener('error',r,{once:true}); setTimeout(r,4000); }); }
function preloadNeighbours(id){ (G.nodes[id].hotspots||[]).forEach(h=>(h.on||[]).forEach(a=>{ if(a.go) still(a.go); if(a.epoch) still(a.epoch); })); }
async function go(id,dir){ if(!G.nodes[id]) return toast('Knoten fehlt: '+id); const from=S.node; const nimg=still(id); mode='trans';
 await imgReady(nimg); await imgReady(still(from));
 trans={from:still(from),to:nimg,dir,t0:performance.now(),dur:380}; mode='trans'; await sleep(400); trans=null;
 S.node=id; mode='play'; music(); preloadNeighbours(id); saveGame(true); await enter(); }
async function enter(){ const n=G.nodes[S.node]; S.visited[n.epoch]=1; if(n.enter) await run(n.enter); }

// ---------- Epochenwechsel: Vortex (360 in VR, flach am Desktop)
async function epochJump(id){ if(!G.nodes[id]) return toast('Knoten fehlt: '+id); const v=$('vortexvid'), vs=$('vsphere'); mode='vortex'; S.sel=null;
 const target=still(id); sfx('whoosh');
 let ok=true; try{ v.muted=true; v.currentTime=0; await v.play(); }catch(e){ ok=false; }
 if(ok){ if(vrMode){ vs.setAttribute('visible',true); $('screen').setAttribute('visible',false); } clipV=v; clipV.label='vortex'; await new Promise(r=>{ v.onended=r; setTimeout(r,6500); }); v.pause(); clipV=null; vs.setAttribute('visible',false); $('screen').setAttribute('visible',true); }
 await imgReady(target); S.node=id; flash=1; mode='play'; music(); preloadNeighbours(id); saveGame(true); await enter(); }
let flash=0;

// ---------- Story-Clips
async function playClip(name){ const v=document.createElement('video'); v.src=`${G.config.clipDir}/${name}.mp4?v=${VER}`; v.playsInline=true; v.preload='auto'; v.volume=Math.min(1,SET.sfx); stopVoice();
 const pm=mode; mode='clip'; duck(true); let skipped=false; const done=new Promise(r=>{ clipSkip=()=>{skipped=true;r();}; v.onended=r; v.onerror=()=>{ v.failed=true; setTimeout(r,1600);} ; });
 v.play().catch(()=>{ v.failed=true; }); clipV=v; clipV.label=name; await done; v.pause(); v.removeAttribute('src'); v.load(); clipV=null; clipSkip=null; duck(false); mode=pm==='intro'?'intro':'play'; }

// ---------- Enden
async function end(id){ const e=G.endings[id]; ending={...e,id,pending:true}; msg=null; dlg=null; wm.open=false; music(); if(e.clip) await playClip(e.clip); ending.pending=false; mode='ending'; localStorage.removeItem('zs2_save'); stopVoice(); voice(e.text); }

// ---------- Musik und Stimme
const tracks={}; let curTrack=null, ducked=false, voiceA=null, started=false, audioOK=false;
function musicKey(){ if(mode==='title'||mode==='press') return 'title'; if(mode==='intro') return null;
 if(ending) return MU.endings[ending.id]||'ending_good'; if(!S) return null;
 if(S.time<MU.tensionBelowSeconds) return 'tension'; return G.nodes[S.node].epoch; }
function mvol(){ return MU.volume*SET.music*(ducked?0.4:1); }
function music(){ if(!audioOK||!MU) return; const k=musicKey(), src=k&&SET.music>0?MU.tracks[k]:null;
 if(curTrack&&curTrack.src0===src){ fade(curTrack,mvol(),400); return; } if(curTrack){ const o=curTrack; fade(o,0,MU.crossfadeMs,()=>o.pause()); }
 curTrack=null; if(!src) return; const a=tracks[src]||(tracks[src]=Object.assign(new Audio(src+'?v='+VER),{loop:true,volume:0,src0:src})); a.src0=src; curTrack=a;
 if(a.paused&&(k==='tension'||k.startsWith('ending'))) a.currentTime=0; a.play().then(()=>fade(a,mvol(),MU.crossfadeMs)).catch(()=>{}); }
function fade(a,to,ms,done){ clearInterval(a._f); const f=a.volume,t0=performance.now(); a._f=setInterval(()=>{const p=Math.min(1,(performance.now()-t0)/ms); a.volume=Math.max(0,Math.min(1,f+(to-f)*p)); if(p>=1){clearInterval(a._f); done&&done();}},40); }
function duck(on){ ducked=on; if(curTrack) fade(curTrack,mvol(),400); }
function applyVolumes(){ if(curTrack) fade(curTrack,mvol(),150); if(SET.music<=0||!curTrack) music(); if(voiceA) voiceA.volume=Math.min(1,SET.voice); if(clipV&&clipV.label!=='vortex') clipV.volume=Math.min(1,SET.sfx); }
let actx=null; function sfx(kind){ if(!audioOK||SET.sfx<=0) return; try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); const t=actx.currentTime, g=actx.createGain(); g.connect(actx.destination);
 if(kind==='click'){ const o=actx.createOscillator(); o.type='triangle'; o.frequency.setValueAtTime(880,t); o.frequency.exponentialRampToValueAtTime(440,t+0.06); g.gain.setValueAtTime(0.08*SET.sfx,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.08); o.connect(g); o.start(t); o.stop(t+0.09); }
 if(kind==='item'){ [660,990].forEach((f,i)=>{ const o=actx.createOscillator(); o.type='sine'; o.frequency.value=f; const gg=actx.createGain(); gg.gain.setValueAtTime(0.0001,t+i*0.09); gg.gain.exponentialRampToValueAtTime(0.12*SET.sfx,t+i*0.09+0.02); gg.gain.exponentialRampToValueAtTime(0.0001,t+i*0.09+0.35); o.connect(gg); gg.connect(actx.destination); o.start(t+i*0.09); o.stop(t+i*0.09+0.4); }); }
 if(kind==='whoosh'){ const n=actx.sampleRate*1.6, b=actx.createBuffer(1,n,actx.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; const s=actx.createBufferSource(); s.buffer=b; const f=actx.createBiquadFilter(); f.type='bandpass'; f.Q.value=1.2; f.frequency.setValueAtTime(200,t); f.frequency.exponentialRampToValueAtTime(3000,t+0.9); f.frequency.exponentialRampToValueAtTime(300,t+1.6); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.35*SET.sfx,t+0.5); g.gain.exponentialRampToValueAtTime(0.0001,t+1.6); s.connect(f); f.connect(g); s.start(t); }
 }catch(e){} }
function voice(t){ stopVoice(); if(SET.voice<=0) return; const f=voiceMap[hash(t)]; if(!f) return; const files=[].concat(f); let i=0;
 const nx=()=>{ if(i>=files.length){ voiceA=null; duck(false); return; } const a=new Audio('voice/'+files[i++]); a.volume=Math.min(1,SET.voice); voiceA=a; duck(true); a.onended=nx; a.onerror=nx; a.play().catch(()=>{voiceA=null;duck(false);}); }; nx(); }
function hasVoice(t){ return SET.voice>0&&!!voiceMap[hash(t)]; }
function stopVoice(){ if(voiceA){voiceA.onended=null; voiceA.pause(); voiceA=null; duck(false);} }

// ---------- Klick-Logik
function hotspots(){ return (G.nodes[S.node].hotspots||[]).filter(h=>cond(h.when)); }
function hsAt(p){ const hs=hotspots(); for(let i=hs.length-1;i>=0;i--){ const b=hs[i].box; if(inR(p,[b[0]*W,b[1]*H,b[2]*W,b[3]*H])) return hs[i]; } return null; }
async function clickHotspot(h){ progress(); if(S.sel){ const it=S.sel; S.sel=null; const w=h.with&&h.with[it];
  if(w) return run(w); const fl=G.config.failLines; if(fl&&fl.length) return run([fl[Math.floor(Math.random()*fl.length)]]); return say(`${G.items[it].name} mit ${h.label}? Nö.`); }
 return run(h.on); }
let dragUI=null;
function onClick(p){ unlockAudio();
 if(DEBUG) { debugInfo=`Klick: [${(p.x/W).toFixed(3)}, ${(p.y/H).toFixed(3)}]`; console.log(S&&S.node,debugInfo); }
 if(mode==='press'){ mode='title'; music(); return; }
 for(let i=ui.length-1;i>=0;i--) if(inR(p,ui[i].r)){ const u=ui[i]; if(u.drag){ dragUI=u; return u.drag(p); } sfx('click'); return u.fn(); }
 if(mode==='msg'){ if(typed(msg)<msg.t.length){ msg.t0=-1e9; return; } return closeMsg(); }
 if(mode==='dlg'&&dlg&&typedD()<dlg.t.length){ dlg.t0=-1e9; return; }
 if(mode==='clip') return;
 if(mode!=='play') return;
 const h=hsAt(p); if(h) clickHotspot(h); else if(S.sel){ S.sel=null; } }

// ---------- Zeichnen
function cover(im,sx=1,dx=0,dy=0,alpha=1,blur=0){ if(!im||!im.complete||!im.naturalWidth) return; const s=Math.max(W/im.naturalWidth,H/im.naturalHeight)*sx;
 const w=im.naturalWidth*s,h=im.naturalHeight*s; x.save(); x.globalAlpha=alpha; if(blur) x.filter=`blur(${blur}px)`; x.drawImage(im,(W-w)/2+dx,(H-h)/2+dy,w,h); x.restore(); }
function drawScene(now){
 if(trans){ const p=Math.min(1,(now-trans.t0)/trans.dur), e=p*p*(3-2*p), d=trans.dir;
  const bl=Math.sin(p*Math.PI)*14;
  if(d==='forward'){ cover(trans.from,1+e*0.5,0,0,1,bl); cover(trans.to,1.25-e*0.25,0,0,e,bl*(1-e)); }
  else if(d==='back'){ cover(trans.from,1-e*0.15,0,0,1,bl); cover(trans.to,1.3-e*0.3,0,0,e,bl*(1-e)); }
  else { const s=d==='left'?1:-1; cover(trans.from,1,s*e*W,0,1,bl); cover(trans.to,1,s*(e-1)*W,0,1,bl); }
  return; }
 if(clipV){ x.fillStyle='#000'; x.fillRect(0,0,W,H);
  if(clipV.readyState>=2&&!clipV.failed){ const s=Math.min(W/clipV.videoWidth,H/clipV.videoHeight); const w=clipV.videoWidth*s,h=clipV.videoHeight*s; x.drawImage(clipV,(W-w)/2,(H-h)/2,w,h); }
  else if(clipV.failed){ text('🎬 '+clipV.label,W/2,H/2,{s:40,w:700,a:'center',c:'rgba(255,255,255,0.6)'}); text('(Clip folgt)',W/2,H/2+44,{s:24,a:'center',c:'rgba(255,255,255,0.4)'}); }
  return; }
 cover(still(S.node));
 if(flash>0){ x.fillStyle=`rgba(255,255,255,${flash})`; x.fillRect(0,0,W,H); flash=Math.max(0,flash-0.025); }
}
function drawHotspots(now){ const hs=hotspots(), hover=mode==='play'?hsAt(ptr):null, pulse=(Math.sin(now/300)+1)/2;
 hs.forEach(h=>{ const b=h.box.map((v,i)=>v*(i%2?H:W));
  if(DEBUG){ x.strokeStyle='#0f0'; x.lineWidth=2; x.strokeRect(...b); text(h.id,b[0]+4,b[1]+18,{s:18,w:700,c:'#0f0'}); }
  if(hintShown&&SET.hints&&h.hint&&cond(h.hint)&&!['left','right','back'].includes(h.cursor)){ x.save(); x.strokeStyle=`rgba(255,210,122,${0.3+pulse*0.6})`; x.lineWidth=3; x.shadowColor='#ffd27a'; x.shadowBlur=20; rr(b[0],b[1],b[2],b[3],14); x.stroke(); x.restore(); }
 });
 return hover; }
function drawHUD(now,hover){
 // Countdown (LED)
 const t=Math.max(0,Math.ceil(S.time)), mm=String(Math.floor(t/60)).padStart(2,'0'), ss=String(t%60).padStart(2,'0'), warn=t<=60;
 glass(24,20,170,58,16,warn?'rgba(255,60,60,0.9)':undefined);
 text(`${mm}:${ss}`,109,51,{s:40,w:700,a:'center',b:'middle',c:warn&&(now%1000<500)?'#ff5a5a':'#ff8fd8',ls:3});
 // Anker
 for(let i=0;i<3;i++){ x.beginPath(); x.arc(220+i*26,49,8,0,7); x.fillStyle=i<S.anchors.length?'#ffd27a':'rgba(255,255,255,0.15)'; x.fill(); }
 // Zeit-Walkman-Knopf
 const r=[W-280,20,186,58]; button(r,'📼 ZEIT-WALKMAN',()=>openWM(!wm.open),{s:20,active:wm.open}); button([W-82,20,58,58],'❚❚',()=>openPause(true),{s:20,ls:0});
 // Auswahl
 if(S.sel){ glass(W/2-220,20,440,50,25,'rgba(255,210,122,0.8)'); text(`${G.items[S.sel].icon}  ${G.items[S.sel].name} benutzen mit …`,W/2,46,{s:24,w:600,a:'center',b:'middle'}); }
 // Hover-Label
 if(hover&&mode==='play'){ const l=S.sel?`${G.items[S.sel].name} → ${hover.label}`:hover.label; x.font=`600 26px ${F}`; const w=x.measureText(l).width+50;
  glass(W/2-w/2,H-78,w,46,23); text(l,W/2,H-55,{s:26,w:600,a:'center',b:'middle'}); }
 // Toasts
 toasts=toasts.filter(q=>q.until>now); toasts.forEach((q,i)=>{ x.font=`600 24px ${F}`; const w=x.measureText(q.t).width+44; const a=Math.min(1,(q.until-now)/400);
  x.save(); x.globalAlpha=a; glass(W/2-w/2,96+i*52,w,42,21,'rgba(255,210,122,0.8)'); text(q.t,W/2,117+i*52,{s:24,w:600,a:'center',b:'middle'}); x.restore(); });
 if(DEBUG){ glass(24,H-60,560,40,10); text(`DEBUG ${S.node} · ${debugInfo} · aff ${S.v.affection} trust ${S.v.trust} chaos ${S.v.chaos}`,40,H-34,{s:20,w:600,c:'#0f0'}); }
}
function typedD(){ const cps=SPEEDS[SET.speed][1]; return cps?Math.min(dlg.t.length,Math.floor((performance.now()-dlg.t0)/1000*cps)):dlg.t.length; }
function unlockAudio(){ audioOK=true; try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); if(actx.state!=='running') actx.resume().catch(()=>{}); }catch(e){}
 if(!curTrack) music(); const a=curTrack; if(a&&a.paused) a.play().then(()=>fade(a,mvol(),600)).catch(()=>{}); else if(a&&a.volume<mvol()*0.5&&!a._f) fade(a,mvol(),400); }
function audioPlaying(){ return SET.music<=0||!MU||!musicKey()||(curTrack&&!curTrack.paused); }
// Android/Chrome: touch-pointerdown ist KEINE User-Activation -> auf pointerup/touchend/click/keydown entsperren, bis Musik wirklich läuft
['pointerup','touchend','click','keydown','mousedown'].forEach(ev=>addEventListener(ev,()=>{ if(!audioPlaying()||!audioOK) unlockAudio(); },{capture:true,passive:true}));
function speakerName(s){ return s==='mara'?'MARA':s==='narrator'?'ERZÄHLER':''; }
function typeLines(t,n,mw,s){ x.font=`500 ${s}px ${F}`; const ls=wrap(t,mw); let left=n; return ls.map(l=>{ const k=Math.max(0,Math.min(l.length,left)); left-=l.length+1; return l.slice(0,k); }); }
function drawMsg(){ const col=msg.speaker==='mara'?'#ff8fd8':'#8fe9ff';
 if(!SET.subs&&hasVoice(msg.t)){ const w=420,X=W/2-w/2,Y=H-120; glass(X,Y,w,64,32); text(speakerName(msg.speaker)+'  🔊',X+34,Y+40,{s:22,w:700,c:col,ls:5}); text('▶ weiter',X+w-34,Y+40,{s:18,w:600,a:'right',c:'rgba(255,255,255,0.5)',ls:2}); return; }
 const X=160,Y=H-250,w=W-320,h=200; glass(X,Y,w,h,24);
 text(speakerName(msg.speaker),X+40,Y+44,{s:22,w:700,c:col,ls:6});
 let s=30; x.font=`500 ${s}px ${F}`; while(wrap(msg.t,w-80).length>4&&s>22){ s-=2; x.font=`500 ${s}px ${F}`; }
 const n=typed(msg); typeLines(msg.t,n,w-80,s).forEach((l,i)=>text(l,X+40,Y+88+i*s*1.25,{s}));
 if(n>=msg.t.length) text('▶ weiter',X+w-40,Y+h-22,{s:18,w:600,a:'right',c:'rgba(255,255,255,0.45)',ls:2}); }
function drawDlg(){ const n=dlg.n,X=160,Y=H-330,w=W-320,h=190; glass(X,Y,w,h,24);
 text(speakerName(n.speaker),X+40,Y+44,{s:22,w:700,c:'#ff8fd8',ls:6});
 typeLines(n.text,typedD(),w-80,29).slice(0,4).forEach((l,i)=>text(l,X+40,Y+86+i*36,{s:29}));
 if(typedD()<n.text.length) return; const opts=n.options.filter(o=>cond(o.cond)); const bw=Math.min(300,(w-(opts.length-1)*16)/opts.length); const tw=opts.length*bw+(opts.length-1)*16;
 opts.forEach((o,i)=>button([W/2-tw/2+i*(bw+16),Y+h+20,bw,56],o.label,()=>{ const r=dlg.res; r(o); },{s:o.tone?26:22,ls:o.tone?1:2})); }
const TABS=[['inv','INVENTAR'],['map','KARTE'],['notes','NOTIZEN'],['opt','OPTIONEN']];
function openWM(v){ wm.open=v; wm.hover=-1; if(v){ prevMode=mode==='wm'?prevMode:mode; mode='wm'; } else mode=prevMode||'play'; }
let prevMode='play';
function drawWM(now){ x.fillStyle='rgba(5,3,10,0.55)'; x.fillRect(0,0,W,H);
 const X=260,Y=110,w=W-520,h=680; glass(X,Y,w,h,30,'rgba(120,220,255,0.9)');
 // Kassetten-Look oben
 x.save(); rr(X+30,Y+26,w-60,90,18); x.fillStyle='rgba(0,0,0,0.45)'; x.fill(); x.restore();
 text('ZEIT-WALKMAN',X+60,Y+82,{s:34,w:700,c:'#8fe9ff',ls:8});
 const t=Math.max(0,Math.ceil(S.time)); text(`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`,X+w-60,Y+84,{s:48,w:700,a:'right',c:'#ff8fd8',ls:4});
 [0,1].forEach(i=>{ const cx=X+w/2-60+i*120, cy=Y+71; x.save(); x.translate(cx,cy); x.rotate(now/400*(i?1:1)); x.strokeStyle='rgba(255,255,255,0.5)'; x.lineWidth=3; x.beginPath(); x.arc(0,0,22,0,7); x.stroke();
  for(let k=0;k<6;k++){ x.rotate(Math.PI/3); x.beginPath(); x.moveTo(8,0); x.lineTo(20,0); x.stroke(); } x.restore(); });
 TABS.forEach(([k,l],i)=>button([X+40+i*200,Y+140,184,48],l,()=>{wm.tab=k;},{s:20,active:wm.tab===k}));
 button([X+w-110,Y+140,70,48],'✕',()=>openWM(false),{s:24});
 const cx=X+40,cy=Y+220,cw=w-80;
 if(wm.tab==='inv'){ const N=10,s=104,g=14; wm.hover=-1;
  for(let i=0;i<N;i++){ const r=[cx+i*(s+g),cy,s,s], it=S.inv[i], hv=ptr.on&&inR(ptr,r)&&it; if(hv) wm.hover=i;
   rr(...r,12); const gr=x.createLinearGradient(0,r[1],0,r[1]+s); gr.addColorStop(0,'rgba(0,0,0,0.55)'); gr.addColorStop(1,'rgba(40,36,60,0.55)'); x.fillStyle=gr; x.fill();
   x.lineWidth=hv||S.sel===it&&it?3:1.5; x.strokeStyle=hv?'#ffd27a':it?(G.items[it].anchor?'rgba(255,210,122,0.9)':'rgba(180,170,220,0.6)'):'rgba(255,255,255,0.15)'; x.stroke();
   if(it){ text(G.items[it].icon,r[0]+s/2,r[1]+s/2+4,{s:54,a:'center',b:'middle'}); if(G.items[it].anchor) text('⚓',r[0]+s-16,r[1]+22,{s:18,a:'center'});
    ui.push({r,fn:()=>{ if(S.sel&&S.sel!==it){ const c=G.combos[S.sel+'+'+it]||G.combos[it+'+'+S.sel]; S.sel=null; if(c){ openWM(false); run(c); } else { const cf=G.config.comboFail; if(cf&&cf.length){ openWM(false); run([cf[Math.floor(Math.random()*cf.length)]]); } else toast('Lässt sich nicht kombinieren.'); } } else { S.sel=it; openWM(false); toast(G.items[it].name+' ausgewählt'); } }}); } }
  const k=S.inv[wm.hover]; x.fillStyle='rgba(255,255,255,0.1)'; x.fillRect(cx,cy+130,cw,1.5);
  if(k){ const it=G.items[k]; text(it.name,cx,cy+190,{s:42,w:700,c:it.anchor?'#ffd27a':'#e8e4ff'}); text(it.anchor?'ZEIT-ANKER':'GEGENSTAND',cx,cy+226,{s:20,w:700,c:'#ff8fd8',ls:5});
   x.font=`500 28px ${F}`; wrap(it.desc,cw).forEach((l,i)=>text(l,cx,cy+272+i*34,{s:28,c:'#d8d4ee'})); }
  else text(S.inv.length?'Zeige auf einen Gegenstand. Klick = auswählen und auf etwas benutzen. Ausgewählt + anderer Gegenstand = kombinieren.':'Noch leer. Die Zeit wartet nicht.',cx,cy+190,{s:24,c:'rgba(255,255,255,0.5)'});
 }
 if(wm.tab==='map'){ const eps=['hub','1972','1984','1989','2041'];
  eps.forEach((e,i)=>{ const r=[cx+i*(cw/5)+8,cy+30,cw/5-16,200], vis=S.visited[e];
   glass(...r,18,vis?'rgba(255,210,122,0.8)':'rgba(255,255,255,0.2)');
   text(e==='hub'?'⌂':e,r[0]+r[2]/2,r[1]+80,{s:48,w:700,a:'center',c:vis?'#ffd27a':'rgba(255,255,255,0.25)'});
   text(G.config.epochs[e],r[0]+r[2]/2,r[1]+130,{s:22,w:600,a:'center',c:vis?'#fff':'rgba(255,255,255,0.3)'});
   if(vis&&G.nodes[S.node].epoch!==e) ui.push({r,fn:()=>{ openWM(false); epochJump(G.config.epochEntry[e]); }});
   if(G.nodes[S.node].epoch===e) text('◉ HIER',r[0]+r[2]/2,r[1]+175,{s:18,w:700,a:'center',c:'#ff8fd8',ls:3}); });
  text('Besuchte Epochen lassen sich direkt anspringen (Seite A/B der Kassette).',cx,cy+300,{s:22,c:'rgba(255,255,255,0.5)'});
  text(`Anker: ${S.anchors.length}/3   ·   ${S.anchors.map(a=>G.items[a].name).join(' · ')||'—'}`,cx,cy+350,{s:26,w:600,c:'#ffd27a'}); }
 if(wm.tab==='notes'){ const ns=S.notes.slice(-9); if(!ns.length) text('Noch keine Notizen.',cx,cy+40,{s:24,c:'rgba(255,255,255,0.5)'});
  ns.forEach((n,i)=>text('✎ '+n,cx,cy+40+i*44,{s:26,c:'#e8e4ff'}));
  button([cx+cw-300,cy+380,300,52],'💭 BAUCHGEFÜHL JETZT',()=>{ openWM(false); hintNow(); },{s:20}); }
 if(wm.tab==='opt') drawOptions(cx,cy-10,cw);
}
// ---------- Optionen (geteilt von Pause-Menü, Titel und Zeit-Walkman)
function slider(X,Y,w,label,k){ text(label,X,Y+30,{s:28,w:600}); const tx=X+300,tw=w-300-90; const v=SET[k];
 rr(tx,Y+16,tw,12,6); x.fillStyle='rgba(255,255,255,0.12)'; x.fill();
 rr(tx,Y+16,Math.max(12,tw*v),12,6); const g=x.createLinearGradient(tx,0,tx+tw,0); g.addColorStop(0,'#ff5abe'); g.addColorStop(1,'#78e6ff'); x.fillStyle=g; x.fill();
 x.save(); x.beginPath(); x.arc(tx+tw*v,Y+22,15,0,7); x.fillStyle='#fff'; x.shadowColor='#ff8fd8'; x.shadowBlur=14; x.fill(); x.restore();
 text(Math.round(v*100)+' %',X+w,Y+30,{s:24,w:700,a:'right',c:'#8fe9ff'});
 ui.push({r:[tx-16,Y-6,tw+32,56],cursor:'ui',drag:p=>{ SET[k]=Math.round(Math.max(0,Math.min(1,(p.x-tx)/tw))*20)/20; saveSet(); applyVolumes(); }}); }
function toggle(X,Y,w,label,on,fn){ text(label,X,Y+30,{s:28,w:600}); button([X+w-170,Y,170,46],on?'AN':'AUS',fn,{s:22,active:on}); }
function drawOptions(X,Y,w){ slider(X,Y,w,'Musik','music'); slider(X,Y+62,w,'Stimmen','voice'); slider(X,Y+124,w,'Effekte','sfx');
 toggle(X,Y+190,w,'Untertitel',SET.subs,()=>{ SET.subs=!SET.subs; saveSet(); });
 text('Textgeschwindigkeit',X,Y+282,{s:28,w:600}); const bw=102; SPEEDS.forEach(([l],i)=>button([X+w-4*bw-3*6+i*(bw+6),Y+252,bw,46],l,()=>{ SET.speed=i; saveSet(); },{s:17,ls:1,active:SET.speed===i}));
 toggle(X,Y+314,w,'Bauchgefühl (Hinweise)',SET.hints,()=>{ SET.hints=!SET.hints; saveSet(); });
 toggle(X,Y+376,w,'Vollbild',!!document.fullscreenElement,()=>{ if(document.fullscreenElement) document.exitFullscreen(); else if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>toast('Vollbild nicht möglich')); }); }
// ---------- Pause-Menü
let pauseOpen=false,pauseTab='main',pausePrev='play';
function openPause(v){ if(v&&['title','press','intro','clip','vortex','trans','load','ending','pause'].includes(mode)) return; if(v){ if(wm.open) openWM(false); pausePrev=mode; mode='pause'; pauseOpen=true; pauseTab='main'; } else if(pauseOpen){ pauseOpen=false; mode=pausePrev||'play'; } }
function drawPause(){ x.fillStyle='rgba(5,3,12,0.62)'; x.fillRect(0,0,W,H);
 const opt=pauseTab==='opt', w=opt?820:520,h=opt?640:560,X=W/2-w/2,Y=H/2-h/2; glass(X,Y,w,h,30,'rgba(120,220,255,0.9)');
 text(opt?'OPTIONEN':'PAUSE',X+44,Y+66,{s:40,w:700,c:'#8fe9ff',ls:10});
 button([X+w-84,Y+26,56,48],'✕',()=>openPause(false),{s:22});
 if(opt){ drawOptions(X+44,Y+110,w-88); button([X+44,Y+h-66,200,46],'← ZURÜCK',()=>{pauseTab='main';},{s:20}); return; }
 const items=[['▶  WEITERSPIELEN',()=>openPause(false)],['⚙  OPTIONEN',()=>{pauseTab='opt';}],['💾  SPEICHERN',()=>saveGame()],['📂  LADEN',()=>{ if(hasSave()){ pauseOpen=false; loadGame(); } else toast('Kein Spielstand vorhanden'); }],['⌂  HAUPTMENÜ',()=>{ saveGame(true); toTitle(); }]];
 items.forEach(([l,fn],i)=>button([X+44,Y+106+i*80,w-88,60],l,fn,{s:24,rad:18}));
 text('COUNTDOWN PAUSIERT  ·  QUEST: A/X = MENÜ  ·  B/Y = WALKMAN',X+w/2,Y+h-24,{s:14,w:700,a:'center',c:'rgba(255,255,255,0.4)',ls:4}); }
// ---------- Titelbildschirm
let titleV=null, titleOpt=false;
function drawTitle(now){ if(titleV&&titleV.readyState>=2&&!titleV.paused) coverV(titleV); else cover(titleImg);
 const g=x.createLinearGradient(0,H*0.45,0,H); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,0.6)'); x.fillStyle=g; x.fillRect(0,0,W,H);
 if(mode==='press'){ const a=0.55+0.45*Math.sin(now/380); x.save(); x.globalAlpha=a; text('▶  KLICKEN ZUM STARTEN',W*0.3,H*0.78,{s:32,w:700,a:'center',c:'#fff',ls:8}); x.restore(); return; }
 if(titleOpt){ const w=820,h=580,X=W/2-w/2,Y=H/2-h/2; x.fillStyle='rgba(5,3,12,0.5)'; x.fillRect(0,0,W,H); glass(X,Y,w,h,30,'rgba(120,220,255,0.9)');
  text('OPTIONEN',X+44,Y+66,{s:40,w:700,c:'#8fe9ff',ls:10}); button([X+w-84,Y+26,56,48],'✕',()=>{titleOpt=false;},{s:22}); drawOptions(X+44,Y+110,w-88); return; }
 const X=130,Y=H*0.645,bw=360; const can=hasSave();
 glass(X-22,Y-22,bw+44,3*68+30,26);
 button([X,Y,bw,54],'NEUES SPIEL',()=>newGame(),{s:23,rad:14});
 button([X,Y+68,bw,54],'FORTSETZEN',()=>{ if(can) continueGame(); else toast('Noch kein Spielstand vorhanden'); },{s:23,rad:14});
 if(!can){ rr(X,Y+68,bw,54,14); x.fillStyle='rgba(8,6,16,0.55)'; x.fill(); }
 button([X,Y+136,bw,54],'OPTIONEN',()=>{titleOpt=true;},{s:23,rad:14});
 }
function coverV(v){ const s=Math.max(W/v.videoWidth,H/v.videoHeight), w=v.videoWidth*s,h=v.videoHeight*s; x.drawImage(v,(W-w)/2,(H-h)/2,w,h); }
function toTitle(){ pauseOpen=false; wm.open=false; msg=null; dlg=null; ending=null; stopVoice(); clipV=null; S=null; mode='title'; titleOpt=false; titleV&&titleV.play().catch(()=>{}); music(); }
async function newGame(){ localStorage.removeItem('zs2_save'); S=fresh(); ending=null; started=true; titleV&&titleV.pause(); mode='intro'; music();
 if(!/[?&]nointro=1/.test(location.search)) await playClip('intro_komplett');
 await imgReady(still(S.node)); flash=1; mode='play'; music(); preloadNeighbours(S.node); enter(); }
async function continueGame(){ titleV&&titleV.pause(); await loadGame(); }

function hintNow(){ hintShown=true; const n=G.nodes[S.node]; if(n.hint) toast('💭 '+n.hint,6000); }
function drawEnding(){ x.fillStyle='rgba(0,0,0,0.82)'; x.fillRect(0,0,W,H);
 text(ending.title,W/2,300,{s:72,w:700,a:'center',c:'#ff8fd8',ls:6});
 x.font=`500 32px ${F}`; wrap(ending.text,1000).forEach((l,i)=>text(l,W/2,390+i*42,{s:32,a:'center'}));
 text(`Zuneigung ${S.v.affection} · Vertrauen ${S.v.trust} · Chaos ${S.v.chaos} · Anker ${S.anchors.length}/3`,W/2,600,{s:22,a:'center',c:'rgba(255,255,255,0.5)',ls:2});
 button([W/2-320,660,300,60],'⟲ NOCHMAL',()=>{ ending=null; newGame(); },{s:24}); button([W/2+20,660,300,60],'⌂ HAUPTMENÜ',()=>toTitle(),{s:24}); }
function drawCursor(hover){ if(!ptr.on) return; const {x:px,y:py}=ptr; x.save(); x.translate(px,py);
 const overUI=ui.some(u=>inR(ptr,u.r)); let kind=overUI?'ui':(mode==='play'&&hover)?hover.cursor:'dot'; if(S&&S.sel&&mode==='play') kind='item';
 x.shadowColor='rgba(0,0,0,0.8)'; x.shadowBlur=6; x.strokeStyle='#fff'; x.fillStyle='#fff'; x.lineWidth=3; x.lineCap='round'; x.lineJoin='round';
 const arrow=(rot)=>{ x.rotate(rot); x.beginPath(); x.moveTo(0,-22); x.lineTo(16,0); x.lineTo(6,0); x.lineTo(6,18); x.lineTo(-6,18); x.lineTo(-6,0); x.lineTo(-16,0); x.closePath(); x.fillStyle='rgba(255,143,216,0.95)'; x.fill(); x.stroke(); };
 if(kind==='forward') arrow(0); else if(kind==='back') arrow(Math.PI); else if(kind==='left') arrow(-Math.PI/2); else if(kind==='right') arrow(Math.PI/2);
 else if(kind==='look'){ x.beginPath(); x.arc(-4,-4,13,0,7); x.stroke(); x.beginPath(); x.moveTo(6,6); x.lineTo(18,18); x.stroke(); }
 else if(kind==='take'||kind==='use'){ text(kind==='take'?'✋':'⚙',0,0,{s:36,a:'center',b:'middle'}); }
 else if(kind==='talk'){ x.beginPath(); rr(-18,-16,36,26,10); x.fillStyle='rgba(143,233,255,0.95)'; x.fill(); x.stroke(); x.beginPath(); x.moveTo(-6,10); x.lineTo(-12,20); x.lineTo(2,10); x.fill(); }
 else if(kind==='item'){ text(G.items[S.sel].icon,0,0,{s:40,a:'center',b:'middle'}); if(hover){ x.beginPath(); x.arc(0,0,26,0,7); x.strokeStyle='#ffd27a'; x.stroke(); } }
 else if(kind==='ui'){ x.beginPath(); x.arc(0,0,7,0,7); x.fillStyle='#ff8fd8'; x.fill(); x.stroke(); }
 else { x.beginPath(); x.arc(0,0,5,0,7); x.fill(); }
 x.restore(); }
function drawClipSubs(){ const subs=(G.config.clipSubs||{})[clipV.label]; if(!subs||!SET.subs) return; const t=clipV.currentTime;
 const cur=subs.find(q=>t>=q[0]&&t<=q[1]); if(!cur) return; const l=(cur[2]?speakerName(cur[2])+':  ':'')+cur[3]; x.font=`600 30px ${F}`; const w=x.measureText(l).width+60;
 glass(W/2-w/2,H-130,w,56,28); text(l,W/2,H-101,{s:30,w:600,a:'center',b:'middle',c:cur[2]==='mara'?'#ffd0ee':'#fff'}); }
function frame(now){ const dt=Math.min(0.1,(now-last)/1000); last=now; ui=[];
 if(G){ x.clearRect(0,0,W,H); let hover=null;
  if(mode==='title'||mode==='press'){ drawTitle(now); if(mode==='title'&&!audioPlaying()) text('🔇 Tippen für Ton',W-30,40,{s:22,w:600,a:'right',c:'#ffd27a'}); }
  else if(S){
   if(['play','msg','dlg','trans'].includes(mode)&&started&&!ending){ const before=S.time; S.time-=dt; idle+=dt;
    if(before>300&&S.time<=300) toast('⏱ Noch 5 Minuten! Die Röhren flackern.',4000);
    if(before>MU.tensionBelowSeconds&&S.time<=MU.tensionBelowSeconds) music();
    if(before>60&&S.time<=60) toast('⏱ Noch 1 Minute!',4000);
    if(S.time<=0){ S.time=0; msg=null; dlg=null; stopVoice(); end('frozen'); } }
   if(SET.hints&&idle>90&&!hintShown&&mode==='play') hintNow();
   drawScene(now);
   if(!clipV&&!trans&&mode!=='intro'&&mode!=='vortex'){ hover=drawHotspots(now); if(mode!=='ending') drawHUD(now,hover); if(mode==='msg'&&msg) drawMsg(); if(mode==='dlg'&&dlg) drawDlg(); if(mode==='wm') drawWM(now); if(mode==='ending'&&ending) drawEnding(); if(mode==='pause') drawPause(); }
   else if(clipV&&(mode==='clip')){ drawClipSubs(); button([W-230,24,200,48],'ÜBERSPRINGEN ▶',()=>clipSkip&&clipSkip(),{s:18}); }
  }
  toasts=toasts.filter(q=>q.until>now); if(mode==='title'||mode==='pause'||mode==='ending') toasts.forEach((q,i)=>{ x.font=`600 24px ${F}`; const w=x.measureText(q.t).width+44; glass(W/2-w/2,40+i*52,w,42,21,'rgba(255,210,122,0.8)'); text(q.t,W/2,61+i*52,{s:24,w:600,a:'center',b:'middle'}); });
  drawCursor(hover);
  if(vrMode&&screenTex) screenTex.needsUpdate=true; }
 requestAnimationFrame(frame); }

// ---------- Eingabe Desktop
function fit(){ const s=Math.min(innerWidth/W,innerHeight/H); cv.style.width=W*s+'px'; cv.style.height=H*s+'px'; cv.style.left=(innerWidth-W*s)/2+'px'; cv.style.top=(innerHeight-H*s)/2+'px'; }
addEventListener('resize',fit); fit();
const toCv=e=>{ const r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}; };
cv.addEventListener('pointermove',e=>{ Object.assign(ptr,toCv(e),{on:true}); if(dragUI&&e.buttons) dragUI.drag({...ptr}); });
cv.addEventListener('pointerleave',()=>{ ptr.on=false; dragUI=null; });
addEventListener('pointerup',()=>{ dragUI=null; });
cv.addEventListener('pointerdown',e=>{ Object.assign(ptr,toCv(e),{on:true}); onClick({...ptr}); });
cv.addEventListener('contextmenu',e=>{ e.preventDefault(); if(S) S.sel=null; });
addEventListener('keydown',e=>{ unlockAudio(); const k=e.key;
 if(mode==='press'){ mode='title'; music(); return; }
 if(k===' '&&clipSkip){ e.preventDefault(); return clipSkip(); }
 if(!S||mode==='title') return;
 if((k==='w'||k==='W'||k==='i'||k==='I')&&mode!=='pause') openWM(!wm.open);
 if(k==='Escape'||k==='p'||k==='P'){ if(S.sel){ S.sel=null; return; } if(wm.open){ openWM(false); return; } openPause(mode!=='pause'); } });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&S&&['play','msg','dlg'].includes(mode)) openPause(true); });

// ---------- VR: Leinwand + eigener XR-Laser (unabhängig vom Controller-Profil, auch Hand-Tracking-Pinch)
// Alle UI (Titel, Menüs, Hotspots, Inventar, Optionen, Dialogwahl) wird aufs Canvas gezeichnet und ist so auch in VR auf der Leinwand.
let screenTex=null, screenMesh=null;
const vrRC=new THREE.Raycaster(), vrM=new THREE.Matrix4(), vrPads={}, lasers={};
function vrHitFrom(origin,dir){ if(!screenMesh) return null; vrRC.set(origin,dir.normalize()); vrRC.far=30; screenMesh.updateMatrixWorld(); const h=vrRC.intersectObject(screenMesh,false)[0]; return h&&h.uv?h:null; }
function vrPoint(h,src){ ptr.x=h.uv.x*W; ptr.y=(1-h.uv.y)*H; ptr.on=true; ptr.src=src; }
function vrSelect(down){ unlockAudio(); resumeAudio(); if(down){ ptr.down=true; if(ptr.on) onClick({...ptr}); } else { ptr.down=false; dragUI=null; } }
function laser(key,col){ if(lasers[key]) return lasers[key]; const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]);
 const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:0.85,depthTest:false})); l.renderOrder=999; l.frustumCulled=false;
 const dot=new THREE.Mesh(new THREE.SphereGeometry(0.015,12,8),new THREE.MeshBasicMaterial({color:col,depthTest:false})); dot.renderOrder=1000;
 const sc=document.querySelector('a-scene').object3D; sc.add(l); sc.add(dot); return lasers[key]={l,dot}; }
AFRAME.registerComponent('zs-vr',{ tick(){ const sc=this.el, r=sc.renderer, xr=r&&r.xr;
 const env=vrMode&&(mode==='title'||mode==='press'); $('titlesky').object3D.visible=env;
 if(!vrMode||!xr||!xr.isPresenting) return; const fr=xr.getFrame&&xr.getFrame(), ref=xr.getReferenceSpace&&xr.getReferenceSpace(), ses=xr.getSession();
 Object.values(lasers).forEach(o=>{o.l.visible=false;o.dot.visible=false;}); if(!fr||!ref||!ses) return; let hitAny=false;
 for(const src of ses.inputSources){ const key=src.handedness||'none'; if(!src.targetRaySpace) continue; const pose=fr.getPose(src.targetRaySpace,ref); if(!pose) continue;
  vrM.fromArray(pose.transform.matrix); const o=new THREE.Vector3().setFromMatrixPosition(vrM), d=new THREE.Vector3(0,0,-1).transformDirection(vrM);
  const L=laser(key,key==='left'?0x8fe9ff:0xff8fd8), h=vrHitFrom(o,d.clone()), len=h?h.distance:4;
  L.l.position.copy(o); L.l.quaternion.setFromRotationMatrix(vrM); L.l.scale.set(1,1,len); L.l.visible=true;
  if(h){ L.dot.position.copy(h.point); L.dot.visible=true; if(!hitAny&&(!ptr.src||ptr.src===key||!ptr.down)){ vrPoint(h,key); hitAny=true; if(dragUI&&ptr.down) dragUI.drag({...ptr}); } }
  // Tasten A/X (4) = Menü, B/Y (5) = Walkman, Flanke erkennen
  const gp=src.gamepad; if(gp){ const prev=vrPads[key]||[]; const now=gp.buttons.map(b=>b.pressed);
   if(now[4]&&!prev[4]) vrMenu(); if(now[5]&&!prev[5]){ if(S&&!['pause','title','press'].includes(mode)) openWM(!wm.open); } vrPads[key]=now; } }
 if(!hitAny) ptr.on=false; } });
function vrMenu(){ if(!S||mode==='title'||mode==='press') return; if(wm.open) openWM(false); openPause(mode!=='pause'); }
function resumeAudio(){ try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); if(actx.state!=='running') actx.resume(); }catch(e){}
 if(curTrack&&curTrack.paused) curTrack.play().then(()=>fade(curTrack,mvol(),600)).catch(()=>{}); }
function setupVR(){ const sc=document.querySelector('a-scene'); const el=$('screen');
 const tex=new THREE.CanvasTexture(cv); tex.colorSpace=THREE.SRGBColorSpace; screenTex=tex;
 screenMesh=new THREE.Mesh(new THREE.PlaneGeometry(4,2.25),new THREE.MeshBasicMaterial({map:tex,toneMapped:false})); el.setObject3D('mesh',screenMesh);
 sc.setAttribute('zs-vr','');
 let ses=null; const onSel=e=>vrSelect(e.type==='selectstart');
 sc.addEventListener('enter-vr',()=>{ vrMode=true; unlockAudio(); resumeAudio(); if(mode==='press'){ mode='title'; music(); }
  ses=sc.renderer.xr.getSession(); if(ses){ ses.addEventListener('selectstart',onSel); ses.addEventListener('selectend',onSel); } });
 sc.addEventListener('exit-vr',()=>{ vrMode=false; ptr.on=false; ptr.down=false; if(ses){ ses.removeEventListener('selectstart',onSel); ses.removeEventListener('selectend',onSel); ses=null; } $('screen').setAttribute('visible',true); $('vsphere').setAttribute('visible',false); $('titlesky').object3D.visible=false; });
 $('vrbtn').onclick=()=>{ unlockAudio(); resumeAudio(); if(mode==='press'){ mode='title'; music(); } sc.enterVR(); }; }

// ---------- Start
const VER=document.querySelector('meta[name=zs-ver]')?.content||'1';
let titleImg=null;
async function boot(){ const J=async u=>(await fetch(u+'?v='+VER)).json(); const g=await J('data/game.json');
 try{ const b=await J('data/nodes.json'); for(const n in b) for(const h of (g.nodes[n]?.hotspots||[])) if(b[n][h.id]) h.box=b[n][h.id]; }catch(e){ console.warn('nodes.json',e); }
 try{ voiceMap=await J('voice/manifest.json'); }catch(e){}
 MU=await J('data/music.json');
 G=g; await Promise.all(['500','600','700'].map(w=>document.fonts.load(`${w} 30px Rajdhani`).catch(()=>{})));
 titleImg=new Image(); titleImg.src='stills/title.jpg?v='+VER;
 titleV=document.createElement('video'); Object.assign(titleV,{src:'clips/title_loop.mp4?v='+VER,muted:true,loop:true,playsInline:true,preload:'auto'}); titleV.play().catch(()=>{});
 const sc=document.querySelector('a-scene'); sc.hasLoaded?setupVR():sc.addEventListener('loaded',setupVR);
 const qn=(location.search.match(/[?&]node=(\w+)/)||[])[1];
 if(qn&&G.nodes[qn]){ S=fresh(); S.node=qn; started=true; titleV.pause(); await imgReady(still(qn)); mode='play'; requestAnimationFrame(frame); return; }
 mode='press'; still(G.config.start); requestAnimationFrame(frame); }
window.ZS={choose:i=>{ if(dlg){ const o=dlg.n.options.filter(o=>cond(o.cond))[i]; o&&dlg.res(o);} }, get S(){return S}, get G(){return G}, get mode(){return mode}, get ending(){return ending}, get msg(){return msg}, get dlg(){return dlg},
 run, go, epochJump, openWM, openPause, onClick, hsAt, ptr, newGame, toTitle, saveGame, loadGame, closeMsg, skip:()=>clipSkip&&clipSkip(), get clip(){return clipV&&clipV.label}, get track(){return curTrack&&curTrack.src0}, SET, unlockAudio, vrHitFrom, vrPoint, vrSelect, get vrMode(){return vrMode}, set vrMode(v){vrMode=v;}, get audioOK(){return audioOK}, get trackPlaying(){return !!curTrack&&!curTrack.paused}, setTime:t=>{S.time=t;}, get titleOpt(){return titleOpt}, set titleOpt(v){titleOpt=v;}};
boot();
if(DEBUG) window.__zs={get voiceMap(){return voiceMap},voice,stopVoice,run,get G(){return G},get voiceA(){return voiceA},get ducked(){return ducked},get curTrack(){return curTrack}};
})();
