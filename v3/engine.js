// ZEITSCHLEIFE V3 – VR-first 360°-Engine. Räume = Equirect-Panorama + (optional) Front-Platte mit dem Original-Still
// + unsichtbare 3D-Trefferflächen + einfache 3D-Props. UI (Dialoge, Walkman, Menüs) = Canvas: Desktop direkt, VR als Panel.
(()=>{
const W=1600,H=900,cv=document.getElementById('cv'),x=cv.getContext('2d');
const F='Rajdhani, "Noto Color Emoji", sans-serif';
const Q=location.search, DEBUG=/[?&]debug=1/.test(Q);
let G,S,MU,TM,MEM,mode='load',ptr={x:W/2,y:H/2,on:false},ui=[],toasts=[],clipV=null,clipSkip=null;
let msg=null,dlg=null,wm={open:false,tab:'inv',hover:-1},idle=0,sceneT=0,last=performance.now(),voiceMap={},vrMode=false,hover3=null,vhsT=0,credits=null;
const $=id=>document.getElementById(id), T3=()=>window.THREE;
// ---------- Helfer (aus V2)
function rr(X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();}
function glass(X,Y,w,h,r,acc){ x.save(); rr(X,Y,w,h,r); const g=x.createLinearGradient(X,Y,X,Y+h); g.addColorStop(0,'rgba(30,26,48,0.86)'); g.addColorStop(1,'rgba(10,8,20,0.92)'); x.fillStyle=g; x.fill(); x.restore();
 rr(X+0.5,Y+0.5,w-1,h-1,r); const b=x.createLinearGradient(X,Y,X+w,Y+h); b.addColorStop(0,acc||'rgba(255,120,210,0.85)'); b.addColorStop(0.5,'rgba(255,255,255,0.15)'); b.addColorStop(1,'rgba(110,230,255,0.75)'); x.lineWidth=1.5; x.strokeStyle=b; x.stroke(); }
function wrap(t,mw){const out=[];let l='';(t||'').split(' ').forEach(w=>{const s=l?l+' '+w:w; if(l&&x.measureText(s).width>mw){out.push(l);l=w;}else l=s;}); out.push(l); return out;}
function text(t,X,Y,o={}){ x.font=`${o.w||500} ${o.s||26}px ${F}`; x.fillStyle=o.c||'#f2efff'; x.textAlign=o.a||'left'; x.textBaseline=o.b||'alphabetic'; x.letterSpacing=(o.ls||0)+'px'; x.fillText(t,X,Y); x.letterSpacing='0px'; }
function inR(p,r){return p.x>=r[0]&&p.y>=r[1]&&p.x<=r[0]+r[2]&&p.y<=r[1]+r[3];}
function button(r,label,fn,o={}){ const hv=ptr.on&&inR(ptr,r); ui.push({r,fn});
 rr(r[0],r[1],r[2],r[3],o.rad||r[3]/2); const g=x.createLinearGradient(r[0],0,r[0]+r[2],0);
 if(hv||o.active){g.addColorStop(0,'rgba(255,90,190,0.92)');g.addColorStop(1,'rgba(120,90,255,0.92)');} else {g.addColorStop(0,'rgba(30,26,46,0.9)');g.addColorStop(1,'rgba(18,16,32,0.9)');}
 x.fillStyle=g; x.fill(); x.lineWidth=1.5; x.strokeStyle=hv?'#fff':'rgba(255,150,220,0.55)'; x.stroke();
 text(label,r[0]+r[2]/2,r[1]+r[3]/2+1,{s:o.s||22,w:700,a:'center',b:'middle',ls:o.ls??2}); return hv; }
// VR-first: Standbild/Clip liegt als gekrümmtes Kugelsegment exakt auf der Panorama-Region (gleiche Gnomon-Projektion), raumfest
function curvedGeo(T,P,R=20){ const g=new T.PlaneGeometry(P.w,P.h,48,32), a=g.attributes.position, v=new T.Vector3(); for(let i=0;i<a.count;i++){ v.set(a.getX(i),a.getY(i),-P.dist).normalize().multiplyScalar(R); a.setXYZ(i,v.x,v.y,v.z); } g.computeVertexNormals(); return g; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function hash(t){let h=2166136261;for(const c of (t||'').toLowerCase().replace(/[^a-zäöüß0-9]/g,'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
const pick=a=>a[Math.floor(Math.random()*a.length)];
const fmt=t=>{ t=Math.max(0,Math.ceil(t)); return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0'); };
// ---------- Einstellungen, Gedächtnis über Schleifen
const SETDEF={music:0.7,voice:1,sfx:0.85,subs:true,speed:1,hints:true};
let SET=Object.assign({},SETDEF); try{ Object.assign(SET,JSON.parse(localStorage.zs3_settings||'{}')); }catch(e){}
function saveSet(){ localStorage.zs3_settings=JSON.stringify(SET); }
try{ MEM=JSON.parse(localStorage.zs3_mem||'null'); }catch(e){} MEM=MEM||{loops:1,seen:{}}; MEM.know=MEM.know||{};
function saveMem(){ localStorage.zs3_mem=JSON.stringify(MEM); }
const SPEEDS=[['LANGSAM',28],['NORMAL',60],['SCHNELL',140],['SOFORT',0]];
// ---------- Spielzustand (Flags, Besuchszähler je Ära/Szene, Strafen, Boni, Hinweisstufen, Slinky)
function fresh(){ return {node:G.config.start,inv:[],trash:[],flags:{},v:{affection:0,trust:0,chaos:0},anchors:[],notes:(S&&S.notes)||[],time:TM.timeLimit,sel:null,
 visited:{hub:1},visits:{},sceneVisits:{},pen:{},bonus:0,hint:{},fails:{},slinky:{uses:0},loop:MEM.loops,rep:{},spawn:rollSpawns(),dropped:{},gazed:{}}; }
// Zufalls-Item-Pool je Schleife: verteilt Pool-Items auf Spawnpunkte (Schlüssel-Items bleiben fest)
function rollSpawns(){ const P=G.pool; if(!P) return {}; const pts=[]; for(const n in P.spawns) for(const sp of P.spawns[n]) pts.push(n+':'+sp.id);
 const ids=Object.keys(P.items); for(let i=ids.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [ids[i],ids[j]]=[ids[j],ids[i]]; }
 for(let i=pts.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pts[i],pts[j]]=[pts[j],pts[i]]; }
 const n=Math.min(pts.length,ids.length,P.perLoop||5), out={}; for(let i=0;i<n;i++) out[pts[i]]=ids[i]; for(const f of P.always||[]){ if(!Object.values(out).includes(f[1])) out[f[0]]=f[1]; } return out; }
function saveGame(){ if(!S) return; try{ localStorage.zs3_save=JSON.stringify({S:{...S,sel:null},ts:Date.now()}); }catch(e){} }
function hasSave(){ return !!localStorage.zs3_save; }
function ctx(){ const P=f=>new Proxy({},{get:(_,k)=>f(k)}); return {has:P(k=>S.inv.includes(k)||S.anchors.includes(k)),flag:P(k=>!!S.flags[k]),mem:P(k=>!!MEM.seen[k]),know:P(k=>!!MEM.know[k]),rep:P(k=>S.rep[k]||0),visits:P(k=>S.visits[k]||0),anchors:S.anchors.length,loop:S.loop,...S.v}; }
function cond(c){ if(c===undefined||c===null||c==='1'||c===true) return true; try{ const k=ctx(); return !!Function(...Object.keys(k),'return ('+c+')')(...Object.values(k)); }catch(e){ console.warn('cond',c,e); return false; } }
function progress(){ idle=0; }
function toast(t,ms=2600){ toasts.push({t,until:performance.now()+ms}); }
function invCount(){ return S.inv.filter(i=>!G.items[i].anchor).length; }
function addTime(sec,key,kind){ sfxF(kind==='bonus'?'bonus':'penalty'); // kind: 'pen' oder 'bonus'
 if(kind==='bonus'){ if(key&&S.pen['b_'+key]) return; const s=Math.min(sec,TM.maxBonus-S.bonus); if(s<=0) return; S.bonus+=s; S.time+=s; if(key) S.pen['b_'+key]=1; toast('⏱ +'+fmt(s)); sfx('rewind'); return; }
 if(key&&S.pen[key]) return; if(key) S.pen[key]=1; const floor=Math.min(S.time,TM.minTimeAfterPenalty); S.time=Math.max(floor,S.time-sec); toast('⏱ −'+fmt(sec)); }
// ---------- Aktionen
async function run(list){ for(const a of list||[]){ if(mode==='credits') return; const r=await act(a); if(r==='abort') return 'abort'; } }
async function act(a){
 if(a.say!==undefined) return say(a.say,a.speaker);
 if(a.if!==undefined) return run(cond(a.if)?a.then:a.else);
 if(a.give){ const it=G.items[a.give]; if(S.inv.includes(a.give)) return; if(!it.anchor&&invCount()>=G.config.invLimit){ await act(G.config.lines.invFull); return 'abort'; }
  S.inv.push(a.give); sfx('item'); if(['dm','muenze'].includes(a.give)) sfxF('coin'); if(['polaroid','akte'].includes(a.give)) sfxF('paper'); toast('+ '+it.name); progress(); const rk=G.config.reactItem&&G.config.reactItem[a.give]; if(rk&&!MEM.seen['r_'+a.give]){ MEM.seen['r_'+a.give]=1; saveMem(); setTimeout(()=>bark(rk,true),1200); } else if(Math.random()<0.3) setTimeout(()=>bark('pickup'),900); return; }
 if(a.take){ S.inv=S.inv.filter(i=>i!==a.take); if(S.sel===a.take) S.sel=null; return; }
 if(a.set){ S.flags[a.set]=true; progress(); return; }
 if(a.rep){ for(const k in a.rep) S.rep[k]=(S.rep[k]||0)+a.rep[k]; return; }
 if(a.learn){ if(!MEM.know[a.learn]){ MEM.know[a.learn]=1; saveMem(); toast('💡 Gemerkt: '+(G.config.knowledge[a.learn]||a.learn),3500); } return; }
 if(a.hintfree){ const L=G.hints[S.node]||[]; const i=L.findIndex(e=>cond(e.if)); if(i>=0){ const k=S.node+'#'+i; S.hint[k]=Math.max(S.hint[k]||0,1); sceneT=Math.max(sceneT,TM.hintTier2After); S.fails[S.node]=TM.hintTier2Fails; } return hintNow(); }
 if(a.remember){ MEM.seen[a.remember]=1; saveMem(); return; }
 if(a.add){ for(const k in a.add) S.v[k]=(S.v[k]||0)+a.add[k]; return; }
 if(a.anchor){ if(!S.anchors.includes(a.anchor)) S.anchors.push(a.anchor); S.inv=S.inv.filter(i=>i!==a.anchor); toast(`⚓ Anker ${S.anchors.length}/3`,3500); progress(); return; }
 if(a.note){ S.notes.push(a.note); toast('✎ Neue Notiz im Zeit-Walkman'); return; }
 if(a.bonus){ addTime(a.bonus,a.key,'bonus'); return; }
 if(a.penalty){ addTime(a.penalty,a.key,'pen'); return; }
 if(a.undrop){ for(const k in S.dropped) S.dropped[k]=S.dropped[k].filter(d=>d.k!==a.undrop); const g=props['dr_'+a.undrop]; if(g){ g.visible=false; g.userData.gone=true; } return; }
 if(a.radio){ clockRadio(); return; }
 if(a.config_line) return act(G.config.lines[a.config_line]);
 if(a.clip) return playClip(a.clip);
 if(a.go) return go(a.go);
 if(a.epoch) return epochJump(a.epoch);
 if(a.talk) return talk(a.talk);
 if(a.credits){ showCredits(true); return 'abort'; }
}
function say(t,speaker){ return new Promise(res=>{ msg={t,speaker:speaker||'narrator',res,t0:performance.now()}; mode='msg'; voice(t); }); }
function typed(m){ const cps=SPEEDS[SET.speed][1]; if(!cps) return m.t.length; return Math.min(m.t.length,Math.floor((performance.now()-m.t0)/1000*cps)); }
function closeMsg(){ const r=msg&&msg.res; msg=null; stopVoice(); mode='play'; r&&r(); }
// ---------- Dialogbäume: Mehrfachwahl, Haltungen (Mara), je Dialog eine Fallen-Antwort mit Zeitabzug, Mara erinnert sich
async function talk(id){ const D=G.dialogs[id]; if(D.pre) await run(D.pre); let key='start';
 while(key){ const n=D.nodes[key]; const opt=await new Promise(res=>{ dlg={n,res,t0:performance.now(),t:n.text,id}; mode='dlg'; voice(n.text); });
  stopVoice(); dlg=null; mode='play'; let good=true;
  if(opt.tone){ const a=S.v.affection, annoyed=a<0;
   if(opt.tone==='charm'){ good=!annoyed; S.v.affection+=good?1:0; }
   if(opt.tone==='cheeky'){ good=a>=1; S.v.affection+=good?2:-1; }
   if(opt.tone==='serious'){ good=true; S.v.trust+=1; } }
  if(opt.trap){ const first=!S.pen[opt.trap.key]; if(first){ await run(opt.do); addTime(opt.trap.sec||TM.trapDefault,opt.trap.key,'pen'); } else await say(pick(["Das hast du ihn schon gefragt. Willst du wirklich noch mal?","Du kennst die Antwort. Sie ist lang. Sehr lang."]),'narrator');
   MEM.seen[opt.trap.key]=1; saveMem(); }
  else if(opt.do) await run(opt.do);
  const rep=good?opt.good:opt.bad; if(rep) await say(rep,'mara');
  key=opt.next||null; }
 dlg=null; mode='play'; }
// ---------- 3D-Raum
let roomG,skyEl,plate,clipPlate,hitG,propG,panel,panelTex,camEl,sceneEl,roomYaw=0,props={},hitMeshes=[];
const texL=()=>new (T3().TextureLoader)();
const texCache={};
function loadTex(src){ if(texCache[src]) return texCache[src]; const p=new Promise(r=>texL().load(src,t=>{ t.colorSpace=T3().SRGBColorSpace; r(t); },undefined,()=>r(null))); texCache[src]=p; return p; }
function featherTex(){ const c=document.createElement('canvas'); c.width=256; c.height=144; const g=c.getContext('2d'); g.fillStyle='#000'; g.fillRect(0,0,256,144);
 const e=26; for(let i=0;i<e;i++){ const x=(i+1)/e, a=x*x*(3-2*x); g.fillStyle=`rgb(${a*255|0},${a*255|0},${a*255|0})`; g.fillRect(i,i,256-2*i,144-2*i); } g.fillStyle='#fff'; g.fillRect(e,e,256-2*e,144-2*e);
 const t=new (T3().CanvasTexture)(c); return t; }
function setupScene(){ const T=T3(); sceneEl=document.querySelector('a-scene'); camEl=$('cam');
 roomG=new T.Group(); sceneEl.object3D.add(roomG);
 const sky=new T.Mesh(new T.SphereGeometry(30,64,32),new T.MeshBasicMaterial({side:T.BackSide,toneMapped:false})); sky.scale.x=-1; sky.rotation.y=-Math.PI/2; roomG.add(sky); skyEl=sky;
 const P=G.config.plate, fm=featherTex();
 plate=new T.Mesh(curvedGeo(T,P),new T.MeshBasicMaterial({transparent:true,alphaMap:fm,toneMapped:false,depthWrite:false})); plate.position.z=0; plate.renderOrder=2; roomG.add(plate);
 clipPlate=new T.Mesh(curvedGeo(T,P),new T.MeshBasicMaterial({transparent:true,alphaMap:fm,opacity:0,toneMapped:false,depthWrite:false})); clipPlate.position.z=0; clipPlate.scale.setScalar(0.995); clipPlate.renderOrder=3; clipPlate.visible=false; roomG.add(clipPlate);
 hitG=new T.Group(); roomG.add(hitG); propG=new T.Group(); roomG.add(propG);
 // UI-Panel (nur VR): Canvas als Textur, folgt dem Blick träge
 panelTex=new T.CanvasTexture(cv); panelTex.colorSpace=T.SRGBColorSpace;
 panel=new T.Mesh(new T.PlaneGeometry(2.4,1.35),new T.MeshBasicMaterial({map:panelTex,transparent:true,toneMapped:false,depthTest:false})); panel.renderOrder=900; panel.visible=false; sceneEl.object3D.add(panel);
 slinkyBuild(); }
function eyeYaw(){ return window.ZSFX?ZSFX.viewYaw(sceneEl):0; }
function eyePos(){ return window.ZSFX?ZSFX.headPos(sceneEl):new (T3().Vector3)(0,1.6,0); }
const GLB={eimer:{url:'assets/metal_trash_can.glb',h:0.62,keep:n=>n.startsWith('metal_trash_can_rust')&&!n.includes('lid')}};
function glbSwap(p,g){ const c=GLB[p.id]; if(!c||!THREE.GLTFLoader) return; new THREE.GLTFLoader().load(c.url,gl=>{ const m=gl.scene; if(c.keep){ const rm=[]; m.traverse(o=>{ if(o!==m&&o.parent===m&&!c.keep(o.name||'')) rm.push(o); }); rm.forEach(o=>m.remove(o)); } const ctr=new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()); m.children.forEach(o=>{ o.position.x-=ctr.x; o.position.z-=ctr.z; }); const b=new THREE.Box3().setFromObject(m), sz=b.getSize(new THREE.Vector3()); const s=c.h/sz.y; m.scale.setScalar(s); m.position.y=-b.min.y*s; const pre=[]; g.traverse(o=>{ if(o.isMesh) pre.push(o); }); pre.forEach(o=>{ o.material.visible=false; }); m.traverse(o=>{ if(o.isMesh) o.userData.glb=1; }); g.add(m); },undefined,()=>{}); }
function mkProp(p){ const T=T3(), g=new T.Group(); const M=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:0.7,...o});
 if(p.type==='trash'){ const m=new T.Mesh(new T.CylinderGeometry(0.24,0.2,0.62,24,1,true),M(0x4a4d52,{metalness:0.6,side:T.DoubleSide})); m.position.y=0.31; g.add(m);
  const b=new T.Mesh(new T.CircleGeometry(0.2,24),M(0x1a1a1a)); b.rotation.x=-Math.PI/2; b.position.y=0.02; g.add(b);
  const r=new T.Mesh(new T.TorusGeometry(0.24,0.012,8,32),M(0x777a80,{metalness:0.8})); r.rotation.x=Math.PI/2; r.position.y=0.62; g.add(r); }
 if(p.type==='polaroid'){ const c=document.createElement('canvas'); c.width=128; c.height=150; const q=c.getContext('2d'); q.fillStyle='#f4f1e8'; q.fillRect(0,0,128,150); q.fillStyle='#6b4a5a'; q.fillRect(10,10,108,104);
  q.fillStyle='#d9a080'; q.beginPath(); q.arc(64,58,22,0,7); q.fill(); q.fillStyle='#9b5a2a'; q.beginPath(); q.arc(64,46,30,Math.PI,0); q.fill();
  const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; const m=new T.Mesh(new T.PlaneGeometry(0.1,0.118),new T.MeshBasicMaterial({map:t})); m.rotation.x=-Math.PI/2; m.rotation.z=0.4; m.position.y=0.005; g.add(m);
  const hit=new T.Mesh(new T.BoxGeometry(0.5,0.25,0.5),new T.MeshBasicMaterial({visible:false})); g.add(hit); g.userData.hitOnly=hit; }
 if(p.type==='mug'){ const m=new T.Mesh(new T.CylinderGeometry(0.045,0.04,0.1,20),M(0xeeeeee)); m.position.y=0.05; g.add(m); const h=new T.Mesh(new T.TorusGeometry(0.03,0.008,8,16),M(0xeeeeee)); h.position.set(0.05,0.05,0); g.add(h);
  const hit=new T.Mesh(new T.BoxGeometry(0.45,0.3,0.45),new T.MeshBasicMaterial({visible:false})); g.add(hit); }
 if(p.type==='lamp'){ const m=new T.Mesh(new T.PlaneGeometry(1.2,0.3),new T.MeshBasicMaterial({color:0xfff6d0,side:T.DoubleSide,toneMapped:false,transparent:true})); m.rotation.x=Math.PI/2; g.add(m); g.userData.flicker=m.material;
  const hit=new T.Mesh(new T.BoxGeometry(1.6,0.4,0.8),new T.MeshBasicMaterial({visible:false})); g.add(hit); }
 if(p.type==='chicken'){ const b=new T.Mesh(new T.CapsuleGeometry(0.06,0.22,6,12),M(0xf3d23a)); b.rotation.z=Math.PI/2; b.position.y=0.07; g.add(b);
  const hd=new T.Mesh(new T.SphereGeometry(0.05,12,8),M(0xf3d23a)); hd.position.set(0.17,0.12,0); g.add(hd); const k=new T.Mesh(new T.ConeGeometry(0.025,0.05,8),M(0xd8352a)); k.position.set(0.17,0.18,0); g.add(k);
  const pu=new T.Mesh(new T.TorusGeometry(0.035,0.012,8,16),M(0x777777,{metalness:0.6})); pu.position.set(0,0.07,0.06); g.add(pu);
  const hit=new T.Mesh(new T.BoxGeometry(0.6,0.35,0.5),new T.MeshBasicMaterial({visible:false})); g.add(hit); }
 if(p.type==='hubcap'){ const m=new T.Mesh(new T.CylinderGeometry(0.17,0.17,0.03,28),M(0xb8bcc2,{metalness:0.9,roughness:0.3})); m.position.y=0.015; m.rotation.z=0.15; g.add(m);
  const hit=new T.Mesh(new T.BoxGeometry(0.6,0.25,0.6),new T.MeshBasicMaterial({visible:false})); g.add(hit); }
 if(p.type==='item') itemModel(g,G.items[p.item]);
 if(p.type==='radio'){ const c=document.createElement('canvas'); c.width=128; c.height=48; const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; g.userData.clock={c,t};
  const b=new T.Mesh(new T.BoxGeometry(0.26,0.1,0.12),M(0x3a2a20)); b.position.y=0.05; g.add(b); const sc=new T.Mesh(new T.PlaneGeometry(0.16,0.06),new T.MeshBasicMaterial({map:t,toneMapped:false})); sc.position.set(0,0.055,0.061); g.add(sc);
  const sp=new T.Mesh(new T.CircleGeometry(0.03,16),M(0x111111)); sp.position.set(0.1,0.05,0.061); g.add(sp); drawClock(g,'05:59'); g.rotation.y=-0.5; }
 if(p.type==='gully'){ const m=new T.Mesh(new T.CylinderGeometry(0.22,0.22,0.01,24),M(0x222428,{metalness:0.7})); m.position.y=0.005; g.add(m); for(let i=-3;i<=3;i++){ const b=new T.Mesh(new T.BoxGeometry(0.4*Math.cos(i/4),0.012,0.02),M(0x0a0a0a)); b.position.set(0,0.008,i*0.05); g.add(b); }
  const hit=new T.Mesh(new T.BoxGeometry(0.6,0.2,0.6),new T.MeshBasicMaterial({visible:false})); g.add(hit); }
 if(p.type==='marmot'){ const fur=M(0x7a5a3a); const b=new T.Mesh(new T.CapsuleGeometry(0.09,0.12,6,12),fur); b.position.y=0.15; g.add(b); const hd=new T.Mesh(new T.SphereGeometry(0.07,12,10),fur); hd.position.set(0,0.31,0.03); g.add(hd);
  [[-0.025,0.33,0.095],[0.025,0.33,0.095]].forEach(q=>{ const e=new T.Mesh(new T.SphereGeometry(0.011,8,6),M(0x050505)); e.position.set(...q); g.add(e); }); const n=new T.Mesh(new T.SphereGeometry(0.014,8,6),M(0x2a1a10)); n.position.set(0,0.31,0.1); g.add(n);
  const hit=new T.Mesh(new T.BoxGeometry(0.4,0.5,0.4),new T.MeshBasicMaterial({visible:false})); hit.position.y=0.2; g.add(hit); g.rotation.y=2.4; }
 g.position.set(...p.pos); g.userData.prop=p; return g; }
function drawClock(g,txt){ const k=g.userData.clock; if(!k) return; const q=k.c.getContext('2d'); q.fillStyle='#120404'; q.fillRect(0,0,128,48); q.fillStyle='#ff3020'; q.font='bold 40px monospace'; q.textAlign='center'; q.textBaseline='middle'; q.fillText(txt,64,26); k.t.needsUpdate=true; }
// Radiowecker (Murmeltier-Hommage): klickt auf 6:00 und spielt einen eigenen, synthetischen Oldie (lizenzfrei, selbst komponiert)
async function clockRadio(){ const g=props.radio; g&&sfxF('radio_static',g,0.5); if(g) drawClock(g,'05:59'); await sleep(900); sfx('clack'); if(g) drawClock(g,'06:00'); if(!audioOK||!actx||SET.sfx<=0) return; duck(true); audioListener(); const out=g?panAt(g):actx.destination;
 const t0=actx.currentTime+0.1, bt=0.32; const mel=[67,64,65,67,72,71,69,67, 65,62,64,65,69,67,65,64, 67,64,65,67,72,74,72,71, 69,71,72,67,64,62,60,null]; const bass=[48,48,53,53,55,55,48,48];
 const note=(m,t,d,type,v)=>{ const o=actx.createOscillator(), gg=actx.createGain(); o.type=type; o.frequency.value=440*Math.pow(2,(m-69)/12); gg.gain.setValueAtTime(0.0001,t); gg.gain.exponentialRampToValueAtTime(v*SET.music,t+0.02); gg.gain.exponentialRampToValueAtTime(0.0001,t+d); const f=actx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1800; o.connect(f); f.connect(gg); gg.connect(out); o.start(t); o.stop(t+d+0.05); };
 mel.forEach((m,i)=>{ if(m) note(m,t0+i*bt,bt*0.9,'triangle',0.09); }); bass.forEach((m,i)=>{ for(let k=0;k<4;k++) note(m,t0+(i*4+k)*bt,bt*0.7,'sine',0.07); });
 setTimeout(()=>duck(false),mel.length*bt*1000); }
function itemModel(g,it){ const T=T3(), md=(it&&it.model)||'box', c=(it&&it.color)?parseInt(it.color.replace('#',''),16):0xcccccc; const M=(col,o={})=>new T.MeshStandardMaterial({color:col,roughness:0.6,...o}); let m;
 const add=(geo,col,pos,rot)=>{ const k=new T.Mesh(geo,M(col)); if(pos) k.position.set(...pos); if(rot) k.rotation.set(...rot); g.add(k); return k; };
 if(md==='egg'){ add(new T.SphereGeometry(0.035,14,10),c,[0,0.04,0]).scale.set(1,1.25,0.6); add(new T.PlaneGeometry(0.03,0.025),0x99bb88,[0,0.045,0.022]); }
 else if(md==='pencil'){ add(new T.CylinderGeometry(0.005,0.005,0.17,6),c,[0,0.006,0],[0,0,Math.PI/2]); }
 else if(md==='gameboy'){ add(new T.BoxGeometry(0.09,0.02,0.15),c,[0,0.01,0]); add(new T.PlaneGeometry(0.06,0.05),0x8a9a5b,[0,0.021,-0.03],[-Math.PI/2,0,0]); }
 else if(md==='cube'){ const cs=[0xd02020,0x20a040,0x2050d0,0xf0d020,0xf08020,0xffffff]; for(let i=0;i<6;i++){} add(new T.BoxGeometry(0.057,0.057,0.057),0x111111,[0,0.029,0]); [[0,0.058,0,-Math.PI/2,0],[0,0.029,0.029,0,0],[0.029,0.029,0,0,Math.PI/2]].forEach((q,i)=>add(new T.PlaneGeometry(0.052,0.052),cs[i],[q[0],q[1]+0.0005,q[2]+0.0005],[q[3],q[4],0])); }
 else if(md==='pack'){ add(new T.BoxGeometry(0.06,0.012,0.09),c,[0,0.006,0]); }
 else if(md==='gum'){ add(new T.BoxGeometry(0.07,0.006,0.02),c,[0,0.003,0]); }
 else if(md==='string'){ add(new T.TorusGeometry(0.03,0.006,6,16),c,[0,0.006,0],[Math.PI/2,0,0]); }
 else if(md==='banana'){ add(new T.TorusGeometry(0.08,0.018,8,16,Math.PI*0.8),0xf2d43a,[0,0.02,0],[Math.PI/2,0,0]); }
 else if(md==='bill'){ add(new T.PlaneGeometry(0.14,0.07),0x7fa37a,[0,0.003,0],[-Math.PI/2,0,0]); }
 else if(md==='hammer'){ add(new T.CylinderGeometry(0.012,0.012,0.28,8),0x8a5a2b,[0,0.012,0],[0,0,Math.PI/2]); add(new T.BoxGeometry(0.04,0.04,0.09),0x555a60,[0.14,0.02,0]); }
 else if(md==='coin'){ add(new T.CylinderGeometry(0.012,0.012,0.003,16),0xd8c070,[0,0.002,0]); }
 else if(md==='hook'){ add(new T.TorusGeometry(0.025,0.005,6,16,Math.PI*1.4),0xaaaaaa,[0,0.006,0],[Math.PI/2,0,0]); add(new T.TorusGeometry(0.03,0.005,6,16),0xddddcc,[0.06,0.006,0],[Math.PI/2,0,0]); }
 else add(new T.BoxGeometry(0.08,0.05,0.08),c,[0,0.025,0]);
 const hit=new T.Mesh(new T.BoxGeometry(0.4,0.25,0.4),new T.MeshBasicMaterial({visible:false})); hit.position.y=0.06; g.add(hit); }
function hitPlane(def){ const T=T3(); const m=new T.Mesh(new T.PlaneGeometry(def.size[0],def.size[1]),new T.MeshBasicMaterial({color:0x00ff00,wireframe:DEBUG,visible:DEBUG}));
 m.position.set(...def.pos); m.lookAt(0,def.pos[1],0); return m; }
async function buildRoom(id,yaw){ const T=T3(), n=G.nodes[id], P=G.config.plate;
 const [sk,st]=await Promise.all([loadTex(`${G.config.skyDir}/${n.sky}.jpg?v=${VER}`), n.still?loadTex(`${G.config.stillDir}/${n.still}.jpg?v=${VER}`):Promise.resolve(null)]);
 skyEl.material.map=sk; skyEl.material.needsUpdate=true; plate.visible=!!st; if(st){ plate.material.map=st; plate.material.needsUpdate=true; }
 while(hitG.children.length) hitG.remove(hitG.children[0]); while(propG.children.length) propG.remove(propG.children[0]); props={}; hitMeshes=[];
 for(const p of n.props||[]){ const g=mkProp(p); propG.add(g); props[p.id]=g; glbSwap(p,g); }
 const hsl=n.hotspots.slice();
 for(const sp of (G.pool&&G.pool.spawns[id])||[]){ const it=S.spawn[id+':'+sp.id]; if(!it) continue; const pid='sp_'+sp.id, fl='got_'+id+'_'+sp.id; const p={id:pid,type:'item',item:it,pos:sp.pos,when:'!flag.'+fl}; const g=mkProp(p); propG.add(g); props[pid]=g;
  hsl.push({id:pid,label:G.items[it].name,prop:pid,item:it,when:'!flag.'+fl,grab:true,on:[{give:it},{set:fl},G.items[it].line].filter(Boolean)}); }
 for(const d of S.dropped[id]||[]){ const pid='dr_'+d.k; const p={id:pid,type:'item',item:d.item,pos:d.pos}; const g=mkProp(p); propG.add(g); props[pid]=g; hsl.push({id:pid,label:G.items[d.item].name,prop:pid,item:d.item,grab:true,dropped:d.k,on:[{give:d.item},{undrop:d.k}]}); }
 for(const h of hsl){ if(h.prop&&props[h.prop]&&h.grab!==false&&G.items[h.id]) h.grab=true; let m;
  if(h.prop){ m=props[h.prop]; if(!m) continue; m.traverse(o=>{ if(o.isMesh){ o.userData.hs=h; hitMeshes.push(o);} }); continue; }
  if(h.box){ const [bx,by,bw,bh]=h.box; m=hitPlane({pos:[(bx+bw/2-0.5)*P.w,(0.5-by-bh/2)*P.h,-P.dist+0.05],size:[bw*P.w,bh*P.h]}); m.lookAt(m.position.x,m.position.y,10); }
  else if(h.hit) m=hitPlane(h.hit); else continue;
  m.userData.hs=h; hitG.add(m); hitMeshes.push(m); }
 const e=eyePos(); roomG.position.set(e.x,e.y,e.z); roomYaw=yaw; roomG.rotation.set(0,yaw,0); for(const k in held){ delete held[k]; } phys.length=0; setTimeout(roomHum,50); setTimeout(roomAmb,60); }
function syncRoom(now){ if(!S||!G.nodes[S.node]) return; for(const k in props){ const g=props[k], p=g.userData.prop; if(g.userData.held||g.userData.flying) continue; g.visible=!g.userData.gone&&!g.userData.held&&!g.userData.flying&&cond(p.when);
  if(g.userData.flicker){ const f=0.75+0.12*Math.sin(now/900)+0.08*Math.sin(now/337+1.3); g.userData.flicker.opacity=f; } } }
// ---------- Navigation: Raum wechseln (weiche Blende, Raum wird auf den Blick ausgerichtet)
let fadeA=0;
async function go(id){ if(!G.nodes[id]) return toast('Knoten fehlt: '+id); mode='trans'; sfx('step'); await fade(1,220); await buildRoom(id,eyeYaw()); S.node=id; await fade(0,260); mode='play'; music(); saveGame(); await enter(); }
function fade(to,ms){ return new Promise(r=>{ const f=fadeA,t0=performance.now(); const st=()=>{ const p=Math.min(1,(performance.now()-t0)/ms); fadeA=f+(to-f)*p; if(p<1) setTimeout(st,16); else r(); }; st(); }); }
async function enter(){ const n=G.nodes[S.node]; sceneT=0; S.visited[n.epoch]=1; S.sceneVisits[S.node]=(S.sceneVisits[S.node]||0)+1; if(n.enter) await run(n.enter); if(!MEM.seen['first'+S.node]){ MEM.seen['first'+S.node]=1; saveMem(); setTimeout(()=>bark('first'+S.node,true),700); } }
// ---------- Epochenwechsel: Vortex auf die aktuelle Blickrichtung zentriert
async function epochJump(id){ if(!G.nodes[id]) return toast('Knoten fehlt: '+id); mode='vortex'; S.sel=null; const ep=G.nodes[id].epoch; sfx('whoosh');
 const yaw=eyeYaw(); lastVortexYaw=yaw; roomG.visible=false; const DUR=2.8;
 try{ await ZSFX.hyperspace(sceneEl,{duration:DUR,yaw,video:$('vortexvid')}); }catch(e){ console.warn(e); await sleep(DUR*1000); }
 await buildRoom(id,eyeYaw()); roomG.visible=true; S.node=id; vhsT=1; mode='play'; music(); saveGame();
 // Glitch-Stufen je Rückkehr: Ton, Sprüche, Zeit (Bild nur dezentes VHS)
 if(ep!=='hub'){ const v=S.visits[ep]=(S.visits[ep]||0)+1; const gl=(G.glitch[ep]||{}), lvl=Math.min(5,v);
  if(v===1&&S.loop>=2&&MEM.seen['era_'+ep]&&G.glitch.remember[ep]) await act(G.glitch.remember[ep]);
  MEM.seen['era_'+ep]=1; saveMem();
  if(lvl>=2){ sfx('warble',lvl); if(gl[String(lvl)]&&(lvl<5||v===5)) await act(gl[String(lvl)]); else setTimeout(()=>bark('glitch'+Math.min(5,lvl),true),1500); if(v>=TM.glitchPenaltyFrom) addTime(TM.glitchPenalty,null,'pen'); } }
 await enter(); }
let lastVortexYaw=0;
// ---------- Story-Clips: nahtlos aus dem Still (gleiche Platte, gleiche Projektion), weiche Überblendung
async function playClip(name){ const T=T3(), v=document.createElement('video'); v.src=`${G.config.clipDir}/${name}.mp4?v=${VER}`; v.playsInline=true; v.crossOrigin='anonymous'; v.preload='auto'; v.volume=Math.min(1,SET.sfx); stopVoice();
 const pm=mode; mode='clip'; duck(true); const done=new Promise(r=>{ clipSkip=()=>r(); v.onended=r; v.onerror=()=>{ v.failed=true; setTimeout(r,1200);} ; });
 const vt=new T.VideoTexture(v); vt.colorSpace=T.SRGBColorSpace; clipPlate.material.map=vt; clipPlate.material.opacity=0; clipPlate.material.needsUpdate=true; clipPlate.visible=true;
 v.play().catch(()=>{ v.muted=true; v.play().catch(()=>{ v.failed=true; }); }); clipV=v; clipV.label=name;
 const fin=()=>{ const t0=performance.now(); const st=()=>{ const p=Math.min(1,(performance.now()-t0)/500); clipPlate.material.opacity=p; if(p<1&&clipV===v) requestAnimationFrame(st); }; st(); };
 const endTex=new Promise(r=>{ new T.TextureLoader().load(`stills/${name}_end.jpg?v=${VER}`,t=>{ t.colorSpace=T.SRGBColorSpace; r(t); },undefined,()=>r(null)); });
 v.addEventListener('playing',()=>{ if(v.requestVideoFrameCallback) v.requestVideoFrameCallback(()=>fin()); else setTimeout(fin,60); },{once:true});
 await done; const et=await Promise.race([endTex,sleep(400).then(()=>null)]); if(et&&!v.failed&&name!=='intro_komplett'){ plate.material.map=et; plate.material.needsUpdate=true; } const t0=performance.now(); await new Promise(r=>{ const st=()=>{ const p=Math.min(1,(performance.now()-t0)/350); clipPlate.material.opacity=1-p; if(p<1) setTimeout(st,16); else r(); }; st(); });
 v.pause(); clipPlate.visible=false; clipPlate.material.map=null; vt.dispose(); v.removeAttribute('src'); v.load(); clipV=null; clipSkip=null; duck(false); mode=pm==='intro'?'intro':'play'; }
// ---------- Slinky: zeigt nur die Richtung (30–40 % des Weges), kostet Zeit, nach dem 3. Mal haut er ab
let sl=null;
function slinkyBuild(){ const T=T3(), g=new T.Group(); const mat=new T.MeshBasicMaterial({color:0xfff23a,toneMapped:false});
 for(let i=0;i<12;i++){ const r=new T.Mesh(new T.TorusGeometry(0.055,0.006,6,24),mat); r.rotation.x=Math.PI/2; r.position.y=i*0.009; g.add(r); } g.visible=false; sceneEl.object3D.add(g); sl={g,busy:false}; }
function slinkyTarget(){ for(const [c,id] of (G.slinky[S.node]||[])) if(cond(c)){ const m=hitMeshes.find(o=>o.userData.hs.id===id&&(o.userData.hs.when===undefined||cond(o.userData.hs.when))); if(m) return m; } return null; }
async function useSlinky(){ if(sl.busy) return; sl.busy=true; S.sel=null; progress(); const T=T3(); S.slinky.uses++; const u=S.slinky.uses; sfxF('slinky_boing'); if(u===1) setTimeout(()=>bark('slinkyGo',true),200);
 addTime(TM.slinkyCost,null,'pen'); const e=eyePos(), yaw=eyeYaw(); const fl=e.y-1.6;
 const start=new T.Vector3(e.x-Math.sin(yaw)*1.1,fl,e.z-Math.cos(yaw)*1.1); const tm=slinkyTarget(); let end;
 if(tm){ const tp=new T.Vector3(); tm.getWorldPosition(tp); tp.y=fl; const d=tp.sub(start); const L=Math.min(d.length()*0.38,2.2); end=start.clone().add(d.setLength(L)); }
 sl.g.position.copy(start); sl.g.visible=true; mode='slinky';
 if(end){ await hops(start,end,3,520); } else { for(let k=0;k<6;k++){ const a=k/6*Math.PI*2, p=start.clone().add(new T.Vector3(Math.cos(a)*0.35,0,Math.sin(a)*0.35)); await hops(sl.g.position.clone(),p,1,300); } }
 mode='play';
 if(!end) await act(G.config.lines.slinkyNone);
 if(u>=TM.slinkyUses){ await act(G.config.lines.slinky3); const away=sl.g.position.clone().add(new T.Vector3(-Math.sin(yaw+Math.PI*0.8)*6,0,-Math.cos(yaw+Math.PI*0.8)*6));
  mode='slinky'; await hops(sl.g.position.clone(),away,6,230,true); mode='play'; S.inv=S.inv.filter(i=>i!=='slinky'); S.flags.slinkygone=true; sl.g.visible=false; sl.g.scale.setScalar(1); await act(G.config.lines.slinkyRun); await act(G.config.lines.slinkyRun2); }
 else { await sleep(1400); sl.g.visible=false; }
 sl.busy=false; }
function hops(a,b,n,ms,shrink){ const T=T3(); return new Promise(res=>{ let i=0; const step=()=>{ if(i>=n) return res(); const p0=a.clone().lerp(b,i/n), p1=a.clone().lerp(b,(i+1)/n), t0=performance.now(); sfxF('slinky_hop',sl.g)||sfx('clack');
  const fr=()=>{ const p=Math.min(1,(performance.now()-t0)/ms); const q=p0.clone().lerp(p1,p); q.y+=Math.sin(p*Math.PI)*0.22; sl.g.position.copy(q);
   sl.g.scale.set(1,1+Math.sin(p*Math.PI)*0.9,1); if(shrink) sl.g.scale.multiplyScalar(1-0.12*(i+p)); sl.g.rotation.y+=0.08;
   if(p<1) requestAnimationFrame(fr); else { i++; step(); } }; fr(); }; step(); }); }
// ---------- Musik und Stimme (aus V2: Ducking, Unlock)
const tracks={}; let curTrack=null, ducked=false, voiceA=null, audioOK=false;
function musicKey(){ if(mode==='title'||mode==='press'||mode==='credits') return 'title'; if(mode==='intro'||!S) return null; if(S.time<MU.tensionBelowSeconds) return 'tension'; return G.nodes[S.node].epoch; }
function mvol(){ return MU.volume*SET.music*(ducked?0.4:1); }
function music(){ if(!audioOK||!MU) return; const k=musicKey(), src=k&&SET.music>0?MU.tracks[k]:null;
 if(curTrack&&curTrack.src0===src){ afade(curTrack,mvol(),400); return; } if(curTrack){ const o=curTrack; afade(o,0,MU.crossfadeMs,()=>o.pause()); }
 curTrack=null; if(!src) return; const a=tracks[src]||(tracks[src]=Object.assign(new Audio(src+'?v='+VER),{loop:true,volume:0,src0:src})); curTrack=a;
 a.play().then(()=>afade(a,mvol(),MU.crossfadeMs)).catch(()=>{}); }
function afade(a,to,ms,done){ clearInterval(a._f); const f=a.volume,t0=performance.now(); a._f=setInterval(()=>{const p=Math.min(1,(performance.now()-t0)/ms); a.volume=Math.max(0,Math.min(1,f+(to-f)*p)); if(p>=1){clearInterval(a._f); done&&done();}},40); }
function duck(on){ ducked=on; if(curTrack) afade(curTrack,mvol(),400); }
function applyVolumes(){ if(curTrack) afade(curTrack,mvol(),150); if(SET.music<=0||!curTrack) music(); if(voiceA) voiceA.volume=Math.min(1,SET.voice); }
const SFXN=['pickup','drop','throw','trash_hit','bounce','inv_open','inv_close','ui_hover','ui_click','slinky_boing','slinky_hop','clock_click','radio_static','step_carpet0','step_carpet1','step_carpet2','step_street0','step_street1','step_street2','coin','paper','error','bonus','penalty','glitch','whoosh','banana','zip','amb_backrooms','amb_1989'], SFXB={}; let sfxLoading=false, ambNode=null, ambName=null;
function sfxLoad(){ if(sfxLoading||!actx) return; sfxLoading=true; for(const n of SFXN) fetch(`sfx/${n}.mp3?v=${VER}`).then(r=>r.arrayBuffer()).then(b=>actx.decodeAudioData(b)).then(b=>{ SFXB[n]=b; if(n.startsWith('amb_')) roomAmb(); }).catch(()=>{}); }
function sfxF(n,at,vol=1,rate=1){ if(!audioOK||SET.sfx<=0||!actx) return false; sfxLoad(); const b=SFXB[n]; if(!b) return false; try{ const s=actx.createBufferSource(); s.buffer=b; s.playbackRate.value=rate*(0.96+Math.random()*0.08); const g=actx.createGain(); g.gain.value=vol*SET.sfx; s.connect(g); g.connect(at&&at.isObject3D?(audioListener(),panAt(at)):actx.destination); s.start(); return true; }catch(e){ return false; } }
function steps(){ const st=G.nodes[S&&S.node]&&G.nodes[S.node].epoch==='1989'?'step_street':'step_carpet'; for(let i=0;i<4;i++) setTimeout(()=>sfxF(st+(i%3),null,0.55),i*260); }
function roomAmb(){ try{ if(!actx||!S||!G.nodes[S.node]) return; const ep=G.nodes[S.node].epoch, n=ep==='1989'?'amb_1989':'amb_backrooms'; if(ambName===n&&ambNode) return; if(ambNode){ const o=ambNode; o.g.gain.setTargetAtTime(0,actx.currentTime,0.4); setTimeout(()=>{ try{o.s.stop();}catch(e){} },1500); ambNode=null; } const b=SFXB[n]; if(!b||SET.sfx<=0) return; const s=actx.createBufferSource(); s.buffer=b; s.loop=true; const g=actx.createGain(); g.gain.value=0; g.gain.setTargetAtTime((ep==='1989'?0.22:0.12)*SET.sfx,actx.currentTime,0.8); s.connect(g); g.connect(actx.destination); s.start(); ambNode={s,g}; ambName=n; }catch(e){} }
// ---------- Barks: kurze Sprachzeilen nebenbei (blockieren nichts, Untertitel als Toast)
let barkT=0, idleBarked=false, timeBarked={}; const barkIx={};
function bark(cat,force){ const B=G.config.barks||{}; let L=typeof cat==='string'?B[cat]:[cat]; if(!L||!L.length||!S) return false; const now=performance.now()/1000;
 if(!force&&now-barkT<(G.config.barkCooldown||9)) return false; if(mode!=='play'&&mode!=='slinky'&&mode!=='trans') return false;
 const i=(barkIx[cat]=(barkIx[cat]===undefined?Math.floor(Math.random()*L.length):barkIx[cat]+1))%L.length, l=L[i]; barkT=now;
 const nm=(G.config.speakers&&G.config.speakers[l.speaker])||l.speaker; toast((l.speaker==='narrator'?'':nm+': ')+l.say,4200); voice(l.say); return true; }
const SFXMAP={click:'ui_click',item:'pickup',whoosh:'whoosh',clack:'clock_click',warble:'glitch'};
let actx=null; function sfx(kind,lvl){ if(!audioOK||SET.sfx<=0) return; if(kind==='step'){ actx&&sfxLoad(); if(Object.keys(SFXB).length){ steps(); return; } } if(SFXMAP[kind]&&sfxF(SFXMAP[kind],lvl&&lvl.isObject3D?lvl:null)) return; try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); const t=actx.currentTime, g=actx.createGain(); g.connect(actx.destination); const V=SET.sfx;
 const osc=(type,f0,f1,dur,vol,at=0)=>{ const o=actx.createOscillator(), gg=actx.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t+at); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+at+dur); gg.gain.setValueAtTime(0.0001,t+at); gg.gain.exponentialRampToValueAtTime(vol*V,t+at+0.01); gg.gain.exponentialRampToValueAtTime(0.0001,t+at+dur); o.connect(gg); gg.connect(actx.destination); o.start(t+at); o.stop(t+at+dur+0.02); };
 const noise=(dur,f0,f1,vol,q=1.2)=>{ const n=actx.sampleRate*dur, b=actx.createBuffer(1,n,actx.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; const s=actx.createBufferSource(); s.buffer=b; const f=actx.createBiquadFilter(); f.type='bandpass'; f.Q.value=q; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(f1,t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol*V,t+dur*0.3); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); s.start(t); };
 if(kind==='click') osc('triangle',880,440,0.08,0.08);
 if(kind==='item'){ osc('sine',660,0,0.35,0.12); osc('sine',990,0,0.35,0.12,0.09); }
 if(kind==='whoosh') noise(1.8,200,2400,0.35);
 if(kind==='step') noise(0.35,500,200,0.12,0.8);
 if(kind==='clack') osc('square',1400,500,0.05,0.05);
 if(kind==='rewind'){ osc('sawtooth',300,1800,0.5,0.05); }
 if(kind==='warble'){ const l=lvl||2; osc('sine',220,140,0.9+0.2*l,0.04*l); noise(0.8,3000,800,0.03*l,3); }
 }catch(e){} }
