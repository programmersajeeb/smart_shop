import { emitToast } from "./toastBus";

function make(type, message, opts = {}) {
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  emitToast({
    id,
    type,
    message: String(message || ""),
    title: opts.title ? String(opts.title) : "",
    durationMs: Number.isFinite(opts.durationMs) ? opts.durationMs : 3200,
  });
  return id;
}

export const toast = {
  success: (msg, opts) => make("success", msg, opts),
  error: (msg, opts) => make("error", msg, opts),
  info: (msg, opts) => make("info", msg, opts),
  warning: (msg, opts) => make("warning", msg, opts),
};
