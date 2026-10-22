/* Giß-Moe – Gedächtnis & Persönlichkeit (eigene Logik, kein fremder Code).
   Alles steckt im Speicher-Objekt M (localStorage), damit es Neuladen und Tage überlebt.
   Reine Funktionen, Zeit kommt immer als Parameter rein → mit Zeitsprüngen testbar. */
(function(root){
const DAY=86400000;
const dayKey=t=>{ const d=new Date(t); return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); };
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Was an welchem Lebenstag dazukommt (Tag 1 = erster Spieltag)
const UNLOCK={ name:1, mood:2, snack:2, tricks:3, joke:4, ownsong:5, story:6, party:7 };
const WORDCAP=[0,4,6,8,10,12,14,16]; // max. gelernte Wörter je Lebenstag (ab Tag 7 alle 16)
const TRICKS=[ // wird gelernt, wenn ein Kunststück oft genug wiederholt wurde
 {id:'spin',  name:'Dreh-Tanz',      from:'dance', need:3},
 {id:'hop',   name:'Hüpf-Tanz',      from:'dance', need:6},
 {id:'duet',  name:'Mitsingen',      from:'song',  need:4},
 {id:'giggle',name:'Kicher-Anfall',  from:'tickle',need:8},
 {id:'ears',  name:'Ohren-Propeller',from:'pet',   need:12}];
function init(M,now){ const ev=[];
 if(!M.born){ M.born=now; }
 M.days=M.days||[]; M.mood=M.mood||{love:2,cheek:0,grump:0}; M.feedH=M.feedH||new Array(8).fill(0); M.cnt=M.cnt||{}; M.tricks=M.tricks||[]; M.seen=M.seen||{};
 M.sessions=(M.sessions||0)+1;
 const away=M.ts?now-M.ts:0;
 if(away>6*3600e3){ const f=Math.pow(0.7,away/DAY); M.mood.cheek*=f; M.mood.love=Math.max(2,M.mood.love*Math.pow(0.85,away/DAY)); } // über Nacht wird die Laune wieder ruhiger
 if(away>2*DAY){ const d=Math.floor(away/DAY); M.mood.grump=clamp(M.mood.grump+Math.min(7,d*1.6),0,10); M.mood.love=clamp(M.mood.love-d*0.8,0,10); ev.push({type:'missed',days:d}); }
 const k=dayKey(now); if(M.days.indexOf(k)<0){ M.days.push(k); M.xp=(M.xp||0)+(M.days.length>1?4:0); ev.push({type:'newday',age:age(M,now),playDays:M.days.length}); }
 const a=age(M,now); for(const f in UNLOCK){ if(UNLOCK[f]<=a&&!M.seen['u_'+f]){ M.seen['u_'+f]=1; if(UNLOCK[f]>1) ev.push({type:'unlock',what:f,age:a}); } }
 if(a>=7&&!M.seen.party){ ev.push({type:'party',age:a}); }
 return ev; }
function age(M,now){ return Math.max(1,Math.floor((dayKeyTime(now)-dayKeyTime(M.born||now))/DAY+0.5)+1); }
function dayKeyTime(t){ const d=new Date(t); d.setHours(12,0,0,0); return d.getTime(); }
function has(M,f,now){ return age(M,now)>=UNLOCK[f]; }
function wordCap(M,now){ return WORDCAP[Math.min(7,age(M,now))]; }
// Anteil deutscher Sätze bei bekannten Wörtern: wächst mit Spieltagen und Spielzeit
function germanP(M,now){ const d=(M.days||[]).length; return clamp(0.25+0.09*d+(M.xp||0)*0.002,0.25,0.92); }
// Eine Begegnung merken → Stimmung, Gewohnheiten, Kunststücke
const EFFECT={pet:{love:.5},tickle:{love:.4},hug:{love:.6},feed:{love:.4},happy:{love:.25},dance:{love:.3},song:{love:.2},
 water:{cheek:1.1},bright:{cheek:.9},tease:{cheek:1},sneeze:{cheek:.5}};
function note(M,kind,now){ const ev=[]; const e=EFFECT[kind]||{}; const m=M.mood;
 for(const k in e) m[k]=clamp(m[k]+e[k],0,10);
 if(e.love) m.grump=clamp(m.grump-0.7,0,10); // Zuwendung macht Grummeln weg
 M.cnt[kind]=(M.cnt[kind]||0)+1;
 if(kind==='feed'){ const h=new Date(now).getHours(); M.feedH[(h/3)|0]++; M.lastFeedDay=dayKey(now)*10+((h/3)|0); }
 if(has(M,'tricks',now)&&M.trickDay!==dayKey(now)) for(const t of TRICKS){ if(t.from===kind&&M.cnt[kind]>=t.need&&M.tricks.indexOf(t.id)<0){ M.tricks.push(t.id); M.trickDay=dayKey(now); ev.push({type:'trick',id:t.id,name:t.name}); break; } }
 return ev; }
// lange nicht beachtet (in der laufenden Sitzung)
function lonely(M,ms){ M.mood.grump=clamp(M.mood.grump+ms/60000*0.8,0,10); M.mood.love=clamp(M.mood.love-ms/60000*0.2,0,10); }
// langsames Abklingen Richtung neutral (pro Sekunde)
function decay(M,dt){ const m=M.mood; m.cheek=Math.max(0,m.cheek-dt*0.004); m.grump=Math.max(0,m.grump-dt*0.002); m.love=Math.max(1,m.love-dt*0.001); }
function mood(M,now){ if(!has(M,'mood',now)) return 'normal'; const m=M.mood;
 if(m.grump>=4&&m.grump>=m.love*0.7) return 'grumpy'; if(m.cheek>=4&&m.cheek>=m.love*0.8) return 'cheeky'; if(m.love>=5) return 'cuddly'; return 'normal'; }
// Keks-Zeit: um diese Tageszeit wurde schon oft gefüttert, heute in diesem Zeitfenster noch nicht
function snackTime(M,now){ if(!has(M,'snack',now)) return false; const h=new Date(now).getHours(), b=(h/3)|0; return M.feedH[b]>=3&&M.lastFeedDay!==dayKey(now)*10+b; }
function cleanName(s){ return String(s||'').replace(/[<>{}\\\/"`]/g,'').replace(/\s+/g,' ').trim().slice(0,16); }
function reset(M){ for(const k of Object.keys(M)) delete M[k]; M.xp=0; M.learned=0; M.hunger=3; }
root.GissBrain={DAY,UNLOCK,WORDCAP,TRICKS,init,age,has,wordCap,germanP,note,lonely,decay,mood,snackTime,cleanName,reset,dayKey};
if(typeof module!=='undefined') module.exports=root.GissBrain;
})(typeof window!=='undefined'?window:globalThis);
