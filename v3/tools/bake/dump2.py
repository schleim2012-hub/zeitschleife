# Generischer Dump für Räume, die ZSBake.realism(G,sc,{room:...}) aufrufen (window.__ZSB).
# Klassifiziert automatisch: Empfänger (opake Standard-Materialien, groß genug) / Leuchten (MeshBasic, hell) / Schattenwerfer (alles andere Opake, auch GLB-Props außerhalb von G)
# + alle Echtzeit-Punkt-/Spotlichter. Aufruf: python3 dump2.py URL OUT.json '{"recvMin":1.0,"excl":[],"emitGain":1,"lightGain":1,...}' [preclick]
import asyncio,json,sys
from playwright.async_api import async_playwright
URL,OUT=sys.argv[1],sys.argv[2]; CFG=json.loads(sys.argv[3]) if len(sys.argv)>3 else {}; PRE=sys.argv[4] if len(sys.argv)>4 else ''
JS=r"""(cfg)=>{ const Z=window.__ZSB; const G=Z.G, S=Z.sc.object3D, T=THREE; S.updateMatrixWorld(true); const out={recv:{},occ:{},emit:[],points:[],log:[]};
 const rig=document.getElementById('rig'); const rigO=rig&&rig.object3D; const under=(o,p)=>{ for(let q=o;q;q=q.parent) if(q===p) return true; return false; };
 const lin=c=>c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);
 const avgMap=(mt)=>{ const t=mt.map; if(!t||!t.image) return [1,1,1]; try{ const c=document.createElement('canvas'); c.width=c.height=8; const x=c.getContext('2d'); x.drawImage(t.image,0,0,8,8); const d=x.getImageData(0,0,8,8).data; let r=0,g=0,b=0; for(let i=0;i<256;i+=4){ r+=d[i]; g+=d[i+1]; b+=d[i+2]; } const s=t.colorSpace===T.SRGBColorSpace; const f=v=>{ v=v/64/255; return s?lin(v):v; }; return [f(r),f(g),f(b)]; }catch(e){ return [0.5,0.5,0.5]; } };
 const grab=(o)=>{ let g=o.geometry; if(!g||!g.attributes.position) return null; if(g.index) g=g.toNonIndexed(); const p=g.attributes.position, n=g.attributes.normal; const P=[],N=[]; const v=new T.Vector3(), nm=new T.Matrix3().getNormalMatrix(o.matrixWorld);
  for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld); P.push(+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4)); if(n){ v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize(); N.push(+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)); } } return {P,N,count:p.count}; };
 const bb=new T.Box3(), sz=new T.Vector3(), ce=new T.Vector3(); const seen=new Set();
 const visit=(m,inG)=>{ if(!m.isMesh||m.isInstancedMesh||m.isSkinnedMesh||seen.has(m)) return; seen.add(m); if(rigO&&under(m,rigO)) return; const mt=m.material; if(!mt||Array.isArray(mt)) return; if(mt.visible===false) return;
  if(cfg.excl&&cfg.excl.some(e=>e.endsWith('*')?m.name.startsWith(e.slice(0,-1)):m.name===e)) { out.log.push('excl '+m.name); return; }
  if(cfg.skip&&cfg.skip.includes(m.name)) return;
  bb.setFromObject(m); if(bb.isEmpty()) return; bb.getSize(sz); bb.getCenter(ce); const diag=sz.length();
  if(cfg.region){ const [x0,x1,z0,z1]=cfg.region; if(ce.x<x0||ce.x>x1||ce.z<z0||ce.z>z1) return; }
  const add=(mt.blending===T.AdditiveBlending)||(mt.transparent&&mt.opacity<0.95)||(mt.transparent&&!mt.alphaTest&&mt.depthWrite===false);
  if(add) return;
  const am=avgMap(mt); const col=mt.color?[mt.color.r*am[0],mt.color.g*am[1],mt.color.b*am[2]]:am;
  if(mt.isMeshBasicMaterial){ const lum=0.3*col[0]+0.59*col[1]+0.11*col[2]; const d=grab(m); if(!d) return;
   if(lum>(cfg.emitMin||0.05)&&inG){ const k=(cfg.emitOver&&cfg.emitOver[m.name])||cfg.emitGain||1; out.emit.push({name:m.name,P:d.P,col,str:k}); out.log.push('emit '+m.name+' lum '+lum.toFixed(3)+' @'+ce.toArray().map(v=>v.toFixed(1))+' diag '+diag.toFixed(2)); } else out.occ[m.name]=d; return; }
  let emis=mt.emissive?(0.3*mt.emissive.r+0.59*mt.emissive.g+0.11*mt.emissive.b)*(mt.emissiveIntensity||1):0;
  const d=grab(m); if(!d) return;
  if(emis>(cfg.emitMin||0.05)&&inG){ out.emit.push({name:m.name,P:d.P,col:[mt.emissive.r*mt.emissiveIntensity,mt.emissive.g*mt.emissiveIntensity,mt.emissive.b*mt.emissiveIntensity],str:cfg.emitGain||1}); out.log.push('emitS '+m.name); return; }
  const isRecv=inG&&diag>=(cfg.recvMin||1.0)&&!(cfg.noRecv||[]).includes(m.name)&&!mt.alphaTest&&!m.geometry.groups.length&&(cfg.onlyRecv?cfg.onlyRecv.includes(m.name):true);
  if(isRecv){ d.alb=col.map(v=>Math.min(cfg.albMax||0.6,v*(cfg.albK||1))); d.c=[+ce.x.toFixed(3),+ce.y.toFixed(3),+ce.z.toFixed(3)]; out.recv[m.name]=d; out.log.push('recv '+m.name+' n='+d.count+' diag '+diag.toFixed(1)+' alb '+d.alb.map(v=>v.toFixed(3))); }
  else out.occ[m.name||('o'+seen.size)]=d; };
 G.traverse(m=>visit(m,true)); if(cfg.occAll!==false) S.traverse(m=>visit(m,false));
 if(cfg.lights!==false) S.traverse(L=>{ if(!(L.isPointLight||L.isSpotLight)||L.intensity<=0) return; if(cfg.region){ const p=L.getWorldPosition(new T.Vector3()); const [x0,x1,z0,z1]=cfg.region; if(p.x<x0||p.x>x1||p.z<z0||p.z>z1) return; } const p=L.getWorldPosition(new T.Vector3()); const e={name:L.name||'L'+out.points.length,pos:[p.x,p.y,p.z],col:[L.color.r,L.color.g,L.color.b],I:L.intensity,w:4*Math.PI*L.intensity*(cfg.lightGain||1)};
  if(L.isSpotLight){ const t=L.target.getWorldPosition(new T.Vector3()); e.spot={angle:L.angle,pen:L.penumbra,tgt:[t.x,t.y,t.z]}; } out.points.push(e); out.log.push('light '+e.name+' I='+L.intensity.toFixed(2)+(e.spot?' spot':'')); });
 (cfg.extraLights||[]).forEach(e=>{ e.w=4*Math.PI*e.I*(cfg.lightGain||1); out.points.push(e); });
 return out; }"""
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(channel='chrome',args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await br.new_page(viewport={'width':480,'height':270}); await pg.goto(URL); await pg.wait_for_timeout(CFG.get('wait',9000))
    if PRE: await pg.click(PRE); await pg.wait_for_timeout(9000)
    d=await pg.evaluate(JS,CFG); log=d.pop('log'); d['sky']=CFG.get('sky',False); d['world']=CFG.get('world',[0.002,0.002,0.003]); json.dump(d,open(OUT,'w'))
    print('\n'.join(log)); print('recv',len(d['recv']),'occ',len(d['occ']),'emit',len(d['emit']),'lights',len(d['points'])); await br.close()
asyncio.run(main())
