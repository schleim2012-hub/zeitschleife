/* Grafik Wohnung – Akte-X-Büro. Hängt sich an window.aptBuildOffice (lib/apt_office.js) und window.aptDoorTrans (lib/apt_doortrans.js), ändert beide Dateien nicht.
   - 90er-PC: eigener Blender-Bau (beiger CRT 15", Mini-Tower mit CD/Diskette/LEDs, Tastatur mit Einzeltasten, Maus, Kabel), 1 Draw. PC-Gruppe, Bildschirm (pcScr),
     LED und Klickfläche (pcHit) bleiben dieselben Objekte → „Folge dem weißen Kaninchen“ funktioniert unverändert.
   - Aktenschrank-Reihe (4×4 Schubladen, Bügelgriffe, Etiketten, Schloss, eine offene Schublade mit Hängeregister), 1 Draw, statt der Klotz-Schränke.
   - Bürotür: kassettiertes Holzblatt (Blender) statt Platte + 2 Leisten; Klinke/Rosette bleiben. Tür in der RE-Überblendung: gleiches Blatt + Zarge (unbeleuchtet, gleiche Helligkeitsrampe).
   - Licht: gebackene Lightmap/AO (tools/bake, Blender) mit Schreibtischlampe, Diaprojektor, glimmender Leuchtstoffröhre; Echtzeit: Lampe, CRT, Projektor, Hemi (4).
   - Schmutz-Decals (1 Draw). Abschalten: ?nogfx=1 · nur Lightmap aus: ?nobake=1 */
