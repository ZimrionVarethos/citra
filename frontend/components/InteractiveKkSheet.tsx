"use client";

import { useState } from "react";
import { AnggotaKeluarga, IdentitasKK } from "@/types";

interface InteractiveKkSheetProps {
  identitas: IdentitasKK;
  anggota: AnggotaKeluarga[];
  previewUrl?: string | null;
}

export default function InteractiveKkSheet({
  identitas,
  anggota,
  previewUrl,
}: InteractiveKkSheetProps) {
  const [viewMode, setViewMode] = useState<"facsimile" | "photo">("facsimile");

  return (
    <div className="space-y-3">
      {/* View Switcher */}
      {previewUrl && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono-tech text-[var(--text-secondary)] font-medium">
            Pratinjau Dokumen
          </span>
          <div className="inline-flex rounded border border-[var(--border-mid)] overflow-hidden font-mono-tech text-xs">
            <button
              type="button"
              onClick={() => setViewMode("facsimile")}
              className={`px-3 py-1 font-medium ${
                viewMode === "facsimile"
                  ? "bg-[var(--bg-emphasis)] text-[var(--text-inverted)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              Hasil Ekstraksi
            </button>
            <button
              type="button"
              onClick={() => setViewMode("photo")}
              className={`px-3 py-1 font-medium ${
                viewMode === "photo"
                  ? "bg-[var(--bg-emphasis)] text-[var(--text-inverted)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              Foto Dokumen Asli
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === "photo" && previewUrl ? (
        <div className="mono-card p-3 bg-zinc-950 flex flex-col items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Foto Kartu Keluarga Asli"
            className="max-h-[520px] w-auto object-contain rounded"
          />
        </div>
      ) : (
        <div className="mono-card p-5 space-y-4 bg-white text-zinc-900 border border-zinc-300 shadow-sm text-xs">
          {/* Header */}
          <div className="text-center border-b border-zinc-200 pb-3">
            <h2 className="text-xl font-bold tracking-tight">KARTU KELUARGA</h2>
            <p className="font-mono font-bold text-base mt-0.5">
              No. {identitas.no_kk || "—"}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[11px] leading-relaxed">
            <div>
              <span className="text-zinc-500">Nama Kepala Keluarga:</span>{" "}
              <strong>{identitas.nama_kepala_keluarga || "—"}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Desa/Kelurahan:</span>{" "}
              <strong>{identitas.desa_kelurahan || "—"}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Alamat:</span>{" "}
              <strong>{identitas.alamat || "—"}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Kecamatan:</span>{" "}
              <strong>{identitas.kecamatan || "—"}</strong>
            </div>
            <div>
              <span className="text-zinc-500">RT / RW:</span>{" "}
              <strong>
                {identitas.rt || "—"} / {identitas.rw || "—"}
              </strong>
            </div>
            <div>
              <span className="text-zinc-500">Kabupaten/Kota:</span>{" "}
              <strong>{identitas.kabupaten_kota || "—"}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Kode Pos:</span>{" "}
              <strong>{identitas.kode_pos || "—"}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Provinsi:</span>{" "}
              <strong>{identitas.provinsi || "—"}</strong>
            </div>
          </div>

          {/* Table Members */}
          <div className="overflow-x-auto border border-zinc-200 rounded">
            <table className="w-full text-left text-[11px] font-mono border-collapse">
              <thead className="bg-zinc-100 border-b border-zinc-200 uppercase text-[10px] text-zinc-600">
                <tr>
                  <th className="p-2 w-8 text-center">No</th>
                  <th className="p-2">Nama Lengkap</th>
                  <th className="p-2">NIK</th>
                  <th className="p-2">JK</th>
                  <th className="p-2">TTL</th>
                  <th className="p-2">Agama</th>
                  <th className="p-2">Pendidikan</th>
                  <th className="p-2">Hubungan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {anggota.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-zinc-400 italic">
                      Tidak ada data anggota keluarga.
                    </td>
                  </tr>
                ) : (
                  anggota.map((m, i) => (
                    <tr key={i} className="hover:bg-zinc-50">
                      <td className="p-2 text-center">{m.no_urut || i + 1}</td>
                      <td className="p-2 font-bold">{m.nama_lengkap || "—"}</td>
                      <td className="p-2">{m.nik || "—"}</td>
                      <td className="p-2">{m.jenis_kelamin?.startsWith("P") ? "P" : "L"}</td>
                      <td className="p-2">
                        {m.tempat_lahir || "—"}, {m.tanggal_lahir || "—"}
                      </td>
                      <td className="p-2">{m.agama || "—"}</td>
                      <td className="p-2">{m.pendidikan || "—"}</td>
                      <td className="p-2">{m.status_hubungan_dalam_keluarga || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-zinc-200 text-zinc-500">
            <span>
              Dikeluarkan Tanggal: <strong>{identitas.tanggal_dikeluarkan || "—"}</strong>
            </span>
            <span>Total: <strong>{anggota.length}</strong> Anggota</span>
          </div>
        </div>
      )}
    </div>
  );
}
