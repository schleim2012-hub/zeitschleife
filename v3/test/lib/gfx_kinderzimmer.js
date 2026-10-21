/* Rewind V3 – gfx_kinderzimmer.js v1 (Grafik-Bot): Draw-Call-Optimierung Kinderzimmer 1984 zur Laufzeit, ohne k84.js/era-Dateien zu ändern.
   1) Statische Builder-Meshes aus build84() (nur die Gruppe, die k84 selbst anlegt) werden nach Material zusammengeführt:
      gleiche Material-Parameter → 1 Mesh; Farbunterschiede wandern in Vertex-Farben, Bild-Texturen ohne Kachelung (Poster, Comics, Kissen) in einen Atlas.
   2) Greifbare Items (.clickable mit 6-Material-Box: VHS/Buch/Cereal/Cover) bekommen 1 Material + Atlas (Cover + weiße Zelle, Farben als Vertex-Farben).
      Entity, Mesh-Objekt, Klick/Grip/Examine bleiben unverändert (nur geometry/material des Meshes werden getauscht).
   Nicht angefasst: TV, GLB-Möbel, Diddl, Sprites/Points, alles, was andere Skripte (alpha.js, zsx.js, era_extras.js) später hinzufügen.
   Abschalten: ?gfx=0 in der URL. Debug: window.__gfxK84 */
