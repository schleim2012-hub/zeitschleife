/* ZSFX – wiederverwendbare, VR-komfortable Effekte (V2/V3).
   Regeln: kein Vollbild-Strobo, keine Kamera-/Horizontbewegung, Helligkeit ändert sich nur weich.
   API:
     ZSFX.vhs(ctx,W,H,p)            – dezenter VHS-Glitch auf einem 2D-Canvas, p=0..1 Fortschritt (Hüllkurve weich)
     ZSFX.hyper2D(ctx,W,H,t,state)  – Hyperspace-Streifen flach (Desktop/Handy), t in s
     ZSFX.hyperspace(sceneEl,{duration}) -> Promise – 360°-Hyperspace in A-Frame/three.js (VR) */
(function(){
const PAL=[[255,190,110],[255,150,70],[230,110,60],[255,220,170],[200,120,90]];
function env(p){ return Math.sin(Math.PI*Math.min(1,Math.max(0,p))); } // 0->1->0, weich
function vhs(ctx,W,H,p){ const a=env(p); if(a<=0.01) return; ctx.save();
 // 1) leichte Chroma-Verschiebung: zwei halbtransparente Farbsäume
 const off=Math.round(3+4*a); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.08*a;
 ctx.drawImage(ctx.canvas,off,0,W,H,0,0,W,H); ctx.globalAlpha=0.06*a; ctx.drawImage(ctx.canvas,0,0,W,H,off,0,W,H);
 ctx.globalCompositeOperation='source-over';
 // 2) 1-2 sanfte Tracking-Bänder, die langsam nach unten wandern
 for(let i=0;i<2;i++){ const y=((p*0.6+i*0.47)%1)*H, h=14+10*i; ctx.globalAlpha=0.10*a; ctx.fillStyle='#fff'; ctx.fillRect(0,y,W,1.5);
  ctx.globalAlpha=0.07*a; ctx.drawImage(ctx.canvas,0,y,W,h,8*a,y,W,h); }
 // 3) feines, schwaches Rauschen (statisch pro Aufruf, niedrige Deckkraft)
 ctx.globalAlpha=0.05*a; ctx.fillStyle='#ddd'; for(let i=0;i<220;i++){ ctx.fillRect(Math.random()*W,Math.random()*H,2,1); }
 // 4) Scanlines
 ctx.globalAlpha=0.05*a; ctx.fillStyle='#000'; for(let y=0;y<H;y+=4) ctx.fillRect(0,y,W,1);
 ctx.restore(); }
function mkStars(n){ const s=[]; for(let i=0;i<n;i++) s.push({a:Math.random()*Math.PI*2,r:0.15+Math.random()*1.0,z:Math.random(),c:PAL[i%PAL.length]}); return s; }
function hyper2D(ctx,W,H,t,st){ st.stars=st.stars||mkStars(420); const cx=W/2,cy=H/2, speed=0.6+Math.min(1,t/0.8)*2.2;
 const g=ctx.createRadialGradient(cx,cy,10,cx,cy,Math.max(W,H)*0.7); g.addColorStop(0,'#2a0f0a'); g.addColorStop(0.5,'#3a1420'); g.addColorStop(1,'#120808');
 ctx.fillStyle=g; ctx.fillRect(0,0,W,H); const dt=st.last!=null?Math.min(0.05,t-st.last):0.016; st.last=t;
 ctx.lineCap='round';
 for(const s of st.stars){ s.z-=dt*speed; if(s.z<=0.02){ s.z=1; s.a=Math.random()*Math.PI*2; }
  const k=1/s.z, k2=1/Math.min(1,s.z+0.06*speed), R=Math.max(W,H)*0.08*s.r;
  const x1=cx+Math.cos(s.a)*R*k, y1=cy+Math.sin(s.a)*R*k, x0=cx+Math.cos(s.a)*R*k2, y0=cy+Math.sin(s.a)*R*k2;
  ctx.strokeStyle=`rgba(${s.c[0]},${s.c[1]},${s.c[2]},${Math.min(0.9,0.25+(1-s.z))})`; ctx.lineWidth=1+2*(1-s.z); ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke(); }
 const c=ctx.createRadialGradient(cx,cy,0,cx,cy,140); c.addColorStop(0,'rgba(255,200,140,0.35)'); c.addColorStop(1,'rgba(255,200,140,0)'); ctx.fillStyle=c; ctx.fillRect(0,0,W,H); }
// ---------- 3D (three.js über A-Frame)
let G3=null;
function build3D(){ const T=window.THREE, grp=new T.Group();
 // Tunnel: Zylinder, innen sichtbar, warmer Verlauf mit weichen Streifen; Textur scrollt NUR entlang der Achse
 const cv=document.createElement('canvas'); cv.width=256; cv.height=512; const c=cv.getContext('2d');
 const gr=c.createLinearGradient(0,0,0,512); gr.addColorStop(0,'#1a0a0c'); gr.addColorStop(0.5,'#3d1a12'); gr.addColorStop(1,'#1a0a0c'); c.fillStyle=gr; c.fillRect(0,0,256,512);
 for(let i=0;i<40;i++){ c.fillStyle=`rgba(${[180,120,60].join(',')},${0.05+Math.random()*0.10})`; c.fillRect(Math.random()*256,Math.random()*512,2+Math.random()*10,30+Math.random()*120); }
 const tex=new T.CanvasTexture(cv); tex.wrapS=tex.wrapT=T.RepeatWrapping; tex.repeat.set(6,4); if(T.SRGBColorSpace) tex.colorSpace=T.SRGBColorSpace;
 const tun=new T.Mesh(new T.CylinderGeometry(6,6,160,48,1,true),new T.MeshBasicMaterial({map:tex,side:T.BackSide,transparent:true,opacity:1,depthWrite:false,fog:false}));
 tun.rotation.x=Math.PI/2; grp.add(tun);
 // Sternstreifen
 const N=1400, pos=new Float32Array(N*6), col=new Float32Array(N*6), st=[];
 for(let i=0;i<N;i++){ const a=Math.random()*Math.PI*2, r=0.8+Math.random()*5, z=-Math.random()*150, p=PAL[i%PAL.length]; st.push({x:Math.cos(a)*r,y:Math.sin(a)*r,z});
  for(let j=0;j<2;j++){ col[i*6+j*3]=p[0]/255*(j?1:0.25); col[i*6+j*3+1]=p[1]/255*(j?1:0.25); col[i*6+j*3+2]=p[2]/255*(j?1:0.25); } }
 const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.BufferAttribute(pos,3)); geo.setAttribute('color',new T.BufferAttribute(col,3));
 const lines=new T.LineSegments(geo,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.95,depthWrite:false,fog:false})); lines.frustumCulled=false; grp.add(lines);
 // Abdeckung (weiches Ein-/Ausblenden über Opazität, kein Blitz)
 return G3={grp,tex,tun,lines,geo,st,pos}; }
