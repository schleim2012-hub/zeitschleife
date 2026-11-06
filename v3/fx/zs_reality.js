/* ZSR – "Realität entsteht" = Mara erinnert sich. Welt aus türkisen Volumenblöcken auf der Geometrie.
   v30: Peak (1.5–2.1s) wie t280 – echte Wärme schon IN den ungesnappten Würfeln; durchscheinend
     geschichtet (warm Core / cyan Rim). Türkis bleibt Blocksprache, kein fertiger Raum-Reveal, kein
     Paket-Warmlicht. Snap-Rampe + Handoff von v29 bleiben. Frühe Snap-Kacheln etwas klarere Tapete.
   v29: Dunkler Handoff weg. Pro-Zelle-Snap von v28 bleibt. Nach Snap: sofort lesbare Tapete/Raumfarbe
     (Albedo-Floor, auch bei noch dunklem Raumlicht) – kein cooles Void-Tile. Vor Snap: mehr echte Wärme
     IN den Blöcken (t280-Schichtung, Türkis bleibt Sprache). Licht wächst weiter mit Snap-Anteil, Floor
     leicht angehoben damit Tapete lesbar ist – kein Paket-Warmlicht.
   v28: KEIN Paket-Reveal. Jede Zelle snappt EINZELN; Snap-Fenster Wände 1.65–4.3s / Figuren gestaffelt /
     Kleinkram bis ~5.4s. Szenenlichter folgen Snap-Anteil.
   v27: GROWTH statt Reveal. Albedo erst nach Snap. InstancedMesh schrumpft in den Snap.
   v26-Wins: Boden Frame 1; harte Rang-Fenster; Restlöcher; zsrNoHole Boden/Tür/Rätsel; Kopf-Ausschluss;
     eine Volumenblock-Sprache.
   v30r: Räume – opt-in floorAny (alles auf y≈0 = Boden Frame 1), avoid:[[x,y,z,r]] (keine Restlöcher an Tür/Schlüssel),
     autoRank(root) für Räume ohne wr_-Namen, photoShell(mesh) für Photosphären. Warteraum-Aufruf unverändert = v30-Look.
   API:
     ZSR.assemble(root,{duration,origin,cell,radial,rest,blocks,skip,lights,rank:fn,onRank:fn,floorAny,avoid})
     ZSR.dissolve · ZSR.patch · ZSR.off · ZSR.state · ZSR.rankOf(mesh|mat)
   Debug: ?noreal=1 · ?realdur=4 · ?realrest=0 */