(function(){
if(/[?&]nogfx=1/.test(location.search)) return;
const OB='assets/apartment/office/';
const origOff=window.aptBuildOffice; if(!origOff){ console.warn('gfx_buero: aptBuildOffice fehlt'); return; }
const TPL={}; // geladene GLB-Szenen (für die Tür-Überblendung)
// Dreiecke eines nicht-indizierten Batch-Meshes entfernen, deren Mittelpunkt pred() erfüllt
const dropTris=(m,pred)=>{ const g=m.geometry, P=g.attributes.position, n=P.count, keep=[]; for(let i=0;i<n;i+=3){ const cx=(P.getX(i)+P.getX(i+1)+P.getX(i+2))/3, cy=(P.getY(i)+P.getY(i+1)+P.getY(i+2))/3, cz=(P.getZ(i)+P.getZ(i+1)+P.getZ(i+2))/3; if(!pred(cx,cy,cz)) keep.push(i); }
 if(keep.length*3===n) return 0; const T=THREE, ng=new T.BufferGeometry(); for(const k in g.attributes){ const a=g.attributes[k], s=a.itemSize, arr=new Float32Array(keep.length*3*s); keep.forEach((i,j)=>arr.set(a.array.subarray(i*s,(i+3)*s),j*3*s)); ng.setAttribute(k,new T.BufferAttribute(arr,s)); }
 ng.computeBoundingSphere(); g.dispose(); m.geometry=ng; return n/3-keep.length; };
window.aptBuildOffice=function(sc,K){ const R=origOff(sc,K); try{ upgrade(sc,K,R); }catch(e){ console.warn('gfx_buero',e); } return R; };
function upgrade(sc,K,R){ const T=THREE, G=R.group, info=window.__gfxBuero={swapped:[],pending:0,dropped:{}};
 const byName=n=>{ let r=null; G.traverse(o=>{ if(!r&&o.isMesh&&o.name===n&&o.parent===G) r=o; }); return r; };
 const tune=(m,rough,env)=>m.traverse(o=>{ if(o.isMesh&&o.material){ o.material.envMapIntensity=env==null?0.25:env; if(rough!=null) o.material.roughness=rough; if(o.material.map) o.material.map.anisotropy=4; } });
 const load=(f,cb)=>{ info.pending++; K.gltf(OB+f,m=>{ TPL[f]=m; try{ cb(m); }catch(e){ console.warn('gfx_buero',f,e); } info.pending--; info.swapped.push(f); }); };
 // ---- 1) Aktenschränke: Klotz-Korpus raus, Griffe/Etiketten aus den Sammel-Meshes schneiden ----
 const cb=byName('apt_cb'); if(cb){ G.remove(cb); cb.geometry.dispose(); }
 const inCab=(x,y,z)=>x>41.9&&x<42.0&&y<1.34&&z>-1.95&&z<0.02;
 ['apt_mt','apt_pa'].forEach(n=>{ const m=byName(n); if(m) info.dropped[n]=dropTris(m,inCab); });
 load('office_cabinets.glb',m=>{ const g=new T.Group(); g.add(m); g.position.set(42.0,0,-0.95); g.rotation.y=-Math.PI/2; G.add(g); tune(m,null,0.35); m.traverse(o=>{ if(o.isMesh) o.name='off_cabinets'; }); });
 // ---- 2) Röhren-PC: Bau-Meshes der PC-Gruppe ersetzen, interaktive Objekte bleiben ----
 const pcHit=R.interact&&R.interact[0]&&R.interact[0].hit, PC=pcHit&&pcHit.parent;
 if(PC){ const scr=PC.children.find(o=>o.isMesh&&o.material&&o.material.map&&o.material.map.isCanvasTexture);
  const led=PC.children.find(o=>o.isMesh&&o.geometry&&o.geometry.type==='CircleGeometry');
  PC.children.filter(o=>o.isMesh&&/^apt_/.test(o.name)).forEach(o=>{ PC.remove(o); o.geometry.dispose(); });
  if(scr) scr.position.set(0,0.2205,0.126); if(led) led.position.set(-0.31,0.185,0.2);
  pcHit.geometry.dispose(); pcHit.geometry=new T.BoxGeometry(0.88,0.46,0.6); pcHit.position.set(-0.16,0.22,0.0);
  load('office_pc.glb',m=>{ PC.add(m); tune(m,null,0.3); m.traverse(o=>{ if(o.isMesh) o.name='off_pc'; }); }); }
 // ---- 3) Bürotür (wird in apt_main direkt nach dem Builder angelegt → nächster Tick) ----
 load('office_door_leaf.glb',()=>{}); load('office_door_frame.glb',()=>{});
 const doorSwap=()=>{ const tpl=TPL['office_door_leaf.glb']; const dg=G.children.find(o=>o.isGroup&&o.userData&&o.userData.knob); if(!dg||!tpl) return false;
  dg.children.filter(o=>o.isMesh&&o!==dg.userData.knob).forEach(o=>{ o.geometry.computeBoundingBox(); const b=o.geometry.boundingBox; if(b.max.x-b.min.x<0.3) return;
   if(b.max.z-b.min.z>0.03) o.material.visible=false;   // altes Blatt bleibt als (unsichtbare) Klickfläche für apt_main erhalten
   else dg.remove(o); });                                 // aufgesetzte Leisten
  const w=dg.userData.w||0.9, m=tpl.clone(); m.scale.set((w-0.04)/0.9,2.03/2.05,0.04/0.045); m.position.set(0,0.01,0); dg.add(m); tune(m,null,0.2); m.traverse(o=>{ if(o.isMesh) o.material.color.multiplyScalar(1.4); }); m.traverse(o=>{ if(o.isMesh) o.name='off_door'; }); info.door=true; return true; };
 const tryDoor=()=>{ if(!doorSwap()) setTimeout(tryDoor,150); }; setTimeout(tryDoor,0);
 // ---- 4) glimmende Leuchtstoffröhre (vorher tot): schwacher Kaltlicht-Schimmer, Licht nur gebacken ----
 const tube=new T.Mesh(new T.CylinderGeometry(0.018,0.018,1.18,8),new T.MeshBasicMaterial({color:0x4a5660,toneMapped:false})); tube.rotation.z=Math.PI/2; tube.position.set(40.25,2.55-0.1,0.4); tube.name='off_tube'; G.add(tube);
 // ---- 5) Licht: Lampe/Projektor etwas zurück (Hauptteil kommt aus der Lightmap), Hemi heller (düster, nicht schwarz) ----
 const [lampS,crtL,projS,hemi]=R.lights; hemi.intensity=0.6; hemi.color.setHex(0x7a7468); hemi.groundColor.setHex(0x2e261c);
 // zu dunkle Albedos (Teppich fast schwarz, Holzpaneel schwarzbraun) etwas anheben, damit im Halbdunkel noch Struktur bleibt
 const fl=byName('apt_fl'), wd=byName('apt_wd'); if(fl) fl.material.color.multiplyScalar(1.7); if(wd) wd.material.color.multiplyScalar(1.8);
 const oTick=R.tick; const LK=0.6; R.tick=now=>{ oTick(now); lampS.intensity*=LK; projS.intensity*=0.8; tube.material.color.setHex((Math.sin(now*0.0031)+Math.sin(now*0.017))>1.85?0x2a3038:0x4a5660); };
 // ---- 6) Lightmap/AO + Decals, wenn alle GLBs da sind ----
 const D=[[0,40.2,2.545,-1.2,0.9,0.7,'-y',0.4],[0,41.6,2.545,1.3,0.6,0.5,'-y',1.9],[4,39.2,0.42,-1.995,1.4,0.8,'+z',0],[4,42.495,0.4,1.0,1.2,0.8,'-x',0],[4,38.005,0.4,0.0,1.0,0.75,'+x',0],
  [1,38.8,0,1.6,1.0,0.8,'y',0.3],[1,40.5,0,-1.1,1.1,0.7,'y',1.2],[5,39.6,0,0.6,1.4,0.5,'y',0.6],[7,42.49,2.3,-1.0,1.6,0.3,'-x',0],[10,38.005,1.9,1.2,0.8,0.6,'+x',0.2],[10,41.4,2.0,-1.995,0.7,0.6,'+z',2.1],[8,38.8,0,1.95,0.9,0.4,'y',0]];
 const fin=()=>{ if(info.pending>0||!info.door){ setTimeout(fin,200); return; } if(!window.ZSBake){ console.warn('gfx_buero: bake_rt.js fehlt'); return; }
  info.fx=ZSBake.realism(G,sc,{room:'off',base:'../assets/bake/wohnung_buero/',texRoot:'../assets/tex/realism/',lmGain:(+(location.search.match(/lmg=([\d.]+)/)||[])[1]||1.5),aoInt:0.6,specGain:4,decals:D,onBaked:n=>{ info.baked=n; }}); info.ready=true; };
 setTimeout(fin,50);
}
// ---- Tür in der RE-Überblendung: gleiches Holzblatt + Zarge, unbeleuchtet, folgt der Helligkeitsrampe ----
const origTr=window.aptDoorTrans;
if(origTr) window.aptDoorTrans=function(sc,o){ const S=sc.object3D, before=new Set(S.children); const ok=origTr(sc,o); if(!ok) return ok;
 try{ const T=THREE, D=S.children.find(c=>!before.has(c)&&c.isGroup&&c.name==='aptTrans'); const L=TPL['office_door_leaf.glb'], F=TPL['office_door_frame.glb']; if(!D||!L||!F) return ok;
  const hinge=D.children.find(c=>c.isGroup); const leaf=hinge&&hinge.children.find(c=>c.isMesh&&c.geometry.parameters&&c.geometry.parameters.width>=0.8); if(!leaf) return ok;
  const frames=D.children.filter(c=>c.isMesh&&c.geometry.parameters&&c.geometry.parameters.depth===0.14);
  const mats=[]; const unlit=src=>{ const m=src.clone(); m.traverse(x=>{ if(x.isMesh){ const mm=new T.MeshBasicMaterial({map:x.material.map,fog:false,transparent:true}); mm.color.setScalar(0); x.material=mm; mats.push(mm); } }); return m; };
  const nl=unlit(L); nl.position.set(0.45,0,0); hinge.add(nl); leaf.visible=false;
  const nf=unlit(F); D.add(nf); frames.forEach(f=>f.visible=false);
  const ref=leaf.material; (window.__aptTicks||(window.__aptTicks=[])).push(()=>{ if(!D.parent) return false; mats.forEach(m=>{ m.color.copy(ref.color).multiplyScalar(1.35); m.opacity=ref.opacity; }); return true; });
 }catch(e){ console.warn('gfx_buero tür',e); }
 return ok; };
})();
