import axios from "axios";
import { ENV } from "../core/config/env";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "../core/config/tokenStore";

const baseURL = String(import.meta.env.VITE_API_URL || ENV?.API_URL || "").replace(/\/$/, "");

const DEFAULT_TIMEOUT = 20_000;
const REFRESH_DISABLED_KEY = "smartshop_refresh_disabled_v1";

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: DEFAULT_TIMEOUT,
});

const raw = axios.create({
  baseURL,
  withCredentials: true,
  timeout: DEFAULT_TIMEOUT,
});

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
    // ignore storage errors
  }
}

function setDefaultAuthHeader(token) {
  const cleanToken = String(token || "").trim();

  if (cleanToken) {
    api.defaults.headers.common.Authorization = `Bearer ${cleanToken}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

function clearAuthState(options) {
  clearAccessToken(options);
  setDefaultAuthHeader("");
}

function persistAccessToken(token, options) {
  const cleanToken = String(token || "").trim();

  if (!cleanToken) {
    clearAuthState(options);
    return;
  }

  setAccessToken(cleanToken, options);
  setDefaultAuthHeader(cleanToken);
}

function getRequestToken() {
  return String(getAccessToken() || "").trim();
}

function shouldSkipAutoRefresh(url = "") {
  const value = String(url || "");
  return (
    value.includes("/auth/refresh") ||
    value.includes("/auth/logout") ||
    value.includes("/auth/firebase") ||
    value.includes("/auth/me")
  );
}

function isAuthFailureStatus(status) {
  return status === 401 || status === 403;
}

const initialToken = getRequestToken();
if (initialToken) {
  setDefaultAuthHeader(initialToken);
}

api.interceptors.request.use(
  (config) => {
    const token = getRequestToken();

    config.headers = config.headers || {};
    config.headers.Accept = config.headers.Accept || "application/json";

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers.Authorization) {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

async function runRefresh() {
  if (isRefreshDisabled()) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = raw
      .post("/auth/refresh")
      .then((response) => response.data)
      .catch((error) => {
        const status = error?.response?.status;

        if (isAuthFailureStatus(status)) {
          setRefreshDisabled(true);
          clearAuthState({ removeMode: true });
          return null;
        }

        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error?.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const originalRequest = error.config;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    if (shouldSkipAutoRefresh(originalRequest?.url)) {
      return Promise.reject(error);
    }

    if (originalRequest.__isRetryRequest) {
      return Promise.reject(error);
    }

    originalRequest.__isRetryRequest = true;

    try {
      const refreshData = await runRefresh();
      const newToken = String(refreshData?.accessToken || "").trim();

      if (!newToken) {
        clearAuthState({ removeMode: true });
        return Promise.reject(error);
      }

      setRefreshDisabled(false);
      persistAccessToken(newToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      const refreshStatus = refreshError?.response?.status;

      if (isAuthFailureStatus(refreshStatus)) {
        setRefreshDisabled(true);
      }

      clearAuthState({ removeMode: true });
      return Promise.reject(error);
    }
  }
);

export async function exchangeFirebaseToken(idToken, remember) {
  const token = String(idToken || "").trim();
  if (!token) {
    throw new Error("Missing Firebase ID token.");
  }

  const response = await raw.post(
    "/auth/firebase",
    { idToken: token },
    { headers: { "X-Firebase-Token": token } }
  );

  if (response?.data?.accessToken) {
    persistAccessToken(
      response.data.accessToken,
      remember !== undefined ? { remember } : undefined
    );
  }

  setRefreshDisabled(false);

  return response.data;
}

export async function fetchMe() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function refreshAccessToken() {
  const data = await runRefresh();

  if (data?.accessToken) {
    persistAccessToken(data.accessToken);
    setRefreshDisabled(false);
  } else {
    clearAuthState({ removeMode: true });
  }

  return data;
}

export async function ensureFreshAccessToken() {
  const existing = getRequestToken();

  if (!existing) {
    return null;
  }

  const data = await runRefresh();
  const token = String(data?.accessToken || "").trim();

  if (!token) {
    clearAuthState({ removeMode: true });
    return null;
  }

  persistAccessToken(token);
  setRefreshDisabled(false);
  return token;
}

export async function logout() {
  setRefreshDisabled(true);
  clearAuthState({ removeMode: true });

  try {
    const response = await raw.post("/auth/logout");
    return response.data;
  } finally {
    clearAuthState({ removeMode: true });
  }
}

export async function logoutSession() {
  setRefreshDisabled(true);
  clearAuthState({ removeMode: true });

  try {
    await raw.post("/auth/logout");
  } catch {
    // ignore logout errors
  } finally {
    clearAuthState({ removeMode: true });
  }
}

export { raw, api };
export default api;