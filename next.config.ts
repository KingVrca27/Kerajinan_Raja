import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Izinkan gambar dari Supabase Storage (avatar profil admin,
    // gambar produk, banner, dsb.)
    // CATATAN: dangerouslyAllowSVG TIDAK diaktifkan sesuai keamanan.
    remotePatterns: [
      {
        // Public URL — gambar produk & kategori (tidak memerlukan auth)
        protocol: "https",
        hostname: "mvuerpulaqacrgecvqjt.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Signed URL — gambar dengan akses terbatas (avatar admin, dsb.)
        // Format: /storage/v1/object/sign/<bucket>/<path>?token=...
        protocol: "https",
        hostname: "mvuerpulaqacrgecvqjt.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
      {
        // Fallback: semua subdomain Supabase — public
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Fallback: semua subdomain Supabase — signed
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;
