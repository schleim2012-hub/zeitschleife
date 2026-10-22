/* Grafik Wohnung – Küche (Einbauküche späte 80er, „Eiche rustikal“). Hängt sich an window.buildMMKitchen (lib/mmk.js), ändert mmk.js/apt_*.js nicht; nur in era_wohnung.html geladen.
   - Klotz-Schränke/Herd/Kühlschrank/Spüle/Messer (mmk-Sammelmeshes wd/en/mt/dk) raus → eigene Blender-Modelle (Farbe+AO gebacken, je 1 Draw):
     kue_zeile (Unter-/Oberschränke mit Rahmen-Füllungstüren, Resopal-Platte mit Holzumleimer, Edelstahlspüle, Herd, Mikrowellen-Umbau, Messerleiste),
     kue_kuehl (Kühlschrank, Topf, Flyer/Postkarte), kue_ecke (Eckbank, Tisch mit Wachstuch, Stuhl, Zeitung …), kue_kram (Geschirr, Brotkasten, Kaffeemaschine, Dosen, Radio …).
     Alle Etiketten sind Parodien (Text per PIL, tools/gfx_wohnung/gen_kitchen_tex.py).
   - Raumhülle (mmk pl/fl) bleibt Geometrie, bekommt Raufaser/Bodenfliesen + Fliesenspiegel + gebackene Lightmap/AO (tools/bake, Präfix kue).
   - Interaktionen aus mmk bleiben unverändert (Zettel, Mikrowelle, Kettensäge, Tür), Helligkeit: CC-Faktor Kw (ddeb16e) wirkt weiter, Raum heller als vorher.
   - Sperrzonen: ROOMS.kitchen.solid (Hook über window.__apt, hardClamp +0,22 Kopfradius → ~0,34 m Abstand). Abschalten: ?nogfx=1 · ?nobake=1 */