function voice(t){ stopVoice(); if(SET.voice<=0) return; const f=voiceMap[hash(t)]; if(!f) return; const files=[].concat(f); let i=0;
 const nx=()=>{ if(i>=files.length){ voiceA=null; duck(false); return; } const a=new Audio('voice/'+files[i++]+'?v='+VER); a.volume=Math.min(1,SET.voice); voiceA=a; duck(true); a.onended=nx; a.onerror=nx; a.play().catch(()=>{voiceA=null;duck(false);}); }; nx(); }
function hasVoice(t){ return SET.voice>0&&!!voiceMap[hash(t)]; }
function stopVoice(){ if(voiceA){voiceA.onended=null; voiceA.pause(); voiceA=null; duck(false);} }
function unlockAudio(){ audioOK=true; try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); if(actx.state!=='running') actx.resume().catch(()=>{}); sfxLoad(); }catch(e){}
 if(!curTrack) music(); const a=curTrack; if(a&&a.paused) a.play().then(()=>afade(a,mvol(),600)).catch(()=>{}); }
function audioPlaying(){ return SET.music<=0||!MU||!musicKey()||(curTrack&&!curTrack.paused); }
['pointerup','touchend','click','keydown','mousedown'].forEach(ev=>addEventListener(ev,()=>{ if(!audioPlaying()||!audioOK) unlockAudio(); },{capture:true,passive:true}));
// ---------- Hinweise in 3 Stufen (Erzähler vage -> Mara Ort -> Mara Lösung), nichts leuchtet
let larryDone=false;
async function hintNow(auto){ const L=G.hints[S.node]||[]; const i=L.findIndex(e=>cond(e.if)); if(i<0) return; const e=L[i], key=S.node+'#'+i; let tier=S.hint[key]||0;
 if(auto){ if(tier>0) return; S.hint[key]=1; return say(e.t[0],'narrator'); }
 if(tier===0){ S.hint[key]=1; return say(e.t[0],'narrator'); }
 if(tier===1){ if(sceneT<TM.hintTier2After&&(S.fails[S.node]||0)<TM.hintTier2Fails) return act(G.config.lines.tooEarly); S.hint[key]=2; return say(e.t[1],'mara'); }
 S.hint[key]=3; await say(e.t[2],'mara'); if(!larryDone){ larryDone=true; await act(G.config.lines.larry); } }
