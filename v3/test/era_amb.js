// gapless WebAudio ambience loop (starts on first gesture / enter-vr)
window.eraAmbStart=function(url,vol){ let ac,started=0; const go=()=>{ if(started) return; started=1; ac=new (window.AudioContext||window.webkitAudioContext)();
 fetch(url).then(r=>r.arrayBuffer()).then(b=>ac.decodeAudioData(b)).then(buf=>{ const s=ac.createBufferSource(); s.buffer=buf; s.loop=true; const g=ac.createGain(); g.gain.value=0; g.gain.linearRampToValueAtTime(vol||0.35,ac.currentTime+2); s.connect(g).connect(ac.destination); s.start(); window.eraAmb={src:url,ctx:ac,gain:g}; }); };
 window.eraAmb={src:url,pending:true}; ['click','keydown','touchstart','mousedown'].forEach(e=>window.addEventListener(e,go,{once:true})); const sc=document.querySelector('a-scene'); sc&&sc.addEventListener('enter-vr',go); };
