# Sonnen-Oase Ton: kitschige 80er-Panflöte aus dem Kofferradio (Loop) + Sonnenbank-Brummen (Loop). Alles synthetisch, keine fremden Aufnahmen.
import numpy as np, subprocess, sys
SR=44100; rng=np.random.default_rng(84)
def save(fn,x):
  x=np.clip(x/np.max(np.abs(x))*0.89,-1,1); pcm=(x*32767).astype(np.int16).tobytes()
  subprocess.run(['ffmpeg','-y','-loglevel','error','-f','s16le','-ar',str(SR),'-ac','1','-i','-','-c:a','libmp3lame','-q:a','4',fn],input=pcm,check=True)
def lp(x,fc): 
  a=np.exp(-2*np.pi*fc/SR); y=np.zeros_like(x); s=0.0
  for i in range(len(x)): s=(1-a)*x[i]+a*s; y[i]=s
  return y
def bp(x,lo,hi):
  X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); w=np.clip((f-lo)/lo*3,0,1)*np.clip((hi-f)/hi*3,0,1); return np.fft.irfft(X*w,len(x))
BPM=72; beat=60/BPM; bars=12; L=int(bars*4*beat*SR); t=np.arange(L)/SR; out=np.zeros(L)
mid=lambda n:440*2**((n-69)/12)
chords=[[57,60,64],[53,57,60],[55,59,62],[52,55,59]]*3   # Am F G Em
for b,ch in enumerate(chords):  # weiches Synth-Pad
  s=int(b*4*beat*SR); e=int((b+1)*4*beat*SR); tt=np.arange(e-s)/SR; env=np.minimum(1,tt/0.6)*np.minimum(1,(e-s-np.arange(e-s))/SR/0.5)
  for n in ch:
    for d in (-0.07,0.07): out[s:e]+=0.05*env*np.sin(2*np.pi*mid(n-12)*(1+d/100)*tt+np.sin(2*np.pi*0.3*tt))
  out[s:e]+=0.08*env*np.sin(2*np.pi*mid(ch[0]-24)*tt)
mel=[(76,1.5),(74,0.5),(72,1),(69,1),(72,2),(71,1),(67,1),(69,3),(None,1),(76,1),(77,0.5),(76,0.5),(74,1),(72,1),(74,2),(71,2),(72,1.5),(71,0.5),(69,1),(67,1),(64,3),(None,1),
     (69,1),(72,1),(76,2),(74,1),(72,0.5),(71,0.5),(69,4),(None,4)]
pos=0.0
for n,d in mel:
  if n is not None:
    s=int(pos*beat*SR); ln=int(d*beat*SR*0.98); tt=np.arange(ln)/SR; f=mid(n)
    vib=1+0.006*np.sin(2*np.pi*5.2*tt)*np.minimum(1,tt/0.35)
    ph=2*np.pi*np.cumsum(f*vib)/SR; env=np.minimum(1,tt/0.09)*np.exp(-tt*0.35)*np.minimum(1,(ln-np.arange(ln))/SR/0.12)
    tone=np.sin(ph)+0.18*np.sin(2*ph)+0.06*np.sin(3*ph)
    br=bp(rng.standard_normal(ln),f*0.8,f*2.6)*0.25*(0.5+0.5*np.exp(-tt*6))
    if s+ln<=L: out[s:s+ln]+=0.32*env*(tone+br)
  pos+=d
# Hall (einfach): Kammfilter
r=out.copy()
for dl,g in ((0.113,0.32),(0.167,0.25),(0.241,0.18),(0.333,0.12)): k=int(dl*SR); r[k:]+=g*out[:-k]
x=bp(r,320,3400); x=np.tanh(x/np.max(np.abs(x))*1.8)          # Kofferradio
crk=np.zeros(L); idx=rng.integers(0,L,260); crk[idx]=rng.uniform(-1,1,260)*0.5
x=x+0.02*bp(rng.standard_normal(L),1500,6000)+bp(crk,800,5000)*0.6
x*=1+0.04*np.sin(2*np.pi*0.17*t)   # leichtes Schwanken
fade=int(0.03*SR); x[:fade]*=np.linspace(0,1,fade); x[-fade:]*=np.linspace(1,0,fade)
save(sys.argv[1]+'radio_panfloete.mp3',x)
# Sonnenbank: 100-Hz-Brummen + Drossel-Sirren + Lüfter
L=int(12*SR); t=np.arange(L)/SR
h=0.35*np.sin(2*np.pi*100*t)+0.15*np.sin(2*np.pi*200*t)+0.06*np.sin(2*np.pi*300*t)+0.03*np.sin(2*np.pi*1200*t)*(0.6+0.4*np.sin(2*np.pi*0.5*t))
fan=bp(rng.standard_normal(L),180,1400)*0.35*(1+0.08*np.sin(2*np.pi*23*t))
x=h+fan; x=np.concatenate([x[:L//2]*np.linspace(0,1,L//2)+x[L//2:]*np.linspace(1,0,L//2)]) # nahtlos
save(sys.argv[1]+'sonnenbank_brumm.mp3',x)
print('ok')
