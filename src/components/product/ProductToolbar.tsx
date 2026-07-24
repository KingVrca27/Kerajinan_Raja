"use client";

import React from "react";
import { motion } from "framer-motion";
import ProductSearch from "@/src/components/product/ProductSearch";
import ProductFilter from "@/src/components/product/ProductFilter";
import ProductSort, { SortOption } from "@/src/components/product/ProductSort";

/**
 * Interface props untuk komponen ProductToolbar.
 */
export interface ProductToolbarProps {
  /** Nilai pencarian saat ini */
  searchKeyword?: string;
  /** Callback saat kata kunci pencarian berubah */
  onSearchChange: (keyword: string) => void;
  /** Kategori yang sedang terpilih */
  selectedCategory?: string;
  /** Callback saat kategori penyaringan berubah */
  onCategoryChange: (categorySlug: string) => void;
  /** Opsi pengurutan yang sedang terpilih */
  selectedSort?: SortOption;
  /** Callback saat kriteria pengurutan berubah */
  onSortChange: (sortOption: SortOption) => void;
  /** Kelas CSS tambahan untuk pengayaan kustomisasi tampilan */
  className?: string;
}

/**
 * Komponen ProductToolbar menggabungkan kontrol Pencarian, Filter Kategori, dan Pengurutan Produk
 * dalam satu baris fleksibel responsif (Vertikal di Mobile, Horizontal di Tablet & Desktop).
 */
export const ProductToolbar: React.FC<ProductToolbarProps> = ({
  searchKeyword = "",
  onSearchChange,
  selectedCategory = "all",
  onCategoryChange,
  selectedSort = "latest",
  onSortChange,
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-primary/10 bg-secondary/30 p-4 shadow-sm backdrop-blur-sm ${className}`}
    >
      {/* Kolom Kiri: Input Pencarian Teks */}
      <div className="w-full md:max-w-md flex-1">
        <ProductSearch
          value={searchKeyword}
          onSearchChange={onSearchChange}
        />
      </div>

      {/* Kolom Kanan: Dropdown Filter Kategori & Pengurutan */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <ProductFilter
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          className="w-full sm:w-auto"
        />

        <ProductSort
          selectedSort={selectedSort}
          onSortChange={onSortChange}
          className="w-full sm:w-auto"
        />
      </div>
    </motion.div>
  );
};

export default ProductToolbar;
