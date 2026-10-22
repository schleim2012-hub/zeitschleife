// Sprachausgabe: spielt zu jedem say()-Text die passenden Segmente aus audio/manifest.json
(function(){
 const V='9', norm=s=>(s||'').toLowerCase().replace(/[^a-zäöüß0-9]/g,'');
 const full={}, seg={}; let on=localStorage.getItem('zs_voice')!=='off', cur=null, token=0;
 window.ZS_DUCK=false;
 fetch('audio/manifest.json?v='+V).then(r=>r.json()).then(m=>{ const g={};
  Object.entries(m.lines||{}).forEach(([k,l])=>{ const [base,i]=k.split('#'); (g[base]=g[base]||[])[+i||0]=l; seg[norm(l.text)]=seg[norm(l.text)]||l.file; });
  Object.values(g).forEach(arr=>{ const a=arr.filter(Boolean); full[norm(a.map(l=>l.text).join(' '))]=a.map(l=>l.file); }); }).catch(()=>{});
 function stop(){ token++; if(cur){cur.pause(); cur=null;} window.ZS_DUCK=false; }
 function files(t){ const n=norm(t); if(full[n]) return full[n];
  // Fallback: Text in Erzähler-/Zitat-Teile zerlegen und einzeln suchen
  const parts=t.split(/"([^"]*)"/).map(norm).filter(p=>p&&p!=='mara'); const f=parts.map(p=>seg[p]); return f.length&&f.every(Boolean)?f:null; }
 function play(t){ stop(); if(!on) return; const f=files(t); if(!f) return; const my=token; let i=0;
  const next=()=>{ if(my!==token) return; if(i>=f.length){cur=null; window.ZS_DUCK=false; return;}
   const a=new Audio(f[i++]+'?v='+V); cur=a; window.ZS_DUCK=true; a.onended=next; a.onerror=next; a.play().catch(()=>{ if(my===token){cur=null; window.ZS_DUCK=false;} }); };
  next(); }
 window.ZSVoice={play,stop,files,toggle(){ on=!on; localStorage.setItem('zs_voice',on?'on':'off'); if(!on) stop(); draw(); return on; }};
 const wrap=()=>{ if(typeof window.say!=='function'||window.say._v) return; const o=window.say; window.say=function(t,ch){ const r=o.apply(this,arguments); play(t); return r; }; window.say._v=1; };
 wrap(); setTimeout(wrap,0);
 // Dialog geschlossen -> Stimme aus
 setInterval(()=>{ const d=document.getElementById('dlg'); if(cur&&d&&!d.getAttribute('visible')) stop(); },200);
 const b=document.createElement('button'); b.id='voicebtn'; b.title='Stimme an/aus';
 function draw(){ b.textContent=on?'🗣 STIMME AN':'🗣 STIMME AUS'; b.classList.toggle('off',!on); }
 b.onclick=e=>{e.stopPropagation(); window.ZSVoice.toggle();}; draw();
 (document.body?Promise.resolve():new Promise(r=>document.addEventListener('DOMContentLoaded',r))).then(()=>document.body.appendChild(b));
 // VR: A = Musik, X = Stimme
 const vr=()=>document.querySelectorAll('[laser-controls]').forEach(c=>{ c.addEventListener('abuttondown',()=>{ const m=document.getElementById('musicbtn'); m&&m.click(); typeof toast==='function'&&toast(m&&m.classList.contains('off')?'Musik aus':'Musik an'); });
  c.addEventListener('xbuttondown',()=>{ const v=window.ZSVoice.toggle(); typeof toast==='function'&&toast(v?'Stimme an':'Stimme aus'); }); });
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',vr):vr();
})();
