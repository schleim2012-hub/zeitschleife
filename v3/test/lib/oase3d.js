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
 S.add(new T.HemisphereLight(0x5a4038,0x1a0f0a,0.55));
 const Lw=new T.PointLight(0xffa460,4.6,5.5,1.6); Lw.position.set(TB.x,1.62,TB.z); S.add(Lw); window.__oaseLw=Lw;
 const Lb=new T.PointLight(0x6a78ff,3.2,4.2,1.7); Lb.position.set(1.0,0.9,-1.5); S.add(Lb); window.__oaseLb=Lb;
 const Lp=new T.PointLight(0xff4a90,0.9,3.2,1.8); Lp.position.set(RW.x0+0.35,2.0,-0.6); S.add(Lp);
 const Lf=new T.PointLight(0xffc8a0,0.6,3.5,1.8); Lf.position.set(0.9,1.9,1.4); S.add(Lf);
 buildBed(std); buildTable(std); buildCart(std); buildDeco(std); buildCurtain();
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
const uJig={value:new T.Vector4(0,0,0,0)}, jig={b:0,bv:0,bz:0,bzv:0,s:0,sv:0};   // passives Nachwippen: Brust (y,z) + weiches Gewebe (Bauch/Schenkel), gedämpfte Federn
let mask=null, maskTex=null, fig={}, figRoot=null, pose='lie', oilU={value:null}, oilAmt={value:0}, glint={value:0};
const GX=128, GZ=48; let target=null, got=null, nTarget=1;
function makeMask(){ mask=document.createElement('canvas'); mask.width=MW; mask.height=MH; const x=mask.getContext('2d'); x.fillStyle='#000'; x.fillRect(0,0,MW,MH); maskTex=new T.CanvasTexture(mask); maskTex.flipY=false; maskTex.colorSpace=T.NoColorSpace; maskTex.minFilter=T.LinearFilter; maskTex.generateMipmaps=false; oilU.value=maskTex; }
let brush=null; function makeBrush(){ brush=document.createElement('canvas'); brush.width=brush.height=64; const x=brush.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,0.55)'); g.addColorStop(0.6,'rgba(255,255,255,0.28)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64);
 x.globalCompositeOperation='destination-out'; for(let i=0;i<14;i++){ x.fillStyle=`rgba(0,0,0,${0.15+rnd()*0.25})`; x.fillRect(0,4+i*4.3+rnd()*2,64,1.2); } } // Streifen = Fingerspuren
