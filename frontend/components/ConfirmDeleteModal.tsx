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
      className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4"
    >
      <div className="mono-card max-w-md w-full bg-[var(--bg-surface)] overflow-hidden">
        <div className="p-4 bg-[var(--bg-muted)] border-b-2 border-[var(--border-strong)] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[var(--text-primary)]">{title}</h3>
          <button
            disabled={isDeleting}
            onClick={onClose}
            type="button"
            className="mono-btn-secondary px-2 py-0.5 text-xs font-mono-tech"
          >
            X [Esc]
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-[var(--text-secondary)] leading-relaxed">{message}</p>

          <div className="p-2.5 rounded bg-[var(--bg-muted)] border border-[var(--border-strong)] font-mono-tech text-[11px] text-red-600 dark:text-red-400">
            ⚠ Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              disabled={isDeleting}
              onClick={onClose}
              type="button"
              className="mono-btn-secondary px-4 py-2 text-xs"
            >
              Batal
            </button>
            <button
              disabled={isDeleting}
              onClick={onConfirm}
              type="button"
              className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded border border-[var(--border-strong)] hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
