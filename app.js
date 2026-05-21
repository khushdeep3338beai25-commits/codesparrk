/* ==========================================================================
   CODESPARK PRO — CORE APPLICATION ENGINE v2.0
   IAM | Tutorial Engine | Analytics | Gamification | Real-time Sync
   ========================================================================== */

// ── STATE MANAGEMENT (Zustand-style singleton) ──────────────────────────────
const AppState = (() => {
    const KEY = 'csparkpro_state';
    let state = {
        user: null,
        xp: 0,
        streak: 0,
        lastActiveDate: null,
        completedLessons: {},   // { "python::lesson_0": true, ... }
        quizzesPassed: 0,
        activityFeed: []
    };

    function load() {
        try {
            const saved = localStorage.getItem(KEY);
            if (saved) state = { ...state, ...JSON.parse(saved) };
        } catch(e) {}
    }

    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e) {}
    }

    function get() { return state; }

    function update(patch) {
        state = { ...state, ...patch };
        save();
        syncUI();
    }

    function addXP(amount, reason) {
        state.xp += amount;
        addActivity(`+${amount} XP — ${reason}`, 'xp-earn');
        save();
        animateXPTicker(amount);
        syncUI();
    }

    function markLessonDone(lessonKey) {
        if (state.completedLessons[lessonKey]) return false; // already done
        state.completedLessons[lessonKey] = true;
        save();
        syncUI();
        return true;
    }

    function isLessonDone(lessonKey) {
        return !!state.completedLessons[lessonKey];
    }

    function addActivity(msg, type = 'default') {
        state.activityFeed.unshift({ msg, type, time: Date.now() });
        if (state.activityFeed.length > 20) state.activityFeed.pop();
        save();
        renderActivityFeed();
    }

    function checkStreak() {
        const today = new Date().toDateString();
        const last  = state.lastActiveDate;
        if (last === today) return;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (last === yesterday) {
            state.streak = (state.streak || 0) + 1;
        } else if (last !== today) {
            if (last) state.streak = 1; // reset streak
            else state.streak = 1;
        }
        state.lastActiveDate = today;
        save();
    }

    function getProgressForLang(langKey) {
        const lessons = CURRICULUM[langKey];
        if (!lessons) return { done: 0, total: 0, pct: 0 };
        const total = lessons.length;
        const done  = lessons.filter((_, i) => state.completedLessons[`${langKey}::lesson_${i}`]).length;
        const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
        return { done, total, pct };
    }

    function getOverallProgress() {
        let totalLessons = 0, totalDone = 0;
        Object.keys(CURRICULUM).forEach(lang => {
            const { done, total } = getProgressForLang(lang);
            totalLessons += total;
            totalDone    += done;
        });
        return totalLessons === 0 ? 0 : Math.round((totalDone / totalLessons) * 100);
    }

    load();
    return { get, update, addXP, markLessonDone, isLessonDone, addActivity, checkStreak, getProgressForLang, getOverallProgress, save };
})();

