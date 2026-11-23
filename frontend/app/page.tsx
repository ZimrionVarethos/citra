"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import InteractiveKkSheet from "@/components/InteractiveKkSheet";
import Toast from "@/components/Toast";
import { checkHealth, uploadOcrImage } from "@/lib/api";
import { compressImageClientSide, decodeNik } from "@/lib/utils";
import { OcrResult, ToastMessage } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Memproses dokumen...");
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [uploadedGambar, setUploadedGambar] = useState<string>("");
  const [catatanList, setCatatanList] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showNikValidator, setShowNikValidator] = useState(false);
  const [testNik, setTestNik] = useState("6474020101030020");

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      addToast("error", "Pilih file gambar dengan format JPG atau PNG.");
      return;
    }
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setOcrResult(null);
  };

  const handleStartScan = async (fileToScan?: File) => {
    const targetFile = fileToScan || selectedFile;
    if (!targetFile) {
      addToast("error", "Pilih atau unggah file foto Kartu Keluarga terlebih dahulu.");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus("Mengompresi citra (Max 2000px, Kualitas 0.8)...");
      const compressedBlob = await compressImageClientSide(targetFile, 2000, 0.8);

      setProcessingStatus("Mengekstrak data dengan OCR lokal...");
      const result: OcrResult = await uploadOcrImage(compressedBlob, "lokal");

      setOcrResult(result);
      setCatatanList(result.catatan || []);
      setUploadedGambar(result.gambar || "");
      if (result.gambar_url) {
        setPreviewUrl(result.gambar_url);
      }

      addToast("success", `OCR selesai: ${result.total_anggota} anggota keluarga terbaca.`);
    } catch (err: any) {
      addToast("error", err?.error || err?.message || "Gagal memproses gambar.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setIsProcessing(true);
      setProcessingStatus("Memuat citra contoh...");
      const res = await fetch("/contoh.jpeg");
      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      setPreviewUrl(localUrl);
      const file = new File([blob], "contoh.jpeg", { type: "image/jpeg" });
      setSelectedFile(file);

      setProcessingStatus("Menjalankan ekstraksi OCR lokal...");
      const result: OcrResult = await uploadOcrImage(blob, "lokal");

      setOcrResult(result);
      setCatatanList(result.catatan || []);
      setUploadedGambar(result.gambar || "");
      if (result.gambar_url) {
        setPreviewUrl(result.gambar_url);
      }

      addToast("success", `OCR contoh selesai: No. KK ${result.identitas.no_kk || "-"}`);
    } catch (err: any) {
      addToast("error", err?.error || err?.message || "Gagal memuat gambar contoh.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualInput = async () => {
    try {
      setIsProcessing(true);
      const result = await uploadOcrImage(null, "manual", true);
      sessionStorage.setItem(
        "kk_ocr_pending_data",
        JSON.stringify({
          identitas: result.identitas,
          anggota: result.anggota,
          gambar: "",
          gambar_url: null,
          catatan: ["Mode formulir manual diaktifkan."],
        })
      );
      router.push("/konfirmasi");
    } catch (err: any) {
      addToast("error", "Gagal membuka form manual.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToConfirmation = () => {
    if (!ocrResult) return;
    const payload = {
      identitas: ocrResult.identitas,
      anggota: ocrResult.anggota,
      gambar: uploadedGambar,
      gambar_url: previewUrl,
      catatan: catatanList,
    };
    sessionStorage.setItem("kk_ocr_pending_data", JSON.stringify(payload));
    router.push("/konfirmasi");
  };

  const decodedNik = decodeNik(testNik);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#113B2E] dark:text-emerald-300">
          Scan Kartu Keluarga
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
          Unggah atau seret file foto Kartu Keluarga Anda untuk melanjutkan proses.
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-red-500/80 rounded-2xl bg-[var(--bg-surface)] p-8 sm:p-12 text-center transition-all cursor-pointer shadow-sm hover:shadow-md"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="relative inline-block mx-auto mb-4">
            <svg
              className="w-16 h-16 sm:w-20 sm:h-20 text-[#113B2E] dark:text-emerald-400"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
            >
              <rect x="6" y="14" width="52" height="36" rx="6" strokeWidth="2.75" />
              <circle cx="19" cy="27" r="4.5" strokeWidth="2.25" />
              <path d="M12 40c0-3.5 3-5.5 7-5.5s7 2 7 5.5" strokeWidth="2.25" strokeLinecap="round" />
              <path d="M33 24h18M33 32h14M33 40h10" strokeWidth="2.25" strokeLinecap="round" />
            </svg>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md border-2 border-[var(--bg-surface)]">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              {selectedFile ? selectedFile.name : "Upload atau Drop File"}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {selectedFile
                ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Klik untuk mengganti file`
                : "Format: JPG, PNG • Maks. 8 MB"}
            </p>
          </div>

          <div className="mt-6">
            <button
              type="button"
              disabled={isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedFile) {
                  handleStartScan();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-7 py-2.5 rounded-xl font-medium text-xs sm:text-sm shadow-sm inline-flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>{selectedFile ? "Mulai Pindai Dokumen" : "Pilih File"}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4 text-xs">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleLoadSample}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg border border-[var(--border-mid)] hover:bg-[var(--bg-subtle)] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Gunakan Citra Contoh</span>
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleManualInput}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg border border-[var(--border-mid)] hover:bg-[var(--bg-subtle)] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Isi Formulir Manual</span>
          </button>
        </div>

        {isProcessing && (
          <div className="mt-6 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-mid)] text-xs text-center flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono-tech text-[12px] text-[var(--text-primary)] font-medium">
              {processingStatus}
            </span>
          </div>
        )}
      </div>

      {(ocrResult || (selectedFile && !ocrResult && !isProcessing)) && (
        <div className="space-y-6 pt-4 border-t border-[var(--border-light)] animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Pratinjau &amp; Hasil Pembacaan
            </h2>
            {selectedFile && !ocrResult && (
              <button
                type="button"
                onClick={() => handleStartScan()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Mulai Pindai Sekarang
              </button>
            )}
          </div>

          {ocrResult && (
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Hasil Ekstraksi Dokumen Siap</span>
                </div>
                <p className="text-emerald-700 dark:text-emerald-300/80 text-xs font-mono-tech">
                  Nomor KK: <strong>{ocrResult.identitas.no_kk || "—"}</strong> &bull; {ocrResult.total_anggota} Anggota Keluarga Terbaca
                </p>
              </div>

              <button
                type="button"
                onClick={handleProceedToConfirmation}
                className="bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm inline-flex items-center gap-2 transition-colors"
              >
                <span>Periksa &amp; Simpan ke Database</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          )}

          {ocrResult ? (
            <InteractiveKkSheet
              identitas={ocrResult.identitas}
              anggota={ocrResult.anggota}
              previewUrl={previewUrl}
            />
          ) : (
            previewUrl && (
              <div className="mono-card p-4 flex flex-col items-center justify-center">

                <img
                  src={previewUrl}
                  alt="Pratinjau Kartu Keluarga"
                  className="max-h-96 w-auto object-contain rounded-lg shadow-sm"
                />
              </div>
            )
          )}
        </div>
      )}

      <div className="pt-4 border-t border-[var(--border-light)] text-center">
        <button
          type="button"
          onClick={() => setShowNikValidator(!showNikValidator)}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center gap-1.5 transition-colors font-medium"
        >
          <span>{showNikValidator ? "Sembunyikan Alat Validasi NIK" : "Perlu validasi struktur 16 digit NIK?"}</span>
          <svg className={`w-3.5 h-3.5 transition-transform ${showNikValidator ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showNikValidator && (
          <div className="max-w-md mx-auto mt-4 mono-card p-5 space-y-3 text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Validasi Struktur 16 Digit NIK
              </span>
              <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-light)]">
                {testNik.length}/16
              </span>
            </div>
            <div>
              <input
                type="text"
                maxLength={16}
                value={testNik}
                onChange={(e) => setTestNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                placeholder="Masukkan 16 digit NIK"
                className="mono-input font-mono-tech text-xs"
              />
            </div>
            {decodedNik.valid ? (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-[11px] font-mono-tech space-y-1 text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Format NIK Terverifikasi</span>
                </div>
                <div className="pl-5 space-y-0.5 text-[11px] text-emerald-800 dark:text-emerald-300/90">
                  <div>Jenis Kelamin: <strong>{decodedNik.gender}</strong></div>
                  <div>Tanggal Lahir: <strong>{decodedNik.birth_date}</strong></div>
                  <div>Kode Wilayah: <strong>{decodedNik.prov_code}.{decodedNik.city_code}.{decodedNik.district_code}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] font-mono-tech text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{decodedNik.reason}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
