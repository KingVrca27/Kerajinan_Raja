"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, X, FolderTree, AlertTriangle } from "lucide-react";
import adminStorage from "@/src/lib/adminStorage";
import { Category } from "@/src/types/category";

export default function AdminKategoriPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Category>>({
    name: "",
    slug: "",
    description: "",
    icon: "Package",
    image: "/images/banner-placeholder.jpg",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const cats = await adminStorage.getCategories();
      setCategories(cats);
    } catch (e) {
      console.error("Gagal memuat kategori:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "Package",
      image: "/images/banner-placeholder.jpg",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ ...cat });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert("Nama kategori wajib diisi!");
      return;
    }

    const slug =
      formData.slug ||
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const newCategory: Category = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      slug,
      name: formData.name || "",
      description: formData.description || "",
      icon: formData.icon || "Package",
      image: formData.image || "/images/banner-placeholder.jpg",
      productCount: editingCategory ? editingCategory.productCount : 0,
    };

    await adminStorage.saveCategory(newCategory);
    await loadData();
    setIsModalOpen(false);
  };

  const handleDeleteCategory = async (id: string) => {
    await adminStorage.deleteCategory(id);
    await loadData();
    setDeleteConfirmId(null);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-body">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Manajemen Kategori
          </h1>
          <p className="text-xs text-text-secondary sm:text-sm">
            Tambah, edit, dan susun pengelompokan kategori produk kerajinan.
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
          <span>Tambah Kategori</span>
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
            placeholder="Cari nama kategori..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Grid / Tabel Kategori */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="text-sm text-text-secondary">Memuat data kategori...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col justify-between rounded-2xl border border-primary/10 bg-white p-5 shadow-xs transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <FolderTree className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold text-text-primary">
                        {cat.name}
                      </h3>
                      <span className="font-body text-xs text-text-secondary">
                        Slug: /{cat.slug}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(cat)}
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
                </div>

                <p className="mt-3 font-body text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {cat.description || "Tidak ada deskripsi."}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-primary/5 flex items-center justify-between text-xs font-semibold text-primary">
                <span>Total Produk:</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5">
                  {cat.productCount || 0} Produk
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Kategori */}
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
                  {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
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
                    Nama Kategori
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Ukiran Kayu"
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Slug URL (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="ukiran-kayu"
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Deskripsi Kategori
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Koleksi hasil karya ukiran kayu pilihan..."
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
                    Simpan Kategori
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Hapus Kategori */}
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
                Hapus Kategori Ini?
              </h3>
              <p className="mt-1 font-body text-xs text-text-secondary">
                Kategori akan dihapus dari daftar master kategori.
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
                  onClick={() => handleDeleteCategory(deleteConfirmId)}
                  className="rounded-xl bg-red-600 px-4 py-2 font-body text-xs font-semibold text-white shadow-md hover:bg-red-700"
                >
                  Hapus Kategori
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
