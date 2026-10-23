/* Sonnen-Oase – Bräunen & Massage (Mall 1984, Abstecher). Minispiel: Öl vom Wagen nehmen, Kundin einreiben, bis sie glänzt → „Danke, Kleiner.“
   Glanz = Mal-Maske (Canvas, Draufsicht der Figur) steuert Rauheit/Klarlack/Nässe im Haut-Shader. Kein HUD, kein Leucht-Hotspot: der Fortschritt IST der Glanz.
   Figur austauschbar: window.OASE.fig = {lie, up} (GLB, Meter, liegt entlang x, Kopf bei −x, Ursprung = Liegefläche). Knotennamen:
   body (Haut; COLOR_0.a = ölbar), hair, towel (nur ab 18), robe/strap/top (nur jugendfrei), chest (Handtuch vor der Brust, Pose "up").
   Fremde GLBs ohne diese Namen: alle Meshes gelten als body. Ab-18-Dateien (fig.lieAdult/upAdult) werden NUR geladen, wenn ZS_ADULT === true.
   Steuerung: VR Trigger/Griff gedrückt halten und mit dem Controller über die Haut fahren · Handy: auf ihr wischen · PC: Maus gedrückt ziehen. */
(function(){
const T=THREE, Q=new URLSearchParams(location.search), MUTE=Q.has('mute');
const C=Object.assign({fig:{lie:'../assets/oase/kundin_lie.glb',up:'../assets/oase/kundin_up.glb'},base:'../assets/oase/'},window.OASE||{});
const ADULT=()=>window.ZS_ADULT===true;
// Brust-Zone (figur-lokal, Draufsicht): dort KEIN Öl, KEINE Verformung, keine Wirkung – nur der Ohrfeigen-Gag, wenn man dort 15–20 s verweilt (nur ab 18). Neue Figur: window.OASE.chest anpassen.
const CHEST0=Object.assign({x0:-0.56,x1:-0.30,zIn:0.16,zOut:9},C.chest||{});   // Ab-18-Figur (Rückenlage): window.OASE.chestAdult
const chestZ=()=>(ADULT()&&C.chestAdult)?Object.assign({},CHEST0,C.chestAdult):CHEST0;
const inChest=(lx,lz)=>{ const CHEST=chestZ(); return lx>CHEST.x0&&lx<CHEST.x1&&Math.abs(lz)>CHEST.zIn&&Math.abs(lz)<CHEST.zOut; };   // jedes Mal neu prüfen (kein zwischengespeicherter Zustand)
const RW={x0:-2.0,x1:2.0,z0:-2.2,z1:2.0,h:2.55};   // Raum
const TB={x:-0.35,z:-0.35,len:1.75,w:0.66,top:0.70}; // Massageliege (Polster-Oberkante)
const FIG={x:-0.40,y:TB.top,z:-0.35};                // Ursprung der Figur
const CART={x:1.05,z:0.0};
let S,G,R,TL,cam,rig;
const tex=(u,srgb,rx,ry)=>{ const t=TL.load(u); t.wrapS=t.wrapT=T.RepeatWrapping; if(srgb) t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; if(rx) t.repeat.set(rx,ry||rx); return t; };
const cv=(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; t.anisotropy=4; return t; };
let sd=8419; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
// ---------------------------------------------------------------- Raum
function buildRoom(){
 const std=o=>new T.MeshStandardMaterial(o), add=(g,m,x,y,z)=>{ const o=new T.Mesh(g,m); o.position.set(x||0,y||0,z||0); G.add(o); return o; };
 const W=RW.x1-RW.x0, D=RW.z1-RW.z0, cx=(RW.x0+RW.x1)/2, cz=(RW.z0+RW.z1)/2;
 // Boden: terrakotta Fliesen (Hallenbad-Fliese getönt), nass gewischt
 const fl=std({map:tex('../assets/tex/pool/floor_c.jpg',1,3,3),normalMap:tex('../assets/tex/pool/floor_n.jpg',0,3,3),color:0xb07a5a,roughness:0.38,metalness:0});
 const fg=new T.PlaneGeometry(W,D); fg.rotateX(-Math.PI/2); add(fg,fl,cx,0,cz);
 // Wände: Kiefern-Paneele (80er Saunalook), oben Rauputz
 const pan=(w)=>{ const ry=w/1.1; return std({map:tex('../assets/tex/kirmes/WoodFloor/WoodFloor051_1K-JPG_Color.jpg',1,1,ry),normalMap:tex('../assets/tex/kirmes/WoodFloor/WoodFloor051_1K-JPG_NormalGL.jpg',0,1,ry),roughnessMap:tex('../assets/tex/kirmes/WoodFloor/WoodFloor051_1K-JPG_Roughness.jpg',0,1,ry),color:0xb08058}); };
 const pl=std({map:tex('../assets/tex/kirmes/Painted/PaintedPlaster017_1K-JPG_Color.jpg',1,2,0.6),normalMap:tex('../assets/tex/kirmes/Painted/PaintedPlaster017_1K-JPG_NormalGL.jpg',0,2,0.6),color:0x8a6a58,roughness:0.95});
 const wall=(w,x,z,ry,mat,y0,y1)=>{ const g=new T.PlaneGeometry(w,y1-y0); g.rotateY(ry); g.translate(x,(y0+y1)/2,z); G.add(new T.Mesh(g,mat)); };
 const pM=pan(D);
 [[D,RW.x0,cz,Math.PI/2],[D,RW.x1,cz,-Math.PI/2]].forEach(([w,x,z,r])=>{ const pg=new T.PlaneGeometry(1.9,w); pg.rotateZ(Math.PI/2); /* Bretter senkrecht */ pg.rotateY(r); pg.translate(x,0.95,z); G.add(new T.Mesh(pg,pM)); wall(w,x,z,r,pl,1.9,RW.h); });
 { const pg=new T.PlaneGeometry(1.9,W); pg.rotateZ(Math.PI/2); pg.translate(cx,0.95,RW.z0); G.add(new T.Mesh(pg,pan(W))); wall(W,cx,RW.z0,0,pl,1.9,RW.h); }
 // Eingangswand (+z) mit Türöffnung x 0.4..1.4 (Perlenvorhang)
 [[RW.x0,0.4],[1.4,RW.x1]].forEach(([a,b])=>{ const pg=new T.PlaneGeometry(1.9,b-a); pg.rotateZ(Math.PI/2); pg.rotateY(Math.PI); pg.translate((a+b)/2,0.95,RW.z1); G.add(new T.Mesh(pg,pan(b-a))); wall(b-a,(a+b)/2,RW.z1,Math.PI,pl,1.9,RW.h); });
 wall(1.0,0.9,RW.z1,Math.PI,pl,2.1,RW.h);
 // Zierleisten (dunkles Holz) oben an den Paneelen + Fußleiste
 const tr=std({color:0x3a2416,roughness:0.6});
 [[W,cx,RW.z0+0.012,0],[D,RW.x0+0.012,cz,Math.PI/2],[D,RW.x1-0.012,cz,Math.PI/2]].forEach(([w,x,z,r])=>{ [1.9,0.04].forEach(y=>{ const b=add(new T.BoxGeometry(w,y>1?0.05:0.08,0.025),tr,x,y,z); b.rotation.y=r; }); });
 // Decke: Akustikplatten, dunkel
 const cg=new T.PlaneGeometry(W,D); cg.rotateX(Math.PI/2); add(cg,std({map:tex('../assets/tex/arc2/ceil_c.jpg',1,3,3),normalMap:tex('../assets/tex/arc2/ceil_n.jpg',0,3,3),color:0x6a5a50,roughness:0.95}),cx,RW.h,cz);
 // Fototapete Palmenstrand (Rückwand links, über der Liege), mit Leiste
 { const m=std({map:tex(C.base+'fototapete.jpg',1),roughness:0.8,color:0xd8c8b8}); const g=new T.PlaneGeometry(2.3,1.29); add(g,m,-0.85,1.32,RW.z0+0.015);
   [[0,0.66],[0,-0.66]].forEach(([dx,dy])=>add(new T.BoxGeometry(2.36,0.03,0.03),tr,-0.85+dx,1.32+dy,RW.z0+0.02)); [[-1.16],[1.16]].forEach(([dx])=>add(new T.BoxGeometry(0.03,1.35,0.03),tr,-0.85+dx,1.32,RW.z0+0.02)); }
 // Preistafel (Kork, Letraset-Buchstaben) rechts vom Eingang innen
 { const t=cv(512,640,(x,w,h)=>{ x.fillStyle='#6b4a2c'; x.fillRect(0,0,w,h); for(let i=0;i<5000;i++){ x.fillStyle=`rgba(${40+rnd()*60|0},${25+rnd()*40|0},10,${0.3+rnd()*0.4})`; x.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*2); }
    x.fillStyle='#efe4cc'; x.fillRect(36,40,440,560); x.fillStyle='rgba(120,90,40,0.12)'; x.fillRect(36,40,440,560);
    x.fillStyle='#b3262e'; x.font='700 50px "DejaVu Sans Condensed",sans-serif'; x.textAlign='center'; x.fillText('SONNEN-OASE',256,108); x.fillStyle='#3a2a1a'; x.font='italic 26px serif'; x.fillText('Bräunen & Massage · seit 1981',256,146);
    x.strokeStyle='#b3262e'; x.lineWidth=3; x.beginPath(); x.moveTo(70,166); x.lineTo(442,166); x.stroke();
    x.textAlign='left'; x.font='600 27px "DejaVu Sans Condensed",sans-serif'; x.fillStyle='#22180f';
    [['Sonnenbank 10 Min.','5,– DM'],['Turbo-Bräuner 15 Min.','9,– DM'],['10er-Karte Sonne','40,– DM'],['Ganzkörper-Ölmassage','25,– DM'],['Kokos-Öl (Flasche)','6,50 DM']].forEach(([a,b],i)=>{ x.fillText(a,64,222+i*56); x.textAlign='right'; x.fillText(b,448,222+i*56); x.textAlign='left'; });
    x.font='italic 22px serif'; x.fillStyle='#5a4530'; x.fillText('Mo–Fr 9–18.30 · Sa 9–14 Uhr',64,520); x.fillText('Brille bitte selbst mitbringen!',64,556);
    x.fillStyle='#c8b24a'; [[60,60],[452,60],[60,580],[452,580]].forEach(([a,b])=>{ x.beginPath(); x.arc(a,b,9,0,7); x.fill(); }); });
   const b=add(new T.PlaneGeometry(0.46,0.575),std({map:t,roughness:0.85}),1.75,1.45,RW.z1-0.015); b.rotation.y=Math.PI; b.rotation.z=0.02; }
 // Neon-Schriftzug „Sonnen-Oase“ (rosa, Wand links) – Lichtquelle, kein Hotspot
 { const t=cv(1024,256,(x,w,h)=>{ x.fillStyle='#000'; x.fillRect(0,0,w,h); x.font='italic 700 118px "DejaVu Serif",serif'; x.textAlign='center'; x.textBaseline='middle'; x.shadowColor='#ff3a8a'; x.shadowBlur=28; x.fillStyle='#ffb0d0'; x.fillText('Sonnen-Oase',512,128); x.shadowBlur=0; x.fillStyle='#fff0f6'; x.fillText('Sonnen-Oase',512,128); });
   const m=new T.MeshBasicMaterial({map:t,transparent:true,blending:T.AdditiveBlending,depthWrite:false,color:0xd07090,toneMapped:false,fog:false}); const s=add(new T.PlaneGeometry(1.2,0.3),m,RW.x0+0.03,2.15,-0.6); s.rotation.y=Math.PI/2; window.__oaseNeon=m; }
 // Pendelleuchte mit orangem Glasschirm über der Liege
 { const sh=new T.Mesh(new T.SphereGeometry(0.2,24,12,0,Math.PI*2,0,Math.PI*0.48),std({color:0xff8a3a,emissive:0xff6a1a,emissiveIntensity:0.55,roughness:0.3,side:T.DoubleSide,transparent:true,opacity:0.92})); sh.position.set(TB.x,1.78,TB.z); G.add(sh);
   const bulb=new T.Mesh(new T.SphereGeometry(0.045,12,8),new T.MeshBasicMaterial({color:0xffc890,toneMapped:false})); bulb.position.set(TB.x,1.74,TB.z); G.add(bulb);
   add(new T.CylinderGeometry(0.004,0.004,RW.h-1.95,4),std({color:0x111111}),TB.x,(RW.h+1.95)/2,TB.z); window.__oaseShade=sh.material; }
 // Lichter: warm (Lampe), UV-Blau (Sonnenbank), rosa (Neon), Grundlicht
 const Lh=new T.HemisphereLight(0x5a4038,0x1a0f0a,0.55); S.add(Lh);
 const Lw=new T.PointLight(0xffa460,4.6,5.5,1.6); Lw.position.set(TB.x,1.62,TB.z); S.add(Lw); window.__oaseLw=Lw;
 const Lb=new T.PointLight(0x6a78ff,3.2,4.2,1.7); Lb.position.set(1.0,0.9,-1.5); S.add(Lb); window.__oaseLb=Lb;
 const Lp=new T.PointLight(0xff4a90,0.9,3.2,1.8); Lp.position.set(RW.x0+0.35,2.0,-0.6); S.add(Lp);
 const Lf=new T.PointLight(0xffc8a0,0.6,3.5,1.8); Lf.position.set(0.9,1.9,1.4); S.add(Lf);
 buildBed(std); buildTable(std); buildCart(std); buildDeco(std); buildGauge(std); buildCurtain();
 // o14: weiches VR-Licht – Umgebung dunkler (versteckt schwache Stellen), dafür breites warmes Weichlicht nur über ihr (kein harter Spot, kein Schwarz)
 const Ls=new T.PointLight(0xffb48a,0,1.9,1.2); Ls.position.set(FIG.x+0.15,FIG.y+0.95,FIG.z+0.35); S.add(Ls);
 const softVR=on=>{ Lh.intensity=on?0.40:0.55; Lp.intensity=on?0.65:0.9; Lf.intensity=on?0.42:0.6; Lb.intensity=on?2.7:3.2; Ls.intensity=on?0.85:0; R.toneMappingExposure=on?1.0:1.05; };
 window.__oaseSoftVR=softVR; R.xr.addEventListener('sessionstart',()=>softVR(true)); R.xr.addEventListener('sessionend',()=>softVR(false));
 // Kontaktschatten (gemalt) unter Möbeln
 const sh=cv(128,128,(x,w,h)=>{ const g=x.createRadialGradient(64,64,4,64,64,64); g.addColorStop(0,'rgba(0,0,0,0.75)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,w,h); });
 [[TB.x,TB.z,2.1,0.95],[1.0,-1.75,2.1,1.1],[CART.x,CART.z,0.75,0.55]].forEach(([x,z,w,d])=>{ const g=new T.PlaneGeometry(w,d); g.rotateX(-Math.PI/2); const m=new T.Mesh(g,new T.MeshBasicMaterial({map:sh,transparent:true,depthWrite:false,opacity:0.8})); m.position.set(x,0.004,z); G.add(m); });
}
function buildBed(std){ // Sonnenbank (Klappmodell), offen, Röhren leuchten blau-violett
 const g=new T.Group(); g.position.set(1.0,0,-1.75); G.add(g);
 const shell=std({color:0xd9cdb4,roughness:0.42,metalness:0.05}), dark=std({color:0x2a2622,roughness:0.6});
 const tubeM=new T.MeshStandardMaterial({color:0x222233,emissive:0x8a8cff,emissiveIntensity:1.1,roughness:0.3});
 const acr=new T.MeshStandardMaterial({color:0x9ab0ff,roughness:0.08,metalness:0,transparent:true,opacity:0.28,depthWrite:false});
 const b=new T.Mesh(new T.BoxGeometry(1.95,0.42,0.82),shell); b.position.y=0.21; g.add(b);
 const plinth=new T.Mesh(new T.BoxGeometry(1.85,0.08,0.72),dark); plinth.position.y=0.04; g.add(plinth);
 const rim=new T.Mesh(new T.BoxGeometry(1.95,0.08,0.82),shell); rim.position.y=0.47; g.add(rim);
 for(let i=0;i<9;i++){ const t=new T.Mesh(new T.CylinderGeometry(0.018,0.018,1.75,8),tubeM); t.rotation.z=Math.PI/2; t.position.set(0,0.46,-0.32+i*0.08); g.add(t); }
 const ac=new T.Mesh(new T.BoxGeometry(1.8,0.01,0.7),acr); ac.position.y=0.515; g.add(ac);
 const hinge=new T.Group(); hinge.position.set(0,0.55,-0.4); hinge.rotation.x=-0.62; g.add(hinge);
 const lid=new T.Mesh(new T.BoxGeometry(1.95,0.16,0.8),shell); lid.position.set(0,0.08,0.4); hinge.add(lid);
 for(let i=0;i<9;i++){ const t=new T.Mesh(new T.CylinderGeometry(0.018,0.018,1.75,8),tubeM); t.rotation.z=Math.PI/2; t.position.set(0,-0.01,0.08+i*0.08); hinge.add(t); }
 const ac2=new T.Mesh(new T.BoxGeometry(1.8,0.01,0.72),acr); ac2.position.set(0,-0.03,0.4); hinge.add(ac2);
 // Bedienteil + Aufkleber
 const lab=cv(256,96,(x,w,h)=>{ x.fillStyle='#d9cdb4'; x.fillRect(0,0,w,h); x.fillStyle='#2a2a2a'; x.fillRect(10,10,236,76); x.fillStyle='#e05a2a'; x.font='700 30px "DejaVu Sans Condensed",sans-serif'; x.fillText('SOLARIX 2000',22,50); x.fillStyle='#9ad'; x.font='16px sans-serif'; x.fillText('TURBO · 28 RÖHREN · UV-A',22,76); });
 const pl=new T.Mesh(new T.PlaneGeometry(0.42,0.16),std({map:lab,roughness:0.5})); pl.position.set(0.55,0.3,0.415); g.add(pl);
 window.__oaseTubes=tubeM; }
function buildTable(std){ // Massageliege: Kunstleder-Polster (bordeaux), Chromgestell, Kopfstütze mit Gesichtsloch
 const g=new T.Group(); g.position.set(TB.x,0,TB.z); G.add(g);
 const vin=std({map:tex('../assets/tex/apt/sofa_c.jpg',1,2,1),normalMap:tex('../assets/tex/apt/sofa_n.jpg',0,2,1),color:0x7a1e26,roughness:0.42}), chrome=std({color:0xcfd3d8,metalness:1,roughness:0.22}), wood=std({color:0x5a3a22,roughness:0.6});
 const rb=(w,h,d,r)=>{ const s=new T.Shape(); const x=-w/2,y=-d/2; s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+d-r); s.quadraticCurveTo(x+w,y+d,x+w-r,y+d); s.lineTo(x+r,y+d); s.quadraticCurveTo(x,y+d,x,y+d-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  const ge=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:0.02,bevelSize:0.02,bevelSegments:3,curveSegments:6}); ge.rotateX(-Math.PI/2); return ge; };
 const pad=new T.Mesh(rb(TB.len,0.07,TB.w,0.05),vin); pad.position.set(0.075,TB.top-0.09,0); g.add(pad);
 const base=new T.Mesh(new T.BoxGeometry(TB.len-0.04,0.03,TB.w-0.06),wood); base.position.set(0.075,TB.top-0.11,0); g.add(base);
 // Kopfstütze (Ring), etwas tiefer
 const hr=new T.Mesh(new T.TorusGeometry(0.105,0.04,10,24),vin); hr.rotation.x=Math.PI/2; hr.scale.set(1,1.25,1); hr.position.set(-0.84,TB.top-0.055,0); g.add(hr);
 const hb=new T.Mesh(new T.BoxGeometry(0.06,0.03,0.3),chrome); hb.position.set(-0.76,TB.top-0.11,0); g.add(hb);
 [[-0.68,-0.27],[-0.68,0.27],[0.83,-0.27],[0.83,0.27]].forEach(([x,z])=>{ const l=new T.Mesh(new T.CylinderGeometry(0.018,0.018,TB.top-0.12,10),chrome); l.position.set(x,(TB.top-0.12)/2,z); g.add(l); const f=new T.Mesh(new T.CylinderGeometry(0.03,0.035,0.02,10),std({color:0x111111})); f.position.set(x,0.01,z); g.add(f); });
 [[-0.68],[0.83]].forEach(([x])=>{ const s=new T.Mesh(new T.CylinderGeometry(0.012,0.012,0.54,8),chrome); s.rotation.x=Math.PI/2; s.position.set(x,0.16,0); g.add(s); });
 const sb=new T.Mesh(new T.CylinderGeometry(0.012,0.012,1.51,8),chrome); sb.rotation.z=Math.PI/2; sb.position.set(0.075,0.16,0); g.add(sb);
 // Handtuchrolle unter den Füßen
 const roll=new T.Mesh(new T.CylinderGeometry(0.05,0.05,0.4,16),std({map:terryTex('#efe6da','#d98aa0'),roughness:1})); roll.rotation.x=Math.PI/2; roll.position.set(0.86,TB.top+0.02,0); g.add(roll); }
let _hair=null; function hairTex(){ if(_hair) return _hair; // Föhnwelle: feine Strähnen längs der Körperachse (u), leicht gewellt; Farbe hell/dunkel moduliert, Bump aus derselben Zeichnung
 const draw=(x,w,h,bump)=>{ x.fillStyle=bump?'#808080':'#d2aa6e'; x.fillRect(0,0,w,h); for(let i=0;i<2600;i++){ const y=rnd()*h, a=rnd()*8, L=60+rnd()*260, x0=rnd()*w; const v=rnd();
   x.strokeStyle=bump?(v<0.5?`rgba(0,0,0,${0.25+rnd()*0.3})`:`rgba(255,255,255,${0.25+rnd()*0.3})`):(v<0.45?`rgba(120,80,40,${0.12+rnd()*0.18})`:`rgba(255,232,180,${0.15+rnd()*0.25})`); x.lineWidth=0.6+rnd()*1.4;
   x.beginPath(); x.moveTo(x0,y); for(let k=1;k<=8;k++){ const xx=x0+L*k/8; x.lineTo(xx,y+Math.sin(xx*0.035+a)*6); } x.stroke(); } };
 const mk=b=>{ const c=document.createElement('canvas'); c.width=512; c.height=256; draw(c.getContext('2d'),512,256,b); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.anisotropy=8; if(!b) t.colorSpace=T.SRGBColorSpace; return t; };
 _hair={c:mk(false),b:mk(true)}; return _hair; }
function terryTex(base,stripe){ return cv(256,256,(x,w,h)=>{ x.fillStyle=base; x.fillRect(0,0,w,h); if(stripe){ x.fillStyle=stripe; x.fillRect(0,36,w,18); x.fillRect(0,64,w,6); x.fillRect(0,186,w,6); x.fillRect(0,200,w,18); }
  for(let i=0;i<9000;i++){ const v=rnd(); x.fillStyle=v<0.5?`rgba(0,0,0,${0.05+rnd()*0.07})`:`rgba(255,255,255,${0.05+rnd()*0.1})`; x.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*2); } }); }
let bottle=null, bottleHome=new T.Vector3();
function buildCart(std){ // Rollwagen: Öl-Flasche, Radio, Handtücher, Räucherstäbchen
 const g=new T.Group(); g.position.set(CART.x,0,CART.z); G.add(g);
 const chrome=std({color:0xbfc4c9,metalness:1,roughness:0.28}), glassTop=std({color:0x1c1410,roughness:0.08,metalness:0.2});
 [0.78,0.32].forEach(y=>{ const p=new T.Mesh(new T.BoxGeometry(0.6,0.02,0.4),glassTop); p.position.y=y; g.add(p); });
 [[-0.28,-0.18],[0.28,-0.18],[-0.28,0.18],[0.28,0.18]].forEach(([x,z])=>{ const l=new T.Mesh(new T.CylinderGeometry(0.01,0.01,0.78,6),chrome); l.position.set(x,0.42,z); g.add(l); const w=new T.Mesh(new T.SphereGeometry(0.025,8,6),std({color:0x111111})); w.position.set(x,0.025,z); g.add(w); });
 // Flasche: Bernstein-Glas, Etikett „Sonnen-Gold Kokos-Öl“
 const pts=[[0,0],[0.034,0],[0.036,0.005],[0.036,0.12],[0.03,0.145],[0.013,0.165],[0.012,0.19],[0,0.19]].map(p=>new T.Vector2(p[0],p[1]));
 const lab=cv(256,128,(x,w,h)=>{ x.fillStyle='#f2d36a'; x.fillRect(0,0,w,h); x.fillStyle='#c2401e'; x.beginPath(); x.arc(200,64,40,0,7); x.fill(); x.fillStyle='#3a1a08'; x.font='700 30px "DejaVu Sans Condensed",sans-serif'; x.fillText('SONNEN-GOLD',8,48); x.font='22px sans-serif'; x.fillText('Kokos-Öl · LSF 2',10,84); x.font='16px sans-serif'; x.fillText('für tiefe Bräune',10,110); });
 bottle=new T.Group(); const bg=new T.Mesh(new T.LatheGeometry(pts,20),new T.MeshPhysicalMaterial({color:0xb86a1a,roughness:0.08,metalness:0,transmission:0,transparent:true,opacity:0.88,clearcoat:1}));
 const bl=new T.Mesh(new T.CylinderGeometry(0.0365,0.0365,0.07,20,1,true),std({map:lab,roughness:0.6})); bl.position.y=0.065; bl.rotation.y=-1.2;
 const cap=new T.Mesh(new T.CylinderGeometry(0.014,0.014,0.025,12),std({color:0xf0f0f0,roughness:0.4})); cap.position.y=0.2;
 bottle.add(bg,bl,cap); bottle.position.set(-0.14,0.79,0.06); g.add(bottle); g.updateMatrixWorld(true); bottle.getWorldPosition(bottleHome);
 // Kofferradio (Kassettenradio, silber)
 { const rg=new T.Group(); rg.position.set(0.12,0.79,-0.06); rg.rotation.y=-0.25; g.add(rg);
   const fr=cv(512,256,(x,w,h)=>{ x.fillStyle='#8c8e90'; x.fillRect(0,0,w,h); x.fillStyle='#202224'; for(let r=0;r<2;r++){ const cx=r?400:112, cy=140; x.beginPath(); x.arc(cx,cy,86,0,7); x.fill(); x.fillStyle='#2e3033'; for(let i=0;i<300;i++){ const a=rnd()*7, d=Math.sqrt(rnd())*80; x.fillRect(cx+Math.cos(a)*d,cy+Math.sin(a)*d,3,3); } x.fillStyle='#202224'; }
    x.fillStyle='#161616'; x.fillRect(200,70,112,90); x.fillStyle='#3a3020'; x.fillRect(206,76,100,44); x.fillStyle='#e0a040'; x.font='12px monospace'; x.fillText('UKW 88  92  96 100 104',208,100); x.fillStyle='#e03020'; x.fillRect(262,82,2,30);
    x.fillStyle='#ccc'; x.font='700 18px sans-serif'; x.fillText('STEREO 84',208,190); for(let i=0;i<6;i++){ x.fillStyle='#333'; x.fillRect(204+i*18,206,14,24); } });
   const body=new T.Mesh(new T.BoxGeometry(0.36,0.17,0.09),[std({color:0x8c8e90,metalness:0.6,roughness:0.4}),std({color:0x8c8e90,metalness:0.6,roughness:0.4}),std({color:0x8c8e90,metalness:0.6,roughness:0.4}),std({color:0x8c8e90,metalness:0.6,roughness:0.4}),std({map:fr,metalness:0.3,roughness:0.5}),std({color:0x5c5e60,metalness:0.6,roughness:0.4})]); body.position.y=0.085; rg.add(body);
   const hd=new T.Mesh(new T.TorusGeometry(0.12,0.008,6,20,Math.PI),std({color:0x222222,roughness:0.5})); hd.position.y=0.17; rg.add(hd);
   const ant=new T.Mesh(new T.CylinderGeometry(0.003,0.003,0.42,4),chrome); ant.position.set(0.15,0.36,0); ant.rotation.z=-0.35; rg.add(ant); window.__oaseRadio=rg; }
 // gefaltete Handtücher unten
 const tw=std({map:terryTex('#f0e8dc','#4a9a9a'),roughness:1}); for(let i=0;i<3;i++){ const b=new T.Mesh(new T.BoxGeometry(0.34,0.05,0.26),tw); b.position.set(-0.08,0.355+i*0.05,0); b.rotation.y=(rnd()-0.5)*0.15; g.add(b); }
 // Räucherstäbchen in Halter (Glimmpunkt + Rauchfaden)
 const inc=new T.Mesh(new T.CylinderGeometry(0.0012,0.0012,0.2,4),std({color:0x3a2418})); inc.position.set(-0.24,0.88,-0.12); inc.rotation.z=0.2; g.add(inc);
 const ember=new T.Mesh(new T.SphereGeometry(0.003,6,4),new T.MeshBasicMaterial({color:0xff5a20,toneMapped:false})); ember.position.set(-0.26,0.975,-0.12); g.add(ember);
 const smT=cv(64,256,(x,w,h)=>{ for(let i=0;i<40;i++){ const y=h-i*6, xx=32+Math.sin(i*0.4)*i*0.5; const gr=x.createRadialGradient(xx,y,0,xx,y,4+i*0.35); gr.addColorStop(0,`rgba(220,210,200,${0.22*(1-i/40)})`); gr.addColorStop(1,'rgba(220,210,200,0)'); x.fillStyle=gr; x.fillRect(0,0,w,h); } });
 const smoke=new T.Mesh(new T.PlaneGeometry(0.12,0.48),new T.MeshBasicMaterial({map:smT,transparent:true,depthWrite:false,opacity:0.55,side:T.DoubleSide})); smoke.position.set(-0.26,1.22,-0.12); g.add(smoke); window.__oaseSmoke=smoke; }
function buildDeco(std){
 // Palme im Kübel (Blattkarten) – Ecke hinten links
 const leafT=cv(256,128,(x,w,h)=>{ x.strokeStyle='#2a3a1a'; x.lineWidth=3; x.beginPath(); x.moveTo(4,64); x.quadraticCurveTo(128,40,252,70); x.stroke(); for(let i=0;i<34;i++){ const t=i/34, px=4+t*248, py=64-Math.sin(t*3)*20+t*14; const L=10+Math.sin(t*3.1)*46; x.strokeStyle=`rgb(${40+rnd()*30|0},${70+rnd()*40|0},${25+rnd()*20|0})`; x.lineWidth=4; [-1,1].forEach(s=>{ x.beginPath(); x.moveTo(px,py); x.lineTo(px+12,py+s*L); x.stroke(); }); } });
 const lm=std({map:leafT,alphaTest:0.4,side:T.DoubleSide,roughness:0.8,color:0x8a9a70}); const px=RW.x0+0.4, pz=RW.z0+0.4;
 const pot=new T.Mesh(new T.CylinderGeometry(0.22,0.17,0.42,16),std({color:0xe8e0d0,roughness:0.6})); pot.position.set(px,0.21,pz); G.add(pot);
 const trk=new T.Mesh(new T.CylinderGeometry(0.03,0.045,1.25,7),std({color:0x5a4228,roughness:0.9})); trk.position.set(px,1.0,pz); G.add(trk);
 for(let i=0;i<9;i++){ const a=i/9*Math.PI*2+rnd()*0.4; const l=new T.Mesh(new T.PlaneGeometry(0.9,0.42),lm); l.position.set(px+Math.cos(a)*0.38,1.55+rnd()*0.1,pz+Math.sin(a)*0.38); l.rotation.set(-0.5+rnd()*0.2,-a,0.5,'YXZ'); G.add(l); }
 // Hocker mit Wäschekorb (rechts vorn), Spiegel mit Glühbirnen-Rahmen aus (rechts), Kleiderhaken mit Bademantel
 const st=new T.Mesh(new T.CylinderGeometry(0.17,0.17,0.45,16),std({color:0xb8862a,roughness:0.5,metalness:0.2})); st.position.set(1.65,0.225,0.95); G.add(st);
 const mir=cv(256,384,(x,w,h)=>{ const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,'#6a5a58'); g.addColorStop(0.5,'#3a3034'); g.addColorStop(1,'#5a4a48'); x.fillStyle=g; x.fillRect(0,0,w,h); x.fillStyle='rgba(255,255,255,0.06)'; x.beginPath(); x.moveTo(40,0); x.lineTo(90,0); x.lineTo(10,h); x.lineTo(-40,h); x.fill(); });
 const mm=new T.Mesh(new T.PlaneGeometry(0.5,0.75),std({map:mir,metalness:0.3,roughness:0.15})); { const fr=new T.Mesh(new T.BoxGeometry(0.03,0.82,0.58),std({color:0xb8862a,metalness:0.8,roughness:0.35})); fr.position.set(RW.x1-0.012,1.35,0.6); G.add(fr); } mm.position.set(RW.x1-0.02,1.35,0.6); mm.rotation.y=-Math.PI/2; G.add(mm);
 { const bm=std({color:0xf0e8d8,emissive:0x302418,roughness:0.3}); [-0.3,0.3].forEach(dz=>{ for(let j=0;j<4;j++){ const b=new T.Mesh(new T.SphereGeometry(0.022,10,8),bm); b.position.set(RW.x1-0.03,1.02+j*0.22,0.6+dz); G.add(b); } }); }
 const hook=new T.Mesh(new T.CylinderGeometry(0.006,0.006,0.08,6),std({color:0xc0a060,metalness:1,roughness:0.3})); hook.rotation.x=Math.PI/2; hook.position.set(-1.4,1.75,RW.z1-0.04); G.add(hook);
 // Wandposter (Sonnen-Parodie) neben der Tapete
 const pt=cv(384,512,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#ff8a2a'); g.addColorStop(0.55,'#d8306a'); g.addColorStop(1,'#3a1a5a'); x.fillStyle=g; x.fillRect(0,0,w,h); x.fillStyle='#ffe08a'; x.beginPath(); x.arc(w/2,h*0.45,90,0,7); x.fill(); x.fillStyle='#1a0a20'; for(let i=0;i<8;i++) x.fillRect(0,h*0.45+i*14,w,5);
  x.fillStyle='#fff'; x.font='700 46px "DejaVu Sans Condensed",sans-serif'; x.textAlign='center'; x.fillText('BRAUN',w/2,70); x.fillText('IST SCHÖN',w/2,118); x.font='italic 24px serif'; x.fillText('Sonnen-Oase · Ebene 1',w/2,h-36); });
 const po=new T.Mesh(new T.PlaneGeometry(0.42,0.56),std({map:pt,roughness:0.7})); po.position.set(0.75,1.45,RW.z0+0.012); po.rotation.z=-0.02; G.add(po);
 // Draußen hinter dem Vorhang: dunkle Mall mit Neon (Foto, gedimmt)
 const mb=new T.Mesh(new T.PlaneGeometry(3.4,2.2),new T.MeshBasicMaterial({map:tex('../assets/era1984mall/mall_backdrop.jpg',1),color:0x4a3a52,fog:false})); mb.position.set(0.9,1.2,RW.z1+1.2); mb.rotation.y=Math.PI; G.add(mb);
 const fl2=new T.PlaneGeometry(1.0,1.2); fl2.rotateX(-Math.PI/2); const om=new T.Mesh(fl2,std({color:0x2a2028,roughness:0.3,metalness:0.4})); om.position.set(0.9,0,RW.z1+0.6); G.add(om);
 [[0.4],[1.4]].forEach(([x])=>{ const j=new T.Mesh(new T.BoxGeometry(0.06,2.1,0.12),std({color:0x3a2416,roughness:0.6})); j.position.set(x,1.05,RW.z1); G.add(j); }); }
