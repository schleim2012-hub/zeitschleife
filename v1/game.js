const S={inv:[],scene:'back',flags:{}};
const ART={walkman:'Laufmann',krone:'Blumenkrone',polaroid:'Polarbild'};
const $=id=>document.getElementById(id);
const F='Rajdhani, sans-serif';
const DESC={polaroid:'Altes Sofortbild. Hinten: "Finde mich – M."',walkman:'Zeit-Artefakt 1984. Die Kassette dreht sich noch.',krone:'Zeit-Artefakt 1972. Gänseblümchen, die nie welken.'};
function rr(x,X,Y,W,H,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+W,Y,X+W,Y+H,r);x.arcTo(X+W,Y+H,X,Y+H,r);x.arcTo(X,Y+H,X,Y,r);x.arcTo(X,Y,X+W,Y,r);x.closePath();}
function wrap(x,t,maxW){const out=[];let l='';t.split(' ').forEach(w=>{const s=l?l+' '+w:w; if(l&&x.measureText(s).width>maxW){out.push(l);l=w;}else l=s;}); out.push(l); return out;}
function panel(W,H,draw){const c=document.createElement('canvas'); c.width=W; c.height=H; draw(c.getContext('2d'),W,H); return c;}
function canvasTex(el,c){ el.setAttribute('material',{shader:'flat',src:c.toDataURL('image/png'),transparent:true,alphaTest:0.01}); }
// frosted dark glass
function glass(x,X,Y,W,H,r,accent){ x.save(); rr(x,X,Y,W,H,r);
 const g=x.createLinearGradient(X,Y,X,Y+H); g.addColorStop(0,'rgba(34,30,52,0.78)'); g.addColorStop(1,'rgba(12,10,22,0.86)'); x.fillStyle=g; x.fill();
 x.clip(); const h=x.createRadialGradient(X+W*0.2,Y,0,X+W*0.2,Y,W*0.7); h.addColorStop(0,'rgba(255,255,255,0.10)'); h.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=h; x.fillRect(X,Y,W,H);
 x.restore(); rr(x,X+1,Y+1,W-2,H-2,r); const bg=x.createLinearGradient(X,Y,X+W,Y+H); bg.addColorStop(0,accent||'rgba(255,120,210,0.9)'); bg.addColorStop(0.5,'rgba(255,255,255,0.18)'); bg.addColorStop(1,'rgba(110,230,255,0.8)');
 x.lineWidth=2.5; x.strokeStyle=bg; x.stroke(); }
function dialogCanvas(t,title){return panel(1400,560,(x,W,H)=>{ glass(x,10,10,W-20,H-20,36);
 x.fillStyle='rgba(255,140,215,0.95)'; x.font=`600 34px ${F}`; x.letterSpacing='6px'; x.fillText((title||'ZEITSCHLEIFE').toUpperCase(),70,82); x.letterSpacing='0px';
 x.fillStyle='rgba(255,255,255,0.12)'; x.fillRect(70,100,W-140,2);
 let s=60,lines; do{x.font=`500 ${s}px ${F}`; lines=wrap(x,t,W-140); s-=2;}while(lines.length*s*1.25>H-170&&s>38);
 x.fillStyle='#f4f1ff'; x.textBaseline='middle'; lines.forEach((l,i)=>x.fillText(l,70,150+s*0.6+i*s*1.28)); });}
function btnCanvas(t,hover){return panel(560,120,(x,W,H)=>{ rr(x,6,6,W-12,H-12,22);
 const g=x.createLinearGradient(0,0,W,0); if(hover){g.addColorStop(0,'rgba(255,90,190,0.9)');g.addColorStop(1,'rgba(120,90,255,0.9)');}else{g.addColorStop(0,'rgba(30,26,46,0.85)');g.addColorStop(1,'rgba(20,18,34,0.85)');}
 x.fillStyle=g; x.fill(); x.lineWidth=2; x.strokeStyle=hover?'rgba(255,255,255,0.8)':'rgba(255,150,220,0.55)'; x.stroke();
 x.fillStyle='#fff'; x.font=`600 50px ${F}`; x.letterSpacing='3px'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(t.toUpperCase(),W/2,H/2+3);});}
function labelCanvas(t){return panel(640,110,(x,W,H)=>{x.font=`600 50px ${F}`; x.letterSpacing='2px'; const w=Math.min(W-12,x.measureText(t).width+70);
 glass(x,(W-w)/2,10,w,H-20,(H-20)/2); x.fillStyle='#fff'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(t,W/2,H/2+3);});}
