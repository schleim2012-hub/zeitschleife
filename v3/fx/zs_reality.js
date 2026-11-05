/* ZSR – "Realität entsteht": die Welt wird aus türkisen Datenblöcken zusammengesetzt (und kann wieder zerfallen).
   Kein Bildschirm-Filter: jedes Mesh bekommt im eigenen Shader ein Welt-Raster aus Zellen. Zellen erscheinen von nah nach fern
   in Klumpen, sind kurz ein leuchtender Datenblock und werden dann zur echten Oberfläche. Dazu fliegen echte 3D-Blöcke
   (1 InstancedMesh, 1 Draw) an ihre Plätze. VR-komfortabel: weltfest, kein Strobo, keine Kamera-Bewegung, kein RGB-Split.
   API:
     const c = ZSR.assemble(root, {duration:3, origin:Vector3|fn, cell:0.16, radial:0.6, rest:true, blocks:2200, skip:fn(obj)})
       -> Controller {promise, dissolve(dur)->Promise, setRest(bool), stop()}
     ZSR.dissolve(dur)            – aktuelle Welt zerfällt wieder in Blöcke (Promise)
     ZSR.patch(root)              – Materialien nur vorbereiten (ohne Animation)
     ZSR.off()                    – Effekt komplett aus (alles sichtbar, keine Rest-Unruhe)
     ZSR.state                    – Debug (p, Materialanzahl, Blöcke)
   Nachgeladene Meshes (GLB kommt später) werden automatisch gepatcht und setzen sich dann selbst zusammen.
   Debug-URL: ?noreal=1 (aus) · ?realdur=3.2 · ?realrest=0 */
