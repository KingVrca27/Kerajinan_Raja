"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { formatRupiah } from "@/src/lib/currency";

export interface CartSummaryProps {
  /** Jumlah akumulasi seluruh unit item di keranjang */
  totalItems: number;
  /** Jumlah jenis produk berbeda yang ada di keranjang */
  distinctProductsCount: number;
  /** Total nominal harga keranjang dalam Rupiah */
  subtotal: number;
  /** Callback opsional saat tombol checkout WhatsApp diklik */
  onCheckout?: () => void;
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `CartSummary` merender ringkasan belanja pada bagian bawah keranjang,
 * menampilkan Jumlah Item, Total Jenis Produk, Subtotal Harga, serta Tombol "Checkout via WhatsApp".
 */
export const CartSummary: React.FC<CartSummaryProps> = ({
  totalItems,
  distinctProductsCount,
  subtotal,
  onCheckout,
  className = "",
}) => {
  return (
    <div className={`space-y-4 border-t border-amber-900/10 bg-white p-4 sm:p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] ${className}`}>
      {/* Rincian Ringkasan Belanja */}
      <div className="rounded-xl bg-amber-50/80 p-3.5 border border-amber-200/60 space-y-2 font-body text-xs sm:text-sm">
        {/* Total Item */}
        <div className="flex items-center justify-between text-gray-600 font-medium">
          <span>Jumlah Item ({totalItems} unit)</span>
          <span className="font-bold text-gray-900">{totalItems}</span>
        </div>

        {/* Total Produk Berbeda */}
        <div className="flex items-center justify-between text-gray-600 font-medium">
          <span>Total Jenis Produk</span>
          <span className="font-bold text-gray-900">
            {distinctProductsCount} jenis
          </span>
        </div>

        {/* Subtotal Total Harga */}
        <div className="flex items-center justify-between pt-2.5 border-t border-amber-200/70 text-sm sm:text-base font-bold">
          <span className="text-gray-900 font-bold">Subtotal</span>
          <span className="font-heading text-lg sm:text-xl font-black text-[#9D734E]">
            {formatRupiah(subtotal)}
          </span>
        </div>
      </div>

      {/* Tombol Checkout via WhatsApp */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={onCheckout}
        className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3.5 font-body text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all focus:outline-none cursor-pointer"
      >
        <MessageCircle className="h-5 w-5 fill-white stroke-none" />
        <span>Checkout via WhatsApp</span>
      </motion.button>

      {/* Catatan Bebas Ongkir / Informasi tambahan */}
      <div className="flex items-center justify-center gap-1.5 text-center font-body text-[11px] font-medium text-emerald-800 bg-emerald-50/90 py-2 px-3 rounded-xl border border-emerald-200/60">
        <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <span>Transaksi aman & terhubung langsung ke WhatsApp CS Kerajinan Raja</span>
      </div>
    </div>
  );
};

export default CartSummary;
