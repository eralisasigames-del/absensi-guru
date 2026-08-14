import { requireUser } from "@/lib/auth";
import KepalaShell from "@/components/kepala-shell";
import ExportButton from "./export-button";

function formatTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(value));
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00+07:00`));
}
function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
}

export default async function Laporan() {
  const { supabase, profile } = await requireUser();
  if (profile.role !== "kepala_sekolah") return <main className="min-h-screen grid place-items-center bg-slate-50 p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">Akses ditolak.</div></main>;

  const [{ data: attendance, error: attendanceError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from("attendance").select("id,user_id,tanggal,jam_hadir,jam_pulang").order("tanggal", { ascending: false }).limit(500),
    supabase.from("profiles").select("id,nama,username").eq("role", "guru"),
  ]);
  if (attendanceError) console.error("Laporan attendance error:", attendanceError);
  if (profilesError) console.error("Laporan profiles error:", profilesError);

  const profileMap = new Map((profiles ?? []).map((teacher) => [teacher.id, { nama: teacher.nama || teacher.username || "Guru", username: teacher.username || "-" }]));
  const rows = (attendance ?? []).map((item) => ({ ...item, nama_guru: profileMap.get(item.user_id)?.nama ?? "Nama guru belum tersedia", username: profileMap.get(item.user_id)?.username ?? "-" }));
  const hadirCount = rows.filter((row) => row.jam_hadir).length;
  const pulangCount = rows.filter((row) => row.jam_pulang).length;

  return <KepalaShell active="laporan" nama={profile.nama}>
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Laporan</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Laporan Absensi</h1><p className="mt-1 text-sm text-slate-500">Pantau dan ekspor riwayat kehadiran seluruh guru.</p></div>
      <ExportButton rows={rows} />
    </header>

    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Total Catatan</p><p className="mt-2 text-3xl font-black">{rows.length}</p><p className="mt-2 text-xs font-semibold text-slate-500">Maksimal 500 data terbaru</p></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-100"><p className="text-sm text-slate-500">Sudah Hadir</p><p className="mt-2 text-3xl font-black text-emerald-700">{hadirCount}</p><p className="mt-2 text-xs font-semibold text-emerald-600">Memiliki waktu masuk</p></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Sudah Pulang</p><p className="mt-2 text-3xl font-black text-blue-700">{pulangCount}</p><p className="mt-2 text-xs font-semibold text-slate-500">Memiliki waktu pulang</p></div>
    </section>

    <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Riwayat</p><h2 className="mt-1 text-xl font-black">Riwayat Absensi Guru</h2><p className="mt-1 text-sm text-slate-500">Menampilkan hingga 500 catatan terbaru.</p></div><span className="w-fit rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">{rows.length} catatan</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Guru</th><th className="px-5 py-3">Tanggal</th><th className="px-5 py-3">Hadir</th><th className="px-5 py-3">Pulang</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr className="transition hover:bg-slate-50" key={row.id}><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">{initials(row.nama_guru)}</div><div><p className="font-bold text-slate-900">{row.nama_guru}</p><p className="text-xs text-slate-400">{row.username}</p></div></div></td><td className="px-5 py-4 text-slate-600">{formatDate(row.tanggal)}</td><td className="px-5 py-4 font-semibold text-emerald-700">{formatTime(row.jam_hadir)}</td><td className="px-5 py-4 font-semibold text-blue-700">{formatTime(row.jam_pulang)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-500">Belum ada data absensi.</td></tr>}</tbody></table></div>
    </section>
  </KepalaShell>;
}
