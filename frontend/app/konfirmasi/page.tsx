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
  const [catatan, setCatatan] = useState<string[]>([]);
  const [gambar, setGambar] = useState<string>("");
  const [gambarUrl, setGambarUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "UPPER" | "LOWER">("ALL");
  const [editingMemberIdx, setEditingMemberIdx] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {

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
      if (Array.isArray(parsed.catatan)) {
        setCatatan(parsed.catatan);
      }
      if (parsed.gambar) {
        setGambar(parsed.gambar);
      }
      if (parsed.gambar_url) {
        setGambarUrl(parsed.gambar_url);
      }
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

      return updated.map((m, i) => ({ ...m, no_urut: i + 1 }));
    });
    addToast("info", "Baris anggota telah dihapus.");
  };

  const handleSaveMember = (updatedData: Partial<AnggotaKeluarga>) => {
    if (editingMemberIdx !== null) {

      setAnggota((prev) => {
        const copy = [...prev];
        copy[editingMemberIdx] = { ...copy[editingMemberIdx], ...updatedData } as AnggotaKeluarga;
        return copy;
      });
      addToast("success", "Data anggota berhasil diperbarui.");
    } else {

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
        identitas: {
          ...identitas,
          gambar: gambar || identitas.gambar,
        },
        anggota,
        gambar: gambar || identitas.gambar,
      });

      addToast("success", res.message || "Kartu Keluarga berhasil disimpan ke database!");
      sessionStorage.removeItem("kk_ocr_pending_data");

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

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-light)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tech text-[var(--text-secondary)]">
            <Link href="/" className="hover:underline">
              Meja Pemindai
            </Link>
            <span>/</span>
            <span className="font-bold text-[var(--text-primary)]">Formulir Konfirmasi &amp; Edit</span>
          </div>
          <h1 className="font-extrabold text-2xl text-[var(--text-primary)] mt-1 tracking-tight">
            Konfirmasi Hasil Ekstraksi OCR Kartu Keluarga
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/" className="mono-btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Pindai Ulang</span>
          </Link>
          <button
            disabled={isSaving}
            onClick={handleSaveToDatabase}
            className="mono-btn-primary px-5 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan ke Database...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Simpan ke Database</span>
              </>
            )}
          </button>
        </div>
      </div>

      {catatan.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 text-xs font-mono-tech space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Catatan &amp; Diagnostik Mesin Pemindai ({catatan.length})</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Periksa kembali data yang ditandai sebelum menyimpan</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-amber-900/80 dark:text-amber-200/80">
            {catatan.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {gambarUrl && (
        <div className="mono-card p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-mono-tech text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                ARSIP CITRA YANG DIPINDAI
              </span>
              <button
                type="button"
                onClick={() => setShowImagePreview(!showImagePreview)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-[var(--border-mid)] hover:bg-[var(--bg-subtle)] flex items-center gap-1.5 transition-colors"
              >
                <span>{showImagePreview ? "Sembunyikan Gambar" : "Tampilkan Gambar"}</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${showImagePreview ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <a
              href={gambarUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1"
            >
              <span>Resolusi Penuh</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          {showImagePreview && (
            <div className="max-h-80 overflow-auto rounded-lg border border-[var(--border-light)] bg-black/5 dark:bg-black/40 flex items-center justify-center p-2">
              <img
                src={gambarUrl}
                alt="Hasil scan Kartu Keluarga"
                className="max-h-72 object-contain w-auto mx-auto rounded shadow-sm"
              />
            </div>
          )}
        </div>
      )}

      <div className="mono-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-light)] pb-3.5">
          <div>
            <h2 className="font-bold text-base text-[var(--text-primary)]">
              1. Identitas Kepala Keluarga &amp; Alamat Domisili
            </h2>
          </div>
          <span className="text-xs font-mono-tech text-[var(--text-secondary)]">
            Pastikan Nomor KK tepat 16 digit angka
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="mono-label">
              NOMOR KARTU KELUARGA (16 DIGIT) *
            </label>
            <input
              type="text"
              maxLength={16}
              value={identitas.no_kk || ""}
              onChange={(e) =>
                handleIdentitasChange("no_kk", e.target.value.replace(/\D/g, "").slice(0, 16))
              }
              className={`mono-input font-mono-tech font-bold text-sm ${!isNoKkValid ? "!border-red-500 !bg-red-50/50 dark:!bg-red-950/20" : ""
                }`}
            />
            {!isNoKkValid && (
              <span className="text-[10px] font-mono-tech text-red-600 block mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Wajib 16 digit ({identitas.no_kk?.length || 0}/16)</span>
              </span>
            )}
            {fieldErrors.no_kk && (
              <span className="text-[10px] font-mono-tech text-red-600 block mt-1">
                {fieldErrors.no_kk}
              </span>
            )}
          </div>

          <div>
            <label className="mono-label">
              NAMA KEPALA KELUARGA *
            </label>
            <input
              type="text"
              value={identitas.nama_kepala_keluarga || ""}
              onChange={(e) => handleIdentitasChange("nama_kepala_keluarga", e.target.value.toUpperCase())}
              className={`mono-input font-bold text-sm ${!isKepalaValid ? "!border-red-500 !bg-red-50/50 dark:!bg-red-950/20" : ""
                }`}
            />
            {!isKepalaValid && (
              <span className="text-[10px] font-mono-tech text-red-600 block mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Nama Kepala Keluarga tidak boleh kosong</span>
              </span>
            )}
          </div>

          <div>
            <label className="mono-label">
              TANGGAL DIKELUARKAN
            </label>
            <input
              type="date"
              value={identitas.tanggal_dikeluarkan || ""}
              onChange={(e) => handleIdentitasChange("tanggal_dikeluarkan", e.target.value)}
              className="mono-input font-mono-tech"
            />
          </div>
        </div>

        <div>
          <label className="mono-label">
            ALAMAT LENGKAP (JALAN / GANG / NO RUMAH) *
          </label>
          <input
            type="text"
            value={identitas.alamat || ""}
            onChange={(e) => handleIdentitasChange("alamat", e.target.value)}
            className={`mono-input ${!isAlamatValid ? "!border-red-500 !bg-red-50/50 dark:!bg-red-950/20" : ""
              }`}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="mono-label">RT</label>
            <input
              type="text"
              maxLength={3}
              value={identitas.rt || ""}
              onChange={(e) => handleIdentitasChange("rt", e.target.value)}
              className="mono-input font-mono-tech"
            />
          </div>

          <div>
            <label className="mono-label">RW</label>
            <input
              type="text"
              maxLength={3}
              value={identitas.rw || ""}
              onChange={(e) => handleIdentitasChange("rw", e.target.value)}
              className="mono-input font-mono-tech"
            />
          </div>

          <div>
            <label className="mono-label">DESA / KELURAHAN</label>
            <input
              type="text"
              value={identitas.desa_kelurahan || ""}
              onChange={(e) => handleIdentitasChange("desa_kelurahan", e.target.value.toUpperCase())}
              className="mono-input"
            />
          </div>

          <div>
            <label className="mono-label">KECAMATAN</label>
            <input
              type="text"
              value={identitas.kecamatan || ""}
              onChange={(e) => handleIdentitasChange("kecamatan", e.target.value.toUpperCase())}
              className="mono-input"
            />
          </div>

          <div>
            <label className="mono-label">KAB / KOTA</label>
            <input
              type="text"
              value={identitas.kabupaten_kota || ""}
              onChange={(e) => handleIdentitasChange("kabupaten_kota", e.target.value.toUpperCase())}
              className="mono-input"
            />
          </div>

          <div>
            <label className="mono-label">KODE POS</label>
            <input
              type="text"
              maxLength={5}
              value={identitas.kode_pos || ""}
              onChange={(e) => handleIdentitasChange("kode_pos", e.target.value)}
              className="mono-input font-mono-tech"
            />
          </div>
        </div>
      </div>

      <div className="mono-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-light)] pb-3.5">
          <div>
            <h2 className="font-bold text-base text-[var(--text-primary)]">
              2. Daftar Anggota Keluarga ({anggota.length} Orang)
            </h2>
          </div>

          <div className="flex items-center gap-2.5">

            <div className="inline-flex rounded-lg border border-[var(--border-mid)] p-0.5 bg-[var(--bg-subtle)] text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-3 py-1 rounded-md transition-colors ${activeTab === "ALL"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
              >
                Ringkasan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("UPPER")}
                className={`px-3 py-1 rounded-md transition-colors ${activeTab === "UPPER"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
              >
                Tabel Atas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("LOWER")}
                className={`px-3 py-1 rounded-md transition-colors ${activeTab === "LOWER"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
              >
                Tabel Bawah
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddMember}
              className="mono-btn-primary px-3 py-1.5 text-xs font-medium flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Anggota</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-[var(--border-light)] rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-light)] font-mono-tech uppercase text-[11px] text-[var(--text-secondary)]">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">NIK (16 Digit)</th>
                {activeTab === "ALL" && (
                  <>
                    <th className="p-3">JK</th>
                    <th className="p-3">Tgl Lahir</th>
                    <th className="p-3">Hubungan</th>
                    <th className="p-3">Pekerjaan</th>
                  </>
                )}
                {activeTab === "UPPER" && (
                  <>
                    <th className="p-3">JK</th>
                    <th className="p-3">Tempat Lahir</th>
                    <th className="p-3">Tgl Lahir</th>
                    <th className="p-3">Agama</th>
                    <th className="p-3">Pendidikan</th>
                    <th className="p-3">Gol. Darah</th>
                  </>
                )}
                {activeTab === "LOWER" && (
                  <>
                    <th className="p-3">Status Kawin</th>
                    <th className="p-3">Hubungan Keluarga</th>
                    <th className="p-3">Kewarganegaraan</th>
                    <th className="p-3">Nama Ayah</th>
                    <th className="p-3">Nama Ibu</th>
                  </>
                )}
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)] font-mono-tech">
              {anggota.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-[var(--text-muted)] italic">
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
                      className={`hover:bg-[var(--bg-subtle)] transition-colors ${!isNikValid || !isNamaValid ? "bg-red-50/40 dark:bg-red-950/20" : ""
                        }`}
                    >
                      <td className="p-3 font-bold">{m.no_urut || idx + 1}</td>
                      <td className="p-3 font-bold">
                        <span className={!isNamaValid ? "text-red-600 underline" : ""}>
                          {m.nama_lengkap || "(Nama Kosong)"}
                        </span>
                      </td>
                      <td className="p-3 font-bold">
                        <span className={!isNikValid ? "text-red-600 font-bold underline" : ""}>
                          {m.nik || "(NIK Kosong)"}
                        </span>
                      </td>

                      {activeTab === "ALL" && (
                        <>
                          <td className="p-3">{m.jenis_kelamin?.startsWith("P") ? "P" : "L"}</td>
                          <td className="p-3">{m.tanggal_lahir || "-"}</td>
                          <td className="p-3 text-[var(--text-secondary)] font-bold">
                            {m.status_hubungan_dalam_keluarga || "-"}
                          </td>
                          <td className="p-3 truncate max-w-[140px]">{m.jenis_pekerjaan || "-"}</td>
                        </>
                      )}

                      {activeTab === "UPPER" && (
                        <>
                          <td className="p-3">{m.jenis_kelamin}</td>
                          <td className="p-3">{m.tempat_lahir || "-"}</td>
                          <td className="p-3">{m.tanggal_lahir || "-"}</td>
                          <td className="p-3">{m.agama || "-"}</td>
                          <td className="p-3">{m.pendidikan || "-"}</td>
                          <td className="p-3 text-center">{m.golongan_darah || "-"}</td>
                        </>
                      )}

                      {activeTab === "LOWER" && (
                        <>
                          <td className="p-3">{m.status_perkawinan || "-"}</td>
                          <td className="p-3 font-bold">{m.status_hubungan_dalam_keluarga || "-"}</td>
                          <td className="p-3">{m.kewarganegaraan || "WNI"}</td>
                          <td className="p-3">{m.nama_ayah || "-"}</td>
                          <td className="p-3">{m.nama_ibu || "-"}</td>
                        </>
                      )}

                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditMember(idx)}
                          className="mono-btn-secondary px-2.5 py-1 text-[11px] mr-1.5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(idx)}
                          className="px-2.5 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/40 transition-colors"
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-light)]">
          <div className="text-xs font-mono-tech text-[var(--text-secondary)]">
            Total Anggota: <strong>{anggota.length}</strong> &bull; Pastikan seluruh NIK 16 digit dan nama terisi dengan benar.
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/" className="mono-btn-secondary px-4 py-2 text-xs">
              Batal
            </Link>
            <button
              disabled={isSaving}
              type="button"
              onClick={handleSaveToDatabase}
              className="mono-btn-primary px-6 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Simpan ke Database</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <EditMemberModal
        isOpen={isModalOpen}
        member={editingMemberIdx !== null ? anggota[editingMemberIdx] : null}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMember}
      />
    </div>
  );
}
