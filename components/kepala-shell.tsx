"use client";

import { ReactNode } from "react";
import LogoutButton from "@/components/logout-button";

type ActivePage = "dashboard" | "guru" | "pengajuan" | "laporan";

type Props = {
  children: ReactNode;
  active: ActivePage;
  nama?: string | null;
};

const navItems = [
  { key: "dashboard" as const, href: "/kepala", label: "Dashboard", icon: "⌂" },
  { key: "guru" as const, href: "/kepala/guru", label: "Data Guru", icon: "♟" },
  { key: "pengajuan" as const, href: "/kepala/pengajuan", label: "Pengajuan", icon: "✓" },
  { key: "laporan" as const, href: "/kepala/laporan", label: "Laporan", icon: "▣" },
];

function initials(name?: string | null) {
  const value = (name || "KS").trim();
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
}

export default function KepalaShell({ children, active, nama }: Props) {
  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[260px] lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col px-4 py-5 lg:px-5 lg:py-6">
            <a href="/kepala" className="flex items-center gap-3 px-2">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-2xl ring-1 ring-emerald-100">👥</div>
              <div>
                <p className="text-[15px] font-black leading-tight">Absensi Guru PAUD</p>
                <p className="mt-1 text-xs text-slate-500">PAUD Pencarsari</p>
              </div>
            </a>

            <nav className="mt-6 flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
              {navItems.map((item) => {
                const selected = item.key === active;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${selected ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"}`}
                  >
                    <span className="grid h-7 w-7 place-items-center text-lg">{item.icon}</span>
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <div className="mt-auto hidden border-t border-slate-100 pt-5 lg:block">
              <div className="mb-4 flex items-center gap-3 px-2">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">{initials(nama)}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{nama || "Kepala Sekolah"}</p>
                  <p className="text-xs text-slate-500">Kepala Sekolah</p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1450px] px-4 py-5 sm:px-6 lg:px-9 lg:py-7">
            {children}
            <footer className="py-7 text-center text-xs text-slate-400">Absensi Guru PAUD • PAUD Pencarsari</footer>
          </div>
        </section>
      </div>
    </main>
  );
}
