"use client";

import { useEffect } from "react";

export default function OrderViewTracker({ orderId, status }: { orderId: string, status: string }) {
  useEffect(() => {
    if (status === "delivered") {
      try {
        const viewedStr = localStorage.getItem("viewed_delivered_orders");
        const viewed: string[] = viewedStr ? JSON.parse(viewedStr) : [];
        if (!viewed.includes(orderId)) {
          viewed.push(orderId);
          localStorage.setItem("viewed_delivered_orders", JSON.stringify(viewed));
        }
      } catch (e) {
        console.error("Failed to track order view", e);
      }
    }
  }, [orderId, status]);

  return null;
}