function oilMat(src,skin){ // Haut-Material: Physical + Klarlack, Maske über Objekt-Draufsicht. skin.tx = Figur mit eigener Hauttextur (COLOR_0 = AO + ölbar), skin.soft = Attribut _SOFT (Weichheit, Brust-Gewicht)
 const m=new T.MeshPhysicalMaterial({vertexColors:!!skin.vc,color:skin.o9?0xffffff:skin.h8?0xf0dccb:skin.tx?0xc9a48c:skin.vc?0xe2b89c:(src&&src.color?src.color.getHex():0xd8a088),map:src&&src.map||null,normalMap:src&&src.normalMap||null,roughness:0.58,metalness:0,clearcoat:1,clearcoatRoughness:0.07,sheen:skin.o9?0.35:skin.tx?0.12:0.25,sheenRoughness:skin.o9?0.85:0.6,sheenColor:new T.Color(skin.o9?0xd0603a:skin.tx?0xc07850:0xffb090)});
 if(skin.o9){ m.roughness=0.62; if(m.normalMap) m.normalScale=new T.Vector2(0.18,0.18); }   // o9: Foto-Haut, Poren-Normalmap, warmer Streurand (Sheen) statt Plastik-Glanz
 m.onBeforeCompile=sh=>{ sh.uniforms.oilMap=oilU; sh.uniforms.oilGlint=glint;
  sh.uniforms.uT=uT; sh.uniforms.uPress=uPress; sh.uniforms.uJig=uJig;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOP; uniform float uT; uniform vec4 uPress; uniform vec4 uJig;'+(skin.soft?'\nattribute vec2 _soft;':'')).replace('#include <begin_vertex>',`#include <begin_vertex>
  vOP=position;
  { float wb=smoothstep(-0.66,-0.52,position.x)*(1.0-smoothstep(-0.18,-0.04,position.x)); transformed+=objectNormal*(0.0032*wb*(0.5+0.5*sin(uT*1.35)));   // Atmen (Brustkorb hebt/senkt sich, ~13/min)
    float dp=distance(position.xz,uPress.xy); ${skin.soft?`
    float sf=_soft.x, r=uPress.z*(0.8+0.5*sf), g=exp(-dp*dp/(r*r)), rim=exp(-pow((dp-1.35*r)/(0.45*r),2.0));
    transformed-=objectNormal*uPress.w*max(objectNormal.y,0.0)*(g-0.22*rim)*(0.35+1.1*sf);   // weiche Delle + Gewebe-Wulst am Rand, federt zurück
    transformed.y+=_soft.y*uJig.x*(0.6+0.4*smoothstep(0.0,0.05,position.y-0.12)) + sf*(1.0-_soft.y)*uJig.z*0.35;   // Nachwippen (Brust / Bauch, Schenkel)
    transformed.z+=_soft.y*uJig.y*sign(position.z);`:`transformed-=objectNormal*uPress.w*max(objectNormal.y,0.0)*(1.0-smoothstep(0.0,uPress.z,dp));`} }   // Haut gibt unter der Hand nach`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 vOP; uniform sampler2D oilMap; uniform float oilGlint; float oilK=0.0;
float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }`)
  .replace('#include <color_fragment>',`#include <color_fragment>
  { vec2 ou=vec2((vOP.x-(${X0.toFixed(3)}))/${(X1-X0).toFixed(3)}, (vOP.z-(${Z0.toFixed(3)}))/${(Z1-Z0).toFixed(3)});
    float o=texture2D(oilMap,ou).r; ${skin.vc?'o*=vColor.a; diffuseColor.a=1.0;':''} oilK=smoothstep(0.08,0.75,o);
    diffuseColor.rgb=mix(diffuseColor.rgb,pow(diffuseColor.rgb,vec3(1.18))*1.05,oilK); }`)  // nasse Haut: satter, etwas dunkler
  .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,'+(skin.o9?'0.34':'0.16')+',oilK);')
  .replace('#include <clearcoat_normal_fragment_begin>','#include <clearcoat_normal_fragment_begin>')
  .replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
  #ifdef USE_CLEARCOAT
   material.clearcoat=oilK*${skin.o9?'0.45':'0.9'}; material.clearcoatRoughness=mix(${skin.o9?'0.35,0.22':'0.12,0.05'},oilK);
  #endif
`);
 }; m.customProgramCacheKey=()=>'oase-oil-'+(skin.vc?1:0)+(skin.tx?'t':'')+(skin.soft?'s':'')+(skin.o9?'9':''); return m; }
