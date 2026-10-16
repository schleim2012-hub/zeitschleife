/* Versteckter Raum in den Backrooms: Küche im Maniac-Mansion-Stil hinter einer angelehnten Tür im linken Seitengang.
   Echte Geometrie (Boden y=0), CC0-PBR (ambientCG Concrete034/Wood049, PaintedPlaster017), nach Material zusammengeführt (wenige Draw Calls).
   Licht: Mondlicht durchs Fenster (1 SpotLight) + die zwei Flacker-Lichter der Backrooms werden drinnen umgesetzt (Glühbirne / Mikrowelle).
   window.buildMMKitchen(sc,{G,ROOT,L1,L2,hemi,hemiBase}) → {walls,rects,tick(now,st,K)} ; Zustand: window.__mmk */
(function(){
window.buildMMKitchen=function(sc,o){
 const T=THREE, ROOT=o.ROOT||'', TL=new T.TextureLoader(), S=sc.object3D, R=sc.renderer;
 const K=new T.Group(); K.name='mmKitchen'; o.G.add(K);
 const X0=-11.5, X1=-7.0, Z0=-0.92, Z1=2.5, KH=2.6, DX=-10.0, DH=2.05;
 const WIN={x0:-10.3,x1:-9.2,y0:1.25,y1:2.2};
 const ST=window.__mmk={noteRead:false,mwBusy:false,inside:0,doorOpen:false,held:false};
 const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 // ---------- Zusammenführen nach Material ----------
 const _m=new T.Matrix4(), _q=new T.Quaternion(), _e=new T.Euler(), _v=new T.Vector3(), _s=new T.Vector3(1,1,1);
 const put=(D,k,g,x,y,z,col,rot,opt)=>{ opt=opt||{}; if(g.index) g=g.toNonIndexed(); _e.set(rot?rot[0]:0,rot?rot[1]:0,rot?rot[2]:0); _q.setFromEuler(_e); _m.compose(_v.set(x,y,z),_q,_s); g.applyMatrix4(_m);
  const p=g.attributes.position, n=g.attributes.normal, N=p.count, c=new Float32Array(N*3), cc=new T.Color(col);
  if(!g.attributes.uv) g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(N*2),2)); const uv=g.attributes.uv;
  for(let i=0;i<N;i++){ const px=p.getX(i),py=p.getY(i),pz=p.getZ(i), nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i); const f=opt.ao?opt.ao(px,py,pz,nx,ny,nz):1; c[i*3]=cc.r*f; c[i*3+1]=cc.g*f; c[i*3+2]=cc.b*f;
   if(opt.wuv){ const s=opt.wuv, ax=Math.abs(nx), ay=Math.abs(ny), az=Math.abs(nz); if(ay>=ax&&ay>=az) uv.setXY(i,px/s,pz/s); else if(ax>=az) uv.setXY(i,pz/s,py/s); else uv.setXY(i,px/s,py/s); } }
  g.setAttribute('color',new T.BufferAttribute(c,3)); (D[k]=D[k]||[]).push(g); return g; };
 const merge=list=>{ let N=0; list.forEach(g=>N+=g.attributes.position.count); const P=new Float32Array(N*3),Nn=new Float32Array(N*3),U=new Float32Array(N*2),C=new Float32Array(N*3); let off=0;
  list.forEach(g=>{ const n=g.attributes.position.count; P.set(g.attributes.position.array,off*3); Nn.set(g.attributes.normal.array,off*3); U.set(g.attributes.uv.array,off*2); C.set(g.attributes.color.array,off*3); off+=n; g.dispose(); });
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(P,3)); g.setAttribute('normal',new T.BufferAttribute(Nn,3)); g.setAttribute('uv',new T.BufferAttribute(U,2)); g.setAttribute('color',new T.BufferAttribute(C,3)); g.computeBoundingSphere(); return g; };
 const box=(D,k,x0,x1,y0,y1,z0,z1,col,opt)=>put(D,k,new T.BoxGeometry(x1-x0,y1-y0,z1-z0),(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,col,null,opt);
 const cyl=(D,k,r,h,x,y,z,col,rot,seg)=>put(D,k,new T.CylinderGeometry(r,r,h,seg||12),x,y,z,col,rot);
 const D={};
 // ---------- Ambient Occlusion (in Vertexfarben) ----------
 const aoRoom=(x,y,z,nx,ny,nz)=>{ const dx=Math.min(x-X0,X1-x), dz=Math.min(z-Z0,Z1-z);
  if(ny>0.5){ let d=Math.min(dx,dz); if(x>-10.68&&z>1.2) d=Math.min(d,Math.max(0,1.86-z)); if(x<=-10.68&&z>1.1) d=Math.min(d,Math.max(0,1.72-z)); return 0.42+0.58*cl(d/0.55,0,1); }
  if(ny<-0.5) return 0.55+0.45*cl(Math.min(dx,dz)/0.45,0,1);
  const dc=Math.max(dx,dz); let f=(0.5+0.5*cl(y/0.45,0,1))*(0.7+0.3*cl((KH-y)/0.35,0,1))*(0.62+0.38*cl(dc/0.4,0,1));
  if(z>Z1-0.02&&y>0.92&&y<1.45) f*=0.82+0.18*cl((y-0.92)/0.3,0,1); return f; }; // Spritzwand über der Arbeitsplatte
 const aoLow=(x,y)=>0.55+0.45*cl(y/0.22,0,1);
 // ---------- Raumhülle: Boden, Decke, vier Wände (Fenster- und Türöffnung) ----------
 const BLUE=0x4467b0, CEIL=0xa8a292, TRIM=0xd2cec2, DFR=0x6a5a3c;
 put(D,'fl',new T.PlaneGeometry(X1-X0,Z1-Z0,18,14),(X0+X1)/2,0,(Z0+Z1)/2,0x8e877a,[-Math.PI/2,0,0],{ao:aoRoom,wuv:1.7});
 put(D,'pl',new T.PlaneGeometry(X1-X0,Z1-Z0,10,8),(X0+X1)/2,KH,(Z0+Z1)/2,CEIL,[Math.PI/2,0,0],{ao:aoRoom,wuv:1.2});
 const wr=(face,a0,a1,y0,y1)=>{ const w=a1-a0, h=y1-y0, sw=Math.max(1,Math.ceil(w/0.4)), sh=Math.max(1,Math.ceil(h/0.35)), g=new T.PlaneGeometry(w,h,sw,sh), a=(a0+a1)/2, y=(y0+y1)/2; const op={ao:aoRoom,wuv:1.2};
  if(face==='N') put(D,'pl',g,a,y,Z1,BLUE,[0,Math.PI,0],op); else if(face==='S') put(D,'pl',g,a,y,Z0,BLUE,null,op); else if(face==='W') put(D,'pl',g,X0,y,a,BLUE,[0,Math.PI/2,0],op); else put(D,'pl',g,X1,y,a,BLUE,[0,-Math.PI/2,0],op); };
 wr('N',X0,WIN.x0,0,KH); wr('N',WIN.x1,X1,0,KH); wr('N',WIN.x0,WIN.x1,0,WIN.y0); wr('N',WIN.x0,WIN.x1,WIN.y1,KH);
 wr('S',X0,DX-0.45,0,KH); wr('S',DX+0.45,X1,0,KH); wr('S',DX-0.45,DX+0.45,DH,KH);
 wr('W',Z0,Z1,0,KH); wr('E',Z0,Z1,0,KH);
 // Fensterlaibung, Rahmen, Sprossen, Fensterbank
 box(D,'pl',WIN.x0-0.001,WIN.x0+0.001,WIN.y0,WIN.y1,Z1,Z1+0.14,BLUE); box(D,'pl',WIN.x1-0.001,WIN.x1+0.001,WIN.y0,WIN.y1,Z1,Z1+0.14,BLUE); box(D,'pl',WIN.x0,WIN.x1,WIN.y1-0.001,WIN.y1+0.001,Z1,Z1+0.14,BLUE);
 const WZ=Z1+0.1; box(D,'pl',WIN.x0,WIN.x1,WIN.y0,WIN.y0+0.05,WZ-0.03,WZ+0.02,TRIM); box(D,'pl',WIN.x0,WIN.x1,WIN.y1-0.05,WIN.y1,WZ-0.03,WZ+0.02,TRIM); box(D,'pl',WIN.x0,WIN.x0+0.05,WIN.y0,WIN.y1,WZ-0.03,WZ+0.02,TRIM); box(D,'pl',WIN.x1-0.05,WIN.x1,WIN.y0,WIN.y1,WZ-0.03,WZ+0.02,TRIM);
 [1/3,2/3].forEach(f=>{ const x=WIN.x0+(WIN.x1-WIN.x0)*f; box(D,'pl',x-0.012,x+0.012,WIN.y0,WIN.y1,WZ-0.02,WZ+0.01,TRIM); }); { const y=(WIN.y0+WIN.y1)/2+0.05; box(D,'pl',WIN.x0,WIN.x1,y-0.012,y+0.012,WZ-0.02,WZ+0.01,TRIM); }
 box(D,'pl',WIN.x0-0.06,WIN.x1+0.06,WIN.y0-0.03,WIN.y0,Z1-0.05,Z1+0.12,TRIM); // Fensterbank
 box(D,'pl',WIN.x0-0.07,WIN.x0,WIN.y0,WIN.y1+0.07,Z1-0.015,Z1,TRIM); box(D,'pl',WIN.x1,WIN.x1+0.07,WIN.y0,WIN.y1+0.07,Z1-0.015,Z1,TRIM); box(D,'pl',WIN.x0-0.07,WIN.x1+0.07,WIN.y1,WIN.y1+0.07,Z1-0.015,Z1,TRIM);
 // Türzarge (beide Seiten der Wand, schlichtes, abgestoßenes Holz)
 const DZ0=-1.08, DZ1=Z0+0.01; box(D,'fr',DX-0.45,DX-0.4,0,DH,DZ0,DZ1,DFR,{wuv:0.9}); box(D,'fr',DX+0.4,DX+0.45,0,DH,DZ0,DZ1,DFR,{wuv:0.9}); box(D,'fr',DX-0.45,DX+0.45,DH-0.05,DH,DZ0,DZ1,DFR,{wuv:0.9});
 [[-1.085,-1.07],[Z0,Z0+0.015]].forEach(([a,b])=>{ box(D,'fr',DX-0.51,DX-0.45,0,DH+0.06,a,b,DFR,{wuv:0.9}); box(D,'fr',DX+0.45,DX+0.51,0,DH+0.06,a,b,DFR,{wuv:0.9}); box(D,'fr',DX-0.51,DX+0.51,DH,DH+0.06,a,b,DFR,{wuv:0.9}); });
 // ---------- Unterschränke (Holz, Rahmen-Füllungs-Türen, Knöpfe) ----------
 const WOOD=0xa0603a, WOODD=0x7a4528, TOP=0x6e3c22, ZF=1.9;
 const knob=(x,y,z)=>{ cyl(D,'mt',0.006,0.02,x,y,z-0.01,0x9a9a90,[Math.PI/2,0,0],8); put(D,'mt',new T.SphereGeometry(0.014,10,6),x,y,z-0.024,0x9a9a90); };
 const panel=(x0,x1,y0,y1,zf,k)=>{ box(D,'wd',x0,x1,y0,y1,zf-0.02,zf,WOOD,{wuv:0.9}); const b=0.05; // Türblatt + 4 aufgesetzte Rahmenleisten
  box(D,'wd',x0,x1,y1-b,y1,zf-0.028,zf-0.02,WOOD,{wuv:0.9}); box(D,'wd',x0,x1,y0,y0+b,zf-0.028,zf-0.02,WOOD,{wuv:0.9}); box(D,'wd',x0,x0+b,y0+b,y1-b,zf-0.028,zf-0.02,WOOD,{wuv:0.9}); box(D,'wd',x1-b,x1,y0+b,y1-b,zf-0.028,zf-0.02,WOOD,{wuv:0.9});
  if(k) knob(k[0],k[1],zf-0.028); };
 const baseCab=(x0,x1,doors,carcTop)=>{ box(D,'wd',x0,x1,0.1,carcTop||0.88,ZF,Z1,WOODD,{wuv:0.9,ao:aoLow}); box(D,'dk',x0,x1,0,0.1,ZF+0.06,Z1,0x141210); // Sockel
  const g=0.004, w=(x1-x0)/doors; for(let i=0;i<doors;i++){ const a=x0+i*w+g, b=x0+(i+1)*w-g; box(D,'wd',a,b,0.71,0.86,ZF-0.02,ZF,WOOD,{wuv:0.9}); knob((a+b)/2,0.785,ZF-0.02); panel(a,b,0.11,0.69,ZF,[doors>1&&i===0?b-0.05:a+0.05,0.62]); } };
 baseCab(-7.6,-7.0,1); baseCab(-8.855,-8.36,1); baseCab(-9.35,-8.855,1); baseCab(-10.15,-9.35,2,0.70); baseCab(-10.65,-10.15,1);
 // Arbeitsplatte mit Ausschnitt für die Spüle
 const SK={x0:-10.1,x1:-9.4,z0:2.0,z1:2.32}, CT=[0.88,0.92];
 box(D,'wd',-7.6,-7.0,CT[0],CT[1],1.875,Z1,TOP,{wuv:0.9}); box(D,'wd',-9.4,-8.36,CT[0],CT[1],1.875,Z1,TOP,{wuv:0.9}); box(D,'wd',-10.67,-10.1,CT[0],CT[1],1.875,Z1,TOP,{wuv:0.9});
 box(D,'wd',SK.x0,SK.x1,CT[0],CT[1],1.875,SK.z0,TOP,{wuv:0.9}); box(D,'wd',SK.x0,SK.x1,CT[0],CT[1],SK.z1,Z1,TOP,{wuv:0.9});
 // Spüle (weißes Email, abgesenktes Becken), Armatur
 const SW=0xe2ded4, ri=0.04; box(D,'en',SK.x0-0.02,SK.x1+0.02,CT[1],CT[1]+0.012,SK.z0-0.02,SK.z0+ri,SW); box(D,'en',SK.x0-0.02,SK.x1+0.02,CT[1],CT[1]+0.012,SK.z1-ri,SK.z1+0.02,SW);
 box(D,'en',SK.x0-0.02,SK.x0+ri,CT[1],CT[1]+0.012,SK.z0+ri,SK.z1-ri,SW); box(D,'en',SK.x1-ri,SK.x1+0.02,CT[1],CT[1]+0.012,SK.z0+ri,SK.z1-ri,SW);
 const bi={x0:SK.x0+ri,x1:SK.x1-ri,z0:SK.z0+ri,z1:SK.z1-ri,y0:0.72}; box(D,'en',bi.x0,bi.x1,bi.y0-0.01,bi.y0,bi.z0,bi.z1,0xb8b4aa); box(D,'en',bi.x0,bi.x1,bi.y0,CT[1],bi.z0-0.01,bi.z0,SW); box(D,'en',bi.x0,bi.x1,bi.y0,CT[1],bi.z1,bi.z1+0.01,SW); box(D,'en',bi.x0-0.01,bi.x0,bi.y0,CT[1],bi.z0,bi.z1,SW); box(D,'en',bi.x1,bi.x1+0.01,bi.y0,CT[1],bi.z0,bi.z1,SW);
 cyl(D,'dk',0.025,0.004,(bi.x0+bi.x1)/2,bi.y0+0.002,(bi.z0+bi.z1)/2,0x222220,null,14);
 { const fx=(SK.x0+SK.x1)/2, fz=2.38, MT=0xb8b8b0; cyl(D,'mt',0.03,0.02,fx,CT[1]+0.022,fz,MT); cyl(D,'mt',0.013,0.24,fx,CT[1]+0.14,fz,MT);
  put(D,'mt',new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(0,0.06,-0.03),new T.Vector3(0,0.04,-0.13),new T.Vector3(0,-0.04,-0.17)]),12,0.011,8),fx,CT[1]+0.26,fz,MT);
  [-0.11,0.11].forEach(d=>{ cyl(D,'mt',0.018,0.03,fx+d,CT[1]+0.03,fz,MT); cyl(D,'mt',0.007,0.07,fx+d,CT[1]+0.07,fz,MT,[0,0,Math.PI/2]); }); }
 // ---------- Herd (petrol), Kochfeld, Backofenfenster, Griff, Knöpfe ----------
 { const x0=-8.36, x1=-7.6, TE=0x1d8f92; box(D,'en',x0,x1,0.02,0.9,1.86,Z1-0.02,TE); box(D,'dk',x0+0.01,x1-0.01,0,0.02,1.9,Z1-0.04,0x101010);
  box(D,'en',x0+0.01,x1-0.01,0.21,0.78,1.835,1.86,TE); box(D,'dk',x0+0.1,x1-0.1,0.33,0.62,1.832,1.836,0x070708); box(D,'dk',x0+0.01,x1-0.01,0.18,0.205,1.84,1.86,0x0e1414); box(D,'en',x0+0.01,x1-0.01,0.035,0.17,1.84,1.86,TE);
  cyl(D,'mt',0.011,x1-x0-0.12,(x0+x1)/2,0.735,1.795,0xc0c0b8,[0,0,Math.PI/2]); [x0+0.07,x1-0.07].forEach(x=>cyl(D,'mt',0.008,0.04,x,0.735,1.815,0xc0c0b8,[Math.PI/2,0,0]));
  box(D,'en',x0+0.01,x1-0.01,0.79,0.9,1.84,1.86,TE); [-0.29,-0.21,0.21,0.29].forEach(d=>cyl(D,'mt',0.017,0.02,(x0+x1)/2+d,0.845,1.83,0xb0b0a8,[Math.PI/2,0,0],14)); box(D,'dk',(x0+x1)/2-0.09,(x0+x1)/2+0.09,0.825,0.865,1.837,1.84,0x050606);
  box(D,'dk',x0,x1,0.9,0.92,1.86,Z1-0.02,0x0a0a0a); [0,1].forEach(i=>{ const cx=x0+0.19+i*0.38; for(let j=0;j<3;j++){ box(D,'dk',cx-0.17,cx+0.17,0.925,0.94,1.92+j*0.13+0.06,1.92+j*0.13+0.075,0x1a1a1a); box(D,'dk',cx-0.17+j*0.15,cx-0.155+j*0.15,0.925,0.94,1.92,2.43,0x1a1a1a); } cyl(D,'dk',0.04,0.012,cx,0.926,2.04,0x2a2622,null,14); cyl(D,'dk',0.035,0.012,cx,0.926,2.3,0x2a2622,null,14); }); }
 // ---------- Oberschränke + eingebaute Mikrowelle ----------
 const UZ=2.15; const upCab=(x0,x1,y0,y1,doors)=>{ box(D,'wd',x0,x1,y0,y1,UZ,Z1,WOODD,{wuv:0.9}); const g=0.004, w=(x1-x0)/doors; for(let i=0;i<doors;i++){ const a=x0+i*w+g, b=x0+(i+1)*w-g; panel(a,b,y0+0.01,y1-0.01,UZ,[doors>1&&i===0?b-0.05:a+0.05,y0+0.07]); } };
 upCab(-7.6,-7.0,1.45,2.35,1); upCab(-8.4,-7.6,1.95,2.35,2);
 box(D,'wd',-8.4,-7.6,1.45,1.95,UZ,Z1,WOODD,{wuv:0.9}); box(D,'wd',-8.4,-7.0,2.35,2.42,UZ-0.02,Z1,WOODD,{wuv:0.9}); // Gehäuse + Kranzleiste
 const MW={x0:-8.36,x1:-7.64,y0:1.49,y1:1.91,z:UZ-0.02}; box(D,'dk',MW.x0,MW.x1,MW.y0,MW.y1,MW.z,UZ+0.01,0x0d0d0e); box(D,'wd',-8.4,-7.6,1.45,1.49,UZ-0.022,UZ,WOODD,{wuv:0.9});
 cyl(D,'mt',0.008,0.3,-7.835,1.7,MW.z-0.025,0xc8c8c0); [-0.12,0.12].forEach(d=>cyl(D,'mt',0.006,0.025,-7.835,1.7+d,MW.z-0.012,0xc8c8c0,[Math.PI/2,0,0]));
 // ---------- Kühlschrank (alt, schmutzig weiß) + Topf ----------
 const FR={x0:-11.45,x1:-10.7,zf:1.78}; const FW=0xcfc8b6;
 box(D,'en',FR.x0,FR.x1,0.04,1.75,FR.zf,2.48,FW); box(D,'dk',FR.x0+0.02,FR.x1-0.02,0,0.06,FR.zf+0.02,2.4,0x161512); box(D,'dk',FR.x0+0.04,FR.x1-0.04,0.065,0.13,FR.zf-0.005,FR.zf,0x1a1916);
 box(D,'en',FR.x0+0.005,FR.x1-0.005,0.14,1.19,FR.zf-0.04,FR.zf,FW); box(D,'en',FR.x0+0.005,FR.x1-0.005,1.21,1.745,FR.zf-0.04,FR.zf,FW); box(D,'dk',FR.x0+0.01,FR.x1-0.01,1.19,1.21,FR.zf-0.03,FR.zf,0x2a2824);
 [[0.62,0.95],[1.3,1.6]].forEach(([a,b])=>{ cyl(D,'mt',0.011,b-a,FR.x1-0.06,(a+b)/2,FR.zf-0.085,0xb8b6ae); [a+0.02,b-0.02].forEach(y=>cyl(D,'mt',0.008,0.05,FR.x1-0.06,y,FR.zf-0.06,0xb8b6ae,[Math.PI/2,0,0])); });
 { const px=-11.05, pz=2.12, py=1.75, MT=0x9c9c96; put(D,'mt',new T.CylinderGeometry(0.155,0.15,0.17,22,1,true),px,py+0.085,pz,MT); cyl(D,'dk',0.15,0.005,px,py+0.003,pz,0x1c1c1a,null,22); put(D,'mt',new T.CylinderGeometry(0.162,0.162,0.012,22),px,py+0.172,pz,MT); put(D,'mt',new T.SphereGeometry(0.16,22,6,0,Math.PI*2,0,0.35),px,py+0.03,pz,MT); cyl(D,'dk',0.02,0.03,px,py+0.235,pz,0x151515,null,10);
  [-1,1].forEach(s=>put(D,'mt',new T.TorusGeometry(0.03,0.007,6,12,Math.PI),px+s*0.165,py+0.14,pz,MT,[0,s>0?-Math.PI/2:Math.PI/2,0])); }
 // ---------- Messerleiste + Messer ----------
 const RK={x0:-9.1,x1:-8.46,y:1.52,z:Z1}; box(D,'dk',RK.x0,RK.x1,RK.y-0.022,RK.y+0.022,RK.z-0.022,RK.z,0x121212);
 const bladeG=(len,w)=>{ const s=new T.Shape(); s.moveTo(0,0); s.lineTo(w,0); s.lineTo(w,-len*0.85); s.quadraticCurveTo(w*0.9,-len,0,-len); s.lineTo(0,0); return new T.ExtrudeGeometry(s,{depth:0.002,bevelEnabled:false}); };
 [[-8.53,0.24,0.04],[-8.62,0.2,0.032],[-8.71,0.17,0.028]].forEach(([x,len,w])=>{ put(D,'mt',bladeG(len,w),x-w/2,RK.y+0.005,Z1-0.03,0xd0d0cc); box(D,'dk',x-0.012,x+0.012,RK.y+0.005,RK.y+0.125,Z1-0.042,Z1-0.022,0x0b0b0b); [0.03,0.09].forEach(dy=>cyl(D,'mt',0.003,0.022,x,RK.y+0.005+dy,Z1-0.032,0xb0b0a8,[Math.PI/2,0,0],6)); });
 // ---------- Glühbirne an der Decke (flackert) ----------
 const BULB=new T.Vector3(-9.35,2.3,0.55); cyl(D,'dk',0.004,KH-BULB.y-0.05,BULB.x,(KH+BULB.y+0.05)/2,BULB.z,0x111111,null,5); cyl(D,'dk',0.018,0.05,BULB.x,BULB.y+0.045,BULB.z,0x1a1814,null,10);
 // ---------- Materialien (CC0) ----------
 const tx=(f,srgb)=>{ const t=TL.load(ROOT+f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; return t; };
 const plC=document.createElement('canvas'); plC.width=plC.height=512; const plT=new T.CanvasTexture(plC); plT.wrapS=plT.wrapT=T.RepeatWrapping; plT.colorSpace=T.SRGBColorSpace;
 TL.load(ROOT+'assets/tex/kirmes/Painted/PaintedPlaster017_1K-JPG_Color.jpg',t=>{ const x=plC.getContext('2d'); x.filter='grayscale(1) contrast(0.8) brightness(1.15)'; x.drawImage(t.image,0,0,512,512); x.filter='none';
  for(let i=0;i<40;i++){ const rx=Math.random()*512, ry=Math.random()*512, r=20+Math.random()*90; const s=x.createRadialGradient(rx,ry,0,rx,ry,r); s.addColorStop(0,'rgba(60,50,36,'+(0.06+Math.random()*0.12)+')'); s.addColorStop(1,'rgba(60,50,36,0)'); x.fillStyle=s; x.fillRect(rx-r,ry-r,2*r,2*r); }
  for(let i=0;i<14;i++){ const sx=Math.random()*512, len=60+Math.random()*260; const g=x.createLinearGradient(0,0,0,len); g.addColorStop(0,'rgba(50,42,30,0.14)'); g.addColorStop(1,'rgba(50,42,30,0)'); x.fillStyle=g; x.fillRect(sx,Math.random()*300,2+Math.random()*5,len); }
  for(let i=0;i<900;i++){ x.fillStyle='rgba(30,26,20,'+(Math.random()*0.22)+')'; const r=Math.random()*2.2; x.fillRect(Math.random()*512,Math.random()*512,r,r); } plT.needsUpdate=true; });
 const mPl=new T.MeshStandardMaterial({map:plT,normalMap:tx('assets/tex/kirmes/Painted/PaintedPlaster017_1K-JPG_NormalGL.jpg'),roughnessMap:tx('assets/tex/kirmes/Painted/PaintedPlaster017_1K-JPG_Roughness.jpg'),roughness:0.92,metalness:0,vertexColors:true}); mPl.normalScale.set(0.7,0.7);
 const mFl=new T.MeshStandardMaterial({map:tx('assets/tex/mm/conc_c.jpg',1),normalMap:tx('assets/tex/mm/conc_n.jpg'),roughnessMap:tx('assets/tex/mm/conc_r.jpg'),roughness:0.85,metalness:0,vertexColors:true});
 const mWd=new T.MeshStandardMaterial({map:tx('assets/tex/mm/wood_c.jpg',1),normalMap:tx('assets/tex/mm/wood_n.jpg'),roughnessMap:tx('assets/tex/mm/wood_r.jpg'),roughness:0.7,metalness:0,vertexColors:true}); mWd.normalScale.set(0.8,0.8);
 const enC=document.createElement('canvas'); enC.width=enC.height=256; { const x=enC.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,256,256); const g=x.createLinearGradient(0,0,0,256); g.addColorStop(0,'rgba(150,130,90,0.12)'); g.addColorStop(0.7,'rgba(120,100,70,0.08)'); g.addColorStop(1,'rgba(70,56,38,0.5)'); x.fillStyle=g; x.fillRect(0,0,256,256);
  for(let i=0;i<30;i++){ const rx=Math.random()*256, ry=Math.random()*256, r=6+Math.random()*30; const s=x.createRadialGradient(rx,ry,0,rx,ry,r); s.addColorStop(0,'rgba(90,72,48,'+(0.05+Math.random()*0.12)+')'); s.addColorStop(1,'rgba(90,72,48,0)'); x.fillStyle=s; x.fillRect(rx-r,ry-r,2*r,2*r); }
  for(let i=0;i<10;i++){ const sx=Math.random()*256, l=40+Math.random()*150, sy=Math.random()*120; const g2=x.createLinearGradient(0,sy,0,sy+l); g2.addColorStop(0,'rgba(95,70,40,0.22)'); g2.addColorStop(1,'rgba(95,70,40,0)'); x.fillStyle=g2; x.fillRect(sx,sy,1.5+Math.random()*2.5,l); }
  for(let i=0;i<260;i++){ x.fillStyle='rgba(60,48,34,'+(Math.random()*0.3)+')'; const r=Math.random()*1.8; x.fillRect(Math.random()*256,Math.random()*256,r,r); }
  for(let i=0;i<7;i++){ x.fillStyle='rgba(110,60,30,'+(0.2+Math.random()*0.2)+')'; x.beginPath(); x.arc(Math.random()*256,200+Math.random()*56,1+Math.random()*3,0,7); x.fill(); } }
 const enT=new T.CanvasTexture(enC); enT.colorSpace=T.SRGBColorSpace;
 const mEn=new T.MeshStandardMaterial({map:enT,roughness:0.45,metalness:0.05,vertexColors:true});
 const mMt=new T.MeshStandardMaterial({color:0xffffff,roughness:0.34,metalness:0.6,vertexColors:true});
 const mDk=new T.MeshStandardMaterial({color:0xffffff,roughness:0.35,metalness:0.1,vertexColors:true});
 const mFr=new T.MeshStandardMaterial({map:mWd.map,normalMap:mWd.normalMap,roughness:0.75,metalness:0,vertexColors:true});
 const MATS={fl:mFl,pl:mPl,wd:mWd,en:mEn,mt:mMt,dk:mDk,fr:mFr}; const IN=new T.Group(); K.add(IN); // IN = alles Innere (wird ausgeblendet, solange man draußen ist und die Tür zu ist)
 Object.keys(D).forEach(k=>{ const m=new T.Mesh(merge(D[k]),MATS[k]); m.matrixAutoUpdate=false; m.updateMatrix(); (k==='fr'?K:IN).add(m); });
 // ---------- Fenster: beschlagenes, schmutziges Glas, draußen Nacht ----------
 const gC=document.createElement('canvas'); gC.width=256; gC.height=256; { const x=gC.getContext('2d'); const g=x.createLinearGradient(0,0,0,256); g.addColorStop(0,'#33425e'); g.addColorStop(0.6,'#222c40'); g.addColorStop(1,'#141a26'); x.fillStyle=g; x.fillRect(0,0,256,256);
  x.filter='blur(6px)'; x.fillStyle='rgba(8,10,16,0.75)'; for(let i=0;i<9;i++){ x.beginPath(); x.ellipse(Math.random()*256,120+Math.random()*120,30+Math.random()*50,50+Math.random()*60,0,0,7); x.fill(); } x.fillRect(40,150,10,110); x.fillRect(190,140,12,120);
  const m=x.createRadialGradient(200,40,0,200,40,70); m.addColorStop(0,'rgba(190,205,235,0.55)'); m.addColorStop(1,'rgba(190,205,235,0)'); x.fillStyle=m; x.fillRect(0,0,256,256); x.filter='none';
  const f=x.createLinearGradient(0,0,0,256); f.addColorStop(0,'rgba(150,160,175,0.10)'); f.addColorStop(1,'rgba(150,160,175,0.32)'); x.fillStyle=f; x.fillRect(0,0,256,256);
  for(let i=0;i<40;i++){ const sx=Math.random()*256, sy=Math.random()*200, l=10+Math.random()*60; x.fillStyle='rgba(20,24,34,0.25)'; x.fillRect(sx,sy,1+Math.random(),l); } }
 const gT=new T.CanvasTexture(gC); gT.colorSpace=T.SRGBColorSpace; const mGl=new T.MeshBasicMaterial({map:gT,color:0x6f7686,fog:true});
 const glass=new T.Mesh(new T.PlaneGeometry(WIN.x1-WIN.x0,WIN.y1-WIN.y0),mGl); glass.position.set((WIN.x0+WIN.x1)/2,(WIN.y0+WIN.y1)/2,WZ+0.005); glass.rotation.y=Math.PI; IN.add(glass);
 // Mondlicht-Fleck mit Sprossen-Muster auf Boden und Unterschrank (additiv)
 const mC=document.createElement('canvas'); mC.width=256; mC.height=256; { const x=mC.getContext('2d'); x.filter='blur(5px)'; x.fillStyle='rgba(255,255,255,1)'; const pw=62, ph=86; for(let i=0;i<3;i++) for(let j=0;j<2;j++){ x.save(); x.translate(40+i*(pw+12)+j*14,30+j*(ph+12)); x.transform(1,0,0.16,1,0,0); x.fillRect(0,0,pw,ph); x.restore(); } x.filter='none';
  x.globalCompositeOperation='destination-in'; const g=x.createRadialGradient(128,128,40,128,128,140); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,256,256); }
 const moonM=new T.MeshBasicMaterial({map:new T.CanvasTexture(mC),color:0x5a6c90,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0.42,fog:false,polygonOffset:true,polygonOffsetFactor:-3});
 const moonP=new T.Mesh(new T.PlaneGeometry(1.25,1.15),moonM); moonP.rotation.x=-Math.PI/2; moonP.position.set(-9.62,0.003,1.0); IN.add(moonP);
 // ---------- Flecken: kleine, alte, bräunliche Spritzer + Schmutz/Fett (ein Atlas, ein Draw Call) ----------
 const aC=document.createElement('canvas'); aC.width=aC.height=512; { const x=aC.getContext('2d'); let sd=7; const rn=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
  const splat=(ox,oy,sc)=>{ const cx=ox+128, cy=oy+118; const col=a=>'rgba('+(72+rn()*14|0)+','+(34+rn()*8|0)+','+(22+rn()*6|0)+','+a+')';
   x.fillStyle=col(0.75); x.beginPath(); x.ellipse(cx,cy,14*sc,11*sc,rn()*3,0,7); x.fill(); for(let i=0;i<5;i++){ const a=rn()*6.28, r=(10+rn()*16)*sc; x.beginPath(); x.ellipse(cx+Math.cos(a)*r,cy+Math.sin(a)*r,(4+rn()*7)*sc,(3+rn()*4)*sc,a,0,7); x.fill(); }
   for(let i=0;i<34;i++){ const a=rn()*6.28, r=(24+rn()*80)*sc; x.fillStyle=col(0.4+rn()*0.4); x.beginPath(); x.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r*0.9,(0.8+rn()*3)*sc,0,7); x.fill(); }
   for(let i=0;i<2;i++){ const dx=cx-8+rn()*16, l=(30+rn()*60)*sc; const g=x.createLinearGradient(0,cy,0,cy+l); g.addColorStop(0,col(0.6)); g.addColorStop(1,col(0)); x.fillStyle=g; x.fillRect(dx,cy,2.2*sc,l); }
   x.globalCompositeOperation='destination-out'; for(let i=0;i<60;i++){ x.fillStyle='rgba(0,0,0,'+(rn()*0.4)+')'; x.fillRect(ox+rn()*256,oy+rn()*256,2+rn()*5,2+rn()*5); } x.globalCompositeOperation='source-over'; };
  splat(0,0,1); splat(256,0,0.7);
  const blot=(ox,oy,c,a)=>{ for(let i=0;i<40;i++){ const px=ox+128+(rn()-0.5)*150, py=oy+128+(rn()-0.5)*150, r=12+rn()*40; const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,'rgba('+c+','+(a*rn())+')'); g.addColorStop(1,'rgba('+c+',0)'); x.fillStyle=g; x.fillRect(px-r,py-r,2*r,2*r); } };
  blot(0,256,'30,26,20',0.32); blot(256,256,'40,30,18',0.22); }
 const aT=new T.CanvasTexture(aC); aT.colorSpace=T.SRGBColorSpace;
 const mDec=new T.MeshStandardMaterial({map:aT,transparent:true,depthWrite:false,roughness:0.6,polygonOffset:true,polygonOffsetFactor:-2});
 const DC={}; const dec=(q,w,h,x,y,z,rot)=>{ const g=new T.PlaneGeometry(w,h); const uv=g.attributes.uv, u0=(q%2)*0.5, v0=q<2?0.5:0; for(let i=0;i<uv.count;i++) uv.setXY(i,u0+uv.getX(i)*0.5,v0+uv.getY(i)*0.5); put(DC,'d',g,x,y,z,0xffffff,rot); };
 dec(0,0.3,0.3,-8.86,1.86,Z1-0.004,[0,Math.PI,0]); dec(1,0.22,0.22,-10.56,1.58,Z1-0.004,[0,Math.PI,0]); dec(1,0.16,0.16,-10.45,0.004,1.45,[-Math.PI/2,0,0.7]);
 dec(2,1.2,1.0,-9.1,0.004,0.35,[-Math.PI/2,0,0.4]); dec(2,0.9,0.7,-10.9,0.004,1.2,[-Math.PI/2,0,2]); dec(2,0.9,0.9,-7.6,0.004,-0.3,[-Math.PI/2,0,1]); dec(3,0.66,0.5,-7.98,1.18,Z1-0.004,[0,Math.PI,0]); dec(3,0.6,0.6,-11.1,0.004,0.0,[-Math.PI/2,0,3]);
 const decM=new T.Mesh(merge(DC.d),mDec); decM.renderOrder=1; IN.add(decM);
 // ---------- Mikrowelle: beschlagenes Fenster + Bedienfeld ----------
 const mwWinM=new T.MeshBasicMaterial({color:0x0b0b0b,fog:true}); { const c=document.createElement('canvas'); c.width=128; c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(64,30,4,64,32,70); g.addColorStop(0,'#cfc7b8'); g.addColorStop(1,'#5d564c'); x.fillStyle=g; x.fillRect(0,0,128,64);
  x.fillStyle='rgba(20,18,16,0.55)'; for(let i=0;i<64;i+=4) for(let j=0;j<128;j+=4) if((i+j)%8===0) x.fillRect(j,i,2,2); mwWinM.map=new T.CanvasTexture(c); mwWinM.map.colorSpace=T.SRGBColorSpace; }
 const mwWin=new T.Mesh(new T.PlaneGeometry(0.36,0.27),mwWinM); mwWin.position.set(-8.12,1.7,MW.z-0.002); mwWin.rotation.y=Math.PI; IN.add(mwWin);
 const pC=document.createElement('canvas'); pC.width=64; pC.height=160; const pT=new T.CanvasTexture(pC); pT.colorSpace=T.SRGBColorSpace;
 const drawPanel=txt=>{ const x=pC.getContext('2d'); x.fillStyle='#0c0d0e'; x.fillRect(0,0,64,160); x.fillStyle='#163018'; x.fillRect(6,8,52,22); x.fillStyle='#4cff7a'; x.font='bold 17px monospace'; x.textAlign='center'; x.fillText(txt,32,25);
  x.fillStyle='#3a3c3e'; for(let r=0;r<5;r++) for(let c=0;c<3;c++) x.fillRect(8+c*17,42+r*21,13,14); x.fillStyle='#8a8c8a'; x.font='9px sans-serif'; for(let r=0;r<4;r++) for(let c=0;c<3;c++) x.fillText(String((r*3+c+1)%10),14.5+c*17,52+r*21); pT.needsUpdate=true; };
 drawPanel('12:00'); const mwPan=new T.Mesh(new T.PlaneGeometry(0.15,0.37),new T.MeshBasicMaterial({map:pT,color:0x8a8a8a,fog:true})); mwPan.position.set(-7.73,1.7,MW.z-0.002); mwPan.rotation.y=Math.PI; IN.add(mwPan);
 const mwHit=new T.Mesh(new T.BoxGeometry(0.74,0.44,0.08),new T.MeshBasicMaterial({visible:false})); mwHit.position.set(-8.0,1.7,MW.z); K.add(mwHit);
 // ---------- Glühbirne ----------
 const bulbM=new T.MeshBasicMaterial({color:0x6a5a40,toneMapped:false,fog:false}); const bulb=new T.Mesh(new T.SphereGeometry(0.032,12,8),bulbM); bulb.position.copy(BULB); bulb.scale.y=1.25; IN.add(bulb);
 // ---------- Zettel am Kühlschrank (Handschrift per Canvas, Kalam OFL) + Magnet ----------
 const NOTE_TXT=['Bitte, lass den','Hamster in Ruhe!!'];
 const nC=document.createElement('canvas'); nC.width=512; nC.height=420; const nT=new T.CanvasTexture(nC); nT.colorSpace=T.SRGBColorSpace; nT.anisotropy=4;
 const drawNote=font=>{ const x=nC.getContext('2d'), W=512, H=420; const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,'#efe9d6'); g.addColorStop(1,'#ddd3b6'); x.fillStyle=g; x.fillRect(0,0,W,H);
  for(let i=0;i<10;i++){ const rx=Math.random()*W, ry=Math.random()*H, r=30+Math.random()*90; const s=x.createRadialGradient(rx,ry,0,rx,ry,r); s.addColorStop(0,'rgba(140,110,60,0.10)'); s.addColorStop(1,'rgba(140,110,60,0)'); x.fillStyle=s; x.fillRect(0,0,W,H); }
  x.fillStyle='rgba(90,110,150,0.28)'; for(let y=96;y<H-20;y+=74) x.fillRect(24,y+52,W-48,2); x.fillStyle='rgba(170,60,60,0.25)'; x.fillRect(58,0,2,H);
  x.fillStyle='#1f2a5a'; x.textBaseline='alphabetic'; let fs=parseInt(font.match(/(\d+)px/)[1]); const fam=font.replace(/^.*\d+px\s*/,''); x.font=fs+'px '+fam; while(fs>30&&Math.max(...NOTE_TXT.map(t=>x.measureText(t).width))>W-120){ fs-=2; x.font=fs+'px '+fam; } NOTE_TXT.forEach((t,i)=>{ x.save(); x.translate(76+i*6,150+i*96); x.rotate(-0.025+i*0.012); x.fillText(t,0,0); x.restore(); });
  x.strokeStyle='#1f2a5a'; x.lineWidth=3; x.beginPath(); x.moveTo(90,328); x.quadraticCurveTo(250,318,420,330); x.stroke(); // Unterstrich
  x.globalCompositeOperation='multiply'; x.fillStyle='rgba(180,160,120,0.15)'; x.fillRect(0,H-40,W,40); x.globalCompositeOperation='source-over'; nT.needsUpdate=true; };
 drawNote('64px cursive');
 try{ const ff=new FontFace('MMKalam','url('+ROOT+'fonts/Kalam-Regular.ttf)'); ff.load().then(f=>{ document.fonts.add(f); drawNote('64px MMKalam'); ST.noteFont='Kalam'; }).catch(()=>{}); }catch(e){}
 const NP=new T.Vector3(-10.98,1.47,FR.zf-0.042);
 const note=new T.Mesh(new T.PlaneGeometry(0.18,0.148),new T.MeshStandardMaterial({map:nT,roughness:0.95,side:T.DoubleSide})); note.position.copy(NP); note.rotation.set(0,Math.PI,0.035); IN.add(note);
 const mag=new T.Mesh(new T.CylinderGeometry(0.014,0.014,0.012,16),new T.MeshStandardMaterial({color:0xb01e1a,roughness:0.35})); mag.rotation.x=Math.PI/2; mag.position.set(NP.x+0.004,NP.y+0.06,NP.z-0.007); IN.add(mag);
 const noteHit=new T.Mesh(new T.PlaneGeometry(0.24,0.22),new T.MeshBasicMaterial({visible:false,side:T.DoubleSide})); noteHit.position.copy(NP).z-=0.01; noteHit.rotation.y=Math.PI; K.add(noteHit);
 // ---------- Kettensäge (rot, greifbar, kein Benzin) + Anhänger „TANK LEER“ ----------
 const CS=new T.Group(); const CD={}; const RED=0xa81c16, BLK=0x141414, GRY=0x4a4a4a;
 put(CD,'b',new T.BoxGeometry(0.17,0.25,0.11),0,0,0,RED); put(CD,'b',new T.BoxGeometry(0.12,0.14,0.115),-0.01,-0.04,0,GRY); for(let i=0;i<5;i++) put(CD,'b',new T.BoxGeometry(0.1,0.008,0.118),-0.01,-0.09+i*0.022,0,BLK);
 put(CD,'b',new T.TorusGeometry(0.075,0.012,6,14,Math.PI),0,0.12,0,BLK); put(CD,'b',new T.BoxGeometry(0.05,0.16,0.04),0.105,0.09,0,BLK,[0,0,0.25]); put(CD,'b',new T.BoxGeometry(0.03,0.05,0.12),-0.095,-0.08,0,BLK);
 put(CD,'b',new T.BoxGeometry(0.06,0.014,0.03),-0.11,0.05,0.04,BLK); put(CD,'b',new T.CylinderGeometry(0.004,0.004,0.06,5),-0.095,0.05,0.04,0xb02a20,[0,0,Math.PI/2]);
 put(CD,'b',new T.BoxGeometry(0.078,0.43,0.004),0.025,-0.33,0,0x2a2a2a); put(CD,'b',new T.CylinderGeometry(0.039,0.039,0.004,14),0.025,-0.545,0,0x2a2a2a,[Math.PI/2,0,0]);
 put(CD,'m',new T.BoxGeometry(0.062,0.43,0.008),0.025,-0.33,0,0xa8aaa8); put(CD,'m',new T.CylinderGeometry(0.031,0.031,0.008,14),0.025,-0.545,0,0xa8aaa8,[Math.PI/2,0,0]);
 CS.add(new T.Mesh(merge(CD.b),new T.MeshStandardMaterial({color:0xffffff,roughness:0.5,metalness:0.1,vertexColors:true}))); CS.add(new T.Mesh(merge(CD.m),new T.MeshStandardMaterial({color:0xffffff,roughness:0.38,metalness:0.6,vertexColors:true})));
 { const c=document.createElement('canvas'); c.width=256; c.height=128; const x=c.getContext('2d'); x.fillStyle='#d8cfb4'; x.beginPath(); x.moveTo(30,8); x.lineTo(248,8); x.lineTo(248,120); x.lineTo(30,120); x.lineTo(6,64); x.closePath(); x.fill(); x.fillStyle='#0d0d0d'; x.beginPath(); x.arc(30,64,7,0,7); x.fill();
  const draw=f=>{ x.fillStyle='#d8cfb4'; x.fillRect(46,14,198,100); x.fillStyle='#8a1a12'; x.font=f; x.textAlign='center'; x.textBaseline='middle'; x.fillText('TANK LEER',146,66); tagT.needsUpdate=true; };
  var tagT=new T.CanvasTexture(c); tagT.colorSpace=T.SRGBColorSpace; draw('bold 44px sans-serif'); document.fonts&&document.fonts.ready.then(()=>{ if(document.fonts.check('40px MMKalam')) draw('bold 50px MMKalam'); }); setTimeout(()=>{ try{ if(document.fonts.check('40px MMKalam')) draw('bold 50px MMKalam'); }catch(e){} },3000);
  const tag=new T.Mesh(new T.PlaneGeometry(0.075,0.0375),new T.MeshStandardMaterial({map:tagT,roughness:0.9,side:T.DoubleSide})); const tagG=new T.Group(); tagG.position.set(0.03,0.175,0.072); CS.add(tagG);
  const str=new T.Mesh(new T.CylinderGeometry(0.0012,0.0012,0.06,4),new T.MeshStandardMaterial({color:0x9a9070})); str.position.y=-0.03; tagG.add(str); tag.position.set(0.0,-0.075,0); tag.rotation.set(0,0,0); tagG.add(tag); CS.userData.tag=tagG; }
 const csHit=new T.Mesh(new T.BoxGeometry(0.22,0.7,0.16),new T.MeshBasicMaterial({visible:false})); csHit.position.y=-0.2; CS.add(csHit);
 const CS_HOME={p:new T.Vector3(-8.93,1.71,Z1-0.075),r:new T.Euler(0,Math.PI,0.04)}; CS.position.copy(CS_HOME.p); CS.rotation.copy(CS_HOME.r); IN.add(CS);
 // ---------- Tür: unscheinbar, angelehnt (öffnet nach innen) ----------
 const hinge=new T.Group(); hinge.position.set(DX-0.4,0,-0.985); K.add(hinge);
 const leafM=new T.MeshStandardMaterial({map:tx('assets/tex/br/wall_c.jpg',1),color:0x8c8060,roughness:0.8}); leafM.map.repeat.set(0.7,1.6);
 const leaf=new T.Mesh(new T.BoxGeometry(0.795,DH-0.06,0.035),leafM); leaf.position.set(0.4,(DH-0.06)/2+0.005,0); hinge.add(leaf);
 const kb=new T.Mesh(new T.SphereGeometry(0.026,12,8),new T.MeshStandardMaterial({color:0x6a5a3a,roughness:0.5,metalness:0.7})); kb.position.set(0.72,0.98,-0.045); hinge.add(kb); const kb2=kb.clone(); kb2.position.z=0.045; hinge.add(kb2);
 const AJAR=-0.2; hinge.rotation.y=AJAR; let doorT0=0;
 // ---------- Audio (WebAudio, räumlich an der Quelle) ----------
 const AC=()=>{ try{ return window.__zsaAC||(window.__zsaAC=new (window.AudioContext||window.webkitAudioContext)()); }catch(e){ return null; } };
 const pan=(ac,x,y,z,ref)=>{ const p=ac.createPanner(); p.panningModel='HRTF'; p.distanceModel='inverse'; p.refDistance=ref||1; p.rolloffFactor=1; p.positionX?(p.positionX.value=x,p.positionY.value=y,p.positionZ.value=z):p.setPosition(x,y,z); p.connect(ac.destination); return p; };
 const nBuf=(ac,sec)=>{ const n=Math.floor(ac.sampleRate*sec), b=ac.createBuffer(1,n,ac.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; return b; };
 let mwOut=null; const mwBus=()=>{ const ac=AC(); if(!ac) return null; try{ ac.resume(); }catch(e){} if(!mwOut){ mwOut=ac.createGain(); mwOut.gain.value=1; mwOut.connect(pan(ac,-8.1,1.7,2.2,0.8)); } return ac; };
 const beep=(t,f,d,v)=>{ const ac=AC(); const o=ac.createOscillator(), g=ac.createGain(); o.type='square'; o.frequency.value=f; g.gain.setValueAtTime(v,t); g.gain.setValueAtTime(0.0001,t+d); o.connect(g); g.connect(mwOut); o.start(t); o.stop(t+d+0.02); };
 const hum=(t,dur)=>{ const ac=AC(); const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.16,t+0.12); g.gain.setValueAtTime(0.16,t+dur-0.15); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=520; lp.connect(g); g.connect(mwOut);
  const o1=ac.createOscillator(); o1.type='sawtooth'; o1.frequency.value=60; o1.connect(lp); const o2=ac.createOscillator(); o2.frequency.value=120; const g2=ac.createGain(); g2.gain.value=0.6; o2.connect(g2); g2.connect(lp);
  const o3=ac.createOscillator(); o3.frequency.value=243; const g3=ac.createGain(); g3.gain.value=0.12; const lfo=ac.createOscillator(); lfo.frequency.value=0.9; const lg=ac.createGain(); lg.gain.value=0.08; lfo.connect(lg); lg.connect(g3.gain); o3.connect(g3); g3.connect(g); // Drehteller-Motor
  const nz=ac.createBufferSource(); nz.buffer=nBuf(ac,dur+0.1); const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=700; bp.Q.value=0.6; const ng=ac.createGain(); ng.gain.value=0.05; nz.connect(bp); bp.connect(ng); ng.connect(g);
  [o1,o2,o3,lfo,nz].forEach(s=>{ s.start(t); s.stop(t+dur+0.05); }); };
 const squeak=t=>{ const ac=AC(); [[0,1900,3500,2600,0.16],[0.24,2200,3900,3100,0.13],[0.42,2600,4200,3400,0.09]].forEach(([d,a,b,c,len])=>{ const o=ac.createOscillator(), g=ac.createGain(), v=ac.createOscillator(), vg=ac.createGain(); o.type='sine'; const s=t+d;
  o.frequency.setValueAtTime(a,s); o.frequency.exponentialRampToValueAtTime(b,s+len*0.45); o.frequency.exponentialRampToValueAtTime(c,s+len); v.frequency.value=34; vg.gain.value=160; v.connect(vg); vg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001,s); g.gain.exponentialRampToValueAtTime(0.32,s+0.015); g.gain.exponentialRampToValueAtTime(0.0001,s+len); o.connect(g); g.connect(mwOut); [o,v].forEach(x=>{ x.start(s); x.stop(s+len+0.02); }); }); };
 const popcorn=(t,dur)=>{ const ac=AC(); const nb=nBuf(ac,0.06), lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3800; lp.connect(mwOut); let n=0;
  for(let k=0;k<70;k++){ const u=Math.random(); const tt=t+dur*(0.5+0.5*Math.sin((Math.random()*2-1)*Math.PI/2)*(u<0.5?1:Math.random())); if(tt<t||tt>t+dur) continue; n++;
   const s=ac.createBufferSource(); s.buffer=nb; s.playbackRate.value=0.7+Math.random()*0.8; const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=900+Math.random()*2200; bp.Q.value=1.2; const g=ac.createGain(); const v=0.25+Math.random()*0.6; g.gain.setValueAtTime(v,tt); g.gain.exponentialRampToValueAtTime(0.0001,tt+0.03+Math.random()*0.03); s.connect(bp); bp.connect(g); g.connect(lp); s.start(tt); s.stop(tt+0.08);
   const o=ac.createOscillator(), og=ac.createGain(); o.frequency.setValueAtTime(220+Math.random()*120,tt); o.frequency.exponentialRampToValueAtTime(90,tt+0.04); og.gain.setValueAtTime(v*0.35,tt); og.gain.exponentialRampToValueAtTime(0.0001,tt+0.05); o.connect(og); og.connect(lp); o.start(tt); o.stop(tt+0.06); } return n; };
 const ding=t=>{ const ac=AC(); [[1975,0.22,1.6],[4950,0.05,0.7],[2960,0.04,1.0]].forEach(([f,v,d])=>{ const o=ac.createOscillator(), g=ac.createGain(); o.frequency.value=f; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(g); g.connect(mwOut); o.start(t); o.stop(t+d+0.05); }); };
 const paper=()=>{ const ac=AC(); if(!ac) return; const s=ac.createBufferSource(); s.buffer=nBuf(ac,0.35); const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=3200; bp.Q.value=0.8; const g=ac.createGain(); const t=ac.currentTime; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.12,t+0.05); g.gain.exponentialRampToValueAtTime(0.0001,t+0.33); s.connect(bp); bp.connect(g); g.connect(pan(ac,NP.x,NP.y,NP.z,0.6)); s.start(t); };
 const pullCord=()=>{ const ac=AC(); if(!ac) return; try{ ac.resume(); }catch(e){} const t=ac.currentTime, p=pan(ac,CS.position.x,CS.position.y,CS.position.z,0.8); const s=ac.createBufferSource(); s.buffer=nBuf(ac,0.5); const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.setValueAtTime(900,t); bp.frequency.exponentialRampToValueAtTime(380,t+0.4); bp.Q.value=2.5;
  const am=ac.createGain(); const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.45,t+0.03); g.gain.exponentialRampToValueAtTime(0.0001,t+0.45); const lfo=ac.createOscillator(); lfo.type='square'; lfo.frequency.setValueAtTime(38,t); lfo.frequency.linearRampToValueAtTime(14,t+0.45); const lg=ac.createGain(); lg.gain.value=0.5; am.gain.value=0.5; lfo.connect(lg); lg.connect(am.gain);
  s.connect(bp); bp.connect(am); am.connect(g); g.connect(p); s.start(t); lfo.start(t); lfo.stop(t+0.5);
  [0.55,0.78].forEach((d,i)=>{ const o=ac.createOscillator(), og=ac.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(70,t+d); o.frequency.exponentialRampToValueAtTime(40,t+d+0.12); const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=500; og.gain.setValueAtTime(0.0001,t+d); og.gain.exponentialRampToValueAtTime(i?0.08:0.16,t+d+0.01); og.gain.exponentialRampToValueAtTime(0.0001,t+d+0.14); o.connect(lp); lp.connect(og); og.connect(p); o.start(t+d); o.stop(t+d+0.16); }); }; // springt nicht an – Tank leer
 const farSaw=()=>{ const ac=AC(); if(!ac) return; const t=ac.currentTime+0.2, p=pan(ac,-9.6,1.0,15,3); const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=650; const out=ac.createGain(); out.gain.value=0.55; lp.connect(out); out.connect(p);
  [0,0.9].forEach(d=>{ const s=ac.createBufferSource(); s.buffer=nBuf(ac,0.45); const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=600; bp.Q.value=2; const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t+d); g.gain.exponentialRampToValueAtTime(0.5,t+d+0.03); g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.4); s.connect(bp); bp.connect(g); g.connect(lp); s.start(t+d); });
  const e=t+1.7, o=ac.createOscillator(), o2=ac.createOscillator(), g=ac.createGain(), am=ac.createOscillator(), amg=ac.createGain(); o.type='sawtooth'; o2.type='square';
  o.frequency.setValueAtTime(48,e); o.frequency.linearRampToValueAtTime(52,e+0.8); o.frequency.exponentialRampToValueAtTime(150,e+1.4); o.frequency.setValueAtTime(150,e+2.0); o.frequency.exponentialRampToValueAtTime(60,e+2.6); o.frequency.exponentialRampToValueAtTime(160,e+3.1); o.frequency.exponentialRampToValueAtTime(50,e+3.9);
  o2.frequency.value=0; const ratio=ac.createGain(); ratio.gain.value=2.02; o2.frequency.setValueAtTime(97,e); o2.frequency.exponentialRampToValueAtTime(300,e+1.4); o2.frequency.setValueAtTime(300,e+2.0); o2.frequency.exponentialRampToValueAtTime(120,e+2.6); o2.frequency.exponentialRampToValueAtTime(320,e+3.1); o2.frequency.exponentialRampToValueAtTime(100,e+3.9);
  am.frequency.value=23; amg.gain.value=0.25; am.connect(amg); amg.connect(g.gain); const g2=ac.createGain(); g2.gain.value=0.35; o2.connect(g2); g2.connect(g); o.connect(g);
  g.gain.setValueAtTime(0.0001,e); g.gain.exponentialRampToValueAtTime(0.5,e+0.1); g.gain.setValueAtTime(0.5,e+3.6); g.gain.exponentialRampToValueAtTime(0.0001,e+4.4); g.connect(lp); [o,o2,am].forEach(x=>{ x.start(e); x.stop(e+4.5); }); };
 let fridgeG=null; const fridgeHum=()=>{ const ac=AC(); if(!ac||fridgeG) return; fridgeG=ac.createGain(); fridgeG.gain.value=0; fridgeG.connect(pan(ac,-11.05,0.3,2.1,0.8)); [50,100,150].forEach((f,i)=>{ const o=ac.createOscillator(); o.frequency.value=f+Math.random()*0.4; const g=ac.createGain(); g.gain.value=[0.05,0.03,0.012][i]; o.connect(g); g.connect(fridgeG); o.start(); }); };
 // ---------- Interaktion ----------
 const mwLightPos=new T.Vector3(-8.1,1.62,1.93); let mwL=0, mwOnUntil=0;
 const microwave=()=>{ if(ST.mwBusy) return false; const ac=mwBus(); if(!ac) return false; ST.mwBusy=true; const t=ac.currentTime+0.05; beep(t,1250,0.09,0.06);
  if(!ST.noteRead){ hum(t+0.1,1.5); ST.lastMw='hum'; setTimeout(()=>{ ST.mwBusy=false; },1700); return 'hum'; }
  ST.lastMw='gag'; hum(t+0.1,6.0); squeak(t+0.9); ST.pops=popcorn(t+1.6,4.0); ding(t+6.1); mwOnUntil=1; mwOnT0=performance.now();
  setTimeout(()=>{ mwOnUntil=0; },6150); setTimeout(()=>{ ST.mwBusy=false; },7400); return 'gag'; };
 let mwOnT0=0;
 const readNote=()=>{ if(ST.noteRead) return; ST.noteRead=true; paper(); ST.noteReadAt=performance.now(); try{ sessionStorage.setItem('zs_mm_note','1'); }catch(e){} };
 const openDoor=()=>{ if(ST.doorOpen) return; ST.doorOpen=true; doorT0=performance.now(); try{ window.zsaSND&&zsaSND.creak(); }catch(e){} };
 let held=null; const hp=new T.Vector3(), hq=new T.Quaternion(), offP=new T.Vector3(), offQ=new T.Quaternion(), tmpV=new T.Vector3(), tmpQ=new T.Quaternion();
 const ctrlPose=(c,p,q)=>{ zsaCtrlPos(sc,c,p); if(!c.parent||c.parent===S){ q.copy(c.quaternion); const camEl=sc.camera&&sc.camera.el; const rig=camEl&&camEl.object3D.parent; if(rig&&rig!==S){ rig.getWorldQuaternion(tmpQ); q.premultiply(tmpQ); } } else c.getWorldQuaternion(q); };
 let drop=null; const grab=c=>{ ctrlPose(c,hp,hq); CS.getWorldPosition(tmpV); if(hp.distanceTo(tmpV)>0.38&&hp.distanceTo(tmpV.clone().add(new T.Vector3(0,-0.3,0)))>0.3) return false; held=c; ST.held=true; drop=null; const iq=hq.clone().invert(); offQ.copy(iq).multiply(CS.quaternion); offP.copy(CS.position).sub(hp).applyQuaternion(iq); return true; };
 const release=c=>{ if(held!==c) return; held=null; ST.held=false; drop={v:0,q0:CS.quaternion.clone(),q1:new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,CS.rotation.y+Math.random()*0.6)),t0:performance.now()}; };
 const jiggle={t:0};
 const rayHit=(rc,obj,maxD)=>{ const h=rc.intersectObject(obj,false); return h.length&&h[0].distance<=(maxD||99)?h[0]:null; };
 [0,1].forEach(i=>{ const c=R.xr.getController(i);
  c.addEventListener('selectstart',()=>{ if(!K.parent||!o.G.visible) return; if(held===c){ pullCord(); jiggle.t=performance.now(); return; } const rc=zsaRay(sc,c);
   if(rayHit(rc,leaf,4)) openDoor(); if(rayHit(rc,mwHit,3.5)) microwave(); if(rayHit(rc,noteHit,1.2)) readNote(); if(rayHit(rc,csHit,3)){ pullCord(); jiggle.t=performance.now(); } });
  c.addEventListener('squeezestart',()=>{ if(o.G.visible) grab(c); }); c.addEventListener('squeezeend',()=>release(c)); });
 sc.canvas&&sc.canvas.addEventListener('click',e=>{ if(R.xr.isPresenting||!o.G.visible) return; const rc=zsaMouseRay(sc,e); const cand=[[leaf,openDoor],[mwHit,microwave],[noteHit,readNote],[csHit,()=>{ pullCord(); jiggle.t=performance.now(); }]];
  let best=null; cand.forEach(([m,f])=>{ const h=rc.intersectObject(m,false); if(h.length&&(!best||h[0].distance<best.d)) best={d:h[0].distance,f}; }); if(best) best.f(); });
 // ---------- Licht ----------
 const spot=new T.SpotLight(0xa4b6dc,0,5.2,0.5,0.75,2); spot.position.set(-9.75,2.75,3.25); spot.target.position.set(-9.55,0,0.55); S.add(spot); S.add(spot.target);
 const L1=o.L1, L2=o.L2, hemi=o.hemi; const L1home={p:L1.position.clone(),c:L1.color.clone(),d:L1.distance}, L2home={p:L2.position.clone(),c:L2.color.clone(),d:L2.distance};
 const kMats=[mPl,mFl,mWd,mEn,mMt,mDk,mDec,note.material,mag.material,CS.children[0].material,CS.children[1].material]; kMats.forEach(m=>m.userData.c0=m.color.clone());
 let kinLast=-1, relocated=false, sawDone=false, enteredAt=0, lookAcc=0, lastNow=0; const head=new T.Vector3(), hf=new T.Vector3(), cq=new T.Quaternion(), np=new T.Vector3(), LP=sc.object3D;
 let compiled=false; const tick=(now,st,Kw)=>{ const dt=lastNow?Math.min(0.1,(now-lastNow)/1000):0.016; lastNow=now; if(!o.G.visible) return;
  if(!compiled){ compiled=true; try{ R.compile(S,sc.camera); }catch(e){} } // Shader einmal vorab, kein Ruckler beim Türöffnen
  const cam=R.xr.isPresenting?R.xr.getCamera():sc.camera; if(!cam) return; cam.getWorldPosition(head); cam.getWorldQuaternion(cq); hf.set(0,0,-1).applyQuaternion(cq);
  const kin=(head.x>X0-0.6&&head.x<X1+0.6)?cl((head.z+1.3)/0.6,0,1):0; ST.inside=kin;
  const showIn=kin>0||(ST.doorOpen&&Math.hypot(head.x-DX,head.z+1)<7); if(IN.visible!==showIn) IN.visible=showIn; // Draw Calls sparen
  // Tür: aufschwingen, wenn man davorsteht
  if(!ST.doorOpen&&Math.abs(head.x-DX)<0.7&&head.z>-1.6&&head.z<-0.4) openDoor();
  if(ST.doorOpen){ const k=Math.min(1,(now-doorT0)/1500); hinge.rotation.y=AJAR+(-1.45-AJAR)*k*k*(3-2*k); } else hinge.rotation.y=AJAR+0.01*Math.sin(now*0.0009);
  // Helligkeit: draußen hell (Backrooms-Hemi), drinnen fast dunkel – fließend über die Schwelle
  if(Math.abs(kin-kinLast)>0.002||Kw!==tick.k){ tick.k=Kw; const f=(0.07+0.93*kin)*Kw; kMats.forEach(m=>m.color.copy(m.userData.c0).multiplyScalar(f)); mGl.color.setHex(0x6f7686).multiplyScalar(Kw); kinLast=kin;
   if(window.__brSnd&&__brSnd.out){ try{ __brSnd.out.gain.setTargetAtTime(1-0.65*kin,__brSnd.out.context.currentTime,0.3); }catch(e){} } if(fridgeG) fridgeG.gain.setTargetAtTime(kin,fridgeG.context.currentTime,0.3); }
  hemi.intensity=(o.hemiBase||1.15)*Kw*(1-0.955*kin); spot.intensity=11*Kw*kin; moonM.opacity=0.42*kin*Kw;
  // Flacker- und Mikrowellenlicht: Backrooms-Lichter wandern mit (kein zusätzlicher Shader-Lichtplatz)
  if(kin>0.5&&!relocated){ relocated=true; L1.position.copy(mwLightPos); L1.color.setHex(0xffb35c); L1.distance=3.4; L2.position.copy(BULB).y-=0.06; L2.color.setHex(0xffcf90); L2.distance=3.6; }
  else if(kin<=0.5&&relocated){ relocated=false; L1.position.copy(L1home.p); L1.color.copy(L1home.c); L1.distance=L1home.d; L2.position.copy(L2home.p); L2.color.copy(L2home.c); L2.distance=L2home.d; }
  const fon=st&&st[1]?st[1].on:1; const bI=fon?(0.85+0.15*Math.sin(now*0.05)*Math.sin(now*0.013)):0.05; bulbM.color.setHex(0xffd8a0).multiplyScalar(0.12+0.5*bI*Kw);
  const mwTarget=mwOnUntil?1:0; mwL+=(mwTarget-mwL)*Math.min(1,dt*(mwTarget?14:9)); ST.mwLight=mwL;
  mwWinM.color.setHex(0x0b0b0b).lerp(new T.Color(0xffc070),mwL); if(mwOnUntil){ const s=Math.floor((performance.now()-mwOnT0)/1000); drawPanel(s<6?('0:0'+(6-s)):'0:00'); tick.pan=1; } else if(tick.pan){ tick.pan=0; drawPanel('12:00'); }
  if(relocated){ L2.intensity=0.32*bI*Kw*kin; L1.intensity=2.6*mwL*Kw*(0.94+0.06*Math.sin(now*0.03)); } else if(mwL>0.01){ /* draußen bleibt die Mikrowelle aus Sicht der Backrooms ohne Raumlicht */ }
  // Kettensäge fern (einmal beim Betreten)
  if(kin>0.95&&!sawDone){ if(!enteredAt) enteredAt=now; if(now-enteredAt>2500){ sawDone=true; farSaw(); fridgeHum(); ST.sawPlayed=true; } }
  // Zettel lesen: ~1 s draufschauen oder mit dem Controller zeigen (≤ 1,2 m)
  if(!ST.noteRead){ note.getWorldPosition(np); let looking=false; const d=head.distanceTo(np); if(d<1.2){ tmpV.copy(np).sub(head).normalize(); if(tmpV.dot(hf)>Math.cos(0.26)) looking=true; }
   if(!looking&&R.xr.isPresenting&&d<1.8) for(let i=0;i<2;i++){ const c=R.xr.getController(i); const rc=zsaRay(sc,c); if(rc.ray.origin.distanceTo(np)<1.2&&rc.intersectObject(noteHit,false).length) looking=true; }
   lookAcc=looking?lookAcc+dt:Math.max(0,lookAcc-dt*0.5); if(lookAcc>1.0) readNote(); }
  // Kettensäge halten / fallen lassen / Anhänger pendelt
  if(held){ ctrlPose(held,hp,hq); CS.quaternion.copy(hq).multiply(offQ); CS.position.copy(offP).applyQuaternion(hq).add(hp); }
  else if(drop){ const k=Math.min(1,(now-drop.t0)/450); drop.v+=9.8*dt; CS.position.y=Math.max(0.065,CS.position.y-drop.v*dt); CS.position.x=cl(CS.position.x,X0+0.3,X1-0.3); CS.position.z=cl(CS.position.z,Z0+0.3,1.75); CS.quaternion.slerpQuaternions(drop.q0,drop.q1,k); if(k>=1&&CS.position.y<=0.066) drop=null; }
  if(R.xr.isPresenting&&!held) for(let i=0;i<2;i++){ zsaCtrlPos(sc,R.xr.getController(i),hp); if(hp.distanceTo(mwLightPos.clone().setZ(MW.z))<0.14) microwave(); }
  const jt=(now-jiggle.t)/1000; const tg=CS.userData.tag; tg.rotation.z=Math.sin(now*0.0013)*0.05+(jt<1.2?Math.sin(jt*18)*0.3*(1-jt/1.2):0); if(jt<0.5&&!held&&!drop) CS.rotation.z=CS_HOME.r.z+Math.sin(jt*40)*0.03*(1-jt/0.5);
  if(!window.__brSnd){ const ac=window.__zsaAC; if(ac&&ac.listener.positionX){ const L=ac.listener; L.positionX.value=head.x; L.positionY.value=head.y; L.positionZ.value=head.z; L.forwardX.value=hf.x; L.forwardY.value=hf.y; L.forwardZ.value=hf.z; } } };
 ST.microwave=microwave; ST.readNote=readNote; ST.openDoor=openDoor; ST.pullCord=pullCord; ST.door={x:DX,z:-1};
 return {group:K,tick,walls:[[X0-0.07,Z0,X0-0.07,Z1+0.07],[X0-0.07,Z1+0.07,X1+0.07,Z1+0.07],[X1+0.07,Z1+0.07,X1+0.07,Z0]],rects:[[X0,-10.68,1.72,Z1],[-10.68,X1,1.86,Z1]],door:{x:DX,z:-1}};
};
})();
