/* ================= 10. MOTOR DE CARREIRA (v4) =================
   Temporada = lista de "datas" (S.sl). Cada data é uma rodada de competição.
   O próximo jogo é calculado na hora a partir do clube atual, então transferências e empréstimos
   no meio da temporada continuam coerentes. */
const LVN=()=>LV[S.lvl].n;
const clubName=i=>CL[i]?CL[i].n:'?';
const fmtM=v=>v>=1000?'R$ '+(v/1000).toFixed(v>=10000?0:1).replace('.',',')+' mi':'R$ '+Math.round(v)+' mil';
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}

/* ---------- desenvolvimento ---------- */
const played=()=>S.hist.filter(x=>x.p),seasonPlayed=()=>S.hist.filter(x=>x.p&&x.se===S.season);
const avgOf=h=>h.length?h.reduce((a,b)=>a+ +b.n,0)/h.length:0;
const ageMult=()=>S.age<=19?1.25:S.age<=23?1.1:S.age<=27?.9:S.age<=30?.7:.45;
const gainMult=k=>(S.attrs[k]<S.pot?1:.3)*ageMult()*((STY[S.style]||{a:[]}).a.includes(k)?1.2:1);
function addXP(k,v){S.xp[k]=(S.xp[k]||0)+v*gainMult(k);let up=0;while(S.xp[k]>=100&&S.attrs[k]<99){S.xp[k]-=100;S.attrs[k]++;up++}if(S.attrs[k]>=99)S.xp[k]=0;return up}
const specs=()=>Object.keys(SPEC).filter(k=>S.attrs[k]>=72);
const potTxt=()=>{const lo=S.age<=21?Math.max(40,S.pot-4):S.pot,hi=S.age<=21?Math.min(99,S.pot+4):S.pot;return lo===hi?''+S.pot:lo+'–'+hi};
const potStars=()=>Math.round(S.pot/20*2)/2;
function ageDecline(){const out=[];const dn=(k,n)=>{if(n>0){S.attrs[k]=Math.max(20,S.attrs[k]-n);out.push(AN[k]+' -'+n)}};
 if(S.age>=31){dn('speed',1+((RN()*3)|0));dn('physical',(RN()*3)|0)}if(S.age>=33)['shoot','pass','dribble','defense'].forEach(k=>dn(k,(RN()*2)|0));if(S.age>=35)['speed','physical'].forEach(k=>dn(k,1));return out}
function calcMV(){const o=ovr(),h=played().slice(0,5),av=h.length?avgOf(h):6,ag=S.age<=21?1.3:S.age<=26?1.1:S.age<=29?1:S.age<=32?.7:.4;
 let v=20*Math.pow(1.13,o-40)*[1,2.5,6][S.lvl]*ag*(1+Math.max(0,S.pot-o)/40*(S.age<=23?1:.3))*(.8+av/25)*(S.pers==='Estrela'?1.15:1);return Math.max(5,Math.round(v))}
function updMV(){const v=calcMV();S.mvh.push(v);S.mvh=S.mvh.slice(-12);S.mv=v}

/* ---------- treinador, titularidade e moral ---------- */
const COACH_ST={ofe:['Ofensivo','Avançado'],def:['Defensivo','Recuado'],equ:['Equilibrado','Equilibrado']};
function newCoach(){const r=rng(hash(S.club+':'+S.season+':'+RN()));S.coach={n:'Prof. '+pickR(FN,r)+' '+pickR(LN,r),st:pickR(['ofe','def','equ'],r),cl:S.club,w:0}}
function newRival(){const sq=sqd(S.club),q=sq[role()==='g'?0:3];S.rival={n:q.n,o:q.o+S.lvl*6+2,out:0}}
function starterScore(){return ovr()+(S.ct-50)*.35+(S.morale-50)*.06-(S.energy<35?6:0)}
function status(fx){if(S.inj)return 'Lesionado';if(S.susp>0&&fx&&fx.comp!=='sel')return 'Suspenso';if(fx&&fx.comp==='sel')return 'Titular';if(!S.rival)newRival();return S.rival.out>0||starterScore()>=S.rival.o+2?'Titular':'Reserva'}
function moraleAdd(v){const k=S.pers==='Temperamental'?1.5:1;S.morale=C(Math.round(S.morale+v*k),S.inv.psi?45:0,100)}
function coachTalk(n){return n>=8.5?'Atuação de gala. Você é peça-chave.':n>=7.5?'Muito bom. Continue assim e a vaga é sua.':n>=6.5?'Partida correta, mas quero mais.':n>=5.5?'Abaixo do esperado. Precisa render mais.':'Muito ruim. Vou repensar a escalação.'}

/* ---------- lesões ---------- */
const INJ={Leve:['Pancada no tornozelo','Desconforto muscular','Torção leve no pé'],Moderada:['Estiramento na coxa','Entorse no tornozelo','Lesão na panturrilha'],Grave:['Lesão no ligamento do joelho','Fratura no pé','Ruptura muscular']};
function injure(risk,src){if(S.inj||RN()>=risk)return null;const r=RN(),sev=r<.68?'Leve':r<.93?'Moderada':'Grave',w=sev==='Leve'?1+((RN()*2)|0):sev==='Moderada'?3+((RN()*3)|0):8+((RN()*7)|0);
 S.inj={n:pickR(INJ[sev]),sev,w};news(`Lesão ${sev.toLowerCase()}: ${S.inj.n}`,`${src}. Previsão: ${w} semana(s) fora.`,'voce','rest');moraleAdd(-6);return S.inj}

