/* ================= 11. RENDERIZAÇÃO DA PARTIDA ================= */
let VIG=null;
function vignette(){const c=mkCanvas(W,H),x=c.getContext('2d'),g=x.createRadialGradient(W/2,H/2,90,W/2,H/2,420);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.6)');x.fillStyle=g;x.fillRect(0,0,W,H);return c}
function mdraw(t){const x=$('pitch').getContext('2d'),T=t/1000,ST=M.ST;x.setTransform(1,0,0,1,0,0);x.imageSmoothingEnabled=false;
 if(M.ph==='intro'&&M.it<6.2){if(M.it<3.2)bandeirao(x,M.it);else lineups(x,M.it-3.2);return}
 const c=M.cam;let sx=0,sy=0;if(M.sk>0&&!RM){sx=(RN()-.5)*12*M.sk;sy=(RN()-.5)*12*M.sk}
 x.setTransform(c.z,0,0,c.z,Math.round(W/2-c.x*c.z+sx),Math.round(H/2-c.y*c.z+sy));
 x.drawImage(ST.bg,0,0);drawCrowd(x,ST,T,M.cx,M.boo,M.wv);drawAds(x,ST,T);x.drawImage(ST.fg,0,0);
 x.translate(0,OY);
 for(const p of M.A)shadowOf(x,p,ST.lights);drawCorner(x,T);
 const it=M.A.map(p=>({y:p.y,p}));it.push({y:M.b.y+.5,b:1},{y:166,g:0,pt:'back'},{y:166,g:1,pt:'back'},{y:234.5,g:0,pt:'front'},{y:234.5,g:1,pt:'front'});it.sort((a,b)=>a.y-b.y);
 for(const o of it){if(o.p){const p=o.p;if(p.cur==='sprint')speedLines(x,p);spr(x,p,M.K[p.t],T);
   if(p.me&&M.ph!=='end'){const lay=p.cur==='down'||p.cur==='fall'||p.cur==='slide'||p.cur==='gksad'||p.cur==='smother'||!!p.rot,yy=p.y-(p.z||0)-(lay?26:44)+Math.sin(T*6)*2;x.fillStyle='#000';x.fillRect(p.x-5,yy-1,11,6);x.fillStyle='#ffd400';x.beginPath();x.moveTo(p.x,yy+7);x.lineTo(p.x-5,yy);x.lineTo(p.x+5,yy);x.fill();
    if(M.ph==='pick'||M.ph==='time'){x.strokeStyle='#ffd400';x.lineWidth=1.5;x.beginPath();x.ellipse(p.x,p.y+1,13+Math.sin(T*8)*1.5,5,0,0,7);x.stroke()}}}
  else if(o.b){if(!M.b.hide)drawBall(x,M.b,T)}else drawGoal(x,o.g,M.net[o.g],o.pt)}
 FX.draw(x);x.translate(0,-OY);
 if(ST.mul){if(LQ){x.globalAlpha=.45;x.fillStyle=M.E.night?'#0a1430':M.E.tarde?'#5a2a00':'#202830';x.fillRect(0,0,W,H);x.globalAlpha=1}else{x.globalCompositeOperation='multiply';x.drawImage(ST.mul,0,0);x.globalCompositeOperation='source-over'}}
 if(ST.add){x.globalCompositeOperation='lighter';x.drawImage(ST.add,0,0);x.globalCompositeOperation='source-over'}
 // ---- tela
 x.setTransform(1,0,0,1,0,0);
 if(ST.rain){x.fillStyle='rgba(200,225,255,.45)';const dt=.016;for(const d of ST.rain){d.y+=d.s*dt;d.x-=d.s*dt*.15;if(d.y>H){d.y=-10;d.x=RN()*W*1.1;if(RN()<.25)FX.burst(RN()*W,RN()*400,2,'splash')}x.fillRect(d.x,d.y,1,7)}}
 if(M.ph==='pick'||M.ph==='time'){VIG=VIG||vignette();x.drawImage(VIG,0,0);plate(x)}
 if(M.lb>.02){const h=Math.round(30*M.lb);x.fillStyle='#000';x.fillRect(0,0,W,h);x.fillRect(0,H-h,W,h)}
 if(M.fl>0){x.fillStyle=`rgba(255,255,255,${M.fl*.6})`;x.fillRect(0,0,W,H)}
 if(M.ban)drawBanner(x,M.ban);
 if(M.ph==='run'){x.fillStyle='#000a';x.fillRect(W-150,H-30,140,20);x.fillStyle='#ffd400';x.font='8px "Press Start 2P",monospace';x.textAlign='right';x.fillText('▶▶ ACELERANDO',W-18,H-17);x.textAlign='left'}}
function plate(x){const u=M.u,o=M.ph==='time'?OPT[role()][M.o_]:null;x.fillStyle='#000c';x.fillRect(10,H-96,260,62);x.fillStyle='#ffd400';x.fillRect(10,H-96,4,62);
 portrait(x,20,H-90,3,u.look,M.K[0],null,{gk:u.k==='g'});x.font='9px "Press Start 2P",monospace';x.fillStyle='#fff';x.fillText(S.name.slice(0,16),76,H-74);
 x.fillStyle='#8fb3a0';x.fillText(`#${S.num} ${PAB[S.pos]||''}  GER ${ovr()}`,76,H-58);if(o){x.fillStyle='#ffd400';x.fillText(`${o[0].toUpperCase()} ${S.attrs[o[1]]}`,76,H-42)}else{x.fillStyle='#04100a';x.fillRect(76,H-50,180,8);x.fillStyle=M.sta>50?'#3ddc84':M.sta>30?'#ffd400':'#ff5a5f';x.fillRect(76,H-50,180*M.sta/100,8);x.fillStyle='#8fb3a0';x.font='7px "Press Start 2P",monospace';x.fillText('FÔLEGO',200,H-54)}}
