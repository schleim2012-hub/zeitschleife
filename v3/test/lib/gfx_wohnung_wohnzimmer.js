/* Grafik Wohnung – Wohnzimmer (80er/90er). Hängt sich an window.aptBuildLiving (lib/apt_living.js), ändert die Datei nicht.
   - Eiche-rustikal-Schrankwand (Blender, Look nach Grok-Ref C7): Unterschränke mit Kassettentüren/Schubladen, Bücherregal + LPs, Nische mit Häkeldeckchen
     (Ghettoblaster bleibt dasselbe Objekt), Glasvitrine mit Gläsern/Karaffe/Sammeltassen (+ 1 Glasscheibe), geschlossene Oberschränke, Kranz. 1 Draw (+1 Glas).
   - Cord-Sofa (3-Sitzer, Eiche-Armauflagen, Granny-Square-Decke) + passender Sessel: 1 Mesh/1 Draw. 29"-Röhren-TV mit Holzdekor + TV-Schrank + Videorekorder: 1 Draw;
     Bildschirm (scr), Klickflächen, Telefon, Rekorder, alle Greif-Objekte bleiben die Original-Objekte → Interaktionen unverändert.
   - Couchtisch (Eiche, gedrechselte Beine, Rauchglas), Stehlampe (Messing, Plisseeschirm), Perserteppich-Textur.
   - Fensterblick: Bild+Tiefe (lib/depthbg.js, Depth Anything V2) „Westberlin 1989 von oben“ (Grok C1_d) statt Canvas-Nacht.
   - Licht: gebackene Lightmap/AO (tools/bake), Echtzeit bleibt Stehlampe, TV, Laterne, Hemi (4). Abschalten: ?nogfx=1 · nur Lightmap aus: ?nobake=1 */