let beads=null, beadBase=[];
function buildCurtain(){ // Perlenvorhang (Holz/Bernstein), 1 Draw (Instanzen), schwingt, wenn man durchgeht
 const N=24, P=34, g=new T.SphereGeometry(0.011,6,4); const m=new T.MeshStandardMaterial({roughness:0.35,metalness:0.1});
 beads=new T.InstancedMesh(g,m,N*P); const c=new T.Color(), M=new T.Matrix4();
 for(let i=0;i<N;i++) for(let j=0;j<P;j++){ const k=i*P+j; const x=0.42+i*(0.96/(N-1)), y=2.08-j*0.058; beadBase.push([x,y,RW.z1-0.02,i]); M.makeTranslation(x,y,RW.z1-0.02); beads.setMatrixAt(k,M); c.set([0x7a4a24,0xc07a2a,0x3a2010,0xd8a040][(i+j)%4]); beads.setColorAt(k,c); }
 beads.instanceMatrix.setUsage(T.DynamicDrawUsage); G.add(beads); }
// ---------------------------------------------------------------- Figur + Öl-Shader
const MW=512, MH=192, X0=-0.98, X1=1.0, Z0=-0.37, Z1=0.37;   // Masken-Fenster (Figur lokal, Draufsicht)
const uT={value:0}, uPress={value:new T.Vector4(0,0,0.055,0)}; let pressGoal=0, pressAt=0, pressV=0;
const uOff={value:Array.from({length:10},()=>new T.Vector3())}, uSkin={value:new T.Color(0.62,0.40,0.30)}; const uJig={value:new T.Vector4(0,0,0,0)}, jig={b:0,bv:0,bz:0,bzv:0,s:0,sv:0};   // passives Nachwippen: Brust (y,z) + weiches Gewebe (Bauch/Schenkel), gedämpfte Federn
let mask=null, maskTex=null, fig={}, figRoot=null, pose='lie', oilU={value:null}, oilAmt={value:0}, glint={value:0};
const GX=128, GZ=48; let target=null, got=null, nTarget=1;
function makeMask(){ mask=document.createElement('canvas'); mask.width=MW; mask.height=MH; const x=mask.getContext('2d'); x.fillStyle='#000'; x.fillRect(0,0,MW,MH); maskTex=new T.CanvasTexture(mask); maskTex.flipY=false; maskTex.colorSpace=T.NoColorSpace; maskTex.minFilter=T.LinearFilter; maskTex.generateMipmaps=false; oilU.value=maskTex; }
let brush=null; function makeBrush(){ brush=document.createElement('canvas'); brush.width=brush.height=64; const x=brush.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,0.55)'); g.addColorStop(0.6,'rgba(255,255,255,0.28)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64);
 x.globalCompositeOperation='destination-out'; for(let i=0;i<14;i++){ x.fillStyle=`rgba(0,0,0,${0.15+rnd()*0.25})`; x.fillRect(0,4+i*4.3+rnd()*2,64,1.2); } } // Streifen = Fingerspuren
