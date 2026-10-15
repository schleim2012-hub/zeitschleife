// VRP – gemeinsame VR-Physik-Helfer (Rewind V3). Quellen/Begründung: /workspace/zeitschleife_vr_physik_tipps.md
// 1) Wurf-Schätzung wie Owlchemy/Meta: Trendlinie (lineare Regression) über ~90 ms Controller-Posen statt Mittelwert,
//    letzter Frame vor dem Loslassen wird übersprungen ("step back"), plus Drehgeschwindigkeit und Tangential-Anteil ω×r.
// 2) Haptik: kurze Pulse, Stärke ~ Aufprallgeschwindigkeit, nie überlappend.
// 3) Gewicht (Bonelab-Idee): gehaltene Objekte folgen der Hand über eine kritisch gedämpfte Feder; schwere Dinge hängen etwas nach.
// 4) Feste Zeitschritte (1/240 s) mit Akkumulator + Deckel, damit schnelle Bälle nicht durchtunneln.
(function(){
const T=()=>window.THREE;
class Tracker{
 constructor(){ this.s=[]; }
 push(p,q,t){ const s=this.s; s.push({p:p.clone(),q:q.clone(),t}); while(s.length>3&&t-s[0].t>0.3) s.shift(); }
 clear(){ this.s.length=0; }
 // offset: Vektor (Welt) vom Controller zum Objekt-Schwerpunkt → Tangentialgeschwindigkeit
 // Mehrere Fenster (40/65/90 ms) → schnellste Trendlinie: Wurf beschleunigt bis zum Loslassen, lange Fenster unterschätzen
 estimate(offset,opt={}){ if(!opt._one){ let best=null; for(const w of (opt.windows||[0.04,0.065,0.09])){ const e=this.estimate(offset,{...opt,window:w,_one:1}); if(!best||e.speed>best.speed) best=e; } return best||this.estimate(offset,{...opt,_one:1}); } const TT=T(), s=this.s, out={v:new TT.Vector3(),w:new TT.Vector3(),speed:0}; if(s.length<2) return out;
  const win=opt.window||0.09, back=opt.stepBack===undefined?1:opt.stepBack;
  const end=Math.max(1,s.length-1-back), tEnd=s[end].t; let i0=end; while(i0>0&&tEnd-s[i0-1].t<=win) i0--;
  const n=end-i0+1;
  if(n>=3){ let mt=0; for(let i=i0;i<=end;i++) mt+=s[i].t; mt/=n; let den=0; const num=new TT.Vector3(), mp=new TT.Vector3();
   for(let i=i0;i<=end;i++) mp.add(s[i].p); mp.multiplyScalar(1/n);
   for(let i=i0;i<=end;i++){ const dt=s[i].t-mt; den+=dt*dt; num.addScaledVector(s[i].p.clone().sub(mp),dt); }
   if(den>1e-9) out.v.copy(num).multiplyScalar(1/den);
  } else { const a=s[Math.max(0,end-1)], b=s[end]; const dt=Math.max(1e-3,b.t-a.t); out.v.copy(b.p).sub(a.p).multiplyScalar(1/dt); }
  // Winkelgeschwindigkeit aus Quaternion-Differenz über das Fenster
  const qa=s[i0].q, qb=s[end].q, dtq=Math.max(1e-3,s[end].t-s[i0].t); const dq=qb.clone().multiply(qa.clone().invert()); if(dq.w<0){ dq.x=-dq.x; dq.y=-dq.y; dq.z=-dq.z; dq.w=-dq.w; }
  const ang=2*Math.acos(Math.min(1,dq.w)), sn=Math.sqrt(Math.max(0,1-dq.w*dq.w)); if(sn>1e-4&&ang>1e-3) out.w.set(dq.x/sn,dq.y/sn,dq.z/sn).multiplyScalar(ang/dtq);
  if(out.w.length()>30) out.w.setLength(30);
  if(offset&&opt.tangential!==0) out.v.add(out.w.clone().cross(offset).multiplyScalar(opt.tangential||0.6));
  if(opt.scale) out.v.multiplyScalar(opt.scale);
  const mx=opt.max||18; if(out.v.length()>mx) out.v.setLength(mx);
  out.speed=out.v.length(); return out; }
}
// Haptik über WebXR-Gamepad (Quest: hapticActuators[0].pulse); Hand = 'left'|'right'
const lastPulse={};
function haptic(renderer,hand,intensity,ms){ try{ const ses=renderer&&renderer.xr&&renderer.xr.getSession&&renderer.xr.getSession(); if(!ses) return false; const now=performance.now();
  if(lastPulse[hand]&&now-lastPulse[hand]<ms*0.8&&intensity<0.6) return false; lastPulse[hand]=now; window.__haptics=(window.__haptics||0)+1;
  for(const src of ses.inputSources){ if(src.handedness!==hand||!src.gamepad) continue; const g=src.gamepad;
   const a=g.hapticActuators&&g.hapticActuators[0]; const I=Math.max(0,Math.min(1,intensity));
   if(a&&a.pulse){ a.pulse(I,ms); return true; } if(g.vibrationActuator&&g.vibrationActuator.playEffect){ g.vibrationActuator.playEffect('dual-rumble',{duration:ms,strongMagnitude:I,weakMagnitude:I*0.6}); return true; } } }catch(e){} return false; }
// Gewicht: kritisch gedämpfte Feder; Steifigkeit sinkt mit der Masse (0,15 kg ≈ fast starr, 1 kg ≈ ~70 ms Nachlauf)
function lagFollow(pos,vel,target,mass,dt){ const w=Math.max(9,Math.min(48,30*Math.sqrt(0.3/Math.max(0.05,mass)))); const TT=T();
 const a=target.clone().sub(pos).multiplyScalar(w*w).addScaledVector(vel,-2*w); vel.addScaledVector(a,dt); pos.addScaledVector(vel,dt);
 if(pos.distanceTo(target)>0.35) pos.copy(target).addScaledVector(pos.clone().sub(target).normalize(),0.35); return w; }
// feste Physik-Schritte mit Akkumulator
function stepper(h){ let acc=0; return (dt,fn)=>{ acc=Math.min(acc+Math.min(dt,0.1),h*12); let n=0; while(acc>=h){ fn(h); acc-=h; n++; } return n; }; }
window.VRP={Tracker,haptic,lagFollow,stepper};
})();