(function(){
const Q=location.search, qn=(k,d)=>{ const m=Q.match(new RegExp('[?&]'+k+'=([\\d.]+)')); return m?+m[1]:d; };
const OFF=/[?&]noreal=1/.test(Q);
const now=()=>window.__zsrNow!=null?window.__zsrNow:performance.now()/1000;
/* Erinnerungsrang 1–4 */
const RANK_MAT={wr_floor:1,
 wr_wall:2,wr_ceil:2,wr_corr:2,wr_wood:2,
 wr_sofa:3,wr_vinyl:3,wr_metal:3,wr_fabric:3,wr_glass:3,
 wr_fig:3,wr_flip:3,
 wr_pinup:4,wr_paint:4,wr_signs:4,wr_noexit:4,wr_paper:4,wr_crackle:4,wr_emit:4,wr_shade:4,wr_redglass:4};
/* Figuren/Props innerhalb Rang 3 staffeln – unvollständig nacheinander, nicht gleichzeitig fertig */
const DELAY_MAT={wr_fig_frl:0.00,wr_flip:0.00,wr_metal:0.05,wr_glass:0.05,
 wr_fig_assi:0.28,wr_vinyl:0.35,wr_fabric:0.40,
 wr_fig_oma:0.48,wr_sofa:0.55};
function delayOf(o){ if(!o) return 0;
 if(o.userData&&o.userData.zsrDelay!=null) return +o.userData.zsrDelay;
 if(o.isMaterial){ const n=o.name||''; if(DELAY_MAT[n]!=null) return DELAY_MAT[n];
  if(/^wr_fig_/.test(n)){ /* unbekannte Figuren: stabiler Hash-Delay 0.12..0.5 */ let h=0; for(let i=0;i<n.length;i++) h=(h*33+n.charCodeAt(i))|0; return 0.12+0.38*((h>>>0)%1000)/1000; }
  return 0; }
 const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
 for(const m of ms){ if(!m) continue; if(m.userData&&m.userData.zsrDelay!=null) return +m.userData.zsrDelay; const d=delayOf(m); if(d) return d; }
 const n=(o.name||'').toLowerCase();
 if(/frl|flip|bell|klingel/.test(n)) return 0.00;
 if(/assi|saw|bein|leg/.test(n)) return 0.28;
 if(/oma/.test(n)) return 0.48;
 if(/sofa/.test(n)) return 0.55;
 if(/fig/.test(n)) return 0.22;
 return 0; }
function rankOf(o){ if(!o) return 2; if(o.userData&&o.userData.zsrMem) return o.userData.zsrMem|0;
 if(o.isMaterial){ const n=o.name||''; if(RANK_MAT[n]) return RANK_MAT[n]; if(/^wr_fig/.test(n)) return 3; return 2; }
 let r=0; if(o.userData&&o.userData.zsrMem) r=o.userData.zsrMem|0;
 const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
 for(const m of ms){ if(!m) continue; if(m.userData&&m.userData.zsrMem) r=r||(m.userData.zsrMem|0); else { const n=m.name||''; r=r||RANK_MAT[n]||(/^wr_fig/.test(n)?3:0); } }
 if(!r){ const n=(o.name||''); if(/floor|boden/i.test(n)) r=1; else if(/wall|wand|ceil|tresen|wood|corr/i.test(n)) r=2; else if(/fig|flip|bell|klingel|sofa|vinyl|fabric|metal|glass/i.test(n)) r=3; else if(/pinup|poster|sign|paper|shade|emit|dust|smoke|paint/i.test(n)) r=4; else r=2; }
 return Math.max(1,Math.min(4,r)); }
const fr=Math.fround;
function h3(x,y,z){ let a=fr(x*0.1031), b=fr(y*0.1031), c=fr(z*0.1031); a=fr(a-Math.floor(a)); b=fr(b-Math.floor(b)); c=fr(c-Math.floor(c));
 const d=fr(fr(fr(a*fr(c+33.33))+fr(b*fr(b+33.33)))+fr(c*fr(a+33.33))); a=fr(a+d); b=fr(b+d); c=fr(c+d); const r=fr(fr(a+b)*c); return r-Math.floor(r); }
const GLSL_H=`float zsH(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.zyx+33.33); return fract((p.x+p.y)*p.z); }`;
/* Harte Rang-Fenster in Sekunden (bei duration=4). Dissolve = rückwärts über thr. */
const MEM_T0=[0,0.00,0.50,1.50,2.50];
const MEM_T1=[0,0.50,1.50,2.50,4.00];
/* v28: Snap-Fenster pro Rang – jede Zelle bekommt ihren eigenen Zeitpunkt darin (kein Paket) */
const SNAP0=[0,-1,1.65,1.90,2.85], SNAP1=[0,-1,4.30,3.50,5.40], DSC=[0,0,1.0,2.6,0.8];
function snapOf(mem,delay,tAppear,h1,hMed,dn){ if(mem<=1) return -1; const s0=SNAP0[mem]+delay*DSC[mem], s1=SNAP1[mem]+delay*DSC[mem];
 const s=Math.min(1,Math.max(0,0.62*h1+0.28*hMed+0.10*dn)); return Math.max(tAppear+0.45,s0+s*(s1-s0)); }
const T_END=SNAP1[4]+0.8*0.55+0.6;
let Z=null;
function uni(){ if(Z) return Z; const T=THREE; Z={zT:{value:now()},zS:{value:-1e4},zDur:{value:4},zX:{value:1e9},zXd:{value:1.2},zOrg:{value:new T.Vector3()},zMaxD:{value:6},zCell:{value:0.16},zRad:{value:0.6},
 zRest:{value:0},zHole:{value:new T.Vector4(0,-99,0,0.3)},zHoleK:{value:0},zScan:{value:new T.Vector3(-99,0,0)},zOn:{value:OFF?0:1},
 zH0:{value:new T.Vector4(0,-99,0,0)},zH1:{value:new T.Vector4(0,-99,0,0)},zH2:{value:new T.Vector4(0,-99,0,0)},zH3:{value:new T.Vector4(0,-99,0,0)},zHoleN:{value:0},zFloorAny:{value:0}}; return Z; }
function cellOf(x,y,z,o,cell){ const d=Math.hypot(x-o.x,y-o.y,z-o.z); const lv=Math.floor(Math.log2(Math.max(1,d/3))); const cs=cell*Math.pow(2,lv);
 const cx=Math.floor(x/cs), cy=Math.floor(y/cs), cz=Math.floor(z/cs); return {cs,cx,cy,cz}; }
function thrOf(c,o,maxD,rad){ const cs=c.cs, mx=(c.cx+0.5)*cs, my=(c.cy+0.5)*cs, mz=(c.cz+0.5)*cs;
 const h1=h3(c.cx,c.cy,c.cz), h2=h3(Math.floor(mx/(cs*4))+17,Math.floor(my/(cs*4))+17,Math.floor(mz/(cs*4))+17);
 /* fein für Erscheinen */
 return 0.06+0.78*(0.55*h2+0.45*h1); }
const FRAG=`
uniform float zT,zS,zDur,zX,zXd,zMaxD,zCell,zRad,zRest,zHoleK,zOn,zMem,zHoleN,zDelay,zFloorAny,zPhoto;
uniform vec3 zOrg; uniform vec4 zHole; uniform vec3 zScan; uniform vec4 zH0,zH1,zH2,zH3;
varying vec3 vZsW;
${GLSL_H}
void main(){ zs_main(); if(zOn<0.5) return;
 vec3 w=vZsW; float d=length(w-zOrg); float lv=floor(log2(max(1.0,d/3.0))); float cs=zCell*exp2(lv);
 vec3 cc=floor(w/cs), f=fract(w/cs), mc=(cc+0.5)*cs; float dc=length(mc-zOrg);
 float h1=zsH(cc), h2=zsH(floor(mc/(cs*4.0))+17.0), hc=zsH(cc+71.0);
 float hCoarse=zsH(floor(cc/3.0)+9.0); /* Nachbar-Klumpen snappen zusammen */
 float mem=clamp(zMem,1.0,4.0);
 float floorBias=1.0-smoothstep(0.02,0.14,abs(w.y));
 float t0=0.0, t1=0.5;
 if(mem>3.5){ t0=2.5; t1=4.0; } else if(mem>2.5){ t0=1.5; t1=2.5; } else if(mem>1.5){ t0=0.5; t1=1.5; }
 t0+=zDelay; t1+=zDelay;
 float tAbs=max(0.0,zT-zS);
 float px=1.0-clamp((zT-zX)/zXd,0.0,1.0);
 float thrAppear=0.06+0.78*(0.55*h2+0.45*h1);
 thrAppear+=0.10*smoothstep(0.50,1.0,dc/max(0.001,zMaxD));
 thrAppear=clamp(thrAppear,0.04,0.92);
 /* v28: Snap pro Zelle – eigenes Fenster je Rang, gestreut über fein+mittel Hash (kein Rang-Paket) */
 float hMed=zsH(floor(cc/2.0)+5.0);
 float win=max(0.001,t1-t0);
 float tAppear=t0+thrAppear*win;
 float s0=0.0,s1=0.0,dsc=0.0;
 if(mem>3.5){ s0=2.85; s1=5.40; dsc=0.8; } else if(mem>2.5){ s0=1.90; s1=3.50; dsc=2.6; } else if(mem>1.5){ s0=1.65; s1=4.30; dsc=1.0; }
 float dn=clamp(dc/max(0.001,zMaxD),0.0,1.0);
 float sR=clamp(0.62*h1+0.28*hMed+0.10*dn,0.0,1.0);
 float tSnap=max(tAppear+0.45,s0+zDelay*dsc+sR*(s1-s0));
 /* Boden ab Frame 1 fest (VR) – sofort Albedo, kein Void */
 if(floorBias>0.55&&(mem<1.6||zFloorAny>0.5)){ tAppear=-1.0; tSnap=-1.0; }
 if(tAbs<t0-0.001&&!(floorBias>0.55&&(mem<1.6||zFloorAny>0.5))) discard;
 if(px<0.999){ float inv=1.0-px; tSnap=tSnap-inv*1.6; tAppear=tAppear-inv*1.6; }
 if(tAbs<tAppear) discard;
 float blk=0.0;
 if(tAbs<tSnap) blk=1.0; /* HART – keine Albedo unter Blöcken, kein Soft-Mix */
 /* Persistente Restlöcher (echte discard) – nie Boden */
 if(floorBias<0.45){
  if(zHoleN>0.5){ float hd=length(mc-zH0.xyz)/max(0.001,zH0.w); if(hd<1.0){ float closeK=0.0; if(zRest>0.5&&zHoleK>0.01){ float hd2=length(mc-zHole.xyz)/max(0.001,zHole.w); if(hd2<1.0) closeK=zHoleK*(1.0-hd2*hd2);} if(h1>closeK*0.95) discard; if(h1<=closeK*0.95&&h1>closeK*0.55) blk=1.0; } }
  if(zHoleN>1.5){ float hd=length(mc-zH1.xyz)/max(0.001,zH1.w); if(hd<1.0){ float closeK=0.0; if(zRest>0.5&&zHoleK>0.01){ float hd2=length(mc-zHole.xyz)/max(0.001,zHole.w); if(hd2<1.0) closeK=zHoleK*(1.0-hd2*hd2);} if(h1>closeK*0.95) discard; if(h1<=closeK*0.95&&h1>closeK*0.55) blk=1.0; } }
  if(zHoleN>2.5){ float hd=length(mc-zH2.xyz)/max(0.001,zH2.w); if(hd<1.0){ float closeK=0.0; if(zRest>0.5&&zHoleK>0.01){ float hd2=length(mc-zHole.xyz)/max(0.001,zHole.w); if(hd2<1.0) closeK=zHoleK*(1.0-hd2*hd2);} if(h1>closeK*0.95) discard; if(h1<=closeK*0.95&&h1>closeK*0.55) blk=1.0; } }
  if(zHoleN>3.5){ float hd=length(mc-zH3.xyz)/max(0.001,zH3.w); if(hd<1.0){ float closeK=0.0; if(zRest>0.5&&zHoleK>0.01){ float hd2=length(mc-zHole.xyz)/max(0.001,zHole.w); if(hd2<1.0) closeK=zHoleK*(1.0-hd2*hd2);} if(h1>closeK*0.95) discard; if(h1<=closeK*0.95&&h1>closeK*0.55) blk=1.0; } }
 }
 if(zRest>0.5&&zHoleK>0.01&&floorBias<0.45){
  float hd=length(mc-zHole.xyz)/max(0.001,zHole.w);
  if(hd<1.0){ float e=zHoleK*(1.0-hd*hd); if(h1<e*0.85) discard; if(h1<e*1.15) blk=1.0; }
  float sy=abs(mc.y-zScan.x); if(sy<cs*1.5) blk=max(blk,zScan.y*0.55*(0.35+0.65*hc)*(1.0-sy/(cs*1.5)));
 }
 vec3 col=gl_FragColor.rgb; vec3 alb=col;
 float lifeK=clamp((tAbs-tAppear)/max(0.001,tSnap-tAppear),0.0,1.0);
 if(blk<0.5&&tSnap>0.0){ float age=tAbs-tSnap;
  /* v29: sofort lesbare Tapete (auch dunkel), kein cooles Void-Tile. Nur Kanten-Blitz cyan. */
  if(age<0.55){ float g=clamp(age/0.55,0.0,1.0);
   float La=dot(alb,vec3(0.299,0.587,0.114));
   /* v30: frühe Snap-Kacheln klarere Tapetenzeichnung (noch dunkel), kein Void */
   vec3 wall=alb; if(La<0.16){ float lift=(0.16-La)/0.16; wall=alb*(1.0+1.85*lift)+vec3(0.20,0.13,0.06)*lift; }
   float albFloor=0.88; col=wall*(albFloor+(1.0-albFloor)*g*g);
   if(age<0.11){ vec3 e2=min(f,1.0-f); float ed=step(min(e2.x,min(e2.y,e2.z)),0.09); float fl=1.0-age/0.11; col=mix(col,vec3(0.55,0.95,1.0)*(0.7+0.5*ed),fl*(0.40+0.28*ed)); } } }
 if(blk>0.5){
  /* v30r: Photosphären-Material (unbeleuchtet, volle Bildhelligkeit) – im Block kein Bilddetail durchscheinen lassen:
     Helligkeit überwiegend je Zelle (Hash), Bild nur als Ahnung. Nur zPhoto=1 (Sky/Plate), Warteraum unberührt. */
  if(zPhoto>0.5){ float lp=dot(alb,vec3(0.299,0.587,0.114)); float lc=0.30*lp+0.70*(0.10+0.22*hc+0.08*h1); alb=vec3(0.95,0.78,0.55)*lc; col=alb; }
  /* v30/t280: Wärme schon IN den Würfeln am Peak – cyan Rim, warmer Core, geschichtet; kein Soft-Reveal */
  vec3 bc=mix(vec3(0.02,0.28,0.38),vec3(0.32,0.82,0.90),hc);
  if(hc>0.97) bc=vec3(0.66,0.92,0.88);
  if(hc<0.04) bc=vec3(0.05,0.14,0.22);
  float L=dot(col,vec3(0.299,0.587,0.114));
  bc*=0.40+0.82*mix(L,0.48,0.48)+0.12*h1;
  vec3 e=min(f,1.0-f); float emin=min(e.x,min(e.y,e.z));
  float edge=step(emin,0.055); float faceC=smoothstep(0.0,0.20,emin);
  bc*=1.0-0.46*edge;
  float holeGate=step(0.972,hc)*step(0.60,dc/max(0.001,zMaxD));
  if(holeGate>0.5&&floorBias<0.45) discard;
  float La=dot(alb,vec3(0.299,0.587,0.114));
  vec3 warmBias=vec3(0.54,0.33,0.11);
  /* Erinnerungsfarbe: dunkle Lit-Albedo → Bernstein, lesbare Albedo → Hue behalten (noch als Block) */
  vec3 memWarm=mix(warmBias*0.92+alb*0.40, alb*1.20+warmBias*0.22, smoothstep(0.012,0.11,La));
  float peakW=smoothstep(1.15,1.55,tAbs)*(1.0-smoothstep(2.15,2.55,tAbs));
  /* Wärme früher & am Peak stärker – nicht erst kurz vor Snap */
  float lay=(0.46+0.34*lifeK+0.26*peakW)*(0.72+0.48*hc)*(0.50+0.50*faceC);
  vec3 warmIn=mix(bc*0.28+memWarm*0.95, memWarm, 0.55+0.30*peakW);
  col=mix(bc,warmIn,clamp(lay,0.0,0.90));
  /* Amber-Taschen / Schichtung wie t280 – Cyan bleibt Rim */
  if(floorBias<0.45&&fract(h1*7.3+hc*3.1)>0.38){
    float streak=(0.26+0.34*peakW+0.16*lifeK)*faceC;
    col=mix(col, mix(memWarm, bc*0.35+warmBias*0.60, 0.40), streak);
  }
  col=mix(col, bc, 0.16+0.26*edge);
 }
 gl_FragColor.rgb=col; }`;
const mats=new Set();
function patchMat(m,mesh){ if(!m||m.userData.zsr||m.isRawShaderMaterial||m.isLineBasicMaterial||m.isPointsMaterial||m.isSpriteMaterial||m.depthTest===false) return; const U=uni();
 const mem=(mesh&&mesh.userData&&mesh.userData.zsrMem)||m.userData.zsrMem||rankOf(m);
 const del=(mesh&&mesh.userData&&mesh.userData.zsrDelay!=null)?+mesh.userData.zsrDelay:(m.userData.zsrDelay!=null?+m.userData.zsrDelay:delayOf(m));
 if(m.userData.zsrMem==null) m.userData.zsrMem=mem;
 if(m.userData.zsrDelay==null) m.userData.zsrDelay=del;
 m.userData.zsr={zS:{value:-1e4},zMem:{value:+(m.userData.zsrMem||mem)},zDelay:{value:+(m.userData.zsrDelay||0)},zPhoto:{value:m.userData.zsrPhoto?1:0}}; mats.add(m); wrapMat(m); }
/* v30r: Shader-Hook (eigene Funktion, damit er nach fremdem onBeforeCompile-Tausch – z. B. ZSBake-Lightmap – neu angelegt werden kann) */
function wrapMat(m){ const U=uni(); const prev=m.onBeforeCompile, own=Object.prototype.hasOwnProperty.call(m,'customProgramCacheKey')?m.customProgramCacheKey:null, isSM=!!m.isShaderMaterial;
 m.onBeforeCompile=function(sh,r){ if(prev) prev.call(this,sh,r); Object.assign(sh.uniforms,U); sh.uniforms.zS=m.userData.zsr.zS; sh.uniforms.zMem=m.userData.zsr.zMem; sh.uniforms.zDelay=m.userData.zsr.zDelay; sh.uniforms.zPhoto=m.userData.zsr.zPhoto||{value:0};
  /* v30r: jede Hälfte genau einmal injizieren (fremde Wrapper um einen alten Hook, Material-Klone) */
  let vs=sh.vertexShader; const wp=isSM?'vec4 zsw=vec4(position,1.0);':'vec4 zsw=vec4(transformed,1.0);';
  if(!/varying vec3 vZsW;/.test(vs)){ vs=vs.replace(/void\s+main\s*\(\s*\)/,'varying vec3 vZsW;\nvoid main()'); const j=vs.lastIndexOf('}');
   vs=vs.slice(0,j)+`\n${wp}\n#ifdef USE_INSTANCING\nzsw=instanceMatrix*zsw;\n#endif\nvZsW=(modelMatrix*zsw).xyz;\n}`+vs.slice(j+1); sh.vertexShader=vs; }
  if(!/zs_main/.test(sh.fragmentShader)){ const fs=sh.fragmentShader, fr=/varying\s+vec3\s+vZsW\s*;/.test(fs)?FRAG.replace('varying vec3 vZsW;',''):FRAG; /* Spielhalle nutzt denselben Varying-Namen (gleiche Bedeutung: Weltpos) */ sh.fragmentShader=fs.replace(/void\s+main\s*\(\s*\)/,'void zs_main()')+fr; } };
 m.customProgramCacheKey=function(){ return 'zsr30a|'+(m.userData.zsrMem||2)+'|'+(m.userData.zsrDelay||0).toFixed(2)+'|'+(own?own.call(this):(prev?prev.toString():'')); }; m.userData.zsrFn=m.onBeforeCompile; m.userData.zsrKey=m.customProgramCacheKey; m.needsUpdate=true; }
function eachMesh(root,skip,fn){ root.traverse(o=>{ if(skip&&skip(o)) return; if((o.isMesh||o.isSkinnedMesh||o.isInstancedMesh)&&!o.userData.zsrSkip) fn(o); }); }
function patch(root,skip,zs){ let n=0; eachMesh(root,skip,o=>{ for(const m of (Array.isArray(o.material)?o.material:[o.material])){ if(m&&!m.userData.zsr){ patchMat(m,o); if(m.userData.zsr){ m.userData.zsr.zS.value=zs!=null?zs:now(); n++; } } else if(m&&m.userData.zsr&&(m.onBeforeCompile!==m.userData.zsrFn||m.customProgramCacheKey!==m.userData.zsrKey)) wrapMat(m); } }); return n; }
function mkSkip(user){ return o=>{ for(let p=o;p;p=p.parent){ if(p.userData&&(p.userData.zsrSkip||p.isCamera)) return true; if(p.el&&p.el.id&&/^(rig|cam|hl|hr)$/.test(p.el.id)) return true; } return user?user(o):false; }; }
function noHoleMesh(m){ for(let p=m;p;p=p.parent){ if(p.userData&&p.userData.zsrNoHole) return true; }
 const n=((m.name||'')+' '+((m.material&&m.material.name)||'')).toLowerCase();
 return /door|tuer|tür|noexit|flip|bell|klingel|ticket|nummern|spender|bong|quest|hotspot/.test(n); }
function sampleCells(root,skip,o,cell,maxN,flAny){ const T=THREE, tri=[], v=[new T.Vector3(),new T.Vector3(),new T.Vector3()], seen=new Map(); let tot=0;
 eachMesh(root,skip,m=>{ if(m.isInstancedMesh||!vis(m)) return; const g=m.geometry, P=g&&g.attributes&&g.attributes.position; if(!P) return; m.updateWorldMatrix(true,false); const memR=rankOf(m); const dly=delayOf(m); const nh=noHoleMesh(m)?1:0;
  const ix=g.index, n=ix?ix.count:P.count, M=m.matrixWorld, step=Math.max(3,Math.floor(n/3/4000)*3);
  for(let t=0;t+2<n;t+=step){ for(let k=0;k<3;k++){ const id=ix?ix.getX(t+k):t+k; v[k].fromBufferAttribute(P,id).applyMatrix4(M); }
   const ar=new T.Vector3().subVectors(v[1],v[0]).cross(new T.Vector3().subVectors(v[2],v[0])).length()*0.5*(step/3); if(!(ar>0)) continue;
   const cx=(v[0].x+v[1].x+v[2].x)/3, cy=(v[0].y+v[1].y+v[2].y)/3, cz=(v[0].z+v[1].z+v[2].z)/3, d=Math.hypot(cx-o.x,cy-o.y,cz-o.z), w=ar/Math.max(1,(d/3)*(d/3));
   tri.push([v[0].clone(),v[1].clone(),v[2].clone(),w,memR,nh,dly]); tot+=w; } });
 if(!tri.length) return []; const want=maxN*3, acc=[]; let c=0; for(const t of tri){ c+=t[3]; acc.push(c); }
 for(let i=0;i<want&&seen.size<maxN;i++){ const r=Math.random()*tot; let lo=0,hi=acc.length-1; while(lo<hi){ const mid=(lo+hi)>>1; if(acc[mid]<r) lo=mid+1; else hi=mid; }
  const t=tri[lo]; let a=Math.random(), b=Math.random(); if(a+b>1){ a=1-a; b=1-b; } const x=t[0].x+(t[1].x-t[0].x)*a+(t[2].x-t[0].x)*b, y=t[0].y+(t[1].y-t[0].y)*a+(t[2].y-t[0].y)*b, z=t[0].z+(t[1].z-t[0].z)*a+(t[2].z-t[0].z)*b;
  const ce=cellOf(x,y,z,o,cell), key=ce.cx+','+ce.cy+','+ce.cz+','+ce.cs; if(!seen.has(key)){ ce.mem=(flAny&&Math.abs(y)<0.14)?1:(t[4]||2); ce.noHole=t[5]||0; ce.delay=t[6]||0; seen.set(key,ce); } }
 return [...seen.values()]; }
function vis(m){ for(let p=m;p;p=p.parent) if(!p.visible) return false; const ms=Array.isArray(m.material)?m.material:[m.material]; return ms.some(x=>x&&x.visible!==false&&x.colorWrite!==false&&!(x.transparent&&x.opacity<0.05)); }
let C=null;
/* Volumenblöcke = dieselbe Sprache wie Mesh-Zellen. Sitzen AUF der Geometrie, wachsen zusammen, snappen hinein. */
function smooth(a,b,x){ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); }
function buildBlocks(cells,o,maxD,rad,cell){ cells=cells.filter(c=>c.cs<=cell*8.01); const T=THREE, N=cells.length; if(!N) return null;
 const geo=new T.BoxGeometry(1,1,1), mat=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.48,depthWrite:false,fog:false,toneMapped:false});
 const im=new T.InstancedMesh(geo,mat,N); im.frustumCulled=false; im.userData.zsrSkip=1; im.renderOrder=4; im.instanceMatrix.setUsage(T.DynamicDrawUsage);
 const B=cells.map(c=>{ const cs=c.cs, t=new T.Vector3((c.cx+0.5)*cs,(c.cy+0.5)*cs,(c.cz+0.5)*cs); const mem=c.mem||2; const delay=c.delay||0;
  const thr=thrOf(c,o,maxD,rad); const t0=MEM_T0[mem]+delay, t1=MEM_T1[mem]+delay;
  const settle=0.6;
  /* winziger Offset nur beim Aufwachsen – danach flach auf der Fläche (kein Peel) */
  const toO=new T.Vector3().subVectors(t,o); const dl=toO.length()||1; toO.multiplyScalar(1/dl);
  const off=toO.clone().multiplyScalar(cs*0.18);
  let tAppear=t0+thr*(t1-t0);
  /* Distanz-Bias wie Shader */
  const dc=t.distanceTo(o), dn=Math.min(1,Math.max(0,dc/Math.max(0.001,maxD)));
  tAppear=t0+Math.min(0.92,Math.max(0.04,thr+0.10*smooth(0.5,1.0,dn)))*(t1-t0);
  const h1=h3(c.cx,c.cy,c.cz), hMed=h3(Math.floor(c.cx/2)+5,Math.floor(c.cy/2)+5,Math.floor(c.cz/2)+5);
  const tSnap=snapOf(mem,delay,tAppear,h1,hMed,dn);
  const hc=Math.random(); /* v30: Türkis-Sprache + mehr Bernstein schon in der Basis (t280 Peak) */
  const col=hc>0.96?new T.Color(0.72,0.88,0.78):hc<0.04?new T.Color(0.14,0.12,0.10):new T.Color().setRGB(0.07,0.28,0.36).lerp(new T.Color(0.38,0.76,0.74),0.26+0.42*Math.random()).lerp(new T.Color(0.62,0.40,0.14),0.30+0.34*Math.random());
  return {t,off,cs,thr,t0,t1,tAppear,tSnap,settle,mem,col,noHole:c.noHole|0}; });
 const col0=new T.Color(0,0,0), mx=new T.Matrix4(); for(let i=0;i<N;i++){ im.setColorAt(i,col0); im.setMatrixAt(i,mx.makeScale(0,0,0)); }
 return {org:o.clone(),im,B,N,mx,q:new T.Quaternion(),s:new T.Vector3(),pp:new T.Vector3(),c:new T.Color()}; }
