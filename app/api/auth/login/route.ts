import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier ?? "").trim();
    const password = String(body.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json({ error: "Username/email dan password wajib diisi." }, { status: 400 });
    }

    let email = identifier.toLowerCase();

    if (!identifier.includes("@")) {
      const admin = createAdminClient();
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("id, nama, username, role, status, tanggal_join, tanggal_resign")
        .eq("username", identifier)
        .maybeSingle();

      if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
      if (!profile) return NextResponse.json({ error: "Username tidak ditemukan." }, { status: 401 });

      const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(profile.id);
      if (authUserError || !authUser.user?.email) return NextResponse.json({ error: "Email akun tidak ditemukan." }, { status: 401 });
      email = authUser.user.email;
    }

    const supabase = await createClient();
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError || !data.user) {
      return NextResponse.json({ error: loginError?.message ?? "Login gagal." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role, status, tanggal_join, tanggal_resign")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Profil akun belum terdaftar." }, { status: 401 });
    }

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if (profile.role === "guru" && profile.tanggal_join && today < profile.tanggal_join) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: `Akun belum aktif. Tanggal mulai bekerja: ${profile.tanggal_join}.` }, { status: 403 });
    }
    if (profile.role === "guru" && profile.tanggal_resign && today >= profile.tanggal_resign) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Akun Anda sudah tidak aktif karena tanggal resign telah berlaku." }, { status: 403 });
    }
    if (profile.status !== "aktif") {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Akun Anda tidak aktif. Silakan hubungi Kepala Sekolah." }, { status: 403 });
    }

    return NextResponse.json({ ok: true, role: profile.role });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Terjadi kesalahan server." }, { status: 500 });
  }
}
