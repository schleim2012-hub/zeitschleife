/* Giß-Moe Haare: wachsen jeden Tag ein bisschen (echtes Datum), werden zerzaust, Friseur: kämmen, schneiden, Frisuren, Farben. Eigene Umsetzung, offline. */
(function(){
const DAY=86400000, GROW=0.034, LMAX=0.30, LMIN=0.035, SEG=10, N=1700;
const H={}; let K, THREE, mesh=null, mat=null, roots=null, tie=null, built='', panel=null, tool=null, lastCheck=0;
const COLORS=[
 {id:'natur',n:'Natur',c:['#5e3a20','#c49464']},{id:'blond',n:'Blond',c:['#b88a3e','#f3d68a']},{id:'schoko',n:'Schoko',c:['#2e1a10','#5a3520']},
 {id:'rot',n:'Feuerrot',c:['#8a1c10','#e8552c']},{id:'rosa',n:'Rosa',c:['#c2457a','#ffb3d6']},{id:'lila',n:'Lila',c:['#4e2a8a','#b98cf0']},
 {id:'blau',n:'Blau',c:['#1d3f9a','#6fb4ff']},{id:'gruen',n:'Grün',c:['#1f6a2c','#7fe07a']},{id:'tuerkis',n:'Türkis',c:['#0f6a72','#6ff0e0']},
 {id:'silber',n:'Silber',c:['#7d808a','#f2f4f8']},{id:'zucker',n:'Zuckerwatte',c:['#ff8ccf','#8fd8ff'],mix:1},{id:'regen',n:'Regenbogen',c:['#ff4040','#40a0ff'],rainbow:1}];
const STYLES=[
 {id:'natur',e:'🙂',n:'Wuschel',min:0,day:0},{id:'scheitel',e:'💁',n:'Scheitel',min:0.05,day:0},{id:'igel',e:'🦔',n:'Igel',min:0,day:0},
 {id:'iro',e:'🤘',n:'Iro',min:0,day:1},{id:'zoepfe',e:'🎀',n:'Zöpfchen',min:0.1,day:2},{id:'zopf',e:'🐴',n:'Pferdeschwanz',min:0.11,day:3},
 {id:'locken',e:'🌀',n:'Locken',min:0.06,day:4},{id:'dutt',e:'🍩',n:'Dutt',min:0.1,day:5}];
const CUTS=[{n:'Ganz kurz',L:0.04},{n:'Kurz',L:0.07},{n:'Mittel',L:0.11},{n:'Lang',L:0.17}];
/* ---------- Zustand ---------- */
function S(){ const M=K.M; if(!M.hair){ M.hair={L0:0.05,t0:Date.now(),color:'natur',style:'natur',m0:0,ct:Date.now()}; } return M.hair; }
function days(){ return (K.M.days&&K.M.days.length)||1; }
H.len=function(now){ const s=S(); return Math.max(LMIN,Math.min(LMAX,s.L0+GROW*Math.max(0,((now||Date.now())-s.t0)/DAY))); };
H.mess=function(now){ const s=S(); return Math.max(0,Math.min(1,s.m0+0.24*Math.max(0,((now||Date.now())-s.ct)/DAY))); };
H.needs=()=>H.len()>0.15&&H.mess()>0.7;
/* ---------- Wurzeln auf der Kopfhaut (flächengewichtet) ---------- */
function rng(seed){ let s=seed>>>0||1; return ()=>{ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)%100000)/100000; }; }
function scalp(p){ const x=Math.abs(p[0]), y=p[1], z=p[2]; if(x>0.215) return false; if(y<0.74) return false;
 const line=z>0.12?0.885+(z-0.12)*0.35:(z<-0.12?0.80+(z+0.12)*0.7:0.86-(0.12-z)*0.25); return y>line+Math.max(0,(x-0.15))*0.8; }
function sampleRoots(){ const g=K.G.geo, P=g.attributes.position.array, Nn=g.attributes.normal.array, I=g.index.array, tris=[], acc=[]; let tot=0;
 const v=i=>[P[i*3],P[i*3+1],P[i*3+2]];
 for(let t=0;t<I.length;t+=3){ const a=v(I[t]),b=v(I[t+1]),c=v(I[t+2]); const m=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,(a[2]+b[2]+c[2])/3]; if(!scalp(m)) continue;
  const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2]; const cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx; const ar=Math.hypot(cx,cy,cz)/2; tot+=ar; tris.push(t); acc.push(tot); }
 const r=rng(4711), out=[];
 for(let k=0;k<N;k++){ const q=r()*tot; let lo=0,hi=acc.length-1; while(lo<hi){ const m=(lo+hi)>>1; if(acc[m]<q) lo=m+1; else hi=m; } const t=tris[lo];
  let u=r(), w=r(); if(u+w>1){ u=1-u; w=1-w; } const ia=I[t],ib=I[t+1],ic=I[t+2], b0=1-u-w;
  const p=[0,1,2].map(j=>P[ia*3+j]*b0+P[ib*3+j]*u+P[ic*3+j]*w), n=[0,1,2].map(j=>Nn[ia*3+j]*b0+Nn[ib*3+j]*u+Nn[ic*3+j]*w); const nl=Math.hypot(...n)||1;
  out.push({p,n:n.map(x=>x/nl),r:[r(),r(),r(),r()]}); }
 return out; }
