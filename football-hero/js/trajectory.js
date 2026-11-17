// Trajectory drawing system: pointer/touch input, live 2D stroke rendering,
// stroke classification (pass / through ball / cross / shot) and conversion of the
// drawn line into a smooth, physically-plausible ball flight plan.
import * as THREE from 'three';
import { BALL_R, GOAL, PITCH, BOX } from './config.js';
import { clamp, lerp } from './utils.js';

// ------------------------------------------------------------------ flight plans
export class FlightPlan {
  constructor({ kind, curve, y0, yEnd, apex, duration, power, decel = 0.3, receiver = null, meet = null, curl = 0, target = null, dropGround = false, from = null }) {
    this.kind = kind;            // 'pass' | 'through' | 'cross' | 'shot'
    this.curve = curve;
    this.y0 = y0;
    this.yEnd = yEnd;
    this.apex = apex;
    this.duration = duration;
    this.power = power;
    this.decel = decel;
    this.receiver = receiver;
    this.meet = meet;            // Vector3 end point on the ground
    this.curl = curl;            // signed lateral bend in metres
    this.target = target;        // for shots: {x, y} on the goal plane
    this.dropGround = dropGround;
    this.from = from;
    this.length = curve.getLength();
    this._p = new THREE.Vector3();
  }

  uAt(t) {
    const tau = clamp(t / this.duration, 0, 1);
    return tau + this.decel * tau * (1 - tau);
  }

  heightAt(u) {
    if (this.dropGround) return BALL_R + (this.y0 - BALL_R) * Math.pow(1 - u, 3);
    return lerp(this.y0, this.yEnd, u) + this.apex * 4 * u * (1 - u);
  }

  sample(t, out) {
    const u = this.uAt(t);
    const p = this.curve.getPointAt(clamp(u, 0, 1), this._p);
    out.set(p.x, Math.max(BALL_R, this.heightAt(u)), p.z);
    return out;
  }

  velocityAt(t, out) {
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    const e = 0.02;
    this.sample(Math.max(0, t - e), a);
    this.sample(Math.min(this.duration, t + e), b);
    const dt = Math.min(this.duration, t + e) - Math.max(0, t - e);
    out.subVectors(b, a).divideScalar(Math.max(1e-4, dt));
    if (t >= this.duration - 1e-3) {
      // extrapolate slightly past the end using the final tangent
      const tan = this.curve.getTangentAt(1);
      const sp = Math.hypot(out.x, out.z) || (this.length / this.duration) * (1 - this.decel);
      out.x = tan.x * sp; out.z = tan.z * sp;
    }
    return out;
  }

  // Points for drawing the planned path
  points(n = 40, fromT = 0) {
    const pts = [];
    const v = new THREE.Vector3();
    for (let i = 0; i <= n; i++) {
      const t = fromT + (this.duration - fromT) * (i / n);
      pts.push(this.sample(t, v).clone());
    }
    return pts;
  }
}

function resample(points, spacing) {
  const out = [points[0].clone()];
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    let seg = a.distanceTo(b);
    let start = a.clone();
    while (acc + seg >= spacing) {
      const t = (spacing - acc) / seg;
      const p = start.clone().lerp(b, t);
      out.push(p);
      seg -= spacing - acc;
      start = p;
      acc = 0;
    }
    acc += seg;
  }
  const last = points[points.length - 1];
  if (out[out.length - 1].distanceTo(last) > spacing * 0.35) out.push(last.clone());
  else out[out.length - 1] = last.clone();
  return out;
}

function polyLength(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += pts[i - 1].distanceTo(pts[i]);
  return l;
}

const inBox = (p) => p.z < BOX.zEdge && p.z > GOAL.z && Math.abs(p.x) < BOX.halfW;

