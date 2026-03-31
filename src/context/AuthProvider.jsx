import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  ensureFreshAccessToken,
  logout as apiLogout,
} from "../services/authApi";

import {
  setAccessToken,
  clearAccessToken,
  getAccessToken,
} from "../core/config/tokenStore";

export const AuthContext = createContext(null);

const AUTH_SYNC_KEY = "ss_auth_sync_event";
const AUTH_BC_NAME = "ss_auth_bc";
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
    if (disabled) {
      sessionStorage.setItem(REFRESH_DISABLED_KEY, "1");
    } else {
      sessionStorage.removeItem(REFRESH_DISABLED_KEY);
    }
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

  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(AUTH_BC_NAME);
      bc.postMessage(msg);
      bc.close();
    }
  } catch {
    // ignore
  }

  try {
    localStorage.setItem(AUTH_SYNC_KEY, JSON.stringify(msg));
  } catch {
    // ignore
  }
}

function normalizePermissions(list) {
  const arr = Array.isArray(list) ? list : [];
  const out = [];
  const seen = new Set();

  for (const raw of arr) {
    const p = String(raw || "").trim();
    if (!p) continue;

    const k = p.toLowerCase();
    if (seen.has(k)) continue;

    seen.add(k);
    out.push(p);
  }

  return out.sort((a, b) => a.localeCompare(b));
}

function normalizeUser(input) {
  if (!input || typeof input !== "object") return null;

  const role = String(input.role || "user").trim().toLowerCase();
  const roleLevelRaw = Number(input.roleLevel || 0);
  const roleLevel = Number.isFinite(roleLevelRaw)
    ? Math.max(0, Math.min(100, roleLevelRaw))
    : 0;

  return {
    ...input,
    _id: input?._id ? String(input._id) : input?._id || null,
    role,
    roleLevel,
    permissions: normalizePermissions(input.permissions),
    isBlocked: Boolean(input.isBlocked),
    email: input?.email || null,
    phone: input?.phone || null,
    displayName: input?.displayName || input?.name || null,
    photoURL: input?.photoURL || null,
  };
}

function pickUser(payload) {
  if (!payload) return null;
  return payload?.user || payload?.data?.user || payload?.data || payload;
}

export default function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [booting, setBooting] = useState(true);
  const [authStamp, setAuthStamp] = useState(0);

  const bumpAuthStamp = useCallback(() => {
    setAuthStamp((s) => s + 1);
  }, []);

  const setUser = useCallback((next) => {
    if (typeof next === "function") {
      setUserState((prev) => normalizeUser(next(prev)));
      return;
    }
    setUserState(normalizeUser(next));
  }, []);

  const resetLocalAuth = useCallback(
    ({ removeMode = true, disableRefresh = false } = {}) => {
      if (disableRefresh) {
        setRefreshDisabled(true);
      }

      clearAccessToken({ removeMode });
      setUser(null);
      bumpAuthStamp();
    },
    [bumpAuthStamp, setUser]
  );

  const applyLocalAccessToken = useCallback(
    (token, remember) => {
      const cleanToken = String(token || "").trim();

      if (!cleanToken) {
        resetLocalAuth({ removeMode: false });
        return false;
      }

      setAccessToken(cleanToken, remember !== undefined ? { remember } : undefined);
      bumpAuthStamp();
      return true;
    },
    [bumpAuthStamp, resetLocalAuth]
  );

  const isAuthed = useMemo(() => !!getAccessToken(), [authStamp]);

  const hydrateMeSafe = useCallback(async () => {
    const me = await fetchMe();
    return normalizeUser(pickUser(me));
  }, []);

  const exchangeAndHydrate = useCallback(
    async (idToken, remember) => {
      const data = await exchangeFirebaseToken(idToken, remember);

      setRefreshDisabled(false);

      if (data?.accessToken) {
        applyLocalAccessToken(data.accessToken, remember);
      }

      const nextUser = normalizeUser(data?.user || null);
      if (nextUser) {
        setUser(nextUser);
      }

      return nextUser;
    },
    [applyLocalAccessToken, setUser]
  );

  useEffect(() => {
    let bc = null;

    function applyLogoutSync() {
      resetLocalAuth({ removeMode: true, disableRefresh: true });
    }

    function onStorage(e) {
      if (!e) return;

      if (e.key === AUTH_SYNC_KEY && e.newValue) {
        try {
          const msg = JSON.parse(e.newValue);
          if (msg?.action === "logout") {
            applyLogoutSync();
            return;
          }
        } catch {
          // ignore
        }
      }

      const t = getAccessToken();
      if (!t && user) {
        setUser(null);
        bumpAuthStamp();
      } else if (t) {
        bumpAuthStamp();
      }
    }

    function onBCMessage(ev) {
      const msg = ev?.data;
      if (msg?.action === "logout") {
        applyLogoutSync();
      }
    }

    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel(AUTH_BC_NAME);
        bc.onmessage = onBCMessage;
      }
    } catch {
      bc = null;
    }

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      try {
        if (bc) bc.close();
      } catch {
        // ignore
      }
    };
  }, [bumpAuthStamp, resetLocalAuth, setUser, user]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        if (isRefreshDisabled()) {
          resetLocalAuth({ removeMode: true, disableRefresh: false });
          return;
        }

        const existing = getAccessToken();

        if (existing) {
          try {
            const refreshedToken = await ensureFreshAccessToken();

            if (!refreshedToken) {
              resetLocalAuth({ removeMode: true, disableRefresh: true });
              return;
            }

            const nextUser = await hydrateMeSafe();
            if (active) {
              setUser(nextUser);
            }
            bumpAuthStamp();
            return;
          } catch {
            try {
              const r = await refreshAccessToken();

              if (r?.accessToken) {
                setRefreshDisabled(false);
                applyLocalAccessToken(r.accessToken);

                const nextUser = await hydrateMeSafe();
                if (active) {
                  setUser(nextUser);
                }
                bumpAuthStamp();
                return;
              }
            } catch (err) {
              const st = err?.response?.status;
              resetLocalAuth({
                removeMode: true,
                disableRefresh: st === 401 || st === 403,
              });
              return;
            }
          }
        }

        try {
          const r = await refreshAccessToken();

          if (r?.accessToken) {
            setRefreshDisabled(false);
            applyLocalAccessToken(r.accessToken);

            const nextUser = await hydrateMeSafe();
            if (active) {
              setUser(nextUser);
            }
          } else {
            resetLocalAuth({ removeMode: true, disableRefresh: true });
          }
        } catch (err) {
          const st = err?.response?.status;
          resetLocalAuth({
            removeMode: true,
            disableRefresh: st === 401 || st === 403,
          });
        }
      } catch {
        resetLocalAuth({ removeMode: true, disableRefresh: false });
      } finally {
        if (active) {
          setBooting(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [applyLocalAccessToken, bumpAuthStamp, hydrateMeSafe, resetLocalAuth, setUser]);

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
  }, [user, bumpAuthStamp, setUser]);

  const loginWithGoogle = useCallback(
    async (remember = true) => {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);

      const authedUser = await exchangeAndHydrate(idToken, remember);
      return authedUser;
    },
    [exchangeAndHydrate]
  );

  const logout = useCallback(async () => {
    setRefreshDisabled(true);

    try {
      await apiLogout();
    } catch {
      // ignore
    }

    resetLocalAuth({ removeMode: true, disableRefresh: false });
    emitAuthEvent("logout");

    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
  }, [resetLocalAuth]);

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthed,
      loginWithGoogle,
      logout,
      setUser,
    }),
    [user, booting, isAuthed, loginWithGoogle, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}