function loadFig(which,cb){ const url=(ADULT()&&C.fig[which+'Adult'])?C.fig[which+'Adult']:C.fig[which]; // Ab-18-Datei nur bei ZS_ADULT === true
 new T.GLTFLoader().load(url,gl=>{ const r=gl.scene, parts={body:[],hair:[],towel:[],robe:[],strap:[],chest:[],top:[],glasses:[],deco:[]}; let named=false;
  r.traverse(o=>{ if(!o.isMesh) return; const n=(o.name||'').toLowerCase().replace(/_\d+$/,''); const k=Object.keys(parts).find(k=>n===k||n.startsWith(k)); if(k){ named=true; parts[k].push(o); } else parts.body.push(o); });
  if(parts.body.some(o=>/^skin_h[89]/.test((o.material&&o.material.name)||''))) { parts.towel.forEach(o=>{ if(o.geometry.attributes.uv) o.userData.keepUV=true; }); parts.robe.forEach(o=>{ if(o.geometry.attributes.uv) o.userData.keepUV=true; o.userData.k8=true; }); }   // o8: Handtuch/Bademantel-Decke mit eigener Bogenlängen-UV
  parts.body.forEach(o=>{ const g=o.geometry, vc=!!g.attributes.color, tx=!!(o.material&&o.material.map&&g.attributes.uv); o.userData.keepUV=tx; const h8=!!(o.material&&/^skin_h[89]/.test(o.material.name||'')), o9=!!(o.material&&/^skin_h9/.test(o.material.name||'')); o.material=oilMat(o.material,{vc,tx,h8,o9,soft:!!g.attributes._soft}); if(g.attributes._soft) window.__oaseSoft=true; });
  const terry=(b,s)=>new T.MeshStandardMaterial({map:terryTex(b,s),vertexColors:true,roughness:1});
  const hT=hairTex(); parts.hair.forEach(o=>{ const hm=o.material&&o.material.map; if(hm&&o.geometry.attributes.uv){ o.userData.keepUV=true; o.material=new T.MeshPhysicalMaterial({vertexColors:!!o.geometry.attributes.color,map:hm,alphaTest:0.42,side:T.DoubleSide,roughness:0.5,sheen:0.7,sheenColor:new T.Color(0xf0c880),sheenRoughness:0.35}); }   // o8: Haar-Karten mit eigener Textur (MakeHuman long01, blondiert)
   else o.material=new T.MeshPhysicalMaterial({vertexColors:true,map:hT.c,bumpMap:hT.b,bumpScale:0.6,roughness:0.55,sheen:0.6,sheenColor:new T.Color(0xe0b070),sheenRoughness:0.4}); });
  parts.deco.forEach(o=>{ o.userData.keepUV=true; const m=o.material; if(m){ m.transparent=false; m.alphaTest=0.4; m.depthWrite=true; m.side=T.DoubleSide; } o.raycast=()=>{}; });   // o8: Augen, Brauen, Wimpern – eigenes Material, nicht ölbar
  [...parts.towel,...parts.chest].forEach(o=>{ o.material=terry('#f4ece0','#d98aa0'); if(ADULT()){ const t=terryTex('#e2d6c4','#c4868e'); o.material=new T.MeshStandardMaterial({map:t,bumpMap:t,bumpScale:0.8,vertexColors:true,roughness:1,color:0xe8dccc}); } });   // ab 18: gedämpfteres, weiches Frottee (nicht leuchtend weiß) parts.robe.forEach(o=>o.material=terry('#f2b8c8',null));
  parts.robe.forEach(o=>{ if(o.userData.k8) o.material=terry('#f2b8c8','#e7a0b4'); });   // o8 jugendfrei: rosa Frottee-Decke über dem Badeanzug
  parts.glasses.forEach(o=>o.material=new T.MeshPhysicalMaterial({color:0x22150e,roughness:0.12,metalness:0.1,clearcoat:1,clearcoatRoughness:0.06}));   // 80er-Sonnenbrille (o7)
  [...parts.strap,...parts.top].forEach(o=>o.material=new T.MeshStandardMaterial({vertexColors:true,color:0xffffff,roughness:0.45}));
  r.traverse(o=>{ if(o.isMesh&&!o.userData.keepUV){ const p=o.geometry.attributes.position, uv=new Float32Array(p.count*2); for(let i=0;i<p.count;i++){ uv[2*i]=(p.getX(i)-X0)/(X1-X0)*3; uv[2*i+1]=(p.getZ(i)-Z0)/(Z1-Z0)*1.2; } o.geometry.setAttribute('uv',new T.BufferAttribute(uv,2)); } });
  r.position.set(FIG.x,FIG.y,FIG.z); cb({root:r,parts,named}); },undefined,e=>{ console.warn('[oase] Figur fehlt',url); cb(null); }); }
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
let radio=null, hum=null; function startAmb(){ if(radio) return; radio=new Audio(C.base+'radio_panfloete.mp3'); radio.loop=true; radio.volume=MUTE?0:0.32; hum=new Audio(C.base+'sonnenbank_brumm.mp3'); hum.loop=true; hum.volume=MUTE?0:0.16; radio.play().catch(()=>{ radio=null; }); hum.play().catch(()=>{}); }
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
  if(k<1) requestAnimationFrame(anim); else { par.attach(bottle); bottle.position.copy(par.worldToLocal(bottleHome.clone())); bottle.rotation.set(0,0,0); } }; anim();
 drip(); }
