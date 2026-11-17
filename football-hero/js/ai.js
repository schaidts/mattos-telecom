// Outfield AI: defenders (marking, zonal shifting, lane blocking, interception
// planning, slides / headers, walls that jump) and attacking teammates
// (support runs into space, meeting passes, give-and-go, chasing loose balls).
import { GOAL, BOX, PITCH } from './config.js';
import { clamp, dist2, pointSegDist2D } from './utils.js';

export class TeamAI {
  constructor(params) {
    // params from level difficulty
    this.p = { defSpeed: 5.4, reaction: 0.4, skill: 0.8, attSpeed: 6.8, ...params };
    this.chasers = new Set();
    this.rolled = new Set();
    this.plan = null;
  }

  // ---------------------------------------------------------------- kick events
  onKick(plan, world) {
    this.plan = plan;
    this.rolled = new Set();
    this.chasers = new Map();
    const defs = world.defenders.filter((d) => d.ai.role !== 'wall');
    const cands = [];
    for (const d of defs) {
      const res = this.interceptPoint(d, plan, 0);
      if (res) cands.push({ d, ...res });
    }
    cands.sort((a, b) => a.t - b.t);
    cands.slice(0, plan.kind === 'shot' ? 1 : 2).forEach((c) => this.chasers.set(c.d, c));
    // if nobody can make it, the closest defender to the path still tries
    if (this.chasers.size === 0 && plan.kind !== 'shot') {
      let best = null, bd = 12;
      const pts = plan.points(16);
      for (const d of defs) {
        for (const p of pts) {
          const dd = dist2(d.pos.x, d.pos.z, p.x, p.z);
          if (dd < bd && p.y < 2.2) { bd = dd; best = { d, x: p.x, z: p.z, t: plan.duration }; }
        }
      }
      if (best) this.chasers.set(best.d, best);
    }
    // walls jump on shots
    if (plan.kind === 'shot') {
      for (const d of world.defenders) {
        if (d.ai.role === 'wall') {
          setTimeout(() => d.play('jump'), 60 + Math.random() * 90);
          d.ai.jumping = true;
        }
      }
    }

    // ---- teammates
    for (const a of world.attackers) {
      a.ai.runTarget = null;
      if (a === plan.from) {
        // give-and-go: passer drifts forward
        if (plan.kind !== 'shot') {
          const t = this.supportSpot(a, world, 4.5);
          a.ai.runTarget = t;
          a.ai.runDelay = 0.35;
        }
        continue;
      }
      if (a === plan.receiver) continue;
      if (a.ai.run && !a.ai.runUsed) {
        a.ai.runTarget = { x: a.ai.run.x, z: a.ai.run.z };
        a.ai.runUsed = true;
      } else {
        a.ai.runTarget = this.supportSpot(a, world, 6);
      }
      a.ai.runDelay = 0.1 + Math.random() * 0.25;
    }
  }

  // Earliest point on the flight a defender can reach before the ball.
  interceptPoint(d, plan, fromT) {
    const speed = this.p.defSpeed * (d.ai.speedMul || 1);
    const step = 0.04;
    const v = { x: 0, y: 0, z: 0 };
    const tmp = { set(x, y, z) { v.x = x; v.y = y; v.z = z; return this; } };
    for (let t = fromT + step; t <= plan.duration; t += step) {
      plan.sample(t, tmp);
      if (v.y > 2.2) continue;
      if (v.z < GOAL.z + 0.3) break;
      const reach = v.y < 0.9 ? 0.75 : 0.45;
      const dd = Math.max(0, dist2(d.pos.x, d.pos.z, v.x, v.z) - reach);
      const need = this.p.reaction + dd / speed;
      if (need <= t - fromT) return { x: v.x, z: v.z, t };
    }
    return null;
  }

