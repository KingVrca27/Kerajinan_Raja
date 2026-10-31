/**
 * @file app/admin/dashboard/log/page.tsx
 * Halaman Activity Log Admin — FASE 4.5.2A
 * Route: /admin/dashboard/log
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Search,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Laptop,
  Clock,
  User,
  Filter,
} from "lucide-react";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import type { DbActivityLog } from "@/src/types/adminMonitoring";

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
    second: "2-digit",
  });
}

function formatDateInput(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

const MODULE_OPTIONS = [
  { value: "all", label: "Semua Modul" },
  { value: "auth", label: "Auth & Login" },
  { value: "product", label: "Produk" },
  { value: "category", label: "Kategori" },
  { value: "order", label: "Pesanan" },
  { value: "review", label: "Review" },
  { value: "inventory", label: "Inventori" },
  { value: "promotion", label: "Promosi" },
  { value: "cms", label: "CMS Konten" },
  { value: "settings", label: "Pengaturan" },
  { value: "media", label: "Media Library" },
  { value: "maintenance", label: "Maintenance" },
];

const PAGE_SIZE = 15;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState<DbActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<DbActivityLog | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Load ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await activityLogRepository.getAll();
      setLogs(list);
    } catch {
      showToast("error", "Gagal memuat activity log.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filter ──────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo
      ? new Date(dateTo + "T23:59:59").getTime()
      : null;

    return logs.filter((l) => {
      const logTs = new Date(l.created_at).getTime();

      const matchSearch =
        !q ||
        l.action.toLowerCase().includes(q) ||
        (l.user_name || "").toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q) ||
        l.entity_type.toLowerCase().includes(q);

      const matchModule =
        moduleFilter === "all" || l.entity_type === moduleFilter;

      const matchFrom = !fromTs || logTs >= fromTs;
      const matchTo = !toTs || logTs <= toTs;

      return matchSearch && matchModule && matchFrom && matchTo;
    });
  }, [logs, searchQuery, moduleFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  // ── Export CSV ──────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers =
      "Waktu,Admin,Aktivitas,Modul,Entity ID,IP Address,Browser,Detail\n";
    const rows = filteredLogs
      .map((l) =>
        [
          `"${l.created_at}"`,
          `"${l.user_name || "Admin"}"`,
          `"${l.action}"`,
          `"${l.entity_type}"`,
          `"${l.entity_id || ""}"`,
          `"${l.ip_address || ""}"`,
          `"${(l.user_agent || "").slice(0, 80)}"`,
          `"${(l.description || "").replace(/"/g, '""')}"`,
        ].join(",")
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_log_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Export CSV activity log berhasil.");
  };

  // ── Reset Filters ───────────────────────────────────────────
  const handleResetFilters = () => {
    setSearchQuery("");
    setModuleFilter("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const hasActiveFilter =
    searchQuery || moduleFilter !== "all" || dateFrom || dateTo;

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-body">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed top-5 right-5 z-[200] flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg ${
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Activity Log
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Rekam jejak seluruh aksi admin — login, perubahan data, konten, dan
            pengaturan.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-text-primary shadow-xs hover:bg-secondary/40 cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative lg:col-span-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari admin, aksi, atau deskripsi..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {/* Module filter */}
        <select
          value={moduleFilter}
          onChange={(e) => {
            setModuleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none"
        >
          {MODULE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Date From */}
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-text-secondary">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-xs focus:border-primary focus:outline-none"
          />
        </div>

        {/* Date To */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-text-secondary">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-xs focus:border-primary focus:outline-none"
            />
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset semua filter"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <Filter className="h-3.5 w-3.5" />
        <span>
          Menampilkan{" "}
          <strong className="text-text-primary">{filteredLogs.length}</strong>{" "}
          dari <strong className="text-text-primary">{logs.length}</strong> log
          aktivitas
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat activity log dari database...</span>
        </div>
      ) : paginatedLogs.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center text-sm text-text-secondary">
          <History className="mx-auto mb-3 h-12 w-12 text-primary/30" />
          <p className="font-semibold">Tidak ada aktivitas sesuai filter.</p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-secondary/30 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  <th className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Waktu
                    </div>
                  </th>
                  <th className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Admin
                    </div>
                  </th>
                  <th className="px-4 py-3.5">Aksi / Target</th>
                  <th className="px-4 py-3.5 text-center">Modul</th>
                  <th className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> IP / Browser
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-secondary/20"
                  >
                    <td className="px-4 py-3.5 font-mono text-[11px] text-text-secondary">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-text-primary">
                      {log.user_name || "Admin Sistem"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-text-primary">
                        {log.action}
                      </div>
                      {log.description && (
                        <div className="mt-0.5 max-w-xs truncate text-[11px] text-text-secondary">
                          {log.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-[11px] text-text-secondary">
                        <Globe className="h-3 w-3 shrink-0" />
                        <span>{log.ip_address || "—"}</span>
                      </div>
                      {log.user_agent && (
                        <div className="flex items-center gap-1 text-[11px] text-text-secondary">
                          <Laptop className="h-3 w-3 shrink-0" />
                          <span className="max-w-[120px] truncate">
                            {log.user_agent.split(" ")[0] || "—"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="rounded-xl bg-primary/10 p-2 text-primary transition-colors hover:bg-primary hover:text-white cursor-pointer"
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
              Halaman {currentPage} dari {totalPages} (
              {filteredLogs.length} log)
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
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setSelectedLog(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            >
              {/* Modal header */}
              <div className="mb-4 flex items-center justify-between border-b border-primary/10 pb-3">
                <h3 className="font-heading text-base font-bold text-text-primary">
                  Detail Activity Log
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-xl p-1 text-text-secondary hover:bg-primary/10 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <Row label="Waktu">
                  <span className="font-mono">
                    {formatDate(selectedLog.created_at)}
                  </span>
                </Row>
                <Row label="Admin">
                  <strong className="text-primary">
                    {selectedLog.user_name || "Admin Sistem"}
                  </strong>
                </Row>
                <Row label="Aksi">
                  <strong className="text-sm text-text-primary">
                    {selectedLog.action}
                  </strong>
                </Row>
                <Row label="Modul">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    {selectedLog.entity_type}
                  </span>
                </Row>
                {selectedLog.entity_id && (
                  <Row label="Entity ID">
                    <span className="font-mono text-text-secondary">
                      {selectedLog.entity_id}
                    </span>
                  </Row>
                )}
                {selectedLog.description && (
                  <Row label="Deskripsi">
                    <p className="mt-1 rounded-xl bg-secondary/30 p-3 leading-relaxed text-text-primary">
                      {selectedLog.description}
                    </p>
                  </Row>
                )}
                {selectedLog.ip_address && (
                  <Row label="IP Address">
                    <span className="font-mono text-text-secondary">
                      {selectedLog.ip_address}
                    </span>
                  </Row>
                )}
                {selectedLog.user_agent && (
                  <Row label="Browser / UA">
                    <p className="break-all rounded-xl bg-gray-50 p-2 font-mono text-[11px] text-text-secondary">
                      {selectedLog.user_agent}
                    </p>
                  </Row>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helper sub-component ───────────────────────────────────────
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-0.5 block text-text-secondary">{label}:</span>
      {children}
    </div>
  );
}
