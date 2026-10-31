/**
 * @file app/admin/dashboard/info/page.tsx
 *
 * Halaman Informasi Toko — Migrasi dari adminStorage (localStorage) ke Supabase.
 * Menggunakan siteSettingsRepository & SETTINGS_KEYS dari cmsRepository.ts.
 *
 * Field:
 *   Nama Toko, Slogan, WhatsApp, Email, Alamat, Kecamatan,
 *   Kabupaten, Provinsi, Kode Pos, Google Maps Embed, Jam Operasional
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, CheckCircle2, Store, Phone, Mail, Clock,
  MapPin, AlertTriangle, Loader2, Map,
} from "lucide-react";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

// ---------------------------------------------------------------------------
// DEFAULT STATE
// ---------------------------------------------------------------------------

const DEFAULT_FORM = {
  store_name:       "",
  store_slogan:     "",
  store_description:"",
  store_whatsapp:   "",
  store_email:      "",
  store_hours:      "",
  store_address:    "",
  store_kecamatan:  "",
  store_kabupaten:  "",
  store_provinsi:   "",
  store_kode_pos:   "",
  store_gmaps_embed:"",
};

const INFO_KEYS = Object.values({
  STORE_NAME:        SETTINGS_KEYS.STORE_NAME,
  STORE_SLOGAN:      SETTINGS_KEYS.STORE_SLOGAN,
  STORE_DESCRIPTION: SETTINGS_KEYS.STORE_DESCRIPTION,
  STORE_WHATSAPP:    SETTINGS_KEYS.STORE_WHATSAPP,
  STORE_EMAIL:       SETTINGS_KEYS.STORE_EMAIL,
  STORE_HOURS:       SETTINGS_KEYS.STORE_HOURS,
  STORE_ADDRESS:     SETTINGS_KEYS.STORE_ADDRESS,
  STORE_KECAMATAN:   SETTINGS_KEYS.STORE_KECAMATAN,
  STORE_KABUPATEN:   SETTINGS_KEYS.STORE_KABUPATEN,
  STORE_PROVINSI:    SETTINGS_KEYS.STORE_PROVINSI,
  STORE_KODE_POS:    SETTINGS_KEYS.STORE_KODE_POS,
  STORE_GMAPS:       SETTINGS_KEYS.STORE_GMAPS,
});

// ---------------------------------------------------------------------------
// PAGE COMPONENT
// ---------------------------------------------------------------------------

export default function AdminInfoPage() {
  const [formData, setFormData] = useState(DEFAULT_FORM);
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
      const settings = await siteSettingsRepository.getSettings(INFO_KEYS);
      setFormData({
        store_name:        settings[SETTINGS_KEYS.STORE_NAME]        ?? "",
        store_slogan:      settings[SETTINGS_KEYS.STORE_SLOGAN]      ?? "",
        store_description: settings[SETTINGS_KEYS.STORE_DESCRIPTION] ?? "",
        store_whatsapp:    settings[SETTINGS_KEYS.STORE_WHATSAPP]    ?? "",
        store_email:       settings[SETTINGS_KEYS.STORE_EMAIL]       ?? "",
        store_hours:       settings[SETTINGS_KEYS.STORE_HOURS]       ?? "",
        store_address:     settings[SETTINGS_KEYS.STORE_ADDRESS]     ?? "",
        store_kecamatan:   settings[SETTINGS_KEYS.STORE_KECAMATAN]   ?? "",
        store_kabupaten:   settings[SETTINGS_KEYS.STORE_KABUPATEN]   ?? "",
        store_provinsi:    settings[SETTINGS_KEYS.STORE_PROVINSI]    ?? "",
        store_kode_pos:    settings[SETTINGS_KEYS.STORE_KODE_POS]    ?? "",
        store_gmaps_embed: settings[SETTINGS_KEYS.STORE_GMAPS]       ?? "",
      });
    } catch {
      showToast("error", "Gagal memuat data informasi toko.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.store_name.trim()) {
      showToast("error", "Nama toko wajib diisi.");
      return;
    }
    setIsSaving(true);
    try {
      const result = await siteSettingsRepository.setSettings(
        {
          [SETTINGS_KEYS.STORE_NAME]:        formData.store_name,
          [SETTINGS_KEYS.STORE_SLOGAN]:      formData.store_slogan,
          [SETTINGS_KEYS.STORE_DESCRIPTION]: formData.store_description,
          [SETTINGS_KEYS.STORE_WHATSAPP]:    formData.store_whatsapp,
          [SETTINGS_KEYS.STORE_EMAIL]:       formData.store_email,
          [SETTINGS_KEYS.STORE_HOURS]:       formData.store_hours,
          [SETTINGS_KEYS.STORE_ADDRESS]:     formData.store_address,
          [SETTINGS_KEYS.STORE_KECAMATAN]:   formData.store_kecamatan,
          [SETTINGS_KEYS.STORE_KABUPATEN]:   formData.store_kabupaten,
          [SETTINGS_KEYS.STORE_PROVINSI]:    formData.store_provinsi,
          [SETTINGS_KEYS.STORE_KODE_POS]:    formData.store_kode_pos,
          [SETTINGS_KEYS.STORE_GMAPS]:       formData.store_gmaps_embed,
        },
        {
          [SETTINGS_KEYS.STORE_NAME]:        { label: "Nama Toko",        type: "text" },
          [SETTINGS_KEYS.STORE_SLOGAN]:      { label: "Slogan",           type: "text" },
          [SETTINGS_KEYS.STORE_DESCRIPTION]: { label: "Deskripsi Toko",   type: "text" },
          [SETTINGS_KEYS.STORE_WHATSAPP]:    { label: "WhatsApp",         type: "text" },
          [SETTINGS_KEYS.STORE_EMAIL]:       { label: "Email",            type: "text" },
          [SETTINGS_KEYS.STORE_HOURS]:       { label: "Jam Operasional",  type: "text" },
          [SETTINGS_KEYS.STORE_ADDRESS]:     { label: "Alamat",           type: "text" },
          [SETTINGS_KEYS.STORE_KECAMATAN]:   { label: "Kecamatan",        type: "text" },
          [SETTINGS_KEYS.STORE_KABUPATEN]:   { label: "Kabupaten",        type: "text" },
          [SETTINGS_KEYS.STORE_PROVINSI]:    { label: "Provinsi",         type: "text" },
          [SETTINGS_KEYS.STORE_KODE_POS]:    { label: "Kode Pos",         type: "text" },
          [SETTINGS_KEYS.STORE_GMAPS]:       { label: "Google Maps Embed",type: "text" },
        }
      );
      if (!result.success) throw new Error(result.error);
      showToast("success", "Informasi toko berhasil disimpan ke Supabase!");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menyimpan informasi toko.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Input helper ─────────────────────────────────────────────────────────
  const field = (
    key: keyof typeof DEFAULT_FORM,
    label: string,
    placeholder = "",
    type = "text",
    required = false
  ) => (
    <div>
      <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={formData[key]}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Memuat informasi toko dari Supabase...</span>
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
            {toast.type === "success"
              ? <CheckCircle2 className="h-4 w-4" />
              : <AlertTriangle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Informasi Toko
          </h1>
          <p className="text-xs text-text-secondary sm:text-sm mt-1">
            Kelola profil toko, kontak, lokasi, dan jam operasional. Data tersimpan di Supabase.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. Identitas Brand */}
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-text-primary">Identitas Brand &amp; Toko</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("store_name",    "Nama Brand / Toko", "Putra Art Shop", "text", true)}
            {field("store_slogan",  "Slogan / Tagline",  "Kerajinan Asli Lombok...")}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Deskripsi Toko</label>
            <textarea
              rows={3}
              value={formData.store_description}
              onChange={(e) => setFormData({ ...formData, store_description: e.target.value })}
              placeholder="Deskripsi singkat toko untuk keperluan SEO dan website..."
              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* 2. Kontak & Jam Operasional */}
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
            <Phone className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-text-primary">Kontak &amp; Operasional</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {field("store_whatsapp", "Nomor WhatsApp", "081935161001", "text", true)}
            {field("store_email",    "Email Kontak",   "hello@putraartshop.com", "email")}
            {field("store_hours",    "Jam Operasional","Senin–Sabtu, 08.00–17.00 WITA")}
          </div>
        </div>

        {/* 3. Alamat Lengkap */}
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-text-primary">Alamat Toko</h2>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Alamat Jalan</label>
            <input
              type="text"
              value={formData.store_address}
              onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
              placeholder="Jl. Contoh No. 123"
              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {field("store_kecamatan", "Kecamatan", "Mataram")}
            {field("store_kabupaten", "Kabupaten/Kota", "Kota Mataram")}
            {field("store_provinsi",  "Provinsi",  "Nusa Tenggara Barat")}
            {field("store_kode_pos",  "Kode Pos",  "83116")}
          </div>
        </div>

        {/* 4. Google Maps */}
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
            <Map className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-text-primary">Google Maps Embed</h2>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
              Kode Embed Google Maps
            </label>
            <textarea
              rows={3}
              value={formData.store_gmaps_embed}
              onChange={(e) => setFormData({ ...formData, store_gmaps_embed: e.target.value })}
              placeholder={`<iframe src="https://www.google.com/maps/embed?..." ...></iframe>`}
              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 text-sm font-mono focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-xs text-text-secondary">
              Dapatkan dari Google Maps → Share → Embed a map → salin kode iframe
            </p>
          </div>
          {formData.store_gmaps_embed && (
            <div className="overflow-hidden rounded-xl border border-primary/10 h-48">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: formData.store_gmaps_embed }}
              />
            </div>
          )}
        </div>

        {/* Tombol Simpan */}
        <div className="flex justify-end pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-body text-sm font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? "Menyimpan..." : "Simpan Informasi Toko"}</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
