/* Giß-Moe v3: Reden – Texteingabe (immer), Mikro (optional: Android-Spracherkennung → Web Speech → Lauschen), kindersichere Antworten. */
(function(){
let K; const T={}; const wait=ms=>new Promise(r=>setTimeout(r,ms));
const pick=a=>a[(Math.random()*a.length)|0];
let pan, log, inp, micBtn, busy=false, rec=null, listening=false;
/* ---------- Antworten (alle Sätze werden als Stimme vorproduziert) ---------- */
const JOKES=[
 ['Was ist grün und klopft an die Tür?','Ein Klopfsalat! Hihi!'],
 ['Was ist orange und wandert durch den Wald?','Eine Wanderine! Hihihi!'],
 ['Wie nennt man einen Bumerang, der nicht zurückkommt?','Einen Stock! Hihi!'],
 ['Was macht ein Pirat am Computer?','Er drückt die Enter-Taste! Hihi!'],
 ['Was sitzt auf dem Baum und ruft Aha?','Ein Uhu mit Schnupfen! Hihi!'],
 ['Was ist braun, klebrig und läuft durch die Wüste?','Ein Karamel! Hihihi!'],
 ['Warum haben Giraffen so lange Hälse?','Weil ihre Füße so stinken! Hihi!'],
 ['Was liegt am Strand und spricht undeutlich?','Eine Nuschel! Hihihi!']];
const R={
 hallo:['Hallo! Schön, dass du da bist!','Hey hey! Da bist du ja!','Huhu! Ich hab schon auf dich gewartet!'],
 wie:['Mir geht es super! Mein Fell ist heute extra flauschig!','Prima! Und dir?','Ganz toll! Vor allem, wenn du da bist!'],
 gut:['Juhu! Das freut mich!','Super! Dann lass uns was Lustiges machen!'],
 schlecht:['Oh nein! Komm her, ich kuschel dich!','Soll ich dir einen Witz erzählen? Das hilft immer!'],
 name:['Ich heiße Giß-Moe! Und du bist meine allerbeste Freundin!','Ich bin Giß-Moe! Der flauschigste Moe der Welt!'],
 alt:['Ich bin so alt wie ein Gänseblümchen! Glaube ich.','Hmm … ich zähle in Keksen, nicht in Jahren!'],
 lieb:['Ich hab dich auch lieb! Ganz doll!','Ooooh! Ich dich auch! Riesen-Kuschel!'],
 essen:['Oh ja! Ich hab Hunger! Zeig mal, was es gibt!'],
 lieblingsessen:['Kekse! Und Pfannkuchen! Und Bohnen, aber dann muss ich pupsen. Hihi!','Am liebsten Erdbeeren! Und Kuchen, aber nicht zu viel!'],
 farbe:['Meine Lieblingsfarbe ist Regenbogen-Glitzer!','Orange! Wie mein Fell! Und Rosa!'],
 spielen:['Au ja! Lass uns spielen!'],
 muede:['Ich bin auch ein bisschen müde … *gähn*'],
 schlafen:['Okay … ich kuschel mich ein. Gute Nacht!'],
 witzgut:['Hihi, gell? Ich bin ein Witze-Profi!'],
 danke:['Gern geschehen!','Bitte, bitte! Immer wieder!'],
 tschuess:['Tschüss! Komm bald wieder!','Bis später, Krümelmonster!'],
 kitzel:['Hihi! Nicht kitzeln! Hihihi!'],
 pups:['Hihi! Pupsen ist lustig! Aber nur ein bisschen!','Das war ich nicht! Das war … der Teppich! Hihi!'],
 sing:['La la laaa! Ich bin der Giß-Moe, flauschig und froh! La la laaa!'],
 tier:['Ich bin ein Giß-Moe! Halb Kuscheltier, halb Keksmonster!'],
 wo:['Ich wohne hier bei dir! In meinem gemütlichen Zimmer!'],
 schoen:['Danke! Du bist auch wunderschön!','Ohhh, jetzt werde ich ganz rot!'],
 frisur:['Willst du mich frisieren? Juhu, ab zum Friseur!'],
 anziehen:['Oh ja! Modenschau! Ich zieh mich schick an!'],
 dumm:['Hmm, das ist aber nicht so nett. Wollen wir lieber was Lustiges machen?'],
 frage:['Hmm, gute Frage! Da muss ich mal mein Fell schütteln!'],
 egal:['Hihi! Das versteh ich nicht ganz, aber es klingt toll!','Ui! Erzähl mir mehr!','Echt jetzt? Wie spannend!','Hmm … ich bin nur ein kleiner Moe. Frag mich was Leichteres!','Hihi! Du bist lustig!','Wollen wir zusammen spielen?'],
 hoeren:['Hä? Ich hab dich nicht verstanden. Kannst du es tippen?'],
 nomic:['Das Mikro geht gerade nicht. Schreib es einfach auf!']};
const BAD=/\b(scheiße?|scheisse|kacke|arsch|blöd(e|er|mann)?|doof|dumm|idiot|hasse|töten|tot\b|sterben|waffe|pistole|kill)/i;
const INT=[
 [/\b(hallo|hi|hey|huhu|moin|servus|guten (morgen|tag|abend))\b/,'hallo'],
 [/wie geht'?s|wie geht es|alles (gut|klar)/,'wie'],
 [/\b(mir geht'?s|ich bin) (gut|super|toll|prima|froh)|\bgut\b$|\bsuper\b$/,'gut'],
 [/traurig|weinen|schlecht|angst|aua|weh/,'schlecht'],
 [/wie hei(ß|ss)t du|dein name|wer bist du/,'name'],
 [/wie alt/,'alt'],
 [/hab dich lieb|liebe dich|ich mag dich|du bist (mein )?(liebling|süß|suess)/,'lieb'],
 [/lieblingsessen|was (isst|frisst) du|was magst du (essen|am liebsten)/,'lieblingsessen'],
 [/hunger|essen|futter|füttern|fuettern/,'essen'],
 [/lieblingsfarbe|welche farbe/,'farbe'],
 [/witz|lustig|lach/,'witz'],
 [/spielen|spiel|uno|maulwurf/,'spielen'],
 [/gute nacht|schlafen|schlaf gut|ins bett/,'schlafen'],
 [/müde|muede/,'muede'],
 [/danke/,'danke'],
 [/tsch(ü|ue)ss|bye|ciao|bis bald|bis später/,'tschuess'],
 [/kitzel/,'kitzel'],
 [/pups|furz|pupsen/,'pups'],
 [/sing|lied/,'sing'],
 [/was bist du|bist du ein/,'tier'],
 [/wo wohnst|wo bist du/,'wo'],
 [/schön|schoen|hübsch|huebsch|niedlich|süß|suess|toll aussehen/,'schoen'],
 [/haare|frisur|friseur|kämmen|kaemmen|schneiden/,'frisur'],
 [/anziehen|kleid|jacke|hut|mode/,'anziehen']];
const YN=/^(bist|kannst|kann|soll|sollte|wird|werde|darf|hast|habe|magst|ist|gibt|bin|sind|willst|machst|gehst|kommt|werden)\b/;
T.lines=()=>{ const L=[]; Object.values(R).forEach(a=>L.push(...a)); JOKES.forEach(j=>L.push(...j)); L.push('Hallo! Worüber wollen wir quatschen?','Frag mich was! Eine Ja-oder-Nein-Frage!'); return L; };
/* ---------- Panel ---------- */
function build(){ pan=document.createElement('div'); pan.id='chat'; pan.className='panel';
 pan.innerHTML='<div class="ph"><b>💬 Mit Giß-Moe reden</b><button class="x" aria-label="Schließen">✕</button></div>'+
 '<div id="cLog"></div><div class="cChips">'+[['👋','Hallo!'],['😊','Wie geht\'s dir?'],['😂','Erzähl einen Witz!'],['💖','Hab dich lieb!'],['🍪','Was isst du gern?'],['🎱','Ja-Nein-Frage'],['🎮','Spielen!'],['🌙','Gute Nacht!']].map(c=>'<button class="cc" data-t="'+c[1]+'">'+c[0]+' '+c[1]+'</button>').join('')+'</div>'+
 '<div class="cRow"><button id="cMic" aria-label="Sprechen">🎤</button><input id="cIn" maxlength="140" placeholder="Schreib Giß-Moe was …" autocomplete="off" enterkeyhint="send"><button id="cGo" aria-label="Senden">➤</button></div><div id="cSt"></div>';
 document.body.appendChild(pan); const st=document.createElement('style'); st.textContent=
 '#chat{display:flex;flex-direction:column}#cLog{min-height:64px;max-height:24vh;overflow:auto;display:flex;flex-direction:column;gap:6px;padding:4px 4px 8px}'+
 '#cLog .m{max-width:82%;padding:8px 12px;border-radius:18px;font:600 16px system-ui;line-height:1.3}#cLog .u{align-self:flex-end;background:#5ec8ff;color:#fff;border-bottom-right-radius:6px}#cLog .g{align-self:flex-start;background:#fff;color:#4a2c14;border-bottom-left-radius:6px;box-shadow:0 2px 6px rgba(90,50,20,.15)}'+
 '.cChips{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px}.cc{flex:0 0 auto;border:0;border-radius:18px;padding:10px 14px;font:700 15px system-ui;background:linear-gradient(180deg,#fffdf8,#f6e6c8);color:#4a2c14;box-shadow:0 3px 8px rgba(90,50,20,.18)}'+
 '.cRow{display:flex;gap:8px;align-items:center}#cIn{flex:1;min-width:0;height:54px;border-radius:27px;border:3px solid #e8c48e;padding:0 18px;font:600 18px system-ui;background:#fff;color:#4a2c14}'+
 '#cMic,#cGo{flex:0 0 58px;height:58px;border-radius:50%;border:0;font:700 26px system-ui;color:#fff;box-shadow:0 4px 10px rgba(0,0,0,.22),inset 0 -3px 0 rgba(0,0,0,.18)}#cMic{background:linear-gradient(180deg,#ff8a5c,#e2533a)}#cGo{background:linear-gradient(180deg,#7ddc6f,#3fae49)}'+
 '#cMic.on{animation:micp 1s infinite}@keyframes micp{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}#cSt{min-height:18px;margin:6px 8px 0;font:600 14px system-ui;opacity:.75}';
 document.head.appendChild(st);
 log=pan.querySelector('#cLog'); inp=pan.querySelector('#cIn'); micBtn=pan.querySelector('#cMic');
 pan.addEventListener('pointerdown',e=>e.stopPropagation()); pan.addEventListener('keydown',e=>e.stopPropagation());
 pan.querySelector('.x').addEventListener('pointerup',e=>{ e.stopPropagation(); T.close(); });
 const go=()=>{ K.V.unlock(); const v=inp.value; inp.value=''; T.send(v,'text'); };
 pan.querySelector('#cGo').addEventListener('pointerup',e=>{ e.preventDefault(); go(); }); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } });
 micBtn.addEventListener('pointerup',e=>{ e.preventDefault(); K.V.unlock(); listening?stopMic():startMic(); });
 pan.querySelectorAll('.cc').forEach(b=>b.addEventListener('pointerup',e=>{ e.preventDefault(); K.V.unlock(); const t=b.dataset.t; if(t==='Ja-Nein-Frage'){ add('Frag mich was mit Ja oder Nein! Zum Beispiel: Bin ich lustig?','g'); K.say('Frag mich was! Eine Ja-oder-Nein-Frage!'); inp.focus(); return; } T.send(t,'chip'); })); }
function add(t,who){ const d=document.createElement('div'); d.className='m '+who; d.textContent=t; log.appendChild(d); while(log.children.length>30) log.firstChild.remove(); log.scrollTop=log.scrollHeight; }
function status(t){ const s=document.getElementById('cSt'); if(s) s.textContent=t||''; }
T.open=async()=>{ document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show')); pan.classList.add('show'); const k=K; if(k.st.mode==='sleep') await k.wake();
 if(!log.children.length){ const n=k.M.name; const g='Hallo'+(n?' '+n:'')+'! Worüber wollen wir quatschen?'; add(g,'g'); say(g); } status(micInfo()); };
T.close=()=>{ pan.classList.remove('show'); stopMic(); };
function say(t){ const k=K; const d=k.say(t)||1.5; return d; }
async function sayW(t,extra){ add(t,'g'); const d=say(t); await wait(d*1000+(extra==null?250:extra)); }
/* ---------- Verstehen ---------- */
function norm(s){ return (s||'').toLowerCase().replace(/[!?.,;:]+/g,' ').replace(/\s+/g,' ').trim(); }
let lastJoke=-1;
T.reply=function(v){ const s=norm(v); if(!s) return {k:'empty'}; if(BAD.test(s)) return {k:'dumm'};
 for(const [re,k] of INT) if(re.test(s)) return {k};
 if(/\?\s*$/.test(v.trim())&&YN.test(s)) return {k:'8ball'};
 if(/\?\s*$/.test(v.trim())) return {k:'frage'}; return {k:'egal'}; };
T.send=async function(v,src){ v=(v||'').trim().slice(0,140); const k=K; if(!v){ status('Schreib etwas oder tipp auf einen Knopf 🙂'); return; }
 if(busy) return; busy=true; add(v,'u'); k.interact(); try{ if(k.st.mode==='sleep') await k.wake(); await act(T.reply(v),v); } finally{ busy=false; } };
async function act(r,v){ const k=K, A=k.A; const t=k.begin(); k.rest(); A.earUp=0.6; A.earWig=0.8; await wait(350); A.earWig=0;
 const happy=()=>{ A.low=0.6; A.lid=0.35; A.hop=0.4; setTimeout(()=>{ if(k.alive(t)) A.hop=0; },500); };
 switch(r.k){
  case 'witz': { let i; do{ i=(Math.random()*JOKES.length)|0; }while(i===lastJoke&&JOKES.length>1); lastJoke=i; const j=JOKES[i]; A.lookX=0.3; await sayW(j[0],900); if(!k.alive(t)) return; happy(); A.trem=0.6; window.GissFun&&GissFun.sfx&&GissFun.sfx('giggle'); await sayW(j[1],200); A.trem=0; k.xp(1); break; }
  case '8ball': pan.classList.remove('show'); if(window.GissFun&&GissFun.ask8){ await GissFun.ask8(v); } setTimeout(()=>pan.classList.add('show'),400); return;
  case 'essen': await sayW(pick(R.essen)); T.close(); window.GissFun&&GissFun.openTray(); return;
  case 'spielen': await sayW(pick(R.spielen)); T.close(); window.GissGames&&GissGames.openMenu(); return;
  case 'frisur': await sayW(pick(R.frisur)); T.close(); window.GissHair&&GissHair.open(); return;
  case 'anziehen': await sayW(pick(R.anziehen)); T.close(); window.GissWear&&GissWear.open(); return;
  case 'schlafen': await sayW(pick(R.schlafen)); T.close(); k.sleep&&k.sleep('talk'); return;
  case 'lieb': happy(); A.blush=1; k.fx&&k.fx('💖','',4); await sayW(pick(R.lieb)); k.xp(1); break;
  case 'kitzel': case 'pups': happy(); A.trem=0.8; window.GissFun&&GissFun.sfx&&GissFun.sfx('giggle'); await sayW(pick(R[r.k])); A.trem=0; break;
  case 'schlecht': A.earUp=-0.3; A.brow=0.3; await sayW(pick(R.schlecht)); A.brow=0; break;
  case 'dumm': A.brow=0.5; A.earUp=-0.3; await sayW(R.dumm[0]); A.brow=0; break;
  case 'sing': happy(); A.earWig=1.5; await sayW(R.sing[0]); A.earWig=0; break;
  case 'egal': A.lookX=0.35; A.lookY=0.2; await sayW(pick(R.egal)); break;
  default: if(R[r.k]){ if(/hallo|gut|schoen|danke|witzgut/.test(r.k)) happy(); await sayW(pick(R[r.k])); }
 }
 if(k.alive(t)) k.rest(); }
/* ---------- Mikrofon ---------- */
const NB=()=>window.GissAndroid&&typeof GissAndroid.speechAvailable==='function'&&GissAndroid.speechAvailable();
const WS=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
function micInfo(){ if(NB()) return '🎤 Tipp aufs Mikro und sprich – oder schreib einfach.'; if(WS()) return '🎤 Mikro geht – oder schreib einfach.'; return '⌨️ Schreib Giß-Moe einfach was!'; }
function setListen(on){ listening=on; micBtn.classList.toggle('on',on); const A=K.A; if(on){ A.earUp=0.9; A.earFwd=0.45; A.earWig=0.7; A.pup=1.3; } else { A.earWig=0; A.earFwd=0; } }
let gotRes=false;
function startMic(){ if(busy) return; gotRes=false; status('Ich höre zu … 👂');
 if(NB()){ setListen(true); try{ GissAndroid.startListening(); return; }catch(e){ setListen(false); } }
 const SR=WS(); if(SR){ try{ rec=new SR(); rec.lang='de-DE'; rec.interimResults=true; rec.maxAlternatives=1; rec.continuous=false;
   rec.onresult=e=>{ let s=''; for(let i=0;i<e.results.length;i++) s+=e.results[i][0].transcript; inp.value=s; if(e.results[e.results.length-1].isFinal){ gotRes=true; const v=s; inp.value=''; stopMic(); T.send(v,'voice'); } };
   rec.onerror=e=>{ T._err(e.error||'err'); }; rec.onend=()=>{ if(listening&&!gotRes){ const v=inp.value; inp.value=''; setListen(false); status(micInfo()); if(v) T.send(v,'voice'); else noHear(); } };
   setListen(true); rec.start(); return; }catch(e){ rec=null; setListen(false); } }
 /* letzte Stufe: nur Lauschen (kein Verstehen) → Orakel-Antwort */
 if(window.GissFun&&GissFun.askMicVAD&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){ status('Ich kann zuhören, aber keine Wörter verstehen. Frag mich was mit Ja oder Nein!'); T.close(); GissFun.askMicVAD(); return; }
 noMic(); }
function stopMic(){ if(rec){ try{ rec.abort(); }catch(e){} rec=null; } if(NB()&&listening){ try{ GissAndroid.stopListening(); }catch(e){} } setListen(false); status(micInfo()); }
function noHear(){ status('Nichts gehört – nochmal oder tippen 🙂'); sayW(R.hoeren[0]); }
function noMic(){ status('Das Mikro geht gerade nicht – schreib einfach! ⌨️'); sayW(R.nomic[0]); inp.focus(); }
/* Rückrufe der Android-App */
T._partial=s=>{ inp.value=s||''; };
T._res=s=>{ gotRes=true; setListen(false); inp.value=''; status(micInfo()); if(s&&s.trim()) T.send(s,'voice'); else noHear(); };
T._err=c=>{ setListen(false); if(rec){ try{ rec.abort(); }catch(e){} rec=null; } const code=String(c||'');
 if(/no-speech|nomatch|7|6|speech_timeout|no_match/.test(code)) return noHear();
 if(/not-allowed|denied|9|permission/.test(code)){ status('🎤 Mikro nicht erlaubt – schreib einfach!'); return; } noMic(); };
T._state=s=>{ if(s==='ready') status('Jetzt sprechen … 👂'); else if(s==='end') status('Moment … 🤔'); };
T.init=function(k){ K=k; build(); };
window.GissTalk=T;
})();
