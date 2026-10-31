/**
 * @file app/admin/dashboard/pengaturan/page.tsx
 * Halaman System Settings (Pengaturan Sistem) — FASE 4.5.2B
 * Route: /admin/dashboard/pengaturan
 *
 * Setting: timezone, mata uang, format tanggal, pajak, ongkir default, maintenance mode.
 * Semua tersimpan di tabel site_settings (Supabase).
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Save, CheckCircle2, AlertTriangle, Loader2,
  Globe, DollarSign, Calendar, Percent, Truck, ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { systemSettingsRepository } from "@/src/lib/systemSettingsRepository";
import type { SystemSettingsData } from "@/src/lib/systemSettingsRepository";

const TIMEZONE_OPTIONS = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Singapore",
  "UTC",
];

const CURRENCY_OPTIONS = [
  { value: "IDR", label: "IDR — Rupiah Indonesia" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/07/2026)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (07/31/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-07-31)" },
  { value: "DD MMM YYYY", label: "DD MMM YYYY (31 Jul 2026)" },
];

export default function AdminPengaturanSistemPage() {
  const [formData, setFormData] = useState<SystemSettingsData>({
    timezone: "Asia/Jakarta",
    currency: "IDR",
    date_format: "DD/MM/YYYY",
    tax_percentage: 11,
    default_shipping_cost: 15000,
    maintenance_mode: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await systemSettingsRepository.getAll();
      setFormData(data);
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary font-body">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Memuat pengaturan sistem dari database...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 font-body">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`fixed right-5 top-5 z-[200] flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg ${
              toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-primary/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Pengaturan Sistem</h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Konfigurasi timezone, mata uang, pajak, ongkir, dan mode pemeliharaan.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-white px-3 py-2 text-xs font-semibold hover:bg-secondary/40 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            type="button"
            disabled={!isDirty || isSaving}
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">

        {/* 1. Timezone */}
        <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-primary/10 pb-3">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-bold text-text-primary">Zona Waktu (Timezone)</h2>
          </div>
          <select
            value={formData.timezone}
            onChange={(e) => handleChange("timezone", e.target.value)}
            className="w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <p className="mt-2 text-[11px] text-text-secondary">
            Timezone digunakan untuk timestamp pada pesanan, log, dan notifikasi.
          </p>
        </div>

        {/* 2. Mata Uang */}
        <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-primary/10 pb-3">
            <DollarSign className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-bold text-text-primary">Mata Uang (Currency)</h2>
          </div>
          <select
            value={formData.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
            className="w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* 3. Format Tanggal */}
        <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-primary/10 pb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-bold text-text-primary">Format Tanggal</h2>
          </div>
          <select
            value={formData.date_format}
            onChange={(e) => handleChange("date_format", e.target.value)}
            className="w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          >
            {DATE_FORMAT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* 4. Pajak & Ongkir */}
        <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-primary/10 pb-3">
            <Percent className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-bold text-text-primary">Pajak &amp; Ongkir Default</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  onChange={(e) => handleChange("tax_percentage", parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-4 pr-8 text-sm focus:border-primary focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">%</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-text-secondary">
                Ongkos Kirim Default (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">Rp</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.default_shipping_cost}
                  onChange={(e) => handleChange("default_shipping_cost", parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Maintenance Mode */}
        <div className={`rounded-3xl border p-5 shadow-xs transition-colors ${
          formData.maintenance_mode
            ? "border-red-200 bg-red-50"
            : "border-primary/10 bg-white"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                formData.maintenance_mode ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
              }`}>
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-bold text-text-primary">Maintenance Mode</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {formData.maintenance_mode
                    ? "⚠ Website sedang dalam mode pemeliharaan. Pengunjung tidak dapat mengakses."
                    : "Website berjalan normal dan dapat diakses publik."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleChange("maintenance_mode", !formData.maintenance_mode)}
              className={`relative flex h-7 w-14 items-center rounded-full transition-all cursor-pointer ${
                formData.maintenance_mode ? "bg-red-500" : "bg-gray-300"
              }`}
            >
              <motion.span
                animate={{ x: formData.maintenance_mode ? 28 : 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="h-5 w-5 rounded-full bg-white shadow-md"
              />
            </button>
          </div>
        </div>

      </div>

      {/* Save button sticky footer */}
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-6 flex items-center justify-between rounded-2xl border border-primary/20 bg-white px-5 py-3 shadow-lg"
        >
          <span className="text-xs font-semibold text-text-secondary">
            Ada perubahan yang belum disimpan.
          </span>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Sekarang
          </button>
        </motion.div>
      )}
    </div>
  );
}
