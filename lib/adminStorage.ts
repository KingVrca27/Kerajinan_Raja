import { Product } from "@/src/types/product";
import { Category } from "@/src/types/category";
import { TestimonialItem } from "@/src/constants/testimonials";
import { FAQItemData } from "@/src/constants/faq";
import { SITE_CONFIG } from "@/src/constants/site";

import PRODUCTS from "@/src/constants/products";
import CATEGORIES from "@/src/constants/categories";
import TESTIMONIAL_CONTENT from "@/src/constants/testimonials";
import FAQ_CONTENT from "@/src/constants/faq";

/** Key localStorage untuk penyimpanan data Admin Dashboard */
export const STORAGE_KEYS = {
  PRODUCTS: "kerajinan-raja-admin-products",
  CATEGORIES: "kerajinan-raja-admin-categories",
  TESTIMONIALS: "kerajinan-raja-admin-testimonials",
  FAQS: "kerajinan-raja-admin-faqs",
  SITE_INFO: "kerajinan-raja-admin-site-info",
} as const;

/** Interface tipe data Informasi Website */
export interface SiteInfoData {
  name: string;
  tagline: string;
  description: string;
  address: string;
  whatsappNumber: string;
  whatsappFormatted: string;
  whatsappClean: string;
  contactEmail: string;
  operationalHours: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  googleMapsUrl: string;
}

/**
 * Helper utilitas penyimpan data Admin Dashboard (`adminStorage`).
 *
 * Menggunakan `localStorage` sebagai database sementara berbasis `Promise` (async/await).
 * Struktur dibuat terisolasi sehingga jika di kemudian hari ingin dipindahkan ke backend
 * seperti Supabase, Firebase, Appwrite, atau PostgreSQL, cukup mengubah implementasi
 * di dalam file ini tanpa mengubah komponen UI admin.
 */
