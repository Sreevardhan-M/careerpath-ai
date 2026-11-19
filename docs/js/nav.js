import { svg } from './lib.js';

/** Navigate to a hash route, re-rendering even if the hash is unchanged. */
export function go(path) {
  if (location.hash === '#' + path) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = path;
}

export function brandMark(size = 26) {
  return svg('svg', { class: 'brand-mark', viewBox: '0 0 32 32', width: size, height: size, 'aria-hidden': 'true' },
    svg('path', { d: 'M5 24h7v-7h7V10h8', fill: 'none', stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    svg('circle', { cx: 27, cy: 10, r: 2.6, fill: '#f3f4f6' }));
}
