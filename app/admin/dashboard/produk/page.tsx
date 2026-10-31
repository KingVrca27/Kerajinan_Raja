"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit2, Trash2, X, Package,
  AlertTriangle, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Loader2,
  CheckCircle2, XCircle, Star, StarOff,
  Filter, ArrowUpDown,
} from "lucide-react";
import productAdminRepository from "@/src/lib/productAdminRepository";
import categoryRepository from "@/src/lib/categoryRepository";
import { uploadPendingImages } from "@/src/lib/imageRepository";
import ProductImageGallery from "@/src/components/admin/ProductImageGallery";
import {
  type AdminProduct,
  type ProductFormData,
  DEFAULT_PRODUCT_FORM,
} from "@/src/types/productAdmin";
import { formatRupiah } from "@/src/lib/currency";
import { useToast } from "@/src/context/ToastContext";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import BulkActionBar from "@/src/components/ui/BulkActionBar";
import { TableSkeleton } from "@/src/components/ui/Skeleton";
import EmptyState from "@/src/components/ui/EmptyState";

// =============================================================================
// CONSTANTS
// =============================================================================

const PAGE_SIZE = 10;

type SortKey = "newest" | "name_asc" | "name_desc" | "price_asc" | "price_desc" | "stock_asc";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Terbaru" },
  { value: "name_asc", label: "Nama A → Z" },
  { value: "name_desc", label: "Nama Z → A" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
  { value: "stock_asc", label: "Stok Terendah" },
];

// =============================================================================
// HELPER FUNCTIONS
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

/** Konversi AdminProduct → ProductFormData untuk mode edit */
function adminProductToForm(p: AdminProduct): ProductFormData {
  return {
    name: p.name,
    sku: p.sku ?? "",
    slug: p.slug,
    category_id: p.category_id,
    short_description: p.short_description ?? "",
    description: p.description ?? "",
    price: String(p.price),
    discount_price: p.discount_price !== null ? String(p.discount_price) : "",
    stock: String(p.stock),
    minimum_stock: String(p.minimum_stock),
    weight_gram: p.weight_gram !== null ? String(p.weight_gram) : "",
    length_cm: p.length_cm !== null ? String(p.length_cm) : "",
    width_cm: p.width_cm !== null ? String(p.width_cm) : "",
    height_cm: p.height_cm !== null ? String(p.height_cm) : "",
    status: p.status,
    is_featured: p.is_featured,
    is_active: p.is_active,
    display_order: String(p.display_order),
    meta_title: p.meta_title ?? "",
    meta_description: p.meta_description ?? "",
    allowed_payment_methods: Array.isArray(p.allowed_payment_methods) && p.allowed_payment_methods.length > 0
      ? p.allowed_payment_methods
      : ["COD", "TRANSFER_BANK"],
  };
}



// =============================================================================
// FORM SECTION WRAPPER
// =============================================================================

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="rounded-2xl border border-primary/10 bg-secondary/20 p-4">
    <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">
      {title}
    </h4>
    <div className="space-y-3">{children}</div>
  </div>
);

// =============================================================================
// FORM FIELD WRAPPER
// =============================================================================

const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({
  label, required, hint, children,
}) => (
  <div>
    <label className="mb-1 block text-xs font-semibold uppercase text-text-secondary">
      {label}{required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="mt-0.5 text-[10px] text-text-secondary">{hint}</p>}
  </div>
);

const inputCls = "w-full rounded-xl border border-primary/20 py-2 px-3 text-sm focus:border-primary focus:outline-none bg-white";
const textareaCls = `${inputCls} resize-none`;

// =============================================================================
// HALAMAN ADMIN PRODUK
// =============================================================================