// ---------- Klick-Logik
async function clickHotspot(h){ progress(); if(h.when!==undefined&&!cond(h.when)) return;
 if(h.trash){ if(S.sel){ const it=S.sel; S.sel=null; if(G.items[it].anchor) return act(G.config.lines.trashAnchor); S.inv=S.inv.filter(i=>i!==it); S.trash.push(it); sfx('step'); toast('🗑 '+G.items[it].name); return act(G.config.lines.trashIn); }
  if(S.trash.length){ let n=0; while(S.trash.length&&invCount()<G.config.invLimit){ S.inv.push(S.trash.shift()); n++; } if(!n) return act(G.config.lines.invFull); sfx('item'); return act(G.config.lines.trashOut); } return run(h.on); }
 if(S.sel){ const it=S.sel; S.sel=null; const w=h.with&&h.with[it]; if(w) return run(w);
  S.fails[S.node]=(S.fails[S.node]||0)+1; const itf=G.items[it].fail; if(itf&&Math.random()<0.6) return act(itf); return act(pick(G.config.failLines)); }
 return run(h.on); }
let dragUI=null;
function onClick(p){ unlockAudio();
 if(mode==='press'){ mode='title'; music(); return; }
 for(let i=ui.length-1;i>=0;i--) if(inR(p,ui[i].r)){ const u=ui[i]; if(u.drag){ dragUI=u; return u.drag(p); } sfx('click'); return u.fn(); }
 if(mode==='msg'){ if(typed(msg)<msg.t.length){ msg.t0=-1e9; return; } return closeMsg(); }
 if(mode==='dlg'&&dlg&&typedD()<dlg.t.length){ dlg.t0=-1e9; return; }
 if(mode!=='play') return;
 if(hover3) clickHotspot(hover3); else if(S.sel) S.sel=null; }