(function(){
if(/[?&]gfx=0\b/.test(location.search)) return;
const T=THREE, ST={merged:[],items:[],removed:0,groups:0,log:[]}; window.__gfxK84=ST;
const log=(...a)=>{ ST.log.push(a.join(' ')); console.log('[gfx84]',...a); };
let G84=null; const t0g=performance.now();
// Ladezähler (DefaultLoadingManager): Texturen setzen ihre .map erst im onLoad-Callback → erst mergen, wenn nichts mehr lädt
const LM=T.DefaultLoadingManager, LD={n:0,last:performance.now()}; { const s0=LM.itemStart.bind(LM), e0=LM.itemEnd.bind(LM), er0=LM.itemError.bind(LM);
 LM.itemStart=u=>{ LD.n++; LD.last=performance.now(); s0(u); }; LM.itemEnd=u=>{ LD.n=Math.max(0,LD.n-1); LD.last=performance.now(); e0(u); }; LM.itemError=u=>{ LD.last=performance.now(); er0(u); }; }
const idle=()=>LD.n===0&&performance.now()-LD.last>600;
// build84 umwickeln, um die vom Builder angelegte Gruppe sicher zu identifizieren
const orig=window.build84; if(typeof orig!=='function'){ console.warn('[gfx84] build84 fehlt'); return; }
window.build84=function(sc){ const before=new Set(sc.object3D.children); const r=orig.apply(this,arguments);
 G84=sc.object3D.children.find(o=>!before.has(o)&&o.isGroup&&!o.el)||null; ST.group=G84; schedule(sc); return r; };

const imgOK=t=>!t||(t.image&&((t.image.complete&&t.image.naturalWidth>0)||t.image.width>0&&!(t.image instanceof HTMLImageElement)));
const texKey=t=>t?[(t.image&&(t.image.currentSrc||t.image.src))||t.uuid,t.repeat.x,t.repeat.y,t.offset.x,t.offset.y,t.rotation,t.isCanvasTexture?t.uuid:'',t.isVideoTexture?t.uuid:''].join(','):'';
const MAPS=['map','normalMap','roughnessMap','metalnessMap','aoMap','lightMap','alphaMap','emissiveMap','bumpMap','displacementMap','envMap'];
function matKey(m,atlas){ const p=[m.type,m.transparent,+(m.opacity||0).toFixed(3),m.side,m.blending,m.depthWrite,m.depthTest,m.alphaTest,m.toneMapped,m.fog,m.polygonOffset,m.polygonOffsetFactor,m.polygonOffsetUnits,m.flatShading,m.wireframe,
  m.roughness!=null?(Math.round(m.roughness*10)/10):'',m.metalness!=null?(Math.round(m.metalness*10)/10):'',m.envMapIntensity,m.emissive?m.emissive.getHex():'',m.emissiveIntensity,m.normalScale?m.normalScale.x+'/'+m.normalScale.y:'',m.aoMapIntensity,m.lightMapIntensity];
 MAPS.forEach(k=>p.push(k==='map'&&atlas?'ATLAS':texKey(m[k]))); return p.join('|'); }
function uvIn01(g){ const uv=g.attributes.uv; if(!uv) return false; for(let i=0;i<uv.count;i++){ const u=uv.getX(i), v=uv.getY(i); if(u<-1e-3||u>1.001||v<-1e-3||v>1.001) return false; } return true; }
const atlasOK=(m,g)=>m.map&&!m.map.isCanvasTexture&&!m.map.isVideoTexture&&m.map.repeat.x===1&&m.map.repeat.y===1&&!m.map.offset.x&&!m.map.offset.y&&!m.normalMap&&!m.roughnessMap&&!m.alphaMap&&!m.transparent&&imgOK(m.map)&&uvIn01(g);
function canMerge(o){ if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.visible) return false; const g=o.geometry; if(!g||!g.attributes.position||g.morphAttributes&&Object.keys(g.morphAttributes).length) return false;
 const m=o.material; if(!m||Array.isArray(m)||m.isShaderMaterial||m.visible===false) return false; if(o.onBeforeRender&&o.onBeforeRender!==T.Object3D.prototype.onBeforeRender) return false;
 if(o.userData&&(o.userData.noMerge||o.userData.dynamic)) return false; for(const k of MAPS) if(m[k]&&(m[k].isVideoTexture||!imgOK(m[k]))) return false; let p=o; while(p){ if(!p.visible) return false; p=p.parent; } return true; }

// Atlas aus Bild-Texturen; cells: Map(texKey → {u0,v0,us,vs}); white: Zelle für einfarbige Flächen
function buildAtlas(texs,withWhite){ const n=texs.length+(withWhite?1:0), CW=512, CH=768, cols=Math.min(4,n), rows=Math.ceil(n/cols);
 const c=document.createElement('canvas'); c.width=CW*cols; c.height=CH*rows; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); const cells=new Map(), P=6;
 texs.forEach((t,i)=>{ const cx=(i%cols)*CW, cy=Math.floor(i/cols)*CH; x.drawImage(t.image,cx,cy,CW,CH); x.drawImage(t.image,cx+P,cy+P,CW-2*P,CH-2*P);
  cells.set(t,{u0:(cx+P)/c.width,v0:1-(cy+CH-P)/c.height,us:(CW-2*P)/c.width,vs:(CH-2*P)/c.height}); });
 let white=null; if(withWhite){ const i=texs.length, cx=(i%cols)*CW, cy=Math.floor(i/cols)*CH; white={u:(cx+CW/2)/c.width,v:1-(cy+CH/2)/c.height}; }
 const tx=new T.CanvasTexture(c); tx.colorSpace=T.SRGBColorSpace; tx.anisotropy=8; tx.needsUpdate=true; return {tex:tx,cells,white,canvas:c}; }

