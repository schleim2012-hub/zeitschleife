const S={inv:[],scene:'back',flags:{}};
const ART={walkman:'Walkman',krone:'Blumenkrone',polaroid:'Polaroid'};
const $=id=>document.getElementById(id);
function say(t,ch){ $('dlg').setAttribute('visible',true); $('dlgtxt').setAttribute('value',t);
 const c=$('choices'); c.innerHTML=''; (ch||[{t:'OK',f:()=>{}}]).forEach((o,i,a)=>{
  const b=document.createElement('a-entity'); const x=(i-(a.length-1)/2)*1.2;
  b.setAttribute('geometry','primitive:plane;width:1.1;height:0.22'); b.setAttribute('material','color:#ff2fa0');
  b.setAttribute('position',`${x} 0 0`); b.classList.add('click');
  b.setAttribute('text',`value:${o.t};align:center;width:2;color:#fff`);
  b.addEventListener('click',e=>{e.stopPropagation(); $('dlg').setAttribute('visible',false); c.innerHTML=''; o.f();});
  c.appendChild(b);});}
function give(k){ if(!S.inv.includes(k)) S.inv.push(k); $('inv').setAttribute('value','Inventar: '+S.inv.map(x=>ART[x]).join(', '));}
const n=()=>['walkman','krone'].filter(k=>S.inv.includes(k)).length;
function spot(label,az,el,fn,color){ const r=8,a=az*Math.PI/180,e=el*Math.PI/180;
 const p=`${(r*Math.sin(a)*Math.cos(e)).toFixed(2)} ${(1.6+r*Math.sin(e)).toFixed(2)} ${(-r*Math.cos(a)*Math.cos(e)).toFixed(2)}`;
 const g=document.createElement('a-entity'); g.setAttribute('position',p); g.setAttribute('look-at','[camera]');
 const s=document.createElement('a-sphere'); s.setAttribute('radius',0.35); s.classList.add('click');
 s.setAttribute('material',`color:${color||'#7ff'};emissive:${color||'#7ff'};opacity:0.75;transparent:true`);
 s.setAttribute('animation','property:scale;to:1.25 1.25 1.25;dir:alternate;loop:true;dur:900');
 s.addEventListener('mouseenter',()=>s.setAttribute('material','opacity',1));
 s.addEventListener('mouseleave',()=>s.setAttribute('material','opacity',0.75));
 s.addEventListener('click',fn); g.appendChild(s);
 const t=document.createElement('a-text'); t.setAttribute('value',label); t.setAttribute('align','center'); t.setAttribute('width',5); t.setAttribute('position','0 0.7 0');
 g.appendChild(t); $('hs').appendChild(g);}
AFRAME.registerComponent('look-at',{tick(){const c=this.el.sceneEl.camera; if(c){const v=new THREE.Vector3(); c.getWorldPosition(v); this.el.object3D.lookAt(v);}}});
function go(sc,cb){ const f=$('fade'); f.setAttribute('animation','property:material.opacity;from:0;to:1;dur:600');
 setTimeout(()=>{ S.scene=sc; build(); f.setAttribute('animation','property:material.opacity;from:1;to:0;dur:600'); cb&&cb();},650);}
