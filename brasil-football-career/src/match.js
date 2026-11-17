/* ================= 11. PARTIDA =================
   Fases: intro → run (relógio avança) → pick (escolha) → time (barra) → fly (cena) → res → … → end (+ so: pênaltis).
   Os lances "jog_*" mantêm a lógica de chances original; os demais tipos têm resolução própria. */
let mt=0,fpsA=16;const SPD=Math.max(1,+(new URLSearchParams(location.search).get('speed'))||1); // ?speed= só para testes automáticos
const IM={};for(const k in IMG){IM[k]=new Image();IM[k].src=IMG[k]}
const sc=()=>{$('sc').textContent=M.s[0]+' x '+M.s[1]};
const cpos=()=>.5+.5*Math.sin((performance.now()-M.t0)/1000*M.z.sp);
const ourSide=()=>M.E.home?0:1;
/* ---- atores ---- */
const go=(p,x,y,spd=120)=>{p.tx=x;p.ty=y;p.spd=spd};
const ps=(p,n,d=null)=>{p.pose=n;p.pt=0;p.pd=d;if(n==='fall'&&M&&p===M.u)M.falls++};
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
/* ---- situações (mudam a opção mais indicada) ---- */
const SIT={
 a:[{id:'cara',t:'Cara a cara com o goleiro',d:'Você escapou da marcação!',m:[1.25,1,.85],w:[.04,0,-.02]},{id:'marcado',t:'Marcação colada',d:'O zagueiro está no seu cangote.',m:[.8,.95,1.2],w:[-.03,-.01,.03]},
    {id:'fora',t:'Na entrada da área',d:'Longe do gol, mas com espaço.',m:[.8,1,1.15],w:[-.02,.02,.02]},{id:'contra',t:'Contra-ataque',d:'Campo aberto na sua frente!',m:[1,1.2,1.1],w:[0,.03,.01]},{id:'umum',t:'Um contra um',d:'Só você e o zagueiro na ponta.',m:[.9,1.2,.95],w:[-.01,.03,0]}],
 d:[{id:'drible',t:'Atacante driblador',d:'Ele gosta de cortar para dentro.',m:[.85,1.05,1.15],w:[-.02,0,.02]},{id:'veloz',t:'Contra-ataque rival',d:'O ponta vem em velocidade.',m:[.9,1.2,.9],w:[0,.03,-.01]},
    {id:'alto',t:'Bola alta na área',d:'Cruzamento procurando o centroavante.',m:[.8,1,1.25],w:[-.02,0,.03]},{id:'ultimo',t:'Último homem',d:'Se errar, é gol. Não pode falhar.',m:[1.1,.95,1],w:[.02,-.01,0]}],
 g:[{id:'longe',t:'Chute de longe',d:'Bomba de fora da área!',m:[1.2,.7,1.05],w:[.03,-.03,.01]},{id:'cara',t:'Cara a cara',d:'O atacante está sozinho contra você.',m:[.9,1.25,.8],w:[-.01,.03,-.02]},
    {id:'colocado',t:'Chute colocado',d:'Bola indo no cantinho.',m:[1.15,.9,.85],w:[.02,0,-.02]}]};
const pickSit=r=>{let L=SIT[r];if(r==='a'&&S.style==='Velocista'&&RN()<.3)return L[3];return pickR(L)};
const sitTag=m=>m>=1.1?['FAVORÁVEL','gr']:m<=.9?['DIFÍCIL','rd']:['NORMAL','mt'];
const REFK={p:'plain',a:'#151515',b:'#ffd400',c2:'#ffd400',sh:'#151515',so:'#151515',nm:'#ffd400',gk:'#151515'};
/* ---- tipos de lance ----
   jog_*: lances com situação (lógica de chances original). Os demais têm resolução própria. */
const MT={
 jog_a:{r:'a',opts:OPT.a},jog_d:{r:'d',opts:OPT.d},jog_g:{r:'g',opts:OPT.g},
 fk:{r:'a',t:'Falta direta',d:'Bola parada perto da área, barreira armada.',q:'Você vai para a cobrança!',opts:[['Por cima da barreira','shoot',.55,'Curva no ângulo'],['Rasteiro no canto','shoot',.62,'Surpreende o goleiro'],['Jogada ensaiada','pass',.42,'Rola para o companheiro']]},
 ck_a:{r:'a',t:'Escanteio a favor',d:'A bola vai na área. Onde você ataca?',q:'Escolha onde atacar a bola',opts:[['Primeira trave','speed',.5,'Antecipa o zagueiro'],['Segunda trave','physical',.5,'Disputa no alto'],['Entrada da área','shoot',.55,'Pega o rebote de primeira']]},
 ck_d:{r:'d',t:'Escanteio contra',d:'O rival vai cobrar. Como você marca?',q:'Defenda a bola aérea',opts:[['Marcar por zona','defense',.45,'Protege o espaço'],['Marcação individual','physical',.5,'Gruda no centroavante'],['Antecipar na 1ª trave','speed',.5,'Corta antes de todos']]},
 ck_g:{r:'g',t:'Escanteio contra',d:'Bola alta na sua área!',q:'Como você sai do gol?',opts:[['Sair no soco','physical',.5,'Afasta de punho'],['Agarrar no alto','defense',.55,'Segura a bola'],['Ficar na linha','speed',.42,'Reflexo no cabeceio']]},
 pen_a:{r:'a',t:'Pênalti!',d:'A responsabilidade é sua. O goleiro vai tentar adivinhar o canto.',q:'Escolha o canto e acerte o tempo',opts:[['Canto esquerdo','shoot',.5,'O goleiro pode adivinhar'],['No meio','shoot',.45,'Arriscado se ele ficar parado'],['Canto direito','shoot',.5,'O goleiro pode adivinhar']]},
 pen_g:{r:'g',t:'Pênalti contra',d:'É você contra o batedor.',q:'Para onde você pula?',opts:[['Pular à esquerda','defense',.5,'Aposta no canto'],['Ficar no meio','physical',.42,'Espera a cavadinha'],['Pular à direita','defense',.5,'Aposta no canto']]},
 late_a:{r:'a',t:'Abafa nos minutos finais',d:'O tempo está acabando e o time precisa do gol!',q:'Tudo ou nada!',opts:[['Chute de longe','shoot',.6,'Bomba de fora da área'],['Cruzar na área','pass',.45,'Procura o centroavante'],['Cavar a falta','dribble',.42,'Ganha uma bola parada']]},
 late_d:{r:'d',t:'Pressão do rival no fim',d:'O adversário vem com tudo.',q:'Segure o resultado!',opts:[['Dar um chutão','physical',.4,'Alivia o perigo'],['Segurar a bola','dribble',.5,'Gasta o tempo'],['Falta tática','defense',.35,'Para o ataque, mas pode dar cartão']]},
 tac:{r:'t',t:'Decisão do time',d:'O capitão pergunta como o time deve jogar agora.',q:'Como o time joga a partir de agora?',opts:[['Pressionar alto','physical',0,'Mais chances para os dois lados. Cansa mais.'],['Tocar a bola','pass',0,'Controle do jogo e mais confiança.'],['Fechar a defesa','defense',0,'Menos gols sofridos (e feitos).']],nt:1}};
const POSI=[['Avançado',.15],['Equilibrado',0],['Recuado',-.15]];
function chooseType(){const late=M.min>=80,dif=M.s[0]-M.s[1];if(M.q2){const t=M.q2;M.q2=null;return t}
 if(role()==='g'){const r=RN();return late&&dif>0&&r<.3?'jog_g':r<.12?'ck_g':r<.2?'pen_g':'jog_g'}
 const pA=C((role()==='a'?.78:.25)+POSI[M.posi][1],.1,.9),a=RN()<pA,r=RN();
 if(a){if(late&&dif<=0&&r<.4)return 'late_a';return r<.15?'ck_a':r<.25?'fk':'jog_a'}
 if(late&&dif>=1&&r<.4)return 'late_d';return r<.16?'ck_d':'jog_d'}