function drip(){ const a=new (window.AudioContext||window.webkitAudioContext)(); if(MUTE) return; [0.9,1.25,1.6].forEach(d=>{ const o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.setValueAtTime(900,a.currentTime+d); o.frequency.exponentialRampToValueAtTime(260,a.currentTime+d+0.09); g.gain.setValueAtTime(0.0001,a.currentTime+d); g.gain.linearRampToValueAtTime(0.12,a.currentTime+d+0.01); g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+d+0.14); o.connect(g); g.connect(a.destination); o.start(a.currentTime+d); o.stop(a.currentTime+d+0.2); }); }
function rub(lx,lz,len){ if(st.done) return; if(inChest(lx,lz)) return; uPress.value.x=lx; uPress.value.y=lz; pressGoal=window.__oaseSoft?0.0085:0.006; pressAt=performance.now(); jigKick(lx,lz,len); if(!st.oiled){ const n=performance.now(); if(n-st.lastNoOil>9000&&n-st.spoke>4500){ st.lastNoOil=n; say('oel'); } return; }
 startAmb(); paintAt(lx,lz,0.35+Math.min(0.5,len*6)); st.dist+=len; }
function jigKick(lx,lz,len){ if(!window.__oaseSoft) return; const v=Math.min(len||0.01,0.05);   // Streichen in Brustnähe/über weichem Gewebe bringt sie leicht ins Schwingen
 const db=Math.hypot(Math.max(0,Math.abs(lx+0.447)-0.08),Math.max(0,Math.abs(Math.abs(lz)-0.104)-0.09)); const nb=Math.max(0,1-db/0.12);
 jig.bv+=(Math.random()<0.5?-1:1)*v*0.9*(0.25+nb); jig.bzv+=(Math.random()-0.5)*v*0.6*(0.2+nb); jig.sv+=(Math.random()<0.5?-1:1)*v*0.7; }
function jigTick(d){ if(!window.__oaseSoft) return; const sp=(k,c,x,v,ext)=>{ v+=(-k*x-c*v+ext)*d; return [x+v*d,v]; };
 const br=-Math.cos(uT.value*1.35)*1.35*1.35*0.0011;   // Atmen schiebt mit
 [jig.b,jig.bv]=sp(150,5.5,jig.b,jig.bv,br); [jig.bz,jig.bzv]=sp(120,5.0,jig.bz,jig.bzv,0); [jig.s,jig.sv]=sp(220,9,jig.s,jig.sv,0);
 const cl=(x,m)=>Math.max(-m,Math.min(m,x)); jig.b=cl(jig.b,0.006); jig.bz=cl(jig.bz,0.004); jig.s=cl(jig.s,0.004);
 uJig.value.set(jig.b,jig.bz,jig.s,0);
 // Delle: gedämpfte Feder (leichtes Überschwingen beim Loslassen = Haut federt zurück)
 pressV+=((pressGoal-uPress.value.w)*320-pressV*20)*d; uPress.value.w=Math.max(-0.0015,uPress.value.w+pressV*d); }
function progress(){ if(st.done||!target) return; const c=coverage(); st.cov=c; oilAmt.value=c; const ad=ADULT(), p=ad?'a':'h'; const now=performance.now();
 [[0.12,1],[0.42,2],[0.68,3]].forEach(([th,i])=>{ if(c>=th&&!st.said[i]&&now-st.spoke>4800){ st.said[i]=1; say(p+i); } });
 if(c>=0.9&&now-st.spoke>3600) punch(); }
