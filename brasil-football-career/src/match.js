/* ================= 10. PARTIDA — estrutura da 2.0 preservada =================
   Fases: intro → run (relógio avança) → pick (escolha) → time (barra) → fly (cena animada) → res → … → end.
   A lógica de chances (pick/tap/resolve) é a mesma da 2.0; só a apresentação mudou. */
let mt=0,fpsA=16;
const IM={};for(const k in IMG){IM[k]=new Image();IM[k].src=IMG[k]}
const sc=()=>{$('sc').textContent=M.s[0]+' x '+M.s[1]};
const cpos=()=>.5+.5*Math.sin((performance.now()-M.t0)/1000*M.z.sp);
const ourSide=()=>M.E.home?0:1;
/* ---- atores ---- */
const go=(p,x,y,spd=120)=>{p.tx=x;p.ty=y;p.spd=spd};
const ps=(p,n,d=null)=>{p.pose=n;p.pt=0;p.pd=d};
const later=(s,fn)=>M.tq.push({t:M.ck+s,fn});
function actUpd(p,dt){if(p.tx!=null){const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),mv=Math.min(d,p.spd*dt);
  if(d>.6){p.x+=dx/d*mv;p.y+=dy/d*mv;p.v=mv/Math.max(dt,1e-4);if(!p.lf&&Math.abs(dx)>.4)p.f=dx>0?1:-1}else p.v=0}else p.v=0;
 p.rp+=p.v*dt*.12;p.pt+=dt;if(p.pose&&p.pd!=null&&p.pt>=p.pd){p.pose=null;p.pd=null}
 if(p.dv){const v=p.dv;v.t+=dt;const e=C(v.t/v.d,0,1);p.y=v.y0+v.dir*v.dist*eo(e);p.z=Math.sin(Math.PI*Math.min(e,1))*v.h;p.rot=lerp(0,v.r,eo(e));if(e>=1){p.z=0;if(!v.done){v.done=1;FX.burst(p.x,p.y,6,'grass',.6);SND.thud()}}}
 const loco=p.v>150?'sprint':p.v>60?'run':p.v>6?'walk':(p.idle||'idle');
 p.cur=p.pose||(M.car===p&&!M.hold&&p.v>6?'dribble':loco)}
function dive(p,dir,kind='dive',dist=30,h=10,d=.42){ps(p,kind,null);p.lf=1;p.dv={t:0,d,dir,dist,h,y0:p.y,r:(dir<0?-1:1)*1.35}}
function resetActor(p){p.pose=null;p.pd=null;p.rot=0;p.z=0;p.dv=null;p.lf=0;p.lock=0;p.idle=p.k==='g'?'gkready':null}
/* ---- bola ---- */
function ballFly(x1,y1,d,h,cb,o={}){const b=M.b;M.car=null;M.hold=false;b.hide=0;b.fl={x0:b.x,y0:b.y,z0:b.z||0,x1,y1,z1:o.z1||0,d,h,t:0,cb,cv:o.cv||0};b.hot=o.hot}
function ballUpd(dt){const b=M.b,px=b.x,py=b.y-b.z;
 if(b.fl){const f=b.fl;f.t+=dt;const e=Math.min(1,f.t/f.d);b.x=lerp(f.x0,f.x1,e);b.y=lerp(f.y0,f.y1,e)+Math.sin(e*Math.PI)*f.cv;b.z=lerp(f.z0,f.z1,e)+f.h*4*e*(1-e);if(e>=1){b.fl=null;const cb=f.cb;cb&&cb()}}
 else if(M.car){const p=M.car;if(M.hold){b.x=p.x+(p.f||1)*5;b.y=p.y+1;b.z=10+(p.z||0)}else{b.x=p.x+(p.f||1)*7;b.y=p.y+2;b.z=p.v>10?Math.abs(Math.sin(p.rp))*2.5:0}}
 else if(b.vx||b.vy){b.x+=b.vx*dt;b.y+=b.vy*dt;const k=Math.pow(.35,dt);b.vx*=k;b.vy*=k;b.z=Math.max(0,b.z-60*dt);if(Math.hypot(b.vx,b.vy)<4)b.vx=b.vy=0}
 const sp=Math.hypot(b.x-px,b.y-b.z-py)/Math.max(dt,1e-4);b.rot=(b.rot||0)+sp*dt*.25;
 b.tr=b.tr||[];if(sp>260&&!M.car){b.tr.push([b.x,b.y-b.z]);if(b.tr.length>9)b.tr.shift()}else if(b.tr.length)b.tr.shift()}
