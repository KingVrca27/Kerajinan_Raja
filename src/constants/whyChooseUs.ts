import {
  MapPin,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Truck,
  MessageCircle,
  LucideIcon,
} from "lucide-react";

/**
 * Interface definisi tipe data item keunggulan.
 */
export interface WhyChooseUsItem {
  /** ID unik item */
  id: string;
  /** Komponen Ikon dari Lucide React */
  icon: LucideIcon;
  /** Judul poin keunggulan */
  title: string;
  /** Deskripsi singkat poin keunggulan */
  description: string;
}

/**
 * Interface definisi struktur data terpusat Seksi Why Choose Us.
 */
export interface WhyChooseUsContent {
  /** Badge kecil di atas judul */
  badge: string;
  /** Judul utama seksi */
  title: string;
  /** Deskripsi singkat seksi */
  description: string;
  /** Daftar 6 poin keunggulan */
  items: WhyChooseUsItem[];
}

/**
 * Data Terpusat Seksi "Mengapa Memilih Kerajinan Raja".
 * Seluruh teks, ikon, dan poin keunggulan dikelola di sini sehingga dapat diubah
 * atau ditambah tanpa menyentuh logika komponen React.
 */
export const WHY_CHOOSE_US_CONTENT: WhyChooseUsContent = {
  badge: "Keunggulan Kami",
  title: "Mengapa Memilih Kerajinan Raja?",
  description:
    "Kami berkomitmen memberikan produk kerajinan tangan khas Lombok terbaik dengan kualitas otentik, pelayanan prima, dan dukungan nyata bagi pengrajin lokal.",
  items: [
    {
      id: "produk-asli-lombok",
      icon: MapPin,
      title: "Produk Asli Lombok",
      description:
        "Setiap karya kerajinan dibuat langsung oleh pengrajin berpengalaman dari Lombok, Nusa Tenggara Barat.",
    },
    {
      id: "100-handmade",
      icon: Sparkles,
      title: "100% Handmade",
      description:
        "Dikerjakan dengan ketelitian tinggi secara manual untuk menghasilkan karya bernilai seni dan otentik.",
    },
    {
      id: "bahan-berkualitas",
      icon: ShieldCheck,
      title: "Bahan Berkualitas",
      description:
        "Menggunakan kayu, rotan, dan bahan alam pilihan yang awet, kokoh, dan berestetika tinggi.",
    },
    {
      id: "mendukung-umkm-lokal",
      icon: HeartHandshake,
      title: "Mendukung UMKM Lokal",
      description:
        "Setiap pembelian Anda secara langsung memberdayakan perekonomian pengrajin lokal dan komunitas Lombok.",
    },
    {
      id: "pengiriman-seluruh-indonesia",
      icon: Truck,
      title: "Pengiriman ke Seluruh Indonesia",
      description:
        "Layanan pengiriman aman dan terpercaya dengan kemasan khusus ke seluruh wilayah Indonesia.",
    },
    {
      id: "checkout-mudah-whatsapp",
      icon: MessageCircle,
      title: "Checkout Mudah via WhatsApp",
      description:
        "Proses pemesanan praktis dan ramah langsung terhubung dengan tim customer service via WhatsApp.",
    },
  ],
};

export default WHY_CHOOSE_US_CONTENT;
