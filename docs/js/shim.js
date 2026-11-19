// Browser-only stand-in for the CareerPath AI server, used for this preview.
// It runs the same catalogue, validation and rule-based engine as the real backend and keeps data in this browser.
import { LEVELS, levelLabel, CATEGORIES, SKILLS, COLLEGES, DEGREES, DEPARTMENT, INTERESTS, STUDY_TIMES, EXPERIENCE_TYPES } from '../server/data/skills.js';
import { CAREERS, CAREER_BY_ID } from '../server/data/careers.js';
import { RESOURCES, RESOURCE_BY_ID, COST_LABELS, RESOURCE_CATEGORIES, DIFFICULTIES } from '../server/data/resources.js';
import { recommendCareers, analyseGap, buildRoadmap, profileCompletion } from '../server/services/engine.js';
import { HttpError, validateProfile, validateEmail, validatePassword, validateGoal } from '../server/validate.js';

// Storage that never throws.
function mem() { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() }; }
for (const name of ['localStorage', 'sessionStorage']) {
  try { window[name].setItem('__t', '1'); window[name].removeItem('__t'); }
  catch { Object.defineProperty(window, name, { value: mem(), configurable: true }); }
}

const KEY = 'cp_preview_db_v1';
const fresh = () => ({ user: null, loggedIn: false, profile: null, progress: { task: [], resource_done: [], resource_saved: [] }, goals: [], activity: [], achievements: {}, history: {}, nextGoal: 1 });
let db = fresh();
try { db = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* start fresh */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } };
const now = () => new Date().toISOString();
const today = () => now().slice(0, 10);
const has = (kind, key) => db.progress[kind].includes(key);
const setP = (kind, key, on) => { const s = new Set(db.progress[kind]); on ? s.add(key) : s.delete(key); db.progress[kind] = [...s]; };
const log = (type, label) => db.activity.push({ type, label: label.slice(0, 200), createdAt: now() });
const target = (p) => p.targetCareer || recommendCareers(p)[0].id;
const rdict = (ids) => Object.fromEntries([...new Set(ids)].filter((i) => RESOURCE_BY_ID.has(i)).map((i) => [i, RESOURCE_BY_ID.get(i)]));
const needProfile = () => { if (!db.loggedIn || !db.profile) throw new HttpError(401, 'Please sign in.'); return db.profile; };

function weekStart(d) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x; }
function weekly(weeks = 8) {
  const start = weekStart(new Date()); start.setUTCDate(start.getUTCDate() - 7 * (weeks - 1));
  const b = Array.from({ length: weeks }, (_, i) => { const d = new Date(start); d.setUTCDate(d.getUTCDate() + 7 * i); return { weekStart: d.toISOString().slice(0, 10), count: 0 }; });
  for (const a of db.activity) { if (!['task', 'resource', 'skill', 'goal'].includes(a.type)) continue; const w = weekStart(new Date(a.createdAt)).toISOString().slice(0, 10); const x = b.find((y) => y.weekStart === w); if (x) x.count++; }
  return b;
}

const ACH = [
  ['first-task', 'First step taken', 'Completed your first roadmap task.', (c) => c.tasksDone >= 1],
  ['ten-tasks', 'Ten tasks done', 'Completed ten roadmap tasks.', (c) => c.tasksDone >= 10],
  ['phase-1', 'Fundamentals complete', 'Finished every task in Phase 1.', (c) => c.phase1Done],
  ['first-project', 'First project built', 'Marked a roadmap project as complete.', (c) => c.projectsDone >= 1],
  ['three-resources', 'Three resources finished', 'Completed three learning resources.', (c) => c.resourcesDone >= 3],
  ['skill-up', 'Levelled up', 'Raised the level of a skill.', (c) => c.skillUps >= 1],
  ['goal-met', 'Goal reached', 'Completed one of your learning goals.', (c) => c.goalsDone >= 1],
  ['halfway', 'Halfway to coverage', 'Reached 50 percent skill coverage for your target career.', (c) => c.coverage >= 50],
  ['profile-full', 'Complete profile', 'Filled in every part of your profile.', (c) => c.profile >= 100],
];