// Geometrie in Weltkoordinaten (relativ zu root) mit Farbe → {p,n,uv,col,idx}
function bake(g,mat4,color,hasVC,uvFn){ const P=g.attributes.position, N=g.attributes.normal, U=g.attributes.uv, C=hasVC&&g.attributes.color, cnt=P.count;
 const nm=new T.Matrix3().getNormalMatrix(mat4), v=new T.Vector3(), out={p:new Float32Array(cnt*3),n:new Float32Array(cnt*3),uv:new Float32Array(cnt*2),c:new Float32Array(cnt*3)};
 for(let i=0;i<cnt;i++){ v.fromBufferAttribute(P,i).applyMatrix4(mat4); out.p.set([v.x,v.y,v.z],i*3); if(N){ v.fromBufferAttribute(N,i).applyMatrix3(nm).normalize(); out.n.set([v.x,v.y,v.z],i*3); }
  let u=U?U.getX(i):0, w=U?U.getY(i):0; if(uvFn){ const r=uvFn(u,w,i); u=r[0]; w=r[1]; } out.uv[i*2]=u; out.uv[i*2+1]=w;
  const cr=C?C.getX(i):1, cg=C?C.getY(i):1, cb=C?C.getZ(i):1; out.c.set([cr*color.r,cg*color.g,cb*color.b],i*3); }
 let idx=g.index?Array.from(g.index.array):[...Array(cnt).keys()]; if(mat4.determinant()<0) for(let i=0;i<idx.length;i+=3){ const t=idx[i+1]; idx[i+1]=idx[i+2]; idx[i+2]=t; }
 return Object.assign(out,{idx}); }
function join(parts){ let nv=0, ni=0; parts.forEach(p=>{ nv+=p.p.length/3; ni+=p.idx.length; }); const P=new Float32Array(nv*3),N=new Float32Array(nv*3),U=new Float32Array(nv*2),C=new Float32Array(nv*3), I=nv>65535?new Uint32Array(ni):new Uint16Array(ni);
 let ov=0, oi=0; parts.forEach(p=>{ P.set(p.p,ov*3); N.set(p.n,ov*3); U.set(p.uv,ov*2); C.set(p.c,ov*3); for(let k=0;k<p.idx.length;k++) I[oi+k]=p.idx[k]+ov; ov+=p.p.length/3; oi+=p.idx.length; });
 const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(P,3)); g.setAttribute('normal',new T.BufferAttribute(N,3)); g.setAttribute('uv',new T.BufferAttribute(U,2)); g.setAttribute('uv1',new T.BufferAttribute(U,2)); g.setAttribute('color',new T.BufferAttribute(C,3)); g.setIndex(new T.BufferAttribute(I,1)); g.computeBoundingBox(); g.computeBoundingSphere(); return g; }

function mergeStatic(){ if(!G84) return; G84.updateMatrixWorld(true); const inv=new T.Matrix4().copy(G84.matrixWorld).invert(); const groups=new Map();
 G84.traverse(o=>{ if(o===G84||!canMerge(o)) return; const at=atlasOK(o.material,o.geometry), k=matKey(o.material,at); if(!groups.has(k)) groups.set(k,{at,list:[]}); groups.get(k).list.push(o); });
 let before=0, after=0;
 groups.forEach(({at,list},k)=>{ before+=list.length; if(list.length<2){ after+=list.length; return; }
  const texs=at?[...new Set(list.map(o=>o.material.map))]:[]; const A=at&&texs.length>1?buildAtlas(texs,false):null;
  const base=list[0].material, m=base.clone(); m.color=new T.Color(1,1,1); m.vertexColors=true; if(A) m.map=A.tex; else if(at) m.map=base.map;
  if(base.roughness!=null) m.roughness=list.reduce((s,o)=>s+o.material.roughness,0)/list.length; if(base.metalness!=null) m.metalness=list.reduce((s,o)=>s+o.material.metalness,0)/list.length;
  const parts=list.map(o=>{ const mm=new T.Matrix4().multiplyMatrices(inv,o.matrixWorld); const cell=A&&A.cells.get(o.material.map); return bake(o.geometry,mm,o.material.color||new T.Color(1,1,1),!!o.material.vertexColors,cell?(u,v)=>[cell.u0+u*cell.us,cell.v0+v*cell.vs]:null); });
  const me=new T.Mesh(join(parts),m); me.name='gfx84_merged_'+ST.merged.length; me.matrixAutoUpdate=false; me.renderOrder=Math.max(...list.map(o=>o.renderOrder||0)); G84.add(me); ST.merged.push({mesh:me,n:list.length,atlas:A?texs.length:0,key:k});
  list.forEach(o=>{ o.parent&&o.parent.remove(o); }); ST.removed+=list.length; after++; });
 // leere Gruppen bleiben stehen (z.B. Teddy, Kassette) – kosten keine Draws
 ST.groups=groups.size; log('t='+((performance.now()-t0g)/1000).toFixed(1)+'s static merge: meshes',before,'→',after,'(merged groups:',ST.merged.length+')'); }