function kickFX(p,pw){const b=M.b;SND.kick(pw);FX.burst(b.x,b.y,Math.round(4+pw*6),'spark',pw);FX.burst(b.x,b.y,4,'grass',.6);if(pw>1.05){FX.ring(b.x,b.y-b.z,'#fff',220);M.sk=Math.max(M.sk,.25)}}
/* ---- início ---- */
function startMatch(){if(S.energy<25||M)return;const oi=oppN(),E=envOf(oi),r=role(),hc=E.home?S.club:oi,ac=E.home?oi:S.club;
 const mk=(t,x,y,k)=>({t,x,y,hx:x,hy:y,k,ph:RN()*6,f:t?-1:1,v:0,rp:RN()*6,pt:0,z:0,rot:0,cur:'idle',sp0:95+RN()*35,idle:k==='g'?'gkready':null});
 const A=[mk(0,38,200,'g'),mk(0,160,110),mk(0,160,290),mk(0,290,200),mk(0,300,130),mk(1,682,200,'g'),mk(1,560,110),mk(1,560,290),mk(1,430,160),mk(1,430,250)];
 const own=sqd(S.club),op=sqd(oi),ui0=r==='g'?0:3;
 A.forEach((p,i)=>{const q=i<5?own[i]:op[i-5];p.nm=q.n;p.num=q.num;p.pos=q.pos;p.look=lookOf(q.n+(i<5?S.club:oi))});
 const u=A[ui0];u.nm=S.name;u.num=S.num;u.look=userLook();u.me=1;u.pos=S.pos;
 M={oi,o:CL[oi].n,s:[0,0],min:0,i:0,mm:Array.from({length:7},(_,i)=>Math.round(6+i*12+RN()*8)),ph:'intro',st:{g:0,a:0,tk:0},rt:6,cf:S.morale/100,A,b:{x:360,y:200,z:0,rot:0},msg:'Os times entram em campo...',
  E,u,K:[kitOf(S.club),kitOf(oi,S.club)],ST:buildStadium(E,hc,ac),cam:{x:360,y:250,z:1},camT:{x:360,y:250,z:1},cx:[0,0],boo:[0,0],net:[{t:9,a:0,y:200},{t:9,a:0,y:200}],it:0,ck:0,tq:[],ts:1,lb:0,sk:0,fl:0,ban:null,log:[],car:null,ct:1,wv:null,cls:E.cls||E.fin};
 M.kb=[0,1].map(i=>{const im=new Image();im.src=kitBadge(i?oi:S.club);return im});
 FX.clear();$('pitch').onclick=skipIntro;
 $('arena').classList.remove('hidden');$('res').classList.add('hidden');$('k0').src=kitBadge(S.club);$('k1').src=kitBadge(oi);$('n0').textContent=CL[S.club].n;$('n1').textContent=M.o;
 $('vs').textContent=envTxt(E);sc();$('ev').textContent='';ui();SND.ambStart();$('arena').scrollIntoView({behavior:RM?'auto':'smooth'});mt=0;M.raf=requestAnimationFrame(mloop)}
function skipIntro(){if(!M||M.ph!=='intro')return;if(M.it<3.2)M.it=3.2;else if(M.it<6.2){M.it=6.2;walkIn()}else kickoff()}
function walkIn(){if(M.wk)return;M.wk=1;M.A.forEach((p,i)=>{p.x=350+(i>=5?24:0)+(i%5)*3;p.y=412+(i%5)*9;resetActor(p);go(p,p.hx,p.hy,62)});M.cx=[.7,.5];SND.cheer(.6,2.5);for(let i=0;i<30;i++)FX.burst(360,-20,1,'conf')}
function kickoff(){M.wk=1;M.A.forEach(p=>{resetActor(p);p.x=p.hx;p.y=p.hy;p.tx=null});M.b={x:360,y:200,z:0,rot:0};M.car=M.A[3];M.ph='run';M.msg='Apita o árbitro!';SND.whistle(1);ui()}
/* ---- loop ---- */
function mloop(t){if(!M)return;const dt=Math.min(.05,(t-mt)/1000||0);mt=t;fpsA=fpsA*.95+dt*1000*.05;if(!LQ&&fpsA>26&&M.min>2){LQ=1}
 if(M.ph==='intro'){M.it+=dt;if(M.it>=6.2&&!M.wk)walkIn();if(M.it>=9)kickoff()}
 if(M.ph==='run'){const tg=M.i<M.mm.length?M.mm[M.i]:90;M.min=Math.min(tg,M.min+dt*10);if(M.min>=tg){if(M.i>=M.mm.length)mend();else{autoEv();M.ph='pick';setupMoment();ui()}}}
 if(M.ph==='time'){const c=$('cur');if(c)c.style.left=cpos()*100+'%'}
 $('clk').textContent=Math.floor(M.min)+"'";
 const sdt=dt*M.ts;M.ck+=sdt;M.tq.sort((a,b)=>a.t-b.t);while(M&&M.tq.length&&M.tq[0].t<=M.ck)M.tq.shift().fn();if(!M)return;
 if(M.ph==='run'||(M.ph==='res'&&!M.cel))ambient(sdt);
 for(const p of M.A)actUpd(p,sdt);ballUpd(sdt);FX.upd(sdt);
 for(const n of M.net)n.t+=dt;M.cx=M.cx.map(v=>Math.max(0,v-dt*.25));M.boo=M.boo.map(v=>Math.max(0,v-dt*.35));M.sk=Math.max(0,M.sk-dt*1.4);M.fl=Math.max(0,M.fl-dt*2.5);
 if(M.ban){M.ban.t+=dt;if(M.ban.t>M.ban.d)M.ban=null}
 if(M.ph==='run'&&M.wv==null&&RN()<dt*.05)M.wv=-40;if(M.wv!=null){M.wv+=dt*260;if(M.wv>W+40)M.wv=null}
 M.lb=lerp(M.lb,(M.ph==='fly'&&M.dec)||M.ph==='pick'||M.ph==='time'?1:0,1-Math.exp(-dt*6));
 camUpd(dt);SND.ambLvl(Math.max(M.cx[0],M.cx[1],(M.ph==='time'||M.ph==='pick')?.3:0));
 mdraw(t);M.raf=requestAnimationFrame(mloop)}
