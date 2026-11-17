// Procedural footballer: a hierarchical joint rig (hips > spine > shoulders/neck,
// hips > thighs > shins > feet) driven by keyframed and procedural animation.
// Includes locomotion (walk/run/sprint), kicks, headers, volleys, bicycle kicks,
// receiving, tackles, jumps, goalkeeper dives and celebrations.
import * as THREE from 'three';
import { makeCanvas, damp, dampAngle, clamp, lerp, smoothstep } from './utils.js';

// ------------------------------------------------------------------ pose model
const POSE_KEYS = [
  'lift', 'rootRX', 'rootRZ', 'hipY', 'spX', 'spY', 'spZ', 'nkX', 'nkY',
  'lsX', 'lsZ', 'leX', 'rsX', 'rsZ', 'reX', 'lhX', 'lhZ', 'lkX', 'laX', 'rhX', 'rhZ', 'rkX', 'raX',
];
const BASE = {
  lift: 0, rootRX: 0, rootRZ: 0, hipY: 0.97, spX: 0.04, spY: 0, spZ: 0, nkX: 0, nkY: 0,
  lsX: 0.05, lsZ: 0.14, leX: -0.25, rsX: 0.05, rsZ: -0.14, reX: -0.25,
  lhX: 0, lhZ: 0.03, lkX: 0.06, laX: 0, rhX: 0, rhZ: -0.03, rkX: 0.06, raX: 0,
};
const pose = (o) => ({ ...BASE, ...o });

