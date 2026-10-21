/* Warteraum (Jenseits-Bürgeramt) – eigene Testszene, nur Laufen + Umschauen.
   Geometrie/Material/Lightmap aus Blender (tools/gfx_warteraum/build_room.py): assets/warteraum/warteraum.glb (UV0 Texturen, UV1 Lightmap) + lm.jpg + scene.json.
   Echtzeit-Lichter (4): Hemi teal, warme Stehlampe, grünes Schalterlicht (flackert leicht), rotes Pendel. Alles andere ist gebacken.
   Figuren-Hybrid: statische Körper (gebacken), bewegliche Teile (Kopf/Unterarm/Fuß/Buchseite) per Code um ihr Gelenk gedreht.
   Ton (WebAudio, positionsabhängig, startet nach der ersten Geste/VR-Start): Radio mit Fahrstuhlmusik (Kleinlautsprecher-Filter + Knistern),
   Leuchtstoff-Brummen, Uhr, Fallblatt-Klack + Ding, Husten/Blättern/Knarzen, dumpfe Stimmen/Schreibmaschine/Stempel aus dem Hinterbüro.
   Debug: ?nolm=1 (ohne Lightmap) · ?lmg=1.2 (Lightmap-Gain) · ?mute=1 */
(function(){
const Q=location.search, num=(k,d)=>{ const m=Q.match(new RegExp('[?&]'+k+'=([\\d.]+)')); return m?+m[1]:d; };
const BASE='../assets/warteraum/';
AFRAME.registerComponent('warteraum',{
 init(){ const T=THREE, sc=this.el, self=this; this.t0=performance.now(); window.__wr={ready:false};
  fetch(BASE+'scene.json?v=1').then(r=>r.json()).then(S=>{ self.S=S; self.load(S); });
  this.loco(); this.audioArm(); },
 load(S){ const T=THREE, sc=this.el, self=this, R=sc.renderer;
  const lm=new T.TextureLoader().load(BASE+'lm.jpg?v=1'); lm.flipY=false; lm.channel=1; lm.colorSpace=T.SRGBColorSpace;
  const LMI=Math.PI*(S.lmScale||1)*num('lmg',1.0);
  const el=document.createElement('a-entity'); el.setAttribute('gltf-model',BASE+'warteraum.glb?v=1'); sc.appendChild(el);
  el.addEventListener('model-loaded',()=>{ const root=el.getObject3D('mesh'); self.root=root; const mats=new Set(), M={}; self.nodes={};
   root.traverse(o=>{ if(o.name) self.nodes[o.name]=o; if(o.isMesh){ mats.add(o.material); o.frustumCulled=true; } });
   mats.forEach(m=>{ M[m.name]=m; m.envMapIntensity=0; if(m.map) m.map.anisotropy=8;
    if(!/[?&]nolm=1/.test(Q)&&!/wr_glass|wr_emit|wr_flip/.test(m.name)){ m.lightMap=lm; m.lightMapIntensity=LMI; }
    if(m.metalness>0.2) m.metalness=0.35; m.needsUpdate=true; });
   // Sonder-Materialien
   const swap=(name,mk)=>{ const old=M[name]; if(!old) return; const nm=mk(old); root.traverse(o=>{ if(o.isMesh&&o.material===old) o.material=nm; }); M[name]=nm; };
   swap('wr_emit',o=>new T.MeshBasicMaterial({color:new T.Color(0x6cd858).multiplyScalar(0.9),vertexColors:false,fog:false}));
   swap('wr_glass',o=>new T.MeshStandardMaterial({color:0x9ab0a8,roughness:0.1,metalness:0,transparent:true,opacity:0.13,depthWrite:false}));
   if(M.wr_shade){ M.wr_shade.emissive=new T.Color(0xc07a38); M.wr_shade.emissiveMap=M.wr_shade.map; M.wr_shade.emissiveIntensity=0.55; M.wr_shade.side=T.DoubleSide; }
   if(M.wr_noexit){ M.wr_noexit.emissive=new T.Color(0xb8d8a8); M.wr_noexit.emissiveMap=M.wr_noexit.map; M.wr_noexit.emissiveIntensity=0.5; }
   if(M.wr_redglass){ M.wr_redglass.emissive=new T.Color(0x6a0e06); M.wr_redglass.emissiveIntensity=0.28; M.wr_redglass.side=T.DoubleSide; }
   // Fallblatt-Anzeige: Canvas (Text per Code)
   const cv=document.createElement('canvas'); cv.width=512; cv.height=148; const cx=cv.getContext('2d'); const ft=new T.CanvasTexture(cv); ft.colorSpace=T.SRGBColorSpace; ft.anisotropy=8; self.flip={cv,cx,tex:ft,n:4,anim:0};
   swap('wr_flip',o=>new T.MeshBasicMaterial({map:ft,color:0x9a9a90}));
   self.drawFlip(4,4,1);
   // Lichter (max 4)
   const hemi=new T.HemisphereLight(0x2c4c48,0x0a100e,0.35); sc.object3D.add(hemi);
   const L0=S.lamps[0]; const warm=new T.PointLight(0xffa860,1.6,4.5,2); warm.position.set(L0[0],L0[1]-0.05,L0[2]); sc.object3D.add(warm);
   const gw=S.window; const green=new T.PointLight(0x78ff60,0.8,4.5,2); green.position.set(gw[0],gw[1],gw[2]); sc.object3D.add(green);
   const rp=S.red[0]; const red=new T.PointLight(0xff3010,0.5,3,2); red.position.set(rp[0],rp[1]-0.1,rp[2]); sc.object3D.add(red);
   self.L={hemi,warm,green,red};
   // Rauchfaden (1 Draw: Points)
   const sm=S.anchors.smoke, N=14, g=new T.BufferGeometry(), P=new Float32Array(N*3), A=new Float32Array(N);
   g.setAttribute('position',new T.BufferAttribute(P,3)); g.setAttribute('alpha',new T.BufferAttribute(A,1));
   const c2=document.createElement('canvas'); c2.width=c2.height=64; const x2=c2.getContext('2d'), gr=x2.createRadialGradient(32,32,2,32,32,30); gr.addColorStop(0,'rgba(200,200,190,0.55)'); gr.addColorStop(1,'rgba(200,200,190,0)'); x2.fillStyle=gr; x2.fillRect(0,0,64,64);
   const pm=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:new T.CanvasTexture(c2)},sz:{value:900}},
    vertexShader:'attribute float alpha; varying float va; uniform float sz; void main(){ va=alpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=sz*(0.03+0.05*(1.0-alpha))/-mv.z; gl_Position=projectionMatrix*mv; }',
    fragmentShader:'uniform sampler2D map; varying float va; void main(){ vec4 c=texture2D(map,gl_PointCoord); gl_FragColor=vec4(c.rgb*0.55,c.a*va*0.35); }'});
   const pts=new T.Points(g,pm); pts.frustumCulled=false; sc.object3D.add(pts); self.smoke={g,P,A,N,base:new T.Vector3(...sm),age:new Float32Array(N).map((_,i)=>i/N*4)};
   // bewegliche Teile
   self.mov=Object.entries(S.movers).map(([n,d],i)=>{ const o=self.nodes[n]; if(!o) return null; return {n,o,ax:new T.Vector3(...d.axis).normalize(),kind:d.kind,ph:Math.random()*100,sp:0.8+Math.random()*0.4,q0:o.quaternion.clone()}; }).filter(Boolean);
   window.__wr={ready:true,nodes:Object.keys(self.nodes).length,mov:self.mov.length,S};
  });
 },
 drawFlip(a,b,k){ const {cx}=this.flip, W=512, H=148; cx.fillStyle='#16181a'; cx.fillRect(0,0,W,H); cx.fillStyle='#8a8e86'; cx.font='600 26px "Barlow Condensed",Arial Narrow,sans-serif'; cx.textAlign='center'; cx.fillText('JETZT BEDIENT',W/2,30);
  const sa=String(a).padStart(4,'0'), sb=String(b).padStart(4,'0');
  for(let i=0;i<4;i++){ const x=86+i*88, y=42, w=76, h=96; cx.fillStyle='#0b0c0c'; cx.fillRect(x-2,y-2,w+4,h+4);
   const d=k>=1?sb[i]:sa[i], up=sa[i]!==sb[i]&&k<1;
   cx.fillStyle='#24262a'; cx.fillRect(x,y,w,h); cx.fillStyle='#e8e2c8'; cx.font='700 88px "Barlow Condensed",Arial Narrow,sans-serif'; cx.fillText(d,x+w/2,y+h-12);
   if(up){ cx.fillStyle='rgba(10,10,10,'+(0.35+0.5*(1-Math.abs(k*2-1)))+')'; cx.fillRect(x,y,w,h*0.5); }
   cx.fillStyle='#050505'; cx.fillRect(x,y+h/2-1.5,w,3); }
  this.flip.tex.needsUpdate=true; },
 tick(t,dt){ if(!this.mov) return; const T=THREE, s=t/1000, d=Math.min(dt||16,50)/1000;
  // Figuren-Idle (langsam, zufällige Phase)
  const qa=new T.Quaternion();
  this.mov.forEach(m=>{ const u=s*m.sp+m.ph; let a=0;
   switch(m.kind){
    case 'head': a=0.22*Math.sin(u*0.21)+0.1*Math.sin(u*0.53+1.3); if(m.n==='brand_head') a+=0.05*(Math.sin(u*7.1)>0.97?1:0); if(m.n==='jaeger_head') a=0.35*Math.sin(u*0.35); break;
    case 'arm': { const c=(u%11)/11; const lift=c<0.12?c/0.12:c<0.45?1:c<0.6?1-(c-0.45)/0.15:0; a=(m.n==='brand_arm'?-0.55:m.n==='frl_arm'?0:-0.18)*(lift*lift*(3-2*lift));
       if(m.n==='frl_arm'){ const p=(u%4.3)/4.3; a=p<0.06?-0.45*p/0.06:p<0.12?-0.45*(1-(p-0.06)/0.06):0; if(p>=0.06&&m.last<0.06) this.sfx('stamp'); m.last=p; }
       if(m.n==='gruen_arm') a=-0.12*Math.max(0,Math.sin(u*0.4))*Math.sin(u*3); break; }
    case 'foot': { const burst=Math.sin(u*0.13)>0.2; a=burst?0.22*Math.max(0,Math.sin(u*2*Math.PI*1.9)):0; if(m.n==='taucher_foot') a=0.12*Math.sin(u*1.1)*Math.max(0,Math.sin(u*0.3)); break; }
    case 'page': { const p=(u%13)/13; a=p<0.1?Math.PI*0.97*(p/0.1)*(p/0.1)*(3-2*p/0.1):0; if(p<0.1&&!m.on){ m.on=1; this.sfx('page'); } if(p>=0.1) m.on=0; break; }
    case 'clock': { const now=new Date(), sec=now.getSeconds()+now.getMilliseconds()/1000, mi=now.getMinutes()+sec/60, hr=(now.getHours()%12)+mi/60;
       a=m.n==='clk_s'?Math.floor(sec)/60*2*Math.PI:m.n==='clk_m'?mi/60*2*Math.PI:hr/12*2*Math.PI; break; } // Achse = Wandnormale → läuft linksherum (Jenseits)
   }
   qa.setFromAxisAngle(m.ax,a); m.o.quaternion.copy(m.q0).multiply(qa); });
  // Rauch
  const S=this.smoke; if(S){ for(let i=0;i<S.N;i++){ S.age[i]+=d; if(S.age[i]>4) S.age[i]-=4; const k=S.age[i]/4; S.P[i*3]=S.base.x+0.04*Math.sin(k*9+i)+k*0.05; S.P[i*3+1]=S.base.y+k*0.55; S.P[i*3+2]=S.base.z+0.04*Math.cos(k*7+i); S.A[i]=Math.sin(k*Math.PI)*(1-k*0.5); } S.g.attributes.position.needsUpdate=true; S.g.attributes.alpha.needsUpdate=true; }
  // Leuchtstoff-Flackern (grünes Licht), ganz leicht
  if(this.L){ const f=Math.random()<0.004?0.45:1; this.L.green.intensity+=((0.8*f)-this.L.green.intensity)*0.3; }
  // Fallblatt: alle 35–70 s eine Nummer weiter
  const F=this.flip; if(F){ if(!F.next) F.next=s+20+Math.random()*20; if(s>F.next&&!F.anim){ F.anim=s; this.sfx('flip'); }
   if(F.anim){ const k=(s-F.anim)/0.35; if(k>=1){ F.n++; this.drawFlip(F.n,F.n,1); F.anim=0; F.next=s+35+Math.random()*35; } else this.drawFlip(F.n,F.n+1,k); } }
  this.clamp(); this.locoTick(d); this.audioTick(s); },
 // ---------------- Bewegung (L-Stick gehen, R-Stick drehen; Desktop WASD) ----------------
 loco(){ this.ax=[0,0]; this.snap=0; setTimeout(()=>{ const L=document.getElementById('hl'), Rr=document.getElementById('hr');
  L&&L.addEventListener('thumbstickmoved',e=>{ this.ax=[e.detail.x,e.detail.y]; });
  Rr&&Rr.addEventListener('thumbstickmoved',e=>{ const x=e.detail.x; if(Math.abs(x)>0.7&&!this.snap){ this.snap=1; const rig=document.getElementById('rig').object3D, h0=this.head().clone(); rig.rotation.y-=Math.sign(x)*Math.PI/6; rig.updateMatrixWorld(true); const h1=this.head(); rig.position.x+=h0.x-h1.x; rig.position.z+=h0.z-h1.z; } if(Math.abs(x)<0.3) this.snap=0; }); },0); },
 head(){ const r=this.el.renderer, c=r.xr.isPresenting?r.xr.getCamera():this.el.camera; const v=new THREE.Vector3(); c.getWorldPosition(v); return v; },
 locoTick(d){ const [x,y]=this.ax; if(Math.abs(x)<0.15&&Math.abs(y)<0.15) return; const r=this.el.renderer, c=r.xr.isPresenting?r.xr.getCamera():this.el.camera, q=new THREE.Quaternion(); c.getWorldQuaternion(q);
  const f=new THREE.Vector3(0,0,-1).applyQuaternion(q); f.y=0; f.normalize(); const rt=new THREE.Vector3(-f.z,0,f.x); const rig=document.getElementById('rig').object3D; const sp=1.4*d;
  rig.position.addScaledVector(f,-y*sp).addScaledVector(rt,x*sp); },
 clamp(){ const h=this.head(), rig=document.getElementById('rig').object3D, cam=document.getElementById('cam').object3D; const R0=0.22; let p={x:h.x,z:h.z};
  const B=[[-2.65,2.55,-2.2,2.2]]; // Raum (innen)
  p.x=Math.min(B[0][1],Math.max(B[0][0],p.x)); p.z=Math.min(B[0][3],Math.max(B[0][2],p.z));
  const box=[[-3,-2.05,-2.1,2.1],[-2.05,-1.15,-0.75,0.65],[1.9,3,-0.75,1.35],[-1.55,-0.55,1.55,2.5],[2.1,3,1.85,2.5],[1.25,1.85,1.9,2.5],[0,2.4,-2.6,-1.95],[-0.7,-0.2,-2.45,-1.95],[2.2,2.8,-1.95,-1.25],[2.1,2.7,-2.6,-1.9]];
  box.forEach(([a0,a1,b0,b1])=>{ if(p.x>a0-R0&&p.x<a1+R0&&p.z>b0-R0&&p.z<b1+R0){ const c=[[p.x-(a0-R0),'x',a0-R0],[(a1+R0)-p.x,'x',a1+R0],[p.z-(b0-R0),'z',b0-R0],[(b1+R0)-p.z,'z',b1+R0]].sort((u,v)=>u[0]-v[0])[0]; p[c[1]]=c[2]; } });
  const dx=p.x-h.x, dz=p.z-h.z; if(Math.abs(dx)>1e-4||Math.abs(dz)>1e-4){ if(this.el.renderer.xr.isPresenting){ rig.position.x+=dx; rig.position.z+=dz; } else { cam.position.x+=dx; cam.position.z+=dz; } } },
 // ---------------- Ton ----------------
 audioArm(){ if(/[?&]mute=1/.test(Q)) return; const go=()=>{ if(this.ac) { if(this.ac.state!=='running') this.ac.resume(); return; } this.audioStart(); };
  ['click','keydown','touchstart','pointerdown'].forEach(e=>window.addEventListener(e,go,{passive:true})); this.el.addEventListener('enter-vr',go);
  setTimeout(()=>{ ['hl','hr'].forEach(id=>{ const c=document.getElementById(id); c&&c.addEventListener('triggerdown',go); }); },0); },
 audioStart(){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; const ac=this.ac=new AC(), S=this.S, A=S.anchors; const self=this;
  const master=ac.createGain(); master.gain.value=0.85; master.connect(ac.destination);
  // kleiner Raumhall
  const conv=ac.createConvolver(), len=Math.floor(ac.sampleRate*1.3), ir=ac.createBuffer(2,len,ac.sampleRate); for(let ch=0;ch<2;ch++){ const b=ir.getChannelData(ch); for(let i=0;i<len;i++) b[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)*0.5; }
  conv.buffer=ir; const wet=ac.createGain(); wet.gain.value=0.22; conv.connect(wet); wet.connect(master); this.rev=conv;
  const pan=(p,ref=1,roll=1.3)=>{ const n=ac.createPanner(); n.panningModel='HRTF'; n.distanceModel='inverse'; n.refDistance=ref; n.rolloffFactor=roll; n.positionX.value=p[0]; n.positionY.value=p[1]; n.positionZ.value=p[2]; n.connect(master); n.connect(conv); return n; };
  this.pan=pan; this.buf={};
  const load=n=>this.buf[n]||(this.buf[n]=fetch(BASE+'audio/'+n+'.ogg?v=1').then(r=>r.arrayBuffer()).then(b=>new Promise((res,rej)=>ac.decodeAudioData(b,res,rej))));
  this.load=load;
  const loop=(n,p,vol,chain)=>load(n).then(b=>{ const s=ac.createBufferSource(); s.buffer=b; s.loop=true; const g=ac.createGain(); g.gain.value=vol; s.connect(g); let o=g; (chain||[]).forEach(c=>{ o.connect(c[0]); o=c[1]; }); o.connect(pan(p)); s.start(ac.currentTime+Math.random()*0.1,Math.random()*b.duration); return s; }).catch(e=>console.warn('wr audio',n,e));
  // Radio: Kleinlautsprecher (Band 300–3200 Hz, Mitten-Buckel, leichte Sättigung) + Knistern
  const hp=ac.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=320; hp.Q.value=0.9; const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3000; lp.Q.value=1.1;
  const pk=ac.createBiquadFilter(); pk.type='peaking'; pk.frequency.value=1300; pk.gain.value=5; pk.Q.value=0.8; const ws=ac.createWaveShaper(); const cu=new Float32Array(1024); for(let i=0;i<1024;i++){ const x=i/511.5-1; cu[i]=Math.tanh(x*1.8)/Math.tanh(1.8); } ws.curve=cu;
  hp.connect(lp); lp.connect(pk); pk.connect(ws);
  loop('elevator',A.radio,0.55,[[hp,ws]]); loop('crackle',A.radio,0.22);
  loop('hum',A.office,0.10); loop('hum',A.tube,0.05); loop('tick',A.clock,0.35); loop('voices',A.office,0.30); loop('typewriter',A.office,0.16);
  // zufällige Geräusche der Wartenden
  const who=['oma','gruen','brand','jaeger','taucher','assi'];
  const rnd=()=>{ const n=['cough1','cough2','cough3','page','creak','creak2'][Math.floor(Math.random()*6)]; const p=A[who[Math.floor(Math.random()*who.length)]]; this.play(n,p,n.startsWith('cough')?0.45:0.5); setTimeout(rnd,4000+Math.random()*9000); };
  setTimeout(rnd,3000);
  this.listen=true; window.__wr.audio=true; },
 play(n,p,vol){ if(!this.ac) return; this.load(n).then(b=>{ const s=this.ac.createBufferSource(); s.buffer=b; s.playbackRate.value=0.92+Math.random()*0.16; const g=this.ac.createGain(); g.gain.value=vol; s.connect(g); g.connect(this.pan(p)); s.start(); }).catch(()=>{}); },
 sfx(k){ if(!this.ac||!this.S) return; const A=this.S.anchors; if(k==='flip') this.play('flip',A.flip,0.6); else if(k==='stamp') this.play('stamp',A.office,0.35); else if(k==='page') this.play('page',A.oma,0.35); },
 audioTick(){ if(!this.listen) return; const L=this.ac.listener, r=this.el.renderer, c=r.xr.isPresenting?r.xr.getCamera():this.el.camera; const p=new THREE.Vector3(), q=new THREE.Quaternion(); c.getWorldPosition(p); c.getWorldQuaternion(q);
  const f=new THREE.Vector3(0,0,-1).applyQuaternion(q), u=new THREE.Vector3(0,1,0).applyQuaternion(q);
  if(L.positionX){ L.positionX.value=p.x; L.positionY.value=p.y; L.positionZ.value=p.z; L.forwardX.value=f.x; L.forwardY.value=f.y; L.forwardZ.value=f.z; L.upX.value=u.x; L.upY.value=u.y; L.upZ.value=u.z; } else { L.setPosition(p.x,p.y,p.z); L.setOrientation(f.x,f.y,f.z,u.x,u.y,u.z); } }
});
})();
