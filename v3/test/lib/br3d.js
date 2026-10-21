/* Backrooms 3D – echte Geometrie in echter Größe (Boden y=0, local-floor).
   Schichten: nah = 3D (Wände/Decke/Boden, merged, Licht in Vertexfarben gebacken), mittel = flache Ausschnitte, fern = Foto, Nebel dazwischen.
   Nur praktisches Licht (Röhren), viel Schwarz; Set-Dressing; Off-Screen-Ton.  window.buildBackrooms(sceneEl,{root}) */
(function(){
const H=2.75, WT=0.14;
// begehbare Bereiche (Rechtecke) – nur zum Erzeugen von Decke/Boden/Röhren
const R=[ [-4,4,-4,3], [1,2.6,3,9], [-12,-4,-2.5,-1], [-1,1,-24,-4], [-6,-1.07,-12,-7], [1.07,6,-16,-11] ];
// Wandsegmente (x1,z1,x2,z2) – handgebaut, Öffnungen sind Lücken
const W=[ [-4,3,1,3],[2.6,3,4,3], [4,-4,4,-1.45],[4,-0.35,4,3], [-4,-4,-4,-2.5],[-4,-1,-4,3], [-4,-4,-1,-4],[1,-4,4,-4],
 [1,3,1,9],[2.6,3,2.6,9],[1,9,2.6,9], [-12,-2.5,-4,-2.5],[-12,-1,-10.45,-1],[-9.55,-1,-4,-1],[-12,-2.5,-12,-1],
 [-1,-4,-1,-9],[-1,-10.5,-1,-24],[1,-4,1,-13],[1,-14.2,1,-24],
 [-6,-7,-1,-7],[-6,-12,-1,-12],[-6,-12,-6,-7], [1,-11,6,-11],[1,-16,6,-16],[6,-16,6,-11] ];
const PIL=[[-1.7,-1.6,0.5],[2.4,1.3,0.45],[-3.6,-9.6,0.5],[3.6,-13.6,0.5]]; // Pfeiler x,z,size
const BOUND={x0:-11.7,x1:5.7,z0:-19.6,z1:8.7};
let seed=11; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
window.buildBackrooms=function(sc,o){ o=o||{}; const BK=!!window.ZSBake&&!/[?&]nobake=1/.test(location.search); const HEMI=o.hemi||(BK?0.2:1.15); const T=THREE, S=sc.object3D, ROOT=o.root||'', TL=new T.TextureLoader(); const G=new T.Group(); G.name='br3d'; S.add(G);
 const tex=(f,rep,srgb)=>{ const t=TL.load(ROOT+'assets/tex/br/'+f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; return t; };
 // ---------- Röhren (Troffer 1,2 × 0,6, Decke) ----------
 const tubes=[]; const inR=(x,z,m)=>R.some(r=>x>r[0]+m&&x<r[1]-m&&z>r[2]+m&&z<r[3]-m);
 R.forEach(r=>{ const w=r[1]-r[0], d=r[3]-r[2]; const xs=[], zs=[];
  if(w<2.2) xs.push(Math.round((r[0]+r[1])/2/0.6)*0.6); else for(let x=Math.ceil((r[0]+1)/2.4)*2.4; x<=r[1]-1; x+=2.4) xs.push(x);
  if(d<2.2) zs.push(Math.round(((r[2]+r[3])/2-0.3)/0.6)*0.6+0.3); else for(let z=Math.ceil((r[2]+0.8-0.3)/2.4)*2.4+0.3; z<=r[3]-0.6; z+=2.4) zs.push(z);
  xs.forEach(x=>zs.forEach(z=>{ if(!tubes.some(t=>Math.abs(t.x-x)<0.7&&Math.abs(t.z-z)<0.4)) tubes.push({x,z,I:1,state:'on'}); })); });
 tubes.forEach(t=>{ const r=rnd(); if(Math.hypot(t.x,t.z)>3&&r<0.3) { t.state='dead'; t.I=0; } else if(r<0.5){ t.I=0.5; } });   // tot / schwach
 const near=(x,z)=>tubes.reduce((b,t)=>Math.hypot(t.x-x,t.z-z)<Math.hypot(b.x-x,b.z-z)?t:b);
 const fl1=near(0,-2.6), fl2=near(0,-11.2); [fl1,fl2].forEach(t=>{ t.state='flick'; t.I=0.6; });
 const sp=near(0.,0.3); sp.state='on'; sp.I=1; // über dem Spieler brennt eine
 // ---------- Licht-Backen (Vertexfarben) ----------
 const segHit=(ax,az,bx,bz)=>{ for(const w of W){ const [cx,cz,dx,dz]=w; const d1=(bx-ax)*(cz-az)-(bz-az)*(cx-ax), d2=(bx-ax)*(dz-az)-(bz-az)*(dx-ax), d3=(dx-cx)*(az-cz)-(dz-cz)*(ax-cx), d4=(dx-cx)*(bz-cz)-(dz-cz)*(bx-cx); if(d1*d2<0&&d3*d4<0) return true; }
  for(const p of PIL){ const h=p[2]/2; // Pfeiler als 2 Diagonalen
   const L=[[p[0]-h,p[1]-h,p[0]+h,p[1]+h],[p[0]-h,p[1]+h,p[0]+h,p[1]-h]]; for(const [cx,cz,dx,dz] of L){ const d1=(bx-ax)*(cz-az)-(bz-az)*(cx-ax), d2=(bx-ax)*(dz-az)-(bz-az)*(dx-ax), d3=(dx-cx)*(az-cz)-(dz-cz)*(ax-cx), d4=(dx-cx)*(bz-cz)-(dz-cz)*(bx-cx); if(d1*d2<0&&d3*d4<0) return true; } } return false; };
 const wallDist=(x,z)=>{ let m=9; for(const [ax,az,bx,bz] of W){ const vx=bx-ax, vz=bz-az, l=vx*vx+vz*vz; let u=((x-ax)*vx+(z-az)*vz)/l; u=Math.max(0,Math.min(1,u)); m=Math.min(m,Math.hypot(x-ax-u*vx,z-az-u*vz)); } for(const p of PIL) m=Math.min(m,Math.max(Math.abs(x-p[0]),Math.abs(z-p[1]))-p[2]/2); return m; };
 const bake=(x,y,z,nx,ny,nz)=>{ let E=0; const px=x+nx*0.04, pz=z+nz*0.04;
  for(const t of tubes){ if(!t.I) continue; const dx=t.x-x, dy=H-0.02-y, dz=t.z-z; const d2=dx*dx+dy*dy+dz*dz; if(d2>64) continue; const d=Math.sqrt(d2);
   const cn=(nx*dx+ny*dy+nz*dz)/d; if(cn<=0) continue; const ce=Math.max(0.05,dy/d); if(segHit(px,pz,t.x,t.z)) continue; E+=t.I*cn*(0.35+0.65*ce)/(d2+0.6); }
  return E; };
 const tone=E=>{ const v=Math.min(1.1,Math.pow(E*6,1.3)); return 0.005+v*0.72; };
 const near2=(x,z)=>{ let e=0; for(const t of tubes){ if(!t.I) continue; const d2=(t.x-x)**2+(t.z-z)**2; if(d2<4&&!segHit(x,z,t.x,t.z)) e+=t.I*0.5/(d2*3+0.4); } return e; };
 // ---------- Geometrie-Puffer ----------
 const mk=()=>({p:[],n:[],u:[],c:[],i:[]});
 const quad=(B,P,N,U,Cs)=>{ const b=B.p.length/3; P.forEach((v,k)=>{ B.p.push(...v); B.n.push(...N); B.u.push(...U[k]); B.c.push(...Cs[k]); }); B.i.push(b,b+1,b+2,b,b+2,b+3); };
 const toGeo=B=>{ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(B.p,3)); g.setAttribute('normal',new T.Float32BufferAttribute(B.n,3)); g.setAttribute('uv',new T.Float32BufferAttribute(B.u,2)); g.setAttribute('color',new T.Float32BufferAttribute(B.c,3)); g.setIndex(B.i); g.computeBoundingSphere(); return g; };
 const col=(v,warm)=>[v*(warm?1.0:1), v*0.97, v*0.86];
 // Boden: Raster 0,4 m pro Bereich
 const FB=mk(), CB=mk(), WB=mk(), VB=mk();
 const grid=(B,r,step,y,ny,uvs,aoF)=>{ for(let x=r[0]; x<r[1]-1e-6; x+=step) for(let z=r[2]; z<r[3]-1e-6; z+=step){ const x2=Math.min(r[1],x+step), z2=Math.min(r[3],z+step);
   const P=ny>0?[[x,y,z2],[x2,y,z2],[x2,y,z],[x,y,z]]:[[x,y,z],[x2,y,z],[x2,y,z2],[x,y,z2]];
   quad(B,P,[0,ny,0],P.map(v=>[v[0]/uvs,-v[2]/uvs]),P.map(v=>{ const E=bake(v[0],y,v[2],0,ny,0); const wd=wallDist(v[0],v[2]); const ao=aoF(wd); return col(tone(E)*ao); })); } };
 R.forEach(r=>grid(FB,r,0.4,0,1,1.1,wd=>0.45+0.55*Math.min(1,Math.max(0,wd)/0.45)));
 // Decke: einzelne Platten 0,6 (globales Raster), fehlende/hängende, Troffer ausgespart
 const holes=[], hanging=[]; const isTube=(cx,cz)=>tubes.some(t=>Math.abs(cx-t.x)<0.6&&Math.abs(cz-t.z)<0.3);
 R.forEach(r=>{ for(let gx=Math.floor(r[0]/0.6)*0.6; gx<r[1]; gx+=0.6) for(let gz=Math.floor(r[2]/0.6)*0.6; gz<r[3]; gz+=0.6){ const x=Math.max(r[0],gx), x2=Math.min(r[1],gx+0.6), z=Math.max(r[2],gz), z2=Math.min(r[3],gz+0.6); if(x2-x<0.01||z2-z<0.01) continue;
  const cx=gx+0.3, cz=gz+0.3; if(isTube(cx,cz)) continue; const q=rnd(); const full=(x2-x>0.59&&z2-z>0.59);
  if(full&&q<0.035&&Math.hypot(cx,cz)>2){ holes.push([x,z,x2,z2]); continue; } if(full&&q<0.05&&Math.hypot(cx,cz)>2.5){ hanging.push([x,z,x2,z2]); continue; }
  const y=H-(rnd()<0.08?0.012:0);
  const P=[[x,y,z],[x2,y,z],[x2,y,z2],[x,y,z2]]; quad(CB,P,[0,-1,0],P.map(v=>[v[0]/3.6,-v[2]/3.6]),P.map(v=>{ const E=bake(v[0],0,v[2],0,1,0)*0.22+near2(v[0],v[2]); const wd=wallDist(v[0],v[2]); return col(tone(E)*(0.6+0.4*Math.min(1,wd/0.35))); })); } });
 // Raster-Schienen (T-Profile) zwischen den Platten
 const RB=mk(); R.forEach(r=>{ for(let gx=Math.ceil(r[0]/0.6)*0.6; gx<r[1]; gx+=0.6){ const P=[[gx-0.012,H-0.004,r[2]],[gx+0.012,H-0.004,r[2]],[gx+0.012,H-0.004,r[3]],[gx-0.012,H-0.004,r[3]]]; quad(RB,P,[0,-1,0],P.map(()=>[0,0]),P.map(v=>col(tone(bake(gx,H-0.1,(r[2]+r[3])/2,0,-1,0))*0.8))); }
  for(let gz=Math.ceil(r[2]/0.6)*0.6; gz<r[3]; gz+=0.6){ const P=[[r[0],H-0.004,gz-0.012],[r[1],H-0.004,gz-0.012],[r[1],H-0.004,gz+0.012],[r[0],H-0.004,gz+0.012]]; quad(RB,P,[0,-1,0],P.map(()=>[0,0]),P.map(()=>col(tone(bake((r[0]+r[1])/2,H-0.1,gz,0,-1,0))*0.8))); } });
 // Wände: beide Seiten, unterteilt (Länge 0,5, Höhe in Stufen) für Licht + AO
 const YS=[0,0.1,0.35,0.9,1.6,2.3,2.6,H];
 const wall=(ax,az,bx,bz,ys)=>{ const YS_=ys||YS; const L=Math.hypot(bx-ax,bz-az), tx=(bx-ax)/L, tz=(bz-az)/L; const nx=-tz, nz=tx; const n=Math.max(1,Math.round(L/0.5));
  [1,-1].forEach(sd=>{ const ox=nx*WT/2*sd, oz=nz*WT/2*sd; for(let k=0;k<n;k++){ const s0=k/n*L, s1=(k+1)/n*L; for(let j=0;j<YS_.length-1;j++){ const y0=YS_[j], y1=YS_[j+1];
    const P=[[ax+tx*s0+ox,y0,az+tz*s0+oz],[ax+tx*s1+ox,y0,az+tz*s1+oz],[ax+tx*s1+ox,y1,az+tz*s1+oz],[ax+tx*s0+ox,y1,az+tz*s0+oz]]; if(sd<0) P.reverse();
    const U=P.map(v=>{ const s=(v[0]-ax)*tx+(v[2]-az)*tz; return [s/1.2*sd, v[1]/1.2]; });
    quad(WB,P,[nx*sd,0,nz*sd],U,P.map(v=>{ const E=bake(v[0],v[1],v[2],nx*sd,0,nz*sd); const s=(v[0]-ax)*tx+(v[2]-az)*tz; let ao=1; ao*=0.55+0.45*Math.min(1,v[1]/0.32); ao*=0.75+0.25*Math.min(1,(H-v[1])/0.3);
     // Ecken: nahe anderer Wände dunkler
     const wx=v[0]+nx*sd*0.12, wz=v[2]+nz*sd*0.12; const wd=wallDist(wx,wz); ao*=0.6+0.4*Math.min(1,wd/0.3); return col(tone(E)*ao); })); } } });
  if(ys) return; // Stirnseiten
  [[ax,az,-1],[bx,bz,1]].forEach(([ex,ez,s])=>{ const P=[[ex-nx*WT/2,0,ez-nz*WT/2],[ex+nx*WT/2,0,ez+nz*WT/2],[ex+nx*WT/2,H,ez+nz*WT/2],[ex-nx*WT/2,H,ez-nz*WT/2]]; if(s<0) P.reverse(); const E=bake(ex+tx*s*0.1,1.2,ez+tz*s*0.1,tx*s,0,tz*s); quad(WB,P,[tx*s,0,tz*s],P.map(v=>[(v[0]*nx+v[2]*nz)/1.2,v[1]/1.2]),P.map(v=>col(tone(E)*(0.55+0.45*Math.min(1,v[1]/0.3))))); }); };
 W.forEach(w=>wall(...w));
wall(-10.45,-1,-9.55,-1,[2.05,2.3,2.6,H]); // Sturz über der Küchentür
 PIL.forEach(([x,z,s])=>{ const h=s/2; wall(x-h,z-h,x+h,z-h); wall(x+h,z-h,x+h,z+h); wall(x+h,z+h,x-h,z+h); wall(x-h,z+h,x-h,z-h); });
 // Fußleisten (dunkles, abgestoßenes Holz)
 const BB=mk(); const base=(ax,az,bx,bz)=>{ const L=Math.hypot(bx-ax,bz-az), tx=(bx-ax)/L, tz=(bz-az)/L, nx=-tz, nz=tx; [1,-1].forEach(sd=>{ const o=WT/2+0.012; const P=[[ax+nx*o*sd,0,az+nz*o*sd],[bx+nx*o*sd,0,bz+nz*o*sd],[bx+nx*o*sd,0.09,bz+nz*o*sd],[ax+nx*o*sd,0.09,az+nz*o*sd]]; if(sd<0) P.reverse(); const E=bake((ax+bx)/2+nx*sd*0.2,0.1,(az+bz)/2+nz*sd*0.2,nx*sd,0,nz*sd); quad(BB,P,[nx*sd,0,nz*sd],P.map(v=>[((v[0]-ax)*tx+(v[2]-az)*tz)/2,v[1]*2]),P.map(()=>col(tone(E)*0.7)));
   const P2=[[ax+nx*(WT/2)*sd,0.09,az+nz*(WT/2)*sd],[bx+nx*(WT/2)*sd,0.09,bz+nz*(WT/2)*sd],[bx+nx*o*sd,0.09,bz+nz*o*sd],[ax+nx*o*sd,0.09,az+nz*o*sd]]; if(sd<0) P2.reverse(); quad(BB,P2,[0,1,0],P2.map(()=>[0,0]),P2.map(()=>col(tone(E)*0.8))); }); };
 W.forEach(w=>base(...w)); PIL.forEach(([x,z,s])=>{ const h=s/2; base(x-h,z-h,x+h,z-h); base(x+h,z-h,x+h,z+h); base(x+h,z+h,x-h,z+h); base(x-h,z+h,x-h,z-h); });
 // ---------- Materialien ----------
 const mFloor=new T.MeshStandardMaterial({map:tex('carpet_c.jpg',1,1),normalMap:tex('carpet_n.jpg'),roughnessMap:tex('carpet_r.jpg'),roughness:1,metalness:0,vertexColors:true}); mFloor.normalScale.set(0.9,0.9);
 const mWall=new T.MeshStandardMaterial({map:tex('wall_c.jpg',1,1),normalMap:tex('wall_n.jpg'),roughness:0.82,metalness:0,vertexColors:true}); mWall.normalScale.set(0.6,0.6);
 const mCeil=new T.MeshStandardMaterial({map:tex('ceil_c.jpg',1,1),normalMap:tex('ceil_n.jpg'),roughness:0.95,metalness:0,vertexColors:true});
 const mRail=new T.MeshStandardMaterial({color:0xb8b090,roughness:0.6,metalness:0.3,vertexColors:true});
 const mBase=new T.MeshStandardMaterial({color:0x3a2c1c,roughness:0.7,metalness:0,vertexColors:true});
 const add=(B,m)=>{ const me=new T.Mesh(toGeo(B),m); me.matrixAutoUpdate=false; me.userData.keep=true; G.add(me); return me; };
 add(FB,mFloor).name='br_floor'; add(CB,mCeil).name='br_ceil'; add(WB,mWall).name='br_wall'; add(RB,mRail).name='br_rail'; add(BB,mBase).name='br_base';
 // Löcher in der Decke: schwarzer Schacht + ein paar Kabel / Rohr; hängende Platten
 const voidM=new T.MeshBasicMaterial({color:0x020202}); const cabM=new T.MeshStandardMaterial({color:0x111111,roughness:0.6});
 holes.forEach(([x,z,x2,z2],k)=>{ const b=new T.Mesh(new T.BoxGeometry(x2-x,0.5,z2-z),voidM); b.geometry.groups=[]; b.material.side=T.BackSide; b.position.set((x+x2)/2,H+0.25,(z+z2)/2); G.add(b);
  for(let c=0;c<2;c++){ const sx=x+0.15+rnd()*0.3, sz=z+0.15+rnd()*0.3, drop=0.35+rnd()*0.8; const cv=new T.CatmullRomCurve3([new T.Vector3(sx,H+0.2,sz),new T.Vector3(sx+0.05,H-drop*0.5,sz+0.04),new T.Vector3(sx+0.12*(rnd()-0.5),H-drop,sz+0.1*(rnd()-0.5)),new T.Vector3(sx+0.2*(rnd()-0.5),H-drop*0.85,sz+0.25*(rnd()-0.5))]);
   G.add(new T.Mesh(new T.TubeGeometry(cv,16,0.006+rnd()*0.004,5),cabM)); } });
 hanging.forEach(([x,z,x2,z2])=>{ const g=new T.Group(); g.position.set(x,H-0.01,z); const p=new T.Mesh(new T.BoxGeometry(0.59,0.015,0.59),new T.MeshStandardMaterial({map:mCeil.map,color:0x6a6450,roughness:1})); p.position.set(0.295,0,0.295); g.add(p); g.rotation.x=-0.35-rnd()*0.3; g.rotation.z=(rnd()-0.5)*0.15; G.add(g);
  const b=new T.Mesh(new T.BoxGeometry(0.6,0.5,0.6),new T.MeshBasicMaterial({color:0x020202,side:T.BackSide})); b.position.set(x+0.3,H+0.25,z+0.3); G.add(b); });
 // ---------- Troffer-Leuchten (emissiv) ----------
 const lc=document.createElement('canvas'); lc.width=128; lc.height=64; { const x=lc.getContext('2d'); x.fillStyle='#bdb89a'; x.fillRect(0,0,128,64); [20,44].forEach(y=>{ const g=x.createLinearGradient(0,y-12,0,y+12); g.addColorStop(0,'rgba(255,252,230,0)'); g.addColorStop(0.5,'rgba(255,252,236,1)'); g.addColorStop(1,'rgba(255,252,230,0)'); x.fillStyle=g; x.fillRect(4,y-12,120,24); });
  x.strokeStyle='rgba(120,110,80,0.25)'; for(let i=0;i<128;i+=4){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,64); x.stroke(); } x.fillStyle='rgba(60,50,20,0.35)'; for(let i=0;i<6;i++) x.fillRect(10+i*19,30,3,2); }
 const lTex=new T.CanvasTexture(lc); lTex.colorSpace=T.SRGBColorSpace;
 const mOn=new T.MeshBasicMaterial({map:lTex,color:0xfff2c8,toneMapped:false,fog:true}), mWeak=new T.MeshBasicMaterial({map:lTex,color:0x9a8f6c,toneMapped:false}), mDead=new T.MeshStandardMaterial({map:lTex,color:0x55524a,roughness:0.5,vertexColors:false});
 const mFrame=new T.MeshStandardMaterial({color:0x8a8470,roughness:0.5,metalness:0.6});
 const TB={on:mk(),weak:mk(),dead:mk()}; const frameB=mk();
 const box=(B,cx,cy,cz,w,h,d,cv)=>{ const x0=cx-w/2,x1=cx+w/2,y0=cy-h/2,y1=cy+h/2,z0=cz-d/2,z1=cz+d/2; const C=[cv,cv,cv,cv];
  quad(B,[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],[0,-1,0],[[0,0],[1,0],[1,1],[0,1]],C); quad(B,[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1],[[0,0],[1,0],[1,1],[0,1]],C); quad(B,[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],[0,0,-1],[[0,0],[1,0],[1,1],[0,1]],C);
  quad(B,[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],[-1,0,0],[[0,0],[1,0],[1,1],[0,1]],C); quad(B,[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],[1,0,0],[[0,0],[1,0],[1,1],[0,1]],C); };
 const flickMeshes=[];
 tubes.forEach(t=>{ const tilt=(rnd()-0.5)*0.01; // nichts ganz gerade
  box(frameB,t.x,H-0.008,t.z,1.2,0.016,0.6,col(0.35)); 
  const P=[[t.x-0.57,H-0.02,t.z-0.27+tilt],[t.x+0.57,H-0.02,t.z-0.27-tilt],[t.x+0.57,H-0.02,t.z+0.27-tilt],[t.x-0.57,H-0.02,t.z+0.27+tilt]];
  if(t.state==='flick'){ const g=new T.BufferGeometry(); const B=mk(); quad(B,P,[0,-1,0],[[0,0],[1,0],[1,1],[0,1]],[[1,1,1],[1,1,1],[1,1,1],[1,1,1]]); const m=new T.Mesh(toGeo(B),mOn.clone()); m.material.vertexColors=false; m.name='br_flick'+flickMeshes.length; G.add(m); flickMeshes.push(m); t.mesh=m; }
  else quad(TB[t.state==='dead'?'dead':(t.I<1?'weak':'on')],P,[0,-1,0],[[0,0],[1,0],[1,1],[0,1]],[[1,1,1],[1,1,1],[1,1,1],[1,1,1]]); });
 const mOnV=mOn.clone(); add(TB.on,mOnV); add(TB.weak,mWeak); add(TB.dead,mDead); add(frameB,mFrame);
 // ---------- wenige echte Lichter (Spieler-Nähe + Flackerer) ----------
 const hemi=new T.HemisphereLight(0xfff4d0,0x3a3010,HEMI); S.add(hemi);
 const pl=[]; const mkPL=(t,I)=>{ const L=new T.PointLight(0xfff0c0,I,6,2); L.position.set(t.x,H-0.25,t.z); S.add(L); pl.push(L); return L; };
 const L0=mkPL(sp,BK?0.7:1.6), L1=mkPL(fl1,1.1), L2=mkPL(fl2,1.0); // alle drei sitzen an Troffern; mit Lightmap trägt L0 nur Glanz/Props
// ---------- versteckte Küche (mmk.js) hinter der angelehnten Tür im linken Seitengang ----------
const KIT=window.buildMMKitchen?buildMMKitchen(sc,{G,ROOT,L1,L2,hemi,hemiBase:HEMI,BK}):null; const XW=KIT?KIT.walls:[], XR=KIT?KIT.rects:[];
 // ---------- Set-Dressing ----------
 const decal=(draw,w,h,x,y,z,rx,ry)=>{ const c=document.createElement('canvas'); c.width=c.height=256; draw(c.getContext('2d')); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace;
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:t,transparent:true,depthWrite:false,roughness:0.6,polygonOffset:true,polygonOffsetFactor:-2})); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,0); m.name='br_olddecal'; G.add(m); return m; };
 const stain=x=>{ const cx=128, cy=128; for(let i=0;i<70;i++){ const a=rnd()*6.28, rr=Math.pow(rnd(),0.7)*80, px=cx+Math.cos(a)*rr*1.2, py=cy+Math.sin(a)*rr*0.8, r=10+rnd()*28; const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,'rgba(38,28,8,0.07)'); g.addColorStop(1,'rgba(38,28,8,0)'); x.fillStyle=g; x.fillRect(px-r,py-r,2*r,2*r); }
  x.strokeStyle='rgba(30,22,6,0.10)'; x.lineWidth=3; x.beginPath(); for(let k=0;k<=40;k++){ const a=k/40*6.283, r=70+Math.sin(a*3+rnd())*12+rnd()*6; x.lineTo(cx+Math.cos(a)*r*1.2,cy+Math.sin(a)*r*0.8); } x.stroke();
  const g=x.createRadialGradient(cx,cy,60,cx,cy,128); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,1)'); x.globalCompositeOperation='destination-out'; x.fillStyle=g; x.fillRect(0,0,256,256); x.globalCompositeOperation='source-over'; };
 if(!BK) [[0.8,-1.2,1.6],[-2.6,1.6,1.2],[0.2,-7.5,1.8],[-0.4,-15,2.2],[-8,-1.7,1.4],[3.4,-14,1.6],[1.7,6.5,1.4],[-3,-10.5,1.5]].forEach(([x,z,s])=>decal(stain,s,s*(0.7+rnd()*0.5),x,0.004,z,-Math.PI/2));
 const drip=x=>{ for(let i=0;i<6;i++){ const cx=40+rnd()*176, w=10+rnd()*30, len=60+rnd()*190; const g=x.createLinearGradient(0,0,0,len); g.addColorStop(0,'rgba(70,52,16,0.55)'); g.addColorStop(1,'rgba(70,52,16,0)'); x.fillStyle=g; x.fillRect(cx-w/2,0,w,len); } const g=x.createLinearGradient(0,0,0,40); g.addColorStop(0,'rgba(60,44,12,0.5)'); g.addColorStop(1,'rgba(60,44,12,0)'); x.fillStyle=g; x.fillRect(0,0,256,40); };
 if(!BK) [[-4+WT/2+0.005,1.8,1.2,Math.PI/2],[-1+WT/2+0.005,-6.5,1.4,Math.PI/2],[1-WT/2-0.005,-17,1.6,-Math.PI/2],[0.6,-4+WT/2+0.005,1.3,0],[-1.5,3-WT/2-0.005,1.2,Math.PI]].forEach(([x,z,w,ry])=>decal(drip,w,1.3,x,H-0.66,z,0,ry));
 // Müll: zerknülltes Papier, Dosen, Verlängerungskabel
 const paperM=new T.MeshStandardMaterial({color:0xcfc8b0,roughness:0.9,flatShading:true}); const paper=(x,z,s)=>{ const g=new T.IcosahedronGeometry(s,1); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const f=0.7+rnd()*0.5; p.setXYZ(i,p.getX(i)*f,p.getY(i)*f*0.8,p.getZ(i)*f); } g.computeVertexNormals(); const m=new T.Mesh(g,paperM); m.position.set(x,s*0.7,z); m.rotation.set(rnd()*3,rnd()*3,0); G.add(m); };
 [[1.2,-2.9,0.04],[-2.9,2.3,0.035],[0.5,-9,0.045],[-0.6,-13.5,0.04],[-7.5,-2,0.035],[2.1,7.6,0.04],[3.2,-0.2,0.03]].forEach(a=>paper(...a));
 const canC=document.createElement('canvas'); canC.width=128; canC.height=64; { const x=canC.getContext('2d'); x.fillStyle='#7a1612'; x.fillRect(0,0,128,64); x.fillStyle='#d8d0c0'; x.font='bold 22px sans-serif'; x.fillText('COLA',30,40); x.fillStyle='rgba(0,0,0,0.3)'; for(let i=0;i<30;i++) x.fillRect(Math.random()*128,Math.random()*64,3,2); }
 const canM=new T.MeshStandardMaterial({map:new T.CanvasTexture(canC),roughness:0.35,metalness:0.7});
 [[-0.3,-3.2,1],[3.1,2.4,0],[-5.2,-8.1,1],[0.7,-18.3,1]].forEach(([x,z,lying])=>{ const m=new T.Mesh(new T.CylinderGeometry(0.033,0.033,0.115,14),canM); if(lying){ m.rotation.set(Math.PI/2,0,rnd()*3); m.position.set(x,0.033,z); } else m.position.set(x,0.058,z); G.add(m); });
 { const pts=[[-3.85,0.35,2.6],[-3.5,0.01,2.2],[-2.8,0.01,2.4],[-2.2,0.01,1.6],[-1.4,0.012,1.9],[-0.9,0.01,1.3]].map(p=>new T.Vector3(...p)); G.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),60,0.0065,6),new T.MeshStandardMaterial({color:0xd8d0b8,roughness:0.5})));
  const plug=new T.Mesh(new T.BoxGeometry(0.06,0.04,0.09),new T.MeshStandardMaterial({color:0xd0c8b0,roughness:0.5})); plug.position.set(-0.86,0.02,1.24); plug.rotation.y=0.6; G.add(plug); }
 // Steckdose an der Wand
 { const s=new T.Mesh(new T.BoxGeometry(0.08,0.08,0.015),new T.MeshStandardMaterial({color:0xcfc6a8,roughness:0.4})); s.position.set(-4+WT/2+0.008,0.35,2.6); s.rotation.y=Math.PI/2; G.add(s); }
 // GLB-Props (auf Zielhöhe normiert, leicht schief)
 const glb=(f,x,z,ry,hgt,rx,rz)=>{ const e=document.createElement('a-entity'); e.setAttribute('gltf-model',ROOT+'assets/props/'+f); sc.appendChild(e);
  e.addEventListener('model-loaded',()=>{ const m=e.getObject3D('mesh'); const b=new T.Box3().setFromObject(m), sz=new T.Vector3(); b.getSize(sz); const s=hgt/sz.y; m.scale.multiplyScalar(s); const b2=new T.Box3().setFromObject(m); m.position.y-=b2.min.y;
   e.object3D.position.set(x,0,z); e.object3D.rotation.set(rx||0,ry,rz||0); m.traverse(n=>{ if(n.isMesh&&n.material){ n.material.roughness=Math.min(1,(n.material.roughness||0.5)+0.15); n.material.envMapIntensity=0.3; if(n.material.emissive&&n.material.emissiveIntensity) n.material.emissiveIntensity*=0.35; n.material.color&&n.material.color.multiplyScalar(0.8); } }); }); return e; };
 glb('vending_machine.glb',-3.5,0.6,Math.PI/2+0.03,1.85);
 glb('plastic_monobloc_chair_01.glb',0.55,-12.4,2.2,0.8,0,1.45);   // umgekippter Stuhl im Gang
 glb('metal_office_desk.glb',-4.6,-10.8,0.04,0.76); glb('wooden_crate_01.glb',4.8,-15.2,0.3,0.55); glb('plastic_crate_01.glb',5.2,-11.7,-0.2,0.3); glb('old_military_crate.glb',2.1,8.4,0.1,0.42);
 // Mülleimer (Drahtkorb, gebaut)
 { const g=new T.Group(); const wm=new T.MeshStandardMaterial({color:0x2a2a28,roughness:0.5,metalness:0.8}); for(let i=0;i<20;i++){ const a=i/20*Math.PI*2; const r=new T.Mesh(new T.CylinderGeometry(0.003,0.003,0.38,4),wm); r.position.set(Math.cos(a)*0.15,0.19,Math.sin(a)*0.15); r.rotation.set(Math.sin(a)*0.06,0,-Math.cos(a)*0.06); g.add(r); }
  [0.01,0.19,0.37].forEach(y=>{ const t=new T.Mesh(new T.TorusGeometry(y<0.1?0.14:0.15+(y-0.19)*0.06,0.005,4,28),wm); t.rotation.x=Math.PI/2; t.position.y=y; g.add(t); });
  const inside=new T.Mesh(new T.CylinderGeometry(0.135,0.13,0.2,14),paperM); inside.position.y=0.12; g.add(inside); g.position.set(-3.5,0,1.55); g.rotation.z=0.02; G.add(g); }
 // ---------- Mittel- und Fernschicht am Gangende (Matte Painting) ----------
 const cut=document.createElement('canvas'); cut.width=512; cut.height=512; { const x=cut.getContext('2d'); x.fillStyle='#16130a'; x.fillRect(0,0,512,512); x.clearRect(196,150,120,300); // Durchgang
  const g=x.createLinearGradient(0,0,0,512); g.addColorStop(0,'rgba(90,80,40,0.35)'); g.addColorStop(0.3,'rgba(90,80,40,0)'); x.fillStyle=g; x.fillRect(0,0,512,512); x.fillStyle='rgba(255,240,190,0.55)'; x.fillRect(150,60,212,10); }
 const cutT=new T.CanvasTexture(cut); cutT.colorSpace=T.SRGBColorSpace; const mid=new T.Mesh(new T.PlaneGeometry(4.4,4.4),new T.MeshBasicMaterial({map:cutT,transparent:true,fog:false,color:0x6a6450})); mid.position.set(0,1.95,-28); G.add(mid);
 const farT=TL.load(ROOT+'assets/pano/backrooms_alpha.jpg'); farT.colorSpace=T.SRGBColorSpace; farT.repeat.set(0.16,0.7); farT.offset.set(0.42,0.12);
 const far=new T.Mesh(new T.PlaneGeometry(9,6),new T.MeshBasicMaterial({map:farT,fog:false,color:0x403c30})); far.position.set(0,2.2,-36); G.add(far);
 const haze=new T.Mesh(new T.PlaneGeometry(2,H),new T.MeshBasicMaterial({color:0x1a170c,transparent:true,opacity:0.55,depthWrite:false,fog:false})); haze.position.set(0,H/2,-24.05); G.add(haze);
 let fakeDoor=null;
