/**
 * A1 LMS - Firestore Mock / Replacement
 * This file replaces the Firebase connection with local-only logic
 * as the project has moved away from Firebase authentication.
 */

window.firebaseStatus = "Offline (Local-only mode)";

// Get Today's Lessons - Now returns empty as we use schedule.js primarily
export async function getTodayLessons() {
    console.log("Firestore mock: getTodayLessons called - returning empty.");
    return [];
}

// Get Data for a specific lesson
export async function getLessonData(subject, className, lessonId) {
    console.log("Firestore mock: getLessonData called.");
    return null;
}

// Get all lessons for a specific Class in a Subject
export async function getClassLessons(subject, className) {
    console.log("Firestore mock: getClassLessons called.");
    return [];
}

// Save or Update Lesson Data
export async function saveLessonData(subject, className, lessonData) {
    console.log("Firestore mock: saveLessonData called (No-op).");
    return true; 
}

// Bulk Save Users
export async function saveUsersBulk(usersArray) {
    console.log("Firestore mock: saveUsersBulk called (No-op).");
    return true;
}

// Fetch User Profile - Deprecated as we are deterministic now
// export async function verifyUserPin(phoneNumber, pin = null) { ... }

export const db = null;
