"use client";

import React from "react";
import { motion } from "framer-motion";
import { Product } from "@/src/types/product";
import { ProductCard } from "@/src/components/product/ProductCard";
import { useWishlist } from "@/src/hooks/useWishlist";

export interface WishlistGridProps {
  /** Array daftar produk favorit */
  products: Product[];
  /** Kelas CSS tambahan */
  className?: string;
}

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

/**
 * Komponen `WishlistGrid` merender grid kartu produk favorit pada halaman `/wishlist`.
 * Berkelakuan responsif: Mobile 1 Kolom, Tablet 2 Kolom, Desktop 4 Kolom.
 */
export const WishlistGrid: React.FC<WishlistGridProps> = ({
  products,
  className = "",
}) => {
  const { toggleItem } = useWishlist();

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
            isWishlisted={true}
            onToggleWishlist={() => toggleItem(product)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default WishlistGrid;
