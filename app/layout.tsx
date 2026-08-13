import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PAUD Absensi Guru",
  description: "Sistem absensi dan izin/cuti guru PAUD"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
