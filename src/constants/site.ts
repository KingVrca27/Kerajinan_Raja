/**
 * Konfigurasi Utama Situs dan Footer Putra Art Shop.
 * Seluruh data kontak, sosial media, jam operasional, alamat, serta link navigasi
 * dikelola secara terpusat di sini sehingga perubahan data hanya perlu dilakukan pada satu file ini.
 */
export const SITE_CONFIG = {
  name: "Putra Art Shop",
  tagline: "Kerajinan Tangan Asli Lombok",
  description:
    "Putra Art Shop menghadirkan berbagai produk kerajinan tangan khas Lombok yang dibuat oleh pengrajin lokal dengan kualitas terbaik.",
  address: "Lombok Timur, Nusa Tenggara Barat, Indonesia",
  whatsappNumber: "081935161001",
  whatsappFormatted: "081935161001",
  whatsappClean: "6281935161001",
  contactEmail: "info@putraartshop.com",
  operationalHours: "Senin - Sabtu 08.00 - 17.00 WITA",
  logoSrc: "/images/logo.png",
  googleMapsUrl: "https://maps.google.com/",
  copyright: "© 2026 Putra Art Shop. Seluruh Hak Dilindungi.",
  createdWithLove: "Dibuat dengan ❤️ untuk mendukung pengrajin lokal Lombok.",
  socials: {
    instagram: "https://instagram.com/putraartshop",
    facebook: "https://facebook.com/putraartshop",
    tiktok: "https://tiktok.com/@putraartshop",
    youtube: "https://youtube.com/@putraartshop",
  },
  quickLinks: [
    { label: "Beranda", href: "/" },
    { label: "Semua Produk", href: "/produk" },
    { label: "Tentang Kami", href: "/#tentang-kami" },
    { label: "FAQ", href: "/#faq" },
    { label: "Hubungi Kami", href: "/#kontak" },
  ],
} as const;

export default SITE_CONFIG;
