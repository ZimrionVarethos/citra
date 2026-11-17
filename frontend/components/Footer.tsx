export default function Footer() {
  return (
    <footer className="bg-[var(--bg-surface)] border-t-2 border-[var(--border-strong)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
        <div>
          <span className="font-extrabold text-[var(--text-primary)]">KK-SCANNER PRO</span>
          <span>
            {" "}• Sistem Ekstraksi Citra &amp; Validasi Kependudukan Republik Indonesia (Permendagri No. 109/2019)
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono-tech text-[11px]">
          <span className="px-2 py-0.5 rounded bg-white text-[#09090B] border border-[#09090B]">
            #FFFFFF Putih
          </span>
          <span className="px-2 py-0.5 rounded bg-[#E4E4E7] text-[#09090B] border border-[#09090B]">
            #E4E4E7 Abu
          </span>
          <span className="px-2 py-0.5 rounded bg-[#09090B] text-white border border-[#09090B]">
            #09090B Hitam
          </span>
        </div>
      </div>
    </footer>
  );
}
