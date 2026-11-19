import { h, api, toast } from '../lib.js';
import { state } from '../state.js';
import { go } from '../nav.js';
import { pageHead, pill, gapBar, selectFor, selfReportedNote, resourceItem } from '../components.js';

const STATUS = { strong: ['Strong', 'ok'], improve: ['Needs improvement', 'mid'], missing: ['Missing', 'low'] };

export function careerSelect(current, onChange, label = 'Target career') {
  const sel = selectFor(state.catalog.careers.map((c) => ({ value: c.id, label: c.title })), current, { id: 'career-select', onchange: (e) => onChange(e.target.value) });
  return h('div', { class: 'select-row' }, h('label', { for: 'career-select' }, label), sel);
}

export async function gapView({ rerender }) {
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  const picked = sessionStorage.getItem('cp_gap_career') || '';
  const d = await api('GET', `/gap${picked ? `?career=${encodeURIComponent(picked)}` : ''}`);
  const gap = d.gap;
  const res = await api('GET', '/resources');
  const st = { done: new Set(res.done), saved: new Set(res.saved) };

  const buildBtn = h('button', { class: 'btn btn-primary', type: 'button', onclick: async () => {
    buildBtn.disabled = true;
    try { await api('PUT', '/target', { careerId: gap.careerId }); state.profile.targetCareer = gap.careerId; go('/roadmap'); } catch (e) { toast(e.message, 'error'); buildBtn.disabled = false; }
  } }, 'Build My Learning Roadmap');

  const row = (r) => {
    const [label, tone] = STATUS[r.status];
    return h('li', { class: `gap-row gap-${r.status}` },
      h('div', { class: 'gap-main' },
        h('div', { class: 'gap-name' }, h('strong', {}, r.name), pill(label, tone), r.status !== 'strong' ? pill(`${r.priority} priority`, r.priority === 'High' ? 'accent' : 'neutral') : null),
        h('div', { class: 'gap-levels' }, h('span', {}, `Now: ${r.levelLabel}`), h('span', {}, `Target: ${r.targetLabel}`)),
        gapBar(r.level, r.target, r.status),
        r.note ? h('p', { class: 'muted' }, r.note) : null,
        r.via ? h('p', { class: 'muted' }, `Counted through your ${r.via} skill.`) : null),
      r.resourceIds.length ? h('details', { class: 'gap-res' }, h('summary', {}, `Suggested resources (${r.resourceIds.length})`), h('div', { class: 'resource-list' }, r.resourceIds.map((id) => d.resources[id]).filter(Boolean).map((x) => resourceItem(x, st)))) : null);
  };

  const section = (title, list, empty) => h('section', { class: 'panel' }, h('h2', {}, `${title} (${list.length})`), list.length ? h('ul', { class: 'gap-list' }, list.map(row)) : h('p', { class: 'muted' }, empty));

  return h('div', {},
    pageHead('Skill Gap Analysis', 'Compare your current skills with what the role asks for at entry level.', buildBtn),
    careerSelect(gap.careerId, (id) => { sessionStorage.setItem('cp_gap_career', id); rerender(); }),
    h('div', { class: 'ledger' },
      h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Skill coverage'), h('strong', { class: 'stat-value' }, `${gap.coverage.coverage}%`), h('span', { class: 'stat-sub' }, gap.coverage.label)),
      h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Strong'), h('strong', { class: 'stat-value' }, gap.strong.length), h('span', { class: 'stat-sub' }, 'Requirements met')),
      h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'To improve'), h('strong', { class: 'stat-value' }, gap.improve.length), h('span', { class: 'stat-sub' }, 'Started, below target')),
      h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Missing'), h('strong', { class: 'stat-value' }, gap.missing.length), h('span', { class: 'stat-sub' }, 'Not in your profile'))),
    selfReportedNote(),
    h('p', { class: 'legend' }, h('span', { class: 'legend-fill' }), ' your level   ', h('span', { class: 'legend-target' }), ' target level for the role'),
    section('Recommended learning priority', gap.priority, 'You meet every requirement for this career. Prove it with projects.'),
    section('Missing skills', gap.missing, 'Nothing missing.'),
    section('Skills that need improvement', gap.improve, 'Nothing to improve.'),
    section('Existing strong skills', gap.strong, 'No requirements met yet. Start with the high-priority skills above.'));
}
