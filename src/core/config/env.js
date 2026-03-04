function normalizeUrl(u) {
  const v = String(u || "").trim();
  if (!v) return "";
  return v.replace(/\/$/, "");
}

function pick(...vals) {
  for (const v of vals) {
    const s = String(v || "").trim();
    if (s) return s;
  }
  return "";
}

// ✅ Enterprise-safe default:
// - DEV: local backend
// - PROD: same-origin fallback (prevents accidental localhost calls)
const DEFAULT_API_URL = import.meta.env.DEV ? "http://localhost:5000/api/v1" : "/api/v1";

const API_URL = normalizeUrl(
  pick(
    import.meta.env.VITE_API_URL,
    import.meta.env.VITE_BACKEND_URL,
    DEFAULT_API_URL
  )
);

export const ENV = {
  API_URL,

  // Firebase env: accept multiple naming styles (enterprise-safe)
  FIREBASE: {
    apiKey: pick(import.meta.env.VITE_apiKey, import.meta.env.VITE_API_KEY, import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: pick(import.meta.env.VITE_authDomain, import.meta.env.VITE_AUTH_DOMAIN, import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: pick(import.meta.env.VITE_projectId, import.meta.env.VITE_PROJECT_ID, import.meta.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: pick(import.meta.env.VITE_storageBucket, import.meta.env.VITE_STORAGE_BUCKET, import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: pick(import.meta.env.VITE_messagingSenderId, import.meta.env.VITE_MESSAGING_SENDER_ID, import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: pick(import.meta.env.VITE_appId, import.meta.env.VITE_APP_ID, import.meta.env.VITE_FIREBASE_APP_ID),
  },
};
