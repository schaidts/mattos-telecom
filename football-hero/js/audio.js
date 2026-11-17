// Fully procedural audio engine (WebAudio). No external sound files needed:
// crowd ambience, cheers, kicks, whistles, net, posts and UI sounds are synthesised.

export class AudioEngine {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.ready = false;
    this.crowdLevel = 0.35; // target intensity of the ambience
  }

  // Must be called from a user gesture (browser autoplay policy).
  unlock() {
    if (this.ready) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.master = c.createGain();
    this.sfxBus = c.createGain();
    this.crowdBus = c.createGain();
    this.sfxBus.connect(this.master);
    this.crowdBus.connect(this.master);
    // gentle compressor keeps cheers from clipping
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -14;
    this.comp.ratio.value = 4;
    this.master.connect(this.comp).connect(c.destination);

    this.noise = this._noiseBuffer(3);
    this.pink = this._pinkBuffer(4);
    this._startAmbience();
    this.ready = true;
    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.ready) return;
    const s = this.settings;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(s.sfx, t, 0.05);
    this.crowdBus.gain.setTargetAtTime(s.crowd, t, 0.05);
  }

  _noiseBuffer(sec) {
    const c = this.ctx;
    const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  _pinkBuffer(sec) {
    const c = this.ctx;
    const b = c.createBuffer(2, c.sampleRate * sec, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    return b;
  }

  _src(buf, loop = false) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = loop;
    return s;
  }

  _startAmbience() {
    const c = this.ctx;
    // Layer 1: low rumble of a full stadium
    const s1 = this._src(this.pink, true);
    const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 520; f1.Q.value = 0.6;
    this.ambGain = c.createGain(); this.ambGain.gain.value = 0.0;
    s1.connect(f1).connect(this.ambGain).connect(this.crowdBus);
    s1.start();
    // Layer 2: "voices" — formant-ish band that swells
    const s2 = this._src(this.noise, true);
    const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1100; f2.Q.value = 1.4;
    this.voiceGain = c.createGain(); this.voiceGain.gain.value = 0.0;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.23;
    const lfoGain = c.createGain(); lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain).connect(this.voiceGain.gain);
    lfo.start();
    s2.connect(f2).connect(this.voiceGain).connect(this.crowdBus);
    s2.start();
    this.setCrowd(0.35);
    // occasional rhythmic clapping/chant to keep the stadium alive
    this._chantTimer = setInterval(() => {
      if (!this.ready || this.settings.muted) return;
      if (Math.random() < 0.35) this.chant();
    }, 9000);
  }

  setCrowd(level) {
    this.crowdLevel = level;
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.ambGain.gain.setTargetAtTime(0.25 + level * 0.55, t, 0.6);
    this.voiceGain.gain.setTargetAtTime(0.04 + level * 0.12, t, 0.6);
  }

  _env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  kick(power = 0.6) {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(160 + power * 60, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const g = c.createGain(); this._env(g, t, 0.004, 0.55 + power * 0.4, 0.16);
    o.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + 0.25);
    // leather slap
    const n = this._src(this.noise);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
    const g2 = c.createGain(); this._env(g2, t, 0.002, 0.3 + power * 0.3, 0.05);
    n.connect(f).connect(g2).connect(this.sfxBus); n.start(t, Math.random()); n.stop(t + 0.1);
  }

  touch() {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.08);
    const g = c.createGain(); this._env(g, t, 0.003, 0.25, 0.09);
    o.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + 0.15);
  }

  bounce(v = 0.5) {
    if (!this.ready || v < 0.05) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.06);
    const g = c.createGain(); this._env(g, t, 0.002, Math.min(0.3, v * 0.3), 0.07);
    o.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + 0.1);
  }

  whistle(kind = 'short') {
    if (!this.ready) return;
    const c = this.ctx;
    const blasts = kind === 'final' ? [[0, 0.25], [0.35, 0.25], [0.7, 0.8]] : kind === 'long' ? [[0, 0.7]] : [[0, 0.22]];
    for (const [off, dur] of blasts) {
      const t = c.currentTime + off;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      g.gain.setValueAtTime(0.22, t + dur - 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const trem = c.createOscillator(); trem.frequency.value = 28;
      const tg = c.createGain(); tg.gain.value = 0.08;
      trem.connect(tg).connect(g.gain);
      for (const f of [2950, 3120]) {
        const o = c.createOscillator(); o.type = 'square';
        o.frequency.value = f;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
        const og = c.createGain(); og.gain.value = 0.18;
        o.connect(lp).connect(og).connect(g);
        o.start(t); o.stop(t + dur + 0.05);
      }
      trem.start(t); trem.stop(t + dur + 0.05);
      g.connect(this.sfxBus);
    }
  }

  cheer(intensity = 1, dur = 4) {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    for (let i = 0; i < 2; i++) {
      const s = this._src(this.pink, true);
      const f = c.createBiquadFilter(); f.type = 'bandpass';
      f.frequency.setValueAtTime(700 + i * 700, t);
      f.frequency.linearRampToValueAtTime(1000 + i * 900, t + 0.6);
      f.Q.value = 0.7;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1.6 * intensity, t + 0.35);
      g.gain.setTargetAtTime(0.5 * intensity, t + 1.2, 0.9);
      g.gain.setTargetAtTime(0.0001, t + dur, 0.8);
      s.connect(f).connect(g).connect(this.crowdBus);
      s.start(t, Math.random() * 2); s.stop(t + dur + 4);
    }
  }

  ooh() {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const s = this._src(this.pink, true);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(650, t); f.frequency.exponentialRampToValueAtTime(330, t + 1.4);
    const f2 = c.createBiquadFilter(); f2.type = 'peaking'; f2.frequency.value = 900; f2.gain.value = 6;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(2.2, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    s.connect(f).connect(f2).connect(g).connect(this.crowdBus);
    s.start(t, Math.random()); s.stop(t + 2);
  }

  groan() {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const s = this._src(this.pink, true);
    const f = c.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(300, t + 1.2);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.2, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    s.connect(f).connect(g).connect(this.crowdBus);
    s.start(t, Math.random()); s.stop(t + 1.6);
  }

  chant() {
    if (!this.ready) return;
    const c = this.ctx;
    // clap-clap-clapclapclap pattern
    const pattern = [0, 0.5, 1.0, 1.25, 1.5];
    const reps = 2;
    for (let r = 0; r < reps; r++) {
      for (const p of pattern) {
        const t = c.currentTime + r * 2.1 + p;
        const s = this._src(this.noise);
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 0.9;
        const g = c.createGain(); this._env(g, t, 0.005, 0.25, 0.12);
        s.connect(f).connect(g).connect(this.crowdBus); s.start(t, Math.random() * 2); s.stop(t + 0.2);
      }
    }
  }

  net() {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const s = this._src(this.noise);
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500;
    const g = c.createGain(); this._env(g, t, 0.01, 0.35, 0.35);
    s.connect(f).connect(g).connect(this.sfxBus); s.start(t); s.stop(t + 0.5);
  }

  post() {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    for (const [f, a] of [[420, 0.35], [1130, 0.2], [2210, 0.12], [3370, 0.06]]) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = c.createGain(); this._env(g, t, 0.002, a, 0.9);
      o.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + 1);
    }
  }

  save() {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const s = this._src(this.noise);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700;
    const g = c.createGain(); this._env(g, t, 0.003, 0.5, 0.12);
    s.connect(f).connect(g).connect(this.sfxBus); s.start(t); s.stop(t + 0.2);
  }

  click() {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1320, t + 0.05);
    const g = c.createGain(); this._env(g, t, 0.003, 0.12, 0.07);
    o.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + 0.1);
  }

  success() {
    if (!this.ready) return;
    const c = this.ctx;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const t = c.currentTime + i * 0.11;
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = c.createGain(); this._env(g, t, 0.01, 0.16, 0.5);
      o.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + 0.6);
    });
  }

  star(i = 0) {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 880 * Math.pow(1.26, i);
    const g = c.createGain(); this._env(g, t, 0.005, 0.2, 0.4);
    o.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + 0.5);
  }

  fail() {
    if (!this.ready) return;
    const c = this.ctx;
    [392, 311.13].forEach((f, i) => {
      const t = c.currentTime + i * 0.18;
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = c.createGain(); this._env(g, t, 0.01, 0.14, 0.4);
      o.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + 0.5);
    });
  }
}
