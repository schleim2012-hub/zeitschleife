# Eigene prozedurale SFX (jsfxr-Stil, numpy) -> sfx/*.mp3. Keine Fremd-Samples.
import numpy as np, subprocess, wave, os
SR=44100; rng=np.random.default_rng(7); OUT=os.path.join(os.path.dirname(__file__),'..','sfx')
def t(d): return np.arange(int(SR*d))/SR
def env(n,a=0.005,r=None,d=None):
  x=np.ones(n); na=max(1,int(a*SR)); x[:na]=np.linspace(0,1,na)
  if r: x*=np.exp(-np.arange(n)/SR/r)
  return x
def lp(x,fc):  # 1-pole lowpass, fc kann Array sein
  a=np.exp(-2*np.pi*np.asarray(fc)/SR)*np.ones(len(x)); y=np.zeros_like(x); s=0.
  for i in range(len(x)): s=(1-a[i])*x[i]+a[i]*s; y[i]=s
  return y
def hp(x,fc): return x-lp(x,fc)
def noise(d): return rng.uniform(-1,1,int(SR*d))
def sweep(f0,f1,d,w='sin'):
  f=np.geomspace(f0,f1,int(SR*d)); ph=2*np.pi*np.cumsum(f)/SR
  return {'sin':np.sin(ph),'sq':np.sign(np.sin(ph)),'tri':2/np.pi*np.arcsin(np.sin(ph))}[w]
def save(n,x,loop=False):
  x=x/ (np.max(np.abs(x))+1e-9)*0.85
  if loop: k=int(0.3*SR); x[:k]=x[:k]*np.linspace(0,1,k)+x[-k:]*np.linspace(1,0,k); x=x[:-k]
  w=f'/tmp/{n}.wav'; f=wave.open(w,'wb'); f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((x*32767).astype('<i2').tobytes()); f.close()
  subprocess.run(['ffmpeg','-loglevel','error','-y','-i',w,'-b:a','64k' if loop else '48k',f'{OUT}/{n}.mp3'],check=True)
S={}
d=.12; S['pickup']=sweep(500,1400,d,'tri')*env(int(SR*d),r=.05)+0.3*lp(noise(d),3000)*env(int(SR*d),r=.02)
d=.25; S['drop']=lp(noise(d),600)*env(int(SR*d),r=.04)+np.sin(2*np.pi*90*t(d))*env(int(SR*d),r=.06)
d=.35; S['throw']=lp(noise(d),np.linspace(400,2500,int(SR*d)))*np.sin(np.pi*t(d)/d)
d=.6; x=sum(np.sin(2*np.pi*f*t(d))*np.exp(-t(d)/(.3/k)) for k,f in enumerate([523,1187,1860,2730],1)); S['trash_hit']=x+0.4*lp(noise(d),4000)*env(int(SR*d),r=.02)
d=.18; S['bounce']=lp(noise(d),900)*env(int(SR*d),r=.025)+0.6*sweep(220,120,d)*env(int(SR*d),r=.05)
d=.22; S['inv_open']=lp(noise(d),np.linspace(800,5000,int(SR*d)))*env(int(SR*d),a=.03,r=.08)+0.4*sweep(300,600,d,'tri')*env(int(SR*d),r=.06)
d=.22; S['inv_close']=lp(noise(d),np.linspace(5000,800,int(SR*d)))*env(int(SR*d),a=.01,r=.06)+0.4*sweep(600,300,d,'tri')*env(int(SR*d),r=.06)
d=.03; S['ui_hover']=np.sin(2*np.pi*2400*t(d))*env(int(SR*d),a=.001,r=.008)
d=.06; S['ui_click']=np.sign(np.sin(2*np.pi*900*t(d)))*env(int(SR*d),a=.001,r=.012)*0.5+np.sin(2*np.pi*1800*t(d))*env(int(SR*d),r=.01)
d=.5; f=320*(1+0.5*np.sin(2*np.pi*14*t(d))*np.exp(-t(d)*4)); S['slinky_boing']=np.sin(2*np.pi*np.cumsum(f)/SR)*env(int(SR*d),r=.18)
d=.22; S['slinky_hop']=np.concatenate([sum(np.sin(2*np.pi*(1200+300*k)*t(.02))*env(int(SR*.02),a=.001,r=.006) for k in range(3)) for _ in range(5)])[:int(SR*d)]*0.6
d=.08; S['clock_click']=hp(noise(d),2000)*env(int(SR*d),a=.0005,r=.006)+np.sin(2*np.pi*3200*t(d))*env(int(SR*d),r=.004)
d=.8; S['radio_static']=hp(noise(d),800)*(0.6+0.4*np.sin(2*np.pi*7*t(d)))*env(int(SR*d),a=.05,r=.5)
for i in range(3):
  d=.16; x=lp(noise(d),500+150*i)*env(int(SR*d),a=.004,r=.03)+0.5*lp(noise(d),3000)*env(int(SR*d),a=.03,r=.04); S[f'step_carpet{i}']=x
  d=.14; S[f'step_street{i}']=hp(noise(d),900+200*i)*env(int(SR*d),a=.002,r=.02)+0.6*lp(noise(d),300)*env(int(SR*d),r=.03)
