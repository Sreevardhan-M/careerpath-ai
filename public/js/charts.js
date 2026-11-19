// Small hand-built SVG charts. Each carries a text description for screen readers.
import { svg, h } from './lib.js';

const W = 560;
const H = 200;
const PAD = { l: 30, r: 8, t: 12, b: 28 };

function niceMax(v) {
  if (v <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / step) * step;
}

const short = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Bars: weekly activity. data = [{ weekStart, count }] */
export function weeklyChart(data) {
  const max = niceMax(Math.max(...data.map((d) => d.count), 1));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const bw = iw / data.length;
  const kids = [];
  for (let g = 0; g <= 2; g++) {
    const y = PAD.t + ih - (ih * g) / 2;
    kids.push(svg('line', { x1: PAD.l, x2: W - PAD.r, y1: y, y2: y, class: 'chart-grid' }), svg('text', { x: PAD.l - 6, y: y + 4, class: 'chart-tick', 'text-anchor': 'end' }, String(Math.round((max * g) / 2))));
  }
  data.forEach((d, i) => {
    const bh = (d.count / max) * ih;
    const x = PAD.l + i * bw + bw * 0.22;
    kids.push(
      svg('rect', { x, y: PAD.t + ih - bh, width: bw * 0.56, height: Math.max(bh, d.count ? 2 : 0), rx: 2, class: 'chart-bar' }, svg('title', {}, `Week of ${short(d.weekStart)}: ${d.count} activities`)),
      svg('text', { x: x + bw * 0.28, y: H - 8, class: 'chart-tick', 'text-anchor': 'middle' }, short(d.weekStart)));
    if (d.count) kids.push(svg('text', { x: x + bw * 0.28, y: PAD.t + ih - bh - 5, class: 'chart-val', 'text-anchor': 'middle' }, String(d.count)));
  });
  const total = data.reduce((n, d) => n + d.count, 0);
  return h('figure', { class: 'chart' },
    svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Weekly learning activity over the last ${data.length} weeks, ${total} activities in total` }, ...kids),
    h('figcaption', { class: 'sr-only' }, data.map((d) => `Week of ${short(d.weekStart)}: ${d.count}`).join('. ')));
}

/** Line: readiness history. points = [{ day, coverage }] */
export function readinessChart(points) {
  if (points.length === 1) points = [{ day: points[0].day, coverage: points[0].coverage }, ...points];
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i) => PAD.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v) => PAD.t + ih - (v / 100) * ih;
  const kids = [];
  [0, 50, 100].forEach((g) => kids.push(svg('line', { x1: PAD.l, x2: W - PAD.r, y1: y(g), y2: y(g), class: 'chart-grid' }), svg('text', { x: PAD.l - 6, y: y(g) + 4, class: 'chart-tick', 'text-anchor': 'end' }, String(g))));
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.coverage).toFixed(1)}`).join(' ');
  kids.push(svg('path', { d, class: 'chart-line', fill: 'none' }));
  points.forEach((p, i) => kids.push(svg('circle', { cx: x(i), cy: y(p.coverage), r: 3.5, class: 'chart-dot' }, svg('title', {}, `${short(p.day)}: ${p.coverage} percent`))));
  kids.push(svg('text', { x: PAD.l, y: H - 8, class: 'chart-tick' }, short(points[0].day)), svg('text', { x: W - PAD.r, y: H - 8, class: 'chart-tick', 'text-anchor': 'end' }, short(points[points.length - 1].day)));
  const last = points[points.length - 1].coverage;
  return h('figure', { class: 'chart' },
    svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Skill coverage over time, currently ${last} percent` }, ...kids),
    h('figcaption', { class: 'sr-only' }, points.map((p) => `${short(p.day)}: ${p.coverage} percent`).join('. ')));
}
