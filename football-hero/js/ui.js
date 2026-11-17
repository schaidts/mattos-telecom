// DOM user interface: menus, career, customisation, stats, achievements,
// settings, HUD, toasts, tutorial hand, intro / pause / result cards, keyboard.
import { ICONS, hydrateIcons } from './icons.js';
import { CHAPTERS, LEVELS, levelsOfChapter, describeObjective } from './levels.js';
import { ACHIEVEMENTS } from './career.js';
import { KIT_COLORS, SKIN_TONES, HAIR_COLORS, BOOT_COLORS } from './config.js';
import { isTouchDevice } from './utils.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class UI {
  constructor({ save, career, audio }) {
    this.save = save;
    this.career = career;
    this.audio = audio;
    this.screen = null;
    this.selectedChapter = 1;
    this.tutorialRAF = 0;
    hydrateIcons();
    this._bindStatic();
  }

  attach(game, stage, applyQuality) {
    this.game = game;
    this.stage = stage;
    this.applyQuality = applyQuality;
  }

  // ---------------------------------------------------------------- navigation
  showScreen(name) {
    $$('.screen').forEach((s) => s.classList.remove('active'));
    this.hideModal('pause-menu'); this.hideModal('result'); this.hideModal('intro-card');
    $('#hud').classList.add('hidden');
    $('#hint').classList.add('hidden');
    this.hideTutorial();
    $('#rotate-hint').classList.add('hidden');
    const el = $('#screen-' + name);
    if (el) el.classList.add('active');
    this.screen = name;
    if (this.game && this.game.phase !== 'menu') this.game.setupMenuScene();
    if (this.game) this.game.showMyPlayer(name === 'player');
    if (name === 'menu') this.renderMenu();
    if (name === 'career') this.renderCareer();
    if (name === 'player') this.renderPlayer();
    if (name === 'stats') this.renderStats();
    if (name === 'achievements') this.renderAchievements();
    if (name === 'settings') this.renderSettings();
  }

  enterGameplay() {
    $$('.screen').forEach((s) => s.classList.remove('active'));
    this.screen = null;
    $('#hud').classList.remove('hidden');
    $('#big-text').classList.remove('show');
    this._rotateCheck();
  }

  startLevel(level) {
    this.audio.unlock();
    this.enterGameplay();
    this.game.startLevel(level);
  }

  _bindStatic() {
    document.addEventListener('pointerdown', () => this.audio.unlock(), { once: false, passive: true });
    $$('[data-nav]').forEach((b) => b.addEventListener('click', () => { this.audio.click(); this.showScreen(b.dataset.nav); }));
    $$('[data-back]').forEach((b) => b.addEventListener('click', () => { this.audio.click(); this.showScreen('menu'); }));
    $('#btn-play').addEventListener('click', () => { this.audio.click(); this.startLevel(this.career.currentLevel()); });
    const fs = () => this.toggleFullscreen();
    $('#btn-fullscreen').addEventListener('click', fs);
    $('#set-fullscreen').addEventListener('click', fs);
    $('#btn-pause').addEventListener('click', () => this.openPause());
    $('#btn-resume').addEventListener('click', () => this.closePause());
    $('#btn-restart').addEventListener('click', () => { this.closePause(); this.game.restartLevel(); });
    $('#btn-quit').addEventListener('click', () => { this.game.resume(); this.showScreen('menu'); });
    $('#pause-master').addEventListener('input', (e) => { this.save.settings.master = +e.target.value; this.audio.applyVolumes(); this.save.save(); });
    $('#rotate-x').addEventListener('click', () => { this.rotateDismissed = true; $('#rotate-hint').classList.add('hidden'); });
    window.addEventListener('resize', () => this._rotateCheck());

    // My Player drag-to-rotate
    const drag = $('#player-drag');
    let dragging = null;
    drag.addEventListener('pointerdown', (e) => { dragging = { x: e.clientX }; drag.setPointerCapture(e.pointerId); });
    drag.addEventListener('pointermove', (e) => {
      if (!dragging || !this.game) return;
      const dx = e.clientX - dragging.x; dragging.x = e.clientX;
      const o = this.game.camDir.opts;
      o.angle = (o.angle || 0) - dx * 0.01;
    });
    drag.addEventListener('pointerup', () => { dragging = null; });

    // keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'checkbox') return;
      const k = e.key.toLowerCase();
      if (k === 'f') { this.toggleFullscreen(); }
      else if (k === 'm') { this.save.settings.muted = !this.save.settings.muted; this.audio.applyVolumes(); this.save.save(); this.toast(this.save.settings.muted ? 'Som desligado' : 'Som ligado', 'info', 1000); }
      else if (k === 'escape' || k === 'p') {
        if (!$('#pause-menu').classList.contains('hidden')) this.closePause();
        else if (this.game && this.game.level && !this.screen && $('#result').classList.contains('hidden')) this.openPause();
        else if (this.screen && this.screen !== 'menu') this.showScreen('menu');
      } else if (k === 'r' && this.game && this.game.level && !this.screen) {
        this.closePause(); this.game.restartLevel();
      } else if (k === 'enter' || k === ' ') {
        if (!$('#intro-card').classList.contains('hidden')) { e.preventDefault(); $('#btn-kickoff').click(); }
        else if (!$('#result').classList.contains('hidden')) { e.preventDefault(); $('#res-next').click(); }
        else if (this.screen === 'menu' && k === 'enter') $('#btn-play').click();
      }
    });
  }

  toggleFullscreen() {
    const d = document;
    try {
      if (!d.fullscreenElement && !d.webkitFullscreenElement) {
        const el = d.documentElement;
        (el.requestFullscreen || el.webkitRequestFullscreen).call(el).then?.(() => {
          if (screen.orientation && screen.orientation.lock && isTouchDevice()) screen.orientation.lock('landscape').catch(() => {});
        }).catch?.(() => {});
      } else {
        (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      }
    } catch (err) {
      this.toast('Tela cheia indisponível', 'info', 1400);
    }
  }

  _rotateCheck() {
    const portrait = window.innerHeight > window.innerWidth;
    const inGame = !this.screen;
    $('#rotate-hint').classList.toggle('hidden', !(portrait && inGame && isTouchDevice() && !this.rotateDismissed));
  }

  // ---------------------------------------------------------------- main menu
  renderMenu() {
    const c = this.career;
    const cur = c.currentLevel();
    const allDone = c.completedCount() === LEVELS.length;
    $('#play-sub').textContent = allDone ? 'Carreira concluída — rejogue qualquer fase' : `Capítulo ${cur.chapter} · ${cur.id} ${cur.name}`;
    $('#tile-career').textContent = `${c.completedCount()}/${LEVELS.length} fases`;
    $('#tile-stats').textContent = `${this.save.stats.goals} gols`;
    $('#tile-ach').textContent = `${Object.keys(this.save.data.achievements).length}/${ACHIEVEMENTS.length}`;
    const p = this.save.profile;
    $('#pc-num').textContent = p.number;
    $('#pc-name').textContent = p.name;
    $('#pc-club').textContent = CHAPTERS[cur.chapter - 1].club;
    $('#pc-stars').textContent = c.totalStars();
    $('#pc-bar').style.width = `${(c.completedCount() / LEVELS.length) * 100}%`;
    const kit = KIT_COLORS.find((k) => k.id === p.kit) || KIT_COLORS[0];
    $('#pc-num').style.background = kit.main;
    $('#pc-num').style.color = kit.trim;
  }

  // ---------------------------------------------------------------- career
  renderCareer() {
    const c = this.career;
    if (!this.careerOpened) { this.selectedChapter = c.currentLevel().chapter; this.careerOpened = true; }
    $('#career-stars').textContent = c.totalStars();
    const tabs = $('#chapter-tabs');
    tabs.innerHTML = CHAPTERS.map((ch) => {
      const unlocked = c.isChapterUnlocked(ch.id);
      return `<button class="ch-tab ${ch.id === this.selectedChapter ? 'on' : ''} ${unlocked ? '' : 'locked'}" data-ch="${ch.id}">
        <small>Capítulo ${ch.id}</small><b>${unlocked ? '' : `<span data-icon="lock"></span>`}${esc(ch.title)}</b>
        <span class="stars-mini">★ ${c.chapterStars(ch.id)}/15</span></button>`;
    }).join('');
    $$('.ch-tab', tabs).forEach((b) => b.addEventListener('click', () => {
      const id = +b.dataset.ch;
      if (!c.isChapterUnlocked(id)) { this.toast('Conclua o capítulo anterior para desbloquear', 'info', 1500); return; }
      this.audio.click();
      this.selectedChapter = id;
      this.renderCareer();
    }));
    const ch = CHAPTERS[this.selectedChapter - 1];
    const lv = levelsOfChapter(ch.id);
    const done = lv.filter((l) => c.levelState(l.id).completed).length;
    $('#chapter-banner').innerHTML = `<div><div class="club">${esc(ch.club)}</div><h3>${esc(ch.title)}</h3><p>${esc(ch.blurb)}</p></div>
      <div class="ch-progress"><b>${done}/5</b><small>fases · ★ ${c.chapterStars(ch.id)}/15</small></div>`;
    const current = c.currentLevel();
    $('#level-row').innerHTML = lv.map((l) => {
      const st = c.levelState(l.id);
      const unlocked = c.isUnlocked(l.id);
      const stars = [0, 1, 2].map((i) => `<span class="${i < st.stars ? 'on' : ''}">${ICONS.star}</span>`).join('');
      const tag = l.setPiece === 'freekick' ? 'Falta' : l.setPiece === 'corner' ? 'Escanteio' : `${l.minute}'`;
      return `<button class="level-card ${st.completed ? 'done' : ''} ${unlocked ? '' : 'locked'} ${l === current && unlocked && !st.completed ? 'current' : ''}" data-id="${l.id}">
        ${unlocked ? '' : `<span class="lc-lock">${ICONS.lock}</span>`}
        <span class="lc-tag">${tag} · vs ${esc(l.opp.name)}</span>
        <span class="lc-num">${l.id}</span><span class="lc-name">${esc(l.name)}</span>
        <span class="lc-obj">${esc(l.objective.map(describeObjective).join(' & '))}</span>
        <span class="lc-stars">${stars}</span></button>`;
    }).join('');
    $$('.level-card', $('#level-row')).forEach((b) => b.addEventListener('click', () => {
      const l = LEVELS.find((x) => x.id === b.dataset.id);
      if (!c.isUnlocked(l.id)) { this.toast('Conclua a fase anterior primeiro', 'info', 1400); return; }
      this.audio.click();
      this.startLevel(l);
    }));
    // season ring
    const pct = c.completedCount() / LEVELS.length;
    const R = 32, C = 2 * Math.PI * R;
    $('#season').innerHTML = `<svg class="ring" viewBox="0 0 80 80"><circle cx="40" cy="40" r="${R}" stroke="#1b3866" stroke-width="9" fill="none"/>
      <circle cx="40" cy="40" r="${R}" stroke="url(#rg)" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="${C * pct} ${C}" transform="rotate(-90 40 40)"/>
      <defs><linearGradient id="rg"><stop offset="0" stop-color="#2ee6a6"/><stop offset="1" stop-color="#ffd640"/></linearGradient></defs>
      <text x="40" y="46" text-anchor="middle" fill="#eaf2ff" font-size="18" font-weight="800" font-family="Barlow Condensed, sans-serif">${Math.round(pct * 100)}%</text></svg>
      <div class="season-info"><b>${esc(CHAPTERS[current.chapter - 1].club)}</b>
      <small>Fases ${c.completedCount()}/${LEVELS.length} · Estrelas ${c.totalStars()}/75<br>Gols ${this.save.stats.goals} · Assistências ${this.save.stats.assists}</small></div>`;
    const h = this.save.data.history;
    $('#history').innerHTML = h.length ? h.slice(0, 20).map((r) => `<li class="${r.success ? 'win' : ''}"><i></i>
      <div>${r.id} ${esc(r.name)}<small>vs ${esc(r.opp)} · ${new Date(r.at).toLocaleDateString('pt-BR')}</small></div>
      <span class="h-stars">${r.success ? '★'.repeat(r.stars) : 'FALHOU'}</span></li>`).join('')
      : '<li class="empty">Nenhuma partida ainda — sua história começa agora.</li>';
    hydrateIcons($('#screen-career'));
  }

  // ---------------------------------------------------------------- my player
  renderPlayer() {
    const p = this.save.profile;
    const commit = (rebuild = true) => {
      this.save.save();
      if (rebuild && this.game) this.game.refreshMenuHero();
      this.renderPlayer();
    };
    const name = $('#cp-name');
    if (document.activeElement !== name) name.value = p.name;
    name.oninput = () => { p.name = name.value.trim().slice(0, 16) || 'Player'; this.save.save(); };
    $('#cp-num').textContent = p.number;
    $('#cp-num-dec').onclick = () => { p.number = p.number <= 1 ? 99 : p.number - 1; commit(); };
    $('#cp-num-inc').onclick = () => { p.number = p.number >= 99 ? 1 : p.number + 1; commit(); };
    const sw = (el, list, cur, key, css) => {
      el.innerHTML = list.map((c, i) => `<button class="swatch ${i === cur ? 'on' : ''}" data-i="${i}" style="background:${css(c)}" aria-label="${esc(c.name || c)}"></button>`).join('');
      $$('.swatch', el).forEach((b) => b.addEventListener('click', () => { this.audio.click(); p[key] = key === 'kit' ? list[+b.dataset.i].id : +b.dataset.i; commit(); }));
    };
    sw($('#cp-kit'), KIT_COLORS, KIT_COLORS.findIndex((k) => k.id === p.kit), 'kit', (k) => `linear-gradient(135deg, ${k.main} 55%, ${k.trim} 55%)`);
    sw($('#cp-skin'), SKIN_TONES, p.skin, 'skin', (c) => c);
    sw($('#cp-hair'), HAIR_COLORS, p.hair, 'hair', (c) => c);
    sw($('#cp-boots'), BOOT_COLORS, p.boots, 'boots', (c) => c);
    const styles = ['Curto', 'Topete', 'Longo', 'Raspado'];
    $('#cp-hairstyle').innerHTML = styles.map((s, i) => `<button class="chip ${i === p.hairStyle ? 'on' : ''}" data-i="${i}">${s}</button>`).join('');
    $$('.chip', $('#cp-hairstyle')).forEach((b) => b.addEventListener('click', () => { this.audio.click(); p.hairStyle = +b.dataset.i; commit(); }));
  }

  // ---------------------------------------------------------------- stats
  renderStats() {
    const s = this.save.stats;
    const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
    const mins = Math.round(s.playTime / 60);
    const tiles = [
      ['Gols', s.goals, '', true], ['Assistências', s.assists, ''], ['Estrelas', this.career.totalStars(), 'de 75', true],
      ['Fases concluídas', this.career.completedCount(), `de ${LEVELS.length}`],
      ['Passes certos', s.passes, `${pct(s.passes, s.passesAttempted)} de precisão`],
      ['Chutes', s.shots, `${pct(s.shotsOnTarget, s.shots)} no alvo`],
      ['Cabeçadas', s.headers, 'gols'], ['Gols de primeira', s.oneTouch, ''], ['Bicicletas', s.bicycles, 'gols'],
      ['Gols de falta', s.freeKickGoals, ''], ['Gols de curva', s.curlers, ''], ['Gols no ângulo', s.topCorners, ''],
      ['Gol mais longo', s.longestGoal ? s.longestGoal + 'm' : '—', ''], ['Defesas sofridas', s.saved, ''],
      ['Posses perdidas', s.intercepted, ''], ['Fases jogadas', s.levelsPlayed, `${s.attempts} tentativas`],
      ['Tempo de jogo', mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`, ''],
    ];
    $('#stats-grid').innerHTML = tiles.map(([k, v, sub, hl]) => `<div class="stat ${hl ? 'hl' : ''}"><small>${k}</small><b>${v}</b><span class="sub">${sub}</span></div>`).join('');
    $('#stats-chip').textContent = this.save.profile.name + ' #' + this.save.profile.number;
  }

  // ---------------------------------------------------------------- achievements
  renderAchievements() {
    const got = this.save.data.achievements;
    $('#ach-chip').innerHTML = `<span data-icon="medal"></span><b>${Object.keys(got).length}</b>/${ACHIEVEMENTS.length}`;
    $('#ach-grid').innerHTML = ACHIEVEMENTS.map((a) => `<div class="ach ${got[a.id] ? 'on' : ''}">
      <span class="a-ico" data-icon="${a.icon}"></span>
      <div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>${got[a.id] ? `<span class="a-date">Desbloqueada em ${new Date(got[a.id]).toLocaleDateString('pt-BR')}</span>` : ''}</div></div>`).join('');
    hydrateIcons($('#screen-achievements'));
  }

  // ---------------------------------------------------------------- settings
  renderSettings() {
    const st = this.save.settings;
    const bindRange = (id, key) => {
      const el = $(id); el.value = st[key];
      el.oninput = () => { st[key] = +el.value; this.audio.applyVolumes(); this.save.save(); };
    };
    bindRange('#set-master', 'master'); bindRange('#set-sfx', 'sfx'); bindRange('#set-crowd', 'crowd');
    const bindToggle = (id, key, after) => {
      const el = $(id); el.checked = !!st[key];
      el.onchange = () => { st[key] = el.checked; this.save.save(); after && after(); };
    };
    bindToggle('#set-muted', 'muted', () => this.audio.applyVolumes());
    bindToggle('#set-shake', 'shake'); bindToggle('#set-guide', 'guide'); bindToggle('#set-slowmo', 'slowmo'); bindToggle('#set-tutorials', 'tutorials');
    const qs = ['auto', 'low', 'medium', 'high'];
    $('#set-quality').innerHTML = qs.map((q) => `<button class="chip ${st.quality === q ? 'on' : ''}" data-q="${q}">${({ auto: 'Auto', low: 'Baixa', medium: 'Média', high: 'Alta' })[q]}</button>`).join('');
    $$('.chip', $('#set-quality')).forEach((b) => b.addEventListener('click', () => {
      st.quality = b.dataset.q; this.save.save(); this.applyQuality && this.applyQuality(); this.renderSettings();
    }));
    $('#set-reset').onclick = () => this.confirm('Reiniciar carreira?', 'Todas as fases, estrelas, estatísticas e conquistas serão apagadas. As configurações serão mantidas.', () => {
      this.save.reset(); this.careerOpened = false; this.toast('Carreira reiniciada', 'info'); this.game.refreshMenuHero(); this.renderSettings();
    });
    $('#save-chip').textContent = this.save.available ? 'Progresso salvo neste aparelho' : 'Armazenamento indisponível — o progresso não será salvo';
  }

  confirm(title, text, onYes) {
    $('#confirm-title').textContent = title;
    $('#confirm-text').textContent = text;
    this.showModal('confirm');
    $('#confirm-no').onclick = () => this.hideModal('confirm');
    $('#confirm-yes').onclick = () => { this.hideModal('confirm'); onYes(); };
  }

  showModal(id) { $('#' + id).classList.remove('hidden'); }
  hideModal(id) { $('#' + id).classList.add('hidden'); }

  // ---------------------------------------------------------------- gameplay HUD
  hud(d) {
    $('#hud-level-id').textContent = d.levelId;
    $('#hud-level-name').textContent = d.levelName;
    $('#hud-objective').textContent = d.objective;
    $('#hud-progress').textContent = d.progress || '';
    const att = $('#hud-attempts');
    let html = '';
    for (let i = 1; i <= d.maxAttempts; i++) html += `<i class="${i < d.attempt ? 'used' : ''}">${ICONS.ballFill}</i>`;
    att.innerHTML = html;
    $('#sb-minute').textContent = Math.min(d.minute, 90) + (d.minute > 90 ? `+${d.minute - 90}` : '') + "'";
    const prevHome = $('#sb-score-home').textContent;
    $('#sb-score-home').textContent = d.score[0];
    if (prevHome !== String(d.score[0]) && this._lastLevel === d.levelId) {
      const el = $('#sb-score-home'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    }
    this._lastLevel = d.levelId;
    $('#sb-score-away').textContent = d.score[1];
    const abbr = (n) => n.replace(/[^A-Za-zÀ-ÿ ]/g, '').split(' ').filter((w) => w.length > 2 && !/^U\d+$/.test(w))[0]?.slice(0, 3).toUpperCase() || n.slice(0, 3).toUpperCase();
    $('#sb-home').textContent = abbr(d.club.name);
    $('#sb-away').textContent = abbr(d.opp.name);
    $('#sb-home-color').style.background = d.club.color;
    $('#sb-away-color').style.background = d.opp.color;
  }

  toast(text, type = 'info', ms = 1700) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = text;
    const box = $('#toasts');
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
  }

  hint(text) {
    const h = $('#hint');
    if (!text || this.screen) { h.classList.add('hidden'); return; }
    h.textContent = text;
    h.classList.remove('hidden', 'flash');
  }

  flashHint() {
    const h = $('#hint');
    h.textContent = 'Comece a desenhar a partir do jogador com a bola';
    h.classList.remove('hidden', 'flash');
    void h.offsetWidth;
    h.classList.add('flash');
  }

  showTutorial(pts, text) {
    const t = $('#tutorial');
    t.classList.remove('hidden');
    $('#hint').classList.add('hidden');
    $('.tut-text', t).textContent = text;
    const hand = $('.tut-hand', t);
    // polyline lengths
    const segs = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); total += l; }
    const start = performance.now();
    cancelAnimationFrame(this.tutorialRAF);
    const loop = (now) => {
      const cyc = ((now - start) / 1000) % 2.4;
      const u = Math.min(1, Math.max(0, (cyc - 0.3) / 1.5));
      let d = u * total, i = 0;
      while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
      const k = segs[i] ? d / segs[i] : 0;
      const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k;
      const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k;
      hand.style.transform = `translate(${x - 14}px, ${y - 6}px) scale(${cyc < 0.3 ? 1.15 : 1})`;
      hand.style.opacity = cyc > 2.0 ? String(1 - (cyc - 2.0) / 0.4) : '1';
      this.tutorialRAF = requestAnimationFrame(loop);
    };
    this.tutorialRAF = requestAnimationFrame(loop);
  }

  hideTutorial() {
    cancelAnimationFrame(this.tutorialRAF);
    $('#tutorial').classList.add('hidden');
  }

  showIntro(level, onStart) {
    const ch = CHAPTERS[level.chapter - 1];
    $('#intro-chapter').textContent = `Capítulo ${ch.id} · ${ch.title} · ${level.id}`;
    $('#intro-minute').textContent = `${level.minute > 90 ? '90+' + (level.minute - 90) : level.minute}'`;
    $('#intro-title').textContent = level.name;
    $('#intro-home').textContent = ch.club;
    $('#intro-away').textContent = level.opp.name;
    $('#intro-score').textContent = `${level.score[0]} – ${level.score[1]}`;
    $('#intro-brief').textContent = level.brief;
    const star = `<span class="n">${ICONS.star}</span>`;
    $('#intro-objs').innerHTML =
      level.objective.map((o) => `<div class="iobj main"><span data-icon="target"></span>${esc(describeObjective(o))}<span class="n">${ICONS.star}</span></div>`).join('') +
      level.stars.map((o) => `<div class="iobj"><span data-icon="star"></span>${esc(describeObjective(o))}${star}</div>`).join('');
    hydrateIcons($('#intro-card'));
    this.showModal('intro-card');
    $('#btn-kickoff').onclick = () => { this.audio.unlock(); this.audio.click(); this.hideModal('intro-card'); onStart(); };
  }

  goal(label, sub) {
    const b = $('#big-text');
    $('.big-main', b).textContent = label;
    $('.big-sub', b).textContent = sub;
    b.classList.remove('out');
    b.classList.add('show');
    clearTimeout(this._goalT);
    this._goalT = setTimeout(() => { b.classList.add('out'); setTimeout(() => b.classList.remove('show', 'out'), 400); }, 2600);
  }

  openPause() {
    if (!this.game.pause()) return;
    this.audio.click();
    $('#pause-obj').textContent = this.game.level ? `${this.game.level.id} ${this.game.level.name} — ${this.game.level.objective.map(describeObjective).join(' & ')}` : '';
    $('#pause-master').value = this.save.settings.master;
    this.showModal('pause-menu');
  }

  closePause() {
    this.hideModal('pause-menu');
    this.game.resume();
  }

  showResult(r) {
    $('#hint').classList.add('hidden');
    this.hideTutorial();
    const card = $('#result .card');
    card.classList.toggle('fail', !r.success);
    $('#res-tag').textContent = `Fase ${r.level.id} · ${r.level.name}`;
    $('#res-title').textContent = r.success ? (r.firstClear ? 'FASE CONCLUÍDA' : 'BOA PARTIDA') : 'FASE PERDIDA';
    $('#res-reason').textContent = r.success ? '' : (r.reason || 'Sem tentativas restantes');
    const stars = $$('#res-stars i');
    stars.forEach((s, i) => {
      s.innerHTML = ICONS.star;
      s.classList.remove('on');
      if (i < r.stars) setTimeout(() => { s.classList.add('on'); this.audio.star(i); }, 450 + i * 320);
    });
    const row = (o, extra) => `<li class="${o.ok ? 'ok' : ''}"><span data-icon="${o.ok ? 'check' : 'x'}"></span>${esc(o.text)}${extra ? '<span class="tag">★ bônus</span>' : ''}</li>`;
    $('#res-objs').innerHTML = r.primary.map((o) => row(o, false)).join('') + r.extra.map((o) => row(o, true)).join('');
    $('#res-meta').innerHTML = `<span>Tentativas <b>${r.attemptsUsed}/${r.maxAttempts}</b></span><span>Ações <b>${r.actions}</b></span><span>Total ★ <b>${this.career.totalStars()}</b></span>`;
    $('#res-unlocks').innerHTML = (r.unlocked || []).map((a) => `<span class="unlock"><span data-icon="medal"></span>${esc(a.name)}</span>`).join('');
    hydrateIcons($('#result'));
    const next = $('#res-next');
    if (r.success && r.next) {
      next.innerHTML = `${ICONS.next}<span>Próxima ${r.next.id}</span>`;
      next.onclick = () => { this.audio.click(); this.hideModal('result'); this.startLevel(r.next); };
    } else if (r.success) {
      next.innerHTML = `${ICONS.trophy}<span>Carreira</span>`;
      next.onclick = () => { this.audio.click(); this.showScreen('career'); };
    } else {
      next.innerHTML = `${ICONS.refresh}<span>Tentar de novo</span>`;
      next.onclick = () => { this.audio.click(); this.hideModal('result'); this.startLevel(r.level); };
    }
    $('#res-retry').onclick = () => { this.audio.click(); this.hideModal('result'); this.startLevel(r.level); };
    $('#res-menu').onclick = () => { this.audio.click(); this.showScreen('menu'); };
    setTimeout(() => this.showModal('result'), r.success ? 200 : 900);
  }
}
