"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login gagal.");
      if (remember) localStorage.setItem("paud_remember_login", "1");
      else localStorage.removeItem("paud_remember_login");
      window.location.href = result.role === "kepala_sekolah" ? "/kepala" : "/guru";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-sky-200 px-4 py-5 sm:px-6 lg:px-8">
      <img src="/login-paud-bg.svg" alt="Ilustrasi PAUD Pencarsari" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-white/10" />
      <div className="relative z-10 flex min-h-[calc(100vh-2.5rem)] items-center justify-center">
        <div className="grid w-full max-w-[1500px] items-center gap-8 lg:grid-cols-[1fr_minmax(520px,650px)_1fr]">
          <aside className="hidden lg:block">
            <div className="mx-auto max-w-[430px] px-6 text-center">
              <div className="text-4xl font-black leading-tight tracking-tight text-blue-950 xl:text-5xl">“Disiplin hari ini,<br />prestasi esok hari.”</div>
              <div className="mx-auto mt-5 h-2 w-40 rounded-full bg-yellow-400 shadow-lg shadow-yellow-300/40" />
            </div>
          </aside>
          <section className="w-full rounded-[2rem] border border-white/90 bg-white/95 p-5 shadow-[0_28px_80px_rgba(15,55,85,.25)] backdrop-blur-xl sm:rounded-[2.5rem] sm:p-8 md:p-10">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_8px_28px_rgba(15,23,42,.12)] ring-8 ring-yellow-100/90 sm:h-36 sm:w-36"><img src="/logo-paud-pencarsari.jpeg" alt="Logo PAUD Pencarsari" className="h-full w-full object-contain" /></div>
              <h1 className="text-3xl font-black tracking-tight text-blue-950 sm:text-[2.2rem]">Absensi PAUD Pencarsari</h1>
              <p className="mt-2 text-base text-slate-500 sm:text-lg">Sistem Absensi Guru &amp; Kepala Sekolah</p>
              <div className="mx-auto mt-5 flex max-w-[280px] gap-2"><span className="h-1.5 flex-1 rounded-full bg-blue-500" /><span className="h-1.5 flex-1 rounded-full bg-yellow-400" /><span className="h-1.5 flex-1 rounded-full bg-emerald-500" /></div>
            </div>
            <form onSubmit={submit} className="mt-7 space-y-4 sm:mt-8">
              <label className="relative block"><span className="sr-only">Email atau akun login</span><span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-blue-950">✉</span><input id="login-identifier" name="identifier" required type="text" autoComplete="username" placeholder="Email / akun login" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="h-16 w-full rounded-2xl border-2 border-blue-100 bg-white pl-14 pr-4 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
              <label className="relative block"><span className="sr-only">Password</span><span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-blue-950">🔒</span><input id="login-password" name="password" required type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-16 w-full rounded-2xl border-2 border-blue-100 bg-white pl-14 pr-14 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-xl text-slate-500 transition hover:bg-slate-100" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? "◉" : "◌"}</button></label>
              <div className="flex items-center justify-between px-1 text-sm sm:text-base"><label className="flex cursor-pointer items-center gap-2 text-slate-600"><input id="remember-login" name="remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />Ingat saya</label><span className="font-semibold text-blue-600">Lupa password?</span></div>
              {error && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
              <button type="submit" disabled={loading} className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-lg font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:from-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"><span className="text-2xl">↪</span>{loading ? "Memproses..." : "Masuk"}</button>
            </form>
            <div className="my-6 flex items-center gap-3 text-sm text-slate-400"><div className="h-px flex-1 bg-slate-200" /><span>atau</span><div className="h-px flex-1 bg-slate-200" /></div>
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-5 text-blue-700 sm:px-5 sm:py-4"><span className="mr-2 font-black">ⓘ</span>Gunakan email/akun yang telah diberikan oleh admin sekolah.</div>
            <p className="mt-6 text-center text-sm font-semibold text-blue-900 sm:text-base"><span className="mr-2 text-xl text-rose-500">♥</span>Bersama Mendidik, Bersama Membangun Generasi</p>
          </section>
          <aside className="hidden lg:block" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}
