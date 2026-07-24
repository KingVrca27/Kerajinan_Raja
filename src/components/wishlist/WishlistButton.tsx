"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { Product } from "@/src/types/product";
import { useWishlist } from "@/src/hooks/useWishlist";

export interface WishlistButtonProps {
  /** Objek produk jika digunakan pada kartu produk/detail */
  product?: Product;
  /** Status khusus jika digunakan sebagai tombol ikon di Navbar */
  isNavbar?: boolean;
  /** Mode tampilan ringkas mobile pada Navbar */
  isMobile?: boolean;
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `WishlistButton` merender tombol ikon Heart dari Lucide React.
 * - Pada Produk: Berubah warna merah aktif saat produk terdaftar di Wishlist.
 * - Pada Navbar: Menampilkan badge jumlah total produk favorit dan memicu pembukaan `WishlistDrawer`.
 */
export const WishlistButton: React.FC<WishlistButtonProps> = ({
  product,
  isNavbar = false,
  isMobile = false,
  className = "",
}) => {
  const { toggleItem, isInWishlist, getTotalItems, openWishlist } =
    useWishlist();

  // Mode 1: Penggunaan pada Navbar
  if (isNavbar) {
    const totalItems = getTotalItems();

    return (
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        type="button"
        aria-label={`Wishlist Produk Favorit (${totalItems} item)`}
        onClick={openWishlist}
        className={`group relative flex items-center justify-center text-white transition-colors hover:text-amber-200 focus:outline-none cursor-pointer ${
          isMobile ? "p-2" : "rounded-full p-2.5 hover:bg-white/10"
        } ${className}`}
      >
        <Heart className="h-5 w-5 text-white transition-transform group-hover:scale-110 group-hover:text-amber-200" />

        {/* Badge Jumlah Total Wishlist dengan Animasi Spring */}
        <AnimatePresence mode="wait">
          {totalItems > 0 && (
            <motion.span
              key={totalItems}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={`absolute flex items-center justify-center rounded-full bg-amber-400 font-body text-[10px] font-bold text-gray-900 shadow-xs ${
                isMobile ? "right-0 top-0 h-4 w-4" : "-right-1 -top-1 h-4 w-4"
              }`}
            >
              {totalItems > 99 ? "99+" : totalItems}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // Mode 2: Penggunaan pada Kartu Produk / Halaman Detail
  if (!product) return null;

  const isFavorited = isInWishlist(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleItem(product);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.88 }}
      type="button"
      aria-label={
        isFavorited
          ? `Hapus ${product.name} dari Wishlist`
          : `Tambahkan ${product.name} ke Wishlist`
      }
      onClick={handleClick}
      className={`rounded-full p-2.5 backdrop-blur-md transition-colors duration-200 cursor-pointer ${
        isFavorited
          ? "bg-white text-red-500 shadow-md"
          : "bg-white/80 text-text-secondary shadow-xs hover:bg-white hover:text-red-500"
      } ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          isFavorited ? "fill-current text-red-500" : ""
        }`}
      />
    </motion.button>
  );
};

export default WishlistButton;
