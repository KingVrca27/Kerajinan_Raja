/**
 * @file app/admin/dashboard/activity/page.tsx
 * Halaman Audit Activity Log Admin (FITUR 2 — FASE 4.5.2)
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, Search, Filter, ArrowUpDown, FileSpreadsheet, ChevronLeft, ChevronRight,
  Eye, Loader2, User, Globe, Laptop, X, CheckCircle2, AlertTriangle, ShieldCheck
} from "lucide-react";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import type { DbActivityLog } from "@/src/types/adminMonitoring";

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState<DbActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [selectedLog, setSelectedLog] = useState<DbActivityLog | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await activityLogRepository.getAll();
      setLogs(list);
    } catch {
      showToast("error", "Gagal memuat log aktivitas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        l.action.toLowerCase().includes(q) ||
        (l.user_name && l.user_name.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q));

      const matchModule = moduleFilter === "all" || l.entity_type === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [logs, searchQuery, moduleFilter]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage]);

  const handleExportCSV = () => {
    const headers = "Waktu,Admin,Aktivitas,Modul,IP Address,Detail\n";
    const rows = filteredLogs.map((l) =>
      `"${l.created_at}","${l.user_name || "Admin"}","${l.action}","${l.entity_type}","${l.ip_address || "—"}","${(l.description || "").replace(/"/g, '""')}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_log_${Date.now()}.csv`;
    a.click();
    showToast("success", "Export CSV activity log berhasil!");
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
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Activity Log</h1>
          <p className="text-xs text-text-secondary sm:text-sm mt-1">
            Rekam jejak seluruh aksi perbaikan data, login, dan perubahan konten oleh admin.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-text-primary hover:bg-secondary/40 shadow-xs cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span>Export CSV / Excel</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Cari Admin, Aktivitas, atau Deskripsi..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => { setModuleFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-xl border border-primary/20 bg-white py-2.5 px-3 text-xs font-semibold focus:border-primary focus:outline-none"
        >
          <option value="all">Semua Modul</option>
          <option value="auth">Auth &amp; Session</option>
          <option value="product">Produk</option>
          <option value="category">Kategori</option>
          <option value="order">Pesanan</option>
          <option value="review">Review</option>
          <option value="inventory">Inventori</option>
          <option value="promotion">Promosi</option>
          <option value="cms">CMS Konten</option>
          <option value="settings">Pengaturan Website</option>
          <option value="media">Media Library</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat activity log dari Supabase...</span>
        </div>
      ) : paginatedLogs.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center text-sm text-text-secondary">
          <History className="mx-auto h-12 w-12 text-primary/30 mb-3" />
          <p className="font-semibold">Belum ada aktivitas tercatat.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-primary/10 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-secondary/30 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">Admin</th>
                  <th className="py-3.5 px-4">Aktivitas</th>
                  <th className="py-3.5 px-4 text-center">Modul</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-mono text-text-secondary">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-text-primary">
                      {log.user_name || "Admin"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary">{log.action}</div>
                      <div className="text-xs text-text-secondary truncate max-w-xs">{log.description}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-text-secondary">
                      {log.ip_address || "127.0.0.1 (Local)"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="rounded-xl bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-primary/10 px-6 py-4 text-xs">
            <span className="text-text-secondary">
              Menampilkan {paginatedLogs.length} dari {filteredLogs.length} log aktivitas
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
              <span className="font-semibold text-text-primary">Halaman {currentPage} dari {totalPages}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl border border-primary/20 p-2 text-text-secondary hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedLog(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-lg w-full rounded-3xl bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                <h3 className="font-heading text-base font-bold text-text-primary">Detail Activity Log</h3>
                <button type="button" onClick={() => setSelectedLog(null)} className="rounded-xl p-1 text-text-secondary hover:bg-primary/10">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div><span className="text-text-secondary">Waktu Eksekusi:</span> <strong className="text-text-primary block font-mono">{formatDate(selectedLog.created_at)}</strong></div>
                <div><span className="text-text-secondary">Admin Eksekutor:</span> <strong className="text-primary block">{selectedLog.user_name}</strong></div>
                <div><span className="text-text-secondary">Aksi / Aktivitas:</span> <strong className="text-text-primary block font-bold text-sm">{selectedLog.action}</strong></div>
                <div><span className="text-text-secondary">Modul Terkait:</span> <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase inline-block mt-0.5">{selectedLog.entity_type}</span></div>
                <div><span className="text-text-secondary">Deskripsi:</span> <p className="text-text-primary bg-secondary/20 p-3 rounded-xl mt-1">{selectedLog.description}</p></div>
                <div><span className="text-text-secondary">User Agent / Browser:</span> <p className="text-text-secondary font-mono break-all bg-gray-50 p-2 rounded-xl mt-1">{selectedLog.user_agent || "—"}</p></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