function drawBanner(x,b){const a=Math.min(1,b.t/.25),out=Math.max(0,(b.t-(b.d-.3))/.3),s=b.big?(a<1?.4+a*.9:1.3-.0*b.t):1,al=1-out;x.save();x.globalAlpha=al;
 const y=b.big?H/2-20:84;x.fillStyle='#000b';x.fillRect(0,y-30*(b.big?1.4:1),W,(b.big?84:56));x.fillStyle=b.col;x.fillRect(0,y-30*(b.big?1.4:1),W,3);x.fillRect(0,y-30*(b.big?1.4:1)+(b.big?81:53),W,3);
 x.translate(W/2+(1-a)*-200,y);x.scale(s,s);x.textAlign='center';x.font=`${b.big?26:16}px "Press Start 2P",monospace`;x.fillStyle='#000';x.fillText(b.txt,3,3);x.fillStyle=b.col;x.fillText(b.txt,0,0);
 if(b.sub){x.font='9px "Press Start 2P",monospace';x.fillStyle='#fff';x.fillText(b.sub,0,b.big?22:18)}x.restore()}
/* ---- bandeirão de abertura (escudos enviados pelo usuário) ---- */
function mkFlag(ci=S.club){const c=CL[ci].c,im=IM[ci],ok=im&&im.complete&&im.naturalWidth;if(!ok)return flag0(ci);
 const ar=im.naturalWidth/im.naturalHeight,wide=ar>=1.5;let w=320,h=240;if(wide){w=600;h=Math.round(600/ar);if(h>240){h=240;w=Math.round(240*ar)}}
 const f=mkCanvas(w,h),g=f.getContext('2d');g.fillStyle=BGC[ci]||'#111';/*mandante*/g.fillRect(0,0,w,h);
 if(wide)g.drawImage(im,0,0,w,h);else{const iw=h*ar;g.drawImage(im,(w-iw)/2,0,iw,h);g.font='18px "Press Start 2P",monospace';g.textAlign='center';g.lineWidth=5;g.strokeStyle='#000';g.fillStyle='#fff';const n=CL[ci].n.toUpperCase();g.strokeText(n,w/2,h-12);g.fillText(n,w/2,h-12)}
 g.fillStyle=c[0];g.fillRect(0,0,w,7);g.fillRect(0,h-7,w,7);g.fillStyle=c[1];g.fillRect(0,0,7,h);g.fillRect(w-7,0,7,h);return f}
function flag0(ci=S.club){const k=CL[ci].k,f=mkCanvas(600,180),g=f.getContext('2d');g.fillStyle=k.a;g.fillRect(0,0,600,180);g.fillStyle=k.b;
 if(k.p==='hoops'||k.p==='band')for(let i=0;i<3;i++)g.fillRect(0,30+i*50,600,22);else if(k.p==='sash'){g.beginPath();g.moveTo(80,0);g.lineTo(200,0);g.lineTo(520,180);g.lineTo(400,180);g.fill()}else for(let i=0;i<4;i++)g.fillRect(i*150+50,0,50,180);
 g.fillRect(0,0,600,8);g.fillRect(0,172,600,8);g.font='26px "Press Start 2P",monospace';g.textAlign='center';g.lineWidth=7;g.strokeStyle='#000';g.fillStyle='#fff';const n=CL[ci].n.toUpperCase();g.strokeText(n,300,102);g.fillText(n,300,102);return f}
function bandeirao(x,t){const hc=M.E.home?S.club:M.oi,c=CL[hc].c,F=M.F||(M.F=mkFlag(hc));
 x.fillStyle='#07140f';x.fillRect(0,0,W,H);x.save();const z=1.25-t*.07;x.translate(360,210);x.scale(z,z);x.translate(-360,-210);
 const pal=[c[0],c[1],'#eee','#f0c000','#222'];for(let r=0;r<12;r++)for(let i=0;i<72;i++){const hh=Math.sin(t*9+i*.7+r)*3;x.fillStyle=pal[(i*7+r*3)%5];x.fillRect(i*10,300+r*16+hh,8,14);x.fillStyle=SKIN[(i*3+r)%6][0];x.fillRect(i*10+1,293+r*16+hh,6,6);if((i+r)%5===0&&Math.sin(t*6+i)>0){x.fillRect(i*10-1,288+r*16+hh,2,6);x.fillRect(i*10+7,288+r*16+hh,2,6)}}
 for(let i=0;i<14;i++){const a=(t*.6+i*.17)%1;x.globalAlpha=(1-a)*.7;x.fillStyle=i%2?c[0]:'#ffdf00';x.beginPath();x.arc(30+i*50,400-a*300,10+a*30,0,7);x.fill()}x.globalAlpha=1;
 const FW=F.width,FH=F.height,fx=(W-FW)/2,fy=Math.max(30,300-FH);x.fillStyle='#8a6a3a';x.fillRect(fx-10,fy-10,8,FH+70);x.fillRect(fx+FW+2,fy-10,8,FH+70);
 for(let i=0;i<FW/6;i++){const o=Math.sin(t*3+i*.15)*9;x.drawImage(F,i*6,0,6,FH,fx+i*6,fy+o,6,FH);x.fillStyle=`rgba(0,0,0,${.18+Math.cos(t*3+i*.15)*.14})`;x.fillRect(fx+i*6,fy+o,6,FH)}
 for(let i=0;i<20;i++){const a=(t*.8+i*.13)%1;x.fillStyle=pickR(['#fff','#ffd400',c[0]]);x.fillRect((i*97+t*30)%W,a*H,3,3)}x.restore();
 x.fillStyle='#000a';x.fillRect(0,0,W,40);x.fillStyle='#fff';x.font='14px "Press Start 2P",monospace';x.textAlign='center';x.fillText(M.E.home?'A TORCIDA FAZ A FESTA':'A TORCIDA RIVAL FAZ PRESSÃO',360,27);x.font='8px "Press Start 2P",monospace';x.fillStyle='#8fb3a0';x.fillText('toque para pular',360,H-12);x.textAlign='left';
 x.fillStyle='#000';x.globalAlpha=Math.max(0,1-t*2)+Math.max(0,(t-2.9)*3);x.fillRect(0,0,W,H);x.globalAlpha=1}
