# CareerPath AI

An AI-assisted career guidance platform for Computer Science Engineering (CSE) students. Students describe their college, year, interests and skills, then get ranked career recommendations with explanations, a skill gap analysis, curated learning resources, a five-phase roadmap and persistent progress tracking.

## Live demo

A browser-only demo is published with GitHub Pages from the `docs/` folder. It runs the same career data and rule-based engine as the real server, but keeps one account's data in your own browser instead of a database. Use `npm start` for the full app.

## Problem statement

Engineering students often know some technologies but cannot tell which careers those skills point to, what is missing for a given role, or what to learn next. Generic advice ignores their year, their actual skill levels and what they have built. CareerPath AI turns a student's real profile into specific, explainable guidance.

## Project objectives

- Collect an honest picture of the student: college, academic year, interests, skills, projects and experience.
- Recommend careers with reasons that can be checked against the student's own data. No random results and no invented match percentages.
- Show exactly which skills are strong, weak or missing for a chosen career, in priority order.
- Provide real learning resources, with costs described conservatively.
- Generate a roadmap that adapts to academic year and existing proficiency.
- Track progress, goals and achievements persistently.

## Key features

- **Landing page and 4-step onboarding**: details, skills with proficiency, learning experience, review and edit, then account creation. Drafts survive a refresh.
- **Profile** with completion checklist, editable at any time.
- **Skill Assessment**: skills grouped into programming, web development, core CS and advanced technologies. Add, edit and remove skills, strongest and weakest summary. Levels are clearly labelled self-reported, never presented as test scores.
- **Career Recommendations**: 13 careers ranked. The top three are shown in full and every other career can be explored. Each shows why it matches, skills met, skills to add, suggested projects, roadmap outline, resources and a skill coverage indicator.
- **Skill Gap Analysis**: strong, needs improvement and missing skills with priority and resources, and a "Build My Learning Roadmap" button.
- **Learning Resources**: 140 curated links filterable by skill, difficulty, career path and category. Mark completed or save for later.
- **Roadmap**: five phases (fundamentals, intermediate, advanced, projects, interview preparation). Skills you already meet are skipped, the time horizon follows your academic year, and task completion updates progress automatically.
- **Progress Tracking**: overall progress, skills, courses and projects completed, weekly activity chart, readiness over time, goals with target dates, achievements.
- **Settings**: change password, download your data as JSON, reset progress, delete account.

### How recommendations work

The rule-based engine (`server/services/engine.js`) always runs. For each career it combines:

- skill match: how close each required skill is to its target level, weighted by importance (55 percent);
- interest match with the career (35 percent);
- evidence from projects, internships and certifications for the required skills (10 percent).

If the student chose only "Not Sure Yet", interest is ignored and the weights become 90 percent skills and 10 percent evidence.

Results are shown as labels (Strong fit, Good fit, Developing fit, Exploratory) with written reasons. The only percentage displayed is **skill coverage**, which is a direct calculation of how much of a role's requirements you meet, based on self-reported levels.

When `ANTHROPIC_API_KEY` is set, the backend also asks an AI model to order the top three and write explanations. Its output is validated against the real career catalogue before use. The interface labels every result as either **rule-based** or **AI-assisted** and never presents a fallback result as AI-generated.

## Technologies used

This environment could not install packages from npm, so the project uses only what ships with Node.js. There are no runtime dependencies.

| Layer | Choice |
| --- | --- |
| Runtime | Node.js 22.13 or newer |
| Server | Built-in `node:http` with a small router |
| Database | SQLite through the built-in `node:sqlite` module |
| Auth | scrypt password hashing, random session tokens stored hashed, HttpOnly SameSite cookies |
| Frontend | Vanilla JavaScript (ES modules), hash router, hand-built SVG charts |
| Styling | Plain CSS with design tokens, Manrope font |
| Tests | `node:test` for the API and engine, Playwright for browser tests |

The structure (separate services, data files and views) would port directly to React, Express and PostgreSQL if you prefer that stack later.

## Project folder structure

