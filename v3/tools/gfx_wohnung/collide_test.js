// Sperrzonen-Test Schlafzimmer: 1) Teleport in jede Zone → nach 0,6 s muss der Kopf ≥ 0,3 m vom Möbel-Rechteck (ohne Rand) weg sein
// 2) WASD: von der Raummitte je 4 s auf Bett/Schrank/Kommode/Schreibtisch zulaufen (Taste W gedrückt) → minimaler Abstand protokollieren
// 3) Handy-Tippen: ZSTouch.walkTo in die Zonen (falls vorhanden). node collide_test.js URL
const puppeteer=require('puppeteer-core');
const URL=process.argv[2];
(async()=>{ const br=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=800,450']});
 const pg=await br.newPage(); await pg.setViewport({width:800,height:450}); await pg.evaluateOnNewDocument(()=>{ try{ localStorage.setItem('zs_help_seen_v1','1'); }catch(e){} });
 await pg.goto(URL,{waitUntil:'load',timeout:90000}); await pg.waitForFunction(()=>window.__apt&&__apt.ready&&window.__gfxSZ&&__gfxSZ.zones&&__gfxSZ.zones&&__apt.ROOMS.bedroom.solid.length>=10,{timeout:90000});
 await new Promise(r=>setTimeout(r,3000));
 // Möbel-Rechtecke ohne Rand (Zone minus 0,12, an Wänden nicht)
 const res=await pg.evaluate(async()=>{ const Z=__gfxSZ.zones, rig=document.getElementById('rig').object3D, cam=document.getElementById('cam').object3D; const out={tele:[],walk:[],touch:[]};
  const head=()=>{ const v=new THREE.Vector3(); cam.getWorldPosition(v); return v; };
  const dist=(p,z)=>{ const dx=Math.max(z[0]-p.x,0,p.x-z[1]), dz=Math.max(z[2]-p.z,0,p.z-z[3]); return Math.hypot(dx,dz); };
  const inner=z=>[z[0]<=-2.09?z[0]:z[0]+0.12, z[1]>=2.09?z[1]:z[1]-0.12, z[2]<=-1.99?z[2]:z[2]+0.12, z[3]>=1.99?z[3]:z[3]-0.12];
  const minD=p=>Math.min(...Z.map(z=>dist(p,inner(z))));
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  for(const z of Z){ const cx=(z[0]+z[1])/2, cz=(z[2]+z[3])/2; __apt.placeAt(cx,cz,0); await wait(700); const h=head(); out.tele.push({zone:z.join(','),pushed:[+h.x.toFixed(2),+h.z.toFixed(2)],minDist:+minD(h).toFixed(3)}); }
  return out; });
 // WASD: Ziel anvisieren, W halten
 const targets=[['Bett',-1.6,-1.0],['Schrank',-0.5,1.7],['Kommode',-1.85,0.55],['Schreibtisch',1.8,-0.25],['Nachttisch',-0.75,-1.75],['Rucksack',1.95,0.78],['Regal',1.7,-1.8]];
 for(const [n,tx,tz] of targets){
  await pg.evaluate((tx,tz)=>{ const sx=0.1, sz=0.2; const yaw=Math.atan2(-(tx-sx),-(tz-sz)); __apt.placeAt(sx,sz,0); const c=document.getElementById('cam'); const lc=c.components['look-controls']; if(lc){ lc.yawObject.rotation.y=yaw; lc.pitchObject.rotation.x=0; } c.object3D.rotation.set(0,yaw,0); window.__minD=9; window.__samp=setInterval(()=>{ const v=new THREE.Vector3(); c.object3D.getWorldPosition(v); const Z=__gfxSZ.zones; const inner=z=>[z[0]<=-2.09?z[0]:z[0]+0.12, z[1]>=2.09?z[1]:z[1]-0.12, z[2]<=-1.99?z[2]:z[2]+0.12, z[3]>=1.99?z[3]:z[3]-0.12]; const d=Math.min(...Z.map(z=>{ z=inner(z); return Math.hypot(Math.max(z[0]-v.x,0,v.x-z[1]),Math.max(z[2]-v.z,0,v.z-z[3])); })); window.__minD=Math.min(window.__minD,d); window.__last=[v.x,v.z]; },30); },tx,tz);
  await pg.keyboard.down('KeyW'); await new Promise(r=>setTimeout(r,3500)); await pg.keyboard.up('KeyW');
  const r=await pg.evaluate(()=>{ clearInterval(window.__samp); return {minDist:+window.__minD.toFixed(3),end:window.__last.map(v=>+v.toFixed(2))}; }); console.log(JSON.stringify({wasd:n,...r}));
 }
 // Handy-Tippen-zum-Gehen
 const tz=await pg.evaluate(async()=>{ const o=[]; if(!(window.ZSTouch&&ZSTouch.walkTo)) return 'kein ZSTouch.walkTo'; const cam=document.getElementById('cam').object3D;
  for(const [n,x,z] of [['Bett',-1.6,-1.0],['Schrank',-0.5,1.7],['Kommode',-1.85,0.55],['Schreibtisch',1.8,-0.25]]){ __apt.placeAt(0.1,0.2,0); await new Promise(r=>setTimeout(r,300)); ZSTouch.walkTo(x,z); let mn=9; for(let i=0;i<60;i++){ await new Promise(r=>setTimeout(r,60)); const v=new THREE.Vector3(); cam.getWorldPosition(v); const Z=__gfxSZ.zones; const inner=q=>[q[0]<=-2.09?q[0]:q[0]+0.12, q[1]>=2.09?q[1]:q[1]-0.12, q[2]<=-1.99?q[2]:q[2]+0.12, q[3]>=1.99?q[3]:q[3]-0.12]; mn=Math.min(mn,...Z.map(q=>{ q=inner(q); return Math.hypot(Math.max(q[0]-v.x,0,v.x-q[1]),Math.max(q[2]-v.z,0,v.z-q[3])); })); } o.push({touch:n,minDist:+mn.toFixed(3)}); } return o; });
 console.log(JSON.stringify(res.tele)); console.log(JSON.stringify(tz)); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
