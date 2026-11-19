import { h, api, toast } from '../lib.js';
import { state } from '../state.js';
import { pageHead, progressBar, pill, resourceItem, ring } from '../components.js';
import { careerSelect } from './gap.js';

export async function roadmapView({ rerender }) {
  const picked = sessionStorage.getItem('cp_roadmap_career') || '';
  const [d, res] = await Promise.all([api('GET', `/roadmap${picked ? `?career=${encodeURIComponent(picked)}` : ''}`), api('GET', '/resources')]);
  const rm = d.roadmap;
  const st = { done: new Set(res.done), saved: new Set(res.saved) };
  const isTarget = d.targetCareer === rm.careerId;
  const overall = h('div', { class: 'roadmap-overall' });
  const phaseNodes = new Map();

  const recompute = () => {
    let total = 0, done = 0;
    rm.phases.forEach((p) => {
      const active = p.tasks.filter((t) => !t.covered);
      p.total = active.length; p.done = active.filter((t) => t.done).length; p.percent = p.total ? Math.round((p.done / p.total) * 100) : 100;
      total += p.total; done += p.done;
      const n = phaseNodes.get(p.n);
      n.count.textContent = `${p.done} of ${p.total} tasks`;
      n.bar.replaceChildren(progressBar(p.percent, `Phase ${p.n} progress`));
      n.state.replaceChildren(p.total && p.done === p.total ? pill('Complete', 'ok') : p.done ? pill('In progress', 'accent') : p.allCovered ? pill('Already covered', 'ok') : pill('Not started', 'neutral'));
    });
    rm.total = total; rm.done = done; rm.percent = total ? Math.round((done / total) * 100) : 0;
    overall.replaceChildren(ring(rm.percent, 96, 9, 'done'), h('div', {}, h('strong', {}, `${rm.done} of ${rm.total} tasks complete`), h('p', { class: 'muted' }, `About ${rm.horizonWeeks} weeks in total, sized for year ${state.profile.year}.`)));
  };

  const taskRow = (t, p) => {
    const box = h('input', { type: 'checkbox', checked: t.done, id: `t-${t.id}`, onchange: async (e) => {
      const want = e.target.checked;
      e.target.disabled = true;
      try { await api('POST', '/progress', { kind: 'task', key: t.id, done: want }); t.done = want; row.classList.toggle('is-done', want); recompute(); toast(want ? 'Task completed.' : 'Task reopened.'); }
      catch (err) { e.target.checked = !want; toast(err.message, 'error'); } finally { e.target.disabled = false; }
    } });
    const rs = t.resourceIds.map((id) => d.resources[id]).filter(Boolean);
    const row = h('li', { class: 'task' + (t.done ? ' is-done' : '') },
      h('div', { class: 'task-head' }, h('label', { class: 'check', for: `t-${t.id}` }, box, h('span', {}, t.title)), t.link ? h('a', { class: 'link-btn', href: t.link }, 'Open') : null),
      t.detail ? h('p', { class: 'muted task-detail' }, t.detail) : null,
      rs.length ? h('details', { class: 'task-res' }, h('summary', {}, `Resources (${rs.length})`), h('div', { class: 'resource-list' }, rs.map((r) => resourceItem(r, st)))) : null);
    return row;
  };

  const phaseEl = (p) => {
    const refs = { count: h('span', { class: 'muted' }), bar: h('div', {}), state: h('span', {}) };
    phaseNodes.set(p.n, refs);
    const active = p.tasks.filter((t) => !t.covered);
    const covered = p.tasks.filter((t) => t.covered);
    return h('details', { class: 'phase', open: p.n === rm.phases.find((x) => x.percent < 100)?.n },
      h('summary', {}, h('span', { class: 'phase-n' }, `Phase ${p.n}`), h('span', { class: 'phase-title' }, p.title), refs.state, refs.count),
      h('div', { class: 'phase-body' }, refs.bar,
        h('p', { class: 'muted' }, `Suggested window: about ${p.weeks} weeks. ${p.note}`),
        d.roadmap.aiNotes.notes?.[p.n] ? h('p', { class: 'ai-expl' }, h('strong', {}, 'AI coach note. '), d.roadmap.aiNotes.notes[p.n]) : null,
        p.topics.length ? h('div', {}, h('h4', {}, 'Topics to learn'), h('ul', { class: 'tags' }, p.topics.map((x) => h('li', {}, x)))) : null,
        p.skills.length ? h('div', {}, h('h4', {}, 'Recommended skills'), h('ul', { class: 'tags' }, p.skills.map((x) => h('li', {}, x)))) : null,
        p.projects.length ? h('div', {}, h('h4', {}, 'Suggested projects'), h('ul', { class: 'plain spaced' }, p.projects.map((x) => h('li', {}, h('strong', {}, x.title), h('p', { class: 'muted' }, x.summary))))) : null,
        h('h4', {}, 'Practical tasks'),
        active.length ? h('ul', { class: 'tasks' }, active.map((t) => taskRow(t, p))) : h('p', { class: 'muted' }, 'Nothing needed here. You already meet the targets for this phase.'),
        covered.length ? h('details', { class: 'covered' }, h('summary', {}, `Already covered by your skill levels (${covered.length})`), h('ul', { class: 'plain' }, covered.map((t) => h('li', { class: 'muted' }, t.title)))) : null));
  };

  const notes = d.roadmap.aiNotes;
  const node = h('div', {},
    pageHead('My Roadmap', `A five-phase plan for ${rm.careerTitle}. Tasks you already cover are skipped, and the pace follows your academic year.`),
    careerSelect(rm.careerId, (id) => { sessionStorage.setItem('cp_roadmap_career', id); rerender(); }, 'Roadmap for'),
    h('div', { class: 'row-actions' },
      isTarget ? pill('This is your target career', 'accent') : h('button', { class: 'btn btn-sm', type: 'button', onclick: async () => { try { await api('PUT', '/target', { careerId: rm.careerId }); state.profile.targetCareer = rm.careerId; toast('Target career updated.'); rerender(); } catch (e) { toast(e.message, 'error'); } } }, 'Make this my target career'),
      h('a', { class: 'btn btn-sm btn-ghost', href: rm.roadmapUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Community roadmap on roadmap.sh')),
    overall,
    h('p', { class: 'source' }, notes.source === 'ai' ? h('span', {}, h('strong', {}, `Coach notes by AI (${notes.model}). `), 'Tasks and phases are generated by rules; only the notes marked "AI coach note" come from the model.') : h('span', {}, h('strong', {}, 'Rule-based roadmap. '), notes.status === 'failed' ? 'The AI request failed, so no coach notes are shown.' : 'No AI key is configured, so no AI notes are included.')),
    notes.focus?.length ? h('section', { class: 'panel' }, h('h2', {}, 'Focus this month (AI)'), h('ul', { class: 'plain' }, notes.focus.map((x) => h('li', {}, x)))) : null,
    h('div', { class: 'phases' }, rm.phases.map(phaseEl)));
  recompute();
  return node;
}
