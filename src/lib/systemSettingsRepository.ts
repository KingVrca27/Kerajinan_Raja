/**
 * @file src/lib/systemSettingsRepository.ts
 * Repository pattern untuk System Settings (site_settings tabel) — FASE 4.5.2B
 *
 * Setting yang dikelola:
 *   - timezone
 *   - currency
 *   - date_format
 *   - tax_percentage
 *   - default_shipping_cost
 *   - maintenance_mode
 */

import { supabase } from "@/src/lib/supabase";
import { activityLogRepository } from "@/src/lib/activityLogRepository";

export interface SystemSetting {
  key: string;
  value: string;
  label: string;
  description?: string;
  type: "text" | "number" | "boolean" | "select" | "json";
}

export interface SystemSettingsData {
  timezone: string;
  currency: string;
  date_format: string;
  tax_percentage: number;
  default_shipping_cost: number;
  maintenance_mode: boolean;
}

const SETTING_KEYS = [
  "timezone",
  "currency",
  "date_format",
  "tax_percentage",
  "default_shipping_cost",
  "maintenance_mode",
] as const;

const DEFAULTS: SystemSettingsData = {
  timezone: "Asia/Jakarta",
  currency: "IDR",
  date_format: "DD/MM/YYYY",
  tax_percentage: 11,
  default_shipping_cost: 15000,
  maintenance_mode: false,
};

export const systemSettingsRepository = {
  /** Ambil semua system settings dari database */
  async getAll(): Promise<SystemSettingsData> {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [...SETTING_KEYS]);

    if (error) {
      console.error("[systemSettingsRepository.getAll]", error.message);
      return { ...DEFAULTS };
    }

    const result = { ...DEFAULTS };
    (data || []).forEach((row) => {
      const k = row.key as keyof SystemSettingsData;
      if (k === "maintenance_mode") {
        (result as Record<string, unknown>)[k] = row.value === "true";
      } else if (k === "tax_percentage" || k === "default_shipping_cost") {
        (result as Record<string, unknown>)[k] = parseFloat(row.value) || 0;
      } else {
        (result as Record<string, unknown>)[k] = row.value;
      }
    });

    return result;
  },

  /** Simpan satu setting */
  async saveSetting(
    key: keyof SystemSettingsData,
    value: string | number | boolean
  ): Promise<{ success: boolean; error?: string }> {
    const stringValue = String(value);

    const labelMap: Record<keyof SystemSettingsData, string> = {
      timezone: "Timezone",
      currency: "Mata Uang",
      date_format: "Format Tanggal",
      tax_percentage: "Persentase Pajak (%)",
      default_shipping_cost: "Ongkos Kirim Default (Rp)",
      maintenance_mode: "Maintenance Mode",
    };

    const { error } = await supabase.from("site_settings").upsert(
      {
        key,
        value: stringValue,
        label: labelMap[key] || key,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) return { success: false, error: error.message };

    await activityLogRepository.logActivity({
      action: "Update System Settings",
      entity_type: "settings",
      description: `Memperbarui pengaturan sistem: ${labelMap[key] || key}`,
      metadata: { setting_key: key },
    });

    return { success: true };
  },

  /** Simpan semua settings sekaligus */
  async saveAll(
    settings: Partial<SystemSettingsData>
  ): Promise<{ success: boolean; error?: string }> {
    const labelMap: Record<keyof SystemSettingsData, string> = {
      timezone: "Timezone",
      currency: "Mata Uang",
      date_format: "Format Tanggal",
      tax_percentage: "Persentase Pajak (%)",
      default_shipping_cost: "Ongkos Kirim Default (Rp)",
      maintenance_mode: "Maintenance Mode",
    };

    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
      label: labelMap[key as keyof SystemSettingsData] || key,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) return { success: false, error: error.message };

    const keys = Object.keys(settings);
    await activityLogRepository.logActivity({
      action: "Update System Settings",
      entity_type: "settings",
      description: `Memperbarui ${keys.length} pengaturan sistem sekaligus`,
      metadata: { keys },
    });

    return { success: true };
  },
};
