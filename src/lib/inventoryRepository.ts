/**
 * @file src/lib/inventoryRepository.ts
 * Repository pattern untuk Manajemen Inventori & Log Stok (inventory_logs) di Supabase.
 */

import { supabase } from "@/src/lib/supabase";
import type { InventoryLogWithDetails, InventoryLogType } from "@/src/types/ops";

export interface OperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export const inventoryRepository = {
  /** Ambil semua riwayat log inventori beserta nama & SKU produk */
  async getAllLogs(): Promise<InventoryLogWithDetails[]> {
    const { data, error } = await supabase
      .from("inventory_logs")
      .select("*, products(name, sku)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[inventoryRepository.getAllLogs]", error.message);
      return [];
    }

    return (data || []).map((log) => ({
      ...log,
      product_name: log.products?.name || "Produk Dihapus",
      product_sku: log.products?.sku || "—",
    }));
  },

  /** Catat log penyesuaian stok baru dan update stok produk di tabel products */
  async addLog(payload: {
    product_id: string;
    type: InventoryLogType;
    quantity: number; // Positif untuk masuk, negatif untuk keluar
    notes?: string;
  }): Promise<OperationResult> {
    
    // Tentukan nilai change berdasarkan tipe
    let change = payload.quantity;
    if (payload.type === "in" || payload.type === "return") {
      change = Math.abs(payload.quantity);
    } else if (payload.type === "out" || payload.type === "damaged") {
      change = -Math.abs(payload.quantity);
    } else if (payload.type === "adjustment") {
      // Ambil nilainya apa adanya (bisa positif atau negatif dari UI)
      change = payload.quantity;
    }

    if (change === 0) {
      return { success: false, error: "Jumlah perubahan stok tidak boleh 0." };
    }

    const { error } = await supabase.rpc("adjust_product_stock", {
      p_product_id: payload.product_id,
      p_type: payload.type,
      p_quantity: change,
      p_notes: payload.notes || null,
    });

    if (error) {
      console.error("[inventoryRepository.addLog]", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /** Ringkasan Statistik Stok */
  async getInventoryStats(): Promise<{
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    const { data, error } = await supabase.from("products").select("stock, minimum_stock");

    if (error || !data) {
      return { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0 };
    }

    const totalProducts = data.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    data.forEach((p) => {
      const minStock = p.minimum_stock ?? 5;
      if (p.stock === 0) {
        outOfStockCount++;
      } else if (p.stock <= minStock) {
        lowStockCount++;
      }
    });

    return { totalProducts, lowStockCount, outOfStockCount };
  },
};
