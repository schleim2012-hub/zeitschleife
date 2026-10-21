// Feiner Schwebestaub/Funken im RAUM (nicht am Kopf befestigt): wenige Partikel 1–4 m um den Spieler, driften langsam.
// Verlässt ein Teilchen den Bereich, taucht es woanders im Raum wieder auf (unsichtbar weit weg/ausgeblendet) – nichts klebt am Blick.
window.worldDust=function(sceneEl,o={}){ const T=THREE, S=sceneEl.object3D, N=o.count||70, rMin=o.rMin||1.0, rMax=o.rMax||4.0, yMin=o.yMin==null?0.3:o.yMin, yMax=o.yMax||3.2;
 const pos=new Float32Array(N*3), vel=new Float32Array(N*3), age=new Float32Array(N), col=new Float32Array(N*3); const c0=new T.Color(o.color||0xffd8a0), c1=new T.Color(o.color2||o.color||0xffb070);
 const head=new T.Vector3(); const getHead=()=>{ const r=sceneEl.renderer; const cam=sceneEl.camera; if(cam) cam.getWorldPosition(head); return head; };
 const spawn=(i,h)=>{ const a=Math.random()*Math.PI*2, d=rMin+Math.random()*(rMax-rMin); pos[i*3]=h.x+Math.cos(a)*d; pos[i*3+1]=yMin+Math.random()*(yMax-yMin); pos[i*3+2]=h.z+Math.sin(a)*d;
  vel[i*3]=(Math.random()-0.5)*0.05; vel[i*3+1]=(Math.random()-0.35)*0.03; vel[i*3+2]=(Math.random()-0.5)*0.05; age[i]=0; };
 const h0=new T.Vector3(0,1.6,0); for(let i=0;i<N;i++){ spawn(i,h0); age[i]=Math.random()*6; }
 const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(pos,3)); g.setAttribute('color',new T.BufferAttribute(col,3));
 const sp=document.createElement('canvas'); sp.width=sp.height=32; const x=sp.getContext('2d'); const rg=x.createRadialGradient(16,16,0,16,16,16); rg.addColorStop(0,'rgba(255,255,255,1)'); rg.addColorStop(0.35,'rgba(255,255,255,0.35)'); rg.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=rg; x.fillRect(0,0,32,32);
 const m=new T.PointsMaterial({size:o.size||0.018,map:new T.CanvasTexture(sp),transparent:true,opacity:o.opacity||0.5,depthWrite:false,blending:T.AdditiveBlending,vertexColors:true,sizeAttenuation:true,fog:true});
 const P=new T.Points(g,m); P.frustumCulled=false; S.add(P);
 let last=performance.now(); const step=function(){ const now=performance.now(), dt=Math.min(0.05,(now-last)/1000); last=now; const h=getHead(), t=now/1000;
  for(let i=0;i<N;i++){ age[i]+=dt; const k=i*3; vel[k]+=Math.sin(t*0.3+i)*0.002*dt; vel[k+2]+=Math.cos(t*0.27+i*1.3)*0.002*dt;
   pos[k]+=vel[k]*dt; pos[k+1]+=vel[k+1]*dt+Math.sin(t*0.8+i*2.1)*0.0015; pos[k+2]+=vel[k+2]*dt;
   const dx=pos[k]-h.x, dz=pos[k+2]-h.z, d=Math.hypot(dx,dz); if(d>rMax+0.6||d<0.6||pos[k+1]<0.05||pos[k+1]>yMax+0.5||age[i]>14) spawn(i,h);
   const fade=Math.min(1,age[i]/1.5,(14-age[i])/1.5)*Math.min(1,Math.max(0,(d-0.6)/0.5)); const tw=0.7+0.3*Math.sin(t*3+i*5.3); const cc=(i%5===0)?c1:c0; col[k]=cc.r*fade*tw; col[k+1]=cc.g*fade*tw; col[k+2]=cc.b*fade*tw; }
  g.attributes.position.needsUpdate=true; g.attributes.color.needsUpdate=true; };
 // In XR läuft window.requestAnimationFrame nicht zuverlässig → zusätzlich per A-Frame-Tick
 (window.__dustSteps=window.__dustSteps||[]).push(step); if(!sceneEl.hasAttribute('world-dust-tick')) sceneEl.setAttribute('world-dust-tick','');
 return P; };

if(window.AFRAME&&!AFRAME.components['world-dust-tick']) AFRAME.registerComponent('world-dust-tick',{tick(){ (window.__dustSteps||[]).forEach(f=>f()); }}); // läuft auch in XR (A-Frame-Loop)
