/**
 * @file app/admin/dashboard/cms/branding/page.tsx
 *
 * Halaman CMS Branding Website — Kelola Logo Header, Logo Footer, Favicon, & Open Graph Image.
 * Repository: siteSettingsRepository (cmsRepository.ts)
 * Storage   : Supabase Storage bucket cms-assets/branding/
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, CheckCircle2, AlertTriangle, Loader2, Upload, ImageIcon, X, Image as ImageIcon2, Sparkles,
} from "lucide-react";
import Image from "next/image";
import {
  siteSettingsRepository,
  uploadCmsImage,
  SETTINGS_KEYS,
} from "@/src/lib/cmsRepository";

interface BrandingField {
  key: string;
  settingKey: string;
  label: string;
  description: string;
  recommendedSize: string;
  aspectRatio: string;
}

const BRANDING_FIELDS: BrandingField[] = [
  {
    key: "logoHeader",
    settingKey: SETTINGS_KEYS.LOGO_HEADER,
    label: "Logo Header",
    description: "Logo utama yang muncul di bagian navbar atas seluruh halaman.",
    recommendedSize: "200 x 60 px (PNG / WEBP dengan background transparan)",
    aspectRatio: "aspect-[3/1]",
  },
  {
    key: "logoFooter",
    settingKey: SETTINGS_KEYS.LOGO_FOOTER,
    label: "Logo Footer",
    description: "Logo yang muncul di bagian footer bagian bawah seluruh halaman.",
    recommendedSize: "200 x 60 px (PNG / WEBP dengan background transparan / kontras terang)",
    aspectRatio: "aspect-[3/1]",
  },
  {
    key: "logoAdmin",
    settingKey: SETTINGS_KEYS.LOGO_ADMIN,
    label: "Logo Admin Panel",
    description: "Logo yang muncul di bagian sidebar kiri dashboard admin.",
    recommendedSize: "100 x 100 px (PNG / WEBP dengan rasio 1:1)",
    aspectRatio: "aspect-square w-24 h-24",
  },
  {
    key: "favicon",
    settingKey: SETTINGS_KEYS.FAVICON,
    label: "Favicon Website",
    description: "Ikon kecil yang tampil di tab browser pelanggan.",
    recommendedSize: "64 x 64 px atau 32 x 32 px (PNG / ICO / WEBP rasio 1:1)",
    aspectRatio: "aspect-square w-24 h-24",
  },
  {
    key: "ogImage",
    settingKey: SETTINGS_KEYS.OG_IMAGE,
    label: "Open Graph Image (Social Share)",
    description: "Gambar pratinjau saat link website dibagikan ke WhatsApp, Facebook, Twitter, atau Telegram.",
    recommendedSize: "1200 x 630 px (Rasio 1.91:1 — JPG / WEBP)",
    aspectRatio: "aspect-[1.91/1]",
  },
];

const BRANDING_KEYS = BRANDING_FIELDS.map((f) => f.settingKey);

export default function AdminBrandingPage() {
  const [urls, setUrls] = useState<Record<string, string>>({
    [SETTINGS_KEYS.LOGO_HEADER]: "",
    [SETTINGS_KEYS.LOGO_FOOTER]: "",
    [SETTINGS_KEYS.LOGO_ADMIN]: "",
    [SETTINGS_KEYS.FAVICON]: "",
    [SETTINGS_KEYS.OG_IMAGE]: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await siteSettingsRepository.getSettings(BRANDING_KEYS);
      setUrls(settings);
    } catch {
      showToast("error", "Gagal memuat data branding.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = async (settingKey: string, file: File) => {
    setUploadingKey(settingKey);
    try {
      const result = await uploadCmsImage(file, "branding");
      if (!result) throw new Error("Gagal mengunggah gambar branding.");
      setUrls((prev) => ({ ...prev, [settingKey]: result.url }));
      showToast("success", "Gambar berhasil diunggah! Klik 'Simpan Perubahan Branding' untuk menerapkan.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await siteSettingsRepository.setSettings(
        urls,
        {
          [SETTINGS_KEYS.LOGO_HEADER]: { label: "Logo Header", type: "image" },
          [SETTINGS_KEYS.LOGO_FOOTER]: { label: "Logo Footer", type: "image" },
          [SETTINGS_KEYS.LOGO_ADMIN]: { label: "Logo Admin Panel", type: "image" },
          [SETTINGS_KEYS.FAVICON]: { label: "Favicon", type: "image" },
          [SETTINGS_KEYS.OG_IMAGE]: { label: "Open Graph Image", type: "image" },
        }
      );
      if (!result.success) throw new Error(result.error);
      showToast("success", "Aset branding berhasil disimpan ke Supabase!");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menyimpan aset branding.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Memuat aset branding...</span>
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
        <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Branding Website</h1>
        <p className="text-xs text-text-secondary sm:text-sm mt-1">
          Kelola Logo Header, Logo Footer, Favicon, dan Gambar Open Graph untuk media sosial.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {BRANDING_FIELDS.map((item, idx) => {
            const currentUrl = urls[item.settingKey];
            const isUploading = uploadingKey === item.settingKey;

            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-primary/10 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h2 className="font-heading text-base font-bold text-text-primary">{item.label}</h2>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => { fileInputRefs.current[item.settingKey] = el; }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(item.settingKey, f);
                    }}
                  />

                  {/* Preview Container */}
                  <div className="mb-4">
                    {currentUrl ? (
                      <div className={`relative ${item.aspectRatio} w-full rounded-2xl overflow-hidden border border-primary/10 bg-secondary/30 group flex items-center justify-center p-2`}>
                        <Image
                          src={currentUrl}
                          alt={item.label}
                          width={400}
                          height={200}
                          className="object-contain max-h-full max-w-full"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[item.settingKey]?.click()}
                            className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold shadow hover:bg-amber-50"
                          >
                            Ganti Gambar
                          </button>
                          <button
                            type="button"
                            onClick={() => setUrls((prev) => ({ ...prev, [item.settingKey]: "" }))}
                            className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-700 flex items-center gap-1"
                          >
                            <X className="h-3 w-3" /> Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[item.settingKey]?.click()}
                        disabled={isUploading}
                        className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/20 bg-secondary/20 p-8 text-center transition-colors hover:border-primary/50 hover:bg-secondary/40 ${item.aspectRatio}`}
                      >
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-primary/60" />
                        )}
                        <span className="text-xs font-semibold text-text-primary">
                          {isUploading ? "Mengunggah..." : `Upload ${item.label}`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-primary/5 pt-3">
                  <p className="text-[11px] text-text-secondary/70">
                    <strong className="font-semibold text-text-secondary">Rekomendasi:</strong> {item.recommendedSize}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 border-t border-primary/10">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan Branding"}</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
