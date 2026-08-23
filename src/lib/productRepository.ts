/**
 * @file src/lib/productRepository.ts
 *
 * Product Repository — Satu-satunya pintu akses data produk dari Supabase.
 *
 * ARSITEKTUR:
 *   Supabase PostgreSQL
 *       ↓  (SQL query dengan JOIN)
 *   DbProductWithRelations  ← tipe raw database (src/types/database.ts)
 *       ↓  (mapper: mapDbProductToProduct)
 *   Product                 ← model frontend (src/types/product.ts)
 *       ↓  (dikonsumsi oleh)
 *   Komponen UI (ProductCard, ProductGrid, dll.)
 *
 * ATURAN PENGGUNAAN:
 *   - Komponen UI TIDAK boleh import dari @supabase/supabase-js secara langsung.
 *   - Seluruh akses data produk harus melalui `productRepository`.
 *   - Untuk penggunaan di Server Component (Next.js App Router): gunakan await langsung.
 *   - Untuk penggunaan di Client Component: gunakan useEffect + useState atau hook khusus.
 *
 * YANG BELUM DIIMPLEMENTASIKAN (akan ditambahkan pada fase berikutnya):
 *   - rating / average_rating  → akan dihitung dari tabel `reviews`
 *   - reviewCount              → akan dihitung COUNT dari tabel `reviews`
 *   - isBestSeller             → akan dihitung dari tabel `order_items`
 */

import { supabase } from "@/src/lib/supabase";
import type { Product } from "@/src/types/product";
import type {
  DbProductWithRelations,
  DbProductImage,
} from "@/src/types/database";

// =============================================================================
// KONSTANTA KONFIGURASI REPOSITORY
// =============================================================================

/** Path gambar placeholder jika produk belum memiliki gambar di Storage. */
const PLACEHOLDER_IMAGE = "/products/product-placeholder.jpg";

/**
 * Jumlah hari sejak produk dibuat agar dianggap sebagai "Produk Baru".
 * Nilai 30 berarti produk yang ditambahkan dalam 30 hari terakhir = isNew: true.
 */
const NEW_PRODUCT_THRESHOLD_DAYS = 30;

/** Jumlah maksimal produk terkait yang dikembalikan secara default. */
const DEFAULT_RELATED_LIMIT = 4;

// =============================================================================
// KOLOM SELECT (dengan JOIN ke categories dan product_images)
// =============================================================================

/**
 * String kolom SELECT yang digunakan pada setiap query produk.
 *
 * Mencakup:
 *   - Seluruh kolom tabel products
 *   - JOIN categories (via FK products_category_fk)
 *   - JOIN product_images (one-to-many via product_id)
 *
 * Format sesuai PostgREST / Supabase JS v2 Embedded Resources syntax.
 */
const PRODUCT_SELECT = `
  id,
  category_id,
  name,
  slug,
  short_description,
  description,
  price,
  discount_price,
  stock,
  minimum_stock,
  weight_gram,
  length_cm,
  width_cm,
  height_cm,
  sku,
  status,
  is_featured,
  is_active,
  display_order,
  meta_title,
  meta_description,
  created_at,
  updated_at,
  categories (
    id,
    name,
    slug,
    description,
    image_url,
    is_active,
    sort_order
  ),
  product_images (
    id,
    image_url,
    alt_text,
    sort_order,
    is_primary
  ),
  reviews (
    rating,
    is_approved
  )
`;

// =============================================================================
// DATA MAPPER — Database Row → Frontend Model
// =============================================================================

/**
 * Menentukan URL gambar utama dari array product_images.
 *
 * Prioritas resolusi:
 *   1. Gambar dengan `is_primary = true`
 *   2. Gambar pertama berdasarkan `sort_order` terkecil
 *   3. Placeholder jika tidak ada gambar sama sekali
 *
 * @param images - Array DbProductImage dari hasil JOIN
 * @returns URL string gambar utama
 */
