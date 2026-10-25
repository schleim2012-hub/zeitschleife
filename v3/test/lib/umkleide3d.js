/* Umkleide C&Ä u1 (Pete, 25.10.): private Testseite. Eine Kabine (Vorhang, Haken, Bank, Preisschilder, Parodie-Plakat) + Petes Figur stehend.
   u2: kein Spiegel, weiches Licht ohne Schatten-Maps. Keine Links in Spielszenen. VR-Boden y=0, nichts kopffest. */
(function(){
const T=()=>AFRAME.THREE;
function cvTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new (T().CanvasTexture)(c); t.colorSpace=T().SRGBColorSpace; t.anisotropy=8; return t; }
function noiseTex(base,amp,sz,lines){ return cvTex(sz,sz,(x,w,h)=>{ x.fillStyle=base; x.fillRect(0,0,w,h); const d=x.getImageData(0,0,w,h);
  for(let i=0;i<d.data.length;i+=4){ const n=(Math.random()-0.5)*amp; d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n; } x.putImageData(d,0,0);
  if(lines){ x.globalAlpha=0.08; for(let y=0;y<h;y+=lines){ x.fillStyle=y%(lines*2)?'#000':'#fff'; x.fillRect(0,y,w,1);} } }); }
AFRAME.registerComponent('umkleide',{ init(){
  const THREE=T(), sc=this.el.object3D, G=new THREE.Group(); sc.add(G);
  const M=(o)=>new THREE.MeshStandardMaterial(o), box=(w,h,d,m,x,y,z,g)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); b.position.set(x,y,z); (g||G).add(b); return b; };
  const W=2.4, D0=-1.25, D1=1.55, H=2.45, MZ=D0;                       // Kabine x ±1.2, Spiegelwand bei z=-1.25
  // Boden: Nadelfilz grau-beige, Wände: warmes Altweiß mit Paneelfugen, Decke dunkel
  const carpet=noiseTex('#6d6359',38,256); carpet.wrapS=carpet.wrapT=THREE.RepeatWrapping; carpet.repeat.set(5,6);
  box(W,0.02,D1-D0,M({map:carpet,roughness:0.95}),0,-0.01,(D0+D1)/2);
  const wallT=noiseTex('#d9cdb8',10,256,32); wallT.wrapS=wallT.wrapT=THREE.RepeatWrapping; wallT.repeat.set(2,1);
  const wall=M({map:wallT,roughness:0.8});
  box(0.04,H,D1-D0,wall,-W/2-0.02,H/2,(D0+D1)/2); box(0.04,H,D1-D0-0.9,wall,W/2+0.02,H/2,(D0+D1)/2-0.45);
  box(W,0.04,D1-D0,M({color:'#2a2420',roughness:0.9}),0,H+0.02,(D0+D1)/2);
  const wood=M({color:'#5a3a24',roughness:0.55,metalness:0.0}), brass=M({color:'#b08a4a',roughness:0.35,metalness:0.85});
  box(W,0.08,0.02,wood,0,0.04,D0+0.012); // Sockelleiste
  box(W,H,0.03,wall,0,H/2,D0);   // Rückwand (u2: Spiegel komplett entfernt – keine Spiegelflächen)
  box(0.9,0.006,0.02,brass,0,1.0,D0+0.02);   // Handlauf-Leiste
  // Bank mit Polster (links)
  box(0.42,0.04,1.0,wood,-0.95,0.44,0.15); for(const z of [-0.3,0.6]) box(0.38,0.42,0.04,wood,-0.95,0.21,z);
  box(0.40,0.06,0.96,M({color:'#7a1f2b',roughness:0.85}),-0.95,0.49,0.15);
  // Haken + Kleidung auf Bügeln (rechte Wand), Preisschilder
  const tag=(t1,t2)=>cvTex(128,200,(x,w,h)=>{ x.fillStyle='#f4efe2'; x.fillRect(0,0,w,h); x.fillStyle='#c4161c'; x.fillRect(0,0,w,46);
    x.fillStyle='#fff'; x.font='bold 34px sans-serif'; x.textAlign='center'; x.fillText('C&Ä',w/2,35); x.fillStyle='#222'; x.font='20px sans-serif'; x.fillText(t1,w/2,90);
    x.font='bold 36px sans-serif'; x.fillText(t2,w/2,150); x.font='14px monospace'; x.fillText('Gr. 38 · Art. 4711',w/2,185); });
  const clothes=[['#1f4e79','Bluse','29,95'],['#9c2f3a','Kleid','49,—'],['#d8c7a0','Rock','19,99']];
  clothes.forEach(([c,a,p],i)=>{ const z=-0.75+i*0.45, x=W/2-0.03;
    box(0.06,0.03,0.03,brass,x-0.03,1.72,z); const hz=new THREE.Mesh(new THREE.TorusGeometry(0.17,0.008,6,24,Math.PI),brass); hz.rotation.y=Math.PI/2; hz.position.set(x-0.07,1.56,z); G.add(hz);
    const cl=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.24,0.75,18,4,true,Math.PI*0.15,Math.PI*0.7),M({color:c,roughness:0.9,side:THREE.DoubleSide}));
    cl.rotation.y=Math.PI*1.5; cl.scale.set(1,1,0.35); cl.position.set(x-0.08,1.16,z); G.add(cl);
    const tg=new THREE.Mesh(new THREE.PlaneGeometry(0.05,0.078),M({map:tag(a,p),roughness:0.7,side:THREE.DoubleSide})); tg.position.set(x-0.17,0.84,z+0.1); tg.rotation.set(0,-Math.PI/2+0.25,0.12); G.add(tg); });
  // Parodie-Plakat (linke Wand über der Bank)
  const post=cvTex(512,720,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#13324f'); g.addColorStop(1,'#2a1622'); x.fillStyle=g; x.fillRect(0,0,w,h);
    x.fillStyle='#c4161c'; x.fillRect(40,40,w-80,150); x.fillStyle='#fff'; x.font='bold 120px Georgia,serif'; x.textAlign='center'; x.fillText('C&Ä',w/2,160);
    x.fillStyle='#f2e6c8'; x.font='italic 44px Georgia,serif'; x.fillText('Herbst-Kollektion',w/2,290); x.font='bold 64px sans-serif'; x.fillText("’87",w/2,370);
    x.font='28px sans-serif'; x.fillStyle='#e9b949'; x.fillText('Alles muss anprobiert werden.',w/2,470); x.fillStyle='#bbb'; x.font='20px sans-serif'; x.fillText('Cousins & Änkels · Mode für Ällé',w/2,640);
    x.strokeStyle='#e9b949'; x.lineWidth=3; x.strokeRect(20,20,w-40,h-40); });
  const pm=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.7),M({map:post,roughness:0.55})); pm.position.set(-W/2+0.005,1.45,0.15); pm.rotation.y=Math.PI/2; G.add(pm);
  box(0.02,0.74,0.54,M({color:'#1a1a1a',roughness:0.4,metalness:0.6}),-W/2+0.002,1.45,0.15);
  // Vorhang (rechte Öffnung + hinter dem Spieler): Samt-Falten, Messingstange
  const curtain=(len,x0,z0,ang)=>{ const g=new THREE.PlaneGeometry(len,2.2,96,8), p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const u=p.getX(i); p.setZ(i,0.045*Math.sin(u*34)+0.012*Math.sin(u*91)+(p.getY(i)<-1.0?0.01*Math.sin(u*13):0)); } g.computeVertexNormals();
    const c=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:'#5b1020',roughness:0.85,sheen:1,sheenColor:new THREE.Color('#d0607a'),sheenRoughness:0.5,side:THREE.DoubleSide}));
    c.position.set(x0,1.17,z0); c.rotation.y=ang; G.add(c); };
  curtain(0.9,W/2+0.02,D1-0.45,-Math.PI/2); curtain(1.6,-0.4,D1,Math.PI); box(0.025,0.025,0.9,brass,W/2,2.3,D1-0.45); box(W,0.025,0.025,brass,0,2.3,D1);
  // Licht u2: weich und warm, keine Schatten-Maps (Quest-günstig, keine harten Flecken): Decken-Leuchte als Key, Füllung von vorn, Hemisphäre
  const lamp=new THREE.Mesh(new THREE.CircleGeometry(0.16,24),M({emissive:'#ffe2bd',emissiveIntensity:2.2,color:'#000'})); lamp.rotation.x=Math.PI/2; lamp.position.set(0,H-0.01,-0.1); G.add(lamp);
  const key=new THREE.PointLight('#ffd6ac',3.2,6,1.2); key.position.set(0.1,H-0.15,0.1); sc.add(key);
  const fill=new THREE.PointLight('#ffc49a',1.6,6,1.2); fill.position.set(0.2,1.4,1.2); sc.add(fill);
  const side=new THREE.PointLight('#f0d8c8',0.8,4,1.4); side.position.set(-1.0,1.7,-0.6); sc.add(side);
  sc.add(new THREE.HemisphereLight('#e6d4c0','#3a2a20',0.75));
  const blob=new THREE.Mesh(new THREE.CircleGeometry(0.42,32),new THREE.MeshBasicMaterial({map:cvTex(128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,4,64,64,64);g.addColorStop(0,'rgba(0,0,0,0.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h);}),transparent:true,depthWrite:false}));
  blob.rotation.x=-Math.PI/2; blob.position.set(0,0.002,-0.55); G.add(blob);   // weicher Kontaktschatten unter den Füßen
  // Figur
  const loader=new THREE.GLTFLoader(), url=(window.UMK&&UMK.fig)||'../assets/umkleide/figur_stand_u2.glb?v=1';
  loader.load(url,(gl)=>{ const f=gl.scene; f.position.set(0,0,-0.55); f.rotation.y=0;
    f.traverse(o=>{ if(!o.isMesh) return; o.frustumCulled=false; const m0=o.material, nm=(m0.name||'');
      if(/^skin_/.test(nm)||o.name==='body'){ o.material=new THREE.MeshPhysicalMaterial({map:m0.map,normalMap:m0.normalMap,normalScale:new THREE.Vector2(0.18,0.18),color:'#ffffff',roughness:0.6,
          sheen:0.45,sheenColor:new THREE.Color('#ffd9c8'),sheenRoughness:0.8,vertexColors:!!o.geometry.attributes.color}); }
      else if(/^hair_/.test(nm)){ Object.assign(m0,{alphaTest:0,alphaToCoverage:false,transparent:false,depthWrite:true,side:THREE.DoubleSide,roughness:0.5});   /* depthWrite: GLTFLoader setzt bei BLEND false -> Körper übermalte das Haar */   /* u2: Haar deckend (Alpha-Strähnen verschwanden aus der Nähe) */
        { const P=o.geometry.attributes.position; for(let i=0;i<P.count;i++){ const x=P.getX(i),y=P.getY(i),z=P.getZ(i); if(false&&z>0.06&&y<1.63&&Math.abs(x)<0.075){ P.setY(i,1.63+(y-1.63)*0.12); P.setZ(i,z-0.01); } } P.needsUpdate=true; o.geometry.computeVertexNormals(); }   /* Pony aus den Augen */ if(o.geometry.attributes.color) m0.vertexColors=true; }
      else if(/eyelash|eyebrow/.test(o.name)){ Object.assign(m0,{alphaTest:0.4,transparent:false,side:THREE.DoubleSide}); }
      m0.needsUpdate=true; });
    G.add(f);
    window.__umk={ready:true,fig:f};
  },undefined,(e)=>{ console.error('Figur-GLB fehlt',e); });
}});
})();
