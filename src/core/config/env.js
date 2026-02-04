export const ENV = {
  API_URL: (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/$/, ""),

  FIREBASE: {
    apiKey: import.meta.env.VITE_apiKey,
    authDomain: import.meta.env.VITE_authDomain,
    projectId: import.meta.env.VITE_projectId,
    storageBucket: import.meta.env.VITE_storageBucket,
    messagingSenderId: import.meta.env.VITE_messagingSenderId,
    appId: import.meta.env.VITE_appId,
  },
};
