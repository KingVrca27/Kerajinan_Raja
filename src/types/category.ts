/**
 * Interface definisi data Kategori Produk (model frontend).
 *
 * Digunakan oleh komponen website (CategoryCard, CategoryGrid, CategorySection)
 * dan juga Admin Dashboard.
 *
 * Field is_active dan sort_order bersifat opsional agar kompatibel dengan
 * penggunaan di komponen website yang tidak memerlukan field admin tersebut.
 */
export interface Category {
  /** UUID kategori */
  id: string;
  /** URL-friendly slug unik */
  slug: string;
  /** Nama kategori */
  name: string;
  /** Deskripsi singkat kategori */
  description?: string;
  /** Nama icon Lucide (opsional, warisan dari data statis) */
  icon?: string;
  /** URL gambar kategori dari Supabase Storage */
  image?: string;
  /** Jumlah produk aktif dalam kategori ini */
  productCount?: number;
  /** Status aktif (diisi oleh admin dashboard) */
  is_active?: boolean;
  /** Urutan tampil (diisi oleh admin dashboard) */
  sort_order?: number;
}
