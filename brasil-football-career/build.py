#!/usr/bin/env python3
"""Monta Brasil_Football_Career_3.0.html a partir de src/ (arquivo único, offline)."""
import base64,os
D=os.path.dirname(os.path.abspath(__file__));R=lambda p:open(os.path.join(D,'src',p),encoding='utf-8').read()
bahia=base64.b64encode(open(os.path.join(D,'src','bahia.jpg'),'rb').read()).decode()
BG={1:'#1b1e25',4:'#191d20',6:'#191919',7:'#1c1c1c',8:'#1c1c1c',9:'#1d1d1d',10:'#1a1a1a',11:'#151515',12:'#191919'}
fl={1:bahia}
for f in sorted(os.listdir(os.path.join(D,'src','flags'))):fl[int(f.split('.')[0])]=base64.b64encode(open(os.path.join(D,'src','flags',f),'rb').read()).decode()
js=[R('img.js').strip()]+["IMG[%d]='data:image/jpeg;base64,%s';BGC[%d]='%s';"%(k,v,k,BG[k]) for k,v in sorted(fl.items())]+[R(f) for f in ['core.js','sprites.js','stadium.js','career.js','match.js','ui.js']]
out=R('head.html')+'\n'+'\n'.join(js)+'\n</script></body></html>\n'
open(os.path.join(D,'Brasil_Football_Career_3.0.html'),'w',encoding='utf-8').write(out);print(len(out))
