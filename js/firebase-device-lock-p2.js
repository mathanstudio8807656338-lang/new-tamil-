// ═══════════════════════════════════════════════════════
// Firebase Device Lock Module - Project 2 (tet1.mygreenpen.com)
// Features: Fingerprint, Block, Already-Used detection
// ═══════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtbz8pKglviupPOwQvlioqsLELuQqtHhA",
  authDomain: "greenpen-device-lock.firebaseapp.com",
  projectId: "greenpen-device-lock",
  storageBucket: "greenpen-device-lock.firebasestorage.app",
  messagingSenderId: "270447669595",
  appId: "1:270447669595:web:954d2aa2c38fc53b982a7e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Browser Fingerprint உருவாக்கு ────────────────────
async function generateFingerprint() {
  try {
    const components = [
      screen.width,
      screen.height,
      screen.colorDepth,
      navigator.language || '',
      navigator.platform || '',
      navigator.hardwareConcurrency || 0,
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
    ].join('|');

    const encoder = new TextEncoder();
    const data = encoder.encode(components);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray.slice(0, 8))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    return 'fp_unknown';
  }
}

// ── Device ID உருவாக்கு ──────────────────────────────
export async function getDeviceId() {
  let deviceId = localStorage.getItem('a1_device_id');
  if (!deviceId) {
    const fp = await generateFingerprint();
    deviceId = 'dev_' + Date.now() + '_' + fp;
    localStorage.setItem('a1_device_id', deviceId);
  }
  return deviceId;
}

// ── Device Check ─────────────────────────────────────
export async function checkDeviceLock(phone, deviceId, projectPrefix) {
  try {
    const docRef = doc(db, 'device_sessions', `${projectPrefix}_${phone}`);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { allowed: true };
    }

    const data = docSnap.data();

    // 🚫 BLOCK CHECK
    if (data.blocked === true) {
      return {
        allowed: false,
        blocked: true,
        message: '🚫 உங்கள் account நிர்வாகியால் தடுக்கப்பட்டுள்ளது!\nமுறைகேடாக உள்நுழைய முயற்சி கண்டறியப்பட்டது.\nதொடர்பு கொள்ளவும்: 6369371452'
      };
    }

    // ✅ Same Device ID check
    if (data.deviceId === deviceId) {
      return { allowed: true };
    }

    // 🔒 Fingerprint check — deviceId-ல் உள்ள fingerprint compare
    const currentFp = deviceId.split('_').slice(2).join('_');
    const savedFp = (data.deviceId || '').split('_').slice(2).join('_');

    if (currentFp && savedFp && currentFp === savedFp) {
      // Same device, different session — allow & update
      return { allowed: true };
    }

    // ❌ வேற device — Already used
    return {
      allowed: false,
      alreadyUsed: true,
      message: '⚠️ இந்த account ஏற்கனவே வேறு device-ல் பயன்படுத்தப்பட்டுவிட்டது!\nநிர்வாகியை தொடர்பு கொள்ளவும்: 6369371452'
    };
  } catch (e) {
    console.log('Device check error:', e);
    return { allowed: true };
  }
}

// ── Device Register ───────────────────────────────────
export async function registerDevice(phone, deviceId, projectPrefix) {
  try {
    const docRef = doc(db, 'device_sessions', `${projectPrefix}_${phone}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // 🚫 Block check
      if (data.blocked === true) {
        return {
          success: false,
          blocked: true,
          message: '🚫 உங்கள் account நிர்வாகியால் தடுக்கப்பட்டுள்ளது!\nதொடர்பு கொள்ளவும்: 6369371452'
        };
      }

      // Same device — lastLogin update
      if (data.deviceId === deviceId) {
        await setDoc(docRef, { ...data, lastLogin: new Date().toISOString() });
        return { success: true };
      }

      // Fingerprint check
      const currentFp = deviceId.split('_').slice(2).join('_');
      const savedFp = (data.deviceId || '').split('_').slice(2).join('_');

      if (currentFp && savedFp && currentFp === savedFp) {
        await setDoc(docRef, { ...data, deviceId, lastLogin: new Date().toISOString() });
        return { success: true };
      }

      // ❌ வேற device
      return {
        success: false,
        blocked: true,
        message: '⚠️ இந்த account ஏற்கனவே வேறு device-ல் பயன்படுத்தப்பட்டுவிட்டது!\nநிர்வாகியை தொடர்பு கொள்ளவும்: 6369371452'
      };
    }

    // புதிய device — register
    await setDoc(docRef, {
      phone,
      deviceId,
      project: projectPrefix,
      browser: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      blocked: false
    });

    return { success: true };
  } catch (e) {
    console.log('Device register error:', e);
    return { success: true };
  }
}

// ── Admin: எல்லா devices பார்க்க ─────────────────────
export async function getAllDeviceSessions() {
  try {
    const querySnapshot = await getDocs(collection(db, 'device_sessions'));
    const sessions = [];
    querySnapshot.forEach((d) => {
      sessions.push({ id: d.id, ...d.data() });
    });
    return sessions;
  } catch (e) {
    return [];
  }
}

// ── Admin: Device Reset ───────────────────────────────
export async function resetDevice(phone, projectPrefix) {
  try {
    const docRef = doc(db, 'device_sessions', `${projectPrefix}_${phone}`);
    await deleteDoc(docRef);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
