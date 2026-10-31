/**
 * @file src/types/productAdmin.ts
 *
 * Tipe TypeScript untuk operasi CRUD produk di Admin Dashboard.
 * Berisi tipe form data, tipe baris admin (dari Supabase join), dan konstanta default.
 *
 * BERBEDA dari src/types/product.ts yang merupakan model frontend untuk website.
 * File ini memetakan langsung ke kolom database (snake_case) dan digunakan HANYA
 * oleh halaman admin dan productAdminRepository.
 */

import type { DbProductStatus } from "@/src/types/database";

// Re-export agar mudah diakses dari admin pages
export type { DbProductStatus };

// =============================================================================
// TIPE BARIS ADMIN (dari Supabase JOIN dengan categories + product_images)
// =============================================================================

/**
 * Baris produk yang dikembalikan oleh productAdminRepository.getAdminProducts().
 * Sudah termasuk hasil JOIN dengan tabel categories dan product_images.
 */
export interface AdminProduct {
  /** UUID produk */
  id: string;
  /** UUID kategori */
  category_id: string;
  /** Nama kategori (dari JOIN categories) */
  category_name: string;
  /** Slug kategori (dari JOIN categories) */
  category_slug: string;
  /** Nama produk */
  name: string;
  /** Slug URL produk */
  slug: string;
  /** SKU / Kode produk */
  sku: string | null;
  /** Deskripsi singkat */
  short_description: string | null;
  /** Deskripsi lengkap */
  description: string | null;
  /** Harga normal (Rupiah) */
  price: number;
  /** Harga diskon (Rupiah), null jika tidak ada diskon */
  discount_price: number | null;
  /** Stok tersedia */
  stock: number;
  /** Minimum stok sebelum notifikasi */
  minimum_stock: number;
  /** Berat dalam gram */
  weight_gram: number | null;
  /** Panjang dalam cm */
  length_cm: number | null;
  /** Lebar dalam cm */
  width_cm: number | null;
  /** Tinggi dalam cm */
  height_cm: number | null;
  /** Status siklus hidup produk */
  status: DbProductStatus;
  /** Apakah produk ditandai unggulan */
  is_featured: boolean;
  /** Apakah produk terlihat di frontend */
  is_active: boolean;
  /** Urutan tampil di katalog (semakin kecil = semakin prioritas) */
  display_order: number;
  /** Meta title untuk SEO */
  meta_title: string | null;
  /** Meta description untuk SEO */
  meta_description: string | null;
  /** Metode pembayaran yang diizinkan: ["COD"], ["TRANSFER_BANK"], atau ["COD", "TRANSFER_BANK"] */
  allowed_payment_methods: string[];
  /** URL gambar utama (is_primary = true dari product_images) */
  primary_image: string | null;
  /** Timestamp dibuat */
  created_at: string;
  /** Timestamp terakhir diperbarui */
  updated_at: string;
}

// =============================================================================
// TIPE FORM DATA PRODUK
// =============================================================================

/**
 * Data form untuk membuat atau memperbarui produk di Admin Dashboard.
 *
 * Semua field numerik disimpan sebagai string agar mudah dikendalikan
 * oleh input form HTML — dikonversi ke number oleh productAdminRepository
 * sebelum dikirim ke Supabase.
 *
 * Field ini mencakup SELURUH 19 kolom yang dapat dikelola admin:
 *   name, sku, slug, category_id, short_description, description,
 *   price, discount_price, stock, minimum_stock,
 *   weight_gram, length_cm, width_cm, height_cm,
 *   status, is_featured, is_active, display_order,
 *   meta_title, meta_description
 */
export interface ProductFormData {
  name: string;
  sku: string;
  slug: string;
  category_id: string;
  short_description: string;
  description: string;
  price: string;
  discount_price: string;
  stock: string;
  minimum_stock: string;
  weight_gram: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  status: DbProductStatus;
  is_featured: boolean;
  is_active: boolean;
  display_order: string;
  meta_title: string;
  meta_description: string;
  /** Metode pembayaran yang diizinkan. Array of: "COD", "TRANSFER_BANK" */
  allowed_payment_methods: string[];
}

/**
 * Nilai awal form produk kosong — digunakan untuk mode Tambah Produk.
 */
export const DEFAULT_PRODUCT_FORM: ProductFormData = {
  name: "",
  sku: "",
  slug: "",
  category_id: "",
  short_description: "",
  description: "",
  price: "150000",
  discount_price: "",
  stock: "10",
  minimum_stock: "5",
  weight_gram: "",
  length_cm: "",
  width_cm: "",
  height_cm: "",
  status: "active",
  is_featured: false,
  is_active: true,
  display_order: "0",
  meta_title: "",
  meta_description: "",
  allowed_payment_methods: ["COD", "TRANSFER_BANK"],
};