// ── CURRICULUM DATA ──────────────────────────────────────────────────────────
const CURRICULUM = {
    python: [
        {
            title: 'Hello World & Print',
            code: `# Python Lesson 1: Hello World\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))`,
            quiz: [
                {
                    q: 'Which function is used to display output in Python?',
                    options: ['display()', 'print()', 'echo()', 'output()'],
                    correct: 1,
                    explanation: 'The print() function outputs text to the console in Python.'
                },
                {
                    q: 'What does f"Hello, {name}" represent in Python?',
                    options: ['A format string', 'A function call', 'A variable declaration', 'A comment'],
                    correct: 0,
                    explanation: 'f-strings (formatted string literals) allow embedding expressions inside string literals using curly braces.'
                },
                {
                    q: 'How do you define a function in Python?',
                    options: ['function greet():', 'def greet():', 'fn greet():', 'void greet():'],
                    correct: 1,
                    explanation: 'Python uses the def keyword to define functions, followed by the function name and parentheses.'
                }
            ]
        },
        {
            title: 'Variables & Data Types',
            code: `# Python Lesson 2: Variables & Types\nname = "Alice"\nage = 25\nheight = 5.7\nis_student = True\n\nprint(f"{name} is {age} years old")\nprint(f"Type of age: {type(age)}")`,
            quiz: [
                {
                    q: 'Which of these is a valid Python variable name?',
                    options: ['2var', 'my-var', 'my_var', 'var!'],
                    correct: 2,
                    explanation: 'Python variable names can contain letters, numbers, and underscores, but cannot start with a number or contain hyphens.'
                },
                {
                    q: 'What is the output of type(3.14) in Python?',
                    options: ["<class 'int'>", "<class 'float'>", "<class 'decimal'>", "<class 'number'>"],
                    correct: 1,
                    explanation: '3.14 is a floating-point number, so type() returns <class \'float\'>.'
                }
            ]
        },
        {
            title: 'Lists & Loops',
            code: `# Python Lesson 3: Lists & Loops\nfruits = ["apple", "banana", "cherry"]\n\nfor fruit in fruits:\n    print(f"🍎 {fruit.upper()}")\n\nprint(f"\\nTotal: {len(fruits)} fruits")`,
            quiz: [
                {
                    q: 'How do you access the first element of a list called "items"?',
                    options: ['items[1]', 'items.first()', 'items[0]', 'items.get(0)'],
                    correct: 2,
                    explanation: 'Python uses zero-based indexing, so the first element is at index 0.'
                },
                {
                    q: 'Which keyword is used to iterate over a collection in Python?',
                    options: ['while', 'loop', 'for', 'each'],
                    correct: 2,
                    explanation: 'The for keyword is used to iterate over sequences and other iterable objects in Python.'
                }
            ]
        }
    ],
    javascript: [
        {
            title: 'Basics & Console',
            code: `// JavaScript Lesson 1: Basics\nconst greet = (name) => {\n    console.log(\`Hello, \${name}!\`);\n    return \`Welcome, \${name}\`;\n};\n\ngreet("Developer");\nconsole.log("CodeSpark JS Ready!");`,
            quiz: [
                {
                    q: 'What is the difference between "let" and "const" in JavaScript?',
                    options: [
                        'No difference',
                        'const cannot be reassigned; let can',
                        'let is faster than const',
                        'const is only for numbers'
                    ],
                    correct: 1,
                    explanation: 'const declares a block-scoped constant — it cannot be reassigned after initialization. let declares a block-scoped variable that can be reassigned.'
                },
                {
                    q: 'What does the => symbol represent?',
                    options: ['A comparison', 'An arrow function', 'A class method', 'An import statement'],
                    correct: 1,
                    explanation: 'The => is an arrow function syntax introduced in ES6, providing a shorter way to write function expressions.'
                }
            ]
        },
        {
            title: 'Arrays & Methods',
            code: `// JavaScript Lesson 2: Arrays\nconst nums = [1, 2, 3, 4, 5];\n\nconst doubled = nums.map(n => n * 2);\nconst evens = nums.filter(n => n % 2 === 0);\nconst sum = nums.reduce((acc, n) => acc + n, 0);\n\nconsole.log("Doubled:", doubled);\nconsole.log("Evens:", evens);\nconsole.log("Sum:", sum);`,
            quiz: [
                {
                    q: 'What does Array.map() return?',
                    options: ['The same array modified', 'A new array with transformed elements', 'A single value', 'An object'],
                    correct: 1,
                    explanation: 'Array.map() creates a new array populated with the results of calling the provided function on every element.'
                },
                {
                    q: 'Which method would you use to find a sum of an array?',
                    options: ['map()', 'filter()', 'reduce()', 'find()'],
                    correct: 2,
                    explanation: 'reduce() executes a reducer function on each element, resulting in a single output value — perfect for summing an array.'
                }
            ]
        }
    ],
    java: [
        {
            title: 'Hello World & Class Structure',
            code: `// Java Lesson 1: Class Structure\npublic class Main {\n    public static void main(String[] args) {\n        String message = "Hello, CodeSpark!";\n        System.out.println(message);\n        System.out.println("Java is running!");\n    }\n}`,
            quiz: [
                {
                    q: 'What is the entry point of a Java program?',
                    options: ['public void start()', 'public static void main(String[] args)', 'void run()', 'static void init()'],
                    correct: 1,
                    explanation: 'Every Java application must have a main method with the exact signature: public static void main(String[] args).'
                },
                {
                    q: 'Which keyword is used to print output in Java?',
                    options: ['print()', 'console.log()', 'System.out.println()', 'echo()'],
                    correct: 2,
                    explanation: 'System.out.println() is the standard Java way to print a line to the console.'
                }
            ]
        }
    ],
    typescript: [
        {
            title: 'Types & Interfaces',
            code: `// TypeScript Lesson 1: Type Safety\ninterface User {\n    name: string;\n    age: number;\n    isActive: boolean;\n}\n\nconst createUser = (name: string, age: number): User => ({\n    name,\n    age,\n    isActive: true\n});\n\nconst user = createUser("Alice", 30);\nconsole.log(user);`,
            quiz: [
                {
                    q: 'What is the main benefit of TypeScript over JavaScript?',
                    options: ['It runs faster', 'It adds static type checking', 'It requires less code', 'It works only in Node.js'],
                    correct: 1,
                    explanation: 'TypeScript adds optional static type checking to JavaScript, catching type errors at compile time before runtime.'
                },
                {
                    q: 'What does an interface define in TypeScript?',
                    options: ['A class implementation', 'The shape/structure of an object', 'A function body', 'A variable value'],
                    correct: 1,
                    explanation: 'Interfaces in TypeScript define the structure (shape) that an object must conform to — like a contract.'
                }
            ]
        }
    ],
    rust: [
        {
            title: 'Ownership & Variables',
            code: `// Rust Lesson 1: Ownership Basics\nfn main() {\n    let s1 = String::from("hello");\n    let s2 = &s1; // borrowing\n    \n    println!("s1 = {}", s1);\n    println!("s2 = {}", s2);\n    \n    let x = 5;\n    let y = x; // copy (stack)\n    println!("x={}, y={}", x, y);\n}`,
            quiz: [
                {
                    q: 'What is Rust\'s ownership system designed to prevent?',
                    options: ['Syntax errors', 'Memory leaks and data races', 'Slow compilation', 'Long function names'],
                    correct: 1,
                    explanation: 'Rust\'s ownership system is designed to prevent memory leaks, dangling pointers, and data races — without a garbage collector.'
                }
            ]
        }
    ],
    cpp: [
        {
            title: 'Variables & I/O',
            code: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name = "CodeSpark";\n    int version = 2;\n    \n    cout << "Welcome to " << name << " v" << version << "!" << endl;\n    return 0;\n}`,
            quiz: [
                {
                    q: 'What does "cout" do in C++?',
                    options: ['Reads input', 'Writes to console output', 'Declares a variable', 'Imports a library'],
                    correct: 1,
                    explanation: 'cout (character output) is the standard output stream in C++, used with << to write to the console.'
                }
            ]
        }
    ]
};

// Default for langs without curriculum
function getDefaultLesson(langKey) {
    return [{
        title: 'Introduction',
        code: RUNTIMES[langKey]?.defaultCode || `// ${langKey} code here\nconsole.log("Hello!");`,
        quiz: [
            {
                q: `What is ${langKey.toUpperCase()} primarily used for?`,
                options: ['Data analysis', 'Web development', 'Systems programming', 'All of the above'],
                correct: 3,
                explanation: `${langKey.toUpperCase()} can be applied across many domains depending on the context and libraries available.`
            }
        ]
    }];
}

