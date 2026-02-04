import axios from "axios";
import { ENV } from "../core/config/env";
import { getAccessToken, setAccessToken, clearAccessToken } from "../core/config/tokenStore";

/**
 * Main API client (authenticated requests)
 */
const api = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
});

/**
 * Raw client (no auth retry interceptor)
 * Use this for /auth/refresh, /auth/firebase, /auth/logout to avoid interceptor loops.
 */
const raw = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
});

/**
 * Attach access token (if available)
 */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Prevent multiple refresh requests in parallel (single-flight)
 */
let isRefreshing = false;
let queue = [];

/**
 * queue items: { resolve, reject }
 */
function flushQueue(err, token) {
  queue.forEach(({ resolve, reject }) => {
    if (err) reject(err);
    else resolve(token);
  });
  queue = [];
}

function shouldSkipAutoRefresh(url = "") {
  const u = String(url || "");
  return u.includes("/auth/refresh") || u.includes("/auth/firebase") || u.includes("/auth/logout");
}

/**
 * Auto refresh on 401 once, then retry original request.
 */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    // Network error / CORS / no response
    if (!original || !status) return Promise.reject(error);

    if (status !== 401) return Promise.reject(error);

    // Avoid loops for auth endpoints
    if (shouldSkipAutoRefresh(original?.url)) return Promise.reject(error);

    // Prevent infinite retry loops
    if (original.__isRetryRequest) return Promise.reject(error);
    original.__isRetryRequest = true;

    // If a refresh is already running, wait for it
    if (isRefreshing) {
      try {
        const token = await new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        });

        if (!token) return Promise.reject(error);

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    // Start refresh
    isRefreshing = true;

    try {
      const { data } = await raw.post("/auth/refresh");
      const newToken = data?.accessToken;

      if (!newToken) throw new Error("No accessToken returned from refresh");

      // Preserve token mode (session/local) if remember is not provided
      setAccessToken(newToken);

      flushQueue(null, newToken);

      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newToken}`;

      return api(original);
    } catch (e) {
      // Refresh failed => clear token (do not remove mode here)
      clearAccessToken();
      flushQueue(e, null);
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
export { api, raw };