(function(){
if(/[?&]nogfx=1/.test(location.search)) return;
const LB='assets/apartment/living/';
const orig=window.aptBuildLiving; if(!orig){ console.warn('gfx_wz: aptBuildLiving fehlt'); return; }
const dropTris=(m,pred)=>{ const g=m.geometry, P=g.attributes.position, n=P.count, keep=[]; for(let i=0;i<n;i+=3){ const cx=(P.getX(i)+P.getX(i+1)+P.getX(i+2))/3, cy=(P.getY(i)+P.getY(i+1)+P.getY(i+2))/3, cz=(P.getZ(i)+P.getZ(i+1)+P.getZ(i+2))/3; if(!pred(cx,cy,cz)) keep.push(i); }
 if(keep.length*3===n) return 0; const T=THREE, ng=new T.BufferGeometry(); for(const k in g.attributes){ const a=g.attributes[k], s=a.itemSize, arr=new Float32Array(keep.length*3*s); keep.forEach((i,j)=>arr.set(a.array.subarray(i*s,(i+3)*s),j*3*s)); ng.setAttribute(k,new T.BufferAttribute(arr,s)); }
 ng.computeBoundingSphere(); g.dispose(); m.geometry=ng; return n/3-keep.length; };
const inB=(x,y,z,b)=>x>b[0]&&x<b[1]&&y>b[2]&&y<b[3]&&z>b[4]&&z<b[5];
window.aptBuildLiving=function(sc,K){ const R=orig(sc,K); try{ upgrade(sc,K,R); }catch(e){ console.warn('gfx_wz',e); } return R; };
function upgrade(sc,K,R){ const T=THREE, G=R.group, info=window.__gfxWZ={swapped:[],pending:0,dropped:{}};
 const byName=n=>{ let r=null; G.traverse(o=>{ if(!r&&o.isMesh&&o.name===n&&o.parent===G) r=o; }); return r; };
 const tune=(m,env)=>m.traverse(o=>{ if(o.isMesh&&o.material){ o.material.envMapIntensity=env==null?0.25:env; if(o.material.map) o.material.map.anisotropy=4; } });
 const place=(f,name,pos,ry,env,cb)=>{ info.pending++; K.gltf(LB+f,m=>{ const g=new T.Group(); g.add(m); g.position.set(...pos); g.rotation.y=ry||0; G.add(g); tune(m,env); m.traverse(o=>{ if(o.isMesh) o.name=name; }); if(cb) cb(m,g); info.pending--; info.swapped.push(f); }); };
 // ---- 1) Klotz-Geometrie aus den Sammel-Meshes schneiden ----
 const BOX={ wall:[17.9,18.56,-0.1,2.3,-2.34,0.14], table:[20.68,21.92,-0.1,0.43,-0.5,0.3], tvcab:[20.93,22.37,-0.1,0.51,1.89,2.385], tv:[21.15,22.15,0.5,1.25,1.7,2.5], vcr:[20.97,21.46,0.28,0.41,1.94,2.32], lamp:[22.85,23.25,-0.1,1.5,-2.15,-1.75] };
 const cut={ apt_wd:['wall','table','tvcab'], apt_mt:['wall','lamp'], apt_pl:['wall','tv','vcr'] };
 Object.entries(cut).forEach(([n,ks])=>{ const m=byName(n); if(m) info.dropped[n]=dropTris(m,(x,y,z)=>ks.some(k=>inB(x,y,z,BOX[k])&&!(k==='tvcab'&&y<0.072&&z>2.375)&&!(k==='wall'&&n==='apt_wd'&&x<18.03&&y<0.072&&z>0.1))); });
 G.traverse(o=>{ if(o.isMesh&&o.parent!==G&&/^apt_/.test(o.name)) o.name='wzn_'+o.name; }); // Unter-Batches (Ghettoblaster, Telefon): eindeutige Namen, sonst Lightmap-Warnung
 ['apt_so','apt_hk'].forEach(n=>{ const m=byName(n); if(m){ G.remove(m); m.geometry.dispose(); } });
 // ---- 2) Blender-Props ----
 place('wz_schrankwand.glb','wz_schrankwand',[18.49,0,-1.1],Math.PI/2,0.35,m=>m.traverse(o=>{ if(o.isMesh) o.material.color.multiplyScalar(1.35); }));
 const gl=new T.Mesh(new T.PlaneGeometry(0.77,1.17),new T.MeshStandardMaterial({color:0x8a9aa0,roughness:0.06,metalness:0.1,transparent:true,opacity:0.14,depthWrite:false,envMapIntensity:1.2}));
 gl.position.set(18.392,1.365,-0.3); gl.rotation.y=Math.PI/2; gl.name='wz_vitrine_glas'; G.add(gl);
 place('wz_polster.glb','wz_polster',[21.85,0,-1.94],0,0.15,m=>m.traverse(o=>{ if(o.isMesh) o.material.color.multiplyScalar(1.2); }));
 place('wz_tv.glb','wz_tv',[21.65,0,2.12],Math.PI,0.3);
 place('wz_table.glb','wz_table',[21.3,0,-0.1],0,0.4);
 place('wz_lamp.glb','wz_lamp',[23.05,0,-1.95],0,0.5);
 // Stehlampen-Schirm: Plissee statt glattem Kegelstumpf (gleiches Mesh/Material → Licht/Emission unverändert)
 G.children.forEach(o=>{ if(o.isMesh&&o.geometry.type==='CylinderGeometry'&&o.geometry.parameters.radiusBottom===0.26){ const g=new T.CylinderGeometry(0.17,0.26,0.3,72,1,true), P=g.attributes.position; for(let i=0;i<P.count;i++){ const x=P.getX(i), z=P.getZ(i), a=Math.atan2(z,x), k=1+0.035*Math.abs(Math.sin(a*18)); P.setX(i,x*k); P.setZ(i,z*k); } g.computeVertexNormals(); o.geometry.dispose(); o.geometry=g; o.name='wz_shade'; } });
 // Teppich: Perser-Textur (eigene, prozedural) statt Canvas
 G.children.forEach(o=>{ if(o.isMesh&&o.geometry.type==='PlaneGeometry'&&o.geometry.parameters.width===2.6&&o.material.map){ new T.TextureLoader().load((K.ROOT||'../')+LB+'rug.jpg',t=>{ t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; o.material.map=t; o.material.color.setHex(0xd8d0c8); o.material.needsUpdate=true; }); o.name='wz_rug'; } });
 // ---- 3) Fensterblick: Bild+Tiefe statt Canvas-Ebene ----
 const win=G.children.find(o=>o.isMesh&&o.material&&o.material.isMeshBasicMaterial&&o.material.fog===false&&o.geometry.parameters&&o.geometry.parameters.width===1.3);
 const mkView=()=>{ info.pending++; DepthBG.build({img:(K.ROOT||'../')+'sky/backdrop/wz_westberlin89.jpg',depth:(K.ROOT||'../')+'sky/backdrop/wz_westberlin89_depth.png',position:[0,0,0],hfov:84,aspect:2048/1254,near:9,far:75,fade:0.1,tint:0xd0d0d0,grid:[160,100]}).then(m=>{
   const g=new T.Group(); g.position.set(23.5+0.7,1.62,0.5); g.rotation.y=-Math.PI/2; m.rotation.x=-0.36; g.add(m); G.add(g); if(win){ G.remove(win); } info.view=true; info.pending--; }).catch(e=>{ console.warn('gfx_wz fenster',e); info.pending--; }); };
 if(window.DepthBG) mkView(); else { const s=document.createElement('script'); s.src='lib/depthbg.js?v=1'; s.onload=mkView; s.onerror=()=>console.warn('gfx_wz: depthbg.js fehlt'); document.head.appendChild(s); }
 // ---- 4) Licht: Hemi heller/wärmer (düster, nicht schwarz); Hauptlicht kommt aus der Lightmap ----
 const [lamp,tvL,street,hemi]=R.lights; hemi.intensity=0.55; hemi.color.setHex(0x7a7060); hemi.groundColor.setHex(0x30261a); street.intensity=0.5; street.position.set(23.95,2.25,0.5); // Laterne draußen: Rahmen/Laibung nicht mehr angestrahlt, Licht fällt nur nach innen
 const oTick=R.tick; R.tick=(now,dt)=>{ oTick(now,dt); lamp.intensity*=0.7; };
 // ---- 5) Lightmap/AO + Decals, wenn alles geladen ----
 const D=[[0,23.0,2.595,-1.95,0.9,0.8,'-y',0.3],[0,20.2,2.595,1.2,0.8,0.6,'-y',1.4],[4,21.8,0.45,-2.395,1.6,0.6,'+z',0],[4,18.005,0.4,1.7,1.0,0.7,'+x',0],[1,19.0,0,0.8,1.0,0.8,'y',0.4],
  [1,19.0,0,-1.6,0.9,0.6,'y',1.1],[5,22.2,0,0.6,1.2,0.5,'y',0.3],[7,23.495,2.4,0.5,1.4,0.3,'-x',0],[10,23.495,0.6,-1.5,0.8,0.6,'-x',0.2],[8,20.6,0,2.0,0.8,0.4,'y',0]];
 const fin=()=>{ if(info.pending>0||!info.view&&!info.viewFail){ setTimeout(fin,200); return; } if(!window.ZSBake){ console.warn('gfx_wz: bake_rt.js fehlt'); return; }
  const o={room:'liv',base:'../assets/bake/wohnung_wohnzimmer/',texRoot:'../assets/tex/realism/',lmGain:(+(location.search.match(/lmg=([\d.]+)/)||[])[1]||1.5),aoInt:0.6,specGain:4,decals:D,onBaked:n=>{ info.baked=n; }};
  info.fx=ZSBake.realism(G,sc,o); info.ready=true; if(/[?&]zsbroom=liv/.test(location.search)) setTimeout(()=>{ window.__ZSB={G,sc,o}; },2500); };
 setTimeout(()=>{ if(!info.view) setTimeout(()=>{ info.viewFail=!info.view; },6000); fin(); },50);
}
})();
