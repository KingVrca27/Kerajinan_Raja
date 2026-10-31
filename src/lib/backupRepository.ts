/**
 * @file src/lib/backupRepository.ts
 * Repository pattern untuk Backup Center — FASE 4.5.2B
 *
 * Ekspor data dari berbagai tabel ke format CSV.
 * Riwayat backup disimpan di site_settings (key: system_backup_history).
 */

import { supabase } from "@/src/lib/supabase";
import { activityLogRepository } from "@/src/lib/activityLogRepository";

export interface BackupExportResult {
  success: boolean;
  csvContent?: string;
  filename?: string;
  rowCount?: number;
  error?: string;
}

/** Helper: ubah array of objects menjadi string CSV */
function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) return "Tidak ada data";

  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) =>
    headers
      .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

export const backupRepository = {
  /** Export semua produk ke CSV */
  async exportProducts(): Promise<BackupExportResult> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, description, price, stock, minimum_stock, status, sku, weight_gram, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) return { success: false, error: error.message };
      const csv = toCSV((data || []) as Record<string, unknown>[]);
      const rowCount = data?.length || 0;

      // Activity log setelah berhasil
      await activityLogRepository.logActivity({
        action: "Export Tabel products",
        entity_type: "maintenance",
        description: `Mengekspor data produk ke CSV (${rowCount} baris)`,
        metadata: { table: "products", row_count: rowCount, format: "csv" },
      });

      return {
        success: true,
        csvContent: csv,
        filename: `export_produk_${Date.now()}.csv`,
        rowCount,
      };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  /** Export semua pelanggan ke CSV */
  async exportCustomers(): Promise<BackupExportResult> {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, email, phone, address, city, province, postal_code, is_active, created_at")
        .order("created_at", { ascending: false });

      if (error) return { success: false, error: error.message };
      const csv = toCSV((data || []) as Record<string, unknown>[]);
      const rowCount = data?.length || 0;

      await activityLogRepository.logActivity({
        action: "Export Tabel customers",
        entity_type: "maintenance",
        description: `Mengekspor data pelanggan ke CSV (${rowCount} baris)`,
        metadata: { table: "customers", row_count: rowCount, format: "csv" },
      });

      return {
        success: true,
        csvContent: csv,
        filename: `export_pelanggan_${Date.now()}.csv`,
        rowCount,
      };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  /** Export semua pesanan ke CSV */
  async exportOrders(): Promise<BackupExportResult> {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, shipping_name, shipping_phone, subtotal, discount_amount, shipping_cost, total, status, payment_status, payment_method, shipping_city, shipping_province, created_at")
        .order("created_at", { ascending: false });

      if (error) return { success: false, error: error.message };
      const csv = toCSV((data || []) as Record<string, unknown>[]);
      const rowCount = data?.length || 0;

      await activityLogRepository.logActivity({
        action: "Export Tabel orders",
        entity_type: "maintenance",
        description: `Mengekspor data pesanan ke CSV (${rowCount} baris)`,
        metadata: { table: "orders", row_count: rowCount, format: "csv" },
      });

      return {
        success: true,
        csvContent: csv,
        filename: `export_pesanan_${Date.now()}.csv`,
        rowCount,
      };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  /** Export semua review ke CSV */
  async exportReviews(): Promise<BackupExportResult> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, product_id, customer_id, rating, title, content, is_approved, admin_reply, created_at")
        .order("created_at", { ascending: false });

      if (error) return { success: false, error: error.message };
      const csv = toCSV((data || []) as Record<string, unknown>[]);
      const rowCount = data?.length || 0;

      await activityLogRepository.logActivity({
        action: "Export Tabel reviews",
        entity_type: "maintenance",
        description: `Mengekspor data review ke CSV (${rowCount} baris)`,
        metadata: { table: "reviews", row_count: rowCount, format: "csv" },
      });

      return {
        success: true,
        csvContent: csv,
        filename: `export_review_${Date.now()}.csv`,
        rowCount,
      };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  /** Export FAQ ke CSV */
  async exportFAQ(): Promise<BackupExportResult> {
    try {
      const { data, error } = await supabase
        .from("faq")
        .select("id, question, answer, category, sort_order, is_active, created_at")
        .order("sort_order", { ascending: true });

      if (error) return { success: false, error: error.message };
      const csv = toCSV((data || []) as Record<string, unknown>[]);
      const rowCount = data?.length || 0;

      await activityLogRepository.logActivity({
        action: "Export Tabel faq",
        entity_type: "maintenance",
        description: `Mengekspor data FAQ ke CSV (${rowCount} baris)`,
        metadata: { table: "faq", row_count: rowCount, format: "csv" },
      });

      return {
        success: true,
        csvContent: csv,
        filename: `export_faq_${Date.now()}.csv`,
        rowCount,
      };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  /** Export data database info ke JSON (metadata snapshot) */
  async exportDatabaseSnapshot(): Promise<BackupExportResult> {
    try {
      const [products, customers, orders, reviews] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);

      const snapshot = {
        timestamp: new Date().toISOString(),
        counts: {
          products: products.count || 0,
          customers: customers.count || 0,
          orders: orders.count || 0,
          reviews: reviews.count || 0,
        },
      };

      const json = JSON.stringify(snapshot, null, 2);

      await activityLogRepository.logActivity({
        action: "Database Snapshot",
        entity_type: "maintenance",
        description: `Mengekspor database snapshot ke JSON (${products.count || 0} produk, ${orders.count || 0} pesanan)`,
        metadata: { format: "json", counts: snapshot.counts },
      });

      return {
        success: true,
        csvContent: json,
        filename: `db_snapshot_${Date.now()}.json`,
        rowCount: 1,
      };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  /** Trigger file download di browser */
  triggerDownload(content: string, filename: string, mimeType = "text/csv") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