/* ---- apresentação das escalações ---- */
function lineups(x,t){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#081226');g.addColorStop(1,'#06120d');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.fillStyle='#ffffff08';for(let i=0;i<W;i+=24)x.fillRect(i,0,12,H);
 x.textAlign='center';x.font='16px "Press Start 2P",monospace';x.fillStyle='#ffd400';x.fillText('ESCALAÇÕES',360,40);x.font='8px "Press Start 2P",monospace';x.fillStyle='#8fb3a0';
 const sn=['Arena','Estádio','Campo'][M.E.model]+' '+(M.E.home?CL[S.club].n:M.o);x.fillText(sn.toUpperCase()+' · '+envTxt(M.E).toUpperCase(),360,60);
 for(const side of[0,1]){const e=eo((t-side*.15)/.5),X0=side?372:18,ox=(1-e)*(side?400:-400),team=M.A.filter(p=>p.t===side),k=M.K[side];x.save();x.translate(ox,0);
  x.fillStyle='#000a';x.fillRect(X0,76,330,388);x.fillStyle=k.a;x.fillRect(X0,76,330,6);x.fillStyle=k.b;x.fillRect(X0,82,330,2);
  if(M.kb[side].complete)x.drawImage(M.kb[side],X0+10,94,40,40);x.textAlign='left';x.font='11px "Press Start 2P",monospace';x.fillStyle='#fff';x.fillText(side?M.o:CL[S.club].n,X0+60,112);x.font='8px "Press Start 2P",monospace';x.fillStyle='#8fb3a0';x.fillText(['BASE','SÉRIE B','SÉRIE A'][CL[side?M.oi:S.club].t],X0+60,128);
  team.forEach((p,i)=>{const y=150+i*60,ee=eo((t-.3-i*.1-side*.1)/.3);if(ee<=0)return;x.globalAlpha=ee;if(p.me){x.fillStyle='#ffd40033';x.fillRect(X0+4,y-4,322,54);x.fillStyle='#ffd400';x.fillRect(X0+4,y-4,3,54)}
   portrait(x,X0+12,y,3,p.look,k,null,{gk:p.k==='g'});x.font='12px "Press Start 2P",monospace';x.fillStyle=p.me?'#ffd400':'#fff';x.fillText(String(p.num).padStart(2,' '),X0+70,y+28);
   x.font='9px "Press Start 2P",monospace';x.fillText(p.nm.slice(0,16),X0+110,y+22);x.fillStyle='#8fb3a0';x.font='8px "Press Start 2P",monospace';x.fillText((p.me?(PAB[S.pos]||'')+' · VOCÊ':PAB[p.pos]||p.pos),X0+110,y+38);x.globalAlpha=1});x.restore()}
 x.textAlign='center';x.font='8px "Press Start 2P",monospace';x.fillStyle='#8fb3a0';x.fillText('toque para pular',360,H-14);x.textAlign='left';
 if(t<.2){x.fillStyle=`rgba(0,0,0,${1-t/.2})`;x.fillRect(0,0,W,H)}if(t>2.75){x.fillStyle=`rgba(0,0,0,${(t-2.75)*4})`;x.fillRect(0,0,W,H)}}

/* ================= 12. INTERFACE ================= */
function ui(){const v=$('mv'),r=role();if(!M)return;
 if(M.ph==='run'||M.ph==='res'||M.ph==='intro')v.innerHTML=`<p class="q">${M.msg}</p>`;
 else if(M.ph==='pick'){const gs=gameState();v.innerHTML=`<p class="mt" style="text-align:center">${M.msg}</p><div class="sit"><b>${M.sit.t}</b><span>${M.sit.d}</span>${gs?`<i>${gs}</i>`:''}</div><p class="q">${SC[r]}</p><div class="opt">${OPT[r].map((o,i)=>{const tg=sitTag(sitMul(i));return`<button data-o="${i}"><b>${i+1}. ${o[0]}</b><span class="tag ${tg[1]}" style="align-self:flex-start">${tg[0]}</span><small>${o[3]}</small><span class="row"><span>${icon(o[1])} ${S.attrs[o[1]]}</span><span class="rk" title="Risco">${[1,2,3].map(n=>`<i class="${o[2]>=.35+n*.05?'on':''}"></i>`).join('')}</span></span></button>`}).join('')}</div>`}
 else if(M.ph==='time')v.innerHTML=`<p class="q">Pare o marcador na faixa verde. Centro dourado = perfeito!</p><p class="mt" style="text-align:center">Faixa ${Math.round(M.z.w*100)}% · velocidade ${M.z.sp>5.6?'alta':M.z.sp>4.4?'média':'baixa'} · fôlego ${Math.round(M.sta)}</p><div id="tb"><i id="zn" style="left:${(M.z.c-M.z.w/2)*100}%;width:${M.z.w*100}%"><i id="zp"></i></i><i id="cur"></i></div><button class="go" id="act" style="width:100%">Agora!</button>`;
 else v.innerHTML='';
 document.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>pick(+b.dataset.o));if($('act'))$('act').onpointerdown=tap}
