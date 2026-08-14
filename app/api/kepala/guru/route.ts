import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

    const { data: kepala } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (kepala?.role !== "kepala_sekolah" || kepala.status !== "aktif") {
      return NextResponse.json({ error: "Hanya Kepala Sekolah aktif yang dapat menambah guru." }, { status: 403 });
    }

    const body = await request.json();
    const nama = String(body.nama ?? "").trim();
    const username = String(body.username ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!nama || !username || !email || !password) {
      return NextResponse.json({ error: "Nama, username, email, dan password wajib diisi." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: existingUsername } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nama, username, role: "guru" },
    });

    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message ?? "Gagal membuat akun guru." }, { status: 400 });
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: created.user.id,
      nama,
      username,
      role: "guru",
      status: "aktif",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Terjadi kesalahan server." }, { status: 500 });
  }
}