/* ---------- Strähnen formen ---------- */
const HC=[0,0.645,0.0], HR=[0.43,0.385,0.375];
function collide(p,pad){ const q=[(p[0]-HC[0])/(HR[0]+pad),(p[1]-HC[1])/(HR[1]+pad),(p[2]-HC[2])/(HR[2]+pad)]; const l=Math.hypot(q[0],q[1],q[2]); if(l<1){ for(let j=0;j<3;j++) p[j]=HC[j]+q[j]/l*(HR[j]+pad); return true; } return false; }
const nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; };
const add=(a,b,s)=>[a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s];
function hash3(x,y,z){ const s=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453; return s-Math.floor(s); }
function strand(R,L,style,mess,hat){ const p0=add(R.p,R.n,0.012), n=R.n, r=R.r; const x=p0[0], y=p0[1], z=p0[2];
 const pts=[p0.slice()]; let Lr=L*(0.82+0.36*r[0]);
 const front=z>0.14&&y<0.97; let dir;
 // Klumpen: Nachbarn teilen Unordnung
 const cx=Math.floor(x/0.05), cy=Math.floor(y/0.05), cz=Math.floor(z/0.05);
 const cn=[hash3(cx,cy,cz)-0.5,hash3(cy,cz,cx)-0.5,hash3(cz,cx,cy)-0.5];
 const own=[r[1]-0.5,r[2]-0.5,r[3]-0.5];
 let gravity=Math.min(1.3,Math.max(0.08,(Lr-0.04)*7)), stiff=0, part=0.04;
 if(hat){ if(y>0.9) return null; dir=nrm(add(n,[0,-1,0],0.9)); gravity=1.4; }
 else if(style==='iro'){ if(Math.abs(x)<0.065){ Lr=Math.max(0.09,Lr*1.15); dir=nrm(add(n,[0,1,-0.15],0.9)); gravity=-0.05; stiff=1; } else { Lr=0.016; dir=n; gravity=0; } }
 else if(style==='igel'){ Lr=Math.min(Lr,0.115)*(0.9+0.2*r[0]); dir=nrm(add(add(n,[0,1,0],0.35),cn,0.7)); gravity=0.02; stiff=1; }
 else if(style==='scheitel'){ const s=x>part?1:-1; dir=nrm(add(add(n,[s,0.25,0],0.8),[0,0,-0.2],1)); if(front){ dir=nrm([0.9,-0.25,0.35]); Lr=Math.min(Lr,0.1+0.05*mess); } }
 else { const s=x>0?1:-1; dir=nrm(add(add(n,[0,0.35-Math.max(0,Lr-0.1)*3.2,0],1),[s,0,0],0.12+Math.max(0,Lr-0.1)*2)); if(front&&style!=='zopf'&&style!=='zoepfe'&&style!=='dutt'){ dir=nrm(add(n,[0,-0.7,0.25],1)); Lr=Math.min(Lr,0.065+mess*0.07); } }
 dir=nrm(add(add(dir,own,mess*0.55),cn,mess*0.8));
 // Ziel-Punkte (Zopf/Zöpfe/Dutt)
 let G=null, tail=null;
 if(!hat&&style==='zopf'){ G=[0,1.0,-0.2]; tail=[0,1.5,-0.3]; }
 if(!hat&&style==='zoepfe'){ const s=x>0?1:-1; G=[s*0.215,0.94,-0.06]; tail=[s*1,1.0,0.05]; }
 if(!hat&&style==='dutt'){ G=[0,1.025,-0.08]; }
 const seg=Lr/SEG; let p=p0.slice(), d=dir.slice(), gathered=false, gi=0;
 for(let i=1;i<=SEG;i++){ let st=seg;
  if(G&&!gathered){ const to=[G[0]-p[0],G[1]-p[1],G[2]-p[2]], dl=Math.hypot(...to); const need=Math.max(seg,dl/Math.max(1,(SEG*0.45-i+1)));
   if(dl<0.02||i>SEG*0.5){ gathered=true; gi=i; p=G.map((g,j)=>g+(r[j+1]-0.5)*0.03); }
   else { d=nrm(to); st=Math.min(dl,Math.max(seg,need)); p=add(p,d,st); collide(p,0.034); pts.push(p.slice()); continue; } }
  if(G&&gathered){ if(style==='dutt'){ const k=(i-gi)/(SEG-gi+1), a=r[0]*6.283+k*9, rr=0.078*(1-0.3*k)+(r[1]-0.5)*0.014; p=[G[0]+Math.cos(a)*rr,G[1]+0.055+Math.sin(k*3.14)*0.035+(r[2]-0.5)*0.015,G[2]-0.03+Math.sin(a)*rr]; pts.push(p.slice()); continue; }
   const tl=Math.max(0.07,Lr*1.35), ts=tl/(SEG-gi+1); const kk=(i-gi)/(SEG-gi+1); d=nrm(add(add(d.map(v=>v*0.45),tail,1-kk*0.6),[0,-1,0],2.6*kk*kk)); d=nrm(add(d,own,0.25+mess*0.3)); p=add(p,d,ts); pts.push(p.slice()); continue; }
  if(!stiff) d=nrm(add(d,[0,-1,0],gravity*0.11*i/SEG*3));
  if(style==='locken'){ const a=i*2.1+r[0]*6.3; d=nrm(add(d,[Math.cos(a),Math.sin(a)*0.4,Math.sin(a)],0.55)); st*=0.82; }
  if(mess>0.05) d=nrm(add(d,[Math.sin(i*1.7+r[1]*9)-0,Math.cos(i*1.3+r[2]*7)*0.5,Math.sin(i*2.3+r[3]*5)],mess*0.16));
  p=add(p,d,st); if(collide(p,0.032)){ d=nrm(add(d,[p[0]-HC[0],p[1]-HC[1],p[2]-HC[2]].map((v,j)=>v/HR[j]),0.25)); }
  // Augen frei halten, außer wenn sehr zerzaust
  if(p[2]>0.2&&p[1]<0.84&&p[1]>0.6&&mess<0.75) { p[2]=Math.min(p[2],0.2+(p[1]-0.6)*0.2); }
  pts.push(p.slice()); }
 return pts; }
