// Career content: 5 chapters x 5 levels. Coordinates in metres; the attacked goal
// line is z = -52.5, penalty area edge z = -36, pitch half-width 34.
//
// attacker: { x, z, hero?, run?: {x,z} }   (index used for `ball` and `mark`)
// defender: { x, z, mark?: attackerIndex, role?: 'wall' }

export const CHAPTERS = [
  { id: 1, title: 'O Começo', club: 'Vila Nova Sub-19', blurb: 'Um garoto da base com um sonho. Prove que você merece.', difficulty: [0.0, 0.2] },
  { id: 2, title: 'Primeiro Contrato', club: 'Vila Nova FC', blurb: 'Seu primeiro contrato profissional. Hora de corresponder.', difficulty: [0.25, 0.4] },
  { id: 3, title: 'Estrela em Ascensão', club: 'Atlântico SC', blurb: 'Clube maior, torcida maior, defesas mais fechadas.', difficulty: [0.45, 0.6] },
  { id: 4, title: 'A Primeira Divisão', club: 'Capital Athletic', blurb: 'Elite do futebol. Cada chance pode decidir um título.', difficulty: [0.62, 0.78] },
  { id: 5, title: 'Campeão do Mundo', club: 'Seleção', blurb: 'O país inteiro está assistindo. Faça história.', difficulty: [0.82, 1.0] },
];

// Wall of `n` defenders 9.15 m from the ball, between ball and goal (shifted to cover the near post)
function wall(bx, bz, n) {
  const gx = -Math.sign(bx) * 1.2, gz = -52.5;
  const dx = gx - bx, dz = gz - bz;
  const l = Math.hypot(dx, dz);
  const ux = dx / l, uz = dz / l;
  const nx = -uz, nz = ux;
  const cx = bx + ux * 9.15, cz = bz + uz * 9.15;
  const out = [];
  const shift = Math.sign(bx || 1) * 0.3;
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * 0.58 + shift;
    out.push({ x: cx + nx * o, z: cz + nz * o, role: 'wall' });
  }
  return out;
}

const L = [];

// ------------------------------------------------------------------ Chapter 1
L.push({
  id: '1-1', chapter: 1, name: 'Primeiro Chute', minute: 23, score: [0, 0], opp: { name: 'Porto Azul U19', kit: 'royal' },
  brief: 'Sua estreia na base. Só o goleiro está entre você e o gol.',
  attackers: [{ x: 2, z: -34.5, hero: true }],
  defenders: [{ x: 8, z: -27 }, { x: -9, z: -29 }],
  ball: 0, objective: [{ type: 'score' }],
  stars: [{ type: 'firstAttempt' }, { type: 'corner' }],
  tutorial: 'shoot',
});
L.push({
  id: '1-2', chapter: 1, name: 'Ache o Companheiro', minute: 37, score: [0, 0], opp: { name: 'Serra FC U19', kit: 'orange' },
  brief: 'Um zagueiro bloqueia o chute. Toque para o companheiro livre e finalize.',
  attackers: [{ x: -7, z: -31, hero: true }, { x: 7, z: -38.5 }],
  defenders: [{ x: -3.5, z: -37 }, { x: 13, z: -30 }],
  ball: 0, objective: [{ type: 'passesThenScore', n: 1 }],
  stars: [{ type: 'firstAttempt' }, { type: 'maxActions', n: 2 }],
  tutorial: 'pass',
});
L.push({
  id: '1-3', chapter: 1, name: 'Enfiada de Bola', minute: 54, score: [1, 0], opp: { name: 'Atlético Ribeira U19', kit: 'black' },
  brief: 'Seu atacante está em disparada. Enfie a bola no espaço atrás da defesa.',
  attackers: [{ x: 0, z: -15, hero: true }, { x: 9, z: -25, run: { x: 5, z: -37 } }, { x: -15, z: -21, run: { x: -9, z: -33 } }],
  defenders: [{ x: 2, z: -31, mark: 1 }, { x: -8, z: -30, mark: 2 }],
  ball: 0, objective: [{ type: 'score' }],
  stars: [{ type: 'firstAttempt' }, { type: 'maxActions', n: 2 }],
  tutorial: 'through',
});
L.push({
  id: '1-4', chapter: 1, name: 'Jogada pela Ponta', minute: 66, score: [1, 1], opp: { name: 'Cidade United U19', kit: 'claret' },
  brief: 'O ponta está com a bola. Faça ela chegar em você na área e marque.',
  attackers: [{ x: -23, z: -35 }, { x: 3, z: -39, hero: true }, { x: -7, z: -27 }],
  defenders: [{ x: -2.5, z: -46, mark: 1 }, { x: -18, z: -40 }, { x: -6, z: -33, mark: 2 }],
  ball: 0, objective: [{ type: 'heroScores' }],
  stars: [{ type: 'firstAttempt' }, { type: 'maxActions', n: 2 }],
});
L.push({
  id: '1-5', chapter: 1, name: 'Gol da Vitória', minute: 88, score: [1, 1], opp: { name: 'Real Campos U19', kit: 'sky' },
  brief: 'Final da Copinha, faltam dois minutos. Seja o herói.',
  attackers: [{ x: -4, z: -22, hero: true }, { x: 10, z: -30 }, { x: -14, z: -31 }],
  defenders: [{ x: 7, z: -34, mark: 1 }, { x: -11, z: -36, mark: 2 }, { x: -1, z: -38 }, { x: 2, z: -26 }],
  ball: 0, objective: [{ type: 'heroScores' }],
  stars: [{ type: 'firstAttempt' }, { type: 'maxActions', n: 3 }],
});