function punch(){ if(st.done) return; st.done=true; gag.t=0; const ad=ADULT();
 // Ende: 1) glänzt überall · 2) zufriedener Seufzer/Zeile (Frauenstimme) · 3) Pose: stützt sich auf, schaut zum Spieler · 4) ~1 s Stille · 5) „Danke, Kleiner.“ als allerletzte Zeile
 st.endOk=true; const a=say(ad?'a3':'h3'); let go=false; const next=()=>{ if(go) return; go=true; setTimeout(sit,600); };
 if(a){ a.addEventListener('ended',next); a.addEventListener('error',next); } setTimeout(next,4500);
 function sit(){ if(radio){ const r=radio; radio=null; r.pause(); aud('../../sfx/radio_static.mp3',0.25); }
  const Lw=window.__oaseLw, i0=Lw.intensity, sh=window.__oaseShade; let n=0;
  const fl=()=>{ n++; Lw.intensity=n%2?0.15:i0*0.7; if(sh) sh.emissiveIntensity=n%2?0.05:0.4; if(n===3) swapPose(); if(n<5) setTimeout(fl,70+Math.random()*90); else { Lw.intensity=i0; if(sh) sh.emissiveIntensity=0.55; setTimeout(()=>{ st.endOk=true; say('punch','Kundin'); reward(); },1000); } };
  setTimeout(fl,300); } }
function swapPose(){ if(!fig.up) return; fig.lie.root.visible=false; fig.up.root.visible=true; applyMode(fig.up); pose='up'; jig.bv+=0.09; jig.sv+=0.05; }
function reward(){ setTimeout(()=>{ if(!window.zsaNote) return; const n=zsaNote('Gutschein: Einmal Ölmassage gratis. Für den Kleinen. – Gerd',0.16,0.1); n.position.set(CART.x+0.02,0.795,CART.z+0.12); n.rotation.x=-Math.PI/2; n.rotation.z=0.3; G.add(n); try{ localStorage.setItem('zs_oase_done','1'); }catch(e){} },2500); }
// ---------------------------------------------------------------- Eingabe: Maus/Touch (Pointer) + VR-Controller
const rc=new T.Raycaster(), tmpV=new T.Vector3(), tmpV2=new T.Vector3();
// Controller-Pose in Weltkoordinaten (wie zsaCtrlPos in alpha.js – hier eigenständig, Seite läuft auch ohne Spiel-Ablauf)
function ctrlPos(c,out){ if(!c.parent||c.parent===S){ out.copy(c.position); if(rig) rig.localToWorld(out); } else c.getWorldPosition(out); return out; }
function ctrlRay(c){ const o=ctrlPos(c,new T.Vector3()), q=new T.Quaternion(); if(!c.parent||c.parent===S){ q.copy(c.quaternion); if(rig){ const rq=new T.Quaternion(); rig.getWorldQuaternion(rq); q.premultiply(rq); } } else c.getWorldQuaternion(q); return new T.Ray(o,new T.Vector3(0,0,-1).applyQuaternion(q)); }
function bodyMeshes(){ const f=pose==='up'?fig.up:fig.lie; if(!f) return []; return f.parts.body.concat(f.parts.hair,f.parts.towel.filter(o=>o.visible),f.parts.robe.filter(o=>o.visible)); }
function hitBody(ray){ rc.ray.copy(ray); rc.far=3; const h=rc.intersectObjects(bodyMeshes(),false)[0]; if(!h) return null; const f=pose==='up'?fig.up:fig.lie; if(f.parts.body.indexOf(h.object)<0) return {cover:true}; const l=h.object.worldToLocal(h.point.clone()); return {lx:l.x,lz:l.z,p:h.point}; }
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
const ctl=[{held:false,last:null},{held:false,last:null}];
function setupXR(){ [0,1].forEach(i=>{ const c=R.xr.getController(i); const dn=()=>{ ctl[i].held=true; startAmb(); const p=ctrlPos(c,tmpV); if(p.distanceTo(bottleHome)<0.22||(!st.oiled&&hitBottle(ctrlRay(c)))) takeOil(); }, upf=()=>{ ctl[i].held=false; ctl[i].zone=false; ctl[i].last=null; lastPaint=null; };
  c.addEventListener('selectstart',dn); c.addEventListener('squeezestart',dn); c.addEventListener('selectend',upf); c.addEventListener('squeezeend',upf); }); }
