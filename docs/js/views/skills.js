import { h, toast, debounce } from '../lib.js';
import { state, saveProfile, levelName } from '../state.js';
import { pageHead, levelMeter, selectFor, selfReportedNote, emptyState, field } from '../components.js';

const CONF = [['', 'Not given'], [1, '1: Not confident'], [2, '2: Slightly'], [3, '3: Moderately'], [4, '4: Confident'], [5, '5: Very confident']].map(([value, label]) => ({ value, label }));

export async function skillsView({ rerender }) {
  const cat = state.catalog;
  const profile = JSON.parse(JSON.stringify(state.profile));
  const status = h('p', { class: 'save-status', 'aria-live': 'polite' });

  const persist = async () => {
    status.textContent = 'Saving';
    try { await saveProfile(profile); status.textContent = 'All changes saved'; summaryHost.replaceChildren(...summary()); }
    catch (e) { status.textContent = ''; toast(e.message, 'error'); }
  };
  const later = debounce(persist, 350);
  // Level and detail edits are coalesced; adds and removes save immediately.
  const save = () => { status.textContent = 'Saving'; later(); };
  const saveNow = () => persist();

  const summary = () => {
    if (profile.skills.length < 2) return [emptyState('Not enough skills yet', 'Add at least two skills to see your strongest and weakest.')];
    const sorted = [...profile.skills].sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
    const strong = sorted.slice(0, 3);
    const weak = [...sorted].reverse().slice(0, 3);
    const list = (arr) => h('ul', { class: 'skill-lines' }, arr.map((k) => h('li', {}, h('span', {}, k.name), h('span', { class: 'mini-level' }, levelName(k.level), levelMeter(k.level)))));
    return [h('div', { class: 'cols' }, h('div', {}, h('h3', { class: 'h-sm' }, 'Strongest'), list(strong)), h('div', {}, h('h3', { class: 'h-sm' }, 'Weakest'), list(weak)))];
  };
  const summaryHost = h('section', { class: 'panel' }, ...summary());

  const row = (s) => {
    const sel = selectFor(cat.levels.map((l) => ({ value: l.value, label: `${l.value}. ${l.label}` })), s.level, { 'aria-label': `${s.name} proficiency`, onchange: (e) => { s.level = Number(e.target.value); meterHost.replaceChildren(levelMeter(s.level)); save(); } });
    const meterHost = h('span', {}, levelMeter(s.level));
    const details = h('div', { class: 'skill-details', hidden: true },
      field('Time spent studying', selectFor([{ value: '', label: 'Not given' }, ...cat.studyTimes], s.studyTime, { onchange: (e) => { s.studyTime = e.target.value; save(); } })),
      field('Confidence applying it', selectFor(CONF, s.confidence || '', { onchange: (e) => { s.confidence = Number(e.target.value) || 0; save(); } })),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s.hasProject, onchange: (e) => { s.hasProject = e.target.checked; save(); } }), h('span', {}, 'I have built a project using it')));
    const toggle = h('button', { class: 'link-btn', type: 'button', 'aria-expanded': 'false', onclick: () => { details.hidden = !details.hidden; toggle.setAttribute('aria-expanded', String(!details.hidden)); toggle.textContent = details.hidden ? 'Details' : 'Hide details'; } }, 'Details');
    const remove = h('button', { class: 'link-btn danger', type: 'button', 'aria-label': `Remove ${s.name}`, onclick: () => { profile.skills = profile.skills.filter((x) => x !== s); rerenderList(); saveNow(); } }, 'Remove');
    return h('li', { class: 'skill-item' }, h('div', { class: 'skill-line' }, h('strong', {}, s.name), meterHost, sel, toggle, remove), details);
  };

  const listHost = h('div', {});
  const rerenderList = () => {
    listHost.replaceChildren(...cat.categories.concat('Custom').map((c) => {
      const items = profile.skills.filter((s) => (c === 'Custom' ? s.custom : !s.custom && s.category === c));
      if (!items.length) return null;
      return h('section', { class: 'panel' }, h('h2', {}, c === 'Custom' ? 'Custom skills' : c), h('ul', { class: 'skill-items' }, items.map(row)));
    }));
    if (!profile.skills.length) listHost.append(emptyState('No skills yet', 'Add your first skill below.'));
  };
  rerenderList();

  // add form
  const have = () => new Set(profile.skills.map((s) => s.name.toLowerCase()));
  const pick = selectFor([{ value: '', label: 'Choose from the catalogue' }, ...cat.skills.map((s) => ({ value: s.name, label: s.name }))], '', { id: 'add-pick' });
  const custom = h('input', { class: 'input', id: 'add-custom', type: 'text', maxLength: 50, placeholder: 'Or type a skill that is not listed' });
  const customCat = selectFor(cat.categories.map((c) => ({ value: c, label: c })), 'Advanced Technologies', { id: 'add-cat' });
  const level = selectFor(cat.levels.map((l) => ({ value: l.value, label: `${l.value}. ${l.label}` })), 1, { id: 'add-level' });
  const err = h('p', { class: 'error', role: 'alert' });
  const add = () => {
    err.textContent = '';
    const typed = custom.value.replace(/\s+/g, ' ').trim();
    const name = typed || pick.value;
    if (!name) { err.textContent = 'Choose or type a skill first.'; return; }
    const known = cat.skills.find((s) => s.name.toLowerCase() === name.toLowerCase());
    const finalName = known ? known.name : name;
    if (have().has(finalName.toLowerCase())) { err.textContent = `${finalName} is already in your list.`; return; }
    profile.skills.push({ name: finalName, category: known ? known.category : customCat.value, level: Number(level.value), studyTime: '', confidence: 0, hasProject: false, custom: !known });
    custom.value = ''; pick.value = ''; rerenderList(); saveNow();
    toast(`${finalName} added.`);
  };

  return h('div', {},
    pageHead('Skill Assessment', 'Rate each skill, add what is missing and keep it current as you learn.'),
    selfReportedNote(), status,
    h('h2', { class: 'section-h' }, 'Strongest and weakest skills'), summaryHost,
    listHost,
    h('section', { class: 'panel' }, h('h2', {}, 'Add a skill'),
      h('div', { class: 'add-grid' }, field('Catalogue skill', pick), field('Custom skill', custom), field('Category for a custom skill', customCat), field('Your level', level)),
      err, h('button', { class: 'btn btn-primary', type: 'button', onclick: add }, 'Add skill')));
}
