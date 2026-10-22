// Büro (Wohnung) Screenshots + Draw Calls. node shoot_buero.js [url] [outDir]
const puppeteer=require('puppeteer-core'); const fs=require('fs'); const path=require('path');
const URL=process.argv[2]||'http://127.0.0.1:8790/v3/test/era_wohnung.html'; const OUT=process.argv[3]||'/workspace/rewind_gfx/wohnung/buero_before';
// Kamerapositionen: Tür (Spawn) + Raummitte, je 4 Blickrichtungen (yaw 0 = -Z/Süd)
const ROOM=process.env.ROOM||'office'; const PP={office:{door:[38.8,1.6,1.45],mid:[40.3,1.6,0.6],desk:[40.6,1.35,-1.35]},living:{door:[19.0,1.6,-1.6],mid:[20.6,1.6,0.6],win:[22.6,1.6,0.9]},bedroom:{door:[1.3,1.6,1.4],mid:[0.0,1.6,0.3],win:[0.3,1.6,-1.2]},kitchen:{door:[-10.0,1.6,-0.4],mid:[-9.0,1.6,0.6],win:[-9.75,1.6,1.3]}}; const P=PP[ROOM]; const POS=(process.env.POS||Object.keys(P).join(',')).split(',');
const YAWS=[0,90,180,270]; const W=1280,H=720, WAIT=+process.env.WAIT||16000;
fs.mkdirSync(OUT,{recursive:true});
(async()=>{ const br=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required',`--window-size=${W},${H}`]});
 const pg=await br.newPage(); await pg.setViewport({width:W,height:H}); await pg.evaluateOnNewDocument(()=>{ try{ localStorage.setItem('zs_help_seen_v1','1'); }catch(e){} }); const errs=[];
 pg.on('pageerror',e=>errs.push(String(e.message).slice(0,200))); pg.on('console',m=>{ if(m.type()==='error'||/gfx/.test(m.text())) errs.push(m.text().slice(0,200)); });
 await pg.goto(URL,{waitUntil:'load',timeout:90000});
 await pg.addStyleTag({content:'#hud,#sub,#zsh,#zsh-btn,#tc-ui,.a-enter-vr,.a-enter-ar,.a-orientation-modal,.a-loader-title{display:none!important}'});
 await pg.waitForFunction(()=>window.__apt&&window.__apt.go&&document.querySelector('a-scene').renderer,{timeout:60000});
 await pg.evaluate((ROOMID)=>{ const s=document.querySelector('a-scene'), r=s.renderer; window.__dc=[]; const o=r.render.bind(r); r.render=function(a,b){ o(a,b); window.__dc.push(r.info.render.calls+'|'+r.info.render.triangles); if(window.__dc.length>60) window.__dc.shift(); };
  __apt.go(ROOMID); const c=document.getElementById('cam'); c.setAttribute('look-controls','enabled:false'); c.removeAttribute('wasd-controls'); },ROOM);
 await new Promise(r=>setTimeout(r,WAIT)); const log=[];
 for(const pk of POS) for(const yaw of YAWS){
  await pg.evaluate((p,yaw)=>{ const rig=document.getElementById('rig').object3D; rig.position.set(0,0,0); rig.rotation.set(0,0,0); const c=document.getElementById('cam').object3D; c.position.set(p[0],p[1],p[2]); c.rotation.set(-0.12,yaw*Math.PI/180,0,'YXZ'); window.__dc.length=0; },P[pk],yaw);
  await new Promise(r=>setTimeout(r,2500));
  const st=await pg.evaluate(()=>{ const d=window.__dc.slice(-8).map(s=>s.split('|').map(Number)); const s=document.querySelector('a-scene'); let L=0; s.object3D.traverse(o=>{ if(o.isLight&&o.visible&&(function v(x){ while(x){ if(!x.visible) return false; x=x.parent; } return true; })(o)) L++; }); return {calls:Math.max(...d.map(x=>x[0])),tris:d.length?d[d.length-1][1]:0,lights:L,textures:s.renderer.info.memory.textures}; });
  const f=path.join(OUT,`${({office:'buero',living:'wz',bedroom:'sz',kitchen:'kue'})[ROOM]}_${pk}_yaw${yaw}.png`); await pg.screenshot({path:f}); const e={pos:pk,yaw,...st}; log.push(e); console.log(JSON.stringify(e)); }
 // Interaktionen prüfen
 const chk=await pg.evaluate(()=>{ const O=__apt.ROOMS[__apt.room]; return {interact:(O.interact||[]).map(i=>i.name+':'+!!(i.hit&&i.hit.parent)),files:(O.files||[]).length,grabs:(O.grabs||[]).map(g=>g.name+':'+!!g.obj.parent).join(','),room:__apt.room}; });
 log.push({check:chk,errors:[...new Set(errs)].slice(0,15)}); console.log(JSON.stringify(log[log.length-1]));
 fs.writeFileSync(path.join(OUT,'drawcalls.json'),JSON.stringify(log,null,1)); await br.close(); })().catch(e=>{console.error(e);process.exit(1);});
