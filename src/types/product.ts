/**
 * Interface definisi data Produk Putra Art Shop.
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
  weight_gram: number;
  material?: string;
  allowedPaymentMethods?: string[];
}