// item icons drawn procedurally
function icon(k,x,cx,cy,s){x.save(); x.translate(cx,cy); x.scale(s/100,s/100); x.lineJoin='round';
 if(k==='polaroid'){x.rotate(-0.12); x.fillStyle='#f3efe6'; x.fillRect(-34,-40,68,80); const g=x.createLinearGradient(0,-32,0,22); g.addColorStop(0,'#5a3c7a'); g.addColorStop(1,'#e98a5a'); x.fillStyle=g; x.fillRect(-27,-33,54,52);
  x.fillStyle='#2a1a2e'; x.beginPath(); x.arc(0,-4,9,0,7); x.fill(); x.fillRect(-12,6,24,14); x.fillStyle='#7a6a5a'; x.font='italic 11px serif'; x.fillText('M.',-6,34);}
 if(k==='walkman'){x.fillStyle='#f2c230'; rr(x,-38,-28,76,56,8); x.fill(); x.strokeStyle='#8a6a10'; x.lineWidth=3; x.stroke(); x.fillStyle='#222'; rr(x,-28,-18,56,28,4); x.fill();
  x.fillStyle='#ddd'; x.beginPath(); x.arc(-12,-4,6,0,7); x.arc(12,-4,6,0,7); x.fill(); x.fillStyle='#d33'; x.fillRect(-28,16,14,6); x.fillStyle='#333'; x.fillRect(-6,16,10,6); x.fillRect(10,16,10,6);
  x.strokeStyle='#333'; x.lineWidth=4; x.beginPath(); x.moveTo(-30,-28); x.quadraticCurveTo(0,-62,30,-28); x.stroke();}
 if(k==='krone'){x.strokeStyle='#4f9a3a'; x.lineWidth=7; x.beginPath(); x.ellipse(0,8,38,16,0,0,7); x.stroke();
  for(let i=0;i<7;i++){const a=Math.PI*(0.05+i/7.6), px=Math.cos(a)*38*(i%2?1:1), py=8+Math.sin(a+Math.PI)*16*-1-6; x.save(); x.translate(-px*1+0, py-10);
   x.fillStyle='#fff'; for(let p=0;p<8;p++){x.rotate(Math.PI/4); x.beginPath(); x.ellipse(0,6,3,6,0,0,7); x.fill();} x.fillStyle='#f5c518'; x.beginPath(); x.arc(0,0,4,0,7); x.fill(); x.restore();}}
 x.restore();}
const INV={open:false,hover:-1,slots:8};
function invCanvas(){return panel(1100,560,(x,W,H)=>{ glass(x,10,10,W-20,H-20,30,'rgba(120,220,255,0.9)');
 x.fillStyle='rgba(140,230,255,0.95)'; x.font=`700 38px ${F}`; x.letterSpacing='8px'; x.fillText('INVENTAR',60,76); x.letterSpacing='0px';
 x.fillStyle='rgba(255,255,255,0.5)'; x.font=`500 26px ${F}`; x.textAlign='right'; x.fillText(`${S.inv.length} / ${INV.slots}`,W-60,76); x.textAlign='left';
 for(let i=0;i<INV.slots;i++){const X=60+i*124, Y=110, s=108, it=S.inv[i], hv=i===INV.hover&&it;
  rr(x,X,Y,s,s,12); const g=x.createLinearGradient(X,Y,X,Y+s); g.addColorStop(0,'rgba(0,0,0,0.55)'); g.addColorStop(1,'rgba(40,36,60,0.55)'); x.fillStyle=g; x.fill();
  x.lineWidth=hv?4:2; x.strokeStyle=hv?'#ffd27a':(it?'rgba(255,190,110,0.75)':'rgba(255,255,255,0.18)'); x.stroke();
  rr(x,X+6,Y+6,s-12,s-12,8); x.lineWidth=1; x.strokeStyle='rgba(0,0,0,0.6)'; x.stroke();
  if(it){ if(it!=='polaroid'){x.fillStyle='rgba(255,180,80,0.12)'; rr(x,X+4,Y+4,s-8,s-8,10); x.fill();} icon(it,x,X+s/2,Y+s/2+4,72);} }
 const k=S.inv[INV.hover]; x.fillStyle='rgba(255,255,255,0.1)'; x.fillRect(60,250,W-120,2);
 if(k){ x.fillStyle=k==='polaroid'?'#e8e4ff':'#ffd27a'; x.font=`700 46px ${F}`; x.fillText(ART[k],60,310);
  x.fillStyle='rgba(255,140,215,0.9)'; x.font=`600 24px ${F}`; x.letterSpacing='4px'; x.fillText(k==='polaroid'?'ERINNERUNG':'ZEIT-ARTEFAKT',60,350); x.letterSpacing='0px';
  x.fillStyle='#d8d4ee'; x.font=`500 34px ${F}`; wrap(x,DESC[k],W-120).forEach((l,i)=>x.fillText(l,60,410+i*42)); }
 else { x.fillStyle='rgba(255,255,255,0.45)'; x.font=`500 32px ${F}`; x.fillText(S.inv.length?'Zeige auf einen Gegenstand für Details.':'Noch leer. Erkunde die Zeit ...',60,320); }
 x.fillStyle='rgba(255,255,255,0.35)'; x.font=`500 24px ${F}`; x.fillText('Klicken = Gegenstand benutzen  ·  I / B / Y = schließen',60,H-50); });}