/* ---------- Geometrie ---------- */
function buildGeo(){ const L=H.len(), mess=H.mess(), s=S(), hat=!!(K.M.wear&&(K.M.wear.hat||(window.GissWear&&GissWear.costumeHat&&GissWear.costumeHat())));
 const key=[L.toFixed(3),mess.toFixed(2),s.style,hat].join('|'); if(key===built&&mesh) return; built=key;
 if(!roots) roots=sampleRoots();
 const per=(SEG+1)*2, pos=[], tan=[], at=[], rn=[], nn=[], idx=[]; let vb=0;
 roots.forEach((R,ri)=>{ const pts=strand(R,L,s.style,mess,hat); if(!pts) return; const n=pts.length;
  for(let i=0;i<n;i++){ const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)], t=nrm([b[0]-a[0],b[1]-a[1],b[2]-a[2]]);
   for(const sd of [-1,1]){ pos.push(...pts[i]); tan.push(...t); at.push(i/(n-1),sd); rn.push(R.r[0],R.r[1]); nn.push(...R.n); } }
  for(let i=0;i<n-1;i++){ const a=vb+i*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); } vb+=n*2; });
 const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('aTan',new THREE.Float32BufferAttribute(tan,3));
 g.setAttribute('aT',new THREE.Float32BufferAttribute(at,2)); g.setAttribute('aRnd',new THREE.Float32BufferAttribute(rn,2)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nn,3));
 g.setIndex(vb>65000?new THREE.Uint32BufferAttribute(idx,1):new THREE.Uint16BufferAttribute(idx,1)); g.computeBoundingSphere();
 if(mesh){ mesh.geometry.dispose(); mesh.geometry=g; } else { mesh=new THREE.Mesh(g,mat); mesh.frustumCulled=false; mesh.name='hair'; K.G.head.add(mesh); }
 mat.uniforms.uGath.value=(!hat&&/^(zopf|zoepfe|dutt)$/.test(s.style))?1:0; mat.uniforms.uW.value=s.style==='igel'||s.style==='iro'?0.0085:0.0068;
 // Haargummi / Schleifen
 if(tie){ K.G.head.remove(tie); tie=null; }
 if(!hat&&(s.style==='zopf'||s.style==='zoepfe')){ tie=new THREE.Group(); const tm=new THREE.MeshPhysicalMaterial({color:s.style==='zoepfe'?0xff6fa8:0xffd23a,roughness:0.4,clearcoat:0.6});
  const gs=s.style==='zopf'?[[0,1.0,-0.2]]:[[-0.215,0.94,-0.06],[0.215,0.94,-0.06]];
  gs.forEach(G=>{ const t=new THREE.Mesh(new THREE.TorusGeometry(0.022,0.009,10,24),tm); t.position.fromArray(G); t.lookAt(new THREE.Vector3(G[0]*3,G[1]-0.1,G[2]*1.5-0.05)); tie.add(t);
   if(s.style==='zoepfe'){ [-1,1].forEach(q=>{ const l=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),tm); l.scale.set(0.022,0.013,0.008); l.position.set(G[0],G[1]+0.018,G[2]+q*0.022); l.rotation.x=q*0.5; tie.add(l); }); } });
  K.G.head.add(tie); } }
