/* Giß-Moe 3.2 – Weihnachten & Silvester: Adventskalender (ab 1. Dezember), Leckereien, Weihnachtsmann-Kostüm,
   Gedichte, Moe Jump (Türchen 24), Silvester (31.12.–1.1.), Winter-Kleidung, mehr Moe-Geräusche. */
(function(){
'use strict';
let K=null, THREE=null, T=window.AFRAME&&AFRAME.THREE; const X={};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const WL=window.GissWear&&GissWear.lib, GF=window.GissFun;
/* ---------- Datum (nur das echte Gerätedatum) ---------- */
const D=()=>new Date();
function season(){ const d=D(), m=d.getMonth(), g=d.getDate(); return m===11||(m===0&&g<=6); }
function silvester(){ const d=D(), m=d.getMonth(), g=d.getDate(); return (m===11&&g===31)||(m===0&&g===1); }
function today(){ const d=D(); if(d.getMonth()===0&&d.getDate()<=6) return 25; return d.getMonth()===11?d.getDate():0; }
const canOpen=n=>season()&&today()>=n;
const sYear=()=>{ const d=D(); return d.getMonth()===0?d.getFullYear()-1:d.getFullYear(); };
function XS(){ const M=K.M; let x=M.xm; if(!x){ x=M.xm={seed:(Math.random()*1e9)|0,open:{},got:{},hi:0,year:sYear()}; }
 if(season()&&x.year!==sYear()){ x.year=sYear(); x.open={}; x.plan=null; x.seed=(Math.random()*1e9)|0; }
 x.open=x.open||{}; x.got=x.got||{}; return x; }
const own=id=>!!(K&&XS().got[id]);
function rng(s){ return ()=>{ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function shuf(a,r){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
/* ---------- Sounds (ElevenLabs, test/lib/giss/xmas/) ---------- */
const SND={}, SNDL=['door','glitter','jump','spring','rocket','coin','crack','fall','firework','knaller','sparkler','bells','m_purr','m_snore','m_munch','m_sneeze','m_splash','m_slurp','m_gulp','m_burp','m_drops']; let sndLoading=false;
function loadSnd(){ if(sndLoading||!K.V.ctx) return; sndLoading=true; SNDL.forEach(n=>fetch(K.base+'xmas/'+n+'.mp3').then(r=>r.arrayBuffer()).then(b=>K.V.ctx.decodeAudioData(b)).then(buf=>{ SND[n]=buf; }).catch(e=>console.warn('xmas snd',n,e))); }
function S(n,gain,o){ o=o||{}; const c=K.V.ctx, b=SND[n]; if(!c||!b) return null; try{ const s=c.createBufferSource(); s.buffer=b; s.loop=!!o.loop; if(o.rate) s.playbackRate.value=o.rate; const g=c.createGain(); g.gain.value=gain==null?0.8:gain; s.connect(g); g.connect(K.V.out||c.destination); s.start(c.currentTime+(o.at||0)); s.onended=()=>{ try{ g.disconnect(); }catch(e){} }; return {s,g,dur:b.duration/(o.rate||1)}; }catch(e){ return null; } }
X.S=S;
function wrapVoice(){ const V=K.V; if(V.__x) return; V.__x=1; const o={snore:V.snore,purr:V.purr,sneeze:V.sneeze,chomp:V.chomp,panic:V.panic}; let lastMunch=0, sn=0;
 V.snore=function(){ if(SND.m_snore&&(sn++%3)!==2){ S('m_snore',0.55,{rate:0.94+Math.random()*0.1}); return {dur:2.3,mouth:[]}; } return o.snore.apply(this,arguments); };
 V.purr=function(){ const r=o.purr.apply(this,arguments); S('m_purr',0.5); return r; };
 V.sneeze=function(){ if(SND.m_sneeze&&Math.random()<0.65){ const p=S('m_sneeze',0.9); const d=p?p.dur:1.1; return {dur:d,mouth:[[0,d*0.35],[d*0.45,d*0.85]]}; } return o.sneeze.apply(this,arguments); };
 V.chomp=function(){ const n=performance.now(); if(SND.m_munch){ if(n-lastMunch>1100){ lastMunch=n; S('m_munch',0.75,{rate:0.95+Math.random()*0.12}); } return; } return o.chomp.apply(this,arguments); };
 V.panic=function(){ S('m_splash',0.7); return o.panic.apply(this,arguments); }; }
/* ---------- 3D-Kleidung ---------- */
function wearItems(){ const L=WL; if(!L||!L.ITEMS) return; const {ITEMS,std,tex,noiseTex,shell,ptAt,FUR,onHead}=L;
 const PI=Math.PI; const mat=(c,o)=>std(c,o);
 const plush=c=>new T.MeshPhysicalMaterial({color:c,roughness:1,sheen:1,sheenColor:new T.Color(0xffffff),sheenRoughness:0.4});
 /* flauschige Kugel (Bommel, Pelz) */
 function fluff(r,c,seg){ const gm=new T.IcosahedronGeometry(r,seg||3); const p=gm.attributes.position, v=new T.Vector3(); for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); const n=1+(Math.sin(v.x*91)+Math.sin(v.y*73+1)+Math.sin(v.z*57+2))*0.035; v.multiplyScalar(n); p.setXYZ(i,v.x,v.y,v.z); } gm.computeVertexNormals(); return new T.Mesh(gm,plush(c)); }
 function knit(base,draw){ return tex((x,w,h)=>{ x.fillStyle=base; x.fillRect(0,0,w,h); if(draw) draw(x,w,h); const im=x.getImageData(0,0,w,h), d=im.data; for(let yy=0;yy<h;yy++) for(let xx=0;xx<w;xx++){ const i=(yy*w+xx)*4, k=((xx%6<3)^((yy>>2)%2))?10:-10, n=(Math.random()-0.5)*14; d[i]+=k+n; d[i+1]+=k+n; d[i+2]+=k+n; } x.putImageData(im,0,0); },512,256); }
 /* gebogene Zipfelmütze (Hut-Koordinaten wie Bommelmütze) */
 function stocking(col,len,lean){ const g=new T.Group(); const pts=[]; for(let i=0;i<=24;i++){ const v=i/24; pts.push(new T.Vector2(Math.max(0.004,0.168*Math.pow(1-v,0.75)*(1+0.12*Math.sin(v*PI))),v*len)); }
   const gm=new T.LatheGeometry(pts,48); const p=gm.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i), v=y/len; p.setX(i,p.getX(i)+lean*Math.pow(v,2.2)); p.setY(i,y-len*0.38*Math.pow(v,2.6)); } gm.computeVertexNormals();
   const m=new T.Mesh(gm,col); g.add(m); const tip=new T.Vector3(lean,len-len*0.38,0); return {g,tip}; }
 const santaTag={lockMsg:'🎄 Versteckt im Adventskalender!',lockTag:'🎄 Kalender'};
 const sLock=id=>Object.assign({lock:()=>!own(id),hide:()=>!own(id)&&!season()},santaTag);
 const silLock=id=>({lock:()=>!own('silvester'),hide:()=>!own('silvester'),lockMsg:'🎆 Gibt es an Silvester!',lockTag:'🎆 Silvester'});
 const velvet=()=>new T.MeshPhysicalMaterial({color:0xc8102e,roughness:0.62,sheen:1,sheenColor:new T.Color(0xff6a7a),sheenRoughness:0.45,side:T.DoubleSide});
 const white=()=>new T.MeshPhysicalMaterial({color:0xfbf8f2,roughness:1,sheen:1,sheenColor:new T.Color(0xffffff),sheenRoughness:0.3,side:T.DoubleSide});
 const fh=(id,arr,it)=>{ if(!ITEMS[id].some(x=>x.id===it.id)) ITEMS[id].push(it); };
 /* --- Mützen --- */
 fh('hat',0,Object.assign({id:'nikomuetze',e:'🎅',n:'Weihnachtsmütze',say:'Ho ho ho!',make(){ const g=new T.Group(); const s=stocking(velvet(),0.36,0.2); s.g.position.y=0.02; g.add(s.g);
   const rim=new T.Mesh(new T.TorusGeometry(0.162,0.042,16,56),white()); rim.rotation.x=PI/2; rim.position.y=0.012; rim.scale.set(1,1,0.8); g.add(rim);
   const pom=fluff(0.052,0xffffff); pom.position.copy(s.tip).add(new T.Vector3(0.02,0.0,0)); pom.position.y+=0.02; g.add(pom); return g; }},sLock('nikomuetze')));
 fh('hat',0,{id:'pudelmuetze',e:'❄️',n:'Winter-Pudelmütze',make(){ const g=new T.Group();
   const t=knit('#c6263a',(x,w,h)=>{ x.fillStyle='#fff7ee'; x.fillRect(0,h*0.08,w,h*0.07); x.fillRect(0,h*0.5,w,h*0.07); for(let i=0;i<10;i++){ const cx=(i+0.5)*w/10, cy=h*0.32; x.fillRect(cx-3,cy-18,6,36); x.fillRect(cx-18,cy-3,36,6); x.save(); x.translate(cx,cy); x.rotate(PI/4); x.fillRect(-2.5,-14,5,28); x.fillRect(-14,-2.5,28,5); x.restore(); } x.fillStyle='#1f6b45'; for(let i=0;i<20;i++){ x.beginPath(); x.moveTo(i*w/20,h*0.72); x.lineTo((i+0.5)*w/20,h*0.62); x.lineTo((i+1)*w/20,h*0.72); x.fill(); } });
   const d=new T.Mesh(new T.SphereGeometry(0.165,40,20,0,PI*2,0,PI/2),new T.MeshPhysicalMaterial({map:t,roughness:1,sheen:0.6,sheenColor:new T.Color(0xffffff)})); d.scale.y=1.02; g.add(d);
   const rib=tex((x,w,h)=>{ for(let i=0;i<48;i++){ x.fillStyle=i%2?'#e9e2d6':'#fffaf1'; x.fillRect(i*w/48,0,w/48+1,h); } },256,16);
   const cuff=new T.Mesh(new T.CylinderGeometry(0.172,0.168,0.07,48,1,true),new T.MeshPhysicalMaterial({map:rib,roughness:1,side:T.DoubleSide})); cuff.position.y=0.012; g.add(cuff);
   const cr=new T.Mesh(new T.TorusGeometry(0.17,0.012,8,48),new T.MeshPhysicalMaterial({color:0xfffaf1,roughness:1})); cr.rotation.x=PI/2; cr.position.y=0.047; g.add(cr);
   const pom=fluff(0.075,0xfff7ee,4); pom.position.y=0.2; g.add(pom); return g; }});
 fh('hat',0,{id:'rentier',e:'🦌',n:'Rentier-Geweih',say:'Ich bin Rudolph!',make(){ const g=new T.Group(); const brown=mat(0x8a5a35,{roughness:0.7,clearcoat:0.1}), band=mat(0x6b3b1f,{roughness:0.5});
   const arc=new T.Mesh(new T.TorusGeometry(0.155,0.012,8,40,PI),band); arc.position.y=-0.03; g.add(arc);
   [-1,1].forEach(s=>{ const a=new T.Group(); const main=[new T.Vector3(0,0,0),new T.Vector3(s*0.03,0.08,0),new T.Vector3(s*0.07,0.16,-0.01),new T.Vector3(s*0.06,0.24,-0.02)];
     a.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(main),16,0.016,8),brown));
     [[0.35,0.09],[0.62,0.07],[0.85,0.06]].forEach(([k,l],i)=>{ const b=new T.CatmullRomCurve3(main).getPoint(k); const e=b.clone().add(new T.Vector3(s*(i===1?0.07:-0.03)+s*0.02,l,0.015)); a.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([b,b.clone().lerp(e,0.5).add(new T.Vector3(s*0.01,0,0)),e]),8,0.011,6),brown)); });
     main.forEach((p,i)=>{ if(i===main.length-1){ const c=new T.Mesh(new T.SphereGeometry(0.016,10,8),brown); c.position.copy(p); a.add(c); } });
     a.position.set(s*0.1,0.0,0); a.rotation.z=-s*0.15; g.add(a);
     const bell=new T.Mesh(new T.SphereGeometry(0.022,14,10),mat(0xf2c14e,{metalness:0.9,roughness:0.25})); bell.position.set(s*0.135,0.005,0.03); g.add(bell); });
   const holly=new T.Group(); [-1,1].forEach(s=>{ const lf=new T.Mesh(new T.SphereGeometry(0.03,12,8),mat(0x2e8b3e,{roughness:0.4,clearcoat:0.8})); lf.scale.set(1.4,0.35,0.7); lf.position.set(s*0.03,0,0); lf.rotation.z=s*0.4; holly.add(lf); });
   [0,1,2].forEach(i=>{ const b=new T.Mesh(new T.SphereGeometry(0.012,10,8),mat(0xd81e3c,{roughness:0.2,clearcoat:1})); b.position.set((i-1)*0.013,0.012,0.012); holly.add(b); }); holly.position.set(0.0,0.0,0.155); holly.rotation.x=0.4; g.add(holly); return g; }});
 fh('hat',0,Object.assign({id:'silvesterhut',e:'🎩',n:'Glitzer-Zylinder',say:'Prosit Neujahr!',make(){ const g=new T.Group();
   const gl=tex((x,w,h)=>{ x.fillStyle='#1d1a2e'; x.fillRect(0,0,w,h); for(let i=0;i<1400;i++){ const c=['#ffd76a','#fff1b8','#e7b43a','#ffffff'][i%4]; x.fillStyle=c; x.globalAlpha=0.35+Math.random()*0.65; x.fillRect(Math.random()*w,Math.random()*h,1.6,1.6); } x.globalAlpha=1; },256,128);
   const m=new T.MeshPhysicalMaterial({map:gl,roughness:0.3,metalness:0.6,clearcoat:1,clearcoatRoughness:0.15,iridescence:0.4});
   const brim=new T.Mesh(new T.CylinderGeometry(0.19,0.19,0.016,48),m); const top=new T.Mesh(new T.CylinderGeometry(0.115,0.12,0.19,48),m); top.position.y=0.1;
   const band=new T.Mesh(new T.CylinderGeometry(0.123,0.123,0.04,48),mat(0xf2c14e,{metalness:0.95,roughness:0.2})); band.position.y=0.03; g.add(brim,top,band);
   const star=new T.Shape(); for(let i=0;i<10;i++){ const r=i%2?0.017:0.04, a=i/10*PI*2; star[i?'lineTo':'moveTo'](Math.sin(a)*r,Math.cos(a)*r); }
   const sm=new T.Mesh(new T.ExtrudeGeometry(star,{depth:0.008,bevelEnabled:true,bevelSize:0.003,bevelThickness:0.003,bevelSegments:1}),mat(0xffe27a,{metalness:0.9,roughness:0.15,emissive:0x664400}));
   sm.position.set(0.05,0.035,0.115); sm.rotation.y=0.4; g.add(sm);
   const tin=new T.Group(); for(let i=0;i<9;i++){ const f=new T.Mesh(new T.ConeGeometry(0.006,0.06,4),mat([0xff5fa2,0x5fd7ff,0xffe27a][i%3],{metalness:0.8,roughness:0.2})); f.position.set(-0.06+(i%3)*0.008,0.05+Math.floor(i/3)*0.006,0.1); f.rotation.z=PI+(i-4)*0.18; tin.add(f); } g.add(tin);
   g.rotation.z=-0.12; return g; }},silLock('silvesterhut')));
 /* --- Brille: Sternenbrille (Silvester) --- */
 fh('glasses',0,Object.assign({id:'sternbrille',e:'🌟',n:'Glitzer-Sternbrille',say:'Ich sehe Sterne!',make(){ const g=new T.Group(); const E=(K.G.LM&&K.G.LM.eyeL)||[-0.1036,0.6911,0.2406]; const dx=Math.abs(E[0])*1.06;
   const gold=mat(0xf5c84c,{metalness:0.9,roughness:0.2,clearcoat:1}), lens=new T.MeshPhysicalMaterial({color:0xff7ac8,transparent:true,opacity:0.32,roughness:0.05,transmission:0,side:T.DoubleSide});
   const star=(R,r)=>{ const s=new T.Shape(); for(let i=0;i<10;i++){ const rr=i%2?r:R, a=i/10*PI*2; s[i?'lineTo':'moveTo'](Math.sin(a)*rr,Math.cos(a)*rr); } s.closePath(); return s; };
   [-1,1].forEach(s=>{ const outer=star(0.082,0.045), hole=star(0.066,0.033); outer.holes.push(hole); const fr=new T.Mesh(new T.ExtrudeGeometry(outer,{depth:0.008,bevelEnabled:true,bevelSize:0.003,bevelThickness:0.003,bevelSegments:1}),gold); fr.position.set(s*dx,0,0); g.add(fr);
     const ln=new T.Mesh(new T.ShapeGeometry(star(0.068,0.035)),lens); ln.position.set(s*dx,0,0.004); g.add(ln);
     const arm=new T.Mesh(new T.CylinderGeometry(0.005,0.005,0.15,6),gold); arm.rotation.x=PI/2; arm.position.set(s*(dx+0.075),0.01,-0.075); g.add(arm); });
   const br=new T.Mesh(new T.TorusGeometry(0.024,0.005,6,16,PI),gold); br.position.y=0.012; g.add(br); return g; }},silLock('sternbrille')));
 /* --- Hals: Weihnachtsmann-Bart, Weihnachtsschal, Glitzer-Fliege --- */
 fh('neck',0,Object.assign({id:'nikobart',e:'🧔',n:'Weihnachtsmann-Bart',say:'Ho ho ho! Ich hab einen Bart!',make(){ const g=new T.Group(); const H=new T.Group(); H.name='H'; const wm=white();
   const rows=[[-0.46,0.74,7,0.062,0.334],[-0.62,0.64,7,0.07,0.338],[-0.78,0.5,6,0.076,0.344],[-0.94,0.34,4,0.078,0.352],[-1.1,0.16,3,0.074,0.362]];
   rows.forEach(([dy,wx,n,r,dd])=>{ for(let i=0;i<n;i++){ const u=n===1?0:i/(n-1)*2-1; const o=onHead([u*wx,dy,1-Math.abs(u)*0.42],dd); const b=fluff(r*(1-Math.abs(u)*0.18),0xfffdf8,3); b.material.emissive=new T.Color(0x3a3833); b.position.copy(o.p); b.scale.set(1.1,1.2,0.62); b.lookAt(o.p.clone().add(o.n)); b.rotation.z+=u*0.3; H.add(b); } });
   const tip=fluff(0.068,0xfffdf8,3); tip.material.emissive=new T.Color(0x3a3833); const ot=onHead([0,-1.26,0.9],0.372); tip.position.copy(ot.p); tip.scale.set(0.9,1.3,0.6); H.add(tip);
   [-1,1].forEach(s=>{ const o=onHead([s*0.3,-0.3,1],0.352); const m=fluff(0.046,0xfffdf8,3); m.material.emissive=new T.Color(0x3a3833); m.position.copy(o.p); m.scale.set(1.7,0.7,0.6); m.rotation.z=-s*0.3; H.add(m); });
   g.add(H); return g; }},sLock('nikobart')));
 fh('neck',0,{id:'xmasschal',e:'🧣',n:'Weihnachtsschal',make(){ const g=new T.Group(); const t=knit('#1f6b45',(x,w,h)=>{ for(let i=0;i<16;i++){ x.fillStyle=i%2?'#c6263a':'#1f6b45'; x.fillRect(i*w/16,0,w/16+1,h); } x.fillStyle='#fff7ee'; for(let i=0;i<16;i++){ const cx=(i+0.5)*w/16; x.fillRect(cx-2,h*0.3,4,h*0.4); x.fillRect(cx-9,h*0.5-2,18,4); } });
   const km=new T.MeshPhysicalMaterial({map:t,roughness:1,sheen:0.5,sheenColor:new T.Color(0xffffff)});
   const r=new T.Mesh(new T.TorusGeometry(0.29,0.055,16,56),km); r.rotation.x=PI/2+0.25; r.scale.set(1,1.05,1); g.add(r);
   [0,1].forEach(i=>{ const e=new T.Mesh(new T.BoxGeometry(0.075,0.17-i*0.03,0.03),km); e.position.set(0.1+i*0.045,-0.11+i*0.015,0.3-i*0.01); e.rotation.z=0.12+i*0.18; g.add(e);
     for(let f=0;f<5;f++){ const fr=new T.Mesh(new T.CylinderGeometry(0.004,0.004,0.03,4),new T.MeshPhysicalMaterial({color:0xfff7ee,roughness:1})); fr.position.set(-0.03+f*0.015,-(0.17-i*0.03)/2-0.013,0); e.add(fr); } });
   g.position.z=-0.06; return g; }});
 fh('neck',0,Object.assign({id:'glitzerfliege',e:'✨',n:'Glitzer-Fliege',make(){ const g=new T.Group(), s=new T.Group();
   const gl=tex((x,w,h)=>{ x.fillStyle='#b8862b'; x.fillRect(0,0,w,h); for(let i=0;i<900;i++){ x.fillStyle=['#fff3c2','#ffd76a','#ffffff','#e0a93a'][i%4]; x.beginPath(); x.arc(Math.random()*w,Math.random()*h,1.4+Math.random()*1.6,0,7); x.fill(); } },128,128);
   const m=new T.MeshPhysicalMaterial({map:gl,metalness:0.7,roughness:0.25,clearcoat:1,iridescence:0.5});
   [-1,1].forEach(q=>{ const l=new T.Mesh(new T.ConeGeometry(0.06,0.11,4),m); l.rotation.z=q*PI/2; l.position.x=q*0.055; l.scale.z=0.45; s.add(l); }); const k=new T.Mesh(new T.SphereGeometry(0.024,14,10),m); k.scale.set(1,1.1,0.8); s.add(k);
   s.position.set(0,0.02,0.25); g.add(s); return g; }},silLock('glitzerfliege')));
 /* --- Körper: Weihnachtsmann-Mantel, Ugly-Christmas-Pulli --- */
 fh('body',0,Object.assign({id:'nikomantel',e:'🧥',n:'Weihnachtsmann-Mantel',say:'Ho ho ho! Frohe Weihnachten!',make(){ const g=new T.Group(); const y0=0.06, y1=0.47;
   const off=(y,th,v)=>FUR+0.008+Math.sin(v*PI)*0.012+Math.max(0,0.2-y)*0.25;
   g.add(new T.Mesh(shell(y0,y1,0,PI*2,off,30,96),velvet()));
   const fw=white(); const hem=(a,b,e)=>new T.Mesh(shell(a,b,0,PI*2,(y,th,v)=>off(y,th,v)+e+Math.sin(th*40+y*90)*0.004,4,128),fw);
   g.add(hem(y0-0.03,y0+0.03,0.018)); g.add(new T.Mesh(shell(y1-0.03,y1+0.035,0,PI*2,(y,th,v)=>FUR+0.012+Math.sin(v*PI)*0.024+Math.sin(th*36)*0.002,8,128),fw));
   g.add(new T.Mesh(shell(y0+0.02,y1-0.005,-0.13,0.13,(y,th,v)=>off(y,th,v)+0.012+Math.sin(y*160)*0.003,24,10),fw));
   const belt=new T.MeshPhysicalMaterial({color:0x17120f,roughness:0.35,clearcoat:0.9,side:T.DoubleSide}); g.add(new T.Mesh(shell(0.225,0.255,0,PI*2,(y,th,v)=>off(y,th,0.5)+0.006+Math.sin(v*PI)*0.004,4,96),belt));
   const gold=mat(0xf2c14e,{metalness:0.95,roughness:0.2}); const bp=ptAt(0.24,0,off(0.24,0,0.5)+0.016); const bk=new T.Mesh(new T.TorusGeometry(0.03,0.008,8,4),gold); bk.rotation.z=PI/4; bk.scale.set(1.3,1,1); bk.position.copy(bp); g.add(bk);
   [0.34,0.41].forEach(y=>{ const b=new T.Mesh(new T.SphereGeometry(0.012,12,8),mat(0x17120f,{roughness:0.2,clearcoat:1})); b.position.copy(ptAt(y,0,off(y,0,(y-y0)/(y1-y0))+0.026)); g.add(b); });
   return g; }},sLock('nikomantel')));
 fh('body',0,{id:'xmaspulli',e:'🎄',n:'Weihnachtspulli',say:'Mein Weihnachtspulli! Hihi!',make(){ const g=new T.Group();
   const t=knit('#b8202f',(x,w,h)=>{ const band=(y,c1,c2)=>{ x.fillStyle=c1; x.fillRect(0,y,w,22); x.fillStyle=c2; for(let i=0;i<w/16;i++){ x.beginPath(); x.moveTo(i*16,y+18); x.lineTo(i*16+8,y+4); x.lineTo(i*16+16,y+18); x.fill(); } };
     band(h*0.06,'#1f6b45','#fff7ee'); band(h*0.78,'#1f6b45','#fff7ee');
     for(let i=0;i<6;i++){ const cx=(i+0.5)*w/6, cy=h*0.47; if(i%2){ x.fillStyle='#1f6b45'; for(let k=0;k<3;k++){ x.beginPath(); x.moveTo(cx,cy-40+k*20); x.lineTo(cx-18-k*7,cy-12+k*20); x.lineTo(cx+18+k*7,cy-12+k*20); x.fill(); } x.fillStyle='#7a4a2a'; x.fillRect(cx-4,cy+28,8,9); x.fillStyle='#ffd76a'; x.beginPath(); x.arc(cx,cy-42,6,0,7); x.fill(); [['#ffd76a',-8,-14],['#fff7ee',9,2],['#5fd7ff',-12,14],['#ffd76a',6,22]].forEach(([c,dx,dy])=>{ x.fillStyle=c; x.beginPath(); x.arc(cx+dx,cy+dy,3.2,0,7); x.fill(); }); }
       else { x.fillStyle='#fff7ee'; for(let k=0;k<4;k++){ x.save(); x.translate(cx,cy); x.rotate(k*PI/4); x.fillRect(-2.5,-24,5,48); x.restore(); } x.beginPath(); x.arc(cx,cy,6,0,7); x.fill(); } }
     x.fillStyle='#fff7ee'; for(let i=0;i<40;i++){ x.fillRect((i*53)%w,h*0.2+((i*37)%30),4,4); x.fillRect((i*71)%w,h*0.66+((i*29)%26),4,4); } });
   const m=new T.MeshPhysicalMaterial({map:t,roughness:1,sheen:0.7,sheenColor:new T.Color(0xffd0d0),sheenRoughness:0.6,side:T.DoubleSide});
   const y0=0.12, y1=0.47, off=(y,th,v)=>FUR+0.01+Math.sin(v*PI)*0.012;
   g.add(new T.Mesh(shell(y0,y1,0,PI*2,off,28,96),m));
   const rib=tex((x,w,h)=>{ for(let i=0;i<96;i++){ x.fillStyle=i%2?'#175538':'#1f6b45'; x.fillRect(i*w/96,0,w/96+1,h); } },512,16);
   const rm=new T.MeshPhysicalMaterial({map:rib,roughness:1,side:T.DoubleSide});
   g.add(new T.Mesh(shell(y0-0.02,y0+0.03,0,PI*2,(y,th)=>FUR+0.02,3,96),rm)); g.add(new T.Mesh(shell(y1-0.01,y1+0.04,0,PI*2,(y,th,v)=>FUR+0.016+v*0.01,3,96),rm));
   const pom=fluff(0.032,0xe23b3b,2); pom.position.copy(ptAt(0.31,0,off(0.31,0,0.54)+0.03)); g.add(pom); return g; }});
 /* --- Füße: Weihnachtsmann-Stiefel, Gummistiefel --- */
 function boot(c,o){ const g=new T.Group(); const up=mat(c,{roughness:o.r,clearcoat:o.cc}), sole=mat(o.sole,{roughness:0.6,clearcoat:0.1});
   [-1,1].forEach(s=>{ const f=new T.Group();
     const so=new T.Mesh(new T.CapsuleGeometry(0.078,0.1,8,20),sole); so.rotation.x=PI/2; so.scale.set(1.1,1,0.36); so.position.y=0.012; f.add(so);
     const u=new T.Mesh(new T.SphereGeometry(0.1,28,18,0,PI*2,0,PI*0.55),up); u.scale.set(0.88,0.66,1.18); u.position.y=0.022; f.add(u);
     const sh=new T.Mesh(new T.CylinderGeometry(0.068,0.075,o.h,28,1,true),up); sh.material.side=T.DoubleSide; sh.position.set(0,0.03+o.h/2,-0.03); f.add(sh);
     if(o.fur){ const r=fluff(0.03,0xfbf8f2,3); r.geometry=new T.TorusGeometry(0.072,0.026,12,32); r.rotation.x=PI/2; r.position.set(0,0.03+o.h,-0.03); f.add(r); }
     else { const r=new T.Mesh(new T.TorusGeometry(0.071,0.009,8,32),up); r.rotation.x=PI/2; r.position.set(0,0.03+o.h,-0.03); f.add(r); const tab=new T.Mesh(new T.BoxGeometry(0.03,0.03,0.008),mat(0x2f6fd0,{roughness:0.5})); tab.position.set(0,0.03+o.h+0.008,-0.1); f.add(tab);
       for(let i=0;i<3;i++){ const d=new T.Mesh(new T.SphereGeometry(0.012,10,8),mat([0xffffff,0x5fb8ff,0xff7ab0][i],{roughness:0.3,clearcoat:1})); d.scale.z=0.4; const a=s*(0.9+i*0.35); d.position.set(Math.sin(a)*0.073,0.07+i*0.02,-0.03+Math.cos(a)*0.073); d.lookAt(d.position.clone().add(new T.Vector3(Math.sin(a),0,Math.cos(a)))); f.add(d); } }
     f.position.set(s*0.13,0,0.215); f.rotation.y=s*0.12; g.add(f); }); return g; }
 fh('feet',0,Object.assign({id:'nikostiefel',e:'🥾',n:'Weihnachtsmann-Stiefel',make(){ return boot(0x161214,{r:0.25,cc:1,sole:0x2a2224,h:0.08,fur:1}); }},sLock('nikostiefel')));
 fh('feet',0,{id:'gummistiefel',e:'🌧️',n:'Gummistiefel',say:'Jetzt kann ich in Pfützen springen!',make(){ return boot(0xffd23f,{r:0.18,cc:1,sole:0x3a3a40,h:0.09}); }});
}
/* ---------- Weihnachts-Leckereien ---------- */
const FOODS=[
 {id:'lebkuchen',e:'❤️',n:'Lebkuchenherz',h:'mit Zuckerguss',draw:1},
 {id:'plaetzchen',e:'🍪',n:'Plätzchen',h:'frisch gebacken',draw:1},
 {id:'punsch',e:'🍹',n:'Kinderpunsch',h:'warm & fruchtig',draw:1},
 {id:'kakao',e:'☕',n:'Kakao mit Sahne',h:'Sahnebart!',draw:1},
 {id:'nikolaus',e:'🎅',n:'Schoko-Nikolaus',h:'zuerst die Ohren',draw:1},
 {id:'bratapfel',e:'🍎',n:'Bratapfel',h:'heiß!',draw:1},
 {id:'zimtstern',e:'⭐',n:'Zimtstern',h:'kitzelt in der Nase',draw:1},
 {id:'zuckerstange',e:'🍬',n:'Zuckerstange',h:'pfefferminzig',draw:1},
 {id:'mandeln',e:'🥜',n:'Gebrannte Mandeln',h:'knusper knusper',draw:1},
 {id:'spekulatius',e:'🍘',n:'Spekulatius',h:'Windmühlen-Keks',draw:1},
 {id:'stollen',e:'🍞',n:'Christstollen',h:'Puderzucker!',draw:1},
 {id:'mandarine',e:'🍊',n:'Mandarine',h:'saftig'},
 {id:'marzipan',e:'🐷',n:'Marzipanschwein',h:'bringt Glück'},
 {id:'kipferl',e:'🌙',n:'Vanillekipferl',h:'zart wie Schnee',draw:1},
 {id:'nuesse',e:'🌰',n:'Walnüsse',h:'knack!'},
 {id:'honigmilch',e:'🍯',n:'Honigmilch',h:'macht müde'}];
