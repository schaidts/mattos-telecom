// Goalkeeper brain: angle-bisecting positioning, cross claiming, shot reading,
// save probability from reach / reaction time, and dive / catch / parry execution.
import { GOAL, BALL_R } from './config.js';
import { clamp, lerp, damp } from './utils.js';

export class GoalkeeperAI {
  constructor(keeper, params) {
    this.k = keeper;
    this.p = { reaction: 0.3, diveSpeed: 5.6, skill: 0.8, ...params };
    this.decision = null;
    this.diveFrom = null;
    this.claim = null;
  }

  idealPosition(bx, bz) {
    const gx = 0, gz = GOAL.z;
    const dx = bx - gx, dz = bz - gz;
    const d = Math.max(0.01, Math.hypot(dx, dz));
    const off = clamp(1.0 + (40 - Math.min(40, d)) * 0.045, 0.9, 2.6);
    let x = gx + (dx / d) * off;
    let z = gz + (dz / d) * off;
    x = clamp(x, -GOAL.halfWidth + 0.5, GOAL.halfWidth - 0.5);
    z = Math.max(z, GOAL.z + 0.6);
    return { x, z };
  }

  snapTo(bx, bz) {
    const p = this.idealPosition(bx, bz);
    this.k.place(p.x, p.z, 0);
    this.k.lookAt(bx, bz);
    this.k.stance = 'keeper';
    this.decision = null;
    this.claim = null;
  }

  // Called when any kick happens. Returns the decision object for shots.
  onKick(plan, ctx) {
    this.decision = null;
    this.claim = null;
    if (plan.kind === 'shot') return this._readShot(plan, ctx);
    // crosses / passes into the six-yard area: try to claim
    const m = plan.meet;
    if (m && m.z < GOAL.z + 5.2 && Math.abs(m.x) < 8.5) {
      const d = Math.hypot(m.x - this.k.pos.x, m.z - this.k.pos.z);
      const need = this.p.reaction + 0.15 + d / 5.0;
      if (need < plan.duration - 0.2 && Math.random() < this.p.skill) {
        this.claim = { x: m.x, z: m.z, t: plan.duration };
      }
    }
    return null;
  }

  _readShot(plan, ctx) {
    const k = this.k;
    // find when the ball passes the keeper's depth
    let tk = plan.duration, cross = null;
    const v = { x: 0, y: 0, z: 0 };
    const tmp = { set(x, y, z) { v.x = x; v.y = y; v.z = z; return this; } };
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = (plan.duration * i) / steps;
      plan.sample(t, tmp);
      if (v.z <= k.pos.z) { tk = t; cross = { x: v.x, y: v.y }; break; }
    }
    if (!cross) {
      plan.sample(plan.duration, tmp);
      cross = { x: v.x, y: v.y };
    }
    const tx = plan.target.x, ty = plan.target.y;
    const onTarget = Math.abs(tx) < GOAL.halfWidth + 0.05 && ty < GOAL.height + 0.05;
    const reaction = this.p.reaction + (ctx.oneTouch ? 0.12 : 0) + Math.min(0.12, Math.abs(plan.curl) * 0.03) + (ctx.screened ? 0.08 : 0);
    const dx = cross.x - k.pos.x;
    const height = cross.y;
    const avail = Math.max(0, tk - reaction);
    // dive covers ground after the reaction delay (with some acceleration loss) plus arm reach
    let reach = 0.8 + this.p.diveSpeed * avail * 0.85;
    if (height > 1.75) reach -= (height - 1.75) * 0.9;
    const vert = height > 2.35 ? 9 : 0; // above his reach
    const margin = reach - Math.abs(dx) - vert;
    const avgSpeed = plan.length / plan.duration;
    let p = clamp(0.55 + margin * 0.4, 0.04, 0.95);
    if (avgSpeed > 27) p -= 0.1;
    if (Math.abs(tx) > GOAL.halfWidth - 1.3 && ty > 1.6) p -= 0.1; // top corner
    if (Math.abs(dx) < 0.7 && height < 1.9) p = Math.max(p, 0.9); // straight at him
    p = Math.max(0.02, p * this.p.skill);
    const save = onTarget && Math.random() < p;
    const side = Math.abs(dx) < 0.55 ? 0 : Math.sign(dx);
    this.decision = {
      save, onTarget, t: tk, x: cross.x, y: height, side, p,
      catch: save && avgSpeed < 22 && Math.abs(dx) < 1.6 && height < 1.9,
      reaction,
      started: false,
    };
    return this.decision;
  }

  update(dt, world) {
    const k = this.k;
    const ball = world.ball;
    if (world.phase === 'aim') return;
    if (this.diveFrom) {
      const f = this.diveFrom;
      f.t += dt;
      const u = clamp(f.t / f.dur, 0, 1);
      const e = 1 - Math.pow(1 - u, 2);
      k.pos.x = lerp(f.x, f.tx, e);
      if (k.action && k.action.name === 'dive') return;
    }
    if (world.phase === 'flight' && world.plan && world.plan.kind === 'shot' && this.decision) {
      const d = this.decision;
      const t = ball.flightT;
      if (!d.started && t >= d.reaction && d.onTarget) {
        d.started = true;
        const remain = Math.max(0.15, d.t - t);
        if (d.side === 0 || d.catch && Math.abs(d.x - k.pos.x) < 0.8) {
          k.play('catch');
          k.moveTo(d.x, k.pos.z, 4);
        } else {
          // dive: reach the ball (save) or fall slightly short (beaten)
          const short = d.save ? 0 : Math.sign(d.x - k.pos.x) * (0.45 + Math.random() * 0.5);
          const tx = d.x - short - Math.sign(d.x - k.pos.x) * 0.75;
          this.diveFrom = { x: k.pos.x, tx, t: 0, dur: Math.max(0.25, remain * 1.05) };
          k.dive(d.side, d.y, Math.max(0.65, remain + 0.45));
        }
      } else if (!d.started && !d.onTarget && t >= d.reaction) {
        d.started = true;
        k.moveTo(clamp(d.x, -2.5, 2.5), k.pos.z, 2.5);
      }
      return;
    }
    if (world.phase === 'flight' || world.phase === 'loose') {
      if (this.claim) {
        k.moveTo(this.claim.x, this.claim.z, 5.5);
        return;
      }
      // keep angle relative to the ball / predicted meet point
      let bx = ball.pos.x, bz = ball.pos.z;
      if (world.plan && world.plan.meet && world.phase === 'flight') {
        const u = clamp(ball.flightT / world.plan.duration, 0, 1);
        bx = lerp(bx, world.plan.meet.x, 0.5 + u * 0.5);
        bz = lerp(bz, world.plan.meet.z, 0.5 + u * 0.5);
      }
      const ip = this.idealPosition(bx, bz);
      k.moveTo(ip.x, ip.z, 4.2);
      k.lookAt(ball.pos.x, ball.pos.z);
      // loose ball close to the keeper -> smother it
      if (world.phase === 'loose' && ball.pos.y < 1.8 && Math.hypot(ball.pos.x - k.pos.x, ball.pos.z - k.pos.z) < 3.5) {
        k.moveTo(ball.pos.x, ball.pos.z, 5.5);
      }
      return;
    }
    if (world.phase === 'dead') k.stop();
  }

  // Hands world point (approx) for contact checks during dives
  reachCheck(ball) {
    const k = this.k;
    const dx = ball.pos.x - k.pos.x, dz = ball.pos.z - k.pos.z;
    return Math.hypot(dx, dz) < 1.0 && ball.pos.y < 2.6 + BALL_R;
  }

  resetDive() { this.diveFrom = null; }
}
