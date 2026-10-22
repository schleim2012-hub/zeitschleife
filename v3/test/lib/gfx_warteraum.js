/* Warteraum (Jenseits-Bürgeramt) – eigene Testszene, nur Laufen + Umschauen.
   Geometrie/Material/Lightmap aus Blender (tools/gfx_warteraum/build_room.py): assets/warteraum/warteraum.glb (UV0 Texturen, UV1 Lightmap) + lm.jpg + scene.json.
   Echtzeit-Lichter (4): Hemi teal, 2 kalte Neonröhren (eine flackert weich), grünes Schalterlicht. Tischlampen + rotes Pendel aus der Lightmap (kalt getönt, 0.68).
   Figuren-Hybrid: statische Körper (gebacken), bewegliche Teile (Kopf/Unterarm/Fuß/Buchseite) per Code um ihr Gelenk gedreht.
   Ton (WebAudio, positionsabhängig, startet nach der ersten Geste/VR-Start): Radio mit Fahrstuhlmusik (Kleinlautsprecher-Filter + Knistern),
   Leuchtstoff-Brummen, Uhr, Fallblatt-Klack + Ding, Husten/Blättern/Knarzen, dumpfe Stimmen/Schreibmaschine/Stempel aus dem Hinterbüro.
   Debug: ?nolm=1 (ohne Lightmap) · ?lmg=1.2 (Lightmap-Gain) · ?lift=0.06 (Schatten-Anhebung) · ?vlg=1 (Vertex-Licht-Gain) · ?touchfix=0 · ?mute=1
   v7 (1022w7): Figuren + Sofa tragen ihr Licht als gebackene Vertexfarbe (scene.json vl/vlScale) statt Lightmap → keine Flecken/Facetten mehr;
   Lightmap angehoben (Film: gleichmäßiger, warm, Wände + Gesichter lesbar), Lampenschirme mit Verlauf + Falten, Handy-Tippen läuft bis an die Hülle. */
