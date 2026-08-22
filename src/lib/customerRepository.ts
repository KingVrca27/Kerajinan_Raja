/**
 * @file src/lib/customerRepository.ts
 * Repository pattern untuk manajemen Pelanggan (Customers) di Supabase.
 */

import { supabase } from "@/src/lib/supabase";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import type { CustomerWithStats, DbOrder } from "@/src/types/ops";

export interface OperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export const customerRepository = {
  /** Ambil semua pelanggan berserta total belanja & total pesanan */
  async getAll(): Promise<CustomerWithStats[]> {
    const { data: customers, error: custError } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (custError) {
      console.error("[customerRepository.getAll]", custError.message);
      return [];
    }
    if (!customers || customers.length === 0) return [];

    const { data: orders, error: orderError } = await supabase
      .from("orders")
      .select("id, customer_id, total, created_at, status");

    if (orderError) {
      console.error("[customerRepository.getAll orders]", orderError.message);
    }

    const orderStats = new Map<string, { count: number; spent: number; lastDate: string | null }>();

    (orders || []).forEach((o: Pick<DbOrder, "id" | "customer_id" | "total" | "created_at" | "status">) => {
      if (o.status === "cancelled") return;
      const stat = orderStats.get(o.customer_id) || { count: 0, spent: 0, lastDate: null };
      stat.count += 1;
      stat.spent += Number(o.total || 0);
      if (!stat.lastDate || new Date(o.created_at) > new Date(stat.lastDate)) {
        stat.lastDate = o.created_at;
      }
      orderStats.set(o.customer_id, stat);
    });

    return customers.map((c) => {
      const st = orderStats.get(c.id) || { count: 0, spent: 0, lastDate: null };
      return {
        ...c,
        total_orders: st.count,
        total_spent: st.spent,
        last_order_at: st.lastDate,
      };
    });
  },

  /** Ambil riwayat pesanan pelanggan tertentu */
  async getCustomerOrders(customerId: string): Promise<DbOrder[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[customerRepository.getCustomerOrders]", error.message);
      return [];
    }
    return data || [];
  },

  /** Toggle status aktif pelanggan (blokir / aktifkan) */
  async toggleActive(id: string, isActive: boolean): Promise<OperationResult> {
    // Ambil nama pelanggan untuk log
    const { data: existingCustomer } = await supabase.from("customers").select("full_name").eq("id", id).maybeSingle();

    const { error } = await supabase
      .from("customers")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    const custName = existingCustomer?.full_name || id;
    await activityLogRepository.logActivity({
      action: isActive ? "Aktifkan Customer" : "Nonaktifkan Customer",
      entity_type: "customer",
      entity_id: id,
      description: isActive ? `Mengaktifkan akun pelanggan ${custName}` : `Menonaktifkan akun pelanggan ${custName}`,
      metadata: { customer_id: id, is_active: isActive },
    });

    return { success: true };
  },

  /** 
   * Menghitung total pelanggan tanpa memuat seluruh data baris.
   * Digunakan untuk optimasi Dashboard.
   */
  async getTotalCount(): Promise<number> {
    const { count, error } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("[customerRepository.getTotalCount]", error.message);
      return 0;
    }
    return count ?? 0;
  },
};
