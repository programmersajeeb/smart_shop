// Simple event bus for toasts (works outside React too)
const listeners = new Set();

export function emitToast(event) {
  for (const fn of listeners) fn(event);
}

export function subscribeToast(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
