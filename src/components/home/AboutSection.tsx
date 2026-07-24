"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  MapPin,
  HeartHandshake,
  Package,
  Users,
  Smile,
  Truck,
  Sparkles,
} from "lucide-react";
import { ABOUT_CONTENT } from "@/src/constants/about";

export interface AboutSectionProps {
  /** Kelas CSS tambahan jika diperlukan */
  className?: string;
}

/** Array ikon Lucide yang dipetakan ke 4 data statistik */
const STAT_ICONS = [Package, Users, Smile, Truck];

/**
 * Komponen `AboutSection` merender tampilan seksi "Tentang Kami" yang menceritakan
 * identitas brand Kerajinan Raja sebagai penyedia kerajinan tangan khas Lombok, Nusa Tenggara Barat (NTB).
 *
 * Mengambil seluruh data teks secara terpusat dari `constants/about.ts`.
 */
export const AboutSection: React.FC<AboutSectionProps> = ({
  className = "",
}) => {
  return (
    <section
      id="tentang-kami"
      className={`py-16 sm:py-20 lg:py-24 bg-background overflow-hidden ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Container Utama Layout 2 Kolom (Gambar & Narasi Storytelling) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Kolom Kiri: Visual Gambar Produk / Pengrajin Lombok (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative lg:col-span-5"
          >
            {/* Element Dekoratif Gradient Shadow */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/20 via-accent/10 to-amber-500/20 blur-xl opacity-70" />

            {/* Frame Gambar Utama */}
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-3xl border border-primary/10 bg-secondary/50 shadow-xl">
              <Image
                src={ABOUT_CONTENT.image.src}
                alt={ABOUT_CONTENT.image.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover object-center transition-transform duration-700 hover:scale-105"
              />

              {/* Floating Badge di atas gambar */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 rounded-2xl bg-white/90 backdrop-blur-md p-4 shadow-lg border border-white/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block font-heading text-xs font-bold uppercase tracking-wider text-primary">
                      Karya Otentik
                    </span>
                    <span className="font-body text-xs font-semibold text-text-primary">
                      Pengrajin Lokal Lombok, NTB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Kolom Kanan: Narasi Storytelling & Detail (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="flex flex-col space-y-6 lg:col-span-7"
          >
            {/* 1. Badge Kecil di atas Judul */}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 font-body text-xs font-bold text-primary border border-primary/20 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{ABOUT_CONTENT.badge}</span>
              </span>
            </div>

            {/* 2. Judul Utama */}
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl leading-tight">
              {ABOUT_CONTENT.title}
            </h2>

            {/* 3. Deskripsi Paragraf Storytelling */}
            <div className="space-y-4 font-body text-base sm:text-lg text-text-secondary leading-relaxed">
              {ABOUT_CONTENT.description.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* 4. Subjudul & Sub-deskripsi */}
            <div className="rounded-2xl border-l-4 border-primary bg-secondary/30 p-4 sm:p-5 space-y-2">
              <h3 className="font-heading text-lg font-bold text-text-primary sm:text-xl">
                {ABOUT_CONTENT.subtitle}
              </h3>
              <p className="font-body text-sm text-text-secondary leading-relaxed">
                {ABOUT_CONTENT.subtitleDescription}
              </p>
            </div>

            {/* 5. Callout Dukungan Pengrajin Lokal */}
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 font-body text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
              <HeartHandshake className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="font-medium leading-normal">
                {ABOUT_CONTENT.callout}
              </p>
            </div>
          </motion.div>

        </div>

        {/* 6. Grid Data Statistik (4 Kotak Metric) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-4"
        >
          {ABOUT_CONTENT.stats.map((stat, index) => {
            const IconComponent = STAT_ICONS[index % STAT_ICONS.length];
            return (
              <div
                key={index}
                className="group relative flex flex-col items-center justify-center rounded-2xl border border-primary/10 bg-white p-5 sm:p-6 text-center shadow-xs transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <IconComponent className="h-6 w-6" />
                </div>
                <span className="font-heading text-2xl font-extrabold text-primary sm:text-3xl lg:text-4xl">
                  {stat.value}
                </span>
                <span className="mt-1 font-body text-xs font-semibold text-text-secondary sm:text-sm">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
