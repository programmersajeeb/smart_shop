const KEY = "accessToken";
const subs = new Set();

export function getAccessToken() {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

export function setAccessToken(token) {
  const t = String(token || "");
  try {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  for (const fn of subs) fn(t);
}

export function clearAccessToken() {
  setAccessToken("");
}

export function subscribeToken(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