  // Find an open support position for a teammate
  supportSpot(a, world, runLen) {
    const goalX = clamp(a.pos.x * 0.55, -14, 14);
    const goalZ = BOX.zEdge + 6;
    let dx = goalX - a.pos.x, dz = goalZ - a.pos.z;
    const l = Math.hypot(dx, dz) || 1;
    if (a.pos.z < BOX.zEdge + 8) { dx = -a.pos.x * 0.3; dz = -4; }
    const baseX = a.pos.x + (dx / l) * runLen;
    const baseZ = a.pos.z + (dz / l) * runLen;
    let best = { x: baseX, z: baseZ }, bestS = -Infinity;
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const r = i === 0 ? 0 : 3.5;
      const x = clamp(baseX + Math.cos(ang) * r, -PITCH.halfW + 2, PITCH.halfW - 2);
      const z = clamp(baseZ + Math.sin(ang) * r, GOAL.z + 5, PITCH.halfL - 2);
      let minD = 20;
      for (const d of world.defenders) minD = Math.min(minD, dist2(x, z, d.pos.x, d.pos.z));
      for (const o of world.attackers) if (o !== a) minD = Math.min(minD, dist2(x, z, o.pos.x, o.pos.z) * 1.4);
      const goalD = dist2(x, z, 0, GOAL.z);
      const s = Math.min(minD, 7) * 1.0 - goalD * 0.06;
      if (s > bestS) { bestS = s; best = { x, z }; }
    }
    return best;
  }

  // ---------------------------------------------------------------- per frame
  update(dt, world) {
    const { phase, ball } = world;
    if (phase !== 'flight' && phase !== 'loose') {
      if (phase === 'aim' || phase === 'intro' || phase === 'settle') {
        for (const d of world.defenders) {
          d.stop();
          d.lookAt(ball.pos.x, ball.pos.z);
          d.stance = 'ready';
        }
        for (const a of world.attackers) {
          if (a.celebrate) continue;
          a.stop();
          if (a !== world.holder) a.lookAt(ball.pos.x, ball.pos.z);
        }
      }
      return;
    }
    const t = ball.mode === 'flight' ? ball.flightT : 0;

    // ---- defenders
    for (const d of world.defenders) {
      const ai = d.ai;
      d.stance = 'ready';
      if (ai.role === 'wall') { d.stop(); d.lookAt(ball.pos.x, ball.pos.z); continue; }
      if (ai.down > 0) { ai.down -= dt; d.stop(); continue; }
      const sp = this.p.defSpeed * (ai.speedMul || 1);
      if (phase === 'loose') {
        // nearest two chase the ball
        const ds = dist2(d.pos.x, d.pos.z, ball.pos.x, ball.pos.z);
        if (ai.looseChaser) { d.moveTo(ball.pos.x, ball.pos.z, sp); continue; }
        if (ds < 8) { d.moveTo(ball.pos.x, ball.pos.z, sp * 0.9); continue; }
      }
      const ch = this.chasers && this.chasers.get ? this.chasers.get(d) : null;
      if (ch && phase === 'flight' && t > this.p.reaction * 0.6) {
        d.moveTo(ch.x, ch.z, sp);
        d.lookAt(ball.pos.x, ball.pos.z);
        // react to the ball when it gets close: slide or jump
        const bd = dist2(d.pos.x, d.pos.z, ball.pos.x, ball.pos.z);
        if (!d.action && bd < 2.6 && !ai.lunged) {
          ai.lunged = true;
          if (ball.pos.y < 0.8) d.play('tackle');
          else if (ball.pos.y < 2.4) d.play('header');
        }
        continue;
      }
      // marking / zonal
      let tx, tz;
      if (ai.mark != null && world.attackers[ai.mark]) {
        const m = world.attackers[ai.mark];
        const gx = 0 - m.pos.x, gz = GOAL.z - m.pos.z;
        const gl = Math.hypot(gx, gz) || 1;
        const bx = ball.pos.x - m.pos.x, bz = ball.pos.z - m.pos.z;
        const bl = Math.hypot(bx, bz) || 1;
        tx = m.pos.x + (gx / gl) * 1.7 + (bx / bl) * 0.35;
        tz = m.pos.z + (gz / gl) * 1.7 + (bz / bl) * 0.35;
      } else {
        tx = ai.home.x + (ball.pos.x - ai.home.x) * 0.25;
        tz = ai.home.z + (ball.pos.z - ai.home.z) * 0.15;
      }
      d.moveTo(tx, tz, sp * 0.82);
      d.lookAt(ball.pos.x, ball.pos.z);
    }

    // ---- attackers
    for (const a of world.attackers) {
      if (a.celebrate) continue;
      const ai = a.ai;
      if (phase === 'flight' && world.plan && a === world.plan.receiver) {
        const m = world.plan.meet;
        const remain = Math.max(0.05, world.plan.duration - t);
        const d = dist2(a.pos.x, a.pos.z, m.x, m.z);
        const need = Math.min(this.p.attSpeed * 1.12, Math.max(2.5, d / remain + 0.5));
        a.moveTo(m.x, m.z, need);
        if (d < 1.2) a.lookAt(ball.pos.x, ball.pos.z);
        continue;
      }
      if (phase === 'loose') {
        if (ai.looseChaser) { a.moveTo(ball.pos.x, ball.pos.z, this.p.attSpeed); continue; }
      }
      if (ai.runTarget) {
        if (ai.runDelay > 0) { ai.runDelay -= dt; continue; }
        a.moveTo(ai.runTarget.x, ai.runTarget.z, this.p.attSpeed * 0.9);
      } else {
        a.stop();
        a.lookAt(ball.pos.x, ball.pos.z);
      }
    }
  }

  assignLooseChasers(world) {
    const ball = world.ball;
    const near = (list) => {
      let best = null, bd = Infinity;
      for (const p of list) {
        if (p.ai && p.ai.role === 'wall') continue;
        const d = dist2(p.pos.x, p.pos.z, ball.pos.x, ball.pos.z);
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    };
    for (const p of [...world.attackers, ...world.defenders]) if (p.ai) p.ai.looseChaser = false;
    const a = near(world.attackers); if (a) a.ai.looseChaser = true;
    const d = near(world.defenders); if (d) d.ai.looseChaser = true;
  }

  // Interception test for one ball movement segment. Returns the defender who won it.
  checkInterception(world, from, to, plan) {
    const speed = world.ball.vel.length();
    for (const d of world.defenders) {
      if (this.rolled.has(d)) continue;
      const ai = d.ai;
      const y = to.y;
      const sliding = d.action && d.action.name === 'tackle';
      const jumping = d.action && (d.action.name === 'jump' || d.action.name === 'header');
      let reach, maxH;
      if (ai.role === 'wall') { reach = 0.42; maxH = jumping ? 2.3 : 1.9; }
      else if (y < 0.9) { reach = sliding ? 1.15 : 0.75; maxH = 0.95; }
      else { reach = 0.5; maxH = jumping ? 2.45 : 2.0; }
      if (y > maxH) continue;
      const { d: dd } = pointSegDist2D(d.pos.x, d.pos.z, from.x, from.z, to.x, to.z);
      if (dd > reach) continue;
      this.rolled.add(d);
      let p;
      if (ai.role === 'wall') p = 0.93;
      else {
        const speedF = clamp(1.3 - speed / 28, 0.45, 1);
        p = this.p.skill * speedF * (plan && plan.kind === 'shot' ? 0.75 : 1);
        if (plan && plan.kind === 'shot') {
          // defenders right next to a first-time finish rarely get a block in
          const sd = plan.curve.getPointAt(0);
          if (Math.hypot(d.pos.x - sd.x, d.pos.z - sd.z) < 2.6) p *= plan.oneTouch ? 0.35 : 0.6;
        }
        if (y >= 0.9 && ai.role !== 'wall') p *= 0.75; // aerial duels are closer contests
        if (dd < reach * 0.5) p = Math.min(0.98, p + 0.15);
        // the intended receiver arriving first wins most contested balls
        const r = plan && plan.receiver;
        if (r) {
          const rd = Math.hypot(r.pos.x - to.x, r.pos.z - to.z);
          const ddef = Math.hypot(d.pos.x - to.x, d.pos.z - to.z);
          if (rd < 1.6 && rd < ddef) p *= 0.3;
          // contested arrival at the meeting point: a fair duel, not an automatic win
          const remain = plan.duration - world.ball.flightT;
          if (plan.meet && remain < 0.3 && Math.hypot(r.pos.x - plan.meet.x, r.pos.z - plan.meet.z) < 2.2) p = Math.min(p, this.p.skill * 0.4);
        }
      }
      if (Math.random() < p) return d;
      // missed attempt: stumble briefly
      ai.down = 0.6;
    }
    return null;
  }
}
