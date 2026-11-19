// Accessible form controls built on native inputs: radios, checkboxes and the 1-5 level picker.
import { h } from './lib.js';
import { state } from './state.js';

let uid = 0;
const nextId = (p) => `${p}-${++uid}`;

/** Radio option styled as a bordered choice. */
export function choice({ name, value, label, sub, checked, onChange, inline }) {
  const input = h('input', { type: 'radio', name, value: String(value), checked: !!checked, onchange: () => onChange?.(value) });
  return h('label', { class: 'choice' + (inline ? ' choice-inline' : '') }, input, h('span', { class: 'choice-box' }, h('span', { class: 'choice-label' }, label), sub ? h('span', { class: 'choice-sub' }, sub) : null));
}

/** Checkbox styled as a toggle chip. */
export function chip({ label, checked, onChange, title }) {
  const input = h('input', { type: 'checkbox', checked: !!checked, onchange: (e) => onChange?.(e.target.checked, e.target) });
  return h('label', { class: 'chip', title: title || null }, input, h('span', {}, label));
}

export function fieldset(legend, children, { hint, error, className = '' } = {}) {
  const id = nextId('fs');
  return h('fieldset', { class: `fieldset ${className}${error ? ' has-error' : ''}`, 'aria-describedby': error ? `${id}-err` : null },
    h('legend', {}, legend),
    hint ? h('p', { class: 'hint' }, hint) : null,
    children,
    error ? h('p', { class: 'error', id: `${id}-err` }, error) : null);
}

/** Segmented 1-5 proficiency picker with a description of the chosen level. */
export function levelPicker(skillName, value, onChange) {
  const name = nextId('lvl');
  const desc = h('p', { class: 'level-desc', 'aria-live': 'polite' });
  const paint = (v) => {
    const l = state.catalog.levels.find((x) => x.value === v);
    desc.textContent = l ? `${l.label}: ${l.description}` : 'Choose how well you know this skill.';
  };
  paint(value);
  const group = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': `${skillName} proficiency` },
    state.catalog.levels.map((l) => h('label', { class: 'seg' },
      h('input', { type: 'radio', name, value: l.value, checked: value === l.value, onchange: () => { paint(l.value); onChange(l.value); } }),
      h('span', {}, h('b', {}, l.value), l.label))));
  return h('div', { class: 'level-picker' }, group, desc);
}