function xrTick(){ if(!R.xr.isPresenting) return; const sc=document.querySelector('a-scene'); const ses=R.xr.getSession&&R.xr.getSession();
 [0,1].forEach(i=>{ if(!ctl[i].held) return; const c=R.xr.getController(i); const p=ctrlPos(c,tmpV).clone();
  // Strahl von knapp über dem Controller senkrecht nach unten: trifft die Haut innerhalb von 7 cm → einreiben
  const h=hitBody(new T.Ray(p.clone().add(new T.Vector3(0,0.12,0)),new T.Vector3(0,-1,0))); if(!h||h.cover||Math.abs(h.p.y-p.y)>0.07){ ctl[i].last=null; ctl[i].zone=false; return; } ctl[i].zone=inChest(h.lx,h.lz);
  const len=ctl[i].last?h.p.distanceTo(ctl[i].last):0; ctl[i].last=h.p.clone(); if(len>0.003){ rub(h.lx,h.lz,len); if(st.oiled&&ses){ const src=[...ses.inputSources].find(s=>s.handedness===(i?'right':'left'))||ses.inputSources[i]; const ha=src&&src.gamepad&&src.gamepad.hapticActuators&&src.gamepad.hapticActuators[0]; ha&&ha.pulse&&ha.pulse(0.18,18); } } }); }
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
  const t0=performance.now(), f=()=>{ const k=(performance.now()-t0)/450; if(k>=1){ S.remove(m); m.geometry.dispose(); return; } m.material.opacity=0.32*(1-k); requestAnimationFrame(f); }; f(); return; }
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
function collide(){ const h=new T.Vector3(); cam.getWorldPosition(h); const o={x:h.x,z:h.z};
 o.x=Math.max(RW.x0+0.2,Math.min(RW.x1-0.2,o.x)); const inDoor=o.x>0.48&&o.x<1.32; o.z=Math.max(RW.z0+0.2,Math.min(inDoor?RW.z1+0.4:RW.z1-0.2,o.z));
 BOX.forEach(([a,b,c,d,m])=>{ const A=a-m,B=b+m,Cc=c-m,D=d+m; if(o.x>A&&o.x<B&&o.z>Cc&&o.z<D){ const dx=[o.x-A,B-o.x], dz=[o.z-Cc,D-o.z], mn=Math.min(...dx,...dz); if(mn===dx[0]) o.x=A; else if(mn===dx[1]) o.x=B; else if(mn===dz[0]) o.z=Cc; else o.z=D; } });
 rig.position.x+=o.x-h.x; rig.position.z+=o.z-h.z; rig.position.y=0; }
