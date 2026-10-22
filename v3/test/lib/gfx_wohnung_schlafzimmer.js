/* Grafik Wohnung – Schlafzimmer (Jugendzimmer späte 80er). Hängt sich an window.build84 (lib/k84.js), ändert k84.js/apt_*.js nicht; nur in era_wohnung.html geladen.
   - Kiefer-Jugendbett mit Regal-Kopfteil (Bücher, Wecker, Kassetten) statt Klotz-Gestell/-Matratze; Bettdecke, Kissen, Teddy bleiben (Original-Objekte).
   - Schreibtisch (Kiefer, Schubladen-Container, Schreibunterlage, Stifteköcher) statt Platte + 4 Stäben; Stuhl, Lampe, Kassette bleiben.
   - TV-Rollwagen (Chrom, schwarze Böden, Rollen, Videorekorder) statt Batch-Kisten; Fernseher (crt-tv) unverändert.
   - Neu: weiße Lack-Kommode mit Radiorekorder + Kassetten an der linken Wand (Kollision ergänzt).
   - Fensterblick: Bild+Tiefe (lib/depthbg.js, Depth Anything V2) „Hinterhof von oben“ (Grok C2_a), grobes Raster 96×56, statt Canvas-Schichten.
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
 // Kollision der Kommode (Raumdefinition liegt in apt_main → zur Laufzeit ergänzen)
 const sol=()=>{ const R=window.__apt&&__apt.ROOMS&&__apt.ROOMS.bedroom; if(!R){ setTimeout(sol,200); return; } R.solid=R.solid||[]; if(!R.solid.some(s=>s[0]===-2.1&&s[2]===0.13)) R.solid.push([-2.1,-1.6,0.13,0.97]); };
 setTimeout(sol,0);
 // ---- 3) Fensterblick: Canvas-Schichten (hinter der Wand) raus, Bild+Tiefe rein ----
 G.children.filter(o=>o.isMesh&&o.material&&o.material.isMeshBasicMaterial&&o.material.fog===false&&o.position.z<-3).forEach(o=>{ G.remove(o); });
 const mkView=()=>{ info.pending++; DepthBG.build({img:'../sky/backdrop/sz_hinterhof.jpg',depth:'../sky/backdrop/sz_hinterhof_depth.png',position:[0,0,0],hfov:88,aspect:2048/1031,near:6,far:28,fade:0.1,tint:0xe0e0e0,grid:[96,56]}).then(m=>{
   const g=new T.Group(); g.position.set(0.45,1.6,-2.0-0.6); m.rotation.x=-0.5; g.add(m); G.add(g); info.view=true; info.pending--; }).catch(e=>{ console.warn('gfx_sz fenster',e); info.pending--; info.viewFail=true; }); };
 if(window.DepthBG) mkView(); else { const s=document.createElement('script'); s.src='lib/depthbg.js?v=1'; s.onload=mkView; s.onerror=()=>{ info.viewFail=true; }; document.head.appendChild(s); }
 // ---- 4) Licht: Hemi etwas heller/wärmer (düster, nicht schwarz) ----
 const hemi=added.find(o=>o.isHemisphereLight); if(hemi){ hemi.intensity=0.5; hemi.color.setHex(0x5a5068); hemi.groundColor.setHex(0x2a2018); }
 // ---- 5) Lightmap/AO + Grunge + Decals ----
 const D=[[0,0.4,2.495,-0.3,0.9,0.8,'-y',0.3],[0,-1.4,2.495,1.2,0.8,0.6,'-y',1.4],[4,-0.6,0.4,1.995,1.4,0.7,'-z',0],[4,2.095,0.45,0.9,1.0,0.7,'-x',0],[1,1.4,0,1.5,1.0,0.8,'y',0.4],
  [1,0.3,0,-1.4,0.9,0.6,'y',1.1],[5,-0.8,0,0.6,1.2,0.5,'y',0.3],[7,0.45,2.4,-1.995,1.4,0.3,'+z',0],[10,-2.095,1.9,0.6,0.8,0.6,'+x',0.2],[8,0.9,0,0.2,0.8,0.4,'y',0]];
 const fin=()=>{ if(info.pending>0||!(info.view||info.viewFail)||info.swapped.length<4){ setTimeout(fin,200); return; } if(!window.ZSBake){ console.warn('gfx_sz: bake_rt.js fehlt'); return; }
  const o={room:'sz',base:'../assets/bake/wohnung_schlafzimmer/',texRoot:'../assets/tex/realism/',lmGain:(+(location.search.match(/lmg=([\d.]+)/)||[])[1]||1.4),aoInt:0.6,specGain:4,decals:D,onBaked:n=>{ info.baked=n; }};
  info.fx=ZSBake.realism(G,sc,o); info.ready=true; if(/[?&]zsbroom=sz/.test(location.search)) setTimeout(()=>{ window.__ZSB={G,sc,o}; },4000); };
 setTimeout(fin,100);
}
})();
