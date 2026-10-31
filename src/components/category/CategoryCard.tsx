"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

export interface CategoryCardProps {
  category: Category;
  className?: string;
}

// Map Lucide icons per category slug/id — dipakai sebagai fallback
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  rotan: Layers,
  kayu: TreePine,
  bambu: Sprout,
  souvenir: Gift,
  "dekorasi-rumah": Home,
};

/**
 * Menentukan apakah string adalah URL/path gambar yang valid.
 * Menolak nilai kosong, "null", "NULL", dsb.
 */
function isValidImageUrl(url: string | null | undefined): url is string {
  return (
    !!url &&
    url !== "null" &&
    url !== "NULL" &&
    url.trim() !== "" &&
    (url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/"))
  );
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  className = "",
}) => {
  // Ambil jumlah produk dari prop category.productCount
  const count = category.productCount ?? 0;

  // State untuk fallback ke ikon jika gambar gagal dimuat
  const [imgError, setImgError] = useState(false);

  // Gunakan gambar dari Supabase Storage jika tersedia & valid
  const hasImage = isValidImageUrl(category.image) && !imgError;

  // Dapatkan ikon fallback yang sesuai (atau Sparkles)
  const IconComponent =
    CATEGORY_ICON_MAP[category.slug?.toLowerCase()] || Sparkles;

  const targetCategorySlug = category.slug || category.id;

  return (
    <Link
      href={`/produk?kategori=${encodeURIComponent(targetCategorySlug)}`}
      className="block w-full h-full cursor-pointer focus:outline-none"
    >
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`group relative flex h-full w-full flex-col items-center justify-between rounded-2xl border border-primary/10 bg-secondary/30 p-5 text-center shadow-sm transition-all duration-300 hover:border-primary/30 hover:bg-secondary/60 hover:shadow-xl ${className}`}
      >
        {/* Container Gambar / Ikon dengan Animasi Hover */}
        <motion.div
          whileHover={{ rotate: hasImage ? 0 : 6, scale: 1.1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white"
        >
          {hasImage ? (
            <Image
              src={category.image as string}
              alt={category.name}
              width={56}
              height={56}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <IconComponent className="h-7 w-7 stroke-[1.75]" />
          )}
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
          <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/15 bg-background/80 px-3 py-2 font-body text-xs font-semibold text-text-primary transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
            <span>Lihat Produk</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default CategoryCard;