```
careerpath-ai/
  package.json
  .env.example
  README.md
  data/                      SQLite database is created here (git-ignored)
  server/
    index.js                 HTTP server, routes, static files, security headers
    db.js                    SQLite schema
    auth.js                  Password hashing, sessions, login rate limit
    validate.js              Input validation
    env.js                   Minimal .env loader
    data/
      skills.js              Skill catalogue, proficiency levels, colleges, interests
      careers.js             13 careers with required skills, projects, interview topics
      resources.js           Curated learning resources
    services/
      engine.js              Recommendations, gap analysis, roadmap generation
      ai.js                  Optional AI layer (backend only, validated output)
      progress.js            Tasks, goals, achievements, weekly activity, readiness
  public/
    index.html
    favicon.svg
    css/styles.css
    js/
      main.js                Router and app shell
      lib.js, state.js, nav.js, components.js, pickers.js, charts.js
      views/                 landing, onboarding, dashboard, profile, skills,
                             careers, gap, resources, roadmap, progress, settings
  tests/
    api.test.js              API and engine tests
    e2e.mjs                  Browser end-to-end tests (Playwright)
    check-links.mjs          Resource URL checker
```

## Installation

Requirements: Node.js 22.13 or newer (`node --version`). There is nothing to install with npm.

```bash
git clone <your-repository-url> careerpath-ai
cd careerpath-ai
cp .env.example .env
```

## Environment variable configuration

Edit `.env` (all values are optional):

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port the server listens on |
| `DATABASE_PATH` | `data/careerpath.db` | SQLite file, relative to the project root |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS so cookies are marked Secure |
| `ANTHROPIC_API_KEY` | empty | Enables AI explanations. Leave empty for rule-based only |
| `AI_MODEL` | `claude-sonnet-5-5` | Model used when a key is set |

Never commit `.env`. API keys are read only by the server and are never sent to the browser.

## Database setup

No setup is needed. On first start the server creates `data/careerpath.db` and all tables. To reset everything, stop the server and delete the `data/` database files.

Tables: `users`, `sessions`, `profiles`, `progress`, `goals`, `activity`, `achievements`, `readiness_history`, `ai_cache`.

## How to run the backend and frontend

The backend and frontend are served by the same process.

```bash
npm start        # http://localhost:3000
npm run dev      # same, with automatic restart on server changes
```

Open http://localhost:3000. The frontend is plain static files in `public/`, so editing them needs only a browser refresh.

## AI API integration

1. Create an API key at https://console.anthropic.com/.
2. Put it in `.env` as `ANTHROPIC_API_KEY=...`.
3. Restart the server. The console prints `AI recommendations: enabled`.

What the AI does: reorders the top three candidates the rule engine produced, writes explanations for them and adds a few next steps. For the roadmap it writes short per-phase coaching notes. It never adds or removes careers or tasks. The student's name and email are never sent. Results are cached per profile so unchanged profiles do not trigger repeat calls. If the request fails, the app falls back to the rule-based result and says so.

## Available functionality

Onboarding and sign-in, profile editing, skill CRUD with proficiency, ranked recommendations with explanations, per-career detail pages, skill gap analysis, resource filtering with completed and saved states, a roadmap with persistent task completion, goals with dates, achievements, weekly activity and readiness charts, data export, password change, progress reset and account deletion.

## Testing

```bash
npm test                      # API and engine tests (no browser needed)
npm run check:links           # checks every resource URL with curl
```

Browser end-to-end tests need Playwright and Chrome or Chromium. They cover onboarding with both colleges and all years, adding skills, proficiency, profile editing, recommendations, gap analysis, resources, roadmap completion, progress, persistence after refresh, and mobile and tablet overflow:

```bash
npm install --no-save playwright
CHROME_PATH=/path/to/chrome node --disable-warning=ExperimentalWarning tests/e2e.mjs
# optional: SHOTS_DIR=./shots to save screenshots
```

## Future enhancements

- Short objective quizzes per skill so some levels can be verified rather than self-reported.
- Placement calendar and company-specific preparation tracks.
- Mentor and peer sharing of roadmaps.
- More colleges and departments beyond CSE.
- Email reminders for goal dates.
- A PostgreSQL adapter and a React frontend for larger deployments.

## Contribution guidelines

1. Fork the repository and create a branch for your change.
2. Keep the zero-dependency approach unless a dependency is clearly justified.
3. When adding a resource, use a real, stable URL from the provider, state its cost honestly in `COST_LABELS` terms and never claim a course is free unless the provider says so.
4. When adding a career, define its skills in `server/data/careers.js` using names from the skill catalogue. The tests check that every requirement has resources.
5. Run `npm test` and the browser tests before opening a pull request.
6. Describe what changed and why in the pull request.

## Notes and limits

Skill levels are self-reported. Career recommendations are guidance for planning and are not predictions of hiring outcomes. Resource costs and availability are controlled by each provider and can change.
