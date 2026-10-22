/* Ost-Berlin 1989 – nasse Kopfsteinpflaster-Straße, Novembernacht, echtes 3D in Schichten (Look nach neon_gasse.jpg).
   nah: Kopfstein, Trabbel, Kisten · mittel: verrußte Altbau-Fassaden, spärliches DDR-Neon, Natriumlampen · fern: die Mauer mit Durchbruch, dahinter West-Flutlicht im Dunst.
   nah: Asphalt (nass, Pfützen), Bordstein, Müll, Kiosk, Passanten (3D), Baum mit Wurzeln, die den Asphalt aufbrechen
   mittel: Ziegelfassaden mit Fenstern, Läden, Rollläden, Neon-Schilder (Glühen + Spiegelstreifen am Boden), Kabel, Laterne mit Wackelkontakt
   fern: Silhouetten + abgedunkeltes Foto im lila Dunst. Licht: nur praktisch (2 Neon, 1 Laterne). window.buildStreet41(sceneEl,C) */
(function(){
let sd=1989; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
window.buildStreet89=function(sc,C){ const BK=!!window.ZSBake&&!/[?&]nobake=1/.test(location.search), LK=BK?0.6:1; const T=THREE, S=sc.object3D, TL=new T.TextureLoader(), G=new T.Group(); S.add(G); const B='../assets/tex/s89/';
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
 { const g=new T.PlaneGeometry(2*XF,Z0-Z1); g.rotateX(-Math.PI/2); g.translate(0,0,(Z0+Z1)/2); add('asph',g,1/1.3); }
 [-1,1].forEach(s=>{ add('curb',box(0.16,0.07,Z0-Z1,s*2.3,0.035,(Z0+Z1)/2),1); for(let z=Z0-1;z>Z1;z-=5+rnd()*4) add('grate',box(0.35,0.012,0.5,s*2.1,0.006,z),1); });
 // ---- Fassaden: Häuser mit unterschiedlicher Breite/Höhe ----
 const lit=[]; const winM=new T.MeshStandardMaterial({color:0x05060a,roughness:0.12,metalness:0.6}); const shops=[];
 [-1,1].forEach(s=>{ let z=Z0+1; let k=0; while(z>Z1){ const w=5+rnd()*4, h=12+rnd()*5, x=s*(XF+(rnd()-0.5)*0.15); const z1=z-w; add('brick',wallX(x,z,z1,0,h,-s),1/1.6);
   add('trim',box(0.35,0.3,w,x-s*0.12,h-0.15,(z+z1)/2),1); add('trim',box(0.2,0.12,w,x-s*0.06,3.5,(z+z1)/2),1);
   if(z1>-30) add('brick',(()=>{ const g=new T.PlaneGeometry(0.4,h); g.rotateY(0); g.translate(x-s*0.2,h/2,z1+0.001); return g; })(),1/1.6);
   for(let fy=4.0; fy<h-1.8; fy+=3.2) for(let wz=z-0.9; wz>z1+0.6; wz-=1.8){ const g=new T.PlaneGeometry(0.95,1.8); g.rotateY(-s*Math.PI/2); g.translate(x-s*0.02,fy+0.75,wz-0.47); const L=rnd(); if(L<0.1) lit.push([g,L<0.05?0:1]); else add('win',g,1); add('frame',box(0.08,0.07,1.05,x-s*0.04,fy-0.02,wz-0.47),1); add('frame',box(0.1,0.12,1.15,x-s*0.05,fy+1.86,wz-0.47),1); }
   shops.push([x,z,z1,s,k++]); z=z1-0.02; } });
 // Erdgeschoss: Läden (dunkles Glas oder Rollladen), Innenschein bei wenigen
 const shutM=new T.MeshStandardMaterial({map:TL.load('../assets/tex/s41/shutter_c.jpg'),color:0x6a6a6a,roughness:0.6,metalness:0.4});
 shops.forEach(([x,z,z1,s,k])=>{ const w=Math.min(3.2,(z-z1)-1.2), cz=(z+z1)/2; if(Math.abs(cz-2.0)<1.6&&s>0) return; const g=new T.PlaneGeometry(w,2.6); g.rotateY(-s*Math.PI/2); g.translate(x-s*0.03,1.35,cz);
   add((k%3===1)?'shut':'win',g,1); add('frame',box(0.1,0.1,w+0.2,x-s*0.06,2.7,cz),1); });
 const MAT={ asph:new T.MeshStandardMaterial({map:ld('cob_c.jpg',1),normalMap:ld('cob_n.jpg'),roughnessMap:ld('cob_r.jpg'),roughness:1,metalness:0.1}),
  brick:new T.MeshStandardMaterial({map:ld('pl_c.jpg',1),normalMap:ld('pl_n.jpg'),roughness:0.95}),
  trim:new T.MeshStandardMaterial({color:0x2a2622,roughness:0.85}), shut:shutM, frame:new T.MeshStandardMaterial({color:0x14110f,roughness:0.6}),
  curb:new T.MeshStandardMaterial({color:0x3a3a3c,roughness:0.7}), grate:new T.MeshStandardMaterial({color:0x101010,roughness:0.4,metalness:0.8}), win:winM };
 // Umgebung für nasse Spiegelung (Neon-Farben im Dunkeln)
 const env=(()=>{ const t=cv(512,256,(x,w,h)=>{ x.fillStyle='#07060c'; x.fillRect(0,0,w,h); [['#ff3a28',60],['#30e0ff',180],['#ff40d0',300],['#40ff90',420]].forEach(([c,u])=>{ x.fillStyle=c; x.fillRect(u,70,14,60); }); x.fillStyle='rgba(220,230,160,0.9)'; x.fillRect(250,40,30,8); const g=x.createLinearGradient(0,128,0,256); g.addColorStop(0,'#1a1430'); g.addColorStop(1,'#050408'); x.fillStyle=g; x.fillRect(0,128,w,128); }); t.mapping=T.EquirectangularReflectionMapping; const pm=new T.PMREMGenerator(sc.renderer); const e=pm.fromEquirectangular(t).texture; pm.dispose(); return e; })();
 MAT.asph.envMap=env; MAT.asph.envMapIntensity=0.9; winM.envMap=env; winM.envMapIntensity=1.2;
 Object.entries(bins).forEach(([k,gs])=>{ const m=new T.Mesh(merge(gs),MAT[k]); m.name='s89_'+k; m.matrixAutoUpdate=false; G.add(m); });
 if(lit.length){ [0,1].forEach(v=>{ const gs=lit.filter(l=>l[1]===v).map(l=>l[0]); if(!gs.length) return; const m=new T.Mesh(merge(gs.map(g=>{ g=g.toNonIndexed(); return g; })),new T.MeshBasicMaterial({color:v?0x6a4a24:0x3a3020})); G.add(m); }); }
 // ---- Neon-Schilder: Glühen, Halo im Dunst, Spiegelstreifen am nassen Boden ----
 const halo=cv(128,128,x=>{ const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.3,'rgba(255,255,255,0.35)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 const stT=TL.load('../assets/tex/s41/streak.png'); const signs=[]; const AT=document.createElement('canvas'); AT.width=2048; AT.height=1024; const ax=AT.getContext('2d'); ax.fillStyle='#000'; ax.fillRect(0,0,2048,1024); let vx=0, hy=0;
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
 neon('GASTSTÄTTE',0xff3020,true,-1,-3.4,5.0,0.5); neon('KONSUM',0xff7a30,false,1,-4.6,3.3,0.42,true); neon('INTERSHOP',0x3a7aff,false,-1,-8.5,3.2,0.38); neon('HO',0x40ff70,false,1,-8.2,3.0,0.4); neon('FRISEUR',0xff40b0,true,1,-1.0,4.2,0.36,true); finishSigns();
 // Neon-Lichtquellen (praktisch): Rot links vorne, Cyan rechts
 const Lr=new T.PointLight(0x4a78ff,5*LK,9,1.6); Lr.position.set(-2.6,3.4,-8.2); G.add(Lr); const Lc={intensity:0};
 // ---- Laterne mit Wackelkontakt (links, z -6.5) ----
 const poleM=new T.MeshStandardMaterial({color:0x1c1e1c,roughness:0.5,metalness:0.6});
 const lampGrp=new T.Group(); const pole=new T.Mesh(new T.CylinderGeometry(0.06,0.09,5.2,10)); pole.position.set(-2.55,2.6,-6.2); lampGrp.add(pole); const arm=new T.Mesh(new T.CylinderGeometry(0.04,0.04,1.1,8)); arm.rotation.z=Math.PI/2-0.15; arm.position.set(-2.05,5.15,-6.2); lampGrp.add(arm);
 const headM=new T.MeshBasicMaterial({color:0xffb060,toneMapped:false}); const head=new T.Mesh(new T.CylinderGeometry(0.22,0.14,0.16,14)); head.position.set(-1.5,5.05,-6.2); lampGrp.add(head); G.add(flat(lampGrp,poleM)); const lens=new T.Mesh(new T.CircleGeometry(0.17,14),headM); lens.rotation.x=Math.PI/2; lens.position.set(-1.5,4.965,-6.2); G.add(lens);
 const lhs=new T.Sprite(new T.SpriteMaterial({map:halo,color:0xff9a50,transparent:true,opacity:0.45,blending:T.AdditiveBlending,depthWrite:false})); lhs.position.set(-1.5,4.9,-6.2); lhs.scale.set(3.2,3.2,1); G.add(lhs);
 const Ll=new T.PointLight(0xff9a40,9*LK,12,1.5); Ll.position.set(-1.5,4.7,-6.2); G.add(Ll);
 { const p2=new T.Mesh(new T.CylinderGeometry(0.06,0.09,5.2,10),poleM); p2.position.set(2.6,2.6,1.2); G.add(p2); const h2=new T.Sprite(new T.SpriteMaterial({map:halo,color:0xff9a50,transparent:true,opacity:0.4,blending:T.AdditiveBlending,depthWrite:false})); h2.position.set(2.0,4.95,1.2); h2.scale.set(2.6,2.6,1); G.add(h2); const L2=new T.PointLight(0xff9040,5*LK,9,1.6); L2.position.set(2.0,4.7,1.2); G.add(L2); const hd2=new T.Mesh(new T.CylinderGeometry(0.22,0.14,0.16,14),poleM); hd2.position.set(2.05,5.05,1.2); G.add(hd2); const ln2=new T.Mesh(new T.CircleGeometry(0.17,14),new T.MeshBasicMaterial({color:0xffb060,toneMapped:false})); ln2.rotation.x=Math.PI/2; ln2.position.set(2.05,4.965,1.2); G.add(ln2); const ar2=new T.Mesh(new T.CylinderGeometry(0.04,0.04,0.6,8),poleM); ar2.rotation.z=Math.PI/2; ar2.position.set(2.35,5.15,1.2); G.add(ar2); }
 // ---- Kabel über die Gasse ----
 const cabM=new T.MeshStandardMaterial({color:0x080808,roughness:0.5}); const cabG=new T.Group();
 [[-1.5,6.5,7.2],[-5,7.4,6.8],[-9,6.2,7.6],[-13,8,7.2],[-18,6.8,7.4]].forEach(([z,y1,y2])=>{ const a=new T.Vector3(-XF+0.1,y1,z), b=new T.Vector3(XF-0.1,y2,z+(rnd()-0.5)*1.5), m=a.clone().lerp(b,0.5); m.y-=0.9+rnd()*0.6; cabG.add(new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(a,m,b),24,0.012,4))); }); G.add(flat(cabG,cabM));
 // ---- Die Mauer quer über die Straße, mit Durchbruch; dahinter West-Flutlicht ----
 const WZ=-11.5; const wallM=new T.MeshStandardMaterial({map:ld('wall_c.jpg',1),normalMap:ld('wall_n.jpg'),roughness:0.85}); const wg=new T.Group();
 for(let x=-XF+0.6,k=0; x<XF; x+=1.2,k++){ if(k===2||k===3) continue; const seg=new T.Group(); const pnl=new T.Mesh(new T.BoxGeometry(1.18,3.4,0.22)); pnl.position.y=1.7; seg.add(pnl); const foot=new T.Mesh(new T.BoxGeometry(1.18,0.25,1.2)); foot.position.set(0,0.125,0.45); seg.add(foot); const pipe=new T.Mesh(new T.CylinderGeometry(0.2,0.2,1.18,14)); pipe.rotation.z=Math.PI/2; pipe.position.y=3.55; seg.add(pipe);
  seg.position.set(x,0,WZ); if(k===4){ seg.rotation.z=-0.16; seg.position.x+=0.25; } wg.add(seg); }
 const broke=new T.Group(); [[0.5,0.1,-0.5,1.2],[1.0,0.15,0.3,0.7],[-0.2,0.08,0.6,1.6]].forEach(([x,y,z,r])=>{ const b=new T.Mesh(new T.BoxGeometry(0.6,0.25,0.35)); b.position.set(x-0.1,y,WZ+z); b.rotation.set(0.3*r,r,0.2); broke.add(b); }); wg.add(broke);
 G.add(flat(wg,wallM));
 const west=new T.Sprite(new T.SpriteMaterial({map:halo,color:0xd8e0ff,transparent:true,opacity:0.75,blending:T.AdditiveBlending,depthWrite:false})); west.position.set(0.3,2.0,WZ-2.0); west.scale.set(6,5.5,1); G.add(west);
 [[-0.4,5,WZ-6,14,0.25],[2,3,WZ-3,6,0.15]].forEach(([x,y,z,s,o])=>{ const h=new T.Sprite(new T.SpriteMaterial({map:halo,color:0xb8c4ff,transparent:true,opacity:o,blending:T.AdditiveBlending,depthWrite:false})); h.position.set(x,y,z); h.scale.set(s,s*0.7,1); G.add(h); });
 const TX=0, TZ=-99; let trabi=null;
 function rbox(w,h,d,r,puff,seg,lump){ const g=new T.BoxGeometry(w,h,d,seg,seg,seg); const p=g.attributes.position, nn=g.attributes.normal; const hx=w/2-r,hy=h/2-r,hz=d/2-r;
  for(let i=0;i<p.count;i++){ let x=p.getX(i),y=p.getY(i),z=p.getZ(i); const cx=Math.max(-hx,Math.min(hx,x)), cy=Math.max(-hy,Math.min(hy,y)), cz=Math.max(-hz,Math.min(hz,z)); let dx=x-cx,dy=y-cy,dz=z-cz; let l=Math.hypot(dx,dy,dz); if(l<1e-6){ dx=nn.getX(i); dy=nn.getY(i); dz=nn.getZ(i); l=1; } dx/=l; dy/=l; dz/=l; x=cx+dx*r; y=cy+dy*r; z=cz+dz*r;
   const ax=Math.min(1,Math.abs(x)/(w/2)), ay=Math.min(1,Math.abs(y)/(h/2)), az=Math.min(1,Math.abs(z)/(d/2)); const pf=puff||0;
   x+=Math.sign(x)*pf*(1-ay*ay)*(1-az*az)*Math.abs(dx); y+=Math.sign(y)*pf*(1-ax*ax)*(1-az*az)*Math.abs(dy); z+=Math.sign(z)*pf*(1-ax*ax)*(1-ay*ay)*Math.abs(dz);
   if(lump){ const s=lump*(Math.sin(x*23+y*7)*Math.sin(z*19-y*11)+0.5*Math.sin(x*41+z*37)); x+=dx*s; y+=dy*s; z+=dz*s; }
   p.setXYZ(i,x,y,z); nn.setXYZ(i,dx,dy,dz); }
  const uv=g.attributes.uv; for(let i=0;i<p.count;i++){ const ax=Math.abs(nn.getX(i)), ay=Math.abs(nn.getY(i)); let u,v; if(ay>=ax&&ay>=Math.abs(nn.getZ(i))){u=p.getX(i);v=p.getZ(i);} else if(ax>=Math.abs(nn.getZ(i))){u=p.getZ(i);v=p.getY(i);} else {u=p.getX(i);v=p.getY(i);} uv.setXY(i,u/0.55,v/0.55); }
  return g; }
 // ---- Trabant 601, rechts geparkt, halb im Schatten: zweifarbig (verschmutztes Papyrusweiß + helles Dach), Rost an Schwellern/Radläufen, nasser Klarlack mit Tropfen ----
 { const TG=new T.Group(); TG.position.set(1.75,0,-4.6); TG.rotation.y=0.03; G.add(TG);
  const body=rbox(1.5,0.58,3.48,0.16,0.014,24,0); { const p=body.attributes.position; for(let i=0;i<p.count;i++){ const z=p.getZ(i), y=p.getY(i); if(y>0&&z>0.9) p.setY(i,y-(z-0.9)*0.16*(y/0.29)); if(y>0&&z<-1.2) p.setY(i,y-(-1.2-z)*0.1*(y/0.29)); } } body.translate(0,0.6,0);
  const cab=rbox(1.3,0.52,1.85,0.12,0.01,14,0); { const p=cab.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i); if(y>0){ const k=y/0.26; p.setX(i,p.getX(i)*(1-0.08*k)); p.setZ(i,p.getZ(i)*(1-0.14*k)-0.04*k); } } } cab.translate(0,1.12,-0.18);
  [body,cab].forEach(g=>{ const uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*0.45,uv.getY(i)*0.45); });
  const hsh=(x,y,z)=>{ const s=Math.sin(x*12.9+y*78.2+z*37.7)*43758.5; return s-Math.floor(s); };
  const nz=(x,y,z)=>0.5*Math.sin(x*7.1+z*3.3)*Math.sin(y*9.4-z*5.2)+0.3*Math.sin(x*17+y*13+z*11)+0.2*(hsh(Math.floor(x*9),Math.floor(y*9),Math.floor(z*9))-0.5);
  const W=[[-1.12,1],[1.18,1]].map(([z])=>-z); // Radmitten (lokal z)
  const paint=[0.11,0.135,0.145], roof=[0.27,0.26,0.23], rustC=[0.17,0.075,0.035], glassC=[0.012,0.014,0.018];
  const shade=(x,y,z,base)=>{ let arch=0; [1.12,-1.18].forEach(wz=>{ const d=Math.hypot(z-wz,y-0.28); arch=Math.max(arch,1-Math.abs(d-0.4)/0.12); });
   const r=Math.max(0,Math.min(1,(nz(x,y,z)+0.15)*1.6+(0.5-y)*1.8+arch*0.9-0.9)); const dirt=0.55+0.45*Math.min(1,Math.max(0,(y-0.2)/0.9));
   return [0,1,2].map(k=>(base[k]*(1-r)+rustC[k]*r)*dirt*(0.92+0.16*(nz(x*3,y*3,z*3)))); };
  const cols=(g,f)=>{ const p=g.attributes.position, c=new Float32Array(p.count*3); for(let i=0;i<p.count;i++) c.set(f(p.getX(i),p.getY(i),p.getZ(i)),i*3); g.setAttribute('color',new T.BufferAttribute(c,3)); };
  cols(body,(x,y,z)=>shade(x,y,z,paint));
  cols(cab,(x,y,z)=>{ const band=y>0.95&&y<1.3; const zz=z+0.18; const pillar=Math.abs(zz-0.02)<0.05||Math.abs(zz+0.86)<0.13||Math.abs(zz-0.8)<0.07; return band&&!pillar?glassC:(y>=1.3?shade(x,y,z,roof):shade(x,y,z,paint)); });
  // Radlauf-Lippen (im Lack), als Teil der Karosserie
  const lips=[]; [1.12,-1.18].forEach(wz=>[-1,1].forEach(s=>{ const g=new T.TorusGeometry(0.4,0.03,6,22,Math.PI); g.rotateY(Math.PI/2); g.translate(s*0.745,0.28,wz); cols(g,(x,y,z)=>shade(x,y,z,paint)); lips.push(g); }));
  const all=[body,cab].map(g=>g.toNonIndexed()); const bg=new T.BufferGeometry(); ['position','normal','uv','color'].forEach(k=>{ let n=0; all.forEach(g=>n+=g.attributes[k].array.length); const a=new Float32Array(n); let o=0; all.forEach(g=>{ a.set(g.attributes[k].array,o); o+=g.attributes[k].array.length; }); bg.setAttribute(k,new T.BufferAttribute(a,all[0].attributes[k].itemSize)); });
  const dn=ld('drops_n.jpg',0,2.2);
  const trabiM=new T.MeshPhysicalMaterial({vertexColors:true,map:ld('trabi_g.jpg',1),roughnessMap:ld('trabi_r.jpg'),roughness:1,metalness:0.05,clearcoat:0.45,clearcoatRoughness:0.12,clearcoatNormalMap:dn,clearcoatNormalScale:new T.Vector2(0.9,0.9),envMap:env,envMapIntensity:0.3});
  TG.add(new T.Mesh(bg,trabiM));
  // Fenster als eigene Schale (glänzend schwarz, Tropfen): Dreiecke des Fensterbands, minimal nach außen versetzt
  { const g=cab.toNonIndexed(), p=g.attributes.position, nn=g.attributes.normal, uv=g.attributes.uv; const P=[],N=[],U=[]; for(let t=0;t<p.count;t+=3){ let ok=true; for(let j=0;j<3;j++){ const y=p.getY(t+j), zz=p.getZ(t+j)+0.18, ny=nn.getY(t+j); if(!(y>0.96&&y<1.29)||Math.abs(ny)>0.7||Math.abs(zz-0.02)<0.055||Math.abs(zz+0.86)<0.14||Math.abs(zz-0.8)<0.075) ok=false; } if(!ok) continue; for(let j=0;j<3;j++){ const i=t+j; P.push(p.getX(i)+nn.getX(i)*0.004,p.getY(i)+nn.getY(i)*0.004,p.getZ(i)+nn.getZ(i)*0.004); N.push(nn.getX(i),nn.getY(i),nn.getZ(i)); U.push(uv.getX(i)*2,uv.getY(i)*2); } }
   const wg=new T.BufferGeometry(); wg.setAttribute('position',new T.Float32BufferAttribute(P,3)); wg.setAttribute('normal',new T.Float32BufferAttribute(N,3)); wg.setAttribute('uv',new T.Float32BufferAttribute(U,2));
   TG.add(new T.Mesh(wg,new T.MeshPhysicalMaterial({color:0x020304,roughness:0.05,metalness:0.2,clearcoat:1,clearcoatRoughness:0.02,clearcoatNormalMap:ld('drops_n.jpg',0,3),clearcoatNormalScale:new T.Vector2(1.2,1.2),envMap:env,envMapIntensity:1.3}))); }
  // Radkästen (dunkel) hinter den Reifen
  const well=[]; [1.12,-1.18].forEach(wz=>[-1,1].forEach(s=>{ const g=new T.CircleGeometry(0.39,20,0,Math.PI); g.rotateY(s*Math.PI/2); g.translate(s*0.752,0.28,wz); well.push(g.toNonIndexed()); const b=new T.PlaneGeometry(0.3,0.78); b.rotateX(Math.PI/2); b.translate(s*0.62,0.66,wz); well.push(b.toNonIndexed()); }));
  const wm=new T.Mesh(merge(well),new T.MeshBasicMaterial({color:0x020202,side:T.DoubleSide})); TG.add(wm);
  // Reifen mit Flanke, Radkappen
  const tyre=new T.MeshStandardMaterial({color:0x0b0b0b,roughness:0.75}); const chrome=new T.MeshStandardMaterial({color:0xa8a8a4,map:ld('trabi_g.jpg',1,0.4),roughness:0.2,metalness:1.0,envMap:env,envMapIntensity:1.2}); const wh=new T.Group(), cr=new T.Group();
  [[-0.66,1.12],[0.66,1.12],[-0.66,-1.18],[0.66,-1.18]].forEach(([x,z])=>{ const s=Math.sign(x); const t=new T.Mesh(new T.CylinderGeometry(0.27,0.27,0.15,22)); t.rotation.z=Math.PI/2; t.position.set(x,0.28,z); wh.add(t); [-1,1].forEach(q=>{ const tr=new T.Mesh(new T.TorusGeometry(0.235,0.04,6,22)); tr.rotation.y=Math.PI/2; tr.position.set(x+q*0.075,0.28,z); wh.add(tr); });
   const cap=new T.Mesh(new T.SphereGeometry(0.15,16,6,0,Math.PI*2,0,Math.PI/2)); cap.scale.set(1,0.25,1); cap.rotation.z=-s*Math.PI/2; cap.position.set(x+s*0.08,0.28,z); cr.add(cap); });
  TG.add(flat(wh,tyre));
  // Chrom-Stoßstangen (mit Ecken + Hörnern), Scheinwerferringe, Türgriffe, Spiegel
  [1.79,-1.79].forEach(z=>{ const b=new T.Mesh(rbox(1.5,0.1,0.1,0.045,0,4,0)); b.position.set(0,0.4,z); cr.add(b); [-1,1].forEach(s=>{ const e=new T.Mesh(rbox(0.1,0.1,0.3,0.045,0,4,0)); e.position.set(s*0.72,0.4,z-Math.sign(z)*0.12); cr.add(e); const h=new T.Mesh(rbox(0.06,0.16,0.07,0.025,0,3,0)); h.position.set(s*0.38,0.44,z+Math.sign(z)*0.03); cr.add(h); }); });
  const hlP=[[-0.46,0.6,1.735],[0.46,0.6,1.735]]; hlP.forEach(([x,y,z])=>{ const r=new T.Mesh(new T.TorusGeometry(0.1,0.016,8,24)); r.position.set(x,y,z+0.01); cr.add(r); });
  [-1,1].forEach(s=>{ const h=new T.Mesh(new T.BoxGeometry(0.03,0.025,0.12)); h.position.set(s*0.765,0.98,0.38); cr.add(h); }); { const st=new T.Mesh(new T.CylinderGeometry(0.01,0.01,0.12,6)); st.rotation.z=1.2; st.position.set(-0.8,1.02,0.66); cr.add(st); const mi=new T.Mesh(new T.CylinderGeometry(0.045,0.045,0.02,14)); mi.rotation.z=Math.PI/2; mi.position.set(-0.85,1.04,0.66); cr.add(mi); }
  TG.add(flat(cr,chrome));
  // Scheinwerfer: Reflektor (dunkler Chrom) + gewölbtes Glas; aus. Rückleuchten rund, dunkelrot, Blinker bernstein
  const refl=new T.MeshStandardMaterial({color:0x6a6a66,roughness:0.15,metalness:1,envMap:env}); const lensM=new T.MeshStandardMaterial({color:0xd8dce0,roughness:0.03,metalness:0.1,transparent:true,opacity:0.28,envMap:env,envMapIntensity:2.2,depthWrite:false});
  const rg=[], lg=[]; hlP.forEach(([x,y,z])=>{ const d=new T.SphereGeometry(0.09,18,6,0,Math.PI*2,0,Math.PI/2); d.scale(1,0.3,1); d.rotateX(Math.PI/2); const dd=d.clone(); d.scale(1,1,-1); d.translate(x,y,z+0.02); rg.push(d.toNonIndexed()); dd.scale(1,1,1.6); dd.translate(x,y,z+0.005); lg.push(dd.toNonIndexed()); });
  const tl=new T.MeshStandardMaterial({color:0x3a0806,roughness:0.1,emissive:0x1a0200,envMap:env}); [-0.55,0.55].forEach(x=>{ const d=new T.SphereGeometry(0.065,14,6,0,Math.PI*2,0,Math.PI/2); d.scale(1,0.35,1); d.rotateX(-Math.PI/2); d.translate(x,0.72,-1.74); lg.push(d.toNonIndexed()); const c=new T.CircleGeometry(0.06,14); c.rotateY(Math.PI); c.translate(x,0.72,-1.742); const m=new T.Mesh(c,tl); TG.add(m); });
  TG.add(new T.Mesh(merge(rg),refl)); const lm=new T.Mesh(merge(lg),lensM); lm.renderOrder=3; TG.add(lm);
  const amb=new T.MeshStandardMaterial({color:0x4a2a06,roughness:0.15,emissive:0x0a0400,envMap:env}); [-0.6,0.6].forEach(x=>{ const c=new T.Mesh(new T.CircleGeometry(0.035,10),amb); c.position.set(x,0.45,1.745); TG.add(c); });
  // Grill-Schlitze, Scheibenwischer, Türfugen, Kennzeichen
  const dk=new T.Group(); for(let i=0;i<3;i++){ const s=new T.Mesh(new T.BoxGeometry(0.5,0.012,0.01)); s.position.set(0,0.56+i*0.03,1.742); dk.add(s); }
  [[-0.05,1.0],[0.55,1.0]].forEach(([x])=>{ const a=new T.Vector3(x,0.9,0.755), b=new T.Vector3(x-0.4,0.95,0.755); const w=new T.Mesh(new T.BoxGeometry(0.012,0.014,a.distanceTo(b))); w.position.copy(a).lerp(b,0.5); w.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),b.clone().sub(a).normalize()); dk.add(w); const arm=new T.Mesh(new T.CylinderGeometry(0.01,0.01,0.05,6)); arm.position.copy(a); dk.add(arm); });
  [-1,1].forEach(s=>{ [0.62,-0.5].forEach(z=>{ const f=new T.Mesh(new T.BoxGeometry(0.004,0.42,0.006)); f.position.set(s*0.752,0.64,z); dk.add(f); }); const f2=new T.Mesh(new T.BoxGeometry(0.004,0.006,1.12)); f2.position.set(s*0.752,0.44,0.06); dk.add(f2); });
  TG.add(flat(dk,new T.MeshStandardMaterial({color:0x050505,roughness:0.5})));
  const plT=cv(256,64,(x)=>{ x.fillStyle='#b8b4a8'; x.fillRect(0,0,256,64); x.strokeStyle='#111'; x.lineWidth=4; x.strokeRect(3,3,250,58); x.fillStyle='#151515'; x.font='bold 40px Arial'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('IA 23-45',128,34); });
  const plM=new T.MeshStandardMaterial({map:plT,roughness:0.6,color:0x707070}); [[1.765,0],[-1.765,Math.PI]].forEach(([z,r])=>{ const p=new T.Mesh(new T.PlaneGeometry(0.4,0.1),plM); p.position.set(0,0.3,z+Math.sign(z)*0.075); p.rotation.y=r; TG.add(p); });
  // Kontaktschatten + Pfütze unterm Auto
  const ao=cv(128,128,(x)=>{ const g=x.createRadialGradient(64,64,10,64,64,64); g.addColorStop(0,'rgba(0,0,0,0.9)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); }); const sh=new T.Mesh(new T.PlaneGeometry(2.2,4.4),new T.MeshBasicMaterial({map:ao,transparent:true,depthWrite:false,color:0x000000})); sh.material.alphaMap=ao; sh.rotation.x=-Math.PI/2; sh.position.y=0.008; TG.add(sh);
  trabi=[1.75,-4.6]; }
 // Trabbel verschieben (alles oben ab car) erledigt per Gruppe unten
 // ---- Gully mit Dampf, Müllsäcke, Kartons ----
 const mh=new T.Mesh(new T.CircleGeometry(0.34,24),new T.MeshStandardMaterial({map:cv(128,128,(x)=>{ x.fillStyle='#1a1a1a'; x.beginPath(); x.arc(64,64,62,0,7); x.fill(); x.strokeStyle='#333'; x.lineWidth=3; for(let r=12;r<60;r+=10){ x.beginPath(); x.arc(64,64,r,0,7); x.stroke(); } }),roughness:0.4,metalness:0.8})); mh.rotation.x=-Math.PI/2; mh.position.set(-0.6,0.006,-4.2); G.add(mh);
 const steamT=halo; const steam=[]; for(let i=0;i<7;i++){ const sp=new T.Sprite(new T.SpriteMaterial({map:steamT,color:0x8a7aa0,transparent:true,opacity:0.09,depthWrite:false})); sp.position.set(-0.6,0.3+i*0.4,-4.2); sp.scale.set(1.2+i*0.35,1.2+i*0.35,1); sp.userData.ph=rnd()*6; steam.push(sp); G.add(sp); }
 const bagG=new T.Group(); const bagM=new T.MeshStandardMaterial({color:0x050506,roughness:0.12,metalness:0.2,envMap:env,envMapIntensity:1.5});
 [[-2.85,1.0,0.32],[-2.6,1.35,0.28],[-2.9,1.55,0.25],[-2.75,-4.2,0.3]].forEach(([x,z,r])=>{ const g=new T.SphereGeometry(r,14,10); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i); const f=1+0.12*Math.sin(p.getX(i)*30+y*20)*Math.sin(p.getZ(i)*25); p.setXYZ(i,p.getX(i)*f,(y>0?y*(1-0.25*(y/r)):y*0.7)*f+(y>r*0.8?0.06:0),p.getZ(i)*f); } g.computeVertexNormals(); const m=new T.Mesh(g); m.position.set(x,r*0.65,z); bagG.add(m); }); G.add(flat(bagG,bagM));
 const cardM=new T.MeshStandardMaterial({color:0x4a3a26,roughness:0.95}); const cg=new T.Group(); [[-2.8,0.3,0.5,0.35,0.4,0.2],[-2.7,-0.15,0.4,0.3,0.35,-0.3]].forEach(([x,z,w,h,d,r])=>{ const b=new T.Mesh(new T.BoxGeometry(w,h,d)); b.position.set(x,h/2,z); b.rotation.y=r; cg.add(b); }); G.add(flat(cg,cardM));
 // ---- Ferne Schicht: Foto + Dunst ----
 const far=new T.MeshBasicMaterial({color:0x5a6a90}); TL.load('../assets/era1989/street_backdrop.jpg',t=>{ t.colorSpace=T.SRGBColorSpace; far.map=t; far.needsUpdate=true; }); const fp=new T.Mesh(new T.PlaneGeometry(14,10),far); fp.position.set(0,4.5,-24); G.add(fp);
 [[0,3,-14,16,0.12],[0,2,-22,22,0.15],[0,5,-9,10,0.06]].forEach(([x,y,z,s,o])=>{ const h=new T.Sprite(new T.SpriteMaterial({map:halo,color:0x4a4a6a,transparent:true,opacity:o,depthWrite:false})); h.position.set(x,y,z); h.scale.set(s,s*0.6,1); G.add(h); });
 S.add(new T.HemisphereLight(0x22283a,0x060504,BK?0.3:0.5));
 const persons=[];
 // ---- Gebackenes Licht (Blender, inkl. West-Flutlicht durch den Mauerdurchbruch) + Decals/Plakatreste (je 1 Draw) ----
 if(window.ZSBake){ const D=[], PO=[]; let pi=0;
  [[0.6,1.4,1.3,1],[-1.2,-1.6,1.1,9],[1.5,-6.4,1.2,0],[-0.6,-8.4,1.2,1],[0.3,-10.4,1.4,0],[-1.5,2.8,1.0,0],[1.0,-2.2,0.7,0],[0.8,0.2,1.2,2],[-1.0,-6.8,1.4,2],[1.4,-9.6,1.0,2],[0.3,4.2,1.2,8],[-0.4,-4.0,0.9,11]].forEach(([x,z,w,c],i)=>D.push([c,x,0.004,z,w,w*(c==8?2.5:1),'y',i*1.3]));
  [-1,1].forEach(sg=>{ for(let z=6;z>-11;z-=3.6) D.push([7,sg*2.05,0.004,z,0.5,3.8,'y',0]); });
  shops.forEach(([x,z,z1,sg,k])=>{ if(z1>8||z<-12) return; const wx=x-sg*0.006, f=sg>0?'-x':'+x', cz=(z+z1)/2, wl=z-z1;
   D.push([4,wx,0.35,cz,wl*0.9,0.7,f]); D.push([5,wx,3.0,cz+(k%2?0.6:-0.6),1.2,1.1,f]); if(k%2) D.push([10,wx,4.6,cz-0.8,1.6,1.4,f]); else D.push([3,wx,2.2,z-0.3,0.6,0.9,f,0.4]);
   if(Math.abs(cz-2.0)<1.6&&sg>0) return; PO.push([(pi++)%4,wx-sg*0.002,1.55,z-0.32,0.42,0.6,f,(k%3-1)*0.05]); });
  ZSBake.realism(G,sc,{room:'s89',base:'../assets/bake/berlin1989/',texRoot:'../assets/tex/realism/',lmGain:1,aoInt:0.6,specGain:3,decals:D,posters:PO}); }
 // ---- Animation ----
 let flk=1; const update=(t)=>{ const s=t*0.001; if(Math.random()<0.05) flk=Math.random()<0.4?0.05:1; Ll.intensity=9*LK*flk; headM.color.setHex(flk>0.5?0xffb060:0x342818); lhs.material.opacity=0.45*flk;
  signs.forEach((g,i)=>{ if(!g.flick) return; if(Math.random()<0.02){ g.base=Math.random()<0.3?0.3:1; setSign(g,g.base); if(i===1) Lc.intensity=7*(0.5+0.5*g.base); } });
  persons.forEach((p,i)=>{ const b=Math.sin(s*1.6+i*1.9); p.scale.set(1+0.008*b,1+0.006*b,1+0.012*b); p.rotation.x=0.015*Math.sin(s*0.4+i); });
  steam.forEach((sp,i)=>{ sp.position.y=0.3+((s*0.25+i*0.4)%2.8); sp.material.opacity=0.08*(1-sp.position.y/3.2); sp.position.x=-0.6+Math.sin(s*0.5+sp.userData.ph)*0.2*sp.position.y; });
   };
 AFRAME.registerComponent('s41-tick',{tick(t){ update(t); }}); sc.setAttribute('s41-tick','');
 const boxes=[[0.95,2.55,-6.45,-2.75]];
 const collide=(x,z)=>{ let px=0,pz=0; boxes.forEach(([x0,x1,z0,z1])=>{ const r=0.25; if(x>x0-r&&x<x1+r&&z>z0-r&&z<z1+r){ const o=[x-(x0-r),(x1+r)-x,z-(z0-r),(z1+r)-z]; const m=Math.min(...o); if(m===o[0]) px-=o[0]; else if(m===o[1]) px+=o[1]; else if(m===o[2]) pz-=o[2]; else pz+=o[3]; } }); return (px||pz)?[px,pz]:null; };
 return {update,collide};
};
})();
