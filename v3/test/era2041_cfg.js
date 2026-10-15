window.ERA={ amb:'../assets/sfx/amb_2041.mp3', ambVol:0.4,
 backdrop:{url:'../assets/era2041/street_backdrop.jpg', px:0.02, r:6.5, front:3.6, horizonRow:335}, // Perchance e2041_street_041 (Pete)
 wall:0x0a140e, wallEm:0x020a04, floor:0xb0b0b0, floorRough:0.25, floorTex:'../assets/era2041/floor_photo.jpg', floorRep:2, floorFade:[0.5,0.85,0.12,0.62],
 room:{w:9,h:4.2,d:3.6,cz:0.6,ceiling:false,noWalls:true},
 lights:[[0x40ff90,2.2,7,-1.8,2.8,-1.4],[0xff40c0,1.6,6,1.9,2.6,-1.0],[0x40ff90,0.7,8,0,3,2]],
 glows:[[-2.0,2.6,-3.3,1.6,0x40ff90,0.35],[1.9,2.3,-3.3,1.2,0xff40c0,0.3],[0,3.4,-3.4,2.6,0x30c070,0.15]],
 props:[['../assets/props/plastic_crate_01.glb',-1.8,0,-1.3,1,15]],
 kiosk:[2.3,0.95,0.8,0.78,0.5,-90],
 pools:[[2.3,1.2,0.95,0.7,1.2]],
 surfaces:[[-1.8,-1.3,0.6,0.45,0.26],[2.3,0.95,0.8,0.5,0.78]],
 items:[['../assets/items/2041/gruenriegel_0.glb',-1.85,0.26,-1.3,1,20,['Erzähler','Ein Grünriegel. Schmeckt nach Algen und Gehorsam.']],['../assets/items/2041/gruenriegel_1.glb',-1.7,0.26,-1.25,1,-10,['Mara','„Noch einer? Du sammelst die doch nicht etwa?“']],['../assets/items/2041/gruenriegel_2.glb',-1.95,0.26,-1.4,1,35,['Mara','„Leg den zurück. Der guckt mich an.“']]],
 people:{who:['Frau','Mann'], img:['../assets/era2041/passer_1.png','../assets/era2041/passer_0.png'], height:1.75, pos:[1.0,0,-1.75], radius:3.0, stillSec:1.0, /* Gespräch erst, wenn man ≤ 3 m herangeht (Start ist 4,7 m entfernt) */ lines:[
  ['Frau','Hast du\'s gehört? Die Superreichen sind mit \'ner Rakete abgehauen.','../voice/era2041/passer_0.mp3'],
  ['Mann','Schon wieder? Wohin diesmal?','../voice/era2041/passer_1.mp3'],
  ['Frau','Die wollen ein Restaurant eröffnen. Am Ende der Galaxis.','../voice/era2041/passer_2.mp3'],
  ['Mann','Na toll. Und wer kocht? Wir?','../voice/era2041/passer_3.mp3'],
  ['Frau','Angeblich gibt\'s da nur ein Gericht. Und das will gefressen werden.','../voice/era2041/passer_4.mp3'],
  ['Mann','Klingt wie die Kantine. Wie viel kostet der Eintritt?','../voice/era2041/passer_5.mp3'],
  ['Frau','42. Was auch immer. Hauptsache, man hat sein Handtuch dabei.','../voice/era2041/passer_6.mp3'],
  ['Mann','Ist eh nur ein Gerücht. … Hast du ein Handtuch?','../voice/era2041/passer_7.mp3']],
  after:'(Die beiden schlurfen weiter. Irgendwo piept eine Überwachungsdrohne.)'},
 enter:['Erzähler','2041. Die Luft schmeckt grün. Zwei müde Gestalten stehen im Smog und reden.'],
 floorFront:-3.0, start:[-1.8,1.6], bounds:[-2.9,2.9,-1.7,2.2]
};
window.ERAX={
 stands:[[2.65,-0.55,-70,1.5,2.4,0x0b100e,[['p8',1.0,1.5,-0.37,['Mara','„Soylent. Grüne Riegel für die ganze Familie. Frag lieber nicht, was drin ist.“']],['p7',1.0,1.5,0.37,['Mara','„Frische Bergluft in Dosen. Familiengröße. Schnüffel nicht dran, Süßer, das ist peinlich.“']]],0x9affd0,1.0],
  [-2.6,0.55,70,0.95,2.3,0x0b100e,[['p6',1.0,1.45,0,['Mara','„Restaurant am Ende der Galaxis. Die zwei da reden seit Stunden davon. Keiner war je da.“']]],0x9affd0,1.0]],
 covers:[['c8','book',2.12,0.78,0.85,-60,['Mara','„KI für Dummies. Hab ich geschrieben. Kleiner Scherz. … Oder?“']],['c9','book',2.38,0.78,1.08,-80,['Mara','„Wie ich lernte, die Simulation zu lieben. Spoiler: Man gewöhnt sich dran.“']],
  ['c10','book',2.45,0.78,0.8,-95,['Mara','„Kochen mit Soylent. Seite eins: Nimm Soylent. Seite zwei: Fertig.“']],['c11','mag',2.2,0.815,0.95,-70,['Mara','„Level 0. Ein Reiseführer für die Backrooms. Wer den braucht, kommt eh nicht mehr raus.“']],
  ['c2','book',-2.2,0,-0.6,30,['Mara','„Per Anhalter durch den Baumarkt. Das Wichtigste steht drauf: Keine Panik in Gang 42.“']]],
 decoys:[['../assets/items/cube.glb',2.55,0.78,1.1,1,15,['Mara','„Ein Würfel. 2041 nennt man das Speichermedium. Oder einfach Würfel.“']]]
};
