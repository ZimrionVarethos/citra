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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="mono-card max-w-2xl w-full my-8 bg-[var(--bg-surface)] overflow-hidden shadow-2xl border border-[var(--border-mid)] animate-in fade-in zoom-in-95 duration-150">

        <div className="px-5 py-4 bg-[var(--bg-subtle)] border-b border-[var(--border-light)] flex items-center justify-between">
          <div>
            <span className="font-mono-tech text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              KOREKSI IDENTITAS KK
            </span>
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              Ubah Data Kartu Keluarga &amp; Alamat
            </h3>
          </div>
          <button
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mono-label">
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
                className="mono-input font-mono-tech font-bold"
              />
            </div>

            <div>
              <label className="mono-label">
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
                className="mono-input font-bold"
              />
            </div>
          </div>

          <div>
            <label className="mono-label">
              ALAMAT LENGKAP *
            </label>
            <input
              required
              type="text"
              value={formData.alamat || ""}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="mono-input"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="mono-label">RT</label>
              <input
                type="text"
                maxLength={3}
                value={formData.rt || ""}
                onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                className="mono-input font-mono-tech"
              />
            </div>
            <div>
              <label className="mono-label">RW</label>
              <input
                type="text"
                maxLength={3}
                value={formData.rw || ""}
                onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                className="mono-input font-mono-tech"
              />
            </div>
            <div>
              <label className="mono-label">KODE POS</label>
              <input
                type="text"
                maxLength={5}
                value={formData.kode_pos || ""}
                onChange={(e) => setFormData({ ...formData, kode_pos: e.target.value })}
                className="mono-input font-mono-tech"
              />
            </div>
            <div>
              <label className="mono-label">TGL DIKELUARKAN</label>
              <input
                type="date"
                value={formData.tanggal_dikeluarkan || ""}
                onChange={(e) => setFormData({ ...formData, tanggal_dikeluarkan: e.target.value })}
                className="mono-input font-mono-tech"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mono-label">DESA / KELURAHAN</label>
              <input
                type="text"
                value={formData.desa_kelurahan || ""}
                onChange={(e) =>
                  setFormData({ ...formData, desa_kelurahan: e.target.value.toUpperCase() })
                }
                className="mono-input"
              />
            </div>
            <div>
              <label className="mono-label">KECAMATAN</label>
              <input
                type="text"
                value={formData.kecamatan || ""}
                onChange={(e) =>
                  setFormData({ ...formData, kecamatan: e.target.value.toUpperCase() })
                }
                className="mono-input"
              />
            </div>
            <div>
              <label className="mono-label">KABUPATEN / KOTA</label>
              <input
                type="text"
                value={formData.kabupaten_kota || ""}
                onChange={(e) =>
                  setFormData({ ...formData, kabupaten_kota: e.target.value.toUpperCase() })
                }
                className="mono-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-light)]">
            <button
              onClick={onClose}
              type="button"
              className="mono-btn-secondary px-4 py-2 text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="mono-btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Simpan Identitas KK</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
