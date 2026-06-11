import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || "build-placeholder",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || "build-placeholder",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || "build-placeholder",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || "build-placeholder",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "build-placeholder",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || "build-placeholder",
};

// Guard robuste contre l'initialisation multiple
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
// La base Firestore de ce projet est nommée "default" (sans parenthèses)
// getFirestore(app) se connecte à "(default)" qui n'existe pas — on spécifie explicitement
export const db = getFirestore(app, "default");
export const storage = getStorage(app);