const SEKT={id:'kindersekt',e:'🥂',n:'Kindersekt',h:'prickelt (ohne Alkohol)',draw:1};
const ICON={
 lebkuchen(x){ x.save(); x.translate(80,84); x.fillStyle='rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(0,58,52,9,0,0,7); x.fill();
  const hp=()=>{ x.beginPath(); x.moveTo(0,52); x.bezierCurveTo(-70,8,-58,-52,-22,-52); x.bezierCurveTo(-8,-52,0,-40,0,-30); x.bezierCurveTo(0,-40,8,-52,22,-52); x.bezierCurveTo(58,-52,70,8,0,52); x.closePath(); };
  const g=x.createRadialGradient(-14,-20,6,0,0,70); g.addColorStop(0,'#c27a3e'); g.addColorStop(1,'#7a3f17'); x.fillStyle=g; hp(); x.fill();
  x.strokeStyle='#fff'; x.lineWidth=4; x.setLineDash([2,6]); x.lineCap='round'; x.save(); x.scale(0.84,0.84); x.translate(0,-2); hp(); x.stroke(); x.restore(); x.setLineDash([]);
  x.fillStyle='#fff'; x.font='700 28px Kalam,serif'; x.textAlign='center'; x.fillText('Moe',0,6); ['#e8243c','#3fa83a','#ffd23f'].forEach((c,i)=>{ x.fillStyle=c; x.beginPath(); x.arc(-26+i*26,24,5,0,7); x.fill(); });
  x.fillStyle='#d81e3c'; x.fillRect(-4,-62,8,22); x.restore(); },
 plaetzchen(x){ x.fillStyle='rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(80,132,62,12,0,0,7); x.fill();
  const ck=(cx,cy,sh,rot,c)=>{ x.save(); x.translate(cx,cy); x.rotate(rot); const g=x.createRadialGradient(-6,-6,4,0,0,34); g.addColorStop(0,'#f6cf86'); g.addColorStop(1,'#c98a3a'); x.fillStyle=g; x.beginPath(); sh(); x.fill(); x.strokeStyle='rgba(120,70,20,.5)'; x.lineWidth=2; x.stroke(); x.fillStyle=c; x.save(); x.scale(0.62,0.62); x.beginPath(); sh(); x.fill(); x.restore(); x.restore(); };
  const star=()=>{ for(let i=0;i<10;i++){ const r=i%2?14:32, a=i/10*Math.PI*2; x[i?'lineTo':'moveTo'](Math.sin(a)*r,-Math.cos(a)*r); } x.closePath(); };
  const heart=()=>{ x.moveTo(0,26); x.bezierCurveTo(-40,2,-30,-30,-10,-28); x.bezierCurveTo(-4,-28,0,-22,0,-16); x.bezierCurveTo(0,-22,4,-28,10,-28); x.bezierCurveTo(30,-30,40,2,0,26); x.closePath(); };
  const circ=()=>{ x.arc(0,0,28,0,7); };
  ck(48,96,circ,0,'#f3eadf'); ck(112,92,heart,0.2,'#e8243c'); ck(80,62,star,-0.15,'#fff7ee');
  for(let i=0;i<14;i++){ x.fillStyle=['#e8243c','#3fa83a','#ffd23f','#3fa7ff'][i%4]; x.fillRect(36+((i*37)%30),84+((i*17)%22),4,2); } },
 punsch(x){ x.fillStyle='rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(78,140,44,9,0,0,7); x.fill();
  x.strokeStyle='rgba(255,255,255,.7)'; x.lineWidth=8; x.beginPath(); x.arc(122,92,20,-1.3,1.3); x.stroke();
  const g=x.createLinearGradient(40,0,116,0); g.addColorStop(0,'#8e1424'); g.addColorStop(0.5,'#d8324a'); g.addColorStop(1,'#7a1020'); x.fillStyle=g; x.beginPath(); x.moveTo(38,56); x.lineTo(118,56); x.lineTo(112,136); x.lineTo(44,136); x.closePath(); x.fill();
  x.fillStyle='rgba(255,255,255,.25)'; x.fillRect(48,60,8,70); x.strokeStyle='rgba(255,255,255,.75)'; x.lineWidth=3; x.strokeRect(38,52,80,86);
  x.fillStyle='#ff9f1c'; x.beginPath(); x.arc(108,56,22,Math.PI,0); x.fill(); x.fillStyle='#ffd27a'; x.beginPath(); x.arc(108,56,17,Math.PI,0); x.fill(); x.strokeStyle='#ff9f1c'; x.lineWidth=2; for(let i=0;i<5;i++){ const a=Math.PI+i*Math.PI/4; x.beginPath(); x.moveTo(108,56); x.lineTo(108+Math.cos(a)*17,56+Math.sin(a)*17); x.stroke(); }
  x.fillStyle='#7a3f17'; x.save(); x.translate(56,40); x.rotate(-0.35); x.fillRect(-5,-26,10,56); x.restore();
  x.strokeStyle='rgba(255,255,255,.6)'; x.lineWidth=4; x.lineCap='round'; [60,80].forEach(px=>{ x.beginPath(); x.moveTo(px,34); x.bezierCurveTo(px-10,22,px+10,14,px,2); x.stroke(); }); },
 kakao(x){ x.fillStyle='rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(76,142,48,9,0,0,7); x.fill();
  x.strokeStyle='#2f6fd0'; x.lineWidth=11; x.beginPath(); x.arc(122,98,20,-1.3,1.3); x.stroke();
  const g=x.createLinearGradient(32,0,120,0); g.addColorStop(0,'#2f6fd0'); g.addColorStop(0.45,'#5fa2ff'); g.addColorStop(1,'#2458b0'); x.fillStyle=g; x.beginPath(); x.moveTo(32,64); x.lineTo(120,64); x.lineTo(114,138); x.quadraticCurveTo(76,146,38,138); x.closePath(); x.fill();
  x.fillStyle='#fff'; for(let i=0;i<6;i++){ x.beginPath(); x.arc(40+i*16,94+((i%2)*6),5,0,7); x.fill(); }
  x.fillStyle='#fffdf8'; [[48,58,18],[76,48,24],[104,58,18],[76,30,15],[62,40,14],[92,40,14]].forEach(([cx,cy,r])=>{ x.beginPath(); x.arc(cx,cy,r,0,7); x.fill(); }); x.fillStyle='#7a3f17'; for(let i=0;i<16;i++){ x.fillRect(56+((i*29)%44),30+((i*13)%26),3,3); } },
 nikolaus(x){ x.fillStyle='rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(80,146,40,8,0,0,7); x.fill();
  const g=x.createLinearGradient(44,0,116,0); g.addColorStop(0,'#8e0f1f'); g.addColorStop(0.35,'#ff4b5e'); g.addColorStop(0.55,'#d81e3c'); g.addColorStop(1,'#6a0a16'); x.fillStyle=g;
  x.beginPath(); x.moveTo(80,10); x.quadraticCurveTo(104,30,104,58); x.quadraticCurveTo(122,96,116,144); x.lineTo(44,144); x.quadraticCurveTo(38,96,56,58); x.quadraticCurveTo(56,30,80,10); x.fill();
  const gd=x.createLinearGradient(50,0,110,0); gd.addColorStop(0,'#b8862b'); gd.addColorStop(0.4,'#fff1b8'); gd.addColorStop(1,'#b8862b'); x.fillStyle=gd; x.fillRect(48,98,64,10); x.beginPath(); x.ellipse(80,62,22,20,0,0,7); x.fillStyle='#ffd9b8'; x.fill();
  x.fillStyle='#fffdf8'; x.beginPath(); x.ellipse(80,80,22,16,0,0,Math.PI); x.fill(); x.beginPath(); x.ellipse(80,44,26,7,0,0,7); x.fill(); x.beginPath(); x.arc(80,12,7,0,7); x.fill();
  x.fillStyle='#3a2416'; x.beginPath(); x.arc(72,62,3,0,7); x.arc(88,62,3,0,7); x.fill(); x.fillStyle='rgba(255,255,255,.4)'; x.beginPath(); x.ellipse(64,110,4,22,0.1,0,7); x.fill(); },
 bratapfel(x){ x.fillStyle='rgba(0,0,0,.22)'; x.beginPath(); x.ellipse(80,140,56,10,0,0,7); x.fill(); x.fillStyle='#f4f4f8'; x.beginPath(); x.ellipse(80,134,62,14,0,0,7); x.fill();
  const g=x.createRadialGradient(60,74,6,80,92,56); g.addColorStop(0,'#ff8a6a'); g.addColorStop(0.5,'#c8102e'); g.addColorStop(1,'#6a0a16'); x.fillStyle=g; x.beginPath(); x.moveTo(80,58); x.bezierCurveTo(130,40,140,110,104,130); x.quadraticCurveTo(80,140,56,130); x.bezierCurveTo(20,110,30,40,80,58); x.fill();
  x.fillStyle='#c98a3a'; x.beginPath(); x.ellipse(80,62,22,9,0,0,7); x.fill(); x.fillStyle='#7a3f17'; for(let i=0;i<6;i++){ x.beginPath(); x.ellipse(68+i*5,60+(i%2)*3,4,3,i,0,7); x.fill(); }
  x.fillStyle='rgba(255,255,255,.4)'; x.beginPath(); x.ellipse(56,86,8,16,0.4,0,7); x.fill();
  x.strokeStyle='rgba(255,255,255,.65)'; x.lineWidth=4; x.lineCap='round'; [66,92].forEach(px=>{ x.beginPath(); x.moveTo(px,44); x.bezierCurveTo(px-10,32,px+10,22,px,8); x.stroke(); }); },
 zimtstern(x){ x.fillStyle='rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(80,136,54,10,0,0,7); x.fill(); x.save(); x.translate(80,80);
  const st=(R,r)=>{ x.beginPath(); for(let i=0;i<10;i++){ const rr=i%2?r:R, a=i/10*Math.PI*2; x[i?'lineTo':'moveTo'](Math.sin(a)*rr,-Math.cos(a)*rr); } x.closePath(); };
  x.fillStyle='#8a4d22'; x.translate(0,6); st(62,28); x.fill(); x.translate(0,-6); const g=x.createLinearGradient(-40,-40,40,40); g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#efe6da'); x.fillStyle=g; st(56,25); x.fill(); x.fillStyle='rgba(200,180,160,.5)'; for(let i=0;i<20;i++) x.fillRect(((i*37)%60)-30,((i*23)%60)-30,2,2); x.restore(); },
 zuckerstange(x){ x.save(); x.lineCap='round'; x.lineWidth=22; x.strokeStyle='#fffdf8'; const p=()=>{ x.beginPath(); x.moveTo(70,146); x.lineTo(70,52); x.arc(98,52,28,Math.PI,0); x.lineTo(126,70); };
  x.shadowColor='rgba(0,0,0,.25)'; x.shadowBlur=8; x.shadowOffsetY=4; p(); x.stroke(); x.shadowColor='transparent'; x.lineWidth=22; x.strokeStyle='#e8243c'; x.setLineDash([10,14]); x.lineCap='butt'; p(); x.stroke(); x.setLineDash([]); x.lineWidth=4; x.strokeStyle='rgba(255,255,255,.6)'; x.beginPath(); x.moveTo(64,140); x.lineTo(64,54); x.stroke(); x.restore(); },
 mandeln(x){ x.fillStyle='rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(80,148,30,6,0,0,7); x.fill();
  for(let i=0;i<9;i++){ const a=i*0.7, cx=80+Math.cos(a)*(10+i*2.4), cy=46+Math.sin(a)*8-(i%3)*4; const g=x.createRadialGradient(cx-4,cy-4,2,cx,cy,14); g.addColorStop(0,'#e7a35a'); g.addColorStop(1,'#8a4d22'); x.fillStyle=g; x.beginPath(); x.ellipse(cx,cy,13,9,a,0,7); x.fill(); x.fillStyle='rgba(255,255,255,.35)'; x.fillRect(cx-3,cy-4,3,2); }
  const g=x.createLinearGradient(40,0,120,0); g.addColorStop(0,'#f6ecd8'); g.addColorStop(0.5,'#fffdf8'); g.addColorStop(1,'#e2d4b8'); x.fillStyle=g; x.beginPath(); x.moveTo(36,56); x.lineTo(124,56); x.lineTo(80,148); x.closePath(); x.fill();
  x.fillStyle='#e8243c'; x.beginPath(); x.moveTo(46,74); x.lineTo(114,74); x.lineTo(108,86); x.lineTo(52,86); x.closePath(); x.fill(); x.fillStyle='#fff'; x.font='700 11px system-ui'; x.textAlign='center'; x.fillText('MANDELN',80,84); },
 spekulatius(x){ x.fillStyle='rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(80,142,56,9,0,0,7); x.fill(); x.save(); x.translate(80,82); x.rotate(-0.08);
  const g=x.createLinearGradient(0,-56,0,56); g.addColorStop(0,'#d8964a'); g.addColorStop(1,'#a45f24'); x.fillStyle=g; x.beginPath(); x.roundRect(-44,-58,88,116,10); x.fill();
  x.strokeStyle='rgba(90,45,15,.55)'; x.lineWidth=3; x.beginPath(); x.roundRect(-36,-50,72,100,7); x.stroke();
  x.strokeStyle='rgba(255,230,190,.55)'; x.lineWidth=4; x.beginPath(); x.moveTo(-10,40); x.lineTo(-6,-6); x.lineTo(6,-6); x.lineTo(10,40); x.stroke(); x.save(); x.translate(0,-12); for(let i=0;i<4;i++){ x.rotate(Math.PI/2); x.strokeRect(2,-4,26,8); } x.restore();
  x.beginPath(); x.moveTo(-30,44); x.lineTo(30,44); x.stroke(); x.restore(); },
 stollen(x){ x.fillStyle='rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(80,132,66,11,0,0,7); x.fill();
  const g=x.createLinearGradient(0,50,0,130); g.addColorStop(0,'#fffdf8'); g.addColorStop(1,'#e8dcc8'); x.fillStyle=g; x.beginPath(); x.moveTo(14,126); x.bezierCurveTo(14,70,50,52,80,52); x.bezierCurveTo(110,52,146,70,146,126); x.closePath(); x.fill();
  x.fillStyle='#e7c48a'; x.beginPath(); x.moveTo(146,126); x.bezierCurveTo(146,98,134,80,118,72); x.lineTo(118,126); x.closePath(); x.fill(); x.fillStyle='#d8964a'; x.beginPath(); x.ellipse(132,104,10,20,0.1,0,7); x.fill();
  [['#e8243c',126,92],['#3fa83a',136,112],['#7a3f17',128,118],['#ffd23f',138,96]].forEach(([c,cx,cy])=>{ x.fillStyle=c; x.fillRect(cx,cy,5,5); });
  x.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<60;i++) x.fillRect(20+((i*37)%110),54+((i*23)%30),2,2); },
 kipferl(x){ x.fillStyle='rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(80,132,60,10,0,0,7); x.fill();
  const k=(cx,cy,r,rot)=>{ x.save(); x.translate(cx,cy); x.rotate(rot); x.fillStyle='#f0c987'; x.beginPath(); x.arc(0,0,r,Math.PI*0.15,Math.PI*0.85); x.arc(0,-r*0.25,r*0.72,Math.PI*0.8,Math.PI*0.2,true); x.closePath(); x.fill(); x.fillStyle='rgba(255,255,255,.9)'; for(let i=0;i<30;i++){ const a=Math.PI*(0.2+0.6*((i*37)%100)/100); x.fillRect(Math.cos(a)*r*0.86,Math.sin(a)*r*0.86-4,2,2); } x.restore(); };
  k(56,70,34,0.3); k(104,76,34,-0.2); k(80,100,36,0); },
 kindersekt(x){ x.fillStyle='rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(80,148,30,6,0,0,7); x.fill();
  [[-1,58],[1,102]].forEach(([s,cx])=>{ x.save(); x.translate(cx,0); x.rotate(s*0.16); x.fillStyle='rgba(230,240,255,.55)'; x.beginPath(); x.moveTo(-18,20); x.lineTo(18,20); x.lineTo(12,84); x.quadraticCurveTo(0,96,-12,84); x.closePath(); x.fill();
   const g=x.createLinearGradient(0,40,0,90); g.addColorStop(0,'#ffe27a'); g.addColorStop(1,'#f2a93a'); x.fillStyle=g; x.beginPath(); x.moveTo(-16,40); x.lineTo(16,40); x.lineTo(11,84); x.quadraticCurveTo(0,94,-11,84); x.closePath(); x.fill();
   x.fillStyle='#fff'; for(let i=0;i<6;i++){ x.beginPath(); x.arc(-6+((i*7)%14),48+i*6,1.8,0,7); x.fill(); } x.fillStyle='rgba(230,240,255,.8)'; x.fillRect(-2,92,4,40); x.beginPath(); x.ellipse(0,134,18,5,0,0,7); x.fill(); x.restore(); });
  x.fillStyle='#ffe27a'; [[80,14],[70,26],[92,24]].forEach(([cx,cy])=>{ x.save(); x.translate(cx,cy); x.beginPath(); for(let i=0;i<8;i++){ const r=i%2?2:7, a=i/8*Math.PI*2; x[i?'lineTo':'moveTo'](Math.sin(a)*r,Math.cos(a)*r); } x.fill(); x.restore(); }); }};
