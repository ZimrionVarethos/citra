"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import EditIdentitasModal from "@/components/EditIdentitasModal";
import EditMemberModal from "@/components/EditMemberModal";
import Toast from "@/components/Toast";
import {
  addAnggota,
  deleteAnggota,
  deleteKk,
  getKkDetail,
  updateAnggota,
  updateKk,
} from "@/lib/api";
import { formatIndoDate } from "@/lib/utils";
import { AnggotaKeluarga, IdentitasKK, KkDetailResponse, ToastMessage } from "@/types";

export default function KkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kkId = Number(params?.id);

  const [kkData, setKkData] = useState<KkDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "UPPER" | "LOWER">("ALL");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showOriginalImage, setShowOriginalImage] = useState(false);

  const [isEditIdentitasOpen, setIsEditIdentitasOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<AnggotaKeluarga> | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const [isDeletingKk, setIsDeletingKk] = useState(false);
  const [deletingKkConfirm, setDeletingKkConfirm] = useState(false);
  const [deletingMember, setDeletingMember] = useState<AnggotaKeluarga | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const loadDetail = useCallback(async () => {
    if (!kkId) return;
    try {
      setIsLoading(true);
      const data = await getKkDetail(kkId);
      setKkData(data);
    } catch (err: any) {
      addToast("error", err?.error || "Gagal memuat detail Kartu Keluarga.");
    } finally {
      setIsLoading(false);
    }
  }, [kkId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSaveIdentitas = async (updated: Partial<IdentitasKK>) => {
    try {
      const res = await updateKk(kkId, updated);
      addToast("success", res.message || "Identitas KK berhasil diperbarui.");
      setIsEditIdentitasOpen(false);
      loadDetail();
    } catch (err: any) {
      addToast("error", err?.error || "Gagal memperbarui Identitas KK.");
    }
  };

  const handleConfirmDeleteKk = async () => {
    try {
      setIsDeletingKk(true);
      const res = await deleteKk(kkId);
      addToast("success", res.message || "Kartu Keluarga berhasil dihapus.");
      setTimeout(() => {
        router.push("/kk");
      }, 800);
    } catch (err: any) {
      addToast("error", err?.error || "Gagal menghapus Kartu Keluarga.");
    } finally {
      setIsDeletingKk(false);
    }
  };

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: AnggotaKeluarga) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (formData: Partial<AnggotaKeluarga>) => {
    try {
      if (formData.id) {

        const res = await updateAnggota(formData.id, formData);
        addToast("success", res.message || "Data anggota berhasil diperbarui.");
      } else {

        const res = await addAnggota(kkId, formData);
        addToast("success", res.message || "Anggota baru berhasil ditambahkan.");
      }
      setIsMemberModalOpen(false);
      loadDetail();
    } catch (err: any) {
      addToast("error", err?.error || "Gagal menyimpan data anggota.");
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!deletingMember?.id) return;
    try {
      setIsDeletingMember(true);
      const res = await deleteAnggota(deletingMember.id);
      addToast("success", res.message || "Anggota keluarga berhasil dihapus.");
      setDeletingMember(null);
      loadDetail();
    } catch (err: any) {
      addToast("error", err?.error || "Gagal menghapus anggota keluarga.");
    } finally {
      setIsDeletingMember(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center max-w-7xl mx-auto px-4">
        <div className="w-8 h-8 mx-auto border-2 border-[var(--border-light)] border-t-[var(--border-strong)] rounded-full animate-spin mb-3" />
        <p className="font-mono-tech text-xs text-[var(--text-secondary)]">
          Memuat rincian Kartu Keluarga ID #{kkId}...
        </p>
      </div>
    );
  }

  if (!kkData) {
    return (
      <div className="py-20 text-center max-w-7xl mx-auto px-4 space-y-4">
        <h2 className="font-bold text-xl text-[var(--text-primary)]">
          Kartu Keluarga Tidak Ditemukan
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Data dengan ID #{kkId} mungkin telah dihapus atau tidak pernah terdaftar.
        </p>
        <Link href="/kk" className="mono-btn-primary px-4 py-2 text-xs inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Penelusuran KK</span>
        </Link>
      </div>
    );
  }

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
            <Link href="/kk" className="hover:underline">
              Penelusuran KK
            </Link>
            <span>/</span>
            <span className="font-bold text-[var(--text-primary)]">ID #{kkData.id}</span>
          </div>
          <h1 className="font-extrabold text-2xl text-[var(--text-primary)] mt-1 tracking-tight">
            Kartu Keluarga: {kkData.no_kk}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/kk" className="mono-btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali ke Daftar</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsEditIdentitasOpen(true)}
            className="mono-btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit Identitas KK</span>
          </button>
          <button
            type="button"
            onClick={() => setDeletingKkConfirm(true)}
            className="px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/40 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Hapus KK</span>
          </button>
        </div>
      </div>

      <div className="mono-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-light)] pb-3.5">
          <div>
            <span className="font-mono-tech text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              KEPALA KELUARGA
            </span>
            <h2 className="font-bold text-xl text-[var(--text-primary)]">
              {kkData.nama_kepala_keluarga}
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full font-mono-tech text-xs font-medium bg-[var(--bg-subtle)] border border-[var(--border-mid)] text-[var(--text-secondary)]">
            Dikeluarkan: {formatIndoDate(kkData.tanggal_dikeluarkan)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono-tech">
          <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)]">
            <span className="text-[var(--text-muted)] block text-[11px]">Nomor KK:</span>
            <strong className="text-sm text-[var(--text-primary)]">{kkData.no_kk}</strong>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)]">
            <span className="text-[var(--text-muted)] block text-[11px]">Kepala Keluarga:</span>
            <strong className="text-sm text-[var(--text-primary)]">{kkData.nama_kepala_keluarga}</strong>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)]">
            <span className="text-[var(--text-muted)] block text-[11px]">RT / RW:</span>
            <strong className="text-sm text-[var(--text-primary)]">
              {kkData.rt || "000"} / {kkData.rw || "000"}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)]">
            <span className="text-[var(--text-muted)] block text-[11px]">Kode Pos:</span>
            <strong className="text-sm text-[var(--text-primary)]">{kkData.kode_pos || "-"}</strong>
          </div>

          <div className="sm:col-span-2 p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)]">
            <span className="text-[var(--text-muted)] block text-[11px]">Alamat Domisili:</span>
            <span className="font-bold text-[var(--text-primary)]">{kkData.alamat}</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)]">
            <span className="text-[var(--text-muted)] block text-[11px]">Kelurahan / Desa:</span>
            <span className="font-bold text-[var(--text-primary)]">{kkData.desa_kelurahan || "-"}</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)]">
            <span className="text-[var(--text-muted)] block text-[11px]">Kecamatan:</span>
            <span className="font-bold text-[var(--text-primary)]">{kkData.kecamatan || "-"}</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)]">
            <span className="text-[var(--text-muted)] block text-[11px]">Kabupaten / Kota:</span>
            <span className="font-bold text-[var(--text-primary)]">{kkData.kabupaten_kota || "-"}</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)]">
            <span className="text-[var(--text-muted)] block text-[11px]">Provinsi:</span>
            <span className="font-bold text-[var(--text-primary)]">{kkData.provinsi || "-"}</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)] sm:col-span-2">
            <span className="text-[var(--text-muted)] block text-[11px]">Tgl Simpan Database:</span>
            <span className="text-[var(--text-secondary)]">{formatIndoDate(kkData.created_at)}</span>
          </div>
        </div>
      </div>

      {kkData.gambar_url && (
        <div className="mono-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono-tech text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                ARSIP BERKAS ASLI PEMINDAIAN
              </span>
              <button
                type="button"
                onClick={() => setShowOriginalImage(!showOriginalImage)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-[var(--border-mid)] hover:bg-[var(--bg-subtle)] flex items-center gap-1.5 transition-colors"
              >
                <span>{showOriginalImage ? "Sembunyikan Berkas" : "Lihat Berkas Foto Kartu Keluarga"}</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${showOriginalImage ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <a
              href={kkData.gambar_url.startsWith("http") ? kkData.gambar_url : `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}${kkData.gambar_url}`}
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

          {showOriginalImage && (
            <div className="max-h-96 overflow-auto rounded-lg border border-[var(--border-light)] bg-black/5 dark:bg-black/40 flex items-center justify-center p-2">
              <img
                src={kkData.gambar_url.startsWith("http") ? kkData.gambar_url : `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}${kkData.gambar_url}`}
                alt={`Arsip Foto KK ${kkData.no_kk}`}
                className="max-h-88 object-contain w-auto mx-auto rounded shadow-sm"
              />
            </div>
          )}
        </div>
      )}

      <div className="mono-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-light)] pb-3.5">
          <div>
            <h2 className="font-bold text-base text-[var(--text-primary)]">
              Daftar Anggota Keluarga ({kkData.anggota?.length || 0} Jiwa)
            </h2>
          </div>

          <div className="flex items-center gap-2.5">

            <div className="inline-flex rounded-lg border border-[var(--border-mid)] p-0.5 bg-[var(--bg-subtle)] text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "ALL"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Ringkasan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("UPPER")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "UPPER"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Tabel Atas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("LOWER")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "LOWER"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Tabel Bawah
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenAddMember}
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
                    <th className="p-3">Tempat, Tgl Lahir</th>
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
                    <th className="p-3 text-center">Gol.</th>
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
              {!kkData.anggota || kkData.anggota.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-[var(--text-muted)] italic">
                    Belum ada anggota keluarga dalam data ini.
                  </td>
                </tr>
              ) : (
                kkData.anggota.map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="p-3 font-bold">{m.no_urut || idx + 1}</td>
                    <td className="p-3 font-bold">{m.nama_lengkap}</td>
                    <td className="p-3 font-bold">{m.nik}</td>

                    {activeTab === "ALL" && (
                      <>
                        <td className="p-3">{m.jenis_kelamin?.startsWith("P") ? "P" : "L"}</td>
                        <td className="p-3">
                          {m.tempat_lahir}, {formatIndoDate(m.tanggal_lahir)}
                        </td>
                        <td className="p-3 font-bold text-[var(--text-secondary)]">
                          {m.status_hubungan_dalam_keluarga}
                        </td>
                        <td className="p-3 truncate max-w-[140px]">{m.jenis_pekerjaan || "-"}</td>
                      </>
                    )}

                    {activeTab === "UPPER" && (
                      <>
                        <td className="p-3">{m.jenis_kelamin}</td>
                        <td className="p-3">{m.tempat_lahir}</td>
                        <td className="p-3">{formatIndoDate(m.tanggal_lahir)}</td>
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
                        onClick={() => handleOpenEditMember(m)}
                        className="mono-btn-secondary px-2.5 py-1 text-[11px] mr-1.5 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingMember(m)}
                        className="px-2.5 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/40 transition-colors"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditIdentitasModal
        isOpen={isEditIdentitasOpen}
        identitas={kkData}
        onClose={() => setIsEditIdentitasOpen(false)}
        onSave={handleSaveIdentitas}
      />

      <EditMemberModal
        isOpen={isMemberModalOpen}
        member={editingMember}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
      />

      <ConfirmDeleteModal
        isOpen={deletingKkConfirm}
        title="Hapus Kartu Keluarga"
        message={`Apakah Anda yakin ingin menghapus Kartu Keluarga No. ${kkData.no_kk} atas nama ${kkData.nama_kepala_keluarga}? Tindakan ini akan menghapus seluruh data identitas dan ${kkData.anggota?.length || 0} orang anggota keluarga terkait.`}
        isDeleting={isDeletingKk}
        onClose={() => setDeletingKkConfirm(false)}
        onConfirm={handleConfirmDeleteKk}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingMember}
        title="Hapus Anggota Keluarga"
        message={`Apakah Anda yakin ingin menghapus anggota keluarga '${deletingMember?.nama_lengkap}' (NIK: ${deletingMember?.nik}) dari Kartu Keluarga ini?`}
        isDeleting={isDeletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleConfirmDeleteMember}
      />
    </div>
  );
}
