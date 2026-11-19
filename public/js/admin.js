const form = document.getElementById('f');
const err = document.getElementById('err');
const out = document.getElementById('out');
const cell = (tag, text) => { const el = document.createElement(tag); el.textContent = text; return el; };

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  err.textContent = '';
  out.replaceChildren();
  const token = document.getElementById('t').value.trim();
  if (!token) { err.textContent = 'Enter the admin token.'; return; }
  try {
    const res = await fetch('/api/admin/users', { headers: { authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { err.textContent = res.status === 404 ? 'Admin access is not enabled on this server.' : data.error || 'Request failed.'; return; }
    const summary = cell('p', `${data.count} registered ${data.count === 1 ? 'account' : 'accounts'}`);
    const table = document.createElement('table');
    table.className = 'table';
    const head = document.createElement('tr');
    ['#', 'Email', 'Name', 'College', 'Year', 'Registered'].forEach((h) => head.append(cell('th', h)));
    const thead = document.createElement('thead'); thead.append(head);
    const tbody = document.createElement('tbody');
    for (const u of data.users) {
      const tr = document.createElement('tr');
      [u.id, u.email, u.name, u.college, u.year ?? '', new Date(u.createdAt).toLocaleString('en-IN')].forEach((v) => tr.append(cell('td', String(v))));
      tbody.append(tr);
    }
    table.append(thead, tbody);
    const wrap = document.createElement('div'); wrap.className = 'table-wrap'; wrap.append(table);
    out.append(summary, data.count ? wrap : cell('p', 'No accounts yet.'));
  } catch { err.textContent = 'Could not reach the server.'; }
});