const PG=['home','train','play','career','mkt'],PGN=['Início','Treino','Jogo','Carreira','Mercado'];
$('nav').innerHTML=PG.map((p,i)=>`<button data-p="${p}" class="${i?'':'on'}">${icon(p==='mkt'?'mkt':p)}<span>${PGN[i]}</span></button>`).join('');
let curPg='home';
function page(p){document.querySelectorAll('section').forEach(s=>{const on=s.id===p;s.classList.toggle('hidden',!on);if(on&&p!==curPg){s.classList.remove('enter');void s.offsetWidth;s.classList.add('enter')}});
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));curPg=p;p==='train'?trainAnim(1):trainAnim(0)}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{SND.ui(480);page(b.dataset.p)});
const bar=(v,c)=>`<div class="bar"><span style="width:${C(v,0,100)}%;background:${c||'var(--gr)'}"></span></div>`;
const atc=v=>v>=75?'var(--gr)':v>=60?'#a3e635':v>=45?'var(--yl)':'var(--or)';
function avatar(){const c=$('av');if(!c)return;const x=c.getContext('2d');x.clearRect(0,0,64,64);portrait(x,0,0,4,userLook(),kitOf(S.club),S.num,{ex:1,gk:S.pos==='Goleiro'})}
function sndBtn(){$('snd').innerHTML=icon(SND.on?'snd':'mute');$('snd').title=SND.on?'Som ligado':'Som desligado'}
$('snd').onclick=()=>{SND.on=!SND.on;try{localStorage.setItem('bfc3snd',SND.on?'1':'0')}catch(e){}if(!SND.on)SND.ambStop();else if(M)SND.ambStart();sndBtn()};
function rd(){LV.forEach(l=>l.club=CL[S.club].n);rdHome();rdTrain();rdPlay();rdCareer();rdMkt()}
function rdHome(){const L=LV[S.lvl],N=LV[S.lvl+1];
 $('p1').innerHTML=icon('cal')+S.season;$('p2').innerHTML=icon('star')+S.rep;$('p3').innerHTML=icon('coin')+'R$ '+S.money;
 const fm=S.hist.slice(0,5).map(h=>`<i class="f ${h.r}">${h.r}</i>`).join('')||'<small>Nenhum jogo ainda</small>';
 $('home').innerHTML=`<div class="card hero"><canvas id="av" width="64" height="64"></canvas><div><h1>${S.name}</h1><p class="yl"><img class="kb" src="${kitBadge(S.club)}" alt=""> ${L.club}, ${L.n}</p><p><span class="tag">${PAB[S.pos]}</span><span class="tag">${S.age} ANOS</span><span class="tag">#${S.num}</span><span class="tag">PÉ ${S.foot.toUpperCase()}</span></p></div><div class="ovr"><b>${ovr()}</b><small>GERAL</small></div></div>
 <div class="g2"><div class="card"><h2>${icon('play')} Temporada ${S.season}</h2><div class="g4"><div><small>Jogos</small><b>${S.G}</b></div><div><small>Gols</small><b>${S.Gl}</b></div><div><small>Assist.</small><b>${S.A}</b></div><div><small>V-E-D</small><b>${S.W}-${S.D}-${S.L}</b></div></div><p></p><p>Últimos jogos</p>${fm}</div>
 <div class="card"><h2>${icon('physical')} Condição</h2>Energia ${S.energy}${bar(S.energy,'var(--yl)')}Moral ${S.morale}${bar(S.morale,'var(--bl)')}<h2 style="margin-top:8px">${icon('career')} ${N?'Rumo ao '+N.n:'Topo da carreira'}</h2>${N?bar(S.rep/N.need*100,'var(--gr)')+`<small>${S.rep} de ${N.need} de reputação</small>`:'<small>Você chegou ao profissional.</small>'}</div></div>
 <div class="card"><h2>${icon('career')} Metas do treinador · ${S.season}</h2>${(S.goals||[]).map(g=>{const v=goalVal(g);return`<div class="row"><span>${g.done?'✔ ':''}${g.t}</span><b class="${g.done?'gr':'yl'}">${g.k==='avg'?v||'-':Math.min(v,g.n)}/${g.n}</b></div>${bar(g.done?100:v/g.n*100,g.done?'var(--gr)':'var(--or)')}`}).join('')||'<small>Jogue uma partida para receber metas.</small>'}<small>Cada meta cumprida rende reputação e dinheiro.</small></div>
 <div class="card feed"><h2>${icon('news')} Notícias</h2>${S.feed.slice(0,5).map(x=>`<p><span class="yl">›</span><span>${x}</span></p>`).join('')}</div>`;avatar()}
let lastT='technical';
function rdTrain(){$('train').innerHTML=`<div class="card"><h2>${icon('train')} Centro de treinamento</h2><canvas id="tc" width="320" height="110"></canvas><p>${S.tmsg}</p>Energia ${S.energy}${bar(S.energy,'var(--yl)')}</div><div class="tr">
 ${[['technical','Técnica','Passe e drible','dribble'],['shooting','Finalização','Chute e precisão','shoot'],['physical','Físico','Velocidade e força','speed'],['tactical','Tático','Passe e defesa','defense']].map(t=>`<button data-t="${t[0]}">${icon(t[3],'var(--yl)')}<span><b class="yl">${t[1]}</b><br><small>${t[2]}</small></span></button>`).join('')}</div>
 <div class="card" style="margin-top:14px"><button data-t="rest" style="width:100%">${icon('rest')} Descansar (+${S.inv.fisio?55:40} de energia)</button></div>`;
 document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>train(b.dataset.t));if(curPg==='train')trainAnim(1)}
