/**
 * @file app/admin/dashboard/promosi/page.tsx
 * Halaman Manajemen Promosi & Kode Voucher (Promotion Management) — FASE 4.5.1
 *
 * STEP 6G-3: Integrasi Promo Banner
 *   - Section "Banner Promo" ditambahkan di dalam form modal promo
 *   - Banner disimpan di hero_banners (type='promo', promo_code=kode promo)
 *   - Upload ke bucket Promo_Banner
 *   - Jika promo code diubah, promo_code pada banner ikut diperbarui
 *   - Delete promo → hapus banner terkait terlebih dahulu (cegah orphan)
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag, Plus, Search, Edit2, Trash2, X, CheckCircle2, AlertTriangle, Loader2,
  Calendar, Percent, DollarSign, ToggleLeft, ToggleRight, Sparkles,
  Image as ImageIcon, Upload, RefreshCw, Trash, Eye, EyeOff, Link2, AlignLeft, SortAsc, Clock
} from "lucide-react";
import { promotionRepository } from "@/src/lib/promotionRepository";
import {
  getBannerByPromoCode,
  uploadPromoBannerFile,
  deletePromoBannerFile,
  createPromoBanner,
  updatePromoBanner,
  updateBannerPromoCode,
  deletePromoBanner,
} from "@/src/lib/promotionRepository";
import type { DbPromotion, PromotionType } from "@/src/types/ops";
import type { DbHeroBanner } from "@/src/lib/cmsRepository";

function formatRupiah(num: number): string {
  return "Rp " + Number(num || 0).toLocaleString("id-ID");
}

function formatDate(iso: string | null): string {
  if (!iso) return "Selamanya";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

const DEFAULT_FORM = {
  code: "",
  name: "",
  description: "",
  type: "percentage" as PromotionType,
  value: 10,
  min_purchase: 0,
  max_discount: "",
  usage_limit: "",
  is_active: true,
  starts_at: "",
  expires_at: "",
};

const DEFAULT_BANNER_FORM = {
  title: "",
  subtitle: "",
  link_url: "",
  link_text: "",
  sort_order: 0,
  is_active: true,
  schedule_start: "",
  schedule_end: "",
};

export default function AdminPromosiPage() {
  // ─── Promo State ───────────────────────────────────────────────────────────
  const [promotions, setPromotions] = useState<DbPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null); // code promo saat dibuka edit
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ─── Banner State ──────────────────────────────────────────────────────────
  const [bannerData, setBannerData] = useState<DbHeroBanner | null>(null);
  const [bannerForm, setBannerForm] = useState(DEFAULT_BANNER_FORM);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [isBannerLoading, setIsBannerLoading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isDeletingBanner, setIsDeletingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Load Promo List ───────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await promotionRepository.getAll();
      setPromotions(list);
    } catch {
      showToast("error", "Gagal memuat daftar promosi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredPromos = useMemo(() => {
    return promotions.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
      );
    });
  }, [promotions, searchQuery]);

  // ─── Banner: Load by promo code ────────────────────────────────────────────
  const loadBannerForCode = useCallback(async (code: string) => {
    setIsBannerLoading(true);
    setBannerData(null);
    setBannerPreviewUrl(null);
    setBannerError(null);
    try {
      const banner = await getBannerByPromoCode(code);
      if (banner) {
        setBannerData(banner);
        setBannerPreviewUrl(banner.image_url);
        setBannerForm({
          title: banner.title || "",
          subtitle: banner.subtitle || "",
          link_url: banner.link_url || "",
          link_text: banner.link_text || "",
          sort_order: banner.sort_order,
          is_active: banner.is_active,
          schedule_start: banner.schedule_start
            ? new Date(banner.schedule_start).toISOString().slice(0, 16) : "",
          schedule_end: banner.schedule_end
            ? new Date(banner.schedule_end).toISOString().slice(0, 16) : "",
        });
      } else {
        setBannerForm(DEFAULT_BANNER_FORM);
      }
    } catch {
      setBannerError("Gagal memuat banner promo.");
    } finally {
      setIsBannerLoading(false);
    }
  }, []);

  // ─── Modal: Open Add ──────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingId(null);
    setEditingCode(null);
    setFormData(DEFAULT_FORM);
    setBannerData(null);
    setBannerFile(null);
    setBannerPreviewUrl(null);
    setBannerForm(DEFAULT_BANNER_FORM);
    setBannerError(null);
    setIsModalOpen(true);
  };

  // ─── Modal: Open Edit ─────────────────────────────────────────────────────
  const openEditModal = async (p: DbPromotion) => {
    setEditingId(p.id);
    setEditingCode(p.code);
    setFormData({
      code: p.code,
      name: p.name,
      description: p.description || "",
      type: p.type,
      value: p.value,
      min_purchase: p.min_purchase,
      max_discount: p.max_discount ? String(p.max_discount) : "",
      usage_limit: p.usage_limit ? String(p.usage_limit) : "",
      is_active: p.is_active,
      starts_at: p.starts_at ? new Date(p.starts_at).toISOString().slice(0, 16) : "",
      expires_at: p.expires_at ? new Date(p.expires_at).toISOString().slice(0, 16) : "",
    });
    setBannerFile(null);
    setBannerError(null);
    setIsModalOpen(true);
    // Load banner async setelah modal terbuka
    await loadBannerForCode(p.code);
  };

  // ─── Banner: File picker ───────────────────────────────────────────────────
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    // Preview lokal menggunakan object URL
    const objUrl = URL.createObjectURL(file);
    setBannerPreviewUrl(objUrl);
    setBannerError(null);
    // Auto-fill title jika kosong
    if (!bannerForm.title) {
      setBannerForm(prev => ({
        ...prev,
        title: formData.name || formData.code || "Banner Promo",
      }));
    }
  };

  // ─── Banner: Remove picked file ───────────────────────────────────────────
  const handleRemoveBannerFile = () => {
    setBannerFile(null);
    setBannerPreviewUrl(bannerData?.image_url || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Banner: Delete existing banner ───────────────────────────────────────
  const handleDeleteBanner = async () => {
    if (!bannerData) return;
    setIsDeletingBanner(true);
    try {
      const res = await deletePromoBanner(bannerData.id, bannerData.image_url);
      if (!res.success) throw new Error(res.error);
      setBannerData(null);
      setBannerFile(null);
      setBannerPreviewUrl(null);
      setBannerForm(DEFAULT_BANNER_FORM);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("success", "Banner promo berhasil dihapus. Promo tetap tersimpan.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menghapus banner.");
    } finally {
      setIsDeletingBanner(false);
    }
  };

  // ─── Helper: Build banner payload ─────────────────────────────────────────
  const buildBannerPayload = (code: string, imageUrl: string) => ({
    image_url: imageUrl,
    title: bannerForm.title.trim() || `Banner Promo ${code}`,
    subtitle: bannerForm.subtitle.trim() || null,
    link_url: bannerForm.link_url.trim() || null,
    link_text: bannerForm.link_text.trim() || null,
    is_active: bannerForm.is_active,
    sort_order: Number(bannerForm.sort_order) || 0,
    schedule_start: bannerForm.schedule_start ? new Date(bannerForm.schedule_start).toISOString() : null,
    schedule_end: bannerForm.schedule_end ? new Date(bannerForm.schedule_end).toISOString() : null,
  });

  // ─── Main Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || formData.value <= 0) {
      showToast("error", "Kode, nama, dan nilai diskon wajib diisi.");
      return;
    }
    setIsSaving(true);
    setBannerError(null);

    const newCode = formData.code.toUpperCase().trim();

    try {
      // ── 1. Simpan data promo ──────────────────────────────────────────────
      const promoPayload = {
        code: newCode,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        value: Number(formData.value),
        min_purchase: Number(formData.min_purchase || 0),
        max_discount: formData.max_discount ? Number(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        is_active: formData.is_active,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      };

      const promoRes = editingId
        ? await promotionRepository.update(editingId, promoPayload)
        : await promotionRepository.create(promoPayload);

      if (!promoRes.success) throw new Error(promoRes.error);

      // ── 2. Sinkronisasi banner jika code promo berubah ────────────────────
      const codeChanged = editingId && editingCode && editingCode !== newCode;
      if (codeChanged && bannerData) {
        const syncRes = await updateBannerPromoCode(bannerData.id, newCode);
        if (!syncRes.success) {
          console.warn("[promosi] Gagal sync promo_code pada banner:", syncRes.error);
        }
      }

      // ── 3. Handle banner ──────────────────────────────────────────────────
      let bannerWarning: string | null = null;

      if (bannerFile) {
        setIsUploadingBanner(true);
        try {
          const uploaded = await uploadPromoBannerFile(bannerFile);
          if (!uploaded) {
            bannerWarning = "Upload banner gagal. Promo disimpan, tetapi banner tidak terupload.";
          } else {
            const bannerPayload = buildBannerPayload(newCode, uploaded.url);

            if (bannerData) {
              // Replace: update DB dulu, baru hapus file lama
              const oldImageUrl = bannerData.image_url;
              const updateRes = await updatePromoBanner(bannerData.id, bannerPayload);
              if (!updateRes.success) {
                bannerWarning = `Banner diupload tetapi gagal diperbarui di database: ${updateRes.error}`;
                // Rollback: hapus file baru karena DB gagal
                await deletePromoBannerFile(uploaded.url);
              } else {
                // Hapus file lama setelah DB berhasil diperbarui
                if (oldImageUrl && oldImageUrl !== uploaded.url) {
                  await deletePromoBannerFile(oldImageUrl);
                }
                setBannerData(prev => prev ? { ...prev, ...bannerPayload } : prev);
              }
            } else {
              // Create banner baru
              const createRes = await createPromoBanner(newCode, bannerPayload);
              if (!createRes.success) {
                bannerWarning = `Banner diupload tetapi gagal disimpan: ${createRes.error}`;
                // Rollback: hapus file yang terlanjur terupload
                await deletePromoBannerFile(uploaded.url);
              }
            }
          }
        } finally {
          setIsUploadingBanner(false);
        }
      } else if (bannerData && !bannerFile) {
        // Tidak ada file baru, tapi update metadata banner jika ada perubahan
        const metadataPayload = {
          title: bannerForm.title.trim() || `Banner Promo ${newCode}`,
          subtitle: bannerForm.subtitle.trim() || null,
          link_url: bannerForm.link_url.trim() || null,
          link_text: bannerForm.link_text.trim() || null,
          is_active: bannerForm.is_active,
          sort_order: Number(bannerForm.sort_order) || 0,
          schedule_start: bannerForm.schedule_start ? new Date(bannerForm.schedule_start).toISOString() : null,
          schedule_end: bannerForm.schedule_end ? new Date(bannerForm.schedule_end).toISOString() : null,
        };
        const updateRes = await updatePromoBanner(bannerData.id, metadataPayload);
        if (!updateRes.success) {
          bannerWarning = `Data promo disimpan, tetapi metadata banner gagal diperbarui.`;
        }
      }

      // ── 4. Feedback & close ───────────────────────────────────────────────
      if (bannerWarning) {
        showToast("error", bannerWarning);
      } else {
        showToast("success", editingId ? "Promosi berhasil diperbarui." : "Kode promo baru berhasil dibuat!");
      }

      setIsModalOpen(false);
      setBannerFile(null);
      await loadData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menyimpan promosi.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Toggle promo active ───────────────────────────────────────────────────
  const handleToggle = async (p: DbPromotion) => {
    try {
      const res = await promotionRepository.toggleActive(p.id, !p.is_active);
      if (!res.success) throw new Error(res.error);
      showToast("success", `Status voucher ${p.code} diperbarui.`);
      await loadData();
    } catch {
      showToast("error", "Gagal mengubah status promosi.");
    }
  };

  // ─── Delete promo (+ banner terkait) ─────────────────────────────────────
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await promotionRepository.delete(id, deleteCode || undefined);
      if (!res.success) throw new Error(res.error);
      showToast("success", "Promosi berhasil dihapus.");
      setDeleteId(null);
      setDeleteCode(null);
      await loadData();
    } catch {
      showToast("error", "Gagal menghapus promosi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const closeModal = () => {
    if (isSaving || isUploadingBanner) return;
    setIsModalOpen(false);
    setBannerFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-body">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`fixed top-5 right-5 z-[200] flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg ${
              toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Manajemen Promosi &amp; Voucher</h1>
          <p className="text-xs text-text-secondary sm:text-sm mt-1">
            Kelola kode diskon, voucher belanja, periode promosi, dan banner visual promo.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Promo Baru</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari Kode Promo atau Nama Promo..."
          className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat daftar promosi...</span>
        </div>
      ) : filteredPromos.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center text-sm text-text-secondary">
          <Tag className="mx-auto h-12 w-12 text-primary/30 mb-3" />
          <p className="font-semibold">Belum ada promo terdaftar.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-primary/10 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-secondary/30 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="py-3.5 px-4">Kode Promo</th>
                  <th className="py-3.5 px-4">Nama Promo</th>
                  <th className="py-3.5 px-4 text-center">Diskon</th>
                  <th className="py-3.5 px-4 text-right">Min. Belanja</th>
                  <th className="py-3.5 px-4 text-center">Pemakaian</th>
                  <th className="py-3.5 px-4">Periode</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {filteredPromos.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs border border-primary/20">
                        {p.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary">{p.name}</div>
                      {p.description && <div className="text-xs text-text-secondary truncate max-w-xs">{p.description}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                      {p.type === "percentage" ? `${p.value}%` : formatRupiah(p.value)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-text-primary">
                      {formatRupiah(p.min_purchase)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs">
                      <span className="font-bold text-text-primary">{p.usage_count}</span>
                      <span className="text-text-secondary"> / {p.usage_limit || "∞"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary">
                      {formatDate(p.starts_at)} – {formatDate(p.expires_at)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(p)}
                        className="cursor-pointer"
                      >
                        {p.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-500">
                            Nonaktif
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDeleteId(p.id); setDeleteCode(p.code); }}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* ─── FORM MODAL ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={closeModal} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
                <h3 className="font-heading text-base font-bold text-text-primary flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {editingId ? "Edit Kode Promo" : "Buat Kode Promo Baru"}
                </h3>
                <button type="button" onClick={closeModal} className="rounded-xl p-1 text-text-secondary hover:bg-primary/10">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-6 text-sm">

                {/* ── SECTION A: Data Promo ────────────────────────────── */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary border-b border-primary/5 pb-2">
                    Data Promo &amp; Voucher
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Kode Voucher *</label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="RAJA10"
                        className="w-full rounded-xl border border-primary/20 py-2 px-3 uppercase font-mono font-bold focus:border-primary focus:outline-none"
                      />
                      {/* Peringatan jika code berubah dan ada banner terkait */}
                      {editingId && bannerData && formData.code.toUpperCase().trim() !== (editingCode || "") && (
                        <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Kode berubah — banner akan disinkronkan otomatis.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Nama Promo *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Diskon Pembukaan Toko"
                        className="w-full rounded-xl border border-primary/20 py-2 px-3 focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Deskripsi</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Deskripsi singkat promo ini..."
                      className="w-full rounded-xl border border-primary/20 py-2 px-3 text-sm resize-none focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Tipe Diskon *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as PromotionType })}
                        className="w-full rounded-xl border border-primary/20 py-2 px-3 focus:border-primary focus:outline-none"
                      >
                        <option value="percentage">Persentase (%)</option>
                        <option value="fixed">Nominal (Rupiah)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                        {formData.type === "percentage" ? "Nilai Diskon (%)" : "Nilai Diskon (Rp)"} *
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                        className="w-full rounded-xl border border-primary/20 py-2 px-3 focus:border-primary focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Min. Belanja (Rp)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.min_purchase}
                        onChange={(e) => setFormData({ ...formData, min_purchase: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full rounded-xl border border-primary/20 py-2 px-3 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Batas Maks. Diskon (Rp)</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.max_discount}
                        onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                        placeholder="Kosongkan jika tak terbatas"
                        className="w-full rounded-xl border border-primary/20 py-2 px-3 focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Kuota Pemakaian</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.usage_limit}
                        onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                        placeholder="Kosongkan jika tak terbatas"
                        className="w-full rounded-xl border border-primary/20 py-2 px-3 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                      <label className="text-xs font-semibold uppercase text-text-secondary">Status Promo</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        {formData.is_active
                          ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700"><ToggleRight className="h-3.5 w-3.5" />Aktif</span>
                          : <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500"><ToggleLeft className="h-3.5 w-3.5" />Nonaktif</span>
                        }
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Tanggal Mulai</label>
                      <input
                        type="datetime-local"
                        value={formData.starts_at}
                        onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                        className="w-full rounded-xl border border-primary/20 py-2 px-3 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Tanggal Berakhir</label>
                      <input
                        type="datetime-local"
                        value={formData.expires_at}
                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                        className="w-full rounded-xl border border-primary/20 py-2 px-3 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ── SECTION B: Banner Promo ──────────────────────────── */}
                <div className="space-y-4 rounded-2xl border border-primary/10 bg-secondary/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                        Banner Promo
                      </h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Tambahkan gambar visual untuk menampilkan promo ini di website.
                      </p>
                    </div>
                    {isBannerLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </div>

                  {/* Upload area */}
                  {!bannerPreviewUrl ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-white py-8 px-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <Upload className="h-7 w-7 text-primary/40" />
                      <span className="text-xs font-semibold text-text-secondary">Klik untuk upload banner</span>
                      <span className="text-xs text-text-secondary/70">JPG, PNG, WEBP — maks. 5 MB</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Preview */}
                      <div className="relative rounded-xl overflow-hidden border border-primary/10 bg-white aspect-[3/1]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={bannerPreviewUrl}
                          alt="Preview banner promo"
                          className="w-full h-full object-cover"
                        />
                        {bannerFile && (
                          <div className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                            Baru — belum tersimpan
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingBanner || isDeletingBanner}
                          className="flex items-center gap-1.5 rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-primary/5 disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          {bannerData ? "Ganti Banner" : "Ganti Gambar"}
                        </button>
                        {bannerFile && (
                          <button
                            type="button"
                            onClick={handleRemoveBannerFile}
                            disabled={isUploadingBanner}
                            className="flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-50 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                            Batalkan Pilihan
                          </button>
                        )}
                        {bannerData && !bannerFile && (
                          <button
                            type="button"
                            onClick={handleDeleteBanner}
                            disabled={isDeletingBanner || isSaving}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                          >
                            {isDeletingBanner
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash className="h-3.5 w-3.5" />
                            }
                            Hapus Banner
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleBannerFileChange}
                  />

                  {/* Banner error */}
                  {bannerError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {bannerError}
                    </p>
                  )}

                  {/* Banner metadata (tampil jika ada preview) */}
                  {bannerPreviewUrl && (
                    <div className="grid grid-cols-1 gap-3 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                            <AlignLeft className="inline h-3 w-3 mr-1" />Judul Banner
                          </label>
                          <input
                            type="text"
                            value={bannerForm.title}
                            onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                            placeholder={`Banner Promo ${formData.code || ""}`}
                            className="w-full rounded-xl border border-primary/20 bg-white py-2 px-3 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                            Subjudul
                          </label>
                          <input
                            type="text"
                            value={bannerForm.subtitle}
                            onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                            placeholder="Hemat hingga 50% untuk semua produk"
                            className="w-full rounded-xl border border-primary/20 bg-white py-2 px-3 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                            <Link2 className="inline h-3 w-3 mr-1" />Link URL
                          </label>
                          <input
                            type="text"
                            value={bannerForm.link_url}
                            onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                            placeholder="/produk atau https://..."
                            className="w-full rounded-xl border border-primary/20 bg-white py-2 px-3 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                            Teks Tombol
                          </label>
                          <input
                            type="text"
                            value={bannerForm.link_text}
                            onChange={(e) => setBannerForm({ ...bannerForm, link_text: e.target.value })}
                            placeholder="Belanja Sekarang"
                            className="w-full rounded-xl border border-primary/20 bg-white py-2 px-3 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                            <SortAsc className="inline h-3 w-3 mr-1" />Urutan
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={bannerForm.sort_order}
                            onChange={(e) => setBannerForm({ ...bannerForm, sort_order: Number(e.target.value) })}
                            className="w-full rounded-xl border border-primary/20 bg-white py-2 px-3 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                            <Clock className="inline h-3 w-3 mr-1" />Jadwal Mulai
                          </label>
                          <input
                            type="datetime-local"
                            value={bannerForm.schedule_start}
                            onChange={(e) => setBannerForm({ ...bannerForm, schedule_start: e.target.value })}
                            className="w-full rounded-xl border border-primary/20 bg-white py-2 px-3 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                            Jadwal Selesai
                          </label>
                          <input
                            type="datetime-local"
                            value={bannerForm.schedule_end}
                            onChange={(e) => setBannerForm({ ...bannerForm, schedule_end: e.target.value })}
                            className="w-full rounded-xl border border-primary/20 bg-white py-2 px-3 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Banner active status */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold uppercase text-text-secondary">Status Banner</label>
                        <button
                          type="button"
                          onClick={() => setBannerForm({ ...bannerForm, is_active: !bannerForm.is_active })}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          {bannerForm.is_active
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700"><Eye className="h-3 w-3" />Ditampilkan</span>
                            : <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500"><EyeOff className="h-3 w-3" />Disembunyikan</span>
                          }
                        </button>
                        <span className="text-xs text-text-secondary/60">(terpisah dari status promo)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── ACTIONS ──────────────────────────────────────────── */}
                <div className="flex justify-end gap-2 border-t border-primary/10 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSaving || isUploadingBanner}
                    className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploadingBanner || isDeletingBanner}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60"
                  >
                    {(isSaving || isUploadingBanner) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {isUploadingBanner ? "Mengupload Banner..." : isSaving ? "Menyimpan..." : "Simpan Promo"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => !isDeleting && setDeleteId(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-text-primary">Hapus Promo Ini?</h3>
              <p className="mt-1 font-body text-xs text-text-secondary">Kode voucher akan dihapus permanen.</p>
              {deleteCode && (
                <p className="mt-1 font-body text-xs text-amber-600">
                  Banner promo terkait juga akan dihapus.
                </p>
              )}
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => { setDeleteId(null); setDeleteCode(null); }}
                  disabled={isDeleting}
                  className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteId)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-700 disabled:opacity-60"
                >
                  {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
