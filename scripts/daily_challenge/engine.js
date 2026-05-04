/**
 * A1 Online TET - Daily Challenge Engine (Desktop Edition)
 * 
 * Schedule:
 *   Mon: Tamil, Tue: English, Wed: Maths, Thu: Science, Fri: Social, Sat: Psychology, Sun: Mock Test
 * 
 * Actions:
 *   notes  → 6AM:  Study notes open
 *   open   → 8PM:  Exam opens
 *   close  → 10PM: Disabled
 */

const fs    = require('fs');
const path  = require('path');

const TRACKER_FILE  = path.join(__dirname, 'tracker.json');

const DAY_SUBJECT = {
  Mon: { subject: 'tamil',      isTest: false },
  Tue: { subject: 'english',    isTest: false },
  Wed: { subject: 'maths',      isTest: false },
  Thu: { subject: 'science',    isTest: false },
  Fri: { subject: 'social',     isTest: false },
  Sat: { subject: 'psychology', isTest: false },
  Sun: { subject: 'mocktest',   isTest: true  },
};

const CLASS_ORDER = ['5', '4', '3', '2', '1'];

async function loadTracker() {
  if (fs.existsSync(TRACKER_FILE)) {
    return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
  }
  return { tamil: 0, english: 0, maths: 0, science: 0, social: 0, psychology: 0, mocktest: 0 };
}

function saveTracker(tracker) {
  fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2));
}

// ─── File helpers ──────────────────────────────────────────────────
function getLessonFiles(subject) {
  const base = path.join(__dirname, '../../json-db/lessons', subject);
  if (!fs.existsSync(base)) return [];
  
  let all = [];
  
  // Handle 'all' folder (flat subjects like psychology)
  const allDir = path.join(base, 'all');
  if (fs.existsSync(allDir)) {
      const files = fs.readdirSync(allDir).filter(f => f.endsWith('.json')).sort();
      all.push(...files.map(f => path.join(allDir, f)));
  }

  // Reordered: Term-wise, then Grade-wise (5 down to 1)
  for (const term of ['Term 1', 'Term 2', 'Term 3']) {
    for (const grade of CLASS_ORDER) {
      const gp = path.join(base, grade);
      if (fs.existsSync(gp)) {
        const tp = path.join(gp, term);
        if (fs.existsSync(tp)) {
          const files = fs.readdirSync(tp).filter(f => f.endsWith('.json')).sort();
          all.push(...files.map(f => path.join(tp, f)));
        }
      }
    }
  }
  return all;
}

function getTestFile(subject, idx) {
  const base = path.join(__dirname, `../../json-db/lessons/${subject}/all`);
  if (!fs.existsSync(base)) return null;
  const files = fs.readdirSync(base).filter(f => f.endsWith('.json')).sort();
  const found = files.find(f => { 
    const m = f.match(/Lesson_(\d+)\.json$/i); 
    return m && parseInt(m[1]) === idx; 
  });
  return found ? path.join(base, found) : (files[idx-1] || files[0]);
}

function extractQuiz(data, notesMode = false) {
  const raw = Array.isArray(data.quiz) ? data.quiz : (data.quiz?.questions || []);
  return raw.map(q => ({
    q:         q.q       || q.question    || '',
    options:   q.options || [],
    a:         q.a       !== undefined ? q.a : (q.answer !== undefined ? q.answer : 0),
    ex:        q.ex      || q.explanation || '',
    ...(notesMode ? { notesMode: true } : {})
  })).filter(q => q.q && q.options.length > 0);
}

function getTitle(data, file) {
  return data.lesson_meta?.title || data.title || path.basename(file, '.json');
}

// ─── MAIN ──────────────────────────────────────────────────────────
async function run() {
  const action  = process.argv[2] || 'open';
  const day     = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const subject = DAY_SUBJECT[day].subject;
  const isTest  = DAY_SUBJECT[day].isTest;

  console.log(`🚀 Mode: ${action.toUpperCase()} | Day: ${day} | Subject: ${subject}`);

  const tracker = await loadTracker();
  let payload = {};

  if (isTest) {
    let testIdx = tracker[subject] || 1;
    const filePath = getTestFile(subject, testIdx);
    if (!filePath) { console.error("❌ No mock test found"); process.exit(1); }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const quiz = extractQuiz(data, action === 'notes');

    payload = {
      unit: 'Daily Challenge', subject: subject.toUpperCase(),
      title: action === 'notes' ? `${getTitle(data, filePath)} - குறிப்புகள்` : getTitle(data, filePath),
      status: action === 'notes' ? 'notes' : 'open',
      lastUpdated: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      activeSubject: subject,
      activeGrade: 'all',
      activeGrades: ['all'],
      activeTerms: ['1'],
      activeTitles: [getTitle(data, filePath)],
      activeFiles: [path.basename(filePath, '.json')],
      quiz: quiz.map(q => ({ ...q, lesson: path.basename(filePath, '.json') })),
      sections: data.sections || []
    };

    if (action === 'open') {
      tracker[subject] = testIdx;
      saveTracker(tracker);
    }
  } else {
    const filesList = getLessonFiles(subject);
    if (!filesList.length) { console.error(`❌ No lesson files for ${subject}`); process.exit(1); }

    let currentIdx = tracker[subject] || 0;
    if (currentIdx >= filesList.length) { currentIdx = 0; tracker[subject] = 0; }

    const selected = filesList.slice(currentIdx, currentIdx + 2);
    const titles = [];
    const fileNames = [];
    const grades = [];
    const terms = [];
    let allQuiz = [];
    let allSections = [];

    selected.forEach(f => {
      const data = JSON.parse(fs.readFileSync(f, 'utf8'));
      const t = getTitle(data, f);
      const fn = path.basename(f, '.json');
      
      titles.push(t);
      fileNames.push(fn);
      
      const parts = f.split(path.sep);
      const grade = parts[parts.length - 3] || '5';
      const termPart = parts[parts.length - 2] || 'Term 1';
      const term = termPart.replace('Term ', '');
      
      grades.push(grade);
      terms.push(term);
      
      allQuiz.push(...extractQuiz(data, action === 'notes').map(q => ({ ...q, lesson: fn })));
      if (data.sections) allSections.push(...data.sections);
    });

    payload = {
      unit: 'Daily Challenge', subject: subject.toUpperCase(),
      title: action === 'notes' 
        ? `இன்றைய குறிப்புகள்: ${titles.join(' & ')}`
        : `இன்றைய தேர்வு: ${titles.join(' & ')}`,
      status: action === 'notes' ? 'notes' : 'open',
      lastUpdated: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      activeSubject: subject,
      activeGrade: grades[0],
      activeGrades: grades,
      activeTerms: terms,
      activeTitles: titles,
      activeFiles: fileNames,
      quiz: allQuiz,
      sections: allSections
    };

    if (action === 'open') {
      tracker[subject] = currentIdx + 2;
      saveTracker(tracker);
    }
  }

  console.log(`📊 Questions: ${payload.quiz.length}`);
  
  const localPath = path.join(__dirname, '../../1.json');
  fs.writeFileSync(localPath, JSON.stringify(payload, null, 2));
  console.log(`💾 Saved locally to 1.json`);

  console.log(`\n✅ Done! ${action} | ${subject}`);
}

run();