(function(){
const Q=location.search, num=(k,d)=>{ const m=Q.match(new RegExp('[?&]'+k+'=([\\d.]+)')); return m?+m[1]:d; };
const BASE='../assets/warteraum/';
AFRAME.registerComponent('warteraum',{
 init(){ const T=THREE, sc=this.el, self=this; this.t0=performance.now(); window.__wr={ready:false};
  fetch(BASE+'scene.json?v=7b').then(r=>r.json()).then(S=>{ self.S=S; self.load(S); });
  this.loco(); this.audioArm(); },
 load(S){ const T=THREE, sc=this.el, self=this, R=sc.renderer;
  const lm=new T.TextureLoader().load(BASE+'lm.jpg?v=7b'); lm.flipY=false; lm.channel=1; lm.colorSpace=T.SRGBColorSpace;
  const LMI=Math.PI*(S.lmScale||1)*num('lmg',1.0), LIFT=num('lift',0.05), VLN=new Set(S.vl||[]), VLG=(S.vlScale||1)*num('vlg',1.0); // v4 (Beetle): keine Neonröhren mehr – Licht kommt aus warmen Stehlampen, Sternleuchten, roter Pendel-Traube (alles gebacken)
  const el=document.createElement('a-entity'); el.setAttribute('gltf-model',BASE+'warteraum.glb?v=7b'); sc.appendChild(el);
  el.addEventListener('model-loaded',()=>{ const root=el.getObject3D('mesh'); self.root=root; const mats=new Set(), M={}; self.nodes={};
   root.traverse(o=>{ if(o.name) self.nodes[o.name]=o; if(o.isMesh){ mats.add(o.material); o.frustumCulled=true; } });
   mats.forEach(m=>{ M[m.name]=m; m.envMapIntensity=0; if(m.map) m.map.anisotropy=8;
    if(VLN.has(m.name)){ // v7: gebackenes Vertex-Licht (Col = Tönung × Licht/vlScale) → als Eigenleuchten, gleiche Skala wie die Lightmap
     m.lightMap=null; m.vertexColors=true; m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * '+VLG.toFixed(4)+' * vec3(1.0,0.97,0.92);'); };
     m.customProgramCacheKey=()=>'wrvl'+VLG.toFixed(3); }
    else if(!/[?&]nolm=1/.test(Q)&&!/wr_glass|wr_emit|wr_flip|wr_shade/.test(m.name)){ m.lightMap=lm; m.lightMapIntensity=LMI;
     // v4: warme Film-Stimmung (Lightmap kaum getönt; Grün nur aus Tür-Schacht und Schalter); v7: Schatten sanft angehoben (lift), Lichtinseln bleiben
     m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <lights_fragment_maps>',T.ShaderChunk.lights_fragment_maps.replace('lightMapTexel.rgb * lightMapIntensity','( lightMapTexel.rgb + '+LIFT.toFixed(3)+' * (1.0 - lightMapTexel.rgb) ) * lightMapIntensity * vec3(1.0,0.97,0.92)')); }; m.customProgramCacheKey=()=>'wrlm'+LIFT.toFixed(3); }
    if(m.metalness>0.2) m.metalness=0.35; m.needsUpdate=true; });
   // Sonder-Materialien
   const swap=(name,mk)=>{ const old=M[name]; if(!old) return; const nm=mk(old); root.traverse(o=>{ if(o.isMesh&&o.material===old) o.material=nm; }); M[name]=nm; };
   swap('wr_emit',o=>new T.MeshBasicMaterial({color:new T.Color(0x6cd858).multiplyScalar(0.9),vertexColors:false,fog:false}));
   swap('wr_glass',o=>new T.MeshStandardMaterial({color:0xa8b4ac,roughness:0.1,metalness:0,transparent:true,opacity:0.06,depthWrite:false})); // v7: Scheibe kaum sichtbar (Schönheitskönigin klar zu sehen)
   if(M.wr_shade){ const sh_=M.wr_shade; sh_.emissive=new T.Color(0xc88a4c); sh_.emissiveMap=sh_.map; sh_.emissiveIntensity=0.6; sh_.side=T.DoubleSide; // v4: Schirm ohne Lightmap (Hunyuan-Inseln)
    // v7: nicht mehr flach – heller zur Unterkante (Licht fällt nach unten raus), oben dunkler, senkrechte Stofffalten, innen etwas wärmer; Spitzen bleiben unter Weiß (kein Hotspot)
    const LC=(S.lamps||[]).slice(0,3).map(p=>new T.Vector3(p[0],p[1],p[2])); while(LC.length<3) LC.push(new T.Vector3(99,0,99));
    sh_.onBeforeCompile=sh=>{ sh.uniforms.lc={value:LC};
     sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWp;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWp=(modelMatrix*vec4(transformed,1.0)).xyz;');
     sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWp; uniform vec3 lc[3];').replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      vec3 c0=lc[0]; float dm=distance(vWp.xz,lc[0].xz); for(int i=1;i<3;i++){ float d=distance(vWp.xz,lc[i].xz); if(d<dm){ dm=d; c0=lc[i]; } }
      float hh=clamp((vWp.y-(c0.y-0.17))/0.45,0.0,1.0); float ang=atan(vWp.z-c0.z,vWp.x-c0.x);
      float pleat=0.80+0.20*pow(abs(sin(ang*13.0)),0.55); float weave=0.95+0.05*sin(ang*170.0)*sin(vWp.y*260.0); float grad=mix(1.22,0.42,smoothstep(0.0,1.0,hh));
      float ndv=abs(dot(normalize(normal),normalize(vViewPosition))); float thru=mix(0.62,1.0,ndv);   // durchleuchteter Stoff: Mitte heller, Ränder dunkler
      totalEmissiveRadiance*=grad*pleat*weave*thru*(gl_FrontFacing?1.0:1.15);`); };
    sh_.customProgramCacheKey=()=>'wrshade7'; }
   if(M.wr_noexit){ M.wr_noexit.emissive=new T.Color(0xb8d8a8); M.wr_noexit.emissiveMap=M.wr_noexit.map; M.wr_noexit.emissiveIntensity=0.5; }
   if(M.wr_vinyl){ M.wr_vinyl.roughness=0.72; } // Sofa/Sessel: mattes altes Kunstleder, keine Glanzstreifen
   // v7: Sofa = eigenes Material wr_sofa (Vertex-Licht mit Kontaktschatten, warmes Beige) – der v6-Sonderdraw ohne Licht entfällt
   if(M.wr_sofa){ M.wr_sofa.roughness=0.72; }
   if(M.wr_redglass){ M.wr_redglass.emissive=new T.Color(0x4a1a12); M.wr_redglass.emissiveIntensity=0.24; M.wr_redglass.roughness=0.6; M.wr_redglass.side=T.DoubleSide; }
   // Fallblatt-Anzeige: Canvas (Text per Code)
   const cv=document.createElement('canvas'); cv.width=512; cv.height=148; const cx=cv.getContext('2d'); const ft=new T.CanvasTexture(cv); ft.colorSpace=T.SRGBColorSpace; ft.anisotropy=8; self.flip={cv,cx,tex:ft,n:4,anim:0};
   swap('wr_flip',o=>new T.MeshBasicMaterial({map:ft,color:0x9a9a90}));
   self.drawFlip(4,4,1);
   // Pin-ups (eigene Textur pinups.png im GLB). Erwachsenen-Variante: nur wenn window.ZS_ADULT gesetzt ist (derzeit nirgends) wird
   // assets/warteraum/pinups_adult.jpg geladen – fehlt die Datei, bleibt die Standard-Fassung. Gleiche Zellen-Aufteilung (2 × 512×683 oben links/rechts, 1024²).
   if(M.wr_pinup){ M.wr_pinup.emissive=new T.Color(0x000000); if(window.ZS_ADULT){ new T.TextureLoader().load(BASE+'pinups_adult.jpg?v=1',tx=>{ tx.flipY=false; tx.colorSpace=T.SRGBColorSpace; tx.anisotropy=8; M.wr_pinup.map=tx; M.wr_pinup.needsUpdate=true; },undefined,()=>{}); } }
   // Lichter (max 4): Hemi + grünes Fenster + 2 warme Stehlampen (Film: keine Deckenröhren; Rest der Lichtinseln steckt in der Lightmap)
   const hemi=new T.HemisphereLight(0x6a5a46,0x16120e,0.42); // v7: wärmer, heller (Film) sc.object3D.add(hemi);
   const gw=S.window; const green=new T.PointLight(0x9ee08a,0.32,3.2,2); green.position.set(gw[0],gw[1]+0.25,gw[2]+0.35); // v7: schwächer, weniger gesättigt, vor der Scheibe (kein grüner Schleier über ihr) sc.object3D.add(green);
   const LP=S.lamps||[]; const warmL=[LP[0],null].map((p,i)=>{ const l=new T.PointLight(0xffb070,i?1.0:1.3,3.8,2); if(p) l.position.set(p[0],p[1]-0.12,p[2]); else { const A=S.anchors.assi; l.position.set(A[0]-1.1,1.55,A[2]); } sc.object3D.add(l); return l; }); // 2. Licht: warmes Raumlicht vor dem Sofa (Gesicht der Assistentin)
   const FX=LP.slice(0,2).map(p=>[p[0],p[2]]); const ch=()=>2.6;
   self.L={hemi,green,warm:warmL};
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
   self.buildCols(S,root);
   self.dust(T,sc,FX,ch);
   window.__wr={ready:true,nodes:Object.keys(self.nodes).length,mov:self.mov.length,S,cols:self.cols,hulls:self.hulls};
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
  // Neonröhre 2: leises, weiches Flackern (Einbrüche auf 70-85 %, nie aus, kein Stroboskop)
  const N=this.neon; if(N){ N.next-=d; if(N.next<=0){ if(N.hold>0){ N.tgt=0.7+Math.random()*0.15; N.hold--; N.next=0.09+Math.random()*0.12; } else { N.tgt=1; N.hold=Math.random()<0.5?1+(Math.random()*3|0):0; N.next=N.hold?0.12:2.5+Math.random()*5; } }
   const nl=N.lvl+(N.tgt-N.lvl)*Math.min(1,d*14); if(Math.abs(nl-N.lvl)>0.002){ N.lvl=nl; N.tB.intensity=N.base*nl; N.diff.setColorAt(1,new T.Color().copy(N.col).multiplyScalar(0.55+0.45*nl)); N.diff.instanceColor.needsUpdate=true; } }
  // Figuren-Idle (langsam, zufällige Phase)
  const qa=new T.Quaternion();
  this.mov.forEach(m=>{ const u=s*m.sp+m.ph; let a=0;
   switch(m.kind){
    case 'head': a=0.22*Math.sin(u*0.21)+0.1*Math.sin(u*0.53+1.3); if(m.n==='frl_head') a*=0.18; // v7: Königin schaut nach vorn (Pete 02), kaum Drehung → keine Doppelkontur aus der Frontprojektion if(m.n==='brand_head') a+=0.05*(Math.sin(u*7.1)>0.97?1:0); if(m.n==='jaeger_head') a=0.35*Math.sin(u*0.35); break;
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
  const D=this.motes; if(D){ for(let i=0;i<D.N;i++){ const k=i*3, u=s*0.05+i*1.7; D.P[k]=D.S0[k]+0.12*Math.sin(u*0.9+i); D.P[k+1]=D.S0[k+1]+0.10*Math.sin(u*0.6+i*0.3)-((s*0.012+i*0.37)%1)*0.08; D.P[k+2]=D.S0[k+2]+0.12*Math.cos(u*0.7+i*2.1); } D.g.attributes.position.needsUpdate=true; }
  // Leuchtstoff-Flackern (grünes Licht), ganz leicht
  if(this.L){ const f=Math.random()<0.004?0.45:1; this.L.green.intensity+=((0.32*f)-this.L.green.intensity)*0.3; }
  // Fallblatt: alle 35–70 s eine Nummer weiter
  const F=this.flip; if(F){ if(!F.next) F.next=s+20+Math.random()*20; if(s>F.next&&!F.anim){ F.anim=s; this.sfx('flip'); }
   if(F.anim){ const k=(s-F.anim)/0.35; if(k>=1){ F.n++; this.drawFlip(F.n,F.n,1); F.anim=0; F.next=s+35+Math.random()*35; } else this.drawFlip(F.n,F.n+1,k); } }
  this.touchFix(); this.clamp(); this.locoTick(d); this.audioTick(s); },
 // ---------------- Bewegung (L-Stick gehen, R-Stick drehen; Desktop WASD) ----------------
 loco(){ this.ax=[0,0]; this.snap=0; setTimeout(()=>{ const L=document.getElementById('hl'), Rr=document.getElementById('hr');
  L&&L.addEventListener('thumbstickmoved',e=>{ this.ax=[e.detail.x,e.detail.y]; });
  Rr&&Rr.addEventListener('thumbstickmoved',e=>{ const x=e.detail.x; if(Math.abs(x)>0.7&&!this.snap){ this.snap=1; const rig=document.getElementById('rig').object3D, h0=this.head().clone(); rig.rotation.y-=Math.sign(x)*Math.PI/6; rig.updateMatrixWorld(true); const h1=this.head(); rig.position.x+=h0.x-h1.x; rig.position.z+=h0.z-h1.z; } if(Math.abs(x)<0.3) this.snap=0; }); },0); },
 head(){ const r=this.el.renderer, c=this.el.camera; /* Hauptspiel-Bot: Kopf inkl. Rig-Drehung (xr.getCamera() ohne Rig) */ const v=new THREE.Vector3(); c.getWorldPosition(v); return v; },
 locoTick(d){ const [x,y]=this.ax; if(Math.abs(x)<0.15&&Math.abs(y)<0.15) return; const r=this.el.renderer, c=this.el.camera, q=new THREE.Quaternion(); c.getWorldQuaternion(q);
  const f=new THREE.Vector3(0,0,-1).applyQuaternion(q); f.y=0; f.normalize(); const rt=new THREE.Vector3(-f.z,0,f.x); const rig=document.getElementById('rig').object3D; const sp=1.4*d;
  rig.position.addScaledVector(f,-y*sp).addScaledVector(rt,x*sp); },
 // ---------------- Kollision ----------------
 // Pete: ganz nah ran, aber nie hindurch. Sperrzonen gelten für die KOPF-Position (Kamera-Weltposition; in VR wird das Rig verschoben, am PC/Handy die Kamera):
 // · jede Figur samt Stuhl: konvexe Hülle des echten Modells im Grundriss + 0.12 m · große/kleine Möbel (scene.json-Boxen, 3 cm eingerückt): +0.18 → ~0.15 m
 // · NO-EXIT-Tür/Schacht unverändert (+0.22) · Figuren-Boxen aus scene.json werden durch die Hüllen ersetzt.
 // touchctl (Handy-Tippen) gleitet zum Ziel, die Szene schiebt zurück → das Gehen bleibt an der Kante stehen. ?cols=1 zeigt die Zonen.
 buildCols(S,root){ const T=THREE, cols=[], hulls=[]; const FIG_M=0.12, FURN_M=0.18, DOOR_M=0.22;
  root.updateMatrixWorld(true); const pts={}, v=new T.Vector3();
  root.traverse(o=>{ if(!o.isMesh||!o.material) return; const m=/^wr_fig_(\w+)$/.exec(o.material.name||''); if(!m||m[1]==='frl') return; // Fräulein steht hinter der Theke
   const P=o.geometry.attributes.position, A=(pts[m[1]]=pts[m[1]]||[]); for(let i=0;i<P.count;i+=2){ v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld); if(v.y<1.9) A.push([v.x,v.z]); } });
  const hull=P=>{ P=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]); const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]); const lo=[],up=[];
   for(const p of P){ while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0) lo.pop(); lo.push(p); }
   for(let i=P.length-1;i>=0;i--){ const p=P[i]; while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0) up.pop(); up.push(p); }
   return lo.slice(0,-1).concat(up.slice(0,-1)); }; // CCW (x,z)
  // Getrennte Teile (z. B. zersägte Frau: Oberkörper und Beine an den Sofa-Enden) → eigene Hüllen, sonst sperrt die Hülle die Lücke davor
  const split=A=>{ for(const k of [0,1]){ const S=A.slice().sort((a,b)=>a[k]-b[k]); for(let i=1;i<S.length;i++) if(S[i][k]-S[i-1][k]>0.15) return [...split(S.slice(0,i)),...split(S.slice(i))]; } return [A]; };
  const fb={}; Object.entries(pts).forEach(([n,A])=>{ const parts=split(A); let bb=[9,-9,9,-9]; parts.forEach(P=>{ if(P.length<3) return; const H=hull(P); hulls.push({n,H,m:FIG_M}); H.forEach(h=>{ bb=[Math.min(bb[0],h[0]),Math.max(bb[1],h[0]),Math.min(bb[2],h[1]),Math.max(bb[3],h[1])]; }); }); fb[n]=bb; });
  ((S&&S.colliders)||[]).forEach(([a0,a1,b0,b1])=>{ const door=b0>2.3&&a0>0&&a1<1.5; const ar=(a1-a0)*(b1-b0);
   if(!door&&Object.values(fb).some(f=>{ const ox=Math.max(0,Math.min(a1,f[1])-Math.max(a0,f[0])), oz=Math.max(0,Math.min(b1,f[3])-Math.max(b0,f[2])); return ox*oz>0.6*ar; })) return; // Figurenkörper → Hülle
   const m=door?DOOR_M:FURN_M; cols.push([a0-m,a1+m,b0-m,b1+m,door?'tuer':'moebel']); });
  this.cols=cols; this.hulls=hulls;
  if(/[?&]cols=1/.test(Q)){ const g=new T.Group(); cols.forEach(([a0,a1,b0,b1,n])=>{ const me=new T.Mesh(new T.BoxGeometry(a1-a0,0.04,b1-b0),new T.MeshBasicMaterial({color:n==='tuer'?0x30a0ff:0xffa020,transparent:true,opacity:0.35,depthWrite:false})); me.position.set((a0+a1)/2,0.03,(b0+b1)/2); g.add(me); });
   hulls.forEach(({H})=>{ const sh=new T.Shape(H.map(h=>new T.Vector2(h[0],-h[1]))); const me=new T.Mesh(new T.ShapeGeometry(sh),new T.MeshBasicMaterial({color:0xff3030,transparent:true,opacity:0.45,depthWrite:false,side:T.DoubleSide})); me.rotation.x=-Math.PI/2; me.position.y=0.035; g.add(me); }); this.el.object3D.add(g); } },
 // Punkt aus konvexem Polygon (CCW) + Rand m schieben
 pushHull(p,H,m){ let inside=true; const n=H.length, cand=[]; const B=[-2.65,2.55,-2.2,2.2];
  for(let i=0;i<n;i++){ const a=H[i], b=H[(i+1)%n]; const ex=b[0]-a[0], ez=b[1]-a[1], L=Math.hypot(ex,ez); if(L<1e-6) continue; const ox=ez/L, oz=-ex/L; // Außennormale (CCW in x,z)
   const d=(p.x-a[0])*ox+(p.z-a[1])*oz; if(d>0){ inside=false; break; } cand.push([-d,ox,oz]); }
  if(inside){ // kürzester Weg hinaus, der im Raum bleibt (nie Richtung Wand hinter den Stühlen)
   cand.sort((u,v)=>u[0]-v[0]); for(const [d,ox,oz] of cand){ const x=p.x+ox*(d+m+1e-3), z=p.z+oz*(d+m+1e-3); if(x>B[0]&&x<B[1]&&z>B[2]&&z<B[3]){ p.x=x; p.z=z; return true; } }
   const [d,ox,oz]=cand[0]; p.x+=ox*(d+m+1e-3); p.z+=oz*(d+m+1e-3); return true; }
  let qd=1e9, qx=0, qz=0; for(let i=0;i<n;i++){ const a=H[i], b=H[(i+1)%n]; const ex=b[0]-a[0], ez=b[1]-a[1]; const t=Math.max(0,Math.min(1,((p.x-a[0])*ex+(p.z-a[1])*ez)/(ex*ex+ez*ez||1e-9))); const x=a[0]+ex*t, z=a[1]+ez*t, d=Math.hypot(p.x-x,p.z-z); if(d<qd){ qd=d; qx=x; qz=z; } }
  if(qd<m){ const k=(m+1e-3)/(qd||1e-6); p.x=qx+(p.x-qx)*k; p.z=qz+(p.z-qz)*k; return true; } return false; },
 push(p){ const cols=this.cols||[], hulls=this.hulls||[]; const B=[-2.65,2.55,-2.2,2.2];
  for(let it=0;it<6;it++){ let hit=false;
   p.x=Math.min(B[1],Math.max(B[0],p.x)); p.z=Math.min(B[3],Math.max(B[2],p.z));
   for(const h of hulls) if(this.pushHull(p,h.H,h.m)) hit=true;
   for(const [a0,a1,b0,b1] of cols){ if(p.x>a0&&p.x<a1&&p.z>b0&&p.z<b1){ hit=true; const c=[[p.x-a0,'x',a0],[a1-p.x,'x',a1],[p.z-b0,'z',b0],[b1-p.z,'z',b1]].sort((u,v)=>u[0]-v[0])[0]; p[c[1]]=c[2]+(c[2]===a0||c[2]===b0?-1e-3:1e-3); } }
   if(!hit) break; }
  // Sicherheitsnetz: widersprechen sich zwei Zonen (enge Nische), bleibt der Kopf an der letzten freien Stelle statt in einem Modell
  if(!this.free(p)&&this.lastFree){ p.x=this.lastFree.x; p.z=this.lastFree.z; } else if(this.free(p)) this.lastFree={x:p.x,z:p.z};
  return p; },
 // v7: Handy-Tippen (touchctl) – Ziel in/an einer Sperrzone (Figur samt Stuhl, Möbel) → neues Ziel = nächste freie Stelle am Rand der Zone,
 // 6 cm hineingeschoben: die Kollision hält den Kopf an der Kante (0,12 m Figur / 0,15 m Möbel), touchctl ist dann "angekommen" (≤8 cm).
 // Vorher blieb das Gehen 0,2–0,6 m davor stehen (Tipp auf eine Figur = 0,45 m vor dem Treffpunkt, bzw. Hänger-Erkennung beim Anlaufen). ?touchfix=0 = alt.
 touchFix(){ const Z=window.ZSTouch; if(!Z||!Z.active||!Z.dbg||!Z.walkTo||!this.cols||/[?&]touchfix=0/.test(Q)||this.el.renderer.xr.isPresenting) return;
  const w=Z.dbg().walk; if(!w||!w.p||w.stop>0.6){ return; } const k=w.p.x.toFixed(3)+','+w.p.z.toFixed(3); if(k===this._tw) return; this._tw=k;
  const g={x:w.p.x,z:w.p.z}; if(this.free(g)&&(w.stop<0.1||!this.nearZone(g,0.5))) return;   // freier Boden-Tipp / Wand: nichts tun
  // nächste freie Stelle am Ziel (48 Richtungen, je erste freie Stelle nach außen), leicht zur Spielerseite gewichtet (nie hinter die Stühle)
  const h=this.head(); let best=null;
  for(let i=0;i<48;i++){ const a=i/48*2*Math.PI, ux=Math.cos(a), uz=Math.sin(a);
   for(let r=0;r<=1.2;r+=0.01){ const p={x:g.x+ux*r,z:g.z+uz*r}; if(p.x<-2.6||p.x>2.5||p.z<-2.15||p.z>2.15) break; if(this.free(p)&&this.nearZone(p,0.135)!==2){ const c=r+0.25*Math.hypot(h.x-p.x,h.z-p.z); if(!best||c<best.c) best={c,x:p.x,z:p.z,ux,uz}; break; } } }
  if(!best) return; const nx=best.x-best.ux*0.06, nz=best.z-best.uz*0.06;   // 6 cm in die Zone: die Kollision hält den Kopf an der Kante, touchctl gilt als angekommen
  this._tw=nx.toFixed(3)+','+nz.toFixed(3); this._touchGoal={x:nx,z:nz,edge:[best.x,best.z],from:k}; Z.walkTo(nx,nz); },
 // 0 = weit weg, 1 = innerhalb r an einer Zone, 2 = in einer Hülle bzw. näher als ihr Rand
 nearZone(p,r){ let res=0; for(const [a0,a1,b0,b1] of this.cols||[]){ const dx=Math.max(a0-p.x,0,p.x-a1), dz=Math.max(b0-p.z,0,p.z-b1); if(Math.hypot(dx,dz)<r) res=1; }
  for(const h of this.hulls||[]){ const H=h.H, n=H.length; let ins=true, md=1e9; for(let i=0;i<n;i++){ const a=H[i], b=H[(i+1)%n]; const ex=b[0]-a[0], ez=b[1]-a[1]; const L2=ex*ex+ez*ez; if(L2<1e-12) continue; if(ex*(p.z-a[1])-ez*(p.x-a[0])<0) ins=false; const t=Math.max(0,Math.min(1,((p.x-a[0])*ex+(p.z-a[1])*ez)/L2)); md=Math.min(md,Math.hypot(p.x-a[0]-ex*t,p.z-a[1]-ez*t)); }
   if(ins||md<h.m) return 2; if(md<r+h.m) res=1; } return res; },
 free(p){ for(const [a0,a1,b0,b1] of this.cols||[]) if(p.x>a0+5e-4&&p.x<a1-5e-4&&p.z>b0+5e-4&&p.z<b1-5e-4) return false; // auch Möbel/Tür: Rückfallpunkt nie in einem Möbel
 for(const h of this.hulls||[]){ const H=h.H, n=H.length; let ins=true, md=1e9; for(let i=0;i<n;i++){ const a=H[i], b=H[(i+1)%n]; const ex=b[0]-a[0], ez=b[1]-a[1]; const L2=ex*ex+ez*ez; if(L2<1e-12) continue; if(ex*(p.z-a[1])-ez*(p.x-a[0])<0) ins=false; const t=Math.max(0,Math.min(1,((p.x-a[0])*ex+(p.z-a[1])*ez)/L2)); md=Math.min(md,Math.hypot(p.x-a[0]-ex*t,p.z-a[1]-ez*t)); } if(ins||md<h.m*0.9) return false; } return true; },
 clamp(){ if(!this.cols) return; const h=this.head(), rig=document.getElementById('rig').object3D, cam=document.getElementById('cam').object3D;
  const p=this.push({x:h.x,z:h.z});
  const dx=p.x-h.x, dz=p.z-h.z; if(Math.abs(dx)>1e-4||Math.abs(dz)>1e-4){ if(this.el.renderer.xr.isPresenting){ rig.position.x+=dx; rig.position.z+=dz; } else { cam.position.x+=dx; cam.position.z+=dz; } } },
 // Staubkörnchen im Lampenlicht (1 Draw, Points, additiv sehr schwach, keine Lichtpunkte)
 dust(T,sc,FX,ch){ const N=260, g=new T.BufferGeometry(), P=new Float32Array(N*3), S0=new Float32Array(N*3);
  for(let i=0;i<N;i++){ const f=FX[i%2]; const r=Math.sqrt(Math.random())*1.1, a=Math.random()*6.283; S0[i*3]=f[0]+Math.cos(a)*r*1.1; S0[i*3+1]=0.5+Math.random()*1.9; S0[i*3+2]=f[1]+Math.sin(a)*r*0.8; }
  P.set(S0); g.setAttribute('position',new T.BufferAttribute(P,3));
  const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d'), gr=x.createRadialGradient(16,16,0,16,16,15); gr.addColorStop(0,'rgba(220,240,226,0.9)'); gr.addColorStop(0.5,'rgba(220,240,226,0.25)'); gr.addColorStop(1,'rgba(220,240,226,0)'); x.fillStyle=gr; x.fillRect(0,0,32,32);
  const m=new T.PointsMaterial({map:new T.CanvasTexture(c),size:0.011,sizeAttenuation:true,transparent:true,opacity:0.30,depthWrite:false,blending:T.AdditiveBlending,color:0xe0cfb0,fog:true});
  const pts=new T.Points(g,m); pts.frustumCulled=false; sc.object3D.add(pts); this.motes={g,P,S0,N}; },
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
  loop('hum',A.office,0.10); loop('tick',A.clock,0.35); loop('voices',A.office,0.30); loop('typewriter',A.office,0.16);
  // zufällige Geräusche der Wartenden
  const who=['oma','gruen','brand','jaeger','taucher','assi'];
  const rnd=()=>{ const n=['cough1','cough2','cough3','page','creak','creak2'][Math.floor(Math.random()*6)]; const p=A[who[Math.floor(Math.random()*who.length)]]; this.play(n,p,n.startsWith('cough')?0.45:0.5); setTimeout(rnd,4000+Math.random()*9000); };
  setTimeout(rnd,3000);
  this.listen=true; window.__wr.audio=true; },
 play(n,p,vol){ if(!this.ac) return; this.load(n).then(b=>{ const s=this.ac.createBufferSource(); s.buffer=b; s.playbackRate.value=0.92+Math.random()*0.16; const g=this.ac.createGain(); g.gain.value=vol; s.connect(g); g.connect(this.pan(p)); s.start(); }).catch(()=>{}); },
 sfx(k){ if(!this.ac||!this.S) return; const A=this.S.anchors; if(k==='flip') this.play('flip',A.flip,0.6); else if(k==='stamp') this.play('stamp',A.office,0.35); else if(k==='page') this.play('page',A.oma,0.35); },
 audioTick(){ if(!this.listen) return; const L=this.ac.listener, r=this.el.renderer, c=this.el.camera; const p=new THREE.Vector3(), q=new THREE.Quaternion(); c.getWorldPosition(p); c.getWorldQuaternion(q);
  const f=new THREE.Vector3(0,0,-1).applyQuaternion(q), u=new THREE.Vector3(0,1,0).applyQuaternion(q);
  if(L.positionX){ L.positionX.value=p.x; L.positionY.value=p.y; L.positionZ.value=p.z; L.forwardX.value=f.x; L.forwardY.value=f.y; L.forwardZ.value=f.z; L.upX.value=u.x; L.upY.value=u.y; L.upZ.value=u.z; } else { L.setPosition(p.x,p.y,p.z); L.setOrientation(f.x,f.y,f.z,u.x,u.y,u.z); } }
});
})();
