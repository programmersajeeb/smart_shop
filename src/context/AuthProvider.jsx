import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
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

import {
  setAccessToken,
  clearAccessToken,
  getAccessToken,
} from "../core/config/tokenStore";

export const AuthContext = createContext(null);

const AUTH_SYNC_KEY = "ss_auth_sync_event"; // localStorage cross-tab sync key
const AUTH_BC_NAME = "ss_auth_bc"; // BroadcastChannel name

/** ✅ Same key as apiClient guard (must match) */
const REFRESH_DISABLED_KEY = "smartshop_refresh_disabled_v1";

function isRefreshDisabled() {
  try {
    return sessionStorage.getItem(REFRESH_DISABLED_KEY) === "1";
  } catch {
    return false;
  }
}

function setRefreshDisabled(disabled) {
  try {
    if (disabled) sessionStorage.setItem(REFRESH_DISABLED_KEY, "1");
    else sessionStorage.removeItem(REFRESH_DISABLED_KEY);
  } catch {
    // ignore
  }
}

function emitAuthEvent(action, payload) {
  const msg = {
    action,
    payload: payload || null,
    at: Date.now(),
    rnd: Math.random().toString(16).slice(2),
  };

  // 1) BroadcastChannel (modern + fast)
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(AUTH_BC_NAME);
      bc.postMessage(msg);
      // close immediately (lightweight one-shot)
      bc.close();
    }
  } catch {
    // ignore
  }

  // 2) localStorage event fallback (works widely)
  try {
    localStorage.setItem(AUTH_SYNC_KEY, JSON.stringify(msg));
  } catch {
    // ignore
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // ✅ Enterprise: ensure rerender on token changes (cross-tab / logout / refresh)
  const [authStamp, setAuthStamp] = useState(0);

  /**
   * Enterprise rule:
   * Auth state should be token-driven (single source of truth).
   * If token is missing -> not authed, even if stale user object exists.
   */
  const isAuthed = useMemo(() => !!getAccessToken(), [authStamp]);

  const bumpAuthStamp = useCallback(() => {
    setAuthStamp((s) => s + 1);
  }, []);

  const hydrateMeSafe = useCallback(async () => {
    const me = await fetchMe();
    return me?.user || me || null;
  }, []);

  const exchangeAndHydrate = useCallback(
    async (idToken, remember) => {
      const data = await exchangeFirebaseToken(idToken); // { accessToken, user }

      // ✅ Login success => allow refresh again (this tab)
      setRefreshDisabled(false);

      if (data?.accessToken) {
        setAccessToken(data.accessToken, { remember });
        bumpAuthStamp();
      }
      if (data?.user) setUser(data.user);
      return data?.user || null;
    },
    [bumpAuthStamp]
  );

  // ✅ Multi-tab auth sync: logout across tabs instantly
  useEffect(() => {
    let bc = null;

    function applyLogoutSync() {
      // ✅ Stop refresh attempts in this tab (prevents /refresh spam)
      setRefreshDisabled(true);

      // Clear everywhere (enterprise)
      clearAccessToken({ removeMode: true });
      setUser(null);
      bumpAuthStamp();
    }

    function onStorage(e) {
      if (!e) return;

      // 1) Explicit auth sync events
      if (e.key === AUTH_SYNC_KEY && e.newValue) {
        try {
          const msg = JSON.parse(e.newValue);
          if (msg?.action === "logout") {
            applyLogoutSync();
          }
        } catch {
          // ignore
        }
      }

      // 2) Token changes (lightweight)
      try {
        const t = getAccessToken();
        if (!t && user) {
          setUser(null);
          bumpAuthStamp();
        } else if (t) {
          bumpAuthStamp();
        }
      } catch {
        // ignore
      }
    }

    function onBCMessage(ev) {
      const msg = ev?.data;
      if (msg?.action === "logout") {
        applyLogoutSync();
      }
    }

    // BroadcastChannel listener
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel(AUTH_BC_NAME);
        bc.onmessage = onBCMessage;
      }
    } catch {
      bc = null;
    }

    // localStorage listener
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      try {
        if (bc) bc.close();
      } catch {
        // ignore
      }
    };
  }, [bumpAuthStamp, user]);

  // Boot: try existing token -> /me
  // If fails, try refresh cookie -> new token -> /me
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        // ✅ If this tab is in "logged-out" mode, do NOT call /auth/refresh at boot.
        if (isRefreshDisabled()) {
          clearAccessToken({ removeMode: true });
          bumpAuthStamp();
          if (active) setUser(null);
          return;
        }

        const existing = getAccessToken();

        // 1) If we have an access token, try hydrate (/auth/me).
        if (existing) {
          try {
            const nextUser = await hydrateMeSafe();
            if (active) setUser(nextUser);
            bumpAuthStamp();
            return;
          } catch {
            // token may be expired; fall through to refresh attempt
          }
        }

        // 2) Try refresh cookie -> new accessToken -> /me
        try {
          const r = await refreshAccessToken(); // { accessToken }
          if (r?.accessToken) {
            // Refresh success => allow future refresh
            setRefreshDisabled(false);

            setAccessToken(r.accessToken);
            bumpAuthStamp();

            const nextUser = await hydrateMeSafe();
            if (active) setUser(nextUser);
          } else {
            // No token returned => treat as logged out
            setRefreshDisabled(true);
            clearAccessToken({ removeMode: true });
            bumpAuthStamp();
            if (active) setUser(null);
          }
        } catch (err) {
          // ✅ If refresh returns 401/403 => stop future refresh attempts (prevents console spam)
          const st = err?.response?.status;
          if (st === 401 || st === 403) setRefreshDisabled(true);

          clearAccessToken({ removeMode: true });
          bumpAuthStamp();
          if (active) setUser(null);
        }
      } catch {
        clearAccessToken({ removeMode: true });
        bumpAuthStamp();
        if (active) setUser(null);
      } finally {
        if (active) setBooting(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [hydrateMeSafe, bumpAuthStamp]);

  /**
   * Keep UI consistent:
   * If token disappears (refresh failed in interceptors etc), clear stale user.
   * We do this on window focus (cheap + effective).
   */
  useEffect(() => {
    function syncAuth() {
      const t = getAccessToken();
      if (!t && user) {
        setUser(null);
        bumpAuthStamp();
      } else if (t) {
        bumpAuthStamp();
      }
    }
    window.addEventListener("focus", syncAuth);
    return () => window.removeEventListener("focus", syncAuth);
  }, [user, bumpAuthStamp]);

  const loginWithGoogle = useCallback(
    async (remember = true) => {
      // Sync Firebase persistence with app remember-me
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      const result = await signInWithPopup(auth, googleProvider);

      // Force fresh token (consistency)
      const idToken = await result.user.getIdToken(true);

      const authedUser = await exchangeAndHydrate(idToken, remember);
      return authedUser;
    },
    [exchangeAndHydrate]
  );

  const logout = useCallback(async () => {
    // ✅ Stop refresh attempts in this tab immediately
    setRefreshDisabled(true);

    // 1) Revoke refresh cookie (backend)
    try {
      await apiLogout();
    } catch {
      // ignore
    }

    // 2) Clear local access token + app user
    clearAccessToken({ removeMode: true });
    setUser(null);
    bumpAuthStamp();

    // ✅ Multi-tab sync
    emitAuthEvent("logout");

    // 3) Sign out from Firebase (client)
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
  }, [bumpAuthStamp]);

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthed,
      loginWithGoogle,
      logout,
      setUser,
    }),
    [user, booting, isAuthed, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