function camUpd(dt){const c=M.cam,T=M.camT,b=M.b,u=M.u;
 if(M.ph==='pick'||M.ph==='time'){T.z=1.75;T.x=u.x+(M.R&&M.R.r==='a'?34:22);T.y=u.y+OY-12}
 else if(M.ph==='fly'){T.z=M.dec?1.6:1.4;T.x=lerp(u.x,b.x,.65);T.y=lerp(u.y,b.y,.6)+OY-10}
 else if(M.ph==='res'&&M.cel){T.z=1.55;T.x=M.cel.x;T.y=M.cel.y+OY-14}
 else if(M.ph==='run'){T.z=1.12;T.x=b.x;T.y=b.y+OY}
 else{T.z=1;T.x=360;T.y=250}
 const k=1-Math.exp(-dt*(M.ph==='fly'?5:3.2));c.z=lerp(c.z,T.z,k);const hw=W/2/c.z,hh=H/2/c.z;c.x=C(lerp(c.x,T.x,k),hw,W-hw);c.y=C(lerp(c.y,T.y,k),hh,H-hh)}
/* ---- jogo ambiente (entre os lances): posse, passes, desarmes e faltas ---- */
function ambient(dt){const A=M.A,b=M.b,late=M.min>70;
 if(!M.car&&!b.fl&&!(b.vx||b.vy)){let best=null,bd=1e9;for(const p of A){if(p.k==='g'||p.lock)continue;const d=Math.hypot(p.x-b.x,p.y-b.y);if(d<bd){bd=d;best=p}}if(best){go(best,b.x,b.y,150);if(bd<10)M.car=best}}
 if(!M.car&&!b.fl&&(b.vx||b.vy)){let best=null,bd=1e9;for(const p of A){if(p.lock)continue;const d=Math.hypot(p.x-b.x,p.y-b.y);if(d<bd){bd=d;best=p}}if(best){go(best,b.x,b.y,160);if(bd<10){M.car=best;b.vx=b.vy=0}}}
 const car=M.car;
 for(const p of A){if(p.lock||p.pose)continue;
  if(p.k==='g'){const gx=p.t?684:36;go(p,gx,C(200+(b.y-200)*.3,176,224),70);p.idle=Math.abs(b.x-gx)<320?'gkready':'idle';continue}
  if(p===car){const gx=p.t?120:600;go(p,C(p.x+(gx-p.x)*.5,130,590),C(p.y+Math.sin(M.ck*1.3+p.ph)*40,60,340),p.sp0*.85);continue}
  const ch=car&&car.t!==p.t&&A.filter(q=>q.t===p.t&&q.k!=='g').sort((a,c)=>Math.hypot(a.x-car.x,a.y-car.y)-Math.hypot(c.x-car.x,c.y-car.y))[0]===p;
  if(ch){go(p,car.x-(car.f||1)*10,car.y,p.sp0*.9);continue}
  go(p,C(p.hx+(b.x-360)*.38+Math.sin(M.ck*.7+p.ph)*16,40,680),C(p.hy+(b.y-200)*.25+Math.cos(M.ck*.6+p.ph)*12,30,370),p.sp0*(late?.8:1));
  p.idle=late&&(p.ph>4.4)?'tired':null}
 if(!car)return;M.ct-=dt;
 if(M.ct<=0){M.ct=.7+RN()*1;const opp=A.filter(q=>q.t!==car.t&&q.k!=='g'&&!q.lock),near=opp.sort((a,c)=>Math.hypot(a.x-car.x,a.y-car.y)-Math.hypot(c.x-car.x,c.y-car.y))[0],r=RN();
  if(near&&Math.hypot(near.x-car.x,near.y-car.y)<40&&r<.3){ // dividida
   const foul=RN()<.3;ps(near,foul?'slide':'tackle',.6);go(near,car.x,car.y,220);FX.burst(car.x,car.y,10,'grass');SND.thud();
   if(foul){ps(car,'fall',.45);car.fd=-1;later(.45,()=>ps(car,'down',.9));later(.2,()=>SND.whistle(1));M.car=null;b.vx=b.vy=0;M.ct=1.6;M.msg='Falta! O árbitro marca.';if(M.ph==='run')ui()}
   else{M.car=near;M.ct=.9}}
  else{const mates=A.filter(q=>q.t===car.t&&q!==car&&q.k!=='g'&&!q.lock);if(mates.length){const q=pickR(mates),long=Math.hypot(q.x-car.x,q.y-car.y)>160;ps(car,'pass',.3);const c0=car;
   later(.12,()=>{if(M.car!==c0)return;SND.kick(.4);ballFly(q.x+(q.t?-8:8),q.y,long?.7:.42,long?26:4,()=>{if(!q.lock)M.car=q})})}}}}
