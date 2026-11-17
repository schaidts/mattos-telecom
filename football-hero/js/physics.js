// Free-ball rigid body simulation: gravity, drag, Magnus curl, ground bounce and
// rolling friction, goal-frame collisions (posts / crossbar), net capture and
// goal / out-of-play detection.
import { BALL_R, GRAVITY, PHYS, GOAL, PITCH } from './config.js';

const _cross = { x: 0, y: 0, z: 0 };

function collideCylinder(ball, ax, ay, az, axis, half, radius, events) {
  // axis: 'y' vertical post, 'x' crossbar
  const p = ball.pos, v = ball.vel;
  let dx, dy, dz;
  if (axis === 'y') {
    if (p.y > ay + half + BALL_R) return;
    dx = p.x - ax; dy = 0; dz = p.z - az;
  } else {
    if (Math.abs(p.x - ax) > half) return;
    dx = 0; dy = p.y - ay; dz = p.z - az;
  }
  const d = Math.hypot(dx, dy, dz);
  const min = radius + BALL_R;
  if (d >= min || d < 1e-6) return;
  const nx = dx / d, ny = dy / d, nz = dz / d;
  // push out
  p.x += nx * (min - d); p.y += ny * (min - d); p.z += nz * (min - d);
  const vn = v.x * nx + v.y * ny + v.z * nz;
  if (vn < 0) {
    const e = 0.62;
    v.x -= (1 + e) * vn * nx; v.y -= (1 + e) * vn * ny; v.z -= (1 + e) * vn * nz;
    if (Math.abs(vn) > 2) events.push({ type: 'post', speed: Math.abs(vn) });
    ball.spin.multiplyScalar(0.3);
  }
}

export function stepFreeBall(ball, dt) {
  const events = [];
  const sub = Math.max(1, Math.ceil(ball.vel.length() * dt / 0.12));
  const h = dt / sub;
  const p = ball.pos, v = ball.vel;
  for (let i = 0; i < sub; i++) {
    const px = p.x, py = p.y, pz = p.z;
    const onGround = p.y <= BALL_R + 0.005 && Math.abs(v.y) < 0.6;
    if (!onGround) {
      v.y -= GRAVITY * h;
      // Magnus: a = k * (w x v)
      const s = ball.spin;
      _cross.x = s.y * v.z - s.z * v.y;
      _cross.y = s.z * v.x - s.x * v.z;
      _cross.z = s.x * v.y - s.y * v.x;
      const k = 0.0045;
      v.x += _cross.x * k * h; v.y += _cross.y * k * h; v.z += _cross.z * k * h;
      const drag = 1 - PHYS.airDrag * h;
      v.x *= drag; v.y *= drag; v.z *= drag;
      ball.spin.multiplyScalar(1 - 0.4 * h);
    } else {
      // rolling friction
      p.y = BALL_R; v.y = 0;
      const sp = Math.hypot(v.x, v.z);
      if (sp > 0) {
        const ns = Math.max(0, sp - PHYS.rollingDecel * h);
        v.x *= ns / sp; v.z *= ns / sp;
      }
      ball.spin.multiplyScalar(1 - 2 * h);
    }
    p.x += v.x * h; p.y += v.y * h; p.z += v.z * h;

    if (p.y < BALL_R) {
      p.y = BALL_R;
      if (v.y < -0.8) {
        events.push({ type: 'bounce', speed: -v.y });
        v.y = -v.y * PHYS.restitution;
        v.x *= 0.86; v.z *= 0.86;
      } else v.y = 0;
    }

    // ---- goal frame collisions (attacked goal)
    if (p.z < GOAL.z + 1.5 && p.z > GOAL.z - GOAL.depth - 0.5) {
      for (const s of [-1, 1]) collideCylinder(ball, s * GOAL.halfWidth, 0, GOAL.z, 'y', GOAL.height, GOAL.postR, events);
      collideCylinder(ball, 0, GOAL.height, GOAL.z, 'x', GOAL.halfWidth + GOAL.postR, GOAL.postR, events);
    }

    // ---- goal line crossing
    if (!ball.goal && !ball.out && pz >= GOAL.z - BALL_R && p.z < GOAL.z - BALL_R) {
      // interpolate crossing point
      const t = (pz - (GOAL.z - BALL_R)) / Math.max(1e-6, pz - p.z);
      const cx = px + (p.x - px) * t, cy = py + (p.y - py) * t;
      if (Math.abs(cx) < GOAL.halfWidth - BALL_R * 0.3 && cy < GOAL.height - BALL_R * 0.3) {
        ball.goal = true;
        ball.inGoal = true;
        events.push({ type: 'goal', x: cx, y: cy, speed: Math.hypot(v.x, v.y, v.z) });
      } else {
        ball.out = true;
        events.push({ type: 'out', where: 'byline', x: cx, y: cy });
      }
    }

    // ---- net capture
    if (ball.inGoal) {
      const backZ = GOAL.z - GOAL.depth + BALL_R;
      if (p.z < backZ) {
        p.z = backZ;
        if (v.z < -1) events.push({ type: 'net', x: p.x, y: p.y, speed: -v.z });
        v.z = -v.z * PHYS.netDamp; v.x *= 0.5; v.y *= 0.6;
      }
      const sw = GOAL.halfWidth - BALL_R;
      if (Math.abs(p.x) > sw) { p.x = Math.sign(p.x) * sw; v.x = -v.x * 0.2; v.z *= 0.7; }
      const top = GOAL.height - BALL_R;
      if (p.y > top) { p.y = top; v.y = -Math.abs(v.y) * 0.2; }
      if (p.z > GOAL.z - BALL_R) { p.z = GOAL.z - BALL_R; v.z = -Math.abs(v.z) * 0.3; }
    }

    // ---- touchlines / other byline
    if (!ball.out && !ball.goal) {
      if (Math.abs(p.x) > PITCH.halfW + BALL_R) { ball.out = true; events.push({ type: 'out', where: 'touchline' }); }
      else if (p.z > PITCH.halfL + BALL_R) { ball.out = true; events.push({ type: 'out', where: 'byline' }); }
    }
    // keep ball inside the stadium bowl
    if (Math.abs(p.x) > 37.5) { p.x = Math.sign(p.x) * 37.5; v.x *= -0.3; }
    if (p.z < -56.3 && !ball.inGoal) { p.z = -56.3; v.z *= -0.3; }
    if (p.z > 56.3) { p.z = 56.3; v.z *= -0.3; }
  }
  return events;
}