export default function AdminProdukPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  // ── Data ──
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Bulk Selection ──
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // ── Filter & Sort ──
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal ──
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  // ── Form ──
  const [form, setForm] = useState<ProductFormData>(DEFAULT_PRODUCT_FORM);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [formError, setFormError] = useState("");
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const formScrollRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // LOAD DATA
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [prods, cats] = await Promise.all([
      productAdminRepository.getAdminProducts(),
      categoryRepository.getCategoriesForDropdown(),
    ]);
    setProducts(prods);
    setCategories(cats);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // FILTER, SORT & PAGINATION
  // ---------------------------------------------------------------------------

  const filteredAndSorted = useMemo(() => {
    let result = products;

    // Filter pencarian
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q)
      );
    }

    // Filter kategori
    if (filterCategory !== "all") {
      result = result.filter((p) => p.category_id === filterCategory);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "stock_asc": return a.stock - b.stock;
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [products, searchQuery, filterCategory, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const paginated = filteredAndSorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterCategory, sortKey]);

  // ---------------------------------------------------------------------------
  // MODAL HANDLERS
  // ---------------------------------------------------------------------------

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      ...DEFAULT_PRODUCT_FORM,
      category_id: categories[0]?.id ?? "",
    });
    setPendingImages([]);
    setFormError("");
    setIsFormOpen(true);
    setTimeout(() => formScrollRef.current?.scrollTo(0, 0), 50);
  };

  const handleOpenEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setForm(adminProductToForm(product));
    setPendingImages([]);
    setFormError("");
    setIsFormOpen(true);
    setTimeout(() => formScrollRef.current?.scrollTo(0, 0), 50);
  };

  const handleCloseForm = () => {
    if (isSaving) return;
    setIsFormOpen(false);
    setFormError("");
    setEditingProduct(null);
  };

  // ---------------------------------------------------------------------------
  // FORM FIELD UPDATER
  // ---------------------------------------------------------------------------

  const setField = useCallback(
    <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Auto-generate slug dari nama (hanya mode add)
  const handleNameChange = (name: string) => {
    setField("name", name);
    if (!editingProduct) {
      setField("slug", generateSlug(name));
    }
  };

  // ---------------------------------------------------------------------------
  // SUBMIT FORM
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validasi
    if (!form.name.trim()) return setFormError("Nama produk wajib diisi.");
    if (!form.category_id) return setFormError("Pilih kategori produk.");
    if (!form.price || Number(form.price) <= 0) return setFormError("Harga produk harus lebih dari 0.");
    if (
      form.discount_price &&
      Number(form.discount_price) >= Number(form.price)
    ) {
      return setFormError("Harga diskon harus lebih kecil dari harga normal.");
    }
    const validMethods = form.allowed_payment_methods.filter((m) => ["COD", "TRANSFER_BANK"].includes(m));
    if (validMethods.length === 0) return setFormError("Pilih minimal satu metode pembayaran.");

    setIsSaving(true);

    let result;
    if (editingProduct) {
      result = await productAdminRepository.updateProduct(editingProduct.id, form);
    } else {
      result = await productAdminRepository.createProduct(form);
    }

    if (!result.success) {
      setFormError(result.error ?? "Gagal menyimpan produk.");
      setIsSaving(false);
      return;
    }

    // Upload gambar pending (hanya mode add, atau jika ada gambar baru)
    const productId = result.productId ?? editingProduct?.id;
    if (productId && pendingImages.length > 0) {
      setIsUploadingImages(true);
      await uploadPendingImages(productId, pendingImages, form.name);
      setIsUploadingImages(false);
    }

    toastSuccess(
      editingProduct
        ? `Produk "${form.name}" berhasil diperbarui.`
        : `Produk "${form.name}" berhasil ditambahkan.`,
      "Berhasil Menyimpan"
    );
    setIsFormOpen(false);
    await loadData();
    setIsSaving(false);
  };

  // ---------------------------------------------------------------------------
  // DELETE & BULK ACTIONS
  // ---------------------------------------------------------------------------

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    const result = await productAdminRepository.deleteProduct(deleteConfirmId);
    if (!result.success) {
      toastError(result.error ?? "Gagal menghapus produk.", "Gagal Menghapus");
    } else {
      const name = products.find((p) => p.id === deleteConfirmId)?.name ?? "";
      toastSuccess(`Produk "${name}" berhasil dihapus.`, "Berhasil Menghapus");
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmId));
      await loadData();
    }
    setIsDeleting(false);
    setDeleteConfirmId(null);
  };

  const handleBulkActivate = async () => {
    setIsSaving(true);
    for (const id of selectedIds) {
      await productAdminRepository.toggleStatus(id, true);
    }
    toastSuccess(`Berhasil mengaktifkan ${selectedIds.length} produk.`, "Bulk Action");
    setSelectedIds([]);
    await loadData();
    setIsSaving(false);
  };

  const handleBulkDeactivate = async () => {
    setIsSaving(true);
    for (const id of selectedIds) {
      await productAdminRepository.toggleStatus(id, false);
    }
    toastSuccess(`Berhasil menonaktifkan ${selectedIds.length} produk.`, "Bulk Action");
    setSelectedIds([]);
    await loadData();
    setIsSaving(false);
  };

  const handleBulkDeleteConfirm = async () => {
    setIsDeleting(true);
    for (const id of selectedIds) {
      await productAdminRepository.deleteProduct(id);
    }
    toastSuccess(`Berhasil menghapus ${selectedIds.length} produk.`, "Berhasil Menghapus");
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
    await loadData();
    setIsDeleting(false);
  };

  const handleBulkExport = () => {
    const itemsToExport = products.filter((p) => selectedIds.includes(p.id));
    const headers = "ID,Nama,SKU,Harga,Stok,Status\n";
    const rows = itemsToExport
      .map((p) => `"${p.id}","${p.name}","${p.sku || ""}","${p.price}","${p.stock}","${p.status}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-produk-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toastSuccess("File CSV data produk berhasil diunduh.", "Export Selesai");
  };

  // ---------------------------------------------------------------------------
  // TOGGLE STATUS & FEATURED
  // ---------------------------------------------------------------------------

  const handleToggleStatus = async (product: AdminProduct) => {
    setTogglingStatusId(product.id);
    const result = await productAdminRepository.toggleStatus(product.id, !product.is_active);
    if (result.success) {
      toastSuccess(`Status produk "${product.name}" diubah.`, "Berhasil Menyimpan");
      await loadData();
    } else {
      toastError(result.error ?? "Gagal mengubah status.", "Error Action");
    }
    setTogglingStatusId(null);
  };

  const handleToggleFeatured = async (product: AdminProduct) => {
    setTogglingFeaturedId(product.id);
    const result = await productAdminRepository.toggleFeatured(product.id, !product.is_featured);
    if (result.success) {
      toastSuccess(`Status unggulan "${product.name}" diubah.`, "Berhasil Menyimpan");
      await loadData();
    } else {
      toastError(result.error ?? "Gagal mengubah status unggulan.", "Error Action");
    }
    setTogglingFeaturedId(null);
  };

  // ---------------------------------------------------------------------------
  // STATISTICS
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.is_active).length,
    featured: products.filter((p) => p.is_featured).length,
    lowStock: products.filter((p) => p.stock <= p.minimum_stock).length,
  }), [products]);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 font-body">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Manajemen Produk
          </h1>
          <p className="text-xs text-text-secondary sm:text-sm">
            Kelola katalog produk kerajinan tangan dari Supabase Database.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </motion.button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Produk", value: stats.total, color: "text-primary", bg: "bg-primary/10" },
          { label: "Produk Aktif", value: stats.active, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Produk Unggulan", value: stats.featured, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Stok Menipis", value: stats.lowStock, color: "text-red-600", bg: "bg-red-50" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border border-primary/10 ${stat.bg} px-4 py-3`}>
            <p className="text-xs text-text-secondary">{stat.label}</p>
            <p className={`mt-1 text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, SKU, atau slug produk..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {/* Filter Kategori */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 shrink-0 text-text-secondary" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-primary/20 bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-4 w-4 shrink-0 text-text-secondary" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-xl border border-primary/20 bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Result Info ── */}
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>
          Menampilkan <strong className="text-text-primary">{filteredAndSorted.length}</strong> produk
          {(searchQuery || filterCategory !== "all") && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setFilterCategory("all"); setSortKey("newest"); }}
              className="ml-2 text-primary hover:underline font-semibold"
            >
              Reset Filter
            </button>
          )}
        </span>
        {totalPages > 1 && (
          <span>Halaman {currentPage}/{totalPages}</span>
        )}
      </div>

      {/* ── Tabel Produk ── */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          type="produk"
          title={searchQuery || filterCategory !== "all" ? "Produk Tidak Ditemukan" : "Belum Ada Produk"}
          description={searchQuery || filterCategory !== "all" ? "Tidak ada produk yang cocok dengan kriteria pencarian Anda." : "Belum ada produk yang ditambahkan ke katalog toko Anda."}
          actionText={!searchQuery && filterCategory === "all" ? "Tambah Produk Baru" : undefined}
          onAction={!searchQuery && filterCategory === "all" ? handleOpenAdd : undefined}
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
                        paginated.length > 0 &&
                        paginated.every((p) => selectedIds.includes(p.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const pageIds = paginated.map((p) => p.id);
                          setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                        } else {
                          const pageIds = paginated.map((p) => p.id);
                          setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                        }
                      }}
                      className="rounded border-primary/30 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Produk</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Harga</th>
                  <th className="py-3.5 px-4 text-center">Stok</th>
                  <th className="py-3.5 px-4 text-center">Unggulan</th>
                  <th className="py-3.5 px-4 text-center">Aktif</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {paginated.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, product.id]);
                          } else {
                            setSelectedIds((prev) => prev.filter((id) => id !== product.id));
                          }
                        }}
                        className="rounded border-primary/30 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    {/* Produk */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary/60">
                          {product.primary_image ? (
                            <Image
                              src={product.primary_image}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-5 w-5 text-text-secondary/40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-text-primary line-clamp-1">{product.name}</div>
                          <div className="text-xs text-text-secondary font-mono">{product.sku || "—"}</div>
                          <div className="text-[10px] text-text-secondary/70">/{product.slug}</div>
                        </div>
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-4">
                      <span className="rounded-lg bg-secondary/60 px-2 py-0.5 text-xs font-medium text-text-secondary">
                        {product.category_name}
                      </span>
                    </td>

                    {/* Harga */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-primary">{formatRupiah(product.price)}</div>
                      {product.discount_price && (
                        <div className="text-xs text-emerald-600 font-semibold">
                          Diskon: {formatRupiah(product.discount_price)}
                        </div>
                      )}
                    </td>

                    {/* Stok */}
                    <td className="py-3 px-4 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        product.stock <= product.minimum_stock
                          ? "bg-red-100 text-red-600"
                          : product.stock <= product.minimum_stock * 2
                          ? "bg-amber-100 text-amber-600"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {product.stock}
                      </span>
                    </td>

                    {/* Toggle Unggulan */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(product)}
                        disabled={togglingFeaturedId === product.id}
                        title={product.is_featured ? "Batalkan Unggulan" : "Tandai Unggulan"}
                        className="cursor-pointer disabled:cursor-wait"
                      >
                        {togglingFeaturedId === product.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                        ) : product.is_featured ? (
                          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        ) : (
                          <StarOff className="h-5 w-5 text-text-secondary/30 hover:text-amber-400" />
                        )}
                      </button>
                    </td>

                    {/* Toggle Aktif */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(product)}
                        disabled={togglingStatusId === product.id}
                        title={product.is_active ? "Nonaktifkan" : "Aktifkan"}
                        className="cursor-pointer disabled:cursor-wait"
                      >
                        {togglingStatusId === product.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : product.is_active ? (
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
                          onClick={() => handleOpenEdit(product)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                          title="Edit Produk"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(product.id)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                          title="Hapus Produk"
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
                  className="rounded-lg border border-primary/20 p-1.5 text-text-secondary hover:bg-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="rounded-lg border border-primary/20 p-1.5 text-text-secondary hover:bg-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
           MODAL FORM PRODUK (TAMBAH / EDIT)
          ════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              onClick={handleCloseForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative flex w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl"
              style={{ maxHeight: "92vh" }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {editingProduct ? `Edit: ${editingProduct.name}` : "Tambah Produk Baru"}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={isSaving}
                  className="rounded-lg p-1 text-text-secondary hover:bg-primary/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div ref={formScrollRef} className="overflow-y-auto flex-1 px-6 py-4">
                <form id="product-form" onSubmit={handleSubmit} className="space-y-4 text-sm">

                  {/* Error */}
                  {formError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                      {formError}
                    </div>
                  )}

                  {/* ── A. INFORMASI DASAR ── */}
                  <FormSection title="A — Informasi Dasar">
                    <Field label="Nama Produk" required>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Contoh: Vas Kayu Jati Ukir Vintage"
                        className={inputCls}
                      />
                    </Field>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Slug URL" required hint="Hanya huruf kecil, angka, strip">
                        <input
                          type="text"
                          required
                          value={form.slug}
                          onChange={(e) =>
                            setField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                          }
                          placeholder="vas-kayu-jati-ukir"
                          className={`${inputCls} font-mono text-xs`}
                        />
                      </Field>
                      <Field label="SKU / Kode Produk" hint="Opsional, unik">
                        <input
                          type="text"
                          value={form.sku}
                          onChange={(e) => setField("sku", e.target.value.toUpperCase())}
                          placeholder="KR-VAS-001"
                          className={`${inputCls} font-mono text-xs`}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Kategori" required>
                        <select
                          required
                          value={form.category_id}
                          onChange={(e) => setField("category_id", e.target.value)}
                          className={`${inputCls} cursor-pointer`}
                        >
                          <option value="">— Pilih Kategori —</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Status Produk">
                        <select
                          value={form.status}
                          onChange={(e) => setField("status", e.target.value as ProductFormData["status"])}
                          className={`${inputCls} cursor-pointer`}
                        >
                          <option value="active">Active (Aktif)</option>
                          <option value="draft">Draft (Belum Diterbitkan)</option>
                          <option value="inactive">Inactive (Dinonaktifkan)</option>
                          <option value="out_of_stock">Out of Stock (Habis)</option>
                        </select>
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {/* Is Active Toggle */}
                      <button
                        type="button"
                        onClick={() => setField("is_active", !form.is_active)}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer ${
                          form.is_active
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-primary/20 bg-secondary/20 text-text-secondary"
                        }`}
                      >
                        {form.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        {form.is_active ? "Tampil" : "Sembunyikan"}
                      </button>

                      {/* Is Featured Toggle */}
                      <button
                        type="button"
                        onClick={() => setField("is_featured", !form.is_featured)}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer ${
                          form.is_featured
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-primary/20 bg-secondary/20 text-text-secondary"
                        }`}
                      >
                        <Star className={`h-4 w-4 ${form.is_featured ? "fill-amber-500" : ""}`} />
                        {form.is_featured ? "Unggulan" : "Biasa"}
                      </button>

                      {/* Display Order */}
                      <Field label="Urutan" hint="Lebih kecil = lebih atas">
                        <input
                          type="number"
                          min={0}
                          value={form.display_order}
                          onChange={(e) => setField("display_order", e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </FormSection>

                  {/* ── B. DESKRIPSI ── */}
                  <FormSection title="B — Deskripsi">
                    <Field label="Deskripsi Singkat" hint="Maks. 500 karakter, tampil di listing produk">
                      <textarea
                        rows={2}
                        maxLength={500}
                        value={form.short_description}
                        onChange={(e) => setField("short_description", e.target.value)}
                        placeholder="Kerajinan vas kayu jati dengan ukiran motif klasik..."
                        className={textareaCls}
                      />
                    </Field>
                    <Field label="Deskripsi Lengkap" hint="Tampil di halaman detail produk">
                      <textarea
                        rows={4}
                        value={form.description}
                        onChange={(e) => setField("description", e.target.value)}
                        placeholder="Deskripsi lengkap tentang produk, bahan, proses pembuatan, keunikan..."
                        className={textareaCls}
                      />
                    </Field>
                  </FormSection>

                  {/* ── C. HARGA & STOK ── */}
                  <FormSection title="C — Harga &amp; Stok">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Harga Normal (Rp)" required>
                        <input
                          type="number"
                          required
                          min={0}
                          value={form.price}
                          onChange={(e) => setField("price", e.target.value)}
                          placeholder="150000"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Harga Diskon (Rp)" hint="Opsional, harus < harga normal">
                        <input
                          type="number"
                          min={0}
                          value={form.discount_price}
                          onChange={(e) => setField("discount_price", e.target.value)}
                          placeholder="120000"
                          className={inputCls}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Stok Tersedia">
                        <input
                          type="number"
                          min={0}
                          value={form.stock}
                          onChange={(e) => setField("stock", e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Minimum Stok" hint="Notifikasi jika stok ≤ nilai ini">
                        <input
                          type="number"
                          min={0}
                          value={form.minimum_stock}
                          onChange={(e) => setField("minimum_stock", e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </FormSection>

                  {/* ── D. DIMENSI & BERAT ── */}
                  <FormSection title="D — Dimensi &amp; Berat">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Field label="Berat (gram)">
                        <input
                          type="number"
                          min={0}
                          value={form.weight_gram}
                          onChange={(e) => setField("weight_gram", e.target.value)}
                          placeholder="500"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Panjang (cm)">
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          value={form.length_cm}
                          onChange={(e) => setField("length_cm", e.target.value)}
                          placeholder="30"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Lebar (cm)">
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          value={form.width_cm}
                          onChange={(e) => setField("width_cm", e.target.value)}
                          placeholder="20"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Tinggi (cm)">
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          value={form.height_cm}
                          onChange={(e) => setField("height_cm", e.target.value)}
                          placeholder="15"
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </FormSection>

                  {/* ── E. SEO ── */}
                  <FormSection title="E — SEO">
                    <Field label="Meta Title" hint="Maks. 200 karakter. Kosong = gunakan nama produk">
                      <input
                        type="text"
                        maxLength={200}
                        value={form.meta_title}
                        onChange={(e) => setField("meta_title", e.target.value)}
                        placeholder={form.name || "Judul SEO"}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Meta Description" hint="Maks. 500 karakter, tampil di hasil pencarian Google">
                      <textarea
                        rows={2}
                        maxLength={500}
                        value={form.meta_description}
                        onChange={(e) => setField("meta_description", e.target.value)}
                        placeholder="Deskripsi singkat yang menarik untuk mesin pencari..."
                        className={textareaCls}
                      />
                    </Field>
                  </FormSection>

                  {/* ── G. METODE PEMBAYARAN ── */}
                  <FormSection title="G — Metode Pembayaran Produk">
                    <Field
                      label="Metode yang Diizinkan"
                      required
                      hint="Minimal satu metode harus dipilih. Mempengaruhi pilihan yang tampil di checkout."
                    >
                      <div className="flex flex-col gap-2 mt-1">
                        {/* COD */}
                        <label className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                          form.allowed_payment_methods.includes("COD")
                            ? "border-primary bg-primary/5"
                            : "border-primary/20 bg-white hover:bg-secondary/30"
                        }`}>
                          <input
                            type="checkbox"
                            checked={form.allowed_payment_methods.includes("COD")}
                            onChange={(e) => {
                              const current = form.allowed_payment_methods;
                              if (e.target.checked) {
                                setField("allowed_payment_methods", [...current, "COD"].filter((v, i, a) => a.indexOf(v) === i));
                              } else {
                                setField("allowed_payment_methods", current.filter((m) => m !== "COD"));
                              }
                            }}
                            className="h-4 w-4 rounded text-primary border-primary/30 focus:ring-primary"
                          />
                          <div>
                            <p className="text-sm font-semibold text-text-primary">COD (Cash on Delivery)</p>
                            <p className="text-xs text-text-secondary">Pelanggan membayar saat pesanan tiba</p>
                          </div>
                        </label>

                        {/* Transfer Bank */}
                        <label className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                          form.allowed_payment_methods.includes("TRANSFER_BANK")
                            ? "border-primary bg-primary/5"
                            : "border-primary/20 bg-white hover:bg-secondary/30"
                        }`}>
                          <input
                            type="checkbox"
                            checked={form.allowed_payment_methods.includes("TRANSFER_BANK")}
                            onChange={(e) => {
                              const current = form.allowed_payment_methods;
                              if (e.target.checked) {
                                setField("allowed_payment_methods", [...current, "TRANSFER_BANK"].filter((v, i, a) => a.indexOf(v) === i));
                              } else {
                                setField("allowed_payment_methods", current.filter((m) => m !== "TRANSFER_BANK"));
                              }
                            }}
                            className="h-4 w-4 rounded text-primary border-primary/30 focus:ring-primary"
                          />
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Transfer Bank</p>
                            <p className="text-xs text-text-secondary">Pelanggan transfer sebelum pesanan diproses</p>
                          </div>
                        </label>
                      </div>
                      {form.allowed_payment_methods.filter((m) => ["COD", "TRANSFER_BANK"].includes(m)).length === 0 && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">⚠ Pilih minimal satu metode pembayaran</p>
                      )}
                    </Field>
                  </FormSection>

                  {/* ── H. GALERI GAMBAR ── */}
                  <FormSection title="H — Galeri Gambar">
                    <ProductImageGallery
                      productId={editingProduct?.id}
                      onPendingFilesChange={setPendingImages}
                    />
                    {isUploadingImages && (
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Mengupload gambar ke Supabase Storage...
                      </div>
                    )}
                  </FormSection>

                </form>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t border-primary/10 px-6 py-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={isSaving}
                  className="rounded-xl border border-primary/20 px-5 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="product-form"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-xs font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-70 cursor-pointer disabled:cursor-wait"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BULK ACTION BAR ── */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={products.length}
        onSelectAll={() => setSelectedIds(products.map((p) => p.id))}
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
        title="Hapus Produk Ini?"
        description="Produk akan dihapus secara permanen dari katalog toko Anda. Gambar dan data terkait di database akan terhapus. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Produk"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* ── DIALOG KONFIRMASI HAPUS BULK ── */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title={`Hapus ${selectedIds.length} Produk Terpilih?`}
        description={`Apakah Anda yakin ingin menghapus ${selectedIds.length} produk terpilih? Tindakan ini permanen dan tidak dapat dibatalkan.`}
        confirmText="Hapus Semua Terpilih"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
