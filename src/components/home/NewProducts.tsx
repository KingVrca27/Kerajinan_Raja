"use client";

import React from "react";
import { getNewProducts } from "@/src/lib/product";
import HomeProductSection from "@/src/components/home/HomeProductSection";
import { Product } from "@/src/types/product";

export interface NewProductsProps {
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onViewDetail?: (product: Product) => void;
  wishlistedIds?: string[];
}

export const NewProducts: React.FC<NewProductsProps> = ({
  onAddToCart,
  onToggleWishlist,
  onViewDetail,
  wishlistedIds,
}) => {
  const products = getNewProducts();

  return (
    <HomeProductSection
      title="Produk Terbaru"
      description="Koleksi hasil karya pengrajin lokal terkini dengan desain segar dan inovatif."
      products={products}
      emptyMessage="Belum ada produk terbaru saat ini."
      onAddToCart={onAddToCart}
      onToggleWishlist={onToggleWishlist}
      onViewDetail={onViewDetail}
      wishlistedIds={wishlistedIds}
    />
  );
};

export default NewProducts;
