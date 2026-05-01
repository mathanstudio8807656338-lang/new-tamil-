const fs = require('fs');
const path = require('path');
const base = 'C:/Users/MATHAN/Desktop/MATERIAL/';
const dest = 'C:/Users/MATHAN/Desktop/A1_Tamil_Primary_Edition/json-db/lessons/science/2/Term 1/';

const dirs = fs.readdirSync(base);
const scienceDir = dirs.find(d => d.includes('?') || d.length === 8);

if (scienceDir) {
    const srcDir = path.join(base, scienceDir, '2/1ST TERM/');
    const files = fs.readdirSync(srcDir);
    files.forEach(file => {
        if (file.endsWith('.json')) {
            fs.copyFileSync(path.join(srcDir, file), path.join(dest, file));
            console.log(`Copied ${file}`);
        }
    });
} else {
    console.log("Science directory not found");
}
