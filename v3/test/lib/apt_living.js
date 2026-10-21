/* Rewind Wohnung – Wohnzimmer (80er/90er). Raum x[18,23.5] z[-2.4,2.4] H 2.6, Boden y=0.
   Tür West (x=18,z=0.8) → Küche, Tür Süd (z=-2.4,x=19.0) → Büro. Licht: Stehlampe, Fernseher (nur an), Straßenlaterne vorm Fenster.
   aptBuildLiving(sc,K) → {group,lights,collide,doors,interact:[...],grabs:[...],tick} */
(function(){
window.aptBuildLiving=function(sc,K){ const T=THREE, S=sc.object3D, G=new T.Group(); G.name='living'; S.add(G);
 const X0=18,X1=23.5,Z0=-2.4,Z1=2.4,H=2.6; const DW={z:0.8,w:0.9,h:2.05}, DS={x:19.0,w:0.9,h:2.05}, WIN={z:0.5,w:1.3,y0:0.85,y1:2.1};
 const B=new K.Batch(), cl=K.cl;
 const FURN=[[20.5,23.2,-2.4,-1.5],[20.7,22.6,1.95,2.4],[18,18.5,-2.3,0.1],[20.4,22.2,-0.55,0.35],[19.85,20.35,-2.3,-1.8]];
 const ao=K.roomAO(X0,X1,Z0,Z1,H,FURN), oa=K.objAO(0);
 // ---------- Hülle ----------
 B.put('fl',new T.PlaneGeometry(X1-X0,Z1-Z0,22,19),(X0+X1)/2,0,(Z0+Z1)/2,0xb09070,[-Math.PI/2,0,0],{ao,wuv:1.6});
 B.put('ce',new T.PlaneGeometry(X1-X0,Z1-Z0,11,10),(X0+X1)/2,H,(Z0+Z1)/2,0xb8ad98,[Math.PI/2,0,0],{ao,wuv:1.3});
 const WP=0xd8c8a8;
 K.wallFace(B,'wp','W',X0,X1,Z0,Z1,H,[[DW.z-DW.w/2,DW.z+DW.w/2,0,DW.h]],WP,ao,0.9);
 K.wallFace(B,'wp','S',X0,X1,Z0,Z1,H,[[DS.x-DS.w/2,DS.x+DS.w/2,0,DS.h]],WP,ao,0.9);
 K.wallFace(B,'wp','N',X0,X1,Z0,Z1,H,[],WP,ao,0.9);
 K.wallFace(B,'wp','E',X0,X1,Z0,Z1,H,[[WIN.z-WIN.w/2,WIN.z+WIN.w/2,WIN.y0,WIN.y1]],WP,ao,0.9);
 // Fußleisten, Deckenleiste
 const BASE=0x5a3c24; [[X0,X1,Z0,Z0+0.018],[X0,X1,Z1-0.018,Z1]].forEach(([a,b,c,d])=>B.box('wd',a,b,0,0.07,c,d,BASE)); [[X0,X0+0.018],[X1-0.018,X1]].forEach(([a,b])=>B.box('wd',a,b,0,0.07,Z0,Z1,BASE));
 // Fensterlaibung, Rahmen, Fensterbank (Ostwand)
 { const z0=WIN.z-WIN.w/2, z1=WIN.z+WIN.w/2, TR=0xcfc6b0; B.box('pa',X1,X1+0.2,WIN.y0-0.01,WIN.y0,z0,z1,0x9a917c); B.box('pa',X1,X1+0.2,WIN.y1,WIN.y1+0.01,z0,z1,0x9a917c); B.box('pa',X1,X1+0.2,WIN.y0,WIN.y1,z0-0.01,z0,0x9a917c); B.box('pa',X1,X1+0.2,WIN.y0,WIN.y1,z1,z1+0.01,0x9a917c);
  const fx=X1+0.12; [[WIN.y0,WIN.y0+0.06],[WIN.y1-0.06,WIN.y1],[(WIN.y0+WIN.y1)/2+0.1,(WIN.y0+WIN.y1)/2+0.15]].forEach(([a,b])=>B.box('pa',fx-0.03,fx+0.03,a,b,z0,z1,TR)); [z0,z1-0.06,WIN.z-0.03].forEach(z=>B.box('pa',fx-0.03,fx+0.03,WIN.y0,WIN.y1,z,z+0.06,TR));
  B.box('pa',X1-0.08,X1+0.02,WIN.y0-0.04,WIN.y0,z0-0.06,z1+0.06,TR); // Fensterbank
  // Heizkörper unter dem Fenster
  for(let i=0;i<14;i++) B.box('mt',X1-0.12,X1-0.04,0.18,0.72,z0+0.05+i*0.085,z0+0.1+i*0.085,0xbdb5a2,{ao:oa}); B.box('mt',X1-0.1,X1-0.06,0.12,0.18,z0+0.1,z0+0.14,0x9a937f); }
 // Türzargen (Holz, dunkel)
 const FR=0x4a3020; { const z0=DW.z-DW.w/2, z1=DW.z+DW.w/2; B.box('wd',X0-0.02,X0+0.04,0,DW.h+0.07,z0-0.07,z0,FR); B.box('wd',X0-0.02,X0+0.04,0,DW.h+0.07,z1,z1+0.07,FR); B.box('wd',X0-0.02,X0+0.04,DW.h,DW.h+0.07,z0,z1,FR); }
 { const x0=DS.x-DS.w/2, x1=DS.x+DS.w/2; B.box('wd',x0-0.07,x0,0,DS.h+0.07,Z0-0.02,Z0+0.04,FR); B.box('wd',x1,x1+0.07,0,DS.h+0.07,Z0-0.02,Z0+0.04,FR); B.box('wd',x0,x1,DS.h,DS.h+0.07,Z0-0.02,Z0+0.04,FR); }
 // ---------- Schrankwand (Westwand, Eiche rustikal) ----------
 const OAK=0x6a4428, OAKD=0x4a2e1a;
 { const x0=X0+0.02,x1=X0+0.47, z0=-2.3, z1=0.1; B.box('wd',x0,x1,0,0.75,z0,z1,OAK,{ao:oa}); B.box('wd',x0,x1-0.12,0.75,2.2,z0,z1,OAKD); // Unterteil, Rückwand Regal
  [0.75,1.15,1.55,1.95].forEach(y=>B.box('wd',x0,x1,y,y+0.025,z0,z1,OAK)); B.box('wd',x0,x1+0.02,2.2,2.26,z0-0.02,z1+0.02,OAK);
  [z0,(z0+z1)/2-0.4,(z0+z1)/2+0.4,z1-0.025].forEach(z=>B.box('wd',x0,x1,0.75,2.2,z,z+0.025,OAK));
  for(let i=0;i<4;i++){ const a=z0+0.03+i*0.6, b=a+0.57; B.box('wd',x1,x1+0.02,0.06,0.7,a,b,OAK); B.box('wd',x1+0.015,x1+0.03,0.12,0.64,a+0.06,b-0.06,OAKD); B.box('mt',x1+0.02,x1+0.045,0.5,0.53,i%2?a+0.05:b-0.08,i%2?a+0.08:b-0.05,0xb8963a); } }
 // ---------- Sofa (Südwand) + Sessel ----------
 const SOF=0x7a4a2a; { const x0=20.5,x1=23.2,z0=-2.38,z1=-1.5;
  B.put('so',K.roundBox(x1-x0,0.42,z1-z0,0.06),(x0+x1)/2,0.21,(z0+z1)/2,SOF,null,{ao:oa}); B.put('so',K.roundBox(x1-x0,0.5,0.22,0.08),(x0+x1)/2,0.62,z0+0.12,SOF);
  B.put('so',K.roundBox(0.2,0.25,z1-z0,0.07),x0+0.1,0.55,(z0+z1)/2,SOF); B.put('so',K.roundBox(0.2,0.25,z1-z0,0.07),x1-0.1,0.55,(z0+z1)/2,SOF);
  for(let i=0;i<3;i++){ const w=(x1-x0-0.4)/3; B.put('so',K.roundBox(w-0.02,0.14,0.62,0.06),x0+0.2+w*(i+0.5),0.48,z1-0.33,0x845232,[0,0,(i-1)*0.01]); B.put('so',K.roundBox(w-0.03,0.42,0.14,0.07),x0+0.2+w*(i+0.5),0.74,z0+0.27,0x845232,[-0.12,0,0]); }
  // Häkeldecke über der Lehne + Sitz (Granny Squares)
  B.put('hk',new T.BoxGeometry(1.1,0.012,0.55,8,1,4),22.45,0.92,-2.15,0xffffff,[0.9,0.06,0],{}); B.put('hk',new T.BoxGeometry(1.1,0.012,0.45,8,1,4),22.42,0.56,-1.82,0xffffff,[0.05,0.06,0]); B.put('hk',new T.BoxGeometry(1.1,0.012,0.25,8,1,2),22.4,0.4,-1.5,0xffffff,[1.45,0.06,0]);
  // Sessel
  const ax=19.35, az=0.95; B.put('so',K.roundBox(0.78,0.4,0.78,0.07),ax,0.2,az,SOF,[0,0.9,0],{ao:oa}); B.put('so',K.roundBox(0.78,0.5,0.2,0.08),ax-0.24,0.6,az-0.28,SOF,[0,0.9,0]); B.put('so',K.roundBox(0.62,0.14,0.6,0.06),ax+0.04,0.46,az+0.04,0x845232,[0,0.9,0]); }
 // ---------- Couchtisch (Holz + Rauchglas), Teppich ----------
 { const cx=21.3, cz=-0.1; B.box('wd',cx-0.6,cx+0.6,0.38,0.42,cz-0.38,cz+0.38,OAK); [[-0.55,-0.33],[0.55,-0.33],[-0.55,0.33],[0.55,0.33]].forEach(([a,b])=>B.box('wd',cx+a-0.03,cx+a+0.03,0,0.38,cz+b-0.03,cz+b+0.03,OAKD,{ao:oa})); B.box('wd',cx-0.55,cx+0.55,0.12,0.14,cz-0.33,cz+0.33,OAKD); }
 const rug=new T.Mesh(new T.PlaneGeometry(2.6,1.8),K.std({map:K.canvasTex(512,360,(x,w,h)=>{ x.fillStyle='#5a1e16'; x.fillRect(0,0,w,h); x.strokeStyle='#2a0e0a'; x.lineWidth=14; x.strokeRect(14,14,w-28,h-28); x.strokeStyle='#b88a4a'; x.lineWidth=3; x.strokeRect(30,30,w-60,h-60); x.strokeRect(44,44,w-88,h-88);
   for(let i=0;i<7;i++) for(let j=0;j<4;j++){ const cx=80+i*58, cy=80+j*68; x.save(); x.translate(cx,cy); x.rotate(Math.PI/4); x.strokeStyle=(i+j)%2?'#c8a060':'#2c3a52'; x.lineWidth=3; x.strokeRect(-16,-16,32,32); x.fillStyle='#1a1410'; x.fillRect(-5,-5,10,10); x.restore(); }
   const d=x.getImageData(0,0,w,h); for(let i=0;i<d.data.length;i+=4){ const n=(Math.random()-0.5)*26; d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n; } x.putImageData(d,0,0); x.fillStyle='rgba(30,20,10,0.25)'; x.fillRect(w*0.3,h*0.55,w*0.4,h*0.3); }),roughness:1,polygonOffset:true,polygonOffsetFactor:-2}));
 rug.rotation.x=-Math.PI/2; rug.position.set(21.3,0.004,-0.3); G.add(rug);
 // ---------- TV-Schrank + großer Röhrenfernseher (ca. 29 Zoll) + Videorekorder ----------
 const TVX=21.65, TVZ=2.12; B.box('wd',20.95,22.35,0,0.5,1.92,2.38,OAK,{ao:oa}); B.box('wd',20.98,22.32,0.08,0.44,1.915,1.92,OAKD); B.box('wd',21.64,21.66,0.08,0.44,1.91,1.915,OAK);
 // VHS-Rekorder unter dem TV (im Fach sichtbar)
 B.box('pl',21.0,21.43,0.3,0.39,1.96,2.3,0x1c1c1e); B.box('pl',21.03,21.4,0.33,0.36,1.955,1.96,0x0b0b0c);
 const tvG=new T.Group(); tvG.position.set(TVX,0.5,TVZ); tvG.rotation.y=Math.PI; G.add(tvG);
 // Gehäuse: tief, dunkles Kunststoff-Holzdekor, Bildschirm 58×44 cm (≈ 73 cm Diagonale)
 const SW=0.58, SH=0.44; B.put('pl',K.roundBox(0.8,0.64,0.52,0.035),TVX,0.5+0.32,TVZ-0.03,0x2a2622,null,{ao:oa}); B.put('pl',K.roundBox(0.62,0.5,0.2,0.08),TVX,0.5+0.33,TVZ+0.27,0x22201d);
 B.box('pl',TVX-0.33,TVX+0.33,0.5+0.06,0.5+0.6,TVZ-0.295,TVZ-0.285,0x141312); // Frontrahmen
 for(let i=0;i<6;i++) B.box('pl',TVX+0.3,TVX+0.37,0.5+0.1+i*0.02,0.5+0.105+i*0.02,TVZ-0.3,TVZ-0.29,0x050505);
 const scrM=new T.MeshBasicMaterial({color:0x0c0d0e,toneMapped:false}); const sg=new T.PlaneGeometry(SW,SH,16,12); { const p=sg.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i)/(SW/2), y=p.getY(i)/(SH/2); p.setZ(i,0.02*(1-0.5*(x*x+y*y))); } sg.computeVertexNormals(); }
 const scr=new T.Mesh(sg,scrM); scr.position.set(TVX-0.04,0.5+0.33,TVZ-0.3); scr.rotation.y=Math.PI; G.add(scr);
 const scC=document.createElement('canvas'); scC.width=256; scC.height=192; const scX=scC.getContext('2d'); const scT=new T.CanvasTexture(scC); scT.colorSpace=T.SRGBColorSpace;
 // ---------- Gedrucktes (ein Atlas, 1 Draw Call): Zeitschriften, VHS-Hüllen, Kassetten, Platten, Bilder ----------
 const AT=K.canvasTex(1024,1024,(x)=>{ const cell=(c,r,w,h,fn)=>{ x.save(); x.translate(c*128,r*128); x.beginPath(); x.rect(0,0,w*128,h*128); x.clip(); fn(w*128,h*128); x.restore(); };
  const mag=(c,r,bg,title,sub,col)=>cell(c,r,1,1,(w,h)=>{ x.fillStyle=bg; x.fillRect(0,0,w,h); x.fillStyle=col; x.font='900 30px sans-serif'; x.fillText(title,8,34); x.font='600 11px sans-serif'; x.fillStyle='#fff'; x.fillText(sub,8,118); const g=x.createRadialGradient(64,76,4,64,76,40); g.addColorStop(0,'rgba(255,220,180,0.9)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(20,44,88,64); });
  mag(0,0,'#c81e1e','STERN','SCHNUPPE · Heft 41','#fff'); mag(1,0,'#1e4ec8','BRAVOUR','Poster: Die Zwei','#ffe000'); mag(2,0,'#e8e0c8','HÖR MAL','TV · 6.–12. Mai','#c81e1e'); mag(3,0,'#202020','CHIP-CHIP','Heimcomputer-Test','#3cf');
  const vhs=(c,r,bg,t,col)=>cell(c,r,1,1,(w,h)=>{ x.fillStyle=bg; x.fillRect(0,0,w,h); x.fillStyle=col; { let fs=22, L=[t]; const fit=()=>{ x.font='800 italic '+fs+'px serif'; L=[]; let ln=''; t.split(' ').forEach(wd=>{ const tt=ln?ln+' '+wd:wd; if(x.measureText(tt).width>w-14&&ln){ L.push(ln); ln=wd; } else ln=tt; }); L.push(ln); return L.length<=3&&L.every(l=>x.measureText(l).width<=w-14); }; while(!fit()&&fs>11) fs--; L.forEach((l,i)=>x.fillText(l,8,64-(L.length-1)*fs*0.55+i*fs*1.1)); } x.fillStyle='rgba(255,255,255,0.7)'; x.fillRect(8,96,60,10); x.font='600 9px sans-serif'; x.fillStyle='#000'; x.fillText('VHS · PAL',10,104); });
  vhs(4,0,'#0b0b10','Zurück ins Morgen','#e8b030'); vhs(5,0,'#3a0808','Der große Fisch kehrt zurück','#fff'); vhs(6,0,'#101a10','Die Knuddelmonster','#9f6'); vhs(7,0,'#222','LEER – nicht überspielen!','#ddd');
  const cass=(c,r,lab,col)=>cell(c,r,1,1,(w,h)=>{ x.fillStyle='#e8e2d2'; x.fillRect(0,0,w,h); x.fillStyle=col; x.fillRect(0,0,w,26); x.fillStyle='#1a1a1a'; x.font='22px "Kalam",cursive'; x.fillText(lab,8,64); x.fillStyle='#2a2a2a'; x.fillRect(22,80,84,28); x.fillStyle='#e8e2d2'; x.beginPath(); x.arc(42,94,9,0,7); x.arc(86,94,9,0,7); x.fill(); });
  cass(0,1,'Mixtape 87','#c33'); cass(1,1,'Für M. ♥','#36c'); cass(2,1,'Hitparade','#d90'); cass(3,1,'NICHT löschen','#393');
  const rec=(c,r,bg,t)=>cell(c,r,1,1,(w,h)=>{ x.fillStyle=bg; x.fillRect(0,0,w,h); x.strokeStyle='rgba(255,255,255,0.5)'; x.lineWidth=3; for(let i=0;i<5;i++){ x.beginPath(); x.arc(64,64,12+i*10,0,7); x.stroke(); } x.fillStyle='#fff'; x.font='700 14px sans-serif'; x.fillText(t,8,120); });
  rec(4,1,'#6a2a7a','NEONWELLE'); rec(5,1,'#d0a020','Die Funkies'); rec(6,1,'#205a5a','Synth & Söhne'); rec(7,1,'#8a1a1a','Rote Lippen');
  // Familienfoto (Gesicht verwischt), Landschaftsbild
  cell(0,2,2,2,(w,h)=>{ x.fillStyle='#d8cfb8'; x.fillRect(0,0,w,h); x.fillStyle='#7a6a50'; x.fillRect(14,14,w-28,h-28); const g=x.createLinearGradient(0,14,0,h-14); g.addColorStop(0,'#8a9aa8'); g.addColorStop(1,'#5a5040'); x.fillStyle=g; x.fillRect(18,18,w-36,h-36); [[70,150,'#7a3a2a'],[128,140,'#3a4a6a'],[186,156,'#6a6a3a']].forEach(([cx,cy,col])=>{ x.fillStyle=col; x.fillRect(cx-24,cy,48,90); x.fillStyle='#c8a888'; x.beginPath(); x.arc(cx,cy-18,17,0,7); x.fill(); }); x.filter='blur(6px)'; x.fillStyle='#b89878'; x.beginPath(); x.arc(128,122,18,0,7); x.fill(); x.filter='none'; x.fillStyle='rgba(255,240,200,0.12)'; x.fillRect(18,18,w-36,h-36); });
  cell(2,2,2,2,(w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#3a4a5a'); g.addColorStop(0.55,'#c89050'); g.addColorStop(0.56,'#2a3a2a'); g.addColorStop(1,'#1a2014'); x.fillStyle=g; x.fillRect(0,0,w,h); x.fillStyle='#1a1a14'; for(let i=0;i<12;i++){ const px=i*24, ph=40+Math.random()*50; x.beginPath(); x.moveTo(px,h*0.56); x.lineTo(px+12,h*0.56-ph); x.lineTo(px+24,h*0.56); x.fill(); } x.strokeStyle='#6a4a20'; x.lineWidth=14; x.strokeRect(0,0,w,h); });
  // Walkman-Front, Handheld-Display (Atlas-Zellen)
  cell(4,2,1,1,(w,h)=>{ x.fillStyle='#2a3a6a'; x.fillRect(0,0,w,h); x.fillStyle='#c8c8d0'; x.fillRect(10,10,108,60); x.fillStyle='#222'; x.fillRect(18,18,92,44); x.fillStyle='#eee'; x.font='800 14px sans-serif'; x.fillText('WALKMEN',20,96); x.font='9px sans-serif'; x.fillText('STEREO · DOLBY-ISH',20,112); });
  cell(5,2,1,1,(w,h)=>{ x.fillStyle='#c8c4b8'; x.fillRect(0,0,w,h); x.fillStyle='#4a4a58'; x.fillRect(16,10,96,70); x.fillStyle='#8a9a2a'; x.fillRect(26,18,76,54); x.fillStyle='#2a3a10'; x.font='700 11px monospace'; x.fillText('SPIELKNABE',30,46); x.fillStyle='#8a1a4a'; x.beginPath(); x.arc(94,104,9,0,7); x.arc(76,112,9,0,7); x.fill(); x.fillStyle='#222'; x.fillRect(18,100,28,8); x.fillRect(28,90,8,28); });
  // Holzmaserung für Zigarettenschachtel / Aschenbecher-Glas
  cell(6,2,1,1,(w,h)=>{ x.fillStyle='#e8e0d0'; x.fillRect(0,0,w,h); x.fillStyle='#a8241c'; x.fillRect(0,0,w,46); x.fillStyle='#fff'; x.font='800 18px serif'; x.fillText('Kamel-Rot',10,32); x.fillStyle='#222'; x.font='8px sans-serif'; x.fillText('Rauchen gefährdet die Gesundheit',6,120); });
 });
 const mAt=K.std({map:AT,roughness:0.55});
 const at=(c,r,w,h)=>{ w=w||1; h=h||1; return [c/8,1-(r+h)/8,(c+w)/8,1-r/8]; };
 // Zeitschriften auf dem Couchtisch + Boden
 [[0,21.0,0.425,-0.2,0.3],[1,21.08,0.429,-0.16,0.5],[2,18.9,0.012,-1.1,-0.4],[3,21.9,0.425,0.05,-0.2]].forEach(([i,x,y,z,r])=>B.put('at',new T.BoxGeometry(0.21,0.006,0.28),x,y,z,0xffffff,[0,r,0],{uvr:at(i,0)}));
 // VHS-Stapel neben dem TV-Schrank
 [[4,0],[5,1],[6,2],[7,3]].forEach(([c,i])=>B.put('at',new T.BoxGeometry(0.19,0.026,0.105),22.6,0.013+i*0.027,2.15,0xffffff,[0,0.1*i-0.15,0],{uvr:at(c,0)}));
 // Platten an der Schrankwand gelehnt
 [4,5,6,7].forEach((c,i)=>B.put('at',new T.BoxGeometry(0.31,0.31,0.006),18.6+i*0.012,0.155,-0.25-i*0.05,0xffffff,[0,Math.PI/2,-0.18+i*0.04],{uvr:at(c,1)}));
 // Bilder an der Wand
 B.put('at',new T.BoxGeometry(0.42,0.34,0.02),22.0,1.55,Z0+0.012,0xffffff,null,{uvr:at(0,2,2,2)}); B.put('at',new T.BoxGeometry(0.62,0.5,0.025),X0+0.013,1.6,1.65,0xffffff,[0,Math.PI/2,0],{uvr:at(2,2,2,2)});
 // Familienfoto in der Schrankwand
 B.put('at',new T.BoxGeometry(0.16,0.13,0.012),18.28,1.27,-1.45,0xffffff,[0,Math.PI/2+0.25,0],{uvr:at(0,2,2,2)});
 // Bücher in der Schrankwand
 for(let s=0;s<2;s++){ let z=-2.25; while(z<-0.45){ const w=0.025+Math.random()*0.035, hh=0.18+Math.random()*0.12; const cols=[0x6a1e1a,0x1e3a5a,0x2a4a2a,0x8a7a5a,0x3a2a1a,0x5a4a6a]; B.box('pl',18.06,18.06+0.17+Math.random()*0.04,s?1.575:1.975,(s?1.575:1.975)+hh,z,z+w,cols[(Math.random()*6)|0],{jit:0.15}); z+=w+0.004; if(Math.random()<0.08) z+=0.12; } }
 // Aschenbecher (Glas, dunkel) mit Kippen + Zigarettenschachtel
 B.cyl('pl',0.07,0.06,0.035,21.55,0.437,-0.32,0x3a3a34,null,18); B.cyl('pl',0.05,0.05,0.005,21.55,0.455,-0.32,0x1a1a18,null,18);
 [[0.02,0.01,0.4],[-0.02,0.015,1.6],[0.0,-0.025,2.6]].forEach(([a,b,r])=>B.cyl('pa',0.0045,0.0045,0.045,21.55+a,0.462,-0.32+b,0xd8d0c0,[0,r,Math.PI/2],6));
 B.put('at',new T.BoxGeometry(0.055,0.085,0.022),21.72,0.462,-0.18,0xffffff,[Math.PI/2,0.4,0],{uvr:at(6,2)});
 // Stehlampe (Messing, Stoffschirm) – Licht sitzt im Schirm
 const LX=23.05, LZ=-1.95; B.cyl('mt',0.13,0.15,0.03,LX,0.015,LZ,0x6a5228,null,20); B.cyl('mt',0.012,0.012,1.45,LX,0.75,LZ,0x8a6a30,null,8);
 const shade=new T.Mesh(new T.CylinderGeometry(0.17,0.26,0.3,28,1,true),new T.MeshStandardMaterial({color:0xd8b880,roughness:1,side:T.DoubleSide,emissive:0x5a3a18,emissiveIntensity:0.6})); shade.position.set(LX,1.6,LZ); G.add(shade);
 K.glow(G,LX,1.52,LZ,0.5,0xffffff,0.55);
 // Fenster: Nacht, Straßenlaterne, Regen auf der Scheibe
 { const z0=WIN.z-WIN.w/2; const outT=K.canvasTex(256,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#05070c'); g.addColorStop(1,'#101418'); x.fillStyle=g; x.fillRect(0,0,w,h); for(let i=0;i<5;i++){ x.fillStyle='rgba(255,190,90,'+(0.25+Math.random()*0.4)+')'; x.fillRect(20+Math.random()*200,120+Math.random()*90,6,9); } const s=x.createRadialGradient(190,60,2,190,60,70); s.addColorStop(0,'rgba(255,170,80,0.9)'); s.addColorStop(1,'rgba(255,150,60,0)'); x.fillStyle=s; x.fillRect(0,0,w,h); x.fillStyle='rgba(180,190,210,0.25)'; for(let i=0;i<120;i++){ x.fillRect(Math.random()*w,Math.random()*h,1.2,2+Math.random()*4); } });
  const win=new T.Mesh(new T.PlaneGeometry(WIN.w,WIN.y1-WIN.y0),new T.MeshBasicMaterial({map:outT,color:0x9a9a9a,fog:false})); win.position.set(X1+0.18,(WIN.y0+WIN.y1)/2,WIN.z); win.rotation.y=-Math.PI/2; G.add(win);
  // Gardine (halb zugezogen)
  const cur=K.tex('assets/tex/k84/curtain_c.jpg',1,[2,1]); const cm=new T.MeshStandardMaterial({map:cur,color:0x8a7a60,roughness:1,side:T.DoubleSide,transparent:true,opacity:0.92}); const cg=new T.PlaneGeometry(0.55,1.6,24,1); { const p=cg.attributes.position; for(let i=0;i<p.count;i++) p.setZ(i,Math.sin(p.getX(i)*38)*0.025); cg.computeVertexNormals(); }
  [z0-0.12,z0+WIN.w-0.43].forEach(z=>{ const c=new T.Mesh(cg,cm); c.position.set(X1-0.1,1.4,z+0.27); c.rotation.y=-Math.PI/2; G.add(c); }); }
 // ---------- Kassettenrekorder ("Ghettoblaster") auf der Schrankwand ----------
 const GB=new T.Group(); GB.position.set(18.28,1.17,-0.95); GB.rotation.y=Math.PI/2; G.add(GB);
 const gbB=new K.Batch(); gbB.put('pl',K.roundBox(0.52,0.26,0.12,0.025),0,0.13,0,0x2a2a2c); gbB.put('mt',new T.BoxGeometry(0.48,0.016,0.016),0,0.285,0,0xbfbfc4); gbB.box('mt',-0.235,-0.22,0.24,0.29,-0.008,0.008,0xbfbfc4); gbB.box('mt',0.22,0.235,0.24,0.29,-0.008,0.008,0xbfbfc4);
 [-0.17,0.17].forEach(x=>{ gbB.cyl('mt',0.072,0.072,0.012,x,0.13,0.062,0x5a5a60,[Math.PI/2,0,0],24); gbB.cyl('pl',0.06,0.055,0.014,x,0.13,0.066,0x0c0c0c,[Math.PI/2,0,0],24); });
 gbB.box('pl',-0.07,0.07,0.07,0.19,0.06,0.066,0x111114); for(let i=0;i<5;i++) gbB.box('mt',-0.09+i*0.045,-0.06+i*0.045,0.262,0.272,0.0,0.04,0xa8a8ae);
 gbB.build(GB,{pl:K.std({color:0xffffff,roughness:0.5}),mt:K.std({color:0xffffff,roughness:0.35,metalness:0.6})});
 const reels=[-0.03,0.03].map(x=>{ const r=new T.Mesh(new T.CylinderGeometry(0.016,0.016,0.004,12),new T.MeshStandardMaterial({color:0xd8d0c0})); r.rotation.x=Math.PI/2; r.position.set(x,0.13,0.067); GB.add(r); return r; });
 const gbHit=new T.Mesh(new T.BoxGeometry(0.56,0.32,0.18),new T.MeshBasicMaterial({visible:false})); gbHit.position.y=0.14; GB.add(gbHit);
 // ---------- Wählscheibentelefon auf Beistelltisch ----------
 B.box('wd',19.85,20.35,0.0,0.55,-2.3,-1.8,OAK,{ao:oa}); B.box('wd',19.83,20.37,0.55,0.58,-2.32,-1.78,OAKD);
 const PH=new T.Group(); PH.position.set(20.1,0.58,-2.02); PH.rotation.y=0.35; G.add(PH);
 const phB=new K.Batch(), ORANGE=0xb8501e; phB.put('p',K.roundBox(0.2,0.09,0.22,0.03),0,0.045,0,ORANGE); phB.cyl('p',0.07,0.07,0.012,0,0.09,0.03,0xd8d0c0,[-0.35,0,0],24); phB.cyl('p',0.025,0.025,0.016,0,0.095,0.03,ORANGE,[-0.35,0,0],16);
 for(let i=0;i<10;i++){ const a=i/10*Math.PI*1.6+0.6; phB.cyl('p',0.009,0.009,0.004,Math.cos(a)*0.05,0.098+Math.sin(a)*0.05*Math.sin(0.35)*0,0.03+Math.sin(a)*0.05,0x222222,[-0.35,0,0],8); }
 phB.build(PH,{p:K.std({color:0xffffff,roughness:0.35})});
 const HS=new T.Group(); HS.position.set(0,0.12,-0.06); PH.add(HS); { const hb=new K.Batch(); hb.put('p',K.roundBox(0.22,0.035,0.05,0.016),0,0,0,ORANGE); hb.put('p',K.roundBox(0.06,0.04,0.065,0.02),-0.09,-0.012,0,ORANGE); hb.put('p',K.roundBox(0.06,0.04,0.065,0.02),0.09,-0.012,0,ORANGE); hb.build(HS,{p:K.std({color:0xffffff,roughness:0.35})}); }
 const cord=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([[0.1,0.03,-0.02],[0.16,0.0,0.05],[0.13,-0.05,0.1],[0.05,-0.02,0.12],[0.0,0.0,0.1]].map(v=>new T.Vector3(...v))),24,0.004,5),K.std({color:ORANGE,roughness:0.4})); PH.add(cord);
 const phHit=new T.Mesh(new T.BoxGeometry(0.3,0.22,0.3),new T.MeshBasicMaterial({visible:false})); phHit.position.y=0.08; PH.add(phHit);
 // ---------- Greifbare Dinge: Kassetten, Walkman, Handheld, Würfel ----------
 const grabs=[];
 const gm=(mesh,x,y,z,ry,name,say)=>{ mesh.position.set(x,y,z); mesh.rotation.y=ry; G.add(mesh); grabs.push({obj:mesh,name,say}); return mesh; };
 const cassMesh=c=>{ const g=new T.BoxGeometry(0.1,0.064,0.014); const m=[K.std({color:0x222222,roughness:0.4}),K.std({color:0x222222,roughness:0.4}),K.std({color:0x222222}),K.std({color:0x222222}),mAt,mAt]; const me=new T.Mesh(g,m); g.groups.forEach(()=>{}); const u=g.attributes.uv, [u0,v0,u1,v1]=at(c,1); for(let i=16;i<24;i++) u.setXY(i,u0+u.getX(i)*(u1-u0),v0+u.getY(i)*(v1-v0)); me.rotation.x=-Math.PI/2; const wr=new T.Group(); wr.add(me); me.position.y=0.007; return wr; };
 gm(cassMesh(0),21.15,0.42,0.12,0.4,'Kassette',null); gm(cassMesh(1),18.75,0.0,-0.55,1.2,'Kassette',null); gm(cassMesh(3),21.7,0.42,0.18,-0.6,'Kassette',null);
 { const w=new T.Group(); const b=new T.Mesh(K.roundBox(0.09,0.12,0.03,0.008),[mAt][0]); const u=b.geometry.attributes.uv, [u0,v0,u1,v1]=at(4,2); for(let i=0;i<u.count;i++) u.setXY(i,u0+u.getX(i)*(u1-u0),v0+u.getY(i)*(v1-v0)); b.rotation.x=-Math.PI/2; b.position.y=0.015; w.add(b); const ph=new T.Mesh(new T.TorusGeometry(0.07,0.004,6,24,Math.PI),K.std({color:0x333333})); ph.rotation.x=-Math.PI/2; ph.position.set(0,0.004,-0.11); w.add(ph); [-0.07,0.07].forEach(x=>{ const e=new T.Mesh(new T.CylinderGeometry(0.022,0.022,0.012,14),K.std({color:0xd8701a,roughness:1})); e.position.set(x,0.006,-0.11); w.add(e); }); gm(w,22.6,0.55,-1.85,0.5,'Walkman'); }
 { const h=new T.Group(); const b=new T.Mesh(K.roundBox(0.09,0.145,0.03,0.01),mAt); const u=b.geometry.attributes.uv, [u0,v0,u1,v1]=at(5,2); for(let i=0;i<u.count;i++) u.setXY(i,u0+u.getX(i)*(u1-u0),v0+u.getY(i)*(v1-v0)); b.rotation.x=-Math.PI/2; b.position.y=0.015; h.add(b); gm(h,19.5,0.53,1.0,2.4,'Spielknabe'); }
 { const c=new T.Group(); const cols=[0xc81e1e,0x1e8a2e,0x1e3ec8,0xe8c81e,0xe86a1e,0xeeeeee]; const base=new T.Mesh(new T.BoxGeometry(0.057,0.057,0.057),K.std({color:0x0a0a0a,roughness:0.4})); c.add(base); const st=new T.BoxGeometry(0.016,0.016,0.002);
  const fm=cols.map(cc=>K.std({color:cc,roughness:0.35})); const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]; const tmp=new K.Batch(); dirs.forEach((d,f)=>{ for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ const col=cols[(f+((i+2)*(j+3))%3)%6]; const p=[0,0,0]; const a=d[0]?[1,2]:d[1]?[0,2]:[0,1]; p[d.findIndex(v=>v)]=d.find(v=>v)*0.0287; p[a[0]]=i*0.019; p[a[1]]=j*0.019; tmp.put('s',new T.BoxGeometry(d[0]?0.002:0.016,d[1]?0.002:0.016,d[2]?0.002:0.016),p[0],p[1],p[2],col); } }); tmp.build(c,{s:K.std({color:0xffffff,roughness:0.3})}); c.position.y=0.0285;
  const w=new T.Group(); w.add(c); c.rotation.y=0.3; gm(w,21.45,0.42,0.18,0.2,'Zauberwürfel'); }
 // ---------- Materialien + Bau ----------
 const wpT=K.canvasTex(512,512,(x,w,h)=>{ x.fillStyle='#cdb894'; x.fillRect(0,0,w,h); for(let i=0;i<8;i++){ x.fillStyle=i%2?'rgba(120,80,40,0.16)':'rgba(255,240,210,0.08)'; x.fillRect(i*64,0,32,h); }
  for(let i=0;i<8;i++) for(let j=0;j<4;j++){ const cx=i*64+48, cy=j*128+(i%2?64:0)+32; x.strokeStyle='rgba(110,60,30,0.38)'; x.lineWidth=2.5; for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; x.beginPath(); x.ellipse(cx+Math.cos(a)*8,cy+Math.sin(a)*8,7,4,a,0,7); x.stroke(); } x.fillStyle='rgba(140,70,20,0.5)'; x.beginPath(); x.arc(cx,cy,3,0,7); x.fill(); }
  const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(110,80,20,0.25)'); g.addColorStop(1,'rgba(60,40,10,0.08)'); x.fillStyle=g; x.fillRect(0,0,w,h); const d=x.getImageData(0,0,w,h); for(let i=0;i<d.data.length;i+=4){ const n=(Math.random()-0.5)*14; d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n; } x.putImageData(d,0,0); });
 const hkT=K.canvasTex(512,256,(x,w,h)=>{ const cols=['#c8641e','#8a5a1e','#6a6a2a','#d8b060','#3a2a1a']; for(let i=0;i<8;i++) for(let j=0;j<4;j++){ const X=i*64,Y=j*64; for(let k=0;k<4;k++){ x.fillStyle=cols[(i+j+k)%5]; x.fillRect(X+k*7,Y+k*7,64-k*14,64-k*14); } x.strokeStyle='#1a120a'; x.lineWidth=4; x.strokeRect(X+2,Y+2,60,60); }
  const d=x.getImageData(0,0,w,h); for(let i=0;i<d.data.length;i+=4){ const n=(Math.random()-0.5)*40; d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n; } x.putImageData(d,0,0); });
 const fab=K.tex('assets/tex/kirmes/Fabric/Fabric045_1K-JPG_Color.jpg',1,[3,3]), fabN=K.tex('assets/tex/kirmes/Fabric/Fabric045_1K-JPG_NormalGL.jpg',0,[3,3]);
 const mats={ fl:K.std({map:K.tex('assets/tex/kirmes/WoodFloor/WoodFloor051_1K-JPG_Color.jpg',1),normalMap:K.tex('assets/tex/kirmes/WoodFloor/WoodFloor051_1K-JPG_NormalGL.jpg'),roughnessMap:K.tex('assets/tex/kirmes/WoodFloor/WoodFloor051_1K-JPG_Roughness.jpg'),roughness:1}),
  ce:K.std({map:K.tex('assets/tex/k84/ceil_c.jpg',1),roughness:0.95}), wp:K.std({map:wpT,normalMap:K.tex('assets/tex/kirmes/Painted/PaintedPlaster017_1K-JPG_NormalGL.jpg'),roughness:0.9}),
  wd:K.std({map:K.tex('assets/tex/ph/wood_table_001_diff.jpg',1,[1,1]),roughness:0.62}), so:K.std({map:fab,normalMap:fabN,roughness:1}), hk:K.std({map:hkT,roughness:1}),
  pl:K.std({color:0xffffff,roughness:0.45}), mt:K.std({color:0xffffff,roughness:0.35,metalness:0.55}), pa:K.std({color:0xffffff,roughness:0.85}), at:mAt };
 mats.wp.normalScale.set(0.4,0.4); mats.wd.map.wrapS=mats.wd.map.wrapT=T.RepeatWrapping;
 B.D.wd&&B.D.wd.forEach(g=>{ const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv; for(let i=0;i<p.count;i++){ const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)); if(ay>0.5) u.setXY(i,p.getX(i)*0.9,p.getZ(i)*0.9); else if(ax>0.5) u.setXY(i,p.getZ(i)*0.9,p.getY(i)*0.9); else u.setXY(i,p.getX(i)*0.9,p.getY(i)*0.9); } });
 B.build(G,mats);
 // ---------- Licht (3 + schwache Hemi) ----------
 const lamp=new T.PointLight(0xffb06a,2.3,6.5,2); lamp.position.set(LX,1.55,LZ); G.add(lamp);
 const tvL=new T.PointLight(0x9ab8ff,0,4.5,2); tvL.position.set(TVX,0.85,TVZ-0.7); G.add(tvL);
 const street=new T.PointLight(0xff9a50,0.55,4.0,2); street.position.set(X1-0.25,1.9,WIN.z); G.add(street);
 const hemi=new T.HemisphereLight(0x2a2838,0x0c0806,0.22); G.add(hemi);
 // ---------- Interaktion: Fernseher (Rauschen → Fake-Werbung), Rekorder (Melodie), Telefon (Mara) ----------
 let tvOn=false, tvT0=0; const ad=new Audio((K.ROOT||'../')+'assets/vo/apt/ad_wuerfel.mp3'); ad.volume=0.75; let stat=null;
 const tvToggle=()=>{ tvOn=!tvOn; tvT0=performance.now(); if(tvOn){ scr.material=new T.MeshBasicMaterial({map:scT,toneMapped:false}); (K.sfx||window.aptSFX||(()=>null))('crt_on',0.6); stat=(K.sfx||window.aptSFX||(()=>null))('tv_static',0.25,true); } else { scr.material=scrM; tvL.intensity=0; try{ ad.pause(); ad.currentTime=0; }catch(e){} if(stat){ stat.stop(); stat=null; } (K.sfx||window.aptSFX||(()=>null))('door_latch',0.25); } };
 const drawTV=(now)=>{ const t=(now-tvT0)/1000, x=scX, w=256, h=192; const AD0=1.4, AD1=AD0+8.5;
  if(t<AD0||t>AD1){ const id=x.createImageData(w,h); for(let i=0;i<id.data.length;i+=4){ const v=Math.random()*200; id.data[i]=id.data[i+1]=id.data[i+2]=v; id.data[i+3]=255; } x.putImageData(id,0,0); if(t>AD1&&!drawTV.s2){ drawTV.s2=1; } tvL.intensity=0.6+Math.random()*0.25; if(stat) stat.vol(0.25); }
  else { if(stat) stat.vol(0.02); if(!drawTV.played){ drawTV.played=1; try{ ad.currentTime=0; ad.play(); }catch(e){} } const k=t-AD0; const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2a0a4a'); g.addColorStop(1,'#d0306a'); x.fillStyle=g; x.fillRect(0,0,w,h);
   for(let i=0;i<14;i++){ x.fillStyle='rgba(255,255,255,0.08)'; x.fillRect(0,(i*14+k*40)%h,w,6); }
   x.save(); x.translate(w/2,h*0.46); x.rotate(k*1.3); const cs=['#e33','#3c4','#36f','#fd2','#f82','#fff']; for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ x.fillStyle=cs[(i+j*3+9+Math.floor(k*2))%6]; x.fillRect(i*22-10,j*22-10,20,20); } x.restore();
   x.fillStyle='#ffe000'; x.font='900 italic 26px sans-serif'; x.textAlign='center'; x.fillText(k<4.2?'DER WÜRFEL-':'JETZT NEU', w/2, 32); x.fillText(k<4.2?'KNALLER!':'IM FACHHANDEL', w/2, h-18); x.textAlign='left';
   x.fillStyle='rgba(0,0,0,0.25)'; for(let y=0;y<h;y+=3) x.fillRect(0,y,w,1); tvL.intensity=0.9; tvL.color.setHex(0xd070c0); }
  if(t>AD1+1.5){ drawTV.played=0; tvT0=now-AD0*0.0; } if(t<AD0||t>AD1) tvL.color.setHex(0x9ab8ff); scT.needsUpdate=true; };
 // Rekorder: kurze Spieluhr-Melodie (synthetisiert, eigene Komposition) + Bandrauschen
 let tapeUntil=0; const tapePlay=()=>{ if(performance.now()<tapeUntil) return; (K.sfx||window.aptSFX||(()=>null))('tape_play',0.6); const ac=window.__zsaAC; if(!ac) return; const t0=ac.currentTime+0.9; const N=[[659,0.4],[784,0.4],[880,0.8],[784,0.4],[659,0.4],[587,0.8],[523,0.4],[587,0.4],[659,0.6],[523,0.6],[440,1.2]]; let t=t0;
  const out=ac.createGain(); out.gain.value=0.16; const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2600; out.connect(lp); lp.connect(ac.destination);
  N.forEach(([f,d])=>{ [1,2.01].forEach((m,i)=>{ const o=ac.createOscillator(), g=ac.createGain(); o.type=i?'sine':'triangle'; o.frequency.setValueAtTime(f*m,t); o.frequency.linearRampToValueAtTime(f*m*(1+0.004*Math.sin(t*5)),t+d); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(i?0.25:0.9,t+0.015); g.gain.exponentialRampToValueAtTime(0.001,t+d*1.6); o.connect(g); g.connect(out); o.start(t); o.stop(t+d*1.7); }); t+=d*0.92; });
  const dur=t-t0+1.2; tapeUntil=performance.now()+(dur+1)*1000; const hb=ac.createBuffer(1,ac.sampleRate*dur,ac.sampleRate), hd=hb.getChannelData(0); for(let i=0;i<hd.length;i++) hd[i]=(Math.random()*2-1)*0.02; const hs=ac.createBufferSource(); hs.buffer=hb; const hf=ac.createBiquadFilter(); hf.type='highpass'; hf.frequency.value=3000; hs.connect(hf); hf.connect(ac.destination); hs.start(t0-0.3); };
 let phoneUp=0; const tick=(now,dt)=>{ if(tvOn) drawTV(now); const tp=now<tapeUntil; reels.forEach(r=>{ if(tp) r.rotation.y+=dt*6; });
  HS.position.y+=((phoneUp?0.32:0.12)-HS.position.y)*Math.min(1,dt*6); HS.rotation.z+=((phoneUp?0.5:0)-HS.rotation.z)*Math.min(1,dt*6); HS.position.x+=((phoneUp?-0.06:0)-HS.position.x)*Math.min(1,dt*6);
  lamp.intensity=2.3*(0.985+0.015*Math.sin(now*0.013)); };
 const solid=[[20.5,23.2,-2.4,-1.5],[20.95,22.35,1.9,2.4],[18,18.5,-2.3,0.1],[20.7,21.9,-0.48,0.28],[19.85,20.35,-2.3,-1.8],[18.95,19.75,0.55,1.35],[22.9,23.2,-2.1,-1.8],[22.5,22.75,2.0,2.3]];
 const collide=p=>{ const r=0.22; p.x=cl(p.x,X0+r,X1-r); p.z=cl(p.z,Z0+r,Z1-r); for(const [a0,a1,b0,b1] of solid){ if(p.x>a0-r&&p.x<a1+r&&p.z>b0-r&&p.z<b1+r){ const c=[[p.x-(a0-r),'x',a0-r],[(a1+r)-p.x,'x',a1+r],[p.z-(b0-r),'z',b0-r],[(b1+r)-p.z,'z',b1+r]].filter(e=>e[1]==='x'?(e[2]>=X0+r-1e-3&&e[2]<=X1-r+1e-3):(e[2]>=Z0+r-1e-3&&e[2]<=Z1-r+1e-3)).sort((u,v)=>u[0]-v[0])[0]; if(c) p[c[1]]=c[2]; } } };
 const surf=[[21.3,-0.1,1.2,0.76,0.42],[21.65,2.15,1.4,0.46,0.5],[22.6,2.15,0.25,0.2,0.11],[21.85,-1.95,2.7,0.88,0.5],[20.1,-2.05,0.5,0.5,0.58],[19.35,0.95,0.7,0.7,0.53],[18.25,-1.1,0.45,2.4,0.75]];
 return {group:G,lights:[lamp,tvL,street,hemi],collide,surf,X0,X1,Z0,Z1,
  doors:{kitchen:{pos:[X0+0.02,DW.z],face:[1,0],w:DW.w,spawn:[X0+0.8,DW.z],yaw:-Math.PI/2},office:{pos:[DS.x,Z0+0.02],face:[0,1],w:DS.w,spawn:[DS.x,Z0+0.8],yaw:Math.PI}},
  interact:[{hit:scr,fn:tvToggle,name:'tv'},{hit:gbHit,fn:tapePlay,name:'tape'},{hit:phHit,fn:()=>window.aptPhone&&aptPhone(PH),name:'phone'}],
  grabs, tick, setPhone:v=>{ phoneUp=v; }, tvScreen:{w:SW,h:SH} };
};
})();