function regFoods(){ if(!GF||!GF.FOOD) return; FOODS.concat([SEKT]).forEach(f=>{ if(!GF.FOOD.some(x=>x.id===f.id)){ const o=Object.assign({},f); o.hide=f.id==='kindersekt'?()=>!silvester()&&!own('f_kindersekt'):()=>!own('f_'+f.id); GF.FOOD.push(o); } if(f.draw&&ICON[f.id]) GF.ICON[f.id]=ICON[f.id]; }); }
X.icon=id=>{ const c=document.createElement('canvas'); c.width=c.height=160; const x=c.getContext('2d'); if(ICON[id]) ICON[id](x); else { const f=FOODS.concat([SEKT]).find(q=>q.id===id); x.font='118px system-ui,"Noto Color Emoji",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(f?f.e:id,80,86); } return c.toDataURL(); };
/* Reaktionen (async, true = fertig) */
const XE={
 async lebkuchen(t,H){ const k=K,A=k.A,al=()=>k.alive(t); A.low=0.6; A.lid=0.4; A.blush=1; S('m_munch',0.8); H.pf('💖',()=>H.scr([0,1,0.1]),{n:6,gap:160,sx:220,dy:-120}); await H.sayW('Ein Herz für mich? Ich hab dich auch lieb!',{},300); if(!al()) return; A.hop=0.6; k.mouthPlay(k.V.giggle(4)); await wait(1400); return true; },
 async plaetzchen(t,H){ const k=K,A=k.A,al=()=>k.alive(t); for(let i=0;i<3;i++){ A.jaw=0.8; await wait(140); A.jaw=0.1; k.V.chomp(1); await wait(200); } A.lid=0.5; A.blush=0.7; H.pf('⭐',()=>H.scr([0,0.95,0.15]),{n:5,gap:140,sx:200,dy:-90}); await H.sayW('Mmh, wie bei Oma!',{},200); return al(); },
 async punsch(t,H){ const k=K,A=k.A,al=()=>k.alive(t); S('m_slurp',0.8); A.low=0.5; A.lid=0.55; await wait(900); if(!al()) return; H.FX.glow=[0.3,0.12,0.02]; A.glow=1; A.blush=1; A.pup=1.3; H.pf('♨️',()=>H.scr([0,1.0,0.1]),{n:4,gap:220,sx:120,dy:-110}); await H.sayW('Ahh, schön warm im Bauch!',{},500); return al(); },
 async kakao(t,H){ const k=K,A=k.A,al=()=>k.alive(t); S('m_slurp',0.8); A.low=0.6; A.lid=0.5; await wait(1000); if(!al()) return; H.stache.visible=true; A.lookY=-0.4; A.blush=0.8; await H.sayW('Guck mal, ich hab einen Sahnebart!',{},300); if(!al()) return; A.lookY=0; k.mouthPlay(k.V.giggle(5)); await wait(1800); return al(); },
 async nikolaus(t,H){ const k=K,A=k.A,al=()=>k.alive(t); A.lid=0.3; A.earUp=0.7; await H.sayW('Ein Schoko-Nikolaus! Zuerst die Ohren!',{},200); if(!al()) return; for(let i=0;i<3;i++){ A.jaw=0.9; await wait(130); A.jaw=0.1; k.V.chomp(1); await wait(190); } A.blush=0.9; A.low=0.6; await H.sayW('Hmmm, Vollmilch!',{},300); return al(); },
 async bratapfel(t,H){ const k=K,A=k.A,al=()=>k.alive(t); A.low=0.5; k.V.chomp(1); await wait(500); H.FX.tint=[1.3,0.75,0.6]; A.lid=-0.05; A.pup=1.4; A.earUp=1; A.trem=0.8; H.pf('🔥',()=>H.scr([0,0.65,0.3]),{n:3,gap:180,sx:100,dy:-80}); await H.sayW('Heiß, heiß, heiß!',{},150); if(!al()) return; A.trem=0; H.FX.tint=null; A.lid=0.5; A.blush=0.8; await H.sayW('Aber sooo lecker!',{},300); return al(); },
 async zimtstern(t,H){ const k=K,A=k.A,al=()=>k.alive(t); k.V.chomp(1); await wait(600); A.lid=0.7; A.earUp=0.6; A.brow=0.4; await H.sayW('Zimt kitzelt …',{},100); if(!al()) return; A.lid=1; A.sq=0.06; await wait(300); const r=k.V.sneeze(); k.mouthPlay(r); A.hop=1; H.pf('✨',()=>H.scr([0,0.62,0.35]),{n:8,gap:40,sx:260,dy:-40}); await wait((r.dur||1)*1000+200); A.hop=0; A.lid=0.2; await H.sayW('Gesundheit! Hihi!',{},300); return al(); },
 async zuckerstange(t,H){ const k=K,A=k.A,al=()=>k.alive(t); A.low=0.5; A.lid=0.4; await wait(700); H.FX.tint=[0.78,0.92,1.2]; A.lid=-0.05; A.pup=1.35; A.earUp=0.9; A.trem=0.4; H.icicles.visible=true; H.pf('❄️',()=>H.scr([0,1,0.1]),{n:6,gap:150,sx:220,dy:-100}); await H.sayW('Huiii, so frisch!',{},700); if(H.icicles) H.icicles.visible=false; A.trem=0; return al(); },
 async mandeln(t,H){ const k=K,A=k.A,al=()=>k.alive(t); for(let i=0;i<5;i++){ A.jaw=0.7; await wait(110); A.jaw=0.1; k.V.chomp(1); A.sq=0.04; await wait(150); A.sq=0; } A.blush=0.7; await H.sayW('Knusper, knusper, knäuschen!',{},300); return al(); },
 async spekulatius(t,H){ const k=K,A=k.A,al=()=>k.alive(t); k.V.chomp(1); await wait(600); A.earWig=1.4; k.st.spinV=10; H.pf('🌬️',()=>H.scr([0,0.9,0.2]),{n:3,gap:200,sx:180,dy:-60}); await H.sayW('Ich dreh mich wie eine Windmühle!',{},500); k.st.spinV=0; return al(); },
 async stollen(t,H){ const k=K,A=k.A,al=()=>k.alive(t); k.V.chomp(1); await wait(500); H.pf('☁️',()=>H.scr([0,0.62,0.35]),{n:6,gap:90,sx:200,dy:-50,s0:.5,s1:1.4}); A.lid=0.7; await wait(400); const r=k.V.sneeze(); k.mouthPlay(r); await wait((r.dur||1)*1000+200); if(!al()) return; A.blush=0.8; await H.sayW('Puderzucker! Überall!',{},300); return al(); },
 async mandarine(t,H){ const k=K,A=k.A,al=()=>k.alive(t); k.V.chomp(1); await wait(500); H.FX.glow=[0.3,0.16,0]; A.glow=1; A.pup=1.3; A.earUp=0.8; H.pf('🍊',()=>H.scr([0,1,0.1]),{n:3,gap:250,dy:-90}); await H.sayW('Saftig und süß!',{},400); return al(); },
 async marzipan(t,H){ const k=K,A=k.A,al=()=>k.alive(t); A.lid=0.4; A.blush=1; H.pf('🍀',()=>H.scr([0,1,0.1]),{n:6,gap:160,sx:240,dy:-110}); await H.sayW('Ein Glücksschwein! Oink oink!',{},200); if(!al()) return; A.hop=0.8; k.mouthPlay(k.V.giggle(4)); await wait(1400); return al(); },
 async kipferl(t,H){ const k=K,A=k.A,al=()=>k.alive(t); A.low=0.6; A.lid=0.6; k.V.chomp(1); await wait(500); H.pf('🤍',()=>H.scr([0,0.95,0.15]),{n:5,gap:180,sx:200,dy:-90}); await H.sayW('Die zergehen auf der Zunge …',{},300); return al(); },
 async nuesse(t,H){ const k=K,A=k.A,al=()=>k.alive(t); A.sq=0.1; A.brow=0.6; A.lid=0.5; await wait(500); k.V.pop&&k.V.pop(); A.sq=-0.05; A.hop=0.7; H.pf('💥',()=>H.scr([0,0.62,0.35]),{n:1,dy:-30,s0:.6,s1:1.6}); await H.sayW('Knack! Geschafft!',{},300); return al(); },
 async honigmilch(t,H){ const k=K,A=k.A,al=()=>k.alive(t); S('m_slurp',0.8); A.low=0.6; A.lid=0.5; await wait(1000); if(!al()) return; A.lid=0.75; A.earUp=-0.3; try{ k.mouthPlay(k.V.yawn()); }catch(e){} await wait(1600); if(!al()) return; await H.sayW('Mmh, Honigmilch macht so schön müde …',{},400); return al(); },
 async kindersekt(t,H){ const k=K,A=k.A,al=()=>k.alive(t); S('m_slurp',0.8); A.low=0.4; A.lid=0.45; await wait(900); if(!al()) return; H.bubbles&&H.bubbles(); A.lid=-0.05; A.pup=1.4; A.earUp=1; A.earWig=1.4; A.hop=0.9; H.pf('🫧',()=>H.scr([0,0.62,0.35]),{n:10,gap:110,sx:200,dy:-140}); await H.sayW('Das prickelt in der Nase! Prost!',{},300); if(!al()) return; try{ H.burp&&H.burp(); }catch(e){} k.mouthPlay(k.V.giggle(5)); await wait(1600); return al(); }};
/* ---------- Gedichte (gemeinfrei) ---------- */
const POEMS=[
 {n:'Advent, Advent',a:'Volksgut',t:'Advent, Advent, ein Lichtlein brennt. Erst eins, dann zwei, dann drei, dann vier, dann steht das Christkind vor der Tür.'},
 {n:'Knecht Ruprecht',a:'Theodor Storm (1862)',t:"Von drauß' vom Walde komm ich her, ich muss euch sagen, es weihnachtet sehr! Allüberall auf den Tannenspitzen sah ich goldene Lichtlein sitzen, und droben aus dem Himmelstor sah mit großen Augen das Christkind hervor."},
 {n:'Lieber, guter Weihnachtsmann',a:'Volksgut',t:'Lieber, guter Weihnachtsmann, schau mich nicht so böse an! Stecke deine Rute ein, ich will auch immer artig sein.'}];
const L=['Advent, Advent, ein Lichtlein brennt. Erst eins, dann zwei, dann drei, dann vier, dann steht das Christkind vor der Tür.',"Von drauß' vom Walde komm ich her, ich muss euch sagen, es weihnachtet sehr! Allüberall auf den Tannenspitzen sah ich goldene Lichtlein sitzen, und droben aus dem Himmelstor sah mit großen Augen das Christkind hervor.",'Lieber, guter Weihnachtsmann, schau mich nicht so böse an! Stecke deine Rute ein, ich will auch immer artig sein.'];
const SANTA=[{id:'nikomuetze',s:'hat',n:'Weihnachtsmütze',e:'🎅'},{id:'nikobart',s:'neck',n:'Weihnachtsmann-Bart',e:'🧔'},{id:'nikomantel',s:'body',n:'Weihnachtsmann-Mantel',e:'🧥'},{id:'nikostiefel',s:'feet',n:'Weihnachtsmann-Stiefel',e:'🥾'}];
function plan(){ const x=XS(); if(x.plan&&x.plan.length===25) return x.plan; const r=rng(x.seed); const P=new Array(25).fill(null);
 P[24]={t:'jump'}; P[6]={t:'food',id:'nikolaus'}; const sd=shuf([2,5,9,12,15,18,20,22],r).slice(0,4); const pcs=shuf(SANTA.slice(),r); sd.forEach((d,i)=>P[d]={t:'wear',id:pcs[i].id});
 const rest=[]; for(let d=1;d<=23;d++) if(!P[d]) rest.push(d); shuf(rest,r); [0,1,2].forEach(i=>P[rest[i]]={t:'poem',i}); const fs=shuf(FOODS.filter(f=>f.id!=='nikolaus').map(f=>f.id),r); rest.slice(3).forEach((d,i)=>P[d]={t:'food',id:fs[i]});
 x.plan=P; K.save(); return P; }
/* ---------- CSS ---------- */
const CSS=`
#toast{z-index:40}#xcal{position:fixed;inset:0;z-index:22;display:none;align-items:center;justify-content:center;flex-direction:column;background:radial-gradient(ellipse at 50% 30%,#22365f 0%,#0d1630 60%,#060a18 100%);touch-action:manipulation;overflow:hidden}
#xcal.show{display:flex}
#xcal .xsnow{position:absolute;inset:0;pointer-events:none}
#xcal .xclose{position:absolute;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,240,210,.35);background:rgba(20,14,30,.55);color:#fff3dc;font:700 20px system-ui;z-index:3}
#xcal .xmus{position:absolute;right:calc(max(12px,env(safe-area-inset-right)) + 56px);top:max(12px,env(safe-area-inset-top));width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,240,210,.35);background:rgba(20,14,30,.55);color:#fff3dc;font:20px system-ui;z-index:3}
#xjump .hud .xmus{font:18px system-ui;margin-left:auto;margin-right:8px}
#xcal .xhint{position:relative;z-index:2;margin-top:12px;color:#f8e7c6;font:700 17px "Kalam",serif;text-shadow:0 2px 6px rgba(0,0,0,.6);text-align:center;padding:0 16px}
.xboard{position:relative;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.65),0 0 0 3px #7a1020,0 0 0 7px #e9c46a,0 0 0 9px #7a1020,0 0 40px 10px rgba(255,200,120,.15);perspective:1100px;background-repeat:no-repeat}
.xd{position:absolute;transform-style:preserve-3d;cursor:pointer;-webkit-tap-highlight-color:transparent}
.xd .hole{position:absolute;inset:0;border-radius:5px;background:radial-gradient(circle at 50% 45%,#6a3216 0%,#2a1209 70%,#170904 100%);box-shadow:inset 0 5px 10px rgba(0,0,0,.85),inset 0 -2px 4px rgba(255,200,140,.12);display:flex;align-items:center;justify-content:center;overflow:hidden}
.xd .hole img{width:72%;height:72%;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(0,0,0,.6));transform:scale(.4);opacity:0;transition:transform .5s cubic-bezier(.3,1.6,.5,1) .25s,opacity .3s .25s}
.xd .hole .em{font-size:calc(var(--s)*.5);line-height:1;transform:scale(.4);opacity:0;transition:transform .5s cubic-bezier(.3,1.6,.5,1) .25s,opacity .3s .25s;filter:drop-shadow(0 3px 4px rgba(0,0,0,.6))}
.xd.open .hole img,.xd.open .hole .em{transform:scale(1);opacity:1}
.xd .hole::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(255,215,130,.45),transparent 65%);opacity:0;transition:opacity .6s .2s}
.xd.open .hole::after{opacity:1}
.xd .dr{position:absolute;inset:0;transform-origin:0 50%;transform-style:preserve-3d;transition:transform .2s ease-out}
.xd .pn{position:absolute;top:0;bottom:0;transform-style:preserve-3d}
.xd .pa{left:0}.xd .pb{transform-origin:0 50%;transition:transform .2s ease-out}
.xd .f,.xd .k{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.xd .f{background-repeat:no-repeat}
.xd .pa .f{border-radius:5px 0 0 5px}.xd .pb .f{border-radius:0 5px 5px 0}
.xd .f::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.4));opacity:0;transition:opacity .5s}
.xd .k{transform:rotateY(180deg);background:linear-gradient(90deg,#c9a77a,#e3c79e 40%,#d7b98b);box-shadow:inset 0 0 0 1px rgba(110,70,30,.35)}
.xd .k::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(120,80,40,.10) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(255,255,255,.06) 0 2px,transparent 2px 5px)}
.xd .pa .k{border-radius:0 5px 5px 0}.xd .pb .k{border-radius:5px 0 0 5px}
.xd .perf{position:absolute;inset:0;border-radius:5px;pointer-events:none;border:1.6px dashed rgba(255,246,228,.62);box-shadow:inset 1.5px 1.5px 0 rgba(255,255,255,.16),inset -1.5px -1.5px 0 rgba(0,0,0,.28),0 0 0 1px rgba(0,0,0,.22),0 1px 3px rgba(0,0,0,.25);transition:opacity .2s}
.xd .crease{position:absolute;top:6%;bottom:6%;width:2px;background:linear-gradient(90deg,rgba(0,0,0,.35),rgba(255,255,255,.45));opacity:0;transition:opacity .15s;backface-visibility:hidden}
.xd .num{position:absolute;top:50%;transform:translate(-50%,-50%) translateZ(2px);font:700 calc(var(--s)*.44)/1 "Kalam",serif;color:#fff6dc;text-shadow:0 2px 0 #7a1020,0 0 10px rgba(255,210,120,.9),0 0 2px #000;backface-visibility:hidden;pointer-events:none;white-space:nowrap}
.xd.big .num{font-size:calc(var(--s)*.62)}
.xd.today .num{animation:xglow 1.6s ease-in-out infinite}
@keyframes xglow{0%,100%{text-shadow:0 2px 0 #7a1020,0 0 8px rgba(255,210,120,.8)}50%{text-shadow:0 2px 0 #7a1020,0 0 22px #ffd76a,0 0 40px rgba(255,190,80,.8)}}
.xd.press .dr{transform:translateZ(-4px) scale(.975)}
.xd.press .crease{opacity:.9}
.xd.crk .dr{transform:rotateY(-12deg)}
.xd.crk .pb{transform:rotateY(-38deg)}
.xd.crk .crease{opacity:1}
.xd.open .dr{transform:rotateY(-114deg) skewY(-2deg);transition:transform .8s cubic-bezier(.2,.9,.3,1)}
.xd.open .pb{transform:rotateY(-14deg);transition:transform .8s cubic-bezier(.2,.9,.3,1)}
.xd.open .f::after{opacity:1}.xd.open .perf{opacity:0}
.xd.noanim .dr,.xd.noanim .pb,.xd.noanim img,.xd.noanim .em{transition:none!important}
.xd.nope{animation:xshake .45s}
@keyframes xshake{0%,100%{transform:none}20%{transform:translateX(-4px) rotate(-1deg)}40%{transform:translateX(4px) rotate(1deg)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
.xgl{position:fixed;z-index:24;pointer-events:none;font:700 18px system-ui;color:#ffe9a8;text-shadow:0 0 8px #ffd76a,0 0 16px rgba(255,200,80,.8);animation:xgl var(--d) cubic-bezier(.15,.8,.3,1) forwards}
@keyframes xgl{0%{transform:translate(-50%,-50%) scale(.3) rotate(0);opacity:1}70%{opacity:1}100%{transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(var(--s)) rotate(var(--r));opacity:0}}
#xcard{position:fixed;inset:0;z-index:25;display:none;align-items:center;justify-content:center;background:rgba(5,8,20,.55);backdrop-filter:blur(3px)}
#xcard.show{display:flex}
#xcard .cd{position:relative;width:min(88vw,380px);border-radius:26px;padding:22px 20px 18px;text-align:center;background:linear-gradient(180deg,#fff9ec,#f3dfba);color:#4a2c14;box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 0 4px #c8102e,0 0 0 8px #f2d27a;animation:xpop .5s cubic-bezier(.3,1.6,.5,1)}
#xcard .cd::before{content:"";position:absolute;left:-8px;right:-8px;top:-8px;height:26px;border-radius:26px 26px 0 0;background:repeating-linear-gradient(45deg,#c8102e 0 12px,#fff 12px 24px);opacity:.9;z-index:-1}
@keyframes xpop{0%{transform:scale(.3) rotate(-8deg);opacity:0}100%{transform:none;opacity:1}}
#xcard .ic{width:128px;height:128px;margin:-70px auto 4px;border-radius:50%;background:radial-gradient(circle,#fff7dc 0%,#ffe1a0 55%,rgba(255,220,150,0) 72%);display:flex;align-items:center;justify-content:center;font-size:76px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35))}
#xcard .ic img{width:96px;height:96px}
#xcard .tg{font:700 14px system-ui;letter-spacing:.06em;text-transform:uppercase;color:#a0522d}
#xcard h2{margin:4px 0 6px;font:700 30px/1.1 "Kalam",serif;color:#7a1020}
#xcard p{margin:0 0 14px;font:600 16px/1.35 system-ui}
#xcard .pm{font:600 18px/1.45 "Kalam",serif;color:#3a2416;background:linear-gradient(180deg,#fffaf0,#f6e7c8);border-radius:14px;padding:12px 14px;box-shadow:inset 0 0 0 1px rgba(120,70,20,.18);text-align:left}
#xcard .pm small{display:block;text-align:right;font:italic 600 13px system-ui;color:#8a5a35;margin-top:6px}
#xcard .bt{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
#xcard button,.xbtn{border:0;border-radius:999px;padding:12px 20px;font:700 17px system-ui;color:#fff;background:linear-gradient(180deg,#e2394f,#a70f26);box-shadow:0 4px 0 #6a0a16,0 8px 18px rgba(160,20,40,.35);touch-action:manipulation}
#xcard button.al,.xbtn.al{background:linear-gradient(180deg,#fffdf8,#ead6b0);color:#4a2c14;box-shadow:0 4px 0 #b99a6a,0 8px 18px rgba(90,50,20,.2)}
#xpoem{position:fixed;left:50%;top:max(64px,calc(env(safe-area-inset-top) + 58px));transform:translate(-50%,-30px);opacity:0;pointer-events:none;transition:all .4s cubic-bezier(.3,1.4,.5,1);z-index:11;width:min(90vw,440px);box-sizing:border-box;padding:16px 18px 14px;border-radius:12px;background:linear-gradient(180deg,#fffaf0,#f1deb6);color:#3a2416;font:600 17px/1.45 "Kalam",serif;box-shadow:0 14px 40px rgba(0,0,0,.45),inset 0 0 0 1px rgba(120,70,20,.2),inset 0 0 30px rgba(170,120,60,.25)}
#xpoem.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}
#xpoem b{display:block;font:700 22px "Kalam",serif;color:#7a1020;margin-bottom:4px}
#xpoem small{display:block;text-align:right;font:italic 600 12px system-ui;color:#8a5a35}
#xpoem .x{position:absolute;right:6px;top:6px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(90,50,20,.1);color:#4a2c14;font:700 15px system-ui}
#xpoem span.w{transition:color .2s}#xpoem span.w.on{color:#c8102e}
.chip.xchip{background:linear-gradient(180deg,rgba(200,16,46,.85),rgba(120,10,28,.85));border-color:rgba(255,215,140,.6);font-weight:700}
.chip.xchip.due{animation:xchip 1.8s ease-in-out infinite}
@keyframes xchip{0%,100%{box-shadow:0 0 0 0 rgba(255,215,120,.0)}50%{box-shadow:0 0 0 6px rgba(255,215,120,.35),0 0 18px rgba(255,215,120,.6)}}
.chip.xsil{background:linear-gradient(180deg,rgba(40,30,90,.88),rgba(20,14,50,.88));border-color:rgba(255,215,140,.6);font-weight:700}
#xfw{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;mix-blend-mode:screen}
#xdim{position:fixed;inset:0;pointer-events:none;z-index:0;background:linear-gradient(180deg,rgba(8,10,40,.55),rgba(8,10,40,.15) 70%,rgba(0,0,0,0));opacity:0;transition:opacity 1.2s}
#xdim.on{opacity:1}
#xspark{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:8}
#xsil .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
#xsil .fd b{font:700 14px system-ui}#xsil .fd i{font-style:normal;font-size:38px;line-height:1.1}#xsil .fd small{font:600 11px system-ui;opacity:.7}
#xcount{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);z-index:9;pointer-events:none;font:700 120px "Kalam",serif;color:#fff3c2;text-shadow:0 0 30px #ffd76a,0 6px 0 #7a1020;opacity:0;transition:opacity .2s}
#xjump{position:fixed;inset:0;z-index:22;display:none;background:#0d1630;touch-action:none;user-select:none;-webkit-user-select:none}
#xjump.show{display:block}
#xjump canvas{position:absolute;inset:0;width:100%;height:100%}
#xjump .hud{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:center;padding:max(10px,env(safe-area-inset-top)) 12px 0;pointer-events:none;color:#fff;font:700 20px "Kalam",serif;text-shadow:0 2px 4px rgba(0,0,0,.6)}
#xjump .hud span{background:rgba(10,14,40,.45);border-radius:999px;padding:4px 14px;border:1px solid rgba(255,255,255,.2)}
#xjump .hud button{pointer-events:auto;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(10,14,40,.5);color:#fff;font:700 18px system-ui}
#xjump .ov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:rgba(5,8,25,.55);color:#fff;text-align:center}
#xjump .ov.show{display:flex}
#xjump .ov h1{margin:0;font:700 46px/1 "Kalam",serif;color:#ffe27a;text-shadow:0 4px 0 #7a1020,0 0 24px rgba(255,210,120,.6)}
#xjump .ov p{margin:0;font:600 17px/1.4 system-ui;max-width:300px}
#xjump .ov .sc{font:700 30px "Kalam",serif}
`;
function el(tag,cls,html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
/* ---------- Kalender-Bild (Winterdorf bei Nacht) ---------- */
function tree(x,cx,by,h,c){ const w=h*0.62; for(let i=0;i<3;i++){ const ty=by-h*(0.28+i*0.27), tw=w*(1-i*0.24); x.fillStyle=c; x.beginPath(); x.moveTo(cx,ty-h*0.34); x.lineTo(cx-tw/2,ty+h*0.06); x.lineTo(cx+tw/2,ty+h*0.06); x.closePath(); x.fill();
  x.fillStyle='rgba(245,250,255,.92)'; x.beginPath(); x.moveTo(cx,ty-h*0.34); x.lineTo(cx-tw*0.34,ty-h*0.04); x.quadraticCurveTo(cx,ty-h*0.1,cx+tw*0.3,ty-h*0.05); x.closePath(); x.fill(); } x.fillStyle='#3a2416'; x.fillRect(cx-h*0.04,by-h*0.08,h*0.08,h*0.08); }
function paintScene(W,H,cs){ const d=2, cv=document.createElement('canvas'); cv.width=Math.round(W*d); cv.height=Math.round(H*d); const x=cv.getContext('2d'); x.scale(d,d); const r=rng(2412);
 let g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0a1638'); g.addColorStop(0.45,'#1d3670'); g.addColorStop(0.72,'#4a63a6'); g.addColorStop(1,'#98aee0'); x.fillStyle=g; x.fillRect(0,0,W,H);
 [[0.25,0.32,'rgba(90,230,180,.16)'],[0.7,0.26,'rgba(170,110,255,.13)'],[0.5,0.42,'rgba(90,200,255,.10)']].forEach(([px,py,c])=>{ const rg=x.createRadialGradient(W*px,H*py,0,W*px,H*py,W*0.5); rg.addColorStop(0,c); rg.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=rg; x.fillRect(0,0,W,H); });
 for(let i=0;i<220;i++){ const sx=r()*W, sy=r()*H*0.6, s=r(); x.fillStyle='rgba(255,255,240,'+(0.35+s*0.65)+')'; x.beginPath(); x.arc(sx,sy,0.4+s*1.1,0,7); x.fill(); if(s>0.93){ x.strokeStyle='rgba(255,250,220,.7)'; x.lineWidth=0.8; x.beginPath(); x.moveTo(sx-5,sy); x.lineTo(sx+5,sy); x.moveTo(sx,sy-5); x.lineTo(sx,sy+5); x.stroke(); } }
 const mx=W*0.8, my=cs*1.75, mr=cs*0.42; let mg=x.createRadialGradient(mx,my,mr*0.6,mx,my,mr*3.2); mg.addColorStop(0,'rgba(255,245,210,.45)'); mg.addColorStop(1,'rgba(255,245,210,0)'); x.fillStyle=mg; x.fillRect(0,0,W,H);
 mg=x.createRadialGradient(mx-mr*0.3,my-mr*0.3,mr*0.1,mx,my,mr); mg.addColorStop(0,'#fffdf0'); mg.addColorStop(1,'#f1e2b0'); x.fillStyle=mg; x.beginPath(); x.arc(mx,my,mr,0,7); x.fill(); x.fillStyle='rgba(200,180,130,.35)'; [[-0.3,-0.2,0.18],[0.25,0.15,0.12],[-0.05,0.35,0.1]].forEach(([a,b,c])=>{ x.beginPath(); x.arc(mx+a*mr,my+b*mr,c*mr,0,7); x.fill(); });
 const hill=(y0,amp,ph,c1,c2)=>{ const hg=x.createLinearGradient(0,y0-amp,0,H); hg.addColorStop(0,c1); hg.addColorStop(1,c2); x.fillStyle=hg; x.beginPath(); x.moveTo(0,H); for(let i=0;i<=40;i++){ const px=i/40*W; x.lineTo(px,y0-amp*(0.5+0.5*Math.sin(i*0.35+ph))*(0.6+0.4*Math.sin(i*0.13+ph*2))); } x.lineTo(W,H); x.closePath(); x.fill(); };
 hill(H*0.62,cs*0.9,1.2,'#b9c9ec','#7d93c8'); for(let i=0;i<14;i++) tree(x,r()*W,H*0.6+r()*cs*0.2,cs*(0.45+r()*0.25),'#2b4a5a');
 hill(H*0.74,cs*0.7,3.1,'#dfe8fb','#a7b8e2');
 const house=(hx,hy,w,h,c)=>{ x.fillStyle=c; x.fillRect(hx,hy-h,w,h); x.fillStyle='#6b2a2a'; x.beginPath(); x.moveTo(hx-w*0.12,hy-h); x.lineTo(hx+w/2,hy-h-w*0.55); x.lineTo(hx+w*1.12,hy-h); x.closePath(); x.fill(); x.fillStyle='#fbfdff'; x.beginPath(); x.moveTo(hx-w*0.14,hy-h+2); x.lineTo(hx+w/2,hy-h-w*0.58); x.lineTo(hx+w*1.14,hy-h+2); x.lineTo(hx+w*1.04,hy-h+5); x.lineTo(hx+w/2,hy-h-w*0.44); x.lineTo(hx-w*0.04,hy-h+5); x.closePath(); x.fill();
  const wg=x.createRadialGradient(hx+w*0.3,hy-h*0.5,0,hx+w*0.3,hy-h*0.5,w*0.7); wg.addColorStop(0,'rgba(255,200,90,.55)'); wg.addColorStop(1,'rgba(255,200,90,0)'); x.fillStyle=wg; x.fillRect(hx-w*0.5,hy-h*1.3,w*2,h*1.6); x.fillStyle='#ffd46a'; x.fillRect(hx+w*0.18,hy-h*0.72,w*0.22,h*0.3); x.fillRect(hx+w*0.6,hy-h*0.72,w*0.22,h*0.3); x.fillStyle='#4a2a1a'; x.fillRect(hx+w*0.4,hy-h*0.42,w*0.2,h*0.42); };
 [[0.06,0.8,0.11,0.07,'#8a5a5a'],[0.2,0.78,0.09,0.06,'#6b5a8a'],[0.66,0.79,0.1,0.07,'#5a7a8a'],[0.83,0.81,0.12,0.08,'#8a6a4a']].forEach(([a,b,w,h,c])=>house(W*a,H*b,W*w,H*h,c));
 hill(H*0.86,cs*0.35,5.0,'#f4f8ff','#c9d6f2');
 for(let i=0;i<8;i++){ const tx=i<4?r()*W*0.3:W*0.7+r()*W*0.3; tree(x,tx,H*0.9+r()*cs*0.3,cs*(0.6+r()*0.4),'#1f4a3a'); }
 const tcx=W*0.5, tby=H*0.97, th=cs*2.6; const tg=x.createRadialGradient(tcx,tby-th*0.5,0,tcx,tby-th*0.5,th); tg.addColorStop(0,'rgba(255,210,120,.35)'); tg.addColorStop(1,'rgba(255,210,120,0)'); x.fillStyle=tg; x.fillRect(0,0,W,H);
 tree(x,tcx,tby,th,'#1b5a3a'); const lc=['#ffd76a','#ff5f6d','#5fd7ff','#fff1b8','#ff9f1c']; for(let i=0;i<46;i++){ const v=r(), yy=tby-th*0.1-v*th*0.75, half=th*0.31*(1-v)*0.95, xx=tcx+(r()*2-1)*half; const c=lc[i%5]; const lg=x.createRadialGradient(xx,yy,0,xx,yy,5); lg.addColorStop(0,c); lg.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=lg; x.beginPath(); x.arc(xx,yy,5,0,7); x.fill(); x.fillStyle=c; x.beginPath(); x.arc(xx,yy,1.6,0,7); x.fill(); }
 x.save(); x.translate(tcx,tby-th*1.04); x.fillStyle='#ffe27a'; x.shadowColor='#ffd76a'; x.shadowBlur=14; x.beginPath(); for(let i=0;i<10;i++){ const rr=i%2?cs*0.07:cs*0.17, a=i/10*Math.PI*2; x[i?'lineTo':'moveTo'](Math.sin(a)*rr,-Math.cos(a)*rr); } x.closePath(); x.fill(); x.restore();
 [[0.38,0.97,'#c8102e'],[0.6,0.975,'#2f6fd0'],[0.55,0.99,'#f2c14e']].forEach(([a,b,c])=>{ const bx=W*a, by=H*b, s=cs*0.32; x.fillStyle=c; x.fillRect(bx-s/2,by-s,s,s); x.fillStyle='#fff3c2'; x.fillRect(bx-s*0.08,by-s,s*0.16,s); x.fillRect(bx-s/2,by-s*0.58,s,s*0.14); });
 for(let i=0;i<240;i++){ const sx=r()*W, sy=r()*H, s=r(); x.fillStyle='rgba(255,255,255,'+(0.4+s*0.5)+')'; x.beginPath(); x.arc(sx,sy,0.6+s*1.6,0,7); x.fill(); }
 for(let i=0;i<90;i++){ x.fillStyle='rgba(255,226,140,'+(0.4+r()*0.6)+')'; x.fillRect(r()*W,r()*H,1.2,1.2); }
 /* Titel */
 x.save(); x.textAlign='center'; x.textBaseline='middle'; let fs=Math.min(cs*0.56,W/11); x.font='700 '+fs+'px Kalam,serif'; const tw0=x.measureText('Giß-Moes Adventskalender').width; if(tw0>W*0.86){ fs*=W*0.86/tw0; x.font='700 '+fs+'px Kalam,serif'; } const tY=cs*0.5; const gg=x.createLinearGradient(0,tY-fs/2,0,tY+fs/2); gg.addColorStop(0,'#fff6c8'); gg.addColorStop(0.5,'#ffd76a'); gg.addColorStop(1,'#d89a2a');
 x.shadowColor='rgba(255,200,90,.7)'; x.shadowBlur=18; x.lineWidth=5; x.strokeStyle='#5a0a18'; x.strokeText('Giß-Moes Adventskalender',W/2,tY); x.fillStyle=gg; x.fillText('Giß-Moes Adventskalender',W/2,tY); x.restore();
 /* Karton-Struktur */
 const im=x.getImageData(0,0,cv.width,cv.height), dd=im.data; for(let i=0;i<dd.length;i+=4){ const n=(Math.random()-0.5)*10; dd[i]+=n; dd[i+1]+=n; dd[i+2]+=n; } x.putImageData(im,0,0);
 const vg=cv.getContext('2d'); vg.setTransform(1,0,0,1,0,0); const v=vg.createRadialGradient(cv.width/2,cv.height/2,cv.width*0.3,cv.width/2,cv.height/2,cv.width*0.85); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.35)'); vg.fillStyle=v; vg.fillRect(0,0,cv.width,cv.height);
 return cv.toDataURL('image/jpeg',0.9); }
/* Raster: 5 Spalten x 6 Reihen (Titel darüber) */
const LAY=(()=>{ const occ={}, out=[]; const put=(c,r,w,h)=>{ for(let i=0;i<w;i++) for(let j=0;j<h;j++) occ[(c+i)+','+(r+j)]=1; out.push({c,r,w,h}); };
 put(2,3,2,2); put(0,0,2,1); put(4,1,1,2); put(1,5,2,1); for(let r=0;r<6;r++) for(let c=0;c<5;c++) if(!occ[c+','+r]) put(c,r,1,1); return out; })();
let cal=null, calBusy=false;
function content(n){ const P=plan(), p=P[n]; if(!p) return {e:'🎁',n:'Überraschung'}; if(p.t==='food'){ const f=FOODS.find(q=>q.id===p.id); return {img:X.icon(p.id),n:f.n,f}; } if(p.t==='wear'){ const s=SANTA.find(q=>q.id===p.id); return {e:s.e,n:s.n,s}; } if(p.t==='poem') return {e:'📜',n:POEMS[p.i].n,p:POEMS[p.i]}; return {e:'🚀',n:'Moe Jump'}; }
function buildCal(){ if(cal) cal.remove(); const ov=el('div',''); ov.id='xcal'; const snow=el('canvas','xsnow'); ov.appendChild(snow);
 const cs=Math.floor(Math.min((innerWidth*0.94-18)/5,(innerHeight-130)/7)); const BW=cs*5, BH=cs*7; const board=el('div','xboard'); board.style.width=BW+'px'; board.style.height=BH+'px'; const img=paintScene(BW,BH,cs); board.style.backgroundImage='url('+img+')'; board.style.backgroundSize=BW+'px '+BH+'px';
 const x=XS(), P=plan(), nums=shuf(Array.from({length:23},(_,i)=>i+1),rng(x.seed+7)); let ni=0;
 LAY.forEach(L0=>{ const n=(L0.w===2&&L0.h===2)?24:nums[ni++]; const g=3, X0=L0.c*cs+g, Y0=(L0.r+1)*cs+g, w=L0.w*cs-2*g, h=L0.h*cs-2*g; const d=el('div','xd'+(n===24?' big':'')); d.dataset.n=n; Object.assign(d.style,{left:X0+'px',top:Y0+'px',width:w+'px',height:h+'px'}); d.style.setProperty('--s',Math.min(w,h)+'px');
  const c=content(n); const hole=el('div','hole'); if(c.img){ const im=el('img'); im.src=c.img; hole.appendChild(im); } else hole.appendChild(el('div','em',c.e)); d.appendChild(hole);
  const cr=0.68, wa=Math.round(w*cr), wb=w-wa; const dr=el('div','dr'); const pa=el('div','pn pa'); pa.style.width=wa+'px'; const pb=el('div','pn pb'); pb.style.left=wa+'px'; pb.style.width=wb+'px';
  const face=(px,pw)=>{ const f=el('div','f'); f.style.backgroundImage='url('+img+')'; f.style.backgroundSize=BW+'px '+BH+'px'; f.style.backgroundPosition=(-(X0+px))+'px '+(-Y0)+'px'; return f; };
  pa.appendChild(face(0,wa)); pa.appendChild(el('div','k')); pb.appendChild(face(wa,wb)); pb.appendChild(el('div','k'));
  const num=el('div','num',String(n)); num.style.left=(w/2)+'px'; pa.appendChild(num); const ce=el('div','crease'); ce.style.left=(wa-1)+'px'; dr.appendChild(pa); dr.appendChild(pb); dr.appendChild(ce); dr.appendChild(el('div','perf')); d.appendChild(dr);
  if(x.open[n]) d.classList.add('open','noanim'); else if(canOpen(n)&&n===Math.min(24,today())) d.classList.add('today');
  d.addEventListener('pointerdown',e=>{ e.stopPropagation(); if(!d.classList.contains('open')) d.classList.add('press'); });
  d.addEventListener('pointerleave',()=>d.classList.remove('press')); d.addEventListener('pointercancel',()=>d.classList.remove('press'));
  d.addEventListener('pointerup',e=>{ e.stopPropagation(); d.classList.remove('press'); tapDoor(d,n); });
  board.appendChild(d); });
 ov.appendChild(board); const hint=el('div','xhint'); ov.appendChild(hint); const cl=el('button','xclose','✕'); cl.onclick=()=>closeCal(); ov.appendChild(cl); ov.appendChild(musBtn());
 document.body.appendChild(ov); cal=ov; cal._hint=hint; cal._snow=snow; updHint(); return ov; }
function updHint(){ if(!cal) return; const x=XS(), td=Math.min(24,today()); const left=[]; for(let n=1;n<=td;n++) if(!x.open[n]) left.push(n); cal._hint.textContent=td>=25||(td===24&&!left.length)?'Frohe Weihnachten! 🎄':left.length?('Heute darfst du Türchen '+left[left.length-1]+' öffnen!'+(left.length>1?' ('+(left.length-1)+' weitere warten noch)':'')):'Bis morgen! Dann wartet das nächste Türchen. ✨'; }
async function tapDoor(d,n){ if(calBusy) return; const x=XS();
 if(d.classList.contains('open')){ return showCard(n,true); }
 if(!canOpen(n)){ d.classList.remove('nope'); void d.offsetWidth; d.classList.add('nope'); K.toast('🔒 Türchen '+n+' gibt es erst am '+n+'. Dezember!'); try{ K.V.pop&&K.V.pop(); }catch(e){} return; }
 calBusy=true; d.classList.remove('today','noanim'); S('door',0.9); d.classList.add('crk'); await wait(230); d.classList.add('open'); await wait(260); S('glitter',0.6); glitter(d); x.open[n]=Date.now(); grant(n); K.save(); updChip(); updHint(); await wait(1500); calBusy=false; showCard(n,false); }
function glitter(d){ const b=d.getBoundingClientRect(), cx=b.left+b.width/2, cy=b.top+b.height/2; const ch=['✦','✧','★','❄','✨','✦']; for(let i=0;i<34;i++){ const e=el('div','xgl',ch[i%ch.length]); const a=Math.random()*Math.PI*2, r=60+Math.random()*140; e.style.left=cx+'px'; e.style.top=cy+'px'; e.style.setProperty('--x',Math.cos(a)*r+'px'); e.style.setProperty('--y',(Math.sin(a)*r-30)+'px'); e.style.setProperty('--s',(0.6+Math.random()*1.2).toFixed(2)); e.style.setProperty('--r',((Math.random()-0.5)*360)+'deg'); e.style.setProperty('--d',(0.9+Math.random()*0.8).toFixed(2)+'s'); e.style.fontSize=(12+Math.random()*16)+'px'; if(i%3===0) e.style.color='#fff'; document.body.appendChild(e); setTimeout(()=>e.remove(),2000); } }
function grant(n){ const P=plan(), p=P[n], x=XS(); if(!p) return; if(p.t==='food') x.got['f_'+p.id]=1; if(p.t==='wear'){ x.got[p.id]=1; try{ GissWear.mark(); }catch(e){} } if(p.t==='jump') x.jump=1; }
function showCard(n,again){ const P=plan(), p=P[n], c=content(n); let cd=document.getElementById('xcard'); if(!cd){ cd=el('div',''); cd.id='xcard'; document.body.appendChild(cd); cd.addEventListener('pointerup',e=>{ if(e.target===cd) cd.classList.remove('show'); }); }
 const ic=c.img?'<img src="'+c.img+'">':c.e; let body='', btn='';
 if(p.t==='food'){ body='<p>'+c.f.h.charAt(0).toUpperCase()+c.f.h.slice(1)+'! Ab jetzt im Essen-Menü.</p>'; btn='<button data-a="eat">Giß-Moe füttern 😋</button>'; }
 else if(p.t==='wear'){ const have=SANTA.filter(s=>XS().got[s.id]).length; body='<p>Teil '+have+' von 4 vom Weihnachtsmann-Kostüm! '+(have<4?'Die anderen Teile sind in anderen Türchen versteckt.':'Jetzt ist das Kostüm komplett! 🎅')+'</p>'; btn='<button data-a="wear">Anziehen 🎅</button>'+(have===4?'<button class="al" data-a="wearall">Alles anziehen</button>':''); }
 else if(p.t==='poem'){ body='<div class="pm">'+c.p.t+'<small>'+c.p.a+'</small></div><p></p>'; btn='<button data-a="poem">Moe liest vor 📜</button>'; }
 else { body='<p>Ein neues Spiel! Hüpf mit Giß-Moe so hoch du kannst – kipp das Handy oder tipp links und rechts.</p>'; btn='<button data-a="jump">Jetzt spielen 🚀</button>'; }
 cd.innerHTML='<div class="cd"><div class="ic">'+ic+'</div><div class="tg">Türchen '+n+'</div><h2>'+c.n+'</h2>'+body+'<div class="bt">'+btn+'<button class="al" data-a="x">'+(again?'Schließen':'Später')+'</button></div></div>';
 cd.querySelectorAll('button').forEach(b=>b.onclick=async()=>{ const a=b.dataset.a; cd.classList.remove('show'); if(a==='x') return; closeCal(); await wait(250);
  if(a==='eat') GF.eat(p.id); else if(a==='wear') wearSanta([p.id]); else if(a==='wearall') wearSanta(SANTA.map(s=>s.id)); else if(a==='poem') recite(p.i); else if(a==='jump') X.jumpStart(); });
 cd.classList.add('show'); }
function wearSanta(ids){ ids.forEach(id=>{ const s=SANTA.find(q=>q.id===id); if(s) GissWear._wear(s.s,id); }); const all=SANTA.every(s=>(K.M.wear||{})[s.s]===s.id); if(all){ setTimeout(()=>{ (async()=>{ const k=K, t=k.begin(); k.rest(); k.A.hop=0.8; k.A.blush=1; k.A.earWig=1.2; k.fx('🎅','',3); S('bells',0.35,{at:0}); await wait(400); await wait(k.say('Ho ho ho! Ich bin der Weihnachts-Moe!')*1000+300); if(k.alive(t)) k.rest(); })(); },300); } else GissWear.react(ids[0],{say:'Ho ho ho!'}); }
async function recite(i){ const k=K, P0=POEMS[i]; if(k.st.mode==='sleep') await k.wake(); let pe=document.getElementById('xpoem'); if(!pe){ pe=el('div',''); pe.id='xpoem'; document.body.appendChild(pe); }
 pe.innerHTML='<button class="x">✕</button><b>'+P0.n+'</b>'+P0.t+'<small>'+P0.a+'</small>'; pe.querySelector('.x').onclick=()=>{ pe.classList.remove('show'); k.begin(); k.rest(); try{ k.V.stop&&k.V.stop(); }catch(e){} };
 pe.classList.add('show'); const t=k.begin(); k.rest(); k.A.lid=0.15; k.A.earUp=0.5; k.A.low=0.2; k.interact(); await wait(500); if(!k.alive(t)) return;
 const txt=L[i]; const r=(GF.clip&&GF.clip(txt))||k.V.say(txt); const dur=k.mouthPlay(r); const t0=performance.now(); 
 const nod=setInterval(()=>{ if(!k.alive(t)){ clearInterval(nod); return; } const e=(performance.now()-t0)/1000; k.A.hx=Math.sin(e*2.2)*0.05; k.A.earWig=0.3; if(e>dur){ clearInterval(nod); } },120);
 await wait(dur*1000+600); if(!k.alive(t)) return; k.rest(); k.A.blush=0.9; k.A.hop=0.4; k.mouthPlay(k.V.giggle(3)); await wait(1500); if(k.alive(t)){ k.rest(); } setTimeout(()=>pe.classList.remove('show'),2500); }
let snowP=null, snowRaf=0;
function snowLoop(){ if(!cal||!cal.classList.contains('show')){ snowRaf=0; return; } const c=cal._snow, d=1.5; if(c.width!==Math.round(innerWidth*d)){ c.width=Math.round(innerWidth*d); c.height=Math.round(innerHeight*d); snowP=null; } const x=c.getContext('2d'); if(!snowP){ snowP=Array.from({length:70},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:(0.6+Math.random()*2.2)*d,v:(14+Math.random()*30)*d,p:Math.random()*6})); }
 x.clearRect(0,0,c.width,c.height); x.fillStyle='rgba(255,255,255,.75)'; const t=performance.now()/1000; snowP.forEach(s=>{ s.y+=s.v/60; if(s.y>c.height+5){ s.y=-5; s.x=Math.random()*c.width; } x.beginPath(); x.arc(s.x+Math.sin(t+s.p)*8*d,s.y,s.r,0,7); x.fill(); }); snowRaf=requestAnimationFrame(snowLoop); }
