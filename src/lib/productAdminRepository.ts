/**
 * @file src/lib/productAdminRepository.ts
 *
 * Repository CRUD untuk manajemen produk di Admin Dashboard.
 *
 * BERBEDA dari src/lib/productRepository.ts yang hanya berisi fungsi READ
 * untuk website. File ini berisi operasi tulis (INSERT/UPDATE/DELETE) yang
 * hanya dibutuhkan di dashboard admin.
 *
 * ATURAN:
 *   - Tidak ada query Supabase langsung dari komponen UI.
 *   - Tidak ada impor dari src/constants/ (data statis).
 *   - Semua operasi CRUD produk WAJIB melalui file ini.
 *
 * TIPE DATA:
 *   Input  : ProductFormData (dari src/types/productAdmin.ts)
 *   Output : AdminProduct    (dari src/types/productAdmin.ts)
 *   DB     : DbProduct       (dari src/types/database.ts)
 */

import { supabase } from "@/src/lib/supabase";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import type { AdminProduct, ProductFormData } from "@/src/types/productAdmin";

// =============================================================================
// TIPE HASIL OPERASI
// =============================================================================

export interface ProductOperationResult {
  success: boolean;
  productId?: string;
  error?: string;
}

// =============================================================================
// TIPE BARIS DARI SUPABASE JOIN
// =============================================================================

/** Tipe internal dari hasil query Supabase dengan JOIN categories + product_images */
interface RawAdminProductRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  discount_price: number | null;
  stock: number;
  minimum_stock: number;
  weight_gram: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  status: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  meta_title: string | null;
  meta_description: string | null;
  allowed_payment_methods: string[];
  created_at: string;
  updated_at: string;
  categories: {
    id: string;
    name: string;
    slug: string;
  } | null;
  product_images: {
    id: string;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
  }[];
}

// =============================================================================
// MAPPER: RawAdminProductRow → AdminProduct
// =============================================================================

