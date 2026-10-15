// Bodennebel am Fuß gebogener Fotowände: kaschiert die gekrümmte Kante zwischen 3D-Boden und Foto.
// baseFog(parent,{R,cx,cz,thL,h,ring,color,opacity}) – Bogen um (cx,cz), mittig nach −z, Breite thL (rad)
window.baseFog=function(parent,o){ const T=THREE, R=o.R, thL=o.thL||Math.PI, col=o.color||0x050407, op=o.opacity==null?0.85:o.opacity, h=o.h||1.0, ring=o.ring||2.2;
 const g=new T.Group(); g.position.set(o.cx||0,0,o.cz||0); parent.add(g);
 // senkrechter Schleier direkt vor der Wand: unten dicht, nach oben weg
 const vc=document.createElement('canvas'); vc.width=4; vc.height=128; const vx=vc.getContext('2d'); const vg=vx.createLinearGradient(0,128,0,0);
 vg.addColorStop(0,'#fff'); vg.addColorStop(0.35,'#bbb'); vg.addColorStop(1,'#000'); vx.fillStyle=vg; vx.fillRect(0,0,4,128);
 const edge=document.createElement('canvas'); edge.width=128; edge.height=4; const ex=edge.getContext('2d'); const eg=ex.createLinearGradient(0,0,128,0);
 eg.addColorStop(0,'#000'); eg.addColorStop(0.08,'#fff'); eg.addColorStop(0.92,'#fff'); eg.addColorStop(1,'#000'); ex.fillStyle=eg; ex.fillRect(0,0,128,4);
 // Kombi-Alpha (vertikal × Ränder) in eine Textur
 const ac=document.createElement('canvas'); ac.width=128; ac.height=128; const ax=ac.getContext('2d'); ax.drawImage(vc,0,0,128,128); if(thL<6.27){ ax.globalCompositeOperation='multiply'; ax.drawImage(edge,0,0,128,128); } // voller 360°-Ring: keine Endkanten
 const vm=new T.MeshBasicMaterial({color:col,transparent:true,opacity:op,alphaMap:new T.CanvasTexture(ac),depthWrite:false,fog:false,side:T.DoubleSide});
 const v=new T.Mesh(new T.CylinderGeometry(R-0.05,R-0.05,h,96,1,true,Math.PI-thL/2,thL),vm); v.position.y=h/2-0.02; v.renderOrder=3; g.add(v);
 // flacher Nebel auf dem Boden vor der Wand (radial)
 const N=256, rc=document.createElement('canvas'); rc.width=rc.height=N; const rx=rc.getContext('2d'); const rg=rx.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);
 const r0=(R-ring)/R; rg.addColorStop(0,'#000'); rg.addColorStop(Math.max(0,r0),'#000'); rg.addColorStop(Math.min(1,r0+(1-r0)*0.75),'#aaa'); rg.addColorStop(1,'#fff'); rx.fillStyle=rg; rx.fillRect(0,0,N,N);
 const rm=new T.MeshBasicMaterial({color:col,transparent:true,opacity:op*0.9,alphaMap:new T.CanvasTexture(rc),depthWrite:false,fog:false});
 const rgeo=new T.RingGeometry(Math.max(0.01,R-ring),R,96,1,Math.PI/2-thL/2,thL); // UV wie Kreis → radialer Verlauf passt
 const rr=new T.Mesh(rgeo,rm); rr.rotation.x=-Math.PI/2; rr.position.y=0.012; rr.renderOrder=2; g.add(rr);
 return g; };
