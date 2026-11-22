"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import InteractiveKkSheet from "@/components/InteractiveKkSheet";
import Toast from "@/components/Toast";
import { checkHealth, uploadOcrImage } from "@/lib/api";
import { compressImageClientSide, decodeNik } from "@/lib/utils";
import { AnggotaKeluarga, IdentitasKK, OcrResult, ToastMessage } from "@/types";

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
  const [uploadedGambar, setUploadedGambar] = useState<string>("");
  const [catatanList, setCatatanList] = useState<string[]>([]);
  const [engineChoice, setEngineChoice] = useState("auto");
  const [testNik, setTestNik] = useState("3271041205850001");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loadingNote, setLoadingNote] = useState("Sedang memproses OCR...");

  useEffect(() => {
    checkHealth().catch(() => {});
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
      setUploadedGambar("");
      setCatatanList([]);
      setUiState("ready");
      addToast("info", `Memuat ${sample.name}`);
    }
  };

  const handleLoadSampleRealFile = async () => {
    try {
      setUiState("loading");
      setLoadingNote("Mengunduh citra contoh asli (contoh.jpeg)...");
      const res = await fetch("/contoh.jpeg");
      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      setPreviewUrl(localUrl);

      setLoadingNote("Memproses citra contoh dengan Layout-Aware OCR...");
      const result: OcrResult = await uploadOcrImage(blob, engineChoice);

      setIdentitas(result.identitas);
      setAnggota(result.anggota);
      setZoneScores(result.zone_scores || [95, 90, 85, 85, 95]);
      setCatatanList(result.catatan || []);
      setUploadedGambar(result.gambar || "");
      if (result.gambar_url) setPreviewUrl(result.gambar_url);

      setUiState("ready");
      addToast("success", `OCR contoh selesai (${result.total_anggota} anggota terbaca).`);
    } catch (err: any) {
      setUiState("error");
      addToast("error", err?.error || err?.message || "Gagal memproses gambar contoh.");
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
      setLoadingNote("Menganalisis tata letak tabel & menjalankan OCR...");
      const result: OcrResult = await uploadOcrImage(compressedBlob, engineChoice);

      setIdentitas(result.identitas);
      setAnggota(result.anggota);
      setZoneScores(result.zone_scores || [98, 97, 96, 95, 99]);
      setCatatanList(result.catatan || []);
      setUploadedGambar(result.gambar || "");
      if (result.gambar_url) setPreviewUrl(result.gambar_url);

      setUiState("ready");
      addToast("success", `OCR Berhasil diproses (${result.total_anggota} anggota ditemukan).`);
    } catch (err: any) {
      setUiState("error");
      const msg = err?.error || err?.message || "Gagal memproses berkas citra.";
      addToast("error", msg);
    }
  };

  const handleManualInput = async () => {
    try {
      setUiState("loading");
      const result = await uploadOcrImage(null, "manual", true);
      sessionStorage.setItem("kk_ocr_pending_data", JSON.stringify({
        identitas: result.identitas,
        anggota: result.anggota,
        gambar: "",
        gambar_url: null,
        catatan: ["Mode formulir manual diaktifkan."],
      }));
      router.push("/konfirmasi");
    } catch (err: any) {
      setUiState("ready");
      addToast("error", "Gagal membuka mode input manual.");
    }
  };

  const handleProceedToConfirmation = () => {
    const payload = {
      identitas,
      anggota,
      gambar: uploadedGambar,
      gambar_url: previewUrl,
      catatan: catatanList,
    };
    sessionStorage.setItem("kk_ocr_pending_data", JSON.stringify(payload));
    router.push("/konfirmasi");
  };

  const decodedNikTest = decodeNik(testNik);

  return (
    <div className="pb-16">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* SECTION 1: EXECUTIVE TOOLBAR & STATUS BADGE */}
      <section className="border-b-2 border-[var(--border-strong)] bg-[var(--bg-muted)] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tech text-[var(--text-secondary)]">
                <span>DOKUMEN KEPENDUDUKAN RI</span>
                <span>/</span>
                <span>LAYOUT OCR SPASIAL PERMENDAGRI 109/2019</span>
                <span>/</span>
                <span className="font-bold text-[var(--text-primary)] underline">
                  STATUS: {uiState.toUpperCase()}
                </span>
              </div>
              <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]">
                Pemindaian &amp; Ekstraksi Data Kartu Keluarga Otomatis
              </h1>
            </div>

            {/* Engine & Mode Picker */}
            <div className="mono-card p-2 bg-[var(--bg-surface)] shrink-0 flex flex-wrap items-center gap-2 text-xs font-mono-tech">
              <span className="font-bold uppercase text-[var(--text-muted)] text-[11px]">
                Engine OCR:
              </span>
              <select
                value={engineChoice}
                onChange={(e) => setEngineChoice(e.target.value)}
                className="px-2 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-bold text-xs"
              >
                <option value="auto">Otomatis (Lokal / Claude jika ada)</option>
                <option value="lokal">Lokal (Tesseract + Spatial Layout)</option>
                <option value="claude">Claude Vision (Butuh API Key)</option>
              </select>

              <button
                type="button"
                onClick={handleManualInput}
                className="mono-btn-secondary px-2.5 py-1 text-xs"
                title="Buka form kosong tanpa memindai gambar"
              >
                Isi Manual
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MAIN WORKBENCH */}
      <section className="py-8 border-b-2 border-[var(--border-strong)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Top Document Control Bar */}
          <div className="mono-card p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5">
              <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">
                1. Pilih Sampel Dokumen Terverifikasi:
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

            <div className="md:col-span-7 flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/bmp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 mono-btn-secondary px-3 py-2 min-h-[42px] text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span>↑ Unggah Foto KK (JPG/PNG)</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSampleRealFile}
                className="mono-btn-secondary px-3 py-2 min-h-[42px] text-xs font-bold flex items-center justify-center gap-1.5"
                title="Gunakan contoh.jpeg untuk menguji langsung pipeline OCR"
              >
                <span>Contoh Citra Nyata</span>
              </button>
              <button
                type="button"
                onClick={handleProceedToConfirmation}
                className="mono-btn-primary px-4 py-2 min-h-[42px] text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5"
              >
                <span>Lanjut ke Form Konfirmasi →</span>
              </button>
            </div>
          </div>

          {/* Alert Catatan OCR jika ada */}
          {catatanList.length > 0 && (
            <div className="mono-card p-4 bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-600 text-xs font-mono-tech space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300 block uppercase">
                Catatan Hasil Pembacaan OCR:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-amber-900 dark:text-amber-200">
                {catatanList.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* STATE: LOADING */}
          {uiState === "loading" && (
            <div className="mono-card p-12 text-center space-y-4 my-4" role="status">
              <div className="w-12 h-12 mx-auto border-4 border-[var(--border-light)] border-t-[var(--border-strong)] rounded-full animate-spin" />
              <h2 className="font-bold text-xl text-[var(--text-primary)]">
                Sedang Membaca Dokumen &amp; Mengurai Struktur Tabel KK...
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                {loadingNote}
              </p>
              <button
                type="button"
                onClick={() => setUiState("ready")}
                className="mono-btn-secondary px-4 py-2 text-xs"
              >
                Tampilkan Pratinjau
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
                Pilih salah satu sampel dokumen di atas atau unggah foto Kartu Keluarga Anda.
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
                Pastikan dokumen difoto dengan pencahayaan merata atau gunakan tombol &quot;Contoh Citra Nyata&quot; untuk menguji sistem.
              </p>
              <button
                type="button"
                onClick={() => handleSelectSample(0)}
                className="mono-btn-primary px-5 py-2.5 text-xs sm:text-sm"
              >
                Pulihkan dengan Sampel
              </button>
            </div>
          )}

          {/* STATE: READY */}
          {uiState === "ready" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT 6 COLS: Document Facsimile & Real Image Toggle */}
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

              {/* RIGHT 6 COLS: Metadata & Members Preview */}
              <div className="lg:col-span-6 space-y-5">
                {/* Header Metadata Card */}
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
                      {identitas.no_kk?.length === 16 ? "✓ 16 DIGIT VALID" : "⚠ NO KK PERLU DICEK"}
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
                        ALAMAT DOMISILI LENGKAP
                      </span>
                      <div className="px-3 py-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-strong)] font-medium text-xs text-[var(--text-primary)]">
                        {identitas.alamat || "-"}, RT {identitas.rt || "000"} / RW {identitas.rw || "000"},{" "}
                        {identitas.desa_kelurahan || "-"}, {identitas.kecamatan || "-"},{" "}
                        {identitas.kabupaten_kota || "-"}, {identitas.provinsi || "-"} {identitas.kode_pos || ""}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Members Card */}
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
                      Buka Form Konfirmasi →
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
                        {anggota.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-zinc-400 italic">
                              (Belum ada data anggota keluarga terbaca)
                            </td>
                          </tr>
                        ) : (
                          anggota.map((m, idx) => (
                            <tr key={idx} className="hover:bg-[var(--bg-subtle)]">
                              <td className="p-2 font-bold">{m.no_urut || idx + 1}</td>
                              <td className="p-2 font-bold">{m.nama_lengkap}</td>
                              <td className="p-2">{m.nik}</td>
                              <td className="p-2">{m.jenis_kelamin?.startsWith("P") ? "P" : "L"}</td>
                              <td className="p-2 text-[var(--text-secondary)] font-medium">
                                {m.status_hubungan_dalam_keluarga || m.status_hubungan || "-"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-mono-tech text-[var(--text-muted)]">
                      Lakukan pengeditan dan koreksi kolom pada Form Konfirmasi sebelum menyimpan ke database.
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

      {/* SECTION 3: 16-DIGIT DECODER */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="mono-card p-4 space-y-1">
              <span className="text-[10px] font-mono-tech font-bold uppercase text-[var(--text-muted)]">
                DIGIT 1-2: PROVINSI
              </span>
              <p className="font-mono-tech font-bold text-xl">{decodedNikTest.prov_code || "--"}</p>
              <p className="text-xs text-[var(--text-secondary)]">KODE PROVINSI RI</p>
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
    </div>
  );
}
