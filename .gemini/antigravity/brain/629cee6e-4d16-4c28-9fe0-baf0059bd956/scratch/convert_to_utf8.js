const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.json')) results.push(file);
        }
    });
    return results;
}

const baseDir = 'C:\\Users\\MATHAN\\Desktop\\A1_Tamil_Primary_Edition\\json-db\\lessons\\english';
const files = walk(baseDir);

files.forEach(file => {
    const buffer = fs.readFileSync(file);
    
    // Check for UTF-16 LE BOM (FF FE)
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        console.log(`Converting UTF-16 LE: ${file}`);
        const content = buffer.toString('utf16le');
        // Remove BOM if present in string (though toString might handle it)
        const cleanContent = content.replace(/^\uFEFF/, '');
        fs.writeFileSync(file, cleanContent, 'utf8');
    } 
    // Check for UTF-8 BOM (EF BB BF)
    else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        console.log(`Removing UTF-8 BOM: ${file}`);
        const content = buffer.toString('utf8').replace(/^\uFEFF/, '');
        fs.writeFileSync(file, content, 'utf8');
    }
    else {
        // Just try to see if it's UTF-16 without BOM (risky but common in some tools)
        // If it has lots of null bytes, it's probably UTF-16
        let nulls = 0;
        for (let i = 0; i < Math.min(buffer.length, 100); i++) {
            if (buffer[i] === 0) nulls++;
        }
        if (nulls > 10) {
            console.log(`Converting probable UTF-16 (no BOM): ${file}`);
            const content = buffer.toString('utf16le');
            fs.writeFileSync(file, content, 'utf8');
        }
    }
});

console.log('Done conversion check.');
