/* depthbg.js – "Bild mit Tiefe" für unerreichbare Hintergründe (Fensterblick, Glasfront, ferne Flure).
   Einzelbild + Tiefenkarte (Depth Anything V2, 1 = nah, 0 = fern; erzeugt mit tools/backdrop/depth_bake.py)
   -> Gitter-Mesh, dessen Punkte auf Sehstrahlen ab einem Augpunkt verschoben sind. Echte Parallaxe bei Kopfbewegung, 1 Draw Call.
   Nutzung (three.js):  DepthBG.create(parentObject3D, {img:'..jpg', depth:'.._depth.png', position:[x,y,z], rotY:0, hfov:72, aspect:1.5, near:6, far:160, fade:0.12, grid:[192,128]}).then(mesh=>...)
   Nutzung (A-Frame):   <a-entity depth-bg="img:../sky/backdrop/bild2041.jpg; depth:../sky/backdrop/bild2041_depth.png; hfov:72; near:6; far:160" position="0 1.6 -3"></a-entity>
   position = Augpunkt der Original-Kamera (am besten Augenhöhe am Fenster, etwas hinter der Scheibe); Bild blickt entlang -Z (rotY dreht).
   near/far = Meter für nächsten/fernsten Bildteil. Tiefe wird invers interpoliert (1/r linear in n), so wie die Netz-Ausgabe. */
(function(){
const T=()=>window.THREE;
function loadImg(src){ return new Promise((res,rej)=>{ const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }
async function build(o){
  const THREE=T(); const dimg=await loadImg(o.depth); const c=document.createElement('canvas'); c.width=dimg.width; c.height=dimg.height;
  const x=c.getContext('2d'); x.drawImage(dimg,0,0); const D=x.getImageData(0,0,c.width,c.height).data;
  const [GX,GY]=o.grid||[192,128], HF=(o.hfov||72)*Math.PI/180, asp=o.aspect||1.5, tx=Math.tan(HF/2), ty=tx/asp;
  const near=o.near||6, far=o.far||160, b=1/far, a=1/near-b;
  const g=new THREE.PlaneGeometry(1,1,GX,GY), P=g.attributes.position, UV=g.attributes.uv, v3=new THREE.Vector3();
  const samp=(u,v)=>{ // bilinear
    const fx=u*(c.width-1), fy=(1-v)*(c.height-1), x0=Math.floor(fx), y0=Math.floor(fy), x1=Math.min(x0+1,c.width-1), y1=Math.min(y0+1,c.height-1), ax=fx-x0, ay=fy-y0;
    const p=(xx,yy)=>D[(yy*c.width+xx)*4]; return ((p(x0,y0)*(1-ax)+p(x1,y0)*ax)*(1-ay)+(p(x0,y1)*(1-ax)+p(x1,y1)*ax)*ay)/255; };
  for(let i=0;i<P.count;i++){ const u=UV.getX(i), v=UV.getY(i); const r=1/(a*samp(u,v)+b); v3.set((u-0.5)*2*tx,(v-0.5)*2*ty,-1).normalize().multiplyScalar(r); P.setXYZ(i,v3.x,v3.y,v3.z); }
  // Randabdunklung (fade, Anteil der Bildbreite): kaschiert die Bildkante, passt zum dunklen Look
  const fd=o.fade==null?0.12:o.fade, col=new Float32Array(P.count*3);
  for(let i=0;i<P.count;i++){ const u=UV.getX(i), v=UV.getY(i); const e=Math.min(u,1-u,(v)*1.5,(1-v)*1.5); const k=fd>0?Math.min(1,Math.max(0,e/fd)):1; const s2=k*k*(3-2*k); col.set([s2,s2,s2],i*3); }
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  g.computeBoundingSphere();
  const tex=new THREE.TextureLoader().load(o.img,t=>{ t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; });
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:tex,fog:false,vertexColors:true,color:o.tint||0xffffff}));
  const p=o.position||[0,1.6,0]; m.position.set(p[0],p[1],p[2]); m.rotation.y=(o.rotY||0)*Math.PI/180; m.frustumCulled=false; m.name='depthbg';
  return m; }
window.DepthBG={ create(parent,o){ return build(o).then(m=>{ parent.add(m); return m; }); }, build };
if(window.AFRAME) AFRAME.registerComponent('depth-bg',{ schema:{img:{type:'string'},fade:{default:0.12},depth:{type:'string'},hfov:{default:72},aspect:{default:1.5},near:{default:6},far:{default:160},gx:{default:192},gy:{default:128}},
  init(){ const d=this.data; build({img:d.img,depth:d.depth,hfov:d.hfov,aspect:d.aspect,near:d.near,far:d.far,fade:d.fade,grid:[d.gx,d.gy],position:[0,0,0]}).then(m=>this.el.setObject3D('mesh',m)); },
  remove(){ this.el.removeObject3D('mesh'); } });
})();
