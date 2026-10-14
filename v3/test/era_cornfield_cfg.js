window.ERA={ amb:'../assets/sfx/amb_cornfield.mp3', ambVol:0.35, props:[['../assets/props/wooden_crate_01.glb',1.0,0,-0.8,0.8,25]], pools:[[1.0,0.9,-0.8,0.5,1.2]],
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
(function(){ let busy=0; const fade=(cb)=>{ const c=document.getElementById('cam').object3D, T=THREE;
  let sp=window.__mobS; if(!sp){ sp=new T.Mesh(new T.SphereGeometry(0.3,16,12),new T.MeshBasicMaterial({color:0x000000,side:T.BackSide,transparent:true,opacity:0,depthTest:false,fog:false})); sp.renderOrder=999; c.add(sp); window.__mobS=sp; }
  const gr=document.getElementById('ffgrain'), g0=gr?gr.style.opacity:0; const t0=performance.now(); let done=0;
  (function f(){ const k=(performance.now()-t0)/900; sp.material.opacity=k<0.45?k/0.45:(k<0.55?1:Math.max(0,1-(k-0.55)/0.45)); if(gr) gr.style.opacity=(k>0.3&&k<0.7)?0.6:g0;
   if(k>=0.5&&!done){ done=1; cb(); } if(k<1) requestAnimationFrame(f); else { sp.material.opacity=0; if(gr) gr.style.opacity=g0; busy=0; } })(); };
 setInterval(()=>{ const r=document.getElementById('rig'), c=document.getElementById('cam'); if(!r||!c||busy) return; const wz=r.object3D.position.z+c.object3D.position.z;
  if(wz<-1.55){ busy=1; fade(()=>{ r.object3D.position.z+=3.5; window.__mob=(window.__mob||0)+1; if(window.eraSay) window.eraSay('Mara', window.__mob===1?'„Schon wieder hier? Das Feld ist rund, Süßer. Oder du bist es.“':'„Geradeaus ist hier nur eine Meinung.“'); }); } },150); })();
window.ERAX={stands:[[-1.35,0.6,60,0.8,1.8,0x2a2018,[['p1',0.75,1.2,0,['Mara', '„Zurück in die Vergangenheit. Hängt mitten im Mais. Irgendwer hat hier Humor.“']]],0xffc890,0.7]],
 covers:[['c7','paper',-0.3,0,0.4,15,['Mara', '„Eine Zeitung. Dasselbe Datum wie gestern. Und vorgestern.“']]],
 decoys:[['../assets/items/cube.glb',1.0,0.28,-0.8,1,20,['Mara', '„Ein Würfel im Maisfeld. Sowas legt man nicht zufällig hin.“']],['../assets/items/banana.glb',0.2,0,1.2,1,70,['Mara', '„Eine Banane. Hast du die eben fallen lassen? Beim letzten Mal?“']]]};
