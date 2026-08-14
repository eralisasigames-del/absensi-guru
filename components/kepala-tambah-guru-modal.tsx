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

type Credentials = {
  nama: string;
  whatsapp: string;
  username: string;
  password: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (credentials: Credentials) => void;
};

function normalizeWhatsApp(value: string) {
  let number = value.replace(/\D/g, "");
  if (number.startsWith("0")) number = `62${number.slice(1)}`;
  else if (number.startsWith("8")) number = `62${number}`;
  return number;
}

export default function KepalaTambahGuruModal({ open, onClose, onCreated }: Props) {
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

      const credentials: Credentials = {
        nama: result.guru?.nama ?? form.nama,
        whatsapp: result.guru?.nomor_whatsapp ?? normalizeWhatsApp(form.nomor_whatsapp),
        username: result.credentials?.username ?? result.guru?.username ?? form.email,
        password: result.credentials?.password ?? "",
      };

      onCreated?.(credentials);
      onClose();
      setForm({ nama: "", email: "", nomor_whatsapp: "", tanggal_join: todayWib() });
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
          aria-labelledby="tambah-guru-title"
        >
          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-xl text-emerald-700 ring-1 ring-emerald-100">👤+</div>
                <h2 id="tambah-guru-title" className="text-2xl font-black tracking-tight sm:text-3xl">Tambah Guru</h2>
                <p className="mt-1 text-sm text-slate-500">Buat akun guru baru untuk sistem absensi</p>
              </div>
              <button type="button" onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup modal">×</button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-slate-800">
                  Nama Lengkap
                  <input id="tambah-guru-nama" name="nama" required autoComplete="name" placeholder="Contoh: Walid" value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="text-sm font-bold text-slate-800">
                  Email / Username Login
                  <input id="tambah-guru-email" name="email" required type="email" autoComplete="email" placeholder="guru@gmail.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  <span className="mt-1 block text-xs font-normal text-slate-400">Email ini juga menjadi username untuk login.</span>
                </label>
                <label className="text-sm font-bold text-slate-800">
                  Nomor WhatsApp
                  <input id="tambah-guru-whatsapp" name="nomor_whatsapp" required type="tel" inputMode="tel" autoComplete="tel" placeholder="081234567890" value={form.nomor_whatsapp} onChange={(event) => setForm({ ...form, nomor_whatsapp: event.target.value })} className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  <span className="mt-1 block text-xs font-normal text-slate-400">Contoh: 081234567890</span>
                </label>
                <label className="text-sm font-bold text-slate-800">
                  Tanggal Join
                  <input id="tambah-guru-tanggal-join" name="tanggal_join" required type="date" value={form.tanggal_join} onChange={(event) => setForm({ ...form, tanggal_join: event.target.value })} className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <div className="flex gap-3">
                  <span className="mt-0.5 text-xl text-emerald-700">🛡</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Email menjadi username login</p>
                    <p className="mt-1 text-xs leading-5 text-emerald-700">Password sementara dibuat otomatis dan bisa dikirim langsung melalui WhatsApp setelah akun berhasil dibuat.</p>
                  </div>
                </div>
              </div>

              {error && <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-100" role="alert">{error}</div>}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={close} disabled={saving} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Batal</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan Guru"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
