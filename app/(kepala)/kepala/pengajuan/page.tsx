import { requireUser } from "@/lib/auth";
import KepalaShell from "@/components/kepala-shell";
import ApprovalActions from "./approval-actions";

export default async function Pengajuan() {
  const { supabase, profile } = await requireUser();
  if (profile.role !== "kepala_sekolah") return <main className="min-h-screen grid place-items-center bg-slate-50 p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">Akses ditolak.</div></main>;

  const { data } = await supabase.from("leave_requests").select("*, profiles!leave_requests_user_id_fkey(nama), leave_types(nama)").order("created_at", { ascending: false });
  const requests = data || [];
  const pending = requests.filter((item: any) => item.status === "pending").length;
  const approved = requests.filter((item: any) => item.status === "approved").length;
  const rejected = requests.filter((item: any) => item.status === "rejected").length;

  return <KepalaShell active="pengajuan" nama={profile.nama}>
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Pengajuan</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Pengajuan Izin / Cuti</h1><p className="mt-1 text-sm text-slate-500">Review dan proses pengajuan izin atau cuti guru.</p></div>
      <a href="/kepala" className="text-sm font-bold text-emerald-700 hover:underline">← Kembali ke Dashboard</a>
    </header>

    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Menunggu Approval</p><p className="mt-2 text-3xl font-black text-amber-600">{pending}</p><p className="mt-2 text-xs font-semibold text-slate-500">Perlu ditinjau</p></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-100"><p className="text-sm text-slate-500">Disetujui</p><p className="mt-2 text-3xl font-black text-emerald-700">{approved}</p><p className="mt-2 text-xs font-semibold text-emerald-600">Pengajuan diterima</p></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Ditolak</p><p className="mt-2 text-3xl font-black text-slate-700">{rejected}</p><p className="mt-2 text-xs font-semibold text-slate-500">Pengajuan tidak disetujui</p></div>
    </section>

    <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-100 p-5"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Approval</p><h2 className="mt-1 text-xl font-black">Daftar Pengajuan</h2><p className="mt-1 text-sm text-slate-500">Pengajuan terbaru ditampilkan lebih dahulu.</p></div>
      <div className="divide-y divide-slate-100">
        {requests.map((r: any) => <article key={r.id} className="p-5 transition hover:bg-slate-50"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">{(r.profiles?.nama || "Guru").trim().split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase()}</div><div><p className="font-bold text-slate-900">{r.profiles?.nama || "Nama guru belum tersedia"}</p><p className="text-xs text-slate-400">{r.leave_types?.nama || "Izin / Cuti"}</p></div><span className={`ml-1 rounded-full px-3 py-1 text-xs font-bold ${r.status === "pending" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" : r.status === "approved" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-red-50 text-red-700 ring-1 ring-red-100"}`}>{r.status === "pending" ? "Menunggu" : r.status === "approved" ? "Disetujui" : "Ditolak"}</span></div><div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p><span className="font-semibold text-slate-400">Periode:</span> {r.tanggal_mulai} s/d {r.tanggal_selesai}</p><p><span className="font-semibold text-slate-400">Alasan:</span> {r.alasan || "-"}</p></div></div><div className="shrink-0"><ApprovalActions id={r.id} status={r.status} /></div></div></article>)}
        {requests.length === 0 && <div className="p-12 text-center text-slate-500">Belum ada pengajuan izin atau cuti.</div>}
      </div>
    </section>
  </KepalaShell>;
}
