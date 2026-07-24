"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Product } from "@/src/types/product";
import { formatRupiah } from "@/src/lib/currency";
import { useCart } from "@/src/hooks/useCart";

export interface WishlistItemProps {
  /** Objek data produk favorit */
  product: Product;
  /** Callback untuk menghapus produk dari wishlist */
  onRemove: () => void;
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `WishlistItem` merender satu baris item produk pada WishlistDrawer
 * dengan gambar thumbnail, nama, harga, tombol Tambah ke Keranjang, dan tombol Hapus.
 */
export const WishlistItem: React.FC<WishlistItemProps> = ({
  product,
  onRemove,
  className = "",
}) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    // Tambahkan produk ke Cart (produk TETAP berada di Wishlist)
    addItem(product);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`group relative flex gap-3.5 rounded-2xl border border-primary/10 bg-white p-3 shadow-xs transition-all hover:border-primary/20 hover:shadow-md ${className}`}
    >
      {/* Thumbnail Gambar Produk */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-secondary/60">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="80px"
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Rincian Produk & Tombol Aksi */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-primary">
              {product.category}
            </span>

            {/* Tombol Hapus Favorit */}
            <button
              type="button"
              aria-label={`Hapus ${product.name} dari favorit`}
              onClick={onRemove}
              className="text-text-secondary/60 hover:text-red-500 transition-colors p-1 -mr-1 rounded-lg hover:bg-red-50 focus:outline-none cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <h4 className="font-heading text-sm font-bold text-text-primary line-clamp-1 leading-snug">
            {product.name}
          </h4>

          <div className="mt-1 font-heading text-sm font-extrabold text-primary">
            {formatRupiah(product.price)}
          </div>
        </div>

        {/* Tombol Tambah ke Keranjang */}
        <div className="mt-2 flex items-center justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleAddToCart}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 font-body text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-primary/90 focus:outline-none cursor-pointer"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Tambah ke Keranjang</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default WishlistItem;