/* ---- momentos ---- */
function setupMoment(){const r=role(),A=M.A,u=M.u,P=(i,x,y,f)=>{const p=A[i];resetActor(p);go(p,x,y,200);if(f)p.f=f,p.lf=1};
 M.dec=M.min>=70&&Math.abs(M.s[0]-M.s[1])<=1;M.cel=null;M.tq=[];
 if(r==='a'){P(3,540,200,1);P(8,590,204,-1);P(5,686,200,-1);P(4,604,132);P(1,380,120);P(2,400,300);P(0,60,200);P(6,624,300);P(7,566,112);P(9,500,284);
  M.R={r,u,D:A[8],K:A[5],T:A[4]};A[8].idle='guard'}
 else if(r==='d'){P(3,196,204,1);P(9,252,198,-1);P(8,232,120);P(0,34,200,1);P(2,240,300);P(1,128,142);P(4,320,250);P(5,686,200);P(6,360,300);P(7,330,100);
  M.R={r,u,X:A[9],X2:A[8],K:A[0],T:A[2]};u.idle='guard'}
 else{P(0,34,200,1);P(9,150,192,-1);P(8,172,110);P(1,108,240);P(2,210,300);P(3,250,190);P(4,300,120);P(5,686,200);P(6,300,300);P(7,262,80);
  M.R={r,u,X:A[9],X2:A[8],D:A[1]};u.idle='gkready'}
 const car=r==='a'?u:M.R.X;later(.35,()=>{if(M.ph==='pick'||M.ph==='time'){car.x=car.tx;car.y=car.ty;M.car=car;M.b.vx=M.b.vy=0;M.b.fl=null}});
 ballFly(car.tx+(car.f||1)*7,car.ty+2,.35,10);M.cx=[.15,.15];
 banner(M.dec?'LANCE DECISIVO':'SEU LANCE',`${Math.floor(M.min)}' · ${S.name}`,M.dec?'#ff5a5f':'#ffd400',1.4);SND.ui(M.dec?330:660)}
function banner(txt,sub,col='#ffd400',d=1.8,big=0){M.ban={txt,sub,col,d,big,t:0}}
/* ---- resolução (lógica idêntica à 2.0) ---- */
function pick(i){if(M.ph!=='pick')return;const o=OPT[role()][i],w=C(.1+S.attrs[o[1]]/100*.28+M.cf*.06+S.energy/1000-o[2]*.1-CL[M.oi].t*.02,.07,.42);M.o_=i;M.z={c:.2+RN()*.6,w,sp:3+o[2]*4};M.t0=performance.now();M.ph='time';SND.ui(700);
 const u=M.u;if(role()==='a'){u.idle=i===0?'windup':null}ui()}
function tap(){if(!M||M.ph!=='time')return;const d=Math.abs(cpos()-M.z.c);resolve(d<M.z.w/4?2:d<M.z.w/2?1:0)}
function resolve(q){const r=role(),o=M.o_,st=M.st,ok=p=>RN()<p;let g=0,txt,rt=0,kind;
 if(r==='a'){
  if(o===0){if(ok([.1,.5,.88][q])){g=1;st.g++;rt=1.3;txt='GOOOL! Você marcou!'}else{rt=q?.1:-.3;txt=q?'O goleiro defendeu!':'Chutou para fora.'}}
  else if(o===1){if(q&&ok(q===2?.6:.3)){g=1;st.g++;rt=1.5;txt='Driblou o zagueiro e fez o gol!'}else{rt=q?0:-.3;txt=q?'Passou pelo marcador, mas finalizou mal.':'O marcador roubou a bola.'}}
  else{if(q&&ok(q===2?.65:.3)){g=1;st.a++;rt=1.1;txt='Passe perfeito! Gol do companheiro!'}else{rt=q?.1:-.2;txt=q?'Passe certo, mas a jogada morreu.':'Passe interceptado.'}}
 }else{
  if(ok([.12,.65,1][q])){st.tk++;rt=.6;txt=r==='g'?'Defesaça!':'Lance cortado!';kind='ok'}else if(ok(.65)){g=-1;rt=-.8;txt='Falha sua: o rival marcou.';kind='goal'}else{rt=-.2;txt='Você falhou, mas o rival errou o chute.';kind='miss'}}
 M.rt+=rt;M.cf=C(M.cf+(q?.12:-.1),0,1);M.msg=txt;M.q=q;M.log.push([Math.floor(M.min),txt,g]);M.ph='fly';
 const sw=['Na trave… do relógio!','Bom tempo!','PERFEITO!'][q];FX.ring(M.u.x,M.u.y,q===2?'#ffd400':q?'#3ddc84':'#ff5a5f',140,.5);if(q===2){M.fl=.35;SND.tone(1320,.12,.04)}
 $('ev').textContent=q===2?'⚡ '+sw:'';ui();
 if(r==='a')[scShot,scDribble,scPass][o](q,g);else if(r==='d')[scTackle,scIntercept,scShoulder][o](q,kind);else[scParry,scRush,scCatch][o](q,kind)}
function finishScene(goal){if(!M||M.ph!=='fly')return;M.ts=1;M.ph='res';ui();M.tm=setTimeout(next,goal?3100:2100)}
function next(){if(!M)return;M.i++;M.ph='run';M.cel=null;M.tq=[];M.ts=1;$('ev').textContent='';M.msg='O jogo segue.';M.b.hide=0;
 M.A.forEach(p=>{resetActor(p);if(p.cur==='down'||p.cur==='gksad')p.y+=0});if(!M.car){M.car=M.A[M.b.x<360?1:8];M.b.vx=M.b.vy=0}ui()}
