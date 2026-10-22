/* Kinderzimmer 1984 in echtem 3D. Boden y=0, Raum x[-2.1,2.1] z[-2,2], Höhe 2.5. Nur Lampenlicht, warm; Fenster mit Nacht-Schichten.
   window.build84(sceneEl) → {surf, collide, lamp} */
(function(){
const X0=-2.1,X1=2.1,Z0=-2.0,Z1=2.0,H=2.5,WIN={x:0.45,w:1.2,y0:0.9,y1:2.05}, DOOR={x:1.5,w:0.98,h:2.12};
let sd=84; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
window.build84=function(sc){ const T=THREE, S=sc.object3D, TL=new T.TextureLoader(), G=new T.Group(); S.add(G);
 const tex=(f,srgb,rep)=>{ const t=TL.load('../assets/tex/k84/'+f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; if(rep) t.repeat.set(rep[0],rep[1]); return t; };
 const mk=()=>({p:[],n:[],u:[],c:[],i:[]}); const quad=(B,P,N,U,C)=>{ const b=B.p.length/3; P.forEach((v,k)=>{ B.p.push(...v); B.n.push(...N); B.u.push(...U[k]); B.c.push(C[k],C[k],C[k]); }); B.i.push(b,b+1,b+2,b,b+2,b+3); };
 const geo=B=>{ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(B.p,3)); g.setAttribute('normal',new T.Float32BufferAttribute(B.n,3)); g.setAttribute('uv',new T.Float32BufferAttribute(B.u,2)); g.setAttribute('color',new T.Float32BufferAttribute(B.c,3)); g.setIndex(B.i); return g; };
 // Kontaktschatten-Boxen (Möbel) für AO
 const FURN=[[-2.1,-1.13,-1.98,0.05,0.55],[-1.0,-0.5,-1.98,-1.5,0.62],[1.45,2.1,-0.95,0.45,0.76],[1.3,2.1,-1.98,-1.55,1.6]];
 const aoFloor=(x,z)=>{ let a=1; const e=Math.min(x-X0,X1-x,z-Z0,Z1-z); a*=0.5+0.5*Math.min(1,e/0.5); for(const [a0,a1,b0,b1] of FURN){ const dx=Math.max(a0-x,0,x-a1), dz=Math.max(b0-z,0,z-b1), d=Math.hypot(dx,dz); a*=0.55+0.45*Math.min(1,d/0.35); } return a; };
 const aoWall=(y,s,L)=>{ let a=(0.55+0.45*Math.min(1,y/0.35))*(0.7+0.3*Math.min(1,(H-y)/0.35)); const e=Math.min(s,L-s); a*=0.6+0.4*Math.min(1,e/0.4); return a; };
 // Boden + Decke (Raster 0,25)
 const FB=mk(), CB=mk(); for(let x=X0;x<X1-1e-6;x+=0.25) for(let z=Z0;z<Z1-1e-6;z+=0.25){ const x2=Math.min(X1,x+0.25), z2=Math.min(Z1,z+0.25);
  let P=[[x,0,z2],[x2,0,z2],[x2,0,z],[x,0,z]]; quad(FB,P,[0,1,0],P.map(v=>[v[0]/1.2,-v[2]/1.2]),P.map(v=>aoFloor(v[0],v[2])));
  P=[[x,H,z],[x2,H,z],[x2,H,z2],[x,H,z2]]; quad(CB,P,[0,-1,0],P.map(v=>[v[0]/1.5,v[2]/1.5]),P.map(v=>{ const e=Math.min(v[0]-X0,X1-v[0],v[2]-Z0,Z1-v[2]); return 0.55+0.45*Math.min(1,e/0.45); })); }
 // Wände mit Aussparungen (Fenster hinten, Tür vorn)
 const WB=mk(); const XS=(a,b,cuts)=>{ const s=new Set([a,b]); for(let v=a; v<b; v+=0.25) s.add(+v.toFixed(3)); cuts.forEach(c=>s.add(c)); return [...s].filter(v=>v>=a&&v<=b).sort((p,q)=>p-q); };
 const wall=(kind)=>{ // kind: back(z=Z0, n +z), front(z=Z1, n -z), left(x=X0,n +x), right(x=X1,n -x)
  const L=(kind==='back'||kind==='front')?X1-X0:Z1-Z0; let hole=null; if(kind==='back') hole=[WIN.x-WIN.w/2-X0,WIN.x+WIN.w/2-X0,WIN.y0,WIN.y1]; if(kind==='front') hole=[X1-(DOOR.x+DOOR.w/2),X1-(DOOR.x-DOOR.w/2),0,DOOR.h];
  const ss=XS(0,L,hole?[hole[0],hole[1]]:[]), ys=XS(0,H,hole?[hole[2],hole[3]]:[]);
  const P3=(s,y)=>kind==='back'?[X0+s,y,Z0]:kind==='front'?[X1-s,y,Z1]:kind==='left'?[X0,y,Z1-s]:[X1,y,Z0+s];
  const N=kind==='back'?[0,0,1]:kind==='front'?[0,0,-1]:kind==='left'?[1,0,0]:[-1,0,0];
  for(let i=0;i<ss.length-1;i++) for(let j=0;j<ys.length-1;j++){ const s0=ss[i],s1=ss[i+1],y0=ys[j],y1=ys[j+1]; const ms=(s0+s1)/2, my=(y0+y1)/2; if(hole&&ms>hole[0]&&ms<hole[1]&&my>hole[2]&&my<hole[3]) continue;
   const P=[P3(s0,y0),P3(s1,y0),P3(s1,y1),P3(s0,y1)]; quad(WB,P,N,[[s0/1.0,y0/1.0],[s1/1.0,y0/1.0],[s1/1.0,y1/1.0],[s0/1.0,y1/1.0]],[aoWall(y0,s0,L),aoWall(y0,s1,L),aoWall(y1,s1,L),aoWall(y1,s0,L)]); } };
 ['back','front','left','right'].forEach(wall);
 // Laibungen Fenster (Tiefe 0,25)
 { const d=0.25, x0=WIN.x-WIN.w/2, x1=WIN.x+WIN.w/2; const P=[[[x0,WIN.y0,Z0],[x1,WIN.y0,Z0],[x1,WIN.y0,Z0-d],[x0,WIN.y0,Z0-d]],[[x0,WIN.y1,Z0-d],[x1,WIN.y1,Z0-d],[x1,WIN.y1,Z0],[x0,WIN.y1,Z0]],[[x0,WIN.y0,Z0-d],[x0,WIN.y1,Z0-d],[x0,WIN.y1,Z0],[x0,WIN.y0,Z0]],[[x1,WIN.y0,Z0],[x1,WIN.y1,Z0],[x1,WIN.y1,Z0-d],[x1,WIN.y0,Z0-d]]];
  const N=[[0,1,0],[0,-1,0],[1,0,0],[-1,0,0]]; P.forEach((p,k)=>quad(WB,p,N[k],p.map(v=>[v[0]+v[2],v[1]+v[2]]),[0.6,0.6,0.6,0.6])); }
 const std=o=>new T.MeshStandardMaterial(o);
 const mFloor=std({map:tex('carpet_c.jpg',1,[1,1]),normalMap:tex('carpet_n.jpg'),roughness:1,vertexColors:true});
 const mWall=std({map:tex('wall_c.jpg',1),normalMap:tex('wall_n.jpg'),roughness:0.85,vertexColors:true}); mWall.normalScale.set(0.5,0.5);
 const mCeil=std({map:tex('ceil_c.jpg',1),normalMap:tex('ceil_n.jpg'),roughness:0.95,vertexColors:true});
 [[FB,mFloor],[CB,mCeil],[WB,mWall]].forEach(([B,m])=>{ const me=new T.Mesh(geo(B),m); me.matrixAutoUpdate=false; G.add(me); });
 // Fußleisten
 const woodT=TL.load('../assets/tex/kirmes/WoodFloor/WoodFloor051_1K-JPG_Color.jpg'); woodT.colorSpace=T.SRGBColorSpace; woodT.wrapS=woodT.wrapT=T.RepeatWrapping;
 const woodN=TL.load('../assets/tex/kirmes/WoodFloor/WoodFloor051_1K-JPG_NormalGL.jpg'); woodN.wrapS=woodN.wrapT=T.RepeatWrapping;
 const mWood=std({map:woodT,normalMap:woodN,color:0x8a6a50,roughness:0.62}), mWoodD=std({map:woodT,normalMap:woodN,color:0x5a4030,roughness:0.55});
 const box=(w,h,d,m,x,y,z,ry,p)=>{ const o=new T.Mesh(new T.BoxGeometry(w,h,d),m); o.position.set(x,y,z); if(ry) o.rotation.y=ry; (p||G).add(o); return o; };
 box(X1-X0,0.08,0.015,mWoodD,0,0.04,Z0+0.008); box(0.015,0.08,Z1-Z0,mWoodD,X0+0.008,0.04,0); box(0.015,0.08,Z1-Z0,mWoodD,X1-0.008,0.04,0); box(X1-(DOOR.x+DOOR.w/2+0.06)-X0,0.08,0.015,mWoodD,(X0+DOOR.x-DOOR.w/2-0.06)/2,0.04,Z1-0.008);
 // ---------- Fenster: Rahmen, Sprossen, Glas, Vorhänge, Gardinenstange ----------
 const wf=std({color:0xd8d0bc,roughness:0.55}); const wx0=WIN.x-WIN.w/2, wx1=WIN.x+WIN.w/2, wz=Z0-0.12;
 box(WIN.w,0.06,0.07,wf,WIN.x,WIN.y0+0.03,wz); box(WIN.w,0.06,0.07,wf,WIN.x,WIN.y1-0.03,wz); box(0.06,WIN.y1-WIN.y0,0.07,wf,wx0+0.03,(WIN.y0+WIN.y1)/2,wz); box(0.06,WIN.y1-WIN.y0,0.07,wf,wx1-0.03,(WIN.y0+WIN.y1)/2,wz); box(0.05,WIN.y1-WIN.y0,0.06,wf,WIN.x,(WIN.y0+WIN.y1)/2,wz); box(WIN.w,0.04,0.06,wf,WIN.x,WIN.y0+0.72,wz);
 box(WIN.w+0.2,0.035,0.3,std({color:0xcfc6b0,roughness:0.5}),WIN.x,WIN.y0-0.015,Z0+0.02); // Fensterbank
 const glass=new T.Mesh(new T.PlaneGeometry(WIN.w,WIN.y1-WIN.y0),new T.MeshStandardMaterial({color:0x0a1020,roughness:0.05,metalness:0.9,transparent:true,opacity:0.28,depthWrite:false})); glass.position.set(WIN.x,(WIN.y0+WIN.y1)/2,wz-0.01); G.add(glass);
 // Nacht draußen: mittlere Schicht (Häuser-Silhouetten mit warmen Fenstern) + ferner Himmel; Nebel dazwischen (fog:false, eingefärbt)
 const cv=(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t; };
 const sky=cv(512,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#04060e'); g.addColorStop(0.7,'#101a30'); g.addColorStop(1,'#1c2236'); x.fillStyle=g; x.fillRect(0,0,w,h); for(let i=0;i<70;i++){ x.fillStyle='rgba(220,230,255,'+(Math.random()*0.5)+')'; x.fillRect(Math.random()*w,Math.random()*h*0.6,1,1); }
  const m=x.createRadialGradient(380,60,4,380,60,40); m.addColorStop(0,'rgba(230,235,255,0.95)'); m.addColorStop(0.2,'rgba(200,210,240,0.5)'); m.addColorStop(1,'rgba(200,210,240,0)'); x.fillStyle=m; x.fillRect(320,0,140,130); });
 const farP=new T.Mesh(new T.PlaneGeometry(14,7),new T.MeshBasicMaterial({map:sky,fog:false})); farP.position.set(WIN.x,2.2,Z0-9); G.add(farP);
 const houses=cv(1024,256,(x,w,h)=>{ x.clearRect(0,0,w,h); x.fillStyle='#05060a'; let px=0; while(px<w){ const bw=90+Math.random()*120, bh=70+Math.random()*80; x.beginPath(); x.moveTo(px,h); x.lineTo(px,h-bh); x.lineTo(px+bw/2,h-bh-40-Math.random()*20); x.lineTo(px+bw,h-bh); x.lineTo(px+bw,h); x.fill();
   for(let k=0;k<3;k++) if(Math.random()<0.5){ x.fillStyle=Math.random()<0.7?'rgba(255,190,110,0.85)':'rgba(140,170,255,0.7)'; x.fillRect(px+15+k*28,h-bh+20+Math.random()*20,12,16); x.fillStyle='#05060a'; } px+=bw+10; }
  const l=x.createRadialGradient(700,150,2,700,150,60); l.addColorStop(0,'rgba(255,200,120,0.8)'); l.addColorStop(1,'rgba(255,200,120,0)'); x.fillStyle=l; x.fillRect(620,80,160,140); x.fillStyle='#05060a'; x.fillRect(698,150,4,106); });
 const midP=new T.Mesh(new T.PlaneGeometry(9,2.25),new T.MeshBasicMaterial({map:houses,transparent:true,fog:false,color:0xb0b0c0})); midP.position.set(WIN.x+0.4,1.05,Z0-4.5); G.add(midP);
 const hz=new T.Mesh(new T.PlaneGeometry(12,6),new T.MeshBasicMaterial({color:0x101626,transparent:true,opacity:0.35,fog:false,depthWrite:false})); hz.position.set(WIN.x,2,Z0-6.5); G.add(hz);
 // Vorhänge (gewellt), Stange
 const mCur=std({map:tex('curtain_c.jpg',1,[2,1]),normalMap:tex('fabric_n.jpg',0,[3,3]),roughness:0.95,side:T.DoubleSide});
 const curtain=(cx,w)=>{ const g=new T.PlaneGeometry(w,2.12,24,8); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i); p.setZ(i,Math.sin(x/w*Math.PI*7+(rnd()*0.2))*0.035*(1+0.4*(1-(y+1.06)/2.12))); } g.computeVertexNormals(); const m=new T.Mesh(g,mCur); m.position.set(cx,1.25,Z0+0.09); G.add(m); };
 curtain(wx0-0.18,0.5); curtain(wx1+0.2,0.46); { const r=new T.Mesh(new T.CylinderGeometry(0.012,0.012,WIN.w+1.2,10),std({color:0x8a7040,metalness:0.8,roughness:0.4})); r.rotation.z=Math.PI/2; r.position.set(WIN.x,2.33,Z0+0.12); G.add(r); }
 // ---------- Bett (gebaut): Gestell, Matratze, Decke (gewellt), Kissen ----------
 const bx0=-2.08,bx1=-1.15,bz0=-1.96,bz1=0.04, bw=bx1-bx0, bl=bz1-bz0, bcx=(bx0+bx1)/2, bcz=(bz0+bz1)/2;
 box(bw,0.28,bl,mWood,bcx,0.16,bcz); box(bw+0.04,0.85,0.05,mWoodD,bcx,0.43,bz0+0.02); box(bw+0.04,0.45,0.04,mWoodD,bcx,0.24,bz1);
 box(bw-0.04,0.16,bl-0.06,std({color:0xd8d0c0,roughness:0.9}),bcx,0.38,bcz);
 const mDuv=std({map:tex('duvet_c.jpg',1,[1.4,1.4]),normalMap:tex('fabric_n.jpg',0,[4,4]),roughness:0.92});
 { const g=new T.PlaneGeometry(bw+0.14,bl-0.35,24,40); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i); const ex=Math.abs(x)/((bw+0.14)/2); let z=0.06*Math.sin(y*5.3+x*3)+0.04*Math.sin(y*11+1.7)*Math.cos(x*9); z+= -Math.pow(Math.max(0,ex-0.72)/0.28,2)*0.17; z+=0.07*Math.exp(-((y-0.2)**2)/0.08-(x**2)/0.06); p.setZ(i,z); } g.computeVertexNormals();
  const m=new T.Mesh(g,mDuv); m.rotation.x=-Math.PI/2; m.position.set(bcx,0.5,bcz+0.17); G.add(m); }
 { const pg=new T.SphereGeometry(1,24,12); pg.scale(0.33,0.07,0.2); const pl=new T.Mesh(pg,std({color:0xe8e0d0,map:tex('ceil_c.jpg',1),roughness:0.9})); pl.position.set(bcx,0.53,bz0+0.22); pl.rotation.set(0.12,0.05,0.03); G.add(pl); }
 // Teddy (einfach, Plüsch)
 { const fur=std({color:0x7a5236,roughness:1}); const t=new T.Group(); const b=new T.Mesh(new T.SphereGeometry(0.09,14,10),fur); b.scale.set(1,1.15,0.9); t.add(b); const h=new T.Mesh(new T.SphereGeometry(0.065,14,10),fur); h.position.y=0.13; t.add(h); [-1,1].forEach(s=>{ const e=new T.Mesh(new T.SphereGeometry(0.025,8,6),fur); e.position.set(s*0.045,0.185,0); t.add(e); const a=new T.Mesh(new T.SphereGeometry(0.035,8,6),fur); a.scale.set(1,1.6,1); a.position.set(s*0.09,0.02,0.02); t.add(a); const l=new T.Mesh(new T.SphereGeometry(0.038,8,6),fur); l.scale.set(1,0.8,1.5); l.position.set(s*0.05,-0.09,0.06); t.add(l); });
  const sn=new T.Mesh(new T.SphereGeometry(0.03,8,6),std({color:0xb08a68,roughness:1})); sn.position.set(0,0.12,0.055); t.add(sn); t.position.set(bcx+0.15,0.62,bz0+0.3); t.rotation.set(-0.25,0.5,0.1); G.add(t); }
 // ---------- Schreibtisch (gebaut) + Stuhl/Lampe (GLB) ----------
 const dx=1.78, dz=-0.25; box(0.6,0.03,1.3,mWood,dx,0.745,dz); [[-0.27,-0.6],[0.27,-0.6],[-0.27,0.6],[0.27,0.6]].forEach(([a,b])=>box(0.04,0.73,0.04,mWoodD,dx+a,0.365,dz+b)); box(0.5,0.16,0.42,mWood,dx-0.02,0.64,dz+0.38);
 const ph=(n,x,y,z,ry,sc)=>{ const e=document.createElement('a-entity'); e.setAttribute('gltf-model','../assets/props/ph/'+n+'/'+n+'.gltf'); e.setAttribute('position',x+' '+y+' '+z); e.setAttribute('rotation','0 '+ry+' 0'); e.setAttribute('scale',sc+' '+sc+' '+sc); sc_.appendChild(e); real(e); return e; }; const sc_=sc;
 const glb=(f,x,y,z,ry,hgt,rz)=>{ const e=document.createElement('a-entity'); e.setAttribute('gltf-model','../assets/props/'+f); sc.appendChild(e); e.addEventListener('model-loaded',()=>{ const m=e.getObject3D('mesh'); const b=new T.Box3().setFromObject(m), sz=new T.Vector3(); b.getSize(sz); m.scale.multiplyScalar(hgt/sz.y); const b2=new T.Box3().setFromObject(m); m.position.y-=b2.min.y; e.object3D.position.set(x,y,z); e.object3D.rotation.set(0,ry,rz||0); }); real(e); return e; };
 // Realismus-Pass für alle Modelle: Rauheit rauf, Spiegelung runter, leicht abgedunkelt
 function real(e){ e.addEventListener('model-loaded',()=>e.object3D.traverse(n=>{ if(n.isMesh&&n.material){ const ms=Array.isArray(n.material)?n.material:[n.material]; ms.forEach(m=>{ if(m.roughness!=null) m.roughness=Math.min(1,m.roughness*1.1+0.08); m.envMapIntensity=0.25; m.color&&m.color.multiplyScalar(0.88); }); } })); }
 ph('painted_wooden_nightstand',-0.75,0,-1.73,0,1); ph('painted_wooden_shelves',1.72,0,-1.78,180,1);
 glb('painted_wooden_chair_01.glb',1.32,0,-0.2,Math.PI/2+0.25,0.9);
 glb('desk_lamp_arm_01.glb',1.92,0.76,-0.72,-Math.PI*0.75,0.45);
 // Lampenlicht (warm) + Glühbirne + kleiner Schein
 const bulb=new T.Mesh(new T.SphereGeometry(0.022,12,8),new T.MeshBasicMaterial({color:0xffd59a,toneMapped:false})); bulb.position.set(1.82,1.08,-0.6); G.add(bulb);
 const lamp=new T.PointLight(0xffb070,2.4,5.5,2); lamp.position.set(1.78,1.02,-0.5); S.add(lamp);
 const gc=cv(128,128,(x)=>{ const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,220,160,0.9)'); g.addColorStop(0.25,'rgba(255,190,110,0.25)'); g.addColorStop(1,'rgba(255,190,110,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 const glow=(x,y,z,s,c,o)=>{ const sp=new T.Sprite(new T.SpriteMaterial({map:gc,color:c,transparent:true,opacity:o,depthWrite:false,blending:T.AdditiveBlending,fog:false})); sp.position.set(x,y,z); sp.scale.set(s,s,1); G.add(sp); return sp; };
 glow(1.82,1.06,-0.6,0.35,0xffffff,0.7);
 // Neon (klein, pink) an der rechten Wand – gesättigter Akzent im Dunkel
 const neon=cv(512,192,(x,w,h)=>{ x.font='italic 700 120px "Brush Script MT","Segoe Script",cursive'; x.textAlign='center'; x.textBaseline='middle'; x.shadowColor='#ff3fae'; x.shadowBlur=26; x.strokeStyle='#ff9ad8'; x.lineWidth=7; x.strokeText('Dream',w/2,h/2); x.shadowBlur=8; x.strokeStyle='#ffe6f6'; x.lineWidth=2.5; x.strokeText('Dream',w/2,h/2); });
 const nm=new T.Mesh(new T.PlaneGeometry(0.75,0.28),new T.MeshBasicMaterial({map:neon,transparent:true,toneMapped:false,blending:T.AdditiveBlending,depthWrite:false})); nm.position.set(X1-0.03,1.85,0.35); nm.rotation.y=-Math.PI/2; G.add(nm);
 const nl=new T.PointLight(0xff3fae,0.9,3.2,2); nl.position.set(X1-0.3,1.85,0.35); S.add(nl);
 // Mondlicht durchs Fenster (kühl, schwach)
 const ml=new T.PointLight(0x7090d0,0.9,4.5,2); ml.position.set(WIN.x,1.5,Z0+0.25); S.add(ml);
 S.add(new T.HemisphereLight(0x2a2440,0x0a0604,0.35));
 // ---------- Set-Dressing ----------
 const rug=TL.load('../assets/tex/k84/rug.png'); rug.colorSpace=T.SRGBColorSpace; const rm=new T.Mesh(new T.CircleGeometry(0.85,48),std({map:rug,transparent:true,roughness:1,polygonOffset:true,polygonOffsetFactor:-2})); rm.rotation.x=-Math.PI/2; rm.position.set(0.1,0.006,0.25); G.add(rm);
 const cabM=std({color:0x1a1814,roughness:0.6}); const cable=(pts)=>G.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),40,0.005,6),cabM));
 cable([[-0.75,0.62,-1.92],[-0.72,0.35,-1.95],[-0.6,0.01,-1.92],[-0.2,0.01,-1.93],[0.05,0.3,-1.985]]); // TV → Steckdose
 cable([[1.95,0.78,-0.78],[2.05,0.7,-0.9],[2.07,0.2,-0.95],[2.04,0.01,-1.1],[2.08,0.3,-1.4]]); // Lampe → Steckdose
 [[0.05,0.3,Z0+0.006,0],[X1-0.006,0.3,-1.4,-Math.PI/2]].forEach(([x,y,z,r])=>{ const s=box(0.075,0.075,0.012,std({color:0xd8d0b8,roughness:0.4}),x,y,z); s.rotation.y=r; });
 // Comics + Kassette auf dem Boden/Tisch, Poster
 const pm=n=>{ const m=std({color:0xb8a8a0,roughness:0.85}); const t=TL.load('../assets/era1984/'+n+'.jpg?v=1022z5',t=>{ t.colorSpace=T.SRGBColorSpace; m.map=t; m.needsUpdate=true; }); return m; };
 [['p2',-0.55,0.62,0.3],['p4',0.7,-0.95,-0.7]].forEach(([n,x,z,r])=>{ const c=new T.Mesh(new T.BoxGeometry(0.17,0.006,0.25),pm(n)); c.position.set(x,0.009,z); c.rotation.y=r; G.add(c); });
 { const k=new T.Group(); const sh=box(0.1,0.016,0.064,std({color:0x111111,roughness:0.4}),0,0,0,0,k); const lb=new T.Mesh(new T.PlaneGeometry(0.08,0.04),std({color:0xe8d8a0,roughness:0.8})); lb.rotation.x=-Math.PI/2; lb.position.y=0.0085; k.add(lb); k.position.set(1.7,0.768,0.1); k.rotation.y=0.4; G.add(k); }
 [['p1',X0+0.004,1.55,-0.95,Math.PI/2,0.02],['p3',X1-0.004,1.5,-0.95,-Math.PI/2,-0.03],['p4',-0.6,1.6,Z1-0.004,Math.PI,0.015]].forEach(([n,x,y,z,ry,rz])=>{ const p=new T.Mesh(new T.PlaneGeometry(0.5,0.72),pm(n)); p.position.set(x,y,z); p.rotation.set(0,ry,rz); G.add(p);
   [[-0.23,0.34],[0.23,0.34]].forEach(([a,b])=>{ const t=new T.Mesh(new T.PlaneGeometry(0.05,0.03),new T.MeshStandardMaterial({color:0xd8d0b0,transparent:true,opacity:0.6,roughness:0.3})); t.position.set(a,b,0.002); p.add(t); }); });
 // Deckenlampe (aus) – Stoffschirm
 { const sh=new T.Mesh(new T.CylinderGeometry(0.1,0.19,0.16,24,1,true),std({color:0xb89870,roughness:0.95,side:T.DoubleSide})); sh.position.set(0,H-0.24,-0.3); G.add(sh); const c=new T.Mesh(new T.CylinderGeometry(0.004,0.004,0.3,6),cabM); c.scale.y=0.3; c.position.set(0,H-0.12,-0.3); G.add(c); }
 // ---------- Oberflächen + Kollision ----------
 const surf=[[bcx,bcz,bw,bl,0.55],[-0.75,-1.73,0.5,0.42,0.62],[dx,dz,0.6,1.3,0.76],[1.72,-1.78,0.85,0.35,1.13]];
 const solid=[[bx0,bx1,bz0,bz1],[-1.0,-0.5,-1.98,-1.5],[dx-0.3,dx+0.3,dz-0.65,dz+0.65],[1.3,2.1,-1.98,-1.6]];
 const collide=(p,r)=>{ r=r||0.25; p.x=Math.max(X0+r,Math.min(X1-r,p.x)); p.z=Math.max(Z0+r,Math.min(Z1-r,p.z)); for(const [a0,a1,b0,b1] of solid){ if(p.x>a0-r&&p.x<a1+r&&p.z>b0-r&&p.z<b1+r){ const dl=p.x-(a0-r), dr=(a1+r)-p.x, db=p.z-(b0-r), df=(b1+r)-p.z; const m=Math.min(dl,dr,db,df); if(m===dl) p.x=a0-r; else if(m===dr) p.x=a1+r; else if(m===db) p.z=b0-r; else p.z=b1+r; } } return p; };
 return {surf,collide,lamp,H};
};
})();
