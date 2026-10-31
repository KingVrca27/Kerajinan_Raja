"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem as CartItemType } from "@/src/types/cart";
import { formatRupiah } from "@/src/lib/currency";

export interface CartItemProps {
  /** Objek data item keranjang */
  item: CartItemType;
  /** Callback untuk memperbarui kuantitas produk */
  onUpdateQuantity: (quantity: number) => void;
  /** Callback untuk menghapus produk dari keranjang */
  onRemove: () => void;
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `CartItem` merender satu baris informasi produk di dalam keranjang belanja,
 * termasuk thumbnail gambar, nama, harga satuan, pemilih kuantitas [-] [+], subtotal, serta tombol hapus.
 */
export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  className = "",
}) => {
  const { product, quantity, selectedVariant } = item;
  const isMinQuantity = quantity <= 1;
  const isMaxQuantity = quantity >= product.stock;
  const itemSubtotal = product.price * quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`group relative flex gap-3.5 rounded-2xl border border-amber-900/10 bg-white p-3.5 shadow-sm transition-all hover:border-amber-700/30 hover:shadow-md ${className}`}
    >
      {/* Thumbnail Gambar Produk */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-amber-50/60 border border-amber-900/5 p-0.5">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="80px"
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105 rounded-lg"
          unoptimized
        />
      </div>

      {/* Rincian Produk & Kontrol Kuantitas */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            {/* Nama Produk */}
            <h4 className="font-heading text-sm font-bold text-gray-900 line-clamp-1 leading-snug group-hover:text-[#9D734E] transition-colors">
              {product.name}
            </h4>

            {/* Tombol Hapus Item */}
            <button
              type="button"
              aria-label={`Hapus ${product.name} dari keranjang`}
              onClick={onRemove}
              className="text-gray-400 hover:text-rose-600 transition-colors p-1.5 -mr-1 rounded-lg hover:bg-rose-50 focus:outline-none cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Varian Opsional jika ada */}
          {selectedVariant && (
            <span className="font-body text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-amber-200/50">
              Varian: {selectedVariant}
            </span>
          )}

          {/* Harga Satuan */}
          <div className="mt-0.5 font-body text-xs font-medium text-gray-500">
            {formatRupiah(product.price)}
          </div>
        </div>

        {/* Baris Bawah: Tombol Kuantitas [-] [+] & Subtotal Item */}
        <div className="mt-2 flex items-center justify-between">
          {/* Kontrol Kuantitas */}
          <div className="flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50/70 p-1">
            {/* Tombol Kurangi Kuantitas [-] */}
            <button
              type="button"
              aria-label="Kurangi jumlah"
              disabled={isMinQuantity}
              onClick={() => onUpdateQuantity(quantity - 1)}
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs transition-colors focus:outline-none ${
                isMinQuantity
                  ? "cursor-not-allowed text-gray-300"
                  : "cursor-pointer text-amber-900 bg-white hover:bg-[#9D734E] hover:text-white shadow-2xs"
              }`}
            >
              <Minus className="h-3 w-3" />
            </button>

            {/* Angka Kuantitas */}
            <span className="w-6 text-center font-body text-xs font-bold text-gray-900">
              {quantity}
            </span>

            {/* Tombol Tambah Kuantitas [+] */}
            <button
              type="button"
              aria-label="Tambah jumlah"
              disabled={isMaxQuantity}
              onClick={() => onUpdateQuantity(quantity + 1)}
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs transition-colors focus:outline-none ${
                isMaxQuantity
                  ? "cursor-not-allowed text-gray-300"
                  : "cursor-pointer text-amber-900 bg-white hover:bg-[#9D734E] hover:text-white shadow-2xs"
              }`}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Subtotal Per Item */}
          <div className="font-heading text-sm font-extrabold text-[#9D734E]">
            {formatRupiah(itemSubtotal)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;