function updBlocks(K,tAbs,head){ if(!K) return; const {im,B,N,mx,q,s,pp,c}=K;
 { let na=0,sa=0,nw=0,sw=0; for(let i=0;i<N;i++){ const b=B[i]; if(b.mem<2) continue; const sn=tAbs>=b.tSnap; na++; if(sn) sa++; if(b.mem>=3){ nw++; if(sn) sw++; } } K.frac={a:na?sa/na:1,w:nw?sw/nw:1}; }
 if(tAbs>=T_END&&!(C&&C.pholes&&C.pholes.some(h=>!h.closed))){ if(!K.clear){ K.clear=true; im.visible=false; } return; } K.clear=false; let any=false;
 const hx=head?head.x:K.org.x, hy=head?head.y:K.org.y, hz=head?head.z:K.org.z;
 for(let i=0;i<N;i++){ const b=B[i]; let k=0, sc=0;
  /* Sync mit Mesh: sichtbar genau während Block-Phase, dann in die Fläche snappen */
  if(tAbs>=b.tAppear&&tAbs<b.tSnap){
   const life=Math.max(0.001,b.tSnap-b.tAppear); const u=(tAbs-b.tAppear)/life;
   if(u<0.82){
    const g=Math.min(1,u/0.20); /* erste 20%: aufwachsen */
    sc=0.18+0.90*g; k=0.75+0.25*g;
    pp.copy(b.t).addScaledVector(b.off,0.55*(1-g)); /* Offset → 0 = auf Fläche wachsen */
   } else {
    /* letzte 18%: Snap in die Fläche (schrumpfen), Mesh bekommt Albedo am selben tSnap */
    const s=(u-0.82)/0.18; sc=1.08*(1-s); k=1.0-0.35*s;
    pp.copy(b.t);
   }
  } else if(C&&C.pholes){
   for(const h of C.pholes){ if(h.closed||h.closeK<=0.01) continue; const dd=b.t.distanceTo(h.c); if(dd<h.r){ k=h.closeK*0.9; sc=0.55+0.45*h.closeK; pp.copy(b.t).addScaledVector(b.off,0.15*(1-h.closeK)); break; } }
  }
  if(k<=0.002||sc<=0.02){ mx.makeScale(0,0,0); im.setMatrixAt(i,mx); continue; }
  const dHead=Math.hypot(pp.x-hx,pp.y-hy,pp.z-hz); if(dHead<0.85){ mx.makeScale(0,0,0); im.setMatrixAt(i,mx); continue; }
  any=true; s.set(b.cs*0.95*sc,b.cs*0.95*sc,b.cs*0.95*sc); mx.compose(pp,q,s); im.setMatrixAt(i,mx);
  /* v30: Peak-Wärme schon früh in Volumenblöcken; Türkis bleibt Träger */
  const life=Math.max(0.001,b.tSnap-b.tAppear), lk=Math.min(1,Math.max(0,(tAbs-b.tAppear)/life));
  let peakW=0; if(tAbs>1.15&&tAbs<2.55){ peakW=tAbs<1.55?(tAbs-1.15)/0.40:tAbs>2.15?(2.55-tAbs)/0.40:1; }
  c.copy(b.col).lerp({r:0.60,g:0.36,b:0.12},0.22+0.28*lk+0.32*peakW).multiplyScalar((0.70+0.22*peakW)*k); im.setColorAt(i,c); }
 im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; im.visible=any; }
