"use client";

import React from "react";
import { motion } from "framer-motion";
import CATEGORIES from "@/src/constants/categories";
import CategoryGrid from "@/src/components/category/CategoryGrid";

export interface CategorySectionProps {
  className?: string;
}

// Animasi Fade-In & Slide-Up untuk Section Header
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

export const CategorySection: React.FC<CategorySectionProps> = ({
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
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
              Kategori Produk
            </h2>
            <p className="mt-2 font-body text-sm text-text-secondary sm:text-base">
              Temukan berbagai kerajinan tangan berdasarkan kategori pilihan Anda.
            </p>
          </div>

          {/* Category Grid */}
          <CategoryGrid categories={CATEGORIES} />
        </motion.div>
      </div>
    </section>
  );
};

export default CategorySection;
