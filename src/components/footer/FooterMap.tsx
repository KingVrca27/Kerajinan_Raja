"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, ExternalLink } from "lucide-react";
import { SITE_CONFIG } from "@/src/constants/site";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

export interface FooterMapProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `FooterMap` merender tombol ke lokasi toko di Google Maps
 * menggunakan URL dari `constants/site.ts` atau database (Supabase).
 */
export const FooterMap: React.FC<FooterMapProps> = ({ className = "" }) => {
  const [mapUrl, setMapUrl] = useState<string>(SITE_CONFIG.googleMapsUrl);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await siteSettingsRepository.getSettings([
          SETTINGS_KEYS.STORE_GMAPS,
        ]);
        
        const gmapsEmbed = settings[SETTINGS_KEYS.STORE_GMAPS];
        if (gmapsEmbed) {
          // Cari URL src dari iframe
          const srcMatch = gmapsEmbed.match(/src="([^"]+)"/);
          let embedUrl = "";
          
          if (srcMatch && srcMatch[1]) {
            embedUrl = srcMatch[1];
          } else if (gmapsEmbed.startsWith("http")) {
            embedUrl = gmapsEmbed;
          }

          if (embedUrl) {
            // Cek apakah ini URL embed (/maps/embed)
            if (embedUrl.includes("/maps/embed")) {
              // Ekstrak data dari parameter pb
              // Contoh: !2d116.385682!3d-8.675277!2sathar%20art%20shop
              const latMatch = embedUrl.match(/!3d(-?\d+\.\d+)/);
              const lngMatch = embedUrl.match(/!2d(-?\d+\.\d+)/);
              const nameMatch = embedUrl.match(/!2s([^!&]+)/);

              if (nameMatch && nameMatch[1]) {
                // Jika ada nama tempat
                setMapUrl(`https://www.google.com/maps/search/?api=1&query=${nameMatch[1]}`);
              } else if (latMatch && lngMatch) {
                // Jika hanya ada koordinat
                setMapUrl(`https://www.google.com/maps/search/?api=1&query=${latMatch[1]},${lngMatch[1]}`);
              } else {
                // Fallback jika tidak bisa diekstrak
                setMapUrl("https://maps.google.com/");
              }
            } else {
              // Jika bukan URL embed, langsung gunakan
              setMapUrl(embedUrl);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load map settings:", error);
      }
    }
    loadSettings();
  }, []);

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
        href={mapUrl}
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
