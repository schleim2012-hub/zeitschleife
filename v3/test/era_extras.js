// Rewind V3 – Parodie-Plakate, greifbare Hüllen/Bücher (umdrehen beim Aufheben), Deko-Fundstücke mit Mara-Sprüchen.
// Konfig: window.ERAX={stands:[[x,z,ryDeg,w,h,col,[[img,h,y,dx,line],...]]], covers:[[img,kind,x,y,z,ryDeg,line]], decoys:[[glb,x,y,z,sc,ryDeg,line]]}
// line = [wer, text, mp3?]  (Untertitel; Stimme nur wenn mp3 angegeben)
(function(){
const X=window.ERAX||{}, T=THREE, S=document.querySelector('a-scene'), PW='../assets/posters_web/';
let VO={}; fetch('../assets/vo/erax.json').then(r=>r.json()).then(j=>VO=j).catch(()=>{});
function say(l){ if(!l) return; if(!l[2]&&VO[l[1]]) l=[l[0],l[1],'../assets/vo/'+VO[l[1]]]; if(window.eraSay) return window.eraSay(l[0],l[1],l[2],Math.max(3000,l[1].length*65));
 const sb=document.getElementById('sub'); sb.textContent=(l[0]?l[0]+': ':'')+l[1]; sb.style.display='block'; clearTimeout(say.t);
 const end=()=>{ say.t=setTimeout(()=>sb.style.display='none',600); };
 if(l[2]){ const a=new Audio(l[2]); a.volume=0.9; a.onended=a.onerror=end; a.play().catch(()=>setTimeout(end,3500)); } else say.t=setTimeout(()=>sb.style.display='none',Math.max(3200,l[1].length*65)); }
function go(){
 const G=S.object3D, TL=new T.TextureLoader(), cam=()=>document.getElementById('cam').object3D;
 const tex=(u,m)=>TL.load(u,t=>{t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;m.map=t;m.needsUpdate=true;});
 const R=d=>d*Math.PI/180;
 // aged overlay (dust/scratches) for posters
 const dc=document.createElement('canvas'); dc.width=dc.height=256; const dx=dc.getContext('2d'); dx.fillStyle='#fff'; dx.fillRect(0,0,256,256);
 for(let i=0;i<2600;i++){ const v=170+Math.random()*85|0; dx.fillStyle=`rgb(${v},${v},${v})`; dx.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*2,1+Math.random()*2); }
 const vg=dx.createRadialGradient(128,128,40,128,128,190); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.55)'); dx.fillStyle=vg; dx.fillRect(0,0,256,256);
 const aged=new T.CanvasTexture(dc);
 const clickables=[];
 (X.stands||[]).forEach(([x,z,ry,w,h,col,posters,lc,li])=>{ const g=new T.Group(); g.position.set(x,0,z); g.rotation.y=R(ry); G.add(g);
  if(lc){ const L=new T.PointLight(lc,li||0.9,2.4,2); L.position.set(0,h-0.15,0.55); g.add(L); const lamp=new T.Mesh(new T.BoxGeometry(w*0.5,0.018,0.03),new T.MeshBasicMaterial({color:new T.Color(lc).multiplyScalar(0.3),fog:false})); lamp.position.set(0,h-0.02,0.12); g.add(lamp); const arm=new T.Mesh(new T.BoxGeometry(0.02,0.02,0.12),new T.MeshStandardMaterial({color:0x111111})); arm.position.set(0,h-0.02,0.06); g.add(arm); }
  const sm=window.eraPBR?window.eraPBR(X.standMat||'metal',1,col?new T.Color(col).lerp(new T.Color(0x8a8378),0.45):0x555048):new T.MeshStandardMaterial({color:col||0x141414,roughness:0.8,metalness:0.3}); const b=new T.Mesh(new T.BoxGeometry(w,h,0.1),sm); b.position.y=h/2; g.add(b);
  (posters||[]).forEach(([img,ph,py,pdx,line])=>{ const pw=ph*2/3;
   const fr=new T.Mesh(new T.BoxGeometry(pw+0.05,ph+0.05,0.02),new T.MeshStandardMaterial({color:0x0c0c0c,roughness:0.5,metalness:0.6})); fr.position.set(pdx,py,0.06); g.add(fr);
   const m=new T.MeshStandardMaterial({color:0xb8aca8,roughness:0.55,metalness:0,aoMap:aged,aoMapIntensity:1}); m.lightMap=null; tex(PW+img+'.jpg',m);
   const pg=new T.PlaneGeometry(pw,ph); pg.setAttribute('uv2',pg.attributes.uv); const p=new T.Mesh(pg,m); p.position.set(pdx,py,0.072); g.add(p);
   const gl=new T.Mesh(new T.PlaneGeometry(pw,ph),new T.MeshStandardMaterial({color:0x000000,roughness:0.05,metalness:1,transparent:true,opacity:0.18})); gl.position.set(pdx,py,0.075); g.add(gl);
   if(line){ const el=document.createElement('a-entity'); el.classList.add('clickable'); S.appendChild(el); el.addEventListener('loaded',()=>{ el.setObject3D('mesh',new T.Mesh(new T.PlaneGeometry(pw,ph),new T.MeshBasicMaterial({visible:false}))); g.updateMatrixWorld(); p.getWorldPosition(el.object3D.position); el.object3D.rotation.y=R(ry); });
    let n=0; el.addEventListener('click',()=>{ say(Array.isArray(line[0])?line[Math.min(n++,line.length-1)]:line); }); } }); });
 // kiosk: solid counter with wood top, metal body, trim, back panel, warm hood lamp
 const KQ=X.kiosk||(window.ERA&&window.ERA.kiosk); if(KQ){ const [kx,kz,w,h,d,ry]=KQ, g=new T.Group(); g.position.set(kx,0,kz); g.rotation.y=R(ry); G.add(g);
  const met=window.eraPBR('metal',1,0x9aa098), wd=window.eraPBR('wood',1,0xb09a80), dark=new T.MeshStandardMaterial({color:0x1a1c1a,roughness:0.6,metalness:0.7});
  const bx=(W,H,D,m,x,y,z)=>{const o=new T.Mesh(new T.BoxGeometry(W,H,D),m);o.position.set(x,y,z);g.add(o);return o;};
  bx(w,h-0.04,d,met,0,(h-0.04)/2+0.04,0); bx(w+0.02,0.04,d+0.02,dark,0,0.02,0); bx(w+0.06,0.035,d+0.08,wd,0,h-0.0175,0);
  bx(w+0.03,0.02,0.02,dark,0,h-0.05,d/2+0.01); bx(0.02,h-0.06,0.02,dark,-w/2-0.005,h/2,d/2+0.005); bx(0.02,h-0.06,0.02,dark,w/2+0.005,h/2,d/2+0.005);
  bx(w,1.1,0.04,met,0,h+0.6,-d/2+0.02); bx(w+0.1,0.04,0.35,dark,0,h+1.17,-d/2+0.17);
  const lamp=new T.Mesh(new T.BoxGeometry(w*0.6,0.015,0.04),new T.MeshBasicMaterial({color:0xc89a60,fog:false})); lamp.position.set(0,h+1.14,-d/2+0.25); g.add(lamp);
  const sp=new T.SpotLight(0xffc285,1.6,2.2,0.9,0.6,2); sp.position.set(0,h+1.12,-d/2+0.25); sp.target.position.set(0,0,d*0.6); g.add(sp); g.add(sp.target);
  const fill=new T.PointLight(0x9affd0,0.35,2.0,2); fill.position.set(0,h*0.5,d/2+0.6); g.add(fill); }
 // covers: VHS / book / mag / paper, lying flat; pick up -> flips to show cover
 const K={vhs:[0.105,0.19,0.026,0x0a0a0a],book:[0.15,0.22,0.035,0x3a1d12],mag:[0.21,0.28,0.006,0xd8d0c0],paper:[0.28,0.4,0.004,0xcfc6b0],box:[0.13,0.13,0.045,0x202020]};
 const held={it:null}; const all=[];
 function mk(el,mesh,x,y,z,ry,flat,line){ const it={el,home:[x,y,z,ry,flat],line,said:0,flip:0}; all.push(it);
  el.addEventListener('loaded',()=>{ el.setObject3D('mesh',mesh); place(it); }); el.addEventListener('click',e=>{ e.stopPropagation&&e.stopPropagation(); pick(it,e.detail&&e.detail.cursorEl); }); return it; }
 function place(it){ const [x,y,z,ry,flat]=it.home, o=it.el.object3D; G.attach(o); o.position.set(x,y,z); o.rotation.set(flat?-Math.PI/2:0,0,0); o.rotateOnWorldAxis(new T.Vector3(0,1,0),R(ry)); }
 function pick(it,src){ if(held.it===it){ place(it); held.it=null; return; } if(held.it) place(held.it);
  const par=(src&&(src.id==='hl'||src.id==='hr'))?src.object3D:cam(); par.attach(it.el.object3D); const o=it.el.object3D;
  if(par===cam()) o.position.set(0.02,-0.06,-0.38); else o.position.set(0,0.02,-0.12); o.rotation.set(par===cam()?0:-0.6,Math.PI,0); it.flip=performance.now(); held.it=it;
  if(it.line){ const L=Array.isArray(it.line[0])?it.line[Math.min(it.said,it.line.length-1)]:(it.said?null:it.line); it.said++; if(L) setTimeout(()=>say(L),450); } }
 (X.covers||[]).forEach(([img,kind,x,y,z,ry,line])=>{ const [w,h,d,col]=K[kind]; const fm=new T.MeshStandardMaterial({color:0xd0c8c4,roughness:kind==='vhs'?0.35:0.7}); tex(PW+img+'.jpg',fm);
  const sm=new T.MeshStandardMaterial({color:col,roughness:0.7}); const pageM=new T.MeshStandardMaterial({color:0xcbbf9e,roughness:0.9});
  const side=kind==='book'?pageM:sm; const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),[side,sm,side,side,fm,sm]);
  const el=document.createElement('a-entity'); el.classList.add('clickable'); S.appendChild(el); mk(el,mesh,x,y+d/2,z,ry,true,line); });
 (X.decoys||[]).forEach(([glb,x,y,z,sc,ry,line])=>{ const el=document.createElement('a-entity'); el.classList.add('clickable'); el.setAttribute('gltf-model',glb); el.setAttribute('scale',`${sc} ${sc} ${sc}`); S.appendChild(el);
  const it={el,home:[x,y,z,ry,false],line,said:0,flip:0}; all.push(it); el.addEventListener('model-loaded',()=>place(it)); place(it); el.addEventListener('click',e=>{ e.stopPropagation&&e.stopPropagation(); pick(it,e.detail&&e.detail.cursorEl); }); });
 AFRAME.registerComponent('erax-tick',{tick(t){ const it=held.it; if(!it||!it.flip) return; const k=Math.min(1,(performance.now()-it.flip)/650); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; it.el.object3D.rotation.y=Math.PI*(1-e); if(k>=1) it.flip=0; }}); S.setAttribute('erax-tick','');
 window.eraX={all,held,place};
}
if(S.hasLoaded) go(); else S.addEventListener('loaded',go);
})();
