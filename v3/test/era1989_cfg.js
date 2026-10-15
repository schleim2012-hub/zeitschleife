window.ERA={ amb:'../assets/sfx/amb_1989.mp3', ambVol:0.5, pools:[[-1.35,0.85,-1.0,0.6,1.3]],
 backdrop:{url:'../assets/era1989/street_backdrop.jpg', px:0.02, r:6.5, front:3.6, horizonRow:236}, // Perchance e1989_street_023 (Pete)
 wall:0x14171b, wallEm:0x030405, floor:0xb0b0b0, floorRough:0.35, floorTex:'../assets/era1989/floor_photo.jpg', floorRep:2, floorFade:[0.5,0.85,0.12,0.62],
 room:{w:9,h:4.2,d:3.6,cz:0.6,ceiling:false},
 lights:[[0xffc070,2.4,7,-1.6,3.2,-1.2],[0xffb060,1.6,6,1.8,3.0,-0.6],[0x8090a0,0.6,8,0,3,2]],
 glows:[[-1.9,2.55,-3.3,0.9,0xffc080,0.4],[1.6,2.4,-3.3,0.7,0xffc080,0.35]],
 props:[['../assets/props/wooden_crate_01.glb',-1.7,0,-1.2,1,20],['../assets/props/wooden_crate_01.glb',1.9,0,-1.4,0.8,-35]],
 surfaces:[[-1.7,-1.2,0.9,0.6,0.34],[1.9,-1.4,0.7,0.5,0.27]],
 items:[['../assets/items/banana.glb',-1.8,0.34,-1.2,1,30,['Erzähler','Eine Banane. 1989 ein Statussymbol.']],['../assets/items/coin.glb',-1.5,0.35,-1.1,1,0,['Erzähler','Eine Mark. Reicht genau für eine Banane.']],['../assets/items/cross_pein_hammer.glb',1.9,0.39,-1.4,1,60,['Mara','„Charme reißt keine Mauern ein, Süßer. Ein Hammer schon.“','../voice/mara_8a25cbb5a2.mp3']]],
 enter:['Erzähler','Ost-Berlin, Novembernacht. Irgendwo jubelt jemand. Hier nur Kopfsteinpflaster und ein Trabi mit Hoffnung.'],
 floorFront:-3.0, bounds:[-2.9,2.9,-1.7,2.2]
};
window.ERAX={ standMat:'wood',
 stands:[[-2.6,0.5,70,0.95,2.0,0x2a2018,[['p5',0.9,1.35,0,['Mara','„Mars-Reisen, nur für Millionäre. Hier drüben wäre man schon mit Mallorca zufrieden.“']]],0xffc890,1.0]],
 covers:[['c7','paper',-1.1,0,-0.55,25,['Mara','„Die Mauer ist weg. Steht da, als hätte sie jemand verlegt.“']],['c12','book',-1.5,0.34,-1.35,-15,['Mara','„Der kleine Trabi-Trainer. Kapitel eins: Warten. Kapitel zwei: weiter warten.“']]],
 decoys:[['../assets/items/polaroid.glb',1.75,0.27,-1.3,1,40,['Mara','„Ein Polaroid. Wenn man wedelt, wird es schneller fertig. Stimmt nicht. Machen trotzdem alle.“']]]
};
