import { requireUser } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

function todayJakarta() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00+07:00`)); }

export default async function Kepala() {
  const { supabase, profile } = await requireUser();
  if (profile.role !== "kepala_sekolah") return <main className="min-h-screen grid place-items-center p-6"><div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">Halaman ini khusus untuk Kepala Sekolah.</div></main>;

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-bold uppercase tracking-wider text-emerald-50">PAUD PENCARSARI • DASHBOARD KEPALA SEKOLAH</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Selamat datang, {profile.nama} 👋</h1><p className="mt-2 text-emerald-50">{formatDate(tanggal)}</p></div>
              <LogoutButton />
            </div>
          </div>
          <div className="grid grid-cols-1 divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            <div className="p-5"><p className="text-sm text-slate-500">Guru Aktif</p><p className="mt-1 text-2xl font-black text-slate-900">{activeTeachers.length}</p></div>
            <div className="p-5"><p className="text-sm text-slate-500">Hadir Hari Ini</p><p className="mt-1 text-2xl font-black text-emerald-700">{hadirCount}</p></div>
            <div className="p-5"><p className="text-sm text-slate-500">Belum Hadir</p><p className="mt-1 text-2xl font-black text-amber-600">{belumHadir}</p></div>
            <div className="p-5"><p className="text-sm text-slate-500">Menunggu Approval</p><p className="mt-1 text-2xl font-black text-blue-700">{pendingCount}</p></div>
          </div>
        </header>

        <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Monitoring</p><h2 className="text-2xl font-black text-slate-900">Kehadiran Guru Hari Ini</h2></div><span className="text-sm text-slate-500">{formatDate(tanggal)}</span></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="rounded-l-xl px-4 py-3">Guru</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Hadir</th><th className="rounded-r-xl px-4 py-3">Pulang</th></tr></thead><tbody className="divide-y divide-slate-100">
            {activeTeachers.map((teacher) => { const item = attendance?.find((row) => row.user_id === teacher.id); return <tr key={teacher.id}><td className="px-4 py-4 font-bold text-slate-900">{teacher.nama}</td><td className="px-4 py-4">{item?.jam_hadir ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Hadir</span> : <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Belum Hadir</span>}</td><td className="px-4 py-4 text-slate-600">{item?.jam_hadir ? new Date(item.jam_hadir).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) : "—"}</td><td className="px-4 py-4 text-slate-600">{item?.jam_pulang ? new Date(item.jam_pulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) : "—"}</td></tr>; })}
            {activeTeachers.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Belum ada guru aktif.</td></tr>}
          </tbody></table></div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <a href="/kepala/guru" className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:ring-emerald-300"><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl">👩‍🏫</div><h2 className="font-black text-slate-900">Data Guru</h2><p className="mt-2 text-sm text-slate-500">Tambah guru, lihat guru aktif/nonaktif, dan kelola status.</p><span className="mt-4 inline-block text-sm font-bold text-blue-600">Kelola guru →</span></a>
          <a href="/kepala/pengajuan" className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:ring-emerald-300"><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-2xl">📝</div><h2 className="font-black text-slate-900">Pengajuan Izin / Cuti</h2><p className="mt-2 text-sm text-slate-500">Review pengajuan dan berikan persetujuan kepada guru.</p><span className="mt-4 inline-block text-sm font-bold text-amber-600">Review pengajuan →</span></a>
          <a href="/kepala/laporan" className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:ring-emerald-300"><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-2xl">📊</div><h2 className="font-black text-slate-900">Laporan Absensi</h2><p className="mt-2 text-sm text-slate-500">Lihat dan ekspor laporan absensi guru.</p><span className="mt-4 inline-block text-sm font-bold text-emerald-600">Buka laporan →</span></a>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-wider text-blue-700">Approval</p><h2 className="text-xl font-black text-slate-900">Pengajuan Terbaru</h2></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{pendingCount} menunggu</span></div><div className="mt-4 space-y-3">{(pendingLeaves ?? []).map((request: any) => <div key={request.id} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-900">{nameById.get(request.user_id) ?? "Guru"}</p><p className="text-sm text-slate-500">{request.leave_types?.nama ?? "Izin / Cuti"} • {request.tanggal_mulai} s/d {request.tanggal_selesai}</p></div><a href="/kepala/pengajuan" className="text-sm font-bold text-blue-600 hover:underline">Review →</a></div>)}{pendingCount === 0 && <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Tidak ada pengajuan yang menunggu approval.</p>}</div></section>
      </div>
    </main>
  );
}
