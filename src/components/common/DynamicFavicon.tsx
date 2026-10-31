/**
 * @file src/components/common/DynamicFavicon.tsx
 *
 * Komponen Client yang memuat favicon secara dinamis dari Supabase site_settings.
 * Dipanggil di root layout agar berlaku di semua halaman.
 *
 * FIX: usePathname digunakan sebagai dependency useEffect agar favicon
 * selalu di-reapply setiap kali Next.js melakukan client-side navigation.
 * Tanpa ini, Next.js head management akan menimpa favicon dinamis saat
 * berpindah halaman, sehingga favicon menghilang sampai browser di-reload.
 */

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

export default function DynamicFavicon() {
  const pathname = usePathname();

  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const faviconUrl = await siteSettingsRepository.getSetting(
          SETTINGS_KEYS.FAVICON
        );
        if (!faviconUrl || faviconUrl.trim() === "") return;

        // Update href dari <link rel="icon"> & <link rel="shortcut icon"> yang ada
        // daripada menghapusnya, untuk menghindari error Next.js "removeChild on null"
        const existingLinks = document.querySelectorAll<HTMLLinkElement>(
          'link[rel="icon"], link[rel="shortcut icon"]'
        );
        
        if (existingLinks.length > 0) {
          existingLinks.forEach((link) => {
            link.href = faviconUrl;
          });
        } else {
          // Buat elemen link baru jika tidak ada
          const link = document.createElement("link");
          link.rel = "icon";
          link.type = "image/x-icon";
          link.href = faviconUrl;
          document.head.appendChild(link);
        }
      } catch {
        // Biarkan favicon default jika Supabase gagal atau belum dikonfigurasi
      }
    };

    loadFavicon();
  // pathname sebagai dependency: re-apply favicon setiap kali route berubah
  }, [pathname]);

  return null;
}
