/* Giß-Moe Kleiderschrank (selbst gebaute 3D-Teile) + Wimmelbild "Finde Giß-Moe". */
(function(){
let K, THREE; const W={};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const std=(c,o)=>new THREE.MeshPhysicalMaterial(Object.assign({color:c,roughness:0.45,clearcoat:0.4},o||{}));
/* ---------- Teile ---------- */
function tex(draw,w,h){ const c=document.createElement('canvas'); c.width=w||256; c.height=h||64; draw(c.getContext('2d'),c.width,c.height); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=THREE.RepeatWrapping; return t; }
const ITEMS={
 hat:[
  {id:'zylinder',e:'🎩',n:'Zylinder',make(){ const g=new THREE.Group(), m=std(0x232026,{roughness:0.35}), band=std(0xb3263a);
    const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.016,40),m); const top=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.125,0.2,40),m); top.position.y=0.105; const b=new THREE.Mesh(new THREE.CylinderGeometry(0.127,0.127,0.04,40),band); b.position.y=0.03; g.add(brim,top,b); return g; }},
  {id:'krone',e:'👑',n:'Krone',make(){ const g=new THREE.Group(), gold=std(0xf2c14e,{metalness:0.85,roughness:0.25}); const ring=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.14,0.07,32,1,true),gold); ring.material.side=THREE.DoubleSide; g.add(ring);
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2, s=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.08,12),gold); s.position.set(Math.sin(a)*0.13,0.07,Math.cos(a)*0.13); g.add(s);
     const j=new THREE.Mesh(new THREE.SphereGeometry(0.016,12,8),std([0xe23b5a,0x3b8be2,0x4bc46b][i%3],{roughness:0.1,clearcoat:1})); j.position.set(Math.sin(a)*0.141,0,Math.cos(a)*0.141); g.add(j); } return g; }},
  {id:'party',e:'🥳',n:'Partyhut',make(){ const g=new THREE.Group(); const t=tex((x,w,h)=>{ const cs=['#ff6b8a','#ffd166','#5ec8ff','#7ddc6f']; for(let i=0;i<8;i++){ x.fillStyle=cs[i%4]; x.fillRect(i*w/8,0,w/8+1,h); } x.fillStyle='#fff'; for(let i=0;i<14;i++){ x.beginPath(); x.arc(Math.random()*w,Math.random()*h,4,0,7); x.fill(); } });
    const c=new THREE.Mesh(new THREE.ConeGeometry(0.11,0.28,40,1,true),std(0xffffff,{map:t,side:THREE.DoubleSide})); c.position.y=0.14; const p=new THREE.Mesh(new THREE.SphereGeometry(0.035,16,12),std(0xffe16b,{roughness:0.9,clearcoat:0})); p.position.y=0.29; g.add(c,p); g.rotation.z=-0.15; return g; }},
  {id:'muetze',e:'🧶',n:'Bommelmütze',make(){ const g=new THREE.Group(); const t=tex((x,w,h)=>{ x.fillStyle='#3f8fd8'; x.fillRect(0,0,w,h); x.fillStyle='#fff'; x.fillRect(0,h*0.15,w,h*0.12); x.fillRect(0,h*0.55,w,h*0.12); },64,64);
    const d=new THREE.Mesh(new THREE.SphereGeometry(0.16,32,16,0,Math.PI*2,0,Math.PI/2),std(0xffffff,{map:t,roughness:0.9,clearcoat:0})); d.scale.y=0.9; const r=new THREE.Mesh(new THREE.TorusGeometry(0.155,0.03,12,40),std(0xffffff,{roughness:0.95,clearcoat:0})); r.rotation.x=Math.PI/2;
    const p=new THREE.Mesh(new THREE.SphereGeometry(0.055,16,12),std(0xffffff,{roughness:1,clearcoat:0})); p.position.y=0.16; g.add(d,r,p); return g; }},
  {id:'zauber',e:'🧙',n:'Zauberhut',make(){ const g=new THREE.Group(), m=std(0x4b3aa8,{roughness:0.6}); const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.014,40),m); const c=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.34,40),m); c.position.y=0.17; c.rotation.x=-0.12;
    g.add(brim,c); const star=std(0xffd84a,{metalness:0.6,roughness:0.3,emissive:0x664400}); for(let i=0;i<5;i++){ const s=new THREE.Mesh(new THREE.OctahedronGeometry(0.018),star); const a=i*1.3; s.position.set(Math.sin(a)*0.085*(1-i*0.15),0.05+i*0.055,Math.cos(a)*0.085*(1-i*0.15)+0.01); g.add(s); } return g; }},
  {id:'schleife',e:'🎀',n:'Haarschleife',make(){ const g=new THREE.Group(), m=std(0xff6fa8,{roughness:0.35,clearcoat:1}); [-1,1].forEach(s=>{ const l=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.11,4),m); l.rotation.z=s*Math.PI/2; l.position.x=s*0.055; l.scale.z=0.45; g.add(l); }); const k=new THREE.Mesh(new THREE.SphereGeometry(0.025,12,8),m); g.add(k); g.position.set(0.12,0.02,0.02); g.rotation.z=-0.4; return g; }}],
 glasses:[
  {id:'sonne',e:'🕶️',n:'Sonnenbrille',make(){ return specs(0x111111,0x1a1a22,0.85,'round'); }},
  {id:'herz',e:'😍',n:'Herzbrille',make(){ return specs(0xff4f86,0xff7aa6,0.55,'heart'); }},
  {id:'nerd',e:'🤓',n:'Runde Brille',make(){ return specs(0xb0802a,0xdff1ff,0.12,'ring'); }}],
 neck:[
  {id:'fliege',e:'🎗️',n:'Fliege',make(){ const g=new THREE.Group(), m=std(0xd2283c,{roughness:0.3,clearcoat:1}); [-1,1].forEach(s=>{ const l=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.09,4),m); l.rotation.z=s*Math.PI/2; l.position.x=s*0.045; l.scale.z=0.4; g.add(l); }); g.add(new THREE.Mesh(new THREE.SphereGeometry(0.02,12,8),m)); return g; }},
  {id:'schal',e:'🧣',n:'Schal',make(){ const g=new THREE.Group(); const t=tex((x,w,h)=>{ for(let i=0;i<12;i++){ x.fillStyle=i%2?'#f6f1e7':'#e2473b'; x.fillRect(i*w/12,0,w/12+1,h); } });
    const r=new THREE.Mesh(new THREE.TorusGeometry(0.29,0.05,14,48),std(0xffffff,{map:t,roughness:0.95,clearcoat:0})); r.rotation.x=Math.PI/2+0.25; r.scale.set(1,1.05,1); const e=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.16,0.03),std(0xffffff,{map:t,roughness:0.95,clearcoat:0})); e.position.set(0.11,-0.1,0.29); e.rotation.z=0.15; g.add(r,e); g.position.z=-0.06; return g; }},
  {id:'glocke',e:'🔔',n:'Glöckchen',make(){ const g=new THREE.Group(); const r=new THREE.Mesh(new THREE.TorusGeometry(0.2,0.016,10,48),std(0x3fa86a,{roughness:0.5})); r.rotation.x=Math.PI/2+0.25; r.position.z=-0.07;
    const b=new THREE.Mesh(new THREE.SphereGeometry(0.035,16,12),std(0xf2c14e,{metalness:0.9,roughness:0.2})); b.position.set(0,-0.04,0.04); g.add(r,b); return g; }}]};
function specs(frame,lens,op,shape){ const g=new THREE.Group(), fm=std(frame,{roughness:0.3,clearcoat:1}), lm=new THREE.MeshPhysicalMaterial({color:lens,transparent:true,opacity:op,roughness:0.05,clearcoat:1});
 const E=K.G.LM.eyeL, dx=Math.abs(E[0])*1.06;
 [-1,1].forEach(s=>{ let lensG;
  if(shape==='heart'){ const h=new THREE.Shape(); h.moveTo(0,-0.05); h.bezierCurveTo(-0.09,0.0,-0.05,0.07,0,0.03); h.bezierCurveTo(0.05,0.07,0.09,0.0,0,-0.05); lensG=new THREE.ShapeGeometry(h,16); }
  else lensG=new THREE.CircleGeometry(0.068,32);
  const l=new THREE.Mesh(lensG,lm); l.position.set(s*dx,0,0.004); g.add(l);
  if(shape!=='heart'){ const f=new THREE.Mesh(new THREE.TorusGeometry(0.07,shape==='ring'?0.007:0.011,10,40),fm); f.position.set(s*dx,0,0.006); g.add(f); }
  else { const f=new THREE.Mesh(new THREE.ShapeGeometry((()=>{ const h=new THREE.Shape(); h.moveTo(0,-0.058); h.bezierCurveTo(-0.104,0.0,-0.058,0.082,0,0.036); h.bezierCurveTo(0.058,0.082,0.104,0.0,0,-0.058); return h; })(),16),fm); f.position.set(s*dx,0,0.001); g.add(f); }
  const arm=new THREE.Mesh(new THREE.BoxGeometry(0.01,0.01,0.16),fm); arm.position.set(s*(dx+0.07),0.01,-0.08); g.add(arm); });
 const br=new THREE.Mesh(new THREE.TorusGeometry(0.03,0.007,8,16,Math.PI),fm); br.position.set(0,0.005,0.008); g.add(br); return g; }
