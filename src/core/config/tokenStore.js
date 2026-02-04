const KEY_TOKEN = "ss_access_token";
const KEY_MODE = "ss_access_token_mode"; // "local" | "session"

let accessToken = null;

function safeGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

function getStoredMode() {
  // Mode is stored in localStorage so it can survive browser restarts
  const m = safeGet(localStorage, KEY_MODE);
  return m === "session" || m === "local" ? m : null;
}

function setStoredMode(mode) {
  if (mode !== "session" && mode !== "local") return;
  safeSet(localStorage, KEY_MODE, mode);
}

export function getAccessToken() {
  if (accessToken) return accessToken;

  // Session first (remember=false)
  const s = safeGet(sessionStorage, KEY_TOKEN);
  if (s) {
    accessToken = s;
    setStoredMode("session");
    return accessToken;
  }

  // Then local (remember=true)
  const l = safeGet(localStorage, KEY_TOKEN);
  if (l) {
    accessToken = l;
    setStoredMode("local");
    return accessToken;
  }

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
  accessToken = token || null;

  if (!token) {
    safeRemove(localStorage, KEY_TOKEN);
    safeRemove(sessionStorage, KEY_TOKEN);
    return;
  }

  const remember = opts?.remember;

  let mode = null;

  if (remember === true) mode = "local";
  if (remember === false) mode = "session";

  // If remember not specified, use stored mode (survives restarts)
  if (!mode) {
    mode = getStoredMode();

    // Fallback: infer from existing storage
    if (!mode) {
      const hasSession = !!safeGet(sessionStorage, KEY_TOKEN);
      const hasLocal = !!safeGet(localStorage, KEY_TOKEN);

      if (hasSession) mode = "session";
      else if (hasLocal) mode = "local";
      else mode = "local";
    }
  }

  setStoredMode(mode);

  if (mode === "local") {
    safeSet(localStorage, KEY_TOKEN, token);
    safeRemove(sessionStorage, KEY_TOKEN);
  } else {
    safeSet(sessionStorage, KEY_TOKEN, token);
    safeRemove(localStorage, KEY_TOKEN);
  }
}

/**
 * clearAccessToken({ removeMode?: boolean })
 * - removeMode=true will also delete the persisted mode key (recommended on logout)
 */
export function clearAccessToken(opts = {}) {
  accessToken = null;
  safeRemove(localStorage, KEY_TOKEN);
  safeRemove(sessionStorage, KEY_TOKEN);

  if (opts?.removeMode) {
    safeRemove(localStorage, KEY_MODE);
  }
}

// Optional helper (sometimes useful in guards/debug)
export function getAccessTokenMode() {
  return getStoredMode();
}
