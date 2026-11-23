"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
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

  const isHomeActive = pathname === "/" || pathname === "/konfirmasi";
  const isDataActive = pathname.startsWith("/kk");

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-light)] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg tracking-tight text-[var(--text-primary)] no-underline">
          <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span>KK Scanner</span>
        </Link>

        {/* 2 Navigation Menus */}
        <nav aria-label="Navigasi Utama" className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/"
            className={`relative py-5 text-xs sm:text-sm font-medium transition-colors ${
              isHomeActive
                ? "text-red-600 dark:text-red-400 font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Beranda
            {isHomeActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400 rounded-full" />
            )}
          </Link>
          <Link
            href="/kk"
            className={`relative py-5 text-xs sm:text-sm font-medium transition-colors ${
              isDataActive
                ? "text-red-600 dark:text-red-400 font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Data Tersimpan
            {isDataActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400 rounded-full" />
            )}
          </Link>
        </nav>

        {/* Right action: Theme toggle */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ganti tema warna"
            className="w-9 h-9 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-[var(--border-mid)] flex items-center justify-center transition-colors shadow-sm"
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
