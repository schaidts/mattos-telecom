#!/usr/bin/env python3
"""Monta Brasil_Football_Career_3.0.html a partir de src/ (arquivo único, offline)."""
import base64,os
D=os.path.dirname(os.path.abspath(__file__));R=lambda p:open(os.path.join(D,'src',p),encoding='utf-8').read()
bahia=base64.b64encode(open(os.path.join(D,'src','bahia.jpg'),'rb').read()).decode()
js=[R('img.js').strip(),"IMG[1]='data:image/jpeg;base64,%s';BGC[1]='#1b1e25';"%bahia]+[R(f) for f in ['core.js','sprites.js','stadium.js','match.js','ui.js']]
out=R('head.html')+'\n'+'\n'.join(js)+'\n</script></body></html>\n'
open(os.path.join(D,'Brasil_Football_Career_3.0.html'),'w',encoding='utf-8').write(out);print(len(out))
