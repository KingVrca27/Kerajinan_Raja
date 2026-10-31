/**
 * @file src/lib/activityLogRepository.ts
 * Repository pattern untuk Activity Log admin (`activity_logs`) di Supabase.
 */

import { supabase } from "@/src/lib/supabase";
import type { DbActivityLog, ActivityModule } from "@/src/types/adminMonitoring";

export interface OperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export const activityLogRepository = {
  /** Ambil semua log aktivitas admin (terbaru lebih dulu) */
  async getAll(): Promise<DbActivityLog[]> {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*, users(full_name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[activityLogRepository.getAll]", error.message);
      return [];
    }

    return (data || []).map((row: DbActivityLog & { users?: { full_name: string; email: string } }) => ({
      ...row,
      user_name: row.users?.full_name || row.users?.email || "Admin Sistem",
    }));
  },

  /** Ambil N aktivitas terakhir untuk widget dashboard */
  async getRecent(limit = 10): Promise<DbActivityLog[]> {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*, users(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[activityLogRepository.getRecent]", error.message);
      return [];
    }

    return (data || []).map((row: DbActivityLog & { users?: { full_name: string; email: string } }) => ({
      ...row,
      user_name: row.users?.full_name || row.users?.email || "Admin Sistem",
    }));
  },

  /**
   * Catat log aktivitas admin baru.
   *
   * PENTING:
   * - Jika INSERT berhasil: return { success: true }
   * - Jika INSERT gagal: return { success: false, error: "..." }
   * - Error tidak ditelan — caller harus tahu apakah log berhasil atau tidak.
   * - Kegagalan logging TIDAK harus menghentikan operasi utama aplikasi,
   *   tapi caller berhak mengetahuinya.
   */
  async logActivity(payload: {
    action: string;
    entity_type: ActivityModule | string;
    entity_id?: string;
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<OperationResult> {
    try {
      const payloadObj = {
        action: payload.action,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id || null,
        description: payload.description,
        metadata: payload.metadata || null,
        user_agent: typeof window !== "undefined" ? window.navigator.userAgent : "Server",
        ip_address: null
      };

      // Jika di panggil di client (browser), gunakan API route untuk menghindari
      // masalah Adblocker (yang memblokir log_admin_activity RPC) dan isu sinkronisasi session Supabase JS.
      if (typeof window !== "undefined") {
        const res = await fetch("/api/admin/record-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadObj),
        });
        const data = await res.json().catch(() => ({}));
        
        if (!res.ok || !data.success) {
          console.error("[activityLogRepository.logActivity] API gagal:", data.error || "Network error");
          return { success: false, error: data.error || "Network error" };
        }
        return { success: true };
      }

      // Fallback untuk eksekusi server-side
      const { error } = await supabase.rpc("log_admin_activity", {
        payload: payloadObj
      });

      if (error) {
        console.error("[activityLogRepository.logActivity] RPC gagal:", error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[activityLogRepository.logActivity] Exception:", msg);
      return { success: false, error: msg };
    }
  },
};
