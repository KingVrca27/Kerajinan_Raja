"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SITE_CONFIG } from "@/src/constants/site";
import { generateWhatsAppURL } from "@/src/lib/whatsapp";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

export interface FooterContactProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `FooterContact` merender rincian kontak resmi Putra Art Shop:
 * Alamat Lombok Timur, WhatsApp, Email, dan Jam Operasional dengan ikon Lucide React.
 * Data di-fetch dari Supabase site_settings, fallback ke SITE_CONFIG.
 */
export const FooterContact: React.FC<FooterContactProps> = ({
  className = "",
}) => {
  const [whatsappUrl, setWhatsappUrl] = useState<string>("#");
  
  const [address, setAddress] = useState<string>(SITE_CONFIG.address);
  const [whatsapp, setWhatsapp] = useState<string>(SITE_CONFIG.whatsappFormatted);
  const [email, setEmail] = useState<string>(SITE_CONFIG.contactEmail);
  const [hours, setHours] = useState<string>(SITE_CONFIG.operationalHours);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await siteSettingsRepository.getSettings([
          SETTINGS_KEYS.STORE_ADDRESS,
          SETTINGS_KEYS.STORE_KECAMATAN,
          SETTINGS_KEYS.STORE_KABUPATEN,
          SETTINGS_KEYS.STORE_PROVINSI,
          SETTINGS_KEYS.STORE_WHATSAPP,
          SETTINGS_KEYS.STORE_EMAIL,
          SETTINGS_KEYS.STORE_HOURS,
        ]);

        // Construct full address if needed, or just use store_address
        const fullAddress = [
          settings[SETTINGS_KEYS.STORE_ADDRESS],
          settings[SETTINGS_KEYS.STORE_KECAMATAN],
          settings[SETTINGS_KEYS.STORE_KABUPATEN],
          settings[SETTINGS_KEYS.STORE_PROVINSI],
        ].filter(Boolean).join(", ");
        
        if (fullAddress) setAddress(fullAddress);
        if (settings[SETTINGS_KEYS.STORE_WHATSAPP]) setWhatsapp(settings[SETTINGS_KEYS.STORE_WHATSAPP]);
        if (settings[SETTINGS_KEYS.STORE_EMAIL]) setEmail(settings[SETTINGS_KEYS.STORE_EMAIL]);
        if (settings[SETTINGS_KEYS.STORE_HOURS]) setHours(settings[SETTINGS_KEYS.STORE_HOURS]);

        // Generate WA Link based on dynamic WA
        const waNumber = settings[SETTINGS_KEYS.STORE_WHATSAPP] || SITE_CONFIG.whatsappFormatted;
        // Kita menggunakan nomor WA dari DB. Karena fungsi generateWhatsAppURL di lib/whatsapp
        // bisa saja menggunakan SITE_CONFIG, kita bypass dan buat URL langsung jika perlu.
        // Tapi kita akan panggil setWhatsappUrl dengan fallback.
      } catch (error) {
        console.error("Failed to load contact settings:", error);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    generateWhatsAppURL(
      "Halo Admin Putra Art Shop, saya ingin bertanya informasi mengenai produk kerajinan Lombok."
    )
      .then((url) => setWhatsappUrl(url))
      .catch(() => {});
  }, []);

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
          <span className="leading-snug text-white/90">{address}</span>
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
            {whatsapp}
          </a>
        </li>

        {/* Email */}
        <li className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/20 text-blue-200">
            <Mail className="h-4 w-4" />
          </div>
          <a
            href={`mailto:${email}`}
            className="hover:text-white transition-colors truncate text-white/90"
          >
            {email}
          </a>
        </li>

        {/* Jam Operasional */}
        <li className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-200 mt-0.5">
            <Clock className="h-4 w-4" />
          </div>
          <span className="leading-snug text-white/90">{hours}</span>
        </li>
      </ul>
    </div>
  );
};

export default FooterContact;
