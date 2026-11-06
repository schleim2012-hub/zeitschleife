/* Mall 1984 – zwei Pop-Kultur-Requisiten (Grok-Runde 21.10.: E1c Bonbonautomat, E2b Skelett mit Zylinder).
   Alles handgebaut (Three.js-Geometrie + Canvas-Texturen), keine fremden Marken, kein Disney/Burton-Asset.
   1) Bonbonautomat „Zentral Schock“ im dunklen Gang hinter dem Brunnen (Klick: ansehen / mit dem Groschen drehen)
   2) Tanzendes Skelett mit Zylinder, Kutte und Sense im Theaterspot: Stop-Motion-Tanz (12 Bilder/s), Kiefer singt mit.
      Musik: eigene WebAudio-Orgel+Summstimme (räumlich, leise). Liegt ../assets/music/mind_the_cable.mp3 vor, wird stattdessen
      dieser Track gespielt und der Kiefer folgt seiner Gesangs-Hüllkurve (AnalyserNode).
   API: window.M84Props.build(sceneEl,{cv,env}) → {update(tMs), collide(x,z), P} – aufgerufen am Ende von buildMall84 (lib/mall3d.js).
   QA: window.__m84Now (Sekunden) überschreibt die Uhr (deterministische Aufnahmen). */
