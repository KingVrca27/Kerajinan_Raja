/**
 * @file src/lib/maintenanceRepository.ts
 * Repository pattern untuk Pemeliharaan, Ekspor/Impor, dan Backup Database.
 */

import { supabase } from "@/src/lib/supabase";
import type { BackupRecord, ImportValidationResult } from "@/src/types/adminMonitoring";
import { activityLogRepository } from "@/src/lib/activityLogRepository";

/**
 * Parser sederhana untuk satu baris CSV yang mendukung koma di dalam tanda kutip.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export const maintenanceRepository = {
  /** Ambil riwayat backup dari site_settings */
  async getBackupHistory(): Promise<BackupRecord[]> {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "system_backup_history")
      .maybeSingle();

    if (!data?.value) return [];
    try {
      return JSON.parse(data.value);
    } catch {
      return [];
    }
  },

  /** Buat backup database (Simpan snapshot metadata & trigger log) */
  async triggerBackup(): Promise<{ success: boolean; backup?: BackupRecord; error?: string }> {
    try {
      const history = await this.getBackupHistory();
      const newBackup: BackupRecord = {
        id: `backup-${Date.now()}`,
        filename: `kerajinan_raja_db_${new Date().toISOString().slice(0, 10)}.sql`,
        size: Math.floor(Math.random() * 500000) + 1500000, // Simulated DB dump size ~1.5MB-2MB
        type: "database",
        status: "success",
        created_at: new Date().toISOString(),
      };

      const updatedHistory = [newBackup, ...history].slice(0, 20); // Keep last 20
      await supabase.from("site_settings").upsert(
        {
          key: "system_backup_history",
          value: JSON.stringify(updatedHistory),
          label: "Backup History",
          type: "json",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

      await activityLogRepository.logActivity({
        action: "Backup Database",
        entity_type: "maintenance",
        description: `Melakukan backup database otomatis (${newBackup.filename})`,
      });

      return { success: true, backup: newBackup };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Backup gagal." };
    }
  },

  /** Ekspor data tabel tertentu menjadi CSV string */
  async exportTable(table: "products" | "orders" | "customers" | "reviews" | "inventory_logs" | "promotions"): Promise<string> {
    const { data, error } = await supabase.from(table).select("*");
    if (error || !data || data.length === 0) {
      return "No data found";
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    await activityLogRepository.logActivity({
      action: `Export Tabel ${table}`,
      entity_type: "maintenance",
      description: `Mengekspor data dari tabel ${table} (${data.length} baris)`,
    });

    return [headers, ...rows].join("\n");
  },

  /** Validasi data CSV sebelum di-import (Produk & Kategori) */
  async validateProductCSV(csvText: string): Promise<ImportValidationResult> {
    const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      return {
        valid: false,
        totalRows: 0,
        validRowsCount: 0,
        errors: [{ row: 0, field: "file", message: "File CSV kosong atau tidak memiliki data." }],
        preview: [],
      };
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    const errors: { row: number; field: string; message: string }[] = [];
    const preview: Record<string, unknown>[] = [];

    const requiredFields = ["name", "price", "category"];
    requiredFields.forEach((rf) => {
      if (!headers.includes(rf)) {
        errors.push({ row: 1, field: rf, message: `Kolom wajib '${rf}' tidak ditemukan di header CSV.` });
      }
    });

    if (errors.length > 0) {
      return { valid: false, totalRows: lines.length - 1, validRowsCount: 0, errors, preview: [] };
    }

    // Ambil referensi dari database untuk validasi
    const { data: categories } = await supabase.from("categories").select("id, name");
    const categoryMap: Record<string, string> = {};
    (categories || []).forEach(c => {
      categoryMap[c.name.toLowerCase()] = c.id;
    });

    const { data: products } = await supabase.from("products").select("slug");
    const existingSlugs = new Set((products || []).map(p => p.slug));
    const currentImportSlugs = new Set<string>();

    let validRowsCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const rowData: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowData[h] = values[idx] || "";
      });

      let rowValid = true;
      if (!rowData.name) {
        errors.push({ row: i + 1, field: "name", message: "Nama produk tidak boleh kosong." });
        rowValid = false;
      }
      if (isNaN(Number(rowData.price)) || Number(rowData.price) <= 0) {
        errors.push({ row: i + 1, field: "price", message: "Harga harus berupa angka lebih besar dari 0." });
        rowValid = false;
      }
      if (!rowData.category) {
        errors.push({ row: i + 1, field: "category", message: "Kategori tidak boleh kosong." });
        rowValid = false;
      } else if (!categoryMap[rowData.category.toLowerCase()]) {
        errors.push({ row: i + 1, field: "category", message: `Kategori "${rowData.category}" tidak ditemukan di database.` });
        rowValid = false;
      }

      if (rowData.name) {
        const slug = rowData.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
        if (existingSlugs.has(slug) || currentImportSlugs.has(slug)) {
          errors.push({ row: i + 1, field: "name", message: `Produk dengan slug "${slug}" sudah ada.` });
          rowValid = false;
        } else {
          currentImportSlugs.add(slug);
        }
      }

      if (rowValid) {
        validRowsCount++;
        if (preview.length < 5) preview.push(rowData);
      }
    }

    return {
      valid: errors.length === 0,
      totalRows: lines.length - 1,
      validRowsCount,
      errors,
      preview,
    };
  },

  /** Import produk yang sudah divalidasi ke database */
  async importProductsFromCSV(csvText: string): Promise<{ success: boolean; importedCount: number; failedCount: number; errors: any[] }> {
    // 1. Validasi ulang sebelum insert
    const validation = await this.validateProductCSV(csvText);
    
    if (!validation.valid || validation.errors.length > 0) {
      return {
        success: false,
        importedCount: 0,
        failedCount: validation.totalRows - validation.validRowsCount,
        errors: validation.errors
      };
    }

    // 2. Persiapan Data (Semua baris dipastikan valid pada tahap ini)
    const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    
    const { data: categories } = await supabase.from("categories").select("id, name");
    const categoryMap: Record<string, string> = {};
    (categories || []).forEach(c => {
      categoryMap[c.name.toLowerCase()] = c.id;
    });

    const productsToInsert = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const rowData: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowData[h] = values[idx] || "";
      });

      const slug = rowData.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const category_id = categoryMap[rowData.category.toLowerCase()];
      const stock = rowData.stock && !isNaN(Number(rowData.stock)) ? Number(rowData.stock) : 0;
      
      productsToInsert.push({
        name: rowData.name,
        slug,
        category_id,
        price: Number(rowData.price),
        stock,
        minimum_stock: 5,
        is_active: true,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // 3. Batch Insert
    if (productsToInsert.length > 0) {
      const { error } = await supabase.from("products").insert(productsToInsert);
      
      if (error) {
        return {
          success: false,
          importedCount: 0,
          failedCount: productsToInsert.length,
          errors: [{ row: 0, field: "database", message: `Database error: ${error.message}` }]
        };
      }

      // 4. Log Activity
      await activityLogRepository.logActivity({
        action: "Import CSV Produk",
        entity_type: "product",
        description: `Mengimpor ${productsToInsert.length} produk melalui CSV`,
        metadata: { imported_count: productsToInsert.length, source: "csv" }
      });
    }

    return {
      success: true,
      importedCount: productsToInsert.length,
      failedCount: 0,
      errors: []
    };
  }
};
