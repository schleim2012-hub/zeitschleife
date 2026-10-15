# Passanten-Gespräch 2041 vertonen (ElevenLabs), leise/gedämpft "mitgehört". Key nie ausgeben.
import json,urllib.request,subprocess,os,re,hashlib,sys
VO=json.load(open('/workspace/tts/side_voices.json'))
KEY=[l.split('=',1)[1].strip().strip('"\'') for l in open('/workspace/tts/.elevenlabs.env') if l.startswith('ELEVENLABS_API_KEY=')][0]
s=open('test/era2041_cfg.js').read(); i=s.index('lines:[')+6; j=s.index(']],',i)+2
L=re.findall(r"\['(Frau|Mann)','((?:[^'\\]|\\.)*)'\]",s[i:j]); L=[(w,t.replace("\\'","'")) for w,t in L]
who={'Frau':'beamtin','Mann':'mauertyp'}; out=[]
for k,(w,t) in enumerate(L):
  f=f'voice/era2041/passer_{k}.mp3'
  if not os.path.exists(f):
    txt=t.replace('…','...').replace('42','zweiundvierzig')
    body=json.dumps({'text':txt,'model_id':'eleven_multilingual_v2','language_code':'de','voice_settings':{'stability':0.45,'similarity_boost':0.75,'style':0.25,'use_speaker_boost':True}}).encode()
    r=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VO[who[w]]}?output_format=mp3_44100_64",body,{'xi-api-key':KEY,'Content-Type':'application/json'})
    open(f+'.raw','wb').write(urllib.request.urlopen(r,timeout=120).read())
    # mitgehört: etwas Abstand (Tiefpass, leichter Hall), leiser
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',f+'.raw','-af','silenceremove=start_periods=1:start_threshold=-50dB,highpass=f=140,lowpass=f=4200,aecho=0.8:0.5:45|90:0.22|0.12,volume=0.62,apad=pad_dur=0.15','-ac','1','-b:a','64k',f],check=True); os.remove(f+'.raw')
  print(k,w,f,len(t),flush=True)