(function(){
const Q=location.search, qn=(k,d)=>{ const m=Q.match(new RegExp('[?&]'+k+'=([\\d.]+)')); return m?+m[1]:d; };
const OFF=/[?&]noreal=1/.test(Q);
const now=()=>window.__zsrNow!=null?window.__zsrNow:performance.now()/1000; // QA: __zsrNow = feste Uhr
const fr=Math.fround;
// Hash ohne sin (Hoskins), in JS bitgenau wie im Shader (float32) → fliegende Blöcke landen genau dann, wenn ihre Zelle erscheint
function h3(x,y,z){ let a=fr(x*0.1031), b=fr(y*0.1031), c=fr(z*0.1031); a=fr(a-Math.floor(a)); b=fr(b-Math.floor(b)); c=fr(c-Math.floor(c));
 const d=fr(fr(fr(a*fr(c+33.33))+fr(b*fr(b+33.33)))+fr(c*fr(a+33.33))); a=fr(a+d); b=fr(b+d); c=fr(c+d); const r=fr(fr(a+b)*c); return r-Math.floor(r); }
const GLSL_H=`float zsH(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.zyx+33.33); return fract((p.x+p.y)*p.z); }`;
let Z=null; // geteilte Uniforms
function uni(){ if(Z) return Z; const T=THREE; Z={zT:{value:now()},zS:{value:-1e4},zDur:{value:3},zX:{value:1e9},zXd:{value:1.2},zOrg:{value:new T.Vector3()},zMaxD:{value:6},zCell:{value:0.16},zRad:{value:0.6},
 zRest:{value:0},zHole:{value:new T.Vector4(0,-99,0,0.3)},zHoleK:{value:0},zScan:{value:new T.Vector3(-99,0,0)},zOn:{value:OFF?0:1}}; return Z; }
// Zell-Logik (Shader + JS identisch): Zellgröße wächst stufenweise mit der Entfernung (Photosphären/Himmel → grobe Blöcke)
function cellOf(x,y,z,o,cell){ const d=Math.hypot(x-o.x,y-o.y,z-o.z); const lv=Math.floor(Math.log2(Math.max(1,d/3))); const cs=cell*Math.pow(2,lv);
 const cx=Math.floor(x/cs), cy=Math.floor(y/cs), cz=Math.floor(z/cs); return {cs,cx,cy,cz}; }
function thrOf(c,o,maxD,rad){ const cs=c.cs, mx=(c.cx+0.5)*cs, my=(c.cy+0.5)*cs, mz=(c.cz+0.5)*cs; const dc=Math.hypot(mx-o.x,my-o.y,mz-o.z);
 const h1=h3(c.cx,c.cy,c.cz), h2=h3(Math.floor(mx/(cs*4))+17,Math.floor(my/(cs*4))+17,Math.floor(mz/(cs*4))+17);
 return 0.04+rad*Math.min(1,dc/maxD)+(0.96-rad)*(0.7*h2+0.3*h1); }
const BAND=0.16, SPAN=1+BAND; // p läuft 0..1; Zelle erscheint bei p*SPAN=thr, ist Datenblock bis thr+BAND
const FRAG=`
uniform float zT,zS,zDur,zX,zXd,zMaxD,zCell,zRad,zRest,zHoleK,zOn; uniform vec3 zOrg; uniform vec4 zHole; uniform vec3 zScan; varying vec3 vZsW;
${GLSL_H}
void main(){ zs_main(); if(zOn<0.5) return;
 vec3 w=vZsW; float d=length(w-zOrg); float lv=floor(log2(max(1.0,d/3.0))); float cs=zCell*exp2(lv);
 vec3 cc=floor(w/cs), f=fract(w/cs), mc=(cc+0.5)*cs; float dc=length(mc-zOrg);
 float h1=zsH(cc), h2=zsH(floor(mc/(cs*4.0))+17.0), hc=zsH(cc+71.0);
 float thr=0.04+zRad*min(1.0,dc/zMaxD)+(0.96-zRad)*(0.7*h2+0.3*h1);
 float p=clamp((zT-zS)/zDur,0.0,1.0); float px=1.0-clamp((zT-zX)/zXd,0.0,1.0); p=min(p,px);
 float a=p*${SPAN.toFixed(3)}-thr; float blk=0.0;
 if(p<1.0){ if(a<0.0) discard; blk=1.0-smoothstep(${(BAND*0.3).toFixed(3)},${BAND.toFixed(3)},a); }
 vec3 col=gl_FragColor.rgb; float dim=1.0;
 if(p<1.0) dim=mix(0.10,1.0,smoothstep(0.25,1.0,p)); // Raum kommt aus der Dunkelheit
 if(zRest>0.5){
  float hd=length(mc-zHole.xyz)/zHole.w; if(hd<1.0){ float e=zHoleK*(1.0-hd*hd); if(h1<e*0.7) discard; if(h1<e*1.05) blk=max(blk,0.9); }
  float sy=abs(mc.y-zScan.x); if(sy<cs*1.5) blk=max(blk,zScan.y*0.34*(0.4+0.6*hc)*(1.0-sy/(cs*1.5)));
  float tw=fract(zT*0.045+h1*13.0); if(hc>0.985&&tw<0.03) blk=max(blk,0.35*sin(tw/0.03*3.14159)); }
 if(blk>0.0){ float L=dot(col,vec3(0.299,0.587,0.114));
  vec3 bc=mix(vec3(0.02,0.40,0.50),vec3(0.40,0.90,0.98),hc); if(hc>0.97) bc=vec3(0.80,0.98,0.96); if(hc<0.05) bc=vec3(0.55,0.10,0.12);
  bc*=0.38+1.1*L+0.22*h1; vec3 e=min(f,1.0-f); float edge=step(min(e.x,min(e.y,e.z)),0.045); bc*=1.0-0.45*edge;
  col=mix(col*dim,bc,clamp(blk*0.9,0.0,1.0)); } else col*=dim;
 gl_FragColor.rgb=col; }`;
const mats=new Set();
function patchMat(m,o){ if(!m||m.userData.zsr||m.isRawShaderMaterial||m.isLineBasicMaterial||m.isPointsMaterial||m.isSpriteMaterial||m.depthTest===false) return; const U=uni();
 m.userData.zsr={zS:{value:-1e4}}; mats.add(m); const prev=m.onBeforeCompile, own=Object.prototype.hasOwnProperty.call(m,'customProgramCacheKey')?m.customProgramCacheKey:null, isSM=!!m.isShaderMaterial;
 m.onBeforeCompile=function(sh,r){ if(prev) prev.call(this,sh,r); Object.assign(sh.uniforms,U); sh.uniforms.zS=m.userData.zsr.zS;
  let vs=sh.vertexShader; const i=vs.lastIndexOf('}'); const wp=isSM?'vec4 zsw=vec4(position,1.0);':'vec4 zsw=vec4(transformed,1.0);';
  vs=vs.replace(/void\s+main\s*\(\s*\)/,'varying vec3 vZsW;\nvoid main()'); const j=vs.lastIndexOf('}');
  vs=vs.slice(0,j)+`\n${wp}\n#ifdef USE_INSTANCING\nzsw=instanceMatrix*zsw;\n#endif\nvZsW=(modelMatrix*zsw).xyz;\n}`+vs.slice(j+1); sh.vertexShader=vs;
  sh.fragmentShader=sh.fragmentShader.replace(/void\s+main\s*\(\s*\)/,'void zs_main()')+FRAG; };
 m.customProgramCacheKey=function(){ return 'zsr2|'+(own?own.call(this):(prev?prev.toString():'')); }; m.needsUpdate=true; }
function eachMesh(root,skip,fn){ root.traverse(o=>{ if(skip&&skip(o)) return; if((o.isMesh||o.isSkinnedMesh||o.isInstancedMesh)&&!o.userData.zsrSkip) fn(o); }); }
function patch(root,skip,zs){ let n=0; eachMesh(root,skip,o=>{ for(const m of (Array.isArray(o.material)?o.material:[o.material])){ if(m&&!m.userData.zsr){ patchMat(m); if(m.userData.zsr){ m.userData.zsr.zS.value=zs!=null?zs:now(); n++; } } } }); return n; }
// skip: Teilbaum ausnehmen (Kamera-Rig, HUD, eigene Blöcke)
function mkSkip(user){ return o=>{ for(let p=o;p;p=p.parent){ if(p.userData&&(p.userData.zsrSkip||p.isCamera)) return true; if(p.el&&p.el.id&&/^(rig|cam|hl|hr)$/.test(p.el.id)) return true; } return user?user(o):false; }; }
// Oberflächen abtasten → Zellen (Ziele der fliegenden Blöcke)
function sampleCells(root,skip,o,cell,maxN){ const T=THREE, tri=[], v=[new T.Vector3(),new T.Vector3(),new T.Vector3()], seen=new Map(); let tot=0;
 eachMesh(root,skip,m=>{ if(m.isInstancedMesh||!vis(m)) return; const g=m.geometry, P=g&&g.attributes&&g.attributes.position; if(!P) return; m.updateWorldMatrix(true,false);
  const ix=g.index, n=ix?ix.count:P.count, M=m.matrixWorld, step=Math.max(3,Math.floor(n/3/4000)*3);
  for(let t=0;t+2<n;t+=step){ for(let k=0;k<3;k++){ const id=ix?ix.getX(t+k):t+k; v[k].fromBufferAttribute(P,id).applyMatrix4(M); }
   const ar=new T.Vector3().subVectors(v[1],v[0]).cross(new T.Vector3().subVectors(v[2],v[0])).length()*0.5*(step/3); if(!(ar>0)) continue;
   const cx=(v[0].x+v[1].x+v[2].x)/3, cy=(v[0].y+v[1].y+v[2].y)/3, cz=(v[0].z+v[1].z+v[2].z)/3, d=Math.hypot(cx-o.x,cy-o.y,cz-o.z), w=ar/Math.max(1,(d/3)*(d/3));
   tri.push([v[0].clone(),v[1].clone(),v[2].clone(),w]); tot+=w; } });
 if(!tri.length) return []; const want=maxN*3, acc=[]; let c=0; for(const t of tri){ c+=t[3]; acc.push(c); }
 for(let i=0;i<want&&seen.size<maxN;i++){ const r=Math.random()*tot; let lo=0,hi=acc.length-1; while(lo<hi){ const mid=(lo+hi)>>1; if(acc[mid]<r) lo=mid+1; else hi=mid; }
  const t=tri[lo]; let a=Math.random(), b=Math.random(); if(a+b>1){ a=1-a; b=1-b; } const x=t[0].x+(t[1].x-t[0].x)*a+(t[2].x-t[0].x)*b, y=t[0].y+(t[1].y-t[0].y)*a+(t[2].y-t[0].y)*b, z=t[0].z+(t[1].z-t[0].z)*a+(t[2].z-t[0].z)*b;
  const ce=cellOf(x,y,z,o,cell), key=ce.cx+','+ce.cy+','+ce.cz+','+ce.cs; if(!seen.has(key)) seen.set(key,ce); }
 return [...seen.values()]; }
function vis(m){ for(let p=m;p;p=p.parent) if(!p.visible) return false; const ms=Array.isArray(m.material)?m.material:[m.material]; return ms.some(x=>x&&x.visible!==false&&x.colorWrite!==false&&!(x.transparent&&x.opacity<0.05)); }
let C=null; // aktiver Controller
function buildBlocks(cells,o,maxD,rad,cell){ cells=cells.filter(c=>c.cs<=cell*8.01); /* riesige Fern-Blöcke (Himmel) fliegen nicht – die setzt der Shader */ const T=THREE, N=cells.length; if(!N) return null;
 const geo=new T.BoxGeometry(1,1,1), mat=new T.MeshBasicMaterial({color:0xffffff,transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false});
 const im=new T.InstancedMesh(geo,mat,N); im.frustumCulled=false; im.userData.zsrSkip=1; im.renderOrder=5; im.instanceMatrix.setUsage(T.DynamicDrawUsage);
 const B=cells.map(c=>{ const cs=c.cs, t=new T.Vector3((c.cx+0.5)*cs,(c.cy+0.5)*cs,(c.cz+0.5)*cs); const toO=new T.Vector3().subVectors(o,t); const dl=toO.length()||1; toO.multiplyScalar(1/dl);
  const off=new T.Vector3((Math.random()-0.5)*0.9,(Math.random()-0.5)*2.2,(Math.random()-0.5)*0.9).addScaledVector(toO,Math.min(dl*0.5,0.4+Math.random()*0.9)).multiplyScalar(cs/0.16>1?Math.min(4,cs/0.16):1);
  const hc=Math.random(); const col=hc>0.96?new T.Color(0.8,1,0.97):hc<0.03?new T.Color(0.6,0.12,0.14):new T.Color().setRGB(0.02,0.42,0.52).lerp(new T.Color(0.45,0.95,1.0),Math.random());
  return {t,off,cs,thr:thrOf(c,o,maxD,rad),col,fly:0.10+Math.random()*0.08,near:Math.min(1,Math.max(0.25,(dl-0.35)/1.2))}; }); // ganz nah am Kopf: schwächer (kein Blenden)
 const col0=new T.Color(0,0,0), mx=new T.Matrix4(); for(let i=0;i<N;i++){ im.setColorAt(i,col0); im.setMatrixAt(i,mx.makeScale(0,0,0)); }
 return {org:o.clone(),im,B,N,mx,q:new T.Quaternion(),s:new T.Vector3(),pp:new T.Vector3(),c:new T.Color()}; }
function updBlocks(K,p,rest,hole,hk){ if(!K) return; const {im,B,N,mx,q,s,pp,c}=K; if(p>=1&&hk<=0.01){ if(!K.clear){ K.clear=true; im.visible=false; } return; } K.clear=false; let any=false;
 for(let i=0;i<N;i++){ const b=B[i]; const a=p*SPAN-b.thr; let k=0, m=0, sc=0;
  if(p<1&&a>-b.fly&&a<BAND){ if(a<0){ m=1+a/b.fly; m=m*m*(3-2*m); k=0.25+0.75*m; sc=0.35+0.65*m; } else { m=1; k=1-a/BAND; sc=1; } }
  else if(rest&&hk>0.01){ const dd=b.t.distanceTo(hole.xyz)/hole.w; if(dd<1){ k=hk*(1-dd)*0.7; m=1-hk*0.35*(1-dd); sc=0.9; } }
  if(k<=0.002){ mx.makeScale(0,0,0); im.setMatrixAt(i,mx); continue; } any=true;
  pp.copy(b.t).addScaledVector(b.off,1-m); { const dd=pp.distanceTo(K.org); if(dd<0.75) k*=Math.max(0,(dd-0.35)/0.4); } /* nichts fliegt durch den Kopf */ const str=a<0&&p<1?1+2.2*(1-m):1; s.set(b.cs*0.92*sc,b.cs*0.92*sc*str,b.cs*0.92*sc); mx.compose(pp,q,s); im.setMatrixAt(i,mx);
  c.copy(b.col).multiplyScalar(0.42*k*b.near); im.setColorAt(i,c); }
 im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; im.visible=any; }
function sceneOf(){ return window.AFRAME&&AFRAME.scenes&&AFRAME.scenes[0]; }
let hooked=false;
function hook(){ if(hooked) return; const sc=sceneOf(); if(!sc||!sc.object3D) return; hooked=true; const S=sc.object3D, prev=S.onBeforeRender;
 S.onBeforeRender=function(){ try{ tick(); }catch(e){ console.warn('zsr',e); } if(prev) return prev.apply(this,arguments); }; }
// Rest-Loch bevorzugt dort, wo man hinschaut (1–4,5 m, im Blickkegel) – sonst passiert es ungesehen hinter dem Rücken
function pickInView(){ if(!C.cells.length) return null; const sc=sceneOf(), T=THREE, cp=new T.Vector3(), cd=new T.Vector3(); let best=null;
 if(sc&&sc.camera){ sc.camera.getWorldPosition(cp); sc.camera.getWorldDirection(cd); }
 for(let i=0;i<40;i++){ const c=C.cells[(Math.random()*C.cells.length)|0]; best=best||c; if(!sc||!sc.camera) break; const v=new T.Vector3((c.cx+0.5)*c.cs-cp.x,(c.cy+0.5)*c.cs-cp.y,(c.cz+0.5)*c.cs-cp.z), d=v.length(); if(d>1&&d<4.5&&v.dot(cd)/d>0.8){ best=c; break; } } return best; }
function tick(){ const U=uni(), t=now(); U.zT.value=t; if(!C) return; const p=Math.min(Math.min(1,(t-C.t0)/C.dur),1-Math.min(1,Math.max(0,(t-U.zX.value)/U.zXd.value)));
 if(++C.fc%15===1){ patch(C.root,C.skip,p<1?C.t0:t); } // nachgeladene Meshes: während des Aufbaus im selben Takt, danach setzen sie sich selbst zusammen
 // Rest-Unruhe: ab und zu fehlt ein Stück (weich, ~2 s), ein Scan-Schimmer zieht langsam durch den Raum
 const R=C.rest&&p>=1; U.zRest.value=R?1:0; let hk=0;
 if(R){ if(!C.hole||t>C.hole.end){ if(!C.hole||t>C.nextHole){ const pick=pickInView(); if(pick){ const cs=pick.cs; C.hole={c:new THREE.Vector3((pick.cx+0.5)*cs,(pick.cy+0.5)*cs,(pick.cz+0.5)*cs),r:cs*(2+Math.random()*2.5),st:t,end:t+2.2}; } C.nextHole=t+6+Math.random()*8; } }
  if(C.hole&&t<=C.hole.end){ const u=(t-C.hole.st)/2.2; hk=u<0.25?u/0.25:u>0.7?(1-u)/0.3:1; hk=hk*hk*(3-2*hk); U.zHole.value.set(C.hole.c.x,C.hole.c.y,C.hole.c.z,C.hole.r); }
  if(t>C.nextScan){ C.scanSt=t; C.nextScan=t+10+Math.random()*8; } const su=(t-C.scanSt)/4.5; if(su>=0&&su<=1){ U.zScan.value.set(C.yLo+(C.yHi-C.yLo)*su,Math.sin(su*Math.PI),0); } else U.zScan.value.set(-99,0,0); }
 U.zHoleK.value=hk; updBlocks(C.K,p,R,{xyz:U.zHole.value,w:U.zHole.value.w},hk);
 if(p>=1&&!C.done){ C.done=true; C.res&&C.res(); } }
function assemble(root,o={}){ const T=THREE, U=uni(); hook(); if(OFF){ return {promise:Promise.resolve(),dissolve:()=>Promise.resolve(),setRest(){},stop(){}}; }
 if(C) stop(true); const sc=sceneOf(); const skip=mkSkip(o.skip);
 let org=typeof o.origin==='function'?o.origin():o.origin; if(!org){ org=new T.Vector3(); if(sc&&sc.camera) sc.camera.getWorldPosition(org); }
 const dur=qn('realdur',o.duration||3), cell=o.cell||0.16, rad=o.radial!=null?o.radial:0.6, t=now();
 root.updateMatrixWorld(true); const cells=sampleCells(root,skip,org,cell,o.blocks||2200);
 const ds=cells.map(c=>Math.hypot((c.cx+0.5)*c.cs-org.x,(c.cy+0.5)*c.cs-org.y,(c.cz+0.5)*c.cs-org.z)).sort((a,b)=>a-b); let maxD=o.maxD||Math.max(2,ds.length?ds[Math.floor(ds.length*0.85)]:6); // 85 %-Perzentil: ein ferner Ausreißer (Himmel/Bodenplatte) staucht die Zeit sonst
 let yLo=1e9,yHi=-1e9; for(const c of cells){ if(c.cs>cell*1.5) continue; const y=(c.cy+0.5)*c.cs; if(y<yLo) yLo=y; if(y>yHi) yHi=y; } if(yLo>yHi){ yLo=org.y-1.6; yHi=org.y+1; }
 U.zOrg.value.copy(org); U.zMaxD.value=maxD; U.zCell.value=cell; U.zRad.value=rad; U.zDur.value=dur; U.zX.value=1e9; U.zOn.value=1; U.zRest.value=0;
 patch(root,skip,t); for(const m of mats) m.userData.zsr.zS.value=t; U.zS.value=t;
 const K=buildBlocks(cells,org,maxD,rad,cell); if(K&&sc) sc.object3D.add(K.im);
 const rest=o.rest!=null?o.rest:qn('realrest',1)>0;
 C={root,skip,t0:t,dur,cells,K,rest,fc:0,nextHole:t+dur+3+Math.random()*3,nextScan:t+dur+1.5,scanSt:-99,yLo,yHi,done:false};
 const ctl=C; C.promise=new Promise(r=>{ ctl.res=r; });
 return {promise:C.promise,dissolve:d=>dissolve(d),setRest:b=>{ ctl.rest=!!b; },stop:()=>stop(),get p(){ return Math.min(1,(now()-ctl.t0)/ctl.dur); }}; }
function dissolve(d=1.2){ const U=uni(); if(!C) return Promise.resolve(); U.zXd.value=d; U.zX.value=now(); C.rest=false; return new Promise(r=>setTimeout(r,d*1000)); }
function stop(keep){ if(!C) return; if(C.K){ C.K.im.parent&&C.K.im.parent.remove(C.K.im); C.K.im.geometry.dispose(); C.K.im.material.dispose(); } C.res&&C.res(); C=null; if(!keep){ const U=uni(); U.zRest.value=0; U.zS.value=-1e4; for(const m of mats) m.userData.zsr.zS.value=-1e4; } }
function off(){ stop(); uni().zOn.value=0; }
window.ZSR={assemble,dissolve,patch:(r,s)=>patch(r,mkSkip(s),-1e4),off,stop,tick,get state(){ const U=uni(); return {active:!!C,p:C?Math.min(1,(now()-C.t0)/C.dur):1,mats:mats.size,blocks:C&&C.K?C.K.N:0,maxD:U.zMaxD.value,rest:U.zRest.value}; },_h3:h3};
})();
