/**
 * Interface definisi data Kategori Produk.
 */
export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  productCount?: number;
}
