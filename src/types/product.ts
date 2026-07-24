/**
 * Interface definisi data Produk Kerajinan Raja.
 */
export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  dimensions?: string;
  weight?: string;
  material?: string;
}