function drawInv(){ canvasTex($('invpanel'),invCanvas()); }
function toggleInv(v){ INV.open=v===undefined?!INV.open:v; const p=$('invwrap');
 if(INV.open){ const cam=$('cam').object3D, d=new THREE.Vector3(); cam.getWorldDirection(d); const yaw=Math.atan2(d.x,d.z);
  p.object3D.position.set(-1.8*Math.sin(yaw),1.25,-1.8*Math.cos(yaw)); p.object3D.rotation.set(-0.15,yaw,0,'YXZ'); INV.hover=-1; drawInv(); }
 p.setAttribute('visible',INV.open); p.querySelectorAll('.islot,#invclose').forEach(s=>INV.open?s.classList.add('click'):s.classList.remove('click'));
 const b=document.getElementById('invbtn'); if(b) b.classList.toggle('on',INV.open);}
function setupInv(){ const p=$('invwrap'); for(let i=0;i<INV.slots;i++){ const s=document.createElement('a-plane'); s.classList.add('islot');
  s.setAttribute('width',0.172); s.setAttribute('height',0.172); s.setAttribute('material','opacity:0;transparent:true;depthWrite:false');
  s.setAttribute('position',`${(-1.1/2+(60+i*124+54)/1100*1.1).toFixed(3)} ${(0.28-(110+54)/560*0.56).toFixed(3)} 0.005`);
  s.addEventListener('click',e=>{e.stopPropagation(); const it=S.inv[i]; if(!it) return; INV.sel=it; toggleInv(false); hud(); toast(ART[it]+' ausgewählt');}); s.addEventListener('mouseenter',()=>{INV.hover=i; drawInv();}); s.addEventListener('mouseleave',()=>{if(INV.hover===i){INV.hover=-1; drawInv();}}); p.appendChild(s);}
 $('invclose').addEventListener('click',e=>{e.stopPropagation(); toggleInv(false);});
 document.addEventListener('keydown',e=>{if(e.key==='i'||e.key==='I') toggleInv(); if(e.key==='Escape'){INV.sel=null; hud(); closeVerbs();}}); document.addEventListener('contextmenu',e=>{e.preventDefault(); INV.sel=null; hud(); closeVerbs();});
 document.querySelectorAll('[laser-controls]').forEach(c=>['bbuttondown','ybuttondown'].forEach(ev=>c.addEventListener(ev,()=>toggleInv())));
 canvasTex($('invclose'),labelCanvas('✕')); }
function toast(t){ const el=$('toast'); canvasTex(el,labelCanvas(t)); el.setAttribute('animation__a','property:material.opacity;from:0;to:1;dur:250');
 clearTimeout(toast.t); toast.t=setTimeout(()=>el.setAttribute('animation__a','property:material.opacity;from:1;to:0;dur:500'),2200);}
