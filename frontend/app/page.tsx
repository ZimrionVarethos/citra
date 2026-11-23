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

  const handleStartScan = async () => {
    if (!selectedFile) {
      addToast("error", "Pilih atau unggah file foto Kartu Keluarga terlebih dahulu.");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus("Mengompresi citra (Max 2000px, Kualitas 0.8)...");
      const compressedBlob = await compressImageClientSide(selectedFile, 2000, 0.8);

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
      setProcessingStatus("Memuat citra contoh (contoh.jpeg)...");
      const res = await fetch("/contoh.jpeg");
      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      setPreviewUrl(localUrl);
      setSelectedFile(new File([blob], "contoh.jpeg", { type: "image/jpeg" }));

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Page Header */}
      <div className="border-b border-[var(--border-light)] pb-6 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Pindai Kartu Keluarga
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Ekstraksi otomatis dokumen Kartu Keluarga dan validasi data kependudukan secara 100% lokal tanpa cloud API.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="mono-card p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Unggah Dokumen Kartu Keluarga
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Format yang didukung: JPG atau PNG (maksimal 8 MB).
              </p>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-[var(--border-mid)] hover:border-[var(--text-primary)] rounded-xl p-6 text-center cursor-pointer bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--bg-surface)] border border-[var(--border-mid)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] shadow-sm transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {selectedFile ? (
                      <span className="underline decoration-1 underline-offset-2">{selectedFile.name}</span>
                    ) : (
                      <span>Klik untuk memilih berkas atau seret ke sini</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                    {selectedFile
                      ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB &bull; Klik untuk mengganti berkas`
                      : "Pastikan foto tegak, tulisan tajam, dan tabel tidak terpotong"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={isProcessing || !selectedFile}
                onClick={handleStartScan}
                className="w-full mono-btn-primary py-2.5 text-xs sm:text-sm font-semibold disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{processingStatus}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Mulai Pindai Dokumen</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleLoadSample}
                  className="mono-btn-secondary py-2 text-xs font-medium disabled:opacity-50"
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
                  className="mono-btn-secondary py-2 text-xs font-medium disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Isi Formulir Manual</span>
                </button>
              </div>
            </div>

            {/* Status note if processing */}
            {isProcessing && (
              <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-mid)] text-xs text-center flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
                <span className="font-mono-tech text-[11px] text-[var(--text-secondary)]">{processingStatus}</span>
              </div>
            )}
          </div>

          {/* NIK Decoder Tool */}
          <div className="mono-card p-5 space-y-3">
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
        </div>

        {/* Right Column: Result / Facsimile Sheet */}
        <div className="lg:col-span-7 space-y-4">
          {ocrResult ? (
            <div className="space-y-4">
              {/* Ready banner with direct button to Confirmation Form */}
              <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-900 dark:text-emerald-200">
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Hasil Ekstraksi Dokumen Siap</span>
                  </div>
                  <span className="text-emerald-700 dark:text-emerald-300/80 text-[11px] font-mono-tech mt-0.5 block">
                    Nomor KK: {ocrResult.identitas.no_kk || "—"} &bull; {ocrResult.total_anggota} Anggota
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleProceedToConfirmation}
                  className="mono-btn-primary px-4 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white flex items-center gap-1.5"
                >
                  <span>Periksa &amp; Simpan ke Database</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

              {/* Document Facsimile Sheet */}
              <InteractiveKkSheet
                identitas={ocrResult.identitas}
                anggota={ocrResult.anggota}
                previewUrl={previewUrl}
              />
            </div>
          ) : (
            <div className="mono-card p-12 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-light)] flex items-center justify-center text-[var(--text-muted)] shadow-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  Belum Ada Dokumen yang Dipindai
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                  Unggah foto Kartu Keluarga Anda atau klik tombol &quot;Gunakan Citra Contoh&quot; untuk menguji pembacaan otomatis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
