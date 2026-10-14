window.ERA={
 backdrop:{url:'../assets/era2041/placeholder_backdrop.jpg', px:0.014, r:6, front:3.4, horizonRow:236}, // PLATZHALTER bis Petes 2041-Bilder da sind
 wall:0x0a140e, wallEm:0x020a04, floor:0x222a24, floorRough:0.25, floorTex:'../assets/tex/kirmes/Asphalt/Asphalt025B_1K-JPG_Color.jpg',
 room:{w:6.4,h:4.2,d:3.6,cz:0.6,ceiling:false},
 lights:[[0x40ff90,2.2,7,-1.8,2.8,-1.4],[0xff40c0,1.6,6,1.9,2.6,-1.0],[0x40ff90,0.7,8,0,3,2]],
 glows:[[-2.0,2.6,-3.3,1.6,0x40ff90,0.35],[1.9,2.3,-3.3,1.2,0xff40c0,0.3],[0,3.4,-3.4,2.6,0x30c070,0.15]],
 boxes:[[0.7,0.8,0.5,0x101814,-1.8,0.4,-1.3]],
 surfaces:[[-1.8,-1.3,0.7,0.5,0.8]],
 items:[['../assets/items/2041/gruenriegel_0.glb',-1.85,0.8,-1.3,1,20,['Erzähler','Ein Grünriegel. Schmeckt nach Algen und Gehorsam.']],['../assets/items/2041/gruenriegel_1.glb',-1.65,0.8,-1.25,1,-10,null]],
 people:{who:['Frau','Mann'], pos:[1.0,0,-1.75], radius:2.8, stillSec:2.0, lines:[
  ['Frau','Hast du\'s gehört? Die Superreichen sind mit \'ner Rakete abgehauen.'],
  ['Mann','Schon wieder? Wohin diesmal?'],
  ['Frau','Die wollen ein Restaurant eröffnen. Am Ende der Galaxis.'],
  ['Mann','Na toll. Und wer kocht? Wir?'],
  ['Frau','Angeblich gibt\'s da nur ein Gericht. Und das will gefressen werden.'],
  ['Mann','Klingt wie die Kantine. Wie viel kostet der Eintritt?'],
  ['Frau','42. Was auch immer. Hauptsache, man hat sein Handtuch dabei.'],
  ['Mann','Ist eh nur ein Gerücht. … Hast du ein Handtuch?']],
  after:'(Die beiden schlurfen weiter. Irgendwo piept eine Überwachungsdrohne.)'},
 enter:['Erzähler','2041. Die Luft schmeckt grün. Zwei müde Gestalten stehen im Smog und reden.'],
 floorFront:-1.9, bounds:[-2.9,2.9,-1.7,2.2]
};
