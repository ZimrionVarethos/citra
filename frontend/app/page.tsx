"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import InteractiveKkSheet from "@/components/InteractiveKkSheet";
import Toast from "@/components/Toast";
import { checkHealth, uploadOcrImage } from "@/lib/api";
import { compressImageClientSide, decodeNik } from "@/lib/utils";
import { AnggotaKeluarga, IdentitasKK, OcrResult, ToastMessage } from "@/types";

// Standard Sample Documents for instant zero-friction demonstration
const SAMPLES = [
  {
    name: "Sampel #1: KK Kota Bogor (4 Anggota • Cetak HVS Tajam • Valid)",
    identitas: {
      no_kk: "3271041508190004",
      nama_kepala_keluarga: "HENDRA WIJAYA, S.T.",
      alamat: "JL. SURYAKENCANA NO. 48",
      rt: "003",
      rw: "005",
      desa_kelurahan: "BABAKAN PASAR",
      kecamatan: "BOGOR TENGAH",
      kabupaten_kota: "KOTA BOGOR",
      provinsi: "JAWA BARAT",
      kode_pos: "16126",
      tanggal_dikeluarkan: "2023-08-15",
    },
    anggota: [
      {
        no_urut: 1,
        nama_lengkap: "HENDRA WIJAYA, S.T.",
        nik: "3271041205850001",
        jenis_kelamin: "LAKI-LAKI",
        tempat_lahir: "BOGOR",
        tanggal_lahir: "1985-05-12",
        agama: "ISLAM",
        pendidikan: "DIPLOMA IV / STRATA I",
        jenis_pekerjaan: "KARYAWAN SWASTA",
        golongan_darah: "O",
        status_perkawinan: "KAWIN TERCATAT",
        tanggal_perkawinan: "2010-06-20",
        status_hubungan_dalam_keluarga: "KEPALA KELUARGA",
        kewarganegaraan: "WNI",
        nama_ayah: "DARMAWAN WIJAYA",
        nama_ibu: "SITI AMINAH",
      },
      {
        no_urut: 2,
        nama_lengkap: "RATNA DEWI KARTIKA",
        nik: "3271045508880002",
        jenis_kelamin: "PEREMPUAN",
        tempat_lahir: "BANDUNG",
        tanggal_lahir: "1988-08-15",
        agama: "ISLAM",
        pendidikan: "DIPLOMA IV / STRATA I",
        jenis_pekerjaan: "GURU",
        golongan_darah: "A",
        status_perkawinan: "KAWIN TERCATAT",
        tanggal_perkawinan: "2010-06-20",
        status_hubungan_dalam_keluarga: "ISTRI",
        kewarganegaraan: "WNI",
        nama_ayah: "KARTIKA SARI",
        nama_ibu: "NURHAYATI",
      },
      {
        no_urut: 3,
        nama_lengkap: "DIMAS ARYA PRATAMA",
        nik: "3271042004120003",
        jenis_kelamin: "LAKI-LAKI",
        tempat_lahir: "BOGOR",
        tanggal_lahir: "2012-04-20",
        agama: "ISLAM",
        pendidikan: "SLTP/SEDERAJAT",
        jenis_pekerjaan: "PELAJAR/MAHASISWA",
        golongan_darah: "O",
        status_perkawinan: "BELUM KAWIN",
        status_hubungan_dalam_keluarga: "ANAK",
        kewarganegaraan: "WNI",
        nama_ayah: "HENDRA WIJAYA",
        nama_ibu: "RATNA DEWI KARTIKA",
      },
      {
        no_urut: 4,
        nama_lengkap: "NADIA ANINDYA PUTRI",
        nik: "3271046511170004",
        jenis_kelamin: "PEREMPUAN",
        tempat_lahir: "BOGOR",
        tanggal_lahir: "2017-11-25",
        agama: "ISLAM",
        pendidikan: "TAMAT SD / SEDERAJAT",
        jenis_pekerjaan: "BELUM/TIDAK BEKERJA",
        golongan_darah: "A",
        status_perkawinan: "BELUM KAWIN",
        status_hubungan_dalam_keluarga: "ANAK",
        kewarganegaraan: "WNI",
        nama_ayah: "HENDRA WIJAYA",
        nama_ibu: "RATNA DEWI KARTIKA",
      },
    ],
    zoneScores: [99.6, 99.1, 98.7, 98.2, 99.8],
  },
  {
    name: "Sampel #2: KK Jakarta Selatan (2 Anggota • Keluarga Muda • Valid)",
    identitas: {
      no_kk: "3174011002200002",
      nama_kepala_keluarga: "REZKY FEBRIAN",
      alamat: "JL. TEBET BARAT DALAM VI NO. 12",
      rt: "005",
      rw: "002",
      desa_kelurahan: "TEBET BARAT",
      kecamatan: "TEBET",
      kabupaten_kota: "JAKARTA SELATAN",
      provinsi: "DKI JAKARTA",
      kode_pos: "12810",
      tanggal_dikeluarkan: "2024-02-10",
    },
    anggota: [
      {
        no_urut: 1,
        nama_lengkap: "REZKY FEBRIAN",
        nik: "3174011402920001",
        jenis_kelamin: "LAKI-LAKI",
        tempat_lahir: "JAKARTA",
        tanggal_lahir: "1992-02-14",
        agama: "ISLAM",
        pendidikan: "DIPLOMA IV / STRATA I",
        jenis_pekerjaan: "WIRAUSAHA",
        golongan_darah: "B",
        status_perkawinan: "KAWIN TERCATAT",
        tanggal_perkawinan: "2020-02-02",
        status_hubungan_dalam_keluarga: "KEPALA KELUARGA",
        kewarganegaraan: "WNI",
        nama_ayah: "BAMBANG SUDIBYO",
        nama_ibu: "SRI RAHAYU",
      },
      {
        no_urut: 2,
        nama_lengkap: "ANISA FITRIANI",
        nik: "3174015809940002",
        jenis_kelamin: "PEREMPUAN",
        tempat_lahir: "SURABAYA",
        tanggal_lahir: "1994-09-18",
        agama: "ISLAM",
        pendidikan: "DIPLOMA IV / STRATA I",
        jenis_pekerjaan: "KARYAWAN SWASTA",
        golongan_darah: "O",
        status_perkawinan: "KAWIN TERCATAT",
        tanggal_perkawinan: "2020-02-02",
        status_hubungan_dalam_keluarga: "ISTRI",
        kewarganegaraan: "WNI",
        nama_ayah: "HARTONO",
        nama_ibu: "MAYSAROH",
      },
    ],
    zoneScores: [99.2, 98.6, 98.4, 98.0, 99.5],
  },
];

