import { h } from '../lib.js';
import { state } from '../state.js';
import { brandMark } from '../nav.js';
import { levelMeter } from '../components.js';

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
const jump = (label, id) => h('button', { class: 'link-btn', type: 'button', onclick: () => scrollTo(id) }, label);

const sample = (kids) => h('div', { class: 'sample' }, h('p', { class: 'sample-tag' }, 'Example'), kids);

function gapSample() {
  const rows = [
    ['HTML', 'Strong', 'ok'], ['CSS', 'Strong', 'ok'], ['JavaScript', 'Improve', 'mid'], ['React', 'Improve', 'mid'], ['Node.js', 'Missing', 'low'],
  ];
  return sample(h('div', { class: 'mini-list' },
    h('p', { class: 'mini-title' }, 'Target: Full Stack Developer'),
    rows.map(([n, s, t]) => h('div', { class: 'mini-row' }, h('span', {}, n), h('span', { class: `pill pill-${t}` }, s)))));
}

function profileSample() {
  return sample(h('div', { class: 'mini-list' },
    [['Name', 'Asha Rao'], ['College', 'NMAM Institute of Technology'], ['Year', '3rd year, CSE'], ['Interests', 'Web Development, Cloud Computing']].map(([k, v]) => h('div', { class: 'mini-row' }, h('span', { class: 'mini-k' }, k), h('span', {}, v))),
    h('div', { class: 'mini-row' }, h('span', { class: 'mini-k' }, 'Profile'), h('span', { class: 'mini-bar' }, h('span', { style: { width: '78%' } }))),
  ));
}

function skillsSample() {
  return sample(h('div', { class: 'mini-list' },
    [['HTML', 'Intermediate', 3], ['CSS', 'Intermediate', 3], ['JavaScript', 'Basic', 2], ['React', 'Beginner', 1], ['SQL', 'Basic', 2]].map(([n, l, v]) => h('div', { class: 'mini-row' }, h('span', {}, n), h('span', { class: 'mini-level' }, l, levelMeter(v)))),
    h('p', { class: 'mini-foot' }, 'Self-reported, never presented as a test score.')));
}

function careersSample() {
  return sample(h('div', { class: 'mini-list' },
    [['1', 'Full Stack Developer', 'Strong fit', 'Meets HTML and CSS targets. Needs Node.js.'], ['2', 'Frontend Developer', 'Good fit', 'Matches your interest in web. React is next.'], ['3', 'Backend Developer', 'Developing fit', 'SQL started. Needs REST APIs.']].map(([i, t, f, w]) => h('div', { class: 'mini-career' }, h('span', { class: 'mini-rank' }, i), h('div', {}, h('strong', {}, t, h('span', { class: 'mini-fit' }, f)), h('p', {}, w))))));
}

function resourcesSample() {
  return sample(h('div', { class: 'mini-list' },
    [['Learn React', 'react.dev · Documentation · Beginner'], ['Full Stack Open', 'University of Helsinki · Free course'], ['Express getting started', 'expressjs.com · Documentation']].map(([t, m]) => h('div', { class: 'mini-res' }, h('strong', {}, t), h('span', {}, m))),
    h('p', { class: 'mini-foot' }, 'Real links, with cost stated honestly.')));
}

function progressSample() {
  const bars = [2, 4, 3, 6, 5, 8, 7, 9];
  return sample(h('div', { class: 'mini-list' },
    h('div', { class: 'mini-bars', 'aria-hidden': 'true' }, bars.map((b) => h('span', { style: { height: b * 9 + '%' } }))),
    h('div', { class: 'mini-row' }, h('span', { class: 'mini-k' }, 'Roadmap'), h('span', { class: 'mini-bar' }, h('span', { style: { width: '42%' } }))),
    h('p', { class: 'mini-foot' }, 'Weekly activity and roadmap progress, saved to your account.')));
}

const FEATURES = [
  ['01', 'Personalized Profile', 'One place for your college, year, interests, skills, projects and experience. It stays saved, so you can update it as you grow.', ['Edit anytime', 'Profile completion checklist'], profileSample],
  ['02', 'Skill Assessment', 'Rate each skill from Beginner to Expert, grouped by programming, web, core CS and advanced technologies. See your strongest and weakest skills at a glance.', ['Add custom skills', 'Clearly labelled as self-reported'], skillsSample],
  ['03', 'Career Recommendations', 'Thirteen careers ranked against your interests, skills, projects and academic year. Every result says why, in plain words, with no invented match scores.', ['Top three, plus every other path', 'Suggested projects for each'], careersSample],
  ['04', 'Skill Gap Analysis', 'Pick a target role and see which skills you already meet, which need work and which are missing, ordered by priority.', ['Priority order', 'Resources for each gap'], gapSample],
  ['05', 'Learning Resources', 'Courses, documentation, videos and practice platforms matched to your gaps. Mark items completed or save them for later.', ['Filter by skill, level and category', 'Free versus paid stated clearly'], resourcesSample],
  ['06', 'Progress Tracking', 'Tick off roadmap tasks, set goals with target dates and watch weekly activity and skill coverage change over time.', ['Goals and dates', 'Achievements you have earned'], progressSample],
];

