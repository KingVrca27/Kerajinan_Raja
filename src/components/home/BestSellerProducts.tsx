"use client";

import React from "react";
import { getBestSellerProducts } from "@/src/lib/product";
import HomeProductSection from "@/src/components/home/HomeProductSection";
import { Product } from "@/src/types/product";

export interface BestSellerProductsProps {
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onViewDetail?: (product: Product) => void;
  wishlistedIds?: string[];
}

export const BestSellerProducts: React.FC<BestSellerProductsProps> = ({
  onAddToCart,
  onToggleWishlist,
  onViewDetail,
  wishlistedIds,
}) => {
  const products = getBestSellerProducts();

  return (
    <HomeProductSection
      title="Produk Terlaris"
      description="Produk favorit pilihan terbaik yang paling banyak diminati oleh pelanggan kami."
      products={products}
      emptyMessage="Belum ada produk terlaris saat ini."
      onAddToCart={onAddToCart}
      onToggleWishlist={onToggleWishlist}
      onViewDetail={onViewDetail}
      wishlistedIds={wishlistedIds}
    />
  );
};

export default BestSellerProducts;
