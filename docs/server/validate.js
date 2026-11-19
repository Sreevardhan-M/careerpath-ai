// Input validation and normalisation. Throws HttpError(422) with per-field messages.
import { COLLEGES, DEGREES, DEPARTMENT, INTERESTS, STUDY_TIMES, EXPERIENCE_TYPES, CATEGORIES, findCatalogSkill } from './data/skills.js';
import { CAREER_BY_ID } from './data/careers.js';

export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

const str = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function validateProfile(input) {
  const errors = {};
  const p = input || {};

  const name = str(p.name, 80);
  if (name.length < 2) errors.name = 'Enter your full name (at least 2 characters).';

  const college = COLLEGES.includes(p.college) ? p.college : null;
  if (!college) errors.college = 'Choose your college.';

  const degree = DEGREES.includes(p.degree) ? p.degree : null;
  if (!degree) errors.degree = 'Choose your degree.';

  const year = Number(p.year);
  if (![1, 2, 3, 4].includes(year)) errors.year = 'Choose your current academic year.';

  const interests = [...new Set((Array.isArray(p.interests) ? p.interests : []).filter((i) => INTERESTS.includes(i)))];
  if (!interests.length) errors.interests = 'Choose at least one career interest, or "Not Sure Yet".';

  const skills = [];
  const seen = new Set();
  for (const raw of Array.isArray(p.skills) ? p.skills.slice(0, 80) : []) {
    const typed = str(raw?.name, 50);
    if (!typed) continue;
    const cat = findCatalogSkill(typed);
    const name2 = cat ? cat.name : typed;
    if (seen.has(name2.toLowerCase())) continue;
    seen.add(name2.toLowerCase());
    const level = Number(raw.level);
    if (![1, 2, 3, 4, 5].includes(level)) { errors.skills = `Choose a proficiency level for ${name2}.`; continue; }
    const category = cat ? cat.category : CATEGORIES.includes(raw.category) ? raw.category : 'Advanced Technologies';
    const studyTime = STUDY_TIMES.some((s) => s.value === raw.studyTime) ? raw.studyTime : '';
    const confidence = [1, 2, 3, 4, 5].includes(Number(raw.confidence)) ? Number(raw.confidence) : 0;
    skills.push({ name: name2, category, level, studyTime, confidence, hasProject: !!raw.hasProject, custom: !cat });
  }

  const projects = (Array.isArray(p.projects) ? p.projects.slice(0, 20) : [])
    .map((x) => ({ title: str(x?.title, 100), description: str(x?.description, 400), skills: (Array.isArray(x?.skills) ? x.skills : []).map((s) => str(s, 50)).filter(Boolean).slice(0, 10) }))
    .filter((x) => x.title);

  const experience = (Array.isArray(p.experience) ? p.experience.slice(0, 20) : [])
    .map((x) => ({ type: EXPERIENCE_TYPES.includes(x?.type) ? x.type : 'Certification', title: str(x?.title, 100), org: str(x?.org, 100) }))
    .filter((x) => x.title);

  let targetCareer = null;
  if (p.targetCareer) {
    if (CAREER_BY_ID.has(p.targetCareer)) targetCareer = p.targetCareer;
    else errors.targetCareer = 'Unknown career.';
  }

  if (Object.keys(errors).length) throw new HttpError(422, 'Please fix the highlighted fields.', errors);
  return { name, college, degree, department: DEPARTMENT, year, interests, skills, projects, experience, targetCareer };
}

export function validateEmail(email) {
  const e = str(email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw new HttpError(422, 'Enter a valid email address.', { email: 'Enter a valid email address.' });
  return e;
}

export function validatePassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8 || pw.length > 200) throw new HttpError(422, 'Password must be at least 8 characters.', { password: 'Use at least 8 characters.' });
  return pw;
}

export function validateGoal(input) {
  const title = str(input?.title, 120);
  if (title.length < 3) throw new HttpError(422, 'Describe your goal in at least 3 characters.', { title: 'Describe your goal in at least 3 characters.' });
  let targetDate = null;
  if (input?.targetDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate) || Number.isNaN(Date.parse(input.targetDate))) throw new HttpError(422, 'Enter a valid date.', { targetDate: 'Enter a valid date.' });
    targetDate = input.targetDate;
  }
  return { title, targetDate };
}
