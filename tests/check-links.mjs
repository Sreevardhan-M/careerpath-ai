// Checks every learning resource URL. Run: npm run check:links
// Uses curl (which honours HTTPS_PROXY). Sites that block bots may answer 403/429; those are reported as "blocked", not "broken".
import { execFileSync } from 'node:child_process';
import { RESOURCES } from '../server/data/resources.js';

const urls = [...new Set(RESOURCES.map((r) => r.url))];
const results = { ok: [], blocked: [], broken: [], unreachable: [] };

for (const url of urls) {
  let code = '000';
  try {
    code = execFileSync('curl', ['-sS', '-L', '-o', '/dev/null', '-w', '%{http_code}', '-m', '20', '-A', 'Mozilla/5.0 (link-check)', url], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { /* curl failed: proxy or DNS */ }
  const n = Number(code);
  if (n >= 200 && n < 400) results.ok.push(url);
  else if (n === 403 || n === 429 || n === 999) results.blocked.push(`${n} ${url}`);
  else if (n === 404 || n === 410) results.broken.push(`${n} ${url}`);
  else results.unreachable.push(`${code} ${url}`);
}

console.log(`${urls.length} URLs: ${results.ok.length} ok, ${results.blocked.length} blocked by bot protection, ${results.broken.length} broken, ${results.unreachable.length} unreachable`);
for (const k of ['broken', 'blocked', 'unreachable']) if (results[k].length) console.log(`\n${k}:\n  ${results[k].join('\n  ')}`);
process.exit(results.broken.length ? 1 : 0);
