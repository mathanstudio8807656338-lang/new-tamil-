const fs = require('fs');
const path = require('path');
const base = 'C:/Users/MATHAN/Desktop/MATERIAL/';
const dirs = fs.readdirSync(base);
const scienceDir = dirs.find(d => d.includes('?') || d.length === 8);
if (scienceDir) {
    const filePath = path.join(base, scienceDir, '2/1ST TERM/3.json');
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);
    console.log("Keys:", Object.keys(json));
    if (json.quiz) {
        console.log("Quiz Keys:", Object.keys(json.quiz));
        if (json.quiz.questions && json.quiz.questions.length > 0) {
            console.log("Sample Question:", JSON.stringify(json.quiz.questions[0], null, 2));
        }
    }
    if (json.lesson_meta) {
        console.log("Lesson Meta:", json.lesson_meta);
    }
} else {
    console.log("Science directory not found");
}