// o14: Hautdetail wie im Gesicht – kachelbare Poren-/Feinfalten-Normalmap (prozedural, RG=Normale, B=Rauheit), einmal erzeugt
let DET=null; function skinDetail(){ if(DET) return DET; const N=512, hgt=new Float32Array(N*N), rnd=(a)=>{ let x=Math.sin(a*12.9898)*43758.5453; return x-Math.floor(x); };
 for(let o=0;o<4;o++){ const f=4<<o, amp=0.5/(o+1); for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const u=x*f/N, v=y*f/N, i=Math.floor(u), j=Math.floor(v), fu=u-i, fv=v-j, sx=fu*fu*(3-2*fu), sy=fv*fv*(3-2*fv), H=(a,b)=>rnd(((a%f)+f)%f*157+(((b%f)+f)%f)*311+o*71);
   hgt[y*N+x]+=amp*((H(i,j)*(1-sx)+H(i+1,j)*sx)*(1-sy)+(H(i,j+1)*(1-sx)+H(i+1,j+1)*sx)*sy); } }
 for(let k=0;k<3600;k++){ const cx=rnd(k+0.5)*N, cy=rnd(k+7.3)*N, r=0.8+rnd(k+3.1)*1.4, d=0.9+rnd(k+9.7)*0.8;   // Poren: kleine Mulden
   for(let y=-3;y<=3;y++) for(let x=-3;x<=3;x++){ const q=(x*x+y*y)/(r*r); if(q<4){ const X=((Math.floor(cx)+x)%N+N)%N, Y=((Math.floor(cy)+y)%N+N)%N; hgt[Y*N+X]-=d*Math.exp(-q*1.6); } } }
 const c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'), im=x.createImageData(N,N), at=(X,Y)=>hgt[((Y+N)%N)*N+((X+N)%N)];
 for(let y=0;y<N;y++) for(let X=0;X<N;X++){ const dx=(at(X+1,y)-at(X-1,y))*1.6, dy=(at(X,y+1)-at(X,y-1))*1.6, l=Math.hypot(dx,dy,1), i=(y*N+X)*4;
   im.data[i]=(0.5-0.5*dx/l)*255; im.data[i+1]=(0.5-0.5*dy/l)*255; im.data[i+2]=Math.max(0,Math.min(255,128+at(X,y)*90)); im.data[i+3]=255; }
 x.putImageData(im,0,0); DET=new T.CanvasTexture(c); DET.wrapS=DET.wrapT=T.RepeatWrapping; DET.generateMipmaps=true; DET.minFilter=T.LinearMipmapLinearFilter; DET.anisotropy=4; DET.colorSpace=T.NoColorSpace; return DET; }
// o14: dichteres Körpernetz – 1× Unterteilung (jedes Dreieck → 4) mit Phong-Tessellation (runde Silhouette statt Kanten). Deterministisch über Kanten-Indexpaare → Liege- und Sitzpose (gleiche Topologie) bleiben Vertex-für-Vertex gepaart (snapUp)
function subdiv(g){ if(!g.index||g.userData.sub) return g; const ix=g.index.array, P=g.attributes.position, Nn=g.attributes.normal; if(!Nn||ix.length>400000) return g;
 const nv=P.count, map=new Map(), extra=[]; const mid=(a,b)=>{ const k=a<b?a*nv+b:b*nv+a; let m=map.get(k); if(m===undefined){ m=nv+extra.length/2; extra.push(a<b?a:b,a<b?b:a); map.set(k,m); } return m; };
 const ni=new (nv+ix.length>65535?Uint32Array:Uint16Array)(ix.length*4); let w=0;
 for(let t=0;t<ix.length;t+=3){ const a=ix[t],b=ix[t+1],c=ix[t+2], ab=mid(a,b), bc=mid(b,c), ca=mid(c,a); ni.set([a,ab,ca, ab,b,bc, ca,bc,c, ab,bc,ca],w); w+=12; }
 const ng=new T.BufferGeometry(), tot=nv+extra.length/2;
 for(const name in g.attributes){ const A=g.attributes[name], is=A.itemSize, src=A.array, out=new (src.constructor)(tot*is); out.set(src.subarray(0,nv*is));
  for(let e=0;e<extra.length;e+=2){ const a=extra[e], b=extra[e+1], o=(nv+e/2)*is; for(let k=0;k<is;k++) out[o+k]=(src[a*is+k]+src[b*is+k])*0.5; }
  ng.setAttribute(name,new T.BufferAttribute(out,is,A.normalized)); }
 const p=ng.attributes.position.array, n=ng.attributes.normal.array;
 for(let e=0;e<extra.length;e+=2){ const a=extra[e]*3, b=extra[e+1]*3, o=(nv+e/2)*3; let qx=0,qy=0,qz=0;
  for(const v of [a,b]){ const d=(p[o]-p[v])*n[v]+(p[o+1]-p[v+1])*n[v+1]+(p[o+2]-p[v+2])*n[v+2]; qx+=p[o]-d*n[v]; qy+=p[o+1]-d*n[v+1]; qz+=p[o+2]-d*n[v+2]; }
  const al=0.7; p[o]+=al*(qx/2-p[o]); p[o+1]+=al*(qy/2-p[o+1]); p[o+2]+=al*(qz/2-p[o+2]);
  const l=Math.hypot(n[o],n[o+1],n[o+2])||1; n[o]/=l; n[o+1]/=l; n[o+2]/=l; }
 ng.setIndex(new T.BufferAttribute(ni,1)); ng.userData.sub=1; ng.computeBoundingBox(); ng.computeBoundingSphere(); return ng; }
