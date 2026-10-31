// Warteraum Screenshots + Draw Calls. NODE_PATH=/workspace/rewind_gfx/shot/node_modules node shoot_warteraum.js [url] [outDir]
const puppeteer=require('puppeteer-core'); const fs=require('fs'); const path=require('path');
const URL=process.argv[2]||'http://127.0.0.1:8843/v3/test/era_warteraum.html?mute=1&v=2'; const OUT=process.argv[3]||'/workspace/rewind_gfx/beetlejuice/shots';
const W=+process.env.W||1280,H=+process.env.H||720, WAIT=+process.env.WAIT||20000;
const deg=Math.PI/180;
// [name, x,y,z, yaw°, pitch°, fov]
let V=[['row',0.7,1.45,0.15,92,-6,70],['counter',0.25,1.55,-0.7,-22,-3,70],['noexit',1.7,1.5,-0.9,162,-5,70],['sofa',-0.6,1.5,0.2,-100,-8,70],
 ['spawn0',0.3,1.6,1.7,0,-5,80],['spawn90',0.3,1.6,1.7,90,-5,80],['spawn180',0.3,1.6,1.7,180,-5,80],['spawn270',0.3,1.6,1.7,270,-5,80],
 ['mid0',0,1.6,0,0,-5,80],['mid90',0,1.6,0,90,-5,80],['mid180',0,1.6,0,180,-5,80],['mid270',0,1.6,0,270,-5,80],
 ['f_oma',-1.4,1.25,1.55,95,-12,50],['f_gruen',-1.4,1.3,0.95,95,-12,50],['f_brand',-1.45,1.3,0.15,95,-12,50],['f_jaeger',-1.5,1.2,-1.5,100,-14,50],
 ['f_taucher',-0.5,1.3,1.1,160,-15,55],['f_assi',1.35,1.3,0.2,-90,-12,55],['f_frl',1.05,1.5,-1.45,-6,-4,50]];
if(process.env.XV) V=V.concat(JSON.parse(process.env.XV));
if(process.env.VIEWS) V=V.filter(v=>process.env.VIEWS.split(',').includes(v[0]));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{ const br=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist',`--window-size=${W},${H}`]});
 const pg=await br.newPage(); await pg.setViewport({width:W,height:H}); const errs=[];
 pg.on('pageerror',e=>errs.push(String(e.message).slice(0,200))); pg.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') errs.push(m.text().slice(0,200)); });
 await pg.goto(URL,{waitUntil:'load',timeout:90000});
 await pg.addStyleTag({content:'#hud,#zsh,#zsh-btn,#ff,#grain,.a-enter-vr,.a-enter-ar,.a-orientation-modal,.a-loader-title{display:none!important}'});
 await pg.waitForFunction(()=>window.__wr&&window.__wr.ready,{timeout:90000});
 await pg.evaluate(()=>{ const s=document.querySelector('a-scene'), r=s.renderer; window.__dc=[]; const o=r.render.bind(r); r.render=function(a,b){ o(a,b); window.__dc.push(r.info.render.calls+'|'+r.info.render.triangles); if(window.__dc.length>60) window.__dc.shift(); };
  const c=document.getElementById('cam'); c.setAttribute('look-controls','enabled:false'); c.removeAttribute('wasd-controls'); const cm=s.components.warteraum; cm.clamp=()=>{}; });
 await new Promise(r=>setTimeout(r,WAIT)); const log=[];
 for(const [n,x,y,z,yaw,pitch,fov,js] of V){
  await pg.evaluate((x,y,z,yaw,pitch,fov)=>{ const rig=document.getElementById('rig').object3D; rig.position.set(0,0,0); rig.rotation.set(0,0,0); const ce=document.getElementById('cam'); const c=ce.object3D; c.position.set(x,y,z); c.rotation.set(pitch*Math.PI/180,yaw*Math.PI/180,0,'YXZ'); const cam=ce.getObject3D('camera'); cam.fov=fov; cam.updateProjectionMatrix(); window.__dc.length=0; },x,y,z,yaw,pitch,fov);
  if(js) await pg.evaluate(js); // optionaler 8. Eintrag: JS vor dem Bild (z. B. Klingel)
  await new Promise(r=>setTimeout(r,js?3500:2200));
  const st=await pg.evaluate(()=>{ const d=window.__dc.slice(-6).map(s=>s.split('|').map(Number)); return {calls:Math.max(...d.map(x=>x[0])),tris:d.length?d[d.length-1][1]:0,tex:document.querySelector('a-scene').renderer.info.memory.textures}; });
  await pg.screenshot({path:path.join(OUT,n+'.png')}); const e={view:n,...st}; log.push(e); console.log(JSON.stringify(e)); }
 log.push({errors:[...new Set(errs)].slice(0,20)}); console.log(JSON.stringify(log[log.length-1]));
 fs.writeFileSync(path.join(OUT,'drawcalls.json'),JSON.stringify(log,null,1)); await br.close(); })().catch(e=>{console.error(e);process.exit(1);});
