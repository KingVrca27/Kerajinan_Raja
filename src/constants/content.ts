import { ASSETS } from "./assets";

/**
 * Konfigurasi Seluruh Teks dan Konten Website Kerajinan Raja.
 * 
 * Pengguna dapat dengan mudah mengubah judul, deskripsi, tombol, dan highlight
 * hanya dengan memperbarui file ini tanpa menyentuh logika komponen.
 */
export const CONTENT = {
  brand: {
    name: "Kerajinan Raja",
    tagline: "Kerajinan & Ukiran Kayu",
    logoSrc: ASSETS.LOGO.SVG,
  },

  hero: {
    badge: "100% Kerajinan Tangan Lokal",
    title: "Kerajinan Tangan Berkualitas untuk Rumah dan Hadiah Istimewa",
    description:
      "Kami menghadirkan berbagai produk kerajinan tangan pilihan yang dibuat oleh pengrajin lokal dengan kualitas terbaik, desain unik, dan harga terjangkau.",
    buttons: {
      primary: {
        text: "Lihat Produk",
        href: "#produk",
      },
      secondary: {
        text: "Hubungi via WhatsApp",
        href: "https://wa.me/",
      },
    },
    highlights: [
      "Handmade",
      "Kualitas Premium",
      "Pengiriman Seluruh Indonesia",
      "Pelayanan Cepat",
    ],
    image: {
      src: ASSETS.HERO.SRC,
      alt: ASSETS.HERO.ALT,
    },
  },
} as const;

export default CONTENT;
