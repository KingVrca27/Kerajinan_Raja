"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Home, Heart } from "lucide-react";
import { useWishlist } from "@/src/hooks/useWishlist";
import WishlistGrid from "@/src/components/wishlist/WishlistGrid";
import EmptyWishlist from "@/src/components/wishlist/EmptyWishlist";

export const WishlistClientView: React.FC = () => {
  const { items, getTotalItems } = useWishlist();
  const totalItems = getTotalItems();

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 font-body text-xs sm:text-sm text-gray-500"
        >
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:text-[#9D734E] transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Beranda</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-semibold text-gray-900">Produk Favorit</span>
        </nav>

        {/* 2. Header Halaman Wishlist */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-amber-900/10 pb-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100/80 text-[#9D734E]">
                <Heart className="h-4 w-4 fill-current" />
              </div>
              <span className="font-body text-xs font-bold uppercase tracking-wider text-[#9D734E]">
                Koleksi Anda
              </span>
            </div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Produk Favorit
            </h1>
          </div>

          <span className="font-body text-sm text-gray-600 font-medium">
            Tersimpan: <strong className="text-gray-900 font-bold">{totalItems}</strong> produk
          </span>
        </motion.div>

        {/* 3. Tampilan Grid / Empty State */}
        {items.length === 0 ? (
          <EmptyWishlist className="py-20" />
        ) : (
          <WishlistGrid products={items} />
        )}
      </div>
    </div>
  );
};

export default WishlistClientView;
