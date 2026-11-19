import { h, api, ApiError, toast } from '../lib.js';
import { state, loadMe } from '../state.js';
import { go, brandMark } from '../nav.js';
import { field, selectFor } from '../components.js';
import { choice, chip, fieldset, levelPicker } from '../pickers.js';

const KEY = 'cp_draft_v2';
const blank = () => ({ step: 0, name: '', college: '', degree: '', year: 0, interests: [], skills: [], projects: [], experience: [], email: '' });

function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    return d && typeof d === 'object' ? { ...blank(), ...d } : blank();
  } catch { return blank(); }
}
const persist = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage unavailable */ } };
const clearDraft = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };

function dropdown(options, value, placeholder, onChange) {
  return selectFor([{ value: '', label: placeholder }, ...options], value ?? '', { onchange: (e) => onChange(e.target.value) });
}

const STEP_LABELS = ['Account', 'Your details', 'Your skills', 'Your experience', 'Review'];
const CONFIDENCE = [['', 'Select'], [1, '1: Not confident'], [2, '2: Slightly confident'], [3, '3: Moderately confident'], [4, '4: Confident'], [5, '5: Very confident']].map(([value, label]) => ({ value, label }));

export async function onboardingView() {
  if (state.me) { location.hash = '/dashboard'; return h('div', {}); }
  const cat = state.catalog;
  const d = loadDraft();
  let errors = {};
  let direction = 1;
  const keep = { pw: '', pw2: '' }; // survives redraws after a validation error

  const stepHost = h('div', { class: 'onb-step-host' });
  const rail = h('ol', { class: 'onb-rail', 'aria-label': 'Progress' });
  const backBtn = h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => move(-1) }, 'Back');
  const nextBtn = h('button', { class: 'btn btn-primary', type: 'button', onclick: () => next() }, 'Continue');
  const root = h('div', { class: 'onb' },
    h('header', { class: 'onb-top' }, h('a', { class: 'brand', href: '#/' }, brandMark(), h('span', {}, 'CareerPath AI')), h('a', { class: 'link-btn', href: '#/' }, 'Save and exit')),
    rail,
    h('main', { id: 'main', class: 'onb-main' }, stepHost),
    h('footer', { class: 'onb-foot' }, backBtn, nextBtn));

  const isCore = (n) => cat.skills.find((s) => s.name === n)?.core;
  const catalogEntry = (n) => cat.skills.find((s) => s.name.toLowerCase() === n.trim().toLowerCase());
  const skill = (n) => d.skills.find((s) => s.name === n);

  // ---------- validation ----------
  function validate(step) {
    const e = {};
    if (step === 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = 'Enter a valid email address.';
      if (keep.pw.length < 8) e.password = 'Use at least 8 characters.';
      else if (keep.pw !== keep.pw2) e.confirm = 'Passwords do not match.';
    }
    if (step === 1) {
      if (d.name.trim().length < 2) e.name = 'Enter your full name (at least 2 characters).';
      if (!d.college) e.college = 'Choose your college.';
      if (!d.degree) e.degree = 'Choose your degree.';
      if (!d.year) e.year = 'Choose your current academic year.';
      if (!d.interests.length) e.interests = 'Choose at least one interest, or "Not Sure Yet".';
    }
    if (step === 2) {
      const unrated = d.skills.filter((s) => !s.level).map((s) => s.name);
      if (unrated.length) e.skills = `Choose a proficiency level for: ${unrated.join(', ')}.`;
    }
    return e;
  }

  function paintRail() {
    rail.replaceChildren(...STEP_LABELS.map((l, i) => h('li', { class: i < d.step ? 'done' : i === d.step ? 'current' : '', 'aria-current': i === d.step ? 'step' : null },
      h('button', { type: 'button', class: 'rail-btn', disabled: i > d.step, onclick: () => jumpTo(i) }, h('span', { class: 'rail-n' }, String(i + 1)), h('span', { class: 'rail-l' }, l)))));
  }

  function jumpTo(i) {
    if (i === d.step) return;
    if (i > d.step) { const bad = validate(d.step); if (Object.keys(bad).length) { errors = bad; draw(); return; } }
    direction = i > d.step ? 1 : -1;
    d.step = i; errors = {}; persist(d); draw(true);
  }

  function move(dir) { jumpTo(Math.max(0, Math.min(4, d.step + dir))); }

  function next() {
    const bad = validate(d.step);
    if (Object.keys(bad).length) { errors = bad; draw(); focusFirstError(); return; }
    if (d.step < 4) return move(1);
    submit();
  }

  function focusFirstError() {
    const el = stepHost.querySelector('[aria-invalid="true"], .has-error input, .has-error select, .has-error button');
    el?.focus();
  }

  // ---------- account (first step) ----------
  function stepAccount() {
    const email = h('input', { class: 'input', type: 'email', autocomplete: 'email', value: d.email, oninput: (e) => { d.email = e.target.value; persist(d); } });
    const pw = h('input', { class: 'input', type: 'password', autocomplete: 'new-password', id: 'pw', oninput: (e) => { keep.pw = e.target.value; } });
    const pw2 = h('input', { class: 'input', type: 'password', autocomplete: 'new-password', oninput: (e) => { keep.pw2 = e.target.value; } });
    pw.value = keep.pw; pw2.value = keep.pw2;
    return [
      h('h1', { tabindex: -1, id: 'step-title' }, 'Create your account'),
      h('p', { class: 'lede' }, 'Your email and password keep your profile safe so it is here when you come back. Your password is stored as a salted hash.'),
      field('Email', email, { error: errors.email }),
      h('div', { class: 'two-col' }, field('Password', pw, { hint: 'At least 8 characters.', error: errors.password }), field('Confirm password', pw2, { error: errors.confirm })),
      h('p', { class: 'muted' }, 'Already have an account? ', h('a', { href: '#/signin' }, 'Sign in')),
    ];
  }

  // ---------- step 1 ----------
  function step1() {
    const nameIn = h('input', { class: 'input', type: 'text', autocomplete: 'name', value: d.name, maxLength: 80, oninput: (e) => { d.name = e.target.value; persist(d); } });
    const interests = cat.interests.map((i) => chip({
      label: i, checked: d.interests.includes(i),
      onChange: (on, el) => {
        if (i === 'Not Sure Yet' && on) d.interests = ['Not Sure Yet'];
        else { d.interests = d.interests.filter((x) => x !== i && x !== 'Not Sure Yet'); if (on) d.interests.push(i); }
        persist(d);
        interestsHost.querySelectorAll('input').forEach((inp) => { inp.checked = d.interests.includes(inp.nextSibling.textContent); });
      },
    }));
    const interestsHost = h('div', { class: 'chips' }, interests);
    return [
      h('h1', { tabindex: -1, id: 'step-title' }, 'Tell us about you'),
      h('p', { class: 'lede' }, 'Your college, year and interests shape which careers we show first.'),
      field('Full name', nameIn, { error: errors.name }),
      field('Current college', dropdown(cat.colleges.map((c) => ({ value: c, label: c })), d.college, 'Select your college', (v) => { d.college = v; persist(d); }), { error: errors.college }),
      h('div', { class: 'two-col' },
        field('Degree', dropdown(cat.degrees.map((x) => ({ value: x, label: x })), d.degree, 'Select degree', (v) => { d.degree = v; persist(d); }), { error: errors.degree }),
        h('div', { class: 'field' }, h('span', { class: 'label-like' }, 'Department'), h('p', { class: 'static-value' }, cat.department))),
      field('Current academic year', dropdown([1, 2, 3, 4].map((y) => ({ value: y, label: `${y}${['st', 'nd', 'rd', 'th'][y - 1]} Year` })), d.year || '', 'Select academic year', (v) => { d.year = Number(v) || 0; persist(d); }), { error: errors.year }),
      fieldset('Career interests', interestsHost, { hint: 'Select every area that interests you.', error: errors.interests }),
    ];
  }

  // ---------- step 2 ----------
  function step2() {
    const ratings = h('div', { class: 'ratings' });
    const paintRatings = () => {
      ratings.replaceChildren();
      if (!d.skills.length) { ratings.append(h('p', { class: 'muted' }, 'No skills selected yet. You can continue without any, and recommendations will lean on your interests.')); return; }
      d.skills.forEach((s) => {
        ratings.append(h('div', { class: 'rating' },
          h('div', { class: 'rating-head' }, h('strong', {}, s.name), s.custom || !isCore(s.name) ? h('button', { class: 'link-btn', type: 'button', onclick: () => { d.skills = d.skills.filter((x) => x !== s); persist(d); paintRatings(); syncChips(); } }, 'Remove') : null),
          levelPicker(s.name, s.level, (v) => { s.level = v; persist(d); })));
      });
    };
    const syncChips = () => groups.querySelectorAll('input[type=checkbox]').forEach((i) => { i.checked = !!skill(i.dataset.skill); });
    const toggle = (s, on) => {
      if (on && !skill(s.name)) d.skills.push({ name: s.name, category: s.category, level: 0, studyTime: '', confidence: 0, hasProject: false, custom: false });
      if (!on) d.skills = d.skills.filter((x) => x.name !== s.name);
      persist(d); paintRatings();
    };
    const groups = h('div', {}, cat.categories.map((c) => fieldset(c, h('div', { class: 'chips' }, cat.skills.filter((s) => s.core && s.category === c).map((s) => {
      const node = chip({ label: s.name, checked: !!skill(s.name), onChange: (on) => toggle(s, on) });
      node.querySelector('input').dataset.skill = s.name;
      return node;
    })))));

    const nameIn = h('input', { class: 'input', type: 'text', list: 'skill-suggest', maxLength: 50, placeholder: 'For example Docker, Rust or Figma' });
    const catSel = selectFor(cat.categories.map((c) => ({ value: c, label: c })), 'Advanced Technologies', { 'aria-label': 'Category for the custom skill' });
    const addErr = h('p', { class: 'error', role: 'alert' });
    const add = () => {
      const n = nameIn.value.replace(/\s+/g, ' ').trim();
      addErr.textContent = '';
      if (n.length < 1) { addErr.textContent = 'Type a skill name first.'; return; }
      if (skill(catalogEntry(n)?.name || n)) { addErr.textContent = `${catalogEntry(n)?.name || n} is already in your list.`; return; }
      const known = catalogEntry(n);
      d.skills.push({ name: known ? known.name : n, category: known ? known.category : catSel.value, level: 0, studyTime: '', confidence: 0, hasProject: false, custom: !known });
      nameIn.value = ''; persist(d); paintRatings(); syncChips();
      ratings.lastElementChild?.querySelector('input')?.focus();
    };
    nameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    paintRatings();
    return [
      h('h1', { tabindex: -1, id: 'step-title' }, 'What do you already know?'),
      h('p', { class: 'lede' }, 'Select the skills you have, then rate each one. Be honest: the ratings drive your recommendations and gaps.'),
      groups,
      fieldset('Add another skill', h('div', { class: 'add-skill' },
        h('div', { class: 'add-skill-row' }, h('label', { class: 'sr-only', for: 'custom-skill' }, 'Skill name'), (nameIn.id = 'custom-skill', nameIn), catSel, h('button', { class: 'btn', type: 'button', onclick: add }, 'Add skill')), addErr,
        h('datalist', { id: 'skill-suggest' }, cat.skills.filter((s) => !s.core).map((s) => h('option', { value: s.name })))), { hint: 'Skills that are not listed above can be added here.' }),
      h('section', { class: 'rate-section', 'aria-labelledby': 'rate-h' }, h('h2', { id: 'rate-h' }, 'Rate your proficiency'),
        h('p', { class: 'note' }, h('strong', {}, 'Self-reported. '), 'Your ratings are your own judgement, not test scores.'),
        errors.skills ? h('p', { class: 'error', role: 'alert' }, errors.skills) : null, ratings),
    ];
  }

  // ---------- step 3 ----------
  function step3() {
    const skillRows = d.skills.length ? d.skills.map((s) => h('div', { class: 'xp-row' },
      h('strong', { class: 'xp-name' }, s.name),
      field('Time spent studying', selectFor([{ value: '', label: 'Select' }, ...cat.studyTimes], s.studyTime, { onchange: (e) => { s.studyTime = e.target.value; persist(d); } })),
      field('Confidence applying it', selectFor(CONFIDENCE, s.confidence || '', { onchange: (e) => { s.confidence = Number(e.target.value) || 0; persist(d); } })),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s.hasProject, onchange: (e) => { s.hasProject = e.target.checked; persist(d); } }), h('span', {}, 'I have built a project using it')))) : [h('p', { class: 'muted' }, 'You did not select any skills, so there is nothing to detail here. You can still add projects and experience below.')];

    const projHost = h('ul', { class: 'entries' });
    const paintProj = () => projHost.replaceChildren(...(d.projects.length ? d.projects.map((p, i) => h('li', {}, h('div', {}, h('strong', {}, p.title), p.description ? h('p', {}, p.description) : null, p.skills?.length ? h('p', { class: 'muted' }, 'Skills: ' + p.skills.join(', ')) : null), h('button', { class: 'link-btn', type: 'button', onclick: () => { d.projects.splice(i, 1); persist(d); paintProj(); } }, 'Remove'))) : [h('li', { class: 'muted' }, 'No projects added yet.')]));
    const pTitle = h('input', { class: 'input', type: 'text', maxLength: 100 });
    const pDesc = h('input', { class: 'input', type: 'text', maxLength: 400 });
    const pSkills = new Set();
    const pChips = d.skills.length ? h('div', { class: 'chips chips-sm' }, d.skills.map((s) => chip({ label: s.name, checked: false, onChange: (on) => (on ? pSkills.add(s.name) : pSkills.delete(s.name)) }))) : null;
    const pErr = h('p', { class: 'error', role: 'alert' });
    const addProject = () => {
      pErr.textContent = '';
      if (!pTitle.value.trim()) { pErr.textContent = 'Give the project a title.'; pTitle.focus(); return; }
      d.projects.push({ title: pTitle.value.trim(), description: pDesc.value.trim(), skills: [...pSkills] });
      pTitle.value = ''; pDesc.value = ''; pSkills.clear(); pChips?.querySelectorAll('input').forEach((i) => { i.checked = false; });
      persist(d); paintProj();
    };

    const expHost = h('ul', { class: 'entries' });
    const paintExp = () => expHost.replaceChildren(...(d.experience.length ? d.experience.map((x, i) => h('li', {}, h('div', {}, h('strong', {}, x.title), h('p', { class: 'muted' }, [x.type, x.org].filter(Boolean).join(' · '))), h('button', { class: 'link-btn', type: 'button', onclick: () => { d.experience.splice(i, 1); persist(d); paintExp(); } }, 'Remove'))) : [h('li', { class: 'muted' }, 'No internships or certifications added yet.')]));
    const eType = selectFor(cat.experienceTypes.map((t) => ({ value: t, label: t })), 'Internship');
    const eTitle = h('input', { class: 'input', type: 'text', maxLength: 100 });
    const eOrg = h('input', { class: 'input', type: 'text', maxLength: 100 });
    const eErr = h('p', { class: 'error', role: 'alert' });
    const addExp = () => {
      eErr.textContent = '';
      if (!eTitle.value.trim()) { eErr.textContent = 'Add a title, for example the role or certificate name.'; eTitle.focus(); return; }
      d.experience.push({ type: eType.value, title: eTitle.value.trim(), org: eOrg.value.trim() });
      eTitle.value = ''; eOrg.value = ''; persist(d); paintExp();
    };
    paintProj(); paintExp();

    return [
      h('h1', { tabindex: -1, id: 'step-title' }, 'How have you used them?'),
      h('p', { class: 'lede' }, 'This is optional, but projects and experience make your recommendations more accurate.'),
      h('section', { 'aria-labelledby': 'xp-h' }, h('h2', { id: 'xp-h' }, 'Your skills in practice'), h('div', { class: 'xp-list' }, skillRows)),
      h('section', { 'aria-labelledby': 'proj-h' }, h('h2', { id: 'proj-h' }, 'Projects'), projHost,
        h('div', { class: 'add-box' }, field('Project title', pTitle), field('Short description (optional)', pDesc),
          pChips ? fieldset('Skills used', pChips, { className: 'fieldset-tight' }) : null, pErr, h('button', { class: 'btn', type: 'button', onclick: addProject }, 'Add project'))),
      h('section', { 'aria-labelledby': 'exp-h' }, h('h2', { id: 'exp-h' }, 'Internships and certifications'), expHost,
        h('div', { class: 'add-box' }, h('div', { class: 'two-col' }, field('Type', eType), field('Title or role', eTitle)), field('Company or issuer (optional)', eOrg), eErr, h('button', { class: 'btn', type: 'button', onclick: addExp }, 'Add'))),
    ];
  }

  // ---------- step 4 ----------
  function step4() {
    const sec = (title, stepIdx, body) => h('section', { class: 'review-sec' }, h('div', { class: 'review-head' }, h('h2', {}, title), h('button', { class: 'link-btn', type: 'button', onclick: () => jumpTo(stepIdx) }, `Edit ${title.toLowerCase()}`)), body);
    const lv = (v) => cat.levels.find((l) => l.value === v)?.label || '';
    const st = (v) => cat.studyTimes.find((s) => s.value === v)?.label || 'Not given';
    return [
      h('h1', { tabindex: -1, id: 'step-title' }, 'Review your profile'),
      h('p', { class: 'lede' }, 'Check everything below. You can edit any section, and change it again later from My Profile.'),
      errors.submit ? h('p', { class: 'form-error', role: 'alert' }, errors.submit) : null,
      sec('Account', 0, h('dl', { class: 'kv' }, [h('dt', {}, 'Email'), h('dd', {}, d.email), h('dt', {}, 'Password'), h('dd', {}, 'Set (hidden)')])),
      sec('Details', 1, h('dl', { class: 'kv' }, [['Name', d.name], ['College', d.college], ['Degree', `${d.degree}, ${cat.department}`], ['Year', `${d.year}${['st', 'nd', 'rd', 'th'][d.year - 1]} year`], ['Interests', d.interests.join(', ')]].flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)]))),
      sec('Skills', 2, d.skills.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' }, h('thead', {}, h('tr', {}, ['Skill', 'Level (self-reported)', 'Studied', 'Confidence', 'Built a project'].map((x) => h('th', { scope: 'col' }, x)))), h('tbody', {}, d.skills.map((s) => h('tr', {}, h('th', { scope: 'row' }, s.name), h('td', {}, lv(s.level)), h('td', {}, st(s.studyTime)), h('td', {}, s.confidence ? `${s.confidence} of 5` : 'Not given'), h('td', {}, s.hasProject ? 'Yes' : 'No')))))) : h('p', { class: 'muted' }, 'No skills selected.')),
      sec('Experience', 3, h('div', {}, h('h3', { class: 'h-sm' }, 'Projects'), d.projects.length ? h('ul', { class: 'plain' }, d.projects.map((p) => h('li', {}, p.title))) : h('p', { class: 'muted' }, 'None added.'), h('h3', { class: 'h-sm' }, 'Internships and certifications'), d.experience.length ? h('ul', { class: 'plain' }, d.experience.map((x) => h('li', {}, `${x.title}${x.org ? `, ${x.org}` : ''} (${x.type})`))) : h('p', { class: 'muted' }, 'None added.'))),
    ];
  }

  // ---------- submit ----------
  async function submit() {
    const e = validate(0);
    if (Object.keys(e).length) {
      // for example after a page refresh, which deliberately forgets the password
      d.step = 0; errors = { ...e, ...(e.password ? { password: 'Re-enter your password to finish (it is never saved in your browser).' } : {}) };
      draw(true); focusFirstError(); return;
    }
    d.email = d.email.trim();
    nextBtn.disabled = true; backBtn.disabled = true; nextBtn.textContent = 'Saving';
    const keepPw = keep.pw;
    try {
      await api('POST', '/auth/register', { email: d.email, password: keepPw, profile: { ...d, department: cat.department } });
    } catch (err) {
      nextBtn.disabled = false; backBtn.disabled = false; nextBtn.textContent = 'Generate My Career Roadmap';
      if (err instanceof ApiError && err.fields && Object.keys(err.fields).length) {
        const f = err.fields;
        if (f.email || f.password) { d.step = 0; errors = { email: f.email, password: f.password }; }
        else { errors = { ...f }; d.step = f.name || f.college || f.degree || f.year || f.interests ? 1 : f.skills ? 2 : 4; errors.submit = err.message; }
      } else errors = { submit: err.message };
      draw(true); return;
    }
    await generating();
  }

  async function generating() {
    const lines = ['Saving your profile', 'Matching your skills to 13 careers', 'Analysing skill gaps', 'Preparing your roadmap'];
    const list = h('ul', { class: 'gen-list' }, lines.map((l) => h('li', {}, l)));
    root.replaceChildren(h('main', { id: 'main', class: 'gen' }, h('h1', { tabindex: -1 }, 'Building your career roadmap'), list, h('div', { class: 'gen-bar', 'aria-hidden': 'true' }, h('span', {}))));
    root.querySelector('h1').focus();
    [...list.children].forEach((li, i) => setTimeout(() => li.classList.add('on'), 250 + i * 330));
    const warm = (async () => { await loadMe(); try { await api('GET', '/dashboard'); } catch { /* dashboard retries itself */ } })();
    await Promise.all([warm, new Promise((r) => setTimeout(r, 1700))]);
    clearDraft();
    go('/dashboard');
  }

  // ---------- draw ----------
  function draw(animate = false) {
    const builders = [stepAccount, step1, step2, step3, step4];
    const wrap = h('section', { class: 'onb-step' + (animate ? (direction > 0 ? ' in-fwd' : ' in-back') : '') }, builders[d.step]());
    stepHost.replaceChildren(wrap);
    paintRail();
    backBtn.hidden = d.step === 0;
    nextBtn.textContent = d.step === 4 ? 'Generate My Career Roadmap' : 'Continue';
    if (animate) { window.scrollTo(0, 0); wrap.querySelector('#step-title')?.focus({ preventScroll: true }); }
    const errCount = Object.keys(errors).filter((k) => k !== 'submit').length;
    if (errCount && d.step < 4) wrap.prepend(h('p', { class: 'form-error', role: 'alert' }, `Please fix ${errCount} ${errCount === 1 ? 'field' : 'fields'} below.`));
  }

  draw(false);
  return root;
}