// ------------------------------------------------------------------ Chapter 2
L.push({
  id: '2-1', chapter: 2, name: 'Jogada de Escanteio', minute: 31, score: [0, 0], opp: { name: 'Estrela do Sul', kit: 'crimson' },
  brief: 'Cobre o escanteio. Com a bola no ar, desenhe a partir do receptor para cabecear de primeira!',
  attackers: [{ x: -33.2, z: -52.0 }, { x: 3, z: -41, hero: true, run: { x: 0.5, z: -45.5 } }, { x: -6, z: -40, run: { x: -4, z: -44 } }, { x: 9, z: -38 }],
  defenders: [{ x: -3.2, z: -50.6 }, { x: 4.5, z: -43, mark: 1 }, { x: -5, z: -42.5, mark: 2 }, { x: 7.5, z: -40.5, mark: 3 }],
  ball: 0, objective: [{ type: 'header' }],
  stars: [{ type: 'firstAttempt' }, { type: 'heroScores' }],
  tutorial: 'onetouch', setPiece: 'corner',
});
L.push({
  id: '2-2', chapter: 2, name: 'Estreia na Falta', minute: 58, score: [0, 0], opp: { name: 'Montanha FC', kit: 'gold' },
  brief: 'Falta a 23 metros. Curve a bola por cima ou ao redor da barreira.',
  attackers: [{ x: -3, z: -30, hero: true }, { x: 9, z: -40.5 }],
  defenders: [...wall(-3, -30, 4), { x: 7.5, z: -43, mark: 1 }],
  ball: 0, objective: [{ type: 'score' }],
  stars: [{ type: 'firstAttempt' }, { type: 'curve' }],
  tutorial: 'freekick', setPiece: 'freekick',
});
L.push({
  id: '2-3', chapter: 2, name: 'Triangulação', minute: 44, score: [1, 0], opp: { name: 'Porto Azul', kit: 'royal' },
  brief: 'O técnico quer paciência. Complete três passes e depois marque.',
  attackers: [{ x: 0, z: -19, hero: true }, { x: -13, z: -26 }, { x: 11, z: -28 }, { x: 3, z: -37 }],
  defenders: [{ x: -9, z: -31, mark: 1 }, { x: 8, z: -33, mark: 2 }, { x: 1, z: -41, mark: 3 }, { x: -1, z: -27 }],
  ball: 0, objective: [{ type: 'passesThenScore', n: 3 }],
  stars: [{ type: 'firstAttempt' }, { type: 'heroScores' }],
});
L.push({
  id: '2-4', chapter: 2, name: 'Contra-ataque', minute: 71, score: [1, 1], opp: { name: 'Serra FC', kit: 'orange' },
  brief: 'Você saiu em velocidade — 3 contra 2. Marque em até três ações.',
  attackers: [{ x: 0, z: -10, hero: true }, { x: -12, z: -17, run: { x: -8, z: -32 } }, { x: 12, z: -18, run: { x: 8, z: -33 } }],
  defenders: [{ x: -5, z: -28 }, { x: 5, z: -30 }],
  ball: 0, objective: [{ type: 'maxActions', n: 3 }],
  stars: [{ type: 'firstAttempt' }, { type: 'maxActions', n: 2 }],
});
L.push({
  id: '2-5', chapter: 2, name: 'Final da Copa', minute: 91, score: [0, 0], opp: { name: 'Atlético Ribeira', kit: 'black' },
  brief: 'Acréscimos na final do Estadual. Só o seu gol serve.',
  attackers: [{ x: 6, z: -24, hero: true }, { x: -8, z: -27 }, { x: 16, z: -34 }, { x: -2, z: -14 }],
  defenders: [{ x: -6, z: -32, mark: 1 }, { x: 13, z: -38, mark: 2 }, { x: 3, z: -30 }, { x: -1, z: -40 }, { x: 7, z: -42 }],
  ball: 0, objective: [{ type: 'heroScores' }],
  stars: [{ type: 'firstAttempt' }, { type: 'maxActions', n: 3 }],
});