/* ---- gols e reações ---- */
function scoreGoal(side,scorer,yy){M.s[side]++;sc();const n=M.net[side?0:1];n.t=0;n.a=7;n.y=yy;SND.net();M.sk=.7;if(!RM)M.fl=.5;
 const us=ourSide(),fans=side===0?us:1-us,big=M.cls?1.3:1;M.cx[fans]=Math.min(1.3,1*big);M.boo[1-fans]=.9;
 SND.cheer(fans===0||!M.E.home?big:.55,3.2);if(side===1&&M.E.home)later(.5,()=>SND.boo());
 const e=$('ev');e.textContent=side===0?'GOOOL!':'Gol do adversário';e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop');
 if(side===0){for(let i=0;i<(LQ?25:55);i++)FX.burst(side?30:690,200,1,'conf');if(M.cls||M.dec)for(let i=0;i<6;i++)later(i*.18,()=>FX.burst(80+RN()*560,-40-RN()*14,10,'spark',1.2))}
 banner(side===0?'GOOOL!':'GOL DO RIVAL',`${scorer?scorer.nm:''} ${Math.floor(M.min)}'`,side===0?'#ffd400':'#ff5a5f',2.4,1);celebrate(side,scorer)}
function celebrate(side,sc0){const A=M.A,cx=side===0?680:40,cy=sc0&&sc0.y<200?44:356,team=A.filter(p=>p.t===side),opp=A.filter(p=>p.t!==side);M.cel=sc0||team[3];
 for(const p of A){p.lock=1;p.dv=null;p.rot=0;p.z=0}
 if(sc0){p0(sc0)}function p0(p){const c=pickR(['knee','celebrate','point','airplane']);ps(p,'airplane',1);go(p,cx,cy,175);later(1,()=>{ps(p,c==='airplane'?'celebrate':c,null);if(c==='knee'){go(p,cx+(side?14:-14),cy,90)}})}
 team.filter(p=>p!==sc0).forEach((p,i)=>{if(p.k==='g'){later(.2,()=>ps(p,'fist',null));return}later(.3+i*.12,()=>{go(p,cx+(side?1:-1)*(16+i*7),cy+(i%2?10:-10),150);later(.9,()=>ps(p,pickR(['hug','celebrate','clap']),null))})});
 opp.forEach((p,i)=>later(.2+i*.1,()=>{if(p.k==='g'){ps(p,'gksad',null);return}ps(p,pickR(['frustrated','sad','tired']),null);go(p,p.x+(side?-1:1)*12,p.y,30)}))}
function relief(p,good){ps(p,good?'fist':'frustrated',1.6)}
function endIn(s,goal){later(s,()=>finishScene(goal))}
/* ---- cenas de ataque ---- */
function shotRight(sh,kind,pw=1){const K=M.R.K||M.A[5],s=RN()<.5?-1:1;ps(sh,'windup',.3);sh.lf=1;sh.f=1;
 later(.3,()=>{ps(sh,'kick',.6);kickFX(sh,pw);if(M.dec)M.ts=.42;let tx,ty,tz,h=6,d=.42;
  if(kind==='goal'){tx=711;ty=200+s*(12+RN()*14);tz=3+RN()*9;const wr=RN()<.45;later(.1,()=>dive(K,wr?-s:s,'dive',wr?24:20))}
  else if(kind==='save'){tx=692;ty=200+s*20;tz=7;later(.06,()=>dive(K,s,'parry',22))}
  else if(kind==='catch'){tx=688;ty=200+s*4;tz=9;d=.5;later(.12,()=>ps(K,'catch',null))}
  else if(kind==='over'){tx=712;ty=200+s*8;tz=34;h=20}
  else{tx=714;ty=200+s*(50+RN()*20);tz=4;later(.15,()=>dive(K,s,'dive',10,6))}
  ballFly(tx,ty,d,h,()=>{M.ts=1;const b=M.b;
   if(kind==='goal'){scoreGoal(0,sh,ty);b.vx=b.vy=0;endIn(1.4,1)}
   else if(kind==='save'){SND.thud();FX.burst(b.x,b.y-b.z,8,'spark');ballFly(696,ty+s*95,.5,16,()=>{b.hide=1});relief(sh,0);M.boo[ourSide()]=.4;SND.ooh();later(.6,()=>ps(K,'fist',1.2));endIn(1.5)}
   else if(kind==='catch'){M.car=K;M.hold=true;SND.thud();relief(sh,0);SND.ooh();later(.6,()=>ps(K,'fist',1));endIn(1.4)}
   else{ballFly(740,ty+s*26,.3,3,()=>{b.hide=1});relief(sh,0);M.boo[ourSide()]=.5;SND.ooh();endIn(1.3)}},{z1:tz,hot:pw>1.05})})}
