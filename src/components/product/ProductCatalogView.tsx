"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Home, Layers, Loader2 } from "lucide-react";
import productRepository from "@/src/lib/productRepository";
import { Product } from "@/src/types/product";
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
 * Komponen Client ProductCatalogView.
 *
 * Mengambil produk dari Supabase dengan server-side pagination, filter, dan sorting.
 */
export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  className = "",
}) => {
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get("kategori");

  // --- State Data ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<boolean>(false);
  
  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // --- State UI (Filter, Search, Sort) ---
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryParam || "all"
  );
  const [selectedSort, setSelectedSort] = useState<SortOption>("latest");

  // Sinkronisasi kategori dari URL query parameter
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setCurrentPage(1); // Reset page on category param change
    }
  }, [categoryParam]);

  // Reset page to 1 when filter or sort changes manually
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, selectedCategory, selectedSort]);

  // Fetch paginated products dari Supabase
  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setFetchError(false);

    productRepository
      .getPaginatedProducts({
        page: currentPage,
        limit: 12,
        category: selectedCategory,
        searchKeyword: searchKeyword,
        sortBy: selectedSort,
      })
      .then((res) => {
        if (!cancelled) {
          setProducts(res.products);
          setTotalPages(res.totalPages);
          setTotalItems(res.totalCount);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, selectedCategory, searchKeyword, selectedSort]);

  // Handler reset filter
  const handleResetFilter = useCallback(() => {
    setSearchKeyword("");
    setSelectedCategory("all");
    setSelectedSort("latest");
    setCurrentPage(1);
  }, []);

  const hasActiveFilter =
    searchKeyword || selectedCategory !== "all" || selectedSort !== "latest";

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
            Temukan berbagai kerajinan tangan berkualitas dari Putra Art Shop.
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

        {/* 5. Loading State */}
        {isLoading && (
          <div className="flex min-h-[200px] items-center justify-center gap-3 font-body text-sm text-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Memuat katalog produk...</span>
          </div>
        )}

        {/* 6. Error State */}
        {!isLoading && fetchError && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center font-body">
            <p className="text-sm font-semibold text-red-700">
              Gagal memuat data produk.
            </p>
            <p className="text-xs text-red-500">
              Periksa koneksi internet Anda, lalu muat ulang halaman.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              Muat Ulang
            </button>
          </div>
        )}

        {/* 7. Ringkasan Hasil & Reset Filter */}
        {!isLoading && !fetchError && (
          <>
            <div className="flex items-center justify-between font-body text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>
                  Menampilkan{" "}
                  <strong className="font-semibold text-text-primary">
                    {products.length}
                  </strong>{" "}
                  dari{" "}
                  <strong className="font-semibold text-text-primary">
                    {totalItems}
                  </strong>{" "}
                  produk
                </span>
              </div>

              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* 8. ProductGrid dengan Empty State terintegrasi */}
            <ProductGrid
              products={products}
              emptyMessage="Tidak ada produk yang cocok dengan pencarian atau filter Anda."
            />
          </>
        )}

        {/* 9. Server-Side Pagination */}
        {!isLoading && !fetchError && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4 pt-8 border-t border-primary/10 font-body text-sm">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-secondary/20 font-semibold text-text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Sebelumnya
            </button>
            <span className="font-semibold text-text-secondary">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-secondary/20 font-semibold text-text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Selanjutnya
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductCatalogView;
