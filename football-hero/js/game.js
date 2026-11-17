// Gameplay orchestrator: level spawning, the attack state machine
// (intro > aim > windup > flight > settle/loose > celebrate/dead), possession,
// interceptions, saves, goals, one-touch finishes, slow motion, objectives,
// statistics and the animated menu scene.
import * as THREE from 'three';
import { GOAL, BALL_R, KIT_COLORS, SKIN_TONES, HAIR_COLORS, BOOT_COLORS, BOX } from './config.js';
import { clamp, damp, dist2, rng, Emitter } from './utils.js';
import { Player } from './player.js';
import { Ball } from './ball.js';
import { TrajectoryInput, planFromStroke } from './trajectory.js';
import { CameraDirector } from './camera.js';
import { TeamAI } from './ai.js';
import { GoalkeeperAI } from './goalkeeper.js';
import { CHAPTERS, levelDifficulty, TEAMMATE_NAMES, TEAMMATE_NUMBERS, describeObjective } from './levels.js';
import { evaluate, progressText, isAttemptDoomed } from './levelManager.js';

const WHITE_KIT = { main: '#f1f3f6', trim: '#1b1f2a', shorts: '#f1f3f6', socks: '#f1f3f6' };
const KEEPER_KIT = { main: '#20252f', trim: '#c6ff00', shorts: '#20252f', socks: '#20252f', glove: '#c6ff00' };

export function userKit(profile) {
  const k = KIT_COLORS.find((c) => c.id === profile.kit) || KIT_COLORS[0];
  return { main: k.main, trim: k.trim, shorts: k.shorts, socks: k.main };
}

function heroOpts(profile) {
  return {
    kit: userKit(profile),
    skin: SKIN_TONES[profile.skin] || SKIN_TONES[2],
    hair: HAIR_COLORS[profile.hair] || HAIR_COLORS[0],
    hairStyle: profile.hairStyle || 0,
    boots: BOOT_COLORS[profile.boots] || BOOT_COLORS[0],
    number: profile.number,
    name: profile.name,
    hero: true,
    team: 'att',
  };
}

export class Game extends Emitter {
  constructor({ stage, audio, save, career, ui, container, overlay }) {
    super();
    this.stage = stage;
    this.audio = audio;
    this.save = save;
    this.career = career;
    this.ui = ui;
    this.scene = stage.scene;
    this.camDir = new CameraDirector(stage.camera);
    this.ball = new Ball(this.scene);
    this.input = new TrajectoryInput(container, overlay, stage.camera);
    this.attackers = [];
    this.defenders = [];
    this.keeper = null;
    this.keeperAI = null;
    this.ai = null;
    this.phase = 'menu';
    this.holder = null;
    this.plan = null;
    this.queued = null;
    this.timeScale = 1;
    this.timeTarget = 1;
    this.timers = [];
    this.paused = false;
    this.level = null;
    this.stats = save.data.stats;
    this._v = new THREE.Vector3();
    this._buildMarkers();
    this._bindInput();
    this.setupMenuScene();
  }

  // ---------------------------------------------------------------- helpers
  after(sec, fn) { this.timers.push({ t: sec, fn }); }
  clearTimers() { this.timers.length = 0; }

  get settings() { return this.save.data.settings; }

  screenOf(v, yOff = 0) {
    this._v.copy(v); this._v.y += yOff;
    return this.input.worldToScreen(this._v);
  }