// ---------- Zeichnen (UI-Ebene)
function spk(s){ return (G.config.speakers[s]||['',''])[0]; } function spc(s){ return (G.config.speakers[s]||['','#8fe9ff'])[1]; }
function drawHUD(now){ const warn=S.time<=60; glass(24,20,170,58,16,warn?'rgba(255,60,60,0.9)':undefined);
 text(fmt(S.time),109,51,{s:40,w:700,a:'center',b:'middle',c:warn&&(now%1000<500)?'#ff5a5a':'#ff8fd8',ls:3});
 for(let i=0;i<3;i++){ x.beginPath(); x.arc(220+i*26,49,8,0,7); x.fillStyle=i<S.anchors.length?'#ffd27a':'rgba(255,255,255,0.15)'; x.fill(); }
 button([W-430,20,140,58],'💭 HINWEIS',()=>hintNow(),{s:18}); button([W-280,20,186,58],'📼 ZEIT-WALKMAN',()=>openWM(!wm.open),{s:20,active:wm.open}); button([W-82,20,58,58],'❚❚',()=>openPause(true),{s:20,ls:0});
 if(S.sel){ glass(W/2-220,20,440,50,25,'rgba(255,210,122,0.8)'); text(`${G.items[S.sel].icon}  ${G.items[S.sel].name} benutzen mit …`,W/2,46,{s:24,w:600,a:'center',b:'middle'}); }
 if(hover3&&mode==='play'){ const l=S.sel?`${G.items[S.sel].name} → ${hover3.label}`:hover3.label; x.font=`600 26px ${F}`; const w=x.measureText(l).width+50; glass(W/2-w/2,H-78,w,46,23); text(l,W/2,H-55,{s:26,w:600,a:'center',b:'middle'}); }
 drawToasts(now,96); if(DEBUG){ glass(24,H-60,700,40,10); text(`DEBUG ${S.node} · visits ${JSON.stringify(S.visits)} · loop ${S.loop} · slinky ${S.slinky.uses} · yaw ${(eyeYaw()*57.3).toFixed(0)}°`,40,H-34,{s:20,w:600,c:'#0f0'}); } }