d=.4; S['coin']=(np.sin(2*np.pi*1975*t(d))+.6*np.sin(2*np.pi*2637*t(d)))*env(int(SR*d),r=.12)
d=.35; S['paper']=hp(noise(d),2500)*np.abs(np.sin(2*np.pi*9*t(d)))*env(int(SR*d),a=.02,r=.15)
d=.3; S['error']=np.sign(np.sin(2*np.pi*110*t(d)))*lp(np.ones(int(SR*d)),50)*env(int(SR*d),r=.15)*0.5
d=.9; S['bonus']=sum(np.sin(2*np.pi*f*t(d))*np.clip((t(d)-k*.09)*40,0,1)*np.exp(-np.clip(t(d)-k*.09,0,None)/.3) for k,f in enumerate([784,988,1175,1568]))
d=.5; S['penalty']=sweep(500,140,d,'tri')*env(int(SR*d),r=.2)
d=.5; S['glitch']=np.sign(np.sin(2*np.pi*np.cumsum(60+rng.integers(0,4,int(SR*d))*180)/SR))*0.3*env(int(SR*d),a=.01,r=.2)+0.3*hp(noise(d),3000)*(rng.random(int(SR*d))>.97)
d=1.2; S['whoosh']=lp(noise(d),np.geomspace(200,4000,int(SR*d)))*np.sin(np.pi*t(d)/d)**2
d=.5; S['banana']=lp(noise(d),700)*env(int(SR*d),r=.05)*0.6+sweep(180,90,d)*env(int(SR*d),r=.08)
d=.25; S['zip']=hp(noise(d),1500)*(np.sin(2*np.pi*55*t(d))>0)*env(int(SR*d),r=.12)
# Ambience (Loops)
d=12; hum=sum(np.sin(2*np.pi*f*t(d))/k for k,f in enumerate([100,200,300,120],1)); buzz=hp(noise(d),4000)*0.05*(1+np.sin(2*np.pi*.37*t(d)))
flick=np.ones(int(SR*d)); 
for s0 in (2.3,7.8,8.1): i=int(s0*SR); flick[i:i+int(.08*SR)]=0.2
save('amb_backrooms',(hum*0.15+buzz)*flick,True)
d=14; crowd=lp(noise(d),np.ones(int(SR*d))*700)*(0.7+0.3*lp(rng.uniform(-1,1,int(SR*d)),4))
crowd=crowd+0.4*lp(hp(noise(d),300),1800)*(lp(rng.uniform(0,1,int(SR*d)),6)*4)
for s0 in (3.1,9.4): i=int(s0*SR); n=int(1.6*SR); crowd[i:i+n]+=0.6*lp(hp(noise(1.6),500),2500)*np.sin(np.pi*np.arange(n)/n)
save('amb_1989',crowd,True)
for k,v in S.items(): save(k,v)
print(len(S)+2,'sfx')
