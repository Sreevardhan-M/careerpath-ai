// Skill catalogue, proficiency scale and onboarding option lists.

export const LEVELS = [
  { value: 1, label: 'Beginner', description: 'Just started learning.' },
  { value: 2, label: 'Basic', description: 'Understands fundamental concepts.' },
  { value: 3, label: 'Intermediate', description: 'Can implement concepts independently.' },
  { value: 4, label: 'Advanced', description: 'Can build projects and solve complex problems.' },
  { value: 5, label: 'Expert', description: 'Strong practical knowledge and experience.' },
];

export const CATEGORIES = [
  'Programming',
  'Web Development',
  'Core Computer Science',
  'Advanced Technologies',
];

// core: true means it is offered on the onboarding skill picker.
// core: false skills are used by career requirements and can be added later.
const s = (name, category, core = true) => ({ name, category, core });

export const SKILLS = [
  s('C', 'Programming'),
  s('C++', 'Programming'),
  s('Java', 'Programming'),
  s('Python', 'Programming'),
  s('JavaScript', 'Programming'),
  s('SQL', 'Programming'),
  s('TypeScript', 'Programming', false),

  s('HTML', 'Web Development'),
  s('CSS', 'Web Development'),
  s('React', 'Web Development'),
  s('Node.js', 'Web Development'),
  s('Express.js', 'Web Development'),
  s('REST APIs', 'Web Development', false),
  s('MongoDB', 'Web Development', false),
  s('UI/UX Design', 'Web Development', false),

  s('Data Structures and Algorithms', 'Core Computer Science'),
  s('Object-Oriented Programming', 'Core Computer Science'),
  s('DBMS', 'Core Computer Science'),
  s('Operating Systems', 'Core Computer Science'),
  s('Computer Networks', 'Core Computer Science'),
  s('System Design', 'Core Computer Science', false),

  s('Machine Learning', 'Advanced Technologies'),
  s('Artificial Intelligence', 'Advanced Technologies'),
  s('Data Analytics', 'Advanced Technologies'),
  s('Cybersecurity', 'Advanced Technologies'),
  s('Cloud Computing', 'Advanced Technologies'),
  s('Blockchain', 'Advanced Technologies'),
  s('Git and GitHub', 'Advanced Technologies'),
  s('Statistics', 'Advanced Technologies', false),
  s('Data Visualization', 'Advanced Technologies', false),
  s('Deep Learning', 'Advanced Technologies', false),
  s('Network Security', 'Advanced Technologies', false),
  s('Linux', 'Advanced Technologies', false),
  s('Docker', 'Advanced Technologies', false),
  s('Kubernetes', 'Advanced Technologies', false),
  s('CI/CD', 'Advanced Technologies', false),
  s('Solidity', 'Advanced Technologies', false),
  s('Flutter', 'Advanced Technologies', false),
  s('Android Development', 'Advanced Technologies', false),
];

// Lower-case alias -> canonical skill name, so "reactjs" or "dsa" map onto the catalogue.
const ALIASES = {
  reactjs: 'React', 'react.js': 'React', node: 'Node.js', nodejs: 'Node.js', express: 'Express.js',
  expressjs: 'Express.js', js: 'JavaScript', ts: 'TypeScript', dsa: 'Data Structures and Algorithms',
  'data structures': 'Data Structures and Algorithms', algorithms: 'Data Structures and Algorithms',
  oop: 'Object-Oriented Programming', oops: 'Object-Oriented Programming', 'cpp': 'C++',
  git: 'Git and GitHub', github: 'Git and GitHub', ml: 'Machine Learning', ai: 'Artificial Intelligence',
  'deep learning': 'Deep Learning', dl: 'Deep Learning', 'os': 'Operating Systems', cn: 'Computer Networks',
  networking: 'Computer Networks', 'cloud': 'Cloud Computing', aws: 'Cloud Computing', azure: 'Cloud Computing',
  gcp: 'Cloud Computing', 'security': 'Cybersecurity', 'rest': 'REST APIs', 'rest api': 'REST APIs',
  'restful apis': 'REST APIs', mongo: 'MongoDB', 'ui ux': 'UI/UX Design', 'ux design': 'UI/UX Design',
  'ui design': 'UI/UX Design', figma: 'UI/UX Design', kotlin: 'Android Development', android: 'Android Development',
  'cicd': 'CI/CD', 'ci cd': 'CI/CD', k8s: 'Kubernetes', 'system design': 'System Design',
  'data visualisation': 'Data Visualization', 'dbms': 'DBMS', 'sql': 'SQL', 'smart contracts': 'Solidity',
  'web3': 'Blockchain', 'data science': 'Data Analytics', pandas: 'Data Analytics',
};

const BY_LOWER = new Map(SKILLS.map((x) => [x.name.toLowerCase(), x]));

/** Return the catalogue entry for a typed skill name (case and alias tolerant), or null. */
export function findCatalogSkill(name) {
  const key = String(name || '').trim().toLowerCase();
  if (!key) return null;
  if (BY_LOWER.has(key)) return BY_LOWER.get(key);
  const alias = ALIASES[key];
  return alias ? BY_LOWER.get(alias.toLowerCase()) : null;
}

export const COLLEGES = ['Sapthagiri NPS College', 'NMAM Institute of Technology (NMAMIT)'];
export const DEGREES = ['B.E', 'B.Tech'];
export const DEPARTMENT = 'Computer Science Engineering (CSE)';
export const YEARS = [1, 2, 3, 4];

export const INTERESTS = [
  'Software Development',
  'Artificial Intelligence and Machine Learning',
  'Data Science and Analytics',
  'Cybersecurity',
  'Cloud Computing',
  'Web Development',
  'App Development',
  'Blockchain Development',
  'UI/UX Design',
  'DevOps',
  'Not Sure Yet',
];

export const STUDY_TIMES = [
  { value: 'lt10', label: 'Less than 10 hours' },
  { value: '10to50', label: '10 to 50 hours' },
  { value: '50to150', label: '50 to 150 hours' },
  { value: 'gt150', label: 'More than 150 hours' },
];

export const EXPERIENCE_TYPES = ['Internship', 'Certification', 'Hackathon', 'Open source'];

export function levelLabel(value) {
  if (!value) return 'Not learned';
  return LEVELS.find((l) => l.value === value)?.label ?? 'Not learned';
}