/* ---------- competições ---------- */
function rrSchedule(ids){const t=[...ids];if(t.length%2)t.push(null);const n=t.length,R=[];for(let r=0;r<n-1;r++){const p=[];for(let i=0;i<n/2;i++){const a=t[i],b=t[n-1-i];if(a!=null&&b!=null)p.push(r%2?[b,a]:[a,b])}R.push(p);t.splice(1,0,t.pop())}return R}
const mkKO=ids=>({alive:[...ids],pairs:null,r:0,champ:null,log:[]});
function buildSeason(){const lib=S.lvl===2&&S.qlib;S.qlib=0;
 const sch=rrSchedule([...BR].sort(()=>RN()-.5)),tab={};BR.forEach(i=>tab[i]={p:0,j:0,v:0,e:0,d:0,gp:0,gc:0});
 S.comp={bra:{sch,tab},est:null,cdb:null,lib:lib?'q':null,sc:{est:{},bra:{},cdb:{},lib:{},sel:{}},st:{}};
 const sl=[{k:'est',r:0,w:'pre'},{k:'est',r:1,w:'pre'}];
 for(let r=0;r<sch.length;r++){sl.push({k:'bra',r,w:r>=6&&r<=7?'mid':null});if(r===2)sl.push({k:'cdb',r:0});if(r===6)sl.push({k:'cdb',r:1});if(r===10)sl.push({k:'cdb',r:2});
  if(lib){if(r===1)sl.push({k:'lib',r:0});if(r===5)sl.push({k:'lib',r:1});if(r===9)sl.push({k:'lib',r:2})}}
 S.sl=sl;S.wk=0;S.ap=2;S.G=S.Gl=S.A=S.W=S.D=S.L=S.Sv=0;S.offers=S.offers.filter(o=>o.type==='free');S.ow={};S.ask=0;S.conv=0;
 if(!S.coach||S.coach.cl!==S.club)newCoach();newRival();mkGoals();updMV();genInterest();openWindow('pre')}
function koFor(k){const c=S.comp;if(c[k]&&c[k]!=='q')return c[k];
 if(k==='est'){const reg=REG[S.club]||'NE';let ids=CL.map((_,i)=>i).filter(i=>REG[i]===reg&&(isBR(i)||CL[i].x==='est'));const br=ids.filter(isBR);ids=br.length>=4?br.slice(0,4):[...br,...ids.filter(i=>!isBR(i))].slice(0,4);
  if(!ids.includes(S.club))ids[3]=S.club;c.est={...mkKO(ids.sort(()=>RN()-.5)),n:'Estadual '+reg};c.est.r=0;return c.est}
 if(k==='cdb'){const o=BR.filter(i=>i!==S.club).sort(()=>RN()-.5).slice(0,7);c.cdb=mkKO([S.club,...o].sort(()=>RN()-.5));return c.cdb}
 if(k==='lib'&&c.lib==='q'){const o=CL.map((_,i)=>i).filter(i=>CL[i].x==='lib').slice(0,7);c.lib=mkKO([S.club,...o].sort(()=>RN()-.5));return c.lib}
 return null}
function drawPairs(ko){if(ko.pairs)return;const a=[...ko.alive];ko.pairs=[];for(let i=0;i+1<a.length;i+=2)ko.pairs.push([a[i],a[i+1]])}
// próximo compromisso do jogador (calculado, nunca guardado)
function nextFx(){const s=S.sl[S.wk];if(!s)return null;const base={comp:s.k,r:s.r,slot:S.wk};
 if(s.k==='sel')return{...base,my:BRA,opp:s.opp,home:true,label:'Amistoso da Seleção '+LVN(),final:false,ko:false};
 if(s.k==='bra'){const p=S.comp.bra.sch[s.r].find(x=>x.includes(S.club));if(!p)return{...base,bye:true,label:`Brasileirão · Rodada ${s.r+1}`};return{...base,my:S.club,opp:p[0]===S.club?p[1]:p[0],home:p[0]===S.club,label:`Brasileirão ${LVN()} · Rodada ${s.r+1}`,final:s.r===S.comp.bra.sch.length-1,ko:false}}
 const ko=koFor(s.k);if(!ko||ko.champ!=null||ko.r!==s.r)return{...base,bye:true,label:COMP[s.k]+' · '+(ko&&ko.champ!=null?'encerrado':'sem jogo'),out:true};
 drawPairs(ko);const p=ko.pairs.find(x=>x.includes(S.club));const nm=(s.k==='est'?ko.n||'Estadual':COMP[s.k])+' · '+KO_N[3-Math.log2(ko.alive.length)|0];
 if(!p)return{...base,bye:true,label:nm+(ko.alive.includes(S.club)?'':' (eliminado)'),out:true};
 return{...base,my:S.club,opp:p[0]===S.club?p[1]:p[0],home:p[0]===S.club,label:nm,final:ko.alive.length===2,ko:true}}
