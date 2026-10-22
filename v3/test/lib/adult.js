/* adult.js – Erwachsenen-Modus für Rewind (Pete, 22.10.: Spiel 16/18, Larry-Stil).
   Standard ist IMMER jugendfrei. An nur nach bestandenem Altersquiz (5 Fragen, alle richtig) – oder wieder aus im Menü (☰ › Optionen).
   Zustand: localStorage zs_adult='1' UND zs_adult_ok='quiz-v1' (beides nötig; alter/halber Zustand = jugendfrei). ?kids=1 erzwingt jugendfrei.
   Setzt window.ZS_ADULT (true/false) synchron beim Laden, bevor die Räume ihre Texturen wählen (z. B. Warteraum-Pin-ups).
   API: ZSAdult.on() · ZSAdult.quiz() · ZSAdult.off() · ZSAdult.menu() · ZSAdult.gate() (Titelbild, einmalig) */
(function(){
if(window.ZSAdult) return;
const LS={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}},del:k=>{try{localStorage.removeItem(k);}catch(e){}}};
const OK='quiz-v1', kids=/[?&]kids=1/.test(location.search);
if(kids){ LS.del('zs_adult'); LS.del('zs_adult_ok'); }
const on=()=>!kids&&LS.get('zs_adult')==='1'&&LS.get('zs_adult_ok')===OK;
window.ZS_ADULT=on();
// ---------- Fragenpool (70er/80er, BRD/DDR-Alltag) – richtige Antwort steht jeweils zuerst, wird gemischt ----------
const Q=[
 ['Wie viele Stellen hatte eine westdeutsche Postleitzahl vor 1993?',['Vier','Fünf','Sechs','Postleit-was? Man schrieb „Bei Oma“ drauf']],
 ['Was lag in der Videothek hinter dem Vorhang mit dem Schild „Ab 18“?',['Die Filme, für die man den Ausweis zeigen musste','Das Lager für kaputte Kassetten','Die Toilette fürs Personal','Der Rückspul-Automat']],
 ['Wo standen am Kiosk die Herrenmagazine?',['Ganz oben im Regal, wo Kinder nicht hinkamen','Neben den Micky-Maus-Heften','In der Kühltruhe beim Eis','Gar nicht – die gab es nur per Post']],
 ['Bis wann hatten die Läden an einem normalen Samstag in den 80ern (West) offen?',['Bis 14 Uhr','Bis 20 Uhr','Rund um die Uhr','Samstag war Ruhetag, nur der Bäcker durfte']],
 ['Wie viel Promille durfte man in der BRD der 80er beim Autofahren höchstens haben?',['0,8','0,0','0,3','So viel, wie in den Kofferraum passt']],
 ['Wie schnell durfte man auf DDR-Autobahnen höchstens fahren?',['100 km/h','130 km/h','Unbegrenzt','So schnell, wie der Trabbel eben kann: 60']],
 ['Was kostete 1984 eine Briefmarke für einen normalen Brief (BRD)?',['80 Pfennig','20 Pfennig','1,10 Mark','Eine Kugel Eis']],
 ['Was lief nachts nach Sendeschluss im Fernsehen?',['Das Testbild','Werbung für Pfannen','Wiederholungen bis morgens','Ein Kaminfeuer in Dauerschleife']],
 ['Wozu brauchte man einen Bleistift und eine Musikkassette?',['Band zurückspulen, ohne die Batterien leerzumachen','Damit die Kassette lauter spielt','Zum Löschen der Aufnahme','Zum Unterschreiben des Bandsalats']],
 ['Wofür stand BTX bei der Bundespost?',['Bildschirmtext','Bundes-Taxi','Brief-Turbo-Express','Bitte Telefon Xmal klingeln lassen']],
 ['In welchem Jahr ging in Westdeutschland das erste Privatfernsehen auf Sendung?',['1984','1972','1991','1999']],
 ['Was kostete ein Liter Normalbenzin 1984 in Westdeutschland ungefähr?',['Rund 1,40 Mark','Rund 40 Pfennig','Rund 3,50 Mark','Rund 1,40 Euro']],
 ['Wie lange dauerte der Grundwehrdienst in der Bundeswehr der 80er?',['15 Monate','6 Monate','3 Jahre','Bis der Spieß einen leiden konnte']]];
