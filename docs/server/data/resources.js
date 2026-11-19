// Curated learning resources. Only well-known providers and stable top-level or documentation URLs are used.
// Pricing is described conservatively through `cost`; providers can change terms, so the UI says to confirm on the site.
// time is only set where the provider publishes a duration.

export const COST_LABELS = {
  free: 'Free',
  freemium: 'Free tier, paid extras',
  audit: 'Free to audit, paid certificate',
  certfee: 'Learning is free, certificate has a fee',
  paid: 'Paid',
};

export const RESOURCE_CATEGORIES = ['Free course', 'Documentation', 'YouTube', 'Practice', 'Project tutorial', 'Certification'];
export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const B = 'Beginner', I = 'Intermediate', A = 'Advanced';
const C = { course: 'Free course', docs: 'Documentation', yt: 'YouTube', practice: 'Practice', project: 'Project tutorial', cert: 'Certification' };

// r(id, title, platform, category, difficulty, cost, skills, description, url, opts)
const r = (id, title, platform, category, difficulty, cost, skills, description, url, opts = {}) =>
  ({ id, title, platform, category, difficulty, cost, skills, description, url, careers: opts.careers || [], time: opts.time || null });

export const RESOURCES = [
  // Web fundamentals
  r('mdn-learn-web', 'Learn web development', 'MDN Web Docs', C.docs, B, 'free', ['HTML', 'CSS', 'JavaScript'], 'Structured beginner path covering HTML, CSS and JavaScript from the browser vendors\' own documentation.', 'https://developer.mozilla.org/en-US/docs/Learn_web_development'),
  r('mdn-html', 'HTML reference and guides', 'MDN Web Docs', C.docs, I, 'free', ['HTML'], 'Authoritative element reference and guides on semantics and accessibility.', 'https://developer.mozilla.org/en-US/docs/Web/HTML'),
  r('w3-html', 'HTML tutorial', 'W3Schools', C.course, B, 'free', ['HTML'], 'Short interactive lessons with a try-it editor. Certification exams are separate and paid.', 'https://www.w3schools.com/html/'),
  r('fcc-learn', 'freeCodeCamp curriculum', 'freeCodeCamp', C.course, B, 'free', ['HTML', 'CSS', 'JavaScript', 'React', 'Python', 'SQL', 'Data Analytics', 'Machine Learning'], 'Large free, project-based curriculum with certifications for web, data and Python.', 'https://www.freecodecamp.org/learn'),
  r('mdn-css', 'CSS reference and guides', 'MDN Web Docs', C.docs, I, 'free', ['CSS'], 'Layout, flexbox, grid, selectors and responsive design explained in depth.', 'https://developer.mozilla.org/en-US/docs/Web/CSS'),
  r('w3-css', 'CSS tutorial', 'W3Schools', C.course, B, 'free', ['CSS'], 'Beginner-friendly lessons with live examples.', 'https://www.w3schools.com/css/'),
  r('webdev-css', 'Learn CSS', 'web.dev', C.course, I, 'free', ['CSS'], 'Google\'s modular course on modern CSS, from the box model to container queries.', 'https://web.dev/learn/css'),
  r('mdn-js', 'JavaScript guide', 'MDN Web Docs', C.docs, B, 'free', ['JavaScript'], 'Complete language guide covering types, functions, closures, promises and modules.', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide'),
  r('javascript-info', 'The Modern JavaScript Tutorial', 'javascript.info', C.course, I, 'free', ['JavaScript'], 'Detailed free tutorial from fundamentals to async code, DOM and browser APIs.', 'https://javascript.info/'),
  r('w3-js', 'JavaScript tutorial', 'W3Schools', C.course, B, 'free', ['JavaScript'], 'Short lessons with runnable examples.', 'https://www.w3schools.com/js/'),
  r('yt-akshay-js', 'Namaste JavaScript', 'YouTube (Akshay Saini)', C.yt, I, 'free', ['JavaScript'], 'Channel with in-depth videos on how JavaScript works under the hood, a favourite for interview preparation.', 'https://www.youtube.com/@akshaymarch7'),
  r('yt-traversy', 'Web development crash courses', 'YouTube (Traversy Media)', C.yt, B, 'free', ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'REST APIs'], 'Practical crash courses and project builds for web technologies.', 'https://www.youtube.com/@TraversyMedia'),
  r('ts-handbook', 'TypeScript Handbook', 'TypeScript', C.docs, I, 'free', ['TypeScript'], 'Official handbook covering the type system, generics and configuration.', 'https://www.typescriptlang.org/docs/handbook/intro.html'),
  r('react-learn', 'Learn React', 'React', C.docs, B, 'free', ['React'], 'The official tutorial and guide to thinking in components, state and effects.', 'https://react.dev/learn'),
  r('full-stack-open', 'Full Stack Open', 'University of Helsinki', C.course, I, 'free', ['React', 'Node.js', 'Express.js', 'REST APIs', 'MongoDB', 'TypeScript', 'JavaScript'], 'Free university course building full stack apps with React, Node.js and MongoDB, including testing and deployment.', 'https://fullstackopen.com/en/', { careers: ['full-stack'] }),
  r('odin', 'The Odin Project', 'The Odin Project', C.course, B, 'free', ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Git and GitHub', 'SQL'], 'Open source full stack curriculum that is project-driven and community supported.', 'https://www.theodinproject.com/', { careers: ['full-stack', 'frontend'] }),
  r('node-learn', 'Learn Node.js', 'Node.js', C.docs, B, 'free', ['Node.js'], 'Official getting-started guides covering modules, the event loop, file system and HTTP.', 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs'),
  r('express-start', 'Express getting started', 'Express', C.docs, B, 'free', ['Express.js'], 'Official guide to routing, middleware and error handling.', 'https://expressjs.com/en/starter/installing.html'),
  r('mdn-http', 'HTTP overview and reference', 'MDN Web Docs', C.docs, I, 'free', ['REST APIs', 'Computer Networks'], 'Methods, status codes, headers, caching and CORS explained.', 'https://developer.mozilla.org/en-US/docs/Web/HTTP'),
  r('restfulapi', 'REST API tutorial', 'RESTfulAPI.net', C.docs, B, 'free', ['REST APIs'], 'Design principles, constraints and naming conventions for REST APIs.', 'https://restfulapi.net/'),
  r('mongo-learn', 'MongoDB learning courses', 'MongoDB University', C.course, B, 'free', ['MongoDB'], 'Self-paced courses from MongoDB. Check the site for which badges and exams are free.', 'https://learn.mongodb.com/'),
  r('cs50-web', 'CS50\'s Web Programming', 'Harvard CS50', C.course, I, 'free', ['HTML', 'CSS', 'JavaScript', 'SQL', 'Git and GitHub', 'React'], 'Harvard course on Python, Django, SQL and JavaScript. Lectures and problem sets are free; the certificate is optional.', 'https://cs50.harvard.edu/web/', { careers: ['full-stack'] }),

  // Databases
  r('sqlbolt', 'SQLBolt interactive lessons', 'SQLBolt', C.practice, B, 'free', ['SQL', 'DBMS'], 'Short interactive exercises that teach queries, joins and aggregates.', 'https://sqlbolt.com/'),
  r('w3-sql', 'SQL tutorial', 'W3Schools', C.course, B, 'free', ['SQL'], 'Quick reference style lessons with an in-browser SQL editor.', 'https://www.w3schools.com/sql/'),
  r('kaggle-sql', 'Intro to SQL', 'Kaggle Learn', C.course, B, 'free', ['SQL', 'Data Analytics'], 'Short hands-on course on querying data with BigQuery.', 'https://www.kaggle.com/learn/intro-to-sql'),
  r('mode-sql', 'SQL tutorial for data analysis', 'Mode', C.course, I, 'free', ['SQL', 'Data Analytics'], 'Basic to advanced SQL with a focus on analysis, including window functions.', 'https://mode.com/sql-tutorial/', { careers: ['data-analyst'] }),
  r('lc-sql50', 'Top SQL 50 study plan', 'LeetCode', C.practice, I, 'freemium', ['SQL'], 'Curated SQL practice problems. Some LeetCode features require a subscription.', 'https://leetcode.com/studyplan/top-sql-50/'),
  r('gfg-dbms', 'DBMS tutorial', 'GeeksforGeeks', C.course, B, 'free', ['DBMS'], 'Relational model, normalisation, transactions and indexing explained for exam and interview use.', 'https://www.geeksforgeeks.org/dbms/'),
  r('cmu-db', 'Intro to Database Systems (CMU 15-445)', 'Carnegie Mellon University', C.course, A, 'free', ['DBMS', 'SQL'], 'University lectures on how database systems are built, with public course materials.', 'https://15445.courses.cs.cmu.edu/'),
  r('pg-tutorial', 'PostgreSQL tutorial', 'PostgreSQL', C.docs, I, 'free', ['SQL', 'DBMS'], 'Official tutorial introducing relational concepts and the SQL language.', 'https://www.postgresql.org/docs/current/tutorial.html'),

  // Programming languages
  r('gfg-c', 'C programming language tutorial', 'GeeksforGeeks', C.course, B, 'free', ['C'], 'Syntax, pointers, memory and file handling with examples.', 'https://www.geeksforgeeks.org/c-programming-language/'),
  r('learn-c', 'Learn C', 'learn-c.org', C.practice, B, 'free', ['C'], 'Interactive tutorial you can run in the browser.', 'https://www.learn-c.org/'),
  r('w3-c', 'C tutorial', 'W3Schools', C.course, B, 'free', ['C'], 'Short lessons with examples.', 'https://www.w3schools.com/c/'),
  r('learncpp', 'LearnCpp.com', 'LearnCpp', C.course, B, 'free', ['C++', 'Object-Oriented Programming'], 'Thorough free C++ tutorial from basics to advanced topics.', 'https://www.learncpp.com/'),
  r('cppreference', 'C++ reference', 'cppreference.com', C.docs, A, 'free', ['C++'], 'Community maintained reference for the language and standard library.', 'https://en.cppreference.com/w/'),
  r('gfg-cpp', 'C++ programming language tutorial', 'GeeksforGeeks', C.course, B, 'free', ['C++'], 'STL, classes and templates with worked examples.', 'https://www.geeksforgeeks.org/cpp-programming-language/'),
  r('dev-java', 'Learn Java', 'dev.java', C.docs, B, 'free', ['Java', 'Object-Oriented Programming'], 'Oracle\'s official learning hub for the Java language and platform.', 'https://dev.java/learn/'),
  r('mooc-java', 'Java Programming (MOOC.fi)', 'University of Helsinki', C.course, B, 'free', ['Java', 'Object-Oriented Programming', 'Data Structures and Algorithms'], 'Free university course with exercises, from basics to object-oriented programming.', 'https://java-programming.mooc.fi/'),
  r('w3-java', 'Java tutorial', 'W3Schools', C.course, B, 'free', ['Java'], 'Concise lessons with examples.', 'https://www.w3schools.com/java/'),
  r('py-docs', 'The Python Tutorial', 'Python.org', C.docs, B, 'free', ['Python'], 'The official tutorial to the language and its standard library.', 'https://docs.python.org/3/tutorial/'),
  r('cs50p', 'CS50\'s Introduction to Programming with Python', 'Harvard CS50', C.course, B, 'free', ['Python'], 'Free Harvard course with problem sets. Certificate is optional.', 'https://cs50.harvard.edu/python/'),
  r('kaggle-python', 'Python', 'Kaggle Learn', C.course, B, 'free', ['Python'], 'Short practical course focused on the Python needed for data work.', 'https://www.kaggle.com/learn/python'),
  r('w3-python', 'Python tutorial', 'W3Schools', C.course, B, 'free', ['Python'], 'Quick lessons with a try-it editor.', 'https://www.w3schools.com/python/'),
  r('yt-fcc', 'freeCodeCamp.org YouTube channel', 'YouTube (freeCodeCamp.org)', C.yt, B, 'free', ['Python', 'JavaScript', 'React', 'Data Structures and Algorithms', 'Machine Learning', 'Cybersecurity', 'Cloud Computing', 'Blockchain', 'Solidity', 'Flutter', 'Android Development', 'Linux', 'Docker', 'SQL'], 'Long-form full courses on almost every topic here. Search the channel for your skill.', 'https://www.youtube.com/@freecodecamp'),
  r('yt-cs50', 'CS50 lectures', 'YouTube (CS50)', C.yt, B, 'free', ['C', 'Python', 'Data Structures and Algorithms', 'SQL', 'Cybersecurity'], 'Full Harvard lecture recordings on computing fundamentals.', 'https://www.youtube.com/@cs50'),
  r('yt-codewithharry', 'Programming tutorials in Hindi and English', 'YouTube (CodeWithHarry)', C.yt, B, 'free', ['C', 'C++', 'Java', 'Python', 'JavaScript', 'HTML', 'CSS'], 'Beginner series on core languages and web basics.', 'https://www.youtube.com/@CodeWithHarry'),
  r('yt-apna', 'Apna College', 'YouTube (Apna College)', C.yt, B, 'free', ['C++', 'Java', 'Data Structures and Algorithms', 'HTML', 'CSS', 'JavaScript', 'DBMS', 'SQL'], 'Beginner-friendly playlists widely used by engineering students in India.', 'https://www.youtube.com/@ApnaCollegeOfficial'),

  // Core CS
  r('gfg-dsa', 'DSA self-paced learning', 'GeeksforGeeks', C.course, B, 'free', ['Data Structures and Algorithms'], 'Tutorials covering arrays to graphs with complexity analysis. Paid courses also exist on the site.', 'https://www.geeksforgeeks.org/learn-data-structures-and-algorithms-dsa-tutorial/'),
  r('visualgo', 'VisuAlgo', 'VisuAlgo', C.practice, B, 'free', ['Data Structures and Algorithms'], 'Animated visualisations of data structures and algorithms.', 'https://visualgo.net/'),
  r('neetcode', 'NeetCode roadmap', 'NeetCode', C.practice, I, 'freemium', ['Data Structures and Algorithms'], 'Problem list grouped by pattern with video explanations. Some content is behind a paid plan.', 'https://neetcode.io/roadmap', { careers: ['software-engineer', 'backend'] }),
  r('leetcode', 'LeetCode problem set', 'LeetCode', C.practice, I, 'freemium', ['Data Structures and Algorithms'], 'Large interview-style problem bank. Many problems are free; premium features cost extra.', 'https://leetcode.com/problemset/'),
  r('yt-striver', 'take U forward', 'YouTube (take U forward)', C.yt, I, 'free', ['Data Structures and Algorithms'], 'Structured DSA playlists with an emphasis on interview patterns.', 'https://www.youtube.com/@takeUforward'),
  r('yt-abdulbari', 'Abdul Bari', 'YouTube (Abdul Bari)', C.yt, B, 'free', ['Data Structures and Algorithms', 'Operating Systems', 'DBMS'], 'Careful explanations of algorithms and core computer science concepts.', 'https://www.youtube.com/@abdulbari'),
  r('oracle-oop', 'Object-oriented programming concepts', 'Oracle Java Tutorials', C.docs, B, 'free', ['Object-Oriented Programming'], 'Clear introduction to objects, classes, inheritance and interfaces.', 'https://docs.oracle.com/javase/tutorial/java/concepts/'),
  r('gfg-oop', 'Object-oriented design and OOPs concepts', 'GeeksforGeeks', C.course, B, 'free', ['Object-Oriented Programming'], 'OOP principles and design patterns with examples.', 'https://www.geeksforgeeks.org/oops-object-oriented-design/'),
  r('ostep', 'Operating Systems: Three Easy Pieces', 'University of Wisconsin-Madison', C.docs, I, 'free', ['Operating Systems'], 'Free textbook on virtualisation, concurrency and persistence.', 'https://pages.cs.wisc.edu/~remzi/OSTEP/'),
  r('gfg-os', 'Operating systems tutorial', 'GeeksforGeeks', C.course, B, 'free', ['Operating Systems'], 'Processes, scheduling, memory management and deadlocks for exams and interviews.', 'https://www.geeksforgeeks.org/operating-systems/'),
  r('gfg-cn', 'Computer network tutorials', 'GeeksforGeeks', C.course, B, 'free', ['Computer Networks'], 'OSI and TCP/IP layers, routing, DNS and protocols.', 'https://www.geeksforgeeks.org/computer-network-tutorials/'),
  r('practical-net', 'Practical Networking', 'Practical Networking', C.docs, B, 'free', ['Computer Networks', 'Network Security'], 'Plain-language articles and videos on networking fundamentals.', 'https://www.practicalnetworking.net/'),
  r('cloudflare-learn', 'Cloudflare Learning Center', 'Cloudflare', C.docs, B, 'free', ['Computer Networks', 'Network Security', 'Cybersecurity'], 'Explainers on DNS, TLS, DDoS attacks and web security.', 'https://www.cloudflare.com/learning/'),
  r('sysdesign-primer', 'The System Design Primer', 'GitHub (donnemartin)', C.docs, I, 'free', ['System Design'], 'Popular open source guide to scalability and system design interviews.', 'https://github.com/donnemartin/system-design-primer', { careers: ['backend', 'software-engineer'] }),
  r('yt-gaurav', 'Gaurav Sen system design', 'YouTube (Gaurav Sen)', C.yt, I, 'free', ['System Design'], 'Video series on designing scalable systems.', 'https://www.youtube.com/@gkcs'),
  r('nptel-core', 'NPTEL course catalogue: core computer science', 'NPTEL', C.course, I, 'certfee', ['Data Structures and Algorithms', 'Object-Oriented Programming', 'DBMS', 'Operating Systems', 'Computer Networks'], 'Search the catalogue for the topic. IIT and IISc lectures are free to watch; the optional certification exam has a fee.', 'https://nptel.ac.in/courses'),
  r('nptel-ml', 'NPTEL course catalogue: data science, ML and AI', 'NPTEL', C.course, I, 'certfee', ['Machine Learning', 'Artificial Intelligence', 'Statistics', 'Data Analytics'], 'Search for machine learning, data science and AI courses. Lectures are free to watch; the certification exam has a fee.', 'https://nptel.ac.in/courses'),
  r('nptel-cloud', 'NPTEL course catalogue: cloud and security', 'NPTEL', C.course, I, 'certfee', ['Cloud Computing', 'Cybersecurity', 'Network Security'], 'Search for cloud computing and security courses. Lectures are free to watch; the certification exam has a fee.', 'https://nptel.ac.in/courses'),
  r('cs50x', 'CS50x: Introduction to Computer Science', 'Harvard CS50', C.course, B, 'free', ['C', 'Python', 'SQL', 'Data Structures and Algorithms', 'HTML', 'CSS', 'JavaScript'], 'Harvard\'s flagship introduction to computer science. Free to take; a certificate is optional.', 'https://cs50.harvard.edu/x/', { time: 'Around 10 weeks' }),
  r('edx-cs50', 'CS50 on edX', 'edX', C.cert, B, 'audit', ['C', 'Python', 'Data Structures and Algorithms', 'SQL'], 'The same CS50 introduction offered through edX. Verified certificates are paid; check the edX page for current options.', 'https://www.edx.org/cs50'),

  // Tools and practice
  r('pro-git', 'Pro Git book', 'Git', C.docs, B, 'free', ['Git and GitHub'], 'The official free book on Git, from basics to internals.', 'https://git-scm.com/book/en/v2'),
  r('gh-skills', 'GitHub Skills', 'GitHub', C.practice, B, 'free', ['Git and GitHub', 'CI/CD'], 'Short interactive courses that run inside your own GitHub repository.', 'https://skills.github.com/'),
  r('learn-git-branching', 'Learn Git Branching', 'learngitbranching.js.org', C.practice, B, 'free', ['Git and GitHub'], 'Visual, interactive tutorial on branching, merging and rebasing.', 'https://learngitbranching.js.org/'),
  r('linux-journey', 'Linux Journey', 'Linux Journey', C.course, B, 'free', ['Linux', 'Operating Systems'], 'Beginner-friendly guide to the command line, users, permissions and processes.', 'https://linuxjourney.com/'),
  r('overthewire', 'OverTheWire: Bandit', 'OverTheWire', C.practice, B, 'free', ['Linux', 'Cybersecurity'], 'Wargame that teaches the Linux command line and basic security through puzzles.', 'https://overthewire.org/wargames/bandit/'),
  r('docker-start', 'Get started with Docker', 'Docker Docs', C.docs, B, 'free', ['Docker'], 'Official guide to images, containers, volumes and Compose.', 'https://docs.docker.com/get-started/'),
  r('yt-nana', 'TechWorld with Nana', 'YouTube (TechWorld with Nana)', C.yt, B, 'free', ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Cloud Computing'], 'DevOps tutorials on containers, Kubernetes and pipelines.', 'https://www.youtube.com/@TechWorldwithNana'),
  r('k8s-basics', 'Learn Kubernetes basics', 'Kubernetes Docs', C.docs, I, 'free', ['Kubernetes'], 'Interactive official tutorial on deploying and scaling applications.', 'https://kubernetes.io/docs/tutorials/kubernetes-basics/'),
  r('gh-actions', 'GitHub Actions documentation', 'GitHub Docs', C.docs, I, 'free', ['CI/CD'], 'Workflows, runners and deployment automation for repositories on GitHub.', 'https://docs.github.com/en/actions'),

  // Cloud
  r('aws-practitioner', 'AWS Cloud Practitioner Essentials', 'AWS Training', C.course, B, 'free', ['Cloud Computing'], 'Foundational AWS digital course. Confirm availability and free access on the AWS training page.', 'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/'),
  r('aws-cert', 'AWS Certified Cloud Practitioner', 'AWS Certification', C.cert, B, 'paid', ['Cloud Computing'], 'Entry-level AWS certification. The exam has a fee; check the page for current pricing.', 'https://aws.amazon.com/certification/certified-cloud-practitioner/'),
  r('az-learn', 'Microsoft Learn: Azure training', 'Microsoft Learn', C.course, B, 'free', ['Cloud Computing'], 'Free learning paths on Azure fundamentals and beyond.', 'https://learn.microsoft.com/en-us/training/azure/'),
  r('az900', 'Azure Fundamentals (AZ-900) certification', 'Microsoft Learn', C.cert, B, 'paid', ['Cloud Computing'], 'Entry certification for Azure. Study material is free; the exam may have a fee, so check the page.', 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/'),
  r('gcp-skills', 'Google Cloud Skills Boost', 'Google Cloud', C.practice, I, 'freemium', ['Cloud Computing'], 'Hands-on labs on Google Cloud. Some content is free; labs may use credits or a subscription.', 'https://www.cloudskillsboost.google/'),

  // Cybersecurity
  r('owasp-top10', 'OWASP Top 10', 'OWASP', C.docs, I, 'free', ['Cybersecurity', 'Network Security'], 'The standard awareness document for the most critical web application risks.', 'https://owasp.org/www-project-top-ten/'),
  r('portswigger', 'Web Security Academy', 'PortSwigger', C.course, I, 'free', ['Cybersecurity', 'Network Security'], 'Free labs and learning material on web vulnerabilities such as SQL injection and XSS.', 'https://portswigger.net/web-security', { careers: ['cybersecurity'] }),
  r('tryhackme', 'TryHackMe', 'TryHackMe', C.practice, B, 'freemium', ['Cybersecurity', 'Network Security', 'Linux', 'Computer Networks'], 'Guided hands-on security rooms. Many rooms are free; a subscription unlocks more.', 'https://tryhackme.com/', { careers: ['cybersecurity'] }),
  r('picoctf', 'picoCTF', 'Carnegie Mellon University', C.practice, B, 'free', ['Cybersecurity'], 'Beginner-friendly capture-the-flag platform with a permanent practice gym.', 'https://picoctf.org/', { careers: ['cybersecurity'] }),
  r('google-cyber', 'Google Cybersecurity Professional Certificate', 'Coursera', C.cert, B, 'audit', ['Cybersecurity', 'Network Security', 'Linux', 'Python', 'SQL'], 'Entry-level certificate programme. Courses can often be audited for free; the certificate needs a paid plan or financial aid.', 'https://www.coursera.org/professional-certificates/google-cybersecurity', { careers: ['cybersecurity'] }),
  r('yt-networkchuck', 'NetworkChuck', 'YouTube (NetworkChuck)', C.yt, B, 'free', ['Computer Networks', 'Network Security', 'Cybersecurity', 'Linux'], 'Approachable videos on networking, Linux and security.', 'https://www.youtube.com/@NetworkChuck'),
  r('secplus', 'CompTIA Security+', 'CompTIA', C.cert, I, 'paid', ['Cybersecurity', 'Network Security'], 'Widely recognised entry security certification. The exam is paid; see CompTIA for current pricing.', 'https://www.comptia.org/certifications/security'),

  // Data and ML
  r('kaggle-intro-ml', 'Intro to Machine Learning', 'Kaggle Learn', C.course, B, 'free', ['Machine Learning'], 'Short course on models, validation and random forests using scikit-learn.', 'https://www.kaggle.com/learn/intro-to-machine-learning'),
  r('kaggle-pandas', 'Pandas', 'Kaggle Learn', C.course, B, 'free', ['Data Analytics', 'Python'], 'Hands-on course on data manipulation with pandas.', 'https://www.kaggle.com/learn/pandas'),
  r('kaggle-clean', 'Data Cleaning', 'Kaggle Learn', C.course, B, 'free', ['Data Analytics'], 'Handling missing values, scaling and inconsistent data.', 'https://www.kaggle.com/learn/data-cleaning'),
  r('kaggle-viz', 'Data Visualization', 'Kaggle Learn', C.course, B, 'free', ['Data Visualization', 'Data Analytics'], 'Build charts with seaborn and learn which chart suits which question.', 'https://www.kaggle.com/learn/data-visualization'),
  r('kaggle-dl', 'Intro to Deep Learning', 'Kaggle Learn', C.course, I, 'free', ['Deep Learning', 'Machine Learning'], 'Build neural networks with Keras and TensorFlow.', 'https://www.kaggle.com/learn/intro-to-deep-learning'),
  r('kaggle-comp', 'Kaggle competitions and datasets', 'Kaggle', C.practice, I, 'free', ['Machine Learning', 'Data Analytics', 'Deep Learning'], 'Practise on real datasets, read public notebooks and join beginner competitions.', 'https://www.kaggle.com/competitions', { careers: ['ai-ml', 'data-scientist'] }),
  r('ml-crash', 'Machine Learning Crash Course', 'Google for Developers', C.course, B, 'free', ['Machine Learning'], 'Google\'s free course with videos, exercises and case studies.', 'https://developers.google.com/machine-learning/crash-course'),
  r('coursera-ml', 'Machine Learning Specialization', 'Coursera (DeepLearning.AI, Stanford)', C.cert, B, 'audit', ['Machine Learning', 'Python', 'Statistics'], 'Popular introduction to machine learning. Courses can often be audited; certificates need a paid plan or aid.', 'https://www.coursera.org/specializations/machine-learning-introduction', { careers: ['ai-ml', 'data-scientist'] }),
  r('sklearn', 'scikit-learn user guide', 'scikit-learn', C.docs, I, 'free', ['Machine Learning'], 'Reference for classical machine learning algorithms with examples.', 'https://scikit-learn.org/stable/user_guide.html'),
  r('fastai', 'Practical Deep Learning for Coders', 'fast.ai', C.course, I, 'free', ['Deep Learning', 'Machine Learning', 'Artificial Intelligence'], 'Free top-down course that has you training models early.', 'https://course.fast.ai/'),
  r('pytorch-tut', 'PyTorch tutorials', 'PyTorch', C.docs, I, 'free', ['Deep Learning'], 'Official tutorials from tensors to training and deployment.', 'https://pytorch.org/tutorials/'),
  r('yt-3b1b', 'Neural networks series', 'YouTube (3Blue1Brown)', C.yt, I, 'free', ['Deep Learning', 'Machine Learning', 'Artificial Intelligence'], 'Visual explanation of how neural networks learn.', 'https://www.youtube.com/@3blue1brown'),
  r('yt-statquest', 'StatQuest', 'YouTube (StatQuest)', C.yt, B, 'free', ['Statistics', 'Machine Learning'], 'Clear, step-by-step explanations of statistics and machine learning ideas.', 'https://www.youtube.com/@statquest'),
  r('yt-karpathy', 'Neural Networks: Zero to Hero', 'YouTube (Andrej Karpathy)', C.yt, A, 'free', ['Deep Learning', 'Machine Learning'], 'Build neural networks from scratch in code.', 'https://www.youtube.com/@AndrejKarpathy'),
  r('cs50-ai', 'CS50\'s Introduction to AI with Python', 'Harvard CS50', C.course, I, 'free', ['Artificial Intelligence', 'Machine Learning', 'Python'], 'Search, knowledge, uncertainty, learning and language. Free to take.', 'https://cs50.harvard.edu/ai/'),
  r('elements-ai', 'Elements of AI', 'University of Helsinki', C.course, B, 'free', ['Artificial Intelligence'], 'Non-technical introduction to what AI is and how it works.', 'https://www.elementsofai.com/'),
  r('khan-stats', 'Statistics and probability', 'Khan Academy', C.course, B, 'free', ['Statistics'], 'Free lessons covering descriptive statistics, probability and inference.', 'https://www.khanacademy.org/math/statistics-probability'),
  r('think-stats', 'Think Stats', 'Green Tea Press', C.docs, I, 'free', ['Statistics', 'Python'], 'Free book that teaches statistics using Python.', 'https://greenteapress.com/wp/think-stats-2e/'),
  r('pandas-start', 'Getting started with pandas', 'pandas', C.docs, B, 'free', ['Data Analytics', 'Python'], 'Official introductory tutorials for tabular data analysis.', 'https://pandas.pydata.org/docs/getting_started/index.html'),
  r('google-da', 'Google Data Analytics Professional Certificate', 'Coursera', C.cert, B, 'audit', ['Data Analytics', 'SQL', 'Data Visualization', 'Statistics'], 'Entry-level certificate programme. Courses can often be audited; the certificate needs a paid plan or aid.', 'https://www.coursera.org/professional-certificates/google-data-analytics', { careers: ['data-analyst'] }),
  r('powerbi', 'Power BI documentation and training', 'Microsoft Learn', C.docs, B, 'free', ['Data Visualization', 'Data Analytics'], 'Official learning material for building reports and dashboards.', 'https://learn.microsoft.com/en-us/power-bi/'),
  r('yt-alex', 'Alex The Analyst', 'YouTube (Alex The Analyst)', C.yt, B, 'free', ['Data Analytics', 'SQL', 'Data Visualization', 'Python'], 'Tutorials and portfolio project walkthroughs for aspiring analysts.', 'https://www.youtube.com/@AlexTheAnalyst'),

  // Blockchain
  r('eth-docs', 'Ethereum developer documentation', 'ethereum.org', C.docs, B, 'free', ['Blockchain', 'Solidity'], 'Foundations, smart contracts, nodes and tooling explained by the Ethereum community.', 'https://ethereum.org/en/developers/docs/', { careers: ['blockchain'] }),
  r('solidity-docs', 'Solidity documentation', 'Solidity', C.docs, I, 'free', ['Solidity'], 'The official language reference and guides.', 'https://docs.soliditylang.org/'),
  r('cryptozombies', 'CryptoZombies', 'CryptoZombies', C.practice, B, 'free', ['Solidity', 'Blockchain'], 'Game-based interactive course for learning Solidity.', 'https://cryptozombies.io/'),
  r('hardhat', 'Hardhat documentation', 'Hardhat', C.docs, I, 'free', ['Solidity', 'Blockchain'], 'Development environment for compiling, testing and deploying contracts.', 'https://hardhat.org/docs'),
  r('cyfrin', 'Cyfrin Updraft', 'Cyfrin', C.course, I, 'free', ['Solidity', 'Blockchain', 'Cybersecurity'], 'Free smart contract development and security courses. Check the site for the current catalogue.', 'https://updraft.cyfrin.io/', { careers: ['blockchain'] }),

  // Mobile
  r('flutter-codelab', 'Write your first Flutter app', 'Flutter Docs', C.docs, B, 'free', ['Flutter'], 'Official codelab and learning path for building Flutter apps.', 'https://docs.flutter.dev/get-started/codelab'),
  r('yt-flutter', 'Flutter channel', 'YouTube (Flutter)', C.yt, B, 'free', ['Flutter'], 'Official videos, widget explainers and tutorials.', 'https://www.youtube.com/@flutterdev'),
  r('android-courses', 'Android Basics with Compose', 'Android Developers', C.course, B, 'free', ['Android Development'], 'Official free courses for building Android apps with Kotlin and Jetpack Compose.', 'https://developer.android.com/courses'),
  r('kotlin-docs', 'Kotlin getting started', 'Kotlin', C.docs, B, 'free', ['Android Development'], 'Official introduction to the language used for modern Android development.', 'https://kotlinlang.org/docs/getting-started.html'),

  // UI/UX
  r('google-ux', 'Google UX Design Professional Certificate', 'Coursera', C.cert, B, 'audit', ['UI/UX Design'], 'Entry-level design programme. Courses can often be audited; the certificate needs a paid plan or aid.', 'https://www.coursera.org/professional-certificates/google-ux-design', { careers: ['ux'] }),
  r('laws-of-ux', 'Laws of UX', 'Laws of UX', C.docs, B, 'free', ['UI/UX Design'], 'Concise collection of psychology principles that shape good interface design.', 'https://lawsofux.com/'),
  r('nng', 'Nielsen Norman Group articles', 'Nielsen Norman Group', C.docs, I, 'free', ['UI/UX Design'], 'Research-backed articles on usability, research methods and interaction design.', 'https://www.nngroup.com/articles/'),
  r('figma-help', 'Figma help centre', 'Figma', C.docs, B, 'freemium', ['UI/UX Design'], 'Official guides for Figma. The tool has a free plan with paid tiers.', 'https://help.figma.com/hc/en-us'),
  r('material3', 'Material Design 3', 'Google', C.docs, I, 'free', ['UI/UX Design'], 'Design system guidelines, components and accessibility guidance.', 'https://m3.material.io/'),
  r('yt-designcourse', 'DesignCourse', 'YouTube (DesignCourse)', C.yt, B, 'free', ['UI/UX Design', 'CSS'], 'UI design, Figma and front-end design tutorials.', 'https://www.youtube.com/@DesignCourse'),

  // Projects and career-level
  r('build-your-own-x', 'Build your own X', 'GitHub (CodeCrafters)', C.project, I, 'free', ['Data Structures and Algorithms', 'Operating Systems', 'Computer Networks', 'DBMS', 'Docker', 'Blockchain'], 'Curated tutorials for recreating technologies from scratch, such as a database, shell or container.', 'https://github.com/codecrafters-io/build-your-own-x', { careers: ['software-engineer', 'backend'] }),
  r('project-based-learning', 'Project-based learning', 'GitHub (practical-tutorials)', C.project, B, 'free', ['JavaScript', 'Python', 'Java', 'C++', 'Node.js', 'React', 'Machine Learning', 'Android Development', 'Flutter', 'Docker'], 'Curated list of project tutorials sorted by language and area.', 'https://github.com/practical-tutorials/project-based-learning'),
  r('yt-fcc-projects', 'Project tutorials on freeCodeCamp.org', 'YouTube (freeCodeCamp.org)', C.project, I, 'free', ['React', 'Node.js', 'Python', 'Machine Learning', 'Flutter'], 'Long-form build-along videos. Search the channel for a project in your area.', 'https://www.youtube.com/@freecodecamp'),
  r('interview-handbook', 'Tech Interview Handbook', 'Tech Interview Handbook', C.docs, I, 'free', ['Data Structures and Algorithms'], 'Resume, behavioural and coding interview preparation guides.', 'https://www.techinterviewhandbook.org/', { careers: ['software-engineer', 'full-stack', 'frontend', 'backend', 'mobile', 'devops', 'cloud', 'blockchain', 'ai-ml', 'data-scientist', 'data-analyst', 'cybersecurity', 'ux'] }),
  r('interviewbit', 'InterviewBit', 'InterviewBit', C.practice, I, 'freemium', ['Data Structures and Algorithms'], 'Structured interview practice. Some content is free; premium offerings exist.', 'https://www.interviewbit.com/', { careers: ['software-engineer', 'backend', 'full-stack'] }),
  r('hackerrank', 'HackerRank practice', 'HackerRank', C.practice, B, 'free', ['Data Structures and Algorithms', 'SQL', 'Python', 'Java', 'C++'], 'Practice problems by domain and language, often used in campus hiring tests.', 'https://www.hackerrank.com/domains'),
  r('codechef', 'CodeChef practice', 'CodeChef', C.practice, I, 'free', ['Data Structures and Algorithms'], 'Practice problems and regular contests popular with Indian students.', 'https://www.codechef.com/practice'),
  r('rmsh-full-stack', 'Full Stack roadmap', 'roadmap.sh', C.docs, B, 'free', [], 'Community roadmap showing what to learn and in what order.', 'https://roadmap.sh/full-stack', { careers: ['full-stack'] }),
  r('rmsh-frontend', 'Frontend roadmap', 'roadmap.sh', C.docs, B, 'free', [], 'Community roadmap showing what to learn and in what order.', 'https://roadmap.sh/frontend', { careers: ['frontend'] }),
  r('rmsh-backend', 'Backend roadmap', 'roadmap.sh', C.docs, B, 'free', [], 'Community roadmap showing what to learn and in what order.', 'https://roadmap.sh/backend', { careers: ['backend'] }),
  r('rmsh-design-arch', 'Software design and architecture roadmap', 'roadmap.sh', C.docs, I, 'free', [], 'Community roadmap for software engineering fundamentals.', 'https://roadmap.sh/software-design-architecture', { careers: ['software-engineer'] }),
  r('rmsh-ai', 'AI and Data Scientist roadmap', 'roadmap.sh', C.docs, B, 'free', [], 'Community roadmap showing what to learn and in what order.', 'https://roadmap.sh/ai-data-scientist', { careers: ['ai-ml', 'data-scientist'] }),
  r('rmsh-data-analyst', 'Data Analyst roadmap', 'roadmap.sh', C.docs, B, 'free', [], 'Community roadmap showing what to learn and in what order.', 'https://roadmap.sh/data-analyst', { careers: ['data-analyst'] }),
  r('rmsh-cyber', 'Cyber Security roadmap', 'roadmap.sh', C.docs, B, 'free', [], 'Community roadmap showing what to learn and in what order.', 'https://roadmap.sh/cyber-security', { careers: ['cybersecurity'] }),
  r('rmsh-aws', 'AWS roadmap', 'roadmap.sh', C.docs, B, 'free', [], 'Community roadmap for learning AWS services in order.', 'https://roadmap.sh/aws', { careers: ['cloud'] }),
  r('rmsh-devops', 'DevOps roadmap', 'roadmap.sh', C.docs, B, 'free', [], 'Community roadmap showing what to learn and in what order.', 'https://roadmap.sh/devops', { careers: ['devops'] }),
  r('rmsh-blockchain', 'Blockchain roadmap', 'roadmap.sh', C.docs, B, 'free', [], 'Community roadmap showing what to learn and in what order.', 'https://roadmap.sh/blockchain', { careers: ['blockchain'] }),
  r('rmsh-android', 'Android roadmap', 'roadmap.sh', C.docs, B, 'free', [], 'Community roadmap showing what to learn and in what order.', 'https://roadmap.sh/android', { careers: ['mobile'] }),
  r('rmsh-ux', 'UX Design roadmap', 'roadmap.sh', C.docs, B, 'free', [], 'Community roadmap showing what to learn and in what order.', 'https://roadmap.sh/ux-design', { careers: ['ux'] }),
];

export const RESOURCE_BY_ID = new Map(RESOURCES.map((x) => [x.id, x]));
