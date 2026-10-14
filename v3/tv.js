// Rewind V3 – Röhrenfernseher 1984 (A-Frame-Komponente, eigene Arbeit)
(function(){
let AC=null; function ac(){ if(!AC&&window.__zsActx&&window.__zsActx()) AC=window.__zsActx(); if(!AC){ AC=new (window.AudioContext||window.webkitAudioContext)(); } if(AC.state==='suspended') AC.resume(); return AC; }
function testcard(){ const c=document.createElement('canvas'); c.width=640; c.height=480; const x=c.getContext('2d');
 x.fillStyle='#777'; x.fillRect(0,0,640,480); x.strokeStyle='#fff'; x.lineWidth=2; for(let i=0;i<=640;i+=40){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,480); x.stroke(); } for(let j=0;j<=480;j+=40){ x.beginPath(); x.moveTo(0,j); x.lineTo(640,j); x.stroke(); }
 x.save(); x.beginPath(); x.arc(320,240,200,0,7); x.clip(); x.fillStyle='#202020'; x.fillRect(0,0,640,480);
 const bars=['#c0c0c0','#c0c000','#00c0c0','#00c000','#c000c0','#c00000','#0000c0','#101010']; bars.forEach((b,i)=>{ x.fillStyle=b; x.fillRect(120+i*50,90,50,120); });
 for(let i=0;i<8;i++){ const v=Math.round(i/7*255); x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(120+i*50,215,50,50); }
 x.fillStyle='#000'; x.fillRect(120,270,400,40); x.fillStyle='#fff'; for(let i=0;i<20;i++){ const w=2+Math.floor(i/4); x.fillRect(140+i*18,275,w,30); }
 x.fillStyle='#fff'; x.fillRect(240,320,160,46); x.fillStyle='#000'; x.font='bold 34px Arial'; x.textAlign='center'; x.fillText('ZS 1984',320,356);
 x.fillStyle='#c00000'; x.fillRect(120,375,200,60); x.fillStyle='#0000c0'; x.fillRect(320,375,200,60); x.restore();
 x.strokeStyle='#fff'; x.lineWidth=4; x.beginPath(); x.arc(320,240,200,0,7); x.stroke(); x.beginPath(); x.moveTo(320,40); x.lineTo(320,440); x.moveTo(120,240); x.lineTo(520,240); x.lineWidth=1.5; x.stroke();
 [[60,60],[580,60],[60,420],[580,420]].forEach(p=>{ x.beginPath(); x.arc(p[0],p[1],26,0,7); x.fillStyle='#000'; x.fill(); x.strokeStyle='#fff'; x.lineWidth=3; x.stroke(); });
 const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
function woodTex(){ const c=document.createElement('canvas'); c.width=512; c.height=512; const x=c.getContext('2d'); x.fillStyle='#5a3418'; x.fillRect(0,0,512,512);
 for(let i=0;i<220;i++){ const y=Math.random()*512, a=0.05+Math.random()*0.15; x.strokeStyle=Math.random()<0.5?`rgba(30,15,5,${a})`:`rgba(140,90,50,${a})`; x.lineWidth=0.5+Math.random()*2.5; x.beginPath(); for(let t=0;t<=512;t+=16) x.lineTo(t,y+Math.sin(t/60+i)*4+Math.sin(t/13)*1); x.stroke(); }
 const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
const VS=`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const FS=`precision mediump float; varying vec2 vUv; uniform sampler2D map; uniform float t,power,stat,roll,aspect,hasTex;
float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
vec3 samp(vec2 uv){ // Pillarbox: Bild zentriert, Rest schwarz (Bildschirm 4:3)
 float sa=4./3.; vec2 q=uv; if(aspect<sa){ float w=aspect/sa; q.x=(uv.x-0.5)/w+0.5; } else { float hh=sa/aspect; q.y=(uv.y-0.5)/hh+0.5; }
 if(q.x<0.||q.x>1.||q.y<0.||q.y>1.) return vec3(0.); return texture2D(map,q).rgb; }
void main(){ vec2 uv=vUv*2.-1.; uv*=1.+0.08*dot(uv,uv); vec2 p=uv*0.5+0.5;            // Röhrenwölbung
 if(p.x<0.||p.x>1.||p.y<0.||p.y>1.){ gl_FragColor=vec4(0.,0.,0.,1.); return; }
 vec2 pr=p; pr.y=fract(pr.y+roll);
 vec3 c=hasTex>0.5?samp(pr):vec3(0.);
 vec3 bl=(samp(pr+vec2(.004,0.))+samp(pr-vec2(.004,0.))+samp(pr+vec2(0.,.005))+samp(pr-vec2(0.,.005)))*0.25; c+=max(bl-0.55,0.)*0.8;   // etwas Bloom
 float n=h(floor(p*vec2(320.,240.))+floor(t*30.)); c=mix(c,vec3(n),stat);
 if(roll>0.001){ float bar=smoothstep(0.0,0.04,abs(fract(p.y+roll)-0.02)); c*=bar; }
 c*=0.82+0.18*sin(p.y*240.*3.14159);                                             // Scanlines
 c*=1.-0.35*dot(uv,uv)*0.5;                                                        // Randabfall
 // Einschalten: Punkt -> Linie -> Bild
 float pw=clamp(power,0.,1.); vec2 d=abs(p-0.5); float ex=smoothstep(0.,0.35,pw), ey=smoothstep(0.25,1.,pw);
 float m=step(d.x,0.01+0.49*ex)*step(d.y,0.004+0.496*ey); float dot0=(1.-ey)*smoothstep(0.03,0.,length(p-0.5))*step(0.001,pw);
 c=c*m+vec3(1.)*dot0*1.5+vec3(0.06,0.07,0.08)*(1.-m)*0.;
 gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
}`;
AFRAME.registerComponent('crt-tv',{
 schema:{channels:{type:'array',default:[]}, model:{default:''}, scr:{type:'vec4',default:{x:0.0,y:0.243,z:0.315,w:0.245}}, scrZ:{default:0.112}, scale:{default:1}, base:{default:''}, start:{default:0}, music:{default:''}},
 init(){ const T=THREE, g=new T.Group(), s=this.data.scale; this.el.setObject3D('tv',g); g.scale.setScalar(s);
  const wood=new T.MeshStandardMaterial({map:woodTex(),roughness:0.55}), dark=new T.MeshStandardMaterial({color:0x1b1b1d,roughness:0.5}), chrome=new T.MeshStandardMaterial({color:0xcfcfd4,metalness:0.9,roughness:0.25});
  const W=0.66,H=0.5,D=0.46; const caseM=new T.Mesh(new T.BoxGeometry(W,H,D),wood); caseM.position.y=H/2; g.add(caseM);
  const bez=new T.Mesh(new T.BoxGeometry(0.46,0.38,0.02),dark); bez.position.set(-0.08,H/2,D/2+0.005); g.add(bez);
  const sg=new T.PlaneGeometry(0.42,0.315,32,24); const pa=sg.attributes.position; for(let i=0;i<pa.count;i++){ const x=pa.getX(i)/0.21, y=pa.getY(i)/0.1575; pa.setZ(i,0.018*(1-0.5*(x*x+y*y))); } sg.computeVertexNormals();
  this.U={map:{value:null},t:{value:0},power:{value:0},stat:{value:0},roll:{value:0},aspect:{value:4/3},hasTex:{value:0}};
  const scr=new T.Mesh(sg,new T.ShaderMaterial({uniforms:this.U,vertexShader:VS,fragmentShader:FS})); scr.position.set(-0.08,H/2,D/2+0.016); g.add(scr); this.screen=scr;
  const glass=new T.Mesh(sg,new T.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:0.08,roughness:0.05,metalness:0,clearcoat:1})); glass.position.copy(scr.position); glass.position.z+=0.002; g.add(glass);
  const panel=new T.Mesh(new T.BoxGeometry(0.14,0.38,0.02),dark); panel.position.set(0.25,H/2,D/2+0.005); g.add(panel);
  const knob=new T.Mesh(new T.CylinderGeometry(0.032,0.034,0.03,24),chrome); knob.rotation.x=Math.PI/2; knob.position.set(0.25,H/2+0.09,D/2+0.03); g.add(knob); this.knob=knob;
  const tick=new T.Mesh(new T.BoxGeometry(0.004,0.022,0.004),dark); tick.position.set(0,0.017,0.0); knob.add(tick); tick.rotation.x=-Math.PI/2; tick.position.set(0,0.016,0.012);
  for(let i=0;i<14;i++){ const a=i/14*Math.PI*2; const d=new T.Mesh(new T.BoxGeometry(0.003,0.008,0.002),chrome); d.position.set(0.25+Math.sin(a)*0.045,H/2+0.09+Math.cos(a)*0.045,D/2+0.016); d.rotation.z=-a; g.add(d); }
  const btn=new T.Mesh(new T.BoxGeometry(0.05,0.022,0.02),chrome); btn.position.set(0.25,H/2-0.08,D/2+0.02); g.add(btn); this.btn=btn;
  this.led=new T.Mesh(new T.CircleGeometry(0.005,12),new T.MeshBasicMaterial({color:0x330000})); this.led.position.set(0.25,H/2-0.12,D/2+0.016); g.add(this.led);
  const gr=new T.Mesh(new T.BoxGeometry(0.1,0.08,0.002),new T.MeshStandardMaterial({color:0x111111,roughness:0.9})); gr.position.set(0.25,H/2-0.01,D/2+0.016); g.add(gr);
  for(const lx of [-0.26,0.26]) for(const lz of [-0.17,0.17]){ const l=new T.Mesh(new T.CylinderGeometry(0.012,0.016,0.05,10),dark); l.position.set(lx,-0.025,lz); g.add(l); }
  const kh=new T.Mesh(new T.SphereGeometry(0.06,8,6),new T.MeshBasicMaterial({visible:false})); kh.position.copy(knob.position); g.add(kh); this.knobHit=kh; const bh=new T.Mesh(new T.BoxGeometry(0.09,0.06,0.05),new T.MeshBasicMaterial({visible:false})); bh.position.copy(btn.position); g.add(bh); this.btnHit=bh; this.el.classList.add('clickable');
  if(this.data.model){ // fotorealistisches Gehäuse (Poly Haven Television 02, CC0); eigene Teile ausblenden
   const own=[]; g.children.forEach(o=>{ if(o!==scr&&o!==glass&&o!==kh&&o!==bh) own.push(o); }); own.forEach(o=>o.visible=false);
   const D2=this.data.scr; const sg2=new T.PlaneGeometry(D2.z,D2.w,32,24); const q=sg2.attributes.position; for(let i=0;i<q.count;i++){ const x=q.getX(i)/(D2.z/2), y=q.getY(i)/(D2.w/2); q.setZ(i,0.012*(1-0.5*(x*x+y*y))); } sg2.computeVertexNormals();
   scr.geometry=sg2; glass.geometry=sg2; scr.position.set(D2.x,D2.y,this.data.scrZ); glass.position.set(D2.x,D2.y,this.data.scrZ+0.002);
   kh.geometry=new T.BoxGeometry(0.1,0.03,0.04); kh.position.set(0.04,0.079,0.125); bh.geometry=new T.BoxGeometry(0.04,0.03,0.04); bh.position.set(0.135,0.079,0.125);
   this.led.visible=true; this.led.position.set(0.17,0.079,0.124); this.led.scale.setScalar(0.7);
   new THREE.GLTFLoader().load(this.data.model,gl=>{ const m=gl.scene; m.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); g.add(m); });
  }
  this.on=false; this.ch=this.data.start; this.card=testcard(); this.video=document.createElement('video'); Object.assign(this.video,{preload:'none',playsInline:true,loop:true,crossOrigin:'anonymous'}); this.video.setAttribute('playsinline','');
  this.vtex=new T.VideoTexture(this.video); this.vtex.colorSpace=T.SRGBColorSpace; this.pAnim=0; this.zap=0;
  this.hit=o=>{ if(performance.now()-(this.lastHit||0)<350) return; if(o===this.knob||o===this.knobHit){ this.lastHit=performance.now(); if(this.on) this.next(); } else if(o===this.btn||o===this.btnHit||o===this.screen){ this.lastHit=performance.now(); this.toggle(); } };
  this.el.addEventListener('click',e=>{ const o=e.detail&&e.detail.intersection&&e.detail.intersection.object; this.hit(o); });
  // VR: eigener Strahltest beim Abzug (unabhängig vom Cursor-System)
  const tg=[this.knobHit,this.btnHit,this.screen]; const onTrig=e=>{ const rc=e.target.components.raycaster; if(!rc) return; rc.raycaster.ray.origin&&0; const hs=rc.raycaster.intersectObjects(tg,false); if(hs.length) this.hit(hs[0].object); };
  const bind=()=>document.querySelectorAll('[laser-controls]').forEach(l=>{ if(!l.__tvb) l.__tvb=[]; if(!l.__tvb.includes(this)){ l.__tvb.push(this); l.addEventListener('triggerdown',onTrig); } }); bind(); this.el.sceneEl.addEventListener('loaded',bind);
 },
 audio(){ const a=ac(); if(!this.pan){ this.pan=a.createPanner(); this.pan.panningModel='HRTF'; this.pan.refDistance=0.8; this.pan.rolloffFactor=1.4; this.out=a.createGain(); this.out.gain.value=1; this.out.connect(this.pan); this.pan.connect(a.destination); this.src=a.createMediaElementSource(this.video); this.src.connect(this.out); }
  const p=new THREE.Vector3(); this.screen.getWorldPosition(p); if(this.pan.positionX){ this.pan.positionX.value=p.x; this.pan.positionY.value=p.y; this.pan.positionZ.value=p.z; } else this.pan.setPosition(p.x,p.y,p.z); return a; },
 tone(on){ const a=this.audio(); if(on&&!this.osc){ this.osc=a.createOscillator(); this.osc.frequency.value=1000; this.tg=a.createGain(); this.tg.gain.value=0.035; this.osc.connect(this.tg); this.tg.connect(this.pan); this.osc.start(); } if(!on&&this.osc){ this.osc.stop(); this.osc.disconnect(); this.osc=null; } },
 noise(dur,vol){ const a=this.audio(), n=a.createBuffer(1,a.sampleRate*dur,a.sampleRate), d=n.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length*0.5); const s=a.createBufferSource(); s.buffer=n; const g=a.createGain(); g.gain.value=vol; const f=a.createBiquadFilter(); f.type='highpass'; f.frequency.value=900; s.connect(f); f.connect(g); g.connect(this.pan); s.start(); },
 hum(){ const a=this.audio(), t0=a.currentTime; [50,100,15734/2].forEach((fq,i)=>{ const o=a.createOscillator(), g=a.createGain(); o.frequency.value=fq; o.type=i<2?'sawtooth':'sine'; g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(i<2?0.05:0.012,t0+0.08); g.gain.exponentialRampToValueAtTime(0.0001,t0+(i<2?1.2:3)); o.connect(g); g.connect(this.pan); o.start(t0); o.stop(t0+3.1); }); },
 duck(on){ this.el.sceneEl.emit('tv-duck',{on}); const m=this.data.music&&document.querySelector(this.data.music); if(m) m.volume=on?0.25:1; },
 show(){ const ch=this.ch; this.tone(false); this.video.pause();
  if(ch===0){ this.U.map.value=this.card; this.U.aspect.value=4/3; this.U.hasTex.value=1; this.tone(true); }
  else { const v=this.video, c=this.data.channels[ch-1]; this.U.hasTex.value=0; v.onended=null;
   const lv=/^live:(.+):(\d+):(\d+)$/.exec(c);
   if(lv){ // "Live"-Sender: Segmente nacheinander, Einstieg nach Uhrzeit
     const pat=lv[1], n=+lv[2], len=+lv[3]; const seg=i=>this.data.base+pat.replace('%02d',String(i).padStart(2,'0'));
     const go=(i,off)=>{ if(this.video!==v||!this.on) return; v.loop=false; v.src=seg(i); v.load(); v.onloadedmetadata=()=>{ this.U.aspect.value=v.videoWidth/v.videoHeight; if(off>0) try{ v.currentTime=Math.min(off,(v.duration||len)-1); }catch(e){} }; v.onended=()=>go((i+1)%n,0); v.play().catch(()=>{}); };
     const t=(Date.now()/1000)%(n*len); go(Math.floor(t/len),t%len); }
   else { v.loop=true; v.src=this.data.base+c; v.load(); } v.onplaying=()=>{ this.U.map.value=this.vtex; this.U.hasTex.value=1; }; if(!lv) v.onloadedmetadata=()=>{ this.U.aspect.value=v.videoWidth/v.videoHeight; }; v.play().catch(()=>{}); } },
 toggle(){ this.on=!this.on; this.audio(); if(this.on){ this.hum(); this.pAnim=0.0001; this.show(); this.led.material.color.set(0xff2020); this.duck(true); } else { this.tone(false); this.video.pause(); this.video.removeAttribute('src'); this.video.load(); this.U.power.value=0; this.pAnim=0; this.led.material.color.set(0x330000); this.duck(false); this.noise(0.12,0.05); } },
 next(){ this.ch=(this.ch+1)%(this.data.channels.length+1); this.knob.rotation.y-=Math.PI*2/14; this.zap=0.45; this.noise(0.4,0.12); setTimeout(()=>this.on&&this.show(),180); },
 tick(t,dt){ const U=this.U; U.t.value=t/1000; if(this.on&&this.video&&this.video.readyState>=2&&this.vtex) this.vtex.needsUpdate=true; if(this.on&&this.pAnim<1){ this.pAnim=Math.min(1,this.pAnim+dt/700); U.power.value=this.pAnim; }
  if(this.zap>0){ this.zap=Math.max(0,this.zap-dt/1000); const k=this.zap/0.45; U.stat.value=Math.min(1,k*1.6); U.roll.value=(1-k)*1.0%1*(k>0.02?1:0); } else { U.stat.value=this.on&&U.hasTex.value<0.5?0.85:0.0; U.roll.value=0; } }
});
})();
