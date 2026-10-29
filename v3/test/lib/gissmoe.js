/* Giß-Moe – eigenes Plüschwesen (Parodie, eigene Umsetzung). Modell: Hunyuan3D-Körper aus eigenem Konzeptbild +
   Schalenfell-Shader, animierte Augen/Lider/Schnabel/Ohren. Stimme: Web-Audio-Formant-Plappern (keine Samples).
   GissMoe.create(THREE,{base:'lib/giss/'}) -> Promise<{group, pick, A (Zielwerte), update(dt,t), setLight(o)}> */
(function(){
const VOW={a:[800,1250],e:[430,2150],i:[300,2500],o:[470,820],u:[330,720],'ä':[650,1750],'ö':[420,1550],'ü':[300,1750],y:[300,1750]};
function Voice(){this.ctx=null;}
Voice.prototype.unlock=function(){
 const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
 if(!this.ctx){ const c=this.ctx=new AC(); this.out=c.createGain(); this.out.gain.value=0.9;
  const comp=c.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; this.out.connect(comp).connect(c.destination);
  const nb=this.nb=c.createBuffer(1,c.sampleRate,c.sampleRate), d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const s=c.createBufferSource(); s.buffer=c.createBuffer(1,1,22050); s.connect(c.destination); s.start(0); }
 if(this.ctx.state!=='running') this.ctx.resume();
};
Voice.prototype.ok=function(){return !!this.ctx&&this.ctx.state==='running';};
Voice.prototype.t=function(){return this.ctx?this.ctx.currentTime:0;};
Voice.prototype.noise=function(t,dur,type,freq,amp,q){ const c=this.ctx; if(!c) return;
 const s=c.createBufferSource(); s.buffer=this.nb; s.loop=true; const f=c.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q||0.8;
 const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(amp,t+Math.min(0.02,dur/3)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
 s.connect(f).connect(g).connect(this.out); s.start(t,Math.random()*0.5); s.stop(t+dur+0.05); return {f,g};
};
Voice.prototype.syl=function(t,dur,f0,f1,vow,o){ const c=this.ctx; if(!c) return; o=o||{};
 const F=VOW[vow]||VOW.a, k=o.fk||1.5, amp=o.amp||0.55;
 const osc=c.createOscillator(); osc.type='sawtooth'; osc.frequency.setValueAtTime(f0,t); osc.frequency.exponentialRampToValueAtTime(Math.max(40,f1),t+dur);
 const lfo=c.createOscillator(); lfo.frequency.value=o.vib||6.5; const lg=c.createGain(); lg.gain.value=f0*(o.vd||0.022); lfo.connect(lg).connect(osc.frequency);
 const env=c.createGain(); env.gain.setValueAtTime(0.0001,t); env.gain.exponentialRampToValueAtTime(amp,t+0.018); env.gain.setValueAtTime(amp,t+dur*0.6); env.gain.exponentialRampToValueAtTime(0.0001,t+dur);
 const b1=c.createBiquadFilter(); b1.type='bandpass'; b1.frequency.value=F[0]*k; b1.Q.value=4.5;
 const b2=c.createBiquadFilter(); b2.type='bandpass'; b2.frequency.value=F[1]*k; b2.Q.value=6; const g2=c.createGain(); g2.gain.value=0.7;
 const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=o.lp||5200;
 const sub=c.createOscillator(); sub.type='sine'; sub.frequency.setValueAtTime(f0,t); sub.frequency.exponentialRampToValueAtTime(Math.max(40,f1),t+dur); const sg=c.createGain(); sg.gain.value=o.sub||0.18;
 osc.connect(b1).connect(env); osc.connect(b2).connect(g2).connect(env); sub.connect(sg).connect(env); env.connect(lp).connect(this.out);
 [osc,lfo,sub].forEach(n=>{n.start(t); n.stop(t+dur+0.05);});
 if(o.cons) this.noise(t-0.012,0.035,'highpass',o.cons==='s'?4200:2400,0.12);
};
function sylls(text){ return (text.toLowerCase().match(/[^aeiouäöüy]*[aeiouäöüy]+/g)||['a']).map(s=>({v:s.match(/[aeiouäöüy]/)[0],c:/^[^aeiouäöüy\s\-!?.,]/.test(s.replace(/^[\s\-!?.,…]+/,''))?(/s|z|c/.test(s[0])?'s':'k'):null})); }
Voice.prototype.say=function(text,o){ o=o||{}; const out=[]; if(!this.ctx) return {dur:0.8,mouth:[[0,0.8]]};
 const S=sylls(text).slice(0,12), n=S.length, p=(o.pitch||1)*(470+Math.random()*40), q=/\?\s*$/.test(text), ex=/!\s*$/.test(text);
 let t=this.t()+0.03, t0=t;
 S.forEach((s,i)=>{ const d=(0.11+Math.random()*0.06)*(o.rate||1)*(i===n-1?1.5:1); const prog=i/Math.max(1,n-1);
  let f=p*(1.08-0.22*prog)*(1+(Math.random()-0.5)*0.12); let f1=f*0.93;
  if(i===n-1&&q){f1=f*1.35;} if(i===n-1&&ex){f*=1.18;f1=f*0.8;}
  this.syl(t,d,f,f1,s.v,{cons:s.c,amp:o.amp}); out.push([t-t0,t-t0+d*0.85]); t+=d+0.035; });
 return {dur:t-t0,mouth:out};
};
Voice.prototype.giggle=function(n){ if(!this.ctx) return {dur:1,mouth:[[0,1]]}; n=n||6; let t=this.t()+0.02,t0=t,m=[];
 for(let i=0;i<n;i++){ const f=820+i*25+Math.random()*60, d=0.075; this.syl(t,d,f,f*0.86,'i',{cons:'k',amp:0.5,vib:11,vd:0.04}); this.noise(t,0.05,'bandpass',3000,0.05,2); m.push([t-t0,t-t0+d]); t+=d+0.05; }
 return {dur:t-t0,mouth:m};
};
Voice.prototype.purr=function(dur){ const c=this.ctx; if(!c) return; const t=this.t()+0.02; dur=dur||2.4;
 const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=62; const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=420;
 const am=c.createGain(); am.gain.value=0.0; const lfo=c.createOscillator(); lfo.frequency.value=24; const lg=c.createGain(); lg.gain.value=0.5; lfo.connect(lg).connect(am.gain);
 const env=c.createGain(); env.gain.setValueAtTime(0.0001,t); env.gain.exponentialRampToValueAtTime(0.55,t+0.3); env.gain.setValueAtTime(0.55,t+dur-0.5); env.gain.exponentialRampToValueAtTime(0.0001,t+dur);
 o.connect(lp).connect(am).connect(env).connect(this.out); [o,lfo].forEach(n=>{n.start(t);n.stop(t+dur+0.1);});
 this.syl(t+0.1,dur*0.8,330,300,'u',{amp:0.12,lp:900,vib:3});
};
Voice.prototype.snore=function(){ if(!this.ctx) return; const t=this.t()+0.02;
 const a=this.noise(t,1.3,'bandpass',420,0.25,1.2); if(a) a.f.frequency.exponentialRampToValueAtTime(700,t+1.2);
 this.syl(t+1.45,0.9,980,560,'ü',{amp:0.16,sub:0.3,vib:2,lp:1800}); this.noise(t+1.4,1.0,'bandpass',1200,0.08,1);
};
Voice.prototype.sneeze=function(){ if(!this.ctx) return {dur:1.2,mouth:[[0,0.3],[0.4,0.7],[0.9,1.2]]}; const t=this.t()+0.02;
 this.syl(t,0.22,520,700,'a',{cons:'k',amp:0.4}); this.syl(t+0.42,0.25,600,820,'a',{cons:'k',amp:0.45});
 this.noise(t+0.85,0.32,'highpass',3200,0.6,0.7); this.syl(t+0.88,0.16,900,500,'i',{amp:0.45});
 return {dur:1.25,mouth:[[0,0.2],[0.42,0.65],[0.85,1.15]]};
};
Voice.prototype.burp=function(){ const c=this.ctx; if(!c) return {dur:0.6,mouth:[[0,0.6]]}; const t=this.t()+0.02;
 const o=c.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(95,t+0.5);
 const am=c.createGain(); const lfo=c.createOscillator(); lfo.frequency.value=34; const lg=c.createGain(); lg.gain.value=0.4; lfo.connect(lg).connect(am.gain);
 const lp=c.createBiquadFilter(); lp.type='bandpass'; lp.frequency.value=520; lp.Q.value=1.5;
 const env=c.createGain(); env.gain.setValueAtTime(0.0001,t); env.gain.exponentialRampToValueAtTime(0.9,t+0.04); env.gain.exponentialRampToValueAtTime(0.0001,t+0.55);
 o.connect(lp).connect(am).connect(env).connect(this.out); [o,lfo].forEach(n=>{n.start(t);n.stop(t+0.6);}); return {dur:0.6,mouth:[[0,0.55]]};
};
Voice.prototype.yawn=function(){ if(!this.ctx) return {dur:1.3,mouth:[[0,1.2]]}; const t=this.t()+0.02; this.syl(t,1.2,560,300,'a',{amp:0.35,vib:4,vd:0.01}); this.noise(t,1.2,'bandpass',900,0.06,1); return {dur:1.3,mouth:[[0,1.15]]}; };
Voice.prototype.whine=function(){ if(!this.ctx) return {dur:1,mouth:[[0,1]]}; const t=this.t()+0.02; this.syl(t,0.45,760,600,'ü',{amp:0.4,vib:8,vd:0.05}); this.syl(t+0.5,0.6,700,430,'ü',{amp:0.4,vib:8,vd:0.05}); return {dur:1.1,mouth:[[0,0.45],[0.5,1.1]]}; };
Voice.prototype.chomp=function(n){ if(!this.ctx) return; let t=this.t()+0.02; for(let i=0;i<(n||3);i++){ this.noise(t,0.07,'lowpass',1400,0.5); this.noise(t+0.02,0.05,'bandpass',3500,0.12,3); t+=0.22; } };
Voice.prototype.chime=function(){ const c=this.ctx; if(!c) return; let t=this.t()+0.02; [1046,1318,1568,2093].forEach((f,i)=>{ const o=c.createOscillator(); o.type='sine'; o.frequency.value=f; const g=c.createGain(); g.gain.setValueAtTime(0.0001,t+i*0.09); g.gain.exponentialRampToValueAtTime(0.18,t+i*0.09+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+i*0.09+0.9); o.connect(g).connect(this.out); o.start(t+i*0.09); o.stop(t+i*0.09+1); }); };
Voice.prototype.clap=function(){ if(!this.ctx) return; const t=this.t()+0.005; this.noise(t,0.09,'bandpass',1500,0.7,1.2); this.noise(t+0.012,0.06,'highpass',3000,0.3); };
Voice.prototype.pop=function(){ if(!this.ctx) return; const t=this.t()+0.01; this.syl(t,0.08,500,1100,'o',{amp:0.3}); };
// eigene kleine Melodie (frei erfunden), Noten in Halbtönen über A4
const SONG=[[3,1],[5,1],[7,1],[10,2],[7,1],[5,1],[3,2],[0,1],[3,1],[5,1],[3,3]];
const LA=['lu','la','di','da','lu','li','duu','ba','du','la','luu'];
Voice.prototype.sing=function(speed,hum){ if(!this.ctx) return {dur:5,mouth:[[0,5]]}; speed=speed||1; let t=this.t()+0.05,t0=t,m=[];
 SONG.forEach((n,i)=>{ const f=440*Math.pow(2,n[0]/12), d=0.26*n[1]/speed; const s=sylls(LA[i])[0];
  this.syl(t,d*0.92,f,f*1.003,hum?'u':s.v,{cons:hum?null:s.c,amp:hum?0.25:0.45,vib:5.5,vd:0.018,fk:1.4,lp:hum?900:5200}); m.push([t-t0,t-t0+d*0.85]); t+=d; });
 return {dur:t-t0,mouth:hum?[]:m};
};
Voice.prototype.panic=function(){ if(!this.ctx) return {dur:1,mouth:[[0,1]]}; let t=this.t()+0.02,t0=t,m=[]; for(let i=0;i<5;i++){ this.syl(t,0.09,950+i*40,1100,'a',{cons:'k',amp:0.45,vib:14,vd:0.05}); m.push([t-t0,t-t0+0.09]); t+=0.13; } return {dur:t-t0,mouth:m}; };

/* ---------------- Modell ---------------- */
const VS=`attribute float shell; attribute float fw;
uniform float uN,uLen,uTime,uBreath,uSq; uniform mat3 uHeadM; uniform vec3 uNeck,uBeak; uniform vec2 uEarL,uEarR;
varying vec2 vUv; varying float vFw,vH; varying vec3 vP,vN,vW;
mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
void main(){ vec3 p=position, n=normal; float side=p.x<0.?-1.:1.;
 float we=smoothstep(0.20,0.42,abs(p.x))*smoothstep(0.50,0.66,p.y);
 vec2 ea=side<0.?uEarL:uEarR; vec3 piv=vec3(side*0.24,0.80,0.10);
 mat3 R=rotZ(side*ea.x*we)*rotY(-side*ea.y*we); p=piv+R*(p-piv); n=R*n;
 float wh=smoothstep(0.42,0.58,position.y);
 p=mix(p,uNeck+uHeadM*(p-uNeck),wh); n=normalize(mix(n,uHeadM*n,wh));
 float body=1.-wh; p.xz*=1.+uBreath*0.03*body; p.y*=1.+uBreath*0.008;
 p.y*=1.-uSq; p.xz*=1.+uSq*0.55;
 float h=shell/uN; vH=h;
 float len=uLen*(1.-0.75*smoothstep(0.15,0.07,position.y))*smoothstep(0.03,0.075,distance(position,uBeak))*(1.+0.35*we);
 vec3 q=p+n*len*h; q.y-=len*h*h*0.45; q.x+=sin(uTime*1.7+position.y*11.)*0.0025*h*h;
 vUv=uv; vFw=fw; vP=position; vec4 w=modelMatrix*vec4(q,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*n);
 gl_Position=projectionMatrix*viewMatrix*w; }`;
const FS=`uniform sampler2D uTex; uniform vec3 uBack,uKeyDir,uKeyCol,uFillDir,uFillCol,uSky,uGround,uRim,uTint,uGlow; uniform float uDens,uHue,uChoco;
vec3 hueRot(vec3 c,float a){ const vec3 k=vec3(0.57735); float ca=cos(a); return c*ca+cross(k,c)*sin(a)+k*dot(k,c)*(1.-ca); }
varying vec2 vUv; varying float vFw,vH; varying vec3 vP,vN,vW;
float hs(vec3 p){p=fract(p*0.3183099+vec3(.1,.2,.3));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float cb(vec3 p,vec3 c,vec3 r){ float n=hs(floor(p*70.))-0.5; return 1.-smoothstep(0.75,1.,length((p-c)/r)+n*0.3+sin(p.x*90.)*sin(p.y*80.)*0.08); }
void main(){ float h=vH; vec3 q=vP*uDens; vec3 c=floor(q); vec3 f=fract(q);
 float r=hs(c); vec3 o=vec3(hs(c+3.1),hs(c+7.7),hs(c+1.9))*0.5+0.25; float d=length(f-o);
 if(h>0.001){ if(d>0.62*(1.-h*0.8) || r<h*0.9) discard; }
 vec3 tex=texture2D(uTex,vUv).rgb; float mx=max(tex.r,max(tex.g,tex.b)), sat=mx-min(tex.r,min(tex.g,tex.b)); float gr=(1.-smoothstep(0.05,0.13,sat))*(1.-smoothstep(0.58,0.72,mx)); tex=mix(tex,uBack,gr); vec3 base=mix(uBack,tex,vFw);
 if(uHue!=0.) base=max(hueRot(base,uHue+vP.y*2.5*sign(uHue)),0.); base*=uTint;
 float cm=0.; if(uChoco>0.01&&vP.z>0.12){ cm=max(max(cb(vP,vec3(0.0,0.565,0.31),vec3(0.13,0.06,0.25)),cb(vP,vec3(-0.15,0.61,0.27),vec3(0.06,0.05,0.2))),max(cb(vP,vec3(0.16,0.655,0.26),vec3(0.035,0.04,0.2)),cb(vP,vec3(0.06,0.515,0.3),vec3(0.03,0.05,0.2)))); cm*=smoothstep(0.,0.25,uChoco)*step(1.-uChoco*1.15,hs(floor(vP*40.)+5.)*0.5+0.5*cm); base=mix(base,vec3(0.15,0.065,0.03),cm*0.95); }
 base*=0.86+0.28*r; base*=mix(0.5,1.1,h);
 vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW);
 float dk=max(0.,(dot(N,uKeyDir)+0.35)/1.35), df=max(0.,(dot(N,uFillDir)+0.5)/1.5);
 vec3 amb=mix(uGround,uSky,N.y*0.5+0.5);
 float rim=pow(1.-max(0.,dot(N,V)),3.)*(0.25+0.75*h);
 vec3 col=base*(amb+uKeyCol*dk+uFillCol*df)+uRim*rim*base;
 col+=uGlow*(0.4+0.6*h); if(cm>0.){ vec3 Rr=reflect(-normalize(uKeyDir),N); col+=uKeyCol*pow(max(0.,dot(Rr,V)),14.)*0.55*cm; }
 gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
async function create(THREE,opt){ opt=opt||{}; const base=opt.base||'lib/giss/'; const NS=opt.shells||20;
 const [buf,LM,tex]=await Promise.all([fetch(base+'giss_mesh.bin').then(r=>r.arrayBuffer()),fetch(base+'giss_lm.json').then(r=>r.json()),
  new Promise((res,rej)=>new THREE.TextureLoader().load(base+'giss_tex.jpg',res,undefined,rej))]);
 tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4;
 const hd=new Uint32Array(buf,0,2), nv=hd[0], ni=hd[1]; let o=8;
 const pos=new Float32Array(buf,o,nv*3); o+=nv*12; const nor=new Float32Array(buf,o,nv*3); o+=nv*12; const uv=new Float32Array(buf,o,nv*2); o+=nv*8;
 const fwB=new Uint8Array(buf,o,nv); o+=nv+((4-nv%4)%4); const idx=new Uint16Array(buf,o,ni);
 const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
 g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); const fwF=new Float32Array(nv); for(let i=0;i<nv;i++) fwF[i]=fwB[i]/255; g.setAttribute('fw',new THREE.BufferAttribute(fwF,1));
 g.setIndex(new THREE.BufferAttribute(idx,1)); g.computeBoundingSphere();
 const ig=new THREE.InstancedBufferGeometry(); ig.index=g.index; for(const k in g.attributes) ig.setAttribute(k,g.attributes[k]);
 const sh=new Float32Array(NS+1); for(let i=0;i<=NS;i++) sh[i]=i; ig.setAttribute('shell',new THREE.InstancedBufferAttribute(sh,1)); ig.instanceCount=NS+1;
 ig.boundingSphere=g.boundingSphere.clone(); ig.boundingSphere.radius+=0.1;
 const headM=new THREE.Matrix3();
 const U={uTex:{value:tex},uN:{value:NS},uLen:{value:opt.furLen||0.042},uTime:{value:0},uBreath:{value:0},uSq:{value:0},uDens:{value:opt.dens||150},
  uHeadM:{value:headM},uNeck:{value:new THREE.Vector3(0,0.50,0.02)},uBeak:{value:new THREE.Vector3().fromArray(LM.beak)},uEarL:{value:new THREE.Vector2()},uEarR:{value:new THREE.Vector2()},
  uBack:{value:new THREE.Color(0.66,0.48,0.33)},uKeyDir:{value:new THREE.Vector3(-0.5,0.7,0.6).normalize()},uKeyCol:{value:new THREE.Color(1.2,1.0,0.8)},
  uFillDir:{value:new THREE.Vector3(0.7,0.2,0.5).normalize()},uFillCol:{value:new THREE.Color(0.25,0.22,0.25)},uSky:{value:new THREE.Color(0.35,0.3,0.28)},uGround:{value:new THREE.Color(0.15,0.1,0.08)},uRim:{value:new THREE.Color(0.6,0.45,0.3)},uTint:{value:new THREE.Color(1,1,1)},uChoco:{value:0},uGlow:{value:new THREE.Color(0,0,0)},uHue:{value:0}};
 const mat=new THREE.ShaderMaterial({uniforms:U,vertexShader:VS,fragmentShader:FS});
 const fur=new THREE.Mesh(ig,mat); fur.frustumCulled=false;
 const group=new THREE.Group(); group.name='gissmoe'; const root=new THREE.Group(); group.add(root); root.add(fur);
 const pick=new THREE.Mesh(g,new THREE.MeshBasicMaterial({visible:false})); pick.name='g_body'; root.add(pick);
 // Kopfgruppe (folgt uHeadM um uNeck)
 const head=new THREE.Group(); root.add(head);
 // Augen v3: große runde Furby-Augen – warme Bernstein-Iris mit weichem Verlauf, großer Pupille (prozedural, weitet sich mit C.pup),
// weiche Glanzlichter, kein Weiß, keine harten Ränder; Lider in Fellfarbe, sanftes automatisches Blinzeln.
const eyeMat=new THREE.MeshPhysicalMaterial({color:0x2a160b,roughness:0.35,clearcoat:0.6,clearcoatRoughness:0.2,metalness:0});
const irisMat=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:0.28,clearcoat:1,clearcoatRoughness:0.06,emissive:0x000000});
const uPupR={value:0.5};
irisMat.onBeforeCompile=sh=>{ sh.uniforms.uPupR=uPupR;
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vEU;').replace('#include <begin_vertex>','#include <begin_vertex>\nvEU=uv;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vEU; uniform float uPupR;').replace('#include <color_fragment>',`#include <color_fragment>
  { vec2 q=vEU-0.5; float r=length(q)*2.0; float an=atan(q.y,q.x);
    vec3 cIn=vec3(0.98,0.68,0.26), cMid=vec3(0.80,0.42,0.13), cOut=vec3(0.5,0.24,0.08), cRim=vec3(0.165,0.086,0.043);
    float st=0.5+0.5*sin(an*23.0+sin(an*7.0)*1.7)*0.6+0.25*sin(an*41.0+1.3);
    vec3 ir=mix(cIn,cMid,smoothstep(uPupR,0.74,r)); ir=mix(ir,cOut,smoothstep(0.66,0.93,r));
    ir*=0.9+0.16*st*smoothstep(uPupR,uPupR+0.12,r)*(1.0-smoothstep(0.75,0.95,r));
    ir+=vec3(0.10,0.06,0.0)*(1.0-smoothstep(uPupR,uPupR+0.18,r));
    ir=mix(ir,cRim,smoothstep(0.86,1.0,r)*0.85);
    vec3 pu=vec3(0.03,0.018,0.012); pu+=vec3(0.05,0.025,0.01)*(1.0-smoothstep(0.0,uPupR,r));
    diffuseColor.rgb=mix(pu,ir,smoothstep(uPupR-0.035,uPupR+0.035,r)); }`); };
const hiT=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.45,'rgba(255,253,245,0.95)'); g.addColorStop(0.75,'rgba(255,250,235,0.35)'); g.addColorStop(1,'rgba(255,250,235,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
const hiMat=new THREE.MeshBasicMaterial({map:hiT,transparent:true,depthWrite:false,toneMapped:false});
const lidMat=new THREE.MeshStandardMaterial({color:0xd9c2a3,roughness:0.95,side:THREE.DoubleSide});
const lashMat=new THREE.MeshStandardMaterial({color:0x6a4429,roughness:0.95,transparent:true,opacity:0.8});
const ER=opt.eyeR||0.069; const eyes=[];
// Kugelkappe mit planaren UVs (Iris liegt auf der Augenkugel, Front = +z)
function capGeo(R,ang){ const g=new THREE.SphereGeometry(R,48,24,0,Math.PI*2,0,ang); g.rotateX(Math.PI/2); const P=g.attributes.position, uv=g.attributes.uv, m=R*Math.sin(ang);
 for(let i=0;i<P.count;i++) uv.setXY(i,P.getX(i)/(2*m)+0.5,P.getY(i)/(2*m)+0.5); return g; }
const irisGeo=capGeo(ER*1.004,1.1);
[LM.eyeL,LM.eyeR].forEach((p,i)=>{ const e=new THREE.Group(); e.position.set(p[0]*1.06,p[1]+0.008,p[2]-0.012); head.add(e);
 const ball=new THREE.Mesh(new THREE.SphereGeometry(ER,32,24),eyeMat); ball.name='g_eye'; e.add(ball);
 const look=new THREE.Group(); e.add(look);
 const iris=new THREE.Mesh(irisGeo,irisMat); iris.name='g_eye'; look.add(iris);
 const pup=new THREE.Object3D(); look.add(pup);
 const hl=(sz,x,y)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),hiMat); const n=new THREE.Vector3(x,y,Math.sqrt(Math.max(0,1-x*x-y*y))); m.position.copy(n).multiplyScalar(ER*1.03); m.lookAt(n.clone().multiplyScalar(ER*2)); m.renderOrder=3; e.add(m); return m; };
 const h1=hl(ER*0.44,-0.30,0.34), h2=hl(ER*0.2,0.30,-0.24);
 const lidP=new THREE.Group(); e.add(lidP);
 const lid=new THREE.Mesh(new THREE.SphereGeometry(ER*1.07,32,12,0,Math.PI*2,0,Math.PI/2),lidMat); lidP.add(lid);
 const lash=new THREE.Mesh(new THREE.TorusGeometry(ER*1.07,ER*0.035,6,32,Math.PI*0.9),lashMat); lash.rotation.set(Math.PI/2,0,Math.PI*0.05); lidP.add(lash);
 const low=new THREE.Mesh(new THREE.SphereGeometry(ER*1.05,32,8,0,Math.PI*2,Math.PI/2,Math.PI/2),lidMat); const lowP=new THREE.Group(); lowP.add(low); e.add(lowP);
 eyes.push({e,look,lidP,lowP,pup,hl:[h1,h2]});
});
// sanftes Blinzeln (unabhängig von A.lid): alle 2.5–6 s, manchmal doppelt
const BL={next:2.5,t:-1,dbl:false,shown:false}; function blinkAmt(t){ if(BL.t<0&&t>BL.next){ BL.t=t; BL.dbl=Math.random()<0.18; BL.shown=false; } if(BL.t<0) return 0; const d=t-BL.t, D=0.26;
 if(d<D){ const v=Math.pow(Math.sin(Math.PI*d/D),1.4); if(v>0.6) BL.shown=true; return v; } if(!BL.shown){ BL.shown=true; return 0.9; } /* bei wenig fps trotzdem sichtbar */ if(BL.dbl&&d<D*2.1){ return d<D*1.1?0:Math.pow(Math.sin(Math.PI*(d-D*1.1)/D),1.4); } BL.t=-1; BL.next=t+2.5+Math.random()*3.5; return 0; }
const beakMat=new THREE.MeshPhysicalMaterial({color:0xd99a72,roughness:0.45,clearcoat:0.4,sheen:0.6,sheenColor:new THREE.Color(0xffd0b0)});
 const B=LM.beak; const beak=new THREE.Group(); beak.position.set(B[0],B[1]+0.004,B[2]-0.012); head.add(beak);
 const up=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),beakMat); up.scale.set(0.05,0.026,0.04); up.position.set(0,0.006,0.012); up.name='g_beak'; beak.add(up);
 const mouth=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshStandardMaterial({color:0x5a1820,roughness:0.6})); mouth.scale.set(0.034,0.02,0.03); mouth.position.set(0,-0.012,0.004); beak.add(mouth);
 const jaw=new THREE.Group(); jaw.position.set(0,-0.006,-0.012); beak.add(jaw);
 const lo=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),beakMat); lo.scale.set(0.038,0.017,0.032); lo.position.set(0,-0.012,0.03); lo.name='g_beak'; jaw.add(lo);
 const tongue=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshStandardMaterial({color:0xd8707a,roughness:0.5})); tongue.scale.set(0.022,0.008,0.02); tongue.position.set(0,-0.006,0.026); jaw.add(tongue);
 // Wangen-Röte (weich)
 const bc=document.createElement('canvas'); bc.width=bc.height=64; const bx=bc.getContext('2d'); const gr=bx.createRadialGradient(32,32,2,32,32,30); gr.addColorStop(0,'rgba(255,120,130,0.55)'); gr.addColorStop(1,'rgba(255,120,130,0)'); bx.fillStyle=gr; bx.fillRect(0,0,64,64);
 const blushT=new THREE.CanvasTexture(bc); const blushM=new THREE.MeshBasicMaterial({map:blushT,transparent:true,depthWrite:false,opacity:0});
 const blush=[-1,1].map(s=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(0.09,0.06),blushM); m.position.set(s*0.17,LM.eyeL[1]-0.075,LM.eyeL[2]+0.05); m.rotation.y=s*0.45; head.add(m); return m;});
 // Animationszustand: A = Ziel, C = aktuell
 // Pfötchen (nur zum Augen-Zuhalten): gleiche Fell-Shader, eigene Kugel
 const pg=new THREE.SphereGeometry(1,28,20); pg.scale(0.075,0.095,0.07); const pn=pg.attributes.position.count; pg.setAttribute('fw',new THREE.BufferAttribute(new Float32Array(pn),1));
 const pig=new THREE.InstancedBufferGeometry(); pig.index=pg.index; for(const k in pg.attributes) pig.setAttribute(k,pg.attributes[k]); pig.setAttribute('shell',ig.attributes.shell); pig.instanceCount=NS+1;
 const paws=[0,1].map(()=>{ const m=new THREE.Mesh(pig,mat); m.frustumCulled=false; m.visible=false; root.add(m); return m; });
 const A={paw:0,lid:0.04,low:0,jaw:0,earUp:0,earFwd:0,earWig:0,hx:0,hy:0,hz:0,sq:0,lift:0,trem:0,lookX:0,lookY:0,pup:1,blush:0,brow:0,bodyZ:0,bodyY:0,hop:0,spinEyes:0,glow:0,belly:0};
 const C=Object.assign({},A); const tmpE=new THREE.Euler(), tmpM=new THREE.Matrix4();
 function update(dt,t){ U.uTime.value=t; const k=1-Math.exp(-dt*12), k2=1-Math.exp(-dt*6);
  for(const n in A){ C[n]+= (A[n]-C[n])*((n==='jaw'||n==='lid')?Math.min(1,k*1.6):(n==='lift'||n==='hop'?k2:k)); }
  U.uBreath.value=Math.sin(t*2.1)*(A.sleepB?1.6:1); 
  const wig=Math.sin(t*14)*C.earWig*0.25;
  U.uEarL.value.set(C.earUp+wig,C.earFwd); U.uEarR.value.set(C.earUp-wig,C.earFwd);
  tmpE.set(C.hx,C.hy,C.hz); tmpM.makeRotationFromEuler(tmpE); headM.setFromMatrix4(tmpM);
  const nk=U.uNeck.value; head.position.copy(nk); head.quaternion.setFromEuler(tmpE); head.position.sub(nk.clone().applyQuaternion(head.quaternion));
  U.uSq.value=C.sq;
  const tr=C.trem*Math.sin(t*55)*0.008;
  root.position.set(tr,C.lift+Math.abs(Math.sin(t*9))*C.hop*0.12,C.bodyZ); root.rotation.set(0,C.bodyY,Math.sin(t*4.5)*C.hop*0.12+Math.sin(t*1.6)*C.lift*0.15);
  root.scale.set(1+C.sq*0.4,1-C.sq*0.8,1+C.sq*0.4); root.position.y+=0;
  const bl=(C.lid<0.7&&!A.noBlink)?blinkAmt(t):0; eyes.forEach((E,i)=>{ const L0=Math.max(-0.05,Math.min(1,C.lid)); const L=Math.max(L0,0.06,bl*0.98); E.lidP.rotation.x=-1.62+L*3.1; E.hl[0].visible=E.hl[1].visible=L<0.62; E.lidP.rotation.z=(i?-1:1)*C.brow*0.5;
   const lw=Math.max(0.08,C.low,bl*0.25); E.lowP.visible=true; E.lowP.rotation.x=0.95-lw*1.0;
   let lx=C.lookX, ly=C.lookY; if(C.spinEyes>0.05){ lx=Math.cos(t*9+(i?Math.PI:0))*0.35*C.spinEyes; ly=Math.sin(t*9+(i?Math.PI:0))*0.35*C.spinEyes; }
   E.look.rotation.set(-ly*0.5,lx*0.6,0); });
 uPupR.value=Math.max(0.3,Math.min(0.68,0.5*C.pup));
  jaw.rotation.x=C.jaw*0.55; irisMat.emissive.setRGB(C.glow*0.9,C.glow*0.75,C.glow*0.3);
  paws.forEach((P,i)=>{ const s=i?1:-1; if(C.belly>C.paw&&C.belly>0.02){ const b=C.belly, w=Math.sin(t*5+(i?1.6:0))*0.025*b; P.visible=true; P.position.set(s*(0.30-0.17*b)+w,0.40-0.13*b+Math.cos(t*5+(i?1.6:0))*0.012*b,0.12+0.24*b); P.scale.setScalar(0.55+0.45*b); P.rotation.set(0,0,s*(0.6+0.5*b)); return; } const k=C.paw; P.visible=k>0.02; P.rotation.set(0,0,0); P.position.set(s*(0.30-0.20*k),0.40+0.33*k,0.12+0.24*k); P.scale.setScalar(0.55+0.45*k); P.rotation.z=s*(0.6-0.9*k); P.quaternion.premultiply(head.quaternion.clone().slerp(new THREE.Quaternion(),1-k)); }); blushM.opacity=C.blush*0.9;
 }
 return {geo:g,jaw,beak,irisMat,group,root,head,pick,picks:[pick,...head.children.flatMap(c=>c.children||[])],A,C,U,LM,update,eyes};
}
window.GissMoe={create,Voice};
})();
