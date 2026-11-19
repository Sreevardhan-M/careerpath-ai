import { h, svg, api, toast, visuallyHidden } from './lib.js';
import { state } from './state.js';

export function progressBar(percent, label) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const fill = h('span', { class: 'bar-fill' });
  requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = p + '%'; }));
  return h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': p, 'aria-label': label || 'Progress' }, fill);
}

/** Five segment meter for a 1-5 proficiency level. */
export function levelMeter(level) {
  return h('span', { class: 'meter', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5].map((i) => h('span', { class: i <= level ? 'on' : '' })));
}

/** Current level versus the target level for a role. */
export function gapBar(level, target, status) {
  const fill = h('span', { class: `gapbar-fill gapbar-${status}` });
  requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = (level / 5) * 100 + '%'; }));
  return h('div', { class: 'gapbar', 'aria-hidden': 'true' }, fill, h('span', { class: 'gapbar-target', style: { left: (target / 5) * 100 + '%' } }));
}

export const pill = (text, tone = 'neutral') => h('span', { class: `pill pill-${tone}` }, text);

export function ring(percent, size = 132, stroke = 10, caption = '') {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  const arc = svg('circle', { cx: size / 2, cy: size / 2, r, fill: 'none', 'stroke-width': stroke, 'stroke-linecap': 'round', class: 'ring-arc', 'stroke-dasharray': c, 'stroke-dashoffset': c, transform: `rotate(-90 ${size / 2} ${size / 2})` });
  requestAnimationFrame(() => requestAnimationFrame(() => arc.setAttribute('stroke-dashoffset', c * (1 - p / 100))));
  return h('div', { class: 'ring', style: { width: size + 'px', height: size + 'px' }, role: 'img', 'aria-label': `${Math.round(p)} percent${caption ? ' ' + caption : ''}` },
    svg('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, 'aria-hidden': 'true' }, svg('circle', { cx: size / 2, cy: size / 2, r, fill: 'none', 'stroke-width': stroke, class: 'ring-track' }), arc),
    h('div', { class: 'ring-label' }, h('strong', {}, Math.round(p) + '%'), caption ? h('span', {}, caption) : null));
}

export function skeleton(rows = 4) {
  return h('div', { class: 'skeleton-wrap', 'aria-busy': 'true', 'aria-label': 'Loading' },
    h('div', { class: 'skel skel-title' }),
    Array.from({ length: rows }, (_, i) => h('div', { class: 'skel skel-row', style: { width: 100 - (i % 3) * 12 + '%' } })));
}

export function emptyState(title, text, action) {
  return h('div', { class: 'empty' }, h('h3', {}, title), h('p', {}, text), action || null);
}

export function errorState(err, retry) {
  return h('div', { class: 'empty', role: 'alert' }, h('h3', {}, 'This page could not load'), h('p', {}, err.message || 'Something went wrong.'), retry ? h('button', { class: 'btn', onclick: retry }, 'Try again') : null);
}

export function pageHead(title, lede, aside) {
  return h('header', { class: 'page-head' }, h('div', {}, h('h1', { tabindex: -1, id: 'page-title' }, title), lede ? h('p', { class: 'lede' }, lede) : null), aside || null);
}

export function selfReportedNote() {
  return h('p', { class: 'note' }, h('strong', {}, 'Self-reported. '), 'These levels are your own ratings. They are not test results and have not been objectively assessed.');
}

export function selectFor(options, value, props = {}) {
  const sel = h('select', { class: 'select', ...props }, options.map((o) => h('option', { value: o.value, selected: String(o.value) === String(value) }, o.label)));
  return sel;
}

/** One learning resource with save and complete toggles that persist through the API. */
export function resourceItem(res, st, onChange) {
  const isDone = () => st.done.has(res.id);
  const isSaved = () => st.saved.has(res.id);
  const doneBtn = h('button', { class: 'btn btn-sm', type: 'button' });
  const saveBtn = h('button', { class: 'btn btn-sm btn-ghost', type: 'button' });
  const root = h('article', { class: 'resource' });
  const paint = () => {
    root.classList.toggle('is-done', isDone());
    doneBtn.textContent = isDone() ? 'Completed' : 'Mark completed';
    doneBtn.setAttribute('aria-pressed', String(isDone()));
    doneBtn.classList.toggle('btn-on', isDone());
    saveBtn.textContent = isSaved() ? 'Saved' : 'Save for later';
    saveBtn.setAttribute('aria-pressed', String(isSaved()));
    saveBtn.classList.toggle('btn-on', isSaved());
  };
  const toggle = async (kind, set, btn) => {
    const next = !set.has(res.id);
    btn.disabled = true;
    try {
      await api('POST', '/progress', { kind, key: res.id, done: next });
      next ? set.add(res.id) : set.delete(res.id);
      paint();
      toast(kind === 'resource_done' ? (next ? 'Marked as completed.' : 'Marked as not completed.') : next ? 'Saved for later.' : 'Removed from saved.');
      onChange?.();
    } catch (e) { toast(e.message, 'error'); } finally { btn.disabled = false; }
  };
  doneBtn.addEventListener('click', () => toggle('resource_done', st.done, doneBtn));
  saveBtn.addEventListener('click', () => toggle('resource_saved', st.saved, saveBtn));
  const costLabel = state.catalog.costLabels[res.cost] || '';
  root.append(
    h('div', { class: 'resource-main' },
      h('h3', { class: 'resource-title' }, h('a', { href: res.url, target: '_blank', rel: 'noopener noreferrer' }, res.title, visuallyHidden(' (opens in a new tab)'))),
      h('p', { class: 'resource-meta' }, [res.platform, res.category, res.difficulty, res.time].filter(Boolean).join('  ·  ')),
      h('p', { class: 'resource-desc' }, res.description),
      h('p', { class: 'resource-cost' }, costLabel, costLabel ? '. Confirm current terms on the provider\'s site.' : '')),
    h('div', { class: 'resource-actions' }, doneBtn, saveBtn));
  paint();
  return root;
}

export function field(label, control, { hint, error, id } = {}) {
  const fid = id || control.id || `f-${Math.random().toString(36).slice(2, 8)}`;
  control.id = fid;
  if (error) control.setAttribute('aria-invalid', 'true');
  const errId = `${fid}-err`;
  const describedBy = [hint ? `${fid}-hint` : null, error ? errId : null].filter(Boolean).join(' ');
  if (describedBy) control.setAttribute('aria-describedby', describedBy);
  return h('div', { class: 'field' + (error ? ' has-error' : '') },
    h('label', { for: fid }, label),
    hint ? h('p', { class: 'hint', id: `${fid}-hint` }, hint) : null,
    control,
    error ? h('p', { class: 'error', id: errId }, error) : null);
}

export function confirmDialog({ title, body, confirmLabel = 'Confirm', danger = false, extra }) {
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const close = (v) => { overlay.remove(); prev?.focus?.(); resolve(v); };
    const cancel = h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => close(null) }, 'Cancel');
    const ok = h('button', { class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, type: 'button', onclick: () => close(extra ? extra.value : true) }, confirmLabel);
    const overlay = h('div', { class: 'overlay', onkeydown: (e) => { if (e.key === 'Escape') close(null); } },
      h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dlg-title' },
        h('h2', { id: 'dlg-title' }, title), h('p', {}, body), extra?.node || null, h('div', { class: 'dialog-actions' }, cancel, ok)));
    document.body.append(overlay);
    (extra?.node?.querySelector?.('input') || cancel).focus();
  });
}
