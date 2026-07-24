"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  FolderTree,
  MessageSquare,
  HelpCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import adminStorage from "@/src/lib/adminStorage";
import { Product } from "@/src/types/product";

export default function AdminDashboardHome() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalTestimonials: 0,
    totalFAQs: 0,
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [products, categories, testimonials, faqs] = await Promise.all([
          adminStorage.getProducts(),
          adminStorage.getCategories(),
          adminStorage.getTestimonials(),
          adminStorage.getFAQs(),
        ]);

        setStats({
          totalProducts: products.length,
          totalCategories: categories.length,
          totalTestimonials: testimonials.length,
          totalFAQs: faqs.length,
        });

        setRecentProducts(products.slice(0, 5));
      } catch (error) {
        console.error("Gagal memuat data statistik dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  const statCards = [
    {
      title: "Total Produk",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      href: "/admin/dashboard/produk",
      description: "Produk kerajinan aktif",
    },
    {
      title: "Total Kategori",
      value: stats.totalCategories,
      icon: FolderTree,
      color: "bg-amber-500/10 text-amber-600 border-amber-200",
      href: "/admin/dashboard/kategori",
      description: "Kategori kerajinan",
    },
    {
      title: "Total Testimoni",
      value: stats.totalTestimonials,
      icon: MessageSquare,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      href: "/admin/dashboard/testimoni",
      description: "Ulasan dari pelanggan",
    },
    {
      title: "Total FAQ",
      value: stats.totalFAQs,
      icon: HelpCircle,
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
      href: "/admin/dashboard/faq",
      description: "Pertanyaan sering diajukan",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 font-body text-sm text-text-secondary">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Memuat data ringkasan dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-primary/10 bg-gradient-to-r from-primary to-primary/80 p-6 sm:p-8 text-white shadow-lg"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-body text-xs font-semibold backdrop-blur-md mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Panel Kontrol Admin</span>
            </div>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl lg:text-4xl">
              Selamat Datang di Admin Kerajinan Raja
            </h1>
            <p className="mt-2 font-body text-sm text-white/80 max-w-xl">
              Kelola seluruh katalog produk, kategori, testimoni, FAQ, dan informasi toko secara langsung dari dashboard ini.
            </p>
          </div>

          <Link href="/admin/dashboard/produk">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-body text-sm font-bold text-primary shadow-md transition-all hover:bg-amber-50 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Produk Baru</span>
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* 2. Kartu Statistik Utama (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
            >
              <Link href={card.href}>
                <div className="group relative flex flex-col justify-between rounded-2xl border border-primary/10 bg-white p-5 shadow-xs transition-all duration-200 hover:border-primary/30 hover:shadow-md cursor-pointer h-full">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs font-bold uppercase tracking-wider text-text-secondary">
                      {card.title}
                    </span>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="font-heading text-3xl font-extrabold text-text-primary">
                      {card.value}
                    </div>
                    <span className="font-body text-xs text-text-secondary mt-1 block">
                      {card.description}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-primary/5 pt-3 font-body text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Kelola Data</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Ringkasan Produk Terbaru */}
      <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-primary/10 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-text-primary">
              Daftar Produk Terbaru
            </h2>
          </div>

          <Link
            href="/admin/dashboard/produk"
            className="flex items-center gap-1 font-body text-xs font-semibold text-primary hover:underline"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <p className="font-body text-sm text-text-secondary text-center py-8">
            Belum ada data produk tersimpan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-primary/10 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Harga</th>
                  <th className="py-3 px-4">Stok</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {recentProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-text-primary">
                      {prod.name}
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary capitalize">
                      {prod.category}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary">
                      Rp {prod.price.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary">
                      {prod.stock} unit
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {prod.isNew && (
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            BARU
                          </span>
                        )}
                        {prod.isBestSeller && (
                          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                            BEST SELLER
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