  _buildMarkers() {
    const ringGeo = new THREE.RingGeometry(0.55, 0.72, 40).rotateX(-Math.PI / 2);
    const mk = (color) => new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.holderRing = mk(0x2ee6a6);
    this.snapRing = mk(0xffd640);
    this.meetRing = mk(0xffffff);
    for (const r of [this.holderRing, this.snapRing, this.meetRing]) { r.position.y = 0.03; r.visible = false; r.renderOrder = 2; this.scene.add(r); }
    // hero marker: a floating chevron above your player's head
    const shape = new THREE.Shape();
    shape.moveTo(-0.22, 0.2); shape.lineTo(0, -0.05); shape.lineTo(0.22, 0.2); shape.lineTo(0.22, 0.05); shape.lineTo(0, -0.2); shape.lineTo(-0.22, 0.05); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
    g.translate(0, 0, -0.03);
    this.heroMarker = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffd640 }));
    this.heroMarker.visible = false;
    this.scene.add(this.heroMarker);
  }

  // ---------------------------------------------------------------- menu scene
  setupMenuScene() {
    this.clearLevel();
    this.phase = 'menu';
    this.input.enabled = false;
    this.input.guide = null;
    if (this.menuHero) this.menuHero.dispose();
    this.menuHero = new Player(heroOpts(this.save.profile));
    this.menuHero.place(0, -28, 0.5);
    this.scene.add(this.menuHero.root);
    this.ball.reset(0, -27.6);
    this.juggleT = 0;
    this.camDir.setMode('menu', { center: new THREE.Vector3(0, 0, -28), cut: true });
    this.stage.setExcitement(0.0);
    this.audio.setCrowd(0.3);
    this.stage.setCrowdColors(userKit(this.save.profile).main, '#c62828');
    this.timeScale = 1; this.timeTarget = 1;
  }

  showMyPlayer(on) {
    if (!this.menuHero) return;
    if (on) this.camDir.setMode('myplayer', { center: this.menuHero.pos, angle: 0.5 });
    else this.camDir.setMode('menu', { center: new THREE.Vector3(0, 0, -28) });
  }

  refreshMenuHero() {
    if (this.phase !== 'menu') return;
    const keepMode = this.camDir.mode;
    const h = this.menuHero;
    const heading = h ? h.heading : 0.5;
    if (h) h.dispose();
    this.menuHero = new Player(heroOpts(this.save.profile));
    this.menuHero.place(0, -28, heading);
    this.scene.add(this.menuHero.root);
    this.stage.setCrowdColors(userKit(this.save.profile).main, '#c62828');
    if (keepMode === 'myplayer') this.camDir.opts.center = this.menuHero.pos;
  }

  _updateMenu(dt) {
    const h = this.menuHero;
    if (!h) return;
    h.update(dt);
    // keepy-uppies
    const period = 0.62;
    const prevCycle = Math.floor(this.juggleT / period);
    this.juggleT += dt;
    const cyc = Math.floor(this.juggleT / period);
    const f = (this.juggleT % period) / period;
    if (cyc !== prevCycle) h.play('receive', { speed: 1.5 });
    h.footPoint(this._v, 0.3);
    this.ball.pos.set(this._v.x, BALL_R + 0.25 + Math.sin(f * Math.PI) * 0.85, this._v.z);
    this.ball.mesh.rotation.x += dt * 6;
    this.ball.shadow.position.set(this._v.x, 0.012, this._v.z);
  }

  // ---------------------------------------------------------------- level lifecycle
  clearLevel() {
    for (const p of [...this.attackers, ...this.defenders]) p.dispose();
    if (this.keeper) this.keeper.dispose();
    this.attackers = []; this.defenders = []; this.keeper = null;
    this.holder = null; this.plan = null; this.queued = null;
    this.clearTimers();
    for (const r of [this.holderRing, this.snapRing, this.meetRing, this.heroMarker]) r.visible = false;
  }

  startLevel(level) {
    this.paused = false;
    if (this.menuHero) { this.menuHero.dispose(); this.menuHero = null; }
    this.clearLevel();
    this.level = level;
    this._chapterClub = CHAPTERS[level.chapter - 1].club;
    this.attempt = 1;
    this.maxAttempts = level.attempts || 3;
    this.levelStart = performance.now();
    this.career.recordStart(level);
    this._spawn(level);
    this.resetAttempt(true);
  }

  _oppKit(level) {
    const k = KIT_COLORS.find((c) => c.id === level.opp.kit) || KIT_COLORS[1];
    const mine = userKit(this.save.profile);
    if (k.main === mine.main || (level.opp.kit === this.save.profile.kit)) return WHITE_KIT;
    return { main: k.main, trim: k.trim, shorts: k.shorts, socks: k.main };
  }

  _spawn(level) {
    const diff = levelDifficulty(level);
    this.difficulty = diff;
    this.ai = new TeamAI({
      defSpeed: 3.7 + diff * 2.6,
      reaction: 0.55 - diff * 0.25,
      skill: 0.6 + diff * 0.35,
      attSpeed: 6.8,
    });
    const R = rng(level.id.split('-').reduce((a, b) => a * 31 + Number(b), 7));
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const profile = this.save.profile;
    const kit = userKit(profile);
    const names = [...TEAMMATE_NAMES].sort(() => R() - 0.5);
    let ni = 0;
    level.attackers.forEach((a, i) => {
      let p;
      if (a.hero) p = new Player(heroOpts(profile));
      else {
        p = new Player({
          kit, team: 'att', skin: pick(SKIN_TONES), hair: pick(HAIR_COLORS), hairStyle: Math.floor(R() * 4),
          boots: pick(BOOT_COLORS), number: TEAMMATE_NUMBERS[ni % TEAMMATE_NUMBERS.length] === profile.number ? 18 : TEAMMATE_NUMBERS[ni % TEAMMATE_NUMBERS.length], name: names[ni++ % names.length],
        });
      }
      p.ai = { home: { x: a.x, z: a.z }, run: a.run || null, runUsed: false, index: i };
      this.scene.add(p.root);
      this.attackers.push(p);
    });
    const opp = this._oppKit(level);
    level.defenders.forEach((d, i) => {
      const p = new Player({
        kit: opp, team: 'def', skin: pick(SKIN_TONES), hair: pick(HAIR_COLORS), hairStyle: Math.floor(R() * 4),
        boots: pick(BOOT_COLORS), number: [4, 5, 3, 2, 6, 15, 22, 16][i % 8], name: 'Zagueiro',
      });
      p.ai = { home: { x: d.x, z: d.z }, mark: d.mark ?? null, role: d.role || 'def', speedMul: 0.94 + R() * 0.12 };
      this.scene.add(p.root);
      this.defenders.push(p);
    });
    this.keeper = new Player({ kit: KEEPER_KIT, team: 'def', isKeeper: true, skin: pick(SKIN_TONES), hair: pick(HAIR_COLORS), hairStyle: Math.floor(R() * 4), boots: '#111', number: 1, name: 'Goleiro' });
    this.keeper.ai = { role: 'keeper' };
    this.scene.add(this.keeper.root);
    this.keeperAI = new GoalkeeperAI(this.keeper, {
      reaction: 0.36 - diff * 0.12,
      diveSpeed: 4.4 + diff * 1.5,
      skill: 0.7 + diff * 0.27,
    });
    this.stage.setCrowdColors(kit.main, opp.main);
  }

  resetAttempt(first) {
    const level = this.level;
    this.clearTimers();
    this.paused = false;
    this.timeScale = 1; this.timeTarget = 1;
    level.attackers.forEach((a, i) => {
      const p = this.attackers[i];
      const face = Math.atan2(0 - a.x, GOAL.z - a.z);
      p.place(a.x, a.z, face);
      p.stance = 'idle';
      p.ai.runUsed = false; p.ai.runTarget = null; p.ai.looseChaser = false;
    });
    const holder = this.attackers[level.ball];
    if (level.setPiece === 'corner') holder.place(holder.pos.x, holder.pos.z, Math.atan2(0 - holder.pos.x, -44 - holder.pos.z));
    level.defenders.forEach((d, i) => {
      const p = this.defenders[i];
      p.place(d.x, d.z, Math.atan2(holder.pos.x - d.x, holder.pos.z - d.z));
      p.stance = 'ready';
      p.ai.down = 0; p.ai.lunged = false; p.ai.looseChaser = false; p.ai.jumping = false;
    });
    this.keeperAI.snapTo(holder.pos.x, holder.pos.z);
    this.keeperAI.resetDive();
    this.holder = holder;
    holder.footPoint(this._v, 0.38);
    this.ball.reset(this._v.x, this._v.z);
    this.ball.hold(holder);
    this.plan = null;
    this.queued = null;
    this.ctx = { actions: 0, passes: 0, lastPasser: null, attempt: this.attempt, goal: false };
    this.input.guide = null;
    this.input.enabled = false;
    this.heroMarker.visible = true;
    this.meetRing.visible = false;
    this.snapRing.visible = false;
    this.stage.setExcitement(0.05);
    this.audio.setCrowd(0.4);
    this._hud();
    if (first) {
      this.phase = 'intro';
      this.camDir.setMode('intro', { holder: holder.pos.clone() });
      this.ui.showIntro(level, () => this.kickOff());
    } else {
      this.phase = 'intro';
      this.camDir.setMode('aim', { holder });
      this.after(0.9, () => this.kickOff());
    }
  }

  kickOff() {
    if (this.phase !== 'intro') return;
    this.audio.whistle('short');
    this.enterAim();
    if (this.attempt === 1) this.after(1.1, () => this._maybeTutorial());
  }

  enterAim() {
    this.phase = 'aim';
    this.plan = null;
    this.queued = null;
    this.timeTarget = 1;
    this.camDir.setMode('aim', { holder: this.holder });
    this.input.enabled = true;
    this.meetRing.visible = false;
    this.holder.stance = 'idle';
    this.holder.lookAt(0, GOAL.z);
    this.audio.setCrowd(0.4 + clamp((40 - (this.holder.pos.z - GOAL.z)) / 40, 0, 1) * 0.3);
    this._hud();
    const doom = isAttemptDoomed(this.level, this.ctx);
    if (doom) { this.fail(doom, 'Sem ações restantes'); return; }
    this.ui.hint(this.holder.isHero ? 'Desenhe a partir do seu jogador para passar ou chutar' : `Desenhe a partir de ${this.holder.name} para passar ou chutar`);
  }

  _hud() {
    const l = this.level;
    if (!l) return;
    this.ui.hud({
      levelId: l.id,
      levelName: l.name,
      objective: l.objective.map(describeObjective).join(' & '),
      progress: progressText(l, this.ctx),
      attempt: this.attempt,
      maxAttempts: this.maxAttempts,
      minute: l.minute + Math.floor((this.ctx?.actions || 0) / 2),
      score: [l.score[0] + (this.ctx?.goal ? 1 : 0), l.score[1]],
      home: this.career ? (this.save.profile.name.split(' ').pop()) : '',
      club: { name: (this._chapterClub || 'Seu Clube'), color: userKit(this.save.profile).main },
      opp: { name: l.opp.name, color: this._oppKit(l).main },
    });
  }

  _maybeTutorial() {
    const l = this.level;
    if (!l.tutorial || !this.settings.tutorials || this.phase !== 'aim' || this.input.active) return;
    const pts3 = [];
    const h = this.holder.pos;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    let text = '';
    if (l.tutorial === 'shoot') {
      pts3.push(V(h.x, 0.3, h.z), V(h.x * 0.6 + 0.5, 0.3, (h.z + GOAL.z) / 2), V(2.6, 1.8, GOAL.z));
      text = 'Arraste a partir do seu jogador e solte sobre o gol para chutar. Deslize mais rápido para mais força.';
    } else if (l.tutorial === 'pass') {
      const t = this.attackers[1].pos;
      pts3.push(V(h.x, 0.3, h.z), V((h.x + t.x) / 2, 0.3, (h.z + t.z) / 2 + 1.5), V(t.x, 0.3, t.z));
      text = 'Desenhe uma linha do seu jogador até um companheiro para passar. Depois chute!';
    } else if (l.tutorial === 'through') {
      const r = this.attackers[1].ai.run || this.attackers[1].pos;
      pts3.push(V(h.x, 0.3, h.z), V((h.x + r.x) / 2 + 2, 0.3, (h.z + r.z) / 2), V(r.x, 0.3, r.z));
      text = 'Desenhe no espaço vazio à frente de um companheiro em corrida para enfiar a bola.';
    } else if (l.tutorial === 'onetouch') {
      const r = this.attackers.find((a) => a.isHero) || this.attackers[1];
      pts3.push(V(h.x, 0.3, h.z), V((h.x + r.pos.x) / 2, 0.3, (h.z + r.pos.z) / 2 + 3), V(r.pos.x, 0.3, r.pos.z));
      text = 'Cruze para o seu jogador. Com a bola no ar (câmera lenta), desenhe do receptor até o gol!';
    } else if (l.tutorial === 'freekick') {
      const w = this.defenders.find((d) => d.ai.role === 'wall');
      const side = w ? (w.pos.x > h.x ? -1 : 1) : 1;
      pts3.push(V(h.x, 0.3, h.z), V(h.x + side * 4.5, 0.3, (h.z + GOAL.z) / 2 + 2), V(-side * -2.4, 1.9, GOAL.z));
      text = 'Curve a linha ao redor da barreira — o chute faz a mesma curva.';
    }
    if (!pts3.length) return;
    const pts = pts3.map((p) => this.screenOf(p));
    this.ui.showTutorial(pts, text);
  }

  // ---------------------------------------------------------------- input
  _bindInput() {
    const inp = this.input;
    inp.canStart = (sx, sy) => {
      if (this.paused) return null;
      const R = Math.max(64, Math.min(this.input.w, this.input.h) * 0.11);
      if (this.phase === 'aim' && this.holder) {
        const a = this.screenOf(this.holder.pos, 0.9), b = this.screenOf(this.ball.pos);
        if (Math.hypot(sx - a[0], sy - a[1]) < R * 1.25 || Math.hypot(sx - b[0], sy - b[1]) < R) {
          this.ui.hideTutorial();
          return { player: this.holder, mode: 'aim' };
        }
      }
      if (this.phase === 'flight' && this.plan && this.plan.kind !== 'shot' && this.plan.receiver && !this.queued) {
        const r = this.plan.receiver;
        const a = this.screenOf(r.pos, 0.9), b = this.screenOf(this.plan.meet);
        if (Math.hypot(sx - a[0], sy - a[1]) < R * 1.4 || Math.hypot(sx - b[0], sy - b[1]) < R * 1.2) {
          return { player: r, mode: 'onetouch' };
        }
      }
      return null;
    };
    inp.onRejected = () => {
      if (this.phase === 'aim') this.ui.flashHint();
    };
    inp.onMove = (stroke) => {
      this.snapRing.visible = false;
      inp.snapScreen = null;
      if (!stroke) return;
      const last = stroke.samples[stroke.samples.length - 1];
      if (!last.ground || last.goal) return;
      let best = null, bd = 2.2;
      for (const a of this.attackers) {
        if (a === stroke.origin.player) continue;
        const d = dist2(a.pos.x, a.pos.z, last.ground.x, last.ground.z);
        if (d < bd) { bd = d; best = a; }
      }
      if (best) {
        this.snapRing.visible = true;
        this.snapRing.position.set(best.pos.x, 0.03, best.pos.z);
        inp.snapScreen = this.screenOf(best.pos);
      }
    };
    inp.onComplete = (stroke) => {
      this.snapRing.visible = false;
      if (this.paused) return;
      const o = stroke.origin;
      if (o.mode === 'aim' && this.phase === 'aim') {
        const plan = planFromStroke(stroke, {
          start: this.ball.pos, startY: this.ball.pos.y, passer: this.holder, attackers: this.attackers,
        });
        if (!plan) { this.ui.toast('Desenhe uma linha mais longa', 'info'); return; }
        this.kick(this.holder, plan, false);
      } else if (o.mode === 'onetouch' && this.phase === 'flight' && this.plan && o.player === this.plan.receiver) {
        this.queued = { stroke, receiver: o.player };
        this.ui.toast('FINALIZAÇÃO DE PRIMEIRA PRONTA', 'good');
        this.audio.click();
        this.timeTarget = 0.55;
      }
    };
  }

  // ---------------------------------------------------------------- kicking
  kick(player, plan, oneTouch, anim) {
    this.ui.hint(null);
    this.ui.hideTutorial();
    this.holderRing.visible = false;
    this.ctx.actions++;
    if (plan.kind === 'shot') this.stats.shots++;
    else this.stats.passesAttempted++;
    const dir = plan.curve.getTangentAt(0.02);
    dir.y = 0; dir.normalize();
    if (!anim) anim = plan.kind === 'shot' || plan.length > 21 ? 'kick' : 'pass';
    if (!oneTouch) {
      this.phase = 'windup';
      this.input.enabled = false;
      this.ball.mode = 'dead';
      // step into the ball along the chosen direction
      const sx = this.ball.pos.x - dir.x * 0.42, sz = this.ball.pos.z - dir.z * 0.42;
      player.moveTo(sx, sz, 3);
      player.faceTowards(this.ball.pos.x + dir.x * 8, this.ball.pos.z + dir.z * 8);
      player.play(anim, { onContact: () => this.launch(player, plan, false, anim) });
    } else {
      player.faceTowards(this.ball.pos.x + dir.x * 8, this.ball.pos.z + dir.z * 8);
      const a = { kick: 0.52, pass: 0.42, header: 0.7, volley: 0.6, bicycle: 1.1 }[anim] || 0.5;
      const c = { kick: 0.5, pass: 0.48, header: 0.45, volley: 0.42, bicycle: 0.42 }[anim] || 0.5;
      player.play(anim, { startAt: Math.max(0, c - 0.05 / a) });
      this.launch(player, plan, true, anim);
    }
  }

  launch(player, plan, oneTouch, anim) {
    const ball = this.ball;
    plan.oneTouch = oneTouch;
    plan.finish = anim === 'header' ? 'header' : anim === 'bicycle' ? 'bicycle' : anim === 'volley' ? 'volley' : 'shot';
    // re-anchor the plan start to the actual ball position (no teleporting)
    ball.lastToucher = player;
    ball.startFlight(plan);
    this.plan = plan;
    this.phase = 'flight';
    this.holder = null;
    this.input.enabled = plan.kind !== 'shot';
    this.audio.kick(plan.kind === 'shot' ? plan.power : anim === 'header' ? 0.2 : 0.35);
    this.ai.onKick(plan, this);
    this.keeperAI.onKick(plan, { oneTouch, screened: false });
    this.oneTouchHint = false;
    if (plan.kind === 'shot') {
      this.ctx.shot = {
        shooter: player, assist: this.ctx.lastPasser && this.ctx.lastPasser !== player ? this.ctx.lastPasser : null,
        target: plan.target, curl: plan.curl, finish: plan.finish, oneTouch,
        dist: Math.hypot(ball.pos.x, ball.pos.z - GOAL.z), freeKick: this.level.setPiece === 'freekick' && this.ctx.actions === 1,
      };
      if (Math.abs(plan.target.x) < GOAL.halfWidth && plan.target.y < GOAL.height) this.stats.shotsOnTarget++;
      this.camDir.setMode('shot', { from: player.pos.clone(), target: plan.target });
      this.stage.setExcitement(0.3);
      this.audio.setCrowd(0.85);
      this.input.guide = { pts: plan.points(40), alpha: 1, fade: 1.6 };
      if (this.settings.shake) this.camDir.shake(0.08 * plan.power);
    } else {
      this.camDir.setMode('follow');
      this.audio.setCrowd(0.5);
      if (this.settings.guide) this.input.guide = { pts: plan.points(40), alpha: 1, fade: 0.9 };
      if (plan.meet) {
        this.meetRing.visible = true;
        this.meetRing.position.set(plan.meet.x, 0.03, plan.meet.z);
      }
    }
    this._hud();
  }

  // Choose the right first-time technique for the ball height / direction
  _oneTouchAnim(receiver, plan) {
    const y = this.ball.pos.y;
    if (y > 1.25) return 'header';
    const inDir = this.ball.vel.clone().setY(0).normalize();
    const out = plan.curve.getTangentAt(0.05).setY(0).normalize();
    if (plan.kind === 'shot' && y > 0.75 && inDir.dot(out) > 0.35) return 'bicycle';
    if (y > 0.45) return 'volley';
    return plan.kind === 'shot' ? 'kick' : 'pass';
  }

  // ---------------------------------------------------------------- outcomes
  receive(r) {
    const plan = this.plan;
    if (plan && plan.from && plan.from !== r) {
      this.ctx.passes++;
      this.stats.passes++;
      this.ctx.lastPasser = plan.from;
    }
    this.meetRing.visible = false;
    this.input.guide = null;
    if (this.queued && this.queued.receiver === r) {
      const stroke = this.queued.stroke;
      this.queued = null;
      const y = this.ball.pos.y;
      const np = planFromStroke(stroke, {
        start: this.ball.pos, startY: y, passer: r, attackers: this.attackers, mode: y > 1.25 ? 'header' : 'foot',
      });
      if (np) {
        this.timeTarget = 1;
        const anim = this._oneTouchAnim(r, np);
        this.kick(r, np, true, anim);
        return;
      }
    }
    this.timeTarget = 1;
    this.queued = null;
    this.ball.hold(r);
    this.audio.touch();
    r.play('receive');
    r.stop();
    this.holder = r;
    this.plan = null;
    this.phase = 'settle';
    this.input.enabled = false;
    this.after(0.45, () => { if (this.phase === 'settle') this.enterAim(); });
    this._hud();
  }

  intercepted(d, why = 'INTERCEPTADO') {
    if (this.phase === 'dead' || this.phase === 'celebrate') return;
    this.stats.intercepted++;
    this.phase = 'dead';
    this.input.enabled = false;
    this.input.cancel();
    this.timeTarget = 1;
    this.meetRing.visible = false;
    const fast = this.ball.vel.length() > 16;
    if (fast) {
      // block / deflection
      const v = this.ball.vel.clone().multiplyScalar(-0.25);
      v.x += (Math.random() - 0.5) * 8; v.y = 2 + Math.random() * 3;
      this.ball.release(v);
      this.ball.lastToucher = d;
      this.audio.touch();
      this.ui.toast('BLOQUEADO!', 'bad');
    } else {
      this.ball.hold(d);
      d.stop();
      // counter attack: dribble away
      this.after(0.4, () => d.moveTo(d.pos.x + (Math.random() - 0.5) * 10, d.pos.z + 18, 5.5));
      this.audio.touch();
      this.ui.toast(why, 'bad');
    }
    this.audio.groan();
    this.stage.setExcitement(0);
    this.after(2.1, () => this.endAttempt(why === 'INTERCEPTADO' ? 'Posse de bola perdida' : why));
  }

  keeperClaims() {
    if (this.phase === 'dead' || this.phase === 'celebrate') return;
    this.phase = 'dead';
    this.input.enabled = false;
    this.input.cancel();
    this.timeTarget = 1;
    this.ball.carry(this.keeper);
    this.keeper.play('catch');
    this.audio.save();
    this.audio.groan();
    this.ui.toast('O GOLEIRO FICOU COM ELA', 'bad');
    this.after(2.0, () => this.endAttempt('O goleiro segurou'));
  }

  saved(decision) {
    if (this.phase === 'dead' || this.phase === 'celebrate') return;
    this.phase = 'dead';
    this.input.enabled = false;
    this.stats.saved++;
    this.audio.save();
    this.audio.ooh();
    this.stage.setExcitement(0.2);
    if (this.settings.shake) this.camDir.shake(0.12);
    if (decision.catch) {
      this.ball.carry(this.keeper);
      this.ui.toast('DEFENDEU!', 'bad');
    } else {
      const sx = Math.sign(this.ball.pos.x - this.keeper.pos.x) || 1;
      const v = new THREE.Vector3(sx * (3 + Math.random() * 5), 1.5 + Math.random() * 3, 4 + Math.random() * 5);
      if (decision.y > 1.9) { v.y = 4; v.z = -2; } // tipped over the bar
      this.ball.release(v);
      this.ball.lastToucher = this.keeper;
      this.ui.toast('QUE DEFESA!', 'bad');
    }
    this.after(2.3, () => this.endAttempt('Defesa do goleiro'));
  }

  fail(message, toast) {
    if (this.phase === 'dead' || this.phase === 'celebrate') return;
    this.phase = 'dead';
    this.input.enabled = false;
    this.input.cancel();
    this.timeTarget = 1;
    this.meetRing.visible = false;
    this.ui.toast(toast || message, 'bad');
    this.after(2.0, () => this.endAttempt(message));
  }

  goal(ev) {
    if (this.phase === 'celebrate') return;
    const prevPhase = this.phase;
    if (prevPhase === 'dead') return; // ball already lost / saved
    this.phase = 'celebrate';
    this.input.enabled = false;
    this.input.cancel();
    this.meetRing.visible = false;
    this.input.guide = null;
    const scorer = this.ball.lastToucher && this.attackers.includes(this.ball.lastToucher) ? this.ball.lastToucher : this.attackers[0];
    const shot = this.ctx.shot || { shooter: scorer, finish: 'shot', target: { x: ev.x, y: ev.y }, curl: 0, oneTouch: false, dist: 10 };
    const assist = shot.shooter === scorer ? shot.assist : null;
    const ctx = Object.assign(this.ctx, {
      goal: true,
      scorerIsHero: !!scorer.isHero,
      assistByHero: !!(assist && assist.isHero),
      finish: shot.finish,
      oneTouch: !!shot.oneTouch,
      target: { x: ev.x, y: ev.y },
      curl: shot.curl,
      shotDist: shot.dist,
    });
    const result = evaluate(this.level, ctx);
    this.lastResult = result;
    // stats
    const s = this.stats;
    s.goals++;
    if (ctx.assistByHero && !ctx.scorerIsHero) s.assists++;
    if (ctx.finish === 'header') s.headers++;
    if (ctx.finish === 'bicycle') s.bicycles++;
    if (ctx.oneTouch) s.oneTouch++;
    if (Math.abs(ctx.curl || 0) > 1.0) s.curlers++;
    if (Math.abs(ev.x) > GOAL.halfWidth - 1.5 && ev.y > 1.45) s.topCorners++;
    if (shot.freeKick) s.freeKickGoals++;
    s.longestGoal = Math.max(s.longestGoal, Math.round(ctx.shotDist || 0));
    this.save.save();

    // presentation
    this.audio.net();
    this.audio.cheer(1, 5);
    this.stage.netImpact(ev.x, ev.y, clamp(ev.speed / 25, 0.3, 1));
    this.stage.setExcitement(1);
    this.audio.setCrowd(1);
    if (this.settings.shake) this.camDir.shake(0.2);
    if (this.settings.slowmo) {
      this.timeTarget = 0.3; this.timeScale = 0.3;
      this.after(0.35, () => { this.timeTarget = 1; });
    }
    const label = { header: 'DE CABEÇA!', bicycle: 'DE BICICLETA!', volley: 'QUE VOLEIO!' }[ctx.finish]
      || (ctx.shotDist >= 25 ? 'GOLAÇO!' : Math.abs(ctx.curl || 0) > 1.0 ? 'QUE CURVA!' : ctx.oneTouch ? 'DE PRIMEIRA!' : 'GOOOL!');
    this.ui.goal(label, `${scorer.name}${assist ? ' · assistência ' + assist.name : ''}`);
    this._hud();
    this.camDir.setMode('goal', { side: ev.x >= 0 ? 1 : -1, x: ev.x, scorer, orbit0: Math.atan2(-scorer.pos.x, 8) });
    // celebrations
    const kinds = ['airplane', 'kneeslide', 'jump', 'point'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    this.after(0.4, () => {
      scorer.action = null;
      scorer.setCelebrate(kind);
      if (kind === 'airplane') scorer.moveTo(clamp(scorer.pos.x * 1.5 + Math.sign(scorer.pos.x || 1) * 10, -30, 30), Math.max(GOAL.z + 8, scorer.pos.z - 2), 5.5);
      else scorer.stop();
      for (const a of this.attackers) {
        if (a === scorer) continue;
        a.setCelebrate(Math.random() < 0.5 ? 'clap' : 'jump');
        this.after(0.6 + Math.random() * 0.6, () => {
          a.setCelebrate('clap');
          const ang = Math.random() * Math.PI * 2;
          a.moveTo(scorer.pos.x + Math.cos(ang) * 1.6, scorer.pos.z + Math.sin(ang) * 1.6, 6.5);
        });
      }
      for (const d of this.defenders) { d.stop(); d.override = Math.random() < 0.5 ? 'handsOnHead' : 'dejected'; }
    });
    this.after(1.6, () => { this.keeper.action = null; this.keeper.override = 'dejected'; this.keeperAI.resetDive(); });
    this.after(4.8, () => {
      this.stage.setExcitement(0.35);
      if (result.success) this.completeLevel(result);
      else this.endAttempt('Gol — mas o objetivo não foi cumprido');
    });
  }

  endAttempt(reason) {
    this.attemptsUsed = this.attempt;
    this.stats.attempts++;
    if (this.attempt < this.maxAttempts) {
      this.attempt++;
      this.ui.toast(`${reason} · Tentativa ${this.attempt}/${this.maxAttempts}`, 'info', 2200);
      this.audio.whistle('short');
      for (const p of [...this.attackers, ...this.defenders, this.keeper]) { p.override = null; p.celebrate = null; p.action = null; }
      this.resetAttempt(false);
    } else {
      this.levelFailed(reason);
    }
  }

  levelFailed(reason) {
    this.phase = 'result';
    this.audio.whistle('final');
    this.audio.fail();
    this.heroMarker.visible = false;
    const info = { actions: this.ctx.actions, attemptsUsed: this.attempt };
    const rec = this.career.recordResult(this.level, { success: false, stars: 0 }, info);
    this.stats.playTime += (performance.now() - this.levelStart) / 1000;
    this.save.save();
    this.camDir.setMode('fail');
    this.ui.showResult({
      level: this.level, success: false, stars: 0, reason,
      primary: this.level.objective.map((o) => ({ text: describeObjective(o), ok: false })),
      extra: this.level.stars.map((o) => ({ text: describeObjective(o), ok: false })),
      attemptsUsed: this.attempt, maxAttempts: this.maxAttempts, actions: this.ctx.actions,
      unlocked: rec.unlocked, next: null,
    });
  }

  completeLevel(result) {
    this.phase = 'result';
    this.audio.whistle('final');
    this.audio.success();
    const info = { actions: this.ctx.actions, attemptsUsed: this.attempt, finish: this.ctx.finish };
    const rec = this.career.recordResult(this.level, result, info);
    this.stats.playTime += (performance.now() - this.levelStart) / 1000;
    this.save.save();
    this.ui.showResult({
      level: this.level, success: true, stars: result.stars,
      primary: result.primary, extra: result.extra,
      attemptsUsed: this.attempt, maxAttempts: this.maxAttempts, actions: this.ctx.actions,
      unlocked: rec.unlocked, firstClear: rec.firstClear,
      next: this.career.nextLevel(this.level.id),
    });
  }

  pause() {
    if (this.phase === 'menu' || this.phase === 'result' || this.paused) return false;
    this.paused = true;
    this.input.cancel();
    return true;
  }

  resume() { this.paused = false; }

  restartLevel() {
    if (!this.level) return;
    for (const p of [...this.attackers, ...this.defenders]) { p.override = null; p.celebrate = null; }
    this.startLevel(this.level);
  }

  // ---------------------------------------------------------------- update loop
  update(rawDt) {
    const dt = Math.min(rawDt, 1 / 20);
    if (this.paused) {
      this.camDir.update(0, this);
      this.stage.update(dt * 0.2);
      this.input.draw(0);
      return;
    }
    this.timeScale = damp(this.timeScale, this.timeTarget, 6, dt);
    const sdt = dt * this.timeScale;

    // timers run in game time
    for (const t of this.timers) t.t -= sdt;
    const due = this.timers.filter((t) => t.t <= 0);
    this.timers = this.timers.filter((t) => t.t > 0);
    due.forEach((t) => t.fn());

    if (this.phase === 'menu') {
      this._updateMenu(sdt);
    } else if (this.level) {
      this._updatePlay(sdt);
    }
    this.camDir.update(dt, this);
    this.stage.setShadowFocus(this.camDir.look.x, this.camDir.look.z);
    this.stage.update(dt);
    this.input.draw(dt);
  }

  _updatePlay(dt) {
    const ball = this.ball;
    // AI
    if (this.ai) this.ai.update(dt, this);
    if (this.keeperAI) this.keeperAI.update(dt, this);

    // players
    for (const p of this.attackers) p.update(dt);
    for (const p of this.defenders) p.update(dt);
    if (this.keeper) this.keeper.update(dt);

    // ball + outcome logic
    const prev = ball.pos.clone();
    const events = ball.update(dt, this.stage.camera);
    if (this.phase === 'flight' && this.plan) this._flightLogic(prev);
    if (events) this._handleBallEvents(events);
    if (this.phase === 'loose') this._looseLogic(dt);

    // markers
    const t = performance.now() / 1000;
    if (this.phase === 'aim' && this.holder) {
      this.holderRing.visible = true;
      this.holderRing.position.set(this.holder.pos.x, 0.03, this.holder.pos.z);
      const s = 1 + Math.sin(t * 5) * 0.08;
      this.holderRing.scale.set(s, 1, s);
    } else this.holderRing.visible = false;
    const hero = this.attackers.find((a) => a.isHero);
    if (hero && this.heroMarker.visible) {
      this.heroMarker.position.set(hero.pos.x, 2.35 + hero.cur.lift + Math.sin(t * 3) * 0.08, hero.pos.z);
      this.heroMarker.rotation.y = t * 2;
    }
    if (this.meetRing.visible) this.meetRing.rotation.y += dt;
  }

  _flightLogic(prev) {
    const ball = this.ball, plan = this.plan;
    // defenders
    if (ball.flightT > 0.06) {
      const w = this.ai.checkInterception(this, prev, ball.pos, plan);
      if (w) { this.intercepted(w); return; }
    }
    // keeper claims crosses / through balls into his area
    const rcv = plan.receiver;
    const rcvFirst = rcv && dist2(rcv.pos.x, rcv.pos.z, ball.pos.x, ball.pos.z) < dist2(this.keeper.pos.x, this.keeper.pos.z, ball.pos.x, ball.pos.z);
    if (this.keeperAI.claim && !rcvFirst && ball.pos.y < 2.7 && dist2(this.keeper.pos.x, this.keeper.pos.z, ball.pos.x, ball.pos.z) < 1.2) {
      this.keeperClaims();
      return;
    }
    // shot saves
    const dec = this.keeperAI.decision;
    if (plan.kind === 'shot' && dec && dec.save && ball.flightT >= dec.t - 0.01) {
      this.saved(dec);
      return;
    }
    // hand over to free physics right before the goal line so posts, nets and the line are simulated
    if ((plan.kind === 'shot' && ball.pos.z < GOAL.z + 0.6) || ball.pos.z < GOAL.z + 0.12) {
      const v = plan.velocityAt(ball.flightT, new THREE.Vector3());
      const spin = new THREE.Vector3(0, -Math.sign(plan.curl || 0) * Math.min(30, Math.abs(plan.curl) * 8), 0);
      ball.release(v, spin);
      this.phase = 'loose';
      this.looseT = 0; this.stillT = 0;
      this.ai.assignLooseChasers(this);
      return;
    }
    // slow motion window for first-time finishes
    if (plan.receiver && plan.kind !== 'shot' && !this.queued && this.settings.slowmo) {
      const remain = plan.duration - ball.flightT;
      const r = plan.receiver;
      const nearGoal = dist2(plan.meet.x, plan.meet.z, 0, GOAL.z) < 30;
      if (nearGoal && remain < 0.9 && remain > 0.05) {
        this.timeTarget = 0.32;
        if (!this.oneTouchHint) {
          this.oneTouchHint = true;
          this.ui.hint(`Desenhe a partir de ${r.isHero ? 'seu jogador' : r.name} para finalizar de primeira!`);
        }
      }
    }
    if (ball.flightT >= plan.duration) {
      const r = plan.receiver;
      this.ui.hint(null);
      if (r && dist2(r.pos.x, r.pos.z, ball.pos.x, ball.pos.z) < 1.9 && ball.pos.y < 2.6) {
        this.receive(r);
      } else {
        const v = plan.velocityAt(plan.duration, new THREE.Vector3());
        ball.release(v);
        this.phase = 'loose';
        this.looseT = 0; this.stillT = 0;
        this.timeTarget = 1;
        this.queued = null;
        this.meetRing.visible = false;
        this.ai.assignLooseChasers(this);
      }
    }
  }

  _handleBallEvents(events) {
    for (const ev of events) {
      if (ev.type === 'bounce') this.audio.bounce(ev.speed / 8);
      else if (ev.type === 'post') {
        this.audio.post();
        if (this.phase === 'loose') { this.audio.ooh(); this.ui.toast('NA TRAVE!', 'info'); }
        if (this.settings.shake) this.camDir.shake(0.1);
      } else if (ev.type === 'net') {
        this.stage.netImpact(ev.x, ev.y, clamp(ev.speed / 25, 0.2, 1));
        if (this.phase !== 'celebrate') this.audio.net();
      } else if (ev.type === 'goal') {
        if (this.phase === 'loose' || this.phase === 'flight') this.goal(ev);
      } else if (ev.type === 'out') {
        if (this.phase === 'loose' || this.phase === 'flight') {
          const wasShot = this.ctx.shot && this.ball.lastToucher === this.ctx.shot.shooter;
          if (wasShot) { this.audio.ooh(); this.fail('Chute para fora', ev.y > GOAL.height ? 'POR CIMA!' : 'PARA FORA!'); }
          else { this.audio.groan(); this.fail('Bola fora de jogo', 'BOLA FORA'); }
        }
      }
    }
  }

  _looseLogic(dt) {
    const ball = this.ball;
    this.looseT += dt;
    if (this.looseT % 0.3 < dt) this.ai.assignLooseChasers(this);
    if (ball.goal || ball.out) return;
    const bp = ball.pos;
    // keeper
    const k = this.keeper;
    if (bp.y < 2.4 && dist2(k.pos.x, k.pos.z, bp.x, bp.z) < 1.25 && this.looseT > 0.1 && ball.lastToucher !== k) { this.keeperClaims(); return; }
    for (const d of this.defenders) {
      if (bp.y < 1.3 && dist2(d.pos.x, d.pos.z, bp.x, bp.z) < 0.85) { this.intercepted(d, 'PERDEU A POSSE'); return; }
    }
    for (const a of this.attackers) {
      if (bp.y < 1.2 && dist2(a.pos.x, a.pos.z, bp.x, bp.z) < 0.95 && (this.looseT > 0.3 || a !== ball.lastToucher)) {
        // count a completed pass if a teammate collected it
        const passer = ball.lastToucher;
        this.plan = { from: passer };
        this.receive(a);
        return;
      }
    }
    if (ball.vel.length() < 0.5) this.stillT += dt; else this.stillT = 0;
    if (this.stillT > 2.5 || this.looseT > 7) this.fail('A jogada morreu', 'JOGADA PERDIDA');
  }

  // Exposed for automated tests / debugging
  debugState() {
    return {
      phase: this.phase, attempt: this.attempt, ctx: this.ctx && { actions: this.ctx.actions, passes: this.ctx.passes, goal: this.ctx.goal },
      ball: { x: this.ball.pos.x, y: this.ball.pos.y, z: this.ball.pos.z, mode: this.ball.mode },
      holder: this.holder ? this.attackers.indexOf(this.holder) : -1,
    };
  }
}
