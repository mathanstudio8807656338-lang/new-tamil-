const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const oneJsonPath = path.join(__dirname, '1.json');
const mockTestPath = path.join(__dirname, 'json-db/lessons/mocktest/all/Lesson_2.json');
const englishPath = path.join(__dirname, 'json-db/lessons/english/5/Term 1/Lesson_1.json');

// 1. Reset 1.json to standard Monday Tamil (2 lessons)
execSync('node scripts/daily_challenge/engine.js notes');

const oneJson = JSON.parse(fs.readFileSync(oneJsonPath, 'utf8'));
const mockTestData = JSON.parse(fs.readFileSync(mockTestPath, 'utf8'));
const englishData = JSON.parse(fs.readFileSync(englishPath, 'utf8'));

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

// 2. Add Mock Test Lesson
oneJson.activeTitles.push(getTitle(mockTestData, "மாதிரித்தேர்வு 3"));
oneJson.activeFiles.push("Lesson_2");
oneJson.activeGrades.push("all");
if (!oneJson.activeSubjects) {
    oneJson.activeSubjects = oneJson.activeFiles.map(() => oneJson.activeSubject);
}
oneJson.activeSubjects[2] = "mocktest";
oneJson.quiz = oneJson.quiz.concat(extractQuiz(mockTestData, "Lesson_2_MT"));

// 3. Add English Lesson (3rd Subject)
oneJson.activeTitles.push(getTitle(englishData, "English Lesson 1"));
oneJson.activeFiles.push("Lesson_1");
oneJson.activeGrades.push("5");
oneJson.activeSubjects.push("english");
oneJson.quiz = oneJson.quiz.concat(extractQuiz(englishData, "Lesson_1_EN"));

// 4. Update overall title
oneJson.title = "இன்றைய பாடங்கள்: " + oneJson.activeTitles.join(' & ');

fs.writeFileSync(oneJsonPath, JSON.stringify(oneJson, null, 2));
console.log("✅ 1.json updated with 3 subjects (Tamil, Mock Test, English).");
