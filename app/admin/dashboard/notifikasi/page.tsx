/**
 * @file app/admin/dashboard/notifikasi/page.tsx
 * Halaman Notification Center — FASE 4.5.2A
 * Route: /admin/dashboard/notifikasi
 *
 * Fitur:
 * - Kategori: order, review, inventory, system
 * - Unread counter
 * - Mark as read (satu & semua)
 * - Delete notification
 * - Search + filter kategori
 * - Pagination
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Search,
  ArrowRight,
  ShoppingBag,
  Star,
  AlertTriangle,
  Tag,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  X,
  Info,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { notificationRepository } from "@/src/lib/notificationRepository";
import type { DbNotification, NotificationType } from "@/src/types/adminMonitoring";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  { label: string; icon: React.ElementType; color: string }
> = {
  order: {
    label: "Pesanan",
    icon: ShoppingBag,
    color: "bg-blue-500/10 text-blue-600",
  },
  payment: {
    label: "Pembayaran",
    icon: CheckCircle2,
    color: "bg-emerald-500/10 text-emerald-600",
  },
  stock: {
    label: "Stok",
    icon: AlertTriangle,
    color: "bg-amber-500/10 text-amber-600",
  },
  review: {
    label: "Review",
    icon: Star,
    color: "bg-purple-500/10 text-purple-600",
  },
  promotion: {
    label: "Promo",
    icon: Tag,
    color: "bg-pink-500/10 text-pink-600",
  },
  banner: {
    label: "Banner",
    icon: Info,
    color: "bg-cyan-500/10 text-cyan-600",
  },
  backup: {
    label: "Backup",
    icon: HardDrive,
    color: "bg-indigo-500/10 text-indigo-600",
  },
  login: {
    label: "Login",
    icon: ShieldCheck,
    color: "bg-teal-500/10 text-teal-600",
  },
  system: {
    label: "Sistem",
    icon: Bell,
    color: "bg-gray-500/10 text-gray-600",
  },
};

const CATEGORY_TABS = [
  { value: "all", label: "Semua" },
  { value: "order", label: "Pesanan" },
  { value: "review", label: "Review" },
  { value: "stock", label: "Inventori" },
  { value: "system", label: "Sistem" },
];

const PAGE_SIZE = 12;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function AdminNotifikasiPage() {
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // ── Toast helper ────────────────────────────────────────────
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Load data ───────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await notificationRepository.getAll();
      setNotifications(list);
    } catch {
      showToast("error", "Gagal memuat notifikasi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived ─────────────────────────────────────────────────
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return notifications.filter((n) => {
      const matchSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q);
      const matchCat =
        activeCategory === "all" || n.type === activeCategory;
      return matchSearch && matchCat;
    });
  }, [notifications, searchQuery, activeCategory]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // Count per category tab (for badges)
  const unreadPerTab = useMemo(() => {
    const map: Record<string, number> = { all: unreadCount };
    for (const tab of CATEGORY_TABS.slice(1)) {
      map[tab.value] = notifications.filter(
        (n) => !n.is_read && n.type === tab.value
      ).length;
    }
    return map;
  }, [notifications, unreadCount]);

  // ── Actions ─────────────────────────────────────────────────
  const handleMarkAsRead = async (id: string) => {
    const res = await notificationRepository.markAsRead(id);
    if (!res.success) {
      showToast("error", res.error || "Gagal update notifikasi.");
      return;
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    const res = await notificationRepository.markAllAsRead();
    if (!res.success) {
      showToast("error", res.error || "Gagal update notifikasi.");
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    showToast("success", "Semua notifikasi ditandai sudah dibaca.");
  };

  const handleDelete = async (id: string) => {
    const res = await notificationRepository.deleteNotification(id);
    if (!res.success) {
      showToast("error", res.error || "Gagal menghapus notifikasi.");
      return;
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast("success", "Notifikasi dihapus.");
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl space-y-6 font-body">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed right-5 top-5 z-[200] flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-primary/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white shadow">
                {unreadCount} Belum Dibaca
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Pemberitahuan otomatis terkait pesanan, stok, ulasan, dan event
            sistem.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-xs hover:bg-primary/5 cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => {
          const cnt = unreadPerTab[tab.value] || 0;
          const isActive = activeCategory === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveCategory(tab.value);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "border border-primary/20 bg-white text-text-secondary hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {tab.label}
              {cnt > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Cari notifikasi..."
          className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat notifikasi...</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center text-sm text-text-secondary">
          <Bell className="mx-auto mb-3 h-12 w-12 text-primary/30" />
          <p className="font-semibold">Tidak ada notifikasi.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {paginated.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            const Icon = cfg.icon;

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className={`flex items-start gap-4 rounded-2xl border p-4 shadow-xs transition-all ${
                  n.is_read
                    ? "border-primary/10 bg-white"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`font-heading text-sm font-bold text-text-primary ${
                        !n.is_read ? "font-extrabold" : ""
                      }`}
                    >
                      {n.title}
                    </h3>
                    <span className="shrink-0 text-[11px] text-text-secondary">
                      {formatDate(n.created_at)}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                    {n.message}
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex shrink-0 flex-col gap-1">
                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(n.id)}
                      title="Tandai sudah dibaca"
                      className="rounded-lg p-1.5 text-text-secondary hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    title="Hapus notifikasi"
                    className="rounded-lg p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">
            Menampilkan {paginated.length} dari {filtered.length} notifikasi
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-primary/20 p-2 text-text-secondary hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-text-primary">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className="rounded-xl border border-primary/20 p-2 text-text-secondary hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