X.openCal=async function(){ if(!season()) return; try{ await document.fonts.load('700 30px Kalam'); }catch(e){} document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show')); buildCal(); cal.classList.add('show'); K.st.wimmel=true; K.st.busy=true; K.interact(); if(!snowRaf) snowLoop(); musOn(); };
function closeCal(){ if(!cal) return; cal.classList.remove('show'); musOff(); K.st.wimmel=false; K.st.busy=false; K.interact(); }
X.closeCal=closeCal;
/* ---------- Hintergrundmusik (leise, loopend) für Kalender & Moe Jump: xmas/musik.ogg (optional) ---------- */
const MUS={a:null,want:false,ok:null,fi:0}, MLV=[0.14,0.3,0], MIC=['🔉','🔊','🔇'], MTX=['Musik leise','Musik lauter','Musik aus'];
function musLv(){ const x=XS(); return (x.mus==null||x.mus<0||x.mus>2)?0:x.mus; }
function musEl(){ if(MUS.a) return MUS.a; const a=new Audio(); a.loop=true; a.preload='auto'; a.volume=0; a.addEventListener('error',()=>{ MUS.ok=false; musBtns(); if(J.run&&!J.music&&musLv()<2) J.music=S('bells',musLv()?0.3:0.16,{loop:true}); }); a.addEventListener('canplaythrough',()=>{ if(MUS.ok!==true){ MUS.ok=true; musBtns(); } }); a.src=K.base+'xmas/musik.ogg'; MUS.a=a; return a; }
function musFade(to,then){ const a=MUS.a; if(!a) return; clearInterval(MUS.fi); MUS.fi=setInterval(()=>{ const v=a.volume+(to-a.volume)*0.18; if(Math.abs(to-v)<0.01){ a.volume=to; clearInterval(MUS.fi); then&&then(); } else a.volume=Math.max(0,Math.min(1,v)); },50); }
function musApply(){ const v=MLV[musLv()]; if(!MUS.want||!v||document.hidden){ if(MUS.a&&!MUS.a.paused) musFade(0,()=>MUS.a.pause()); return; } const a=musEl(); if(MUS.ok===false) return; if(a.paused){ const p=a.play(); if(p&&p.catch) p.catch(()=>{}); } musFade(v); }
function musOn(){ MUS.want=true; musApply(); }
function musOff(){ MUS.want=false; musApply(); }
function musBtns(){ document.querySelectorAll('.xmus').forEach(b=>{ b.textContent=MIC[musLv()]; b.style.display=MUS.ok===false?'none':''; }); }
function musBtn(){ const b=el('button','xmus',MIC[musLv()]); b.setAttribute('aria-label','Musik'); b.addEventListener('pointerup',e=>{ e.stopPropagation(); const x=XS(); x.mus=(musLv()+1)%3; K.save(); musApply(); musBtns(); try{ K.toast(MIC[x.mus]+' '+MTX[x.mus]); }catch(_){} }); if(MUS.ok===false) b.style.display='none'; return b; }
document.addEventListener('visibilitychange',()=>musApply());
/* ---------- Moe Jump (Türchen 24) ---------- */
const J={};
function jumpBG(w){ /* Bergsilhouetten als Kachel */ const mk=(h,c1,c2,seed,snow)=>{ const c=document.createElement('canvas'); c.width=Math.ceil(w*2); c.height=h*2; const x=c.getContext('2d'); x.scale(2,2); const r=rng(seed); const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,c1); g.addColorStop(1,c2); x.fillStyle=g; x.beginPath(); x.moveTo(0,h); const pk=[]; let px=0; while(px<=w+40){ const py=h*(0.15+r()*0.5); pk.push([px,py]); px+=40+r()*80; } x.lineTo(0,pk[0][1]); pk.forEach(([a,b])=>x.lineTo(a,b)); x.lineTo(w,pk[0][1]); x.lineTo(w,h); x.closePath(); x.fill(); if(snow){ x.fillStyle='rgba(245,250,255,.9)'; pk.forEach(([a,b],i)=>{ if(i===0) return; const [pa,pb2]=pk[i-1]; x.beginPath(); x.moveTo(a,b); x.lineTo(a-(a-pa)*0.28,b+(pb2-b)*0.28+4); x.lineTo(a,b+10); x.lineTo(a+18,b+12); x.closePath(); x.fill(); }); } return c; };
 return {far:mk(220,'#6f86c2','#3a4f8a',3,1),near:mk(160,'#2e4778','#1b2c52',9,1)}; }
