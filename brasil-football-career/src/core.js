/* ================= 1. UTILITÁRIOS ================= */
const $=i=>document.getElementById(i),C=(n,a,b)=>Math.max(a,Math.min(b,n)),RN=Math.random;
const lerp=(a,b,t)=>a+(b-a)*t,eo=t=>1-Math.pow(1-C(t,0,1),3),eio=t=>(t=C(t,0,1))<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const hash=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const rng=seed=>()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const pickR=(a,r=RN)=>a[(r()*a.length)|0];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
let LQ=(navigator.hardwareConcurrency||8)<=4?1:0; // modo leve (ativado também se o FPS cair)
const _dk={};function shade(c,f){const k=c+f;if(_dk[k])return _dk[k];let n=parseInt(c.slice(1),16);if(c.length===4)n=parseInt(c.slice(1).split('').map(x=>x+x).join(''),16);
 const r=C(Math.round((n>>16&255)*f),0,255),g=C(Math.round((n>>8&255)*f),0,255),b=C(Math.round((n&255)*f),0,255);return _dk[k]='#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}
const lum=c=>{const n=parseInt(c.slice(1),16);return(.3*(n>>16&255)+.59*(n>>8&255)+.11*(n&255))};
const cdist=(a,b)=>{const x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);return Math.hypot((x>>16&255)-(y>>16&255),(x>>8&255)-(y>>8&255),(x&255)-(y&255))};

/* ================= 2. DADOS DO JOGO (preservados da 2.0) ================= */
const LV=[{n:'Sub-17',club:'',need:0},{n:'Sub-20',club:'',need:80},{n:'Profissional',club:'',need:220}];
// k: uniforme — p: padrão (plain|stripes|hoops|sash|band|halves), a: camisa, b: detalhe, c2: 2º detalhe, sh: calção, so: meião
const CL=[
 {n:'Fortaleza',c:['#2a62c9','#c0272d'],t:0,min:0,s:25,k:{p:'hoops',a:'#2a62c9',b:'#c0272d',sh:'#2a62c9',so:'#c0272d'}},
 {n:'Bahia',c:['#2a62c9','#d22'],t:0,min:0,s:25,k:{p:'band',a:'#f2f2f2',b:'#2a62c9',c2:'#d22',sh:'#2a62c9',so:'#f2f2f2'}},
 {n:'Vasco',c:['#111','#fff'],t:0,min:44,s:35,k:{p:'sash',a:'#151515',b:'#f2f2f2',sh:'#151515',so:'#151515'}},
 {n:'Grêmio',c:['#2a8dd8','#111'],t:1,min:52,s:70,k:{p:'stripes',a:'#2a8dd8',b:'#151515',sh:'#151515',so:'#f2f2f2'}},
 {n:'Atlético-MG',c:['#111','#fff'],t:1,min:54,s:80,k:{p:'stripes',a:'#151515',b:'#f2f2f2',sh:'#151515',so:'#f2f2f2'}},
 {n:'Fluminense',c:['#7a1f3d','#0a7d3b'],t:1,min:56,s:90,k:{p:'stripes',a:'#7a1f3d',b:'#0a7d3b',sh:'#f2f2f2',so:'#f2f2f2'}},
 {n:'São Paulo',c:['#fff','#d22'],t:1,min:58,s:100,k:{p:'band',a:'#f4f4f4',b:'#d22',c2:'#151515',sh:'#f4f4f4',so:'#f4f4f4'}},
 {n:'Corinthians',c:['#f4f4f4','#111'],t:1,min:60,s:110,k:{p:'plain',a:'#f4f4f4',b:'#151515',sh:'#151515',so:'#151515'}},
 {n:'Cruzeiro',c:['#1b4fd1','#fff'],t:1,min:60,s:105,k:{p:'plain',a:'#1b4fd1',b:'#f2f2f2',sh:'#f2f2f2',so:'#1b4fd1'}},
 {n:'Botafogo',c:['#111','#fff'],t:2,min:64,s:170,k:{p:'stripes',a:'#151515',b:'#f2f2f2',sh:'#151515',so:'#8a8a8a'}},
 {n:'Palmeiras',c:['#0a7d3b','#fff'],t:2,min:68,s:220,k:{p:'plain',a:'#0a7d3b',b:'#f2f2f2',sh:'#f2f2f2',so:'#0a7d3b'}},
 {n:'Flamengo',c:['#d22','#111'],t:2,min:70,s:260,k:{p:'hoops',a:'#d22',b:'#151515',sh:'#f2f2f2',so:'#d22'}},
 {n:'Internacional',c:['#d4142a','#fff'],t:1,min:57,s:95,k:{p:'plain',a:'#d4142a',b:'#f2f2f2',sh:'#f2f2f2',so:'#d4142a'}}]; // novo clube: sempre no fim para não mudar índices de saves