// Keyframe animations: [time 0..1, partial pose]
const ANIMS = {
  kick: { dur: 0.52, contact: 0.5, keys: [
    [0.0, { spX: 0.1 }],
    [0.38, { rhX: 0.95, rkX: 1.7, lkX: 0.35, spX: -0.12, spY: -0.25, lsZ: 0.9, rsZ: -0.5, rsX: -0.4, hipY: 0.92 }],
    [0.5, { rhX: -0.9, rkX: 0.15, lkX: 0.3, spX: 0.12, spY: 0.15, lsZ: 1.0, rsZ: -0.7, lsX: -0.3, hipY: 0.93 }],
    [0.68, { rhX: -1.45, rkX: 0.25, raX: 0.3, lkX: 0.2, spX: 0.2, spY: 0.25, lsZ: 0.8, rsZ: -0.8, lift: 0.05 }],
    [1.0, {}],
  ] },
  pass: { dur: 0.42, contact: 0.48, keys: [
    [0.0, {}],
    [0.36, { rhX: 0.55, rhZ: -0.2, rkX: 1.1, lkX: 0.3, spX: 0.0, lsZ: 0.6, rsZ: -0.35, hipY: 0.93 }],
    [0.5, { rhX: -0.55, rhZ: 0.25, rkX: 0.2, lkX: 0.28, spX: 0.12, lsZ: 0.7, rsZ: -0.45 }],
    [0.72, { rhX: -0.8, rhZ: 0.3, rkX: 0.3, spX: 0.12, lsZ: 0.5, rsZ: -0.35 }],
    [1.0, {}],
  ] },
  header: { dur: 0.7, contact: 0.45, keys: [
    [0.0, {}],
    [0.18, { hipY: 0.82, lkX: 0.9, rkX: 0.9, lhX: -0.5, rhX: -0.5, spX: 0.3, lsX: 0.6, rsX: 0.6 }],
    [0.35, { lift: 0.45, spX: -0.35, nkX: -0.4, lsZ: 1.2, rsZ: -1.2, lsX: -0.6, rsX: -0.6, lkX: 0.6, rkX: 1.0, lhX: 0.1 }],
    [0.48, { lift: 0.52, spX: 0.45, nkX: 0.5, lsZ: 1.0, rsZ: -1.0, lkX: 0.8, rkX: 1.2, rhX: 0.3 }],
    [0.75, { lift: 0.15, spX: 0.2, lkX: 0.3, rkX: 0.4 }],
    [1.0, {}],
  ] },
  volley: { dur: 0.6, contact: 0.42, keys: [
    [0.0, {}],
    [0.25, { rhX: 0.4, rhZ: -0.6, rkX: 1.4, rootRZ: 0.25, spX: -0.1, lsZ: 1.3, rsZ: -0.8, lkX: 0.3 }],
    [0.42, { rhX: -1.5, rhZ: 0.4, rkX: 0.1, rootRZ: 0.5, spX: -0.3, spY: 0.4, lsZ: 1.5, rsZ: -1.1, lift: 0.12, lkX: 0.4 }],
    [0.65, { rhX: -1.2, rhZ: 0.5, rkX: 0.3, rootRZ: 0.3, spY: 0.5, lsZ: 1.0, rsZ: -0.9 }],
    [1.0, {}],
  ] },
  bicycle: { dur: 1.1, contact: 0.42, keys: [
    [0.0, {}],
    [0.12, { hipY: 0.84, lkX: 0.9, rkX: 0.9, lhX: -0.5, rhX: -0.4, spX: 0.2 }],
    [0.3, { lift: 0.8, rootRX: -1.2, lhX: -1.4, lkX: 0.4, rhX: -0.2, rkX: 1.4, lsZ: 1.6, rsZ: -1.6, nkX: 0.5 }],
    [0.42, { lift: 0.95, rootRX: -2.0, lhX: -0.2, lkX: 1.2, rhX: -2.3, rkX: 0.05, raX: 0.4, lsZ: 1.7, rsZ: -1.7, nkX: 0.6 }],
    [0.6, { lift: 0.6, rootRX: -2.1, lhX: -0.6, rhX: -1.6, rkX: 0.3, lsZ: 1.4, rsZ: -1.4, lsX: -0.6, rsX: -0.6 }],
    [0.8, { lift: 0.18, rootRX: -1.45, hipY: 0.5, lhX: -1.0, rhX: -1.0, lkX: 0.6, rkX: 0.6, lsX: -0.8, rsX: -0.8 }],
    [1.0, { lift: 0.0, rootRX: -0.2, hipY: 0.75, lkX: 1.0, rkX: 1.0, lhX: -0.8, rhX: -0.8, spX: 0.6 }],
  ] },
  receive: { dur: 0.36, contact: 0.3, keys: [
    [0.0, {}],
    [0.35, { rhX: -0.45, rhZ: 0.2, rkX: 0.55, raX: -0.3, lkX: 0.32, hipY: 0.92, spX: 0.18, lsZ: 0.5, rsZ: -0.4, nkX: 0.35 }],
    [1.0, { lkX: 0.15, rkX: 0.15, spX: 0.1 }],
  ] },
  tackle: { dur: 1.0, contact: 0.3, keys: [
    [0.0, {}],
    [0.2, { hipY: 0.6, lift: -0.15, rootRX: -0.5, rhX: -1.3, rkX: 0.05, lhX: -0.2, lkX: 1.5, lsX: 0.6, lsZ: 0.8, rsZ: -1.2, spX: -0.3 }],
    [0.65, { hipY: 0.45, lift: -0.25, rootRX: -0.85, rhX: -1.45, rkX: 0.05, lhX: -0.25, lkX: 1.6, lsX: 0.9, lsZ: 1.0, rsZ: -1.3, spX: -0.2 }],
    [1.0, { hipY: 0.8, lkX: 0.8, rkX: 0.6, spX: 0.4 }],
  ] },
  jump: { dur: 0.75, contact: 0.4, keys: [
    [0.0, {}],
    [0.2, { hipY: 0.82, lkX: 0.9, rkX: 0.9, lhX: -0.5, rhX: -0.5, spX: 0.3 }],
    [0.42, { lift: 0.48, lkX: 0.5, rkX: 0.5, lhX: -0.2, rhX: -0.2, lsX: -0.4, rsX: -0.4, lsZ: 0.6, rsZ: -0.6, nkX: -0.1 }],
    [0.7, { lift: 0.1, lkX: 0.4, rkX: 0.4 }],
    [1.0, {}],
  ] },
  catch: { dur: 0.5, contact: 0.3, keys: [
    [0.0, {}],
    [0.3, { lsX: -1.3, rsX: -1.3, lsZ: 0.2, rsZ: -0.2, leX: -0.6, reX: -0.6, spX: 0.35, lkX: 0.5, rkX: 0.5, hipY: 0.88 }],
    [1.0, { lsX: -0.8, rsX: -0.8, leX: -1.6, reX: -1.6, spX: 0.25 }],
  ] },
};