function jumpInit(){ if(J.root) return; const root=el('div',''); root.id='xjump'; root.innerHTML='<canvas></canvas><div class="hud"><span class="s">0</span><span class="st">⭐ 0</span><span class="hi">🏆 0</span><button class="q">✕</button></div><div class="ov"></div>'; document.body.appendChild(root);
 J.root=root; J.cv=root.querySelector('canvas'); J.x=J.cv.getContext('2d'); J.hud={s:root.querySelector('.s'),st:root.querySelector('.st'),hi:root.querySelector('.hi')}; J.ov=root.querySelector('.ov');
 root.querySelector('.hud').insertBefore(musBtn(),root.querySelector('.q')); root.querySelector('.q').addEventListener('pointerup',e=>{ e.stopPropagation(); X.jumpEnd(); });
 const setDir=e=>{ if(!J.run) return; J.tap=(e.clientX<innerWidth/2)?-1:1; };
 J.cv.addEventListener('pointerdown',e=>{ J.cv.setPointerCapture(e.pointerId); setDir(e); }); J.cv.addEventListener('pointermove',e=>{ if(J.tap) setDir(e); }); ['pointerup','pointercancel'].forEach(t=>J.cv.addEventListener(t,()=>{ J.tap=0; }));
 addEventListener('keydown',e=>{ if(!J.run) return; if(e.key==='ArrowLeft') J.key=-1; if(e.key==='ArrowRight') J.key=1; }); addEventListener('keyup',e=>{ if(e.key==='ArrowLeft'&&J.key<0) J.key=0; if(e.key==='ArrowRight'&&J.key>0) J.key=0; });
 addEventListener('deviceorientation',e=>{ if(e.gamma==null) return; const o=(screen.orientation&&screen.orientation.angle)||0; let g=o===90?e.beta:o===270||o===-90?-e.beta:e.gamma; J.tilt=Math.max(-1,Math.min(1,(g||0)/22)); J.hasTilt=true; });
 document.addEventListener('visibilitychange',()=>{ if(document.hidden&&J.run) J.pause=true; else if(J.pause){ J.pause=false; J.last=performance.now(); } }); }
