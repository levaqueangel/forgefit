let _adminApp = null;
let _adminAuth = null;
let _adminDb = null;

function getAdminApp() {
  if (_adminApp) return _adminApp;
  const { initializeApp, getApps, getApp, cert } = require("firebase-admin/app");
  if (getApps().length > 0) {
    _adminApp = getApp();
  } else {
    _adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return _adminApp;
}

export function getAdminAuth() {
  if (_adminAuth) return _adminAuth;
  const { getAuth } = require("firebase-admin/auth");
  _adminAuth = getAuth(getAdminApp());
  return _adminAuth;
}

export function getAdminDb() {
  if (_adminDb) return _adminDb;
  const { getFirestore } = require("firebase-admin/firestore");
  _adminDb = getFirestore(getAdminApp());
  _adminDb.settings({ preferRest: true });
  return _adminDb;
}

export async function verifyAuthToken(req) {
  const header = req.headers.get("authorization") || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}
