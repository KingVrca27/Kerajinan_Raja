/**
 * @file src/lib/reviewRepository.ts
 * Repository pattern untuk manajemen Ulasan & Rating (Reviews) di Supabase.
 * CATATAN PENTING: Admin TIDAK BOLEH mengubah nilai rating.
 */

import { supabase } from "@/src/lib/supabase";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import type { ReviewWithDetails } from "@/src/types/ops";

export interface OperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// Helper untuk menganonimkan nama reviewer (contoh: Jamal Wrrdf -> Jamal W...)
function anonymizeName(name: string): string {
  if (!name || name === "Pelanggan Anonim") return "Pelanggan Anonim";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0) + "...";
  }
  return parts[0] + " " + parts[1].charAt(0) + "...";
}

export const reviewRepository = {
  /** Ambil semua ulasan dengan nama produk & pelanggan */
  async getAll(): Promise<ReviewWithDetails[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, products(name), customers(full_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[reviewRepository.getAll]", error.message);
      return [];
    }

    return (data || []).map((r) => ({
      ...r,
      product_name: r.products?.name || "Produk Dihapus",
      customer_name: anonymizeName(r.customers?.full_name || "Pelanggan Anonim"),
    }));
  },

  /** Balas ulasan pelanggan (admin_reply) */
  async replyReview(id: string, replyText: string): Promise<OperationResult> {
    const { error } = await supabase
      .from("reviews")
      .update({ admin_reply: replyText.trim(), updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Balas Review",
      entity_type: "review",
      entity_id: id,
      description: `Membalas ulasan pelanggan dengan ID ${id}`,
      metadata: { review_id: id },
    });

    return { success: true };
  },

  /** Sembunyikan / Tampilkan ulasan (is_approved) */
  async toggleApproval(id: string, isApproved: boolean): Promise<OperationResult> {
    const { error } = await supabase
      .from("reviews")
      .update({ is_approved: isApproved, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: isApproved ? "Approve Review" : "Hide Review",
      entity_type: "review",
      entity_id: id,
      description: isApproved ? `Menyetujui (menampilkan) ulasan ID ${id}` : `Menyembunyikan ulasan ID ${id}`,
      metadata: { review_id: id, is_approved: isApproved },
    });

    return { success: true };
  },

  /** Delete review (soft delete via disembunyikan / hapus row) */
  async deleteReview(id: string): Promise<OperationResult> {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Hapus Review",
      entity_type: "review",
      entity_id: id,
      description: `Menghapus ulasan ID ${id}`,
      metadata: { review_id: id },
    });

    return { success: true };
  },

  /** Statistik ulasan: Total review & Rating Rata-rata */
  async getStats(): Promise<{ total: number; averageRating: number }> {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating");

    if (error || !data || data.length === 0) {
      return { total: 0, averageRating: 0 };
    }

    const total = data.length;
    const sum = data.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    const avg = Number((sum / total).toFixed(1));

    return { total, averageRating: avg };
  },

  /** Membuat ulasan baru oleh pelanggan */
  async createReview(data: {
    product_id: string;
    customer_id: string;
    order_item_id: string;
    rating: number;
    title: string;
    content: string;
    image_url?: string | null;
  }): Promise<OperationResult> {
    try {
      const { error } = await supabase.from("reviews").insert([{
        product_id: data.product_id,
        customer_id: data.customer_id,
        order_item_id: data.order_item_id,
        rating: data.rating,
        title: data.title,
        content: data.content,
        image_url: data.image_url,
        // is_approved diatur default false oleh database
      }]);

      if (error) {
        // Deteksi error unique constraint
        if (error.code === '23505') {
          return { success: false, error: "Ulasan untuk produk ini sudah pernah diberikan." };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /** Mengambil ulasan yang sudah disetujui (untuk halaman produk) */
  async getApprovedReviewsByProduct(productId: string): Promise<ReviewWithDetails[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, customers(full_name)")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[reviewRepository.getApprovedReviewsByProduct]", error.message);
      return [];
    }

    return (data || []).map((r) => ({
      ...r,
      customer_name: anonymizeName(r.customers?.full_name || "Pelanggan Anonim"),
    }));
  },

  /** Menghitung jumlah review yang belum ditangani (belum di-approve & belum dibalas) */
  async getUnhandledCount(): Promise<number> {
    const { count, error } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false)
      .is("admin_reply", null);

    if (error) {
      console.error("[reviewRepository.getUnhandledCount]", error.message);
      return 0;
    }

    return count || 0;
  },

  /** Menghitung jumlah review baru yang masuk hari ini */
  async countTodayReviews(): Promise<number> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const { count, error } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString())
      .lt("created_at", startOfTomorrow.toISOString());

    if (error) {
      console.error("[reviewRepository.countTodayReviews]", error.message);
      return 0;
    }

    return count ?? 0;
  },
};
