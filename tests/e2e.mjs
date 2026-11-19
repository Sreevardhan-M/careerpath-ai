// End-to-end browser test. Run: node --disable-warning=ExperimentalWarning tests/e2e.mjs
// Needs Playwright and a Chrome/Chromium. Set CHROME_PATH if Chrome is not at /usr/bin/google-chrome,
// and PLAYWRIGHT_PATH if Playwright is not resolvable as "playwright".
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { openDb } from '../server/db.js';
import { createApp } from '../server/index.js';

let pw;
try { pw = await import('playwright'); pw = pw.chromium ? pw : pw.default; }
catch { pw = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || '/opt/npm-tools/node_modules/playwright'); }

const SHOTS = process.env.SHOTS_DIR || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
delete process.env.ANTHROPIC_API_KEY;

const server = createApp({ db: openDb(':memory:') });
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await pw.chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-background-networking', '--disable-sync', '--disable-component-update', '--no-first-run', '--disable-default-apps'] });
const failures = [];
const consoleProblems = [];
let passed = 0;

async function newPage(viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.|ERR_FAILED|Failed to load resource/.test(m.text())) consoleProblems.push(`[console] ${m.text()}`); });
  page.on('pageerror', (e) => consoleProblems.push(`[pageerror] ${e.message}`));
  return { ctx, page };
}

async function step(name, fn) {
  try { await fn(); passed++; console.log('  ok  ', name); }
  catch (e) { failures.push(`${name}: ${e.message.split('\n')[0]}`); console.log('  FAIL', name, '\n       ', e.message.split('\n')[0]); }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const shot = async (page, name) => { if (SHOTS) await page.waitForTimeout(450); if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }); };

