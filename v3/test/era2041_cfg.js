window.ERA={
 backdrop:{url:'../assets/era2041/street_backdrop.jpg', px:0.02, r:6.5, front:3.6, horizonRow:335}, // Perchance e2041_street_041 (Pete)
 wall:0x0a140e, wallEm:0x020a04, floor:0xb0b0b0, floorRough:0.25, floorTex:'../assets/era2041/floor_photo.jpg', floorRep:2, floorFade:[0.5,0.85,0.12,0.62],
 room:{w:9,h:4.2,d:3.6,cz:0.6,ceiling:false,noWalls:true},
 lights:[[0x40ff90,2.2,7,-1.8,2.8,-1.4],[0xff40c0,1.6,6,1.9,2.6,-1.0],[0x40ff90,0.7,8,0,3,2]],
 glows:[[-2.0,2.6,-3.3,1.6,0x40ff90,0.35],[1.9,2.3,-3.3,1.2,0xff40c0,0.3],[0,3.4,-3.4,2.6,0x30c070,0.15]],
 props:[['../assets/props/plastic_crate_01.glb',-1.8,0,-1.3,1,15]],
 surfaces:[[-1.8,-1.3,0.6,0.45,0.26]],
 items:[['../assets/items/2041/gruenriegel_0.glb',-1.85,0.26,-1.3,1,20,['Erzähler','Ein Grünriegel. Schmeckt nach Algen und Gehorsam.']],['../assets/items/2041/gruenriegel_1.glb',-1.7,0.26,-1.25,1,-10,null]],
 people:{who:['Frau','Mann'], img:['../assets/era2041/passer_1.png','../assets/era2041/passer_0.png'], height:1.75, pos:[1.0,0,-1.75], radius:2.8, stillSec:2.0, lines:[
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
 floorFront:-3.0, bounds:[-2.9,2.9,-1.7,2.2]
};