const SLOTS={hat:{n:'Hüte',parent:'head',pos:()=>[0.0,0.955,0.06],rot:[-0.16,0,0],sc:1.5},glasses:{n:'Brillen',parent:'head',pos:()=>{ const E=K.G.LM.eyeL; return [0.0034,E[1]+0.012,E[2]+0.12]; },rot:[0,0,0],sc:1.5},neck:{n:'Hals',parent:'root',pos:()=>[0.0034,0.5,0.09],rot:[0,0,0]}};
/* ---------- v3: Körper-Kleidung (passt sich der Fell-Form an) ---------- */
let PROF=null; const PY=30, PT=36, PY0=0.0, PY1=0.58;
function prof(){ if(PROF) return PROF; const P=K.G.geo.attributes.position.array, a=new Float32Array(PY*PT);
 for(let i=0;i<P.length;i+=3){ const x=P[i],y=P[i+1],z=P[i+2]; if(y<PY0||y>PY1) continue; if(y<0.1&&z>0.1) continue;
  const yi=Math.min(PY-1,Math.floor((y-PY0)/(PY1-PY0)*PY)); let th=Math.atan2(x,z); const ti=((Math.round(th/(Math.PI*2)*PT))%PT+PT)%PT; const r=Math.hypot(x,z); if(r>a[yi*PT+ti]) a[yi*PT+ti]=r; }
 for(let it=0;it<3;it++) for(let yi=0;yi<PY;yi++) for(let ti=0;ti<PT;ti++){ if(a[yi*PT+ti]) continue; const n=[[yi,ti-1],[yi,ti+1],[yi-1,ti],[yi+1,ti]].map(([u,v])=>u<0||u>=PY?0:a[u*PT+((v%PT)+PT)%PT]).filter(v=>v); if(n.length) a[yi*PT+ti]=n.reduce((s,v)=>s+v,0)/n.length; }
 const b=new Float32Array(a.length); for(let yi=0;yi<PY;yi++) for(let ti=0;ti<PT;ti++){ let s=0,w=0; for(let dy=-1;dy<=1;dy++) for(let dt=-1;dt<=1;dt++){ const u=yi+dy; if(u<0||u>=PY) continue; const v=a[u*PT+((ti+dt)%PT+PT)%PT]; if(v){ const ww=(dy||dt)?0.6:1; s+=v*ww; w+=ww; } } b[yi*PT+ti]=w?s/w:0.3; }
 PROF=b; return b; }
function R(y,th){ const b=prof(); let fy=(y-PY0)/(PY1-PY0)*PY-0.5; fy=Math.max(0,Math.min(PY-1.001,fy)); const y0=Math.floor(fy), ky=fy-y0; let ft=th/(Math.PI*2)*PT; ft=((ft%PT)+PT)%PT; const t0=Math.floor(ft), kt=ft-t0, t1=(t0+1)%PT;
 const g=(yy,tt)=>b[yy*PT+tt]; return (g(y0,t0)*(1-kt)+g(y0,t1)*kt)*(1-ky)+(g(y0+1,t0)*(1-kt)+g(y0+1,t1)*kt)*ky; }
/* Röhre um den Körper: y0..y1, Winkel von a0 bis a1 (0=vorne), off(y,th) = Abstand nach außen */
function shell(y0,y1,a0,a1,off,ny,nt){ ny=ny||26; nt=nt||64; const pos=[],uv=[],idx=[];
 for(let i=0;i<=ny;i++){ const v=i/ny, y=y0+(y1-y0)*v; for(let j=0;j<=nt;j++){ const u=j/nt, th=a0+(a1-a0)*u; const r=R(y,th)+off(y,th,v,u); pos.push(Math.sin(th)*r,y,Math.cos(th)*r); uv.push(u,v); } }
 for(let i=0;i<ny;i++) for(let j=0;j<nt;j++){ const a=i*(nt+1)+j, b=a+1, c=a+nt+1, d=c+1; idx.push(a,c,b,b,c,d); }
 const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
function ptAt(y,th,off){ const r=R(y,th)+off; return new THREE.Vector3(Math.sin(th)*r,y,Math.cos(th)*r); }
const FUR=0.044;
function noiseTex(base,amt,w,extra){ return tex((x,W,H)=>{ x.fillStyle=base; x.fillRect(0,0,W,H); const im=x.getImageData(0,0,W,H), d=im.data; for(let i=0;i<d.length;i+=4){ const n=(Math.random()-0.5)*amt; d[i]+=n; d[i+1]+=n; d[i+2]+=n; } x.putImageData(im,0,0); if(extra) extra(x,W,H); },w||256,w||256); }
ITEMS.body=[
 {id:'jacke',e:'🧥',n:'Lederjacke',unlock:{d:7,xp:200},make(){ const g=new THREE.Group();
   const map=noiseTex('#2a2426',26,256,(x,W,H)=>{ x.strokeStyle='rgba(255,255,255,.18)'; x.setLineDash([5,5]); x.lineWidth=2; x.beginPath(); x.moveTo(0,H*0.06); x.lineTo(W,H*0.06); x.moveTo(0,H*0.94); x.lineTo(W,H*0.94); x.stroke(); });
   const m=std(0xffffff,{map,roughness:0.32,clearcoat:0.85,clearcoatRoughness:0.25,side:THREE.DoubleSide});
   const GAP=0.42, y0=0.13, y1=0.47;
   const off=(y,th,v)=>FUR+0.006+Math.sin(v*Math.PI)*0.012;
   g.add(new THREE.Mesh(shell(y0,y1,GAP,Math.PI*2-GAP,off),m));
   /* Bund unten */
   const band=std(0x1a1618,{roughness:0.5,clearcoat:0.3,side:THREE.DoubleSide}); g.add(new THREE.Mesh(shell(y0-0.005,y0+0.035,GAP,Math.PI*2-GAP,(y,th)=>FUR+0.016,3,64),band));
   /* Stehkragen, leicht nach außen gekippt */
   const colM=std(0x201b1d,{roughness:0.4,clearcoat:0.7,side:THREE.DoubleSide}); g.add(new THREE.Mesh(shell(y1-0.01,y1+0.05,GAP+0.12,Math.PI*2-GAP-0.12,(y,th,v)=>FUR+0.014+v*0.05,4,64),colM));
   /* Reißverschluss-Kanten + Knöpfe */
   const zip=std(0xd9d9de,{metalness:0.95,roughness:0.22,clearcoat:0});
   [-1,1].forEach(s=>{ const pts=[]; for(let i=0;i<=10;i++){ const y=y0+0.02+(y1-y0-0.05)*i/10; pts.push(ptAt(y,s*GAP,FUR+0.012)); } const tb=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,0.007,6),zip); g.add(tb);
     for(let i=0;i<3;i++){ const st=new THREE.Mesh(new THREE.SphereGeometry(0.011,12,8),zip); st.position.copy(ptAt(0.42-i*0.04,s*(GAP+0.35),FUR+0.022)); g.add(st); } });
   /* Brusttasche mit Zipper */
   const pk=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([ptAt(0.33,0.62,FUR+0.024),ptAt(0.35,0.92,FUR+0.024)]),6,0.0055,6),zip); g.add(pk);
   return g; }},
 {id:'kleid',e:'👗',n:'Rosa Kleidchen',unlock:{d:3,xp:45},make(){ const g=new THREE.Group();
   const map=tex((x,W,H)=>{ x.fillStyle='#ff9cc6'; x.fillRect(0,0,W,H); x.fillStyle='rgba(255,255,255,.92)'; for(let i=0;i<16;i++) for(let j=0;j<6;j++){ x.beginPath(); x.arc((i+(j%2)*0.5)*W/16,(j+0.5)*H/6,5.5,0,7); x.fill(); } },512,192);
   const m=std(0xffffff,{map,roughness:0.62,clearcoat:0.15,sheen:1,sheenColor:new THREE.Color(0xffd6e8),sheenRoughness:0.5,side:THREE.DoubleSide});
   const y0=0.05, y1=0.43; const fl=(y)=>Math.max(0,0.26-y)*0.55;
   const off=(y,th,v)=>FUR+0.004+fl(y)+ (y<0.26?Math.sin(th*14)*0.012*(0.26-y)/0.21:0);
   g.add(new THREE.Mesh(shell(y0,y1,0,Math.PI*2,off,30,96),m));
   /* Rüschen-Saum */
   const fr=std(0xffffff,{roughness:0.8,clearcoat:0,sheen:1,sheenColor:new THREE.Color(0xffffff),side:THREE.DoubleSide});
   g.add(new THREE.Mesh(shell(y0-0.035,y0+0.004,0,Math.PI*2,(y,th,v)=>FUR+0.004+fl(y0)+0.01+Math.sin(th*28)*0.01+(1-v)*0.02,4,160),fr));
   /* Taillenband + Schleife */
   const sat=std(0xe2508f,{roughness:0.28,clearcoat:1,side:THREE.DoubleSide}); g.add(new THREE.Mesh(shell(0.3,0.33,0,Math.PI*2,()=>FUR+0.012,2,96),sat));
   const bow=new THREE.Group(); [-1,1].forEach(s=>{ const l=new THREE.Mesh(new THREE.ConeGeometry(0.045,0.085,4),sat); l.rotation.z=s*Math.PI/2; l.position.x=s*0.042; l.scale.z=0.4; bow.add(l); }); bow.add(new THREE.Mesh(new THREE.SphereGeometry(0.018,12,8),sat));
   bow.position.copy(ptAt(0.315,0,FUR+0.03)); g.add(bow);
   /* Träger */
   [-1,1].forEach(s=>{ const pts=[ptAt(0.42,s*0.55,FUR*0.7),ptAt(0.47,s*0.8,FUR*0.45),ptAt(0.485,s*1.57,FUR*0.35),ptAt(0.47,s*2.35,FUR*0.45),ptAt(0.42,s*2.6,FUR*0.7)]; g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,0.012,8),sat)); });
   return g; }}];
ITEMS.feet=[
 {id:'sneaker',e:'👟',n:'Sneaker',unlock:{d:2,xp:20},make(){ const g=new THREE.Group();
   const up=std(0x4aa3ff,{roughness:0.55,clearcoat:0.3}), sole=std(0xfafafa,{roughness:0.5,clearcoat:0.2}), lace=std(0xffffff,{roughness:0.7,clearcoat:0}), str=std(0xffd23f,{roughness:0.4,clearcoat:0.6});
   [-1,1].forEach(s=>{ const f=new THREE.Group();
     const so=new THREE.Mesh(new THREE.CapsuleGeometry(0.075,0.1,8,20),sole); so.rotation.x=Math.PI/2; so.scale.set(1.12,1,0.38); so.position.y=0.012; f.add(so);
     const u=new THREE.Mesh(new THREE.SphereGeometry(0.1,28,18,0,Math.PI*2,0,Math.PI*0.55),up); u.scale.set(0.86,0.62,1.2); u.position.y=0.022; f.add(u);
     const toe=new THREE.Mesh(new THREE.SphereGeometry(0.062,20,12,0,Math.PI*2,0,Math.PI/2),sole); toe.scale.set(1.05,0.55,0.9); toe.position.set(0,0.02,0.068); f.add(toe);
     const stp=new THREE.Mesh(new THREE.TorusGeometry(0.07,0.008,6,24,Math.PI*0.8),str); stp.rotation.set(0,s*Math.PI/2,0.9); stp.position.set(s*0.077,0.04,-0.01); stp.scale.set(1,0.6,1); f.add(stp);
     for(let i=0;i<3;i++){ const l=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.007,0.009),lace); l.position.set(0,0.078-i*0.004,0.02+i*0.022); l.rotation.x=-0.5; f.add(l); }
     f.position.set(s*0.13,0,0.215); f.rotation.y=s*0.12; g.add(f); });
   return g; }}];
