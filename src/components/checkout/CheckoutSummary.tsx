"use client";

import React from "react";
import Image from "next/image";
import { PackageCheck, Truck } from "lucide-react";
import { CartItem } from "@/src/types/cart";
import { formatRupiah } from "@/src/lib/currency";

export interface CheckoutSummaryProps {
  /** Array daftar item di keranjang belanja */
  items: CartItem[];
  /** Jumlah total akumulasi unit barang */
  totalItems: number;
  /** Total nominal harga produk (sebelum ongkir) dalam Rupiah */
  subtotal: number;
  /**
   * Ongkos kirim flat-rate dari server (opsional).
   * Jika undefined, baris ongkir tidak ditampilkan (loading state).
   */
  shippingCost?: number;
  /**
   * Grand total = subtotal + shippingCost (opsional).
   * Jika undefined, hanya subtotal yang ditampilkan.
   */
  grandTotal?: number;
  /** Pilihan service kurir yang sedang dipilih */
  selectedShippingService?: { service: string; etd?: string };
  /** Kelas CSS tambahan */
  className?: string;
  
  // Voucher Props
  voucherCodeInput?: string;
  appliedVoucher?: string | null;
  discountAmount?: number;
  voucherState?: 'idle' | 'loading' | 'success' | 'error';
  voucherMessage?: string | null;
  onVoucherCodeChange?: (val: string) => void;
  onApplyVoucher?: () => void;
  onRemoveVoucher?: () => void;
}

/**
 * Komponen `CheckoutSummary` merender ringkasan rincian produk dan total pesanan
 * pada modal checkout.
 * Menampilkan subtotal, ongkos kirim flat-rate, dan grand total jika tersedia.
 */
