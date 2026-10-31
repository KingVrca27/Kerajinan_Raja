"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center font-body">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-red-600 mb-6">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h1 className="font-heading text-3xl font-bold text-text-primary sm:text-4xl">
        Terjadi Kesalahan Sistem
      </h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary">
        Maaf, terjadi kendala saat memuat halaman ini. Silakan coba muat ulang atau kembali ke halaman utama.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-heading text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Muat Ulang
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-6 py-3 font-heading text-sm font-semibold text-primary hover:bg-secondary/40 transition-colors"
        >
          <Home className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
