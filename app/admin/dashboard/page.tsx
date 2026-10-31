/**
 * @file app/admin/dashboard/page.tsx
 * Halaman utama Dashboard Statistik Admin (FITUR 6 — FASE 4.5.1)
 *
 * CARDS:
 *   1. Total Penjualan Mingguan
 *   2. Total Penjualan Bulanan
 *   3. Total Penjualan Tahunan
 *   4. Produk Aktif
 *   5. Produk Terjual
 *   6. Pesanan Baru
 *   7. Pesanan Diproses
 *   8. Jumlah Customer
 *   9. Jumlah Review
 *   10. Rating Rata-rata
 *
 * GRAFIK:
 *   - Penjualan Mingguan (7 Hari/Minggu terakhir)
 *   - Penjualan Bulanan (12 Bulan)
 *   - Penjualan Tahunan (5 Tahun)
 *   (DILARANG MEMBUAT STATISTIK HARIAN)
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  DollarSign, Calendar, TrendingUp, Package, ShoppingBag, Clock,
  Users, MessageSquare, Star, Sparkles, ArrowRight, Loader2, BarChart2,
  CheckCircle2, AlertTriangle, ChevronRight, Layers, Tag,
  Bell, AlertCircle, History, BellRing, PackageX,
} from "lucide-react";
import { orderRepository } from "@/src/lib/orderRepository";
import { customerRepository } from "@/src/lib/customerRepository";
import { reviewRepository } from "@/src/lib/reviewRepository";
import { productAdminRepository } from "@/src/lib/productAdminRepository";
import { notificationRepository } from "@/src/lib/notificationRepository";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import { inventoryRepository } from "@/src/lib/inventoryRepository";
import { promotionRepository } from "@/src/lib/promotionRepository";
import { StatCardSkeleton } from "@/src/components/ui/Skeleton";
import AnimatedCounter from "@/src/components/ui/AnimatedCounter";
import type { OrderWithDetails } from "@/src/types/ops";
import type { DbActivityLog } from "@/src/types/adminMonitoring";

function formatRupiah(num: number): string {
  return "Rp " + Number(num || 0).toLocaleString("id-ID");
}

export default function AdminDashboardHome() {
  const [isLoading, setIsLoading] = useState(true);

  // Operational Stats State
  const [stats, setStats] = useState({
    weeklySales: 0,
    monthlySales: 0,
    yearlySales: 0,
    activeProducts: 0,
    soldProducts: 0,
    newOrdersCount: 0,
    processingOrdersCount: 0,
    totalCustomers: 0,
    totalReviews: 0,
    averageRating: 0,
  });

  // Monitoring Stats
  const [monitoringStats, setMonitoringStats] = useState({
    newOrders: 0,
    newReviews: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    activePromos: 0,
    unreadNotifications: 0,
  });

  // Recent Activity
  const [recentActivity, setRecentActivity] = useState<DbActivityLog[]>([]);

  // Chart Tab Selection
  const [chartTab, setChartTab] = useState<"weekly" | "monthly" | "yearly">("monthly");

  // Chart Datasets
  const [weeklyChart, setWeeklyChart] = useState<{ label: string; amount: number }[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<{ label: string; amount: number }[]>([]);
  const [yearlyChart, setYearlyChart] = useState<{ label: string; amount: number }[]>([]);

  // Recent Orders List
  const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [salesData, recentOrdersData, totalCustomersCount, activeProductsCount, reviewStats] = await Promise.all([
        orderRepository.getDashboardSalesData(),
        orderRepository.getRecentOrders(5),
        customerRepository.getTotalCount(),
        productAdminRepository.getActiveCount(),
        reviewRepository.getStats(),
      ]);

      // Load monitoring data in parallel (non-blocking)
      Promise.all([
        notificationRepository.getUnreadCount(),
        activityLogRepository.getRecent(10),
        inventoryRepository.getInventoryStats(),
        promotionRepository.getAll(),
        reviewRepository.countTodayReviews(),
      ])
        .then(([unreadCount, activityLogs, invStats, promos, newReviewsCount]) => {
          const activePromos = promos.filter(
            (p) =>
              p.is_active &&
              (!p.expires_at || new Date(p.expires_at) > new Date())
          ).length;

          // Count today's new orders
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const newOrders = salesData.filter(
            (o) => new Date(o.created_at) >= todayStart
          ).length;

          setMonitoringStats({
            newOrders,
            newReviews: newReviewsCount,
            lowStockCount: invStats.lowStockCount,
            outOfStockCount: invStats.outOfStockCount,
            activePromos,
            unreadNotifications: unreadCount,
          });
          setRecentActivity(activityLogs);
        })
        .catch(() => {
          // Monitoring non-critical, ignore failure
        });

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // 1. Calculate Sales
      let weeklySales = 0;
      let monthlySales = 0;
      let yearlySales = 0;
      let newOrdersCount = 0;
      let processingOrdersCount = 0;
      let soldProducts = 0;

      // Chart Accumulators
      // Mingguan (4 Minggu dalam Bulan ini)
      const weekBuckets = [0, 0, 0, 0];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const monthBuckets = new Array(12).fill(0);
      const yearBucketsMap = new Map<number, number>();

      // Pre-fill last 5 years
      for (let i = 4; i >= 0; i--) {
        yearBucketsMap.set(currentYear - i, 0);
      }

      salesData.forEach((ord) => {
        if (ord.status === "cancelled" || ord.status === "refunded") return;

        const date = new Date(ord.created_at);
        const amount = Number(ord.total || 0);

        // Calculate sold items count
        const itemsCount = (ord.items || []).reduce((acc: number, curr: any) => acc + (curr.quantity || 0), 0);
        soldProducts += itemsCount;

        // Check statuses
        if (ord.status === "pending") newOrdersCount++;
        if (ord.status === "processing" || ord.status === "confirmed" || ord.status === "shipped") processingOrdersCount++;

        // Time calculations
        const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);

        if (diffDays <= 7) {
          weeklySales += amount;
        }

        if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
          monthlySales += amount;
          // Calculate week of month (0 to 3)
          const weekIdx = Math.min(3, Math.floor((date.getDate() - 1) / 7));
          weekBuckets[weekIdx] += amount;
        }

        if (date.getFullYear() === currentYear) {
          yearlySales += amount;
        }

        if (date.getFullYear() === currentYear) {
          monthBuckets[date.getMonth()] += amount;
        }

        if (yearBucketsMap.has(date.getFullYear())) {
          yearBucketsMap.set(date.getFullYear(), (yearBucketsMap.get(date.getFullYear()) || 0) + amount);
        }
      });

      setStats({
        weeklySales,
        monthlySales,
        yearlySales,
        activeProducts: activeProductsCount,
        soldProducts,
        newOrdersCount,
        processingOrdersCount,
        totalCustomers: totalCustomersCount,
        totalReviews: reviewStats.total,
        averageRating: reviewStats.averageRating,
      });

      // Build charts
      setWeeklyChart([
        { label: "Minggu 1", amount: weekBuckets[0] },
        { label: "Minggu 2", amount: weekBuckets[1] },
        { label: "Minggu 3", amount: weekBuckets[2] },
        { label: "Minggu 4", amount: weekBuckets[3] },
      ]);

      setMonthlyChart(
        monthNames.map((name, idx) => ({
          label: name,
          amount: monthBuckets[idx],
        }))
      );

      const yearsArray: { label: string; amount: number }[] = [];
      yearBucketsMap.forEach((amt, yr) => {
        yearsArray.push({ label: String(yr), amount: amt });
      });
      setYearlyChart(yearsArray);

      setRecentOrders(recentOrdersData);
    } catch (e) {
      console.error("Gagal memuat statistik dashboard:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  // Stat cards array (10 Cards required by prompt)
  const statCards = [
    {
      title: "Total Penjualan Mingguan",
      value: formatRupiah(stats.weeklySales),
      icon: DollarSign,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      description: "Omset 7 hari terakhir",
    },
    {
      title: "Total Penjualan Bulanan",
      value: formatRupiah(stats.monthlySales),
      icon: TrendingUp,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      description: "Omset bulan berjalan",
    },
    {
      title: "Total Penjualan Tahunan",
      value: formatRupiah(stats.yearlySales),
      icon: Calendar,
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
      description: "Omset tahun " + new Date().getFullYear(),
    },
    {
      title: "Produk Aktif",
      value: stats.activeProducts,
      icon: Package,
      color: "bg-amber-500/10 text-amber-600 border-amber-200",
      href: "/admin/dashboard/produk",
      description: "Katalog dapat dibeli",
    },
    {
      title: "Produk Terjual",
      value: stats.soldProducts + " Item",
      icon: Layers,
      color: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
      description: "Akumulasi unit terjual",
    },
    {
      title: "Pesanan Baru",
      value: stats.newOrdersCount,
      icon: Clock,
      color: "bg-orange-500/10 text-orange-600 border-orange-200",
      href: "/admin/dashboard/pesanan",
      description: "Perlu konfirmasi",
    },
    {
      title: "Pesanan Diproses",
      value: stats.processingOrdersCount,
      icon: ShoppingBag,
      color: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
      href: "/admin/dashboard/pesanan",
      description: "Dalam pengerjaan/pengiriman",
    },
    {
      title: "Jumlah Customer",
      value: stats.totalCustomers,
      icon: Users,
      color: "bg-rose-500/10 text-rose-600 border-rose-200",
      href: "/admin/dashboard/pelanggan",
      description: "Pelanggan terdaftar",
    },
    {
      title: "Jumlah Review",
      value: stats.totalReviews,
      icon: MessageSquare,
      color: "bg-teal-500/10 text-teal-600 border-teal-200",
      href: "/admin/dashboard/review",
      description: "Ulasan dari pembeli",
    },
    {
      title: "Rating Rata-rata",
      value: stats.averageRating + " / 5.0",
      icon: Star,
      color: "bg-amber-400/10 text-amber-600 border-amber-200",
      href: "/admin/dashboard/review",
      description: "Kepuasan pelanggan",
    },
  ];

  // Active chart dataset
  const activeChart = chartTab === "weekly" ? weeklyChart : chartTab === "monthly" ? monthlyChart : yearlyChart;
  const maxChartAmount = Math.max(...activeChart.map((c) => c.amount), 1);

  if (isLoading) {
    return (
      <div className="space-y-8 font-body">
        <StatCardSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body">

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
              <span>Ringkasan Operasional &amp; Penjualan</span>
            </div>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl lg:text-4xl">
              Dashboard Admin Putra Art Shop
            </h1>
            <p className="mt-2 text-sm text-white/80 max-w-xl">
              Pantau arus penjualan mingguan, bulanan, tahunan, pesanan masuk, stok inventori, dan kepuasan pelanggan secara real-time.
            </p>
          </div>

          <Link href="/admin/dashboard/pesanan">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary shadow-md hover:bg-amber-50 cursor-pointer shrink-0"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Kelola Pesanan</span>
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* 2. Kartu Statistik Utama (10 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const CardContent = (
            <div className="group relative flex flex-col justify-between rounded-2xl border border-primary/10 bg-white p-4 shadow-xs transition-all duration-200 hover:border-primary/30 hover:shadow-md h-full">
              <div className="flex items-center justify-between">
                <span className="font-body text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  {card.title}
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3">
                <div className="font-heading text-xl font-black text-text-primary truncate">
                  {card.value}
                </div>
                <span className="font-body text-[11px] text-text-secondary mt-0.5 block">
                  {card.description}
                </span>
              </div>
            </div>
          );

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
            >
              {card.href ? <Link href={card.href}>{CardContent}</Link> : CardContent}
            </motion.div>
          );
        })}
      </div>

      {/* 3. Grafik Penjualan (Mingguan, Bulanan, Tahunan — NO Daily) */}
      <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-text-primary">
              Grafik Performa Penjualan Omset
            </h2>
          </div>

          {/* Chart Tab Selectors */}
          <div className="flex items-center gap-1 rounded-xl bg-secondary/40 p-1 border border-primary/10">
            <button
              type="button"
              onClick={() => setChartTab("weekly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                chartTab === "weekly" ? "bg-primary text-white shadow-xs" : "text-text-secondary hover:text-primary"
              }`}
            >
              Mingguan
            </button>
            <button
              type="button"
              onClick={() => setChartTab("monthly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                chartTab === "monthly" ? "bg-primary text-white shadow-xs" : "text-text-secondary hover:text-primary"
              }`}
            >
              Bulanan (12 Bulan)
            </button>
            <button
              type="button"
              onClick={() => setChartTab("yearly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                chartTab === "yearly" ? "bg-primary text-white shadow-xs" : "text-text-secondary hover:text-primary"
              }`}
            >
              Tahunan (5 Tahun)
            </button>
          </div>
        </div>

        {/* Bar Chart Visual Component */}
        <div className="space-y-2 pt-2">
          <div className="flex h-56 items-end gap-2 sm:gap-4 border-b border-primary/10 pb-2 pt-4 px-2">
            {activeChart.map((item) => {
              const heightPercent = Math.max(8, Math.round((item.amount / maxChartAmount) * 100));
              return (
                <div key={item.label} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-gray-900 px-2 py-1 text-[10px] font-bold text-white shadow whitespace-nowrap pointer-events-none z-10">
                    {formatRupiah(item.amount)}
                  </div>

                  {/* Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-primary/70 to-primary group-hover:from-primary group-hover:to-amber-500 transition-colors"
                  />
                  <span className="mt-2 text-[10px] sm:text-xs font-semibold text-text-secondary truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Ringkasan Pesanan Terbaru */}
      <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-primary/10 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-text-primary">
              Pesanan Terbaru Masuk
            </h2>
          </div>

          <Link
            href="/admin/dashboard/pesanan"
            className="flex items-center gap-1 font-body text-xs font-semibold text-primary hover:underline"
          >
            <span>Lihat Semua Pesanan</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-text-secondary text-center py-8">
            Belum ada transaksi pesanan tersimpan di database.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-xs">
              <thead>
                <tr className="border-b border-primary/10 text-text-secondary font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4 text-right">Total Belanja</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      #{ord.order_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-text-primary">
                      {ord.customer_name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {formatRupiah(ord.total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Monitoring Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold text-text-primary">
            Monitoring &amp; Peringatan Sistem
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {/* Card: Pesanan Baru */}
          <Link href="/admin/dashboard/pesanan">
            <div className="group flex flex-col gap-2 rounded-2xl border border-primary/10 bg-white p-4 shadow-xs transition-all hover:border-blue-300 hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="font-heading text-2xl font-black text-text-primary">
                {monitoringStats.newOrders}
              </div>
              <div className="text-[11px] font-semibold text-text-secondary">
                Pesanan Baru Hari Ini
              </div>
            </div>
          </Link>

          {/* Card: Review Baru */}
          <Link href="/admin/dashboard/review">
            <div className="group flex flex-col gap-2 rounded-2xl border border-primary/10 bg-white p-4 shadow-xs transition-all hover:border-purple-300 hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Star className="h-4 w-4" />
              </div>
              <div className="font-heading text-2xl font-black text-text-primary">
                {monitoringStats.newReviews}
              </div>
              <div className="text-[11px] font-semibold text-text-secondary">
                Review Baru
              </div>
            </div>
          </Link>

          {/* Card: Low Stock */}
          <Link href="/admin/dashboard/inventory">
            <div className="group flex flex-col gap-2 rounded-2xl border border-primary/10 bg-white p-4 shadow-xs transition-all hover:border-amber-300 hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="font-heading text-2xl font-black text-amber-600">
                {monitoringStats.lowStockCount}
              </div>
              <div className="text-[11px] font-semibold text-text-secondary">
                Produk Hampir Habis
              </div>
            </div>
          </Link>

          {/* Card: Out of Stock */}
          <Link href="/admin/dashboard/inventory">
            <div className="group flex flex-col gap-2 rounded-2xl border border-primary/10 bg-white p-4 shadow-xs transition-all hover:border-red-300 hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <PackageX className="h-4 w-4" />
              </div>
              <div className="font-heading text-2xl font-black text-red-600">
                {monitoringStats.outOfStockCount}
              </div>
              <div className="text-[11px] font-semibold text-text-secondary">
                Produk Habis Stok
              </div>
            </div>
          </Link>

          {/* Card: Promo Aktif */}
          <Link href="/admin/dashboard/promosi">
            <div className="group flex flex-col gap-2 rounded-2xl border border-primary/10 bg-white p-4 shadow-xs transition-all hover:border-pink-300 hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                <Tag className="h-4 w-4" />
              </div>
              <div className="font-heading text-2xl font-black text-text-primary">
                {monitoringStats.activePromos}
              </div>
              <div className="text-[11px] font-semibold text-text-secondary">
                Promo Aktif
              </div>
            </div>
          </Link>
        </div>

        {/* Notif Unread Banner */}
        {monitoringStats.unreadNotifications > 0 && (
          <Link href="/admin/dashboard/notifikasi">
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 hover:bg-amber-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <BellRing className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-bold text-amber-800">
                  {monitoringStats.unreadNotifications} notifikasi belum dibaca
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-700">
                <span>Lihat</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* 6. Recent Activity Widget */}
      <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs">
        <div className="mb-5 flex items-center justify-between border-b border-primary/10 pb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-text-primary">
              Aktivitas Terbaru
            </h2>
          </div>
          <Link
            href="/admin/dashboard/log"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>Lihat Semua Log</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <p className="py-8 text-center text-xs text-text-secondary">
            Belum ada aktivitas admin tercatat.
          </p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-xl bg-secondary/20 px-4 py-3"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <History className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-text-primary">
                      {log.action}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-text-secondary">
                      {new Date(log.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-text-secondary">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                      {log.entity_type}
                    </span>
                    {" "}
                    {log.user_name || "Admin"}
                    {log.description ? ` — ${log.description.slice(0, 60)}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