// Clubes extras (não entram no Brasileirão nem no mercado): estaduais, continentais e seleções.
const XC=[
 ['Sertão FC','NE','est',0,'#c98a1b','#2b2b2b','stripes'],['Litoral EC','NE','est',0,'#1aa3a3','#fff','plain'],
 ['Pampa FC','RS','est',0,'#2f7a2f','#ffd400','hoops'],['Serra Gaúcha EC','RS','est',0,'#7a1f1f','#fff','sash'],
 ['Minas Velho FC','MG','est',0,'#5a5a5a','#ffd400','plain'],['Vale do Aço EC','MG','est',0,'#1f3a7a','#ff7a00','stripes'],
 ['Interior Paulista FC','SP','est',0,'#7a3fbf','#fff','band'],
 ['Río Plata (ARG)','','lib',2,'#6cb4ee','#fff','stripes'],['Celeste del Este (URU)','','lib',2,'#4aa3df','#111','plain'],['Deportivo Andino (COL)','','lib',2,'#ffd400','#1b3a8a','plain'],
 ['Sol de Asunción (PAR)','','lib',1,'#d22','#fff','stripes'],['Pacífico Lima (PER)','','lib',1,'#fff','#d22','sash'],['Altiplano FC (BOL)','','lib',1,'#2b8a3e','#fff','plain'],['Austral Santiago (CHI)','','lib',2,'#fff','#111','band'],
 ['Brasil','','sel',2,'#ffdf00','#0a7d3b','plain','#1f4fd8'],['Argentina','','sel',2,'#8ecdf5','#fff','stripes','#151515'],['Uruguai','','sel',2,'#5aa9e6','#fff','plain','#151515'],['Colômbia','','sel',2,'#ffd400','#1b3a8a','plain','#1b3a8a'],['Alemanha','','sel',2,'#f2f2f2','#151515','plain','#151515'],['França','','sel',2,'#1b2f6b','#fff','plain','#fff']];
const NBR=13; // clubes 0-12: Brasileirão e mercado
const REG=['NE','NE','RJ','RS','MG','RJ','SP','SP','MG','RJ','SP','RJ','RS'];
XC.forEach(([n,reg,x,t,a,b,p,sh])=>{CL.push({n,c:[a,b],t,min:99,s:0,x,k:{p,a,b,sh:sh||(p==='plain'?b:a),so:a}});REG.push(reg)});
const BR=[...Array(NBR).keys()],BRA=CL.findIndex(c=>c.n==='Brasil');
const isBR=i=>i<NBR;
const GKC=['#ff9f1c','#a3e635','#22d3ee','#e879f9','#facc15','#fb7185'];
const FN=['Rafa','Thiago','Léo','Caio','Davi','Enzo','Bruno','Vitor','Mateus','Nico','João','Pedro','Lucas','Igor','Murilo','Kauã'],LN=['Lima','Souza','Costa','Rocha','Alves','Neves','Dias','Pinto','Melo','Cruz','Ramos','Barros','Teixeira','Moura','Farias','Prado'];
const FNX=['Matías','Santiago','Facundo','Juan','Diego','Lukas','Hugo','Nicolás'],LNX=['González','Pereyra','Suárez','Ríos','Vega','Müller','Martin','Fernández'];
const sqd=i=>{const x=CL[i].x==='lib'||(CL[i].x==='sel'&&i!==BRA),F=x?FNX:FN,L=x?LNX:LN;return Array.from({length:5},(_,j)=>({n:F[(i*3+j*5)%F.length]+' '+L[(i*7+j*3)%L.length],num:[1,4,5,8,9][j],pos:['Goleiro','Zagueiro','Volante','Meia','Atacante'][j],o:40+CL[i].t*8+(i*5+j*3)%9}))};
const AN={speed:'Velocidade',shoot:'Finalização',pass:'Passe',dribble:'Drible',defense:'Defesa',physical:'Físico'};
const POS={Atacante:{shoot:6,speed:2},'Meia-atacante':{pass:5,dribble:3},'Ponta-direita':{speed:6,dribble:3},'Ponta-esquerda':{speed:6,dribble:3},Volante:{defense:8,physical:4},Zagueiro:{defense:10,physical:5,shoot:-8},Lateral:{speed:5,defense:5},Goleiro:{defense:8}};
const PAB={Atacante:'ATA','Meia-atacante':'MEI','Ponta-direita':'PD','Ponta-esquerda':'PE',Volante:'VOL',Zagueiro:'ZAG',Lateral:'LAT',Goleiro:'GOL',Meia:'MEI'};
// Estilos de jogo (afetam a faixa da barra nas opções do atributo e o ganho de treino)
const STY={Finalizador:{a:['shoot'],d:'Mais precisão nas finalizações e pênaltis.'},Driblador:{a:['dribble'],d:'Drible mais fácil; sofre mais faltas.'},Armador:{a:['pass'],d:'Passes e assistências mais fáceis.'},Velocista:{a:['speed'],d:'Arrancadas e antecipações mais fáceis.'},
 Xerife:{a:['defense','physical'],d:'Desarmes e divididas mais fáceis.'},Muralha:{a:['defense'],d:'Defesas de reflexo mais fáceis.'},'Goleiro-líbero':{a:['speed'],d:'Saídas do gol mais fáceis.'}};
