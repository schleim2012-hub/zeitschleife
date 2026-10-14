// Rewind V3 – generische Ära-Testräume (X-Files-Foto-Welt). Konfig über window.ERA vor dem Laden.
(function(){
const C=window.ERA, T=THREE, S=document.querySelector('a-scene');
const sub=document.getElementById('sub');
let subBusy=false;
function say(who,text,file,ms){ sub.textContent=(who?who+': ':'')+text; sub.style.display='block'; subBusy=true;
 const done=()=>{ subBusy=false; setTimeout(()=>{ if(!subBusy) sub.style.display='none'; },500); };
 if(file){ const a=new Audio(file); a.volume=0.9; a.onended=a.onerror=done; a.play().catch(()=>setTimeout(done,ms||3500)); } else setTimeout(done,ms||3500); }
window.eraSay=say;
// desktop grain
(()=>{const c=document.getElementById('ffgrain'),x=c.getContext('2d');c.width=320;c.height=180;const d=x.createImageData(320,180);(function f(){for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}x.putImageData(d,0,0);setTimeout(()=>requestAnimationFrame(f),60);})();})();
S.addEventListener('loaded',()=>{
 const G=S.object3D, TL=new T.TextureLoader();
 const tex=(u,cb)=>TL.load(u,t=>{t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;cb&&cb(t);});
 const std=o=>new T.MeshStandardMaterial(o);
 // curved photo backdrop
 const B=C.backdrop, PX=B.px, R=B.r, H=512*PX, ang=768*PX/R;
 const bm=new T.MeshBasicMaterial({color:0xffffff,fog:false,toneMapped:false,side:T.DoubleSide});
 tex(B.url,t=>{bm.map=t;bm.needsUpdate=true;});
 const bd=new T.Mesh(new T.CylinderGeometry(R,R,H,64,1,true,Math.PI-ang/2,ang),bm); bd.scale.x=-1;
 bd.position.set(0,1.6+(256-B.horizonRow)*PX,R-B.front); G.add(bd);
 // shell
 const wallM=std({color:C.wall,roughness:0.95,emissive:C.wallEm||0x000000}), floorM=std({color:C.floor,roughness:C.floorRough||0.6,metalness:0.1});
 if(C.floorTex) tex(C.floorTex,t=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(C.floorRep||5,C.floorRep||5);floorM.map=t;floorM.needsUpdate=true;});
 if(C.wallTex) tex(C.wallTex,t=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,2);wallM.map=t;wallM.needsUpdate=true;});
 const box=(w,h,d,m,x,y,z)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);G.add(o);return o;};
 const W=C.room; if(!W.noWalls){ box(0.1,W.h,W.d,wallM,-W.w/2,W.h/2,W.cz); box(0.1,W.h,W.d,wallM,W.w/2,W.h/2,W.cz); box(W.w,W.h,0.1,wallM,0,W.h/2,W.cz+W.d/2); }
 if(W.ceiling) box(W.w,0.1,W.d+4,wallM,0,W.h,W.cz-1);
 const flD=C.floorFront!=null?(W.cz+W.d/2-C.floorFront):W.d+6; const fl=new T.Mesh(new T.PlaneGeometry(W.w,flD),floorM); fl.rotation.x=-Math.PI/2; fl.position.set(0,0,W.cz+W.d/2-flD/2); G.add(fl);
 if(C.floorFade){ const ac=document.createElement('canvas'); ac.width=ac.height=256; const ax=ac.getContext('2d'); const [cx,cy,r0,r1]=C.floorFade; const g=ax.createRadialGradient(cx*256,cy*256,r0*256,cx*256,cy*256,r1*256); g.addColorStop(0,'#fff'); g.addColorStop(1,'#000'); ax.fillStyle=g; ax.fillRect(0,0,256,256);
  floorM.alphaMap=new T.CanvasTexture(ac); floorM.transparent=true; floorM.depthWrite=false; floorM.needsUpdate=true; fl.renderOrder=2; }
 // glows
 const gc=document.createElement('canvas');gc.width=gc.height=128;const gx=gc.getContext('2d');const gr=gx.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,0.9)');gr.addColorStop(0.3,'rgba(255,255,255,0.25)');gr.addColorStop(1,'rgba(255,255,255,0)');gx.fillStyle=gr;gx.fillRect(0,0,128,128);
 const gt=new T.CanvasTexture(gc); const glows=[];
 (C.glows||[]).forEach(([x,y,z,s,col,op])=>{const sp=new T.Sprite(new T.SpriteMaterial({map:gt,color:col,transparent:true,opacity:op,depthWrite:false,blending:T.AdditiveBlending,fog:false}));sp.position.set(x,y,z);sp.scale.set(s,s*0.7,1);G.add(sp);glows.push([sp,op]);});
 (C.lights||[]).forEach(([col,int,dist,x,y,z])=>{const L=new T.PointLight(col,int,dist,2);L.position.set(x,y,z);G.add(L);});
 (C.props||[]).forEach(([glb,x,y,z,sc,ry])=>{ const e=document.createElement('a-entity'); e.setAttribute('gltf-model',glb); e.setAttribute('position',x+' '+y+' '+z); e.setAttribute('scale',sc+' '+sc+' '+sc); e.setAttribute('rotation','0 '+ry+' 0'); S.appendChild(e); });
 (C.boxes||[]).forEach(([w,h,d,col,x,y,z])=>box(w,h,d,std({color:col,roughness:0.85}),x,y,z));
 // grabbables (GLB)
 const items=[]; let held=null, grabs=0;
 (C.items||[]).forEach(([glb,x,y,z,sc,ry,line])=>{ const el=document.createElement('a-entity'); el.classList.add('clickable'); el.setAttribute('gltf-model',glb); el.setAttribute('scale',`${sc} ${sc} ${sc}`); el.setAttribute('position',`${x} ${y} ${z}`); el.setAttribute('rotation',`0 ${ry} 0`); S.appendChild(el);
  const it={el,y0:y,vy:0,line}; items.push(it); el.addEventListener('click',e=>{ grab(it,e.detail&&e.detail.cursorEl); }); });
 function grab(it,src){ if(held===it){ drop(); return; } if(held) drop(); const cam=document.getElementById('cam').object3D;
  const par=(src&&(src.id==='hl'||src.id==='hr'))?src.object3D:cam; par.attach(it.el.object3D);
  if(par===cam) it.el.object3D.position.set(0.12,-0.18,-0.45); else it.el.object3D.position.set(0,0,-0.1);
  held=it; grabs++; if(it.line&&!it.said){ it.said=1; say(it.line[0],it.line[1],it.line[2]); } }
 function drop(){ if(!held) return; G.attach(held.el.object3D); held.falling=true; held=null; }
 S.addEventListener('click',e=>{ if(held&&e.target===S) drop(); });
 ['hl','hr'].forEach(id=>document.getElementById(id).addEventListener('triggerdown',()=>{ const rc=document.getElementById(id).components.raycaster; if(held&&(!rc||!rc.intersectedEls.length)) drop(); }));
 const surf=C.surfaces||[];
 // ambient people (silhouettes) + overheard dialogue
 const people=[]; const ppl=C.people;
 if(ppl){ const sm=new T.MeshBasicMaterial({color:0x020403}); ppl.who.forEach((w,i)=>{ const g=new T.Group(); const body=new T.Mesh(new T.CapsuleGeometry(0.2,1.05,4,10),sm); body.position.y=0.78; g.add(body); const head=new T.Mesh(new T.SphereGeometry(0.12,12,10),sm); head.position.y=1.58; g.add(head); g.position.set(ppl.pos[0]+i*0.7,0,ppl.pos[2]); g.rotation.y=i?-1.2:1.2; G.add(g); people.push(g); }); }
 let listenT=0, convI=-1, convNext=0, convDone=false;
 // VR grain
 const nc=document.createElement('canvas');nc.width=nc.height=128;const nx=nc.getContext('2d');const nd=nx.createImageData(128,128);const nt=new T.CanvasTexture(nc);
 const nm=new T.Mesh(new T.PlaneGeometry(0.5,0.5),new T.MeshBasicMaterial({map:nt,transparent:true,opacity:0.06,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,fog:false}));nm.position.set(0,0,-0.12);nm.renderOrder=999;document.getElementById('cam').object3D.add(nm);
 setInterval(()=>{for(let i=0;i<nd.data.length;i+=4){const v=Math.random()*255;nd.data[i]=nd.data[i+1]=nd.data[i+2]=v;nd.data[i+3]=255;}nx.putImageData(nd,0,0);nt.needsUpdate=true;},70);
 const lastP=new T.Vector3(); let still=0;
 AFRAME.registerComponent('era-tick',{tick(t,dt){ const d=Math.min(dt,50)/1000;
  items.forEach(it=>{ if(!it.falling) return; const o=it.el.object3D; it.vy-=9.8*d; o.position.y+=it.vy*d; let fy=0; surf.forEach(([x,z,w,dd,h])=>{ if(Math.abs(o.position.x-x)<w/2&&Math.abs(o.position.z-z)<dd/2) fy=Math.max(fy,h); }); if(o.position.y<fy){ o.position.y=fy; it.vy=0; it.falling=false; } });
  glows.forEach(([sp,op],i)=>{ sp.material.opacity=op*(0.85+0.15*Math.sin(t*0.0011+i*1.7)); });
  if(ppl){ people.forEach((g,i)=>{ g.position.y=Math.abs(Math.sin(t*0.002+i))*0.01; g.children[1].rotation.y=Math.sin(t*0.0007+i)*0.3; });
   const cam=document.getElementById('cam').object3D, p=new T.Vector3(); cam.getWorldPosition(p);
   still = p.distanceTo(lastP)<0.004 ? still+d : 0; lastP.copy(p);
   const mid=people[0].position.clone().lerp(people[1].position,0.5); const dist=Math.hypot(p.x-mid.x,p.z-mid.z);
   if(!convDone && dist<ppl.radius && (still>ppl.stillSec || convI>=0)){ if(t>convNext && !subBusy){ convI++; if(convI>=ppl.lines.length){ convDone=true; if(ppl.after) setTimeout(()=>say('',ppl.after),800); } else { const [w,txt,f]=ppl.lines[convI]; say(w,txt,f,Math.max(2600,txt.length*70)); convNext=t+Math.max(2900,txt.length*70+400); } } }
   if(dist>ppl.radius+1.5 && convI>=0 && !convDone){ convI=-1; } } }}); S.setAttribute('era-tick','');
 if(C.enter) setTimeout(()=>say(C.enter[0],C.enter[1],C.enter[2]),2500);
});
AFRAME.registerComponent('room-move',{init(){ this.ax=[0,0]; this.snap=0; setTimeout(()=>{ document.getElementById('hl').addEventListener('thumbstickmoved',e=>{this.ax=[e.detail.x,e.detail.y];}); document.getElementById('hr').addEventListener('thumbstickmoved',e=>{ const x=e.detail.x; if(Math.abs(x)>0.7&&!this.snap){ this.snap=1; this.el.object3D.rotation.y-=Math.sign(x)*Math.PI/6; } if(Math.abs(x)<0.3) this.snap=0; }); },0); },
 tick(t,dt){ const o=this.el.object3D, d=Math.min(dt,50)/1000; const [x,y]=this.ax; if(Math.abs(x)>0.15||Math.abs(y)>0.15){ const cam=document.getElementById('cam').object3D; const q=new THREE.Quaternion(); cam.getWorldQuaternion(q); const f=new THREE.Vector3(x,0,y).applyQuaternion(q); f.y=0; o.position.addScaledVector(f,1.4*d); }
  const B=window.ERA.bounds, c=document.getElementById('cam').object3D.position; const wx=o.position.x+c.x, wz=o.position.z+c.z; o.position.x+=Math.max(B[0],Math.min(B[1],wx))-wx; o.position.z+=Math.max(B[2],Math.min(B[3],wz))-wz; }});
})();
