"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SITE_CONFIG } from "@/src/constants/site";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

export interface FooterSocialProps {
  /** Kelas CSS tambahan */
  className?: string;
}

interface SocialItem {
  name: string;
  href: string;
  hoverClass: string;
  icon: React.ReactNode;
  isActive: boolean;
}

/**
 * Komponen `FooterSocial` merender tombol ikon tautan media sosial resmi
 * (Instagram, Facebook, TikTok, YouTube) dari database (Supabase), fallback ke `constants/site.ts`.
 */
export const FooterSocial: React.FC<FooterSocialProps> = ({
  className = "",
}) => {
  const defaultItems: SocialItem[] = [
    {
      name: "Instagram",
      href: SITE_CONFIG.socials.instagram,
      hoverClass:
        "hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white hover:border-transparent",
      isActive: true,
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: SITE_CONFIG.socials.facebook,
      hoverClass: "hover:bg-blue-600 hover:text-white hover:border-transparent",
      isActive: true,
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "TikTok",
      href: SITE_CONFIG.socials.tiktok,
      hoverClass: "hover:bg-black hover:text-white hover:border-transparent",
      isActive: true,
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.67 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.36 1.47-1.41 2.47-.11 1.25.47 2.48 1.46 3.17.99.69 2.33.8 3.44.3 1.11-.48 1.92-1.57 2.01-2.77.1-2.23.06-4.47.06-6.7 0-3.37-.01-6.74.02-10.11z" />
        </svg>
      ),
    },
    {
      name: "YouTube",
      href: SITE_CONFIG.socials.youtube,
      hoverClass: "hover:bg-red-600 hover:text-white hover:border-transparent",
      isActive: true,
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];

  const [socials, setSocials] = useState<SocialItem[]>(defaultItems);

  useEffect(() => {
    async function loadSocials() {
      try {
        const settings = await siteSettingsRepository.getSettings([
          SETTINGS_KEYS.SOCIAL_INSTAGRAM, "social_instagram_active",
          SETTINGS_KEYS.SOCIAL_FACEBOOK, "social_facebook_active",
          SETTINGS_KEYS.SOCIAL_TIKTOK, "social_tiktok_active",
          SETTINGS_KEYS.SOCIAL_YOUTUBE, "social_youtube_active",
        ]);

        setSocials((prev) => 
          prev.map((item) => {
            let key = "";
            let activeKey = "";
            
            if (item.name === "Instagram") { key = SETTINGS_KEYS.SOCIAL_INSTAGRAM; activeKey = "social_instagram_active"; }
            else if (item.name === "Facebook") { key = SETTINGS_KEYS.SOCIAL_FACEBOOK; activeKey = "social_facebook_active"; }
            else if (item.name === "TikTok") { key = SETTINGS_KEYS.SOCIAL_TIKTOK; activeKey = "social_tiktok_active"; }
            else if (item.name === "YouTube") { key = SETTINGS_KEYS.SOCIAL_YOUTUBE; activeKey = "social_youtube_active"; }

            if (key && activeKey) {
              return {
                ...item,
                href: settings[key] || item.href,
                isActive: settings[activeKey] !== "false",
              };
            }
            return item;
          })
        );
      } catch (error) {
        console.error("Failed to load social settings:", error);
      }
    }
    loadSocials();
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      <h5 className="font-body text-xs font-semibold uppercase tracking-wider text-amber-200">
        Ikuti Kami
      </h5>
      <div className="flex items-center gap-2.5">
        {socials.filter(s => s.isActive && s.href).map((social) => (
          <motion.a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`Ikuti ${SITE_CONFIG.name} di ${social.name}`}
            whileHover={{ scale: 1.15, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-2xs transition-all duration-300 ${social.hoverClass}`}
          >
            {social.icon}
          </motion.a>
        ))}
      </div>
    </div>
  );
};

export default FooterSocial;
