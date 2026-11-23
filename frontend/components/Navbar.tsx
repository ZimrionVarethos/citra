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
    <header className="sticky top-0 z-30 bg-[var(--bg-surface)] border-b border-[var(--border-light)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="font-bold text-base tracking-tight text-[var(--text-primary)] no-underline">
          KK Scanner
        </Link>

        {/* Navigation & Theme Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          <nav aria-label="Navigasi Utama" className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              Pemindai
            </Link>
            <Link
              href="/kk"
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              Data Tersimpan
            </Link>
          </nav>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ganti tema warna"
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] border border-[var(--border-mid)] transition-colors"
          >
            {theme === "light" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
