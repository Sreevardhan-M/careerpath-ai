// Progress tracking: task and resource state, activity log, achievements, readiness history, summaries.
import { recommendCareers, buildRoadmap, analyseGap, coverageFor, profileCompletion } from './engine.js';
import { CAREER_BY_ID } from '../data/careers.js';
import { RESOURCE_BY_ID } from '../data/resources.js';

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

export function doneSet(db, userId, kind) {
  const rows = db.prepare('SELECT key FROM progress WHERE user_id = ? AND kind = ? AND done = 1').all(userId, kind);
  return new Set(rows.map((r) => r.key));
}

export function logActivity(db, userId, type, label) {
  db.prepare('INSERT INTO activity (user_id, type, label, created_at) VALUES (?, ?, ?, ?)').run(userId, type, label.slice(0, 200), now());
}

export function setProgress(db, userId, kind, key, done) {
  db.prepare(`INSERT INTO progress (user_id, kind, key, done, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, kind, key) DO UPDATE SET done = excluded.done, updated_at = excluded.updated_at`).run(userId, kind, key, done ? 1 : 0, now());
}

export function snapshotReadiness(db, userId, profile) {
  const careerId = profile.targetCareer || recommendCareers(profile)[0].id;
  const { coverage } = coverageFor(profile, CAREER_BY_ID.get(careerId));
  db.prepare(`INSERT INTO readiness_history (user_id, day, coverage) VALUES (?, ?, ?)
    ON CONFLICT(user_id, day) DO UPDATE SET coverage = excluded.coverage`).run(userId, today(), coverage);
}

function weekStart(d) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x;
}

export function weeklyActivity(db, userId, weeks = 8) {
  const start = weekStart(new Date());
  start.setUTCDate(start.getUTCDate() - 7 * (weeks - 1));
  const rows = db.prepare(`SELECT created_at FROM activity WHERE user_id = ? AND created_at >= ? AND type IN ('task','resource','skill','goal')`).all(userId, start.toISOString());
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + 7 * i);
    return { weekStart: d.toISOString().slice(0, 10), count: 0 };
  });
  for (const r of rows) {
    const ws = weekStart(new Date(r.created_at)).toISOString().slice(0, 10);
    const b = buckets.find((x) => x.weekStart === ws);
    if (b) b.count += 1;
  }
  return buckets;
}

const ACHIEVEMENTS = [
  { key: 'first-task', title: 'First step taken', detail: 'Completed your first roadmap task.', test: (c) => c.tasksDone >= 1 },
  { key: 'ten-tasks', title: 'Ten tasks done', detail: 'Completed ten roadmap tasks.', test: (c) => c.tasksDone >= 10 },
  { key: 'phase-1', title: 'Fundamentals complete', detail: 'Finished every task in Phase 1.', test: (c) => c.phase1Done },
  { key: 'first-project', title: 'First project built', detail: 'Marked a roadmap project as complete.', test: (c) => c.projectsDone >= 1 },
  { key: 'three-resources', title: 'Three resources finished', detail: 'Completed three learning resources.', test: (c) => c.resourcesDone >= 3 },
  { key: 'skill-up', title: 'Levelled up', detail: 'Raised the level of a skill.', test: (c) => c.skillUps >= 1 },
  { key: 'goal-met', title: 'Goal reached', detail: 'Completed one of your learning goals.', test: (c) => c.goalsDone >= 1 },
  { key: 'halfway', title: 'Halfway to coverage', detail: 'Reached 50 percent skill coverage for your target career.', test: (c) => c.coverage >= 50 },
  { key: 'profile-full', title: 'Complete profile', detail: 'Filled in every part of your profile.', test: (c) => c.profile >= 100 },
];

export function evaluateAchievements(db, userId, ctx) {
  const have = new Set(db.prepare('SELECT key FROM achievements WHERE user_id = ?').all(userId).map((r) => r.key));
  for (const a of ACHIEVEMENTS) {
    if (!have.has(a.key) && a.test(ctx)) db.prepare('INSERT OR IGNORE INTO achievements (user_id, key, earned_at) VALUES (?, ?, ?)').run(userId, a.key, now());
  }
  const earned = new Map(db.prepare('SELECT key, earned_at FROM achievements WHERE user_id = ?').all(userId).map((r) => [r.key, r.earned_at]));
  return ACHIEVEMENTS.map((a) => ({ key: a.key, title: a.title, detail: a.detail, earnedAt: earned.get(a.key) || null }));
}

export function resolveTarget(profile) {
  return profile.targetCareer || recommendCareers(profile)[0].id;
}

/** Full progress summary used by the dashboard and the progress page. */
export function summarise(db, userId, profile) {
  const careerId = resolveTarget(profile);
  const tasks = doneSet(db, userId, 'task');
  const roadmap = buildRoadmap(profile, careerId, tasks);
  const gap = analyseGap(profile, careerId);
  const resDone = [...doneSet(db, userId, 'resource_done')].filter((id) => RESOURCE_BY_ID.has(id));
  const courses = resDone.filter((id) => ['Free course', 'Certification'].includes(RESOURCE_BY_ID.get(id).category)).length;
  const projectTasks = roadmap.phases.flatMap((p) => p.tasks.filter((t) => t.kind === 'project'));
  const projectsBuilt = projectTasks.filter((t) => t.done).length;
  const skillUps = db.prepare("SELECT COUNT(*) AS n FROM activity WHERE user_id = ? AND type = 'skill' AND label LIKE 'Raised %'").get(userId).n;
  const goalsDone = db.prepare('SELECT COUNT(*) AS n FROM goals WHERE user_id = ? AND done = 1').get(userId).n;
  const completion = profileCompletion(profile);
  const phase1 = roadmap.phases.find((p) => p.n === 1);
  const ctx = {
    tasksDone: roadmap.done, projectsDone: projectsBuilt, resourcesDone: resDone.length, skillUps, goalsDone,
    coverage: gap.coverage.coverage, profile: completion.percent, phase1Done: !!phase1 && phase1.total > 0 && phase1.done === phase1.total,
  };
  const achievements = evaluateAchievements(db, userId, ctx);
  const overall = Math.round((roadmap.percent + gap.coverage.coverage) / 2);
  const history = db.prepare('SELECT day, coverage FROM readiness_history WHERE user_id = ? ORDER BY day DESC LIMIT 30').all(userId).reverse();

  return {
    careerId,
    careerTitle: roadmap.careerTitle,
    overall,
    roadmapPercent: roadmap.percent,
    roadmapDone: roadmap.done,
    roadmapTotal: roadmap.total,
    skillsCompleted: { met: gap.coverage.met, total: gap.coverage.total },
    coverage: gap.coverage,
    coursesCompleted: courses,
    resourcesCompleted: resDone.length,
    projectsCompleted: { built: projectsBuilt, listed: profile.projects.length, total: projectsBuilt + profile.projects.length },
    weekly: weeklyActivity(db, userId),
    readinessHistory: history,
    achievements,
    phases: roadmap.phases.map((p) => ({ n: p.n, title: p.title, done: p.done, total: p.total, percent: p.percent })),
  };
}

/** Call after any state change so achievements and the readiness history stay current. */
export function touch(db, userId, profile) {
  snapshotReadiness(db, userId, profile);
  summarise(db, userId, profile);
}
