const fs = require('fs');
const path = require('path');

const lessonsDir = path.join(__dirname, 'json-db', 'lessons', 'tamil');
const syllabusPath = path.join(__dirname, 'js', 'data', 'syllabus.js');
const lessonMapPath = path.join(__dirname, 'js', 'data', 'lessonMap.js');

const syllabusData = {
    "tamil": {}
};

const lessonMap = {
    "tamil": {}
};

function generate() {
    console.log("Scanning lessons directory...");
    
    // Grades 1 to 5
    const grades = ['1', '2', '3', '4', '5'];
    
    grades.forEach(grade => {
        const gradePath = path.join(lessonsDir, grade);
        if (!fs.existsSync(gradePath)) return;

        syllabusData.tamil[grade] = [];

        // Terms 1, 2, 3
        const terms = ['Term 1', 'Term 2', 'Term 3'];
        
        terms.forEach((termName, index) => {
            const termPath = path.join(gradePath, termName);
            if (!fs.existsSync(termPath)) return;

            const termData = {
                "term": index + 1,
                "units": [
                    {
                        "title": termName,
                        "topics": []
                    }
                ]
            };

            const files = fs.readdirSync(termPath).filter(f => f.endsWith('.json'));
            
            files.forEach(file => {
                const filePath = path.join(termPath, file);
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                const title = content.title || content.lesson_meta?.title || file.replace('.json', '');
                const code = file.replace('.json', '');

                termData.units[0].topics.push({
                    "title": title,
                    "isUpdated": true,
                    "code": code
                });

                // Add to lessonMap
                lessonMap.tamil[title] = {
                    "local": true,
                    "filename": code,
                    "grade": grade,
                    "term": index + 1
                };
                lessonMap.tamil[code] = {
                    "local": true,
                    "filename": code,
                    "grade": grade,
                    "term": index + 1
                };
            });

            if (termData.units[0].topics.length > 0) {
                syllabusData.tamil[grade].push(termData);
            }
        });
    });

    // Write Files
    const syllabusContent = `export const syllabusData = ${JSON.stringify(syllabusData, null, 2)};`;
    const lessonMapContent = `export const lessonMap = ${JSON.stringify(lessonMap, null, 2)};`;

    fs.writeFileSync(syllabusPath, syllabusContent);
    fs.writeFileSync(lessonMapPath, lessonMapContent);

    console.log("Generation complete!");
    console.log(`Syllabus saved to: ${syllabusPath}`);
    console.log(`Lesson Map saved to: ${lessonMapPath}`);
}

generate();
