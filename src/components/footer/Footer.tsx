"use client";

import React from "react";
import { motion } from "framer-motion";
import FooterBrand from "./FooterBrand";
import FooterContact from "./FooterContact";
import FooterLinks from "./FooterLinks";
import FooterSocial from "./FooterSocial";
import FooterMap from "./FooterMap";
import FooterBottom from "./FooterBottom";

export interface FooterProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `Footer` utama website Kerajinan Raja.
 * Merender 4 kolom utama pada Desktop (Brand + Sosmed, Navigasi Cepat, Kontak Resmi, Lokasi Maps)
 * dan 1 baris copyright paling bawah (`FooterBottom`).
 */
export const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  return (
    <footer
      id="kontak"
      className={`border-t border-black/10 bg-[#9D734E] text-white ${className}`}
    >
      {/* Container Utama 4 Kolom Grid */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 items-start">
          {/* Kolom 1: Brand & Media Sosial */}
          <div className="space-y-6">
            <FooterBrand />
            <FooterSocial />
          </div>

          {/* Kolom 2: Navigasi Cepat */}
          <div>
            <FooterLinks />
          </div>

          {/* Kolom 3: Informasi Kontak */}
          <div>
            <FooterContact />
          </div>

          {/* Kolom 4: Lokasi Google Maps */}
          <div>
            <FooterMap />
          </div>
        </div>
      </motion.div>

      {/* Baris Copyright & Subteks */}
      <FooterBottom />
    </footer>
  );
};

export default Footer;
