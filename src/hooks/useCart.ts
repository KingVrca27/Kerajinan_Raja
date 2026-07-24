"use client";

import { useContext } from "react";
import { CartContext, CartContextType } from "@/src/context/CartContext";

/**
 * Custom Hook `useCart` untuk mengakses state dan fungsi manajemen Keranjang Belanja.
 * Hook ini memberikan akses cepat ke daftar `items`, `addItem`, `removeItem`, `updateQuantity`,
 * `clearCart`, `getTotalItems`, `getSubtotal`, serta kontrol tampilan `CartDrawer`.
 *
 * @throws {Error} Jika hook dipanggil di luar `CartProvider`.
 * @returns {CartContextType} Objek Context Keranjang Belanja.
 *
 * @example
 * ```tsx
 * const { items, addItem, getSubtotal, openCart } = useCart();
 * ```
 */
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart harus digunakan di dalam komponen yang dibungkus oleh <CartProvider>."
    );
  }

  return context;
};

export default useCart;
