"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import KepalaShell from "@/components/kepala-shell";
import KepalaTambahGuruModal from "@/components/kepala-tambah-guru-modal";

type Teacher = {
  id: string;
  nama: string;
  username: string | null;
  nomor_whatsapp: string | null;
  status: "aktif" | "nonaktif";
  tanggal_join: string | null;
  tanggal_resign: string | null;
};

type Credentials = {
  nama: string;
  whatsapp: string;
  username: string;
  password: string;
};

function todayWib() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T00:00:00+07:00`));
}

function normalizeWhatsApp(value: string | null) {
  let number = (value ?? "").replace(/\D/g, "");
  if (number.startsWith("0")) number = `62${number.slice(1)}`;
  else if (number.startsWith("8")) number = `62${number}`;
  return number;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

export default function KelolaGuruPage() {
  const supabase = createClient();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<Credentials | null>(null);
  const [filter, setFilter] = useState<"semua" | "aktif" | "nonaktif">("semua");
  const [search, setSearch] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [resignTeacher, setResignTeacher] = useState<Teacher | null>(null);
  const [resignDate, setResignDate] = useState(todayWib());

  async function loadTeachers() {
    setLoading(true);
    setError("");
    const today = todayWib();
    const { data, error: loadError } = await supabase.from("profiles").select("id, nama, username, nomor_whatsapp, status, tanggal_join, tanggal_resign").eq("role", "guru").order("nama", { ascending: true });
    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as Teacher[];
    setTeachers(rows.map((teacher) => teacher.tanggal_join && teacher.tanggal_join <= today && !teacher.tanggal_resign ? { ...teacher, status: "aktif" as const } : teacher));
    setLoading(false);
  }

  useEffect(() => { loadTeachers(); }, []);

  const filteredTeachers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const matchesFilter = filter === "semua" || teacher.status === filter;
      const matchesSearch = !keyword || teacher.nama.toLowerCase().includes(keyword) || (teacher.username ?? "").toLowerCase().includes(keyword) || (teacher.nomor_whatsapp ?? "").includes(keyword);
      return matchesFilter && matchesSearch;
    });
  }, [teachers, filter, search]);

  const aktif = teachers.filter((teacher) => teacher.status === "aktif").length;
  const nonaktif = teachers.filter((teacher) => teacher.status === "nonaktif").length;

  function handleCreated(credentials: Credentials) {
    setCreatedCredentials(credentials);
    setMessage(`Guru ${credentials.nama} berhasil dibuat.`);
    setError("");
    void loadTeachers();
  }

  function sendWhatsApp(teacher: Teacher) {
    const number = normalizeWhatsApp(teacher.nomor_whatsapp);
    if (!number) {
      setError(`Nomor WhatsApp ${teacher.nama} belum tersedia.`);
      return;
    }
    const text = `Halo ${teacher.nama},\n\nIni pesan dari Absensi Guru PAUD Pencarsari.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function reactivateTeacher(teacher: Teacher) {
    setMenuId(null);
    setError("");
    const { error: updateError } = await supabase.from("profiles").update({ status: "aktif", tanggal_resign: null }).eq("id", teacher.id).eq("role", "guru");
    if (updateError) setError(updateError.message);
    else {
      setMessage(`${teacher.nama} diaktifkan kembali.`);
      await loadTeachers();
    }
  }

  async function resignTeacherNow() {
    if (!resignTeacher || !resignDate) return;
    if (resignTeacher.tanggal_join && resignDate < resignTeacher.tanggal_join) {
      setError("Tanggal resign tidak boleh lebih awal dari tanggal join.");
      return;
    }
    setError("");
    const { error: updateError } = await supabase.from("profiles").update({ status: "nonaktif", tanggal_resign: resignDate }).eq("id", resignTeacher.id).eq("role", "guru");
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage(`${resignTeacher.nama} ditandai nonaktif.`);
      setResignTeacher(null);
      setMenuId(null);
      await loadTeachers();
    }
  }

  return (
    <KepalaShell active="guru">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Data Guru</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Data Guru</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola semua data guru di sekolah.</p>
        </div>
        <button type="button" onClick={() => { setError(""); setShowForm(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"><span className="text-lg leading-none">+</span> Tambah Guru</button>
      </header>

      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Total Guru</p><p className="mt-2 text-3xl font-black">{teachers.length}</p></div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-100"><p className="text-sm text-slate-500">Guru Aktif</p><p className="mt-2 text-3xl font-black text-emerald-700">{aktif}</p><p className="mt-2 text-xs font-semibold text-emerald-600">Guru terdaftar aktif</p></div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Guru Nonaktif</p><p className="mt-2 text-3xl font-black text-slate-700">{nonaktif}</p><p className="mt-2 text-xs font-semibold text-slate-500">Guru yang sudah resign</p></div>
      </section>

      {(message || error) && <div className={`mb-5 rounded-2xl p-4 text-sm font-semibold ${error ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}`}>{error || message}</div>}

      {createdCredentials && (
        <section className="mb-6 rounded-2xl bg-emerald-50/80 p-4 shadow-sm ring-1 ring-emerald-200 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-lg text-emerald-700 ring-1 ring-emerald-200">✓</div>
            <div className="min-w-0"><h2 className="text-lg font-black text-emerald-800">Guru berhasil dibuat</h2><p className="mt-0.5 text-sm text-emerald-700">Simpan atau kirim kredensial berikut kepada guru.</p></div>
            <button type="button" onClick={() => setCreatedCredentials(null)} className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-white hover:text-slate-700" aria-label="Tutup informasi">×</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-4 ring-1 ring-emerald-100"><p className="text-xs text-slate-500">Nama</p><p className="mt-1 font-bold text-slate-900">{createdCredentials.nama}</p></div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-emerald-100"><p className="text-xs text-slate-500">WhatsApp</p><p className="mt-1 font-bold text-slate-900">{createdCredentials.whatsapp}</p></div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-emerald-100"><p className="text-xs text-slate-500">Username</p><p className="mt-1 font-bold text-slate-900">{createdCredentials.username}</p></div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-emerald-100"><p className="text-xs text-slate-500">Password sementara</p><p className="mt-1 break-all font-bold text-slate-900">{createdCredentials.password || "-"}</p></div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={async () => { await navigator.clipboard.writeText(`Akun Absensi Guru PAUD Pencarsari\nNama: ${createdCredentials.nama}\nUsername: ${createdCredentials.username}\nPassword sementara: ${createdCredentials.password}`); setMessage("Kredensial berhasil disalin."); }} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">📋 Salin Kredensial</button>
            <button type="button" onClick={() => { const number = normalizeWhatsApp(createdCredentials.whatsapp); if (!number) return; const text = `Halo ${createdCredentials.nama},\n\nAkun Absensi Guru PAUD Pencarsari Anda sudah dibuat.\n\nUsername: ${createdCredentials.username}\nPassword sementara: ${createdCredentials.password}\n\nSilakan login dan segera ubah password setelah berhasil masuk.`; window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer"); }} className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-700">💬 Kirim WhatsApp</button>
          </div>
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100"><strong>Penting:</strong> password ini adalah password sementara. Minta guru mengganti password setelah login.</div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-xl font-black">Daftar Guru</h2><p className="mt-1 text-sm text-slate-500">Kelola guru aktif dan nonaktif.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block sm:w-80"><span className="sr-only">Cari guru</span><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">⌕</span><input id="cari-guru" name="cari_guru" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari guru..." className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
            <select id="filter-status-guru" name="filter_status_guru" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"><option value="semua">Semua Status</option><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-600"><tr><th className="px-5 py-3">Nama</th><th className="px-5 py-3">Username</th><th className="px-5 py-3">WhatsApp</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Bergabung</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500">Memuat data guru...</td></tr> : filteredTeachers.length === 0 ? <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500">Belum ada guru yang sesuai.</td></tr> : filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">{initials(teacher.nama)}</div><div className="min-w-0"><p className="font-bold text-slate-900">{teacher.nama}</p><p className="text-xs text-slate-400">Guru</p></div></div></td>
                  <td className="px-5 py-4 text-slate-600">{teacher.username || "-"}</td>
                  <td className="px-5 py-4 text-slate-600">{teacher.nomor_whatsapp || "-"}</td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${teacher.status === "aktif" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>{teacher.status === "aktif" ? "Aktif" : "Nonaktif"}</span></td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(teacher.tanggal_join)}</td>
                  <td className="relative px-5 py-4"><div className="flex justify-end gap-2">
                    <button type="button" onClick={() => sendWhatsApp(teacher)} className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-200 text-base text-emerald-700 transition hover:bg-emerald-50" title="Kirim WhatsApp" aria-label={`Kirim WhatsApp ke ${teacher.nama}`}>◉</button>
                    <button type="button" onClick={() => { if (teacher.status === "aktif") { setResignTeacher(teacher); setResignDate(todayWib()); } else { void reactivateTeacher(teacher); } }} className={`grid h-10 w-10 place-items-center rounded-xl border text-base transition ${teacher.status === "aktif" ? "border-slate-200 text-slate-600 hover:bg-slate-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`} title={teacher.status === "aktif" ? "Nonaktifkan" : "Aktifkan lagi"} aria-label={teacher.status === "aktif" ? `Nonaktifkan ${teacher.nama}` : `Aktifkan ${teacher.nama}`}>{teacher.status === "aktif" ? "✎" : "↻"}</button>
                    <div className="relative"><button type="button" onClick={() => setMenuId(menuId === teacher.id ? null : teacher.id)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-lg text-slate-600 transition hover:bg-slate-50" aria-label="Menu aksi">⋮</button>{menuId === teacher.id && <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><button type="button" onClick={() => sendWhatsApp(teacher)} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50">Kirim WhatsApp</button>{teacher.status === "aktif" ? <button type="button" onClick={() => { setResignTeacher(teacher); setResignDate(todayWib()); setMenuId(null); }} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">Nonaktifkan guru</button> : <button type="button" onClick={() => void reactivateTeacher(teacher)} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Aktifkan lagi</button>}</div>}</div>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500">Menampilkan {filteredTeachers.length} dari {teachers.length} data guru</div>
      </section>

      <KepalaTambahGuruModal open={showForm} onClose={() => setShowForm(false)} onCreated={handleCreated} />

      {resignTeacher && <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setResignTeacher(null); }}><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="resign-guru-title"><h2 id="resign-guru-title" className="text-xl font-black">Nonaktifkan Guru</h2><p className="mt-2 text-sm text-slate-500">Tentukan tanggal resign untuk <strong className="text-slate-800">{resignTeacher.nama}</strong>.</p><label className="mt-5 block text-sm font-bold text-slate-700">Tanggal Resign<input id="tanggal-resign" name="tanggal_resign" type="date" value={resignDate} min={resignTeacher.tanggal_join || undefined} onChange={(event) => setResignDate(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label><div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setResignTeacher(null)} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Batal</button><button type="button" onClick={() => void resignTeacherNow()} className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">Nonaktifkan</button></div></div></div>}
    </KepalaShell>
  );
}
