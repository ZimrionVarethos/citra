import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "monospace"],
      },
      colors: {
        canvas: "var(--bg-canvas)",
        surface: "var(--bg-surface)",
        subtle: "var(--bg-subtle)",
        muted: "var(--bg-muted)",
        emphasis: "var(--bg-emphasis)",
        "border-strong": "var(--border-strong)",
        "border-mid": "var(--border-mid)",
        "border-light": "var(--border-light)",
      },
      boxShadow: {
        arch: "3px 3px 0px #09090B",
        "arch-sm": "2px 2px 0px #09090B",
        "arch-dark": "3px 3px 0px #FAFAFA",
        "arch-dark-sm": "2px 2px 0px #FAFAFA",
      },
      keyframes: {
        ocrScanSweep: {
          "0%, 100%": { top: "4%" },
          "50%": { top: "92%" },
        },
      },
      animation: {
        ocrScan: "ocrScanSweep 5.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
