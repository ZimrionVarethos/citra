"use client";

import { useEffect } from "react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
    >
      <div className="mono-card max-w-md w-full bg-[var(--bg-surface)] overflow-hidden shadow-xl border border-[var(--border-mid)] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-[var(--bg-subtle)] border-b border-[var(--border-light)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">{title}</h3>
          </div>
          <button
            disabled={isDeleting}
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] flex items-center justify-center transition-colors"
            title="Tutup (Esc)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-[var(--text-secondary)] leading-relaxed">{message}</p>

          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex items-start gap-2.5 text-[11px] text-red-700 dark:text-red-300">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Tindakan ini bersifat permanen dan tidak dapat dibatalkan dari database.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-light)]">
            <button
              disabled={isDeleting}
              onClick={onClose}
              type="button"
              className="mono-btn-secondary px-4 py-2 text-xs font-medium"
            >
              Batal
            </button>
            <button
              disabled={isDeleting}
              onClick={onConfirm}
              type="button"
              className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Ya, Hapus Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