function simScore(a,b,home){const ga=gl(a,home?.025:0),gb=gl(b,home?0:.025);return[ga,gb]}
function scorer(comp,team,n,skip=0){const sq=sqd(team),w=[.02,.06,.14,.3,.48];for(let i=0;i<n-skip;i++){let r=RN(),j=0;while(j<4&&r>w[j]){r-=w[j];j++}const q=sq[j],k=q.n+'|'+team,o=S.comp.sc[comp]||(S.comp.sc[comp]={});(o[k]||(o[k]={n:q.n,c:team,g:0})).g++}}
function addMyGoals(comp,g){if(!g)return;const k='me',o=S.comp.sc[comp]||(S.comp.sc[comp]={});(o[k]||(o[k]={n:S.name,c:S.club,g:0,me:1})).g+=g;o[k].c=comp==='sel'?BRA:S.club}
function tabRes(a,b,x,y){const T=S.comp.bra.tab,A=T[a],B=T[b];A.j++;B.j++;A.gp+=x;A.gc+=y;B.gp+=y;B.gc+=x;if(x>y){A.v++;A.p+=3;B.d++}else if(x<y){B.v++;B.p+=3;A.d++}else{A.e++;B.e++;A.p++;B.p++}}
const table=()=>BR.slice().sort((a,b)=>{const T=S.comp.bra.tab,A=T[a],B=T[b];return B.p-A.p||(B.gp-B.gc)-(A.gp-A.gc)||B.gp-A.gp});
function zebra(a,b,x,y,comp){if(Math.abs(CL[a].t-CL[b].t)>=2&&((x>y&&CL[a].t<CL[b].t)||(y>x&&CL[b].t<CL[a].t))&&RN()<.5)news(`Zebra no ${COMP[comp]}!`,`${clubName(x>y?a:b)} surpreende e vence o ${clubName(x>y?b:a)} por ${Math.max(x,y)} x ${Math.min(x,y)}.`,'liga','star')}
// processa a rodada da data atual. res = placar do time do jogador (ou null se folga)
function processSlot(fx,res){const s=S.sl[S.wk];if(!s)return;
 if(s.k==='bra'){for(const[a,b]of S.comp.bra.sch[s.r]){let x,y;if(fx&&!fx.bye&&(a===fx.my||b===fx.my)){[x,y]=a===fx.my?res.s:[res.s[1],res.s[0]]}else{[x,y]=simScore(a,b,true);scorer('bra',a,x);scorer('bra',b,y);zebra(a,b,x,y,'bra')}tabRes(a,b,x,y)}
  if(s.r===S.comp.bra.sch.length-1){const tb=table();S.comp.bra.champ=tb[0];news(`${clubName(tb[0])} é campeão do Brasileirão ${LVN()}!`,'',tb[0]===S.club?'voce':'liga','career')}}
 else if(s.k!=='sel'){const ko=koFor(s.k);if(ko&&ko.champ==null&&ko.r===s.r){drawPairs(ko);const win=[];
  for(const[a,b]of ko.pairs){let x,y,w;if(fx&&!fx.bye&&(a===fx.my||b===fx.my)){[x,y]=a===fx.my?res.s:[res.s[1],res.s[0]];w=x>y?a:x<y?b:((res.pw===0)===(a===fx.my)?a:b)}
   else{[x,y]=simScore(a,b,true);scorer(s.k,a,x);scorer(s.k,b,y);w=x>y?a:x<y?b:(RN()<.5+(CL[a].t-CL[b].t)*.1?a:b);zebra(a,b,x,y,s.k)}
   ko.log.push(`${KO_N[3-Math.log2(ko.alive.length)|0]}: ${clubName(a)} ${x} x ${y} ${clubName(b)}${x===y?' (pên.)':''}`);win.push(w)}
  ko.alive=win;ko.pairs=null;ko.r++;if(win.length===1){ko.champ=win[0];news(`${clubName(win[0])} conquista o ${s.k==='est'?ko.n:COMP[s.k]}!`,'',win[0]===S.club?'voce':'liga','career');
   if(win[0]===S.club)trophy(`Campeão ${s.k==='est'?ko.n:COMP[s.k]} ${LVN()} ${S.season}`,s.k==='lib'?40:s.k==='cdb'?25:12,s.k==='lib'?1500:s.k==='cdb'?800:300)}}}
 S.wk++;weekTick();if(S.wk>=S.sl.length)seasonEnd()}
function trophy(t,rp=0,mo=0){S.tro.unshift(t);S.rep+=rp;S.money+=mo;news('🏆 '+t,rp?`+${rp} reputação, +R$ ${mo}.`:'','voce','career');toast('🏆 '+t)}
/* semana: recuperação, lesões, janela, eventos */
function weekTick(){S.ap=2;S.energy=C(S.energy+15+(S.pers==='Profissional'?5:0)+(S.inv.fisio?5:0),0,100);
 if(S.inj){S.inj.w--;if(S.inj.w<=0){news('Recuperado!','Você está liberado pelo departamento médico.','voce','physical');S.inj=null;toast('Você está recuperado da lesão')}}
 if(S.rival&&S.rival.out>0)S.rival.out--;if(S.coach)S.coach.w++;
 const s=S.sl[S.wk];if(s&&s.w)openWindow(s.w);
 if(S.con.end===S.season&&!S.con.loan&&!S.renew&&S.wk>=S.sl.length/2)offerRenewal();
 genInterest();convCheck();rollEvent()}
/* fim de temporada */
function seasonEnd(){const se=S.season,L=LVN(),pos=table().indexOf(S.club)+1,h=seasonPlayed(),avg=avgOf(h);
 checkGoals();news(`Fim da temporada ${se}`,`Brasileirão: ${pos}º lugar com o ${clubName(S.club)}.`,'voce','cal');
 const tb=table();if(tb[0]===S.club)trophy(`Campeão Brasileirão ${L} ${se}`,15,600);
 const sc=Object.values(S.comp.sc.bra||{}).sort((a,b)=>b.g-a.g);if(sc[0]&&sc[0].me&&sc[0].g>=3)trophy(`Artilheiro do Brasileirão ${L} ${se} (${sc[0].g} gols)`,12,400);
 if(avg>=7.5&&h.length>=6)trophy(`Craque da temporada ${L} ${se} (média ${avg.toFixed(1)})`,12,400);
 if(S.age<=20&&avg>=7.1&&h.length>=6)trophy(`Revelação ${L} ${se}`,8,200);
 if(S.Sv>=12)trophy(`Paredão da temporada ${L} ${se}`,8,250);
 for(const g of S.goals||[])if(!g.done){moraleAdd(-5);news(`Meta não cumprida: ${g.t}`,'','voce','career')}
 S.sh.unshift({s:se,c:S.club,l:S.lvl,j:S.G,g:S.Gl,a:S.A,sv:S.Sv,avg:+avg.toFixed(2),pos});
 if(S.lvl===2&&(pos<=3||(S.comp.cdb&&S.comp.cdb.champ===S.club))){S.qlib=1;news('Classificado para a Libertadores!','Seu clube disputará a competição na próxima temporada.','voce','star')}
 // empréstimo termina
 if(S.con.loan){const f=S.con.loan.from;S.th.unshift({s:se,from:S.club,to:f,t:'Fim de empréstimo',v:0});news('Fim do empréstimo',`Você volta para o ${clubName(f)}.`,'mercado','mkt');S.sal=S.con.loan.sal;S.club=f;S.con.loan=null;S.coach=null}
 // envelhecimento e categoria
 S.season++;S.age++;const dec=ageDecline();if(dec.length)news('O tempo passa',dec.join(', '),'voce','physical');
 const la=S.age<=17?0:S.age<=20?1:2,lr=S.rep>=LV[2].need?2:S.rep>=LV[1].need?1:0,nl=Math.max(S.lvl,la,lr);if(nl>S.lvl){S.lvl=nl;news(`Promoção: ${LV[nl].n}!`,'Você sobe de categoria.','voce','career');toast('Promoção para o '+LV[nl].n+'!')}
 // contrato
 if(S.con.end<S.season){if(S.renew&&S.renew.ok){S.renew=null}else{news('Contrato encerrado','Você está livre no mercado. Escolha um novo clube.','mercado','mkt');freeAgent()}}S.renew=null;
 if(S.age>=40){S.retired=1}
 buildSeason();sv()}

