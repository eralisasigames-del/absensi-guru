import { requireUser } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";
import AttendanceActions from "./attendance-actions";

export default async function GuruPage() {
  const { profile } = await requireUser();
  return <main className="min-h-screen p-5 md:p-10"><div className="mx-auto max-w-5xl"><header className="flex items-center justify-between mb-8"><div><p className="text-sm text-emerald-700 font-semibold">DASHBOARD GURU</p><h1 className="text-3xl font-black mt-1">Halo, {profile.nama}</h1><p className="text-gray-500">Kelola absensi dan izin/cuti Anda.</p></div><LogoutButton/></header><AttendanceActions/><div className="grid md:grid-cols-2 gap-4 mt-6"><a className="rounded-2xl bg-white border p-6 font-bold" href="/guru/riwayat">📋 Riwayat Absensi</a><a className="rounded-2xl bg-white border p-6 font-bold" href="/guru/pengajuan">📝 Ajukan Izin / Cuti</a></div></div></main>
}