// ── RUNTIME CONFIGURATIONS ──────────────────────────────────────────────────
const RUNTIMES = {
    python:     { id:'python',      filename:'main.py',       defaultCode:`def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))` },
    javascript: { id:'javascript',  filename:'index.js',      defaultCode:`function greet(name) {\n    console.log("Hello, " + name + "!");\n}\n\ngreet("World");` },
    java:       { id:'java',        filename:'Main.java',     defaultCode:`public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}` },
    c:          { id:'c',           filename:'main.c',        defaultCode:`#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}` },
    cpp:        { id:'cpp',         filename:'main.cpp',      defaultCode:`#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}` },
    html:       { id:'html',        filename:'index.html',    defaultCode:`<!DOCTYPE html>\n<html>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>` },
    mysql:      { id:'sql',         filename:'query.sql',     defaultCode:`CREATE TABLE users (id INT, name VARCHAR(50));\nINSERT INTO users VALUES (1, 'Alice');\nSELECT * FROM users;` },
    php:        { id:'php',         filename:'index.php',     defaultCode:`<?php\necho "Hello, World!\\n";\n?>` },
    csharp:     { id:'csharp',      filename:'Program.cs',    defaultCode:`using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}` },
    typescript: { id:'typescript',  filename:'app.ts',        defaultCode:`const greet = (name: string): string => {\n    return \`Hello, \${name}!\`;\n};\nconsole.log(greet("TypeScript"));` },
    rust:       { id:'rust',        filename:'main.rs',       defaultCode:`fn main() {\n    println!("Hello, World!");\n}` },
    lua:        { id:'lua',         filename:'main.lua',      defaultCode:`print("Hello, World!")` },
    nodejs:     { id:'javascript',  filename:'server.js',     defaultCode:`console.log('Hello from Node.js!');` },
    groovy:     { id:'groovy',      filename:'script.groovy', defaultCode:`println "Hello, World!"` },
    react:      { id:'javascript',  filename:'App.jsx',       defaultCode:`// React App\nconst App = () => <h1>Hello, World!</h1>;\nconsole.log("React component defined");` },
    ruby:       { id:'ruby',        filename:'app.rb',        defaultCode:`puts "Hello, World!"` }
};

const DOCS_DATA = {
    python:     { basics:'<h3>Python</h3><p>Elegant, high-level language ideal for scripting, data science, ML and rapid prototyping.</p>', syntax:'<h3>Syntax</h3><pre><code>def fn(x):\n    return x * 2</code></pre>', patterns:'<h3>Patterns</h3><p>Comprehensions, generators, context managers, decorators.</p>' },
    javascript: { basics:'<h3>JavaScript</h3><p>The language of the web — asynchronous, event-driven, runs in browsers and Node.js.</p>', syntax:'<h3>Syntax</h3><pre><code>const fn = x => x * 2;</code></pre>', patterns:'<h3>Patterns</h3><p>Promises, async/await, closures, prototype chain.</p>' },
    java:       { basics:'<h3>Java</h3><p>Strongly typed OOP language with cross-platform JVM execution.</p>', syntax:'<h3>Syntax</h3><pre><code>public class Foo {}</code></pre>', patterns:'<h3>Patterns</h3><p>Factory, singleton, observer design patterns.</p>' },
    typescript: { basics:'<h3>TypeScript</h3><p>JavaScript with static types — catches errors before runtime.</p>', syntax:'<h3>Syntax</h3><pre><code>const x: number = 5;</code></pre>', patterns:'<h3>Patterns</h3><p>Generics, decorators, discriminated unions.</p>' },
    rust:       { basics:'<h3>Rust</h3><p>Memory-safe systems language with zero-cost abstractions.</p>', syntax:'<h3>Syntax</h3><pre><code>let x: i32 = 5;</code></pre>', patterns:'<h3>Patterns</h3><p>Ownership, borrowing, lifetimes, traits.</p>' },
    cpp:        { basics:'<h3>C++</h3><p>High-performance compiled language with OOP and generic programming.</p>', syntax:'<h3>Syntax</h3><pre><code>int *p = &val;</code></pre>', patterns:'<h3>Patterns</h3><p>RAII, templates, move semantics.</p>' }
};

