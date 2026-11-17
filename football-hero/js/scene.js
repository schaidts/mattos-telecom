// Stadium environment: renderer, lights, pitch, lines, goals with dynamic nets,
// stands, an animated instanced crowd, floodlights and LED advertising boards.
// Everything is generated procedurally (no external assets required).
import * as THREE from 'three';
import { PITCH, GOAL, BOX, QUALITY } from './config.js';
import { makeCanvas, rng, clamp } from './utils.js';

export class Stage {
  constructor(container, qualityName) {
    this.container = container;
    this.qualityName = qualityName;
    this.q = QUALITY[qualityName];
    this.time = 0;
    this.excite = 0;
    this.exciteTarget = 0;

    const r = new THREE.WebGLRenderer({ antialias: this.q.antialias, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.q.pixelRatio));
    r.setSize(container.clientWidth, container.clientHeight);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = !!this.q.shadows;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(r.domElement);
    r.domElement.id = 'game-canvas';
    this.renderer = r;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a1530, 140, 330);
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 700);
    this.camera.position.set(0, 25, 30);

    this.maxAniso = r.capabilities.getMaxAnisotropy();

    this._buildSky();
    this._buildLights();
    this._buildPitch();
    this._buildLines();
    this.goalA = this._buildGoal(GOAL.z, -1, true);
    this.goalB = this._buildGoal(-GOAL.z, 1, false);
    this._buildBoards();
    this._buildStands();
    this._buildCrowd();
    this._buildFloodlights();
    this._buildCornerFlags();
  }

  setQuality(name) {
    this.qualityName = name;
    this.q = QUALITY[name];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.q.pixelRatio));
    this.renderer.shadowMap.enabled = !!this.q.shadows;
    this.sun.castShadow = !!this.q.shadows;
    if (this.q.shadows) {
      this.sun.shadow.mapSize.set(this.q.shadowSize, this.q.shadowSize);
      if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    }
    this.scene.traverse((o) => { if (o.material && o.material.needsUpdate !== undefined) o.material.needsUpdate = true; });
    const n = Math.floor(this.crowdTotal * this.q.crowd);
    this.crowdBodies.count = n;
    this.crowdHeads.count = n;
    this.resize();
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- sky
  _buildSky() {
    const geo = new THREE.SphereGeometry(500, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {},
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `varying vec3 vP;
        float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
        void main(){
          float h = clamp(vP.y*0.5+0.5, 0.0, 1.0);
          vec3 top = vec3(0.012,0.025,0.07);
          vec3 mid = vec3(0.04,0.07,0.17);
          vec3 hor = vec3(0.16,0.17,0.30);
          vec3 c = mix(hor, mid, smoothstep(0.48,0.6,h));
          c = mix(c, top, smoothstep(0.6,1.0,h));
          float s = step(0.9985, hash(floor(vP*380.0))) * smoothstep(0.62,0.8,h);
          c += vec3(s)*0.7;
          gl_FragColor = vec4(c,1.0);
        }`,
    });
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.renderOrder = -10;
    this.scene.add(this.sky);
  }

  // ---------------------------------------------------------------- lights
  _buildLights() {
    const hemi = new THREE.HemisphereLight(0xb8c8ff, 0x1d3a1d, 0.85);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.3);
    sun.position.set(28, 60, 22);
    sun.castShadow = !!this.q.shadows;
    const s = this.q.shadowSize || 1024;
    sun.shadow.mapSize.set(s, s);
    const cam = sun.shadow.camera;
    cam.left = -32; cam.right = 32; cam.top = 32; cam.bottom = -32; cam.near = 10; cam.far = 140;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sun = sun;
    const fill = new THREE.DirectionalLight(0xbcd2ff, 0.75);
    fill.position.set(-30, 45, -40);
    this.scene.add(fill);
    const fill2 = new THREE.DirectionalLight(0xffe6c4, 0.4);
    fill2.position.set(-20, 30, 50);
    this.scene.add(fill2);
  }

  setShadowFocus(x, z) {
    this.sun.position.set(x + 28, 60, z + 22);
    this.sun.target.position.set(x, 0, z);
  }

  // ---------------------------------------------------------------- pitch
  _grassTexture() {
    const [c, g] = makeCanvas(512, 1024);
    const R = rng(7);
    // two mowing stripes per tile
    const stripe = (y0, base) => {
      g.fillStyle = base;
      g.fillRect(0, y0, 512, 512);
      for (let i = 0; i < 26000; i++) {
        const x = R() * 512, y = y0 + R() * 512;
        const l = R();
        g.fillStyle = l > 0.5 ? `rgba(255,255,220,${0.04 + R() * 0.05})` : `rgba(0,30,0,${0.05 + R() * 0.07})`;
        g.fillRect(x, y, 1 + R() * 1.5, 2 + R() * 4);
      }
    };
    stripe(0, '#3f8f3a');
    stripe(512, '#367f33');
    // soft wear patches
    for (let i = 0; i < 40; i++) {
      const x = R() * 512, y = R() * 1024, rad = 20 + R() * 60;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(${R() > 0.5 ? '90,120,40' : '20,60,20'},0.08)`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = this.maxAniso;
    return t;
  }

  _buildPitch() {
    const W = 92, L = 130;
    const tex = this._grassTexture();
    const stripeW = PITCH.length / 18; // 18 stripes over the pitch
    tex.repeat.set(W / 9, L / (stripeW * 2));
    tex.offset.set(0, ((L - PITCH.length) / 2) / (stripeW * 2) % 1);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0 });
    const geo = new THREE.PlaneGeometry(W, L);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.receiveShadow = true;
    this.scene.add(m);
    this.pitch = m;
    // outer ring / track area
    const ring = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 190).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x1d3f22, roughness: 1 }),
    );
    ring.position.y = -0.02;
    ring.receiveShadow = true;
    this.scene.add(ring);
  }

  _buildLines() {
    const pos = [];
    const y = 0.012, w = 0.12;
    const seg = (ax, az, bx, bz, width = w) => {
      const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1;
      const nx = (-dz / l) * width / 2, nz = (dx / l) * width / 2;
      pos.push(ax + nx, y, az + nz, bx + nx, y, bz + nz, bx - nx, y, bz - nz);
      pos.push(ax + nx, y, az + nz, bx - nx, y, bz - nz, ax - nx, y, az - nz);
    };
    const rect = (x1, z1, x2, z2) => {
      seg(x1, z1, x2, z1); seg(x2, z1, x2, z2); seg(x2, z2, x1, z2); seg(x1, z2, x1, z1);
    };
    const arc = (cx, cz, r, a0, a1, n = 48) => {
      for (let i = 0; i < n; i++) {
        const t0 = a0 + (a1 - a0) * (i / n), t1 = a0 + (a1 - a0) * ((i + 1) / n);
        seg(cx + Math.cos(t0) * r, cz + Math.sin(t0) * r, cx + Math.cos(t1) * r, cz + Math.sin(t1) * r);
      }
    };
    const disc = (cx, cz, r) => {
      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2;
        pos.push(cx, y, cz, cx + Math.cos(a1) * r, y, cz + Math.sin(a1) * r, cx + Math.cos(a0) * r, y, cz + Math.sin(a0) * r);
      }
    };
    const hw = PITCH.halfW, hl = PITCH.halfL;
    rect(-hw, -hl, hw, hl);
    seg(-hw, 0, hw, 0);
    arc(0, 0, 9.15, 0, Math.PI * 2, 72);
    disc(0, 0, 0.2);
    for (const s of [-1, 1]) {
      const gz = s * hl;
      rect(-BOX.halfW, gz, BOX.halfW, gz - s * 16.5);
      rect(-BOX.sixHalfW, gz, BOX.sixHalfW, gz - s * 5.5);
      disc(0, gz - s * 11, 0.18);
      // penalty arc (outside the box only)
      const a = Math.acos(5.5 / 9.15);
      if (s < 0) arc(0, gz + 11, 9.15, Math.PI / 2 - a, Math.PI / 2 + a, 24);
      else arc(0, gz - 11, 9.15, -Math.PI / 2 - a, -Math.PI / 2 + a, 24);
      // corner arcs
      arc(-hw, gz, 1, s < 0 ? 0 : -Math.PI / 2, s < 0 ? Math.PI / 2 : 0, 10);
      arc(hw, gz, 1, s < 0 ? Math.PI / 2 : Math.PI, s < 0 ? Math.PI : Math.PI * 1.5, 10);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf4f7f2, roughness: 0.8, transparent: true, opacity: 0.92,
      polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  // ---------------------------------------------------------------- goals
  _netTexture() {
    const [c, g] = makeCanvas(128, 128);
    g.clearRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.lineWidth = 3;
    // diamond / hex-like mesh
    for (let i = -128; i <= 256; i += 32) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
      g.beginPath(); g.moveTo(i, 128); g.lineTo(i + 128, 0); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }

  _buildGoal(zLine, dir, isTarget) {
    const g = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1 });
    const r = GOAL.postR, hw = GOAL.halfWidth, h = GOAL.height, d = GOAL.depth;
    const postGeo = new THREE.CylinderGeometry(r, r, h, 16);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(postGeo, postMat);
      p.position.set(s * hw, h / 2, zLine);
      p.castShadow = true;
      g.add(p);
      // back supports
      const bp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, h, 8), postMat);
      bp.position.set(s * hw, h / 2, zLine + dir * d);
      g.add(bp);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, d, 8), postMat);
      top.rotation.x = Math.PI / 2;
      top.position.set(s * hw, h, zLine + dir * d / 2);
      g.add(top);
      const low = top.clone(); low.position.y = 0.03; g.add(low);
    }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hw * 2 + r * 2, 16), postMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, h, zLine);
    bar.castShadow = true;
    g.add(bar);
    const backBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, hw * 2, 8), postMat);
    backBar.rotation.z = Math.PI / 2;
    backBar.position.set(0, h, zLine + dir * d);
    g.add(backBar);

    const tex = this._netTexture();
    const netMat = (rx, ry) => {
      const t = tex.clone();
      t.needsUpdate = true;
      t.repeat.set(rx, ry);
      return new THREE.MeshStandardMaterial({
        map: t, alphaMap: t, transparent: true, alphaTest: 0.25, side: THREE.DoubleSide,
        color: 0xffffff, roughness: 0.6, depthWrite: false,
      });
    };
    const backGeo = new THREE.PlaneGeometry(hw * 2, h, 28, 12);
    const back = new THREE.Mesh(backGeo, netMat(hw * 2 / 0.45, h / 0.45));
    back.position.set(0, h / 2, zLine + dir * d);
    g.add(back);
    const topNet = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, d), netMat(hw * 2 / 0.45, d / 0.45));
    topNet.rotation.x = Math.PI / 2;
    topNet.position.set(0, h, zLine + dir * d / 2);
    g.add(topNet);
    for (const s of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(d, h), netMat(d / 0.45, h / 0.45));
      side.rotation.y = Math.PI / 2;
      side.position.set(s * hw, h / 2, zLine + dir * d / 2);
      g.add(side);
    }
    this.scene.add(g);
    const goal = {
      group: g, back, dir, zLine,
      basePos: Float32Array.from(backGeo.attributes.position.array),
      bulge: 0, bx: 0, by: 1,
    };
    return goal;
  }

  netImpact(x, y, strength = 1) {
    const g = this.goalA;
    g.bulge = Math.min(0.9, 0.35 + strength * 0.5);
    g.bx = x; g.by = y - GOAL.height / 2;
    g.bulgeT = 0;
  }

  _updateNet(goal, dt) {
    if (goal.bulge <= 0.001 && !goal.dirty) return;
    goal.bulgeT = (goal.bulgeT || 0) + dt;
    const amp = goal.bulge * Math.exp(-goal.bulgeT * 2.2) * Math.cos(goal.bulgeT * 9) ;
    const arr = goal.back.geometry.attributes.position.array;
    const base = goal.basePos;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i], y = base[i + 1];
      const dd = (x - goal.bx) ** 2 + (y - goal.by) ** 2;
      // edges are tied to the frame
      const edge = clamp((GOAL.halfWidth - Math.abs(x)) / 0.6, 0, 1) * clamp((GOAL.height / 2 - Math.abs(y)) / 0.5, 0, 1);
      arr[i + 2] = base[i + 2] + goal.dir * Math.max(0, amp) * Math.exp(-dd / 1.1) * edge;
    }
    goal.back.geometry.attributes.position.needsUpdate = true;
    if (goal.bulgeT > 3) { goal.bulge = 0; goal.dirty = false; arr.set(base); goal.back.geometry.attributes.position.needsUpdate = true; }
    else goal.dirty = true;
  }

  // ---------------------------------------------------------------- boards
  _boardTexture() {
    const [c, g] = makeCanvas(2048, 64);
    const ads = [
      ['CRAQUE', '#0b1f3a', '#2ee6a6'],
      ['NOVA SPORTS', '#e8f0ff', '#1e4fd8'],
      ['VOLTA ENERGY', '#111', '#ffd400'],
      ['JOGO LIMPO', '#ffffff', '#0f9d58'],
      ['ORBIT TELECOM', '#fff', '#c62828'],
      ['CHUTE+ CHUTEIRAS', '#0b1f3a', '#ffffff'],
    ];
    const w = 2048 / ads.length;
    ads.forEach(([txt, fg, bg], i) => {
      g.fillStyle = bg; g.fillRect(i * w, 0, w, 64);
      g.fillStyle = 'rgba(255,255,255,0.08)';
      for (let x = 0; x < w; x += 6) g.fillRect(i * w + x, 0, 2, 64);
      g.fillStyle = fg;
      g.font = 'italic 900 40px "Barlow Condensed", Arial Black, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(txt, i * w + w / 2, 34);
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }

  _buildBoards() {
    this.boardTex = this._boardTexture();
    const mat = new THREE.MeshStandardMaterial({
      map: this.boardTex, emissive: 0xffffff, emissiveMap: this.boardTex, emissiveIntensity: 0.75, roughness: 0.5,
    });
    const frame = new THREE.MeshStandardMaterial({ color: 0x0b0f1a, roughness: 0.8 });
    const H = 0.9;
    const add = (len, x, z, rotY) => {
      const g = new THREE.Group();
      const geo = new THREE.PlaneGeometry(len, H);
      const tex = this.boardTex;
      const m = mat.clone();
      m.map = tex; m.emissiveMap = tex;
      const face = new THREE.Mesh(geo, m);
      // repeat along length using UVs
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * len / 30);
      face.position.y = H / 2 + 0.05;
      g.add(face);
      const box = new THREE.Mesh(new THREE.BoxGeometry(len, H + 0.1, 0.25), frame);
      box.position.set(0, (H + 0.1) / 2, -0.14);
      g.add(box);
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      this.scene.add(g);
    };
    add(104, -38.5, 0, Math.PI / 2);
    add(104, 38.5, 0, -Math.PI / 2);
    add(30, -21, -57, 0);
    add(30, 21, -57, 0);
    add(30, -21, 57, Math.PI);
    add(30, 21, 57, Math.PI);
  }

  // ---------------------------------------------------------------- stands
  _buildStands() {
    const rows = 24, step = 0.8, rise = 0.48, front = 1.6;
    this.standRows = { rows, step, rise, front };
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, front);
    let u = 0, v = front;
    for (let i = 0; i < rows; i++) {
      u += step; shape.lineTo(u, v);
      v += rise; shape.lineTo(u, v);
    }
    shape.lineTo(u + 1.2, v + 3.5);
    shape.lineTo(u + 1.2, 0);
    shape.lineTo(0, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a2236, roughness: 0.9 });
    const makeSide = (len, x, z, rotY) => {
      const geo = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
      geo.translate(0, 0, -len / 2);
      const m = new THREE.Mesh(geo, mat);
      // shape u axis -> outward. Rotate so outward points away from pitch
      m.rotation.y = rotY;
      m.position.set(x, 0, z);
      m.receiveShadow = false;
      this.scene.add(m);
    };
    // long sides (x = +-41 outward)
    makeSide(170, 41, 0, 0);
    makeSide(170, -41, 0, Math.PI);
    // ends (z = +-61)
    makeSide(82, 0, -61, Math.PI / 2);
    makeSide(82, 0, 61, -Math.PI / 2);

    // roofs with emissive light strips
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0c1220, roughness: 0.7, side: THREE.DoubleSide });
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xeaf2ff });
    const topY = front + rows * rise + 7;
    const depth = rows * step + 4;
    const roof = (w, l, x, z, rotY) => {
      const g = new THREE.Group();
      const r = new THREE.Mesh(new THREE.BoxGeometry(depth, 0.5, l), roofMat);
      r.position.set(depth / 2 - 2, 0, 0);
      g.add(r);
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, l), stripMat);
      s.position.set(-2, -0.35, 0);
      g.add(s);
      g.position.set(x, topY, z);
      g.rotation.y = rotY;
      this.scene.add(g);
    };
    roof(0, 170, 41, 0, 0);
    roof(0, 170, -41, 0, Math.PI);
    roof(0, 82, 0, -61, Math.PI / 2);
    roof(0, 82, 0, 61, -Math.PI / 2);
  }

  _buildCrowd() {
    const { rows, step, rise, front } = this.standRows;
    const R = rng(42);
    const seats = [];
    const addSide = (len, ox, oz, rotY) => {
      const cos = Math.cos(rotY), sin = Math.sin(rotY);
      for (let r = 0; r < rows; r++) {
        const u = (r + 0.55) * step, v = front + r * rise; // floor of row r
        for (let s = -len / 2 + 0.4; s < len / 2 - 0.4; s += 0.62) {
          if (R() < 0.12) continue; // empty seat
          const lx = u, lz = s + (R() - 0.5) * 0.12;
          // rotate local (u outward, s along) into world
          const x = ox + lx * cos + lz * sin;
          const z = oz - lx * sin + lz * cos;
          seats.push([x, v, z, rotY]);
        }
      }
    };
    addSide(166, 41, 0, 0);
    addSide(166, -41, 0, Math.PI);
    addSide(80, 0, -61, Math.PI / 2);
    addSide(80, 0, 61, -Math.PI / 2);
    // shuffle so reducing count for low quality removes seats evenly
    for (let i = seats.length - 1; i > 0; i--) {
      const j = Math.floor(R() * (i + 1));
      [seats[i], seats[j]] = [seats[j], seats[i]];
    }
    this.crowdTotal = seats.length;
    this.crowdSeats = seats;

    const bodyGeo = new THREE.BoxGeometry(0.44, 0.62, 0.3);
    bodyGeo.translate(0, 0.31, 0);
    const headGeo = new THREE.IcosahedronGeometry(0.13, 1);
    headGeo.translate(0, 0.78, 0);
    this.crowdUniforms = { uTime: { value: 0 }, uExcite: { value: 0 } };
    const patch = (mat) => {
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = this.crowdUniforms.uTime;
        sh.uniforms.uExcite = this.crowdUniforms.uExcite;
        sh.vertexShader = 'uniform float uTime; uniform float uExcite;\n' + sh.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float sd = fract(sin(float(gl_InstanceID) * 12.9898) * 43758.5453);
           float sd2 = fract(sd * 91.73);
           float idle = sin(uTime * (1.2 + sd * 1.6) + sd * 40.0) * 0.035;
           float jump = max(0.0, sin(uTime * (7.0 + sd2 * 4.0) + sd * 30.0)) * 0.42 * uExcite * step(0.25, sd2);
           transformed.y += idle + jump;
           transformed.x += sin(uTime * 0.8 + sd * 20.0) * 0.03;`,
        );
      };
      return mat;
    };
    const bodyMat = patch(new THREE.MeshLambertMaterial({ color: 0xffffff }));
    const headMat = patch(new THREE.MeshLambertMaterial({ color: 0xffffff }));
    const n = seats.length;
    const bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, n);
    const heads = new THREE.InstancedMesh(headGeo, headMat, n);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const skins = ['#f1c9a5', '#e0ac82', '#c68a5e', '#9c6644', '#6f4630'].map((c) => new THREE.Color(c));
    seats.forEach(([x, y, z, rotY], i) => {
      q.setFromAxisAngle(up, rotY + Math.PI / 2 + (R() - 0.5) * 0.4);
      const sc = 0.9 + R() * 0.2;
      m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sc, sc, sc));
      bodies.setMatrixAt(i, m);
      heads.setMatrixAt(i, m);
      heads.setColorAt(i, skins[Math.floor(R() * skins.length)]);
    });
    bodies.frustumCulled = false;
    heads.frustumCulled = false;
    this.scene.add(bodies, heads);
    this.crowdBodies = bodies;
    this.crowdHeads = heads;
    this.crowdRand = seats.map(() => R());
    this.setCrowdColors('#0f9d58', '#c62828');
    const cnt = Math.floor(n * this.q.crowd);
    bodies.count = cnt; heads.count = cnt;
  }

  setCrowdColors(home, away) {
    const cols = [
      [new THREE.Color(home), 0.42],
      [new THREE.Color('#f2f2f2'), 0.16],
      [new THREE.Color('#1c2230'), 0.14],
      [new THREE.Color(away), 0.14],
      [new THREE.Color(home).multiplyScalar(0.6), 0.08],
      [new THREE.Color('#5a6478'), 0.06],
    ];
    const pick = (r) => {
      let acc = 0;
      for (const [c, w] of cols) { acc += w; if (r <= acc) return c; }
      return cols[0][0];
    };
    for (let i = 0; i < this.crowdTotal; i++) this.crowdBodies.setColorAt(i, pick(this.crowdRand[i]));
    this.crowdBodies.instanceColor.needsUpdate = true;
  }

  // ---------------------------------------------------------------- floodlights
  _glowTexture() {
    const [c, g] = makeCanvas(128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.15, 'rgba(255,250,235,0.8)');
    gr.addColorStop(0.45, 'rgba(200,220,255,0.18)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    return t;
  }

  _buildFloodlights() {
    const glow = this._glowTexture();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a3142, roughness: 0.6, metalness: 0.5 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfffbea });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * 62, z = sz * 80;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.0, 44, 10), poleMat);
      pole.position.set(x, 22, z);
      this.scene.add(pole);
      const head = new THREE.Group();
      const panel = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 0.6), poleMat);
      head.add(panel);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
        const l = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.8), lampMat);
        l.position.set(-3.6 + i * 2.4, -1.15 + j * 2.3, 0.31);
        head.add(l);
      }
      head.position.set(x, 45, z);
      head.lookAt(0, 0, 0);
      this.scene.add(head);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow, color: 0xfff6dd, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
      }));
      spr.scale.set(34, 34, 1);
      spr.position.copy(head.position).multiplyScalar(0.985);
      this.scene.add(spr);
    }
  }

  _buildCornerFlags() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
    const flagMat = new THREE.MeshStandardMaterial({ color: 0xffd400, side: THREE.DoubleSide, emissive: 0x332200 });
    this.flags = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 6), poleMat);
      p.position.set(sx * PITCH.halfW, 0.75, sz * PITCH.halfL);
      p.castShadow = true;
      this.scene.add(p);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.32, 4, 1), flagMat);
      f.geometry.translate(0.225, 0, 0);
      f.position.set(sx * PITCH.halfW, 1.33, sz * PITCH.halfL);
      this.scene.add(f);
      this.flags.push(f);
    }
  }

  // Excitement 0..1 drives crowd jumping.
  setExcitement(v) { this.exciteTarget = v; }

  update(dt) {
    this.time += dt;
    this.excite += (this.exciteTarget - this.excite) * Math.min(1, dt * 2.5);
    this.crowdUniforms.uTime.value = this.time;
    this.crowdUniforms.uExcite.value = this.excite;
    this.boardTex.offset.x = (this.time * 0.035) % 1;
    for (let i = 0; i < this.flags.length; i++) this.flags[i].rotation.y = Math.sin(this.time * 2 + i) * 0.4;
    this._updateNet(this.goalA, dt);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
