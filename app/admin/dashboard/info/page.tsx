"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save,
  CheckCircle2,
  Store,
  Phone,
  Mail,
  Clock,
  MapPin,
  Globe,
  Share2,
} from "lucide-react";
import adminStorage, { SiteInfoData } from "@/src/lib/adminStorage";

export default function AdminInfoPage() {
  const [formData, setFormData] = useState<SiteInfoData>({
    name: "",
    tagline: "",
    description: "",
    address: "",
    whatsappNumber: "",
    whatsappFormatted: "",
    whatsappClean: "",
    contactEmail: "",
    operationalHours: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    googleMapsUrl: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadInfo() {
      setIsLoading(true);
      try {
        const info = await adminStorage.getSiteInfo();
        setFormData(info);
      } catch (e) {
        console.error("Gagal memuat informasi website:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto calculate whatsapp clean & formatted if needed
    const cleanWa = formData.whatsappNumber.replace(/[^0-9]/g, "");

    const updatedInfo: SiteInfoData = {
      ...formData,
      whatsappClean: cleanWa.startsWith("0") ? `62${cleanWa.slice(1)}` : cleanWa,
      whatsappFormatted: formData.whatsappNumber,
    };

    await adminStorage.saveSiteInfo(updatedInfo);
    setFormData(updatedInfo);

    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center font-body text-sm text-text-secondary">
        Memuat informasi website...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body max-w-4xl">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Informasi Website
          </h1>
          <p className="text-xs text-text-secondary sm:text-sm">
            Kelola profil toko, identitas brand, kontak WhatsApp, dan tautan sosial media.
          </p>
        </div>

        {isSavedSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-600 border border-emerald-500/20"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Informasi Berhasil Disimpan!</span>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Profil Utama Toko */}
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-text-primary">
              Identitas Brand & Toko
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                Nama Brand / Toko
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                Tagline Slogan
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
              Deskripsi Toko
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* 2. Kontak & Jam Operasional */}
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
            <Phone className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-text-primary">
              Kontak & Operasional
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                Nomor WhatsApp Admin
              </label>
              <input
                type="text"
                required
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="081935161001"
                className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                Email Kontak
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                Jam Operasional
              </label>
              <input
                type="text"
                value={formData.operationalHours}
                onChange={(e) => setFormData({ ...formData, operationalHours: e.target.value })}
                placeholder="Senin - Sabtu 08.00 - 17.00 WITA"
                className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
              Alamat Lengkap Toko / Workshop
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
              Tautan Google Maps
            </label>
            <input
              type="text"
              value={formData.googleMapsUrl}
              onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
              className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* 3. Sosial Media */}
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
            <Share2 className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-text-primary">
              Tautan Sosial Media
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                Instagram URL
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                Facebook URL
              </label>
              <input
                type="text"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                TikTok URL
              </label>
              <input
                type="text"
                value={formData.tiktok}
                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">
                YouTube URL
              </label>
              <input
                type="text"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                className="w-full rounded-xl border border-primary/20 py-2.5 px-3 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="flex justify-end pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-body text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary/90 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Informasi Website</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
