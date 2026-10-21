import sys, shutil, os, time
from gradio_client import Client, handle_file
def p(x):
    if isinstance(x,dict): x=x.get('value') or x.get('path')
    return x
name=sys.argv[1]; seed=int(sys.argv[2]) if len(sys.argv)>2 else 1234
t=time.time(); c=Client('tencent/Hunyuan3D-2mv',verbose=False)
r=c.predict(None,None,handle_file('in/'+name+'.jpg'),None,None,None,30,5.0,seed,256,True,8000,False,api_name='/shape_generation')
f=p(r[0]); d='out/'+name+os.path.splitext(f)[1]; shutil.copy(f,d); print('SAVED',d,os.path.getsize(d),r[2] if len(r)>2 else '', round(time.time()-t))
