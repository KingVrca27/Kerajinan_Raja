/**
 * @file src/lib/imageRepository.ts
 *
 * Repository untuk operasi gambar menggunakan Supabase Storage.
 *
 * STRUKTUR PENYIMPANAN:
 *   Bucket : product-images (public)
 *   Path   : products/{productId}/{uuid}.{ext}
 *            categories/{categoryId}/{uuid}.{ext}
 *
 * CATATAN SETUP:
 *   Bucket 'product-images' harus dibuat manual di Supabase Dashboard:
 *   Storage → New Bucket → Name: product-images → Public: ✅
 *
 * ATURAN:
 *   - Tidak ada query Supabase langsung dari komponen UI.
 *   - Semua operasi Storage melalui file ini.
 *   - Menggunakan supabase client (bukan server) karena dipanggil dari
 *     Admin Dashboard yang berjalan di browser (Client Component).
 */

import { supabase } from "@/src/lib/supabase";
import type { DbProductImage } from "@/src/types/database";

/** Nama bucket Supabase Storage untuk gambar produk */
const PRODUCT_BUCKET = "product_images";

/** Nama bucket Supabase Storage untuk gambar kategori */
const CATEGORY_BUCKET = "Aset_Gambar";

/** Format file yang diizinkan untuk upload gambar */
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

/** Ukuran file maksimal: 5 MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// =============================================================================
// VALIDASI FILE
// =============================================================================

/**
 * Memvalidasi file gambar sebelum upload.
 * @returns null jika valid, pesan error jika tidak valid
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Format file tidak didukung. Gunakan: JPG, PNG, WEBP, atau GIF.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Ukuran file terlalu besar. Maksimal 5 MB (file ini: ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  }
  return null;
}

// =============================================================================
// GENERATE UNIQUE FILENAME
// =============================================================================

/**
 * Membuat nama file unik menggunakan timestamp + random string.
 * Mempertahankan ekstensi file asli.
 */
function generateUniqueFileName(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

// =============================================================================
// UPLOAD GAMBAR
// =============================================================================

/**
 * Upload gambar produk ke Supabase Storage.
 *
 * @param file - File gambar yang akan diupload
 * @param productId - UUID produk (untuk path penyimpanan)
 * @returns URL publik gambar + path storage, atau null jika gagal
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<{ url: string; path: string } | null> {
  const validationError = validateImageFile(file);
  if (validationError) {
    console.error("[imageRepository.uploadProductImage]", validationError);
    return null;
  }

  const fileName = generateUniqueFileName(file.name);
  const path = `products/${productId}/${fileName}`;

  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[imageRepository.uploadProductImage] Upload error:", error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(PRODUCT_BUCKET)
    .getPublicUrl(path);

  return { url: publicUrl, path };
}

/**
 * Upload gambar kategori ke Supabase Storage.
 *
 * @param file - File gambar yang akan diupload
 * @param categoryId - UUID kategori (untuk path penyimpanan)
 * @returns URL publik gambar + path storage, atau null jika gagal
 */
export async function uploadCategoryImage(
  file: File,
  categoryId: string
): Promise<{ url: string; path: string } | null> {
  const validationError = validateImageFile(file);
  if (validationError) {
    console.error("[imageRepository.uploadCategoryImage]", validationError);
    return null;
  }

  const fileName = generateUniqueFileName(file.name);
  const path = `categories/${categoryId}/${fileName}`;

  const { error } = await supabase.storage
    .from(CATEGORY_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[imageRepository.uploadCategoryImage] Upload error:", error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(CATEGORY_BUCKET)
    .getPublicUrl(path);

  return { url: publicUrl, path };
}

// =============================================================================
// PRODUCT IMAGES TABLE
// =============================================================================

/**
 * Mengambil semua gambar untuk satu produk, diurutkan berdasarkan sort_order.
 */
export async function getProductImages(productId: string): Promise<DbProductImage[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, product_id, image_url, alt_text, sort_order, is_primary, created_at, updated_at")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[imageRepository.getProductImages]", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Insert record gambar baru ke tabel product_images setelah upload ke Storage.
 *
 * @param productId - UUID produk
 * @param imageUrl - URL publik dari Supabase Storage
 * @param isPrimary - Apakah gambar ini menjadi thumbnail utama
 * @param sortOrder - Urutan tampil (0 = pertama)
 * @returns DbProductImage yang dibuat, atau null jika gagal
 */
export async function insertProductImage(
  productId: string,
  imageUrl: string,
  isPrimary: boolean = false,
  sortOrder: number = 1,
  altText: string | null = null
): Promise<DbProductImage | null> {
  // Jika set sebagai primary, reset semua gambar lain terlebih dahulu
  if (isPrimary) {
    await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", productId);
  }

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      image_url: imageUrl,
      alt_text: altText ?? null,
      is_primary: isPrimary,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) {
    console.error("[imageRepository.insertProductImage]", error.message);
    return null;
  }

  return data;
}

/**
 * Hapus satu gambar dari tabel product_images DAN dari Supabase Storage.
 *
 * @param imageId - UUID record di tabel product_images
 * @param storagePath - Path file di Storage (contoh: products/{id}/file.jpg)
 *                      Jika kosong, hanya hapus record dari DB
 */
export async function deleteProductImage(
  imageId: string,
  storagePath?: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Hapus dari Supabase Storage (jika path tersedia)
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      // Lanjutkan hapus DB meskipun Storage gagal (konsistensi DB lebih penting)
      console.warn("[imageRepository.deleteProductImage] Storage error:", storageError.message);
    }
  }

  // 2. Hapus record dari tabel product_images
  const { error: dbError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (dbError) {
    console.error("[imageRepository.deleteProductImage] DB error:", dbError.message);
    return { success: false, error: dbError.message };
  }

  return { success: true };
}

/**
 * Set satu gambar sebagai thumbnail utama (is_primary = true).
 * Secara otomatis mereset is_primary pada gambar lain dalam produk yang sama.
 *
 * @param imageId - UUID gambar yang akan dijadikan primary
 * @param productId - UUID produk (untuk reset gambar lain)
 */
export async function setPrimaryImage(
  imageId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  // Reset semua gambar produk: is_primary = false
  const { error: resetError } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);

  if (resetError) {
    return { success: false, error: resetError.message };
  }

  // Set gambar target: is_primary = true
  const { error: setError } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  if (setError) {
    return { success: false, error: setError.message };
  }

  return { success: true };
}

