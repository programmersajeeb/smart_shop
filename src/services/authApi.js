import axios from "axios";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "../core/config/tokenStore";

const baseURL = import.meta.env.VITE_API_URL;

/**
 * api: main client used by the app for authenticated requests.
 * raw: bypasses interceptors (used for refresh/logout/firebase exchange).
 */
const api = axios.create({
  baseURL,
  withCredentials: true,
});

const raw = axios.create({
  baseURL,
  withCredentials: true,
});

// Attach access token on every request (if available)
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh (prevents multiple refresh calls in parallel)
let refreshPromise = null;

async function runRefresh() {
  if (!refreshPromise) {
    refreshPromise = raw
      .post("/auth/refresh")
      .then((r) => r.data)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function shouldSkipAutoRefresh(url = "") {
  // Avoid loops on auth endpoints
  return (
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout") ||
    url.includes("/auth/firebase")
  );
}

// Auto refresh on 401 once, then retry original request
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    if (!original || status !== 401) return Promise.reject(error);

    const url = String(original?.url || "");
    if (shouldSkipAutoRefresh(url)) return Promise.reject(error);

    // Prevent infinite retry loops
    if (original.__isRetryRequest) return Promise.reject(error);
    original.__isRetryRequest = true;

    try {
      const data = await runRefresh();

      if (data?.accessToken) {
        // Preserve existing token mode (session/local) when remember is not provided
        setAccessToken(data.accessToken);

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(original);
      }
    } catch {
      // ignore and fallback below
    }

    // Refresh failed -> clear access token (do not remove mode here)
    clearAccessToken();
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

  return res.data;
}

export async function fetchMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

export async function refreshAccessToken() {
  const res = await raw.post("/auth/refresh");
  return res.data; // { accessToken }
}

export async function logout() {
  const res = await raw.post("/auth/logout");
  return res.data;
}

// Backward compatible helper
export async function logoutSession() {
  try {
    await raw.post("/auth/logout");
  } catch {
    // ignore
  }
}

// Export the same axios instance so the whole app can share it
export default api;
export { api };
