"use client";

import React from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";

/**
 * Tipe opsi pengurutan produk yang didukung.
 */
export type SortOption =
  | "latest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

/**
 * Interface props untuk komponen ProductSort.
 */
export interface ProductSortProps {
  /** Nilai opsi pengurutan yang sedang aktif */
  selectedSort?: SortOption;
  /** Callback yang dipanggil saat pilihan pengurutan berubah */
  onSortChange: (sortOption: SortOption) => void;
  /** Kelas CSS tambahan untuk pengayaan tampilan */
  className?: string;
}

/**
 * Daftar opsi pengurutan produk beserta label bahasa Indonesia yang ramah pengguna.
 */
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "Terbaru" },
  { value: "price-asc", label: "Harga Termurah" },
  { value: "price-desc", label: "Harga Termahal" },
  { value: "name-asc", label: "Nama A-Z" },
  { value: "name-desc", label: "Nama Z-A" },
];

/**
 * Komponen ProductSort menyediakan menu dropdown untuk memilih kriteria pengurutan daftar produk.
 */
export const ProductSort: React.FC<ProductSortProps> = ({
  selectedSort = "latest",
  onSortChange,
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as SortOption);
  };

  return (
    <div className={`relative flex items-center min-w-[170px] ${className}`}>
      {/* Ikon Sort */}
      <div className="absolute left-3.5 pointer-events-none text-text-secondary">
        <ArrowUpDown className="h-4 w-4 stroke-[2]" />
      </div>

      {/* Select Dropdown Pengurutan */}
      <select
        value={selectedSort}
        onChange={handleChange}
        suppressHydrationWarning
        className="w-full appearance-none rounded-xl border border-primary/20 bg-background/90 py-2.5 pl-10 pr-9 font-body text-sm text-text-primary shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
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

export default ProductSort;
