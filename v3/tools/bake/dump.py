# Dumpt die statische Raumgeometrie (Weltkoordinaten, nicht-indiziert, exakte Vertex-Reihenfolge) + Leuchten als JSON für Blender
import asyncio,json,sys
from playwright.async_api import async_playwright
URL=sys.argv[1]; OUT=sys.argv[2]
JS=r"""(cfg)=>{ const M=window.__M84||window.__BAKEROOM; const G=M.G; G.updateMatrixWorld(true); const out={recv:{},occ:{},emit:[],points:[]};
 const grab=(o,ix)=>{ let g=o.geometry; if(g.index){ if(!ix) return null; g=g.toNonIndexed(); } const p=g.attributes.position, n=g.attributes.normal; const P=[],N=[]; const v=new THREE.Vector3(), nm=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
  for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld); P.push(+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4)); if(n){ v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize(); N.push(+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)); } } return {P,N,count:p.count}; };
 G.children.forEach(o=>{ if(!o.isMesh||!o.name) return; if(cfg.recv.includes(o.name)){ const d=grab(o); if(d){ d.alb=cfg.alb[o.name]; out.recv[o.name]=d; } } else if(cfg.occ.includes(o.name)){ const d=grab(o); if(d) out.occ[o.name]=d; } });
 // Leuchten
 const tube=G.getObjectByName('m84_tube'); if(tube){ const d=grab(tube); out.emit.push({name:'tube',P:d.P,col:[1,0.353,0.753],str:cfg.tubeStr}); }
 const flu=G.getObjectByName('m84_flu'); if(flu){ const d=grab(flu,1); out.emit.push({name:'flu',P:d.P,col:[0.85,0.9,1],str:cfg.fluStr}); }
 const shop=G.getObjectByName('m84_shopin'); if(shop){ const d=grab(shop); out.emit.push({name:'shopin',P:d.P,col:[0.55,0.45,0.65],str:cfg.shopStr}); }
 const sp=M.sigM.geometry.attributes.position, hc=M.haloM.geometry.attributes.color; M.signs.forEach((g,i)=>{ const P=[]; for(let j=0;j<6;j++) P.push(sp.getX(g.si+j),sp.getY(g.si+j),sp.getZ(g.si+j)); const c=[hc.getX(g.hi)/0.3,hc.getY(g.hi)/0.3,hc.getZ(g.hi)/0.3]; out.emit.push({name:'sign'+i,P,col:c,str:cfg.signStr}); });
 M.lights.forEach((L,i)=>{ if(i===2) out.points.push({name:'fountain',pos:[L.position.x,L.position.y,L.position.z],col:[L.color.r,L.color.g,L.color.b],w:cfg.fountW}); });
 return out; }"""
CFG=dict(recv=['m84_terr','m84_ceil','m84_fas','m84_col','m84_shut','m84_basin','m84_planter'],occ=['m84_metal','m84_dark','m84_glass_no'],
 alb={'m84_terr':[0.06,0.05,0.05],'m84_ceil':[0.05,0.055,0.055],'m84_fas':[0.075,0.05,0.07],'m84_col':[0.08,0.03,0.04],'m84_shut':[0.05,0.05,0.06],'m84_basin':[0.02,0.08,0.12],'m84_planter':[0.05,0.045,0.045]},
 tubeStr=40, fluStr=4, shopStr=0.35, signStr=7, fountW=25)
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(channel='chrome',args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await br.new_page(viewport={'width':640,'height':360}); await pg.goto(URL); await pg.wait_for_timeout(7000)
    d=await pg.evaluate(JS,CFG); json.dump(d,open(OUT,'w'))
    print({k:v['count'] for k,v in d['recv'].items()},{k:v['count'] for k,v in d['occ'].items()},len(d['emit']),d['points']); await br.close()
asyncio.run(main())