ITEMS.back=[
 {id:'rucksack',e:'🎒',n:'Rucksack',unlock:{d:5,xp:110},make(){ const g=new THREE.Group();
   const m=std(0xffb02e,{roughness:0.6,clearcoat:0.2}), d=std(0xe0662b,{roughness:0.55,clearcoat:0.3}), str=std(0x7a4a2a,{roughness:0.5,clearcoat:0.3});
   const B=Math.PI, p=ptAt(0.29,B,FUR+0.075);
   const box=new THREE.Mesh(new THREE.CapsuleGeometry(0.14,0.13,10,24),m); box.scale.set(1.25,1,0.5); box.position.set(0,0.29,p.z); g.add(box);
   const pk=new THREE.Mesh(new THREE.CapsuleGeometry(0.085,0.05,8,20),d); pk.scale.set(1.3,0.85,0.5); pk.position.set(0,0.22,p.z-0.06); g.add(pk);
   const flap=new THREE.Mesh(new THREE.SphereGeometry(0.175,24,12,0,Math.PI*2,0,Math.PI/2),d); flap.scale.set(1.0,0.5,0.42); flap.position.set(0,0.385,p.z); g.add(flap);
   const bk=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.03,0.012),std(0xe8e8ec,{metalness:0.9,roughness:0.25})); bk.position.set(0,0.36,p.z-0.075); g.add(bk);
   [-1,1].forEach(s=>{ const pts=[ptAt(0.40,B-s*0.35,FUR+0.01),ptAt(0.48,B-s*0.9,FUR+0.004),ptAt(0.49,s*1.3,FUR+0.004),ptAt(0.44,s*0.62,FUR+0.008),ptAt(0.32,s*0.6,FUR+0.01),ptAt(0.22,s*0.9,FUR+0.01),ptAt(0.2,s*1.8,FUR+0.01),ptAt(0.24,B-s*0.45,FUR+0.01)];
     g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),60,0.013,8),str)); });
   return g; }}];
ITEMS.ears=[
 {id:'ohrenw',e:'🎧',n:'Ohrenwärmer',unlock:{d:6,xp:150},make(){ const g=new THREE.Group();
   const plush=new THREE.MeshPhysicalMaterial({color:0xffc4dd,roughness:1,sheen:1,sheenColor:new THREE.Color(0xffffff),sheenRoughness:0.35});
   const geo=new THREE.IcosahedronGeometry(0.11,4); const P=geo.attributes.position; for(let i=0;i<P.count;i++){ const v=new THREE.Vector3().fromBufferAttribute(P,i); const n=1+0.06*Math.sin(v.x*90)*Math.sin(v.y*80)*Math.sin(v.z*85); v.multiplyScalar(n); P.setXYZ(i,v.x,v.y,v.z); } geo.computeVertexNormals();
   const bandM=std(0xb895ff,{roughness:0.3,clearcoat:1});
   const band=new THREE.Mesh(new THREE.TorusGeometry(0.33,0.03,12,48,Math.PI),bandM); band.position.set(0,0.78,0.10); band.rotation.x=-0.12; band.rotation.y=0; g.add(band);
   [-1,1].forEach(s=>{ const pd=new THREE.Mesh(geo,plush); pd.scale.set(0.7,1,1); pd.position.set(s*0.33,0.79,0.13); g.add(pd);
     const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.02,20),bandM); cap.rotation.z=Math.PI/2; cap.position.set(s*0.41,0.79,0.13); cap.scale.set(1.3,1,1.3); g.add(cap); });
   return g; }}];
ITEMS.hat.push({id:'propeller',e:'🚁',n:'Propellerhut',unlock:{d:4,xp:75},make(){ const g=new THREE.Group();
   const t=tex((x,w,h)=>{ const cs=['#ff4d4d','#ffd23f','#3ec46d','#3f8fd8']; for(let i=0;i<8;i++){ x.fillStyle=cs[i%4]; x.fillRect(i*w/8,0,w/8+1,h); } },256,64);
   const cap=new THREE.Mesh(new THREE.SphereGeometry(0.15,40,16,0,Math.PI*2,0,Math.PI/2),std(0xffffff,{map:t,roughness:0.6,clearcoat:0.3})); cap.scale.y=0.78; g.add(cap);
   const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.11,0.01,32,1,false,-0.9,1.8),std(0x3f8fd8,{roughness:0.5})); brim.position.set(0,0.003,0.1); brim.scale.z=0.9; g.add(brim);
   const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.009,0.009,0.05,10),std(0xdddddd,{metalness:0.8,roughness:0.3})); stem.position.y=0.135; g.add(stem);
   const prop=new THREE.Group(); prop.name='prop'; prop.position.y=0.163; const bm=std(0xffd23f,{roughness:0.3,clearcoat:1}), bm2=std(0xff4d4d,{roughness:0.3,clearcoat:1});
   [0,1].forEach(i=>{ const b=new THREE.Mesh(new THREE.CapsuleGeometry(0.022,0.09,6,12),i?bm2:bm); b.rotation.z=Math.PI/2; b.scale.set(1,1,0.22); b.position.x=(i?-1:1)*0.065; b.rotation.x=(i?-1:1)*0.35; prop.add(b); });
   prop.add(new THREE.Mesh(new THREE.SphereGeometry(0.016,12,8),std(0x3ec46d,{roughness:0.3,clearcoat:1}))); g.add(prop); return g; }});
