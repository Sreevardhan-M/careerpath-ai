// Optional AI layer. Runs only on the backend and only when ANTHROPIC_API_KEY is set.
// The rule-based engine always runs first; the model may reorder its candidates and add explanations.
// Model output is validated against the real career catalogue before use, and the UI labels its source.

import { createHash } from 'node:crypto';
import { CAREER_BY_ID } from '../data/careers.js';

export function aiConfig() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return { configured: !!key, key, model: process.env.AI_MODEL?.trim() || 'claude-sonnet-5-5' };
}

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

async function askJson(system, payload) {
  const { key, model } = aiConfig();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`AI request failed with status ${res.status}`);
  const body = await res.json();
  const text = (body.content || []).map((c) => c.text || '').join('');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('AI response was not JSON');
  return JSON.parse(text.slice(start, end + 1));
}

export function profileFingerprint(profile, extra = '') {
  const core = {
    year: profile.year, college: profile.college, interests: [...profile.interests].sort(),
    skills: profile.skills.map((s) => [s.name, s.level, s.studyTime, s.confidence, s.hasProject]).sort(),
    projects: profile.projects.map((p) => p.title), experience: profile.experience.map((e) => e.title),
  };
  return createHash('sha256').update(JSON.stringify(core) + extra + aiConfig().model).digest('hex').slice(0, 32);
}

function profileForModel(profile) {
  // The student's name and email are never sent.
  return {
    academic_year: profile.year,
    degree: profile.degree,
    department: profile.department,
    interests: profile.interests,
    skills: profile.skills.map((s) => ({ name: s.name, level: s.level, confidence: s.confidence || null, has_project: s.hasProject })),
    projects: profile.projects.map((p) => p.title),
    experience: profile.experience.map((e) => `${e.type}: ${e.title}`),
  };
}

const REC_SYSTEM = `You are a careful career advisor for engineering students. You receive a student profile and a list of candidate careers already scored by a rule-based engine.
Use ONLY the supplied data. Do not invent skills, projects, statistics, salaries or percentages.
Respond with a single JSON object and nothing else:
{"order": [up to 3 candidate ids in the order you recommend], "explanations": {"<candidate id>": "2 to 3 sentences explaining why it suits this student, referencing their actual skills, interests and academic year"}, "next_steps": [up to 4 short, concrete next actions]}`;

export async function aiRecommendations(profile, recs) {
  const candidates = recs.slice(0, 6);
  const out = await askJson(REC_SYSTEM, {
    profile: profileForModel(profile),
    candidates: candidates.map((r) => ({
      id: r.id, title: r.title, rule_based_fit: r.fit, interest_match: r.components.interestMatch,
      skills_met: r.matching.map((m) => m.name), skills_partial: r.weak.map((m) => m.name), skills_missing: r.missing.map((m) => m.name),
    })),
  });
  const valid = new Set(candidates.map((c) => c.id));
  const order = (Array.isArray(out.order) ? out.order : []).filter((id) => valid.has(id)).filter((id, i, a) => a.indexOf(id) === i).slice(0, 3);
  const explanations = {};
  for (const [id, text] of Object.entries(out.explanations && typeof out.explanations === 'object' ? out.explanations : {})) {
    if (valid.has(id) && typeof text === 'string') explanations[id] = clean(text, 700);
  }
  const nextSteps = (Array.isArray(out.next_steps) ? out.next_steps : []).map((s) => clean(s, 220)).filter(Boolean).slice(0, 4);
  if (!order.length && !Object.keys(explanations).length) throw new Error('AI response had no usable content');
  return { order, explanations, nextSteps };
}

const RM_SYSTEM = `You are a study coach for engineering students. You receive a student profile and a learning roadmap that has already been generated.
Do not add or remove tasks. Write short coaching notes only, using ONLY the supplied data.
Respond with a single JSON object and nothing else:
{"phase_notes": {"1": "1 to 2 sentences", "2": "...", "3": "...", "4": "...", "5": "..."}, "focus_this_month": [up to 3 short actions drawn from the roadmap tasks]}`;

export async function aiRoadmapNotes(profile, roadmap) {
  const out = await askJson(RM_SYSTEM, {
    profile: profileForModel(profile),
    career: roadmap.careerTitle,
    phases: roadmap.phases.map((p) => ({ phase: p.n, title: p.title, weeks: p.weeks, tasks: p.tasks.filter((t) => !t.covered).map((t) => t.title) })),
  });
  const notes = {};
  for (const p of roadmap.phases) {
    const t = out.phase_notes?.[String(p.n)];
    if (typeof t === 'string' && t.trim()) notes[p.n] = clean(t, 400);
  }
  const focus = (Array.isArray(out.focus_this_month) ? out.focus_this_month : []).map((s) => clean(s, 200)).filter(Boolean).slice(0, 3);
  if (!Object.keys(notes).length && !focus.length) throw new Error('AI response had no usable content');
  return { notes, focus };
}

export function careerExists(id) { return CAREER_BY_ID.has(id); }