function jumpReset(){ const w=innerWidth, h=innerHeight; J.w=w; J.h=h; const d=Math.min(2,devicePixelRatio||1); J.d=d; J.cv.width=Math.round(w*d); J.cv.height=Math.round(h*d);
 J.bg=jumpBG(w); J.p={x:w/2,y:h-120,vx:0,vy:-900,face:1,sq:1,rocket:0,spring:0}; J.cam=0; J.top=h-60; J.plat=[]; J.items=[]; J.parts=[]; J.score=0; J.stars=0; J.maxH=0; J.dead=false; J.tap=0; J.key=0;
 J.plat.push({x:w/2-60,y:h-60,w:120,t:'n'}); let y=h-60; while(y>-h*2){ y=genRow(y); } J.flakes=Array.from({length:60},()=>({x:Math.random()*w,y:Math.random()*h,r:0.6+Math.random()*2,v:20+Math.random()*40,z:0.3+Math.random()*0.7}));
 J.hiStart=XS().hi||0; }
function genRow(y){ const w=J.w, hgt=Math.max(0,-y)/10; const gap=Math.min(150,62+hgt*0.035+Math.random()*28); y-=gap; const pw=Math.max(62,92-hgt*0.012);
 const r=Math.random(); let t='n'; if(hgt>40&&r<Math.min(0.3,0.08+hgt*0.0003)) t='m'; else if(hgt>25&&r>0.86) t='n';
 const p={x:Math.random()*(w-pw),y,w:pw,t,vx:t==='m'?(60+Math.random()*60+hgt*0.03)*(Math.random()<.5?-1:1):0}; J.plat.push(p);
 if(hgt>15&&Math.random()<Math.min(0.32,0.1+hgt*0.0004)){ let bx=Math.random()*(w-80); if(Math.abs(bx-p.x)<90) bx=(p.x+w/2)%(w-80); J.plat.push({x:bx,y:y-gap*0.5,w:80,t:'b'}); }
 const q=Math.random(); if(q<0.07&&hgt>8) J.items.push({t:'spring',p,dx:p.w*0.6}); else if(q<0.095&&hgt>30) J.items.push({t:'rocket',p,dx:p.w*0.5}); else if(q<0.5){ const n=1+Math.floor(Math.random()*3); for(let i=0;i<n;i++) J.items.push({t:'star',x:p.x+p.w/2+(i-(n-1)/2)*26,y:y-46-i*4}); }
 J.top=y; return y; }
