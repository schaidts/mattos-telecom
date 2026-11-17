// Global constants shared by every module. Units are metres / seconds.
// Coordinate system: x = across the pitch, y = up, z = along the pitch.
// The team you control always attacks the goal at z = -52.5.

export const PITCH = {
  length: 105,
  width: 68,
  halfL: 52.5,
  halfW: 34,
};

export const GOAL = {
  z: -52.5,          // goal line of the goal we attack
  halfWidth: 3.66,
  height: 2.44,
  depth: 2.0,
  postR: 0.06,
};

export const BOX = {
  // penalty area of the attacked goal
  zEdge: -36,
  halfW: 20.16,
  sixZ: -47,
  sixHalfW: 9.16,
  spotZ: -41.5,
};

export const BALL_R = 0.11;
export const GRAVITY = 9.81;

export const PHYS = {
  restitution: 0.55,
  rollingDecel: 2.6,     // m/s^2 when rolling on grass
  airDrag: 0.06,         // proportional drag per second
  netDamp: 0.18,
};

export const PLAYER = {
  runSpeed: 6.8,
  sprintSpeed: 7.8,
  controlRadius: 1.0,
  height: 1.82,
};

export const GOAL_CENTER = { x: 0, y: 1.0, z: GOAL.z };

// Kit palette used for My Player customisation and opponents.
export const KIT_COLORS = [
  { id: 'emerald', name: 'Emerald', main: '#0f9d58', trim: '#ffffff', shorts: '#0b1f3a' },
  { id: 'crimson', name: 'Crimson', main: '#c62828', trim: '#ffffff', shorts: '#ffffff' },
  { id: 'royal', name: 'Royal', main: '#1e4fd8', trim: '#ffffff', shorts: '#ffffff' },
  { id: 'gold', name: 'Gold', main: '#f2b705', trim: '#0b1f3a', shorts: '#0b1f3a' },
  { id: 'sky', name: 'Sky', main: '#5fb4f0', trim: '#ffffff', shorts: '#0b1f3a' },
  { id: 'black', name: 'Midnight', main: '#1b1f2a', trim: '#e9c46a', shorts: '#1b1f2a' },
  { id: 'orange', name: 'Sunset', main: '#f57c00', trim: '#1b1f2a', shorts: '#1b1f2a' },
  { id: 'claret', name: 'Claret', main: '#7a1f3d', trim: '#9fd3ff', shorts: '#ffffff' },
];

export const SKIN_TONES = ['#f1c9a5', '#e0ac82', '#c68a5e', '#9c6644', '#6f4630', '#4a2f22'];
export const HAIR_COLORS = ['#1a1310', '#3b2416', '#6b4423', '#b07a3c', '#e3c06f', '#c4542a', '#d9d9d9'];
export const BOOT_COLORS = ['#111111', '#ffffff', '#ff3d5a', '#2ee6a6', '#ffd400', '#3d7bff', '#ff8a00'];

export const QUALITY = {
  low: { pixelRatio: 1.0, shadows: false, crowd: 0.35, antialias: false },
  medium: { pixelRatio: 1.5, shadows: true, crowd: 0.7, antialias: true, shadowSize: 1024 },
  high: { pixelRatio: 2.0, shadows: true, crowd: 1.0, antialias: true, shadowSize: 2048 },
};