function sceneOf(){ return window.AFRAME&&AFRAME.scenes&&AFRAME.scenes[0]; }
let hooked=false;
function hook(){ if(hooked) return; const sc=sceneOf(); if(!sc||!sc.object3D) return; hooked=true; const S=sc.object3D, prev=S.onBeforeRender;
 S.onBeforeRender=function(){ try{ tick(); }catch(e){ console.warn('zsr',e); } if(prev) return prev.apply(this,arguments); }; }
function headPos(){ const sc=sceneOf(), T=THREE; if(sc&&sc.camera){ const p=new T.Vector3(); sc.camera.getWorldPosition(p); return p; } return null; }
function pickPersistentHoles(cells,org,cell){ const sc=sceneOf(), T=THREE, cp=new T.Vector3(), cd=new T.Vector3();
 if(sc&&sc.camera){ sc.camera.getWorldPosition(cp); sc.camera.getWorldDirection(cd); } else { cp.copy(org); cd.set(0,0,-1); }
 const cand=[]; for(const c of cells){ if((c.mem||2)<=1) continue; if(c.noHole) continue;
  const y=(c.cy+0.5)*c.cs; if(Math.abs(y)<0.22) continue;
  /* v27: Löcher auch höher / auf mehr Meshes (Wände+Möbel), nicht nur Rezeption */
  if(y>2.55) continue;
  const x=(c.cx+0.5)*c.cs, z=(c.cz+0.5)*c.cs;
  if(z>2.15&&x>-0.2&&x<1.6) continue;
  if(Math.hypot(x-1.61,z+2.25)<0.55) continue;
  if(Math.hypot(x-1.22,z+2.97)<0.7) continue;
  if(C&&C.avoid&&C.avoid.some(a=>Math.hypot(x-a[0],y-a[1],z-a[2])<(a[3]||1.0)+0.9)) continue;
  const v=new T.Vector3(x-cp.x,y-cp.y,z-cp.z), d=v.length(), nd=d?v.dot(cd)/d:0;
  const edge=Math.hypot(x-org.x,z-org.z)/Math.max(1,C?C.maxD:4);
  let score=0;
  if(d>1.2&&d<5.5&&nd>0.18&&edge>0.32&&y>0.30&&y<2.35) score=3.6+edge+nd+((c.mem|0)===2?0.4:0);
  else if(d>1.2&&d<5.8&&nd<-0.08&&edge>0.28) score=2.4+edge;
  else if(edge>0.48&&d>1.3&&Math.abs(nd)<0.45) score=1.6+edge;
  /* Möbel-Löcher (Rang 3) sichtbar im Blick */
  if((c.mem|0)===3&&d>1.5&&d<4.5&&nd>0.3&&y>0.4&&y<1.6) score=Math.max(score,2.8+nd);
  if(score>0) cand.push({c,score,x,y,z,cs:c.cs}); }
 cand.sort((a,b)=>b.score-a.score); const out=[], used=[];
 for(const it of cand){ if(out.length>=4) break; if(used.some(u=>Math.hypot(u.x-it.x,u.y-it.y,u.z-it.z)<0.95)) continue;
  used.push(it); out.push({c:new T.Vector3(it.x,it.y,it.z),r:Math.max(0.50,it.cs*(4.2+Math.random()*3.2)),st:null,end:null,closeK:0,closed:false,looked:false}); }
 return out; }
