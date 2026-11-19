// Career definitions. Every recommendation, gap analysis and roadmap is derived from this data,
// so the rules are inspectable and nothing is random.
//
// skills[]: { name | anyOf, w (importance 1-3), target (level 1-5 expected for an entry role), tier (1-3 roadmap phase) }
// An entry with anyOf is satisfied by the best level among the listed skills.

const k = (name, w, target, tier) => ({ name, w, target, tier });
const any = (label, anyOf, w, target, tier) => ({ name: label, anyOf, w, target, tier });

export const CAREERS = [
  {
    id: 'full-stack',
    title: 'Full Stack Developer',
    entry: 2,
    interests: ['Web Development', 'Software Development'],
    summary: 'Builds complete web products: the interface users see, the server logic behind it and the database that stores the data.',
    skills: [
      k('HTML', 1, 3, 1), k('CSS', 1, 3, 1), k('JavaScript', 3, 3, 1), k('Git and GitHub', 1, 3, 1),
      k('React', 3, 3, 2), k('Node.js', 2, 3, 2), k('Express.js', 1, 3, 2), k('SQL', 2, 3, 2), k('REST APIs', 2, 3, 2),
      k('MongoDB', 1, 2, 3), k('TypeScript', 1, 3, 3), k('Docker', 1, 2, 3), k('Data Structures and Algorithms', 2, 3, 3),
    ],
    projects: [
      { title: 'Expense tracker with login', summary: 'React frontend, Express API, SQL database, password hashing and a deployed demo.' },
      { title: 'Real-time chat application', summary: 'Rooms, message history and WebSockets with a persistent database.' },
      { title: 'Student marketplace', summary: 'Listings, image upload, search and role-based access for buyers and sellers.' },
    ],
    interview: ['HTTP, REST and status codes', 'Browser rendering, the event loop and closures', 'SQL joins and indexing', 'Authentication, sessions and JWT trade-offs'],
    roadmapUrl: 'https://roadmap.sh/full-stack',
  },
  {
    id: 'frontend',
    title: 'Frontend Developer',
    entry: 1,
    interests: ['Web Development', 'UI/UX Design', 'Software Development'],
    summary: 'Turns designs into fast, accessible and responsive interfaces that run in the browser.',
    skills: [
      k('HTML', 2, 4, 1), k('CSS', 3, 4, 1), k('JavaScript', 3, 4, 1), k('Git and GitHub', 1, 3, 1),
      k('React', 3, 3, 2), k('TypeScript', 2, 3, 2), k('REST APIs', 2, 3, 2),
      k('UI/UX Design', 1, 2, 3), k('Data Structures and Algorithms', 1, 3, 3),
    ],
    projects: [
      { title: 'Responsive portfolio with accessibility audit', summary: 'Semantic HTML, keyboard navigation and a Lighthouse score above 90.' },
      { title: 'Weather or movie dashboard from a public API', summary: 'Data fetching, loading and error states, search and caching.' },
      { title: 'Component library in React', summary: 'Buttons, modals and form controls documented with usage examples.' },
    ],
    interview: ['CSS layout: flexbox, grid and specificity', 'JavaScript closures, promises and async/await', 'React rendering, state and effects', 'Web accessibility basics'],
    roadmapUrl: 'https://roadmap.sh/frontend',
  },
  {
    id: 'backend',
    title: 'Backend Developer',
    entry: 3,
    interests: ['Software Development', 'Web Development', 'Cloud Computing'],
    summary: 'Designs the servers, APIs and databases that power applications, with a focus on correctness, security and scale.',
    skills: [
      any('A backend language (Java, Python or JavaScript)', ['Java', 'Python', 'JavaScript'], 3, 3, 1),
      k('Git and GitHub', 1, 3, 1), k('Data Structures and Algorithms', 2, 3, 1),
      k('SQL', 3, 3, 2), k('DBMS', 2, 3, 2), k('REST APIs', 3, 3, 2), k('Object-Oriented Programming', 1, 3, 2),
      k('Operating Systems', 1, 3, 3), k('Computer Networks', 1, 3, 3), k('Docker', 1, 2, 3), k('System Design', 2, 2, 3),
    ],
    projects: [
      { title: 'URL shortener with analytics', summary: 'REST API, database schema, rate limiting and click statistics.' },
      { title: 'Library or hostel management API', summary: 'Authentication, role-based access, pagination and automated tests.' },
      { title: 'Job queue service', summary: 'Background workers, retries and a status endpoint.' },
    ],
    interview: ['SQL joins, indexes and transactions', 'API design and idempotency', 'Caching and database scaling', 'Processes, threads and concurrency'],
    roadmapUrl: 'https://roadmap.sh/backend',
  },
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    entry: 2,
    interests: ['Software Development'],
    summary: 'Builds and maintains software products, relying on strong fundamentals in algorithms, design and computer systems.',
    skills: [
      any('A general-purpose language (C, C++, Java or Python)', ['C', 'C++', 'Java', 'Python'], 3, 3, 1),
      k('Data Structures and Algorithms', 3, 4, 1), k('Object-Oriented Programming', 2, 3, 1), k('Git and GitHub', 1, 3, 1),
      k('DBMS', 2, 3, 2), k('SQL', 1, 3, 2), k('Operating Systems', 2, 3, 2), k('Computer Networks', 1, 3, 2),
      k('Linux', 1, 2, 2), k('System Design', 2, 2, 3),
    ],
    projects: [
      { title: 'Command-line task manager with persistence', summary: 'Clean class design, file or database storage and unit tests.' },
      { title: 'Mini key-value store', summary: 'Hash tables, write-ahead log and a simple network protocol.' },
      { title: 'Open source contribution', summary: 'Fix a documented good-first-issue in a real project and get the pull request merged.' },
    ],
    interview: ['Arrays, strings, hashing, trees and graphs', 'Dynamic programming patterns', 'OOP principles and design patterns', 'Operating systems and DBMS core questions'],
    roadmapUrl: 'https://roadmap.sh/software-design-architecture',
  },
  {
    id: 'ai-ml',
    title: 'AI/ML Engineer',
    entry: 4,
    interests: ['Artificial Intelligence and Machine Learning', 'Data Science and Analytics'],
    summary: 'Trains, evaluates and ships machine learning models, from data preparation to deployment.',
    skills: [
      k('Python', 3, 3, 1), k('Statistics', 2, 3, 1), k('Git and GitHub', 1, 2, 1),
      k('Machine Learning', 3, 3, 2), k('Data Analytics', 1, 3, 2), k('Artificial Intelligence', 1, 3, 2), k('SQL', 1, 2, 2),
      k('Deep Learning', 2, 3, 3), k('Cloud Computing', 1, 2, 3), k('Data Structures and Algorithms', 1, 2, 3),
    ],
    projects: [
      { title: 'End-to-end prediction project', summary: 'Clean a real dataset, compare models, report metrics honestly and publish the notebook.' },
      { title: 'Image or text classifier with a small web demo', summary: 'Train, evaluate, then serve predictions through an API.' },
      { title: 'Kaggle competition entry', summary: 'Enter a beginner competition and document what worked and what did not.' },
    ],
    interview: ['Bias, variance and overfitting', 'Evaluation metrics and when to use each', 'Linear and logistic regression, trees, ensembles', 'Neural network basics and backpropagation'],
    roadmapUrl: 'https://roadmap.sh/ai-data-scientist',
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    entry: 4,
    interests: ['Data Science and Analytics', 'Artificial Intelligence and Machine Learning'],
    summary: 'Extracts insight from data using statistics, experiments and models, then explains the findings to decision makers.',
    skills: [
      k('Python', 3, 3, 1), k('SQL', 2, 3, 1), k('Statistics', 3, 3, 1),
      k('Data Analytics', 2, 3, 2), k('Data Visualization', 1, 3, 2), k('Machine Learning', 3, 3, 2),
      k('DBMS', 1, 2, 3), k('Git and GitHub', 1, 2, 3),
    ],
    projects: [
      { title: 'Exploratory analysis of a public dataset', summary: 'Ask three questions, test them statistically and write up the findings.' },
      { title: 'Churn or sales forecasting model', summary: 'Feature engineering, baseline versus model, and a plain-language conclusion.' },
      { title: 'Interactive dashboard', summary: 'Publish a dashboard that a non-technical reader can use.' },
    ],
    interview: ['Probability and hypothesis testing', 'SQL window functions and aggregations', 'Model evaluation and leakage', 'Communicating results to non-technical people'],
    roadmapUrl: 'https://roadmap.sh/ai-data-scientist',
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    entry: 2,
    interests: ['Data Science and Analytics'],
    summary: 'Answers business questions with data: querying, cleaning, analysing and presenting results through reports and dashboards.',
    skills: [
      k('SQL', 3, 3, 1), k('Data Analytics', 3, 3, 1), k('Statistics', 2, 3, 1),
      k('Python', 2, 3, 2), k('Data Visualization', 2, 3, 2), k('DBMS', 1, 2, 2),
    ],
    projects: [
      { title: 'Sales performance dashboard', summary: 'Clean a public sales dataset, write the SQL and build a dashboard with filters.' },
      { title: 'Campus or city data story', summary: 'Pick an open dataset, find three insights and present them in a short report.' },
      { title: 'SQL case-study portfolio', summary: 'Five business questions answered with documented queries.' },
    ],
    interview: ['SQL joins, grouping and window functions', 'Descriptive statistics and A/B testing basics', 'Choosing the right chart', 'Case questions: define a metric and diagnose a drop'],
    roadmapUrl: 'https://roadmap.sh/data-analyst',
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity Analyst',
    entry: 3,
    interests: ['Cybersecurity'],
    summary: 'Monitors systems, finds vulnerabilities and responds to incidents to protect applications and networks.',
    skills: [
      k('Computer Networks', 3, 3, 1), k('Operating Systems', 2, 3, 1), k('Linux', 2, 3, 1),
      k('Cybersecurity', 3, 3, 2), k('Network Security', 2, 3, 2), k('Python', 1, 2, 2),
      k('Cloud Computing', 1, 2, 3), k('SQL', 1, 2, 3),
    ],
    projects: [
      { title: 'Home lab with a vulnerable VM', summary: 'Scan, exploit in a legal lab, then write the remediation report.' },
      { title: 'Log analysis and alerting script', summary: 'Parse authentication logs and flag brute-force patterns.' },
      { title: 'Capture the flag write-ups', summary: 'Publish write-ups for ten beginner CTF challenges.' },
    ],
    interview: ['TCP/IP, DNS and TLS', 'OWASP Top 10 and how each is exploited', 'Linux permissions and hardening', 'Incident response steps'],
    roadmapUrl: 'https://roadmap.sh/cyber-security',
  },
  {
    id: 'cloud',
    title: 'Cloud Engineer',
    entry: 3,
    interests: ['Cloud Computing', 'DevOps'],
    summary: 'Designs, deploys and operates infrastructure on cloud platforms such as AWS, Azure or Google Cloud.',
    skills: [
      k('Linux', 2, 3, 1), k('Computer Networks', 2, 3, 1), k('Operating Systems', 1, 3, 1), k('Git and GitHub', 1, 3, 1),
      k('Cloud Computing', 3, 3, 2), k('Docker', 2, 3, 2), k('Python', 1, 2, 2),
      k('CI/CD', 1, 2, 3), k('Kubernetes', 1, 2, 3),
    ],
    projects: [
      { title: 'Static site and API on a cloud provider', summary: 'Deploy with a custom domain, HTTPS and a monitored health endpoint.' },
      { title: 'Containerised app on a managed service', summary: 'Build an image, push it to a registry and deploy with environment config.' },
      { title: 'Infrastructure as code repository', summary: 'Describe a small network and virtual machine in code and tear it down cleanly.' },
    ],
    interview: ['Virtual networks, subnets and security groups', 'Compute, storage and database service choices', 'IAM and least privilege', 'Cost awareness and monitoring'],
    roadmapUrl: 'https://roadmap.sh/aws',
  },
  {
    id: 'devops',
    title: 'DevOps Engineer',
    entry: 4,
    interests: ['DevOps', 'Cloud Computing'],
    summary: 'Automates how software is built, tested, deployed and monitored so teams can release reliably.',
    skills: [
      k('Linux', 3, 3, 1), k('Git and GitHub', 2, 3, 1), k('Computer Networks', 1, 3, 1), k('Operating Systems', 1, 3, 1),
      k('Docker', 3, 3, 2), k('CI/CD', 3, 3, 2), k('Python', 1, 2, 2),
      k('Cloud Computing', 2, 3, 3), k('Kubernetes', 2, 2, 3),
    ],
    projects: [
      { title: 'CI pipeline for a sample app', summary: 'Lint, test and build on every pull request using GitHub Actions.' },
      { title: 'Zero-downtime deployment', summary: 'Containerise an app and deploy with a rolling update and a rollback plan.' },
      { title: 'Monitoring stack', summary: 'Collect metrics and logs for a service and add an alert.' },
    ],
    interview: ['Linux troubleshooting', 'Docker images, layers and networking', 'CI/CD pipeline design', 'Monitoring, logging and incident handling'],
    roadmapUrl: 'https://roadmap.sh/devops',
  },
  {
    id: 'blockchain',
    title: 'Blockchain Developer',
    entry: 4,
    interests: ['Blockchain Development'],
    summary: 'Writes and audits smart contracts and the applications that interact with blockchain networks.',
    skills: [
      k('JavaScript', 2, 3, 1), k('Git and GitHub', 1, 3, 1), k('Data Structures and Algorithms', 1, 3, 1),
      k('Blockchain', 3, 3, 2), k('Solidity', 3, 3, 2), k('Cybersecurity', 1, 2, 3), k('React', 1, 2, 3),
    ],
    projects: [
      { title: 'Token and simple voting contract', summary: 'Write, test and deploy to a test network with documented behaviour.' },
      { title: 'Decentralised application frontend', summary: 'Connect a React app to your contract and handle wallet and transaction states.' },
      { title: 'Contract security review', summary: 'Review a deliberately vulnerable contract and write up the issues.' },
    ],
    interview: ['How blocks, consensus and transactions work', 'Gas costs and storage layout', 'Common contract vulnerabilities such as re-entrancy', 'Testing and deployment workflow'],
    roadmapUrl: 'https://roadmap.sh/blockchain',
  },
  {
    id: 'mobile',
    title: 'Mobile Application Developer',
    entry: 2,
    interests: ['App Development'],
    summary: 'Builds apps for phones and tablets, balancing performance, offline behaviour and a polished interface.',
    skills: [
      k('Object-Oriented Programming', 2, 3, 1), k('Git and GitHub', 1, 3, 1), k('Data Structures and Algorithms', 1, 3, 1),
      any('A mobile framework (Flutter or Android Development)', ['Flutter', 'Android Development'], 3, 3, 2),
      k('REST APIs', 2, 3, 2), k('SQL', 1, 2, 2), k('UI/UX Design', 1, 2, 3),
    ],
    projects: [
      { title: 'Habit tracker with local storage', summary: 'Offline-first app with notifications and a clean list and detail flow.' },
      { title: 'Campus events app backed by an API', summary: 'Authentication, remote data, pull to refresh and error handling.' },
      { title: 'Published beta build', summary: 'Ship a signed build to a testing track and collect feedback from five users.' },
    ],
    interview: ['App lifecycle and state management', 'Networking, caching and offline handling', 'List performance and memory', 'Basic UI and navigation patterns'],
    roadmapUrl: 'https://roadmap.sh/android',
  },
  {
    id: 'ux',
    title: 'UI/UX Designer',
    entry: 1,
    interests: ['UI/UX Design'],
    summary: 'Researches user needs and designs interfaces that are usable, accessible and visually consistent.',
    skills: [
      k('UI/UX Design', 3, 3, 1), k('HTML', 1, 2, 1), k('CSS', 2, 3, 1),
      k('JavaScript', 1, 2, 2), k('React', 1, 2, 2), k('Data Visualization', 1, 2, 3),
    ],
    projects: [
      { title: 'Redesign of a campus app or website', summary: 'Research, wireframes, a clickable prototype and a usability test with five people.' },
      { title: 'Design system starter', summary: 'Colour, type scale, spacing and a handful of documented components.' },
      { title: 'Case study portfolio', summary: 'Three case studies explaining the problem, process, decisions and results.' },
    ],
    interview: ['Walking through a portfolio case study', 'Usability heuristics and accessibility', 'User research methods', 'Design critique and handing off to developers'],
    roadmapUrl: 'https://roadmap.sh/ux-design',
  },
];

export const CAREER_BY_ID = new Map(CAREERS.map((c) => [c.id, c]));

/** Skill names referenced by a requirement entry (all members of an anyOf group, or the single skill). */
export function entrySkillNames(entry) {
  return entry.anyOf ? entry.anyOf : [entry.name];
}
