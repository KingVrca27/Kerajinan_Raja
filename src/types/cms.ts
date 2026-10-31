/**
 * @file src/types/cms.ts
 *
 * Definisi tipe TypeScript (camelCase, frontend) untuk seluruh entitas CMS Website.
 *
 * KONVENSI:
 *   - Tipe "Db*" (snake_case) → hanya di cmsRepository.ts
 *   - Tipe di sini (camelCase) → digunakan oleh komponen UI admin
 *
 * ENTITAS:
 *   - HeroBanner        → halaman banner/page.tsx
 *   - AboutSection      → halaman tentang/page.tsx
 *   - FaqItem           → halaman faq/page.tsx
 *   - StoreSettings     → halaman info/page.tsx
 *   - SocialSettings    → halaman sosial/page.tsx
 *   - BrandingSettings  → halaman branding/page.tsx
 *   - SeoSettings       → halaman seo/page.tsx
 *   - HomepageSettings  → halaman homepage/page.tsx
 *   - MediaFile         → halaman media/page.tsx
 */

// =============================================================================
// A. HERO BANNER
// =============================================================================

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  displayOrder: number;
  isActive: boolean;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HeroBannerFormData {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  displayOrder: number;
  isActive: boolean;
  scheduleStart: string;
  scheduleEnd: string;
}

// =============================================================================
// B. TENTANG KAMI
// =============================================================================

export type AboutSectionKey =
  | "hero"
  | "story"
  | "vision"
  | "mission";

export const ABOUT_SECTION_LABELS: Record<AboutSectionKey, string> = {
  hero:    "Judul & Deskripsi Utama",
  story:   "Sejarah Singkat",
  vision:  "Visi",
  mission: "Misi",
};

export interface AboutSection {
  section: AboutSectionKey;
  title: string;
  content: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
}

// =============================================================================
// C. FAQ
// =============================================================================

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FaqFormData {
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
}

// =============================================================================
// D. INFORMASI TOKO
// =============================================================================

export interface StoreSettings {
  storeName: string;
  storeSlogan: string;
  storeDescription: string;
  storeWhatsapp: string;
  storeEmail: string;
  storeHours: string;
  storeAddress: string;
  storeKecamatan: string;
  storeKabupaten: string;
  storeProvinsi: string;
  storeKodePos: string;
  storeGmapsEmbed: string;
}

// =============================================================================
// E. MEDIA SOSIAL
// =============================================================================

export interface SocialPlatform {
  key: string;
  label: string;
  placeholder: string;
  icon: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: "social_facebook",  label: "Facebook",  placeholder: "https://facebook.com/...",  icon: "facebook"  },
  { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/...", icon: "instagram" },
  { key: "social_tiktok",    label: "TikTok",    placeholder: "https://tiktok.com/@...",   icon: "tiktok"    },
  { key: "social_youtube",   label: "YouTube",   placeholder: "https://youtube.com/...",   icon: "youtube"   },
  { key: "social_shopee",    label: "Shopee",    placeholder: "https://shopee.co.id/...",  icon: "shopee"    },
  { key: "social_tokopedia", label: "Tokopedia", placeholder: "https://tokopedia.com/...", icon: "tokopedia" },
];

export interface SocialSettings {
  social_facebook:  string;
  social_instagram: string;
  social_tiktok:    string;
  social_youtube:   string;
  social_shopee:    string;
  social_tokopedia: string;
  // active flags
  social_facebook_active:  string; // "true" | "false"
  social_instagram_active: string;
  social_tiktok_active:    string;
  social_youtube_active:   string;
  social_shopee_active:    string;
  social_tokopedia_active: string;
}

// =============================================================================
// F. BRANDING
// =============================================================================

export interface BrandingSettings {
  logoHeaderUrl: string;
  logoFooterUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
}

// =============================================================================
// G. SEO
// =============================================================================

export interface SeoSettings {
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoMetaKeywords: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
}

// =============================================================================
// H. HOMEPAGE SETTINGS
// =============================================================================

export interface HomepageSettings {
  featuredCount: number;
  newCount: number;
  faqCount: number;
  testimonialCount: number;
}

// =============================================================================
// I. MEDIA LIBRARY
// =============================================================================

export interface MediaFile {
  name: string;
  path: string;
  publicUrl: string;
  size: number;
  contentType: string;
  lastModified: string;
  folder: string;
}

// =============================================================================
// SHARED — OPERATION RESULT
// =============================================================================

export interface CmsResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}
