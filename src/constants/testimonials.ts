/**
 * Interface definisi tipe data item testimoni pelanggan.
 */
export interface TestimonialItem {
  /** ID unik testimoni */
  id: string;
  /** Nama pelanggan */
  name: string;
  /** Kota asal pelanggan */
  city: string;
  /** Rating bintang (1 - 5) */
  rating: number;
  /** Komentar / ulasan pelanggan */
  comment: string;
  /** Path file gambar avatar pelanggan */
  avatar: string;
}

/**
 * Interface definisi struktur data terpusat Seksi Testimonial.
 */
export interface TestimonialContent {
  /** Badge kecil di atas judul */
  badge: string;
  /** Judul utama seksi */
  title: string;
  /** Deskripsi singkat seksi */
  description: string;
  /** Minimal 6 data dummy testimoni pelanggan */
  items: TestimonialItem[];
}

/**
 * Data Terpusat Seksi Testimoni Pelanggan Putra Art Shop.
 * Seluruh data (nama, kota, rating, ulasan, path avatar) dikelola di sini
 * sehingga pengujian dan pembaruan data dapat dilakukan tanpa mengubah kode komponen.
 */
export const TESTIMONIAL_CONTENT: TestimonialContent = {
  badge: "Testimoni",
  title: "Apa Kata Pelanggan Kami?",
  description:
    "Kepuasan pelanggan dari seluruh Indonesia adalah kebanggaan terbesar kami. Simak ulasan langsung dari pembeli produk kerajinan khas Lombok kami.",
  items: [
    {
      id: "testi-1",
      name: "Budi Pratama",
      city: "Jakarta Selatan",
      rating: 5,
      comment:
        "Ukiran kayu khas Lombok yang saya pesan kualitasnya luar biasa halus dan detil! Packing sangat aman menggunakan kayu tambahan. Recommended seller!",
      avatar: "",
    },
    {
      id: "testi-2",
      name: "Siti Rahmawati",
      city: "Surabaya",
      rating: 5,
      comment:
        "Sangat bangga bisa mengoleksi kerajinan otentik dari Lombok. Pelayanan via WhatsApp sangat ramah dan responsif. Pengiriman ke Surabaya super cepat!",
      avatar: "",
    },
    {
      id: "testi-3",
      name: "Ahmad Hidayat",
      city: "Bandung",
      rating: 5,
      comment:
        "Produk kerajinan rotan dan kayu jadikan nuansa ruang tamu rumah saya di Bandung semakin hangat dan estetik. Kualitas finishingnya juara!",
      avatar: "",
    },
    {
      id: "testi-4",
      name: "Nabila Dewi",
      city: "Yogyakarta",
      rating: 5,
      comment:
        "Membeli souvenir untuk oleh-oleh kantor lewat Putra Art Shop sangat mudah. Admin cepat tanggap dan produk sesuai persis dengan gambar katalog.",
      avatar: "",
    },
    {
      id: "testi-5",
      name: "Made Kerti",
      city: "Denpasar, Bali",
      rating: 5,
      comment:
        "Nilai seni dan kebudayaan Lombok yang dituangkan pada ukiran kayu ini benar-benar memikat. Bahannya kokoh dan terasa sangat premium.",
      avatar: "",
    },
    {
      id: "testi-6",
      name: "Dwi Wijaya",
      city: "Medan",
      rating: 5,
      comment:
        "Pengiriman dari Lombok ke Medan sampai dengan selamat tanpa cacat sedikitpun. Senang bisa ikut mendukung pengrajin UMKM lokal Indonesia!",
      avatar: "",
    },
  ],
};

export default TESTIMONIAL_CONTENT;
