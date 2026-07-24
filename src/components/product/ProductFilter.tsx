"use client";

import React from "react";
import { Filter, ChevronDown } from "lucide-react";
import CATEGORIES from "@/src/constants/categories";

/**
 * Interface props untuk komponen ProductFilter.
 */
export interface ProductFilterProps {
  /** Nilai kategori yang sedang terpilih (slug atau "all") */
  selectedCategory?: string;
  /** Callback yang dipanggil saat pilihan kategori berubah */
  onCategoryChange: (categorySlug: string) => void;
  /** Kelas CSS tambahan untuk pengayaan tampilan */
  className?: string;
}

/**
 * Komponen ProductFilter menyediakan menu dropdown penyaringan produk berdasarkan kategori.
 * Data kategori diambil dari constants/categories.ts.
 */
export const ProductFilter: React.FC<ProductFilterProps> = ({
  selectedCategory = "all",
  onCategoryChange,
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCategoryChange(e.target.value);
  };

  return (
    <div className={`relative flex items-center min-w-[180px] ${className}`}>
      {/* Ikon Filter */}
      <div className="absolute left-3.5 pointer-events-none text-text-secondary">
        <Filter className="h-4 w-4 stroke-[2]" />
      </div>

      {/* Select Dropdown Kategori */}
      <select
        value={selectedCategory}
        onChange={handleChange}
        className="w-full appearance-none rounded-xl border border-primary/20 bg-background/90 py-2.5 pl-10 pr-9 font-body text-sm text-text-primary shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
      >
        <option value="all">Semua Kategori</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.id} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Ikon Panah Dropdown */}
      <div className="absolute right-3 pointer-events-none text-text-secondary">
        <ChevronDown className="h-4 w-4 stroke-[2]" />
      </div>
    </div>
  );
};

export default ProductFilter;
