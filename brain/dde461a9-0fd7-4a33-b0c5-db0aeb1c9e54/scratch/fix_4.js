const fs = require('fs');
const filePath = 'json-db/lessons/science/2/Term 1/4.json';
const data = fs.readFileSync(filePath);
let content = data.toString('utf8');

// Find the last occurrence of the "options" array closing
const searchStr = '"options": [\n        "A) மகிழ்ச்சி",\n        "B) பயம்",\n        "C) ஆச்சரியம்",\n        "D) தூக்கம்"\n      ],';
// Wait, the newlines might be different. Let's look for "D) தூக்கம்"
const pivot = content.lastIndexOf('"D) தூக்கம்"');
if (pivot !== -1) {
    const endOfOptions = content.indexOf(']', pivot);
    if (endOfOptions !== -1) {
        content = content.substring(0, endOfOptions + 1);
        content += `,\n      "விடை": "B) பயம்",\n      "விளக்கம்": "சிங்கத்தின் கர்ஜனையைக் கேட்டவுடன் சிக்கு பயந்துவிட்டது."\n    }\n  ]\n}`;
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fixed 4.json");
    } else {
        console.log("Could not find end of options array");
    }
} else {
    console.log("Could not find pivot string");
}