AFRAME.registerComponent('oase',{init(){ S=this.el.object3D; R=this.el.renderer; TL=new T.TextureLoader(); G=new T.Group(); S.add(G); cam=this.el.camera?null:null;
  const go=()=>{ cam=document.getElementById('cam').object3D; rig=document.getElementById('rig').object3D; if(!window.zsSnapTurn) window.zsSnapTurn=(rigO,s)=>{ const a=new T.Vector3(),b=new T.Vector3(); cam.getWorldPosition(a); rigO.rotation.y-=s*Math.PI/6; rigO.updateMatrixWorld(true); cam.getWorldPosition(b); rigO.position.x+=a.x-b.x; rigO.position.z+=a.z-b.z; };
   makeMask(); makeBrush(); buildRoom(); setupPointer(); setupXR();
   if(window.worldDust) try{ window.__oaseDust=worldDust(this.el,{count:70,color:0xffd0a0,color2:0x9aa8ff,rMin:0.4,rMax:2.6,yMax:2.4}); }catch(e){}
   let n=0; const fin=()=>{ if(++n<2) return; if(fig.lie){ applyMode(fig.lie); buildTarget(fig.lie); G.add(fig.lie.root); } if(fig.up){ fig.up.root.visible=false; applyMode(fig.up); G.add(fig.up.root); } window.__oase.ready=true; };
   loadFig('lie',f=>{ fig.lie=f; fin(); }); loadFig('up',f=>{ fig.up=f; fin(); });
   const L=document.getElementById('hl'), Rr=document.getElementById('hr'); this.ax=[0,0]; this.snap=0;
   L&&L.addEventListener('thumbstickmoved',e=>{ this.ax=[e.detail.x,e.detail.y]; });
   Rr&&Rr.addEventListener('thumbstickmoved',e=>{ const x=e.detail.x; if(Math.abs(x)>0.7&&!this.snap){ this.snap=1; zsSnapTurn(rig,Math.sign(x),this.el); } if(Math.abs(x)<0.3) this.snap=0; });
   document.addEventListener('keydown',startAmb,{once:true}); this.mov=true; };
  this.el.hasLoaded?go():this.el.addEventListener('loaded',go); },
 tick(t,dt){ if(!this.mov) return; const d=Math.min(dt||16,50)/1000; const [x,y]=this.ax;
  if(Math.abs(x)>0.15||Math.abs(y)>0.15){ const q=new T.Quaternion(); cam.getWorldQuaternion(q); const f=new T.Vector3(0,0,-1).applyQuaternion(q); f.y=0; f.normalize(); const r=new T.Vector3(-f.z,0,f.x); rig.position.addScaledVector(f,-y*d*1.6).addScaledVector(r,x*d*1.6); }
  collide(); xrTick(); { const n=performance.now(); gagTick(Math.min(1,(n-(this.gT||n))/1000)); this.gT=n; } /* Gag-Uhr in echter Zeit (auch bei wenig FPS 15–20 s) */ uT.value=t/1000; if(performance.now()-pressAt>160) pressGoal=0; if(window.__oaseSoft){ const n=Math.max(1,Math.ceil(d/0.008)); for(let i=0;i<n;i++) jigTick(d/n); } else uPress.value.w+=(pressGoal-uPress.value.w)*Math.min(1,d*14); { const n=performance.now(); if(n-(this.pT||0)>180||st.cov>0.85){ this.pT=n; progress(); } }   // Fortschritt in echter Zeit prüfen (nicht an Frame-Zeitstempel gebunden)
  // Begrüßung, wenn man nah genug ist (einmal) – gesprochene Zeile, kein Tipp-Fenster
  if(!st.greet&&window.__oase.ready){ const h=new T.Vector3(); cam.getWorldPosition(h); if(Math.hypot(h.x-TB.x,h.z-TB.z)<1.5&&t>2500){ st.greet=true; startAmb(); say(ADULT()?'a0':'h0'); } }
  // Perlenvorhang schwingt, wenn der Kopf durchgeht; Rauch, Röhrenflimmern, Glanz-Glitzern
  if(beads){ const h=new T.Vector3(); cam.getWorldPosition(h); const M=new T.Matrix4(); const near=Math.abs(h.z-RW.z1)<0.5?1:0; this.sw=(this.sw||0)*0.97+near*0.03*Math.max(0,1-Math.abs(h.x-0.9)/0.7);
   if(this.sw>0.002||(t%1000<17)){ beadBase.forEach(([bx,by,bz,i],k)=>{ const dy=2.08-by, ph=Math.sin(t*0.004+i*0.7)*this.sw*dy*0.25+Math.sin(t*0.0011+i)*0.002*dy; M.makeTranslation(bx+ph*0.3,by,bz+ph); beads.setMatrixAt(k,M); }); beads.instanceMatrix.needsUpdate=true; } }
  if(window.__oaseSmoke){ window.__oaseSmoke.material.opacity=0.42+0.14*Math.sin(t*0.0013); window.__oaseSmoke.rotation.y=Math.sin(t*0.0005)*0.6; }
  if(window.__oaseTubes) window.__oaseTubes.emissiveIntensity=1.05+0.04*Math.sin(t*0.31)+(Math.random()<0.004?-0.4:0);
  if(window.__oaseNeon) window.__oaseNeon.color.setHex(Math.random()<0.003?0x704050:0xd07090); }});
window.__oase={jig,uJig,chestZ,gag,inChest,slapGag,uPress,st,coverage:()=>target?coverage():0,takeOil,rub,paintAt,punch,fig,TB,FIG,get pose(){return pose;},get drag(){return drag;},ctl,ADULT};
})();
