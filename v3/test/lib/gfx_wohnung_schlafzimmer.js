/* Grafik Wohnung – Schlafzimmer (Jugendzimmer späte 80er). Hängt sich an window.build84 (lib/k84.js), ändert k84.js/apt_*.js nicht; nur in era_wohnung.html geladen.
   - Kiefer-Jugendbett mit Regal-Kopfteil (Bücher, Wecker, Kassetten) statt Klotz-Gestell/-Matratze; Bettdecke, Kissen, Teddy bleiben (Original-Objekte).
   - Schreibtisch (Kiefer, Schubladen-Container, Schreibunterlage, Stifteköcher) statt Platte + 4 Stäben; Stuhl, Lampe, Kassette bleiben.
   - TV-Rollwagen (Chrom, schwarze Böden, Rollen, Videorekorder) statt Batch-Kisten; Fernseher (crt-tv) unverändert.
   - Neu: weiße Lack-Kommode mit Radiorekorder + Kassetten an der linken Wand (Kollision ergänzt).
   - Fensterblick: kleiner echter Hinterhof aus Foto-Ebenen (Perchance B_01 Rückgebäude/Himmel, C Seitenflügel, A Tonnen, Grok C2 Boden/EG; 2 Draw Calls), Schmutz-/Regenglas, Jalousie, Korn, Scheinwerfer/Lampe.
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
 const TL=new T.TextureLoader(), tx=(f,cb)=>TL.load('../'+SB+f,t=>{ t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; if(cb) cb(t); });
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
 // Fensterblick = kleiner echter Hinterhof aus Foto-Ebenen (tools/gfx_wohnung/gen_window_courtyard.py): Rückgebäude (Perchance B_01 + EG aus Grok C2), Hofboden (C2 entzerrt,
 // nasse Spiegelung gebacken), Seitenflügel (Perchance C), Tonnen (Perchance A, freigestellt), Himmel (B_01). 1 Atlas + 1 Himmel = 2 Draw Calls. Korn/Scheinwerfer/Lampe im Shader.
 const HB='../'+SB+'hof/';
 const U={uT:{value:0},uSweep:{value:new T.Vector2(0,0)},uLamp:{value:1},uLampP:{value:new T.Vector3()},uGrain:{value:0.09}};
 const mod=(mat,sky)=>{ mat.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,U);
   sh.vertexShader='varying vec3 vWP;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
   sh.fragmentShader=(sky?'#define HOF_SKY\n':'')+'varying vec3 vWP; uniform float uT; uniform vec2 uSweep; uniform float uLamp; uniform vec3 uLampP; uniform float uGrain;\n'+sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float fx=1.0;
   #ifndef HOF_SKY
   float sw=uSweep.y*exp(-pow((vWP.x-uSweep.x)/1.1,2.0))*(1.0-smoothstep(-0.8,0.6,vWP.y));
   vec3 dl=vWP-uLampP; float gl=exp(-dot(dl,dl)/3.0);
   fx=1.0+sw+(uLamp-1.0)*gl;
   #endif
   float gr=fract(sin(dot(floor(gl_FragCoord.xy)+vec2(floor(uT*24.0)*37.0,floor(uT*24.0)*11.0),vec2(12.9898,78.233)))*43758.5453);
   diffuseColor.rgb*=fx*(1.0+(gr-0.5)*uGrain);`); }; mat.customProgramCacheKey=()=>sky?'szsky':'szhof'; };
 const quads=(list)=>{ const P=[],UV=[],I=[]; list.forEach(([a,b,c,d,r])=>{ const n=P.length/3; [a,b,c,d].forEach(p=>P.push(...p));
   const e=1.5/2048, u0=r[0]+e,u1=r[0]+r[2]-e,vt=1-r[1]-e,vb=1-(r[1]+r[3])+e; UV.push(u0,vb,u1,vb,u1,vt,u0,vt); I.push(n,n+1,n+2,n,n+2,n+3); });
   const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('uv',new T.Float32BufferAttribute(UV,2)); g.setIndex(I); g.computeBoundingSphere(); return g; };
 const mkView=()=>{ info.pending++; fetch(HB+'hof.json').then(r=>r.json()).then(M=>{ const R=M.rects, {Y0,ZW,ZB,XL,XR,YTOP,YSIDE}=M;
   const Q=[ [[XL,Y0,ZB],[XR,Y0,ZB],[XR,YTOP,ZB],[XL,YTOP,ZB],R.back],                       // Rückgebäude
     [[XL,Y0,ZW],[XR,Y0,ZW],[XR,Y0,ZB],[XL,Y0,ZB],R.floor],                                   // Hofboden (Bildzeile 0 = hinten)
     [[XL,Y0,ZW],[XL,Y0,ZB],[XL,YSIDE,ZB],[XL,YSIDE,ZW],R.left],                              // Seitenflügel links (u: vorn→hinten)
     [[XR,Y0,ZB],[XR,Y0,ZW],[XR,YSIDE,ZW],[XR,YSIDE,ZB],R.right] ];                           // rechts (u: hinten→vorn)
   M.objs.forEach(([n,x,z])=>{ const r=R[n], h=r[4], w=h*r[5]*(r[2]/r[3])/(r[2]/r[3]); const ww=h*r[5]; const ang=Math.atan2(0.45-x,-2.2-z), cx=Math.cos(ang)*ww/2, cz=-Math.sin(ang)*ww/2;
     Q.push([[x-cx,Y0,z-cz],[x+cx,Y0,z+cz],[x+cx,Y0+h,z+cz],[x-cx,Y0+h,z-cz],r]); });
   const TINT=0xe8e6ea, mN=new T.MeshBasicMaterial({color:TINT,fog:false,alphaTest:0.5,side:T.DoubleSide}); mN.alphaToCoverage=true; mod(mN,false);
   const mS=new T.MeshBasicMaterial({color:0xc4c4ca,fog:false}); mod(mS,true);
   TL.load(HB+'sz_hof_atlas.png',t=>{ t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; mN.map=t; mN.needsUpdate=true; });
   TL.load(HB+'sz_hof_himmel.jpg',t=>{ t.colorSpace=T.SRGBColorSpace; mS.map=t; mS.needsUpdate=true; });
   const near=new T.Mesh(quads(Q),mN); near.name='depthbg'; near.frustumCulled=false;
   const SK=[0,0,1,1]; const sky=new T.Mesh(quads([[[-95,-12,-60],[95,-12,-60],[95,95,-60],[-95,95,-60],SK],[[-95,95,-60],[95,95,-60],[95,95,40],[-95,95,40],[0,0,1,0.04]]]),mS); sky.name='depthbg'; sky.frustumCulled=false;
   G.add(sky); G.add(near); U.uLampP.value.set(...M.lamp);
   // leise Bewegung: ab und zu Scheinwerfer (Auto in der Durchfahrt) über Hof/EG, Hoflampe flackert selten; Korn läuft mit 24 fps
   let nx=performance.now()+9000, s0=0, dir=1, fl=0;
   near.onBeforeRender=()=>{ const t=performance.now(); U.uT.value=t/1000; if(t>nx&&!s0){ s0=t; dir=Math.random()<0.5?1:-1; nx=t+30000+Math.random()*25000; }
     if(s0){ const k=(t-s0)/3400; if(k>=1){ s0=0; U.uSweep.value.y=0; } else { U.uSweep.value.set(dir>0?XL+k*(XR-XL):XR-k*(XR-XL),0.5*Math.sin(Math.PI*k)); } }
     if(fl<=0&&Math.random()<0.0025) fl=6+Math.floor(Math.random()*10); let z=1; if(fl>0){ fl--; z=Math.random()<0.5?0.5:0.85; } U.uLamp.value+=(z-U.uLamp.value)*0.5; };
   info.view=true; info.layers='hof'; info.hofU=U; info.pending--; }).catch(e=>{ console.warn('gfx_sz fenster',e); info.pending--; info.viewFail=true; }); };
 mkView();
 // Glas: Grauschleier, Schmutzrand, Kalkflecken, Tropfen, schwache Raumspiegelung (statt glattem Dunkelglas) + außen laufende Regenrinnsale
 const glass=G.children.find(o=>o.isMesh&&o.geometry.type==='PlaneGeometry'&&near(o.geometry.parameters.width,1.2)&&o.material.transparent&&near(o.material.opacity,0.28));
 if(glass){ const gm=new T.MeshBasicMaterial({transparent:true,depthWrite:false,fog:false,color:0xffffff}); glass.material=gm; glass.name='sz_glas'; tx('sz_glas.png',t=>{ gm.map=t; gm.needsUpdate=true; });
  const rm=new T.MeshBasicMaterial({transparent:true,depthWrite:false,fog:false,color:0xc0c0c0,opacity:0.3}); const rg=new T.Mesh(glass.geometry,rm); rg.name='sz_regen'; rg.position.copy(glass.position); rg.position.z-=0.004; G.add(rg);
  tx('sz_regen.png',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(3,0.8); rm.map=t; rm.needsUpdate=true; let l=performance.now(); rg.onBeforeRender=()=>{ const n=performance.now(); t.offset.y=(t.offset.y+(n-l)*0.000018)%1; l=n; }; });
  // 80er Alu-Jalousie, halb heruntergelassen, Lamellen schräg gestellt (1 InstancedMesh = 1 Draw Call); verdeckt den oberen Bildrand
  const bz=glass.position.z+0.075, N=12, IM=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:0xb9b2a2,roughness:0.5,metalness:0.35}),N+4), o3=new T.Object3D(); let n=0;
  const set=(x,y,z,sx,sy,sz,rx)=>{ o3.position.set(x,y,z); o3.rotation.set(rx||0,0,0); o3.scale.set(sx,sy,sz); o3.updateMatrix(); IM.setMatrixAt(n++,o3.matrix); };
  set(0.45,2.035,bz,1.17,0.03,0.045,0);                                   // Oberschiene
  for(let k=0;k<N;k++) set(0.45,2.005-k*0.0185,bz,1.14,0.0025,0.025,0.55); // Lamellen
  set(0.45,2.005-N*0.0185-0.006,bz,1.15,0.012,0.03,0);                    // Unterschiene
  [-0.42,0.42].forEach(dx=>set(0.45+dx,2.0-N*0.0185/2,bz,0.003,N*0.0185+0.02,0.003,0)); // Leiterkordeln
  set(1.0,1.62,bz+0.01,0.004,0.4,0.004,0);                                // Zugschnur
  IM.count=n; IM.instanceMatrix.needsUpdate=true; IM.name='sz_jalousie'; G.add(IM); info.blind=true; }
 // Fensterrahmen: vergilbter alter Lack statt Neu-Weiß
 G.children.forEach(o=>{ if(o.isMesh&&o.material&&o.material.color&&o.material.color.getHex()===0xd8d0bc&&o.position.z<-2.05){ if(!info.frameMat){ info.frameMat=o.material.clone(); info.frameMat.color.setHex(0x9e9584); info.frameMat.roughness=0.72; } o.material=info.frameMat; } });
 put('sz_schrank.glb','sz_schrank',G,[-0.5,0,1.70],0,1.05);
 put('sz_kram.glb','sz_kram',G,[0,0,0],0,1.0);
 // ---- 3b) Raumhülle benennen (Lightmap-Empfänger), Bettdecke/Kissen, Teppich, Neon, Wandsachen ----
 const shell=G.children.filter(o=>o.isMesh&&o.material&&o.material.vertexColors&&o.geometry.type==='BufferGeometry'); ['sz_fl','sz_ce','sz_wa'].forEach((n,i)=>{ if(shell[i]) shell[i].name=n; });
 if(shell[2]) tx('sz_tapete.jpg',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; shell[2].material.map=t; shell[2].material.needsUpdate=true; }); // Tapete: Streifen mit Rautenblüte, Papierfaser (gen_bedroom_tex.py) statt fleckiger Kachel
 G.children.forEach(o=>{ if(!o.isMesh) return; const g=o.geometry, pr=g.parameters||{};
  if(g.type==='PlaneGeometry'&&Math.abs((pr.height||0)-2.12)<1e-3&&pr.widthSegments===24&&o.material&&o.material.side===T.DoubleSide){ const m=o.material; tx('sz_vorhang.jpg',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(2,1); m.map=t; m.color.setHex(0xffffff); m.needsUpdate=true; }); o.name='sz_vorhang'; return; }
  if(g.type==='PlaneGeometry'&&pr.widthSegments===24&&pr.heightSegments===40){ // Bettdecke: Matratze darf nicht durchstoßen, Fußende hängt über
   const P=g.attributes.position, hw=pr.width/2; for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), ax=Math.abs(x); let lim=ax<0.4?-0.012:-0.012-Math.pow((ax-0.4)/(hw-0.4),2)*0.17; let z=Math.max(P.getZ(i),lim);
    if(y<-pr.height/2+0.12) z-=Math.pow((-pr.height/2+0.12-y)/0.12,2)*0.12; P.setZ(i,z); } g.computeVertexNormals(); o.name='sz_decke'; }
  else if(g.type==='SphereGeometry'&&pr.widthSegments===24&&pr.heightSegments===12&&o.position.y>0.5){ // Kissen: Kissenform (Ecken), Baumwolle statt Putz-Textur
   const ng=new T.SphereGeometry(1,40,20), P=ng.attributes.position; for(let i=0;i<P.count;i++){ const v=[P.getX(i),P.getY(i),P.getZ(i)].map(c=>Math.sign(c)*Math.pow(Math.abs(c),0.55)); const sq=1-0.22*Math.pow(Math.abs(v[0]*v[2]),1.5); P.setXYZ(i,v[0]*0.31,v[1]*0.075*sq,v[2]*0.2); } ng.computeVertexNormals();
   g.dispose(); o.geometry=ng; o.scale.set(1,1,1); o.position.y=0.555; o.material=new T.MeshStandardMaterial({color:0xd8d2c4,roughness:0.95,normalMap:o.material.normalMap||null}); TL.load('../assets/tex/k84/fabric_n.jpg',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(3,2); o.material.normalMap=t; o.material.needsUpdate=true; }); o.name='sz_kissen'; }
  else if(g.type==='CircleGeometry'&&Math.abs(pr.radius-0.85)<1e-3){ tx('sz_rug.png',t=>{ o.material.map=t; o.material.color.setHex(0xc8c0b8); o.material.needsUpdate=true; }); o.scale.set(1.12,0.78,1); o.position.set(0.0,0.006,0.15); o.name='sz_teppich'; }
  else if(g.type==='PlaneGeometry'&&Math.abs(pr.width-0.75)<1e-3&&Math.abs(pr.height-0.28)<1e-3&&o.material.blending===T.AdditiveBlending){ o.material.color.setHex(0x4a4a4a); o.name='sz_neon'; }
  else if(g.type==='PlaneGeometry'&&Math.abs(pr.width-0.5)<1e-3&&Math.abs(pr.height-0.72)<1e-3&&o.position.z>1.9){ o.position.set(-0.25,1.33,1.385); o.scale.set(0.8,0.8,1); o.rotation.z=-0.01; o.name='sz_poster_schrank'; }
 });
 added.forEach(o=>{ if(o.isPointLight&&o.color.getHex()===0xff3fae){ o.intensity=0.14; o.distance=3.0; o.position.x=1.3; } if(o.isPointLight&&o.color.getHex()===0xffb070){ o.intensity=1.7; } if(o.isPointLight&&o.color.getHex()===0x7090d0){ o.intensity=0.5; o.position.set(0.45,1.9,-1.2); } }); // Mond: kein blauer Fleck auf der Fensterbank // Neon nur noch Akzent; Schreibtischlampe: Rest kommt aus der Lightmap (sonst doppelt)
 { const m=new T.Mesh(new T.BoxGeometry(0.8,0.55,0.022),new T.MeshStandardMaterial({color:0xb0a898,roughness:0.85})); tx('sz_pinboard.jpg',t=>{ m.material.map=t; m.material.needsUpdate=true; });
   m.position.set(2.1-0.012,1.36,-0.22); m.rotation.y=-Math.PI/2; m.name='sz_pinnwand'; G.add(m);
   const k=new T.Mesh(new T.PlaneGeometry(0.3,0.45),new T.MeshStandardMaterial({color:0xb8b0a4,roughness:0.8})); tx('sz_kalender.jpg',t=>{ k.material.map=t; k.material.needsUpdate=true; });
   k.position.set(0.52,1.52,2.0-0.004); k.rotation.set(0,Math.PI,0.015); k.name='sz_kalender'; G.add(k); }
 // ---- 3c) Sperrzonen (x0,x1,z0,z1) – hardClamp addiert 0,22 Kopfradius → ~0,34 m Abstand ----
 // zusammenhängende Blöcke, keine schmalen Spalten zwischen Zonen (sonst schiebt hardClamp hin und her)
 const ZONES=[[-2.1,-0.9,-2.0,0.18],[-2.1,-0.38,-2.0,-1.38],        // Bett (+ Hefte daneben), Nachttisch
  [-2.1,-1.51,0.03,1.07],[-2.1,0.5,0.93,2.0],                         // Kommode; TV-Wagen + Schrank + Turnschuhe (Front-Wand links der Tür)
  [1.36,2.1,-2.0,0.52],[0.6,2.1,-2.0,-1.43],[0.98,1.62,-0.55,0.15],   // Schreibtisch/Papierkorb/Regal, Wäsche unterm Fenster bis Regal, Stuhl
  [1.7,2.1,0.52,1.0]];                                                // Rucksack
 info.zoneRects=ZONES;
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