function resolvePrimaryImage(images: DbProductImage[]): string {
  if (!images || images.length === 0) return PLACEHOLDER_IMAGE;

  // Prioritas 1: gambar yang ditandai is_primary
  const primary = images.find((img) => img.is_primary);
  if (primary?.image_url) return primary.image_url;

  // Prioritas 2: gambar pertama berdasarkan sort_order
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0]?.image_url ?? PLACEHOLDER_IMAGE;
}

/**
 * Mengambil seluruh URL gambar dari product_images, diurutkan by sort_order.
 * Jika tidak ada gambar, kembalikan array satu elemen berisi placeholder.
 *
 * @param images - Array DbProductImage dari hasil JOIN
 * @returns Array URL string untuk galeri gambar produk
 */
function resolveImageGallery(images: DbProductImage[]): string[] {
  if (!images || images.length === 0) return [PLACEHOLDER_IMAGE];
  return [...images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.image_url)
    .filter(Boolean); // hapus URL kosong/null
}

/**
 * Menentukan apakah produk tergolong "Baru" berdasarkan tanggal pembuatan.
 * Produk dianggap baru jika dibuat dalam NEW_PRODUCT_THRESHOLD_DAYS hari terakhir.
 *
 * Menggunakan `created_at` dari database sebagai sumber kebenaran,
 * bukan flag boolean statis seperti sebelumnya.
 *
 * @param createdAt - ISO string timestamp dari kolom created_at
 * @returns true jika produk tergolong baru
 */
function resolveIsNew(createdAt: string): boolean {
  if (!createdAt) return false;
  try {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= NEW_PRODUCT_THRESHOLD_DAYS;
  } catch {
    return false;
  }
}

/**
 * Memformat dimensi produk (length, width, height) menjadi string tampilan.
 *
 * Format output: "30cm x 25cm x 10cm"
 * Jika hanya sebagian dimensi tersedia, hanya dimensi yang ada yang ditampilkan.
 * Mengembalikan undefined jika tidak ada data dimensi sama sekali.
 *
 * @param lengthCm - Panjang dalam cm (nullable)
 * @param widthCm  - Lebar dalam cm (nullable)
 * @param heightCm - Tinggi dalam cm (nullable)
 * @returns String dimensi yang terformat, atau undefined
 */
function resolveDimensions(
  lengthCm: number | null,
  widthCm: number | null,
  heightCm: number | null
): string | undefined {
  const parts: string[] = [];
  if (lengthCm != null && lengthCm >= 0) parts.push(`${lengthCm}cm`);
  if (widthCm != null && widthCm >= 0) parts.push(`${widthCm}cm`);
  if (heightCm != null && heightCm >= 0) parts.push(`${heightCm}cm`);
  return parts.length > 0 ? parts.join(" x ") : undefined;
}

/**
 * Memformat berat produk dari integer gram menjadi string tampilan.
 *
 * Format output: "1500g"
 * Mengembalikan undefined jika weight_gram adalah null.
 *
 * @param weightGram - Berat dalam gram (nullable)
 * @returns String berat yang terformat, atau undefined
 */
function resolveWeight(weightGram: number | null): string | undefined {
  if (weightGram == null) return undefined;
  return `${weightGram}g`;
}

