/**
 * Interface definisi tipe data item FAQ.
 */
export interface FAQItemData {
  /** ID unik item FAQ */
  id: string;
  /** Teks pertanyaan */
  question: string;
  /** Teks jawaban informatif */
  answer: string;
}

/**
 * Interface definisi struktur data terpusat Seksi FAQ.
 */
export interface FAQContent {
  /** Badge kecil di atas judul */
  badge: string;
  /** Judul utama seksi */
  title: string;
  /** Deskripsi singkat seksi */
  description: string;
  /** Daftar minimal 8 item FAQ */
  items: FAQItemData[];
}

/**
 * Data Terpusat Seksi "Pertanyaan yang Sering Diajukan" (FAQ) Putra Art Shop.
 * Seluruh pertanyaan dan jawaban dikelola di sini sehingga dapat diperbarui atau
 * ditambah tanpa menyentuh logika komponen React.
 */
export const FAQ_CONTENT: FAQContent = {
  badge: "FAQ",
  title: "Pertanyaan yang Sering Diajukan",
  description:
    "Temukan jawaban lengkap mengenai produk kerajinan khas Lombok, alur pemesanan via WhatsApp, pengiriman, serta garansi kualitas kami.",
  items: [
    {
      id: "faq-1",
      question: "Apakah produk benar-benar dibuat di Lombok?",
      answer:
        "Ya, 100% otentik. Seluruh produk Putra Art Shop diproduksi langsung oleh para pengrajin lokal berpengalaman di Lombok, Nusa Tenggara Barat (NTB) dengan memadukan keterampilan tradisional dan nilai seni khas lokal.",
    },
    {
      id: "faq-2",
      question: "Bagaimana cara melakukan pemesanan?",
      answer:
        "Pemesanan sangat mudah! Anda cukup memilih produk di situs kami, memasukkannya ke keranjang belanja, lalu klik tombol checkout. Anda dapat menyelesaikan pesanan secara langsung di website kami.",
    },
    {
      id: "faq-3",
      question: "Apakah bisa memesan dalam jumlah banyak?",
      answer:
        "Tentu saja bisa. Kami melayani pembelian grosir, kebutuhan souvenir pernikahan, acara kantor, maupun pasokan usaha retail dengan harga khusus grosir. Silakan hubungi admin kami via WhatsApp untuk mendapatkan penawaran spesial.",
    },
    {
      id: "faq-4",
      question: "Apakah melayani pengiriman ke seluruh Indonesia?",
      answer:
        "Ya, kami melayani pengiriman ke seluruh wilayah Indonesia (Sumatera, Jawa, Bali, Kalimantan, Sulawesi, Papua, hingga daerah pelosok) menggunakan layanan ekspedisi terpercaya dengan perlindungan kemasan khusus.",
    },
    {
      id: "faq-5",
      question: "Berapa lama proses pengiriman?",
      answer:
        "Untuk produk ready stock, pesanan akan dikirimkan dalam 1-2 hari kerja setelah konfirmasi pembayaran. Lama pengiriman ke kota tujuan biasanya berkisar antara 2-5 hari kerja tergantung lokasi dan jenis ekspedisi yang dipilih.",
    },
    {
      id: "faq-6",
      question: "Apakah bisa request desain khusus?",
      answer:
        "Bisa. Kami menerima pesanan custom/desain khusus untuk ukiran nama, dimensi khusus, atau pola tertentu. Tim pengrajin kami siap mewujudkan ide kerajinan impian Anda dengan estimasi waktu pengerjaan yang disepakati.",
    },
    {
      id: "faq-7",
      question: "Bagaimana cara pembayaran?",
      answer:
        "Pembayaran dilakukan secara aman via transfer bank resmi (BCA, Mandiri, BRI, BNI) atau E-Wallet. Konfirmasi pembayaran dilakukan bersama Customer Service kami setelah pesanan masuk.",
    },
    {
      id: "faq-8",
      question: "Bagaimana jika produk rusak saat diterima?",
      answer:
        "Kami memberikan Garansi Kepuasan 100%. Setiap kemasan dilengkapi proteksi kayu/bubble wrap ekstra. Jika produk terbukti rusak saat baru dibuka (dengan menyertakan video unboxing), kami siap mengganti dengan unit produk baru tanpa biaya tambahan.",
    },
  ],
};

export default FAQ_CONTENT;
