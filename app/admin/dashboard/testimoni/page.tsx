"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, X, Star, AlertTriangle } from "lucide-react";
import adminStorage from "@/src/lib/adminStorage";
import { TestimonialItem } from "@/src/constants/testimonials";

export default function AdminTestimoniPage() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<TestimonialItem>>({
    name: "",
    city: "",
    rating: 5,
    comment: "",
    avatar: "/images/testimonials/avatar-1.jpg",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const items = await adminStorage.getTestimonials();
      setTestimonials(items);
    } catch (e) {
      console.error("Gagal memuat testimoni:", e);
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
      name: "",
      city: "",
      rating: 5,
      comment: "",
      avatar: "/images/testimonials/avatar-1.jpg",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TestimonialItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.comment) {
      alert("Nama pelanggan dan ulasan wajib diisi!");
      return;
    }

    const newItem: TestimonialItem = {
      id: editingItem ? editingItem.id : `testi-${Date.now()}`,
      name: formData.name || "",
      city: formData.city || "Indonesia",
      rating: Number(formData.rating) || 5,
      comment: formData.comment || "",
      avatar: formData.avatar || "/images/testimonials/avatar-1.jpg",
    };

    await adminStorage.saveTestimonial(newItem);
    await loadData();
    setIsModalOpen(false);
  };

  const handleDeleteItem = async (id: string) => {
    await adminStorage.deleteTestimonial(id);
    await loadData();
    setDeleteConfirmId(null);
  };

  const filteredItems = testimonials.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.comment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-body">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Manajemen Testimoni Pelanggan
          </h1>
          <p className="text-xs text-text-secondary sm:text-sm">
            Tambah, sunting ulasan, dan kelola pengalaman positif pembeli.
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
          <span>Tambah Testimoni</span>
        </motion.button>
      </div>

      {/* Toolbar Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ulasan atau nama..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Tabel Data Testimoni */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="text-sm text-text-secondary">Memuat ulasan testimoni...</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-secondary/40 text-xs font-semibold text-text-secondary uppercase">
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Kota Asal</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Ulasan / Komentar</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-secondary text-sm">
                      Belum ada testimoni yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-text-primary">
                        {item.name}
                      </td>

                      <td className="py-3 px-4 text-text-secondary">
                        {item.city}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="h-4 w-4 fill-amber-400" />
                          <span>{item.rating}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-text-secondary max-w-md">
                        <p className="line-clamp-2 leading-relaxed text-xs sm:text-sm">
                          "{item.comment}"
                        </p>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="rounded-lg p-1.5 text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                            title="Edit Testimoni"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="rounded-lg p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                            title="Hapus Testimoni"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Testimoni */}
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
                  {editingItem ? "Edit Testimoni" : "Tambah Testimoni Baru"}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                      Nama Pelanggan
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Budi Pratama"
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                      Kota Asal
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Jakarta Selatan"
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Rating Bintang (1 - 5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Ulasan / Komentar
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Ukiran kayu khas Lombok yang saya pesan sangat halus..."
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
                    Simpan Testimoni
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Hapus Testimoni */}
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
                Hapus Testimoni Ini?
              </h3>
              <p className="mt-1 font-body text-xs text-text-secondary">
                Ulasan ini akan dihapus dari daftar testimoni pelanggan.
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
                  Hapus Testimoni
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
