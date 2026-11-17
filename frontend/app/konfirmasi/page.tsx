"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EditMemberModal from "@/components/EditMemberModal";
import Toast from "@/components/Toast";
import { createKk } from "@/lib/api";
import { AnggotaKeluarga, ApiError, IdentitasKK, ToastMessage } from "@/types";

export default function KonfirmasiPage() {
  const router = useRouter();

  const [identitas, setIdentitas] = useState<IdentitasKK | null>(null);
  const [anggota, setAnggota] = useState<AnggotaKeluarga[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "UPPER" | "LOWER">("ALL");
  const [editingMemberIdx, setEditingMemberIdx] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check sessionStorage for OCR results
    const stored = sessionStorage.getItem("kk_ocr_pending_data");
    if (!stored) {
      router.replace("/");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!parsed.identitas) {
        router.replace("/");
        return;
      }
      setIdentitas(parsed.identitas);
      setAnggota(parsed.anggota || []);
    } catch {
      router.replace("/");
    }
  }, [router]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  if (!identitas) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center">
        <p className="font-mono-tech text-xs text-[var(--text-secondary)]">Memeriksa data OCR...</p>
      </div>
    );
  }

  // Client-side quick validator
  const isNoKkValid = identitas.no_kk && identitas.no_kk.length === 16;
  const isKepalaValid = !!identitas.nama_kepala_keluarga?.trim();
  const isAlamatValid = !!identitas.alamat?.trim();

  const handleIdentitasChange = (field: keyof IdentitasKK, value: string) => {
    setIdentitas((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAddMember = () => {
    setEditingMemberIdx(null);
    setIsModalOpen(true);
  };

  const handleEditMember = (idx: number) => {
    setEditingMemberIdx(idx);
    setIsModalOpen(true);
  };

  const handleDeleteMember = (idx: number) => {
    setAnggota((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      // Re-assign no_urut
      return updated.map((m, i) => ({ ...m, no_urut: i + 1 }));
    });
    addToast("info", "Baris anggota telah dihapus.");
  };

  const handleSaveMember = (updatedData: Partial<AnggotaKeluarga>) => {
    if (editingMemberIdx !== null) {
      // Update existing
      setAnggota((prev) => {
        const copy = [...prev];
        copy[editingMemberIdx] = { ...copy[editingMemberIdx], ...updatedData } as AnggotaKeluarga;
        return copy;
      });
      addToast("success", "Data anggota berhasil diperbarui.");
    } else {
      // Add new
      const newMember: AnggotaKeluarga = {
        no_urut: anggota.length + 1,
        nama_lengkap: updatedData.nama_lengkap || "",
        nik: updatedData.nik || "",
        jenis_kelamin: updatedData.jenis_kelamin || "LAKI-LAKI",
        tempat_lahir: updatedData.tempat_lahir || "",
        tanggal_lahir: updatedData.tanggal_lahir || "",
        agama: updatedData.agama || "ISLAM",
        pendidikan: updatedData.pendidikan || "",
        jenis_pekerjaan: updatedData.jenis_pekerjaan || "",
        golongan_darah: updatedData.golongan_darah || "-",
        status_perkawinan: updatedData.status_perkawinan || "BELUM KAWIN",
        status_hubungan_dalam_keluarga: updatedData.status_hubungan_dalam_keluarga || "ANAK",
        kewarganegaraan: updatedData.kewarganegaraan || "WNI",
        nama_ayah: updatedData.nama_ayah || "",
        nama_ibu: updatedData.nama_ibu || "",
      };
      setAnggota((prev) => [...prev, newMember]);
      addToast("success", "Anggota keluarga baru ditambahkan.");
    }
    setIsModalOpen(false);
  };

  const handleSaveToDatabase = async () => {
    // 1. Basic validation
    if (!isNoKkValid) {
      addToast("error", "Nomor KK harus tepat 16 digit angka.");
      return;
    }
    if (!isKepalaValid) {
      addToast("error", "Nama Kepala Keluarga wajib diisi.");
      return;
    }
    if (!isAlamatValid) {
      addToast("error", "Alamat domisili wajib diisi.");
      return;
    }
    if (anggota.length === 0) {
      addToast("error", "Kartu Keluarga minimal harus memiliki 1 anggota keluarga.");
      return;
    }

    // Check all members have 16 digit NIK and nama
    for (let i = 0; i < anggota.length; i++) {
      const m = anggota[i];
      if (!m.nama_lengkap?.trim()) {
        addToast("error", `Anggota baris #${i + 1} belum memiliki Nama Lengkap.`);
        return;
      }
      if (!m.nik || m.nik.length !== 16) {
        addToast("error", `NIK anggota '${m.nama_lengkap}' harus tepat 16 digit angka.`);
        return;
      }
    }

    try {
      setIsSaving(true);
      setFieldErrors({});

      const res = await createKk({
        identitas,
        anggota,
      });

      addToast("success", res.message || "Kartu Keluarga berhasil disimpan ke database!");
      sessionStorage.removeItem("kk_ocr_pending_data");

      // Redirect to KK detail view
      setTimeout(() => {
        router.push(`/kk/${res.data.id}`);
      }, 1000);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setIsSaving(false);
      if (apiErr.fields) {
        setFieldErrors(apiErr.fields);
      }
      addToast("error", apiErr.error || "Gagal menyimpan Kartu Keluarga ke database.");
    }
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--border-strong)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tech text-[var(--text-secondary)]">
            <Link href="/" className="hover:underline">
              Meja Pemindai
            </Link>
            <span>/</span>
            <span className="font-bold text-[var(--text-primary)]">Formulir Konfirmasi &amp; Edit</span>
          </div>
          <h1 className="font-extrabold text-2xl text-[var(--text-primary)] mt-1">
            Konfirmasi Hasil Ekstraksi OCR Kartu Keluarga
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/" className="mono-btn-secondary px-4 py-2 text-xs font-mono-tech">
            ← Kembali / Pindai Ulang
          </Link>
          <button
            disabled={isSaving}
            onClick={handleSaveToDatabase}
            className="mono-btn-primary px-5 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? "Menyimpan ke Database..." : "Simpan ke Database (POST /api/kk) ✓"}
          </button>
        </div>
      </div>

      {/* CARD 1: FORM EDITABLE IDENTITAS KK */}
      <div className="mono-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--border-strong)] pb-3">
          <div>
            <span className="font-mono-tech text-[10px] font-bold uppercase text-[var(--text-muted)]">
              BLANGKO DOKUMEN KEPENDUDUKAN (ZONA 01 &amp; 02)
            </span>
            <h2 className="font-bold text-lg text-[var(--text-primary)]">
              1. Identitas Kepala Keluarga &amp; Alamat Domisili
            </h2>
          </div>
          <span className="text-xs font-mono-tech text-[var(--text-secondary)]">
            Pastikan Nomor KK tepat 16 digit angka
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
              NOMOR KARTU KELUARGA (16 DIGIT) *
            </label>
            <input
              type="text"
              maxLength={16}
              value={identitas.no_kk || ""}
              onChange={(e) =>
                handleIdentitasChange("no_kk", e.target.value.replace(/\D/g, "").slice(0, 16))
              }
              className={`w-full px-3 py-2 min-h-[38px] rounded bg-[var(--bg-subtle)] border-2 font-mono-tech font-bold text-sm text-[var(--text-primary)] ${
                isNoKkValid ? "border-[var(--border-strong)]" : "border-red-500 bg-red-50 dark:bg-red-950/20"
              }`}
            />
            {!isNoKkValid && (
              <span className="text-[10px] font-mono-tech text-red-600 block mt-1">
                Wajib 16 digit ({identitas.no_kk?.length || 0}/16)
              </span>
            )}
            {fieldErrors.no_kk && (
              <span className="text-[10px] font-mono-tech text-red-600 block mt-1">
                {fieldErrors.no_kk}
              </span>
            )}
          </div>

          <div>
            <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
              NAMA KEPALA KELUARGA *
            </label>
            <input
              type="text"
              value={identitas.nama_kepala_keluarga || ""}
              onChange={(e) => handleIdentitasChange("nama_kepala_keluarga", e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 min-h-[38px] rounded bg-[var(--bg-subtle)] border-2 font-bold text-sm text-[var(--text-primary)] ${
                isKepalaValid ? "border-[var(--border-strong)]" : "border-red-500 bg-red-50 dark:bg-red-950/20"
              }`}
            />
            {!isKepalaValid && (
              <span className="text-[10px] font-mono-tech text-red-600 block mt-1">
                Nama Kepala Keluarga tidak boleh kosong
              </span>
            )}
          </div>

          <div>
            <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
              TANGGAL DIKELUARKAN
            </label>
            <input
              type="date"
              value={identitas.tanggal_dikeluarkan || ""}
              onChange={(e) => handleIdentitasChange("tanggal_dikeluarkan", e.target.value)}
              className="w-full px-3 py-2 min-h-[38px] rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-mono-tech text-xs text-[var(--text-primary)]"
            />
          </div>
        </div>

        <div>
          <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
            ALAMAT LENGKAP (JALAN / GANG / NO RUMAH) *
          </label>
          <input
            type="text"
            value={identitas.alamat || ""}
            onChange={(e) => handleIdentitasChange("alamat", e.target.value)}
            className={`w-full px-3 py-2 min-h-[38px] rounded bg-[var(--bg-subtle)] border-2 text-xs sm:text-sm text-[var(--text-primary)] ${
              isAlamatValid ? "border-[var(--border-strong)]" : "border-red-500 bg-red-50 dark:bg-red-950/20"
            }`}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
              RT
            </label>
            <input
              type="text"
              maxLength={3}
              value={identitas.rt || ""}
              onChange={(e) => handleIdentitasChange("rt", e.target.value)}
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
              value={identitas.rw || ""}
              onChange={(e) => handleIdentitasChange("rw", e.target.value)}
              className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-mono-tech text-xs"
            />
          </div>

          <div>
            <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
              DESA / KELURAHAN
            </label>
            <input
              type="text"
              value={identitas.desa_kelurahan || ""}
              onChange={(e) => handleIdentitasChange("desa_kelurahan", e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
            />
          </div>

          <div>
            <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
              KECAMATAN
            </label>
            <input
              type="text"
              value={identitas.kecamatan || ""}
              onChange={(e) => handleIdentitasChange("kecamatan", e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
            />
          </div>

          <div>
            <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
              KAB / KOTA
            </label>
            <input
              type="text"
              value={identitas.kabupaten_kota || ""}
              onChange={(e) => handleIdentitasChange("kabupaten_kota", e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs"
            />
          </div>

          <div>
            <label className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
              KODE POS
            </label>
            <input
              type="text"
              maxLength={5}
              value={identitas.kode_pos || ""}
              onChange={(e) => handleIdentitasChange("kode_pos", e.target.value)}
              className="w-full px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-mono-tech text-xs"
            />
          </div>
        </div>
      </div>

      {/* CARD 2: EDITABLE MEMBERS TABLE */}
      <div className="mono-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--border-strong)] pb-3">
          <div>
            <span className="font-mono-tech text-[10px] font-bold uppercase text-[var(--text-muted)]">
              TABEL ANGGOTA KELUARGA (ZONA 03 &amp; 04)
            </span>
            <h2 className="font-bold text-lg text-[var(--text-primary)]">
              2. Daftar Anggota Keluarga ({anggota.length} Orang)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Table view switcher */}
            <div className="inline-flex rounded border border-[var(--border-strong)] overflow-hidden text-xs font-mono-tech">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-3 py-1.5 font-bold ${
                  activeTab === "ALL"
                    ? "bg-[var(--bg-emphasis)] text-[var(--text-inverted)]"
                    : "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                }`}
              >
                Ringkasan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("UPPER")}
                className={`px-3 py-1.5 font-bold ${
                  activeTab === "UPPER"
                    ? "bg-[var(--bg-emphasis)] text-[var(--text-inverted)]"
                    : "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                }`}
              >
                Tabel Atas (TTL, Agama)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("LOWER")}
                className={`px-3 py-1.5 font-bold ${
                  activeTab === "LOWER"
                    ? "bg-[var(--bg-emphasis)] text-[var(--text-inverted)]"
                    : "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                }`}
              >
                Tabel Bawah (Relasi &amp; Ortu)
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddMember}
              className="mono-btn-primary px-3 py-1.5 text-xs font-mono-tech"
            >
              + Tambah Anggota
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto border border-[var(--border-strong)] rounded">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[var(--bg-muted)] border-b border-[var(--border-strong)] font-mono-tech uppercase text-[11px]">
              <tr>
                <th className="p-2.5">No</th>
                <th className="p-2.5">Nama Lengkap</th>
                <th className="p-2.5">NIK (16 Digit)</th>
                {activeTab === "ALL" && (
                  <>
                    <th className="p-2.5">JK</th>
                    <th className="p-2.5">Tgl Lahir</th>
                    <th className="p-2.5">Hubungan</th>
                    <th className="p-2.5">Pekerjaan</th>
                  </>
                )}
                {activeTab === "UPPER" && (
                  <>
                    <th className="p-2.5">JK</th>
                    <th className="p-2.5">Tempat Lahir</th>
                    <th className="p-2.5">Tgl Lahir</th>
                    <th className="p-2.5">Agama</th>
                    <th className="p-2.5">Pendidikan</th>
                    <th className="p-2.5">Gol. Darah</th>
                  </>
                )}
                {activeTab === "LOWER" && (
                  <>
                    <th className="p-2.5">Status Kawin</th>
                    <th className="p-2.5">Hubungan Keluarga</th>
                    <th className="p-2.5">Kewarganegaraan</th>
                    <th className="p-2.5">Nama Ayah</th>
                    <th className="p-2.5">Nama Ibu</th>
                  </>
                )}
                <th className="p-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)] font-mono-tech">
              {anggota.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-400 italic">
                    Belum ada anggota keluarga. Klik &quot;+ Tambah Anggota&quot; untuk menambahkan baris data.
                  </td>
                </tr>
              ) : (
                anggota.map((m, idx) => {
                  const isNikValid = m.nik && m.nik.length === 16;
                  const isNamaValid = !!m.nama_lengkap?.trim();

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-[var(--bg-subtle)] ${
                        !isNikValid || !isNamaValid ? "bg-red-50/50 dark:bg-red-950/20" : ""
                      }`}
                    >
                      <td className="p-2.5 font-bold">{m.no_urut || idx + 1}</td>
                      <td className="p-2.5 font-bold">
                        <span className={!isNamaValid ? "text-red-600 underline" : ""}>
                          {m.nama_lengkap || "(Nama Kosong)"}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold">
                        <span className={!isNikValid ? "text-red-600 font-bold underline" : ""}>
                          {m.nik || "(NIK Kosong)"}
                        </span>
                      </td>

                      {activeTab === "ALL" && (
                        <>
                          <td className="p-2.5">{m.jenis_kelamin?.startsWith("P") ? "P" : "L"}</td>
                          <td className="p-2.5">{m.tanggal_lahir || "-"}</td>
                          <td className="p-2.5 text-[var(--text-secondary)] font-bold">
                            {m.status_hubungan_dalam_keluarga || "-"}
                          </td>
                          <td className="p-2.5 truncate max-w-[120px]">{m.jenis_pekerjaan || "-"}</td>
                        </>
                      )}

                      {activeTab === "UPPER" && (
                        <>
                          <td className="p-2.5">{m.jenis_kelamin}</td>
                          <td className="p-2.5">{m.tempat_lahir || "-"}</td>
                          <td className="p-2.5">{m.tanggal_lahir || "-"}</td>
                          <td className="p-2.5">{m.agama || "-"}</td>
                          <td className="p-2.5">{m.pendidikan || "-"}</td>
                          <td className="p-2.5 text-center">{m.golongan_darah || "-"}</td>
                        </>
                      )}

                      {activeTab === "LOWER" && (
                        <>
                          <td className="p-2.5">{m.status_perkawinan || "-"}</td>
                          <td className="p-2.5 font-bold">{m.status_hubungan_dalam_keluarga || "-"}</td>
                          <td className="p-2.5">{m.kewarganegaraan || "WNI"}</td>
                          <td className="p-2.5">{m.nama_ayah || "-"}</td>
                          <td className="p-2.5">{m.nama_ibu || "-"}</td>
                        </>
                      )}

                      <td className="p-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditMember(idx)}
                          className="mono-btn-secondary px-2 py-1 text-[11px] mr-1"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(idx)}
                          className="px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 rounded border border-red-300"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-strong)]">
          <div className="text-xs font-mono-tech text-[var(--text-secondary)]">
            Total Anggota: <strong>{anggota.length}</strong> • Pastikan seluruh NIK 16 digit dan nama terisi dengan benar.
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className="mono-btn-secondary px-4 py-2 text-xs font-mono-tech">
              Batal
            </Link>
            <button
              disabled={isSaving}
              type="button"
              onClick={handleSaveToDatabase}
              className="mono-btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? "Menyimpan ke Database..." : "Simpan ke Database (POST /api/kk) →"}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={isModalOpen}
        member={editingMemberIdx !== null ? anggota[editingMemberIdx] : null}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMember}
      />
    </div>
  );
}