/* ---- dificuldade e chances (mesma base da 2.0 + contexto) ---- */
const mopt=i=>M.mt.opts[i];
function zoneW(i){const o=mopt(i),s=M.sit,st=STY[S.style]||{a:[]};let w=.1+S.attrs[o[1]]/100*.28+M.cf*.06+S.energy/1000-o[2]*.1-CL[M.oi].t*.02;
 w+=-S.lvl*.025+(s?s.w[i]:0)-(100-M.sta)/100*.06+[0,.015,.03][S.inv.boot|0]+(st.a.includes(o[1])?.02:0)+(S.morale-50)/1000+(S.pers==='Temperamental'&&M.cls?.02:0);return C(w,.06,.4)}
const zoneSp=i=>3+mopt(i)[2]*4+S.lvl*.5+CL[M.oi].t*.35+(M.dec?.6:0);
const sitMul=i=>(M.sit?M.sit.m[i]:1)*(specs().includes(mopt(i)[1])?1.07:1);
/* ---- início ---- */
function startMatch(fx,mode='full',posi=1){if(M||!fx||fx.bye)return;const oi=fx.opp,my=fx.my,E=envOf(fx),r=role(),hc=E.home?my:oi,ac=E.home?oi:my;
 const mk=(t,x,y,k)=>({t,x,y,hx:x,hy:y,k,ph:RN()*6,f:t?-1:1,v:0,rp:RN()*6,pt:0,z:0,rot:0,cur:'idle',sp0:95+RN()*35,idle:k==='g'?'gkready':null});
 const A=[mk(0,38,200,'g'),mk(0,160,110),mk(0,160,290),mk(0,290,200),mk(0,300,130),mk(1,682,200,'g'),mk(1,560,110),mk(1,560,290),mk(1,430,160),mk(1,430,250),mk(2,360,250,'r')];
 const own=sqd(my),op=sqd(oi),ui0=r==='g'?0:3;
 A.forEach((p,i)=>{if(i===10){p.nm='Árbitro';p.num=0;p.look=lookOf('ref'+S.wk);return}const q=i<5?own[i]:op[i-5];p.nm=q.n;p.num=q.num;p.pos=q.pos;p.look=lookOf(q.n+(i<5?my:oi))});
 const u=A[ui0];u.nm=S.name;u.num=S.num;u.look=userLook();u.me=1;u.pos=S.pos;
 const mm=[];if(mode==='sub'){for(let i=0;i<3;i++)mm.push({m:63+i*9+Math.round(RN()*5)});mm.push({m:72,ty:'tac'})}else{for(let i=0;i<7;i++)mm.push({m:Math.round(6+i*12+RN()*8)});mm.push({m:35,ty:'tac'},{m:68,ty:'tac'})}mm.sort((a,b)=>a.m-b.m);
 M={fx,my,oi,o:CL[oi].n,s:[0,0],min:0,i:0,mm,ph:'intro',st:{g:0,a:0,tk:0},rt:6,cf:S.morale/100+(S.inv.psi?.1:0),A,b:{x:360,y:200,z:0,rot:0},msg:'Os times entram em campo...',mode,posi,
  E,u,ref:A[10],K:[kitOf(my),kitOf(oi,my),REFK],ST:buildStadium(E,hc,ac),cam:{x:360,y:250,z:1},camT:{x:360,y:250,z:1},cx:[0,0],boo:[0,0],net:[{t:9,a:0,y:200},{t:9,a:0,y:200}],it:0,ck:0,tq:[],ts:1,lb:0,sk:0,fl:0,ban:null,log:[],car:null,ct:1,wv:null,cls:E.cls||E.fin,
  sta:C(40+S.energy*.6,25,100),e0:S.energy,falls:0,yc:0,red:0,out:mode==='sub',tac:[0,0],xpg:{},q2:null,rv:S.rv&&S.rv.c===oi?S.rv.b:0};
 M.cf=Math.min(1,M.cf);M.kb=[0,1].map(i=>{const im=new Image();im.src=kitBadge(i?oi:my);return im});if(M.out){u.lock=1;u.x=u.hx=360;u.y=u.hy=404}
 FX.clear();$('pitch').onclick=skipIntro;showMatch(true);
 $('res').classList.add('hidden');$('k0').src=kitBadge(my);$('k1').src=kitBadge(oi);$('n0').textContent=CL[my].n;$('n1').textContent=M.o;
 $('vs').textContent=fx.label+' · '+envTxt(E);sc();$('ev').textContent='';ui();SND.ambStart();scrollTo(0,0);mt=0;M.raf=requestAnimationFrame(mloop)}
function skipIntro(){if(!M||M.ph!=='intro')return;if(M.it<3.2)M.it=3.2;else if(M.it<6.2){M.it=6.2;walkIn()}else kickoff()}
function walkIn(){if(M.wk)return;M.wk=1;M.A.forEach((p,i)=>{if(p.k==='r'){p.x=360;p.y=420;go(p,360,250,62);return}p.x=350+(i>=5?24:0)+(i%5)*3;p.y=412+(i%5)*9;const l=p.lock;resetActor(p);p.lock=l;go(p,p.hx,p.hy,62)});M.cx=[.7,.5];SND.cheer(.6,2.5);for(let i=0;i<30;i++)FX.burst(360,-20,1,'conf')}
function kickoff(){M.wk=1;M.A.forEach(p=>{const l=p.lock;resetActor(p);p.lock=l;p.x=p.hx;p.y=p.hy;p.tx=null});M.b={x:360,y:200,z:0,rot:0};M.car=M.A[4];M.ph='run';M.msg=M.out?'Você começa no banco. Fique pronto!':'Apita o árbitro!';ps(M.ref,'whistle',.6);SND.whistle(1);ui()}
/* ---- loop ---- */
function mloop(t){if(!M)return;const rdt=Math.min(.05,(t-mt)/1000||0),dt=rdt*SPD;mt=t;fpsA=fpsA*.95+rdt*1000*.05;if(!LQ&&fpsA>26&&M.min>2){LQ=1}
 if(M.ph==='intro'){M.it+=dt;if(M.it>=6.2&&!M.wk)walkIn();if(M.it>=9)kickoff()}
 if(M.ph==='run'){const e=M.mm[M.i],tg=e?e.m:90;M.min=Math.min(tg,M.min+dt*10);
  if(M.out&&M.mode==='sub'&&!M.red&&M.min>=60){M.out=false;const u=M.u;u.lock=0;u.hx=290;u.hy=200;go(u,290,200,120);banner('SUBSTITUIÇÃO','Você entra em campo!','#3ddc84',1.6);ps(M.ref,'whistle',.6);SND.whistle(1);M.msg='Você entrou no jogo!';ui()}
  if(M.min>=tg){if(!e)mend();else if(M.out||(e.ty==='tac'&&M.red)){if(!e.ty)autoEv();M.i++}else{if(!e.ty)autoEv();M.ph='pick';setupMoment(e.ty==='tac'?'tac':null);ui()}}}
 if(M.ph==='time'){const c=$('cur');if(c)c.style.left=cpos()*100+'%'}
 $('clk').textContent=M.ph==='so'||M.ph==='sop'?'PÊN':Math.floor(M.min)+"'";
 const sdt=dt*M.ts;M.ck+=sdt;M.tq.sort((a,b)=>a.t-b.t);while(M&&M.tq.length&&M.tq[0].t<=M.ck)M.tq.shift().fn();if(!M)return;
 if(M.ph==='run'||(M.ph==='res'&&!M.cel))ambient(sdt);
 for(const p of M.A)actUpd(p,sdt);ballUpd(sdt);FX.upd(sdt);
 for(const n of M.net)n.t+=dt;M.cx=M.cx.map(v=>Math.max(0,v-dt*.25));M.boo=M.boo.map(v=>Math.max(0,v-dt*.35));M.sk=Math.max(0,M.sk-dt*1.4);M.fl=Math.max(0,M.fl-dt*2.5);
 if(M.ban){M.ban.t+=dt;if(M.ban.t>M.ban.d)M.ban=null}
 if(M.ph==='run'&&M.wv==null&&RN()<dt*.05)M.wv=-40;if(M.wv!=null){M.wv+=dt*260;if(M.wv>W+40)M.wv=null}
 M.lb=lerp(M.lb,(M.ph==='fly'&&M.dec)||M.ph==='pick'||M.ph==='time'||M.ph==='so'||M.ph==='sop'?1:0,1-Math.exp(-dt*6));
 camUpd(dt);SND.ambLvl(Math.max(M.cx[0],M.cx[1],(M.ph==='time'||M.ph==='pick')?.3:0));
 mdraw(t,dt);M.raf=requestAnimationFrame(mloop)}
