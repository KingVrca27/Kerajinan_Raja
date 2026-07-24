"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Home,
  Star,
  ShoppingCart,
  MessageCircle,
  Sparkles,
  Award,
  Flame,
  CheckCircle2,
  Package,
  Ruler,
  Weight,
} from "lucide-react";
import { Product } from "@/src/types/product";
import { formatRupiah } from "@/src/lib/currency";
import { generateSingleProductWhatsAppURL } from "@/src/lib/whatsapp";
import ProductGrid from "@/src/components/product/ProductGrid";
import { useCart } from "@/src/hooks/useCart";
import { useWishlist } from "@/src/hooks/useWishlist";
import WishlistButton from "@/src/components/wishlist/WishlistButton";

/**
 * Interface props untuk komponen ProductDetailView.
 */
export interface ProductDetailViewProps {
  /** Objek data detail produk utama */
  product: Product;
  /** Array daftar produk terkait */
  relatedProducts: Product[];
  /** Kelas CSS tambahan untuk pengayaan tampilan */
  className?: string;
}

/**
 * Komponen Client ProductDetailView merender keseluruhan elemen visual Halaman Detail Produk,
 * termasuk galeri foto interaktif, rincian produk, tombol aksi, dan grid produk terkait.
 */
export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  relatedProducts,
  className = "",
}) => {
  const { addItem } = useCart();

  // Ambil daftar gambar atau gunakan gambar utama sebagai fallback
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  // State untuk menyimpan index gambar aktif di galeri
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Buat URL Direct Link WhatsApp menggunakan helper lib/whatsapp.ts
  const whatsappUrl = generateSingleProductWhatsAppURL(
    product.name,
    product.price
  );

  return (
    <div className={`min-h-screen bg-background py-8 sm:py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* 1. Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 font-body text-xs sm:text-sm text-text-secondary"
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Beranda</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-text-secondary/40" />
          <Link
            href="/produk"
            className="hover:text-primary transition-colors"
          >
            Produk
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-text-secondary/40" />
          <Link
            href={`/produk?category=${product.category}`}
            className="capitalize hover:text-primary transition-colors"
          >
            {product.category}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-text-secondary/40" />
          <span className="font-semibold text-text-primary truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* 2 & 3. 2-Column Responsive Layout (Galeri + Informasi Produk) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Galeri Gambar Produk */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-4"
          >
            {/* Gambar Utama (Main Image Container) */}
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-primary/10 bg-secondary/40 shadow-lg">
              <Image
                src={images[selectedImageIndex] || product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-6 transition-all duration-300 hover:scale-105"
              />
            </div>

            {/* Thumbnails (Tampil jika gambar lebih dari 1) */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                      selectedImageIndex === idx
                        ? "border-primary ring-2 ring-primary/20 scale-105"
                        : "border-primary/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={imgSrc}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Rincian Informasi Produk */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col space-y-6"
          >
            {/* Badges Status Produk */}
            <div className="flex flex-wrap items-center gap-2">
              {product.isNew && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 font-body text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>BARU</span>
                </span>
              )}
              {product.isBestSeller && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 font-body text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Flame className="h-3.5 w-3.5" />
                  <span>BEST SELLER</span>
                </span>
              )}
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-body text-xs font-semibold text-primary border border-primary/20">
                  <Award className="h-3.5 w-3.5" />
                  <span>UNGGULAN</span>
                </span>
              )}
              <span className="capitalize text-xs font-semibold text-text-secondary bg-secondary/60 px-3 py-1 rounded-full border border-primary/10">
                {product.category}
              </span>
            </div>

            {/* Nama Produk */}
            <h1 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            {/* Rating & Ulasan */}
            <div className="flex items-center gap-3 font-body text-sm">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-amber-400 stroke-amber-400" />
                <span className="font-bold text-text-primary">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-text-secondary">|</span>
              <span className="text-text-secondary">
                {product.reviewCount} Ulasan
              </span>
              <span className="text-text-secondary">|</span>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>Stok: {product.stock > 0 ? `${product.stock} unit` : "Habis"}</span>
              </div>
            </div>

            {/* Harga */}
            <div className="rounded-2xl border border-primary/10 bg-secondary/30 p-4">
              <span className="font-body text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Harga Produk
              </span>
              <div className="mt-1 font-heading text-3xl font-extrabold text-primary">
                {formatRupiah(product.price)}
              </div>
            </div>

            {/* 4. Tombol Aksi */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {/* Tombol Tambah ke Keranjang */}
              <button
                type="button"
                onClick={() => addItem(product)}
                className="flex-1 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-body text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Tambah ke Keranjang</span>
              </button>

              {/* Tombol Wishlist Favorit */}
              <WishlistButton product={product} className="border border-primary/10 shadow-sm p-3.5" />

              {/* Tombol Beli via WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 py-3.5 font-body text-sm font-semibold text-white shadow-md shadow-whatsapp/20 transition-all hover:bg-whatsapp/90 hover:shadow-lg active:scale-95"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                <span>Beli via WhatsApp</span>
              </a>
            </div>

            {/* Spesifikasi Produk (Bahan, Dimensi, Berat jika ada) */}
            {(product.material || product.dimensions || product.weight) && (
              <div className="rounded-2xl border border-primary/10 bg-background p-4 space-y-2 font-body text-xs sm:text-sm text-text-secondary">
                <span className="font-semibold text-text-primary block mb-2">
                  Spesifikasi Produk:
                </span>
                {product.material && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      Bahan: <strong className="text-text-primary font-medium">{product.material}</strong>
                    </span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      Dimensi: <strong className="text-text-primary font-medium">{product.dimensions}</strong>
                    </span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      Berat: <strong className="text-text-primary font-medium">{product.weight}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* 5. Deskripsi Produk */}
        <div className="rounded-3xl border border-primary/10 bg-secondary/20 p-6 sm:p-8 space-y-4">
          <h2 className="font-heading text-xl font-bold text-text-primary sm:text-2xl">
            Deskripsi Produk
          </h2>
          <p className="font-body text-sm sm:text-base text-text-secondary leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* 6. Section Produk Terkait */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-primary/10">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                Produk Terkait
              </h2>
              <p className="mt-1 font-body text-sm text-text-secondary">
                Koleksi kerajinan tangan sejenis yang mungkin Anda sukai.
              </p>
            </div>

            {/* Reuse ProductGrid tanpa membuat grid baru */}
            <ProductGrid products={relatedProducts} />
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetailView;
