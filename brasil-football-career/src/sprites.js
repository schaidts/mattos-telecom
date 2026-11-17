/* ================= 6. APARÊNCIA DOS JOGADORES ================= */
const SKIN=[['#f6d7bb','#dcae8c'],['#e9bb92','#c9946a'],['#cf9466','#ad7246'],['#a86b40','#87512c'],['#7c4a2a','#5e3720'],['#5a3520','#3f2516']];
const HAIRC=['#16100d','#2c1b10','#4e2e17','#7d4b22','#c8963e','#ead57e','#a33b1f','#d6d6d6'];
const HAIRS=['Curto','Raspado','Black power','Cacheado','Longo','Moicano','Careca','Dreads','Topete'];
const BOOTS=['#151515','#f5f5f5','#ff3b6b','#39ff14','#ffb000','#2a7fff','#f5f5f5','#151515','#ffcf33'];
function lookOf(seed){const r=rng(hash(seed)),sk=(r()*6)|0;
 const hc=sk>=3?pickR([0,0,1,1,2,7,4],r):pickR([0,1,2,3,4,5,6,1],r);
 const hs=sk>=3?pickR([0,1,2,3,6,7,5,1],r):pickR([0,1,4,8,3,5,6,0],r);
 return{sk,hs,hc,bd:pickR([0,1,1,1,2],r),br:r()<.3?(r()<.5?1:2):0,bt:(r()*BOOTS.length)|0,hb:r()<.1?1:0,sl:r()<.15?1:0}}
const userLook=()=>{const l=lookOf('u'+S.name);if(S.look){l.sk=S.look.sk;l.hs=S.look.hs;l.hc=S.look.hc}const bo=(S.inv&&S.inv.boot)|0;if(bo)l.bt=bo===2?8:3;return l};
/* Uniformes */
function kitOf(ci,vs){const k={...CL[ci].k,c2:CL[ci].k.c2||CL[ci].k.b};
 if(vs!=null&&cdist(k.a,CL[vs].k.a)<110){ // conflito: segundo uniforme
  const dark=lum(k.a)<128;Object.assign(k,{p:'plain',a:dark?'#f2f2f2':shade(k.a,.35),b:dark?CL[ci].k.a:'#f2f2f2',sh:dark?'#f2f2f2':shade(k.a,.35),so:dark?'#f2f2f2':shade(k.a,.35)});
  if(cdist(k.a,CL[vs].k.a)<110)Object.assign(k,{a:'#ffcf33',b:'#1b3a8a',sh:'#1b3a8a',so:'#ffcf33'})}
 k.nm=lum(k.a)>150?'#151515':'#ffffff';k.gk=GKC[ci%GKC.length];if(vs!=null&&k.gk===GKC[vs%GKC.length])k.gk=GKC[(ci+3)%GKC.length];return k}
const DIG=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001010010010','111101111101111','111101111001111'];
function digits(x,n,X,Y,col,s=1){const t=String(n);let w=t.length*4-1,ox=X-Math.floor(w*s/2);x.fillStyle=col;
 for(const ch of t){const d=DIG[+ch];for(let i=0;i<15;i++)if(d[i]==='1')x.fillRect(ox+(i%3)*s,Y+((i/3)|0)*s,s,s);ox+=4*s}}

/* ================= 7. SPRITE EM CAMPO (pixel art, 1 unidade = 2px) =================
   Esqueleto paramétrico: quadril, ombro, pés e mãos por pose; joelhos/cotovelos por IK.
   Coordenadas em unidades, +x = frente, y negativo = para cima. */
const U=2;
function ik(ax,ay,bx,by,L,dir){let dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy)||.001;if(d>L){bx=ax+dx/d*L;by=ay+dy/d*L;d=L}
 const h=Math.sqrt(Math.max(0,L*L/4-d*d/4)),mx=(ax+bx)/2,my=(ay+by)/2;let nx=-dy/d,ny=dx/d;if(nx*dir<0){nx=-nx;ny=-ny}return[mx+nx*h,my+ny*h,bx,by]}