function colorUniforms(){ const s=S(), c=COLORS.find(x=>x.id===s.color)||COLORS[0]; const U=mat.uniforms;
 U.uRootC.value.set(c.c[0]).convertSRGBToLinear(); U.uTipC.value.set(c.c[1]).convertSRGBToLinear(); U.uMix.value=c.mix?1:0; U.uRain.value=c.rainbow?1:0; }
const VS=`attribute vec3 aTan; attribute vec2 aT; attribute vec2 aRnd; uniform float uW,uTime,uSway; varying float vT,vR; varying vec3 vTan,vN,vV; varying float vX;
void main(){ float t=aT.x; vec3 p=position; float sw=t*t*uSway; p+=vec3(sin(uTime*1.7+aRnd.x*6.3),0.,cos(uTime*1.3+aRnd.y*6.3))*0.006*sw;
 vec4 mv=modelViewMatrix*vec4(p,1.); vec3 tv=normalize((modelViewMatrix*vec4(aTan,0.)).xyz); vec3 sd=normalize(cross(tv,normalize(-mv.xyz)));
 mv.xyz+=sd*aT.y*uW*(1.-0.8*t)*(0.75+0.5*aRnd.y); gl_Position=projectionMatrix*mv; vT=t; vR=aRnd.x; vTan=tv; vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); vX=position.x; }`;
