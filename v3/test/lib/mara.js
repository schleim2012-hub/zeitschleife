// Rewind V3 – mara.js: Wer spricht wie? (Pete, 22.10.)
//  Mara spricht NUR, wenn sie selbst im Raum zu sehen ist (via 'room'). Sonst RUFT sie auf dem Nokio an (via 'phone') – aber nur,
//  wenn man das Handy hat. Ohne Handy schweigt sie (via 'off'). Erzähler & andere Stimmen sind nicht betroffen.
//  Anruf: Klingeln + Vibration (Controller-Haptik), Handy-Display „MARA ruft an“. Abheben = Handy nehmen/ansehen (VR: ans Gesicht heben,
//  Handy: 🎒, PC: H). Dann kommt die Stimme räumlich aus dem Handy (leicht nach Telefon gefiltert), Text läuft auf dem Display mit.
//  Nicht abgehoben → „Anruf in Abwesenheit“ → beim nächsten Ansehen als Mailbox.
//  TABELLE: eine Zeile pro Satz. via:'' = Regel (Raum, wenn PRESENT[raum], sonst Handy); 'room' | 'phone' | 'off' erzwingt.
//  Schlüssel = Text klein, nur Buchstaben/Ziffern, erste 40 Zeichen (ZSMARA.key(text)). Audiodateien bleiben alle liegen.
(function(){
if(window.ZSMARA) return;
// Räume, in denen Maras Figur/Video zu sehen ist (Stand 22.10.: in keinem Raum)
const PRESENT={ /* era1984:true, … */ };
const LINES={
 'hierwarichschonmalalskind':{room:'kirmes', trig:'Betreten +7s', via:'', text:'„Hier war ich schon mal … als Kind?“'},
 'momentdashabichdoch':{room:'sim', trig:'Schlüssel gefunden', via:'', text:'„Moment … das hab ich doch …“'},
 'rückspulenkostetzehnsekundendaslebenistk':{room:'era1984mall', trig:'Betreten +9s', via:'', text:'„Rückspulen kostet. Zehn Sekunden. Das Leben ist kein Mixtape.“'},
 'komischwieeinbaummehrverbindetalsjedemau':{room:'era2041', trig:'Schlüssel gefunden', via:'', text:'„Komisch, wie ein Baum mehr verbindet, als jede Mauer trennt.“'},
 'woherkennichdiezahl':{room:'pool', trig:'Schlüssel gefunden', via:'', text:'„Woher kenn ich die Zahl?“'},
 'abhiergehtsnurnochvorwärts':{room:'apartment', trig:'Betreten +6s', via:'', text:'„Ab hier geht’s nur noch vorwärts.“'},
 'hörmirzuwenndieuhrabläuftvergessichdichd':{room:'—', trig:'nicht eingeplant (VO-Tabelle)', via:'', text:'„Hör mir zu. Wenn die Uhr abläuft, vergess ich dich. Diesmal für immer.“'},
 'dasistmeinejackewarumistdasmeinejacke':{room:'—', trig:'nicht eingeplant (VO-Tabelle)', via:'', text:'„Das ist meine Jacke. Warum ist das meine Jacke?“'},
 'geheinervonunssollteaufwachen':{room:'—', trig:'nicht eingeplant (VO-Tabelle)', via:'', text:'„Geh. Einer von uns sollte aufwachen.“'},
 'ichhabdasgebautichwolltenurdassjemandmit':{room:'—', trig:'nicht eingeplant (VO-Tabelle)', via:'', text:'„Ich hab das gebaut. Ich wollte nur, dass jemand mitkommt.“'},
 'kennenwirunsdusiehstnettausbleibdoch':{room:'—', trig:'nicht eingeplant (VO-Tabelle)', via:'', text:'„Kennen wir uns? Du siehst nett aus. Bleib doch.“'},
 'dietürmitdemkinderzimmerlichtdafängtsan':{room:'backrooms', trig:'erstes Aufwachen +0,9s → jetzt ERZÄHLER (alpha_hub1_e.mp3), Mara-Fassung aus', via:'off', text:'„Die Tür mit dem Kinderzimmer-Licht. Da fängt’s an.“'},
 'weiterdietürwartet':{room:'backrooms', trig:'Rückkehr in die Backrooms', via:'', text:'„Weiter. Die Tür wartet.“'},
 'dasbandistzuendeoderfängtesgeradeerstan':{room:'end', trig:'Ende-Seite +0,8s', via:'', text:'„Das Band ist zu Ende. Oder fängt es gerade erst an?“'},
 'süßaberdieuhrticktcasanova':{room:'era1984', trig:'Betreten +2,5s', via:'', text:'„Süß. Aber die Uhr tickt, Casanova.“'},
 'dudrehstdaseitzweiminutendransüßabersinn':{room:'era1984', trig:'TV angeklickt +6s', via:'', text:'„Du drehst da seit zwei Minuten dran. Süß. Aber sinnlos. Vielleicht verrät dir ja der High'},
 'wassolldaswerdeneinkunstprojekt':{room:'era1984', trig:'nie aufgerufen (Code vorhanden)', via:'', text:'„Was soll das werden, ein Kunstprojekt?“'},
 'süßerdasistnichtwiemandasbenutzt':{room:'era1984', trig:'nie aufgerufen (Code vorhanden)', via:'', text:'„Süßer… das ist nicht, wie man das benutzt.“'},
 'hahaneinaberichliebedeinekreativität':{room:'era1984', trig:'nie aufgerufen (Code vorhanden)', via:'', text:'„Haha, nein. Aber ich liebe deine Kreativität.“'},
 'undjetztschaunichtmichan':{room:'era1984', trig:'nie aufgerufen (Code vorhanden)', via:'', text:'„Und jetzt? Schau nicht mich an!“'},
 'okayganzernstichbinmaradiesemallkennichn':{room:'era1984mall', trig:'Raum-Monolog (Zeitgeber)', via:'', text:'„Okay, ganz ernst: Ich bin Mara. Diese Mall kenn ich – nur zwölf Jahre später, mit Pastell'},
 'derweißehaiimbadeseehabichgesehenderhaiw':{room:'era1984mall', trig:'Plakat ansehen', via:'', text:'„Der Weiße Hai im Badesee. Hab ich gesehen. Der Hai war ein Schwimmreifen mit Gefühlen.“'},
 'neoncolaseit1984schmecktwiekopfschmerzen':{room:'era1984mall', trig:'Plakat ansehen', via:'', text:'„Neon Cola, seit 1984. Schmeckt wie Kopfschmerzen in Pink.“'},
 'tetristanteräumtjedezeileabnurnichtdeinz':{room:'era1984mall', trig:'Hülle/Buch nehmen', via:'', text:'„Tetris-Tante. Räumt jede Zeile ab. Nur nicht dein Zimmer.“'},
 'neonnostalgiewerheimwehnachdenachtzigern':{room:'era1984mall', trig:'Hülle/Buch nehmen', via:'', text:'„Neon Nostalgie. Wer Heimweh nach den Achtzigern hat, war nie wirklich da.“'},
 'eingameboy1984derkommterstinfünfjahrenst':{room:'era1984mall', trig:'Fundstück nehmen', via:'', text:'„Ein Gameboy? 1984? Der kommt erst in fünf Jahren. Steck den weg, bevor das Raum-Zeit-Kont'},
 'eintamagotchidasistausmeinerzeitwennespi':{room:'era1984mall', trig:'Fundstück nehmen', via:'', text:'„Ein Tamagotchi. Das ist aus meiner Zeit. Wenn es piept, hat es Hunger. Wie du.“'},
 'neoncoladieautomatentrinkendasnachtsheim':{room:'arcade', trig:'Plakat ansehen', via:'', text:'„Neon Cola. Die Automaten trinken das nachts heimlich.“'},
 'einevideokassettebittezurückspulendasgil':{room:'arcade', trig:'Hülle/Buch nehmen', via:'', text:'„Eine Videokassette. Bitte zurückspulen. Das gilt auch für dich.“'},
 'eingameboyineinerspielhalledasistwiesand':{room:'arcade', trig:'Fundstück nehmen', via:'', text:'„Ein Gameboy in einer Spielhalle. Das ist wie Sand mit an den Strand nehmen.“'},
 'einemünzefürgenaueinlebenausgebenwürdeic':{room:'arcade', trig:'Fundstück nehmen', via:'', text:'„Eine Münze. Für genau ein Leben. Ausgeben würde ich sie hier nicht.“'},
 'derweißehaihierdrinkeinesorgederhathausv':{room:'pool', trig:'Plakat ansehen', via:'', text:'„Der Weiße Hai. Hier drin? Keine Sorge. Der hat Hausverbot.“'},
 'level0neinsüßerdashieristlevel37diepoolr':{room:'pool', trig:'Hülle/Buch nehmen', via:'', text:'„Level 0? Nein, Süßer. Das hier ist Level 37. Die Poolrooms. Nicht reinspringen.“'},
 'einpolaroidvombeckenleeraberdawardochebe':{room:'pool', trig:'Fundstück nehmen', via:'', text:'„Ein Polaroid vom Becken. Leer. Aber da war doch eben jemand.“'},
 'brauseimhallenbadkriegtmandavonnichtkräm':{room:'pool', trig:'Fundstück nehmen', via:'', text:'„Brause. Im Hallenbad. Kriegt man davon nicht Krämpfe beim Schwimmen?“'},
 'zurückindievergangenheithängtmittenimmai':{room:'cornfield', trig:'Plakat ansehen', via:'', text:'„Zurück in die Vergangenheit. Hängt mitten im Mais. Irgendwer hat hier Humor.“'},
 'einezeitungdasselbedatumwiegesternundvor':{room:'cornfield', trig:'Hülle/Buch nehmen', via:'', text:'„Eine Zeitung. Dasselbe Datum wie gestern. Und vorgestern.“'},
 'einwürfelimmaisfeldsowaslegtmannichtzufä':{room:'cornfield', trig:'Fundstück nehmen', via:'', text:'„Ein Würfel im Maisfeld. Sowas legt man nicht zufällig hin.“'},
 'einebananehastdudieebenfallenlassenbeiml':{room:'cornfield', trig:'Fundstück nehmen', via:'', text:'„Eine Banane. Hast du die eben fallen lassen? Beim letzten Mal?“'},
 'charmereißtkeinemauerneinsüßereinhammers':{room:'era1989', trig:'Gegenstand nehmen/ansehen', via:'', text:'„Charme reißt keine Mauern ein, Süßer. Ein Hammer schon.“'},
 'marsreisennurfürmillionärehierdrübenwäre':{room:'era1989', trig:'Plakat ansehen', via:'', text:'„Mars-Reisen, nur für Millionäre. Hier drüben wäre man schon mit Mallorca zufrieden.“'},
 'diemaueristwegstehtdaalshättesiejemandve':{room:'era1989', trig:'Hülle/Buch nehmen', via:'', text:'„Die Mauer ist weg. Steht da, als hätte sie jemand verlegt.“'},
 'derkleinetrabitrainerkapiteleinswartenka':{room:'era1989', trig:'Hülle/Buch nehmen', via:'', text:'„Der kleine Trabi-Trainer. Kapitel eins: Warten. Kapitel zwei: weiter warten.“'},
 'einpolaroidwennmanwedeltwirdesschnellerf':{room:'era1989', trig:'Fundstück nehmen', via:'', text:'„Ein Polaroid. Wenn man wedelt, wird es schneller fertig. Stimmt nicht. Machen trotzdem al'},
 'nocheinerdusammelstdiedochnichtetwa':{room:'era2041', trig:'Gegenstand nehmen/ansehen', via:'', text:'„Noch einer? Du sammelst die doch nicht etwa?“'},
 'legdenzurückdergucktmichan':{room:'era2041', trig:'Gegenstand nehmen/ansehen', via:'', text:'„Leg den zurück. Der guckt mich an.“'},
 'soylentgrüneriegelfürdieganzefamiliefrag':{room:'era2041', trig:'Plakat ansehen', via:'', text:'„Soylent. Grüne Riegel für die ganze Familie. Frag lieber nicht, was drin ist.“'},
 'frischebergluftindosenfamiliengrößeschnü':{room:'era2041', trig:'Plakat ansehen', via:'', text:'„Frische Bergluft in Dosen. Familiengröße. Schnüffel nicht dran, Süßer, das ist peinlich.“'},
 'restaurantamendedergalaxisdiezweidareden':{room:'era2041', trig:'Plakat ansehen', via:'', text:'„Restaurant am Ende der Galaxis. Die zwei da reden seit Stunden davon. Keiner war je da.“'},
 'kifürdummieshabichgeschriebenkleinersche':{room:'era2041', trig:'Hülle/Buch nehmen', via:'', text:'„KI für Dummies. Hab ich geschrieben. Kleiner Scherz. … Oder?“'},
 'wieichlerntediesimulationzuliebenspoiler':{room:'era2041', trig:'Hülle/Buch nehmen', via:'', text:'„Wie ich lernte, die Simulation zu lieben. Spoiler: Man gewöhnt sich dran.“'},
 'kochenmitsoylentseiteeinsnimmsoylentseit':{room:'era2041', trig:'Hülle/Buch nehmen', via:'', text:'„Kochen mit Soylent. Seite eins: Nimm Soylent. Seite zwei: Fertig.“'},
 'level0einreiseführerfürdiebackroomswerde':{room:'era2041', trig:'Hülle/Buch nehmen', via:'', text:'„Level 0. Ein Reiseführer für die Backrooms. Wer den braucht, kommt eh nicht mehr raus.“'},
 'peranhalterdurchdenbaumarktdaswichtigste':{room:'era2041', trig:'Hülle/Buch nehmen', via:'', text:'„Per Anhalter durch den Baumarkt. Das Wichtigste steht drauf: Keine Panik in Gang 42.“'},
 'einwürfel2041nenntmandasspeichermediumod':{room:'era2041', trig:'Fundstück nehmen', via:'', text:'„Ein Würfel. 2041 nennt man das Speichermedium. Oder einfach Würfel.“'},
 'grünriegelderkühlschrankistvolldavonunds':{room:'apartment', trig:'Plakat ansehen', via:'', text:'„Grünriegel. Der Kühlschrank ist voll davon. Und sonst nichts.“'},
 'kifürdummiesliegthieralshättejemandgeler':{room:'apartment', trig:'Hülle/Buch nehmen', via:'', text:'„KI für Dummies. Liegt hier, als hätte jemand gelernt. Aufgegeben auch.“'},
 'wieichlerntediesimulationzuliebeneselsoh':{room:'apartment', trig:'Hülle/Buch nehmen', via:'', text:'„Wie ich lernte, die Simulation zu lieben. Eselsohr auf Seite eins.“'},
 'einordnermietvertragbis2099unterschriebe':{room:'apartment', trig:'Fundstück nehmen', via:'', text:'„Ein Ordner. Mietvertrag bis 2099. Unterschrieben mit Kabel.“'},
 'nochsoeinwürfeldiesindüberallwiekrümel':{room:'apartment', trig:'Fundstück nehmen', via:'', text:'„Noch so ein Würfel. Die sind überall. Wie Krümel.“'},
 'tetristanteräumtjedezeileabnurnichtdeinz':{room:'era1984', trig:'Hülle/Buch nehmen', via:'', text:'„Tetris-Tante. Räumt jede Zeile ab. Nur nicht dein Zimmer.“'},
 'einespringmauszufrühsüßerdiekommterstinn':{room:'era1984', trig:'Fundstück nehmen', via:'', text:'„Eine Springmaus? Zu früh, Süßer. Die kommt erst in neun Jahren. Leg sie hin, bevor sie qu'},
 'schonwiederhierdasfeldistrundsüßeroderdu':{room:'cornfield', trig:'im Kreis gelaufen (Möbius-Schleife)', via:'', text:'„Schon wieder hier? Das Feld ist rund, Süßer. Oder du bist es.“'},
 'geradeausisthiernureinemeinung':{room:'cornfield', trig:'im Kreis gelaufen (Möbius-Schleife)', via:'', text:'„Geradeaus ist hier nur eine Meinung.“'},
 'schönundminutenextra':{room:'kirmes', trig:'Bude gewonnen (dynamisch: „Schön! …“)', via:'', text:'Schön! … – und … Minuten extra.'},
 'netterwurffastwie89':{room:'basket', trig:'Korb getroffen', via:'', text:'Netter Wurf. Fast wie 89.'},
 'swishdiestraßehatesgehört':{room:'basket', trig:'Korb getroffen', via:'', text:'Swish. Die Straße hat es gehört.'},
 'nocheinerdannglaubichdirdiezeitreise':{room:'basket', trig:'Korb getroffen', via:'', text:'Noch einer – dann glaub ich dir die Zeitreise.'},
 'nichtschlechtfürjemandenausderzukunft':{room:'basket', trig:'Korb getroffen', via:'', text:'Nicht schlecht für jemanden aus der Zukunft.'},
 'dreihintereinanderichschenkdiranderthalb':{room:'basket', trig:'drei Körbe in Folge', via:'', text:'Drei hintereinander – ich schenk dir anderthalb Minuten.'},
 'dreihintereinandermehrzeitgibtsdiesmalni':{room:'basket', trig:'drei Körbe in Folge', via:'', text:'Drei hintereinander. Mehr Zeit gibt\'s diesmal nicht.'},
};
const key=t=>String(t||'').toLowerCase().replace(/[^a-zäöüß0-9]+/g,'').slice(0,40);
const room=()=>{ try{ if(window.ZSA&&ZSA.on) return ZSA.cur().id; }catch(e){} const p=location.pathname.split('/').pop().replace('.html',''); return ({era_pool:'pool',era_cornfield:'cornfield',era_arcade:'arcade',era_apartment:'apartment',kirmes:'kirmes',basket:'basket',sim:'sim'})[p]||p; };
const phoneOwned=()=>{ try{ if(!window.NOKIO) return false; if(NOKIO.owned) return NOKIO.owned(); /* erst gefunden im Kinderzimmer 1984 */ if(!NOKIO.ready) return true; /* Handy lädt noch → Anruf wartet */ if(window.ZSINV&&ZSINV.list) return ZSINV.list().some(i=>(i&&i.id||i)==='nokio'); return true; }catch(e){ return false; } };
const log=window.__maraLog=[];
function viaFor(text){ const r=room(), e=LINES[key(text)]; let v=(e&&e.via)||(PRESENT[r]?'room':'phone'); if(v==='phone'&&!phoneOwned()) v='off'; return v; }
// ---------- Anrufe ----------
const Q=[]; let cur=null;
const AC=()=>{ try{ return window.__zsaAC||(window.__zsaAC=new (window.AudioContext||window.webkitAudioContext)()); }catch(e){ return null; } };
function next(){ if(cur||!Q.length) return; if(!window.NOKIO||!NOKIO.ready){ setTimeout(next,1000); return; } cur=Q.shift(); if(!phoneOwned()){ cur=null; setTimeout(next,0); return; } cur.state='ring'; cur.rings=0; NOKIO.call=cur; ring(); }
function ring(){ if(!cur||cur.state!=='ring') return; if(cur.rings>=4){ cur.state='missed'; NOKIO.redraw&&NOKIO.redraw(); return; } cur.rings++; try{ NOKIO.ring&&NOKIO.ring(); NOKIO.buzz&&NOKIO.buzz(); }catch(e){} cur.rt=setTimeout(ring,3600); }
const answering=()=>!!(window.NOKIO&&(NOKIO.looking||NOKIO.where==='hand'));
setInterval(()=>{ if(!cur||cur.state==='talk') return; if(answering()){ clearTimeout(cur.rt); talk(cur.state==='missed'); } },150);
function talk(mailbox){ const c=cur; c.state='talk'; c.mailbox=mailbox; c.t0=performance.now(); c.dur=Math.max(3,(c.text.length*0.065)); try{ NOKIO.beep&&0; }catch(e){}
 const end=()=>{ if(c.done) return; c.done=true; try{ c.a&&c.a.pause(); }catch(e){} try{ c.src&&c.src.disconnect(); }catch(e){} setTimeout(()=>{ if(NOKIO.call===c) NOKIO.call=null; NOKIO.redraw&&NOKIO.redraw(); cur=null; setTimeout(next,1500); },700); };
 c.end=end;
 // Abschrift ins SMS-Fach (nachlesbar), schon gelesen
 try{ NOKIO.inbox.push({from:'MARA (Anruf)',ts:'',text:c.text.replace(/^„|“$/g,'')}); }catch(e){}
 if(c.file){ const a=c.a=new Audio(c.file); a.crossOrigin='anonymous'; a.volume=1; let spatial=false;
  try{ const ac=AC(); if(ac){ ac.resume&&ac.resume(); const src=c.src=ac.createMediaElementSource(a); const hp=ac.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=320; const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3400; const pan=ac.createPanner(); pan.panningModel='HRTF'; pan.distanceModel='inverse'; pan.refDistance=0.35; pan.rolloffFactor=1;
    const g=ac.createGain(); g.gain.value=1.6; src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(pan); pan.connect(ac.destination); spatial=true;
    const v=new THREE.Vector3(); const upd=()=>{ if(c.done) return; try{ const o=NOKIO.el&&NOKIO.el.object3D; if(o){ o.getWorldPosition(v); if(pan.positionX){ pan.positionX.value=v.x; pan.positionY.value=v.y; pan.positionZ.value=v.z; } else pan.setPosition(v.x,v.y,v.z); } }catch(e){} requestAnimationFrame(upd); }; upd(); } }catch(e){ spatial=false; }
  a.onloadedmetadata=()=>{ if(isFinite(a.duration)) c.dur=a.duration; };
  a.onended=end; a.onerror=()=>setTimeout(end,c.dur*1000);
  a.play().catch(()=>setTimeout(end,c.dur*1000)); setTimeout(end,(Math.max(c.dur,a.duration||0)+8)*1000);
 } else setTimeout(end,c.dur*1000+600); }
function call(text,file){ if(Q.length>=3) Q.shift(); Q.push({who:'Mara',text:String(text||''),file:file||null}); next(); }
// ---------- Router: von allen Sprechstellen aufgerufen. Rückgabe 'room' = normal abspielen; sonst NICHTS abspielen und nicht warten.
function route(who,text,file){ if(who!=='Mara') return 'room'; const v=viaFor(text); log.push([room(),v,String(text).slice(0,50)]); if(v==='phone') call(text,file); return v; }
window.ZSMARA={LINES,PRESENT,key,route,viaFor,call,phoneOwned,queue:Q,cur:()=>cur};
})();