/**
 * MAPPER UTAMA: Mengubah satu baris database (DbProductWithRelations) menjadi
 * model frontend (Product) yang kompatibel dengan seluruh komponen UI yang ada.
 *
 * Mapping field database → frontend:
 *   DB: id                    → FE: id
 *   DB: slug                  → FE: slug
 *   DB: name                  → FE: name
 *   DB: categories.slug       → FE: category  (string slug, bukan UUID)
 *   DB: price                 → FE: price
 *   DB: description           → FE: description (fallback ke short_description)
 *   DB: product_images        → FE: image (primary), images (gallery array)
 *   DB: stock                 → FE: stock
 *   DB: is_featured           → FE: isFeatured
 *   DB: created_at            → FE: isNew (dihitung dinamis dari tanggal)
 *   DB: length/width/height   → FE: dimensions (string terformat)
 *   DB: weight_gram           → FE: weight (string terformat, mis: "500g")
 *
 * Field yang belum diimplementasikan (default sementara):
 *   FE: rating      → 0       (akan dari tabel reviews - fase berikutnya)
 *   FE: reviewCount → 0       (akan dari tabel reviews - fase berikutnya)
 *   FE: isBestSeller → false  (akan dari tabel order_items - fase berikutnya)
 *   FE: material    → undefined (belum ada kolom material di database)
 *
 * @param row - Baris database dengan relasi yang sudah di-JOIN
 * @returns Objek Product yang siap dikonsumsi komponen UI
 */
function mapDbProductToProduct(row: DbProductWithRelations): Product {
  const approvedReviews = row.reviews?.filter((r) => r.is_approved) || [];
  const reviewCount = approvedReviews.length;
  const rating = reviewCount > 0
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  return {
    // --- Identitas ---
    id:   row.id,
    slug: row.slug,
    name: row.name,

    // --- Kategori ---
    // Menggunakan slug kategori agar kompatibel dengan komponen UI yang ada.
    // Filter dan routing yang ada sudah menggunakan slug (misal: "rotan", "kayu").
    category: row.categories?.slug ?? "",

    // --- Harga ---
    price: Number(row.price),

    // --- Deskripsi ---
    // Mengutamakan description lengkap, fallback ke short_description jika null.
    description: row.description ?? row.short_description ?? "",

    // --- Gambar ---
    image:  resolvePrimaryImage(row.product_images ?? []),
    images: resolveImageGallery(row.product_images ?? []),

    // --- Stok ---
    stock: row.stock,

    // --- Rating & Review ---
    rating:      rating,
    reviewCount: reviewCount,

    // --- Status Flags ---
    isFeatured:   row.is_featured,
    isBestSeller: false,    // BELUM: akan dari query order_items (FASE 4.x Best Seller)
    isNew:        resolveIsNew(row.created_at),

    // --- Spesifikasi Fisik (opsional) ---
    dimensions: resolveDimensions(row.length_cm, row.width_cm, row.height_cm),
    weight:     resolveWeight(row.weight_gram),
    material:   undefined, // Belum ada kolom material di database
  };
}

// =============================================================================
// INTERFACES UNTUK PAGINATION
// =============================================================================

