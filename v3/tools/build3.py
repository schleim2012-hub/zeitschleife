# V3-Daten (Meilenstein 1: Backrooms + 1989). Erzeugt data/game3.json. NICHT das V2-build_data.py!
import json
M=json.load(open('data/rooms_meta.json'))
def N(t): return {'say':t,'speaker':'narrator'}
def Ma(t): return {'say':t,'speaker':'mara'}
def Gr(t): return {'say':t,'speaker':'grenzer'}
def Be(t): return {'say':t,'speaker':'beamtin'}
def Ty(t): return {'say':t,'speaker':'mauertyp'}
def IF(c,a,b=None): d={'if':c,'then':a}; d.update({'else':b} if b else {}); return d
config={
 'start':'B1','stillDir':'stills','skyDir':'sky','clipDir':'clips',
 'epochs':{'hub':'Backrooms','1972':'Festival 1972','1984':'Pool 1984','1989':'Berlin 1989','2041':'Dystopie 2041'},
 'epochEntry':{'hub':'B2','1989':'M1'},'openEpochs':['hub','1984'],
 # ---- ALLE Zeit-/Spielzahlen an EINER Stelle (vorläufig, Pete stellt sie ein) ----
 'timing':{'_info':'Alle Werte in Sekunden. Vorläufig, frei änderbar.',
   'timeLimit':1200,'maxBonus':300,'minTimeAfterPenalty':60,
   'slinkyCost':60,'slinkyUses':3,
   'trapDefault':20,'glitchPenaltyFrom':5,'glitchPenalty':30,
   'hintTier2After':60,'hintTier2Fails':3,'idleHint':90},
 'invLimit':6,
 'plate':M['_plate'],
 'speakers':{'narrator':['ERZÄHLER','#8fe9ff'],'mara':['MARA','#ff8fd8'],'grenzer':['GRENZER','#ffd27a'],'beamtin':['BEAMTIN','#ffd27a'],'mauertyp':['MAUER-TYP','#ffd27a']},
 'failLines':[N("Nö. Einfach nein."),N("Das ergibt null Sinn. Selbst für 1989."),Ma("Haha, nein. Aber ich liebe deine Kreativität."),N("Du versuchst es. Das Universum schüttelt den Kopf."),
   N("Larry hätte das auch versucht. Larry ist übrigens Single."),N("Interessant. Falsch, aber interessant."),Ma("Echt jetzt? Ich schau weg und tu so, als hätte ich nichts gesehen."),N("Selbst in einer Zeitschleife gibt es Grenzen.")],
 'comboFail':[N("Du hältst beides aneinander. Nichts passiert. Außer Peinlichkeit."),N("Das lässt sich nicht kombinieren. Das ist kein Crafting-Spiel.")],
 'lines':{
   'invFull':N("Deine Taschen sind voll. Sechs Sachen, mehr trägt kein vernünftiger Zeitreisender. In den Backrooms steht ein Mülleimer. Nur so als Tipp."),
   'tooEarly':Ma("Versuch erst noch selbst was. Ich glaub an dich. Ein bisschen."),
   'larry':N("Hinweis Stufe drei. Larry wäre stolz auf dich. Larry hat auch nie was allein geschafft."),
   'newLoop':N("Die Zeit ist um. Die Röhren knacken, der Teppich riecht wieder nach Montag. Neue Schleife. Du weißt noch alles. Deine Taschen nicht."),
   'trashIn':N("Weg damit. Der Eimer schluckt es ohne Kommentar. Im Gegensatz zu mir."),
   'trashOut':N("Du wühlst im Eimer und holst alles raus, was du ihm anvertraut hast. Treuer als die meisten Ex-Freundinnen."),
   'trashAnchor':Ma("Spinnst du? Das ist ein Anker. Den wirft man nicht weg, den hält man fest."),
   'slinkyNone':Ma("Er ist auch ratlos."),
   'slinky3':N("Interessant, wie zielstrebig so eine Feder ist."),
   'slinkyRun':N("Der Slinky hat genug. Er rappelt sich auf, schaut dich an und hüpft davon. In die Freiheit. Wie alle heute."),
   'slinkyRun2':Ma("Hat der gerade gewunken?"),
   'sliceEnd':N("Ende von Kapitel eins. Die anderen Türen gehen in der nächsten Version auf. Bis dahin: Danke fürs Spielen. Und wasch dir die Hände. Mauerstaub."),
 }}