const FS=`uniform vec3 uRootC,uTipC,uKeyCol,uFillCol,uSky,uKeyDirV; uniform float uMix,uRain,uGath; varying float vT,vR,vX; varying vec3 vTan,vN,vV;
vec3 hue(float h){ return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); }
void main(){ vec3 c=mix(uRootC,uTipC,smoothstep(-0.6*uGath,0.85-0.3*uGath,vT)*0.85+vR*0.15);
 if(uMix>0.5) c=mix(uRootC,uTipC,smoothstep(-0.15,0.15,vX+sin(vT*6.+vR*4.)*0.05));
 if(uRain>0.5) c=pow(hue(fract(vX*1.6+vT*0.35+0.02*vR)),vec3(2.2))*0.9+0.04;
 c*=0.82+0.36*vR; vec3 L=normalize(uKeyDirV), N=normalize(vN), T=normalize(vTan);
 float dif=0.35+0.65*max(0.,dot(N,L)*0.75+0.25); vec3 Hh=normalize(L+vV); float th=dot(T,Hh); float sp=pow(max(0.,sqrt(1.-th*th)),70.)*0.55;
 float sp2=pow(max(0.,sqrt(1.-th*th)),18.)*0.18; float ao=mix(0.62,1.,smoothstep(0.,0.4,vT));
 vec3 col=c*(uSky*1.6+uKeyCol*dif*1.25+uFillCol*0.8)*ao+(uKeyCol*sp+c*sp2*1.5)*ao;
 gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
function buildMat(){ const GU=K.G.U; mat=new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{uW:{value:0.0068},uTime:GU.uTime,uSway:{value:1},uRootC:{value:new THREE.Color()},uTipC:{value:new THREE.Color()},uMix:{value:0},uRain:{value:0},uGath:{value:0},
  uKeyCol:GU.uKeyCol,uFillCol:GU.uFillCol,uSky:GU.uSky,uKeyDirV:{value:new THREE.Vector3(-0.5,0.7,0.6)}},vertexShader:VS,fragmentShader:FS}); colorUniforms(); }
H.tick=function(dt,t){ if(!mat) return; const v=mat.uniforms.uKeyDirV.value; v.set(-2,3,3).normalize().transformDirection(K.cam.matrixWorldInverse);
 const now=performance.now(); if(now-lastCheck>20000){ lastCheck=now; buildGeo(); } };
H.refresh=()=>{ built=''; buildGeo(); colorUniforms(); const hide=!!(window.GissWear&&GissWear.hairHidden&&GissWear.hairHidden()); if(mesh) mesh.visible=!hide; if(tie) tie.visible=!hide; };
/* ---------- Friseur-Panel ---------- */
const css=`#salon .tabs{display:flex;gap:6px;margin:0 2px 8px}#salon .tabs button{flex:1;min-height:52px;border:0;border-radius:16px;background:rgba(90,50,20,.1);font:700 15px system-ui;color:#4a2c14}
#salon .tabs button.on{background:linear-gradient(180deg,#ffd38a,#e7a24f);box-shadow:0 3px 10px rgba(150,80,20,.35)}#salon .tabs i{font-style:normal;font-size:22px;display:block}
#salon .stat{display:flex;gap:10px;align-items:center;justify-content:center;font:700 15px system-ui;margin:2px 0 8px}#salon .lenbar{width:110px;height:12px;border-radius:7px;background:rgba(90,50,20,.15);overflow:hidden}#salon .lenbar div{height:100%;background:linear-gradient(90deg,#c98a4b,#7a4a26);border-radius:7px}
#salon .pg{display:none}#salon .pg.on{display:block}#salon .hint{text-align:center;font:600 16px system-ui;margin:6px 4px 10px;opacity:.85}
#salon .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}#salon .grid button{min-height:74px;border:0;border-radius:18px;background:#fffaf0;box-shadow:0 3px 10px rgba(120,70,20,.18);font:700 13px system-ui;color:#4a2c14;padding:6px 2px;position:relative}
#salon .grid button i{font-style:normal;font-size:28px;display:block;line-height:1.2}#salon .grid button.on{outline:4px solid #f0a040}#salon .grid button.lock{opacity:.45}#salon .grid button.lock:after{content:'🔒';position:absolute;right:6px;top:4px;font-size:15px}
#salon .sw{width:38px;height:38px;border-radius:50%;margin:0 auto 4px;box-shadow:inset 0 -4px 8px rgba(0,0,0,.25),0 2px 6px rgba(0,0,0,.2)}
#salon .big{width:100%;min-height:58px;border:0;border-radius:18px;font:700 18px system-ui;color:#3a2212;background:linear-gradient(180deg,#f2c27c,#c98a4b);box-shadow:0 4px 12px rgba(0,0,0,.2)}
#tool{position:fixed;z-index:30;pointer-events:none;font-size:58px;transform:translate(-30%,-60%) rotate(-25deg);display:none;filter:drop-shadow(0 4px 6px rgba(0,0,0,.45))}#tool svg{width:84px;height:84px}
.hairbit{position:fixed;z-index:12;width:3px;height:22px;border-radius:3px;pointer-events:none;animation:hb 1.4s ease-in forwards}@keyframes hb{to{transform:translate(var(--dx),220px) rotate(var(--r));opacity:0}}
#salon.panel{max-height:46vh}`;
const COMB='<svg viewBox="0 0 100 100"><rect x="8" y="30" width="84" height="22" rx="8" fill="#ff7eb6" stroke="#b03a72" stroke-width="3"/>'+Array.from({length:12},(_,i)=>`<rect x="${13+i*6.6}" y="48" width="3.6" height="${i%2?24:30}" rx="1.6" fill="#ff7eb6" stroke="#b03a72" stroke-width="1.5"/>`).join('')+'<circle cx="20" cy="40" r="3" fill="#fff" opacity=".7"/></svg>';
let tab='kamm';
function buildPanel(){ const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
 panel=document.createElement('div'); panel.id='salon'; panel.className='panel';
 panel.innerHTML='<div class="ph"><b>💇 Friseur Giß-Moe</b><button class="x" aria-label="Schließen">✕</button></div><div class="stat"><span>Länge</span><div class="lenbar"><div id="hLen"></div></div><span id="hMess"></span></div>'+
 '<div class="tabs"><button data-t="kamm"><i>🪥</i>Kämmen</button><button data-t="schnitt"><i>✂️</i>Schneiden</button><button data-t="frisur"><i>💇</i>Frisur</button><button data-t="farbe"><i>🎨</i>Farbe</button></div>'+
 '<div class="pg" data-p="kamm"><p class="hint">Nimm den Kamm und streich über Giß-Moes Haare! 👆</p><button class="big" id="hComb">Kamm nehmen</button></div>'+
 '<div class="pg" data-p="schnitt"><p class="hint">Wie lang sollen die Haare sein?</p><div class="grid" id="hCuts"></div></div>'+
 '<div class="pg" data-p="frisur"><div class="grid" id="hStyles"></div></div><div class="pg" data-p="farbe"><div class="grid" id="hColors"></div></div>';
 document.body.appendChild(panel); panel.addEventListener('pointerdown',e=>e.stopPropagation());
 panel.querySelector('.x').addEventListener('pointerup',e=>{ e.stopPropagation(); H.close(); });
 panel.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('pointerup',e=>{ e.stopPropagation(); setTab(b.dataset.t); }));
 panel.querySelector('#hComb').addEventListener('pointerup',e=>{ e.stopPropagation(); K.V.unlock(); setTool(tool==='comb'?null:'comb'); });
 const tl=document.createElement('div'); tl.id='tool'; document.body.appendChild(tl);
 // Werkzeug-Gesten über dem 3D-Bild (vor allen anderen Handlern)
 addEventListener('pointerdown',toolDown,true); addEventListener('pointermove',toolMove,true); addEventListener('pointerup',toolUp,true); addEventListener('pointercancel',toolUp,true); }