function train(t){lastT=t;TA.t=0;
 if(t==='rest'){S.energy=C(S.energy+(S.inv.fisio?55:40),0,100);S.morale=C(S.morale+3,0,100);S.tmsg='Você descansou e recuperou a energia.'}
 else{if(S.energy<20){S.tmsg='Energia insuficiente. Descanse primeiro.';rd();return}
  const a=S.attrs,g=k=>{const d=Math.max(1,Math.round(3*(1-a[k]/105)+(RN()<.3?1:0)))+(S.inv.pt&&RN()<.4?1:0);a[k]=C(a[k]+d,0,99);return AN[k]+' +'+d};
  const ks={technical:['pass','dribble'],shooting:['shoot'],physical:['speed','physical'],tactical:['pass','defense']}[t];
  S.tmsg='Treino concluído: '+ks.map(g).join(', ')+'.';S.energy-=20;S.morale=C(S.morale+2,0,100)}
 SND.ui(520);rd();sv()}
/* ---- animação do treino ---- */
const TA={raf:0,t:0,lt:0,p:null};
function trainAnim(on){cancelAnimationFrame(TA.raf);if(!on)return;const p={x:40,y:80,f:1,v:0,rp:0,pt:0,ph:1,z:0,rot:0,look:userLook(),num:S.num,k:S.pos==='Goleiro'?'g':'',cur:'idle'};TA.p=p;TA.lt=0;
 const k=kitOf(S.club),loop=ts=>{const c=$('tc');if(!c||curPg!=='train')return;const x=c.getContext('2d'),dt=Math.min(.05,(ts-TA.lt)/1000||0);TA.lt=ts;TA.t+=dt;const t=TA.t;x.imageSmoothingEnabled=false;
  for(let i=0;i<8;i++){x.fillStyle=i%2?'#2c7a46':'#338a51';x.fillRect(i*40,0,40,110)}x.fillStyle='#f1f8ec';x.fillRect(0,14,320,2);x.fillRect(0,104,320,2);
  const b={x:0,y:0,z:0,rot:t*8},cones=[90,140,190,240];let cyc;
  if(lastT==='technical'){cyc=t%3.2;const e=cyc/3.2;p.x=30+e*250;p.y=72+Math.sin(e*Math.PI*8)*14;p.f=1;p.v=120;p.cur='dribble';p.rp+=dt*12;b.x=p.x+7;b.y=p.y+2;b.z=Math.abs(Math.sin(p.rp))*2;cones.forEach(cx=>{x.fillStyle='#ff7a00';x.fillRect(cx-3,66,6,8);x.fillStyle='#fff';x.fillRect(cx-2,69,4,2)})}
  else if(lastT==='shooting'){cyc=t%2.4;p.x=120;p.y=78;p.f=1;p.v=0;x.fillStyle='#fff';x.fillRect(296,40,3,46);x.fillStyle='#ffffff55';for(let i=0;i<6;i++)x.fillRect(300+i*3,40,1,46);
   if(cyc<.4){p.cur='windup';p.pt=cyc;b.x=134;b.y=80}else if(cyc<.6){p.cur='kick';p.pt=cyc-.4;b.x=134;b.y=80}else{p.cur='fist';p.pt=cyc;const e=Math.min(1,(cyc-.5)/.35);b.x=lerp(134,300,e);b.y=lerp(80,62,e);b.z=Math.sin(e*Math.PI)*12}}
  else if(lastT==='physical'){cyc=t%2.6;const e=cyc<1.3?cyc/1.3:1-(cyc-1.3)/1.3;p.x=40+eio(e)*240;p.y=80;p.f=cyc<1.3?1:-1;p.v=200;p.cur='sprint';p.rp+=dt*20;b.x=-20;x.fillStyle='#ff7a00';x.fillRect(36,74,6,8);x.fillRect(284,74,6,8);speedLines(x,p)}
  else if(lastT==='tactical'){cyc=t%2;p.x=100;p.y=80;p.f=1;p.v=0;const e=cyc/2;x.fillStyle='#d8d8d8';x.fillRect(250,44,12,46);
   if(e<.15){p.cur='pass';p.pt=e*2;b.x=114;b.y=82}else if(e<.5){p.cur='guard';const q=(e-.15)/.35;b.x=lerp(114,248,q);b.y=82}else{p.cur='guard';const q=(e-.5)/.5;b.x=lerp(248,108,q);b.y=82}}
  else{p.x=150;p.y=80;p.f=1;p.v=0;p.cur='tired';p.pt=t;b.x=-20;x.fillStyle='#ffffffcc';x.font='10px VT323';x.fillText('z z',170,40+Math.sin(t*2)*3)}
  x.fillStyle='rgba(0,0,0,.3)';x.beginPath();x.ellipse(p.x+3,p.y+1,9,3,0,0,7);x.fill();spr(x,p,k,t);if(b.x>0)drawBall(x,b,t);TA.raf=requestAnimationFrame(loop)};TA.raf=requestAnimationFrame(loop)}