function drawToasts(now,y0){ toasts=toasts.filter(q=>q.until>now); toasts.forEach((q,i)=>{ x.font=`600 24px ${F}`; const w=x.measureText(q.t).width+44; const a=Math.min(1,(q.until-now)/400);
 x.save(); x.globalAlpha=a; glass(W/2-w/2,y0+i*52,w,42,21,'rgba(255,210,122,0.8)'); text(q.t,W/2,y0+21+i*52,{s:24,w:600,a:'center',b:'middle'}); x.restore(); }); }
function typedD(){ const cps=SPEEDS[SET.speed][1]; return cps?Math.min(dlg.t.length,Math.floor((performance.now()-dlg.t0)/1000*cps)):dlg.t.length; }
function typeLines(t,n,mw,s){ x.font=`500 ${s}px ${F}`; const ls=wrap(t,mw); let left=n; return ls.map(l=>{ const k=Math.max(0,Math.min(l.length,left)); left-=l.length+1; return l.slice(0,k); }); }
function drawMsg(){ const col=spc(msg.speaker);
 if(!SET.subs&&hasVoice(msg.t)){ const w=420,X=W/2-w/2,Y=H-120; glass(X,Y,w,64,32); text(spk(msg.speaker)+'  🔊',X+34,Y+40,{s:22,w:700,c:col,ls:5}); return; }
 const X=160,Y=H-250,w=W-320,h=200; glass(X,Y,w,h,24); text(spk(msg.speaker),X+40,Y+44,{s:22,w:700,c:col,ls:6});
 let s=30; x.font=`500 ${s}px ${F}`; while(wrap(msg.t,w-80).length>4&&s>22){ s-=2; x.font=`500 ${s}px ${F}`; }
 const n=typed(msg); typeLines(msg.t,n,w-80,s).forEach((l,i)=>text(l,X+40,Y+88+i*s*1.25,{s}));
 if(n>=msg.t.length) text('▶ weiter',X+w-40,Y+h-22,{s:18,w:600,a:'right',c:'rgba(255,255,255,0.45)',ls:2}); }
function drawDlg(){ const n=dlg.n, opts=n.options.filter(o=>cond(o.cond)); const rows=Math.ceil(opts.length/2); const X=160,Y=H-200-rows*70,w=W-320,h=190; glass(X,Y,w,h,24);
 text(spk(n.speaker),X+40,Y+44,{s:22,w:700,c:spc(n.speaker),ls:6}); typeLines(n.text,typedD(),w-80,29).slice(0,4).forEach((l,i)=>text(l,X+40,Y+86+i*36,{s:29}));
 if(typedD()<n.text.length) return; const bw=(w-16)/2;
 opts.forEach((o,i)=>button([X+(i%2)*(bw+16),Y+h+16+Math.floor(i/2)*70,bw,58],o.label,()=>{ const r=dlg.res; r(o); },{s:o.tone?26:23,ls:1})); }
const TABS=[['inv','INVENTAR'],['map','KARTE'],['notes','NOTIZEN'],['opt','OPTIONEN']];
let prevMode='play';
function openWM(v){ if(v&&mode!=='play'&&mode!=='wm') return; if(v!==wm.open) sfxF(v?'inv_open':'inv_close'); if(v&&!MEM.seen.invbark){ MEM.seen.invbark=1; saveMem(); setTimeout(()=>{ const pm=mode; mode='play'; bark('invOpen',true); mode=pm; },300); } wm.open=v; wm.hover=-1; if(v){ prevMode='play'; mode='wm'; } else if(mode==='wm') mode=prevMode||'play'; }
function drawWM(now){ x.fillStyle='rgba(5,3,10,0.55)'; x.fillRect(0,0,W,H);
 const X=230,Y=100,w=W-460,h=700; glass(X,Y,w,h,30,'rgba(120,220,255,0.9)');
 x.save(); rr(X+30,Y+26,w-60,90,18); x.fillStyle='rgba(0,0,0,0.45)'; x.fill(); x.restore();
 text('ZEIT-WALKMAN',X+60,Y+82,{s:34,w:700,c:'#8fe9ff',ls:8}); text(fmt(S.time),X+w-60,Y+84,{s:48,w:700,a:'right',c:'#ff8fd8',ls:4});
 TABS.forEach(([k,l],i)=>button([X+40+i*200,Y+140,184,48],l,()=>{wm.tab=k;},{s:20,active:wm.tab===k})); button([X+w-110,Y+140,70,48],'✕',()=>openWM(false),{s:24});
 const cx=X+40,cy=Y+220,cw=w-80;
 if(wm.tab==='inv'){ const inv=S.inv.filter(i=>!G.items[i].anchor), N=G.config.invLimit, s=118,g=16; wm.hover=-1;
  text(`TASCHEN ${inv.length}/${N}`,cx,cy-8,{s:18,w:700,c:'rgba(255,255,255,0.5)',ls:4});
  const slots=inv.map(i=>[i,0]).concat(Array(Math.max(0,N-inv.length)).fill([null,0])).concat(S.anchors.map(a=>[a,1]));
  slots.forEach(([it,an],i)=>{ const r=[cx+i*(s+g)+(an?30:0),cy,s,s], hv=ptr.on&&inR(ptr,r)&&it; if(hv) wm.hover=it;
   rr(...r,12); x.fillStyle=an?'rgba(80,60,20,0.55)':'rgba(0,0,0,0.5)'; x.fill(); x.lineWidth=hv||S.sel===it&&it?3:1.5; x.strokeStyle=hv?'#ffd27a':it?(an?'rgba(255,210,122,0.9)':'rgba(180,170,220,0.6)'):'rgba(255,255,255,0.15)'; x.stroke();
   if(it){ text(G.items[it].icon,r[0]+s/2,r[1]+s/2+4,{s:58,a:'center',b:'middle'}); if(an) text('⚓',r[0]+s-16,r[1]+22,{s:18,a:'center'});
    if(!an) ui.push({r,fn:()=>{ const I=G.items[it];
     if(I.use==='slinky'&&!S.sel){ openWM(false); useSlinky(); return; }
     if(I.onUse&&!S.sel){ openWM(false); if(I.consume) S.inv=S.inv.filter(i=>i!==it); run(I.onUse); return; }
     if(S.sel&&S.sel!==it){ const a=S.sel; S.sel=null; openWM(false); const c=G.combos[a+'+'+it]||G.combos[it+'+'+a]; if(c) run(c); else { S.fails[S.node]=(S.fails[S.node]||0)+1; run([pick(G.config.comboFail)]); } } else { S.sel=it; openWM(false); toast(I.name+' ausgewählt'); } }}); } });
  const k=wm.hover; x.fillStyle='rgba(255,255,255,0.1)'; x.fillRect(cx,cy+150,cw,1.5);
  if(k){ const it=G.items[k]; text(it.name,cx,cy+210,{s:42,w:700,c:it.anchor?'#ffd27a':'#e8e4ff'}); x.font=`500 28px ${F}`; wrap(it.desc,cw).forEach((l,i)=>text(l,cx,cy+256+i*34,{s:28,c:'#d8d4ee'})); }
  else text(inv.length?'Zeig auf einen Gegenstand: auswählen, dann auf etwas in der Welt benutzen.':'Noch leer. Die Zeit wartet nicht.',cx,cy+210,{s:24,c:'rgba(255,255,255,0.5)'}); }
 if(wm.tab==='map'){ const eps=['hub','1972','1984','1989','2041'];
  eps.forEach((e,i)=>{ const r=[cx+i*(cw/5)+8,cy+30,cw/5-16,200], vis=S.visited[e], open=G.config.openEpochs.includes(e);
   glass(...r,18,vis?'rgba(255,210,122,0.8)':'rgba(255,255,255,0.2)');
   text(e==='hub'?'⌂':e,r[0]+r[2]/2,r[1]+80,{s:48,w:700,a:'center',c:vis?'#ffd27a':'rgba(255,255,255,0.25)'});
   text(open?G.config.epochs[e]:'bald',r[0]+r[2]/2,r[1]+130,{s:22,w:600,a:'center',c:vis?'#fff':'rgba(255,255,255,0.3)'});
   if(vis&&open&&G.nodes[S.node].epoch!==e) ui.push({r,fn:()=>{ openWM(false); epochJump(G.config.epochEntry[e]); }});
   if(G.nodes[S.node].epoch===e) text('◉ HIER',r[0]+r[2]/2,r[1]+175,{s:18,w:700,a:'center',c:'#ff8fd8',ls:3}); });
  text(`Anker: ${S.anchors.length}/3   ·   Schleife ${S.loop}   ·   Bonuszeit ${fmt(S.bonus)} / ${fmt(TM.maxBonus)}`,cx,cy+330,{s:26,w:600,c:'#ffd27a'}); }
 if(wm.tab==='notes'){ const ns=S.notes.slice(-9); if(!ns.length) text('Noch keine Notizen.',cx,cy+40,{s:24,c:'rgba(255,255,255,0.5)'}); ns.forEach((n,i)=>text('✎ '+n,cx,cy+40+i*44,{s:26,c:'#e8e4ff'})); }
 if(wm.tab==='opt') drawOptions(cx,cy-10,cw); }
