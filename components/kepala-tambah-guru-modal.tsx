"use client";

import { FormEvent, useState } from "react";

function todayWib() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function KepalaTambahGuruModal({ open, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nama: "",
    email: "",
    nomor_whatsapp: "",
    tanggal_join: todayWib(),
  });

  if (!open) return null;

  function close() {
    if (saving) return;
    setError("");
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/kepala/guru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal menambahkan guru.");
      }

      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan guru.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="flex min-h-full items-center justify-center py-4 sm:py-8">
        <div
          className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-tambah-guru-title"
        >
          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-2xl ring-1 ring-emerald-100">👤</div>
                <h2 id="dashboard-tambah-guru-title" className="text-2xl font-black tracking-tight sm:text-3xl">Tambah Guru</h2>
                <p className="mt-1 text-sm text-slate-500">Buat akun guru baru untuk sistem absensi.</p>
              </div>
              <button type="button" onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup modal">×</button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Nama Lengkap
                  <input id="dashboard-nama-guru" name="nama" required autoComplete="name" placeholder="Contoh: Walid" value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Email
                  <input id="dashboard-email-guru" name="email" required type="email" autoComplete="email" placeholder="guru@gmail.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Nomor WhatsApp
                  <input id="dashboard-whatsapp-guru" name="nomor_whatsapp" required type="tel" inputMode="tel" autoComplete="tel" placeholder="081234567890" value={form.nomor_whatsapp} onChange={(event) => setForm({ ...form, nomor_whatsapp: event.target.value })} className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  <span className="mt-1 block text-xs font-normal text-slate-400">Contoh: 081234567890</span>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Tanggal Join
                  <input id="dashboard-tanggal-join" name="tanggal_join" required type="date" value={form.tanggal_join} onChange={(event) => setForm({ ...form, tanggal_join: event.target.value })} className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-100">
                <div className="flex gap-3">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <p className="font-bold">Akun guru akan dibuat otomatis</p>
                    <p className="mt-0.5 text-xs leading-5 text-emerald-700">Username mengikuti nama guru dan password sementara dibuat oleh sistem.</p>
                  </div>
                </div>
              </div>

              {error && <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-100" role="alert">{error}</div>}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={close} disabled={saving} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Batal</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan Guru"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