function lightOf(){ if(!C||!C.lights) return null; const L=typeof C.lights==='function'?C.lights():C.lights; return L||null; }
function applyLights(tAbs){ const L=lightOf(); if(!L||!C.lBase) return;
 /* v29: Licht wächst mit Snap-Anteil; Floor höher damit Tapete lesbar – kein Paket-Warmlicht */
 let k,warmK; if(tAbs>=T_END){ k=1; warmK=1; } else { const F=C.K&&C.K.frac?C.K.frac:{a:0,w:0};
  k=Math.max(0.20,Math.pow(F.a,1.15)); warmK=Math.max(0.10,Math.pow(F.w,1.10)); }
 if(L.hemi&&C.lBase.hemi!=null) L.hemi.intensity=C.lBase.hemi*k;
 if(L.green&&C.lBase.green!=null) L.green.intensity=C.lBase.green*Math.max(0.04,k*0.85);
 if(L.warm){ const arr=Array.isArray(L.warm)?L.warm:[L.warm]; arr.forEach((l,i)=>{ if(l&&C.lBase.warm[i]!=null) l.intensity=C.lBase.warm[i]*warmK; }); } }
function captureLights(){ const L=lightOf(); if(!L) return null;
 const warm=L.warm?(Array.isArray(L.warm)?L.warm:[L.warm]).map(l=>l?l.intensity:0):[];
 return {hemi:L.hemi?L.hemi.intensity:null, green:L.green?L.green.intensity:null, warm}; }
