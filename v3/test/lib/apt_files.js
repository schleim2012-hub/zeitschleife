/* Rewind Wohnung – Texte: Fallakten im Büro (lesbar) + Maras Telefon-Dialog. Nur Daten, keine Logik. */
window.APT_FILES=[
 {id:'R-07',tab:'R-07 · SCHLEIFE',pages:[
  'FALLAKTE R-07\nVERTRAULICH · NUR FÜR DEN DIENSTGEBRAUCH\n\nBetreff: Wiederholte Zeitabläufe („Schleife“)\nAktenzeichen: R-07/Möbius\nBearbeiter: Sonderstelle, Kellergeschoss\n\nSachverhalt:\nZeugen berichten übereinstimmend von einem Abend, der sich wiederholt. Gleiche Lieder im Radio, gleiche Nachrichten, gleiche Gespräche. Nur kleine Dinge verändern sich: eine Tasse steht anders, ein Name fehlt.',
  'Auswertung:\nDie Wiederholung dauert jeweils rund zwanzig Minuten. Danach setzt ein Geräusch ein, das alle Befragten als „Rückspulen einer Videokassette“ beschreiben.\n\nWer sich an die vorige Runde erinnert, kann Gegenstände anders hinlegen. Die Änderung bleibt teilweise erhalten.\n\nVermerk (handschriftlich):\nDrei Dinge halten es zusammen. Ein Lied. Ein Stück Freiheit. Ein Licht. Nimm eins weg, und alles kippt.']},
 {id:'R-12',tab:'R-12 · FLURE',pages:[
  'FALLAKTE R-12\nVERTRAULICH\n\nBetreff: Endlose Büroflure („Backrooms“)\n\nSachverhalt:\nGelbe Tapete, feuchter Teppich, summende Leuchtstoffröhren. Kein Fenster, keine Uhr. Die Flure gehen weiter, als das Gebäude groß ist.\n\nThese der Sonderstelle:\nDie Räume sind nicht gebaut. Sie sind erinnert. Jeder Gang, jedes Zimmer stammt aus dem Gedächtnis einer einzigen Person, einer Frau, deren Name in den Unterlagen geschwärzt ist.',
  'Beobachtungen:\n· Räume aus ihrer Kindheit sind am stabilsten.\n· Was sie vergessen hat, wird grau oder verschwindet.\n· Eine Küche taucht auf, die es in keinem Grundriss gibt. Dort klebt ein Zettel am Kühlschrank.\n\nEmpfehlung:\nNichts zerstören, was ihr gehört. Ihre Erinnerung ist der Boden, auf dem wir stehen.']},
 {id:'TN-7',tab:'TN-7 · TEILNEHMERIN',pages:[
  'PERSONENAKTE TN-7\nPROJEKT MÖBIUS · VERSUCHSREIHE 1996\n\nTeilnehmerin 7, weiblich. Rufname laut Protokoll: „Mara“.\nAufnahme: Herbst 1996. Entlassung: nicht vermerkt.\n\nBefund:\nDie Probandin spricht nach der Sitzung über Lampen, Radios und Fernseher. Sie behauptet, „in den Röhren“ zu sein. Sie wirkt dabei ruhig und gut gelaunt.',
  'Nachtrag (andere Handschrift):\nSeit Sitzung 14 zeigt die Probandin ein Hautmal am Handgelenk. Es stand in keinem früheren Befund. Sie sagt, es sei „einfach da gewesen“.\n\nFrag sie selbst danach. Uns sagt sie nichts.\n\nWeitere Seiten fehlen.']},
 {id:'R-19',tab:'R-19 · SPIELUHR',pages:[
  'FALLAKTE R-19\nVERTRAULICH\n\nBetreff: Wiederkehrende Gegenstände\n\nIn mehreren Zeitabschnitten tauchen dieselben Dinge auf, jeweils in anderem Zustand: eine Spieluhr, eine Kassette ohne Beschriftung, ein Handy mit grünem Display.\n\nDie Spieluhr spielt im Jahr 1984 vollständig. Später fehlen Töne. Im Jahr 2041 schweigt sie ganz.',
  'Hinweis aus der Asservatenkammer:\nDie Melodie ist keine Musik. Sie ist eine Reihenfolge.\n\nWer sie einmal ganz gehört hat, sollte sie aufschreiben, bevor die Schleife sie löscht.\n\nZuständig: Sonderstelle. Rückfragen zwecklos.']}];
window.APT_MARA={
 hello:['mara_hallo','„Du rufst mich an? Süß. Was willst du wissen?“'],
 opts:[
  {id:'wo',label:'Wo bin ich hier?',vo:'mara_wo',say:'„In einer Wohnung, die es so nie gab. Zusammengeklebt aus lauter Erinnerungen.“'},
  {id:'wer',label:'Wer hat hier gewohnt?',vo:'mara_wer',say:'„Niemand. Und alle, die sie mal gemocht hat.“'},
  {id:'buero',label:'Was hat es mit dem Büro auf sich?',vo:'mara_buero',say:'„Die Akten? Lies sie ruhig. Aber glaub nicht alles, was da drinsteht.“'},
  {id:'tattoo',label:'Hast du eigentlich ein Tattoo?',vo:'mara_tattoo',say:'„Ja, ein Kaninchen. Das war auf einmal da.“',cond:'rabbit'},
  {id:'bye',label:'Auflegen',vo:'mara_tschuess',say:'„Leg auf. Die Uhr tickt, Casanova.“',end:true}]};
