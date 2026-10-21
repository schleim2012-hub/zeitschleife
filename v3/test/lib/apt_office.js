/* Rewind Wohnung – Büro im Stil einer 90er-Akte-X-Kellerstelle. Raum x[38,42.5] z[-2,2.2] H 2.55, Boden y=0, Tür Nord (z=2.2,x=38.8) → Wohnzimmer.
   Licht: Schreibtischlampe (Spot), Röhrenmonitor (grün, nur an), Diaprojektor (schwach). aptBuildOffice(sc,K) → {group,lights,collide,doors,interact,tick,files} */
(function(){
window.aptBuildOffice=function(sc,K){ const T=THREE, G=new T.Group(); G.name='office'; sc.object3D.add(G);
 const X0=38,X1=42.5,Z0=-2.0,Z1=2.2,H=2.55, DN={x:38.8,w:0.9,h:2.05}; const B=new K.Batch(), cl=K.cl;
 const FURN=[[39.7,41.3,-0.9,-0.1],[42.0,42.5,-1.9,0.0],[38,38.45,-1.9,-0.6],[40.15,40.55,0.95,1.45]];
 const ao=K.roomAO(X0,X1,Z0,Z1,H,FURN), oa=K.objAO(0);
 // ---------- Hülle: Teppich, Akustikdecke, unten Holzpaneel, oben vergilbter Putz ----------
 B.put('fl',new T.PlaneGeometry(X1-X0,Z1-Z0,18,17),(X0+X1)/2,0,(Z0+Z1)/2,0x6a6656,[-Math.PI/2,0,0],{ao,wuv:1.4});
 B.put('ce',new T.PlaneGeometry(X1-X0,Z1-Z0,9,8),(X0+X1)/2,H,(Z0+Z1)/2,0x9a9484,[Math.PI/2,0,0],{ao,wuv:1.2});
 const PW=0xb8ae94; ['W','E','S'].forEach(f=>K.wallFace(B,'pa',f,X0,X1,Z0,Z1,H,[],PW,ao,1.3)); K.wallFace(B,'pa','N',X0,X1,Z0,Z1,H,[[DN.x-DN.w/2,DN.x+DN.w/2,0,DN.h]],PW,ao,1.3);
 const PAN=0x6a4a30, d=0.015; // Wandpaneel bis 1,0 m + Leiste
 B.box('wd',X0,X1,0,1.0,Z0,Z0+d,PAN,{ao}); B.box('wd',X0,X0+d,0,1.0,Z0,Z1,PAN,{ao}); B.box('wd',X1-d,X1,0,1.0,Z0,Z1,PAN,{ao}); B.box('wd',X0,DN.x-DN.w/2,0,1.0,Z1-d,Z1,PAN,{ao}); B.box('wd',DN.x+DN.w/2,X1,0,1.0,Z1-d,Z1,PAN,{ao});
 B.box('wd',X0,X1,1.0,1.04,Z0,Z0+0.03,0x4a3020); B.box('wd',X0,X0+0.03,1.0,1.04,Z0,Z1,0x4a3020); B.box('wd',X1-0.03,X1,1.0,1.04,Z0,Z1,0x4a3020);
 for(let x=X0+0.3;x<X1;x+=0.3) B.box('wd',x,x+0.006,0.02,1.0,Z0+d,Z0+d+0.003,0x2a1a10);
 { const x0=DN.x-DN.w/2, x1=DN.x+DN.w/2; B.box('wd',x0-0.07,x0,0,DN.h+0.07,Z1-0.04,Z1+0.02,0x3a2818); B.box('wd',x1,x1+0.07,0,DN.h+0.07,Z1-0.04,Z1+0.02,0x3a2818); B.box('wd',x0,x1,DN.h,DN.h+0.07,Z1-0.04,Z1+0.02,0x3a2818); }
 // tote Leuchtstofflampe an der Decke, Rohrleitung
 B.box('mt',39.6,40.9,H-0.08,H,0.3,0.5,0x8a8a80); B.cyl('pa',0.016,0.016,1.2,40.25,H-0.1,0.4,0xc8c8c0,[0,0,Math.PI/2],8); B.cyl('mt',0.04,0.04,X1-X0,(X0+X1)/2,H-0.12,Z0+0.12,0x4a4a44,[0,0,Math.PI/2],10);
 // ---------- Aktenschränke (Ostwand) ----------
 const CAB=0x6a705e; for(let i=0;i<4;i++){ const z0=-1.9+i*0.475, z1=z0+0.46, x0=42.0, x1=42.48; B.box('cb',x0,x1,0,1.32,z0,z1,CAB,{ao:oa});
  for(let j=0;j<4;j++){ const y0=0.04+j*0.32; B.box('cb',x0-0.012,x0,y0,y0+0.3,z0+0.015,z1-0.015,0x737a66,{jit:0.08}); B.box('mt',x0-0.03,x0-0.012,y0+0.2,y0+0.225,(z0+z1)/2-0.06,(z0+z1)/2+0.06,0xa0a090); B.box('pa',x0-0.014,x0-0.012,y0+0.24,y0+0.28,(z0+z1)/2-0.04,(z0+z1)/2+0.04,0xd8d0b0); }
  if(i===2){ B.box('cb',x0-0.32,x0,0.04+0.32,0.04+0.62,z0+0.02,z1-0.02,0x5e6454); } } // eine Schublade halb offen
 // ---------- Metallregal mit Ordnern (Westwand, hinten) ----------
 { const x0=38.02,x1=38.42; [0.05,0.5,0.95,1.4,1.85].forEach(y=>B.box('mt',x0,x1,y,y+0.02,-1.9,-0.6,0x55584c)); [-1.9,-0.62].forEach(z=>B.box('mt',x0,x1,0,1.9,z,z+0.02,0x45483e));
  [0.07,0.52,0.97,1.42].forEach((y,s)=>{ let z=-1.87; while(z<-0.7){ const w=0.05+Math.random()*0.03, hh=0.3+Math.random()*0.06; if(Math.random()<0.12){ z+=0.08; continue; } const cols=[0x2a3a5a,0x6a2a20,0x8a7a4a,0x3a4a3a,0x1a1a1a]; B.box('pl',x0+0.05,x0+0.33,y,y+hh,z,z+w,cols[(Math.random()*5)|0],{jit:0.2}); z+=w+0.003; } }); }
 // ---------- Schreibtisch-Bereich ----------
 const DX=40.5, DZ=-0.5, DY=0.76;
 // ---------- Diaprojektor auf Rollwagen ----------
 B.box('mt',40.15,40.55,0.0,0.7,0.95,1.45,0x3a3a36,{ao:oa}); [0.1,0.4].forEach(y=>B.box('mt',40.15,40.55,y,y+0.02,0.95,1.45,0x55554e));
 B.put('pl',K.roundBox(0.28,0.11,0.26,0.02),40.35,0.76,1.2,0x2c2a26); B.cyl('mt',0.035,0.04,0.12,40.53,0.77,1.2,0x1a1a1a,[0,0,Math.PI/2],16); B.cyl('pl',0.09,0.09,0.03,40.35,0.84,1.2,0x1c1c1c,[Math.PI/2,0,0],20);
 // ---------- Atlas: Poster, Pinnwand, Akten, Ordnerrücken, Dia ----------
 const AT=K.canvasTex(1024,1024,(x)=>{ const cell=(c,r,w,h,fn)=>{ x.save(); x.translate(c*128,r*128); x.beginPath(); x.rect(0,0,w*128,h*128); x.clip(); fn(w*128,h*128); x.restore(); };
  // Poster „ICH WILL ES GLAUBEN“ (eigene Gestaltung): 2×3 Zellen
  cell(0,0,2,3,(w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#05070a'); g.addColorStop(0.7,'#1a2230'); g.addColorStop(1,'#0a0c10'); x.fillStyle=g; x.fillRect(0,0,w,h); for(let i=0;i<70;i++){ x.fillStyle='rgba(255,255,255,'+Math.random()*0.7+')'; x.fillRect(Math.random()*w,Math.random()*h*0.6,1,1); }
   const bm=x.createLinearGradient(0,90,0,300); bm.addColorStop(0,'rgba(220,235,255,0.55)'); bm.addColorStop(1,'rgba(220,235,255,0)'); x.fillStyle=bm; x.beginPath(); x.moveTo(118,96); x.lineTo(140,96); x.lineTo(196,300); x.lineTo(62,300); x.fill();
   x.fillStyle='#8a8c90'; x.beginPath(); x.ellipse(128,92,46,11,0,0,7); x.fill(); x.fillStyle='#b8bcc4'; x.beginPath(); x.ellipse(128,85,20,10,0,Math.PI,0); x.fill(); x.fillStyle='#fff8c0'; [100,114,128,142,156].forEach(px=>{ x.beginPath(); x.arc(px,96,2,0,7); x.fill(); });
   x.fillStyle='#020304'; for(let i=0;i<14;i++){ const px=i*20-6, ph=50+Math.sin(i*2.3)*22+Math.random()*20; x.beginPath(); x.moveTo(px,300); x.lineTo(px+10,300-ph); x.lineTo(px+22,300); x.fill(); } x.fillRect(0,298,w,h-298);
   x.fillStyle='#e8e8e0'; x.font='700 25px "DejaVu Sans Condensed","Arial Narrow",sans-serif'; x.textAlign='center'; x.fillText('ICH WILL ES',128,340); x.fillText('GLAUBEN',128,368); x.textAlign='left';
   x.fillStyle='rgba(200,180,120,0.12)'; x.fillRect(0,0,w,h); });
  // Pinnwand mit Fotos + roten Fäden: 3×2 Zellen
  cell(2,0,3,2,(w,h)=>{ x.fillStyle='#8a6a40'; x.fillRect(0,0,w,h); for(let i=0;i<1600;i++){ x.fillStyle='rgba('+(60+Math.random()*80)+','+(40+Math.random()*50)+',20,0.5)'; x.fillRect(Math.random()*w,Math.random()*h,2,2); } x.strokeStyle='#3a2810'; x.lineWidth=10; x.strokeRect(0,0,w,h);
   const ph=[[30,26,'#4a5a4a'],[150,40,'#3a3a4a'],[270,22,'#5a4a3a'],[60,140,'#2a3a3a'],[200,150,'#4a4040'],[310,140,'#3a4a5a']]; const pins=[];
   ph.forEach(([px,py,col],i)=>{ x.save(); x.translate(px+30,py+36); x.rotate((Math.random()-0.5)*0.2); x.fillStyle='#e8e4d8'; x.fillRect(-32,-38,64,76); x.fillStyle=col; x.fillRect(-27,-33,54,52); x.fillStyle='rgba(255,255,255,0.18)';
    if(i===1){ x.fillStyle='#ccc'; x.beginPath(); x.ellipse(0,-10,14,4,0,0,7); x.fill(); } if(i===3){ x.fillStyle='#ddd'; x.fillRect(-4,-14,6,20); x.beginPath(); x.arc(-1,-18,4,0,7); x.fill(); } if(i===4){ x.fillStyle='#eee'; x.beginPath(); x.ellipse(-4,-6,6,10,0,0,7); x.ellipse(-8,-20,2,8,-0.2,0,7); x.ellipse(0,-20,2,8,0.2,0,7); x.fill(); }
    x.fillStyle='#222'; x.font='10px "Kalam",cursive'; x.fillText(['Feld 1987','Licht?','Mädchen','TN-7','Kaninchen','Mall 84'][i],-26,32); x.restore(); pins.push([px+30,py+4]); });
   x.strokeStyle='#b0141a'; x.lineWidth=2; [[0,1],[1,2],[1,4],[3,4],[4,5],[0,3]].forEach(([a,b])=>{ x.beginPath(); x.moveTo(...pins[a]); x.lineTo(...pins[b]); x.stroke(); }); pins.forEach(p=>{ x.fillStyle='#d01818'; x.beginPath(); x.arc(p[0],p[1],4,0,7); x.fill(); });
   x.fillStyle='#f0e8a0'; x.fillRect(250,200,80,46); x.fillStyle='#222'; x.font='13px "Kalam",cursive'; x.fillText('Wer ist sie?',256,220); x.fillText('1996 ?!',256,238); });
  // Aktendeckel (4 Zellen, Reihe 3)
  (window.APT_FILES||[]).forEach((f,i)=>cell(i*2%8,3+Math.floor(i/4),2,1,(w,h)=>{ x.fillStyle='#c8a868'; x.fillRect(0,0,w,h); x.fillStyle='rgba(90,60,20,0.25)'; for(let k=0;k<40;k++) x.fillRect(Math.random()*w,Math.random()*h,Math.random()*30,1);
   x.fillStyle='#e8e0c8'; x.fillRect(16,20,150,40); x.fillStyle='#1a1a1a'; x.font='700 20px "DejaVu Sans Mono",monospace'; x.fillText(f.tab.split(' · ')[0],24,48); x.font='600 12px "DejaVu Sans Mono",monospace'; x.fillText(f.tab.split(' · ')[1]||'',24,88);
   x.strokeStyle='#a01818'; x.lineWidth=3; x.save(); x.translate(186,86); x.rotate(-0.2); x.strokeRect(-46,-16,92,30); x.fillStyle='#a01818'; x.font='800 13px sans-serif'; x.fillText('GEHEIM',-28,5); x.restore(); }));
  // Blanko-Akten (Zellen 0..3, Reihe 4)
  ['#b89858','#8a9a6a','#c8b890','#9a6a4a'].forEach((c,i)=>cell(i*2,4,2,1,(w,h)=>{ x.fillStyle=c; x.fillRect(0,0,w,h); x.fillStyle='rgba(255,255,255,0.6)'; x.fillRect(18,22,110,22); x.fillStyle='#333'; x.font='600 13px monospace'; x.fillText('AZ '+(31+i*7)+'/9'+i,22,38); }));
  // Papier mit Text (Reihe 5, Zellen 0..1)
  cell(0,5,1,1,(w,h)=>{ x.fillStyle='#e8e2d0'; x.fillRect(0,0,w,h); x.fillStyle='rgba(40,40,40,0.55)'; for(let y=12;y<h-6;y+=7) x.fillRect(10,y,w-20-Math.random()*30,2); });
  // Dia (Projektion): körniges Waldfoto, Gestalt am Feldrand – Reihe 6, 2×2
  cell(2,5,2,2,(w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#3a4a5a'); g.addColorStop(0.5,'#7a6a4a'); g.addColorStop(1,'#3a3220'); x.fillStyle=g; x.fillRect(0,0,w,h); x.fillStyle='#1a1e14'; for(let i=0;i<16;i++){ const px=i*17, ph=60+Math.random()*60; x.fillRect(px,128-ph,10,ph+10); } x.fillStyle='#c8b070'; x.fillRect(0,140,w,h-140);
   x.fillStyle='#2a2018'; x.fillRect(176,128,8,30); x.beginPath(); x.arc(180,124,6,0,7); x.fill(); const d=x.getImageData(0,640,w,h); x.fillStyle='rgba(255,240,200,0.12)'; x.fillRect(0,0,w,h); x.fillStyle='rgba(0,0,0,0.5)'; x.font='10px monospace'; x.fillText('09·87',w-44,h-8); });
 });
 const mAt=K.std({map:AT,roughness:0.75}); const at=(c,r,w,h)=>[c/8,1-(r+(h||1))/8,(c+(w||1))/8,1-r/8];
 B.put('at',new T.BoxGeometry(0.62,0.93,0.004),40.9,1.6,Z0+0.01,0xffffff,null,{uvr:at(0,0,2,3)}); // Poster
 B.put('at',new T.BoxGeometry(0.02,0.86,1.29),X0+0.012,1.55,0.95,0xffffff,null,{uvr:at(2,0,3,2)}); // Pinnwand (Westwand)
 // Aktenstapel überall
 const pile=(x,y,z,n,r)=>{ let yy=y; for(let i=0;i<n;i++){ const t=0.012+Math.random()*0.02; B.put('at',new T.BoxGeometry(0.24,t,0.32),x+(Math.random()-0.5)*0.03,yy+t/2,z+(Math.random()-0.5)*0.03,0xffffff,[0,r+(Math.random()-0.5)*0.25,0],{uvr:at(((Math.random()*4)|0)*2,4,2,1)}); yy+=t; } return yy; };
 pile(42.25,1.32,-1.65,6,0.1); pile(42.24,1.32,-0.7,4,-0.15); pile(38.6,0,-0.3,9,0.4); pile(39.0,0,-1.6,5,1.2); pile(41.9,0,1.6,7,-0.3); pile(39.3,0,1.6,3,0.8);
 for(let i=0;i<9;i++) B.put('at',new T.BoxGeometry(0.21,0.002,0.29),39.0+Math.random()*2.6,0.002+i*0.0005,-1.6+Math.random()*3.0,0xffffff,[0,Math.random()*3,0],{uvr:at(0,5)});
 // Kartons
 [[38.7,0,1.1,0.42,0.3,0.32,0.3],[38.75,0.3,1.12,0.38,0.26,0.3,-0.2],[41.85,0,0.7,0.45,0.32,0.35,0.1]].forEach(([x,y,z,w,h,dd,r])=>B.put('ka',new T.BoxGeometry(w,h,dd),x,y+h/2,z,0xa88458,[0,r,0],{ao:oa,wuv:0.5}));
 // ---------- Materialien + Bau ----------
 const mats={fl:K.std({map:K.tex('assets/tex/br/carpet_c.jpg',1),normalMap:K.tex('assets/tex/br/carpet_n.jpg'),roughness:1}), ce:K.std({map:K.tex('assets/tex/br/ceil_c.jpg',1),roughness:0.95}),
  pa:K.std({map:K.tex('assets/tex/kirmes/Painted/PaintedPlaster017_1K-JPG_Color.jpg',1),normalMap:K.tex('assets/tex/kirmes/Painted/PaintedPlaster017_1K-JPG_NormalGL.jpg'),roughness:0.9}),
  wd:K.std({map:K.tex('assets/tex/ph/wood_table_001_diff.jpg',1),roughness:0.6}), cb:K.std({map:K.tex('assets/tex/ph/painted_metal_shutter_diff.jpg',1),normalMap:K.tex('assets/tex/ph/painted_metal_shutter_nor_gl.jpg'),roughness:0.6,metalness:0.3}),
  mt:K.std({color:0xffffff,roughness:0.4,metalness:0.6}), pl:K.std({color:0xffffff,roughness:0.5}), at:mAt, ka:K.std({map:K.tex('assets/tex/kirmes/Painted/PaintedPlaster017_1K-JPG_Color.jpg',1),roughness:1})};
 mats.fl.color.setHex(0x8a8070); mats.pa.color.setHex(0xd8cca8);
 B.D.wd&&B.D.wd.forEach(g=>{ const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv; for(let i=0;i<p.count;i++){ const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)); if(ay>0.5) u.setXY(i,p.getX(i),p.getZ(i)); else if(ax>0.5) u.setXY(i,p.getZ(i)*0.6,p.getY(i)*1.6); else u.setXY(i,p.getX(i)*0.6,p.getY(i)*1.6); } });
 B.D.cb&&B.D.cb.forEach(g=>{ const p=g.attributes.position,u=g.attributes.uv; for(let i=0;i<p.count;i++) u.setXY(i,p.getZ(i)*1.2,p.getY(i)*1.2); });
 B.build(G,mats);
 // ---------- Möbel (Poly Haven, CC0) ----------
 const place=(url,x,y,z,ry,w,cb)=>K.gltf(url,m=>{ const b=new T.Box3().setFromObject(m), s=new T.Vector3(); b.getSize(s); const k=w/Math.max(s.x,s.z); m.scale.multiplyScalar(k); const b2=new T.Box3().setFromObject(m), c=new T.Vector3(); b2.getCenter(c); m.position.x-=c.x; m.position.z-=c.z; m.position.y-=b2.min.y;
  const g=new T.Group(); g.add(m); g.position.set(x,y,z); g.rotation.y=ry; G.add(g); m.traverse(o=>{ if(o.isMesh&&o.material){ o.material.envMapIntensity=0.2; if(o.material.roughness!=null) o.material.roughness=Math.min(1,o.material.roughness+0.1); } }); cb&&cb(g,m); });
 place('assets/props/metal_office_desk.glb',DX,0,DZ,Math.PI,1.55);
 place('assets/props/painted_wooden_chair_01.glb',DX+0.1,0,DZ-0.75,0.2,0.48);
 place('assets/props/desk_lamp_arm_01.glb',DX-0.6,DY,DZ+0.15,-0.6,0.42);
 // ---------- Röhren-PC (15 Zoll, beige) auf dem Schreibtisch, Bildschirm zum Stuhl ----------
 const PC=new T.Group(); PC.position.set(DX+0.25,DY,DZ+0.05); PC.rotation.y=Math.PI+0.25; G.add(PC);
 const pB=new K.Batch(), BEI=0xcfc6ae; pB.put('p',K.roundBox(0.44,0.15,0.42,0.012),0,0.075,0,BEI); pB.box('p',-0.18,-0.04,0.09,0.11,0.205,0.212,0x8a8472); pB.box('p',0.12,0.16,0.04,0.06,0.205,0.214,0x9a9482);
 pB.put('p',K.roundBox(0.38,0.35,0.24,0.02),0,0.15+0.2,-0.0,BEI); pB.put('p',K.roundBox(0.3,0.27,0.18,0.05),0,0.15+0.2,-0.16,0xc2b9a1); pB.box('p',-0.06,0.06,0.15,0.17,-0.06,0.06,0xb8af97);
 pB.box('p',-0.155,0.155,0.15+0.06,0.15+0.335,0.118,0.124,0x2a2824); // Bildröhren-Rahmen innen dunkel
 pB.put('p',K.roundBox(0.46,0.03,0.16,0.008),0.0,0.015,0.36,BEI,[0.08,0,0]); for(let i=0;i<5;i++) pB.box('k',-0.2,0.2,0.03,0.035,0.3+i*0.025,0.318+i*0.025,0x8a8270,{jit:0.25});
 pB.build(PC,{p:K.std({color:0xffffff,roughness:0.55}),k:K.std({color:0xffffff,roughness:0.7})});
 const pcC=document.createElement('canvas'); pcC.width=320; pcC.height=240; const pcX=pcC.getContext('2d'); pcX.fillStyle='#050605'; pcX.fillRect(0,0,320,240); const pcT=new T.CanvasTexture(pcC); pcT.colorSpace=T.SRGBColorSpace;
 const psg=new T.PlaneGeometry(0.3,0.225,12,9); { const p=psg.attributes.position; for(let i=0;i<p.count;i++){ const a=p.getX(i)/0.15,b=p.getY(i)/0.1125; p.setZ(i,0.012*(1-0.5*(a*a+b*b))); } psg.computeVertexNormals(); }
 const pcScr=new T.Mesh(psg,new T.MeshBasicMaterial({map:pcT,toneMapped:false,color:0x666666})); pcScr.position.set(0,0.15+0.2,0.124); PC.add(pcScr);
 const pcHit=new T.Mesh(new T.BoxGeometry(0.46,0.56,0.5),new T.MeshBasicMaterial({visible:false})); pcHit.position.set(0,0.28,0.05); PC.add(pcHit);
 const pcLed=new T.Mesh(new T.CircleGeometry(0.005,10),new T.MeshBasicMaterial({color:0x221100})); pcLed.position.set(0.14,0.05,0.215); PC.add(pcLed);
 // zweiter PC (aus, staubig) auf Kartons
 { const P2=new T.Group(); P2.position.set(38.72,0.56,1.12); P2.rotation.y=Math.PI/2-0.2; G.add(P2); const b=new K.Batch(); b.put('p',K.roundBox(0.34,0.31,0.3,0.02),0,0.155,0,0xbfb69c); b.put('p',K.roundBox(0.26,0.24,0.16,0.05),0,0.155,-0.18,0xb4ab92); b.box('p',-0.13,0.13,0.04,0.27,0.15,0.156,0x1a1a18); b.build(P2,{p:K.std({color:0xffffff,roughness:0.7})}); }
 // ---------- Diaprojektor: Lichtkegel + Bild an der Ostwand ----------
 const slide=new T.Mesh(new T.PlaneGeometry(0.9,0.9),new T.MeshBasicMaterial({map:AT,transparent:true,opacity:0.55,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));
 { const u=slide.geometry.attributes.uv, [u0,v0,u1,v1]=at(2,5,2,2); for(let i=0;i<u.count;i++) u.setXY(i,u0+u.getX(i)*(u1-u0),v0+u.getY(i)*(v1-v0)); }
 slide.position.set(X1-0.005,1.62,1.2); slide.rotation.y=-Math.PI/2; G.add(slide);
 const beamT=K.canvasTex(64,64,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(200,210,255,0.0)'); g.addColorStop(1,'rgba(200,210,255,0.5)'); x.fillStyle=g; x.fillRect(0,0,w,h); });
 const bg=new T.CylinderGeometry(0.55,0.03,1.9,24,1,true); bg.translate(0,-0.95,0); const beam=new T.Mesh(bg,new T.MeshBasicMaterial({map:beamT,transparent:true,opacity:0.16,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false}));
 beam.position.set(40.58,0.77,1.2); beam.lookAt(X1,1.62,1.2); beam.rotateX(-Math.PI/2); G.add(beam);
 // ---------- Lesbare Akten ----------
 const files=[]; const fileSpots=[[DX-0.25,DY,DZ-0.05,0.15],[DX+0.0,DY,DZ+0.25,-0.35],[42.24,1.32+0.06,-1.18,0.05],[40.35,0.705,1.32,0.4]];
 (window.APT_FILES||[]).forEach((f,i)=>{ const s=fileSpots[i]; if(!s) return; const m=new T.Mesh(new T.BoxGeometry(0.24,0.014,0.32),[mAt,mAt,mAt,mAt,mAt,mAt]); const u=m.geometry.attributes.uv, [u0,v0,u1,v1]=at(i*2%8,3+Math.floor(i/4),2,1); for(let k=0;k<u.count;k++) u.setXY(k,u0+u.getX(k)*(u1-u0),v0+u.getY(k)*(v1-v0));
  m.position.set(s[0],s[1]+0.007,s[2]); m.rotation.y=s[3]+Math.PI/2; G.add(m); files.push({hit:m,file:f}); });
 // ---------- FBI-Parodie-Ausweise (Halli Galli offen, Fix Molder zu) – Untersuchen im Resident-Evil-Stil über ZSX (weltfest, nicht am Kopf) ----------
 const interact=[], cards=[], easeIO=k=>k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
 const idCard=(url,x,z,ry,closed,name)=>K.gltf(url,m=>{ const b=new T.Box3().setFromObject(m), c=new T.Vector3(); b.getCenter(c); m.position.x-=c.x; m.position.z-=c.z; m.position.y-=b.min.y;
  const g=new T.Group(); g.name='fbi_'+name; g.add(m); g.position.set(x,DY,z); g.rotation.y=ry; G.add(g); m.traverse(o=>{ if(o.isMesh&&o.material){ const mt=o.material; mt.envMapIntensity=0.2; if(closed&&mt.map){ mt.emissiveMap=mt.map; mt.emissive=new T.Color(0x2a221a); mt.needsUpdate=true; } } }); // zu: dezente warme Aufhellung (Leder im Halbschatten lesbar), kein Leuchten
  const cd={g,m,mx:m.position.x,closed,cover:closed?m.getObjectByName('cover'):null,k:0,to:0,name}; cards.push(cd); interact.push({hit:g,recursive:true,name:'fbi_'+name,fn:(src,c)=>examineCard(cd,src,c)}); });
 const examineCard=(cd,src,c)=>{ const Z=window.ZSX, A=window.__apt; if(!Z||Z.busy()) return; const R=sc.renderer, vr=R.xr.isPresenting; let mode=vr?'laser':'mouse', el=null;
  if(vr&&src==='grip'){ const cp=new T.Vector3(), hp=new T.Vector3(); cd.g.getWorldPosition(cp); let bd=9; document.querySelectorAll('[laser-controls]').forEach(h=>{ h.object3D.getWorldPosition(hp); const d=hp.distanceTo(cp); if(d<bd){ bd=d; el=h; } }); if(el) mode='grip'; }
  Z.examine(cd.g,{mode,src:el,size:cd.closed?0.15:0.2,dist:0.4,face:[0,1,0],up:[0,0,-1],
   onStart:()=>{ if(A) A.busy=true; if(cd.cover) cd.to=1; cd.g.traverse(o=>{ if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial){ const mt=o.material; mt.emissive=new T.Color(0); mt.emissiveMap=null; mt.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n vec2 zu=vMapUv; float zp=step(0.02,zu.x)*step(zu.x,0.545)*step(0.02,zu.y)*step(zu.y,0.705); totalEmissiveRadiance+=diffuseColor.rgb*(0.18+0.9*(1.0-zp)*(1.0-smoothstep(0.03,0.15,dot(diffuseColor.rgb,vec3(0.333)))));'); }; mt.customProgramCacheKey=()=>'zsCardLift'; mt.needsUpdate=true; } }); }, // ZSX hat die Materialien geklont: Lederrücken beim Untersuchen nicht schwarz
   onEnd:()=>{ if(cd.cover) cd.to=0; setTimeout(()=>{ if(A) A.busy=false; },120); } }); };
 idCard('assets/apartment/office/fbi_id_halli_open.glb',40.05,-0.74,Math.PI+0.2,false,'halli');
 idCard('assets/apartment/office/fbi_id_molder.glb',40.24,-0.79,Math.PI-0.35,true,'molder'); // im Lichtkegel der Schreibtischlampe (vorher 39.86/-0.62 im Schatten)
 // Klappe: wie Clip 'open' (0,8 s, cover.rotation.z 0 → π), beim Zurücklegen wieder zu
 let cardLast=0; const cardTick=now=>{ const dt=Math.min(0.1,(now-(cardLast||now))/1000); cardLast=now; cards.forEach(cd=>{ if(!cd.cover||cd.k===cd.to) return; cd.k=cd.to>cd.k?Math.min(cd.to,cd.k+dt/0.8):Math.max(cd.to,cd.k-dt/0.6); const e=easeIO(cd.k); cd.cover.rotation.z=Math.PI*e; cd.m.position.x=cd.mx+0.04275*e; /* offenes Etui bleibt mittig vor dir */ }); };
 // ---------- Licht ----------
 const lampS=new T.SpotLight(0xffc27a,4,4.5,0.85,0.6,2); lampS.position.set(DX-0.42,DY+0.42,DZ+0.0); lampS.target.position.set(DX-0.1,DY,DZ-0.1); G.add(lampS); G.add(lampS.target); K.glow(G,DX-0.42,DY+0.38,DZ,0.18,0xffd8a0,0.5);
 const crtL=new T.PointLight(0x50ff90,0,2.6,2); crtL.position.set(DX+0.15,DY+0.4,DZ-0.35); G.add(crtL);
 const projS=new T.SpotLight(0xc8d4ff,1.4,4.2,0.32,0.6,2); projS.position.set(40.6,0.77,1.2); projS.target.position.set(X1,1.62,1.2); G.add(projS); G.add(projS.target);
 const hemi=new T.HemisphereLight(0x22262a,0x0a0806,0.2); G.add(hemi);
 // ---------- PC: Start + grüne Schrift ----------
 let pcOn=0, pcT0=0, hum=null; const MSG='Folge dem weißen Kaninchen.';
 const LINES=['MÖBIUS-BIOS v1.96','Speichertest ......... 640K OK','Laufwerk C: ......... bereit','','C:\\> AKTE.EXE /TN7',''];
 const pcPress=()=>{ if(pcOn){ return; } pcOn=1; pcT0=performance.now(); (K.sfx||window.aptSFX||(()=>null))('pc_boot',0.55); pcLed.material.color.setHex(0x30ff60); };
 const drawPC=(now)=>{ const t=(now-pcT0)/1000, x=pcX, W=320, H=240; x.fillStyle='#030503'; x.fillRect(0,0,W,H);
  if(t<0.5){ const k=t/0.5; x.fillStyle='rgba(200,255,220,'+(1-k)+')'; x.fillRect(0,H/2-1-k*H/2,W,2+k*H); crtL.intensity=0.2*k; }
  else { x.font='15px "DejaVu Sans Mono","Courier New",monospace'; x.fillStyle='#3cff7a'; x.shadowColor='#2f8'; x.shadowBlur=6; const tl=t-0.5; let y=24;
   const nL=Math.min(LINES.length,Math.floor(tl/0.45)); for(let i=0;i<nL;i++){ x.fillText(LINES[i],12,y); y+=19; }
   if(tl>LINES.length*0.45+0.6){ const k=Math.min(MSG.length,Math.floor((tl-LINES.length*0.45-0.6)*11)); x.font='bold 19px "DejaVu Sans Mono","Courier New",monospace'; x.fillText(MSG.slice(0,k)+((Math.floor(t*2)%2)?'█':' '),12,y+12); if(k>=MSG.length&&!drawPC.done){ drawPC.done=1; try{ localStorage.setItem('zs_apt_rabbit','1'); }catch(e){} window.__apt&&(__apt.rabbit=true); } }
   x.shadowBlur=0; x.fillStyle='rgba(0,0,0,0.28)'; for(let yy=0;yy<H;yy+=3) x.fillRect(0,yy,W,1); crtL.intensity=0.35+0.03*Math.sin(now*0.05); }
  pcScr.material.color.setHex(0xffffff); pcT.needsUpdate=true; };
 const tick=(now)=>{ cardTick(now); if(pcOn) drawPC(now); lampS.intensity=4*(0.99+0.01*Math.sin(now*0.017)); projS.intensity=1.4*(0.97+0.03*Math.sin(now*0.09)); slide.material.opacity=0.52+0.03*Math.sin(now*0.09); };
 const solid=[[39.72,41.28,-0.88,-0.12],[41.95,42.5,-1.9,0.0],[38,38.45,-1.92,-0.6],[40.1,40.6,0.9,1.5],[38.45,38.95,0.9,1.3],[41.6,42.1,0.5,0.9],[40.3,40.8,-1.45,-1.0]];
 const collide=p=>{ const r=0.22; p.x=cl(p.x,X0+r,X1-r); p.z=cl(p.z,Z0+r,Z1-r); for(const [a0,a1,b0,b1] of solid){ if(p.x>a0-r&&p.x<a1+r&&p.z>b0-r&&p.z<b1+r){ const c=[[p.x-(a0-r),'x',a0-r],[(a1+r)-p.x,'x',a1+r],[p.z-(b0-r),'z',b0-r],[(b1+r)-p.z,'z',b1+r]].filter(e=>e[1]==='x'?(e[2]>=X0+r-1e-3&&e[2]<=X1-r+1e-3):(e[2]>=Z0+r-1e-3&&e[2]<=Z1-r+1e-3)).sort((u,v)=>u[0]-v[0])[0]; if(c) p[c[1]]=c[2]; } } };
 interact.unshift({hit:pcHit,fn:pcPress,name:'pc'}); // PC bleibt Eintrag 0 (gfx_wohnung_buero.js)
 return {group:G,lights:[lampS,crtL,projS,hemi],collide,X0,X1,Z0,Z1,doors:{living:{pos:[DN.x,Z1-0.02],face:[0,-1],w:DN.w,spawn:[DN.x,Z1-0.8],yaw:0}},
  interact,files,tick,pcIsOn:()=>pcOn};
};
})();
