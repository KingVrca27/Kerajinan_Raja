/**
 * Konfigurasi Lokasi Aset Gambar dan Logo Website Kerajinan Raja.
 * 
 * Pengguna dapat dengan mudah mengganti file gambar di folder /public/
 * tanpa perlu mengubah kode komponen React.
 */
export const ASSETS = {
  // Logo Brand
  LOGO: {
    SVG: "/logo/logo.svg",
    PNG: "/logo/logo.png",
    ALT: "Logo Kerajinan Raja",
  },
  // Gambar Hero Section
  HERO: {
    SRC: "/images/hero.svg",
    ALT: "Kerajinan Tangan Berkualitas Kerajinan Raja",
  },
  // Banner Placeholder
  BANNER: {
    PLACEHOLDER: "/images/banner-placeholder.jpg",
    ALT: "Banner Promosi Kerajinan Raja",
  },
  // Folder Produk
  PRODUCTS_DIR: "/products/",
  // Folder Ikon
  ICONS_DIR: "/icons/",
} as const;

export default ASSETS;
