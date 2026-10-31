/**
 * @file app/admin/dashboard/cms/homepage/page.tsx
 *
 * Halaman CMS Pengaturan Homepage — kontrol jumlah item yang tampil
 * di halaman beranda tanpa mengubah kode.
 *
 * Repository: siteSettingsRepository (cmsRepository.ts)
 *
 * Field:
 *   - Jumlah Produk Unggulan
 *   - Jumlah Produk Terbaru
 *   - Jumlah FAQ
 *   - Jumlah Testimoni
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, CheckCircle2, AlertTriangle, Loader2,
  LayoutDashboard, Package, HelpCircle, MessageSquare, Star,
} from "lucide-react";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

const HP_KEYS = [
  SETTINGS_KEYS.HP_FEATURED_COUNT,
  SETTINGS_KEYS.HP_NEW_COUNT,
  SETTINGS_KEYS.HP_FAQ_COUNT,
  SETTINGS_KEYS.HP_TESTIMONIAL_COUNT,
];

interface HPForm {
  featured: number;
  newProducts: number;
  faq: number;
  testimonials: number;
}

const SETTINGS_CONFIG = [
  {
    key: "featured" as keyof HPForm,
    settingKey: SETTINGS_KEYS.HP_FEATURED_COUNT,
    label: "Produk Unggulan",
    description: "Jumlah produk yang ditampilkan di seksi Produk Unggulan halaman beranda",
    icon: Star,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    min: 1, max: 20, step: 1,
  },
  {
    key: "newProducts" as keyof HPForm,
    settingKey: SETTINGS_KEYS.HP_NEW_COUNT,
    label: "Produk Terbaru",
    description: "Jumlah produk terbaru yang ditampilkan di seksi Produk Terbaru",
    icon: Package,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    min: 1, max: 20, step: 1,
  },
  {
    key: "faq" as keyof HPForm,
    settingKey: SETTINGS_KEYS.HP_FAQ_COUNT,
    label: "FAQ",
    description: "Jumlah FAQ yang ditampilkan di seksi FAQ halaman beranda",
    icon: HelpCircle,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    min: 1, max: 20, step: 1,
  },
  {
    key: "testimonials" as keyof HPForm,
    settingKey: SETTINGS_KEYS.HP_TESTIMONIAL_COUNT,
    label: "Testimoni",
    description: "Jumlah testimoni pelanggan yang ditampilkan di halaman beranda",
    icon: MessageSquare,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    min: 1, max: 20, step: 1,
  },
];

export default function AdminHomepagePage() {
  const [form, setForm] = useState<HPForm>({
    featured: 8,
    newProducts: 8,
    faq: 6,
    testimonials: 6,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const s = await siteSettingsRepository.getSettings(HP_KEYS);
      setForm({
        featured:     Number(s[SETTINGS_KEYS.HP_FEATURED_COUNT])    || 8,
        newProducts:  Number(s[SETTINGS_KEYS.HP_NEW_COUNT])         || 8,
        faq:          Number(s[SETTINGS_KEYS.HP_FAQ_COUNT])         || 6,
        testimonials: Number(s[SETTINGS_KEYS.HP_TESTIMONIAL_COUNT]) || 6,
      });
    } catch {
      showToast("error", "Gagal memuat pengaturan homepage.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await siteSettingsRepository.setSettings(
        {
          [SETTINGS_KEYS.HP_FEATURED_COUNT]:    String(form.featured),
          [SETTINGS_KEYS.HP_NEW_COUNT]:         String(form.newProducts),
          [SETTINGS_KEYS.HP_FAQ_COUNT]:         String(form.faq),
          [SETTINGS_KEYS.HP_TESTIMONIAL_COUNT]: String(form.testimonials),
        },
        {
          [SETTINGS_KEYS.HP_FEATURED_COUNT]:    { label: "Jumlah Produk Unggulan", type: "number" },
          [SETTINGS_KEYS.HP_NEW_COUNT]:         { label: "Jumlah Produk Terbaru",  type: "number" },
          [SETTINGS_KEYS.HP_FAQ_COUNT]:         { label: "Jumlah FAQ",             type: "number" },
          [SETTINGS_KEYS.HP_TESTIMONIAL_COUNT]: { label: "Jumlah Testimoni",       type: "number" },
        }
      );
      if (!result.success) throw new Error(result.error);
      showToast("success", "Pengaturan homepage berhasil disimpan ke Supabase!");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Memuat pengaturan homepage...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body max-w-6xl">

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

      <div className="border-b border-primary/10 pb-5">
        <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Pengaturan Homepage</h1>
        <p className="text-xs text-text-secondary sm:text-sm mt-1">
          Atur jumlah item yang tampil di halaman beranda tanpa mengubah kode. Perubahan langsung aktif.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-primary/10 pb-3 mb-5">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-text-primary">Konfigurasi Tampilan Beranda</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SETTINGS_CONFIG.map((cfg, idx) => {
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={cfg.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="rounded-2xl border border-primary/10 p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-heading text-sm font-bold text-text-primary">{cfg.label}</span>
                  </div>
                  <p className="text-xs text-text-secondary">{cfg.description}</p>

                  {/* Slider + Number */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Jumlah item</span>
                      <span className="font-heading text-2xl font-bold text-primary">{form[cfg.key]}</span>
                    </div>
                    <input
                      type="range"
                      min={cfg.min} max={cfg.max} step={cfg.step}
                      value={form[cfg.key]}
                      onChange={(e) => setForm({ ...form, [cfg.key]: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-text-secondary">
                      <span>{cfg.min}</span>
                      <span>{cfg.max}</span>
                    </div>
                  </div>

                  {/* Manual input */}
                  <input
                    type="number"
                    min={cfg.min} max={cfg.max}
                    value={form[cfg.key]}
                    onChange={(e) => {
                      const v = Math.min(cfg.max, Math.max(cfg.min, Number(e.target.value)));
                      setForm({ ...form, [cfg.key]: v });
                    }}
                    className="w-full rounded-xl border border-primary/20 py-2 px-3 text-sm text-center font-mono focus:border-primary focus:outline-none"
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan Homepage"}</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
