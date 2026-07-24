"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  Package,
  Sparkles,
  Flame,
  Award,
  AlertTriangle,
} from "lucide-react";
import adminStorage from "@/src/lib/adminStorage";
import { Product } from "@/src/types/product";
import { Category } from "@/src/types/category";

export default function AdminProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    category: "kayu",
    price: 0,
    description: "",
    image: "/images/banner-placeholder.jpg",
    images: [],
    stock: 10,
    rating: 5,
    reviewCount: 0,
    isFeatured: false,
    isBestSeller: false,
    isNew: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        adminStorage.getProducts(),
        adminStorage.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
      if (cats.length > 0 && !formData.category) {
        setFormData((prev) => ({ ...prev, category: cats[0].name.toLowerCase() }));
      }
    } catch (e) {
      console.error("Gagal memuat data produk:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Buka Modal Tambah Produk Baru
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: categories[0]?.name.toLowerCase() || "kayu",
      price: 150000,
      description: "",
      image: "/images/banner-placeholder.jpg",
      images: ["/images/banner-placeholder.jpg"],
      stock: 10,
      rating: 5,
      reviewCount: 0,
      isFeatured: false,
      isBestSeller: false,
      isNew: true,
    });
    setIsModalOpen(true);
  };

  // Buka Modal Edit Produk
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsModalOpen(true);
  };

  // Submit Form Tambah/Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      alert("Nama produk, kategori, dan harga wajib diisi!");
      return;
    }

    const slug =
      formData.slug ||
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      slug,
      name: formData.name || "",
      category: formData.category || "kayu",
      price: Number(formData.price) || 0,
      description: formData.description || "",
      image: formData.image || "/images/banner-placeholder.jpg",
      images: formData.images && formData.images.length > 0 ? formData.images : [formData.image || "/images/banner-placeholder.jpg"],
      stock: Number(formData.stock) || 0,
      rating: formData.rating || 5,
      reviewCount: formData.reviewCount || 0,
      isFeatured: Boolean(formData.isFeatured),
      isBestSeller: Boolean(formData.isBestSeller),
      isNew: Boolean(formData.isNew),
    };

    await adminStorage.saveProduct(newProduct);
    await loadData();
    setIsModalOpen(false);
  };

  // Hapus Produk
  const handleDeleteProduct = async (id: string) => {
    await adminStorage.deleteProduct(id);
    await loadData();
    setDeleteConfirmId(null);
  };

  // Filter Data
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 font-body">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Manajemen Produk
          </h1>
          <p className="text-xs text-text-secondary sm:text-sm">
            Tambah, ubah status, dan kelola katalog produk kerajinan tangan.
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
          <span>Tambah Produk</span>
        </motion.button>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Filter Kategori */}
        <div className="flex w-full sm:w-auto items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary shrink-0">Filter:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-primary/20 bg-white py-2.5 px-3 text-sm text-text-primary focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name.toLowerCase()}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel Data Produk */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="text-sm text-text-secondary">Memuat daftar produk...</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-secondary/40 text-xs font-semibold text-text-secondary uppercase">
                  <th className="py-3.5 px-4">Produk</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Harga</th>
                  <th className="py-3.5 px-4">Stok</th>
                  <th className="py-3.5 px-4">Status & Badges</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-secondary text-sm">
                      Tidak ada produk yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary/60">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-text-primary line-clamp-1">{product.name}</div>
                            <div className="text-xs text-text-secondary">ID: {product.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 capitalize font-medium text-text-primary">
                        {product.category}
                      </td>

                      <td className="py-3 px-4 font-bold text-primary">
                        Rp {product.price.toLocaleString("id-ID")}
                      </td>

                      <td className="py-3 px-4 text-text-secondary">
                        {product.stock} unit
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          {product.isNew && (
                            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                              BARU
                            </span>
                          )}
                          {product.isBestSeller && (
                            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                              TERLARIS
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              UNGGULAN
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(product)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form Tambah / Edit Produk */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {editingProduct ? "Edit Produk Kerajinan" : "Tambah Produk Baru"}
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
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Vas Kayu Jati Ukir Vintage"
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                      Kategori
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none capitalize cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name.toLowerCase()}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    URL Gambar Produk
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="/images/banner-placeholder.jpg"
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                    Deskripsi Produk
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi detail produk kerajinan..."
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                      Stok Unit
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                      Rating (1-5)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={1}
                      max={5}
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status Checkboxes */}
                <div className="pt-2">
                  <span className="block text-xs font-semibold uppercase text-text-secondary mb-2">
                    Status & Badges Produk
                  </span>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs">
                      <input
                        type="checkbox"
                        checked={formData.isNew}
                        onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>Produk Terbaru</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs">
                      <input
                        type="checkbox"
                        checked={formData.isBestSeller}
                        onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>Produk Terlaris</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>Produk Unggulan</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-primary/10 pt-4 mt-6">
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
                    Simpan Produk
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Hapus */}
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
                Hapus Produk Ini?
              </h3>
              <p className="mt-1 font-body text-xs text-text-secondary">
                Tindakan ini akan menghapus produk secara permanen dari penyimpanan.
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
                  onClick={() => handleDeleteProduct(deleteConfirmId)}
                  className="rounded-xl bg-red-600 px-4 py-2 font-body text-xs font-semibold text-white shadow-md hover:bg-red-700"
                >
                  Hapus Produk
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
