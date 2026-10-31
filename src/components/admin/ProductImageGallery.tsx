"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Upload, Trash2, Star, StarOff, Loader2, ImageOff } from "lucide-react";
import {
  getProductImages,
  uploadProductImage,
  insertProductImage,
  deleteProductImage,
  setPrimaryImage,
  validateImageFile,
} from "@/src/lib/imageRepository";
import type { DbProductImage } from "@/src/types/database";

// =============================================================================
// PROPS
// =============================================================================

export interface ProductImageGalleryProps {
  /**
   * UUID produk yang sedang diedit.
   * Jika undefined → mode CREATE (gambar disimpan sebagai pending File[]).
   * Jika defined  → mode EDIT  (gambar langsung dikelola ke Supabase).
   */
  productId?: string;

  /**
   * Callback untuk mode CREATE: memberitahu parent tentang file yang dipilih.
   * Parent menggunakan ini untuk upload gambar setelah produk dibuat.
   */
  onPendingFilesChange?: (files: File[]) => void;
}

// =============================================================================
// KOMPONEN UTAMA
// =============================================================================

/**
 * Galeri gambar untuk form produk admin.
 *
 * MODE CREATE (productId = undefined):
 *   - Admin memilih gambar → disimpan sebagai File[] di state lokal
 *   - Preview gambar via URL.createObjectURL
 *   - Tidak ada operasi Supabase Storage — gambar diupload saat produk dibuat
 *
 * MODE EDIT (productId = string):
 *   - Fetch gambar dari Supabase (tabel product_images)
 *   - Upload langsung ke Supabase Storage + insert ke product_images
 *   - Delete langsung dari Storage + DB
 *   - Set primary langsung ke DB
 */