// ------------------------------------------------------------------ Chapter 3
L.push({
  id: '3-1', chapter: 3, name: 'De Primeira', minute: 19, score: [0, 0], opp: { name: 'Cidade United', kit: 'claret' },
  brief: 'Marque de primeira: desenhe a partir do receptor antes da bola chegar.',
  attackers: [{ x: 20, z: -31 }, { x: 2, z: -38, hero: true, run: { x: 0, z: -42 } }, { x: -7, z: -30 }],
  defenders: [{ x: 4, z: -44, mark: 1 }, { x: -5, z: -36, mark: 2 }, { x: 15, z: -37 }],
  ball: 0, objective: [{ type: 'oneTouch' }],
  stars: [{ type: 'firstAttempt' }, { type: 'heroScores' }],
  tutorial: 'onetouch',
});
L.push({
  id: '3-2', chapter: 3, name: 'Pela Esquerda', minute: 63, score: [1, 1], opp: { name: 'Real Campos', kit: 'sky' },
  brief: 'Falta pela esquerda. Curve no ângulo do segundo pau.',
  attackers: [{ x: -13, z: -33, hero: true }, { x: 4, z: -42 }, { x: -2, z: -40 }],
  defenders: [...wall(-13, -33, 4), { x: 2, z: -45, mark: 1 }, { x: -3.5, z: -44, mark: 2 }],
  ball: 0, objective: [{ type: 'score' }],
  stars: [{ type: 'firstAttempt' }, { type: 'topCorner' }],
  setPiece: 'freekick',
});
L.push({
  id: '3-3', chapter: 3, name: 'Garçom', minute: 40, score: [0, 1], opp: { name: 'Estrela do Sul', kit: 'crimson' },
  brief: 'Seja o criador: dê o último passe para o gol de um companheiro.',
  attackers: [{ x: 0, z: -24, hero: true }, { x: -9, z: -36 }, { x: 9, z: -37 }, { x: 15, z: -24 }],
  defenders: [{ x: -7, z: -40, mark: 1 }, { x: 6, z: -41, mark: 2 }, { x: 12, z: -29, mark: 3 }, { x: 0, z: -32 }],
  ball: 0, objective: [{ type: 'assist' }],
  stars: [{ type: 'firstAttempt' }, { type: 'maxActions', n: 2 }],
});
L.push({
  id: '3-4', chapter: 3, name: 'Toque de Bola', minute: 77, score: [2, 1], opp: { name: 'Montanha FC', kit: 'gold' },
  brief: 'Gaste o relógio: complete quatro passes e finalize a jogada.',
  attackers: [{ x: -5, z: -12, hero: true }, { x: -19, z: -19 }, { x: 13, z: -16 }, { x: 4, z: -27 }, { x: -7, z: -35 }],
  defenders: [{ x: -15, z: -25, mark: 1 }, { x: 10, z: -22, mark: 2 }, { x: 2, z: -33, mark: 3 }, { x: -5, z: -41, mark: 4 }],
  ball: 0, objective: [{ type: 'passesThenScore', n: 4 }],
  stars: [{ type: 'firstAttempt' }, { type: 'heroScores' }],
});
L.push({
  id: '3-5', chapter: 3, name: 'Dia de Clássico', minute: 85, score: [2, 2], opp: { name: 'Porto Azul', kit: 'royal' },
  brief: 'O clássico está empatado. Decida você mesmo.',
  attackers: [{ x: -10, z: -26, hero: true }, { x: 6, z: -30 }, { x: 14, z: -40 }, { x: -3, z: -18 }],
  defenders: [{ x: 4, z: -35, mark: 1 }, { x: 10, z: -44, mark: 2 }, { x: -7, z: -33 }, { x: -1, z: -42 }, { x: -12, z: -38 }],
  ball: 0, objective: [{ type: 'heroScores' }],
  stars: [{ type: 'firstAttempt' }, { type: 'oneTouch' }],
});

