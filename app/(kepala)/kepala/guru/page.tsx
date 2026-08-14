"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import KepalaShell from "@/components/kepala-shell";

type Teacher = {
  id: string; nama: string; username: string | null; status: "aktif" | "nonaktif"; created_at: string;
  tanggal_join: string | null; tanggal_resign: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T00:00:00+07:00`));
}
function durationLabel(join: string | null, resign: string | null) {
  if (!join) return "-";
  const start = new Date(`${join}T00:00:00+07:00`); const end = resign ? new Date(`${resign}T00:00:00+07:00`) : new Date();
  let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth(); if (end.getDate() < start.getDate()) months -= 1; months = Math.max(0, months);
  const years = Math.floor(months / 12); const remainingMonths = months % 12; const parts: string[] = [];
  if (years) parts.push(`${years} th`); if (remainingMonths) parts.push(`${remainingMonths} bln`); return parts.join(" ") || "< 1 bln";
}
function todayWib() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }

export default function KelolaGuruPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"semua" | "aktif" | "nonaktif">("aktif"); const [resignTeacher, setResignTeacher] = useState<Teacher | null>(null); const [resignDate, setResignDate] = useState(todayWib());
  const [form, setForm] = useState({ nama: "", email: "", tanggal_join: todayWib() }); const supabase = createClient();

  async function loadTeachers() {
    setLoading(true); setError(""); const today = todayWib();
    const { data, error } = await supabase.from("profiles").select("id, nama, username, status, created_at, tanggal_join, tanggal_resign").eq("role", "guru").order("nama", { ascending: true });
    if (error) { setError(error.message); setLoading(false); return; }
    const rows = (data ?? []) as Teacher[];
    await Promise.all(rows.filter((teacher) => teacher.tanggal_join && teacher.tanggal_join <= today && !teacher.tanggal_resign && teacher.status !== "aktif").map((teacher) => supabase.from("profiles").update({ status: "aktif" }).eq("id", teacher.id).eq("role", "guru")));
    setTeachers(rows.map((teacher) => teacher.tanggal_join && teacher.tanggal_join <= today && !teacher.tanggal_resign ? { ...teacher, status: "aktif" } : teacher)); setLoading(false);
  }
  useEffect(() => { loadTeachers(); }, []);
  const filteredTeachers = useMemo(() => filter === "semua" ? teachers : teachers.filter((teacher) => teacher.status === filter), [teachers, filter]);

  async function addTeacher(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/kepala/guru", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menambahkan guru.");
      setMessage(result.warning ? `Guru ${form.nama} berhasil dibuat, tetapi ada kendala pengiriman kredensial. ${result.warning}` : `Guru ${form.nama} berhasil dibuat. Kredensial login sudah diproses untuk ${form.email}.`);
      setForm({ nama: "", email: "", tanggal_join: todayWib() }); setShowForm(false); await loadTeachers();
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menambahkan guru."); } finally { setSaving(false); }
  }
  async function reactivateTeacher(teacher: Teacher) {
    setError(""); setMessage(""); const { error } = await supabase.from("profiles").update({ status: "aktif", tanggal_resign: null }).eq("id", teacher.id).eq("role", "guru");
    if (error) setError(error.message); else { setMessage(`${teacher.nama} diaktifkan kembali.`); await loadTeachers(); }
  }
  async function resignTeacherNow() {
    if (!resignTeacher || !resignDate) return; if (resignTeacher.tanggal_join && resignDate < resignTeacher.tanggal_join) { setError("Tanggal resign tidak boleh lebih awal dari tanggal join."); return; }
    setError(""); setMessage(""); const { error } = await supabase.from("profiles").update({ status: "nonaktif", tanggal_resign: resignDate }).eq("id", resignTeacher.id).eq("role", "guru");
    if (error) setError(error.message); else { setMessage(`${resignTeacher.nama} ditandai resign pada ${formatDate(resignDate)}.`); setResignTeacher(null); await loadTeachers(); }
  }

  const aktif = teachers.filter((teacher) => teacher.status === "aktif").length; const nonaktif = teachers.filter((teacher) => teacher.status === "nonaktif").length;

  return <KepalaShell active="guru">
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Data Guru</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Data Guru</h1><p className="mt-1 text-sm text-slate-500">Kelola semua data guru di sekolah.</p></div>
      <button onClick={() => { setError(""); setMessage(""); setShowForm(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"><span className="text-lg leading-none">+</span>Tambah Guru</button>
    </header>

    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Total Guru</p><p className="mt-2 text-3xl font-black">{teachers.length}</p></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-100"><p className="text-sm text-slate-500">Guru Aktif</p><p className="mt-2 text-3xl font-black text-emerald-700">{aktif}</p><p className="mt-2 text-xs font-semibold text-emerald-600">Guru terdaftar aktif</p></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Guru Nonaktif</p><p className="mt-2 text-3xl font-black text-slate-700">{nonaktif}</p><p className="mt-2 text-xs font-semibold text-slate-500">Guru yang sudah resign</p></div>
    </section>

    {(message || error) && <div className={`mt-5 rounded-2xl p-4 text-sm font-semibold ${error ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}`}>{error || message}</div>}

    <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Manajemen</p><h2 className="mt-1 text-xl font-black">Daftar Guru</h2><p className="mt-1 text-sm text-slate-500">Masa kerja dihitung otomatis dari tanggal join sampai tanggal resign atau hari ini.</p></div><div className="flex w-fit rounded-xl bg-slate-100 p-1 text-sm font-semibold">{(["aktif", "nonaktif", "semua"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 capitalize ${filter === item ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>{item}</button>)}</div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">No</th><th className="px-5 py-3">Nama Guru</th><th className="px-5 py-3">Email / Username</th><th className="px-5 py-3">Tanggal Join</th><th className="px-5 py-3">Tanggal Resign</th><th className="px-5 py-3">Masa Kerja</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">Memuat data guru...</td></tr> : filteredTeachers.length === 0 ? <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">Belum ada guru pada kategori ini.</td></tr> : filteredTeachers.map((teacher, index) => <tr key={teacher.id} className="transition hover:bg-slate-50"><td className="px-5 py-4 text-slate-500">{index + 1}</td><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">{teacher.nama.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div><div><p className="font-bold text-slate-900">{teacher.nama}</p><p className="text-xs text-slate-400">Guru</p></div></div></td><td className="px-5 py-4 text-slate-600">{teacher.username || "-"}</td><td className="px-5 py-4 text-slate-600">{formatDate(teacher.tanggal_join)}</td><td className="px-5 py-4 text-slate-600">{formatDate(teacher.tanggal_resign)}</td><td className="px-5 py-4 font-semibold text-slate-700">{durationLabel(teacher.tanggal_join, teacher.tanggal_resign)}{!teacher.tanggal_resign && teacher.tanggal_join && <span className="ml-1 text-xs font-normal text-emerald-600">berjalan</span>}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${teacher.status === "aktif" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>{teacher.status === "aktif" ? "Aktif" : "Nonaktif"}</span></td><td className="px-5 py-4 text-right">{teacher.status === "aktif" ? <button onClick={() => { setResignTeacher(teacher); setResignDate(todayWib()); }} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100">Resign / Nonaktif</button> : <button onClick={() => reactivateTeacher(teacher)} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100">Aktifkan Lagi</button>}</td></tr>)}</tbody></table></div>
    </section>

    {showForm && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><div className="mx-auto flex min-h-full items-center justify-center py-6"><div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="tambah-guru-title"><div className="flex items-start justify-between gap-4"><div><div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-2xl ring-1 ring-emerald-100">👤</div><h2 id="tambah-guru-title" className="text-2xl font-black">Tambah Guru</h2><p className="mt-1 text-sm text-slate-500">Buat akun guru baru untuk sistem absensi.</p></div><button type="button" onClick={() => setShowForm(false)} className="rounded-full p-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup">×</button></div><form onSubmit={addTeacher} className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Nama Lengkap<input id="nama-guru" name="nama" required placeholder="Contoh: Walid" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label><label className="text-sm font-semibold text-slate-700">Email<input id="email-guru" name="email" required type="email" placeholder="guru@gmail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label><label className="text-sm font-semibold text-slate-700">Tanggal Join<input id="tanggal-join" name="tanggal_join" required type="date" value={form.tanggal_join} onChange={(e) => setForm({ ...form, tanggal_join: e.target.value })} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label><div className="flex items-end"><div className="w-full rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 ring-1 ring-emerald-100"><b>Akun dibuat otomatis.</b><br />Username mengikuti nama guru dan password sementara dibuat oleh sistem.</div></div><div className="sm:col-span-2 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50">Batal</button><button disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan Guru"}</button></div></form></div></div></div>}
    {resignTeacher && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h3 className="text-xl font-black text-slate-900">Nonaktifkan Guru</h3><p className="mt-2 text-sm text-slate-500">Masukkan tanggal resign untuk <b>{resignTeacher.nama}</b>. Setelah tanggal ini, guru tidak dapat login.</p><label className="mt-5 block text-sm font-semibold text-slate-600">Tanggal Resign<input id="tanggal-resign" name="tanggal_resign" type="date" value={resignDate} min={resignTeacher.tanggal_join || undefined} onChange={(e) => setResignDate(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-4 font-normal text-slate-800" /></label><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button onClick={() => setResignTeacher(null)} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-600">Batal</button><button onClick={resignTeacherNow} className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">Simpan Resign</button></div></div></div>}
  </KepalaShell>;
}
