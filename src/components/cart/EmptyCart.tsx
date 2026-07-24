"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";

export interface EmptyCartProps {
  /** Callback opsional untuk menutup drawer saat tombol aksi diklik */
  onClose?: () => void;
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `EmptyCart` merender visualisasi saat keranjang belanja tidak memiliki item.
 * Dilengkapi dengan pesan pengingat, ikon ilustratif, dan tombol aksi "Mulai Belanja".
 */
export const EmptyCart: React.FC<EmptyCartProps> = ({
  onClose,
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      {/* Container Ikon dengan efek Lingkaran Gradient */}
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/60 text-[#9D734E] border border-amber-300/50 shadow-inner">
        <ShoppingBag className="h-12 w-12 stroke-[1.5]" />
        <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#9D734E] text-xs font-bold text-white shadow-xs">
          0
        </div>
      </div>

      {/* Judul & Deskripsi */}
      <h3 className="font-heading text-xl font-bold text-gray-900 sm:text-2xl">
        Keranjang Belanja Kosong
      </h3>
      <p className="mt-2 font-body text-sm text-gray-600 max-w-xs leading-relaxed">
        Anda belum menambahkan produk kerajinan apa pun ke dalam keranjang belanja.
      </p>

      {/* Tombol Mulai Belanja */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={onClose}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#9D734E] via-[#896342] to-[#765335] px-6 py-3 font-body text-sm font-semibold text-white shadow-md shadow-amber-900/20 transition-all hover:opacity-95 hover:shadow-lg focus:outline-none cursor-pointer"
      >
        <span>Mulai Jelajahi Produk</span>
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
};

export default EmptyCart;
