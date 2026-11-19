import { h, toast, ApiError } from '../lib.js';
import { state, saveProfile, levelName } from '../state.js';
import { pageHead, field, ring, selectFor, emptyState, progressBar } from '../components.js';
import { choice, chip, fieldset } from '../pickers.js';

export async function profileView({ rerender }) {
  const cat = state.catalog;
  const p = JSON.parse(JSON.stringify(state.profile));
  let errors = {};

  const name = h('input', { class: 'input', type: 'text', value: p.name, maxLength: 80, autocomplete: 'name', oninput: (e) => { p.name = e.target.value; } });
  const interestsHost = h('div', { class: 'chips' }, cat.interests.map((i) => chip({
    label: i, checked: p.interests.includes(i),
    onChange: (on) => {
      if (i === 'Not Sure Yet' && on) p.interests = ['Not Sure Yet'];
      else { p.interests = p.interests.filter((x) => x !== i && x !== 'Not Sure Yet'); if (on) p.interests.push(i); }
      interestsHost.querySelectorAll('input').forEach((inp) => { inp.checked = p.interests.includes(inp.nextSibling.textContent); });
    },
  })));

  const projHost = h('ul', { class: 'entries' });
  const paintProj = () => projHost.replaceChildren(...(p.projects.length ? p.projects.map((x, i) => h('li', {}, h('div', {}, h('strong', {}, x.title), x.description ? h('p', {}, x.description) : null, x.skills?.length ? h('p', { class: 'muted' }, 'Skills: ' + x.skills.join(', ')) : null), h('button', { class: 'link-btn danger', type: 'button', onclick: () => { p.projects.splice(i, 1); paintProj(); } }, 'Remove'))) : [h('li', { class: 'muted' }, 'No projects added yet.')]));
  const pTitle = h('input', { class: 'input', type: 'text', maxLength: 100 });
  const pDesc = h('input', { class: 'input', type: 'text', maxLength: 400 });
  const pSel = new Set();
  const pChips = p.skills.length ? h('div', { class: 'chips chips-sm' }, p.skills.map((s) => chip({ label: s.name, checked: false, onChange: (on) => (on ? pSel.add(s.name) : pSel.delete(s.name)) }))) : null;
  const pErr = h('p', { class: 'error', role: 'alert' });
  paintProj();

  const expHost = h('ul', { class: 'entries' });
  const paintExp = () => expHost.replaceChildren(...(p.experience.length ? p.experience.map((x, i) => h('li', {}, h('div', {}, h('strong', {}, x.title), h('p', { class: 'muted' }, [x.type, x.org].filter(Boolean).join(' · '))), h('button', { class: 'link-btn danger', type: 'button', onclick: () => { p.experience.splice(i, 1); paintExp(); } }, 'Remove'))) : [h('li', { class: 'muted' }, 'No internships or certifications added yet.')]));
  const eType = selectFor(cat.experienceTypes.map((t) => ({ value: t, label: t })), 'Internship');
  const eTitle = h('input', { class: 'input', type: 'text', maxLength: 100 });
  const eOrg = h('input', { class: 'input', type: 'text', maxLength: 100 });
  const eErr = h('p', { class: 'error', role: 'alert' });
  paintExp();

  const saveBtn = h('button', { class: 'btn btn-primary', type: 'button', onclick: async () => {
    saveBtn.disabled = true; saveBtn.textContent = 'Saving';
    try { await saveProfile(p); toast('Profile saved.'); rerender(); }
    catch (e) { errors = e.fields || {}; toast(e.message, 'error'); saveBtn.disabled = false; saveBtn.textContent = 'Save changes'; if (e instanceof ApiError && e.fields) showErrors(); }
  } }, 'Save changes');
  const formErr = h('p', { class: 'form-error', role: 'alert', hidden: true });
  const showErrors = () => { formErr.hidden = false; formErr.textContent = Object.values(errors).join(' '); };

  const comp = state.completion;
  const skillsByLevel = [...p.skills].sort((a, b) => b.level - a.level);

  return h('div', {},
    pageHead('My Profile', 'Everything we use to recommend careers. Changes apply to every page once saved.', saveBtn),
    h('section', { class: 'panel completion' },
      ring(comp.percent, 112, 10, 'complete'),
      h('div', {}, h('h2', {}, 'Profile completion'), h('ul', { class: 'checklist' }, comp.items.map((i) => h('li', { class: i.ok ? 'ok' : '' }, h('span', { class: 'check-mark', 'aria-hidden': 'true' }, i.ok ? 'Done' : 'To do'), i.label))))),
    formErr,
    h('section', { class: 'panel' }, h('h2', {}, 'Personal and academic details'),
      field('Full name', name),
      field('Current college', selectFor(cat.colleges.map((c) => ({ value: c, label: c })), p.college, { onchange: (e) => { p.college = e.target.value; } })),
      h('div', { class: 'two-col' },
        field('Degree', selectFor(cat.degrees.map((x) => ({ value: x, label: x })), p.degree, { onchange: (e) => { p.degree = e.target.value; } })),
        h('div', { class: 'field' }, h('span', { class: 'label-like' }, 'Department'), h('p', { class: 'static-value' }, cat.department))),
      field('Current academic year', selectFor([1, 2, 3, 4].map((y) => ({ value: y, label: `${y}${['st', 'nd', 'rd', 'th'][y - 1]} Year` })), p.year, { onchange: (e) => { p.year = Number(e.target.value); } })),
      fieldset('Career interests', interestsHost)),
    h('section', { class: 'panel' }, h('h2', {}, 'Technical skills'),
      p.skills.length ? h('ul', { class: 'skill-lines' }, skillsByLevel.map((s) => h('li', {}, h('span', {}, s.name), h('span', { class: 'muted' }, `${levelName(s.level)} (self-reported)`)))) : emptyState('No skills yet', 'Add your skills to get recommendations.'),
      h('a', { class: 'btn btn-sm', href: '#/skills' }, 'Edit skills and levels')),
    h('section', { class: 'panel' }, h('h2', {}, 'Projects'), projHost,
      h('div', { class: 'add-box' }, field('Project title', pTitle), field('Short description (optional)', pDesc), pChips ? fieldset('Skills used', pChips, { className: 'fieldset-tight' }) : null, pErr,
        h('button', { class: 'btn', type: 'button', onclick: () => {
          pErr.textContent = '';
          if (!pTitle.value.trim()) { pErr.textContent = 'Give the project a title.'; return; }
          p.projects.push({ title: pTitle.value.trim(), description: pDesc.value.trim(), skills: [...pSel] });
          pTitle.value = ''; pDesc.value = ''; pSel.clear(); pChips?.querySelectorAll('input').forEach((i) => { i.checked = false; }); paintProj();
        } }, 'Add project'))),
    h('section', { class: 'panel' }, h('h2', {}, 'Internships and certifications'), expHost,
      h('div', { class: 'add-box' }, h('div', { class: 'two-col' }, field('Type', eType), field('Title or role', eTitle)), field('Company or issuer (optional)', eOrg), eErr,
        h('button', { class: 'btn', type: 'button', onclick: () => {
          eErr.textContent = '';
          if (!eTitle.value.trim()) { eErr.textContent = 'Add a title, for example the role or certificate name.'; return; }
          p.experience.push({ type: eType.value, title: eTitle.value.trim(), org: eOrg.value.trim() });
          eTitle.value = ''; eOrg.value = ''; paintExp();
        } }, 'Add'))),
    h('div', { class: 'row-actions' }, h('p', { class: 'muted' }, 'Project and experience changes are saved with the button above.'), h('button', { class: 'btn btn-primary', type: 'button', onclick: () => saveBtn.click() }, 'Save changes')));
}
