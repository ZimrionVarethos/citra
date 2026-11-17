"use client";

import { ToastMessage } from "@/types";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-auto max-w-sm w-full"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`mono-card p-3 flex items-start justify-between gap-3 text-xs font-mono-tech ${
            t.type === "error"
              ? "bg-[#09090B] text-[#FAFAFA] border-2 border-red-500"
              : t.type === "success"
              ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border-2 border-emerald-600"
              : "bg-[var(--bg-surface)] text-[var(--text-primary)]"
          }`}
        >
          <div className="flex-1">
            <span className="font-bold block uppercase mb-0.5">
              {t.type === "error" ? "Gagal" : t.type === "success" ? "Berhasil" : "Info"}
            </span>
            <p className="text-[11px] leading-relaxed break-words">{t.message}</p>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            type="button"
            className="text-xs px-1 font-bold opacity-75 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
