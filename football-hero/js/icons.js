// Original inline SVG icon set (stroke icons, currentColor).
const s = (body, vb = '0 0 24 24') => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const f = (body, vb = '0 0 24 24') => `<svg viewBox="${vb}" fill="currentColor" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  play: f('<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>'),
  pause: f('<rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/>'),
  back: s('<path d="M15 18l-6-6 6-6"/>'),
  next: s('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  refresh: s('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
  home: s('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  trophy: s('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 21h8M9.5 17h5"/>'),
  shirt: s('<path d="M8 3l-5 3 2 5 2-1v11h10V10l2 1 2-5-5-3a4 4 0 0 1-8 0z"/>'),
  bars: s('<path d="M5 20V11M12 20V5M19 20v-7"/>'),
  medal: s('<circle cx="12" cy="15" r="5"/><path d="M8.5 11.5L6 3h4l2 5 2-5h4l-2.5 8.5"/><path d="M12 13v4"/>'),
  gear: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  expand: s('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  star: f('<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/>'),
  lock: s('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  check: s('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  x: s('<path d="M6 6l12 12M18 6L6 18"/>'),
  target: s('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'),
  ball: s('<circle cx="12" cy="12" r="9"/><path d="M12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4z"/><path d="M12 3v4.5M20.4 9.3l-4.6 1M17.3 19.4l-3-4.7M6.7 19.4l3-4.7M3.6 9.3l4.6 1"/>'),
  ballFill: f('<circle cx="12" cy="12" r="10" opacity=".95"/><path fill="#0b1f3a" d="M12 7.3l4 2.9-1.5 4.6h-5L8 10.2z"/>'),
  hand: f('<path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10l.1-1.4a1.5 1.5 0 0 1 3 .1V11l.1-.8a1.5 1.5 0 0 1 3 .3V15c0 3.9-2.7 7-6.4 7-2.4 0-4-1-5.5-3L3.6 14.6a1.6 1.6 0 0 1 2.4-2.1L9 15z" stroke="#0b1f3a" stroke-width="1"/>'),
  rotate: s('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M2 12a10 10 0 0 0 4 7M22 12a10 10 0 0 0-4-7"/>'),
  bolt: f('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  head: s('<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/><circle cx="19" cy="4" r="2"/>'),
  flip: s('<path d="M4 16c2-6 6-9 12-9"/><path d="M13 4l3 3-3 3"/><circle cx="19" cy="17" r="3"/>'),
  curve: s('<path d="M4 19c0-8 6-14 16-14"/><circle cx="4" cy="19" r="1.6" fill="currentColor"/><path d="M16 2l4 3-3 4"/>'),
  wall: s('<rect x="3" y="10" width="4" height="11" rx="1"/><rect x="10" y="10" width="4" height="11" rx="1"/><rect x="17" y="10" width="4" height="11" rx="1"/><path d="M5 7a7 5 0 0 1 14 0"/>'),
  rocket: s('<path d="M5 19l3-3M14 4c4 0 6 2 6 6l-8 8-6-6z"/><circle cx="15" cy="9" r="1.5"/><path d="M8 12l-4 1 3-5h4M12 16l-1 4 5-3v-4"/>'),
  assist: s('<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 17c4-1 8-5 10-9" stroke-dasharray="2 3"/>'),
  pass: s('<circle cx="6" cy="17" r="2.5"/><path d="M9 15l9-9M13 6h5v5"/>'),
  stars: f('<path d="M8 3l1.8 3.8 4.2.6-3 2.9.7 4.1L8 12.4 4.3 14.4 5 10.3 2 7.4l4.2-.6z"/><path d="M17 10l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z"/>'),
  fire: f('<path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4S9 11 11 11c0-4 1-9 1-9z"/>'),
  cap: s('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>'),
  contract: s('<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h5"/><path d="M15 3v4h4"/>'),
  rise: s('<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>'),
  cup: s('<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M12 13v5M8 21h8"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>'),
  globe: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  logo: `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#36f0b0"/><stop offset="1" stop-color="#0f9d6e"/></linearGradient></defs><path d="M32 3l25 9v18c0 15-11 26-25 31C18 56 7 45 7 30V12z" fill="url(#lg1)"/><path d="M32 9l19 7v14c0 11.5-8 20.5-19 25-11-4.5-19-13.5-19-25V16z" fill="#07122a"/><circle cx="32" cy="31" r="11" fill="#fff"/><path d="M32 24.5l5.2 3.8-2 6.1h-6.4l-2-6.1z" fill="#07122a"/><path d="M14 46c10-4 26-4 36 0" stroke="#ffd640" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
};

export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    if (el.dataset.hydrated) return;
    const svg = ICONS[el.dataset.icon];
    if (svg) { el.insertAdjacentHTML('afterbegin', svg); el.dataset.hydrated = '1'; }
  });
}
