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
    let buf = fs.readFileSync(file);
    
    // Strip BOM
    if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
        buf = buf.slice(3);
    }

    let changed = false;
    let newBuf = Buffer.alloc(buf.length * 2); // Room for doubling backslashes
    let j = 0;

    for (let i = 0; i < buf.length; i++) {
        if (buf[i] === 0x5c) { // Backslash
            const next = buf[i+1];
            // Valid escapes: ", \, /, b, f, n, r, t, u
            const isValid = [34, 92, 47, 98, 102, 110, 114, 116, 117].includes(next);
            if (!isValid) {
                // Not a valid escape, so we must double it to make it valid JSON
                newBuf[j++] = 0x5c;
                newBuf[j++] = 0x5c;
                changed = true;
                continue;
            }
        }
        newBuf[j++] = buf[i];
    }

    if (changed) {
        fs.writeFileSync(file, newBuf.slice(0, j));
        console.log(`✅ Fixed (doubled backslash): ${file}`);
    } else {
        fs.writeFileSync(file, buf);
    }
});

console.log("✅ All JSON files sanitized (invalid escapes doubled).");