function pose(p,t){const v=p.v||0,ph=p.rp||0,o={hx:0,hy:-5,ln:0,F1:[-1.2,0],F2:[1.2,0],H1:[-1.4,-7],H2:[1.4,-7],rot:0,z:0,ex:0,hd:0,bob:0};
 const run=(A,lean)=>{const s=Math.sin(ph),c=Math.cos(ph);o.F2=[s*A,-Math.max(0,-c)*A*.8];o.F1=[-s*A,-Math.max(0,c)*A*.8];o.H2=[-s*A*.75+.6,-7.6];o.H1=[s*A*.75-.6,-7.6];o.hy=-5-Math.abs(c)*.5;o.ln=lean};
 switch(p.cur){
 case 'idle':o.bob=Math.sin(t*3+p.ph)>.4?1:0;break;
 case 'walk':run(1.6,.2);break;
 case 'run':run(2.6,.6);break;
 case 'sprint':run(3.4,1.2);o.H2[1]=-8.5;o.H1[1]=-6.5;break;
 case 'dribble':run(2.2,.8);o.hx=Math.sin(t*13)*.8;break;
 case 'gkready':o.hy=-4;o.F1=[-2.2,0];o.F2=[2,0];o.H1=[2,-9];o.H2=[3.2,-9.5];o.z=Math.abs(Math.sin(t*9))*1.5;break;
 case 'guard':o.hy=-4.4;o.F1=[-2.2,0];o.F2=[1.6,0];o.H1=[-2.4,-8];o.H2=[2.6,-8.2];o.ln=.5;o.hx=Math.sin(t*7)*.5;break;
 case 'windup':{const e=eo(t/.3);o.F1=[1,0];o.F2=[-3*e,-2.8*e];o.ln=-.6*e;o.H1=[-3,-9];o.H2=[3,-10];o.ex=3;break}
 case 'kick':{const e=eo(t/.12);o.F1=[1,0];o.F2=[lerp(-3,4.2,e),lerp(-2.8,-3.8,e)];o.ln=-.9;o.H1=[-3.4,-10];o.H2=[3,-8.6];o.ex=3;break}
 case 'pass':{const e=t/.28;o.F1=[.8,0];o.F2=e<.5?[-2.2*eo(e*2),-1.2]:[lerp(-2.2,3.2,eo(e*2-1)),-1.2];o.H1=[-2.6,-8];o.H2=[2.4,-8.4];break}
 case 'header':{const e=C(t/.6,0,1);o.z=Math.sin(Math.PI*e)*16;o.F1=[-1.4,-1.6];o.F2=[.4,-2.2];o.H1=[-3.2,-10.5];o.H2=[3,-10.5];o.ln=e>.4&&e<.7?1.6:.4;o.ex=3;break}
 case 'slide':o.rot=-1.2;o.hy=-3;o.F2=[4.4,-.6];o.F1=[1,-3];o.H1=[-3,-6];o.H2=[1,-9.5];o.ex=3;break;
 case 'tackle':{const e=eo(t/.2);o.ln=1;o.F1=[-1.6,0];o.F2=[3.4*e,-.6];o.H1=[-2.6,-8.6];o.H2=[2.6,-8];o.hy=-4.6;o.ex=3;break}
 case 'shoulder':o.ln=.9;o.hx=.8;o.F1=[-2,0];o.F2=[1.5,0];o.H1=[-1,-7];o.H2=[2.8,-8.6];o.ex=3;break;
 case 'fall':{const e=eo(t/.45),d=p.fd||-1;o.rot=1.5*e*d;o.hy=-5+3.4*e;o.H1=[-2,-11];o.H2=[2.4,-11.5];o.F1=[-1.6,-1];o.F2=[1.8,-.4];o.ex=2;break}
 case 'down':o.rot=1.55*(p.fd||-1);o.hy=-1.6;o.H1=[-1.6,-8];o.H2=[2,-10];o.F2=[1.6,0];o.ex=2;break;
 case 'celebrate':o.z=Math.abs(Math.sin(t*7))*10;o.H1=[-2.2,-17];o.H2=[2.2,-17];o.F1=[-1,-.6];o.F2=[1,-.6];o.ex=1;break;
 case 'airplane':run(2.8,.3);o.H1=[-5,-11.5];o.H2=[5,-11];o.ex=1;break;
 case 'knee':o.hy=-3;o.F1=[-4.4,0];o.F2=[2.2,0];o.ln=-1;o.H1=[-2,-17];o.H2=[3.2,-16];o.ex=1;break;
 case 'point':o.H2=[1,-18];o.H1=[-1.3,-7];o.ex=1;o.bob=Math.sin(t*6)>0?1:0;break;
 case 'clap':{const c=Math.sin(t*18)>0;o.H1=[c?2.4:1.4,-9];o.H2=[c?2.4:3.4,-9];o.ex=1;break}
 case 'hug':o.H1=[3,-10];o.H2=[3.6,-9.6];o.ln=.6;o.z=Math.abs(Math.sin(t*6))*4;o.ex=1;break;
 case 'tired':o.hy=-4;o.ln=1.8;o.H1=[1.4,-5];o.H2=[2.4,-5];o.hd=1;o.bob=Math.sin(t*6)>0?1:0;o.ex=2;break;
 case 'frustrated':o.H1=[-.8,-17];o.H2=[1.2,-17];o.hd=.5;o.ex=2;break;
 case 'sad':o.ln=.7;o.hd=1;o.H1=[-.8,-6.4];o.H2=[.8,-6.4];o.ex=2;break;
 case 'fist':{const u=Math.sin(t*12)>0;o.H2=[2,u?-16:-13];o.H1=[-1.4,-7];o.ex=1;o.z=u?2:0;break}
 case 'dive':o.H1=[-.4,-17.5];o.H2=[1,-18];o.F1=[-1,0];o.F2=[1,-.6];o.hy=-5;o.ex=3;break;
 case 'parry':o.H1=[-1,-16.5];o.H2=[1.8,-18.5];o.F1=[-1,0];o.F2=[1,-.6];o.ex=3;break;
 case 'catch':o.H1=[2.2,-10];o.H2=[2.8,-10.6];o.ln=.7;o.hy=-4.6;break;
 case 'smother':o.rot=1.45;o.hy=-1.8;o.H1=[1,-15];o.H2=[2,-15.5];o.F1=[-1,0];o.F2=[1,-.6];o.ex=3;break;
 case 'gksad':o.hy=-1.6;o.F1=[2.2,0];o.F2=[3.2,0];o.H1=[-1.2,-3.6];o.H2=[1.2,-3.6];o.hd=1;o.ex=2;break;
 case 'whistle':o.H2=[1.6,-13.4];o.H1=[-1.2,-7];break;
 case 'card':o.H2=[1.2,-18.5];o.H1=[-1.2,-7];break;
 case 'throw':{const e=eo(t/.35);o.H1=[lerp(-2,2.6,e),lerp(-16,-10,e)];o.H2=[lerp(-1.6,3.4,e),lerp(-16.5,-10.6,e)];o.F1=[-1.6,0];o.F2=[1.8,0];break}
 }
 if(p.rot)o.rot+=p.rot;o.z+=p.z||0;return o}
