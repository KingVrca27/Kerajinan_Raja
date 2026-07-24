import { Product } from "./product";

/**
 * Interface definisi data Keranjang Belanja.
 */
export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface CartSummary {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
}
