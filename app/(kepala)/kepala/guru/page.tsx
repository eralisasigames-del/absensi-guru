"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/logout-button";

type Teacher = {
  id: string;
  nama: string;
  username: string | null;
  status: "aktif" | "nonaktif";
  created_at: string;
};

export default function KelolaGuruPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"semua" | "aktif" | "nonaktif">("aktif");
  const [form, setForm] = useState({ nama: "", username: "", email: "", password: "" });

  const supabase = createClient();

  async function loadTeachers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nama, username, status, created_at")
      .eq("role", "guru")
      .order("status", { ascending: true })
      .order("nama", { ascending: true });

    if (error) setError(error.message);
    else setTeachers((data ?? []) as Teacher[]);
    setLoading(false);
  }

  useEffect(() => { loadTeachers(); }, []);

  const filteredTeachers = useMemo(
    () => filter === "semua" ? teachers : teachers.filter((teacher) => teacher.status === filter),
    [teachers, filter]
  );

  async function addTeacher(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/kepala/guru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menambahkan guru.");

      setMessage(`Guru ${form.nama} berhasil ditambahkan.`);
      setForm({ nama: "", username: "", email: "", password: "" });
      setShowForm(false);
      await loadTeachers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan guru.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(teacher: Teacher) {
    setError("");
    setMessage("");
    const nextStatus = teacher.status === "aktif" ? "nonaktif" : "aktif";
    const { error } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", teacher.id)
      .eq("role", "guru");

    if (error) setError(error.message);
    else {
      setMessage(`${teacher.nama} sekarang ${nextStatus}.`);
      await loadTeachers();
    }
  }

  const aktif = teachers.filter((teacher) => teacher.status === "aktif").length;
  const nonaktif = teachers.filter((teacher) => teacher.status === "nonaktif").length;

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a href="/kepala" className="text-sm font-semibold text-emerald-700">← Dashboard Kepala Sekolah</a>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Data Guru</h1>
            <p className="mt-1 text-slate-500">Tambah guru baru dan kelola status guru aktif/nonaktif.</p>
          </div>
          <LogoutButton />
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Guru</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{teachers.length}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
            <p className="text-sm text-emerald-700">Guru Aktif</p>
            <p className="mt-1 text-3xl font-black text-emerald-700">{aktif}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-5 ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">Guru Nonaktif</p>
            <p className="mt-1 text-3xl font-black text-slate-700">{nonaktif}</p>
          </div>
        </div>

        {(message || error) && (
          <div className={`mb-5 rounded-2xl p-4 text-sm font-semibold ${error ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}`}>
            {error || message}
          </div>
        )}

        <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Tambah Guru Baru</h2>
              <p className="text-sm text-slate-500">Akun guru akan langsung aktif dan dapat digunakan untuk login.</p>
            </div>
            <button onClick={() => setShowForm((value) => !value)} className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">
              {showForm ? "Tutup Form" : "+ Tambah Guru"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={addTeacher} className="mt-6 grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-2">
              <input required placeholder="Nama lengkap guru" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-500" />
              <input required placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-500" />
              <input required type="email" placeholder="Email login" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-500" />
              <input required type="password" minLength={6} placeholder="Password minimal 6 karakter" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-500" />
              <div className="md:col-span-2 flex justify-end">
                <button disabled={saving} className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                  {saving ? "Menyimpan..." : "Simpan Guru"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Daftar Guru</h2>
              <p className="text-sm text-slate-500">Guru nonaktif tetap tersimpan dan dapat diaktifkan kembali.</p>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
              {(["aktif", "nonaktif", "semua"] as const).map((item) => (
                <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-4 py-2 capitalize ${filter === item ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">No</th>
                  <th className="px-6 py-4 font-semibold">Nama Guru</th>
                  <th className="px-6 py-4 font-semibold">Username</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">Memuat data guru...</td></tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">Belum ada guru pada kategori ini.</td></tr>
                ) : filteredTeachers.map((teacher, index) => (
                  <tr key={teacher.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{teacher.nama}</td>
                    <td className="px-6 py-4 text-slate-600">{teacher.username || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${teacher.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {teacher.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => toggleStatus(teacher)} className={`rounded-lg px-3 py-2 text-xs font-bold ${teacher.status === "aktif" ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                        {teacher.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
