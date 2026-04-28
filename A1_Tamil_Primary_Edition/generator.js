const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const lessonsDir = path.join(__dirname, 'json-db', 'lessons', 'tamil');
const syllabusPath = path.join(__dirname, 'js', 'data', 'syllabus.js');
const lessonMapPath = path.join(__dirname, 'js', 'data', 'lessonMap.js');

const syllabusData = { "tamil": {} };
const lessonMap = { "tamil": {} };

function generate() {
    console.log("🔍 பாடங்களை ஸ்கேன் செய்கிறது...");
    const grades = ['1', '2', '3', '4', '5'];
    
    grades.forEach(grade => {
        const gradePath = path.join(lessonsDir, grade);
        if (!fs.existsSync(gradePath)) return;
        syllabusData.tamil[grade] = [];
        const terms = ['Term 1', 'Term 2', 'Term 3'];
        
        terms.forEach((termName, index) => {
            const termPath = path.join(gradePath, termName);
            if (!fs.existsSync(termPath)) return;
            const termData = { "term": index + 1, "units": [{ "title": termName, "topics": [] }] };
            const files = fs.readdirSync(termPath).filter(f => f.endsWith('.json'));
            
            files.forEach(file => {
                const content = JSON.parse(fs.readFileSync(path.join(termPath, file), 'utf8'));
                const title = content.lesson_meta?.title || content.title || file.replace('.json', '');
                const code = file.replace('.json', '');
                termData.units[0].topics.push({ "title": title, "isUpdated": true, "code": code });
                const mapEntry = { "local": true, "filename": code, "grade": grade, "term": index + 1 };
                lessonMap.tamil[title] = mapEntry;
                lessonMap.tamil[code] = mapEntry;
            });
            if (termData.units[0].topics.length > 0) syllabusData.tamil[grade].push(termData);
        });
    });

    // கோப்புகளைச் சேமித்தல்
    fs.writeFileSync(syllabusPath, `export const syllabusData = ${JSON.stringify(syllabusData, null, 2)};`);
    fs.writeFileSync(lessonMapPath, `export const lessonMap = ${JSON.stringify(lessonMap, null, 2)};`);
    console.log("✅ இண்டெக்ஸ் கோப்புகள் தயார்!");

    // GitHub-க்கு அனுப்புதல்
    try {
        console.log("🚀 GitHub-க்கு தகவல்களை அனுப்புகிறது...");
        execSync('git add .');
        execSync('git commit -m "Auto-update: பாடங்கள் மற்றும் இண்டெக்ஸ் புதுப்பிக்கப்பட்டது"');
        execSync('git push');
        console.log("🎉 GitHub-ல் வெற்றிகரமாகப் பதிவேற்றப்பட்டது!");
    } catch (e) {
        console.error("❌ GitHub-க்கு அனுப்ப முடியவில்லை. Git செட்டப் சரியாக உள்ளதா எனச் சரிபார்க்கவும்.");
    }
}

generate();
