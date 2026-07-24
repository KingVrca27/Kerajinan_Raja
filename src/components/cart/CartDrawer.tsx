"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/src/hooks/useCart";
import CartItem from "@/src/components/cart/CartItem";
import EmptyCart from "@/src/components/cart/EmptyCart";
import CartSummary from "@/src/components/cart/CartSummary";

export interface CartDrawerProps {
  /** Kelas CSS tambahan jika diperlukan */
  className?: string;
}

/**
 * Komponen `CartDrawer` merender slide-over panel samping kanan untuk menampilkan
 * daftar item di keranjang belanja, ringkasan subtotal, serta tombol penutupan dan pengosongan.
 */
export const CartDrawer: React.FC<CartDrawerProps> = ({ className = "" }) => {
  const {
    items,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getSubtotal,
    openCheckoutModal,
  } = useCart();

  // Menutupi scrollbody pada layar saat drawer terbuka & menambahkan listener tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };

    if (isCartOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, closeCart]);

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className={`fixed inset-0 z-50 overflow-hidden ${className}`}>
          {/* Backdrop Transparan Gelap */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Container Drawer Slide-over */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative flex w-screen max-w-md flex-col bg-[#FDFBF7] shadow-2xl border-l border-amber-900/10"
            >
              {/* Header Drawer */}
              <div className="flex items-center justify-between border-b border-amber-900/10 bg-gradient-to-r from-[#9D734E] via-[#896342] to-[#765335] px-4 py-4 sm:px-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-xs border border-white/10 shadow-xs">
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-white tracking-tight sm:text-xl">
                      Keranjang Belanja
                    </h2>
                    <span className="font-body text-xs text-amber-100/90 font-medium">
                      {totalItems} unit produk tersimpan
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tombol Kosongkan Keranjang jika ada item */}
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      title="Kosongkan Keranjang"
                      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 font-body text-xs font-semibold text-amber-100 hover:bg-rose-600 hover:text-white transition-all focus:outline-none cursor-pointer border border-white/15"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Kosongkan</span>
                    </button>
                  )}

                  {/* Tombol Tutup Drawer (X) */}
                  <button
                    type="button"
                    aria-label="Tutup Keranjang"
                    onClick={closeCart}
                    className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Body Drawer (Daftar Item / Empty State) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#FDFBF7]">
                {items.length === 0 ? (
                  <EmptyCart onClose={closeCart} />
                ) : (
                  items.map((item) => (
                    <CartItem
                      key={`${item.product.id}-${item.selectedVariant || "default"}`}
                      item={item}
                      onUpdateQuantity={(qty) =>
                        updateQuantity(
                          item.product.id,
                          qty,
                          item.selectedVariant
                        )
                      }
                      onRemove={() =>
                        removeItem(item.product.id, item.selectedVariant)
                      }
                    />
                  ))
                )}
              </div>

              {/* Footer Drawer (Cart Summary jika keranjang terisi) */}
              {items.length > 0 && (
                <CartSummary
                  totalItems={totalItems}
                  distinctProductsCount={items.length}
                  subtotal={subtotal}
                  onCheckout={openCheckoutModal}
                />
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
