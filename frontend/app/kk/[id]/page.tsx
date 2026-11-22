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

  // Modals state
  const [isEditIdentitasOpen, setIsEditIdentitasOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<AnggotaKeluarga> | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Deletion modals state
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

  // Save Identitas updates
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

  // Delete KK
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

  // Member management
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
        // Update member
        const res = await updateAnggota(formData.id, formData);
        addToast("success", res.message || "Data anggota berhasil diperbarui.");
      } else {
        // Add member
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
        <div className="w-10 h-10 mx-auto border-4 border-[var(--border-light)] border-t-[var(--border-strong)] rounded-full animate-spin mb-3" />
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
        <Link href="/kk" className="mono-btn-primary px-4 py-2 text-xs inline-block">
          ← Kembali ke Penelusuran KK
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--border-strong)] pb-4">
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
          <h1 className="font-extrabold text-2xl text-[var(--text-primary)] mt-1">
            Kartu Keluarga: {kkData.no_kk}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/kk" className="mono-btn-secondary px-4 py-2 text-xs font-mono-tech">
            ← Kembali ke Daftar
          </Link>
          <button
            type="button"
            onClick={() => setIsEditIdentitasOpen(true)}
            className="mono-btn-secondary px-4 py-2 text-xs font-mono-tech font-bold"
          >
            Edit Identitas KK
          </button>
          <button
            type="button"
            onClick={() => setDeletingKkConfirm(true)}
            className="px-4 py-2 text-xs font-mono-tech font-bold text-red-600 hover:bg-red-50 rounded border border-red-300"
          >
            Hapus KK
          </button>
        </div>
      </div>

      {/* CARD 1: IDENTITAS KK & ALAMAT */}
      <div className="mono-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--border-strong)] pb-3">
          <div>
            <h2 className="font-bold text-lg text-[var(--text-primary)]">
              {kkData.nama_kepala_keluarga}
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded font-mono-tech text-xs font-bold bg-[var(--bg-muted)] border border-[var(--border-mid)]">
            Dikeluarkan: {formatIndoDate(kkData.tanggal_dikeluarkan)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono-tech">
          <div>
            <span className="text-[var(--text-secondary)] block text-[11px]">Nomor KK:</span>
            <strong className="text-sm text-[var(--text-primary)]">{kkData.no_kk}</strong>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] block text-[11px]">Kepala Keluarga:</span>
            <strong className="text-sm text-[var(--text-primary)]">{kkData.nama_kepala_keluarga}</strong>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] block text-[11px]">RT / RW:</span>
            <strong className="text-sm text-[var(--text-primary)]">
              {kkData.rt || "000"} / {kkData.rw || "000"}
            </strong>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] block text-[11px]">Kode Pos:</span>
            <strong className="text-sm text-[var(--text-primary)]">{kkData.kode_pos || "-"}</strong>
          </div>

          <div className="sm:col-span-2">
            <span className="text-[var(--text-secondary)] block text-[11px]">Alamat Domisili:</span>
            <span className="font-bold text-[var(--text-primary)]">{kkData.alamat}</span>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] block text-[11px]">Kelurahan / Desa:</span>
            <span className="font-bold text-[var(--text-primary)]">{kkData.desa_kelurahan || "-"}</span>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] block text-[11px]">Kecamatan:</span>
            <span className="font-bold text-[var(--text-primary)]">{kkData.kecamatan || "-"}</span>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] block text-[11px]">Kabupaten / Kota:</span>
            <span className="font-bold text-[var(--text-primary)]">{kkData.kabupaten_kota || "-"}</span>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] block text-[11px]">Provinsi:</span>
            <span className="font-bold text-[var(--text-primary)]">{kkData.provinsi || "-"}</span>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] block text-[11px]">Tgl Simpan Database:</span>
            <span className="text-[var(--text-muted)]">{formatIndoDate(kkData.created_at)}</span>
          </div>
        </div>
      </div>

      {/* BERKAS ASLI PEMINDAIAN */}
      {kkData.gambar_url && (
        <div className="mono-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono-tech text-[10px] font-bold uppercase text-[var(--text-muted)]">
                ARSIP BERKAS ASLI PEMINDAIAN
              </span>
              <button
                type="button"
                onClick={() => setShowOriginalImage(!showOriginalImage)}
                className="text-[11px] font-mono-tech px-2.5 py-1 rounded border border-[var(--border-mid)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                {showOriginalImage ? "Sembunyikan Berkas ▲" : "Lihat Berkas Foto Kartu Keluarga ▼"}
              </button>
            </div>
            <a
              href={kkData.gambar_url.startsWith("http") ? kkData.gambar_url : `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}${kkData.gambar_url}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono-tech underline hover:text-[var(--text-primary)]"
            >
              Buka Gambar Resolusi Penuh ↗
            </a>
          </div>

          {showOriginalImage && (
            <div className="max-h-96 overflow-auto rounded border border-[var(--border-light)] bg-black/5 flex items-center justify-center p-2">
              <img
                src={kkData.gambar_url.startsWith("http") ? kkData.gambar_url : `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}${kkData.gambar_url}`}
                alt={`Arsip Foto KK ${kkData.no_kk}`}
                className="max-h-88 object-contain w-auto mx-auto shadow-sm"
              />
            </div>
          )}
        </div>
      )}

      {/* CARD 2: TABEL ANGGOTA KELUARGA */}
      <div className="mono-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--border-strong)] pb-3">
          <div>
            <h2 className="font-bold text-lg text-[var(--text-primary)]">
              Daftar Anggota Keluarga ({kkData.anggota?.length || 0} Jiwa)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
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
              onClick={handleOpenAddMember}
              className="mono-btn-primary px-3 py-1.5 text-xs font-mono-tech"
            >
              + Tambah Anggota
            </button>
          </div>
        </div>

        {/* Member Table */}
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
                    <th className="p-2.5">Tempat, Tgl Lahir</th>
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
                    <th className="p-2.5 text-center">Gol.</th>
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
              {!kkData.anggota || kkData.anggota.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-400 italic">
                    Belum ada anggota keluarga dalam data ini.
                  </td>
                </tr>
              ) : (
                kkData.anggota.map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-[var(--bg-subtle)]">
                    <td className="p-2.5 font-bold">{m.no_urut || idx + 1}</td>
                    <td className="p-2.5 font-bold">{m.nama_lengkap}</td>
                    <td className="p-2.5 font-bold">{m.nik}</td>

                    {activeTab === "ALL" && (
                      <>
                        <td className="p-2.5">{m.jenis_kelamin?.startsWith("P") ? "P" : "L"}</td>
                        <td className="p-2.5">
                          {m.tempat_lahir}, {formatIndoDate(m.tanggal_lahir)}
                        </td>
                        <td className="p-2.5 font-bold text-[var(--text-secondary)]">
                          {m.status_hubungan_dalam_keluarga}
                        </td>
                        <td className="p-2.5 truncate max-w-[120px]">{m.jenis_pekerjaan || "-"}</td>
                      </>
                    )}

                    {activeTab === "UPPER" && (
                      <>
                        <td className="p-2.5">{m.jenis_kelamin}</td>
                        <td className="p-2.5">{m.tempat_lahir}</td>
                        <td className="p-2.5">{formatIndoDate(m.tanggal_lahir)}</td>
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
                        onClick={() => handleOpenEditMember(m)}
                        className="mono-btn-secondary px-2.5 py-1 text-[11px] mr-1.5"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingMember(m)}
                        className="px-2.5 py-1 text-[11px] text-red-600 hover:bg-red-50 rounded border border-red-300"
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

      {/* Edit Identitas KK Modal */}
      <EditIdentitasModal
        isOpen={isEditIdentitasOpen}
        identitas={kkData}
        onClose={() => setIsEditIdentitasOpen(false)}
        onSave={handleSaveIdentitas}
      />

      {/* Edit / Add Member Modal */}
      <EditMemberModal
        isOpen={isMemberModalOpen}
        member={editingMember}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
      />

      {/* Confirm Delete KK Modal */}
      <ConfirmDeleteModal
        isOpen={deletingKkConfirm}
        title="Hapus Kartu Keluarga"
        message={`Apakah Anda yakin ingin menghapus Kartu Keluarga No. ${kkData.no_kk} atas nama ${kkData.nama_kepala_keluarga}? Tindakan ini akan menghapus seluruh data identitas dan ${kkData.anggota?.length || 0} orang anggota keluarga terkait.`}
        isDeleting={isDeletingKk}
        onClose={() => setDeletingKkConfirm(false)}
        onConfirm={handleConfirmDeleteKk}
      />

      {/* Confirm Delete Member Modal */}
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
