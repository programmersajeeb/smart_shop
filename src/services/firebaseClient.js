import { initializeApp, getApps } from "firebase/app";
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

// Optional: lightweight validation (helps catch misconfigured env quickly)
function hasFirebaseConfig(cfg) {
  return Boolean(cfg?.apiKey && cfg?.authDomain && cfg?.projectId);
}

if (!hasFirebaseConfig(firebaseConfig)) {
  // Do not throw (keeps app booting), but warn in dev
  // In production, this should be fixed in environment variables
  // eslint-disable-next-line no-console
  console.warn("[Firebase] Missing config. Check VITE_* env values.", firebaseConfig);
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// ✅ Named exports used across the app
export const auth = getAuth(app);

// ✅ Google provider (prompt select_account for better UX)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default app;