/**
 * Upload banyak gambar sekaligus untuk satu produk (batch upload).
 * Gambar pertama dalam array otomatis dijadikan thumbnail utama.
 *
 * @param productId - UUID produk
 * @param files - Array File yang akan diupload
 * @returns Jumlah gambar yang berhasil diupload
 */
export async function uploadPendingImages(
  productId: string,
  files: File[],
  altTextPrefix?: string
): Promise<number> {
  if (files.length === 0) return 0;

  // Hitung sort_order mulai dari jumlah gambar yang sudah ada
  const existing = await getProductImages(productId);
  const hasExistingPrimary = existing.some((img) => img.is_primary);
  let successCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const uploaded = await uploadProductImage(file, productId);
    if (!uploaded) continue;

    // Gambar pertama yang diupload jadi primary jika belum ada primary
    const isFirstAndNoPrimary = i === 0 && !hasExistingPrimary && successCount === 0;
    const sortOrder = existing.length + successCount + 1;
    const altText = altTextPrefix ? `${altTextPrefix} - Gambar ${sortOrder}` : file.name;

    await insertProductImage(
      productId,
      uploaded.url,
      isFirstAndNoPrimary,
      sortOrder,
      altText
    );
    successCount++;
  }

  return successCount;
}

// =============================================================================
// HAPUS GAMBAR KATEGORI DARI STORAGE
// =============================================================================

/**
 * Hapus gambar kategori dari Supabase Storage berdasarkan URL publik.
 * Mengekstrak path dari URL untuk menentukan file yang akan dihapus.
 */
export async function deleteCategoryImageByUrl(imageUrl: string): Promise<void> {
  // Ekstrak path dari URL publik Supabase Storage
  const pathMatch = imageUrl.match(/\/storage\/v1\/object\/public\/Aset_Gambar\/(.+)$/);
  if (!pathMatch || !pathMatch[1]) return;

  const path = decodeURIComponent(pathMatch[1]);
  await supabase.storage.from(CATEGORY_BUCKET).remove([path]);
}

const imageRepository = {
  validateImageFile,
  uploadProductImage,
  uploadCategoryImage,
  getProductImages,
  insertProductImage,
  deleteProductImage,
  setPrimaryImage,
  uploadPendingImages,
  deleteCategoryImageByUrl,
};

export default imageRepository;
