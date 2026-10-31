/**
 * @file src/components/admin/AdminNotificationBadge.tsx
 *
 * Badge jumlah notifikasi belum dibaca untuk menu "Notifikasi" di Admin Sidebar.
 * Fetch langsung dari Supabase menggunakan getUnreadCount().
 * Di-refresh tiap 60 detik secara otomatis.
 * Mengikuti pola yang sama dengan AdminOrderBadge.tsx.
 */

"use client";

import React, { useEffect, useState } from "react";
import { notificationRepository } from "@/src/lib/notificationRepository";

const REFRESH_INTERVAL_MS = 60_000; // 60 detik

export const AdminNotificationBadge: React.FC = () => {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const c = await notificationRepository.getUnreadCount();
        if (!cancelled) setCount(c);
      } catch {
        // Silently ignore — network errors & AbortErrors on unmount
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white min-w-[18px] h-[18px]">
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default AdminNotificationBadge;
