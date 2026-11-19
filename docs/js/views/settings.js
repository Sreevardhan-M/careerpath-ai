import { h, api, toast } from '../lib.js';
import { state } from '../state.js';
import { pageHead, field, confirmDialog } from '../components.js';

export async function settingsView({ rerender }) {
  const ai = state.ai;

  // change password
  const cur = h('input', { class: 'input', type: 'password', autocomplete: 'current-password' });
  const nw = h('input', { class: 'input', type: 'password', autocomplete: 'new-password' });
  const pwMsg = h('p', { class: 'error', role: 'alert' });
  const pwForm = h('form', { novalidate: true, onsubmit: async (e) => {
    e.preventDefault(); pwMsg.textContent = ''; pwMsg.classList.add('error'); pwMsg.classList.remove('success');
    if (nw.value.length < 8) { pwMsg.textContent = 'New password must be at least 8 characters.'; return; }
    try { await api('POST', '/account/password', { current: cur.value, next: nw.value }); cur.value = ''; nw.value = ''; pwMsg.classList.remove('error'); pwMsg.classList.add('success'); pwMsg.textContent = 'Password updated.'; toast('Password updated.'); }
    catch (x) { pwMsg.textContent = x.message; }
  } }, field('Current password', cur), field('New password', nw, { hint: 'At least 8 characters.' }), pwMsg, h('button', { class: 'btn', type: 'submit' }, 'Update password'));

  const exportData = async () => {
    try {
      const res = await fetch('/api/export', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Export failed.');
      const url = URL.createObjectURL(await res.blob());
      const a = h('a', { href: url, download: 'careerpath-data.json' });
      document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast('Your data was downloaded.');
    } catch (e) { toast(e.message, 'error'); }
  };

  const reset = async () => {
    const ok = await confirmDialog({ title: 'Reset progress?', body: 'This clears completed tasks, resources, goals, achievements and activity history. Your profile and skills stay.', confirmLabel: 'Reset progress', danger: true });
    if (!ok) return;
    try { await api('POST', '/progress/reset', {}); toast('Progress reset.'); rerender(); } catch (e) { toast(e.message, 'error'); }
  };

  const remove = async () => {
    const pw = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', 'aria-label': 'Confirm your password' });
    const ok = await confirmDialog({ title: 'Delete your account?', body: 'This permanently deletes your profile, progress and goals. Enter your password to confirm.', confirmLabel: 'Delete account', danger: true, extra: { node: h('div', { class: 'field' }, pw), get value() { return pw.value || true; } } });
    if (!ok) return;
    try { await api('DELETE', '/account', { password: pw.value }); state.me = null; state.profile = null; toast('Account deleted.'); location.hash = '/'; }
    catch (e) { toast(e.message, 'error'); }
  };

  return h('div', {},
    pageHead('Settings', 'Account, data and how recommendations are produced.'),
    h('section', { class: 'panel' }, h('h2', {}, 'Account'), h('dl', { class: 'kv' }, h('dt', {}, 'Email'), h('dd', {}, state.me.email), h('dt', {}, 'Name'), h('dd', {}, state.profile.name)), h('p', { class: 'muted' }, 'Edit your name, college, year and interests on My Profile.')),
    h('section', { class: 'panel' }, h('h2', {}, 'Change password'), pwForm),
    h('section', { class: 'panel' }, h('h2', {}, 'Recommendation engine'),
      ai?.configured ? h('p', {}, h('strong', {}, 'AI-assisted. '), `An AI model (${ai.model}) is configured on the server. It reorders the top careers and writes explanations on top of the rule-based analysis. Your name and email are never sent to it.`)
        : h('p', {}, h('strong', {}, 'Rule-based. '), 'No AI key is configured on the server, so recommendations and roadmaps come from the built-in rule-based engine. Set ANTHROPIC_API_KEY in the server environment to enable AI explanations. The app always labels which source you are seeing.')),
    h('section', { class: 'panel' }, h('h2', {}, 'Your data'),
      h('div', { class: 'row-actions' }, h('button', { class: 'btn', type: 'button', onclick: exportData }, 'Download my data (JSON)'), h('button', { class: 'btn', type: 'button', onclick: reset }, 'Reset progress'))),
    h('section', { class: 'panel danger-zone' }, h('h2', {}, 'Delete account'), h('p', { class: 'muted' }, 'Removes your account and all saved data. This cannot be undone.'), h('button', { class: 'btn btn-danger', type: 'button', onclick: remove }, 'Delete my account')));
}
