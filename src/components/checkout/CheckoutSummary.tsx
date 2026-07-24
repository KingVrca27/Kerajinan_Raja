"use client";

import React from "react";
import Image from "next/image";
import { PackageCheck, ShoppingBag } from "lucide-react";
import { CartItem } from "@/src/types/cart";
import { formatRupiah } from "@/src/lib/currency";

export interface CheckoutSummaryProps {
  /** Array daftar item di keranjang belanja */
  items: CartItem[];
  /** Jumlah total akumulasi unit barang */
  totalItems: number;
  /** Total nominal harga dalam Rupiah */
  subtotal: number;
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `CheckoutSummary` merender ringkasan rincian produk dan total pesanan
 * pada modal checkout sebelum dikirim ke WhatsApp.
 */
export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  items,
  totalItems,
  subtotal,
  className = "",
}) => {
  const distinctProductsCount = items.length;

  return (
    <div className={`space-y-4 rounded-2xl border border-primary/10 bg-secondary/20 p-4 sm:p-5 ${className}`}>
      <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
        <PackageCheck className="h-5 w-5 text-primary" />
        <h3 className="font-heading text-base font-bold text-text-primary">
          Ringkasan Pesanan
        </h3>
      </div>

      {/* Mini Item List Preview */}
      <div className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={`${item.product.id}-${item.selectedVariant || "default"}`}
            className="flex items-center gap-3 rounded-xl bg-white p-2 border border-primary/5 shadow-2xs"
          >
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-secondary/50">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                sizes="48px"
                className="object-cover object-center"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-heading text-xs font-bold text-text-primary truncate">
                {item.product.name}
              </h4>
              <div className="flex items-center justify-between font-body text-[11px] text-text-secondary mt-0.5">
                <span>{item.quantity} x {formatRupiah(item.product.price)}</span>
                <span className="font-bold text-primary">
                  {formatRupiah(item.product.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Kalkulasi Ringkasan */}
      <div className="space-y-2 pt-2 border-t border-primary/10 font-body text-xs sm:text-sm">
        {/* Total Produk Berbeda */}
        <div className="flex justify-between text-text-secondary">
          <span>Total Jenis Produk</span>
          <span className="font-semibold text-text-primary">
            {distinctProductsCount} jenis
          </span>
        </div>

        {/* Total Item */}
        <div className="flex justify-between text-text-secondary">
          <span>Total Item</span>
          <span className="font-semibold text-text-primary">
            {totalItems} unit
          </span>
        </div>

        {/* Subtotal */}
        <div className="flex justify-between pt-2 border-t border-primary/10 text-sm sm:text-base font-bold">
          <span className="text-text-primary">Subtotal</span>
          <span className="font-heading text-lg text-primary">
            {formatRupiah(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
