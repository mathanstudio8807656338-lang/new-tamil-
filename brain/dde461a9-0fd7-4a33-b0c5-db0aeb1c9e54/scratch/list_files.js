const fs = require('fs');
const path = require('path');

const CLASS_ORDER = ['5', '4', '3', '2', '1'];

const baseDir = 'c:/Users/MATHAN/Desktop/A1_Tamil_Primary_Edition/json-db/lessons';

function getLessonFiles(subject) {
  const base = path.join(baseDir, subject);
  if (!fs.existsSync(base)) return [];
  
  let all = [];
  
  const allDir = path.join(base, 'all');
  if (fs.existsSync(allDir)) {
      const files = fs.readdirSync(allDir).filter(f => f.endsWith('.json')).sort();
      all.push(...files.map(f => path.join(allDir, f)));
  }

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

const scienceFiles = getLessonFiles('science');
console.log('Science Files Found:');
scienceFiles.forEach((f, i) => console.log(`${i}: ${f}`));
