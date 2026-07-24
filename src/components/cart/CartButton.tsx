"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/src/hooks/useCart";

export interface CartButtonProps {
  /** Mode tampilan ringkas untuk layar mobile */
  isMobile?: boolean;
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `CartButton` merender ikon keranjang belanja interaktif lengkap dengan badge
 * jumlah total produk yang tersimpan. Mengklik tombol ini akan membuka `CartDrawer`.
 */
export const CartButton: React.FC<CartButtonProps> = ({
  isMobile = false,
  className = "",
}) => {
  const { getTotalItems, openCart } = useCart();
  const totalItems = getTotalItems();

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      type="button"
      aria-label={`Keranjang Belanja (${totalItems} item)`}
      onClick={openCart}
      className={`group relative flex items-center justify-center text-white transition-colors hover:text-amber-200 focus:outline-none cursor-pointer ${
        isMobile ? "p-2" : "rounded-full p-2.5 hover:bg-white/10"
      } ${className}`}
    >
      <ShoppingBag className="h-5 w-5 transition-transform group-hover:scale-110 text-white group-hover:text-amber-200" />

      {/* Badge Jumlah Total Item dengan Animasi Bounce saat Berubah */}
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
};

export default CartButton;