const POSES = {
  ready: pose({ hipY: 0.92, spX: 0.35, lhX: -0.32, rhX: -0.32, lkX: 0.62, rkX: 0.62, laX: -0.25, raX: -0.25, lhZ: 0.12, rhZ: -0.12, lsX: -0.3, rsX: -0.3, lsZ: 0.35, rsZ: -0.35, leX: -0.8, reX: -0.8, nkX: -0.25 }),
  keeper: pose({ hipY: 0.89, spX: 0.4, lhX: -0.42, rhX: -0.42, lkX: 0.8, rkX: 0.8, laX: -0.35, raX: -0.35, lhZ: 0.18, rhZ: -0.18, lsX: -0.65, rsX: -0.65, lsZ: 0.55, rsZ: -0.55, leX: -0.7, reX: -0.7, nkX: -0.35 }),
  dejected: pose({ spX: 0.35, nkX: 0.45, lsZ: 0.05, rsZ: -0.05, leX: -0.1, reX: -0.1, lkX: 0.1, rkX: 0.1 }),
  handsOnHead: pose({ spX: -0.05, nkX: -0.2, lsZ: 2.3, rsZ: -2.3, lsX: -0.6, rsX: -0.6, leX: -2.0, reX: -2.0 }),
  hold: pose({ lsX: -0.55, rsX: -0.55, leX: -1.5, reX: -1.5, lsZ: 0.25, rsZ: -0.25, spX: 0.1 }),
};

function sampleKeys(keys, t) {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [t0, a] = keys[i];
  const [t1, b] = keys[i + 1];
  const k = smoothstep(0, 1, clamp((t - t0) / Math.max(1e-4, t1 - t0), 0, 1));
  const out = {};
  for (const key of POSE_KEYS) {
    const va = a[key] !== undefined ? a[key] : BASE[key];
    const vb = b[key] !== undefined ? b[key] : BASE[key];
    out[key] = lerp(va, vb, k);
  }
  return out;
}

