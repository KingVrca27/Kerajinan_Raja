"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SITE_CONFIG } from "@/src/constants/site";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

export interface FooterBrandProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `FooterBrand` merender identitas brand Putra Art Shop pada footer:
 * Logo dari `/public/images/logo.png`, Nama Brand, Tagline, dan Deskripsi.
 */
export const FooterBrand: React.FC<FooterBrandProps> = ({ className = "" }) => {
  const [imgError, setImgError] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(SITE_CONFIG.logoSrc);

  React.useEffect(() => {
    const fetchLogo = async () => {
      try {
        const url = await siteSettingsRepository.getSetting(SETTINGS_KEYS.LOGO_FOOTER);
        if (url) setLogoUrl(url);
      } catch (e) {
        console.error("Gagal memuat logo footer:", e);
      }
    };
    fetchLogo();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Container Logo & Nama Brand */}
      <Link href="/" className="group inline-flex items-center gap-3 focus:outline-none">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border border-primary/20 bg-white p-1 shadow-xs transition-transform duration-300 group-hover:scale-105">
          {!imgError ? (
            <Image
              src={logoUrl}
              alt={SITE_CONFIG.name}
              fill
              sizes="48px"
              className="object-contain p-1"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-primary font-heading font-extrabold text-white text-lg">
              PA
            </div>
          )}
        </div>
        <div>
          <h3 className="font-heading text-xl font-bold tracking-tight text-white transition-colors group-hover:text-amber-200">
            {SITE_CONFIG.name}
          </h3>
          <span className="inline-flex items-center gap-1 font-body text-xs font-semibold text-amber-200">
            <Sparkles className="h-3 w-3" />
            <span>{SITE_CONFIG.tagline}</span>
          </span>
        </div>
      </Link>

      {/* Deskripsi Brand */}
      <p className="font-body text-sm text-amber-100/90 leading-relaxed max-w-sm">
        {SITE_CONFIG.description}
      </p>
    </div>
  );
};

export default FooterBrand;
