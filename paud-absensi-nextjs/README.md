# PAUD Absensi Guru

Production-ready starter untuk absensi guru PAUD: Next.js App Router + TypeScript + Tailwind CSS + Supabase + Vercel.

## Fitur
- Login Supabase Auth
- Role Guru / Kepala Sekolah
- Absen hadir sekali per hari
- Absen pulang sekali per hari
- Riwayat absensi
- Pengajuan izin/cuti
- Approval Kepala Sekolah
- Monitoring
- Laporan
- Export Excel
- RLS Supabase

## Setup
1. `npm install`
2. Salin `.env.example` menjadi `.env.local`
3. Isi URL dan anon key Supabase.
4. Jalankan seluruh SQL pada `supabase/migrations/001_initial.sql` di Supabase SQL Editor.
5. Buat user melalui Supabase Authentication > Users.
6. Isi `profiles` untuk user tersebut dengan role `guru` atau `kepala_sekolah`.
7. `npm run dev`

## Catatan
Nama login di aplikasi menggunakan email/password Supabase. Jika ingin login dengan "nama guru + password", tambahkan tabel username dan flow server-side yang memetakan username ke email Auth.

Jangan pernah memasukkan service role key ke frontend.
