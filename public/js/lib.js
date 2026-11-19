// Small DOM and fetch helpers. Elements are built with textContent only, so user data is never parsed as HTML.

const SVG_NS = 'http://www.w3.org/2000/svg';

function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'for') el.htmlFor = v;
    else if (k.startsWith('aria-') || k.startsWith('data-') || k === 'role' || k === 'list') el.setAttribute(k, v === true ? 'true' : v);
    else if (k in el) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, kids);
  return el;
}

export function svg(tag, props = {}, ...kids) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else el.setAttribute(k, v);
  }
  append(el, kids);
  return el;
}

export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

export async function api(method, path, body) {
  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      headers: body !== undefined ? { 'content-type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth') && path !== '/me') window.dispatchEvent(new Event('cp:unauth'));
    throw new ApiError(res.status, data.error || 'Something went wrong.', data.fields);
  }
  return data;
}

let toastTimer;
export function toast(message, kind = 'info') {
  const host = document.getElementById('toasts');
  if (!host) return;
  host.replaceChildren(h('div', { class: `toast toast-${kind}`, role: kind === 'error' ? 'alert' : 'status' }, message));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => host.replaceChildren(), 3800);
}

export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return fmtDate(iso);
}

export function daysUntil(dateStr) {
  const t = new Date(dateStr + 'T00:00:00');
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return Math.round((t - n) / 86400000);
}

export function debounce(fn, ms = 400) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export const visuallyHidden = (text) => h('span', { class: 'sr-only' }, text);