function spr(x,p,k,T){const L=p.look,sk=SKIN[L.sk],gk=p.k==='g',f=p.f||1,t=p.pt||0,o=pose(p,t);
 const X=Math.round(p.x),Y=Math.round(p.y-o.z);
 const shirt=gk?k.gk:k.a,tr=gk?'#151515':k.b,shc=gk?'#151515':k.sh,soc=gk?k.gk:k.so,boot=BOOTS[L.bt];
 x.save();x.translate(X,Y);x.scale(f*U,U);
 if(o.rot){x.translate(o.hx,o.hy);x.rotate(o.rot);x.translate(-o.hx,-o.hy)}
 const R=(a,b,w,h,c)=>{x.fillStyle=c;x.fillRect(a,b,w,h)};
 const hx=o.hx,hy=o.hy-o.bob*.5,sx=hx+o.ln,sy=hy-6.4,tw=[5,6,7][L.bd],t0=-Math.floor(tw/2);
 const limb=(ax,ay,bx,by,w,c)=>{const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/.7));x.fillStyle=c;for(let i=0;i<=n;i++){const q=i/n;x.fillRect(Math.round((ax+(bx-ax)*q-w/2)*2)/2,Math.round((ay+(by-ay)*q-w/2)*2)/2,w,w)}};
 const leg=(F,dim)=>{const ax=hx+(F===o.F1?-.6:.6),ay=hy;const[kx,ky,fx,fy]=ik(ax,ay,F[0],F[1],5.4,1);
  const s=dim?.78:1;limb(ax,ay,kx,ky,1.8,shade(sk[0],s));limb(kx,ky,fx,fy-.4,1.6,shade(soc,s));R(fx-1,fy-1,2.6,1.1,shade(boot,s));R(fx-1,fy-.1,2.6,.4,'#000a')};
 const arm=(H,dim)=>{const ax=sx+(H===o.H1?-.4:.4),ay=sy+.8;const[ex,ey,hx2,hy2]=ik(ax,ay,H[0]+o.ln,H[1],5,-1);const s=dim?.78:1;
  limb(ax,ay,ex,ey,1.5,shade(L.sl||gk?shirt:shirt,s));limb(ex,ey,hx2,hy2,1.4,shade(L.sl||gk?shirt:sk[0],s));if(!(L.sl||gk))R(ex-.75,ey-.75,1.5,.6,shade(tr,s));
  if(gk)R(hx2-1,hy2-1,2,2,shade('#f2f2f2',s));else R(hx2-.7,hy2-.7,1.4,1.4,shade(sk[0],s))};
 arm(o.H1,1);leg(o.F1,1);leg(o.F2,0);
 // calção
 R(hx+t0,hy-1.6,tw,2.4,shc);R(hx+t0+tw-1,hy-1.6,1,2.4,shade(shc,.8));R(hx+t0,hy-1.6,.6,2.4,tr);
 // camisa com padrão
 const c0=sx+t0,r0=sy-.6;R(c0-.5,r0-.5,tw+1,6.6,'#0008');R(c0,r0,tw,6,shirt);
 if(!gk){if(k.p==='stripes')for(let i=1;i<tw;i+=2)R(c0+i,r0,1,6,k.b);
  else if(k.p==='hoops')for(let i=1;i<6;i+=2)R(c0,r0+i,tw,1,k.b);
  else if(k.p==='sash')for(let i=0;i<6;i++)R(c0+tw-1-i*(tw/6),r0+i,1.4,1,k.b);
  else if(k.p==='band'){R(c0,r0+2,tw,1,k.b);R(c0,r0+3,tw,1,k.c2)}
  else if(k.p==='halves')R(c0+tw/2,r0,tw/2,6,k.b)}
 else{R(c0,r0+4,tw,.6,shade(shirt,.75));R(c0,r0+1.5,tw,.5,shade(shirt,1.2))}
 R(c0+tw-1.6,r0,1.2,.7,tr);R(c0,r0+5.4,tw,.6,'#0003');
 x.save();x.scale(.5*f,.5);digits(x,p.num||0,Math.round((c0+tw/2-.3)*2)*f,Math.round((r0+1.6)*2),gk?'#151515':k.nm,1);x.restore();
 // cabeça
 const hX=sx+.2+(o.hd?.4:0),hY=sy-5.6+o.hd*.6;R(hX-2.5,hY-.5,5,5.6,'#000a');R(hX-2,hY,4.4,4.6,sk[0]);R(hX-2,hY+3.6,4.4,1,sk[1]);R(hX-1.6,hY+1.4,1,1.4,sk[1]);
 R(hX+1,hY+1.4,1,1,'#151515');if(o.ex===1)R(hX+1.4,hY+3.2,1,.8,'#3a1010');else if(o.ex===3)R(hX+1.6,hY+3.2,.8,.6,'#3a1010');else if(o.ex===2)R(hX+.6,hY+.8,1.4,.4,shade(sk[0],.7));
 const hc=HAIRC[L.hc];
 switch(L.hs){case 0:R(hX-2.2,hY-.6,4.8,1.4,hc);R(hX-2.2,hY,1.2,2,hc);break;
  case 1:R(hX-2,hY-.2,4.2,.9,shade(hc,1.25));break;
  case 2:R(hX-3,hY-2.8,6.4,3.4,hc);R(hX-3,hY,1.6,3,hc);R(hX-2,hY-3.4,4.4,.8,hc);break;
  case 3:R(hX-2.6,hY-1.6,5.4,2,hc);for(let i=0;i<5;i++)R(hX-2.6+i*1.1,hY-2.2,.8,.8,hc);R(hX-2.6,hY,1.2,2.4,hc);break;
  case 4:R(hX-2.2,hY-.8,4.8,1.6,hc);R(hX-3,hY-.4,1.8,6,hc);break;
  case 5:R(hX-.8,hY-2,1.8,2.4,hc);R(hX-2,hY-.1,4.4,.5,shade(sk[0],.75));break;
  case 6:R(hX-1,hY+.3,1.2,.6,shade(sk[0],1.18));break;
  case 7:R(hX-2.2,hY-.8,4.8,1.6,hc);for(let i=0;i<3;i++)R(hX-3+i*.8,hY+.4,.6,4.6+i*.4,hc);break;
  case 8:R(hX-2.2,hY-.6,4.8,1.4,hc);R(hX-.4,hY-1.8,3.2,1.4,hc);R(hX-2.2,hY,1,1.6,hc);break}
 if(L.br===2){R(hX+.2,hY+3,2.2,1.6,hc);R(hX+1.4,hY+3.2,.8,.5,sk[0])}else if(L.br===1)R(hX,hY+3.8,2.4,.6,shade(sk[1],.8));
 if(L.hb)R(hX-2,hY+.4,4.4,.7,tr);
 arm(o.H2,0);
 if(p.cur==='card')R(o.H2[0]+o.ln-.6,o.H2[1]-3,1.8,2.4,p.cardc||'#ffd400');if(p.cur==='whistle')R(o.H2[0]+o.ln+.4,o.H2[1]-.4,.8,.8,'#c9c9c9');
 x.restore()}
