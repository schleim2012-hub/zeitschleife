// Röhrenfernseher (späte 80er): Holzdekor-Gehäuse, dunkle Kunststoff-Front, gewölbte Bildröhre mit Glas, Drehknöpfe, Lautsprechergitter,
// Zimmerantenne; steht auf einem Videorekorder (12:00 blinkt) und einem kleinen Holzschrank. makeCRT(T,{root}) → {group, setMap(tex), screenMesh}
window.makeCRT=function(T,o={}){ const ROOT=o.root||'', TL=new T.TextureLoader(); const G=new T.Group();
 const wood=new T.MeshStandardMaterial({color:0x8c7c68,roughness:0.62,metalness:0.0});
 const W=(m,rep)=>{ TL.load(ROOT+'assets/tex/ph/wood_table_001_diff.jpg',t=>{ t.colorSpace=T.SRGBColorSpace; t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep[0],rep[1]); m.map=t; m.needsUpdate=true; });
  TL.load(ROOT+'assets/tex/ph/wood_table_001_rough.jpg',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep[0],rep[1]); m.roughnessMap=t; m.needsUpdate=true; });
  TL.load(ROOT+'assets/tex/ph/wood_table_001_nor_gl.jpg',t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep[0],rep[1]); m.normalMap=t; m.normalScale.set(0.6,0.6); m.needsUpdate=true; }); return m; };
 W(wood,[1.2,0.8]); const wood2=W(new T.MeshStandardMaterial({color:0x6a5c4c,roughness:0.7}),[1.5,1]);
 const plast=new T.MeshStandardMaterial({color:0x181614,roughness:0.42,metalness:0.1}), plastD=new T.MeshStandardMaterial({color:0x121110,roughness:0.55});
 const silver=new T.MeshStandardMaterial({color:0x9a9890,roughness:0.32,metalness:0.85}), chrome=new T.MeshStandardMaterial({color:0xc8c8c8,roughness:0.2,metalness:1});
 const rr=(w,h,r)=>{ const s=new T.Shape(); s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2); s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r); s.lineTo(w/2,h/2-r); s.quadraticCurveTo(w/2,h/2,w/2-r,h/2); s.lineTo(-w/2+r,h/2); s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r); s.lineTo(-w/2,-h/2+r); s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2); return s; };
 const ext=(shape,d,bev,m)=>{ const g=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelSegments:3,curveSegments:10}); return new T.Mesh(g,m); };
 const add=(m,x,y,z,p)=>{ m.position.set(x,y,z); m.castShadow=m.receiveShadow=true; (p||G).add(m); return m; };
 // --- Schrank
 const cab=new T.Group(); G.add(cab); const cw=1.02, ch=0.5, cd=0.5;
 add(ext(rr(cw,ch,0.012),cd-0.02,0.01,wood2),0,ch/2+0.06,-cd/2+0.01,cab);
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>add(new T.Mesh(new T.CylinderGeometry(0.02,0.015,0.06,10),plastD),a*(cw/2-0.06),0.03,b*(cd/2-0.06),cab));
 const doorLine=new T.MeshStandardMaterial({color:0x1a120c,roughness:0.9}); add(new T.Mesh(new T.BoxGeometry(0.006,ch-0.08,0.004),doorLine),0,ch/2+0.06,cd/2+0.002,cab);
 [-0.06,0.06].forEach(x=>add(new T.Mesh(new T.CylinderGeometry(0.012,0.012,0.02,12),silver),x,ch/2+0.12,cd/2+0.012,cab).rotation.x=Math.PI/2);
 // --- Videorekorder
 const vy=ch+0.06+0.012; const vcr=add(ext(rr(0.56,0.1,0.01),0.36,0.004,plastD),0,vy+0.05,-0.2);
 const vc=document.createElement('canvas'); vc.width=512; vc.height=92; const vx=vc.getContext('2d'); const vt=new T.CanvasTexture(vc); vt.colorSpace=T.SRGBColorSpace;
 let blink=0; const drawV=()=>{ blink^=1; vx.fillStyle='#0d0c0b'; vx.fillRect(0,0,512,92); vx.fillStyle='#050505'; vx.fillRect(40,22,230,22); vx.strokeStyle='#2a2826'; vx.strokeRect(40,22,230,22);
  vx.fillStyle='#08100c'; vx.fillRect(330,18,130,40); if(blink){ vx.fillStyle='#4dffa0'; vx.shadowColor='#4dffa0'; vx.shadowBlur=8; vx.font='700 30px monospace'; vx.fillText('12:00',342,49); vx.shadowBlur=0; }
  vx.fillStyle='#8a8580'; vx.font='600 13px sans-serif'; vx.fillText('VIDEO  HQ  · PAL',44,72); for(let i=0;i<5;i++){ vx.fillStyle='#24221f'; vx.fillRect(300+i*34,64,26,12); } vt.needsUpdate=true; };
 drawV(); setInterval(drawV,700);
 add(new T.Mesh(new T.PlaneGeometry(0.55,0.099),new T.MeshStandardMaterial({map:vt,roughness:0.5,emissive:0xffffff,emissiveMap:vt,emissiveIntensity:0.35})),0,vy+0.05,0.17);
 // --- Fernseher
 const tw=0.82, th=0.66, td=0.42, ty=vy+0.1+0.004+th/2; const tv=new T.Group(); tv.position.set(0,ty,-0.18); G.add(tv);
 add(ext(rr(tw,th,0.05),td,0.02,wood),0,0,-td/2-0.02,tv);
 const back=add(new T.Mesh(new T.CylinderGeometry(0.2,0.36,0.3,4,1),plastD),0,0.0,-td/2-0.14,tv); back.rotation.set(Math.PI/2,Math.PI/4,0); back.scale.set(1.25,1,0.95);
 // Front: Kunststoffrahmen mit Bildschirmausschnitt
 const fs=rr(tw-0.02,th-0.02,0.04); const hole=rr(0.64,0.5,0.06); fs.holes.push(hole); const front=add(ext(fs,0.02,0.006,plast),0,0,td/2+0.012,tv);
 // gewölbte Bildröhre
 const sw=0.66, sh=0.52; const sg=new T.PlaneGeometry(sw,sh,32,24); const pa=sg.attributes.position; for(let i=0;i<pa.count;i++){ const x=pa.getX(i)/(sw/2), y=pa.getY(i)/(sh/2); pa.setZ(i,0.03*(1-x*x*0.85)*(1-y*y*0.85)); } sg.computeVertexNormals();
 const scrM=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}); const scr=add(new T.Mesh(sg,scrM),0,0,td/2+0.004,tv);
 // Röhrenrand-Vignette + Zeilen (in der Welt, auf dem Glas)
 const vg=document.createElement('canvas'); vg.width=256; vg.height=192; const gx=vg.getContext('2d'); const rg=gx.createRadialGradient(128,96,40,128,96,150); rg.addColorStop(0,'rgba(0,0,0,0)'); rg.addColorStop(0.7,'rgba(0,0,0,0.15)'); rg.addColorStop(1,'rgba(0,0,0,0.85)'); gx.fillStyle=rg; gx.fillRect(0,0,256,192);
 for(let y=0;y<192;y+=2){ gx.fillStyle='rgba(0,0,0,0.13)'; gx.fillRect(0,y,256,1); }
 const vig=add(new T.Mesh(sg.clone(),new T.MeshBasicMaterial({map:new T.CanvasTexture(vg),transparent:true,depthWrite:false})),0,0,td/2+0.0055,tv);
 const glass=add(new T.Mesh(sg.clone(),new T.MeshPhysicalMaterial({color:0x223030,roughness:0.08,metalness:0,transparent:true,opacity:0.16,clearcoat:1,clearcoatRoughness:0.05,depthWrite:false})),0,0,td/2+0.008,tv);
 // Bedienelemente rechts unter dem Bild (Leiste)
 const bar=add(new T.Mesh(new T.BoxGeometry(0.58,0.055,0.01),plastD),0,-0.282,td/2+0.042,tv);
 const gc=document.createElement('canvas'); gc.width=256; gc.height=32; const gg=gc.getContext('2d'); gg.fillStyle='#141312'; gg.fillRect(0,0,256,32); for(let x=4;x<84;x+=6){ gg.fillStyle='#050505'; gg.fillRect(x,6,3,20); } gg.fillStyle='#b8b0a0'; gg.font='italic 700 15px serif'; gg.fillText('Grundig',96,22);
 const grill=new T.CanvasTexture(gc); grill.colorSpace=T.SRGBColorSpace; add(new T.Mesh(new T.PlaneGeometry(0.56,0.05),new T.MeshStandardMaterial({map:grill,roughness:0.7})),0,-0.282,td/2+0.0475,tv);
 [0.15,0.22].forEach((x,i)=>{ const k=add(new T.Mesh(new T.CylinderGeometry(0.017,0.019,0.022,24),silver),x+0.02,-0.282,td/2+0.058,tv); k.rotation.x=Math.PI/2; const c=add(new T.Mesh(new T.CylinderGeometry(0.009,0.009,0.003,16),chrome),x+0.02,-0.282,td/2+0.07,tv); c.rotation.x=Math.PI/2; });
 const led=add(new T.Mesh(new T.SphereGeometry(0.005,8,6),new T.MeshBasicMaterial({color:0xff2a10})),0.27,-0.282,td/2+0.052,tv);
 // Zimmerantenne
 const ant=new T.Group(); ant.position.set(0,th/2+0.02,-0.05); tv.add(ant); add(new T.Mesh(new T.SphereGeometry(0.045,16,10,0,Math.PI*2,0,Math.PI/2),plastD),0,0,0,ant);
 [-1,1].forEach(s=>{ const r=add(new T.Mesh(new T.CylinderGeometry(0.0045,0.006,0.4,8),chrome),0,0.2,0,ant); r.geometry.translate(0,0,0); r.position.set(s*0.09,0.18,-0.02); r.rotation.z=-s*0.5; r.rotation.x=-0.15; const tip=add(new T.Mesh(new T.SphereGeometry(0.007,8,6),chrome),s*0.185,0.35,-0.05,ant); });
 const setMap=m=>{ scrM.map=m; scrM.needsUpdate=true; };
 return {group:G, setMap, screen:scr, tv, screenY:ty, led}; };
