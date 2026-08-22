/**
 * @file src/lib/categoryRepository.ts
 *
 * Repository tunggal untuk semua operasi kategori di Supabase PostgreSQL.
 *
 * FUNGSI:
 *   - READ  : Digunakan oleh website dan admin dashboard
 *   - CREATE: Digunakan oleh admin dashboard
 *   - UPDATE: Digunakan oleh admin dashboard
 *   - DELETE: Digunakan oleh admin dashboard
 *
 * ATURAN:
 *   - Tidak ada query Supabase langsung dari komponen UI.
 *   - Komponen UI tidak mengetahui struktur tabel database.
 *   - Semua operasi kategori WAJIB melalui file ini.
 *
 * MAPPING:
 *   DbCategory (database) → Category (frontend model via mapDbCategoryToCategory)
 */

import { supabase } from "@/src/lib/supabase";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import type { DbCategory } from "@/src/types/database";
import type { Category } from "@/src/types/category";

// =============================================================================
// TIPE UNTUK OPERASI ADMIN
// =============================================================================

/** Data yang dikirim saat membuat kategori baru */
export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  parent_id?: string;
}

/** Hasil dari operasi CRUD (success/error pattern) */
export interface CategoryOperationResult {
  success: boolean;
  data?: DbCategory;
  error?: string;
}

// =============================================================================
// MAPPER: DbCategory → Category (frontend model)
// =============================================================================

/**
 * Mengkonversi baris dari tabel `categories` (DB format) menjadi
 * interface Category yang digunakan oleh komponen frontend.
 *
 * @param row - Baris DbCategory dari Supabase
 * @param productCount - Jumlah produk aktif dalam kategori ini
 */
function mapDbCategoryToCategory(row: DbCategory, productCount = 0): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    image: row.image_url ?? undefined,
    productCount,
    is_active: row.is_active,
    sort_order: row.sort_order,
  };
}

// =============================================================================
// HELPER: HITUNG JUMLAH PRODUK PER KATEGORI
// =============================================================================

/**
 * Mengambil peta jumlah produk aktif per kategori_id.
 * Digunakan secara internal untuk memperkaya data kategori dengan productCount.
 *
 * Menggunakan 1 query untuk semua kategori (bukan N queries = N+1 problem).
 */
async function fetchProductCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("products")
    .select("category_id")
    .eq("is_active", true)
    .eq("status", "active");

  if (error || !data) return {};

  return data.reduce<Record<string, number>>((acc, row) => {
    acc[row.category_id] = (acc[row.category_id] || 0) + 1;
    return acc;
  }, {});
}

// =============================================================================
// REPOSITORY OBJECT
// =============================================================================

