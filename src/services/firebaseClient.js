import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_apiKey,
  authDomain: import.meta.env.VITE_authDomain,
  projectId: import.meta.env.VITE_projectId,
  storageBucket: import.meta.env.VITE_storageBucket,
  messagingSenderId: import.meta.env.VITE_messagingSenderId,
  appId: import.meta.env.VITE_appId,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// ✅ MUST: named exports (AuthProvider.jsx এ এগুলোই import হচ্ছে)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
