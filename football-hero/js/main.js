// Entry point: boots systems, runs the main loop, handles resize, visibility
// and adaptive graphics quality.
import { SaveSystem } from './saveSystem.js';
import { AudioEngine } from './audio.js';
import { Career } from './career.js';
import { Stage } from './scene.js';
import { UI } from './ui.js';
import { Game } from './game.js';
import { isTouchDevice } from './utils.js';

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch (e) { return false; }
}

function resolveQuality(setting) {
  if (setting && setting !== 'auto') return setting;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  if (isTouchDevice()) return small ? 'medium' : 'medium';
  return 'high';
}

function boot() {
  const loading = document.getElementById('loading');
  if (!webglAvailable()) {
    loading.innerHTML = '<div class="fatal"><div><h2>É necessário WebGL 2</h2><p>Use um navegador atualizado (Chrome, Edge, Firefox ou Safari 15+).</p></div></div>';
    return;
  }
  const save = new SaveSystem();
  const audio = new AudioEngine(save.settings);
  const career = new Career(save);
  let qualityName = resolveQuality(save.settings.quality);
  const stage = new Stage(document.getElementById('stage'), qualityName);
  const ui = new UI({ save, career, audio });
  const game = new Game({
    stage, audio, save, career, ui,
    container: document.getElementById('input-layer'),
    overlay: document.getElementById('overlay'),
  });
  const applyQuality = () => {
    qualityName = resolveQuality(save.settings.quality);
    stage.setQuality(qualityName);
  };
  ui.attach(game, stage, applyQuality);

  const onResize = () => { stage.resize(); game.input.resize(); };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 250));
  document.addEventListener('fullscreenchange', () => setTimeout(onResize, 100));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (game.level && !ui.screen && game.phase !== 'result') ui.openPause();
      if (audio.ctx) audio.ctx.suspend();
    } else if (audio.ctx) audio.ctx.resume();
  });

  // main loop with adaptive quality (only when the setting is "auto")
  let last = performance.now();
  let fpsAcc = 0, fpsFrames = 0, slowWindows = 0;
  const order = ['low', 'medium', 'high'];
  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    game.update(dt);
    stage.render();
    fpsAcc += dt; fpsFrames++;
    if (fpsAcc > 3) {
      const fps = fpsFrames / fpsAcc;
      if (save.settings.quality === 'auto' && fps < 32 && !document.hidden) {
        slowWindows++;
        const i = order.indexOf(qualityName);
        if (slowWindows >= 2 && i > 0) { qualityName = order[i - 1]; stage.setQuality(qualityName); slowWindows = 0; }
      } else slowWindows = 0;
      fpsAcc = 0; fpsFrames = 0;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  ui.showScreen('menu');
  setTimeout(() => { loading.classList.add('gone'); setTimeout(() => loading.remove(), 600); }, 350);
  window.CRAQUE = { game, ui, save, career, stage, audio };
}

try {
  boot();
} catch (err) {
  console.error(err);
  const l = document.getElementById('loading');
  if (l) l.innerHTML = `<div class="fatal"><div><h2>Algo deu errado</h2><p>${String(err.message || err)}</p></div></div>`;
}