function drawPlat(x,p,y){ const X0=p.x, w=p.w; x.save(); if(p.t==='b'){ const a=p.br?Math.max(0,1-p.br):1; x.globalAlpha=a; x.translate(X0+w/2,y+(p.br?p.br*60:0)); if(p.br) x.rotate(p.br*0.4); const g=x.createLinearGradient(0,-8,0,10); g.addColorStop(0,'rgba(220,245,255,.95)'); g.addColorStop(1,'rgba(120,190,240,.85)'); x.fillStyle=g; x.beginPath(); x.roundRect(-w/2,-7,w,16,8); x.fill(); x.strokeStyle='rgba(255,255,255,.9)'; x.lineWidth=1.5; x.beginPath(); x.moveTo(-w*0.3,-5); x.lineTo(-w*0.18,2); x.lineTo(-w*0.05,-3); x.lineTo(w*0.08,5); x.moveTo(w*0.2,-6); x.lineTo(w*0.28,3); x.stroke(); x.fillStyle='rgba(255,255,255,.6)'; x.fillRect(-w*0.4,-5,w*0.25,2); x.restore(); return; }
 x.translate(X0,y); const wood=p.t==='m'?['#d84a5a','#a8243a']:['#a8693a','#6e3f1d']; const g=x.createLinearGradient(0,0,0,14); g.addColorStop(0,wood[0]); g.addColorStop(1,wood[1]); x.fillStyle='rgba(0,0,0,.25)'; x.beginPath(); x.roundRect(2,6,w,12,6); x.fill(); x.fillStyle=g; x.beginPath(); x.roundRect(0,2,w,12,6); x.fill();
 if(p.t==='m'){ x.fillStyle='rgba(255,255,255,.85)'; for(let i=8;i<w-6;i+=16){ x.beginPath(); x.moveTo(i,2); x.lineTo(i+7,2); x.lineTo(i+1,14); x.lineTo(i-6,14); x.closePath(); x.fill(); } } else { x.strokeStyle='rgba(60,30,10,.4)'; x.lineWidth=1; x.beginPath(); x.moveTo(6,9); x.lineTo(w-6,9); x.stroke(); }
 x.fillStyle='#f8fbff'; x.beginPath(); x.moveTo(-2,4); for(let i=0;i<=8;i++){ const px=-2+i*(w+4)/8; x.quadraticCurveTo(px-(w+4)/16,-5+(i%2)*2,px,3); } x.lineTo(w+2,5); x.lineTo(-2,5); x.closePath(); x.fill(); x.fillStyle='rgba(160,200,240,.5)'; x.fillRect(2,3,w-4,1.5); x.restore(); }
function drawStar(x,cx,cy,r,t){ x.save(); x.translate(cx,cy); x.rotate(Math.sin(t*3+cx)*0.25); const g=x.createRadialGradient(0,0,0,0,0,r*2); g.addColorStop(0,'rgba(255,230,120,.5)'); g.addColorStop(1,'rgba(255,230,120,0)'); x.fillStyle=g; x.beginPath(); x.arc(0,0,r*2,0,7); x.fill(); x.fillStyle='#ffd23f'; x.strokeStyle='#c98a16'; x.lineWidth=1.5; x.beginPath(); for(let i=0;i<10;i++){ const rr=i%2?r*0.45:r, a=i/10*Math.PI*2; x[i?'lineTo':'moveTo'](Math.sin(a)*rr,-Math.cos(a)*rr); } x.closePath(); x.fill(); x.stroke(); x.fillStyle='rgba(255,255,255,.7)'; x.beginPath(); x.arc(-r*0.25,-r*0.3,r*0.18,0,7); x.fill(); x.restore(); }
function drawSpring(x,cx,by,c){ x.save(); x.translate(cx,by); const h=c?10:18; x.strokeStyle='#c0c6d4'; x.lineWidth=3; x.beginPath(); for(let i=0;i<=6;i++){ x.lineTo((i%2?-7:7),-i*h/6); } x.stroke(); x.fillStyle='#e8243c'; x.beginPath(); x.roundRect(-10,-h-5,20,6,3); x.fill(); x.restore(); }
function drawRocket(x,cx,cy,s,fl){ x.save(); x.translate(cx,cy); x.scale(s,s); if(fl){ const f=x.createLinearGradient(0,14,0,40+Math.random()*12); f.addColorStop(0,'#fff3a0'); f.addColorStop(0.4,'#ff9f1c'); f.addColorStop(1,'rgba(255,60,30,0)'); x.fillStyle=f; x.beginPath(); x.moveTo(-7,14); x.lineTo(0,44+Math.random()*12); x.lineTo(7,14); x.closePath(); x.fill(); }
 x.fillStyle='#f4f6fb'; x.beginPath(); x.moveTo(0,-20); x.quadraticCurveTo(11,-8,9,14); x.lineTo(-9,14); x.quadraticCurveTo(-11,-8,0,-20); x.fill(); x.fillStyle='#e8243c'; x.beginPath(); x.moveTo(0,-20); x.quadraticCurveTo(7,-14,8,-9); x.lineTo(-8,-9); x.quadraticCurveTo(-7,-14,0,-20); x.fill(); x.beginPath(); x.moveTo(-9,6); x.lineTo(-15,16); x.lineTo(-8,14); x.fill(); x.beginPath(); x.moveTo(9,6); x.lineTo(15,16); x.lineTo(8,14); x.fill(); x.fillStyle='#5fb8ff'; x.beginPath(); x.arc(0,-1,4.5,0,7); x.fill(); x.restore(); }
function jumpFrame(now){ if(!J.run) return; J.raf=requestAnimationFrame(jumpFrame); if(J.pause) return; let dt=Math.min(0.033,(now-(J.last||now))/1000); J.last=now; J.fdt=dt; const steps=2; for(let i=0;i<steps;i++) jumpStep(dt/steps); jumpDraw(now/1000); }
function jumpStep(dt){ const p=J.p, w=J.w, h=J.h; if(J.dead){ p.vy+=1800*dt; p.y+=p.vy*dt; return; }
 const inp=J.key||J.tap||(J.hasTilt?J.tilt:0); const tv=inp*430; p.vx+=(tv-p.vx)*Math.min(1,dt*9); p.x+=p.vx*dt; if(Math.abs(p.vx)>20) p.face=p.vx<0?-1:1; if(p.x<-24) p.x+=w+48; if(p.x>w+24) p.x-=w+48;
 if(p.rocket>0){ p.rocket-=dt; p.vy=-1050; if(Math.random()<0.6) J.parts.push({x:p.x+(Math.random()-0.5)*10,y:p.y+30,vx:(Math.random()-0.5)*60,vy:200+Math.random()*120,l:0.5,c:Math.random()<.5?'#ffd23f':'#ff7a3a',r:3+Math.random()*3}); if(p.rocket<=0){ p.vy=-500; } }
 else p.vy+=1700*dt; const oy=p.y; p.y+=p.vy*dt; p.sq+=(1-p.sq)*Math.min(1,dt*10);
 J.plat.forEach(q=>{ if(q.t==='m'){ q.x+=q.vx*dt; if(q.x<0){ q.x=0; q.vx*=-1; } if(q.x+q.w>w){ q.x=w-q.w; q.vx*=-1; } } if(q.br) q.br+=dt*1.6; });
 if(p.vy>0&&p.rocket<=0){ for(const q of J.plat){ if(q.br) continue; const top=q.y+2; if(oy+30<=top&&p.y+30>=top&&p.x>q.x-16&&p.x<q.x+q.w+16){ if(q.t==='b'){ q.br=0.01; S('crack',0.6); continue; }
   const sp=J.items.find(it=>it.t==='spring'&&it.p===q&&Math.abs(p.x-(q.x+it.dx))<22); if(sp){ p.vy=-1480; sp.c=0.3; S('spring',0.75); p.sq=0.6; p.spin=1; } else { p.vy=-880; S('jump',0.35,{rate:0.95+Math.random()*0.1}); p.sq=0.72; }
   p.y=top-30; break; } } }
 J.items.forEach(it=>{ if(it.got) return; let ix,iy; if(it.p){ ix=it.p.x+it.dx; iy=it.p.y-10; } else { ix=it.x; iy=it.y; } if(it.c) it.c-=dt; const dx=p.x-ix, dy=p.y-iy;
  if(it.t==='star'&&dx*dx+dy*dy<34*34){ it.got=1; J.stars++; S('coin',0.45,{rate:1+Math.min(0.3,J.combo||0)}); for(let k=0;k<8;k++) J.parts.push({x:ix,y:iy,vx:(Math.random()-0.5)*220,vy:(Math.random()-0.5)*220,l:0.5,c:'#ffe27a',r:2.5}); }
  if(it.t==='rocket'&&dx*dx+(dy+10)*(dy+10)<36*36){ it.got=1; p.rocket=2.3; S('rocket',0.7); } });
 if(p.y<J.cam+h*0.4) J.cam=p.y-h*0.4; const hh=Math.max(0,(h-120-p.y)); J.maxH=Math.max(J.maxH,hh); J.score=Math.floor(J.maxH/10)+J.stars*5;
 while(J.top>J.cam-h) genRow(J.top); J.plat=J.plat.filter(q=>q.y<J.cam+h+60&&!(q.br>1)); J.items=J.items.filter(it=>(it.p?J.plat.includes(it.p):it.y<J.cam+h+60)&&!(it.got&&it.t==='star'));
 J.parts.forEach(q=>{ q.x+=q.vx*dt; q.y+=q.vy*dt; q.l-=dt; }); J.parts=J.parts.filter(q=>q.l>0);
 if(p.y>J.cam+h+40) jumpOver(); }
function skyCol(m){ const st=[[0,[40,70,140],[150,175,225]],[400,[20,36,90],[70,100,170]],[1200,[10,14,50],[40,40,110]],[2500,[6,4,24],[30,14,70]]]; let a=st[0],b=st[st.length-1]; for(let i=0;i<st.length-1;i++) if(m>=st[i][0]&&m<st[i+1][0]){ a=st[i]; b=st[i+1]; break; } const k=b===a?1:Math.min(1,(m-a[0])/(b[0]-a[0]||1)); const mix=(u,v)=>u.map((c,i)=>Math.round(c+(v[i]-c)*k)); return [mix(a[1],b[1]),mix(a[2],b[2])]; }
function jumpDraw(t){ const x=J.x, w=J.w, h=J.h, d=J.d, p=J.p; x.setTransform(d,0,0,d,0,0); const m=Math.max(0,-J.cam)/10; const [c1,c2]=skyCol(m); const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgb('+c1+')'); g.addColorStop(1,'rgb('+c2+')'); x.fillStyle=g; x.fillRect(0,0,w,h);
 const sa=Math.min(1,m/600); if(sa>0){ for(let i=0;i<70;i++){ const sx=(i*97.3)%w, sy=((i*53.7)+(-J.cam*0.02))%h; x.fillStyle='rgba(255,255,240,'+(sa*(0.3+0.7*((i*13)%10)/10)*(0.7+0.3*Math.sin(t*2+i)))+')'; x.fillRect(sx,sy,1.6,1.6); } }
 if(m>900){ const a=Math.min(0.5,(m-900)/1500); for(let i=0;i<3;i++){ x.fillStyle='rgba('+(i===1?'170,110,255':'90,230,180')+','+a*0.35+')'; x.beginPath(); x.moveTo(0,h*0.2+i*40); for(let k2=0;k2<=10;k2++) x.lineTo(k2*w/10,h*0.2+i*40+Math.sin(k2*0.8+t*0.6+i)*30); for(let k2=10;k2>=0;k2--) x.lineTo(k2*w/10,h*0.2+i*40+60+Math.sin(k2*0.7+t*0.5+i)*30); x.fill(); } }
 { const mx=w*0.78, my=h*0.16-Math.min(40,m*0.02); const mg=x.createRadialGradient(mx,my,10,mx,my,80); mg.addColorStop(0,'rgba(255,248,220,.45)'); mg.addColorStop(1,'rgba(255,248,220,0)'); x.fillStyle=mg; x.beginPath(); x.arc(mx,my,80,0,7); x.fill(); x.fillStyle='#fff7dc'; x.beginPath(); x.arc(mx,my,26,0,7); x.fill(); x.fillStyle='rgba(200,190,160,.35)'; [[-8,-6,6],[9,4,4],[-2,10,3.5]].forEach(([a,b,r])=>{ x.beginPath(); x.arc(mx+a,my+b,r,0,7); x.fill(); }); }
 const far=J.bg.far, near=J.bg.near; const fy=h-200+(-J.cam-0)*0.12-0; if(fy<h) x.drawImage(far,0,fy,w,220); const ny=h-130+(-J.cam)*0.28; if(ny<h) x.drawImage(near,0,ny,w,160);
 const gy=h-48-J.cam; if(gy<h){ x.fillStyle='#eef4ff'; x.fillRect(0,gy,w,h); for(let i=0;i<6;i++){ const tx=(i*0.19+0.03)*w; treeJ(x,tx,gy+4,46+(i%3)*14); } }
 J.plat.forEach(q=>drawPlat(x,q,q.y-J.cam));
 J.items.forEach(it=>{ if(it.got&&it.t!=='spring') return; if(it.t==='star') drawStar(x,it.x,it.y-J.cam,11,t); else { const ix=it.p.x+it.dx, iy=it.p.y-J.cam+2; if(it.t==='spring') drawSpring(x,ix,iy,it.c>0); else drawRocket(x,ix,iy-22,0.9,false); } });
 J.parts.forEach(q=>{ x.globalAlpha=Math.max(0,q.l*2); x.fillStyle=q.c; x.beginPath(); x.arc(q.x,q.y-J.cam,q.r,0,7); x.fill(); }); x.globalAlpha=1;
 const py=p.y-J.cam; if(p.rocket>0){ drawRocket(x,p.x-p.face*16,py+6,1.1,true); }
 const spr=J.spr; if(spr){ const sw=74, sh=sw*spr.height/spr.width; const st=p.vy<0?Math.min(1.12,1+(-p.vy)/9000):1; const sx=sw*(p.sq<1?2-p.sq:1/Math.sqrt(st)), sy=sh*p.sq*st; x.save(); x.translate(p.x,py+30); if(J.dead) x.rotate(Math.sin(t*10)*0.3); x.scale(p.face,1); x.drawImage(spr,-sx/2,-sy,sx,sy); x.restore(); }
 J.flakes.forEach(f=>{ f.y+=f.v/60*f.z; f.x+=Math.sin(t+f.r)*0.3; if(f.y>h) { f.y=-4; f.x=Math.random()*w; } x.fillStyle='rgba(255,255,255,'+(0.4+f.z*0.5)+')'; x.beginPath(); x.arc(f.x,f.y,f.r*f.z+0.4,0,7); x.fill(); });
 if(J.score!==J._ls){ J._ls=J.score; J.hud.s.textContent=J.score+' m'; J.hud.st.textContent='⭐ '+J.stars; J.hud.hi.textContent='🏆 '+Math.max(J.hiStart,J.score); }
 if(J.hint>0){ J.hint-=J.fdt||0.016; x.save(); x.globalAlpha=Math.min(1,J.hint); x.fillStyle='rgba(10,14,40,.55)'; x.beginPath(); x.roundRect(w/2-150,h*0.62,300,64,18); x.fill(); x.fillStyle='#fff'; x.font='700 17px system-ui'; x.textAlign='center'; x.fillText(J.hasTilt?'📱 Handy kippen zum Lenken':'👈 Links / rechts tippen 👉',w/2,h*0.62+27); x.font='600 14px system-ui'; x.fillText('Durch den Rand kommst du auf der anderen Seite raus!',w/2,h*0.62+49); x.restore(); } }
function treeJ(x,cx,by,hh){ x.fillStyle='#1f4a3a'; for(let i=0;i<3;i++){ const ty=by-hh*(0.25+i*0.27), tw=hh*0.62*(1-i*0.24); x.beginPath(); x.moveTo(cx,ty-hh*0.32); x.lineTo(cx-tw/2,ty+hh*0.06); x.lineTo(cx+tw/2,ty+hh*0.06); x.closePath(); x.fill(); x.fillStyle='rgba(245,250,255,.9)'; x.beginPath(); x.moveTo(cx,ty-hh*0.32); x.lineTo(cx-tw*0.3,ty-hh*0.06); x.lineTo(cx+tw*0.3,ty-hh*0.06); x.closePath(); x.fill(); x.fillStyle='#1f4a3a'; } }
function jumpOver(){ if(J.dead) return; J.dead=true; S('fall',0.6); const x=XS(); const nb=J.score>(x.hi||0); if(nb){ x.hi=J.score; K.save(); }
 setTimeout(()=>{ if(!J.run) return; J.ov.innerHTML='<h1>'+(nb?'Neuer Rekord!':'Hoppla!')+'</h1><div class="sc">'+J.score+' m · ⭐ '+J.stars+'</div><p>🏆 Bestwert: '+(x.hi||0)+' m</p><div class="bt" style="display:flex;gap:10px"><button class="xbtn" data-a="r">Nochmal 🚀</button><button class="xbtn al" data-a="q">Fertig</button></div>'; J.ov.classList.add('show');
  J.ov.querySelector('[data-a=r]').onclick=()=>{ J.ov.classList.remove('show'); jumpReset(); J.hint=0; }; J.ov.querySelector('[data-a=q]').onclick=()=>X.jumpEnd(); if(nb) S('glitter',0.6); },900); }
X.jumpStart=async function(){ if(!XS().jump) return; jumpInit(); try{ const G=window.GissGames; G&&G._enter&&G._enter('xjump'); }catch(e){} document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show'));
 try{ J.spr=snapDressed(); }catch(e){ console.warn(e); J.spr=null; } J.root.classList.add('show'); K.st.wimmel=true; jumpReset(); J.hint=4; J.ov.classList.remove('show'); J.run=true; J.last=performance.now();
 try{ if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission(); }catch(e){}
 musOn(); J.music=(MUS.ok===false&&musLv()<2)?S('bells',musLv()?0.3:0.16,{loop:true}):null; cancelAnimationFrame(J.raf); J.raf=requestAnimationFrame(jumpFrame); };
X.jumpEnd=function(){ J.run=false; musOff(); cancelAnimationFrame(J.raf); if(J.music){ try{ J.music.s.stop(); }catch(e){} J.music=null; } if(J.root) J.root.classList.remove('show'); K.st.wimmel=false; try{ const G=window.GissGames; G&&G._leave&&G._leave(); }catch(e){}
 (async()=>{ const k=K, t=k.begin(); k.rest(); k.A.hop=0.5; k.A.blush=0.6; await wait(300); await wait(k.say('Das war lustig! Nochmal hüpfen?')*1000+200); if(k.alive(t)) k.rest(); })(); };

