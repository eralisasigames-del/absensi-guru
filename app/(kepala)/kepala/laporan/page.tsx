import { requireUser } from "@/lib/auth";
import ExportButton from "./export-button";

function formatTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

export default async function Laporan() {
  const { supabase, profile } = await requireUser();
  if (profile.role !== "kepala_sekolah") {
    return <main className="p-10">Akses ditolak.</main>;
  }

  // Ambil attendance dan profiles secara terpisah agar nama guru tetap muncul
  // walaupun relasi foreign-key Supabase tidak mengembalikan nested profiles.
  const [{ data: attendance, error: attendanceError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase
      .from("attendance")
      .select("id,user_id,tanggal,jam_hadir,jam_pulang")
      .order("tanggal", { ascending: false })
      .limit(500),
    supabase
      .from("profiles")
      .select("id,nama,username")
      .eq("role", "guru"),
  ]);

  if (attendanceError) {
    console.error("Laporan attendance error:", attendanceError);
  }
  if (profilesError) {
    console.error("Laporan profiles error:", profilesError);
  }

  const profileMap = new Map(
    (profiles ?? []).map((teacher) => [teacher.id, teacher.nama || teacher.username || "Guru"]),
  );

  const rows = (attendance ?? []).map((item) => ({
    ...item,
    nama_guru: profileMap.get(item.user_id) ?? "Nama guru belum tersedia",
  }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-50">PAUD PENCARSARI • KEPALA SEKOLAH</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">Laporan Absensi</h1>
              <p className="mt-2 text-emerald-50">Daftar kehadiran seluruh guru</p>
            </div>
            <ExportButton rows={rows} />
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b p-5">
            <h2 className="font-black text-slate-900">Riwayat Absensi Guru</h2>
            <p className="mt-1 text-sm text-slate-500">Menampilkan hingga 500 catatan terbaru.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-4 font-bold">Guru</th>
                  <th className="p-4 font-bold">Tanggal</th>
                  <th className="p-4 font-bold">Hadir</th>
                  <th className="p-4 font-bold">Pulang</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className="border-t border-slate-100" key={row.id}>
                    <td className="p-4 font-semibold text-slate-900">{row.nama_guru}</td>
                    <td className="p-4 text-slate-600">{formatDate(row.tanggal)}</td>
                    <td className="p-4 font-medium text-emerald-700">{formatTime(row.jam_hadir)}</td>
                    <td className="p-4 font-medium text-blue-700">{formatTime(row.jam_pulang)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-500">Belum ada data absensi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
