/* Basketball-Hinterhof 1989 – echtes 3D nach dem Foto, das Pete mochte (basket_grok_p1_20): Korb mittig auf der Ziegelwand,
   Schwanenhals-Laterne rechts daneben, zwei warm erleuchtete Fenster mit Gardinen, Paletten + Fahrrad rechts, Tonnen links, nasser rissiger Asphalt mit Laub.
   Wände exakt auf den Physik-Ebenen (z −5,12 / +6,5, x ±6,5), Brett = Physik-Brett (0, 2,835, −5,0), Ring bleibt aus basket.html.
   window.buildHof(sceneEl) → {update} */
(function(){
let sd=1989; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
window.buildHof=function(sc){ const T=THREE, S=sc.object3D, TL=new T.TextureLoader(), G=new T.Group(); S.add(G); const B='../assets/tex/hof/';
 const ld=(f,srgb,rx,ry)=>{ const t=TL.load(f.includes('/')?f:B+f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; if(rx) t.repeat.set(rx,ry||rx); return t; };
 const cv=(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t; };
 const XW=6.5, ZF=-5.12, ZB=6.5, YB=3.0, YR=8.6;
 const merge=gs=>{ gs=gs.map(g=>g.index?g.toNonIndexed():g); let n=0; gs.forEach(g=>n+=g.attributes.position.count); const r=new T.BufferGeometry(); Object.keys(gs[0].attributes).forEach(k=>{ if(!gs.every(g=>g.attributes[k])) return; const sz=gs[0].attributes[k].itemSize,a=new Float32Array(n*sz); let o=0; gs.forEach(g=>{ a.set(g.attributes[k].array,o); o+=g.attributes[k].array.length; }); r.setAttribute(k,new T.BufferAttribute(a,sz)); }); return r; };
 const bins={}; const add=(k,g,us)=>{ us=us||1; g=g.index?g.toNonIndexed():g; g.computeVertexNormals(); const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2); for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)); let u,v; if(ny>0.6){u=x;v=z;} else if(nx>0.6){u=z;v=y;} else {u=x;v=y;} uv[i*2]=u*us; uv[i*2+1]=v*us; } g.setAttribute('uv',new T.BufferAttribute(uv,2)); ['color'].forEach(k=>g.attributes[k]&&g.deleteAttribute(k)); (bins[k]=bins[k]||[]).push(g); };
 const flat=(grp,mat)=>{ grp.updateMatrixWorld(true); const gs=[]; grp.traverse(o=>{ if(o.isMesh){ let g=o.geometry.clone(); g.applyMatrix4(o.matrixWorld); g=g.index?g.toNonIndexed():g; if(!g.attributes.uv) g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2)); ['color','uv1'].forEach(k=>g.attributes[k]&&g.deleteAttribute(k)); gs.push(g); } }); const m=new T.Mesh(merge(gs),mat); m.matrixAutoUpdate=false; return m; };
 const box=(w,h,d,x,y,z)=>{ const g=new T.BoxGeometry(w,h,d); g.translate(x,y,z); return g; };
 const wallZ=(z,x0,x1,y0,y1,f)=>{ const g=new T.PlaneGeometry(x1-x0,y1-y0); if(f<0) g.rotateY(Math.PI); g.translate((x0+x1)/2,(y0+y1)/2,z); return g; };
 const wallX=(x,z0,z1,y0,y1,f)=>{ const g=new T.PlaneGeometry(z1-z0,y1-y0); g.rotateY(f>0?Math.PI/2:-Math.PI/2); g.translate(x,(y0+y1)/2,(z0+z1)/2); return g; };
 // ---- Boden ----
 { const g=new T.PlaneGeometry(2*XW,ZB-ZF); g.rotateX(-Math.PI/2); g.translate(0,0,(ZB+ZF)/2); add('asph',g,1/4); }
 // ---- Wände: Ziegel unten, Putz oben; Sims, Dachrinne ----
 add('brick',wallZ(ZF,-XW,XW,0,YB,1),1/1.6); add('pl',wallZ(ZF,-XW,XW,YB,YR,1),1/2.2); add('trim',box(2*XW,0.14,0.12,0,YB,ZF+0.06));
 [-1,1].forEach(s=>{ add('brick',wallX(s*XW,ZF,ZB,0,YB,-s),1/1.6); add('pl',wallX(s*XW,ZF,ZB,YB,YR,-s),1/2.2); add('trim',box(0.12,0.14,ZB-ZF,s*(XW-0.06),YB,(ZF+ZB)/2)); });
 add('brick',wallZ(ZB,-XW,XW,0,YB,-1),1/1.6); add('pl',wallZ(ZB,-XW,XW,YB,YR,-1),1/2.2);
 add('trim',box(2*XW,0.22,0.3,0,YR,ZF+0.15)); [-1,1].forEach(s=>add('trim',box(0.3,0.22,ZB-ZF,s*(XW-0.15),YR,(ZF+ZB)/2)));
 // Fenster: zwei warm erleuchtete mit Gardine (Front), sonst dunkel; Fallrohre, Stromkasten
 const curT=cv(128,192,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#ffcf8a'); g.addColorStop(1,'#b8763a'); x.fillStyle=g; x.fillRect(0,0,w,h); for(let i=0;i<w;i+=6){ x.fillStyle=`rgba(80,40,10,${0.15+0.15*Math.sin(i*0.7)})`; x.fillRect(i,0,3,h); } x.fillStyle='#2a1a10'; x.fillRect(w/2-3,0,6,h); x.fillRect(0,h*0.45,w,5); x.strokeStyle='#2a1a10'; x.lineWidth=8; x.strokeRect(0,0,w,h); });
 const litW=[], darkW=[];
 [[-2.07,3.95],[2.3,3.95]].forEach(([x,y])=>{ const g=new T.PlaneGeometry(0.72,0.95); g.translate(x,y,ZF+0.02); litW.push(g.toNonIndexed()); add('trim',box(0.9,0.06,0.16,x,y-0.52,ZF+0.08)); });
 for(let x=-5.2;x<5.5;x+=2.1) [6.3,7.6].forEach(y=>{ if(rnd()<0.25||(x>0.0&&x<2.0&&y<7)) return; const wx=x+(rnd()-0.5)*0.3; const g=new T.PlaneGeometry(0.72,0.95); g.translate(wx,y-1.4,ZF+0.02); darkW.push(g.toNonIndexed()); add('trim',box(0.86,0.06,0.14,wx,y-1.4-0.5,ZF+0.07)); add('trim',box(0.84,0.84*0+0.05,0.06,wx,y-1.4+0.5,ZF+0.03)); });
 [-1,1].forEach(s=>{ for(let z=ZF+1.5;z<ZB-1;z+=2.2) [4.2,6.2].forEach(y=>{ if(rnd()<0.3) return; const g=new T.PlaneGeometry(0.72,0.95); g.rotateY(-s*Math.PI/2); g.translate(s*(XW-0.02),y,z); darkW.push(g.toNonIndexed()); }); });
 for(let x=-5;x<5.5;x+=2.4) [4.2,6.2].forEach(y=>{ if(rnd()<0.35) return; const g=new T.PlaneGeometry(0.72,0.95); g.rotateY(Math.PI); g.translate(x,y,ZB-0.02); darkW.push(g.toNonIndexed()); });
 G.add(new T.Mesh(merge(litW),new T.MeshBasicMaterial({map:curT,color:0xa07850}))); G.add(new T.Mesh(merge(darkW),new T.MeshStandardMaterial({color:0x0a0b0e,roughness:0.08,metalness:0.7,envMapIntensity:1.2})));
 const pipes=new T.Group(); [[-3.4,ZF+0.12],[XW-0.12,-1.0],[-XW+0.12,3.5]].forEach(([x,z])=>{ const p=new T.Mesh(new T.CylinderGeometry(0.055,0.055,YR,8)); p.position.set(x,YR/2,z); pipes.add(p); const f=new T.Mesh(new T.CylinderGeometry(0.07,0.08,0.25,8)); f.position.set(x,0.12,z); pipes.add(f); for(let y=1;y<YR;y+=1.6){ const c=new T.Mesh(new T.BoxGeometry(0.16,0.04,0.16)); c.position.set(x,y,z); pipes.add(c); } });
 { const b=new T.Mesh(new T.BoxGeometry(0.5,0.7,0.2)); b.position.set(-XW+0.1,1.6,-2.2); pipes.add(b); }
 // ---- Korbbrett: verwittertes Holz mit Metallrahmen + Halterung (Physik-Brett 1,82×1,25 bei (0, 2,835, −5,0)) ----
 { const bm=new T.MeshStandardMaterial({map:ld('board_c.jpg',1),roughness:0.85}); bm.map.wrapS=bm.map.wrapT=T.ClampToEdgeWrapping; bm.map.repeat.set(1,1); const b=new T.Mesh(new T.BoxGeometry(1.82,1.25,0.06),[0,0,0,0,bm,0].map(v=>v||new T.MeshStandardMaterial({color:0x2a241e,roughness:0.9}))); b.position.set(0,2.835,-5.0); b.rotation.z=0.012; G.add(b);
   [-0.7,0.7].forEach(x=>{ const m=new T.Mesh(new T.BoxGeometry(0.06,0.06,0.09)); m.position.set(x,2.835+0.45,-5.07); pipes.add(m); const m2=m.clone(); m2.position.y=2.835-0.45; pipes.add(m2); }); }
 // ---- Schwanenhals-Laterne (Kopf bei (0,95, 4,55, −4,7), Mast x 1,55) ----
 const poleM=new T.MeshStandardMaterial({color:0x2a241e,roughness:0.55,metalness:0.6});
 { const lg=new T.Group(); const p=new T.Mesh(new T.CylinderGeometry(0.06,0.085,4.9,10)); p.position.set(1.55,2.45,-4.95); lg.add(p); const ft=new T.Mesh(new T.CylinderGeometry(0.11,0.13,0.4,10)); ft.position.set(1.55,0.2,-4.95); lg.add(ft);
   const cur=new T.CatmullRomCurve3([new T.Vector3(1.55,4.85,-4.95),new T.Vector3(1.5,5.2,-4.9),new T.Vector3(1.25,5.25,-4.8),new T.Vector3(1.0,4.9,-4.72)]); lg.add(new T.Mesh(new T.TubeGeometry(cur,20,0.035,6)));
   const sh=new T.Mesh(new T.CylinderGeometry(0.06,0.24,0.22,16,1,true)); sh.position.set(0.95,4.72,-4.7); lg.add(sh); G.add(flat(lg,poleM)); }
 const bulb=new T.Mesh(new T.SphereGeometry(0.075,12,8),new T.MeshBasicMaterial({color:0xffd9a0,toneMapped:false})); bulb.position.set(0.95,4.62,-4.7); G.add(bulb);
 const halo=cv(128,128,x=>{ const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.3,'rgba(255,255,255,0.3)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 const hs=new T.Sprite(new T.SpriteMaterial({map:halo,color:0xffb060,transparent:true,opacity:0.6,blending:T.AdditiveBlending,depthWrite:false})); hs.position.set(0.95,4.6,-4.65); hs.scale.set(2.6,2.6,1); G.add(hs);
 // weicher Lichtkegel im Dunst (Film-Trick): additiver Kegel, nach unten auslaufend
 { const ct=cv(64,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(255,190,110,0.5)'); g.addColorStop(1,'rgba(255,160,80,0)'); x.fillStyle=g; x.fillRect(0,0,w,h); const s=x.createLinearGradient(0,0,w,0); s.addColorStop(0,'rgba(0,0,0,1)'); s.addColorStop(0.5,'rgba(0,0,0,0)'); s.addColorStop(1,'rgba(0,0,0,1)'); x.globalCompositeOperation='destination-out'; x.fillStyle=s; x.fillRect(0,0,w,h); });
   const cg=new T.CylinderGeometry(0.2,1.8,4.5,24,1,true); cg.translate(0,-2.25,0); const cone=new T.Mesh(cg,new T.MeshBasicMaterial({map:ct,transparent:true,opacity:0.22,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide})); cone.position.set(0.95,4.6,-4.4); G.add(cone); }
 // ---- Paletten + Fahrrad rechts, Tonnen links (wie im Foto) ----
 const woodM=new T.MeshStandardMaterial({map:ld('../assets/tex/kirmes/WoodFloor/WoodFloor051_1K-JPG_Color.jpg',1,0.6),color:0x6a5a48,roughness:0.9}); const pg=new T.Group();
 const pallet=(x,y,z,ry,tilt)=>{ const g=new T.Group(); for(let i=0;i<7;i++){ const s=new T.Mesh(new T.BoxGeometry(1.2,0.022,0.1)); s.position.set(0,0.13,-0.4+i*0.135); g.add(s); } for(let i=0;i<3;i++){ const s=new T.Mesh(new T.BoxGeometry(0.1,0.1,0.95)); s.position.set(-0.52+i*0.52,0.06,0); g.add(s); const b=new T.Mesh(new T.BoxGeometry(1.2,0.022,0.1)); b.position.set(0,0.01,-0.4+i*0.4); g.add(b); } g.position.set(x,y,z); g.rotation.set(tilt||0,ry,0); pg.add(g); };
 pallet(2.9,0,-4.55,0.02); pallet(2.92,0.145,-4.55,-0.03); pallet(2.88,0.29,-4.58,0.05); pallet(2.95,0.435,-4.52,0); pallet(4.3,0.62,-4.95,0.04,-1.45); pallet(5.1,0,-4.5,0.3);
 G.add(flat(pg,woodM));
 { const bk=new T.Group(); const tube=(a,b,r)=>{ const d=b.clone().sub(a); const m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),6)); m.position.copy(a).lerp(b,0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()); bk.add(m); };
   const V=(x,y)=>new T.Vector3(x,y,0); [[-0.52,0.34],[0.52,0.34]].forEach(([x,y])=>{ const w=new T.Mesh(new T.TorusGeometry(0.33,0.018,6,28)); w.position.set(x,y,0); bk.add(w); for(let i=0;i<8;i++){ const a=i/8*Math.PI; tube(V(x+Math.cos(a)*0.32,y+Math.sin(a)*0.32),V(x-Math.cos(a)*0.32,y-Math.sin(a)*0.32),0.003); } });
   const bb=V(0,0.36), st=V(-0.12,0.9), hd=V(0.4,0.92); tube(V(-0.52,0.34),bb,0.014); tube(bb,st,0.016); tube(st,hd,0.016); tube(bb,hd,0.018); tube(V(-0.52,0.34),st,0.012); tube(hd,V(0.52,0.34),0.016); tube(V(0.4,0.92),V(0.38,1.08),0.014); tube(V(0.25,1.1),V(0.52,1.06),0.012); tube(st,V(-0.14,1.0),0.012);
   const seat=new T.Mesh(new T.BoxGeometry(0.22,0.05,0.1)); seat.position.set(-0.15,1.02,0); bk.add(seat);
   bk.position.set(4.25,0,-4.82); bk.rotation.set(0,0.06,-0.12); G.add(flat(bk,new T.MeshStandardMaterial({color:0x1e2226,roughness:0.4,metalness:0.7}))); }
 { const tg=new T.Group(); [[-4.9,-4.6],[-4.1,-4.65]].forEach(([x,z])=>{ for(let i=0;i<8;i++){ const s=new T.Mesh(new T.BoxGeometry(0.1,1.05,0.02)); const a=i/8*6.28; s.position.set(x+Math.cos(a)*0.32,0.53,z+Math.sin(a)*0.32); s.rotation.y=-a+Math.PI/2; tg.add(s); } [0.2,0.85].forEach(y=>{ const r=new T.Mesh(new T.TorusGeometry(0.33,0.015,4,16)); r.rotation.x=Math.PI/2; r.position.set(x,y,z); tg.add(r); }); const lid=new T.Mesh(new T.CylinderGeometry(0.36,0.36,0.04,14)); lid.position.set(x+0.05,1.08,z); lid.rotation.z=0.12; tg.add(lid); }); G.add(flat(tg,woodM)); }
 // Laub-Haufen an der Wand, Zeitung, Glasscherben (in Asphalttextur + ein paar 3D-Blätter)
 { const lt=cv(64,64,(x)=>{ x.clearRect(0,0,64,64); x.fillStyle='#5a3a14'; x.beginPath(); x.ellipse(32,32,28,14,0.4,0,7); x.fill(); x.strokeStyle='#2a1a08'; x.lineWidth=2; x.beginPath(); x.moveTo(8,40); x.lineTo(56,24); x.stroke(); });
   const lq=[]; for(let i=0;i<160;i++){ const g=new T.PlaneGeometry(0.09,0.09); g.rotateX(-Math.PI/2+(rnd()-0.5)*0.6); g.rotateY(rnd()*6.28); const side=rnd(); let x,z; if(side<0.6){ x=(rnd()-0.5)*12.4; z=ZF+0.1+Math.pow(rnd(),2)*1.2; } else { x=(rnd()<0.5?-1:1)*(XW-0.1-Math.pow(rnd(),2)*1.0); z=ZF+rnd()*11; } g.translate(x,0.01+rnd()*0.03,z); lq.push(g.toNonIndexed()); }
   G.add(new T.Mesh(merge(lq),new T.MeshStandardMaterial({map:lt,alphaTest:0.5,side:T.DoubleSide,roughness:0.9,color:0x9a8a7a}))); }
 // ---- Rückseite: Tordurchfahrt mit Maschendraht, dahinter Straße im Dunst ----
 { const gt=cv(256,256,(x)=>{ x.clearRect(0,0,256,256); x.strokeStyle='#8a8a86'; x.lineWidth=2; for(let i=-256;i<512;i+=16){ x.beginPath(); x.moveTo(i,0); x.lineTo(i+256,256); x.stroke(); x.beginPath(); x.moveTo(i,256); x.lineTo(i+256,0); x.stroke(); } });
   const fm=new T.Mesh(wallZ(ZB-0.3,1.0,4.0,0,2.6,-1),new T.MeshStandardMaterial({map:gt,alphaTest:0.4,transparent:false,side:T.DoubleSide,metalness:0.6,roughness:0.5})); fm.material.map.wrapS=fm.material.map.wrapT=T.RepeatWrapping; fm.material.map.repeat.set(4,3.5); G.add(fm);
   add('dark',wallZ(ZB-0.02,1.0,4.0,0,3.0,-1)); add('trim',box(3.2,0.3,0.6,2.5,3.0,ZB-0.25));
   const st=new T.Sprite(new T.SpriteMaterial({map:halo,color:0x6a7aa0,transparent:true,opacity:0.35,depthWrite:false,blending:T.AdditiveBlending})); st.position.set(2.5,1.6,ZB+0.5); st.scale.set(3.5,2.5,1); G.add(st); }
 // Glühbirne über Seitentür links (nur Emission + Halo)
 { add('dark',wallX(-XW+0.02,0.4,1.4,0,2.1,1)); add('trim',box(0.1,0.1,1.2,-XW+0.05,2.15,0.9)); const b=new T.Mesh(new T.SphereGeometry(0.04,8,6),new T.MeshBasicMaterial({color:0xfff0c0,toneMapped:false})); b.position.set(-XW+0.25,2.45,0.9); G.add(b); const h=new T.Sprite(new T.SpriteMaterial({map:halo,color:0xffd090,transparent:true,opacity:0.4,blending:T.AdditiveBlending,depthWrite:false})); h.position.copy(b.position); h.scale.set(0.9,0.9,1); G.add(h); }
 // Spiegelstreifen der Laterne + Fenster auf dem nassen Asphalt (additiv)
 { const stT=TL.load('../assets/tex/s41/streak.png'); const q=[]; const col=[];
   [[0.95,-4.95,1.1,6.5,[0.26,0.17,0.08]],[-2.07,-5.0,0.5,4.0,[0.08,0.05,0.025]],[2.3,-5.0,0.5,4.0,[0.08,0.05,0.025]],[-6.1,0.9,0.4,3,[0.1,0.07,0.04]]].forEach(([x,z0,w,l,c],i)=>{ const g=new T.PlaneGeometry(w,l); g.rotateX(-Math.PI/2); if(i===3){ g.rotateY(Math.PI/2); g.translate(x+l/2,0.012,z0); } else g.translate(x,0.012,z0+l/2); const n=g.attributes.position.count; const cc=new Float32Array(n*3); for(let k=0;k<n;k++) cc.set(c,k*3); g.setAttribute('color',new T.BufferAttribute(cc,3)); q.push(g.toNonIndexed()); });
   G.add(new T.Mesh(merge(q),new T.MeshBasicMaterial({map:stT,alphaMap:stT,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false}))); }
 // Dunstschichten
 [[0,1.2,-3.5,9,0.06,0x6a5040],[0,2.5,1,12,0.04,0x3a3040],[0.95,3.0,-4.3,3.5,0.08,0xffa060]].forEach(([x,y,z,s,o,c])=>{ const h=new T.Sprite(new T.SpriteMaterial({map:halo,color:c,transparent:true,opacity:o,depthWrite:false,blending:T.AdditiveBlending})); h.position.set(x,y,z); h.scale.set(s,s*0.5,1); G.add(h); });
 const MAT={ asph:new T.MeshStandardMaterial({map:ld('asph_c.jpg',1),normalMap:ld('asph_n.jpg'),roughnessMap:ld('asph_r.jpg'),roughness:1,metalness:0.15}),
  brick:new T.MeshStandardMaterial({map:ld('brick_c.jpg',1),normalMap:ld('brick_n.jpg'),roughness:0.9}), pl:new T.MeshStandardMaterial({map:ld('pl_c.jpg',1),normalMap:ld('pl_n.jpg'),roughness:0.95}),
  trim:new T.MeshStandardMaterial({color:0x2a2622,roughness:0.85}), dark:new T.MeshBasicMaterial({color:0x020202}) };
 // nasse Spiegelung: Env aus Laterne + Fenstern
 const env=(()=>{ const t=cv(512,256,(x,w,h)=>{ x.fillStyle='#050404'; x.fillRect(0,0,w,h); x.fillStyle='#ffc070'; x.fillRect(250,60,18,14); x.fillStyle='#c08040'; x.fillRect(200,90,10,12); x.fillRect(300,90,10,12); const g=x.createLinearGradient(0,128,0,256); g.addColorStop(0,'#1a1410'); g.addColorStop(1,'#040303'); x.fillStyle=g; x.fillRect(0,128,w,128); }); t.mapping=T.EquirectangularReflectionMapping; const pm=new T.PMREMGenerator(sc.renderer); const e=pm.fromEquirectangular(t).texture; pm.dispose(); return e; })();
 MAT.asph.envMap=env; MAT.asph.envMapIntensity=1.0; G.children.forEach(m=>{ if(m.material&&m.material.metalness===0.7) m.material.envMap=env; });
 G.add(flat(pipes,new T.MeshStandardMaterial({color:0x3a3430,roughness:0.6,metalness:0.5})));
 Object.entries(bins).forEach(([k,gs])=>{ const m=new T.Mesh(merge(gs),MAT[k]); m.matrixAutoUpdate=false; G.add(m); });
 let fl=1; const update=(t)=>{ if(Math.random()<0.006) fl=0.55; else fl=Math.min(1,fl+0.04); hs.material.opacity=0.6*fl; bulb.material.color.setRGB(fl,0.85*fl,0.63*fl); };
 return {update,env};
};
})();