Object.assign(SLOTS,{body:{n:'Anziehsachen',parent:'root',pos:()=>[0,0,0],rot:[0,0,0]},feet:{n:'Schuhe',parent:'root',pos:()=>[0,0,0],rot:[0,0,0]},back:{n:'Rücken',parent:'root',pos:()=>[0,0,0],rot:[0,0,0]},ears:{n:'Ohren',parent:'head',pos:()=>[0,0,0],rot:[0,0,0]}});
/* ---------- v3: Halloween-Kostüme (sofort verfügbar, lieb statt gruselig) ---------- */
/* Teile mit name 'H' kommen an den Kopf (gleiches Koordinatensystem wie der Körper). */
const HC=[0,0.735,-0.01];
function onHead(dirv,dist){ const d=new THREE.Vector3(...dirv).normalize(); return {p:new THREE.Vector3(HC[0],HC[1],HC[2]).addScaledVector(d,dist||0.37),n:d}; }
function stick(m,dirv,dist){ const o=onHead(dirv,dist); m.position.copy(o.p); m.lookAt(o.p.clone().add(o.n)); return m; }
function faceTex(draw,w,h){ return tex((x,W,H)=>draw(x,W,H),w||512,h||256); }
const HALLO=[
 {id:'geist',e:'👻',n:'Gespensterlaken',hideHair:true,say:'Huuuh! Ich bin ein kleines Gespenst! Buh! Hihi, hab ich dich erschreckt?',make(){ const g=new THREE.Group();
   const m=new THREE.MeshPhysicalMaterial({color:0xfbfbff,roughness:0.85,sheen:1,sheenColor:new THREE.Color(0xdfe6ff),sheenRoughness:0.4,side:THREE.DoubleSide});
   g.add(new THREE.Mesh(shell(-0.01,0.57,0,Math.PI*2,(y,th,v)=>FUR+0.012+Math.max(0,0.3-y)*0.32+(y<0.06?Math.sin(th*9)*0.02:0)+Math.sin(th*5+y*9)*0.006,30,110),m));
   const H=new THREE.Group(); H.name='H';
   const hood=new THREE.Mesh(new THREE.SphereGeometry(0.4,48,28,Math.PI/2+1.05,Math.PI*2-2.1,0,Math.PI*0.78),m); hood.position.set(HC[0],HC[1]+0.01,HC[2]-0.02); hood.scale.set(1.04,1.04,1.02); H.add(hood);
   /* kleine Zipfel-Spitze oben */
   const tip=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.1,16),m); tip.position.set(0,1.18,-0.04); tip.rotation.z=0.5; H.add(tip);
   g.add(H); return g; }},
 {id:'kuerbis',e:'🎃',n:'Kürbis',say:'Ich bin ein Kürbis! Rund und orange! Wer will Kürbissuppe? Hihi!',make(){ const g=new THREE.Group();
   const map=faceTex((x,W,H)=>{ const gr=x.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#ffa63a'); gr.addColorStop(1,'#e8761a'); x.fillStyle=gr; x.fillRect(0,0,W,H);
     for(let i=0;i<10;i++){ x.fillStyle='rgba(150,60,0,.18)'; x.fillRect(i*W/10-3,0,6,H); }
     const cx=W/2, f='#5a2400', gl='#ffd23f'; x.fillStyle=f;
     [[-1],[1]].forEach(([s])=>{ x.beginPath(); x.moveTo(cx+s*44,H*0.30); x.lineTo(cx+s*20,H*0.50); x.lineTo(cx+s*68,H*0.50); x.closePath(); x.fill(); });
     x.beginPath(); x.moveTo(cx-70,H*0.60); x.quadraticCurveTo(cx,H*0.92,cx+70,H*0.60); x.quadraticCurveTo(cx,H*0.76,cx-70,H*0.60); x.fill();
     x.fillStyle=gl; x.fillRect(cx-14,H*0.70,12,10); x.fillRect(cx+6,H*0.70,12,10); },512,256);
   const m=std(0xffffff,{map,roughness:0.5,clearcoat:0.5,side:THREE.DoubleSide});
   g.add(new THREE.Mesh(shell(0.02,0.53,-Math.PI,Math.PI,(y,th,v)=>FUR+0.012+Math.sin(v*Math.PI)*0.075+Math.abs(Math.sin(th*5))*0.022*Math.sin(v*Math.PI),30,120),m));
   const leaf=std(0x3f9a3a,{roughness:0.5,clearcoat:0.4,side:THREE.DoubleSide});
   g.add(new THREE.Mesh(shell(0.5,0.58,0,Math.PI*2,(y,th,v)=>FUR+0.014+v*0.035+Math.max(0,Math.sin(th*8))*0.025*v,4,96),leaf));
   const H=new THREE.Group(); H.name='H'; const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.04,0.11,12),std(0x6b8a2a,{roughness:0.7})); stem.position.set(0,1.02,0.08); stem.rotation.z=-0.25; H.add(stem);
   const lf=new THREE.Mesh(new THREE.SphereGeometry(0.06,16,10),leaf); lf.scale.set(1.4,0.25,0.8); lf.position.set(0.07,1.0,0.1); lf.rotation.z=-0.3; H.add(lf);
   const pts=[]; for(let i=0;i<=30;i++){ const a=i/30*Math.PI*3.2; pts.push(new THREE.Vector3(-0.03-i*0.004+Math.cos(a)*0.025,1.02+Math.sin(a)*0.025,0.08+i*0.002)); }
   H.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),60,0.005,6),leaf)); g.add(H); return g; }},
 {id:'zombie',e:'🧟',n:'Zombie',say:'Uuuuh … ich bin ein Zombie! Ich will … Kekse! Ganz viele Kekse! Hihi!',make(){ const g=new THREE.Group();
   const map=tex((x,W,H)=>{ x.clearRect(0,0,W,H); x.fillStyle='#9cc58a'; x.fillRect(0,0,W,H);
     for(let i=0;i<900;i++){ x.fillStyle='rgba(60,90,50,.15)'; x.fillRect(Math.random()*W,Math.random()*H,3,3); }
     [[0.2,0.35,'#c9a46a'],[0.62,0.55,'#8fb3e0'],[0.86,0.3,'#e3a0b8']].forEach(([u,v,c])=>{ x.fillStyle=c; x.fillRect(u*W-26,v*H-22,52,44); x.strokeStyle='#444'; x.lineWidth=2; x.setLineDash([5,4]); x.strokeRect(u*W-26,v*H-22,52,44); x.setLineDash([]); });
     /* zerfranster Saum unten (unten = großes y) */
     x.globalCompositeOperation='destination-out'; x.beginPath(); x.moveTo(0,H); for(let i=0;i<=24;i++) x.lineTo(i*W/24,H-(i%2?26:6)-Math.random()*10); x.lineTo(W,H); x.fill(); x.globalCompositeOperation='source-over'; },512,256);
   map.flipY=true; const m=std(0xffffff,{map,alphaTest:0.5,roughness:0.85,clearcoat:0,side:THREE.DoubleSide});
   g.add(new THREE.Mesh(shell(0.08,0.5,-Math.PI,Math.PI,(y,th,v)=>FUR+0.008+Math.sin(v*Math.PI)*0.01,26,96),m));
   const H=new THREE.Group(); H.name='H'; const tape=std(0xfff0d8,{roughness:0.8,clearcoat:0});
   [0.6,-0.6].forEach(r=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.055,0.012),tape); stick(b,[0.45,0.75,0.45],0.375); const w=new THREE.Group(); w.add(b); b.rotateZ(r); H.add(w); });
   g.add(H); return g; }},
 {id:'skelett',e:'💀',n:'Skelett',say:'Klapper, klapper! Ich bin ein Skelett! Hihi, das kitzelt in den Knochen!',make(){ const g=new THREE.Group();
   const map=tex((x,W,H)=>{ x.fillStyle='#1d1b22'; x.fillRect(0,0,W,H); const cx=W/2; x.fillStyle='#f4f1e8'; x.strokeStyle='#f4f1e8'; x.lineCap='round';
     for(let i=0;i<9;i++){ x.beginPath(); x.arc(cx-6,H*0.16+i*H*0.05+6,4.5,0,7); x.fill(); x.beginPath(); x.arc(cx+6,H*0.16+i*H*0.05+6,4.5,0,7); x.fill(); x.fillRect(cx-7,H*0.16+i*H*0.05,14,12); }
     x.lineWidth=11; for(let i=0;i<4;i++){ const y=H*0.2+i*H*0.085, w=78-i*6; [-1,1].forEach(s=>{ x.beginPath(); x.moveTo(cx+s*12,y); x.quadraticCurveTo(cx+s*w,y-10,cx+s*(w+8),y+16); x.stroke(); }); }
     x.beginPath(); x.ellipse(cx,H*0.78,58,24,0,0,7); x.fill(); x.fillStyle='#1d1b22'; [-1,1].forEach(s=>{ x.beginPath(); x.ellipse(cx+s*24,H*0.78,13,10,0,0,7); x.fill(); });
     x.fillStyle='#f4f1e8'; for(let i=0;i<5;i++){ x.beginPath(); x.arc(W*0.06+i*W*0.22,H*0.5,3,0,7); x.fill(); } },512,256);
   const m=std(0xffffff,{map,roughness:0.6,clearcoat:0.2,side:THREE.DoubleSide});
   g.add(new THREE.Mesh(shell(0.03,0.53,-Math.PI,Math.PI,(y,th,v)=>FUR+0.008+Math.sin(v*Math.PI)*0.012,28,96),m));
   const H=new THREE.Group(); H.name='H'; const bm=std(0xf4f1e8,{roughness:0.4,clearcoat:0.6}); const bone=new THREE.Group();
   const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.13,10),bm); sh.rotation.z=Math.PI/2; bone.add(sh); [-1,1].forEach(a=>[-1,1].forEach(b=>{ const k=new THREE.Mesh(new THREE.SphereGeometry(0.022,12,8),bm); k.position.set(a*0.068,b*0.014,0); bone.add(k); }));
   const o=onHead([-0.45,0.85,0.25],0.372); bone.position.copy(o.p); bone.rotation.z=0.5; H.add(bone); g.add(H); return g; }},
 {id:'hexe',e:'🧹',n:'Hexe',hatLike:true,say:'Hokus Pokus, Fidibus! Ich bin eine kleine Hexe! Wer fliegt mit auf meinem Besen?',make(){ const g=new THREE.Group();
   const H=new THREE.Group(); H.name='H'; const hat=new THREE.Group(); hat.position.set(0,0.955,0.06); hat.rotation.set(-0.16,0,0); hat.scale.setScalar(1.5); H.add(hat);
   const hm=std(0x2b1f3d,{roughness:0.7}); const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.012,48),hm); hat.add(brim);
   const c1=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.125,0.17,40),hm); c1.position.y=0.09; hat.add(c1);
   const c2=new THREE.Mesh(new THREE.ConeGeometry(0.075,0.17,40),hm); c2.position.set(0.04,0.235,0); c2.rotation.z=-0.55; hat.add(c2);
   const band=new THREE.Mesh(new THREE.CylinderGeometry(0.118,0.126,0.035,40,1,true),std(0x63c23a,{roughness:0.4,clearcoat:0.5,side:THREE.DoubleSide})); band.position.y=0.03; hat.add(band);
   const bk=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.04,0.01),std(0xf2c14e,{metalness:0.85,roughness:0.25})); bk.position.set(0,0.03,0.125); hat.add(bk);
   const star=new THREE.Mesh(new THREE.OctahedronGeometry(0.022),std(0xffd84a,{emissive:0x664400,roughness:0.3})); star.position.set(-0.05,0.13,0.1); hat.add(star);
   const cmap=tex((x,W,H)=>{ x.fillStyle='#5b2a86'; x.fillRect(0,0,W,H); x.fillStyle='#ffd84a'; for(let i=0;i<26;i++){ const px=Math.random()*W, py=Math.random()*H, r=4+Math.random()*4; x.beginPath(); for(let k=0;k<10;k++){ const a=k*Math.PI/5, rr=k%2?r*0.45:r; x.lineTo(px+Math.cos(a)*rr,py+Math.sin(a)*rr); } x.fill(); } },256,256);
   const cm=std(0xffffff,{map:cmap,roughness:0.55,clearcoat:0.2,sheen:0.6,side:THREE.DoubleSide});
   g.add(new THREE.Mesh(shell(0.03,0.52,Math.PI-1.75,Math.PI+1.75,(y,th,v)=>FUR+0.02+(0.52-y)*0.2,24,64),cm));
   const cord=std(0xf2c14e,{metalness:0.6,roughness:0.3}); const pts=[]; for(let i=0;i<=12;i++){ const th=-1.75+3.5*i/12; pts.push(ptAt(0.5,th,FUR+0.018)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,0.008,6),cord));
   const cl=new THREE.Mesh(new THREE.SphereGeometry(0.02,12,8),cord); cl.position.copy(ptAt(0.5,0,FUR+0.026)); g.add(cl);
   const broom=new THREE.Group(); const st=new THREE.Mesh(new THREE.CylinderGeometry(0.013,0.016,0.95,10),std(0x8a5a2b,{roughness:0.7})); st.position.y=0.475; broom.add(st);
   const br=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.24,20,1,true),std(0xd9b25a,{roughness:0.9,side:THREE.DoubleSide})); br.position.y=0.02; br.rotation.x=Math.PI; br.scale.z=0.6; broom.add(br);
   const tie=new THREE.Mesh(new THREE.TorusGeometry(0.03,0.008,6,16),std(0xb3263a)); tie.rotation.x=Math.PI/2; tie.position.y=0.13; broom.add(tie);
   broom.position.set(0.5,0.0,0.12); broom.rotation.z=0.18; g.add(broom);
   g.add(H); return g; }},
 {id:'franken',e:'🔩',n:'Frankensteinchen',hideHair:true,say:'Ich bin Frankensteinchen! Ganz stark und ganz lieb! Willst du kuscheln? Hihi!',make(){ const g=new THREE.Group();
   const H=new THREE.Group(); H.name='H'; const hm=std(0x2f4a2a,{roughness:0.75,clearcoat:0.1});
   const top=new THREE.Mesh(new THREE.SphereGeometry(0.25,28,12,0,Math.PI*2,0,Math.PI/2),hm); top.scale.set(1.04,0.42,0.92); top.position.set(0,0.93,-0.02); H.add(top); const dome=new THREE.Mesh(new THREE.SphereGeometry(0.355,32,16,0,Math.PI*2,0,1.15),hm); dome.position.set(0,0.66,-0.02); dome.scale.set(1.09,0.9,1.06); H.add(dome);
   const top2=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.3,0.08,24),hm); top2.position.set(0,0.91,-0.02); H.add(top2);
   for(let i=0;i<9;i++){ const x=-0.2+i*0.05; const c=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.07+((i*7)%3)*0.015,6),hm); c.rotation.x=Math.PI; c.position.set(x,0.885,0.22-Math.abs(x)*0.25); H.add(c); }
   const sm=std(0x3a2a2a,{roughness:0.6}); const s0=onHead([0,0.42,1],0.372); const pts=[-0.09,0,0.09].map(dx=>onHead([dx*2.6,0.42,1],0.372).p); const line=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,0.005,6),sm); H.add(line);
   for(let i=0;i<5;i++){ const p=onHead([-0.2+i*0.1,0.42,1],0.374).p; const s=new THREE.Mesh(new THREE.BoxGeometry(0.005,0.035,0.006),sm); s.position.copy(p); s.lookAt(p.clone().add(new THREE.Vector3(-0.2+i*0.1,0.42,1).normalize())); H.add(s); }
   const bm=std(0xc9ced6,{metalness:0.9,roughness:0.25});
   [-1,1].forEach(s=>{ const b=new THREE.Group(); const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.08,12),bm); sh.rotation.z=Math.PI/2; b.add(sh); const nut=new THREE.Mesh(new THREE.CylinderGeometry(0.034,0.034,0.025,6),bm); nut.rotation.z=Math.PI/2; nut.position.x=s*0.04; b.add(nut); b.position.set(s*0.33,0.5,0.0); g.add(b); });
   const jm=tex((x,W,H)=>{ x.fillStyle='#3b3740'; x.fillRect(0,0,W,H); x.strokeStyle='#9a96a0'; x.lineWidth=2; x.setLineDash([6,5]); [[0.3,0.4],[0.7,0.6]].forEach(([u,v])=>{ x.fillStyle='#5a4e6a'; x.fillRect(u*W-20,v*H-16,40,32); x.strokeRect(u*W-20,v*H-16,40,32); }); },256,256);
   g.add(new THREE.Mesh(shell(0.1,0.5,0.4,Math.PI*2-0.4,(y,th,v)=>FUR+0.008+Math.sin(v*Math.PI)*0.012,24,64),std(0xffffff,{map:jm,roughness:0.8,clearcoat:0,side:THREE.DoubleSide})));
   g.add(H); return g; }},
 {id:'alien',e:'👽',n:'Alien',say:'Piep, piep! Ich bin ein Alien vom Planeten Keks! Ich komme in Frieden! Hihi!',make(){ const g=new THREE.Group();
   const H=new THREE.Group(); H.name='H'; const sil=std(0xd5dbe6,{metalness:0.85,roughness:0.22});
   const band=new THREE.Mesh(new THREE.TorusGeometry(0.33,0.016,10,48,Math.PI),sil); band.position.set(0,0.72,0.06); band.rotation.x=-0.12; H.add(band);
   [-1,1].forEach(s=>{ const a=new THREE.Group(); a.name='ant'; a.userData.s=s; a.position.set(s*0.12,1.0,0.1); const pts=[new THREE.Vector3(0,0,0),new THREE.Vector3(s*0.03,0.08,0.01),new THREE.Vector3(s*0.07,0.15,0.03),new THREE.Vector3(s*0.1,0.2,0.04)];
     a.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,0.009,8),std(0x5fd35a,{roughness:0.4})));
     const ball=new THREE.Mesh(new THREE.SphereGeometry(0.032,16,12),new THREE.MeshPhysicalMaterial({color:0x9dff6a,emissive:0x4cff2a,emissiveIntensity:0.8,roughness:0.2,clearcoat:1})); ball.position.set(s*0.1,0.21,0.04); a.add(ball); H.add(a); });
   const map=tex((x,W,H)=>{ x.fillStyle='#c9d2de'; x.fillRect(0,0,W,H); x.fillStyle='rgba(255,255,255,.35)'; for(let i=0;i<8;i++) x.fillRect(0,i*H/8,W,3); const cx=W/2, cy=H*0.45;
     x.fillStyle='#4cd65a'; x.beginPath(); x.arc(cx,cy,26,0,7); x.fill(); x.strokeStyle='#ffd84a'; x.lineWidth=5; x.beginPath(); x.ellipse(cx,cy,44,12,-0.3,0,7); x.stroke(); },512,256);
   g.add(new THREE.Mesh(shell(0.03,0.52,-Math.PI,Math.PI,(y,th,v)=>FUR+0.01+Math.sin(v*Math.PI)*0.014,28,96),std(0xffffff,{map,metalness:0.55,roughness:0.3,clearcoat:0.8,side:THREE.DoubleSide})));
   const col=new THREE.Mesh(shell(0.49,0.55,0,Math.PI*2,(y,th,v)=>FUR+0.02+v*0.02,3,64),std(0x5fd35a,{roughness:0.35,clearcoat:0.8,side:THREE.DoubleSide})); g.add(col);
   g.add(H); return g; }},
 {id:'lottergeist',e:'🦓',n:'Lottergeist',hideHair:true,say:'Ich bin der Lottergeist! Streifen, Streifen, Streifen! Und meine Haare sind grün wie Wackelpudding! Hihi!',make(){ const g=new THREE.Group();
   const map=tex((x,W,H)=>{ for(let i=0;i<24;i++){ x.fillStyle=i%2?'#f4f2ea':'#1c1b20'; x.fillRect(i*W/24,0,W/24+1,H); } },512,64);
   const m=std(0xffffff,{map,roughness:0.55,clearcoat:0.3,side:THREE.DoubleSide}); const GAP=0.3;
   g.add(new THREE.Mesh(shell(0.04,0.5,GAP,Math.PI*2-GAP,(y,th,v)=>FUR+0.01+Math.sin(v*Math.PI)*0.012,26,96),m));
   const sh=std(0xf4f2ea,{roughness:0.6}); g.add(new THREE.Mesh(shell(0.2,0.5,-GAP,GAP,()=>FUR+0.004,12,16),sh));
   const tm=std(0x2a2a30,{roughness:0.4,clearcoat:0.6}); const t1=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.14,4),tm); t1.rotation.x=Math.PI; t1.scale.z=0.35; t1.position.copy(ptAt(0.4,0,FUR+0.014)); g.add(t1);
   const kn=new THREE.Mesh(new THREE.SphereGeometry(0.02,10,8),tm); kn.position.copy(ptAt(0.48,0,FUR+0.016)); g.add(kn);
   const H=new THREE.Group(); H.name='H'; const greens=[0x7fe04a,0x5cc63a,0xa2f05a,0x4fae34].map(c=>std(c,{roughness:0.6,clearcoat:0.2}));
   let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
   for(let i=0;i<70;i++){ const d=new THREE.Vector3(rnd()*2-1,0.35+rnd()*0.9,rnd()*1.6-0.9).normalize(); if(d.z>0.6&&d.y<0.75) continue; const o=onHead(d.toArray(),0.31);
     const len=0.1+rnd()*0.12; const c=new THREE.Mesh(new THREE.ConeGeometry(0.035+rnd()*0.015,len,6),greens[i%4]); const dir=d.clone().add(new THREE.Vector3((rnd()-.5)*0.6,0.2,(rnd()-.5)*0.4)).normalize();
     c.position.copy(o.p).addScaledVector(dir,len*0.45); c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir); H.add(c); }
   g.add(H); return g; }},
 {id:'meerjungfrau',e:'🧜‍♀️',n:'Meerjungfrau',say:'Blubb, blubb! Ich bin eine Meerjungfrau! Mit Glitzer-Flosse! Wer schwimmt mit mir?',make(){ const g=new THREE.Group();
   const map=tex((x,W,H)=>{ x.fillStyle='#2bb7b0'; x.fillRect(0,0,W,H); for(let j=0;j<12;j++) for(let i=0;i<24;i++){ const px=(i+(j%2)*0.5)*W/24, py=j*H/12; const gr=x.createRadialGradient(px,py+6,1,px,py+6,13); gr.addColorStop(0,'#8ff0e0'); gr.addColorStop(1,'#1b8f9a'); x.fillStyle=gr; x.beginPath(); x.arc(px,py+6,11,0,Math.PI); x.fill(); } },512,256);
   const m=std(0xffffff,{map,roughness:0.25,clearcoat:1,iridescence:0.8,side:THREE.DoubleSide});
   g.add(new THREE.Mesh(shell(0.0,0.32,0,Math.PI*2,(y,th,v)=>FUR+0.012+Math.sin(v*Math.PI)*0.012,20,96),m));
   g.add(new THREE.Mesh(shell(0.3,0.34,0,Math.PI*2,()=>FUR+0.02,2,96),std(0xb07cff,{roughness:0.2,clearcoat:1,iridescence:1,side:THREE.DoubleSide})));
   const fm=new THREE.MeshPhysicalMaterial({color:0x5fe0d2,roughness:0.2,clearcoat:1,transparent:true,opacity:0.85,iridescence:1,side:THREE.DoubleSide});
   const fin=new THREE.Shape(); fin.moveTo(0,0); fin.bezierCurveTo(0.06,0.02,0.16,0.08,0.2,0.02); fin.bezierCurveTo(0.16,-0.02,0.14,-0.06,0.17,-0.1); fin.bezierCurveTo(0.1,-0.06,0.04,-0.03,0,0);
   [-1,1].forEach(s=>{ const f=new THREE.Mesh(new THREE.ShapeGeometry(fin,20),fm); f.scale.set(s*1.2,1.2,1.2); f.rotation.x=-1.25; f.position.set(s*0.04,0.03,0.3); g.add(f); });
   const pearl=new THREE.MeshPhysicalMaterial({color:0xfff6ee,roughness:0.15,clearcoat:1,sheen:1,sheenColor:new THREE.Color(0xffd6f0)});
   for(let i=0;i<=16;i++){ const th=-1.3+2.6*i/16; const p=new THREE.Mesh(new THREE.SphereGeometry(0.014,10,8),pearl); p.position.copy(ptAt(0.5-Math.cos((i/16-0.5)*Math.PI)*0.03,th,FUR+0.01)); g.add(p); }
   const H=new THREE.Group(); H.name='H'; const ss=new THREE.Shape(); for(let k=0;k<10;k++){ const a=Math.PI/2+k*Math.PI/5, r=k%2?0.022:0.05; const px=Math.cos(a)*r, py=Math.sin(a)*r; k?ss.lineTo(px,py):ss.moveTo(px,py); }
   const sf=new THREE.Mesh(new THREE.ExtrudeGeometry(ss,{depth:0.012,bevelEnabled:true,bevelSize:0.006,bevelThickness:0.006,bevelSegments:2}),std(0xff7f6a,{roughness:0.45,clearcoat:0.6})); stick(sf,[0.55,0.75,0.35],0.39); H.add(sf);
   g.add(H); return g; }}];