// ------------------------------------------------------------------ Chapter 4
L.push({
  id: '4-1', chapter: 4, name: 'Segundo Pau', minute: 28, score: [0, 0], opp: { name: 'Leões da Serra', kit: 'orange' },
  brief: 'Cruzamento da direita. Ataque o segundo pau e cabeceie para o gol.',
  attackers: [{ x: 24, z: -41 }, { x: -4, z: -40, hero: true, run: { x: -3, z: -45.5 } }, { x: 3, z: -38, run: { x: 2, z: -45 } }, { x: 10, z: -30 }],
  defenders: [{ x: -7, z: -42.5, mark: 1 }, { x: 4.5, z: -42, mark: 2 }, { x: 19, z: -44 }, { x: 8, z: -36, mark: 3 }],
  ball: 0, objective: [{ type: 'header' }],
  stars: [{ type: 'firstAttempt' }, { type: 'heroScores' }],
});
L.push({
  id: '4-2', chapter: 4, name: 'De Longe', minute: 52, score: [0, 1], opp: { name: 'Capital Rovers', kit: 'black' },
  brief: 'Eles estacionaram o ônibus. Marque de fora da área (20m+).',
  attackers: [{ x: -3, z: -27, hero: true }, { x: -14, z: -30 }, { x: 12, z: -31 }],
  defenders: [{ x: -4, z: -42 }, { x: 0, z: -44 }, { x: 5, z: -41 }, { x: -11, z: -37, mark: 1 }, { x: 9, z: -38, mark: 2 }],
  ball: 0, objective: [{ type: 'longShot' }],
  stars: [{ type: 'firstAttempt' }, { type: 'topCorner' }],
});
L.push({
  id: '4-3', chapter: 4, name: 'Primeiro Pau', minute: 67, score: [1, 1], opp: { name: 'Real Campos', kit: 'sky' },
  brief: 'Falta pela direita. Cinco na barreira. Faça valer.',
  attackers: [{ x: 11, z: -29, hero: true }, { x: -2, z: -42 }, { x: 4, z: -44 }],
  defenders: [...wall(11, -29, 5), { x: -1, z: -45, mark: 1 }, { x: 3, z: -46.5, mark: 2 }],
  ball: 0, objective: [{ type: 'score' }],
  stars: [{ type: 'firstAttempt' }, { type: 'curve' }],
  setPiece: 'freekick',
});
L.push({
  id: '4-4', chapter: 4, name: 'Ultrapassagem', minute: 74, score: [2, 2], opp: { name: 'Estrela do Sul', kit: 'crimson' },
  brief: 'Seu lateral está passando. Marque em até duas ações.',
  attackers: [{ x: -2, z: -22, hero: true }, { x: -18, z: -24, run: { x: -16, z: -43 } }, { x: 6, z: -33, run: { x: 3, z: -42 } }],
  defenders: [{ x: -1, z: -30 }, { x: 5, z: -38, mark: 2 }, { x: -6, z: -40 }, { x: -12, z: -31 }],
  ball: 0, objective: [{ type: 'maxActions', n: 2 }],
  stars: [{ type: 'firstAttempt' }, { type: 'heroScores' }],
});
L.push({
  id: '4-5', chapter: 4, name: 'Decisão do Título', minute: 93, score: [1, 1], opp: { name: 'Capital Rovers', kit: 'black' },
  brief: 'Último jogo, último minuto. Um gol vale o campeonato.',
  attackers: [{ x: 2, z: -20, hero: true }, { x: -12, z: -28 }, { x: 12, z: -30 }, { x: -2, z: -36 }, { x: 21, z: -19 }],
  defenders: [{ x: -9, z: -33, mark: 1 }, { x: 9, z: -35, mark: 2 }, { x: 1, z: -40, mark: 3 }, { x: 17, z: -26, mark: 4 }, { x: -4, z: -44 }],
  ball: 0, objective: [{ type: 'heroScores' }],
  stars: [{ type: 'firstAttempt' }, { type: 'maxActions', n: 3 }],
});

