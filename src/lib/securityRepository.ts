/**
 * @file src/lib/securityRepository.ts
 * Repository pattern untuk Security & Session Management — FASE 4.5.2B
 *
 * Sumber data:
 *   - activity_logs (login/logout events)
 *   - Supabase Auth sessions
 */

import { supabase } from "@/src/lib/supabase";
import { activityLogRepository } from "@/src/lib/activityLogRepository";

export interface LoginRecord {
  id: string;
  user_name: string;
  email?: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  success: boolean;
}

export interface ActiveSession {
  userId: string;
  email: string;
  lastActivity: string;
  userAgent: string | null;
}

export const securityRepository = {
  /** Ambil 50 login terakhir dari activity_logs */
  async getLoginHistory(): Promise<LoginRecord[]> {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id, user_id, description, ip_address, user_agent, created_at, users(full_name, email)")
      .in("action", ["Login Admin", "Logout Admin", "Login Gagal"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[securityRepository.getLoginHistory]", error.message);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => ({
      id: row.id as string,
      user_name: (row.users?.full_name || row.users?.[0]?.full_name || "Admin") as string,
      email: (row.users?.email || row.users?.[0]?.email || "") as string,
      ip_address: row.ip_address as string | null,
      user_agent: row.user_agent as string | null,
      created_at: row.created_at as string,
      success: typeof row.action === "string" && !row.action.toLowerCase().includes("gagal"),
    }));

  },

  /** Ambil session aktif saat ini (session user yang sedang login) */
  async getCurrentSession(): Promise<ActiveSession | null> {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) return null;

      return {
        userId: data.session.user.id,
        email: data.session.user.email || "—",
        lastActivity: data.session.access_token
          ? new Date(data.session.expires_at
              ? data.session.expires_at * 1000
              : Date.now()
            ).toISOString()
          : new Date().toISOString(),
        userAgent:
          typeof window !== "undefined" ? window.navigator.userAgent : null,
      };
    } catch {
      return null;
    }
  },

  /** Logout dari semua device (revoke semua session Supabase) */
  async logoutAllDevices(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) return { success: false, error: error.message };

      await activityLogRepository.logActivity({
        action: "Logout Admin",
        entity_type: "auth",
        description: "Admin melakukan logout dari semua perangkat (Global Sign Out).",
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  /** Logout session saat ini saja */
  async logoutCurrentSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) return { success: false, error: error.message };

      await activityLogRepository.logActivity({
        action: "Logout Admin",
        entity_type: "auth",
        description: "Admin melakukan logout dari perangkat saat ini (Local Sign Out).",
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  /**
   * Force logout user tertentu (nonaktifkan akun).
   * Karena Supabase tidak expose admin revokeToken via anon key,
   * kita set is_active = false sehingga guard akan memblokir akses.
   */
  async forceLogoutUser(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: false, error: "Gagal mendapatkan sesi. Pastikan Anda sudah login." };
      }

      const response = await fetch("/api/admin/users/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ target_user_id: userId, is_active: false })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data.error || "Terjadi kesalahan saat mematikan status akun." };
      }

      await activityLogRepository.logActivity({
        action: "Force Logout",
        entity_type: "auth",
        description: `Admin menonaktifkan akun user ID: ${userId}`,
        metadata: { target_user_id: userId }
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
