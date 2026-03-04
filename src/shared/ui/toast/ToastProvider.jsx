import React, { useEffect, useMemo, useState } from "react";
import { subscribeToast } from "./toastBus";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

function iconByType(type) {
  if (type === "success") return CheckCircle2;
  if (type === "error") return XCircle;
  if (type === "warning") return AlertTriangle;
  return Info;
}

function tone(type) {
  // soft + sweet: subtle backgrounds, clean borders
  if (type === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (type === "error") return "border-rose-200 bg-rose-50 text-rose-900";
  if (type === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-sky-200 bg-sky-50 text-sky-900";
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    return subscribeToast((ev) => {
      setItems((prev) => [...prev, ev]);
      const ms = ev.durationMs ?? 3200;
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== ev.id));
      }, ms);
    });
  }, []);

  const stack = useMemo(() => items.slice(-4), [items]);

  return (
    <>
      {children}

      <div className="fixed z-[9999] right-4 top-4 flex flex-col gap-3 w-[92vw] max-w-sm">
        {stack.map((t) => {
          const Icon = iconByType(t.type);
          return (
            <div
              key={t.id}
              className={[
                "rounded-2xl border shadow-sm backdrop-blur",
                "px-4 py-3 flex gap-3 items-start",
                "animate-[toastIn_.18s_ease-out]",
                tone(t.type),
              ].join(" ")}
              role="status"
              aria-live="polite"
            >
              <div className="mt-0.5">
                <Icon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                {t.title ? (
                  <div className="text-sm font-semibold leading-5">{t.title}</div>
                ) : null}
                <div className="text-sm leading-5 break-words">{t.message}</div>
              </div>

              <button
                type="button"
                className="p-1 rounded-xl hover:bg-black/5"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <style>
        {`@keyframes toastIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}
      </style>
    </>
  );
}
