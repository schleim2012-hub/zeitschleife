// Sperrzonen-Test Schlafzimmer (SwiftShader: wenige fps → alles in Ticks statt Millisekunden).
// 1) Teleport (placeAt) in jede Zonenmitte → nach 3 Ticks muss der Kopf ≥ 0,3 m vom Möbel-Rechteck weg sein.
// 2) Laufen: pro Tick 7 cm Richtung Möbel (= Stick 1,4 m/s bei 50 ms; derselbe Weg wie WASD/Handy-Tippen, alle laufen über A.tick → hardClamp), 45 Ticks; minimaler Abstand.
// 3) Handy: ZSTouch.walkTo (mit ?touch=1). node collide_test.js URL
const puppeteer=require('puppeteer-core'); const URL=process.argv[2];
(async()=>{ const br=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=200,112']});
 const pg=await br.newPage(); await pg.setViewport({width:200,height:112}); await pg.evaluateOnNewDocument(()=>{ try{ localStorage.setItem('zs_help_seen_v1','1'); }catch(e){} });
 await pg.goto(URL,{waitUntil:'load',timeout:90000}); await pg.waitForFunction(()=>window.__apt&&__apt.ready&&window.__gfxSZ&&__gfxSZ.zones===true,{timeout:120000});
 const out=await pg.evaluate(async()=>{ const Z=__gfxSZ.zoneRects, cam=document.getElementById('cam').object3D, rig=document.getElementById('rig').object3D; let n=0, step=null;
  const ot=__apt.tick; __apt.tick=function(t,dt){ n++; if(step) step(); return ot.apply(this,arguments); };
  const ticks=k=>new Promise(r=>{ const s=n; const f=()=>{ if(n>=s+k) r(); else setTimeout(f,30); }; f(); });
  const head=()=>{ const v=new THREE.Vector3(); cam.getWorldPosition(v); return v; };
  const inner=z=>[z[0]<=-2.09?z[0]:z[0]+0.12, z[1]>=2.09?z[1]:z[1]-0.12, z[2]<=-1.99?z[2]:z[2]+0.12, z[3]>=1.99?z[3]:z[3]-0.12];
  // Möbelkanten = Zone ohne 0,12-Rand (an Wänden bündig)
  const minD=p=>Math.min(...Z.map(z=>{ z=inner(z); return Math.hypot(Math.max(z[0]-p.x,0,p.x-z[1]),Math.max(z[2]-p.z,0,p.z-z[3])); }));
  const res={tele:[],walk:[],touch:null};
  for(const z of Z){ __apt.placeAt((z[0]+z[1])/2,(z[2]+z[3])/2,0); await ticks(3); const h=head(); res.tele.push({zone:z.join(','),to:[+h.x.toFixed(2),+h.z.toFixed(2)],minDist:+minD(h).toFixed(3)}); }
  const T=[['Bett',-1.6,-1.0],['Bett-Fuß',-1.6,0.0],['Schrank',-0.5,1.7],['Kommode',-1.85,0.55],['TV',-1.6,1.5],['Schreibtisch',1.8,-0.25],['Stuhl',1.3,-0.2],['Nachttisch',-0.75,-1.75],['Rucksack',1.95,0.78],['Regal',1.7,-1.8],['Wäsche',0.85,-1.75],['Papierkorb',1.9,-1.25]];
  for(const [nm,tx,tz] of T){ if(__apt.room!=='bedroom'){ __apt.go('bedroom'); await ticks(5); } __apt.placeAt(0.1,0.2,0); await ticks(2); let mn=9;
   step=()=>{ const h=head(); const dx=tx-h.x, dz=tz-h.z, L=Math.hypot(dx,dz)||1; rig.position.x+=dx/L*0.07; rig.position.z+=dz/L*0.07; };
   for(let i=0;i<45;i++){ await ticks(1); mn=Math.min(mn,minD(head())); } step=null; const h=head(); res.walk.push({to:nm,minDist:+mn.toFixed(3),end:[+h.x.toFixed(2),+h.z.toFixed(2)],room:__apt.room}); }
  if(window.ZSTouch&&ZSTouch.walkTo){ res.touch=[]; for(const [nm,tx,tz] of T.slice(0,8)){ if(__apt.room!=='bedroom'){ __apt.go('bedroom'); await ticks(5); } __apt.placeAt(0.1,0.2,0); await ticks(2); ZSTouch.walkTo(tx,tz); let mn=9; for(let i=0;i<40;i++){ await ticks(1); mn=Math.min(mn,minD(head())); } const h=head(); res.touch.push({to:nm,minDist:+mn.toFixed(3),end:[+h.x.toFixed(2),+h.z.toFixed(2)]}); } }
  return res; });
 console.log(JSON.stringify(out,null,0).replace(/\},\{/g,'},\n{')); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
