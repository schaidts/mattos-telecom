// Persistent storage (LocalStorage) with defaults, migration and safe access.

const KEY = 'craque.save.v1';

export function defaultSave() {
  return {
    version: 1,
    profile: {
      name: 'R. Santos',
      number: 10,
      kit: 'emerald',
      skin: 2,
      hair: 1,
      hairStyle: 0,
      boots: 3,
      created: Date.now(),
    },
    progress: {
      levels: {},           // id -> { stars, completed, bestActions, plays }
      currentChapter: 1,
      lastLevel: '1-1',
    },
    stats: {
      goals: 0, assists: 0, passes: 0, passesAttempted: 0, shots: 0, shotsOnTarget: 0,
      headers: 0, oneTouch: 0, bicycles: 0, freeKickGoals: 0, curlers: 0, topCorners: 0,
      saved: 0, intercepted: 0, levelsPlayed: 0, levelsCompleted: 0, attempts: 0,
      playTime: 0, longestGoal: 0,
    },
    history: [],             // recent results [{id, result, stars, at}]
    achievements: {},        // id -> timestamp unlocked
    settings: {
      master: 0.8, sfx: 0.9, crowd: 0.7, muted: false,
      quality: 'auto', guide: true, slowmo: true, shake: true, tutorials: true,
    },
  };
}

function merge(def, src) {
  if (typeof def !== 'object' || def === null || Array.isArray(def)) return src === undefined ? def : src;
  const out = { ...def };
  if (src && typeof src === 'object') {
    for (const k of Object.keys(src)) out[k] = k in def ? merge(def[k], src[k]) : src[k];
  }
  return out;
}

export class SaveSystem {
  constructor() {
    this.data = defaultSave();
    this.available = true;
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = merge(defaultSave(), JSON.parse(raw));
    } catch (e) {
      this.available = false;
      console.warn('[save] storage unavailable, progress will not persist', e);
    }
    return this.data;
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) {
      this.available = false;
    }
  }

  reset() {
    const settings = this.data.settings;
    this.data = defaultSave();
    this.data.settings = settings;
    this.save();
  }

  get profile() { return this.data.profile; }
  get settings() { return this.data.settings; }
  get stats() { return this.data.stats; }
  get progress() { return this.data.progress; }
}