export const categoryRepository = {

  // ---------------------------------------------------------------------------
  // READ: getActiveCategories()
  // ---------------------------------------------------------------------------

  /**
   * Mengambil semua kategori yang aktif (is_active = true) dari database,
   * diurutkan berdasarkan sort_order, beserta jumlah produk aktif masing-masing.
   *
   * Digunakan oleh:
   *   - CategorySection (homepage)
   *   - Halaman produk (filter kategori)
   *
   * @returns Array Category yang aktif, diurutkan sort_order ASC.
   */
  async getActiveCategories(): Promise<Category[]> {
    try {
      const [{ data: cats, error }, counts] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, slug, description, image_url, is_active, sort_order, parent_id, created_at, updated_at")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
        fetchProductCounts(),
      ]);

      if (error || !cats) {
        console.error("[categoryRepository.getActiveCategories]", error?.message);
        return [];
      }

      return cats.map((cat) => mapDbCategoryToCategory(cat, counts[cat.id] ?? 0));
    } catch (err) {
      console.error("[categoryRepository.getActiveCategories] Unexpected error:", err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // READ: getAllCategories() — untuk admin
  // ---------------------------------------------------------------------------

  /**
   * Mengambil SEMUA kategori (aktif maupun nonaktif) dari database.
   * Digunakan khusus oleh Admin Dashboard (tabel manajemen kategori).
   *
   * @returns Array Category (semua, termasuk nonaktif), diurutkan sort_order ASC.
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const [{ data: cats, error }, counts] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, slug, description, image_url, is_active, sort_order, parent_id, created_at, updated_at")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
        fetchProductCounts(),
      ]);

      if (error || !cats) {
        console.error("[categoryRepository.getAllCategories]", error?.message);
        return [];
      }

      return cats.map((cat) => mapDbCategoryToCategory(cat, counts[cat.id] ?? 0));
    } catch (err) {
      console.error("[categoryRepository.getAllCategories] Unexpected error:", err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // READ: getCategoryById()
  // ---------------------------------------------------------------------------

  /**
   * Mengambil satu kategori berdasarkan UUID.
   * Digunakan oleh admin saat edit kategori.
   *
   * @returns DbCategory (raw) agar admin dapat mengakses semua field,
   *          atau null jika tidak ditemukan.
   */
  async getCategoryById(id: string): Promise<DbCategory | null> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("[categoryRepository.getCategoryById]", error.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error("[categoryRepository.getCategoryById] Unexpected error:", err);
      return null;
    }
  },

  // ---------------------------------------------------------------------------
  // READ: getCategoryForDropdown() — untuk form produk
  // ---------------------------------------------------------------------------

  /**
   * Mengambil kategori aktif dalam format minimal untuk dropdown form.
   * Lebih ringan karena tidak mengambil productCount.
   *
   * @returns Array { id, name, slug } dari kategori aktif
   */
  async getCategoriesForDropdown(): Promise<{ id: string; name: string; slug: string }[]> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error || !data) {
        console.error("[categoryRepository.getCategoriesForDropdown]", error?.message);
        return [];
      }

      return data;
    } catch (err) {
      console.error("[categoryRepository.getCategoriesForDropdown] Unexpected error:", err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // CHECK: isSlugUnique()
  // ---------------------------------------------------------------------------

  /**
   * Memeriksa apakah slug sudah digunakan oleh kategori lain.
   * Digunakan untuk validasi form sebelum submit.
   *
   * @param slug - Slug yang akan diperiksa
   * @param excludeId - UUID kategori yang sedang diedit (agar tidak bentrok dengan dirinya sendiri)
   * @returns true jika slug tersedia (belum digunakan)
   */
  async isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from("categories")
        .select("id")
        .eq("slug", slug);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) return true; // Anggap unik jika gagal cek
      return data === null; // null = tidak ada yang pakai slug ini = unik
    } catch {
      return true;
    }
  },

  // ---------------------------------------------------------------------------
  // CREATE: createCategory()
  // ---------------------------------------------------------------------------

  /**
   * Membuat kategori baru di database.
   *
   * @param data - Data kategori baru (CreateCategoryData)
   * @returns CategoryOperationResult dengan data kategori yang dibuat jika sukses
   */
  async createCategory(data: CreateCategoryData): Promise<CategoryOperationResult> {
    try {
      const { data: created, error } = await supabase
        .from("categories")
        .insert({
          name: data.name.trim(),
          slug: data.slug.trim().toLowerCase(),
          description: data.description?.trim() || null,
          image_url: data.image_url || null,
          is_active: data.is_active,
          sort_order: data.sort_order,
          parent_id: data.parent_id || null,
        })
        .select()
        .single();

      if (error) {
        console.error("[categoryRepository.createCategory]", error.message);
        if (error.code === "23505") {
          return { success: false, error: "Slug sudah digunakan kategori lain. Gunakan slug yang berbeda." };
        }
        return { success: false, error: error.message };
      }

      // Activity log
      await activityLogRepository.logActivity({
        action: "Tambah Kategori",
        entity_type: "category",
        entity_id: created.id,
        description: `Menambahkan kategori "${data.name.trim()}"`,
        metadata: { category_name: data.name.trim(), slug: data.slug.trim().toLowerCase() },
      });

      return { success: true, data: created };
    } catch (err) {
      console.error("[categoryRepository.createCategory] Unexpected error:", err);
      return { success: false, error: "Terjadi kesalahan tidak terduga." };
    }
  },

  // ---------------------------------------------------------------------------
  // UPDATE: updateCategory()
  // ---------------------------------------------------------------------------

  /**
   * Memperbarui data kategori yang sudah ada.
   *
   * @param id - UUID kategori yang akan diperbarui
   * @param data - Data baru (Partial, hanya field yang berubah)
   * @returns CategoryOperationResult
   */
  async updateCategory(
    id: string,
    data: Partial<CreateCategoryData>
  ): Promise<CategoryOperationResult> {
    try {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) updatePayload.name = data.name.trim();
      if (data.slug !== undefined) updatePayload.slug = data.slug.trim().toLowerCase();
      if (data.description !== undefined) updatePayload.description = data.description?.trim() || null;
      if (data.image_url !== undefined) updatePayload.image_url = data.image_url || null;
      if (data.is_active !== undefined) updatePayload.is_active = data.is_active;
      if (data.sort_order !== undefined) updatePayload.sort_order = data.sort_order;
      if (data.parent_id !== undefined) updatePayload.parent_id = data.parent_id || null;

      const { data: updated, error } = await supabase
        .from("categories")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("[categoryRepository.updateCategory]", error.message);
        if (error.code === "23505") {
          return { success: false, error: "Slug sudah digunakan kategori lain." };
        }
        return { success: false, error: error.message };
      }

      // Activity log
      await activityLogRepository.logActivity({
        action: "Edit Kategori",
        entity_type: "category",
        entity_id: id,
        description: `Memperbarui kategori "${updated.name}"`,
        metadata: { category_name: updated.name, slug: updated.slug },
      });

      return { success: true, data: updated };
    } catch (err) {
      console.error("[categoryRepository.updateCategory] Unexpected error:", err);
      return { success: false, error: "Terjadi kesalahan tidak terduga." };
    }
  },

  // ---------------------------------------------------------------------------
  // DELETE: deleteCategory()
  // ---------------------------------------------------------------------------

  /**
   * Menghapus kategori dari database.
   *
   * Jika masih ada produk yang menggunakan kategori ini (FK RESTRICT),
   * Supabase akan mengembalikan error — ditangkap dan ditampilkan ke user.
   *
   * @param id - UUID kategori yang akan dihapus
   */
  async deleteCategory(id: string): Promise<CategoryOperationResult> {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("[categoryRepository.deleteCategory]", error.message);
        if (error.code === "23503") {
          return {
            success: false,
            error: "Kategori tidak dapat dihapus karena masih memiliki produk. Hapus atau pindahkan produk terlebih dahulu.",
          };
        }
        return { success: false, error: error.message };
      }

      // Activity log
      await activityLogRepository.logActivity({
        action: "Hapus Kategori",
        entity_type: "category",
        entity_id: id,
        description: `Menghapus kategori dengan ID: ${id}`,
        metadata: { category_id: id },
      });

      return { success: true };
    } catch (err) {
      console.error("[categoryRepository.deleteCategory] Unexpected error:", err);
      return { success: false, error: "Terjadi kesalahan tidak terduga." };
    }
  },

  // ---------------------------------------------------------------------------
  // QUICK ACTION: toggleStatus()
  // ---------------------------------------------------------------------------

  /**
   * Toggle status aktif/nonaktif kategori secara cepat.
   * Tanpa membuka modal edit — untuk tombol toggle di tabel admin.
   *
   * @param id - UUID kategori
   * @param isActive - Status aktif baru
   */
  async toggleStatus(
    id: string,
    isActive: boolean
  ): Promise<CategoryOperationResult> {
    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("[categoryRepository.toggleStatus]", error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error("[categoryRepository.toggleStatus] Unexpected error:", err);
      return { success: false, error: "Terjadi kesalahan tidak terduga." };
    }
  },
};

export default categoryRepository;