function scShot(q,g){shotRight(M.u,g?'goal':q?(RN()<.5?'save':'catch'):(RN()<.6?'miss':'over'),1+q*.15+S.attrs.shoot/400)}
function scDribble(q,g){const u=M.u,D=M.R.D,s=RN()<.5?-1:1;M.car=u;go(u,566,200,105);ps(D,'guard',null);
 later(.35,()=>{if(q){go(u,598,200+s*26,175);u.lf=1;u.f=1;ps(D,'slide',.9);go(D,592,200-s*12,210);FX.burst(D.x,D.y,10,'grass');SND.thud();
   later(.3,()=>{go(u,632,200+s*16,200);later(.45,()=>shotRight(u,g?'goal':'catch',g?1.15:.8))})}
  else{ps(D,'slide',.9);go(D,u.x+6,u.y,250);later(.16,()=>{FX.burst(u.x,u.y,16,'grass',1.2);SND.thud();M.sk=.3;ps(u,'fall',.45);u.fd=-1;later(.45,()=>ps(u,'down',1.4));
   const T=M.A[7];ballFly(u.x+30,u.y+40,.45,8,()=>{M.car=T});go(T,u.x+30,u.y+40,190);M.boo[ourSide()]=.5;SND.ooh();later(.5,()=>go(T,420,230,140));endIn(1.5)})}})}
function scPass(q,g){const u=M.u,T=M.R.T,D=M.R.D,head=g&&q===2&&RN()<.55;ps(u,'pass',.4);u.f=1;u.lf=1;
 later(.14,()=>{SND.kick(.6);FX.burst(M.b.x,M.b.y,3,'grass',.5);
  if(!q){const mx=(u.x+T.x)/2,my=(u.y+T.y)/2;go(D,mx,my,280);ballFly(mx,my,.38,3,()=>{M.car=D;go(D,430,220,150)});later(.5,()=>relief(u,0));M.boo[ourSide()]=.4;SND.ooh();endIn(1.4);return}
  if(head){ballFly(T.x+3,T.y,.6,30,()=>{SND.kick(.9);FX.burst(M.b.x,M.b.y-M.b.z,8,'spark');kickHeader()},{z1:20});later(.12,()=>ps(T,'header',.8))}
  else ballFly(T.x+6,T.y+2,.42,5,()=>{M.car=T;T.f=1;if(g)later(.1,()=>shotRight(T,'goal',1.1));else{go(D,T.x+9,T.y,230);later(.3,()=>{ps(D,'tackle',.4);FX.burst(T.x,T.y,10,'grass');SND.thud();ballFly(430,230,.8,34);ps(T,'fall',.45);T.fd=-1;later(.5,()=>ps(T,'down',.8));relief(u,0);endIn(1.4)})}});
  function kickHeader(){const ty=200+(RN()<.5?-16:16);const K=M.R.K;later(.05,()=>dive(K,ty<200?-1:1,'dive',18));if(M.dec)M.ts=.42;ballFly(711,ty,.3,3,()=>{M.ts=1;scoreGoal(0,T,ty);endIn(1.4,1);later(.6,()=>{go(u,T.x-12,T.y,170)})},{z1:9,hot:1})}})}
/* ---- cenas de defesa ---- */
function shotLeft(sh,kind){const K=M.A[0],s=RN()<.5?-1:1;ps(sh,'windup',.3);sh.lf=1;sh.f=-1;
 later(.3,()=>{ps(sh,'kick',.6);kickFX(sh,1.05);if(M.dec)M.ts=.42;let tx,ty,tz,h=6;
  if(kind==='goal'){tx=9;ty=200+s*(12+RN()*14);tz=3+RN()*9;later(.14,()=>dive(K,RN()<.5?s:-s,'dive',22))}
  else{tx=-8;ty=200+s*(52+RN()*18);tz=5;if(K!==M.u)later(.12,()=>dive(K,s,'dive',12,6))}
  ballFly(tx,ty,.42,h,()=>{M.ts=1;const b=M.b;if(kind==='goal'){scoreGoal(1,sh,ty);b.vx=b.vy=0;endIn(1.4,1)}
   else{ballFly(-26,ty+s*20,.3,2,()=>{b.hide=1});relief(sh,0);M.cx[ourSide()]=.4;SND.cheer(.35,1.4);endIn(1.3)}},{z1:tz})})}
function defWin(extra){const u=M.u;later(.5,()=>ps(u,'fist',1.3));M.A.filter(p=>p.t===0&&p!==u&&p.k!=='g').forEach((p,i)=>later(.6+i*.1,()=>ps(p,'clap',1)));M.cx[ourSide()]=.7;SND.cheer(.55,1.8);endIn(extra||1.8)}
function scTackle(q,kind){const u=M.u,X=M.R.X,T=M.R.T;M.car=X;go(X,214,200,95);
 later(.32,()=>{if(kind==='ok'){ps(u,q===2?'slide':'tackle',.9);go(u,226,201,230);later(.14,()=>{FX.burst(X.x,X.y,16,'grass',1.2);SND.thud();M.sk=.25;ballFly(T.x,T.y,.6,18,()=>{M.car=T});ps(X,'fall',.45);X.fd=1;later(.45,()=>ps(X,'down',1.2));defWin()})}
  else{ps(u,'slide',1);go(u,238,216,230);FX.burst(u.x,u.y,8,'grass');go(X,150,182,190);later(.55,()=>shotLeft(X,kind))}})}
function scIntercept(q,kind){const u=M.u,X=M.R.X,X2=M.R.X2,mx=208,my=164;M.car=X;ps(X,'pass',.4);go(X2,172,140,150);
 later(.14,()=>{SND.kick(.5);if(kind==='ok'){go(u,mx,my,300);ballFly(mx,my,.42,4,()=>{M.car=u;u.lf=0;go(u,300,170,150);M.sk=.15});defWin()}
  else{go(u,mx+14,my+18,210);ballFly(172,142,.5,4,()=>{M.car=X2;later(.15,()=>shotLeft(X2,kind))})}})}
