import React from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, ShieldAlert, Info } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  description = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger", // "danger" | "neutral"
  busy = false,
  note = "",
  icon = null,
  onConfirm,
  onClose,
}) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  const toneMap = {
    danger: {
      confirmClass:
        "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      panelBorder: "border-rose-100",
      defaultIcon: <ShieldAlert size={18} />,
    },
    neutral: {
      confirmClass:
        "bg-gray-950 text-white hover:bg-black focus-visible:ring-gray-300",
      badgeClass: "border-gray-200 bg-gray-50 text-gray-700",
      panelBorder: "border-gray-200",
      defaultIcon: <Info size={18} />,
    },
  };

  const activeTone = toneMap[tone] || toneMap.danger;
  const headerIcon = icon || activeTone.defaultIcon;

  const dialog = (
    <div className="fixed inset-0 z-[10050]">
      <button
        type="button"
        aria-label="Close confirmation overlay"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={busy ? undefined : onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className={[
            "relative w-full max-w-xl overflow-hidden rounded-[32px] border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]",
            activeTone.panelBorder,
          ].join(" ")}
        >
          <div className="border-b border-gray-100 px-6 py-5 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                    activeTone.badgeClass,
                  ].join(" ")}
                >
                  {headerIcon}
                  <span>
                    {tone === "danger"
                      ? "Administrative confirmation"
                      : "Confirmation required"}
                  </span>
                </div>

                <h2
                  id="confirm-dialog-title"
                  className="mt-4 text-2xl font-semibold tracking-tight text-slate-900"
                >
                  {title}
                </h2>

                <p className="mt-3 text-[15px] leading-8 text-slate-600">
                  {description}
                </p>

                {note ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <span>{note}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onClose}
                aria-label="Close"
                disabled={busy}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 bg-slate-50/70 px-6 py-5 sm:px-7">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onClose}
              disabled={busy}
            >
              {cancelText}
            </button>

            <button
              type="button"
              className={[
                "rounded-2xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
                activeTone.confirmClass,
              ].join(" ")}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}