function slider(X,Y,w,label,k){ text(label,X,Y+30,{s:28,w:600}); const tx=X+300,tw=w-300-90; const v=SET[k];
 rr(tx,Y+16,tw,12,6); x.fillStyle='rgba(255,255,255,0.12)'; x.fill(); rr(tx,Y+16,Math.max(12,tw*v),12,6); x.fillStyle='#ff5abe'; x.fill();
 x.beginPath(); x.arc(tx+tw*v,Y+22,15,0,7); x.fillStyle='#fff'; x.fill(); text(Math.round(v*100)+' %',X+w,Y+30,{s:24,w:700,a:'right',c:'#8fe9ff'});
 ui.push({r:[tx-16,Y-6,tw+32,56],drag:p=>{ SET[k]=Math.round(Math.max(0,Math.min(1,(p.x-tx)/tw))*20)/20; saveSet(); applyVolumes(); }}); }
function toggle(X,Y,w,label,on,fn){ text(label,X,Y+30,{s:28,w:600}); button([X+w-170,Y,170,46],on?'AN':'AUS',fn,{s:22,active:on}); }
function drawOptions(X,Y,w){ slider(X,Y,w,'Musik','music'); slider(X,Y+62,w,'Stimmen','voice'); slider(X,Y+124,w,'Effekte','sfx');
 toggle(X,Y+190,w,'Untertitel',SET.subs,()=>{ SET.subs=!SET.subs; saveSet(); });
 text('Textgeschwindigkeit',X,Y+282,{s:28,w:600}); const bw=102; SPEEDS.forEach(([l],i)=>button([X+w-4*bw-3*6+i*(bw+6),Y+252,bw,46],l,()=>{ SET.speed=i; saveSet(); },{s:17,ls:1,active:SET.speed===i}));
 toggle(X,Y+314,w,'Automatischer Erzähler-Hinweis',SET.hints,()=>{ SET.hints=!SET.hints; saveSet(); }); }
let pauseOpen=false,pauseTab='main',pausePrev='play';
function openPause(v){ if(v&&!['play','wm'].includes(mode)) return; if(v){ if(wm.open) openWM(false); pausePrev='play'; mode='pause'; pauseOpen=true; pauseTab='main'; } else if(pauseOpen){ pauseOpen=false; mode=pausePrev; } }
function drawPause(){ x.fillStyle='rgba(5,3,12,0.62)'; x.fillRect(0,0,W,H);
 const opt=pauseTab==='opt', w=opt?820:520,h=opt?600:560,X=W/2-w/2,Y=H/2-h/2; glass(X,Y,w,h,30,'rgba(120,220,255,0.9)');
 text(opt?'OPTIONEN':'PAUSE',X+44,Y+66,{s:40,w:700,c:'#8fe9ff',ls:10}); button([X+w-84,Y+26,56,48],'✕',()=>openPause(false),{s:22});
 if(opt){ drawOptions(X+44,Y+110,w-88); button([X+44,Y+h-66,200,46],'← ZURÜCK',()=>{pauseTab='main';},{s:20}); return; }
 [['▶  WEITERSPIELEN',()=>openPause(false)],['⚙  OPTIONEN',()=>{pauseTab='opt';}],['💾  SPEICHERN',()=>{ saveGame(); toast('💾 Gespeichert'); }],['★  CREDITS',()=>{ pauseOpen=false; showCredits(false,'pause'); }],['⌂  HAUPTMENÜ',()=>{ saveGame(); toTitle(); }]]
  .forEach(([l,fn],i)=>button([X+44,Y+106+i*80,w-88,60],l,fn,{s:24,rad:18}));
 text('COUNTDOWN PAUSIERT  ·  A/X = MENÜ  ·  B/Y = WALKMAN  ·  GRIFF = GREIFEN/WERFEN  ·  STICK = HINWEIS',X+w/2,Y+h-24,{s:14,w:700,a:'center',c:'rgba(255,255,255,0.4)',ls:3}); }
// ---------- Credits (Vortex: Delta FX)
const CREDITS=['REWIND – DIE ZEITSCHLEIFE','Idee & Regie: Pete','Spiel-Engine, Texte & Bau: Captain Chaos (Grok Bot)','Konzept & Rätsel-Handbuch: Zeitschleife VR',
 'Zeitstrudel-Video: „Time Vortex Collection REMASTERED“ von Delta FX – youtube.com/@deltafx43','Stimmen: ElevenLabs  ·  3D: A-Frame / three.js  ·  Mülleimer: Poly Haven (CC0)','Alle Hommagen sind Anspielungen. Keine Tiere wurden in Mikrowellen gesteckt.'];
function showCredits(sliceEnd,back){ credits={t0:performance.now(),sliceEnd,back:back||'title'}; mode='credits'; music(); }
function drawCredits(now){ x.fillStyle='rgba(4,2,8,0.9)'; x.fillRect(0,0,W,H); const t=(now-credits.t0)/1000;
 if(credits.sliceEnd) text('ENDE VON KAPITEL 1',W/2,120,{s:30,w:700,a:'center',c:'#ffd27a',ls:8});
 CREDITS.forEach((l,i)=>{ x.save(); x.globalAlpha=Math.min(1,Math.max(0,t*1.5-i*0.4)); text(l,W/2,210+i*68,{s:i?28:52,w:i?500:700,a:'center',c:i?'#e8e4ff':'#ff8fd8',ls:i?1:6}); x.restore(); });
 if(credits.sliceEnd) button([W/2-330,H-130,310,60],'▶ WEITERSPIELEN',()=>{ credits=null; mode='play'; music(); },{s:22});
 button([credits.sliceEnd?W/2+20:W/2-155,H-130,310,60],credits.back==='pause'?'← ZURÜCK':'⌂ HAUPTMENÜ',()=>{ const b=credits.back; credits=null; if(b==='pause'){ mode='pause'; pauseOpen=true; } else toTitle(); },{s:22}); }
// ---------- Titel
let titleImg=null, titleOpt=false;
function drawTitle(now){ if(!vrMode){ if(titleImg&&titleImg.complete&&titleImg.naturalWidth){ const s=Math.max(W/titleImg.naturalWidth,H/titleImg.naturalHeight); x.drawImage(titleImg,(W-titleImg.naturalWidth*s)/2,(H-titleImg.naturalHeight*s)/2,titleImg.naturalWidth*s,titleImg.naturalHeight*s); } }
 text('V3 · VORSCHAU',W-40,H-30,{s:20,w:700,a:'right',c:'rgba(255,210,122,0.8)',ls:6});
 if(mode==='press'){ const a=0.55+0.45*Math.sin(now/380); x.save(); x.globalAlpha=a; text('▶  KLICKEN ZUM STARTEN',W*0.3,H*0.78,{s:32,w:700,a:'center',c:'#fff',ls:8}); x.restore(); return; }
 if(titleOpt){ const w=820,h=560,X=W/2-w/2,Y=H/2-h/2; glass(X,Y,w,h,30,'rgba(120,220,255,0.9)'); text('OPTIONEN',X+44,Y+66,{s:40,w:700,c:'#8fe9ff',ls:10}); button([X+w-84,Y+26,56,48],'✕',()=>{titleOpt=false;},{s:22}); drawOptions(X+44,Y+110,w-88); return; }
 const X=130,Y=H*0.6,bw=360, can=hasSave(); glass(X-22,Y-22,bw+44,4*68+30,26);
 button([X,Y,bw,54],'NEUES SPIEL',()=>newGame(),{s:23,rad:14});
 button([X,Y+68,bw,54],'FORTSETZEN',()=>{ if(can) continueGame(); else toast('Noch kein Spielstand vorhanden'); },{s:23,rad:14});
 button([X,Y+136,bw,54],'OPTIONEN',()=>{titleOpt=true;},{s:23,rad:14}); button([X,Y+204,bw,54],'CREDITS',()=>showCredits(false),{s:23,rad:14});
 if(!audioPlaying()) text('🔇 Tippen für Ton',W-30,40,{s:22,w:600,a:'right',c:'#ffd27a'}); drawToasts(now,40); }
function toTitle(){ pauseOpen=false; wm.open=false; msg=null; dlg=null; stopVoice(); S=null; mode='title'; titleOpt=false; roomG.visible=false; $('titlesky').object3D.visible=vrMode; music(); }
async function startAt(node){ await buildRoom(node,eyeYaw()); roomG.visible=true; S.node=node; vhsT=1; mode='play'; music(); await enter(); }
async function newGame(){ localStorage.removeItem('zs3_save'); S=fresh(); S.notes=[]; mode='intro'; music(); $('titlesky').object3D.visible=false;
 if(!/[?&]nointro=1/.test(Q)) await playClip('intro_komplett'); await startAt(S.node); }
async function continueGame(){ let d; try{ d=JSON.parse(localStorage.zs3_save); }catch(e){} if(!d) return; S=Object.assign(fresh(),d.S); $('titlesky').object3D.visible=false; await startAt(S.node); }
async function newLoop(){ MEM.loops++; saveMem(); msg=null; dlg=null; stopVoice(); wm.open=false; const notes=S.notes; S=fresh(); S.notes=notes; mode='play';
 await act(G.config.lines.newLoop); if(MEM.loops===2) setTimeout(()=>bark('loop2',true),2500); if(MEM.loops===3) setTimeout(()=>bark('loop3',true),2500); await buildRoom(S.node,eyeYaw()); vhsT=1; await enter(); }
