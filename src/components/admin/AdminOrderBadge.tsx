/**
 * @file src/components/admin/AdminOrderBadge.tsx
 *
 * Badge jumlah pesanan aktif untuk menu "Pesanan" di Admin Sidebar.
 * Fetch langsung dari Supabase menggunakan getActiveCount().
 * Hanya menghitung: pending, confirmed, processing, shipped.
 * Di-refresh tiap 60 detik secara otomatis.
 */

"use client";

import React, { useEffect, useState } from "react";
import { orderRepository } from "@/src/lib/orderRepository";

const REFRESH_INTERVAL_MS = 60_000; // 60 detik

export const AdminOrderBadge: React.FC = () => {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const c = await orderRepository.getActiveCount();
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

export default AdminOrderBadge;