function summarise(p) {
  const id = target(p);
  const rm = buildRoadmap(p, id, new Set(db.progress.task));
  const gap = analyseGap(p, id);
  const resDone = db.progress.resource_done.filter((i) => RESOURCE_BY_ID.has(i));
  const courses = resDone.filter((i) => ['Free course', 'Certification'].includes(RESOURCE_BY_ID.get(i).category)).length;
  const built = rm.phases.flatMap((x) => x.tasks.filter((t) => t.kind === 'project' && t.done)).length;
  const comp = profileCompletion(p);
  const p1 = rm.phases.find((x) => x.n === 1);
  const ctx = { tasksDone: rm.done, projectsDone: built, resourcesDone: resDone.length, skillUps: db.activity.filter((a) => a.type === 'skill' && a.label.startsWith('Raised ')).length, goalsDone: db.goals.filter((g) => g.done).length, coverage: gap.coverage.coverage, profile: comp.percent, phase1Done: !!p1 && p1.total > 0 && p1.done === p1.total };
  for (const [k, , , t] of ACH) if (!db.achievements[k] && t(ctx)) db.achievements[k] = now();
  return {
    careerId: id, careerTitle: rm.careerTitle, overall: Math.round((rm.percent + gap.coverage.coverage) / 2), roadmapPercent: rm.percent, roadmapDone: rm.done, roadmapTotal: rm.total,
    skillsCompleted: { met: gap.coverage.met, total: gap.coverage.total }, coverage: gap.coverage, coursesCompleted: courses, resourcesCompleted: resDone.length,
    projectsCompleted: { built, listed: p.projects.length, total: built + p.projects.length }, weekly: weekly(),
    readinessHistory: Object.entries(db.history).sort().slice(-30).map(([day, coverage]) => ({ day, coverage })),
    achievements: ACH.map(([key, title, detail]) => ({ key, title, detail, earnedAt: db.achievements[key] || null })),
    phases: rm.phases.map((x) => ({ n: x.n, title: x.title, done: x.done, total: x.total, percent: x.percent })),
  };
}
function touch(p) { db.history[today()] = coverageOf(p); summarise(p); save(); }
const coverageOf = (p) => analyseGap(p, target(p)).coverage.coverage;
const goalsOut = () => [...db.goals].sort((a, b) => a.done - b.done || (a.targetDate || '9999').localeCompare(b.targetDate || '9999') || b.id - a.id);

