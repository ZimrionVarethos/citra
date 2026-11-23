"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import EditIdentitasModal from "@/components/EditIdentitasModal";
import Toast from "@/components/Toast";
import { deleteKk, getKkList, updateKk } from "@/lib/api";
import { formatIndoDate } from "@/lib/utils";
import { IdentitasKK, Pagination, ToastMessage } from "@/types";

export default function KkListPage() {
  const [dataList, setDataList] = useState<IdentitasKK[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [editingKk, setEditingKk] = useState<IdentitasKK | null>(null);
  const [deletingKk, setDeletingKk] = useState<IdentitasKK | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadData = useCallback(
    async (page: number = 1, query: string = "") => {
      try {
        setIsLoading(true);
        const res = await getKkList({ page, per_page: 10, q: query });
        setDataList(res.data);
        setPagination(res.pagination);
      } catch (err: any) {
        addToast("error", err?.error || "Gagal memuat daftar Kartu Keluarga dari database.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(1, debouncedQuery);
  }, [debouncedQuery, loadData]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.total_pages) return;
    loadData(newPage, debouncedQuery);
  };

  const handleSaveIdentitas = async (updated: Partial<IdentitasKK>) => {
    if (!editingKk?.id) return;
    try {
      const res = await updateKk(editingKk.id, updated);
      addToast("success", res.message || "Identitas KK berhasil diperbarui.");
      setEditingKk(null);
      loadData(pagination.page, debouncedQuery);
    } catch (err: any) {
      addToast("error", err?.error || "Gagal memperbarui Identitas KK.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingKk?.id) return;
    try {
      setIsDeleting(true);
      const res = await deleteKk(deletingKk.id);
      addToast("success", res.message || "Kartu Keluarga berhasil dihapus.");
      setDeletingKk(null);
      loadData(pagination.page, debouncedQuery);
    } catch (err: any) {
      addToast("error", err?.error || "Gagal menghapus Kartu Keluarga.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-light)] pb-5">
        <div>
          <h1 className="font-extrabold text-2xl text-[var(--text-primary)] tracking-tight">
            Data Kartu Keluarga Tersimpan
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Daftar Kartu Keluarga yang telah tersimpan di database lokal.
          </p>
        </div>

        <Link
          href="/"
          className="mono-btn-primary px-4 py-2 min-h-[40px] text-xs font-semibold inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Pindai KK Baru</span>
        </Link>
      </div>

      <div className="mono-card p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="searchKkInput"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan Nomor KK (16 digit), Nama Kepala Keluarga, atau Alamat..."
            className="mono-input pl-10 text-xs sm:text-sm font-medium"
          />
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mono-btn-secondary px-3 py-2 text-xs shrink-0 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="mono-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-light)] font-mono-tech uppercase text-[11px] text-[var(--text-secondary)]">
              <tr>
                <th className="p-3.5">No. KK (16 Digit)</th>
                <th className="p-3.5">Nama Kepala Keluarga</th>
                <th className="p-3.5">Alamat Domisili</th>
                <th className="p-3.5 text-center">Anggota</th>
                <th className="p-3.5">Tgl Dikeluarkan</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)] font-mono-tech">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[var(--text-muted)]">
                    <div className="w-7 h-7 mx-auto border-2 border-[var(--border-mid)] border-t-[var(--text-primary)] rounded-full animate-spin mb-2.5" />
                    Memuat data Kartu Keluarga dari database...
                  </td>
                </tr>
              ) : dataList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[var(--text-secondary)]">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-muted)] mb-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="font-bold text-sm mb-1 text-[var(--text-primary)]">Tidak ada data Kartu Keluarga ditemukan.</p>
                    <p className="text-xs mb-4 text-[var(--text-muted)] max-w-sm mx-auto">
                      {searchQuery
                        ? `Tidak ada hasil yang cocok dengan kata kunci "${searchQuery}".`
                        : "Basis data masih kosong. Silakan unggah atau pindai Kartu Keluarga terlebih dahulu."}
                    </p>
                    <Link href="/" className="mono-btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Pindai KK Sekarang</span>
                    </Link>
                  </td>
                </tr>
              ) : (
                dataList.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="p-3.5 font-bold text-sm">
                      <Link
                        href={`/kk/${item.id}`}
                        className="hover:underline text-[var(--text-primary)]"
                      >
                        {item.no_kk}
                      </Link>
                    </td>
                    <td className="p-3.5 font-bold">{item.nama_kepala_keluarga}</td>
                    <td className="p-3.5 text-[var(--text-secondary)] max-w-xs truncate">
                      {item.alamat}, RT {item.rt || "000"} / RW {item.rw || "000"},{" "}
                      {item.desa_kelurahan}, {item.kecamatan}, {item.kabupaten_kota}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-[var(--bg-subtle)] border border-[var(--border-mid)] text-[11px]">
                        {item.jumlah_anggota || 0}
                      </span>
                    </td>
                    <td className="p-3.5 text-[var(--text-secondary)]">
                      {formatIndoDate(item.tanggal_dikeluarkan)}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/kk/${item.id}`}
                        className="mono-btn-primary px-3 py-1 text-[11px] inline-block mr-1.5 font-medium"
                      >
                        Detail
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditingKk(item)}
                        className="mono-btn-secondary px-3 py-1 text-[11px] mr-1.5 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingKk(item)}
                        className="px-3 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/40 transition-colors"
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

        {pagination.total_pages > 1 && (
          <div className="p-3.5 bg-[var(--bg-subtle)] border-t border-[var(--border-light)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono-tech">
            <span className="text-[var(--text-secondary)]">
              Menampilkan Halaman <strong>{pagination.page}</strong> dari{" "}
              <strong>{pagination.total_pages}</strong> (Total <strong>{pagination.total}</strong> KK)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={!pagination.has_prev}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="mono-btn-secondary px-2.5 py-1 text-xs disabled:opacity-40 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Sebelumnya</span>
              </button>
              <button
                disabled={!pagination.has_next}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="mono-btn-secondary px-2.5 py-1 text-xs disabled:opacity-40 flex items-center gap-1"
              >
                <span>Berikutnya</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <EditIdentitasModal
        isOpen={!!editingKk}
        identitas={editingKk}
        onClose={() => setEditingKk(null)}
        onSave={handleSaveIdentitas}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingKk}
        title="Hapus Kartu Keluarga"
        message={`Apakah Anda yakin ingin menghapus data Kartu Keluarga No. ${deletingKk?.no_kk} atas nama ${deletingKk?.nama_kepala_keluarga}? Semua data anggota terkait akan ikut terhapus.`}
        isDeleting={isDeleting}
        onClose={() => setDeletingKk(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