(function(){
if(/[?&]nogfx=1/.test(location.search)) return;
const KB='../assets/apartment/kitchen/';
const orig=window.buildMMKitchen; if(!orig){ console.warn('gfx_kue: buildMMKitchen fehlt'); return; }
window.buildMMKitchen=function(sc,o){ const S=sc.object3D, before=new Set(S.children); const r=orig.apply(this,arguments); let up=null;
 try{ up=upgrade(sc,o,r,S.children.filter(c=>!before.has(c))); }catch(e){ console.warn('gfx_kue',e); }
 if(up&&r&&r.tick){ const t0=r.tick; r.tick=function(now,st,Kw){ t0.apply(this,arguments); try{ up.tick(now,st,Kw); }catch(e){} }; }
 return r; };
function upgrade(sc,o,KIT,added){ const T=THREE, S=sc.object3D, K=KIT.group, info=window.__gfxKUE={swapped:[],pending:0,removed:0};
 const IN=K.children.find(c=>c.isGroup&&!c.isMesh); if(!IN) throw 'IN fehlt';
 const TL=new T.TextureLoader(), tx=(f,srgb,cb)=>TL.load(KB+f,t=>{ if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; t.wrapS=t.wrapT=T.RepeatWrapping; if(cb) cb(t); });
 // ---- 1) mmk-Sammelmeshes nach Material erkennen: pl (Putz 0.92), fl (Boden 0.85) bleiben; wd/en/mt/dk raus ----
 const ms=IN.children.filter(m=>m.isMesh&&m.material&&m.material.isMeshStandardMaterial&&m.material.vertexColors&&m.geometry.attributes.color&&!m.matrixAutoUpdate);
 const rough=m=>Math.round(m.material.roughness*100);
 const pl=ms.find(m=>rough(m)===92), fl=ms.find(m=>rough(m)===85);
 ms.filter(m=>[70,45,34,35].includes(rough(m))).forEach(m=>{ IN.remove(m); m.geometry.dispose(); info.removed++; });
 if(pl){ pl.name='kue_wa'; const c=pl.geometry.attributes.color, p=pl.geometry.attributes.position, n=pl.geometry.attributes.normal;
  const WALL=new T.Color(0x8494b0), CEIL=new T.Color(0xd2cab6), TRIM=new T.Color(0xb4ac9c);
  for(let i=0;i<c.count;i++){ const r_=c.getX(i), g=c.getY(i), b=c.getZ(i); let col;
   if(p.getY(i)>2.59&&n.getY(i)<-0.5) col=CEIL; else if(b>g*1.25&&b>r_*1.5) col=WALL; else col=TRIM; c.setXYZ(i,col.r,col.g,col.b); }
  c.needsUpdate=true; const m=pl.material;
  tx('kue_raufaser.jpg',true,t=>{ m.map=t; m.needsUpdate=true; }); tx('kue_raufaser_n.jpg',false,t=>{ m.normalMap=t; m.normalScale.set(0.6,0.6); m.needsUpdate=true; }); m.roughnessMap=null; m.roughness=0.95; }
 if(fl){ fl.name='kue_fl'; const c=fl.geometry.attributes.color; for(let i=0;i<c.count;i++) c.setXYZ(i,1,1,1); c.needsUpdate=true; const m=fl.material;
  tx('kue_boden.jpg',true,t=>{ m.map=t; m.needsUpdate=true; }); tx('kue_boden_n.jpg',false,t=>{ m.normalMap=t; m.normalScale.set(0.8,0.8); m.needsUpdate=true; }); tx('kue_boden_r.jpg',false,t=>{ m.roughnessMap=t; m.roughness=0.75; m.needsUpdate=true; }); }
 // ---- 2) Modelle (Weltkoordinaten) ----
 const gltf=(f,cb)=>{ info.pending++; const el=document.createElement('a-entity'); el.setAttribute('gltf-model',KB+f); el.addEventListener('model-loaded',()=>{ const m=el.getObject3D('mesh'); if(m){ el.object3D.remove(m); try{ cb(m); }catch(e){ console.warn('gfx_kue',f,e); } } el.parentNode&&el.parentNode.removeChild(el); info.pending--; info.swapped.push(f); });
  el.addEventListener('model-error',()=>{ info.pending--; console.warn('gfx_kue: fehlt',f); }); sc.appendChild(el); };
 const put=(f,k)=>gltf(f,m=>{ m.traverse(x=>{ if(x.isMesh){ x.name=f.replace('.glb',''); x.material.envMapIntensity=0.25; if(x.material.map) x.material.map.anisotropy=8; if(k) x.material.color.multiplyScalar(k); x.matrixAutoUpdate=false; x.updateMatrix(); } }); m.updateMatrixWorld(true); IN.add(m); });
 put('kue_zeile.glb',1.0); put('kue_kuehl.glb',1.0); put('kue_ecke.glb',1.0); put('kue_kram.glb',1.0);
 // ---- 3) Fliesenspiegel (15er, beige mit Dekor) über der Arbeitsplatte, Fugen bündig ab 0,92 m ----
 { const P=[],UV=[],I=[]; const q=(a,b,c,d)=>{ const n=P.length/4; [a,b,c,d].forEach(v=>{ P.push(...v); UV.push(v[3]/1.2,(v[1]-0.92)/0.6); }); I.push(n,n+1,n+2,n,n+2,n+3); };
   const zN=2.494, Y0=0.92; [[-10.67,-10.37,1.52],[-10.37,-9.13,1.22],[-9.13,-7.0,1.52]].forEach(([a,b,yt])=>q([b,Y0,zN,-b],[a,Y0,zN,-a],[a,yt,zN,-a],[b,yt,zN,-b]));
   const xE=-7.006; q([xE,Y0,1.885,1.885],[xE,Y0,2.494,2.494],[xE,1.52,2.494,2.494],[xE,1.52,1.885,1.885]);
   const g=new T.BufferGeometry(); // P enthält [x,y,z,u] je Ecke → aufteilen
   const pos=[],uv=[]; for(let i=0;i<P.length;i+=4){ pos.push(P[i],P[i+1],P[i+2]); } for(let i=0;i<UV.length;i+=2) uv.push(UV[i],UV[i+1]);
   g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); g.setIndex(I); g.computeVertexNormals();
   const m=new T.MeshStandardMaterial({color:0xffffff,roughness:0.28,metalness:0}); tx('kue_fliesen.jpg',true,t=>{ m.map=t; m.needsUpdate=true; }); tx('kue_fliesen_n.jpg',false,t=>{ m.normalMap=t; m.needsUpdate=true; });
   const fz=new T.Mesh(g,m); fz.name='kue_fliesen'; IN.add(fz); info.tilesMat=m; }
 // ---- 4) Wandkalender (Okt. 1989, Fahrschule) über der Eckbank ----
 { const k=new T.Mesh(new T.PlaneGeometry(0.3,0.45),new T.MeshStandardMaterial({color:0xc8c0b4,roughness:0.8})); tx('kue_kalender.jpg',true,t=>{ t.wrapS=t.wrapT=T.ClampToEdgeWrapping; k.material.map=t; k.material.needsUpdate=true; });
   k.position.set(-11.5+0.004,1.56,-0.12); k.rotation.set(0,Math.PI/2,0.012); k.name='kue_kalender'; IN.add(k); }
 // ---- 5) Licht: Hemi/Glühbirne heller (düster, aber lesbar), Mond bleibt ----
 const spot=added.find(x=>x.isSpotLight), hemi=o.hemi, L2=o.L2;
 if(hemi){ hemi.color.setHex(0x7a7890); hemi.groundColor.setHex(0x3a2e24); }
 if(L2){ L2.decay=2; }
 const ST=window.__mmk;
 const tick=(now,st,Kw)=>{ const kin=ST?ST.inside:1; if(kin<=0.001) return;
  const B=info.baked>0; // mit Lightmap: Licht kommt gebacken (Cycles), Echtzeit nur Glanz/Flackern; ohne (?nobake=1): Echtzeit heller
  if(hemi) hemi.intensity=hemi.intensity+(B?0.08:0.42)*Kw*kin;
  if(L2&&kin>0.5){ const bI=L2.intensity/Math.max(1e-4,0.32*Kw*kin); L2.intensity*=B?1.6:4.2; L2.distance=6.0; if(B&&info.lmMats) info.lmMats.forEach(m=>{ m.lightMapIntensity=m.userData.lm0*(0.9+0.1*Math.min(1.2,bI)); }); }
  if(spot) spot.intensity*=B?0.35:0.7; };
 // ---- 6) Sperrzonen (x0,x1,z0,z1): Küchenzeile, Kühlschrank+Kiste, Eckbankgruppe, Treteimer ----
 const ZONES=[[-10.79,-7.0,1.675,2.5],[-11.5,-10.58,1.18,2.5],[-11.5,-10.38,-0.92,1.04],[-7.47,-7.0,1.36,2.5]];
 info.zoneRects=ZONES;
 const sol=()=>{ const R=window.__apt&&__apt.ROOMS&&__apt.ROOMS.kitchen; if(!R){ setTimeout(sol,200); return; } R.solid=R.solid||[]; R.solid.length=0; ZONES.forEach(z=>R.solid.push(z.slice())); info.zones=true; };
 setTimeout(sol,0);
 // ---- 7) Lightmap/AO (tools/bake, Präfix kue) ----
 const fin=()=>{ if(info.pending>0||info.swapped.length<4){ setTimeout(fin,200); return; } if(!window.ZSBake){ console.warn('gfx_kue: bake_rt.js fehlt'); return; }
  const op={room:'kue',base:'../assets/bake/wohnung_kueche/',texRoot:'../assets/tex/realism/',lmGain:(+(location.search.match(/lmg=([\d.]+)/)||[])[1]||0.7),aoInt:0.35,specGain:4,mats:{wa:pl&&pl.material,fl:fl&&fl.material},
   onBaked:n=>{ const L=[]; K.traverse(x=>{ if(x.isMesh&&x.material&&x.material.lightMap&&!L.includes(x.material)){ L.push(x.material); x.material.userData.lm0=x.material.lightMapIntensity; } }); info.lmMats=L; info.baked=n; }};
  info.fx=ZSBake.realism(K,sc,op); info.ready=true; if(/[?&]zsbroom=kue/.test(location.search)) setTimeout(()=>{ window.__ZSB={G:K,sc,o:op}; },4000); };
 setTimeout(fin,100);
 return {tick};
}
})();
