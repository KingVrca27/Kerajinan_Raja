"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Trash2 } from "lucide-react";
import { useWishlist } from "@/src/hooks/useWishlist";
import WishlistItem from "./WishlistItem";
import EmptyWishlist from "./EmptyWishlist";

export interface WishlistDrawerProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `WishlistDrawer` merender slide-over panel samping kanan untuk mengintip
 * daftar produk favorit secara cepat dari halaman mana pun di situs.
 */
export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  className = "",
}) => {
  const {
    items,
    isWishlistOpen,
    closeWishlist,
    removeItem,
    clearWishlist,
    getTotalItems,
  } = useWishlist();

  // Kunci scroll latar belakang & listener tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isWishlistOpen) {
        closeWishlist();
      }
    };

    if (isWishlistOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWishlistOpen, closeWishlist]);

  const totalItems = getTotalItems();

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <div className={`fixed inset-0 z-50 overflow-hidden ${className}`}>
          {/* Backdrop Transparan Gelap */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeWishlist}
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
                    <Heart className="h-5 w-5 text-white fill-white" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-white tracking-tight sm:text-xl">
                      Produk Favorit
                    </h2>
                    <span className="font-body text-xs text-amber-100/90 font-medium">
                      {totalItems} produk tersimpan
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tombol Hapus Semua jika ada item */}
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={clearWishlist}
                      title="Kosongkan Wishlist"
                      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 font-body text-xs font-semibold text-amber-100 hover:bg-rose-600 hover:text-white transition-all focus:outline-none cursor-pointer border border-white/15"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Kosongkan</span>
                    </button>
                  )}

                  {/* Tombol Tutup (X) */}
                  <button
                    type="button"
                    aria-label="Tutup Wishlist"
                    onClick={closeWishlist}
                    className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Body Drawer (Daftar Item / Empty State) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#FDFBF7]">
                {items.length === 0 ? (
                  <EmptyWishlist onClose={closeWishlist} />
                ) : (
                  items.map((product) => (
                    <WishlistItem
                      key={product.id}
                      product={product}
                      onRemove={() => removeItem(product.id)}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;
