"use client";

import React from "react";
import { getFeaturedProducts } from "@/src/lib/product";
import HomeProductSection from "@/src/components/home/HomeProductSection";
import { Product } from "@/src/types/product";

export interface FeaturedProductsProps {
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onViewDetail?: (product: Product) => void;
  wishlistedIds?: string[];
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  onAddToCart,
  onToggleWishlist,
  onViewDetail,
  wishlistedIds,
}) => {
  const products = getFeaturedProducts();

  return (
    <HomeProductSection
      title="Produk Unggulan"
      description="Koleksi bernilai seni tinggi yang dibuat dengan ketelitian istimewa oleh master pengrajin."
      products={products}
      emptyMessage="Belum ada produk unggulan saat ini."
      onAddToCart={onAddToCart}
      onToggleWishlist={onToggleWishlist}
      onViewDetail={onViewDetail}
      wishlistedIds={wishlistedIds}
    />
  );
};

export default FeaturedProducts;
