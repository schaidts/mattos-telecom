/* ================= 9. ESTÁDIOS, GRAMADO E ILUMINAÇÃO =================
   Canvas 720x500: arquibancada (0-64), campo (64-464 = mundo 0-400), pista/bancos (464-500). */
const W=720,H=500,OY=64;
const ADS=[['CAFÉ SERRA','#5b3a1e','#ffd9a0'],['AÇAÍ PRO','#4b1d6b','#e7c6ff'],['BANCO PIXEL','#0d3b8c','#ffd400'],['GUARANÁ GOL','#0b6b2e','#ffffff'],['TV BOLA','#b3122e','#ffffff'],['RÁDIO ARENA','#111','#3ddc84'],['PNEUS RAIO','#ff9f1c','#111'],['SUCO DO VALE','#e8f3ff','#0d3b8c']];
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function adStrip(){const c=mkCanvas(960,11),x=c.getContext('2d');ADS.forEach((a,i)=>{x.fillStyle=a[1];x.fillRect(i*120,0,120,11);x.fillStyle=a[2];x.font='7px "Press Start 2P",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(a[0],i*120+60,6);x.fillStyle='#0004';x.fillRect(i*120+119,0,1,11)});x.fillStyle='#ffffff22';x.fillRect(0,0,960,2);return c}
function buildStadium(E,hc,ac){const r=rng(hash('st'+E.model+hc)),bg=mkCanvas(W,H),x=bg.getContext('2d'),fg=mkCanvas(W,H),y=fg.getContext('2d');
 const night=E.night,sky=night?['#050a1a','#101b38']:E.tarde?['#f59a54','#ffd29a']:['#5fb4ff','#bfe6ff'];
 // ---- fundo da arquibancada
 const gs=x.createLinearGradient(0,0,0,64);gs.addColorStop(0,sky[0]);gs.addColorStop(1,sky[1]);x.fillStyle=gs;x.fillRect(0,0,W,64);
 if(E.model===2){ // campo de base: árvores, muro e arquibancada de madeira
  if(night)for(let i=0;i<50;i++){x.fillStyle=r()>.5?'#fff':'#789';x.fillRect(r()*W,r()*30,1,1)}
  for(let i=0;i<28;i++){const tx=i*27+r()*10,th=14+r()*12;x.fillStyle=night?'#0a1a12':E.tarde?'#3c4a22':'#2f6b34';x.beginPath();x.arc(tx,40-th/2,th/1.6,0,7);x.fill()}
  x.fillStyle=night?'#2b2b33':'#c9c0a8';x.fillRect(0,36,W,28);x.fillStyle='#0002';for(let i=0;i<W;i+=24)x.fillRect(i,36,1,28);
  for(let s=0;s<3;s++){const bx=90+s*220;for(let row=0;row<3;row++){x.fillStyle=row%2?'#8a5a2b':'#a06a36';x.fillRect(bx,40+row*8,150,6);x.fillStyle='#5a3a1b';x.fillRect(bx,46+row*8,150,2)}x.fillStyle='#4a2f15';x.fillRect(bx,40,3,24);x.fillRect(bx+147,40,3,24)}
 }else if(E.model===1){ // estádio clássico: concreto
  x.fillStyle=night?'#2a2e36':'#80868f';x.fillRect(0,8,W,56);
  for(let row=0;row<7;row++){x.fillStyle=row%2?(night?'#30353e':'#8c929b'):(night?'#262a31':'#737982');x.fillRect(0,10+row*8,W,8);x.fillStyle='#0003';x.fillRect(0,17+row*8,W,1)}
  x.fillStyle=night?'#1a1d22':'#5d636b';for(let i=0;i<W;i+=90)x.fillRect(i,8,4,56);
  x.fillStyle='#0006';x.fillRect(0,8,W,2);
 }else{ // arena moderna: anéis escuros, cobertura e telão
  x.fillStyle='#14171d';x.fillRect(0,0,W,10);x.fillStyle='#3a4150';x.fillRect(0,9,W,2);
  for(let row=0;row<7;row++){x.fillStyle=row%2?'#2b313d':'#232833';x.fillRect(0,11+row*7.5,W,7.5)}
  x.fillStyle='#0b0d12';x.fillRect(320,1,80,8);x.fillStyle='#1f3a6a';x.fillRect(322,2,76,6);
  x.fillStyle='#ffffff10';for(let i=0;i<W;i+=6)x.fillRect(i,0,1,9);
 }
 // ---- gramado
 const g1=E.rain?'#246c3c':'#2c7a46',g2=E.rain?'#2a7845':'#338a51';
 x.fillStyle=E.rain?'#1e5a32':'#246a3b';x.fillRect(0,OY,W,400);
 for(let i=0;i<16;i++){x.fillStyle=i%2?g1:g2;x.fillRect(i*45,OY+8,45,384)}
 for(let i=0;i<16;i++)for(let j=0;j<8;j++)if((i+j)%2){x.fillStyle='#ffffff08';x.fillRect(i*45,OY+8+j*48,45,48)}
 for(let i=0;i<(LQ?900:2200);i++){x.fillStyle=r()>.5?'#ffffff0c':'#0000001c';x.fillRect(r()*W,OY+r()*400,r()>.8?2:1,2)}
 if(E.model===2)for(let i=0;i<60;i++){x.fillStyle='#8a6a3a33';x.beginPath();x.ellipse(lerp(40,680,r()),OY+lerp(20,380,r()),4+r()*10,2+r()*4,0,0,7);x.fill()} // campo gasto
 x.fillStyle='#8a6a3a2a';x.beginPath();x.ellipse(40,OY+200,26,40,0,0,7);x.fill();x.beginPath();x.ellipse(680,OY+200,26,40,0,0,7);x.fill();
 if(E.rain){x.fillStyle='#bfe6ff10';for(let i=0;i<40;i++){x.beginPath();x.ellipse(r()*W,OY+r()*400,8+r()*20,2+r()*4,0,0,7);x.fill()}}
 // ---- linhas
 x.save();x.translate(0,OY);x.strokeStyle='#f1f8ec';x.lineWidth=2;x.lineCap='square';
 const ln=(a,b,c,d)=>{x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.stroke()};
 x.strokeRect(18,18,684,364);ln(360,18,360,382);x.beginPath();x.arc(360,200,55,0,7);x.stroke();
 for(const s of[0,1]){const X0=s?702:18,d=s?-1:1;x.strokeRect(s?612:18,110,90,180);x.strokeRect(s?672:18,158,30,84);
  x.beginPath();x.arc(X0+d*60,200,46,s?Math.PI-.93:-.93+0,s?Math.PI+.93:.93);x.stroke();x.fillStyle='#f1f8ec';x.fillRect(X0+d*60-2,198,4,4)}
 for(const[cx,cy,a]of[[18,18,0],[702,18,Math.PI/2],[702,382,Math.PI],[18,382,-Math.PI/2]]){x.beginPath();x.arc(cx,cy,8,a,a+Math.PI/2);x.stroke()}
 x.fillStyle='#f1f8ec';x.fillRect(358,198,4,4);x.restore();
 // ---- pista e bancos
 x.fillStyle=E.model===2?'#3a5a2a':E.model===1?'#7a3b2e':'#2a2f3a';x.fillRect(0,464,W,36);
 if(E.model!==2){x.fillStyle='#ffffff22';for(let i=0;i<3;i++)x.fillRect(0,478+i*7,W,1)}
 for(const bx of[240,400]){x.fillStyle='#0b1622';x.fillRect(bx,476,80,22);x.fillStyle='#6fa8dc55';x.fillRect(bx,474,80,4);
  for(let i=0;i<7;i++){const s=SKIN[(r()*6)|0][0];x.fillStyle=s;x.fillRect(bx+6+i*10,484,4,4);x.fillStyle=bx<360?CL[hc].k.a:CL[ac].k.a;x.fillRect(bx+5+i*10,488,6,6)}}
 for(const px of[40,70,640,670]){x.fillStyle='#222';x.fillRect(px,488,6,8);x.fillStyle=SKIN[(r()*6)|0][0];x.fillRect(px+1,484,4,4);x.fillStyle='#111';x.fillRect(px+4,488,5,3)}
 // ---- camada frontal: refletores e alambrado
 const towers=[[8,2],[704,2],[8,470],[704,470]];
 if(E.model!==2||night){for(const[tx,ty]of towers){const top=ty<100;y.fillStyle='#3a4150';y.fillRect(tx+4,top?ty+12:ty-6,3,top?50:30);y.fillStyle='#20242c';y.fillRect(tx-2,top?ty:ty+16,16,10);
  y.fillStyle=night?'#fff8d0':'#c7ccd6';for(let i=0;i<3;i++)for(let j=0;j<2;j++)y.fillRect(tx+i*5-1,(top?ty:ty+16)+1+j*4,4,3)}}
 if(E.model===1){y.fillStyle='#c9d0d855';for(let i=0;i<W;i+=4)y.fillRect(i,40,1,14);y.fillRect(0,40,W,1)}
 // ---- iluminação (multiply + brilho aditivo)
 let mul=null,add=null,lights=null;
 if(night||E.tarde||E.rain){mul=mkCanvas(W,H);const m=mul.getContext('2d');m.fillStyle=night?'#3a4870':E.tarde?'#ffcf9a':'#9aa4b0';m.fillRect(0,0,W,H);
  if(night){m.globalCompositeOperation='lighter';for(const[tx,ty]of towers){const gr=m.createRadialGradient(tx+6,ty+6,10,tx+6,ty+6,560);gr.addColorStop(0,'rgba(210,205,170,.85)');gr.addColorStop(1,'rgba(210,205,170,0)');m.fillStyle=gr;m.fillRect(0,0,W,H)}
   add=mkCanvas(W,H);const a=add.getContext('2d');for(const[tx,ty]of towers){const gr=a.createRadialGradient(tx+6,ty+6,0,tx+6,ty+6,60);gr.addColorStop(0,'rgba(255,250,210,.7)');gr.addColorStop(1,'rgba(255,250,210,0)');a.fillStyle=gr;a.fillRect(tx-60,ty-60,130,130)}
   lights=towers.map(([tx,ty])=>[tx+6,ty+6-OY])}
  if(E.tarde){const gr=m.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#ffffff55');gr.addColorStop(1,'#0000');m.globalCompositeOperation='source-over';m.fillStyle=gr;m.fillRect(0,0,W,H)}}
 // ---- torcida
 const fans=[],rows=E.model===2?[42,50,58]:E.model===1?[16,24,32,40,48,56]:[15,22,30,37,45,52],den=E.dens*(E.model===2?.55:1)*(LQ?.6:1);
 const tc=(side)=>{const k=CL[side?ac:hc].k;const v=r();return v<.45?k.a:v<.75?k.b:v<.85?(k.c2||k.sh):pickR(['#eee','#333','#777','#c33','#26c'],r)};
 for(const fy of rows)for(let fx=4;fx<W;fx+=7){if(E.model===2&&!((fx>90&&fx<240)||(fx>310&&fx<460)||(fx>530&&fx<680)))continue;if(r()>den)continue;
  const away=E.home?fx>580:fx>140;fans.push({x:fx+((r()*3)|0),y:fy,s:away?1:0,c:tc(away?1:0),k:SKIN[(r()*6)|0][0],ph:r()*7})}
 const flags=[];for(let i=0;i<(E.model===2?3:6);i++){const fx=E.model===2?165+i*220:70+i*118,away=E.home?fx>580:fx>140,k=CL[away?ac:hc].k;flags.push({x:fx,y:E.model===2?40:12,a:k.a,b:k.b,ph:r()*6,s:away?1:0})}
 return{bg,fg,mul,add,lights,fans,flags,ads:adStrip(),led:E.model===0,rain:E.rain?Array.from({length:LQ?50:110},()=>({x:RN()*W,y:RN()*H,s:300+RN()*200})):null}}
function drawCrowd(x,st,t,cx,boo,wave){for(const f of st.fans){const e=cx[f.s],b=boo[f.s];let dy=0,up=0;
  if(e>.05){dy=-Math.abs(Math.sin(t*9+f.ph))*4*e;up=e>.35}else if(b>.05){dy=Math.sin(t*20+f.ph)>.5?1:0}else dy=Math.sin(t*1.6+f.ph)>.93?-1:0;
  if(wave!=null){const w=1-Math.abs(f.x-wave)/36;if(w>0){dy-=4*w;up=up||w>.4}}
  x.fillStyle=f.c;x.fillRect(f.x-2,f.y+dy,5,5);x.fillStyle=f.k;x.fillRect(f.x-1,f.y-3+dy,3,3);
  if(up){x.fillRect(f.x-3,f.y-4+dy,1,3);x.fillRect(f.x+3,f.y-4+dy,1,3)}else if(b>.3){x.fillRect(f.x-2,f.y-4+dy,1,2);x.fillRect(f.x+2,f.y-4+dy,1,2)}}
 for(const fl of st.flags){x.fillStyle='#ddd';x.fillRect(fl.x,fl.y,1,26);const amp=1+cx[fl.s]*3;
  for(let i=0;i<9;i++){const yy=fl.y+Math.sin(t*6+fl.ph+i*.6)*amp*(i/9);x.fillStyle=i%3===1?fl.b:fl.a;x.fillRect(fl.x+1+i*2,yy,2,12)}}}
function drawAds(x,st,t){const o=st.led?(t*40)%960:0,a=st.ads;for(const yy of[53,465]){for(let k=-1;k<2;k++)x.drawImage(a,k*960-o,yy);x.fillStyle='#0006';x.fillRect(0,yy+11,W,1)}}
/* ---- traves e redes (mundo) */
function drawGoal(x,side,net,part){const fx=side?702:18,bx=side?715:5,d=side?1:-1,GH=17,BH=10,y0=166,y1=234,t=net.t,amp=net.a*Math.exp(-t*3)*Math.sin(t*26);
 const disp=yy=>amp*Math.exp(-Math.pow((yy-net.y)/16,2))*d;
 if(part==='back'){x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=1;x.beginPath();
  for(let yy=y0;yy<=y1;yy+=6){const dd=disp(yy);x.moveTo(fx,yy-GH);x.lineTo(bx+dd,yy-BH);x.lineTo(bx+dd*.6,yy)}
  for(let h=0;h<=BH;h+=3){x.moveTo(bx+disp(y0),y0-h);for(let yy=y0;yy<=y1;yy+=6)x.lineTo(bx+disp(yy)*(1-h/BH/2),yy-h)}
  for(let i=0;i<=4;i++){const xx=lerp(fx,bx,i/4);x.moveTo(xx,y0-lerp(GH,BH,i/4));x.lineTo(xx,y0);x.moveTo(xx,y0-lerp(GH,BH,i/4));x.lineTo(xx+disp(200)*i/4,y1-lerp(GH,BH,i/4))}
  x.stroke();x.fillStyle='#f4f4f4';x.fillRect(fx-1,y0-GH,3,GH);x.fillRect(fx-1,y0-GH-1,3,y1-y0+2);x.fillStyle='#0003';x.fillRect(fx+(side?-1:2),y0-GH,1,y1-y0)}
 else{x.fillStyle='#f4f4f4';x.fillRect(fx-1,y1-GH,3,GH+1);x.fillStyle='#bbb';x.fillRect(fx+1,y1-GH,1,GH+1)}}
function drawCorner(x,t){for(const[cx,cy]of[[18,18],[702,18],[18,382],[702,382]]){x.fillStyle='#ddd';x.fillRect(cx,cy-12,1,12);for(let i=0;i<4;i++){x.fillStyle=i%2?'#ffd400':'#ff5a00';x.fillRect(cx+1+i*1.5,cy-12+Math.sin(t*7+i*.8+cx)*1.2,1.5,5)}}}
/* ---- bola */
function drawBall(x,b,t){const z=b.z||0,s=1-Math.min(.5,z/60);x.fillStyle=`rgba(0,0,0,${.35*s})`;x.beginPath();x.ellipse(b.x+1+z*.15,b.y+3,4.5*s,2*s,0,0,7);x.fill();
 const X=Math.round(b.x),Y=Math.round(b.y-z);
 if(b.tr&&b.tr.length>1){for(let i=0;i<b.tr.length;i++){const q=b.tr[i],a=i/b.tr.length;x.globalAlpha=a*.55;x.fillStyle=b.hot?(i%2?'#ffd400':'#fff'):'#fff';const r=1+a*2.5;x.fillRect(q[0]-r,q[1]-r,r*2,r*2)}x.globalAlpha=1}
 x.fillStyle='#111';x.fillRect(X-4,Y-3,8,6);x.fillRect(X-3,Y-4,6,8);x.fillStyle='#fafafa';x.fillRect(X-3,Y-3,6,6);x.fillRect(X-2,Y-4,4,1);x.fillRect(X-2,Y+3,4,1);x.fillRect(X-4,Y-2,1,4);x.fillRect(X+3,Y-2,1,4);
 const a=b.rot||0;x.fillStyle='#222';x.fillRect(X+Math.round(Math.cos(a)*1.6)-1,Y+Math.round(Math.sin(a)*1.6)-1,2,2);x.fillRect(X+Math.round(Math.cos(a+2.3)*2.4)-1,Y+Math.round(Math.sin(a+2.3)*2)-1,2,1);x.fillStyle='#fff';x.fillRect(X-2,Y-3,1,1)}
/* ---- partículas e efeitos */
const FX={p:[],r:[],add(o){if(this.p.length<(LQ?120:260))this.p.push(o)},
 burst(xx,yy,n,kind,pw=1){for(let i=0;i<n;i++){const a=RN()*Math.PI*2,v=(30+RN()*90)*pw;
  if(kind==='grass')this.add({x:xx,y:yy,z:0,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.5,vz:60+RN()*90*pw,l:.6+RN()*.4,c:pickR(['#3fa85f','#2c7a46','#6fcf7f','#8a6a3a']),s:2});
  else if(kind==='dust')this.add({x:xx,y:yy,z:2,vx:Math.cos(a)*v*.5,vy:Math.sin(a)*v*.25,vz:10+RN()*20,l:.5+RN()*.4,c:'rgba(190,160,110,.6)',s:3,dr:1});
  else if(kind==='spark')this.add({x:xx,y:yy,z:6,vx:Math.cos(a)*v*1.6,vy:Math.sin(a)*v*.8,vz:Math.sin(a)*v,l:.25+RN()*.2,c:pickR(['#fff','#ffd400','#fff1a0']),s:2,ng:1});
  else if(kind==='conf')this.add({x:xx+(RN()-.5)*60,y:yy+(RN()-.5)*30,z:40+RN()*80,vx:(RN()-.5)*60,vy:(RN()-.5)*30,vz:20+RN()*40,l:2+RN(),c:pickR(['#ffd400','#fff','#3ddc84','#3b7bff','#ff5a5f']),s:2,fl:1});
  else if(kind==='splash')this.add({x:xx,y:yy,z:0,vx:Math.cos(a)*v*.4,vy:Math.sin(a)*v*.2,vz:30+RN()*40,l:.4,c:'#cfe8ff',s:1})}},
 ring(xx,yy,c='#fff',vr=180,l=.35){this.r.push({x:xx,y:yy,r:3,vr,l,ml:l,c})},
 upd(dt){for(const q of this.p){q.l-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;if(!q.ng)q.vz-=(q.fl?40:300)*dt;if(q.z<0){q.z=0;q.vz*=-.3;q.vx*=.6;q.vy*=.6}if(q.fl){q.vx*=.98}}this.p=this.p.filter(q=>q.l>0);
  for(const q of this.r){q.l-=dt;q.r+=q.vr*dt}this.r=this.r.filter(q=>q.l>0)},
 draw(x){for(const q of this.p){x.globalAlpha=Math.min(1,q.l*3);x.fillStyle=q.c;const s=q.fl?(Math.sin(q.l*20)>0?2:1):q.s;x.fillRect(Math.round(q.x),Math.round(q.y-q.z),q.fl?2:s,s)}
  for(const q of this.r){x.globalAlpha=q.l/q.ml;x.strokeStyle=q.c;x.lineWidth=2;x.beginPath();x.ellipse(q.x,q.y,q.r,q.r*.55,0,0,7);x.stroke()}x.globalAlpha=1},
 clear(){this.p=[];this.r=[]}};
function speedLines(x,p){const f=p.f||1;x.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<3;i++){const l=8+((performance.now()/40+i*3)%8);x.fillRect(p.x-f*(10+l)-(f<0?0:0),p.y-8-i*8,l,1)}}
