import { requireUser } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00+07:00`));
}
function formatTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}
function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default async function Kepala() {
  const { supabase, profile } = await requireUser();
  if (profile.role !== "kepala_sekolah") return <main className="min-h-screen grid place-items-center bg-slate-50 p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">Halaman ini khusus untuk Kepala Sekolah.</div></main>;

  const tanggal = todayJakarta();
  const [{ data: teachers }, { data: attendance }, { data: pendingLeaves }] = await Promise.all([
    supabase.from("profiles").select("id, nama, username, status").eq("role", "guru").order("nama"),
    supabase.from("attendance").select("user_id, tanggal, jam_hadir, jam_pulang").eq("tanggal", tanggal),
    supabase.from("leave_requests").select("id, user_id, tanggal_mulai, tanggal_selesai, status, leave_types(nama)").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
  ]);
  const activeTeachers = teachers?.filter((teacher) => teacher.status === "aktif") ?? [];
  const presentIds = new Set((attendance ?? []).filter((item) => item.jam_hadir).map((item) => item.user_id));
  const nameById = new Map((teachers ?? []).map((teacher) => [teacher.id, teacher.nama]));
  const pendingCount = pendingLeaves?.length ?? 0;
  const hadirCount = presentIds.size;
  const belumHadir = Math.max(activeTeachers.length - hadirCount, 0);
  const attendanceRate = activeTeachers.length ? Math.round((hadirCount / activeTeachers.length) * 100) : 0;
  const navItems = [
    { href: "/kepala", label: "Dashboard", icon: "⌂", active: true },
    { href: "/kepala/guru", label: "Data Guru", icon: "♟" },
    { href: "/kepala/pengajuan", label: "Pengajuan", icon: "✓" },
    { href: "/kepala/laporan", label: "Laporan", icon: "▣" },
  ];

  return <main className="min-h-screen bg-[#f7faf9] text-slate-900"><div className="flex min-h-screen flex-col lg:flex-row">
    <aside className="w-full border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[260px] lg:shrink-0 lg:border-b-0 lg:border-r"><div className="flex h-full flex-col px-4 py-5 lg:px-5 lg:py-6">
      <div className="flex items-center gap-3 px-2"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-2xl ring-1 ring-emerald-100">👥</div><div><p className="text-[15px] font-black leading-tight">Absensi Guru PAUD</p><p className="mt-1 text-xs text-slate-500">PAUD Pencarsari</p></div></div>
      <nav className="mt-6 flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">{navItems.map((item) => <a key={item.href} href={item.href} className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${item.active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"}`}><span className="grid h-7 w-7 place-items-center text-lg">{item.icon}</span>{item.label}</a>)}</nav>
      <div className="mt-auto hidden border-t border-slate-100 pt-5 lg:block"><div className="mb-4 flex items-center gap-3 px-2"><div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">{initials(profile.nama || "KS")}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{profile.nama}</p><p className="text-xs text-slate-500">Kepala Sekolah</p></div></div><LogoutButton /></div>
    </div></aside>

    <section className="min-w-0 flex-1"><div className="mx-auto max-w-[1450px] px-4 py-5 sm:px-6 lg:px-9 lg:py-7">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Dashboard Kepala Sekolah</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Monitoring Hari Ini</h1><p className="mt-1 text-sm text-slate-500">{formatDate(tanggal)}</p></div><div className="flex gap-2"><a href="/kepala/guru" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"><span className="text-lg leading-none">+</span>Tambah Guru</a><div className="lg:hidden"><LogoutButton /></div></div></header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Guru Aktif</p><p className="mt-2 text-3xl font-black">{activeTeachers.length}</p><p className="mt-2 text-xs font-semibold text-emerald-600">Guru terdaftar aktif</p></div><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Hadir Hari Ini</p><p className="mt-2 text-3xl font-black text-emerald-700">{hadirCount}</p><p className="mt-2 text-xs font-semibold text-slate-500">Kehadiran {attendanceRate}%</p></div><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Belum Hadir</p><p className="mt-2 text-3xl font-black text-amber-600">{belumHadir}</p><p className="mt-2 text-xs font-semibold text-slate-500">Perlu dipantau hari ini</p></div><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Menunggu Approval</p><p className="mt-2 text-3xl font-black text-blue-700">{pendingCount}</p><a href="/kepala/pengajuan" className="mt-2 inline-block text-xs font-bold text-blue-600 hover:underline">Review pengajuan →</a></div></section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"><div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black">Kehadiran Guru Hari Ini</h2><p className="mt-1 text-sm text-slate-500">Pantau guru yang sudah hadir dan pulang.</p></div><span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">{hadirCount} dari {activeTeachers.length} hadir</span></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Guru</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Hadir</th><th className="px-5 py-3">Pulang</th></tr></thead><tbody className="divide-y divide-slate-100">{activeTeachers.map((teacher) => { const item = attendance?.find((row) => row.user_id === teacher.id); return <tr key={teacher.id} className="transition hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">{initials(teacher.nama)}</div><div className="min-w-0"><p className="truncate font-bold text-slate-900">{teacher.nama}</p><p className="truncate text-xs text-slate-400">{teacher.username || "-"}</p></div></div></td><td className="px-5 py-4">{item?.jam_hadir ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">Aktif / Hadir</span> : <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-100">Belum Hadir</span>}</td><td className="px-5 py-4 font-semibold text-slate-600">{formatTime(item?.jam_hadir ?? null)}</td><td className="px-5 py-4 font-semibold text-slate-600">{formatTime(item?.jam_pulang ?? null)}</td></tr>; })}{activeTeachers.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-500">Belum ada guru aktif.</td></tr>}</tbody></table></div></div>
        <div className="space-y-5"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Akses Cepat</p><h2 className="mt-1 text-lg font-black">Kelola Sekolah</h2></div><span className="text-xl">⚙️</span></div><div className="mt-4 space-y-2"><a href="/kepala/guru" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-emerald-200 hover:bg-emerald-50"><span>Data Guru</span><span className="text-emerald-600">→</span></a><a href="/kepala/pengajuan" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-emerald-200 hover:bg-emerald-50"><span>Pengajuan Izin / Cuti</span><span className="text-emerald-600">→</span></a><a href="/kepala/laporan" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-emerald-200 hover:bg-emerald-50"><span>Laporan Absensi</span><span className="text-emerald-600">→</span></a></div></div><div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-5 text-white shadow-sm"><p className="text-sm font-bold text-emerald-50">Ringkasan Hari Ini</p><p className="mt-2 text-3xl font-black">{attendanceRate}%</p><p className="mt-1 text-sm text-emerald-50">tingkat kehadiran guru aktif</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${attendanceRate}%` }} /></div></div></div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Approval</p><h2 className="mt-1 text-xl font-black">Pengajuan Terbaru</h2></div><a href="/kepala/pengajuan" className="text-sm font-bold text-blue-600 hover:underline">Lihat semua →</a></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(pendingLeaves ?? []).map((request: any) => <div key={request.id} className="rounded-xl border border-slate-200 p-4"><p className="font-bold">{nameById.get(request.user_id) ?? "Guru"}</p><p className="mt-1 text-sm text-slate-500">{request.leave_types?.nama ?? "Izin / Cuti"}</p><p className="mt-2 text-xs text-slate-400">{request.tanggal_mulai} s/d {request.tanggal_selesai}</p></div>)}{pendingCount === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">Tidak ada pengajuan yang menunggu approval.</p>}</div></section>
      <footer className="py-7 text-center text-xs text-slate-400">Absensi Guru PAUD • PAUD Pencarsari</footer>
    </div></section>
  </div></main>;
}