ITEMS.costume=HALLO;
SLOTS.costume={n:'🎃 Halloween-Kostüme',parent:'root',pos:()=>[0,0,0],rot:[0,0,0]};
{ const o=Object.assign({},ITEMS); Object.keys(ITEMS).forEach(k=>delete ITEMS[k]); ITEMS.costume=o.costume; Object.keys(o).forEach(k=>{ if(k!=='costume') ITEMS[k]=o[k]; }); }
const costumeIt=()=>{ const id=K&&K.M.wear&&K.M.wear.costume; return id?HALLO.find(x=>x.id===id):null; };
W.hairHidden=()=>{ const c=costumeIt(); return !!(c&&c.hideHair); };
W.costumeHat=()=>{ const c=costumeIt(); return !!(c&&c.hatLike); };
W.costumes=()=>HALLO.map(x=>x.id); W._item=id=>HALLO.find(x=>x.id===id);
/* ---------- Freischalten ---------- */
const days=()=>Math.max(1,(K.M.days||[]).length);
function isLocked(it){ if(!it.unlock) return false; const U=K.M.unl=K.M.unl||{}; if(U[it.id]) return false; if(days()>=it.unlock.d||(K.M.xp||0)>=it.unlock.xp){ U[it.id]=1; K.save(); return false; } return true; }
W.isLocked=id=>{ for(const s in ITEMS){ const it=ITEMS[s].find(x=>x.id===id); if(it) return isLocked(it); } return false; };
W.unlocks=function(){ const out=[], seen=K.M.unlSeen=K.M.unlSeen||{}; for(const s in ITEMS) ITEMS[s].forEach(it=>{ if(it.unlock&&!isLocked(it)&&!seen[it.id]){ seen[it.id]=1; out.push('🎁 Neu im Kleiderschrank: '+it.e+' '+it.n+'!'); } }); if(out.length) K.save(); return out; };
let chkT=0, t0=performance.now(), spinA=0;
W.tick=function(dt,t){ /* 3.1: Kleidung atmet mit dem Fell mit (sonst schaut das Fell beim Atmen durch) */ const bU=K.G.U, br=bU.uBreath.value; ['costume','body'].forEach(sl=>{ const c=cur[sl]&&cur[sl].children[0]; if(c) c.scale.set(1+br*0.03,1+br*0.008,1+br*0.03); });
 const cx=cur.costume&&cur.costume.userData.extra; if(cx){ const tt=performance.now()/1000; cx.traverse(o=>{ if(o.name==='ant'){ o.rotation.z=o.userData.s*(0.12*Math.sin(tt*3+o.userData.s)+(K.A.hop||0)*0.4+(K.A.earWig||0)*0.15*Math.sin(tt*14)); } }); }
 const h=cur.hat; if(h){ const p=h.getObjectByName('prop'); if(p){ const v=10+(K.A.hop||0)*30+(K.A.earWig||0)*6; spinA+=v*Math.min(0.05,dt||0.016); p.rotation.y=spinA; } }
 const now=performance.now(); if(now-t0<25000||now-chkT<5000) return; chkT=now; if(K.st.busy||K.st.game) return;
 const u=W.unlocks(); if(u.length){ (async()=>{ for(const m of u){ K.toast(m); try{ K.V.chime&&K.V.chime(); }catch(e){} await wait(400); K.say('Oh! Was Neues zum Anziehen!'); await wait(3300); } if(pan) mark(); })(); } };