// Forced Perspective: kleinere Tür am Ende des hinteren Gangs
 if(window.zsaDoor){ const side=!!(window.ZSA&&ZSA.on&&ZSA.SIDES&&ZSA.SIDES.warteraum); /* im Spiel: die kleine Tür führt in den Warteraum (Abstecher, Rückweg durch NO EXIT) */ const d=zsaDoor(sc,{x:1.8,z:8.88,face:[1.8,0],locked:!side,light:0.18,reach:0.4},side?()=>ZSA.goSide('warteraum'):null); d.scale.setScalar(0.8); d.userData.fake=!side; fakeDoor=d; window.__brSideDoor=d; }
 // ---------- Gebackenes Licht (Blender-Lightmap) + Decals in einem Atlas (statt 13 Einzel-Decals) ----------
 if(window.ZSBake){ const P2=Math.PI/2, F=WT/2, hy=H-0.66, D=[];
  [[0.8,-1.2,1.7,0],[-2.6,1.6,1.3,1],[0.2,-7.5,1.9,0],[-0.4,-15,2.2,1],[-8,-1.7,1.5,0],[3.4,-14,1.7,1],[1.7,6.5,1.5,0],[-3,-10.5,1.6,1],[2.6,-2.6,1.2,6]].forEach(([x,z,s,c],i)=>D.push([c,x,0,z,s,s*0.8,'y',i*1.3]));
  [[-4+F,1.8,'+x',1.2],[-1+F,-6.5,'+x',1.4],[1-F,-17,'-x',1.6],[0.6,-4+F,'+z',1.3],[-1.5,3-F,'-z',1.2],[4-F,1.6,'-x',1.4],[-1+F,-19.5,'+x',1.2]].forEach(([x,z,f,w])=>{ const fx=f==='+x'||f==='-x'; D.push([5,fx?x:x,hy,fx?z:z,w,1.3,f]); });
  [[-4+F,0.2,'+x',2.4],[-4+F,2.0,'+x',1.6],[-2.2,3-F,'-z',2.4],[4-F,1.6,'-x',2.4],[-1+F,-8,'+x',3],[1-F,-6,'-x',3],[1-F,-19,'-x',3],[-1+F,-14,'+x',2.5],[0.5,-4+F,'+z',1.6]].forEach(([x,z,f,w])=>D.push([4,x,0.3,z,w,0.6,f]));
  [[-4+0.3,0.9,-P2,3.6],[4-0.3,1.2,P2,3.4],[-1.4,3-0.3,0,4.6],[-1+0.3,-10,-P2,8],[1-0.3,-12,P2,8],[-0.5,-4+0.3,Math.PI,5]].forEach(([x,z,r,w])=>D.push([7,x,0,z,w,0.6,'y',r]));
  [[1.2,0.9,0],[-2.4,-2.2,10],[0.1,-8.5,0],[-0.3,-19,10],[2.0,5.5,0],[-6,-1.7,0],[3.2,-13.2,10]].forEach(([x,z,c],i)=>D.push([c,x,H-0.002,z,c?1.0:1.3,c?1.0:1.1,'-y',i]));
  D.push([8,0,0,-10.5,0.9,6,'y',0.02],[8,0.1,0,-1.5,0.9,3.5,'y',-0.04],[3,-4+F,1.4,-3.1,0.6,0.7,'+x',0.5],[3,1-F,1.2,-9.4,0.7,0.8,'-x',2.1],[9,-3.4,0,1.55,0.45,0.45,'y',0],[11,0.9,0,-2.3,0.12,0.12,'y',0]);
  // Küche (mmk.js): X -11.5..-7.0, Z -0.92..2.5, Höhe 2.6
  D.push([0,-9.4,0,1.1,1.5,1.2,'y',0.4],[7,-11.2,0,0.8,3.2,0.6,'y',-P2],[7,-9.2,0,-0.62,4.4,0.6,'y',Math.PI],[4,-11.5,0.3,0.8,2.6,0.6,'+x'],[0,-9.1,2.598,0.2,1.2,1.0,'-y',0.3],[10,-11.0,2.598,2.1,1.0,1.0,'-y',1],[5,-11.5,1.9,1.9,1.0,1.2,'+x']);
  window.ZSBake.realism(G,sc,{room:'br',base:ROOT+'assets/bake/backrooms/',texRoot:ROOT+'assets/tex/realism/',lmGain:0.55,aoInt:0.8,specGain:4,vcKeep:0,vcNames:['br_floor','br_ceil','br_wall'],decals:D}); }
 // ---------- Kollision ----------
 const collide=(p,r)=>{ r=r||0.28; for(let it=0;it<2;it++){ for(const [ax,az,bx,bz] of W.concat(XW)){ const vx=bx-ax, vz=bz-az, l=vx*vx+vz*vz; let u=((p.x-ax)*vx+(p.z-az)*vz)/l; u=Math.max(0,Math.min(1,u)); const cx=ax+u*vx, cz=az+u*vz; const dx=p.x-cx, dz=p.z-cz, d=Math.hypot(dx,dz); const m=r+WT/2; if(d<m&&d>1e-5){ p.x=cx+dx/d*m; p.z=cz+dz/d*m; } }
   for(const [x,z,s] of PIL){ const h=s/2+r; const dx=p.x-x, dz=p.z-z; if(Math.abs(dx)<h&&Math.abs(dz)<h){ if(h-Math.abs(dx)<h-Math.abs(dz)) p.x=x+Math.sign(dx)*h; else p.z=z+Math.sign(dz)*h; } }
   for(const [x0,x1,z0,z1] of XR){ if(p.x>x0-r&&p.x<x1+r&&p.z>z0-r&&p.z<z1+r){ const pen=[p.x-(x0-r),(x1+r)-p.x,p.z-(z0-r),(z1+r)-p.z]; const m=Math.min(...pen); if(m===pen[0]) p.x=x0-r; else if(m===pen[1]) p.x=x1+r; else if(m===pen[2]) p.z=z0-r; else p.z=z1+r; } } }
  p.x=Math.max(BOUND.x0,Math.min(BOUND.x1,p.x)); p.z=Math.max(BOUND.z0,Math.min(BOUND.z1,p.z)); return p; };
 // ---------- Flackern + Welt-Helligkeit ----------
 const st=[{t:fl1,L:L1,on:1,next:0},{t:fl2,L:L2,on:1,next:0}]; let K=1; const base0={hemi:hemi.intensity,L0:L0.intensity,L1:L1.intensity,L2:L2.intensity};
 const vcMats=[mFloor,mWall,mCeil,mRail,mBase];
 const setWorld=k=>{ K=k; vcMats.forEach(m=>m.color.setScalar(k)); mOnV.color.setHex(0xfff2c8).multiplyScalar(Math.max(0.02,k)); mWeak.color.setHex(0x9a8f6c).multiplyScalar(Math.max(0.02,k)); hemi.intensity=base0.hemi*k; L0.intensity=base0.L0*k; };
 const tick=(now)=>{ st.forEach(s=>{ if(now>s.next){ s.on=s.on?0:1; s.next=now+(s.on?(Math.random()<0.3?50+Math.random()*120:1200+Math.random()*4500):(40+Math.random()*160)); if(o.onFlick) o.onFlick(s.on); }
   const v=s.on?1:0.06; s.L.intensity=base0[s===st[0]?'L1':'L2']*v*K; s.t.mesh.material.color.setHex(0xfff2c8).multiplyScalar(Math.max(0.03,v*K)); }); if(KIT){ KIT.tick(now,st,K); cull(G.visible&&window.__mmk&&__mmk.inside>0.97); } };
// in der Küche: alles ausblenden, was man durch die Tür nicht sehen kann (nur Gang bleibt) → weniger Draw Calls auf der Quest
let culled=false, cullList=null; const cull=on=>{ if(on===culled) return; culled=on; if(!cullList){ cullList=[]; const c3=new T.Vector3(), b3=new T.Box3(); G.children.forEach(c=>{ if(c===KIT.group||c.userData.keep) return; b3.setFromObject(c); if(b3.isEmpty()) return; b3.getCenter(c3); if(c3.x>-12.3&&c3.x<-3.7&&c3.z>-2.8&&c3.z<-0.7) return; cullList.push(c); });
  sc.querySelectorAll('[gltf-model]').forEach(e=>cullList.push(e.object3D)); if(sc.__door) cullList.push(sc.__door); if(fakeDoor) cullList.push(fakeDoor); }
 cullList.forEach(c=>{ c.visible=!on; }); };
 return {group:G,kitchen:KIT,collide,setWorld,tick,tubes,hemi,spawn:{x:0,z:0.3},doorAt:{x:4-WT/2-0.01,z:-0.9,face:[0,-0.9]},H};
};
})();
