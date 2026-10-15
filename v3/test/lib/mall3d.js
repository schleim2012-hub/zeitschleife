/* Einkaufszentrum 1984 – nach Ladenschluss. Echtes 3D in Schichten (Look nach neon_gasse.jpg / mall_backdrop.jpg).
   nah: polierter Terrazzo (nass gewischt, spiegelt Neon), Brunnen mit Strahl, Pflanzkübel, Wischeimer, Flyer
   mittel: Ladenfronten (dunkles Glas, Rollgitter, Schaufensterpuppen), Galerie mit Glasgeländer + rosa Neonband, Leuchtschilder
   fern: Rolltreppe, Gang verliert sich im Dunst, grünes AUSGANG. Licht: nur praktisch (Neon rosa, Neon cyan, Brunnenlicht). window.buildMall84(sceneEl,C) */
(function(){
let sd=1984; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
window.buildMall84=function(sc,C){ const T=THREE, S=sc.object3D, TL=new T.TextureLoader(), G=new T.Group(); S.add(G); const B='../assets/tex/m84/';
 const ld=(f,srgb,rx,ry)=>{ const t=TL.load(f.includes('/')?f:B+f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; if(rx) t.repeat.set(rx,ry||rx); return t; };
 const cv=(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t; };
 const XW=4.8, XG=3.2, YG=3.9, YU=4.4, Z0=12, Z1=-32;
 const bins={}; const add=(k,g,us)=>{ us=us||1; g=g.index?g.toNonIndexed():g; g.computeVertexNormals(); const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2); for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)); let u,v; if(ny>0.6){u=x;v=z;} else if(nx>0.6){u=z;v=y;} else {u=x;v=y;} uv[i*2]=u*us; uv[i*2+1]=v*us; } g.setAttribute('uv',new T.BufferAttribute(uv,2)); g.attributes.color&&g.deleteAttribute('color'); (bins[k]=bins[k]||[]).push(g); };
 const merge=gs=>{ let n=0; gs.forEach(g=>n+=g.attributes.position.count); const r=new T.BufferGeometry(); Object.keys(gs[0].attributes).forEach(k=>{ if(!gs.every(g=>g.attributes[k])) return; const sz=gs[0].attributes[k].itemSize,a=new Float32Array(n*sz); let o=0; gs.forEach(g=>{ a.set(g.attributes[k].array,o); o+=g.attributes[k].array.length; }); r.setAttribute(k,new T.BufferAttribute(a,sz)); }); return r; };
 const flat=(grp,mat)=>{ grp.updateMatrixWorld(true); const gs=[]; grp.traverse(o=>{ if(o.isMesh){ let g=o.geometry.clone(); g.applyMatrix4(o.matrixWorld); g=g.index?g.toNonIndexed():g; if(!g.attributes.uv) g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2)); if(!g.attributes.normal) g.computeVertexNormals(); ['color','uv1','uv2'].forEach(k=>g.attributes[k]&&g.deleteAttribute(k)); gs.push(g); } }); const m=new T.Mesh(merge(gs),mat); m.matrixAutoUpdate=false; return m; };
 const box=(w,h,d,x,y,z)=>{ const g=new T.BoxGeometry(w,h,d); g.translate(x,y,z); return g; };
 const wallX=(x,z0,z1,y0,y1,f)=>{ const g=new T.PlaneGeometry(z0-z1,y1-y0); g.rotateY(f>0?Math.PI/2:-Math.PI/2); g.translate(x,(y0+y1)/2,(z0+z1)/2); return g; };
 const planeY=(w,d,x,y,z,down)=>{ const g=new T.PlaneGeometry(w,d); g.rotateX(down?Math.PI/2:-Math.PI/2); g.translate(x,y,z); return g; };
 // ---- Boden: Terrazzo, 1 Texturkachel = 1.2 m ----
 add('terr',planeY(2*XW,Z0-Z1,0,0,(Z0+Z1)/2),1/1.2);
 // ---- Galerie: Deckenunterseite, Stirnblende, Obergeschoss-Boden, Geländer ----
 [-1,1].forEach(s=>{ const cx=s*(XG+XW)/2, w=XW-XG; add('ceil',planeY(w,Z0-Z1,cx,YG,(Z0+Z1)/2,true),1/1.2); add('fas',box(0.22,YU-YG+0.1,Z0-Z1,s*XG,(YG+YU)/2,(Z0+Z1)/2),1/1.5); add('fas',planeY(w,Z0-Z1,cx,YU,(Z0+Z1)/2),1/1.5);
  add('metal',box(0.07,0.06,Z0-Z1,s*(XG+0.05),YU+1.05,(Z0+Z1)/2)); add('metal',box(0.05,0.05,Z0-Z1,s*(XG+0.05),YU+0.08,(Z0+Z1)/2));
  for(let z=Z0;z>Z1;z-=1.5) add('metal',box(0.04,1.0,0.04,s*(XG+0.05),YU+0.55,z));
  add('glass',wallX(s*(XG+0.06),Z0,Z1,YU+0.1,YU+1.02,-s));
  add('ceil',planeY(w+0.3,Z0-Z1,cx,8.2,(Z0+Z1)/2,true),1/1.2); add('fas',box(0.3,0.9,Z0-Z1,s*XG,8.0,(Z0+Z1)/2),1/1.5); });
 // Oberlicht über dem Atrium: Stahlraster vor Nachthimmel
 add('sky',planeY(2*XG,Z0-Z1,0,9.4,(Z0+Z1)/2,true)); for(let z=Z0;z>Z1;z-=2) add('metal',box(2*XG,0.12,0.08,0,9.3,z)); [-1.6,0,1.6].forEach(x=>add('metal',box(0.08,0.12,Z0-Z1,x,9.3,(Z0+Z1)/2)));
 // Säulen an der Galeriekante (Mosaik)
 for(let z=9;z>Z1;z-=6) [-1,1].forEach(s=>{ add('col',box(0.5,YU,0.5,s*(XG+0.1),YU/2,z),2); add('col',box(0.45,8.2-YU,0.45,s*(XG+0.1),(8.2+YU)/2,z),2); });
 // ---- Ladenfronten EG + OG: Nischen mit Rückwand (Innenleben als Bild), Glas davor ----
 const glassM=new T.MeshStandardMaterial({color:0x0a0c12,roughness:0.06,metalness:0.9,transparent:true,opacity:0.32,depthWrite:false});
 const shopT=cv(1024,512,(x,w,h)=>{ // 4 Innenleben-Varianten nebeneinander (je 256x512): Regale, Puppen, Plattenkisten, leer
   x.fillStyle='#000'; x.fillRect(0,0,w,h);
   for(let v=0;v<4;v++){ const o=v*256; const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,v===3?'#06060a':'#1a1420'); g.addColorStop(1,'#050407'); x.fillStyle=g; x.fillRect(o,0,256,h);
    if(v===0){ x.fillStyle='#0a080c'; for(let r=0;r<4;r++){ x.fillRect(o+10,140+r*80,236,10); for(let i=0;i<14;i++){ x.fillStyle=['#2a1830','#152434','#30201a','#10101a'][(i+r)%4]; x.fillRect(o+14+i*16,100+r*80,12,40); } x.fillStyle='#0a080c'; } }
    if(v===1){ [[60,1],[140,0.9],[205,1.05]].forEach(([px,s])=>{ x.fillStyle='#070608'; x.beginPath(); x.ellipse(o+px,175*s+40,16*s,20*s,0,0,7); x.fill(); x.beginPath(); x.moveTo(o+px-32*s,215); x.quadraticCurveTo(o+px,195,o+px+32*s,215); x.lineTo(o+px+40*s,330); x.lineTo(o+px+26*s,470); x.lineTo(o+px-26*s,470); x.lineTo(o+px-40*s,330); x.fill(); }); }
    if(v===2){ for(let i=0;i<5;i++){ x.fillStyle='#0b0a0d'; x.fillRect(o+12+i*48,330,42,90); for(let k=0;k<6;k++){ x.fillStyle=['#3a1a30','#1a2a3a','#2a2a14'][k%3]; x.fillRect(o+16+i*48+k*6,300,4,34); } } x.fillStyle='#1a0e18'; x.fillRect(o+30,60,200,120); }
    const sp=x.createRadialGradient(o+128,60,0,o+128,60,200); sp.addColorStop(0,'rgba(80,60,90,0.25)'); sp.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=sp; x.fillRect(o,0,256,h); } });
 const inQ=[]; const shopFront=(s,z,z1,y0,y1,variant,closed)=>{ const w=z-z1, cz=(z+z1)/2, xb=s*(XW+2.2);
   const g=new T.PlaneGeometry(w-0.4,y1-y0-0.1); g.rotateY(-s*Math.PI/2); g.translate(xb,(y0+y1)/2,cz); const uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setX(i,(variant+0.03+uv.getX(i)*0.94)/4); inQ.push(g.toNonIndexed());
   add('dark',wallX(s*(XW+1.1),z,z1,y0,y1,s),1); /* (verdeckt) */
   [z-0.2,z1+0.2].forEach(zz=>{ const p=new T.PlaneGeometry(2.2,y1-y0); p.translate(0,0,0); p.rotateY(zz>cz?Math.PI:0); p.translate(s*(XW+1.1),(y0+y1)/2,zz); add('dark',p,1); });
   add('dark',planeY(2.2,w,s*(XW+1.1),y1,cz,true)); add('dark',planeY(2.2,w,s*(XW+1.1),y0+0.002,cz));
   if(closed) add('shut',wallX(s*(XW-0.02),z-0.2,z1+0.2,y0,y0+closed,-s),1/1.4);
   add('glass',wallX(s*XW,z-0.2,z1+0.2,y0,y1,-s));
   for(let mz=z-0.2; mz>=z1+0.2-0.01; mz-=(w-0.4)/3) add('metal',box(0.08,y1-y0,0.07,s*XW,(y0+y1)/2,mz));
   add('metal',box(0.1,0.08,w,s*XW,y0+0.04,cz)); add('fas',wallX(s*(XW-0.01),z,z1,y1,y1+(y0>1?0.6:YG-y1),-s),1/1.5);
   add('fas',wallX(s*XW,z,z-0.2,y0,y1,-s),1/1.5); add('fas',wallX(s*XW,z1+0.2,z1,y0,y1,-s),1/1.5); };
 const order=[[0,0],[1,0],[2,1.6],[3,0],[0,2.95],[2,0],[1,0.9]]; let k=0;
 [-1,1].forEach(s=>{ for(let z=Z0;z>Z1+0.1;z-=6){ const [v,cl]=order[(k++)%order.length]; const skipDoor=(s>0&&z===Z0-6); shopFront(s,z-0.3,z-5.7,0,3.0,v,skipDoor?2.95:cl); const [v2,c2]=order[(k*3+1)%order.length]; shopFront(s,z-0.3,z-5.7,YU,YU+2.7,v2,c2?2.6:0); } });
 // Rückwand (Haupteingang, hinter dem Spieler) und Gangende fern
 add('fas',(()=>{ const g=new T.PlaneGeometry(2*XW,9.4); g.rotateY(Math.PI); g.translate(0,4.7,Z0); return g; })(),1/1.5);
 // ---- Rolltreppe fern (Mitte-links), Silhouette ----
 { const eg=new T.Group(); const L=Math.hypot(6.5,YU); const sideP=new T.Mesh(new T.BoxGeometry(0.12,0.9,L)); const ang=Math.atan2(YU,6.5);
   [-0.6,0.6].forEach(x=>{ const m=sideP.clone(); m.position.set(-1.3+x,YU/2+0.25,-19.5); m.rotation.x=ang; eg.add(m); const r=new T.Mesh(new T.BoxGeometry(0.07,0.08,L)); r.position.set(-1.3+x,YU/2+1.0,-19.5); r.rotation.x=ang; eg.add(r); });
   const st=new T.Mesh(new T.BoxGeometry(1.1,0.25,L)); st.position.set(-1.3,YU/2,-19.5); st.rotation.x=ang; eg.add(st); const tr=new T.Mesh(new T.BoxGeometry(1.4,0.4,1.4)); tr.position.set(-1.3,0.2,-16.2); eg.add(tr);
   G.add(flat(eg,new T.MeshStandardMaterial({color:0x1a1a1e,roughness:0.35,metalness:0.8}))); }
 // ---- Brunnen: achteckiges Becken, Säule, Schale, Strahl ----
 const FZ=-5.6; const water={};
 { const fg=new T.Group(); const rim=new T.Mesh(new T.CylinderGeometry(2.35,2.4,0.45,8,1,true)); rim.position.set(0,0.225,FZ); rim.rotation.y=Math.PI/8; fg.add(rim); const rimI=new T.Mesh(new T.CylinderGeometry(2.08,2.08,0.45,8,1,true)); rimI.geometry.scale(-1,1,1); rimI.position.set(0,0.225,FZ); rimI.rotation.y=Math.PI/8; fg.add(rimI);
   const top=new T.Mesh(new T.RingGeometry(2.08,2.37,8,1)); top.rotation.x=-Math.PI/2; top.rotation.z=Math.PI/8; top.position.set(0,0.45,FZ); fg.add(top);
   const pts=[[0,0],[0.42,0],[0.42,0.1],[0.2,0.25],[0.16,0.9],[0.24,1.05],[0.5,1.12],[0.95,1.22],[0.98,1.3],[0.85,1.3],[0.3,1.24],[0.12,1.3],[0.1,1.6],[0.07,1.68],[0,1.7]].map(([r,y])=>new T.Vector2(r,y));
   const ped=new T.Mesh(new T.LatheGeometry(pts,24)); ped.position.set(0,0.2,FZ); fg.add(ped);
   G.add(flat(fg,new T.MeshStandardMaterial({map:ld('../assets/tex/pool/basin_c.jpg',1,1.5),normalMap:ld('../assets/tex/pool/basin_n.jpg',0,1.5),color:0x5a5460,roughness:0.5})));
   const wn=ld('../assets/tex/pool/water_n.jpg',0,1.2); const wM=new T.MeshStandardMaterial({color:0x081320,roughness:0.12,metalness:0.85,envMapIntensity:0.9});
   const wg=new T.CircleGeometry(2.1,8); wg.rotateX(-Math.PI/2); wg.rotateY(Math.PI/8); wg.translate(0,0.36,FZ); const wm=new T.Mesh(wg,wM); G.add(wm); water.n=wn; water.m=wM;
   const bw=new T.CircleGeometry(0.86,24); bw.rotateX(-Math.PI/2); bw.translate(0,1.47,FZ); G.add(new T.Mesh(bw,wM)); const ct=ld('../assets/tex/pool/caustic.jpg',0,1.4); const cg=new T.CircleGeometry(2.08,8); cg.rotateX(-Math.PI/2); cg.rotateY(Math.PI/8); cg.translate(0,0.365,FZ); const cm=new T.Mesh(cg,new T.MeshBasicMaterial({map:ct,color:0x30386a,transparent:true,blending:T.AdditiveBlending,depthWrite:false})); G.add(cm); water.ct=ct;
   // Strahl: 2 gekreuzte additive Flächen mit wandernder Textur
   const jt=cv(64,512,(x,w,h)=>{ x.fillStyle='#000'; x.fillRect(0,0,w,h); for(let i=0;i<70;i++){ const px=32+(rnd()-0.5)*(10+i*0.25), y0=rnd()*h, l=20+rnd()*80; const g=x.createLinearGradient(0,y0,0,y0+l); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(0.5,'rgba(230,235,255,'+(0.25+rnd()*0.5)+')'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(px,y0,1.5+rnd()*1.5,l); } });
   jt.wrapT=T.RepeatWrapping; const jm=new T.MeshBasicMaterial({map:jt,color:0xb8b0d8,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});
   const jgs=[0,1].map(i=>{ const g=new T.PlaneGeometry(0.5,2.6,1,8); const p=g.attributes.position; for(let j=0;j<p.count;j++){ const y=p.getY(j)/2.6+0.5; p.setX(j,p.getX(j)*(0.12+0.88*Math.pow(y,1.4))); } g.rotateY(i*Math.PI/2); g.translate(0,1.68+1.3,FZ); return g.toNonIndexed(); }); const jet=new T.Mesh(merge(jgs),jm); G.add(jet); water.jt=jt;
   // fallende Tropfen (Points, 1 Draw)
   const N=260, dp=new Float32Array(N*3), dv=[]; for(let i=0;i<N;i++){ dv.push({t:rnd()*1.6,a:rnd()*6.28,r:0.15+rnd()*0.8,h:2.4+rnd()*1.6}); }
   const dg=new T.BufferGeometry(); dg.setAttribute('position',new T.BufferAttribute(dp,3));
   const dt=cv(32,32,(x)=>{ const g=x.createRadialGradient(16,16,0,16,16,16); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,32,32); });
   const drops=new T.Points(dg,new T.PointsMaterial({map:dt,color:0x6a70a0,size:0.022,transparent:true,blending:T.AdditiveBlending,depthWrite:false})); drops.frustumCulled=false; G.add(drops); water.drops=drops; water.dv=dv; }
 // ---- Pflanzkübel mit Palme (Blattkarten) ----
 const leafT=cv(256,128,(x,w,h)=>{ x.clearRect(0,0,w,h); x.strokeStyle='#2a3a1a'; x.lineWidth=3; x.beginPath(); x.moveTo(4,64); x.quadraticCurveTo(128,40,252,70); x.stroke(); for(let i=0;i<34;i++){ const t=i/34, px=4+t*248, py=64-Math.sin(t*3)*20+t*14; const L=(1-Math.abs(t-0.4))*52; [-1,1].forEach(s=>{ x.fillStyle=['#1c2a12','#24361a','#162210'][i%3]; x.beginPath(); x.moveTo(px,py); x.lineTo(px+10,py+s*L); x.lineTo(px+16,py+s*L*0.9); x.closePath(); x.fill(); }); } });
 const leafM=new T.MeshStandardMaterial({map:leafT,alphaTest:0.4,side:T.DoubleSide,roughness:0.8,color:0x8a9a80}); const lg=new T.Group(), pg=new T.Group(), tg=new T.Group();
 const planters=[[-3.7,-2.6],[3.7,-9.0],[-3.7,-14.5],[3.7,3.2],[-3.7,6.5]];
 planters.forEach(([x,z],i)=>{ const p=new T.Mesh(new T.BoxGeometry(1.0,0.6,1.0)); p.position.set(x,0.3,z); pg.add(p); const tr=new T.Mesh(new T.CylinderGeometry(0.05,0.09,1.6+rnd()*0.6,7)); tr.position.set(x,0.6+0.9,z); tr.rotation.z=(rnd()-0.5)*0.15; tg.add(tr); const ty=2.3+rnd()*0.4;
   for(let j=0;j<9;j++){ const a=j/9*6.28+rnd(); const lf=new T.Mesh(new T.PlaneGeometry(1.3,0.62,4,1)); const pp=lf.geometry.attributes.position; for(let q=0;q<pp.count;q++){ const u=pp.getX(q)+0.65; pp.setZ(q,-u*u*0.35); } lf.geometry.translate(0.65,0,0); lf.position.set(x,ty,z); lf.rotation.set(-0.5-rnd()*0.4,a,0,'YXZ'); lf.rotation.order='YZX'; lf.rotation.z=-0.35-rnd()*0.4; lg.add(lf); } });
 { const lm=flat(lg,leafM); G.add(lm); } G.add(flat(pg,new T.MeshStandardMaterial({map:ld('terr_c.jpg',1,0.8),roughness:0.4}))); G.add(flat(tg,new T.MeshStandardMaterial({color:0x2a2018,roughness:0.9})));
 // ---- Schmutz: Wischeimer + Warnschild, umgekippter Abfallkorb, Flyer ----
 { const yg=new T.Group(); const sign=new T.Group(); const sp=new T.Mesh(new T.PlaneGeometry(0.32,0.62)); [0.18,-0.18].forEach((r,i)=>{ const m=sp.clone(); m.position.set(1.75+(i?0.02:-0.02),0.3,-2.2+(i?-0.06:0.06)); m.rotation.set(r,0.4,0); m.rotation.order='YXZ'; sign.add(m); });
   const sT=cv(128,256,(x,w,h)=>{ x.fillStyle='#e0a010'; x.fillRect(0,0,w,h); x.fillStyle='#111'; x.beginPath(); x.moveTo(64,40); x.lineTo(110,120); x.lineTo(18,120); x.closePath(); x.fill(); x.fillStyle='#b8a018'; x.font='bold 50px Arial'; x.textAlign='center'; x.fillText('!',64,112); x.fillStyle='#111'; x.font='bold 19px Arial'; x.fillText('VORSICHT',64,160); x.fillText('RUTSCH-',64,185); x.fillText('GEFAHR',64,210); });
   const sm=flat(sign,new T.MeshStandardMaterial({map:sT,roughness:0.5,side:T.DoubleSide})); G.add(sm);
   const bk=new T.Mesh(new T.CylinderGeometry(0.2,0.16,0.32,16,1,true)); bk.position.set(2.15,0.16,-1.85); yg.add(bk); const mop=new T.Mesh(new T.CylinderGeometry(0.012,0.012,1.3,6)); mop.position.set(2.22,0.65,-1.8); mop.rotation.z=0.25; yg.add(mop);
   const bin=new T.Mesh(new T.CylinderGeometry(0.22,0.2,0.65,14,1,true)); bin.rotation.set(Math.PI/2,0,0.6); bin.position.set(-2.7,0.22,-4.0); yg.add(bin);
   G.add(flat(yg,new T.MeshStandardMaterial({color:0x2a3040,roughness:0.5,metalness:0.4,side:T.DoubleSide})));
   const fT=cv(256,256,(x)=>{ const c=['#c8b0c0','#a0b8c8','#d0c890','#b0a0a0']; for(let i=0;i<4;i++){ x.fillStyle=c[i]; x.fillRect((i%2)*128,(i>>1)*128,128,128); x.fillStyle='#222'; x.fillRect((i%2)*128+12,(i>>1)*128+16,104,18); x.fillStyle='#555'; for(let l=0;l<5;l++) x.fillRect((i%2)*128+12,(i>>1)*128+50+l*12,80+rnd()*20,4); } });
   const fq=[]; for(let i=0;i<26;i++){ const g=new T.PlaneGeometry(0.21,0.3); const v=i%4, uv=g.attributes.uv; for(let q=0;q<uv.count;q++) uv.setXY(q,(v%2+uv.getX(q))/2,((v>>1)+uv.getY(q))/2); g.rotateX(-Math.PI/2); g.rotateY(rnd()*6.28); const a=rnd()*6.28, r=rnd(); let x=-2.9+rnd()*5.8, z=-3.2+rnd()*5.0; if(i<8){ x=-2.6+(rnd()-0.5)*0.8; z=-3.9+(rnd()-0.5)*1.0; } g.translate(x,0.004+i*0.0003,z); fq.push(g.toNonIndexed()); }
   G.add(new T.Mesh(merge(fq),new T.MeshStandardMaterial({map:fT,roughness:0.6,color:0x707070}))); }
 // Pfütze (Wischwasser) – extra spiegelnd, weiche Kante
 { const pa=cv(256,256,(x)=>{ const g=x.createRadialGradient(128,128,10,128,128,128); g.addColorStop(0,'#fff'); g.addColorStop(0.6,'#aaa'); g.addColorStop(1,'#000'); x.fillStyle=g; x.fillRect(0,0,256,256); });
   const pm=new T.MeshStandardMaterial({color:0x020204,roughness:0.02,metalness:0.8,transparent:true,alphaMap:pa,depthWrite:false}); const pq=[[0.6,-1.8,2.6,1.4],[-1.2,0.4,1.6,1.0],[1.8,-4.5,2.0,1.2]].map(([x,z,w,d])=>{ const g=planeY(w,d,x,0.003,z); return g.toNonIndexed(); }); water.pud=new T.Mesh(merge(pq),pm); G.add(water.pud); }
 // ---- Materialien ----
 const env=(()=>{ const t=cv(512,256,(x,w,h)=>{ x.fillStyle='#08060c'; x.fillRect(0,0,w,h); x.fillStyle='#ff4ab0'; x.fillRect(0,96,w,5); [['#ff3aa0',40],['#30e0ff',150],['#ff60d0',290],['#60ffc0',400],['#ffd040',470]].forEach(([c,u])=>{ x.fillStyle=c; x.fillRect(u,74,30,16); }); x.fillStyle='#1a2040'; x.fillRect(180,0,150,40); const g=x.createLinearGradient(0,128,0,256); g.addColorStop(0,'#1a1028'); g.addColorStop(1,'#040306'); x.fillStyle=g; x.fillRect(0,128,w,128); }); t.mapping=T.EquirectangularReflectionMapping; const pm=new T.PMREMGenerator(sc.renderer); const e=pm.fromEquirectangular(t).texture; pm.dispose(); return e; })();
 const shutM=new T.MeshStandardMaterial({map:ld('../assets/tex/s41/shutter_c.jpg',1),color:0x5a5866,roughness:0.55,metalness:0.5});
 const MAT={ terr:new T.MeshStandardMaterial({map:ld('terr_c.jpg',1),normalMap:ld('terr_n.jpg'),roughnessMap:ld('terr_r.jpg'),roughness:1,metalness:0.15,envMap:env,envMapIntensity:1.1}),
  ceil:new T.MeshStandardMaterial({map:ld('ceil_c.jpg',1),roughness:0.9}), fas:new T.MeshStandardMaterial({map:ld('fas_c.jpg',1),normalMap:ld('fas_n.jpg'),roughness:0.85}),
  col:new T.MeshStandardMaterial({map:ld('col_c.jpg',1),roughness:0.25,metalness:0.1,envMap:env,envMapIntensity:0.6}), metal:new T.MeshStandardMaterial({color:0x6a6a72,roughness:0.3,metalness:0.9,envMap:env}),
  glass:glassM, dark:new T.MeshBasicMaterial({color:0x020203}), shut:shutM, sky:new T.MeshBasicMaterial({color:0x0a0e1c}) };
 glassM.envMap=env; water.m.envMap=env; glassM.envMapIntensity=1.4;
 Object.entries(bins).forEach(([k,gs])=>{ const m=new T.Mesh(merge(gs),MAT[k]); m.matrixAutoUpdate=false; if(k==='glass') m.renderOrder=2; G.add(m); });
 { const m=new T.Mesh(merge(inQ),new T.MeshBasicMaterial({map:shopT,color:0xffffff})); G.add(m); }
 // ---- Neonband unter der Galerie (rosa) + am OG-Geländer (cyan, schwächer) ----
 const tubeM=new T.MeshBasicMaterial({color:0xff5ac0,toneMapped:false}); const tubes=[]; [-1,1].forEach(s=>{ tubes.push(box(0.04,0.04,Z0-Z1,s*(XG-0.13),YG-0.05,(Z0+Z1)/2).toNonIndexed()); }); G.add(new T.Mesh(merge(tubes),tubeM));
 // Leuchtröhre mit Wackelkontakt unter der Galerie links (kein Licht, nur Emission)
 const flM=new T.MeshBasicMaterial({color:0xd8e8ff,toneMapped:false}); const flu=new T.Mesh(box(0.08,0.05,1.2,-4.0,YG-0.04,-1.5),flM); G.add(flu);
 // ---- Leuchtschilder: Atlas (1 Draw), Halo im Dunst, Spiegelstreifen am Boden ----
 const halo=cv(128,128,x=>{ const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.3,'rgba(255,255,255,0.35)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 const stT=TL.load('../assets/tex/s41/streak.png'); const signs=[]; const AW=2048,AH=2048; const AT=document.createElement('canvas'); AT.width=AW; AT.height=AH; const ax=AT.getContext('2d'); ax.fillStyle='#000'; ax.fillRect(0,0,AW,AH); let vx=0, hx0=640, hxx=640, hy=0;
 const sq={pos:[],uv:[],col:[]}, hq={pos:[],col:[],uv:[]}, rq={pos:[],col:[],uv:[]}; const frames=new T.Group();
 const pushQuad=(Q,c,ux,uy,uw,uh,col)=>{ const idx=[0,1,2,0,2,3], U=[[ux,uy],[ux+uw,uy],[ux+uw,uy+uh],[ux,uy+uh]]; idx.forEach(i=>{ Q.pos.push(c[i].x,c[i].y,c[i].z); Q.uv.push(U[i][0],U[i][1]); Q.col.push(col.r,col.g,col.b); }); return Q.col.length/3-6; };
 const neon=(txt,col,vert,side,z,y,size,flick,font)=>{ const n=txt.length; const cw=vert?128:n*80+70, ch=vert?n*104+50:160; const css='#'+col.toString(16).padStart(6,'0');
  const c=document.createElement('canvas'); c.width=cw; c.height=ch; const x=c.getContext('2d'); x.fillStyle='#0a0a0c'; x.fillRect(0,0,cw,ch); x.font=(font||'bold 92px Arial'); x.textAlign='center'; x.textBaseline='middle'; x.lineJoin='round';
  const draw=(blur,lw,cc)=>{ x.shadowColor=css; x.shadowBlur=blur; x.strokeStyle=cc; x.lineWidth=lw; for(let i=0;i<n;i++){ if(vert) x.strokeText(txt[i],cw/2,50+i*104); else x.strokeText(txt[i],65+i*80,ch/2); } }; draw(28,9,css); draw(10,6,css); draw(0,2.5,'#ffffffcc');
  let px,py; if(vert){ px=vx; py=0; vx+=cw+4; } else { if(hxx+cw>AW){ hxx=hx0; hy+=ch+4; } px=hxx; py=hy; hxx+=cw+4; } ax.drawImage(c,px,py);
  const w=vert?size:size*cw/ch, h=vert?size*ch/cw:size; const C3=new T.Color(1,1,1); let cx, cz=z, corners;
  if(vert){ cx=side*(XW-0.55); corners=[new T.Vector3(cx-w/2,y-h/2,cz),new T.Vector3(cx+w/2,y-h/2,cz),new T.Vector3(cx+w/2,y+h/2,cz),new T.Vector3(cx-w/2,y+h/2,cz)]; const bk=new T.Mesh(new T.BoxGeometry(w+0.04,h+0.04,0.06)); bk.position.set(cx,y,cz-0.035); frames.add(bk); const br=new T.Mesh(new T.BoxGeometry(0.5,0.05,0.05)); br.position.set(side*(XW-0.25),y+h/2-0.2,cz); frames.add(br); }
  else { cx=side*(XW-0.06); corners=[new T.Vector3(cx,y-h/2,cz-side*w/2),new T.Vector3(cx,y-h/2,cz+side*w/2),new T.Vector3(cx,y+h/2,cz+side*w/2),new T.Vector3(cx,y+h/2,cz-side*w/2)]; }
  const si=pushQuad(sq,corners,px/AW,1-(py+ch)/AH,cw/AW,ch/AH,C3);
  const hcol=new T.Color(col).multiplyScalar(0.3); const R=Math.max(w,h)*0.8, hxp=cx-side*0.15, hz=cz+0.06; const hi=pushQuad(hq,vert?[new T.Vector3(hxp-R,y-R,hz),new T.Vector3(hxp+R,y-R,hz),new T.Vector3(hxp+R,y+R,hz),new T.Vector3(hxp-R,y+R,hz)]:[new T.Vector3(cx-side*0.2,y-R*0.6,cz-R),new T.Vector3(cx-side*0.2,y-R*0.6,cz+R),new T.Vector3(cx-side*0.2,y+R*0.6,cz+R),new T.Vector3(cx-side*0.2,y+R*0.6,cz-R)],0,0,1,1,hcol);
  const scol=new T.Color(col).multiplyScalar(0.5); const len=Math.min(8,y*1.4+2), sw=(vert?0.6:Math.min(w,2.2)*0.5)/2, sx=side*(XW-(vert?0.6:1.1)), z0=cz-0.2; const ri=pushQuad(rq,[new T.Vector3(sx-sw,0.008,z0),new T.Vector3(sx+sw,0.008,z0),new T.Vector3(sx+sw,0.008,z0+len),new T.Vector3(sx-sw,0.008,z0+len)],0,0,1,1,scol);
  signs.push({si,hi,ri,flick,base:1,hcol,scol}); };
 let sigM,haloM,strM; const finishSigns=()=>{ const at=new T.CanvasTexture(AT); at.colorSpace=T.SRGBColorSpace; at.anisotropy=4; const mk=(Q,mat)=>{ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(Q.pos,3)); g.setAttribute('uv',new T.Float32BufferAttribute(Q.uv,2)); g.setAttribute('color',new T.Float32BufferAttribute(Q.col,3)); const m=new T.Mesh(g,mat); G.add(m); return m; };
  sigM=mk(sq,new T.MeshBasicMaterial({map:at,toneMapped:false,vertexColors:true,side:T.DoubleSide}));
  haloM=mk(hq,new T.MeshBasicMaterial({map:halo,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));
  strM=mk(rq,new T.MeshBasicMaterial({map:stT,alphaMap:stT,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));
  G.add(flat(frames,new T.MeshStandardMaterial({color:0x111014,roughness:0.6}))); };
 const setSign=(g,k)=>{ const put=(m,i,c)=>{ const a=m.geometry.attributes.color; for(let j=0;j<6;j++) a.setXYZ(i+j,c.r*k,c.g*k,c.b*k); a.needsUpdate=true; }; put(sigM,g.si,{r:1,g:1,b:1}); put(haloM,g.hi,g.hcol); put(strM,g.ri,g.scol); };
 neon('VIDEOTHEK',0x30d8ff,true,1,-2.4,2.6,0.42); neon('SCHALLPLATTEN',0xff3aa0,false,-1,-8.6,3.45,0.5); neon('EISCAFÉ',0x50ffb0,false,1,-14.8,3.45,0.5,true); neon('MODE',0xff60d0,true,-1,-1.0,2.7,0.4,true);
 neon('RADIO·TV',0xff4030,false,1,-8.6,4.4+2.95,0.42); neon('FOTO',0xffc040,false,-1,-14.8,4.4+2.95,0.42); neon('SPIELWAREN',0x8a6aff,true,-1,-18.6,6.2,0.4); neon('AUSGANG',0x40ff60,false,1,-26.5,2.5,0.32); finishSigns();
 // ---- Licht: nur praktisch ----
 const Lp=new T.PointLight(0xff4ab0,4.5,10,1.6); Lp.position.set(-3.0,3.2,-3.8); G.add(Lp);
 const Lc=new T.PointLight(0x30c8ff,3.2,9,1.6); Lc.position.set(3.4,2.4,-2.6); G.add(Lc);
 const Lf=new T.PointLight(0x8a90ff,1.3,5,1.6); Lf.position.set(0,0.7,FZ); G.add(Lf);
 [[0,3.0,FZ,4,0.10,0x8070c0],[0,2.0,-12,12,0.10,0x6a4a7a],[0,3,-22,18,0.14,0x3a3050],[0,8.5,-6,10,0.06,0x3a4a7a]].forEach(([x,y,z,s,o,c])=>{ const h=new T.Sprite(new T.SpriteMaterial({map:halo,color:c,transparent:true,opacity:o,depthWrite:false,blending:T.AdditiveBlending})); h.position.set(x,y,z); h.scale.set(s,s*0.6,1); G.add(h); });
 S.add(new T.HemisphereLight(0x2a2440,0x060408,0.45));
 // ---- ferne Gestalt (Wachmann?), reglos, nur als Silhouette vor dem AUSGANG ----
 const fig=(()=>{ const pts=[[0,0],[0.17,0.02],[0.2,0.5],[0.25,1.0],[0.24,1.3],[0.2,1.42],[0.08,1.5],[0.07,1.56],[0.11,1.62],[0.115,1.72],[0.08,1.8],[0,1.82]].map(([r,y])=>new T.Vector2(r,y)); const g=new T.LatheGeometry(pts,12); g.scale(1,1,0.7); const m=new T.Mesh(g,new T.MeshBasicMaterial({color:0x020203})); m.position.set(2.2,0,-24.5); G.add(m); return m; })();
 // ---- Animation ----
 const dp=water.drops.geometry.attributes.position; let flk=1;
 const update=(t)=>{ const s=t*0.001; water.ct.offset.set(Math.sin(s*0.3)*0.05,s*0.02); water.ct.rotation=Math.sin(s*0.2)*0.05; water.jt.offset.y=-s*1.4;
  water.dv.forEach((d,i)=>{ d.t+=0.016; if(d.t>1.6){ d.t=0; d.a=rnd()*6.28; d.r=0.1+rnd()*0.9; d.h=2.6+rnd()*1.4; } const k=d.t/1.6; const r=d.r*k*(d.r>0.75?2.1:1.15); dp.setXYZ(i,Math.cos(d.a)*r,1.7+d.h*(4*k*(1-k))*0.9+(k>0.5?-(k-0.5)*1.4:0),FZ+Math.sin(d.a)*r); }); dp.needsUpdate=true;
  if(Math.random()<0.04) flk=Math.random()<0.5?0.08:1; flM.color.setRGB(0.85*flk,0.9*flk,flk);
  signs.forEach(g=>{ if(!g.flick) return; if(Math.random()<0.015){ g.base=Math.random()<0.3?0.25:1; setSign(g,g.base); } });
  Lf.intensity=1.3+0.2*Math.sin(s*3.1)*Math.sin(s*1.7); fig.scale.set(1,1+0.004*Math.sin(s*1.3),1); };
 AFRAME.registerComponent('m84-tick',{tick(t){ update(t); }}); sc.setAttribute('m84-tick','');
 const circ=[[0,FZ,2.65]]; const collide=(x,z)=>{ for(const [cx,cz,r] of circ){ const dx=x-cx,dz=z-cz,d=Math.hypot(dx,dz); if(d<r) return [dx/d*(r-d),dz/d*(r-d)]; } return null; };
 return {update,collide};
};
})();
