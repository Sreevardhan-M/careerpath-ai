import { h, api, fmtDate, timeAgo, daysUntil } from '../lib.js';
import { state, levelName } from '../state.js';
import { pageHead, progressBar, pill, ring, levelMeter, emptyState } from '../components.js';
import { sourceBadge } from './careers.js';

const stat = (label, value, sub) => h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, label), h('strong', { class: 'stat-value' }, value), sub ? h('span', { class: 'stat-sub' }, sub) : null);

export async function dashboardView() {
  const d = await api('GET', '/dashboard');
  const p = d.profile;
  const first = p.name.split(' ')[0];
  const s = d.summary;
  const topSkills = [...p.skills].sort((a, b) => b.level - a.level).slice(0, 6);

  return h('div', {},
    pageHead(`Welcome, ${first}`, `Year ${p.year} ${p.degree} ${p.department.match(/\(([^)]+)\)/)?.[1] || ''} at ${p.college}. Working towards ${s.careerTitle}.`),
    h('div', { class: 'ledger' },
      stat('Overall progress', `${s.overall}%`, 'Average of roadmap and skill coverage'),
      stat('Skill coverage', `${s.coverage.coverage}%`, `${s.coverage.met} of ${s.coverage.total} requirements met`),
      stat('Roadmap', `${s.roadmapPercent}%`, `${s.roadmapDone} of ${s.roadmapTotal} tasks`),
      stat('Profile', `${d.completion.percent}%`, 'Completion')),

    h('div', { class: 'cols' },
      h('section', { class: 'panel' }, h('h2', {}, 'Top recommended careers'), sourceBadge(d.meta),
        h('ol', { class: 'rank-list' }, d.top.map((c) => h('li', {}, h('div', {}, h('a', { class: 'rank-title', href: `#/careers/${c.id}` }, c.title), h('p', { class: 'muted' }, c.reasons[0])), pill(c.fit, c.fit.includes('Strong') || c.fit.includes('Good') ? 'ok' : 'mid')))),
        h('a', { class: 'btn btn-sm', href: '#/careers' }, 'See all careers')),
      h('section', { class: 'panel' }, h('h2', {}, 'Skill gap summary'), h('p', { class: 'muted' }, `Target: ${d.gap.careerTitle}`),
        h('div', { class: 'gap-counts' }, h('span', {}, h('strong', {}, d.gap.strong), ' strong'), h('span', {}, h('strong', {}, d.gap.improve), ' to improve'), h('span', {}, h('strong', {}, d.gap.missing), ' missing')),
        h('h3', { class: 'h-sm' }, 'Learn first'),
        d.gap.priority.length ? h('ul', { class: 'plain' }, d.gap.priority.map((r) => h('li', {}, h('strong', {}, r.name), ' ', pill(r.priority, r.priority === 'High' ? 'low' : 'mid'), h('span', { class: 'muted' }, ` ${r.levelLabel} to ${r.targetLabel}`)))) : h('p', { class: 'muted' }, 'You meet every requirement for this career. Build projects to prove it.'),
        h('a', { class: 'btn btn-sm', href: '#/gap' }, 'Open gap analysis'))),

    h('div', { class: 'cols' },
      h('section', { class: 'panel' }, h('h2', {}, 'Current skill overview'),
        topSkills.length ? h('ul', { class: 'skill-lines' }, topSkills.map((k) => h('li', {}, h('span', {}, k.name), h('span', { class: 'mini-level' }, levelName(k.level), levelMeter(k.level))))) : emptyState('No skills yet', 'Add skills to see your overview.', h('a', { class: 'btn btn-sm', href: '#/skills' }, 'Add skills')),
        h('p', { class: 'muted' }, 'Self-reported levels.'), h('a', { class: 'btn btn-sm', href: '#/skills' }, 'Manage skills')),
      h('section', { class: 'panel' }, h('h2', {}, 'Learning roadmap progress'),
        h('div', { class: 'ring-row' }, ring(s.roadmapPercent, 104, 9, 'done'), h('div', {}, h('p', {}, `${s.roadmapDone} of ${s.roadmapTotal} tasks complete`), progressBar(s.roadmapPercent, 'Roadmap progress'))),
        h('h3', { class: 'h-sm' }, 'Next tasks'),
        d.nextTasks.length ? h('ul', { class: 'plain' }, d.nextTasks.map((t) => h('li', {}, t.title, h('span', { class: 'muted' }, ` Phase ${t.phase}`)))) : h('p', { class: 'muted' }, 'Every task is complete.'),
        h('a', { class: 'btn btn-sm', href: '#/roadmap' }, 'Open roadmap'))),

    h('div', { class: 'cols' },
      h('section', { class: 'panel' }, h('h2', {}, 'Upcoming learning goals'),
        d.goals.length ? h('ul', { class: 'plain spaced' }, d.goals.map((g) => { const n = g.targetDate ? daysUntil(g.targetDate) : null; return h('li', {}, h('strong', {}, g.title), g.targetDate ? h('p', { class: n < 0 ? 'overdue' : 'muted' }, n < 0 ? `Overdue since ${fmtDate(g.targetDate)}` : n === 0 ? 'Due today' : `Due ${fmtDate(g.targetDate)} (${n} days)`) : h('p', { class: 'muted' }, 'No date set')); })) : emptyState('No goals yet', 'Set a goal with a target date to stay on track.'),
        h('a', { class: 'btn btn-sm', href: '#/progress' }, 'Manage goals')),
      h('section', { class: 'panel' }, h('h2', {}, 'Recently completed activities'),
        d.activity.length ? h('ul', { class: 'activity' }, d.activity.map((a) => h('li', {}, h('span', {}, a.label), h('time', { datetime: a.createdAt }, timeAgo(a.createdAt))))) : emptyState('Nothing yet', 'Complete a roadmap task or finish a resource and it will show here.'))));
}
