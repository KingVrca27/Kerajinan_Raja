"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Product } from "@/src/types/product";
import ProductGrid from "@/src/components/product/ProductGrid";

export interface HomeProductSectionProps {
  title: string;
  description: string;
  products: Product[];
  emptyMessage?: string;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onViewDetail?: (product: Product) => void;
  wishlistedIds?: string[];
  className?: string;
}

// Motion variants for section header & grid wrapper (Fade In & Slide Up)
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export const HomeProductSection: React.FC<HomeProductSectionProps> = ({
  title,
  description,
  products,
  emptyMessage,
  onAddToCart,
  onToggleWishlist,
  onViewDetail,
  wishlistedIds = [],
  className = "",
}) => {
  return (
    <section className={`py-12 lg:py-16 bg-background ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={sectionVariants}
          className="space-y-8"
        >
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-primary/10 pb-6">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
                {title}
              </h2>
              <p className="mt-2 font-body text-sm text-text-secondary sm:text-base">
                {description}
              </p>
            </div>

            {/* Tombol Lihat Semua (Belum Perlu Routing) */}
            <div className="flex-shrink-0">
              <button
                type="button"
                className="group inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-secondary/40 px-4 py-2.5 font-body text-sm font-semibold text-primary shadow-sm transition-all hover:bg-primary hover:text-white hover:shadow-md"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <ProductGrid
            products={products}
            emptyMessage={emptyMessage}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            onViewDetail={onViewDetail}
            wishlistedIds={wishlistedIds}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HomeProductSection;
