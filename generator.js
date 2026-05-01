const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const lessonsBaseDir = path.join(__dirname, 'json-db', 'lessons');
const syllabusPath = path.join(__dirname, 'js', 'data', 'syllabus.js');
const lessonMapPath = path.join(__dirname, 'js', 'data', 'lessonMap.js');

const syllabusData = {};
const lessonMap = {};

function generate() {
    console.log("🔍 அனைத்துப் பாடங்களையும் ஸ்கேன் செய்கிறது...");
    
    const subjects = fs.readdirSync(lessonsBaseDir).filter(f => fs.lstatSync(path.join(lessonsBaseDir, f)).isDirectory());
    
    subjects.forEach(subject => {
        syllabusData[subject] = {};
        lessonMap[subject] = {};
        
        const subjectPath = path.join(lessonsBaseDir, subject);
        const subItems = fs.readdirSync(subjectPath);
        
        // Handle Grade-based subjects (1, 2, 3, 4, 5)
        const grades = subItems.filter(f => !isNaN(parseInt(f)));
        if (grades.length > 0) {
            grades.forEach(grade => {
                syllabusData[subject][grade] = [];
                const gradePath = path.join(subjectPath, grade);
                const terms = ['Term 1', 'Term 2', 'Term 3'];
                
                terms.forEach((termName, index) => {
                    const termPath = path.join(gradePath, termName);
                    if (!fs.existsSync(termPath)) return;
                    
                    const termData = { "term": index + 1, "units": [{ "title": termName, "topics": [] }] };
                    const files = fs.readdirSync(termPath).filter(f => f.endsWith('.json'));
                    
                    files.forEach(file => {
                        const content = JSON.parse(fs.readFileSync(path.join(termPath, file), 'utf8'));
                        const title = content.lesson_meta?.title || content.title || content.பாட_தலைப்பு || file.replace('.json', '');
                        const code = file.replace('.json', '');
                        
                        termData.units[0].topics.push({ "title": title, "isUpdated": true, "code": code });
                        
                        const mapEntry = { "local": true, "filename": code, "grade": grade, "term": index + 1 };
                        lessonMap[subject][title] = mapEntry;
                        lessonMap[subject][code] = mapEntry;
                    });
                    
                    if (termData.units[0].topics.length > 0) {
                        syllabusData[subject][grade].push(termData);
                    }
                });
            });
        }
        
        // Handle Flat subjects (like psychology, mocktest with 'all' folder)
        if (subItems.includes('all')) {
            syllabusData[subject]["all"] = [{ "term": 1, "units": [{ "title": "அனைத்தும்", "topics": [] }] }];
            const allPath = path.join(subjectPath, 'all');
            const files = fs.readdirSync(allPath).filter(f => f.endsWith('.json'));
            
            files.forEach(file => {
                const content = JSON.parse(fs.readFileSync(path.join(allPath, file), 'utf8'));
                const title = content.lesson_meta?.title || content.title || file.replace('.json', '');
                const code = file.replace('.json', '');
                
                syllabusData[subject]["all"][0].units[0].topics.push({ "title": title, "isUpdated": true, "code": code });
                
                const mapEntry = { "local": true, "filename": code, "isFlat": true };
                lessonMap[subject][title] = mapEntry;
                lessonMap[subject][code] = mapEntry;
            });
        }
    });

    // Save index files
    fs.writeFileSync(syllabusPath, `export const syllabusData = ${JSON.stringify(syllabusData, null, 2)};`);
    fs.writeFileSync(lessonMapPath, `export const lessonMap = ${JSON.stringify(lessonMap, null, 2)};`);
    console.log("✅ அனைத்துப் பாடங்களுக்குமான இண்டெக்ஸ் கோப்புகள் தயார்!");

    // GitHub Sync
    try {
        console.log("🚀 GitHub-க்கு தகவல்களை அனுப்புகிறது...");
        execSync('git add .');
        try {
            execSync('git commit -m "Auto-update: அனைத்துப் பாடங்களும் புதுப்பிக்கப்பட்டது"');
        } catch (e) {
            console.log("ℹ️ கமிட் செய்ய புதிய மாற்றங்கள் இல்லை.");
        }
        execSync('git push -f origin main');
        console.log("🎉 GitHub-ல் வெற்றிகரமாகப் பதிவேற்றப்பட்டது!");
    } catch (e) {
        console.error("❌ GitHub-க்கு அனுப்ப முடியவில்லை. இன்டர்நெட் அல்லது Git செட்டப்பைச் சரிபார்க்கவும்.");
    }
}

generate();