async function onboard(page, { name, college, year, email, interests = ['Web Development', 'Cloud Computing'] }) {
  await page.goto(base + '/');
  await page.getByRole('link', { name: 'Start My Career Journey' }).first().click();
  await page.waitForURL(/#\/onboarding/);

  // step 0: account first, with validation
  await page.getByRole('heading', { name: 'Create your account' }).waitFor();
  await page.getByRole('button', { name: 'Continue' }).click();
  expect(await page.getByText('Enter a valid email address.').isVisible(), 'email validation');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByLabel('Confirm password').fill('different123');
  await page.getByRole('button', { name: 'Continue' }).click();
  expect(await page.getByText('Passwords do not match.').isVisible(), 'confirm validation');
  await page.getByLabel('Confirm password').fill('password123');
  await page.getByRole('button', { name: 'Continue' }).click();

  // validation on empty details step
  await page.getByRole('heading', { name: 'Tell us about you' }).waitFor();
  await page.getByRole('button', { name: 'Continue' }).click();
  expect(await page.getByText(/Please fix \d+ fields? below/).isVisible(), 'details step should show validation summary');
  expect(await page.getByText('Choose your college.').isVisible(), 'college error missing');

  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Current college').selectOption(college);
  await page.getByLabel('Degree', { exact: true }).selectOption('B.E');
  await page.getByLabel('Current academic year').selectOption(String(year));
  for (const i of interests) await page.getByLabel(i, { exact: true }).check();
  await shot(page, `onb1-${year}`);
  await page.getByRole('button', { name: 'Continue' }).click();

  // step 2
  await page.getByRole('heading', { name: 'What do you already know?' }).waitFor();
  for (const s of ['HTML', 'CSS', 'JavaScript', 'React', 'SQL', 'Python']) await page.getByLabel(s, { exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  expect(await page.getByText(/Choose a proficiency level for/).first().isVisible(), 'unrated skills should block');
  const levels = { HTML: 'Intermediate', CSS: 'Intermediate', JavaScript: 'Basic', React: 'Beginner', SQL: 'Basic', Python: 'Advanced' };
  for (const [s, l] of Object.entries(levels)) await page.getByRole('radiogroup', { name: `${s} proficiency` }).locator('label.seg', { hasText: l }).click();
  // custom skill
  await page.locator('#custom-skill').fill('Docker');
  await page.getByRole('button', { name: 'Add skill' }).click();
  await page.getByRole('radiogroup', { name: 'Docker proficiency' }).locator('label.seg', { hasText: 'Basic' }).click();
  await page.locator('#custom-skill').fill('Rust');
  await page.getByRole('button', { name: 'Add skill' }).click();
  await page.getByRole('radiogroup', { name: 'Rust proficiency' }).locator('label.seg', { hasText: 'Beginner' }).click();
  await shot(page, `onb2-${year}`);
  await page.getByRole('button', { name: 'Continue' }).click();

  // step 3
  await page.getByRole('heading', { name: 'How have you used them?' }).waitFor();
  await page.locator('.xp-row').first().locator('select').first().selectOption('50to150');
  await page.locator('.xp-row').first().getByLabel('I have built a project using it').check();
  await page.getByLabel('Project title').fill('Portfolio site');
  await page.getByRole('button', { name: 'Add project' }).click();
  expect(await page.getByText('Portfolio site').first().isVisible(), 'project not listed');
  await page.getByLabel('Title or role').fill('Frontend intern');
  await page.getByLabel('Company or issuer (optional)').fill('Acme Labs');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  expect(await page.getByText('Frontend intern').first().isVisible(), 'experience not listed');
  await page.getByRole('button', { name: 'Continue' }).click();

  // step 4 review + edit
  await page.getByRole('heading', { name: 'Review your profile' }).waitFor();
  expect(await page.getByText(college).first().isVisible(), 'college missing in review');
  await page.getByRole('button', { name: 'Edit details' }).click();
  await page.getByRole('heading', { name: 'Tell us about you' }).waitFor();
  expect(await page.getByLabel('Full name').inputValue() === name, 'edit should keep previous answers');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('heading', { name: 'Review your profile' }).waitFor();
  expect(await page.getByText(email).first().isVisible(), 'email missing in review');
  await shot(page, `onb4-${year}`);
  await page.getByRole('button', { name: 'Generate My Career Roadmap' }).click();
  try { await page.waitForURL(/#\/dashboard/, { timeout: 15000 }); }
  catch (e) { throw new Error(`no dashboard after submit; page says: ${(await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 300)}`); }
}

// ---------------------------------------------------------------- run 1: Sapthagiri, year 2
console.log('Landing page');
{
  const { page } = await newPage();
  await step('landing renders required copy, title and favicon', async () => {
    await page.goto(base + '/');
    expect((await page.title()).startsWith('CareerPath AI'), `title was ${await page.title()}`);
    expect(!/vite/i.test(await page.title()), 'default vite title');
    expect(await page.getByRole('heading', { level: 1, name: 'Your Career Journey Starts Here' }).isVisible(), 'h1');
    expect(await page.getByText('Discover your strengths. Explore career possibilities. Build your future with AI.').isVisible(), 'subheading');
    expect(await page.getByRole('link', { name: 'Start My Career Journey' }).first().isVisible(), 'cta');
    expect(await page.locator('link[rel=icon]').getAttribute('href') === '/favicon.svg', 'favicon');
    for (const f of ['Personalized Profile', 'Skill Assessment', 'Career Recommendations', 'Skill Gap Analysis', 'Learning Resources', 'Progress Tracking']) expect(await page.getByRole('heading', { name: f }).isVisible(), `feature ${f}`);
    await shot(page, 'landing');
  });
  await step('signed-out dashboard redirects to sign in', async () => {
    await page.goto(base + '/#/dashboard');
    await page.waitForURL(/#\/signin/);
  });
  await step('sign in rejects bad credentials', async () => {
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password').fill('wrongpass1');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByText('Email or password is incorrect.').waitFor();
  });
  await page.context().close();
}

console.log('Onboarding with Sapthagiri NPS College, 2nd year');
const a = await newPage();
await step('full onboarding flow (Sapthagiri, year 2)', async () => {
  await onboard(a.page, { name: 'Asha Rao', college: 'Sapthagiri NPS College', year: 2, email: 'asha@example.com' });
  await a.page.getByRole('heading', { name: /Welcome, Asha/ }).waitFor();
  await shot(a.page, 'dashboard');
});

await step('dashboard shows every required section', async () => {
  for (const t of ['Top recommended careers', 'Skill gap summary', 'Current skill overview', 'Learning roadmap progress', 'Upcoming learning goals', 'Recently completed activities']) expect(await a.page.getByRole('heading', { name: t }).isVisible(), t);
  expect(await a.page.getByText(/Rule-based result/).isVisible(), 'rule-based label');
  expect(await a.page.locator('.rank-list li').count() === 3, 'three top careers');
});

await step('navigation: all nine pages load with a heading and no errors', async () => {
  for (const [hash, title] of [['dashboard', /Welcome/], ['profile', 'My Profile'], ['skills', 'Skill Assessment'], ['careers', 'Career Recommendations'], ['gap', 'Skill Gap Analysis'], ['resources', 'Learning Resources'], ['roadmap', 'My Roadmap'], ['progress', 'Progress Tracking'], ['settings', 'Settings']]) {
    await a.page.locator(`.sidebar a[data-nav="${hash}"]`).click();
    await a.page.getByRole('heading', { level: 1, name: title }).waitFor({ timeout: 8000 });
    expect(await a.page.locator('.sidebar a[aria-current="page"]').getAttribute('data-nav') === hash, `nav highlight for ${hash}`);
    await shot(a.page, `page-${hash}`);
  }
});

await step('profile editing persists after refresh', async () => {
  await a.page.goto(base + '/#/profile');
  await a.page.getByRole('heading', { level: 1, name: 'My Profile' }).waitFor();
  await a.page.getByLabel('Full name').fill('Asha R. Rao');
  await a.page.getByLabel('Current college').selectOption('NMAM Institute of Technology (NMAMIT)');
  await a.page.getByLabel('Current academic year').selectOption('3');
  await a.page.getByLabel('Title or role').fill('Cloud certificate');
  await a.page.locator('.add-box').last().getByLabel('Type').selectOption('Certification');
  await a.page.getByRole('button', { name: 'Add', exact: true }).click();
  await a.page.getByRole('button', { name: 'Save changes' }).first().click();
  await a.page.getByText('Profile saved.').waitFor();
  await a.page.reload();
  await a.page.getByRole('heading', { level: 1, name: 'My Profile' }).waitFor();
  expect(await a.page.getByLabel('Full name').inputValue() === 'Asha R. Rao', 'name not persisted');
  expect(await a.page.getByLabel('Current college').inputValue() === 'NMAM Institute of Technology (NMAMIT)', 'college not persisted');
  expect(await a.page.getByLabel('Current academic year').inputValue() === '3', 'year not persisted');
  expect(await a.page.getByText('Cloud certificate').first().isVisible(), 'experience not persisted');
});

await step('skills: update level, add, remove, summaries, persistence', async () => {
  await a.page.goto(base + '/#/skills');
  await a.page.getByRole('heading', { level: 1, name: 'Skill Assessment' }).waitFor();
  expect(await a.page.getByText(/Self-reported/).first().isVisible(), 'self-reported note');
  expect(await a.page.getByRole('heading', { name: 'Programming' }).isVisible() && await a.page.getByRole('heading', { name: 'Web Development' }).isVisible(), 'categories');
  expect(await a.page.getByRole('heading', { name: 'Strongest', exact: true }).isVisible() && await a.page.getByRole('heading', { name: 'Weakest', exact: true }).isVisible(), 'strongest and weakest');
  await a.page.getByLabel('React proficiency').selectOption('3');
  await a.page.getByText('All changes saved').waitFor();
  await a.page.locator('#add-pick').selectOption('Node.js');
  await a.page.locator('#add-level').selectOption('2');
  await a.page.getByRole('button', { name: 'Add skill' }).click();
  await a.page.getByText('All changes saved').waitFor();
  await a.page.getByRole('button', { name: 'Remove Rust' }).click();
  await a.page.getByText('All changes saved').waitFor();
  await a.page.reload();
  await a.page.getByRole('heading', { level: 1, name: 'Skill Assessment' }).waitFor();
  expect(await a.page.getByLabel('React proficiency').inputValue() === '3', 'React level not persisted');
  expect(await a.page.getByLabel('Node.js proficiency').count() === 1, 'Node.js not added');
  expect(await a.page.getByLabel('Rust proficiency').count() === 0, 'Rust not removed');
});

await step('career recommendations: top three, explanations, all careers, details', async () => {
  await a.page.goto(base + '/#/careers');
  await a.page.getByRole('heading', { level: 1, name: 'Career Recommendations' }).waitFor();
  expect(await a.page.locator('.career-list .career').count() === 3, 'top three');
  expect(await a.page.getByText('Why this matches you').count() === 3, 'explanations');
  expect(await a.page.locator('tbody tr').count() === 10, 'other ten careers');
  expect(!(await a.page.locator('main').innerText()).match(/\d+% (match|compatib)/i), 'fake compatibility percentage');
  const firstTitle = await a.page.locator('.career-list .career h3').first().innerText();
  expect(/Full Stack|Frontend/.test(firstTitle), `unexpected top career ${firstTitle}`);
  await a.page.locator('tbody a', { hasText: 'Details' }).first().click();
  await a.page.getByRole('heading', { name: 'Suggested projects' }).waitFor();
  expect(await a.page.getByRole('heading', { name: 'Learning roadmap' }).isVisible() && await a.page.getByRole('heading', { name: 'Relevant learning resources' }).isVisible(), 'detail sections');
  await a.page.goto(base + '/#/careers');
  await a.page.getByRole('heading', { level: 1, name: 'Career Recommendations' }).waitFor();
  await a.page.getByRole('button', { name: 'Set as my target' }).first().click();
  await a.page.getByText(/Target career set to/).waitFor();
});

await step('skill gap analysis: categories, priority, resources, roadmap button', async () => {
  await a.page.goto(base + '/#/gap');
  await a.page.getByRole('heading', { level: 1, name: 'Skill Gap Analysis' }).waitFor();
  for (const t of [/Recommended learning priority/, /Missing skills/, /Skills that need improvement/, /Existing strong skills/]) expect(await a.page.getByRole('heading', { name: t }).isVisible(), String(t));
  expect(await a.page.locator('.gapbar').count() > 3, 'gap bars');
  await a.page.locator('summary', { hasText: 'Suggested resources' }).first().click();
  expect(await a.page.locator('.gap-res a[target=_blank]').first().isVisible(), 'resource link');
  await a.page.locator('#career-select').selectOption('data-analyst');
  await a.page.getByRole('heading', { name: /Recommended learning priority/ }).waitFor();
  expect((await a.page.locator('main').innerText()).includes('Data Analytics'), 'switching career updates gap');
  await a.page.locator('#career-select').selectOption('full-stack');
  await a.page.getByRole('button', { name: 'Build My Learning Roadmap' }).click();
  await a.page.waitForURL(/#\/roadmap/);
  await a.page.getByRole('heading', { level: 1, name: 'My Roadmap' }).waitFor();
});

await step('roadmap: five phases, covered tasks skipped, completion updates and persists', async () => {
  for (const t of ['Fundamentals', 'Intermediate Skills', 'Advanced Skills', 'Practical Projects', 'Interview Preparation']) expect(await a.page.locator('.phase-title', { hasText: t }).count() === 1, t);
  const before = await a.page.locator('.roadmap-overall > div:last-child strong').innerText();
  const box = a.page.locator('.task input[type=checkbox]').first();
  await a.page.locator('.phase').first().locator('summary').click().catch(() => {});
  const phase = a.page.locator('.phase').first();
  if (!(await phase.evaluate((n) => n.open))) await phase.locator('summary').click();
  const t0 = phase.locator('.task input[type=checkbox]').first();
  await t0.check();
  await a.page.getByText('Task completed.').waitFor();
  const after = await a.page.locator('.roadmap-overall > div:last-child strong').innerText();
  expect(before !== after, `progress did not update (${before} -> ${after})`);
  await a.page.reload();
  await a.page.getByRole('heading', { level: 1, name: 'My Roadmap' }).waitFor();
  expect(await a.page.locator('.roadmap-overall > div:last-child strong').innerText() === after, 'roadmap progress not persisted');
  await shot(a.page, 'roadmap-done');
});

await step('resources: filters, completed and saved persist, links are real', async () => {
  await a.page.goto(base + '/#/resources');
  await a.page.getByRole('heading', { level: 1, name: 'Learning Resources' }).waitFor();
  const total = await a.page.locator('.resource').count();
  expect(total > 0, 'no resources');
  await a.page.locator('#f-skill').selectOption('React');
  const reactCount = await a.page.locator('.resource').count();
  expect(reactCount > 0 && reactCount < total, 'skill filter');
  await a.page.locator('#f-skill').selectOption('');
  await a.page.locator('#f-diff').selectOption('Beginner');
  await a.page.locator('#f-cat').selectOption('Documentation');
  expect(await a.page.locator('.resource').count() > 0, 'combined filters');
  await a.page.getByRole('button', { name: 'Clear filters' }).first().click();
  await a.page.locator('#f-q').fill('Learn React');
  const item = a.page.locator('.resource', { hasText: 'Learn React' }).first();
  const href = await item.locator('a').first().getAttribute('href');
  expect(/^https:\/\//.test(href), `bad link ${href}`);
  expect(await item.locator('a').first().getAttribute('target') === '_blank' && (await item.locator('a').first().getAttribute('rel')).includes('noopener'), 'link target/rel');
  await item.getByRole('button', { name: 'Mark completed' }).click();
  await a.page.getByText('Marked as completed.').waitFor();
  await item.getByRole('button', { name: 'Save for later' }).click();
  await a.page.getByText('Saved for later.').waitFor();
  await a.page.reload();
  await a.page.getByRole('heading', { level: 1, name: 'Learning Resources' }).waitFor();
  await a.page.locator('#f-q').fill('Learn React');
  const item2 = a.page.locator('.resource', { hasText: 'Learn React' }).first();
  expect(await item2.getByRole('button', { name: 'Completed' }).getAttribute('aria-pressed') === 'true', 'completed not persisted');
  expect(await item2.getByRole('button', { name: 'Saved' }).getAttribute('aria-pressed') === 'true', 'saved not persisted');
  await a.page.locator('#f-q').fill('zzzzzz');
  await a.page.getByText('No resources match').waitFor();
});

await step('progress tracking: stats, charts, goals with dates, achievements', async () => {
  await a.page.goto(base + '/#/progress');
  await a.page.getByRole('heading', { level: 1, name: 'Progress Tracking' }).waitFor();
  for (const t of ['Overall learning progress', 'Weekly learning activity', 'Career readiness over time', 'Learning goals', 'Achievements']) expect(await a.page.getByRole('heading', { name: t, exact: true }).isVisible(), t);
  expect(await a.page.locator('.chart svg').count() === 2, 'two charts');
  await a.page.getByLabel('New learning goal').fill('Finish React basics');
  await a.page.getByLabel('Target completion date').fill('2027-03-31');
  await a.page.getByRole('button', { name: 'Add goal' }).click();
  await a.page.getByText('Finish React basics').waitFor();
  await a.page.getByLabel('Finish React basics', { exact: true }).check();
  await a.page.getByText('Goal reached.').waitFor();
  await a.page.reload();
  await a.page.getByRole('heading', { level: 1, name: 'Progress Tracking' }).waitFor();
  expect(await a.page.getByLabel('Finish React basics', { exact: true }).isChecked(), 'goal not persisted');
  expect(await a.page.getByText('First step taken').isVisible(), 'achievement');
  await shot(a.page, 'progress');
});

await step('settings: password change, sign out, sign in with new password', async () => {
  await a.page.goto(base + '/#/settings');
  await a.page.getByRole('heading', { level: 1, name: 'Settings' }).waitFor();
  expect(await a.page.getByText(/Rule-based\./).first().isVisible(), 'engine status');
  await a.page.getByLabel('Current password').fill('password123');
  await a.page.getByLabel('New password').fill('newpassword456');
  await a.page.getByRole('button', { name: 'Update password' }).click();
  await a.page.getByText('Password updated.').first().waitFor();
  await a.page.getByRole('button', { name: 'Sign out' }).click();
  await a.page.waitForURL(/#\/$|\/$/);
  await a.page.goto(base + '/#/signin');
  await a.page.getByLabel('Email').fill('asha@example.com');
  await a.page.getByLabel('Password').fill('newpassword456');
  await a.page.getByRole('button', { name: 'Sign in' }).click();
  await a.page.waitForURL(/#\/dashboard/);
  await a.page.getByRole('heading', { name: /Welcome, Asha/ }).waitFor();
});

await step('data survives a new browser session (cookie kept)', async () => {
  await a.page.reload();
  await a.page.getByRole('heading', { name: /Welcome, Asha/ }).waitFor();
  expect(await a.page.getByText('Asha R. Rao').first().isVisible(), 'edited name on shell');
});

// ---------------------------------------------------------------- run 2: NMAMIT, year 4, mid-flow reload keeps draft
console.log('Onboarding with NMAMIT, 4th year');
const b = await newPage();
await step('draft survives refresh during onboarding', async () => {
  await b.page.goto(base + '/#/onboarding');
  await b.page.getByLabel('Email').fill('draft@example.com');
  await b.page.getByLabel('Password', { exact: true }).fill('password123');
  await b.page.getByLabel('Confirm password').fill('password123');
  await b.page.getByRole('button', { name: 'Continue' }).click();
  await b.page.getByLabel('Full name').fill('Ravi Kumar');
  await b.page.getByLabel('Current college').selectOption('NMAM Institute of Technology (NMAMIT)');
  await b.page.reload();
  await b.page.getByLabel('Full name').waitFor();
  expect(await b.page.getByLabel('Full name').inputValue() === 'Ravi Kumar', 'name draft lost');
  expect(await b.page.getByLabel('Current college').inputValue() === 'NMAM Institute of Technology (NMAMIT)', 'college draft lost');
  await b.page.evaluate(() => localStorage.clear());
});
await step('full onboarding flow (NMAMIT, year 4)', async () => {
  await onboard(b.page, { name: 'Ravi Kumar', college: 'NMAM Institute of Technology (NMAMIT)', year: 4, email: 'ravi@example.com', interests: ['Not Sure Yet'] });
  await b.page.getByRole('heading', { name: /Welcome, Ravi/ }).waitFor();
});
await step('final-year roadmap uses a shorter horizon', async () => {
  await b.page.goto(base + '/#/roadmap');
  await b.page.getByRole('heading', { level: 1, name: 'My Roadmap' }).waitFor();
  const txt = await b.page.locator('main').innerText();
  expect(/Placements are close|about 30 weeks/.test(txt) || /sized for year 4/.test(txt), 'year-4 adaptation text');
});

// ---------------------------------------------------------------- responsive
console.log('Responsive layouts');
for (const [label, vp] of [['mobile', { width: 375, height: 800 }], ['tablet', { width: 768, height: 1024 }]]) {
  const c = await newPage(vp);
  await step(`${label}: landing, sign in and every app page without horizontal overflow`, async () => {
    const overflow = async (name) => { const o = await c.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); expect(o <= 1, `${name} overflows by ${o}px at ${vp.width}px`); };
    await c.page.goto(base + '/');
    await overflow('landing');
    await shot(c.page, `${label}-landing`);
    await c.page.goto(base + '/#/signin');
    await c.page.getByLabel('Email').fill('ravi@example.com');
    await c.page.getByLabel('Password').fill('password123');
    await c.page.getByRole('button', { name: 'Sign in' }).click();
    await c.page.waitForURL(/#\/dashboard/);
    for (const hsh of ['dashboard', 'profile', 'skills', 'careers', 'gap', 'resources', 'roadmap', 'progress', 'settings']) {
      await c.page.goto(base + `/#/${hsh}`);
      await c.page.locator('h1').first().waitFor();
      await c.page.waitForTimeout(250);
      await overflow(hsh);
      if (vp.width < 600 && ['dashboard', 'gap', 'resources'].includes(hsh)) await shot(c.page, `${label}-${hsh}`);
    }
    if (vp.width < 820) {
      await c.page.getByRole('button', { name: 'Menu' }).click();
      expect(await c.page.locator('.sidebar.open').count() === 1, 'mobile menu opens');
      await c.page.getByRole('link', { name: /Skill Assessment/ }).click();
      await c.page.getByRole('heading', { level: 1, name: 'Skill Assessment' }).waitFor();
    }
  });
  await c.ctx.close();
}

await step('onboarding is usable on mobile', async () => {
  const c = await newPage({ width: 375, height: 800 });
  await c.page.goto(base + '/#/onboarding');
  const o = await c.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(o <= 1, `onboarding overflows by ${o}px`);
  await c.page.getByLabel('Email').fill('mobile@example.com');
  await c.page.getByLabel('Password', { exact: true }).fill('password123');
  await c.page.getByLabel('Confirm password').fill('password123');
  await c.page.getByRole('button', { name: 'Continue' }).click();
  await c.page.getByLabel('Full name').fill('Mobile User');
  await c.page.getByLabel('Current college').selectOption('Sapthagiri NPS College');
  await c.page.getByLabel('Degree', { exact: true }).selectOption('B.Tech');
  await c.page.getByLabel('Current academic year').selectOption('1');
  await c.page.getByLabel('Cybersecurity', { exact: true }).check();
  await c.page.getByRole('button', { name: 'Continue' }).click();
  await c.page.getByRole('heading', { name: 'What do you already know?' }).waitFor();
  await c.page.getByLabel('C', { exact: true }).check();
  await c.page.getByRole('radiogroup', { name: 'C proficiency' }).locator('label.seg', { hasText: 'Beginner' }).click();
  const o2 = await c.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(o2 <= 1, `step 2 overflows by ${o2}px`);
  await shot(c.page, 'mobile-onb2');
  await c.ctx.close();
});

await step('no console errors or page errors across the whole run', async () => {
  expect(consoleProblems.length === 0, consoleProblems.slice(0, 4).join(' | '));
});

await browser.close();
server.close();
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) { console.log(failures.map((f) => ' - ' + f).join('\n')); process.exit(1); }