const cur={hat:null,glasses:null,neck:null,body:null,feet:null,back:null,ears:null,costume:null};
function wear(slot,id,silent){ const S=SLOTS[slot]; if(cur[slot]){ const x=cur[slot].userData.extra; if(x&&x.parent) x.parent.remove(x); cur[slot].parent.remove(cur[slot]); cur[slot]=null; }
 if(id&&slot==='costume') ['hat','body','back'].forEach(o=>{ if(K.M.wear&&K.M.wear[o]) wear(o,null,true); });
 if(id&&slot!=='costume'&&/^(hat|body|back)$/.test(slot)&&K.M.wear&&K.M.wear.costume) wear('costume',null,true);
 K.M.wear=K.M.wear||{}; K.M.wear[slot]=id||null; K.save(); if((slot==='hat'||slot==='costume')&&window.GissHair&&GissHair.refresh) setTimeout(()=>GissHair.refresh(),0); if(!id) return;
 const it=ITEMS[slot].find(x=>x.id===id); if(!it) return; const inner=it.make(); const g=new THREE.Group(); g.add(inner); g.position.fromArray(S.pos()); g.rotation.set(...S.rot);
 if(slot==='neck'&&id==='fliege') inner.position.set(0,0.0,0.25); else if(slot==='neck') inner.position.y=-0.02;
 (S.parent==='head'?K.G.head:K.G.root).add(g); cur[slot]=g; const SC=S.sc||1;
 const hp=inner.getObjectByName('H'); let hg=null; if(hp){ inner.remove(hp); hg=new THREE.Group(); hg.add(hp); K.G.head.add(hg); g.userData.extra=hg; }
 const setS=v=>{ g.scale.setScalar(v); if(hg) hg.scale.setScalar(v); };
 setS(silent?SC:0.01); if(!silent){ let k=0; const pop=()=>{ k=Math.min(1,k+0.08); const e=1+Math.sin(k*Math.PI)*0.25*(1-k); setS(Math.max(0.01,k*e)*SC); if(k<1) requestAnimationFrame(pop); }; pop(); } }
W._wear=(s,i,q)=>wear(s,i,q); W.snap=()=>snapMoe(); W.emoji=(c,p)=>emoji(c,p);
W.wearing=()=>Object.assign({},K.M.wear||{});
W.setVisible=v=>Object.values(cur).forEach(g=>{ if(!g) return; g.visible=v; if(g.userData.extra) g.userData.extra.visible=v; });
/* Kleiderschrank-Panel */
let pan;
function buildPanel(){ pan=document.createElement('div'); pan.id='wardrobe'; pan.className='panel';
 let h='<div class="ph"><b>👗 Kleiderschrank</b><button class="x" aria-label="Schließen">✕</button></div>';
 for(const s in ITEMS){ h+='<div class="wsl">'+SLOTS[s].n+'</div><div class="wrow" data-s="'+s+'"><button class="wi" data-id=""><i>🚫</i><span>ohne</span></button>'+ITEMS[s].map(it=>'<button class="wi" data-id="'+it.id+'"><i>'+it.e+'</i><span>'+it.n+'</span><em></em></button>').join('')+'</div>'; }
 pan.innerHTML=h; document.body.appendChild(pan); pan.addEventListener('pointerdown',e=>e.stopPropagation());
 pan.querySelector('.x').addEventListener('pointerup',e=>{ e.stopPropagation(); pan.classList.remove('show'); });
 pan.querySelectorAll('.wi').forEach(b=>b.addEventListener('pointerup',e=>{ e.stopPropagation(); K.V.unlock(); const s=b.parentNode.dataset.s, id=b.dataset.id; const it=ITEMS[s].find(x=>x.id===id); if(it&&isLocked(it)){ const n=Math.max(1,it.unlock.d-days()); K.toast('🔒 '+it.n+' gibt es bald! Noch '+n+(n>1?' Tage':' Tag')+' – oder ganz viel mit Giß-Moe spielen.'); return; } wear(s,id); mark(); react(id,it); })); mark(); }
function mark(){ const w=K.M.wear||{}; pan.querySelectorAll('.wrow').forEach(r=>r.querySelectorAll('.wi').forEach(b=>{ const it=ITEMS[r.dataset.s].find(x=>x.id===b.dataset.id); const L=!!(it&&isLocked(it)); b.classList.toggle('lock',L); const em=b.querySelector('em'); if(em) em.textContent=L?'ab Tag '+it.unlock.d:''; })); pan.querySelectorAll('.wrow').forEach(r=>r.querySelectorAll('.wi').forEach(b=>b.classList.toggle('on',(w[r.dataset.s]||'')===b.dataset.id))); }
let reactT=0;
async function react(id,it){ const k=K, A=k.A; if(k.st.mode==='sleep') await k.wake(); const t=k.begin(); k.rest(); k.mark('wear'); A.low=0.6; A.lid=0.35; A.blush=0.8; A.earWig=1.2; A.hop=0.5; k.st.spinV=id?6:0;
 if(id){ k.fx('✨','',3); } const line=!id?'Puh …':(it&&it.say)?it.say:(Date.now()-reactT<5000?(Math.random()<.5?'Schick!':'Hihi!'):'Wie sehe ich aus?'); reactT=Date.now();
 await wait(500); await wait(k.say(line)*1000+300); if(k.alive(t)) k.rest(); }
