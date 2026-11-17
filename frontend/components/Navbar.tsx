"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

export default function Navbar() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "cold_start">("checking");

  useEffect(() => {
    // Check saved theme
    const saved = localStorage.getItem("kk_theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }

    // Ping backend health
    checkHealth()
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("cold_start"));
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("kk_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-surface)] border-b-2 border-[var(--border-strong)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[64px] py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Typographic Masthead */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span className="px-2.5 py-1 font-mono-tech text-xs font-bold border-2 border-[var(--border-strong)] bg-[var(--bg-emphasis)] text-[var(--text-inverted)] rounded">
            [LOGO]
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-[var(--text-primary)]">
                KK-SCANNER PRO
              </span>
              <span className="px-2 py-0.5 font-mono-tech text-[10px] font-bold bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-mid)] rounded">
                PERMENDAGRI 109/2019
              </span>
            </div>
            <span className="block text-[11px] text-[var(--text-secondary)]">
              Sistem Ekstraksi OCR &amp; Validasi Struktur 16-Digit Kartu Keluarga
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav aria-label="Navigasi Utama" className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3 py-2 rounded text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
          >
            Meja Pemindai
          </Link>
          <Link
            href="/kk"
            className="px-3 py-2 rounded text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
          >
            Data KK Tersimpan
          </Link>
        </nav>

        {/* Utility Actions */}
        <div className="flex items-center gap-2.5">
          {/* Backend Status indicator */}
          <div
            title={
              backendStatus === "online"
                ? "Backend Python & OCR Mesin Siap"
                : backendStatus === "cold_start"
                ? "Backend sedang proses warming-up (Render Cold Start)"
                : "Memeriksa status peladen..."
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono-tech border border-[var(--border-mid)] bg-[var(--bg-subtle)]"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === "online"
                  ? "bg-emerald-500 animate-pulse"
                  : backendStatus === "cold_start"
                  ? "bg-amber-500 animate-ping"
                  : "bg-zinc-400"
              }`}
            />
            <span className="hidden sm:inline font-bold">
              {backendStatus === "online"
                ? "SERVER ONLINE"
                : backendStatus === "cold_start"
                ? "WARMING UP"
                : "CONNECTING"}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Ganti tema tampilan terang atau gelap"
            className="mono-btn-secondary px-3 py-1.5 min-h-[36px] text-xs font-mono-tech"
          >
            {theme === "light" ? "Mode Gelap" : "Mode Terang"}
          </button>
        </div>
      </div>
    </header>
  );
}
