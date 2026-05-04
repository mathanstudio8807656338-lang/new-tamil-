const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.json')) {
            results.push(file);
        }
    });
    return results;
}

const lessonsDir = path.join(__dirname, 'json-db/lessons');
const files = walk(lessonsDir);

files.forEach(file => {
    const buf = fs.readFileSync(file);
    let changed = false;
    
    let newBuf = Buffer.alloc(buf.length * 4); // Plenty of room
    let j = 0;
    for (let i = 0; i < buf.length; i++) {
        if (buf[i] === 0x5c) { // Backslash
            const next = buf[i+1];
            // Valid escapes: ", \, /, b, f, n, r, t, u
            const isValid = [34, 92, 47, 98, 102, 110, 114, 116, 117].includes(next);
            if (isValid) {
                // Keep the valid escape pair
                newBuf[j++] = buf[i];
                newBuf[j++] = buf[i+1];
                i++; // Skip the next char as it's part of the escape
                continue;
            } else {
                // Not a valid escape
                if (next === 176 || (next === 0xC2 && buf[i+2] === 0xB0)) {
                    // It's \° - just remove the backslash
                    changed = true;
                    // Don't write anything, just continue (effectively skipping \)
                    continue; 
                } else {
                    // It's \ followed by something else (like \cancel)
                    // Double the backslash
                    newBuf[j++] = 0x5c;
                    newBuf[j++] = 0x5c;
                    changed = true;
                    continue;
                }
            }
        }
        newBuf[j++] = buf[i];
    }

    if (changed) {
        fs.writeFileSync(file, newBuf.slice(0, j));
        console.log(`✅ Fixed syntax: ${file}`);
    }
});

console.log("🚀 All JSON files sanitized correctly.");
