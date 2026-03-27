import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { ENV } from "../core/config/env";

const firebaseConfig = {
  apiKey: ENV.FIREBASE.apiKey,
  authDomain: ENV.FIREBASE.authDomain,
  projectId: ENV.FIREBASE.projectId,
  storageBucket: ENV.FIREBASE.storageBucket,
  messagingSenderId: ENV.FIREBASE.messagingSenderId,
  appId: ENV.FIREBASE.appId,
};

function hasFirebaseConfig(cfg) {
  return Boolean(
    cfg?.apiKey &&
    cfg?.authDomain &&
    cfg?.projectId &&
    cfg?.appId
  );
}

const isDev = import.meta.env.DEV;

if (!hasFirebaseConfig(firebaseConfig)) {
  if (isDev) {
    console.warn(
      "[Firebase] Missing config. Check your .env values.",
      firebaseConfig
    );
  }
  // In production, silently fail (avoid console noise)
}

// ✅ Safe init (prevents duplicate app crash)
const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

// ✅ Auth instance
export const auth = getAuth(app);

// ✅ Google provider (better UX)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export default app;