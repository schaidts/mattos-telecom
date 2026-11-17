/* ================= 10. CARREIRA 3.1 — contexto, dificuldade, metas, eventos, loja ================= */
/* ---- 1. Situações de jogo: mudam a opção mais indicada em cada lance ----
   m = multiplicador da chance de sucesso por opção, w = ajuste na largura da faixa verde. */
const SIT={
 a:[{id:'cara',t:'Cara a cara com o goleiro',d:'Você escapou da marcação!',m:[1.25,1,.85],w:[.04,0,-.02]},
    {id:'marcado',t:'Marcação colada',d:'O zagueiro está no seu cangote.',m:[.8,.95,1.2],w:[-.03,-.01,.03]},
    {id:'fora',t:'Na entrada da área',d:'Longe do gol, mas com espaço.',m:[.8,1,1.15],w:[-.02,.02,.02]},
    {id:'contra',t:'Contra-ataque',d:'Campo aberto na sua frente!',m:[1,1.2,1.1],w:[0,.03,.01]},
    {id:'falta',t:'Falta perigosa',d:'Você vai para a cobrança. Barreira armada.',m:[1.15,.6,1],w:[.02,-.04,0]}],
 d:[{id:'drible',t:'Atacante driblador',d:'Ele gosta de cortar para dentro.',m:[.85,1.05,1.15],w:[-.02,0,.02]},
    {id:'veloz',t:'Contra-ataque rival',d:'O ponta vem em velocidade.',m:[.9,1.2,.9],w:[0,.03,-.01]},
    {id:'alto',t:'Bola alta na área',d:'Cruzamento procurando o centroavante.',m:[.8,1,1.25],w:[-.02,0,.03]},
    {id:'ultimo',t:'Último homem',d:'Se errar, é gol. Não pode falhar.',m:[1.1,.95,1],w:[.02,-.01,0]}],
 g:[{id:'longe',t:'Chute de longe',d:'Bomba de fora da área!',m:[1.2,.7,1.05],w:[.03,-.03,.01]},
    {id:'cara',t:'Cara a cara',d:'O atacante está sozinho contra você.',m:[.9,1.25,.8],w:[-.01,.03,-.02]},
    {id:'colocado',t:'Chute colocado',d:'Bola indo no cantinho.',m:[1.15,.9,.85],w:[.02,0,-.02]},
    {id:'penalti',t:'Pênalti!',d:'O árbitro marcou. É você contra o batedor.',m:[1.05,.55,.9],w:[0,-.05,-.01]}]};
function pickSit(r){const L=SIT[r];let s=pickR(L);if(s.id==='penalti'&&RN()<.6)s=pickR(L);return s}
function sitTag(m){return m>=1.1?['FAVORÁVEL','gr']:m<=.9?['DIFÍCIL','rd']:['NORMAL','mt']}
function gameState(){if(!M)return '';const d=M.s[0]-M.s[1];if(M.min>=75&&d<0)return 'PRECISA DO GOL!';if(M.min>=75&&d>=0&&d<=1)return 'SEGURE O RESULTADO!';if(M.min>=75&&d===0)return 'JOGO EMPATADO NO FIM';return ''}
/* ---- 4. Dificuldade da barra: cresce com a categoria, o adversário, o cansaço e lances decisivos ---- */
function zoneW(i){const o=OPT[role()][i],s=M.sit;let w=.1+S.attrs[o[1]]/100*.28+M.cf*.06+S.energy/1000-o[2]*.1-CL[M.oi].t*.02;
 w+=-S.lvl*.025+(s?s.w[i]:0)-(100-M.sta)/100*.06+[0,.015,.03][S.inv.boot|0];return C(w,.06,.4)}
const zoneSp=i=>3+OPT[role()][i][2]*4+S.lvl*.5+CL[M.oi].t*.35+(M.dec?.6:0);
const sitMul=i=>M.sit?M.sit.m[i]:1;
/* ---- 3. Loja e equipe ---- */
const SHOP=[
 {k:'boot',lv:1,n:'Chuteira Pro',p:400,d:'Faixa verde +1,5% em todos os lances. Chuteira nova no seu sprite.',ic:'speed'},
 {k:'boot',lv:2,n:'Chuteira Elite',p:1200,d:'Faixa verde +3%. Chuteira dourada.',ic:'star',req:1},
 {k:'fisio',lv:1,n:'Fisioterapeuta',p:500,d:'Descanso rende +55 de energia e a partida gasta só 20.',ic:'rest'},
 {k:'pt',lv:1,n:'Personal trainer',p:800,d:'40% de chance de +1 extra em cada atributo treinado.',ic:'train'},
 {k:'emp',lv:1,n:'Empresário',p:600,d:'Salário 20% maior em transferências e propostas melhores.',ic:'mkt'},
 {k:'psi',lv:1,n:'Psicólogo',p:450,d:'Moral nunca cai abaixo de 45 e mais confiança no início dos jogos.',ic:'news'}];
