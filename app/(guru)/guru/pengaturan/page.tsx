"use client";

import { FormEvent, useState } from "react";

export default function PengaturanGuruPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/guru/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal mengubah password.");
      setPassword("");
      setConfirmation("");
      setMessage("Password berhasil diubah. Gunakan password baru saat login berikutnya.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <a href="/guru" className="text-sm font-bold text-emerald-700 hover:underline">← Dashboard Guru</a>
        <section className="mt-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Pengaturan Akun</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Ubah Password</h1>
          <p className="mt-2 text-slate-500">Ganti password sementara yang diberikan sekolah dengan password pribadi Anda.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Password Baru</label>
              <input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" placeholder="Minimal 8 karakter" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Konfirmasi Password</label>
              <input type="password" minLength={8} required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" placeholder="Ulangi password baru" />
            </div>

            {error && <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
            {message && <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>}

            <button disabled={loading} className="rounded-2xl bg-emerald-600 px-6 py-3 font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
