/* Grafik Wohnung – Schlafzimmer (Jugendzimmer späte 80er). Hängt sich an window.build84 (lib/k84.js), ändert k84.js/apt_*.js nicht; nur in era_wohnung.html geladen.
   - Kiefer-Jugendbett mit Regal-Kopfteil (Bücher, Wecker, Kassetten) statt Klotz-Gestell/-Matratze; Bettdecke, Kissen, Teddy bleiben (Original-Objekte).
   - Schreibtisch (Kiefer, Schubladen-Container, Schreibunterlage, Stifteköcher) statt Platte + 4 Stäben; Stuhl, Lampe, Kassette bleiben.
   - TV-Rollwagen (Chrom, schwarze Böden, Rollen, Videorekorder) statt Batch-Kisten; Fernseher (crt-tv) unverändert.
   - Neu: weiße Lack-Kommode mit Radiorekorder + Kassetten an der linken Wand (Kollision ergänzt).
   - Fensterblick: Bild+Tiefe (lib/depthbg.js, Depth Anything V2) „Hinterhof von oben“ (Grok C2_a), grobes Raster 96×56, statt Canvas-Schichten.
   - Neu: Kiefer-Kleiderschrank (Koffer/Schuhkarton oben, Poster an der Tür), Kram (Turnschuhe, Rucksack, Wäschehaufen, Comic-Stapel, Papierkorb),
     Pinnwand + Wandkalender Okt. 1989 (Text per PIL), geflochtener Flickenteppich statt Ring-Kreis, Bettdecke ohne durchstoßende Matratze, Kissen neu, Neon gedämpft.
   - Sperrzonen: ROOMS.bedroom.solid (apt_main, Hook über window.__apt) mit ~0,34 m Abstand zu allen großen Möbeln (0,12 Rand + 0,22 Kopfradius aus hardClamp).
   - Licht: gebackene Lightmap/AO + Grunge (tools/bake); Echtzeit bleibt Schreibtischlampe, Neon, Mond, Hemi (4). Abschalten: ?nogfx=1 · ?nobake=1 */
