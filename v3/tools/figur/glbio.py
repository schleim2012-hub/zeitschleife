import json,struct,numpy as np
def load(p):
  d=open(p,'rb').read(); jl=struct.unpack('<I',d[12:16])[0]; J=json.loads(d[20:20+jl]); o=20+jl; bl=struct.unpack('<I',d[o:o+4])[0]; B=d[o+8:o+8+bl]; return J,bytearray(B)
CT={5126:('f4',4),5123:('u2',2),5125:('u4',4),5121:('u1',1)}; NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def acc(J,B,i):
  a=J['accessors'][i]; bv=J['bufferViews'][a['bufferView']]; t,s=CT[a['componentType']]; n=NC[a['type']]
  off=bv.get('byteOffset',0)+a.get('byteOffset',0); st=bv.get('byteStride',s*n)
  raw=np.frombuffer(bytes(B[off:off+st*a['count']]),dtype=np.uint8).reshape(a['count'],st)[:,:s*n].copy()
  return raw.view('<'+t).reshape(a['count'],n)
def save(p,J,B):
  while len(B)%4: B+=b'\0'
  js=json.dumps(J,separators=(',',':')).encode();
  while len(js)%4: js+=b' '
  out=struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(B))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(B),0x004E4942)+bytes(B)
  open(p,'wb').write(out)