function say(t,ch){ const d=$('dlg'); canvasTex($('dlgbg'),dialogCanvas(t)); d.setAttribute('visible',true);
 const cam=$('cam').object3D, dir=new THREE.Vector3(); cam.getWorldDirection(dir); const yaw=Math.atan2(dir.x,dir.z);
 d.object3D.position.set(-2.1*Math.sin(yaw),1.5,-2.1*Math.cos(yaw)); d.object3D.rotation.set(0,yaw,0);
 d.setAttribute('animation__s','property:scale;from:0.94 0.94 1;to:1 1 1;dur:260;easing:easeOutCubic');
 const c=$('choices'); c.innerHTML=''; (ch||[{t:'Weiter',f:()=>{}}]).forEach((o,i,a)=>{
  const b=document.createElement('a-plane'); const x=(i-(a.length-1)/2)*0.6;
  b.setAttribute('width',0.52); b.setAttribute('height',0.111); b.setAttribute('position',`${x} 0 0`); b.classList.add('click');
  const n=btnCanvas(o.t,false), hv=btnCanvas(o.t,true); canvasTex(b,n);
  b.addEventListener('mouseenter',()=>{canvasTex(b,hv); b.setAttribute('scale','1.04 1.04 1');}); b.addEventListener('mouseleave',()=>{canvasTex(b,n); b.setAttribute('scale','1 1 1');});
  b.addEventListener('click',e=>{e.stopPropagation(); d.setAttribute('visible',false); c.innerHTML=''; o.f();});
  c.appendChild(b);});}
function give(k){ if(!S.inv.includes(k)){ S.inv.push(k); toast('+ '+ART[k]); const b=document.getElementById('invbtn'); if(b){b.classList.add('pulse'); setTimeout(()=>b.classList.remove('pulse'),1200);} } if(INV.open) drawInv(); }
const n=()=>['walkman','krone'].filter(k=>S.inv.includes(k)).length;
const VERBS=[['look','Ansehen'],['take','Nehmen'],['use','Benutzen'],['talk','Reden']];
function hoverName(t){ const h=$('hovername'); if(!t){h.setAttribute('visible',false);return;} canvasTex(h,labelCanvas(t)); h.setAttribute('visible',true); }
function closeVerbs(){ const v=$('verbs'); v.innerHTML=''; v.setAttribute('visible',false); }
function interact(label,act,g){ closeVerbs();
 if(INV.sel){ const it=INV.sel; INV.sel=null; hud(); const f=act.with&&act.with[it];
  return f?f():say(`${ART[it]} mit ${label}? Das bringt nichts.`); }
 const v=$('verbs'); const p=new THREE.Vector3(); g.object3D.getWorldPosition(p); const cam=new THREE.Vector3(0,1.6,0);
 p.sub(cam).normalize().multiplyScalar(3).add(cam); v.object3D.position.copy(p); v.object3D.lookAt(cam); v.object3D.scale.set(1.35,1.35,1.35); v.setAttribute('visible',true);
 const tt=document.createElement('a-plane'); tt.setAttribute('width',1.0); tt.setAttribute('height',0.172); tt.setAttribute('position','0 0.3 0'); canvasTex(tt,labelCanvas(label)); v.appendChild(tt);
 VERBS.forEach(([k,n],i)=>{ const b=document.createElement('a-plane'); const ok=!!act[k];
  b.setAttribute('width',0.42); b.setAttribute('height',0.09); b.setAttribute('position',`${((i%2)-0.5)*0.46} ${0.12-Math.floor(i/2)*0.11} 0`);
  const nm=btnCanvas(n,false), hv=btnCanvas(n,true); canvasTex(b,nm); b.setAttribute('material','opacity',ok?1:0.45); b.classList.add('click');
  b.addEventListener('mouseenter',()=>canvasTex(b,hv)); b.addEventListener('mouseleave',()=>canvasTex(b,nm));
  b.addEventListener('click',e=>{e.stopPropagation(); closeVerbs(); if(act[k]) act[k](); else say({look:`Nichts Besonderes an: ${label}.`,take:'Das kann ich nicht mitnehmen.',use:'Wie soll ich das benutzen?',talk:'Keine Antwort. Natürlich nicht.'}[k]);});
  v.appendChild(b);});
 const x=document.createElement('a-plane'); x.setAttribute('width',0.42); x.setAttribute('height',0.09); x.setAttribute('position','0 -0.13 0'); x.classList.add('click');
 canvasTex(x,btnCanvas('Abbrechen',false)); x.addEventListener('click',e=>{e.stopPropagation(); closeVerbs();}); v.appendChild(x); }
