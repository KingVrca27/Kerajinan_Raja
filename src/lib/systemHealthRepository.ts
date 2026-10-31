/**
 * @file src/lib/systemHealthRepository.ts
 * Repository pattern untuk Dashboard Health & Informasi Sistem (`/admin/dashboard/system`).
 */

import { supabase } from "@/src/lib/supabase";
import type { SystemHealthStatus } from "@/src/types/adminMonitoring";

export const systemHealthRepository = {
  async getHealthStatus(): Promise<SystemHealthStatus> {
    let dbStatus: "connected" | "degraded" | "disconnected" = "connected";
    let storageStatus: "connected" | "degraded" | "disconnected" = "connected";
    let authStatus: "connected" | "degraded" | "disconnected" = "connected";

    // 1. Check DB & Entity counts
    let productsCount = 0;
    let customersCount = 0;
    let ordersCount = 0;
    let reviewsCount = 0;

    try {
      const [pRes, cRes, oRes, rRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);

      if (pRes.error) dbStatus = "degraded";
      productsCount = pRes.count || 0;
      customersCount = cRes.count || 0;
      ordersCount = oRes.count || 0;
      reviewsCount = rRes.count || 0;
    } catch {
      dbStatus = "disconnected";
    }

    // 2. Check Storage
    let mediaCount = 0;
    let storageSizeBytes = 0;
    try {
      const { data: mediaFiles, error: storageErr } = await supabase.storage.from("Gambar_Banner").list("media");
      const { data: prodFiles } = await supabase.storage.from("product_images").list("products");

      if (storageErr) storageStatus = "degraded";

      const allFiles = [...(mediaFiles || []), ...(prodFiles || [])];
      mediaCount = allFiles.length;
      storageSizeBytes = allFiles.reduce((acc, curr) => acc + (curr.metadata?.size || 150000), 0);
    } catch {
      storageStatus = "disconnected";
    }

    // 3. Check Auth session
    try {
      const { error: authErr } = await supabase.auth.getSession();
      if (authErr) authStatus = "degraded";
    } catch {
      authStatus = "disconnected";
    }

    return {
      databaseStatus: dbStatus,
      storageStatus,
      authStatus,
      productsCount,
      customersCount,
      ordersCount,
      reviewsCount,
      mediaCount,
      storageSizeBytes,
      migrationVersion: "20260729155000_cms_hero_schedule.sql",
      projectVersion: "0.1.0 (Next.js 15.5.21)",
      environment: process.env.NODE_ENV || "development",
    };
  },
};