function shadowOf(x,p,lights){const o=p.cur,lay=o==='slide'||o==='down'||o==='smother'||o==='gksad',z=(p.z||0)+(o==='header'||o==='celebrate'?6:0),w=(lay?22:14)*(1-Math.min(.4,z/40)),a=.33*(1-Math.min(.6,z/30));
 x.fillStyle=`rgba(0,0,0,${a})`;
 if(lights){for(const L of lights){const dx=p.x-L[0],dy=p.y-L[1],d=Math.hypot(dx,dy)||1;x.save();x.translate(p.x+dx/d*7,p.y+dy/d*4+1);x.rotate(Math.atan2(dy,dx));x.globalAlpha=.45;x.beginPath();x.ellipse(0,0,w*.8,3,0,0,7);x.fill();x.restore()}}
 else{x.beginPath();x.ellipse(p.x+3,p.y+1,w/2+2,3.4,0,0,7);x.fill()}}

/* ================= 8. RETRATOS (frente, 16x16) ================= */
function portrait(x,X,Y,s,L,k,num,opt={}){const sk=SKIN[L.sk],hc=HAIRC[L.hc],gk=opt.gk,R=(a,b,w,h,c)=>{x.fillStyle=c;x.fillRect(X+a*s,Y+b*s,w*s,h*s)};
 if(opt.bg!==false){const g=x.createLinearGradient(X,Y,X,Y+16*s);g.addColorStop(0,shade(gk?k.gk:k.a,.55));g.addColorStop(1,shade(gk?k.gk:k.a,.2));x.fillStyle=g;x.fillRect(X,Y,16*s,16*s);
  x.fillStyle='#ffffff10';for(let i=0;i<16;i+=2)x.fillRect(X+i*s,Y,s,16*s)}
 const sh=gk?k.gk:k.a;
 // ombros / camisa
 R(1,12,14,4,sh);if(!gk){if(k.p==='stripes')for(let i=2;i<15;i+=2)R(i,12,1,4,k.b);else if(k.p==='hoops'){R(1,13,14,1,k.b);R(1,15,14,1,k.b)}else if(k.p==='sash')for(let i=0;i<4;i++)R(11-i*2,12+i,2,1,k.b);else if(k.p==='band'){R(1,14,14,1,k.b);R(1,15,14,1,k.c2)}else if(k.p==='halves')R(8,12,7,4,k.b)}
 R(1,12,1,4,shade(sh,.7));R(14,12,1,4,shade(sh,.7));
 R(6,11,4,2,sk[1]);R(6,12,1,1,gk?'#151515':k.b);R(9,12,1,1,gk?'#151515':k.b);R(7,13,2,1,sk[1]);
 if(!gk)R(11,13,2,2,k.b),R(11.5,13.5,1,1,k.a);
 if(num!=null){const c=x.fillStyle;digits(x,num,X+Math.round(4*s),Y+Math.round(13*s),gk?'#151515':k.nm,Math.max(1,Math.round(s/2)))}
 // cabeça
 R(4,3,8,9,sk[0]);R(4,3,1,1,'#0000');R(3,6,1,3,sk[1]);R(12,6,1,3,sk[1]);R(4,10,8,2,sk[1]);R(5,11,6,1,sk[0]);
 x.clearRect&&0;R(5,7,2,1,'#fff');R(9,7,2,1,'#fff');R(6,7,1,1,'#1a1a1a');R(9,7,1,1,'#1a1a1a');
 R(5,6,2,1,shade(hc,.9));R(9,6,2,1,shade(hc,.9));R(7,8,2,2,sk[1]);R(7,8,1,1,shade(sk[0],1.08));
 if(opt.ex===1){R(6,10,4,1,'#3a1010');R(7,10,2,1,'#fff')}else R(6,10,4,1,shade(sk[1],.75));
 switch(L.hs){case 0:R(4,2,8,2,hc);R(4,4,1,2,hc);R(11,4,1,2,hc);break;
  case 1:R(4,2,8,1,shade(hc,1.2));R(4,3,1,1,shade(hc,1.2));R(11,3,1,1,shade(hc,1.2));break;
  case 2:R(2,0,12,4,hc);R(3,-1,10,1,hc);R(2,4,2,4,hc);R(12,4,2,4,hc);break;
  case 3:R(3,1,10,3,hc);for(let i=3;i<13;i+=2)R(i,0,1,1,hc);R(3,4,1,3,hc);R(12,4,1,3,hc);break;
  case 4:R(4,2,8,2,hc);R(3,3,1,9,hc);R(12,3,1,9,hc);R(4,4,1,2,hc);break;
  case 5:R(7,0,2,3,hc);R(4,3,8,1,shade(sk[0],.85));break;
  case 6:R(6,4,2,1,shade(sk[0],1.15));break;
  case 7:R(4,2,8,2,hc);for(let i=0;i<4;i++){R(2+i%2,3+i,1,8-i,hc);R(13-i%2,3+i,1,8-i,hc)}break;
  case 8:R(4,2,8,2,hc);R(7,0,5,2,hc);R(4,4,1,2,hc);R(11,4,1,2,hc);break}
 if(L.br===2){R(4,9,1,2,hc);R(11,9,1,2,hc);R(5,11,6,1,hc);R(5,10,1,1,hc);R(10,10,1,1,hc)}else if(L.br===1){R(5,11,6,1,shade(sk[1],.8))}
 if(L.hb)R(4,4,8,1,gk?'#151515':k.b);
 if(opt.frame!==false){x.strokeStyle='#000';x.lineWidth=Math.max(1,s/2);x.strokeRect(X+.5,Y+.5,16*s-1,16*s-1)}}
