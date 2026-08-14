"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message || "Gagal membaca profil akun.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (!profile) {
      setError("Akun berhasil login, tetapi profil belum terdaftar.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (profile.status !== "aktif") {
      setError("Akun Anda tidak aktif. Silakan hubungi Kepala Sekolah.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // The preference is intentionally kept local; Supabase still manages the session securely.
    if (remember) localStorage.setItem("paud_remember_login", "1");
    else localStorage.removeItem("paud_remember_login");

    window.location.href = profile.role === "kepala_sekolah" ? "/kepala" : "/guru";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100 px-4 py-8 sm:px-6">
      {/* Decorative sky */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-emerald-300/35 blur-2xl" />
        <div className="absolute right-10 top-8 h-28 w-28 rounded-full bg-yellow-300/80 shadow-[0_0_60px_rgba(250,204,21,.45)]" />
        <div className="absolute left-[8%] top-28 h-12 w-28 rounded-full bg-white/70 blur-sm" />
        <div className="absolute right-[10%] top-48 h-10 w-24 rounded-full bg-white/70 blur-sm" />
        <div className="absolute bottom-0 left-0 h-44 w-full bg-gradient-to-t from-emerald-300/70 to-transparent" />
        <div className="absolute bottom-0 left-0 h-3 w-full bg-emerald-500/70" />
      </div>

      {/* Friendly background trees */}
      <div className="pointer-events-none absolute bottom-10 left-[-20px] hidden sm:block">
        <div className="h-28 w-28 rounded-full bg-emerald-500/75 shadow-[35px_12px_0_8px_rgba(34,197,94,.6),65px_-12px_0_4px_rgba(74,222,128,.55)]" />
        <div className="mx-auto h-32 w-7 rounded-full bg-amber-800/70" />
      </div>
      <div className="pointer-events-none absolute bottom-0 right-[-20px] hidden sm:block">
        <div className="h-32 w-32 rounded-full bg-emerald-500/75 shadow-[-35px_5px_0_8px_rgba(34,197,94,.6),-70px_-18px_0_4px_rgba(74,222,128,.55)]" />
        <div className="mx-auto h-36 w-8 rounded-full bg-amber-800/70" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_520px_1fr]">
          {/* Left message */}
          <div className="hidden text-center lg:block">
            <div className="mx-auto max-w-xs rounded-3xl bg-white/55 p-7 backdrop-blur-sm">
              <div className="text-3xl font-black leading-tight text-blue-900">
                “Disiplin hari ini,
                <br />
                prestasi esok hari.”
              </div>
              <div className="mx-auto mt-5 h-2 w-32 rounded-full bg-yellow-400" />
              <div className="mt-6 flex justify-center gap-3 text-5xl" aria-hidden="true">
                <span>🧒</span><span>👧</span>
              </div>
            </div>
          </div>

          {/* Login card */}
          <section className="w-full rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_25px_70px_rgba(15,67,76,.18)] backdrop-blur-xl sm:p-9">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-yellow-50 shadow-inner ring-8 ring-yellow-100/70">
                <img
                  src="/logo-paud-pencarsari.svg"
                  alt="Logo PAUD Pencarsari"
                  className="h-28 w-28 object-contain"
                />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-blue-950 sm:text-[2.15rem]">
                Absensi PAUD Pencarsari
              </h1>
              <p className="mt-2 text-base text-slate-500">
                Sistem Absensi Guru &amp; Kepala Sekolah
              </p>
              <div className="mx-auto mt-5 flex max-w-64 gap-2">
                <span className="h-1.5 flex-1 rounded-full bg-blue-500" />
                <span className="h-1.5 flex-1 rounded-full bg-yellow-400" />
                <span className="h-1.5 flex-1 rounded-full bg-emerald-500" />
              </div>
            </div>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <label className="relative block">
                <span className="sr-only">Email / akun login</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-blue-900">✉</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="Email / akun login"
                  className="h-16 w-full rounded-2xl border-2 border-slate-200 bg-white pl-14 pr-4 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Password</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-blue-900">♙</span>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  className="h-16 w-full rounded-2xl border-2 border-slate-200 bg-white pl-14 pr-14 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-2 text-xl text-slate-500 hover:bg-slate-100"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? "◉" : "◌"}
                </button>
              </label>

              <div className="flex items-center justify-between px-1 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                  />
                  Ingat saya
                </label>
                <span className="font-semibold text-blue-600">Lupa password?</span>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-lg font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:from-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-2xl transition-transform group-hover:translate-x-1">↪</span>
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-sm text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>atau</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-5 text-blue-700">
              <span className="mr-2 font-black">ⓘ</span>
              Gunakan email/akun yang telah diberikan oleh admin sekolah.
            </div>

            <p className="mt-6 text-center text-sm font-semibold text-blue-900">
              <span className="mr-2 text-xl text-rose-500">♥</span>
              Bersama Mendidik, Bersama Membangun Generasi
            </p>
          </section>

          {/* Right school card */}
          <div className="hidden lg:block">
            <div className="mx-auto max-w-xs rounded-[2rem] border border-white/70 bg-white/55 p-5 text-center shadow-lg backdrop-blur-sm">
              <div className="relative mx-auto h-44 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-300 to-sky-100">
                <div className="absolute left-5 top-5 h-9 w-20 rounded-full bg-white/80" />
                <div className="absolute right-5 top-9 h-7 w-16 rounded-full bg-white/80" />
                <div className="absolute bottom-0 left-0 h-20 w-full bg-emerald-300" />
                <div className="absolute bottom-7 left-1/2 h-24 w-36 -translate-x-1/2 rounded-t-2xl bg-amber-200 shadow-inner">
                  <div className="absolute -top-5 left-[-8px] h-8 w-[152px] rounded-t-2xl bg-rose-400" />
                  <div className="absolute bottom-0 left-1/2 h-12 w-10 -translate-x-1/2 rounded-t-lg bg-blue-300" />
                  <div className="absolute left-3 top-8 h-7 w-7 rounded bg-white" />
                  <div className="absolute right-3 top-8 h-7 w-7 rounded bg-white" />
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-1 text-xs font-black text-blue-900 shadow">
                  PAUD PENCARSARI
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-600">
                Selamat datang di sistem absensi guru.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