function setTab(t){ tab=t; panel.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t)); panel.querySelectorAll('.pg').forEach(p=>p.classList.toggle('on',p.dataset.p===t)); if(t!=='kamm') setTool(null); fill(); }
function fill(){ const s=S(), L=H.len(), m=H.mess(), d=days();
 panel.querySelector('#hLen').style.width=Math.round(L/LMAX*100)+'%'; panel.querySelector('#hMess').textContent=m>0.7?'😵 total zerzaust':m>0.35?'🙃 etwas zerzaust':'😊 ordentlich';
 panel.querySelector('#hComb').textContent=tool==='comb'?'Fertig gekämmt ✔':'Kamm nehmen 🪥';
 const cu=panel.querySelector('#hCuts'); cu.innerHTML=''; CUTS.forEach(c=>{ const b=document.createElement('button'); b.innerHTML='<i>'+(c.L<0.05?'✂️':c.L<0.08?'💇':c.L<0.12?'👧':'👸')+'</i>'+c.n; if(c.L>=L-0.004) b.classList.add('lock'); b.addEventListener('pointerup',e=>{ e.stopPropagation(); K.V.unlock(); H.cut(c.L); }); cu.appendChild(b); });
 const sy=panel.querySelector('#hStyles'); sy.innerHTML=''; STYLES.forEach(x=>{ const b=document.createElement('button'); b.innerHTML='<i>'+x.e+'</i>'+x.n; const lk=d<=x.day; if(lk) b.classList.add('lock'); if(s.style===x.id) b.classList.add('on');
  b.addEventListener('pointerup',e=>{ e.stopPropagation(); K.V.unlock(); if(lk){ K.toast('🔒 Diese Frisur gibt es ab Tag '+(x.day+1)+'!'); return; } H.style(x.id); }); sy.appendChild(b); });
 const co=panel.querySelector('#hColors'); co.innerHTML=''; COLORS.forEach(c=>{ const b=document.createElement('button'); const bg=c.rainbow?'conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)':'linear-gradient(135deg,'+c.c[1]+','+c.c[0]+')';
  b.innerHTML='<div class="sw" style="background:'+bg+'"></div>'+c.n; if(s.color===c.id) b.classList.add('on'); b.addEventListener('pointerup',e=>{ e.stopPropagation(); K.V.unlock(); H.dye(c.id); }); co.appendChild(b); }); }
H.open=async function(){ document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show')); const k=K; if(k.st.mode==='sleep') await k.wake(); H.refresh(); setTab(H.needs()?'kamm':tab); panel.classList.add('show');
 const t=k.begin(); k.rest(); k.A.lid=0.1; k.A.low=0.5; k.A.earWig=1; const m=H.mess(), L=H.len(); const line=m>0.7&&L>0.14?'Meine Haare sind ganz zerzaust!':L>0.2?'Meine Haare sind so lang!':'Friseur! Juhu!'; const d=k.say(line); setTimeout(()=>{ if(k.alive(t)) k.rest(); },d*1000+300); };
H.close=()=>{ setTool(null); panel.classList.remove('show'); };
/* Kämmen: mit dem Finger über den Kopf streichen */
function setTool(t){ tool=t; const el=document.getElementById('tool'); if(!el) return; el.innerHTML=t==='comb'?COMB:t==='sponge'?'<span style="font-size:64px">🧽</span>':''; el.style.display='none'; if(panel) panel.querySelector('#hComb').textContent=t==='comb'?'Fertig gekämmt ✔':'Kamm nehmen 🪥'; document.body.classList.toggle('tooling',!!t); }
H.setTool=setTool; H.tool=()=>tool;
let drag=null, combDist=0, lastSay=0;
function onHead(x,y){ const p=K.headScreen?K.headScreen(0.9):[innerWidth/2,innerHeight/3]; const r=Math.min(innerWidth,innerHeight)*0.28; return Math.hypot(x-p[0],(y-p[1])*0.8)<r; }
function toolDown(e){ if(!tool||e.target.closest&&e.target.closest('.panel,#bar,#top,button')) return; e.stopPropagation(); e.preventDefault(); drag={x:e.clientX,y:e.clientY}; const el=document.getElementById('tool'); el.style.display='block'; el.style.left=e.clientX+'px'; el.style.top=e.clientY+'px'; }
function toolMove(e){ if(!tool||!drag) return; e.stopPropagation(); const el=document.getElementById('tool'); el.style.left=e.clientX+'px'; el.style.top=e.clientY+'px'; const d=Math.hypot(e.clientX-drag.x,e.clientY-drag.y); drag.x=e.clientX; drag.y=e.clientY;
 if(!onHead(e.clientX,e.clientY)) return; if(tool==='comb') combStroke(d); else if(tool==='sponge'&&H.onWipe) H.onWipe(d); }
