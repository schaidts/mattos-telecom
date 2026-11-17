// Camera director: elevated broadcast-style framing while aiming, smooth ball
// following, low dramatic shot cam, cinematic goal sequence and menu orbits.
import * as THREE from 'three';
import { GOAL } from './config.js';
import { clamp, damp, lerp } from './utils.js';

export class CameraDirector {
  constructor(camera) {
    this.cam = camera;
    this.mode = 'menu';
    this.pos = camera.position.clone();
    this.look = new THREE.Vector3(0, 0, -30);
    this.wantPos = new THREE.Vector3();
    this.wantLook = new THREE.Vector3();
    this.t = 0;
    this.shakeAmp = 0;
    this.opts = {};
    this.portrait = false;
  }

  setMode(mode, opts = {}) {
    this.mode = mode;
    this.opts = opts;
    this.t = 0;
    if (opts.cut) this._snap = true;
  }

  shake(a) { this.shakeAmp = Math.max(this.shakeAmp, a); }

  // Frame a ground point H and the goal.
  frameAim(hx, hz, out, outLook, extra = 0) {
    const gx = 0, gz = GOAL.z;
    let vx = hx - gx, vz = hz - gz;
    let d = Math.hypot(vx, vz);
    if (d < 0.1) { vx = 0; vz = 1; d = 1; }
    const nx = vx / d, nz = vz / d;
    const pf = this.portrait ? 1.55 : 1.0;
    const back = (8.5 + Math.min(d, 45) * 0.3 + extra) * pf;
    const height = (8 + Math.min(d, 45) * 0.3 + extra * 0.7) * pf;
    const lookK = clamp(0.38 + (this.portrait ? 0.06 : 0), 0, 1);
    outLook.set(lerp(hx, gx, lookK), 0, lerp(hz, gz, lookK));
    // bias the camera slightly toward the pitch centre line for a more natural angle
    out.set(hx + nx * back - nx * 0 + (-hx) * 0.06, height, hz + nz * back);
    out.z = Math.min(out.z, 48);
    out.x = clamp(out.x, -44, 44);
  }

  update(dt, world) {
    this.t += dt;
    this.portrait = this.cam.aspect < 0.95;
    const targetFov = this.portrait ? 58 : 45;
    if (Math.abs(this.cam.fov - targetFov) > 0.01) {
      this.cam.fov = damp(this.cam.fov, targetFov, 4, dt);
      this.cam.updateProjectionMatrix();
    }
    let lam = 3;
    const wp = this.wantPos, wl = this.wantLook;
    const o = this.opts;
    switch (this.mode) {
      case 'menu': {
        const c = o.center || new THREE.Vector3(0, 0, -30);
        const a = this.t * 0.06 + 0.6;
        const r = this.portrait ? 9.5 : 7.5;
        wp.set(c.x + Math.sin(a) * r, 2.4 + Math.sin(this.t * 0.2) * 0.3, c.z + Math.cos(a) * r);
        wl.set(c.x + (this.portrait ? 0 : Math.cos(a) * 1.6), 1.1, c.z - (this.portrait ? 0 : Math.sin(a) * 1.6));
        lam = 2;
        break;
      }
      case 'myplayer': {
        const c = o.center;
        const a = (o.angle || 0) + Math.sin(this.t * 0.3) * 0.15;
        const r = this.portrait ? 5.2 : 3.6;
        wp.set(c.x + Math.sin(a) * r, 1.45, c.z + Math.cos(a) * r);
        wl.set(c.x - (this.portrait ? 0 : Math.cos(a) * 0.9), 1.0, c.z + (this.portrait ? 0 : Math.sin(a) * 0.9));
        lam = 4;
        break;
      }
      case 'intro': {
        // sweeping fly-in to the aim framing
        const h = o.holder;
        this.frameAim(h.x, h.z, wp, wl);
        const k = clamp(this.t / 2.2, 0, 1);
        const e = 1 - Math.pow(1 - k, 3);
        const start = new THREE.Vector3(h.x * 0.3 + 25, 32, h.z + 26);
        wp.lerpVectors(start, wp, e);
        const startLook = new THREE.Vector3(0, 0, GOAL.z + 10);
        wl.lerpVectors(startLook, wl, e);
        lam = 8;
        break;
      }
      case 'aim': {
        const h = o.holder;
        this.frameAim(h.pos.x, h.pos.z, wp, wl);
        lam = 2.6;
        break;
      }
      case 'follow': {
        const b = world.ball.pos;
        let fx = b.x, fz = b.z;
        if (world.plan && world.plan.meet) {
          const u = clamp(world.ball.flightT / world.plan.duration, 0, 1);
          fx = lerp(b.x, world.plan.meet.x, 0.35 * (1 - u));
          fz = lerp(b.z, world.plan.meet.z, 0.35 * (1 - u));
        }
        this.frameAim(fx, fz, wp, wl, 1.5);
        lam = 2.4;
        break;
      }
      case 'shot': {
        const b = world.ball.pos;
        const from = o.from;
        const dx = from.x, dz = from.z;
        const gx = 0, gz = GOAL.z;
        const vx = dx - gx, vz = dz - gz;
        const d = Math.max(1, Math.hypot(vx, vz));
        const k = clamp((b.z - GOAL.z) / Math.max(1, dz - GOAL.z), 0, 1);
        const back = 6 + 8 * k;
        wp.set(b.x * 0.6 + (vx / d) * back, 3.2 + 4 * k, b.z + (vz / d) * back);
        wl.set(lerp(o.target.x, b.x, 0.4), 1.0, lerp(GOAL.z, b.z, 0.35));
        lam = 3.2;
        break;
      }
      case 'goal': {
        const side = o.side || 1;
        if (this.t < 1.7) {
          wp.set(side * 8.5, 2.2, GOAL.z + 7.5);
          wl.set(o.x || 0, 1.0, GOAL.z - 0.8);
          lam = this.t < 0.05 ? 50 : 3;
        } else {
          const s = o.scorer ? o.scorer.pos : new THREE.Vector3();
          const a = (this.t - 1.7) * 0.45 + (o.orbit0 || 0);
          wp.set(s.x + Math.sin(a) * 5.2, 2.0, s.z + Math.cos(a) * 5.2);
          wl.set(s.x, 1.2, s.z);
          lam = this.t < 1.75 ? 50 : 3.5;
        }
        break;
      }
      case 'replay': {
        const b = world.ball.pos;
        wp.set(b.x + 5, 2.4, b.z + 6);
        wl.copy(b);
        lam = 5;
        break;
      }
      case 'fail': {
        // hold and drift up a bit
        wp.copy(this.pos).add(new THREE.Vector3(0, dt * 1.2, dt * 1.5));
        wl.copy(this.look);
        lam = 2;
        break;
      }
      default: break;
    }
    if (this._snap) {
      this.pos.copy(wp); this.look.copy(wl); this._snap = false;
    } else {
      const k = 1 - Math.exp(-lam * dt);
      this.pos.lerp(wp, k);
      this.look.lerp(wl, k);
    }
    this.cam.position.copy(this.pos);
    if (this.shakeAmp > 0.001) {
      this.cam.position.x += (Math.random() - 0.5) * this.shakeAmp;
      this.cam.position.y += (Math.random() - 0.5) * this.shakeAmp;
      this.shakeAmp *= Math.exp(-dt * 6);
    }
    this.cam.lookAt(this.look);
  }
}
