"use client";

import React from "react";
import { Search, X } from "lucide-react";

/**
 * Interface props untuk komponen ProductSearch.
 */
export interface ProductSearchProps {
  /** Nilai teks pencarian saat ini (controlled state) */
  value?: string;
  /** Callback yang dipanggil saat kata kunci pencarian berubah */
  onSearchChange: (keyword: string) => void;
  /** Teks placeholder untuk input pencarian (default: "Cari produk...") */
  placeholder?: string;
  /** Kelas CSS tambahan untuk pengayaan tampilan */
  className?: string;
}

/**
 * Komponen ProductSearch menyediakan bidang input teks untuk mencari produk.
 * Komponen ini murni bersifat UI/Controlled Component yang mengirimkan perubahan melalui callback.
 */
export const ProductSearch: React.FC<ProductSearchProps> = ({
  value = "",
  onSearchChange,
  placeholder = "Cari produk...",
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleClear = () => {
    onSearchChange("");
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {/* Ikon Pencarian */}
      <div className="absolute left-3.5 pointer-events-none text-text-secondary">
        <Search className="h-4 w-4 stroke-[2]" />
      </div>

      {/* Field Input Teks */}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-primary/20 bg-background/90 py-2.5 pl-10 pr-9 font-body text-sm text-text-primary placeholder:text-text-secondary/60 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      {/* Tombol Hapus Teks (Clear Button) */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Bersihkan pencarian"
          className="absolute right-3 rounded-full p-1 text-text-secondary hover:bg-secondary/60 hover:text-text-primary transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default ProductSearch;
