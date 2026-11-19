// Rule-based engine: career scoring, skill gap analysis and roadmap generation.
// Everything here is deterministic and explainable. It never claims to be AI output.

import { CAREERS, CAREER_BY_ID, entrySkillNames } from '../data/careers.js';
import { RESOURCES, RESOURCE_BY_ID } from '../data/resources.js';
import { levelLabel } from '../data/skills.js';

const DIFF_RANK = { Beginner: 0, Intermediate: 1, Advanced: 2 };

/** Map of lower-case skill name -> skill record from the profile. */
export function skillMap(profile) {
  const m = new Map();
  for (const s of profile.skills || []) m.set(s.name.toLowerCase(), s);
  return m;
}

/** Resolve a requirement entry against the student's skills. */
function resolveEntry(entry, map) {
  const names = entrySkillNames(entry);
  let best = null;
  for (const n of names) {
    const s = map.get(n.toLowerCase());
    if (s && (!best || s.level > best.level)) best = s;
  }
  return { level: best?.level || 0, skill: best, label: entry.name, via: best && entry.anyOf ? best.name : null };
}

function hasEvidence(profile, skillName) {
  const lower = skillName.toLowerCase();
  const s = (profile.skills || []).find((x) => x.name.toLowerCase() === lower);
  if (s?.hasProject) return true;
  if ((profile.projects || []).some((p) => (p.skills || []).some((n) => n.toLowerCase() === lower))) return true;
  return (profile.experience || []).some((e) => `${e.title} ${e.org || ''}`.toLowerCase().includes(lower));
}

export function readinessLabel(coverage) {
  if (coverage >= 90) return 'Close to entry-level ready';
  if (coverage >= 70) return 'Building strong foundations';
  if (coverage >= 40) return 'Making progress';
  return 'Just getting started';
}

/** Skill coverage for a career: weighted share of requirements met, capped per skill at the target level. */
export function coverageFor(profile, career) {
  const map = skillMap(profile);
  let got = 0;
  let total = 0;
  let met = 0;
  for (const e of career.skills) {
    const { level } = resolveEntry(e, map);
    got += e.w * Math.min(level / e.target, 1);
    total += e.w;
    if (level >= e.target) met += 1;
  }
  const coverage = total ? Math.round((got / total) * 100) : 0;
  return { coverage, met, total: career.skills.length, label: readinessLabel(coverage) };
}

function fitLabel(score) {
  if (score >= 0.7) return 'Strong fit';
  if (score >= 0.5) return 'Good fit';
  if (score >= 0.3) return 'Developing fit';
  return 'Exploratory';
}

function yearAdvice(year, career, cov) {
  const left = 4 - year;
  const horizon = left === 0 ? 'You are in your final year, so focus on the highest-priority gaps and interview preparation together.'
    : left === 1 ? 'You have about a year and a half of study left, enough for fundamentals and one strong project before placements.'
    : left === 2 ? 'You have roughly two and a half years left, enough to build depth and complete internships.'
    : 'You are early in your degree, so there is time to build fundamentals properly and try different areas.';
  return cov >= 70 ? `${horizon}` : `${horizon} Aim to move ${career.title} coverage past 70 percent before applying.`;
}

