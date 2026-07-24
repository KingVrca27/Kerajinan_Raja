"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";

export interface EmptyWishlistProps {
  /** Callback opsional saat tombol jelajah diklik */
  onClose?: () => void;
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `EmptyWishlist` merender visualisasi saat daftar produk favorit kosong.
 */
export const EmptyWishlist: React.FC<EmptyWishlistProps> = ({
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
      {/* Container Ikon Lingkaran */}
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 text-accent shadow-inner">
        <Heart className="h-12 w-12 stroke-[1.5]" />
        <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white shadow-xs">
          0
        </div>
      </div>

      {/* Judul & Deskripsi */}
      <h3 className="font-heading text-xl font-bold text-text-primary sm:text-2xl">
        Belum Ada Produk Favorit
      </h3>
      <p className="mt-2 font-body text-sm text-text-secondary max-w-xs leading-relaxed">
        Simpan produk kerajinan favorit Anda dengan mengklik tombol ikon hati pada produk.
      </p>

      {/* Tombol Jelajahi Produk */}
      <Link href="/produk" onClick={onClose}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-body text-sm font-semibold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg focus:outline-none cursor-pointer"
        >
          <span>Mulai Jelajahi Produk</span>
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </Link>
    </motion.div>
  );
};

export default EmptyWishlist;
