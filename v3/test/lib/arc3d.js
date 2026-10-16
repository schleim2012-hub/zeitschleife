/* Spielhalle 1984 – kurz vor Ladenschluss. Echtes 3D (Look nach neon_gasse.jpg): Schwarzlicht-Teppich, Reihen von Automaten (instanziert),
   Attract-Mode-Bildschirme (1 animierte Atlas-Textur), Marquees (1 Atlas), Bildschirm-Schein im Rauch, Kasse mit WECHSELGELD, HIGH SCORE-Neon fern.
   Licht: nur praktisch (Magenta fern, Cyan Mitte, Kasse warm). window.buildArcade84(sceneEl,C) */
(function(){
let sd=8484; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
window.buildArcade84=function(sc,C){ const T=THREE, S=sc.object3D, TL=new T.TextureLoader(), G=new T.Group(); S.add(G); const B='../assets/tex/arc/';
 const ld=(f,srgb,rx,ry)=>{ const t=TL.load(f.includes('/')?f:B+f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; if(rx) t.repeat.set(rx,ry||rx); return t; };
 const cv=(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; t.userData={c}; return t; };
 const XW=4.4, YC=3.2, Z0=4.4, Z1=-16;
 const merge=gs=>{ gs=gs.map(g=>g.index?g.toNonIndexed():g); let n=0; gs.forEach(g=>n+=g.attributes.position.count); const r=new T.BufferGeometry(); Object.keys(gs[0].attributes).forEach(k=>{ if(!gs.every(g=>g.attributes[k])) return; const sz=gs[0].attributes[k].itemSize,a=new Float32Array(n*sz); let o=0; gs.forEach(g=>{ a.set(g.attributes[k].array,o); o+=g.attributes[k].array.length; }); r.setAttribute(k,new T.BufferAttribute(a,sz)); }); return r; };
 const bins={}; const add=(k,g,us)=>{ us=us||1; g=g.index?g.toNonIndexed():g; g.computeVertexNormals(); const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2); for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)); let u,v; if(ny>0.6){u=x;v=z;} else if(nx>0.6){u=z;v=y;} else {u=x;v=y;} uv[i*2]=u*us; uv[i*2+1]=v*us; } g.setAttribute('uv',new T.BufferAttribute(uv,2)); (bins[k]=bins[k]||[]).push(g); };
 const box=(w,h,d,x,y,z)=>{ const g=new T.BoxGeometry(w,h,d); g.translate(x,y,z); return g; };
 const planeY=(w,d,x,y,z,down)=>{ const g=new T.PlaneGeometry(w,d); g.rotateX(down?Math.PI/2:-Math.PI/2); g.translate(x,y,z); return g; };
 const wallX=(x,z0,z1,y0,y1,f)=>{ const g=new T.PlaneGeometry(z0-z1,y1-y0); g.rotateY(f>0?Math.PI/2:-Math.PI/2); g.translate(x,(y0+y1)/2,(z0+z1)/2); return g; };
 const wallZ=(z,x0,x1,y0,y1,f)=>{ const g=new T.PlaneGeometry(x1-x0,y1-y0); if(f<0) g.rotateY(Math.PI); g.translate((x0+x1)/2,(y0+y1)/2,z); return g; };
 // ---- Raum ----
 add('carp',planeY(2*XW,Z0-Z1,0,0,(Z0+Z1)/2),1/1.5); add('ceil',planeY(2*XW,Z0-Z1,0,YC,(Z0+Z1)/2,true),1/1.2);
 add('wall',wallX(-XW,Z0,Z1,0,YC,1),1/2.5); add('wall',wallX(XW,Z0,Z1,0,YC,-1),1/2.5); add('wall',wallZ(Z1,-XW,XW,0,YC,1),1/2.5); add('wall',wallZ(Z0,-XW,XW,0,YC,-1),1/2.5);
 // Deckenleuchten (meist aus) + Kabelkanal
 for(let z=2;z>Z1;z-=3) [-1.8,1.8].forEach(x=>{ add('fix',box(0.3,0.08,1.25,x,YC-0.04,z)); }); add('fix',box(0.15,0.1,Z0-Z1,0,YC-0.05,(Z0+Z1)/2));
 // ---- Automaten-Profil (Seitenansicht: u=vorne, v=oben) ----
 const prof=[[-0.4,0],[0.36,0],[0.36,0.86],[0.47,0.93],[0.45,0.99],[0.21,1.05],[0.22,1.09],[0.09,1.56],[0.17,1.58],[0.21,1.84],[-0.4,1.84]];
 const sh=new T.Shape(); prof.forEach(([u,v],i)=>i?sh.lineTo(u,v):sh.moveTo(u,v)); const CW=0.66;
 const cabG=new T.ExtrudeGeometry(sh,{depth:CW,bevelEnabled:true,bevelThickness:0.012,bevelSize:0.012,bevelSegments:1}); cabG.rotateY(-Math.PI/2); cabG.translate(CW/2,0,0); cabG.computeVertexNormals();
 { const p=cabG.attributes.position, uv=cabG.attributes.uv; for(let i=0;i<p.count;i++) uv.setXY(i,(p.getZ(i)+0.4)/1.0,p.getY(i)/1.84); }
 // Bedienfeld: Joystick + 3 Knöpfe (lokal), Münztür
 const ctl=merge([ (()=>{ const g=new T.CylinderGeometry(0.008,0.008,0.07,6); g.translate(0,0.035,0); return g; })(), (()=>{ const g=new T.SphereGeometry(0.022,8,6); g.translate(0,0.075,0); return g; })(),
   ...[0,1,2].map(i=>{ const g=new T.CylinderGeometry(0.016,0.016,0.012,10); g.translate(0.09+i*0.055,0.004,0.01*(i%2)); return g; })].map(g=>{ g=g.toNonIndexed(); g.translate(-0.12,0,0); g.rotateX(0.24); g.translate(0,0.985,0.33); return g; }));
 // ---- Aufstellung ----
 const cabs=[]; const put=(x,z,ry)=>cabs.push({x,z,ry:ry+(rnd()-0.5)*0.05});
 for(let z=-1.7;z>Z1+0.6;z-=0.72) put(-(XW-0.42),z+(rnd()-0.5)*0.03,Math.PI/2);
 for(let z=1.9;z>Z1+0.6;z-=0.72) if(z<-0.3||z>1.0) put(XW-0.42,z+(rnd()-0.5)*0.03,-Math.PI/2);
 for(let z=-5.6;z>-12.5;z-=0.72){ put(-0.42,z,-Math.PI/2); put(0.42,z,Math.PI/2); }
 const N=cabs.length; const tint=[0x3a3a44,0x8a5a30,0xa02a20,0x2a4aa0,0x2a2a2e,0x7a2a8a,0x3a6a3a,0x9a8a28];
 const sideM=new T.MeshStandardMaterial({map:ld('side_c.jpg',1),roughness:0.55,metalness:0.1}); const cabI=new T.InstancedMesh(cabG,sideM,N); const ctlI=new T.InstancedMesh(ctl,new T.MeshStandardMaterial({color:0xffffff,roughness:0.35}),N);
 const M4=new T.Matrix4(), Q=new T.Quaternion(), V=new T.Vector3(), ONE=new T.Vector3(1,1,1), UP=new T.Vector3(0,1,0);
 const scrQ=[], marQ=[], hq=[], fq=[]; const scrCol=[0x40c0ff,0xff40a0,0xffd040,0x60ff80,0xc0d0ff,0xff6030,0xa060ff,0x404050];
 const pushQ=(arr,w,h,lp,rx,ru,mat,uvr,col)=>{ const g=new T.PlaneGeometry(w,h); g.rotateX(rx); g.translate(lp[0],lp[1],lp[2]); g.applyMatrix4(mat); const uv=g.attributes.uv; if(uvr) for(let i=0;i<uv.count;i++) uv.setXY(i,uvr[0]+uv.getX(i)*uvr[2],uvr[1]+uv.getY(i)*uvr[3]); g.setAttribute('color',new T.Float32BufferAttribute(new Array(4*3).fill(0).map((_,i)=>col[i%3]),3)); arr.push(g.toNonIndexed()); };
 const dead=new Set([5,17,31]), flickS=new Set([11,40]);
 cabs.forEach((c,i)=>{ Q.setFromAxisAngle(UP,c.ry); M4.compose(V.set(c.x,0,c.z),Q,ONE); cabI.setMatrixAt(i,M4); ctlI.setMatrixAt(i,M4); cabI.setColorAt(i,new T.Color(tint[(i*5+3)%8]).multiplyScalar(1.0)); ctlI.setColorAt(i,new T.Color([0xd02020,0x2050e0,0xe0c020,0x20b040][i%4]));
   const tile=dead.has(i)?7:(i*3)%7; const tx=(tile%4)/4, ty=1-(Math.floor(tile/4)+1)/2; const k=dead.has(i)?0.0:1; const sc0=new T.Color(scrCol[tile]);
   pushQ(scrQ,0.5,0.4,[0,1.323,0.19],-0.27,0,M4,[tx+0.004,ty+0.004,0.25-0.008,0.5-0.008],[k,k,k]);
   const mi=i%16; pushQ(marQ,0.6,0.24,[0,1.71,0.226],0.15,0,M4,[(mi%4)/4,1-(Math.floor(mi/4)+1)/5,0.25,0.2],dead.has(i)?[0.15,0.15,0.15]:(()=>{ const b=0.6+rnd()*0.35; return [b,b,b]; })());
   pushQ(marQ,0.1,0.06,[0,0.55,0.385],0,0,M4,[0,0,0.25,0.2*0.98],[1,0.3,0.2]); // Münzeinwurf (rot beleuchtet, unterste Atlaszeile)
   const hc=sc0.clone().multiplyScalar(dead.has(i)?0:0.16); pushQ(hq,1.3,1.1,[0,1.35,0.32],-0.2,0,M4,null,[hc.r,hc.g,hc.b]);
   const fc=sc0.clone().multiplyScalar(dead.has(i)?0:0.3); const fg=new T.PlaneGeometry(1.1,1.3); fg.rotateX(-Math.PI/2); fg.translate(0,0.006,0.95); fg.applyMatrix4(M4); fg.setAttribute('color',new T.Float32BufferAttribute([fc.r,fc.g,fc.b,fc.r,fc.g,fc.b,fc.r,fc.g,fc.b,fc.r,fc.g,fc.b],3)); fq.push(fg.toNonIndexed()); c.tile=tile; });
 cabI.instanceMatrix.needsUpdate=true; G.add(cabI); G.add(ctlI);
 // ---- Bildschirm-Atlas: 4x2 Kacheln à 256², Attract-Mode, ~10 fps ----
 const ST=cv(1024,512,()=>{}); const sx=ST.userData.c.getContext('2d'); ST.minFilter=T.LinearFilter; ST.generateMipmaps=false;
 const stars=[...Array(60)].map(()=>[rnd()*256,rnd()*256,rnd()*2+0.5]); const ast=[...Array(6)].map(()=>[rnd()*256,rnd()*256,(rnd()-0.5)*2,(rnd()-0.5)*2,10+rnd()*18]);
 const drawScreens=(f)=>{ const x=sx; for(let t=0;t<8;t++){ const ox=(t%4)*256, oy=Math.floor(t/4)*256; x.save(); x.beginPath(); x.rect(ox,oy,256,256); x.clip(); x.fillStyle='#020206'; x.fillRect(ox,oy,256,256);
   if(t===0){ stars.forEach(s=>{ s[1]=(s[1]+s[2]*2)%256; x.fillStyle='#cfe8ff'; x.fillRect(ox+s[0],oy+s[1],2,2); }); x.fillStyle='#40c0ff'; const px=128+Math.sin(f*0.07)*80; x.beginPath(); x.moveTo(ox+px,oy+210); x.lineTo(ox+px-14,oy+238); x.lineTo(ox+px+14,oy+238); x.fill(); if(f%6<3){ x.fillStyle='#ff4040'; x.fillRect(ox+px-1,oy+150-(f%20)*6,2,10); } x.fillStyle='#fff'; x.font='bold 16px monospace'; x.fillText('1UP  04250',ox+10,oy+20); }
   if(t===1){ const dx=Math.floor(f/8)%20-10; for(let r=0;r<5;r++) for(let c=0;c<8;c++){ x.fillStyle=['#ff40a0','#ff40a0','#ffd040','#60ff80','#60ff80'][r]; const bx=ox+30+c*25+dx*3, by=oy+40+r*22+Math.floor(f/160)*4; x.fillRect(bx,by,16,10); if((f>>3)%2){ x.fillRect(bx-3,by+8,4,5); x.fillRect(bx+15,by+8,4,5);} else { x.fillRect(bx+2,by+10,3,4); x.fillRect(bx+11,by+10,3,4);} } x.fillStyle='#60ff80'; x.fillRect(ox+100+Math.sin(f*0.05)*70,oy+225,26,10); [40,110,180].forEach(b=>{ x.fillStyle='#30a040'; x.fillRect(ox+b,oy+195,36,12); }); }
   if(t===2){ x.strokeStyle='#2040ff'; x.lineWidth=4; for(let i=0;i<6;i++){ x.strokeRect(ox+16+i*8,oy+16+i*8,224-i*16,224-i*16); if(i==2) break; } x.fillStyle='#ffd0a0'; for(let i=0;i<14;i++){ if(((f>>2)+i)%14>3) x.fillRect(ox+40+i*13,oy+128,4,4); } const a=(f*0.4)%(Math.PI/2); x.fillStyle='#ffd040'; const pxp=ox+40+((f*2)%180); x.beginPath(); x.moveTo(pxp,oy+130); x.arc(pxp,oy+130,12,a*0.5,Math.PI*2-a*0.5); x.fill(); x.fillStyle='#ff4040'; x.beginPath(); x.arc(pxp-50,oy+128,11,Math.PI,0); x.fill(); x.fillRect(pxp-61,oy+128,22,10); }
   if(t===3){ x.fillStyle='#ff40a0'; x.font='bold 26px monospace'; x.textAlign='center'; x.fillText('HIGH SCORES',ox+128,oy+40); x.font='18px monospace'; ['1 MKR 99870','2 ZSL 84210','3 AAA 51200','4 PET 33100','5 ???  1984'].forEach((l,i)=>{ x.fillStyle=['#ffd040','#60ff80','#40c0ff','#c0d0ff','#ff6030'][i]; x.fillText(l,ox+128,oy+80+i*26); }); if((f>>4)%2){ x.fillStyle='#fff'; x.font='bold 20px monospace'; x.fillText('INSERT COIN',ox+128,oy+230); } x.textAlign='left'; }
   if(t===4){ x.strokeStyle='#d8e0ff'; x.lineWidth=2; ast.forEach(a=>{ a[0]=(a[0]+a[2]+256)%256; a[1]=(a[1]+a[3]+256)%256; x.beginPath(); for(let k=0;k<8;k++){ const an=k/8*6.28, r=a[4]*(0.7+0.3*Math.sin(k*2.3)); x.lineTo(ox+a[0]+Math.cos(an)*r,oy+a[1]+Math.sin(an)*r); } x.closePath(); x.stroke(); }); x.save(); x.translate(ox+128,oy+128); x.rotate(f*0.05); x.beginPath(); x.moveTo(0,-10); x.lineTo(7,8); x.lineTo(-7,8); x.closePath(); x.stroke(); x.restore(); }
   if(t===5){ const g=x.createLinearGradient(0,oy,0,oy+110); g.addColorStop(0,'#200830'); g.addColorStop(1,'#ff6030'); x.fillStyle=g; x.fillRect(ox,oy,256,110); for(let i=0;i<14;i++){ const yy=110+i*i*0.8, w=20+i*i*1.3, s=((f>>1)+i)%4<2; x.fillStyle=s?'#303040':'#202028'; x.fillRect(ox+128-w,oy+yy,w*2,6+i); x.fillStyle=s?'#ff4040':'#fff'; x.fillRect(ox+128-w-6,oy+yy,6,6+i); x.fillRect(ox+128+w,oy+yy,6,6+i); } x.fillStyle='#ff2040'; x.fillRect(ox+112+Math.sin(f*0.04)*30,oy+220,32,18); }
   if(t===6){ for(let i=0;i<12;i++){ x.fillStyle=`hsl(${(f*4+i*30)%360},90%,55%)`; x.fillRect(ox,oy+i*22,256,11); } x.fillStyle='#000'; x.fillRect(ox+30,oy+96,196,64); x.fillStyle='#fff'; x.font='bold 40px monospace'; x.textAlign='center'; x.fillText('TURBO',ox+128,oy+142); x.textAlign='left'; }
   if(t===7){ x.fillStyle='#0a0a0e'; x.fillRect(ox,oy,256,256); }
   x.globalAlpha=0.35; x.fillStyle='#000'; for(let y=0;y<256;y+=4) x.fillRect(ox,oy+y,256,2); x.globalAlpha=1; const v=x.createRadialGradient(ox+128,oy+128,80,ox+128,oy+128,190); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.8)'); x.fillStyle=v; x.fillRect(ox,oy,256,256); x.restore(); }
  // „DEFEKT“-Zettel auf Kachel 7 (toter Monitor)
  sx.save(); sx.translate(7%4*256+128,256+128); sx.rotate(-0.12); sx.fillStyle='#d8d4c0'; sx.fillRect(-70,-34,140,68); sx.fillStyle='#202020'; sx.font='bold 30px Arial'; sx.textAlign='center'; sx.fillText('DEFEKT!',0,12); sx.restore(); sx.textAlign='left'; ST.needsUpdate=true; };
 drawScreens(0);
 const scrM=new T.MeshBasicMaterial({map:ST,vertexColors:true,toneMapped:false}); const scr=new T.Mesh(merge(scrQ),scrM); G.add(scr);
 // ---- Marquee-Atlas 4x5 (je 256x102): erfundene Titel, letzte Zeile Münzeinwurf ----
 const titles=[['COSMO CLASH','#40c0ff','#200a40'],['TURBO 84','#ff6030','#300808'],['NEON KNIGHT','#ff40a0','#100820'],['ZYKLOP','#ffd040','#301800'],['ASTRO BLAST','#c0d0ff','#081030'],['DRACHENGRUBE','#60ff80','#082010'],['ROBO WAR','#ff4040','#200808'],['STERNEN-FLOTTE','#a060ff','#100830'],['ZEITSCHLEIFE','#40ffd0','#04201c'],['PIXEL PANIK','#ffd040','#300820'],['CYBER RUN','#40c0ff','#081830'],['MEGA WURM','#80ff40','#102008'],['GALAXO','#ff40a0','#200830'],['BLITZ-JET','#ffffff','#202040'],['HÖHLENKOBOLD','#ff8030','#201004'],['MONDLANDUNG','#c0d0ff','#101018']];
 const MT=cv(1024,512,(x)=>{ titles.forEach(([t,c,b],i)=>{ const ox=(i%4)*256, oy=Math.floor(i/4)*102.4; const g=x.createLinearGradient(0,oy,0,oy+102); g.addColorStop(0,b); g.addColorStop(0.5,'#000'); g.addColorStop(1,b); x.fillStyle=g; x.fillRect(ox,oy,256,102); x.strokeStyle=c; x.lineWidth=3; x.strokeRect(ox+6,oy+6,244,90);
   x.font='bold '+(t.length>11?26:34)+'px Arial Black, Arial'; x.textAlign='center'; x.textBaseline='middle'; x.shadowColor=c; x.shadowBlur=12; x.fillStyle=c; x.fillText(t,ox+128,oy+51); x.shadowBlur=0; x.lineWidth=1.5; x.strokeStyle='#fff'; x.strokeText(t,ox+128,oy+51);
   for(let k=0;k<5;k++){ x.fillStyle=c; x.globalAlpha=0.3; x.beginPath(); x.arc(ox+20+rnd()*216,oy+14+rnd()*74,2+rnd()*3,0,7); x.fill(); x.globalAlpha=1; } });
   x.fillStyle='#200000'; x.fillRect(0,409.6,256,102.4); [70,186].forEach(px=>{ x.fillStyle='#ff3020'; x.fillRect(px-14,440,28,40); x.fillStyle='#200000'; x.fillRect(px-2,448,4,24); }); });
 const marM=new T.MeshBasicMaterial({map:MT,vertexColors:true,toneMapped:false}); G.add(new T.Mesh(merge(marQ),marM));
 const halo=cv(128,128,x=>{ const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.35,'rgba(255,255,255,0.3)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 G.add(new T.Mesh(merge(hq),new T.MeshBasicMaterial({map:halo,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false})));
 G.add(new T.Mesh(merge(fq),new T.MeshBasicMaterial({map:halo,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false})));
 // ---- Kasse hinten links (Eingangsseite) + Wechselautomat ----
 { add('desk',box(1.6,1.05,0.6,-2.6,0.525,3.3)); add('desk',box(1.7,0.05,0.7,-2.6,1.075,3.3)); add('desk',box(0.6,1.6,0.45,-3.95,0.8,3.6)); add('fix',box(0.04,0.9,0.5,-3.4,1.55,3.3)); }
 // Neon-Schilder: HIGH SCORE (fern), WECHSELGELD (Kasse), SPIELHALLE-Pfeil
 const NS=[]; const neonT=(txt,col,w,h,pos,ry,fs)=>{ const t=cv(512,128,(x)=>{ x.fillStyle='#000'; x.fillRect(0,0,512,128); x.font='bold '+(fs||70)+'px Arial'; x.textAlign='center'; x.textBaseline='middle'; x.lineJoin='round'; x.shadowColor=col; [[26,9,col],[10,6,col],[0,2.5,'#ffffffd0']].forEach(([b,l,c])=>{ x.shadowBlur=b; x.strokeStyle=c; x.lineWidth=l; x.strokeText(txt,256,64); }); });
   const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false})); m.position.set(...pos); m.rotation.y=ry; G.add(m); const hs=new T.Sprite(new T.SpriteMaterial({map:halo,color:col,transparent:true,opacity:0.35,blending:T.AdditiveBlending,depthWrite:false})); hs.position.set(pos[0],pos[1],pos[2]+(Math.abs(ry)<0.1?0.2:0)); hs.scale.set(w*1.4,h*2.4,1); G.add(hs); NS.push([m,hs]); };
 neonT('HIGH SCORE',0xff40b0,3.8,0.95,[0,2.62,Z1+0.05],0); neonT('WECHSELGELD',0x40ffe0,1.5,0.38,[-2.6,2.25,Z0-0.04],Math.PI,64);
 // ---- Licht: nur praktisch ----
 const Lm=new T.PointLight(0xff3aa0,4,10,1.6); Lm.position.set(0,2.5,Z1+1.6); G.add(Lm);
 const Lc=new T.PointLight(0x30a8ff,2.6,7,1.6); Lc.position.set(1.2,2.7,-3.2); G.add(Lc);
 const Lk=new T.PointLight(0xffa060,1.6,5,1.6); Lk.position.set(-2.4,2.3,2.8); G.add(Lk);
 S.add(new T.HemisphereLight(0x2a2448,0x0a0610,0.9));
 // Zigarettenrauch: Schichten unter der Decke, driftend
 const smoke=[]; for(let i=0;i<9;i++){ const sp=new T.Sprite(new T.SpriteMaterial({map:halo,color:0x6a5a80,transparent:true,opacity:0.07,depthWrite:false})); sp.position.set((rnd()-0.5)*6,2.3+rnd()*0.7,1-rnd()*15); const s=3+rnd()*3; sp.scale.set(s*1.6,s*0.5,1); sp.userData.p=rnd()*6; smoke.push(sp); G.add(sp); }
 // ---- Schmutz: Kippen, Becher, Aschenbecher auf Automat ----
 { const bg=[]; for(let i=0;i<40;i++){ const g=new T.CylinderGeometry(0.0045,0.0045,0.03+rnd()*0.02,5); g.rotateZ(Math.PI/2); g.rotateY(rnd()*6.28); g.translate((rnd()-0.5)*5.6,0.005,1.5-rnd()*12); bg.push(g.toNonIndexed()); } G.add(new T.Mesh(merge(bg),new T.MeshStandardMaterial({color:0xb8a888,roughness:0.9})));
   const cg=[]; [[0.9,-2.6,1],[-1.4,-4.6,0],[2.2,-7.4,1],[-0.4,-1.9,0]].forEach(([x,z,tip])=>{ const g=new T.CylinderGeometry(0.04,0.03,0.11,10,1,true); if(tip){ g.rotateZ(Math.PI/2); g.translate(x,0.04,z); } else g.translate(x,0.055,z); cg.push(g.toNonIndexed()); }); G.add(new T.Mesh(merge(cg),new T.MeshStandardMaterial({color:0xc8c0b0,roughness:0.6,side:T.DoubleSide}))); }
 const MAT={ carp:new T.MeshStandardMaterial({map:ld('carp_c.jpg',1),emissiveMap:ld('carp_e.jpg',1),emissive:0x8a70ff,emissiveIntensity:0.32,roughness:0.95}),
  ceil:new T.MeshStandardMaterial({map:ld('ceil_c.jpg',1),roughness:0.95}), wall:new T.MeshStandardMaterial({map:ld('wall_c.jpg',1),roughness:0.8}),
  fix:new T.MeshStandardMaterial({color:0x18181c,roughness:0.6,metalness:0.4}), desk:new T.MeshStandardMaterial({map:ld('side_c.jpg',1,0.5),color:0x5a3a24,roughness:0.6}) };
 // flackernde Neonröhre (Emission, kein Licht)
 const flM=new T.MeshBasicMaterial({color:0xd0e0ff,toneMapped:false}); const flu=new T.Mesh(box(0.06,0.04,1.15,1.8,YC-0.1,-4),flM); G.add(flu);
 Object.entries(bins).forEach(([k,gs])=>{ const m=new T.Mesh(merge(gs),MAT[k]); m.matrixAutoUpdate=false; G.add(m); });
 // ---- Animation ----
 let fr=0, last=0, flk=1; const sCol=scr.geometry.attributes.color; const scrIdx=[...flickS].map(i=>i*6);
 const update=(t)=>{ const s=t*0.001; if(t-last>95){ last=t; fr++; drawScreens(fr); }
  if(Math.random()<0.05) flk=Math.random()<0.5?0.05:1; flM.color.setRGB(0.82*flk,0.88*flk,flk);
  scrIdx.forEach(o=>{ const k=Math.random()<0.1?0.2+Math.random()*0.5:1; for(let j=0;j<6;j++) sCol.setXYZ(o+j,k,k,k); }); sCol.needsUpdate=true;
  smoke.forEach((sp,i)=>{ sp.position.x+=Math.sin(s*0.1+sp.userData.p)*0.002; sp.material.opacity=0.06+0.02*Math.sin(s*0.3+i); });
  Lm.intensity=4+0.4*Math.sin(s*2.2); };
 AFRAME.registerComponent('a84-tick',{tick(t){ update(t); }}); sc.setAttribute('a84-tick','');
 const boxes=[[-0.9,0.9,-12.9,-5.2],[-3.5,-1.7,2.9,3.7],[1.2,1.9,-1.75,-0.98],[-1.9,-1.2,-1.75,-0.98]]; // + Zeit-Fresser- und Forum-3D-Automat
 const collide=(x,z)=>{ let px=0,pz=0; boxes.forEach(([x0,x1,z0,z1])=>{ const r=0.25; if(x>x0-r&&x<x1+r&&z>z0-r&&z<z1+r){ const o=[x-(x0-r),(x1+r)-x,z-(z0-r),(z1+r)-z]; const m=Math.min(...o); if(m===o[0]) px-=o[0]; else if(m===o[1]) px+=o[1]; else if(m===o[2]) pz-=o[2]; else pz+=o[3]; } }); return (px||pz)?[px,pz]:null; };
 // Spielbarer ZEIT-FRESSER: eigener Automat im begehbaren Bereich (Wand-Reihen sind nur Kulisse außerhalb der Bounds)
 if(window.mountZeitFresser){
  const zfCab={x:1.55,z:-1.35,ry:-0.55};
  // voller Kabinenkörper + Bedienfeld (nicht instanziert, damit er greifbar/sichtbar vorne steht)
  const Mzf=new T.Matrix4().compose(new T.Vector3(zfCab.x,0,zfCab.z),new T.Quaternion().setFromAxisAngle(UP,zfCab.ry),ONE);
  const zfBody=new T.Mesh(cabG,sideM.clone()); zfBody.material.color=new T.Color(0x8a5a20); zfBody.applyMatrix4(Mzf); G.add(zfBody);
  const zfCtl=new T.Mesh(ctl,new T.MeshStandardMaterial({color:0xe0c020,roughness:0.35})); zfCtl.applyMatrix4(Mzf); G.add(zfCtl);
  // Boden-Schein
  const zfGlow=new T.Mesh(new T.CircleGeometry(0.7,16),new T.MeshBasicMaterial({map:halo,color:0xffb040,transparent:true,opacity:0.22,blending:T.AdditiveBlending,depthWrite:false})); zfGlow.rotation.x=-Math.PI/2; zfGlow.position.set(zfCab.x+Math.sin(zfCab.ry)*0.55,0.01,zfCab.z+Math.cos(zfCab.ry)*0.55); G.add(zfGlow);
  window.mountZeitFresser(sc,zfCab);
 }
 // Spielbarer FORUM 3D: Gegenstück links, gleiche Kabine in Blau-Grau
 if(window.mountForum3D){
  const fCab={x:-1.55,z:-1.35,ry:0.55};
  const Mf=new T.Matrix4().compose(new T.Vector3(fCab.x,0,fCab.z),new T.Quaternion().setFromAxisAngle(UP,fCab.ry),ONE);
  const fBody=new T.Mesh(cabG,sideM.clone()); fBody.material.color=new T.Color(0x2a4a60); fBody.applyMatrix4(Mf); G.add(fBody);
  const fCtl=new T.Mesh(ctl,new T.MeshStandardMaterial({color:0x40c0e0,roughness:0.35})); fCtl.applyMatrix4(Mf); G.add(fCtl);
  const fGlow=new T.Mesh(new T.CircleGeometry(0.7,16),new T.MeshBasicMaterial({map:halo,color:0x40d0ff,transparent:true,opacity:0.2,blending:T.AdditiveBlending,depthWrite:false})); fGlow.rotation.x=-Math.PI/2; fGlow.position.set(fCab.x+Math.sin(fCab.ry)*0.55,0.01,fCab.z+Math.cos(fCab.ry)*0.55); G.add(fGlow);
  window.mountForum3D(sc,fCab);
 }
 return {update,collide,cabs};
};
})();
