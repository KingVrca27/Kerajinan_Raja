"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Layers,
  TreePine,
  Sprout,
  Gift,
  Home,
  Sparkles,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { Category } from "@/src/types/category";
import { getProductCountByCategory } from "@/src/lib/product";

export interface CategoryCardProps {
  category: Category;
  className?: string;
}

// Map Lucide icons per category slug/id
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  rotan: Layers,
  kayu: TreePine,
  bambu: Sprout,
  souvenir: Gift,
  "dekorasi-rumah": Home,
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  className = "",
}) => {
  // Hitung jumlah produk menggunakan helper lib/product.ts
  const count = getProductCountByCategory(category.slug || category.id);

  // Dapatkan ikon yang sesuai atau fallback ke Sparkles
  const IconComponent =
    CATEGORY_ICON_MAP[category.slug?.toLowerCase()] || Sparkles;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`group relative flex h-full w-full flex-col items-center justify-between rounded-2xl border border-primary/10 bg-secondary/30 p-5 text-center shadow-sm transition-all duration-300 hover:border-primary/30 hover:bg-secondary/60 hover:shadow-xl ${className}`}
    >
      {/* Container Icon dengan Animasi Hover Icon */}
      <motion.div
        whileHover={{ rotate: 6, scale: 1.1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white"
      >
        <IconComponent className="h-7 w-7 stroke-[1.75]" />
      </motion.div>

      {/* Detail Nama & Jumlah Produk */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex min-h-[2.75rem] items-center justify-center text-center">
          <h3 className="font-heading text-base font-bold text-text-primary transition-colors group-hover:text-primary leading-snug">
            {category.name}
          </h3>
        </div>
        <p className="mt-1 font-body text-xs font-medium text-text-secondary">
          {count} Produk
        </p>
      </div>

      {/* Tombol Kecil "Lihat Produk" */}
      <div className="mt-5 w-full">
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/15 bg-background/80 px-3 py-2 font-body text-xs font-semibold text-text-primary transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-white cursor-pointer"
        >
          <span>Lihat Produk</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
};

export default CategoryCard;