function build(){ $('hs').innerHTML=''; const sky=$('sky');
 if(S.scene==='back'){ sky.setAttribute('src','#backrooms');
  spot('Polaroid',0,-25,()=>{give('polaroid');say('Ein altes Polaroid. Darauf eine Frau mit Föhnfrisur, verschwommen. Hinten steht: "Finde mich – M."');},'#fff');
  spot('Tür "1984"',-45,-3,()=>go('pool',()=>say('Warme Nachtluft. Synthwave aus einem Kassettenrekorder. Irgendwo lacht jemand.')),'#f4a');
  spot('Tapetenriss',95,0,()=>go('fest',()=>say('Du fällst durch das Blumenmuster ... und riechst Rauch, Patschuli und Sommer. 1972.')),'#fa4');
  spot('Flackernde Lampe',180,35,()=>say(n()<2?'Die Röhre summt. Zwischen dem Brummen eine Frauenstimme: "Du bist wach ... endlich. Ich hänge fest, genau wie du. Wir brauchen drei Dinge aus der Zeit. Das Foto hast du schon."':'Maras Stimme, ganz nah: "Du hast sie! Dreh dich um ... die Tür aus Licht."'),'#ff8');
  if(n()===2) spot('Tür aus Licht',-150,0,finale,'#fff');
 } else if(S.scene==='pool'){ sky.setAttribute('src','#pool');
  spot('Mara',0,-12,()=>say('Mara liegt im Neon-Bikini auf einer Liege, Schwarzlicht-Bodypaint leuchtet auf Armen und Bauch. "Na, Zeitreisender? Du hast dir Zeit gelassen." Sie zwinkert. "Ich bin Mara. Der Walkman da hält diese Nacht fest. Nimm ihn mit – für uns."',[{t:'Flirten',f:()=>say('"Charmeur." Sie grinst und spritzt dir Wasser ins Gesicht. "Erst raus aus der Schleife, dann reden wir weiter."')},{t:'Wer bist du?',f:()=>say('"Ich bin 1996 in der Mall eingeschlafen und in den Backrooms aufgewacht. Seitdem springe ich. Du bist der Erste, der mich findet."')}]),'#f4a');
  spot('Walkman',60,-20,()=>{give('walkman');say('Ein gelber Walkman, die Kassette dreht sich noch. Zeit-Artefakt 1/2 eingesammelt!');},'#ff0');
  spot('Cocktail',-60,-20,()=>say('Ein pinker Cocktail mit Schirmchen. Schmeckt nach Erdbeere und ... Déjà-vu.'));
  spot('Uhr',120,10,()=>say('Die Uhr läuft rückwärts. 23:59 ... 23:58 ... Hier wird es nie Mitternacht.'));
  spot('Zurück',180,0,()=>go('back'),'#999');
 } else { sky.setAttribute('src','#fest');
  spot('Lagerfeuer',0,-10,()=>say('Frauen in Häkeltops und Fransenwesten werfen lachend ihre BHs ins Feuer. "Freiheit!" ruft eine. Die Flammen schlagen bunt hoch.'),'#f80');
  spot('Mara',-35,-5,()=>say('Mara im Häkeltop, Blumen im Haar, packt deine Hand. "Komm, tanz mit mir! Keiner sieht hin, alle sind frei." Ihr dreht euch ums Feuer.',[{t:'Tanzen',f:()=>say('Ihr tanzt, bis die Sonne ganz weg ist. Sie lehnt sich kurz an dich. "Die Krone ... nimm sie. Das ist das letzte Stück."')},{t:'Später',f:()=>{}}]),'#f4a');
  spot('Blumenkrone',40,-20,()=>{give('krone');say('Eine Krone aus Gänseblümchen, die nicht welkt. Zeit-Artefakt eingesammelt!');},'#ff0');
  spot('VW-Bus',90,-3,()=>say('Ein türkiser VW-Bus mit Peace-Zeichen. Im Radio: dasselbe Synthwave-Lied wie 1984. Seltsam.'));
  spot('Zurück',180,0,()=>go('back'),'#999');
 }}
function finale(){ say('Die Tür aus Licht öffnet sich. Mara steht neben dir. "Wenn wir gehen, gibt es kein Zurück. Kommst du mit?"',[
 {t:'mit Mara gehen',f:()=>say('Ihr geht Hand in Hand ins Licht. Du wachst auf – in einer echten Wohnung, Sonntagmorgen. Auf dem Tisch ein neues Polaroid: ihr beide. ENDE A – "Gemeinsam".',[{t:'Neu starten',f:()=>location.reload()}])},
 {t:'allein gehen',f:()=>say('Du gehst allein. Hinter dir summt eine Neonröhre: "Bis zum nächsten Loop ..." Du wachst auf – mit einem Polaroid in der Hand. ENDE B – "Schleife".',[{t:'Neu starten',f:()=>location.reload()}])}]);}
document.querySelector('a-scene').addEventListener('loaded',()=>{build();say('Du wachst auf. Gelbe Flure, summendes Licht, kein Ende. Auf dem Boden liegt etwas ...');});