// ------------------------------------------------------------------ geometry cache
const GEO = {};
function geos() {
  if (GEO.ready) return GEO;
  const torsoPts = [
    [0.0, -0.06], [0.135, -0.05], [0.15, 0.04], [0.17, 0.2], [0.2, 0.36], [0.205, 0.42], [0.17, 0.5], [0.07, 0.56], [0.0, 0.565],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  GEO.torso = new THREE.LatheGeometry(torsoPts, 18);
  GEO.torso.scale(1, 1, 0.66);
  GEO.pelvis = new THREE.CapsuleGeometry(0.15, 0.06, 4, 14);
  GEO.pelvis.scale(1.12, 1, 0.8);
  GEO.neck = new THREE.CylinderGeometry(0.052, 0.058, 0.12, 10);
  GEO.head = new THREE.SphereGeometry(0.112, 20, 16);
  GEO.head.scale(0.9, 1.08, 1.0);
  GEO.hairShort = new THREE.SphereGeometry(0.12, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  GEO.hairShort.scale(0.93, 1.08, 1.04);
  GEO.hairTop = new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
  GEO.hairTop.scale(0.8, 1.15, 1.1);
  GEO.hairLong = new THREE.SphereGeometry(0.125, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.7);
  GEO.hairLong.scale(0.95, 1.12, 1.08);
  GEO.eye = new THREE.SphereGeometry(0.014, 6, 6);
  GEO.nose = new THREE.ConeGeometry(0.016, 0.04, 6);
  GEO.ear = new THREE.SphereGeometry(0.022, 6, 6);
  GEO.sleeve = new THREE.CylinderGeometry(0.066, 0.058, 0.16, 12);
  GEO.upperArm = new THREE.CapsuleGeometry(0.046, 0.2, 4, 10);
  GEO.foreArm = new THREE.CapsuleGeometry(0.041, 0.19, 4, 10);
  GEO.hand = new THREE.SphereGeometry(0.048, 10, 8);
  GEO.glove = new THREE.SphereGeometry(0.068, 10, 8);
  GEO.shortsLeg = new THREE.CylinderGeometry(0.095, 0.088, 0.22, 12);
  GEO.thigh = new THREE.CapsuleGeometry(0.07, 0.3, 4, 10);
  GEO.shin = new THREE.CapsuleGeometry(0.058, 0.32, 4, 10);
  GEO.sockBand = new THREE.CylinderGeometry(0.064, 0.064, 0.05, 10);
  GEO.boot = new THREE.CapsuleGeometry(0.045, 0.16, 4, 10);
  GEO.boot.rotateX(Math.PI / 2);
  GEO.boot.scale(1.05, 0.8, 1);
  GEO.collar = new THREE.TorusGeometry(0.068, 0.014, 6, 16);
  GEO.collar.rotateX(Math.PI / 2);
  GEO.shadow = new THREE.CircleGeometry(0.42, 20);
  GEO.shadow.rotateX(-Math.PI / 2);
  GEO.ready = true;
  return GEO;
}

let shadowTex = null;
function blobShadowTexture() {
  if (shadowTex) return shadowTex;
  const [c, g] = makeCanvas(64, 64);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)');
  gr.addColorStop(0.6, 'rgba(0,0,0,0.25)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

function numberTexture(num, fg, outline) {
  const [c, g] = makeCanvas(128, 128);
  g.clearRect(0, 0, 128, 128);
  g.font = '900 96px "Barlow Condensed", "Arial Black", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = outline; g.strokeText(String(num), 64, 70);
  g.fillStyle = fg; g.fillText(String(num), 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ------------------------------------------------------------------ Player
export class Player {
  constructor(opts) {
    this.opts = opts;
    this.name = opts.name || 'Player';
    this.number = opts.number || 7;
    this.team = opts.team; // 'att' | 'def'
    this.isKeeper = !!opts.isKeeper;
    this.isHero = !!opts.hero;
    this.root = new THREE.Group();
    this.vel = new THREE.Vector3();
    this.target = null;
    this.speed = 0;
    this.maxSpeed = 6.5;
    this.heading = 0;
    this.faceTarget = null;
    this.phase = Math.random() * 6;
    this.action = null;
    this.stance = this.isKeeper ? 'keeper' : 'idle';
    this.override = null; // static pose name (dejected...)
    this.celebrate = null;
    this.cur = { ...BASE };
    this.idleT = Math.random() * 10;
    this._build();
  }

  _mat(color, rough = 0.62) {
    return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
  }

  _build() {
    const G = geos();
    const o = this.opts;
    const kit = o.kit;
    const jersey = this._mat(kit.main, 0.7);
    const trim = this._mat(kit.trim, 0.6);
    const shorts = this._mat(kit.shorts, 0.65);
    const socks = this._mat(kit.socks || kit.main, 0.7);
    const skin = this._mat(o.skin || '#c68a5e', 0.55);
    const hair = this._mat(o.hair || '#1a1310', 0.8);
    const boots = this._mat(o.boots || '#111111', 0.35);
    const glove = this._mat(kit.glove || '#f5f5f5', 0.6);
    const dark = this._mat('#111111', 0.4);
    this.materials = { jersey, trim, shorts, socks, skin, hair, boots };

    const mk = (geo, mat, parent, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      parent.add(m);
      return m;
    };
    const group = (parent, x = 0, y = 0, z = 0) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      parent.add(g);
      return g;
    };

    const body = group(this.root); // rotated for dives/bicycles
    this.body = body;
    const hips = group(body, 0, BASE.hipY, 0);
    this.hips = hips;
    mk(G.pelvis, shorts, hips, 0, 0.0, 0);
    const spine = group(hips, 0, 0.04, 0);
    this.spine = spine;
    mk(G.torso, jersey, spine, 0, 0, 0);
    mk(G.collar, trim, spine, 0, 0.55, 0.005);
    // number on the back
    const numTex = numberTexture(this.number, kit.trim, kit.main === kit.trim ? '#000' : 'rgba(0,0,0,0.35)');
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshStandardMaterial({ map: numTex, transparent: true, roughness: 0.7 }));
    num.position.set(0, 0.32, -0.134);
    num.rotation.y = Math.PI;
    spine.add(num);
    // small front number
    const numF = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), num.material);
    numF.position.set(0.07, 0.4, 0.133);
    spine.add(numF);

    const neck = group(spine, 0, 0.58, 0);
    this.neck = neck;
    mk(G.neck, skin, neck, 0, 0.0, 0);
    const head = group(neck, 0, 0.13, 0.01);
    mk(G.head, skin, head);
    for (const s of [-1, 1]) {
      mk(G.eye, dark, head, s * 0.036, 0.015, 0.1);
      mk(G.ear, skin, head, s * 0.1, 0.0, 0);
    }
    const nose = mk(G.nose, skin, head, 0, -0.01, 0.112);
    nose.rotation.x = Math.PI / 2;
    const hs = o.hairStyle || 0;
    const tilt = (m) => { m.rotation.x = -0.55; return m; };
    if (hs === 0) tilt(mk(G.hairShort, hair, head, 0, 0.02, -0.012));
    else if (hs === 1) { tilt(mk(G.hairShort, hair, head, 0, 0.02, -0.012)); mk(G.hairTop, hair, head, 0, 0.07, 0.01); }
    else if (hs === 2) tilt(mk(G.hairLong, hair, head, 0, 0.0, -0.018));
    // hs === 3: shaved
    this.head = head;

    const arm = (side) => {
      const sh = group(spine, side * 0.215, 0.47, 0);
      mk(G.sleeve, jersey, sh, 0, -0.06, 0);
      mk(G.upperArm, skin, sh, 0, -0.15, 0);
      const el = group(sh, 0, -0.29, 0);
      mk(G.foreArm, this.isKeeper ? jersey : skin, el, 0, -0.12, 0);
      mk(this.isKeeper ? G.glove : G.hand, this.isKeeper ? glove : skin, el, 0, -0.27, 0.01);
      return [sh, el];
    };
    [this.lSh, this.lEl] = arm(1);
    [this.rSh, this.rEl] = arm(-1);

    const leg = (side) => {
      const hp = group(hips, side * 0.095, -0.02, 0);
      mk(G.shortsLeg, shorts, hp, 0, -0.08, 0);
      mk(G.thigh, skin, hp, 0, -0.2, 0);
      const kn = group(hp, 0, -0.43, 0);
      mk(G.shin, socks, kn, 0, -0.2, 0);
      mk(G.sockBand, trim, kn, 0, -0.05, 0);
      const an = group(kn, 0, -0.44, 0);
      mk(G.boot, boots, an, 0, -0.035, 0.05);
      return [hp, kn, an];
    };
    [this.lHip, this.lKnee, this.lAnk] = leg(1);
    [this.rHip, this.rKnee, this.rAnk] = leg(-1);

    // soft blob shadow (always on, complements shadow maps)
    const sh = new THREE.Mesh(G.shadow, new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false }));
    sh.position.y = 0.015;
    sh.renderOrder = 1;
    this.blob = sh;
    this.root.add(sh);
  }

  // ---------------------------------------------------------------- API
  get pos() { return this.root.position; }

  place(x, z, heading = Math.PI) {
    this.root.position.set(x, 0, z);
    this.vel.set(0, 0, 0);
    this.target = null;
    this.heading = heading;
    this.root.rotation.y = heading;
    this.action = null;
    this.override = null;
    this.celebrate = null;
    this.faceTarget = null;
  }

  moveTo(x, z, speed) {
    if (!this.target) this.target = new THREE.Vector3();
    this.target.set(x, 0, z);
    this.maxSpeed = speed;
  }

  stop() { this.target = null; }

  lookAt(x, z) { this.faceTarget = { x, z }; }

  // Face a world point instantly-ish
  faceTowards(x, z) {
    this.faceTarget = { x, z };
  }

  play(name, opts = {}) {
    const a = ANIMS[name];
    if (!a) return;
    const dur = (opts.dur || a.dur) / (opts.speed || 1);
    this.action = {
      name, t: (opts.startAt || 0) * dur, dur, contact: a.contact,
      keys: a.keys, onContact: opts.onContact, fired: false, onEnd: opts.onEnd,
    };
  }

  // Goalkeeper dive: side = -1..1 local x direction, height in metres
  dive(side, height, dur = 0.85) {
    const tilt = -Math.sign(side || 1) * clamp(1.15 + (1.2 - height) * 0.25, 0.7, 1.5);
    const armZ = Math.sign(side || 1);
    const lift = clamp(height - 0.8, 0, 0.8);
    this.action = {
      name: 'dive', t: 0, dur, contact: 0.4, fired: false,
      keys: [
        [0.0, { hipY: 0.82, lkX: 0.8, rkX: 0.8, spX: 0.3, lsX: -0.6, rsX: -0.6 }],
        [0.15, { hipY: 0.78, lkX: 1.0, rkX: 1.0, rootRZ: tilt * 0.15, spX: 0.2 }],
        [0.42, { lift, rootRZ: tilt, lsZ: armZ > 0 ? 2.9 : 0.6, rsZ: armZ > 0 ? -0.6 : -2.9, lsX: -0.2, rsX: -0.2, leX: -0.1, reX: -0.1, lhX: -0.3, rhX: -0.3, lkX: 0.3, rkX: 0.3, spZ: 0.0 }],
        [0.7, { lift: Math.max(0, lift * 0.3), rootRZ: tilt * 1.08, lsZ: armZ > 0 ? 2.6 : 0.9, rsZ: armZ > 0 ? -0.9 : -2.6, lkX: 0.5, rkX: 0.5 }],
        [1.0, { lift: -0.62, hipY: 0.97, rootRZ: tilt * 1.12, lsZ: armZ > 0 ? 2.2 : 1.0, rsZ: armZ > 0 ? -1.0 : -2.2, lkX: 0.6, rkX: 0.4 }],
      ],
      hold: true,
    };
  }

  setCelebrate(kind) {
    this.celebrate = kind;
    this.celebT = 0;
  }

  update(dt) {
    // ---- locomotion
    const p = this.root.position;
    let desiredX = 0, desiredZ = 0;
    if (this.target) {
      const dx = this.target.x - p.x, dz = this.target.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.05) {
        const sp = this.maxSpeed * clamp(d / 1.6, 0.0, 1);
        desiredX = (dx / d) * sp; desiredZ = (dz / d) * sp;
      }
    }
    const accel = this.action && this.action.name !== 'tackle' ? 6 : 9;
    this.vel.x = damp(this.vel.x, desiredX, accel, dt);
    this.vel.z = damp(this.vel.z, desiredZ, accel, dt);
    if (this.action && (this.action.name === 'dive')) { this.vel.multiplyScalar(0); }
    p.x += this.vel.x * dt;
    p.z += this.vel.z * dt;
    this.speed = Math.hypot(this.vel.x, this.vel.z);

    // ---- heading
    let wantHeading = null;
    if (this.faceTarget && !(this.speed > 2.5 && !this.action)) {
      wantHeading = Math.atan2(this.faceTarget.x - p.x, this.faceTarget.z - p.z);
    } else if (this.speed > 0.35) {
      wantHeading = Math.atan2(this.vel.x, this.vel.z);
    } else if (this.faceTarget) {
      wantHeading = Math.atan2(this.faceTarget.x - p.x, this.faceTarget.z - p.z);
    }
    if (wantHeading !== null && !(this.action && this.action.name === 'dive')) {
      this.heading = dampAngle(this.heading, wantHeading, this.action ? 9 : 10, dt);
    }
    this.root.rotation.y = this.heading;

    // ---- animation target pose
    let target;
    const s = clamp(this.speed / 7, 0, 1);
    if (this.action) {
      const a = this.action;
      a.t += dt;
      const nt = clamp(a.t / a.dur, 0, 1);
      target = sampleKeys(a.keys, nt);
      if (!a.fired && nt >= a.contact) {
        a.fired = true;
        if (a.onContact) a.onContact();
      }
      // legs keep running underneath when the action allows it (e.g. receiving on the run)
      if (nt >= 1 && !a.hold) {
        const cb = a.onEnd;
        this.action = null;
        if (cb) cb();
      }
    } else if (this.celebrate) {
      target = this._celebratePose(dt);
    } else if (this.override) {
      target = { ...POSES[this.override] };
      this.idleT += dt;
      target.spY = Math.sin(this.idleT * 0.8) * 0.05;
    } else if (this.speed > 0.4) {
      target = this._runPose(dt, s);
    } else {
      this.idleT += dt;
      const st = this.stance;
      target = { ...(st === 'keeper' ? POSES.keeper : st === 'ready' ? POSES.ready : BASE) };
      const br = Math.sin(this.idleT * 1.7) * 0.012;
      target.hipY += br * 0.5;
      target.spX += br;
      if (st === 'keeper') {
        target.lift = Math.max(0, Math.sin(this.idleT * 5.5)) * 0.02;
      } else if (st === 'idle') {
        target.spY = Math.sin(this.idleT * 0.5) * 0.08;
        target.nkY = Math.sin(this.idleT * 0.37) * 0.25;
      }
    }
    const lam = this.action ? 30 : 12;
    for (const k of POSE_KEYS) this.cur[k] = damp(this.cur[k], target[k], lam, dt);
    this._apply();
  }

  _runPose(dt, s) {
    const stride = 0.7 + 0.14 * this.speed;
    this.phase += (this.speed / stride) * Math.PI * dt;
    const ph = this.phase;
    const A = 0.35 + 0.55 * s;
    const t = { ...BASE };
    t.lhX = -A * Math.sin(ph);
    t.rhX = A * Math.sin(ph);
    t.lkX = 0.15 + (0.5 + 1.1 * s) * Math.max(0, Math.cos(ph)) ;
    t.rkX = 0.15 + (0.5 + 1.1 * s) * Math.max(0, -Math.cos(ph));
    t.laX = -0.2 * Math.sin(ph);
    t.raX = 0.2 * Math.sin(ph);
    t.lsX = A * 0.9 * Math.sin(ph);
    t.rsX = -A * 0.9 * Math.sin(ph);
    t.leX = -0.6 - 0.8 * s;
    t.reX = -0.6 - 0.8 * s;
    t.lsZ = 0.12; t.rsZ = -0.12;
    t.hipY = 0.97 - 0.05 * s + 0.045 * s * Math.abs(Math.cos(ph));
    t.spX = 0.08 + 0.22 * s;
    t.spY = 0.18 * s * Math.sin(ph);
    t.nkX = -0.1 * s;
    return t;
  }

  _celebratePose(dt) {
    this.celebT += dt;
    const k = this.celebrate;
    const c = this.celebT;
    if (k === 'airplane') {
      const t = this.speed > 0.5 ? this._runPose(dt, clamp(this.speed / 7, 0, 1)) : { ...BASE };
      t.lsZ = 1.45; t.rsZ = -1.45; t.lsX = 0; t.rsX = 0; t.leX = -0.05; t.reX = -0.05;
      t.rootRZ = Math.sin(c * 2.2) * 0.25;
      t.spY = 0;
      return t;
    }
    if (k === 'jump') {
      const ph = (c * 1.6) % 1;
      const t = { ...BASE };
      t.lift = Math.max(0, Math.sin(ph * Math.PI)) * 0.45;
      t.lkX = 0.4 + (1 - Math.sin(ph * Math.PI)) * 0.4; t.rkX = t.lkX;
      t.lhX = -0.3; t.rhX = -0.3;
      t.rsZ = -0.4; t.rsX = -2.9; t.reX = -0.2;
      t.lsZ = 0.6; t.leX = -1.4; t.lsX = -0.4;
      t.spX = -0.15; t.nkX = -0.3;
      return t;
    }
    if (k === 'kneeslide') {
      const t = { ...BASE };
      t.hipY = 0.5; t.lift = 0;
      t.lhX = 0.1; t.rhX = 0.1; t.lkX = 1.9; t.rkX = 1.9; t.laX = 0.6; t.raX = 0.6;
      t.spX = -0.45; t.nkX = -0.5;
      t.lsZ = 2.5; t.rsZ = -2.5; t.lsX = -0.3; t.rsX = -0.3; t.leX = -0.3; t.reX = -0.3;
      t.spY = Math.sin(c * 3) * 0.1;
      return t;
    }
    if (k === 'clap') {
      const t = this.speed > 0.5 ? this._runPose(dt, clamp(this.speed / 7, 0, 1)) : { ...BASE };
      const cl = Math.sin(c * 14);
      t.lsX = -1.1; t.rsX = -1.1; t.lsZ = 0.35 + cl * 0.2; t.rsZ = -0.35 - cl * 0.2; t.leX = -0.9; t.reX = -0.9;
      return t;
    }
    if (k === 'point') {
      const t = { ...BASE };
      t.rsX = -2.6; t.rsZ = -0.4; t.reX = 0;
      t.lsX = -2.6; t.lsZ = 0.4; t.leX = 0;
      t.spX = -0.25; t.nkX = -0.45;
      t.lift = Math.max(0, Math.sin(c * 6)) * 0.08;
      return t;
    }
    return { ...BASE };
  }

  _apply() {
    const c = this.cur;
    this.body.position.y = c.lift;
    this.body.rotation.set(c.rootRX, 0, c.rootRZ);
    // rotate the body around the hips so dives/bicycles pivot naturally
    if (c.rootRX !== 0 || c.rootRZ !== 0) {
      const hy = c.hipY;
      this.body.position.y += hy - Math.cos(c.rootRX) * Math.cos(c.rootRZ) * hy;
      this.body.position.z = -Math.cos(c.rootRZ) * Math.sin(c.rootRX) * hy;
      this.body.position.x = Math.sin(c.rootRZ) * hy;
    } else {
      this.body.position.x = 0; this.body.position.z = 0;
    }
    this.hips.position.y = c.hipY;
    this.spine.rotation.set(c.spX, c.spY, c.spZ);
    this.neck.rotation.set(c.nkX, c.nkY, 0);
    this.lSh.rotation.set(c.lsX, 0, c.lsZ);
    this.rSh.rotation.set(c.rsX, 0, c.rsZ);
    this.lEl.rotation.x = c.leX;
    this.rEl.rotation.x = c.reX;
    this.lHip.rotation.set(c.lhX, 0, c.lhZ);
    this.rHip.rotation.set(c.rhX, 0, c.rhZ);
    this.lKnee.rotation.x = c.lkX;
    this.rKnee.rotation.x = c.rkX;
    this.lAnk.rotation.x = c.laX;
    this.rAnk.rotation.x = c.raX;
    // blob shadow stays on the ground, shrinks when airborne
    const air = Math.max(0, c.lift);
    this.blob.scale.setScalar(clamp(1 - air * 0.6, 0.4, 1));
    this.blob.position.set(0, 0.015, 0);
  }

  // World-space position of a point in front of the right foot (where the ball sits)
  footPoint(out, dist = 0.42) {
    out.set(Math.sin(this.heading) * dist, 0, Math.cos(this.heading) * dist).add(this.root.position);
    return out;
  }

  headPoint(out) {
    out.set(0, 1.75 + this.cur.lift, 0).add(this.root.position);
    return out;
  }

  setKit(kit) {
    this.materials.jersey.color.set(kit.main);
    this.materials.trim.color.set(kit.trim);
    this.materials.shorts.color.set(kit.shorts);
    this.materials.socks.color.set(kit.socks || kit.main);
  }

  dispose() {
    this.root.traverse((o) => {
      if (o.material) {
        if (o.material.map && o.material.map !== shadowTex) o.material.map.dispose();
        o.material.dispose();
      }
    });
    if (this.root.parent) this.root.parent.remove(this.root);
  }
}