/* ---------- mercado ---------- */
function interestOf(ci){const o=ovr(),h=played().slice(0,5),av=h.length?avgOf(h):6;
 return C(Math.round((o-CL[ci].min+8)*5+(av-6)*12+S.rep/12+(CL[ci].t<CL[S.club].t?12:0)+(S.listed?15:0)-(S.age>31?(S.age-31)*6:0)+((hash(ci+':'+S.season)%21)-10)),0,100)}
function genInterest(){S.interest={};BR.forEach(i=>{if(i!==S.club)S.interest[i]=interestOf(i)})}
const canMove=()=>{const s=S.sl[S.wk];return !!(s&&s.w)&&!S.con.loan&&S.trs!==S.season+':'+s.w};
function mkOffer(ci,type,it){const sal=Math.round(CL[ci].s*(1+S.lvl*.5)*(.9+it/300)*(S.inv.emp?1.15:1));
 return type==='loan'?{c:ci,type,sal:Math.round(sal*.8),yrs:0,b:0,it,tries:0}:{c:ci,type,sal,yrs:2+((RN()*2)|0),b:Math.round(calcMV()*.05*(S.inv.emp?1.4:1)+CL[ci].s*2),it,tries:0}}
function openWindow(w){if(S.ow&&S.ow[w])return;S.ow=S.ow||{};S.ow[w]=1;if(S.con.loan)return;genInterest();
 const list=Object.entries(S.interest).map(([c,v])=>[+c,v]).filter(([c,v])=>v>=55).sort((a,b)=>b[1]-a[1]).slice(0,3);
 const offs=list.map(([c,v])=>mkOffer(c,S.bench>=2&&CL[c].t<=CL[S.club].t&&RN()<.6?'loan':'transfer',v));S.offers=[...S.offers.filter(o=>o.type==='free'||o.type==='renew'),...offs];
 if(offs.length)news(`Janela aberta: ${offs.length} proposta(s)`,offs.map(o=>clubName(o.c)+(o.type==='loan'?' (empréstimo)':'')).join(', '),'mercado','mkt');else news('Janela de transferências aberta','Nenhum clube fez proposta por enquanto.','mercado','mkt')}
function offerRenewal(){const sal=Math.round(Math.max(S.sal,CL[S.club].s*(1+S.lvl*.5))*(1+(S.ct-50)/200)*(S.inv.emp?1.1:1));S.renew={ok:0};S.offers.unshift({c:S.club,type:'renew',sal,yrs:2,b:0,it:Math.max(50,S.ct),tries:0});news('Proposta de renovação',`O ${clubName(S.club)} quer renovar seu contrato.`,'mercado','mkt')}
function freeAgent(){genInterest();const l=Object.entries(S.interest).map(([c,v])=>[+c,v]).sort((a,b)=>b[1]-a[1]).slice(0,3);S.offers=l.map(([c,v])=>({...mkOffer(c,'transfer',Math.max(v,50)),type:'free',b:Math.round(calcMV()*.12)}));S.freeAg=1}
function askTransfer(){if(S.listed)return;S.listed=1;S.ct=C(S.ct-8,0,100);genInterest();news('Você pediu para ser negociado','O treinador não gostou (-8 confiança). Clubes ficam mais atentos.','mercado','mkt');if(canMove()){S.ow={};openWindow(S.sl[S.wk].w)}sv();rd()}
function proposeTo(ci){if(!canMove()||ovr()<CL[ci].min||S.ask>=2)return;S.ask++;const it=Math.max(interestOf(ci),55);S.offers.push(mkOffer(ci,'transfer',it));negotiate(S.offers.length-1)}
function acceptOffer(k){const o=S.offers[k];if(!o)return;const from=S.club,yr=o.yrs;
 if(o.type==='renew'){S.sal=o.sal;S.con.end=S.season+o.yrs;S.renew={ok:1};S.ct=C(S.ct+5,0,100);S.offers.splice(k,1);news('Contrato renovado',`Até ${S.con.end}, R$ ${o.sal} por jogo.`,'mercado','mkt');toast('Contrato renovado!');sv();rd();return}
 if(o.type==='loan'){S.con.loan={from,sal:S.sal,end:S.season};S.th.unshift({s:S.season,from,to:o.c,t:'Empréstimo',v:0})}
 else{const fee=o.type==='free'?0:calcMV();S.th.unshift({s:S.season,from,to:o.c,t:o.type==='free'?'Sem custo':'Transferência',v:fee});S.con={end:S.season+yr,loan:null};S.money+=o.b}
 S.club=o.c;S.sal=o.sal;S.offers=[];S.listed=0;S.freeAg=0;S.bench=0;const s=S.sl[S.wk];S.trs=S.season+':'+(s&&s.w||'x');newCoach();newRival();S.ct=C(45+Math.round(S.rep/25),40,65);moraleAdd(8);S.rep+=CL[o.c].t*4;
 news(o.type==='loan'?`Emprestado ao ${clubName(o.c)}`:`Reforço do ${clubName(o.c)}!`,o.type==='loan'?'Até o fim da temporada.':`Contrato até ${S.con.end}. Luvas: R$ ${o.b}.`,'mercado','mkt');sv();presentation(o.c)}
