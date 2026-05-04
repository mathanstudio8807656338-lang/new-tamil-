const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const oneJsonPath = path.join(__dirname, '1.json');
const mockTestPath = path.join(__dirname, 'json-db/lessons/mocktest/all/Lesson_4.json');

// 1. Run the restored engine.js to get base Tamil lessons with correct metadata (terms, grades)
execSync('node scripts/daily_challenge/engine.js notes');

const oneJson = JSON.parse(fs.readFileSync(oneJsonPath, 'utf8'));
const mockTestData = JSON.parse(fs.readFileSync(mockTestPath, 'utf8'));

function extractQuiz(data, lessonId) {
    const raw = Array.isArray(data.quiz) ? data.quiz : (data.quiz?.questions || []);
    return raw.map(q => ({
        q: q.question || q.q || '',
        options: q.options || [],
        a: q.answer !== undefined ? q.answer : (q.a !== undefined ? q.a : 0),
        ex: q.explanation || q.ex || '',
        notesMode: true,
        lesson: lessonId
    }));
}

function getTitle(data, defaultTitle) {
    return data.lesson_meta?.title || data.title || defaultTitle;
}

// 2. Inject the Mock Test as the 3rd lesson (removing any leftovers from before)
// engine.js generates 2 lessons by default.
// We want exactly 3.
oneJson.activeTitles = oneJson.activeTitles.slice(0, 2);
oneJson.activeFiles = oneJson.activeFiles.slice(0, 2);
oneJson.activeGrades = oneJson.activeGrades.slice(0, 2);
oneJson.activeTerms = oneJson.activeTerms.slice(0, 2);
oneJson.activeSubjects = oneJson.activeFiles.map(() => "tamil");

// Add Mock Test (மாதிரித்தேர்வு 2)
oneJson.activeTitles.push(getTitle(mockTestData, "மாதிரித்தேர்வு 2"));
oneJson.activeFiles.push("Lesson_4");
oneJson.activeGrades.push("all");
oneJson.activeTerms.push("1");
oneJson.activeSubjects.push("mocktest");

// Add Quiz questions for Mock Test
oneJson.quiz = oneJson.quiz.concat(extractQuiz(mockTestData, "Lesson_4_MT"));

// 3. Update overall title
oneJson.title = "இன்றைய பாடங்கள்: " + oneJson.activeTitles.join(' & ');

// 4. Final Save
fs.writeFileSync(oneJsonPath, JSON.stringify(oneJson, null, 2));
console.log("✅ 1.json updated with 3 lessons (2 Tamil Term 1 + 1 Mock Test Model 2).");
