"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import categoryRepository from "@/src/lib/categoryRepository";
import CategoryGrid from "@/src/components/category/CategoryGrid";
import type { Category } from "@/src/types/category";

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

/**
 * Section Kategori Produk untuk Homepage.
 *
 * MIGRASI FASE 4.3:
 *   Sebelum : Data dari adminStorage (localStorage) + CATEGORIES (data statis)
 *   Sesudah : Data dari categoryRepository.getActiveCategories() → Supabase DB
 *
 * Komponen ini tetap "use client" karena menggunakan framer-motion animations.
 * Data di-fetch saat mount menggunakan useEffect (client-side fetch).
 * Loading state ditampilkan selama data dimuat.
 */
export const CategorySection: React.FC<CategorySectionProps> = ({
  className = "",
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    categoryRepository
      .getActiveCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data);
        }
      })
      .catch((err) => {
        console.error("[CategorySection] Gagal memuat kategori:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Jangan render section jika tidak ada kategori (setelah loading selesai)
  if (!isLoading && categories.length === 0) return null;

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

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[140px] w-[calc(50%-0.5rem)] min-w-[140px] max-w-[210px] flex-1 animate-pulse rounded-2xl bg-primary/5 sm:w-[calc(33.333%-1rem)] lg:w-[190px]"
                />
              ))}
            </div>
          )}

          {/* Category Grid */}
          {!isLoading && <CategoryGrid categories={categories} />}
        </motion.div>
      </div>
    </section>
  );
};

export default CategorySection;
