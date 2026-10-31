/**
 * @file src/lib/cmsRepository.ts
 *
 * Repository tunggal untuk semua operasi CMS Website di Supabase PostgreSQL.
 *
 * CAKUPAN:
 *   - Hero Banners   → tabel hero_banners
 *   - Tentang Kami   → tabel about
 *   - FAQ            → tabel faq
 *   - Site Settings  → tabel site_settings (key-value store)
 *   - Upload CMS     → Supabase Storage bucket: cms-assets
 *
 * ATURAN:
 *   - Tidak ada query Supabase langsung dari komponen UI.
 *   - Semua operasi CMS WAJIB melalui file ini.
 */

import { supabase as defaultSupabase } from "@/src/lib/supabase";
import { createClient as createBrowserClient } from "@/src/lib/supabaseBrowser";

let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;
const getSupabase = () => {
  if (typeof window === "undefined") {
    return defaultSupabase;
  }
  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient();
  }
  return browserClientInstance;
};
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import { validateImageFile } from "@/src/lib/imageRepository";

// =============================================================================
// CONSTANTS
// =============================================================================

const CMS_BUCKET = "Gambar_Banner";

// =============================================================================
// DB TYPES (internal)
// =============================================================================

export interface DbHeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  sort_order: number;
  schedule_start: string | null;
  schedule_end: string | null;
  type: "hero" | "promo";
  promo_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAboutSection {
  id: string;
  section: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbFaq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbSiteSetting {
  id: string;
  key: string;
  value: string | null;
  label: string | null;
  description: string | null;
  type: "text" | "number" | "boolean" | "json" | "image" | "color";
  created_at: string;
  updated_at: string;
}

// =============================================================================
// OPERATION RESULT
// =============================================================================

export interface CmsOperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// =============================================================================
// HELPER: GENERATE UNIQUE FILENAME
// =============================================================================

function generateCmsFileName(originalName: string, folder: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${folder}/${timestamp}-${random}.${ext}`;
}

// =============================================================================
// CMS STORAGE UPLOAD
// =============================================================================

/**
 * Upload file gambar ke Supabase Storage bucket `cms-assets`.
 *
 * @param file - File gambar
 * @param folder - Subfolder: 'banners' | 'about' | 'branding' | 'media'
 * @returns URL publik gambar, atau null jika gagal
 */
export async function uploadCmsImage(
  file: File,
  folder: "banners" | "about" | "branding" | "media"
): Promise<{ url: string; path: string } | null> {
  const validationError = validateImageFile(file);
  if (validationError) {
    console.error("[cmsRepository.uploadCmsImage]", validationError);
    return null;
  }

  const path = generateCmsFileName(file.name, folder);

  const { error } = await getSupabase().storage
    .from(CMS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (error) {
    console.error("[cmsRepository.uploadCmsImage] Upload error:", error.message);
    return null;
  }

  const {
    data: { publicUrl },
  } = getSupabase().storage.from(CMS_BUCKET).getPublicUrl(path);

  return { url: publicUrl, path };
}

/**
 * Hapus file dari cms-assets Storage berdasarkan URL publik.
 */
export async function deleteCmsImageByUrl(imageUrl: string): Promise<void> {
  const pathMatch = imageUrl.match(/\/storage\/v1\/object\/public\/Gambar_Banner\/(.+)$/);
  if (!pathMatch?.[1]) return;
  const path = decodeURIComponent(pathMatch[1]);
  await getSupabase().storage.from(CMS_BUCKET).remove([path]);
}

// =============================================================================
// HERO BANNERS
// =============================================================================

export const heroBannerRepository = {
  /** Semua banner (admin), diurutkan sort_order ASC */
  async getAll(): Promise<DbHeroBanner[]> {
    const { data, error } = await getSupabase()
      .from("hero_banners")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[heroBannerRepository.getAll]", error.message);
      return [];
    }
    return data ?? [];
  },

  /** Hanya banner aktif (website) */
  async getActive(): Promise<DbHeroBanner[]> {
    const { data, error } = await getSupabase()
      .from("hero_banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("[heroBannerRepository.getActive]", error.message);
      return [];
    }
    return data ?? [];
  },

  /** Ambil semua banner untuk homepage (Hero + Promo valid) */
  async getActiveHomepageBanners(): Promise<DbHeroBanner[]> {
    const { data: banners, error: bannersError } = await getSupabase()
      .from("hero_banners")
      .select("*")
      .eq("is_active", true);

    if (bannersError) {
      console.error("[heroBannerRepository.getActiveHomepageBanners]", bannersError.message);
      return [];
    }

    if (!banners || banners.length === 0) return [];

    const now = new Date();

    // Filter by schedule
    const scheduleValidBanners = banners.filter(b => {
      if (b.schedule_start) {
        if (new Date(b.schedule_start) > now) return false;
      }
      if (b.schedule_end) {
        if (new Date(b.schedule_end) < now) return false;
      }
      return true;
    });

    const heroBanners = scheduleValidBanners.filter(b => b.type === 'hero');
    const maybePromoBanners = scheduleValidBanners.filter(b => b.type === 'promo' && b.promo_code);

    let validPromoBanners: DbHeroBanner[] = [];

    if (maybePromoBanners.length > 0) {
      const promoCodes = maybePromoBanners.map(b => b.promo_code!);
      
      // Query valid promotions
      let promoClient = getSupabase();
      if (typeof window === "undefined") {
        const { supabaseAdmin } = await import("@/src/lib/supabaseAdmin");
        promoClient = supabaseAdmin;
      }

      const { data: promotions, error: promoError } = await promoClient
        .from("promotions")
        .select("code, is_active, starts_at, expires_at")
        .in("code", promoCodes)
        .eq("is_active", true);

      if (!promoError && promotions) {
        const promoMap = new Map(promotions.map(p => [p.code, p]));
        
        validPromoBanners = maybePromoBanners.filter(b => {
          const p = promoMap.get(b.promo_code!);
          if (!p) return false;
          if (!p.is_active) return false;
          
          if (p.starts_at && new Date(p.starts_at) > now) return false;
          if (p.expires_at && new Date(p.expires_at) < now) return false;
          
          return true;
        });
      }
    }

    const combined = [...heroBanners, ...validPromoBanners];

    // Sort by sort_order ASC, then created_at DESC as tie breaker
    combined.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return combined;
  },

  async create(
    data: Omit<DbHeroBanner, "id" | "created_at" | "updated_at">
  ): Promise<CmsOperationResult> {
    const { error } = await getSupabase().from("hero_banners").insert({
      ...data,
      updated_at: new Date().toISOString(),
    });
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Tambah Banner",
      entity_type: "banner",
      description: `Menambahkan hero banner: ${data.title}`,
      metadata: { title: data.title },
    });

    return { success: true };
  },

  async update(
    id: string,
    data: Partial<Omit<DbHeroBanner, "id" | "created_at" | "updated_at">>
  ): Promise<CmsOperationResult> {
    const { error } = await getSupabase()
      .from("hero_banners")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Edit Banner",
      entity_type: "banner",
      entity_id: id,
      description: `Memperbarui hero banner ID ${id}`,
      metadata: { banner_id: id, updated_data: data.title },
    });

    return { success: true };
  },

  async delete(id: string): Promise<CmsOperationResult> {
    const { error } = await getSupabase().from("hero_banners").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Hapus Banner",
      entity_type: "banner",
      entity_id: id,
      description: `Menghapus hero banner ID ${id}`,
      metadata: { banner_id: id },
    });

    return { success: true };
  },

  async toggleStatus(id: string, isActive: boolean): Promise<CmsOperationResult> {
    const { error } = await getSupabase()
      .from("hero_banners")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Toggle Banner",
      entity_type: "banner",
      entity_id: id,
      description: isActive ? `Mengaktifkan hero banner ID ${id}` : `Menonaktifkan hero banner ID ${id}`,
      metadata: { banner_id: id, is_active: isActive },
    });

    return { success: true };
  },
};

// =============================================================================
// ABOUT SECTIONS
// =============================================================================

export const aboutRepository = {
  /** Semua section Tentang Kami */
  async getAll(): Promise<DbAboutSection[]> {
    const { data, error } = await getSupabase()
      .from("about")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("[aboutRepository.getAll]", error.message);
      return [];
    }
    return data ?? [];
  },

  /** Ambil satu section berdasarkan key section */
  async getBySection(section: string): Promise<DbAboutSection | null> {
    const { data, error } = await getSupabase()
      .from("about")
      .select("*")
      .eq("section", section)
      .maybeSingle();
    if (error) return null;
    return data;
  },

  /**
   * Simpan atau perbarui satu section (UPSERT by section key).
   * Jika section belum ada → INSERT; jika sudah ada → UPDATE.
   */
  async upsertSection(
    section: string,
    data: { title?: string; content?: string; image_url?: string; sort_order?: number; is_active?: boolean }
  ): Promise<CmsOperationResult> {
    const { error } = await getSupabase().from("about").upsert(
      {
        section,
        title: data.title ?? null,
        content: data.content ?? null,
        image_url: data.image_url ?? null,
        sort_order: data.sort_order ?? 0,
        is_active: data.is_active ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "section" }
    );
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Update About",
      entity_type: "cms",
      description: `Memperbarui konten bagian "Tentang Kami" (section: ${section})`,
      metadata: { section },
    });

    return { success: true };
  },
};

// =============================================================================
// FAQ
// =============================================================================

export const faqRepository = {
  /** Semua FAQ (admin) diurutkan sort_order ASC */
  async getAll(): Promise<DbFaq[]> {
    const { data, error } = await getSupabase()
      .from("faq")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[faqRepository.getAll]", error.message);
      return [];
    }
    return data ?? [];
  },

  /** Hanya FAQ aktif (website) */
  async getActive(): Promise<DbFaq[]> {
    const { data, error } = await getSupabase()
      .from("faq")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("[faqRepository.getActive]", error.message);
      return [];
    }
    return data ?? [];
  },

  async create(data: { question: string; answer: string; category?: string; sort_order?: number; is_active?: boolean }): Promise<CmsOperationResult> {
    const { error } = await getSupabase().from("faq").insert({
      question: data.question.trim(),
      answer: data.answer.trim(),
      category: data.category?.trim() || null,
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
    });
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Tambah FAQ",
      entity_type: "cms",
      description: `Menambahkan FAQ baru`,
    });

    return { success: true };
  },

  async update(
    id: string,
    data: { question?: string; answer?: string; category?: string | null; sort_order?: number; is_active?: boolean }
  ): Promise<CmsOperationResult> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.question !== undefined) payload.question = data.question.trim();
    if (data.answer !== undefined) payload.answer = data.answer.trim();
    if (data.category !== undefined) payload.category = data.category?.trim() || null;
    if (data.sort_order !== undefined) payload.sort_order = data.sort_order;
    if (data.is_active !== undefined) payload.is_active = data.is_active;

    const { error } = await getSupabase().from("faq").update(payload).eq("id", id);
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Edit FAQ",
      entity_type: "cms",
      entity_id: id,
      description: `Memperbarui FAQ ID ${id}`,
    });

    return { success: true };
  },

  async delete(id: string): Promise<CmsOperationResult> {
    const { error } = await getSupabase().from("faq").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Hapus FAQ",
      entity_type: "cms",
      entity_id: id,
      description: `Menghapus FAQ ID ${id}`,
    });

    return { success: true };
  },

  async toggleStatus(id: string, isActive: boolean): Promise<CmsOperationResult> {
    const { error } = await getSupabase()
      .from("faq")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Edit FAQ",
      entity_type: "cms",
      entity_id: id,
      description: isActive ? `Mengaktifkan FAQ ID ${id}` : `Menonaktifkan FAQ ID ${id}`,
    });

    return { success: true };
  },
};

// =============================================================================
// SITE SETTINGS (key-value store)
// =============================================================================

export const siteSettingsRepository = {
  /**
   * Ambil nilai satu setting berdasarkan key.
   * @returns nilai string, atau null jika belum diset
   */
  async getSetting(key: string): Promise<string | null> {
    const { data, error } = await getSupabase()
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return null;
    return data.value ?? null;
  },

  /**
   * Ambil banyak setting sekaligus berdasarkan array key.
   * @returns Record<key, value> — key yang belum diset akan bernilai ""
   */
  async getSettings(keys: string[]): Promise<Record<string, string>> {
    const { data, error } = await getSupabase()
      .from("site_settings")
      .select("key, value")
      .in("key", keys);

    if (error || !data) {
      return Object.fromEntries(keys.map((k) => [k, ""]));
    }

    const result: Record<string, string> = Object.fromEntries(keys.map((k) => [k, ""]));
    for (const row of data) {
      result[row.key] = row.value ?? "";
    }
    return result;
  },

  /**
   * Simpan atau perbarui satu setting (UPSERT by key).
   */
  async setSetting(
    key: string,
    value: string,
    label?: string,
    type: DbSiteSetting["type"] = "text"
  ): Promise<CmsOperationResult> {
    const { error } = await getSupabase().from("site_settings").upsert(
      {
        key,
        value,
        label: label ?? key,
        type,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Update Site Settings",
      entity_type: "settings",
      description: `Memperbarui pengaturan situs (key: ${key})`,
      metadata: { setting_key: key },
    });

    return { success: true };
  },

  /**
   * Simpan banyak setting sekaligus (batch upsert).
   * @param data - Record<key, value>
   * @param meta - Optional metadata per key: { label, type }
   */
  async setSettings(
    data: Record<string, string>,
    meta?: Record<string, { label?: string; type?: DbSiteSetting["type"] }>
  ): Promise<CmsOperationResult> {
    const rows = Object.entries(data).map(([key, value]) => ({
      key,
      value,
      label: meta?.[key]?.label ?? key,
      type: meta?.[key]?.type ?? "text",
      updated_at: new Date().toISOString(),
    }));

    const { error } = await getSupabase()
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) return { success: false, error: error.message };

    const keys = Object.keys(data);
    await activityLogRepository.logActivity({
      action: "Update Site Settings",
      entity_type: "settings",
      description: `Memperbarui ${keys.length} pengaturan situs secara massal`,
      metadata: { keys },
    });

    return { success: true };
  },

  /** Ambil semua settings (untuk debugging / export) */
  async getAll(): Promise<DbSiteSetting[]> {
    const { data, error } = await getSupabase()
      .from("site_settings")
      .select("*")
      .order("key", { ascending: true });
    if (error) return [];
    return data ?? [];
  },
};

// =============================================================================
// SITE SETTINGS KEYS CONSTANTS
// =============================================================================

/** Kunci `site_settings` yang digunakan oleh CMS */
export const SETTINGS_KEYS = {
  // Informasi Toko
  STORE_NAME:        "store_name",
  STORE_SLOGAN:      "store_slogan",
  STORE_DESCRIPTION: "store_description",
  STORE_WHATSAPP:    "store_whatsapp",
  STORE_EMAIL:       "store_email",
  STORE_HOURS:       "store_hours",
  STORE_ADDRESS:     "store_address",
  STORE_KECAMATAN:   "store_kecamatan",
  STORE_KABUPATEN:   "store_kabupaten",
  STORE_PROVINSI:    "store_provinsi",
  STORE_KODE_POS:    "store_kode_pos",
  STORE_GMAPS:       "store_gmaps_embed",

  // Media Sosial
  SOCIAL_INSTAGRAM:  "social_instagram",
  SOCIAL_FACEBOOK:   "social_facebook",
  SOCIAL_TIKTOK:     "social_tiktok",
  SOCIAL_YOUTUBE:    "social_youtube",
  SOCIAL_SHOPEE:     "social_shopee",
  SOCIAL_TOKOPEDIA:  "social_tokopedia",

  // Branding
  LOGO_HEADER:       "logo_header_url",
  LOGO_FOOTER:       "logo_footer_url",
  LOGO_ADMIN:        "logo_admin_url",
  FAVICON:           "favicon_url",
  OG_IMAGE:          "og_image_url",

  // SEO
  SEO_TITLE:         "seo_meta_title",
  SEO_DESCRIPTION:   "seo_meta_description",
  SEO_KEYWORDS:      "seo_meta_keywords",
  GOOGLE_VERIFY:     "google_site_verification",
  BING_VERIFY:       "bing_site_verification",

  // Homepage
  HP_FEATURED_COUNT: "homepage_featured_count",
  HP_NEW_COUNT:      "homepage_new_count",
  HP_FAQ_COUNT:      "homepage_faq_count",
  HP_TESTIMONIAL_COUNT: "homepage_testimonial_count",
} as const;

export type SettingsKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS];

// =============================================================================
// MEDIA LIBRARY
// =============================================================================

export interface DbMediaFile {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: {
    size?: number;
    mimetype?: string;
    cacheControl?: string;
  } | null;
}

/** Folder-folder yang ada di bucket cms-assets */
export type CmsFolder = "banners" | "about" | "branding" | "media";

export const mediaLibraryRepository = {
  /**
   * Ambil daftar semua file di bucket cms-assets.
   * Jika folder disediakan, hanya file dalam folder tersebut.
   */
  async listAll(folder?: CmsFolder): Promise<DbMediaFile[]> {
    const path = folder ?? "";
    const { data, error } = await getSupabase().storage
      .from(CMS_BUCKET)
      .list(path, { limit: 500, sortBy: { column: "created_at", order: "desc" } });
    if (error) {
      console.error("[mediaLibraryRepository.listAll]", error.message);
      return [];
    }
    // Filter hanya file (bukan folder — folder tidak memiliki id atau metadata)
    return (data ?? []).filter((f) => f.id !== null);
  },

  /** Hapus file berdasarkan path relatif di dalam bucket */
  async deleteByPath(path: string): Promise<CmsOperationResult> {
    const { error } = await getSupabase().storage.from(CMS_BUCKET).remove([path]);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /** Ambil public URL untuk sebuah path file */
  getPublicUrl(path: string): string {
    const { data } = getSupabase().storage.from(CMS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },
};

