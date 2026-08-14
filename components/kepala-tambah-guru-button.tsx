"use client";

import { useState } from "react";
import KepalaTambahGuruModal from "@/components/kepala-tambah-guru-modal";

export default function KepalaTambahGuruButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
      >
        <span className="text-lg leading-none">+</span>
        Tambah Guru
      </button>
      <KepalaTambahGuruModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
