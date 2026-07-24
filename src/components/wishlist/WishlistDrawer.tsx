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
              className="relative flex w-screen max-w-md flex-col bg-background shadow-2xl"
            >
              {/* Header Drawer */}
              <div className="flex items-center justify-between border-b border-primary/10 bg-secondary/40 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Heart className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-text-primary sm:text-xl">
                      Produk Favorit
                    </h2>
                    <span className="font-body text-xs text-text-secondary">
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
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-body text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors focus:outline-none cursor-pointer"
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
                    className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Body Drawer (Daftar Item / Empty State) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
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
