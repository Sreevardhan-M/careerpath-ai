import { h, api } from '../lib.js';
import { state } from '../state.js';
import { pageHead, selectFor, resourceItem, emptyState } from '../components.js';

const PAGE = 24;

export async function resourcesView() {
  const d = await api('GET', '/resources');
  const cat = state.catalog;
  const st = { done: new Set(d.done), saved: new Set(d.saved) };
  const careerSkillSet = new Set(d.careerSkills);
  const f = { q: '', skill: '', difficulty: '', category: '', career: '', gaps: false, saved: false, done: 'all', shown: PAGE };

  const skills = [...new Set(d.resources.flatMap((r) => r.skills))].sort((a, b) => a.localeCompare(b));
  const opt = (arr, all) => [{ value: '', label: all }, ...arr.map((x) => (typeof x === 'string' ? { value: x, label: x } : x))];
  const list = h('div', { class: 'resource-list' });
  const count = h('p', { class: 'muted', 'aria-live': 'polite' });
  const more = h('button', { class: 'btn', type: 'button', onclick: () => { f.shown += PAGE; paint(); } }, 'Show more');

  const filtered = () => d.resources.filter((r) => {
    if (f.q && !`${r.title} ${r.platform} ${r.description} ${r.skills.join(' ')}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    if (f.skill && !r.skills.includes(f.skill)) return false;
    if (f.difficulty && r.difficulty !== f.difficulty) return false;
    if (f.category && r.category !== f.category) return false;
    if (f.career && !r.careers.includes(f.career)) return false;
    if (f.gaps && !d.gapIds.includes(r.id)) return false;
    if (f.saved && !st.saved.has(r.id)) return false;
    if (f.done === 'todo' && st.done.has(r.id)) return false;
    if (f.done === 'done' && !st.done.has(r.id)) return false;
    return true;
  }).sort((a, b) => (d.gapIds.includes(b.id) - d.gapIds.includes(a.id)) || a.title.localeCompare(b.title));

  function paint() {
    const all = filtered();
    list.replaceChildren(...all.slice(0, f.shown).map((r) => {
      const node = resourceItem(r, st, () => { if (f.saved || f.done !== 'all') setTimeout(paint, 0); });
      if (d.gapIds.includes(r.id)) node.querySelector('.resource-meta').append(' · ', h('span', { class: 'for-gap' }, 'Matches a gap'));
      return node;
    }));
    if (!all.length) list.replaceChildren(emptyState('No resources match', 'Try removing a filter or searching for a different skill.', h('button', { class: 'btn btn-sm', type: 'button', onclick: reset }, 'Clear filters')));
    count.textContent = `${all.length} ${all.length === 1 ? 'resource' : 'resources'}${f.gaps ? ' for your skill gaps' : ''}`;
    more.hidden = all.length <= f.shown;
  }

  const ctl = (label, el) => h('div', { class: 'filter' }, h('label', { for: el.id }, label), el);
  const q = h('input', { class: 'input', id: 'f-q', type: 'search', placeholder: 'Search by title, platform or skill', oninput: (e) => { f.q = e.target.value; f.shown = PAGE; paint(); } });
  const mk = (id, options, key) => selectFor(options, '', { id, onchange: (e) => { f[key] = e.target.value; f.shown = PAGE; paint(); } });
  const sSkill = mk('f-skill', opt(skills, 'All skills'), 'skill');
  const sDiff = mk('f-diff', opt(cat.difficulties, 'All levels'), 'difficulty');
  const sCat = mk('f-cat', opt(cat.resourceCategories, 'All categories'), 'category');
  const sCareer = mk('f-career', opt(cat.careers.map((c) => ({ value: c.id, label: c.title })), 'All careers'), 'career');
  const sDone = mk('f-done', [{ value: 'all', label: 'All' }, { value: 'todo', label: 'Not completed' }, { value: 'done', label: 'Completed' }], 'done');
  const gapsBox = h('input', { type: 'checkbox', onchange: (e) => { f.gaps = e.target.checked; f.shown = PAGE; paint(); } });
  const savedBox = h('input', { type: 'checkbox', onchange: (e) => { f.saved = e.target.checked; f.shown = PAGE; paint(); } });
  function reset() {
    Object.assign(f, { q: '', skill: '', difficulty: '', category: '', career: '', gaps: false, saved: false, done: 'all', shown: PAGE });
    q.value = ''; [sSkill, sDiff, sCat, sCareer].forEach((s) => { s.value = ''; }); sDone.value = 'all'; gapsBox.checked = false; savedBox.checked = false; paint();
  }

  paint();
  return h('div', {},
    pageHead('Learning Resources', `Real courses, documentation, videos and practice platforms. Items marked "Matches a gap" are chosen from your skill gaps for ${d.targetCareer.replace(/-/g, ' ')}.`),
    h('p', { class: 'note' }, 'Costs are described from what each provider publishes and can change. Always confirm current pricing on the provider\'s own site before you enrol or pay.'),
    h('div', { class: 'filters' }, ctl('Search', q), ctl('Skill', sSkill), ctl('Difficulty', sDiff), ctl('Learning category', sCat), ctl('Career path', sCareer), ctl('Status', sDone),
      h('div', { class: 'filter-checks' }, h('label', { class: 'check' }, gapsBox, h('span', {}, 'Only my skill gaps')), h('label', { class: 'check' }, savedBox, h('span', {}, 'Only saved')), h('button', { class: 'link-btn', type: 'button', onclick: reset }, 'Clear filters'))),
    count, list, h('div', { class: 'center' }, more));
}
