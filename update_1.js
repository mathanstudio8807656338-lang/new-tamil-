const fs = require('fs');
const path = require('path');

const oneJsonPath = path.join(__dirname, '1.json');
const mockTestPath = path.join(__dirname, 'json-db/lessons/mocktest/all/Lesson_2.json');

// Reset 1.json by running engine again to be sure of clean state
const { execSync } = require('child_process');
execSync('node scripts/daily_challenge/engine.js notes');

const oneJson = JSON.parse(fs.readFileSync(oneJsonPath, 'utf8'));
const mockTestData = JSON.parse(fs.readFileSync(mockTestPath, 'utf8'));

// Normalize mock test quiz
const normalizedMockQuiz = mockTestData.quiz.map(q => ({
    q: q.question || q.q,
    options: q.options,
    a: q.answer !== undefined ? q.answer : q.a,
    ex: q.explanation || q.ex || '',
    notesMode: true,
    lesson: 'Lesson_2_MT' 
}));

// Set up per-lesson metadata
oneJson.activeTitles = [
    "தமிழின் இனிமை *",
    "வறுமையிலும் நேர்மை *",
    "மாதிரித்தேர்வு 3"
];
oneJson.activeFiles = [
    "Lesson_1",
    "Lesson_2",
    "Lesson_2"
];
oneJson.activeGrades = [
    "5",
    "5",
    "all"
];
oneJson.activeSubjects = [
    "tamil",
    "tamil",
    "mocktest"
];

// Combine quiz
// Note: engine.js already put first 2 lessons in quiz. We append the 3rd.
oneJson.quiz = oneJson.quiz.concat(normalizedMockQuiz);

// Update main title
oneJson.title = "இன்றைய குறிப்புகள்: " + oneJson.activeTitles.join(' & ');

fs.writeFileSync(oneJsonPath, JSON.stringify(oneJson, null, 2));
console.log("✅ 1.json properly updated with 3 lessons.");