function mapRawToAdminProduct(row: RawAdminProductRow): AdminProduct {
  // Pilih gambar utama (is_primary = true) atau gambar pertama sebagai fallback
  const primaryImage =
    row.product_images?.find((img) => img.is_primary)?.image_url ??
    row.product_images?.[0]?.image_url ??
    null;

  return {
    id: row.id,
    category_id: row.category_id,
    category_name: row.categories?.name ?? "Tanpa Kategori",
    category_slug: row.categories?.slug ?? "",
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    short_description: row.short_description,
    description: row.description,
    price: Number(row.price),
    discount_price: row.discount_price ? Number(row.discount_price) : null,
    stock: row.stock,
    minimum_stock: row.minimum_stock,
    weight_gram: row.weight_gram,
    length_cm: row.length_cm,
    width_cm: row.width_cm,
    height_cm: row.height_cm,
    status: row.status as AdminProduct["status"],
    is_featured: row.is_featured,
    is_active: row.is_active,
    display_order: row.display_order,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    allowed_payment_methods: Array.isArray(row.allowed_payment_methods)
      ? row.allowed_payment_methods
      : ["COD", "TRANSFER_BANK"],
    primary_image: primaryImage,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// =============================================================================
// MAPPER: ProductFormData → Database INSERT/UPDATE payload
// =============================================================================

/**
 * Mengkonversi data form (string-based) menjadi payload yang siap dikirim ke Supabase.
 * Mengkonversi string ke number, membersihkan nilai kosong menjadi null.
 */
function mapFormToDbPayload(form: ProductFormData): Record<string, unknown> {
  const parseNum = (val: string): number | null => {
    const n = Number(val);
    return val.trim() === "" || isNaN(n) ? null : n;
  };

  return {
    name: form.name.trim(),
    slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    sku: form.sku.trim() || null,
    category_id: form.category_id,
    short_description: form.short_description.trim() || null,
    description: form.description.trim() || null,
    price: Number(form.price) || 0,
    discount_price: parseNum(form.discount_price),
    stock: Number(form.stock) || 0,
    minimum_stock: Number(form.minimum_stock) || 5,
    weight_gram: parseNum(form.weight_gram),
    length_cm: parseNum(form.length_cm),
    width_cm: parseNum(form.width_cm),
    height_cm: parseNum(form.height_cm),
    status: form.status,
    is_featured: form.is_featured,
    is_active: form.is_active,
    display_order: Number(form.display_order) || 0,
    meta_title: form.meta_title.trim() || null,
    meta_description: form.meta_description.trim() || null,
    allowed_payment_methods: form.allowed_payment_methods.filter(
      (m) => ["COD", "TRANSFER_BANK"].includes(m)
    ).length > 0
      ? form.allowed_payment_methods.filter((m) => ["COD", "TRANSFER_BANK"].includes(m))
      : ["COD", "TRANSFER_BANK"], // fallback safety: never store empty
    updated_at: new Date().toISOString(),
  };
}

// =============================================================================
// REPOSITORY OBJECT
// =============================================================================

export const productAdminRepository = {

  // ---------------------------------------------------------------------------
  // READ: getAdminProducts()
  // ---------------------------------------------------------------------------

  /**
   * Mengambil semua produk (aktif & nonaktif) untuk tabel Admin Dashboard.
   * Menyertakan data kategori (nama, slug) dan gambar utama melalui JOIN.
   *
   * @returns Array AdminProduct diurutkan berdasarkan display_order ASC, created_at DESC
   */
  async getAdminProducts(): Promise<AdminProduct[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, category_id, name, slug, sku,
          short_description, description,
          price, discount_price,
          stock, minimum_stock,
          weight_gram, length_cm, width_cm, height_cm,
          status, is_featured, is_active, display_order,
          meta_title, meta_description,
          allowed_payment_methods,
          created_at, updated_at,
          categories (id, name, slug),
          product_images (id, image_url, is_primary, sort_order)
        `)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[productAdminRepository.getAdminProducts]", error.message);
        return [];
      }

      return (data ?? []).map((row) =>
        mapRawToAdminProduct(row as unknown as RawAdminProductRow)
      );
    } catch (err) {
      console.error("[productAdminRepository.getAdminProducts] Unexpected error:", err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // CREATE: createProduct()
  // ---------------------------------------------------------------------------

  /**
   * Membuat produk baru di database.
   *
   * Alur:
   *   1. INSERT ke tabel products → dapatkan productId
   *   2. (Opsional) Upload gambar via imageRepository dilakukan oleh caller
   *      menggunakan productId yang dikembalikan.
   *
   * @param form - Data form produk (ProductFormData)
   * @returns ProductOperationResult dengan productId jika sukses
   */
  async createProduct(form: ProductFormData): Promise<ProductOperationResult> {
    try {
      const payload = mapFormToDbPayload(form);
      // Hapus updated_at dari INSERT (biarkan DB set default)
      delete payload.updated_at;

      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        console.error("[productAdminRepository.createProduct]", error.message);
        if (error.code === "23505") {
          if (error.message.includes("slug")) {
            return { success: false, error: "Slug sudah digunakan produk lain. Gunakan slug yang berbeda." };
          }
          if (error.message.includes("sku")) {
            return { success: false, error: "SKU sudah digunakan produk lain. Gunakan SKU yang berbeda." };
          }
          return { success: false, error: "Data duplikat terdeteksi. Periksa slug dan SKU." };
        }
        return { success: false, error: error.message };
      }

      // Activity log
      await activityLogRepository.logActivity({
        action: "Tambah Produk",
        entity_type: "product",
        entity_id: data.id,
        description: `Menambahkan produk "${form.name.trim()}"`,
        metadata: { product_name: form.name.trim(), sku: form.sku || null, price: Number(form.price) },
      });

      return { success: true, productId: data.id };
    } catch (err) {
      console.error("[productAdminRepository.createProduct] Unexpected error:", err);
      return { success: false, error: "Terjadi kesalahan tidak terduga." };
    }
  },

  // ---------------------------------------------------------------------------
  // UPDATE: updateProduct()
  // ---------------------------------------------------------------------------

  /**
   * Memperbarui data produk yang sudah ada.
   *
   * @param id - UUID produk yang akan diperbarui
   * @param form - Data form produk terbaru (ProductFormData)
   * @returns ProductOperationResult
   */
  async updateProduct(
    id: string,
    form: ProductFormData
  ): Promise<ProductOperationResult> {
    try {
      const payload = mapFormToDbPayload(form);

      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", id);

      if (error) {
        console.error("[productAdminRepository.updateProduct]", error.message);
        if (error.code === "23505") {
          if (error.message.includes("slug")) {
            return { success: false, error: "Slug sudah digunakan produk lain." };
          }
          if (error.message.includes("sku")) {
            return { success: false, error: "SKU sudah digunakan produk lain." };
          }
        }
        return { success: false, error: error.message };
      }

      // Activity log
      await activityLogRepository.logActivity({
        action: "Edit Produk",
        entity_type: "product",
        entity_id: id,
        description: `Memperbarui data produk "${form.name.trim()}"`,
        metadata: { product_name: form.name.trim(), sku: form.sku || null, price: Number(form.price) },
      });

      return { success: true, productId: id };
    } catch (err) {
      console.error("[productAdminRepository.updateProduct] Unexpected error:", err);
      return { success: false, error: "Terjadi kesalahan tidak terduga." };
    }
  },

  // ---------------------------------------------------------------------------
  // DELETE: deleteProduct()
  // ---------------------------------------------------------------------------

  /**
   * Menghapus produk dari database.
   *
   * Gambar di tabel product_images akan otomatis terhapus (ON DELETE CASCADE).
   * Gambar di Supabase Storage TIDAK terhapus otomatis — caller bertanggung jawab
   * menghapus file Storage secara terpisah jika diperlukan.
   *
   * @param id - UUID produk yang akan dihapus
   */
  async deleteProduct(id: string): Promise<ProductOperationResult> {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("[productAdminRepository.deleteProduct]", error.message);
        return { success: false, error: error.message };
      }

      // Activity log
      await activityLogRepository.logActivity({
        action: "Hapus Produk",
        entity_type: "product",
        entity_id: id,
        description: `Menghapus produk dengan ID: ${id}`,
        metadata: { product_id: id },
      });

      return { success: true };
    } catch (err) {
      console.error("[productAdminRepository.deleteProduct] Unexpected error:", err);
      return { success: false, error: "Terjadi kesalahan tidak terduga." };
    }
  },

  // ---------------------------------------------------------------------------
  // QUICK ACTION: toggleStatus()
  // ---------------------------------------------------------------------------

  /**
   * Toggle visibilitas produk (is_active) tanpa membuka form edit.
   * Digunakan oleh tombol toggle di baris tabel admin.
   *
   * @param id - UUID produk
   * @param isActive - Status aktif baru
   */
  async toggleStatus(
    id: string,
    isActive: boolean
  ): Promise<ProductOperationResult> {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("[productAdminRepository.toggleStatus]", error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error("[productAdminRepository.toggleStatus] Unexpected error:", err);
      return { success: false, error: "Terjadi kesalahan tidak terduga." };
    }
  },

  // ---------------------------------------------------------------------------
  // QUICK ACTION: toggleFeatured()
  // ---------------------------------------------------------------------------

  /**
   * Toggle status unggulan produk (is_featured) tanpa membuka form edit.
   * Digunakan oleh tombol toggle di baris tabel admin.
   *
   * @param id - UUID produk
   * @param isFeatured - Status unggulan baru
   */
  async toggleFeatured(
    id: string,
    isFeatured: boolean
  ): Promise<ProductOperationResult> {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("[productAdminRepository.toggleFeatured]", error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error("[productAdminRepository.toggleFeatured] Unexpected error:", err);
      return { success: false, error: "Terjadi kesalahan tidak terduga." };
    }
  },

  // ---------------------------------------------------------------------------
  // OPTIMIZATION: getActiveCount()
  // ---------------------------------------------------------------------------

  /**
   * Menghitung total produk aktif tanpa memuat seluruh data baris.
   * Digunakan untuk optimasi Dashboard.
   */
  async getActiveCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      if (error) {
        console.error("[productAdminRepository.getActiveCount]", error.message);
        return 0;
      }
      return count ?? 0;
    } catch (err) {
      console.error("[productAdminRepository.getActiveCount] Unexpected error:", err);
      return 0;
    }
  },
};

export default productAdminRepository;