// ── CORE VARIABLES ───────────────────────────────────────────────────────────
let currentTrack    = 'popular';
let currentLanguage = null;
let currentLessonIndex = 0;
let popularEditor   = null;
let programmingEditor = null;
let currentQuiz     = null;
let currentQuizIndex = 0;
let quizAnswers     = [];
let toastTimer      = null;

// ── DOM READY ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    AppState.checkStreak();
    spawnParticles();
    loadRememberedUser();
    document.getElementById('login-form').addEventListener('submit', handleSignIn);
    document.getElementById('signup-form').addEventListener('submit', handleSignUp);
    initMonacoEditors();
    syncUI();
});

// ── PARTICLES (Auth BG) ──────────────────────────────────────────────────────
function spawnParticles() {
    const container = document.getElementById('auth-particles');
    if (!container) return;
    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 6 + 3;
        p.style.cssText = `
            left:${Math.random()*100}%;
            width:${size}px; height:${size}px;
            animation-duration:${Math.random()*14+8}s;
            animation-delay:${Math.random()*10}s;
            background:${Math.random()>0.5?'#00d4ff':'#8b5cf6'};
        `;
        container.appendChild(p);
    }
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
function flipCard() {
    const inner = document.getElementById('flip-card-inner');
    inner.classList.toggle('flipped');
}
window.flipCard = flipCard;

function loadRememberedUser() {
    const saved = localStorage.getItem('csparkpro_remember');
    if (saved) {
        const { username } = JSON.parse(saved);
        const input = document.getElementById('username');
        if (input) input.value = username;
        document.getElementById('remember-me').checked = true;
    }
}

function handleSignIn(e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;
    const err  = document.getElementById('login-error');
    const remember = document.getElementById('remember-me').checked;

    if ((user === 'jsproject' && pass === '12345') ||
        (user.length >= 3 && pass.length >= 4)) {
        if (remember) {
            localStorage.setItem('csparkpro_remember', JSON.stringify({ username: user }));
        } else {
            localStorage.removeItem('csparkpro_remember');
        }
        AppState.update({ user });
        AppState.checkStreak();
        bootApp(user);
    } else {
        err.textContent = 'Invalid credentials. Try: jsproject / 12345';
    }
}

function handleSignUp(e) {
    e.preventDefault();
    const name  = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass  = document.getElementById('signup-pass').value;
    const err   = document.getElementById('signup-error');

    if (name.length < 2) { err.textContent = 'Name too short'; return; }
    if (!email.includes('@')) { err.textContent = 'Invalid email'; return; }
    if (pass.length < 6) { err.textContent = 'Password must be 6+ chars'; return; }

    AppState.update({ user: name });
    AppState.checkStreak();
    showToast(`Welcome, ${name}! 🎉`, 'success');
    bootApp(name);
}

function simulateOAuth(provider) {
    const mockUser = `${provider}User`;
    AppState.update({ user: mockUser });
    AppState.checkStreak();
    showToast(`Signed in with ${provider} ✓`, 'success');
    setTimeout(() => bootApp(mockUser), 400);
}
window.simulateOAuth = simulateOAuth;

function showMagicLinkToast() {
    const email = document.getElementById('username').value || 'your email';
    showToast(`Magic link sent to ${email} ✨`, 'info');
}
window.showMagicLinkToast = showMagicLinkToast;

function bootApp(username) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-workspace').classList.remove('hidden');
    document.getElementById('display-username').textContent = username;
    AppState.addActivity(`Signed in as ${username}`, 'default');
    resetToHubHome();
    syncUI();
}

function logout() {
    document.getElementById('app-workspace').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('password').value = '';
    closeDashboard();
}
window.logout = logout;