export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  items,
  totalItems,
  subtotal,
  shippingCost,
  grandTotal,
  selectedShippingService,
  className = "",
  voucherCodeInput,
  appliedVoucher,
  discountAmount = 0,
  voucherState,
  voucherMessage,
  onVoucherCodeChange,
  onApplyVoucher,
  onRemoveVoucher,
}) => {
  const distinctProductsCount = items.length;
  const showShipping = shippingCost !== undefined;
  const computedGrandTotal = grandTotal ?? (showShipping ? Math.max(0, subtotal - discountAmount) + shippingCost! : Math.max(0, subtotal - discountAmount));

  return (
    <div className={`space-y-4 rounded-2xl border border-amber-900/10 bg-amber-50/60 p-4 sm:p-5 shadow-xs ${className}`}>
      <div className="flex items-center gap-2 border-b border-amber-900/10 pb-3">
        <PackageCheck className="h-5 w-5 text-[#9D734E]" />
        <h3 className="font-heading text-base font-bold text-gray-900">
          Ringkasan Pesanan
        </h3>
      </div>

      {/* Mini Item List Preview */}
      <div className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={`${item.product.id}-${item.selectedVariant || "default"}`}
            className="flex items-center gap-3 rounded-xl bg-white p-2.5 border border-amber-900/10 shadow-2xs"
          >
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-amber-50/60 border border-amber-900/5 p-0.5">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                sizes="48px"
                className="object-cover object-center rounded-md"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-heading text-xs font-bold text-gray-900 truncate">
                {item.product.name}
              </h4>
              <div className="flex items-center justify-between font-body text-[11px] text-gray-500 mt-0.5">
                <span>{item.quantity} x {formatRupiah(item.product.price)}</span>
                <span className="font-bold text-[#9D734E]">
                  {formatRupiah(item.product.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Kalkulasi Ringkasan */}
      <div className="space-y-2 pt-2 border-t border-amber-900/10 font-body text-xs sm:text-sm">
        {/* Total Jenis Produk */}
        <div className="flex justify-between text-gray-600">
          <span>Total Jenis Produk</span>
          <span className="font-semibold text-gray-900">
            {distinctProductsCount} jenis
          </span>
        </div>

        {/* Total Item */}
        <div className="flex justify-between text-gray-600">
          <span>Total Item</span>
          <span className="font-semibold text-gray-900">
            {totalItems} unit
          </span>
        </div>

        {/* Voucher Input Section */}
        <div className="pt-3 pb-1 border-t border-amber-900/10">
          <label className="font-heading text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
            <span>🎟️</span> Punya kode voucher?
          </label>
          
          {appliedVoucher ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-emerald-600 hidden sm:block" />
                <span className="font-body text-xs font-bold text-emerald-800">
                  Voucher {appliedVoucher} diterapkan
                </span>
              </div>
              <button
                type="button"
                onClick={onRemoveVoucher}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Hapus
              </button>
            </div>
          ) : (
            <div className="flex flex-row items-center gap-2 w-full">
              <input
                type="text"
                value={voucherCodeInput || ""}
                onChange={(e) => onVoucherCodeChange?.(e.target.value)}
                placeholder="Masukkan kode voucher"
                disabled={voucherState === 'loading'}
                className="flex-1 w-full min-w-0 rounded-xl border border-amber-900/15 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#9D734E] focus:ring-1 focus:ring-[#9D734E]"
              />
              <button
                type="button"
                onClick={onApplyVoucher}
                disabled={voucherState === 'loading' || !voucherCodeInput?.trim()}
                className={`rounded-xl px-4 py-2 font-body text-xs font-bold text-white transition-all whitespace-nowrap shrink-0 ${
                  voucherState === 'loading' || !voucherCodeInput?.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 to-[#9D734E] hover:from-amber-700 hover:to-[#896342] active:scale-95 cursor-pointer'
                }`}
              >
                {voucherState === 'loading' ? 'Memeriksa...' : 'Pakai'}
              </button>
            </div>
          )}

          {voucherMessage && voucherState !== 'success' && (
            <p className={`mt-1.5 text-[11px] font-medium ${
              voucherState === 'error' ? 'text-rose-600' : 'text-amber-600'
            }`} aria-live="polite">
              {voucherMessage}
            </p>
          )}
        </div>

        {/* Subtotal */}
        <div className="flex justify-between items-center pt-2 text-gray-700">
          <span className="font-semibold">Subtotal Produk</span>
          <span className="font-semibold text-gray-900">
            {formatRupiah(subtotal)}
          </span>
        </div>

        {/* Diskon */}
        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-gray-700">
            <span className="font-semibold">Diskon</span>
            <span className="font-semibold text-rose-600">
              -{formatRupiah(discountAmount)}
            </span>
          </div>
        )}

        {/* Ongkos Kirim */}
        {showShipping && (
          <div className="flex justify-between items-center text-gray-700">
            <span className="flex items-center gap-1.5 font-semibold">
              <Truck className="h-3.5 w-3.5 text-[#9D734E]" />
              Ongkos Kirim
              {selectedShippingService ? (
                 <span className="text-[10px] font-normal text-gray-500">
                   (JNE {selectedShippingService.service})
                 </span>
              ) : (
                 <span className="text-[10px] font-normal text-gray-400">(Flat Rate)</span>
              )}
            </span>
            <span className="font-semibold text-gray-900">
              {shippingCost === 0 ? (
                <span className="text-gray-500 font-medium italic">Belum dihitung</span>
              ) : (
                formatRupiah(shippingCost!)
              )}
            </span>
          </div>
        )}

        {/* Loading state ongkir */}
        {!showShipping && (
          <div className="flex justify-between items-center text-gray-700">
            <span className="flex items-center gap-1.5 font-semibold">
              <Truck className="h-3.5 w-3.5 text-[#9D734E]" />
              Ongkos Kirim
            </span>
            <span className="h-4 w-16 animate-pulse rounded bg-amber-900/10" />
          </div>
        )}

        {/* Grand Total */}
        <div className="flex justify-between items-center pt-2.5 border-t border-amber-900/10 text-sm sm:text-base font-bold">
          <span className="text-gray-900">Total Pembayaran</span>
          <span className="font-heading text-lg font-extrabold text-[#9D734E]">
            {formatRupiah(computedGrandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
