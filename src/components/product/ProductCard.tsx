"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star, Eye } from "lucide-react";
import { Product } from "@/src/types/product";
import { formatRupiah } from "@/src/lib/currency";
import { useCart } from "@/src/hooks/useCart";
import { useWishlist } from "@/src/hooks/useWishlist";

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onViewDetail?: (product: Product) => void;
  isWishlisted?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  onViewDetail,
  isWishlisted,
  className = "",
}) => {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

  const activeWishlisted =
    isWishlisted !== undefined ? isWishlisted : isInWishlist(product.id);
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white p-3 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl ${className}`}
    >
      {/* Container Gambar & Badge Overlay */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-secondary/50">
        {/* Badges Container (Menampilkan multiple badge jika bernilai true) */}
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5 max-w-[70%]">
          {product.isNew && (
            <span className="rounded-md bg-accent px-2 py-0.5 font-body text-[10px] font-bold tracking-wider text-white uppercase shadow-xs">
              BARU
            </span>
          )}
          {product.isBestSeller && (
            <span className="rounded-md bg-amber-600 px-2 py-0.5 font-body text-[10px] font-bold tracking-wider text-white uppercase shadow-xs">
              BEST SELLER
            </span>
          )}
          {product.isFeatured && (
            <span className="rounded-md bg-primary px-2 py-0.5 font-body text-[10px] font-bold tracking-wider text-white uppercase shadow-xs">
              UNGGULAN
            </span>
          )}
        </div>

        {/* Tombol Wishlist */}
        <motion.button
          type="button"
          aria-label={activeWishlisted ? "Hapus dari Wishlist" : "Tambah ke Wishlist"}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) {
              onToggleWishlist(product);
            } else {
              toggleItem(product);
            }
          }}
          className={`absolute right-3 top-3 z-10 rounded-full p-2.5 backdrop-blur-md transition-colors duration-200 cursor-pointer ${
            activeWishlisted
              ? "bg-white text-red-500 shadow-md"
              : "bg-white/80 text-text-secondary shadow-xs hover:bg-white hover:text-red-500"
          }`}
        >
          <Heart className={`h-4 w-4 ${activeWishlisted ? "fill-current text-red-500" : ""}`} />
        </motion.button>

        {/* Gambar Produk dengan Hover Scale */}
        <div className="h-full w-full overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </div>
      </div>

      {/* Konten Rincian Produk */}
      <div className="flex flex-1 flex-col pt-3 pb-1 px-1">
        {/* Kategori */}
        <span className="font-body text-xs font-semibold uppercase tracking-wider text-primary/80">
          {product.category}
        </span>

        {/* Nama Produk */}
        <h3 className="mt-1 line-clamp-2 font-heading text-base font-bold text-text-primary group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating, Ulasan, dan Stok */}
        <div className="mt-2 flex items-center justify-between font-body text-xs text-text-secondary">
          {/* Rating & Ulasan */}
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-text-primary">{product.rating.toFixed(1)}</span>
            <span className="text-text-secondary/70">({product.reviewCount})</span>
          </div>

          {/* Indikator Stok */}
          <span className={`font-medium ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {product.stock > 0 ? `Stok: ${product.stock}` : "Stok Habis"}
          </span>
        </div>

        {/* Harga Produk */}
        <div className="mt-3 font-heading text-lg font-extrabold text-primary">
          {formatRupiah(product.price)}
        </div>

        {/* Action Buttons (Lihat Detail & Tambah ke Keranjang) */}
        <div className="mt-auto pt-4 grid grid-cols-2 gap-2 border-t border-primary/5">
          {/* Tombol Lihat Detail */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewDetail?.(product)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-secondary/50 px-2.5 py-2 font-body text-xs font-semibold text-primary transition-colors hover:bg-primary/10 hover:border-primary/40 focus:outline-none cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Lihat Detail</span>
          </motion.button>

          {/* Tombol Tambah ke Keranjang */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => (onAddToCart ? onAddToCart(product) : addItem(product))}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-2.5 py-2 font-body text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary/90 hover:shadow-md focus:outline-none cursor-pointer"
          >
            <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Tambah ke Keranjang</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
