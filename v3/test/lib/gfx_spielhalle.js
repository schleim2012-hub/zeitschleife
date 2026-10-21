/* Grafik Spielhalle 1984 (Raumhülle + Licht) – hängt sich an window.buildArcade84 (lib/arc3d.js) an, ändert arc3d.js nicht.
   - Wände: 80er-Holzpaneel (ambientCG WoodSiding008, CC0) + Gummisockel + Abschlussleiste + dunkler Rauputz, echte Sockel-/Leisten-Geometrie (selbes Material = 1 Draw)
   - Decke: 60er-Mineralfaser-Rasterplatten mit T-Schienen, 16 Plattenvarianten zufällig verteilt (keine sichtbare Kachelung), 2 fehlende Platten
   - Gebackene Lightmap (tools/gfx_spielhalle/bake_lm.py): Bildschirm-/Marquee-/Neonschein farbig auf Boden, Wänden, Decke + Kontakt-AO, Abnutzungsmaske
   - Ersetzt die additiven Boden-Glow-Kreise (Hotspots) durch das gebackene Licht. Keine zusätzlichen Echtzeitlichter, keine neuen Draw Calls.
   Abschalten zum Vergleich: ?nogfx=1 */
(function(){
if(/[?&]nogfx=1/.test(location.search)) return;
const orig=window.buildArcade84; if(!orig){ console.warn('gfx_spielhalle: buildArcade84 fehlt'); return; }
const XW=4.4, YC=3.2, Z0=4.4, Z1=-16, A=1024, LMGAIN=5.0;
const REG={floor:[0,0,320,742],ceil:[330,0,160,371],wl:[500,0,112,714],wr:[620,0,112,714],wb:[330,380,308,112],wf:[330,500,308,112]};
const uv1Of=(x,y,z,k)=>{ const [x0,y0,w,h]=REG[k]; let s,t; const tz=(z-Z1)/(Z0-Z1), sx=(x+XW)/(2*XW);
 if(k==='floor'||k==='ceil'){ s=sx; t=tz; } else if(k==='wl'||k==='wr'){ s=y/YC; t=tz; } else { s=sx; t=y/YC; }
 s=Math.min(1,Math.max(0,s)); t=Math.min(1,Math.max(0,t)); return [(x0+s*w)/A, 1-(y0+t*h)/A]; };
const wallKey=(x,z)=>{ const d=[[Math.abs(x+XW),'wl'],[Math.abs(x-XW),'wr'],[Math.abs(z-Z0),'wb'],[Math.abs(z-Z1),'wf']]; d.sort((a,b)=>a[0]-b[0]); return d[0][1]; };
let sd=1984; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
window.buildArcade84=function(sc,C){
 const R=orig(sc,C); const T=THREE, G=window.__arcGroup; if(!G) return R;
 const TL=new T.TextureLoader(), B='../assets/tex/arc2/', LB='../assets/arc2bake/';
 const ld=(f,srgb)=>{ const t=TL.load(f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; return t; };
 const lm=TL.load(LB+'lm.jpg'); lm.colorSpace=T.SRGBColorSpace; lm.channel=1;
 const ao=TL.load(LB+'ao.jpg'); ao.channel=1;
 const gr=ld('../assets/tex/realism/grunge.jpg');
 // Original-Meshes finden (Boden, Decke, Wände, Boden-Glows)
 let carp=null, ceil=null, wall=null; const kill=[];
 G.traverse(o=>{ if(!o.isMesh||o.isInstancedMesh) return; const g=o.geometry; g.computeBoundingBox(); const b=g.boundingBox, n=g.attributes.position.count, m=o.material;
  const flat=b.max.y-b.min.y<0.02, wide=b.max.x-b.min.x>8.7;
  if(n===6&&flat&&wide&&b.min.y<0.01) carp=o; else if(n===6&&flat&&wide&&b.min.y>3.1) ceil=o; else if(n===24&&wide&&b.max.y>3.1&&!flat) wall=o;
  else if(m&&m.blending===T.AdditiveBlending&&flat&&b.max.y<0.05&&(o.position.y<0.05)) kill.push(o); });
 kill.forEach(o=>{ o.material.visible=false; });   // Boden-Glow-Kreise (Hotspots) -> ersetzt durch Lightmap
 const GAIN=[1.0,1.7,0.55]; const patch=(mt,mode)=>{ // mode 0 Boden (xz), 1 Wand, 2 Decke – Makro-Variation (Welt-Koordinaten) + Abnutzung aus aoMap.g
  mt.onBeforeCompile=sh=>{ sh.uniforms.zsGr={value:gr};
   sh.vertexShader='varying vec3 vZsW;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vZsW=(modelMatrix*vec4(transformed,1.0)).xyz;');
   const P=mode===1?'vec2(vZsW.x+vZsW.z,vZsW.y)':'vZsW.xz';
   sh.fragmentShader='uniform sampler2D zsGr; varying vec3 vZsW;\n'+sh.fragmentShader
    .replace('#include <map_fragment>','#include <map_fragment>\n vec2 zsP='+P+'; vec3 zsG=texture2D(zsGr,zsP*0.07+vec2(0.37,0.11)).rgb; float zsG2=texture2D(zsGr,zsP*0.29+vec2(0.6,0.2)).g;\n float zsWr=texture2D(aoMap,vAoMapUv).g;\n diffuseColor.rgb*=mix(0.62,1.12,zsG.r)*mix(0.86,1.06,zsG2)*(1.0-'+(mode===0?'0.35':mode===1?'0.45':'0.2')+'*zsWr);')
    .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=clamp(roughnessFactor*mix(0.7,1.25,zsG.b),0.05,1.0);')
    .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance*=(1.0-0.75*zsWr)*mix(0.6,1.15,zsG.g);'); };
  mt.customProgramCacheKey=()=>'zsarc'+mode; mt.lightMap=lm; mt.userData.lmg=LMGAIN*GAIN[mode]; mt.lightMapIntensity=mt.userData.lmg; mt.aoMap=ao; mt.aoMapIntensity=0.75; mt.needsUpdate=true; return mt; };
 const setUv1=(g,keyFn)=>{ const p=g.attributes.position, a=new Float32Array(p.count*2); for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i); const u=uv1Of(x,y,z,keyFn(x,y,z)); a[i*2]=u[0]; a[i*2+1]=u[1]; } g.setAttribute('uv1',new T.BufferAttribute(a,2)); };
 const mats=[];
 // ---- Boden: Original-Teppich (Schwarzlicht) behalten, nur Licht/AO/Abnutzung dazu ----
 if(carp){ setUv1(carp.geometry,()=> 'floor'); patch(carp.material,0); mats.push(carp.material); }
 // ---- Decke: Rasterplatten 60x60 cm, Varianten-Atlas 4x4 ----
 if(ceil){ const P=[],U=[],N=[]; const miss=new Set(['3,9','11,20']);
  for(let ix=0;ix*0.6<2*XW-1e-6;ix++) for(let iz=0;iz<34;iz++){ const x0=-XW+ix*0.6, x1=Math.min(XW,x0+0.6), z0=Z1+iz*0.6, z1=z0+0.6, fw=(x1-x0)/0.6;
   let vi=miss.has(ix+','+iz)?4:Math.floor(rnd()*15); if(vi>=4) vi++; if(miss.has(ix+','+iz)) vi=4; const a=vi%4, b=Math.floor(vi/4);
   const u0=a/4+0.002, u1=a/4+0.25*fw-0.002, v1=1-b/4-0.002, v0=1-(b+1)/4+0.002; const y=YC;
   const q=[[x0,z0,u0,v1],[x1,z0,u1,v1],[x1,z1,u1,v0],[x0,z1,u0,v0]]; [0,1,2,0,2,3].forEach(k=>{ P.push(q[k][0],y,q[k][1]); U.push(q[k][2],q[k][3]); N.push(0,-1,0); }); }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('uv',new T.Float32BufferAttribute(U,2)); g.setAttribute('normal',new T.Float32BufferAttribute(N,3)); setUv1(g,()=> 'ceil');
  const m=patch(new T.MeshStandardMaterial({map:ld(B+'ceil_c.jpg',1),normalMap:ld(B+'ceil_n.jpg'),normalScale:new T.Vector2(0.6,0.6),roughness:0.95,color:0x6e6a62}),2);
  ceil.geometry.dispose(); ceil.geometry=g; ceil.material=m; mats.push(m); }
 // ---- Wände: Paneel + Sockel + Abschlussleiste (1 Mesh, 1 Material) ----
 if(wall){ const gs=[]; const H=YC;
  const wplane=(k)=>{ let g; if(k==='wl'){ g=new T.PlaneGeometry(Z0-Z1,H); g.rotateY(Math.PI/2); g.translate(-XW,H/2,(Z0+Z1)/2); } else if(k==='wr'){ g=new T.PlaneGeometry(Z0-Z1,H); g.rotateY(-Math.PI/2); g.translate(XW,H/2,(Z0+Z1)/2); }
   else if(k==='wf'){ g=new T.PlaneGeometry(2*XW,H); g.translate(0,H/2,Z1); } else { g=new T.PlaneGeometry(2*XW,H); g.rotateY(Math.PI); g.translate(0,H/2,Z0); } return g.toNonIndexed(); };
  ['wl','wr','wf','wb'].forEach(k=>gs.push(wplane(k)));
  // Leisten: Sockel 0-0,10 m (2 cm tief), Abschlussleiste 2,30-2,38 m (2,5 cm tief)
  [[0,0.10,0.02],[2.30,0.38-0.30+2.30-2.30,0.025]].forEach(([y0,hh,dd],j)=>{ const y=j?2.30:0, h=j?0.08:0.10;
   [['wl',dd,Z0-Z1,-XW+dd/2,(Z0+Z1)/2],['wr',dd,Z0-Z1,XW-dd/2,(Z0+Z1)/2]].forEach(([k,w,l,x,z])=>{ const g=new T.BoxGeometry(w,h,l); g.translate(x,y+h/2,z); gs.push(g.toNonIndexed()); });
   [['wf',Z1+dd/2],['wb',Z0-dd/2]].forEach(([k,z])=>{ const g=new T.BoxGeometry(2*XW-0.05,h,dd); g.translate(0,y+h/2,z); gs.push(g.toNonIndexed()); }); });
  // zusammenführen + UV (u = Wandlänge/1,2 m, v = Höhe/3,2 m)
  let n=0; gs.forEach(g=>n+=g.attributes.position.count); const pos=new Float32Array(n*3), nor=new Float32Array(n*3), uv=new Float32Array(n*2); let o=0;
  gs.forEach(g=>{ pos.set(g.attributes.position.array,o*3); nor.set(g.attributes.normal.array,o*3); o+=g.attributes.position.count; });
  for(let i=0;i<n;i++){ const x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2], k=wallKey(x,z); const along=(k==='wl'||k==='wr')?z:x; uv[i*2]=along/1.2; uv[i*2+1]=Math.min(0.999,Math.max(0.001,y/H)); }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(pos,3)); g.setAttribute('normal',new T.BufferAttribute(nor,3)); g.setAttribute('uv',new T.BufferAttribute(uv,2)); setUv1(g,(x,y,z)=>wallKey(x,z));
  const m=patch(new T.MeshStandardMaterial({map:ld(B+'wall_c.jpg',1),normalMap:ld(B+'wall_n.jpg'),normalScale:new T.Vector2(0.8,0.8),roughnessMap:ld(B+'wall_r.jpg'),roughness:1,metalness:0,envMapIntensity:0.4}),1);
  wall.geometry.dispose(); wall.geometry=g; wall.material=m; mats.push(m); }
 // Lightmap mit Play-Dim (Big Screen) mitdimmen
 AFRAME.registerComponent('gfx-arc-tick',{tick(){ const k=window.__arcDim==null?1:window.__arcDim; mats.forEach(m=>{ m.lightMapIntensity=m.userData.lmg*k; }); }}); sc.setAttribute('gfx-arc-tick','');
 window.__gfxArc={carp:!!carp,ceil:!!ceil,wall:!!wall,killed:kill.length};
 return R; };
})();
