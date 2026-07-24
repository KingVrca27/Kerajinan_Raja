"use client";

import React from "react";
import { SITE_CONFIG } from "@/src/constants/site";

export interface FooterBottomProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `FooterBottom` merender bagian hak cipta paling bawah:
 * Copyright © 2026 Kerajinan Raja dan subteks dukungan pengrajin lokal Lombok.
 */
export const FooterBottom: React.FC<FooterBottomProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`border-t border-white/10 bg-[#896342] py-6 px-4 sm:px-6 lg:px-8 text-center ${className}`}
    >
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 font-body text-xs text-amber-100/80">
        {/* Copyright */}
        <p>{SITE_CONFIG.copyright}</p>

        {/* Subteks Dukungan Pengrajin Lokal */}
        <p className="font-medium text-amber-100">
          {SITE_CONFIG.createdWithLove}
        </p>
      </div>
    </div>
  );
};

export default FooterBottom;
