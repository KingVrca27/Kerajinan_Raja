/**
 * @file app/admin/dashboard/cms/banner/page.tsx
 *
 * Halaman CRUD Hero Banner.
 * Repository: heroBannerRepository (cmsRepository.ts)
 * Storage   : Supabase cms-assets/banners/
 *
 * Fitur:
 *   - Daftar banner dengan thumbnail preview
 *   - Tambah / Edit (modal form + upload gambar)
 *   - Hapus dengan konfirmasi
 *   - Toggle status aktif inline
 *   - Field: Judul, Subjudul, Gambar, CTA Text, CTA Link,
 *            Display Order, Status Aktif, Jadwal Tampil (opsional)
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2,
  Loader2, ImageIcon, ToggleLeft, ToggleRight, Upload,
  Calendar, Link2, ArrowUpDown, Eye, EyeOff,
} from "lucide-react";
import Image from "next/image";
import {
  heroBannerRepository,
  uploadCmsImage,
  deleteCmsImageByUrl,
  type DbHeroBanner,
} from "@/src/lib/cmsRepository";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface BannerForm {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  sortOrder: number;
  isActive: boolean;
  scheduleStart: string;
  scheduleEnd: string;
}

const DEFAULT_FORM: BannerForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaText: "",
  ctaLink: "",
  sortOrder: 0,
  isActive: true,
  scheduleStart: "",
  scheduleEnd: "",
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------

export default function AdminBannerPage() {
  const [banners, setBanners] = useState<DbHeroBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<BannerForm>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BannerForm, string>>>({});
  const [uploadProgress, setUploadProgress] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Toast
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Load
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await heroBannerRepository.getAll();
      setBanners(data);
    } catch {
      showToast("error", "Gagal memuat data banner.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Validate
  function validate() {
    const errs: Partial<Record<keyof BannerForm, string>> = {};
    if (!form.title.trim()) errs.title = "Judul wajib diisi.";
    if (!form.imageUrl.trim()) errs.imageUrl = "Gambar wajib diunggah.";
    if (form.sortOrder < 0) errs.sortOrder = "Urutan tidak boleh negatif.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Open modals
  const openAdd = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setFormErrors({});
    setShowSchedule(false);
    setIsModalOpen(true);
  };

  const openEdit = (b: DbHeroBanner) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle ?? "",
      imageUrl: b.image_url,
      ctaText: b.link_text ?? "",
      ctaLink: b.link_url ?? "",
      sortOrder: b.sort_order,
      isActive: b.is_active,
      scheduleStart: b.schedule_start ?? "",
      scheduleEnd: b.schedule_end ?? "",
    });
    setFormErrors({});
    setShowSchedule(!!(b.schedule_start || b.schedule_end));
    setIsModalOpen(true);
  };

  // Upload image
  const handleImageUpload = async (file: File) => {
    setUploadProgress(true);
    try {
      const result = await uploadCmsImage(file, "banners");
      if (!result) throw new Error("Upload gagal.");
      setForm((prev) => ({ ...prev, imageUrl: result.url }));
      setFormErrors((prev) => ({ ...prev, imageUrl: undefined }));
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Upload gambar gagal.");
    } finally {
      setUploadProgress(false);
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload: Omit<DbHeroBanner, "id" | "created_at" | "updated_at"> = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        image_url: form.imageUrl,
        link_text: form.ctaText.trim() || null,
        link_url: form.ctaLink.trim() || null,
        sort_order: Number(form.sortOrder),
        is_active: form.isActive,
        schedule_start: form.scheduleStart || null,
        schedule_end: form.scheduleEnd || null,
        type: "hero",
        promo_code: null,
      };

      const result = editingId
        ? await heroBannerRepository.update(editingId, payload)
        : await heroBannerRepository.create(payload);

      if (!result.success) throw new Error(result.error);
      showToast("success", editingId ? "Banner berhasil diperbarui." : "Banner baru berhasil ditambahkan.");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menyimpan banner.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    setIsSaving(true);
    try {
      const banner = banners.find((b) => b.id === id);
      if (banner?.image_url) await deleteCmsImageByUrl(banner.image_url);
      const result = await heroBannerRepository.delete(id);
      if (!result.success) throw new Error(result.error);
      showToast("success", "Banner berhasil dihapus.");
      setDeleteId(null);
      await loadData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menghapus banner.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle
  const handleToggle = async (b: DbHeroBanner) => {
    try {
      const result = await heroBannerRepository.toggleStatus(b.id, !b.is_active);
      if (!result.success) throw new Error(result.error);
      await loadData();
    } catch {
      showToast("error", "Gagal mengubah status banner.");
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6 font-body">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
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
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Hero Banner</h1>
          <p className="text-xs text-text-secondary sm:text-sm mt-1">
            Kelola banner slider halaman beranda. Gambar tersimpan di Supabase Storage.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={openAdd} type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Banner</span>
        </motion.button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Memuat data banner...</span>
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border border-primary/10 bg-white p-12 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-primary/30 mb-3" />
          <p className="text-sm font-semibold text-text-secondary">Belum ada banner. Klik &apos;Tambah Banner&apos; untuk mulai.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 rounded-2xl border bg-white p-4 shadow-xs transition-all hover:border-primary/30 ${
                b.is_active ? "border-primary/10" : "border-gray-200 opacity-60"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-secondary/40">
                {b.image_url ? (
                  <Image src={b.image_url} alt={b.title} fill className="object-cover" sizes="128px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-text-secondary/40">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading text-sm font-bold text-text-primary truncate">{b.title}</h3>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${b.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {b.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                {b.subtitle && <p className="mt-0.5 text-xs text-text-secondary truncate">{b.subtitle}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-text-secondary">
                  <span className="flex items-center gap-1"><ArrowUpDown className="h-3 w-3" /> Urutan: {b.sort_order}</span>
                  {b.link_url && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" /> {b.link_text || "CTA Link"}</span>}
                  {b.schedule_start && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(b.schedule_start)} – {formatDate(b.schedule_end)}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button" onClick={() => handleToggle(b)} title={b.is_active ? "Nonaktifkan" : "Aktifkan"}
                  className="rounded-lg p-1.5 text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                >
                  {b.is_active ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  type="button" onClick={() => openEdit(b)} title="Edit Banner"
                  className="rounded-lg p-1.5 text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button" onClick={() => setDeleteId(b.id)} title="Hapus Banner"
                  className="rounded-lg p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── MODAL ADD/EDIT ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative mt-8 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-primary/10 pb-4 mb-4">
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {editingId ? "Edit Banner" : "Tambah Banner Baru"}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}
                  className="rounded-lg p-1 text-text-secondary hover:bg-primary/10">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">

                {/* Judul */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Judul <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Putra Art Shop — Asli Lombok"
                    className={`w-full rounded-xl border py-2.5 px-3 focus:border-primary focus:outline-none ${formErrors.title ? "border-red-400" : "border-primary/20"}`}
                  />
                  {formErrors.title && <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>}
                </div>

                {/* Subjudul */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Subjudul</label>
                  <input type="text" value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="Teks pendek di bawah judul utama..."
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Upload Gambar */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Gambar Banner <span className="text-red-500">*</span>
                  </label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                  />

                  {form.imageUrl ? (
                    <div className="relative h-36 rounded-xl overflow-hidden border border-primary/10 group">
                      <Image src={form.imageUrl} alt="Preview" fill className="object-cover" sizes="560px" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => fileRef.current?.click()}
                          className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-text-primary shadow">
                          Ganti Gambar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button" onClick={() => fileRef.current?.click()} disabled={uploadProgress}
                      className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors cursor-pointer ${
                        formErrors.imageUrl ? "border-red-400 bg-red-50" : "border-primary/20 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40"
                      }`}
                    >
                      {uploadProgress
                        ? <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        : <Upload className="h-6 w-6 text-primary/60" />}
                      <span className="text-xs text-text-secondary">
                        {uploadProgress ? "Mengunggah..." : "Klik untuk upload gambar (JPG, PNG, WEBP — max 5 MB)"}
                      </span>
                    </button>
                  )}
                  {formErrors.imageUrl && <p className="mt-1 text-xs text-red-500">{formErrors.imageUrl}</p>}
                </div>

                {/* CTA */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">CTA Text</label>
                    <input type="text" value={form.ctaText}
                      onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                      placeholder="Belanja Sekarang"
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">CTA Link</label>
                    <input type="text" value={form.ctaLink}
                      onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                      placeholder="/produk"
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Order & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                      <span className="flex items-center gap-1"><ArrowUpDown className="h-3 w-3" /> Urutan</span>
                    </label>
                    <input type="number" min={0} value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-0.5">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div onClick={() => setForm({ ...form, isActive: !form.isActive })}
                        className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? "bg-emerald-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                      </div>
                      <span className="text-sm font-medium text-text-primary">Status Aktif</span>
                    </label>
                  </div>
                </div>

                {/* Jadwal Tampil */}
                <div>
                  <button type="button"
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                  >
                    {showSchedule ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showSchedule ? "Sembunyikan Jadwal" : "Atur Jadwal Tampil (Opsional)"}
                  </button>
                  <AnimatePresence>
                    {showSchedule && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Mulai Tampil</span>
                            </label>
                            <input type="datetime-local" value={form.scheduleStart}
                              onChange={(e) => setForm({ ...form, scheduleStart: e.target.value })}
                              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Selesai Tampil</span>
                            </label>
                            <input type="datetime-local" value={form.scheduleEnd}
                              onChange={(e) => setForm({ ...form, scheduleEnd: e.target.value })}
                              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>
                        <p className="mt-1.5 text-[11px] text-text-secondary">
                          Kosongkan jika tidak menggunakan jadwal otomatis.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t border-primary/10 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}
                    className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40 disabled:opacity-50">
                    Batal
                  </button>
                  <button type="submit" disabled={isSaving || uploadProgress}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-60">
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Simpan Banner
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL DELETE ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isSaving && setDeleteId(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-text-primary">Hapus Banner Ini?</h3>
              <p className="mt-1 font-body text-xs text-text-secondary">
                Banner beserta gambarnya akan dihapus permanen dari database dan Storage.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button type="button" onClick={() => setDeleteId(null)} disabled={isSaving}
                  className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40 disabled:opacity-50">
                  Batal
                </button>
                <button type="button" onClick={() => handleDelete(deleteId)} disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-red-700 disabled:opacity-60">
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Hapus Banner
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