// Turn a finished stroke into a flight plan.
// ctx: { start: Vector3 (ball position at kick), startY, passer, attackers[], oneTouch }
export function planFromStroke(stroke, ctx) {
  const samples = stroke.samples;
  if (samples.length < 2) return null;
  const start = ctx.start.clone();
  start.y = 0;
  const y0 = Math.max(BALL_R, ctx.startY || BALL_R);

  // ---- shot detection: does the stroke end over the goal (behind the goal line on screen)?
  const last = samples[samples.length - 1];
  const shotSamples = samples.filter((s) => s.goal);
  const isShot = last.goal && shotSamples.length > 0 && start.z > GOAL.z + 1.5;

  if (isShot) {
    const tx = clamp(last.goal.x, -9, 9);
    const ty = clamp(last.goal.y, 0.12, 5.5);
    const target = new THREE.Vector3(tx, 0, GOAL.z);
    const chord = target.clone().sub(start);
    const len = chord.length();
    if (len < 1.5) return null;
    const dir = chord.clone().normalize();
    const nrm = new THREE.Vector3(-dir.z, 0, dir.x);
    // largest perpendicular deviation of the drawn ground path from the straight line
    let bulge = 0;
    for (const s of samples) {
      if (!s.ground || s.goal) continue;
      const rel = s.ground.clone().sub(start);
      const along = rel.dot(dir) / len;
      if (along < 0.08 || along > 0.97) continue;
      const off = rel.dot(nrm);
      // weight middle of the path more (that's where a curve is visible)
      const w = 1 - Math.abs(along - 0.5) * 0.8;
      if (Math.abs(off * w) > Math.abs(bulge)) bulge = off * w;
    }
    bulge = clamp(bulge * 0.9, -Math.min(6, len * 0.22), Math.min(6, len * 0.22));
    if (Math.abs(bulge) < 0.35) bulge = 0;
    const mid = start.clone().add(target).multiplyScalar(0.5);
    const ctrl = mid.add(nrm.clone().multiplyScalar(bulge * 2));
    const curve = new THREE.QuadraticBezierCurve3(start.clone(), ctrl, target.clone());
    const power = clamp(stroke.power, 0.3, 1);
    const header = ctx.mode === 'header';
    const avg = header ? 15 + power * 7 : 17 + power * 14;
    const L = curve.getLength();
    const arc = header ? 0.1 : clamp(len * 0.028, 0.15, 1.2) * (1.15 - power * 0.5) + (ty > 2.0 ? 0.3 : 0);
    return new FlightPlan({
      kind: 'shot', curve, y0, yEnd: ty, apex: arc, duration: L / avg, power,
      decel: 0.12, curl: bulge, target: { x: tx, y: ty }, from: ctx.passer,
    });
  }

  // ---- pass
  const ground = samples.filter((s) => s.ground && !s.goal).map((s) => s.ground.clone().setY(0));
  if (ground.length < 2) return null;
  // clip the path inside the pitch
  for (const g of ground) {
    g.x = clamp(g.x, -PITCH.halfW + 0.5, PITCH.halfW - 0.5);
    g.z = clamp(g.z, GOAL.z + 0.6, PITCH.halfL - 0.5);
  }
  // first point is the ball
  while (ground.length > 1 && ground[0].distanceTo(start) < 1.0) ground.shift();
  const raw = [start.clone(), ...ground];
  if (polyLength(raw) < 2.2) return null;
  let end = raw[raw.length - 1].clone();

  // receiver selection
  let receiver = null;
  let bestD = Infinity;
  for (const a of ctx.attackers) {
    if (a === ctx.passer) continue;
    const d = Math.hypot(a.pos.x - end.x, a.pos.z - end.z);
    if (d < bestD) { bestD = d; receiver = a; }
  }
  let kind = 'pass';
  const approxLen = polyLength(raw);
  if (receiver && bestD < 2.2) {
    // snap the end of the path onto the teammate
    const shift = new THREE.Vector3(receiver.pos.x - end.x, 0, receiver.pos.z - end.z);
    const n = raw.length;
    for (let i = 1; i < n; i++) raw[i].add(shift.clone().multiplyScalar(Math.pow(i / (n - 1), 1.5)));
    end = raw[n - 1].clone();
  } else {
    // through ball into space: whoever can get there first
    kind = 'through';
    let best = null, bestT = Infinity;
    const ballTime = approxLen / 16;
    for (const a of ctx.attackers) {
      if (a === ctx.passer) continue;
      const d = Math.hypot(a.pos.x - end.x, a.pos.z - end.z);
      const t = d / 7.2;
      if (t < bestT) { bestT = t; best = a; }
    }
    receiver = best && bestT < ballTime + 1.6 ? best : null;
  }

  const spacing = Math.max(1.2, approxLen / 10);
  const pts = resample(raw, spacing);
  if (pts.length < 2) return null;
  if (pts.length === 2) pts.splice(1, 0, pts[0].clone().lerp(pts[1], 0.5));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const L = curve.getLength();

  const startWide = Math.abs(start.x) > 14 || start.z < GOAL.z + 8;
  const isCross = inBox(end) && startWide && L > 10;
  const lofted = L >= 21 || isCross;
  const receiverInBox = receiver && inBox(end);
  // time the ball so a running receiver can meet it (through balls / leading passes)
  let minDur = 0;
  if (receiver) {
    const rd = Math.hypot(receiver.pos.x - end.x, receiver.pos.z - end.z);
    if (rd > 1.2) minDur = Math.min(2.6, rd / 7.0 + 0.15, (approxLen / 15) * 1.5);
  }
  let plan;
  if (lofted) {
    const apex = clamp(L * 0.15, 2.2, isCross ? 5.5 : 8);
    const yEnd = receiverInBox ? 1.65 : 0.55;
    const avg = clamp(12 + L * 0.2, 14, 22);
    plan = new FlightPlan({
      kind: isCross ? 'cross' : kind, curve, y0, yEnd, apex, duration: Math.max(L / avg, minDur),
      power: 0.6, decel: 0.12, receiver, meet: end, from: ctx.passer,
    });
  } else {
    const avg = clamp(10.5 + L * 0.38, 11.5, 21);
    plan = new FlightPlan({
      kind, curve, y0, yEnd: BALL_R, apex: 0, duration: Math.max(L / avg, minDur), power: 0.4, decel: minDur > L / avg ? 0.45 : 0.32,
      receiver, meet: end, dropGround: y0 > BALL_R + 0.05, from: ctx.passer,
    });
  }
  return plan;
}

