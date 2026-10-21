/* ZSBake – gebackenes Licht + Realismus-Schicht für Rewind-Räume (Quest-tauglich).
   ZSBake.realism(G, sceneEl, opts) – opts:
     room:   Präfix → unbenannte Meshes in G bekommen stabile Namen <room>_<i>; Registrierung als window.__ZSB (für tools/bake/dump2.py)
     vcKeep: 0..1 (nur Meshes in vcNames, falls gesetzt) – vorhandene Vertexfarben (alte JS-Lichtbacke) nach dem Laden der Lightmap Richtung Weiß ziehen
     texRoot: Pfad zu assets/tex/realism/ (Standard ../assets/tex/realism/) · grunge:false · onBaked(n)
     ?nobake=1 in der URL schaltet alles ab (Vorher-Bild/Dump)
     base:   Ordner mit uv1.json, uv1.bin, lm.jpg, ao.jpg (aus tools/bake: Blender headless)
     mats:   {key:Material} – bekommen Makro-Variation (Grunge) gegen Kachel-Wiederholung
     tubes:  [[x,y,z0,z1,col]] Neonröhren entlang z → Glow-Streifen (1 Draw)
     flu:    [x,y,z,len,col] Leuchtstoffröhre → Halo im selben Draw, flackerbar über out.setFlu(k)
     decals: [[cell,x,y,z,w,h,face,rot]] Multiply-Decals (1 Draw); posters:[[cell,x,y,z,w,h,face,rot]] (1 Draw)
            face: 'y' Boden, '-y' Decke, '+x','-x','+z','-z' = Wand-Normale
   Rückgabe {setFlu(k)} – Glow (Röhren+Leuchtstoffröhre) ist 1 Draw, Flackern über Vertexfarben. Lightmap wird nur gesetzt, wenn die Vertex-Anzahl exakt passt (sonst unverändert). */