const routes = {
  'GET /catalog': () => ({ levels: LEVELS, categories: CATEGORIES, skills: SKILLS, colleges: COLLEGES, degrees: DEGREES, department: DEPARTMENT, interests: INTERESTS, studyTimes: STUDY_TIMES, experienceTypes: EXPERIENCE_TYPES, careers: CAREERS.map((c) => ({ id: c.id, title: c.title })), resourceCategories: RESOURCE_CATEGORIES, difficulties: DIFFICULTIES, costLabels: COST_LABELS, ai: { configured: false } }),
  'POST /auth/register': ({ body }) => {
    const email = validateEmail(body.email); validatePassword(body.password);
    const profile = validateProfile(body.profile);
    profile.targetCareer = profile.targetCareer || recommendCareers(profile)[0].id;
    db = { ...fresh(), user: { id: 1, email, password: body.password }, loggedIn: true, profile };
    log('profile', 'Created your profile'); touch(profile);
    return { status: 201, body: { user: { id: 1, email }, profile } };
  },
  'POST /auth/login': ({ body }) => {
    if (!db.user || db.user.email !== String(body.email || '').trim().toLowerCase() || db.user.password !== body.password) throw new HttpError(401, 'Email or password is incorrect.');
    db.loggedIn = true; save(); return { user: { id: 1, email: db.user.email }, profile: db.profile };
  },
  'POST /auth/logout': () => { db.loggedIn = false; save(); return { ok: true }; },
  'GET /me': () => { if (!db.loggedIn) throw new HttpError(401, 'Please sign in.'); return { user: { id: 1, email: db.user.email }, profile: db.profile, completion: profileCompletion(db.profile), ai: { configured: false, model: null } }; },
  'PUT /profile': ({ body }) => {
    const old = needProfile(); const next = validateProfile({ ...body, targetCareer: body.targetCareer ?? old.targetCareer });
    const m = new Map(old.skills.map((s) => [s.name.toLowerCase(), s]));
    for (const s of next.skills) { const pr = m.get(s.name.toLowerCase()); if (!pr) log('skill', `Added ${s.name} at ${levelLabel(s.level)}`); else if (s.level > pr.level) log('skill', `Raised ${s.name} from ${levelLabel(pr.level)} to ${levelLabel(s.level)}`); else if (s.level < pr.level) log('skill', `Changed ${s.name} to ${levelLabel(s.level)}`); }
    db.profile = next; touch(next); return { profile: next, completion: profileCompletion(next) };
  },
  'PUT /target': ({ body }) => { const p = needProfile(); if (!CAREER_BY_ID.has(body.careerId)) throw new HttpError(422, 'Unknown career.'); p.targetCareer = body.careerId; log('profile', `Set target career to ${CAREER_BY_ID.get(body.careerId).title}`); touch(p); return { profile: p }; },
  'GET /recommendations': () => { const p = needProfile(); return { items: recommendCareers(p), meta: { source: 'rules', aiStatus: 'not_configured', nextSteps: [] }, targetCareer: target(p) }; },
  'GET /gap': ({ q }) => { const p = needProfile(); const id = q.get('career') || target(p); if (!CAREER_BY_ID.has(id)) throw new HttpError(404, 'Unknown career.'); const gap = analyseGap(p, id); return { gap, resources: rdict(gap.priority.flatMap((r) => r.resourceIds)), targetCareer: target(p) }; },
  'GET /roadmap': ({ q }) => {
    const p = needProfile(); const id = q.get('career') || target(p); if (!CAREER_BY_ID.has(id)) throw new HttpError(404, 'Unknown career.');
    const rm = buildRoadmap(p, id, new Set(db.progress.task)); rm.aiNotes = { source: 'none', status: 'not_configured', notes: {}, focus: [] };
    return { roadmap: rm, resources: rdict(rm.phases.flatMap((x) => x.tasks.flatMap((t) => t.resourceIds))), targetCareer: target(p) };
  },
  'GET /resources': () => {
    const p = needProfile(); const gap = analyseGap(p, target(p));
    const gapIds = [...new Set(gap.priority.flatMap((r) => r.resourceIds))];
    const cs = new Set(CAREER_BY_ID.get(target(p)).skills.flatMap((e) => e.anyOf || [e.name]).map((n) => n.toLowerCase()));
    const resources = RESOURCES.map((r) => ({ ...r, careers: [...new Set([...r.careers, ...CAREERS.filter((c) => c.skills.some((e) => (e.anyOf || [e.name]).some((n) => r.skills.includes(n)))).map((c) => c.id)])] }));
    return { resources, gapIds, targetCareer: target(p), careerSkills: [...cs], done: [...db.progress.resource_done], saved: [...db.progress.resource_saved] };
  },
  'POST /progress': ({ body }) => {
    const p = needProfile(); const { kind, key } = body; const done = !!body.done;
    if (kind === 'task') {
      const m = /^([a-z-]+):p[1-5]:[a-z0-9-]+$/.exec(String(key)); if (!m || !CAREER_BY_ID.has(m[1])) throw new HttpError(422, 'Unknown task.');
      const t = buildRoadmap(p, m[1], new Set()).phases.flatMap((x) => x.tasks).find((x) => x.id === key); if (!t || t.covered) throw new HttpError(422, 'Unknown task.');
      setP('task', key, done); if (done) log('task', `Completed: ${t.title}`);
    } else if (kind === 'resource_done' || kind === 'resource_saved') {
      const r = RESOURCE_BY_ID.get(key); if (!r) throw new HttpError(422, 'Unknown resource.');
      setP(kind, key, done); if (done) log(kind === 'resource_done' ? 'resource' : 'save', `${kind === 'resource_done' ? 'Finished' : 'Saved'}: ${r.title}`);
    } else throw new HttpError(422, 'Unknown progress type.');
    touch(p); return { ok: true };
  },
  'GET /progress': () => ({ summary: summarise(needProfile()) }),
  'POST /progress/reset': () => { const p = needProfile(); db.progress = { task: [], resource_done: [], resource_saved: [] }; db.activity = []; db.achievements = {}; db.goals = []; db.history = {}; touch(p); return { ok: true }; },
  'GET /goals': () => { needProfile(); return { goals: goalsOut() }; },
  'POST /goals': ({ body }) => { needProfile(); const g = validateGoal(body); db.goals.push({ id: db.nextGoal++, title: g.title, targetDate: g.targetDate, done: false, createdAt: now(), doneAt: null }); save(); return { status: 201, body: { goals: goalsOut() } }; },
  'PATCH /goals/:id': ({ params, body }) => {
    const p = needProfile(); const g = db.goals.find((x) => x.id === Number(params.id)); if (!g) throw new HttpError(404, 'Goal not found.');
    const v = validateGoal({ title: body.title ?? g.title, targetDate: body.targetDate === undefined ? g.targetDate : body.targetDate });
    const done = body.done === undefined ? g.done : !!body.done; if (done && !g.done) log('goal', `Reached goal: ${v.title}`);
    Object.assign(g, { title: v.title, targetDate: v.targetDate, done, doneAt: done ? g.doneAt || now() : null }); touch(p); return { goals: goalsOut() };
  },
  'DELETE /goals/:id': ({ params }) => { needProfile(); db.goals = db.goals.filter((x) => x.id !== Number(params.id)); save(); return { goals: goalsOut() }; },
  'GET /dashboard': () => {
    const p = needProfile(); const items = recommendCareers(p); const id = target(p); const gap = analyseGap(p, id); const summary = summarise(p);
    const rm = buildRoadmap(p, id, new Set(db.progress.task));
    const nextTasks = rm.phases.flatMap((x) => x.tasks.filter((t) => !t.covered && !t.done).map((t) => ({ ...t, phase: x.n, phaseTitle: x.title }))).slice(0, 4);
    save();
    return { profile: p, completion: profileCompletion(p), top: items.slice(0, 3), meta: { source: 'rules', aiStatus: 'not_configured', nextSteps: [] },
      gap: { careerId: id, careerTitle: gap.careerTitle, coverage: gap.coverage, strong: gap.strong.length, improve: gap.improve.length, missing: gap.missing.length, priority: gap.priority.slice(0, 3) },
      summary, nextTasks, goals: goalsOut().filter((g) => !g.done).slice(0, 4), activity: db.activity.filter((a) => a.type !== 'save').slice(-6).reverse(), resources: {} };
  },
  'POST /account/password': ({ body }) => { needProfile(); if (db.user.password !== body.current) throw new HttpError(403, 'Current password is incorrect.', { current: 'Current password is incorrect.' }); db.user.password = validatePassword(body.next); save(); return { ok: true }; },
  'DELETE /account': ({ body }) => { needProfile(); if (db.user.password !== body.password) throw new HttpError(403, 'Password is incorrect.', { password: 'Password is incorrect.' }); db = fresh(); save(); return { ok: true }; },
  'GET /export': () => ({ exportedAt: now(), email: db.user?.email, profile: db.profile, progress: db.progress, goals: db.goals, activity: db.activity, achievements: db.achievements }),
};

function match(method, path) {
  for (const [k, h] of Object.entries(routes)) {
    const [m, pat] = k.split(' '); if (m !== method) continue;
    const keys = []; const re = new RegExp('^' + pat.replace(/:([a-z]+)/g, (_, n) => { keys.push(n); return '([^/]+)'; }) + '$');
    const r = re.exec(path); if (r) return { h, params: Object.fromEntries(keys.map((n, i) => [n, r[i + 1]])) };
  }
  return null;
}

const realFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.href);
  if (!url.pathname.includes('/api/')) return realFetch(input, init);
  const path = url.pathname.slice(url.pathname.indexOf('/api/') + 4);
  const method = (init.method || 'GET').toUpperCase();
  const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
  try {
    const m = match(method, path); if (!m) throw new HttpError(404, 'Not found.');
    const body = init.body ? JSON.parse(init.body) : {};
    const out = await m.h({ body, q: url.searchParams, params: m.params });
    return out && typeof out === 'object' && 'status' in out && 'body' in out ? json(out.status, out.body) : json(200, out);
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.message, fields: e.fields });
    console.error(e); return json(500, { error: 'Something went wrong in the preview.' });
  }
};