items={
 'polaroid':{'name':'Polarbild','icon':'📷','desc':'„Finde mich – M.“ Sieht fast aus wie ein Ausweis.'},
 'dm':{'name':'100 D-Mark','icon':'💵','desc':'Begrüßungsgeld. Frisch aus dem Westen.'},
 'banane':{'name':'Banane','icon':'🍌','desc':'Begrüßungsbanane. Wertvoller als Gold, 1989.'},
 'hammer':{'name':'Hammer & Meißel','icon':'🔨','desc':'Für Mauern. Nur für Mauern.'},
 'mauer':{'name':'Mauerstück','icon':'🧱','desc':'Anker. Bunt bemalt, historisch, schwer.','anchor':True},
 'slinky':{'name':'Neon-Slinky','icon':'🌀','desc':'Eine neongelbe Spiralfeder. Auswählen = auf den Boden setzen. Kostet Zeit.','use':'slinky'},
 'tasse':{'name':'Kaffeetasse','icon':'☕','desc':'„Bester Mitarbeiter des Monats, März 1993“. Leer. Wie sein Blick.','fail':N("Du hältst die Tasse hin. Niemand schenkt dir was ein. Niemand.")},
 'akte':{'name':'Leere Akte','icon':'📁','desc':'Eine Stasi-Akte. Leer. Entweder warst du sehr brav oder sehr langweilig.','fail':N("Die Akte ist leer. Sie hat dir nichts zu sagen. Und du ihr offenbar auch nicht.")},
 'huhn':{'name':'Gummihuhn mit Seilrolle','icon':'🐔','desc':'Kombinierbar mit nichts. Garantiert. Vermutlich.','fail':N("Das Gummihuhn quietscht vorwurfsvoll. Es wartet auf ein anderes Spiel.")},
 'radkappe':{'name':'Trabbel-Radkappe','icon':'⚙️','desc':'Leicht wie ein Versprechen, genauso hohl.','fail':N("Eine Radkappe ist keine Lösung. Sie ist nicht mal ein Rad.")},
}
def plateHit(b): return {'box':b}
# ------------------------------------------------- Backrooms
B1h=M['B1']
nodes={}
nodes['B1']={'epoch':'hub','title':'Backrooms – Aufwachen','sky':'B1',
 'enter':[IF('!flag.intro',[{'set':'intro'},{'radio':True},IF('loop>=2',[N("Und wieder ist es sechs Uhr …"),Ma("Nicht schon wieder dieses Lied. Ich kann jeden Ton mitsummen. Rückwärts."),N("Du wachst auf. Schon wieder. Der Teppich erkennt dich und tut so, als würde er sich freuen.")],
   [N("Du wachst auf. Gelbe Flure, summendes Neon, kein Ende in Sicht. Es riecht nach feuchtem Teppich und schlechten Entscheidungen. Also fast wie bei dir zuhause."),{'note':'Aufgewacht in den Backrooms. 20 Minuten, sagt mein Bauch.'}])])],
 'props':[{'id':'polaroid','type':'polaroid','pos':[-0.55,-1.59,-1.35],'when':'!has.polaroid'},
          {'id':'eimer','type':'trash','pos':[2.75,-1.6,-0.9]},
          {'id':'tasse','type':'mug','pos':[-3.2,-1.6,1.6],'when':'!flag.tasse'},
          {'id':'radio','type':'radio','pos':[0.55,-1.6,-0.75]},
          {'id':'murmel','type':'marmot','pos':[3.15,-1.6,3.1],'when':'!flag.egg_murmel'}],
 'hotspots':[
  {'id':'polaroid','label':'Polarbild','prop':'polaroid','when':'!has.polaroid','on':[{'give':'polaroid'},N('Ein Sofortbild: eine Frau mit Föhnfrisur, leicht verschwommen. Hinten drauf: "Finde mich – M." Endlich mal eine Frau, die dich finden will. Statt dich zu blockieren.'),{'note':'Polarbild: „Finde mich – M.“'}]},
  {'id':'eimer','label':'Mülleimer','prop':'eimer','trash':True,'on':[N("Ein Mülleimer. Leer bis auf einen Kaugummi von 1993 und den Geruch von Montag. Wer zu viel mit sich rumschleppt, wird hier Sachen los.")]},
  {'id':'tasse','label':'Kaffeetasse','prop':'tasse','when':'!flag.tasse','on':[{'give':'tasse'},{'set':'tasse'},N("Eine Tasse: Bester Mitarbeiter des Monats, März 1993. Der Monat ist vorbei. Der Mitarbeiter vermutlich auch.")]},
  {'id':'radio','label':'Radiowecker','prop':'radio','grab':False,'on':[N("Ein Radiowecker. Sechs Uhr. Es ist immer sechs Uhr."),{'radio':True}],'with':{'hammer':[N("Du hebst den Hammer. Der Wecker springt auf sechs Uhr. Aus Trotz.")]}},
  {'id':'murmel','label':'Murmeltier','prop':'murmel','grab':False,'when':'!flag.egg_murmel','on':[{'set':'egg_murmel'},N("Ein Murmeltier. Es schaut auf deinen Schatten, seufzt und murmelt: noch sechs Wochen Schleife. Plus dreißig Sekunden."),{'bonus':30,'key':'egg_murmel'},IF('loop>=2',[Ma("Das Vieh war letztes Mal auch schon da. Ich schwör.")])],
   'gaze':{'sec':3,'do':[N("Das Murmeltier starrt zurück. Wer zuerst blinzelt, muss den Tag noch mal erleben.")]}},
  {'id':'automat','label':'Backrooms-Cola-Automat','hit':B1h['automat'],'on':[N("Backrooms Cola, seit 1993 nicht gewartet. Will 25 Cent. Du hast nur Ausreden.")]},
  {'id':'riss','label':'Riss in der Tapete','hit':B1h['riss'],'on':[N("Ein Riss in der Tapete, dahinter Rosenmuster und ein Hauch Patschuli. Noch zu schmal. Irgendwann reißt er weiter auf. Versprochen.")]},
  {'id':'kennzeichen','label':'Nummernschild','hit':B1h['kennzeichen'],'on':[IF('!flag.egg_plate',[{'set':'egg_plate'},N("Ein Nummernschild an der Wand: Z-EIT 88. Irgendwo jault ein Sportwagen mit Flügeltüren. Plus dreißig Sekunden, einfach so."),{'bonus':30,'key':'egg_plate'}],[N("Z-EIT 88. Du starrst es an. Es starrt nicht zurück. Es ist ein Nummernschild.")])]},
  {'id':'flur','label':'Flur entlang','hit':B1h['flur'],'on':[{'go':'B2'}]},
 ]}
B2h=M['B2']
nodes['B2']={'epoch':'hub','title':'Backrooms – Kreuzung','sky':'B2',
 'enter':[IF('has.mauer&&!flag.sliceend',[{'set':'sliceend'},Ma("Du hast es! Ein Stück Freiheit. Halt es gut fest, Süßer."),{'config_line':'sliceEnd'},{'credits':True}])],
 'props':[{'id':'lampe','type':'lamp','pos':[0,1.08,-1.9]}],
 'hotspots':[
  {'id':'lampe','label':'Flackernde Lampe','prop':'lampe','on':[{'talk':'lampe'}],'with':{'polaroid':[IF('anchors>=3',[N("Das Foto glüht auf.")],[Ma("Noch nicht. Mir fehlen Anker. Und du stehst hier rum und hältst Fotos hoch. Süß. Aber beeil dich, Süßer!")])],
     'mauer':[Ma("Ein Anker! Ich spür ihn bis in die Röhre. Zwei fehlen noch, aber die Türen klemmen. Nicht meine Schuld.")]}},
  {'id':'t1989','label':'Tür „1989“','hit':B2h['t1989'],'on':[IF('!flag.door89',[{'set':'door89'},N("Hinter der Tür: Jubel, Zweitakt-Abgase und der Geruch von Freiheit. Und Bratwurst.")]),{'epoch':'M1'}]},
  {'id':'t1984','label':'Tür „1984“','hit':B2h['t1984'],'on':[N("Die Tür mit der 1984 klemmt. Dahinter Synthesizer und Poolwasser. Noch nicht, sagt die Klinke.")]},
  {'id':'t2041','label':'Tür „2041“','hit':B2h['t2041'],'on':[IF('has.mauer',[N("Das Display liest dein Mauerstück: Nachweis akzeptiert. Wartungsarbeiten bis Version drei Punkt eins. Selbst die Zukunft hat Baustellen.")],
     [N("Grünes Notlicht. Ein Display blinkt: Zutritt nur mit historischem Nachweis von Freiheit. Klingt verdächtig nach Beton. Bemaltem Beton.")])]},
  {'id':'zurueck','label':'Zurück','hit':B2h['zurueck'],'on':[{'go':'B1'}]},
 ]}
