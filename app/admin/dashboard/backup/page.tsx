/**
 * @file app/admin/dashboard/backup/page.tsx
 * Halaman Backup Center — FASE 4.5.2B
 * Route: /admin/dashboard/backup
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, CheckCircle2, AlertTriangle, Loader2, Database,
  Users, ShoppingBag, Star, HelpCircle, Package, FileJson,
} from "lucide-react";
import { backupRepository } from "@/src/lib/backupRepository";

interface ExportItem {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  fn: () => Promise<{ success: boolean; csvContent?: string; filename?: string; rowCount?: number; error?: string }>;
}

const EXPORT_ITEMS: ExportItem[] = [
  {
    key: "products",
    label: "Export Produk",
    description: "Nama, harga, stok, SKU, status produk",
    icon: Package,
    color: "bg-blue-100 text-blue-600",
    fn: () => backupRepository.exportProducts(),
  },
  {
    key: "customers",
    label: "Export Pelanggan",
    description: "Data customer terdaftar & riwayat belanja",
    icon: Users,
    color: "bg-purple-100 text-purple-600",
    fn: () => backupRepository.exportCustomers(),
  },
  {
    key: "orders",
    label: "Export Pesanan",
    description: "Semua transaksi pesanan & status pembayaran",
    icon: ShoppingBag,
    color: "bg-emerald-100 text-emerald-600",
    fn: () => backupRepository.exportOrders(),
  },
  {
    key: "reviews",
    label: "Export Review",
    description: "Ulasan & rating produk dari pelanggan",
    icon: Star,
    color: "bg-amber-100 text-amber-600",
    fn: () => backupRepository.exportReviews(),
  },
  {
    key: "faq",
    label: "Export FAQ",
    description: "Seluruh pertanyaan & jawaban FAQ toko",
    icon: HelpCircle,
    color: "bg-cyan-100 text-cyan-600",
    fn: () => backupRepository.exportFAQ(),
  },
  {
    key: "snapshot",
    label: "Database Snapshot",
    description: "Metadata ringkasan database dalam format JSON",
    icon: FileJson,
    color: "bg-indigo-100 text-indigo-600",
    fn: () => backupRepository.exportDatabaseSnapshot(),
  },
];

export default function AdminBackupPage() {
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [results, setResults] = useState<
    Record<string, { success: boolean; rowCount?: number; error?: string }>
  >({});

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleExport = async (item: ExportItem) => {
    setExportingKey(item.key);
    try {
      const result = await item.fn();
      if (!result.success || !result.csvContent) {
        throw new Error(result.error || "Export gagal.");
      }

      const mime =
        item.key === "snapshot" ? "application/json" : "text/csv";
      backupRepository.triggerDownload(
        result.csvContent,
        result.filename || `${item.key}_export.csv`,
        mime
      );

      setResults((prev) => ({
        ...prev,
        [item.key]: { success: true, rowCount: result.rowCount },
      }));
      showToast(
        "success",
        `${item.label} berhasil diunduh (${result.rowCount ?? 0} baris).`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Terjadi error.";
      setResults((prev) => ({
        ...prev,
        [item.key]: { success: false, error: msg },
      }));
      showToast("error", `${item.label} gagal: ${msg}`);
    } finally {
      setExportingKey(null);
    }
  };

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
      <div className="border-b border-primary/10 pb-5">
        <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
          Backup Center
        </h1>
        <p className="mt-1 text-xs text-text-secondary sm:text-sm">
          Export data toko ke CSV atau JSON. File langsung terunduh ke perangkat Anda.
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-700">
        <Database className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <strong className="block font-bold">Informasi Export</strong>
          <p className="mt-0.5">
            Semua data diambil langsung dari Supabase PostgreSQL. Export tidak
            mempengaruhi data di database — hanya membaca dan menyalin.
          </p>
        </div>
      </div>

      {/* Export Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_ITEMS.map((item) => {
          const Icon = item.icon;
          const isLoading = exportingKey === item.key;
          const result = results[item.key];

          return (
            <div
              key={item.key}
              className="flex flex-col gap-4 rounded-3xl border border-primary/10 bg-white p-5 shadow-xs"
            >
              {/* Icon + Label */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-text-primary">
                    {item.label}
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Result status */}
              {result && (
                <div
                  className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${
                    result.success
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {result.success
                    ? `✓ Berhasil diunduh — ${result.rowCount ?? 0} baris`
                    : `✗ Gagal: ${result.error}`}
                </div>
              )}

              {/* Button */}
              <button
                type="button"
                disabled={isLoading || exportingKey !== null}
                onClick={() => handleExport(item)}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengekspor...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download{" "}
                    {item.key === "snapshot" ? "JSON" : "CSV"}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Export All Section */}
      <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs">
        <h3 className="mb-3 font-heading text-sm font-bold text-text-primary">
          Export Semua Data Sekaligus
        </h3>
        <p className="mb-4 text-xs text-text-secondary">
          Klik tombol di bawah untuk mengekspor semua data secara berurutan.
          Setiap file akan terunduh secara terpisah.
        </p>
        <button
          type="button"
          disabled={exportingKey !== null}
          onClick={async () => {
            for (const item of EXPORT_ITEMS) {
              await handleExport(item);
            }
          }}
          className="flex items-center gap-2 rounded-xl border border-primary/20 bg-secondary/30 px-5 py-2.5 text-sm font-semibold text-text-primary hover:bg-secondary/60 disabled:opacity-60 cursor-pointer"
        >
          <Download className="h-4 w-4 text-primary" />
          Export Semua ({EXPORT_ITEMS.length} file)
        </button>
      </div>
    </div>
  );
}