export const adminStorage = {
  // ==========================================
  // 1. PRODUK (PRODUCTS)
  // ==========================================

  /**
   * Mengambil seluruh daftar produk dari localStorage atau fallback ke data awal.
   */
  async getProducts(): Promise<Product[]> {
    if (typeof window === "undefined") return PRODUCTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(PRODUCTS));
      return PRODUCTS;
    } catch (error) {
      console.error("Gagal membaca data produk dari storage:", error);
      return PRODUCTS;
    }
  },

  /**
   * Menyimpan atau memperbarui satu objek produk.
   */
  async saveProduct(product: Product): Promise<Product[]> {
    const current = await this.getProducts();
    const index = current.findIndex((p) => p.id === product.id);

    let updated: Product[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = product;
    } else {
      updated = [product, ...current];
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    }
    return updated;
  },

  /**
   * Menghapus produk berdasarkan ID unik.
   */
  async deleteProduct(id: string): Promise<Product[]> {
    const current = await this.getProducts();
    const updated = current.filter((p) => p.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    }
    return updated;
  },

  // ==========================================
  // 2. KATEGORI (CATEGORIES)
  // ==========================================

  /**
   * Mengambil seluruh daftar kategori.
   */
  async getCategories(): Promise<Category[]> {
    if (typeof window === "undefined") return CATEGORIES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(CATEGORIES));
      return CATEGORIES;
    } catch (error) {
      console.error("Gagal membaca data kategori dari storage:", error);
      return CATEGORIES;
    }
  },

  /**
   * Menyimpan atau memperbarui objek kategori.
   */
  async saveCategory(category: Category): Promise<Category[]> {
    const current = await this.getCategories();
    const index = current.findIndex((c) => c.id === category.id);

    let updated: Category[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = category;
    } else {
      updated = [...current, category];
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    }
    return updated;
  },

  /**
   * Menghapus kategori berdasarkan ID unik.
   */
  async deleteCategory(id: string): Promise<Category[]> {
    const current = await this.getCategories();
    const updated = current.filter((c) => c.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    }
    return updated;
  },

  // ==========================================
  // 3. TESTIMONI (TESTIMONIALS)
  // ==========================================

  /**
   * Mengambil seluruh daftar testimoni.
   */
  async getTestimonials(): Promise<TestimonialItem[]> {
    if (typeof window === "undefined") return TESTIMONIAL_CONTENT.items;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TESTIMONIALS);
      if (data) return JSON.parse(data);
      localStorage.setItem(
        STORAGE_KEYS.TESTIMONIALS,
        JSON.stringify(TESTIMONIAL_CONTENT.items)
      );
      return TESTIMONIAL_CONTENT.items;
    } catch (error) {
      console.error("Gagal membaca data testimoni dari storage:", error);
      return TESTIMONIAL_CONTENT.items;
    }
  },

  /**
   * Menyimpan atau memperbarui item testimoni.
   */
  async saveTestimonial(testimonial: TestimonialItem): Promise<TestimonialItem[]> {
    const current = await this.getTestimonials();
    const index = current.findIndex((t) => t.id === testimonial.id);

    let updated: TestimonialItem[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = testimonial;
    } else {
      updated = [testimonial, ...current];
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(updated));
    }
    return updated;
  },

  /**
   * Menghapus testimoni berdasarkan ID unik.
   */
  async deleteTestimonial(id: string): Promise<TestimonialItem[]> {
    const current = await this.getTestimonials();
    const updated = current.filter((t) => t.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(updated));
    }
    return updated;
  },

  // ==========================================
  // 4. FAQ (PERTANYAAN UMUM)
  // ==========================================

  /**
   * Mengambil seluruh daftar FAQ.
   */
  async getFAQs(): Promise<FAQItemData[]> {
    if (typeof window === "undefined") return FAQ_CONTENT.items;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAQS);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(FAQ_CONTENT.items));
      return FAQ_CONTENT.items;
    } catch (error) {
      console.error("Gagal membaca data FAQ dari storage:", error);
      return FAQ_CONTENT.items;
    }
  },

  /**
   * Menyimpan atau memperbarui item FAQ.
   */
  async saveFAQ(faq: FAQItemData): Promise<FAQItemData[]> {
    const current = await this.getFAQs();
    const index = current.findIndex((f) => f.id === faq.id);

    let updated: FAQItemData[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = faq;
    } else {
      updated = [...current, faq];
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(updated));
    }
    return updated;
  },

  /**
   * Menghapus item FAQ berdasarkan ID unik.
   */
  async deleteFAQ(id: string): Promise<FAQItemData[]> {
    const current = await this.getFAQs();
    const updated = current.filter((f) => f.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(updated));
    }
    return updated;
  },

  // ==========================================
  // 5. INFORMASI WEBSITE (SITE INFO)
  // ==========================================

  /**
   * Mengambil informasi dasar website.
   */
  async getSiteInfo(): Promise<SiteInfoData> {
    const fallback: SiteInfoData = {
      name: SITE_CONFIG.name,
      tagline: SITE_CONFIG.tagline,
      description: SITE_CONFIG.description,
      address: SITE_CONFIG.address,
      whatsappNumber: SITE_CONFIG.whatsappNumber,
      whatsappFormatted: SITE_CONFIG.whatsappFormatted,
      whatsappClean: SITE_CONFIG.whatsappClean,
      contactEmail: SITE_CONFIG.contactEmail,
      operationalHours: SITE_CONFIG.operationalHours,
      instagram: SITE_CONFIG.socials.instagram,
      facebook: SITE_CONFIG.socials.facebook,
      tiktok: SITE_CONFIG.socials.tiktok,
      youtube: SITE_CONFIG.socials.youtube,
      googleMapsUrl: SITE_CONFIG.googleMapsUrl,
    };

    if (typeof window === "undefined") return fallback;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SITE_INFO);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.SITE_INFO, JSON.stringify(fallback));
      return fallback;
    } catch (error) {
      console.error("Gagal membaca data informasi website dari storage:", error);
      return fallback;
    }
  },

  /**
   * Menyimpan pembaruan informasi website.
   */
  async saveSiteInfo(info: SiteInfoData): Promise<SiteInfoData> {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.SITE_INFO, JSON.stringify(info));
    }
    return info;
  },
};

export default adminStorage;