function revealMeshes(){ if(!C||C.shown) return; C.shown=true; eachMesh(C.root,C.skip,o=>{ if(o.userData._zsrHid){ o.visible=o.userData._zsrVis!==false; delete o.userData._zsrHid; delete o.userData._zsrVis; } }); }
function rankClick(rank){ try{
  const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
  if(!C.ac){ C.ac=new AC(); } if(C.ac.state==='suspended') C.ac.resume().catch(()=>{});
  const t=C.ac.currentTime, o=C.ac.createOscillator(), g=C.ac.createGain();
  o.type='triangle'; o.frequency.value=180+rank*55; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.035,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+0.09);
  o.connect(g); g.connect(C.ac.destination); o.start(t); o.stop(t+0.1);
 }catch(e){} if(C&&C.onRank) try{ C.onRank(rank); }catch(e){} }
function uploadHoles(U){ const slots=[U.zH0,U.zH1,U.zH2,U.zH3]; slots.forEach(s=>s.value.set(0,-99,0,0)); let n=0;
 if(C&&C.pholes){ for(const h of C.pholes){ if(h.closed) continue; if(n>=4) break; slots[n].value.set(h.c.x,h.c.y,h.c.z,h.r); n++; } }
 U.zHoleN.value=n; }
function tick(){ const U=uni(), t=now(); U.zT.value=t; if(!C) return; const tAbs=Math.max(0,t-C.t0); const p=Math.min(1,tAbs/C.dur);
 if(++C.fc%15===1){ patch(C.root,C.skip,C.t0); }
 if(!C.shown&&C.fc>=2) revealMeshes();
 for(let r=1;r<=4;r++){ if(!C.rankHit[r]&&tAbs>=MEM_T0[r]){ C.rankHit[r]=1; rankClick(r); } }
 /* v27: Restlöcher früher anlegen, damit sie während des Wachstums schon sichtbar sind */
 if(!C.pholes&&tAbs>=C.dur*0.55){ C.pholes=pickPersistentHoles(C.cells,C.org,C.cell); const tNow=t;
  C.pholes.forEach((h,i)=>{ h.st=tNow+0.15*i; h.end=h.st+(5.5+Math.random()*5.0); }); uploadHoles(U); }
 const R=C.rest&&tAbs>=C.dur; U.zRest.value=(R||(C.pholes&&C.pholes.length))?1:0; let hk=0;
 if(C.pholes){ const sc=sceneOf(), T=THREE; let cp,cd; if(sc&&sc.camera){ cp=new T.Vector3(); cd=new T.Vector3(); sc.camera.getWorldPosition(cp); sc.camera.getWorldDirection(cd); }
  for(const h of C.pholes){ if(h.closed) continue; if(t<h.st) continue;
   let look=false; if(cp){ const v=new T.Vector3().subVectors(h.c,cp); const d=v.length(); if(d>0.4&&d<6){ v.multiplyScalar(1/d); if(v.dot(cd)>0.72) look=true; } }
   if(look) h.looked=true;
   const life=h.end-h.st; let u=(t-h.st)/life; if(h.looked) u=Math.min(1,u+0.45);
   if(u>=1){ h.closed=true; h.closeK=0; continue; }
   if(u>0.72){ h.closeK=(u-0.72)/0.28; hk=Math.max(hk,h.closeK); U.zHole.value.set(h.c.x,h.c.y,h.c.z,h.r); }
   else h.closeK=0;
  } uploadHoles(U); }
 if(R){ if(t>C.nextScan){ C.scanSt=t; C.nextScan=t+10+Math.random()*8; } const su=(t-C.scanSt)/4.5; if(su>=0&&su<=1){ U.zScan.value.set(C.yLo+(C.yHi-C.yLo)*su,Math.sin(su*Math.PI),0); } else U.zScan.value.set(-99,0,0); }
 U.zHoleK.value=hk; updBlocks(C.K,tAbs,headPos());
 applyLights(tAbs);
 if(p>=1&&!C.done){ C.done=true; C.res&&C.res(); }
 if(tAbs>=T_END&&!C.lit){ C.lit=true; applyLights(99); } }
