"use client";

import React, { useEffect, useState, useCallback } from "react";

const REFRESH_INTERVAL_MS = 60_000; // 60 detik

export const AdminChatBadge: React.FC = () => {
  const [count, setCount] = useState<number>(0);

  const fetchCount = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/admin/chat/unread", { signal });
      if (res.ok) {
        const data = await res.json();
        setCount(data.count || 0);
      }
    } catch (e: any) {
      if (e.name === "AbortError") return;
      if (e instanceof TypeError && e.message === "Failed to fetch") {
        // Silently ignore network interruptions or ad-blocker blocks during polling
        return;
      }
      console.error("Gagal memuat unread chat count:", e);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchCount(controller.signal);

    const interval = setInterval(() => {
      fetchCount(controller.signal);
    }, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [fetchCount]);

  if (count === 0) return null;

  return (
    <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white min-w-[18px] h-[18px]">
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default AdminChatBadge;
