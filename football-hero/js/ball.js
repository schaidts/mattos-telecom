// The match ball: procedural textured mesh, possession / scripted-flight / free-physics
// modes and a camera-facing motion trail for fast balls.
import * as THREE from 'three';
import { BALL_R } from './config.js';
import { makeCanvas } from './utils.js';
import { stepFreeBall } from './physics.js';

function ballTexture() {
  const [c, g] = makeCanvas(512, 256);
  g.fillStyle = '#f7f7f4';
  g.fillRect(0, 0, 512, 256);
  // original "orbit" design: curved swooshes in navy and green
  const swoosh = (y0, color, w, phase) => {
    g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round';
    g.beginPath();
    for (let x = -20; x <= 532; x += 8) {
      const y = y0 + Math.sin((x / 512) * Math.PI * 4 + phase) * 34;
      if (x === -20) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  };
  swoosh(80, '#0b1f3a', 18, 0);
  swoosh(176, '#0b1f3a', 18, Math.PI);
  swoosh(80, '#2ee6a6', 6, 0.4);
  swoosh(176, '#2ee6a6', 6, Math.PI + 0.4);
  // panel seams
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    g.beginPath();
    const x = i * 64;
    g.moveTo(x, 0); g.bezierCurveTo(x + 30, 80, x - 30, 176, x, 256);
    g.stroke();
  }
  for (const y of [64, 128, 192]) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke();
  }
  // emblem
  g.fillStyle = '#ffd400';
  g.beginPath(); g.arc(256, 128, 16, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const TRAIL_N = 26;

export class Ball {
  constructor(scene) {
    this.scene = scene;
    const geo = new THREE.SphereGeometry(BALL_R, 32, 20);
    const mat = new THREE.MeshStandardMaterial({ map: ballTexture(), roughness: 0.42, metalness: 0.0 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    // fake contact shadow
    const [c, g] = makeCanvas(64, 64);
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 16).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
    );
    scene.add(this.shadow);

    // trail
    const tgeo = new THREE.BufferGeometry();
    this.trailPos = new Float32Array(TRAIL_N * 2 * 3);
    const alpha = new Float32Array(TRAIL_N * 2);
    for (let i = 0; i < TRAIL_N; i++) { alpha[i * 2] = alpha[i * 2 + 1] = 1 - i / (TRAIL_N - 1); }
    tgeo.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3));
    tgeo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
    const idx = [];
    for (let i = 0; i < TRAIL_N - 1; i++) {
      const a = i * 2, b = a + 1, c2 = a + 2, d = a + 3;
      idx.push(a, b, c2, b, d, c2);
    }
    tgeo.setIndex(idx);
    this.trailMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color(0xfff2b0) }, uOpacity: { value: 0 } },
      vertexShader: 'attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
      fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; varying float vA; void main(){ gl_FragColor = vec4(uColor, vA*vA*uOpacity); }',
    });
    this.trail = new THREE.Mesh(tgeo, this.trailMat);
    this.trail.frustumCulled = false;
    scene.add(this.trail);
    this.history = [];

    this.pos = this.mesh.position;
    this.vel = new THREE.Vector3();
    this.spin = new THREE.Vector3(); // angular velocity (rad/s) for Magnus effect
    this.mode = 'dead';
    this.owner = null;
    this.flight = null;
    this.flightT = 0;
    this.prev = new THREE.Vector3();
    this.lastToucher = null;
    this.goal = false;
    this.out = false;
    this.trailOn = false;
    this._tmp = new THREE.Vector3();
    this._axis = new THREE.Vector3();
  }

  reset(x, z) {
    this.pos.set(x, BALL_R, z);
    this.vel.set(0, 0, 0);
    this.spin.set(0, 0, 0);
    this.mode = 'dead';
    this.owner = null;
    this.flight = null;
    this.goal = false;
    this.out = false;
    this.inGoal = false;
    this.history.length = 0;
    this.trailOn = false;
    this.prev.copy(this.pos);
  }

  hold(player) {
    this.mode = 'held';
    this.owner = player;
    this.flight = null;
    this.vel.set(0, 0, 0);
    this.lastToucher = player;
  }

  startFlight(plan) {
    this.mode = 'flight';
    this.flight = plan;
    this.flightT = 0;
    this.owner = null;
    this.trailOn = plan.kind === 'shot' || plan.power > 0.75;
    this.history.length = 0;
  }

  release(vel, spin) {
    this.mode = 'free';
    this.flight = null;
    this.owner = null;
    this.vel.copy(vel);
    if (spin) this.spin.copy(spin); else this.spin.set(0, 0, 0);
  }

  carry(keeper) {
    this.mode = 'carried';
    this.owner = keeper;
    this.trailOn = false;
  }

  // Returns physics events from this step (bounce, post, net, goal, out)
  update(dt, camera) {
    this.prev.copy(this.pos);
    let events = null;
    if (this.mode === 'held' && this.owner) {
      const o = this.owner;
      o.footPoint(this._tmp, 0.38 + Math.min(0.25, o.speed * 0.04));
      this.pos.x += (this._tmp.x - this.pos.x) * Math.min(1, dt * 18);
      this.pos.z += (this._tmp.z - this.pos.z) * Math.min(1, dt * 18);
      this.pos.y = BALL_R + (o.speed > 1 ? Math.abs(Math.sin(o.phase)) * 0.05 : 0);
      this.vel.set((this.pos.x - this.prev.x) / dt, 0, (this.pos.z - this.prev.z) / dt);
    } else if (this.mode === 'carried' && this.owner) {
      const o = this.owner;
      this._tmp.set(0, 1.15 + o.cur.lift, 0.32);
      this._tmp.applyAxisAngle(new THREE.Vector3(0, 1, 0), o.heading);
      this.pos.copy(o.pos).add(this._tmp);
      this.vel.set(0, 0, 0);
    } else if (this.mode === 'flight' && this.flight) {
      this.flightT += dt;
      this.flight.sample(Math.min(this.flightT, this.flight.duration), this.pos);
      this.vel.subVectors(this.pos, this.prev).divideScalar(Math.max(dt, 1e-4));
    } else if (this.mode === 'free') {
      events = stepFreeBall(this, dt);
    }

    // rolling / spinning visual
    const mv = this._tmp.subVectors(this.pos, this.prev);
    const dist = Math.hypot(mv.x, mv.z);
    if (dist > 1e-5) {
      this._axis.set(mv.z, 0, -mv.x).normalize();
      const extra = this.mode === 'flight' ? 1.6 : 1;
      this.mesh.rotateOnWorldAxis(this._axis, (dist / BALL_R) * extra);
    }
    this.shadow.position.set(this.pos.x, 0.012, this.pos.z);
    const h = Math.max(0, this.pos.y - BALL_R);
    this.shadow.scale.setScalar(1 + h * 0.25);
    this.shadow.material.opacity = Math.max(0.15, 1 - h * 0.18);

    this._updateTrail(dt, camera);
    return events;
  }

  _updateTrail(dt, camera) {
    const speed = this.vel.length();
    const target = this.trailOn && speed > 9 ? Math.min(0.85, (speed - 9) / 14) : 0;
    this.trailMat.uniforms.uOpacity.value += (target - this.trailMat.uniforms.uOpacity.value) * Math.min(1, dt * 10);
    this.history.unshift(this.pos.clone());
    if (this.history.length > TRAIL_N) this.history.length = TRAIL_N;
    if (this.trailMat.uniforms.uOpacity.value < 0.01 || !camera) { this.trail.visible = false; return; }
    this.trail.visible = true;
    const camPos = camera.position;
    const tmpDir = new THREE.Vector3(), toCam = new THREE.Vector3(), side = new THREE.Vector3();
    for (let i = 0; i < TRAIL_N; i++) {
      const p = this.history[Math.min(i, this.history.length - 1)];
      const q = this.history[Math.min(i + 1, this.history.length - 1)];
      tmpDir.subVectors(p, q);
      if (tmpDir.lengthSq() < 1e-8) tmpDir.set(0, 0, 1);
      toCam.subVectors(camPos, p);
      side.crossVectors(tmpDir, toCam).normalize().multiplyScalar(BALL_R * 0.9 * (1 - i / TRAIL_N));
      this.trailPos.set([p.x + side.x, p.y + side.y, p.z + side.z, p.x - side.x, p.y - side.y, p.z - side.z], i * 6);
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
  }
}
