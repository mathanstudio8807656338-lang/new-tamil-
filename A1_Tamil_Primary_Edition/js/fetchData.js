// --- Standardized Text Formatting ---
export function formatText(text) {
    if (!text) return "";
    
    // 1. Convert to string and handle Basic HTML/Keywords
    let html = text.toString()
        .replace(/\[\[(.*?)\]\]/g, '<span class="keyword">$1</span>')
        .replace(/\(\((.*?)\)\)/g, '<span class="sub-heading">$1</span>')
        .replace(/\$(.*?)\$/g, '<span class="math-tex">$1</span>');

    // 2. Bilingual English || Tamil logic
    if (html.includes('||')) {
        const parts = html.split('||');
        return `<span class="en-text">${parts[0].trim()}</span><span class="lang-sep"> / </span><span class="tm-text">${parts[1].trim()}</span>`;
    }
    
    // 3. Fallback for "English / Tamil" if both scripts are detected
    const hasTamil = /[\u0B80-\u0BFF]/.test(html);
    const hasEnglish = /[a-zA-Z]/.test(html);
    
    if (html.includes(' / ') && hasTamil && hasEnglish && !html.includes('</span>')) {
        const parts = html.split(' / ');
        return `<span class="en-text">${parts[0].trim()}</span><span class="lang-sep"> / </span><span class="tm-text">${parts[1].trim()}</span>`;
    }

    // 4. Mixed text detection (Simple English followed by Tamil) - ReDoS Safe check
    if (html.length < 500 && hasTamil && hasEnglish && !html.includes('<')) {
        const splitMatch = html.match(/^([a-zA-Z0-9\s.,\-'"]+)([\u0B80-\u0BFF].*)$/u);
        if (splitMatch) {
            return `<span class="en-text">${splitMatch[1].trim()}</span> <span class="tm-text">${splitMatch[2].trim()}</span>`;
        }
    }

    return html;
}

export function getSafeFileName(topic) {
    if (!topic) return "unknown";
    return topic.toString().replace(/[\*\?\"\<\>\|]/g, '').trim().replace(/\s+/g, '_');
}

// --- Robust Data Fetching ---
export async function getLocalLessonData(subject, className, lessonId) {
    if (!subject || !lessonId) return null;
    
    const v = new Date().getTime();
    const safeName = getSafeFileName(lessonId);
    
    // Normalize Subject
    const sub = subject.toLowerCase();
    let subjectKey = sub;
    if (sub.includes('science') && !sub.includes('social')) subjectKey = 'science';
    else if (sub.includes('social')) subjectKey = 'social';
    else if (sub.includes('tamil')) subjectKey = 'tamil';
    else if (sub.includes('english')) subjectKey = 'english';
    else if (sub.includes('math')) subjectKey = 'maths';
    else if (sub.includes('psychology')) subjectKey = 'psychology';
    else if (sub.includes('standard_6_7_8')) subjectKey = 'standard_6_7_8';
    else if (sub.includes('revision')) subjectKey = 'revision';
    else if (sub.includes('mocktest')) subjectKey = 'mocktest';

    // 1. Try Map Lookup
    let lessonMap = {};
    let specialMap = {};
    try {
        const module = await import(`./data/lessonMap.js?v=${v}`);
        lessonMap = module.lessonMap || {};
    } catch (e) { console.warn("Map not found, using fallback"); }
    
    // Try special content map for special subjects
    if (['psychology', 'revision', 'mocktest', 'standard_6_7_8'].includes(subjectKey)) {
        try {
            const specModule = await import(`./data/specialContentMap.js?v=${v}`);
            specialMap = specModule.specialContentMap || {};
        } catch (e) { console.warn("Special map not found"); }
    }

    const subjectMapRegular = lessonMap[subjectKey] || {};
    const subjectMapSpecial = specialMap.class678 || specialMap.revision || specialMap.model || specialMap.psychology || {};
    
    // Fuzzy match function
    const findMatch = (map, id) => {
        if (map[id]) return map[id];
        const clean = (s) => s.toString().toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '').trim();
        const search = clean(id);
        const entry = Object.entries(map).find(([k]) => clean(k) === search);
        return entry ? entry[1] : null;
    };

    const matchRegular = findMatch(subjectMapRegular, lessonId);
    const matchSpecial = findMatch(subjectMapSpecial, lessonId);
    const match = matchSpecial || matchRegular;
    const paths = [];

    if (match) {
        const grade = match.grade || className;
        const category = match.category;
        
        // Special content paths
        if (category && ['class678', 'revision', 'model', 'psychology'].includes(category)) {
            paths.push(`json-db/special/${category}/${match.filename}.json`);
        } else {
            // Regular lesson paths
            const termFolder = match.term ? `Term ${match.term}/` : '';
            paths.push(`json-db/lessons/${subjectKey}/${grade}/${termFolder}${match.filename}.json`);
        }
    }

    // 2. Try Standard Path Patterns
    paths.push(`json-db/lessons/${subjectKey}/${className}/${safeName}.json`);
    paths.push(`json-db/lessons/${subjectKey}/${className}/${lessonId}.json`);
    
    // 3. Try special content patterns
    if (['psychology', 'revision', 'mocktest', 'standard_6_7_8'].includes(subjectKey)) {
        paths.push(`json-db/special/class678/${safeName}.json`);
        paths.push(`json-db/special/class678/${lessonId}.json`);
        paths.push(`json-db/special/revision/${safeName}.json`);
        paths.push(`json-db/special/model/${safeName}.json`);
        paths.push(`json-db/special/psychology/${safeName}.json`);
    }

    // Execution
    for (const path of paths) {
        try {
            const res = await fetch(path + '?v=' + v);
            if (res.ok) {
                const data = await res.json();
                return { data, url: path };
            }
        } catch (e) {}
    }

    return null;
}

export async function getLocalTodayLessons() {
    try {
        const response = await fetch('json-db/today.json?v=' + new Date().getTime());
        return response.ok ? await response.json() : [];
    } catch (e) { return []; }
}