# ------------------------------------------------- 1989
nodes['M1']={'epoch':'1989','title':'Grenzübergang, 9. November 1989','sky':'M1','still':'M1',
 'enter':[IF('!flag.m1',[{'set':'m1'},N('Berlin, neunter November 1989. Tausende Menschen, Trabbels, Scheinwerfer, Sekt aus Pappbechern. Jemand ruft: "Wahnsinn!" Es wird nicht das letzte Mal sein.'),{'note':'Berlin 1989: Ein Mauerstück könnte ein Anker sein.'}])],
 'hotspots':[
  {'id':'grenzer','label':'Grenzposten','box':[0.70,0.36,0.17,0.18],'on':[{'talk':'grenzer'}],'gaze':{'sec':4,'do':[Gr("Wat kieken Se denn so? Ick hab nüscht jemacht! Heute hat keener wat jemacht!"),{'rep':{'grenzer':-1}}]}},
  {'id':'haeuschen','label':'Fach im Grenzerhäuschen','box':[0.63,0.2,0.07,0.3],'on':[
     IF('!flag.slinky',[{'give':'slinky'},{'set':'slinky'},N("Zwischen Formularen und Stempelkissen: eine neongelbe Spiralfeder. Ein Slinky. Völlig nutzlos. Wahrscheinlich.")],
      [IF('!flag.akte',[{'give':'akte'},{'set':'akte'},N("Eine Akte mit deinem Namen. Leer. Entweder warst du sehr brav oder sehr langweilig.")],
        [IF('!flag.egg_karton',[{'set':'egg_karton'},N("Ganz hinten ein Karton: Zeitreise-Kram, nicht öffnen. Du öffnest ihn nicht. Plus dreißig Sekunden für Selbstbeherrschung."),{'bonus':30,'key':'egg_karton'}],
          [N("Formulare. Stempel. Und der Karton, den du nicht öffnest.")])])])]},
  {'id':'trabi','label':'Trabbel','box':[0.65,0.58,0.35,0.35],'on':[{'add':{'chaos':1}},N("Du hupst. Der Trabbel hupt zurück. Mit Zweitakt-Empörung. Du bist dir nicht sicher, wer hier wen erschreckt hat.")]},
  {'id':'menge','label':'Mit der Menge zur Mauer','box':[0.0,0.47,0.48,0.45],'on':[{'go':'M2'}]},
  {'id':'rechts','label':'Zur Trabbel-Schlange','box':[0.94,0.08,0.06,0.42],'on':[{'go':'M3'}]},
  {'id':'zurueck','label':'Zurück in die Backrooms','box':[0.48,0.86,0.17,0.14],'on':[{'epoch':'B2'}]},
 ]}
nodes['M2']={'epoch':'1989','title':'An der Mauer','sky':'M2','still':'M2','props':[{'id':'huhn','type':'chicken','pos':[0.9,-1.6,-1.3],'when':'!flag.huhn'}],
 'hotspots':[
  {'id':'typ','label':'Typ mit Hammer','box':[0.22,0.15,0.21,0.65],'on':[{'talk':'mauertyp'}],'gaze':{'sec':5,'do':[Ty("Wat glotzt de? Willste ooch kloppen? Banane, Kumpel. Banane.")]},
   'with':{'banane':[{'take':'banane'},{'give':'hammer'},N('Er hält die Banane hoch wie den Weltmeisterpokal. "Wahnsinn!" Du kriegst Hammer und Meißel. Fairer Tausch. Historisch gesehen.'),Ty("Kiek mal, die is sojar krumm! Wie im Fernsehen!")],
           'dm':[Ty("Jeld? Wat soll ick mit Jeld? Kann man Jeld schälen? Eben.")]}},
  {'id':'mauer','label':'Mauer mit Graffiti','box':[0.75,0.05,0.25,0.72],'when':'!has.mauer','on':[N("Mit bloßen Händen? Du bist kein Bagger. Du bist nicht mal ein Sandkastenbagger.")],
   'with':{'hammer':[{'give':'mauer'},{'anchor':'mauer'},{'clip':'clip_mauer_bricht'},N("Klonk, klonk… KRACK! Ein bemaltes Stück Mauer fällt dir in die Hand. Die Menge jubelt, als hättest du sie ganz allein eingerissen. Du widersprichst nicht."),{'note':'Anker: Mauerstück (1989). Zurück zur Lampe in den Backrooms.'}]}},
  {'id':'huhn','label':'Gummihuhn','prop':'huhn','when':'!flag.huhn','on':[{'give':'huhn'},{'set':'huhn'},N("Ein Gummihuhn mit einer Seilrolle in der Mitte. Wer lässt so was an der Mauer liegen? Und warum fühlt es sich so wichtig an?")]},
  {'id':'zurueck','label':'Zurück','box':[0.3,0.9,0.4,0.1],'on':[{'go':'M1'}]},
 ]}