// ------------------------------------------------------------------ Chapter 5
L.push({
  id: '5-1', chapter: 5, name: 'Jogo de Abertura', minute: 34, score: [0, 0], opp: { name: 'Nordland', kit: 'crimson' },
  brief: 'Copa do Mundo, jogo de abertura. Acalme os nervos com um gol.',
  attackers: [{ x: 0, z: -24, hero: true }, { x: -13, z: -30 }, { x: 13, z: -31 }, { x: 4, z: -38 }],
  defenders: [{ x: -10, z: -35, mark: 1 }, { x: 10, z: -36, mark: 2 }, { x: 2, z: -42, mark: 3 }, { x: -2, z: -31 }, { x: 5, z: -29 }],
  ball: 0, objective: [{ type: 'score' }],
  stars: [{ type: 'firstAttempt' }, { type: 'heroScores' }],
});
L.push({
  id: '5-2', chapter: 5, name: 'Acrobata', minute: 61, score: [1, 1], opp: { name: 'Costa Brava', kit: 'gold' },
  brief: 'Lá vem o cruzamento. Finalize de primeira — voleio, cabeçada ou algo espetacular.',
  attackers: [{ x: -25, z: -38 }, { x: 4, z: -40, hero: true, run: { x: 2.5, z: -44.5 } }, { x: -4, z: -33 }, { x: 10, z: -36 }],
  defenders: [{ x: 6.5, z: -43.5, mark: 1 }, { x: -3, z: -38, mark: 2 }, { x: 10, z: -41, mark: 3 }, { x: -20, z: -42 }],
  ball: 0, objective: [{ type: 'oneTouch' }],
  stars: [{ type: 'firstAttempt' }, { type: 'heroScores' }],
});
L.push({
  id: '5-3', chapter: 5, name: 'Falta de Ouro', minute: 79, score: [0, 0], opp: { name: 'Vale Real', kit: 'claret' },
  brief: 'Quartas de final. 27 metros, barreira de cinco, o melhor goleiro do mundo.',
  attackers: [{ x: 2, z: -25.5, hero: true }, { x: -8, z: -41 }, { x: 8, z: -42 }],
  defenders: [...wall(2, -25.5, 5), { x: -6.5, z: -43, mark: 1 }, { x: 6.5, z: -44, mark: 2 }],
  ball: 0, objective: [{ type: 'score' }],
  stars: [{ type: 'firstAttempt' }, { type: 'topCorner' }],
  setPiece: 'freekick',
});
L.push({
  id: '5-4', chapter: 5, name: 'Semifinal', minute: 84, score: [1, 1], opp: { name: 'Nordland', kit: 'crimson' },
  brief: 'Deixe-os tontos: três passes e depois você finaliza.',
  attackers: [{ x: -3, z: -18, hero: true }, { x: -17, z: -25 }, { x: 14, z: -24 }, { x: 4, z: -34 }, { x: -6, z: -38 }],
  defenders: [{ x: -13, z: -30, mark: 1 }, { x: 11, z: -30, mark: 2 }, { x: 3, z: -39, mark: 3 }, { x: -5, z: -43, mark: 4 }],
  ball: 0, objective: [{ type: 'passesThenScore', n: 3 }, { type: 'heroScores' }],
  stars: [{ type: 'firstAttempt' }, { type: 'maxActions', n: 5 }],
});
L.push({
  id: '5-5', chapter: 5, name: 'A Final', minute: 94, score: [0, 0], opp: { name: 'Imperial XI', kit: 'royal' },
  brief: 'Final da Copa. Último ataque. Seu nome para sempre — se você marcar.',
  attackers: [{ x: 4, z: -22, hero: true }, { x: -14, z: -29 }, { x: 15, z: -31 }, { x: -3, z: -37 }, { x: 22, z: -18 }],
  defenders: [{ x: -11, z: -34, mark: 1 }, { x: 12, z: -36, mark: 2 }, { x: -2, z: -42, mark: 3 }, { x: 18, z: -24, mark: 4 }, { x: 4, z: -44 }],
  ball: 0, objective: [{ type: 'heroScores' }],
  stars: [{ type: 'firstAttempt' }, { type: 'oneTouch' }],
});

