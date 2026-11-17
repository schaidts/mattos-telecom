#!/usr/bin/env node
/* Testador automático do Brasil Football Career.
   Joga a carreira pela interface (como um jogador), verifica invariantes do save a cada semana,
   testa salvamento/carregamento/exportação/importação, migração de saves antigos e layout no celular.
   Uso: node tools/autotest.js [semanas=40] [--mobile] [--shots=pasta]
   Requer Playwright (já instalado no ambiente de nuvem). Sai com código 1 se encontrar problemas. */
const {chromium,devices}=require('playwright');const path=require('path'),fs=require('fs');
const FILE='file://'+path.resolve(__dirname,'..','Brasil_Football_Career_3.0.html');
const args=process.argv.slice(2),WEEKS=+(args.find(a=>/^\d+$/.test(a))||40),MOBILE=args.includes('--mobile'),SHOTS=(args.find(a=>a.startsWith('--shots='))||'').slice(8);
const problems=[],log=(...a)=>console.log(...a),fail=m=>{problems.push(m);console.log('  ✖',m)};
let shotN=0;async function shot(pg,name){if(!SHOTS)return;fs.mkdirSync(SHOTS,{recursive:true});await pg.screenshot({path:path.join(SHOTS,String(++shotN).padStart(3,'0')+'_'+name+'.png')})}
// invariantes do estado salvo
const CHECK=()=>{const e=[],num=(v,a,b,n)=>{if(typeof v!=='number'||!isFinite(v)||v<a||v>b)e.push(`${n}=${v}`)};
 JSON.stringify(S,(k,v)=>{if(typeof v==='number'&&!isFinite(v))e.push('NaN em '+k);return v});
 Object.entries(S.attrs).forEach(([k,v])=>num(v,0,99,'attr.'+k));num(S.energy,0,100,'energy');num(S.morale,0,100,'morale');num(S.ct,0,100,'ct');num(S.money,0,1e9,'money');num(S.rep,0,1e7,'rep');
 num(S.wk,0,S.sl.length,'wk');num(S.ap,0,2,'ap');if(S.club<0||S.club>12)e.push('club fora do Brasileirão: '+S.club);if(S.lvl<0||S.lvl>2)e.push('lvl '+S.lvl);
 const T=S.comp.bra.tab,J=Object.values(T).reduce((a,t)=>a+t.j,0),GP=Object.values(T).reduce((a,t)=>a+t.gp,0),GC=Object.values(T).reduce((a,t)=>a+t.gc,0);if(J%2)e.push('soma de jogos ímpar na tabela');if(GP!==GC)e.push('gols pró != gols contra na tabela');
 Object.values(T).forEach(t=>{if(t.v+t.e+t.d!==t.j||t.p!==t.v*3+t.e)e.push('linha da tabela inconsistente')});
 if(S.G!==S.hist.filter(h=>h.p&&h.se===S.season).length)e.push(`S.G=${S.G} difere dos jogos da temporada no histórico`);
 const gs=S.hist.filter(h=>h.p&&h.se===S.season).reduce((a,h)=>a+(h.g|0),0);if(gs!==S.Gl)e.push(`gols da temporada ${S.Gl} != soma do histórico ${gs}`);
 if(S.inj&&S.inj.w<0)e.push('lesão com semanas negativas');if(document.documentElement.scrollWidth>innerWidth+2)e.push('rolagem horizontal: '+document.documentElement.scrollWidth+'>'+innerWidth);
 return e};
async function closeModals(pg){for(let i=0;i<6;i++){const vis=await pg.evaluate(()=>['evm','setm'].filter(id=>!document.getElementById(id).classList.contains('hidden')));if(!vis.length)return;
  if(await pg.isVisible('#evm [data-ev]')){await pg.click('#evm [data-ev="'+(Math.random()<.5?0:(await pg.$$('#evm [data-ev]')).length-1)+'"]');await pg.waitForTimeout(80);if(await pg.isVisible('#evok'))await pg.click('#evok');continue}
  if(await pg.isVisible('#prok')){await pg.click('#prok');continue}if(await pg.isVisible('#ng0')){await pg.click(Math.random()<.5?'#ng0':'#ng3');continue}if(await pg.isVisible('#sok')){await pg.click('#sok');continue}
  if(await pg.isVisible('[data-ps]')){await pg.click('[data-ps="1"]');return 'match'}if(await pg.isVisible('#sclose')){await pg.click('#sclose');continue}if(await pg.isVisible('#evok')){await pg.click('#evok');continue}break}}