nodes['M3']={'epoch':'1989','title':'Trabbel-Schlange','sky':'M3','still':'M3','props':[{'id':'radkappe','type':'hubcap','pos':[-1.0,-1.6,-1.4],'when':'!flag.radkappe'},{'id':'gully','type':'gully','pos':[0.3,-1.6,-1.2]}],
 'hotspots':[
  {'id':'mara','label':'Mara auf dem Trabbel','box':[0.2,0.1,0.36,0.55],'gaze':{'sec':4,'do':[Ma("Starr nicht so. Ich bin keine Sehenswürdigkeit. Okay, ein bisschen.")]},'on':[IF('!flag.metmara89',[{'set':'metmara89'},{'clip':'clip_mara_1989_trabi_sprung'}]),{'talk':'mara89'}]},
  {'id':'schalter','label':'Schalter „Begrüßungsgeld“','box':[0.7,0.05,0.3,0.75],'on':[{'talk':'beamtin'}],'gaze':{'sec':5,'do':[Be("Ick seh Sie. Ick seh alle. Det is mein Beruf.")]},
   'with':{'polaroid':[IF('!flag.geld',[{'set':'geld'},Be("Sieht aus wie'n Ausweis, wa? Na jut. Jeht klar."),{'give':'dm'},N("Hundert D-Mark Begrüßungsgeld! Und du weißt sofort, wofür: Bananen. Prioritäten.")],[Be("Sie hatten schon, junger Mann. Ick erkenn Sie ooch mit Schnurrbart.")])],
           'akte':[Be("Ne leere Akte als Ausweis? Mutig. Aber nee.")],'tasse':[Be("Det is keen Ausweis. Det is 'n Hilferuf.")]}},
  {'id':'bananen','label':'Bananen (1 DM)','box':[0.56,0.27,0.15,0.38],'on':[IF('has.banane||has.hammer',[N("Eine Banane reicht. Gier ist sowas von 2041.")],
     [IF('has.muenze',[{'take':'muenze'},{'give':'banane'},N("Du legst die nasse Mark auf den Tresen. Der Verkäufer wischt sie ab, nickt und gibt dir eine Banane. Geld stinkt nicht. Gullygeld ein bisschen.")]),IF('has.dm&&!has.banane',[{'take':'dm'},{'give':'banane'},N("Du kaufst eine Banane. Sie leuchtet gelb wie ein Pokal. Hinter dir seufzen drei Leute neidisch.")],
       [IF('!has.banane',[N("Bananen! Eine Mark das Stück, nur gegen Westgeld. Du hast keins. Nur Sehnsucht.")])])])],
   'with':{'muenze':[IF('has.banane||has.hammer',[N("Eine Banane reicht. Gier ist sowas von 2041.")],[{'take':'muenze'},{'give':'banane'},N("Du legst die nasse Mark auf den Tresen. Der Verkäufer wischt sie ab, nickt und gibt dir eine Banane. Geld stinkt nicht. Gullygeld ein bisschen.")])],'dm':[IF('has.banane||has.hammer',[N("Eine Banane reicht. Gier ist sowas von 2041.")],[{'take':'dm'},{'give':'banane'},N("Du kaufst eine Banane. Sie leuchtet gelb wie ein Pokal. Hinter dir seufzen drei Leute neidisch.")])]}},
  {'id':'gully','label':'Gully','prop':'gully','grab':False,'on':[IF('!flag.gully',[N("Ein Gully. Unten blinkt was. Eine Münze? Deine Finger sind zu kurz, deine Würde zu groß.")],[N("Nur noch Wasser und Geschichte.")])],
   'with':{'haken':[IF('!flag.gully',[{'set':'gully'},N("Du lässt die Angel runter. Der Kaugummi klebt, die Münze kommt mit. Eine Mark! Für eine Banane reicht's genau."),{'give':'muenze'}],[N("Da unten ist nichts mehr. Außer deiner Hoffnung.")])],'schnur':[N("Nur eine Schnur? Da fehlt was Klebriges.")]}},
  {'id':'radkappe','label':'Radkappe','prop':'radkappe','when':'!flag.radkappe','on':[{'give':'radkappe'},{'set':'radkappe'},N("Eine Trabbel-Radkappe, leicht wie ein Versprechen. Der Trabbel merkt es nicht. Der Trabbel merkt nie was.")]},
  {'id':'links','label':'Zurück zum Grenzübergang','box':[0.0,0.1,0.06,0.75],'on':[{'go':'M1'}]},
 ]}
# ------------------------------------------------- Slinky-Ziele (je Szene, nach Spielstand; erstes passendes gilt)
slinky={'B1':[['!has.polaroid','polaroid'],['1','flur']],'B2':[['!flag.metlampe','lampe'],['!has.mauer','t1989'],['1','lampe']],
 'M1':[['!flag.geld','rechts'],['!has.mauer','menge']],'M2':[['!has.banane&&!has.hammer&&!has.mauer','zurueck'],['has.banane','typ'],['has.hammer','mauer'],['1','zurueck']],
 'M3':[['!flag.geld','schalter'],['!has.banane&&!has.hammer&&!has.mauer','bananen'],['1','links']]}
# ------------------------------------------------- Hinweise 3 Stufen [Erzähler vage, Mara Ort, Mara Lösung]
hints={
 'B1':[{'if':'!has.polaroid','t':["Wer aufwacht, sollte erst mal schauen, worauf er liegt.","Guck mal auf den Teppich vor dir. Da liegt was, das nicht nach Teppich aussieht.","Das Polarbild, Süßer. Vorne links am Boden. Heb es auf."]},
       {'if':'1','t':["Flure führen irgendwohin. Das ist ihr einziger Job.","Geh den Flur runter. Da vorne summt was, das reden will.","Flur entlang, dann die flackernde Lampe an der Decke ansprechen."]}],
 'B2':[{'if':'!flag.metlampe','t':["Eine der Lampen summt in Moll.","Die Lampe über dir. Ja, die. Sprich mit ihr. Also mit mir.","Zeig auf die flackernde Lampe an der Decke und drück ab."]},
       {'if':'!has.mauer','t':["Drei Türen. Nur eine davon hat heute Lust.","Die Tür mit der Neunundachtzig. Da wartet ein Stück Freiheit.","Die Tür direkt vor dir. Durchgehen. Ich halt solange die Röhre warm."]},
       {'if':'1','t':["Ein Anker ist ein Anfang.","Mehr Türen gehen gerade nicht auf. Ich bin trotzdem stolz auf dich.","Das war's für diesen Teil der Schleife. Ehrlich."]}],
 'M1':[{'if':'!flag.geld&&!has.hammer&&!has.mauer','t':["Wer zur Mauer will, braucht Werkzeug. Wer Werkzeug will, braucht Tauschware.","Rechts geht's zur Trabbel-Schlange. Da gibt's Geld und Obst.","Nach rechts zur Trabbel-Schlange, am Schalter Begrüßungsgeld holen, dann eine Banane kaufen."]},
       {'if':'!has.hammer&&!has.mauer','t':["Mit Obst macht man hier Geschäfte.","Der Typ an der Mauer hat Hunger und einen Hammer. Rechne.","Mit der Menge zur Mauer und dem Typen die Banane geben."]},
       {'if':'1','t':["Hammer. Mauer. Muss man noch mehr sagen?","Die Mauer wartet. Na los.","Mit der Menge zur Mauer, dann den Hammer auf die bemalte Mauer."]}],
 'M2':[{'if':'!has.banane&&!has.hammer&&!has.mauer','t':["Der Mann hat Hunger auf etwas, das es im Osten selten gab.","Hast du das Schild an der Trabbel-Schlange gesehen? Und hast du Westgeld?","Polarbild am Schalter zeigen, Banane kaufen, rübergeben. Bitte. Ich schau weg."]},
       {'if':'has.banane','t':["Du hast, was er will. Er hat, was du willst. Das nennt man Wirtschaft.","Gib dem Typen endlich die Banane.","Banane im Laufmann auswählen, dann auf den Typen mit dem Hammer zeigen."]},
       {'if':'has.hammer','t':["Beton ist auch nur Stein mit schlechter Laune.","Hau drauf. Auf die Mauer, nicht auf den Typen.","Hammer auswählen, dann auf die bemalte Mauer."]},
       {'if':'1','t':["Du hast dein Stück Geschichte.","Zurück in die Backrooms, zur Lampe.","Zurück, dann über den Laufmann oder die Tür hinter dir in die Backrooms."]}],
 'M3':[{'if':'!flag.geld&&!has.banane&&!has.hammer&&!has.mauer','t':["Bananen kosten Westgeld. Westgeld kostet ein Gesicht.","Die Beamtin will irgendwas mit deinem Gesicht drauf. Hast du nicht ein Foto?","Polarbild im Laufmann auswählen und auf den Schalter zeigen."]},
       {'if':'!has.banane&&!has.hammer&&!has.mauer','t':["Du hast Geld. Hier gibt's Obst. Mehr Hinweis wäre peinlich.","Der Bananenstand, Süßer. Gleich neben dem Schalter.","Auf die Bananen zeigen und kaufen."]},
       {'if':'1','t':["Hier ist alles erledigt.","Zurück zum Grenzübergang, dann zur Mauer.","Links zurück, dann mit der Menge zur Mauer."]}]}
