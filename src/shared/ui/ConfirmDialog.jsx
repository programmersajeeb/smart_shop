import React from "react";
import { X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  description = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger", // "danger" | "neutral"
  busy = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white"
      : "bg-black hover:bg-gray-900 text-white";

  return (
    <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border shadow-lg">
        <div className="p-5 border-b flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-gray-900">{title}</div>
            <div className="text-sm text-gray-600 mt-1">{description}</div>
          </div>
          <button type="button" className="p-2 rounded-2xl hover:bg-gray-50" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex items-center justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-2xl border hover:bg-gray-50"
            onClick={onClose}
            disabled={busy}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={["px-4 py-2 rounded-2xl", confirmClass].join(" ")}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