function camUpd(dt){const c=M.cam,T=M.camT,b=M.b,u=M.u;
 if((M.ph==='pick'||M.ph==='time')&&M.mt&&M.mt.r!=='t'){T.z=1.75;T.x=u.x+(M.mt.r==='a'?34:22);T.y=u.y+OY-12}
 else if(M.ph==='fly'||M.ph==='so'||M.ph==='sop'){T.z=M.dec?1.6:1.4;T.x=lerp(u.x,b.x,M.ph==='fly'?.65:1);T.y=lerp(u.y,b.y,M.ph==='fly'?.6:1)+OY-10}
 else if(M.ph==='res'&&M.cel){T.z=1.55;T.x=M.cel.x;T.y=M.cel.y+OY-14}
 else if(M.ph==='run'){T.z=1.12;T.x=b.x;T.y=b.y+OY}
 else{T.z=1;T.x=360;T.y=250}
 const k=1-Math.exp(-dt*(M.ph==='fly'?5:3.2));c.z=lerp(c.z,T.z,k);const hw=W/2/c.z,hh=H/2/c.z;c.x=C(lerp(c.x,T.x,k),hw,W-hw);c.y=C(lerp(c.y,T.y,k),hh,H-hh)}
/* ---- árbitro ---- */
function refCall(x,y,card,txt){const R=M.ref;R.lock=1;go(R,x-24,y+26,170);later(.35,()=>{ps(R,'whistle',.5);SND.whistle(1)});if(card)later(.9,()=>{R.cardc=card==='red'?'#ff3030':'#ffd400';ps(R,'card',1.5);banner(card==='red'?'CARTÃO VERMELHO':'CARTÃO AMARELO',txt||'',card==='red'?'#ff3030':'#ffd400',1.5)});later(2.4,()=>{R.lock=0})}
function myCard(){M.yc++;S.yc=(S.yc|0)+1;const red=M.yc>=2;refCall(M.u.x,M.u.y,red?'red':'yellow',S.name);
 if(red){M.red=1;M.out=true;M.rt-=1.5;S.susp=1;S.yc=0;M.log.push([Math.floor(M.min),'Expulso! Segundo amarelo.',-1]);later(2.6,()=>{const u=M.u;resetActor(u);u.lock=1;go(u,360,410,60);ps(u,'sad',null)})}
 else{M.rt-=.3;M.log.push([Math.floor(M.min),'Cartão amarelo para você.',0]);if(S.yc>=3){S.susp=1;S.yc=0;M.log.push([Math.floor(M.min),'Terceiro amarelo: suspenso no próximo jogo.',0])}}}
/* ---- jogo ambiente (entre os lances) ---- */
function ambient(dt){const A=M.A,b=M.b,late=M.min>70,R=M.ref;
 if(!R.lock&&!R.pose)go(R,C(b.x-50,60,660),C(b.y+46,40,370),105);
 const pl=A.filter(p=>p.k!=='r'&&!p.lock);
 if(!M.car&&!b.fl&&!(b.vx||b.vy)){let best=null,bd=1e9;for(const p of pl){if(p.k==='g')continue;const d=Math.hypot(p.x-b.x,p.y-b.y);if(d<bd){bd=d;best=p}}if(best){go(best,b.x,b.y,150);if(bd<10)M.car=best}}
 if(!M.car&&!b.fl&&(b.vx||b.vy)){let best=null,bd=1e9;for(const p of pl){const d=Math.hypot(p.x-b.x,p.y-b.y);if(d<bd){bd=d;best=p}}if(best){go(best,b.x,b.y,160);if(bd<10){M.car=best;b.vx=b.vy=0}}}
 const car=M.car&&!M.car.lock?M.car:null;
 for(const p of pl){if(p.pose)continue;
  if(p.k==='g'){const gx=p.t?684:36;go(p,gx,C(200+(b.y-200)*.3,176,224),70);p.idle=Math.abs(b.x-gx)<320?'gkready':'idle';continue}
  if(p===car){const gx=p.t?120:600;go(p,C(p.x+(gx-p.x)*.5,130,590),C(p.y+Math.sin(M.ck*1.3+p.ph)*40,60,340),p.sp0*.85);continue}
  const ch=car&&car.t!==p.t&&pl.filter(q=>q.t===p.t&&q.k!=='g').sort((a,c)=>Math.hypot(a.x-car.x,a.y-car.y)-Math.hypot(c.x-car.x,c.y-car.y))[0]===p;
  if(ch){go(p,car.x-(car.f||1)*10,car.y,p.sp0*.9);continue}
  go(p,C(p.hx+(b.x-360)*.38+Math.sin(M.ck*.7+p.ph)*16,40,680),C(p.hy+(b.y-200)*.25+Math.cos(M.ck*.6+p.ph)*12,30,370),p.sp0*(late?.8:1));
  p.idle=late&&(p.ph>4.4)?'tired':null}
 if(!car)return;M.ct-=dt;
 if(M.ct<=0){M.ct=.7+RN()*1;const opp=pl.filter(q=>q.t===1-car.t&&q.k!=='g'),near=opp.sort((a,c)=>Math.hypot(a.x-car.x,a.y-car.y)-Math.hypot(c.x-car.x,c.y-car.y))[0],r=RN();
  if(near&&Math.hypot(near.x-car.x,near.y-car.y)<40&&r<.3){
   const foul=RN()<.3;ps(near,foul?'slide':'tackle',.6);go(near,car.x,car.y,220);FX.burst(car.x,car.y,10,'grass');SND.thud();
   if(foul){ps(car,'fall',.45);car.fd=-1;later(.45,()=>ps(car,'down',.9));refCall(car.x,car.y,RN()<.25?'yellow':null,near.nm);M.car=null;b.vx=b.vy=0;M.ct=1.8;M.msg='Falta! O árbitro marca.';if(M.ph==='run')ui()}
   else{M.car=near;M.ct=.9}}
  else{const mates=pl.filter(q=>q.t===car.t&&q!==car&&q.k!=='g');if(mates.length){const q=pickR(mates),long=Math.hypot(q.x-car.x,q.y-car.y)>160;ps(car,'pass',.3);const c0=car;
   later(.12,()=>{if(M.car!==c0)return;SND.kick(.4);ballFly(q.x+(q.t?-8:8),q.y,long?.7:.42,long?26:4,()=>{if(!q.lock)M.car=q})})}}}}
