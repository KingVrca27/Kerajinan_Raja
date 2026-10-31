/**
 * Konfigurasi Konten Seksi Tentang Kami (About Section) Putra Art Shop.
 * Seluruh teks dan data statistik disimpan terpusat di sini untuk kemudahan pemeliharaan.
 * Mengangkat identitas brand sebagai pengrajin kerajinan tangan dari Lombok, Nusa Tenggara Barat (NTB).
 */
export const ABOUT_CONTENT = {
  badge: "Asli dari Lombok, Nusa Tenggara Barat",
  title: "Tentang Putra Art Shop",
  description: [
    "Putra Art Shop merupakan brand yang menghadirkan berbagai produk kerajinan tangan khas dari Lombok, Nusa Tenggara Barat. Kami bekerja sama dengan para pengrajin lokal untuk menghasilkan karya berkualitas yang memadukan nilai budaya, keterampilan tradisional, dan desain yang elegan.",
    "Setiap produk dibuat dengan penuh ketelitian menggunakan bahan pilihan sehingga cocok digunakan sebagai dekorasi rumah, souvenir, maupun hadiah istimewa. Melalui Putra Art Shop, kami berkomitmen membantu memperkenalkan keindahan kerajinan khas Lombok ke seluruh Indonesia.",
  ],
  subtitle: "Bangga Mengangkat Kerajinan Lokal Lombok",
  subtitleDescription:
    "Kami percaya bahwa setiap karya pengrajin memiliki cerita dan nilai budaya yang layak dikenal lebih luas. Dengan membeli produk Putra Art Shop, Anda turut mendukung perkembangan UMKM dan para pengrajin lokal di Lombok, Nusa Tenggara Barat.",
  callout:
    "Setiap pembelian produk berarti turut mendukung pengrajin lokal dan pelestarian kerajinan khas Lombok.",
  stats: [
    {
      value: "100+",
      label: "Produk Kerajinan",
    },
    {
      value: "25+",
      label: "Pengrajin Lokal Lombok",
    },
    {
      value: "1000+",
      label: "Pelanggan Puas",
    },
    {
      value: "Seluruh Indonesia",
      label: "Pengiriman",
    },
  ],
  image: {
    src: "/images/about.jpg",
    alt: "Pengrajin Lokal Putra Art Shop Lombok, Nusa Tenggara Barat",
  },
} as const;

export default ABOUT_CONTENT;