async function playMatch(pg,stats){const t0=Date.now();while(Date.now()-t0<240000){const ph=await pg.evaluate(()=>M?M.ph:null);if(!ph)return true;
  if(ph==='intro')await pg.click('#pitch').catch(()=>{});
  else if(ph==='pick'||ph==='sop'){const n=(await pg.$$('[data-o]')).length;if(n){const k=(Math.random()*n)|0;await pg.click(`[data-o="${k}"]`).catch(()=>{});stats.moments++}}
  else if(ph==='time'||ph==='sot'){const mode=Math.random();await pg.evaluate(m=>{if(m<.45)M.t0=performance.now()-(Math.asin((M.z.c-.5)*2)/M.z.sp)*1000},mode);await pg.click('#act').catch(()=>{})}
  else if(ph==='end'){if(stats.shots<6){await shot(pg,'resultado');stats.shots++}await pg.click('#fin2').catch(()=>{});await pg.waitForTimeout(300);return true}
  await pg.waitForTimeout(120)}fail('partida travou (timeout) na fase '+await pg.evaluate(()=>M&&M.ph));return false}
(async()=>{const b=await chromium.launch();const ctx=await b.newContext(MOBILE?{...devices['iPhone 13']}:{viewport:{width:1100,height:900}});const pg=await ctx.newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});await pg.route(/fonts\.g/,r=>r.abort());
 log('▶ Abrindo o jogo',MOBILE?'(celular)':'(desktop)');await pg.goto(FILE+'?speed=6');await pg.waitForTimeout(500);await shot(pg,'menu');
 // 1. criação pelo assistente
 await pg.click('#mnew');await pg.fill('#nn','Teste Robô');await pg.click('#wn');await pg.click('[data-cp="Atacante"]');await pg.click('#wn');await pg.click('[data-sk="3"]');await pg.click('#wn');await pg.click('[data-cc="1"]');await shot(pg,'criacao');await pg.click('#wn');await pg.waitForTimeout(300);
 if(!await pg.evaluate(()=>S.made&&S.sl.length>10))fail('carreira não foi criada');else log('✔ carreira criada pelo assistente');
 // 2. todas as telas e subabas
 for(const [p,subs] of [['home',[]],['train',[]],['play',['cal','tab','copas','art','elenco']],['career',['perfil','stats','trof','news','clubs']],['mkt',['ofertas','clubes','loja','hist']]]){await pg.click(`nav button[data-p="${p}"]`);
  for(const s of subs.length?subs:[null]){if(s)await pg.click(`[data-sg="${p}:${s}"]`);await pg.waitForTimeout(60);const e=await pg.evaluate(CHECK);if(e.length)fail(`tela ${p}${s?'/'+s:''}: ${e.join('; ')}`);if(shotN<14)await shot(pg,p+(s?'_'+s:''))}}
 log('✔ telas e subabas renderizadas');await pg.click('nav button[data-p="home"]');
 // 3. treino (ações por semana)
 await pg.click('nav button[data-p="train"]');await pg.click('[data-ts="shooting"]');await pg.click('#trgo');await pg.click('#trgo').catch(()=>{});
 const ap=await pg.evaluate(()=>S.ap);if(ap!==0)fail('ações da semana não foram consumidas: '+ap);if(!await pg.evaluate(()=>document.getElementById('trgo').disabled))fail('treino liberado sem ações');else log('✔ treino limita 2 ações por semana');
 await pg.click('nav button[data-p="home"]');
 // 4. temporadas
 const stats={matches:0,sims:0,byes:0,moments:0,shots:0,seasons:new Set()};
 for(let w=0;w<WEEKS;w++){await closeModals(pg);if(await pg.evaluate(()=>S.freeAg)){await pg.click('nav button[data-p="mkt"]');await pg.click('[data-sg="mkt:ofertas"]');if(await pg.isVisible('[data-ng]')){await pg.click('[data-ng="0"]');await pg.click('#ng0');await closeModals(pg)}await pg.click('nav button[data-p="home"]')}
  stats.seasons.add(await pg.evaluate(()=>S.season));
  await pg.waitForTimeout(550);await closeModals(pg);
  if(await pg.isVisible('#adv')){await pg.click('#adv');stats.byes++}
  else if(await pg.isVisible('#st')){await pg.click('#st');await pg.waitForTimeout(150);const r=await closeModals(pg);if(await pg.evaluate(()=>!!M)){if(await playMatch(pg,stats))stats.matches++}else stats.sims++}
  else{fail('sem botão de próximo compromisso na semana '+w);await shot(pg,'travado');break}
  await pg.waitForTimeout(100);const e=await pg.evaluate(CHECK);if(e.length)fail(`semana ${w}: ${e.join('; ')}`);
  if(Math.random()<.3){await pg.waitForTimeout(600);await closeModals(pg);await pg.click('nav button[data-p="train"]');await pg.click('[data-ts="'+['physical','technical','tactical','rest'][(Math.random()*4)|0]+'"]');await pg.click('#trgo').catch(()=>{});await pg.click('nav button[data-p="home"]')}}
 log(`✔ ${stats.matches} partidas jogadas, ${stats.sims} simuladas, ${stats.byes} folgas, ${stats.moments} lances, temporadas: ${[...stats.seasons].join(', ')}`);
 // 5. salvamento: slots, export/import (round-trip) e backup
 const sv=await pg.evaluate(()=>{const a=JSON.stringify(S);saveSlot(1);const m=slotMeta(1);const o=readSave('bfc_slot1');S.money+=12345;loadSlot(1);const back=JSON.stringify(S)===a||S.money!==o.money+12345;
  localStorage.setItem('bfc2','{quebrado');const bak=readSave('bfc2_bak');sv();return{meta:!!m,back,bak:!!bak}});
 if(!sv.meta||!sv.back)fail('slot de salvamento falhou');if(!sv.bak)fail('backup automático ausente');else log('✔ slots e backup automático');
 const [dl]=await Promise.all([pg.waitForEvent('download'),pg.evaluate(()=>exportSave())]);const fp=await dl.path(),pkg=JSON.parse(fs.readFileSync(fp,'utf8'));
 if(pkg.app!=='BrasilFootballCareer'||!pkg.data||!pkg.data.attrs)fail('exportação inválida');else{await pg.setInputFiles('#impf',fp);await pg.waitForTimeout(400);const ok=await pg.evaluate(n=>S.name===n,pkg.data.name);if(!ok)fail('importação falhou');else log('✔ exportar e importar carreira')}
 // 6. migração de save antigo (formato 2.0/3.1)
 const mig=await pg.evaluate(()=>{const old={name:'Antigo',pos:'Goleiro',made:1,club:2,rd:5,lvl:0,season:2027,age:19,energy:80,attrs:{speed:50,shoot:40,pass:50,dribble:45,defense:60,physical:55},G:5,Gl:0,A:1,W:3,D:1,L:1,hist:[{o:'X',s:'1 x 0',n:'7.2',r:'V',g:0}],feed:['oi'],tab:Array.from({length:12},()=>({p:3,j:1,v:1,e:0,d:0,gp:1,gc:0}))};
  S=migrate(old);return{v:S.v,lvl:S.lvl,wk:S.wk,slot:S.sl[S.wk],club:S.club,ok:S.comp&&S.comp.bra.tab[2].p===3}});
 if(mig.v!==4||!mig.ok||mig.lvl!==1)fail('migração de save antigo: '+JSON.stringify(mig));else log('✔ migração de save antigo (categoria ajustada pela idade, tabela preservada)');
 if(errs.length)errs.forEach(e=>fail('erro de JavaScript: '+e));else log('✔ nenhum erro de JavaScript no console');
 await b.close();log(problems.length?`\n✖ ${problems.length} problema(s) encontrado(s)`:'\n✔ Tudo certo');process.exit(problems.length?1:0)})();
