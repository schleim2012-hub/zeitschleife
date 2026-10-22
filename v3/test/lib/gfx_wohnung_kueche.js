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
 put('kue_zeile.glb',1.0); put('kue_kuehl.glb',1.0); put('kue_ecke.glb',1.0); put('kue_kram.glb',1.0); put('kue_wand.glb',1.0);
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
 // ---- 4b) Fensterblick: kleiner echter Hof aus Foto-Ebenen (tools/gfx_wohnung/gen_window_courtyard_kueche.py; Perchance B_04 Rückgebäude/Himmel/Bäume, C_07/C_11 Seitenflügel+Mauer).
 //      Gleiche Stunde/Höhe/Grade wie das Schlafzimmer. Lokal: Fenstermitte x=0, Glas z=0, Blick −z → Gruppe um 180° gedreht an (−9,75 | 0 | 2,605). 3 Draws (Hof, Bäume, Himmel).
 //      Bewegung: Bäume wiegen leicht, Fernseher-Flackern in einem Fenster des Rückgebäudes, Korn 24 fps; Glas: Fettfilm/Beschlag + Regen außen; Scheibengardine (Spitze) unten.
 { const HB=KB+'hof/', WG=new T.Group(); WG.name='kue_fensterblick'; WG.position.set(-9.75,0,2.605); WG.rotation.y=Math.PI; K.add(WG); WG.updateMatrixWorld(true);
  const U={uT:{value:0},uTV:{value:0},uTVP:{value:new T.Vector3(-0.85,0.5,-14.0)},uGrain:{value:0.09},uSway:{value:0}};
  const mod=(mat,kind)=>{ mat.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,U);
    let v='varying vec3 vLP;\nuniform float uT; uniform float uSway;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+(kind==='tree'?' float sw=clamp((transformed.y+1.8)/9.0,0.0,1.0); transformed.x+=sw*sw*(0.05*sin(uT*0.55+transformed.x*0.3)+0.025*sin(uT*1.7+transformed.y*0.9))*uSway;':''));
    sh.vertexShader=v.replace('#include <project_vertex>','#include <project_vertex>\n vLP=transformed;');
    sh.fragmentShader=(kind==='sky'?'#define HOF_SKY\n':'')+'varying vec3 vLP; uniform float uT; uniform float uTV; uniform vec3 uTVP; uniform float uGrain;\n'+sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    #ifndef HOF_SKY
    vec2 dt=(vLP.xy-uTVP.xy)/vec2(0.34,0.42); float tv=exp(-dot(dt,dt)*2.2)*step(uTVP.z-0.5,vLP.z)*step(vLP.z,uTVP.z+0.5);
    diffuseColor.rgb+=tv*uTV*vec3(0.20,0.30,0.48)*diffuseColor.a;
    #endif
    float gr=fract(sin(dot(floor(gl_FragCoord.xy)+vec2(floor(uT*24.0)*37.0,floor(uT*24.0)*11.0),vec2(12.9898,78.233)))*43758.5453);
    diffuseColor.rgb*=1.0+(gr-0.5)*uGrain;`); }; mat.customProgramCacheKey=()=>'kuehof_'+kind; };
  const quads=(list)=>{ const P=[],UV=[],I=[]; list.forEach(([a,b,c,d,r])=>{ const n=P.length/3; [a,b,c,d].forEach(p=>P.push(...p));
    const e=1.5/2048, u0=r[0]+e,u1=r[0]+r[2]-e,vt=1-r[1]-e,vb=1-(r[1]+r[3])+e; UV.push(u0,vb,u1,vb,u1,vt,u0,vt); I.push(n,n+1,n+2,n,n+2,n+3); });
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('uv',new T.Float32BufferAttribute(UV,2)); g.setIndex(I); g.computeBoundingSphere(); return g; };
  info.pending++;
  fetch(HB+'hof.json').then(r=>r.json()).then(M=>{ const R=M.rects, {Y0,ZW,ZB,ZM,ZT,XL,XR,BX0,BW,YTOP,YBOT,YSIDE,WALLH}=M;
   const Q=[ [[BX0,YBOT,ZB],[BX0+BW,YBOT,ZB],[BX0+BW,YTOP,ZB],[BX0,YTOP,ZB],R.back],          // Rückgebäude (Dach freigestellt → Himmel dahinter)
     [[XL,Y0,ZW],[XR,Y0,ZW],[XR,Y0,ZB],[XL,Y0,ZB],R.floor],                                    // Hofboden
     [[XL,Y0,ZM],[XR,Y0,ZM],[XR,Y0+WALLH,ZM],[XL,Y0+WALLH,ZM],R.wall],                         // Gartenmauer vor dem Rückgebäude
     [[XL,Y0,ZW],[XL,Y0,ZB],[XL,YSIDE,ZB],[XL,YSIDE,ZW],R.left],                               // Seitenflügel links
     [[XR,Y0,ZB],[XR,Y0,ZW],[XR,YSIDE,ZW],[XR,YSIDE,ZB],R.right] ];                            // rechts
   const E=M.eye, sc_=(ZT-E[2])/(ZB-E[2]), pj=(x,y)=>[E[0]+(x-E[0])*sc_,E[1]+(y-E[1])*sc_,ZT];     // Bäume nach vorn (ZT), vom Auge aus projiziert → gleiche Bildgröße, echte Parallaxe
   const TQ=M.trees.map(([n,x0,x1,y0,y1])=>[pj(x0,y0),pj(x1,y0),pj(x1,y1),pj(x0,y1),R[n]]);
   const mN=new T.MeshBasicMaterial({color:0xe8e6ea,fog:false,alphaTest:0.5,side:T.DoubleSide}); mN.alphaToCoverage=true; mod(mN,'hof');
   const mT=new T.MeshBasicMaterial({color:0xd6d6da,fog:false,alphaTest:0.45,side:T.DoubleSide}); mT.alphaToCoverage=true; mod(mT,'tree');
   const mS=new T.MeshBasicMaterial({color:0xc4c4ca,fog:false}); mod(mS,'sky');
   TL.load(HB+'kue_hof_atlas.png',t=>{ t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; mN.map=t; mT.map=t; mN.needsUpdate=mT.needsUpdate=true; });
   TL.load(HB+'kue_hof_himmel.jpg',t=>{ t.colorSpace=T.SRGBColorSpace; mS.map=t; mS.needsUpdate=true; });
   const hof=new T.Mesh(quads(Q),mN); hof.name='kue_hof'; hof.frustumCulled=false;
   const tre=new T.Mesh(quads(TQ),mT); tre.name='kue_hofbaum'; tre.frustumCulled=false;
   const sky=new T.Mesh(quads([[[-95,-12,-60],[95,-12,-60],[95,95,-60],[-95,95,-60],[0,0,1,1]],[[-95,95,-60],[95,95,-60],[95,95,40],[-95,95,40],[0,0,1,0.04]]]),mS); sky.name='kue_himmel'; sky.frustumCulled=false;
   sky.renderOrder=-2; WG.add(sky); WG.add(hof); WG.add(tre);
   // leise Bewegung: Wind in Böen, Fernseher im EG-Fenster (blaues Flackern, ab und zu aus)
   let gust=0, gT=0, tvOn=1, tvN=performance.now()+40000;
   hof.onBeforeRender=()=>{ const t=performance.now(); U.uT.value=t/1000; if(t>gT){ gT=t+4000+Math.random()*7000; gust=0.4+Math.random()*0.9; } U.uSway.value+=(gust-U.uSway.value)*0.01;
     if(t>tvN){ tvOn=1-tvOn; tvN=t+(tvOn?60000+Math.random()*60000:15000+Math.random()*20000); }
     U.uTV.value=tvOn*(0.55+0.3*Math.sin(t*0.0031)*Math.sin(t*0.0123)+0.25*(Math.random()<0.08?Math.random():0.5)); };
   info.view=true; info.hofU=U; info.pending--; }).catch(e=>{ console.warn('gfx_kue fenster',e); info.pending--; info.viewFail=true; });
  // Glas: mmk-Scheibe (deckend, Canvas-Nacht) → Fettfilm/Beschlag-Glas + Regen außen
  const gl=IN.children.find(m=>m.isMesh&&m.geometry.type==='PlaneGeometry'&&Math.abs(m.geometry.parameters.width-1.1)<0.01&&Math.abs(m.position.z-2.605)<0.02);
  if(gl){ const gm=new T.MeshBasicMaterial({transparent:true,depthWrite:false,fog:false,color:0xd8d4cc}); gl.material.map&&gl.material.map.dispose(); gl.material=gm; gl.name='kue_glas'; gl.renderOrder=2;
   tx('kue_glas.png',true,t=>{ t.wrapS=t.wrapT=T.ClampToEdgeWrapping; gm.map=t; gm.needsUpdate=true; });
   const rm=new T.MeshBasicMaterial({transparent:true,depthWrite:false,fog:false,color:0xb8bcc4,opacity:0.32}); const rg=new T.Mesh(gl.geometry,rm); rg.name='kue_regen'; rg.position.copy(gl.position); rg.rotation.copy(gl.rotation); rg.position.z+=0.004; rg.renderOrder=1; IN.add(rg);
   tx('kue_regen.png',true,t=>{ t.repeat.set(3,0.8); rm.map=t; rm.needsUpdate=true; let l=performance.now(); rg.onBeforeRender=()=>{ const n=performance.now(); t.offset.y=(t.offset.y+(n-l)*0.000016)%1; l=n; }; });
   info.glass=true; } else console.warn('gfx_kue: mmk-Fensterglas nicht gefunden');
  // Scheibengardine (Spitze, unteres Drittel) an Messingstange, Falten, Zugluft bewegt den Saum minimal
  { const w=1.04, h=0.46, g=new T.PlaneGeometry(w,h,64,6), p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i); p.setZ(i,0.011*Math.sin(x*2*Math.PI/0.085)+0.004*Math.sin(x*23.0)); } g.computeVertexNormals();
   const cm=new T.MeshStandardMaterial({color:0xf2eee4,roughness:1,metalness:0,transparent:true,depthWrite:false,side:T.DoubleSide,emissive:0x5a5e6a,alphaTest:0.04}); cm.userData.zsg=1;
   cm.onBeforeCompile=sh=>{ sh.uniforms.uT=info.curT={value:0}; sh.vertexShader='uniform float uT;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n float hm=1.0-uv.y; transformed.z+=hm*hm*0.006*sin(uT*0.8+position.x*6.0);'); };
   tx('kue_gardine.png',true,t=>{ t.wrapS=T.RepeatWrapping; t.wrapT=T.ClampToEdgeWrapping; t.repeat.set(1.3,1); cm.map=t; cm.emissiveMap=t; cm.needsUpdate=true; });
   const c=new T.Mesh(g,cm); c.name='kue_gardine'; c.position.set(-9.75,1.255+h/2,2.556); c.rotation.y=Math.PI; c.renderOrder=3; IN.add(c);
   c.onBeforeRender=()=>{ if(info.curT) info.curT.value=performance.now()/1000; };
   const rod=new T.Mesh(new T.CylinderGeometry(0.005,0.005,1.1,8),new T.MeshStandardMaterial({color:0x9a7a42,roughness:0.35,metalness:0.8})); rod.rotation.z=Math.PI/2; rod.position.set(-9.75,1.255+h+0.004,2.552); rod.name='kue_stange'; IN.add(rod); info.curtain=true; }
 }
 // ---- 4c) Tür (cremeweiß lackierte Kassettentür statt Putztextur), Südwand: Küchenuhr (Parodie „Junghaus“, Batterie leer: Sekundenzeiger zuckt auf der Stelle), Kreuzstich-Spruch ----
 { let leaf=null; K.traverse(x=>{ if(!leaf&&x.isMesh&&x.geometry.type==='BoxGeometry'&&Math.abs(x.geometry.parameters.width-0.795)<0.002&&Math.abs(x.geometry.parameters.depth-0.035)<0.002) leaf=x; });
  if(leaf){ const m=leaf.material; m.color.setHex(0xeae6da); m.roughness=0.5; tx('kue_tuer.jpg',true,t=>{ t.wrapS=t.wrapT=T.ClampToEdgeWrapping; t.repeat.set(1,1); m.map=t; m.needsUpdate=true; });
   tx('kue_tuer_n.jpg',false,t=>{ t.wrapS=t.wrapT=T.ClampToEdgeWrapping; m.normalMap=t; m.normalScale.set(1,1); m.needsUpdate=true; }); info.door=true; }
  const zS=-0.92; const U0=new T.Group(); U0.name='kue_uhr'; U0.position.set(-8.7,2.08,zS); IN.add(U0);
  const body=new T.Mesh(new T.CylinderGeometry(0.152,0.155,0.045,32),new T.MeshStandardMaterial({color:0xd8d0bc,roughness:0.45})); body.rotation.x=Math.PI/2; body.position.z=0.0225; body.name='kue_uhr_k'; U0.add(body);
  const fm=new T.MeshStandardMaterial({color:0xe4ded0,roughness:0.6}); tx('kue_uhr.jpg',true,t=>{ t.wrapS=t.wrapT=T.ClampToEdgeWrapping; fm.map=t; fm.needsUpdate=true; });
  const face=new T.Mesh(new T.CircleGeometry(0.138,40),fm); face.position.z=0.046; face.name='kue_uhr_z'; U0.add(face);
  const hg=new T.PlaneGeometry(0.004,0.125); hg.translate(0,0.045,0); const hand=new T.Mesh(hg,new T.MeshBasicMaterial({color:0x8a1a14})); hand.position.z=0.048; hand.name='kue_uhr_s'; U0.add(hand);
  let tk=0; hand.onBeforeRender=()=>{ const s=Math.floor(performance.now()/1000); if(s!==tk){ tk=s; hand.rotation.z=-(31+(s%2?0.9:0))/60*2*Math.PI; } };
  const fr=new T.Mesh(new T.BoxGeometry(0.31,0.38,0.018),new T.MeshStandardMaterial({color:0x4a3220,roughness:0.6})); fr.position.set(-8.1,1.48,zS+0.009); fr.rotation.z=-0.015; fr.name='kue_stick_r'; IN.add(fr);
  const sm=new T.MeshStandardMaterial({color:0xe6e0d2,roughness:0.9}); tx('kue_stick.jpg',true,t=>{ t.wrapS=t.wrapT=T.ClampToEdgeWrapping; sm.map=t; sm.needsUpdate=true; });
  const st=new T.Mesh(new T.PlaneGeometry(0.27,0.338),sm); st.position.set(0,0,0.0095); st.name='kue_stick'; fr.add(st); }
 // ---- 4d) Lichtinseln: 70er-Pendelleuchte (Emaille-Pilz, braun-orange) über dem Eckbanktisch + Unterbauleuchte (Soffitte) unter dem Oberschrank neben der Spüle.
 //      Beide nur gebacken (tools/bake extraLights „pendel“/„unterbau“) + leuchtende Birne/Diffusor; keine zusätzlichen Echtzeit-Lichter.
 { const PX=-10.95, PZ=0.12, PY=1.92;   // Schirmunterkante 1,915 m (über Kopfhöhe)
  const sh=new T.LatheGeometry([[0.012,0.2],[0.05,0.19],[0.11,0.13],[0.165,0.03],[0.175,0.0],[0.17,-0.005]].map(([r,y])=>new T.Vector2(r,y)),28);
  const shade=new T.Mesh(sh,new T.MeshStandardMaterial({color:0x8a4a1c,roughness:0.35,metalness:0.05,side:T.DoubleSide})); shade.position.set(PX,PY,PZ); shade.name='kue_pendel'; IN.add(shade);
  const cord=new T.Mesh(new T.CylinderGeometry(0.0035,0.0035,2.6-PY-0.2,6),new T.MeshStandardMaterial({color:0x2a2622,roughness:0.6})); cord.position.set(PX,(2.6+PY+0.2)/2,PZ); cord.name='kue_pendel_k'; IN.add(cord);
  const bm=new T.MeshBasicMaterial({color:0xffd59a,toneMapped:false,fog:false}); const bl=new T.Mesh(new T.SphereGeometry(0.035,12,8),bm); bl.position.set(PX,PY+0.07,PZ); bl.scale.y=1.2; bl.name='kue_pendel_b'; IN.add(bl);
  const ux0=-9.02, ux1=-8.48, uy=1.965, uz0=2.2, uz1=2.3;
  const hous=new T.Mesh(new T.BoxGeometry(ux1-ux0,0.035,uz1-uz0),new T.MeshStandardMaterial({color:0xcfc6b2,roughness:0.5})); hous.position.set((ux0+ux1)/2,uy-0.0175,(uz0+uz1)/2); hous.name='kue_unterbau'; IN.add(hous);
  const df=new T.Mesh(new T.PlaneGeometry(ux1-ux0-0.04,0.05),new T.MeshBasicMaterial({color:0xffe4b8,toneMapped:false,fog:false})); df.rotation.x=Math.PI/2; df.position.set((ux0+ux1)/2,uy-0.036,(uz0+uz1)/2); df.name='kue_unterbau_d'; IN.add(df);
  info.pools=true; }
 // ---- 5) Licht: Hemi/Glühbirne heller (düster, aber lesbar), Mond bleibt ----
 const spot=added.find(x=>x.isSpotLight), hemi=o.hemi, L2=o.L2;
 if(hemi){ hemi.color.setHex(0x7a7890); hemi.groundColor.setHex(0x3a2e24); }
 if(L2){ L2.decay=2; }
 const ST=window.__mmk;
 const tick=(now,st,Kw)=>{ const kin=ST?ST.inside:1; if(kin<=0.001) return;
  const B=info.baked>0; // mit Lightmap: Licht kommt gebacken (Cycles), Echtzeit nur Glanz/Flackern; ohne (?nobake=1): Echtzeit heller
  if(hemi) hemi.intensity=hemi.intensity*(B?0.5:1)+(B?0.006:0.42)*Kw*kin;
  if(L2&&kin>0.5){ const bI=L2.intensity/Math.max(1e-4,0.32*Kw*kin); L2.intensity*=B?0.55:4.2; L2.distance=B?4.5:6.0; if(B&&info.lmMats) info.lmMats.forEach(m=>{ m.lightMapIntensity=m.userData.lm0*(0.9+0.1*Math.min(1.2,bI)); }); }
  if(spot) spot.intensity*=B?0.35:0.7; };
 // ---- 6) Sperrzonen (x0,x1,z0,z1): Küchenzeile, Westseite (Kühlschrank+Kiste+Eckbankgruppe), Treteimer ----
 const ZONES=[[-10.79,-7.0,1.675,2.5],[-11.5,-10.38,-0.92,2.5],[-7.47,-7.0,1.36,2.5]]; // Kühlschrank+Kiste und Eckbank zu einer Zone: die 14-cm-Lücke dazwischen ließ den Kopf beim Teleport zwischen zwei Zonen hängen
 info.zoneRects=ZONES;
 const sol=()=>{ const R=window.__apt&&__apt.ROOMS&&__apt.ROOMS.kitchen; if(!R){ setTimeout(sol,200); return; } R.solid=R.solid||[]; R.solid.length=0; ZONES.forEach(z=>R.solid.push(z.slice())); info.zones=true; };
 setTimeout(sol,0);
 // ---- 7) Lightmap/AO (tools/bake, Präfix kue) ----
 const fin=()=>{ if(info.pending>0||info.swapped.length<5){ setTimeout(fin,200); return; } if(!window.ZSBake){ console.warn('gfx_kue: bake_rt.js fehlt'); return; }
  const op={room:'kue',base:'../assets/bake/wohnung_kueche/',texRoot:'../assets/tex/realism/',lmGain:(+(location.search.match(/lmg=([\d.]+)/)||[])[1]||0.6),aoInt:0.6,specGain:4,mats:{wa:pl&&pl.material,fl:fl&&fl.material},
   onBaked:n=>{ const L=[]; K.traverse(x=>{ if(x.isMesh&&x.material&&x.material.lightMap&&!L.includes(x.material)){ L.push(x.material); x.material.userData.lm0=x.material.lightMapIntensity; } }); info.lmMats=L; info.baked=n; }};
  info.fx=ZSBake.realism(K,sc,op); info.ready=true; if(/[?&]zsbroom=kue/.test(location.search)) setTimeout(()=>{ window.__ZSB={G:K,sc,o:op}; },4000); };
 setTimeout(fin,100);
 return {tick};
}
})();
