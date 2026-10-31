"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit2, Trash2, X, FolderTree,
  AlertTriangle, ToggleLeft, ToggleRight, ChevronLeft,
  ChevronRight, Upload, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import categoryRepository, { type CreateCategoryData } from "@/src/lib/categoryRepository";
import { uploadCategoryImage, validateImageFile } from "@/src/lib/imageRepository";
import type { Category } from "@/src/types/category";
import { useToast } from "@/src/context/ToastContext";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import BulkActionBar from "@/src/components/ui/BulkActionBar";
import { TableSkeleton } from "@/src/components/ui/Skeleton";
import EmptyState from "@/src/components/ui/EmptyState";

// =============================================================================
// CONSTANTS
// =============================================================================

const PAGE_SIZE = 10;

// =============================================================================
// TIPE FORM
// =============================================================================

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  sort_order: string;
}

const DEFAULT_FORM: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  is_active: true,
  sort_order: "0",
};

// =============================================================================
// HELPER: AUTO-GENERATE SLUG
// =============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}



// =============================================================================
// HALAMAN ADMIN KATEGORI
// =============================================================================

export default function AdminKategoriPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  // ── Data ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Bulk Selection ──
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // ── Filter & Pagination ──
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal State ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Form ──
  const [form, setForm] = useState<CategoryFormState>(DEFAULT_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string>("");

  // ---------------------------------------------------------------------------
  // LOAD DATA
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const data = await categoryRepository.getAllCategories();
    setCategories(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // FILTER & PAGINATION
  // ---------------------------------------------------------------------------

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset halaman saat search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // MODAL HANDLERS
  // ---------------------------------------------------------------------------

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setImageFile(null);
    setImagePreview("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      image_url: cat.image ?? "",
      is_active: cat.is_active ?? true,
      sort_order: String(cat.sort_order ?? 0),
    });
    setImageFile(null);
    setImagePreview(cat.image ?? "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setFormError("");
  };

  // ---------------------------------------------------------------------------
  // IMAGE UPLOAD HANDLER
  // ---------------------------------------------------------------------------

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const err = validateImageFile(file);
    if (err) {
      setFormError(err);
      return;
    }

    setFormError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ---------------------------------------------------------------------------
  // AUTO-GENERATE SLUG FROM NAME
  // ---------------------------------------------------------------------------

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      // Auto-generate slug hanya jika slug masih kosong atau belum diedit manual
      slug: editingId ? prev.slug : generateSlug(name),
    }));
  };

  // ---------------------------------------------------------------------------
  // SUBMIT FORM
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validasi nama
    if (!form.name.trim()) {
      setFormError("Nama kategori wajib diisi.");
      return;
    }

    // Validasi slug
    const slug = form.slug.trim().toLowerCase();
    if (!slug) {
      setFormError("Slug wajib diisi.");
      return;
    }

    // Validasi slug unik
    const isUnique = await categoryRepository.isSlugUnique(slug, editingId ?? undefined);
    if (!isUnique) {
      setFormError("Slug sudah digunakan kategori lain. Gunakan slug yang berbeda.");
      return;
    }

    setIsSaving(true);

    let finalImageUrl = form.image_url;

    // Upload gambar baru jika ada
    if (imageFile) {
      setIsUploadingImage(true);

      // Jika edit, gunakan editingId; jika baru, gunakan slug sementara
      const tempId = editingId ?? `temp-${Date.now()}`;
      const uploaded = await uploadCategoryImage(imageFile, tempId);
      if (uploaded) {
        finalImageUrl = uploaded.url;
      } else {
        setFormError("Gagal mengupload gambar. Coba lagi.");
        setIsUploadingImage(false);
        setIsSaving(false);
        return;
      }
      setIsUploadingImage(false);
    }

    const payload: CreateCategoryData = {
      name: form.name.trim(),
      slug,
      description: form.description.trim() || undefined,
      image_url: finalImageUrl || undefined,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    };

    let result;
    if (editingId) {
      result = await categoryRepository.updateCategory(editingId, payload);
    } else {
      result = await categoryRepository.createCategory(payload);
    }

    if (!result.success) {
      setFormError(result.error ?? "Gagal menyimpan kategori.");
      setIsSaving(false);
      return;
    }

    toastSuccess(
      editingId
        ? `Kategori "${form.name}" berhasil diperbarui.`
        : `Kategori "${form.name}" berhasil ditambahkan.`,
      "Berhasil Menyimpan"
    );
    setIsModalOpen(false);
    await loadData();
    setIsSaving(false);
  };

  // ---------------------------------------------------------------------------
  // TOGGLE STATUS & BULK ACTIONS
  // ---------------------------------------------------------------------------

  const handleToggleStatus = async (cat: Category) => {
    setTogglingId(cat.id);
    const result = await categoryRepository.toggleStatus(cat.id, !cat.is_active);
    if (result.success) {
      toastSuccess(`Status kategori "${cat.name}" diubah.`, "Berhasil Menyimpan");
      await loadData();
    } else {
      toastError(result.error ?? "Gagal mengubah status.", "Error Action");
    }
    setTogglingId(null);
  };

  // ---------------------------------------------------------------------------
  // DELETE & BULK ACTIONS
  // ---------------------------------------------------------------------------

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);

    const result = await categoryRepository.deleteCategory(deleteConfirmId);

    if (!result.success) {
      toastError(result.error ?? "Gagal menghapus kategori.", "Gagal Menghapus");
    } else {
      const deletedName = categories.find((c) => c.id === deleteConfirmId)?.name ?? "";
      toastSuccess(`Kategori "${deletedName}" berhasil dihapus.`, "Berhasil Menghapus");
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmId));
      await loadData();
    }

    setIsDeleting(false);
    setDeleteConfirmId(null);
  };

  const handleBulkActivate = async () => {
    setIsSaving(true);
    for (const id of selectedIds) {
      await categoryRepository.toggleStatus(id, true);
    }
    toastSuccess(`Berhasil mengaktifkan ${selectedIds.length} kategori.`, "Bulk Action");
    setSelectedIds([]);
    await loadData();
    setIsSaving(false);
  };

  const handleBulkDeactivate = async () => {
    setIsSaving(true);
    for (const id of selectedIds) {
      await categoryRepository.toggleStatus(id, false);
    }
    toastSuccess(`Berhasil menonaktifkan ${selectedIds.length} kategori.`, "Bulk Action");
    setSelectedIds([]);
    await loadData();
    setIsSaving(false);
  };

  const handleBulkDeleteConfirm = async () => {
    setIsDeleting(true);
    for (const id of selectedIds) {
      await categoryRepository.deleteCategory(id);
    }
    toastSuccess(`Berhasil menghapus ${selectedIds.length} kategori.`, "Berhasil Menghapus");
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
    await loadData();
    setIsDeleting(false);
  };

  const handleBulkExport = () => {
    const itemsToExport = categories.filter((c) => selectedIds.includes(c.id));
    const headers = "ID,Nama,Slug,Deskripsi\n";
    const rows = itemsToExport
      .map((c) => `"${c.id}","${c.name}","${c.slug}","${c.description || ""}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-kategori-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toastSuccess("File CSV data kategori berhasil diunduh.", "Export Selesai");
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 font-body">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Manajemen Kategori
          </h1>
          <p className="text-xs text-text-secondary sm:text-sm">
            Kelola seluruh kategori produk kerajinan tangan dari Supabase Database.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Kategori</span>
        </motion.button>
      </div>

      {/* ── Search + Stats ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau slug kategori..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </div>
        <p className="text-xs text-text-secondary">
          Total:{" "}
          <strong className="text-text-primary">{filteredCategories.length}</strong> kategori
        </p>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          type="kategori"
          title={searchQuery ? "Kategori Tidak Ditemukan" : "Belum Ada Kategori"}
          description={searchQuery ? "Tidak ada kategori yang cocok dengan kata kunci Anda." : "Belum ada kategori produk yang ditambahkan."}
          actionText={!searchQuery ? "Tambah Kategori Baru" : undefined}
          onAction={!searchQuery ? handleOpenAdd : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-secondary/40 text-xs font-semibold uppercase text-text-secondary">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedCategories.length > 0 &&
                        paginatedCategories.every((c) => selectedIds.includes(c.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const pageIds = paginatedCategories.map((c) => c.id);
                          setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                        } else {
                          const pageIds = paginatedCategories.map((c) => c.id);
                          setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                        }
                      }}
                      className="rounded border-primary/30 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4 text-center">Urutan</th>
                  <th className="py-3.5 px-4 text-center">Produk</th>
                  <th className="py-3.5 px-4 text-center">Aktif</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, cat.id]);
                          } else {
                            setSelectedIds((prev) => prev.filter((id) => id !== cat.id));
                          }
                        }}
                        className="rounded border-primary/30 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    {/* Nama + Gambar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary/60">
                          {cat.image ? (
                            <Image
                              src={cat.image}
                              alt={cat.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <FolderTree className="h-5 w-5 text-amber-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-text-primary">{cat.name}</div>
                          {cat.description && (
                            <div className="text-xs text-text-secondary line-clamp-1 max-w-[200px]">
                              {cat.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4">
                      <span className="rounded-md bg-secondary/60 px-2 py-0.5 text-xs font-mono text-text-secondary">
                        /{cat.slug}
                      </span>
                    </td>

                    {/* Sort Order */}
                    <td className="py-3 px-4 text-center text-sm font-medium text-text-secondary">
                      {cat.sort_order ?? 0}
                    </td>

                    {/* Product Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {cat.productCount ?? 0}
                      </span>
                    </td>

                    {/* Toggle Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cat)}
                        disabled={togglingId === cat.id}
                        className="cursor-pointer disabled:cursor-wait"
                        title={cat.is_active ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {togglingId === cat.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : cat.is_active ? (
                          <ToggleRight className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-text-secondary/40" />
                        )}
                      </button>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                          title="Edit Kategori"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(cat.id)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-primary/10 px-4 py-3">
              <p className="text-xs text-text-secondary">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="rounded-lg border border-primary/20 p-1.5 text-text-secondary hover:bg-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="rounded-lg border border-primary/20 p-1.5 text-text-secondary hover:bg-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL TAMBAH / EDIT ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {editingId ? "Edit Kategori" : "Tambah Kategori Baru"}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="rounded-lg p-1 text-text-secondary hover:bg-primary/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">

                {/* Error Message */}
                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {formError}
                  </div>
                )}

                {/* Nama Kategori */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Nama Kategori <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Contoh: Anyaman Bambu"
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Slug URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
                    }
                    placeholder="anyaman-bambu"
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 font-mono text-xs focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-text-secondary">
                    Auto-generate dari nama. Hanya huruf kecil, angka, dan tanda hubung.
                  </p>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Koleksi kerajinan anyaman bambu..."
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Gambar Kategori */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1.5">
                    Gambar Kategori
                  </label>

                  {imagePreview ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-secondary/20 p-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-primary/10 bg-white shadow-xs">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-text-primary">Gambar Dipilih</span>
                        <div className="flex gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-primary/90">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageSelect}
                            />
                            <Upload className="h-3 w-3" />
                            Ganti
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview("");
                              setForm((p) => ({ ...p, image_url: "" }));
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3" />
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/10 p-5 text-center hover:border-primary hover:bg-primary/5">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                      <Upload className="h-6 w-6 text-primary" />
                      <span className="text-xs font-bold text-primary">Pilih Gambar Kategori</span>
                      <span className="text-[10px] text-text-secondary">JPG, PNG, WEBP • Maks. 5 MB</span>
                    </label>
                  )}

                  {isUploadingImage && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Mengupload gambar...
                    </div>
                  )}
                </div>

                {/* Sort Order + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.sort_order}
                      onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    />
                    <p className="mt-0.5 text-[10px] text-text-secondary">
                      Lebih kecil = lebih atas
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                      Status Aktif
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer ${
                        form.is_active
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-primary/20 bg-secondary/20 text-text-secondary"
                      }`}
                    >
                      {form.is_active ? (
                        <>
                          <ToggleRight className="h-4 w-4" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4" />
                          Nonaktif
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Form Footer */}
                <div className="flex justify-end gap-3 border-t border-primary/10 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSaving}
                    className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-70 cursor-pointer disabled:cursor-wait"
                  >
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {editingId ? "Simpan Perubahan" : "Tambah Kategori"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BULK ACTION BAR ── */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={categories.length}
        onSelectAll={() => setSelectedIds(categories.map((c) => c.id))}
        onClearSelection={() => setSelectedIds([])}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onDelete={() => setIsBulkDeleteOpen(true)}
        onExport={handleBulkExport}
        isLoading={isSaving || isDeleting}
      />

      {/* ── DIALOG KONFIRMASI HAPUS SINGLE ── */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Hapus Kategori Ini?"
        description="Kategori yang masih memiliki produk tidak dapat dihapus. Pastikan semua produk dalam kategori ini sudah dipindahkan terlebih dahulu."
        confirmText="Hapus Kategori"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* ── DIALOG KONFIRMASI HAPUS BULK ── */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title={`Hapus ${selectedIds.length} Kategori Terpilih?`}
        description={`Apakah Anda yakin ingin menghapus ${selectedIds.length} kategori terpilih? Tindakan ini permanen.`}
        confirmText="Hapus Semua Terpilih"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
