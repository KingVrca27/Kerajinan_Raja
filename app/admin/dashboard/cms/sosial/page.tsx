/**
 * @file app/admin/dashboard/cms/sosial/page.tsx
 *
 * Halaman CMS Sosial Media — kelola tautan + status aktif tiap platform.
 * Repository: siteSettingsRepository (cmsRepository.ts)
 *
 * Platform: Facebook, Instagram, TikTok, YouTube, Shopee, Tokopedia
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, CheckCircle2, AlertTriangle, Loader2,
  Share2, ExternalLink,
} from "lucide-react";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

// ---------------------------------------------------------------------------
// PLATFORM CONFIG
// ---------------------------------------------------------------------------

interface Platform {
  key: string;
  activeKey: string;
  label: string;
  placeholder: string;
  color: string;
  emoji: string;
}

const PLATFORMS: Platform[] = [
  {
    key:       SETTINGS_KEYS.SOCIAL_FACEBOOK,
    activeKey: "social_facebook_active",
    label:     "Facebook",
    placeholder: "https://facebook.com/putraartshop",
    color:     "text-blue-600",
    emoji:     "📘",
  },
  {
    key:       SETTINGS_KEYS.SOCIAL_INSTAGRAM,
    activeKey: "social_instagram_active",
    label:     "Instagram",
    placeholder: "https://instagram.com/putraartshop",
    color:     "text-pink-600",
    emoji:     "📸",
  },
  {
    key:       SETTINGS_KEYS.SOCIAL_TIKTOK,
    activeKey: "social_tiktok_active",
    label:     "TikTok",
    placeholder: "https://tiktok.com/@putraartshop",
    color:     "text-gray-900",
    emoji:     "🎵",
  },
  {
    key:       SETTINGS_KEYS.SOCIAL_YOUTUBE,
    activeKey: "social_youtube_active",
    label:     "YouTube",
    placeholder: "https://youtube.com/@putraartshop",
    color:     "text-red-600",
    emoji:     "▶️",
  },
  {
    key:       SETTINGS_KEYS.SOCIAL_SHOPEE,
    activeKey: "social_shopee_active",
    label:     "Shopee",
    placeholder: "https://shopee.co.id/putraartshop",
    color:     "text-orange-600",
    emoji:     "🛒",
  },
  {
    key:       SETTINGS_KEYS.SOCIAL_TOKOPEDIA,
    activeKey: "social_tokopedia_active",
    label:     "Tokopedia",
    placeholder: "https://tokopedia.com/putraartshop",
    color:     "text-green-600",
    emoji:     "🟢",
  },
];

const ALL_KEYS = [
  ...PLATFORMS.map((p) => p.key),
  ...PLATFORMS.map((p) => p.activeKey),
];

type FormState = Record<string, string>;

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------

export default function AdminSosialPage() {
  const [form, setForm] = useState<FormState>({});
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
      const settings = await siteSettingsRepository.getSettings(ALL_KEYS);
      setForm(settings);
    } catch {
      showToast("error", "Gagal memuat data sosial media.");
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
        form,
        Object.fromEntries(
          PLATFORMS.flatMap((p) => [
            [p.key,       { label: p.label + " URL",    type: "text" as const }],
            [p.activeKey, { label: p.label + " Aktif",  type: "boolean" as const }],
          ])
        )
      );
      if (!result.success) throw new Error(result.error);
      showToast("success", "Tautan sosial media berhasil disimpan ke Supabase!");
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
        <span>Memuat data sosial media...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body max-w-6xl">

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
      <div className="border-b border-primary/10 pb-5">
        <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Sosial Media</h1>
        <p className="text-xs text-text-secondary sm:text-sm mt-1">
          Kelola tautan dan status aktif setiap platform sosial media. Data tersimpan di Supabase.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Platform cards */}
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
            <Share2 className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-text-primary">Tautan Platform Sosial</h2>
          </div>

          {PLATFORMS.map((p, idx) => {
            const isActive = form[p.activeKey] !== "false";
            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-2xl border p-4 transition-all ${isActive ? "border-primary/10 bg-white" : "border-gray-200 bg-gray-50/60 opacity-70"}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{p.emoji}</span>
                  <span className={`font-heading text-sm font-bold ${p.color}`}>{p.label}</span>

                  {/* Toggle */}
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-text-secondary">{isActive ? "Aktif" : "Nonaktif"}</span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, [p.activeKey]: isActive ? "false" : "true" })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={form[p.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [p.key]: e.target.value })}
                    placeholder={p.placeholder}
                    disabled={!isActive}
                    className="flex-1 rounded-xl border border-primary/20 py-2.5 px-3 text-sm focus:border-primary focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  {form[p.key] && (
                    <a
                      href={form[p.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-xl border border-primary/20 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? "Menyimpan..." : "Simpan Sosial Media"}</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
