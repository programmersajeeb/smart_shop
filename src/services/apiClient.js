import axios from "axios";
import { ENV } from "../core/config/env";
import { getAccessToken, setAccessToken, clearAccessToken } from "../core/config/tokenStore";

const baseURL = ENV?.API_URL || import.meta.env.VITE_API_URL || "";

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

// Attach access token on every request (if available)
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    config.headers = config.headers || {};
    config.headers.Accept = config.headers.Accept || "application/json";

    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

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
  const u = String(url || "");
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
    if (!error?.response) return Promise.reject(error);

    const status = error.response.status;
    const original = error.config;

    if (!original || status !== 401) return Promise.reject(error);

    const url = String(original?.url || "");
    if (shouldSkipAutoRefresh(url)) return Promise.reject(error);

    if (original.__isRetryRequest) return Promise.reject(error);
    original.__isRetryRequest = true;

    try {
      const data = await runRefresh();

      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(original);
      }
    } catch {
      // ignore
    }

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

  return res.data; // { accessToken, user }
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

export async function logoutSession() {
  try {
    await raw.post("/auth/logout");
  } catch {
    // ignore
  }
}

export { raw };
export default api;
export { api };