function scShoulder(q,kind){const u=M.u,X=M.R.X;M.car=X;go(X,222,200,110);go(u,212,201,110);
 later(.26,()=>{ps(u,'shoulder',.5);ps(X,'shoulder',.5);FX.burst(217,202,8,'dust');FX.ring(217,200,'#fff8',120);SND.thud();M.sk=.3;
  if(kind==='ok'){later(.3,()=>{ps(X,'fall',.45);X.fd=-1;later(.45,()=>ps(X,'down',1));M.car=u;later(.25,()=>{ps(u,'kick',.5);u.f=1;kickFX(u,1.1);ballFly(470,160,.95,52,()=>{M.car=M.A[4]})});defWin(2)})}
  else later(.3,()=>{ps(u,'fall',.45);u.fd=-1;later(.45,()=>ps(u,'down',1.2));go(X,146,190,165);later(.45,()=>shotLeft(X,kind))})})}
/* ---- cenas de goleiro ---- */
function keeperShot(sh,cb,o={}){ps(sh,'windup',.3);sh.f=-1;sh.lf=1;later(.3,()=>{ps(sh,'kick',.6);kickFX(sh,o.pw||1.1);if(M.dec)M.ts=.42;cb()})}
function scParry(q,kind){const u=M.u,X=M.R.X,s=RN()<.5?-1:1;M.car=X;go(X,132,196,90);
 later(.25,()=>keeperShot(X,()=>{
  if(kind==='ok'){later(.05,()=>dive(u,s,'parry',24));ballFly(30,200+s*22,.42,6,()=>{M.ts=1;SND.thud();FX.burst(M.b.x,M.b.y-M.b.z,10,'spark');M.sk=.35;ballFly(8,200+s*90,.5,18,()=>{M.b.hide=1});
    later(1,()=>{u.rot=0;u.dv=null;ps(u,'fist',1.2)});relief(X,0);defWin(2)},{z1:8,hot:1})}
  else if(kind==='goal'){later(.12,()=>dive(u,-s,'dive',22));ballFly(9,200+s*20,.42,6,()=>{M.ts=1;scoreGoal(1,X,200+s*20);endIn(1.4,1)},{z1:6})}
  else{later(.1,()=>dive(u,s,'dive',20));ballFly(-10,200+s*60,.42,5,()=>{M.ts=1;ballFly(-30,200+s*70,.2,1,()=>{M.b.hide=1});relief(X,0);SND.cheer(.35,1.4);endIn(1.3)},{z1:5})}}))}
function scRush(q,kind){const u=M.u,X=M.R.X;M.car=X;go(X,128,196,90);go(u,96,197,240);u.lf=1;
 later(.3,()=>{if(kind==='ok'){dive(u,1,'smother',4,3,.25);u.dv.r=0;go(u,118,197,200);later(.2,()=>{M.car=u;M.hold=true;FX.burst(X.x,X.y,10,'grass');SND.thud();ps(X,'fall',.45);X.fd=1;later(.45,()=>ps(X,'down',1));later(1,()=>{u.dv=null;u.rot=0;ps(u,'fist',1)});defWin(2)})}
  else{ps(X,'kick',.6);SND.kick(.8);later(.1,()=>{ps(u,'parry',.6);u.z=0});const goal=kind==='goal',ty=200+(RN()-.5)*20;if(M.dec)M.ts=.5;
   ballFly(goal?9:12,ty,.75,42,()=>{M.ts=1;if(goal){scoreGoal(1,X,ty);endIn(1.4,1)}else{ballFly(-20,ty,.25,4,()=>{M.b.hide=1});relief(X,0);SND.cheer(.35,1.4);endIn(1.3)}},{z1:goal?10:32})}})}
function scCatch(q,kind){const u=M.u,X=M.R.X,X2=M.R.X2;M.car=X;go(X,134,195,90);
 later(.25,()=>keeperShot(X,()=>{
  if(kind==='ok'){later(.08,()=>ps(u,'catch',null));ballFly(u.x+5,u.y+1,.42,5,()=>{M.ts=1;M.car=u;M.hold=true;SND.thud();FX.ring(u.x+5,u.y-10,'#fff',90);later(.8,()=>ps(u,'fist',1.1));relief(X,0);defWin(1.9)},{z1:10})}
  else{later(.08,()=>ps(u,'catch',.5));ballFly(u.x+6,u.y+1,.4,5,()=>{M.ts=1;SND.thud();M.sk=.2;ps(u,'fall',.45);u.fd=-1;
   if(kind==='goal'){go(X2,64,186,230);ballFly(64,188,.4,4,()=>{M.car=X2;later(.05,()=>{ps(X2,'kick',.5);X2.f=-1;SND.kick(.6);ballFly(9,192,.25,2,()=>{scoreGoal(1,X2,192);endIn(1.4,1)},{z1:4})})})}
   else{ballFly(10,120,.5,10,()=>{M.b.hide=1});relief(X,0);SND.cheer(.3,1.2);endIn(1.4)}},{z1:10})}}))}
