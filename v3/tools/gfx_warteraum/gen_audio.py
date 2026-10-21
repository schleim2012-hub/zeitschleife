# Warteraum-Geräusche: alles mit numpy synthetisiert (CC0, eigene Erzeugung), Musik aus CC-BY-Quelle.
# python3 gen_audio.py [pfad/zu/elevator.mp3]  -> ../../assets/warteraum/audio/*.ogg
import numpy as np, subprocess, os, sys, wave
SR=22050; R=np.random.default_rng(1021)
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.abspath(os.path.join(HERE,'../../assets/warteraum/audio')); os.makedirs(OUT,exist_ok=True)
def t(d): return np.arange(int(d*SR))/SR
def noise(d): return R.standard_normal(int(d*SR))
def band(x,lo=None,hi=None,sr=SR):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/sr); g=np.ones_like(f)
    if lo: g*=1/(1+(lo/np.maximum(f,1e-3))**4)
    if hi: g*=1/(1+(f/hi)**4)
    return np.fft.irfft(X*g,len(x))
def conv(x,h):
    n=len(x)+len(h)-1; N=1<<(n-1).bit_length(); return np.fft.irfft(np.fft.rfft(x,N)*np.fft.rfft(h,N),N)[:n]
def res(f,dec,d=None):  # Impulsantwort eines Resonators
    d=d or 0.3; tt=t(d); return np.sin(2*np.pi*f*tt)*np.exp(-tt/dec)
def env(n,a,d):  # Attack/Decay-Hüllkurve in s
    tt=np.arange(n)/SR; return np.minimum(1,tt/max(a,1e-4))*np.exp(-tt/d)
def norm(x,p=0.9): return x/(np.abs(x).max()+1e-9)*p
def loopfix(x,xf=0.25):  # nahtlose Schleife: Ende in den Anfang überblenden
    n=int(xf*SR); a=x[:n].copy(); b=x[-n:]; w=np.linspace(0,1,n); y=x[:-n].copy(); y[:n]=a*w+b*(1-w); return y
