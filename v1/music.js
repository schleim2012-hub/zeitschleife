// Hintergrundmusik: Loop pro Szene, Crossfade, Start nach erstem Klick
(function(){
 const V='8', TR={back:'backrooms',pool:'pool1984',fest:'festival1972'}, VOL=0.5, FADE=1500;
 const els={}; let cur=null, on=localStorage.getItem('zs_music')!=='off', started=false;
 Object.entries(TR).forEach(([k,f])=>{const a=new Audio('music/'+f+'.mp3?v='+V); a.loop=true; a.preload='auto'; a.volume=0; els[k]=a;});
 function ramp(a,to,done){ clearInterval(a._t); const from=a.volume, t0=performance.now();
  a._t=setInterval(()=>{const p=Math.min(1,(performance.now()-t0)/FADE); a.volume=from+(to-from)*p; if(p>=1){clearInterval(a._t); done&&done();}},50);}
 function sync(){ if(!started||typeof S==='undefined') return; const want=on?(TR[S.scene]?S.scene:'back'):null; if(want===cur) return;
  if(cur){const o=els[cur]; ramp(o,0,()=>o.pause());} cur=want;
  if(want){const a=els[want]; a.play().then(()=>ramp(a,window.ZS_DUCK?0.2:VOL)).catch(()=>{});} }
 function start(){ if(started) return; started=true; sync(); }
 ['click','pointerdown','keydown','touchstart'].forEach(e=>document.addEventListener(e,start,{capture:true}));
 document.addEventListener('DOMContentLoaded',()=>{ const sc=document.querySelector('a-scene'); sc&&sc.addEventListener('enter-vr',start); });
 setInterval(sync,300);
 let duck=false; setInterval(()=>{ if(!cur) return; const d=!!window.ZS_DUCK; if(d!==duck){duck=d; ramp(els[cur],d?0.2:VOL);} },150);
 const b=document.createElement('button'); b.id='musicbtn'; b.title='Musik an/aus';
 const draw=()=>{b.textContent=on?'♪ MUSIK AN':'♪ MUSIK AUS'; b.classList.toggle('off',!on);};
 b.onclick=e=>{e.stopPropagation(); on=!on; localStorage.setItem('zs_music',on?'on':'off'); started=true; draw(); if(!on&&cur){const o=els[cur]; ramp(o,0,()=>o.pause()); cur=null;} sync();};
 draw(); (document.body?Promise.resolve():new Promise(r=>document.addEventListener('DOMContentLoaded',r))).then(()=>document.body.appendChild(b));
})();