export default function ScannerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uiState, setUiState] = useState<"ready" | "loading" | "empty" | "error">("ready");
  const [selectedSampleIdx, setSelectedSampleIdx] = useState(0);
  const [identitas, setIdentitas] = useState<IdentitasKK>(SAMPLES[0].identitas);
  const [anggota, setAnggota] = useState<AnggotaKeluarga[]>(SAMPLES[0].anggota);
  const [zoneScores, setZoneScores] = useState<number[]>(SAMPLES[0].zoneScores);
  const [activeZone, setActiveZone] = useState("ALL");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [testNik, setTestNik] = useState("3271041205850001");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loadingNote, setLoadingNote] = useState("Sedang mengekstraksi zona tabel...");

  // Health ping
  useEffect(() => {
    checkHealth().catch(() => {
      // Backend is starting up
    });
  }, []);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleSelectSample = (idx: number) => {
    setSelectedSampleIdx(idx);
    const sample = SAMPLES[idx];
    if (sample) {
      setIdentitas(sample.identitas);
      setAnggota(sample.anggota);
      setZoneScores(sample.zoneScores);
      setPreviewUrl(null);
      setUiState("ready");
      addToast("info", `Memuat ${sample.name}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      addToast("error", "Format berkas harus citra JPG atau PNG.");
      return;
    }

    try {
      setUiState("loading");
      setLoadingNote("Mengompresi citra di peramban (Max 2000px, Kualitas 0.8)...");

      // 1. Client-side compression
      const compressedBlob = await compressImageClientSide(file, 2000, 0.8);
      const localUrl = URL.createObjectURL(compressedBlob);
      setPreviewUrl(localUrl);

      // 2. Direct upload to Flask Backend
      setLoadingNote("Mengirim ke Backend Python & Menjalankan Pipeline OCR (OpenCV + Tesseract)...");
      const result: OcrResult = await uploadOcrImage(compressedBlob);

      if (result.identitas && (result.identitas.no_kk || result.identitas.nama_kepala_keluarga || result.anggota.length > 0)) {
        setIdentitas(result.identitas);
        setAnggota(result.anggota);
        setZoneScores(result.zone_scores || [98, 97, 96, 95, 99]);
        setUiState("ready");
        addToast("success", `OCR Berhasil diekstraksi! Ditemukan ${result.anggota.length} anggota keluarga.`);
      } else {
        // Fallback sample if image had very low DPI
        setUiState("error");
        addToast("error", "Citra terlalu buram atau garis tabel tidak terdeteksi. Silakan coba unggah foto yang lebih tajam.");
      }
    } catch (err: any) {
      setUiState("error");
      const msg = err?.error || err?.message || "Gagal memproses berkas citra.";
      addToast("error", msg);
    }
  };

  const handleProceedToConfirmation = () => {
    // Store in sessionStorage and navigate
    const payload = { identitas, anggota };
    sessionStorage.setItem("kk_ocr_pending_data", JSON.stringify(payload));
    router.push("/konfirmasi");
  };

  const decodedNikTest = decodeNik(testNik);

  return (
    <div className="pb-16">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* SECTION 1: EXECUTIVE TOOLBAR & R-27 UI STATE SWITCHER */}
      <section className="border-b-2 border-[var(--border-strong)] bg-[var(--bg-muted)] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tech text-[var(--text-secondary)]">
                <span>DOKUMEN KEPENDUDUKAN RI</span>
                <span>/</span>
                <span>FORMULIR BLANGKO HVS A4 PUTIH</span>
                <span>/</span>
                <span className="font-bold text-[var(--text-primary)] underline">
                  STATUS: {uiState.toUpperCase()}
                </span>
              </div>
              <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]">
                Pemindaian &amp; Ekstraksi Data Kartu Keluarga Otomatis
              </h1>
            </div>

            {/* UI State Controls */}
            <div className="mono-card p-2 bg-[var(--bg-surface)] shrink-0">
              <span className="block text-[10px] font-mono-tech font-bold uppercase text-[var(--text-muted)] mb-1">
                Status Antarmuka Pemindai:
              </span>
              <div role="group" className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setUiState("ready")}
                  className={`px-2.5 py-1 text-xs rounded ${
                    uiState === "ready" ? "mono-btn-primary" : "mono-btn-secondary"
                  }`}
                >
                  Hasil OCR (Ready)
                </button>
                <button
                  type="button"
                  onClick={() => setUiState("loading")}
                  className={`px-2.5 py-1 text-xs rounded ${
                    uiState === "loading" ? "mono-btn-primary" : "mono-btn-secondary"
                  }`}
                >
                  Proses Scan (Loading)
                </button>
                <button
                  type="button"
                  onClick={() => setUiState("empty")}
                  className={`px-2.5 py-1 text-xs rounded ${
                    uiState === "empty" ? "mono-btn-primary" : "mono-btn-secondary"
                  }`}
                >
                  Kosong (Empty)
                </button>
                <button
                  type="button"
                  onClick={() => setUiState("error")}
                  className={`px-2.5 py-1 text-xs rounded ${
                    uiState === "error" ? "mono-btn-primary" : "mono-btn-secondary"
                  }`}
                >
                  Gagal (Error)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MAIN WORKBENCH */}
      <section className="py-8 border-b-2 border-[var(--border-strong)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Top Document Control Bar */}
          <div className="mono-card p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">
                1. Pilih Sampel Dokumen Kartu Keluarga:
              </label>
              <select
                value={selectedSampleIdx}
                onChange={(e) => handleSelectSample(Number(e.target.value))}
                className="w-full px-3 py-2 min-h-[42px] rounded bg-[var(--bg-subtle)] border-2 border-[var(--border-strong)] text-xs sm:text-sm font-bold text-[var(--text-primary)]"
              >
                {SAMPLES.map((s, idx) => (
                  <option key={idx} value={idx}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6 flex flex-col sm:flex-row gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 mono-btn-secondary px-4 py-2 min-h-[42px] text-xs font-bold flex items-center justify-center gap-2"
              >
                <span>↑ Unggah Foto KK (JPG/PNG)</span>
              </button>
              <button
                type="button"
                onClick={handleProceedToConfirmation}
                className="mono-btn-primary px-5 py-2 min-h-[42px] text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
              >
                <span>Lanjut ke Form Konfirmasi →</span>
              </button>
            </div>
          </div>

          {/* STATE: LOADING */}
          {uiState === "loading" && (
            <div className="mono-card p-12 text-center space-y-4 my-4" role="status">
              <div className="w-12 h-12 mx-auto border-4 border-[var(--border-light)] border-t-[var(--border-strong)] rounded-full animate-spin" />
              <h2 className="font-bold text-xl text-[var(--text-primary)]">
                Sedang Mengekstraksi Zona Tabel &amp; Memvalidasi 16-Digit NIK...
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                {loadingNote}
              </p>
              <p className="text-[11px] font-mono-tech text-[var(--text-muted)]">
                *Render Free Tier cold-start membutuhkan waktu ~30-60 detik saat pertama kali dipanggil.
              </p>
              <button
                type="button"
                onClick={() => setUiState("ready")}
                className="mono-btn-secondary px-4 py-2 text-xs"
              >
                Tampilkan Pratinjau Siap
              </button>
            </div>
          )}

          {/* STATE: EMPTY */}
          {uiState === "empty" && (
            <div className="mono-card p-12 text-center space-y-4 my-4">
              <span className="inline-block px-3 py-1 rounded font-mono-tech text-xs font-bold bg-[var(--bg-muted)] border border-[var(--border-strong)]">
                MEJA PEMINDAI KOSONG
              </span>
              <h2 className="font-bold text-xl text-[var(--text-primary)]">
                Belum Ada Dokumen Kartu Keluarga yang Dimuat
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                Pilih salah satu sampel dokumen Kartu Keluarga pada bilah kontrol di atas atau unggah foto lembar KK Anda.
              </p>
              <button
                type="button"
                onClick={() => handleSelectSample(0)}
                className="mono-btn-primary px-5 py-2.5 text-xs sm:text-sm"
              >
                Muat Sampel KK Kota Bogor
              </button>
            </div>
          )}

          {/* STATE: ERROR */}
          {uiState === "error" && (
            <div className="mono-card p-12 text-center space-y-4 my-4 border-2 border-red-600" role="alert">
              <span className="inline-block px-3 py-1 rounded font-mono-tech text-xs font-bold bg-[var(--bg-emphasis)] text-[var(--text-inverted)]">
                ERR_OCR_UNREADABLE • GAGAL EKSTRAKSI
              </span>
              <h2 className="font-bold text-xl text-[var(--text-primary)]">
                Citra Terlalu Buram atau Garis Tabel Tidak Terdeteksi
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                Pastikan dokumen Kartu Keluarga difoto secara tegak lurus dengan pencahayaan merata, atau gunakan salah satu sampel uji yang tersedia.
              </p>
              <button
                type="button"
                onClick={() => handleSelectSample(0)}
                className="mono-btn-primary px-5 py-2.5 text-xs sm:text-sm"
              >
                Pulihkan dengan Sampel KK
              </button>
            </div>
          )}

          {/* STATE: READY (SPLIT WORKBENCH) */}
          {uiState === "ready" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT 6 COLS: Interactive Document Sheet Viewport */}
              <div className="lg:col-span-6">
                <InteractiveKkSheet
                  identitas={identitas}
                  anggota={anggota}
                  previewUrl={previewUrl}
                  activeZone={activeZone}
                  onSelectZone={setActiveZone}
                  zoneScores={zoneScores}
                />
              </div>

              {/* RIGHT 6 COLS: Structured Extraction & Verification Panel */}
              <div className="lg:col-span-6 space-y-5">
                {/* Card 1: Identitas Header */}
                <div className="mono-card p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--border-strong)] pb-3">
                    <div>
                      <span className="font-mono-tech text-[11px] font-bold uppercase text-[var(--text-muted)]">
                        HASIL EKSTRAKSI ZONA 01 &amp; 02
                      </span>
                      <h2 className="font-bold text-lg text-[var(--text-primary)]">
                        Identitas Kartu Keluarga &amp; Alamat
                      </h2>
                    </div>
                    <span className="font-mono-tech text-xs font-bold px-2 py-0.5 rounded bg-[var(--bg-muted)] border border-[var(--border-mid)]">
                      {identitas.no_kk?.length === 16 ? "✓ 16 DIGIT VALID" : "⚠ NO KK INVALID"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                        NOMOR KARTU KELUARGA
                      </span>
                      <div className="px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-mono-tech font-bold text-sm text-[var(--text-primary)]">
                        {identitas.no_kk || "-"}
                      </div>
                    </div>
                    <div>
                      <span className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                        NAMA KEPALA KELUARGA
                      </span>
                      <div className="px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-bold text-sm text-[var(--text-primary)] truncate">
                        {identitas.nama_kepala_keluarga || "-"}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block font-mono-tech font-bold text-[var(--text-secondary)] mb-1">
                        ALAMAT LENGKAP &amp; DOMISILI
                      </span>
                      <div className="px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-medium text-xs text-[var(--text-primary)]">
                        {identitas.alamat || "-"}, RT {identitas.rt || "000"} / RW {identitas.rw || "000"},{" "}
                        {identitas.desa_kelurahan || "-"}, {identitas.kecamatan || "-"},{" "}
                        {identitas.kabupaten_kota || "-"}, {identitas.provinsi || "-"} {identitas.kode_pos || ""}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Daftar Anggota Keluarga */}
                <div className="mono-card p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--border-strong)] pb-3">
                    <div>
                      <span className="font-mono-tech text-[11px] font-bold uppercase text-[var(--text-muted)]">
                        HASIL EKSTRAKSI ZONA 03 &amp; 04
                      </span>
                      <h2 className="font-bold text-lg text-[var(--text-primary)]">
                        Daftar Anggota ({anggota.length} Orang)
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={handleProceedToConfirmation}
                      className="mono-btn-primary px-4 py-1.5 text-xs font-mono-tech"
                    >
                      Buka di Form Konfirmasi →
                    </button>
                  </div>

                  {/* Members Mini Table */}
                  <div className="overflow-x-auto border border-[var(--border-strong)] rounded">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[var(--bg-muted)] border-b border-[var(--border-strong)] font-mono-tech uppercase text-[11px]">
                        <tr>
                          <th className="p-2">No</th>
                          <th className="p-2">Nama Lengkap</th>
                          <th className="p-2">NIK (16 Digit)</th>
                          <th className="p-2">JK</th>
                          <th className="p-2">Hubungan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-light)] font-mono-tech">
                        {anggota.map((m, idx) => (
                          <tr key={idx} className="hover:bg-[var(--bg-subtle)]">
                            <td className="p-2 font-bold">{m.no_urut || idx + 1}</td>
                            <td className="p-2 font-bold">{m.nama_lengkap}</td>
                            <td className="p-2">{m.nik}</td>
                            <td className="p-2">{m.jenis_kelamin?.startsWith("P") ? "P" : "L"}</td>
                            <td className="p-2 text-[var(--text-secondary)]">
                              {m.status_hubungan_dalam_keluarga}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-mono-tech text-[var(--text-muted)]">
                      Lakukan pengeditan dan validasi lengkap pada Form Konfirmasi sebelum menyimpan ke database.
                    </span>
                    <button
                      type="button"
                      onClick={handleProceedToConfirmation}
                      className="mono-btn-primary px-4 py-2 text-xs font-bold shrink-0"
                    >
                      Konfirmasi &amp; Simpan →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: 16-DIGIT NIK & KK STRUCTURAL DECODER */}
      <section className="py-10 border-b-2 border-[var(--border-strong)] bg-[var(--bg-muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-mono-tech text-xs font-bold uppercase text-[var(--text-muted)] block mb-1">
                VALIDATOR KEPENDUDUKAN OTOMATIS
              </span>
              <h2 className="font-extrabold text-2xl text-[var(--text-primary)]">
                Dekoder &amp; Penguji Struktur 16-Digit NIK / Nomor KK
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
                Menguraikan 16 digit sesuai ketentuan resmi Ditjen Dukcapil Kemendagri: 6 digit kode wilayah, 6 digit tanggal lahir/penerbitan (dengan penambahan +40 untuk perempuan), serta 4 digit nomor urut registrasi.
              </p>
            </div>

            <div className="w-full md:w-80">
              <label className="block text-xs font-mono-tech font-bold uppercase text-[var(--text-secondary)] mb-1">
                Uji Nomor NIK / KK:
              </label>
              <input
                type="text"
                maxLength={16}
                value={testNik}
                onChange={(e) => setTestNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                className="w-full px-3.5 py-2 min-h-[42px] rounded bg-[var(--bg-surface)] border-2 border-[var(--border-strong)] font-mono-tech font-bold text-sm tracking-wider text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* 5-Segment Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="mono-card p-4 space-y-1">
              <span className="text-[10px] font-mono-tech font-bold uppercase text-[var(--text-muted)]">
                DIGIT 1-2: PROVINSI
              </span>
              <p className="font-mono-tech font-bold text-xl">{decodedNikTest.prov_code || "--"}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {decodedNikTest.prov_code === "32"
                  ? "JAWA BARAT"
                  : decodedNikTest.prov_code === "31"
                  ? "DKI JAKARTA"
                  : decodedNikTest.prov_code === "33"
                  ? "JAWA TENGAH"
                  : decodedNikTest.prov_code === "35"
                  ? "JAWA TIMUR"
                  : "KODE PROVINSI RI"}
              </p>
            </div>

            <div className="mono-card p-4 space-y-1">
              <span className="text-[10px] font-mono-tech font-bold uppercase text-[var(--text-muted)]">
                DIGIT 3-4: KAB / KOTA
              </span>
              <p className="font-mono-tech font-bold text-xl">{decodedNikTest.city_code || "--"}</p>
              <p className="text-xs text-[var(--text-secondary)]">KODE KABUPATEN / KOTA</p>
            </div>

            <div className="mono-card p-4 space-y-1">
              <span className="text-[10px] font-mono-tech font-bold uppercase text-[var(--text-muted)]">
                DIGIT 5-6: KECAMATAN
              </span>
              <p className="font-mono-tech font-bold text-xl">{decodedNikTest.district_code || "--"}</p>
              <p className="text-xs text-[var(--text-secondary)]">KODE KECAMATAN</p>
            </div>

            <div className="mono-card p-4 space-y-1">
              <span className="text-[10px] font-mono-tech font-bold uppercase text-[var(--text-muted)]">
                DIGIT 7-12: TGL LAHIR &amp; JK
              </span>
              <p className="font-mono-tech font-bold text-xl">{decodedNikTest.birth_date || "--"}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {decodedNikTest.gender || "LAKI-LAKI / PEREMPUAN"}
              </p>
            </div>

            <div className="mono-card p-4 space-y-1">
              <span className="text-[10px] font-mono-tech font-bold uppercase text-[var(--text-muted)]">
                DIGIT 13-16: NO. URUT
              </span>
              <p className="font-mono-tech font-bold text-xl">{decodedNikTest.sequence || "----"}</p>
              <p className="text-xs text-[var(--text-secondary)]">REGISTRASI HARIAN</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: SPESIFIKASI STANDAR BLANGKO */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <span className="font-mono-tech text-xs font-bold uppercase text-[var(--text-muted)] block mb-1">
              REFERENSI REGULASI ADMINISTRASI KEPENDUDUKAN
            </span>
            <h2 className="font-extrabold text-2xl text-[var(--text-primary)]">
              Spesifikasi Standar Blangko Kartu Keluarga &amp; Atribut OCR
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="mono-card p-5 space-y-2">
              <span className="px-2 py-0.5 rounded font-mono-tech text-xs font-bold bg-[var(--bg-emphasis)] text-[var(--text-inverted)]">
                PERMENDAGRI NO. 109 TAHUN 2019
              </span>
              <h3 className="font-bold text-base text-[var(--text-primary)] pt-1">
                Blangko Kertas Putih HVS A4 80gr
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Pencetakan Kartu Keluarga menggunakan kertas HVS putih ukuran A4 80 gram yang mempermudah binerisasi kontras hitam-putih pada mesin OCR tanpa distorsi warna.
              </p>
            </div>

            <div className="mono-card p-5 space-y-2">
              <span className="px-2 py-0.5 rounded font-mono-tech text-xs font-bold bg-[var(--bg-emphasis)] text-[var(--text-inverted)]">
                STRUKTUR 17 KOLOM TABEL KK
              </span>
              <h3 className="font-bold text-base text-[var(--text-primary)] pt-1">
                Pemetaan Tabel Atas &amp; Tabel Bawah
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Tabel Atas memuat 10 kolom identitas dasar, sedangkan Tabel Bawah memuat 7 kolom relasi keluarga, kewarganegaraan, dan nama orang tua yang digabungkan otomatis berdasarkan nomor urut.
              </p>
            </div>

            <div className="mono-card p-5 space-y-2">
              <span className="px-2 py-0.5 rounded font-mono-tech text-xs font-bold bg-[var(--bg-emphasis)] text-[var(--text-inverted)]">
                VALIDASI SILANG 16 DIGIT
              </span>
              <h3 className="font-bold text-base text-[var(--text-primary)] pt-1">
                Koreksi Otomatis Angka Hasil OCR
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Memeriksa digit ke-7 dan ke-8 pada NIK anggota perempuan bernilai `Tanggal Lahir + 40` untuk memvalidasi jenis kelamin dan tanggal lahir bahkan jika OCR sempat membaca karakter buram.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
