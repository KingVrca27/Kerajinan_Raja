import Link from "next/link";
import { ArrowLeft, Home, PackageSearch } from "lucide-react";

export const metadata = {
  title: "Halaman Tidak Ditemukan (404) | Putra Art Shop",
  description: "Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center font-body">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6">
        <PackageSearch className="h-10 w-10" />
      </div>
      <h1 className="font-heading text-4xl font-bold text-text-primary sm:text-5xl">
        404 — Halaman Tidak Ditemukan
      </h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary sm:text-base">
        Maaf, halaman yang Anda cari tidak dapat ditemukan, telah dihapus, atau alamat URL yang Anda masukkan salah.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-heading text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
        <Link
          href="/produk"
          className="flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-6 py-3 font-heading text-sm font-semibold text-primary hover:bg-secondary/40 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Lihat Katalog Produk
        </Link>
      </div>
    </div>
  );
}