/** Rank all careers for a student. Returns every career with an explanation. */
export function recommendCareers(profile) {
  const map = skillMap(profile);
  const interests = (profile.interests || []).filter((i) => i !== 'Not Sure Yet');
  const interestKnown = interests.length > 0;
  const noSkills = !(profile.skills || []).length;

  const results = CAREERS.map((career) => {
    let weighted = 0;
    let wTotal = 0;
    let evidenceW = 0;
    const matching = [];
    const weak = [];
    const missing = [];

    for (const e of career.skills) {
      const { level, via, label } = resolveEntry(e, map);
      wTotal += e.w;
      weighted += e.w * Math.min(level / e.target, 1);
      const names = entrySkillNames(e);
      if (names.some((n) => hasEvidence(profile, n))) evidenceW += e.w;
      const row = { name: label, level, levelLabel: levelLabel(level), target: e.target, targetLabel: levelLabel(e.target), via };
      if (level >= e.target) matching.push(row);
      else if (level > 0) weak.push(row);
      else missing.push(row);
    }

    const skillFit = wTotal ? weighted / wTotal : 0;
    const evidence = wTotal ? evidenceW / wTotal : 0;
    const matchedInterests = career.interests.filter((i) => interests.includes(i));
    const interestFit = matchedInterests.length ? 1 : 0;
    const score = interestKnown
      ? 0.55 * skillFit + 0.35 * interestFit + 0.1 * evidence
      : 0.9 * skillFit + 0.1 * evidence;
    // Approachable roles break ties for early students with little recorded experience.
    const tie = noSkills || (profile.year <= 2 && skillFit < 0.2) ? (5 - career.entry) * 0.01 : 0;

    const cov = coverageFor(profile, career);
    const reasons = [];
    if (matchedInterests.length) reasons.push(`Matches your interest in ${matchedInterests.join(' and ')}.`);
    else if (interestKnown) reasons.push('This is outside the interests you selected, so it ranks lower unless your skills point here.');
    else reasons.push('You chose "Not Sure Yet", so this ranking uses your skills only.');
    if (matching.length) reasons.push(`You already meet the target level in ${matching.slice(0, 4).map((m) => m.name).join(', ')}${matching.length > 4 ? ` and ${matching.length - 4} more` : ''}.`);
    if (weak.length) reasons.push(`Partly there on ${weak.slice(0, 3).map((m) => `${m.name} (${m.levelLabel})`).join(', ')}.`);
    if (!matching.length && !weak.length) reasons.push('You have not recorded any skills this role needs yet, so this is a fresh start rather than a skill match.');
    const evidencedCount = career.skills.filter((e) => entrySkillNames(e).some((n) => hasEvidence(profile, n))).length;
    if (evidencedCount) reasons.push(`You have projects or experience supporting ${evidencedCount} of ${career.skills.length} required skills.`);
    reasons.push(yearAdvice(profile.year, career, cov.coverage));

    return {
      id: career.id,
      title: career.title,
      summary: career.summary,
      score: score + tie,
      fit: fitLabel(score),
      components: { skills: Math.round(skillFit * 100), interestMatch: interestKnown ? interestFit === 1 : null, evidence: Math.round(evidence * 100) },
      reasons,
      matching,
      weak,
      missing,
      additionalSkills: [...weak, ...missing].map((m) => m.name),
      projects: career.projects,
      readiness: cov,
      roadmapUrl: career.roadmapUrl,
    };
  });

  results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return results.map((r, i) => ({ ...r, rank: i + 1, score: undefined }));
}

/** Resources chosen for one skill, tuned to the student's current level. */
export function resourcesForSkill(skillNames, level, limit = 3) {
  const names = new Set(skillNames.map((n) => n.toLowerCase()));
  const wanted = level >= 3 ? 2 : level >= 2 ? 1 : 0;
  const pool = RESOURCES.filter((r) => r.skills.some((s) => names.has(s.toLowerCase())));
  const scored = pool.map((r) => {
    const exact = r.skills.length <= 3 ? 0 : 1; // focused resources first
    const cost = r.cost === 'free' ? 0 : r.cost === 'certfee' || r.cost === 'freemium' ? 1 : 2;
    return { r, k: Math.abs(DIFF_RANK[r.difficulty] - wanted) * 3 + exact * 2 + cost };
  });
  scored.sort((a, b) => a.k - b.k || a.r.title.localeCompare(b.r.title));
  const out = [];
  const cats = new Set();
  for (const { r } of scored) {
    if (cats.has(r.category) && out.length < limit - 1 && scored.length > limit) continue;
    out.push(r.id);
    cats.add(r.category);
    if (out.length >= limit) break;
  }
  if (out.length < limit) for (const { r } of scored) { if (!out.includes(r.id)) out.push(r.id); if (out.length >= limit) break; }
  return out;
}

/** Skill gap analysis for a career. */
export function analyseGap(profile, careerId) {
  const career = CAREER_BY_ID.get(careerId);
  if (!career) return null;
  const map = skillMap(profile);
  const rows = career.skills.map((e) => {
    const { level, skill, via, label } = resolveEntry(e, map);
    const status = level >= e.target ? 'strong' : level > 0 ? 'improve' : 'missing';
    const priority = e.w >= 3 || (e.tier === 1 && status === 'missing') ? 'High' : e.w === 2 || e.tier === 1 ? 'Medium' : 'Low';
    let note = '';
    if (status === 'strong' && skill && !hasEvidence(profile, skill.name)) note = 'Strong on paper. Build or document a project to prove it.';
    else if (skill && skill.confidence && skill.confidence <= 2 && level >= 2) note = 'Your confidence applying this is low even though you rated the level higher. Practise by building something.';
    else if (status === 'missing') note = 'Not in your profile yet.';
    else if (status === 'improve') note = `Raise from ${levelLabel(level)} to ${levelLabel(e.target)}.`;
    return {
      name: label,
      anyOf: e.anyOf || null,
      via,
      tier: e.tier,
      weight: e.w,
      target: e.target,
      targetLabel: levelLabel(e.target),
      level,
      levelLabel: levelLabel(level),
      status,
      priority,
      note,
      resourceIds: status === 'strong' ? [] : resourcesForSkill(entrySkillNames(e), level, 3),
    };
  });
  const order = { High: 0, Medium: 1, Low: 2 };
  const actionable = rows.filter((r) => r.status !== 'strong').sort((a, b) => order[a.priority] - order[b.priority] || a.tier - b.tier || b.weight - a.weight);
  const cov = coverageFor(profile, career);
  return {
    careerId: career.id,
    careerTitle: career.title,
    coverage: cov,
    strong: rows.filter((r) => r.status === 'strong'),
    improve: actionable.filter((r) => r.status === 'improve'),
    missing: actionable.filter((r) => r.status === 'missing'),
    priority: actionable,
    rows,
  };
}