function buy(i){const it=SHOP[i];if(S.money<it.p||(S.inv[it.k]|0)>=it.lv||(it.req&&(S.inv[it.k]|0)<it.req))return;S.money-=it.p;S.inv[it.k]=it.lv;feed(`Compra: ${it.n}.`);SND.ui(900);toast(`${it.n} adquirido!`);sv();rd()}
function buySup(){if(S.money<60||S.energy>=100)return;S.money-=60;S.energy=C(S.energy+25,0,100);SND.ui(760);toast('Suplemento: +25 de energia');sv();rd()}
const moraleFloor=()=>S.inv.psi?45:0;
/* ---- 2. Metas do treinador ---- */
function mkGoals(){const r=role(),l=S.lvl,P=r==='a'?[{k:'Gl',n:4+l*2,t:'Marque {n} gols'},{k:'A',n:2+l,t:'Dê {n} assistências'},{k:'W',n:5+l,t:'Vença {n} jogos'},{k:'avg',n:7,t:'Nota média {n}+ (mín. 4 jogos)'}]
  :[{k:'Sv',n:5+l*2,t:'Salve {n} lances'},{k:'W',n:5+l,t:'Vença {n} jogos'},{k:'avg',n:7,t:'Nota média {n}+ (mín. 4 jogos)'},{k:'cs',n:2+l,t:'Termine {n} jogos sem sofrer gol'}];
 const a=[...P].sort(()=>RN()-.5).slice(0,2);S.goals=a.map(g=>({...g,t:g.t.replace('{n}',g.n),done:0}));S.gs=S.season}
const seasonHist=()=>S.hist.slice(0,S.G);
function goalVal(g){const h=seasonHist();if(g.k==='avg')return h.length<4?0:+(h.reduce((a,b)=>a+ +b.n,0)/h.length).toFixed(1);if(g.k==='cs')return h.filter(x=>+x.s.split(' x ')[1]===0).length;return S[g.k]|0}
function checkGoals(){let got=0;for(const g of S.goals||[]){if(g.done)continue;if(goalVal(g)>=g.n){g.done=1;const rp=10+S.lvl*5,mo=150*(S.lvl+1);S.rep+=rp;S.money+=mo;feed(`Meta cumprida: ${g.t}! +${rp} reputação, +R$ ${mo}.`);toast('Meta do treinador cumprida!');got=1}}return got}
/* ---- prêmios e propostas no fim da temporada ---- */
function seasonEnd(pos){const L=LV[S.lvl].n,se=S.season,h=seasonHist(),avg=h.length?h.reduce((a,b)=>a+ +b.n,0)/h.length:0,add=t=>{S.tro.unshift(t);feed('🏆 '+t)};
 if(pos===1){add(`Campeão Brasileirão ${L} ${se}`);S.money+=500;S.rep+=15}
 if(S.Gl>=6+S.lvl*2)add(`Chuteira de Ouro ${L} ${se} (${S.Gl} gols)`);
 if(S.Sv>=12)add(`Paredão da temporada ${L} ${se}`);
 if(avg>=7.5&&h.length>=6)add(`Craque da temporada ${L} ${se} (média ${avg.toFixed(1)})`);
 for(const g of S.goals||[])if(!g.done){S.morale=C(S.morale-5,moraleFloor(),100);feed(`Meta não cumprida: ${g.t}.`)}
 const o=ovr(),cand=CL.map((c,i)=>({c,i})).filter(x=>x.i!==S.club&&x.c.t>=CL[S.club].t&&x.c.min<=o+4&&x.c.min>=CL[S.club].min-6).sort(()=>RN()-.5).slice(0,2);
 S.offers=cand.map(x=>({c:x.i,b:Math.round(x.c.s*3*(S.inv.emp?1.4:1))}));if(S.offers.length)feed(`Você recebeu ${S.offers.length} proposta(s)! Veja no Mercado.`);
 S.Sv=0;S.goals=null}
