import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../server/db.js';
import { createApp } from '../server/index.js';
import { recommendCareers, analyseGap, buildRoadmap } from '../server/services/engine.js';
import { RESOURCES } from '../server/data/resources.js';
import { CAREERS, entrySkillNames } from '../server/data/careers.js';
import { SKILLS } from '../server/data/skills.js';

let server, base, cookie = '';

const sk = (name, level, extra = {}) => ({ name, level, studyTime: '10to50', confidence: 3, hasProject: false, ...extra });
const profile = (over = {}) => ({
  name: 'Asha Rao', college: 'NMAM Institute of Technology (NMAMIT)', degree: 'B.E', year: 3,
  interests: ['Web Development'],
  skills: [sk('HTML', 3), sk('CSS', 3), sk('JavaScript', 2), sk('React', 1), sk('SQL', 2)],
  projects: [], experience: [], ...over,
});

async function api(method, path, body, { keepCookie = true } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie && keepCookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* static */ }
  return { status: res.status, json, text, headers: res.headers };
}

before(async () => {
  delete process.env.ANTHROPIC_API_KEY;
  server = createApp({ db: openDb(':memory:') });
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('every skill and resource referenced by careers exists', () => {
  const known = new Set(SKILLS.map((s) => s.name));
  for (const c of CAREERS) for (const e of c.skills) for (const n of entrySkillNames(e)) assert.ok(known.has(n), `${c.id} references unknown skill ${n}`);
  for (const c of CAREERS) for (const e of c.skills) {
    const has = RESOURCES.some((r) => entrySkillNames(e).some((n) => r.skills.includes(n)));
    assert.ok(has, `${c.id}: no resource for ${e.name}`);
  }
  const ids = RESOURCES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate resource ids');
  for (const r of RESOURCES) assert.match(r.url, /^https:\/\//);
});

test('recommendations are explainable and follow interests and skills', () => {
  const recs = recommendCareers(profile());
  assert.equal(recs.length, 13);
  assert.ok(['full-stack', 'frontend'].includes(recs[0].id), `top was ${recs[0].id}`);
  for (const r of recs) {
    assert.ok(r.reasons.length >= 2);
    assert.equal(typeof r.readiness.coverage, 'number');
    assert.ok(!('score' in r) || r.score === undefined);
  }
  const ds = recommendCareers(profile({ interests: ['Data Science and Analytics'], skills: [sk('Python', 3), sk('SQL', 3), sk('Statistics', 3)] }));
  assert.ok(['data-scientist', 'data-analyst'].includes(ds[0].id), `top was ${ds[0].id}`);
});

test('student with no skills still gets recommendations that say so', () => {
  const recs = recommendCareers(profile({ skills: [], interests: ['Not Sure Yet'], year: 1 }));
  assert.equal(recs.length, 13);
  assert.ok(recs[0].reasons.some((r) => /Not Sure Yet|fresh start/.test(r)));
});

test('skill gap classifies strong, improve and missing', () => {
  const gap = analyseGap(profile(), 'full-stack');
  assert.ok(gap.strong.some((r) => r.name === 'HTML'));
  assert.ok(gap.improve.some((r) => r.name === 'JavaScript'));
  assert.ok(gap.missing.some((r) => r.name === 'Node.js'));
  assert.equal(gap.priority[0].priority, 'High');
  for (const r of gap.priority) assert.ok(r.resourceIds.length > 0, `${r.name} has no resources`);
});

test('anyOf requirements use the best matching skill', () => {
  const gap = analyseGap(profile({ skills: [sk('Python', 4)] }), 'backend');
  const lang = gap.rows.find((r) => r.anyOf);
  assert.equal(lang.status, 'strong');
  assert.equal(lang.via, 'Python');
});

test('roadmap adapts to proficiency and keeps stable task ids', () => {
  const rm = buildRoadmap(profile(), 'full-stack', new Set());
  assert.equal(rm.phases.length, 5);
  const html = rm.phases[0].tasks.find((t) => t.skill === 'HTML');
  assert.ok(html.covered, 'HTML at target should be marked covered');
  const done = new Set(['full-stack:p1:javascript']);
  const rm2 = buildRoadmap(profile(), 'full-stack', done);
  assert.equal(rm2.done, 1);
  assert.ok(rm2.percent > 0 && rm2.percent < 100);
  const rmFinal = buildRoadmap(profile({ year: 4 }), 'full-stack', new Set());
  assert.ok(rmFinal.horizonWeeks < rm.horizonWeeks, 'final year gets a shorter horizon');
});

test('auth, onboarding payload validation and persistence', async () => {
  let r = await api('GET', '/api/me');
  assert.equal(r.status, 401);

  r = await api('POST', '/api/auth/register', { email: 'bad', password: 'password123', profile: profile() }, { keepCookie: false });
  assert.equal(r.status, 422);

  r = await api('POST', '/api/auth/register', { email: 'a@example.com', password: 'short', profile: profile() }, { keepCookie: false });
  assert.equal(r.status, 422);

  r = await api('POST', '/api/auth/register', { email: 'a@example.com', password: 'password123', profile: profile({ college: 'Unknown College' }) }, { keepCookie: false });
  assert.equal(r.status, 422);
  assert.ok(r.json.fields.college);

  r = await api('POST', '/api/auth/register', { email: 'a@example.com', password: 'password123', profile: profile({ skills: [{ name: 'React', level: 0 }] }) }, { keepCookie: false });
  assert.equal(r.status, 422);

  r = await api('POST', '/api/auth/register', { email: 'a@example.com', password: 'password123', profile: profile() }, { keepCookie: false });
  assert.equal(r.status, 201);
  assert.ok(cookie.startsWith('cp_session='));
  assert.ok(r.json.profile.targetCareer);

  r = await api('POST', '/api/auth/register', { email: 'a@example.com', password: 'password123', profile: profile() }, { keepCookie: false });
  assert.equal(r.status, 409);

  r = await api('GET', '/api/me');
  assert.equal(r.status, 200);
  assert.equal(r.json.profile.name, 'Asha Rao');
  assert.equal(r.json.profile.college, 'NMAM Institute of Technology (NMAMIT)');
});

test('both colleges and every year are accepted', async () => {
  for (const college of ['Sapthagiri NPS College', 'NMAM Institute of Technology (NMAMIT)']) {
    for (const year of [1, 2, 3, 4]) {
      const email = `u${Math.random().toString(36).slice(2)}@example.com`;
      const saved = cookie;
      const r = await api('POST', '/api/auth/register', { email, password: 'password123', profile: profile({ college, year }) }, { keepCookie: false });
      assert.equal(r.status, 201, `${college} year ${year}`);
      assert.equal(r.json.profile.college, college);
      assert.equal(r.json.profile.year, year);
      cookie = saved;
    }
  }
});

test('profile editing, skill levels, custom skills and aliases', async () => {
  let r = await api('GET', '/api/me');
  const p = r.json.profile;
  p.skills = p.skills.map((s) => (s.name === 'React' ? { ...s, level: 3 } : s));
  p.skills.push({ name: 'reactjs', level: 2 }); // alias of existing React: deduplicated
  p.skills.push({ name: 'Rust', level: 1, category: 'Programming' });
  p.skills.push({ name: 'node', level: 2 });
  r = await api('PUT', '/api/profile', p);
  assert.equal(r.status, 200);
  const names = r.json.profile.skills.map((s) => s.name);
  assert.equal(names.filter((n) => n === 'React').length, 1);
  assert.ok(names.includes('Node.js'), 'alias maps to catalogue');
  const rust = r.json.profile.skills.find((s) => s.name === 'Rust');
  assert.equal(rust.custom, true);

  r = await api('GET', '/api/me');
  assert.equal(r.json.profile.skills.find((s) => s.name === 'React').level, 3);
  assert.ok(r.json.completion.percent > 0);
});

test('recommendations, gap, resources endpoints', async () => {
  let r = await api('GET', '/api/recommendations');
  assert.equal(r.status, 200);
  assert.equal(r.json.meta.source, 'rules');
  assert.equal(r.json.meta.aiStatus, 'not_configured');
  assert.equal(r.json.items.length, 13);

  r = await api('GET', '/api/gap?career=full-stack');
  assert.equal(r.status, 200);
  assert.ok(Object.keys(r.json.resources).length > 0);
  r = await api('GET', '/api/gap?career=nope');
  assert.equal(r.status, 404);

  r = await api('GET', '/api/resources');
  assert.equal(r.status, 200);
  assert.ok(r.json.resources.length > 100);
  assert.ok(r.json.gapIds.length > 0);
});

test('roadmap tasks and resource state persist and drive progress', async () => {
  let r = await api('PUT', '/api/target', { careerId: 'full-stack' });
  assert.equal(r.status, 200);
  r = await api('GET', '/api/roadmap');
  const task = r.json.roadmap.phases[0].tasks.find((t) => !t.covered);
  r = await api('POST', '/api/progress', { kind: 'task', key: task.id, done: true });
  assert.equal(r.status, 200);
  r = await api('POST', '/api/progress', { kind: 'task', key: 'full-stack:p1:made-up', done: true });
  assert.equal(r.status, 422);
  r = await api('POST', '/api/progress', { kind: 'resource_done', key: 'full-stack-open', done: true });
  assert.equal(r.status, 200);
  r = await api('POST', '/api/progress', { kind: 'resource_saved', key: 'react-learn', done: true });
  r = await api('POST', '/api/progress', { kind: 'resource_done', key: 'not-real', done: true });
  assert.equal(r.status, 422);

  r = await api('GET', '/api/roadmap');
  assert.ok(r.json.roadmap.done >= 1);
  r = await api('GET', '/api/resources');
  assert.ok(r.json.done.includes('full-stack-open'));
  assert.ok(r.json.saved.includes('react-learn'));

  r = await api('GET', '/api/progress');
  const s = r.json.summary;
  assert.ok(s.roadmapDone >= 1 && s.coursesCompleted >= 1 && s.resourcesCompleted >= 1);
  assert.equal(s.weekly.length, 8);
  assert.ok(s.weekly.reduce((n, w) => n + w.count, 0) >= 2);
  assert.ok(s.achievements.find((a) => a.key === 'first-task').earnedAt);
  assert.ok(s.readinessHistory.length >= 1);

  r = await api('POST', '/api/progress', { kind: 'task', key: task.id, done: false });
  r = await api('GET', '/api/roadmap');
  assert.equal(r.json.roadmap.done, 0);
});

test('goals CRUD with validation', async () => {
  let r = await api('POST', '/api/goals', { title: 'x' });
  assert.equal(r.status, 422);
  r = await api('POST', '/api/goals', { title: 'Finish React basics', targetDate: '2026-12-31' });
  assert.equal(r.status, 201);
  const id = r.json.goals[0].id;
  r = await api('PATCH', `/api/goals/${id}`, { done: true });
  assert.equal(r.json.goals[0].done, true);
  r = await api('GET', '/api/progress');
  assert.ok(r.json.summary.achievements.find((a) => a.key === 'goal-met').earnedAt);
  r = await api('DELETE', `/api/goals/${id}`);
  assert.equal(r.json.goals.length, 0);
});

test('dashboard, export and settings', async () => {
  let r = await api('GET', '/api/dashboard');
  assert.equal(r.status, 200);
  assert.equal(r.json.top.length, 3);
  assert.ok(r.json.summary && r.json.gap && Array.isArray(r.json.nextTasks));
  r = await api('GET', '/api/export');
  assert.equal(r.status, 200);
  assert.ok(r.json.profile.name);
  r = await api('POST', '/api/account/password', { current: 'wrong-password', next: 'newpassword1' });
  assert.equal(r.status, 403);
  r = await api('POST', '/api/account/password', { current: 'password123', next: 'newpassword1' });
  assert.equal(r.status, 200);
});

test('logout, login rules and rate limiting', async () => {
  let r = await api('POST', '/api/auth/logout', {});
  assert.equal(r.status, 200);
  cookie = '';
  r = await api('GET', '/api/me');
  assert.equal(r.status, 401);
  r = await api('POST', '/api/auth/login', { email: 'a@example.com', password: 'password123' });
  assert.equal(r.status, 401, 'old password no longer valid');
  r = await api('POST', '/api/auth/login', { email: 'a@example.com', password: 'newpassword1' });
  assert.equal(r.status, 200);
  r = await api('GET', '/api/me');
  assert.equal(r.status, 200);
  let last;
  for (let i = 0; i < 12; i++) last = await api('POST', '/api/auth/login', { email: 'ratelimit@example.com', password: 'nope-nope' }, { keepCookie: false });
  assert.equal(last.status, 429);
});

test('cross-origin writes and bad paths are rejected', async () => {
  const res = await fetch(base + '/api/goals', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example', cookie }, body: JSON.stringify({ title: 'abc' }) });
  assert.equal(res.status, 403);
  const t = await fetch(base + '/..%2f..%2fetc%2fpasswd');
  assert.ok([403, 404, 200].includes(t.status));
  const body = await t.text();
  assert.ok(!body.includes('root:'));
});

test('ALLOWED_ORIGINS lets a configured frontend write, others stay blocked', async () => {
  process.env.ALLOWED_ORIGINS = 'https://careerpath.vercel.app/';
  try {
    const send = (origin) => fetch(base + '/api/goals', { method: 'POST', headers: { 'content-type': 'application/json', origin, cookie }, body: JSON.stringify({ title: 'Origin test goal' }) });
    assert.equal((await send('https://careerpath.vercel.app')).status, 201);
    assert.equal((await send('https://evil.example')).status, 403);
  } finally { delete process.env.ALLOWED_ORIGINS; }
});

test('admin user list is hidden without a token and protected with one', async () => {
  const get = (auth) => fetch(base + '/api/admin/users', { headers: auth ? { authorization: auth } : {} });
  assert.equal((await get()).status, 404, 'disabled when ADMIN_TOKEN is unset');
  process.env.ADMIN_TOKEN = 'test-admin-token-1234567890';
  try {
    assert.equal((await get()).status, 401);
    assert.equal((await get('Bearer wrong')).status, 401);
    const ok = await get('Bearer test-admin-token-1234567890');
    assert.equal(ok.status, 200);
    const body = await ok.json();
    assert.ok(body.count >= 1 && body.users[0].email.includes('@'));
    assert.ok(!JSON.stringify(body).match(/password|salt|hash/i), 'no secrets in response');
  } finally { delete process.env.ADMIN_TOKEN; }
});

test('AI path validates model output and labels its source', async () => {
  const realFetch = globalThis.fetch;
  process.env.ANTHROPIC_API_KEY = 'test-key-not-real';
  const email = `ai${Math.random().toString(36).slice(2)}@example.com`;
  const saved = cookie;
  await api('POST', '/api/auth/register', { email, password: 'password123', profile: profile() }, { keepCookie: false });
  globalThis.fetch = async (url, opts) => {
    if (String(url).startsWith('https://api.anthropic.com')) {
      const sent = JSON.parse(opts.body);
      assert.ok(!sent.messages[0].content.includes('Asha Rao'), 'name must not be sent to the model');
      assert.ok(!sent.messages[0].content.includes(email), 'email must not be sent to the model');
      const text = JSON.stringify({ order: ['frontend', 'not-a-career', 'full-stack'], explanations: { frontend: 'Because your HTML and CSS are solid.', bogus: 'ignored' }, next_steps: ['Build one React project'] });
      return new Response(JSON.stringify({ content: [{ type: 'text', text }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return realFetch(url, opts);
  };
  try {
    let r = await api('GET', '/api/recommendations');
    assert.equal(r.json.meta.source, 'ai');
    assert.equal(r.json.items[0].id, 'frontend');
    assert.equal(r.json.items[0].aiExplanation, 'Because your HTML and CSS are solid.');
    assert.equal(r.json.items.length, 13);
    assert.deepEqual(r.json.meta.nextSteps, ['Build one React project']);
    r = await api('GET', '/api/recommendations');
    assert.equal(r.json.meta.aiStatus, 'cached');

    globalThis.fetch = async (url, opts) => (String(url).startsWith('https://api.anthropic.com') ? new Response('nope', { status: 500 }) : realFetch(url, opts));
    await api('PUT', '/api/profile', { ...(await api('GET', '/api/me')).json.profile, skills: [sk('HTML', 4)] });
    r = await api('GET', '/api/recommendations');
    assert.equal(r.json.meta.source, 'rules');
    assert.equal(r.json.meta.aiStatus, 'failed');
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.ANTHROPIC_API_KEY;
    cookie = saved;
  }
});