/* ---- montagem do lance ---- */
function setupMoment(ty){const A=M.A,u=M.u,P=(i,x,y,f)=>{const p=A[i];resetActor(p);go(p,x,y,200);if(f)p.f=f,p.lf=1};
 M.dec=M.min>=70&&Math.abs(M.s[0]-M.s[1])<=1;M.cel=null;M.tq=[];const t=ty||chooseType();M.mt=MT[t];M.mtk=t;M.sit=null;
 if(t==='tac'){banner('DECISÃO DO TIME',`${Math.floor(M.min)}'`,'#3b7bff',1.2);SND.ui(500);return}
 M.sta=Math.max(15,M.sta-6);const r=M.mt.r;if(t.startsWith('jog'))M.sit=pickSit(r);const sid=M.sit&&M.sit.id;
 const R=M.ref;resetActor(R);
 if(t==='jog_a'||t==='late_a'||t==='fk'){P(3,540,200,1);P(8,590,204,-1);P(5,686,200,-1);P(4,604,132);P(1,380,120);P(2,400,300);P(0,60,200);P(6,624,300);P(7,566,112);P(9,500,284);M.R={r,u:A[3],D:A[8],K:A[5],T:A[4]};A[8].idle='guard';
  if(sid==='cara'){P(3,560,196,1);P(8,500,214,1)}else if(sid==='fora'||t==='late_a'){P(3,470,200,1);P(8,520,204,-1)}else if(sid==='contra'){P(3,430,210,1);P(8,480,180,-1);P(4,470,120)}
  if(t==='fk'){P(3,512,204,1);P(8,580,192,-1);P(7,580,202,-1);P(9,580,212,-1);[8,7,9].forEach(i=>A[i].idle='guard')}go(R,470,270,200)}
 else if(t==='ck_a'){P(4,700,378,-1);P(3,640,214,1);P(8,652,206,-1);P(5,690,200,-1);P(1,620,170);P(2,600,250);P(6,664,180);P(7,630,240);P(9,560,200);P(0,120,200);M.R={r,u:A[3],D:A[8],K:A[5],T:A[4]};go(R,560,300,200)}
 else if(t==='pen_a'){P(3,622,200,1);P(5,696,200,-1);[1,2,4,6,7,8,9].forEach((i,k)=>P(i,592-(k%2)*6,110+k*28));P(0,60,200);M.R={r,u:A[3],K:A[5]};go(R,600,260,200)}
 else if(t==='jog_d'||t==='late_d'){P(3,196,204,1);P(9,252,198,-1);P(8,232,120);P(0,34,200,1);P(2,240,300);P(1,128,142);P(4,320,250);P(5,686,200);P(6,360,300);P(7,330,100);M.R={r,u:A[3],X:A[9],X2:A[8],K:A[0],T:A[2]};u.idle='guard';go(R,280,270,200)}
 else if(t==='ck_d'||t==='ck_g'){P(6,20,378,1);P(9,84,206,-1);P(0,30,200,1);if(t==='ck_d')P(3,92,212,-1);else P(3,140,250);P(8,110,180);P(1,96,170);P(2,120,240);P(7,140,210);P(4,200,200);P(5,686,200);M.R={r,u,X:A[9],K:A[0],T:A[2],TK:A[6]};go(R,180,300,200)}
 else if(t==='pen_g'){P(0,30,200,1);P(9,98,200,-1);[1,2,3,4,6,7,8].forEach((i,k)=>P(i,128+(k%2)*6,110+k*28));P(5,686,200);M.R={r,u,X:A[9],K:A[0]};go(R,120,260,200)}
 else{P(0,34,200,1);P(9,150,192,-1);P(8,172,110);P(1,108,240);P(2,210,300);P(3,250,190);P(4,300,120);P(5,686,200);P(6,300,300);P(7,262,80);M.R={r,u,X:A[9],X2:A[8],D:A[1],K:A[0]};u.idle='gkready';
  if(sid==='longe')P(9,230,196,-1);else if(sid==='cara')P(9,120,198,-1);go(R,220,280,200)}
 const car=t==='ck_a'?A[4]:t==='ck_d'||t==='ck_g'?A[6]:r==='a'?u:M.R.X;later(.35,()=>{if(M.ph==='pick'||M.ph==='time'){car.x=car.tx;car.y=car.ty;M.car=car;M.b.vx=M.b.vy=0;M.b.fl=null}});
 ballFly(car.tx+(car.f||1)*7,car.ty+2,.35,10);M.cx=[.15,.15];
 banner(M.dec?'LANCE DECISIVO':'SEU LANCE',`${Math.floor(M.min)}' · ${M.sit?M.sit.t:M.mt.t}`,M.dec?'#ff5a5f':'#ffd400',1.4);SND.ui(M.dec?330:660)}
function banner(txt,sub,col='#ffd400',d=1.8,big=0){M.ban={txt,sub,col,d,big,t:0}}
/* ---- escolha e barra ---- */
function pick(i){if(!M||(M.ph!=='pick'&&M.ph!=='sop'))return;M.o_=i;
 if(M.mt.nt){resolveTac(i);return}
 M.z={c:.2+RN()*.6,w:zoneW(i),sp:zoneSp(i)};M.t0=performance.now();M.ph=M.ph==='sop'?'sot':'time';SND.ui(700);if(M.mt.r==='a'&&M.mtk!=='ck_a')M.u.idle=i===0?'windup':null;ui()}
function tap(){if(!M||(M.ph!=='time'&&M.ph!=='sot'))return;const d=Math.abs(cpos()-M.z.c),q=d<M.z.w/4?2:d<M.z.w/2?1:0;if(M.ph==='sot'){soUser(q);return}resolve(q)}
function xpGain(k,v){const u=addXP(k,v);if(u)M.xpg[k]=(M.xpg[k]||0)+u}
function resolveTac(i){const n=['Pressão alta','Posse de bola','Defesa fechada'][i];M.tac=[[.04,.03],[.01,0],[-.03,-.05]][i];if(i===0)M.sta=Math.max(15,M.sta-10);if(i===1)M.cf=Math.min(1,M.cf+.1);M.tacs=i;
 M.msg=`Time em ${n.toLowerCase()}.`;M.log.push([Math.floor(M.min),'Decisão do time: '+n,0]);M.ph='res';banner(n.toUpperCase(),'Instrução passada ao time','#3b7bff',1.2);ui();M.tm=setTimeout(next,900/SPD)}