export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  productId,
  onPendingFilesChange,
}) => {
  const isEditMode = Boolean(productId);

  // ── State untuk mode EDIT ──
  const [existingImages, setExistingImages] = useState<DbProductImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  // ── State untuk mode CREATE ──
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);

  // ── State bersama ──
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // FETCH GAMBAR (mode edit)
  // ---------------------------------------------------------------------------

  const loadImages = useCallback(async () => {
    if (!productId) return;
    setIsLoadingImages(true);
    const imgs = await getProductImages(productId);
    setExistingImages(imgs);
    setIsLoadingImages(false);
  }, [productId]);

  useEffect(() => {
    if (isEditMode) {
      loadImages();
    }
  }, [isEditMode, loadImages]);

  // Bersihkan object URLs saat unmount
  useEffect(() => {
    return () => {
      pendingPreviews.forEach(URL.revokeObjectURL);
    };
  }, [pendingPreviews]);

  // ---------------------------------------------------------------------------
  // HANDLE FILE SELECTION
  // ---------------------------------------------------------------------------

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []) as File[];
      if (files.length === 0) return;

      setErrorMsg(null);

      // Validasi semua file
      for (const file of files) {
        const err = validateImageFile(file);
        if (err) {
          setErrorMsg(err);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      }

      if (isEditMode && productId) {
        // ── Mode EDIT: Upload langsung ke Supabase ──
        setIsUploading(true);
        let uploaded = 0;
        for (const file of files) {
          const result = await uploadProductImage(file, productId);
          if (result) {
            const isPrimary = existingImages.length === 0 && uploaded === 0;
            const sortOrder = existingImages.length + uploaded + 1;
            await insertProductImage(
              productId,
              result.url,
              isPrimary,
              sortOrder,
              file.name
            );
            uploaded++;
          }
        }
        if (uploaded > 0) await loadImages();
        setIsUploading(false);
      } else {
        // ── Mode CREATE: simpan sebagai File[] lokal ──
        const newFiles = [...pendingFiles, ...files];
        const newPreviews = [
          ...pendingPreviews,
          ...files.map((f) => URL.createObjectURL(f)),
        ];
        setPendingFiles(newFiles);
        setPendingPreviews(newPreviews);
        onPendingFilesChange?.(newFiles);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [isEditMode, productId, existingImages.length, pendingFiles, pendingPreviews, onPendingFilesChange, loadImages]
  );

  // ---------------------------------------------------------------------------
  // HAPUS GAMBAR
  // ---------------------------------------------------------------------------

  const handleDeleteExisting = useCallback(
    async (img: DbProductImage) => {
      setDeletingId(img.id);
      await deleteProductImage(img.id);
      await loadImages();
      setDeletingId(null);
    },
    [loadImages]
  );

  const handleDeletePending = useCallback(
    (index: number) => {
      URL.revokeObjectURL(pendingPreviews[index]);
      const newFiles = pendingFiles.filter((_, i) => i !== index);
      const newPreviews = pendingPreviews.filter((_, i) => i !== index);
      setPendingFiles(newFiles);
      setPendingPreviews(newPreviews);
      onPendingFilesChange?.(newFiles);
    },
    [pendingFiles, pendingPreviews, onPendingFilesChange]
  );

  // ---------------------------------------------------------------------------
  // SET PRIMARY
  // ---------------------------------------------------------------------------

  const handleSetPrimary = useCallback(
    async (img: DbProductImage) => {
      if (!productId) return;
      setSettingPrimaryId(img.id);
      await setPrimaryImage(img.id, productId);
      await loadImages();
      setSettingPrimaryId(null);
    },
    [productId, loadImages]
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  const totalImages = (isEditMode ? existingImages.length : pendingFiles.length);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Galeri Gambar Produk
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
          {totalImages} gambar
        </span>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {errorMsg}
        </div>
      )}

      {/* Upload Zone */}
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/10 p-4 text-center transition-colors hover:border-primary hover:bg-primary/5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <Upload className="h-6 w-6 text-primary" />
        )}
        <div>
          <p className="text-xs font-bold text-primary">
            {isUploading ? "Mengupload..." : "Pilih Gambar"}
          </p>
          <p className="mt-0.5 text-[10px] text-text-secondary">
            JPG, PNG, WEBP, GIF • Maks. 5 MB • Bisa pilih banyak
          </p>
        </div>
      </label>

      {/* Loading skeleton */}
      {isLoadingImages && (
        <div className="flex h-20 items-center justify-center gap-2 text-xs text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memuat gambar...</span>
        </div>
      )}

      {/* Existing Images Grid (mode EDIT) */}
      {isEditMode && !isLoadingImages && existingImages.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {existingImages.map((img) => {
            const isDeleting = deletingId === img.id;
            const isSettingPrimary = settingPrimaryId === img.id;
            return (
              <div
                key={img.id}
                className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                  img.is_primary
                    ? "border-primary shadow-md"
                    : "border-primary/10 hover:border-primary/30"
                }`}
              >
                <Image
                  src={img.image_url}
                  alt="Gambar produk"
                  fill
                  sizes="100px"
                  className="object-cover"
                  unoptimized
                />

                {/* Overlay buttons */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {/* Set Primary Button */}
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img)}
                      disabled={isSettingPrimary}
                      className="rounded-lg bg-amber-500 p-1.5 text-white hover:bg-amber-600"
                      title="Jadikan Thumbnail Utama"
                    >
                      {isSettingPrimary ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <StarOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteExisting(img)}
                    disabled={isDeleting}
                    className="rounded-lg bg-red-500 p-1.5 text-white hover:bg-red-600"
                    title="Hapus Gambar"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Primary Badge */}
                {img.is_primary && (
                  <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded-md bg-primary px-1 py-0.5 text-[9px] font-bold text-white">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    <span>Utama</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pending Files Preview (mode CREATE) */}
      {!isEditMode && pendingFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {pendingPreviews.map((preview, index) => (
            <div
              key={preview}
              className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${
                index === 0 ? "border-primary shadow-md" : "border-primary/10"
              }`}
            >
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                fill
                sizes="100px"
                className="object-cover"
                unoptimized
              />

              {/* Delete overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleDeletePending(index)}
                  className="rounded-lg bg-red-500 p-1.5 text-white hover:bg-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Primary Badge (selalu gambar pertama di create mode) */}
              {index === 0 && (
                <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded-md bg-primary px-1 py-0.5 text-[9px] font-bold text-white">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  <span>Utama</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoadingImages && totalImages === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/15 bg-secondary/10 py-6 text-center">
          <ImageOff className="h-8 w-8 text-text-secondary/40" />
          <p className="text-xs text-text-secondary">
            Belum ada gambar. Pilih gambar di atas untuk memulai.
          </p>
        </div>
      )}

      {!isEditMode && pendingFiles.length > 0 && (
        <p className="text-[11px] text-text-secondary">
          💡 Gambar akan diupload setelah produk disimpan. Gambar pertama otomatis jadi thumbnail utama.
        </p>
      )}
    </div>
  );
};

export default ProductImageGallery;