const _pc={};
function portraitURL(seed,L,k,num,gk){const key=seed+JSON.stringify(L)+k.a+k.b+k.p+num+(gk?1:0);if(_pc[key])return _pc[key];const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');portrait(x,0,0,4,L,k,num,{gk});return _pc[key]=c.toDataURL()}
// Escudo/camisa do clube em pixel art
const _kb={};
function kitBadge(ci){if(_kb[ci])return _kb[ci];const k=kitOf(ci),c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),R=(a,b,w,h,cl)=>{x.fillStyle=cl;x.fillRect(a*2,b*2,w*2,h*2)};
 const m=['..####..####..','.##############','################','################','.##.########.##','....########...','....########...','....########...','....########...','....########...','....########...','....########...','.....######....'];
 m.forEach((r,y)=>{for(let i=0;i<r.length;i++)if(r[i]==='#'){let cl=k.a;
  if(k.p==='stripes'&&i%2)cl=k.b;else if(k.p==='hoops'&&y%2)cl=k.b;else if(k.p==='sash'&&Math.abs((i-4)-(y-1))<1.2)cl=k.b;else if(k.p==='band'&&(y===5||y===6))cl=y===5?k.b:k.c2;else if(k.p==='halves'&&i>7)cl=k.b;R(i+1,y+2,1,1,cl)}});
 R(6,2,4,1,k.b);R(7,3,2,1,'#0006');x.strokeStyle='#000';x.lineWidth=2;
 // contorno
 const id=x.getImageData(0,0,32,32),d=id.data,o=new Uint8ClampedArray(d);for(let y=0;y<32;y++)for(let i=0;i<32;i++){const j=(y*32+i)*4;if(d[j+3])continue;for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=i+a,yy=y+b;if(xx<0||yy<0||xx>31||yy>31)continue;if(d[(yy*32+xx)*4+3]){o[j]=o[j+1]=o[j+2]=0;o[j+3]=255;break}}}
 x.putImageData(new ImageData(o,32,32),0,0);return _kb[ci]=c.toDataURL()}