function resolve(q){const r=M.mt.r,t=M.mtk,o=M.o_,st=M.st,ok=p=>RN()<p,okS=p=>RN()<Math.min(.97,p*sitMul(o)),late=M.min>=75,dif=M.s[0]-M.s[1];let g=0,txt,rt=0,kind,sc;
 if(t==='jog_a'){
  if(o===0){if(okS([.1,.5,.88][q])){g=1;st.g++;rt=1.3;txt='GOOOL! Você marcou!'}else{rt=q?.1:-.3;txt=q?'O goleiro defendeu!':'Chutou para fora.'}sc=()=>scShot(q,g)}
  else if(o===1){if(q&&okS(q===2?.6:.3)){g=1;st.g++;rt=1.5;txt='Driblou o zagueiro e fez o gol!';sc=()=>scDribble(q,g)}
   else if(q&&RN()<.35+(S.style==='Driblador'?.15:0)){rt=.2;txt='Você sofreu falta!';const pen=(M.sit.id==='cara'||M.sit.id==='marcado')&&RN()<.4;M.q2=pen?'pen_a':'fk';M.mm.splice(M.i+1,0,{m:Math.min(89,Math.floor(M.min)+1),ty:'q'});sc=()=>scFouled(pen)}
   else{rt=q?0:-.3;txt=q?'Passou pelo marcador, mas finalizou mal.':'O marcador roubou a bola.';sc=()=>scDribble(q,g)}}
  else{if(q&&okS(q===2?.65:.3)){g=1;st.a++;rt=1.1;txt='Passe perfeito! Gol do companheiro!'}else{rt=q?.1:-.2;txt=q?'Passe certo, mas a jogada morreu.':'Passe interceptado.'}sc=()=>scPass(q,g)}}
 else if(t==='fk'){if(o<2){if(okS([[.04,.3,.6],[.06,.32,.62]][o][q])){g=1;st.g++;rt=1.5;txt='GOLAÇO DE FALTA!'}else{rt=q?.1:-.2;txt=q?'Que defesa do goleiro!':'Parou na barreira.'}sc=()=>scFK(o,q,g)}
  else{if(q&&okS(q===2?.55:.28)){g=1;st.a++;rt=1.1;txt='Jogada ensaiada perfeita! Assistência sua!'}else{rt=0;txt='A jogada ensaiada não funcionou.'}sc=()=>scPass(q,g)}}
 else if(t==='ck_a'){if(okS([[.05,.32,.55],[.05,.32,.55],[.04,.28,.5]][o][q])){g=1;st.g++;rt=1.4;txt=o<2?'GOL DE CABEÇA!':'Pegou de primeira e marcou!'}else{rt=q?.1:-.1;txt=q?'O goleiro salvou!':'A zaga afastou.'}sc=()=>scCornerA(o,q,g)}
 else if(t==='pen_a'){const gs=RN()<.42?0:RN()<.27?1:2;let res;if(q===0)res=RN()<.5?'miss':gs===o?'save':'goal';else if(q===1)res=gs===o&&(o===1||RN()<.75)?'save':'goal';else res=gs===o&&RN()<(o===1?.7:.45)?'save':'goal';
  if(res==='goal'){g=1;st.g++;rt=1.2;txt='Pênalti convertido!'}else{rt=-.6;txt=res==='save'?'O goleiro pegou o pênalti!':'Pênalti para fora!'}sc=()=>scPen('R',M.u,M.R.K,o,gs,res)}
 else if(t==='pen_g'){const sd=RN()<.42?0:RN()<.27?1:2;let res;if(RN()<.1)res='miss';else if(sd===o)res=RN()<(o===1?[.5,.85,1]:[.3,.7,.92])[q]?'save':'goal';else res=q===2&&RN()<.12?'save':'goal';
  if(res==='save'){st.tk++;rt=1.2;txt='PEGOU O PÊNALTI!';kind='ok'}else if(res==='miss'){rt=.2;txt='O batedor isolou!';kind='miss'}else{g=-1;rt=-.4;txt='Gol de pênalti do rival.';kind='goal'}
  sc=()=>scPen('L',M.R.X,M.u,sd,o,res)}
 else if(t==='late_a'){if(o===0){if(okS([.04,.2,.42][q])){g=1;st.g++;rt=1.6;txt='GOLAÇO DE FORA DA ÁREA!'}else{rt=q?.1:-.2;txt=q?'Passou perto!':'Isolou.'}sc=()=>shotRight(M.u,g?'goal':q?'save':'over',1.2)}
  else if(o===1){if(q&&okS(q===2?.5:.25)){g=1;st.a++;rt=1.2;txt='Cruzamento na medida! Gol!'}else{rt=0;txt='O cruzamento foi cortado.'}sc=()=>scPass(q,g)}
  else{if(okS([.2,.6,.85][q])){rt=.3;txt='Cavou a falta!';const pen=q===2&&RN()<.25;M.q2=pen?'pen_a':'fk';M.mm.splice(M.i+1,0,{m:Math.min(89,Math.floor(M.min)+1),ty:'q'});sc=()=>scFouled(pen)}else{rt=-.2;txt='O árbitro mandou seguir.';sc=()=>scDribble(0,0)}}}
 else{ // defesa e goleiro
  let p=[.12,.65,1][q],card=false;if(t==='late_d'){p=[[.25,.75,1],[.15,.6,.9],[.6,.9,1]][o][q];if(o===2&&RN()<Math.min(.95,[.9,.6,.3][q]*(S.pers==='Temperamental'?1.3:1)))card=true}
  if(okS(p)){st.tk++;rt=.6;txt=r==='g'?'Defesaça!':t==='late_d'&&o===1?'Segurou a bola no canto!':'Lance cortado!';kind='ok'}else if(ok(.65)){g=-1;rt=-.8;txt='Falha sua: o rival marcou.';kind='goal'}else{rt=-.2;txt='Você falhou, mas o rival errou o chute.';kind='miss'}
  if(!card&&r==='d'&&q===0&&RN()<(S.pers==='Temperamental'?.22:.12))card=true;if(card)later(1.2,myCard);
  if(t==='ck_d'||t==='ck_g')sc=()=>scCornerD(o,q,kind);else if(t==='late_d')sc=()=>[scShoulder,scTackle,scTackle][o](q,kind);
  else if(r==='d')sc=()=>[scTackle,scIntercept,scShoulder][o](q,kind);else sc=()=>[scParry,scRush,scCatch][o](q,kind)}
 if(g===1&&late&&dif<=0){rt+=.4;txt+=' Gol decisivo!'}if(kind==='ok'&&late&&dif>=0&&dif<=1){rt+=.2;txt+=' Salvou o resultado!'}
 xpGain(mopt(o)[1],10+q*10+(g===1||kind==='ok'?12:0));
 M.rt+=rt;M.cf=C(M.cf+(q?.12:-.1),0,1);M.msg=txt;M.q=q;M.log.push([Math.floor(M.min),txt,g]);M.ph='fly';
 FX.ring(M.u.x,M.u.y,q===2?'#ffd400':q?'#3ddc84':'#ff5a5f',140,.5);if(q===2){M.fl=.35;SND.tone(1320,.12,.04)}
 $('ev').textContent=q===2?'⚡ PERFEITO!':'';ui();sc()}
function finishScene(goal){if(!M||M.ph!=='fly')return;M.ts=1;M.ph='res';ui();M.tm=setTimeout(next,(goal?3100:2100)/SPD)}
function next(){if(!M||M.ph==='end')return;M.i++;M.ph='run';M.cel=null;M.tq=[];M.ts=1;$('ev').textContent='';M.msg=M.red?'Seu time segue com um a menos.':'O jogo segue.';M.b.hide=0;
 M.A.forEach(p=>{const keep=p.me&&M.out;resetActor(p);if(keep)p.lock=1});if(!M.car||M.car.lock){M.car=M.A[M.b.x<360?1:8];M.b.vx=M.b.vy=0}ui()}

/* ---- gols e reações ---- */
function scoreGoal(side,scorer,yy){M.s[side]++;sc();const n=M.net[side?0:1];n.t=0;n.a=7;n.y=yy;SND.net();M.sk=.7;if(!RM)M.fl=.5;
 const us=ourSide(),fans=side===0?us:1-us,big=M.cls?1.3:1;M.cx[fans]=Math.min(1.3,1*big);M.boo[1-fans]=.9;
 SND.cheer(fans===0||!M.E.home?big:.55,3.2);if(side===1&&M.E.home)later(.5,()=>SND.boo());
 const e=$('ev');e.textContent=side===0?'GOOOL!':'Gol do adversário';e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop');
 if(side===0){for(let i=0;i<(LQ?25:55);i++)FX.burst(side?30:690,200,1,'conf');if(M.cls||M.dec)for(let i=0;i<6;i++)later(i*.18,()=>FX.burst(80+RN()*560,-40-RN()*14,10,'spark',1.2))}
 banner(side===0?'GOOOL!':'GOL DO RIVAL',`${scorer?scorer.nm:''} ${Math.floor(M.min)}'`,side===0?'#ffd400':'#ff5a5f',2.4,1);celebrate(side,scorer)}
