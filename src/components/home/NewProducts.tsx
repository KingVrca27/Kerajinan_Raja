/**
 * NewProducts — Server Component
 *
 * Menampilkan section "Produk Terbaru" di homepage.
 * Data diambil dari Supabase melalui productRepository.
 *
 * "Produk Baru" ditentukan secara dinamis oleh mapper berdasarkan kolom
 * created_at — bukan flag boolean statis seperti sebelumnya.
 * Produk yang dibuat dalam 30 hari terakhir dianggap sebagai "Baru".
 */

import React from "react";
import productRepository from "@/src/lib/productRepository";
import HomeProductSection from "@/src/components/home/HomeProductSection";

export async function NewProducts() {
  const products = await productRepository.getNewProducts();

  return (
    <HomeProductSection
      title="Produk Terbaru"
      description="Koleksi hasil karya pengrajin lokal terkini dengan desain segar dan inovatif."
      products={products}
      emptyMessage="Belum ada produk terbaru saat ini."
    />
  );
}

export default NewProducts;
