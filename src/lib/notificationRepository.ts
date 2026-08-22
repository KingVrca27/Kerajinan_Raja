/**
 * @file src/lib/notificationRepository.ts
 * Repository pattern untuk Notification Center di Supabase (`notifications`).
 */

import { supabase } from "@/src/lib/supabase";
import type { DbNotification, NotificationType } from "@/src/types/adminMonitoring";

export interface OperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export const notificationRepository = {
  /** Ambil semua notifikasi (terbaru lebih dulu) */
  async getAll(): Promise<DbNotification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[notificationRepository.getAll]", error.message);
      return [];
    }
    return data || [];
  },

  /** Ambil jumlah notifikasi belum dibaca */
  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    if (error) {
      console.error("[notificationRepository.getUnreadCount]", error.message);
      return 0;
    }
    return count || 0;
  },

  /** Tandai satu notifikasi sudah dibaca */
  async markAsRead(id: string): Promise<OperationResult> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /** Tandai semua notifikasi sudah dibaca */
  async markAllAsRead(): Promise<OperationResult> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("is_read", false);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /** Buat notifikasi baru (untuk event sistem/aktivitas) */
  async createNotification(payload: {
    type: NotificationType;
    title: string;
    message: string;
    link_url?: string;
    metadata?: Record<string, unknown>;
  }): Promise<OperationResult> {
    const { error } = await supabase.from("notifications").insert({
      type: payload.type,
      title: payload.title.trim(),
      message: payload.message.trim(),
      link_url: payload.link_url || null,
      metadata: payload.metadata || null,
      is_read: false,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /** Hapus satu notifikasi */
  async deleteNotification(id: string): Promise<OperationResult> {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /** Ambil notifikasi berdasarkan kategori/type */
  async getByCategory(category: string): Promise<DbNotification[]> {
    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (category !== "all") {
      query = query.eq("type", category);
    }
    const { data, error } = await query;
    if (error) {
      console.error("[notificationRepository.getByCategory]", error.message);
      return [];
    }
    return data || [];
  },
};