// ---------- Frame
let lastStepT=0;
function frame(now,noRaf){ lastStepT=performance.now(); const dt=Math.min(0.1,(now-last)/1000); last=now; ui=[];
 if(G&&sceneEl&&roomG){ x.clearRect(0,0,W,H); syncRoom(now);
  if(mode==='title'||mode==='press'){ drawTitle(now); }
  else if(mode==='credits') drawCredits(now);
  else if(S){
   if(['play','msg','dlg','trans','slinky'].includes(mode)){ S.time-=dt; idle+=dt; sceneT+=dt; if(idle<1) idleBarked=false; if(!idleBarked&&idle>(G.config.idleBark||45)&&mode==='play'){ idleBarked=true; bark(G.nodes[S.node].epoch==='1989'?'idle_1989':'idle_backrooms'); } for(const th of [600,300,60]) if(S.time<th&&S.time>th-5&&!timeBarked[th+'_'+MEM.loops]){ timeBarked[th+'_'+MEM.loops]=1; bark('time'+th,true); } if(S.time<=0){ S.time=0; newLoop(); }
    if(SET.hints&&idle>TM.idleHint&&mode==='play'){ idle=0; hintNow(true); } }
   if(mode==='play') pick3D(); else hover3=null; physStep(dt); gazeStep(dt); beaconStep(dt);
   if(vhsT>0&&window.ZSFX){ ZSFX.vhs(x,W,H,1-vhsT); vhsT=Math.max(0,vhsT-0.025); }
   if(mode==='clip'&&clipV){ drawClipSubs(); button([W-230,24,200,48],'ÜBERSPRINGEN ▶',()=>clipSkip&&clipSkip(),{s:18}); }
   else if(mode!=='intro'&&mode!=='vortex'){ drawHUD(now); if(mode==='msg'&&msg) drawMsg(); if(mode==='dlg'&&dlg) drawDlg(); if(mode==='wm') drawWM(now); if(mode==='pause') drawPause(); } }
  if(fadeA>0){ x.fillStyle=`rgba(0,0,0,${fadeA})`; x.fillRect(0,0,W,H); }
  drawCursor(); if(vrMode&&panelTex) panelTex.needsUpdate=true; placePanel(); }
 if(!noRaf) requestAnimationFrame(frame); }
function drawClipSubs(){ const subs=(G.config.clipSubs||{})[clipV.label]; if(!subs||!SET.subs) return; const t=clipV.currentTime; const c=subs.find(q=>t>=q[0]&&t<=q[1]); if(!c) return; text(c[3],W/2,H-100,{s:30,w:600,a:'center'}); }
function drawCursor(){ if(!ptr.on||vrMode) return; x.save(); x.translate(ptr.x,ptr.y); x.shadowColor='rgba(0,0,0,0.8)'; x.shadowBlur=6; x.fillStyle='#fff';
 if(S&&S.sel&&mode==='play') text(G.items[S.sel].icon,0,0,{s:36,a:'center',b:'middle'}); else { x.beginPath(); x.arc(0,0,hover3?8:5,0,7); x.fill(); } x.restore(); }
// ---------- 3D-Picking (Desktop: Maus/Touch-Strahl aus der Kamera; VR: Controller-Laser)
const rc=new (window.THREE.Raycaster)(); let desk={x:0,y:0,on:false};
function pick3D(){ if(vrMode){ hover3=vrHover; return; } if(!desk.on){ hover3=null; return; } if(ui.some(u=>inR(ptr,u.r))){ hover3=null; return; }
 rc.setFromCamera(new THREE.Vector2(desk.x,desk.y),sceneEl.camera); hover3=hitTest(); }
function hitTest(){ const vis=hitMeshes.filter(m=>{ let o=m; while(o){ if(o.visible===false&&!o.userData.hitOnly) return false; o=o.parent; } return true; });
 const hs=rc.intersectObjects(vis,false); for(const h of hs){ const s=h.object.userData.hs; if(s&&(s.when===undefined||cond(s.when))) return s; } return null; }
// ---------- Desktop-Eingabe: Ziehen = Umschauen, Tippen/Klicken = Interaktion
function fit(){ const s=Math.min(innerWidth/W,innerHeight/H); cv.style.width=W*s+'px'; cv.style.height=H*s+'px'; cv.style.left=(innerWidth-W*s)/2+'px'; cv.style.top=(innerHeight-H*s)/2+'px'; }
addEventListener('resize',fit); fit();
const toCv=e=>{ const r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}; };
let drag=null, yawD=0, pitchD=0;
function setDesk(e){ desk.x=e.clientX/innerWidth*2-1; desk.y=-(e.clientY/innerHeight)*2+1; desk.on=true; }
cv.addEventListener('pointerdown',e=>{ Object.assign(ptr,toCv(e),{on:true}); setDesk(e); drag={x:e.clientX,y:e.clientY,moved:false}; const p={...ptr};
 const u=ui.slice().reverse().find(u=>inR(p,u.r)); if(u&&u.drag){ dragUI=u; u.drag(p); drag=null; } });
cv.addEventListener('pointermove',e=>{ Object.assign(ptr,toCv(e),{on:true}); setDesk(e); if(dragUI&&e.buttons){ dragUI.drag({...ptr}); return; }
 if(drag&&e.buttons){ const dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(Math.abs(dx)+Math.abs(dy)>6) drag.moved=true; if(drag.moved){ yawD+=dx*0.005; pitchD=Math.max(-1.2,Math.min(1.2,pitchD+dy*0.005)); drag.x=e.clientX; drag.y=e.clientY; camEl.object3D.rotation.set(pitchD,yawD,0); } } });
cv.addEventListener('pointerup',e=>{ if(dragUI){ dragUI=null; return; } if(drag&&!drag.moved){ Object.assign(ptr,toCv(e),{on:true}); setDesk(e); if(mode==='play') pick3D(); onClick({...ptr}); } drag=null; });
cv.addEventListener('pointerleave',()=>{ ptr.on=false; desk.on=false; dragUI=null; });
cv.addEventListener('contextmenu',e=>{ e.preventDefault(); if(S) S.sel=null; });
addEventListener('keydown',e=>{ unlockAudio(); const k=e.key; if(mode==='press'){ mode='title'; music(); return; }
 if(k===' '&&clipSkip){ e.preventDefault(); return clipSkip(); } if(!S||mode==='title') return;
 if((k==='w'||k==='W'||k==='i'||k==='I')&&mode!=='pause') openWM(!wm.open); if(k==='h'||k==='H') { if(mode==='play') hintNow(); }
 if(k==='ArrowLeft'||k==='ArrowRight'){ yawD+=(k==='ArrowLeft'?1:-1)*0.3; camEl.object3D.rotation.set(pitchD,yawD,0); }
 if(k==='Escape'||k==='p'||k==='P'){ if(S.sel){ S.sel=null; return; } if(wm.open){ openWM(false); return; } openPause(mode!=='pause'); } });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&S&&mode==='play') openPause(true); });
// ---------- VR: Panel folgt dem Blick träge, Laser trifft erst UI auf dem Panel, sonst die unsichtbaren Trefferflächen im Raum
const vrM=new THREE.Matrix4(), vrPads={}, lasers={}; let vrHover=null, vrHov={}, activeSrc=null, boundSes=null, gotSelEvt=false, panelYaw=null, panelUI=false;
const MODAL=['msg','dlg','wm','pause','title','press','credits','clip'];
function placePanel(){ if(!panel) return; panel.visible=vrMode&&mode!=='vortex'&&mode!=='intro'||vrMode&&mode==='clip'; if(!panel.visible) return;
 const y=eyeYaw(), e=eyePos(); if(panelYaw===null) panelYaw=y; let d=Math.atan2(Math.sin(y-panelYaw),Math.cos(y-panelYaw));
 const lim=MODAL.includes(mode)?0.5:0.6; if(Math.abs(d)>lim) panelYaw+=d*0.06; if(MODAL.includes(mode)&&!panelUI){ panelYaw=y; } panelUI=MODAL.includes(mode);
 panel.position.set(e.x-Math.sin(panelYaw)*1.8,e.y-0.15,e.z-Math.cos(panelYaw)*1.8); panel.rotation.set(-0.08,panelYaw,0); }
function laser(key,col){ if(lasers[key]) return lasers[key]; const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]);
 const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:0.85,depthTest:false})); l.renderOrder=999; l.frustumCulled=false;
 const dot=new THREE.Mesh(new THREE.SphereGeometry(0.015,12,8),new THREE.MeshBasicMaterial({color:col,depthTest:false})); dot.renderOrder=1000;
 sceneEl.object3D.add(l); sceneEl.object3D.add(dot); return lasers[key]={l,dot}; }
function vrSelect(down,key){ try{ unlockAudio(); }catch(e){} if(key&&down&&held[key]){ grabPocket(key); return; } if(key&&down){ activeSrc=key; if(key in vrHov) vrHover=vrHov[key]; } if(down){ ptr.down=true; if(mode==='play'&&!uiAt()) { hover3=vrHover; } onClick({...ptr}); } else { ptr.down=false; dragUI=null; } }
function uiAt(){ return ptr.on&&ui.some(u=>inR(ptr,u.r)); }
AFRAME.registerComponent('zs-vr',{ tick(){ const sc=this.el, r=sc.renderer, xr=r&&r.xr; if(!xr||!xr.isPresenting) return;
 if(G&&performance.now()-lastStepT>20){ try{ frame(performance.now(),true); }catch(e){ console.error(e); } } // Quest pausiert window.rAF in XR
 const fr=xr.getFrame&&xr.getFrame(), ref=xr.getReferenceSpace&&xr.getReferenceSpace(), ses=xr.getSession(); if(!vrMode){ vrMode=true; } if(ses&&ses!==boundSes) bindSes(ses);
 Object.values(lasers).forEach(o=>{o.l.visible=false;o.dot.visible=false;}); if(!fr||!ref||!ses) return; let got=false; vrHover=null;
 for(const src of ses.inputSources){ const key=src.handedness||'none'; if(!src.targetRaySpace) continue; const pose=fr.getPose(src.targetRaySpace,ref); if(!pose) continue;
  vrM.fromArray(pose.transform.matrix); const o=new THREE.Vector3().setFromMatrixPosition(vrM), d=new THREE.Vector3(0,0,-1).transformDirection(vrM); (window.__rays=window.__rays||{})[key]={o:o.toArray(),d:d.toArray()};
  const L=laser(key,key==='left'?0x8fe9ff:0xff8fd8); rc.set(o,d); rc.far=40; let len=4, onUI=false, hs=null;
  if(panel.visible){ panel.updateMatrixWorld(); const h=rc.intersectObject(panel,false)[0]; if(h&&h.uv){ const p={x:h.uv.x*W,y:(1-h.uv.y)*H}; const isUI=MODAL.includes(mode)||ui.some(u=>inR(p,u.r));
    if(isUI){ onUI=true; len=h.distance; L.dot.position.copy(h.point); if(!activeSrc) activeSrc=key; if(key===activeSrc){ ptr.x=p.x; ptr.y=p.y; ptr.on=true; got=true; if(dragUI&&ptr.down) dragUI.drag({...ptr}); }
     L.dot.material.color.setHex(ui.some(u=>inR(p,u.r))?0x7dff9a:(key==='left'?0x8fe9ff:0xff8fd8)); } } }
  if(!onUI&&mode==='play'){ const hh=rc.intersectObjects(hitMeshes,false).find(q=>{ const s=q.object.userData.hs; let ok=s&&(s.when===undefined||cond(s.when)); let ob=q.object; while(ok&&ob){ if(ob.visible===false&&!ob.userData.hitOnly) ok=false; ob=ob.parent; } return ok; });
   if(hh){ len=hh.distance; L.dot.position.copy(hh.point); hs=hh.object.userData.hs; L.dot.material.color.setHex(0xffffff); } vrHov[key]=hs; if(key===activeSrc||!activeSrc){ activeSrc=key; vrHover=hs; if(!got) ptr.on=false; } }
  holdUpdate(key,o,d); L.l.position.copy(o); L.l.quaternion.setFromRotationMatrix(vrM); L.l.scale.set(1,1,len); L.l.visible=true; L.dot.visible=onUI||!!hs; L.dot.scale.setScalar(onUI||hs?1.4:1);
  const gp=src.gamepad; if(gp){ const prev=vrPads[key]||[]; const nw=gp.buttons.map(b=>b.pressed);
   if(!gotSelEvt&&gp.buttons[0]){ if(nw[0]&&!prev[0]) vrSelect(true,key); else if(!nw[0]&&prev[0]) vrSelect(false,key); }
   if(nw[1]&&!prev[1]) grabStart(key); if(!nw[1]&&prev[1]) grabEnd(key); if(nw[3]&&!prev[3]&&S&&mode==='play') hintNow();
   if(nw[4]&&!prev[4]&&S){ if(wm.open) openWM(false); openPause(mode!=='pause'); }
   if(nw[5]&&!prev[5]&&S&&['play','wm'].includes(mode)) openWM(!wm.open); vrPads[key]=nw; } }
 if(!got&&mode!=='play') ptr.on=false; } });
