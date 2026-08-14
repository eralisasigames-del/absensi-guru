import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateTemporaryPassword() {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `Paud@${random}`;
}

async function sendCredentialsEmail({
  to,
  nama,
  username,
  password,
}: {
  to: string;
  nama: string;
  username: string;
  password: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Konfigurasi email belum lengkap. Tambahkan RESEND_API_KEY dan RESEND_FROM_EMAIL di environment variable server.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Akun Login Guru - PAUD Pencarsari",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172554;max-width:600px;margin:auto">
          <div style="background:#059669;padding:28px;border-radius:16px 16px 0 0;color:white">
            <h1 style="margin:0">PAUD Pencarsari</h1>
            <p style="margin:6px 0 0">Informasi akun absensi guru</p>
          </div>
          <div style="padding:28px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 16px 16px">
            <p>Halo <strong>${nama}</strong>,</p>
            <p>Akun Anda telah dibuat oleh Kepala Sekolah untuk sistem absensi PAUD Pencarsari.</p>
            <div style="background:#f0fdf4;padding:18px;border-radius:12px;margin:20px 0">
              <p style="margin:0 0 8px"><strong>Username:</strong> ${username}</p>
              <p style="margin:0"><strong>Password sementara:</strong> ${password}</p>
            </div>
            <p>Silakan login menggunakan akun tersebut, kemudian segera ubah password melalui menu <strong>Pengaturan Akun</strong> di dashboard guru.</p>
            <p style="color:#64748b;font-size:13px">Jangan membagikan password Anda kepada orang lain.</p>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gagal mengirim email akun guru: ${detail}`);
  }
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
    if (!nama || !email || !tanggalJoin) return NextResponse.json({ error: "Nama lengkap, email, dan tanggal join wajib diisi." }, { status: 400 });

    const joinDate = new Date(`${tanggalJoin}T00:00:00`);
    if (Number.isNaN(joinDate.getTime())) return NextResponse.json({ error: "Tanggal join tidak valid." }, { status: 400 });

    const admin = createAdminClient();
    const temporaryPassword = generateTemporaryPassword();
    const username = nama;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const status = tanggalJoin <= today ? "aktif" : "nonaktif";

    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password: temporaryPassword, email_confirm: true, user_metadata: { nama, username, role: "guru" } });
    if (createError || !created.user) return NextResponse.json({ error: createError?.message ?? "Gagal membuat akun guru." }, { status: 400 });

    const { error: profileError } = await admin.from("profiles").insert({ id: created.user.id, nama, username, role: "guru", status, tanggal_join: tanggalJoin, tanggal_resign: null });
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    try {
      await sendCredentialsEmail({ to: email, nama, username, password: temporaryPassword });
    } catch (emailError) {
      return NextResponse.json({
        ok: true,
        warning: emailError instanceof Error ? emailError.message : "Akun berhasil dibuat, tetapi email gagal dikirim.",
      });
    }

    return NextResponse.json({ ok: true, emailSent: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Terjadi kesalahan server." }, { status: 500 });
  }
}
