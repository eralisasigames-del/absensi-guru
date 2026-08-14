import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateTemporaryPassword() {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `Paud@${random}`;
}

function normalizeWhatsAppNumber(value: string) {
  let number = value.replace(/\D/g, "");
  if (number.startsWith("0")) number = `62${number.slice(1)}`;
  else if (number.startsWith("8")) number = `62${number}`;
  return number.startsWith("62") ? number : "";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

    const { data: kepala, error: kepalaError } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (kepalaError || kepala?.role !== "kepala_sekolah" || kepala.status !== "aktif") {
      return NextResponse.json({ error: "Hanya Kepala Sekolah aktif yang dapat mengelola guru." }, { status: 403 });
    }

    const body = await request.json();
    const nama = String(body.nama ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const nomorWhatsapp = String(body.nomor_whatsapp ?? "").trim();
    const tanggalJoin = String(body.tanggal_join ?? "").trim();

    if (!nama || !email || !nomorWhatsapp || !tanggalJoin) {
      return NextResponse.json({ error: "Nama lengkap, email, nomor WhatsApp, dan tanggal join wajib diisi." }, { status: 400 });
    }

    const whatsapp = normalizeWhatsAppNumber(nomorWhatsapp);
    if (!whatsapp) {
      return NextResponse.json({ error: "Nomor WhatsApp tidak valid. Contoh: 081234567890." }, { status: 400 });
    }

    const joinDate = new Date(`${tanggalJoin}T00:00:00`);
    if (Number.isNaN(joinDate.getTime())) {
      return NextResponse.json({ error: "Tanggal join tidak valid." }, { status: 400 });
    }

    const admin = createAdminClient();
    const temporaryPassword = generateTemporaryPassword();

    // Email digunakan sebagai username login agar guru menerima satu kredensial
    // yang jelas dan sama dengan alamat email yang didaftarkan.
    const username = email;

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const status = tanggalJoin <= today ? "aktif" : "nonaktif";

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { nama, username, role: "guru" },
    });

    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message ?? "Gagal membuat akun guru." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .insert({
        id: created.user.id,
        nama,
        username,
        role: "guru",
        status,
        tanggal_join: tanggalJoin,
        tanggal_resign: null,
        nomor_whatsapp: whatsapp,
      })
      .select("id, nama, username, status, tanggal_join, tanggal_resign, nomor_whatsapp")
      .single();

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      guru: profile,
      credentials: {
        username,
        password: temporaryPassword,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Terjadi kesalahan server.",
    }, { status: 500 });
  }
}