function assemble(root,o={}){ const T=THREE, U=uni(); hook(); if(OFF){ return {promise:Promise.resolve(),dissolve:()=>Promise.resolve(),setRest(){},stop(){}}; }
 if(C) stop(true); const sc=sceneOf(); const skip=mkSkip(o.skip);
 eachMesh(root,skip,mesh=>{ const r=o.rank?o.rank(mesh):rankOf(mesh); const d=delayOf(mesh); mesh.userData.zsrMem=r; mesh.userData.zsrDelay=d;
  for(const m of (Array.isArray(mesh.material)?mesh.material:[mesh.material])){ if(m){ m.userData.zsrMem=r; m.userData.zsrDelay=d; if(m.userData.zsr){ m.userData.zsr.zMem.value=r; m.userData.zsr.zDelay.value=d; if(m.userData.zsr.zPhoto) m.userData.zsr.zPhoto.value=m.userData.zsrPhoto?1:0; } } } });
 let org=typeof o.origin==='function'?o.origin():o.origin; if(!org){ org=new T.Vector3(); if(sc&&sc.camera) sc.camera.getWorldPosition(org); }
 const dur=qn('realdur',o.duration||4.0), cell=o.cell||0.17, rad=o.radial!=null?o.radial:0.55, t=now();
 root.updateMatrixWorld(true);
 const cells=sampleCells(root,skip,org,cell,o.blocks||1600,!!o.floorAny); U.zFloorAny.value=o.floorAny?1:0;
 eachMesh(root,skip,obj=>{ if(obj.userData._zsrHid) return; obj.userData._zsrVis=obj.visible; obj.userData._zsrHid=1; obj.visible=false; });
 const ds=cells.map(c=>Math.hypot((c.cx+0.5)*c.cs-org.x,(c.cy+0.5)*c.cs-org.y,(c.cz+0.5)*c.cs-org.z)).sort((a,b)=>a-b); let maxD=o.maxD||Math.max(2.4,ds.length?ds[Math.floor(ds.length*0.88)]:6);
 let yLo=1e9,yHi=-1e9; for(const c of cells){ if(c.cs>cell*1.5) continue; const y=(c.cy+0.5)*c.cs; if(y<yLo) yLo=y; if(y>yHi) yHi=y; } if(yLo>yHi){ yLo=org.y-1.6; yHi=org.y+1; }
 U.zOrg.value.copy(org); U.zMaxD.value=maxD; U.zCell.value=cell; U.zRad.value=rad; U.zDur.value=dur; U.zX.value=1e9; U.zOn.value=1; U.zRest.value=0; U.zHoleN.value=0;
 patch(root,skip,t); for(const m of mats) m.userData.zsr.zS.value=t; U.zS.value=t;
 const K=buildBlocks(cells,org,maxD,rad,cell); if(K&&sc) sc.object3D.add(K.im);
 const rest=o.rest!=null?o.rest:qn('realrest',1)>0;
 C={root,skip,t0:t,dur,cells,K,rest,fc:0,nextScan:t+dur+1.2,scanSt:-99,yLo,yHi,done:false,shown:false,lights:o.lights||null,lBase:null,org:org.clone(),cell,maxD,pholes:null,rankHit:{},onRank:o.onRank||null,ac:null,avoid:o.avoid||null};
 if(C.lights){ C.lBase=captureLights(); applyLights(0); }
 try{ if(sc&&sc.renderer&&sc.camera) sc.renderer.compile(sc.object3D, sc.camera); }catch(e){}
 revealMeshes();
 const ctl=C; C.promise=new Promise(r=>{ ctl.res=r; });
 return {promise:C.promise,dissolve:d=>dissolve(d),setRest:b=>{ ctl.rest=!!b; },stop:()=>stop(),get p(){ return Math.min(1,(now()-ctl.t0)/ctl.dur); }}; }
function dissolve(d=1.2){ const U=uni(); if(!C) return Promise.resolve(); U.zXd.value=d; U.zX.value=now(); C.rest=false; return new Promise(r=>setTimeout(r,d*1000)); }
function stop(keep){ if(!C) return; revealMeshes(); applyLights(99); if(C.K){ C.K.im.parent&&C.K.im.parent.remove(C.K.im); C.K.im.geometry.dispose(); C.K.im.material.dispose(); } C.res&&C.res(); C=null; if(!keep){ const U=uni(); U.zRest.value=0; U.zS.value=-1e4; U.zHoleN.value=0; for(const m of mats) m.userData.zsr.zS.value=-1e4; } }
function off(){ stop(); uni().zOn.value=0; }
/* v30r (Räume): generische Rang-Zuordnung für Räume ohne wr_-Materialnamen – Name zuerst, sonst Geometrie.
   Rang 1 Boden · 2 große Formen (Wände/Decke/Fassade) · 3 Möbel/Figuren (gestaffelt) · 4 Kleinkram/Licht/Schilder/Himmel.
   Setzt nur userData (zsrMem/zsrDelay/zsrNoHole); Seiten-eigene Werte bleiben. Rückgabe {n,avoid:[[x,y,z,r]…],count:[…]} */