function rdPlay(){const oi=oppN(),E=envOf(oi);
 $('fx').innerHTML=`<h2>${icon('cal')} Rodada ${S.rd+1} de ${CL.length-1}, Brasileirão ${LV[S.lvl].n}</h2>
 <div class="fix"><div><img src="${kitBadge(S.club)}" alt=""><b>${CL[S.club].n}</b></div><span class="vs">VS</span><div><img src="${kitBadge(oi)}" alt=""><b>${CL[oi].n}</b></div></div>
 <p style="text-align:center">${E.cls?'<span class="tag" style="color:var(--rd)">CLÁSSICO</span>':''}${E.fin?'<span class="tag" style="color:var(--yl)">DECISÃO</span>':''}<span class="tag">${envTxt(E).toUpperCase()}</span></p>
 <p class="mt">${S.energy<25?'Energia baixa: descanse antes de jogar.':'Você decide os lances: escolha a jogada e acerte o tempo.'}</p><button class="go" id="st" style="width:100%" ${S.energy<25||M?'disabled':''}>Jogar partida</button>`;$('st').onclick=()=>{SND.ui(880);startMatch()}}
function radar(){const c=$('radar');if(!c)return;const x=c.getContext('2d'),ks=Object.keys(AN),cx=120,cy=110,R=80;x.clearRect(0,0,240,220);
 for(let l=1;l<=4;l++){x.strokeStyle='#2f6a47';x.beginPath();ks.forEach((k,i)=>{const a=-Math.PI/2+i*Math.PI/3,r=R*l/4;x[i?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r)});x.closePath();x.stroke()}
 x.fillStyle='#3ddc8455';x.strokeStyle='#3ddc84';x.lineWidth=2;x.beginPath();ks.forEach((k,i)=>{const a=-Math.PI/2+i*Math.PI/3,r=R*S.attrs[k]/99;x[i?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r)});x.closePath();x.fill();x.stroke();
 x.fillStyle='#eef7e8';x.font='16px VT323';x.textAlign='center';ks.forEach((k,i)=>{const a=-Math.PI/2+i*Math.PI/3;x.fillText(AN[k].slice(0,3).toUpperCase()+' '+S.attrs[k],cx+Math.cos(a)*(R+18),cy+Math.sin(a)*(R+14)+4)})}
function rdCareer(){const at=Object.entries(S.attrs).map(([k,v])=>`<div class="atr">${icon(k,atc(v))}<span>${AN[k]}</span><b style="color:${atc(v)}">${v}</b>${bar(v,atc(v))}</div>`).join('');
 const notes=S.hist.slice(0,10).reverse();
 $('career').innerHTML=`<div class="g2"><div class="card"><h2>${icon('star')} Atributos</h2><canvas id="radar" width="240" height="220"></canvas>${at}</div><div class="card"><h2>${icon('career')} Caminho</h2>${LV.map((l,i)=>`<div class="step ${i===S.lvl?'cur':i<S.lvl?'ok':''}"><b>${l.n}</b><br><small>${i===S.lvl?'Você está aqui':i<S.lvl?'Concluído':'Exige '+l.need+' de reputação'}</small></div>`).join('')}
 <h2 style="margin-top:14px">${icon('play')} Notas recentes</h2><div style="display:flex;align-items:flex-end;gap:4px;height:70px;border-bottom:2px solid var(--ln)">${notes.map(h=>`<div title="${h.o} ${h.s}" style="flex:1;height:${(+h.n)*10}%;background:${+h.n>=8?'var(--gr)':+h.n>=6.5?'var(--yl)':'var(--or)'};box-shadow:inset 0 3px 0 #fff4"></div>`).join('')||'<small>Sem jogos</small>'}</div></div></div>
 <div class="card"><h2>${icon('career')} Sala de troféus</h2><div class="g4"><div><small>Jogos</small><b>${S.T.j}</b></div><div><small>Gols</small><b>${S.T.g}</b></div><div><small>Assist.</small><b>${S.T.a}</b></div><div><small>Salvos</small><b>${S.T.sv}</b></div></div><p></p>${S.tro.length?S.tro.map(t=>`<p class="yl">🏆 ${t}</p>`).join(''):'<small>Nenhum troféu ainda. Títulos, prêmios individuais e convocações aparecem aqui.</small>'}</div>
 <div class="card"><h2>${icon('news')} Histórico de partidas</h2>${S.hist.length?`<table>${S.hist.slice(0,10).map(h=>`<tr><td><i class="f ${h.r}">${h.r}</i></td><td>${h.o}</td><td>${h.s}</td><td>nota ${h.n}</td><td>${h.g?h.g+' gol(s)':''}</td></tr>`).join('')}</table>`:'<small>Jogue sua primeira partida.</small>'}</div>
 <div class="card"><h2>${icon('career')} Tabela</h2><table><tr><td></td><td>Clube</td><td>P</td><td>J</td><td>SG</td></tr>${table().map((i,k)=>{const t=S.tab[i];return `<tr class="${i===S.club?'me':''}"><td>${k+1}</td><td><img class="kb" style="width:18px;height:18px" src="${kitBadge(i)}" alt=""> ${CL[i].n}</td><td>${t.p}</td><td>${t.j}</td><td>${t.gp-t.gc}</td></tr>`}).join('')}</table></div>
 <div class="card"><h2>${icon('star')} Pontos de habilidade: ${S.sp}</h2><p class="mt">Nota 8 ou mais em uma partida rende 1 ponto.</p><div class="row" style="justify-content:flex-start">${Object.keys(AN).map(k=>`<button data-k="${k}" ${S.sp?'':'disabled'}>${icon(k)} ${AN[k]} +2</button>`).join('')}</div></div>
 <div class="card row"><small>Progresso salvo automaticamente neste navegador.</small><button id="rs">Recomeçar do zero</button></div>`;
 document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{S.attrs[b.dataset.k]=C(S.attrs[b.dataset.k]+2,0,99);S.sp--;SND.ui(780);sv();rd()});
 $('rs').onclick=()=>{if(confirm('Apagar a carreira e recomeçar?')){S=def();S.tab=mkTab();S.rd=0;S.sp=0;try{localStorage.removeItem('bfc2')}catch(e){}openCreate();rd()}};radar()}