(function(){
if(/[?&]nogfx=1/.test(location.search)) return;
const SB='assets/apartment/bedroom/';
const orig=window.build84; if(!orig){ console.warn('gfx_sz: build84 fehlt'); return; }
window.build84=function(sc){ const S=sc.object3D, before=new Set(S.children); const r=orig.apply(this,arguments);
 try{ const G=S.children.find(o=>!before.has(o)&&o.isGroup&&!o.el); const added=S.children.filter(o=>!before.has(o)); if(G) upgrade(sc,G,added); }catch(e){ console.warn('gfx_sz',e); } return r; };
function upgrade(sc,G,added){ const T=THREE, S=sc.object3D, info=window.__gfxSZ={swapped:[],pending:0,removed:0};
 const gltf=(f,cb)=>{ info.pending++; const el=document.createElement('a-entity'); el.setAttribute('gltf-model','../'+SB+f); el.addEventListener('model-loaded',()=>{ const m=el.getObject3D('mesh'); if(m){ el.object3D.remove(m); try{ cb(m); }catch(e){ console.warn('gfx_sz',f,e); } } el.parentNode&&el.parentNode.removeChild(el); info.pending--; info.swapped.push(f); }); el.addEventListener('model-error',()=>{ console.warn('gfx_sz glb',f); info.pending--; }); sc.appendChild(el); };
 const tune=(m,name,k)=>m.traverse(o=>{ if(o.isMesh){ o.name=name; o.material.envMapIntensity=0.25; if(o.material.map) o.material.map.anisotropy=4; if(k) o.material.color.multiplyScalar(k); } });
 const put=(f,name,par,pos,ry,k)=>gltf(f,m=>{ const g=new T.Group(); g.add(m); g.position.set(...pos); g.rotation.y=ry||0; par.add(g); tune(m,name,k); });
 // ---- 1) Klotz-Möbel aus der k84-Gruppe entfernen (über Box-Maße erkannt) ----
 const near=(a,b)=>Math.abs(a-b)<0.006; const isBox=(o,w,h,d)=>{ const p=o.geometry&&o.geometry.type==='BoxGeometry'&&o.geometry.parameters; return p&&near(p.width,w)&&near(p.height,h)&&near(p.depth,d); };
 const KILL=[[0.93,0.28,2.0],[0.97,0.85,0.05],[0.97,0.45,0.04],[0.89,0.16,1.94],[0.6,0.03,1.3],[0.04,0.73,0.04],[0.5,0.16,0.42]];
 G.children.filter(o=>o.isMesh&&KILL.some(k=>isBox(o,...k))).forEach(o=>{ G.remove(o); o.geometry.dispose(); info.removed++; });
 // ---- 2) Modelle ----
 put('sz_bett.glb','sz_bett',G,[-1.615,0,-0.96],0,1.1);
 put('sz_tisch.glb','sz_tisch',G,[1.78,0,-0.25],0,1.1);
 put('sz_kommode.glb','sz_kommode',G,[-1.63,0,0.55],Math.PI/2,1.0);
 // TV-Wagen: bedExtra wird in apt_main direkt nach build84 angelegt → nächster Tick
 const wagen=()=>{ const be=S.getObjectByName('bedExtra'); if(!be||!be.children.length){ setTimeout(wagen,100); return; } be.children.filter(o=>o.isMesh).forEach(o=>{ be.remove(o); o.geometry.dispose(); }); put('sz_wagen.glb','sz_wagen',be,[0,0,0],0,1.2); };
 setTimeout(wagen,0);
 // ---- 3) Fensterblick: Canvas-Schichten (hinter der Wand) raus, Bild+Tiefe rein ----
 G.children.filter(o=>o.isMesh&&o.material&&o.material.isMeshBasicMaterial&&o.material.fog===false&&o.position.z<-3).forEach(o=>{ G.remove(o); });
 const mkView=()=>{ info.pending++; DepthBG.build({img:'../sky/backdrop/sz_hinterhof.jpg',depth:'../sky/backdrop/sz_hinterhof_depth.png',position:[0,0,0],hfov:88,aspect:2048/1031,near:6,far:28,fade:0.1,tint:0xe0e0e0,grid:[96,56]}).then(m=>{
   const g=new T.Group(); g.position.set(0.45,1.6,-2.0-0.6); m.rotation.x=-0.5; g.add(m); G.add(g); info.view=true; info.pending--; }).catch(e=>{ console.warn('gfx_sz fenster',e); info.pending--; info.viewFail=true; }); };
 if(window.DepthBG) mkView(); else { let s=document.querySelector('script[src*="depthbg.js"]'); if(!s){ s=document.createElement('script'); s.src='lib/depthbg.js?v=1'; document.head.appendChild(s); }
  const wait=()=>{ if(window.DepthBG) mkView(); else if(Date.now()-t0>15000) info.viewFail=true; else setTimeout(wait,100); }, t0=Date.now(); wait(); }
 put('sz_schrank.glb','sz_schrank',G,[-0.5,0,1.70],0,1.05);
 put('sz_kram.glb','sz_kram',G,[0,0,0],0,1.0);
 // ---- 3b) Raumhülle benennen (Lightmap-Empfänger), Bettdecke/Kissen, Teppich, Neon, Wandsachen ----
 const shell=G.children.filter(o=>o.isMesh&&o.material&&o.material.vertexColors&&o.geometry.type==='BufferGeometry'); ['sz_fl','sz_ce','sz_wa'].forEach((n,i)=>{ if(shell[i]) shell[i].name=n; });
 const TL=new T.TextureLoader(), tx=(f,cb)=>TL.load('../'+SB+f,t=>{ t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; if(cb) cb(t); });
 if(shell[2]) tx('sz_tapete.jpg',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; shell[2].material.map=t; shell[2].material.needsUpdate=true; }); // Tapete: Streifen mit Rautenblüte, Papierfaser (gen_bedroom_tex.py) statt fleckiger Kachel
 G.children.forEach(o=>{ if(!o.isMesh) return; const g=o.geometry, pr=g.parameters||{};
  if(g.type==='PlaneGeometry'&&pr.widthSegments===24&&pr.heightSegments===40){ // Bettdecke: Matratze darf nicht durchstoßen, Fußende hängt über
   const P=g.attributes.position, hw=pr.width/2; for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), ax=Math.abs(x); let lim=ax<0.4?-0.012:-0.012-Math.pow((ax-0.4)/(hw-0.4),2)*0.17; let z=Math.max(P.getZ(i),lim);
    if(y<-pr.height/2+0.12) z-=Math.pow((-pr.height/2+0.12-y)/0.12,2)*0.12; P.setZ(i,z); } g.computeVertexNormals(); o.name='sz_decke'; }
  else if(g.type==='SphereGeometry'&&pr.widthSegments===24&&pr.heightSegments===12&&o.position.y>0.5){ // Kissen: Kissenform (Ecken), Baumwolle statt Putz-Textur
   const ng=new T.SphereGeometry(1,40,20), P=ng.attributes.position; for(let i=0;i<P.count;i++){ const v=[P.getX(i),P.getY(i),P.getZ(i)].map(c=>Math.sign(c)*Math.pow(Math.abs(c),0.55)); const sq=1-0.22*Math.pow(Math.abs(v[0]*v[2]),1.5); P.setXYZ(i,v[0]*0.31,v[1]*0.075*sq,v[2]*0.2); } ng.computeVertexNormals();
   g.dispose(); o.geometry=ng; o.scale.set(1,1,1); o.position.y=0.555; o.material=new T.MeshStandardMaterial({color:0xd8d2c4,roughness:0.95,normalMap:o.material.normalMap||null}); TL.load('../assets/tex/k84/fabric_n.jpg',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(3,2); o.material.normalMap=t; o.material.needsUpdate=true; }); o.name='sz_kissen'; }
  else if(g.type==='CircleGeometry'&&Math.abs(pr.radius-0.85)<1e-3){ tx('sz_rug.png',t=>{ o.material.map=t; o.material.color.setHex(0xc8c0b8); o.material.needsUpdate=true; }); o.scale.set(1.12,0.78,1); o.position.set(0.0,0.006,0.15); o.name='sz_teppich'; }
  else if(g.type==='PlaneGeometry'&&Math.abs(pr.width-0.75)<1e-3&&Math.abs(pr.height-0.28)<1e-3&&o.material.blending===T.AdditiveBlending){ o.material.color.setHex(0x6a6a6a); o.name='sz_neon'; }
  else if(g.type==='PlaneGeometry'&&Math.abs(pr.width-0.5)<1e-3&&Math.abs(pr.height-0.72)<1e-3&&o.position.z>1.9){ o.position.set(-0.25,1.33,1.385); o.scale.set(0.8,0.8,1); o.rotation.z=-0.01; o.name='sz_poster_schrank'; }
 });
 added.forEach(o=>{ if(o.isPointLight&&o.color.getHex()===0xff3fae){ o.intensity=0.28; o.distance=2.2; } if(o.isPointLight&&o.color.getHex()===0xffb070){ o.intensity=1.7; } }); // Neon nur noch Akzent; Schreibtischlampe: Rest kommt aus der Lightmap (sonst doppelt)
 { const m=new T.Mesh(new T.BoxGeometry(0.8,0.55,0.022),new T.MeshStandardMaterial({color:0xb0a898,roughness:0.85})); tx('sz_pinboard.jpg',t=>{ m.material.map=t; m.material.needsUpdate=true; });
   m.position.set(2.1-0.012,1.36,-0.22); m.rotation.y=-Math.PI/2; m.name='sz_pinnwand'; G.add(m);
   const k=new T.Mesh(new T.PlaneGeometry(0.3,0.45),new T.MeshStandardMaterial({color:0xb8b0a4,roughness:0.8})); tx('sz_kalender.jpg',t=>{ k.material.map=t; k.material.needsUpdate=true; });
   k.position.set(0.52,1.52,2.0-0.004); k.rotation.set(0,Math.PI,0.015); k.name='sz_kalender'; G.add(k); }
 // ---- 3c) Sperrzonen (x0,x1,z0,z1) – hardClamp addiert 0,22 Kopfradius → ~0,34 m Abstand ----
 const ZONES=[[-2.1,-1.01,-2.0,0.18],[-1.12,-0.38,-2.0,-1.38],[1.36,2.1,-1.02,0.52],[0.98,1.62,-0.55,0.15],[1.18,2.1,-2.0,-1.43],[1.64,2.1,-1.5,-1.0],
  [-2.1,-1.51,0.03,1.07],[-2.1,-1.03,0.93,2.0],[-1.12,0.12,1.29,2.0],[0.6,1.1,-2.0,-1.5],[-1.1,-0.8,-0.7,-0.4],[-1.02,-0.6,0.35,0.8],[1.7,2.1,0.55,1.0]];
 window.__gfxSZ.zones=ZONES;
 const sol=()=>{ const R=window.__apt&&__apt.ROOMS&&__apt.ROOMS.bedroom; if(!R){ setTimeout(sol,200); return; } R.solid=R.solid||[]; R.solid.length=0; ZONES.forEach(z=>R.solid.push(z.slice())); info.zones=true; };
 setTimeout(sol,0);
 // ---- 4) Licht: Hemi etwas heller/wärmer (düster, nicht schwarz) ----
 const hemi=added.find(o=>o.isHemisphereLight); if(hemi){ hemi.intensity=0.5; hemi.color.setHex(0x5a5068); hemi.groundColor.setHex(0x2a2018); }
 // ---- 5) Lightmap/AO + Grunge + Decals ----
 const D=[[0,0.4,2.495,-0.3,0.9,0.8,'-y',0.3],[0,-1.4,2.495,1.2,0.8,0.6,'-y',1.4],[4,-0.6,0.4,1.995,1.4,0.7,'-z',0],[4,2.095,0.45,0.9,1.0,0.7,'-x',0],[1,1.4,0,1.5,1.0,0.8,'y',0.4],
  [1,0.3,0,-1.4,0.9,0.6,'y',1.1],[5,-0.8,0,0.6,1.2,0.5,'y',0.3],[7,0.45,2.4,-1.995,1.4,0.3,'+z',0],[10,-2.095,1.9,0.6,0.8,0.6,'+x',0.2],[8,0.9,0,0.2,0.8,0.4,'y',0]];
 const fin=()=>{ if(info.pending>0||!(info.view||info.viewFail)||info.swapped.length<6){ setTimeout(fin,200); return; } if(!window.ZSBake){ console.warn('gfx_sz: bake_rt.js fehlt'); return; }
  const o={room:'sz',base:'../assets/bake/wohnung_schlafzimmer/',texRoot:'../assets/tex/realism/',lmGain:(+(location.search.match(/lmg=([\d.]+)/)||[])[1]||1.2),aoInt:0.6,specGain:4,decals:D,onBaked:n=>{ info.baked=n; }};
  info.fx=ZSBake.realism(G,sc,o); info.ready=true; if(/[?&]zsbroom=sz/.test(location.search)) setTimeout(()=>{ window.__ZSB={G,sc,o}; },4000); };
 setTimeout(fin,100);
}
})();
