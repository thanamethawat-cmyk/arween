import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

/**
 * Public web client config already shipped in Dockerfile / Cloud Run.
 * Env vars win when set; these fallbacks keep AI Studio Preview usable.
 */
const firebaseFallbacks = {
  apiKey: "AIzaSyD5XbWrAjjBmc6iB1DmbyM9ck84jHnd380",
  authDomain: "gen-lang-client-0084061289.firebaseapp.com",
  projectId: "gen-lang-client-0084061289",
  storageBucket: "gen-lang-client-0084061289.firebasestorage.app",
  messagingSenderId: "619248313782",
  appId: "1:619248313782:web:c919776236b1082470cd17",
} as const;

const requiredEnvKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

function envOrFallback(
  envKey: (typeof requiredEnvKeys)[number],
  fallback: string
): string {
  const value = process.env[envKey];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

export const FIREBASE_CONFIG_MISSING_MESSAGE =
  "ยังไม่ได้ตั้งค่า Firebase ในไฟล์ .env (NEXT_PUBLIC_FIREBASE_*) — กรุณาใส่ค่าจาก Firebase Console แล้วรีสตาร์ทเซิร์ฟเวอร์";

const firebaseConfig = {
  apiKey: envOrFallback(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    firebaseFallbacks.apiKey
  ),
  authDomain: envOrFallback(
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    firebaseFallbacks.authDomain
  ),
  projectId: envOrFallback(
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    firebaseFallbacks.projectId
  ),
  storageBucket: envOrFallback(
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    firebaseFallbacks.storageBucket
  ),
  messagingSenderId: envOrFallback(
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    firebaseFallbacks.messagingSenderId
  ),
  appId: envOrFallback(
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    firebaseFallbacks.appId
  ),
};

export function isFirebaseConfigured(): boolean {
  // Public Dockerfile fallbacks keep Preview / Cloud Run usable without .env.
  return (
    Boolean(firebaseConfig.apiKey) &&
    Boolean(firebaseConfig.authDomain) &&
    Boolean(firebaseConfig.projectId) &&
    Boolean(firebaseConfig.storageBucket) &&
    Boolean(firebaseConfig.messagingSenderId) &&
    Boolean(firebaseConfig.appId)
  );
}

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
