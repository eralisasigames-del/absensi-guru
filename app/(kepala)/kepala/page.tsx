import { requireUser } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

export default async function Kepala() {
  const { supabase, profile } = await requireUser();
  if (profile.role !== "kepala_sekolah") return <main className="p-10">Akses ditolak.</main>;

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const [{ data: teachers }, { data: attendance }, { count }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "guru").eq("status", "aktif"),
    supabase.from("attendance").select("*").eq("tanggal", today),
    supabase.from("leave_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div>
            <p className="text-sm font-semibold text-emerald-700">DASHBOARD KEPALA SEKOLAH</p>
            <h1 className="text-3xl font-black text-slate-900">Monitoring Hari Ini</h1>
          </div>
          <LogoutButton />
        </header>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"><p className="text-gray-500">Total Guru Aktif</p><b className="text-3xl">{teachers?.length || 0}</b></div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"><p className="text-gray-500">Hadir</p><b className="text-3xl">{attendance?.filter((x: any) => x.jam_hadir).length || 0}</b></div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"><p className="text-gray-500">Menunggu Approval</p><b className="text-3xl">{count || 0}</b></div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <a href="/kepala/guru" className="rounded-2xl border bg-white p-6 font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            👩‍🏫<span className="ml-3">Data Guru</span>
            <p className="mt-2 text-sm font-normal text-slate-500">Tambah guru, lihat guru aktif/nonaktif, dan kelola status.</p>
          </a>
          <a href="/kepala/pengajuan" className="rounded-2xl border bg-white p-6 font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            📝<span className="ml-3">Pengajuan Izin/Cuti</span>
            <p className="mt-2 text-sm font-normal text-slate-500">Review dan approve pengajuan guru.</p>
          </a>
          <a href="/kepala/laporan" className="rounded-2xl border bg-white p-6 font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            📊<span className="ml-3">Laporan Absensi</span>
            <p className="mt-2 text-sm font-normal text-slate-500">Lihat dan ekspor laporan absensi.</p>
          </a>
        </div>
      </div>
    </main>
  );
}
