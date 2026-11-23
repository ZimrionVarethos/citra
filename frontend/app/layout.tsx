import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const ubuntu = Ubuntu({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-ubuntu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KK Scanner",
  description: "Sistem Ekstraksi & Validasi Dokumen Kartu Keluarga.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="light" className={`${ubuntu.variable} ${ubuntu.className} scroll-smooth`}>
      <body className={`min-h-screen flex flex-col font-sans ${ubuntu.className}`}>
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
