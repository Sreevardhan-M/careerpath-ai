import { h } from './lib.js';
import { brandMark } from './nav.js';
import { state, loadCatalog, loadMe } from './state.js';
import { skeleton, errorState } from './components.js';
import { landingView } from './views/landing.js';
import { onboardingView, signinView } from './views/onboarding.js';
import { dashboardView } from './views/dashboard.js';
import { profileView } from './views/profile.js';
import { skillsView } from './views/skills.js';
import { careersView, careerDetailView } from './views/careers.js';
import { gapView } from './views/gap.js';
import { resourcesView } from './views/resources.js';
import { roadmapView } from './views/roadmap.js';
import { progressView } from './views/progress.js';
import { settingsView } from './views/settings.js';

export const NAV = [
  ['dashboard', 'Dashboard'], ['profile', 'My Profile'], ['skills', 'Skill Assessment'], ['careers', 'Career Recommendations'],
  ['gap', 'Skill Gap Analysis'], ['resources', 'Learning Resources'], ['roadmap', 'My Roadmap'], ['progress', 'Progress Tracking'], ['settings', 'Settings'],
];

const routes = [
  { re: /^\/?$/, view: landingView, title: null, kind: 'public' },
  { re: /^\/onboarding$/, view: onboardingView, title: 'Start your journey', kind: 'public' },
  { re: /^\/signin$/, view: signinView, title: 'Sign in', kind: 'public' },
  { re: /^\/dashboard$/, view: dashboardView, title: 'Dashboard', nav: 'dashboard' },
  { re: /^\/profile$/, view: profileView, title: 'My Profile', nav: 'profile' },
  { re: /^\/skills$/, view: skillsView, title: 'Skill Assessment', nav: 'skills' },
  { re: /^\/careers$/, view: careersView, title: 'Career Recommendations', nav: 'careers' },
  { re: /^\/careers\/([a-z-]+)$/, view: careerDetailView, title: 'Career details', nav: 'careers' },
  { re: /^\/gap$/, view: gapView, title: 'Skill Gap Analysis', nav: 'gap' },
  { re: /^\/resources$/, view: resourcesView, title: 'Learning Resources', nav: 'resources' },
  { re: /^\/roadmap$/, view: roadmapView, title: 'My Roadmap', nav: 'roadmap' },
  { re: /^\/progress$/, view: progressView, title: 'Progress Tracking', nav: 'progress' },
  { re: /^\/settings$/, view: settingsView, title: 'Settings', nav: 'settings' },
];

const root = document.getElementById('app');
let shell = null;
let renderToken = 0;

function buildShell() {
  const links = NAV.map(([id, label], i) => h('a', { class: 'nav-link', href: `#/${id}`, 'data-nav': id }, h('span', { class: 'nav-idx' }, String(i + 1).padStart(2, '0')), label));
  const menuBtn = h('button', { class: 'menu-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'sidebar', onclick: () => toggle() }, 'Menu');
  const sidebar = h('aside', { class: 'sidebar', id: 'sidebar', 'aria-label': 'Primary' },
    h('a', { class: 'brand', href: '#/dashboard' }, brandMark(), h('span', {}, 'CareerPath AI')),
    h('nav', {}, links),
    h('div', { class: 'sidebar-foot' },
      h('div', { class: 'who' }, h('strong', { id: 'who-name' }, ''), h('span', { id: 'who-sub' }, '')),
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: signOut }, 'Sign out')));
  const main = h('main', { id: 'main', class: 'main', tabindex: -1 });
  const scrim = h('div', { class: 'scrim', onclick: () => toggle(false) });
  function toggle(force) {
    const open = force ?? !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', open);
    scrim.classList.toggle('show', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  const topbar = h('div', { class: 'topbar' }, h('a', { class: 'brand', href: '#/dashboard' }, brandMark(), h('span', {}, 'CareerPath AI')), menuBtn);
  const el = h('div', { class: 'shell' }, topbar, sidebar, scrim, main);
  links.forEach((a) => a.addEventListener('click', () => toggle(false)));
  return { el, main, links, close: () => toggle(false) };
}

async function signOut() {
  try { await fetch('/api/auth/logout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); } catch { /* ignore */ }
  Object.assign(state, { me: null, profile: null, completion: null });
  shell = null;
  location.hash = '/';
}

async function render() {
  const token = ++renderToken;
  const path = location.hash.replace(/^#/, '') || '/';
  const route = routes.find((r) => r.re.test(path));
  if (!route) { location.hash = state.me ? '/dashboard' : '/'; return; }

  if (route.kind !== 'public' && !state.me) { shell = null; location.hash = '/signin'; return; }
  if (route.kind === 'public' && path === '/signin' && state.me) { location.hash = '/dashboard'; return; }

  const params = route.re.exec(path).slice(1);
  document.title = route.title ? `${route.title} | CareerPath AI` : 'CareerPath AI | Career guidance for CSE students';

  if (route.kind === 'public') {
    shell = null;
    const node = await route.view({ params });
    if (token !== renderToken) return;
    root.replaceChildren(node);
    window.scrollTo(0, 0);
    node.querySelector?.('[data-autofocus]')?.focus();
    return;
  }

  if (!shell || !root.contains(shell.el)) { shell = buildShell(); root.replaceChildren(shell.el); }
  shell.close();
  shell.links.forEach((a) => (a.dataset.nav === route.nav ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  document.getElementById('who-name').textContent = state.profile?.name || '';
  document.getElementById('who-sub').textContent = state.profile ? `Year ${state.profile.year}, ${state.profile.college.split(' (')[0]}` : '';
  shell.main.replaceChildren(skeleton(5));
  window.scrollTo(0, 0);
  try {
    const node = await route.view({ params, rerender: render });
    if (token !== renderToken) return;
    node.classList.add('page-in');
    shell.main.replaceChildren(node);
    (node.querySelector('#page-title') || shell.main).focus({ preventScroll: true });
  } catch (err) {
    if (token !== renderToken) return;
    if (err.status === 401) return;
    shell.main.replaceChildren(errorState(err, render));
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('cp:unauth', () => { state.me = null; shell = null; location.hash = '/signin'; });

(async function boot() {
  try {
    await Promise.all([loadCatalog(), loadMe()]);
  } catch (err) {
    root.replaceChildren(h('main', { id: 'main', class: 'boot-error' }, h('h1', {}, 'CareerPath AI could not start'), h('p', {}, err.message), h('button', { class: 'btn btn-primary', onclick: () => location.reload() }, 'Reload')));
    return;
  }
  render();
})();
