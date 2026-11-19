import { h, api, toast } from '../lib.js';
import { state } from '../state.js';
import { go } from '../nav.js';
import { pageHead, pill, progressBar, resourceItem } from '../components.js';

const FIT_TONE = { 'Strong fit': 'ok', 'Good fit': 'ok', 'Developing fit': 'mid', Exploratory: 'neutral' };

/** Honest label for how the ranking was produced. */
export function sourceBadge(meta) {
  if (meta.source === 'ai') return h('p', { class: 'source source-ai' }, h('strong', {}, `AI-assisted (${meta.model}). `), 'Skill matching is rule-based; the AI model chose the order of the top three and wrote the explanations marked "AI explanation".');
  const why = meta.aiStatus === 'failed' ? 'The AI request failed, so these results come from the rule-based engine only.' : 'No AI key is configured on the server, so these results come from the rule-based engine only.';
  return h('p', { class: 'source' }, h('strong', {}, 'Rule-based result. '), why, ' It compares your skills and interests with each career\'s requirements. No AI model was used.');
}

const skillChips = (list, cls) => h('ul', { class: `tags ${cls || ''}` }, list.map((m) => h('li', {}, m.name + (m.level ? ` (${m.levelLabel})` : ''))));

export function careerCard(c, { target, onTarget, rank }) {
  const isTarget = target === c.id;
  return h('article', { class: 'career' },
    h('div', { class: 'career-rank', 'aria-hidden': 'true' }, String(rank ?? c.rank)),
    h('div', { class: 'career-body' },
      h('div', { class: 'career-title' }, h('h3', {}, c.title), pill(c.fit, FIT_TONE[c.fit]), isTarget ? pill('Your target', 'accent') : null),
      h('p', { class: 'career-summary' }, c.summary),
      c.aiExplanation ? h('p', { class: 'ai-expl' }, h('strong', {}, 'AI explanation. '), c.aiExplanation) : null,
      h('h4', {}, 'Why this matches you'),
      h('ul', { class: 'reasons' }, c.reasons.map((r) => h('li', {}, r))),
      c.matching.length ? h('div', {}, h('h4', {}, 'Skills you already meet'), skillChips(c.matching, 'tags-ok')) : null,
      c.additionalSkills.length ? h('div', {}, h('h4', {}, 'Skills to add or strengthen'), h('ul', { class: 'tags' }, c.additionalSkills.map((n) => h('li', {}, n)))) : null,
      h('div', { class: 'career-ready' }, h('span', {}, `Skill coverage ${c.readiness.coverage}%`), progressBar(c.readiness.coverage, `${c.title} skill coverage`), h('span', { class: 'muted' }, `${c.readiness.label}. Based on self-reported levels.`)),
      h('div', { class: 'row-actions' },
        h('a', { class: 'btn btn-sm', href: `#/careers/${c.id}` }, 'View full details'),
        isTarget ? null : h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: () => onTarget(c) }, 'Set as my target'))));
}

async function setTarget(c, rerender) {
  try { await api('PUT', '/target', { careerId: c.id }); state.profile.targetCareer = c.id; toast(`Target career set to ${c.title}.`); rerender?.(); } catch (e) { toast(e.message, 'error'); }
}

export async function careersView({ rerender }) {
  const d = await api('GET', '/recommendations');
  const top = d.items.slice(0, 3);
  const rest = d.items.slice(3);
  return h('div', {},
    pageHead('Career Recommendations', 'Ranked from your interests, skills, projects and academic year. Each result explains itself.'),
    sourceBadge(d.meta),
    d.meta.nextSteps?.length ? h('section', { class: 'panel' }, h('h2', {}, 'Suggested next steps (AI)'), h('ul', { class: 'plain' }, d.meta.nextSteps.map((s) => h('li', {}, s)))) : null,
    h('h2', { class: 'section-h' }, 'Your top three'),
    h('div', { class: 'career-list' }, top.map((c) => careerCard(c, { target: d.targetCareer, onTarget: (x) => setTarget(x, rerender) }))),
    h('h2', { class: 'section-h' }, 'Explore every other career'),
    h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', {}, h('tr', {}, ['#', 'Career', 'Fit', 'Skill coverage', ''].map((x) => h('th', { scope: 'col' }, x)))),
      h('tbody', {}, rest.map((c) => h('tr', {}, h('td', {}, String(c.rank)), h('th', { scope: 'row' }, c.title), h('td', {}, pill(c.fit, FIT_TONE[c.fit])), h('td', {}, `${c.readiness.coverage}%`), h('td', {}, h('a', { href: `#/careers/${c.id}` }, 'Details'))))))));
}

export async function careerDetailView({ params, rerender }) {
  const id = params[0];
  const [recs, rm] = await Promise.all([api('GET', '/recommendations'), api('GET', `/roadmap?career=${encodeURIComponent(id)}`)]);
  const c = recs.items.find((x) => x.id === id);
  if (!c) return h('div', {}, pageHead('Career not found', 'That career does not exist.'), h('a', { class: 'btn', href: '#/careers' }, 'Back to recommendations'));
  const st = { done: new Set(), saved: new Set() };
  const resIds = [...new Set(rm.roadmap.phases.flatMap((p) => p.tasks.flatMap((t) => t.resourceIds)))].slice(0, 8);
  const res = await api('GET', '/resources');
  st.done = new Set(res.done); st.saved = new Set(res.saved);
  return h('div', {},
    h('p', { class: 'crumb' }, h('a', { href: '#/careers' }, 'Career Recommendations'), ' / ', c.title),
    pageHead(c.title, c.summary),
    sourceBadge(recs.meta),
    careerCard(c, { target: recs.targetCareer, onTarget: (x) => setTarget(x, rerender), rank: c.rank }),
    h('section', { class: 'panel' }, h('h2', {}, 'Suggested projects'), h('ul', { class: 'plain spaced' }, c.projects.map((p) => h('li', {}, h('strong', {}, p.title), h('p', {}, p.summary))))),
    h('section', { class: 'panel' }, h('h2', {}, 'Learning roadmap'), h('p', { class: 'muted' }, `Five phases sized for a year ${state.profile.year} student (about ${rm.roadmap.horizonWeeks} weeks in total).`),
      h('ol', { class: 'phase-outline' }, rm.roadmap.phases.map((p) => h('li', {}, h('strong', {}, `Phase ${p.n}: ${p.title}`), h('span', { class: 'muted' }, ` About ${p.weeks} weeks. `), p.topics.slice(0, 4).join(', ')))),
      h('div', { class: 'row-actions' }, h('a', { class: 'btn btn-sm', href: '#/roadmap' }, 'Open my roadmap'), h('a', { class: 'btn btn-sm btn-ghost', href: c.roadmapUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Community roadmap on roadmap.sh'))),
    h('section', { class: 'panel' }, h('h2', {}, 'Relevant learning resources'),
      h('div', { class: 'resource-list' }, resIds.map((rid) => rm.resources[rid]).filter(Boolean).map((r) => resourceItem(r, st)))));
}
