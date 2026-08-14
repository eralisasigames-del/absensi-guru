"use client";

import { FormEvent, useMemo, useState } from "react";

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

type Credentials = {
  nama: string;
  whatsapp: string;
  username: string;
  password: string;
};

function normalizeWhatsApp(value: string) {
  let number = value.replace(/\D/g, "");
  if (number.startsWith("0")) number = `62${number.slice(1)}`;
  else if (number.startsWith("8")) number = `62${number}`;
  return number;
}

export default function KepalaTambahGuruModal({ open, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    email: "",
    nomor_whatsapp: "",
    tanggal_join: todayWib(),
  });

  const whatsappMessage = useMemo(() => {
    if (!credentials) return "";
    return [
      `Halo ${credentials.nama},`,
      "",
      "Akun Absensi Guru PAUD Pencarsari Anda sudah dibuat.",
      "",
      `Username: ${credentials.username}`,
      `Password sementara: ${credentials.password}`,
      "",
      "Silakan login menggunakan kredensial tersebut dan segera ubah password setelah berhasil masuk.",
    ].join("\n");
  }, [credentials]);

  if (!open) return null;

  function close() {
    if (saving) return;
    setError("");
    setCopied(false);
    setCredentials(null);
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

      setCredentials({
        nama: result.guru?.nama ?? form.nama,
        whatsapp: result.guru?.nomor_whatsapp ?? normalizeWhatsApp(form.nomor_whatsapp),
        username: result.credentials?.username ?? result.guru?.username ?? form.nama,
        password: result.credentials?.password ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan guru.");
    } finally {
      setSaving(false);
    }
  }

  async function copyCredentials() {
    if (!credentials) return;
    await navigator.clipboard.writeText(
      `Akun Absensi Guru PAUD Pencarsari\nNama: ${credentials.nama}\nUsername: ${credentials.username}\nPassword sementara: ${credentials.password}`
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function sendWhatsApp() {
    if (!credentials) return;
    const number = normalizeWhatsApp(credentials.whatsapp);
    if (!number) return;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage)}`, "_blank", "noopener,noreferrer");
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
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-2xl ring-1 ring-emerald-100">{credentials ? "✓" : "👤"}</div>
                <h2 id="dashboard-tambah-guru-title" className="text-2xl font-black tracking-tight sm:text-3xl">{credentials ? "Guru Berhasil Dibuat" : "Tambah Guru"}</h2>
                <p className="mt-1 text-sm text-slate-500">{credentials ? "Simpan atau kirim kredensial berikut kepada guru." : "Buat akun guru baru untuk sistem absensi."}</p>
              </div>
              <button type="button" onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup modal">×</button>
            </div>

            {credentials ? (
              <div className="mt-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Nama</p>
                    <p className="mt-1 font-bold text-slate-900">{credentials.nama}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">WhatsApp</p>
                    <p className="mt-1 font-bold text-slate-900">{credentials.whatsapp}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Username</p>
                    <p className="mt-1 font-bold text-slate-900">{credentials.username}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Password sementara</p>
                    <p className="mt-1 break-all font-bold text-slate-900">{credentials.password}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={copyCredentials} className="flex-1 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">{copied ? "✓ Tersalin" : "📋 Salin Kredensial"}</button>
                  <button type="button" onClick={sendWhatsApp} className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-700">💬 Kirim WhatsApp</button>
                </div>

                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">
                  <strong>Penting:</strong> password ini adalah password sementara. Minta guru mengganti password setelah login.
                </div>

                <button type="button" onClick={close} className="w-full rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50">Selesai</button>
              </div>
            ) : (
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
                      <p className="mt-0.5 text-xs leading-5 text-emerald-700">Username mengikuti nama guru dan password sementara dibuat oleh sistem. Setelah tersimpan, kredensial bisa langsung dikirim ke WhatsApp guru.</p>
                    </div>
                  </div>
                </div>

                {error && <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-100" role="alert">{error}</div>}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={close} disabled={saving} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Batal</button>
                  <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan Guru"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