function oilMat(src,skin){ // Haut-Material: Physical + Klarlack, Maske über Objekt-Draufsicht. skin.tx = Figur mit eigener Hauttextur (COLOR_0 = AO + ölbar), skin.soft = Attribut _SOFT (Weichheit, Brust-Gewicht)
 const m=new T.MeshPhysicalMaterial({vertexColors:!!skin.vc,color:skin.o9?0xffffff:skin.h8?0xf0dccb:skin.tx?0xc9a48c:skin.vc?0xe2b89c:(src&&src.color?src.color.getHex():0xd8a088),map:src&&src.map||null,normalMap:src&&src.normalMap||null,roughness:0.58,metalness:0,clearcoat:1,clearcoatRoughness:0.07,sheen:skin.o9?0.35:skin.tx?0.12:0.25,sheenRoughness:skin.o9?0.85:0.6,sheenColor:new T.Color(skin.o9?0xd0603a:skin.tx?0xc07850:0xffb090)});
 if(skin.o9){ m.roughness=0.62; m.sheen=0.45; m.sheenRoughness=0.8; if(m.normalMap) m.normalScale=new T.Vector2(0.18,0.18); }   // o9: Foto-Haut, Poren-Normalmap, warmer Streurand (Sheen) statt Plastik-Glanz
 m.onBeforeCompile=sh=>{ sh.uniforms.oilMap=oilU; sh.uniforms.oilGlint=glint;
  sh.uniforms.uT=uT; sh.uniforms.uPress=uPress; sh.uniforms.uJig=uJig; if(skin.o9){ sh.uniforms.uDet={value:skinDetail()}; sh.uniforms.uOff=uOff; sh.uniforms.uSkin=uSkin; }
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOP; uniform float uT; uniform vec4 uPress; uniform vec4 uJig;'+(skin.soft?'\nattribute vec2 _soft;':'')+(skin.o9?'\nattribute vec4 _nip; varying vec4 vNip; attribute vec2 _reg; uniform vec3 uOff[10];':'')).replace('#include <begin_vertex>',`#include <begin_vertex>
  vOP=position;${skin.o9?`
  vNip=_nip; { float r=length(_nip.xy), zg=exp(-_nip.z*_nip.z/0.0004); transformed+=objectNormal*zg*(0.0034*exp(-r*r/(0.0045*0.0045))+0.0012*exp(-r*r/(0.015*0.015))); }
  { int ri=int(_reg.x+0.5); if(ri>0&&ri<10) transformed+=uOff[ri]*_reg.y; }   // o16: Feder-Regionen (Brust, Bauch, Innenschenkel weich; Arme/Unterschenkel schiebbar)   // o15: Brustwarze + leicht gewölbter Warzenhof (Geometrie)`:''}
  { float wb=smoothstep(-0.66,-0.52,position.x)*(1.0-smoothstep(-0.18,-0.04,position.x)), wbb=smoothstep(-0.30,-0.16,position.x)*(1.0-smoothstep(0.02,0.12,position.x)); transformed+=objectNormal*(0.0030*wb*(0.5+0.5*sin(uT*1.1))+0.0020*wbb*max(objectNormal.y,0.0)*(0.5+0.5*sin(uT*1.1-0.7)));   // o15: langsamer (≈10/min), Bauch hebt sich kurz nach der Brust   // Atmen (Brustkorb hebt/senkt sich, ~13/min)
    float dp=distance(position.xz,uPress.xy); ${skin.soft?`
    float sf=_soft.x, r=max(uPress.z*(0.8+0.5*sf),1e-3), g=exp(-dp*dp/(r*r)), rq=(dp-1.35*r)/(0.45*r), rim=exp(-rq*rq);   // o12: kein pow() mit negativer Basis (auf Quest/Adreno NaN → Haut an Brust/Bauch verschwand)
    transformed-=objectNormal*uPress.w*max(objectNormal.y,0.0)*(g-0.22*rim)*(0.35+1.1*sf);   // weiche Delle + Gewebe-Wulst am Rand, federt zurück
    transformed.y+=_soft.y*uJig.x*(0.6+0.4*smoothstep(0.0,0.05,position.y-0.12)) + sf*(1.0-_soft.y)*uJig.z*0.35;   // Nachwippen (Brust / Bauch, Schenkel)
    transformed.z+=_soft.y*uJig.y*sign(position.z);`:`transformed-=objectNormal*uPress.w*max(objectNormal.y,0.0)*(1.0-smoothstep(0.0,uPress.z,dp));`} }   // Haut gibt unter der Hand nach`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 vOP; uniform sampler2D oilMap; uniform float oilGlint; float oilK=0.0;
float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }`+(skin.o9?`
uniform sampler2D uDet; varying vec4 vNip; uniform vec3 uSkin;
vec3 bumpN(vec3 n,float h){ vec3 p=-vViewPosition, dx=dFdx(p), dy=dFdy(p), r1=cross(dy,n), r2=cross(n,dx); float det=dot(dx,r1); vec3 g=sign(det)*(dFdx(h)*r1+dFdy(h)*r2); return normalize(abs(det)*n-g); }
float nipH(vec4 q){ float r=length(q.xy), a=atan(q.y,q.x), zg=exp(-q.z*q.z/0.0004); float nip=0.0016*(1.0-smoothstep(0.0026,0.0060,r));
 float c=floor((a+3.14159)/6.28318*12.0), ca=(c+0.5)/12.0*6.28318-3.14159+(h21(vec2(c,3.0))-0.5)*0.4, cr=0.0105+0.0065*h21(vec2(c,7.0)); float gd=length(q.xy-cr*vec2(cos(ca),sin(ca))); float gl=0.0005*exp(-gd*gd/(0.0012*0.0012));
 float are=0.0006*(1.0-smoothstep(0.012,0.021,r)), wr=0.0; return (nip+gl+are+wr)*zg; }
float vn3(vec3 q){ vec3 i=floor(q), f=fract(q); f=f*f*(3.0-2.0*f); float a=mix(mix(h21(i.xy+i.z*17.0),h21(i.xy+vec2(1,0)+i.z*17.0),f.x),mix(h21(i.xy+vec2(0,1)+i.z*17.0),h21(i.xy+vec2(1,1)+i.z*17.0),f.x),f.y); float b=mix(mix(h21(i.xy+(i.z+1.0)*17.0),h21(i.xy+vec2(1,0)+(i.z+1.0)*17.0),f.x),mix(h21(i.xy+vec2(0,1)+(i.z+1.0)*17.0),h21(i.xy+vec2(1,1)+(i.z+1.0)*17.0),f.x),f.y); return mix(a,b,f.z); }`:''))
  .replace('#include <color_fragment>',`#include <color_fragment>
  { vec2 ou=vec2((vOP.x-(${X0.toFixed(3)}))/${(X1-X0).toFixed(3)}, (vOP.z-(${Z0.toFixed(3)}))/${(Z1-Z0).toFixed(3)});
    float o=texture2D(oilMap,ou).r; ${skin.vc?'o*=vColor.a; diffuseColor.a=1.0;':''} oilK=smoothstep(0.08,0.75,o);
    diffuseColor.rgb=mix(diffuseColor.rgb,pow(diffuseColor.rgb,vec3(1.18))*1.05,oilK); }`+(skin.o9?`
  { float m1=vn3(vOP*22.0)-0.5, m2=vn3(vOP*61.0+3.1)-0.5; diffuseColor.rgb*=1.0+0.07*m1+0.035*m2; diffuseColor.r*=1.0+0.03*m1; }
  { float r=length(vNip.xy), zg=exp(-vNip.z*vNip.z/0.0004), ed=0.0025*(vn3(vec3(vNip.xy*500.0,2.0))-0.5); float ma=(1.0-smoothstep(0.015,0.022,r+ed))*zg, mn=(1.0-smoothstep(0.0032,0.0062,r))*zg;
    vec3 aC=uSkin*vec3(0.93,0.80,0.76), nC=uSkin*vec3(0.90,0.74,0.70); diffuseColor.rgb=mix(diffuseColor.rgb,aC,ma*0.62); diffuseColor.rgb=mix(diffuseColor.rgb,nC,mn*0.75);   // o15: Warzenhof weich in die Haut auslaufend (kein Farbkreis), Warze etwas dunkler/röter
    float rd=vNip.w*(0.75+0.5*vn3(vOP*90.0)); diffuseColor.rgb*=mix(vec3(1.0),vec3(1.05,0.89,0.87),clamp(rd,0.0,1.0)*0.7);   // Knie, Ellbogen, Hände, Füße leicht gerötet
    ${skin.vc?'diffuseColor.rgb*=mix(vec3(1.0),vec3(1.03,0.93,0.92),(1.0-vColor.r)*0.7);':''}   // Falten/Gelenke: etwas durchbluteter
    float cao=smoothstep(-0.004,0.045,vOP.y); diffuseColor.rgb*=mix(0.5,1.0,cao); }   // Kontakt-AO: wo sie auf der Liege aufliegt   // o14: leichte Farbunruhe (Äderchen/Rötung)`:''))  // nasse Haut: satter, etwas dunkler
  .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>'+(skin.o9?'\nroughnessFactor*=(0.86+0.32*texture2D(uDet,vNormalMapUv*48.0).b)*(0.92+0.16*texture2D(uDet,vNormalMapUv*290.0+0.3).b);':'')+'\nroughnessFactor=mix(roughnessFactor,'+(skin.o9?'0.34':'0.16')+',oilK);')
  .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>'+(skin.o9?`
  #ifdef USE_NORMALMAP_TANGENTSPACE
  { vec2 du=vNormalMapUv*48.0; vec3 d1=texture2D(uDet,du).xyz*2.0-1.0, d2=texture2D(uDet,du*2.7+0.37).xyz*2.0-1.0; float ds=0.32*(1.0-0.7*oilK);
    vec3 d3=texture2D(uDet,du*6.1+0.71).xyz*2.0-1.0; normal=normalize(normal+(tbn[0]*(d1.x+0.5*d2.x+0.35*d3.x)+tbn[1]*(d1.y+0.5*d2.y+0.35*d3.y))*ds); }   // o14: Poren + Feinfalten (Detail-Normalmap, unter Öl glatter)
  #endif
  normal=bumpN(normal,nipH(vNip));   // o15: Warze, Montgomery-Drüsen, feine Fältchen (Bump)`:''))
  .replace('#include <clearcoat_normal_fragment_begin>','#include <clearcoat_normal_fragment_begin>')
  .replace('#include <opaque_fragment>',(skin.o9?`{ float fr=1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0); outgoingLight+=diffuseColor.rgb*vec3(1.0,0.42,0.26)*(0.05+0.10*fr*fr)*(0.6+0.4*clamp(length(totalDiffuse)*3.0,0.0,1.0)); }   // o14: warmes Durchscheinen (Subsurface-Ersatz): rötlicher Streurand, Haut wirkt durchblutet statt Plastik
`:'')+'#include <opaque_fragment>')
  .replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
  #ifdef USE_CLEARCOAT
   material.clearcoat=oilK*${skin.o9?'0.6':'0.9'}; material.clearcoatRoughness=mix(${skin.o9?'0.32,0.15':'0.12,0.05'},oilK)${skin.o9?'*(0.75+0.5*texture2D(uDet,vNormalMapUv*21.0).b)':''};   // o15: Ölfilm glänzt in Schlieren statt Lack
  #endif
`);
 }; m.customProgramCacheKey=()=>'oase-oil-'+(skin.vc?1:0)+(skin.tx?'t':'')+(skin.soft?'s':'')+(skin.o9?'9':''); return m; }
function loadFig(which,cb){ const url=(ADULT()&&C.fig[which+'Adult'])?C.fig[which+'Adult']:C.fig[which]; // Ab-18-Datei nur bei ZS_ADULT === true
 new T.GLTFLoader().load(url,gl=>{ const r=gl.scene, parts={body:[],hair:[],towel:[],robe:[],strap:[],chest:[],top:[],glasses:[],deco:[]}; let named=false;
  r.traverse(o=>{ if(!o.isMesh) return; const n=(o.name||'').toLowerCase().replace(/_\d+$/,''); const k=Object.keys(parts).find(k=>n===k||n.startsWith(k)); if(k){ named=true; parts[k].push(o); } else parts.body.push(o); });
  if(parts.body.some(o=>/^skin_h[89]/.test((o.material&&o.material.name)||''))) { parts.towel.forEach(o=>{ if(o.geometry.attributes.uv) o.userData.keepUV=true; }); parts.robe.forEach(o=>{ if(o.geometry.attributes.uv) o.userData.keepUV=true; o.userData.k8=true; }); }   // o8: Handtuch/Bademantel-Decke mit eigener Bogenlängen-UV
  parts.body.forEach(o=>{ if(window.__oaseSubdiv!==false) o.geometry=subdiv(o.geometry);   // o14: dichteres Netz (Liege + Sitzpose identisch)
  const g=o.geometry, vc=!!g.attributes.color, tx=!!(o.material&&o.material.map&&g.attributes.uv); o.userData.keepUV=tx; const h8=!!(o.material&&/^skin_h[89]/.test(o.material.name||'')), o9=!!(o.material&&/^skin_h9/.test(o.material.name||'')); if(o9){ const a=new Float32Array(g.attributes.position.count*4); for(let i=0;i<a.length;i+=4){ a[i]=a[i+1]=a[i+2]=1; } g.setAttribute('_nip',new T.BufferAttribute(a,4)); g.setAttribute('_reg',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2)); o.userData.o9=true; } o.material=oilMat(o.material,{vc,tx,h8,o9,soft:!!g.attributes._soft}); if(g.attributes._soft) window.__oaseSoft=true; });
  const terry=(b,s)=>new T.MeshStandardMaterial({map:terryTex(b,s),vertexColors:true,roughness:1});
  const hT=hairTex(); parts.hair.forEach(o=>{ const hm=o.material&&o.material.map; if(hm&&o.geometry.attributes.uv){ o.userData.keepUV=true; o.material=new T.MeshPhysicalMaterial({vertexColors:!!o.geometry.attributes.color,map:hm,alphaTest:0.36,alphaToCoverage:true,side:T.DoubleSide,roughness:0.56,sheen:0.55,sheenColor:new T.Color(0xf0c880),sheenRoughness:0.35}); }   // o8: Haar-Karten mit eigener Textur (MakeHuman long01, blondiert)
   else o.material=new T.MeshPhysicalMaterial({vertexColors:true,map:hT.c,bumpMap:hT.b,bumpScale:0.6,roughness:0.55,sheen:0.6,sheenColor:new T.Color(0xe0b070),sheenRoughness:0.4}); });
  parts.deco.forEach(o=>{ o.userData.keepUV=true; const m=o.material; if(m){ m.transparent=false; m.alphaTest=0.4; m.depthWrite=true; m.side=T.DoubleSide; } o.raycast=()=>{}; });   // o8: Augen, Brauen, Wimpern – eigenes Material, nicht ölbar
  [...parts.towel,...parts.chest].forEach(o=>{ o.material=terry('#f4ece0','#d98aa0'); if(ADULT()){ const t=terryTex('#e2d6c4','#c4868e'); o.material=new T.MeshStandardMaterial({map:t,bumpMap:t,bumpScale:0.8,vertexColors:true,roughness:1,color:0xe8dccc}); } });   // ab 18: gedämpfteres, weiches Frottee (nicht leuchtend weiß) parts.robe.forEach(o=>o.material=terry('#f2b8c8',null));
  parts.robe.forEach(o=>{ if(o.userData.k8) o.material=terry('#f2b8c8','#e7a0b4'); });   // o8 jugendfrei: rosa Frottee-Decke über dem Badeanzug
  parts.glasses.forEach(o=>o.material=new T.MeshPhysicalMaterial({color:0x22150e,roughness:0.12,metalness:0.1,clearcoat:1,clearcoatRoughness:0.06}));   // 80er-Sonnenbrille (o7)
  [...parts.strap,...parts.top].forEach(o=>o.material=new T.MeshStandardMaterial({vertexColors:true,color:0xffffff,roughness:0.45}));
  r.traverse(o=>{ if(o.isMesh&&!o.userData.keepUV){ const p=o.geometry.attributes.position, uv=new Float32Array(p.count*2); for(let i=0;i<p.count;i++){ uv[2*i]=(p.getX(i)-X0)/(X1-X0)*3; uv[2*i+1]=(p.getZ(i)-Z0)/(Z1-Z0)*1.2; } o.geometry.setAttribute('uv',new T.BufferAttribute(uv,2)); } });
  r.position.set(FIG.x,FIG.y,FIG.z); cb({root:r,parts,named}); },undefined,e=>{ console.warn('[oase] Figur fehlt',url); cb(null); }); }
function settle(f){ // o13: liegt auf (statt zu schweben) – pro Körper-Abschnitt (entlang x) so weit absenken, dass die Unterseite die Liege berührt, 2 mm eingesunken
 const b=f.parts.body[0]; if(!b) return; const P=b.geometry.attributes.position, X0s=-0.72, DX=0.04, N=Math.ceil((0.84-X0s)/DX), mn=new Array(N).fill(1);
 for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i); const k=Math.min(N-1,Math.max(0,Math.floor((x-X0s)/DX))); if(y<mn[k]) mn[k]=y; }
 for(let k=0;k<N;k++) if(mn[k]>0.5) mn[k]=k?mn[k-1]:0;
 const KF=Math.floor((0.68-X0s)/DX); for(let k=KF+1;k<N;k++) mn[k]=mn[KF];   // Füße: wie die Waden (Zehen zeigen nach oben)
 const env=mn.map((v,k)=>{ let m=1; for(let q=Math.max(0,k-3);q<=Math.min(N-1,k+3);q++) m=Math.min(m,mn[q]); return m; });   // Auflagepunkte (Schulterblätter, Po, Waden) – Hohlkreuz/Kniekehle bleiben frei
 const dy=env.map((v,k)=>{ const a=env[Math.max(0,k-1)], c=env[Math.min(N-1,k+1)]; return -Math.min(0.035,Math.max(-0.003,(a+v+c)/3+0.002)); });
 const f_=x=>{ const u=(x-X0s)/DX-0.5; if(u<=0) return dy[0]; if(u>=N-1) return dy[N-1]; const k=Math.floor(u), t=u-k; return dy[k]*(1-t)+dy[k+1]*t; };
 f.root.traverse(o=>{ if(!o.isMesh) return; const A=o.geometry.attributes.position; for(let i=0;i<A.count;i++) A.setY(i,A.getY(i)+f_(A.getX(i))); A.needsUpdate=true; o.geometry.computeBoundingBox(); o.geometry.computeBoundingSphere(); });
 window.__oaseSettle=dy; }
function applyMode(f){ if(!f) return; const ad=ADULT(), P=f.parts;
 // jugendfrei: Bademantel + Bikini-Träger/-Oberteil IMMER sichtbar, Handtuch-only-Variante nie. Ab 18: Handtuch über der Hüfte, Rücken frei.
 P.robe.forEach(o=>o.visible=!ad); P.strap.forEach(o=>o.visible=!ad); P.top.forEach(o=>o.visible=!ad);
 P.towel.forEach(o=>o.visible=ad); P.chest.forEach(o=>o.visible=true);
 if(!ad&&!f.named){ /* fremde Figur ohne Kleidung-Knoten: im jugendfreien Modus nicht zeigen */ f.root.visible=false; } }
function buildTarget(f){ // ölbare Zellen = was man von oben wirklich sieht (Haut, nicht unter Haar/Handtuch/Bademantel): Draufsicht in kleines Ziel rendern (GPU, sofort)
 target=new Uint8Array(GX*GZ); got=new Float32Array(GX*GZ); nTarget=0;
 const rt=new T.WebGLRenderTarget(GX,GZ), oc=new T.OrthographicCamera(X0,X1,-Z0,-Z1,0.01,5); oc.up.set(0,0,-1); oc.position.set(0,3,0); oc.lookAt(0,0,0);
 const idM=new T.ShaderMaterial({vertexShader:'attribute vec4 color; varying float vA; varying float vN; void main(){ vA=color.a; vN=normalize(mat3(modelMatrix)*normal).y; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0); }',fragmentShader:'varying float vA; varying float vN; void main(){ gl_FragColor=vec4(vA,vN*0.5+0.5,1.0,1.0); }'});
 const blk=new T.MeshBasicMaterial({color:0x000000}); const keep=[]; const sc2=new T.Scene(); const pos=f.root.position.clone(), par=f.root.parent;
 f.root.traverse(o=>{ if(o.isMesh){ keep.push([o,o.material]); const body=f.parts.body.indexOf(o)>=0; if(body&&!o.geometry.attributes.color){ const n=o.geometry.attributes.position.count, c=new Float32Array(n*4).fill(1); o.geometry.setAttribute('color',new T.BufferAttribute(c,4)); } o.material=body?idM:blk; } });
 sc2.add(f.root); f.root.position.set(0,0,0); sc2.updateMatrixWorld(true);
 const xe=R.xr.enabled; R.xr.enabled=false; const prev=R.getRenderTarget(); R.setRenderTarget(rt); R.setClearColor(0x000000,0); R.clear(); R.render(sc2,oc); const px=new Uint8Array(GX*GZ*4); R.readRenderTargetPixels(rt,0,0,GX,GZ,px); R.setRenderTarget(prev); R.xr.enabled=xe;
 keep.forEach(([o,m])=>o.material=m); f.root.position.copy(pos); if(par) par.add(f.root); rt.dispose();
 for(let r=0;r<GZ;r++) for(let c=0;c<GX;c++){ const k=(r*GX+c)*4; if(px[k+2]>128&&px[k]>150&&px[k+1]>150){ const z=-(-Z1+(r+0.5)/GZ*(Z1-Z0)); const gz=Math.floor((z-Z0)/(Z1-Z0)*GZ); if(gz>=0&&gz<GZ){ target[gz*GX+c]=1; nTarget++; } } }
 for(let r=0;r<GZ;r++) for(let c=0;c<GX;c++){ const lx=X0+(c+0.5)/GX*(X1-X0), lz=Z0+(r+0.5)/GZ*(Z1-Z0); if(target[r*GX+c]&&inChest(lx,lz)){ target[r*GX+c]=0; nTarget--; } }
 nTarget=Math.max(1,nTarget); window.__oaseTarget=nTarget; window.__oaseTargetArr=target; }
window.__oaseGot=()=>got; function coverage(){ let k=0; for(let i=0;i<target.length;i++) if(target[i]&&got[i]>=0.6) k++; return k/nTarget; }
let lastPaint=null;
function paintAt(lx,lz,str){ const u=(lx-X0)/(X1-X0), v=(lz-Z0)/(Z1-Z0); if(u<0||u>1||v<0||v>1) return 0;
 const x=mask.getContext('2d'), px=u*MW, pz=v*MH, R=24; x.globalCompositeOperation='lighter'; x.globalAlpha=Math.min(1,str); x.save(); x.translate(px,pz); x.rotate(Math.atan2(lastPaint?pz-lastPaint[1]:0,lastPaint?px-lastPaint[0]:1)); x.drawImage(brush,-R,-R,2*R,2*R); x.restore(); x.globalAlpha=1;
 maskTex.needsUpdate=true; const gx=u*GX, gz=v*GZ, gr=R/MW*GX*0.8; for(let j=Math.floor(gz-gr);j<=gz+gr;j++) for(let i=Math.floor(gx-gr);i<=gx+gr;i++){ if(i<0||j<0||i>=GX||j>=GZ) continue; const d=Math.hypot(i+0.5-gx,(j+0.5-gz)*(GZ/(Z1-Z0))/(GX/(X1-X0))); if(d>gr) continue; got[j*GX+i]+=0.22*str*(1-d/gr*0.6); }
 lastPaint=[px,pz]; return 1; }
// ---------------------------------------------------------------- Ablauf
const st={oiled:false,phase:'idle',said:{},spoke:0,cov:0,done:false,lastNoOil:0,dist:0,greet:false};
function aud(f,vol){ const a=new Audio(C.base+f); a.volume=MUTE?0:(vol==null?0.95:vol); a.play().catch(()=>{}); return a; }
// o10 Musik: Petes eigener Song (oase_song_pete.mp3, mono 96 kbit/s) als Raum-Ton aus dem Kofferradio auf dem Wagen (PositionalAudio, nicht kopffest); Ende: leiser, beim Aufsetzen aus, nach „Danke, Kleiner.“ leise wieder
let radio=null, hum=null, musG=null, musOff=false, musV=0.5; const MUSV=0.5;
function musVol(v){ musV=v; const x=MUTE?0:v; if(musG) musG.setVolume(x); else if(radio) radio.volume=Math.min(1,x*0.6); }
function musFade(to,ms,done){ const f=musV, t0=performance.now(); const st_=()=>{ const k=Math.min(1,(performance.now()-t0)/ms); musVol(f+(to-f)*k); if(k<1) setTimeout(st_,40); else done&&done(); }; st_(); }
function startAmb(){ if(radio||musOff) return; radio=new Audio(C.base+'oase_song_pete.mp3?v=1'); radio.loop=true; radio.preload='auto';
 try{ const sc=document.querySelector('a-scene'), camO=(sc&&sc.camera)||cam; let L=window.__oaseL; if(!L){ L=window.__oaseL=new T.AudioListener(); camO.add(L); } if(L.context.state!=='running') L.context.resume().catch(()=>{});
  const pa=new T.PositionalAudio(L); pa.setMediaElementSource(radio); pa.setDistanceModel('inverse'); pa.setRefDistance(1.0); pa.setRolloffFactor(1.1); pa.setMaxDistance(12); try{ pa.panner.panningModel='HRTF'; }catch(e){}
  const rg=window.__oaseRadio; (rg||G).add(pa); if(!rg) pa.position.set(CART.x,0.9,CART.z); musG=pa; }catch(e){ musG=null; }
 musVol(MUSV); radio.play().catch(()=>{ radio=null; if(musG){ try{ musG.parent&&musG.parent.remove(musG); musG.disconnect(); }catch(e){} musG=null; } });
 // o13: Brummen leiser (≈ −14 dB am Hörplatz), als Raum-Ton an der Sonnenbank, Bässe weg (Hochpass 220 Hz) – kein „Kühlschrank“ mehr
 hum=new Audio(C.base+'sonnenbank_brumm.mp3'); hum.loop=true; let hp=false;
 try{ const L=window.__oaseL; if(L){ const pb=new T.PositionalAudio(L); pb.setMediaElementSource(hum); pb.setDistanceModel('inverse'); pb.setRefDistance(0.7); pb.setRolloffFactor(1.2); pb.setMaxDistance(10);
  const hf=L.context.createBiquadFilter(); hf.type='highpass'; hf.frequency.value=220; hf.Q.value=0.6; const ls=L.context.createBiquadFilter(); ls.type='lowshelf'; ls.frequency.value=400; ls.gain.value=-6; pb.setFilters([hf,ls]);
  pb.setVolume(MUTE?0:0.15); pb.position.set(1.0,0.45,-1.75); G.add(pb); hp=true; } }catch(e){ hp=false; }
 if(!hp) hum.volume=MUTE?0:0.035; hum.play().catch(()=>{}); }
const LINES={a0:'Na endlich, der Neue. Das Öl steht auf dem Wagen. Und nicht so rumstehen.',a1:'Mmh … nicht so schüchtern, Süßer. Das Öl beißt nicht.',a2:'Etwas tiefer. Nein – nicht SO tief. Frecher Kerl.',a3:'Wenn du so weitermachst, muss ich dir Trinkgeld geben.',
 h0:'Bist du die Aushilfe? Das Öl steht auf dem Wagen.',h1:'Ah, die Schultern. Da sitzt der ganze Einkaufsstress.',h2:'Schön gleichmäßig verteilen, sonst werd ich gestreift wie ein Zebra.',h3:'Du hast ja goldene Hände. Wie mein Friseur.',oel:'Erst das Öl, Schätzchen. Sonst quietscht’s.',slap:'Hey! Finger weg, Freundchen. Das hier ist kein Streichelzoo!',punch:'Danke, Kleiner.'};
let subEl=null, subM=null;
function say(k,who){ if(st.over||(st.done&&!st.endOk)) return null; st.endOk=false; if(k==='punch') st.over=true; const a=aud('vo_'+k+'.mp3'); st.spoke=performance.now(); const t=(who||'Kundin')+': „'+LINES[k]+'“';
 if(!subEl) subEl=document.getElementById('sub'); if(subEl){ subEl.textContent=t; subEl.style.display='block'; clearTimeout(subEl._t); subEl._t=setTimeout(()=>subEl.style.display='none',4200); }
 if(R.xr.isPresenting){ // Untertitel in der Welt (über der Liege, zum Spieler gedreht, bleibt stehen)
  if(subM){ S.remove(subM); subM=null; } const c=document.createElement('canvas'); c.width=1024; c.height=80; const x=c.getContext('2d'); x.font='500 30px sans-serif'; const w=Math.min(1010,x.measureText(t).width+40); x.fillStyle='rgba(0,0,0,0.5)'; x.fillRect(512-w/2,8,w,62); x.fillStyle='#e8d6b0'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(t,512,40);
  const m=new T.Mesh(new T.PlaneGeometry(1.1,0.086),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,toneMapped:false,fog:false})); const h=new T.Vector3(); cam.getWorldPosition(h);
  m.position.set(TB.x,1.45,TB.z); m.lookAt(h.x,1.45,h.z); S.add(m); subM=m; setTimeout(()=>{ if(subM===m){ S.remove(m); subM=null; } },4300); }
 return a; }
function takeOil(){ if(st.oiled||st.done) return; st.oiled=true; startAmb(); try{ zsaSND&&zsaSND.click(); }catch(e){}
 // Flasche schwebt über den Rücken, kippt, Öl tropft (3 Kleckse), zurück auf den Wagen
 const t0=performance.now(), from=bottleHome.clone(), to=new T.Vector3(FIG.x-0.3,FIG.y+0.42,FIG.z); const par=bottle.parent; S.attach(bottle);
 const anim=()=>{ const k=Math.min(1,(performance.now()-t0)/2600); const a=k<0.3?k/0.3:k>0.75?(1-k)/0.25:1; const e=a*a*(3-2*a);
  bottle.position.lerpVectors(from,to,e); bottle.rotation.z=e*2.3; if(k>0.35&&k<0.7&&Math.random()<0.25){ const lx=-0.42+Math.random()*0.35, lz=(Math.random()-0.5)*0.12; paintAt(lx,lz,1.0); try{ zsaSND&&zsaSND.click&&0; }catch(e){} }
  if(k<1) raf(anim); else { par.attach(bottle); bottle.position.copy(par.worldToLocal(bottleHome.clone())); bottle.rotation.set(0,0,0); } }; anim();
 drip(); }
function drip(){ const a=new (window.AudioContext||window.webkitAudioContext)(); if(MUTE) return; [0.9,1.25,1.6].forEach(d=>{ const o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.setValueAtTime(900,a.currentTime+d); o.frequency.exponentialRampToValueAtTime(260,a.currentTime+d+0.09); g.gain.setValueAtTime(0.0001,a.currentTime+d); g.gain.linearRampToValueAtTime(0.12,a.currentTime+d+0.01); g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+d+0.14); o.connect(g); g.connect(a.destination); o.start(a.currentTime+d); o.stop(a.currentTime+d+0.2); }); }
function rub(lx,lz,len){ if(st.done) return; if(!R.xr.isPresenting){ if(rub.l) regPush(new T.Vector3(lx,0,lz),new T.Vector3(lx-rub.l.x,0,lz-rub.l.z),true); rub.l={x:lx,z:lz}; setTimeout(()=>{ if(performance.now()-pressAt>150) rub.l=null; },200); }  uPress.value.x=lx; uPress.value.y=lz; pressGoal=window.__oaseSoft?0.0085:0.006; pressAt=performance.now(); jigKick(lx,lz,len); if(!st.oiled){ const n=performance.now(); if(n-st.lastNoOil>9000&&n-st.spoke>4500){ st.lastNoOil=n; say('oel'); } return; } // o12: Brust + Bauch einölbar (Ohrfeigen-Gag ab 18 bleibt)
 { const n=performance.now(); st.rubT=(st.rubT||0)+Math.min(0.25,(n-(st.lastRub||n))/1000); st.lastRub=n; } startAmb(); paintAt(lx,lz,(0.175+Math.min(0.25,len*3))*(R.xr.isPresenting?1.3:1));   /* o13: in VR +30 % (gründliches Einreiben ≈ 50 s, normal 1,5–2 min) */ st.dist+=len; }   // o14: halbe Öl-Menge pro Strich → etwa doppelt so lange einreiben bis 90 %
function jigKick(lx,lz,len){ if(!window.__oaseSoft) return; const v=Math.min(len||0.01,0.05);   // Streichen in Brustnähe/über weichem Gewebe bringt sie leicht ins Schwingen
 const db=Math.hypot(Math.max(0,Math.abs(lx+0.447)-0.08),Math.max(0,Math.abs(Math.abs(lz)-0.104)-0.09)); const nb=Math.max(0,1-db/0.12);
 jig.bv+=(Math.random()<0.5?-1:1)*v*0.9*(0.25+nb); jig.bzv+=(Math.random()-0.5)*v*0.6*(0.2+nb); jig.sv+=(Math.random()<0.5?-1:1)*v*0.7; }
function jigTick(d){ if(!window.__oaseSoft) return; const sp=(k,c,x,v,ext)=>{ v+=(-k*x-c*v+ext)*d; return [x+v*d,v]; };
 const br=-Math.cos(uT.value*1.1)*1.1*1.1*0.0011;   // Atmen schiebt mit
 [jig.b,jig.bv]=sp(150,5.5,jig.b,jig.bv,br); [jig.bz,jig.bzv]=sp(120,5.0,jig.bz,jig.bzv,0); [jig.s,jig.sv]=sp(220,9,jig.s,jig.sv,0);
 const cl=(x,m)=>Math.max(-m,Math.min(m,x)); jig.b=cl(jig.b,0.006); jig.bz=cl(jig.bz,0.004); jig.s=cl(jig.s,0.004);
 uJig.value.set(jig.b,jig.bz,jig.s,0);
 // Delle: gedämpfte Feder (leichtes Überschwingen beim Loslassen = Haut federt zurück)
 pressV+=((pressGoal-uPress.value.w)*320-pressV*20)*d; uPress.value.w=Math.max(-0.0015,uPress.value.w+pressV*d); }
function progress(){ if(st.done||!target) return; const c=coverage(); st.cov=c; oilAmt.value=c; const ad=ADULT(), p=ad?'a':'h'; const now=performance.now();
 [[0.12,1],[0.42,2]].forEach(([th,i])=>{ if(c>=th&&!st.said[i]&&now-st.spoke>4800){ st.said[i]=1; say(p+i); } });
 if((c>=0.9||(st.oiled&&(st.rubT||0)>=120))&&now-st.spoke>3600) punch(); }   // o15: Ende garantiert – nach ~120 s aktivem Einreiben auch unter 90 %
function punch(){ if(st.done) return; st.done=true; gag.t=0; const ad=ADULT();
 // Ende: 1) glänzt überall · 2) zufriedener Seufzer/Zeile (Frauenstimme) · 3) Pose: stützt sich auf, schaut zum Spieler · 4) ~1 s Stille · 5) „Danke, Kleiner.“ als allerletzte Zeile
 st.endOk=true; if(radio) musFade(MUSV*0.35,800); const a=say(ad?'a3':'h3'); let go=false; const next=()=>{ if(go) return; go=true; setTimeout(sit,600); };
 if(a){ a.addEventListener('ended',next); a.addEventListener('error',next); } setTimeout(next,4500);
 function sit(){ musOff=true; if(radio){ const r=radio; musFade(0,250,()=>r.pause()); aud('../../sfx/radio_static.mp3',0.25); }
  const Lw=window.__oaseLw, i0=Lw.intensity, sh=window.__oaseShade; let n=0;
  const fl=()=>{ n++; Lw.intensity=n%2?0.15:i0*0.7; if(sh) sh.emissiveIntensity=n%2?0.05:0.4; if(n===3) swapPose(); if(n<5) setTimeout(fl,70+Math.random()*90); else { Lw.intensity=i0; if(sh) sh.emissiveIntensity=0.55; setTimeout(()=>{ st.endOk=true; say('punch','Kundin'); reward(); setTimeout(()=>{ if(radio){ radio.play().catch(()=>{}); musFade(MUSV*0.4,2500); } },4500); },6000); } };   // o14: 6 s Stille nach dem Schreck, dann „Danke, Kleiner.“ als letzter Satz
  setTimeout(fl,300); } }
function swapPose(){ if(!fig.up){ jig.bv+=0.12; jig.sv+=0.08; console.warn('[oase] Sitz-Pose fehlt'); return; } if(!snapUp()) swapHard(); }
function swapHard(){ fig.lie.root.visible=false; fig.up.root.visible=true; applyMode(fig.up); pose='up'; jig.bv+=0.09; jig.sv+=0.05; }
// o14: Schreck-Aufsetzen – schnell (0,42 s) aber durch Zwischenposen: Kopf reißt zuerst hoch, Rumpf folgt im Bogen um die Hüfte (keine Teleportation, kein Schrumpfen)
function snapUp(){ try{ const L=fig.lie, U=fig.up; L.root.updateMatrixWorld(true); U.root.updateMatrixWorld(true);
 const pairs=[], free=[], M=new T.Matrix4(), N3=new T.Matrix3(), v=new T.Vector3();
 L.root.traverse(o=>{ if(o.name==='contactAO'){ o.visible=false; return; } if(!o.isMesh||!o.visible) return; let u=null; U.root.traverse(q=>{ if(!u&&q.isMesh&&q.name===o.name) u=q; });
  const A=o.geometry.attributes.position; if(u&&u.geometry.attributes.position.count===A.count){ M.copy(o.matrixWorld).invert().multiply(u.matrixWorld); N3.getNormalMatrix(M);
   const B=u.geometry.attributes.position, n=A.count, a=new Float32Array(A.array.length), b=new Float32Array(n*3); a.set(A.array);
   for(let i=0;i<n;i++){ v.fromBufferAttribute(B,i).applyMatrix4(M); b[i*3]=v.x; b[i*3+1]=v.y; b[i*3+2]=v.z; }
   const NA=o.geometry.attributes.normal, NB=u.geometry.attributes.normal; let na=null,nb=null; if(NA&&NB){ na=new Float32Array(NA.array); nb=new Float32Array(n*3); for(let i=0;i<n;i++){ v.fromBufferAttribute(NB,i).applyMatrix3(N3).normalize(); nb[i*3]=v.x; nb[i*3+1]=v.y; nb[i*3+2]=v.z; } }
   pairs.push({o,a,b,na,nb}); } else free.push(o); });
 const body=pairs.find(p=>L.parts.body.indexOf(p.o)>=0); if(!body) return false;
 free.forEach(o=>{ if(o.userData.follow){ pairs.push({o,a:new Float32Array(o.geometry.attributes.position.array),follow:o.userData.follow}); return; } const A=o.geometry.attributes.position, n=A.count, nn=new Int32Array(n), a=new Float32Array(A.array), ba=body.a, m=ba.length/3; // Handtuch/Decke: folgt dem nächsten Körperpunkt
  for(let i=0;i<n;i++){ let bd=1e9,bk=0; for(let k=0;k<m;k+=6){ const dx=a[i*3]-ba[k*3], dy=a[i*3+1]-ba[k*3+1], dz=a[i*3+2]-ba[k*3+2], d=dx*dx+dy*dy+dz*dz; if(d<bd){ bd=d; bk=k; } } nn[i]=bk; }
  o.userData.follow=nn; pairs.push({o,a,follow:nn}); });
 const PX=-0.45, PY=0.09, DUR=420, t0=performance.now(), cur=body.a.slice(0);
 const step=()=>{ const t=Math.min(1,(performance.now()-t0)/DUR);
  for(const p of pairs){ if(p.follow) continue; const A=p.o.geometry.attributes.position.array, a=p.a, b=p.b, n=a.length/3;
   for(let i=0;i<n;i++){ const j=i*3, xl=a[j]; const dl=0.32*Math.min(1,Math.max(0,(xl+0.9)/0.9)); let w=Math.min(1,Math.max(0,(t-dl)/(1-dl))); w=w*w*(3-2*w); w=1-Math.pow(1-w,1.6);
    const ax=a[j]-PX, ay=a[j+1]-PY, bx=b[j]-PX, by=b[j+1]-PY, ra=Math.hypot(ax,ay), rb=Math.hypot(bx,by); let ta=Math.atan2(ay,ax), tb=Math.atan2(by,bx), dt=tb-ta; if(dt>Math.PI) dt-=2*Math.PI; if(dt<-Math.PI) dt+=2*Math.PI;
    const r=ra+(rb-ra)*w, th=ta+dt*w, k=Math.min(1,Math.max(0,(Math.min(ra,rb)-0.08)/0.15));
    A[j]=(a[j]+(b[j]-a[j])*w)*(1-k)+(PX+r*Math.cos(th))*k; A[j+1]=(a[j+1]+(b[j+1]-a[j+1])*w)*(1-k)+(PY+r*Math.sin(th))*k; A[j+2]=a[j+2]+(b[j+2]-a[j+2])*w;
    if(p.na){ const NN=p.o.geometry.attributes.normal.array; let x=p.na[j]+(p.nb[j]-p.na[j])*w, y=p.na[j+1]+(p.nb[j+1]-p.na[j+1])*w, z=p.na[j+2]+(p.nb[j+2]-p.na[j+2])*w; const l=Math.hypot(x,y,z)||1; NN[j]=x/l; NN[j+1]=y/l; NN[j+2]=z/l; } }
   p.o.geometry.attributes.position.needsUpdate=true; if(p.na) p.o.geometry.attributes.normal.needsUpdate=true; if(p===body) cur.set(A); }
  for(const p of pairs){ if(!p.follow) continue; const A=p.o.geometry.attributes.position.array, a=p.a, ba=body.a, n=a.length/3; for(let i=0;i<n;i++){ const j=i*3, k=p.follow[i]*3; A[j]=a[j]+cur[k]-ba[k]; A[j+1]=a[j+1]+cur[k+1]-ba[k+1]; A[j+2]=a[j+2]+cur[k+2]-ba[k+2]; } p.o.geometry.attributes.position.needsUpdate=true; }
  if(t<1) SNAP=step; else { SNAP=null; swapHard(); pairs.forEach(p=>{ p.o.geometry.attributes.position.array.set(p.a); p.o.geometry.attributes.position.needsUpdate=true; if(p.na){ p.o.geometry.attributes.normal.array.set(p.na); p.o.geometry.attributes.normal.needsUpdate=true; } }); } };
 pose='rise'; jig.bv+=0.05; SNAP=step; step(); setTimeout(()=>{ if(pose==='rise'){ SNAP=null; pairs.forEach(p=>{ p.o.geometry.attributes.position.array.set(p.a); p.o.geometry.attributes.position.needsUpdate=true; if(p.na){ p.o.geometry.attributes.normal.array.set(p.na); p.o.geometry.attributes.normal.needsUpdate=true; } }); swapHard(); } },1500); return true; }catch(e){ console.warn('snapUp',e); return false; } }
// o15: Aufsetzen läuft im A-Frame-Tick (= XR-Frame). window.requestAnimationFrame steht in der immersiven Quest-Sitzung still → vorher blieb sie bei t≈0 hängen (Pose 2 kam nie). Sicherheitsnetz: nach 1,5 s harter Wechsel.
let SNAP=null; function snapTick(){ if(SNAP) SNAP(); if(RAFQ.length){ const q=RAFQ; RAFQ=[]; q.forEach(f=>f()); } }
let RAFQ=[]; function raf(f){ RAFQ.push(f); }   // o15: eigene Frame-Schleife über den A-Frame-Tick (läuft auch in VR); Flasche + roter Rand blieben in VR sonst hängen
function reward(){ setTimeout(()=>{ if(!window.zsaNote) return; const n=zsaNote('Gutschein: Einmal Ölmassage gratis. Für den Kleinen. – Gerd',0.16,0.1); n.position.set(CART.x+0.02,0.795,CART.z+0.12); n.rotation.x=-Math.PI/2; n.rotation.z=0.3; G.add(n); try{ localStorage.setItem('zs_oase_done','1'); }catch(e){} },2500); }
// ---------------------------------------------------------------- Eingabe: Maus/Touch (Pointer) + VR-Controller
const rc=new T.Raycaster(), tmpV=new T.Vector3(), tmpV2=new T.Vector3();
// Controller-Pose in Weltkoordinaten (wie zsaCtrlPos in alpha.js – hier eigenständig, Seite läuft auch ohne Spiel-Ablauf)
function ctrlPos(c,out){ if(!c.parent||c.parent===S){ out.copy(c.position); if(rig) rig.localToWorld(out); } else c.getWorldPosition(out); return out; }
function ctrlRay(c){ const o=ctrlPos(c,new T.Vector3()), q=new T.Quaternion(); if(!c.parent||c.parent===S){ q.copy(c.quaternion); if(rig){ const rq=new T.Quaternion(); rig.getWorldQuaternion(rq); q.premultiply(rq); } } else c.getWorldQuaternion(q); return new T.Ray(o,new T.Vector3(0,0,-1).applyQuaternion(q)); }
function bodyMeshes(){ const f=pose==='up'?fig.up:fig.lie; if(!f) return []; return f.parts.body.concat(f.parts.top.filter(o=>o.visible),f.parts.hair,f.parts.towel.filter(o=>o.visible),f.parts.robe.filter(o=>o.visible)); }
function hitBody(ray){ rc.ray.copy(ray); rc.far=3; const h=rc.intersectObjects(bodyMeshes(),false)[0]; if(!h) return null; const f=pose==='up'?fig.up:fig.lie; const onTop=f.parts.top.indexOf(h.object)>=0&&h.object.visible; if(f.parts.body.indexOf(h.object)<0&&!onTop) return {cover:true}; const l=f.parts.body[0].worldToLocal(h.point.clone());   // o12 jugendfrei: Badeanzug zählt mit (Öl an den Rändern)
  return {lx:l.x,lz:l.z,p:h.point}; }
function hitBottle(ray){ rc.ray.copy(ray); rc.far=4; return rc.intersectObject(bottle,true).length>0; }
let drag=null;
function setupPointer(){ const cv=S.el?S.el.canvas:document.querySelector('a-scene').canvas; cv.style.touchAction='none'; const camEl=document.getElementById('cam');
 const ray=e=>{ const r=cv.getBoundingClientRect(); rc.setFromCamera({x:(e.clientX-r.left)/r.width*2-1,y:-(e.clientY-r.top)/r.height*2+1},S.el?S.el.camera:document.querySelector('a-scene').camera); return rc.ray.clone(); };
 cv.addEventListener('pointerdown',e=>{ if(R.xr.isPresenting) return; startAmb(); const r=ray(e); if(hitBottle(r)) { takeOil(); return; } const h=hitBody(r); if(h){ drag={id:e.pointerId,last:h.cover?null:h,zone:!!(h&&!h.cover&&inChest(h.lx,h.lz))}; camEl.setAttribute('look-controls','enabled',false); try{ cv.setPointerCapture(e.pointerId); }catch(_){} } },true);
 cv.addEventListener('pointermove',e=>{ if(!drag||e.pointerId!==drag.id) return; const h=hitBody(ray(e)); drag.zone=!!(h&&!h.cover&&inChest(h.lx,h.lz)); if(h&&!h.cover){ const len=drag.last&&drag.last.p?h.p.distanceTo(drag.last.p):0.02; if(len>0.004){ rub(h.lx,h.lz,Math.min(len,0.08)); drag.last=h; } } else if(h&&h.cover) lastPaint=null; });
 const up=e=>{ if(!drag||e.pointerId!==drag.id) return; drag=null; lastPaint=null; setTimeout(()=>camEl.setAttribute('look-controls','enabled',true),0); };
 cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
 // Klick-Pfad für Handy-Tipp (touchctl → Maus-Klick) auf die Flasche
 cv.addEventListener('click',e=>{ if(R.xr.isPresenting) return; if(hitBottle(ray(e))) takeOil(); }); }
// o10 VR: zwei Wege für Controller – A-Frame-Entities #hl/#hr (triggerdown/gripdown, Griff-Pose = wo die Hand ist) und three-XR-Controller (selectstart/squeezestart) als Ersatz.
// Sobald ein Entity-Ereignis kam, reiben nur noch die Entities (kein doppeltes Einreiben). Toleranz: Hand bis 12 cm über bzw. 18 cm in der Haut zählt.
const ctl=[{held:false,last:null,hand:'left'},{held:false,last:null,hand:'right'},{held:false,last:null,hand:'left',ent:'hl'},{held:false,last:null,hand:'right',ent:'hr'}]; let useEnt=false;
function ctlPos(i,out){ const k=ctl[i]; if(k.ent){ const el=document.getElementById(k.ent); el.object3D.getWorldPosition(out); return out; } return ctrlPos(R.xr.getController(i),out); }
function ctlRay(i){ const k=ctl[i]; if(k.ent){ const o=document.getElementById(k.ent).object3D, q=new T.Quaternion(), p=new T.Vector3(); o.getWorldPosition(p); o.getWorldQuaternion(q); return new T.Ray(p,new T.Vector3(0,0,-1).applyQuaternion(q)); } return ctrlRay(R.xr.getController(i)); }
function nearBottle(p){ const b=new T.Vector3(); bottle.getWorldPosition(b); b.y+=0.1; return p.distanceTo(b)<0.3||p.distanceTo(bottleHome)<0.3; }
function ctlDown(i){ const k=ctl[i]; if(k.ent) useEnt=true; k.held=true; k.last=null; startAmb(); const p=ctlPos(i,new T.Vector3()); if(nearBottle(p)||(!st.oiled&&hitBottle(ctlRay(i)))) takeOil(); }
function ctlUp(i){ const k=ctl[i]; k.held=false; k.zone=false; k.last=null; lastPaint=null; }
function setupXR(){ [0,1].forEach(i=>{ const c=R.xr.getController(i); const dn=()=>ctlDown(i), upf=()=>ctlUp(i);
  c.addEventListener('selectstart',dn); c.addEventListener('squeezestart',dn); c.addEventListener('selectend',upf); c.addEventListener('squeezeend',upf); });
 [2,3].forEach(i=>{ const el=document.getElementById(ctl[i].ent); if(!el) return; ['triggerdown','gripdown'].forEach(ev=>el.addEventListener(ev,()=>ctlDown(i))); ['triggerup','gripup'].forEach(ev=>el.addEventListener(ev,()=>ctlUp(i))); }); }
// (Zeile 3 = zufriedener Satz kommt nur noch beim Ende, nicht doppelt bei 68 %)
// o13 Debug-Karte (Test-Build): kleine Tafel am Wagen (Welt-Raum, nicht kopffest). An: ?debug=1 oder beide Griff-Tasten 2 s halten
const DBG={allow:/[?&]debug=1/.test(location.search),on:/[?&]debug=1/.test(location.search),hit:'-',path:'-',wMax:0,mesh:null,cv:null,t:0,g0:0};
function dbgGrip(ses){ if(!ses||!DBG.allow) return; let n=0; for(const s_ of ses.inputSources){ const b=s_.gamepad&&s_.gamepad.buttons; if(b&&b[1]&&b[1].pressed) n++; }
 const now=performance.now(); if(n>=2){ if(!DBG.g0) DBG.g0=now; else if(now-DBG.g0>2000&&DBG.g0>0){ DBG.on=!DBG.on; DBG.g0=-1; } } else DBG.g0=0; }
function dbgTick(){ DBG.wMax=Math.max(DBG.wMax*0.995,uPress.value.w); if(!DBG.on){ if(DBG.mesh) DBG.mesh.visible=false; return; } const now=performance.now(); if(now-DBG.t<400) return; DBG.t=now;
 if(!DBG.mesh){ const cv=document.createElement('canvas'); cv.width=512; cv.height=340; const tx=new T.CanvasTexture(cv); tx.colorSpace=T.SRGBColorSpace;
  DBG.mesh=new T.Mesh(new T.PlaneGeometry(0.26,0.1727),new T.MeshBasicMaterial({map:tx,toneMapped:false})); DBG.mesh.position.set(CART.x-0.02,1.02,CART.z+0.22); DBG.mesh.rotation.set(-0.35,0.25,0); G.add(DBG.mesh); DBG.cv=cv; }
 DBG.mesh.visible=true; const x=DBG.cv.getContext('2d'), L_=k=>{ try{ return localStorage.getItem(k); }catch(e){ return 'n/a'; } };
 const rows=[['Modus',ADULT()?'AB 18':'jugendfrei'],['Flag',(window.ZS_OASE_REQUIRE_QUIZ===false?'Quiz AUS (Test) · ':'')+"zs_adult="+L_('zs_adult')+" ok="+L_('zs_adult_ok')+(/[?&]kids=1/.test(location.search)?' kids=1':'')],
  ['Öl',(st.oiled?'genommen':'NICHT genommen')+' · '+(100*(st.cov||0)).toFixed(0)+' % / 90 %'],['Ende',st.done?('läuft · Pose '+pose):(st.endOk?'ok':'nein')],
  ['Eingabe',(R.xr.isPresenting?'VR ':'2D ')+DBG.path],['Hand',DBG.hit+' · '+ctl.map(k=>k.held?'■':'□').join('')],
  ['Delle',(window.__oaseSoft?'Soft-Shader an':'einfach')+' · '+(DBG.wMax*1000).toFixed(1)+' mm'],['Build','1023o16']];
 x.fillStyle='rgba(18,14,10,0.92)'; x.fillRect(0,0,512,340); x.strokeStyle='#8a6e44'; x.lineWidth=3; x.strokeRect(2,2,508,336); x.font='600 25px "DejaVu Sans Condensed",sans-serif';
 rows.forEach((r,i)=>{ x.fillStyle='#b89a62'; x.fillText(r[0],14,38+i*40); x.fillStyle='#f0e2c2'; x.fillText(String(r[1]).slice(0,34),128,38+i*40); }); DBG.mesh.material.map.needsUpdate=true; }
function xrTick(){ if(!R.xr.isPresenting) return; const ses=R.xr.getSession&&R.xr.getSession(); dbgGrip(ses);
 const hp=new T.Vector3(); cam.getWorldPosition(hp);
 ctl.forEach((k,i)=>{ if(useEnt&&!k.ent) return; const p=ctlPos(i,tmpV).clone(); if(p.distanceTo(hp)<0.12||p.lengthSq()<1e-6){ k.pl=null; if(k.rg){ regRelease(k.rg); k.rg=null; } return; } const pl=bodyLocal(p); if(!pl) return;
  const src=ses&&[...ses.inputSources].find(s_=>s_.handedness===k.hand), gp=src&&src.gamepad, grip=!!(gp&&gp.buttons[1]&&gp.buttons[1].pressed);
  if(grip&&!k.rg&&!k.gripWas) { k.rg=regGrab(pl,i); if(k.rg&&gp.hapticActuators&&gp.hapticActuators[0]) gp.hapticActuators[0].pulse(0.3,25); } if(!grip&&k.rg){ regRelease(k.rg); k.rg=null; } k.gripWas=grip;
  if(k.rg) regGrabMove(k.rg,pl); else if(k.pl) regPush(pl,pl.clone().sub(k.pl),false); k.pl=pl; });   // o16: Hand drückt/streicht → Gewebe gibt nach; Griff-Taste an Arm/Bein → mitnehmen
 ctl.forEach((k,i)=>{ if(!k.held) return; if(useEnt&&!k.ent) return; const p=ctlPos(i,tmpV).clone(); if(p.distanceTo(hp)<0.12||p.lengthSq()<1e-6){ k.last=null; return; }   // o15: Eingabe nur von der Hand – nie vom Kopf (Controller ohne Tracking/ am Kopf = ignorieren)
  // Strahl von 25 cm über der Hand senkrecht nach unten: Haut zwischen 12 cm unter und 18 cm über der Hand → einreiben
  const h=hitBody(new T.Ray(p.clone().add(new T.Vector3(0,0.25,0)),new T.Vector3(0,-1,0))); const dy=h&&h.p?h.p.y-p.y:0; DBG.hit=!h?'kein Treffer':h.cover?'Decke/Tuch':(dy<-0.12||dy>0.18)?'Abstand '+(dy*100).toFixed(0)+' cm':'Haut '+(dy*100).toFixed(0)+' cm'; DBG.path=useEnt?'A-Frame laser-controls (#hl/#hr)':'three XR-Controller'; if(!h||h.cover||dy<-0.12||dy>0.18){ k.last=null; k.zone=false; return; } k.zone=inChest(h.lx,h.lz);
  const len=k.last?h.p.distanceTo(k.last):0; k.last=h.p.clone(); if(len>0.003){ rub(h.lx,h.lz,Math.min(len,0.08)); if(st.oiled&&ses){ const src=[...ses.inputSources].find(s=>s.handedness===k.hand); const ha=src&&src.gamepad&&src.gamepad.hapticActuators&&src.gamepad.hapticActuators[0]; ha&&ha.pulse&&ha.pulse(0.18,18); } } }); }

// ---------------------------------------------------------------- o15 Realismus: Brustwarzen-Rahmen, Rötungen, Kontaktschatten
function figBody(f){ let b=null; f&&f.root.traverse(o=>{ if(o.isMesh&&o.userData.o9&&(!b||o.geometry.attributes.position.count>b.geometry.attributes.position.count)) b=o; }); return b; }
function nipPrep(){ try{ const bl=figBody(fig.lie); if(!bl) return; const P=bl.geometry.attributes.position, UV=bl.geometry.attributes.uv, n=P.count;
 // Hautfarbe aus der Textur lesen: dunkelster Fleck nahe dem Brust-Scheitel = Mitte des gemalten Warzenhofs
 let lum=null, col=null; const im=bl.material.map&&bl.material.map.image; if(im&&UV){ try{ const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(im,0,0,512,512); const d=x.getImageData(0,0,512,512).data; const fy=bl.material.map.flipY; lum=i=>{ const u=UV.getX(i), v=UV.getY(i); const px=Math.min(511,Math.max(0,(u*512)|0)), py=Math.min(511,Math.max(0,((fy?1-v:v)*512)|0)), k=(py*512+px)*4; return 0.3*d[k]+0.59*d[k+1]+0.11*d[k+2]; }; col=i=>{ const u=UV.getX(i), v=UV.getY(i); const px=Math.min(511,Math.max(0,(u*512)|0)), py=Math.min(511,Math.max(0,((fy?1-v:v)*512)|0)), k=(py*512+px)*4; return [d[k],d[k+1],d[k+2]]; }; }catch(e){ lum=null; } }
 const ctr=[];
 [1,-1].forEach(sg=>{ let ai=-1, ay=-1e9; for(let i=0;i<n;i++){ const x=P.getX(i), z=P.getZ(i)*sg; if(x<-0.75||x>-0.25||z<0.03||z>0.2) continue; const y=P.getY(i); if(y>ay){ ay=y; ai=i; } } if(ai<0) return;
  const A=new T.Vector3().fromBufferAttribute(P,ai); let ci=ai;
  if(lum){ const c=[]; for(let i=0;i<n;i++){ const dx=P.getX(i)-A.x, dy=P.getY(i)-A.y, dz=P.getZ(i)-A.z; if(dx*dx+dy*dy+dz*dz<0.035*0.035) c.push([i,lum(i)]); } c.sort((a,b)=>a[1]-b[1]); const top=c.slice(0,Math.max(3,c.length*0.12|0)); if(c.length>20&&c[c.length-1][1]-c[0][1]>14){ const m=new T.Vector3(); top.forEach(([i])=>m.add(new T.Vector3().fromBufferAttribute(P,i))); m.divideScalar(top.length); let bd=1e9; for(const [i] of c){ const dd=new T.Vector3().fromBufferAttribute(P,i).distanceToSquared(m); if(dd<bd){ bd=dd; ci=i; } } } }
  ctr.push(ci); if(col&&ctr.length===1){ const C0=new T.Vector3().fromBufferAttribute(P,ci), a=[0,0,0]; let m=0; for(let i=0;i<n;i+=2){ const dd=new T.Vector3().fromBufferAttribute(P,i).distanceTo(C0); if(dd>0.035&&dd<0.05){ const c=col(i); a[0]+=c[0]; a[1]+=c[1]; a[2]+=c[2]; m++; } } if(m>10){ const L=x=>Math.pow(x/m/255,2.2); uSkin.value.setRGB(L(a[0]),L(a[1]),L(a[2])); } } });   // o16: Hautton rund um den Hof → Warzenhof-Farbe passend (statt gemaltem dunklen Fleck)
 window.__oaseNip=ctr.slice();
 // Rötung (Knie, Ellbogen, Hände, Füße) aus der Liege-Pose, per Index auf die Sitzpose übertragen
 const red=new Float32Array(n), g_=(v,c,w)=>Math.exp(-(((v-c)/w)**2));
 for(let i=0;i<n;i++){ const x=P.getX(i), y=P.getY(i), z=Math.abs(P.getZ(i)); let r=0;
  r=Math.max(r,g_(x,0.33,0.05)*g_(z,0.10,0.05)*(y>0.05?1:0.3));            // Knie (Oberseite)
  r=Math.max(r,g_(x,-0.36,0.05)*(z>0.2?1:0)*0.8);                         // Ellbogen
  r=Math.max(r,(x>-0.12&&x<0.12&&z>0.2?1:0)*0.75*g_(x,0.02,0.09));      // Hände
  r=Math.max(r,x>0.66?0.55*Math.min(1,(x-0.66)/0.06):0);                   // Füße/Zehen
  red[i]=r; }
 regPrep(bl,P,n);
 [fig.lie,fig.up].forEach(f=>{ const b=figBody(f); if(!b||b.geometry.attributes.position.count!==n) return; if(b!==bl&&b.geometry.attributes._reg){ b.geometry.attributes._reg.array.set(bl.geometry.attributes._reg.array); b.geometry.attributes._reg.needsUpdate=true; } const Q=b.geometry.attributes.position, N_=b.geometry.attributes.normal, A=b.geometry.attributes._nip; const fr=ctr.map(ci=>{ const c=new T.Vector3().fromBufferAttribute(Q,ci), nn=new T.Vector3().fromBufferAttribute(N_,ci).normalize(); const u=new T.Vector3(1,0,0).addScaledVector(nn,-nn.x).normalize(), v=new T.Vector3().crossVectors(nn,u); return {c,nn,u,v}; });
  const o=new T.Vector3(); for(let i=0;i<n;i++){ let best=null, bd=1e9; for(const F of fr){ o.fromBufferAttribute(Q,i).sub(F.c); const d=o.lengthSq(); if(d<bd){ bd=d; best=F; } } if(best&&bd<0.06*0.06){ o.fromBufferAttribute(Q,i).sub(best.c); A.setXYZW(i,o.dot(best.u),o.dot(best.v),o.dot(best.nn),red[i]); } else A.setXYZW(i,1,1,1,red[i]); } A.needsUpdate=true; }); }catch(e){ console.warn('nipPrep',e); } }
function contactShadow(){ try{ [fig.lie,fig.up].forEach(f=>{ const b=figBody(f); if(!b) return; const W=256,H=128, c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'); x.fillStyle='#000'; x.fillRect(0,0,W,H);
  const P=b.geometry.attributes.position, X0=-0.98, X1=0.88, Z0=-0.36, Z1=0.36; b.updateWorldMatrix(true,false); x.fillStyle='rgba(255,255,255,0.16)';
  for(let i=0;i<P.count;i+=3){ const y=P.getY(i); if(y>0.05) continue; const k=1-Math.max(0,y)/0.05; const px=(P.getX(i)-X0)/(X1-X0)*W, pz=(P.getZ(i)-Z0)/(Z1-Z0)*H; x.globalAlpha=k*k; x.beginPath(); x.arc(px,pz,2.2,0,6.283); x.fill(); }
  const c2=document.createElement('canvas'); c2.width=W; c2.height=H; const x2=c2.getContext('2d'); x2.filter='blur(5px)'; x2.drawImage(c,0,0); const t=new T.CanvasTexture(c2);
  const m=new T.Mesh(new T.PlaneGeometry(X1-X0,Z1-Z0),new T.MeshBasicMaterial({color:0x1a0c06,alphaMap:t,transparent:true,opacity:0.55,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  m.rotation.x=-Math.PI/2; m.position.set((X0+X1)/2,-0.0005,(Z0+Z1)/2); m.renderOrder=1; m.name='contactAO'; b.parent.add(m); m.position.applyMatrix4(new T.Matrix4().copy(b.matrix)); }); }catch(e){ console.warn('contactShadow',e); } }
function prepFollow(){ try{ if(!fig.lie||!fig.up) return; const bl=figBody(fig.lie); if(!bl) return; const ba=bl.geometry.attributes.position.array, m=ba.length/3;   // o15: Folge-Zuordnung (Tuch/Haar) schon beim Laden – kein Ruckler im Moment des Aufsetzens
 fig.lie.root.traverse(o=>{ if(!o.isMesh||o===bl||o.userData.follow||o.name==='contactAO') return; let u=null; fig.up.root.traverse(q=>{ if(!u&&q.isMesh&&q.name===o.name) u=q; }); if(u&&u.geometry.attributes.position.count===o.geometry.attributes.position.count) return;
  const a=o.geometry.attributes.position.array, n=a.length/3, nn=new Int32Array(n); for(let i=0;i<n;i++){ let bd=1e9,bk=0; for(let k=0;k<m;k+=6){ const dx=a[i*3]-ba[k*3], dy=a[i*3+1]-ba[k*3+1], dz=a[i*3+2]-ba[k*3+2], d=dx*dx+dy*dy+dz*dz; if(d<bd){ bd=d; bk=k; } } nn[i]=bk; } o.userData.follow=nn; }); }catch(e){ console.warn('prepFollow',e); } }

// ---------------------------------------------------------------- o15: „Öl-Barometer“ an der linken Wand (statt Debug-Karte) – altes Messing-Zeigerinstrument, kein Leuchten
let GAUGE=null;
function buildGauge(std){ const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d'), C=256;
 const gr=x.createRadialGradient(C,C,40,C,C,256); gr.addColorStop(0,'#efe3c4'); gr.addColorStop(0.85,'#e2d1a8'); gr.addColorStop(1,'#c9b383'); x.fillStyle=gr; x.fillRect(0,0,512,512);
 for(let i=0;i<2600;i++){ x.fillStyle='rgba(120,90,40,'+(Math.random()*0.05)+')'; x.fillRect(Math.random()*512,Math.random()*512,1+Math.random()*2,1+Math.random()*2); }   // vergilbtes Papier
 x.save(); x.globalAlpha=0.10; x.fillStyle='#7a5a20'; x.beginPath(); x.ellipse(150,380,60,30,0.4,0,6.283); x.fill(); x.restore();           // Wasserfleck
 const A0=-225*Math.PI/180, A1=45*Math.PI/180, ang=k=>A0+(A1-A0)*k; x.strokeStyle='#2a1e14'; x.fillStyle='#2a1e14';
 x.lineWidth=3; x.beginPath(); x.arc(C,C,196,A0,A1); x.stroke(); x.lineWidth=1.5; x.beginPath(); x.arc(C,C,186,A0,A1); x.stroke();
 for(let i=0;i<=50;i++){ const a=ang(i/50), r0=i%5?186:176; x.lineWidth=i%5?1.5:3; x.beginPath(); x.moveTo(C+Math.cos(a)*r0,C+Math.sin(a)*r0); x.lineTo(C+Math.cos(a)*196,C+Math.sin(a)*196); x.stroke(); }
 x.font='600 22px Georgia,serif'; x.textAlign='center'; x.textBaseline='middle'; for(let i=0;i<=10;i++){ const a=ang(i/10); x.fillText(String(i*10),C+Math.cos(a)*156,C+Math.sin(a)*156); }
 x.save(); x.globalAlpha=0.55; x.strokeStyle='#8a2a18'; x.lineWidth=9; x.beginPath(); x.arc(C,C,206,ang(0.9),ang(1)); x.stroke(); x.restore();   // rotes Feld ab 90 %
 x.font='italic 600 26px Georgia,serif'; [['TROCKEN',0.05],['MATT',0.3],['SEIDIG',0.55],['GEÖLT',0.86]].forEach(([t,k])=>{ const a=ang(k); x.save(); x.translate(C+Math.cos(a)*112,C+Math.sin(a)*112); x.rotate(a+Math.PI/2); x.fillText(t,0,0); x.restore(); });
 x.font='700 26px Georgia,serif'; x.fillText('ÖL-BAROMETER',C,C+150); x.font='italic 15px Georgia,serif'; x.fillText('Sonnen-Oase · Feinmechanik seit 1979',C,C+176); x.font='12px Georgia,serif'; x.fillText('Nr. 0815 · geeicht',C,C+196);
 const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; t.anisotropy=8;
 const grp=new T.Group(); grp.position.set(RW.x0+0.012,1.46,TB.z); grp.rotation.y=Math.PI/2; S.add(grp);
 const wood=new T.MeshStandardMaterial({color:0x4a2a16,roughness:0.55,metalness:0}), brass=new T.MeshStandardMaterial({color:0xb08a4a,roughness:0.38,metalness:0.85}), dark=new T.MeshStandardMaterial({color:0x15100c,roughness:0.5,metalness:0.3});
 const back=new T.Mesh(new T.CylinderGeometry(0.175,0.18,0.03,48),wood); back.rotation.x=Math.PI/2; back.position.z=0.015; grp.add(back);
 const ring=new T.Mesh(new T.TorusGeometry(0.142,0.011,14,64),brass); ring.position.z=0.034; grp.add(ring);
 const face=new T.Mesh(new T.CircleGeometry(0.138,64),new T.MeshStandardMaterial({map:t,roughness:0.75,emissive:0xffffff,emissiveMap:t,emissiveIntensity:0.16})); face.position.z=0.031; grp.add(face);   // leicht angehoben, damit im Halbdunkel lesbar – kein Leuchten
 const hub=new T.Mesh(new T.CylinderGeometry(0.009,0.009,0.006,20),brass); hub.rotation.x=Math.PI/2; hub.position.z=0.037; grp.add(hub);
 const mkN=(len,w,mat,z)=>{ const p=new T.Group(); const sh=new T.Shape(); sh.moveTo(-w,-0.02); sh.lineTo(w,-0.02); sh.lineTo(w*0.25,len); sh.lineTo(-w*0.25,len); sh.closePath(); const m=new T.Mesh(new T.ShapeGeometry(sh),mat); p.add(m); p.position.z=z; grp.add(p); return p; };
 const ref=mkN(0.112,0.0035,brass,0.0335); ref.rotation.z=-(ang(0.9)+Math.PI/2);   // Messing-Merkzeiger auf 90 %
 const nd=mkN(0.122,0.0028,dark,0.0355);
 const plate=new T.Mesh(new T.BoxGeometry(0.11,0.026,0.004),brass); plate.position.set(0,-0.205,0.006); grp.add(plate);
 const hook=new T.Mesh(new T.CylinderGeometry(0.003,0.003,0.02,8),brass); hook.rotation.x=Math.PI/2; hook.position.set(0,0.185,0.01); grp.add(hook);
 GAUGE={nd,ang,k:0,v:0}; nd.rotation.z=-(ang(0)+Math.PI/2); }
function gaugeTick(d){ if(!GAUGE) return; const g=GAUGE, tgt=Math.min(1,st.cov||0); g.v+=((tgt-g.k)*30-g.v*7)*d; g.k+=g.v*d; g.k=Math.max(-0.01,Math.min(1.02,g.k)); g.nd.rotation.z=-(g.ang(g.k+0.004*Math.sin(uT.value*7.3))+Math.PI/2); }   // gedämpft, leichtes Zittern wie ein echtes Instrument
// o15: kaum merkliches Leben – alle 7–13 s eine winzige Gewichtsverlagerung (Federn, mm-Bereich)
const idle={t:6};
function idleTick(d){ if(!window.__oaseSoft||st.done) return; idle.t-=d; if(idle.t>0) return; idle.t=7+Math.random()*6; jig.bv+=(Math.random()-0.4)*0.012; jig.bzv+=(Math.random()-0.5)*0.008; jig.sv+=(Math.random()-0.5)*0.008; }

// ---------------------------------------------------------------- o16: „leicht bewegbar“ – Feder-Regionen ohne Physik-Engine (Gefühl à la Bonelab: Gewicht, Trägheit, schlaff)
// 1,2 Brust L/R · 3 Bauch · 4,5 Innenschenkel (weich: gedämpftes Nachwippen) · 6,7 Arm L/R · 8,9 Unterschenkel L/R (greifbar, folgen der Hand mit Feder-Verzug, fallen beim Loslassen mit kleinem Abprall auf die Liege)
const REG=Array.from({length:10},(_,i)=>({i,soft:i>0&&i<6,limb:i>=6,x:new T.Vector3(),v:new T.Vector3(),pts:[],grab:null}));
function regPrep(bl,P,n){ const A=bl.geometry.attributes._reg; if(!A) return; const aps=[1,-1].map(sg=>{ let ay=-1e9, a=null; for(let i=0;i<n;i++){ const x=P.getX(i), z=P.getZ(i)*sg; if(x<-0.75||x>-0.25||z<0.03||z>0.2) continue; if(P.getY(i)>ay){ ay=P.getY(i); a=new T.Vector3(P.getX(i),P.getY(i)-0.045,P.getZ(i)); } } return a; });
 const ss=(a,b,x)=>{ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }, G=(v,c,w)=>Math.exp(-(((v-c)/w)**2)), q=new T.Vector3();
 for(let i=0;i<n;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i), az=Math.abs(z), sg=z>=0?0:1; let id=0, w=0; const put=(k,ww)=>{ if(ww>w){ w=ww; id=k; } };
  const ap=aps[sg]; if(ap){ q.set(x,y,z); const d=q.distanceTo(ap); put(1+sg,Math.pow(Math.max(0,1-d/0.12),1.5)*ss(0.10,0.16,y)); }
  put(3,G(x,-0.12,0.12)*G(z,0,0.11)*ss(0.04,0.10,y)*0.8);
  if(x>0.06&&x<0.34&&az<0.14) put(4+sg,G(x,0.2,0.09)*G(az,0.06,0.05)*ss(0.02,0.07,y)*0.9);
  if(az>0.19&&x>-0.62&&x<0.14) put(6+sg,ss(-0.55,-0.08,x));
  if(x>0.36) put(8+sg,ss(0.36,0.76,x));
  A.setXY(i,id,w); }
 A.needsUpdate=true; REG.forEach(r=>r.pts=[]); for(let i=0;i<n;i+=7){ const id=A.getX(i)|0, w=A.getY(i); if(id&&w>0.45) REG[id].pts.push(new T.Vector3(P.getX(i),P.getY(i),P.getZ(i)),w); }
 REG.forEach(r=>{ const a=[]; for(let k=0;k<r.pts.length;k+=2) a.push({p:r.pts[k],w:r.pts[k+1]}); r.pts=a.filter((_,k)=>k%Math.max(1,Math.ceil(a.length/60)|0)===0); }); window.__oaseReg=REG; }
function regNear(pl,dim2,lim){ let best=null, bd=lim; REG.forEach(r=>{ if(!r.i) return; for(const s_ of r.pts){ const px=s_.p.x+r.x.x*s_.w, py=s_.p.y+r.x.y*s_.w, pz=s_.p.z+r.x.z*s_.w; const d=dim2?Math.hypot(pl.x-px,pl.z-pz):Math.hypot(pl.x-px,pl.y-py,pl.z-pz); if(d<bd){ bd=d; best={r,w:s_.w,d}; } } }); return best; }
function regPush(pl,dl,dim2){ if(pose!=='lie'||st.done) return; const h=regNear(pl,dim2,dim2?0.03:0.045); if(!h) return; const r=h.r; if(r.grab) return; const m=Math.min(dl.length(),0.05); if(m<1e-4) return; const dir=dl.clone().normalize();
 if(r.soft){ r.v.addScaledVector(dir,m*9); r.v.y-=m*4; } else { r.v.addScaledVector(dir,m*14); r.v.y=Math.max(r.v.y,0); } }   // weich: Anstoß · Glied: wird ein Stück mitgeschoben
function regGrab(pl,key){ if(pose!=='lie'||st.done) return null; const h=regNear(pl,false,0.06); if(!h||!h.r.limb) return null; h.r.grab={key,h0:pl.clone(),x0:h.r.x.clone(),w:Math.max(0.35,h.w),tgt:h.r.x.clone()}; return h.r; }
function regTick(d){ if(pose!=='lie'||st.done){ REG.forEach((r,i)=>{ r.x.set(0,0,0); r.v.set(0,0,0); r.grab=null; uOff.value[i].set(0,0,0); }); return; }
 const n=Math.max(1,Math.ceil(d/0.008)), h=d/n; for(let s_=0;s_<n;s_++) REG.forEach(r=>{ if(!r.i) return; const x=r.x, v=r.v;
  if(r.soft){ v.addScaledVector(x,-120*h).addScaledVector(v,-7*h); x.addScaledVector(v,h); const L=x.length(); if(L>0.012) x.multiplyScalar(0.012/L); }
  else if(r.grab){ const g=r.grab; v.addScaledVector(new T.Vector3().subVectors(g.tgt,x),110*h).addScaledVector(v,-13*h); x.addScaledVector(v,h); }   // Gewicht + Trägheit: folgt der Hand mit leichtem Verzug
  else { v.y-=5.5*h; v.x*=Math.exp(-(x.y<0.004?7:0.6)*h); v.z*=Math.exp(-(x.y<0.004?7:0.6)*h); v.x-=x.x*0.35*h; v.z-=x.z*0.35*h; x.addScaledVector(v,h); if(x.y<0){ x.y=0; v.y=v.y<-0.08?-v.y*0.28:0; } }   // schlaff: fällt auf die Liege, kleiner Abprall, Reibung; seitlich bleibt es fast liegen (liegt auf)
  if(r.limb){ const sg=(r.i%2===0)?1:-1; const inMin=r.i<8?-0.015:-0.03; if(sg*x.z<inMin) { x.z=inMin*sg; v.z=0; } x.x=Math.max(-0.06,Math.min(0.06,x.x)); x.z=Math.max(-0.08,Math.min(0.08,x.z)); x.y=Math.max(0,Math.min(r.i<8?0.12:0.10,x.y)); } });
 REG.forEach((r,i)=>uOff.value[i].copy(r.x)); }
function regGrabMove(r,pl){ const g=r.grab; if(!g) return; g.tgt.copy(g.x0).addScaledVector(new T.Vector3().subVectors(pl,g.h0),1/g.w); }
function regRelease(r){ if(r) r.grab=null; }
function bodyLocal(pw){ const b=figBody(fig.lie); return b?b.worldToLocal(pw.clone()):null; }
// ---------------------------------------------------------------- Ohrfeigen-Gag (nur ab 18): Hand verweilt 15–20 s (zufällig) in der Brust-Zone → Klatsch, roter Rand, Zeile, Stempel „Das kommt in Ihre Akte!“ auf einem Zettel am Wagen
const gag={t:0,need:15+Math.random()*5,n:0,slip:null};
function sfxSlap(){ if(MUTE) return; const a=new (window.AudioContext||window.webkitAudioContext)(), n=a.sampleRate*0.25|0, b=a.createBuffer(1,n,a.sampleRate), d=b.getChannelData(0);
 for(let i=0;i<n;i++){ const t=i/a.sampleRate; d[i]=(Math.random()*2-1)*Math.exp(-t*38)+0.6*Math.sin(2*Math.PI*180*t)*Math.exp(-t*30); }
 const s=a.createBufferSource(), f=a.createBiquadFilter(), g=a.createGain(); f.type='lowpass'; f.frequency.value=3200; g.gain.value=0.9; s.buffer=b; s.connect(f); f.connect(g); g.connect(a.destination); s.start(); }
function sfxStamp(){ if(MUTE) return; const a=new (window.AudioContext||window.webkitAudioContext)(), n=a.sampleRate*0.3|0, b=a.createBuffer(1,n,a.sampleRate), d=b.getChannelData(0);
 for(let i=0;i<n;i++){ const t=i/a.sampleRate; d[i]=0.9*Math.sin(2*Math.PI*(95-60*t)*t)*Math.exp(-t*16)+(t>0.012&&t<0.03?(Math.random()*2-1)*0.5:0)+(Math.random()*2-1)*0.25*Math.exp(-t*60); }
 const s=a.createBufferSource(), g=a.createGain(); g.gain.value=0.9; s.buffer=b; s.connect(g); g.connect(a.destination); s.start(); }
function redFlash(){ // Bildschirm: kurzer roter Rand (DOM). VR: rote Hohlkugel, die an der Kopfposition in der WELT steht (folgt dem Kopf nicht) und in 0,45 s verblasst
 if(R.xr.isPresenting){ const h=new T.Vector3(); cam.getWorldPosition(h); const m=new T.Mesh(new T.SphereGeometry(0.6,24,16),new T.MeshBasicMaterial({color:0xb01010,side:T.BackSide,transparent:true,opacity:0.32,depthTest:false,depthWrite:false,fog:false,toneMapped:false})); m.renderOrder=999; m.position.copy(h); S.add(m);
  const t0=performance.now(), f=()=>{ const k=(performance.now()-t0)/450; if(k>=1){ S.remove(m); m.geometry.dispose(); return; } m.material.opacity=0.32*(1-k); raf(f); }; f(); return; }
 const d=document.createElement('div'); d.style.cssText='position:fixed;inset:0;z-index:7;pointer-events:none;background:radial-gradient(ellipse at 50% 50%,rgba(160,0,0,0) 45%,rgba(170,10,10,.75) 100%);opacity:1;transition:opacity .45s ease-out'; document.body.appendChild(d);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{ d.style.opacity='0'; })); setTimeout(()=>d.remove(),600); }
function slipTex(){ return cv(512,256,(x,w,h)=>{ x.fillStyle='#eee3c8'; x.fillRect(0,0,w,h); for(let i=0;i<2500;i++){ x.fillStyle=`rgba(90,70,40,${rnd()*0.06})`; x.fillRect(rnd()*w,rnd()*h,2,2); }
  x.fillStyle='#3a3226'; x.font='600 20px "DejaVu Sans Mono",monospace'; x.fillText('SONNEN-OASE · KUNDENKARTEI',22,34); x.fillRect(22,42,468,2); x.font='18px "DejaVu Sans Mono",monospace'; x.fillText('Vorfall: Aushilfe, Hände am falschen Ort',22,72);
  x.save(); x.translate(256,160); x.rotate(-0.12); x.strokeStyle='rgba(176,30,36,0.88)'; x.lineWidth=6; x.strokeRect(-218,-46,436,92); x.fillStyle='rgba(176,30,36,0.9)'; x.font='700 40px "DejaVu Sans Condensed",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('Das kommt in Ihre Akte!',0,2);
  x.globalCompositeOperation='destination-out'; for(let i=0;i<600;i++){ x.fillStyle=`rgba(0,0,0,${0.3+rnd()*0.6})`; x.fillRect(-230+rnd()*460,-55+rnd()*110,1+rnd()*3,1+rnd()*2); } x.restore(); }); }
function slapGag(){ if(st.done) return; gag.n++; gag.t=0; gag.need=15+Math.random()*5; drag=null; lastPaint=null; ctl.forEach(c=>{ c.zone=false; c.last=null; });
 try{ document.getElementById('cam').setAttribute('look-controls','enabled',true); }catch(e){}
 sfxSlap(); redFlash(); const ses=R.xr.isPresenting&&R.xr.getSession&&R.xr.getSession(); if(ses) [...ses.inputSources].forEach(s=>{ const ha=s.gamepad&&s.gamepad.hapticActuators&&s.gamepad.hapticActuators[0]; ha&&ha.pulse&&ha.pulse(1.0,220); });
 setTimeout(()=>say('slap'),350);
 setTimeout(()=>{ sfxStamp(); if(!gag.slip){ const m=new T.Mesh(new T.PlaneGeometry(0.21,0.105),new T.MeshStandardMaterial({map:slipTex(),roughness:0.9})); m.rotation.x=-Math.PI/2; m.rotation.z=0.25; m.position.set(CART.x-0.12,0.792,CART.z-0.02); G.add(m); gag.slip=m; } else { gag.slip.rotation.z+=0.3; } window.__oaseGag=gag.n; },1700); }
function gagTick(d){ if(!ADULT()||st.done){ gag.t=0; return; } const z=(drag&&drag.zone)||ctl.some(c=>c.held&&c.zone); if(z) gag.t+=d; else gag.t=Math.max(0,gag.t-d*2); if(gag.t>=gag.need) slapGag(); }
// ---------------------------------------------------------------- Bewegung + Kollision (Kopf ≥ 0,15 m von Möbeln, ≥ 0,12 m von der Figur; Boden y=0)
const BOX=[[-1.36,0.64,TB.z-TB.w/2-0.02,TB.z+TB.w/2+0.02,0.15],[0.02,1.98,-2.17,-1.15,0.15],[CART.x-0.3,CART.x+0.3,CART.z-0.2,CART.z+0.2,0.15],[RW.x0,RW.x0+0.62,RW.z0,RW.z0+0.62,0.1],[1.48,1.82,0.78,1.12,0.12]];
function collide(moved){ if(window.__oaseFreeCam) return; if(R.xr.isPresenting&&!moved) return;   // o15: in VR nur Stick-Bewegung begrenzen – echtes Vorbeugen mit dem Kopf (Haut aus 10–15 cm ansehen) verschiebt NIE die Welt (vorher: Kopf in der Liegen-Box → Rig wurde weggeschoben → „sie weicht zurück“)
 const h=new T.Vector3(); cam.getWorldPosition(h); const o={x:h.x,z:h.z};
 o.x=Math.max(RW.x0+0.2,Math.min(RW.x1-0.2,o.x)); const inDoor=o.x>0.48&&o.x<1.32; o.z=Math.max(RW.z0+0.2,Math.min(inDoor?RW.z1+0.4:RW.z1-0.2,o.z));
 BOX.forEach(([a,b,c,d,m])=>{ const A=a-m,B=b+m,Cc=c-m,D=d+m; if(o.x>A&&o.x<B&&o.z>Cc&&o.z<D){ const dx=[o.x-A,B-o.x], dz=[o.z-Cc,D-o.z], mn=Math.min(...dx,...dz); if(mn===dx[0]) o.x=A; else if(mn===dx[1]) o.x=B; else if(mn===dz[0]) o.z=Cc; else o.z=D; } });
 rig.position.x+=o.x-h.x; rig.position.z+=o.z-h.z; rig.position.y=0; }
AFRAME.registerComponent('oase',{init(){ S=this.el.object3D; R=this.el.renderer; TL=new T.TextureLoader(); G=new T.Group(); S.add(G); cam=this.el.camera?null:null;
  const go=()=>{ cam=document.getElementById('cam').object3D; rig=document.getElementById('rig').object3D; if(!window.zsSnapTurn) window.zsSnapTurn=(rigO,s)=>{ const a=new T.Vector3(),b=new T.Vector3(); cam.getWorldPosition(a); rigO.rotation.y-=s*Math.PI/6; rigO.updateMatrixWorld(true); cam.getWorldPosition(b); rigO.position.x+=a.x-b.x; rigO.position.z+=a.z-b.z; };
   makeMask(); makeBrush(); buildRoom(); setupPointer(); setupXR();
   if(window.worldDust) try{ window.__oaseDust=worldDust(this.el,{count:70,color:0xffd0a0,color2:0x9aa8ff,rMin:0.4,rMax:2.6,yMax:2.4}); }catch(e){}
   try{ R.xr.setFramebufferScaleFactor(1.3); }catch(e){} /* o11: schärferes Bild auf Quest (statt PS1-Look) */
   let n=0; const fin=()=>{ if(++n<2) return; if(fig.lie) settle(fig.lie); { const an=R.capabilities.getMaxAnisotropy(); [fig.lie,fig.up].forEach(f=>f&&f.root.traverse(o=>{ if(o.isMesh) [].concat(o.material).forEach(m=>['map','normalMap','roughnessMap'].forEach(k=>{ if(m&&m[k]){ m[k].anisotropy=an; m[k].needsUpdate=true; } })); })); } if(fig.lie){ applyMode(fig.lie); buildTarget(fig.lie); G.add(fig.lie.root); } if(fig.up){ fig.up.root.visible=false; applyMode(fig.up); G.add(fig.up.root); } nipPrep(); contactShadow(); setTimeout(prepFollow,400); window.__oase.ready=true; };
   loadFig('lie',f=>{ fig.lie=f; fin(); }); loadFig('up',f=>{ fig.up=f; fin(); });
   const L=document.getElementById('hl'), Rr=document.getElementById('hr'); this.ax=[0,0]; this.snap=0;
   L&&L.addEventListener('thumbstickmoved',e=>{ this.ax=[e.detail.x,e.detail.y]; });
   Rr&&Rr.addEventListener('thumbstickmoved',e=>{ const x=e.detail.x; if(Math.abs(x)>0.7&&!this.snap){ this.snap=1; zsSnapTurn(rig,Math.sign(x),this.el); } if(Math.abs(x)<0.3) this.snap=0; });
   document.addEventListener('keydown',startAmb,{once:true}); this.mov=true; };
  this.el.hasLoaded?go():this.el.addEventListener('loaded',go); },
 tick(t,dt){ if(!this.mov) return; const d=Math.min(dt||16,50)/1000; const [x,y]=this.ax;
  const mv=Math.abs(x)>0.15||Math.abs(y)>0.15; if(mv){ const q=new T.Quaternion(); cam.getWorldQuaternion(q); const f=new T.Vector3(0,0,-1).applyQuaternion(q); f.y=0; f.normalize(); const r=new T.Vector3(-f.z,0,f.x); rig.position.addScaledVector(f,-y*d*1.6).addScaledVector(r,x*d*1.6); }
  collide(mv); xrTick(); dbgTick(); snapTick(); gaugeTick(d); idleTick(d); regTick(d); { const n=performance.now(); gagTick(Math.min(1,(n-(this.gT||n))/1000)); this.gT=n; } /* Gag-Uhr in echter Zeit (auch bei wenig FPS 15–20 s) */ uT.value=t/1000; if(performance.now()-pressAt>160) pressGoal=0; if(window.__oaseSoft){ const n=Math.max(1,Math.ceil(d/0.008)); for(let i=0;i<n;i++) jigTick(d/n); } else uPress.value.w+=(pressGoal-uPress.value.w)*Math.min(1,d*14); { const n=performance.now(); if(n-(this.pT||0)>180||st.cov>0.85){ this.pT=n; progress(); } }   // Fortschritt in echter Zeit prüfen (nicht an Frame-Zeitstempel gebunden)
  // Begrüßung, wenn man nah genug ist (einmal) – gesprochene Zeile, kein Tipp-Fenster
  if(!st.greet&&window.__oase.ready){ const h=new T.Vector3(); cam.getWorldPosition(h); if(Math.hypot(h.x-TB.x,h.z-TB.z)<1.5&&t>2500){ st.greet=true; startAmb(); say(ADULT()?'a0':'h0'); } }
  // Perlenvorhang schwingt, wenn der Kopf durchgeht; Rauch, Röhrenflimmern, Glanz-Glitzern
  if(beads){ const h=new T.Vector3(); cam.getWorldPosition(h); const M=new T.Matrix4(); const near=Math.abs(h.z-RW.z1)<0.5?1:0; this.sw=(this.sw||0)*0.97+near*0.03*Math.max(0,1-Math.abs(h.x-0.9)/0.7);
   if(this.sw>0.002||(t%1000<17)){ beadBase.forEach(([bx,by,bz,i],k)=>{ const dy=2.08-by, ph=Math.sin(t*0.004+i*0.7)*this.sw*dy*0.25+Math.sin(t*0.0011+i)*0.002*dy; M.makeTranslation(bx+ph*0.3,by,bz+ph); beads.setMatrixAt(k,M); }); beads.instanceMatrix.needsUpdate=true; } }
  if(window.__oaseSmoke){ window.__oaseSmoke.material.opacity=0.42+0.14*Math.sin(t*0.0013); window.__oaseSmoke.rotation.y=Math.sin(t*0.0005)*0.6; }
  if(window.__oaseTubes) window.__oaseTubes.emissiveIntensity=1.05+0.04*Math.sin(t*0.31)+(Math.random()<0.004?-0.4:0);
  if(window.__oaseNeon) window.__oaseNeon.color.setHex(Math.random()<0.003?0x704050:0xd07090); }});
window.__oaseSnap=()=>swapPose(); window.__oaseXrTick=xrTick; window.__oaseDBG=DBG; window.__oasePose=()=>pose; window.__oase={REG,regPush,regGrab,regGrabMove,regRelease,bodyLocal,jig,uJig,chestZ,gag,inChest,slapGag,uPress,st,coverage:()=>target?coverage():0,takeOil,rub,paintAt,punch,fig,TB,FIG,get pose(){return pose;},get drag(){return drag;},ctl,ADULT};
})();
