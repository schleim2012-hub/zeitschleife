# V3-Sprachaufnahmen (ElevenLabs). Sammelt alle Sätze mit Sprecher aus data/game3.json; vorhandene (Hash wie V2) werden wiederverwendet.
import json,os,re,sys,hashlib,subprocess,urllib.request
sys.path.insert(0,'/workspace/tts'); DRY='--dry' in sys.argv
from num2words import num2words
def norm(t):
    t=t.replace(' ... ','… ').replace('...','…').replace('„','').replace('“','')
    t=re.sub(r'\b(19\d\d|20\d\d)\b',lambda m:num2words(int(m.group()),lang='de',to='year'),t)
    t=re.sub(r'\b\d+\b',lambda m:num2words(int(m.group()),lang='de'),t)
    return re.sub(r'\s+',' ',t).strip()
def h(t):
  x=2166136261
  for c in ''.join(ch for ch in t.lower() if ch.isdigit() or 'a'<=ch<='z' or ch in 'äöüß'):
    x^=ord(c); x=(x*16777619)&0xffffffff
  return format(x,'x')
VO={'mara':'cgSgspJ2msm6clMCkdW9','narrator':'JBFqnCBsd6RMkjVDRZzb'}; VO.update(json.load(open('/workspace/tts/side_voices.json')))
KEY=None
for l in open('/workspace/tts/.elevenlabs.env'):
  if l.startswith('ELEVENLABS_API_KEY='): KEY=l.split('=',1)[1].strip().strip('"\'')
G=json.load(open('data/game3.json')); V='voice'; M=json.load(open(f'{V}/manifest.json'))
L={}
def walk(o,sp=None):
  if isinstance(o,dict):
    if 'say' in o and isinstance(o['say'],str): L[o['say']]=o.get('speaker','narrator')
    if 'text' in o and 'speaker' in o and isinstance(o['text'],str): L[o['text']]=o['speaker']
    for k in ('good','bad'):
      if isinstance(o.get(k),str): L[o[k]]='mara'
    for v in o.values(): walk(v)
  elif isinstance(o,list): [walk(v) for v in o]
walk(G)
for e in G['hints'].values():
  for x in e: L[x['t'][0]]='narrator'; L[x['t'][1]]='mara'; L[x['t'][2]]='mara'
todo=[(t,s) for t,s in L.items() if h(t) not in M]
print('lines',len(L),'reuse',len(L)-len(todo),'new',len(todo),'chars',sum(len(norm(t)) for t,_ in todo))
if DRY: sys.exit()
chars=0
for t,s in todo:
  txt=norm(t.replace('"','')); out=f"{s}_{hashlib.md5(('v3'+s+txt).encode()).hexdigest()[:10]}.mp3"; f=f'{V}/{out}'
  if not os.path.exists(f):
    st={'stability':0.35,'similarity_boost':0.8,'style':0.5,'use_speaker_boost':True} if s not in('narrator',) else {'stability':0.4,'similarity_boost':0.75,'style':0.3,'use_speaker_boost':True}
    body=json.dumps({'text':txt,'model_id':'eleven_multilingual_v2','language_code':'de','voice_settings':st}).encode()
    r=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VO[s]}?output_format=mp3_44100_64",body,{'xi-api-key':KEY,'Content-Type':'application/json'})
    try: data=urllib.request.urlopen(r,timeout=120).read()
    except urllib.error.HTTPError as e:
      b=e.read()
      if b'language_code' in b: body=json.dumps({'text':txt,'model_id':'eleven_multilingual_v2','voice_settings':st}).encode(); data=urllib.request.urlopen(urllib.request.Request(r.full_url,body,dict(r.header_items())),timeout=120).read()
      else: print('ERR',e.code,b[:300]); break
    chars+=len(txt); open(f+'.raw','wb').write(data)
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',f+'.raw','-af','silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.1','-ac','1','-b:a','64k',f],check=True); os.remove(f+'.raw')
  M[h(t)]=[out]; print(s,out,txt[:60],flush=True)
  json.dump(M,open(f'{V}/manifest.json','w'),indent=0)
print('chars used',chars)