function fixItem(mesh){ if(!mesh||!mesh.isMesh||!Array.isArray(mesh.material)||mesh.userData.gfx84) return 'skip'; const mats=mesh.material, g=mesh.geometry; if(!g.groups.length) return 'skip';
 if(mats.some(m=>!m||!m.isMeshStandardMaterial||MAPS.some(k=>k!=='map'&&m[k]))) return 'skip'; if(mats.some(m=>m.map&&!imgOK(m.map))) return 'wait'; if(!mats.some(m=>m.map)&&!fixItem.late) return 'wait'; // Cover-Textur noch nicht zugewiesen
 const texs=[...new Set(mats.filter(m=>m.map).map(m=>m.map))]; const A=buildAtlas(texs,true); A.tex.anisotropy=8;
 const fi=new Int32Array(g.attributes.position.count).fill(-1); g.groups.forEach(gr=>{ const idx=g.index?g.index.array:null; for(let k=gr.start;k<gr.start+gr.count;k++){ const vi=idx?idx[k]:k; fi[vi]=gr.materialIndex; } });
 const P=g.attributes.position, U=g.attributes.uv, C=new Float32Array(P.count*3), NU=new Float32Array(P.count*2);
 for(let i=0;i<P.count;i++){ const m=mats[Math.max(0,fi[i])]; const col=m.color||new T.Color(1,1,1); C.set([col.r,col.g,col.b],i*3);
  if(m.map){ const c=A.cells.get(m.map); NU[i*2]=c.u0+U.getX(i)*c.us; NU[i*2+1]=c.v0+U.getY(i)*c.vs; } else { NU[i*2]=A.white.u; NU[i*2+1]=A.white.v; } }
 const ng=g.clone(); ng.setAttribute('uv',new T.BufferAttribute(NU,2)); ng.setAttribute('color',new T.BufferAttribute(C,3)); ng.clearGroups();
 const front=mats.find(m=>m.map)||mats[0]; const nm=new T.MeshStandardMaterial({map:A.tex,vertexColors:true,roughness:front.roughness,metalness:front.metalness||0,envMapIntensity:front.envMapIntensity});
 mesh.userData.gfx84={oldMats:mats,oldGeo:g}; mesh.geometry=ng; mesh.material=nm; ST.items.push(mesh); return 'ok'; }
function fixItems(){ let wait=0; document.querySelectorAll('a-scene .clickable').forEach(el=>{ if(el.id==='tv'||el.hasAttribute('gltf-model')) return; const me=el.getObject3D&&el.getObject3D('mesh'); const r=fixItem(me); if(r==='wait') wait++; }); return wait; }

function schedule(sc){ const t0=performance.now(); let staticDone=false;
 const tick=()=>{ const age=performance.now()-t0;
  if(!staticDone){ let pend=0; if(G84) G84.traverse(o=>{ if(o.isMesh&&o.material&&!Array.isArray(o.material)) MAPS.forEach(k=>{ const t=o.material[k]; if(t&&!t.isVideoTexture&&!imgOK(t)) pend++; }); });
   if(G84&&((pend===0&&idle())||age>30000)&&age>1500){ try{ mergeStatic(); }catch(e){ console.warn('[gfx84] merge failed',e); } staticDone=true; } }
  let w=0; fixItem.late=age>40000; if(staticDone&&(idle()||age>30000)) try{ w=fixItems(); }catch(e){ console.warn('[gfx84] items failed',e); }
  if(!staticDone||w>0||age<12000) setTimeout(tick,500); else log('items optimised:',ST.items.length,'t='+(age/1000).toFixed(1)+'s, loader idle:',idle()); };
 setTimeout(tick,500); }
})();