function rdMkt(){const cur=CL[S.club],lock=S.trs===S.season,o=ovr(),k=kitOf(S.club),sq=sqd(S.club),gk=S.pos==='Goleiro',ui0=gk?0:3,spots=[[10,50],[30,22],[30,78],[58,50],[80,30]];
 const slots=sq.map((q,i)=>{const me=i===ui0,L=me?userLook():lookOf(q.n+S.club),nm=me?S.name:q.n,num=me?S.num:q.num;return`<div class="slot ${me?'me':''}" style="left:${spots[i][0]}%;top:${spots[i][1]}%"><img src="${portraitURL(nm,L,k,null,i===0)}" alt=""><span>${num} ${nm.split(' ')[0]}</span></div>`}).join('');
 $('mkt').innerHTML=`<div class="card"><h2>${icon('mkt')} Contrato atual</h2><div class="row"><span><img class="kb" src="${kitBadge(S.club)}" alt=""> <b>${cur.n}</b></span><span class="yl">R$ ${S.sal} por jogo</span></div><p class="mt">${lock?'Janela fechada nesta temporada.':'Janela aberta: você pode assinar com outro clube.'}</p></div>
 ${S.offers&&S.offers.length&&!lock?`<div class="card" style="border-color:var(--yl)"><h2 style="color:var(--yl)">${icon('news','var(--yl)')} Propostas recebidas</h2>${S.offers.map((f,k)=>`<div class="row off"><span><img class="kb" src="${kitBadge(f.c)}" alt=""> <b>${CL[f.c].n}</b><br><small>R$ ${Math.round(CL[f.c].s*(S.inv.emp?1.2:1))} por jogo · luvas R$ ${f.b}</small></span><button class="go" data-of="${k}">Aceitar</button></div>`).join('')}</div>`:''}
 <div class="card"><h2>${icon('coin')} Loja e equipe · R$ ${S.money}</h2><div class="tr">${SHOP.map((it,i)=>{const has=(S.inv[it.k]|0)>=it.lv,blk=it.req&&(S.inv[it.k]|0)<it.req;return`<button data-sh="${i}" ${has||blk||S.money<it.p?'disabled':''}>${icon(it.ic,'var(--yl)')}<span><b class="yl">${it.n}</b> ${has?'<span class="tag gr">ATIVO</span>':`<span class="tag">R$ ${it.p}</span>`}<br><small>${it.d}</small></span></button>`}).join('')}
 <button id="sup" ${S.money<60||S.energy>=100?'disabled':''}>${icon('physical','var(--yl)')}<span><b class="yl">Suplemento</b> <span class="tag">R$ 60</span><br><small>+25 de energia na hora.</small></span></button></div></div>
 <div class="card"><h2>${icon('shirt')} Escalação: ${cur.n}</h2><div class="board">${slots}</div><table>${sq.map((q,i)=>{const me=i===ui0;return`<tr class="${me?'me':''}"><td>${me?S.num:q.num}</td><td><img class="pt" src="${portraitURL(me?S.name:q.n,me?userLook():lookOf(q.n+S.club),k,null,i===0)}" alt=""> ${me?S.name+' (você)':q.n}</td><td>${me?S.pos:q.pos}</td><td>${me?o:q.o}</td></tr>`}).join('')}</table></div>
 <div class="card"><h2>${icon('coin')} Clubes e propostas</h2>${CL.map((c,i)=>i===S.club?'':`<div class="row off"><span><img class="kb" src="${kitBadge(i)}" alt=""> <b>${c.n}</b><br><small>${['Base','Série B','Série A'][c.t]}, exige geral ${c.min}, R$ ${c.s} por jogo</small></span><button data-c="${i}" ${lock||o<c.min?'disabled':''}>${o<c.min?'Geral '+c.min:'Assinar'}</button></div>`).join('')}</div>`;
 document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>trans(+b.dataset.c));document.querySelectorAll('[data-sh]').forEach(b=>b.onclick=()=>buy(+b.dataset.sh));document.querySelectorAll('[data-of]').forEach(b=>b.onclick=()=>acceptOffer(+b.dataset.of));$('sup').onclick=buySup}