export async function signinView() {
  const err = h('p', { class: 'form-error', role: 'alert', hidden: true });
  const email = h('input', { class: 'input', type: 'email', autocomplete: 'email', required: true, 'data-autofocus': '' });
  const pw = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', required: true });
  const btn = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Sign in');
  const form = h('form', { class: 'auth-form', novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    err.hidden = true;
    if (!email.value.trim() || !pw.value) { err.textContent = 'Enter your email and password.'; err.hidden = false; return; }
    btn.disabled = true; btn.textContent = 'Signing in';
    try {
      await api('POST', '/auth/login', { email: email.value, password: pw.value });
      await loadMe();
      toast('Welcome back.');
      go('/dashboard');
    } catch (e) { err.textContent = e.message; err.hidden = false; btn.disabled = false; btn.textContent = 'Sign in'; }
  } },
  field('Email', email), field('Password', pw), err, btn);
  return h('div', { class: 'auth' },
    h('a', { class: 'brand', href: '#/' }, brandMark(), h('span', {}, 'CareerPath AI')),
    h('main', { id: 'main', class: 'auth-card' }, h('h1', {}, 'Sign in'), h('p', { class: 'lede' }, 'Pick up where you left off.'), form,
      h('p', { class: 'auth-alt' }, 'New here? ', h('a', { href: '#/onboarding' }, 'Start your career journey'))));
}