# ------------------------------------------------- Glitch-Stufen je Besuch (Ton, Sprüche, Zeit – keine starken Bildeffekte)
glitch={'1989':{'2':N('Wahnsinn! … Wahnsinn! Der Satz hängt. Die Zeit offenbar auch.'),'3':Ma("Hörst du das? Das klingt wie 1984. Hier wird's dünn."),'4':Ma("Hier wird's instabil, beeil dich!"),
  '5':N("Die Schleife franst aus. Jeder Besuch hier kostet jetzt dreißig Sekunden. Wie ein Parkhaus, nur metaphysisch.")},
 'remember':{'1989':Ma("Moment, das hatten wir schon. Berlin, Trabbels, Banane. Diesmal machen wir es schneller, ja?")}}
# ------------------------------------------------- Dialoge
def O(label,**k): d={'label':label}; d.update(k); return d
dialogs={}
dialogs['lampe']={'nodes':{
 'start':{'speaker':'mara','text':"Na endlich, du bist wach! Hör zu, Schlafmütze. Drei Anker halten die Schleife: ein Lied aus 1984, ein Stück Freiheit aus 1989 und Licht aus 2041. Du hast zwanzig Minuten. Keine Snooze-Taste.",
  'options':[O('😏 Charmant',next='wer',tone='charm',good="Haha, Schmeichler! Spar dir das für später auf. Jetzt beeil dich.",bad="Süß. Aber die Uhr tickt, Casanova."),
             O('😜 Frech',next='wer',tone='cheeky',good="Frech! Gefällt mir. Mal sehen, ob du auch was kannst.",bad="Wow. Witzig. Nicht."),
             O('😐 Ernst',next='wer',tone='serious',good="Ich bin Mara. Ich hänge seit 1996 hier fest. Ohne Handy. Bitte beeil dich.",bad="Ich bin Mara. Und ich hab keine Zeit für Smalltalk.")]},
 'wer':{'speaker':'mara','text':"Noch Fragen, bevor du losrennst?",
  'options':[O('Wo fang ich an?',next='wer',do=[Ma("Die Neunundachtziger-Tür ist offen. Die anderen klemmen. Die Backrooms sind halt ein Altbau.")]),
             O('Warum eine Lampe?',next='wer',do=[Ma("Weil Röhren Strom haben und ich eine Stimme brauche. Frag nicht, wie. Ich hab's auch nur geträumt.")]),
             O('Hast du ein Ladekabel?',next='wer',trap={'key':'lampe_kabel','sec':15},do=[Ma("Ein Ladekabel. Für was? Du bist in einer Zeitschleife. Okay, pass auf, ich erklär dir das mit den Röhren ganz von vorne …"),N("Sie erklärt es ganz von vorne. Dann noch mal von hinten. Minus fünfzehn Sekunden.")]),
             O('Bis gleich',do=[{'set':'metlampe'}])]}}}
dialogs['grenzer']={'pre':[IF('loop>=2&&mem.grenzer_formular&&!flag.warnG',[{'set':'warnG'},Ma("Moment, das hatten wir schon. Frag ihn bloß nicht nach dem Formular.")]),IF('rep.grenzer<0',[Gr("Sie schon wieder. Der Kieker.")])],'nodes':{
 'start':{'speaker':'grenzer','text':"Na, Kollege? Wo wollnse denn hin? Ick hab keene Anweisung mehr. Ick hab nur noch Feierabend.",
  'options':[O('Wo geht\'s zur Mauer?',next='mehr',do=[{'rep':{'grenzer':1}},Gr("Immer der Menge nach. Die wissen heute alle, wo's langjeht. Zum ersten Mal seit achtundzwanzig Jahren.")]),
             O('Gibt es hier Bananen?',next='mehr',do=[Gr("Drüben an der Trabbel-Schlange. Aber nur jegen Westjeld. Und Westjeld jibt's am Schalter. Mit Ausweis. Ohne Ausweis jibt's nur Jefühle.")]),
             O('Formular A38, dreifacher Durchschlag!',next='mehr',cond='know.a38&&!flag.a38',do=[{'set':'a38'},{'rep':{'grenzer':2}},Gr("Sie kennen A38? Respekt, Kollege! Endlich mal eener mit Bildung.")]),
             O('Gibt es dafür ein Formular?',next='mehr',cond='!know.a38',trap={'key':'grenzer_formular','sec':20},do=[{'rep':{'grenzer':-1}},{'learn':'a38'},Gr("Een Formular? Junge. Setzen Se sich. Also: Formular A38 zur Beantragung eenes Formulars, dreifacher Durchschlag, blau, jelb und rosa …"),N("Zwanzig Sekunden später weißt du alles über Durchschläge. Wirklich alles. Minus zwanzig Sekunden.")]),
             O('Tschüss',do=[Gr("Jute Nacht. Und nich drängeln.")])]},
 'mehr':{'speaker':'grenzer','text':"Noch wat?",
  'options':[O('Was ist in dem Häuschen?',next='mehr',do=[Gr("Formulare. Stempel. Und een Karton, wo draufsteht: Nich öffnen. Den hat keener von uns hinjestellt. Ick schwör.")]),
             O('Haben Sie mal \'ne Schnur?',next='mehr',cond='rep.grenzer>=2&&!flag.schnur',do=[{'set':'schnur'},Gr("Für Sie? Klar. Paketschnur, volkseigen. Nich verknoten."),{'give':'schnur'}]),
             O('Wie fühlt sich das an, heute?',next='mehr',cond='!flag.gefuehl',do=[{'set':'gefuehl'},{'rep':{'grenzer':1}},Gr("Komisch. Jestern hab ick hier noch uffjepasst. Heute pass ick nur noch uff meine Thermoskanne.")]),
             O('Tschüss',do=[Gr("Jute Nacht. Und nich drängeln.")])]}}}
