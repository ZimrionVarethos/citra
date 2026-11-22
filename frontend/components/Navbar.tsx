"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

export default function Navbar() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    const saved = localStorage.getItem("kk_theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }

    checkHealth()
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("kk_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-surface)] border-b border-[var(--border-mid)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 text-[var(--text-primary)] no-underline">
          <div className="w-8 h-8 rounded bg-[var(--bg-emphasis)] text-[var(--text-inverted)] flex items-center justify-center font-bold text-xs font-mono-tech">
            KK
          </div>
          <span className="font-bold text-base tracking-tight">
            KK Scanner
          </span>
        </Link>

        {/* Navigation */}
        <nav aria-label="Navigasi Utama" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            Pemindai
          </Link>
          <Link
            href="/kk"
            className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            Data Tersimpan
          </Link>
        </nav>

        {/* Status & Theme Toggle */}
        <div className="flex items-center gap-3">
          <div
            title={backendStatus === "online" ? "Server backend lokal aktif" : "Server backend belum terhubung"}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-tech bg-[var(--bg-subtle)] border border-[var(--border-mid)]"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === "online" ? "bg-emerald-500" : "bg-zinc-400"
              }`}
            />
            <span className="text-[11px] text-[var(--text-secondary)]">
              {backendStatus === "online" ? "Lokal Aktif" : "Menghubungkan"}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ganti tema warna"
            className="p-1.5 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] border border-[var(--border-mid)]"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </div>
    </header>
  );
}
