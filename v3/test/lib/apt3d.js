/* Apartment 2041 – echtes 3D, enge, heruntergekommene Wohnung. Boden y=0.
   Herzstück: das Horror-Sofa (geblümter, abgewetzter Stoff). Sitz- und Rückenkissen sind Kiefer; Zähne + Rachen in den Fugen versteckt.
   Ruhig im Halbdunkel (seltenes Zucken). Spieler < ~1 m oder Klick → reißt auf, schnellt ~30 cm vor, Knurren + Zuschnappen (~0,5 s), sinkt zurück. Einmal pro Besuch.
   Komfort: keine Kamerabewegung, kein Blitz, Welt bleibt ruhig. Licht: 3 Quellen (Fenster-Spot, Grün unterm Sofa, TV-Flimmern). window.buildApt(sceneEl,C) */
(function(){
let sd=41; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
window.buildApt=function(sc,C){ const T=THREE, S=sc.object3D, TL=new T.TextureLoader(), G=new T.Group(); S.add(G); const B='../assets/tex/apt/';
 const ld=(f,srgb,rep)=>{ const t=TL.load(B+f); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; if(rep) t.repeat.set(rep,rep); return t; };
 const X=2.9, ZF=-2.45, ZB=2.65, H=2.5;
 const sm=(a,b,x)=>{ x=Math.min(1,Math.max(0,(x-a)/(b-a))); return x*x*(3-2*x); };
 // ---- Raumschale mit Welt-UVs + Vertex-AO ----
 const bins={}; const add=(mat,g,ao,us)=>{ us=us||1; g=g.index?g.toNonIndexed():g; g.computeVertexNormals(); const p=g.attributes.position, n=g.attributes.normal, uv=new Float32Array(p.count*2), col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i), nx=Math.abs(n.getX(i)), ny=Math.abs(n.getY(i)); let u,v; if(ny>0.6){u=x;v=z;} else if(nx>0.6){u=z;v=y;} else {u=x;v=y;} uv[i*2]=u*us; uv[i*2+1]=v*us; const a=ao?ao(x,y,z):1; col[i*3]=col[i*3+1]=col[i*3+2]=a; }
  g.setAttribute('uv',new T.BufferAttribute(uv,2)); g.setAttribute('color',new T.BufferAttribute(col,3)); (bins[mat]=bins[mat]||[]).push(g); };
 const pl=(w,h,sx,sy)=>new T.PlaneGeometry(w,h,sx,sy);
 const edgeAO=(x,z)=>Math.min(sm(0,0.6,X-Math.abs(x)),sm(0,0.6,ZB-z),sm(0,0.6,z-ZF));
 const aoF=(x,y,z)=>{ let a=0.45+0.55*edgeAO(x,z); const sx=Math.max(0,Math.abs(x)-1.0), sz=Math.max(0,Math.abs(z+1.95)-0.4); a*=0.35+0.65*sm(0,0.35,Math.hypot(sx,sz)); const tx=Math.max(0,Math.hypot(x+1.9,z+0.85)-0.5); a*=0.55+0.45*sm(0,0.4,tx); return a; };
 const aoW=(x,y,z)=>{ let a=(0.5+0.5*sm(0,0.5,y))*(0.55+0.45*sm(0,0.5,H-y)); a*=0.65+0.35*edgeAO(x,z); return a; };
 { const g=pl(2*X,ZB-ZF,24,20); g.rotateX(-Math.PI/2); g.translate(0,0,(ZB+ZF)/2); add('floor',g,aoF,0.7); }
 { const g=pl(2*X,ZB-ZF,12,10); g.rotateX(Math.PI/2); g.translate(0,H,(ZB+ZF)/2); add('ceil',g,(x,y,z)=>0.5+0.5*edgeAO(x,z),0.5); }
 const wz=(x0,x1,y0,y1,z,f)=>{ const g=pl(x1-x0,y1-y0,Math.ceil((x1-x0)*3),Math.ceil((y1-y0)*3)); if(f<0) g.rotateY(Math.PI); g.translate((x0+x1)/2,(y0+y1)/2,z); add('wall',g,aoW,0.5); };
 const wx=(z0,z1,y0,y1,x,f)=>{ const g=pl(z1-z0,y1-y0,Math.ceil((z1-z0)*3),Math.ceil((y1-y0)*3)); g.rotateY(f>0?Math.PI/2:-Math.PI/2); g.translate(x,(y0+y1)/2,(z0+z1)/2); add('wall',g,aoW,0.5); };
 // Stirnwand mit kleinem Fenster über dem Sofa (x -0.45..0.45, y 1.3..1.95)
 wz(-X,-0.45,0,H,ZF,1); wz(0.45,X,0,H,ZF,1); wz(-0.45,0.45,0,1.3,ZF,1); wz(-0.45,0.45,1.95,H,ZF,1);
 wz(-X,X,0,H,ZB,-1); wx(ZF,ZB,0,H,-X,1);
 // rechte Wand mit Fenster (z -1.7..-0.6, y 0.95..1.95)
 wx(ZF,-1.7,0,H,X,-1); wx(-0.6,ZB,0,H,X,-1); wx(-1.7,-0.6,0,0.95,X,-1); wx(-1.7,-0.6,1.95,H,X,-1);
 // Fußleisten
 const base=new T.MeshStandardMaterial({color:0x2a2620,roughness:0.7});
 [[0,ZF+0.01,2*X,0],[0,ZB-0.01,2*X,0],[-X+0.01,(ZF+ZB)/2,ZB-ZF,1],[X-0.01,(ZF+ZB)/2,ZB-ZF,1]].forEach(([x,z,l,r])=>{ const m=new T.Mesh(new T.BoxGeometry(r?0.015:l,0.08,r?l:0.015),base); m.position.set(x,0.04,z); G.add(m); });
 const MAT={ floor:new T.MeshStandardMaterial({map:ld('floor_c.jpg',1),normalMap:ld('floor_n.jpg'),roughnessMap:ld('floor_r.jpg'),roughness:1,vertexColors:true}),
  ceil:new T.MeshStandardMaterial({map:ld('ceil_c.jpg',1),roughness:0.95,vertexColors:true}),
  wall:new T.MeshStandardMaterial({map:ld('wall_c.jpg',1),normalMap:ld('wall_n.jpg'),roughness:0.9,vertexColors:true}) };
 const mergeArr=gs=>{ let n=0; gs.forEach(g=>n+=g.attributes.position.count); const r=new T.BufferGeometry(); ['position','normal','uv','color'].forEach(k=>{ const sz=gs[0].attributes[k].itemSize, a=new Float32Array(n*sz); let o=0; gs.forEach(g=>{ a.set(g.attributes[k].array,o); o+=g.attributes[k].array.length; }); r.setAttribute(k,new T.BufferAttribute(a,sz)); }); return r; };
 Object.entries(bins).forEach(([k,gs])=>{ const m=new T.Mesh(mergeArr(gs),MAT[k]); m.matrixAutoUpdate=false; G.add(m); });
 // ---- Fenster: rechts = Stadt 2041 (Schichten), vorne = Mond ----
 const cv=(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t; };
 const cityT=cv(1024,512,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#03050c'); g.addColorStop(0.6,'#0b1430'); g.addColorStop(1,'#1a1030'); x.fillStyle=g; x.fillRect(0,0,w,h);
  for(let L=0;L<3;L++){ for(let i=0;i<26;i++){ const bw=30+Math.random()*70, bh=h*(0.25+Math.random()*0.5)*(1-L*0.2), bx=Math.random()*w; const sh=8+L*10; x.fillStyle='rgb('+sh+','+(sh+2)+','+(sh+8)+')'; x.fillRect(bx,h-bh,bw,bh);
   for(let k=0;k<bw*bh/220;k++) if(Math.random()<0.3){ x.fillStyle=['rgba(255,190,120,','rgba(120,220,255,','rgba(255,80,200,'][Math.floor(Math.random()*3)]+(0.3+Math.random()*0.5)+')'; x.fillRect(bx+Math.random()*(bw-3),h-bh+Math.random()*bh,2,3); } } }
  const n=x.createLinearGradient(0,h*0.6,0,h); n.addColorStop(0,'rgba(0,0,0,0)'); n.addColorStop(1,'rgba(180,60,200,0.25)'); x.fillStyle=n; x.fillRect(0,0,w,h); });
 const city=new T.Mesh(new T.PlaneGeometry(9,4.5),new T.MeshBasicMaterial({map:cityT,fog:false})); city.position.set(X+3,1.4,-1.15); city.rotation.y=-Math.PI/2; G.add(city);
 const skyT=cv(256,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#0a1630'); g.addColorStop(1,'#18305a'); x.fillStyle=g; x.fillRect(0,0,w,h); const r=x.createRadialGradient(150,90,0,150,90,70); r.addColorStop(0,'rgba(255,250,230,1)'); r.addColorStop(0.28,'rgba(255,250,230,1)'); r.addColorStop(0.32,'rgba(170,200,255,0.35)'); r.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=r; x.fillRect(0,0,w,h); });
 const sky=new T.Mesh(new T.PlaneGeometry(2.2,1.6),new T.MeshBasicMaterial({map:skyT,fog:false})); sky.position.set(0,1.7,ZF-1.2); G.add(sky);
 const frameM=new T.MeshStandardMaterial({color:0x3a3a36,roughness:0.6,metalness:0.3}); const glassM=new T.MeshStandardMaterial({color:0x223040,roughness:0.08,metalness:0,transparent:true,opacity:0.18,depthWrite:false});
 const winFrame=(cx,cy,cz,w,h,rot)=>{ const g=new T.Group(); [[0,h/2,w+0.06,0.05],[0,-h/2,w+0.06,0.05],[-w/2,0,0.05,h],[w/2,0,0.05,h],[0,0,0.03,h]].forEach(([x,y,a,b])=>{ const m=new T.Mesh(new T.BoxGeometry(a,b,0.08),frameM); m.position.set(x,y,0); g.add(m); }); const gl=new T.Mesh(new T.PlaneGeometry(w,h),glassM); g.add(gl); const sill=new T.Mesh(new T.BoxGeometry(w+0.15,0.04,0.2),frameM); sill.position.set(0,-h/2-0.03,0.08); g.add(sill); g.position.set(cx,cy,cz); g.rotation.y=rot; G.add(g); };
 winFrame(0,1.625,ZF+0.01,0.9,0.65,0); winFrame(X-0.01,1.45,-1.15,1.1,1.0,-Math.PI/2);
 // Vorhänge (Falten), links/rechts vom vorderen Fenster und am rechten Fenster
 const curT=ld('curtain_c.jpg',1); const curM=new T.MeshStandardMaterial({map:curT,roughness:0.95,side:T.DoubleSide});
 const curtain=(w,h,folds,amp)=>{ const g=new T.PlaneGeometry(w,h,folds*6,4); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i); const v=(y+h/2)/h; p.setZ(i,Math.sin(x/w*folds*Math.PI*2+rnd()*0.0)*amp*(0.6+0.4*v)+ (1-v)*0.03*Math.sin(x*9)); } g.computeVertexNormals(); return new T.Mesh(g,curM); };
 [[-0.85,0.8],[0.85,0.8]].forEach(([x,w])=>{ const c=curtain(w,1.55,5,0.035); c.position.set(x,1.65,ZF+0.07); G.add(c); });
 [[-1.85,0.45],[-0.45,0.45]].forEach(([z,w])=>{ const c=curtain(w,1.7,3,0.03); c.position.set(X-0.08,1.55,z); c.rotation.y=-Math.PI/2; G.add(c); });
 [[0,ZF+0.09,1.9,0],[X-0.1,-1.15,1.6,1]].forEach(([x,z,l,r])=>{ const rod=new T.Mesh(new T.CylinderGeometry(0.012,0.012,l,8),frameM); rod.rotation[r?'x':'z']=Math.PI/2; rod.position.set(x,2.45,z); G.add(rod); });
 // ---- Decke: Klima-Kästen mit Lamellen, Kabel, tote Glühbirne ----
 const acM=new T.MeshStandardMaterial({color:0x4a4c48,roughness:0.6,metalness:0.4}); const slat=new T.MeshStandardMaterial({color:0x1a1c1a,roughness:0.7});
 [[-2.2,ZF+0.35,0],[2.15,ZB-0.6,0]].forEach(([x,z])=>{ const b=new T.Mesh(new T.BoxGeometry(0.9,0.28,0.55),acM); b.position.set(x,H-0.14,z); G.add(b); for(let i=0;i<9;i++){ const s=new T.Mesh(new T.BoxGeometry(0.8,0.012,0.04),slat); s.position.set(x,H-0.285,z-0.22+i*0.055); s.rotation.x=0.5; G.add(s); } });
 const cabM=new T.MeshStandardMaterial({color:0x0c0c0c,roughness:0.5});
 const cable=(a,b,sag,r)=>{ const m=a.clone().lerp(b,0.5); m.y-=sag; G.add(new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(a,m,b),20,r||0.008,5),cabM)); };
 cable(new T.Vector3(-2.6,H-0.05,ZF+0.3),new T.Vector3(0,H-0.02,0.2),0.35); cable(new T.Vector3(1.8,H-0.1,ZB-0.4),new T.Vector3(-0.4,H-0.02,-0.6),0.5,0.006); cable(new T.Vector3(X-0.05,H-0.2,1.0),new T.Vector3(1.2,H-0.03,1.6),0.25);
 cable(new T.Vector3(X-0.05,0.25,-0.2),new T.Vector3(1.55,0.02,-0.55),0.0,0.007); cable(new T.Vector3(1.55,0.02,-0.55),new T.Vector3(1.5,0.7,-0.7),-0.05,0.007);
 const cord=new T.Mesh(new T.CylinderGeometry(0.004,0.004,0.55,4),cabM); cord.position.set(0,H-0.275,0.1); G.add(cord); const bulb=new T.Mesh(new T.SphereGeometry(0.035,12,8),new T.MeshStandardMaterial({color:0x5a5040,roughness:0.2,transparent:true,opacity:0.8})); bulb.position.set(0,H-0.58,0.1); G.add(bulb);
 // ---- Matratze am Boden, Decke drauf; Koffer im Vordergrund ----
 function rbox(w,h,d,r,puff,seg,lump){ const g=new T.BoxGeometry(w,h,d,seg,seg,seg); const p=g.attributes.position, nn=g.attributes.normal; const hx=w/2-r,hy=h/2-r,hz=d/2-r;
  for(let i=0;i<p.count;i++){ let x=p.getX(i),y=p.getY(i),z=p.getZ(i); const cx=Math.max(-hx,Math.min(hx,x)), cy=Math.max(-hy,Math.min(hy,y)), cz=Math.max(-hz,Math.min(hz,z)); let dx=x-cx,dy=y-cy,dz=z-cz; let l=Math.hypot(dx,dy,dz); if(l<1e-6){ dx=nn.getX(i); dy=nn.getY(i); dz=nn.getZ(i); l=1; } dx/=l; dy/=l; dz/=l; x=cx+dx*r; y=cy+dy*r; z=cz+dz*r;
   const ax=Math.min(1,Math.abs(x)/(w/2)), ay=Math.min(1,Math.abs(y)/(h/2)), az=Math.min(1,Math.abs(z)/(d/2)); const pf=puff||0;
   x+=Math.sign(x)*pf*(1-ay*ay)*(1-az*az)*Math.abs(dx); y+=Math.sign(y)*pf*(1-ax*ax)*(1-az*az)*Math.abs(dy); z+=Math.sign(z)*pf*(1-ax*ax)*(1-ay*ay)*Math.abs(dz);
   if(lump){ const s=lump*(Math.sin(x*23+y*7)*Math.sin(z*19-y*11)+0.5*Math.sin(x*41+z*37)); x+=dx*s; y+=dy*s; z+=dz*s; }
   p.setXYZ(i,x,y,z); nn.setXYZ(i,dx,dy,dz); }
  const uv=g.attributes.uv; for(let i=0;i<p.count;i++){ const ax=Math.abs(nn.getX(i)), ay=Math.abs(nn.getY(i)); let u,v; if(ay>=ax&&ay>=Math.abs(nn.getZ(i))){u=p.getX(i);v=p.getZ(i);} else if(ax>=Math.abs(nn.getZ(i))){u=p.getZ(i);v=p.getY(i);} else {u=p.getX(i);v=p.getY(i);} uv.setXY(i,u/0.55,v/0.55); }
  return g; }
 const matT=cv(256,256,(x,w,h)=>{ x.fillStyle='#8a8478'; x.fillRect(0,0,w,h); x.strokeStyle='rgba(60,70,90,0.35)'; x.lineWidth=3; for(let i=0;i<w;i+=32){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,h); x.stroke(); } for(let i=0;i<14;i++){ const g=x.createRadialGradient(Math.random()*w,Math.random()*h,0,Math.random()*w,Math.random()*h,30+Math.random()*60); g.addColorStop(0,'rgba(110,80,30,0.35)'); g.addColorStop(1,'rgba(110,80,30,0)'); x.fillStyle=g; x.fillRect(0,0,w,h); } }); matT.wrapS=matT.wrapT=T.RepeatWrapping;
 const mat=new T.Mesh(rbox(0.9,0.16,1.95,0.05,0.015,8,0.003),new T.MeshStandardMaterial({map:matT,roughness:0.95})); mat.position.set(-X+0.5,0.08,1.4); mat.rotation.y=0.04; G.add(mat);
 const blanket=new T.Mesh((()=>{ const g=new T.PlaneGeometry(1.0,1.2,20,24); g.rotateX(-Math.PI/2); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i); p.setY(i,0.03+0.04*Math.sin(x*9+z*4)*Math.sin(z*7)+0.05*Math.max(0,Math.sin(z*3.2))+(Math.abs(x)>0.42?-0.1*(Math.abs(x)-0.42)*8:0)); } g.computeVertexNormals(); return g; })(),new T.MeshStandardMaterial({map:ld('sofa_c.jpg',1),color:0x6a8098,roughness:0.95,side:T.DoubleSide}));
 blanket.position.set(-X+0.5,0.16,1.75); G.add(blanket);
 const leather=new T.MeshStandardMaterial({color:0x4a3220,roughness:0.55,normalMap:ld('floor_n.jpg'),normalScale:new T.Vector2(0.2,0.2)}); const leather2=new T.MeshStandardMaterial({color:0x2e3a30,roughness:0.6}); const strapM=new T.MeshStandardMaterial({color:0x6a5236,roughness:0.7}); const brass=new T.MeshStandardMaterial({color:0x8a7040,metalness:0.9,roughness:0.35});
 const suitcase=(w,h,d,m)=>{ const g=new T.Group(); g.add(new T.Mesh(rbox(w,h,d,0.03,0.006,4,0.001),m)); [-w*0.3,w*0.3].forEach(o=>{ const s=new T.Mesh(new T.BoxGeometry(0.035,h+0.008,d+0.008),strapM); s.position.x=o; g.add(s); const bk=new T.Mesh(new T.BoxGeometry(0.045,0.03,0.012),brass); bk.position.set(o,0,d/2+0.006); g.add(bk); });
  const hd=new T.Mesh(new T.TorusGeometry(0.05,0.011,6,12,Math.PI),strapM); hd.position.set(0,h/2,0); g.add(hd); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{ const c=new T.Mesh(new T.SphereGeometry(0.022,6,4),brass); c.position.set(a*(w/2-0.01),h/2-0.01,b*(d/2-0.01)); g.add(c); }); return g; };
 const s1=suitcase(0.68,0.2,0.46,leather); s1.position.set(-0.75,0.1,0.65); s1.rotation.y=0.3; G.add(s1);
 const s2=suitcase(0.55,0.17,0.38,leather2); s2.position.set(-0.72,0.29,0.62); s2.rotation.y=-0.15; G.add(s2);
 const s3=suitcase(0.5,0.2,0.36,leather); s3.rotation.z=Math.PI/2; s3.position.set(-1.15,0.25,0.95); s3.rotation.y=0.8; G.add(s3);
 // Sterbende Stehlampe, umgekippt am Boden neben der Matratze (warm, schwach, flackert)
 const lampG=new T.Group(); lampG.position.set(-1.55,0,2.15); lampG.rotation.y=0.6; G.add(lampG);
 const pole=new T.Mesh(new T.CylinderGeometry(0.012,0.012,1.35,8),frameM); pole.rotation.z=Math.PI/2-0.06; pole.position.set(0.55,0.05,0); lampG.add(pole);
 const foot=new T.Mesh(new T.CylinderGeometry(0.13,0.15,0.03,20),frameM); foot.rotation.z=Math.PI/2-0.06; foot.position.set(1.22,0.12,0); lampG.add(foot);
 const shadeM=new T.MeshStandardMaterial({color:0xa08860,roughness:0.9,side:T.DoubleSide,emissive:0x40200a,emissiveIntensity:0.6}); const shade=new T.Mesh(new T.CylinderGeometry(0.12,0.2,0.24,20,1,true),shadeM); shade.rotation.z=Math.PI/2+0.25; shade.position.set(-0.17,0.17,0); lampG.add(shade);
 const lbulb=new T.Mesh(new T.SphereGeometry(0.03,10,8),new T.MeshBasicMaterial({color:0xffb060,toneMapped:false})); lbulb.position.set(-0.12,0.16,0); lampG.add(lbulb);
 const lampL=new T.PointLight(0xff9a48,0.9,2.6,2); lampL.position.set(-1.7,0.25,2.05); G.add(lampL); let lampOn=1;
 // ---- DAS SOFA ----
 const sofa=new T.Group(); sofa.position.set(0,0,-1.97); G.add(sofa); const SB={x:0,z:-1.97};
 const fab=new T.MeshStandardMaterial({map:ld('sofa_c.jpg',1),normalMap:ld('sofa_n.jpg'),normalScale:new T.Vector2(0.6,0.6),roughness:0.93});
 const fabD=fab.clone(); fabD.color=new T.Color(0x9a9090);
 const wood=new T.MeshStandardMaterial({color:0x2a1a10,roughness:0.5});
 const flesh=new T.MeshStandardMaterial({map:ld('flesh_c.jpg',1),roughness:0.22,metalness:0.05,color:0x6e4a48,emissive:0x1a0204,emissiveIntensity:0.2,side:T.DoubleSide});
 const M=(g,m,x,y,z)=>{ const o=new T.Mesh(g,m); o.position.set(x,y,z); return o; };
 [[-0.92,-0.34],[0.92,-0.34],[-0.92,0.34],[0.92,0.34]].forEach(([x,z])=>{ const f=M(new T.CylinderGeometry(0.03,0.018,0.07,10),wood,x,0.035,z); sofa.add(f); });
 sofa.add(M(rbox(2.0,0.28,0.86,0.05,0.012,8,0.002),fabD,0,0.21,0));
 [-1,1].forEach(s=>{ sofa.add(M(rbox(0.26,0.38,0.9,0.07,0.015,8,0.002),fabD,s*0.97,0.5,0)); const roll=M(rbox(0.32,0.2,0.94,0.095,0.02,10,0.003),fab,s*0.99,0.69,0.0); roll.rotation.z=-s*0.08; sofa.add(roll); });
 sofa.add(M(rbox(1.72,0.62,0.22,0.07,0.012,8,0.002),fabD,0,0.66,-0.34));
 // Rachen (in der Fuge versteckt)
 // Zahn-Geometrie: gebogener Kegel, Wurzel dunkel → Spitze elfenbein
 const toothG=(()=>{ const g=new T.ConeGeometry(0.022,0.105,7,3); g.translate(0,0.0525,0); const p=g.attributes.position, col=new Float32Array(p.count*3); for(let i=0;i<p.count;i++){ const y=p.getY(i)/0.105; p.setZ(i,p.getZ(i)+y*y*0.018); const c=0.35+0.65*Math.min(1,y*2.2); col[i*3]=c*0.93; col[i*3+1]=c*0.86; col[i*3+2]=c*0.7; } g.setAttribute('color',new T.BufferAttribute(col,3)); g.computeVertexNormals(); return g; })();
 const toothM=new T.MeshStandardMaterial({vertexColors:true,color:0xf2ead0,roughness:0.35});
 const teeth=(n,y,z,down,curve)=>{ const im=new T.InstancedMesh(toothG,toothM,n); const m4=new T.Matrix4(), q=new T.Quaternion(), e=new T.Euler(), s=new T.Vector3(), p=new T.Vector3(); for(let i=0;i<n;i++){ const u=(i+0.5)/n*2-1; const x=u*0.8; const k=0.6+0.7*rnd()*(1-0.4*Math.abs(u)); e.set(down?Math.PI+0.15:-0.15,(rnd()-0.5)*0.4,(rnd()-0.5)*0.25); q.setFromEuler(e); s.set(k,k*(0.8+rnd()*0.6),k); p.set(x,y,z+curve*(1-u*u)); m4.compose(p,q,s); im.setMatrixAt(i,m4); } return im; };
 // Oberkiefer = Rückenkissen (Pivot oben hinten)
 const up=new T.Group(); up.position.set(0,1.0,-0.3); sofa.add(up); const UP=(o,x,y,z)=>{ o.position.set(x,y-1.0,z+0.3); up.add(o); return o; };
 [-1,1].forEach(s=>{ const c=UP(new T.Mesh(rbox(0.83,0.5,0.24,0.1,0.035,10,0.004),fab),s*0.42,0.76,-0.13); c.rotation.x=-0.12; c.rotation.z=s*0.02; });
 const lipG=(y,z,curve,r,amp,ph)=>{ const pts=[]; for(let i=0;i<=24;i++){ const u=i/24*2-1; pts.push(new T.Vector3(u*0.82,y+amp*Math.sin(u*11+ph)+amp*0.6*Math.sin(u*23),z+curve*(1-u*u))); } return new T.TubeGeometry(new T.CatmullRomCurve3(pts),60,r,8); };
 up.add(Object.assign(new T.Mesh(lipG(0.545-1.0,-0.02+0.3,0.03,0.038,0.01,0),fab)));
 up.add(new T.Mesh(lipG(0.52-1.0,-0.055+0.3,0.03,0.026,0.008,1),flesh));
 const tU=teeth(34,0.525,-0.06,true,0.03); tU.position.set(0,-1.0,0.3); up.add(tU);
 // Unterkiefer = Sitzkissen (Pivot vorne)
 const lo=new T.Group(); lo.position.set(0,0.38,0.41); sofa.add(lo); const LO=(o,x,y,z)=>{ o.position.set(x,y-0.38,z-0.41); lo.add(o); return o; };
 [-1,1].forEach(s=>{ const c=LO(new T.Mesh(rbox(0.83,0.15,0.66,0.06,0.028,10,0.004),fab),s*0.42,0.425,0.08); c.rotation.z=s*0.015; });
 lo.add(new T.Mesh(lipG(0.475-0.38,-0.22-0.41,0.02,0.026,0.008,2),flesh)); lo.add(new T.Mesh(lipG(0.49-0.38,-0.2-0.41,0.02,0.032,0.01,3),fab));
 let mawM=null;
 const tongueM=new T.MeshStandardMaterial({map:ld('flesh_c.jpg',1),color:0x7a4a4a,roughness:0.18,metalness:0.05});
 // Rachen: vertiefter Schlund (Tunnel nach hinten/unten), Gaumen mit Querrippen, wird zum Ende hin schwarz
 const throatG=(()=>{ const R=12, Sg=36, pos=[], col=[], idx=[]; for(let r=0;r<=R;r++){ const k=r/R; const cx=0, cy=0.5-0.13*k, cz=-0.03-0.38*k; const rx=0.76*(1-k)+0.16*k, ry=0.18*(1-k)+0.05*k;
   for(let j=0;j<=Sg;j++){ const a=j/Sg*Math.PI*2; const up=Math.max(0,Math.sin(a)); let f=1-0.09*up*(0.5+0.5*Math.cos(k*Math.PI*2*6)); f*=1+0.04*Math.sin(a*7+k*9); pos.push(cx+Math.cos(a)*rx*f, cy+Math.sin(a)*ry*f, cz); const rid=up>0.2?0.6+0.4*Math.max(0,Math.cos(k*Math.PI*2*6)):0.85; const c=Math.pow(1-k,2.2)*(0.45+0.35*up)*rid; col.push(c,c*0.9,c*0.9); } }
  for(let r=0;r<R;r++) for(let j=0;j<Sg;j++){ const a=r*(Sg+1)+j, b=a+Sg+1; idx.push(a,a+1,b, a+1,b+1,b); }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('color',new T.Float32BufferAttribute(col,3)); g.setIndex(idx); g.computeVertexNormals(); return g; })();
 const throatM=new T.MeshBasicMaterial({map:ld('flesh_c.jpg',1),color:0x6a4442,vertexColors:true,side:T.DoubleSide});
 const throat=new T.Mesh(throatG,throatM); sofa.add(throat);
 const endcap=new T.Mesh(new T.CircleGeometry(0.2,16),new T.MeshBasicMaterial({color:0x000000})); endcap.scale.y=0.35; endcap.position.set(0,0.37,-0.4); sofa.add(endcap);
 // Speichelfäden zwischen Ober- und Unterkiefer (2 Segmente mit Durchhang), nur offen sichtbar
 const salM=new T.MeshStandardMaterial({color:0xe8e2d8,roughness:0.03,metalness:0.1,transparent:true,opacity:0.75,depthWrite:false,emissive:0x202020});
 const segG=new T.CylinderGeometry(1,1,1,5,1,true); const strands=[]; for(let i=0;i<9;i++){ const x=-0.66+i*0.165+(rnd()-0.5)*0.06; const a=new T.Object3D(), b=new T.Object3D(); a.position.set(x,0.52-1.0,-0.05+0.3); up.add(a); b.position.set(x*0.98,0.49-0.38,-0.2-0.41); lo.add(b); const r=0.003+rnd()*0.003, sag=0.03+rnd()*0.06; const sg=[]; for(let k=0;k<5;k++){ const m=new T.Mesh(segG,salM); m.visible=false; sofa.add(m); sg.push(m); } strands.push({a,b,r,sag,sg}); }
 const va=new T.Vector3(), vb=new T.Vector3(), vm=new T.Vector3(), Y=new T.Vector3(0,1,0);
 const seg=(m,p,q,r)=>{ const d=q.clone().sub(p); const L=d.length(); m.position.copy(p).addScaledVector(d,0.5); m.quaternion.setFromUnitVectors(Y,d.normalize()); m.scale.set(r,L,r); };
 const P0=new T.Vector3(), P1=new T.Vector3(); const pt=(o,t,out)=>{ out.copy(va).lerp(vb,t); out.y-=o.sag*open*4*t*(1-t); out.z+=0.03*4*t*(1-t); return out; };
 const strandUpd=()=>{ const vis=open>0.25; sofa.updateMatrixWorld(); strands.forEach(o=>{ o.sg.forEach(m=>m.visible=vis); if(!vis) return; o.a.getWorldPosition(va); o.b.getWorldPosition(vb); sofa.worldToLocal(va); sofa.worldToLocal(vb); for(let k=0;k<5;k++){ pt(o,k/5,P0); pt(o,(k+1)/5,P1); const th=1-0.55*Math.sin((k+0.5)/5*Math.PI); seg(o.sg[k],P0,P1,o.r*th); } }); };


 const tongue=LO(new T.Mesh((()=>{ const g=new T.SphereGeometry(1,28,14); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i); let yy=y; if(y>0) yy=y*(1-0.55*Math.exp(-x*x*18)); yy+= 0.15*Math.sin(x*7+z*5)*Math.max(0,y); p.setXYZ(i,x*(1-0.25*Math.max(0,z)),yy,z); } g.computeVertexNormals(); return g; })(),tongueM),0,0.41,-0.2); tongue.scale.set(0.3,0.06,0.2); tongue.rotation.x=0.15;
 const tL=teeth(30,0.495,-0.15,false,0.025); tL.position.set(0,-0.38,-0.41); tL.scale.set(1,1.2,1); lo.add(tL);
 // grüner Schein unter dem Sofa
 const gc=cv(128,128,x=>{ const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); });
 const glow=new T.Mesh(new T.PlaneGeometry(2.2,1.0),new T.MeshBasicMaterial({map:gc,color:0x3aa860,transparent:true,opacity:0.35,blending:T.AdditiveBlending,depthWrite:false})); glow.rotation.x=-Math.PI/2; glow.position.set(0,0.004,-1.75); G.add(glow);
 const gL=new T.PointLight(0x50ff80,0.7,1.1,2); gL.position.set(0,0.02,-1.45); G.add(gL);
 // Mondlicht durchs rechte Fenster auf das Sofa + weicher Dunst-Schacht
 const spot=new T.SpotLight(0xb4c4e4,11,7,0.66,0.9,1.4); spot.position.set(X-0.1,1.75,-1.15); spot.target.position.set(-0.2,0.5,-1.95); G.add(spot); G.add(spot.target);
 const shaftT=cv(64,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(255,255,255,0.9)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,w,h); const s=x.createLinearGradient(0,0,w,0); s.addColorStop(0,'rgba(0,0,0,1)'); s.addColorStop(0.5,'rgba(0,0,0,0)'); s.addColorStop(1,'rgba(0,0,0,1)'); x.globalCompositeOperation='destination-out'; x.fillStyle=s; x.fillRect(0,0,w,h); });
 const shaft=new T.Mesh(new T.CylinderGeometry(0.45,1.2,3.0,16,1,true),new T.MeshBasicMaterial({map:shaftT,color:0x5a80c0,transparent:true,opacity:0.07,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));
 { const a=spot.position.clone(), b=spot.target.position.clone(), d=b.clone().sub(a); shaft.position.copy(a.clone().addScaledVector(d,0.5)); shaft.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),d.normalize()); } G.add(shaft);
 // TV-Flimmern
 const tvL=new T.PointLight(0x9ab8ff,0.9,3.5,2); tvL.position.set(1.3,1.0,-0.45); G.add(tvL);
 S.add(new T.HemisphereLight(0x2a2a34,0x0a0806,0.7));
 // ---- Klick-Ziel (Laser/Maus) ----
 const hit=document.createElement('a-entity'); hit.setAttribute('geometry','primitive:box;width:2.1;height:1.0;depth:0.95'); hit.setAttribute('material','visible:false'); hit.setAttribute('position','0 0.5 -1.97'); hit.classList.add('clickable'); sc.appendChild(hit);
 // ---- Ton: Knurren + Zuschnappen (räumlich am Sofa) ----
 let ac=null, out=null; const audio=()=>{ if(ac) return; ac=new (window.AudioContext||window.webkitAudioContext)(); out=ac.createPanner(); out.panningModel='HRTF'; out.refDistance=1.2; out.positionX.value=0; out.positionY.value=0.6; out.positionZ.value=-1.8; out.connect(ac.destination); };
 ['click','keydown','touchstart'].forEach(e=>window.addEventListener(e,audio,{once:true})); sc.addEventListener('enter-vr',audio);
 const noiseBuf=()=>{ const b=ac.createBuffer(1,ac.sampleRate*1.5,ac.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b; };
 const growl=()=>{ if(!ac) return; const t=ac.currentTime; const ws=ac.createWaveShaper(); const cu=new Float32Array(256); for(let i=0;i<256;i++){ const x=i/128-1; cu[i]=Math.tanh(x*4); } ws.curve=cu;
  const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(62,t); o.frequency.linearRampToValueAtTime(88,t+0.15); o.frequency.linearRampToValueAtTime(48,t+0.7);
  const am=ac.createOscillator(), ag=ac.createGain(); am.frequency.value=27; ag.gain.value=0.6; am.connect(ag); const g=ac.createGain(); ag.connect(g.gain);
  const n=ac.createBufferSource(); n.buffer=noiseBuf(); const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=380; bp.Q.value=1.2; const ng=ac.createGain(); ng.gain.value=0.5; n.connect(bp).connect(ng).connect(ws);
  const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1100; const env=ac.createGain(); env.gain.setValueAtTime(0.0001,t); env.gain.exponentialRampToValueAtTime(0.9,t+0.04); env.gain.setValueAtTime(0.9,t+0.35); env.gain.exponentialRampToValueAtTime(0.0001,t+1.0);
  o.connect(g).connect(ws); ws.connect(lp).connect(env).connect(out); o.start(t); am.start(t); n.start(t); o.stop(t+1.05); am.stop(t+1.05); n.stop(t+1.05); };
 const snap=()=>{ if(!ac) return; const t=ac.currentTime; const n=ac.createBufferSource(); n.buffer=noiseBuf(); const hp=ac.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1800; const g=ac.createGain(); g.gain.setValueAtTime(0.9,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.06); n.connect(hp).connect(g).connect(out); n.start(t); n.stop(t+0.08);
  const o=ac.createOscillator(); o.frequency.setValueAtTime(110,t); o.frequency.exponentialRampToValueAtTime(38,t+0.12); const g2=ac.createGain(); g2.gain.setValueAtTime(1.0,t); g2.gain.exponentialRampToValueAtTime(0.0001,t+0.18); o.connect(g2).connect(out); o.start(t); o.stop(t+0.2); };
 const creak=()=>{ if(!ac) return; const t=ac.currentTime; const o=ac.createOscillator(); o.type='triangle'; o.frequency.setValueAtTime(140,t); o.frequency.linearRampToValueAtTime(95,t+0.25); const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.12,t+0.05); g.gain.exponentialRampToValueAtTime(0.0001,t+0.3); o.connect(g).connect(out); o.start(t); o.stop(t+0.32); };
 // ---- Zustände ----
 let open=0, lunge=0, fired=false, t0=-1, twitchAt=8000+rnd()*6000, twitchT=-1, forced=null;
 const ease=x=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3);
 const pose=()=>{ up.rotation.x=-0.42*open; up.position.y=1.0+0.26*open; up.position.z=-0.3+0.04*open; lo.rotation.x=-0.28*open; flesh.emissiveIntensity=0.1+0.2*open; tongue.position.y=0.41-0.38+0.05*open; sofa.position.z=SB.z+0.3*lunge; sofa.position.y=0.03*lunge; sofa.rotation.x=0.05*lunge; glow.material.opacity=0.35+0.25*open; gL.intensity=0.7-0.3*open; strandUpd(); };
 const fire=()=>{ if(fired) return; fired=true; t0=performance.now(); growl(); window.__sofaFired=true; };
 hit.addEventListener('click',fire);
 const cam=()=>document.getElementById('cam').object3D, cp=new T.Vector3();
 const update=(t)=>{ const now=performance.now();
  if(forced){ open=forced[0]; lunge=forced[1]; pose(); return; }
  if(!fired){ cam().getWorldPosition(cp); const dx=Math.max(0,Math.abs(cp.x-SB.x)-1.05), dz=Math.max(0,Math.abs(cp.z-SB.z)-0.47); if(Math.hypot(dx,dz)<1.0) fire(); }
  if(t0>=0){ const e=(now-t0)/1000; if(e<0.14) open=ease(e/0.14); else if(e<0.42) open=1-0.05*Math.sin((e-0.14)*40); else if(e<0.52){ open=1-ease((e-0.42)/0.1); if(!fire.snapped){ fire.snapped=true; snap(); } } else open=0;
   lunge = e<0.22 ? ease(e/0.22) : e<0.55 ? 1 : 1-ease((e-0.55)/1.6); if(e>2.3){ t0=-1; lunge=0; open=0; } pose(); return; }
  // Leerlauf: seltenes Zucken (Fuge öffnet sich minimal, knarzt)
  if(!fired&&t>twitchAt){ twitchT=t; twitchAt=t+7000+rnd()*9000; creak(); } if(twitchT>0){ const k=(t-twitchT)/1000; open=k<0.35?0.07*Math.sin(k/0.35*Math.PI):0; if(k>0.4) twitchT=-1; pose(); }
  tvL.intensity=0.7+0.35*Math.random(); if(Math.random()<0.03) lampOn=Math.random()<0.25?0.15:1; lampL.intensity=0.9*lampOn*(0.85+0.15*Math.random()); lbulb.material.color.setHex(lampOn>0.5?0xffb060:0x402810); };
 AFRAME.registerComponent('apt-tick',{tick(t){ update(t); }}); sc.setAttribute('apt-tick','');
 window.__sofa={ fire, set:(o,l)=>{ forced=[o,l]; }, release:()=>{ forced=null; open=0; lunge=0; pose(); } };
 // ---- Kollision (Spieler-Kopf, Radius 0.25) ----
 const boxes=[[-1.15,1.15,-2.45,-1.45],[-2.4,-1.45,-1.45,-0.3],[1.2,1.7,-1.0,-0.5],[-1.15,-0.4,0.35,1.25]];
 const collide=(x,z)=>{ let px=0,pz=0; boxes.forEach(([x0,x1,z0,z1])=>{ const r=0.25; if(x>x0-r&&x<x1+r&&z>z0-r&&z<z1+r){ const o=[x-(x0-r),(x1+r)-x,z-(z0-r),(z1+r)-z]; const m=Math.min(...o); if(m===o[0]) px-=o[0]; else if(m===o[1]) px+=o[1]; else if(m===o[2]) pz-=o[2]; else pz+=o[3]; } }); return (px||pz)?[px,pz]:null; };
 return {sofa,update,collide};
};
})();