const STY_POS=p=>p==='Goleiro'?['Muralha','Goleiro-líbero']:['Zagueiro','Volante','Lateral'].includes(p)?['Xerife','Velocista','Armador']:['Finalizador','Driblador','Armador','Velocista'];
const PERS={Profissional:'Recupera mais rápido e sofre menos no banco.',Líder:'Ganha a confiança do treinador mais rápido e anima o time.',Temperamental:'Moral oscila mais e leva mais cartões, mas cresce em clássicos.',Estrela:'Ganha mais fama e valor de mercado, mas odeia o banco.'};
const SPEC={shoot:'Chute colocado',pass:'Visão de jogo',dribble:'Drible desconcertante',speed:'Arrancada',defense:'Desarme limpo',physical:'Imposição física'};
const OPT={a:[['Chutar','shoot',.55,'Gol direto, risco alto'],['Driblar','dribble',.5,'Passa pelo marcador'],['Passar','pass',.42,'Chance de assistência']],d:[['Desarmar','defense',.5,'Tira a bola no pé'],['Antecipar','speed',.45,'Corta o passe'],['Afastar','physical',.4,'Segura no corpo']],g:[['Espalmar','defense',.5,'Defesa difícil'],['Sair do gol','speed',.45,'Fecha o ângulo'],['Encaixar','physical',.4,'Segura firme']]};
const SC={a:'Você recebeu na área! O que faz?',d:'Ataque do rival! Hora de defender.',g:'Chute perigoso na sua direção!'};
const COMP={est:'Estadual',bra:'Brasileirão',cdb:'Copa do Brasil',lib:'Libertadores',sel:'Seleção'};
const KO_N=['Quartas de final','Semifinal','Final'];

/* ================= 3. ESTADO E SAVE (v4, chave 'bfc2' mantida + backup + slots) ================= */
const SAVE_V=4;
const def=()=>({v:SAVE_V,name:'Gabriel Silva',pos:'Meia-atacante',foot:'Direito',num:10,age:16,season:2026,lvl:0,club:0,sal:20,trs:0,rep:0,money:0,energy:100,morale:70,
 attrs:{speed:48,shoot:46,pass:50,dribble:52,defense:32,physical:47},G:0,Gl:0,A:0,W:0,D:0,L:0,Sv:0,hist:[],feed:[],made:0,tmsg:'Escolha um treino. Cada sessão gasta 1 ação da semana.',
 T:{j:0,g:0,a:0,sv:0},inv:{boot:0,fisio:0,pt:0,emp:0,psi:0},goals:null,gs:0,tro:[],offers:[],conv:0,evq:null,sp:0,
 style:'Armador',pers:'Profissional',pot:78,xp:{speed:0,shoot:0,pass:0,dribble:0,defense:0,physical:0},ct:55,coach:null,bench:0,inj:null,susp:0,yc:0,
 con:{end:2027,loan:null},mv:0,mvh:[],sl:[],wk:0,ap:2,comp:null,news:[],th:[],sh:[],rec:{gs:0,gm:0,n:0},interest:{},qlib:0,rival:null,crisis:0,opt:{snd:1},ask:0});
