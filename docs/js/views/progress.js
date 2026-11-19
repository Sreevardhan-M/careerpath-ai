import { h, api, toast, fmtDate, daysUntil } from '../lib.js';
import { state } from '../state.js';
import { pageHead, progressBar, ring, emptyState, field, pill } from '../components.js';
import { weeklyChart, readinessChart } from '../charts.js';

const stat = (label, value, sub) => h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, label), h('strong', { class: 'stat-value' }, value), sub ? h('span', { class: 'stat-sub' }, sub) : null);

export async function progressView() {
  const [{ summary: s }, { goals: initial }] = await Promise.all([api('GET', '/progress'), api('GET', '/goals')]);
  let goals = initial;

  const goalHost = h('div', {});
  const paintGoals = () => {
    goalHost.replaceChildren(goals.length ? h('ul', { class: 'goals' }, goals.map((g) => {
      const n = g.targetDate ? daysUntil(g.targetDate) : null;
      const box = h('input', { type: 'checkbox', checked: g.done, id: `g-${g.id}`, onchange: async (e) => {
        try { const r = await api('PATCH', `/goals/${g.id}`, { done: e.target.checked }); goals = r.goals; paintGoals(); toast(e.target.checked ? 'Goal reached.' : 'Goal reopened.'); } catch (err) { e.target.checked = !e.target.checked; toast(err.message, 'error'); }
      } });
      return h('li', { class: g.done ? 'is-done' : '' },
        h('label', { class: 'check', for: `g-${g.id}` }, box, h('span', {}, g.title)),
        h('span', { class: !g.done && n !== null && n < 0 ? 'overdue' : 'muted' }, g.done ? `Done ${fmtDate(g.doneAt)}` : g.targetDate ? (n < 0 ? `Overdue since ${fmtDate(g.targetDate)}` : `Due ${fmtDate(g.targetDate)}`) : 'No date'),
        h('button', { class: 'link-btn danger', type: 'button', 'aria-label': `Delete goal ${g.title}`, onclick: async () => { try { goals = (await api('DELETE', `/goals/${g.id}`)).goals; paintGoals(); } catch (err) { toast(err.message, 'error'); } } }, 'Delete'));
    })) : emptyState('No goals yet', 'Add a goal below, for example "Finish React basics", and give it a date.'));
  };
  paintGoals();

  const title = h('input', { class: 'input', type: 'text', maxLength: 120, placeholder: 'For example: finish the JavaScript roadmap tasks' });
  const date = h('input', { class: 'input', type: 'date' });
  const err = h('p', { class: 'error', role: 'alert' });
  const form = h('form', { class: 'goal-form', novalidate: true, onsubmit: async (e) => {
    e.preventDefault(); err.textContent = '';
    try { goals = (await api('POST', '/goals', { title: title.value, targetDate: date.value || null })).goals; title.value = ''; date.value = ''; paintGoals(); toast('Goal added.'); }
    catch (x) { err.textContent = x.fields?.title || x.fields?.targetDate || x.message; }
  } }, field('New learning goal', title), field('Target completion date', date), h('button', { class: 'btn btn-primary', type: 'submit' }, 'Add goal'), err);

  const earned = s.achievements.filter((a) => a.earnedAt);
  const locked = s.achievements.filter((a) => !a.earnedAt);

  return h('div', {},
    pageHead('Progress Tracking', `Progress towards ${s.careerTitle}. Everything here is saved to your account.`),
    h('section', { class: 'panel overall' }, ring(s.overall, 128, 11, 'overall'), h('div', {}, h('h2', {}, 'Overall learning progress'), h('p', { class: 'muted' }, 'The average of your roadmap completion and your skill coverage for the target career.'),
      h('div', { class: 'meter-pair' }, h('span', {}, `Roadmap ${s.roadmapPercent}%`), progressBar(s.roadmapPercent, 'Roadmap'), h('span', {}, `Skill coverage ${s.coverage.coverage}%`), progressBar(s.coverage.coverage, 'Skill coverage')))),
    h('div', { class: 'ledger' },
      stat('Skills completed', `${s.skillsCompleted.met} of ${s.skillsCompleted.total}`, 'Requirements at target level'),
      stat('Courses completed', String(s.coursesCompleted), `${s.resourcesCompleted} resources in total`),
      stat('Projects', String(s.projectsCompleted.total), `${s.projectsCompleted.built} built from roadmap, ${s.projectsCompleted.listed} in profile`),
      stat('Roadmap', `${s.roadmapDone} of ${s.roadmapTotal}`, 'Tasks complete')),
    h('div', { class: 'cols' },
      h('section', { class: 'panel' }, h('h2', {}, 'Weekly learning activity'), h('p', { class: 'muted' }, 'Tasks, resources, goals and skill updates per week.'), weeklyChart(s.weekly)),
      h('section', { class: 'panel' }, h('h2', {}, 'Career readiness over time'), h('p', { class: 'muted' }, `Skill coverage for ${s.careerTitle}, based on self-reported levels.`), s.readinessHistory.length ? readinessChart(s.readinessHistory) : emptyState('No history yet', 'Update a skill level to start the timeline.'))),
    h('section', { class: 'panel' }, h('h2', {}, 'Roadmap by phase'), h('ul', { class: 'phase-bars' }, s.phases.map((p) => h('li', {}, h('span', {}, `Phase ${p.n}: ${p.title}`), progressBar(p.percent, `Phase ${p.n}`), h('span', { class: 'muted' }, `${p.done} of ${p.total}`))))),
    h('section', { class: 'panel' }, h('h2', {}, 'Learning goals'), goalHost, form),
    h('section', { class: 'panel' }, h('h2', {}, 'Achievements'),
      earned.length ? h('ul', { class: 'achievements' }, earned.map((a) => h('li', {}, h('strong', {}, a.title), h('p', { class: 'muted' }, `${a.detail} Earned ${fmtDate(a.earnedAt)}.`)))) : emptyState('No achievements yet', 'Complete a roadmap task to earn your first.'),
      locked.length ? h('details', { class: 'covered' }, h('summary', {}, `Still to earn (${locked.length})`), h('ul', { class: 'plain' }, locked.map((a) => h('li', { class: 'muted' }, `${a.title}: ${a.detail}`)))) : null));
}
