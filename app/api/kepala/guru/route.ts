import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateTemporaryPassword() {
  return `Paud@${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

    const { data: kepala } = await supabase.from("profiles").select("role, status").eq("id", user.id).single();
    if (kepala?.role !== "kepala_sekolah" || kepala.status !== "aktif") {
      return NextResponse.json({ error: "Hanya Kepala Sekolah aktif yang dapat mengelola guru." }, { status: 403 });
    }

    const body = await request.json();
    const nama = String(body.nama ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const tanggalJoin = String(body.tanggal_join ?? "").trim();

    if (!nama || !email || !tanggalJoin) {
      return NextResponse.json({ error: "Nama lengkap, email, dan tanggal join wajib diisi." }, { status: 400 });
    }

    const joinDate = new Date(`${tanggalJoin}T00:00:00`);
    if (Number.isNaN(joinDate.getTime())) {
      return NextResponse.json({ error: "Tanggal join tidak valid." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: existingEmail } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
    void existingEmail;

    const temporaryPassword = generateTemporaryPassword();
    const username = email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 50) || `guru${Date.now()}`;
    const status = tanggalJoin <= new Date().toISOString().slice(0, 10) ? "aktif" : "nonaktif";

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
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
      status,
      tanggal_join: tanggalJoin,
      tanggal_resign: null,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, temporaryPassword, username });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Terjadi kesalahan server." }, { status: 500 });
  }
}
