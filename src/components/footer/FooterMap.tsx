"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, ExternalLink } from "lucide-react";
import { SITE_CONFIG } from "@/src/constants/site";

export interface FooterMapProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `FooterMap` merender tombol ke lokasi toko di Google Maps
 * menggunakan URL dari `constants/site.ts`.
 */
export const FooterMap: React.FC<FooterMapProps> = ({ className = "" }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="font-heading text-base font-bold text-white">
        Lokasi Toko
      </h4>

      <p className="font-body text-sm text-amber-100/90 leading-relaxed">
        Kunjungi lokasi workshop dan toko galeri kerajinan kami di Lombok Timur, NTB.
      </p>

      {/* Tombol Lihat Lokasi di Google Maps */}
      <motion.a
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        href={SITE_CONFIG.googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 font-body text-xs font-semibold text-white shadow-xs transition-all hover:bg-white hover:text-[#9D734E] hover:shadow-md focus:outline-none cursor-pointer"
      >
        <MapPin className="h-4 w-4" />
        <span>Lihat Lokasi di Google Maps</span>
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </motion.a>
    </div>
  );
};

export default FooterMap;