function acceptOffer(k){const o=S.offers[k];if(!o||S.trs===S.season)return;S.money+=o.b;S.offers=[];trans(o.c,true);toast(`Luvas recebidas: R$ ${o.b}`)}
/* ---- eventos entre partidas ---- */
const EVT=[
 {t:'Entrevista pós-jogo',d:'Os repórteres cercam você na saída do vestiário.',a:[['Elogiar o grupo',()=>{S.morale+=3;S.rep+=2;return 'O vestiário gostou. +3 moral, +2 reputação.'}],['Provocar o rival',()=>{S.rep+=6;if(RN()<.5){S.morale-=6;return 'A provocação repercutiu mal no clube. +6 reputação, -6 moral.'}S.morale+=5;return 'A torcida adorou! +6 reputação, +5 moral.'}]]},
 {t:'Convite para festa',d:'Uns amigos chamam para comemorar até tarde.',a:[['Ir à festa',()=>{S.morale+=8;S.energy-=25;return 'Noite divertida, mas cansativa. +8 moral, -25 energia.'}],['Ficar em casa',()=>{S.energy+=10;return 'Noite de sono em dia. +10 energia.'}]]},
 {t:'Treino extra',d:'O capitão chama você para treinar finalização depois do treino.',a:[['Topar',()=>{S.energy-=15;const k=pickR(Object.keys(AN));S.attrs[k]=C(S.attrs[k]+2,0,99);return `${AN[k]} +2, -15 energia.`}],['Descansar',()=>{S.energy+=5;return '+5 energia.'}]]},
 {t:'Patrocínio local',d:'Uma loja do bairro quer você na propaganda.',a:[['Aceitar',()=>{S.money+=180;S.energy-=5;return '+R$ 180. A gravação cansou um pouco (-5 energia).'}],['Recusar e focar',()=>{S.rep+=2;S.morale+=2;return 'O técnico gostou do foco. +2 reputação, +2 moral.'}]]},
 {t:'Torcedor mirim',d:'Um menino com sua camisa pede um autógrafo na grade.',a:[['Dar a camisa de jogo',()=>{S.rep+=4;S.morale+=4;return 'Foto viralizou! +4 reputação, +4 moral.'}],['Só o autógrafo',()=>{S.morale+=1;return '+1 moral.'}]]},
 {t:'Dorzinha na coxa',d:'Você sente a posterior depois do jogo.',a:[['Jogar no sacrifício',()=>{S.energy-=12;return 'Ainda incomoda. -12 energia.'}],['Ver o fisioterapeuta',()=>{if(S.inv.fisio){S.energy+=15;return 'Seu fisio resolveu. +15 energia.'}S.money=Math.max(0,S.money-80);S.energy+=15;return 'Consulta paga (-R$ 80). +15 energia.'}]]}];
function rollEvent(){const h=S.hist.slice(0,5),avg=h.length?h.reduce((a,b)=>a+ +b.n,0)/h.length:0;
 if(S.conv!==S.season&&h.length>=4&&avg>=7.6&&S.rep>=30){S.conv=S.season;const t=`Convocado para a Seleção ${LV[S.lvl].n} ${S.season}`;
  S.evq={t:'Convocação!',d:`Sua fase chamou atenção: você foi convocado para a Seleção Brasileira ${LV[S.lvl].n}!`,a:[['Vestir a amarelinha',()=>{S.rep+=15;S.morale+=10;S.tro.unshift(t);return '+15 reputação, +10 moral. Entrou para a sala de troféus.'}]]};return}
 if(RN()<.32){const e=EVT[(RN()*EVT.length)|0];S.evq={t:e.t,d:e.d,i:EVT.indexOf(e)}}}
function showEvent(){const e=S.evq;if(!e||M)return;const ev=e.i!=null?EVT[e.i]:e,box=$('evm');
 box.querySelector('.card').innerHTML=`<h2>${icon('news')} ${ev.t}</h2><p>${ev.d}</p><div class="tr" style="margin-top:10px">${ev.a.map((a,k)=>`<button data-ev="${k}"><b class="yl">${a[0]}</b></button>`).join('')}</div><p id="evr" class="yl"></p>`;box.classList.remove('hidden');
 box.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{const txt=ev.a[+b.dataset.ev][1]();S.energy=C(S.energy,0,100);S.morale=C(S.morale,moraleFloor(),100);S.evq=null;feed(ev.t+': '+txt);sv();
  box.querySelector('.tr').innerHTML='';$('evr').innerHTML=txt+'<br><br><button class="go" id="evok" style="width:100%">Continuar</button>';$('evok').onclick=()=>{box.classList.add('hidden');rd()};SND.ui(700)})}
/* ---- avisos rápidos ---- */
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}
