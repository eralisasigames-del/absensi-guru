import { requireUser } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";
import AttendanceActions from "./attendance-actions";

function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

export default async function GuruPage() {
  const { supabase, profile } = await requireUser();
  if (profile.role !== "guru") {
    return <main className="min-h-screen grid place-items-center p-6"><div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">Halaman ini khusus untuk Guru.</div></main>;
  }

  const tanggal = todayJakarta();
  const [{ data: attendance }, { data: recentAttendance }, { data: leaveRequests }] = await Promise.all([
    supabase.from("attendance").select("tanggal, jam_hadir, jam_pulang").eq("user_id", profile.id).eq("tanggal", tanggal).maybeSingle(),
    supabase.from("attendance").select("tanggal, jam_hadir, jam_pulang").eq("user_id", profile.id).order("tanggal", { ascending: false }).limit(5),
    supabase.from("leave_requests").select("id, tanggal_mulai, tanggal_selesai, status, leave_types(nama)").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(3),
  ]);

  const hadirCount = recentAttendance?.filter((item) => item.jam_hadir).length ?? 0;
  const cutiPending = leaveRequests?.filter((item) => item.status === "pending").length ?? 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-emerald-50">PAUD PENCARSARI • DASHBOARD GURU</p>
                <h1 className="mt-2 text-3xl font-black md:text-4xl">Selamat datang, {profile.nama} 👋</h1>
                <p className="mt-2 text-emerald-50">{formatDate(tanggal)}</p>
              </div>
              <LogoutButton />
            </div>
          </div>
          <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-5"><p className="text-sm text-slate-500">Status Hari Ini</p><p className="mt-1 font-black text-slate-900">{attendance?.jam_hadir ? "Sudah Hadir" : "Belum Hadir"}</p></div>
            <div className="p-5"><p className="text-sm text-slate-500">5 Hari Terakhir</p><p className="mt-1 font-black text-slate-900">{hadirCount} hari hadir</p></div>
            <div className="p-5"><p className="text-sm text-slate-500">Pengajuan Menunggu</p><p className="mt-1 font-black text-slate-900">{cutiPending} pengajuan</p></div>
          </div>
        </header>

        <AttendanceActions />

        <section className="mt-6 grid gap-5 md:grid-cols-4">
          <a href="/guru/riwayat" className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:ring-emerald-300">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl">📋</div>
            <h2 className="font-black text-slate-900">Riwayat Absensi</h2>
            <p className="mt-2 text-sm text-slate-500">Lihat riwayat kehadiran dan waktu pulang Anda.</p>
            <span className="mt-4 inline-block text-sm font-bold text-blue-600 group-hover:underline">Lihat riwayat →</span>
          </a>
          <a href="/guru/pengajuan" className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:ring-emerald-300">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-2xl">📝</div>
            <h2 className="font-black text-slate-900">Izin / Cuti</h2>
            <p className="mt-2 text-sm text-slate-500">Ajukan cuti sakit, hamil, tahunan, atau keperluan lainnya.</p>
            <span className="mt-4 inline-block text-sm font-bold text-amber-600 group-hover:underline">Buat pengajuan →</span>
          </a>
          <a href="/guru/pengaturan" className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:ring-emerald-300">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-2xl">🔐</div>
            <h2 className="font-black text-slate-900">Pengaturan Akun</h2>
            <p className="mt-2 text-sm text-slate-500">Ubah password sementara menjadi password pribadi.</p>
            <span className="mt-4 inline-block text-sm font-bold text-violet-600 group-hover:underline">Ubah password →</span>
          </a>
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-2xl">📅</div>
            <h2 className="font-black text-slate-900">Aktivitas Terbaru</h2>
            <div className="mt-4 space-y-3">
              {(recentAttendance ?? []).slice(0, 3).map((item) => (
                <div key={item.tanggal} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(`${item.tanggal}T00:00:00+07:00`))}</span>
                  <span className="font-bold text-emerald-700">{item.jam_hadir ? "Hadir" : "-"}{item.jam_pulang ? " • Pulang" : ""}</span>
                </div>
              ))}
              {(!recentAttendance || recentAttendance.length === 0) && <p className="text-sm text-slate-500">Belum ada aktivitas absensi.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
