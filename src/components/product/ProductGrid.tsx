"use client";

import React from "react";
import { motion } from "framer-motion";
import { PackageX } from "lucide-react";
import { Product } from "@/src/types/product";
import { ProductCard } from "@/src/components/product/ProductCard";

export interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onViewDetail?: (product: Product) => void;
  wishlistedIds?: string[];
  emptyMessage?: string;
  className?: string;
}

// Animation Variants untuk Framer Motion Stagger & Fade-In
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onToggleWishlist,
  onViewDetail,
  wishlistedIds = [],
  emptyMessage = "Tidak ada produk ditemukan.",
  className = "",
}) => {
  // State jika daftar produk kosong (Empty State)
  if (!products || products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-primary/20 bg-secondary/30"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <PackageX className="h-8 w-8 stroke-[1.5]" />
        </div>
        <h3 className="font-heading text-lg font-bold text-text-primary mb-1">
          {emptyMessage}
        </h3>
        <p className="font-body text-sm text-text-secondary max-w-md">
          Coba periksa kata kunci atau filter produk yang sedang Anda cari.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={itemVariants} className="h-full">
          <ProductCard
            product={product}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            onViewDetail={onViewDetail}
            isWishlisted={wishlistedIds.includes(product.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProductGrid;
