/**
 * @file src/lib/promotionRepository.ts
 *
 * Repository pattern untuk Manajemen Promosi & Kode Voucher (promotions) di Supabase.
 *
 * STEP 6G-3: Diperluas dengan operasi Promo Banner.
 *   - Banner promo disimpan di tabel `hero_banners` dengan type='promo'
 *     dan promo_code = promotions.code (relasi via UNIQUE code)
 *   - Upload file ke bucket `Promo_Banner` (bukan Gambar_Banner)
 *   - Delete promo → hapus banner terkait terlebih dahulu (cegah orphan)
 *   - Jika code promo diubah → banner.promo_code ikut diperbarui
 */

import { supabase } from "@/src/lib/supabase";
import { createClient as createBrowserClient } from "@/src/lib/supabaseBrowser";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import { validateImageFile } from "@/src/lib/imageRepository";
import type { DbPromotion, PromotionType } from "@/src/types/ops";
import type { DbHeroBanner } from "@/src/lib/cmsRepository";

// =============================================================================
// TYPES
// =============================================================================

export interface OperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export type { DbHeroBanner };

// =============================================================================
// HELPERS
// =============================================================================

const PROMO_BANNER_BUCKET = "Promo_Banner";

/** Singleton browser client — digunakan untuk upload dari client component */
let _browserClient: ReturnType<typeof createBrowserClient> | null = null;
function getBrowserClient() {
  if (typeof window === "undefined") return supabase;
  if (!_browserClient) _browserClient = createBrowserClient();
  return _browserClient;
}

/** Generate nama file unik dan aman untuk storage */
function generatePromoBannerFileName(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

/** Ekstrak storage path dari public URL bucket Promo_Banner */
function extractPromoBannerPath(imageUrl: string): string | null {
  const match = imageUrl.match(/\/storage\/v1\/object\/public\/Promo_Banner\/(.+)$/);
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]);
}

// =============================================================================
// PROMO BANNER — STORAGE
// =============================================================================

/**
 * Upload file gambar ke bucket Promo_Banner.
 * @returns { url, path } jika berhasil, null jika gagal
 */
export async function uploadPromoBannerFile(
  file: File
): Promise<{ url: string; path: string } | null> {
  const validationError = validateImageFile(file);
  if (validationError) {
    console.error("[promotionRepository.uploadPromoBannerFile]", validationError);
    return null;
  }

  const fileName = generatePromoBannerFileName(file.name);
  const client = getBrowserClient();

  const { error } = await client.storage
    .from(PROMO_BANNER_BUCKET)
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("[promotionRepository.uploadPromoBannerFile] Upload error:", error.message);
    return null;
  }

  const { data: { publicUrl } } = client.storage
    .from(PROMO_BANNER_BUCKET)
    .getPublicUrl(fileName);

  return { url: publicUrl, path: fileName };
}

/**
 * Hapus file dari bucket Promo_Banner berdasarkan public URL.
 * Gagal silent — jangan blokir operasi DB atas kegagalan storage.
 */
export async function deletePromoBannerFile(imageUrl: string): Promise<void> {
  const path = extractPromoBannerPath(imageUrl);
  if (!path) return;
  const client = getBrowserClient();
  const { error } = await client.storage.from(PROMO_BANNER_BUCKET).remove([path]);
  if (error) {
    console.warn("[promotionRepository.deletePromoBannerFile] Storage warn:", error.message);
  }
}

// =============================================================================
// PROMO BANNER — DATABASE (hero_banners)
// =============================================================================

/**
 * Ambil banner promo yang terkait dengan kode promo tertentu.
 * Mencari di hero_banners dengan type='promo' dan promo_code = code.
 */
export async function getBannerByPromoCode(code: string): Promise<DbHeroBanner | null> {
  const client = getBrowserClient();
  const { data, error } = await client
    .from("hero_banners")
    .select("*")
    .eq("type", "promo")
    .eq("promo_code", code.toUpperCase().trim())
    .maybeSingle();

  if (error) {
    console.error("[promotionRepository.getBannerByPromoCode]", error.message);
    return null;
  }
  return data ?? null;
}

