// --- Standardized Text Formatting ---
export function formatText(text) {
    if (!text) return "";
    let html = text.toString()
        .replace(/\[\[(.*?)\]\]/g, '<span class="keyword">$1</span>')
        .replace(/\(\((.*?)\)\)/g, '<span class="sub-heading">$1</span>')
        .replace(/\$(.*?)\$/g, '<span class="math-tex">$1</span>');
    if (html.includes('||')) {
        const parts = html.split('||');
        return `<span class="en-text">${parts[0].trim()}</span><span class="lang-sep"> / </span><span class="tm-text">${parts[1].trim()}</span>`;
    }
    const hasTamil = /[\u0B80-\u0BFF]/.test(html);
    const hasEnglish = /[a-zA-Z]/.test(html);
    if (html.includes(' / ') && hasTamil && hasEnglish && !html.includes('</span>')) {
        const parts = html.split(' / ');
        return `<span class="en-text">${parts[0].trim()}</span><span class="lang-sep"> / </span><span class="tm-text">${parts[1].trim()}</span>`;
    }
    return html;
}

export function getSafeFileName(topic) {
    if (!topic) return "unknown";
    return topic.toString().replace(/[\*\?\"\<\>\|]/g, '').trim().replace(/\s+/g, '_');
}

// --- Robust Data Fetching ---
export async function getLocalLessonData(subject, className, lessonId) {
    const v = new Date().getTime();
    
    // --- SPECIAL CASE: Daily Challenge (1.json) ---
    if (lessonId === '1') {
        try {
            const res = await fetch('1.json?v=' + v);
            if (res.ok) {
                const data = await res.json();
                return { data, url: '1.json' };
            }
        } catch (e) {
            console.error("Daily Challenge (1.json) not found");
        }
    }

    if (!subject || !lessonId) return null;
    const v = new Date().getTime();
    const sub = subject.toLowerCase();
    let subjectKey = sub;
    if (sub.includes('science') && !sub.includes('social')) subjectKey = 'science';
    else if (sub.includes('social')) subjectKey = 'social';
    else if (sub.includes('tamil')) subjectKey = 'tamil';
    else if (sub.includes('english')) subjectKey = 'english';
    else if (sub.includes('math')) subjectKey = 'maths';
    else if (sub.includes('psychology')) subjectKey = 'psychology';
    else if (sub.includes('notes_678')) subjectKey = 'notes_678';
    else if (sub.includes('revision')) subjectKey = 'revision';
    else if (sub.includes('mocktest')) subjectKey = 'mocktest';

    let lessonMap = {};
    try {
        const module = await import(`./data/lessonMap.js?v=${v}`);
        lessonMap = module.lessonMap || {};
    } catch (e) { console.warn("Map not found"); }

    const subjectMap = lessonMap[subjectKey] || {};
    const findMatch = (map, id) => {
        if (map[id]) return map[id];
        const clean = (s) => s.toString().toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '').trim();
        const search = clean(id);
        const entry = Object.entries(map).find(([k]) => clean(k) === search);
        return entry ? entry[1] : null;
    };

    const match = findMatch(subjectMap, lessonId);
    const paths = [];

    if (match) {
        if (match.isFlat) {
            paths.push(`json-db/lessons/${subjectKey}/all/${match.filename}.json`);
        } else if (match.grade && match.term) {
            paths.push(`json-db/lessons/${subjectKey}/${match.grade}/Term ${match.term}/${match.filename}.json`);
        }
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
