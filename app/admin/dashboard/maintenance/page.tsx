/**
 * @file app/admin/dashboard/maintenance/page.tsx
 * Halaman Maintenance, Backup & Restore, Ekspor/Impor (FITUR 3 — FASE 4.5.2)
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardDrive, Download, Upload, Database, FileSpreadsheet, CheckCircle2,
  AlertTriangle, Loader2, FileText, AlertCircle, PackagePlus
} from "lucide-react";
import { maintenanceRepository } from "@/src/lib/maintenanceRepository";
import type { BackupRecord, ImportValidationResult } from "@/src/types/adminMonitoring";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

interface ImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: { row: number; field: string; message: string }[];
}

export default function AdminMaintenancePage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [exportingTable, setExportingTable] = useState<string | null>(null);

  // Import state
  const [importValidation, setImportValidation] = useState<ImportValidationResult | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = await maintenanceRepository.getBackupHistory();
      setBackups(history);
    } catch {
      showToast("error", "Gagal memuat riwayat backup.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Actions
  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await maintenanceRepository.triggerBackup();
      if (!res.success) throw new Error(res.error);
      showToast("success", "Backup database berhasil dilakukan!");
      await loadData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Backup gagal.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExport = async (table: "products" | "orders" | "customers" | "reviews" | "inventory_logs" | "promotions") => {
    setExportingTable(table);
    try {
      const csvStr = await maintenanceRepository.exportTable(table);
      const blob = new Blob([csvStr], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${table}_${Date.now()}.csv`;
      a.click();
      showToast("success", `Export data ${table} berhasil!`);
    } catch {
      showToast("error", `Gagal mengekspor data ${table}.`);
    } finally {
      setExportingTable(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset semua state import
    setImportFileName(file.name);
    setImportValidation(null);
    setImportResult(null);
    setCsvText("");

    setIsValidating(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        setCsvText(text);
        const valResult = await maintenanceRepository.validateProductCSV(text);
        setImportValidation(valResult);
      } catch {
        showToast("error", "Gagal membaca atau memvalidasi file CSV.");
      } finally {
        setIsValidating(false);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!csvText || !importValidation?.valid) return;
    setShowConfirmModal(false);
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await maintenanceRepository.importProductsFromCSV(csvText);
      setImportResult(result);
      if (result.success) {
        showToast("success", `Berhasil mengimpor ${result.importedCount} produk ke database!`);
        // Reset form setelah sukses
        setImportFileName("");
        setCsvText("");
        setImportValidation(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        showToast("error", `Import gagal. ${result.failedCount} baris tidak berhasil diimpor.`);
      }
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Terjadi kesalahan saat import.");
    } finally {
      setIsImporting(false);
    }
  };

  const lastBackup = backups[0];

  return (
    <div className="space-y-6 font-body max-w-5xl">

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

      {/* Confirm Import Modal */}
      <AnimatePresence>
        {showConfirmModal && importValidation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
                  <PackagePlus className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-heading text-base font-bold text-text-primary">Konfirmasi Import Produk</h3>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Anda akan mengimpor{" "}
                <span className="font-bold text-text-primary">{importValidation.validRowsCount} produk</span>{" "}
                ke database. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 mb-5">
                ⚠️ Pastikan data CSV sudah benar sebelum melanjutkan. Data yang diimpor akan langsung tersimpan ke database.
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 rounded-xl border border-primary/20 py-2.5 text-sm font-semibold text-text-secondary hover:bg-secondary/40 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 cursor-pointer transition-colors"
                >
                  <PackagePlus className="h-4 w-4" />
                  Ya, Import Sekarang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-primary/10 pb-5">
        <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Maintenance, Backup &amp; Restore</h1>
        <p className="text-xs text-text-secondary sm:text-sm mt-1">
          Backup database berkala, ekspor data katalog/pesanan, dan impor data CSV dengan validasi skema.
        </p>
      </div>

      {/* Backup Status Banner */}
      <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-text-primary">Database Backup Status</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Terakhir Backup: <strong className="text-text-primary">{lastBackup ? formatDate(lastBackup.created_at) : "Belum pernah backup"}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isBackingUp}
          onClick={handleTriggerBackup}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60 cursor-pointer shrink-0"
        >
          {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
          <span>{isBackingUp ? "Memproses Backup..." : "Backup Database Sekarang"}</span>
        </button>
      </div>

      {/* Section 1: Ekspor Data Master */}
      <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
          <Download className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-base font-bold text-text-primary">Ekspor Data (CSV/Excel)</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: "products" as const, label: "Export Produk" },
            { key: "orders" as const, label: "Export Pesanan" },
            { key: "customers" as const, label: "Export Pelanggan" },
            { key: "reviews" as const, label: "Export Review" },
            { key: "inventory_logs" as const, label: "Export Inventory" },
            { key: "promotions" as const, label: "Export Promo" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={exportingTable === item.key}
              onClick={() => handleExport(item.key)}
              className="flex items-center justify-between rounded-xl border border-primary/20 bg-secondary/20 p-3.5 text-xs font-semibold text-text-primary hover:bg-primary/10 hover:border-primary/40 transition-all cursor-pointer"
            >
              <span>{item.label}</span>
              {exportingTable === item.key ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Section 2: Impor Data (Validated CSV) */}
      <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
          <Upload className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-base font-bold text-text-primary">Impor Produk dari CSV</h2>
        </div>

        {/* Format Petunjuk */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 space-y-1">
          <p className="font-bold">Format CSV yang diperlukan:</p>
          <p className="font-mono bg-white rounded p-2 border border-blue-100 select-all">name,price,category</p>
          <p className="text-blue-700">Kolom wajib: <strong>name</strong>, <strong>price</strong>, <strong>category</strong>. Kolom opsional: <strong>stock</strong>.</p>
          <p className="text-blue-700">Nama kategori harus sesuai dengan kategori yang sudah ada di database.</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={isValidating || isImporting}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-5 py-3 text-xs font-bold text-primary hover:bg-primary/10 cursor-pointer disabled:opacity-60"
          >
            {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>{isValidating ? "Memvalidasi..." : "Pilih File CSV Produk"}</span>
          </button>
          <span className="text-xs text-text-secondary">{importFileName || "Belum ada file dipilih"}</span>
        </div>

        {/* Validation Result Box */}
        <AnimatePresence>
          {importValidation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`rounded-2xl border p-4 text-xs space-y-3 ${
                importValidation.valid ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  {importValidation.valid
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    : <AlertCircle className="h-4 w-4 text-red-600" />}
                  {importValidation.valid ? "Validasi CSV Berhasil!" : "Ditemukan Kesalahan dalam CSV"}
                </span>
                <span className="font-semibold text-text-secondary">
                  {importValidation.validRowsCount} / {importValidation.totalRows} Baris Valid
                </span>
              </div>

              {/* Preview rows */}
              {importValidation.valid && importValidation.preview.length > 0 && (
                <div className="text-text-secondary space-y-1">
                  <p className="font-bold text-emerald-700">Preview data (maks. 5 baris pertama):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-emerald-100 text-emerald-800">
                          {Object.keys(importValidation.preview[0]).map(k => (
                            <th key={k} className="text-left px-2 py-1 font-semibold capitalize">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importValidation.preview.map((row, idx) => (
                          <tr key={idx} className="border-t border-emerald-100">
                            {Object.values(row).map((val, vi) => (
                              <td key={vi} className="px-2 py-1 text-text-primary">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importValidation.errors.length > 0 && (
                <div className="space-y-1 text-red-700 bg-white p-3 rounded-xl border border-red-200 max-h-48 overflow-y-auto">
                  <span className="font-bold block">Daftar Error:</span>
                  {importValidation.errors.map((err, idx) => (
                    <p key={idx}>• Baris {err.row}: [{err.field}] — {err.message}</p>
                  ))}
                </div>
              )}

              {/* Tombol Import */}
              {importValidation.valid && (
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => setShowConfirmModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer transition-colors"
                >
                  {isImporting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengimpor produk...</>
                    : <><PackagePlus className="h-4 w-4" /> Konfirmasi &amp; Import {importValidation.validRowsCount} Produk</>}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import Loading State */}
        <AnimatePresence>
          {isImporting && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
            >
              <Loader2 className="h-5 w-5 animate-spin shrink-0" />
              <div>
                <p className="font-bold">Mengimpor produk...</p>
                <p className="text-xs text-blue-700 mt-0.5">Mohon tunggu, jangan tutup halaman ini.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import Result */}
        <AnimatePresence>
          {importResult && !isImporting && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-4 text-xs space-y-2 ${
                importResult.success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {importResult.success
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  : <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />}
                <span className="font-bold text-sm">
                  {importResult.success ? "Import Berhasil!" : "Import Gagal"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-100 p-2.5 text-center">
                  <p className="text-lg font-bold text-emerald-700">{importResult.importedCount}</p>
                  <p className="text-emerald-600">Produk berhasil</p>
                </div>
                <div className={`rounded-xl p-2.5 text-center ${importResult.failedCount > 0 ? "bg-red-100" : "bg-gray-100"}`}>
                  <p className={`text-lg font-bold ${importResult.failedCount > 0 ? "text-red-700" : "text-gray-500"}`}>{importResult.failedCount}</p>
                  <p className={importResult.failedCount > 0 ? "text-red-600" : "text-gray-400"}>Produk gagal</p>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="space-y-1 text-red-700 bg-white p-3 rounded-xl border border-red-200 max-h-40 overflow-y-auto">
                  <span className="font-bold block">Detail Error:</span>
                  {importResult.errors.map((err, idx) => (
                    <p key={idx}>• Baris {err.row}: [{err.field}] — {err.message}</p>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section 3: Riwayat Backup */}
      <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
        <h3 className="font-heading text-base font-bold text-text-primary border-b border-primary/10 pb-3">Riwayat Backup Sistem</h3>

        {backups.length === 0 ? (
          <p className="text-xs text-text-secondary text-center py-6">Belum ada riwayat backup.</p>
        ) : (
          <div className="space-y-2">
            {backups.map((b) => (
              <div key={b.id} className="flex items-center justify-between border border-primary/10 p-3 rounded-2xl text-xs bg-white">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <span className="font-bold text-text-primary block">{b.filename}</span>
                    <span className="text-text-secondary">{formatDate(b.created_at)} • {formatBytes(b.size)}</span>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