export const LEVELS = L;
export const levelById = (id) => L.find((l) => l.id === id);
export const levelsOfChapter = (c) => L.filter((l) => l.chapter === c);

export function levelDifficulty(level) {
  const ch = CHAPTERS[level.chapter - 1];
  const idx = levelsOfChapter(level.chapter).indexOf(level);
  const [a, b] = ch.difficulty;
  return a + (b - a) * (idx / 4);
}

export const TEAMMATE_NAMES = ['Duarte', 'Okafor', 'Lindqvist', 'Moreau', 'Kaya', 'Ribeiro', 'Tanaka', 'Mendes', 'Novak', 'Haddad', 'Costa', 'Brandt'];
export const TEAMMATE_NUMBERS = [7, 11, 8, 9, 17, 14, 19, 6, 20, 23];

export function describeObjective(o) {
  switch (o.type) {
    case 'score': return 'Marque um gol';
    case 'heroScores': return 'Marque com o seu jogador';
    case 'header': return 'Marque de cabeça';
    case 'oneTouch': return 'Marque de primeira';
    case 'passesThenScore': return `Complete ${o.n} passe${o.n > 1 ? 's' : ''} e marque`;
    case 'assist': return 'Dê assistência para um gol';
    case 'longShot': return 'Marque de 20m ou mais';
    case 'maxActions': return `Marque em até ${o.n} ações`;
    case 'firstAttempt': return 'Conclua na primeira tentativa';
    case 'corner': return 'Coloque perto da trave';
    case 'topCorner': return 'Acerte o ângulo';
    case 'curve': return 'Marque com chute de curva';
    default: return o.type;
  }
}
