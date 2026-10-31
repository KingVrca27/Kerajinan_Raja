/**
 * @file app/admin/dashboard/cms/seo/page.tsx
 *
 * Halaman CMS SEO Global Website.
 * Repository: siteSettingsRepository (cmsRepository.ts)
 *
 * Field:
 *   Meta Title, Meta Description, Meta Keywords,
 *   Google Site Verification, Bing Site Verification
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, CheckCircle2, AlertTriangle, Loader2, Search, Globe,
} from "lucide-react";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

const SEO_KEYS = [
  SETTINGS_KEYS.SEO_TITLE,
  SETTINGS_KEYS.SEO_DESCRIPTION,
  SETTINGS_KEYS.SEO_KEYWORDS,
  SETTINGS_KEYS.GOOGLE_VERIFY,
  SETTINGS_KEYS.BING_VERIFY,
];

const DEFAULT_FORM = {
  seo_meta_title:          "",
  seo_meta_description:    "",
  seo_meta_keywords:       "",
  google_site_verification:"",
  bing_site_verification:  "",
};

export default function AdminSeoPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
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
      const s = await siteSettingsRepository.getSettings(SEO_KEYS);
      setForm({
        seo_meta_title:           s[SETTINGS_KEYS.SEO_TITLE]        ?? "",
        seo_meta_description:     s[SETTINGS_KEYS.SEO_DESCRIPTION]  ?? "",
        seo_meta_keywords:        s[SETTINGS_KEYS.SEO_KEYWORDS]     ?? "",
        google_site_verification: s[SETTINGS_KEYS.GOOGLE_VERIFY]    ?? "",
        bing_site_verification:   s[SETTINGS_KEYS.BING_VERIFY]      ?? "",
      });
    } catch {
      showToast("error", "Gagal memuat data SEO.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Character count helpers
  const titleLen = form.seo_meta_title.length;
  const descLen = form.seo_meta_description.length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await siteSettingsRepository.setSettings(
        {
          [SETTINGS_KEYS.SEO_TITLE]:       form.seo_meta_title,
          [SETTINGS_KEYS.SEO_DESCRIPTION]: form.seo_meta_description,
          [SETTINGS_KEYS.SEO_KEYWORDS]:    form.seo_meta_keywords,
          [SETTINGS_KEYS.GOOGLE_VERIFY]:   form.google_site_verification,
          [SETTINGS_KEYS.BING_VERIFY]:     form.bing_site_verification,
        },
        {
          [SETTINGS_KEYS.SEO_TITLE]:       { label: "Meta Title",               type: "text" },
          [SETTINGS_KEYS.SEO_DESCRIPTION]: { label: "Meta Description",          type: "text" },
          [SETTINGS_KEYS.SEO_KEYWORDS]:    { label: "Meta Keywords",             type: "text" },
          [SETTINGS_KEYS.GOOGLE_VERIFY]:   { label: "Google Site Verification",  type: "text" },
          [SETTINGS_KEYS.BING_VERIFY]:     { label: "Bing Site Verification",    type: "text" },
        }
      );
      if (!result.success) throw new Error(result.error);
      showToast("success", "Pengaturan SEO berhasil disimpan ke Supabase!");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menyimpan SEO.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Memuat data SEO...</span>
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
        <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Pengaturan SEO</h1>
        <p className="text-xs text-text-secondary sm:text-sm mt-1">
          Kelola meta tag dan verifikasi mesin pencari. Data tersimpan di Supabase.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Meta Tags */}
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-text-primary">Meta Tags</h2>
          </div>

          {/* Meta Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase text-text-secondary">Meta Title</label>
              <span className={`text-[11px] font-mono ${titleLen > 60 ? "text-red-500" : titleLen > 50 ? "text-amber-500" : "text-text-secondary"}`}>
                {titleLen}/60
              </span>
            </div>
            <input
              type="text"
              value={form.seo_meta_title}
              onChange={(e) => setForm({ ...form, seo_meta_title: e.target.value })}
              placeholder="Putra Art Shop — Kerajinan Tangan Asli Lombok Premium"
              maxLength={80}
              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-xs text-text-secondary">Optimal: 50–60 karakter. Tampil di tab browser dan hasil Google.</p>
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase text-text-secondary">Meta Description</label>
              <span className={`text-[11px] font-mono ${descLen > 160 ? "text-red-500" : descLen > 140 ? "text-amber-500" : "text-text-secondary"}`}>
                {descLen}/160
              </span>
            </div>
            <textarea
              rows={3}
              value={form.seo_meta_description}
              onChange={(e) => setForm({ ...form, seo_meta_description: e.target.value })}
              placeholder="Toko kerajinan tangan asli Lombok. Produk berkualitas tinggi buatan pengrajin lokal..."
              maxLength={200}
              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-xs text-text-secondary">Optimal: 140–160 karakter. Tampil sebagai deskripsi di hasil pencarian Google.</p>
          </div>

          {/* Meta Keywords */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Meta Keywords</label>
            <input
              type="text"
              value={form.seo_meta_keywords}
              onChange={(e) => setForm({ ...form, seo_meta_keywords: e.target.value })}
              placeholder="kerajinan tangan, lombok, batik, anyaman, produk handmade"
              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-xs text-text-secondary">Pisahkan dengan koma. Tidak terlalu berpengaruh di Google modern, tapi berguna untuk Bing.</p>
          </div>
        </div>

        {/* Verifikasi Mesin Pencari */}
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-text-primary">Verifikasi Mesin Pencari</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Google Site Verification</label>
            <input
              type="text"
              value={form.google_site_verification}
              onChange={(e) => setForm({ ...form, google_site_verification: e.target.value })}
              placeholder="Kode verifikasi dari Google Search Console"
              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm font-mono focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-xs text-text-secondary">
              Diperoleh dari <strong>Google Search Console</strong> → Settings → Ownership Verification → HTML Tag
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Bing Site Verification</label>
            <input
              type="text"
              value={form.bing_site_verification}
              onChange={(e) => setForm({ ...form, bing_site_verification: e.target.value })}
              placeholder="Kode verifikasi dari Bing Webmaster Tools"
              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm font-mono focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-xs text-text-secondary">
              Diperoleh dari <strong>Bing Webmaster Tools</strong> → Site Settings → XML Sitemaps → Verify
            </p>
          </div>
        </div>

        {/* Google Preview */}
        {(form.seo_meta_title || form.seo_meta_description) && (
          <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs">
            <h3 className="font-heading text-sm font-bold text-text-primary mb-3">Preview Hasil Google</h3>
            <div className="rounded-xl border border-gray-200 p-4 bg-white font-sans max-w-lg">
              <p className="text-[13px] text-[#1a0dab] truncate">putraartshop.com</p>
              <p className="text-[18px] text-[#1a0dab] font-medium truncate">{form.seo_meta_title || "Judul halaman Anda"}</p>
              <p className="text-[13px] text-[#4d5156] mt-0.5 line-clamp-2">{form.seo_meta_description || "Deskripsi halaman Anda akan tampil di sini..."}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan SEO"}</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
