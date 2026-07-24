"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Home, Layers } from "lucide-react";
import { filterProducts } from "@/src/lib/product";
import ProductToolbar from "@/src/components/product/ProductToolbar";
import ProductGrid from "@/src/components/product/ProductGrid";
import { SortOption } from "@/src/components/product/ProductSort";

/**
 * Interface props untuk komponen ProductCatalogView.
 */
export interface ProductCatalogViewProps {
  /** Kelas CSS tambahan jika diperlukan */
  className?: string;
}

/**
 * Komponen Client ProductCatalogView menangani state interaktif pencarian, penyaringan,
 * dan pengurutan katalog produk, serta merender visualisasi Katalog Produk lengkap.
 */
export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  className = "",
}) => {
  // State untuk pencarian, filter kategori, dan pengurutan
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<SortOption>("latest");

  // Filter & Sort produk secara terkomputasi (memoized) menggunakan helper dari lib/product.ts
  const displayedProducts = useMemo(() => {
    return filterProducts({
      category: selectedCategory,
      searchKeyword: searchKeyword,
      sortBy: selectedSort,
    });
  }, [searchKeyword, selectedCategory, selectedSort]);

  return (
    <div className={`min-h-screen bg-background py-8 sm:py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* 1. Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 font-body text-xs sm:text-sm text-text-secondary"
        >
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Beranda</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-text-secondary/50" />
          <span className="font-semibold text-text-primary">Produk</span>
        </nav>

        {/* 2. Judul & 3. Deskripsi Halaman */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="border-b border-primary/10 pb-6"
        >
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            Semua Produk
          </h1>
          <p className="mt-3 font-body text-base text-text-secondary sm:text-lg max-w-3xl">
            Temukan berbagai kerajinan tangan berkualitas dari Kerajinan Raja.
          </p>
        </motion.div>

        {/* 4. Product Toolbar (Search, Filter, Sort) */}
        <ProductToolbar
          searchKeyword={searchKeyword}
          onSearchChange={setSearchKeyword}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
        />

        {/* 5. Ringkasan Hasil Dinamis */}
        <div className="flex items-center justify-between font-body text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>
              Menampilkan{" "}
              <strong className="font-semibold text-text-primary">
                {displayedProducts.length}
              </strong>{" "}
              produk
            </span>
          </div>

          {/* Reset Filter Button jika ada filter aktif */}
          {(searchKeyword || selectedCategory !== "all" || selectedSort !== "latest") && (
            <button
              type="button"
              onClick={() => {
                setSearchKeyword("");
                setSelectedCategory("all");
                setSelectedSort("latest");
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* 6. ProductGrid dengan Empty State terintegrasi */}
        <ProductGrid
          products={displayedProducts}
          emptyMessage="Tidak ada produk yang cocok dengan pencarian atau filter Anda."
        />

        {/* 7. Placeholder Pagination */}
        <div className="mt-12 flex justify-center pt-8 border-t border-primary/10">
          <div className="rounded-2xl border border-dashed border-primary/20 bg-secondary/20 px-6 py-4 text-center font-body text-xs sm:text-sm text-text-secondary">
            Pagination akan tersedia pada versi berikutnya.
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductCatalogView;
