/**
 * @file src/components/admin/AdminReviewBadge.tsx
 *
 * Badge jumlah ulasan yang belum ditangani untuk menu "Review & Rating" di Admin Sidebar.
 * Fetch langsung dari Supabase menggunakan getUnhandledCount().
 * Hanya menghitung: review yang belum di-approve dan belum dibalas admin.
 * Di-refresh tiap 60 detik secara otomatis.
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { reviewRepository } from "@/src/lib/reviewRepository";

const REFRESH_INTERVAL_MS = 60_000; // 60 detik

export const AdminReviewBadge: React.FC = () => {
  const [count, setCount] = useState<number>(0);

  const fetchCount = useCallback(async () => {
    const c = await reviewRepository.getUnhandledCount();
    setCount(c);
  }, []);

  useEffect(() => {
    fetchCount();

    const interval = setInterval(fetchCount, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchCount]);

  if (count === 0) return null;

  return (
    <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white min-w-[18px] h-[18px]">
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default AdminReviewBadge;
