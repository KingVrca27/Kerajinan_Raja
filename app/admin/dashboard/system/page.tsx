/**
 * @file app/admin/dashboard/system/page.tsx
 * Halaman Pengaturan Sistem — FASE 4.5.2B
 * Route: /admin/dashboard/system
 *
 * Pengaturan:
 *  - Timezone
 *  - Mata Uang
 *  - Format Tanggal
 *  - Pajak (PPN %)
 *  - Ongkir Default
 *  - Maintenance Mode
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Save, CheckCircle2, AlertTriangle, Loader2,
  Globe, DollarSign, Calendar, Percent, Truck, ShieldAlert,
  RefreshCw, Info, ToggleLeft, ToggleRight,
} from "lucide-react";
import { systemSettingsRepository } from "@/src/lib/systemSettingsRepository";
import type { SystemSettingsData } from "@/src/lib/systemSettingsRepository";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONE_OPTIONS = [
  { value: "Asia/Jakarta",   label: "Asia/Jakarta (WIB, UTC+7)" },
  { value: "Asia/Makassar",  label: "Asia/Makassar (WITA, UTC+8)" },
  { value: "Asia/Jayapura", label: "Asia/Jayapura (WIT, UTC+9)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+8)" },
  { value: "UTC",            label: "UTC (Coordinated Universal Time)" },
];

const CURRENCY_OPTIONS = [
  { value: "IDR", label: "IDR — Rupiah Indonesia (Rp)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "SGD", label: "SGD — Singapore Dollar (S$)" },
  { value: "MYR", label: "MYR — Malaysian Ringgit (RM)" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY",   label: "DD/MM/YYYY — 31/07/2026" },
  { value: "MM/DD/YYYY",   label: "MM/DD/YYYY — 07/31/2026" },
  { value: "YYYY-MM-DD",   label: "YYYY-MM-DD — 2026-07-31" },
  { value: "DD MMM YYYY",  label: "DD MMM YYYY — 31 Jul 2026" },
  { value: "D MMMM YYYY",  label: "D MMMM YYYY — 31 Juli 2026" },
];

const DEFAULT_SETTINGS: SystemSettingsData = {
  timezone: "Asia/Jakarta",
  currency: "IDR",
  date_format: "DD/MM/YYYY",
  tax_percentage: 11,
  default_shipping_cost: 15000,
  maintenance_mode: false,
};

// ─── Helper: Preview tanggal sesuai format ────────────────────────────────────

function previewDate(format: string): string {
  const now = new Date();
  const d    = String(now.getDate()).padStart(2, "0");
  const m    = String(now.getMonth() + 1).padStart(2, "0");
  const y    = now.getFullYear();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthsFull = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

  return format
    .replace("YYYY",   String(y))
    .replace("MM",     m)
    .replace("DD",     d)
    .replace("MMM",    months[now.getMonth()])
    .replace("MMMM",   monthsFull[now.getMonth()])
    .replace(/\bD\b/,  String(now.getDate()));
}

// ─── Setting Card Wrapper ─────────────────────────────────────────────────────

function SettingCard({
  icon: Icon,
  title,
  children,
  accentColor = "text-primary",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center gap-2.5 border-b border-primary/10 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
          <Icon className={`h-4 w-4 ${accentColor}`} />
        </div>
        <h2 className="font-heading text-sm font-bold text-text-primary">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSystemSettingsPage() {
  const [formData, setFormData]   = useState<SystemSettingsData>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,  setIsSaving]  = useState(false);
  const [isDirty,   setIsDirty]   = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await systemSettingsRepository.getAll();
      setFormData(data);
      setIsDirty(false);
    } catch {
      showToast("error", "Gagal memuat pengaturan sistem.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleChange = <K extends keyof SystemSettingsData>(
    key: K,
    value: SystemSettingsData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await systemSettingsRepository.saveAll(formData);
      if (!res.success) throw new Error(res.error);
      showToast("success", "Pengaturan sistem berhasil disimpan.");
      setIsDirty(false);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading State ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary font-body">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Memuat pengaturan sistem dari database...</span>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl space-y-6 font-body">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed right-5 top-5 z-[200] flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-xl ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success"
              ? <CheckCircle2 className="h-4 w-4" />
              : <AlertTriangle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-primary/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Pengaturan Sistem
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Konfigurasi timezone, mata uang, format tanggal, pajak, ongkir, dan mode pemeliharaan.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-white px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40 cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            type="button"
            disabled={!isDirty || isSaving}
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isSaving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Save className="h-4 w-4" />}
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* ── Settings Cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* 1. Timezone */}
        <SettingCard icon={Globe} title="Zona Waktu (Timezone)">
          <select
            value={formData.timezone}
            onChange={(e) => handleChange("timezone", e.target.value)}
            className="w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-text-secondary">
            <Info className="h-3 w-3 shrink-0" />
            Timezone digunakan untuk timestamp pada pesanan, log aktivitas, dan notifikasi.
          </p>
        </SettingCard>

        {/* 2. Mata Uang */}
        <SettingCard icon={DollarSign} title="Mata Uang (Currency)">
          <select
            value={formData.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
            className="w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <div className="mt-2 rounded-xl bg-secondary/30 px-3 py-2 text-[11px] text-text-secondary">
            Mata uang aktif: <strong className="text-text-primary">{formData.currency}</strong>
            {formData.currency === "IDR" && " — format: Rp 150.000"}
            {formData.currency === "USD" && " — format: $15.00"}
          </div>
        </SettingCard>

        {/* 3. Format Tanggal */}
        <SettingCard icon={Calendar} title="Format Tanggal">
          <select
            value={formData.date_format}
            onChange={(e) => handleChange("date_format", e.target.value)}
            className="w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          >
            {DATE_FORMAT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <div className="mt-2 rounded-xl bg-secondary/30 px-3 py-2 text-[11px] text-text-secondary">
            Preview hari ini:{" "}
            <strong className="font-mono text-text-primary">
              {previewDate(formData.date_format)}
            </strong>
          </div>
        </SettingCard>

        {/* 4. Pajak & Ongkir */}
        <SettingCard icon={Percent} title="Pajak & Ongkir Default">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Pajak */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-text-secondary">
                Persentase Pajak (PPN %)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={formData.tax_percentage}
                  onChange={(e) =>
                    handleChange("tax_percentage", parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-4 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">
                  %
                </span>
              </div>
              <p className="mt-1 text-[11px] text-text-secondary">
                PPN Indonesia: 11% (standar 2022+)
              </p>
            </div>

            {/* Ongkir */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-text-secondary">
                Ongkos Kirim Default (Rp)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">
                  Rp
                </span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.default_shipping_cost}
                  onChange={(e) =>
                    handleChange("default_shipping_cost", parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <p className="mt-1 text-[11px] text-text-secondary">
                Digunakan jika estimasi ongkir tidak tersedia.
              </p>
            </div>
          </div>

          {/* Preview kalkulasi */}
          <div className="mt-3 rounded-xl bg-secondary/30 p-3 text-[11px]">
            <div className="font-bold text-text-primary mb-1">Preview Kalkulasi Pesanan:</div>
            <div className="space-y-0.5 text-text-secondary font-mono">
              <div className="flex justify-between">
                <span>Subtotal produk</span>
                <span>Rp 100.000</span>
              </div>
              <div className="flex justify-between">
                <span>PPN ({formData.tax_percentage}%)</span>
                <span>Rp {(100000 * formData.tax_percentage / 100).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkir default</span>
                <span>Rp {formData.default_shipping_cost.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between border-t border-primary/10 pt-1 font-bold text-text-primary">
                <span>Total</span>
                <span>
                  Rp {(100000 + (100000 * formData.tax_percentage / 100) + formData.default_shipping_cost).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </SettingCard>

        {/* 5. Maintenance Mode */}
        <div
          className={`rounded-3xl border p-5 shadow-xs transition-all duration-300 ${
            formData.maintenance_mode
              ? "border-red-200 bg-red-50"
              : "border-primary/10 bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  formData.maintenance_mode
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-bold text-text-primary">
                  Maintenance Mode
                </h2>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {formData.maintenance_mode
                    ? "⚠ Website sedang maintenance. Pengunjung publik tidak dapat mengakses."
                    : "Website berjalan normal dan dapat diakses publik."}
                </p>
              </div>
            </div>

            {/* Toggle */}
            <button
              type="button"
              onClick={() => handleChange("maintenance_mode", !formData.maintenance_mode)}
              className="flex shrink-0 items-center gap-2 cursor-pointer transition-all"
              aria-label="Toggle maintenance mode"
            >
              {formData.maintenance_mode ? (
                <>
                  <ToggleRight className="h-8 w-8 text-red-500" />
                  <span className="text-xs font-bold text-red-600">ON</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                  <span className="text-xs font-bold text-gray-400">OFF</span>
                </>
              )}
            </button>
          </div>

          {formData.maintenance_mode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 rounded-xl border border-red-200 bg-white p-3 text-xs text-red-700"
            >
              <strong className="block mb-1">⚠ Perhatian:</strong>
              Saat maintenance mode aktif, pengunjung akan melihat halaman under maintenance.
              Hanya admin yang login dapat mengakses website. Pastikan Anda simpan perubahan ini.
            </motion.div>
          )}
        </div>

      </div>

      {/* Info Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-700">
        <div className="mb-1 flex items-center gap-2 font-bold">
          <Info className="h-3.5 w-3.5" />
          Penyimpanan Pengaturan
        </div>
        <p>
          Semua pengaturan disimpan di tabel{" "}
          <code className="rounded bg-blue-100 px-1 font-mono">site_settings</code>{" "}
          (Supabase PostgreSQL) dan langsung berlaku setelah disimpan.
          Tidak memerlukan restart server.
        </p>
      </div>

      {/* Sticky Save Footer */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-6 flex items-center justify-between rounded-2xl border border-primary/20 bg-white px-5 py-3 shadow-xl"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Ada perubahan yang belum disimpan.
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 cursor-pointer transition-colors"
            >
              {isSaving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Save className="h-4 w-4" />}
              {isSaving ? "Menyimpan..." : "Simpan Sekarang"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