const shuf=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
// ---------- Oberfläche (DOM, nur Bildschirm/Handy; im Headset nicht nötig – Quiz kommt vor dem Einstieg) ----------
const css=`#zsq{position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;background:rgba(10,7,4,.78);backdrop-filter:blur(3px);font-family:ZSRaj,"DejaVu Sans Condensed",sans-serif;color:#e6d8ba;-webkit-user-select:none;user-select:none}
#zsq .p{position:relative;width:min(640px,calc(100vw - 28px));max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;padding:22px 24px 20px;background:linear-gradient(#1f1912,#15110c);border:1px solid #6a5434;border-radius:14px;box-shadow:0 14px 50px rgba(0,0,0,.7)}
#zsq .p:before{content:"";position:absolute;inset:0;pointer-events:none;border-radius:14px;background:repeating-linear-gradient(0deg,rgba(0,0,0,.12) 0 1px,rgba(0,0,0,0) 1px 3px)}
#zsq h3{margin:0 0 4px;font:700 13px/1 ZSRaj,sans-serif;letter-spacing:.42em;color:#b89a62}
#zsq h2{margin:0 0 12px;font:700 26px/1.15 ZSRaj,sans-serif;letter-spacing:.06em;color:#f0e2c2}
#zsq p{margin:0 0 14px;font:500 16px/1.4 ZSRaj,"DejaVu Sans",sans-serif;color:#d6c6a4}
#zsq .a{display:flex;flex-direction:column;gap:8px}
#zsq button{font:600 16px/1.25 ZSRaj,"DejaVu Sans",sans-serif;letter-spacing:.04em;color:#eadcbc;background:#2a2219;border:1px solid #574631;border-radius:10px;padding:12px 14px;text-align:left;cursor:pointer}
#zsq button:hover,#zsq button:active{background:#3a2f22;border-color:#8a6e44}
#zsq button.sec{background:none;border-color:#3a3024;color:#a89678;font-size:14px}
#zsq .dots{display:flex;gap:6px;margin:0 0 12px}#zsq .dots i{width:22px;height:4px;border-radius:2px;background:#3a3024}#zsq .dots i.on{background:#c9a96a}
#zsq .st{display:inline-block;margin:2px 0 12px;padding:6px 12px;border:2px solid #b4573a;color:#d77a5a;font:700 15px/1 ZSRaj,sans-serif;letter-spacing:.25em;transform:rotate(-3deg)}`;
let root=null;
function ui(html){ if(!document.getElementById('zsq-css')){ const s=document.createElement('style'); s.id='zsq-css'; s.textContent=css; document.head.appendChild(s); }
 if(!root){ root=document.createElement('div'); root.id='zsq'; ['touchstart','touchend','mousedown','click','keydown'].forEach(t=>root.addEventListener(t,e=>e.stopPropagation())); document.body.appendChild(root); }
 root.innerHTML='<div class="p">'+html+'</div>'; root.style.display='flex'; return root; }