function hyperspace(sceneEl,o={}){ const dur=o.duration||2.6; if(!G3) build3D(); const {grp,tex,tun,lines,geo,st,pos}=G3;
 const cam=sceneEl.camera; const camEl=sceneEl.camera&&sceneEl.camera.el; const T=window.THREE;
 // Gruppe am Kopf-Ursprung, aber Welt-ausgerichtet (keine Rotation mit dem Kopf -> kein Horizont-Kippen)
 const wp=new T.Vector3(); (cam||{getWorldPosition:v=>v.set(0,1.6,0)}).getWorldPosition(wp); grp.position.copy(wp); grp.position.y=wp.y;
 sceneEl.object3D.add(grp); grp.visible=true; const t0=performance.now();
 return new Promise(res=>{ let last=t0; function step(){ const now=performance.now(), t=(now-t0)/1000, dt=Math.min(0.05,(now-last)/1000); last=now;
   const p=t/dur, fade=Math.min(1,t/0.35,(dur-t)/0.45); const speed=40+160*Math.min(1,t/0.7); // "wahnsinnige Geschwindigkeit"
   tun.material.opacity=Math.max(0,fade); lines.material.opacity=0.95*Math.max(0,fade); tex.offset.y-=dt*speed*0.012;
   const len=Math.min(14,0.6+speed*0.06);
   for(let i=0;i<st.length;i++){ const s=st[i]; s.z+=speed*dt; if(s.z>2){ s.z=-150+Math.random()*20; }
    pos[i*6]=s.x; pos[i*6+1]=s.y; pos[i*6+2]=s.z-len; pos[i*6+3]=s.x; pos[i*6+4]=s.y; pos[i*6+5]=s.z; }
   geo.attributes.position.needsUpdate=true;
   if(t>=dur) { grp.visible=false; sceneEl.object3D.remove(grp); G3.tick=null; res(); } }
  G3.tick=step; }); }
// tick wird vom A-Frame-Loop (oder einem eigenen rAF) aufgerufen – funktioniert auch in XR
function tick(){ if(G3&&G3.tick) G3.tick(); }
if(window.AFRAME&&!AFRAME.components['zsfx-tick']) AFRAME.registerComponent('zsfx-tick',{tick});
window.ZSFX={vhs,hyper2D,hyperspace,tick,env};
})();