let S=def(),M=null;
const ovr=()=>Math.round(Object.values(S.attrs).reduce((a,b)=>a+b,0)/6);
const role=()=>S.pos==='Goleiro'?'g':['Zagueiro','Lateral','Volante'].includes(S.pos)?'d':'a';
const gl=(t,b=0)=>{let g=0;for(let i=0;i<5;i++)if(RN()<.17+CL[t].t*.07+b)g++;return g};
// carrega com fallback para o backup se o principal estiver corrompido
function readSave(k){try{const d=localStorage.getItem(k);if(!d)return null;const o=JSON.parse(d);return o&&typeof o==='object'&&o.attrs?o:null}catch(e){return null}}
let loadNote='';
(()=>{let o=readSave('bfc2');if(!o&&localStorage.getItem('bfc2')){o=readSave('bfc2_bak');if(o)loadNote='O save principal estava corrompido: carregamos o backup automático.'}if(o)S={...def(),...o}})();
let svT=0;
function sv(){try{const cur=localStorage.getItem('bfc2');if(cur)localStorage.setItem('bfc2_bak',cur);S.saved=Date.now();localStorage.setItem('bfc2',JSON.stringify(S))}catch(e){toast&&toast('Não foi possível salvar (armazenamento cheio?)')}}
const feed=(t,cat='voce',ic='news')=>news(t,null,cat,ic);
function news(t,d,cat='voce',ic='news'){S.news.unshift({t,d:d||'',cat,ic,s:S.season,w:S.wk});S.news=S.news.slice(0,60)}
// Ambiente da partida — determinístico por compromisso (a prévia bate com o jogo)
function envOf(fx){const oi=fx.opp,r=rng(hash(S.season+':'+S.wk+':'+fx.my+':'+oi)),home=fx.home,fin=!!fx.final,cls=REG[fx.my]&&REG[fx.my]===REG[oi];
 const night=fin||fx.comp==='lib'||S.wk%3===2,tarde=!night&&S.wk%3===1,rain=r()<.2,model=fx.comp==='sel'||fx.comp==='lib'||fin?0:S.lvl===0?(home?2:1):S.lvl===1?(home?1:0):0;
 return{home,fin,cls,night,tarde,rain,model,dens:[.5,.75,.95][S.lvl]*(cls||fin?1.1:1)}}
const envTxt=e=>[e.night?'Noite':e.tarde?'Fim de tarde':'Dia',e.rain?'Chuva':'',e.home?'Em casa':'Fora',e.cls?'Clássico':'',e.fin?'Decisão':''].filter(Boolean).join(' · ');

/* ================= 4. ÁUDIO (WebAudio, sem arquivos) ================= */
const SND={on:(()=>{try{return localStorage.getItem('bfc3snd')!=='0'}catch(e){return true}})(),ac:null,nb:null,amb:null,ag:null,
 init(){if(this.ac)return this.ac;try{this.ac=new(window.AudioContext||window.webkitAudioContext)();const n=this.ac.sampleRate*2,b=this.ac.createBuffer(1,n,this.ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=RN()*2-1;this.nb=b}catch(e){}return this.ac},
 ok(){return this.on&&this.init()&&this.ac.state!=='closed'},
 env(g,t,a,v,dur){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+dur)},
 noise(f,q,v,dur,a=.02,type='bandpass',f2){if(!this.ok())return;const c=this.ac,t=c.currentTime,s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=this.nb;s.loop=true;fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;this.env(g,t,a,v,dur);s.connect(fl);fl.connect(g);g.connect(c.destination);s.start(t);s.stop(t+dur+.05)},
 tone(f,dur,v=.05,type='square',f2){if(!this.ok())return;const c=this.ac,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);this.env(g,t,.005,v,dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.02)},
 ui(f=520){this.tone(f,.07,.035)},
 whistle(n=1){if(!this.ok())return;for(let i=0;i<n;i++){const c=this.ac,t=c.currentTime+i*.32,o=c.createOscillator(),l=c.createOscillator(),lg=c.createGain(),g=c.createGain();o.frequency.value=2900;l.frequency.value=32;lg.gain.value=180;l.connect(lg);lg.connect(o.frequency);this.env(g,t,.01,.05,i===n-1?.5:.22);o.connect(g);g.connect(c.destination);o.start(t);l.start(t);o.stop(t+.6);l.stop(t+.6)}},
 kick(p=1){this.tone(170,.12,.12*p,'sine',45);this.noise(3000,1,.05*p,.05,.002,'highpass')},
 thud(){this.tone(95,.15,.1,'sine',50);this.noise(500,1,.05,.12)},
 net(){this.noise(2500,.6,.08,.45,.01,'highpass')},
 cheer(v=1,dur=3){this.noise(700,.5,.11*v,dur,.15,'bandpass',1300);this.noise(1800,.8,.05*v,dur*.8,.2)},
 ooh(){this.noise(500,1.2,.09,1.1,.15,'bandpass',260)},
 boo(){if(!this.ok())return;const c=this.ac,t=c.currentTime,lp=c.createBiquadFilter(),g=c.createGain();lp.type='lowpass';lp.frequency.value=480;this.env(g,t,.25,.07,1.8);lp.connect(g);g.connect(c.destination);
  for(const f of[105,118,131,147]){const o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f,t);o.frequency.linearRampToValueAtTime(f*.85,t+1.8);o.connect(lp);o.start(t);o.stop(t+1.9)}},
 ambStart(){if(!this.ok()||this.amb)return;const c=this.ac,s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=this.nb;s.loop=true;fl.type='bandpass';fl.frequency.value=650;fl.Q.value=.6;g.gain.value=.018;s.connect(fl);fl.connect(g);g.connect(c.destination);s.start();this.amb=s;this.ag=g},
 ambLvl(v){if(this.ag)this.ag.gain.setTargetAtTime(.012+v*.03,this.ac.currentTime,.3)},
 ambStop(){try{this.amb&&this.amb.stop()}catch(e){}this.amb=null;this.ag=null}};
