// CareerPath AI server: JSON API plus static frontend, no third-party dependencies.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, ROOT } from './env.js';
import { openDb } from './db.js';
import { HttpError, validateProfile, validateEmail, validatePassword, validateGoal } from './validate.js';
import { hashPassword, verifyPassword, createSession, userFromToken, destroySession, parseCookies, cookieHeader, COOKIE, tooManyAttempts, clearAttempts } from './auth.js';
import { LEVELS, levelLabel, CATEGORIES, SKILLS, COLLEGES, DEGREES, DEPARTMENT, INTERESTS, STUDY_TIMES, EXPERIENCE_TYPES } from './data/skills.js';
import { CAREERS, CAREER_BY_ID } from './data/careers.js';
import { RESOURCES, RESOURCE_BY_ID, COST_LABELS, RESOURCE_CATEGORIES, DIFFICULTIES } from './data/resources.js';
import { recommendCareers, analyseGap, buildRoadmap, allTaskIds, profileCompletion } from './services/engine.js';
import { aiConfig, aiRecommendations, aiRoadmapNotes, profileFingerprint } from './services/ai.js';
import { doneSet, setProgress, logActivity, touch, summarise, resolveTarget } from './services/progress.js';

const PUBLIC_DIR = join(ROOT, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com 'self'; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

const now = () => new Date().toISOString();

// Origins (for example the Vercel frontend) allowed to send writes to this API. Comma separated in ALLOWED_ORIGINS.
const allowedOrigins = () => (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);

// Behind a proxy (Render, Vercel) the socket address is the proxy, so read the forwarded address when TRUST_PROXY=true.
const clientIp = (req) => (process.env.TRUST_PROXY === 'true' ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '') || req.socket.remoteAddress;

export function createApp({ db, secureCookies = false } = {}) {
  const routes = [];
  const route = (method, path, handler, { auth = true } = {}) => {
    const keys = [];
    const re = new RegExp('^' + path.replace(/:([a-z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    routes.push({ method, re, keys, handler, auth });
  };

  const getProfile = (userId) => {
    const row = db.prepare('SELECT data FROM profiles WHERE user_id = ?').get(userId);
    return row ? JSON.parse(row.data) : null;
  };
  const saveProfile = (userId, profile) => {
    db.prepare(`INSERT INTO profiles (user_id, data, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`).run(userId, JSON.stringify(profile), now());
  };
  const requireProfile = (user) => {
    const p = getProfile(user.id);
    if (!p) throw new HttpError(404, 'Profile not found.');
    return p;
  };

  const cacheGet = (userId, kind, hash) => {
    const row = db.prepare('SELECT data FROM ai_cache WHERE user_id = ? AND kind = ? AND hash = ?').get(userId, kind, hash);
    return row ? JSON.parse(row.data) : null;
  };
  const cachePut = (userId, kind, hash, data) => {
    db.prepare('INSERT OR REPLACE INTO ai_cache (user_id, kind, hash, data, created_at) VALUES (?, ?, ?, ?, ?)').run(userId, kind, hash, JSON.stringify(data), now());
  };

  async function recommendationsFor(userId, profile) {
    const rules = recommendCareers(profile);
    const cfg = aiConfig();
    if (!cfg.configured) return { items: rules, meta: { source: 'rules', aiStatus: 'not_configured', nextSteps: [] } };
    const hash = profileFingerprint(profile, 'rec');
    let ai = cacheGet(userId, 'rec', hash);
    let status = 'cached';
    if (!ai) {
      try { ai = await aiRecommendations(profile, rules); cachePut(userId, 'rec', hash, ai); status = 'used'; }
      catch { return { items: rules, meta: { source: 'rules', aiStatus: 'failed', nextSteps: [] } }; }
    }
    const first = ai.order.map((id) => rules.find((r) => r.id === id)).filter(Boolean);
    const rest = rules.filter((r) => !first.includes(r));
    const items = [...first, ...rest].map((r, i) => ({ ...r, rank: i + 1, aiExplanation: ai.explanations[r.id] || null }));
    return { items, meta: { source: 'ai', model: cfg.model, aiStatus: status, nextSteps: ai.nextSteps } };
  }

  async function roadmapFor(userId, profile, careerId) {
    const rm = buildRoadmap(profile, careerId, doneSet(db, userId, 'task'));
    const cfg = aiConfig();
    rm.aiNotes = { source: 'none', status: cfg.configured ? 'pending' : 'not_configured', notes: {}, focus: [] };
    if (!cfg.configured) return rm;
    const hash = profileFingerprint(profile, `rm:${careerId}`);
    let ai = cacheGet(userId, 'rm', hash);
    let status = 'cached';
    if (!ai) {
      try { ai = await aiRoadmapNotes(profile, rm); cachePut(userId, 'rm', hash, ai); status = 'used'; }
      catch { rm.aiNotes.status = 'failed'; return rm; }
    }
    rm.aiNotes = { source: 'ai', model: cfg.model, status, notes: ai.notes, focus: ai.focus };
    return rm;
  }

  const resourceDict = (ids) => Object.fromEntries([...new Set(ids)].filter((id) => RESOURCE_BY_ID.has(id)).map((id) => [id, RESOURCE_BY_ID.get(id)]));
  const careerParam = (profile, q) => {
    const id = q.get('career') || resolveTarget(profile);
    if (!CAREER_BY_ID.has(id)) throw new HttpError(404, 'Unknown career.');
    return id;
  };

  // ---- Public ----
  route('GET', '/api/health', () => ({ ok: true }), { auth: false });

  route('GET', '/api/catalog', () => ({
    levels: LEVELS, categories: CATEGORIES, skills: SKILLS, colleges: COLLEGES, degrees: DEGREES, department: DEPARTMENT,
    interests: INTERESTS, studyTimes: STUDY_TIMES, experienceTypes: EXPERIENCE_TYPES,
    careers: CAREERS.map((c) => ({ id: c.id, title: c.title })),
    resourceCategories: RESOURCE_CATEGORIES, difficulties: DIFFICULTIES, costLabels: COST_LABELS,
    ai: { configured: aiConfig().configured },
  }), { auth: false });

  route('POST', '/api/auth/register', async ({ body, res }) => {
    const email = validateEmail(body.email);
    const password = validatePassword(body.password);
    const profile = validateProfile(body.profile);
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw new HttpError(409, 'An account with this email already exists. Try signing in.', { email: 'This email is already registered.' });
    const { salt, hash } = hashPassword(password);
    const { lastInsertRowid } = db.prepare('INSERT INTO users (email, password_hash, salt, created_at) VALUES (?, ?, ?, ?)').run(email, hash, salt, now());
    const userId = Number(lastInsertRowid);
    profile.targetCareer = profile.targetCareer || recommendCareers(profile)[0].id;
    saveProfile(userId, profile);
    logActivity(db, userId, 'profile', 'Created your profile');
    touch(db, userId, profile);
    const s = createSession(db, userId);
    res.setHeader('Set-Cookie', cookieHeader(s.token, s.maxAge, secureCookies));
    return { status: 201, body: { user: { id: userId, email }, profile } };
  }, { auth: false });

  route('POST', '/api/auth/login', ({ body, req, res }) => {
    const email = String(body.email || '').trim().toLowerCase();
    const key = `${clientIp(req)}|${email}`;
    if (tooManyAttempts(key)) throw new HttpError(429, 'Too many attempts. Wait a few minutes and try again.');
    const row = db.prepare('SELECT id, email, password_hash, salt FROM users WHERE email = ?').get(email);
    const ok = row && typeof body.password === 'string' && verifyPassword(body.password, row.salt, row.password_hash);
    if (!ok) throw new HttpError(401, 'Email or password is incorrect.');
    clearAttempts(key);
    const s = createSession(db, row.id);
    res.setHeader('Set-Cookie', cookieHeader(s.token, s.maxAge, secureCookies));
    return { user: { id: row.id, email: row.email }, profile: getProfile(row.id) };
  }, { auth: false });

  route('POST', '/api/auth/logout', ({ req, res }) => {
    destroySession(db, parseCookies(req.headers.cookie)[COOKIE]);
    res.setHeader('Set-Cookie', cookieHeader('', 0, secureCookies));
    return { ok: true };
  }, { auth: false });

  // ---- Profile ----
  route('GET', '/api/me', ({ user }) => {
    const profile = getProfile(user.id);
    return { user, profile, completion: profile ? profileCompletion(profile) : null, ai: { configured: aiConfig().configured, model: aiConfig().configured ? aiConfig().model : null } };
  });

  route('PUT', '/api/profile', ({ user, body }) => {
    const old = requireProfile(user);
    const next = validateProfile({ ...body, targetCareer: body.targetCareer ?? old.targetCareer });
    const oldMap = new Map(old.skills.map((s) => [s.name.toLowerCase(), s]));
    for (const s of next.skills) {
      const prev = oldMap.get(s.name.toLowerCase());
      if (!prev) logActivity(db, user.id, 'skill', `Added ${s.name} at ${levelLabel(s.level)}`);
      else if (s.level > prev.level) logActivity(db, user.id, 'skill', `Raised ${s.name} from ${levelLabel(prev.level)} to ${levelLabel(s.level)}`);
      else if (s.level < prev.level) logActivity(db, user.id, 'skill', `Changed ${s.name} to ${levelLabel(s.level)}`);
    }
    saveProfile(user.id, next);
    touch(db, user.id, next);
    return { profile: next, completion: profileCompletion(next) };
  });

  route('PUT', '/api/target', ({ user, body }) => {
    if (!CAREER_BY_ID.has(body.careerId)) throw new HttpError(422, 'Unknown career.');
    const profile = requireProfile(user);
    profile.targetCareer = body.careerId;
    saveProfile(user.id, profile);
    logActivity(db, user.id, 'profile', `Set target career to ${CAREER_BY_ID.get(body.careerId).title}`);
    touch(db, user.id, profile);
    return { profile };
  });

  // ---- Analysis ----
  route('GET', '/api/recommendations', async ({ user }) => {
    const profile = requireProfile(user);
    const { items, meta } = await recommendationsFor(user.id, profile);
    return { items, meta, targetCareer: resolveTarget(profile) };
  });

  route('GET', '/api/gap', ({ user, query }) => {
    const profile = requireProfile(user);
    const id = careerParam(profile, query);
    const gap = analyseGap(profile, id);
    return { gap, resources: resourceDict(gap.priority.flatMap((r) => r.resourceIds)), targetCareer: resolveTarget(profile) };
  });

  route('GET', '/api/roadmap', async ({ user, query }) => {
    const profile = requireProfile(user);
    const id = careerParam(profile, query);
    const roadmap = await roadmapFor(user.id, profile, id);
    const ids = roadmap.phases.flatMap((p) => p.tasks.flatMap((t) => t.resourceIds));
    return { roadmap, resources: resourceDict(ids), targetCareer: resolveTarget(profile) };
  });

  route('GET', '/api/resources', ({ user }) => {
    const profile = requireProfile(user);
    const gap = analyseGap(profile, resolveTarget(profile));
    const gapIds = [...new Set(gap.priority.flatMap((r) => r.resourceIds))];
    const careerSkills = new Set(CAREER_BY_ID.get(resolveTarget(profile)).skills.flatMap((e) => e.anyOf || [e.name]).map((n) => n.toLowerCase()));
    const resources = RESOURCES.map((r) => ({ ...r, careers: [...new Set([...r.careers, ...CAREERS.filter((c) => c.skills.some((e) => (e.anyOf || [e.name]).some((n) => r.skills.includes(n)))).map((c) => c.id)])] }));
    return {
      resources, gapIds, targetCareer: resolveTarget(profile), careerSkills: [...careerSkills],
      done: [...doneSet(db, user.id, 'resource_done')], saved: [...doneSet(db, user.id, 'resource_saved')],
    };
  });

  route('POST', '/api/progress', ({ user, body }) => {
    const profile = requireProfile(user);
    const { kind, key } = body;
    const done = !!body.done;
    if (kind === 'task') {
      const m = /^([a-z-]+):p[1-5]:[a-z0-9-]+$/.exec(String(key));
      if (!m || !CAREER_BY_ID.has(m[1])) throw new HttpError(422, 'Unknown task.');
      const rm = buildRoadmap(profile, m[1], new Set());
      const task = rm.phases.flatMap((p) => p.tasks).find((t) => t.id === key);
      if (!task || task.covered) throw new HttpError(422, 'Unknown task.');
      setProgress(db, user.id, 'task', key, done);
      if (done) logActivity(db, user.id, 'task', `Completed: ${task.title}`);
    } else if (kind === 'resource_done' || kind === 'resource_saved') {
      const r = RESOURCE_BY_ID.get(key);
      if (!r) throw new HttpError(422, 'Unknown resource.');
      setProgress(db, user.id, kind, key, done);
      if (done) logActivity(db, user.id, kind === 'resource_done' ? 'resource' : 'save', `${kind === 'resource_done' ? 'Finished' : 'Saved'}: ${r.title}`);
    } else throw new HttpError(422, 'Unknown progress type.');
    touch(db, user.id, profile);
    return { ok: true };
  });

  route('GET', '/api/progress', ({ user }) => ({ summary: summarise(db, user.id, requireProfile(user)) }));

  route('POST', '/api/progress/reset', ({ user }) => {
    db.prepare("DELETE FROM progress WHERE user_id = ?").run(user.id);
    db.prepare('DELETE FROM activity WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM achievements WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM goals WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM readiness_history WHERE user_id = ?').run(user.id);
    touch(db, user.id, requireProfile(user));
    return { ok: true };
  });

  // ---- Goals ----
  const goalRows = (userId) => db.prepare('SELECT id, title, target_date AS targetDate, done, created_at AS createdAt, done_at AS doneAt FROM goals WHERE user_id = ? ORDER BY done ASC, COALESCE(target_date, \'9999-12-31\') ASC, id DESC').all(userId).map((g) => ({ ...g, done: !!g.done }));
  route('GET', '/api/goals', ({ user }) => ({ goals: goalRows(user.id) }));
  route('POST', '/api/goals', ({ user, body }) => {
    const g = validateGoal(body);
    db.prepare('INSERT INTO goals (user_id, title, target_date, created_at) VALUES (?, ?, ?, ?)').run(user.id, g.title, g.targetDate, now());
    return { status: 201, body: { goals: goalRows(user.id) } };
  });
  route('PATCH', '/api/goals/:id', ({ user, params, body }) => {
    const row = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(Number(params.id), user.id);
    if (!row) throw new HttpError(404, 'Goal not found.');
    const g = validateGoal({ title: body.title ?? row.title, targetDate: body.targetDate === undefined ? row.target_date : body.targetDate });
    const done = body.done === undefined ? !!row.done : !!body.done;
    db.prepare('UPDATE goals SET title = ?, target_date = ?, done = ?, done_at = ? WHERE id = ?').run(g.title, g.targetDate, done ? 1 : 0, done ? (row.done_at || now()) : null, row.id);
    if (done && !row.done) logActivity(db, user.id, 'goal', `Reached goal: ${g.title}`);
    touch(db, user.id, requireProfile(user));
    return { goals: goalRows(user.id) };
  });
  route('DELETE', '/api/goals/:id', ({ user, params }) => {
    db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(Number(params.id), user.id);
    return { goals: goalRows(user.id) };
  });

  // ---- Dashboard (one call for the overview page) ----
  route('GET', '/api/dashboard', async ({ user }) => {
    const profile = requireProfile(user);
    const { items, meta } = await recommendationsFor(user.id, profile);
    const careerId = resolveTarget(profile);
    const gap = analyseGap(profile, careerId);
    const summary = summarise(db, user.id, profile);
    const roadmap = buildRoadmap(profile, careerId, doneSet(db, user.id, 'task'));
    const nextTasks = roadmap.phases.flatMap((p) => p.tasks.filter((t) => !t.covered && !t.done).map((t) => ({ ...t, phase: p.n, phaseTitle: p.title }))).slice(0, 4);
    const activity = db.prepare("SELECT type, label, created_at AS createdAt FROM activity WHERE user_id = ? AND type != 'save' ORDER BY id DESC LIMIT 6").all(user.id);
    return {
      profile, completion: profileCompletion(profile), top: items.slice(0, 3), meta,
      gap: { careerId, careerTitle: gap.careerTitle, coverage: gap.coverage, strong: gap.strong.length, improve: gap.improve.length, missing: gap.missing.length, priority: gap.priority.slice(0, 3) },
      summary, nextTasks, goals: goalRows(user.id).filter((g) => !g.done).slice(0, 4), activity,
      resources: resourceDict([...gap.priority.slice(0, 3).flatMap((r) => r.resourceIds), ...nextTasks.flatMap((t) => t.resourceIds)]),
    };
  });

  route('GET', '/api/activity', ({ user }) => ({
    activity: db.prepare("SELECT type, label, created_at AS createdAt FROM activity WHERE user_id = ? AND type != 'save' ORDER BY id DESC LIMIT 30").all(user.id),
  }));

  // ---- Account ----
  route('POST', '/api/account/password', ({ user, body }) => {
    const row = db.prepare('SELECT salt, password_hash FROM users WHERE id = ?').get(user.id);
    if (!verifyPassword(String(body.current || ''), row.salt, row.password_hash)) throw new HttpError(403, 'Current password is incorrect.', { current: 'Current password is incorrect.' });
    const { salt, hash } = hashPassword(validatePassword(body.next));
    db.prepare('UPDATE users SET salt = ?, password_hash = ? WHERE id = ?').run(salt, hash, user.id);
    return { ok: true };
  });

  route('GET', '/api/export', ({ user, res }) => {
    const data = {
      exportedAt: now(), email: user.email, profile: getProfile(user.id),
      progress: db.prepare('SELECT kind, key, done, updated_at AS updatedAt FROM progress WHERE user_id = ?').all(user.id),
      goals: goalRows(user.id),
      activity: db.prepare('SELECT type, label, created_at AS createdAt FROM activity WHERE user_id = ? ORDER BY id').all(user.id),
      achievements: db.prepare('SELECT key, earned_at AS earnedAt FROM achievements WHERE user_id = ?').all(user.id),
    };
    res.setHeader('Content-Disposition', 'attachment; filename="careerpath-data.json"');
    return data;
  });

  route('DELETE', '/api/account', ({ user, body, res }) => {
    const row = db.prepare('SELECT salt, password_hash FROM users WHERE id = ?').get(user.id);
    if (!verifyPassword(String(body.password || ''), row.salt, row.password_hash)) throw new HttpError(403, 'Password is incorrect.', { password: 'Password is incorrect.' });
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    res.setHeader('Set-Cookie', cookieHeader('', 0, secureCookies));
    return { ok: true };
  });

  // ---- HTTP plumbing ----
  async function readBody(req) {
    const chunks = [];
    let size = 0;
    for await (const c of req) {
      size += c.length;
      if (size > 1_000_000) throw new HttpError(413, 'Request too large.');
      chunks.push(c);
    }
    if (!chunks.length) return {};
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new HttpError(400, 'Request body must be valid JSON.'); }
  }

  const sendJson = (res, status, data) => {
    const body = JSON.stringify(data);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY_HEADERS });
    res.end(body);
  };

  async function handleApi(req, res, url) {
    const method = req.method;
    const match = routes.map((r) => ({ r, m: r.re.exec(url.pathname) })).find((x) => x.m && x.r.method === method);
    if (!match) {
      if (routes.some((r) => r.re.test(url.pathname))) throw new HttpError(405, 'Method not allowed.');
      throw new HttpError(404, 'Not found.');
    }
    if (method !== 'GET') {
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host && !allowedOrigins().includes(origin)) throw new HttpError(403, 'Cross-origin request blocked.');
      if (!(req.headers['content-type'] || '').includes('application/json') && Number(req.headers['content-length'] || 0) > 0) throw new HttpError(415, 'Use application/json.');
    }
    let user = null;
    if (match.r.auth) {
      user = userFromToken(db, parseCookies(req.headers.cookie)[COOKIE]);
      if (!user) throw new HttpError(401, 'Please sign in.');
    }
    const params = Object.fromEntries(match.r.keys.map((k, i) => [k, decodeURIComponent(match.m[i + 1])]));
    const body = method === 'GET' || method === 'DELETE' && !req.headers['content-length'] ? {} : await readBody(req);
    const out = await match.r.handler({ req, res, user, params, query: url.searchParams, body, db });
    if (out && typeof out === 'object' && 'status' in out && 'body' in out) sendJson(res, out.status, out.body);
    else sendJson(res, 200, out);
  }

  async function serveStatic(req, res, url) {
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    let file = normalize(join(PUBLIC_DIR, rel));
    if (!file.startsWith(PUBLIC_DIR + sep)) { res.writeHead(403, SECURITY_HEADERS); return res.end('Forbidden'); }
    let info = await stat(file).catch(() => null);
    if (!info || info.isDirectory()) {
      if (extname(rel)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS }); return res.end('Not found'); }
      file = join(PUBLIC_DIR, 'index.html');
      info = await stat(file);
    }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...SECURITY_HEADERS });
    res.end(req.method === 'HEAD' ? undefined : data);
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed.');
      return await serveStatic(req, res, url);
    } catch (err) {
      if (err instanceof HttpError) return sendJson(res, err.status, { error: err.message, fields: err.fields });
      console.error('Unhandled error:', err);
      return sendJson(res, 500, { error: 'Something went wrong on the server.' });
    }
  });
  return server;
}

// Start when run directly.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  loadEnv();
  const db = openDb(process.env.DATABASE_PATH || 'data/careerpath.db');
  const port = Number(process.env.PORT) || 3000;
  const server = createApp({ db, secureCookies: process.env.COOKIE_SECURE === 'true' });
  server.listen(port, () => {
    const ai = aiConfig();
    console.log(`CareerPath AI running at http://localhost:${port}`);
    console.log(ai.configured ? `AI recommendations: enabled (${ai.model})` : 'AI recommendations: disabled, using the rule-based engine (set ANTHROPIC_API_KEY to enable)');
  });
}