// ---- Roadmap -------------------------------------------------------------------------------

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const PHASES = [
  { n: 1, key: 'fundamentals', title: 'Fundamentals', share: 0.25 },
  { n: 2, key: 'intermediate', title: 'Intermediate Skills', share: 0.25 },
  { n: 3, key: 'advanced', title: 'Advanced Skills', share: 0.2 },
  { n: 4, key: 'projects', title: 'Practical Projects', share: 0.2 },
  { n: 5, key: 'interview', title: 'Interview Preparation', share: 0.1 },
];

function monthsLeft(year) {
  return { 1: 30, 2: 22, 3: 14, 4: 7 }[year] || 12;
}

function paceNote(year, n) {
  const notes = {
    1: ['Take it steadily. Depth in fundamentals will pay off in every later phase.', 'Pick one language and stay with it while you learn tools.', 'Treat this as exploration. You have time to try small projects.', 'Start one small project now and add to it each semester.', 'Light touch for now: learn what interviews ask, but do not rush.'],
    2: ['Use this semester to close fundamental gaps while the syllabus supports you.', 'Pair each new skill with a mini project so it sticks.', 'Aim to finish this before your pre-final year.', 'Target one solid project before the summer internship season.', 'Start collecting practice problems and a draft resume.'],
    3: ['Move quickly: internships and placements are the next 12 months.', 'Prioritise skills that appear most in the roles you want.', 'Choose depth in one area rather than breadth.', 'Projects now directly feed your resume and internship applications.', 'Begin interview practice alongside learning, not after it.'],
    4: ['Placements are close. Only study what the role truly needs.', 'Skip topics you already cover and go straight to the high-priority gaps.', 'Limit this phase to the one or two skills interviewers will ask about.', 'Finish one polished project and make it demonstrable.', 'Start interview preparation now and run it in parallel with the other phases.'],
  };
  return notes[year]?.[n - 1] || '';
}