const bp=(f,d=.12)=>SND.tone(f,d,.04); // compatível com a 2.0
addEventListener('pointerdown',()=>{SND.init();if(SND.ac&&SND.ac.state==='suspended')SND.ac.resume()},{once:false,passive:true});
document.addEventListener('visibilitychange',()=>{if(!SND.ac)return;document.hidden?SND.ac.suspend():SND.ac.resume()});

/* ================= 5. ÍCONES PIXEL (8x8) ================= */
const ICD={
 home:['...##...','..####..','.######.','########','.#....#.','.#.##.#.','.#.##.#.','.######.'],
 train:['........','#......#','##....##','########','##....##','#......#','........','........'],
 play:['..####..','.#.##.#.','###..###','#..##..#','#..##..#','###..###','.#.##.#.','..####..'],
 career:['########','.######.','.######.','..####..','...##...','...##...','..####..','.######.'],
 mkt:['.######.','.#....#.','.#.##.#.','.#....#.','.#.##.#.','.#....#.','.####.##','......#.'],
 speed:['....##..','...##...','..##....','.######.','....##..','...##...','..##....','.##.....'],
 shoot:['..####..','.#....#.','#..##..#','#.#..#.#','#.#..#.#','#..##..#','.#....#.','..####..'],
 pass:['........','.....#..','######.#','.....#..','..#.....','#.######','..#.....','........'],
 dribble:['#.......','.#......','..#...#.','...#.#..','....#...','...#.#..','..#...#.','.#.....#'],
 defense:['########','#......#','#.####.#','#.####.#','.#.##.#.','.#....#.','..#..#..','...##...'],
 physical:['..##....','.####...','.##.#...','.##..##.','.#######','.#######','..######','...####.'],
 star:['...##...','...##...','########','.######.','..####..','.##..##.','.#....#.','........'],
 news:['#######.','#.....#.','#.###.##','#.....##','#.###.##','#.....##','#######.','........'],
 snd:['...#....','..##..#.','####...#','####.#.#','####.#.#','####...#','..##..#.','...#....'],
 mute:['...#....','..##....','####.#.#','####..#.','####..#.','####.#.#','..##....','...#....'],
 coin:['..####..','.#....#.','#..##..#','#.#....#','#..##..#','#....#.#','.#.##.#.','..####..'],
 cal:['.#....#.','########','#......#','#.#.#.##','#......#','#.#.#..#','#......#','########'],
 rest:['......##','.......#','..###..#','....#...','...#....','..###...','........','#######.'],
 shirt:['.##..##.','########','########','.######.','.######.','.######.','.######.','.######.']};
const icon=(n,col='currentColor')=>{const d=ICD[n];let r='';d.forEach((row,y)=>{for(let x=0;x<8;x++)if(row[x]==='#')r+=`<rect x="${x}" y="${y}" width="1" height="1"/>`});return`<svg class="ic" viewBox="0 0 8 8" fill="${col}" aria-hidden="true">${r}</svg>`};
