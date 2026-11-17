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

  // Handle escape key
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

    // Auto-fill gender & DOB if valid
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
      className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="mono-card max-w-2xl w-full my-8 bg-[var(--bg-surface)] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-[var(--bg-muted)] border-b-2 border-[var(--border-strong)] flex items-center justify-between">
          <div>
            <span className="font-mono-tech text-[10px] font-bold uppercase text-[var(--text-muted)]">
              KOREKSI ANGGOTA KELUARGA
            </span>
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              {formData.id ? "Edit Biodata Anggota" : "Tambah Anggota Keluarga"}
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Row 1: Nama & NIK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                NAMA LENGKAP *
              </label>
              <input
                required
                type="text"
                value={formData.nama_lengkap || ""}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value.toUpperCase() })}
                placeholder="CONTOH: AHMAD FAUZI"
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-bold text-sm text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                NIK (16 DIGIT) *
              </label>
              <input
                required
                type="text"
                maxLength={16}
                value={formData.nik || ""}
                onChange={(e) => handleNikChange(e.target.value)}
                placeholder="3271041205850001"
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-mono-tech font-bold text-sm text-[var(--text-primary)]"
              />
              {nikMeta && (
                <span
                  className={`block mt-1 font-mono-tech text-[10px] ${
                    nikMeta.valid ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-red-600"
                  }`}
                >
                  {nikMeta.valid
                    ? `✓ Wilayah: ${nikMeta.prov_code}${nikMeta.city_code}${nikMeta.district_code} • ${nikMeta.gender} • Tgl: ${nikMeta.birth_date}`
                    : `⚠ ${nikMeta.reason}`}
                </span>
              )}
            </div>
          </div>

          {/* Row 2: JK & Tempat / Tanggal Lahir */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                JENIS KELAMIN *
              </label>
              <select
                value={formData.jenis_kelamin || "LAKI-LAKI"}
                onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-bold text-xs"
              >
                <option value="LAKI-LAKI">LAKI-LAKI</option>
                <option value="PEREMPUAN">PEREMPUAN</option>
              </select>
            </div>

            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                TEMPAT LAHIR *
              </label>
              <input
                required
                type="text"
                value={formData.tempat_lahir || ""}
                onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value.toUpperCase() })}
                placeholder="BOGOR"
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
              />
            </div>

            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                TANGGAL LAHIR (YYYY-MM-DD) *
              </label>
              <input
                required
                type="date"
                value={formData.tanggal_lahir || ""}
                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-mono-tech text-xs"
              />
            </div>
          </div>

          {/* Row 3: Agama, Pendidikan, Pekerjaan, Gol Darah */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                AGAMA
              </label>
              <select
                value={formData.agama || "ISLAM"}
                onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                className="w-full px-2 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
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
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                PENDIDIKAN
              </label>
              <input
                type="text"
                value={formData.pendidikan || ""}
                onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                placeholder="DIPLOMA IV / STRATA I"
                className="w-full px-2 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
              />
            </div>

            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                PEKERJAAN
              </label>
              <input
                type="text"
                value={formData.jenis_pekerjaan || ""}
                onChange={(e) => setFormData({ ...formData, jenis_pekerjaan: e.target.value })}
                placeholder="KARYAWAN SWASTA"
                className="w-full px-2 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
              />
            </div>

            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                GOL. DARAH
              </label>
              <select
                value={formData.golongan_darah || "-"}
                onChange={(e) => setFormData({ ...formData, golongan_darah: e.target.value })}
                className="w-full px-2 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs font-mono-tech"
              >
                <option value="-">-</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
          </div>

          {/* Row 4: Status Perkawinan & Hubungan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                STATUS PERKAWINAN
              </label>
              <select
                value={formData.status_perkawinan || "BELUM KAWIN"}
                onChange={(e) => setFormData({ ...formData, status_perkawinan: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
              >
                <option value="BELUM KAWIN">BELUM KAWIN</option>
                <option value="KAWIN TERCATAT">KAWIN TERCATAT</option>
                <option value="KAWIN BELUM TERCATAT">KAWIN BELUM TERCATAT</option>
                <option value="CERAI HIDUP">CERAI HIDUP</option>
                <option value="CERAI MATI">CERAI MATI</option>
              </select>
            </div>

            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                HUBUNGAN DALAM KELUARGA *
              </label>
              <select
                value={formData.status_hubungan_dalam_keluarga || "KEPALA KELUARGA"}
                onChange={(e) => setFormData({ ...formData, status_hubungan_dalam_keluarga: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs font-bold"
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

          {/* Row 5: Nama Ayah & Nama Ibu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                NAMA AYAH
              </label>
              <input
                type="text"
                value={formData.nama_ayah || ""}
                onChange={(e) => setFormData({ ...formData, nama_ayah: e.target.value.toUpperCase() })}
                placeholder="NAMA AYAH KANDUNG"
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
              />
            </div>

            <div>
              <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                NAMA IBU
              </label>
              <input
                type="text"
                value={formData.nama_ibu || ""}
                onChange={(e) => setFormData({ ...formData, nama_ibu: e.target.value.toUpperCase() })}
                placeholder="NAMA IBU KANDUNG"
                className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
              />
            </div>
          </div>

          {/* Modal Actions */}
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
              Simpan Data Anggota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
