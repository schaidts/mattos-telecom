// Career progression: unlocks, stars, statistics, match history and achievements.
import { LEVELS, CHAPTERS, levelsOfChapter } from './levels.js';

export const ACHIEVEMENTS = [
  { id: 'first_goal', name: 'O Primeiro de Muitos', desc: 'Marque seu primeiro gol.', icon: 'ball' },
  { id: 'header', name: 'Perigo Aéreo', desc: 'Marque de cabeça.', icon: 'head' },
  { id: 'one_touch', name: 'Mago do Primeiro Toque', desc: 'Marque de primeira.', icon: 'bolt' },
  { id: 'bicycle', name: 'Acrobata', desc: 'Marque de bicicleta.', icon: 'flip' },
  { id: 'top_corner', name: 'Onde a Coruja Dorme', desc: 'Marque no ângulo.', icon: 'target' },
  { id: 'curler', name: 'Folha Seca', desc: 'Marque com chute de curva.', icon: 'curve' },
  { id: 'free_kick', name: 'Especialista em Bola Parada', desc: 'Marque direto de falta.', icon: 'wall' },
  { id: 'screamer', name: 'Pancada', desc: 'Marque de 25 metros ou mais.', icon: 'rocket' },
  { id: 'assist', name: 'Garçom', desc: 'Dê assistência para um companheiro.', icon: 'assist' },
  { id: 'playmaker', name: 'Maestro', desc: 'Complete 40 passes.', icon: 'pass' },
  { id: 'perfect', name: 'Perfeccionista', desc: 'Ganhe 3 estrelas em uma fase.', icon: 'star' },
  { id: 'stars40', name: 'Colecionador de Estrelas', desc: 'Junte 40 estrelas.', icon: 'stars' },
  { id: 'goals25', name: 'Máquina de Gols', desc: 'Marque 25 gols.', icon: 'fire' },
  { id: 'ch1', name: 'Formado na Base', desc: 'Conclua o Capítulo 1.', icon: 'cap' },
  { id: 'ch2', name: 'Profissional', desc: 'Conclua o Capítulo 2.', icon: 'contract' },
  { id: 'ch3', name: 'Estrela em Ascensão', desc: 'Conclua o Capítulo 3.', icon: 'rise' },
  { id: 'ch4', name: 'Campeão Nacional', desc: 'Conclua o Capítulo 4.', icon: 'cup' },
  { id: 'ch5', name: 'Campeão do Mundo', desc: 'Conclua o Capítulo 5.', icon: 'globe' },
];

export class Career {
  constructor(save) {
    this.save = save;
  }

  get levels() { return this.save.data.progress.levels; }

  levelState(id) { return this.levels[id] || { stars: 0, completed: false, plays: 0 }; }

  isUnlocked(id) {
    const i = LEVELS.findIndex((l) => l.id === id);
    if (i <= 0) return true;
    return !!this.levelState(LEVELS[i - 1].id).completed;
  }

  isChapterUnlocked(c) {
    const first = levelsOfChapter(c)[0];
    return first ? this.isUnlocked(first.id) : false;
  }

  chapterStars(c) {
    return levelsOfChapter(c).reduce((s, l) => s + this.levelState(l.id).stars, 0);
  }

  chapterComplete(c) {
    return levelsOfChapter(c).every((l) => this.levelState(l.id).completed);
  }

  totalStars() {
    return LEVELS.reduce((s, l) => s + this.levelState(l.id).stars, 0);
  }

  completedCount() {
    return LEVELS.filter((l) => this.levelState(l.id).completed).length;
  }

  nextLevel(id) {
    const i = LEVELS.findIndex((l) => l.id === id);
    return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
  }

  // First unlocked-but-not-completed level (for the PLAY button)
  currentLevel() {
    for (const l of LEVELS) if (!this.levelState(l.id).completed) return l;
    return LEVELS[LEVELS.length - 1];
  }

  recordStart(level) {
    const st = { ...this.levelState(level.id) };
    st.plays = (st.plays || 0) + 1;
    this.levels[level.id] = st;
    this.save.data.stats.levelsPlayed++;
    this.save.data.progress.lastLevel = level.id;
    this.save.data.progress.currentChapter = level.chapter;
    this.save.save();
  }

  // Returns newly unlocked achievement objects
  recordResult(level, result, info) {
    const d = this.save.data;
    const st = { ...this.levelState(level.id) };
    const firstClear = result.success && !st.completed;
    if (result.success) {
      st.completed = true;
      st.stars = Math.max(st.stars || 0, result.stars);
      if (!st.bestActions || info.actions < st.bestActions) st.bestActions = info.actions;
      if (firstClear) d.stats.levelsCompleted++;
    }
    this.levels[level.id] = st;
    d.history.unshift({ id: level.id, name: level.name, opp: level.opp.name, success: result.success, stars: result.stars, at: Date.now(), attempts: info.attemptsUsed, finish: info.finish || null });
    d.history = d.history.slice(0, 30);
    const unlocked = this.checkAchievements();
    this.save.save();
    return { unlocked, firstClear };
  }

  unlock(id) {
    const a = this.save.data.achievements;
    if (a[id]) return null;
    a[id] = Date.now();
    return ACHIEVEMENTS.find((x) => x.id === id);
  }

  checkAchievements(extra = {}) {
    const s = this.save.data.stats;
    const got = [];
    const tryU = (cond, id) => { if (cond) { const a = this.unlock(id); if (a) got.push(a); } };
    tryU(s.goals >= 1, 'first_goal');
    tryU(s.headers >= 1, 'header');
    tryU(s.oneTouch >= 1, 'one_touch');
    tryU(s.bicycles >= 1, 'bicycle');
    tryU(s.topCorners >= 1, 'top_corner');
    tryU(s.curlers >= 1, 'curler');
    tryU(s.freeKickGoals >= 1, 'free_kick');
    tryU(s.longestGoal >= 25, 'screamer');
    tryU(s.assists >= 1, 'assist');
    tryU(s.passes >= 40, 'playmaker');
    tryU(LEVELS.some((l) => this.levelState(l.id).stars >= 3), 'perfect');
    tryU(this.totalStars() >= 40, 'stars40');
    tryU(s.goals >= 25, 'goals25');
    for (const ch of CHAPTERS) tryU(this.chapterComplete(ch.id), 'ch' + ch.id);
    return got;
  }
}
