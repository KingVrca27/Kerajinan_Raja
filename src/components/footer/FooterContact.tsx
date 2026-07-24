"use client";

import React from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SITE_CONFIG } from "@/src/constants/site";
import { generateWhatsAppURL } from "@/src/lib/whatsapp";

export interface FooterContactProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `FooterContact` merender rincian kontak resmi Kerajinan Raja:
 * Alamat Lombok Timur, WhatsApp, Email, dan Jam Operasional dengan ikon Lucide React.
 */
export const FooterContact: React.FC<FooterContactProps> = ({
  className = "",
}) => {
  const whatsappUrl = generateWhatsAppURL(
    "Halo Admin Kerajinan Raja, saya ingin bertanya informasi mengenai produk kerajinan Lombok.",
    SITE_CONFIG.whatsappClean
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="font-heading text-base font-bold text-white">
        Informasi Kontak
      </h4>

      <ul className="space-y-3 font-body text-sm text-amber-100/90">
        {/* Alamat */}
        <li className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-200 mt-0.5">
            <MapPin className="h-4 w-4" />
          </div>
          <span className="leading-snug text-white/90">{SITE_CONFIG.address}</span>
        </li>

        {/* WhatsApp */}
        <li className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-200">
            <Phone className="h-4 w-4" />
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white font-medium transition-colors cursor-pointer text-white/90"
          >
            {SITE_CONFIG.whatsappFormatted}
          </a>
        </li>

        {/* Email */}
        <li className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/20 text-blue-200">
            <Mail className="h-4 w-4" />
          </div>
          <a
            href={`mailto:${SITE_CONFIG.contactEmail}`}
            className="hover:text-white transition-colors truncate text-white/90"
          >
            {SITE_CONFIG.contactEmail}
          </a>
        </li>

        {/* Jam Operasional */}
        <li className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-200 mt-0.5">
            <Clock className="h-4 w-4" />
          </div>
          <span className="leading-snug text-white/90">{SITE_CONFIG.operationalHours}</span>
        </li>
      </ul>
    </div>
  );
};

export default FooterContact;
