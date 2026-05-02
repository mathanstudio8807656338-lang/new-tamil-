const fs = require('fs');
const path = require('path');

const dailyPath = path.join(__dirname, '../../1.json');
const daily = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));

// Filter the quiz array to keep ONLY valid questions
const originalCount = daily.quiz.length;
daily.quiz = daily.quiz.filter(q => q && (q.q || q.question) && q.options);
const newCount = daily.quiz.length;

console.log(`Cleaning 1.json: Removed ${originalCount - newCount} invalid entries from the quiz array.`);

fs.writeFileSync(dailyPath, JSON.stringify(daily, null, 2));
console.log('Successfully repaired 1.json!');