function close(){ if(root) root.style.display='none'; }
function btns(list){ return '<div class="a">'+list.map((b,i)=>`<button data-i="${i}" class="${b[2]||''}">${b[0]}</button>`).join('')+'</div>'; }
function bind(list){ root.querySelectorAll('button[data-i]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); const f=list[+b.dataset.i][1]; f&&f(); }); }
function show(h,list){ ui(h+btns(list)); bind(list); }
const locked=()=>{ const t=+LS.get('zs_adult_lock')||0; return Date.now()<t?Math.ceil((t-Date.now())/60000):0; };
function setOn(v,reload){ if(v){ LS.set('zs_adult','1'); LS.set('zs_adult_ok',OK); } else { LS.del('zs_adult'); LS.del('zs_adult_ok'); } LS.set('zs_adult_asked','1'); window.ZS_ADULT=on();
 try{ window.dispatchEvent(new CustomEvent('zs-adult',{detail:window.ZS_ADULT})); }catch(e){} if(reload) inRoomReload(); }
function inRoomReload(){ if(document.querySelector('a-scene')&&!document.getElementById('start')) setTimeout(()=>location.reload(),300); }   // im Raum: neu laden, damit er seine Inhalte neu wählt
function quiz(after){ const m=locked(); if(m){ show(`<h3>ALTERSKONTROLLE</h3><h2>Noch gesperrt</h2><p>Nach einem verpatzten Quiz darfst du erst in ${m} Minute${m>1?'n':''} wieder ran. Bis dahin: jugendfrei.</p>`,[['Okay',()=>{ close(); after&&after(false); }]]); return; }
 const qs=shuf(Q).slice(0,5); let n=0, right=0;
 const step=()=>{ const [q,a]=qs[n], opts=shuf(a.map((t,i)=>[t,i===0]));
  show(`<h3>ALTERSKONTROLLE · FRAGE ${n+1} VON 5</h3><div class="dots">${qs.map((_,i)=>`<i class="${i<=n?'on':''}"></i>`).join('')}</div><h2>${q}</h2>`,
   opts.map(o=>[o[0],()=>{ if(o[1]) right++; n++; n<qs.length?step():done(); }]).concat([['Abbrechen – jugendfrei weiterspielen',()=>{ setOn(false); close(); after&&after(false); },'sec']])); };
 const done=()=>{ if(right===qs.length){ setOn(true); show(`<h3>ALTERSKONTROLLE</h3><span class="st">BESTANDEN</span><h2>Glückwunsch. Du bist offiziell alt.</h2><p>Erwachsenen-Modus ist an: frechere Sprüche und Pin-ups an der Wand. Ausschalten kannst du ihn jederzeit im Menü unter ☰ › Optionen.</p>`,[['Weiter',()=>{ close(); if(after) after(true); else inRoomReload(); }]]); }
  else { LS.set('zs_adult_lock',String(Date.now()+10*60000)); setOn(false); show(`<h3>ALTERSKONTROLLE</h3><span class="st">DURCHGEFALLEN</span><h2>Das war nix.</h2><p>Kein Drama – du spielst jugendfrei. Frag mal deine Eltern, die wissen das alles noch. Neuer Versuch in 10 Minuten über ☰ › Optionen.</p>`,[['Jugendfrei weiterspielen',()=>{ close(); after&&after(false); }]]); } };
 show(`<h3>ALTERSKONTROLLE</h3><h2>Bist du alt genug für dieses Spiel?</h2><p>Ein paar Räume haben eine Fassung ab 18: frechere Sprüche, Pin-ups, ein bisschen nackte Haut. Beweis uns, dass du die 80er bewusst erlebt hast: fünf Fragen, alle müssen stimmen. Googeln ist Schummeln.</p>`,
  [['▶ Quiz starten',step],['Nein danke – jugendfrei spielen',()=>{ setOn(false); close(); after&&after(false); },'sec']]); }
function menu(){ if(on()) show(`<h3>OPTIONEN</h3><h2>Erwachsenen-Modus ist an</h2><p>Frechere Sprüche und Pin-ups. Ausschalten macht das Spiel sofort wieder jugendfrei.</p>`,[['Ausschalten (jugendfrei)',()=>{ setOn(false,true); close(); }],['← Zurück',close,'sec']]);
 else show(`<h3>OPTIONEN</h3><h2>Erwachsenen-Modus ist aus</h2><p>Das Spiel ist gerade jugendfrei. Mit dem Altersquiz schaltest du die Fassung ab 18 frei.</p>`,[['▶ Altersquiz machen',()=>quiz()],['← Zurück',close,'sec']]); }
// Titelbild: beim allerersten Start einmal fragen (danach nur noch über das Menü)
function gate(){ if(kids||LS.get('zs_adult_asked')==='1') return; const st=document.getElementById('start'); if(!st||st.style.display==='none') return; quiz(); }
window.ZSAdult={on,quiz,menu,gate,off:()=>setOn(false,true),close};
document.addEventListener('DOMContentLoaded',()=>{ if(/alpha\.html$/.test(location.pathname)||document.getElementById('start')) setTimeout(gate,900); });
})();