dialogs['beamtin']={'pre':[IF('loop>=2&&mem.beamtin_zeiten&&!flag.warnB',[{'set':'warnB'},Ma("Das hatten wir schon. Frag sie nicht nach den Öffnungszeiten. Nie wieder.")])],'nodes':{
 'start':{'speaker':'beamtin','text':"Begrüßungsgeld? Hundert Mark pro Nase. Ausweis, bitte. Und nich drängeln, junger Mann.",
  'options':[O('Ich hab keinen Ausweis.',next='start',cond='!flag.geld',do=[{'set':'schalter1'},Be("Denn jibt's ooch keen Jeld. Irgendwat mit Ihrem Jesicht druff brauch ick schon. Een Foto tut's zur Not.")]),
             O('Kann ich mit Charme bezahlen?',next='start',do=[Be("Charme hab ick selber. Bringt mir ooch nüscht.")]),
             O('Was sind Ihre Öffnungszeiten?',next='start',trap={'key':'beamtin_zeiten','sec':20},do=[Be("Öffnungszeiten! Also Montag bis Freitag von acht bis zwölf, außer donnerstags, da bis achtzehn Uhr, aber nur mit Wartemarke, und die Wartemarken jibt's …"),N("Sie zählt sämtliche Feiertage bis 1995 auf. Minus zwanzig Sekunden. Du weißt jetzt, wann Buß- und Bettag ist.")]),
             O('Tschüss',do=[Be("Der Nächste, bitte!")])]}}}
dialogs['mauertyp']={'pre':[IF('loop>=2&&mem.mauertyp_lied&&!flag.warnT',[{'set':'warnT'},Ma("Das hatten wir schon. Wenn er anfängt zu singen: renn.")])],'nodes':{
 'start':{'speaker':'mauertyp','text':"Wahnsinn! Kiek dir det an! Ick kloppe hier Jeschichte!",
  'options':[O('Leihst du mir den Hammer?',next='start',cond='!has.hammer&&!has.mauer',do=[Ty("Den Hammer? Nur jegen ne Banane, Kumpel. Ick hab seit achtundzwanzig Jahren keene jesehen. Nur uff Postkarten.")]),
             O('Was machst du hier?',next='start',do=[Ty("Ick mach mir 'n Souvenir. Wenn die Mauer weg is, will ick wenigstens 'n Stück uffm Fernseher stehen ham. Neben der Ente aus Glas.")]),
             O('Summ das Lied vom Lederjacken-Typen',next='start',cond='know.lied&&!flag.lied',do=[{'set':'lied'},{'rep':{'mauertyp':2}},Ty("Du kennst det ooch? Bruder! Komm her, ick drück dich. Und jetzt hau ab, bevor ick heule."),{'bonus':20,'key':'lied'}]),
             O('Kennst du den Typen mit dem sprechenden Auto?',next='start',cond='!know.lied',trap={'key':'mauertyp_lied','sec':25},do=[{'learn':'lied'},Ty("Den mit der Lederjacke? Junge, der singt bald hier uff der Mauer! Warte, ick sing dir det mal vor …"),N("Er singt. Lange. Mit Gefühl. Und erstaunlich wenig Text. Minus fünfundzwanzig Sekunden und ein Stück deiner Würde.")]),
             O('Tschüss',do=[Ty("Wahnsinn! Tschüssi!")])]}}}
dialogs['mara89']={'pre':[IF('loop>=2&&mem.met89&&!flag.warnM',[{'set':'warnM'},Ma("Moment … das hatten wir schon. Du, ich, Trabbel, Banane. Diesmal machen wir es schneller, ja?")])],'nodes':{
 'start':{'speaker':'mara','text':"Du schon wieder! Verfolgst du mich durch die Geschichte?",
  'options':[O('😏 Charmant',next='themen',tone='charm',good="Du bist echt hartnäckig. Wie Kaugummi am Trabbel. Ich mag das.",bad="Charme reißt keine Mauern ein, Süßer. Ein Hammer schon."),
             O('😜 Frech',next='themen',tone='cheeky',good="Wahnsinn! Den Spruch hab ich heute schon hundert Mal gehört. Von dir klingt er trotzdem süß.",bad="Frech sein kann jeder. Mauern klopfen nicht."),
             O('😐 Ernst',next='themen',tone='serious',good="Der zweite Anker ist ein Stück dieser Mauer. Ohne Werkzeug wird das nichts. Und nein, deine Fingernägel zählen nicht.",bad="Wir brauchen ein Mauerstück. Mehr verrat ich nicht. Ich bin ja kein Lösungsbuch.")]},
 'themen':{'speaker':'mara','text':"Und jetzt? Schau nicht mich an!",
  'options':[O('Werkzeug?',next='themen',do=[Ma("Der Typ an der Mauer hat einen Hammer. Aber er hat seit Jahren Hunger auf Südfrüchte. Gelb, krumm, du weißt schon.")]),
             O('Wie kommst du hierher?',next='themen',do=[Ma("Ich bin 1996 in der Mall eingeschlafen und in den Backrooms aufgewacht. Seitdem springe ich. Berlin ist mein Lieblingssprung. Alle umarmen sich, und keiner fragt nach dem Ausweis. Außer am Schalter.")]),
             O('Willst du ein Gummihuhn?',next='themen',cond='has.huhn',do=[Ma("Ein Gummihuhn mit Seilrolle. Du weißt, dass das aus einem anderen Spiel ist, oder? Behalt's. Für Notfälle. Welche auch immer.")]),
             O('Tschüss',do=[{'remember':'met89'},Ma("Bis gleich. Und lass dich nicht von Bürokraten aufhalten.")])]}}}
