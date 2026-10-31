/**
 * BestSellerProducts — Server Component
 *
 * Menampilkan section "Produk Terlaris" di homepage.
 *
 * CATATAN SEMENTARA (FASE 4.2.2):
 *   Kolom is_best_seller belum ada di database.
 *   Saat ini menampilkan produk aktif pertama berdasarkan display_order
 *   sebagai placeholder hingga fitur Best Seller dari order_items
 *   diimplementasikan pada FASE 4.x.
 */

import React from "react";
import productRepository from "@/src/lib/productRepository";
import HomeProductSection from "@/src/components/home/HomeProductSection";

/** Jumlah maksimal produk yang ditampilkan di section Terlaris sementara */
const BEST_SELLER_LIMIT = 8;

export async function BestSellerProducts() {
  // Mengambil data produk terlaris berdasarkan penjualan nyata (orders & order_items).
  const products = await productRepository.getBestSellerProducts(BEST_SELLER_LIMIT);

  return (
    <HomeProductSection
      title="Produk Terlaris"
      description="Produk favorit pilihan terbaik yang paling banyak diminati oleh pelanggan kami."
      products={products}
      emptyMessage="Belum ada produk terlaris saat ini."
    />
  );
}

export default BestSellerProducts;
