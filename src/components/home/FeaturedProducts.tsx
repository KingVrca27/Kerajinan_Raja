/**
 * FeaturedProducts — Server Component
 *
 * Menampilkan section "Produk Unggulan" di homepage.
 * Data diambil dari Supabase melalui productRepository — hanya produk
 * dengan is_featured = true yang ditampilkan.
 */

import React from "react";
import productRepository from "@/src/lib/productRepository";
import HomeProductSection from "@/src/components/home/HomeProductSection";

export async function FeaturedProducts() {
  const products = await productRepository.getFeaturedProducts();

  return (
    <HomeProductSection
      title="Produk Unggulan"
      description="Koleksi bernilai seni tinggi yang dibuat dengan ketelitian istimewa oleh master pengrajin."
      products={products}
      emptyMessage="Belum ada produk unggulan saat ini."
    />
  );
}

export default FeaturedProducts;
