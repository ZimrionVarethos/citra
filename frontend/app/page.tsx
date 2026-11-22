"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import InteractiveKkSheet from "@/components/InteractiveKkSheet";
import Toast from "@/components/Toast";
import { checkHealth, uploadOcrImage } from "@/lib/api";
import { compressImageClientSide, decodeNik } from "@/lib/utils";
import { AnggotaKeluarga, IdentitasKK, OcrResult, ToastMessage } from "@/types";

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

      {/* Hero Heading */}
      <div className="border-b border-[var(--border-mid)] pb-6 space-y-1">
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
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Unggah Dokumen Kartu Keluarga
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Format yang didukung: JPG atau PNG (maksimal 8 MB).
              </p>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border-mid)] rounded-lg p-6 text-center cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-lg">
                  📄
                </div>
                <div className="text-xs font-medium text-[var(--text-primary)]">
                  {selectedFile ? (
                    <span className="font-bold underline">{selectedFile.name}</span>
                  ) : (
                    <span>Klik untuk memilih berkas atau seret ke sini</span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {selectedFile
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Klik untuk mengganti`
                    : "Pastikan foto tegak, tulisan tajam, dan tabel tidak terpotong"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isProcessing || !selectedFile}
                onClick={handleStartScan}
                className="w-full mono-btn-primary py-2.5 text-xs sm:text-sm font-semibold disabled:opacity-40"
              >
                {isProcessing ? processingStatus : "Mulai Pindai Dokumen"}
              </button>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleLoadSample}
                  className="mono-btn-secondary py-2 text-xs font-medium disabled:opacity-50"
                >
                  Gunakan Citra Contoh
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleManualInput}
                  className="mono-btn-secondary py-2 text-xs font-medium disabled:opacity-50"
                >
                  Isi Formulir Manual
                </button>
              </div>
            </div>

            {/* Status note if processing */}
            {isProcessing && (
              <div className="p-3 rounded bg-[var(--bg-subtle)] border border-[var(--border-mid)] text-xs text-center space-y-1">
                <div className="inline-block w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin mr-2" />
                <span className="font-mono-tech text-[11px]">{processingStatus}</span>
              </div>
            )}
          </div>

          {/* NIK Decoder Tool */}
          <div className="mono-card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Validasi Struktur 16 Digit NIK
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={16}
                value={testNik}
                onChange={(e) => setTestNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                placeholder="Masukkan 16 digit NIK"
                className="flex-1 px-3 py-1.5 rounded border border-[var(--border-mid)] bg-[var(--bg-subtle)] font-mono-tech text-xs"
              />
            </div>
            {decodedNik.valid ? (
              <div className="p-2.5 rounded bg-[var(--bg-subtle)] text-[11px] font-mono-tech space-y-1 text-[var(--text-secondary)]">
                <div>Jenis Kelamin: <strong>{decodedNik.gender}</strong></div>
                <div>Tanggal Lahir: <strong>{decodedNik.birth_date}</strong></div>
                <div>Kode Wilayah: <strong>{decodedNik.prov_code}.{decodedNik.city_code}.{decodedNik.district_code}</strong></div>
              </div>
            ) : (
              <p className="text-[11px] text-amber-600 font-mono-tech">
                {decodedNik.reason}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Result / Facsimile Sheet */}
        <div className="lg:col-span-7 space-y-4">
          {ocrResult ? (
            <div className="space-y-4">
              {/* Ready banner with direct button to Confirmation Form */}
              <div className="p-4 rounded border border-emerald-300 bg-emerald-50 text-emerald-950 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <strong className="block text-sm">Hasil Ekstraksi Dokumen Siap</strong>
                  <span className="text-emerald-800">
                    Nomor KK: {ocrResult.identitas.no_kk || "—"} • {ocrResult.total_anggota} Anggota
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleProceedToConfirmation}
                  className="mono-btn-primary px-4 py-2 text-xs font-bold bg-emerald-900 text-white"
                >
                  Periksa &amp; Simpan ke Database →
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
            <div className="mono-card p-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-xl text-[var(--text-muted)]">
                🔍
              </div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Belum Ada Dokumen yang Dipindai
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Unggah foto Kartu Keluarga Anda atau klik tombol &quot;Gunakan Citra Contoh&quot; untuk menguji pembacaan otomatis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
