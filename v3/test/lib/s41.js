/* Stadt 2041 – nasse Neon-Gasse im Smog, echtes 3D in Schichten (nach neon_gasse.jpg).
   nah: Asphalt (nass, Pfützen), Bordstein, Müll, Kiosk, Passanten (3D), Baum mit Wurzeln, die den Asphalt aufbrechen
   mittel: Ziegelfassaden mit Fenstern, Läden, Rollläden, Neon-Schilder (Glühen + Spiegelstreifen am Boden), Kabel, Laterne mit Wackelkontakt
   fern: Silhouetten + abgedunkeltes Foto im lila Dunst. Licht: nur praktisch (2 Neon, 1 Laterne). window.buildStreet41(sceneEl,C) */
(function(){
let sd=2041; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
window.buildStreet41=function(sc,C){ const BK=!!window.ZSBake&&!/[?&]nobake=1/.test(location.search), LK=BK?0.6:1; const T=THREE, S=sc.object3D, TL=new T.TextureLoader(), G=new T.Group(); S.add(G); const B='../assets/tex/s41/';
 const ld=(f,srgb,rx,ry)=>{ const t=TL.load(B+f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; if(rx) t.repeat.set(rx,ry||rx); return t; };
 const cv=(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t; };
 const XF=3.3, Z0=14, Z1=-40;
 // Geometrie-Sammler (Welt-UV), pro Material zusammengeführt
 const bins={}; const add=(k,g,us)=>{ us=us||1; g=g.index?g.toNonIndexed():g; g.computeVertexNormals(); const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2); for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)); let u,v; if(ny>0.6){u=x;v=z;} else if(nx>0.6){u=z;v=y;} else {u=x;v=y;} uv[i*2]=u*us; uv[i*2+1]=v*us; } g.setAttribute('uv',new T.BufferAttribute(uv,2)); g.deleteAttribute&&g.attributes.color&&g.deleteAttribute('color'); (bins[k]=bins[k]||[]).push(g); };
 const merge=gs=>{ let n=0; gs.forEach(g=>n+=g.attributes.position.count); const r=new T.BufferGeometry(); ['position','normal','uv'].forEach(k=>{ const sz=gs[0].attributes[k].itemSize,a=new Float32Array(n*sz); let o=0; gs.forEach(g=>{ a.set(g.attributes[k].array,o); o+=g.attributes[k].array.length; }); r.setAttribute(k,new T.BufferAttribute(a,sz)); }); return r; };
 const flat=(grp,mat)=>{ grp.updateMatrixWorld(true); const gs=[]; grp.traverse(o=>{ if(o.isMesh&&!o.isInstancedMesh){ let g=o.geometry.clone(); g.applyMatrix4(o.matrixWorld); g=g.index?g.toNonIndexed():g; if(!g.attributes.uv){ g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2)); } if(!g.attributes.normal) g.computeVertexNormals(); ['color','uv2'].forEach(k=>g.attributes[k]&&g.deleteAttribute(k)); gs.push(g); } }); return new T.Mesh(merge(gs),mat); };
 const box=(w,h,d,x,y,z)=>{ const g=new T.BoxGeometry(w,h,d); g.translate(x,y,z); return g; };
 const wallX=(x,z0,z1,y0,y1,f)=>{ const g=new T.PlaneGeometry(z0-z1,y1-y0); g.rotateY(f>0?Math.PI/2:-Math.PI/2); g.translate(x,(y0+y1)/2,(z0+z1)/2); return g; };
 // ---- Boden ----
 { const g=new T.PlaneGeometry(2*XF,Z0-Z1); g.rotateX(-Math.PI/2); g.translate(0,0,(Z0+Z1)/2); add('asph',g,1/2.4); }
 [-1,1].forEach(s=>{ add('curb',box(0.16,0.07,Z0-Z1,s*2.3,0.035,(Z0+Z1)/2),1); for(let z=Z0-1;z>Z1;z-=5+rnd()*4) add('grate',box(0.35,0.012,0.5,s*2.1,0.006,z),1); });
 // ---- Fassaden: Häuser mit unterschiedlicher Breite/Höhe ----
 const lit=[]; const winM=new T.MeshStandardMaterial({color:0x05060a,roughness:0.12,metalness:0.6}); const shops=[];
 [-1,1].forEach(s=>{ let z=Z0+1; let k=0; while(z>Z1){ const w=4+rnd()*4, h=9+rnd()*8, x=s*(XF+(rnd()-0.5)*0.15); const z1=z-w; add('brick',wallX(x,z,z1,0,h,-s),1/0.6);
   add('trim',box(0.35,0.3,w,x-s*0.12,h-0.15,(z+z1)/2),1); add('trim',box(0.2,0.12,w,x-s*0.06,3.5,(z+z1)/2),1);
   if(z1>-30) add('brick',(()=>{ const g=new T.PlaneGeometry(0.4,h); g.rotateY(0); g.translate(x-s*0.2,h/2,z1+0.001); return g; })(),1/0.6);
   for(let fy=4.2; fy<h-1.5; fy+=2.9) for(let wz=z-0.9; wz>z1+0.6; wz-=1.7){ const g=new T.PlaneGeometry(0.95,1.5); g.rotateY(-s*Math.PI/2); g.translate(x-s*0.02,fy+0.75,wz-0.47); const L=rnd(); if(L<0.1) lit.push([g,L<0.05?0:1]); else add('win',g,1); add('frame',box(0.08,0.07,1.05,x-s*0.04,fy-0.02,wz-0.47),1); add('frame',box(0.08,0.07,1.05,x-s*0.04,fy+1.52,wz-0.47),1); }
   shops.push([x,z,z1,s,k++]); z=z1-0.02; } });
 // Erdgeschoss: Läden (dunkles Glas oder Rollladen), Innenschein bei wenigen
 const shutM=new T.MeshStandardMaterial({map:ld('shutter_c.jpg',1),roughness:0.6,metalness:0.4});
 shops.forEach(([x,z,z1,s,k])=>{ const w=Math.min(3.2,(z-z1)-1.2), cz=(z+z1)/2; if(Math.abs(cz-2.0)<1.6&&s>0) return; const g=new T.PlaneGeometry(w,2.6); g.rotateY(-s*Math.PI/2); g.translate(x-s*0.03,1.35,cz);
   add((k%3===1)?'shut':'win',g,1); add('frame',box(0.1,0.1,w+0.2,x-s*0.06,2.7,cz),1); });
 const MAT={ asph:new T.MeshStandardMaterial({map:ld('asph_c.jpg',1),normalMap:ld('asph_n.jpg'),roughnessMap:ld('asph_r.jpg'),roughness:1,metalness:0.15}),
  brick:new T.MeshStandardMaterial({map:ld('brick_c.jpg',1),normalMap:ld('brick_n.jpg'),roughness:0.92}),
  trim:new T.MeshStandardMaterial({color:0x2a2622,roughness:0.85}), shut:shutM, frame:new T.MeshStandardMaterial({color:0x14110f,roughness:0.6}),
  curb:new T.MeshStandardMaterial({color:0x3a3a3c,roughness:0.7}), grate:new T.MeshStandardMaterial({color:0x101010,roughness:0.4,metalness:0.8}), win:winM };
 // Umgebung für nasse Spiegelung (Neon-Farben im Dunkeln)
 const env=(()=>{ const t=cv(512,256,(x,w,h)=>{ x.fillStyle='#07060c'; x.fillRect(0,0,w,h); [['#ff3a28',60],['#30e0ff',180],['#ff40d0',300],['#40ff90',420]].forEach(([c,u])=>{ x.fillStyle=c; x.fillRect(u,70,14,60); }); x.fillStyle='rgba(220,230,160,0.9)'; x.fillRect(250,40,30,8); const g=x.createLinearGradient(0,128,0,256); g.addColorStop(0,'#1a1430'); g.addColorStop(1,'#050408'); x.fillStyle=g; x.fillRect(0,128,w,128); }); t.mapping=T.EquirectangularReflectionMapping; const pm=new T.PMREMGenerator(sc.renderer); const e=pm.fromEquirectangular(t).texture; pm.dispose(); return e; })();
 MAT.asph.envMap=env; MAT.asph.envMapIntensity=0.9; winM.envMap=env; winM.envMapIntensity=1.2;
 Object.entries(bins).forEach(([k,gs])=>{ const m=new T.Mesh(merge(gs),MAT[k]); m.name='s41_'+k; m.matrixAutoUpdate=false; G.add(m); });
 if(lit.length){ [0,1].forEach(v=>{ const gs=lit.filter(l=>l[1]===v).map(l=>l[0]); if(!gs.length) return; const m=new T.Mesh(merge(gs.map(g=>{ g=g.toNonIndexed(); return g; })),new T.MeshBasicMaterial({color:v?0x6a4a28:0x1f4a50})); G.add(m); }); }
 // ---- Neon-Schilder: Glühen, Halo im Dunst, Spiegelstreifen am nassen Boden ----
 const halo=cv(128,128,x=>{ const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.3,'rgba(255,255,255,0.35)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 const stT=TL.load(B+'streak.png'); const signs=[]; const AT=document.createElement('canvas'); AT.width=2048; AT.height=1024; const ax=AT.getContext('2d'); ax.fillStyle='#000'; ax.fillRect(0,0,2048,1024); let vx=0, hy=0;
 const sq={pos:[],uv:[],col:[]}, hq={pos:[],col:[],uv:[]}, rq={pos:[],col:[],uv:[]}; const frames=new T.Group();
 const pushQuad=(Q,c,ux,uy,uw,uh,col)=>{ // c: 4 Ecken (Vector3) im Uhrzeigersinn ab links-unten
  const idx=[0,1,2,0,2,3], U=[[ux,uy],[ux+uw,uy],[ux+uw,uy+uh],[ux,uy+uh]]; idx.forEach(i=>{ Q.pos.push(c[i].x,c[i].y,c[i].z); Q.uv.push(U[i][0],U[i][1]); Q.col.push(col.r,col.g,col.b); }); return Q.col.length/3-6; };
 const neon=(txt,col,vert,side,z,y,size,flick)=>{ const n=txt.length; const cw=vert?128:n*84+60, ch=vert?n*104+50:160; const css='#'+col.toString(16).padStart(6,'0');
  const c=document.createElement('canvas'); c.width=cw; c.height=ch; const x=c.getContext('2d'); x.fillStyle='#0a0a0c'; x.fillRect(0,0,cw,ch); x.strokeStyle='#26262a'; x.lineWidth=6; x.strokeRect(3,3,cw-6,ch-6); x.font='bold 92px Arial'; x.textAlign='center'; x.textBaseline='middle'; x.lineJoin='round';
  const draw=(blur,lw,cc)=>{ x.shadowColor=css; x.shadowBlur=blur; x.strokeStyle=cc; x.lineWidth=lw; for(let i=0;i<n;i++){ if(vert) x.strokeText(txt[i],cw/2,50+i*104); else x.strokeText(txt[i],60+i*84,ch/2); } }; draw(28,9,css); draw(10,6,css); draw(0,2.5,'#ffffffcc');
  let px,py; if(vert){ px=vx; py=0; vx+=cw+4; } else { px=1100; py=hy; hy+=ch+4; } ax.drawImage(c,px,py);
  const w=vert?size:size*cw/ch, h=vert?size*ch/cw:size; const C3=new T.Color(1,1,1); let cx, cz=z, corners;
  if(vert){ cx=side*(XF-0.5); corners=[new T.Vector3(cx-w/2,y-h/2,cz),new T.Vector3(cx+w/2,y-h/2,cz),new T.Vector3(cx+w/2,y+h/2,cz),new T.Vector3(cx-w/2,y+h/2,cz)]; const bk=new T.Mesh(new T.BoxGeometry(w+0.04,h+0.04,0.06)); bk.position.set(cx,y,cz-0.035); frames.add(bk); [h/2-0.15,-h/2+0.15].forEach(dy=>{ const br=new T.Mesh(new T.BoxGeometry(0.4,0.05,0.05)); br.position.set(side*(XF-0.25),y+dy,cz-0.09); frames.add(br); }); }
  else { cx=side*(XF-0.45); const s2=side; corners=[new T.Vector3(cx,y-h/2,cz-s2*w/2),new T.Vector3(cx,y-h/2,cz+s2*w/2),new T.Vector3(cx,y+h/2,cz+s2*w/2),new T.Vector3(cx,y+h/2,cz-s2*w/2)]; }
  const si=pushQuad(sq,corners,px/2048,1-(py+ch)/1024,cw/2048,ch/1024,C3);
  const hcol=new T.Color(col).multiplyScalar(0.35); const R=Math.max(w,h)*0.8, hx=cx-side*0.1, hz=cz+0.06; const hi=pushQuad(hq,[new T.Vector3(hx-R,y-R,hz),new T.Vector3(hx+R,y-R,hz),new T.Vector3(hx+R,y+R,hz),new T.Vector3(hx-R,y+R,hz)],0,0,1,1,hcol);
  const scol=new T.Color(col).multiplyScalar(0.55); const len=Math.min(9,y*1.6+2), sw=(vert?0.7:w*0.8)/2, sx=side*(XF-0.9), z0=cz-0.2; const ri=pushQuad(rq,[new T.Vector3(sx-sw,0.012,z0),new T.Vector3(sx+sw,0.012,z0),new T.Vector3(sx+sw,0.012,z0+len),new T.Vector3(sx-sw,0.012,z0+len)],0,0,1,1,scol);
  signs.push({si,hi,ri,flick,base:1,hcol,scol}); };
 const finishSigns=()=>{ const at=new T.CanvasTexture(AT); at.colorSpace=T.SRGBColorSpace; const mk=(Q,mat)=>{ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(Q.pos,3)); g.setAttribute('uv',new T.Float32BufferAttribute(Q.uv,2)); g.setAttribute('color',new T.Float32BufferAttribute(Q.col,3)); const m=new T.Mesh(g,mat); G.add(m); return m; };
  sigM=mk(sq,new T.MeshBasicMaterial({map:at,toneMapped:false,vertexColors:true,side:T.DoubleSide}));
  haloM=mk(hq,new T.MeshBasicMaterial({map:halo,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));
  strM=mk(rq,new T.MeshBasicMaterial({map:stT,alphaMap:stT,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));
  const fr=flat(frames,MAT.frame); G.add(fr); };
 let sigM,haloM,strM; const setSign=(g,k)=>{ const put=(m,i,c)=>{ const a=m.geometry.attributes.color; for(let j=0;j<6;j++) a.setXYZ(i+j,c.r*k,c.g*k,c.b*k); a.needsUpdate=true; }; put(sigM,g.si,{r:1,g:1,b:1}); put(haloM,g.hi,g.hcol); put(strM,g.ri,g.scol); };
 neon('HOTEL',0xff3a24,true,-1,-3.2,4.6,0.62); neon('BAR42',0x30e0ff,true,1,-6.1,3.7,0.56,true); neon('SOYLENT',0x50ff90,true,1,-12.5,5.0,0.6); neon('PFANDLEIHE',0xff40d0,false,-1,-9.5,3.25,0.42); neon('KARAOKE',0xff5aa0,true,-1,-16,4.6,0.55,true); neon('+',0x40ff80,false,1,-17.5,3.4,0.7);
 neon('OFFEN',0xff2a2a,false,1,-1.25,1.8,0.22); finishSigns();
 // Neon-Lichtquellen (praktisch): Rot links vorne, Cyan rechts
 const Lr=new T.PointLight(0xff3a28,7*LK,10,1.6); Lr.position.set(-2.7,4.2,-3.0); G.add(Lr); const Lc=new T.PointLight(0x30d8ff,7*LK,9,1.5); Lc.position.set(2.2,2.6,-7.0); G.add(Lc);
 // ---- Laterne mit Wackelkontakt (links, z -6.5) ----
 const poleM=new T.MeshStandardMaterial({color:0x1c1e1c,roughness:0.5,metalness:0.6});
 const lampGrp=new T.Group(); const pole=new T.Mesh(new T.CylinderGeometry(0.06,0.09,5.2,10)); pole.position.set(-2.55,2.6,-6.2); lampGrp.add(pole); const arm=new T.Mesh(new T.CylinderGeometry(0.04,0.04,1.1,8)); arm.rotation.z=Math.PI/2-0.15; arm.position.set(-2.05,5.15,-6.2); lampGrp.add(arm);
 const headM=new T.MeshBasicMaterial({color:0xe8f0b0,toneMapped:false}); const head=new T.Mesh(new T.CylinderGeometry(0.22,0.14,0.16,14)); head.position.set(-1.5,5.05,-6.2); lampGrp.add(head); G.add(flat(lampGrp,poleM)); const lens=new T.Mesh(new T.CircleGeometry(0.17,14),headM); lens.rotation.x=Math.PI/2; lens.position.set(-1.5,4.965,-6.2); G.add(lens);
 const lhs=new T.Sprite(new T.SpriteMaterial({map:halo,color:0xd8e098,transparent:true,opacity:0.45,blending:T.AdditiveBlending,depthWrite:false})); lhs.position.set(-1.5,4.9,-6.2); lhs.scale.set(3.2,3.2,1); G.add(lhs);
 const Ll=new T.PointLight(0xd8e4a0,9*LK,12,1.5); Ll.position.set(-1.5,4.7,-6.2); G.add(Ll);
 // ---- Kabel über die Gasse ----
 const cabM=new T.MeshStandardMaterial({color:0x080808,roughness:0.5}); const cabG=new T.Group();
 [[-1.5,6.5,7.2],[-5,7.4,6.8],[-9,6.2,7.6],[-13,8,7.2],[-18,6.8,7.4]].forEach(([z,y1,y2])=>{ const a=new T.Vector3(-XF+0.1,y1,z), b=new T.Vector3(XF-0.1,y2,z+(rnd()-0.5)*1.5), m=a.clone().lerp(b,0.5); m.y-=0.9+rnd()*0.6; cabG.add(new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(a,m,b),24,0.012,4))); }); G.add(flat(cabG,cabM));
 // ---- Der Baum (statt des Tors), Wurzeln brechen den Asphalt auf ----
 const barkM=new T.MeshStandardMaterial({map:ld('bark_c.jpg',1,1,3),normalMap:ld('bark_n.jpg',0,1,3),roughness:0.95});
 const TZ=-7.2, TX=0.4; const branches=[];
 const limb=(p0,dir,len,r0,depth)=>{ const pts=[p0.clone()]; let p=p0.clone(), d=dir.clone(); for(let i=0;i<5;i++){ d.add(new T.Vector3((rnd()-0.5)*0.35,(rnd()-0.2)*0.2,(rnd()-0.5)*0.35)).normalize(); p=p.clone().addScaledVector(d,len/5); pts.push(p); }
  const cur=new T.CatmullRomCurve3(pts); const g=new T.TubeGeometry(cur,depth?10:16,1,depth?5:9,false); const pp=g.attributes.position, seg=depth?10:16, rs=depth?5:9; const ctr=cur.getSpacedPoints(seg);
  for(let i=0;i<=seg;i++){ const rr=r0*(1-0.75*i/seg); for(let j=0;j<=rs;j++){ const k=i*(rs+1)+j; const c=ctr[i]; pp.setXYZ(k,c.x+(pp.getX(k)-c.x)*rr,c.y+(pp.getY(k)-c.y)*rr,c.z+(pp.getZ(k)-c.z)*rr); } } g.computeVertexNormals(); branches.push(g);
  if(depth<2){ const n=depth?2:4; for(let k=0;k<n;k++){ const t=0.5+rnd()*0.45; const q=cur.getPoint(t); const nd=cur.getTangent(t).clone().add(new T.Vector3((rnd()-0.5)*1.6,0.5+rnd()*0.6,(rnd()-0.5)*1.6)).normalize(); limb(q,nd,len*(0.5+rnd()*0.25),r0*(1-0.75*t)*0.75,depth+1); } } return cur; };
 limb(new T.Vector3(TX,-0.2,TZ),new T.Vector3(0.08,1,-0.05).normalize(),4.0,0.38,0);
 for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+rnd()*0.4; const p0=new T.Vector3(TX+Math.cos(a)*0.2,0.25,TZ+Math.sin(a)*0.2); const pts=[p0]; for(let k=1;k<=4;k++) pts.push(new T.Vector3(TX+Math.cos(a)*(0.2+k*0.45),0.18-k*0.06+(k===2?0.08:0),TZ+Math.sin(a)*(0.2+k*0.45))); const cur=new T.CatmullRomCurve3(pts); const g=new T.TubeGeometry(cur,10,1,6,false); const pp=g.attributes.position, ctr=cur.getSpacedPoints(10); for(let s2=0;s2<=10;s2++){ const rr=0.16*(1-0.8*s2/10); for(let j=0;j<=6;j++){ const k=s2*7+j, c=ctr[s2]; pp.setXYZ(k,c.x+(pp.getX(k)-c.x)*rr,c.y+(pp.getY(k)-c.y)*rr,c.z+(pp.getZ(k)-c.z)*rr); } } g.computeVertexNormals(); branches.push(g); }
 const tree=new T.Mesh(merge(branches.map(g=>g.index?g.toNonIndexed():g)),barkM); G.add(tree);
 // aufgebrochene Asphaltplatten um den Stamm
 const slabs=[];
 for(let i=0;i<9;i++){ const a=rnd()*6.28, r=0.6+rnd()*1.2; const g=new T.BoxGeometry(0.4+rnd()*0.4,0.06,0.3+rnd()*0.4); g.rotateX((rnd()-0.5)*0.4); g.rotateY(rnd()*3); g.rotateZ((rnd()-0.5)*0.4); g.translate(TX+Math.cos(a)*r,0.03+rnd()*0.08,TZ+Math.sin(a)*r); slabs.push(g.toNonIndexed()); } G.add(new T.Mesh(merge(slabs),MAT.asph));
 // spärliches, dunkles Laub (instanzierte Karten)
 const leafT=cv(128,128,(x)=>{ x.clearRect(0,0,128,128); for(let i=0;i<26;i++){ x.fillStyle='rgba('+(20+Math.random()*20|0)+','+(40+Math.random()*30|0)+','+(25+Math.random()*15|0)+',1)'; x.beginPath(); x.ellipse(20+Math.random()*88,20+Math.random()*88,9,4,Math.random()*3,0,7); x.fill(); } });
 const leafM=new T.MeshStandardMaterial({map:leafT,alphaTest:0.5,side:T.DoubleSide,roughness:0.9}); const LN=140; const lim=new T.InstancedMesh(new T.PlaneGeometry(0.7,0.7),leafM,LN); const m4=new T.Matrix4(), q=new T.Quaternion(), e3=new T.Euler(), sv=new T.Vector3(), pv=new T.Vector3();
 for(let i=0;i<LN;i++){ const a=rnd()*6.28, r=0.8+rnd()*2.6; pv.set(TX+Math.cos(a)*r,3.6+rnd()*3.2,TZ+Math.sin(a)*r*0.8); e3.set(rnd()*3,rnd()*3,rnd()*3); q.setFromEuler(e3); sv.setScalar(0.6+rnd()*0.8); m4.compose(pv,q,sv); lim.setMatrixAt(i,m4); } G.add(lim);
 // ---- Gully mit Dampf, Müllsäcke, Kartons ----
 const mh=new T.Mesh(new T.CircleGeometry(0.34,24),new T.MeshStandardMaterial({map:cv(128,128,(x)=>{ x.fillStyle='#1a1a1a'; x.beginPath(); x.arc(64,64,62,0,7); x.fill(); x.strokeStyle='#333'; x.lineWidth=3; for(let r=12;r<60;r+=10){ x.beginPath(); x.arc(64,64,r,0,7); x.stroke(); } }),roughness:0.4,metalness:0.8})); mh.rotation.x=-Math.PI/2; mh.position.set(0.9,0.006,-3.4); G.add(mh);
 const steamT=halo; const steam=[]; for(let i=0;i<7;i++){ const sp=new T.Sprite(new T.SpriteMaterial({map:steamT,color:0x8a7aa0,transparent:true,opacity:0.09,depthWrite:false})); sp.position.set(0.9,0.3+i*0.4,-3.4); sp.scale.set(1.2+i*0.35,1.2+i*0.35,1); sp.userData.ph=rnd()*6; steam.push(sp); G.add(sp); }
 const bagG=new T.Group(); const bagM=new T.MeshStandardMaterial({color:0x050506,roughness:0.12,metalness:0.2,envMap:env,envMapIntensity:1.5});
 [[-2.85,1.0,0.32],[-2.6,1.35,0.28],[-2.9,1.55,0.25],[-2.75,-4.2,0.3]].forEach(([x,z,r])=>{ const g=new T.SphereGeometry(r,14,10); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i); const f=1+0.12*Math.sin(p.getX(i)*30+y*20)*Math.sin(p.getZ(i)*25); p.setXYZ(i,p.getX(i)*f,(y>0?y*(1-0.25*(y/r)):y*0.7)*f+(y>r*0.8?0.06:0),p.getZ(i)*f); } g.computeVertexNormals(); const m=new T.Mesh(g); m.position.set(x,r*0.65,z); bagG.add(m); }); G.add(flat(bagG,bagM));
 const cardM=new T.MeshStandardMaterial({color:0x4a3a26,roughness:0.95}); const cg=new T.Group(); [[-2.8,0.3,0.5,0.35,0.4,0.2],[-2.7,-0.15,0.4,0.3,0.35,-0.3]].forEach(([x,z,w,h,d,r])=>{ const b=new T.Mesh(new T.BoxGeometry(w,h,d)); b.position.set(x,h/2,z); b.rotation.y=r; cg.add(b); }); G.add(flat(cg,cardM));
 // ---- Überwachungsdrohne (kreist hoch oben, blinkt rot) ----
 const drone=new T.Group(); const dm=new T.MeshStandardMaterial({color:0x2a2a2e,roughness:0.4,metalness:0.7}); { const dg=new T.Group(); dg.add(new T.Mesh(new T.BoxGeometry(0.3,0.08,0.3))); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{ const r=new T.Mesh(new T.CylinderGeometry(0.11,0.11,0.01,12)); r.position.set(a*0.2,0.05,b*0.2); dg.add(r); }); drone.add(flat(dg,dm)); }
 const led=new T.Mesh(new T.SphereGeometry(0.025,8,6),new T.MeshBasicMaterial({color:0xff1010,toneMapped:false})); led.position.y=-0.05; drone.add(led); G.add(drone);
 // ---- Ferne Schicht: Foto + Dunst ----
 const far=new T.MeshBasicMaterial({color:0x6a5a90}); TL.load('../assets/era2041/street_backdrop.jpg',t=>{ t.colorSpace=T.SRGBColorSpace; far.map=t; far.needsUpdate=true; }); const fp=new T.Mesh(new T.PlaneGeometry(14,10),far); fp.position.set(0,4.5,-34); G.add(fp);
 [[0,3,-14,16,0.12],[0,2,-22,22,0.15],[0,5,-9,10,0.06]].forEach(([x,y,z,s,o])=>{ const h=new T.Sprite(new T.SpriteMaterial({map:halo,color:0x5a4a8a,transparent:true,opacity:o,depthWrite:false})); h.position.set(x,y,z); h.scale.set(s,s*0.6,1); G.add(h); });
 S.add(new T.HemisphereLight(0x2a2244,0x060508,BK?0.3:0.5));
 // ---- 3D-Passanten (Mantel, Silhouette im Gegenlicht) ----
 const coatM=new T.MeshStandardMaterial({color:0x040405,roughness:1}); const persons=[];
 const person=(i)=>{ const woman=i===0; const g=new T.Group();
  const P=(woman?[[0.001,0.0],[0.3,0.02],[0.27,0.4],[0.21,0.85],[0.17,1.08],[0.2,1.26],[0.235,1.36],[0.2,1.43],[0.1,1.47],[0.001,1.48]]:[[0.001,0.0],[0.31,0.02],[0.28,0.45],[0.23,0.9],[0.2,1.15],[0.24,1.35],[0.26,1.45],[0.22,1.52],[0.1,1.55],[0.001,1.56]]).map(([r,y])=>new T.Vector2(r,y));
  const coat=new T.Mesh(new T.LatheGeometry(P,26)); coat.scale.z=0.6; g.add(coat);
  // aufgestellter Kragen
  const col=new T.Mesh(new T.CylinderGeometry(woman?0.09:0.1,woman?0.13:0.14,0.17,18,1,true)); col.position.set(0,(woman?1.47:1.55)+0.06,0); col.scale.z=0.8; g.add(col);
  // Arme als weiche, leicht angewinkelte Röhren am Mantel
  [-1,1].forEach(s=>{ const c=new T.CatmullRomCurve3([new T.Vector3(s*0.22,woman?1.36:1.44,0),new T.Vector3(s*0.25,1.1,0.03),new T.Vector3(s*0.22,0.86,0.08)]); const t=new T.Mesh(new T.TubeGeometry(c,8,0.06,8)); g.add(t); });
  const head=new T.Mesh(new T.SphereGeometry(0.1,16,12)); head.scale.set(0.86,1.1,0.95); head.position.set(0,woman?1.66:1.74,0.02); g.add(head);
  if(woman){ const scarf=new T.Mesh(new T.SphereGeometry(0.115,16,12,0,Math.PI*2,0,Math.PI*0.62)); scarf.position.set(0,1.67,0.0); scarf.rotation.x=-0.35; g.add(scarf); const bag=new T.Mesh(new T.BoxGeometry(0.26,0.22,0.09)); bag.position.set(0.3,0.78,0.05); g.add(bag); const strap=new T.Mesh(new T.TorusGeometry(0.28,0.008,4,16,Math.PI)); strap.position.set(0.27,1.0,0.05); strap.rotation.z=-0.1; g.add(strap); }
  else { const crown=new T.Mesh(new T.CylinderGeometry(0.105,0.115,0.12,16)); crown.position.y=1.86; g.add(crown); const brim=new T.Mesh(new T.CylinderGeometry(0.2,0.2,0.012,20)); brim.position.y=1.8; brim.rotation.x=0.08; g.add(brim); }
  const m=flat(g,coatM); const w=new T.Group(); w.add(m); persons.push(m); return w; };
 // Mülltonne vor den beiden (verdeckt Unterkörper)
 { const dg=new T.Group(); const body=new T.Mesh(new T.BoxGeometry(1.7,1.05,0.95)); body.position.set(0,0.6,0); dg.add(body); const lid=new T.Mesh(new T.BoxGeometry(1.75,0.06,1.0)); lid.position.set(0,1.16,-0.05); lid.rotation.x=-0.12; dg.add(lid); [[-0.7,0.4],[0.7,0.4],[-0.7,-0.4],[0.7,-0.4]].forEach(([x,z])=>{ const w=new T.Mesh(new T.CylinderGeometry(0.07,0.07,0.05,10)); w.rotation.z=Math.PI/2; w.position.set(x,0.07,z); dg.add(w); }); for(let k=0;k<4;k++){ const r=new T.Mesh(new T.BoxGeometry(1.72,0.04,0.02)); r.position.set(0,0.3+k*0.22,0.48); dg.add(r); }
  const dmM=new T.MeshStandardMaterial({map:shutM.map,color:0x2a4a3a,roughness:0.55,metalness:0.6}); const dump=flat(dg,dmM); dump.position.set(1.35,0,-4.15); dump.rotation.y=0.08; G.add(dump); }
 const hz=new T.Sprite(new T.SpriteMaterial({map:halo,color:0x3a3060,transparent:true,opacity:0.18,depthWrite:false})); hz.position.set(1.4,1.0,-4.6); hz.scale.set(3.5,2.2,1); G.add(hz);
 // ---- Gebackenes Licht (Blender) + Decals/Plakatreste (je 1 Draw) ----
 if(window.ZSBake){ const D=[], PO=[]; let pi=0;
  [[0.6,1.4,1.3,1],[-1.2,-1.6,1.1,9],[1.5,-5.2,1.4,0],[-0.6,-8.4,1.2,1],[0.2,-11.5,1.6,0],[-1.5,2.8,1.0,0],[1.0,-2.2,0.6,6],[-0.4,-4.6,0.5,6],[0.8,0.2,1.2,2],[-1.0,-6.8,1.4,2],[1.6,-9.6,1.0,2],[-0.2,-13.5,1.3,1],[0.3,4.2,1.2,8]].forEach(([x,z,w,c],i)=>D.push([c,x,0.004,z,w,w*(c==8?2.5:1),'y',i*1.3]));
  [-1,1].forEach(sg=>{ for(let z=6;z>-16;z-=3.6) D.push([7,sg*2.05,0.004,z,0.5,3.8,'y',0]); });
  shops.forEach(([x,z,z1,sg,k])=>{ if(z1>8||z<-17) return; const wx=x-sg*0.006, f=sg>0?'-x':'+x', cz=(z+z1)/2, wl=z-z1;
   D.push([4,wx,0.35,cz,wl*0.9,0.7,f]); D.push([5,wx,3.0,cz+(k%2?0.6:-0.6),1.2,1.1,f]); if(k%2) D.push([10,wx,4.6,cz-0.8,1.6,1.4,f]); else D.push([3,wx,2.2,z-0.3,0.6,0.9,f,0.4]);
   if(Math.abs(cz-2.0)<1.6&&sg>0) return; PO.push([(pi++)%4,wx-sg*0.002,1.55,z-0.32,0.42,0.6,f,(k%3-1)*0.05]); });
  ZSBake.realism(G,sc,{room:'s41',base:'../assets/bake/gasse2041/',texRoot:'../assets/tex/realism/',lmGain:1,aoInt:0.6,specGain:3,decals:D,posters:PO}); }
 // ---- Animation ----
 let flk=1; const update=(t)=>{ const s=t*0.001; if(Math.random()<0.05) flk=Math.random()<0.4?0.05:1; Ll.intensity=9*LK*flk; headM.color.setHex(flk>0.5?0xe8f0b0:0x30342a); lhs.material.opacity=0.45*flk;
  signs.forEach((g,i)=>{ if(!g.flick) return; if(Math.random()<0.02){ g.base=Math.random()<0.3?0.3:1; setSign(g,g.base); if(i===1) Lc.intensity=7*LK*(0.5+0.5*g.base); } });
  persons.forEach((p,i)=>{ const b=Math.sin(s*1.6+i*1.9); p.scale.set(1+0.008*b,1+0.006*b,1+0.012*b); p.rotation.x=0.015*Math.sin(s*0.4+i); });
  steam.forEach((sp,i)=>{ sp.position.y=0.3+((s*0.25+i*0.4)%2.8); sp.material.opacity=0.08*(1-sp.position.y/3.2); sp.position.x=0.9+Math.sin(s*0.5+sp.userData.ph)*0.2*sp.position.y; });
  drone.position.set(Math.sin(s*0.12)*1.8,7.5+Math.sin(s*0.5)*0.2,-9+Math.cos(s*0.12)*4); drone.rotation.y=s*0.3; led.visible=(s%1.2)<0.15; };
 AFRAME.registerComponent('s41-tick',{tick(t){ update(t); }}); sc.setAttribute('s41-tick','');
 const boxes=[[TX-0.5,TX+0.5,TZ-0.5,TZ+0.5],[2.0,2.6,0.5,1.4],[0.45,2.25,-4.65,-3.65]];
 const collide=(x,z)=>{ let px=0,pz=0; boxes.forEach(([x0,x1,z0,z1])=>{ const r=0.25; if(x>x0-r&&x<x1+r&&z>z0-r&&z<z1+r){ const o=[x-(x0-r),(x1+r)-x,z-(z0-r),(z1+r)-z]; const m=Math.min(...o); if(m===o[0]) px-=o[0]; else if(m===o[1]) px+=o[1]; else if(m===o[2]) pz-=o[2]; else pz+=o[3]; } }); return (px||pz)?[px,pz]:null; };
 return {update,collide,person};
};
})();