W.open=()=>{ document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show')); mark(); pan.classList.add('show'); };
/* ---------- Wimmelbild ---------- */
let wm=null, moeSpr=null, emo={};
function emoji(ch,px){ const k=ch+px; if(!emo[k]){ const c=document.createElement('canvas'); c.width=c.height=Math.ceil(px*1.25); const x=c.getContext('2d'); x.font=px+'px system-ui,"Noto Color Emoji",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(ch,c.width/2,c.height/2+px*0.06); emo[k]=c; } return emo[k]; }
function snapMoe(){ const k=K, stage=k.stage, R=k.R; const vis=[]; stage.children.forEach(c=>{ vis.push([c,c.visible]); if(c!==k.G.group) c.visible=false; }); W.setVisible(false);
 const sp=k.st.spin; k.G.group.rotation.y=0; const bg=k.S.background; k.S.background=null; const cc=R.getClearAlpha(); R.setClearAlpha(0); R.render(k.S,k.cam);
 const pts=[[0,1.0,0],[0,0,0],[-0.5,0.55,0],[0.5,0.55,0]].map(p=>{ const v=new THREE.Vector3(...p); k.G.root.localToWorld(v); v.project(k.cam); return v; }); const cv=R.domElement, w=cv.width, h=cv.height;
 let x0=Math.min(...pts.map(v=>v.x)), x1=Math.max(...pts.map(v=>v.x)), y0=Math.min(...pts.map(v=>v.y)), y1=Math.max(...pts.map(v=>v.y));
 const sx=(x0*.5+.5)*w-20, sy=(-y1*.5+.5)*h-20, sw=(x1-x0)*.5*w+40, sh=(y1-y0)*.5*h+40; const S=document.createElement('canvas'); const sc=Math.min(1,320/sw); S.width=Math.round(sw*sc); S.height=Math.round(sh*sc);
 S.getContext('2d').drawImage(cv,sx,sy,sw,sh,0,0,S.width,S.height); R.setClearAlpha(cc); k.S.background=bg; vis.forEach(([c,v])=>c.visible=v); W.setVisible(true); k.G.group.rotation.y=sp; return S; }
function variant(src,f){ const c=document.createElement('canvas'); c.width=src.width; c.height=src.height; const x=c.getContext('2d'); x.filter=f.filter||'none'; if(f.flip){ x.translate(c.width,0); x.scale(-1,1); } x.drawImage(src,0,0); x.filter='none';
 if(f.acc){ const e=emoji(f.acc,c.width*0.32); const p=f.accPos||[0.5,0.12]; x.drawImage(e,c.width*p[0]-e.width/2,c.height*p[1]-e.height/2); } return c; }
const DECO=['🌳','🌷','🍄','🪨','🎈','🧸','🌻','🐞','🦋','🌼','🏠','⛲','🍎','🪁','🐌','🌲','🎪','🚂','🐤','🧺','🍓','🌈','🎠','🐸','🦔'];
const FRONT=['🌿','🌱','🌾','🍀','🌸'];
function buildWm(level){ const n=Math.min(70,8+level*6), Wd=1400+level*90, Ht=Math.round(Wd*1.35); const rnd=Math.random; const items=[]; const size=120;
 const diff=Math.max(14,120-level*14); // Farbunterschied der Doppelgänger (Grad)
 const looks=[]; for(let i=0;i<6;i++){ const sgn=i%2?1:-1; const hue=sgn*(diff+rnd()*diff*0.6); const f={filter:'hue-rotate('+Math.round(hue)+'deg) saturate('+(0.9+rnd()*0.5).toFixed(2)+')'};
  if(level>=3&&i>=3){ f.filter='hue-rotate('+Math.round(sgn*Math.max(8,diff*0.4))+'deg) brightness('+(0.92+rnd()*0.16).toFixed(2)+')'; f.acc=['🎀','🕶️','🎩','🌸','⭐','🧢'][i]; f.accPos=f.acc==='🕶️'?[0.5,0.42]:[0.5,0.1]; }
  looks.push(variant(moeSpr,f)); }
 const place=(w,h)=>{ for(let tries=0;tries<60;tries++){ const x=80+rnd()*(Wd-160), y=Ht*0.24+rnd()*(Ht*0.72); if(!items.some(o=>o.moe!=null&&Math.hypot(o.x-x,o.y-y)<size*0.8)) return [x,y]; } return [80+rnd()*(Wd-160),Ht*0.24+rnd()*Ht*0.72]; };
 const [mx,my]=place(); items.push({img:moeSpr,x:mx,y:my,s:size*(0.85+rnd()*0.3),moe:true});
 for(let i=0;i<n;i++){ const [x,y]=place(); items.push({img:looks[i%looks.length],x,y,s:size*(0.75+rnd()*0.4)*(0.75+0.35*y/Ht),moe:false,flip:rnd()<.5}); }
 const deco=[]; for(let i=0;i<Math.round(n*1.6);i++){ const ch=DECO[(rnd()*DECO.length)|0]; const x=rnd()*Wd, y=Ht*0.2+rnd()*Ht*0.8; deco.push({img:emoji(ch,96),x,y,s:60+rnd()*70}); }
 const front=[]; for(let i=0;i<Math.round(n*0.8);i++){ const x=rnd()*Wd, y=Ht*0.25+rnd()*Ht*0.75; if(Math.hypot(x-mx,y-my)<size*0.7) continue; front.push({img:emoji(FRONT[(rnd()*FRONT.length)|0],96),x,y,s:70+rnd()*60}); }
 const all=deco.concat(items).sort((a,b)=>a.y-b.y);
 // Hintergrund einmal vorzeichnen (in halber Auflösung genügt – weich)
 const bg=document.createElement('canvas'); bg.width=Math.round(Wd/2); bg.height=Math.round(Ht/2); const x=bg.getContext('2d'); x.scale(0.5,0.5);
 let g=x.createLinearGradient(0,0,0,Ht*0.25); g.addColorStop(0,'#8fd3ff'); g.addColorStop(1,'#d9f3ff'); x.fillStyle=g; x.fillRect(0,0,Wd,Ht*0.25);
 x.fillStyle='rgba(255,255,255,.9)'; for(let i=0;i<6;i++){ const cx=rnd()*Wd, cy=40+rnd()*Ht*0.12; for(let j=0;j<5;j++){ x.beginPath(); x.arc(cx+j*38-76,cy+Math.sin(j)*12,40+rnd()*18,0,7); x.fill(); } }
 x.fillStyle='#8cc96b'; x.beginPath(); x.moveTo(0,Ht*0.25); for(let i=0;i<=20;i++) x.lineTo(i*Wd/20,Ht*0.22+Math.sin(i*1.3)*30); x.lineTo(Wd,Ht); x.lineTo(0,Ht); x.fill();
 g=x.createLinearGradient(0,Ht*0.22,0,Ht); g.addColorStop(0,'#9fd77a'); g.addColorStop(1,'#5aa548'); x.fillStyle=g; x.fillRect(0,Ht*0.26,Wd,Ht);
 for(let i=0;i<900;i++){ x.fillStyle=rnd()<.5?'rgba(40,110,40,.22)':'rgba(220,255,180,.25)'; const yy=Ht*0.26+rnd()*Ht*0.74, xx=rnd()*Wd; x.fillRect(xx,yy,3,8+rnd()*10); }
 x.strokeStyle='#e8d3a2'; x.lineWidth=90; x.lineCap='round'; x.beginPath(); x.moveTo(Wd*0.5,Ht*0.27); x.bezierCurveTo(Wd*0.1,Ht*0.45,Wd*0.9,Ht*0.7,Wd*0.4,Ht); x.stroke();
 x.strokeStyle='rgba(180,150,100,.35)'; x.lineWidth=6; x.setLineDash([2,26]); x.stroke(); x.setLineDash([]);
 return {Wd,Ht,all,front,items,moe:items[0],bg,level,found:false,t0:performance.now()};
}
function draw(){ if(!wm) return; wm.dirty=false; const c=wm.cv, x=c.getContext('2d'), d=wm.dpr; x.setTransform(1,0,0,1,0,0); x.fillStyle='#5aa548'; x.fillRect(0,0,c.width,c.height);
 x.setTransform(wm.s*d,0,0,wm.s*d,wm.ox*d,wm.oy*d); x.imageSmoothingQuality='high'; x.drawImage(wm.sc.bg,0,0,wm.sc.Wd,wm.sc.Ht);
 const dr=o=>{ const w=o.s, h=o.s*o.img.height/o.img.width; if(o.flip){ x.save(); x.translate(o.x,0); x.scale(-1,1); x.drawImage(o.img,-w/2,o.y-h,w,h); x.restore(); } else x.drawImage(o.img,o.x-w/2,o.y-h,w,h); };
 x.fillStyle='rgba(30,60,20,.18)'; wm.sc.items.forEach(o=>{ x.beginPath(); x.ellipse(o.x,o.y-4,o.s*0.32,o.s*0.07,0,0,7); x.fill(); });
 wm.sc.all.forEach(dr); wm.sc.front.forEach(dr);
 if(wm.ring){ const m=wm.sc.moe, r=wm.ring; x.lineWidth=8/wm.s; x.strokeStyle=r.c; x.beginPath(); x.arc(r.x,r.y,r.r,0,7); x.stroke(); } }
function req(){ if(wm&&!wm.dirty){ wm.dirty=true; requestAnimationFrame(draw); } }
function clamp(){ const vw=innerWidth, vh=innerHeight, s=wm.s, W_=wm.sc.Wd*s, H_=wm.sc.Ht*s; wm.ox=W_<vw?(vw-W_)/2:Math.min(0,Math.max(vw-W_,wm.ox)); wm.oy=H_<vh?(vh-H_)/2:Math.min(0,Math.max(vh-H_,wm.oy)); }
function zoomAt(f,cx,cy){ const s0=wm.s, s1=Math.max(wm.minS,Math.min(3.2,s0*f)); wm.ox=cx-(cx-wm.ox)*s1/s0; wm.oy=cy-(cy-wm.oy)*s1/s0; wm.s=s1; clamp(); req(); }
let wui;
function buildWui(){ wui=document.createElement('div'); wui.id='wimmel'; wui.innerHTML='<canvas id="wmC"></canvas><div class="wtop"><div class="wcard"><canvas id="wmT"></canvas><span>Finde<br>Giß-Moe!</span></div><div class="wst"><span id="wmL">Level 1</span><span id="wmB"></span></div></div>'+
 '<div class="wbtn"><button id="wmIn">＋</button><button id="wmOut">－</button><button id="wmHint">💡</button><button id="wmX">✕</button></div><div id="wmMsg"></div><div id="wmDone"><div><h2 id="wmDT">Gefunden! 🎉</h2><p id="wmDP"></p><button id="wmNext">Nächstes Level ▶</button><button id="wmEnd">Fertig</button></div></div>';
 document.body.appendChild(wui); wui.addEventListener('pointerdown',e=>e.stopPropagation());
 const $=id=>document.getElementById(id); const cv=$('wmC');
 const P=new Map(); let pinch=null, tap=null;
 cv.addEventListener('pointerdown',e=>{ e.preventDefault(); K.V.unlock(); cv.setPointerCapture(e.pointerId); P.set(e.pointerId,[e.clientX,e.clientY]); if(P.size===1) tap={x:e.clientX,y:e.clientY,t:performance.now(),m:0}; else { tap=null; const [a,b]=[...P.values()]; pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])}; } });
 cv.addEventListener('pointermove',e=>{ if(!P.has(e.pointerId)||!wm) return; const [px,py]=P.get(e.pointerId); P.set(e.pointerId,[e.clientX,e.clientY]);
  if(P.size>=2&&pinch){ const [a,b]=[...P.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]); zoomAt(d/pinch.d,(a[0]+b[0])/2,(a[1]+b[1])/2); pinch.d=d; return; }
  wm.ox+=e.clientX-px; wm.oy+=e.clientY-py; if(tap) tap.m+=Math.hypot(e.clientX-px,e.clientY-py); clamp(); req(); });
 const up=e=>{ P.delete(e.pointerId); if(P.size<2) pinch=null; if(tap&&e.type==='pointerup'&&tap.m<12&&performance.now()-tap.t<600){ const now=performance.now(); if(wm.lastTap&&now-wm.lastTap<300&&Math.hypot(e.clientX-wm.ltx,e.clientY-wm.lty)<30){ zoomAt(1.8,e.clientX,e.clientY); wm.lastTap=0; } else { wm.lastTap=now; wm.ltx=e.clientX; wm.lty=e.clientY; pick(e.clientX,e.clientY); } } tap=null; };
 cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
 cv.addEventListener('wheel',e=>{ e.preventDefault(); zoomAt(Math.exp(-e.deltaY*0.0015),e.clientX,e.clientY); },{passive:false});
 const B=(id,f)=>$(id).addEventListener('pointerup',e=>{ e.stopPropagation(); K.V.unlock(); f(); });
 B('wmIn',()=>zoomAt(1.5,innerWidth/2,innerHeight/2)); B('wmOut',()=>zoomAt(1/1.5,innerWidth/2,innerHeight/2)); B('wmHint',hint); B('wmX',W.closeWimmel); B('wmEnd',W.closeWimmel); B('wmNext',()=>startLevel(wm.sc.level+1)); }