function snapDressed(){ const k=K, R=k.R, TH=k.THREE; const vis=[]; k.stage.children.forEach(c=>{ vis.push([c,c.visible]); if(c!==k.G.group) c.visible=false; });
 const sp=k.G.group.rotation.y; k.G.group.rotation.y=0; const bg=k.S.background; k.S.background=null; const cc=R.getClearAlpha(); R.setClearAlpha(0); R.render(k.S,k.cam);
 const pts=[[0,1.32,0],[0,-0.02,0],[-0.6,0.55,0],[0.6,0.55,0]].map(p=>{ const v=new TH.Vector3(...p); k.G.root.localToWorld(v); v.project(k.cam); return v; }); const cv=R.domElement, w=cv.width, h=cv.height;
 const x0=Math.min(...pts.map(v=>v.x)), x1=Math.max(...pts.map(v=>v.x)), y0=Math.min(...pts.map(v=>v.y)), y1=Math.max(...pts.map(v=>v.y));
 const sx=(x0*.5+.5)*w, sy=(-y1*.5+.5)*h, sw=(x1-x0)*.5*w, sh=(y1-y0)*.5*h; const C=document.createElement('canvas'); const sc=Math.min(1,300/sw); C.width=Math.round(sw*sc); C.height=Math.round(sh*sc);
 C.getContext('2d').drawImage(cv,sx,sy,sw,sh,0,0,C.width,C.height); R.setClearAlpha(cc); k.S.background=bg; vis.forEach(([c,v])=>c.visible=v); k.G.group.rotation.y=sp; return C; }
/* ---------- Silvester ---------- */
let fw=null, fwx=null, fwP=[], fwR=[], fwNext=0, dim=null, spk=null, spkOn=0, silPan=null;
function fwInit(){ if(fw) return; const bg=document.getElementById('bg'); fw=el('canvas',''); fw.id='xfw'; dim=el('div',''); dim.id='xdim'; if(bg&&bg.parentNode){ bg.parentNode.insertBefore(dim,bg.nextSibling); bg.parentNode.insertBefore(fw,dim.nextSibling); } else { document.body.appendChild(dim); document.body.appendChild(fw); } fwx=fw.getContext('2d'); }
function launch(o){ o=o||{}; fwInit(); const w=innerWidth, h=innerHeight; const hue=Math.random()*360; fwR.push({x:o.x!=null?o.x:w*(0.12+Math.random()*0.76),y:h*0.75,vx:(Math.random()-0.5)*40,vy:-(h*0.55+Math.random()*h*0.25),ty:o.ty!=null?o.ty:h*(0.1+Math.random()*0.28),hue,kind:o.kind||['ball','ring','willow','star'][Math.floor(Math.random()*4)]}); if(!o.quiet) S('firework',o.gain||0.5,{rate:0.92+Math.random()*0.16}); }
function burst(r){ const n=r.kind==='ring'?60:r.kind==='willow'?90:r.kind==='star'?50:80; const c2=(r.hue+40+Math.random()*80)%360; for(let i=0;i<n;i++){ let a=i/n*Math.PI*2, sp; if(r.kind==='ring') sp=150; else if(r.kind==='star') sp=(90+70*Math.abs(Math.cos(a*2.5)))*1.1; else sp=40+Math.random()*170; const hu=i%3?r.hue:c2;
  fwP.push({x:r.x,y:r.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,l:r.kind==='willow'?2.4:1.4+Math.random()*0.6,L:2.4,c:'hsl('+hu+',100%,'+(60+Math.random()*20)+'%)',w:r.kind==='willow',tw:Math.random()<0.3}); }
 fwP.push({x:r.x,y:r.y,vx:0,vy:0,l:0.25,L:0.25,flash:1}); }
function fwTick(dt){ if(!fw) return; const d=Math.min(2,devicePixelRatio||1); if(fw.width!==Math.round(innerWidth*d)){ fw.width=Math.round(innerWidth*d); fw.height=Math.round(innerHeight*d); } const x=fwx; x.setTransform(d,0,0,d,0,0);
 x.globalCompositeOperation='destination-out'; x.fillStyle='rgba(0,0,0,'+Math.min(1,dt*9)+')'; x.fillRect(0,0,innerWidth,innerHeight); x.globalCompositeOperation='lighter';
 fwR=fwR.filter(r=>{ const oy=r.y; r.x+=r.vx*dt; r.y+=r.vy*dt; r.vy+=220*dt; x.strokeStyle='rgba(255,220,160,.9)'; x.lineWidth=2; x.beginPath(); x.moveTo(r.x,oy+8); x.lineTo(r.x,r.y); x.stroke(); if(Math.random()<0.7) fwP.push({x:r.x,y:r.y,vx:(Math.random()-0.5)*30,vy:30+Math.random()*40,l:0.4,L:0.4,c:'rgba(255,200,120,1)'}); if(r.y<=r.ty||r.vy>=0){ burst(r); return false; } return true; });
 fwP=fwP.filter(p=>{ p.l-=dt; if(p.l<=0) return false; if(p.flash){ const g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,90); g.addColorStop(0,'rgba(255,255,240,'+(p.l*2.4)+')'); g.addColorStop(1,'rgba(255,255,240,0)'); x.fillStyle=g; x.fillRect(p.x-90,p.y-90,180,180); return true; }
  const dr=p.w?1.6:2.4; p.vx*=Math.exp(-dr*dt); p.vy*=Math.exp(-dr*dt); p.vy+=(p.w?60:90)*dt; const ox=p.x, oy=p.y; p.x+=p.vx*dt; p.y+=p.vy*dt; const a=Math.min(1,p.l/(p.L*0.5)); if(p.tw&&Math.random()<0.4) return true; x.globalAlpha=a; x.strokeStyle=p.c; x.lineWidth=p.w?1.6:2.2; x.beginPath(); x.moveTo(ox,oy); x.lineTo(p.x,p.y); x.stroke(); x.globalAlpha=1; return true; }); x.globalCompositeOperation='source-over'; }
function sparkler(){ const k=K; if(!spk){ spk=el('canvas',''); spk.id='xspark'; document.body.appendChild(spk); } spkOn=performance.now()+8000; const s1=S('sparkler',0.55,{loop:true}); setTimeout(()=>{ try{ s1&&s1.s.stop(); }catch(e){} },8000);
 (async()=>{ const t=k.begin(); k.rest(); k.A.pup=1.45; k.A.earUp=0.9; k.A.blush=0.8; k.A.lid=-0.03; await wait(500); if(!k.alive(t)) return; await wait(k.say('Oooh! Eine Wunderkerze! Das funkelt ja!')*1000+400); if(!k.alive(t)) return; k.A.hop=0.6; k.mouthPlay(k.V.giggle(4)); await wait(2500); if(k.alive(t)) k.rest(); })(); }
function spkTick(dt){ if(!spk) return; const on=performance.now()<spkOn; const d=Math.min(2,devicePixelRatio||1); if(spk.width!==Math.round(innerWidth*d)){ spk.width=Math.round(innerWidth*d); spk.height=Math.round(innerHeight*d); } const x=spk.getContext('2d'); x.setTransform(d,0,0,d,0,0); x.clearRect(0,0,innerWidth,innerHeight); if(!on){ spk.style.display='none'; return; } spk.style.display='';
 const H=GF.H; const b0=H.scr([0.36,0.28,0.2],K.G.root), t0=H.scr([0.52,0.78,0.26],K.G.root), base={x:b0[0],y:b0[1]}, tipW={x:t0[0],y:t0[1]}; const left=(spkOn-performance.now())/8000; const tx=base.x+(tipW.x-base.x)*(0.35+0.65*left), ty=base.y+(tipW.y-base.y)*(0.35+0.65*left);
 x.strokeStyle='#5a5a62'; x.lineWidth=3; x.lineCap='round'; x.beginPath(); x.moveTo(base.x,base.y); x.lineTo(tipW.x,tipW.y); x.stroke(); x.strokeStyle='#8a7a6a'; x.lineWidth=5; x.beginPath(); x.moveTo(tx,ty); x.lineTo(tipW.x,tipW.y); x.stroke();
 const g=x.createRadialGradient(tx,ty,0,tx,ty,46); g.addColorStop(0,'rgba(255,250,220,.95)'); g.addColorStop(0.2,'rgba(255,210,120,.5)'); g.addColorStop(1,'rgba(255,180,80,0)'); x.fillStyle=g; x.beginPath(); x.arc(tx,ty,46,0,7); x.fill();
 x.globalCompositeOperation='lighter'; for(let i=0;i<38;i++){ const a=Math.random()*Math.PI*2, r=8+Math.random()*44; const ex=tx+Math.cos(a)*r, ey=ty+Math.sin(a)*r; x.strokeStyle=Math.random()<0.5?'rgba(255,240,200,.95)':'rgba(255,200,110,.9)'; x.lineWidth=1.2; x.beginPath(); x.moveTo(tx+Math.cos(a)*r*0.3,ty+Math.sin(a)*r*0.3); x.lineTo(ex,ey); if(Math.random()<0.4){ const b=a+(Math.random()-0.5)*1.6; x.lineTo(ex+Math.cos(b)*8,ey+Math.sin(b)*8); } x.stroke(); } x.globalCompositeOperation='source-over'; }
async function knaller(){ const k=K, H=GF.H; S('knaller',0.8); const p=H.scr([0.6,0.05,0.4],K.G.root); H.pf('💥',p,{n:1,dy:-40,s0:.6,s1:2.2,fs:60,d:0.9}); for(let i=0;i<24;i++){ H.pf(['🎊','✨','🎉','⭐'][i%4],p,{n:1,dx:(Math.random()-0.5)*420,dy:-80-Math.random()*260,s0:.4,s1:1,fs:22+Math.random()*14,d:1.6+Math.random()}); }
 const t=k.begin(); k.rest(); await wait(120); k.A.sq=-0.12; k.A.hop=1.4; k.A.lid=-0.08; k.A.pup=1.6; k.A.earUp=1.2; k.A.trem=1; await wait(500); if(!k.alive(t)) return; k.A.hop=0; k.A.trem=0; k.A.sq=0; await wait(k.say('Huch! Das war aber laut!')*1000+200); if(!k.alive(t)) return; k.mouthPlay(k.V.giggle(3)); await wait(1300); if(k.alive(t)) k.rest(); }
async function rakete(){ const k=K; const w=innerWidth, h=innerHeight; const t=k.begin(); k.rest(); k.A.pup=1.35; k.A.earUp=0.8; k.A.lookY=0.5; launch({x:w*0.5,ty:h*0.16,gain:0.8,kind:'star'}); await wait(500); launch({x:w*0.28,ty:h*0.24,quiet:true}); launch({x:w*0.72,ty:h*0.22,quiet:true}); await wait(1200); if(!k.alive(t)) return; k.A.lookY=0; await wait(k.say('Wow! Guck mal, wie schön!')*1000+300); if(k.alive(t)) k.rest(); }
function wearParty(){ ['hat:silvesterhut','glasses:sternbrille','neck:glitzerfliege'].forEach(s=>{ const [a,b]=s.split(':'); GissWear._wear(a,b); }); setTimeout(()=>GissWear.react('silvesterhut',{say:'Prosit Neujahr!'}),300); }
function silPanel(){ if(silPan) return silPan; const p=el('div','panel'); p.id='xsil'; p.innerHTML='<div class="ph"><b>🎆 Silvester-Party</b><button class="x">✕</button></div><div class="grid"></div>';
 const g=p.querySelector('.grid'); [['spark','🎇','Wunderkerze','funkelt'],['knall','🧨','Knaller','bumm!'],['rak','🚀','Rakete','Feuerwerk'],['sekt','🥂','Kindersekt','prickelt'],['party','🎩','Party-Outfit','anziehen']].forEach(([id,e,n,h])=>{ const b=el('button','fd','<i>'+e+'</i><b>'+n+'</b><small>'+h+'</small>'); b.onclick=()=>{ p.classList.remove('show'); K.interact(); if(id==='spark') sparkler(); else if(id==='knall') knaller(); else if(id==='rak') rakete(); else if(id==='sekt') GF.eat('kindersekt'); else wearParty(); }; g.appendChild(b); });
 p.querySelector('.x').onclick=()=>p.classList.remove('show'); document.body.appendChild(p); silPan=p; return p; }
let cdEl=null;
function countdownTick(){ const d=D(); if(!(d.getMonth()===11&&d.getDate()===31&&d.getHours()===23&&d.getMinutes()===59&&d.getSeconds()>=50)) { if(cdEl&&cdEl.style.opacity==='1'){ cdEl.style.opacity='0'; } return; } if(!cdEl){ cdEl=el('div',''); cdEl.id='xcount'; document.body.appendChild(cdEl); } const n=60-d.getSeconds(); if(cdEl.textContent!==String(n)){ cdEl.textContent=n; cdEl.style.opacity='1'; } }
let wasNY=false;
function newYearCheck(){ const d=D(); const ny=d.getMonth()===0&&d.getDate()===1&&d.getHours()===0&&d.getMinutes()<1; if(ny&&!wasNY){ wasNY=true; if(cdEl) cdEl.style.opacity='0'; for(let i=0;i<6;i++) setTimeout(()=>launch({gain:i?0.35:0.8}),i*450); setTimeout(()=>{ const k=K, t=k.begin(); k.rest(); k.A.hop=1; k.A.blush=1; k.say('Frohes neues Jahr!'); setTimeout(()=>{ if(k.alive(t)) k.rest(); },3000); },1200); } }
/* ---------- Chips, Menü, Init ---------- */
let chipC=null, chipS=null, lastSeason=null, lastSil=null;
function updChip(){ if(!chipC) return; const x=XS(), td=Math.min(24,today()); let due=false; for(let n=1;n<=td;n++) if(!x.open[n]) due=true; chipC.classList.toggle('due',due&&season()); }
function seasonUpd(){ const s=season(), sv=silvester(); if(s!==lastSeason){ lastSeason=s; chipC.style.display=s?'':'none'; } if(sv!==lastSil){ lastSil=sv; chipS.style.display=sv?'':'none'; if(dim) dim.classList.toggle('on',sv); if(sv){ fwInit(); dim.classList.add('on'); const x=XS(); if(!x.got.silvester){ x.got.silvester=1; K.save(); setTimeout(()=>{ K.toast('🎆 Neu im Kleiderschrank: Silvester-Outfit!'); },2500); } } } updChip(); }
X.tick=function(dt,t){ if(!K) return; if(!sndLoading&&K.V.ctx) loadSnd(); const now=performance.now(); if(!X._sc||now-X._sc>5000){ X._sc=now; seasonUpd(); }
 if(silvester()&&!K.st.wimmel&&now>fwNext&&K.st.mode!=='sleep'){ fwNext=now+2500+Math.random()*5000; launch({gain:0.22,quiet:Math.random()<0.4}); if(Math.random()<0.25) setTimeout(()=>launch({quiet:true}),300); }
 if(fw&&(fwR.length||fwP.length||silvester())) fwTick(Math.min(0.05,dt||0.016)); spkTick(dt); if(silvester()){ countdownTick(); newYearCheck(); } };
X.init=function(k){ K=k; THREE=k.THREE; T=k.THREE; const st=el('style'); st.textContent=CSS; document.head.appendChild(st); XS(); wrapVoice();
 const top=document.getElementById('top'); chipC=el('div','chip xchip','🎄 Kalender'); chipC.id='xcalC'; chipC.style.display='none'; chipC.onclick=()=>{ K.V.unlock&&K.V.unlock(); X.openCal(); };
 chipS=el('div','chip xsil','🎆 Silvester'); chipS.id='xsilC'; chipS.style.display='none'; chipS.onclick=()=>{ K.V.unlock&&K.V.unlock(); document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show')); silPanel().classList.add('show'); };
 const clock=document.getElementById('clock'); if(top){ top.insertBefore(chipS,clock||null); top.insertBefore(chipC,chipS); }
 const G=window.GissGames; if(G) G.menuHook=menu=>{ const gt=menu.querySelector('.gt'); let b=menu.querySelector('.gb[data-g=xjump]'); if(!XS().jump){ if(b) b.remove(); return; } if(!b&&gt){ b=el('button','gb','<i>🚀</i>Moe Jump<small>hüpf ganz hoch</small>'); b.dataset.g='xjump'; b.style.background='linear-gradient(180deg,#7fd3ff,#3a6fd8)'; b.style.gridColumn='span 2'; b.style.minHeight='96px'; b.addEventListener('pointerup',e=>{ e.stopPropagation(); menu.classList.remove('show'); X.jumpStart(); }); gt.appendChild(b); } };
 seasonUpd(); try{ GissWear.mark(); }catch(e){}
 if(season()){ const x=XS(); if(!x.hello){ x.hello=1; K.save(); setTimeout(async()=>{ if(K.st.game||K.st.busy) return; K.toast('🎄 Der Adventskalender ist da! Tipp oben auf „Kalender“.'); const t=K.begin(); K.rest(); K.A.hop=0.6; K.A.blush=0.8; await wait(K.say('Juhu! Ein Adventskalender! Komm, wir machen ein Türchen auf!')*1000+200); if(K.alive(t)) K.rest(); },4500); } } };
/* Registrierung VOR GissWear.init / GissFun.init */
try{ wearItems(); }catch(e){ console.error('xmas wear',e); } try{ regFoods(); }catch(e){ console.error('xmas food',e); } if(GF) GF.xEat=Object.assign(GF.xEat||{},XE);
X.sfx=(n,g,o)=>{ try{ loadSnd(); }catch(e){} return S(n,g,o); };
X._dbg={XS:()=>XS(),plan:()=>plan(),launch,sparkler,knaller,rakete,J};
window.GissXmas=X;
})();
