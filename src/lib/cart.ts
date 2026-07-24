import { CartItem } from "@/src/types/cart";
import { Product } from "@/src/types/product";

/**
 * Menghitung total nominal harga seluruh item di dalam keranjang belanja.
 * 
 * @param items - Daftar item keranjang.
 * @returns Total akumulasi harga dalam angka.
 */
export const calculateCartTotal = (items: CartItem[]): number => {
  if (!items || items.length === 0) return 0;
  return items.reduce((total, item) => {
    const itemPrice = item.product.price || 0;
    return total + itemPrice * item.quantity;
  }, 0);
};

/**
 * Menghitung total kuantitas seluruh item fisik yang ada di dalam keranjang belanja.
 * 
 * @param items - Daftar item keranjang.
 * @returns Jumlah total barang fisik.
 */
export const calculateTotalItems = (items: CartItem[]): number => {
  if (!items || items.length === 0) return 0;
  return items.reduce((totalQuantity, item) => totalQuantity + item.quantity, 0);
};

/**
 * Menambahkan item produk ke dalam daftar keranjang belanja (Immutable).
 * Jika produk sudah ada, kuantitas akan ditambah. Jika belum, item baru dimasukkan.
 * 
 * @param items - Daftar item keranjang saat ini.
 * @param product - Objek produk yang akan ditambahkan.
 * @param quantity - Kuantitas barang yang ingin ditambah (default: 1).
 * @param selectedVariant - Varian produk opsional.
 * @returns Array CartItem baru yang diperbarui.
 */
export const addCartItem = (
  items: CartItem[],
  product: Product,
  quantity: number = 1,
  selectedVariant?: string
): CartItem[] => {
  if (!items) items = [];
  if (!product) return items;

  const existingIndex = items.findIndex(
    (item) =>
      item.product.id === product.id &&
      item.selectedVariant === selectedVariant
  );

  if (existingIndex > -1) {
    // Duplikasi array & perbarui item yang sudah ada
    const updatedItems = [...items];
    const existingItem = updatedItems[existingIndex];
    updatedItems[existingIndex] = {
      ...existingItem,
      quantity: existingItem.quantity + quantity,
    };
    return updatedItems;
  }

  // Tambahkan item baru ke keranjang
  return [...items, { product, quantity, selectedVariant }];
};

/**
 * Menghapus item produk tertentu dari keranjang belanja berdasarkan ID produk.
 * 
 * @param items - Daftar item keranjang saat ini.
 * @param productId - ID produk yang hendak dihapus.
 * @returns Array CartItem baru tanpa item yang dihapus.
 */
export const removeCartItem = (
  items: CartItem[],
  productId: string
): CartItem[] => {
  if (!items) return [];
  return items.filter((item) => item.product.id !== productId);
};

/**
 * Mengubah jumlah kuantitas produk tertentu dalam keranjang belanja.
 * Jika kuantitas diberikan <= 0, item akan otomatis dihapus dari keranjang.
 * 
 * @param items - Daftar item keranjang saat ini.
 * @param productId - ID produk yang akan diperbarui.
 * @param quantity - Kuantitas baru yang diinginkan.
 * @returns Array CartItem baru yang diperbarui.
 */
export const updateCartQuantity = (
  items: CartItem[],
  productId: string,
  quantity: number
): CartItem[] => {
  if (!items) return [];
  if (quantity <= 0) {
    return removeCartItem(items, productId);
  }

  return items.map((item) => {
    if (item.product.id === productId) {
      return { ...item, quantity };
    }
    return item;
  });
};

/**
 * Mengosongkan keranjang belanja (mengembalikan array kosong).
 * 
 * @returns Array kosong `[]`.
 */
export const clearCart = (): CartItem[] => {
  return [];
};