export interface PromoBannerPayload {
  image_url: string;
  title: string;
  subtitle?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  is_active?: boolean;
  sort_order?: number;
  schedule_start?: string | null;
  schedule_end?: string | null;
}

/**
 * Buat banner promo baru di hero_banners.
 * Selalu set type='promo' dan promo_code=code.
 */
export async function createPromoBanner(
  promoCode: string,
  payload: PromoBannerPayload
): Promise<OperationResult & { bannerId?: string }> {
  const client = getBrowserClient();
  const now = new Date().toISOString();
  const code = promoCode.toUpperCase().trim();

  const { data, error } = await client
    .from("hero_banners")
    .insert({
      type: "promo",
      promo_code: code,
      image_url: payload.image_url,
      title: payload.title.trim() || `Banner Promo ${code}`,
      subtitle: payload.subtitle?.trim() || null,
      link_url: payload.link_url?.trim() || null,
      link_text: payload.link_text?.trim() || null,
      is_active: payload.is_active ?? true,
      sort_order: payload.sort_order ?? 0,
      schedule_start: payload.schedule_start || null,
      schedule_end: payload.schedule_end || null,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  await activityLogRepository.logActivity({
    action: "Tambah Banner Promo",
    entity_type: "banner",
    description: `Menambahkan banner promo untuk kode: ${code}`,
    metadata: { promo_code: code },
  });

  return { success: true, bannerId: data?.id };
}

/**
 * Perbarui banner promo existing di hero_banners.
 */
export async function updatePromoBanner(
  bannerId: string,
  payload: Partial<PromoBannerPayload>
): Promise<OperationResult> {
  const client = getBrowserClient();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (payload.image_url !== undefined) updateData.image_url = payload.image_url;
  if (payload.title !== undefined) updateData.title = payload.title.trim();
  if (payload.subtitle !== undefined) updateData.subtitle = payload.subtitle?.trim() || null;
  if (payload.link_url !== undefined) updateData.link_url = payload.link_url?.trim() || null;
  if (payload.link_text !== undefined) updateData.link_text = payload.link_text?.trim() || null;
  if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
  if (payload.sort_order !== undefined) updateData.sort_order = payload.sort_order;
  if (payload.schedule_start !== undefined) updateData.schedule_start = payload.schedule_start || null;
  if (payload.schedule_end !== undefined) updateData.schedule_end = payload.schedule_end || null;

  const { error } = await client
    .from("hero_banners")
    .update(updateData)
    .eq("id", bannerId);

  if (error) return { success: false, error: error.message };

  await activityLogRepository.logActivity({
    action: "Edit Banner Promo",
    entity_type: "banner",
    entity_id: bannerId,
    description: `Memperbarui banner promo ID: ${bannerId}`,
    metadata: { banner_id: bannerId },
  });

  return { success: true };
}

/**
 * Update promo_code pada banner — dipakai saat kode promo berubah.
 */
export async function updateBannerPromoCode(
  bannerId: string,
  newCode: string
): Promise<OperationResult> {
  const client = getBrowserClient();
  const { error } = await client
    .from("hero_banners")
    .update({ promo_code: newCode.toUpperCase().trim(), updated_at: new Date().toISOString() })
    .eq("id", bannerId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Hapus banner promo dari hero_banners.
 * TIDAK menghapus promo/voucher — hanya banner-nya.
 * Jika imageUrl disediakan, hapus file dari storage setelah DB berhasil.
 */
export async function deletePromoBanner(
  bannerId: string,
  imageUrl?: string
): Promise<OperationResult> {
  const client = getBrowserClient();
  const { error } = await client
    .from("hero_banners")
    .delete()
    .eq("id", bannerId);

  if (error) return { success: false, error: error.message };

  // Hapus file storage hanya setelah DB berhasil dihapus
  if (imageUrl) {
    await deletePromoBannerFile(imageUrl);
  }

  await activityLogRepository.logActivity({
    action: "Hapus Banner Promo",
    entity_type: "banner",
    entity_id: bannerId,
    description: `Menghapus banner promo ID: ${bannerId}`,
    metadata: { banner_id: bannerId },
  });

  return { success: true };
}

// =============================================================================
// PROMOTIONS CRUD
// =============================================================================

export const promotionRepository = {
  /** Ambil semua promosi */
  async getAll(): Promise<DbPromotion[]> {
    const client = getBrowserClient();
    const { data, error } = await client
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[promotionRepository.getAll]", error.message);
      return [];
    }
    return data || [];
  },

  /** Buat promosi baru */
  async create(payload: Omit<DbPromotion, "id" | "created_at" | "updated_at" | "usage_count">): Promise<OperationResult> {
    const client = getBrowserClient();
    const { error } = await client.from("promotions").insert({
      code: payload.code.toUpperCase().trim(),
      name: payload.name.trim(),
      description: payload.description || null,
      type: payload.type,
      value: Number(payload.value),
      min_purchase: Number(payload.min_purchase || 0),
      max_discount: payload.max_discount ? Number(payload.max_discount) : null,
      usage_limit: payload.usage_limit ? Number(payload.usage_limit) : null,
      usage_count: 0,
      is_active: payload.is_active,
      starts_at: payload.starts_at || null,
      expires_at: payload.expires_at || null,
    });

    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Tambah Promo",
      entity_type: "promotion",
      description: `Menambahkan promo "${payload.code.toUpperCase().trim()}"`,
      metadata: { code: payload.code.toUpperCase().trim(), type: payload.type, value: Number(payload.value) },
    });

    return { success: true };
  },

  /** Perbarui promosi */
  async update(id: string, payload: Partial<Omit<DbPromotion, "id" | "created_at" | "updated_at">>): Promise<OperationResult> {
    const client = getBrowserClient();
    const dataToUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (payload.code !== undefined) dataToUpdate.code = payload.code.toUpperCase().trim();
    if (payload.name !== undefined) dataToUpdate.name = payload.name.trim();
    if (payload.description !== undefined) dataToUpdate.description = payload.description || null;
    if (payload.type !== undefined) dataToUpdate.type = payload.type;
    if (payload.value !== undefined) dataToUpdate.value = Number(payload.value);
    if (payload.min_purchase !== undefined) dataToUpdate.min_purchase = Number(payload.min_purchase);
    if (payload.max_discount !== undefined) dataToUpdate.max_discount = payload.max_discount ? Number(payload.max_discount) : null;
    if (payload.usage_limit !== undefined) dataToUpdate.usage_limit = payload.usage_limit ? Number(payload.usage_limit) : null;
    if (payload.is_active !== undefined) dataToUpdate.is_active = payload.is_active;
    if (payload.starts_at !== undefined) dataToUpdate.starts_at = payload.starts_at || null;
    if (payload.expires_at !== undefined) dataToUpdate.expires_at = payload.expires_at || null;

    const { error } = await client.from("promotions").update(dataToUpdate).eq("id", id);
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Edit Promo",
      entity_type: "promotion",
      entity_id: id,
      description: `Memperbarui promo dengan ID: ${id}`,
      metadata: { promotion_id: id },
    });

    return { success: true };
  },

  /** Toggle status aktif */
  async toggleActive(id: string, isActive: boolean): Promise<OperationResult> {
    const client = getBrowserClient();
    const { error } = await client
      .from("promotions")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /**
   * Hapus promosi.
   * Jika promo memiliki banner, hapus banner terlebih dahulu (cegah orphan).
   * Tidak perlu FK — relasi dikelola secara manual via promo_code.
   */
  async delete(id: string, promoCode?: string): Promise<OperationResult> {
    // Hapus banner terkait jika promoCode disediakan
    if (promoCode) {
      const banner = await getBannerByPromoCode(promoCode);
      if (banner) {
        await deletePromoBanner(banner.id, banner.image_url);
      }
    }

    const { error } = await getBrowserClient().from("promotions").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Hapus Promo",
      entity_type: "promotion",
      entity_id: id,
      description: `Menghapus promo dengan ID: ${id}`,
      metadata: { promotion_id: id },
    });

    return { success: true };
  },
};
