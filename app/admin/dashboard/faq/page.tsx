"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, X, HelpCircle, AlertTriangle } from "lucide-react";
import adminStorage from "@/src/lib/adminStorage";
import { FAQItemData } from "@/src/constants/faq";

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQItemData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FAQItemData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<FAQItemData>>({
    question: "",
    answer: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const items = await adminStorage.getFAQs();
      setFaqs(items);
    } catch (e) {
      console.error("Gagal memuat FAQ:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      question: "",
      answer: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: FAQItemData) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question || !formData.answer) {
      alert("Pertanyaan dan jawaban wajib diisi!");
      return;
    }

    const newItem: FAQItemData = {
      id: editingItem ? editingItem.id : `faq-${Date.now()}`,
      question: formData.question || "",
      answer: formData.answer || "",
    };

    await adminStorage.saveFAQ(newItem);
    await loadData();
    setIsModalOpen(false);
  };

  const handleDeleteItem = async (id: string) => {
    await adminStorage.deleteFAQ(id);
    await loadData();
    setDeleteConfirmId(null);
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-body">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Manajemen FAQ
          </h1>
          <p className="text-xs text-text-secondary sm:text-sm">
            Kelola daftar pertanyaan yang sering diajukan beserta jawabannya.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-body text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah FAQ</span>
        </motion.button>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pertanyaan..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Daftar Item FAQ */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="text-sm text-text-secondary">Memuat data FAQ...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-primary/10 bg-white p-8 text-center text-sm text-text-secondary">
              Tidak ada FAQ yang cocok dengan pencarian.
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-primary/10 bg-white p-5 shadow-xs transition-all hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-heading text-base font-bold text-text-primary">
                        {faq.question}
                      </h3>
                    </div>
                    <p className="font-body text-xs sm:text-sm text-text-secondary leading-relaxed pl-6">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(faq)}
                      className="rounded-lg p-1.5 text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                      title="Edit FAQ"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(faq.id)}
                      className="rounded-lg p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                      title="Hapus FAQ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Modal Tambah / Edit FAQ */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {editingItem ? "Edit Pertanyaan FAQ" : "Tambah FAQ Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-text-secondary hover:bg-primary/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="mt-4 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Pertanyaan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Contoh: Apakah produk buatan tangan asli Lombok?"
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Jawaban
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Tuliskan jawaban informatif untuk pertanyaan tersebut..."
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-primary/10 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-primary/90"
                  >
                    Simpan FAQ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Hapus FAQ */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setDeleteConfirmId(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-text-primary">
                Hapus FAQ Ini?
              </h3>
              <p className="mt-1 font-body text-xs text-text-secondary">
                Item FAQ ini akan dihapus dari daftar pertanyaan umum.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded-xl border border-primary/20 px-4 py-2 font-body text-xs font-semibold text-text-secondary hover:bg-secondary/40"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(deleteConfirmId)}
                  className="rounded-xl bg-red-600 px-4 py-2 font-body text-xs font-semibold text-white shadow-md hover:bg-red-700"
                >
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