/* ---- gols automáticos entre os lances ---- */
function autoEv(){const hp=.1+CL[S.club].t*.03+S.morale/1500,ap=.1+CL[M.oi].t*.045;let t='';
 if(RN()<hp){M.s[0]++;const n=sqd(S.club)[4].n;t='Gol do '+CL[S.club].n+' ('+n+').';fastGoal(0,n)}else if(RN()<ap){M.s[1]++;const n=sqd(M.oi)[4].n;t='Gol do '+M.o+' ('+n+').';fastGoal(1,n)}
 M.msg=t||'Lance de perigo!';if(t)M.log.push([Math.floor(M.min),t,0]);sc()}
function fastGoal(side,n){const net=M.net[side?0:1];net.t=0;net.a=6;net.y=200;SND.net();const us=ourSide(),fans=side===0?us:1-us;M.cx[fans]=1;M.boo[1-fans]=.6;SND.cheer(.7,2.2);banner(side?'GOL DO RIVAL':'GOL DO TIME',n,side?'#ff5a5f':'#3ddc84',1.4)}
/* ---- fim ---- */
function mend(){M.ph='end';SND.whistle(3);const s=M.s,w=s[0]>s[1],dr=s[0]===s[1],st=M.st;M.n=C(M.rt+(w?.4:dr?0:-.2),3,10).toFixed(1);$('mv').innerHTML='';
 M.A.forEach(p=>{resetActor(p);p.lock=1;p.tx=null;const won=dr?0:(p.t===0)===w;ps(p,dr?(RN()<.5?'tired':'clap'):won?pickR(['celebrate','clap','fist','point']):pickR(['sad','tired','frustrated']),null)});
 if(w){M.cx[ourSide()]=1;SND.cheer(.8,3)}else if(!dr&&M.E.home)SND.boo();
 const n=+M.n,rc=n>=8?'var(--gr)':n>=6.5?'var(--yl)':n>=5?'var(--or)':'var(--rd)';
 $('res').classList.remove('hidden');
 $('res').innerHTML=`<h2>${icon('star')} ${w?'Vitória':dr?'Empate':'Derrota'}</h2><div class="score"><div><img src="${kitBadge(S.club)}" alt="">${CL[S.club].n}</div><b>${s[0]} x ${s[1]}</b><div><img src="${kitBadge(M.oi)}" alt="">${M.o}</div></div>
 <div class="row"><div><span class="rating" style="background:${rc}">${M.n}</span> <span class="mt">sua nota</span>${n>=8?' <span class="tag" style="color:var(--yl)">MELHOR EM CAMPO</span>':''}</div><div class="g4" style="flex:1;min-width:220px;grid-template-columns:repeat(3,1fr)"><div><small>Gols</small><b>${st.g}</b></div><div><small>Assist.</small><b>${st.a}</b></div><div><small>Salvos</small><b>${st.tk}</b></div></div></div>
 <div class="lg" style="margin-top:10px">${M.log.map(l=>`<p><i>${l[0]}'</i><span class="${l[2]>0?'gr':l[2]<0?'rd':''}">${l[1]}</span></p>`).join('')||'<p class="mt">Jogo sem grandes lances.</p>'}</div>
 <p></p><button class="go" id="fin2" style="width:100%">Concluir partida</button>`;$('fin2').onclick=mfin}
function mfin(){const s=M.s,w=s[0]>s[1],dr=s[0]===s[1],st=M.st,n=+M.n;
 S.G++;S.Gl+=st.g;S.A+=st.a;S[w?'W':dr?'D':'L']++;S.energy=C(S.energy-25,0,100);S.rep+=(w?8:dr?4:2)+st.g*3+st.a*2+(n>=8?3:0);S.money+=(w?80:40)+S.sal;S.morale=C(S.morale+(w?7:dr?2:-4),0,100);if(n>=8)S.sp++;
 S.hist.unshift({o:M.o,s:s[0]+' x '+s[1],n:M.n,r:w?'V':dr?'E':'D',g:st.g});S.hist=S.hist.slice(0,30);feed(`${w?'Vitória':dr?'Empate':'Derrota'} contra ${M.o} (${s[0]} x ${s[1]}). Nota ${M.n}.`);
 tr(S.club,M.oi,s[0],s[1]);const rest=CL.map((_,i)=>i).filter(i=>i!==S.club&&i!==M.oi).sort(()=>RN()-.5);for(let i=0;i+1<rest.length;i+=2)tr(rest[i],rest[i+1],gl(rest[i]),gl(rest[i+1]));
 if(++S.rd>=CL.length-1){const pos=table().indexOf(S.club)+1;S.rep+=Math.max(0,13-pos)*3;S.money+=(13-pos)*30;feed(`Fim do Brasileirão ${S.season}: ${pos}º lugar.`);S.season++;S.age++;S.rd=0;S.tab=mkTab();S.G=S.Gl=S.A=S.W=S.D=S.L=0;const N=LV[S.lvl+1];if(N&&S.rep>=N.need){S.lvl++;feed('Promoção! Você subiu para o '+N.n+'.')}}
 cancelAnimationFrame(M.raf);clearTimeout(M.tm);SND.ambStop();M=null;FX.clear();$('arena').classList.add('hidden');sv();rd();page('home');scrollTo(0,0)}