function trans(i){const c=CL[i];S.club=i;S.sal=Math.round(c.s*(S.inv.emp?1.2:1));S.offers=[];S.trs=S.season;S.fx=0;S.morale=C(S.morale+8,0,100);S.rep+=c.t*4;feed('Transferência: você assinou com o '+c.n+'.');SND.ui(660);sv();rd();page('home')}
/* ---- menu principal animado ---- */
let mraf=0;const MS={};
function menuAnim(t){const x=$('mc').getContext('2d'),s=t/1000;x.imageSmoothingEnabled=false;
 if(!MS.p)MS.p={x:0,y:150,f:1,v:120,rp:0,pt:0,ph:2,z:0,rot:0,look:userLook(),num:S.num,cur:'dribble'};
 const g=x.createLinearGradient(0,0,0,80);g.addColorStop(0,'#050a1a');g.addColorStop(1,'#16274d');x.fillStyle=g;x.fillRect(0,0,320,180);
 for(let i=0;i<40;i++){x.fillStyle=Math.sin(s*2+i)>0?'#fff':'#567';x.fillRect((i*53)%320,(i*29)%50,1,1)}
 x.fillStyle='#1a2133';x.fillRect(0,56,320,52);for(let r=0;r<6;r++)for(let i=0;i<64;i++){const c=['#ffd400','#2a62c9','#eee','#d22','#3ddc84'][(i*7+r*3)%5],dy=Math.sin(s*8+i*.9+r)>.7?-1:0;x.fillStyle=c;x.fillRect(i*5+1,60+r*8+dy,3,3);x.fillStyle=SKIN[(i+r)%6][0];x.fillRect(i*5+2,58+r*8+dy,2,2)}
 if(Math.sin(s*3.7)>.96){x.fillStyle='#fff';x.fillRect((s*997)%320,60+((s*331)%40),2,2)}
 for(const lx of[16,300]){x.fillStyle='#3a4150';x.fillRect(lx,20,3,50);x.fillStyle='#fff8d0';x.fillRect(lx-7,14,17,7);x.fillStyle='rgba(255,250,200,.07)';x.beginPath();x.moveTo(lx-6,20);x.lineTo(lx+12,20);x.lineTo(160,180);x.lineTo(lx<100?0:320,180);x.fill()}
 for(let i=0;i<10;i++){x.fillStyle=i%2?'#2c7a46':'#338a51';x.fillRect(((i*40-s*60)%400+400)%400-40,108,40,72)}x.fillStyle='#f1f8ec';x.fillRect(0,110,320,1);
 const p=MS.p;p.x=(s*55)%380-30;p.y=160;p.rp=s*14;p.pt=s;p.cur='dribble';x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.ellipse(p.x+3,p.y+1,9,3,0,0,7);x.fill();spr(x,p,kitOf(S.club),s);drawBall(x,{x:p.x+8,y:p.y+2,z:Math.abs(Math.sin(s*7))*6,rot:s*9},s);
 mraf=requestAnimationFrame(menuAnim)}
function openMenu(){MS.p=null;$('menu').classList.remove('hidden');$('mcont').disabled=!S.made;cancelAnimationFrame(mraf);mraf=requestAnimationFrame(menuAnim)}
const closeMenu=()=>{$('menu').classList.add('hidden');cancelAnimationFrame(mraf)};
$('mcont').onclick=()=>{SND.ui(660);closeMenu()};$('mnew').onclick=()=>{closeMenu();openCreate()};$('mhow').onclick=()=>$('mhelp').classList.toggle('hidden');$('hm').onclick=()=>{if(!M)openMenu()};
/* ---- criação do atleta ---- */
const CR={sk:2,hs:0,hc:0};
function openCreate(){$('mod').classList.remove('hidden');const l=lookOf('u'+$('nn').value);CR.sk=l.sk;CR.hs=l.hs;CR.hc=l.hc;crUI()}
function crUI(){$('ssk').innerHTML=SKIN.map((s,i)=>`<button data-sk="${i}" class="${i===CR.sk?'on':''}" style="background:${s[0]}" aria-label="Tom ${i+1}"></button>`).join('');
 $('shc').innerHTML=HAIRC.map((h,i)=>`<button data-hc="${i}" class="${i===CR.hc?'on':''}" style="background:${h}" aria-label="Cor ${i+1}"></button>`).join('');
 $('nh').innerHTML=HAIRS.map((h,i)=>`<option value="${i}" ${i===CR.hs?'selected':''}>${h}</option>`).join('');
 document.querySelectorAll('[data-sk]').forEach(b=>b.onclick=()=>{CR.sk=+b.dataset.sk;crUI()});document.querySelectorAll('[data-hc]').forEach(b=>b.onclick=()=>{CR.hc=+b.dataset.hc;crUI()});crPrev()}
function crPrev(){const x=$('cp').getContext('2d'),l=lookOf('u'+$('nn').value);l.sk=CR.sk;l.hs=CR.hs;l.hc=CR.hc;x.clearRect(0,0,64,64);portrait(x,0,0,4,l,kitOf(+$('nc').value),C(+$('nu').value||10,1,99),{ex:1,gk:$('np').value==='Goleiro'})}
$('nh').onchange=()=>{CR.hs=+$('nh').value;crPrev()};['nn','np','nc','nu'].forEach(i=>$(i).addEventListener('input',crPrev));
$('mk').onclick=()=>{S=def();S.name=$('nn').value.trim()||'Jogador';S.pos=$('np').value;S.foot=$('nf').value;S.num=C(+$('nu').value||10,1,99);S.made=1;S.look={sk:CR.sk,hs:CR.hs,hc:CR.hc};
 const a=S.attrs,b=POS[S.pos];for(const k in b)a[k]=C(a[k]+b[k],20,99);S.club=+$('nc').value;S.sal=CL[S.club].s;S.tab=mkTab();S.rd=0;S.sp=0;
 mkGoals();$('mod').classList.add('hidden');SND.whistle(1);sv();rd();page('home')};
addEventListener('keydown',e=>{if(!M)return;if(M.ph==='intro'&&(e.key===' '||e.key==='Enter')){e.preventDefault();skipIntro();return}if(e.key.length>1&&e.key!==' ')return;if(e.key===' '&&M.ph==='time'){e.preventDefault();tap()}else if(M.ph==='pick'&&'123'.includes(e.key))pick(+e.key-1)});
if(S.made&&(!S.goals||S.gs!==S.season))mkGoals();sndBtn();rd();openMenu();$('mcont').addEventListener('click',()=>setTimeout(showEvent,300));