function hud(){ const h=document.getElementById('hud'); if(!h) return; h.innerHTML=INV.sel?`<b>${ART[INV.sel]}</b> &nbsp;benutzen mit … &nbsp;·&nbsp; Rechtsklick/Esc = abbrechen`:'<b>Zeitschleife</b> &nbsp;·&nbsp; Ziehen = umsehen &nbsp;·&nbsp; Klicken = Aktion wählen &nbsp;·&nbsp; I = Inventar'; }
function spot(label,az,el,act,color){ if(typeof act==='function') act={look:act}; color=color||'#8fe9ff'; const r=7,a=az*Math.PI/180,e=el*Math.PI/180;
 const g=document.createElement('a-entity'); g.setAttribute('position',`${(r*Math.sin(a)*Math.cos(e)).toFixed(2)} ${(1.6+r*Math.sin(e)).toFixed(2)} ${(-r*Math.cos(a)*Math.cos(e)).toFixed(2)}`); g.setAttribute('look-at','[camera]');
 const ring=document.createElement('a-ring'); ring.setAttribute('radius-inner',0.13); ring.setAttribute('radius-outer',0.145); ring.setAttribute('material',`shader:flat;color:${color};transparent:true;opacity:0.9`);
 const halo=document.createElement('a-ring'); halo.setAttribute('radius-inner',0.18); halo.setAttribute('radius-outer',0.2); halo.setAttribute('material',`shader:flat;color:${color};transparent:true;opacity:0.5`);
 halo.setAttribute('animation','property:scale;from:1 1 1;to:1.9 1.9 1;loop:true;dur:1800;easing:easeOutQuad'); halo.setAttribute('animation__o','property:material.opacity;from:0.55;to:0;loop:true;dur:1800;easing:easeOutQuad');
 const dot=document.createElement('a-circle'); dot.setAttribute('radius',0.035); dot.setAttribute('material',`shader:flat;color:#fff;transparent:true;opacity:0.9`);
 const hit=document.createElement('a-circle'); hit.setAttribute('radius',0.38); hit.setAttribute('material','transparent:true;opacity:0;depthWrite:false'); hit.classList.add('click');
 const lab=document.createElement('a-plane'); lab.setAttribute('width',1.2); lab.setAttribute('height',0.206); lab.setAttribute('position','0 0.4 0'); lab.setAttribute('material','shader:flat;transparent:true;opacity:0'); canvasTex(lab,labelCanvas(label));
 lab.setAttribute('animation__in','property:material.opacity;to:1;dur:200;startEvents:show'); lab.setAttribute('animation__out','property:material.opacity;to:0;dur:300;startEvents:hide');
 hit.addEventListener('mouseenter',()=>{ hoverName(INV.sel?`${ART[INV.sel]} benutzen mit ${label}`:label);ring.setAttribute('scale','1.25 1.25 1'); lab.emit('show');});
 hit.addEventListener('mouseleave',()=>{ hoverName('');ring.setAttribute('scale','1 1 1'); lab.emit('hide');});
 hit.addEventListener('click',e=>{e.stopPropagation(); interact(label,act,g);}); [halo,ring,dot,lab,hit].forEach(x=>g.appendChild(x)); $('hs').appendChild(g);
 setTimeout(()=>lab.emit('show'),50); setTimeout(()=>lab.emit('hide'),2600);}
AFRAME.registerComponent('look-at',{tick(){const c=this.el.sceneEl.camera; if(c){const v=new THREE.Vector3(); c.getWorldPosition(v); this.el.object3D.lookAt(v);}}});
function fadeGo(sc,cb){ const f=$('fade'); f.setAttribute('material','color','#000'); f.setAttribute('animation','property:material.opacity;from:0;to:1;dur:600');
 setTimeout(()=>{ S.scene=sc; build(); f.setAttribute('animation','property:material.opacity;from:1;to:0;dur:600'); cb&&cb();},650);}
let busy=false;
function go(sc,cb){ if(busy) return; const v=$('vortexvid'), vs=$('vsphere'), sky=$('sky'), f=$('fade');
 if(!v||v.error){ fadeGo(sc,cb); return; }
 busy=true; let done=false; $('dlg').setAttribute('visible',false); $('hs').setAttribute('visible',false);
 const show=()=>{ sky.setAttribute('visible',false); vs.setAttribute('visible',true); };
 const finish=()=>{ if(done) return; done=true; v.pause(); f.setAttribute('material','color','#fff'); f.setAttribute('material','opacity',1);
  vs.setAttribute('visible',false); sky.setAttribute('visible',true); S.scene=sc; build(); $('hs').setAttribute('visible',true);
  f.setAttribute('animation','property:material.opacity;from:1;to:0;dur:1000');
  setTimeout(()=>{busy=false; f.setAttribute('material','color','#000');},1050); cb&&setTimeout(cb,600); };
 const fail=()=>{ if(done) return; done=true; vs.setAttribute('visible',false); sky.setAttribute('visible',true); $('hs').setAttribute('visible',true); busy=false; fadeGo(sc,cb); };
 v.muted=true; v.loop=false; v.currentTime=0; v.onended=finish; v.onerror=fail;
 let p; try{ p=v.play(); }catch(e){ fail(); return; }
 if(p&&p.then) p.then(show,fail); else show();
 setTimeout(finish,7500); }