def save(name,x,q=2,sr=SR):
    x=np.clip(x,-1,1); p=f'/tmp/wr_{name}.wav'
    with wave.open(p,'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',p,'-c:a','libvorbis','-q:a',str(q),OUT+f'/{name}.ogg'],check=True); os.remove(p)
    print(name,round(len(x)/sr,2),'s',os.path.getsize(OUT+f'/{name}.ogg')//1024,'KB')
# --- Netzbrummen + Leuchtstoff-Sirren (50 Hz-Netz, 8 s exakt periodisch)
tt=t(8.0); h=sum(a*np.sin(2*np.pi*50*k*tt+R.uniform(0,6)) for k,a in [(1,0.5),(2,1.0),(3,0.35),(4,0.4),(6,0.18),(8,0.1),(10,0.06)])
buzz=band(noise(8.0),1800,5200)*0.08*(1+0.6*np.sin(2*np.pi*100*tt))
save('hum',norm(h*(1+0.04*np.sin(2*np.pi*0.25*tt))+buzz,0.6))
# --- Uhr: Tick/Tack, 4 s
x=np.zeros(int(4*SR))
for i in range(4):
    n0=int(i*SR); f=2600 if i%2==0 else 2150
    clk=conv(noise(0.004)*np.hanning(int(0.004*SR)),res(f,0.012)+0.5*res(f*1.6,0.006)+0.3*res(420,0.02))
    x[n0:n0+len(clk)]+=clk[:len(x)-n0]
save('tick',norm(x,0.7))
# --- Nummernzähler: Klappen-Klacken + Ding
def clack(f=1500,d=0.03): return conv(noise(0.003),res(f,d*0.3)+0.6*res(f*0.47,d*0.5)+0.4*res(230,0.03))
x=np.zeros(int(2.2*SR))
for i,dt in enumerate([0,0.045,0.085,0.12]):
    c=clack(1400+R.uniform(-150,150)); n0=int(dt*SR); x[n0:n0+len(c)]+=c*(0.9-0.1*i)
tt=t(1.9); ding=sum(a*np.sin(2*np.pi*988*r*tt)*np.exp(-tt/(1.1/r**0.7)) for r,a in [(1,1),(2.0,0.25),(2.76,0.35),(5.4,0.12)])
n0=int(0.25*SR); x[n0:n0+len(ding)]+=ding*0.35*np.minimum(1,tt/0.002)
save('flip',norm(x,0.8))
# --- Husten (3 Varianten): Plosiv-Start, rauschiger Formant, etwas Stimme
def cough(nb,f0,seed):
    rr=np.random.default_rng(seed); out=[]
    for b in range(nb):
        d=rr.uniform(0.18,0.3); n=int(d*SR); tt=np.arange(n)/SR
        e=np.minimum(1,tt/0.006)*np.exp(-tt/(d*0.35))
        ns=band(rr.standard_normal(n),250,2800); vo=np.sign(np.sin(2*np.pi*(f0*(1-0.3*tt/d))*tt))*0.25
        fm=conv(ns+vo,res(rr.uniform(450,650),0.004)+0.7*res(rr.uniform(1100,1500),0.003))[:n]
        out.append(fm*e*(1-0.15*b)); out.append(np.zeros(int(rr.uniform(0.08,0.16)*SR)))
    return band(np.concatenate(out),120,4000)
save('cough1',norm(cough(2,170,1),0.8)); save('cough2',norm(cough(3,130,2),0.8)); save('cough3',norm(cough(1,210,3),0.8))
# --- Seite umblättern: Papierrascheln
d=0.7; n=int(d*SR); tt=np.arange(n)/SR
am=np.exp(-((tt-0.25)/0.13)**2)+0.5*np.exp(-((tt-0.5)/0.06)**2)
cr=(R.random(n)<0.02)*R.standard_normal(n)*3
save('page',norm(band(noise(d)*am+cr*am,1500,9000)*1.0,0.7))
# --- Holz-/Lederknarzen (Stick-Slip)
def creak(d,seed,f1,f2):
    rr=np.random.default_rng(seed); n=int(d*SR); x=np.zeros(n); tt=0.0
    while tt<d:
        u=tt/d; rate=f1+(f2-f1)*u+rr.normal(0,8); tt+=1/max(20,rate); i=int(tt*SR)
        if i<n: x[i]+=rr.uniform(0.6,1.0)*np.sin(np.pi*u)
    y=conv(x,res(310,0.02)+0.7*res(780,0.012)+0.4*res(1450,0.008))[:n]
    return band(y,150,5000)
save('creak',norm(creak(0.9,5,55,120),0.6)); save('creak2',norm(creak(0.6,6,140,70),0.55))
# --- Gemurmel hinter Glas: 3 Sprecher, Glottispuls durch zufällige Vokal-Formanten, Tiefpass
def speaker(d,f0,seed):
    rr=np.random.default_rng(seed); n=int(d*SR); y=np.zeros(n); i=int(rr.uniform(0,0.5)*SR)
    V=[(730,1090),(270,2290),(300,870),(530,1840),(570,840),(440,1020),(660,1720)]
    while i<n:
        if rr.random()<0.18: i+=int(rr.uniform(0.3,1.2)*SR); continue   # Pause
        sd=rr.uniform(0.11,0.24); m=int(sd*SR); tt=np.arange(m)/SR
        f=f0*(1+0.12*np.sin(2*np.pi*rr.uniform(0.5,2)*tt+rr.uniform(0,6)))*rr.uniform(0.9,1.12)
        ph=np.cumsum(f)/SR; src=(np.mod(ph,1)<0.12).astype(float)-0.12
        F1,F2=V[rr.integers(len(V))]
        s=conv(src,res(F1,0.006,0.05)+0.6*res(F2,0.004,0.05))[:m]*np.sin(np.pi*tt/sd)**0.7
        e=min(m,n-i); y[i:i+e]+=s[:e]; i+=m+int(rr.uniform(0.0,0.06)*SR)
    return y
D=14.25; x=speaker(D,115,11)+0.8*speaker(D,205,12)+0.6*speaker(D,140,13)
x=band(x,140,850)+0.002*noise(D)
save('voices',norm(loopfix(x),0.6))
# --- Schreibmaschine: Anschläge in Schüben, Glocke + Wagenrücklauf
D=10.25; n=int(D*SR); x=np.zeros(n); tt=0.3
while tt<D-1.4:
    if R.random()<0.08: tt+=R.uniform(0.6,1.4); continue
    c=conv(noise(0.003),res(R.uniform(1800,2600),0.01)+0.8*res(R.uniform(500,700),0.02)+0.5*res(140,0.03))
    i=int(tt*SR); x[i:i+len(c)]+=c[:n-i]*R.uniform(0.7,1.0); tt+=R.uniform(0.09,0.2)
i=int((D-1.3)*SR); tb=t(0.8); x[i:i+len(tb)]+=0.25*np.sin(2*np.pi*2700*tb)*np.exp(-tb/0.25)
i=int((D-0.9)*SR); rt=band(noise(0.5),300,3000)*np.linspace(1,0.3,int(0.5*SR))*0.35; x[i:i+len(rt)]+=rt
c=clack(900,0.08); i=int((D-0.4)*SR); x[i:i+len(c)]+=c[:n-i]*1.2
save('typewriter',norm(loopfix(x,0.25),0.7))
# --- Stempel: dumpfer Schlag + Holzklack
tt=t(0.4); th=np.sin(2*np.pi*(95*np.exp(-tt*6))*tt)*np.exp(-tt/0.06)
c=clack(700,0.05); y=th*0.9; y[:len(c)]+=c[:len(y)]*0.6
save('stamp',norm(band(y,40,6000),0.8))
# --- Radio-Knistern: Rauschen + Knackser
D=6.25; n=int(D*SR); hiss=band(noise(D),800,6000)*0.05
pops=np.zeros(n); k=R.random(n)<0.0025; pops[k]=R.standard_normal(k.sum())*R.uniform(0.3,1.0,k.sum())
pops=conv(pops,res(3000,0.0008,0.005))[:n]
save('crackle',norm(loopfix(hiss+pops,0.25),0.6))
# --- Fahrstuhlmusik (CC-BY, s. CREDITS.md): mono, 16 kHz reicht für den Kleinlautsprecher
src=sys.argv[1] if len(sys.argv)>1 else '/workspace/rewind_gfx/beetlejuice/work/elevator.mp3'
if os.path.exists(src):
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',src,'-ac','1','-ar','16000','-af','highpass=f=200,lowpass=f=4500','-c:a','libvorbis','-q:a','0',OUT+'/elevator.ogg'],check=True)
    print('elevator',os.path.getsize(OUT+'/elevator.ogg')//1024,'KB')
tot=sum(os.path.getsize(OUT+'/'+f) for f in os.listdir(OUT) if f.endswith('.ogg')); print('gesamt KB',tot//1024)