// ------------------------------------------------------------------ input + drawing
export class TrajectoryInput {
  constructor(element, overlay, camera) {
    this.el = element;
    this.overlay = overlay;
    this.ctx = overlay.getContext('2d');
    this.camera = camera;
    this.ray = new THREE.Raycaster();
    this.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.goalPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -GOAL.z); // z = GOAL.z
    this.enabled = false;
    this.active = null;
    this.fading = [];
    this.guide = null;       // planned path to draw each frame
    this.canStart = () => null;
    this.onComplete = () => {};
    this.onMove = () => {};
    this.onRejected = () => {};
    this._ndc = new THREE.Vector2();
    this._v = new THREE.Vector3();
    this._bind();
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.el.clientWidth, h = this.el.clientHeight;
    this.overlay.width = Math.round(w * dpr);
    this.overlay.height = Math.round(h * dpr);
    this.overlay.style.width = w + 'px';
    this.overlay.style.height = h + 'px';
    this.dpr = dpr;
    this.w = w; this.h = h;
  }

  _bind() {
    const el = this.el;
    el.addEventListener('pointerdown', (e) => this._down(e));
    el.addEventListener('pointermove', (e) => this._move(e));
    el.addEventListener('pointerup', (e) => this._up(e));
    el.addEventListener('pointercancel', () => this.cancel());
    // stop page scroll / zoom gestures during gameplay
    el.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    el.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _xy(e) {
    const r = this.el.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  project(sx, sy) {
    this._ndc.set((sx / this.w) * 2 - 1, -(sy / this.h) * 2 + 1);
    this.ray.setFromCamera(this._ndc, this.camera);
    const g = new THREE.Vector3();
    const hitG = this.ray.ray.intersectPlane(this.ground, g);
    let goal = null;
    // shot zone: the stroke point lies over / behind the goal line
    if (!hitG || g.z < GOAL.z - 0.05) {
      const gp = new THREE.Vector3();
      if (this.ray.ray.intersectPlane(this.goalPlane, gp)) {
        if (Math.abs(gp.x) < 12 && gp.y > -0.5 && gp.y < 7) goal = { x: gp.x, y: Math.max(0, gp.y) };
      }
    }
    return { ground: hitG ? g : null, goal };
  }

  worldToScreen(v) {
    this._v.copy(v).project(this.camera);
    return [(this._v.x * 0.5 + 0.5) * this.w, (-this._v.y * 0.5 + 0.5) * this.h, this._v.z];
  }

  _down(e) {
    if (!this.enabled || this.active) return;
    const [x, y] = this._xy(e);
    const origin = this.canStart(x, y);
    if (!origin) { this.onRejected(x, y); return; }
    this.el.setPointerCapture?.(e.pointerId);
    const now = performance.now();
    this.active = {
      id: e.pointerId, origin, samples: [], screen: [[x, y, now]], power: 0.6,
    };
    const p = this.project(x, y);
    this.active.samples.push({ sx: x, sy: y, t: now, ...p });
    this.onMove(this.active);
  }

  _move(e) {
    const a = this.active;
    if (!a || e.pointerId !== a.id) return;
    const [x, y] = this._xy(e);
    const lastS = a.screen[a.screen.length - 1];
    if (Math.hypot(x - lastS[0], y - lastS[1]) < 4) return;
    const now = performance.now();
    a.screen.push([x, y, now]);
    const p = this.project(x, y);
    a.samples.push({ sx: x, sy: y, t: now, ...p });
    a.power = this._power(a);
    this.onMove(a);
  }

  _power(a) {
    // speed of the last ~140 ms of the stroke, normalised by screen size
    const s = a.screen;
    const now = s[s.length - 1][2];
    let i = s.length - 1;
    while (i > 0 && now - s[i - 1][2] < 140) i--;
    const j = Math.max(0, i - 1);
    const dt = Math.max(16, now - s[j][2]);
    const d = Math.hypot(s[s.length - 1][0] - s[j][0], s[s.length - 1][1] - s[j][1]);
    const speed = d / dt * 1000 / Math.max(320, Math.min(this.w, this.h)); // screen-heights per second
    return clamp(0.55 + speed * 0.22, 0.55, 1);
  }

  _up(e) {
    const a = this.active;
    if (!a || e.pointerId !== a.id) return;
    this.active = null;
    const s = a.screen;
    let len = 0;
    for (let i = 1; i < s.length; i++) len += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
    this.fading.push({ pts: s.map(([x, y]) => [x, y]), t: 0, shot: !!a.samples[a.samples.length - 1].goal, power: a.power });
    if (len < 24) { this.onMove(null); return; }
    this.onComplete(a);
  }

  cancel() {
    this.active = null;
    this.onMove(null);
  }

  // ---------------------------------------------------------------- rendering
  draw(dt) {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);

    // planned 3D path guide (projected)
    if (this.guide && this.guide.pts.length > 1) {
      const g = this.guide;
      g.alpha = Math.max(0, (g.alpha ?? 1) - dt * (g.fade || 0));
      const pts = g.pts.map((p) => this.worldToScreen(p)).filter((p) => p[2] < 1);
      if (pts.length > 1 && g.alpha > 0.01) {
        c.save();
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.setLineDash([2, 10]);
        c.strokeStyle = `rgba(255,255,255,${0.75 * g.alpha})`;
        c.lineWidth = 4;
        c.beginPath();
        pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.stroke();
        c.restore();
      }
    }

    // fading released strokes
    for (const f of this.fading) {
      f.t += dt;
      const a = Math.max(0, 1 - f.t / 0.45);
      this._stroke(f.pts, a, f.shot, f.power, false);
    }
    this.fading = this.fading.filter((f) => f.t < 0.45);

    // live stroke
    if (this.active) {
      const a = this.active;
      const last = a.samples[a.samples.length - 1];
      this._stroke(a.screen.map(([x, y]) => [x, y]), 1, !!last.goal, a.power, true);
      if (last.goal) this._reticle(last.sx, last.sy, a.power);
      else if (this.snapScreen) this._snapRing(this.snapScreen[0], this.snapScreen[1]);
    }
  }

  _stroke(pts, alpha, shot, power, live) {
    if (pts.length < 2 || alpha <= 0) return;
    const c = this.ctx;
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    const col = shot ? (power > 0.85 ? '255,120,60' : '255,214,64') : '255,255,255';
    // glow
    c.shadowColor = `rgba(${col},${0.9 * alpha})`;
    c.shadowBlur = 18;
    c.strokeStyle = `rgba(10,20,40,${0.35 * alpha})`;
    c.lineWidth = 11;
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.shadowBlur = 10;
    const grad = c.createLinearGradient(pts[0][0], pts[0][1], pts[pts.length - 1][0], pts[pts.length - 1][1]);
    grad.addColorStop(0, `rgba(${col},${0.35 * alpha})`);
    grad.addColorStop(1, `rgba(${col},${alpha})`);
    c.strokeStyle = grad;
    c.lineWidth = 6;
    c.stroke();
    c.restore();
    // head
    const [hx, hy] = pts[pts.length - 1];
    c.save();
    c.fillStyle = `rgba(${col},${alpha})`;
    c.beginPath(); c.arc(hx, hy, live ? 9 : 6, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  _reticle(x, y, power) {
    const c = this.ctx;
    c.save();
    c.strokeStyle = 'rgba(255,214,64,0.95)';
    c.lineWidth = 2.5;
    c.beginPath(); c.arc(x, y, 20, 0, Math.PI * 2); c.stroke();
    c.beginPath();
    c.moveTo(x - 28, y); c.lineTo(x - 12, y); c.moveTo(x + 12, y); c.lineTo(x + 28, y);
    c.moveTo(x, y - 28); c.lineTo(x, y - 12); c.moveTo(x, y + 12); c.lineTo(x, y + 28);
    c.stroke();
    // power arc
    c.strokeStyle = power > 0.85 ? '#ff7a3c' : '#2ee6a6';
    c.lineWidth = 5;
    c.beginPath(); c.arc(x, y, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * power); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.font = '700 11px Inter, system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText('FORÇA ' + Math.round(power * 100), x, y + 48);
    c.restore();
  }

  _snapRing(x, y) {
    const c = this.ctx;
    c.save();
    c.strokeStyle = 'rgba(46,230,166,0.95)';
    c.lineWidth = 3;
    c.beginPath(); c.arc(x, y, 22, 0, Math.PI * 2); c.stroke();
    c.restore();
  }
}