function celebrate(side,sc0){const A=M.A,cx=side===0?680:40,cy=sc0&&sc0.y<200?44:356,team=A.filter(p=>p.t===side),opp=A.filter(p=>p.t===1-side);M.cel=sc0||team[3];
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
function scParry(q,kind){const u=M.u,X=M.R.X,s=RN()<.5?-1:1;M.car=X;go(X,X.x-16,X.y+3,90);
 later(.25,()=>keeperShot(X,()=>{
  if(kind==='ok'){later(.05,()=>dive(u,s,'parry',24));ballFly(30,200+s*22,.42,6,()=>{M.ts=1;SND.thud();FX.burst(M.b.x,M.b.y-M.b.z,10,'spark');M.sk=.35;ballFly(8,200+s*90,.5,18,()=>{M.b.hide=1});
    later(1,()=>{u.rot=0;u.dv=null;ps(u,'fist',1.2)});relief(X,0);defWin(2)},{z1:8,hot:1})}
  else if(kind==='goal'){later(.12,()=>dive(u,-s,'dive',22));ballFly(9,200+s*20,.42,6,()=>{M.ts=1;scoreGoal(1,X,200+s*20);endIn(1.4,1)},{z1:6})}
  else{later(.1,()=>dive(u,s,'dive',20));ballFly(-10,200+s*60,.42,5,()=>{M.ts=1;ballFly(-30,200+s*70,.2,1,()=>{M.b.hide=1});relief(X,0);SND.cheer(.35,1.4);endIn(1.3)},{z1:5})}}))}
function scRush(q,kind){const u=M.u,X=M.R.X;M.car=X;go(X,X.x-20,X.y+3,90);go(u,Math.min(96,X.x-38),X.y+3,240);u.lf=1;
 later(.3,()=>{if(kind==='ok'){dive(u,1,'smother',4,3,.25);u.dv.r=0;go(u,118,197,200);later(.2,()=>{M.car=u;M.hold=true;FX.burst(X.x,X.y,10,'grass');SND.thud();ps(X,'fall',.45);X.fd=1;later(.45,()=>ps(X,'down',1));later(1,()=>{u.dv=null;u.rot=0;ps(u,'fist',1)});defWin(2)})}
  else{ps(X,'kick',.6);SND.kick(.8);later(.1,()=>{ps(u,'parry',.6);u.z=0});const goal=kind==='goal',ty=200+(RN()-.5)*20;if(M.dec)M.ts=.5;
   ballFly(goal?9:12,ty,.75,42,()=>{M.ts=1;if(goal){scoreGoal(1,X,ty);endIn(1.4,1)}else{ballFly(-20,ty,.25,4,()=>{M.b.hide=1});relief(X,0);SND.cheer(.35,1.4);endIn(1.3)}},{z1:goal?10:32})}})}
function scCatch(q,kind){const u=M.u,X=M.R.X,X2=M.R.X2;M.car=X;go(X,X.x-14,X.y+3,90);
 later(.25,()=>keeperShot(X,()=>{
  if(kind==='ok'){later(.08,()=>ps(u,'catch',null));ballFly(u.x+5,u.y+1,.42,5,()=>{M.ts=1;M.car=u;M.hold=true;SND.thud();FX.ring(u.x+5,u.y-10,'#fff',90);later(.8,()=>ps(u,'fist',1.1));relief(X,0);defWin(1.9)},{z1:10})}
  else{later(.08,()=>ps(u,'catch',.5));ballFly(u.x+6,u.y+1,.4,5,()=>{M.ts=1;SND.thud();M.sk=.2;ps(u,'fall',.45);u.fd=-1;
   if(kind==='goal'){go(X2,64,186,230);ballFly(64,188,.4,4,()=>{M.car=X2;later(.05,()=>{ps(X2,'kick',.5);X2.f=-1;SND.kick(.6);ballFly(9,192,.25,2,()=>{scoreGoal(1,X2,192);endIn(1.4,1)},{z1:4})})})}
   else{ballFly(10,120,.5,10,()=>{M.b.hide=1});relief(X,0);SND.cheer(.3,1.2);endIn(1.4)}},{z1:10})}}))}
/* ---- novas cenas: falta sofrida, falta direta, escanteios e pênaltis ---- */
function scFouled(pen){const u=M.u,D=M.R.D||M.A[8];M.car=u;go(u,u.x+26,u.y,110);later(.3,()=>{ps(D,'slide',.9);go(D,u.x+4,u.y,240);
 later(.16,()=>{FX.burst(u.x,u.y,14,'grass',1.1);SND.thud();ps(u,'fall',.45);u.fd=1;later(.45,()=>ps(u,'down',.9));M.car=null;M.b.vx=40;M.b.vy=10;
  refCall(u.x,u.y,RN()<.55?'yellow':null,D.nm);later(1.2,()=>{if(pen){ps(M.ref,'point',1.2);banner('PÊNALTI!','O árbitro aponta para a marca','#ff5a5f',1.4)}else banner('FALTA!','Bola parada perigosa','#ffd400',1.2)});M.cx[ourSide()]=.4;endIn(2.6)})})}
function scFK(o,q,g){const u=M.u,K=M.R.K,s=RN()<.5?-1:1;M.car=null;M.b.x=u.x+7;M.b.y=u.y+2;ps(u,'windup',.35);u.f=1;u.lf=1;
 later(.35,()=>{ps(u,'kick',.6);kickFX(u,1.1);if(M.dec)M.ts=.42;const ty=200+s*(14+RN()*10);
  if(!g&&!q){ballFly(582,200+s*6,.25,10,()=>{SND.thud();FX.burst(M.b.x,M.b.y-M.b.z,6,'spark');ballFly(540,200+s*40,.5,14);relief(u,0);SND.ooh();endIn(1.4)},{z1:14});return}
  if(g){later(.12,()=>dive(K,RN()<.5?s:-s,'dive',22));ballFly(711,ty,o===0?.62:.45,o===0?34:4,()=>{M.ts=1;scoreGoal(0,u,ty);endIn(1.4,1)},{z1:o===0?12:3,hot:1,cv:o===0?-s*16:0})}
  else{later(.1,()=>dive(K,s,'parry',22));ballFly(694,ty,o===0?.62:.45,o===0?30:4,()=>{M.ts=1;SND.thud();FX.burst(M.b.x,M.b.y-M.b.z,8,'spark');ballFly(700,ty+s*90,.5,14,()=>{M.b.hide=1});relief(u,0);SND.ooh();endIn(1.4)},{z1:8,cv:o===0?-s*16:0})}})}
function scCornerA(o,q,g){const u=M.u,TK=M.R.T,K=M.R.K,D=M.R.D,tx=o===0?648:o===1?664:600,ty=o===0?218:o===1?184:200;go(u,tx,ty,180);go(D,tx+6,ty+4,150);
 later(.3,()=>{ps(TK,'kick',.5);TK.f=-1;SND.kick(.8);ballFly(tx+3,ty,.75,46,()=>{
  if(o<2){if(q||g){SND.kick(.9);FX.burst(M.b.x,M.b.y-M.b.z,8,'spark')}const end=()=>{if(g){const yy=200+(RN()<.5?-14:14);later(.05,()=>dive(K,yy<200?-1:1,'dive',18));ballFly(711,yy,.3,3,()=>{scoreGoal(0,u,yy);endIn(1.4,1)},{z1:9,hot:1})}
    else if(q){ps(K,'catch',null);ballFly(K.x-5,K.y+1,.35,4,()=>{M.car=K;M.hold=true;relief(u,0);SND.ooh();endIn(1.4)},{z1:10})}else{ps(D,'header',.7);ballFly(560,220,.7,30,()=>{relief(u,0);endIn(1)})}};end()}
  else{ps(D,'header',.7);ballFly(600,200,.4,14,()=>{shotRight(u,g?'goal':q?'save':'over',1.15)})}},{z1:o<2?18:22});if(o<2)later(.4,()=>{ps(u,'header',.8);ps(D,'header',.8)})})}
function scCornerD(o,q,kind){const u=M.u,TK=M.R.TK,X=M.R.X,K=M.R.K,gk=u.k==='g';later(.3,()=>{ps(TK,'kick',.5);TK.f=1;SND.kick(.8);
 if(kind==='ok'){if(gk){if(o===1){ballFly(u.x+6,u.y,.75,46,()=>{M.car=u;M.hold=true;SND.thud();ps(u,'fist',1.2);defWin(1.6)},{z1:14});later(.45,()=>{ps(u,'catch',null);u.z=8})}
   else{ballFly(u.x+8,u.y,.75,46,()=>{SND.thud();FX.burst(M.b.x,M.b.y-M.b.z,8,'spark');ballFly(260,200,.7,30);defWin(1.8)},{z1:18});later(.45,()=>ps(u,'parry',.8))}}
  else{go(u,X.x+4,X.y,200);ballFly(X.x+3,X.y,.75,46,()=>{SND.kick(.8);FX.burst(M.b.x,M.b.y-M.b.z,6,'spark');ballFly(300,180,.8,34);defWin(1.8)},{z1:18});later(.45,()=>{ps(u,'header',.8);ps(X,'header',.8)})}}
 else{ballFly(X.x+3,X.y,.75,46,()=>{SND.kick(.9);const yy=200+(RN()<.5?-16:16);if(kind==='goal'){if(!gk)later(.05,()=>dive(K,yy<200?-1:1,'dive',18));ballFly(9,yy,.3,3,()=>{scoreGoal(1,X,yy);endIn(1.4,1)},{z1:9})}
   else ballFly(-10,yy+(yy<200?-40:40),.4,10,()=>{M.b.hide=1;relief(X,0);SND.cheer(.35,1.4);endIn(1.2)},{z1:22})},{z1:18});later(.45,()=>{ps(X,'header',.8);if(gk)dive(u,RN()<.5?-1:1,'parry',14,10);else ps(u,'header',.8)})}})}
// pênalti: side 'R' (gol da direita) ou 'L'; dir/gs: 0 canto esquerdo do batedor, 1 meio, 2 direito
function scPen(side,sh,K,dir,gs,res,done){const R=side==='R',gx=R?711:9,f=R?1:-1,dy=d=>(d===1?0:(d===0?-1:1)*f*20);M.b.hide=0;M.car=null;M.b.x=R?642:78;M.b.y=200;M.b.z=0;M.b.fl=null;
 sh.x=R?624:96;sh.y=200;sh.f=f;sh.lf=1;resetActor(K);K.x=R?696:24;K.y=200;K.f=-f;K.lf=1;K.idle='gkready';go(sh,M.b.x-f*8,200,70);
 later(.5,()=>{ps(sh,'windup',.3);later(.3,()=>{ps(sh,'kick',.6);kickFX(sh,1.1);if(M.dec&&!done)M.ts=.5;const yy=200+dy(dir),kd=gs===1?0:(gs===0?-1:1)*f;
  later(.08,()=>{if(kd)dive(K,kd,res==='save'?'parry':'dive',20,8);else ps(K,'catch',null)});
  const end=res==='miss'?[gx+f*6,200+dy(dir)*2.2,36]:res==='save'?[K.x+f*-4,K.y+kd*20,8]:[gx,yy,6];
  ballFly(end[0],end[1],.4,res==='miss'?18:5,()=>{M.ts=1;if(res==='goal'){const n=M.net[R?1:0];n.t=0;n.a=6;n.y=yy;SND.net();if(done)return done(1);scoreGoal(R?0:1,sh,yy);endIn(1.4,1)}
   else{SND.thud();if(res==='save'){FX.burst(M.b.x,M.b.y-M.b.z,8,'spark');ballFly(M.b.x-f*30,M.b.y+kd*50,.4,10)}else ballFly(gx+f*30,end[1],.3,20,()=>{M.b.hide=1});
    if(done)return done(0);if(R){relief(sh,0);SND.ooh()}else{ps(K,'fist',1.2);defWin(1.6)}endIn(1.6)}},{z1:end[2]})})})}
/* ---- disputa de pênaltis (mata-mata empatado) ---- */
function startShootout(){M.ph='so';M.so={k:[[],[]],n:0};M.A.forEach(p=>{resetActor(p);p.lock=1;if(p.k!=='g'&&p.k!=='r'){p.x=p.tx=330+(p.t?30:-30)+((M.A.indexOf(p)%5)-2)*8;p.y=p.ty=200+((M.A.indexOf(p)%5)-2)*14}});
 M.A[0].x=60;M.A[5].x=690;M.ref.x=600;M.ref.y=250;banner('PÊNALTIS!','Disputa para decidir a vaga','#ffd400',2,1);M.msg='Disputa de pênaltis!';ui();later(2.2,soNext)}
function soDecided(){const[a,b]=M.so.k,ga=a.filter(Boolean).length,gb=b.filter(Boolean).length,na=a.length,nb=b.length;
 if(na<=5&&nb<=5){if(ga+(5-na)<gb||gb+(5-nb)<ga)return true;return na===5&&nb===5&&ga!==gb}return na===nb&&ga!==gb}
function soNext(){if(!M)return;if(soDecided()){const[a,b]=M.so.k;M.pw=a.filter(Boolean).length>b.filter(Boolean).length?0:1;banner(M.pw===0?'CLASSIFICADO!':'ELIMINADO',`Pênaltis: ${a.filter(Boolean).length} x ${b.filter(Boolean).length}`,M.pw===0?'#3ddc84':'#ff5a5f',2.5,1);
  if(M.pw===0){M.cx[ourSide()]=1;SND.cheer(1,3)}else SND.ooh();later(2.6,mend);return}
 const side=M.so.k[0].length>M.so.k[1].length?1:0,kn=M.so.k[side].length,A=M.A,us=side===0,gk=role()==='g';
 const shooter=us?A[[4,3,2,1,3][kn%5]]:A[[9,8,7,6,9][kn%5]],keeper=us?A[5]:A[0];
 const userKick=us&&!gk&&!M.red&&kn===4,userSave=!us&&gk&&!M.red;
 if(userKick||userSave){M.sok={side,shooter,keeper};M.mt=MT[us?'pen_a':'pen_g'];M.mtk=us?'pen_a':'pen_g';M.sit=null;M.ph='sop';
  shooter.x=624;shooter.y=200;resetActor(keeper);keeper.x=696;keeper.y=200;keeper.f=-1;M.b.x=642;M.b.y=200;M.b.z=0;M.b.hide=0;ui();return}
 const sd=RN()<.42?0:RN()<.27?1:2,gs=RN()<.42?0:RN()<.27?1:2,res=RN()<.76?'goal':RN()<.6?'save':'miss';ui();
 scPen('R',shooter,keeper,sd,res==='save'?sd:gs===sd&&res==='goal'?(sd+1)%3:gs,res,v=>{M.so.k[side].push(v);ui();later(1.2,soNext)})}
function soUser(q){const{side,shooter,keeper}=M.sok,o=M.o_;let res,gs,sd;
 if(side===0){gs=RN()<.42?0:RN()<.27?1:2;res=q===0?(RN()<.5?'miss':gs===o?'save':'goal'):q===1?(gs===o&&(o===1||RN()<.75)?'save':'goal'):(gs===o&&RN()<(o===1?.7:.45)?'save':'goal');sd=o;
  if(res==='goal')M.rt+=.4;else M.rt-=.4}
 else{sd=RN()<.42?0:RN()<.27?1:2;gs=o;res=RN()<.1?'miss':sd===o?(RN()<(o===1?[.5,.85,1]:[.3,.7,.92])[q]?'save':'goal'):(q===2&&RN()<.12?'save':'goal');if(res!=='goal'){M.st.tk++;M.rt+=.5}}
 xpGain(mopt(o)[1],10+q*10);M.ph='so';ui();scPen('R',shooter,keeper,sd,gs,res,v=>{M.so.k[side].push(v);ui();later(1.2,soNext)})}
/* ---- gols automáticos entre os lances ---- */
function autoEv(){const hp=.1+CL[M.my].t*.03+S.morale/1500+M.tac[0]+(S.pers==='Líder'?.02:0)-(M.red?.03:0),ap=.1+CL[M.oi].t*.045+M.tac[1]+(M.red?.05:0);let t='';
 if(RN()<hp){M.s[0]++;const n=pickR(sqd(M.my).filter(q=>q.n!==M.u.nm).slice(2)).n;t='Gol do '+CL[M.my].n+' ('+n+').';fastGoal(0,n)}else if(RN()<ap){M.s[1]++;const n=sqd(M.oi)[RN()<.6?4:3].n;t='Gol do '+M.o+' ('+n+').';fastGoal(1,n)}
 M.msg=t||pickR(['Lance de perigo!','O jogo está pegado no meio-campo.','Pressão na área!','Escanteio cobrado e afastado.']);if(t)M.log.push([Math.floor(M.min),t,0]);sc()}
function fastGoal(side,n){const net=M.net[side?0:1];net.t=0;net.a=6;net.y=200;SND.net();const us=ourSide(),fans=side===0?us:1-us;M.cx[fans]=1;M.boo[1-fans]=.6;SND.cheer(.7,2.2);banner(side?'GOL DO RIVAL':'GOL DO TIME',n,side?'#ff5a5f':'#3ddc84',1.4)}
/* ---- fim da partida ---- */
function mend(){if(!M||M.ph==='end')return;if(M.fx.ko&&M.s[0]===M.s[1]&&M.pw==null){startShootout();return}
 M.ph='end';SND.whistle(3);const s=M.s,w=s[0]>s[1]||(s[0]===s[1]&&M.pw===0),dr=s[0]===s[1]&&M.pw==null,st=M.st;M.n=C(M.rt+(w?.4:dr?0:-.2),3,10).toFixed(1);$('mv').innerHTML='';
 M.A.forEach(p=>{resetActor(p);p.lock=1;p.tx=null;if(p.k==='r'){ps(p,'whistle',null);return}const won=dr?0:(p.t===0)===w;ps(p,dr?(RN()<.5?'tired':'clap'):won?pickR(['celebrate','clap','fist','point']):pickR(['sad','tired','frustrated']),null)});
 if(w){M.cx[ourSide()]=1;SND.cheer(.8,3)}else if(!dr&&M.E.home)SND.boo();
 const n=+M.n,rc=n>=8?'var(--gr)':n>=6.5?'var(--yl)':n>=5?'var(--or)':'var(--rd)';M.dct=Math.round((n-6.3)*4.5+(M.posi===['ofe','equ','def'].indexOf(S.coach?S.coach.st:'equ')?1:-2)+(S.pers==='Líder'?1:0));
 const xg=Object.entries(M.xpg).map(([k,v])=>`${AN[k]} +${v}`).join(', ');
 $('res').classList.remove('hidden');
 $('res').innerHTML=`<div class="rhead"><span class="tag">${M.fx.label}</span><h2>${icon('star')} ${w?'Vitória':dr?'Empate':'Derrota'}${M.pw!=null?' nos pênaltis':''}</h2></div><div class="score"><div><img src="${kitBadge(M.my)}" alt="">${CL[M.my].n}</div><b>${s[0]} x ${s[1]}</b><div><img src="${kitBadge(M.oi)}" alt="">${M.o}</div></div>
 ${M.so?`<p style="text-align:center" class="mt">Pênaltis: ${M.so.k[0].filter(Boolean).length} x ${M.so.k[1].filter(Boolean).length}</p>`:''}
 <div class="row"><div><span class="rating" style="background:${rc}">${M.n}</span> <span class="mt">sua nota</span>${n>=8?' <span class="tag" style="color:var(--yl)">MELHOR EM CAMPO</span>':''}</div><div class="g4" style="flex:1;min-width:220px;grid-template-columns:repeat(3,1fr)"><div><small>Gols</small><b>${st.g}</b></div><div><small>Assist.</small><b>${st.a}</b></div><div><small>Salvos</small><b>${st.tk}</b></div></div></div>
 ${M.fx.comp!=='sel'&&S.coach?`<div class="coach">${icon('career')}<div><b>${S.coach.n}</b>: "${coachTalk(n)}"<br><small>Confiança do treinador ${C(S.ct+M.dct,0,100)} (${M.dct>=0?'+':''}${M.dct})${M.posi!==['ofe','equ','def'].indexOf(S.coach.st)?' · você não seguiu a instrução de posicionamento':''}</small></div></div>`:''}
 ${xg?`<p class="gr">${icon('star','var(--gr)')} Evolução em campo: ${xg}</p>`:''}
 <div class="lg" style="margin-top:10px">${M.log.map(l=>`<p><i>${l[0]}'</i><span class="${l[2]>0?'gr':l[2]<0?'rd':''}">${l[1]}</span></p>`).join('')||'<p class="mt">Jogo sem grandes lances.</p>'}</div>
 <p></p><button class="go" id="fin2" style="width:100%">Concluir partida</button>`;$('fin2').onclick=mfin}
function mfin(){if(!M)return;const s=M.s,fx=M.fx,w=s[0]>s[1]||(s[0]===s[1]&&M.pw===0),dr=s[0]===s[1]&&M.pw==null,st=M.st,n=+M.n,club=fx.comp!=='sel';
 S.G++;S.Gl+=st.g;S.A+=st.a;S.Sv+=st.tk;S.T.j++;S.T.g+=st.g;S.T.a+=st.a;S.T.sv+=st.tk;S[w?'W':dr?'D':'L']++;
 const cs=S.comp.st[fx.comp]||(S.comp.st[fx.comp]={j:0,g:0,a:0,sv:0,n:0});cs.j++;cs.g+=st.g;cs.a+=st.a;cs.sv+=st.tk;cs.n+=n;
 S.energy=C(Math.round(S.energy-(8+(100-M.sta)*.45)*(S.inv.fisio?.8:1)),0,100);
 let rp=((w?8:dr?4:2)+st.g*3+st.a*2+(n>=8?3:0))*(S.pers==='Estrela'?1.25:1)*(club?1:2);if(M.rv){rp+=(st.g*3+(n>=7.5?4:0))*M.rv;if(n<5.5&&M.rv===2)moraleAdd(-5)}S.rv=null;S.rep+=Math.round(rp);
 if(club){S.money+=(S.crisis>0?0:S.sal)+(w?60:20)*(1+S.lvl);if(S.crisis>0)S.crisis--}
 moraleAdd((w?6:dr?1:-5)+(n>=8?4:n<5?-4:0));if(club){S.ct=C(S.ct+M.dct+(M.tacs===0&&S.coach.st==='ofe'||M.tacs===2&&S.coach.st==='def'?1:0),0,100);S.bench=0}if(n>=8)S.sp++;
 injure(.012+(M.e0<35?.07:M.e0<55?.025:0)+M.falls*.03,'Lesão durante a partida');
 S.hist.unshift({o:M.o,s:s[0]+' x '+s[1],n:M.n,r:w?'V':dr?'E':'D',g:st.g,a:st.a,c:fx.comp,p:1,se:S.season,wk:S.wk});S.hist=S.hist.slice(0,40);
 addMyGoals(fx.comp,st.g);scorer(fx.comp,M.my,s[0],st.g);scorer(fx.comp,M.oi,s[1]);
 if(st.g>S.rec.gm&&st.g>=2){S.rec.gm=st.g;news(`Recorde pessoal: ${st.g} gols em um jogo!`,'','voce','star')}if(n>S.rec.n){S.rec.n=n;if(n>=8.5)news(`Melhor atuação da carreira: nota ${M.n}`,'','voce','star')}
 if(S.Gl>S.rec.gs&&S.Gl>=5){S.rec.gs=S.Gl;if(!S.recS||S.recS!==S.season){S.recS=S.season;news('Recorde: sua melhor temporada em gols!','','voce','star')}}
 for(const m of[10,25,50,100,200])if(S.T.g>=m&&S.T.g-st.g<m)news(`Marca histórica: ${m} gols na carreira!`,'','voce','star');
 if(n>=8.5)news(`Atuação de gala de ${S.name}`,`Nota ${M.n} contra o ${M.o}. A imprensa só fala disso.`,'voce','star');
 news(`${CL[M.my].n} ${s[0]} x ${s[1]} ${M.o}`,`${fx.label}. Nota ${M.n}${st.g?`, ${st.g} gol(s)`:''}${st.a?`, ${st.a} assist.`:''}.`,club?'clube':'voce','play');
 if(club)clubForm(w,dr);
 cancelAnimationFrame(M.raf);clearTimeout(M.tm);SND.ambStop();const pw=M.pw;M=null;FX.clear();
 processSlot(fx,{s,pw});checkGoals();updMV();showMatch(false);sv();rd();page('home');scrollTo(0,0);setTimeout(showEvent,500)}
