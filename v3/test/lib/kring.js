// 360°-Foto-Ring „Kirmes bei Nacht“ (Grok p2_01 vorne, Perchance-Seiten 015/041, geschlossene Budengasse hinten) – gleiche Anordnung wie kirmes.html.
// kirmesRing(parent,{cx,cz,R,rotY,tone,eye,base}) – rotY dreht den Ring (0 = Hauptfoto nach −z). tone <1 dunkelt ab. base = Pfad zu assets/pano/.
window.kirmesRing=function(parent,o={}){ const T=THREE, R=o.R||10, tone=o.tone==null?1:o.tone, eye=o.eye||1.6, B=o.base||'../assets/pano/', TL=new T.TextureLoader();
 const g=new T.Group(); g.position.set(o.cx||0,0,o.cz||0); g.rotation.y=o.rotY||0; parent.add(g);
 const am=(l,r,top)=>{ const c=document.createElement('canvas'); c.width=256; c.height=128; const x=c.getContext('2d'); const h=x.createLinearGradient(0,0,256,0); h.addColorStop(0,'#000'); h.addColorStop(l,'#fff'); h.addColorStop(1-r,'#fff'); h.addColorStop(1,'#000'); x.fillStyle=h; x.fillRect(0,0,256,128);
  x.globalCompositeOperation='multiply'; const v=x.createLinearGradient(0,0,0,128); v.addColorStop(0,'#000'); v.addColorStop(top,'#fff'); v.addColorStop(1,'#fff'); x.fillStyle=v; x.fillRect(0,0,256,128); return new T.CanvasTexture(c); };
 const col=new T.Color(tone,tone,tone);
 const seg=(file,r,th0,thL,hgt,y,alpha,ro)=>{ const m=new T.MeshBasicMaterial({color:col,fog:false,toneMapped:false,side:T.DoubleSide,alphaMap:alpha,transparent:true,depthWrite:false});
  TL.load(B+file,t=>{ t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; m.map=t; m.needsUpdate=true; });
  const w=new T.Mesh(new T.CylinderGeometry(r,r,hgt,96,1,true,th0,thL),m); w.scale.x=-1; w.renderOrder=ro; w.position.y=y; g.add(w); return w; };
 const KANG=140*Math.PI/180, KPX=1792/(R*KANG), KH=1008/KPX; seg('kirmes_grok_p2_01.jpg',R,Math.PI-KANG/2,KANG,KH,eye+(504-540)/KPX,am(0.1,0.1,0.2),-7);
 const SANG=52*Math.PI/180, SH=(R*SANG)*512/768, sa=am(0.2,0.2,0.3);
 seg('kirmes_side_L.jpg',R+0.05,Math.PI+KANG/2,SANG,SH,eye+10*SH/512,sa,-7); seg('kirmes_side_R.jpg',R+0.05,Math.PI-KANG/2-SANG,SANG,SH,eye+10*SH/512,sa,-7);
 const OVA=8*Math.PI/180, BL=2*Math.PI-KANG-2*SANG+2*OVA, BR=R+0.1, BH=BR*BL*512/1286; seg('kirmes_back.jpg',BR,Math.PI+KANG/2+SANG-OVA,BL,BH,eye+10*BH/512,am(0.09,0.09,0.32),-8);
 return g; };