function toolUp(e){ if(!tool||!drag) return; e.stopPropagation(); drag=null; document.getElementById('tool').style.display='none'; }
function combStroke(d){ const s=S(), now=Date.now(); combDist+=d; if(combDist<55) return; combDist=0; K.interact(); const m=H.mess(now); s.m0=Math.max(0,m-0.07); s.ct=now; K.save();
 const A=K.A; A.lid=0.55; A.low=0.6; A.blush=0.6; A.hz=(Math.random()-.5)*0.15; if(Math.random()<0.35) K.V.purr&&K.V.purr(0.6);
 built=''; buildGeo(); fill(); if(m>0.05&&H.mess(now)<=0.05){ K.V.chime(); K.fx('✨','',4); K.xp(2); setTimeout(()=>{ const d=K.say('Schön gekämmt! Danke!'); },200); setTool(null); setTimeout(()=>{ if(K.A) K.rest(); },2500); }
 else if(performance.now()-lastSay>4500){ lastSay=performance.now(); K.say(['Ahh, das ist schön!','Hihi, das ziept!','Weiter so!'][(Math.random()*3)|0]); } }
/* Schneiden */
const wait=ms=>new Promise(r=>setTimeout(r,ms));
H.cut=async function(L){ const k=K, s=S(), cur=H.len(); if(L>=cur-0.004){ k.say('Länger geht nicht! Die wachsen von allein!'); return; }
 const t=k.begin(); k.rest(); k.A.lid=0.3; k.A.earUp=-0.2; k.A.pup=1.2; const el=document.getElementById('tool'); el.innerHTML='<span style="font-size:64px">✂️</span>'; el.style.display='block';
 const c=COLORS.find(x=>x.id===s.color)||COLORS[0]; const steps=8;
 for(let i=0;i<=steps;i++){ const p=k.headScreen(0.93); const x=p[0]+(i/steps-0.5)*Math.min(innerWidth,innerHeight)*0.5, y=p[1]+Math.sin(i)*12; el.style.left=x+'px'; el.style.top=y+'px';
  snip(); for(let j=0;j<3;j++){ const b=document.createElement('div'); b.className='hairbit'; b.style.left=(x+(Math.random()-.5)*40)+'px'; b.style.top=(y+10)+'px'; b.style.background=c.rainbow?'hsl('+(Math.random()*360)+',80%,60%)':c.c[(Math.random()*2)|0]; b.style.setProperty('--dx',((Math.random()-.5)*120)+'px'); b.style.setProperty('--r',((Math.random()-.5)*400)+'deg'); document.body.appendChild(b); setTimeout(()=>b.remove(),1500); }
  s.L0=cur+(L-cur)*(i/steps); s.t0=Date.now(); built=''; buildGeo(); await wait(170); }
 el.style.display='none'; s.L0=L; s.t0=Date.now(); s.m0=0; s.ct=Date.now(); k.save(); H.refresh(); fill(); k.xp(2);
 k.A.lid=0.3; k.A.low=0.7; k.A.blush=1; k.A.earWig=1.2; k.A.hop=0.6; k.fx('✨','',4); await wait(k.say(L<0.05?'Uiii, ganz kurz! Das kitzelt!':'Neuer Haarschnitt! Schick!')*1000+300); if(k.alive(t)){ k.A.hop=0; k.rest(); } };
function snip(){ const V=K.V, c=V.ctx; if(!c) return; const t=c.currentTime+0.01; [0,0.05].forEach((o,i)=>{ const b=c.createBuffer(1,c.sampleRate*0.04,c.sampleRate), d=b.getChannelData(0); for(let j=0;j<d.length;j++) d[j]=(Math.random()*2-1)*Math.exp(-j/(d.length*0.15));
 const s=c.createBufferSource(); s.buffer=b; const f=c.createBiquadFilter(); f.type='highpass'; f.frequency.value=i?4200:2600; const g=c.createGain(); g.gain.value=0.5; s.connect(f).connect(g).connect(V.out); s.start(t+o); }); }
