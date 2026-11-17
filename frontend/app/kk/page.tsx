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

  // Modals state
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

  // Debounce search input
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

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[var(--border-strong)] pb-4">
        <div>
          <span className="font-mono-tech text-xs font-bold uppercase text-[var(--text-muted)] block mb-1">
            DATABASE KEPENDUDUKAN LOKAL
          </span>
          <h1 className="font-extrabold text-2xl text-[var(--text-primary)]">
            Penelusuran Data Kartu Keluarga
          </h1>
        </div>

        <Link
          href="/"
          className="mono-btn-primary px-4 py-2 min-h-[40px] text-xs font-bold inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+ Pindai / Unggah KK Baru</span>
        </Link>
      </div>

      {/* Search Input Bar */}
      <div className="mono-card p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <label htmlFor="searchKkInput" className="sr-only">
            Cari Nomor KK, Nama Kepala Keluarga, atau Alamat
          </label>
          <input
            id="searchKkInput"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan Nomor KK (16 digit), Nama Kepala Keluarga, atau Alamat..."
            className="w-full px-3.5 py-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs sm:text-sm font-medium text-[var(--text-primary)]"
          />
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mono-btn-secondary px-3 py-2 text-xs font-mono-tech shrink-0"
          >
            Reset Pencarian
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="mono-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[var(--bg-muted)] border-b-2 border-[var(--border-strong)] font-mono-tech uppercase text-[11px]">
              <tr>
                <th className="p-3">No. KK (16 Digit)</th>
                <th className="p-3">Nama Kepala Keluarga</th>
                <th className="p-3">Alamat Domisili</th>
                <th className="p-3 text-center">Anggota</th>
                <th className="p-3">Tgl Dikeluarkan</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)] font-mono-tech">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-500">
                    <div className="w-8 h-8 mx-auto border-2 border-[var(--border-mid)] border-t-[var(--border-strong)] rounded-full animate-spin mb-2" />
                    Memuat data Kartu Keluarga dari database...
                  </td>
                </tr>
              ) : dataList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[var(--text-secondary)]">
                    <p className="font-bold text-sm mb-1">Tidak ada data Kartu Keluarga ditemukan.</p>
                    <p className="text-xs mb-3">
                      {searchQuery
                        ? `Tidak ada hasil yang cocok dengan kata kunci "${searchQuery}".`
                        : "Basis data masih kosong. Silakan unggah atau pindai Kartu Keluarga terlebih dahulu."}
                    </p>
                    <Link href="/" className="mono-btn-primary px-4 py-2 text-xs inline-block">
                      Pindai KK Sekarang
                    </Link>
                  </td>
                </tr>
              ) : (
                dataList.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-subtle)]">
                    <td className="p-3 font-bold text-sm">
                      <Link
                        href={`/kk/${item.id}`}
                        className="hover:underline text-[var(--text-primary)]"
                      >
                        {item.no_kk}
                      </Link>
                    </td>
                    <td className="p-3 font-bold">{item.nama_kepala_keluarga}</td>
                    <td className="p-3 text-[var(--text-secondary)] max-w-xs truncate">
                      {item.alamat}, RT {item.rt || "000"} / RW {item.rw || "000"},{" "}
                      {item.desa_kelurahan}, {item.kecamatan}, {item.kabupaten_kota}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded font-bold bg-[var(--bg-muted)] border border-[var(--border-mid)]">
                        {item.jumlah_anggota || 0}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--text-secondary)]">
                      {formatIndoDate(item.tanggal_dikeluarkan)}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Link
                        href={`/kk/${item.id}`}
                        className="mono-btn-primary px-2.5 py-1 text-[11px] inline-block mr-1.5"
                      >
                        Detail
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditingKk(item)}
                        className="mono-btn-secondary px-2.5 py-1 text-[11px] mr-1.5"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingKk(item)}
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

        {/* Pagination Footer */}
        {pagination.total_pages > 1 && (
          <div className="p-3 bg-[var(--bg-muted)] border-t border-[var(--border-strong)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono-tech">
            <span className="text-[var(--text-secondary)]">
              Menampilkan Halaman <strong>{pagination.page}</strong> dari{" "}
              <strong>{pagination.total_pages}</strong> (Total <strong>{pagination.total}</strong> KK)
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={!pagination.has_prev}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="mono-btn-secondary px-3 py-1 disabled:opacity-50"
              >
                ← Sebelumnya
              </button>
              <span className="px-3 py-1 font-bold">
                {pagination.page} / {pagination.total_pages}
              </span>
              <button
                disabled={!pagination.has_next}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="mono-btn-secondary px-3 py-1 disabled:opacity-50"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditIdentitasModal
        isOpen={!!editingKk}
        identitas={editingKk}
        onClose={() => setEditingKk(null)}
        onSave={handleSaveIdentitas}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingKk}
        title="Konfirmasi Hapus Kartu Keluarga"
        message={`Apakah Anda yakin ingin menghapus Kartu Keluarga No. ${deletingKk?.no_kk} atas nama ${deletingKk?.nama_kepala_keluarga}? Seluruh data anggota keluarga yang terkait juga akan dihapus secara permanen.`}
        isDeleting={isDeleting}
        onClose={() => setDeletingKk(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
