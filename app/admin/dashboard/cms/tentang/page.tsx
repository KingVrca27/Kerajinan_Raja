/**
 * @file app/admin/dashboard/cms/tentang/page.tsx
 *
 * Halaman CMS Tentang Kami — multi-section editor.
 * Repository: aboutRepository (cmsRepository.ts)
 * Storage   : Supabase cms-assets/about/
 *
 * Section yang dikelola:
 *   - hero    → Judul & Deskripsi Utama Halaman About
 *   - story   → Sejarah Singkat
 *   - vision  → Visi
 *   - mission → Misi
 *
 * Setiap section: Judul, Konten/Deskripsi, Gambar (opsional), Status Aktif
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, CheckCircle2, AlertTriangle, Loader2, Upload, ImageIcon, X,
} from "lucide-react";
import Image from "next/image";
import { aboutRepository, uploadCmsImage, type DbAboutSection } from "@/src/lib/cmsRepository";

// ---------------------------------------------------------------------------
// SECTIONS CONFIG
// ---------------------------------------------------------------------------

const SECTIONS = [
  { key: "hero",    label: "Judul & Deskripsi Utama",  icon: "🏠", hint: "Tampil sebagai header halaman Tentang Kami" },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

interface SectionForm {
  title: string;
  content: string;
  imageUrl: string;
  isActive: boolean;
}

type SectionsState = Record<SectionKey, SectionForm>;

const DEFAULT_SECTION: SectionForm = { title: "", content: "", imageUrl: "", isActive: true };

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------

export default function AdminTentangPage() {
  const [sections, setSections] = useState<SectionsState>({
    hero: { ...DEFAULT_SECTION },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);
  const [uploadingSection, setUploadingSection] = useState<SectionKey | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fileRefs = useRef<Record<SectionKey, HTMLInputElement | null>>({
    hero: null,
  });

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Load all sections
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await aboutRepository.getAll();
      const mapped: SectionsState = {
        hero: { ...DEFAULT_SECTION },
      };
      for (const row of all as DbAboutSection[]) {
        const key = row.section as SectionKey;
        if (key in mapped) {
          mapped[key] = {
            title: row.title ?? "",
            content: row.content ?? "",
            imageUrl: row.image_url ?? "",
            isActive: row.is_active,
          };
        }
      }
      setSections(mapped);
    } catch {
      showToast("error", "Gagal memuat data Tentang Kami.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Update one section field
  const updateSection = (key: SectionKey, field: keyof SectionForm, value: string | boolean) => {
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  // Upload image for a section
  const handleImageUpload = async (key: SectionKey, file: File) => {
    setUploadingSection(key);
    try {
      const result = await uploadCmsImage(file, "about");
      if (!result) throw new Error("Upload gagal.");
      updateSection(key, "imageUrl", result.url);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Upload gambar gagal.");
    } finally {
      setUploadingSection(null);
    }
  };

  // Save one section
  const handleSave = async (key: SectionKey, sortOrder: number) => {
    setSavingSection(key);
    try {
      const s = sections[key];
      const result = await aboutRepository.upsertSection(key, {
        title: s.title || undefined,
        content: s.content || undefined,
        image_url: s.imageUrl || undefined,
        sort_order: sortOrder,
        is_active: s.isActive,
      });
      if (!result.success) throw new Error(result.error);
      showToast("success", `Section "${SECTIONS.find((x) => x.key === key)?.label}" berhasil disimpan.`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menyimpan section.");
    } finally {
      setSavingSection(null);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Memuat data Tentang Kami...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body max-w-6xl">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
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
        <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Tentang Kami</h1>
        <p className="text-xs text-text-secondary sm:text-sm mt-1">
          Kelola konten halaman Tentang Kami. Tiap section disimpan secara terpisah.
        </p>
      </div>

      {/* Section Cards */}
      {SECTIONS.map((sec, idx) => {
        const key = sec.key;
        const s = sections[key];
        const isSaving = savingSection === key;
        const isUploading = uploadingSection === key;

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4"
          >
            {/* Section header */}
            <div className="flex items-center justify-between border-b border-primary/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{sec.icon}</span>
                <div>
                  <h2 className="font-heading text-base font-bold text-text-primary">{sec.label}</h2>
                  <p className="text-xs text-text-secondary">{sec.hint}</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => updateSection(key, "isActive", !s.isActive)}
                  className={`relative h-5 w-10 rounded-full transition-colors ${s.isActive ? "bg-emerald-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${s.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-xs font-semibold text-text-secondary">{s.isActive ? "Aktif" : "Nonaktif"}</span>
              </label>
            </div>

            {/* Judul */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Judul Section</label>
              <input
                type="text"
                value={s.title}
                onChange={(e) => updateSection(key, "title", e.target.value)}
                placeholder={`Judul untuk section ${sec.label}...`}
                className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            {/* Konten */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Konten / Deskripsi</label>
              <textarea
                rows={4}
                value={s.content}
                onChange={(e) => updateSection(key, "content", e.target.value)}
                placeholder="Tuliskan konten untuk section ini..."
                className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            {/* Gambar */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                Gambar (Opsional)
              </label>
              <input
                type="file" accept="image/*" className="hidden"
                ref={(el) => { fileRefs.current[key] = el; }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(key, f); }}
              />

              {s.imageUrl ? (
                <div className="relative h-32 rounded-xl overflow-hidden border border-primary/10 group">
                  <Image src={s.imageUrl} alt={s.title || sec.label} fill className="object-cover" sizes="800px" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onClick={() => fileRefs.current[key]?.click()}
                      className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold shadow">Ganti</button>
                    <button type="button" onClick={() => updateSection(key, "imageUrl", "")}
                      className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow flex items-center gap-1">
                      <X className="h-3 w-3" /> Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button" onClick={() => fileRefs.current[key]?.click()} disabled={isUploading}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-secondary/20 py-6 hover:border-primary/50 hover:bg-secondary/40 transition-colors cursor-pointer"
                >
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <ImageIcon className="h-5 w-5 text-primary/50" />}
                  <span className="text-xs text-text-secondary">{isUploading ? "Mengunggah..." : "Upload gambar section (opsional)"}</span>
                </button>
              )}
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-1">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleSave(key, idx)}
                disabled={isSaving || isUploading}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{isSaving ? "Menyimpan..." : "Simpan Section"}</span>
              </motion.button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
