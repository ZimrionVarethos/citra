"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("kk_theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("kk_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-surface)] border-b border-[var(--border-mid)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="font-bold text-base tracking-tight text-[var(--text-primary)] no-underline">
          KK Scanner
        </Link>

        {/* Navigation & Theme Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
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