function negotiate(k){const o=S.offers[k];if(!o)return;const box=$('evm'),card=box.querySelector('.card');let ask=0,yrs=o.yrs||0;
 const draw=(msg='')=>{const sal=Math.round(o.sal*(1+ask));card.innerHTML=`<h2>${icon('mkt')} ${o.type==='renew'?'Renovação':o.type==='loan'?'Empréstimo':'Proposta'}: ${clubName(o.c)}</h2>
  <div class="nego"><img src="${kitBadge(o.c)}" alt=""><div><b>${clubName(o.c)}</b><br><small>${['Emergente','Médio','Grande'][CL[o.c].t]} · interesse ${o.it}%</small>${bar(o.it,'var(--yl)')}</div></div>
  <p>Salário: <b class="yl">R$ ${sal} por jogo</b> ${ask?`<small>(pedido +${Math.round(ask*100)}%)</small>`:''}</p>
  ${o.type==='loan'?'<p>Duração: até o fim da temporada.</p>':`<p>Duração: <select id="ngy">${[1,2,3,4].map(y=>`<option ${y===yrs?'selected':''}>${y}</option>`).join('')}</select> temporada(s)</p>`}
  ${o.b?`<p>Luvas: R$ ${o.b}</p>`:''}<p class="mt">${msg||'Pedir mais pode irritar o clube. Duas recusas e a proposta é retirada.'}</p>
  <div class="tr"><button class="go" id="ng0">Aceitar</button><button id="ng1" ${o.tries>=2?'disabled':''}>Pedir +15%</button><button id="ng2" ${o.tries>=2?'disabled':''}>Pedir +30%</button><button id="ng3">Recusar</button></div>`;
  box.classList.remove('hidden');const y=$('ngy');if(y)y.onchange=()=>{yrs=+y.value};
  $('ng0').onclick=()=>{o.sal=Math.round(o.sal*(1+ask));o.yrs=yrs;box.classList.add('hidden');acceptOffer(S.offers.indexOf(o))};
  $('ng3').onclick=()=>{S.offers.splice(S.offers.indexOf(o),1);if(o.type==='renew')S.renew={ok:0,refused:1};box.classList.add('hidden');news(`Você recusou o ${clubName(o.c)}`,'','mercado','mkt');sv();rd()};
  [1,2].forEach(i=>$('ng'+i).onclick=()=>{const a=i===1?.15:.3,p=o.it/100+.25-a*1.6+(S.inv.emp?.1:0);SND.ui(600);
   if(RN()<p){ask=a;draw('O clube aceitou o seu pedido!')}else{o.tries++;if(o.tries>=2){S.offers.splice(S.offers.indexOf(o),1);box.classList.add('hidden');news(`${clubName(o.c)} retirou a proposta`,'O clube não aceitou suas exigências.','mercado','mkt');toast('Proposta retirada');sv();rd()}else draw('Recusaram o aumento. A proposta original continua de pé.')}})};
 draw()}
function presentation(ci){const box=$('evm'),card=box.querySelector('.card');card.innerHTML=`<h2>${icon('star')} Apresentação oficial</h2><canvas id="prc" width="320" height="180" style="width:100%;image-rendering:pixelated;border:2px solid var(--ln)"></canvas>
 <p>Bem-vindo ao <b class="yl">${clubName(ci)}</b>! Escolha sua camisa:</p><div class="sw" id="prn">${[7,9,10,11,8,S.num].filter((v,i,a)=>a.indexOf(v)===i).map(n=>`<button data-n="${n}" class="${n===S.num?'on':''}" style="width:42px;background:var(--pn2)">${n}</button>`).join('')}</div><p></p><button class="go" id="prok" style="width:100%">Vestir a camisa</button>`;
 box.classList.remove('hidden');SND.cheer(.6,2);let raf=0;const k=kitOf(ci),L=userLook(),t0=performance.now();
 const loop=t=>{const c=$('prc');if(!c)return;const x=c.getContext('2d'),s=(t-t0)/1000;x.imageSmoothingEnabled=false;x.fillStyle='#0b1220';x.fillRect(0,0,320,180);
  for(let r=0;r<5;r++)for(let i=0;i<64;i++){x.fillStyle=(i+r)%3?shade(k.a,.6):k.b;x.fillRect(i*5,20+r*9+(Math.sin(s*8+i+r)>.6?-1:0),4,4)}
  for(let i=0;i<6;i++)if(Math.sin(s*7+i*2.1)>.92){x.fillStyle='#fff';x.fillRect(20+i*50,30+i*7%30,3,3)}
  x.fillStyle='#173a27';x.fillRect(0,120,320,60);x.drawImage(M_kb(ci),20,70,40,40);x.drawImage(M_kb(ci),260,70,40,40);
  portrait(x,112,40,6,L,k,S.num,{ex:1});x.fillStyle='#ffd400';x.font='9px "Press Start 2P",monospace';x.textAlign='center';x.fillText(clubName(ci).toUpperCase(),160,150);x.fillStyle='#fff';x.fillText(S.name.toUpperCase(),160,166);x.textAlign='left';raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);
 box.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{S.num=+b.dataset.n;box.querySelectorAll('[data-n]').forEach(z=>z.classList.toggle('on',z===b))});
 $('prok').onclick=()=>{cancelAnimationFrame(raf);box.classList.add('hidden');sv();rd();page('home')}}
const _kbi={};const M_kb=ci=>{if(!_kbi[ci]){_kbi[ci]=new Image();_kbi[ci].src=kitBadge(ci)}return _kbi[ci]};

/* ---------- seleção ---------- */
function convCheck(){if(S.conv===S.season||S.inj)return;const h=played().slice(0,5),av=avgOf(h);
 if(h.length>=4&&av>=7.4&&S.rep>=30+S.lvl*40&&(S.lvl<2||ovr()>=66)){S.conv=S.season;const opp=pickR(CL.map((_,i)=>i).filter(i=>CL[i].x==='sel'&&i!==BRA));S.sl.splice(S.wk,0,{k:'sel',r:0,opp});
  S.evq={t:'Convocação!',d:`Você foi convocado para a Seleção Brasileira ${S.lvl===2?'principal':LVN()}! O próximo compromisso é um amistoso contra ${clubName(opp)}.`,a:[['Vestir a amarelinha',()=>{S.rep+=10;moraleAdd(10);S.tro.unshift(`Convocado para a Seleção ${S.lvl===2?'principal':LVN()} ${S.season}`);return '+10 reputação, +10 moral.'}]]};news('Convocado para a Seleção!','','voce','star')}}