/* Frisur & Farbe */
H.style=async function(id){ const k=K, s=S(), x=STYLES.find(q=>q.id===id); if(H.len()<x.min){ k.say('Dafür sind meine Haare noch zu kurz!'); return; }
 if(k.M.wear&&k.M.wear.hat&&id!=='natur'){ k.toast('🎩 Erst den Hut absetzen – sonst sieht man die Frisur nicht!'); }
 s.style=id; s.m0=0; s.ct=Date.now(); k.save(); const t=k.begin(); k.rest(); k.A.trem=0.6; K.fx('✨','',5); k.V.chime(); await wait(350); H.refresh(); fill(); k.A.trem=0; k.A.lid=0.25; k.A.low=0.7; k.A.blush=0.9; k.A.earWig=1; k.xp(1);
 const L={natur:'Wuschelig!',scheitel:'Sehr elegant!',igel:'Stachelig wie ein Igel!',iro:'Ich bin ein Rocker!',zoepfe:'Zöpfchen! Wie süß!',zopf:'Pferdeschwanz! Hü-hott!',locken:'Locken! Boing, boing!',dutt:'Ein Dutt wie eine Ballerina!'}[id];
 await wait(k.say(L)*1000+300); if(k.alive(t)) k.rest(); };
H.dye=async function(id){ const k=K, s=S(); if(s.color===id) return; const t=k.begin(); k.rest(); k.A.lid=1; k.A.paw=1; const c=COLORS.find(x=>x.id===id);
 const p=k.headScreen(0.98); for(let i=0;i<10;i++) setTimeout(()=>{ const e=document.createElement('div'); e.className='fx'; e.textContent=['✨','🫧','💫'][i%3]; e.style.left=(p[0]+(Math.random()-.5)*180)+'px'; e.style.top=p[1]+'px'; e.style.setProperty('--dx',((Math.random()-.5)*80)+'px'); document.body.appendChild(e); setTimeout(()=>e.remove(),2300); },i*90);
 k.V.noise&&k.V.noise(k.V.t(),0.6,'highpass',3000,0.12,1); await wait(700); s.color=id; k.save(); colorUniforms(); fill(); k.A.paw=0; k.A.lid=0.2; k.A.pup=1.3; k.A.low=0.6; k.A.blush=0.8; k.A.earWig=1.2; k.xp(1);
 const L={natur:'Wieder ganz natürlich!',regen:'Regenbogen-Haare! Wow!',zucker:'Wie Zuckerwatte!'}[id]||('Ich hab jetzt '+c.n.toLowerCase()+'e Haare!'); await wait(k.say(id==='regen'||id==='zucker'||id==='natur'?L:'Neue Haarfarbe! Toll!')*1000+300); if(k.alive(t)) k.rest(); };
H.idleHook=function(r){ if(!H.needs()||r>0.2) return false; const k=K, t=k.begin(); k.rest(); k.A.lookY=0.5; k.A.earUp=-0.3; k.A.lid=0.4; k.A.brow=-0.3;
 const L=H.len()>0.2?['Meine Haare sind sooo lang! Ich seh fast nix!','Friseur bitte! Meine Haare kitzeln!']:['Meine Haare sind ganz zerzaust!','Kämmst du mir die Haare?'];
 const d=k.say(L[(Math.random()*L.length)|0]); setTimeout(()=>{ if(k.alive(t)) k.rest(); },d*1000+500); return true; };
/* Tagesmeldung: Haare gewachsen / zerzaust */
H.events=function(){ const s=S(), out=[]; const L=H.len(); if(s.seenL==null) s.seenL=L; if(L-s.seenL>0.015){ out.push('💇 Giß-Moes Haare sind gewachsen!'+(L>0.17?'<br>Zeit für den Friseur? ✂️':'')); s.seenL=L; }
 if(H.needs()&&s.toldMess!==new Date().toDateString()){ s.toldMess=new Date().toDateString(); out.push('😵 Giß-Moes Haare sind ganz zerzaust!<br>Kämm sie im Friseur-Salon 💇'); } K.save(); return out; };
H.init=function(k){ K=k; THREE=k.THREE; S(); buildMat(); H.refresh(); buildPanel(); };
H._={strand:(...a)=>strand(...a), roots:()=>roots, travel(d){ const s=S(); s.t0-=d*DAY; s.ct-=d*DAY; K.save(); H.refresh(); }, get S(){ return S(); }, STYLES, COLORS, get mesh(){ return mesh; }, buildGeo, setTab, fill};
window.GissHair=H;
})();
