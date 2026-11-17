"use client";

import { useState } from "react";
import { AnggotaKeluarga, IdentitasKK } from "@/types";

interface InteractiveKkSheetProps {
  identitas: IdentitasKK;
  anggota: AnggotaKeluarga[];
  previewUrl?: string | null;
  activeZone?: string;
  onSelectZone?: (zone: string) => void;
  zoneScores?: number[];
}

export default function InteractiveKkSheet({
  identitas,
  anggota,
  previewUrl,
  activeZone = "ALL",
  onSelectZone,
  zoneScores = [99.4, 98.8, 98.2, 97.5, 99.0],
}: InteractiveKkSheetProps) {
  const [laserActive, setLaserActive] = useState(true);
  const [showOriginalScan, setShowOriginalScan] = useState(false);

  return (
    <div className="space-y-3 select-none">
      {/* Viewport Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono-tech font-bold uppercase text-[var(--text-secondary)]">
          PRATINJAU LEMBAR KARTU KELUARGA
        </span>
        <div className="flex items-center gap-1.5 font-mono-tech text-[11px]">
          {previewUrl && (
            <button
              type="button"
              onClick={() => setShowOriginalScan(!showOriginalScan)}
              className="mono-btn-secondary px-2.5 py-1"
            >
              {showOriginalScan ? "Lihat Facsimile" : "Lihat Foto Asli"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setLaserActive(!laserActive)}
            className="mono-btn-secondary px-2.5 py-1"
          >
            {laserActive ? "Jeda Laser" : "Putar Laser"}
          </button>
        </div>
      </div>

      {/* Dark Scanner Bed */}
      <div className="p-3 sm:p-4 rounded-xl bg-[#18181B] border-2 border-[var(--border-strong)] overflow-hidden">
        {showOriginalScan && previewUrl ? (
          <div className="rounded border border-white/20 bg-black p-2 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Pratinjau scan KK asli"
              className="max-h-[500px] w-auto mx-auto object-contain rounded"
            />
            <p className="text-[11px] font-mono-tech text-zinc-300 mt-2">
              Citra Dokumen Asli Pengguna
            </p>
          </div>
        ) : (
          <div className="relative bg-white text-[#09090B] rounded border-2 border-[#09090B] p-3 sm:p-4 shadow-lg overflow-hidden">
            {/* Animated Laser Bar */}
            {laserActive && <div className="ocr-laser-line" />}

            {/* ZONA 1: HEADER & NOMOR KK */}
            <div
              onClick={() => onSelectZone?.("NOKK")}
              className={`ocr-zone-box p-2.5 mb-2.5 ${
                activeZone === "NOKK" || activeZone === "ALL" ? "active-zone" : "opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 shrink-0"
                    viewBox="0 0 40 40"
                    fill="none"
                  >
                    <circle cx="20" cy="20" r="18" stroke="#09090B" strokeWidth="2" fill="#F4F4F5" />
                    <path d="M10 18L20 9L30 18L26 29H14L10 18Z" fill="#09090B" />
                    <rect x="16" y="16" width="8" height="9" fill="#FFFFFF" />
                  </svg>
                  <div className="leading-tight">
                    <span className="block text-[9px] font-mono-tech font-bold uppercase text-zinc-600">
                      REPUBLIK INDONESIA
                    </span>
                    <span className="block text-[10px] font-bold uppercase text-[#09090B]">
                      DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL
                    </span>
                  </div>
                </div>

                <span className="px-1.5 py-0.5 rounded bg-[#09090B] text-white font-mono-tech text-[9px] font-bold">
                  ZONA 01 • {zoneScores[0] || 99.4}%
                </span>
              </div>

              <div className="text-center mt-2 pt-1.5 border-t border-zinc-300">
                <p className="font-extrabold text-sm sm:text-base tracking-widest uppercase">
                  KARTU KELUARGA
                </p>
                <p className="font-mono-tech font-bold text-xs sm:text-sm tracking-wider mt-0.5">
                  No. {identitas.no_kk || "3271041508190004"}
                </p>
              </div>
            </div>

            {/* ZONA 2: METADATA KEPALA KELUARGA & ALAMAT */}
            <div
              onClick={() => onSelectZone?.("METADATA")}
              className={`ocr-zone-box p-2.5 mb-2.5 bg-zinc-50 text-[10px] sm:text-[11px] ${
                activeZone === "METADATA" || activeZone === "ALL" ? "active-zone" : "opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono-tech font-bold text-[9px] uppercase text-zinc-600">
                  IDENTITAS WILAYAH &amp; KEPALA KELUARGA
                </span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono-tech text-[9px] font-bold">
                  ZONA 02 • {zoneScores[1] || 98.8}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono-tech text-[10px]">
                <div>
                  <span className="text-zinc-500">Nama Kepala Keluarga:</span>{" "}
                  <strong className="block text-[#09090B] truncate">
                    {identitas.nama_kepala_keluarga || "-"}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500">Kecamatan:</span>{" "}
                  <strong className="block text-[#09090B] truncate">
                    {identitas.kecamatan || "-"}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500">Alamat:</span>{" "}
                  <strong className="block text-[#09090B] truncate">
                    {identitas.alamat || "-"}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500">Kabupaten/Kota:</span>{" "}
                  <strong className="block text-[#09090B] truncate">
                    {identitas.kabupaten_kota || "-"}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500">RT/RW:</span>{" "}
                  <strong className="block text-[#09090B]">
                    {identitas.rt || "000"} / {identitas.rw || "000"}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500">Kode Pos:</span>{" "}
                  <strong className="block text-[#09090B]">
                    {identitas.kode_pos || "-"}
                  </strong>
                </div>
              </div>
            </div>

            {/* ZONA 3: TABEL ATAS (BIODATA & NIK) */}
            <div
              onClick={() => onSelectZone?.("TABEL_ATAS")}
              className={`ocr-zone-box p-2 mb-2.5 ${
                activeZone === "TABEL_ATAS" || activeZone === "ALL" ? "active-zone" : "opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono-tech font-bold text-[9px] uppercase text-zinc-600">
                  TABEL ATAS (BIODATA, NIK, TTL, PENDIDIKAN, PEKERJAAN)
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#09090B] text-white font-mono-tech text-[9px] font-bold">
                  ZONA 03 • {zoneScores[2] || 98.2}%
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-zinc-400 text-[9px] font-mono-tech">
                  <thead>
                    <tr className="bg-zinc-200 text-[#09090B]">
                      <th className="border border-zinc-400 px-1 py-0.5">No</th>
                      <th className="border border-zinc-400 px-1.5 py-0.5 text-left">Nama Lengkap</th>
                      <th className="border border-zinc-400 px-1.5 py-0.5 text-left">NIK (16 Digit)</th>
                      <th className="border border-zinc-400 px-1 py-0.5">JK</th>
                      <th className="border border-zinc-400 px-1.5 py-0.5 text-left">Tempat/Tgl Lahir</th>
                      <th className="border border-zinc-400 px-1.5 py-0.5 text-left">Pekerjaan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anggota.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-2 text-zinc-400 italic">
                          (Belum ada data anggota)
                        </td>
                      </tr>
                    ) : (
                      anggota.map((m, idx) => (
                        <tr key={idx} className="hover:bg-zinc-100">
                          <td className="border border-zinc-300 text-center px-1 py-0.5">{m.no_urut || idx + 1}</td>
                          <td className="border border-zinc-300 px-1.5 py-0.5 font-bold truncate max-w-[120px]">
                            {m.nama_lengkap || "-"}
                          </td>
                          <td className="border border-zinc-300 px-1.5 py-0.5 font-bold">
                            {m.nik || "-"}
                          </td>
                          <td className="border border-zinc-300 text-center px-1 py-0.5">
                            {m.jenis_kelamin?.startsWith("P") ? "P" : "L"}
                          </td>
                          <td className="border border-zinc-300 px-1.5 py-0.5 truncate max-w-[100px]">
                            {m.tempat_lahir || "-"}, {m.tanggal_lahir || "-"}
                          </td>
                          <td className="border border-zinc-300 px-1.5 py-0.5 truncate max-w-[100px]">
                            {m.jenis_pekerjaan || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ZONA 4: TABEL BAWAH (STATUS KAWIN, RELASI & ORANG TUA) */}
            <div
              onClick={() => onSelectZone?.("TABEL_BAWAH")}
              className={`ocr-zone-box p-2 mb-2.5 ${
                activeZone === "TABEL_BAWAH" || activeZone === "ALL" ? "active-zone" : "opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono-tech font-bold text-[9px] uppercase text-zinc-600">
                  TABEL BAWAH (STATUS KAWIN, HUBUNGAN KELUARGA &amp; ORANG TUA)
                </span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono-tech text-[9px] font-bold">
                  ZONA 04 • {zoneScores[3] || 97.5}%
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-zinc-400 text-[9px] font-mono-tech">
                  <thead>
                    <tr className="bg-zinc-200 text-[#09090B]">
                      <th className="border border-zinc-400 px-1 py-0.5">No</th>
                      <th className="border border-zinc-400 px-1.5 py-0.5 text-left">Status Kawin</th>
                      <th className="border border-zinc-400 px-1.5 py-0.5 text-left">Hubungan Keluarga</th>
                      <th className="border border-zinc-400 px-1.5 py-0.5 text-left">Nama Ayah</th>
                      <th className="border border-zinc-400 px-1.5 py-0.5 text-left">Nama Ibu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anggota.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-2 text-zinc-400 italic">
                          (Belum ada data anggota)
                        </td>
                      </tr>
                    ) : (
                      anggota.map((m, idx) => (
                        <tr key={idx} className="hover:bg-zinc-100">
                          <td className="border border-zinc-300 text-center px-1 py-0.5">{m.no_urut || idx + 1}</td>
                          <td className="border border-zinc-300 px-1.5 py-0.5">{m.status_perkawinan || "-"}</td>
                          <td className="border border-zinc-300 px-1.5 py-0.5 font-bold">{m.status_hubungan_dalam_keluarga || "-"}</td>
                          <td className="border border-zinc-300 px-1.5 py-0.5 truncate max-w-[100px]">{m.nama_ayah || "-"}</td>
                          <td className="border border-zinc-300 px-1.5 py-0.5 truncate max-w-[100px]">{m.nama_ibu || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ZONA 5: TTE QR CODE DUKCAPIL */}
            <div
              onClick={() => onSelectZone?.("TTE_QR")}
              className={`ocr-zone-box p-2 flex items-center justify-between gap-3 bg-zinc-50 ${
                activeZone === "TTE_QR" || activeZone === "ALL" ? "active-zone" : "opacity-60"
              }`}
            >
              <div className="text-[9px] sm:text-[10px] leading-tight">
                <span className="px-1.5 py-0.5 rounded bg-[#09090B] text-white font-mono-tech text-[9px] font-bold inline-block mb-1">
                  ZONA 05 • QR TTE TERVERIFIKASI
                </span>
                <p className="font-bold text-[#09090B]">
                  Dokumen ini telah ditandatangani secara elektronik BSrE BSSN Ditjen Dukcapil.
                </p>
                <p className="font-mono-tech text-zinc-600 mt-0.5">
                  Dikeluarkan: {identitas.tanggal_dikeluarkan || "15-08-2023"}
                </p>
              </div>

              {/* Vector QR Stamp */}
              <svg
                aria-hidden="true"
                className="w-10 h-10 shrink-0 border border-[#09090B] p-1 bg-white"
                viewBox="0 0 36 36"
                fill="#09090B"
              >
                <rect x="2" y="2" width="10" height="10" fill="none" stroke="#09090B" strokeWidth="2" />
                <rect x="5" y="5" width="4" height="4" />
                <rect x="24" y="2" width="10" height="10" fill="none" stroke="#09090B" strokeWidth="2" />
                <rect x="27" y="5" width="4" height="4" />
                <rect x="2" y="24" width="10" height="10" fill="none" stroke="#09090B" strokeWidth="2" />
                <rect x="5" y="27" width="4" height="4" />
                <rect x="15" y="4" width="3" height="3" />
                <rect x="15" y="10" width="6" height="3" />
                <rect x="14" y="16" width="8" height="4" />
                <rect x="25" y="16" width="4" height="6" />
                <rect x="15" y="24" width="4" height="8" />
                <rect x="23" y="26" width="9" height="4" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Zone Filter Navigation Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-xs font-mono-tech font-bold text-[var(--text-secondary)] mr-1">
          Fokus Zona:
        </span>
        <button
          type="button"
          onClick={() => onSelectZone?.("ALL")}
          className={`px-2.5 py-1 min-h-[30px] text-xs font-mono-tech rounded ${
            activeZone === "ALL" ? "mono-btn-primary" : "mono-btn-secondary"
          }`}
        >
          Semua (5)
        </button>
        <button
          type="button"
          onClick={() => onSelectZone?.("NOKK")}
          className={`px-2.5 py-1 min-h-[30px] text-xs font-mono-tech rounded ${
            activeZone === "NOKK" ? "mono-btn-primary" : "mono-btn-secondary"
          }`}
        >
          01. No KK
        </button>
        <button
          type="button"
          onClick={() => onSelectZone?.("METADATA")}
          className={`px-2.5 py-1 min-h-[30px] text-xs font-mono-tech rounded ${
            activeZone === "METADATA" ? "mono-btn-primary" : "mono-btn-secondary"
          }`}
        >
          02. Alamat
        </button>
        <button
          type="button"
          onClick={() => onSelectZone?.("TABEL_ATAS")}
          className={`px-2.5 py-1 min-h-[30px] text-xs font-mono-tech rounded ${
            activeZone === "TABEL_ATAS" ? "mono-btn-primary" : "mono-btn-secondary"
          }`}
        >
          03. Biodata
        </button>
        <button
          type="button"
          onClick={() => onSelectZone?.("TABEL_BAWAH")}
          className={`px-2.5 py-1 min-h-[30px] text-xs font-mono-tech rounded ${
            activeZone === "TABEL_BAWAH" ? "mono-btn-primary" : "mono-btn-secondary"
          }`}
        >
          04. Hubungan
        </button>
        <button
          type="button"
          onClick={() => onSelectZone?.("TTE_QR")}
          className={`px-2.5 py-1 min-h-[30px] text-xs font-mono-tech rounded ${
            activeZone === "TTE_QR" ? "mono-btn-primary" : "mono-btn-secondary"
          }`}
        >
          05. QR TTE
        </button>
      </div>
    </div>
  );
}