/* ---------- metas do treinador ---------- */
function mkGoals(){const r=role(),l=S.lvl,P=r==='a'?[{k:'Gl',n:4+l*2,t:'Marque {n} gols'},{k:'A',n:2+l,t:'Dê {n} assistências'},{k:'W',n:5+l,t:'Vença {n} jogos'},{k:'avg',n:7,t:'Nota média {n}+ (mín. 4 jogos)'}]
  :[{k:'Sv',n:5+l*2,t:'Salve {n} lances'},{k:'W',n:5+l,t:'Vença {n} jogos'},{k:'avg',n:7,t:'Nota média {n}+ (mín. 4 jogos)'},{k:'cs',n:2+l,t:'Termine {n} jogos sem sofrer gol'}];
 S.goals=[...P].sort(()=>RN()-.5).slice(0,2).map(g=>({...g,t:g.t.replace('{n}',g.n),done:0}));S.gs=S.season}
function goalVal(g){const h=seasonPlayed();if(g.k==='avg')return h.length<4?0:+avgOf(h).toFixed(1);if(g.k==='cs')return h.filter(x=>+x.s.split(' x ')[1]===0).length;return S[g.k]|0}
function checkGoals(){for(const g of S.goals||[]){if(g.done)continue;if(goalVal(g)>=g.n){g.done=1;const rp=10+S.lvl*5,mo=150*(S.lvl+1);S.rep+=rp;S.money+=mo;S.ct=C(S.ct+6,0,100);news(`Meta cumprida: ${g.t}`,`+${rp} reputação, +R$ ${mo}, +6 confiança.`,'voce','career');toast('Meta do treinador cumprida!')}}}

/* ---------- treino e semana ---------- */
const TRN={technical:['Técnica',['pass','dribble'],'dribble'],shooting:['Finalização',['shoot'],'shoot'],physical:['Físico',['speed','physical'],'speed'],tactical:['Tático',['pass','defense'],'defense']};
function train(t,int){if(t==='rest'){if(S.ap<1)return;S.ap--;if(S.inj){const ok=S.inv.fisio||RN()<.5;if(ok&&S.inj.w>1)S.inj.w--;S.tmsg=ok?'Fisioterapia rendeu: recuperação adiantada em 1 semana.':'Sessão de fisioterapia feita. Siga descansando.'}else{S.energy=C(S.energy+(S.inv.fisio?55:40),0,100);moraleAdd(2);S.tmsg='Você descansou e recuperou a energia.'}SND.ui(520);sv();rd();return}
 if(S.inj){S.tmsg='Lesionado não treina. Faça fisioterapia (botão Descansar).';rd();return}if(S.ap<1){S.tmsg='Sem ações nesta semana. Jogue ou avance a semana.';rd();return}
 const cost=int?25:12;if(S.energy<cost){S.tmsg='Energia insuficiente. Descanse primeiro.';rd();return}
 S.ap--;S.energy-=cost;lastT=t;TA.t=0;const ks=TRN[t][1],out=[];
 for(const k of ks){const a=S.attrs[k],base=(int?3:1.5)*(1-a/110)+(RN()<.3?1:0)+(S.inv.pt&&RN()<.4?1:0),d=Math.floor(base*gainMult(k));S.attrs[k]=C(a+d,0,99);const up=addXP(k,(base*gainMult(k)-d)*100);out.push(AN[k]+' +'+(d+up))}
 S.ct=C(S.ct+(int?2:1)+(S.pers==='Profissional'?1:0),0,100);moraleAdd(1);S.tmsg=`Treino ${int?'intenso':'leve'} concluído: ${out.join(', ')}.`;
 if(int&&injure(.025,'Lesão no treino intenso'))S.tmsg+=' Você se machucou!';SND.ui(560);sv();rd()}
function advanceWeek(){const fx=nextFx();if(!fx)return;if(!fx.bye)return;processSlot(fx,null);sv();rd();setTimeout(showEvent,300)}
// jogo em que o jogador não entra (lesão, suspensão, banco): simula e registra
function simMyMatch(fx,why){const [x,y]=simScore(fx.my,fx.opp,fx.home);let pw=null;if(fx.ko&&x===y)pw=RN()<.5?0:1;scorer(fx.comp,fx.my,x);scorer(fx.comp,fx.opp,y);
 const w=x>y||(x===y&&pw===0),dr=x===y&&pw==null;if(fx.comp!=='sel')S.money+=S.crisis>0?0:S.sal;if(S.crisis>0)S.crisis--;
 if(why==='Suspenso')S.susp=Math.max(0,S.susp-1);if(why==='Reserva'){S.bench++;moraleAdd(S.pers==='Estrela'?-6:S.pers==='Profissional'?-2:-4)}
 S.hist.unshift({o:clubName(fx.opp),s:x+' x '+y,n:'-',r:w?'V':dr?'E':'D',g:0,c:fx.comp,p:0,se:S.season,wk:S.wk});S.hist=S.hist.slice(0,40);
 clubForm(w,dr);news(`${clubName(fx.my)} ${x} x ${y} ${clubName(fx.opp)}`,`${why==='Reserva'?'Você ficou no banco.':why==='Suspenso'?'Você cumpriu suspensão.':'Você desfalcou o time.'} ${fx.label}.`,'clube','play');
 processSlot(fx,{s:[x,y],pw});updMV();sv();return{x,y,pw}}
function clubForm(w,dr){S.cf3=w?0:(S.cf3|0)+(dr?0:1);if(S.cf3>=3&&RN()<.5&&S.coach&&S.coach.w>4){const old=S.coach.n;newCoach();S.ct=C(Math.round(S.ct*.5+25),30,60);S.cf3=0;news(`Crise: ${old} é demitido`,`${S.coach.n} assume o ${clubName(S.club)} (${COACH_ST[S.coach.st][0]}). Sua confiança foi recalculada.`,'clube','news')}}