const STEPS = [
  ['Tell us where you are', 'Your college, year and the areas that interest you.'],
  ['Rate what you know', 'Pick your skills, rate each one honestly and note what you have built.'],
  ['See matches and gaps', 'Get ranked careers with reasons, and a gap analysis for the one you choose.'],
  ['Follow your roadmap', 'Work through five phases at a pace that fits your year, and track every step.'],
];

export async function landingView() {
  const signedIn = !!state.me;
  const primary = h('a', { class: 'btn btn-primary btn-lg', href: '#/onboarding' }, 'Start My Career Journey');
  return h('div', { class: 'landing' },
    h('header', { class: 'l-nav' },
      h('a', { class: 'brand', href: '#/' }, brandMark(), h('span', {}, 'CareerPath AI')),
      h('nav', { class: 'l-nav-links', 'aria-label': 'Page sections' }, jump('Features', 'features'), jump('How it works', 'how')),
      h('div', { class: 'l-nav-actions' },
        signedIn ? h('a', { class: 'btn btn-ghost btn-sm', href: '#/dashboard' }, 'Open dashboard') : h('a', { class: 'btn btn-ghost btn-sm', href: '#/signin' }, 'Sign in'))),
    h('main', { id: 'main', tabindex: -1 },
      h('section', { class: 'hero' },
        h('div', { class: 'hero-copy' },
          h('p', { class: 'eyebrow' }, 'Career guidance for Computer Science Engineering students'),
          h('h1', {}, 'Your Career Journey Starts Here'),
          h('p', { class: 'hero-sub' }, 'Discover your strengths. Explore career possibilities. Build your future with AI.'),
          h('div', { class: 'hero-actions' }, primary, signedIn ? h('a', { class: 'btn btn-ghost btn-lg', href: '#/dashboard' }, 'Go to my dashboard') : h('a', { class: 'btn btn-ghost btn-lg', href: '#/signin' }, 'I already have an account'))),
        h('div', { class: 'hero-visual' }, gapSample())),

      h('section', { class: 'explain' },
        h('p', { class: 'explain-lead' }, 'You already know some things. You are not sure what they add up to.'),
        h('div', { class: 'explain-body' },
          h('p', {}, 'CareerPath AI takes your year, interests and the skills you have actually practised, then shows which careers fit, what is missing for each and what to learn next.'),
          h('p', {}, 'Recommendations come from a transparent rule-based engine you can inspect. When an AI model is configured on the server, it adds written explanations on top, and the app always labels which one you are reading.'))),

      h('section', { class: 'features', id: 'features', 'aria-labelledby': 'features-h' },
        h('div', { class: 'section-head' }, h('p', { class: 'eyebrow' }, 'What you get'), h('h2', { id: 'features-h' }, 'Six tools, one connected plan')),
        FEATURES.map(([n, title, text, bullets, visual]) => h('article', { class: 'feature' },
          h('div', { class: 'feature-copy' }, h('span', { class: 'feature-n' }, n), h('h3', {}, title), h('p', {}, text), h('ul', {}, bullets.map((b) => h('li', {}, b)))),
          h('div', { class: 'feature-visual' }, visual())))),

      h('section', { class: 'how', id: 'how', 'aria-labelledby': 'how-h' },
        h('div', { class: 'section-head' }, h('p', { class: 'eyebrow' }, 'How it works'), h('h2', { id: 'how-h' }, 'From where you are to what is next')),
        h('ol', { class: 'steps' }, STEPS.map(([t, d], i) => h('li', {}, h('span', { class: 'step-n' }, String(i + 1)), h('div', {}, h('h3', {}, t), h('p', {}, d)))))),

      h('section', { class: 'final' },
        h('h2', {}, 'See where you stand in about five minutes'),
        h('p', {}, 'Answer a few questions, rate your skills and get a plan you can start on today.'),
        h('a', { class: 'btn btn-primary btn-lg', href: '#/onboarding' }, 'Start My Career Journey'))),

    h('footer', { class: 'l-foot' },
      h('div', { class: 'l-foot-grid' },
        h('div', {}, h('a', { class: 'brand', href: '#/' }, brandMark(), h('span', {}, 'CareerPath AI')), h('p', { class: 'foot-note' }, 'A career guidance platform for Computer Science Engineering students.')),
        h('div', {}, h('h4', {}, 'Explore'), h('ul', {}, h('li', {}, jump('Features', 'features')), h('li', {}, jump('How it works', 'how')))),
        h('div', {}, h('h4', {}, 'Account'), h('ul', {}, h('li', {}, h('a', { href: '#/onboarding' }, 'Start your journey')), h('li', {}, h('a', { href: '#/signin' }, 'Sign in'))))),
      h('p', { class: 'foot-legal' }, 'Skill levels are self-reported. Career suggestions are guidance to help you plan, not a prediction of hiring outcomes.')));
}
