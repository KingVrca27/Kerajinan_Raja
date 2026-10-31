/**
 * @file src/types/database.ts
 *
 * Definisi tipe TypeScript yang merepresentasikan struktur baris database
 * Supabase PostgreSQL secara langsung (snake_case, sesuai skema tabel).
 *
 * File ini HANYA digunakan oleh Product Repository dan layer data lainnya.
 * Komponen UI tidak boleh mengimpor tipe dari file ini secara langsung —
 * gunakan model frontend (src/types/product.ts) yang sudah di-mapping.
 *
 * Tipe di sini sesuai dengan migration:
 *   - 20260729122624_initial_schema.sql
 *   - 20260729132500_enhance_products_table.sql
 */

// =============================================================================
// TABEL: categories
// =============================================================================

/**
 * Baris dari tabel `categories` di Supabase PostgreSQL.
 */
export interface DbCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// TABEL: product_images
// =============================================================================

/**
 * Baris dari tabel `product_images` di Supabase PostgreSQL.
 * Setiap produk dapat memiliki banyak gambar (one-to-many).
 */
export interface DbProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// TABEL: products
// =============================================================================

/**
 * Nilai yang valid untuk kolom `status` pada tabel products.
 */
export type DbProductStatus = "active" | "inactive" | "draft" | "out_of_stock";

/**
 * Baris dari tabel `products` di Supabase PostgreSQL.
 * Mencakup seluruh kolom dari kedua migration (initial + enhance).
 */
export interface DbProduct {
  id: string;
  category_id: string;
  name: string;
  slug: string;
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
  sku: string | null;
  status: DbProductStatus;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  meta_title: string | null;
  meta_description: string | null;
  allowed_payment_methods: string[];
  created_at: string;
  updated_at: string;
}

/**
 * DbProduct dengan relasi yang sudah di-JOIN dari Supabase.
 * Digunakan sebagai tipe cast hasil query SELECT dengan relasi.
 *
 * `categories` → ONE kategori (join lewat products.category_id)
 * `product_images` → MANY gambar (join lewat product_images.product_id)
 */
export interface DbProductWithRelations extends DbProduct {
  categories: DbCategory | null;
  product_images: DbProductImage[];
  reviews?: { rating: number; is_approved: boolean }[];
}

// =============================================================================
// TABEL: conversations
// Phase 4.4M — Product Chat Database & Security Foundation
// =============================================================================

/**
 * Status conversation yang valid.
 */
export type DbConversationStatus = "open" | "closed";

/**
 * Baris dari tabel `conversations` di Supabase PostgreSQL.
 * Satu customer hanya boleh memiliki satu conversation per produk
 * (UNIQUE constraint pada customer_id + product_id).
 *
 * Relasi:
 *   customer_id → public.customers.id
 *   product_id  → public.products.id
 */
export interface DbConversation {
  id: string;
  customer_id: string;
  product_id: string;
  status: DbConversationStatus;
  created_at: string;
  updated_at: string;
}

/**
 * DbConversation dengan relasi yang sudah di-JOIN dari Supabase.
 * Opsional — digunakan bila query mengambil data customer/produk sekaligus.
 */
export interface DbConversationWithRelations extends DbConversation {
  customers?: Pick<{ id: string; full_name: string; email: string }, "id" | "full_name" | "email"> | null;
  products?: Pick<{ id: string; name: string; slug: string }, "id" | "name" | "slug"> | null;
}

// =============================================================================
// TABEL: messages
// Phase 4.4M — Product Chat Database & Security Foundation
// =============================================================================

/**
 * Baris dari tabel `messages` di Supabase PostgreSQL.
 * Konten disimpan sebagai plain text — bukan HTML.
 *
 * Relasi:
 *   conversation_id → public.conversations.id
 *   sender_id       → auth.users.id
 */
export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read_by_admin: boolean;
  is_read_by_customer: boolean;
  created_at: string;
}

// =============================================================================
// TABEL: conversations (with product preview)
// Phase 4.5C — Customer Chat Page
// =============================================================================

/**
 * DbConversation dengan relasi produk dan preview pesan terakhir.
 * Digunakan oleh halaman /chat customer untuk menampilkan daftar
 * percakapan dengan informasi yang kaya.
 */
export interface DbConversationWithProductPreview extends DbConversation {
  /** Data produk terkait dari join */
  products: {
    id: string;
    name: string;
    slug: string;
    /** URL gambar utama produk — null jika belum ada */
    image_url: string | null;
  } | null;
  /** Pesan terakhir — diisi oleh client setelah fetch messages terpisah */
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  /** Jumlah pesan belum dibaca oleh customer */
  unreadCount: number;
}