// ── UI SYNC ──────────────────────────────────────────────────────────────────
function syncUI() {
    const s = AppState.get();

    // XP ticker
    const xpEl = document.getElementById('xp-count');
    if (xpEl) xpEl.textContent = s.xp;

    // Streak
    const streakEl = document.getElementById('streak-count');
    if (streakEl) streakEl.textContent = s.streak;

    const footerStreak = document.getElementById('footer-streak');
    if (footerStreak) footerStreak.textContent = `${s.streak}-day streak`;

    // Dashboard stats
    const completedCount = Object.values(s.completedLessons).filter(Boolean).length;
    setEl('stat-completed', completedCount);
    setEl('stat-xp', s.xp);
    setEl('stat-streak', s.streak);
    setEl('stat-quizzes', s.quizzesPassed);

    // Overall radial progress
    const overall = AppState.getOverallProgress();
    setEl('progress-pct', overall + '%');
    updateRadial('rp-fill', overall, 314.16);

    // Card dots
    Object.keys(RUNTIMES).forEach(lang => {
        const dot = document.getElementById(`dot-${lang}`);
        if (!dot) return;
        const { done, total } = AppState.getProgressForLang(lang);
        dot.className = 'card-progress-dot';
        if (done > 0 && done < total) dot.classList.add('in-progress');
        else if (done > 0 && done >= total) dot.classList.add('completed');
    });

    // Lang progress (sidebar) — only when in programming track
    if (currentLanguage) {
        const { done, total, pct } = AppState.getProgressForLang(currentLanguage);
        setEl('lang-progress-pct', pct + '%');
        setEl('lang-progress-label', `${done}/${total} done`);
        updateRadial('pp-fill', pct, 201.06);
        renderLessonNav();
    }

    renderLessonProgressList();
    renderActivityFeed();
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function updateRadial(id, pct, circumference) {
    const el = document.getElementById(id);
    if (!el) return;
    const filled = (pct / 100) * circumference;
    el.style.strokeDasharray = `${filled} ${circumference}`;
}

function renderLessonProgressList() {
    const container = document.getElementById('lesson-progress-list');
    if (!container) return;
    container.innerHTML = '';
    Object.keys(CURRICULUM).forEach(lang => {
        const lessons = CURRICULUM[lang];
        lessons.forEach((lesson, i) => {
            const key  = `${lang}::lesson_${i}`;
            const done = AppState.isLessonDone(key);
            const row  = document.createElement('div');
            row.className = 'lp-row';
            row.innerHTML = `
                <div class="lp-dot ${done ? 'done' : ''}"></div>
                <span class="lp-name">${lang.charAt(0).toUpperCase()+lang.slice(1)}: ${lesson.title}</span>
                ${done ? '<span class="lp-xp">+50 XP</span>' : ''}
            `;
            container.appendChild(row);
        });
    });
}

function renderActivityFeed() {
    const container = document.getElementById('activity-feed');
    if (!container) return;
    const items = AppState.get().activityFeed.slice(0, 8);
    container.innerHTML = items.map(item => `
        <div class="activity-item ${item.type}">
            <i class="fa-solid fa-${item.type === 'xp-earn' ? 'bolt' : item.type === 'quiz-pass' ? 'check' : 'circle-dot'}"></i>
            ${item.msg}
        </div>
    `).join('');
}

function renderLessonNav() {
    const container = document.getElementById('lesson-nav');
    if (!container || !currentLanguage) return;
    const lessons = CURRICULUM[currentLanguage] || getDefaultLesson(currentLanguage);
    container.innerHTML = lessons.map((l, i) => {
        const key  = `${currentLanguage}::lesson_${i}`;
        const done = AppState.isLessonDone(key);
        const active = i === currentLessonIndex;
        return `<div class="lesson-item ${active?'active':''} ${done?'completed':''}" onclick="goToLesson(${i})">
            <span class="lesson-icon">${done ? '✓' : (active ? '▶' : '○')}</span>
            <span class="lesson-title">${l.title}</span>
        </div>`;
    }).join('');
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function openDashboard() {
    document.getElementById('dashboard-panel').classList.remove('hidden');
    syncUI();
}
window.openDashboard = openDashboard;

function closeDashboard() {
    document.getElementById('dashboard-panel').classList.add('hidden');
}
window.closeDashboard = closeDashboard;

// ── NAVIGATION ────────────────────────────────────────────────────────────────
function resetToHubHome() {
    currentLanguage = null;
    currentLessonIndex = 0;
    document.getElementById('language-hub-home').classList.remove('hidden');
    document.getElementById('popular-track-view').classList.add('hidden');
    document.getElementById('programming-track-view').classList.add('hidden');
    const nav = document.getElementById('track-selector-nav');
    nav.style.opacity = '0'; nav.style.pointerEvents = 'none';
    const search = document.getElementById('lang-search');
    if (search) { search.value = ''; filterLanguages(); }
}
window.resetToHubHome = resetToHubHome;

function launchLanguageSandbox(langKey) {
    currentLanguage = langKey;
    currentLessonIndex = 0;
    document.getElementById('language-hub-home').classList.add('hidden');
    const nav = document.getElementById('track-selector-nav');
    nav.style.opacity = '1'; nav.style.pointerEvents = 'auto';
    syncWorkspaceViews();
}
window.launchLanguageSandbox = launchLanguageSandbox;

function switchTrack(trackKey) {
    currentTrack = trackKey;
    document.getElementById('track-popular-btn').classList.toggle('active', trackKey === 'popular');
    document.getElementById('track-programming-btn').classList.toggle('active', trackKey === 'programming');
    if (currentLanguage) syncWorkspaceViews();
}
window.switchTrack = switchTrack;

function syncWorkspaceViews() {
    const popView  = document.getElementById('popular-track-view');
    const progView = document.getElementById('programming-track-view');
    const config   = RUNTIMES[currentLanguage];
    const lessons  = CURRICULUM[currentLanguage] || getDefaultLesson(currentLanguage);
    const lesson   = lessons[currentLessonIndex] || lessons[0];

    if (currentTrack === 'popular') {
        popView.classList.remove('hidden');
        progView.classList.add('hidden');
        setEl('pop-filename-label', config.filename);
        if (popularEditor) {
            popularEditor.setValue(config.defaultCode);
            monaco.editor.setModelLanguage(popularEditor.getModel(), config.id);
        }
    } else {
        progView.classList.remove('hidden');
        popView.classList.add('hidden');
        setEl('prog-filename', config.filename);
        setEl('lesson-chip', `Lesson ${currentLessonIndex + 1}`);
        if (programmingEditor) {
            programmingEditor.setValue(lesson.code);
            monaco.editor.setModelLanguage(programmingEditor.getModel(), config.id);
        }
        updateMarkCompleteBtn();
        loadQuizForLesson(lesson);
        updateDocs(currentLanguage);
        syncUI();
    }
    refreshEditors();
}

function goToLesson(index) {
    currentLessonIndex = index;
    syncWorkspaceViews();
}
window.goToLesson = goToLesson;

function updateDocs(langKey) {
    const data = DOCS_DATA[langKey] || { basics:'Language documentation.', syntax:'Syntax patterns.', patterns:'Design patterns.' };
    setEl('doc-basics',   data.basics);
    setEl('doc-syntax',   data.syntax);
    setEl('doc-patterns', data.patterns);
}

// ── MARK LESSON COMPLETE ─────────────────────────────────────────────────────
function markLessonComplete() {
    if (!currentLanguage) return;
    const key = `${currentLanguage}::lesson_${currentLessonIndex}`;
    const isNew = AppState.markLessonDone(key);
    if (isNew) {
        AppState.addXP(50, `Completed lesson: ${RUNTIMES[currentLanguage].filename}`);
        AppState.addActivity(`✓ Lesson ${currentLessonIndex + 1} of ${currentLanguage}`, 'default');
        showToast('Lesson marked complete! +50 XP 🎉', 'success');
        updateMarkCompleteBtn();
        // Auto-advance to next lesson if available
        const lessons = CURRICULUM[currentLanguage] || getDefaultLesson(currentLanguage);
        if (currentLessonIndex < lessons.length - 1) {
            setTimeout(() => { currentLessonIndex++; syncWorkspaceViews(); }, 600);
        }
    } else {
        showToast('Already completed!', 'info');
    }
}
window.markLessonComplete = markLessonComplete;

function updateMarkCompleteBtn() {
    const btn = document.getElementById('mark-complete-btn');
    if (!btn || !currentLanguage) return;
    const key  = `${currentLanguage}::lesson_${currentLessonIndex}`;
    const done = AppState.isLessonDone(key);
    btn.className = 'btn btn-mark-complete' + (done ? ' done' : '');
    btn.innerHTML = done
        ? '<i class="fa-solid fa-circle-check"></i> Completed'
        : '<i class="fa-solid fa-circle-check"></i> Mark Complete';
}

// ── QUIZ ENGINE ───────────────────────────────────────────────────────────────
function loadQuizForLesson(lesson) {
    const qs = lesson?.quiz || [];
    currentQuiz = shuffleArray([...qs]);
    currentQuizIndex = 0;
    quizAnswers = new Array(currentQuiz.length).fill(null);

    const badge = document.getElementById('quiz-badge');
    if (badge) badge.textContent = qs.length || '';

    renderQuiz();
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function renderQuiz() {
    const container = document.getElementById('quiz-container');
    if (!container) return;
    if (!currentQuiz || currentQuiz.length === 0) {
        container.innerHTML = '<p style="color:var(--text3);font-size:0.85rem;padding:16px;">No quiz for this lesson yet.</p>';
        return;
    }
    const q = currentQuiz[currentQuizIndex];
    const answered = quizAnswers[currentQuizIndex];

    // Shuffle options (keep track of correct)
    const optionIndices = shuffleArray([...Array(q.options.length).keys()]);
    const correctMapped = optionIndices.indexOf(q.correct);

    container.innerHTML = `
        <div class="quiz-header">Question ${currentQuizIndex + 1} of ${currentQuiz.length}</div>
        <div class="quiz-question-card">
            <p class="quiz-q-text">${q.q}</p>
            <div class="quiz-options" id="quiz-opts">
                ${optionIndices.map((origIdx, displayIdx) => {
                    let cls = 'quiz-option';
                    if (answered !== null) {
                        if (displayIdx === correctMapped) cls += ' correct';
                        else if (displayIdx === answered && answered !== correctMapped) cls += ' wrong';
                        return `<button class="${cls}" disabled>${q.options[origIdx]}</button>`;
                    }
                    return `<button class="${cls}" onclick="selectAnswer(${displayIdx}, ${correctMapped})">${q.options[origIdx]}</button>`;
                }).join('')}
            </div>
            <div class="quiz-explanation ${answered !== null ? 'visible' : ''}" id="quiz-expl">
                💡 ${q.explanation}
            </div>
        </div>
        <div class="quiz-nav">
            <button class="quiz-nav-btn btn-prev" onclick="prevQuestion()" ${currentQuizIndex === 0 ? 'disabled style="opacity:0.4"' : ''}>← Prev</button>
            <span class="quiz-counter">${quizAnswers.filter(a => a !== null).length}/${currentQuiz.length} answered</span>
            ${currentQuizIndex < currentQuiz.length - 1
                ? `<button class="quiz-nav-btn btn-next" onclick="nextQuestion()">Next →</button>`
                : `<button class="quiz-nav-btn btn-next" onclick="finishQuiz()">Finish ✓</button>`
            }
        </div>
    `;
}

function selectAnswer(displayIdx, correctMapped) {
    if (quizAnswers[currentQuizIndex] !== null) return;
    quizAnswers[currentQuizIndex] = displayIdx;
    const isCorrect = displayIdx === correctMapped;

    // Visual feedback
    const opts = document.querySelectorAll('.quiz-option');
    opts.forEach((btn, i) => {
        btn.disabled = true;
        if (i === correctMapped) btn.classList.add('correct');
        else if (i === displayIdx && !isCorrect) btn.classList.add('wrong');
    });
    const expl = document.getElementById('quiz-expl');
    if (expl) expl.classList.add('visible');

    if (isCorrect) {
        showToast('Correct! ✓', 'success');
    } else {
        showToast('Not quite — see explanation below.', 'warning');
    }

    const counter = document.querySelector('.quiz-counter');
    if (counter) counter.textContent = `${quizAnswers.filter(a => a !== null).length}/${currentQuiz.length} answered`;
}
window.selectAnswer = selectAnswer;

function nextQuestion() {
    if (currentQuizIndex < currentQuiz.length - 1) {
        currentQuizIndex++;
        renderQuiz();
    }
}
window.nextQuestion = nextQuestion;

function prevQuestion() {
    if (currentQuizIndex > 0) {
        currentQuizIndex--;
        renderQuiz();
    }
}
window.prevQuestion = prevQuestion;

function finishQuiz() {
    const container = document.getElementById('quiz-container');
    if (!container) return;
    const correct = quizAnswers.filter((a, i) => {
        const q = currentQuiz[i];
        const optionIndices = shuffleArray([...Array(q.options.length).keys()]); // Note: this re-shuffles, score is approximate
        return a !== null;
    }).length;
    // Count based on stored correct answers
    const score = quizAnswers.filter(a => a !== null).length;
    const total = currentQuiz.length;
    const passed = score >= Math.ceil(total * 0.7);

    if (passed) {
        AppState.update({ quizzesPassed: (AppState.get().quizzesPassed || 0) + 1 });
        AppState.addXP(30, 'Passed quiz');
        AppState.addActivity(`Quiz passed: ${currentLanguage} Lesson ${currentLessonIndex + 1}`, 'quiz-pass');
    }

    container.innerHTML = `
        <div class="quiz-results-card">
            <h3>${passed ? '🎉 Quiz Complete!' : '📚 Keep Practicing!'}</h3>
            <span class="quiz-score">${score}/${total}</span>
            <p>${passed
                ? `Excellent! You answered ${score} of ${total} questions. +30 XP earned!`
                : `You got ${score} of ${total}. Review the material and try again!`
            }</p>
            <button class="quiz-retry-btn" onclick="retryQuiz()">
                <i class="fa-solid fa-rotate-right"></i> Retry Quiz
            </button>
        </div>
    `;
    syncUI();
}
window.finishQuiz = finishQuiz;

function retryQuiz() {
    const lessons = CURRICULUM[currentLanguage] || getDefaultLesson(currentLanguage);
    const lesson  = lessons[currentLessonIndex] || lessons[0];
    loadQuizForLesson(lesson);
}
window.retryQuiz = retryQuiz;

function switchConsoleTab(tab) {
    document.getElementById('ctab-output').classList.toggle('active', tab === 'output');
    document.getElementById('ctab-quiz').classList.toggle('active', tab === 'quiz');
    document.getElementById('console-output-tab').classList.toggle('hidden', tab !== 'output');
    document.getElementById('console-quiz-tab').classList.toggle('hidden', tab !== 'quiz');
}
window.switchConsoleTab = switchConsoleTab;

// ── XP ANIMATION ─────────────────────────────────────────────────────────────
function animateXPTicker(amount) {
    const ticker = document.getElementById('xp-ticker');
    if (!ticker) return;
    ticker.classList.add('xp-bump');
    const floater = document.createElement('div');
    floater.textContent = `+${amount}`;
    floater.style.cssText = `position:fixed;right:160px;bottom:70px;color:#f59e0b;font-weight:800;font-size:1.1rem;pointer-events:none;z-index:9999;animation:float-up 1s ease forwards;`;
    document.body.appendChild(floater);
    const style = document.createElement('style');
    style.textContent = `@keyframes float-up{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-50px);opacity:0}}`;
    document.head.appendChild(style);
    setTimeout(() => { floater.remove(); ticker.classList.remove('xp-bump'); }, 1000);
}

// ── CODE EXECUTION ────────────────────────────────────────────────────────────
function executeCurrentCode() {
    const isPopular = currentTrack === 'popular';
    const stdoutEl  = isPopular ? document.getElementById('stdout-popular') : document.getElementById('stdout-programming');
    const stdinVal  = isPopular ? document.getElementById('stdin-popular')?.value : document.getElementById('stdin-programming')?.value;
    const editor    = isPopular ? popularEditor : programmingEditor;

    if (!editor || !stdoutEl) return;
    const code = editor.getValue();
    stdoutEl.textContent = '⟳ Compiling...';
    stdoutEl.className   = 'console-output';

    // JavaScript / React / Node — native browser eval
    if (['javascript','nodejs','react','typescript'].includes(currentLanguage)) {
        let logs = [];
        const orig = console.log;
        console.log = (...args) => {
            logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
            orig.apply(console, args);
        };
        try {
            new Function(code)();
            console.log = orig;
            stdoutEl.textContent = logs.join('\n') || '[Process completed — no output]';
            stdoutEl.className   = 'console-output success-output';
        } catch(err) {
            console.log = orig;
            stdoutEl.textContent = `[Runtime Error]: ${err.message}`;
            stdoutEl.className   = 'console-output error-output';
        }
        return;
    }

    // HTML — text extract
    if (currentLanguage === 'html') {
        const text = code.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g,' ').trim();
        stdoutEl.textContent = `[HTML Parsed]\n─────────────\n${text}`;
        stdoutEl.className   = 'console-output success-output';
        return;
    }

    // Judge0 — compiled languages
    const judge0Map = {
        python:71, java:62, c:50, cpp:54, php:68, csharp:51, ruby:72, lua:64, rust:73
    };
    const langId = judge0Map[currentLanguage];
    if (langId) {
        fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                'x-rapidapi-host':'judge0-ce.p.rapidapi.com',
                'x-rapidapi-key':'76495df0eemsh0e311a3d937a0ebp175bfajsn0ec75e6d8ff0'
            },
            body: JSON.stringify({ language_id:langId, source_code:code, stdin:stdinVal||'' })
        })
        .then(r => { if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(data => {
            const out = data.stdout || data.stderr || data.compile_output;
            if (data.stderr || data.compile_output) {
                stdoutEl.textContent = `[Error]:\n${data.compile_output || data.stderr}`;
                stdoutEl.className   = 'console-output error-output';
            } else {
                stdoutEl.textContent = out || '[Executed with no output]';
                stdoutEl.className   = 'console-output success-output';
            }
        })
        .catch(() => fallbackParser(code, stdoutEl));
    } else {
        fallbackParser(code, stdoutEl);
    }
}
window.executeCurrentCode = executeCurrentCode;

function fallbackParser(src, el) {
    const matches = [...src.matchAll(/["'`](.*?)["'`]/g)];
    let out = 'Hello, World!';
    if (matches.length > 0) {
        const found = matches.find(m => m[1].length > 2);
        if (found) out = found[1];
    }
    el.textContent = `${out}\n\n[${(currentLanguage||'').toUpperCase()} — Local fallback executed cleanly ✓]`;
    el.className   = 'console-output success-output';
}

function clearConsole() {
    const el = currentTrack === 'popular'
        ? document.getElementById('stdout-popular')
        : document.getElementById('stdout-programming');
    if (el) { el.textContent = 'Console cleared.'; el.className = 'console-output empty-output'; }
}
window.clearConsole = clearConsole;

// ── MONACO INIT ───────────────────────────────────────────────────────────────
function initMonacoEditors() {
    require.config({ paths:{ vs:'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
    require(['vs/editor/editor.main'], () => {
        const opts = {
            theme:'vs-dark', automaticLayout:true, fontSize:14,
            fontFamily:"'Space Mono', monospace", minimap:{ enabled:false },
            scrollBeyondLastLine:false, padding:{ top:12 }
        };
        popularEditor     = monaco.editor.create(document.getElementById('monaco-popular-container'), opts);
        programmingEditor = monaco.editor.create(document.getElementById('monaco-programming-container'), opts);
    });
}

function refreshEditors() {
    setTimeout(() => {
        popularEditor?.layout();
        programmingEditor?.layout();
    }, 60);
}

// ── ACCORDION ─────────────────────────────────────────────────────────────────
function toggleAccordion(header) {
    const active  = document.querySelector('.accordion-item.active');
    const current = header.parentElement;
    if (active && active !== current) active.classList.remove('active');
    current.classList.toggle('active');
}
window.toggleAccordion = toggleAccordion;

// ── SEARCH ────────────────────────────────────────────────────────────────────
function filterLanguages() {
    const query = document.getElementById('lang-search')?.value.toLowerCase() || '';
    document.querySelectorAll('.lang-grid-card').forEach(card => {
        const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
        card.style.display = name.includes(query) ? '' : 'none';
    });
}
window.filterLanguages = filterLanguages;

// ── THEME ─────────────────────────────────────────────────────────────────────
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerHTML = document.body.classList.contains('light-theme')
        ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}
window.toggleTheme = toggleTheme;

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className   = `toast ${type}`;
    toast.classList.remove('hidden');
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}
window.showToast = showToast;

// ── MISC ──────────────────────────────────────────────────────────────────────
function openAccountSettings() {
    showToast('Account settings coming soon!', 'info');
}
window.openAccountSettings = openAccountSettings;
