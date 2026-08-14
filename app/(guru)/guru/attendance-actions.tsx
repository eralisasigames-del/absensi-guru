"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Attendance = { tanggal: string; jam_hadir: string | null; jam_pulang: string | null } | null;

function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function time(value: string | null | undefined) {
  if (!value) return "Belum dicatat";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AttendanceActions() {
  const [attendance, setAttendance] = useState<Attendance>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("attendance")
      .select("tanggal, jam_hadir, jam_pulang")
      .eq("user_id", user.id)
      .eq("tanggal", todayJakarta())
      .maybeSingle();

    setAttendance(data);
  }

  useEffect(() => { load(); }, []);

  async function hadir() {
    if (attendance?.jam_hadir) return;
    setBusy(true);
    setError(false);
    setMessage("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("attendance").insert({
      user_id: user.id,
      tanggal: todayJakarta(),
      jam_hadir: new Date().toISOString(),
    });

    if (insertError) {
      setError(true);
      setMessage(insertError.code === "23505" ? "Anda sudah melakukan absensi hadir hari ini." : `Absensi hadir gagal: ${insertError.message}`);
    } else {
      setMessage("Absensi hadir berhasil dicatat.");
      await load();
    }
    setBusy(false);
  }

  async function pulang() {
    if (!attendance?.jam_hadir || attendance.jam_pulang) return;
    setBusy(true);
    setError(false);
    setMessage("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("attendance")
      .update({ jam_pulang: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("tanggal", todayJakarta())
      .not("jam_hadir", "is", null)
      .is("jam_pulang", null);

    if (updateError) {
      setError(true);
      setMessage(`Absensi pulang gagal: ${updateError.message}`);
    } else {
      setMessage("Absensi pulang berhasil dicatat.");
      await load();
    }
    setBusy(false);
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Absensi Harian</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Catat kehadiran Anda</h2>
        </div>
        <span className="text-sm font-semibold text-slate-500">Hari ini • WIB</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          disabled={busy || !!attendance?.jam_hadir}
          onClick={hadir}
          className="group rounded-3xl bg-emerald-600 p-6 text-left text-white shadow-lg shadow-emerald-600/15 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-2xl">✓</div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{attendance?.jam_hadir ? "SUDAH" : "BELUM"}</span>
          </div>
          <p className="mt-6 text-2xl font-black">ABSEN HADIR</p>
          <p className="mt-1 text-sm text-emerald-50">{attendance?.jam_hadir ? `Tercatat pukul ${time(attendance.jam_hadir)}` : "Tekan untuk mencatat waktu masuk"}</p>
        </button>

        <button
          disabled={busy || !attendance?.jam_hadir || !!attendance?.jam_pulang}
          onClick={pulang}
          className="group rounded-3xl bg-slate-800 p-6 text-left text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl">↗</div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{attendance?.jam_pulang ? "SUDAH" : attendance?.jam_hadir ? "SIAP" : "TERKUNCI"}</span>
          </div>
          <p className="mt-6 text-2xl font-black">ABSEN PULANG</p>
          <p className="mt-1 text-sm text-slate-300">{attendance?.jam_pulang ? `Tercatat pukul ${time(attendance.jam_pulang)}` : attendance?.jam_hadir ? "Tekan setelah selesai bekerja" : "Lakukan absen hadir terlebih dahulu"}</p>
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-slate-600">Status hari ini</span>
        <span className="text-sm font-black text-slate-900">
          {attendance?.jam_pulang ? "✓ Hadir & Pulang tercatat" : attendance?.jam_hadir ? "✓ Hadir tercatat • Menunggu pulang" : "Belum melakukan absensi"}
        </span>
      </div>

      {message && (
        <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
