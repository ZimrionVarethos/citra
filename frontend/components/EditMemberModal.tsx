"use client";

import { useEffect, useState } from "react";
import { AnggotaKeluarga } from "@/types";
import { decodeNik } from "@/lib/utils";

interface EditMemberModalProps {
  isOpen: boolean;
  member: Partial<AnggotaKeluarga> | null;
  onClose: () => void;
  onSave: (updated: Partial<AnggotaKeluarga>) => void;
}

export default function EditMemberModal({
  isOpen,
  member,
  onClose,
  onSave,
}: EditMemberModalProps) {
  const [formData, setFormData] = useState<Partial<AnggotaKeluarga>>({});
  const [nikMeta, setNikMeta] = useState<ReturnType<typeof decodeNik> | null>(null);

  useEffect(() => {
    if (member) {
      setFormData({ ...member });
      if (member.nik) {
        setNikMeta(decodeNik(member.nik));
      }
    } else {
      setFormData({
        no_urut: 1,
        nama_lengkap: "",
        nik: "",
        jenis_kelamin: "LAKI-LAKI",
        tempat_lahir: "",
        tanggal_lahir: "",
        agama: "ISLAM",
        pendidikan: "SLTA / SEDERAJAT",
        jenis_pekerjaan: "KARYAWAN SWASTA",
        golongan_darah: "-",
        status_perkawinan: "BELUM KAWIN",
        status_hubungan_dalam_keluarga: "KEPALA KELUARGA",
        kewarganegaraan: "WNI",
        nama_ayah: "",
        nama_ibu: "",
      });
      setNikMeta(null);
    }
  }, [member, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNikChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 16);
    const decoded = decodeNik(digitsOnly);
    setNikMeta(decoded);

    const updates: Partial<AnggotaKeluarga> = { nik: digitsOnly };
    if (decoded.valid) {
      if (decoded.gender) updates.jenis_kelamin = decoded.gender;
      if (decoded.birth_date) updates.tanggal_lahir = decoded.birth_date;
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  };

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
              KOREKSI ANGGOTA KELUARGA
            </span>
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              {formData.id ? "Edit Biodata Anggota" : "Tambah Anggota Keluarga"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mono-label">
                NAMA LENGKAP *
              </label>
              <input
                required
                type="text"
                value={formData.nama_lengkap || ""}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value.toUpperCase() })}
                placeholder="CONTOH: AHMAD FAUZI"
                className="mono-input font-bold"
              />
            </div>

            <div>
              <label className="mono-label">
                NIK (16 DIGIT) *
              </label>
              <input
                required
                type="text"
                maxLength={16}
                value={formData.nik || ""}
                onChange={(e) => handleNikChange(e.target.value)}
                placeholder="3271041205850001"
                className="mono-input font-mono-tech font-bold"
              />
              {nikMeta && (
                <div
                  className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-mono-tech ${
                    nikMeta.valid ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {nikMeta.valid ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Wilayah: {nikMeta.prov_code}.{nikMeta.city_code}.{nikMeta.district_code} &bull; {nikMeta.gender} &bull; Tgl: {nikMeta.birth_date}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{nikMeta.reason}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mono-label">
                JENIS KELAMIN *
              </label>
              <select
                value={formData.jenis_kelamin || "LAKI-LAKI"}
                onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                className="mono-input font-medium"
              >
                <option value="LAKI-LAKI">LAKI-LAKI</option>
                <option value="PEREMPUAN">PEREMPUAN</option>
              </select>
            </div>

            <div>
              <label className="mono-label">
                TEMPAT LAHIR *
              </label>
              <input
                required
                type="text"
                value={formData.tempat_lahir || ""}
                onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value.toUpperCase() })}
                placeholder="BOGOR"
                className="mono-input"
              />
            </div>

            <div>
              <label className="mono-label">
                TANGGAL LAHIR *
              </label>
              <input
                required
                type="date"
                value={formData.tanggal_lahir || ""}
                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                className="mono-input font-mono-tech"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="mono-label">AGAMA</label>
              <select
                value={formData.agama || "ISLAM"}
                onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                className="mono-input"
              >
                <option value="ISLAM">ISLAM</option>
                <option value="KRISTEN">KRISTEN</option>
                <option value="KATHOLIK">KATHOLIK</option>
                <option value="HINDU">HINDU</option>
                <option value="BUDDHA">BUDDHA</option>
                <option value="KONGHUCU">KONGHUCU</option>
                <option value="PENGHAYAT KEPERCAYAAN">PENGHAYAT</option>
              </select>
            </div>

            <div>
              <label className="mono-label">PENDIDIKAN</label>
              <input
                type="text"
                value={formData.pendidikan || ""}
                onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                placeholder="DIPLOMA IV / STRATA I"
                className="mono-input"
              />
            </div>

            <div>
              <label className="mono-label">PEKERJAAN</label>
              <input
                type="text"
                value={formData.jenis_pekerjaan || ""}
                onChange={(e) => setFormData({ ...formData, jenis_pekerjaan: e.target.value })}
                placeholder="KARYAWAN SWASTA"
                className="mono-input"
              />
            </div>

            <div>
              <label className="mono-label">GOL. DARAH</label>
              <select
                value={formData.golongan_darah || "-"}
                onChange={(e) => setFormData({ ...formData, golongan_darah: e.target.value })}
                className="mono-input font-mono-tech"
              >
                <option value="-">-</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mono-label">STATUS PERKAWINAN</label>
              <select
                value={formData.status_perkawinan || "BELUM KAWIN"}
                onChange={(e) => setFormData({ ...formData, status_perkawinan: e.target.value })}
                className="mono-input"
              >
                <option value="BELUM KAWIN">BELUM KAWIN</option>
                <option value="KAWIN TERCATAT">KAWIN TERCATAT</option>
                <option value="KAWIN BELUM TERCATAT">KAWIN BELUM TERCATAT</option>
                <option value="CERAI HIDUP">CERAI HIDUP</option>
                <option value="CERAI MATI">CERAI MATI</option>
              </select>
            </div>

            <div>
              <label className="mono-label">HUBUNGAN KELUARGA *</label>
              <select
                value={formData.status_hubungan_dalam_keluarga || "KEPALA KELUARGA"}
                onChange={(e) => setFormData({ ...formData, status_hubungan_dalam_keluarga: e.target.value })}
                className="mono-input font-bold"
              >
                <option value="KEPALA KELUARGA">KEPALA KELUARGA</option>
                <option value="SUAMI">SUAMI</option>
                <option value="ISTRI">ISTRI</option>
                <option value="ANAK">ANAK</option>
                <option value="MENANTU">MENANTU</option>
                <option value="CUCU">CUCU</option>
                <option value="ORANG TUA">ORANG TUA</option>
                <option value="MERTUA">MERTUA</option>
                <option value="FAMILI LAIN">FAMILI LAIN</option>
                <option value="LAINNYA">LAINNYA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mono-label">KEWARGANEGARAAN</label>
              <select
                value={formData.kewarganegaraan || "WNI"}
                onChange={(e) => setFormData({ ...formData, kewarganegaraan: e.target.value })}
                className="mono-input"
              >
                <option value="WNI">WNI</option>
                <option value="WNA">WNA</option>
              </select>
            </div>

            <div>
              <label className="mono-label">NAMA AYAH</label>
              <input
                type="text"
                value={formData.nama_ayah || ""}
                onChange={(e) => setFormData({ ...formData, nama_ayah: e.target.value.toUpperCase() })}
                placeholder="NAMA AYAH"
                className="mono-input"
              />
            </div>

            <div>
              <label className="mono-label">NAMA IBU</label>
              <input
                type="text"
                value={formData.nama_ibu || ""}
                onChange={(e) => setFormData({ ...formData, nama_ibu: e.target.value.toUpperCase() })}
                placeholder="NAMA IBU"
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
              <span>{formData.id ? "Simpan Perubahan" : "Tambahkan ke Tabel"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
