/**
 * @file src/lib/orderRepository.ts
 * Repository pattern untuk operasi Pesanan (Orders) di Supabase.
 */

import { supabase } from "@/src/lib/supabase";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import type { DbOrder, DbOrderItem, OrderWithDetails, OrderStatus } from "@/src/types/ops";

export interface OperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export const orderRepository = {
  /** Ambil semua pesanan dengan relasi customer & items */
  async getAll(): Promise<OrderWithDetails[]> {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*, customers(full_name, email, phone)")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("[orderRepository.getAll]", ordersError.message);
      return [];
    }

    if (!orders || orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    if (itemsError) {
      console.error("[orderRepository.getAll items]", itemsError.message);
    }

    const itemsByOrder = new Map<string, DbOrderItem[]>();
    (items || []).forEach((item: DbOrderItem) => {
      const list = itemsByOrder.get(item.order_id) || [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    });

    return orders.map((ord: DbOrder & { customers: { full_name: string; email: string; phone: string } | null }) => ({
      ...ord,
      customer_name: ord.customers?.full_name || "Pelanggan Umum",
      customer_email: ord.customers?.email || "—",
      customer_phone: ord.customers?.phone || "—",
      items: itemsByOrder.get(ord.id) || [],
    }));
  },

  /** Update status pesanan */
  async updateStatus(id: string, status: OrderStatus, trackingNumber?: string): Promise<OperationResult> {
    // Ambil order saat ini untuk log aktivitas
    const { data: existingOrder } = await supabase.from("orders").select("status, order_number").eq("id", id).maybeSingle();

    const payload: Partial<DbOrder> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (trackingNumber !== undefined) {
      payload.tracking_number = trackingNumber;
    }
    if (status === "delivered") {
      payload.payment_status = "paid";
    }

    const { error } = await supabase.from("orders").update(payload).eq("id", id);
    if (error) return { success: false, error: error.message };

    // Log Aktivitas
    const orderNum = existingOrder?.order_number || id;
    const oldStatus = existingOrder?.status || "unknown";
    if (existingOrder && oldStatus !== status) {
      await activityLogRepository.logActivity({
        action: "Update Status Pesanan",
        entity_type: "order",
        entity_id: id,
        description: `Mengubah status pesanan ${orderNum} dari ${oldStatus} menjadi ${status}`,
        metadata: { old_status: oldStatus, new_status: status, tracking_number: trackingNumber },
      });
    }

    return { success: true };
  },

  /** Ambil detail satu pesanan */
  async getById(id: string): Promise<OrderWithDetails | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*, customers(full_name, email, phone), order_items(*)")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      customer_name: data.customers?.full_name || "Pelanggan Umum",
      customer_email: data.customers?.email || "—",
      customer_phone: data.customers?.phone || "—",
      items: data.order_items || [],
    };
  },

  /** Hapus pesanan (Cascading ke order_items) */
  async deleteOrder(id: string): Promise<OperationResult> {
    // Ambil order number untuk log
    const { data: existingOrder } = await supabase.from("orders").select("order_number").eq("id", id).maybeSingle();

    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    // Log Aktivitas
    const orderNum = existingOrder?.order_number || id;
    await activityLogRepository.logActivity({
      action: "Hapus Pesanan",
      entity_type: "order",
      entity_id: id,
      description: `Menghapus pesanan ${orderNum}`,
      metadata: { deleted_order: orderNum },
    });

    return { success: true };
  },

  /**
   * Hitung pesanan yang masih aktif/perlu ditangani admin:
   * pending, confirmed, processing, shipped.
   * Tidak termasuk: delivered, cancelled, refunded.
   */
  async getActiveCount(): Promise<number> {
    const ACTIVE_STATUSES = ["pending", "confirmed", "processing", "shipped"];
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ACTIVE_STATUSES);

    if (error) {
      console.error("[orderRepository.getActiveCount]", error.message);
      return 0;
    }
    return count ?? 0;
  },

  /** 
   * Mengambil n pesanan terbaru (untuk dashboard).
   * Menghindari memuat seluruh pesanan ke memori.
   */
  async getRecentOrders(limitCount: number = 5): Promise<OrderWithDetails[]> {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*, customers(full_name, email, phone)")
      .order("created_at", { ascending: false })
      .limit(limitCount);

    if (ordersError) {
      console.error("[orderRepository.getRecentOrders]", ordersError.message);
      return [];
    }

    if (!orders || orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    if (itemsError) {
      console.error("[orderRepository.getRecentOrders items]", itemsError.message);
    }

    const itemsByOrder = new Map<string, DbOrderItem[]>();
    (items || []).forEach((item: DbOrderItem) => {
      const list = itemsByOrder.get(item.order_id) || [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    });

    return orders.map((ord: DbOrder & { customers: { full_name: string; email: string; phone: string } | null }) => ({
      ...ord,
      customer_name: ord.customers?.full_name || "Pelanggan Umum",
      customer_email: ord.customers?.email || "—",
      customer_phone: ord.customers?.phone || "—",
      items: itemsByOrder.get(ord.id) || [],
    }));
  },

  /**
   * Mengambil data spesifik yang diperlukan untuk menghitung statistik penjualan 
   * dan jumlah pesanan di Dashboard, tanpa memuat seluruh relasi dan kolom.
   */
  async getDashboardSalesData(): Promise<{ created_at: string; total: number; status: string; items: { quantity: number }[] }[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("created_at, total, status, items:order_items(quantity)");

    if (error) {
      console.error("[orderRepository.getDashboardSalesData]", error.message);
      return [];
    }
    
    // Konversi tipe pengembalian supabase (any) ke tipe yang diharapkan
    return (data || []) as any[];
  },
};
