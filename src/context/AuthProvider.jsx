import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, googleProvider } from "../services/firebaseClient";

import {
  exchangeFirebaseToken,
  fetchMe,
  refreshAccessToken,
  logout as apiLogout,
} from "../services/authApi";

import { setAccessToken, clearAccessToken, getAccessToken } from "../core/config/tokenStore";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // Treat as authed if we already have a token (user can be hydrated after boot)
  const isAuthed = !!user || !!getAccessToken();

  async function hydrateMeSafe(activeSetter) {
    const me = await fetchMe();
    const nextUser = me?.user || me || null;
    activeSetter(nextUser);
    return nextUser;
  }

  async function exchangeAndHydrate(idToken, remember, activeSetter) {
    const data = await exchangeFirebaseToken(idToken); // { accessToken, user }
    if (data?.accessToken) setAccessToken(data.accessToken, { remember });
    if (data?.user) activeSetter(data.user);
    return data?.user || null;
  }

  // App boot: try existing access token -> /me
  // If fails, try refresh cookie -> token -> /me
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const existing = getAccessToken();

        // 1) If we have an access token, try to hydrate user
        if (existing) {
          try {
            await hydrateMeSafe((u) => {
              if (active) setUser(u);
            });
            return;
          } catch {
            // Token might be expired; fallback to refresh
          }
        }

        // 2) Try refresh cookie -> new accessToken -> /me
        const r = await refreshAccessToken();
        if (r?.accessToken) {
          /**
           * IMPORTANT:
           * We intentionally DO NOT force a storage type here because
           * we don't know whether the user previously chose session/local.
           * tokenStore should preserve the existing storage strategy.
           *
           * We will finalize this perfectly after you send tokenStore.js
           * (we will detect current storage and apply correctly).
           */
          setAccessToken(r.accessToken);
          await hydrateMeSafe((u) => {
            if (active) setUser(u);
          });
        } else {
          // No refresh cookie / not logged in
          clearAccessToken();
          if (active) setUser(null);
        }
      } catch {
        clearAccessToken();
        if (active) setUser(null);
      } finally {
        if (active) setBooting(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function loginWithGoogle(remember = true) {
    // Sync Firebase session persistence with app "remember me"
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);

    const result = await signInWithPopup(auth, googleProvider);

    // Force fresh token (better consistency)
    const idToken = await result.user.getIdToken(true);

    const authedUser = await exchangeAndHydrate(idToken, remember, (u) => setUser(u));
    return authedUser;
  }

  async function logout() {
    // 1) Revoke refresh cookie (backend)
    try {
      await apiLogout();
    } catch {
      // ignore
    }

    // 2) Clear local access token + app user
    clearAccessToken({ removeMode: true });
    setUser(null);

    // 3) Sign out from Firebase (client)
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
  }

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthed,
      loginWithGoogle,
      logout,
      setUser,
    }),
    [user, booting, isAuthed]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}
