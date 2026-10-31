"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabaseBrowser";

/**
 * OrderBadge
 *
 * Menampilkan badge jumlah pesanan aktif di Navbar.
 * Hanya ditampilkan untuk customer yang sudah login.
 * Data diambil dari /api/orders/count (auth-based, bukan guest phone tracking).
 */
export const OrderBadge: React.FC = () => {
  const [orderCount, setOrderCount] = useState<number>(0);
  const supabase = createClient();

  const fetchOrderCount = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setOrderCount(0);
        return;
      }

      const res = await fetch("/api/orders/count");
      if (!res.ok) {
        setOrderCount(0);
        return;
      }

      const result = await res.json();
      setOrderCount(typeof result.count === "number" ? result.count : 0);
    } catch (error) {
      console.error("Failed to fetch order count:", error);
      setOrderCount(0);
    }
  };

  useEffect(() => {
    fetchOrderCount();

    // Perbarui badge setelah checkout berhasil
    const handleOrderUpdated = () => {
      fetchOrderCount();
    };

    window.addEventListener("kr_order_updated", handleOrderUpdated);
    return () => {
      window.removeEventListener("kr_order_updated", handleOrderUpdated);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (orderCount === 0) return null;

  return (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-gray-900 leading-none shadow-sm min-w-[20px] h-[20px]">
      {orderCount}
    </span>
  );
};

export default OrderBadge;
