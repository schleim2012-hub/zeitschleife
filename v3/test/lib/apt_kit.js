/* Rewind Wohnung – Bau-Werkzeug: Geometrie nach Material zusammenführen (wenige Draw Calls), AO in Vertexfarben,
   Weltraum-UVs, Canvas-Texturen. Wird von apt_rooms.js benutzt. */
(function(){
// Geräusche (ElevenLabs Sound Effects, einmalig erzeugt, in assets/sfx/apt/) – vorgeladen als WebAudio-Puffer
const SFXN=['door_creak','door_latch','steps','crt_on','tv_static','pc_boot','tape_play','phone_lift','phone_line'], BUF={};
const AC=()=>{ try{ const a=window.__zsaAC||(window.__zsaAC=new (window.AudioContext||window.webkitAudioContext)()); if(a.state!=='running') a.resume(); return a; }catch(e){ return null; } };
window.aptLoadSFX=function(ROOT){ const a=AC(); if(!a) return; SFXN.forEach(n=>fetch(ROOT+'assets/sfx/apt/'+n+'.mp3').then(r=>r.arrayBuffer()).then(b=>a.decodeAudioData(b)).then(d=>{ BUF[n]=d; }).catch(()=>{})); };
window.aptSFX=function(n,vol,loop,at){ const a=AC(); if(!a||!BUF[n]) return null; const s=a.createBufferSource(); s.buffer=BUF[n]; s.loop=!!loop; const g=a.createGain(); g.gain.value=vol==null?0.6:vol; s.connect(g); g.connect(a.destination); s.start(a.currentTime+(at||0)); return {stop:()=>{ try{ s.stop(); }catch(e){} }, vol:v=>g.gain.setTargetAtTime(v,a.currentTime,0.1)}; };
window.aptHasSFX=n=>!!BUF[n];
window.aptKit=function(ROOT){ const T=THREE, TL=new T.TextureLoader(); /* ROOT für Audio-Pfade, sfx = aptSFX */
 const _m=new T.Matrix4(), _q=new T.Quaternion(), _e=new T.Euler(), _v=new T.Vector3(), _s=new T.Vector3(1,1,1);
 const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 const tex=(f,srgb,rep)=>{ const t=TL.load(ROOT+f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; if(rep) t.repeat.set(rep[0],rep[1]); return t; };
 const canvasTex=(w,h,fn,srgb=true)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); fn(x,w,h,c); const t=new T.CanvasTexture(c); if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; t.wrapS=t.wrapT=T.RepeatWrapping; t.userData.canvas=c; return t; };
 // Batch: B.put(key, geometry, x,y,z, color, rot, {ao, wuv, uvr:[u0,v0,u1,v1]})
 function Batch(){ this.D={}; }
 Batch.prototype.put=function(k,g,x,y,z,col,rot,opt){ opt=opt||{}; if(g.index) g=g.toNonIndexed(); _e.set(rot?rot[0]:0,rot?rot[1]:0,rot?rot[2]:0,'YXZ'); _q.setFromEuler(_e); _m.compose(_v.set(x,y,z),_q,opt.scale?new T.Vector3(...opt.scale):_s); g.applyMatrix4(_m);
  const p=g.attributes.position, n=g.attributes.normal, N=p.count, c=new Float32Array(N*3), cc=new T.Color(col);
  if(!g.attributes.uv) g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(N*2),2)); const uv=g.attributes.uv;
  if(opt.uvr){ const [u0,v0,u1,v1]=opt.uvr; for(let i=0;i<N;i++) uv.setXY(i,u0+uv.getX(i)*(u1-u0),v0+uv.getY(i)*(v1-v0)); }
  for(let i=0;i<N;i++){ const px=p.getX(i),py=p.getY(i),pz=p.getZ(i), nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i); const f=opt.ao?opt.ao(px,py,pz,nx,ny,nz):1; const jit=opt.jit?1-opt.jit*Math.random():1; c[i*3]=cc.r*f*jit; c[i*3+1]=cc.g*f*jit; c[i*3+2]=cc.b*f*jit;
   if(opt.wuv){ const s=opt.wuv, ax=Math.abs(nx), ay=Math.abs(ny), az=Math.abs(nz); if(ay>=ax&&ay>=az) uv.setXY(i,px/s,pz/s); else if(ax>=az) uv.setXY(i,pz/s,py/s); else uv.setXY(i,px/s,py/s); } }
  g.setAttribute('color',new T.BufferAttribute(c,3)); (this.D[k]=this.D[k]||[]).push(g); return g; };
 Batch.prototype.box=function(k,x0,x1,y0,y1,z0,z1,col,opt){ return this.put(k,new T.BoxGeometry(Math.abs(x1-x0),Math.abs(y1-y0),Math.abs(z1-z0)),(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,col,opt&&opt.rot,opt); };
 Batch.prototype.cyl=function(k,r0,r1,h,x,y,z,col,rot,seg,opt){ return this.put(k,new T.CylinderGeometry(r0,r1,h,seg||14),x,y,z,col,rot,opt); };
 Batch.prototype.build=function(group,mats){ const out={}; for(const k in this.D){ const list=this.D[k]; let N=0; list.forEach(g=>N+=g.attributes.position.count);
   const P=new Float32Array(N*3),Nn=new Float32Array(N*3),U=new Float32Array(N*2),C=new Float32Array(N*3); let off=0;
   list.forEach(g=>{ const n=g.attributes.position.count; P.set(g.attributes.position.array,off*3); Nn.set(g.attributes.normal.array,off*3); U.set(g.attributes.uv.array,off*2); C.set(g.attributes.color.array,off*3); off+=n; g.dispose(); });
   const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(P,3)); g.setAttribute('normal',new T.BufferAttribute(Nn,3)); g.setAttribute('uv',new T.BufferAttribute(U,2)); g.setAttribute('color',new T.BufferAttribute(C,3)); g.computeBoundingSphere();
   const m=mats[k]; if(!m){ console.warn('apt: kein Material',k); continue; } m.vertexColors=true; const me=new T.Mesh(g,m); me.matrixAutoUpdate=false; me.updateMatrix(); me.name='apt_'+k; group.add(me); out[k]=me; } this.D={}; return out; };
 // Raum-AO: Ecken/Kanten, Boden an Wänden, Kontaktschatten unter Möbeln (FURN = [x0,x1,z0,z1])
 const roomAO=(X0,X1,Z0,Z1,H,FURN)=>(x,y,z,nx,ny,nz)=>{ const dx=Math.min(x-X0,X1-x), dz=Math.min(z-Z0,Z1-z);
  if(ny>0.5&&y<0.05){ let a=0.4+0.6*cl(Math.min(dx,dz)/0.6,0,1); (FURN||[]).forEach(([a0,a1,b0,b1])=>{ const ex=Math.max(a0-x,0,x-a1), ez=Math.max(b0-z,0,z-b1); a*=0.5+0.5*cl(Math.hypot(ex,ez)/0.4,0,1); }); return a; }
  if(ny<-0.5&&y>H-0.05) return 0.5+0.5*cl(Math.min(dx,dz)/0.5,0,1);
  const dc=Math.max(Math.abs(nx)>0.5?dz:dx,0); return (0.5+0.5*cl(y/0.5,0,1))*(0.68+0.32*cl((H-y)/0.4,0,1))*(0.6+0.4*cl(dc/0.45,0,1)); };
 const objAO=(y0)=>(x,y,z,nx,ny)=>(0.62+0.38*cl((y-y0)/0.25,0,1))*(ny<-0.5?0.55:1);
 // Wand mit Löchern (Rechtecke [a0,a1,y0,y1]) als Streifen
 const wallFace=(B,k,face,X0,X1,Z0,Z1,H,holes,col,ao,wuv)=>{ const A0=(face==='N'||face==='S')?X0:Z0, A1=(face==='N'||face==='S')?X1:Z1;
  const cutsA=new Set([A0,A1]), cutsY=new Set([0,H]); (holes||[]).forEach(h=>{ cutsA.add(h[0]); cutsA.add(h[1]); cutsY.add(h[2]); cutsY.add(h[3]); });
  const sa=[...cutsA].sort((a,b)=>a-b), sy=[...cutsY].sort((a,b)=>a-b);
  for(let i=0;i<sa.length-1;i++) for(let j=0;j<sy.length-1;j++){ const a0=sa[i],a1=sa[i+1],y0=sy[j],y1=sy[j+1], ma=(a0+a1)/2, my=(y0+y1)/2; if((holes||[]).some(h=>ma>h[0]&&ma<h[1]&&my>h[2]&&my<h[3])) continue;
   const w=a1-a0, h=y1-y0, g=new T.PlaneGeometry(w,h,Math.max(1,Math.ceil(w/0.4)),Math.max(1,Math.ceil(h/0.4))), a=(a0+a1)/2, y=(y0+y1)/2, op={ao,wuv:wuv||1.2};
   if(face==='N') B.put(k,g,a,y,Z1,col,[0,Math.PI,0],op); else if(face==='S') B.put(k,g,a,y,Z0,col,null,op); else if(face==='W') B.put(k,g,X0,y,a,col,[0,Math.PI/2,0],op); else B.put(k,g,X1,y,a,col,[0,-Math.PI/2,0],op); } };
 const std=o=>new T.MeshStandardMaterial(Object.assign({roughness:0.8,metalness:0},o));
 const glowTex=canvasTex(128,128,(x)=>{ const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,230,190,0.95)'); g.addColorStop(0.25,'rgba(255,200,130,0.3)'); g.addColorStop(1,'rgba(255,190,110,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 const glow=(G,x,y,z,s,c,o)=>{ const sp=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:c,transparent:true,opacity:o,depthWrite:false,blending:T.AdditiveBlending,fog:false})); sp.position.set(x,y,z); sp.scale.set(s,s,1); G.add(sp); return sp; };
 const gltf=(url,cb)=>{ const el=document.createElement('a-entity'); el.setAttribute('gltf-model',ROOT+url); el.addEventListener('model-loaded',()=>{ const m=el.getObject3D('mesh'); if(m){ el.object3D.remove(m); cb(m); } }); el.addEventListener('model-error',e=>console.warn('apt glb',url)); document.querySelector('a-scene').appendChild(el); };
 // abgerundete Box (Polster, Gehäuse): Box mit Segmenten, Ecken auf Radius r gezogen
 const roundBox=(w,h,d,r,seg)=>{ seg=seg||5; const g=new T.BoxGeometry(w,h,d,seg,seg,seg), p=g.attributes.position, v=new T.Vector3(), c=new T.Vector3(); const hx=w/2-r, hy=h/2-r, hz=d/2-r;
  for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); c.set(cl(v.x,-hx,hx),cl(v.y,-hy,hy),cl(v.z,-hz,hz)); const o=v.clone().sub(c); if(o.lengthSq()>1e-9){ o.normalize().multiplyScalar(r); v.copy(c).add(o); } p.setXYZ(i,v.x,v.y,v.z); } g.computeVertexNormals(); return g; };
 // Text auf Canvas umbrechen
 const wrap=(x,text,X,Y,maxW,lh)=>{ const out=[]; text.split('\n').forEach(par=>{ if(!par){ out.push(''); return; } let line=''; par.split(' ').forEach(w=>{ const t=line?line+' '+w:w; if(x.measureText(t).width>maxW&&line){ out.push(line); line=w; } else line=t; }); out.push(line); }); out.forEach((l,i)=>x.fillText(l,X,Y+i*lh)); return out.length; };
 return {sfx:window.aptSFX||function(){},ROOT,roundBox,T,TL,cl,tex,canvasTex,Batch,roomAO,objAO,wallFace,std,glow,gltf,wrap}; };
})();
