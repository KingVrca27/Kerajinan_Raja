"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE_CONFIG } from "@/src/constants/site";

export interface FooterLinksProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `FooterLinks` merender daftar navigasi menu cepat
 * (Beranda, Semua Produk, Tentang Kami, FAQ, Hubungi Kami) menggunakan Next.js Link.
 */
export const FooterLinks: React.FC<FooterLinksProps> = ({ className = "" }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="font-heading text-base font-bold text-white">
        Navigasi Cepat
      </h4>

      <ul className="space-y-2.5 font-body text-sm">
        {SITE_CONFIG.quickLinks.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="group flex items-center gap-1.5 text-amber-100/90 transition-colors hover:text-white"
            >
              <ChevronRight className="h-3.5 w-3.5 text-amber-200/70 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterLinks;
