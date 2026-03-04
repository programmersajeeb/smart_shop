import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "../core/config/tokenStore";
import { ENV } from "../core/config/env";

const baseURL = (ENV.API_URL || "/api/v1").replace(/\/$/, "");

/**
 * api: main client used by the app for authenticated requests.
 * raw: bypasses interceptors (used for refresh/logout/firebase exchange).
 */
const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20_000,
});

const raw = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20_000,
});

/** ============================================================
 * ✅ Enterprise: Refresh spam guard (logout -> stop refresh calls)
 * ------------------------------------------------------------
 * - Logout করলে এই ট্যাবে refresh disable হবে
 * - refresh 401/403 হলে refresh disable হবে
 * - login/firebase exchange সফল হলে refresh enable হবে
 * ============================================================ */
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

// Attach access token on every request (if available)
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    config.headers = config.headers || {};
    config.headers.Accept = config.headers.Accept || "application/json";

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (err) => Promise.reject(err)
);

// Single-flight refresh (prevents multiple refresh calls in parallel)
let refreshPromise = null;

async function runRefresh() {
  // ✅ If user intentionally logged out (or refresh previously denied), do not hit server
  if (isRefreshDisabled()) return null;

  if (!refreshPromise) {
    refreshPromise = raw
      .post("/auth/refresh")
      .then((r) => r.data)
      .catch((err) => {
        const st = err?.response?.status;

        // ✅ If refresh cookie missing/expired -> stop future refresh attempts (no spam)
        if (st === 401 || st === 403) {
          setRefreshDisabled(true);
          return null;
        }

        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function shouldSkipAutoRefresh(url = "") {
  const u = String(url || "");
  // Avoid loops on auth endpoints
  return (
    u.includes("/auth/refresh") ||
    u.includes("/auth/logout") ||
    u.includes("/auth/firebase") ||
    u.includes("/auth/me")
  );
}

// Auto refresh on 401 once, then retry original request
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Network error / CORS / timeout (no response) -> just reject
    if (!error?.response) return Promise.reject(error);

    const status = error.response.status;
    const original = error.config;

    // Only handle 401 (unauthorized)
    if (!original || status !== 401) return Promise.reject(error);

    const url = String(original?.url || "");
    if (shouldSkipAutoRefresh(url)) return Promise.reject(error);

    // Prevent infinite retry loops
    if (original.__isRetryRequest) return Promise.reject(error);
    original.__isRetryRequest = true;

    try {
      const data = await runRefresh();

      if (data?.accessToken) {
        // ✅ If refresh worked, enable refresh again (safety)
        setRefreshDisabled(false);

        // Preserve existing token mode (session/local) when remember is not provided
        setAccessToken(data.accessToken);

        // Sync header defaults for stability
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;

        // Retry original request with the new token
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(original);
      }
    } catch (err) {
      // ✅ If refresh hard-failed with 401/403, disable further refresh
      const st = err?.response?.status;
      if (st === 401 || st === 403) setRefreshDisabled(true);
      // ignore and fallback below
    }

    // Refresh failed -> clear access token (do not force remove mode here)
    clearAccessToken();
    delete api.defaults.headers.common.Authorization;

    return Promise.reject(error);
  }
);

export async function exchangeFirebaseToken(idToken) {
  const token = String(idToken || "").trim();
  if (!token) throw new Error("Missing Firebase ID token.");

  const res = await raw.post(
    "/auth/firebase",
    { idToken: token },
    { headers: { "X-Firebase-Token": token } }
  );

  // ✅ Login success => allow refresh again
  setRefreshDisabled(false);

  return res.data; // { accessToken, user }
}

export async function fetchMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

export async function refreshAccessToken() {
  // ✅ Use guarded refresh (prevents spam when logged out)
  const data = await runRefresh();
  return data; // { accessToken } | null
}

export async function logout() {
  // ✅ Logout => stop refresh attempts in this tab (prevents console spam)
  setRefreshDisabled(true);

  // Also clear client token immediately (UX)
  clearAccessToken();
  delete api.defaults.headers.common.Authorization;

  const res = await raw.post("/auth/logout");
  return res.data;
}

// Backward compatible helper
export async function logoutSession() {
  try {
    // ✅ Same behavior here too
    setRefreshDisabled(true);
    clearAccessToken();
    delete api.defaults.headers.common.Authorization;

    await raw.post("/auth/logout");
  } catch {
    // ignore
  }
}

// Optional: export raw for rare cases (debug/tools)
export { raw };

// Export the same axios instance so the whole app can share it
export default api;
export { api };