items.update({
 'schnur':{'name':'Paketschnur','icon':'🧵','desc':'Volkseigen. Nicht verknoten.','model':'string','color':'#d8d0b0'},
 'haken':{'name':'Kaugummi-Angel','icon':'🪝','desc':'Schnur plus Kaugummi. Angelt alles, was klebt.','model':'hook'},
 'muenze':{'name':'1 D-Mark (Gully)','icon':'🪙','desc':'Nass, aber gültig.','model':'coin'}})
items['polaroid']['model']='bill'; items['dm']['model']='bill'; items['banane']['model']='banana'; items['hammer']['model']='hammer'
pool={'perLoop':5,'always':[['B1:s2','kaugummi']],
 '_info':'Je Schleife zufällig verteilt. Neue Items einfach hier ergänzen: name, icon, desc, model, color, line (beim Aufheben), optional onUse/consume/beacon/fail.',
 'items':{
  'tamagotchi':{'name':'Piepsendes Ei','icon':'🥚','model':'egg','color':'#e070b0','beacon':True,'consume':True,'desc':'Ein digitales Haustier. Es hat Hunger. Immer.',
    'line':N("Ein piepsendes Ei an einer Kette. Es hat Hunger. Es hat immer Hunger."),'onUse':[N("Du fütterst das Ei. Es ist so dankbar, dass die Zeit kurz den Atem anhält. Plus zwanzig Sekunden."),{'bonus':20,'key':'tama'}]},
  'bleistift':{'name':'Bleistift','icon':'✏️','model':'pencil','color':'#e8c33a','desc':'Für Kassetten. Und manchmal zum Schreiben.',
    'line':N("Ein Bleistift. Jeder unter vierzig fragt jetzt: wofür? Jeder über vierzig weiß es: Kassetten zurückspulen.")},
  'gameboy':{'name':'Graue Spielkonsole','icon':'🎮','model':'gameboy','color':'#b8b4aa','desc':'Klötzchenspiel. Batterie leer.',
    'line':N("Eine graue Spielkonsole mit Klötzchenspiel. Batterie leer. Wie immer, wenn's spannend wird."),'onUse':[Ma("Leg das weg. Wir haben keine Zeit für Klötzchen.")]},
  'wuerfel':{'name':'Zauberwürfel','icon':'🧊','model':'cube','desc':'Verdreht.','line':N("Ein Zauberwürfel. Verdreht. Wie dein Lebenslauf.")},
  'brause':{'name':'Brausepulver','icon':'🧪','model':'pack','color':'#3aa0ff','consume':True,'desc':'Waldmeister. Explodiert im Mund wie eine gute Idee.',
    'line':N("Ein Tütchen Brausepulver, Waldmeister. Explodiert im Mund wie eine gute Idee."),'onUse':[N("Es knistert im Kopf. Plötzlich bist du hellwach."),{'hintfree':True}]},
  'kaugummi':{'name':'Kaugummi','icon':'🍬','model':'gum','color':'#ff8fc0','desc':'Noch verpackt. Klebt bestimmt hervorragend.','line':N("Ein Streifen Kaugummi, noch verpackt. Klebt bestimmt hervorragend.")},
  'diddl':{'name':'Notizblock mit Springmaus','icon':'🐭','model':'pack','color':'#f8e070','desc':'Riecht nach Erdbeere und Pausenhof.','line':Ma("Ein Notizblock mit dieser Springmaus drauf. Ich hatte zwölf davon. Frag nicht.")}},
 'spawns':{'B1':[{'id':'s1','pos':[1.2,-1.6,-2.4]},{'id':'s2','pos':[-2.6,-1.6,-3.6]},{'id':'s3','pos':[2.8,-1.6,2.2]}],
           'B2':[{'id':'s1','pos':[-1.8,-1.6,-3.2]},{'id':'s2','pos':[2.2,-1.6,1.8]}],
           'M1':[{'id':'s1','pos':[-0.7,-1.6,-1.6]}],'M2':[{'id':'s1','pos':[-0.6,-1.6,-1.5]}],'M3':[{'id':'s1','pos':[0.9,-1.6,-1.8]}]}}
