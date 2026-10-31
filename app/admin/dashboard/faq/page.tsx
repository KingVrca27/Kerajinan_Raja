/**
 * @file app/admin/dashboard/faq/page.tsx
 *
 * Halaman CRUD FAQ — Migrasi dari adminStorage (localStorage) ke Supabase.
 * Menggunakan faqRepository dari cmsRepository.ts (Repository Pattern).
 *
 * Fitur:
 *   - Daftar FAQ dengan search & filter kategori
 *   - Tambah / Edit FAQ (modal form)
 *   - Hapus FAQ (modal konfirmasi)
 *   - Toggle status aktif inline
 *   - Field: Pertanyaan, Jawaban, Kategori, Display Order, Status Aktif
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit2, Trash2, X, HelpCircle,
  AlertTriangle, CheckCircle2, Tag, ToggleLeft, ToggleRight,
  ArrowUpDown, Loader2,
} from "lucide-react";
import { faqRepository } from "@/src/lib/cmsRepository";
import type { DbFaq } from "@/src/lib/cmsRepository";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const DEFAULT_FORM = {
  question: "",
  answer: "",
  category: "",
  sort_order: 0,
  is_active: true,
};

// ---------------------------------------------------------------------------
// PAGE COMPONENT
// ---------------------------------------------------------------------------

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<DbFaq[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await faqRepository.getAll();
      setFaqs(items);
    } catch {
      showToast("error", "Gagal memuat data FAQ dari database.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const categories = Array.from(new Set(faqs.map((f) => f.category).filter(Boolean))) as string[];

  const filtered = faqs.filter((f) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q);
    const matchCat = !filterCategory || f.category === filterCategory;
    return matchSearch && matchCat;
  });

  // ── Validate form ─────────────────────────────────────────────────────────
  function validate() {
    const errs: Record<string, string> = {};
    if (!formData.question.trim()) errs.question = "Pertanyaan wajib diisi.";
    if (!formData.answer.trim()) errs.answer = "Jawaban wajib diisi.";
    if (formData.sort_order < 0) errs.sort_order = "Urutan tidak boleh negatif.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Open modals ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (item: DbFaq) => {
    setEditingId(item.id);
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category ?? "",
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: formData.category.trim() || undefined,
        sort_order: Number(formData.sort_order),
        is_active: formData.is_active,
      };
      const result = editingId
        ? await faqRepository.update(editingId, payload)
        : await faqRepository.create(payload);

      if (!result.success) throw new Error(result.error);
      showToast("success", editingId ? "FAQ berhasil diperbarui." : "FAQ baru berhasil ditambahkan.");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menyimpan FAQ.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setIsSaving(true);
    try {
      const result = await faqRepository.delete(id);
      if (!result.success) throw new Error(result.error);
      showToast("success", "FAQ berhasil dihapus.");
      setDeleteConfirmId(null);
      await loadData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menghapus FAQ.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle status ─────────────────────────────────────────────────────────
  const handleToggle = async (item: DbFaq) => {
    try {
      const result = await faqRepository.toggleStatus(item.id, !item.is_active);
      if (!result.success) throw new Error(result.error);
      await loadData();
    } catch {
      showToast("error", "Gagal mengubah status FAQ.");
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
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success"
              ? <CheckCircle2 className="h-4 w-4" />
              : <AlertTriangle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Manajemen FAQ
          </h1>
          <p className="text-xs text-text-secondary sm:text-sm mt-1">
            Kelola daftar pertanyaan &amp; jawaban yang sering diajukan. Data tersimpan di Supabase.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          type="button" onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-body text-sm font-semibold text-white shadow-md hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah FAQ</span>
        </motion.button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pertanyaan atau jawaban..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-primary/20 bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Memuat data FAQ dari Supabase...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-primary/10 bg-white p-12 text-center">
          <HelpCircle className="mx-auto h-10 w-10 text-primary/30 mb-3" />
          <p className="text-sm font-semibold text-text-secondary">
            {searchQuery || filterCategory ? "Tidak ada FAQ yang cocok dengan filter." : "Belum ada FAQ. Klik 'Tambah FAQ' untuk mulai."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((faq) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border bg-white p-5 shadow-xs transition-all hover:border-primary/30 ${
                faq.is_active ? "border-primary/10" : "border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-heading text-sm font-bold text-text-primary leading-snug">
                        {faq.question}
                      </h3>
                      {faq.category && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <Tag className="h-3 w-3" /> {faq.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-body text-xs text-text-secondary leading-relaxed pl-6">
                    {faq.answer}
                  </p>
                  <p className="pl-6 text-[10px] text-text-secondary/60">
                    Urutan: {faq.sort_order}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Toggle */}
                  <button
                    type="button" onClick={() => handleToggle(faq)}
                    title={faq.is_active ? "Nonaktifkan" : "Aktifkan"}
                    className="rounded-lg p-1.5 text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                  >
                    {faq.is_active
                      ? <ToggleRight className="h-5 w-5 text-emerald-600" />
                      : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button
                    type="button" onClick={() => openEdit(faq)}
                    title="Edit FAQ"
                    className="rounded-lg p-1.5 text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button" onClick={() => setDeleteConfirmId(faq.id)}
                    title="Hapus FAQ"
                    className="rounded-lg p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── MODAL ADD/EDIT ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !isSaving && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-primary/10 pb-4 mb-4">
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {editingId ? "Edit FAQ" : "Tambah FAQ Baru"}
                </h3>
                <button
                  type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}
                  className="rounded-lg p-1 text-text-secondary hover:bg-primary/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                {/* Pertanyaan */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Pertanyaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Contoh: Apakah produk buatan tangan asli Lombok?"
                    className={`w-full rounded-xl border py-2.5 px-3 focus:outline-none focus:border-primary ${formErrors.question ? "border-red-400" : "border-primary/20"}`}
                  />
                  {formErrors.question && <p className="mt-1 text-xs text-red-500">{formErrors.question}</p>}
                </div>

                {/* Jawaban */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Jawaban <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4} required
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Tuliskan jawaban yang informatif..."
                    className={`w-full rounded-xl border py-2.5 px-3 focus:outline-none focus:border-primary ${formErrors.answer ? "border-red-400" : "border-primary/20"}`}
                  />
                  {formErrors.answer && <p className="mt-1 text-xs text-red-500">{formErrors.answer}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Kategori */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                      Kategori
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Contoh: Pengiriman"
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Display Order */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                      <span className="flex items-center gap-1"><ArrowUpDown className="h-3 w-3" /> Urutan</span>
                    </label>
                    <input
                      type="number" min={0}
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                      className={`w-full rounded-xl border py-2.5 px-3 focus:border-primary focus:outline-none ${formErrors.sort_order ? "border-red-400" : "border-primary/20"}`}
                    />
                  </div>
                </div>

                {/* Status Aktif */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${formData.is_active ? "bg-emerald-500" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">Status Aktif</span>
                </label>

                <div className="flex justify-end gap-3 border-t border-primary/10 pt-4">
                  <button
                    type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}
                    className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit" disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-60"
                  >
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Simpan FAQ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL DELETE ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !isSaving && setDeleteConfirmId(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-text-primary">Hapus FAQ Ini?</h3>
              <p className="mt-1 font-body text-xs text-text-secondary">
                Data FAQ akan dihapus permanen dari database Supabase.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button" onClick={() => setDeleteConfirmId(null)} disabled={isSaving}
                  className="rounded-xl border border-primary/20 px-4 py-2 font-body text-xs font-semibold text-text-secondary hover:bg-secondary/40 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-body text-xs font-semibold text-white shadow-md hover:bg-red-700 disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Hapus FAQ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