function autoRank(root,ao={}){ const T=THREE, skip=mkSkip(ao.skip), bb=new T.Box3(), sz=new T.Vector3(), ce=new T.Vector3(), avoid=[], cnt=[0,0,0,0,0]; let n=0;
 const NH=ao.noHole||/door|tuer|tür|key|schl(ue|ü)ssel|handle|griff|klinke|hotspot|button|knopf|quest|ticket|nokio|phone|handy/i;
 const q=[0,0.15,0.30,0.45];
 root.updateMatrixWorld(true);
 eachMesh(root,skip,m=>{ n++; const ms=Array.isArray(m.material)?m.material:[m.material];
  let nm=(m.name||''); for(let p=m.parent;p&&p!==root;p=p.parent){ if(p.name) nm+=' '+p.name; } nm+=' '+ms.map(x=>x&&x.name||'').join(' ');
  let nh=false; for(let p=m;p;p=p.parent){ if(p.userData&&p.userData.zsrNoHole){ nh=true; break; } }
  if(!nh&&NH.test(nm)){ m.userData.zsrNoHole=1; nh=true; }
  if(!m.geometry||!m.geometry.attributes||!m.geometry.attributes.position){ return; }
  if(!m.geometry.boundingBox) m.geometry.computeBoundingBox(); bb.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); bb.getSize(sz); bb.getCenter(ce);
  if(nh) avoid.push([ce.x,ce.y,ce.z,Math.max(0.4,Math.min(1.6,sz.length()*0.5))]);
  if(m.userData.zsrMem){ cnt[m.userData.zsrMem|0]++; return; }
  const big=Math.max(sz.x,sz.y,sz.z), flat=sz.y<0.25&&Math.abs(ce.y)<0.2&&sz.x*sz.z>1.0;
  let r=0, d=0;
  const gt=m.geometry.type, gp=m.geometry.parameters||{}, dome=((gt==='SphereGeometry'||gt==='CylinderGeometry')&&(gp.radius||gp.radiusTop||0)>15)||(ms.some(x=>x&&x.side===THREE.BackSide)&&big>15);
  if(dome||/\bsky|himmel|backdrop|pano|horizon|skyline/i.test(nm)){ r=4; d=0.55; }
  else if(/floor|boden|ground|carpet|teppich|rug|parkett|pflaster|asphalt|street|strasse|straße/i.test(nm)&&sz.y<0.6) r=1;
  else if(flat) r=1;
  else if(/fig|person|npc|mara|kundin|body|passant|chicken|huhn/i.test(nm)){ r=3; }
  else if(/pinup|poster|sign|schild|paper|papier|emit|neon|glow|lamp|leucht|light|tube|röhre|shade|decal|label/i.test(nm)&&big<3) r=4;
  else if(/wall|wand|ceil|decke|roof|dach|facade|fassade|fas\b|brick|corr|tile|fliese|shell|room|haus|house|building/i.test(nm)||big>=2.2) r=2;
  else if(big>=0.35) r=3; else r=4;
  if(r===3){ let h=0; const u=m.uuid; for(let i=0;i<u.length;i++) h=(h*31+u.charCodeAt(i))|0; d=q[(h>>>0)%4]; }
  m.userData.zsrMem=r; m.userData.zsrDelay=d; cnt[r]++; });
 return {n,avoid,count:cnt}; }
/* Photosphäre → Raumschale: Vertices eines um den Aufnahmepunkt zentrierten Sky/Plate-Meshes radial auf Boden/Wand/Decke
   ziehen. Vom Mittelpunkt aus bleibt das Bild IDENTISCH (gleiche Richtung, gleiche UV), aber die Fläche liegt jetzt als
   Geometrie im Raum (Boden y=floor, Wände r=wall) – damit setzt sich ein Boden + Raum zusammen statt eines Bild-Filters.
   o={floor:-1.6,wall:5.5,ceil:2.6,k:1,dist:[…] (Wandabstand je Azimut wie engine proxyGeo)} (lokal). Rückgabe restore(). */
function photoShell(mesh,o={}){ const g=mesh&&mesh.geometry, P=g&&g.attributes&&g.attributes.position; if(!P) return ()=>{};
 const orig=P.array.slice(0), F=o.floor!=null?o.floor:-1.6, W=o.wall||5.5, Cc=o.ceil!=null?o.ceil:2.6, k=o.k||1;
 for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i), r0=Math.hypot(x,y,z); if(!(r0>0)) continue; const dx=x/r0, dy=y/r0, dz=z/r0;
  let t=r0; if(dy<-1e-4) t=Math.min(t,F/dy); if(Cc>0&&dy>1e-4) t=Math.min(t,Cc/dy); const h=Math.hypot(dx,dz); let Wd=W; if(o.dist&&o.dist.length){ const N=o.dist.length; let u=Math.atan2(dz,-dx)/(2*Math.PI); u=(u%1+1)%1; Wd=o.dist[Math.round(u*N)%N]||W; } if(h>1e-4) t=Math.min(t,Wd*k/h); /* k nur auf Wände – Boden bleibt exakt auf floor (Frame 1) */
  P.setXYZ(i,dx*t,dy*t,dz*t); }
 P.needsUpdate=true; g.computeBoundingSphere(); const fc=mesh.frustumCulled; mesh.frustumCulled=false;
 return ()=>{ P.array.set(orig); P.needsUpdate=true; g.computeBoundingSphere(); mesh.frustumCulled=fc; }; }
window.ZSR={assemble,dissolve,patch:(r,s)=>patch(r,mkSkip(s),-1e4),off,stop,tick,rankOf,delayOf,adopt:o=>{ if(C&&o) patch(o,C.skip,C.t0); },get state(){ const U=uni(); return {active:!!C,p:C?Math.min(1,(now()-C.t0)/C.dur):1,tAbs:C?Math.max(0,now()-C.t0):0,mats:mats.size,blocks:C&&C.K?C.K.N:0,maxD:U.zMaxD.value,rest:U.zRest.value,holes:C&&C.pholes?C.pholes.filter(h=>!h.closed).length:0,frac:C&&C.K&&C.K.frac?C.K.frac:null,tEnd:T_END}; },autoRank,photoShell,_h3:h3};
})();
