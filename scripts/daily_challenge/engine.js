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
  // Try to match Lesson_X.json
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
  let   dayStr  = new Date().toLocaleString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' });
  if (process.env.TEST_DAY) dayStr = process.env.TEST_DAY;

  const ist     = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split(',')[0];
  console.log(`\n🕐 IST: ${ist} | Day: ${dayStr} | Action: ${action}\n`);

  if (action === 'close') {
    const closedPayload = {
      unit: 'Daily Challenge', subject: 'Closed',
      title: 'இன்றைய அமர்வு முடிந்தது',
      status: 'closed',
      message: 'நாளை காலை 6 மணிக்கு மீண்டும் திறக்கும்.',
      quiz: []
    };
    
    // Save locally
    const localPath = path.join(__dirname, '../../1.json');
    fs.writeFileSync(localPath, JSON.stringify(closedPayload, null, 2));
    console.log(`💾 Saved local close status`);

    return;
  }

  const tracker   = await loadTracker();
  const dayConfig = DAY_SUBJECT[dayStr];
  if (!dayConfig) { console.error(`❌ Unknown day: ${dayStr}`); process.exit(1); }

  const { subject, isTest } = dayConfig;
  console.log(`📚 Subject: ${subject} | IsTest: ${isTest}`);

  let payload;

  if (isTest) {
    let testIdx = (tracker[subject] || 0) + 1;
    const filePath = getTestFile(subject, testIdx);
    if (!filePath) { console.error(`❌ No test file for ${subject}`); process.exit(1); }

    console.log(`📄 Test: ${path.basename(filePath)}`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const quiz = extractQuiz(data, action === 'notes');

    payload = {
      unit: 'Daily Challenge', subject: subject.toUpperCase(),
      title: action === 'notes' ? `${getTitle(data, filePath)} - குறிப்புகள்` : getTitle(data, filePath),
      status: action === 'notes' ? 'notes' : 'open',
      lastUpdated: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      activeSubject: subject,
      activeGrade: testIdx.toString(),
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
    const files = getLessonFiles(subject);
    if (!files.length) { console.error(`❌ No lesson files for ${subject}`); process.exit(1); }

    let idx = tracker[subject] || 0;
    if (idx >= files.length) { idx = 0; tracker[subject] = 0; }

    const file1 = files[idx];
    const file2 = files[idx + 1] || files[0];
    console.log(`📄 L1: ${path.basename(file1)}\n📄 L2: ${path.basename(file2)}`);

    const getGradeFromPath = (fp) => {
      const parts = fp.split(path.sep);
      const lIdx = parts.indexOf('lessons');
      return (lIdx !== -1 && parts.length > lIdx + 2) ? parts[lIdx + 2] : '5';
    };
    const grade1 = getGradeFromPath(file1);
    const grade2 = getGradeFromPath(file2);

    const d1 = JSON.parse(fs.readFileSync(file1, 'utf8'));
    const d2 = JSON.parse(fs.readFileSync(file2, 'utf8'));
    const quiz = [
      ...extractQuiz(d1, action === 'notes').map(q => ({ ...q, lesson: path.basename(file1, '.json') })),
      ...extractQuiz(d2, action === 'notes').map(q => ({ ...q, lesson: path.basename(file2, '.json') }))
    ];

    payload = {
      unit: 'Daily Challenge', subject: subject.toUpperCase(),
      title: action === 'notes' 
        ? `இன்றைய குறிப்புகள்: ${getTitle(d1, file1)} & ${getTitle(d2, file2)}`
        : `இன்றைய தேர்வு: ${getTitle(d1, file1)} & ${getTitle(d2, file2)}`,
      status: action === 'notes' ? 'notes' : 'open',
      lastUpdated: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      activeSubject: subject,
      activeGrade: grade1, // For backward compatibility
      activeGrades: [grade1, grade2],
      activeTitles: [getTitle(d1, file1), getTitle(d2, file2)],
      activeFiles: [path.basename(file1, '.json'), path.basename(file2, '.json')],
      quiz,
      sections: [
        ...(d1.sections || []),
        ...(d2.sections || [])
      ]
    };

    if (action === 'open') {
      tracker[subject] = idx + 2;
      saveTracker(tracker);
    }
  }

  console.log(`📊 Questions: ${payload.quiz.length}`);
  
  // Save locally for dashboard/daily.html consistency
  const localPath = path.join(__dirname, '../../1.json');
  fs.writeFileSync(localPath, JSON.stringify(payload, null, 2));
  console.log(`💾 Saved locally to 1.json`);

  console.log(`\n✅ Done! ${action} | ${subject}`);
}

run().catch(err => { console.error('❌ Fatal:', err); process.exit(1); });