function msg(t,ms){ const m=document.getElementById('wmMsg'); m.innerHTML=t; m.classList.add('show'); clearTimeout(msg.t); msg.t=setTimeout(()=>m.classList.remove('show'),ms||1600); }
function clip(t){ const r=window.GissFun&&GissFun.clip(t); if(!r&&window.speechSynthesis){ /* still ok – silent */ } }
function pick(cx,cy){ if(!wm||wm.sc.found) return; const wx=(cx-wm.ox)/wm.s, wy=(cy-wm.oy)/wm.s; const tol=Math.max(1,26/wm.s);
 let best=null; wm.sc.items.forEach(o=>{ const h=o.s*o.img.height/o.img.width; const dx=Math.abs(wx-o.x), dy=wy-(o.y-h/2); if(dx<o.s*0.42+tol&&Math.abs(dy)<h*0.5+tol){ if(!best||o.y>best.y) best=o; } });
 if(best&&best.moe) return found(); if(best){ K.V.pop(); msg(['Das bin ich nicht! 😄','Nö, das ist mein Cousin! 🙃','Fast! Schau genau hin 👀','Hihi, falscher Moe!'][(Math.random()*4)|0]); wm.miss++; best.wig=1; } else { wm.miss++; } }
function found(){ const sc=wm.sc, m=sc.moe; sc.found=true; const h=m.s*m.img.height/m.img.width; wm.ring={x:m.x,y:m.y-h/2,r:m.s*0.65,c:'#ffd84a'}; req();
 K.V.chime(); clip('Gefunden!'); const secs=Math.round((performance.now()-sc.t0)/1000); const stars=wm.miss===0&&!wm.hinted?3:wm.miss<3?2:1; K.M.wimmelLv=Math.max(K.M.wimmelLv||0,sc.level); K.save(); K.xp(2);
 for(let i=0;i<24;i++){ const e=document.createElement('div'); e.className='pf'; e.textContent=['🎉','⭐','✨','💛'][i%4]; e.style.left=innerWidth/2+'px'; e.style.top=innerHeight*0.45+'px'; e.style.setProperty('--dx',(Math.random()-.5)*innerWidth+'px'); e.style.setProperty('--dy',(Math.random()-.7)*innerHeight*0.7+'px'); e.style.setProperty('--s0',.5); e.style.setProperty('--s1',1.4); e.style.setProperty('--d','1.8s'); e.style.fontSize='34px'; e.style.zIndex=40; document.body.appendChild(e); setTimeout(()=>e.remove(),1900); }
 setTimeout(()=>{ document.getElementById('wmDT').textContent=['Gefunden! 🎉','Juhu, da bin ich! 🥳','Super Adlerauge! 🦅'][(Math.random()*3)|0]; document.getElementById('wmDP').innerHTML='⭐'.repeat(stars)+'<span style="opacity:.25">'+'⭐'.repeat(3-stars)+'</span><br>in '+secs+' Sekunden · Level '+sc.level; document.getElementById('wmDone').classList.add('show'); clip('Hier bin ich!'); },1100); }
function hint(){ if(!wm||wm.sc.found) return; wm.hinted=true; const m=wm.sc.moe; const h=m.s*m.img.height/m.img.width; const r=Math.max(260,wm.sc.Wd*0.22); const ox=(Math.random()-.5)*r*0.8, oy=(Math.random()-.5)*r*0.8; wm.ring={x:m.x+ox,y:m.y-h/2+oy,r:r,c:'rgba(255,230,90,.9)'};
 wm.s=Math.max(wm.minS,Math.min(3.2,innerWidth/(r*2.4))); wm.ox=innerWidth/2-(m.x+ox)*wm.s; wm.oy=innerHeight/2-(m.y-h/2+oy)*wm.s; clamp(); req(); msg('Irgendwo im gelben Kreis! 💡',2200); setTimeout(()=>{ if(wm&&!wm.sc.found){ wm.ring=null; req(); } },4000); }
function startLevel(lv){ document.getElementById('wmDone').classList.remove('show'); if(!moeSpr) moeSpr=snapMoe(); const sc=buildWm(lv); const cv=document.getElementById('wmC'); const dpr=Math.min(2,devicePixelRatio||1);
 cv.width=Math.round(innerWidth*dpr); cv.height=Math.round(innerHeight*dpr); wm={sc,cv,dpr,s:1,ox:0,oy:0,miss:0,hinted:false,ring:null,dirty:false}; wm.minS=Math.min(innerWidth/sc.Wd,innerHeight/sc.Ht); wm.s=Math.max(wm.minS,innerHeight/sc.Ht*1.1); wm.ox=(innerWidth-sc.Wd*wm.s)/2; wm.oy=(innerHeight-sc.Ht*wm.s)/2; clamp();
 const T=document.getElementById('wmT'); T.width=moeSpr.width; T.height=moeSpr.height; T.getContext('2d').drawImage(moeSpr,0,0); document.getElementById('wmL').textContent='Level '+lv; document.getElementById('wmB').textContent=K.M.wimmelLv?'🏆 '+K.M.wimmelLv:'';
 req(); msg(lv===1?'Wisch zum Schauen, zieh mit zwei Fingern zum Zoomen! 🔍':'Level '+lv+' – noch mehr Doppelgänger! 👀',2600); }
W.openWimmel=async()=>{ const k=K; document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show')); if(k.st.mode==='sleep') await k.wake(); k.begin(); k.rest(); k.A.lid=0.05; k.A.low=0.3; await wait(300);
 moeSpr=snapMoe(); k.st.wimmel=true; wui.classList.add('show'); startLevel(Math.max(1,K.M.wimmelLv?Math.min(K.M.wimmelLv,9):1)); clip('Such mich!'); };
W.closeWimmel=()=>{ K.st.wimmel=false; wui.classList.remove('show'); wm=null; K.interact(); K.rest(); };
addEventListener('resize',()=>{ if(!wm) return; const dpr=wm.dpr; wm.cv.width=Math.round(innerWidth*dpr); wm.cv.height=Math.round(innerHeight*dpr); wm.minS=Math.min(innerWidth/wm.sc.Wd,innerHeight/wm.sc.Ht); clamp(); req(); });
W.init=function(k){ K=k; THREE=k.THREE; if(!document.getElementById('wlockcss')){ const st=document.createElement('style'); st.id='wlockcss'; st.textContent='.wi{position:relative}.wi em{font:700 10px system-ui;font-style:normal;opacity:.8}.wi.lock i{filter:grayscale(1) opacity(.45)}.wi.lock span{opacity:.5}.wi.lock::after{content:"🔒";position:absolute;top:4px;right:6px;font-size:18px}'; document.head.appendChild(st); } buildPanel(); buildWui(); const w=K.M.wear||{}; for(const s in w) if(w[s]) wear(s,w[s],true);
 if(!K.M.halloSeen) setTimeout(()=>{ if(K.st.busy||K.st.game||K.M.halloSeen) return; K.M.halloSeen=1; K.save(); K.toast('🎃 Neu im Kleiderschrank: Halloween-Kostüme! 👻'); try{ K.V.chime&&K.V.chime(); }catch(e){} K.say('Juhu! Im Kleiderschrank sind Halloween-Kostüme! Schau mal rein!'); },9000); };
W._={wear,get wm(){return wm;},found,pick};
window.GissWear=W;
})();
