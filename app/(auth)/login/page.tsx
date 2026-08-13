"use client";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setLoading(true);setError("");const {data,error}=await createClient().auth.signInWithPassword({email,password});if(error){setError(error.message);setLoading(false);return;} const {data:p}=await createClient().from("profiles").select("role").eq("id",data.user.id).single(); location.href=p?.role==="kepala_sekolah"?"/kepala":"/guru";}
  return <main className="min-h-screen grid place-items-center p-6"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm border"><div className="mb-8"><div className="text-3xl font-black">PAUD Absensi</div><p className="text-gray-500 mt-2">Login Guru / Kepala Sekolah</p></div><form onSubmit={submit} className="space-y-4"><input required type="email" placeholder="Email / akun login" className="w-full rounded-xl border p-3" value={email} onChange={e=>setEmail(e.target.value)}/><input required type="password" placeholder="Password" className="w-full rounded-xl border p-3" value={password} onChange={e=>setPassword(e.target.value)}/>{error&&<div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}<button disabled={loading} className="w-full rounded-xl bg-emerald-600 p-3 font-bold text-white">{loading?"Memproses...":"Masuk"}</button></form></div></main>
}
