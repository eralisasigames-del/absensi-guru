"use client";
import { createClient } from "@/lib/supabase/client";
export default function LogoutButton() {
  return <button className="rounded-xl border px-4 py-2 text-sm" onClick={async()=>{await createClient().auth.signOut(); location.href="/login"}}>Keluar</button>;
}