function maraTree(){ say('"Na, Zeitreisender?" Mara schiebt die Sonnenbrille ins Haar. "Was willst du wissen?"',[
 {t:'Wer bist du?',f:()=>say('"Mara. 1996 in einer Mall eingeschlafen, in den Backrooms aufgewacht. Seitdem springe ich durch die Zeit."',[{t:'Mehr fragen',f:maraTree},{t:'Tschüss',f:()=>{}}])},
 {t:'Wie kommen wir raus?',f:()=>say('"Drei Dinge halten die Schleife zusammen: ein Foto, ein Lied und eine Blume. Bring sie zur Lampe in den Backrooms."',[{t:'Mehr fragen',f:maraTree},{t:'Tschüss',f:()=>{}}])},
 {t:'Flirten',f:()=>{S.flags.flirt=(S.flags.flirt||0)+1; say(S.flags.flirt>1?'Sie lacht leise und tippt dir mit einem neonleuchtenden Finger auf die Brust. "Erst raus hier. Dann sehen wir weiter."':'"Du bist mir ja ein Schmeichler." Sie spritzt dir Wasser ins Gesicht. "Gefällt mir trotzdem."',[{t:'Mehr fragen',f:maraTree},{t:'Tschüss',f:()=>{}}]);}}]);}
function build(){ $('hs').innerHTML=''; closeVerbs(); const sky=$('sky');
 if(S.scene==='back'){ sky.setAttribute('src','#backrooms');
  if(!S.inv.includes('polaroid')) spot('Polarbild',0,-25,{look:()=>say('Ein Sofortbild auf dem Teppich. Eine Frau mit Föhnfrisur, verschwommen.'),take:()=>{give('polaroid');build();say('Hinten steht: "Finde mich – M." Du steckst das Foto ein.');}},'#fff');
  spot('Tür "1984"',-45,-3,{look:()=>say('Eine Tür, die hier nicht hingehört. Dahinter: Synthwave, gedämpft.'),use:()=>go('pool',()=>say('Warme Nachtluft. Synthwave aus einem Kassettenrekorder. Irgendwo lacht jemand.'))},'#ff8fd8');
  spot('Tapetenriss',95,0,{look:()=>say('Unter der gelben Tapete blüht ein altes Rosenmuster. Es riecht nach Rauch.'),use:()=>go('fest',()=>say('Du fällst durch das Blumenmuster ... Rauch, Patschuli, Sommer. 1972.'))},'#ffb86b');
  spot('Flackernde Lampe',180,35,{look:()=>say('Die Röhre summt. Zwischen dem Brummen: eine Frauenstimme.'),talk:()=>say(n()<2?'"Du bist wach ... endlich. Bring mir ein Lied und eine Blume aus der Zeit. Das Foto hast du ja."':'"Du hast alles! Zeig mir das Foto."'),
   with:{polaroid:()=>{ if(n()<2) return say('Das Licht flackert über das Foto. "Noch nicht ... mir fehlen das Lied und die Blume."'); S.flags.open=true; build(); say('Das Foto beginnt zu leuchten. Hinter dir öffnet sich eine Tür aus Licht.');},
         walkman:()=>say('Du hältst den Laufmann ans Licht. Die Röhre flackert im Takt.'),krone:()=>say('Die Blüten drehen sich zur Lampe wie zur Sonne.')}},'#fff3a0');
  if(S.flags.open) spot('Tür aus Licht',-150,0,{look:()=>say('Warmes, weißes Licht. Es fühlt sich an wie Sonntagmorgen.'),use:finale},'#fff');
 } else if(S.scene==='pool'){ sky.setAttribute('src','#pool');
  spot('Mara',0,-12,{look:()=>say('Mara liegt im Neon-Bikini auf einer Liege, Schwarzlicht-Bodypaint leuchtet auf Armen und Bauch. Sie beobachtet dich amüsiert.'),talk:maraTree,
   with:{polaroid:()=>say('Sie wird still. "Das bin ich. 1996. Woher hast du das?"'),krone:()=>say('"Für mich?" Sie setzt sie kurz auf und grinst. "Steht mir. Aber die brauchen wir noch."')}},'#ff8fd8');
  if(!S.inv.includes('walkman')) spot('Laufmann',60,-20,{look:()=>say('Ein gelber Laufmann. Die Kassette dreht sich, obwohl er aus ist.'),take:()=>{give('walkman');build();say('Du nimmst den Laufmann. Das Lied läuft weiter, in deinem Kopf.');}},'#ffd27a');
  spot('Cocktail',-60,-20,{look:()=>say('Pink, mit Schirmchen.'),use:()=>say('Schmeckt nach Erdbeere und ... als hätte ich das schon mal erlebt.'),take:()=>say('Mara: "Finger weg, der ist meiner."')});
  spot('Uhr',120,10,{look:()=>say('Die Uhr läuft rückwärts. 23:59 ... 23:58 ... Hier wird es nie Mitternacht.'),with:{walkman:()=>say('Du spulst die Kassette vor. Der Sekundenzeiger zuckt kurz vorwärts – und wieder zurück.')}});
  spot('Zurück',180,0,{use:()=>go('back')},'#aaa');
 } else { sky.setAttribute('src','#fest');
  spot('Lagerfeuer',0,-10,{look:()=>say('Frauen in Häkeltops werfen lachend ihre BHs ins Feuer. "Freiheit!" Die Flammen schlagen bunt hoch.'),with:{polaroid:()=>say('Lieber nicht. Ohne das Foto findet Mara nicht raus.')}},'#ff9a4a');
  spot('Mara',-35,-5,{look:()=>say('Mara im Häkeltop, Blumen im Haar, barfuß im Gras.'),talk:()=>say('"Komm, tanz mit mir! Keiner sieht hin, alle sind frei."',[{t:'Tanzen',f:()=>{S.flags.tanz=true; say('Ihr tanzt, bis die Sonne weg ist. Sie lehnt sich an dich. "Die Krone dort ... sie gehört zu uns."');}},{t:'Später',f:()=>{}}]),
   with:{walkman:()=>say('Sie setzt einen Kopfhörer auf. "Das ist unser Lied ... aus 1984?" Sie lacht ungläubig.')}},'#ff8fd8');
  if(!S.inv.includes('krone')) spot('Blumenkrone',40,-20,{look:()=>say('Gänseblümchen, die nicht welken.'),take:()=>{ if(!S.flags.tanz) return say('Ein Mädchen hält sie fest. "Nur für Tänzer, Mann."'); give('krone');build();say('Du nimmst die Blumenkrone. Zeit-Artefakt eingesammelt!');}},'#ffd27a');
  spot('Hippie-Bus',90,-3,{look:()=>say('Ein türkiser Hippie-Bus mit Peace-Zeichen.'),use:()=>say('Im Radio: dasselbe alte Lied wie 1984. Seltsam.')});
  spot('Zurück',180,0,{use:()=>go('back')},'#aaa');
 }}
function finale(){ say('Die Tür aus Licht öffnet sich. Mara steht neben dir. "Wenn wir gehen, gibt es kein Zurück. Kommst du mit?"',[
 {t:'mit Mara gehen',f:()=>say('Ihr geht Hand in Hand ins Licht. Du wachst auf – in einer echten Wohnung, Sonntagmorgen. Auf dem Tisch ein neues Polarbild: ihr beide. ENDE A – "Gemeinsam".',[{t:'Neu starten',f:()=>location.reload()}])},
 {t:'allein gehen',f:()=>say('Du gehst allein. Hinter dir summt eine Neonröhre: "Bis zur nächsten Schleife ..." Du wachst auf – mit einem Polarbild in der Hand. ENDE B – "Schleife".',[{t:'Neu starten',f:()=>location.reload()}])}]);}
document.querySelector('a-scene').addEventListener('loaded',async()=>{try{await Promise.all(['500','600','700'].map(w=>document.fonts.load(w+' 40px Rajdhani')));}catch(e){} setupInv(); hud(); build();say('Du wachst auf. Gelbe Flure, summendes Licht, kein Ende. Auf dem Boden liegt etwas ...');});
