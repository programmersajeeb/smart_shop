const KEY_TOKEN = "ss_access_token";
const KEY_MODE = "ss_access_token_mode"; // "local" | "session"

let accessToken = null;
// track where the current in-memory token is expected to live
let tokenSource = null; // "local" | "session" | "memory"

function getLocalStorage() {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function getSessionStorage() {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function safeGet(storage, key) {
  try {
    if (!storage) return null;
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(storage, key) {
  try {
    if (!storage) return;
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

function getStoredMode() {
  const ls = getLocalStorage();
  const m = safeGet(ls, KEY_MODE);
  return m === "session" || m === "local" ? m : null;
}

function setStoredMode(mode) {
  if (mode !== "session" && mode !== "local") return false;
  const ls = getLocalStorage();
  return safeSet(ls, KEY_MODE, mode);
}

function removeStoredMode() {
  const ls = getLocalStorage();
  safeRemove(ls, KEY_MODE);
}

function confirmWrite(mode, token) {
  const ls = getLocalStorage();
  const ss = getSessionStorage();

  if (mode === "local") return safeGet(ls, KEY_TOKEN) === token;
  if (mode === "session") return safeGet(ss, KEY_TOKEN) === token;
  return false;
}

export function getAccessToken() {
  // If we have a cached token, validate it against its expected storage.
  // This fixes multi-tab logout + stale memory token issues.
  if (accessToken) {
    if (tokenSource === "local") {
      const ls = getLocalStorage();
      const t = safeGet(ls, KEY_TOKEN);
      if (t === accessToken) return accessToken;

      accessToken = null;
      tokenSource = null;
    } else if (tokenSource === "session") {
      const ss = getSessionStorage();
      const t = safeGet(ss, KEY_TOKEN);
      if (t === accessToken) return accessToken;

      accessToken = null;
      tokenSource = null;
    } else {
      // memory-only (storage unavailable) -> keep
      return accessToken;
    }
  }

  const ss = getSessionStorage();
  const ls = getLocalStorage();

  // Session first (remember=false)
  const s = safeGet(ss, KEY_TOKEN);
  if (s) {
    accessToken = s;
    tokenSource = "session";
    setStoredMode("session");
    return accessToken;
  }

  // Then local (remember=true)
  const l = safeGet(ls, KEY_TOKEN);
  if (l) {
    accessToken = l;
    tokenSource = "local";
    setStoredMode("local");
    return accessToken;
  }

  accessToken = null;
  tokenSource = null;
  return null;
}

/**
 * setAccessToken(token, { remember?: boolean })
 * - remember=true  => localStorage
 * - remember=false => sessionStorage
 * - remember undefined => use stored mode (preferred) else fallback:
 *   - if session has token => session
 *   - else if local has token => local
 *   - else default => local
 */
export function setAccessToken(token, opts = {}) {
  const cleanToken = String(token || "").trim();

  const ls = getLocalStorage();
  const ss = getSessionStorage();

  if (!cleanToken) {
    accessToken = null;
    tokenSource = null;
    safeRemove(ls, KEY_TOKEN);
    safeRemove(ss, KEY_TOKEN);
    return;
  }

  accessToken = cleanToken;

  const remember = opts?.remember;

  let mode = null;

  if (remember === true) mode = "local";
  if (remember === false) mode = "session";

  // If remember not specified, use stored mode (survives restarts)
  if (!mode) {
    mode = getStoredMode();

    // Fallback: infer from existing storage
    if (!mode) {
      const hasSession = !!safeGet(ss, KEY_TOKEN);
      const hasLocal = !!safeGet(ls, KEY_TOKEN);

      if (hasSession) mode = "session";
      else if (hasLocal) mode = "local";
      else mode = "local";
    }
  }

  setStoredMode(mode);

  if (mode === "local") {
    safeSet(ls, KEY_TOKEN, cleanToken);
    safeRemove(ss, KEY_TOKEN);
  } else {
    safeSet(ss, KEY_TOKEN, cleanToken);
    safeRemove(ls, KEY_TOKEN);
  }

  // Confirm persistence; if storage write fails (private mode/quota),
  // keep token as memory-only so app can still work in this tab.
  if (confirmWrite(mode, cleanToken)) {
    tokenSource = mode;
  } else {
    tokenSource = "memory";
  }
}

/**
 * clearAccessToken({ removeMode?: boolean })
 * - removeMode=true will also delete the persisted mode key (recommended on logout)
 */
export function clearAccessToken(opts = {}) {
  accessToken = null;
  tokenSource = null;

  const ls = getLocalStorage();
  const ss = getSessionStorage();

  safeRemove(ls, KEY_TOKEN);
  safeRemove(ss, KEY_TOKEN);

  if (opts?.removeMode) {
    removeStoredMode();
  }
}

// Optional helper (guards/debug)
export function getAccessTokenMode() {
  return getStoredMode();
}