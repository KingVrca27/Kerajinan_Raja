"use client";

import { useContext } from "react";
import { WishlistContext, WishlistContextType } from "@/src/context/WishlistContext";

/**
 * Custom Hook `useWishlist` untuk mengakses state dan fungsi manajemen Produk Favorit (Wishlist).
 * Memberikan akses ke `items`, `addItem`, `removeItem`, `toggleItem`, `isInWishlist`,
 * `clearWishlist`, `getTotalItems`, serta kontrol ketersediaan `WishlistDrawer`.
 *
 * @throws {Error} Jika hook dipanggil di luar `WishlistProvider`.
 * @returns {WishlistContextType} Objek Context Wishlist.
 *
 * @example
 * ```tsx
 * const { items, toggleItem, isInWishlist, openWishlist } = useWishlist();
 * ```
 */
export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist harus digunakan di dalam komponen yang dibungkus oleh <WishlistProvider>."
    );
  }

  return context;
};

export default useWishlist;
