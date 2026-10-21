// Interaktionstest Büro: PC-Klickfläche per Raycast, PC-Start + Kaninchen, Akten, Tür-Klickfläche, RE-Überblendung (Screenshot mitten in der Tür)
const puppeteer=require('puppeteer-core'); const OUT=process.argv[3]||'/workspace/rewind_gfx/wohnung/after';
(async()=>{ const br=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1280,720']});
 const pg=await br.newPage(); await pg.setViewport({width:1280,height:720}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{ if(/gfx_buero|ZSBake/.test(m.text())) errs.push(m.text()); });
 await pg.goto(process.argv[2],{waitUntil:'load'}); await pg.addStyleTag({content:'#hud,.a-enter-vr,.a-enter-ar{display:none!important}'});
 await pg.waitForFunction(()=>window.__apt&&__apt.go,{timeout:60000}); await pg.evaluate(()=>{ try{ localStorage.removeItem('zs_apt_rabbit'); }catch(e){} __apt.rabbit=false; __apt.go('office'); }); await new Promise(r=>setTimeout(r,14000));
 const r1=await pg.evaluate(()=>{ const T=THREE, O=__apt.OFF, res={}; const cam=document.querySelector('a-scene').camera; const cp=new T.Vector3(40.6,1.3,-1.3);
  const ray=(obj)=>{ const c=new T.Vector3(); new T.Box3().setFromObject(obj).getCenter(c); const rc=new T.Raycaster(cp,c.clone().sub(cp).normalize(),0,6); return rc.intersectObject(obj,true).length>0; };
  res.pcHitRay=ray(O.interact[0].hit); res.files=O.files.map(f=>ray(f.hit));
  const dg=O.group.children.find(o=>o.isGroup&&o.userData&&o.userData.knob); const leaf=dg&&dg.children.find(o=>o.isMesh&&o.material&&o.material.visible===false); res.doorLeafHit=!!leaf&&(()=>{ const c=new T.Vector3(); new T.Box3().setFromObject(leaf).getCenter(c); const p=new T.Vector3(38.8,1.3,0.8); return new T.Raycaster(p,c.clone().sub(p).normalize(),0,6).intersectObject(leaf).length>0; })();
  res.knobInDoor=!!(dg&&dg.userData.knob.parent===dg); O.interact[0].fn(); return res; });
 await new Promise(r=>setTimeout(r,7000));
 const r2=await pg.evaluate(()=>({pcOn:__apt.OFF.pcIsOn(),rabbit:!!__apt.rabbit}));
 // PC-Bildschirm aus Stuhlsicht
 await pg.evaluate(()=>{ const c=document.getElementById('cam'); c.setAttribute('look-controls','enabled:false'); c.removeAttribute('wasd-controls'); const rig=document.getElementById('rig').object3D; rig.position.set(0,0,0); rig.rotation.set(0,0,0); c.object3D.position.set(40.62,1.22,-1.25); c.object3D.rotation.set(-0.35,Math.PI-0.1,0,'YXZ'); });
 await new Promise(r=>setTimeout(r,2500)); await pg.screenshot({path:OUT+'/buero_pc_on.png'});
 // Tür-Überblendung
 await pg.evaluate(()=>{ const c=document.getElementById('cam').object3D; c.position.set(38.8,1.6,1.2); c.rotation.set(0,0,0,'YXZ'); __apt.useDoor('living','o'); });
 await new Promise(r=>setTimeout(r,2600)); await pg.screenshot({path:OUT+'/buero_tuer_trans.png'});
 await new Promise(r=>setTimeout(r,4000)); const r3=await pg.evaluate(()=>({room:__apt.room,busy:__apt.busy}));
 console.log(JSON.stringify({...r1,...r2,afterDoor:r3,errors:errs.slice(0,10)})); await br.close(); })();
