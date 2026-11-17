"use client";

import { useEffect, useState } from "react";
import { IdentitasKK } from "@/types";

interface EditIdentitasModalProps {
  isOpen: boolean;
  identitas: IdentitasKK | null;
  onClose: () => void;
  onSave: (updated: Partial<IdentitasKK>) => void;
}

export default function EditIdentitasModal({
  isOpen,
  identitas,
  onClose,
  onSave,
}: EditIdentitasModalProps) {
  const [formData, setFormData] = useState<Partial<IdentitasKK>>({});

  useEffect(() => {
    if (identitas) {
      setFormData({ ...identitas });
    }
  }, [identitas, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !identitas) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="mono-card max-w-2xl w-full my-8 bg-[var(--bg-surface)] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[var(--bg-muted)] border-b-2 border-[var(--border-strong)] flex items-center justify-between">
          <div>
            <span className="font-mono-tech text-[10px] font-bold uppercase text-[var(--text-muted)]">
              KOREKSI IDENTITAS KK
            </span>
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              Ubah Data Kartu Keluarga &amp; Alamat
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="mono-btn-secondary px-2.5 py-1 text-xs font-mono-tech"
          >
            X [Esc]
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                NOMOR KARTU KELUARGA (16 DIGIT) *
              </label>
              <input
                required
                type="text"
                maxLength={16}
                value={formData.no_kk || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    no_kk: e.target.value.replace(/\D/g, "").slice(0, 16),
                  })
                }
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-mono-tech font-bold text-sm text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                NAMA KEPALA KELUARGA *
              </label>
              <input
                required
                type="text"
                value={formData.nama_kepala_keluarga || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nama_kepala_keluarga: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-bold text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
              ALAMAT LENGKAP *
            </label>
            <input
              required
              type="text"
              value={formData.alamat || ""}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs text-[var(--text-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                RT
              </label>
              <input
                type="text"
                maxLength={3}
                value={formData.rt || ""}
                onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-mono-tech text-xs"
              />
            </div>
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                RW
              </label>
              <input
                type="text"
                maxLength={3}
                value={formData.rw || ""}
                onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-mono-tech text-xs"
              />
            </div>
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                KODE POS
              </label>
              <input
                type="text"
                maxLength={5}
                value={formData.kode_pos || ""}
                onChange={(e) => setFormData({ ...formData, kode_pos: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-mono-tech text-xs"
              />
            </div>
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                TGL DIKELUARKAN
              </label>
              <input
                type="date"
                value={formData.tanggal_dikeluarkan || ""}
                onChange={(e) => setFormData({ ...formData, tanggal_dikeluarkan: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-mono-tech text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                DESA / KELURAHAN
              </label>
              <input
                type="text"
                value={formData.desa_kelurahan || ""}
                onChange={(e) =>
                  setFormData({ ...formData, desa_kelurahan: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
              />
            </div>
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                KECAMATAN
              </label>
              <input
                type="text"
                value={formData.kecamatan || ""}
                onChange={(e) =>
                  setFormData({ ...formData, kecamatan: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
              />
            </div>
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                KABUPATEN / KOTA
              </label>
              <input
                type="text"
                value={formData.kabupaten_kota || ""}
                onChange={(e) =>
                  setFormData({ ...formData, kabupaten_kota: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-light)]">
            <button
              onClick={onClose}
              type="button"
              className="mono-btn-secondary px-4 py-2 min-h-[38px] text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="mono-btn-primary px-5 py-2 min-h-[38px] text-xs font-bold"
            >
              Simpan Identitas KK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
