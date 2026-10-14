window.ERA={
 backdrop:{url:'../assets/cornfield/backdrop.jpg', px:0.02, r:6.5, front:3.6, horizonRow:235}, // Perchance cornfield/cornfield_007 (Pete)
 wall:0x101010, wallEm:0x020202, floor:0xa0a0a0, floorRough:0.6, floorTex:'../assets/cornfield/floor_photo.jpg', floorRep:2, floorFade:[0.5,0.85,0.12,0.62],
 room:{w:9,h:4.2,d:3.6,cz:0.6,ceiling:false,noWalls:true},
 lights:[[0xffc080,1.8,7,-1.6,3.0,-1.2],[0x6080b0,1.4,6,1.8,2.8,-0.8],[0x707880,0.5,8,0,3,2]],
 glows:[],
 enter:['Erzähler','Ein Maisfeld. Der Weg geht geradeaus. Und kommt trotzdem wieder hier an.'],
 floorFront:-3.0, bounds:[-2.9,2.9,-1.7,2.2]
};
// Möbius: wer vorne den Weg verlässt, kommt hinten wieder an (Bounds hinten offen gelassen)
window.ERA.bounds=[-1.2,1.2,-1.65,2.2];
setInterval(()=>{ const r=document.getElementById('rig'), c=document.getElementById('cam'); if(!r||!c) return; const wz=r.object3D.position.z+c.object3D.position.z;
 if(wz<-1.6){ r.object3D.position.z+=3.6; window.__mob=(window.__mob||0)+1; if(window.eraSay) window.eraSay('Mara', window.__mob===1?'„Schon wieder hier? Das Feld ist rund, Süßer. Oder du bist es.“':'„Geradeaus ist hier nur eine Meinung.“'); } },200);
