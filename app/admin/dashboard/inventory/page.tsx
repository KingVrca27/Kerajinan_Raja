/**
 * @file app/admin/dashboard/inventory/page.tsx
 * Halaman Manajemen Inventori & Log Stok (Inventory Management) — FASE 4.5.1
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes, Package, AlertTriangle, AlertCircle, Search, Filter, Plus, ArrowUpDown,
  CheckCircle2, Loader2, X, History, TrendingUp, TrendingDown, RefreshCw, Layers
} from "lucide-react";
import { inventoryRepository } from "@/src/lib/inventoryRepository";
import { productAdminRepository } from "@/src/lib/productAdminRepository";
import type { InventoryLogWithDetails, InventoryLogType } from "@/src/types/ops";
import type { AdminProduct } from "@/src/types/productAdmin";

const LOG_TYPE_BADGES: Record<InventoryLogType, { label: string; color: string; icon: React.ElementType }> = {
  in:         { label: "Stok Masuk",    color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: TrendingUp },
  out:        { label: "Stok Keluar",   color: "bg-blue-50 text-blue-700 border-blue-200",         icon: TrendingDown },
  adjustment: { label: "Penyesuaian",   color: "bg-purple-50 text-purple-700 border-purple-200",   icon: RefreshCw },
  return:     { label: "Retur Masuk",   color: "bg-indigo-50 text-indigo-700 border-indigo-200",   icon: Layers },
  damaged:    { label: "Stok Rusak",    color: "bg-red-50 text-red-700 border-red-200",             icon: AlertCircle },
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export default function AdminInventoryPage() {
  const [logs, setLogs] = useState<InventoryLogWithDetails[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Add Log Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [logType, setLogType] = useState<InventoryLogType>("in");
  const [adjustmentDirection, setAdjustmentDirection] = useState<"up" | "down">("up");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [lList, st, pList] = await Promise.all([
        inventoryRepository.getAllLogs(),
        inventoryRepository.getInventoryStats(),
        productAdminRepository.getAdminProducts(),
      ]);
      setLogs(lList);
      setStats(st);
      setProducts(pList);
    } catch {
      showToast("error", "Gagal memuat data log inventori.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        log.product_name?.toLowerCase().includes(q) ||
        log.product_sku?.toLowerCase().includes(q) ||
        (log.notes && log.notes.toLowerCase().includes(q));

      const matchType = typeFilter === "all" || log.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [logs, searchQuery, typeFilter]);

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) {
      showToast("error", "Pilih produk dan jumlah stok yang valid.");
      return;
    }
    setIsSubmitting(true);
    
    const finalQuantity = logType === "adjustment" && adjustmentDirection === "down"
      ? -Math.abs(Number(quantity))
      : Number(quantity);

    try {
      const res = await inventoryRepository.addLog({
        product_id: selectedProductId,
        type: logType,
        quantity: finalQuantity,
        notes: notes.trim(),
      });
      if (!res.success) throw new Error(res.error);
      showToast("success", "Penyesuaian stok berhasil dicatat!");
      setIsModalOpen(false);
      setSelectedProductId("");
      setQuantity(1);
      setNotes("");
      await loadData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal memproses penyesuaian stok.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Manajemen Inventori</h1>
          <p className="text-xs text-text-secondary sm:text-sm mt-1">
            Riwayat log stok masuk, stok keluar, stok rusak, dan penyesuaian stok manual.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Penyesuaian Stok</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase">Total Jenis Produk</span>
            <div className="font-heading text-2xl font-black text-text-primary">{stats.totalProducts} Item</div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase">Stok Menipis</span>
            <div className="font-heading text-2xl font-black text-amber-800">{stats.lowStockCount} Produk</div>
          </div>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50/40 p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-700">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-red-700 uppercase">Stok Habis</span>
            <div className="font-heading text-2xl font-black text-red-800">{stats.outOfStockCount} Produk</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama Produk, SKU, atau Catatan..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-primary/20 bg-white py-2.5 px-3 text-xs font-semibold focus:border-primary focus:outline-none"
        >
          <option value="all">Semua Tipe Perubahan</option>
          <option value="in">Stok Masuk (In)</option>
          <option value="out">Stok Keluar (Out)</option>
          <option value="adjustment">Penyesuaian (Adjustment)</option>
          <option value="return">Retur Masuk (Return)</option>
          <option value="damaged">Stok Rusak (Damaged)</option>
        </select>
      </div>

      {/* Inventory Logs Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat log inventori...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center text-sm text-text-secondary">
          <History className="mx-auto h-12 w-12 text-primary/30 mb-3" />
          <p className="font-semibold">Belum ada riwayat penyesuaian stok.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-primary/10 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-secondary/30 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">Nama Produk</th>
                  <th className="py-3.5 px-4">Tipe Perubahan</th>
                  <th className="py-3.5 px-4 text-center">Sebelum</th>
                  <th className="py-3.5 px-4 text-center">Perubahan</th>
                  <th className="py-3.5 px-4 text-center">Sesudah</th>
                  <th className="py-3.5 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {filteredLogs.map((log) => {
                  const badge = LOG_TYPE_BADGES[log.type] || LOG_TYPE_BADGES.adjustment;
                  const Icon = badge.icon;
                  const isPositive = log.quantity > 0;

                  return (
                    <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-text-secondary">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-text-primary">{log.product_name}</div>
                        <div className="text-xs text-text-secondary">SKU: {log.product_sku}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${badge.color}`}>
                          <Icon className="h-3 w-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-text-secondary">
                        {log.stock_before}
                      </td>
                      <td className={`py-3.5 px-4 text-center font-mono font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                        {isPositive ? `+${log.quantity}` : log.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-primary">
                        {log.stock_after}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-text-secondary">
                        {log.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD LOG MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => !isSubmitting && setIsModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-lg w-full rounded-3xl bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                <h3 className="font-heading text-base font-bold text-text-primary">Catat Penyesuaian Stok</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl p-1 text-text-secondary hover:bg-primary/10">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitLog} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Pilih Produk *</label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                  >
                    <option value="">-- Pilih Produk --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stok Saat Ini: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Tipe Log *</label>
                    <select
                      value={logType}
                      onChange={(e) => setLogType(e.target.value as InventoryLogType)}
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    >
                      <option value="in">Stok Masuk (+)</option>
                      <option value="out">Stok Keluar (-)</option>
                      <option value="adjustment">Penyesuaian (+/-)</option>
                      <option value="return">Retur Masuk (+)</option>
                      <option value="damaged">Stok Rusak (-)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Jumlah Unit *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                  
                  {logType === "adjustment" && (
                    <div className="col-span-2 mt-1">
                      <label className="block text-xs font-semibold uppercase text-text-secondary mb-2">Arah Penyesuaian *</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="adj_direction" value="up" checked={adjustmentDirection === "up"} onChange={() => setAdjustmentDirection("up")} className="accent-primary" />
                          <span className="text-sm">Tambah Stok (+)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="adj_direction" value="down" checked={adjustmentDirection === "down"} onChange={() => setAdjustmentDirection("down")} className="accent-primary" />
                          <span className="text-sm">Kurangi Stok (-)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Catatan / Alasan</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Penerimaan pasokan baru dari perajin..."
                    className="w-full rounded-xl border border-primary/20 p-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-primary/10 pt-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60">
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan Log Stok
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