(function(){
const P={ candy:{x:2.3,z:-10.8,ry:-0.35}, skel:{x:-2.0,z:-12.4,ry:0.45}, spot:{x:-3.12,y:5.58,z:-11.5} };
let seed=1106; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
const sstep=(a,b,x)=>{ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); };
window.M84Props={P,build(sc,ctx){ const T=THREE, S=sc.object3D, R=new T.Group(); R.name='m84props'; S.add(R); /* eigene Gruppe (nicht in G: Bake benennt G-Meshes per Index) */
 const cv=ctx.cv||((w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t; });
 const env=ctx.env||null; const V=(x,y,z)=>new T.Vector3(x,y,z);
 const Q=new URLSearchParams(location.search); const MUTE=Q.get('mute')==='1';
 // --- Werkzeuge -------------------------------------------------------------------------------------------
 // weiches Fülllicht ohne Echtzeitlicht (Quest-Budget): Halbkugel-Fill im Shader, nur auf diesen Materialien
 const fill=(m,top,bot,k)=>{ m.onBeforeCompile=sh=>{ sh.uniforms.uFT={value:new T.Color(top).multiplyScalar(k)}; sh.uniforms.uFB={value:new T.Color(bot).multiplyScalar(k)};
   sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWN;').replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvWN=normalize(mat3(modelMatrix)*objectNormal);');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWN; uniform vec3 uFT,uFB;').replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nreflectedLight.indirectDiffuse+=diffuseColor.rgb*mix(uFB,uFT,clamp(vWN.y*0.5+0.5,0.,1.));'); };
  m.customProgramCacheKey=()=>'m84fill'; return m; };
 const ni=g=>{ g=g.index?g.toNonIndexed():g; if(!g.attributes.uv) g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2)); if(!g.attributes.normal) g.computeVertexNormals(); return g; };
 // Teile zu einer Geometrie mischen: [geo, matrix|null, color|null]
 const mg=parts=>{ const gs=parts.map(([g,m,c])=>{ g=ni(g.clone()); if(m) g.applyMatrix4(m); ['uv1','uv2'].forEach(k=>g.attributes[k]&&g.deleteAttribute(k)); const n=g.attributes.position.count;
   if(!g.attributes.color){ const col=new T.Color(c==null?0xffffff:c), a=new Float32Array(n*3); for(let i=0;i<n;i++){ a[i*3]=col.r; a[i*3+1]=col.g; a[i*3+2]=col.b; } g.setAttribute('color',new T.BufferAttribute(a,3)); } return g; });
  let n=0; gs.forEach(g=>n+=g.attributes.position.count); const r=new T.BufferGeometry(); ['position','normal','uv','color'].forEach(k=>{ const sz=gs[0].attributes[k].itemSize, a=new Float32Array(n*sz); let o=0; gs.forEach(g=>{ a.set(g.attributes[k].array,o); o+=g.attributes[k].array.length; }); r.setAttribute(k,new T.BufferAttribute(a,sz)); }); return r; };
 const M4=(x,y,z,rx,ry,rz,sx,sy,sz)=>new T.Matrix4().compose(V(x||0,y||0,z||0),new T.Quaternion().setFromEuler(new T.Euler(rx||0,ry||0,rz||0)),V(sx||1,sy||sx||1,sz||sx||1));
 // abgerundete Box (Kanten mit Radius r) – fängt Glanzlichter wie gekantetes Blech
 const rbox=(w,h,d,r,seg)=>{ seg=seg||5; const g=new T.BoxGeometry(w,h,d,seg,seg,seg), p=g.attributes.position, hw=w/2-r, hh=h/2-r, hd=d/2-r, v=V(0,0,0), c=V(0,0,0);
  for(let i=0;i<p.count;i++){ v.set(p.getX(i),p.getY(i),p.getZ(i)); c.set(Math.max(-hw,Math.min(hw,v.x)),Math.max(-hh,Math.min(hh,v.y)),Math.max(-hd,Math.min(hd,v.z))); const dv=v.clone().sub(c); if(dv.lengthSq()>1e-12){ dv.normalize().multiplyScalar(r); v.copy(c).add(dv); } p.setXYZ(i,v.x,v.y,v.z); }
  g.computeVertexNormals(); return g; };
 const noise=(x,w,h,n,a,b,sz)=>{ for(let i=0;i<n;i++){ const s=(sz||2)*rnd()+0.5; x.fillStyle=`rgba(${a},${(rnd()*b).toFixed(3)})`; x.fillRect(rnd()*w,rnd()*h,s,s); } };
 const clickBox=(w,h,d,pos,ry,onClick)=>{ const el=document.createElement('a-entity'); el.classList.add('clickable'); sc.appendChild(el);
  const put=()=>{ el.setObject3D('mesh',new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({visible:false}))); el.object3D.position.copy(pos); el.object3D.rotation.y=ry; };
  if(el.hasLoaded) put(); else el.addEventListener('loaded',put); el.addEventListener('click',onClick); return el; };
 const say=(who,txt)=>{ if(window.eraSay) eraSay(who,txt,null,Math.max(3200,txt.length*68)); else { const s=document.getElementById('sub'); if(s){ s.textContent=(who?who+': ':'')+txt; s.style.display='block'; clearTimeout(say.t); say.t=setTimeout(()=>s.style.display='none',Math.max(3200,txt.length*68)); } } };
 // ---- Audio (ein Kontext für beide Requisiten, startet bei der ersten Geste) ----
 const AU={ac:null,ok:false};
 const audio=()=>{ if(AU.ac||MUTE) return AU.ac; try{ AU.ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } return AU.ac; };
 const blip=(f,dur,vol,type,when)=>{ const ac=AU.ac; if(!ac) return; const t=(when||ac.currentTime), o=ac.createOscillator(), g=ac.createGain(); o.type=type||'square'; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(f*0.5,t+dur); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(AU.sfx||ac.destination); o.start(t); o.stop(t+dur+0.02); };

 // =========================================================================================================
 // 1) BONBONAUTOMAT  (E1c: rotes, abgegriffenes Blech, Chrom-Drehgriff, Plexi-Kasten voller Kugeln + Zentral-Schock-Tüten)
 // =========================================================================================================
 const CM=new T.Group(); CM.position.set(P.candy.x,0,P.candy.z); CM.rotation.y=P.candy.ry; CM.scale.setScalar(1.12); R.add(CM); /* ~1,37 m hoch wie im Foto */
 const paintT=cv(512,512,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#c21d1f'); g.addColorStop(0.55,'#b0181a'); g.addColorStop(1,'#7a1413'); x.fillStyle=g; x.fillRect(0,0,w,h);
   noise(x,w,h,9000,'60,8,8',0.18,2); noise(x,w,h,3000,'235,120,110',0.08,1.5);
   for(let i=0;i<140;i++){ x.strokeStyle=`rgba(${rnd()<0.6?'205,190,180':'40,25,22'},${0.15+rnd()*0.35})`; x.lineWidth=0.5+rnd()*1.2; x.beginPath(); const sx=rnd()*w, sy=rnd()*h, a=rnd()*6.28, l=4+rnd()*40; x.moveTo(sx,sy); x.lineTo(sx+Math.cos(a)*l,sy+Math.sin(a)*l*0.4); x.stroke(); }
   for(let i=0;i<55;i++){ const cx=rnd()*w, cy=(rnd()<0.5?rnd()*0.08:0.75+rnd()*0.25)*h, r=1.5+rnd()*6; x.fillStyle=`rgba(${rnd()<0.5?'150,140,135':'90,50,30'},0.8)`; x.beginPath(); for(let k=0;k<9;k++){ const a=k/9*6.28, rr=r*(0.5+rnd()); x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr); } x.fill(); }
   for(let i=0;i<26;i++){ const sx=rnd()*w, l=20+rnd()*90, gg=x.createLinearGradient(0,h-l,0,h); gg.addColorStop(0,'rgba(70,30,15,0)'); gg.addColorStop(1,'rgba(70,30,15,0.55)'); x.fillStyle=gg; x.fillRect(sx,h-l,2+rnd()*6,l); }
   const gr=x.createRadialGradient(w*0.42,h*0.42,10,w*0.42,h*0.42,120); gr.addColorStop(0,'rgba(30,10,10,0.25)'); gr.addColorStop(1,'rgba(30,10,10,0)'); x.fillStyle=gr; x.fillRect(0,0,w,h); });
 const redM=fill(new T.MeshStandardMaterial({map:paintT,roughness:0.42,metalness:0.25,envMap:env,envMapIntensity:0.55}),0x9a7aa8,0x3a2028,0.42);
 const blackM=fill(new T.MeshStandardMaterial({map:paintT,color:0x2a2a2a,roughness:0.55,metalness:0.4,envMap:env,envMapIntensity:0.4}),0x6a5a80,0x201820,0.25);
 const chromeM=fill(new T.MeshStandardMaterial({color:0xd8dce4,roughness:0.16,metalness:1,envMap:env,envMapIntensity:1.5}),0x8a80a0,0x302838,0.18);
 const steelT=cv(256,512,(x,w,h)=>{ x.fillStyle='#9a9ea6'; x.fillRect(0,0,w,h); for(let y=0;y<h;y++){ x.fillStyle=`rgba(${rnd()<0.5?'255,255,255':'0,0,0'},${(rnd()*0.08).toFixed(3)})`; x.fillRect(0,y,w,1); } noise(x,w,h,1400,'40,40,45',0.25,1.5);
   x.fillStyle='rgba(40,40,46,0.85)'; x.font='600 15px "DejaVu Sans",sans-serif'; x.textAlign='center'; x.fillText('Münze einwerfen',w/2,40); x.fillText('dann drehen',w/2,60);
   x.fillStyle='#111'; x.fillRect(w*0.62,84,10,46); x.strokeStyle='rgba(255,255,255,0.4)'; x.strokeRect(w*0.62-2,82,14,50);
   x.strokeStyle='rgba(30,30,36,0.6)'; x.lineWidth=2; x.beginPath(); x.arc(w/2,h*0.55,62,0,6.28); x.stroke(); [[14,14],[w-14,14],[14,h-14],[w-14,h-14]].forEach(([a,b])=>{ x.fillStyle='#55585e'; x.beginPath(); x.arc(a,b,7,0,6.28); x.fill(); x.strokeStyle='#222'; x.beginPath(); x.moveTo(a-5,b); x.lineTo(a+5,b); x.stroke(); }); });
 const steelM=fill(new T.MeshStandardMaterial({map:steelT,roughness:0.3,metalness:0.6,envMap:env,envMapIntensity:0.8}),0xa8a0b8,0x403848,0.55);
 const flapT=cv(256,256,(x,w,h)=>{ x.fillStyle='#8e929a'; x.fillRect(0,0,w,h); for(let y=0;y<h;y++){ x.fillStyle=`rgba(255,255,255,${(rnd()*0.07).toFixed(3)})`; x.fillRect(0,y,w,1); } noise(x,w,h,1200,'30,30,30',0.3,2);
   x.fillStyle='#e8e2cc'; x.fillRect(w*0.22,h*0.62,w*0.56,h*0.2); x.strokeStyle='#333'; x.lineWidth=2; x.strokeRect(w*0.22,h*0.62,w*0.56,h*0.2); x.fillStyle='#1a1a1a'; x.font='700 34px "DejaVu Sans Condensed",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('DM 0,50',w/2,h*0.72);
   x.fillStyle='rgba(30,30,30,0.7)'; x.font='600 17px "DejaVu Sans",sans-serif'; x.fillText('hier entnehmen',w/2,h*0.18); });
 const flapM=fill(new T.MeshStandardMaterial({map:flapT,roughness:0.33,metalness:0.6,envMap:env,envMapIntensity:0.8}),0xa8a0b8,0x403848,0.55);
 const plateT=cv(256,96,(x,w,h)=>{ x.fillStyle='#b8b4a8'; x.fillRect(0,0,w,h); noise(x,w,h,900,'60,50,40',0.3,1.5); x.strokeStyle='#3a3630'; x.lineWidth=4; x.strokeRect(4,4,w-8,h-8); x.fillStyle='#1c1a18'; x.font='800 30px "DejaVu Sans Condensed",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('MADE IN',w/2,h*0.34); x.fillText('GERMANY',w/2,h*0.7); });
 const plateM=fill(new T.MeshStandardMaterial({map:plateT,roughness:0.45,metalness:0.6,envMap:env,envMapIntensity:0.6}),0x8a80a0,0x302838,0.35);
 const tagT=cv(512,128,(x,w,h)=>{ x.fillStyle='#e9e1c8'; x.fillRect(0,0,w,h); noise(x,w,h,1500,'90,70,40',0.25,2); x.fillStyle='#b3161b'; x.fillRect(0,0,w,10); x.fillRect(0,h-10,w,10); x.fillStyle='#1d1b18'; x.font='italic 800 50px "DejaVu Sans",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('Bonbons · Kugeln',w/2,h*0.52); });
 const tagM=fill(new T.MeshStandardMaterial({map:tagT,roughness:0.7}),0x8a80a0,0x302838,0.4);
 // Zentral-Schock-Tüte: gelbe Folie, roter Schriftzug, Comic-Hai mit Zähnen, gezackte Siegelnähte (Alpha)
 const packT=cv(256,320,(x,w,h)=>{ x.clearRect(0,0,w,h); const top=26, bot=h-26; x.fillStyle='#f4cf1a'; x.fillRect(0,top,w,bot-top);
   const zig=(y,dir)=>{ x.beginPath(); x.moveTo(0,y); for(let i=0;i<=16;i++) x.lineTo(i*w/16,y+(i%2?dir*12:0)); x.lineTo(w,y); x.closePath(); x.fill(); };
   x.fillStyle='#e7bd12'; x.fillRect(0,4,w,top); x.fillRect(0,bot,w,h-bot-4); x.fillStyle='rgba(0,0,0,0)'; x.globalCompositeOperation='destination-out'; x.fillStyle='#000'; zig(4,1); zig(h-4,-1); x.globalCompositeOperation='source-over';
   for(let i=0;i<w;i+=6){ x.fillStyle='rgba(150,110,0,0.35)'; x.fillRect(i,8,2,top-8); x.fillRect(i,bot,2,h-bot-8); }
   const g=x.createLinearGradient(0,0,w,0); g.addColorStop(0,'rgba(255,255,255,0.0)'); g.addColorStop(0.3,'rgba(255,255,255,0.35)'); g.addColorStop(0.42,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,top,w,bot-top);
   x.save(); x.translate(w/2,78); x.rotate(-0.08); x.font='900 50px "DejaVu Sans Condensed",sans-serif'; x.textAlign='center'; x.lineJoin='round'; x.lineWidth=9; x.strokeStyle='#1d5f1a'; x.fillStyle='#e3231c'; x.strokeText('ZENTRAL',0,0); x.fillText('ZENTRAL',0,0); x.strokeText('SCHOCK',4,46); x.fillText('SCHOCK',4,46); x.restore();
   x.fillStyle='#1d5f1a'; x.fillRect(18,140,w-36,26); x.fillStyle='#fff6c0'; x.font='800 17px "DejaVu Sans Condensed",sans-serif'; x.textAlign='center'; x.fillText('SAUER · Super · KRASS',w/2,159);
   // Hai
   x.save(); x.translate(w/2+6,232); x.fillStyle='#2a86d8'; x.strokeStyle='#0c2a50'; x.lineWidth=4; x.beginPath(); x.moveTo(-96,10); x.quadraticCurveTo(-60,-46,20,-40); x.lineTo(30,-72); x.lineTo(52,-34); x.quadraticCurveTo(100,-22,104,6); x.quadraticCurveTo(70,44,-10,40); x.quadraticCurveTo(-60,38,-96,10); x.closePath(); x.fill(); x.stroke();
   x.beginPath(); x.moveTo(-96,10); x.lineTo(-118,-20); x.lineTo(-112,30); x.closePath(); x.fill(); x.stroke();
   x.fillStyle='#d8eefc'; x.beginPath(); x.moveTo(-60,22); x.quadraticCurveTo(20,52,96,8); x.quadraticCurveTo(30,30,-60,22); x.fill();
   x.fillStyle='#8a1010'; x.beginPath(); x.moveTo(16,6); x.quadraticCurveTo(62,30,100,2); x.quadraticCurveTo(64,12,16,6); x.fill(); x.fillStyle='#fff'; for(let i=0;i<7;i++){ const tx=22+i*11; x.beginPath(); x.moveTo(tx,6+i*0.6); x.lineTo(tx+5,15); x.lineTo(tx+10,7+i*0.4); x.fill(); x.beginPath(); x.moveTo(tx+2,22-i*1.6); x.lineTo(tx+7,14-i*0.6); x.lineTo(tx+11,21-i*1.8); x.fill(); }
   x.fillStyle='#fff'; x.beginPath(); x.ellipse(52,-14,11,9,0,0,6.28); x.fill(); x.fillStyle='#111'; x.beginPath(); x.arc(55,-13,4.5,0,6.28); x.fill(); x.strokeStyle='#0c2a50'; x.lineWidth=4; x.beginPath(); x.moveTo(40,-28); x.lineTo(64,-22); x.stroke(); x.restore(); });
 const packM=fill(new T.MeshStandardMaterial({map:packT,alphaTest:0.5,roughness:0.3,metalness:0.1,envMap:env,envMapIntensity:0.6,side:T.DoubleSide}),0x9a90b0,0x403040,0.42);
 const packGeo=(()=>{ const g=new T.PlaneGeometry(0.1,0.125,6,8), p=g.attributes.position; for(let i=0;i<p.count;i++){ const u=p.getX(i)/0.05, v=p.getY(i)/0.0625; p.setZ(i,0.009*(1-u*u)*(1-Math.pow(Math.abs(v),4))); } g.computeVertexNormals(); return g; })();
 // Gehäuse
 const cab=new T.Mesh(rbox(0.46,0.62,0.40,0.014,6),redM); cab.position.y=0.07+0.31; CM.add(cab);
 const plinth=new T.Mesh(rbox(0.5,0.075,0.44,0.01,4),blackM); plinth.position.y=0.0375; CM.add(plinth);
 const rim=new T.Mesh(rbox(0.475,0.035,0.415,0.008,4),redM); rim.position.y=0.705; CM.add(rim);
 const lid=new T.Mesh(rbox(0.485,0.06,0.425,0.016,6),redM); lid.position.y=1.19; CM.add(lid);
 const lidCap=new T.Mesh(new T.CylinderGeometry(0.035,0.04,0.02,24),chromeM); lidCap.position.y=1.23; CM.add(lidCap);
 // Plexi-Kasten (Rück- und Vorderseiten getrennt sortiert) + helle Kanten
 const glM=(side)=>new T.MeshStandardMaterial({color:0xeef4ff,roughness:0.04,metalness:0.1,envMap:env,envMapIntensity:1.6,transparent:true,opacity:0.13,depthWrite:false,side});
 const gb=new T.Mesh(new T.BoxGeometry(0.45,0.445,0.39),glM(T.BackSide)); gb.position.y=0.94; gb.renderOrder=3; CM.add(gb); const gf=new T.Mesh(gb.geometry,glM(T.FrontSide)); gf.position.y=0.94; gf.renderOrder=5; CM.add(gf);
 const edgeM=new T.MeshStandardMaterial({color:0xdde8ff,roughness:0.1,metalness:0.2,envMap:env,envMapIntensity:1.5,transparent:true,opacity:0.42,depthWrite:false});
 { const parts=[]; [-1,1].forEach(sx=>[-1,1].forEach(sz=>parts.push([new T.BoxGeometry(0.007,0.445,0.007),M4(sx*0.222,0.94,sz*0.192)]))); [-1,1].forEach(sz=>parts.push([new T.BoxGeometry(0.45,0.007,0.007),M4(0,1.158,sz*0.192)])); [-1,1].forEach(sx=>parts.push([new T.BoxGeometry(0.007,0.007,0.39),M4(sx*0.222,1.158,0)]));
   const e=new T.Mesh(mg(parts),edgeM); e.renderOrder=6; CM.add(e); }
 // Glanzstreifen auf der Front (wie im Foto)
 { const st=cv(64,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,w,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(0.5,'rgba(255,255,255,0.9)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,w,h); });
   const sm=new T.MeshBasicMaterial({map:st,transparent:true,opacity:0.1,depthWrite:false,blending:T.AdditiveBlending}); [[-0.12,0.05,0.4],[0.14,0.025,0.3]].forEach(([x,wd,ht])=>{ const m=new T.Mesh(new T.PlaneGeometry(wd,ht),sm); m.position.set(x,0.98,0.1955); m.rotation.z=-0.12; m.renderOrder=7; CM.add(m); }); }
 // Kugeln (1 Draw): Haufen, hinten höher; Tüten vorn am Glas
 const balls=[]; { const r=0.026; const cols=[0xf2c21b,0x1f6fd6,0xd8262a,0x2fae4a,0xf2c21b,0x1f6fd6,0xd8262a,0x2fae4a,0xf0f0e8]; let L=0;
   for(let y=0.725+r; y<1.10; y+=r*1.62, L++){ for(let x=-0.2+r+(L%2)*r*0.9; x<0.2-r*0.6; x+=r*1.9) for(let z=-0.17+r+(L%2)*r*0.8; z<0.17-r*0.6; z+=r*1.9){ const heap=0.98+0.07*(-z/0.17)+0.03*Math.cos(x*9)-0.02*Math.abs(x)/0.2; if(y>heap+rnd()*0.03) continue; if(z>0.08&&x<0.18&&y<0.95) continue; balls.push([x+(rnd()-0.5)*0.012,y+(rnd()-0.5)*0.01,z+(rnd()-0.5)*0.012,cols[(rnd()*cols.length)|0]]); } }
   const bm=fill(new T.MeshStandardMaterial({roughness:0.16,metalness:0.0,envMap:env,envMapIntensity:1.1}),0x9a90b0,0x302030,0.5);
   const im=new T.InstancedMesh(new T.SphereGeometry(r,16,12),bm,balls.length); const mt=new T.Matrix4(); balls.forEach(([x,y,z,c],i)=>{ mt.makeTranslation(x,y,z); im.setMatrixAt(i,mt); im.setColorAt(i,new T.Color(c)); }); im.instanceMatrix.needsUpdate=true; im.instanceColor.needsUpdate=true; im.renderOrder=4; CM.add(im); }
 const packs=[]; [[-0.088,0.835,0.165,0.05,-0.1,1.45],[0.075,0.84,0.16,-0.07,0.08,1.42],[0.0,0.88,-0.05,0.25,0.3,1],[-0.13,0.95,-0.1,-0.3,-0.4,0.95],[0.15,0.92,0.02,0.6,0.15,0.95]].forEach(([x,y,z,ry,rz,s])=>{ const m=new T.Mesh(packGeo,packM); m.position.set(x,y,z); m.rotation.set(-0.1,ry,rz); m.scale.setScalar(s*1.08); m.renderOrder=4; CM.add(m); packs.push(m); });
 // Münzprüfer-Platte, Drehgriff, Ausgabeklappe, Typenschild, Aufkleber
 const mech=new T.Mesh(rbox(0.13,0.2,0.014,0.006,4),steelM); mech.position.set(-0.04,0.53,0.205); CM.add(mech);
 { const g=mech.geometry, p=g.attributes.position, uv=g.attributes.uv; for(let i=0;i<p.count;i++){ uv.setXY(i,p.getX(i)/0.13+0.5,p.getY(i)/0.2+0.5); } uv.needsUpdate=true; }
 const crank=new T.Group(); crank.position.set(-0.04,0.515,0.222); CM.add(crank);
 { const hub=new T.Mesh(new T.CylinderGeometry(0.04,0.046,0.024,32),chromeM); hub.rotation.x=Math.PI/2; crank.add(hub); const cap=new T.Mesh(new T.SphereGeometry(0.026,24,12,0,6.29,0,1.3),chromeM); cap.rotation.x=Math.PI/2; cap.position.z=0.01; crank.add(cap);
   const bar=new T.Mesh(new T.CapsuleGeometry(0.013,0.105,6,12),chromeM); bar.rotation.z=Math.PI/2; bar.position.z=0.03; crank.add(bar); const sh=new T.Mesh(new T.CylinderGeometry(0.009,0.009,0.03,12),chromeM); sh.rotation.x=Math.PI/2; sh.position.z=0.018; crank.add(sh); }
 const flapPl=new T.Mesh(rbox(0.11,0.12,0.012,0.006,4),flapM); flapPl.position.set(-0.04,0.30,0.204); CM.add(flapPl); { const g=flapPl.geometry, p=g.attributes.position, uv=g.attributes.uv; for(let i=0;i<p.count;i++) uv.setXY(i,p.getX(i)/0.11+0.5,p.getY(i)/0.12+0.5); uv.needsUpdate=true; }
 const chute=new T.Mesh(new T.BoxGeometry(0.07,0.04,0.03),new T.MeshBasicMaterial({color:0x050505})); chute.position.set(-0.04,0.325,0.199); CM.add(chute);
 const flap=new T.Group(); flap.position.set(-0.04,0.345,0.212); CM.add(flap); { const f=new T.Mesh(rbox(0.074,0.045,0.006,0.003,3),chromeM); f.position.y=-0.0225; flap.add(f); }
 const prize=new T.Mesh(packGeo,packM); prize.scale.setScalar(0.42); prize.position.set(-0.04,0.322,0.21); prize.rotation.set(-1.2,0,0.2); prize.visible=false; CM.add(prize);
 const mig=new T.Mesh(new T.PlaneGeometry(0.075,0.028),plateM); mig.position.set(0.15,0.11,0.2015); CM.add(mig);
 const tag=new T.Mesh(new T.PlaneGeometry(0.16,0.04),tagM); tag.position.set(0.0,0.645,0.2015); CM.add(tag);
 // Kontaktschatten (dunkler Fleck unter dem Sockel)
 const blobT=cv(128,128,(x)=>{ const g=x.createRadialGradient(64,64,6,64,64,64); g.addColorStop(0,'rgba(0,0,0,0.85)'); g.addColorStop(0.5,'rgba(0,0,0,0.45)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 const blobM=new T.MeshBasicMaterial({map:blobT,transparent:true,depthWrite:false});
 { const b=new T.Mesh(new T.PlaneGeometry(0.85,0.75),blobM); b.rotation.x=-Math.PI/2; b.position.y=0.004; CM.add(b); }
 // Bedienung
 const coinItem=()=>{ const e=window.__era; if(!e||!e.items) return null; return e.items.find(it=>it.el&&String(it.el.getAttribute('gltf-model')||'').includes('coin'))||null; };
 const CS={looked:0,no:0,used:false,busy:false,eaten:false};
 const NO=['Fünfzig Pfennig. Du hast keine. Du hast nicht mal ein Portemonnaie, in dem keine sind.','Du rüttelst am Drehgriff. Der Automat rüttelt zurück – innerlich. Ohne Kleingeld läuft hier nichts.','Der Hai guckt dich an. Du guckst den Hai an. Keiner von euch hat fünfzig Pfennig.'];
 const crankAnim={t0:-1};
 const eatGum=()=>{ if(CS.eaten||!prize.visible) return; CS.eaten=true; CS.busy=false; prize.visible=false;
  say('Erzähler','Ein Zentral Schock. Sauer, super, krass. Deine Zunge reicht gerade schriftlich die Kündigung ein. Irgendwo da hinten singt ein Skelett. Zufall, bestimmt.');
  showStart(); };
 const useCandy=()=>{ audio();
  /* Nach Ausgabe: Klick = Tüte nehmen / Kaugummi essen → Zentral-Schock-Show. Nicht am 6,8s-Timeout. */
  if(CS.eaten){ say('Erzähler','Leer gedreht. Der Hai grinst. Einer pro Kunde, sagt sein Blick. Und sein Gebiss.'); return; }
  if(CS.used&&prize.visible){ eatGum(); return; }
  if(CS.busy) return;
  if(!CS.looked){ CS.looked=1; say('Erzähler','Ein Bonbonautomat, rotes Blech, Baujahr „vor deiner Zeit“. Kugeln und Zentral Schock – sauer, super, krass. Der Hai auf der Tüte grinst, als wüsste er was.'); return; }
  if(CS.used){ say('Erzähler','Leer gedreht. Der Hai grinst. Einer pro Kunde, sagt sein Blick. Und sein Gebiss.'); return; }
  const c=coinItem(); const has=c&&c.el.object3D.visible&&(c.said||(window.__era&&__era.held===c));
  if(!has){ say('Erzähler',NO[CS.no++%NO.length]); return; }
  CS.busy=true; CS.used=true; if(window.__era&&__era.held===c&&__era.drop) __era.drop(); c.el.object3D.visible=false; c.el.classList.remove('clickable'); c.falling=false;
  say('Erzähler','Der Automat will fünfzig Pfennig. Du hast einen Groschen aus dem Brunnen. Er nimmt ihn trotzdem – 1984 hatte noch Vertrauen in die Jugend.');
  if(AU.ac){ blip(2400,0.05,0.12,'triangle'); blip(1700,0.08,0.1,'triangle',AU.ac.currentTime+0.09); }
  crankAnim.t0=performance.now(); setTimeout(()=>{ prize.visible=true; packs[2].visible=false; if(AU.ac){ blip(600,0.12,0.18,'sine'); blip(380,0.14,0.14,'sine',AU.ac.currentTime+0.07); } }, 1300);
  /* 6,8s: Kauf/Busy abschließen – KEIN showStart, Zungen-Satz gehört zum Essen */
  setTimeout(()=>{ CS.busy=false; }, 6800); };
 const cHit=clickBox(0.6,1.45,0.55,V(P.candy.x,0.72,P.candy.z),P.candy.ry,useCandy); cHit.id='m84Candy';

 // =========================================================================================================
 // 2) TANZENDES SKELETT  (E2b: Zylinder, zerfetzte schwarze Kutte mit Kapuze, Rippen sichtbar, grinsender Schädel, Sense)
 // =========================================================================================================
 const SK=new T.Group(); SK.position.set(P.skel.x,0,P.skel.z); SK.rotation.y=P.skel.ry; R.add(SK);
 const boneT=cv(512,512,(x,w,h)=>{ x.fillStyle='#d8c7a0'; x.fillRect(0,0,w,h); noise(x,w,h,16000,'120,95,60',0.16,3); noise(x,w,h,5000,'250,240,215',0.12,2);
   for(let i=0;i<40;i++){ const g=x.createRadialGradient(0,0,0,0,0,10+rnd()*40); const cx=rnd()*w, cy=rnd()*h; x.save(); x.translate(cx,cy); g.addColorStop(0,'rgba(110,80,40,0.22)'); g.addColorStop(1,'rgba(110,80,40,0)'); x.fillStyle=g; x.fillRect(-50,-50,100,100); x.restore(); }
   for(let i=0;i<60;i++){ x.strokeStyle='rgba(80,55,30,0.35)'; x.lineWidth=0.8; x.beginPath(); let px=rnd()*w, py=rnd()*h; x.moveTo(px,py); for(let k=0;k<5;k++){ px+=(rnd()-0.5)*14; py+=(rnd()-0.5)*14; x.lineTo(px,py); } x.stroke(); } });
 boneT.wrapS=boneT.wrapT=T.RepeatWrapping;
 const boneM=fill(new T.MeshStandardMaterial({map:boneT,vertexColors:true,roughness:0.62,metalness:0.0,envMap:env,envMapIntensity:0.25}),0x6a5a70,0x1a1218,0.14);
 const darkM=new T.MeshBasicMaterial({color:0x050404});
 // zerfetzter Stoff: Atlas mit 4 Streifen-Varianten (Fransen links/rechts, gezackter Saum unten, Löcher)
 const clothT=cv(1024,512,(x,w,h)=>{ x.clearRect(0,0,w,h); for(let v=0;v<4;v++){ const o=v*256; x.fillStyle='#0d0b0a'; x.fillRect(o,0,256,h);
   for(let i=0;i<7;i++){ const cx=o+rnd()*256, ww=18+rnd()*50, g=x.createLinearGradient(cx-ww,0,cx+ww,0); const c=rnd()<0.5?'50,44,38':'0,0,0'; g.addColorStop(0,`rgba(${c},0)`); g.addColorStop(0.5,`rgba(${c},${0.25+rnd()*0.25})`); g.addColorStop(1,`rgba(${c},0)`); x.fillStyle=g; x.fillRect(cx-ww,0,ww*2,h); }
   for(let i=0;i<5000;i++){ x.fillStyle=`rgba(${rnd()<0.5?'58,52,44':'0,0,0'},${(rnd()*0.22).toFixed(3)})`; x.fillRect(o+rnd()*256,rnd()*h,1+rnd()*1.5,1+rnd()*1.5); }
   for(let i=0;i<14;i++){ const g=x.createRadialGradient(0,0,0,0,0,20+rnd()*40); g.addColorStop(0,'rgba(70,62,50,0.16)'); g.addColorStop(1,'rgba(70,62,50,0)'); x.save(); x.translate(o+rnd()*256,h*(0.5+rnd()*0.5)); x.scale(1,1.8); x.fillStyle=g; x.fillRect(-60,-60,120,120); x.restore(); }
   x.globalCompositeOperation='destination-out'; x.fillStyle='#000';
   x.beginPath(); x.moveTo(o,h+2); let px=o; const hem=h*(0.16+rnd()*0.1); while(px<o+256){ const tw=6+rnd()*22, tl=hem*(0.15+Math.pow(rnd(),1.5)*1.2); x.lineTo(px+tw*(0.35+rnd()*0.3),h-tl); x.lineTo(px+tw,h-hem*0.1*rnd()); px+=tw; } x.lineTo(o+256,h+2); x.closePath(); x.fill();
   [0,1].forEach(sd=>{ x.beginPath(); const ex=sd?o+256:o; x.moveTo(ex,0); for(let y=0;y<=h;y+=8){ x.lineTo(ex+(sd?-1:1)*(rnd()*14*(0.2+y/h)),y); } x.lineTo(ex,h); x.closePath(); x.fill(); });
   for(let i=0;i<3+v*2;i++){ const cx=o+30+rnd()*196, cy=h*(0.35+rnd()*0.5), r=3+rnd()*11; x.beginPath(); for(let k=0;k<10;k++){ const a=k/10*6.28, rr=r*(0.35+rnd()); x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*1.8); } x.fill(); }
   for(let i=0;i<10;i++){ const cx=o+20+rnd()*216, y0=h-hem*(0.6+rnd()*0.8); x.fillRect(cx,y0,1.5+rnd()*3,h-y0+2); }
   x.globalCompositeOperation='source-over'; } });
 const clothM=fill(new T.MeshStandardMaterial({map:clothT,alphaTest:0.45,side:T.DoubleSide,roughness:0.92,metalness:0,color:0x8a8480}),0x403848,0x0a0808,0.07);
 const tileUV=(g,v,rep)=>{ g=g.index?g.toNonIndexed():g; const uv=g.attributes.uv; for(let t=0;t<uv.count;t+=3){ let mn=1e9; for(let k=0;k<3;k++) mn=Math.min(mn,uv.getX(t+k)*rep); const b=Math.floor(mn+1e-4); for(let k=0;k<3;k++){ const u=Math.min(1,uv.getX(t+k)*rep-b); uv.setX(t+k,(v+0.02+u*0.96)/4); } } return g; };
 const stripUV=(g,v)=>{ const uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setX(i,(v+0.02+uv.getX(i)*0.96)/4); return g; };
 const boneCap=(len,r,knob)=>{ const parts=[[new T.CapsuleGeometry(r,Math.max(0.001,len-2*r),4,10),M4(0,-len/2,0)]]; if(knob){ parts.push([new T.SphereGeometry(r*knob,12,8),M4(0,-r*0.6,0,0,0,0,1.1,0.8,1)],[new T.SphereGeometry(r*knob*0.9,12,8),M4(0,-len+r*0.6,0,0,0,0,1.25,0.8,0.9)]); } return parts; };
 const J=(name,par,x,y,z)=>{ const g=new T.Group(); g.name=name; g.position.set(x,y,z); par.add(g); return g; };
 const mesh=(par,geo,mat)=>{ const m=new T.Mesh(geo,mat); par.add(m); return m; };
 // Skelett-Hierarchie
 const B={}; B.root=J('root',SK,0,0,0); B.hips=J('hips',B.root,0,0.96,0); B.spine=J('spine',B.hips,0,0.06,0); B.chest=J('chest',B.spine,0,0.2,0); B.neck=J('neck',B.chest,0,0.26,-0.01); B.head=J('head',B.neck,0,0.1,0.01);
 // Schädel: verformte Kugel (Augenhöhlen, Nasenloch, Wangenknochen, flacher Gaumen) + Zahnreihe, getrennter Unterkiefer
 const skullGeo=(()=>{ const g=new T.SphereGeometry(1,96,72), p=g.attributes.position, n=V(0,0,0), col=new Float32Array(p.count*3);
   const socks=[V(-0.37,0.06,0.93).normalize(),V(0.37,0.06,0.93).normalize()], nose=V(0,-0.24,0.97).normalize();
   for(let i=0;i<p.count;i++){ n.set(p.getX(i),p.getY(i),p.getZ(i)).normalize(); let x=n.x*0.082, y=n.y*0.092, z=n.z*0.1; const L=sstep(-0.05,-0.85,n.y), F=sstep(0.15,0.75,n.z);
    x*=1-0.3*L*(0.4+0.6*F); z*=1-0.1*L; if(n.z<0) y*=1-0.18*L; z+=0.008*F*L; y-=0.006*L*F;
    let dark=0; socks.forEach(s=>{ const d=n.distanceTo(s); const k=sstep(0.36,0.12,d); x-=n.x*0.034*k; y-=n.y*0.034*k; z-=n.z*0.045*k; dark=Math.max(dark,sstep(0.31,0.19,d)); });
    { const dx=(n.x)*1.7, dy=n.y-nose.y, dz=n.z-nose.z, d=Math.sqrt(dx*dx+dy*dy*(dy>0?2.2:1)+dz*dz); const k=sstep(0.19,0.05,d); z-=0.026*k; dark=Math.max(dark,sstep(0.16,0.09,d)); }
    [V(-0.66,-0.3,0.7).normalize(),V(0.66,-0.3,0.7).normalize()].forEach(c=>{ const k=Math.exp(-n.distanceToSquared(c)/0.03); x+=n.x*0.008*k; z+=n.z*0.006*k; });
    if(n.z>0.15&&y<-0.054){ y=-0.054+(y+0.054)*0.08; dark=Math.max(dark,0.85); }
    p.setXYZ(i,x,y,z); const b=1-0.97*dark, ao=0.82+0.18*sstep(-0.6,0.6,n.y); col[i*3]=b*ao; col[i*3+1]=b*ao*0.97; col[i*3+2]=b*ao*0.92; }
   g.setAttribute('color',new T.BufferAttribute(col,3)); g.computeVertexNormals(); return g; })();
 const skullTmp=new T.Mesh(skullGeo); const rc=new T.Raycaster();
 const teeth=[]; for(let i=0;i<12;i++){ const tx=-0.046+i*0.0084; rc.set(V(tx,-0.047,0.3),V(0,0,-1)); const hit=rc.intersectObject(skullTmp)[0]; const tz=hit?hit.point.z:0.07; teeth.push([tx,tz]); }
 const toothParts=(yTop,dir)=>teeth.map(([tx,tz],i)=>{ const w=0.0078*(i===0||i===11?0.8:1), hh=0.0135*(i>3&&i<8?1:0.86); return [rbox(w,hh,0.009,0.0025,2),M4(tx,yTop+dir*hh/2,tz-0.002,0,Math.atan2(-tx,0.06)*0.9,0),0xf2e8cc]; });
 const skull=mesh(B.head,mg([[skullGeo,null],...toothParts(-0.047,-1)]),boneM);
 const mouth=mesh(B.head,new T.SphereGeometry(0.05,16,10),darkM); mouth.scale.set(0.95,0.42,0.9); mouth.position.set(0,-0.068,0.02);
 B.jaw=J('jaw',B.head,0,-0.045,-0.006);
 { const pts=[V(-0.062,0.0,-0.004),V(-0.06,-0.03,0.012)]; teeth.forEach(([tx,tz],i)=>{ if(i%2===0||i===11) pts.push(V(tx,-0.033,tz)); }); pts.push(V(0.06,-0.03,0.012),V(0.062,0.0,-0.004));
   const cur=new T.CatmullRomCurve3(pts); const tube=new T.TubeGeometry(cur,48,0.0085,8,false); const pp=tube.attributes.position; for(let i=0;i<pp.count;i++){ if(pp.getY(i)<-0.02) pp.setY(i,-0.02+(pp.getY(i)+0.02)*1.35); } tube.computeVertexNormals();
   const chin=new T.SphereGeometry(0.016,14,10); const knobs=[-1,1].map(s=>[new T.SphereGeometry(0.008,10,8),M4(s*0.062,0.002,-0.004)]);
   const jt=toothParts(-0.0612,-1).map(([g,m,c])=>[g,new T.Matrix4().makeTranslation(0,0.045,0.006).multiply(m),c]);
   mesh(B.jaw,mg([[tube,null,0xe0d0ac],[chin,M4(0,-0.05,teeth[6][1]-0.012,0,0,0,1.5,0.8,0.8),0xd8c8a4],...knobs.map(k=>[k[0],k[1],0xd0c0a0]),...jt]),boneM); }
 // Wirbelsäule (Hals + Lende), Brustkorb mit Rippen, Brustbein, Schlüsselbeine, Becken
 { const v=[]; for(let i=0;i<5;i++) v.push([new T.CylinderGeometry(0.014,0.016,0.016,10),M4(0,0.02+i*0.021,-0.012),0xd4c4a0],[new T.BoxGeometry(0.008,0.01,0.02),M4(0,0.02+i*0.021,-0.03),0xc8b894]); mesh(B.neck,mg(v),boneM); }
 { const v=[]; for(let i=0;i<5;i++) v.push([new T.CylinderGeometry(0.02,0.022,0.026,12),M4(0,0.0+i*0.04,-0.045+Math.sin(i*0.6)*0.006),0xd4c4a0],[new T.BoxGeometry(0.012,0.016,0.03),M4(0,0.0+i*0.04,-0.072),0xc4b490],[new T.BoxGeometry(0.06,0.01,0.012),M4(0,0.0+i*0.04,-0.05),0xc8b894]); mesh(B.spine,mg(v),boneM); }
 { const parts=[]; for(let i=0;i<8;i++){ const y=0.21-i*0.028, W=[0.075,0.1,0.115,0.125,0.13,0.128,0.12,0.11][i], D=[0.06,0.075,0.085,0.09,0.092,0.09,0.085,0.08][i], drop=0.02+i*0.006;
     [-1,1].forEach(s=>{ const pts=[]; for(let k=0;k<=8;k++){ const a=-Math.PI/2+k/8*(Math.PI*(i<7?0.92:0.8)); pts.push(V(s*Math.cos(a)*W,y-(Math.sin(a)+1)/2*drop,-0.035+Math.sin(a)*D*0.92+ (Math.sin(a)>0?0.004:0))); }
       if(i<7) pts.push(V(s*0.022,y-drop-0.012+(i>4?0.02:0),0.062)); parts.push([new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,0.0068-(i>5?0.001:0),6,false),null,0xdccba6]); }); }
   for(let i=0;i<7;i++) parts.push([new T.CylinderGeometry(0.019,0.02,0.024,12),M4(0,0.22-i*0.032,-0.05),0xd0c09c],[new T.BoxGeometry(0.01,0.018,0.03),M4(0,0.22-i*0.032,-0.078),0xc4b490]);
   parts.push([new T.CapsuleGeometry(0.012,0.12,4,10),M4(0,0.15,0.068,0,0,0,1.3,1,0.45),0xe2d2ae]);
   [-1,1].forEach(s=>parts.push([new T.TubeGeometry(new T.CatmullRomCurve3([V(s*0.012,0.235,0.055),V(s*0.08,0.25,0.035),V(s*0.155,0.245,-0.005)]),12,0.007,6,false),null,0xdccba6]));
   [-1,1].forEach(s=>parts.push([new T.SphereGeometry(0.055,14,10),M4(s*0.09,0.17,-0.075,0,0,0,0.9,1.3,0.25),0xc8b894]));
   mesh(B.chest,mg(parts),boneM); }
 { const pv=[]; [-1,1].forEach(s=>{ pv.push([new T.SphereGeometry(0.075,16,12,0,Math.PI*1.2,0.6,1.6),M4(s*0.07,-0.02,-0.01,0,s>0?-0.3:Math.PI-0.9+0.3,s*0.3,0.8,0.75,0.6),0xd0c09c]); pv.push([new T.SphereGeometry(0.03,10,8),M4(s*0.09,-0.06,0.0),0xd8c8a4]); });
   pv.push([new T.CapsuleGeometry(0.02,0.04,4,10),M4(0,-0.03,-0.06,0.2,0,0,1.6,1,0.7),0xd0c09c]); mesh(B.hips,mg(pv),boneM); }
 // Arme (R = Geste, L = Sense)  ·  Beine
 const arm=(s)=>{ const sh=J('sh'+s,B.chest,s*0.165,0.235,-0.01), up=J('ua'+s,sh,0,0,0); mesh(up,mg(boneCap(0.28,0.016,1.7).map(([g,m])=>[g,m,0xdccba6])),boneM);
  const el=J('fa'+s,up,0,-0.28,0); mesh(el,mg([...boneCap(0.25,0.009,1.8).map(([g,m])=>[g,new T.Matrix4().makeTranslation(0.01,0,0).multiply(m),0xd8c8a2]),...boneCap(0.245,0.008,1.5).map(([g,m])=>[g,new T.Matrix4().makeTranslation(-0.012,0,0.004).multiply(m),0xd0c09c])]),boneM);
  const hd=J('hd'+s,el,0,-0.255,0); return {sh,up,el,hd}; };
 const hand=(par,s,grip)=>{ const parts=[[new T.SphereGeometry(0.022,12,10),M4(0,-0.012,0,0,0,0,1.15,0.7,0.6),0xd4c4a0]]; const fingers=[[-0.018,0.045,0.95],[-0.006,0.052,1],[0.006,0.05,1],[0.017,0.042,0.9]];
  fingers.forEach(([fx,fl,k],i)=>{ let m=M4(fx*1.3,-0.03,0,0,0,(grip?0:(i-1.5)*0.16)*s); const seg=[fl*0.45,fl*0.32,fl*0.25]; parts.push([new T.CapsuleGeometry(0.0045,0.03,3,6),new T.Matrix4().multiplyMatrices(M4(fx,-0.012,0),M4(0,-0.02,0)),0xdccba6]);
   seg.forEach((L,j)=>{ const curl=grip?[1.3,1.4,1.0][j]:[0.15,0.35,0.3][j]+(i===3?0.2:0); m=m.clone().multiply(M4(0,0,0,curl,0,0)); parts.push([new T.CapsuleGeometry(0.0042-j*0.0006,L,3,6),m.clone().multiply(M4(0,-L/2,0)),0xe0d0ac]); parts.push([new T.SphereGeometry(0.0055-j*0.0007,8,6),m.clone(),0xd0c09c]); m=m.clone().multiply(M4(0,-L,0)); }); });
  { let m=M4(-s*0.02,-0.008,0.012,0.5,0,-s*(grip?0.9:1.25)); [0.03,0.025,0.02].forEach((L,j)=>{ m=m.clone().multiply(M4(0,0,0,grip?0.9:0.15,0,0)); parts.push([new T.CapsuleGeometry(0.0048,L,3,6),m.clone().multiply(M4(0,-L/2,0)),0xe0d0ac]); m=m.clone().multiply(M4(0,-L,0)); }); }
  return mesh(par,mg(parts),boneM); };
 const AR=arm(-1), AL=arm(1); hand(AR.hd,-1,false); hand(AL.hd,1,true);
 const leg=(s)=>{ const th=J('th'+s,B.hips,s*0.09,-0.07,0); mesh(th,mg(boneCap(0.44,0.019,1.6).map(([g,m])=>[g,m,0xd8c8a2])),boneM); const sh=J('sn'+s,th,0,-0.44,0);
  mesh(sh,mg([...boneCap(0.41,0.015,1.6).map(([g,m])=>[g,m,0xd8c8a2]),...boneCap(0.4,0.008,1.2).map(([g,m])=>[g,new T.Matrix4().makeTranslation(s*0.022,0,-0.004).multiply(m),0xccbc98]),[new T.SphereGeometry(0.02,10,8),M4(0,0.0,0.022,0,0,0,1,1,0.5),0xe0d0ac]]),boneM);
  const ft=J('ft'+s,sh,0,-0.42,0); const fp=[[new T.SphereGeometry(0.026,12,8),M4(0,-0.01,-0.012,0,0,0,1,0.8,1.3),0xd4c4a0]]; for(let k=0;k<5;k++){ const fx=(k-2)*0.012*s*-1; fp.push([new T.CapsuleGeometry(0.0055,0.06,3,6),M4(fx*1.1,-0.028,0.04,Math.PI/2-0.25,0,0),0xdccba6],[new T.CapsuleGeometry(0.005,0.02,3,6),M4(fx*1.25,-0.036,0.092,Math.PI/2-0.05,0,0),0xe0d0ac]); }
  mesh(ft,mg(fp),boneM); return {th,sh,ft}; };
 const LR=leg(-1), LL=leg(1);
 // Zylinder (Krempe leicht hochgebogen, Band, abgewetzte Kanten)
 B.hat=J('hat',B.head,0.008,0.075,-0.008); B.hat.rotation.set(-0.12,0,-0.16);
 { const felt=cv(256,256,(x,w,h)=>{ x.fillStyle='#16130f'; x.fillRect(0,0,w,h); noise(x,w,h,6000,'70,62,52',0.22,2); noise(x,w,h,1500,'0,0,0',0.4,3); for(let i=0;i<12;i++){ x.fillStyle='rgba(90,80,66,0.12)'; x.fillRect(0,rnd()*h,w,1+rnd()*3); } });
   const hm=fill(new T.MeshStandardMaterial({map:felt,vertexColors:true,roughness:0.8,metalness:0.05,envMap:env,envMapIntensity:0.3}),0x504858,0x100c10,0.12);
   const crown=new T.LatheGeometry([[0.0,0.0],[0.098,0.0],[0.099,0.05],[0.097,0.12],[0.101,0.185],[0.104,0.2],[0.09,0.204],[0,0.205]].map(([r,y])=>new T.Vector2(r,y)),40);
   const brim=new T.LatheGeometry([[0.098,0.004],[0.14,0.0],[0.17,0.004],[0.185,0.016],[0.19,0.024],[0.186,0.026],[0.168,0.012],[0.14,0.008],[0.098,0.012]].map(([r,y])=>new T.Vector2(r,y)),48);
   { const p=brim.attributes.position; for(let i=0;i<p.count;i++){ const a=Math.atan2(p.getZ(i),p.getX(i)), r=Math.hypot(p.getX(i),p.getZ(i)); p.setY(i,p.getY(i)+Math.pow(Math.abs(Math.cos(a)),2)*0.022*sstep(0.12,0.19,r)); } brim.computeVertexNormals(); }
   const band=new T.CylinderGeometry(0.1015,0.1005,0.034,40,1,true);
   const hg=mg([[crown,M4(0,0.002,0),0xffffff],[brim,null,0xd8d0c8],[band,M4(0,0.03,0),0x5a4a48]]); const c=hg.attributes.color, p=hg.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i); if(y>0.19){ c.setXYZ(i,c.getX(i)*1.5,c.getY(i)*1.45,c.getZ(i)*1.4); } }
   mesh(B.hat,hg,hm); }
 // Kutte: Kapuze (am Hals), Umhang (Brust → Boden, vorn offen), Rock aus Fetzen-Streifen (Hüfte), Ärmel
 { const hood=new T.SphereGeometry(0.145,28,18,Math.PI*0.5+0.75,Math.PI*2-1.5,0.6,1.75); const p=hood.attributes.position; for(let i=0;i<p.count;i++){ let y=p.getY(i); const x=p.getX(i), z=p.getZ(i); if(y<0){ const k=-y/0.145; p.setXYZ(i,x*(1+0.7*k),y*1.9,z*(1+0.5*k)-0.02*k); } } hood.computeVertexNormals();
   const uv=hood.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,(1+0.03+uv.getX(i)*0.94)/4,uv.getY(i)*0.85+0.15); const hm=mesh(B.neck,hood,clothM); hm.position.set(0,0.13,-0.025); hm.scale.set(1.05,1.12,1.1); }
 const cape=(()=>{ let g=new T.CylinderGeometry(0.2,0.52,1.38,27,10,true,0.62,Math.PI*2-1.24); g.translate(0,-0.45,-0.02); g=tileUV(g,2,3); g.computeVertexNormals(); const m=mesh(B.chest,g,clothM); m.userData.p0=Float32Array.from(g.attributes.position.array); return m; })();
 const skirt=(()=>{ const parts=[], N=13; for(let L=0;L<2;L++) for(let i=0;i<N;i++){ const a=(i+L*0.5)/N*Math.PI*2, hgt=L?0.8:0.93, w=L?0.19:0.22; const g=new T.PlaneGeometry(w,hgt,1,7); g.translate(0,-hgt/2,0); stripUV(g,(i+L*2)%4); parts.push([g,M4(Math.sin(a)*(0.18+L*0.014),0.05,Math.cos(a)*(0.18+L*0.014),0,a,0)]); }
   const g=mg(parts); const m=mesh(B.hips,g,clothM); m.userData.p0=Float32Array.from(g.attributes.position.array); return m; })();
 const sleeve=(par,len,r0,r1,v,rot)=>{ let g=new T.CylinderGeometry(r0,r1,len,16,4,true); g.translate(0,-len/2,0); g=tileUV(g,v,2); g.computeVertexNormals(); const m=mesh(par,g,clothM); if(rot) m.rotation.set(...rot); return m; };
 sleeve(AR.up,0.26,0.05,0.08,1); sleeve(AL.up,0.26,0.05,0.075,0);
 { const lm=fill(new T.MeshStandardMaterial({color:0x0b0a09,roughness:1,side:T.DoubleSide}),0x302838,0x080606,0.08); let lg=new T.CylinderGeometry(0.17,0.44,0.9,24,3,true); lg.translate(0,-0.47,0); lg=tileUV(lg,3,3); lg.computeVertexNormals(); mesh(B.hips,lg,clothM); lm.dispose(); } /* Unterrock: Oberschenkel nie sichtbar */
 { let sm=new T.CylinderGeometry(0.11,0.2,0.2,20,2,true,0.5,Math.PI*2-1.0); sm.translate(0,0.17,-0.02); sm=tileUV(sm,1,2); sm.computeVertexNormals(); mesh(B.chest,sm,clothM); }
 // hängende Ärmelfetzen: bleiben pro Bild senkrecht (Schwerkraft), wie die Fledermaus-Ärmel in E2b
 const drapes=[]; const drape=(par,y0,y1,len,v,side)=>{ const g=new T.PlaneGeometry(1,1,4,6); stripUV(g,v); const m=mesh(par,g,clothM); m.frustumCulled=false; m.userData={y0,y1,len,side}; drapes.push(m); return m; };
 drape(AR.up,-0.03,-0.27,0.3,0,1); drape(AR.el,-0.01,-0.24,0.42,1,1); drape(AR.el,-0.05,-0.22,0.32,2,-1); drape(AL.up,-0.03,-0.27,0.26,3,1); drape(AL.el,-0.02,-0.2,0.24,0,-1);
 const gv=V(0,0,0), mq=new T.Quaternion();
 const hang=(t)=>{ drapes.forEach((d,i)=>{ const {y0,y1,len,side}=d.userData; d.parent.getWorldQuaternion(mq); gv.set(0.05*Math.sin(t*2.1+i),-1,-0.18+0.08*Math.sin(t*1.7+i*2)).normalize().applyQuaternion(mq.invert());
   const p=d.geometry.attributes.position; for(let k=0;k<p.count;k++){ const u=p.getX(k)+0.5, v=0.5-p.getY(k); const yy=y0+(y1-y0)*u, L=len*v*(0.75+0.35*u), bow=Math.sin(Math.PI*u)*0.025*v;
     p.setXYZ(k,gv.x*L+side*0.012+bow*side,yy+gv.y*L,gv.z*L+0.01); } p.needsUpdate=true; d.geometry.computeVertexNormals(); }); };
 // Sense: Stiel (Holz, leicht geschwungen) + Griffe, Blatt mit heller Schneide
 const SC=new T.Group(); SC.name='scythe'; AL.hd.add(SC);
 { const wood=cv(64,512,(x,w,h)=>{ x.fillStyle='#3a2a1c'; x.fillRect(0,0,w,h); for(let i=0;i<60;i++){ x.fillStyle=`rgba(${rnd()<0.5?'20,12,6':'90,66,40'},0.4)`; x.fillRect(rnd()*w,0,1+rnd()*2,h); } noise(x,w,h,800,'10,6,2',0.4,3); }); wood.wrapS=wood.wrapT=T.RepeatWrapping;
   const wm=fill(new T.MeshStandardMaterial({map:wood,roughness:0.7,metalness:0}),0x504860,0x100c10,0.12);
   const pts=[V(0,-0.98,0),V(0.01,-0.5,0.01),V(0,0,0),V(-0.012,0.4,-0.005),V(-0.02,0.76,0)]; SC.userData.top=pts[4];
   const sn=mg([[new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,0.0145,10,false),null,0xffffff],[new T.CylinderGeometry(0.012,0.012,0.12,8),M4(0.06,0.25,0,0,0,Math.PI/2),0xbbbbbb],[new T.CylinderGeometry(0.024,0.022,0.06,12),M4(-0.02,0.74,0),0x666666]]);
   mesh(SC,sn,wm);
   const sh=new T.Shape(); const U=26, Lb=0.62; const sp=u=>[-u*Lb, 0.03+0.07*Math.sin(Math.PI*u*0.85)-0.16*u*u], wd=u=>0.085*Math.pow(1-u,0.75)+0.002;
   sh.moveTo(0.015,sp(0)[1]); for(let k=0;k<=U;k++){ const u=k/U, [x,y]=sp(u); sh.lineTo(x,y); } for(let k=U;k>=0;k--){ const u=k/U, [x,y]=sp(u); sh.lineTo(x+0.01*u,y-wd(u)); } sh.lineTo(0.015,sp(0)[1]-wd(0));
   const bg=ni(new T.ExtrudeGeometry(sh,{depth:0.004,bevelEnabled:true,bevelThickness:0.0015,bevelSize:0.0015,bevelSegments:1,curveSegments:4})); bg.translate(0,0,-0.002); const bp=bg.attributes.position, bc=new Float32Array(bp.count*3);
   for(let i=0;i<bp.count;i++){ const x=bp.getX(i), y=bp.getY(i), u=Math.max(0,Math.min(1,-x/Lb)), top=sp(u)[1], t=(top-y)/wd(u); const k=0.28+0.75*sstep(0.6,0.98,t); bc[i*3]=k; bc[i*3+1]=k*0.98; bc[i*3+2]=k*0.95; } bg.setAttribute('color',new T.BufferAttribute(bc,3));
   const blM=fill(new T.MeshStandardMaterial({color:0x8a8a90,vertexColors:true,roughness:0.38,metalness:0.92,envMap:env,envMapIntensity:1.2}),0x605870,0x100c10,0.15);
   const bl=mesh(SC,bg,blM); bl.position.copy(pts[4]).add(V(0,-0.035,0)); bl.rotation.set(0,0.25,-0.18); }
 // ---- Theaterspot am Galeriegeländer: SpotLight + sichtbarer Kegel + Staub + Lichtpfütze ----
 const tgt=V(P.skel.x+0.08,0.95,P.skel.z+0.05); const spPos=V(P.spot.x,P.spot.y,P.spot.z);
 const spot=new T.SpotLight(0xffd29a,46,8.5,0.205,0.55,1.5); spot.position.copy(spPos); spot.target.position.copy(tgt); R.add(spot); R.add(spot.target);
 { const fx=new T.Group(); fx.position.copy(spPos); fx.lookAt(tgt); R.add(fx); const fm=fill(new T.MeshStandardMaterial({color:0x151417,roughness:0.5,metalness:0.7,envMap:env}),0x505060,0x101010,0.25);
   const can=new T.Mesh(new T.CylinderGeometry(0.085,0.1,0.3,24,1,false),fm); can.rotation.x=Math.PI/2; can.position.z=-0.05; fx.add(can);
   [[0,1],[0,-1],[1,0],[-1,0]].forEach(([a,b])=>{ const d=new T.Mesh(new T.BoxGeometry(a?0.012:0.19,a?0.19:0.012,0.1),fm); d.position.set(a*0.105,b*0.105,0.14); d.rotation.set(-b*0.5,a*0.5,0); fx.add(d); });
   const lens=new T.Mesh(new T.CircleGeometry(0.08,24),new T.MeshBasicMaterial({color:0xffe0b0,toneMapped:false})); lens.position.z=0.101; fx.add(lens);
   const yoke=new T.Mesh(new T.TorusGeometry(0.12,0.008,6,20,Math.PI),fm); yoke.rotation.set(0,Math.PI/2,Math.PI); fx.add(yoke);
   const clamp=new T.Mesh(new T.BoxGeometry(0.05,0.12,0.05),fm); clamp.position.copy(spPos).add(V(0,-0.16,0)); R.add(clamp); }
 const dir=tgt.clone().sub(spPos).normalize(); const Lc=(spPos.y-0.0)/(-dir.y)+0.3, rC=Lc*Math.tan(0.205)*0.95;
 const coneM=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,uniforms:{uC:{value:new T.Color(0xffc882)},uO:{value:0.34},uL:{value:Lc}},
  vertexShader:'varying vec3 vN; varying vec3 vV; varying float vH; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vV=-mv.xyz; vN=normalMatrix*normal; vH=uv.y; gl_Position=projectionMatrix*mv; }',
  fragmentShader:'uniform vec3 uC; uniform float uO; uniform float uL; varying vec3 vN; varying vec3 vV; varying float vH; void main(){ float e=abs(dot(normalize(vN),normalize(vV))); e=pow(e,2.2); float h=1.-vH; float f=smoothstep(0.,0.06,h)*(1.-0.62*h)*(1.-smoothstep(0.86,1.,h)); gl_FragColor=vec4(uC*e*f*uO,1.); }'});
 const coneMesh=(()=>{ const g=new T.CylinderGeometry(0.06,rC,Lc,40,1,true); g.translate(0,-Lc/2,0); const m=new T.Mesh(g,coneM); m.position.copy(spPos); m.quaternion.setFromUnitVectors(V(0,-1,0),dir); m.renderOrder=8; m.frustumCulled=false; R.add(m); return m; })();
 const dust=(()=>{ const N=170, a=new Float32Array(N*3), d=[]; for(let i=0;i<N;i++) d.push([rnd(),rnd()*6.28,Math.sqrt(rnd()),rnd()]); const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(a,3));
   const dt=cv(32,32,(x)=>{ const g=x.createRadialGradient(16,16,0,16,16,16); g.addColorStop(0,'rgba(255,240,210,1)'); g.addColorStop(1,'rgba(255,240,210,0)'); x.fillStyle=g; x.fillRect(0,0,32,32); });
   const m=new T.Points(g,new T.PointsMaterial({map:dt,color:0xb89870,size:0.018,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false})); m.frustumCulled=false; R.add(m); return {g,d,N,m}; })();
 const ax=V(1,0,0).cross(dir).normalize(), ay=dir.clone().cross(ax).normalize();
 let poolMesh, skelBlob; { const pool=cv(256,256,(x)=>{ const g=x.createRadialGradient(128,128,10,128,128,128); g.addColorStop(0,'rgba(255,210,150,0.5)'); g.addColorStop(0.65,'rgba(255,190,120,0.18)'); g.addColorStop(1,'rgba(255,190,120,0)'); x.fillStyle=g; x.fillRect(0,0,256,256); });
   const t=-spPos.y/dir.y, c=spPos.clone().addScaledVector(dir,t); poolMesh=new T.Mesh(new T.PlaneGeometry(2.3,2.0),new T.MeshBasicMaterial({map:pool,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0.45})); poolMesh.rotation.x=-Math.PI/2; poolMesh.position.set(c.x,0.006,c.z); R.add(poolMesh);
   skelBlob=new T.Mesh(new T.PlaneGeometry(0.9,0.8),blobM); skelBlob.rotation.x=-Math.PI/2; skelBlob.position.set(P.skel.x-0.12,0.008,P.skel.z-0.1); R.add(skelBlob); }

 // ---- Musik: Swing-Orgel + Summstimme (WebAudio, räumlich am Skelett) – oder Petes Track, falls als Datei vorhanden ----
 const BPM=116, BEAT=60/BPM, BARS=8, LOOP=BARS*4*BEAT;
 const MEL=[[[0,0.66,57,'a'],[0.66,0.34,60,'o'],[1,1,64,'a'],[2.66,0.34,63,'e'],[3,1,64,'a']],[[0,0.66,60,'o'],[0.66,0.34,59,'u'],[1,2,57,'a']],
  [[0,0.66,62,'a'],[0.66,0.34,65,'o'],[1,1,69,'a'],[2,0.66,67,'e'],[2.66,0.34,65,'o'],[3,1,62,'a']],[[0,2.4,65,'o'],[3,0.66,64,'u'],[3.66,0.34,62,'e']],
  [[0,0.66,59,'a'],[0.66,0.34,62,'o'],[1,1,68,'a'],[2,1,65,'e'],[3,1,64,'a']],[[0,0.66,62,'o'],[0.66,0.34,60,'u'],[1,2,59,'a']],
  [[0,0.66,64,'a'],[0.66,0.34,60,'o'],[1,0.66,57,'a'],[1.66,0.34,56,'e'],[2,1.8,57,'o']],[[2,0.66,52,'u'],[2.66,0.34,56,'o'],[3,0.9,59,'a']]];
 const NOTES=[]; MEL.forEach((bar,b)=>bar.forEach(([o,d,m,v])=>NOTES.push({t:(b*4+o)*BEAT,d:d*BEAT,m,v})));
 const CH=[[45,[57,60,64]],[45,[57,60,64]],[50,[57,62,65]],[50,[57,62,65]],[40,[56,59,62,64]],[40,[56,59,62,64]],[45,[57,60,64]],[40,[56,59,62]]];
 const BASS=[[0,4,7,8],[0,7,9,7],[0,3,7,10],[12,10,7,5],[0,4,7,10],[12,10,8,7],[0,3,7,4],[0,4,7,11]];
 const VOW={a:[[730,1],[1090,0.5],[2440,0.18]],o:[[570,1],[840,0.45],[2410,0.15]],u:[[300,1],[870,0.3],[2240,0.1]],e:[[530,1],[1840,0.4],[2480,0.16]]};
 const OPEN={a:1,o:0.72,e:0.6,u:0.38};
 const hz=m=>440*Math.pow(2,(m-69)/12);
 const MUS={on:false,t0:0,next:0,file:null,an:null,buf:null};
 const startMusic=()=>{ const ac=audio(); if(!ac||MUS.on) return; if(ac.state==='suspended') ac.resume(); MUS.on=true;
  const pn=ac.createPanner(); pn.panningModel='HRTF'; pn.distanceModel='inverse'; pn.refDistance=2.2; pn.rolloffFactor=1.35; pn.positionX.value=P.skel.x; pn.positionY.value=1.7; pn.positionZ.value=P.skel.z;
  const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=5200; const master=ac.createGain(); master.gain.value=0; master.gain.setTargetAtTime(0.55,ac.currentTime,1.5);
  const rev=ac.createConvolver(); { const n=ac.sampleRate*2.2, b=ac.createBuffer(2,n,ac.sampleRate); for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2); } rev.buffer=b; } const rg=ac.createGain(); rg.gain.value=0.28;
  master.connect(lp); lp.connect(pn); pn.connect(ac.destination); master.connect(rev); rev.connect(rg); rg.connect(pn); MUS.out=master; MUS.pn=pn; AU.sfx=AU.sfx||ac.destination;
  fetch('../assets/music/mind_the_cable.mp3',{method:'GET'}).then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer(); }).then(ab=>ac.decodeAudioData(ab)).then(buf=>{ MUS.file=buf; const s=ac.createBufferSource(); s.buffer=buf; s.loop=false; const an=ac.createAnalyser(); an.fftSize=1024; an.smoothingTimeConstant=0.5; s.connect(an); { const z=ac.createGain(); z.gain.value=0; an.connect(z); z.connect(ac.destination); } s.connect(master); s.onended=()=>{ showEnd(); }; s.start(); MUS.src=s; MUS.t0=ac.currentTime; MUS.an=an; MUS.fd=new Uint8Array(an.frequencyBinCount); MUS.pk=0.05; if(SHOW.t0) SHOW.tEnd=SHOW.t0+buf.duration; }).catch(()=>{ MUS.t0=ac.currentTime+0.15; MUS.li=0; MUS.ei=0; MUS.sched=setInterval(schedule,90); schedule(); if(SHOW.on&&SHOW.t0) SHOW.tEnd=SHOW.t0+LOOP*2; }); };
 const EVS=(()=>{ const evs=[]; NOTES.forEach(n=>evs.push(['v',n.t,n])); for(let b=0;b<BARS;b++){ for(let q=0;q<4;q++){ evs.push(['b',(b*4+q)*BEAT,CH[b][0]+BASS[b][q]]); if(q%2===1) evs.push(['c',(b*4+q)*BEAT,CH[b][1]]); evs.push(['h',(b*4+q)*BEAT,0.5],['h',(b*4+q+0.66)*BEAT,0.3]); } } return evs.sort((a,b)=>a[1]-b[1]); })();
 const schedule=()=>{ const ac=AU.ac; if(!ac||MUS.file) return; const ahead=ac.currentTime+0.35; MUS.li=MUS.li||0; MUS.ei=MUS.ei||0;
  for(let guard=0;guard<400;guard++){ const ev=EVS[MUS.ei], at=MUS.t0+MUS.li*LOOP+ev[1]; if(at>ahead) break; if(at>=ac.currentTime-0.02) play(ev,at,ac,MUS.out); MUS.ei++; if(MUS.ei>=EVS.length){ MUS.ei=0; MUS.li++; } } };
 const play=(ev,at,ac,out)=>{
  if(ev[0]==='v'){ const n=ev[2], f=hz(n.m), g=ac.createGain(); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(0.5,at+0.035); g.gain.setTargetAtTime(0.36,at+0.06,0.15); g.gain.setTargetAtTime(0,at+n.d-0.02,0.04);
   const o1=ac.createOscillator(), o2=ac.createOscillator(), vib=ac.createOscillator(), vg=ac.createGain(); o1.type='sawtooth'; o2.type='sawtooth'; o1.frequency.value=f; o2.frequency.value=f*1.004; vib.frequency.value=5.3; vg.gain.value=f*0.012; vib.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency);
   const mix=ac.createGain(); mix.gain.value=0.5; o1.connect(mix); o2.connect(mix); VOW[n.v].forEach(([fr,gn])=>{ const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=fr; bp.Q.value=fr<1000?7:11; const gg=ac.createGain(); gg.gain.value=gn*2.6; mix.connect(bp); bp.connect(gg); gg.connect(g); });
   g.connect(out); [o1,o2,vib].forEach(o=>{ o.start(at); o.stop(at+n.d+0.3); }); }
  else if(ev[0]==='b'){ const f=hz(ev[2]), o=ac.createOscillator(), o2=ac.createOscillator(), g=ac.createGain(); o.type='triangle'; o.frequency.value=f; o2.type='sine'; o2.frequency.value=f*2; g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(0.34,at+0.01); g.gain.setTargetAtTime(0,at+0.05,0.16); o.connect(g); o2.connect(g); g.connect(out); o.start(at); o2.start(at); o.stop(at+0.6); o2.stop(at+0.6); }
  else if(ev[0]==='c'){ const g=ac.createGain(); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(0.07,at+0.012); g.gain.setTargetAtTime(0,at+0.16,0.07); ev[2].forEach(m=>[1,2,3,4,6].forEach((h,k)=>{ const o=ac.createOscillator(); o.type='sine'; o.frequency.value=hz(m)*h*0.5*(k===4?1.0:1); const gg=ac.createGain(); gg.gain.value=[1,0.8,0.5,0.35,0.15][k]; o.connect(gg); gg.connect(g); o.start(at); o.stop(at+0.6); })); g.connect(out); }
  else if(ev[0]==='h'){ const n=ac.sampleRate*0.05|0, b=ac.createBuffer(1,n,ac.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,5); const s=ac.createBufferSource(); s.buffer=b; const hp=ac.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=7000; const g=ac.createGain(); g.gain.value=0.05*ev[2]; s.connect(hp); hp.connect(g); g.connect(out); s.start(at); } };
 const renderSong=async(sec,t0)=>{ const sr=44100, oc=new OfflineAudioContext(2,Math.ceil(sr*sec),sr); const m=oc.createGain(); m.gain.value=0.55; const rev=oc.createConvolver(); { const n=sr*2.2, b=oc.createBuffer(2,n,sr); for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2); } rev.buffer=b; } const rg=oc.createGain(); rg.gain.value=0.28; const lp=oc.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=5200; m.connect(lp); lp.connect(oc.destination); m.connect(rev); rev.connect(rg); rg.connect(oc.destination);
  for(let li=0;li*LOOP<sec+(t0||0)+1;li++) EVS.forEach(ev=>{ const at=li*LOOP+ev[1]-(t0||0); if(at>=0&&at<sec) play(ev,at,oc,m); }); const buf=await oc.startRendering(); return [buf.getChannelData(0),buf.getChannelData(1)]; };
 if(!MUTE){ const unlock=()=>{ const ac=audio(); if(ac&&ac.state==='suspended') ac.resume(); }; ['click','keydown','touchstart','pointerdown'].forEach(ev=>window.addEventListener(ev,unlock,{once:true,capture:true})); sc.addEventListener('enter-vr',unlock); }
 // ---- Gesang → Kiefer ----
 const jawAt=t=>{ const tl=((t%LOOP)+LOOP)%LOOP; let o=0.03; for(const n of NOTES){ if(tl<n.t-0.02) break; const dt=tl-n.t; if(dt<n.d+0.06){ const att=sstep(-0.02,0.05,dt), rel=1-sstep(n.d-0.05,n.d+0.06,dt), chew=0.82+0.18*Math.cos(dt*14); o=Math.max(o,OPEN[n.v]*att*rel*(dt<0.12?1:chew)); } } return o; };
 // ---- Stop-Motion-Tanz (12 Bilder/s, Posen aus Beat-Funktionen, leichtes „Boiling“ je Bild) ----
 const FPS=12; let lastF=-1; const sk0={t:-1};
 const lerp=(a,b,k)=>a+(b-a)*k;
 const pose=(t)=>{ const bt=t/BEAT, bar=Math.floor(bt/4)%BARS, b=bt%4, ph=bt%1, beatN=Math.floor(bt);
  const bounce=Math.pow(Math.sin(Math.PI*ph),2), sway=Math.sin(Math.PI*bt), sec=(bar<2)?0:(bar<4)?1:(bar<6)?2:3;
  // Wurzel: kleine Schritte, Drehung zum Publikum, Spin in Takt 8
  let ry=0.28*Math.sin(Math.PI*bt/2); if(sec===1) ry+=0.35*Math.sin(Math.PI*bt/4); if(bar===7&&b<2) ry+=Math.PI*2*sstep(0,2,b); B.root.rotation.y=ry; B.root.position.x=0.085*sway; B.root.position.z=0.02*Math.sin(Math.PI*bt/2);
  const hipH=0.96-0.065*bounce-(sec===3&&bar===7&&b>2.5?0.12*sstep(2.5,3.2,b):0); B.hips.position.y=hipH; B.hips.position.z=-0.05*bounce; B.hips.rotation.z=-0.15*sway; B.hips.rotation.y=0.16*sway; B.hips.rotation.x=0.02;
  B.spine.rotation.z=0.17*sway; B.spine.rotation.y=-0.14*sway; B.spine.rotation.x=0.08+0.06*bounce; B.chest.rotation.z=0.06*sway; B.chest.rotation.x=0.04+(bar===7&&b>2.5?0.5*sstep(2.5,3.3,b):0);
  B.neck.rotation.z=0.1*Math.sin(Math.PI*bt+0.6); B.head.rotation.z=0.26*Math.sin(Math.PI*bt+0.9); B.head.rotation.x=-0.14+0.16*bounce; B.head.rotation.y=0.2*Math.sin(Math.PI*bt/2);
  // Beine: Schritt-Tipp im Wechsel (das entlastete Bein knickt und hebt)
  const legIK=(lg,s,lift)=>{ const h=Math.max(0.6,(hipH-0.07-0.05-lift)), a=Math.acos(Math.min(1,h/0.86)); lg.th.rotation.x=-a-lift*0.7; lg.sh.rotation.x=2*a+lift*1.5; lg.ft.rotation.x=-a-lift*0.8; lg.th.rotation.z=s*0.03; };
  const up=Math.max(0,Math.sin(Math.PI*bt))*0.07, upL=Math.max(0,-Math.sin(Math.PI*bt))*0.07; legIK(LR,-1,up); legIK(LL,1,upL);
  // Gestenarm (R, -x): A = ausgestreckt + Hand schwenkt, B = Hand an die Brust → weit raus, C = hoch winken, D = Verbeugung
  let rz,rx,re,ry2; if(sec===0){ rz=-1.1-0.25*bounce; rx=-0.35+0.2*Math.sin(Math.PI*bt); re=-0.3-0.8*Math.max(0,Math.sin(Math.PI*bt)); ry2=0.3; }
  else if(sec===1){ const k=sstep(0,1.5,b)*(1-sstep(2.5,4,b)); rz=lerp(-0.4,-1.3,1-k); rx=lerp(-1.1,-0.3,1-k); re=lerp(-1.9,-0.25,1-k); ry2=lerp(-0.4,0.4,1-k); }
  else if(sec===2){ rz=-2.5-0.15*Math.sin(Math.PI*bt*2); rx=-0.2; re=-0.5-0.5*Math.abs(Math.sin(Math.PI*bt)); ry2=0.6; }
  else { if(bar===6){ rz=-1.0-0.4*bounce; rx=-0.6; re=-0.8; ry2=0.2; } else { const k=sstep(2.4,3.3,b); rz=lerp(-1.2,-0.5,k); rx=lerp(-0.4,-1.2,k); re=lerp(-0.5,-0.9,k); ry2=0.2; } }
  AR.up.rotation.set(rx,ry2,rz); AR.el.rotation.set(re,0,0.1); AR.hd.rotation.set(-0.3+0.25*Math.sin(Math.PI*bt*2),0,-0.5);
  // Sensenarm (L, +x): Sense wie ein Spazierstock auf 1 und 3 hochpumpen
  const pump=Math.pow(Math.max(0,Math.sin(Math.PI*bt/2)),3); let lz=0.42+0.08*bounce, lx=-0.55-0.25*pump, le=-1.25+0.25*pump; if(sec===2){ lx=-0.9-0.4*pump; le=-1.0; lz=0.55; } if(bar===7&&b>2.4){ const k=sstep(2.4,3.3,b); lx=lerp(lx,-1.3,k); lz=lerp(lz,0.3,k); }
  AL.up.rotation.set(lx,-0.2,lz); AL.el.rotation.set(le,0,-0.1); AL.hd.rotation.set(0,0,0.15);
  // Hut hüpft auf Akzente (Takt 4 und 8, Schlag 3)
  const hp=((bar===3||bar===7)&&b>=2&&b<3)?Math.sin(Math.PI*(b-2)):0; B.hat.position.y=0.075+0.05*hp; B.hat.rotation.z=-0.16+0.3*hp; B.hat.rotation.x=-0.12-0.15*hp;
  return {sway,bounce,ry,spin:bar===7&&b<2}; };
 const qv=new T.Quaternion(), qh=new T.Quaternion(), qr=new T.Quaternion();
 const fixScythe=(t)=>{ SK.updateMatrixWorld(true); AL.hd.getWorldQuaternion(qh); B.root.getWorldQuaternion(qr); const tilt=new T.Quaternion().setFromEuler(new T.Euler(0.12+0.1*Math.sin(Math.PI*t/BEAT/2),0,-0.08+0.12*Math.sin(Math.PI*t/BEAT))); qv.copy(qh).invert().multiply(qr).multiply(tilt); SC.quaternion.copy(qv); SC.position.set(0.0,-0.035,0.012); hang(t); };
 const flare=(m,amt,ph)=>{ const p=m.geometry.attributes.position, p0=m.userData.p0; for(let i=0;i<p.count;i++){ const x=p0[i*3], y=p0[i*3+1], z=p0[i*3+2], k=Math.max(0,-y)/0.95, r=Math.hypot(x,z)+1e-5, a=Math.atan2(x,z); const out=(0.16*k+0.2*k*k+amt*k*k*(1+0.5*Math.sin(a*3+ph)))*(1+0.2*Math.cos(a-ph)); p.setXYZ(i,x+x/r*out,y+amt*0.05*k,z+z/r*out*0.9); } p.needsUpdate=true; m.geometry.computeVertexNormals(); };
 const capeFlare=(m,amt,ph)=>{ const p=m.geometry.attributes.position, p0=m.userData.p0; for(let i=0;i<p.count;i++){ const x=p0[i*3], y=p0[i*3+1], z=p0[i*3+2], k=Math.max(0,-(y+0.1))/1.3; p.setXYZ(i,x*(1+amt*k*0.6)+Math.sin(ph+y*4)*0.03*k,y,z-(0.02+amt*0.25)*k*k+0.015*Math.sin(ph*1.3+x*9)*k); } p.needsUpdate=true; m.geometry.computeVertexNormals(); };
 let boil=1; const bR=()=>{ boil=(boil*48271)%2147483647; return boil/2147483647-0.5; };
 const tick=(t)=>{ const f=Math.floor(t*FPS); if(f===lastF) return; lastF=f; const tq=f/FPS; const ps=pose(tq); boil=f*7919+13;
  [B.spine,B.chest,B.neck,B.head,AR.up,AR.el,AL.up,LR.th,LL.th].forEach(o=>{ o.rotation.x+=bR()*0.03; o.rotation.z+=bR()*0.03; }); B.root.position.x+=bR()*0.006;
  const prev=sk0.ps||ps; const vel=Math.abs(ps.sway-prev.sway)+Math.abs(ps.ry-prev.ry)*0.8; sk0.ps=ps; flare(skirt,0.05+vel*0.55+(ps.spin?0.18:0),tq*3); capeFlare(cape,0.08+vel*0.5+(ps.spin?0.25:0),tq*3);
  B.jaw.rotation.x=0.5*jaw(tq)+bR()*0.02; fixScythe(tq); };
 const jaw=(tq)=>{ if(MUS.an){ MUS.an.getByteFrequencyData(MUS.fd); const bin=AU.ac.sampleRate/MUS.an.fftSize; let e=0,n=0; for(let i=Math.floor(250/bin);i<Math.floor(3200/bin);i++){ e+=MUS.fd[i]; n++; } e/=n*255; MUS.pk=Math.max(e,MUS.pk*0.995); const k=Math.max(0,(e/MUS.pk-0.45)/0.55); return Math.min(1,k*1.1); } return jawAt(tq); };
 const songT=()=>{ if(window.__m84Now!=null) return window.__m84Now; if(MUS.on&&AU.ac&&!MUS.file) return AU.ac.currentTime-MUS.t0; if(MUS.file&&AU.ac) return AU.ac.currentTime-MUS.t0; return performance.now()/1000; };
 const SKL=['Ein Skelett mit Zylinder tanzt im Scheinwerferlicht und singt. Niemand hat es gebucht. Niemand traut sich, es abzusagen.','Kein Zwerchfell, keine Lunge, keine Stimmbänder – und trifft trotzdem jeden Ton. Im Gegensatz zu dir unter der Dusche.','Die Sense hält es wie einen Spazierstock. Das ist entweder Varieté oder eine Drohung mit Taktgefühl.',['Skelett','ICH BIN NICHT WEGEN DIR HIER. ICH BIN WEGEN DER AKUSTIK HIER.'],'Du klatschst nicht. Es tanzt trotzdem weiter. Profi.']; let skN=0;
 // ---- Blackout-Show wie OIIA-Katze: Idle → Kaugummi essen → alles schwarz, nur Skelett+Spot → Tanz+Song (Song-Dauer) → abrupt zurück ----
 const SHOW={on:0, t0:0, tEnd:0, hid:[], bg:null, fg:null};
 const clock=()=> window.__m84Now!=null ? window.__m84Now : performance.now()/1000;
 const stopMusic=()=>{ MUS.on=false; if(MUS.sched){ clearInterval(MUS.sched); MUS.sched=null; } try{ MUS.src&&MUS.src.stop(); }catch(e){} MUS.src=null; MUS.an=null; if(MUS.out) try{ MUS.out.gain.cancelScheduledValues&&MUS.out.gain.cancelScheduledValues(AU.ac?AU.ac.currentTime:0); MUS.out.gain.value=0; }catch(e){} };
 const idlePose=(t)=>{ const breath=0.012*Math.sin(t*1.55);
  B.root.rotation.set(0,0,0); B.root.position.set(0,0,0);
  B.hips.position.set(0,0.96+breath*0.45,0); B.hips.rotation.set(0.02,0,0.025*Math.sin(t*1.05));
  B.spine.rotation.set(0.05+breath,0,0.02*Math.sin(t*0.9)); B.chest.rotation.set(0.04,0,0);
  B.neck.rotation.set(0,0,0.035*Math.sin(t*1.25)); B.head.rotation.set(-0.1+breath,0.04*Math.sin(t*0.65),0);
  B.jaw.rotation.x=0.04+0.015*Math.sin(t*2.1); B.hat.position.y=0.075; B.hat.rotation.set(-0.12,0,-0.16);
  AR.up.rotation.set(-0.35,0.25,-0.95); AR.el.rotation.set(-0.45,0,0.1); AR.hd.rotation.set(-0.25,0,-0.45);
  AL.up.rotation.set(-0.55,-0.2,0.42); AL.el.rotation.set(-1.2,0,-0.1); AL.hd.rotation.set(0,0,0.15);
  LR.th.rotation.set(0.04,0,-0.03); LR.sh.rotation.set(0.06,0,0); LR.ft.rotation.set(-0.04,0,0);
  LL.th.rotation.set(0.04,0,0.03); LL.sh.rotation.set(0.06,0,0); LL.ft.rotation.set(-0.04,0,0);
  flare(skirt,0.035,t*0.7); capeFlare(cape,0.04,t*0.7); fixScythe(t); lastF=-1; };
 const showStart=()=>{ if(SHOW.on) return; SHOW.on=1; SHOW.t0=clock(); SHOW.tEnd=MUS.file?SHOW.t0+MUS.file.duration:SHOW.t0+1e9; lastF=-1;
  const keep=new Set([SK,coneMesh,dust.m,poolMesh,skelBlob]); const hitEl=document.getElementById('m84Skel'); if(hitEl&&hitEl.object3D) keep.add(hitEl.object3D); const cam=sc.camera; SHOW.hid=[];
  S.traverse(o=>{ if(!(o.isMesh||o.isPoints||o.isSprite||o.isLine)||!o.visible) return; let p=o; while(p){ if(keep.has(p)||p===cam||p.isCamera) return; p=p.parent; } o.visible=false; SHOW.hid.push(o); });
  SHOW.bg=S.background; S.background=new T.Color(0); SHOW.fg=S.fog; S.fog=null; startMusic(); };
 const showEnd=()=>{ if(!SHOW.on&&!SHOW.hid.length) return; (SHOW.hid||[]).forEach(o=>o.visible=true); SHOW.hid=[]; S.background=SHOW.bg||null; if(SHOW.fg) S.fog=SHOW.fg; SHOW.fg=null; SHOW.on=0; stopMusic(); idlePose(clock()); };
 const skHit=clickBox(1.0,2.2,0.9,V(P.skel.x,1.1,P.skel.z),P.skel.ry,()=>{ const l=SKL[skN++%SKL.length]; Array.isArray(l)?say(l[0],l[1]):say('Erzähler',l); }); skHit.id='m84Skel';
 if(Q.get('skelshow')==='1') setTimeout(()=>showStart(),1500);
 // ---- Kollision (Pete: 0,3–0,5 m Abstand um große Requisiten) ----
 const circ=[[P.candy.x,P.candy.z,0.38+0.42],[P.skel.x,P.skel.z,0.55+0.42],[3.7,-9.0,0.85],[-3.7,-14.5,0.85]], rect=[[-2.05-0.32,-0.55+0.32,-23.5,-15.45+0.32]];
 const collide=(x,z)=>{ for(const [cx,cz,r] of circ){ const dx=x-cx,dz=z-cz,d=Math.hypot(dx,dz); if(d<r){ if(d<1e-4) return [r,0]; return [dx/d*(r-d),dz/d*(r-d)]; } }
  for(const [x0,x1,z0,z1] of rect){ if(x>x0&&x<x1&&z>z0&&z<z1){ const c=[[x0-x,0],[x1-x,0],[0,z0-z],[0,z1-z]].sort((a,b)=>Math.abs(a[0]+a[1])-Math.abs(b[0]+b[1])); return c[0]; } } return null; };
 // Gang hinter dem Brunnen begehbar machen (bis kurz vor die Rolltreppe), sonst stünden die Requisiten unerreichbar im Dunst
 if(window.ERA&&ERA.world3d==='buildMall84'&&window.M84_WALK!==false&&ERA.bounds&&ERA.bounds[2]>-17.4) ERA.bounds=[ERA.bounds[0],ERA.bounds[1],-17.4,ERA.bounds[3]];
 const lp=V(0,0,0), lf=V(0,0,0), lq=new T.Quaternion();
 idlePose(0);
 const update=(ms)=>{ const t=songT(), now=clock();
  if(SHOW.on){ if(now>=SHOW.tEnd) showEnd(); else tick(t); }
  else idlePose(now);
  const ph=performance.now()/1000; { const p=dust.g.attributes.position; for(let i=0;i<dust.N;i++){ const [h,a,r,s]=dust.d[i]; const hh=((h+ (window.__m84Now!=null?window.__m84Now:ph)*0.012*(0.5+s))%1), L2=0.6+hh*(Lc-1.0), rr=r*L2*Math.tan(0.205)*0.85, aa=a+ph*0.05*(s-0.5); const q=spPos.clone().addScaledVector(dir,L2).addScaledVector(ax,Math.cos(aa)*rr).addScaledVector(ay,Math.sin(aa)*rr); p.setXYZ(i,q.x,q.y,q.z); } p.needsUpdate=true; }
  if(crankAnim.t0>0){ const k=(performance.now()-crankAnim.t0)/1200; crank.rotation.z=-Math.PI*2*Math.min(1,Math.max(0,k))*(1+0.03*Math.sin(k*40)); flap.rotation.x=k>1.05&&k<3.5?-0.9*Math.min(1,(k-1.05)*4):0; if(k>4) crankAnim.t0=-1; }
  if(AU.ac&&MUS.on){ const cam=sc.camera; if(cam){ cam.getWorldPosition(lp); cam.getWorldQuaternion(lq); lf.set(0,0,-1).applyQuaternion(lq); const Ls=AU.ac.listener; if(Ls.positionX){ Ls.positionX.value=lp.x; Ls.positionY.value=lp.y; Ls.positionZ.value=lp.z; Ls.forwardX.value=lf.x; Ls.forwardY.value=lf.y; Ls.forwardZ.value=lf.z; Ls.upX.value=0; Ls.upY.value=1; Ls.upZ.value=0; } else { Ls.setPosition(lp.x,lp.y,lp.z); Ls.setOrientation(lf.x,lf.y,lf.z,0,1,0); } } } };
 window.__m84p={R,SK,CM,B,AR,AL,LR,LL,skirt,spot,coneMesh,dust,poolMesh,MUS,CS,SHOW,startMusic,stopMusic,showStart,showEnd,useCandy,eatGum,pose,idlePose,jawAt,renderSong,P};
 return {update,collide,P};
}};
})();
