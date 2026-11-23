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
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-auto max-w-sm w-full animate-in slide-in-from-bottom-2 duration-200"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`mono-card p-3.5 flex items-start gap-3 text-xs shadow-lg rounded-xl border ${
            t.type === "error"
              ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border-red-500/80"
              : t.type === "success"
              ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border-emerald-500/80"
              : "bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-mid)]"
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {t.type === "error" ? (
              <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : t.type === "success" ? (
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold block text-xs mb-0.5 text-[var(--text-primary)]">
              {t.type === "error" ? "Gagal" : t.type === "success" ? "Berhasil" : "Pemberitahuan"}
            </span>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed break-words">{t.message}</p>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            type="button"
            className="shrink-0 w-6 h-6 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] flex items-center justify-center transition-colors"
            title="Tutup"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