combos={
 'kaugummi+schnur':[{'take':'kaugummi'},{'take':'schnur'},{'give':'haken'},N("Du kaust den Kaugummi weich und knotest ihn an die Schnur. Fertig ist die Angel des armen Mannes. Irgendwo nickt ein Mann mit Taschenmesser anerkennend."),{'learn':'angel'}],
 'polaroid+bleistift':[IF('!flag.mnote',[{'set':'mnote'},N("Du schreibst auf die Rückseite: Ich war hier. Darunter steht plötzlich, in fremder Schrift: Ich weiß. M."),{'note':'Polarbild: „Ich weiß. M.“ – merkt sie sich die Schleifen auch?'},{'learn':'mweiss'}],[N("Ich weiß. M. Steht immer noch da. Du hast es nicht geträumt.")])],
 'slinky+huhn':[Ma("Ein Gummihuhn auf einem Slinky. Das ist entweder Kunst oder ein Hilferuf.")],
 'banane+huhn':[N("Das Huhn und die Banane schauen sich an. Keiner von beiden will das hier.")],
 'tamagotchi+brause':[N("Du gibst dem Ei Brause. Es piept jetzt doppelt so schnell. Glückwunsch, du hast ein Haustier hyperaktiv gemacht.")],
 'hammer+tasse':[N("Du könntest. Aber Bester Mitarbeiter des Monats hat das nicht verdient.")],
 'wuerfel+bleistift':[N("Du stocherst mit dem Bleistift im Würfel. Er wird nicht gelöster. Du auch nicht.")],
}
config['knowledge']={'a38':'Formular A38 (Grenzer-Bürokratie)','lied':'Das Lied vom Lederjacken-Typen','angel':'Kaugummi + Schnur = Angel','mweiss':'Mara weiß von den Schleifen'}
config['lines']['trashThrow']=N("Treffer! Drei Punkte. Der Eimer nimmt es dir nicht übel.")
config['lines']['bananaDrop']=Ma("Hast du gerade eine Banane geworfen? 1989? Die Leute hier weinen.")
nodes['B2']['hum']='lampe'
# ---- Barks: kurze, nicht-blockierende Sprachzeilen (Untertitel als Toast)
config['barks']={
 'idle_backrooms':[N("Du stehst da. Das Neon summt. Ein Zeitreisender in seinem natürlichen Lebensraum: unentschlossen."),Ma("Hallo? Die Zeit läuft. Nur so als Info."),N("Wenn du lange genug wartest, passiert nichts. Garantiert."),Ma("Ich hör dich atmen. Mach was."),N("Die Backrooms sind geduldig. Die Uhr nicht.")],
 'idle_1989':[Ma("Die Mauer fällt nicht von allein. Na gut, eigentlich schon. Aber nicht ohne dich."),N("Um dich herum wird Geschichte geschrieben. Du schreibst gerade: nichts."),Ma("Hey, Träumer. Wir haben einen Plan, weißt du noch?"),N("Ein Trabbel hupt. Er meint dich.")],
 'pickup':[N("Eingesteckt. Deine Taschen sind tiefer als dein Verständnis dieser Lage."),N("Nimm alles mit. So machen das Abenteurer."),N("Klebt ein bisschen. Frag nicht."),N("Ins Inventar damit. Wird schon zu was gut sein. Vermutlich nicht.")],
 'drop':[N("Fallen gelassen. Die Schwerkraft funktioniert also noch."),N("Hoppla. Absichtlich, natürlich.")],
 'throw':[N("Ein beherzter Wurf. Die Haltungsnote lassen wir weg."),Ma("Hast du gerade was geworfen? Ich hab's gehört.")],
 'invOpen':[N("Du kramst im Zeit-Laufmann. Er riecht nach Kassette.")],
 'gazeMara':[Ma("Starr nicht so. Ich bin keine Sehenswürdigkeit. Okay, ein bisschen."),Ma("Hab ich was im Gesicht? Ach so, nur dich."),Ma("Du guckst, als hättest du mich schon hundertmal gesehen. Hast du, oder?"),Ma("Augen nach vorne, Zeitreisender. Die Mauer ist da drüben.")],
 'glitch2':[Ma("Hast du das auch gesehen? Das Bild hat gezuckt."),N("Irgendwas stimmt nicht. Die Farben sind eine Spur zu grau.")],
 'glitch3':[Ma("Die Schleife wird dünn. Ich spür das in den Zähnen."),N("Das Band leiert. Und du mit.")],
 'glitch4':[Ma("Wir waren zu oft hier. Die Zeit fängt an zu kratzen."),N("Die Welt rauscht wie eine Kassette nach dem zehnten Überspielen.")],
 'glitch5':[Ma("Wenn wir noch mal herkommen, fällt hier mehr als die Mauer."),N("Die Zeit hat Bandsalat. Und sie zieht dir Minuten ab.")],
 'time600':[N("Noch zehn Minuten. Das ist eine Folge Sitcom ohne Werbung.")],
 'time300':[Ma("Fünf Minuten! Beeil dich, sonst klingelt wieder das Radio.")],
 'time60':[N("Eine Minute. Irgendwo stimmt ein Radiowecker schon sein Lied an.")],
 'loop2':[Ma("Moment. Haben wir das nicht gerade erst gemacht?")],
 'loop3':[N("Dritter Versuch. Das Murmeltier schaut dich inzwischen mitleidig an.")],
 'firstB1':[N("Willkommen in den Backrooms. Teppich, Neon, Feuchtigkeit. Wie ein Büro, nur ehrlicher.")],
 'firstB2':[N("Drei Türen. Drei Jahreszahlen. Und keine Hausordnung.")],
 'firstM1':[N("Berlin, neunter November. Die Luft riecht nach Zweitakter und Zukunft.")],
 'firstM2':[N("Die Mauer. Grau, hoch, und heute Nacht plötzlich sehr nervös.")],
 'firstM3':[N("Begrüßungsgeld, Bananen, Menschen in Stonewashed. Mehr Achtziger geht nicht.")],
 'slinkyGo':[N("Der Slinky macht sich auf den Weg. Treppen wären ihm lieber.")],
 'combo':[N("Das passt zusammen. Wie Vokuhila und Selbstbewusstsein.")],
 'radioClick':[N("Klick. Sechs Uhr. Natürlich ist es sechs Uhr.")]}
config['reactItem']={
 'polaroid':Ma("Das bin ich. Bevor ich wusste, was eine Zeitschleife ist. Schöne Frisur, oder?"),
 'dm':Ma("Hundert Mark Westgeld. Damit bist du hier heute König. Für etwa eine Stunde."),
 'banane':Ma("Eine echte Banane. Halt sie fest, die ist hier mehr wert als ein Auto."),
 'hammer':Ma("Ein Hammer. Jetzt bitte nichts kaputt machen. Außer das Richtige."),
 'mauer':Ma("Ein Stück Mauer. Das hebst du auf. Für immer. Versprochen?"),
 'slinky':Ma("Ein Slinky! Der läuft Treppen runter. Und manchmal zeigt er dir den Weg."),
 'tasse':Ma("Bester Mitarbeiter des Monats? Du hast hier nie gearbeitet."),
 'akte':Ma("Eine Akte über dich. Lies die lieber nicht vor dem Frühstück."),
 'huhn':Ma("Ein Gummihuhn. Ich frag nicht. Ich frag nie."),
 'radkappe':Ma("Eine Radkappe vom Trabbel. Die vermisst gleich jemand sehr."),
 'schnur':Ma("Paketschnur, volkseigen. Damit kann man fast alles reparieren."),
 'haken':Ma("Eine Kaugummi-Angel. Du bist ein Genie. Ein ekliges, aber ein Genie."),
 'muenze':Ma("Eine Mark aus dem Gully. Glück muss man haben. Und Kaugummi."),
 'tamagotchi':Ma("So ein Ei hatte ich auch. Es ist gestorben, während ich in Mathe war."),
 'bleistift':Ma("Ein Bleistift. Perfekt für Kassetten und Notizen an dich selbst."),
 'gameboy':Ma("Ein Spielbub! Lass mich mal. Nur ein Level. Okay, drei."),
 'wuerfel':Ma("Ein Zauberwürfel. Ich hab nur eine Seite geschafft. Mit Aufklebern."),
 'brause':Ma("Brausepulver! Auf die Zunge, nicht in die Nase. Glaub mir."),
 'kaugummi':Ma("Kaugummi. Kau den nicht gleich, der wird noch wichtig."),
 'diddl':Ma("Eine Maus mit riesigen Füßen. Neunziger, oder? Du bist zu früh dran.")}
config['barkCooldown']=9; config['idleBark']=45

json.dump({'config':config,'pool':pool,'combos':combos,'items':items,'nodes':nodes,'dialogs':dialogs,'hints':hints,'slinky':slinky,'glitch':glitch},open('data/game3.json','w'),ensure_ascii=False,indent=1)
print('ok',len(nodes),'nodes')