function bindSes(s2){ if(boundSes===s2) return; boundSes=s2; gotSelEvt=false; const onSel=e=>{ gotSelEvt=true; vrSelect(e.type==='selectstart',e.inputSource&&(e.inputSource.handedness||'none')); };
 s2.addEventListener('selectstart',onSel); s2.addEventListener('selectend',onSel); s2.addEventListener('end',()=>{ if(boundSes===s2) boundSes=null; }); }
function setupVR(){ const sc=sceneEl; sc.setAttribute('zs-vr','');
 sc.addEventListener('enter-vr',()=>{ vrMode=true; panelYaw=null; unlockAudio(); if(mode==='press'){ mode='title'; music(); } $('titlesky').object3D.visible=(mode==='title'); const s4=sc.renderer.xr.getSession(); if(s4) bindSes(s4); });
 sc.addEventListener('exit-vr',()=>{ vrMode=false; ptr.on=false; ptr.down=false; boundSes=null; panel.visible=false; $('titlesky').object3D.visible=false; });
 $('vrbtn').onclick=()=>{ unlockAudio(); if(mode==='press'){ mode='title'; music(); } sc.enterVR(); }; }
// ---------- Greifen & Werfen (VR, Griff-Taste): Raum-Items oder das ausgewählte Inventar-Item in die Hand; Abzug = einstecken; loslassen = werfen (Schwerkraft, Boden, Mülleimer)
const held={}, phys=[]; let dropK=0;
function grabStart(key){ if(held[key]||!S||mode!=='play') return; const hs=vrHov[key]; let g=null,item=null,hsd=null;
 if(hs&&hs.grab&&props[hs.prop]&&!props[hs.prop].userData.gone){ g=props[hs.prop]; hsd=hs; item=hs.item||hs.id; }
 else if(S.sel&&!G.items[S.sel].anchor&&G.items[S.sel].use!=='slinky'){ item=S.sel; S.sel=null; S.inv=S.inv.filter(i=>i!==item); g=mkProp({id:'hand',type:'item',item,pos:[0,0,0]}); propG.add(g); hsd={fromInv:true}; }
 if(!g) return; g.userData.held=true; g.visible=true; held[key]={g,item,hs:hsd,hist:[]}; sfxF('pickup',g)||sfx('click'); }
function holdUpdate(key,o,d){ const h=held[key]; if(!h) return; const p=o.clone().add(d.clone().multiplyScalar(0.12)); h.hist.push({t:performance.now(),p:p.clone()}); if(h.hist.length>8) h.hist.shift(); h.g.position.copy(propG.worldToLocal(p.clone())); }
function grabPocket(key){ const h=held[key]; if(!h) return false; delete held[key]; h.g.userData.held=false;
 if(h.hs.fromInv){ propG.remove(h.g); S.inv.push(h.item); toast('+ '+G.items[h.item].name); sfx('item'); } else { h.g.userData.gone=true; clickHotspot(h.hs); } return true; }
function grabEnd(key){ const h=held[key]; if(!h) return; delete held[key]; const a=h.hist[0], b=h.hist[h.hist.length-1]; const v=new THREE.Vector3();
 if(a&&b&&b.t>a.t) v.copy(b.p).sub(a.p).multiplyScalar(1000/(b.t-a.t)); v.clampLength(0,8); const w=new THREE.Vector3(); h.g.getWorldPosition(w);
 h.g.userData.held=false; h.g.userData.flying=true; v.length()>1.2?(sfxF('throw',h.g),Math.random()<0.35&&bark('throw')):(sfxF('drop',h.g,0.5),Math.random()<0.3&&bark('drop')); phys.push({...h,v,p:w,fl:roomG.position.y-1.6,node:S.node}); }
function physStep(dt){ for(let i=phys.length-1;i>=0;i--){ const q=phys[i]; if(q.node!==S.node){ phys.splice(i,1); continue; } q.v.y-=9.8*dt; q.p.addScaledVector(q.v,dt);
  const tr=props.eimer; if(tr){ const tp=new THREE.Vector3(); tr.getWorldPosition(tp); const dx=q.p.x-tp.x, dz=q.p.z-tp.z;
   if(Math.hypot(dx,dz)<0.24&&q.p.y<tp.y+0.62&&q.p.y>tp.y+0.05&&q.v.y<0){ phys.splice(i,1); q.g.userData.flying=false; q.g.userData.gone=true; q.g.visible=false;
    if(G.items[q.item].anchor){ S.anchors.includes(q.item)||S.anchors.push(q.item); act(G.config.lines.trashAnchor); continue; }
    if(q.hs.prop&&q.hs.when) run((q.hs.on||[]).filter(a=>a.set)); if(q.hs.dropped) run([{undrop:q.hs.dropped}]);
    S.trash.push(q.item); sfxF('trash_hit',props.eimer)||sfx('clack'); toast('🗑 '+G.items[q.item].name+' – Treffer!'); act(G.config.lines.trashThrow||G.config.lines.trashIn); continue; } }
  if(q.p.y<=q.fl){ q.p.y=q.fl; q.v.y*=-0.3; q.v.x*=0.55; q.v.z*=0.55; sfxF(q.item==='banane'?'banana':'bounce',q.g,Math.min(1,0.3+Math.abs(q.v.y)))||sfx('clack'); if(q.v.length()<0.35){ phys.splice(i,1); q.g.userData.flying=false; q.g.position.copy(propG.worldToLocal(q.p.clone()));
    if(q.hs.fromInv){ const k=++dropK+'_'+Date.now()%1e5; const lp=q.g.position.toArray(); (S.dropped[S.node]=S.dropped[S.node]||[]).push({k,item:q.item,pos:lp}); const hs={id:'dr_'+k,label:G.items[q.item].name,prop:'dr_'+k,item:q.item,grab:true,dropped:k,on:[{give:q.item},{undrop:k}]}; props['dr_'+k]=q.g; q.g.userData.prop={id:'dr_'+k}; q.g.traverse(o=>{ if(o.isMesh){ o.userData.hs=hs; hitMeshes.push(o);} }); }
    if(q.item==='banane') act(G.config.lines.bananaDrop); continue; } }
  q.g.position.copy(propG.worldToLocal(q.p.clone())); q.g.rotation.x+=dt*4; } }
// ---------- Blick-Reaktionen: lange auf eine Figur starren löst eine Reaktion aus (datengetrieben: hotspot.gaze)
let gazeH=null, gazeT=0; const rcG=new THREE.Raycaster();
function gazeStep(dt){ if(mode!=='play'){ gazeT=0; return; } const T=THREE, cam=(sceneEl.renderer.xr.isPresenting?sceneEl.renderer.xr.getCamera():sceneEl.camera), q=new T.Quaternion(); cam.getWorldQuaternion(q);
 rcG.set(eyePos(),new T.Vector3(0,0,-1).applyQuaternion(q)); const h=rcG.intersectObjects(hitMeshes,false).map(x=>x.object.userData.hs).find(s=>s&&s.gaze&&(s.when===undefined||cond(s.when)));
 if(h!==gazeH){ gazeH=h; gazeT=0; } if(!h) return; gazeT+=dt; const k=S.node+':'+h.id; if(gazeT>=(h.gaze.sec||4)){ gazeT=0; if(!S.gazed[k]){ S.gazed[k]=1; run(h.gaze.do); } else if(h.id==='mara') bark('gazeMara'); } }
// ---------- Raumklang als Hinweis: piepsende Items und summende Lampe, positionsgenau (WebAudio-Panner, HRTF)
let beepT=0, humNode=null;
function audioListener(){ if(!actx) return; const T=THREE, cam=(sceneEl.renderer.xr.isPresenting?sceneEl.renderer.xr.getCamera():sceneEl.camera), p=new T.Vector3(), q=new T.Quaternion(); cam.getWorldPosition(p); cam.getWorldQuaternion(q);
 const f=new T.Vector3(0,0,-1).applyQuaternion(q), u=new T.Vector3(0,1,0).applyQuaternion(q), L=actx.listener;
 if(L.positionX){ L.positionX.value=p.x; L.positionY.value=p.y; L.positionZ.value=p.z; L.forwardX.value=f.x; L.forwardY.value=f.y; L.forwardZ.value=f.z; L.upX.value=u.x; L.upY.value=u.y; L.upZ.value=u.z; } else { L.setPosition(p.x,p.y,p.z); L.setOrientation(f.x,f.y,f.z,u.x,u.y,u.z); } }
function panAt(g){ const p=new THREE.Vector3(); g.getWorldPosition(p); const pn=actx.createPanner(); pn.panningModel='HRTF'; pn.distanceModel='inverse'; pn.refDistance=0.6; pn.rolloffFactor=1.4; pn.positionX?(pn.positionX.value=p.x,pn.positionY.value=p.y,pn.positionZ.value=p.z):pn.setPosition(p.x,p.y,p.z); pn.connect(actx.destination); return pn; }
function beaconStep(dt){ if(!audioOK||!actx||SET.sfx<=0||!S||mode==='vortex') return; audioListener(); beepT+=dt; if(beepT<1.7) return; beepT=0;
 for(const k in props){ const g=props[k], it=g.userData.prop&&g.userData.prop.item; if(!it||!g.visible||!G.items[it].beacon) continue; const pn=panAt(g), t=actx.currentTime;
  [0,0.14].forEach(dl=>{ const o=actx.createOscillator(), gg=actx.createGain(); o.type='square'; o.frequency.value=2900; gg.gain.setValueAtTime(0.0001,t+dl); gg.gain.exponentialRampToValueAtTime(0.05*SET.sfx,t+dl+0.01); gg.gain.exponentialRampToValueAtTime(0.0001,t+dl+0.08); o.connect(gg); gg.connect(pn); o.start(t+dl); o.stop(t+dl+0.1); }); } }
function roomHum(){ try{ if(humNode){ humNode.stop(); humNode=null; } if(!audioOK||!actx) return; const n=G.nodes[S.node]; if(!n.hum||!props[n.hum]) return; audioListener();
 const o=actx.createOscillator(), g=actx.createGain(); o.type='sawtooth'; o.frequency.value=100; const f=actx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=380; g.gain.value=0.025*SET.sfx; o.connect(f); f.connect(g); g.connect(panAt(props[n.hum])); o.start(); humNode=o; }catch(e){} }
// ---------- Start
const VER=document.querySelector('meta[name=zs-ver]')?.content||'1';
async function boot(){ const J=async u=>(await fetch(u+'?v='+VER)).json(); G=await J('data/game3.json'); TM=G.config.timing; if(G.pool) for(const k in G.pool.items) G.items[k]=G.pool.items[k];
 try{ voiceMap=await J('voice/manifest.json'); }catch(e){} MU=await J('data/music.json');
 await Promise.all(['500','600','700'].map(w=>document.fonts.load(`${w} 30px Rajdhani`).catch(()=>{})));
 titleImg=new Image(); titleImg.src='stills/title.jpg?v='+VER;
 const sc=document.querySelector('a-scene'); await new Promise(r=>sc.hasLoaded?r():sc.addEventListener('loaded',r)); setupScene(); setupVR(); roomG.visible=false;
 const qn=(Q.match(/[?&]node=(\w+)/)||[])[1]; requestAnimationFrame(frame);
 if(qn&&G.nodes[qn]){ S=fresh(); await startAt(qn); return; }
 mode='press'; }
window.ZS={get S(){return S}, get G(){return G}, get mode(){return mode}, get msg(){return msg}, get dlg(){return dlg}, get hover(){return hover3}, run, go, epochJump, openWM, openPause, onClick, newGame, toTitle, closeMsg, hintNow, useSlinky, clickHotspot, grabStart, grabEnd, grabPocket, get held(){return held}, get phys(){return phys}, get props(){return props},
 choose:i=>{ if(dlg){ const f=dlg.n.options.filter(o=>cond(o.cond)); const o=f[Math.min(i,f.length-1)]; o&&dlg.res(o);} }, get dlgOpts(){ return dlg?dlg.n.options.filter(o=>cond(o.cond)).map(o=>o.label):null }, skip:()=>clipSkip&&clipSkip(), get clip(){return clipV&&clipV.label}, SET, unlockAudio, get vrMode(){return vrMode}, get audioOK(){return audioOK},
 get trackPlaying(){return !!curTrack&&!curTrack.paused}, get track(){return curTrack&&curTrack.src0}, setTime:t=>{S.time=t;}, eyeYaw, get roomYaw(){return roomYaw}, get lastVortexYaw(){return lastVortexYaw}, get hitMeshes(){return hitMeshes}, get MEM(){return MEM}, get voiceMap(){return voiceMap}, hash, get credits(){return credits}};
boot();
})();