/** Build the roadmap structure for a career. Task ids are stable so progress survives regeneration. */
export function buildRoadmap(profile, careerId, doneTasks = new Set()) {
  const career = CAREER_BY_ID.get(careerId);
  if (!career) return null;
  const map = skillMap(profile);
  const totalWeeks = Math.round(monthsLeft(profile.year) * 4.3);

  const phases = PHASES.map((p) => {
    const tasks = [];
    const topics = [];
    const skills = [];
    const projects = [];

    if (p.n <= 3) {
      for (const e of career.skills.filter((x) => x.tier === p.n)) {
        const { level, via } = resolveEntry(e, map);
        const names = entrySkillNames(e);
        const pick = via || (e.anyOf ? e.anyOf[0] : e.name);
        const covered = level >= e.target;
        topics.push(e.name);
        skills.push(e.name);
        const resourceIds = covered ? [] : resourcesForSkill(names, level, 2);
        const title = covered
          ? `${e.name}: already at ${levelLabel(level)}, nothing required here`
          : level > 0
            ? `Raise ${e.anyOf ? pick : e.name} from ${levelLabel(level)} to ${levelLabel(e.target)}`
            : e.anyOf ? `Choose one and learn it (${e.anyOf.join(', ')}) up to ${levelLabel(e.target)}` : `Learn ${e.name} up to ${levelLabel(e.target)}`;
        tasks.push({ id: `${career.id}:p${p.n}:${slug(e.name)}`, title, kind: covered ? 'covered' : 'learn', skill: e.name, covered, resourceIds });
      }
      if (tasks.some((t) => !t.covered)) {
        tasks.push({ id: `${career.id}:p${p.n}:checkpoint`, title: 'Checkpoint: re-rate your skills on the Skill Assessment page', kind: 'review', link: '#/skills', covered: false, resourceIds: [] });
      }
    }

    if (p.n === 4) {
      const gapLeft = career.skills.some((e) => resolveEntry(e, map).level < e.target);
      topics.push('Combine your skills in a project you can demonstrate', 'Write a clear README and deploy or record a demo');
      career.projects.forEach((pr, i) => {
        projects.push(pr);
        tasks.push({ id: `${career.id}:p4:project-${i + 1}`, title: `Build: ${pr.title}`, detail: pr.summary, kind: 'project', covered: false, resourceIds: i === 0 ? ['project-based-learning'] : [] });
      });
      tasks.push({ id: `${career.id}:p4:publish`, title: 'Publish your projects on GitHub with a clear README', kind: 'practice', covered: false, resourceIds: ['gh-skills'] });
      if (gapLeft) topics.push('Pick projects that use the skills you are still weakest in');
    }

    if (p.n === 5) {
      career.interview.forEach((t) => topics.push(t));
      const technical = !['ux', 'data-analyst'].includes(career.id);
      tasks.push({ id: `${career.id}:p5:topics`, title: `Revise the core topics: ${career.interview.slice(0, 2).join('; ')}`, kind: 'interview', covered: false, resourceIds: ['interview-handbook'] });
      if (technical) tasks.push({ id: `${career.id}:p5:problems`, title: 'Solve 50 practice problems across easy and medium difficulty', kind: 'practice', covered: false, resourceIds: ['leetcode', 'hackerrank'] });
      else tasks.push({ id: `${career.id}:p5:portfolio`, title: 'Prepare a short portfolio walk-through for each of your best projects', kind: 'interview', covered: false, resourceIds: ['interview-handbook'] });
      tasks.push({ id: `${career.id}:p5:resume`, title: 'Write a one-page resume and update your GitHub or portfolio', kind: 'interview', covered: false, resourceIds: ['interview-handbook'] });
      tasks.push({ id: `${career.id}:p5:mock`, title: 'Complete two mock interviews with a friend or senior', kind: 'interview', covered: false, resourceIds: [] });
      tasks.push({ id: `${career.id}:p5:roadmap`, title: `Review the community ${career.title} roadmap for anything you missed`, kind: 'review', covered: false, resourceIds: [RESOURCES.find((r) => r.careers.includes(career.id) && r.platform === 'roadmap.sh')?.id].filter(Boolean) });
    }

    const active = tasks.filter((t) => !t.covered);
    const done = active.filter((t) => doneTasks.has(t.id)).length;
    for (const t of tasks) t.done = !t.covered && doneTasks.has(t.id);
    const weeks = Math.max(2, Math.round(totalWeeks * p.share));
    return {
      n: p.n,
      key: p.key,
      title: p.title,
      weeks,
      note: paceNote(profile.year, p.n),
      topics: [...new Set(topics)],
      skills,
      projects,
      tasks,
      total: active.length,
      done,
      percent: active.length ? Math.round((done / active.length) * 100) : 100,
      allCovered: p.n <= 3 && tasks.length > 0 && active.length === 0,
    };
  }).filter((ph) => ph.tasks.length || ph.n >= 4);

  const total = phases.reduce((n, p) => n + p.total, 0);
  const done = phases.reduce((n, p) => n + p.done, 0);
  return {
    careerId: career.id,
    careerTitle: career.title,
    roadmapUrl: career.roadmapUrl,
    horizonWeeks: totalWeeks,
    total,
    done,
    percent: total ? Math.round((done / total) * 100) : 0,
    phases,
  };
}

export function allTaskIds(roadmap) {
  return roadmap.phases.flatMap((p) => p.tasks.filter((t) => !t.covered).map((t) => t.id));
}

export function profileCompletion(profile) {
  const checks = [
    ['Name', !!profile.name],
    ['College', !!profile.college],
    ['Academic year', !!profile.year],
    ['Career interests', (profile.interests || []).length > 0],
    ['At least three skills', (profile.skills || []).length >= 3],
    ['Study details for your skills', (profile.skills || []).length > 0 && profile.skills.every((s) => s.studyTime && s.confidence)],
    ['At least one project', (profile.projects || []).length > 0],
    ['Internship or certification', (profile.experience || []).length > 0],
    ['Target career chosen', !!profile.targetCareer],
  ];
  const done = checks.filter((c) => c[1]).length;
  return { percent: Math.round((done / checks.length) * 100), items: checks.map(([label, ok]) => ({ label, ok })) };
}

export { RESOURCE_BY_ID };