(function(){
let R='../assets/tex/realism/';
window.ZSBake={ realism(G,sc,o){ const T=THREE, TL=new T.TextureLoader(), out={}; if(o.texRoot) R=o.texRoot;
 // --- 0) Stabile Namen für alle Meshes der Raumgruppe (für Dump/Bake) + Registrierung für tools/bake/dump2.py ---
 if(o.room){ let i=0; G.traverse(m=>{ if(m.isMesh&&!m.name){ m.name=o.room+'_'+i; i++; } }); window.__ZSB={G,sc,o}; }
 if(/[?&]nobake=1/.test(location.search)) return out;
 const lmMats=[];
 // --- 1) Lightmap + AO (zweiter UV-Kanal); indizierte Geometrie wird vorher deterministisch entindiziert ---
 if(o.base) Promise.all([fetch(o.base+'uv1.json').then(r=>r.json()),fetch(o.base+'uv1.bin').then(r=>r.arrayBuffer())]).then(([man,buf])=>{
  const lm=TL.load(o.base+'lm.jpg'), ao=TL.load(o.base+'ao.jpg'); lm.colorSpace=T.SRGBColorSpace; lm.channel=1; ao.channel=1; lm.flipY=ao.flipY=true;
  const bb=new T.Box3(), c3=new T.Vector3(); let n=0; G.updateMatrixWorld(true);
  G.traverse(m=>{ const e=m.isMesh&&man.meshes[m.name]; if(!e) return; let g=m.geometry; const cnt=g.index?g.index.count:g.attributes.position.count;
   if(cnt!==e.count){ console.warn('ZSBake: Vertexzahl passt nicht',m.name,cnt,e.count); return; }
   if(e.c){ bb.setFromObject(m); bb.getCenter(c3); if(c3.distanceTo(new T.Vector3(...e.c))>0.05){ console.warn('ZSBake: Lage passt nicht',m.name); return; } }
   if(g.index){ g=g.toNonIndexed(); m.geometry=g; }
   if(g.attributes.color&&o.vcKeep!==undefined&&(!o.vcNames||o.vcNames.includes(m.name))){ const a=g.attributes.color.array; for(let i=0;i<a.length;i++) a[i]=1+(a[i]-1)*o.vcKeep; g.attributes.color.needsUpdate=true; }
   g.setAttribute('uv1',new T.BufferAttribute(new Float32Array(buf,e.offset,e.count*2),2)); const mt=m.material; mt.lightMap=lm; mt.lightMapIntensity=man.lmIntensity*(o.lmGain||1); mt.aoMap=ao; mt.aoMapIntensity=o.aoInt||0.5; mt.needsUpdate=true; if(!lmMats.includes(mt)) lmMats.push(mt); n++; });
  window.__zsBaked=n; if(o.grunge!==false&&!o.mats) lmMats.forEach(grunge); if(o.onBaked) o.onBaked(n); }).catch(e=>console.warn('ZSBake: keine Lightmap',e));
 // --- 2) Makro-Variation gegen Kachel-Wiederholung (2 Abfragen einer kachelbaren 512er-Grunge-Textur) ---
 const gr=TL.load(R+'grunge.jpg'); gr.wrapS=gr.wrapT=T.RepeatWrapping;
 function grunge(mt){ if(!mt||!mt.map||mt.isMeshBasicMaterial||mt.userData.zsg) return; mt.userData.zsg=1; const amt=mt.roughnessMap?1:0;
  mt.onBeforeCompile=sh=>{ sh.uniforms.zsGr={value:gr}; sh.fragmentShader='uniform sampler2D zsGr;\n'+sh.fragmentShader
   .replace('#include <map_fragment>','#include <map_fragment>\n vec3 zsG=texture2D(zsGr,vMapUv*0.071+vec2(0.37,0.11)).rgb; float zsG2=texture2D(zsGr,vMapUv*0.29+vec2(0.6,0.2)).g;\n diffuseColor.rgb*=mix(0.58,1.12,zsG.r)*mix(0.86,1.07,zsG2);')
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=clamp(roughnessFactor*mix(0.5,1.45,zsG.b*0.7+zsG2*0.3),0.03,1.0);')
   // Spiegelungen nur dort, wo gebackenes Licht ist (sonst glänzt der Boden auch im Schatten)
   .replace('#include <aomap_fragment>','#include <aomap_fragment>\n#ifdef USE_LIGHTMAP\n reflectedLight.indirectSpecular*=clamp(dot(lightMapTexel.rgb,vec3(0.3,0.59,0.11))*'+(o.specGain||5).toFixed(2)+',0.2,1.0);\n#endif'); };
  mt.customProgramCacheKey=()=>'zsgrunge'+amt+(o.specGain||5); mt.needsUpdate=true; }
 Object.values(o.mats||{}).forEach(grunge);
 // --- 3) Leuchten sichtbar machen: Glow an Röhren (additiv, kein Bloom-Postpass) ---
 const gc=document.createElement('canvas'); gc.width=8; gc.height=64; { const x=gc.getContext('2d'), g=x.createLinearGradient(0,0,0,64); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(0.5,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,8,64); }
 const gt=new T.CanvasTexture(gc); const gm=()=>new T.MeshBasicMaterial({map:gt,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 const Q={p:[],c:[],u:[]}; const quad=(a,b,c,d,col,k)=>{ [a,b,c,a,c,d].forEach((v,i)=>{ Q.p.push(v[0],v[1],v[2]); Q.c.push(col.r*k,col.g*k,col.b*k); }); Q.u.push(0,0,1,0,1,1,0,0,1,1,0,1); };
 const mkQ=(q,mat)=>{ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(q.p,3)); g.setAttribute('color',new T.Float32BufferAttribute(q.c,3)); g.setAttribute('uv',new T.Float32BufferAttribute(q.u,2)); const m=new T.Mesh(g,mat); m.frustumCulled=false; G.add(m); return m; };
 (o.tubes||[]).forEach(([x,y,z0,z1,c])=>{ const col=new T.Color(c), w=0.16;
  quad([x,y-w,z0],[x,y-w,z1],[x,y+w,z1],[x,y+w,z0],col,0.55); quad([x-w,y,z0],[x-w,y,z1],[x+w,y,z1],[x+w,y,z0],col,0.55); });
 let fluI=-1; if(o.flu){ const [x,y,z,L,c]=o.flu, col=new T.Color(c), w=0.22; fluI=Q.c.length/3;
  quad([x,y-w,z+L/2+0.1],[x,y-w,z-L/2-0.1],[x,y+w,z-L/2-0.1],[x,y+w,z+L/2+0.1],col,0.45); quad([x-w,y,z+L/2+0.1],[x-w,y,z-L/2-0.1],[x+w,y,z-L/2-0.1],[x+w,y,z+L/2+0.1],col,0.45); }
 if(Q.p.length){ const gmesh=mkQ(Q,gm()); if(fluI>=0){ const ca=gmesh.geometry.attributes.color, base=Array.from(ca.array.slice(fluI*3,fluI*3+36));
   out.setFlu=k=>{ for(let i=0;i<36;i++) ca.array[fluI*3+i]=base[i]*k; ca.needsUpdate=true; }; } }
 // --- 4) Decals: Multiply-Atlas 4x4 (Schmutz, Flecken, Risse) + Plakatreste 2x2 (Alpha-Test) – je 1 Draw ---
 const deco=(list,cells,mat)=>{ if(!list||!list.length) return; const p=[],u=[]; const e=1/cells;
  list.forEach(([cell,x,y,z,w,h,face,rot])=>{ const cu=(cell%cells)*e, cv=1-(Math.floor(cell/cells)+1)*e, i=0.004; const r=rot||0, cs=Math.cos(r), sn=Math.sin(r);
   const L=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([a,b])=>[a*cs-b*sn,a*sn+b*cs]); const V=L.map(([a,b])=>{ const d=0.006;
    if(face==='y') return [x+a,y+0.003,z-b]; if(face==='-y') return [x+a,y-0.003,z+b]; if(face==='+x') return [x+d,y+b,z-a]; if(face==='-x') return [x-d,y+b,z+a]; if(face==='+z') return [x+a,y+b,z+d]; return [x-a,y+b,z-d]; });
   const U=[[cu+i,cv+i],[cu+e-i,cv+i],[cu+e-i,cv+e-i],[cu+i,cv+e-i]]; [0,1,2,0,2,3].forEach(k=>{ p.push(...V[k]); u.push(...U[k]); }); });
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(p,3)); g.setAttribute('uv',new T.Float32BufferAttribute(u,2)); g.computeVertexNormals(); const m=new T.Mesh(g,mat); m.renderOrder=1; G.add(m); return m; };
 if(o.decals){ const t=TL.load(R+'decals_mul.jpg'); t.colorSpace=T.SRGBColorSpace; t.anisotropy=4;
  deco(o.decals,4,new T.MeshBasicMaterial({map:t,side:T.DoubleSide,transparent:true,premultipliedAlpha:true,blending:T.MultiplyBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,fog:false,toneMapped:false})); }
 if(o.posters){ const t=TL.load(R+'posters.png'); t.colorSpace=T.SRGBColorSpace; t.anisotropy=4;
  deco(o.posters,2,new T.MeshStandardMaterial({map:t,alphaTest:0.5,roughness:0.85,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1})); }
 return out; } ,
 // Statische Meshes (Liste von Objekten/Gruppen) nach Material-Objekt zusammenführen → weniger Draw Calls. Nur opake, nicht instanzierte Meshes; Ergebnis hängt an G.
 mergeByMaterial(G,objs,name){ const T=THREE; G.updateMatrixWorld(true); const inv=new T.Matrix4().copy(G.matrixWorld).invert(); const by=new Map(); let n=0;
  objs.forEach(o=>o&&o.traverse(m=>{ if(!m.isMesh||m.isInstancedMesh||m.isSkinnedMesh||Array.isArray(m.material)||m.material.transparent||!m.visible) return; (by.get(m.material)||by.set(m.material,[]).get(m.material)).push(m); }));
  by.forEach((ms,mat)=>{ if(ms.length<2) return; const gs=ms.map(m=>{ let g=m.geometry.clone(); g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,m.matrixWorld)); if(g.index) g=g.toNonIndexed(); return g; });
   const keys=['position','normal','uv','color'].filter(k=>gs.every(g=>g.attributes[k])); let N=0; gs.forEach(g=>N+=g.attributes.position.count); const r=new T.BufferGeometry();
   keys.forEach(k=>{ const sz=gs[0].attributes[k].itemSize, a=new Float32Array(N*sz); let o=0; gs.forEach(g=>{ a.set(g.attributes[k].array,o); o+=g.attributes[k].array.length; }); r.setAttribute(k,new T.BufferAttribute(a,sz)); });
   r.computeBoundingSphere(); ms.forEach(m=>m.parent&&m.parent.remove(m)); const mm=new T.Mesh(r,mat); mm.name=(name||'merged')+'_'+(n++); mm.matrixAutoUpdate=false; G.add(mm); });
  return n; } };
})();