/* ---------- eventos com consequência ---------- */
const EVT=[
 {t:'Entrevista pós-jogo',d:'Os repórteres cercam você na saída do vestiário.',a:[['Elogiar o grupo',()=>{moraleAdd(3);S.rep+=2;S.ct=C(S.ct+2,0,100);return '+3 moral, +2 reputação, +2 confiança.'}],['Provocar o rival',()=>{S.rep+=6;if(RN()<.5){moraleAdd(-6);S.ct=C(S.ct-4,0,100);return 'Repercutiu mal no clube. +6 reputação, -6 moral, -4 confiança.'}moraleAdd(5);return 'A torcida adorou! +6 reputação, +5 moral.'}]]},
 {t:'Convite para festa',d:'Uns amigos chamam para comemorar até tarde.',a:[['Ir à festa',()=>{moraleAdd(8);S.energy-=25;if(RN()<.3){S.ct=C(S.ct-6,0,100);return 'O treinador descobriu! +8 moral, -25 energia, -6 confiança.'}return '+8 moral, -25 energia.'}],['Ficar em casa',()=>{S.energy+=10;return '+10 energia.'}]]},
 {t:'Treino extra',d:'O capitão chama você para treinar depois do horário.',a:[['Topar',()=>{S.energy-=15;const k=pickR(Object.keys(AN)),u=addXP(k,80);S.ct=C(S.ct+2,0,100);return `${AN[k]}: +80 de experiência${u?' (subiu!)':''}, -15 energia, +2 confiança.`}],['Descansar',()=>{S.energy+=5;return '+5 energia.'}]]},
 {t:'Patrocínio local',d:'Uma loja do bairro quer você na propaganda.',a:[['Aceitar',()=>{S.money+=180+S.lvl*150;S.energy-=5;return `+R$ ${180+S.lvl*150}, -5 energia.`}],['Recusar e focar',()=>{S.rep+=2;S.ct=C(S.ct+2,0,100);return '+2 reputação, +2 confiança.'}]]},
 {t:'Torcedor mirim',d:'Um menino com sua camisa pede um autógrafo na grade.',a:[['Dar a camisa de jogo',()=>{S.rep+=4;moraleAdd(4);return 'A foto viralizou! +4 reputação, +4 moral.'}],['Só o autógrafo',()=>{moraleAdd(1);return '+1 moral.'}]]},
 {t:'Dorzinha na coxa',d:'Você sente a posterior depois do jogo.',a:[['Jogar no sacrifício',()=>{S.energy-=10;if(injure(.25,'A dor piorou'))return 'A dor piorou e virou lesão.';return 'Passou. -10 energia.'}],['Ver o fisioterapeuta',()=>{if(!S.inv.fisio)S.money=Math.max(0,S.money-80);S.energy+=10;return (S.inv.fisio?'Seu fisio resolveu.':'Consulta paga (-R$ 80).')+' +10 energia.'}]]},
 {t:'Companheiro lesionado',d:'',pre:()=>S.rival&&S.rival.out===0,set:e=>{e.d=`${S.rival.n}, seu concorrente direto na posição, se machucou no treino.`},a:[['Aproveitar a chance',()=>{S.rival.out=3+((RN()*3)|0);return `${S.rival.n} fica ${S.rival.out} semanas fora: a vaga é sua por enquanto.`}]]},
 {t:'Rivalidade',d:'',pre:()=>{const f=nextFx();return f&&!f.bye},set:e=>{const f=nextFx();e.opp=f.opp;e.d=`Um atacante do ${clubName(f.opp)} disse que você "não joga nada". O próximo jogo é contra eles.`},a:[['Responder nas redes',()=>{S.rv={c:nextFx().opp,b:2};moraleAdd(4);S.ct=C(S.ct-2,0,100);return 'Clima esquentou! No próximo jogo, gols e boas notas valem mais reputação (e erros pesam mais).'}],['Responder em campo',()=>{S.rv={c:nextFx().opp,b:1};return 'Postura elogiada. No próximo jogo, boas atuações rendem reputação extra.'}]]},
 {t:'Crise financeira',d:'O clube atrasou os salários do elenco.',pre:()=>S.lvl>0&&CL[S.club].t<2,a:[['Cobrar a diretoria',()=>{S.ct=C(S.ct-5,0,100);return 'Você recebeu, mas a relação esfriou. -5 confiança.'}],['Aceitar o atraso',()=>{S.crisis=2;S.ct=C(S.ct+4,0,100);moraleAdd(-3);return 'Sem salário nos próximos 2 jogos. +4 confiança, -3 moral.'}]]},
 {t:'Proposta inesperada',d:'',pre:()=>!S.con.loan&&Object.values(S.interest).some(v=>v>=78),set:e=>{const c=+Object.entries(S.interest).sort((a,b)=>b[1]-a[1])[0][0];e.c=c;e.d=`O ${clubName(c)} fez uma proposta fora da janela e quer resposta agora!`},a:[['Ouvir a proposta',e=>{const o=mkOffer(e.c,'transfer',Math.max(80,S.interest[e.c]));o.b=Math.round(o.b*1.3);S.offers.push(o);setTimeout(()=>negotiate(S.offers.length-1),50);return 'Abrindo a negociação...'}],['Ficar no clube',()=>{S.ct=C(S.ct+6,0,100);moraleAdd(2);return 'O clube valorizou sua lealdade. +6 confiança.'}]]}];
function rollEvent(){if(S.evq||RN()>=.3)return;const ok=EVT.map((e,i)=>i).filter(i=>!EVT[i].pre||EVT[i].pre());if(!ok.length)return;const i=pickR(ok),e={...EVT[i],i};if(e.set)e.set(e);S.evq={t:e.t,d:e.d,i,c:e.c}}
function showEvent(){const e=S.evq;if(!e||M||!$('evm').classList.contains('hidden'))return;const ev=e.i!=null?{...EVT[e.i],d:e.d,c:e.c}:e,box=$('evm');
 box.querySelector('.card').innerHTML=`<h2>${icon('news')} ${ev.t}</h2><p>${ev.d}</p><div class="tr" style="margin-top:10px">${ev.a.map((a,k)=>`<button data-ev="${k}"><b class="yl">${a[0]}</b></button>`).join('')}</div><p id="evr" class="yl"></p>`;box.classList.remove('hidden');
 box.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{S.evq=null;const txt=ev.a[+b.dataset.ev][1](ev);S.energy=C(S.energy,0,100);S.morale=C(S.morale,S.inv.psi?45:0,100);news(ev.t,txt,'voce','news');sv();
  if(txt==='Abrindo a negociação...')return;box.querySelector('.tr').innerHTML='';$('evr').innerHTML=txt+'<br><br><button class="go" id="evok" style="width:100%">Continuar</button>';$('evok').onclick=()=>{box.classList.add('hidden');rd()};SND.ui(700)})}