export interface PaginatedProductsResult {
  products: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface ProductQueryParams {
  page: number;
  limit: number;
  category?: string;
  searchKeyword?: string;
  sortBy?: string;
}

// =============================================================================
// BASE QUERY BUILDER
// =============================================================================

/**
 * Membuat base query Supabase untuk produk aktif dengan join lengkap.
 *
 * Base query ini memastikan:
 *   - Hanya produk dengan is_active = true yang diambil
 *   - Hanya produk dengan status = 'active' yang diambil
 *   - Data diurutkan: display_order ASC → created_at DESC (terbaru di atas)
 *   - Selalu menyertakan JOIN categories dan product_images
 *
 * Semua fungsi repository menggunakan helper ini sebagai fondasi
 * agar konsistensi filter tidak terpecah-pecah di setiap fungsi.
 */
function buildBaseQuery() {
  return supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
}

// =============================================================================
// PRODUCT REPOSITORY
// =============================================================================

/**
 * Product Repository — Objek singleton yang menyediakan seluruh operasi
 * baca (read) data produk dari Supabase.
 *
 * Setiap fungsi:
 *   - Bersifat async (Promise-based)
 *   - Memiliki error handling dengan console.error
 *   - Mengembalikan nilai aman (array kosong / null) saat terjadi error
 *   - Tidak melempar exception ke pemanggil (fail-safe)
 */
export const productRepository = {
  // ---------------------------------------------------------------------------
  // getProducts()
  // ---------------------------------------------------------------------------

  /**
   * Mengambil SELURUH produk aktif dari Supabase.
   *
   * Digunakan oleh:
   *   - Halaman katalog produk (/produk)
   *   - Sitemap generator (app/sitemap.ts)
   *   - generateStaticParams untuk halaman detail produk
   *
   * @returns Promise<Product[]> — Array produk. Kosong jika tidak ada atau error.
   */
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await buildBaseQuery();

      if (error) {
        console.error("[productRepository.getProducts] Supabase error:", error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      return (data as unknown as DbProductWithRelations[]).map(mapDbProductToProduct);
    } catch (err) {
      console.error("[productRepository.getProducts] Unexpected error:", err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // getPaginatedProducts()
  // ---------------------------------------------------------------------------

  /**
   * Mengambil produk dengan server-side pagination, filter, dan sorting.
   *
   * @param params Parameter pagination dan filter
   * @returns Promise<PaginatedProductsResult>
   */
  async getPaginatedProducts(params: ProductQueryParams): Promise<PaginatedProductsResult> {
    const { page, limit, category, searchKeyword, sortBy } = params;

    try {
      let query = supabase
        .from("products")
        .select(PRODUCT_SELECT, { count: "exact" })
        .eq("is_active", true)
        .eq("status", "active");

      // 1. Filter Category
      if (category && category !== "all") {
        // Cari category_id terlebih dahulu
        const { data: catData, error: catError } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", category)
          .single();

        if (catError || !catData) {
          // Kategori tidak ditemukan
          return { products: [], totalCount: 0, totalPages: 1, currentPage: page };
        }
        
        query = query.eq("category_id", catData.id);
      }

      // 2. Filter Search Keyword
      if (searchKeyword && searchKeyword.trim()) {
        const cleanKeyword = searchKeyword.trim().replace(/[,]/g, "");
        const pattern = `%${cleanKeyword}%`;
        query = query.or(
          [
            `name.ilike.${pattern}`,
            `short_description.ilike.${pattern}`,
            `description.ilike.${pattern}`,
          ].join(",")
        );
      }

      // 3. Sorting
      switch (sortBy) {
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        case "name-asc":
          query = query.order("name", { ascending: true });
          break;
        case "name-desc":
          query = query.order("name", { ascending: false });
          break;
        case "latest":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }
      query = query.order("id", { ascending: true }); // Tie-breaker

      // 4. Pagination (range)
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("[productRepository.getPaginatedProducts] Supabase error:", error.message);
        return { products: [], totalCount: 0, totalPages: 1, currentPage: page };
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);
      const products = data ? (data as unknown as DbProductWithRelations[]).map(mapDbProductToProduct) : [];

      return {
        products,
        totalCount,
        totalPages: totalPages === 0 ? 1 : totalPages,
        currentPage: page,
      };
    } catch (err) {
      console.error("[productRepository.getPaginatedProducts] Unexpected error:", err);
      return { products: [], totalCount: 0, totalPages: 1, currentPage: page };
    }
  },

  // ---------------------------------------------------------------------------
  // getProductBySlug()
  // ---------------------------------------------------------------------------

  /**
   * Mengambil satu produk berdasarkan slug URL.
   *
   * Digunakan oleh:
   *   - Halaman detail produk (/produk/[slug])
   *   - generateMetadata untuk SEO halaman detail
   *
   * Error code PGRST116 (row not found) diperlakukan sebagai hasil kosong (null),
   * bukan sebagai error — ini adalah perilaku normal ketika slug tidak ditemukan.
   *
   * @param slug - Slug URL produk (mis: "keranjang-rotan-estetik")
   * @returns Promise<Product | null> — Produk jika ditemukan, null jika tidak ada.
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!slug?.trim()) {
      console.warn("[productRepository.getProductBySlug] Slug tidak boleh kosong.");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug.trim())
        .eq("is_active", true)
        .single();

      if (error) {
        // PGRST116 = "The result contains 0 rows" — bukan error server, hanya not found
        if (error.code === "PGRST116") return null;

        console.error("[productRepository.getProductBySlug] Supabase error:", error.message);
        return null;
      }

      if (!data) return null;

      return mapDbProductToProduct(data as unknown as DbProductWithRelations);
    } catch (err) {
      console.error("[productRepository.getProductBySlug] Unexpected error:", err);
      return null;
    }
  },

  // ---------------------------------------------------------------------------
  // getFeaturedProducts()
  // ---------------------------------------------------------------------------

  /**
   * Mengambil produk yang ditandai sebagai Unggulan (is_featured = true).
   *
   * Digunakan oleh:
   *   - Section "Produk Unggulan" di homepage
   *   - Komponen FeaturedProducts
   *
   * @returns Promise<Product[]> — Array produk unggulan, diurutkan by display_order.
   */
  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const { data, error } = await buildBaseQuery().eq("is_featured", true);

      if (error) {
        console.error("[productRepository.getFeaturedProducts] Supabase error:", error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      return (data as unknown as DbProductWithRelations[]).map(mapDbProductToProduct);
    } catch (err) {
      console.error("[productRepository.getFeaturedProducts] Unexpected error:", err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // getProductsByCategory()
  // ---------------------------------------------------------------------------

  /**
   * Mengambil semua produk aktif dalam satu kategori berdasarkan UUID kategori.
   *
   * Digunakan oleh:
   *   - Filter produk berdasarkan kategori di halaman katalog
   *   - Section kategori di homepage
   *   - Halaman detail kategori (jika ada di masa depan)
   *
   * @param categoryId - UUID kategori dari tabel `categories` (bukan slug)
   * @returns Promise<Product[]> — Array produk dalam kategori tersebut.
   */
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    if (!categoryId?.trim()) {
      console.warn("[productRepository.getProductsByCategory] categoryId tidak boleh kosong.");
      return [];
    }

    try {
      const { data, error } = await buildBaseQuery().eq("category_id", categoryId.trim());

      if (error) {
        console.error("[productRepository.getProductsByCategory] Supabase error:", error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      return (data as unknown as DbProductWithRelations[]).map(mapDbProductToProduct);
    } catch (err) {
      console.error("[productRepository.getProductsByCategory] Unexpected error:", err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // getRelatedProducts()
  // ---------------------------------------------------------------------------

  /**
   * Mengambil produk terkait berdasarkan kategori produk acuan.
   * Produk acuan sendiri dikecualikan dari hasil.
   *
   * STRATEGI DUA TAHAP:
   *   Tahap 1: Ambil produk dari kategori yang sama (exclude produk acuan)
   *   Tahap 2: Jika jumlah < limit, tambahkan produk dari kategori LAIN
   *            sebagai fallback agar slot tetap terisi
   *
   * Digunakan oleh:
   *   - Section "Produk Terkait" di halaman detail produk (/produk/[slug])
   *   - Komponen ProductDetailView (prop relatedProducts)
   *
   * @param productId - UUID produk acuan yang sedang dilihat
   * @param limit     - Jumlah maksimal produk terkait (default: DEFAULT_RELATED_LIMIT)
   * @returns Promise<Product[]> — Array produk terkait, maksimal sejumlah `limit`.
   */
  async getRelatedProducts(
    productId: string,
    limit: number = DEFAULT_RELATED_LIMIT
  ): Promise<Product[]> {
    if (!productId?.trim()) {
      console.warn("[productRepository.getRelatedProducts] productId tidak boleh kosong.");
      return [];
    }

    try {
      // --- Tahap 1: Ambil category_id dari produk acuan ---
      const { data: currentProduct, error: currentError } = await supabase
        .from("products")
        .select("id, category_id")
        .eq("id", productId.trim())
        .eq("is_active", true)
        .single();

      if (currentError || !currentProduct) {
        console.warn(
          "[productRepository.getRelatedProducts] Produk acuan tidak ditemukan:",
          productId
        );
        return [];
      }

      // --- Tahap 2: Ambil produk dari kategori yang sama ---
      const { data: sameCategory, error: sameCategoryError } = await buildBaseQuery()
        .eq("category_id", currentProduct.category_id)
        .neq("id", productId)
        .limit(limit);

      if (sameCategoryError) {
        console.error(
          "[productRepository.getRelatedProducts] Supabase error (same category):",
          sameCategoryError.message
        );
        return [];
      }

      const sameCategoryProducts = (sameCategory ?? []) as unknown as DbProductWithRelations[];

      // --- Tahap 3: Fallback jika kurang dari limit ---
      if (sameCategoryProducts.length < limit) {
        const remaining = limit - sameCategoryProducts.length;

        const { data: fallbackData } = await buildBaseQuery()
          .neq("id", productId)
          .neq("category_id", currentProduct.category_id)
          .limit(remaining);

        const fallbackProducts = (fallbackData ?? []) as unknown as DbProductWithRelations[];

        return [
          ...sameCategoryProducts.map(mapDbProductToProduct),
          ...fallbackProducts.map(mapDbProductToProduct),
        ];
      }

      return sameCategoryProducts.map(mapDbProductToProduct);
    } catch (err) {
      console.error("[productRepository.getRelatedProducts] Unexpected error:", err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // getNewProducts()
  // ---------------------------------------------------------------------------

  /**
   * Mengambil produk yang tergolong "Baru" berdasarkan tanggal pembuatan.
   *
   * Produk dianggap baru jika dibuat dalam NEW_PRODUCT_THRESHOLD_DAYS (30 hari) terakhir.
   * Kalkulasi dilakukan oleh mapper `resolveIsNew()` berdasarkan kolom `created_at`
   * dari database — bukan berdasarkan flag statis.
   *
   * Digunakan oleh:
   *   - Section "Produk Terbaru" di homepage
   *   - Komponen NewProducts
   *
   * @returns Promise<Product[]> — Array produk baru. Kosong jika tidak ada atau error.
   */
  async getNewProducts(): Promise<Product[]> {
    try {
      const all = await this.getProducts();
      return all.filter((p) => p.isNew);
    } catch (err) {
      console.error("[productRepository.getNewProducts] Unexpected error:", err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // searchProducts()
  // ---------------------------------------------------------------------------

  /**
   * Mencari produk berdasarkan kata kunci teks (case-insensitive).
   *
   * Pencarian dilakukan pada kolom:
   *   - name              (nama produk)
   *   - short_description (deskripsi singkat)
   *   - description       (deskripsi lengkap)
   *
   * Menggunakan operator `ilike` PostgreSQL (case-insensitive LIKE)
   * dengan wildcard `%keyword%` di kedua sisi.
   *
   * Jika keyword kosong/blank → mengembalikan SEMUA produk aktif
   * (perilaku yang sama dengan getProducts()).
   *
   * Digunakan oleh:
   *   - Komponen ProductSearch di halaman katalog
   *   - Toolbar pencarian produk (ProductToolbar → ProductSearch)
   *
   * @param keyword - Kata kunci pencarian (mis: "rotan", "bambu lamp")
   * @returns Promise<Product[]> — Array produk yang cocok dengan keyword.
   */
  async searchProducts(keyword: string): Promise<Product[]> {
    // Jika keyword kosong, kembalikan semua produk (konsisten dengan perilaku lama)
    if (!keyword?.trim()) {
      return this.getProducts();
    }

    // Sanitasi keyword: trim whitespace, escape karakter PostgREST sensitif
    const cleanKeyword = keyword.trim().replace(/[,]/g, "");
    const pattern = `%${cleanKeyword}%`;

    try {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .eq("status", "active")
        .or(
          [
            `name.ilike.${pattern}`,
            `short_description.ilike.${pattern}`,
            `description.ilike.${pattern}`,
          ].join(",")
        )
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[productRepository.searchProducts] Supabase error:", error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      return (data as unknown as DbProductWithRelations[]).map(mapDbProductToProduct);
    } catch (err) {
      console.error("[productRepository.searchProducts] Unexpected error:", err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // getBestSellerProducts()
  // ---------------------------------------------------------------------------

  /**
   * Mengambil daftar produk terlaris berdasarkan data penjualan (orders & order_items).
   * Hanya pesanan dengan status 'processing', 'shipped', 'delivered' yang dihitung.
   *
   * @param limit - Jumlah maksimal produk yang direturn (default 8)
   * @returns Promise<Product[]> — Array produk terlaris.
   */
  async getBestSellerProducts(limit: number = 8): Promise<Product[]> {
    try {
      // 1. Ambil order items dari pesanan yang sah melalui RPC PostgreSQL
      // Ini melakukan agregasi SUM(quantity) di database dan bypass RLS
      const { data, error } = await supabase.rpc("get_best_sellers", {
        p_limit: limit
      });

      if (error) {
        console.error("[productRepository.getBestSellerProducts] Supabase error:", error.message);
        // Fallback: kembalikan produk default terbatas tanpa full-table fetch
        const { data: defaultData } = await buildBaseQuery().limit(limit);
        if (!defaultData) return [];
        return (defaultData as unknown as DbProductWithRelations[]).map(mapDbProductToProduct);
      }

      const topProductIds: string[] = (data || []).map((item: any) => item.product_id);
      let bestSellers: Product[] = [];

      // 2. Ambil detail produk aktual untuk product_ids tersebut
      if (topProductIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select(PRODUCT_SELECT)
          .in("id", topProductIds);

        if (!productsError && productsData) {
          // Mapping O(1) lookup untuk efisiensi
          const productMap = new Map<string, any>();
          for (const p of productsData) {
            productMap.set(p.id, p);
          }

          // Pertahankan urutan yang dikembalikan oleh RPC (total_sold DESC)
          bestSellers = topProductIds
            .map(id => productMap.get(id))
            .filter((p): p is any => p !== undefined)
            .map(p => {
              const product = mapDbProductToProduct(p as unknown as DbProductWithRelations);
              product.isBestSeller = true; // Tandai sebagai best seller aktual
              return product;
            });
        }
      }

      // 3. Fallback padding jika hasilnya kurang dari limit
      // (Bisa terjadi jika penjualan belum ada atau produk sudah dihapus)
      if (bestSellers.length < limit) {
        const remaining = limit - bestSellers.length;
        
        let query = buildBaseQuery().limit(remaining);
        if (topProductIds.length > 0) {
          // Exclude produk yang sudah masuk best sellers
          query = query.not("id", "in", `(${topProductIds.join(",")})`);
        }

        const { data: fallbackData } = await query;
        
        if (fallbackData) {
          const fallbackProducts = (fallbackData as unknown as DbProductWithRelations[])
            .map(mapDbProductToProduct);
            
          // Fallback padding tidak ditandai isBestSeller
          bestSellers.push(...fallbackProducts);
        }
      }
      
      return bestSellers;
    } catch (err) {
      console.error("[productRepository.getBestSellerProducts] Unexpected error:", err);
      // Fallback: kembalikan produk default terbatas
      try {
        const { data: defaultData } = await buildBaseQuery().limit(limit);
        if (!defaultData) return [];
        return (defaultData as unknown as DbProductWithRelations[]).map(mapDbProductToProduct);
      } catch {
        return [];
      }
    }
  },
};

export default productRepository;