/* ---------- loja ---------- */
const SHOP=[
 {k:'boot',lv:1,n:'Chuteira Pro',p:400,d:'Faixa verde +1,5% em todos os lances. Chuteira nova no seu sprite.',ic:'speed'},
 {k:'boot',lv:2,n:'Chuteira Elite',p:1200,d:'Faixa verde +3%. Chuteira dourada.',ic:'star',req:1},
 {k:'fisio',lv:1,n:'Fisioterapeuta',p:500,d:'+5 de recuperação semanal, descanso rende +55 e fisioterapia sempre funciona.',ic:'rest'},
 {k:'pt',lv:1,n:'Personal trainer',p:800,d:'40% de chance de +1 extra em cada atributo treinado.',ic:'train'},
 {k:'emp',lv:1,n:'Empresário',p:600,d:'Salários e luvas maiores e mais chance nas negociações.',ic:'mkt'},
 {k:'psi',lv:1,n:'Psicólogo',p:450,d:'Moral nunca cai abaixo de 45 e mais confiança no início dos jogos.',ic:'news'}];
function buy(i){const it=SHOP[i];if(S.money<it.p||(S.inv[it.k]|0)>=it.lv||(it.req&&(S.inv[it.k]|0)<it.req))return;S.money-=it.p;S.inv[it.k]=it.lv;news(`Compra: ${it.n}`,'','voce','coin');SND.ui(900);toast(`${it.n} adquirido!`);sv();rd()}
function buySup(){if(S.money<60||S.energy>=100)return;S.money-=60;S.energy=C(S.energy+25,0,100);SND.ui(760);toast('Suplemento: +25 de energia');sv();rd()}

/* ---------- migração de saves antigos (2.0 / 3.0 / 3.1) ---------- */
function migrate(o){const d=def(),n={...d,...o};if((o.v|0)>=SAVE_V)return n;
 n.inv={...d.inv,...(o.inv||{})};n.T={...d.T,...(o.T||{})};n.xp={...d.xp,...(o.xp||{})};
 n.news=(o.feed||[]).slice(0,8).map(t=>({t,d:'',cat:'voce',ic:'news',s:o.season||2026,w:0}));n.feed=[];
 const r=rng(hash(n.name+n.season));n.style=STY_POS(n.pos)[0];n.pers='Profissional';const ov=Math.round(Object.values(n.attrs).reduce((a,b)=>a+b,0)/6);n.pot=C(ov+10+((r()*12)|0),62,94);
 n.con={end:(n.season||2026)+1,loan:null};n.ct=55;n.hist=(o.hist||[]).map((h,i)=>({...h,c:h.c||'bra',p:1,se:i<(o.G|0)?o.season:(o.season||2026)-1}));n.offers=[];n.v=SAVE_V;
 const la=n.age<=17?0:n.age<=20?1:2;n.lvl=Math.max(n.lvl|0,la);
 S=n;const rd0=o.rd|0,oldTab=o.tab;buildSeason();
 if(rd0>0&&Array.isArray(oldTab)){BR.forEach(i=>{if(oldTab[i])S.comp.bra.tab[i]={...oldTab[i]}});S.comp.est={...mkKO([S.club]),champ:S.club,skip:1};const wi=S.sl.findIndex(x=>x.k==='bra'&&x.r===rd0);
  if(wi>0){if(S.sl.slice(0,wi).some(x=>x.k==='cdb'))S.comp.cdb={...mkKO([S.club]),champ:-1,skip:1};S.wk=wi}}
 S.ow={pre:1};news('Carreira atualizada para a versão 3.2','Calendário, contratos, potencial e novas competições foram ativados.','voce','star');return S}
function validSave(o){return o&&typeof o==='object'&&o.attrs&&typeof o.name==='string'&&Array.isArray(o.hist||[])}
/* ---------- slots, exportar e importar ---------- */
const SLOTS=3;
function slotMeta(i){const o=readSave('bfc_slot'+i);return o?{name:o.name,club:clubName(o.club),season:o.season,lvl:LV[o.lvl|0].n,at:o.saved}:null}
function saveSlot(i){S.saved=Date.now();try{localStorage.setItem('bfc_slot'+i,JSON.stringify(S));toast(`Salvo no espaço ${i}`)}catch(e){toast('Erro ao salvar')}}
function loadSlot(i){const o=readSave('bfc_slot'+i);if(!validSave(o)){toast('Espaço vazio ou inválido');return}if(M)return;S=migrate(o);sv();rd();page('home');toast(`Carreira de ${S.name} carregada`)}
function exportSave(){const data=JSON.stringify(S),pkg=JSON.stringify({app:'BrasilFootballCareer',v:SAVE_V,sum:hash(data),data:S});const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([pkg],{type:'application/json'}));
 a.download=`bfc_${S.name.replace(/\W+/g,'_')}_${S.season}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast('Arquivo exportado')}
function importSave(file){const fr=new FileReader();fr.onload=()=>{try{const p=JSON.parse(fr.result),o=p&&p.app==='BrasilFootballCareer'?p.data:p;if(!validSave(o))throw 0;
  if(p.sum&&p.sum!==hash(JSON.stringify(o))&&!confirm('O arquivo foi modificado fora do jogo. Importar mesmo assim?'))return;if(M)return;S=migrate(o);S.made=1;sv();closeMenu();rd();page('home');toast(`Carreira de ${S.name} importada`)}catch(e){toast('Arquivo inválido')}};fr.readAsText(file)}
